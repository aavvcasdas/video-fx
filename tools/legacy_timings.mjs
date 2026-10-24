// tools/legacy_timings.mjs — 把老版本里**人工写的字幕表**导出成标准时间轴
// ---------------------------------------------------------------------------
// 老模块（mv_pack_long / mv_pack_short / mv_chaoxi / mv_pengyou_de_jiu /
// mv_douyin_6 / mv_qunian_xiatian / mv_ba_huiyi_pinhao_gei_ni）里都带一份
// 手写字幕表，歌词文本是对的，只是时间粗糙（按小节拍估的）。
//
// 这份"对的文本"非常宝贵：OCR 只负责给出真实出现时刻，文本用这一份。
// 所以这里先把它们导出到 `src/timings/legacy/<key>.json`，
// 再由 `tools/merge_timings.py` 把"legacy 文本"和"OCR 时刻"对齐。
//
//   node tools/legacy_timings.mjs
// ---------------------------------------------------------------------------

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'src/timings/legacy');
fs.mkdirSync(OUT, { recursive: true });

const SHORT = require(path.join(ROOT, 'src/mv_pack_short.js'));
const LONG = require(path.join(ROOT, 'src/mv_pack_long.js'));
const CHAOXI = require(path.join(ROOT, 'src/mv_chaoxi.js'));
const PENGYOU = require(path.join(ROOT, 'src/mv_pengyou_de_jiu.js'));
const DOUYIN = require(path.join(ROOT, 'src/mv_douyin_6.js'));
const QUNIAN = require(path.join(ROOT, 'src/mv_qunian_xiatian.js'));
const PINHAO = require(path.join(ROOT, 'src/mv_ba_huiyi_pinhao_gei_ni.js'));

// short 包：{key: {duration, subs|lines}}
const SHORT_KEYS = {
  ba_huiyi_56: 'baHuiyi56',
  lianai_ing: 'lianaiIng',
  jimo_yanhuo: 'jimoYanhuo',
  xinqiang: 'xinqiang',
  ribuluo: 'ribuluo'
};

// 标题卡 / 版权卡 / 字幕说明：不是歌词，合并时丢掉
function isCaption(s, i, n) {
  const t = (s.zh || '');
  if (!t) return true;
  if (t.startsWith('>')) return true;            // 终端式旁白（如 "> 帮我运行 恋爱.ing"）
  if (/[✗✔√]/.test(t)) return true;             // 伪终端提示符
  if (t.endsWith('。')) return true;             // 句号结尾的是旁白，不是歌词
  if (i === 0 || i === n - 1) {
    if (t.includes(' · ')) return true;          // 首尾的"歌名 · 副标题"卡
  }
  if (t.includes('《') && t.includes('》')) return true;
  if (/^(词|曲|编曲|制作|演唱|翻唱)\s*[:：]/.test(t)) return true;
  if (/深海鲸鱼娘|像素剧场|记忆拼图|MV ·|字幕/.test(t)) return true;
  if ((s.t1 - s.t0) > 9) return true;   // 超过 9 秒的"行"一定是排版卡
  return false;
}

function norm(lines) {
  return (lines || [])
    .map((s) => ({ t0: +s.t0, t1: +s.t1, zh: String(s.zh || s.text || '').trim(), en: s.en }))
    .filter((s) => s.zh && s.t1 > s.t0 + 0.2);
}

const result = {};

function add(key, duration, lines, note) {
  const raw = norm(lines);
  const lyrics = raw.filter((s, i) => !isCaption(s, i, raw.length));
  if (lyrics.length < 3) return;
  result[key] = { key, duration, method: 'legacy-handwritten', note, lines: lyrics };
}

// ---- 5 部短片 -------------------------------------------------------------
for (const [key, id] of Object.entries(SHORT_KEYS)) {
  const pack = SHORT[id] || SHORT[key];
  if (!pack) { console.log('[miss] short', key, '→', id); continue; }
  add(key, pack.duration, pack.subs || pack.lines || pack.LYRICS, 'mv_pack_short.js');
}
// 有时 key 与 id 对不上，退一步用 key 直接找
for (const [key, pack] of Object.entries(SHORT)) {
  if (result[key]) continue;
  add(key, pack.duration, pack.subs || pack.lines, 'mv_pack_short.js#bykey');
}

// ---- 4 部长片 -------------------------------------------------------------
for (const [key, pack] of Object.entries(LONG)) {
  add(key, pack.duration, pack.subs, 'mv_pack_long.js');
}

// ---- 单曲模块 -------------------------------------------------------------
add('chaoxi', CHAOXI.DURATION, CHAOXI.SUBTITLES, 'src/mv_chaoxi.js');
add('pengyou_de_jiu', PENGYOU.DURATION, PENGYOU.SUBTITLES, 'src/mv_pengyou_de_jiu.js');
add('douyin_6', DOUYIN.DURATION, DOUYIN.SUBTITLES, 'src/mv_douyin_6.js');
add('qunian_xiatian', QUNIAN.DURATION, QUNIAN.SUBTITLES, 'src/mv_qunian_xiatian.js');
add('ba_huiyi_pinhao', PINHAO.DURATION, PINHAO.LYRICS, 'src/mv_ba_huiyi_pinhao_gei_ni.js');

for (const [key, data] of Object.entries(result)) {
  fs.writeFileSync(path.join(OUT, key + '.json'), JSON.stringify(data, null, 1));
  console.log(`[ok] ${key}: ${data.lines.length} 行歌词（来自 ${data.note}）`);
}
console.log('\n未导出（老模块里没有可用字幕表）：',
  ['ba_huiyi_56', 'lianai_ing', 'jimo_yanhuo', 'xinqiang', 'ribuluo',
    'chaoxi', 'pengyou_de_jiu', 'douyin_6', 'qunian_xiatian', 'ba_huiyi_pinhao',
    'huainvhai', 'feng', 'meiguihua', 'suyan'].filter((k) => !result[k]).join(', ') || '无');
