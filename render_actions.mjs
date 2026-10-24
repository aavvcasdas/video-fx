// render_actions.mjs — 动作库验收渲染器
// ---------------------------------------------------------------------------
// 1. `docs/whale_girl_actions_sheet.png`  32 动作 × 单帧总览（每格带动作名）
// 2. `docs/whale_girl_actions_strip.png`  单个动作的连续帧（验证动作连续、不穿模）
// 3. `whale_girl_actions_showcase.mp4`    32 个动作依次表演的 30fps 巡览片
//
//   node render_actions.mjs            # 全部
//   node render_actions.mjs sheet      # 只出总览图
//   node render_actions.mjs strip dance
//   node render_actions.mjs video
// ---------------------------------------------------------------------------

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.dirname(new URL(import.meta.url).pathname);

function loadCanvas() {
  const cands = ['@napi-rs/canvas', '/tmp/node_render/node_modules/@napi-rs/canvas', '/tmp/tools/node_modules/@napi-rs/canvas'];
  for (const c of cands) {
    try { return require(c); } catch (e) {}
  }
  throw new Error('未找到 @napi-rs/canvas，请先 npm i @napi-rs/canvas');
}
const { createCanvas, GlobalFonts } = loadCanvas();

function ffmpegPath() {
  const cands = [
    process.env.FFMPEG_PATH,
    '/tmp/tools/node_modules/@ffmpeg-installer/linux-x64/ffmpeg',
    '/tmp/venv/lib/python3.11/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2'
  ];
  for (const c of cands) if (c && fs.existsSync(c)) return c;
  try { return require('/tmp/tools/node_modules/@ffmpeg-installer/ffmpeg').path; } catch (e) { return 'ffmpeg'; }
}

for (const [f, n] of [
  ['ZCOOLKuaiLe-Regular.ttf', 'ZCOOLKuaiLe'],
  ['NotoSansSC-Bold.ttf', 'NotoSansSC'],
  ['Silkscreen-Regular.ttf', 'Silkscreen']
]) {
  const p = path.join(ROOT, 'assets/fonts', f);
  if (fs.existsSync(p)) GlobalFonts.registerFromPath(p, n);
}

globalThis.window = globalThis;
require(path.join(ROOT, 'src/core.js'));
require(path.join(ROOT, 'src/whale_girl_rig_data.js'));
require(path.join(ROOT, 'src/whale_girl.js'));
require(path.join(ROOT, 'src/cast.js'));
require(path.join(ROOT, 'src/actions.js'));
const ACTION_API = globalThis.ACT;

const W = 1280, H = 720;

function drawStage(ctx, name, t, def) {
  // 简洁的深海舞台（避免背景抢戏，专注看动作）
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0B1A33');
  g.addColorStop(0.62, '#102A4C');
  g.addColorStop(1, '#060C1A');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // 水底光柱
  for (let i = 0; i < 5; i++) {
    const x = 160 + i * 235 + Math.sin(t * 0.6 + i) * 18;
    const lg = ctx.createLinearGradient(x, 0, x + 70, H);
    lg.addColorStop(0, 'rgba(125, 211, 252, 0.16)');
    lg.addColorStop(1, 'rgba(125, 211, 252, 0)');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.moveTo(x - 40, 0);
    ctx.lineTo(x + 110, 0);
    ctx.lineTo(x + 190, H);
    ctx.lineTo(x + 10, H);
    ctx.closePath();
    ctx.fill();
  }
  // 气泡
  for (let b = 0; b < 26; b++) {
    const bx = ((b * 137 + t * 26) % (W + 80)) - 40;
    const by = H - ((b * 91 + t * 58) % (H + 60));
    ctx.fillStyle = `rgba(186, 230, 253, ${0.16 + (b % 4) * 0.05})`;
    ctx.beginPath();
    ctx.arc(bx, by, 3 + (b % 5), 0, Math.PI * 2);
    ctx.fill();
  }
  // 地面
  const fg = ctx.createLinearGradient(0, H - 130, 0, H);
  fg.addColorStop(0, 'rgba(14, 116, 144, 0.35)');
  fg.addColorStop(1, 'rgba(3, 20, 40, 0.9)');
  ctx.fillStyle = fg;
  ctx.fillRect(0, H - 130, W, 130);

  // 动作信息条
  ctx.fillStyle = 'rgba(2, 8, 23, 0.78)';
  ctx.beginPath();
  ctx.roundRect(28, 24, 470, 66, 14);
  ctx.fill();
  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#7DD3FC';
  ctx.font = 'bold 26px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${def.zh}`, 48, 58);
  ctx.font = 'bold 15px "Silkscreen", "NotoSansSC", monospace';
  ctx.fillStyle = '#FDE047';
  ctx.fillText(`${name.toUpperCase()} · ${def.cat} · ${def.loop ? 'LOOP' : 'ONESHOT'} ${def.dur.toFixed(1)}s`, 48, 80);
}

function renderActionCell(ctx, name, t, opts = {}) {
  const def = ACTION_API.ACTIONS[name];
  ctx.save();
  drawStage(ctx, name, t, def);
  ACTION_API.drawAction(ctx, opts.x || 640, opts.y || 600, opts.u || 34, name, t, {
    t,
    hat: opts.hat || 'maidHeadband',
    style: opts.style || 'watercolor',
    seed: 0
  });
  ctx.restore();
}

// ---------------------------------------------------------------------------
function renderSheet(out = path.join(ROOT, 'docs/whale_girl_actions_sheet.png')) {
  const names = ACTION_API.ACTION_LIST;
  const cols = 8, rows = Math.ceil(names.length / cols);
  const cw = 240, ch = 135;
  const sheet = createCanvas(cw * cols, ch * rows);
  const sctx = sheet.getContext('2d');
  const frame = createCanvas(W, H);
  const fctx = frame.getContext('2d');

  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const def = ACTION_API.ACTIONS[name];
    fctx.clearRect(0, 0, W, H);
    // 取动作进行到 55% 的那一帧（表演最充分的位置）
    renderActionCell(fctx, name, def.loop ? def.dur * 0.55 : def.dur * 0.5, { u: 34, y: 600 });
    const gx = (i % cols) * cw, gy = Math.floor(i / cols) * ch;
    sctx.drawImage(frame, 0, 0, W, H, gx, gy, cw, ch);
    sctx.fillStyle = 'rgba(2, 8, 23, 0.78)';
    sctx.fillRect(gx, gy + ch - 24, cw, 24);
    sctx.fillStyle = '#7DD3FC';
    sctx.font = 'bold 13px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
    sctx.textAlign = 'left';
    sctx.fillText(`${String(i + 1).padStart(2, '0')} ${def.zh}`, gx + 6, gy + ch - 7);
  }
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, sheet.toBuffer('image/png'));
  console.log(`动作总览图 → ${out} (${names.length} 个动作)`);
}

function renderStrip(name, out) {
  const def = ACTION_API.ACTIONS[name];
  if (!def) throw new Error(`未知动作: ${name}`);
  const cols = 6, rows = 3;
  const cw = 300, ch = 169;
  const sheet = createCanvas(cw * cols, ch * rows);
  const sctx = sheet.getContext('2d');
  const frame = createCanvas(W, H);
  const fctx = frame.getContext('2d');
  for (let i = 0; i < cols * rows; i++) {
    const t = (def.dur * i) / (cols * rows - 1) * (def.loop ? 1 : 1);
    fctx.clearRect(0, 0, W, H);
    renderActionCell(fctx, name, t, { u: 34, y: 600 });
    const gx = (i % cols) * cw, gy = Math.floor(i / cols) * ch;
    sctx.drawImage(frame, 0, 0, W, H, gx, gy, cw, ch);
    sctx.fillStyle = 'rgba(2, 8, 23, 0.8)';
    sctx.fillRect(gx + 4, gy + 4, 96, 20);
    sctx.fillStyle = '#FDE047';
    sctx.font = 'bold 12px "Silkscreen", monospace';
    sctx.fillText(`${t.toFixed(2)}s`, gx + 10, gy + 18);
  }
  const file = out || path.join(ROOT, `docs/whale_girl_action_strip_${name}.png`);
  fs.writeFileSync(file, sheet.toBuffer('image/png'));
  console.log(`动作连续帧 → ${file}`);
}

async function renderVideo(out = path.join(ROOT, 'whale_girl_actions_showcase.mp4')) {
  const FPS = 30;
  const names = ACTION_API.ACTION_LIST;
  const per = 2.0;                      // 每个动作 2 秒
  const total = names.length * per;
  const frames = Math.round(total * FPS);
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const ff = spawn(ffmpegPath(), [
    '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '26', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', out
  ], { stdio: ['pipe', 'ignore', 'ignore'] });

  for (let f = 0; f < frames; f++) {
    const t = f / FPS;
    const idx = Math.min(names.length - 1, Math.floor(t / per));
    const local = t - idx * per;
    ctx.clearRect(0, 0, W, H);
    renderActionCell(ctx, names[idx], local, { u: 34, y: 600 });
    // 进度点
    for (let i = 0; i < names.length; i++) {
      ctx.fillStyle = i === idx ? '#FDE047' : 'rgba(148, 163, 184, 0.35)';
      ctx.beginPath();
      ctx.arc(W - 30 - (names.length - 1 - i) * 14, 44, i === idx ? 4.5 : 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    if (!ff.stdin.write(canvas.data())) await new Promise((r) => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg ' + c)))));
  console.log(`动作巡览片 → ${out} (${total.toFixed(1)}s, ${frames} 帧)`);
}

const cmd = process.argv[2] || 'all';
if (cmd === 'sheet') renderSheet();
else if (cmd === 'strip') renderStrip(process.argv[3] || 'dance', process.argv[4]);
else if (cmd === 'video') await renderVideo();
else {
  renderSheet();
  renderStrip('dance');
  renderStrip('eat');
  await renderVideo();
}
