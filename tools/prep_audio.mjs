// tools/prep_audio.mjs — 从参考片 / 现有 mp3 抽音轨，统一放到 assets/mv_audio/
// ---------------------------------------------------------------------------
// 旧版 `render_mv_folder.mjs` 引用的 `assets/mv_audio/*.mp3` 从来没进过仓库，
// 于是 9 部 MV 其实根本渲染不出来。这个脚本把音轨一次性准备好：
//   * 参考片在 `mv/` 里的，直接抽它的音轨（与参考片逐帧对齐）
//   * 仓库根目录已有 mp3 的，直接复制
// 输出一律 44.1kHz / 立体声 / 192kbps mp3，保证 ffmpeg 合流稳定。
//
//   node tools/prep_audio.mjs           # 缺什么补什么
//   node tools/prep_audio.mjs --force   # 全部重新抽
// ---------------------------------------------------------------------------

import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

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

// key -> 音源（相对仓库根目录）
export const AUDIO_SOURCES = {
  ba_huiyi_56: 'mv/《把回忆拼好给你》.mp4',
  ba_huiyi_pinhao: '椰子水很甜 - 把回忆拼好给你（纯享Beat）.mp3',
  lianai_ing: 'mv/发现更多精彩视频 - 抖音搜索_2.mp4',
  jimo_yanhuo: 'mv/寂寞烟火.mp4',
  xinqiang: 'mv/心墙.mp4',
  ribuluo: 'mv/日不落.mp4',
  douyin_6: '每天每天的抖音 - 抖音_6.mp4',
  qunian_xiatian: '去年夏天.mp4',
  huainvhai: 'mv/坏女孩.mp4',
  feng: 'mv/枫.mp4',
  meiguihua: 'mv/玫瑰花的葬礼.mp4',
  suyan: 'mv/素颜1.mp4',
  chaoxi: '潮汐.MP3',
  pengyou_de_jiu: '朋友的酒.mp3'
};

function run(args) {
  return new Promise((res, rej) => {
    const ps = spawn(FFMPEG, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    ps.stderr.on('data', (d) => { err += d.toString(); });
    ps.on('close', (c) => (c === 0 ? res() : rej(new Error(err.slice(-400)))));
  });
}

const force = process.argv.includes('--force');
fs.mkdirSync(path.join(ROOT, 'assets/mv_audio'), { recursive: true });

let made = 0, skipped = 0;
for (const [key, src] of Object.entries(AUDIO_SOURCES)) {
  const input = path.join(ROOT, src);
  const out = path.join(ROOT, 'assets/mv_audio', key + '.mp3');
  if (!fs.existsSync(input)) {
    console.log(`[skip] ${key}: 找不到音源 ${src}`);
    skipped++;
    continue;
  }
  if (fs.existsSync(out) && !force) {
    console.log(`[ok  ] ${key}: 已存在 assets/mv_audio/${key}.mp3`);
    skipped++;
    continue;
  }
  await run(['-y', '-hide_banner', '-loglevel', 'error', '-i', input,
    '-vn', '-ac', '2', '-ar', '44100', '-b:a', '192k', out]);
  const mb = (fs.statSync(out).size / 1048576).toFixed(2);
  console.log(`[make] ${key}: ${src} → assets/mv_audio/${key}.mp3 (${mb} MB)`);
  made++;
}
console.log(`\n完成：新建 ${made} 个音轨，跳过 ${skipped} 个。`);
