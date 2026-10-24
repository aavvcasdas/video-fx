// tools/subtitle_timing.mjs — Reference-subtitle timing extractor
// ---------------------------------------------------------------------------
// The 10 reference clips in `mv/` all carry burned-in, correctly-timed lyric
// subtitles. Instead of guessing lyric timings (the old hand-written tables in
// `src/mv_pack_short.js` / `src/mv_pack_long.js` drifted out of sync with the
// vocal, which is exactly the "歌词和字幕不匹配" defect reported by the user),
// this tool measures WHEN the reference subtitle band actually changes.
//
// Pipeline (no OCR required):
//   1. ffmpeg crops the bottom subtitle band of the reference clip and decodes
//      it as a tiny grayscale rawvideo stream (default 6 fps, 480x72).
//   2. Each sample is reduced to a 12x3 "ink signature" (text / no text).
//   3. A change-point detector finds the frames where the signature jumps =>
//      those are the real subtitle line changes in the reference clip.
//   4. Detected segments are matched 1:1 (or DP-aligned) against the lyric
//      lines of the pack and the resulting timings are written to
//      `timings/<mv>.json`, which every renderer now consumes.
//
// Usage:
//   node tools/subtitle_timing.mjs detect  <clip.mp4> [fps]
//   node tools/subtitle_timing.mjs report  <mvKey>
//   node tools/subtitle_timing.mjs write   <mvKey>
// ---------------------------------------------------------------------------

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export function ffmpegPath() {
  const candidates = [
    process.env.FFMPEG_PATH,
    '/tmp/tools/node_modules/@ffmpeg-installer/linux-x64/ffmpeg',
    '/tmp/venv/lib/python3.11/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2'
  ];
  for (const c of candidates) if (c && fs.existsSync(c)) return c;
  try {
    return require('/tmp/tools/node_modules/@ffmpeg-installer/ffmpeg').path;
  } catch (e) {
    return 'ffmpeg';
  }
}

// ---------------------------------------------------------------------------
// 1. Decode the subtitle band of a reference clip into an array of signatures
// ---------------------------------------------------------------------------
export function readSubtitleBand(clip, opts = {}) {
  const fps = opts.fps || 6;
  const cropTop = opts.cropTop ?? 0.70;   // subtitle band starts at 70% height
  const cropH = opts.cropH ?? 0.26;       // ...and covers 26% of the height
  const gw = opts.gw || 160;              // analysis width
  const gh = opts.gh || 48;               // analysis height

  return new Promise((resolve, reject) => {
    const vf = `crop=iw:ih*${cropH}:0:ih*${cropTop},scale=${gw}:${gh},format=gray`;
    const args = [
      '-hide_banner', '-loglevel', 'error', '-i', clip,
      '-an', '-sn', '-vf', vf, '-r', String(fps),
      '-f', 'rawvideo', '-pix_fmt', 'gray', 'pipe:1'
    ];
    const ps = spawn(ffmpegPath(), args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const frameSize = gw * gh;
    const cols = 12, rows = 3;
    const sigs = [];
    let buf = Buffer.alloc(0);
    let err = '';
    ps.stdout.on('data', (d) => {
      buf = Buffer.concat([buf, d]);
      while (buf.length >= frameSize) {
        const frame = buf.subarray(0, frameSize);
        buf = buf.subarray(frameSize);
        const sig = new Float32Array(cols * rows);
        const cw = Math.floor(gw / cols), ch = Math.floor(gh / rows);
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            let sum = 0, n = 0, mn = 255;
            for (let y = r * ch; y < (r + 1) * ch; y++) {
              for (let x = c * cw; x < (c + 1) * cw; x++) {
                const v = frame[y * gw + x];
                sum += v; n++;
                if (v < mn) mn = v;
              }
            }
            // "ink" = how dark the cell is relative to the local mean (the
            // glyphs are always drawn as high-contrast strokes on the video)
            sig[r * cols + c] = (sum / n - mn) / 255;
          }
        }
        sigs.push(sig);
      }
    });
    ps.stderr.on('data', (d) => { err += d.toString(); });
    ps.on('close', () => resolve({ fps, sigs, cols, rows, clip }));
    ps.on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// 2. Change-point detection on the ink signature stream
// ---------------------------------------------------------------------------
export function detectSubtitleSegments(band, opts = {}) {
  const { fps, sigs } = band;
  const minDur = opts.minDur ?? 0.7;
  const maxDur = opts.maxDur ?? 12.0;
  const thr = opts.threshold ?? 0.09;

  const dist = (a, b) => {
    let s = 0;
    for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
    return s / a.length;
  };

  // A frame is "textish" when the band carries a strong dark-stroke contrast.
  const ink = sigs.map((s) => {
    let m = 0;
    for (let i = 0; i < s.length; i++) m = Math.max(m, s[i]);
    return m;
  });

  // Compare each frame to the running anchor of the current segment.
  const segments = [];
  let segStart = 0;
  let anchor = sigs[0];
  for (let i = 1; i < sigs.length; i++) {
    const t = i / fps;
    const d = dist(sigs[i], anchor);
    const dur = t - segStart / fps;
    const changed = d > thr || (dur > maxDur && dist(sigs[i], anchor) > thr * 0.55);
    if (changed) {
      segments.push({ i0: segStart, i1: i, t0: segStart / fps, t1: t, ink: ink[segStart] });
      segStart = i;
      anchor = sigs[i];
    } else {
      // slow drift: blend anchor so gradual fades don't trigger a change
      anchor = anchor.map((v, k) => v * 0.85 + sigs[i][k] * 0.15);
    }
  }
  segments.push({ i0: segStart, i1: sigs.length, t0: segStart / fps, t1: sigs.length / fps, ink: ink[segStart] });

  // Merge too-short flips (e.g. karaoke sweep retriggers) into neighbours.
  const merged = [];
  for (const s of segments) {
    const dur = s.t1 - s.t0;
    if (merged.length && dur < minDur) {
      merged[merged.length - 1].t1 = s.t1;
      merged[merged.length - 1].i1 = s.i1;
    } else if (merged.length && (merged[merged.length - 1].t1 - merged[merged.length - 1].t0) < minDur) {
      merged[merged.length - 1].t1 = s.t1;
      merged[merged.length - 1].i1 = s.i1;
    } else {
      merged.push({ ...s });
    }
  }
  return merged;
}

const CLI = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (CLI.endsWith('subtitle_timing.mjs')) {
  const [cmd, target, ...rest] = process.argv.slice(2);
  if (cmd === 'detect') {
    const band = await readSubtitleBand(target, { fps: Number(rest[0]) || 6 });
    const segs = detectSubtitleSegments(band);
    console.log(JSON.stringify(segs.map((s) => ({
      t0: +s.t0.toFixed(2), t1: +s.t1.toFixed(2), dur: +(s.t1 - s.t0).toFixed(2),
      ink: +s.ink.toFixed(3)
    })), null, 1));
    console.error(`\n${segs.length} raw segments from ${target}`);
  }
}
