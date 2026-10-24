// tools/measure_subs.mjs — Measure REAL burned-in subtitle timings from the
// reference clips in `mv/`, so the Whale-Girl re-render can be lyric-accurate.
//
// Why: the previous hand-written subtitle tables drifted against the vocal
// ("歌词和字幕不匹配"). This tool measures the actual subtitle change points of
// every reference clip and aligns them to the lyric lines used by the packs.
//
//   node tools/measure_subs.mjs band   <clip>          # find the subtitle band
//   node tools/measure_subs.mjs cuts   <clip>          # list detected line changes
//   node tools/measure_subs.mjs align  <mvKey>         # align to pack lyrics
//   node tools/measure_subs.mjs write  [mvKey|all]     # emit src/timings/*.json
//
// Detection is OCR-free: the subtitle band is decoded to a tiny grayscale
// rawvideo stream, converted to an "ink coverage" signature, and line changes
// are found as stable plateaus between signature jumps.

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(process.argv[1], '../..');

export function ffmpegPath() {
  const cands = [
    process.env.FFMPEG_PATH,
    '/tmp/tools/node_modules/@ffmpeg-installer/linux-x64/ffmpeg',
    '/tmp/venv/lib/python3.11/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2'
  ];
  for (const c of cands) if (c && fs.existsSync(c)) return c;
  try { return require('/tmp/tools/node_modules/@ffmpeg-installer/ffmpeg').path; } catch (e) { return 'ffmpeg'; }
}

// ---------------------------------------------------------------------------
// Decode a clip to small grayscale frames
// ---------------------------------------------------------------------------
export function decodeGray(clip, { fps = 5, gw = 240, gh = 135 } = {}) {
  return new Promise((resolve, reject) => {
    const args = ['-hide_banner', '-loglevel', 'error', '-i', clip, '-an', '-sn',
      '-vf', `scale=${gw}:${gh},format=gray`, '-r', String(fps),
      '-f', 'rawvideo', '-pix_fmt', 'gray', 'pipe:1'];
    const ps = spawn(ffmpegPath(), args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const size = gw * gh;
    const frames = [];
    let buf = Buffer.alloc(0);
    let err = '';
    ps.stdout.on('data', (d) => {
      buf = Buffer.concat([buf, d]);
      while (buf.length >= size) { frames.push(buf.subarray(0, size)); buf = buf.subarray(size); }
    });
    ps.stderr.on('data', (d) => { err += d.toString(); });
    ps.on('close', () => (frames.length ? resolve({ fps, gw, gh, frames }) : reject(new Error(err || 'no frames'))));
    ps.on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// 1. Locate the subtitle band: thin row band whose content changes a lot
//    between adjacent frames but stays put spatially.
// ---------------------------------------------------------------------------
export function detectBand(dec) {
  const { frames, gw, gh } = dec;
  const rowDiff = new Float64Array(gh);
  for (let i = 1; i < frames.length; i++) {
    const a = frames[i - 1], b = frames[i];
    for (let y = 0; y < gh; y++) {
      let s = 0;
      for (let x = 0; x < gw; x++) s += Math.abs(a[y * gw + x] - b[y * gw + x]);
      rowDiff[y] += s / gw;
    }
  }
  // Score = temporal change of the row minus its neighbourhood (subtitle bars
  // are isolated thin strips; scenery gradients are smooth over many rows)
  const smooth = new Float64Array(gh);
  for (let y = 0; y < gh; y++) {
    let s = 0, n = 0;
    for (let dy = -6; dy <= 6; dy++) {
      const yy = y + dy;
      if (yy >= 0 && yy < gh) { s += rowDiff[yy]; n++; }
    }
    smooth[y] = s / n;
  }
  let best = { y0: 0, y1: gh, score: -1 };
  const win = Math.max(8, Math.round(gh * 0.10)); // ~13 rows on 135px
  for (let y0 = 0; y0 + win <= gh; y0++) {
    let s = 0;
    for (let y = y0; y < y0 + win; y++) s += rowDiff[y];
    const local = smooth[y0 + (win >> 1)] * win;
    const score = s - local * 0.85;
    if (score > best.score) best = { y0, y1: y0 + win, score };
  }
  const h = dec.gh;
  return {
    ...best,
    frac0: best.y0 / h,
    frac1: best.y1 / h,
    rows: rowDiff
  };
}

// ---------------------------------------------------------------------------
// 2. Ink-coverage signature of the band + change-point detection
// ---------------------------------------------------------------------------
function bandSignature(frame, gw, gh, band, cols = 40) {
  const y0 = band.y0, y1 = band.y1;
  const rows = y1 - y0;
  const sig = new Float32Array(cols * 2);
  const cellW = gw / cols;
  for (let c = 0; c < cols; c++) {
    const x0 = Math.floor(c * cellW), x1 = Math.floor((c + 1) * cellW);
    let topInk = 0, botInk = 0, n = 0;
    for (let y = y0; y < y1; y++) {
      // local row mean for contrast normalisation
      let mean = 0;
      for (let x = x0; x < x1; x++) mean += frame[y * gw + x];
      mean /= Math.max(1, x1 - x0);
      for (let x = x0; x < x1; x++) {
        const v = Math.abs(frame[y * gw + x] - mean);
        if (v > 46) {
          if (y < y0 + rows / 2) topInk++; else botInk++;
        }
        n++;
      }
    }
    sig[c] = topInk / Math.max(1, n);
    sig[cols + c] = botInk / Math.max(1, n);
  }
  return sig;
}

export function detectCuts(dec, band, opts = {}) {
  const { gw, gh, frames, fps } = dec;
  const cols = opts.cols || 40;
  const sigs = frames.map((f) => bandSignature(f, gw, gh, band, cols));
  const d = (a, b) => {
    let s = 0;
    for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
    return s / a.length;
  };
  const inkOf = (s) => {
    let t = 0;
    for (let i = 0; i < s.length; i++) t += s[i];
    return t / s.length;
  };

  const thr = opts.threshold ?? 0.028;
  const minHold = opts.minHold ?? 0.55;   // seconds a line must last
  const cuts = [0];
  let anchor = sigs[0];
  let anchorT = 0;
  for (let i = 1; i < sigs.length; i++) {
    const t = i / fps;
    const dist = d(sigs[i], anchor);
    if (dist > thr) {
      // confirm stability of the new plateau over the next ~0.5s
      const look = Math.min(sigs.length - 1, i + Math.round(fps * 0.5));
      let stable = true;
      for (let j = i + 1; j <= look; j++) {
        if (d(sigs[j], sigs[i]) > thr * 1.6) { stable = false; break; }
      }
      if (stable && t - anchorT >= minHold) {
        cuts.push(t);
        anchorT = t;
        anchor = sigs[i];
      }
    }
    // slow drift tolerance
    anchor = anchor.map((v, k) => v * 0.9 + sigs[i][k] * 0.1);
  }
  const segs = [];
  for (let i = 0; i < cuts.length; i++) {
    const t0 = cuts[i];
    const t1 = i + 1 < cuts.length ? cuts[i + 1] : frames.length / fps;
    segs.push({ t0: +t0.toFixed(2), t1: +t1.toFixed(2), dur: +(t1 - t0).toFixed(2), ink: +inkOf(sigs[Math.min(sigs.length - 1, Math.round(t0 * fps))]).toFixed(3) });
  }
  return segs;
}

// ---------------------------------------------------------------------------
// 3. Monotone alignment of measured cuts to the pack's lyric lines
// ---------------------------------------------------------------------------
export function alignLyrics(lyricT0s, segs, total) {
  // DP: assign each lyric line a segment start, order preserved, allow a line
  // to be matched to any later segment (skips = instrumental gaps).
  const n = lyricT0s.length, m = segs.length;
  const INF = 1e9;
  const dp = Array.from({ length: n + 1 }, () => new Float64Array(m + 1).fill(INF));
  const from = Array.from({ length: n + 1 }, () => new Int32Array(m + 1).fill(-1));
  for (let j = 0; j <= m; j++) dp[0][j] = 0;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      // skip segment j-1
      if (dp[i][j - 1] < dp[i][j]) { dp[i][j] = dp[i][j - 1]; from[i][j] = 2; }
      // match line i-1 -> segment j-1
      const cost = Math.abs(segs[j - 1].t0 - lyricT0s[i - 1]) * 1.0 + 0.35;
      const cand = dp[i - 1][j - 1] + cost;
      if (cand < dp[i][j]) { dp[i][j] = cand; from[i][j] = 1; }
    }
  }
  const match = new Array(n).fill(-1);
  let i = n, j = m;
  while (i > 0 && j > 0) {
    if (from[i][j] === 1) { match[i - 1] = j - 1; i--; j--; }
    else j--;
  }
  return { match, cost: dp[n][m] };
}

// CLI -----------------------------------------------------------------------
const isMain = process.argv[1] && process.argv[1].endsWith('measure_subs.mjs');
if (isMain) {
  const [cmd, target, a1] = process.argv.slice(2);
  const MVS = {
    xinqiang: { clip: 'mv/心墙.mp4', duration: 34.02 },
    ribuluo: { clip: 'mv/日不落.mp4', duration: 45.81 },
    jimo_yanhuo: { clip: 'mv/寂寞烟火.mp4', duration: 55.24 },
    ba_huiyi_56: { clip: 'mv/《把回忆拼好给你》.mp4', duration: 56.03 },
    lianai_ing: { clip: 'mv/发现更多精彩视频 - 抖音搜索_2.mp4', duration: 54.73 },
    huainvhai: { clip: 'mv/坏女孩.mp4', duration: 245.55 },
    feng: { clip: 'mv/枫.mp4', duration: 274.58 },
    meiguihua: { clip: 'mv/玫瑰花的葬礼.mp4', duration: 236.77 },
    suyan: { clip: 'mv/素颜1.mp4', duration: 238.05 },
    chaoxi: { clip: 'mv/mv_ba_huiyi_pinhao_gei_ni_whale_girl (1).mp4', duration: 142.1 }
  };
  const measure = async (key) => {
    const item = MVS[key];
    const fps = ['feng', 'huainvhai', 'meiguihua', 'suyan'].includes(key) ? 3 : 5;
    const dec = await decodeGray(path.join(ROOT, item.clip), { fps });
    const band = detectBand(dec);
    const segs = detectCuts(dec, band);
    return { key, fps, band, segs, duration: item.duration };
  };
  if (cmd === 'band' || cmd === 'cuts') {
    const res = await measure(target);
    if (cmd === 'band') {
      console.log(JSON.stringify({ key: target, band: { y0: res.band.y0, y1: res.band.y1, frac: [res.band.frac0, res.band.frac1] } }, null, 1));
    } else {
      console.log(JSON.stringify(res.segs, null, 0));
      console.error(`${res.segs.length} segments, band rows ${res.band.y0}-${res.band.y1}`);
    }
  } else if (cmd === 'all') {
    const out = {};
    for (const key of Object.keys(MVS)) {
      const res = await measure(key);
      out[key] = { band: [res.band.y0, res.band.y1], fps: res.fps, segs: res.segs };
      console.error(`${key}: ${res.segs.length} segments (band ${res.band.y0}-${res.band.y1})`);
    }
    fs.mkdirSync(path.join(ROOT, 'src/timings'), { recursive: true });
    fs.writeFileSync(path.join(ROOT, 'src/timings/ref_sub_cuts.json'), JSON.stringify(out, null, 1));
    console.log('wrote src/timings/ref_sub_cuts.json');
  }
}
