// render_mv_v2.mjs — 统一 MV 渲染器（Shot-Pack v2）
// ---------------------------------------------------------------------------
// 用法：
//   node render_mv_v2.mjs all                # 渲染全部 14 部
//   node render_mv_v2.mjs xinqiang           # 只渲染一部
//   node render_mv_v2.mjs sheet all          # 只出分镜缩略图
//   node render_mv_v2.mjs check xinqiang     # 字幕对拍：本片 vs 参考片同秒帧
//   node render_mv_v2.mjs stats              # 质量报告 docs/MV_QUALITY_REPORT.md
//
// 产物：
//   mv_<key>_whale_girl.mp4            成片（复用原文件名，直接覆盖旧版）
//   docs/storyboard_<key>.png          20 格分镜缩略图
//   docs/subcheck_<key>.png            字幕对拍图（左：本片 / 右：参考片）
//   docs/MV_QUALITY_REPORT.md          每部片子的布景/动作/镜头统计
// ---------------------------------------------------------------------------

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.dirname(new URL(import.meta.url).pathname);

function loadCanvas() {
  for (const c of ['@napi-rs/canvas', '/tmp/node_render/node_modules/@napi-rs/canvas', '/tmp/tools/node_modules/@napi-rs/canvas']) {
    try { return require(c); } catch (e) {}
  }
  throw new Error('缺少 @napi-rs/canvas');
}
const { createCanvas, GlobalFonts, loadImage } = loadCanvas();

function ffmpegPath() {
  const cands = [
    process.env.FFMPEG_PATH,
    '/tmp/tools/node_modules/@ffmpeg-installer/linux-x64/ffmpeg',
    '/tmp/venv/lib/python3.11/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2'
  ];
  for (const c of cands) if (c && fs.existsSync(c)) return c;
  try { return require('/tmp/tools/node_modules/@ffmpeg-installer/ffmpeg').path; } catch (e) { return 'ffmpeg'; }
}
const FFMPEG = ffmpegPath();

for (const [f, n] of [
  ['ZCOOLKuaiLe-Regular.ttf', 'ZCOOLKuaiLe'],
  ['NotoSansSC-Bold.ttf', 'NotoSansSC'],
  ['Silkscreen-Regular.ttf', 'Silkscreen'],
  ['PixelifySans-Medium.ttf', 'PixelifySans']
]) {
  const p = path.join(ROOT, 'assets/fonts', f);
  if (fs.existsSync(p)) GlobalFonts.registerFromPath(p, n);
}

globalThis.window = globalThis;
require(path.join(ROOT, 'src/core.js'));
require(path.join(ROOT, 'src/whale_girl_rig_data.js'));
require(path.join(ROOT, 'src/whale_girl.js'));
require(path.join(ROOT, 'src/clawd.js'));
require(path.join(ROOT, 'src/cast.js'));
require(path.join(ROOT, 'src/actions.js'));
require(path.join(ROOT, 'src/sets.js'));
require(path.join(ROOT, 'src/shotlib.js'));
require(path.join(ROOT, 'src/mv_packs_v2.js'));

const SHOT = globalThis.SHOT;
const PACKS = globalThis.MV_PACKS_V2;
const W = 1280, H = 720;

// 短片 15fps，长片 12fps（本画风是"手绘 12fps boil"，12fps 反而更自然，
// 同时把 14 部片子的总渲染时间压到可接受范围）
const FPS = {
  ba_huiyi_56: 15, lianai_ing: 15, jimo_yanhuo: 15, xinqiang: 15, ribuluo: 15,
  douyin_6: 15, qunian_xiatian: 15, ba_huiyi_pinhao: 15, chaoxi: 15,
  huainvhai: 12, feng: 12, meiguihua: 12, suyan: 12, pengyou_de_jiu: 12
};

function makePlan(key) {
  const pl = PACKS.makePlan(key);
  const def = PACKS.PACKS[key];
  pl.duration = def.duration;
  return pl;
}

// ---------------------------------------------------------------------------
function renderSheet(key, out) {
  const pl = makePlan(key);
  const cols = 5, rows = 4;
  const tw = 300, th = 169;
  const sheet = createCanvas(cols * tw, rows * th);
  const sctx = sheet.getContext('2d');
  const frame = createCanvas(W, H);
  const fctx = frame.getContext('2d');
  const n = pl.shots.length;
  for (let i = 0; i < cols * rows; i++) {
    const s = pl.shots[Math.min(n - 1, i)];
    const t = s.t0 + (s.t1 - s.t0) * 0.45;
    fctx.clearRect(0, 0, W, H);
    SHOT.render(fctx, pl, t, { accent: PACKS.PACKS[key].accent, tag: def_tag(key) });
    const gx = (i % cols) * tw, gy = Math.floor(i / cols) * th;
    sctx.drawImage(frame, 0, 0, W, H, gx, gy, tw, th);
    sctx.fillStyle = 'rgba(3,7,18,0.82)';
    sctx.fillRect(gx, gy + th - 20, tw, 20);
    sctx.fillStyle = '#7DD3FC';
    sctx.font = 'bold 11px "Silkscreen","ZCOOLKuaiLe",monospace';
    sctx.fillText(`${t.toFixed(1)}s ${s.set}/${s.action}/${s.cam}`, gx + 5, gy + th - 6);
  }
  // 未用满的格子写标题
  for (let i = n; i < cols * rows; i++) {
    const gx = (i % cols) * tw, gy = Math.floor(i / cols) * th;
    sctx.drawImage(frame, 0, 0, W, H, gx, gy, tw, th);
    sctx.fillStyle = 'rgba(3,7,18,0.85)';
    sctx.fillRect(gx, gy, tw, th);
    sctx.fillStyle = '#7DD3FC';
    sctx.font = 'bold 16px "ZCOOLKuaiLe","NotoSansSC",sans-serif';
    sctx.fillText(`${n} 个镜头`, gx + 16, gy + th / 2);
  }
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, sheet.toBuffer('image/png'));
  console.log(`分镜缩略图 → ${path.relative(ROOT, out)} (${n} 个镜头)`);
}

function def_tag(key) {
  return PACKS.PACKS[key] ? PACKS.PACKS[key].title : key;
}

// ---------------------------------------------------------------------------
function grabFrame(clip, t, outFile) {
  return new Promise((res, rej) => {
    const ps = spawn(FFMPEG, [
      '-y', '-hide_banner', '-loglevel', 'error', '-ss', String(t),
      '-i', path.join(ROOT, clip), '-frames:v', '1', '-vf', 'scale=1280:720', outFile
    ]);
    ps.on('close', (c) => (c === 0 && fs.existsSync(outFile) ? res() : rej(new Error('grab failed'))));
  });
}

async function renderSubcheck(key, out) {
  const pl = makePlan(key);
  const info = PACKS.AUDIO[key];
  if (!info || !info.clip) {
    console.log(`subcheck: ${key} 没有参考片，跳过`);
    return;
  }
  // 取 6 个时间点，左右并排：左=本片，右=参考片
  const times = [];
  for (let i = 0; i < 6; i++) {
    const s = pl.shots[Math.min(pl.shots.length - 1, Math.floor((i + 0.5) * pl.shots.length / 6))];
    times.push(s.t0 + (s.t1 - s.t0) * 0.45);
  }
  const cw = 640, chh = 360;
  const sheet = createCanvas(cw * 2, chh * times.length);
  const sctx = sheet.getContext('2d');
  const cur = createCanvas(W, H);
  const cctx = cur.getContext('2d');
  const tmp = path.join('/tmp', `subcheck_${key}`);
  fs.mkdirSync(tmp, { recursive: true });
  for (let i = 0; i < times.length; i++) {
    const t = times[i];
    cctx.clearRect(0, 0, W, H);
    SHOT.render(cctx, pl, t, { accent: PACKS.PACKS[key].accent });
    sctx.drawImage(cur, 0, 0, W, H, 0, i * chh, cw, chh);
    const refFile = path.join(tmp, `ref_${i}.png`);
    try {
      await grabFrame(info.clip, t, refFile);
      const img = await loadImage(refFile);
      sctx.drawImage(img, cw, i * chh, cw, chh);
    } catch (e) { /* 忽略 */ }
    sctx.fillStyle = 'rgba(0,0,0,0.7)';
    sctx.fillRect(0, i * chh, 190, 22);
    sctx.fillRect(cw, i * chh, 190, 22);
    sctx.fillStyle = '#FDE047';
    sctx.font = 'bold 14px "ZCOOLKuaiLe","NotoSansSC",sans-serif';
    sctx.fillText(`本片 @ ${t.toFixed(1)}s`, 8, i * chh + 16);
    sctx.fillText(`参考片 @ ${t.toFixed(1)}s`, cw + 8, i * chh + 16);
  }
  fs.writeFileSync(out, sheet.toBuffer('image/png'));
  console.log(`字幕对拍图 → ${path.relative(ROOT, out)}`);
}

// ---------------------------------------------------------------------------
async function renderVideo(key, outFile) {
  const pl = makePlan(key);
  const info = PACKS.AUDIO[key];
  const fps = FPS[key] || 24;
  const duration = PACKS.PACKS[key].duration;
  const totalFrames = Math.ceil(duration * fps);
  const out = outFile ? path.join(ROOT, outFile) : path.join(ROOT, PACKS.OUT[key]);
  const audio = resolveAudio(info);
  if (!audio) throw new Error('缺少音频: ' + key);

  const args = [
    '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(fps), '-i', '-',
    '-i', audio, '-map', '0:v:0', '-map', '1:a:0',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '27', '-maxrate', '520k', '-bufsize', '1040k',
    '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', out
  ];
  const ff = spawn(FFMPEG, args, { stdio: ['pipe', 'ignore', 'ignore'] });
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const t0 = Date.now();
  for (let f = 0; f < totalFrames; f++) {
    const t = f / fps;
    ctx.clearRect(0, 0, W, H);
    SHOT.render(ctx, pl, t, { accent: PACKS.PACKS[key].accent, tag: def_tag(key) });
    SHOT.drawBeatBar(ctx, t, duration, PACKS.PACKS[key].accent);
    if (!ff.stdin.write(canvas.data())) await new Promise((r) => ff.stdin.once('drain', r));
    if ((f + 1) % 900 === 0) {
      const el = ((Date.now() - t0) / 1000).toFixed(0);
      console.log(`  ${key} ${f + 1}/${totalFrames} (${el}s)`);
    }
  }
  ff.stdin.end();
  const code = await new Promise((res) => ff.on('close', res));
  if (code !== 0) throw new Error(`ffmpeg 退出码 ${code} (${key})`);
  const mb = (fs.statSync(out).size / 1048576).toFixed(2);
  console.log(`[OK] ${path.basename(out)} · ${duration}s @ ${fps}fps · ${mb} MB · ${pl.shots.length} 镜头 · ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}

// ---------------------------------------------------------------------------
function writeReport(out) {
  const keys = Object.keys(PACKS.PACKS);
  const rows = [];
  for (const k of keys) {
    const pl = makePlan(k);
    const st = SHOT.stats(pl);
    const lines = pl.shots.reduce((acc, s) => { acc.add(s.line); return acc; }, new Set()).size;
    rows.push({ ...st, lyricLines: lines, title: PACKS.PACKS[k].title });
  }
  const md = [];
  md.push('# MV 质量报告（Shot-Pack v2）\n');
  md.push('> 由 `node render_mv_v2.mjs stats` 自动生成。判断标准：同一部片子里');
  md.push('> **镜头数 / 独立布景数 / 独立动作数** 越多，画面越不重复；');
  md.push('> 相邻镜头动作或布景重复（`adjSame`）应为 0。\n');
  md.push('| MV | 时长 | 歌词句 | 镜头 | 独立布景 | 独立动作 | 机位 | 相邻重复动作 | 相邻重复布景 |');
  md.push('|:--|--:|--:|--:|--:|--:|--:|--:|--:|');
  for (const r of rows) {
    md.push(`| ${r.title} | ${r.duration}s | ${r.lyricLines} | ${r.shots} | ${r.uniqueSets} | ${r.uniqueActions} | ${r.uniqueCams} | ${r.adjacentSameAction} | ${r.adjacentSameSet} |`);
  }
  md.push('\n## 各片布景 / 动作清单\n');
  for (const r of rows) {
    md.push(`### ${r.title}\n`);
    md.push(`- 布景（${r.uniqueSets}）：${r.sets.join('、')}`);
    md.push(`- 动作（${r.uniqueActions}）：${r.actions.join('、')}\n`);
  }
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, md.join('\n'));
  console.log('质量报告 →', path.relative(ROOT, out));
  console.log(md.slice(5, 5 + rows.length + 3).join('\n'));
}

// ---------------------------------------------------------------------------
const cmd = process.argv[2] || 'all';
const target = process.argv[3];
const allKeys = Object.keys(PACKS.PACKS);
const keys = !target || target === 'all' ? allKeys : [target];

if (cmd === 'stats') {
  writeReport(path.join(ROOT, 'docs/MV_QUALITY_REPORT.md'));
} else if (cmd === 'sheet') {
  for (const k of keys) {
    renderSheet(k, path.join(ROOT, `docs/storyboard_${k}.png`));
  }
} else if (cmd === 'check') {
  for (const k of keys) {
    await renderSubcheck(k, path.join(ROOT, `docs/subcheck_${k}.png`));
  }
} else if (cmd === 'all' || cmd === 'one') {
  for (const k of keys) {
    const info = PACKS.AUDIO[k];
    if (!letAudioExists(info)) {
      console.log(`skip ${k}: 缺少音频`);
      continue;
    }
    renderSheet(k, path.join(ROOT, `docs/storyboard_${k}.png`));
    await renderVideo(k);
  }
  writeReport(path.join(ROOT, 'docs/MV_QUALITY_REPORT.md'));
} else {
  console.log('未知命令:', cmd);
}

function resolveAudio(info) {
  for (const f of info.files || []) {
    const p = path.join(ROOT, f);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function letAudioExists(info) {
  return !!resolveAudio(info);
}
