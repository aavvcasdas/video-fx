/*
 * Abyssal Beat MV
 * An original, deterministic canvas music-video study. The 320 × 180 stage is
 * intentionally rendered small and nearest-neighbour scaled by CSS.
 */

const STAGE_W = 320;
const STAGE_H = 180;
const DURATION = 48;
const BPM = 124;
const BEAT = 60 / BPM;

const stage = document.querySelector('#mvCanvas');
const ctx = stage.getContext('2d');
const characterCanvas = document.querySelector('#characterCanvas');
const characterCtx = characterCanvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
characterCtx.imageSmoothingEnabled = false;

// User-supplied source-video poses. These are segmented directly from
// 42868804351-1-192.mp4 so the heroine's silhouette, maid dress, hair,
// whale tail, apron mark and facial design remain reference-locked.
const whaleReferenceSprites = {};
[
  ['hands', 'assets/whale-maid-hands.png'],
  ['laptop', 'assets/whale-maid-laptop.png'],
  ['standing', 'assets/whale-maid-standing.png'],
].forEach(([name, source]) => {
  const image = new Image();
  image.src = source;
  whaleReferenceSprites[name] = image;
});

const palettes = {
  pixel: {
    name: '16-bit 深海', bg: '#061a45', bg2: '#0b3a7a', deep: '#04102d', water: '#2d79bf', light: '#86f1ef',
    light2: '#d8f6e7', hair: '#304f9f', hairHi: '#70cbe9', skin: '#ffe1ce', skinShade: '#eeb4ae',
    dress: '#18295e', dress2: '#405db6', white: '#fff5e7', line: '#0b183d', coral: '#ff836d', yellow: '#ffd05b', pink: '#ff9eb1', purple: '#7459ca', green: '#65d08b', ink: '#071534'
  },
  cel: {
    name: '赛璐璐舞台', bg: '#31265b', bg2: '#6455b5', deep: '#211743', water: '#9b8cff', light: '#fff0aa',
    light2: '#fffbe8', hair: '#493eaa', hairHi: '#9fdfff', skin: '#ffe0cf', skinShade: '#f1b0ba',
    dress: '#322f72', dress2: '#8875e3', white: '#fff9ef', line: '#251d55', coral: '#ff839e', yellow: '#ffdc66', pink: '#ff9ab7', purple: '#8056c8', green: '#75d5bc', ink: '#221947'
  },
  ink: {
    name: '潮汐水墨', bg: '#e9e3cd', bg2: '#93bdc5', deep: '#183250', water: '#5b9fb1', light: '#fff8da',
    light2: '#fff9e8', hair: '#254c73', hairHi: '#74bcc6', skin: '#f8d6bb', skinShade: '#d99493',
    dress: '#294366', dress2: '#507e9b', white: '#f7f0df', line: '#183250', coral: '#ba5363', yellow: '#d9a24d', pink: '#ce7180', purple: '#685497', green: '#67977a', ink: '#183250'
  },
  neon: {
    name: '霓虹声呐', bg: '#130830', bg2: '#2c1360', deep: '#090316', water: '#3a1a99', light: '#39fce1',
    light2: '#e4ffff', hair: '#6044e9', hairHi: '#4cf7e4', skin: '#ffcef0', skinShade: '#d971c1',
    dress: '#25105a', dress2: '#ad37e2', white: '#f3ecff', line: '#13072c', coral: '#ff4ab9', yellow: '#f4e95a', pink: '#ff62d7', purple: '#945aff', green: '#43ebc8', ink: '#100521'
  }
};

const shotData = [
  { start: 0, title: '信号下潜', kicker: 'INTRO / 01', detail: '气泡 · 光束 · 8 分音符漂移', color: 'fx' },
  { start: 4, title: '鲸尾入镜', kicker: 'VERSE 01', detail: '摆尾落拍 · 远景推进', color: 'motion' },
  { start: 8, title: '深海投票', kicker: 'VERSE 01', detail: '四格卡片 · 眨眼选择', color: 'motion' },
  { start: 12, title: '规则浮现', kicker: 'PRE / 01', detail: '弹出 UI · 键盘音符', color: 'fx' },
  { start: 16, title: '珊瑚步伐', kicker: 'CHORUS / 01', detail: '四拍舞步 · 横向摇镜', color: 'motion' },
  { start: 20, title: '水母接管', kicker: 'CHORUS / 01', detail: 'DJ 触手 · 声呐圆环', color: 'cut' },
  { start: 24, title: '气泡弹幕', kicker: 'BREAK / 01', detail: '评论雨 · 尾鳍切屏', color: 'fx' },
  { start: 28, title: '存档之门', kicker: 'VERSE 02', detail: '像素门 · 色阶下潜', color: 'cut' },
  { start: 32, title: '深潜独白', kicker: 'VERSE 02', detail: '近景表情 · 低频涟漪', color: 'motion' },
  { start: 36, title: '群像合拍', kicker: 'PRE / 02', detail: '四人齐拍 · 镜头拉远', color: 'motion' },
  { start: 40, title: '潮汐建造', kicker: 'BUILD UP', detail: '光块堆叠 · 心跳闪白', color: 'fx' },
  { start: 44, title: '蓝色回声', kicker: 'FINAL CHORUS', detail: '跃出海面 · 标题收束', color: 'cut' },
];

const secondCues = [
  ['深蓝开场', '1 束顶光落下'], ['泡泡上浮', '8 个粒子错位'], ['声呐呼吸', '背景亮度起伏'], ['尾鳍掠过', '强拍擦镜'],
  ['剪影出现', '镜头推近 1 格'], ['第一次眨眼', '发梢跟拍'], ['手势落点', '裙摆弹性'], ['鲸尾扫屏', '转场对齐强拍'],
  ['选项 A 弹出', '橙色卡片跳入'], ['选项 B 弹出', '蓝色卡片跳入'], ['投票闪烁', '眼神切换'], ['点击确认', '四周泡泡爆开'],
  ['规则板展开', '纸片弹性'], ['条目 01 点亮', '左侧图标浮动'], ['条目 02 点亮', '键盘颗粒'], ['条目 03 点亮', '下潜切镜'],
  ['脚步一', '左脚+珊瑚摆动'], ['脚步二', '右脚+鱼群横穿'], ['旋身', '裙摆 3 帧展开'], ['定格', '镜头横摇落拍'],
  ['水母入场', '触手 1/4 拍'], ['低频脉冲', '圆环向外扩散'], ['DJ 刮碟', '声呐线扫描'], ['主唱回应', '两角构图切换'],
  ['评论泡出现', '文字粒子升起'], ['蓝泡', '尾鳍挑起'], ['金泡', '舞台闪烁'], ['泡泡雨', '匹配转场'],
  ['门框成型', '石块逐格堆砌'], ['存档图标', '3 色闪动'], ['色阶收缩', '调色板收窄'], ['门缝透光', '低频镜头抖动'],
  ['近景呼吸', '眼睛高光移动'], ['轻笑', '脸颊像素加亮'], ['左望', '头发延迟摆动'], ['抬头', '光束穿透海面'],
  ['信使入队', '鱼形信标绕行'], ['水母合拍', '四拍触手 wave'], ['光团上升', '群像拍手'], ['全员定格', '远景拉开'],
  ['方块堆叠', '每拍加一层'], ['海流反转', '气泡向下'], ['心跳白闪', '第 3 拍闪白'], ['跃迁门开', '标题碎片进入'],
  ['跃出水面', '浪花四散'], ['主标题亮起', '字符逐拍出现'], ['终止舞步', '尾鳍心形轨迹'], ['蓝色回声', '循环回到第一拍'],
];

const cast = [
  {
    id: 'lan', code: 'REF-01', icon: '◒', name: '鲸鱼娘 · 参考锁定', role: '主唱 / 源片形象母版',
    bio: '人物形象直接按用户提供视频复刻：蓝色渐变长发、女仆头饰、耳鳍、蓝白裙装、鲸图围裙和深蓝鲸尾。站姿、捧脸与笔记本三套姿势会按镜头调用。',
    specs: [['POSE', '03 源片姿势'], ['LOOK', '参考锁定'], ['PROP', '笔记本 / 鲸尾']], color: '#3866bc', type: 'whale'
  },
  {
    id: 'mimo', code: 'M-02', icon: '♧', name: '米沫 · 水母 DJ', role: '节拍设计 / 声呐采样',
    bio: '用 4 条触手分别控制鼓、贝斯、和声与环境音；蓄力时伞盖会按 8 分音符闪烁。',
    specs: [['RIG', '04 触手律动'], ['FACE', '03 眼神'], ['PROP', '珊瑚唱盘']], color: '#9e61d8', type: 'jelly'
  },
  {
    id: 'bo', code: 'M-03', icon: '›', name: '波波 · 信使鱼', role: '转场信使 / 镜头引导',
    bio: '不是装饰鱼群。它负责把观众的视线带进下一个镜头，并在每一个强拍留下轨迹。',
    specs: [['RIG', '03 游姿'], ['FACE', '02 表情'], ['PROP', '发光信标']], color: '#ef8c68', type: 'fish'
  },
  {
    id: 'luma', code: 'M-04', icon: '✦', name: '露玛 · 潮汐光团', role: '环境角标 / 能量可视化',
    bio: '把鼓点转译为可见的光。它能组成字幕、声呐环和转场粒子，也参与最终群像。',
    specs: [['RIG', '无限变形'], ['FACE', '02 状态'], ['PROP', '星屑尾迹']], color: '#54cfd2', type: 'orb'
  },
];

const state = {
  t: 0,
  playing: false,
  lastFrame: performance.now(),
  selectedStyle: 'pixel',
  selectedCast: 'lan',
  sound: false,
  audio: null,
  lastAudioBeat: -1,
  lastTimelineSecond: -1,
};

const $ = (selector) => document.querySelector(selector);
const timelineGrid = $('#timelineGrid');
const styleGrid = $('#styleGrid');
const castList = $('#castList');
const playhead = $('#playhead');
const toast = $('#toast');

function clamp(value, min = 0, max = 1) { return Math.max(min, Math.min(max, value)); }
function lerp(a, b, amount) { return a + (b - a) * amount; }
function easeOut(amount) { return 1 - Math.pow(1 - clamp(amount), 3); }
function fract(value) { return value - Math.floor(value); }
function hash(number) { return fract(Math.sin(number * 91.293) * 47453.5453); }
function mod(value, base) { return ((value % base) + base) % base; }
function currentPalette() { return palettes[state.selectedStyle]; }
function beatNumber(t = state.t) { return Math.floor(t / BEAT); }
function beatPhase(t = state.t) { return mod(t, BEAT) / BEAT; }
function beatPulse(t = state.t, strength = 1) { return Math.pow(1 - beatPhase(t), 4) * strength; }
function barPhase(t = state.t) { return mod(beatNumber(t), 4); }
function sceneAt(t = state.t) { return Math.min(shotData.length - 1, Math.floor(t / 4)); }
function timeLabel(t) { const seconds = Math.max(0, t); return `00:${String(Math.floor(seconds)).padStart(2, '0')}.${Math.floor((seconds % 1) * 10)}`; }

function fillRect(context, x, y, w, h, color) { context.fillStyle = color; context.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function ellipse(context, x, y, rx, ry, color) { context.fillStyle = color; context.beginPath(); context.ellipse(Math.round(x), Math.round(y), Math.max(1, Math.round(rx)), Math.max(1, Math.round(ry)), 0, 0, Math.PI * 2); context.fill(); }
function line(context, points, color, width = 1) { context.strokeStyle = color; context.lineWidth = width; context.lineCap = 'round'; context.lineJoin = 'round'; context.beginPath(); context.moveTo(points[0][0], points[0][1]); for (let i = 1; i < points.length; i += 1) context.lineTo(points[i][0], points[i][1]); context.stroke(); }
function polygon(context, points, color) { context.fillStyle = color; context.beginPath(); context.moveTo(points[0][0], points[0][1]); for (let i = 1; i < points.length; i += 1) context.lineTo(points[i][0], points[i][1]); context.closePath(); context.fill(); }
function strokePolygon(context, points, color, width = 1) { context.strokeStyle = color; context.lineWidth = width; context.beginPath(); context.moveTo(points[0][0], points[0][1]); for (let i = 1; i < points.length; i += 1) context.lineTo(points[i][0], points[i][1]); context.closePath(); context.stroke(); }

function drawBackground(context, t, palette, camera = 0) {
  const isInk = state.selectedStyle === 'ink';
  const isNeon = state.selectedStyle === 'neon';
  const p = beatPulse(t, .7);
  const gradient = context.createLinearGradient(0, 0, 0, STAGE_H);
  gradient.addColorStop(0, palette.bg2);
  gradient.addColorStop(.64, palette.bg);
  gradient.addColorStop(1, palette.deep);
  context.fillStyle = gradient;
  context.fillRect(0, 0, STAGE_W, STAGE_H);

  if (isInk) {
    for (let i = 0; i < 8; i += 1) {
      ellipse(context, 25 + i * 44 + Math.sin(t * .6 + i) * 7, 30 + (i % 3) * 36, 33, 18, i % 2 ? 'rgba(255,255,245,.22)' : 'rgba(41,100,123,.12)');
    }
  } else {
    for (let i = 0; i < 6; i += 1) {
      context.save(); context.globalAlpha = .11 + p * .03;
      polygon(context, [[18 + i * 55 + Math.sin(t * .35 + i) * 6, 0], [39 + i * 54, 0], [65 + i * 45 + camera, 138], [30 + i * 44 + camera, 138]], palette.light);
      context.restore();
    }
  }

  for (let i = 0; i < 30; i += 1) {
    const x = hash(i * 3.1) * STAGE_W;
    const speed = 8 + hash(i * 5.2) * 18;
    const y = mod(STAGE_H + 12 - (t * speed + hash(i * 9) * 200), STAGE_H + 18) - 8;
    const radius = 1 + Math.floor(hash(i * 11) * 3);
    context.save(); context.globalAlpha = .28 + hash(i * 13) * .45;
    context.strokeStyle = palette.light2; context.lineWidth = 1;
    context.beginPath(); context.arc(Math.round(x + Math.sin(t + i) * 3), Math.round(y), radius, 0, Math.PI * 2); context.stroke();
    context.restore();
  }

  if (isNeon) {
    context.save(); context.globalAlpha = .24;
    for (let y = 14; y < STAGE_H; y += 8) fillRect(context, 0, y, STAGE_W, 1, '#be79ff');
    for (let x = -100; x < 400; x += 24) line(context, [[160, 78], [x + Math.sin(t) * 5, 180]], '#54ffe8', 1);
    context.restore();
  }
}

function drawCoral(context, t, palette, depth = 1) {
  const baseY = 162 + depth * 8;
  for (let i = 0; i < 13; i += 1) {
    const x = i * 28 - 14 + Math.sin(t * .15 + i) * 3;
    const height = 10 + hash(i * 2.3) * 22;
    const color = i % 3 === 0 ? palette.coral : i % 3 === 1 ? palette.purple : palette.green;
    context.save(); context.globalAlpha = depth === 1 ? .82 : .5;
    line(context, [[x, baseY], [x + Math.sin(t + i) * 2, baseY - height], [x + 5, baseY - height - 5]], color, 3 + depth);
    line(context, [[x + 1, baseY - height * .45], [x - 5, baseY - height * .68]], color, 2);
    line(context, [[x + 1, baseY - height * .6], [x + 8, baseY - height * .88]], color, 2);
    context.restore();
  }
  context.save(); context.globalAlpha = .9;
  fillRect(context, 0, 170, STAGE_W, 10, palette.deep);
  context.restore();
}

function drawFish(context, x, y, scale, t, palette, flip = 1, glow = false) {
  context.save(); context.translate(x, y); context.scale(scale * flip, scale);
  const w = Math.sin(t * 8) * 2;
  if (glow) { context.globalAlpha = .24; ellipse(context, 0, 0, 18, 11, palette.light); context.globalAlpha = 1; }
  polygon(context, [[-10, 0], [-18, -7 + w], [-17, 7 - w]], palette.coral);
  ellipse(context, 0, 0, 12, 7, palette.yellow);
  ellipse(context, 3, -1, 8, 4, palette.light2);
  ellipse(context, 6, -2, 1.5, 1.5, palette.ink);
  polygon(context, [[-1, -6], [4, -13], [6, -5]], palette.pink);
  context.restore();
}

function drawOrb(context, x, y, scale, t, palette, intense = false) {
  context.save(); context.translate(x, y); context.scale(scale, scale);
  const pulse = 1 + beatPulse(t, .35) + (intense ? .18 : 0);
  context.globalAlpha = .18; ellipse(context, 0, 0, 20 * pulse, 20 * pulse, palette.light); context.globalAlpha = 1;
  polygon(context, [[0, -8 * pulse], [3 * pulse, -3 * pulse], [8 * pulse, 0], [3 * pulse, 3 * pulse], [0, 8 * pulse], [-3 * pulse, 3 * pulse], [-8 * pulse, 0], [-3 * pulse, -3 * pulse]], palette.light);
  ellipse(context, -2, -1, 1, 1, palette.ink); ellipse(context, 2, -1, 1, 1, palette.ink);
  context.restore();
}

function drawJelly(context, x, y, scale, t, palette, pose = 'mix') {
  context.save(); context.translate(x, y); context.scale(scale, scale);
  const pulse = beatPulse(t, 1);
  const bob = Math.sin(t * 4) * 2 - pulse * 2;
  context.translate(0, bob);
  context.globalAlpha = .18; ellipse(context, 0, 4, 31 + pulse * 3, 27 + pulse * 3, palette.pink); context.globalAlpha = 1;
  for (let i = 0; i < 4; i += 1) {
    const dx = -16 + i * 10;
    const sway = Math.sin(t * 5 + i * 1.7) * 4;
    line(context, [[dx, 12], [dx + sway, 24], [dx - sway * .6, 31 + (i % 2) * 3]], palette.pink, 4);
    line(context, [[dx, 12], [dx + sway, 24], [dx - sway * .6, 31 + (i % 2) * 3]], palette.white, 1);
  }
  ellipse(context, 0, 0, 23, 18, palette.purple);
  ellipse(context, 0, -3, 19, 13, palette.pink);
  fillRect(context, -19, 1, 38, 11, palette.purple);
  ellipse(context, -7, 0, 3, 4, palette.ink); ellipse(context, 7, 0, 3, 4, palette.ink);
  ellipse(context, -6, -1, 1, 1, palette.light2); ellipse(context, 8, -1, 1, 1, palette.light2);
  line(context, [[-3, 7], [0, 9], [3, 7]], palette.ink, 1);
  if (pose === 'mix') {
    fillRect(context, -31, 29, 62, 5, palette.line); fillRect(context, -27, 26, 54, 4, palette.dress2);
    ellipse(context, -12, 27, 6, 2, palette.light); ellipse(context, 12, 27, 6, 2, palette.light);
  }
  context.restore();
}

function drawWhaleVector(context, x, y, scale, t, palette, options = {}) {
  const mood = options.mood || 'smile';
  const dance = options.dance || 0;
  const close = options.close || false;
  const pulse = beatPulse(t, 1);
  const bob = Math.sin(t * 3.6) * 1.5 - pulse * 2.2 + dance * Math.sin(t * 8) * 1.6;
  const sway = Math.sin(t * 2.15) * 2.4 + dance * Math.sin(t * 5) * 3;
  context.save(); context.translate(x, y + bob); context.scale(scale, scale);

  // Tail sits behind the figure and gives the silhouette a whale identity.
  context.save(); context.translate(18, 19); context.rotate(.16 + Math.sin(t * 2.5) * .08);
  polygon(context, [[0, 1], [16, -8 + sway * .2], [26, -27], [31, -10], [40, -18], [43, -5], [29, 7], [17, 13]], palette.dress);
  polygon(context, [[24, -25], [26, -11], [31, -16], [34, -7], [27, 0]], palette.dress2);
  context.restore();

  // Hair mass, then face and body. Large filled shapes keep it legible at 1× pixel resolution.
  polygon(context, [[-21, -25], [-30, -9], [-26, 11], [-34, 25], [-21, 24], [-15, 12], [16, 18], [28, 8], [22, -20], [10, -30], [-10, -31]], palette.hair);
  polygon(context, [[-24, -6], [-34, 22], [-20, 15], [-13, -2]], palette.hairHi);
  polygon(context, [[17, -8], [31, 20], [17, 15], [11, -1]], palette.hairHi);
  ellipse(context, 0, -12, 22, 20, palette.skin);
  polygon(context, [[-19, -20], [-13, -34], [-6, -38], [0, -31], [7, -39], [14, -35], [20, -19], [13, -25], [0, -28], [-12, -25]], palette.hair);
  polygon(context, [[-17, -25], [-8, -31], [-1, -25], [5, -32], [14, -24], [10, -16], [0, -18], [-8, -15]], palette.hairHi);
  fillRect(context, -16, -32, 5, 8, palette.white); fillRect(context, -10, -35, 5, 9, palette.white); fillRect(context, -4, -36, 5, 9, palette.white); fillRect(context, 2, -35, 5, 9, palette.white); fillRect(context, 8, -32, 5, 8, palette.white);

  // Ears / fins
  polygon(context, [[-20, -15], [-31, -18], [-27, -7], [-20, -5]], palette.dress2);
  polygon(context, [[20, -15], [31, -18], [27, -7], [20, -5]], palette.dress2);
  fillRect(context, -28, -14, 7, 2, palette.white); fillRect(context, 21, -14, 7, 2, palette.white);

  // Eyes respond to the phrase and carry the closest readable acting.
  const blink = Math.sin(t * 1.4 + .6) > .96 ? .35 : 1;
  if (mood === 'wink') {
    ellipse(context, -8, -12, 3, 4 * blink, palette.ink); line(context, [[5, -10], [10, -8]], palette.ink, 2);
  } else if (mood === 'focus') {
    ellipse(context, -8, -12, 3, 3.4 * blink, palette.ink); ellipse(context, 8, -12, 3, 3.4 * blink, palette.ink); line(context, [[-12, -18], [-5, -19]], palette.ink, 1); line(context, [[5, -19], [12, -18]], palette.ink, 1);
  } else {
    ellipse(context, -8, -12, 3.3, 4.4 * blink, palette.ink); ellipse(context, 8, -12, 3.3, 4.4 * blink, palette.ink);
    ellipse(context, -7, -13, 1, 1.4 * blink, palette.light2); ellipse(context, 9, -13, 1, 1.4 * blink, palette.light2);
  }
  ellipse(context, -15, -5, 4, 2, palette.skinShade); ellipse(context, 15, -5, 4, 2, palette.skinShade);
  if (mood === 'surprise') ellipse(context, 0, -4, 3, 3.5, palette.ink); else line(context, [[-3, -4], [0, -2], [3, -4]], palette.ink, 1.3);

  // Dress and apron
  polygon(context, [[-14, 4], [13, 4], [20, 30], [12, 38], [-13, 38], [-21, 30]], palette.dress);
  polygon(context, [[-14, 22], [14, 22], [18, 33], [-18, 33]], palette.dress2);
  polygon(context, [[-8, 7], [8, 7], [11, 28], [-11, 28]], palette.white);
  ellipse(context, 0, 18, 5, 3, palette.light);
  fillRect(context, -18, 31, 36, 3, palette.white);
  fillRect(context, -13, 35, 8, 4, palette.white); fillRect(context, 5, 35, 8, 4, palette.white);

  const armY = 10 + Math.sin(t * 5) * (dance ? 3 : 1);
  line(context, [[-13, 9], [-25, armY - pulse * 5]], palette.dress, 6); line(context, [[13, 9], [25, armY + pulse * 2]], palette.dress, 6);
  ellipse(context, -25, armY - pulse * 5, 3, 3, palette.skin); ellipse(context, 25, armY + pulse * 2, 3, 3, palette.skin);
  if (options.mic) { line(context, [[25, armY + pulse * 2], [31, armY - 8]], palette.line, 2); ellipse(context, 32, armY - 10, 3, 3, palette.light); }

  context.restore();
}

function sourcePose(options) {
  if (options.laptop) return 'laptop';
  if (options.heart) return 'hands';
  if (options.mood === 'surprise') return 'hands';
  return 'standing';
}

function drawWhale(context, x, y, scale, t, palette, options = {}) {
  const pose = sourcePose(options);
  const source = whaleReferenceSprites[pose];

  // The reference sprite remains the first-class character rendering. It is
  // drawn into the native 320 × 180 stage and then nearest-neighbour scaled
  // by CSS, so the supplied character is exact while still sitting inside a
  // pixel-MV language. Vector drawing is only a no-network/loading fallback.
  if (source && source.complete && source.naturalWidth) {
    const pulse = 1 + beatPulse(t, .025);
    const bob = Math.sin(t * 3.6 + (options.dance ? .7 : 0)) * (1.1 + options.dance * .9) - beatPulse(t, 1.4);
    const height = 106 * scale;
    const width = height * (source.naturalWidth / source.naturalHeight);
    context.save();
    context.translate(x, y + bob);
    context.scale(pulse, pulse);
    context.drawImage(source, Math.round(-width / 2), Math.round(-height * .56), Math.round(width), Math.round(height));
    context.restore();
    return;
  }
  drawWhaleVector(context, x, y, scale, t, palette, options);
}

function drawOverlayEffects(context, t, palette, scene) {
  const p = beatPulse(t, 1);
  if (scene === 0) {
    context.save(); context.globalAlpha = .5 * p; fillRect(context, 0, 0, STAGE_W, STAGE_H, palette.light); context.restore();
  }
  if (scene === 2) {
    const choices = [['A', 35, palette.coral], ['B', 105, palette.dress2], ['C', 175, palette.purple], ['D', 245, palette.green]];
    choices.forEach(([letter, x, color], i) => {
      const inTime = clamp((mod(t, 4) - i * .23) / .42);
      const y = 24 + (1 - easeOut(inTime)) * -18;
      context.save(); context.globalAlpha = easeOut(inTime); fillRect(context, x, y, 45, 30, color); fillRect(context, x + 2, y + 2, 41, 26, palette.white); fillRect(context, x + 5, y + 5, 35, 20, color); context.fillStyle = palette.white; context.font = 'bold 10px monospace'; context.fillText(letter, x + 18, y + 19); context.restore();
    });
  }
  if (scene === 3) {
    fillRect(context, 17, 21, 121, 61, palette.white); strokePolygon(context, [[17, 21], [138, 21], [138, 82], [17, 82]], palette.light, 2);
    context.fillStyle = palette.ink; context.font = 'bold 7px monospace'; context.fillText('DEEP SEA RULES', 27, 35);
    for (let i = 0; i < 3; i += 1) { const active = mod(Math.floor(t * 2), 3) === i; fillRect(context, 28, 43 + i * 11, 92, 6, active ? palette.dress2 : palette.skinShade); fillRect(context, 29, 44 + i * 11, active ? 65 : 47, 1, palette.white); }
  }
  if (scene === 5) {
    for (let i = 0; i < 3; i += 1) { context.save(); context.globalAlpha = .24 - i * .05; context.strokeStyle = palette.light; context.lineWidth = 1; context.beginPath(); context.arc(239, 88, 20 + i * 18 + p * 20, 0, Math.PI * 2); context.stroke(); context.restore(); }
  }
  if (scene === 6) {
    for (let i = 0; i < 16; i += 1) { const bx = hash(i * 3.7) * 290 + 15; const by = mod(180 - (t * (12 + hash(i) * 15) + i * 21), 180); context.save(); context.globalAlpha = .82; ellipse(context, bx, by, 4 + hash(i) * 3, 3, palette.white); fillRect(context, bx - 2, by - 1, 7, 1, i % 2 ? palette.coral : palette.dress2); context.restore(); }
  }
  if (scene === 7) {
    fillRect(context, 112, 21, 95, 116, palette.line); fillRect(context, 116, 25, 87, 108, palette.dress2); fillRect(context, 121, 29, 77, 100, palette.deep);
    for (let i = 0; i < 4; i += 1) ellipse(context, 160, 78, 9 + i * 11 + p * 3, 9 + i * 11 + p * 3, i % 2 ? palette.purple : palette.dress2);
    fillRect(context, 149, 68, 22, 20, palette.light); context.fillStyle = palette.ink; context.font = 'bold 7px monospace'; context.fillText('SAVE', 151, 80);
  }
  if (scene === 10) {
    const rows = 4; for (let r = 0; r < rows; r += 1) { const width = 42 + r * 23 + p * 9; fillRect(context, 160 - width / 2, 142 - r * 12, width, 8, r % 2 ? palette.dress2 : palette.light); }
    context.save(); context.globalAlpha = .24 * p; fillRect(context, 0, 0, STAGE_W, STAGE_H, palette.white); context.restore();
  }
  if (scene === 11) {
    context.save(); context.globalAlpha = .88; fillRect(context, 0, 9, STAGE_W, 22, palette.deep); context.fillStyle = palette.light2; context.font = 'bold 13px monospace'; context.fillText('BLUE ECHO', 99, 24); context.restore();
  }
}

function drawMV(t) {
  const palette = currentPalette();
  const scene = sceneAt(t);
  const local = mod(t, 4);
  ctx.clearRect(0, 0, STAGE_W, STAGE_H);
  drawBackground(ctx, t, palette, Math.sin(t) * 2);
  drawCoral(ctx, t, palette, 2);

  // Direction and casts intentionally vary by 4-second shot rather than looping one central sprite.
  if (scene === 0) {
    drawOrb(ctx, 160 + Math.sin(t * 2) * 18, 89, 1.1, t, palette, true);
    for (let i = 0; i < 6; i += 1) drawFish(ctx, 30 + i * 55, 47 + (i % 3) * 18, .23, t + i, palette, i % 2 ? -1 : 1);
  } else if (scene === 1) {
    drawFish(ctx, 66 + local * 14, 103, .42, t, palette, 1, true);
    drawWhale(ctx, 204, 112, .9, t, palette, { mood: 'smile', mic: true });
  } else if (scene === 2) {
    drawWhale(ctx, 255, 121, .79, t, palette, { laptop: true, mood: local > 2 ? 'wink' : 'smile', mic: false });
    drawOrb(ctx, 220, 92, .5, t, palette);
  } else if (scene === 3) {
    drawWhale(ctx, 236, 115, .83, t, palette, { laptop: true, mood: 'focus', mic: false });
  } else if (scene === 4) {
    drawCoral(ctx, t + 1, palette, 1);
    drawWhale(ctx, 155 + Math.sin(t * 2) * 12, 120, .88, t, palette, { mood: 'smile', dance: 1, mic: true });
    drawFish(ctx, 55 + local * 30, 106, .44, t, palette, 1);
  } else if (scene === 5) {
    drawJelly(ctx, 239, 101, 1.05, t, palette);
    drawWhale(ctx, 83, 122, .64, t, palette, { mood: 'focus', dance: 1 });
    drawOrb(ctx, 163, 64, .55, t, palette);
  } else if (scene === 6) {
    drawWhale(ctx, 150, 121, .92, t, palette, { mood: 'wink', dance: 1, mic: true });
  } else if (scene === 7) {
    drawWhale(ctx, 68, 125, .58, t, palette, { mood: 'surprise' });
    drawOrb(ctx, 72, 73, .7, t, palette, true);
  } else if (scene === 8) {
    drawWhale(ctx, 160, 117, 1.22, t, palette, { mood: local < 2 ? 'smile' : 'focus', mic: false, close: true });
  } else if (scene === 9) {
    drawWhale(ctx, 126, 121, .62, t, palette, { mood: 'smile', dance: 1 });
    drawJelly(ctx, 210, 115, .56, t, palette, 'mix');
    drawFish(ctx, 272, 75 + Math.sin(t * 4) * 12, .5, t, palette, -1, true);
    drawOrb(ctx, 54, 66, .62, t, palette, true);
  } else if (scene === 10) {
    drawWhale(ctx, 160, 138 - local * 13, .72 + local * .05, t, palette, { heart: true, mood: 'focus', dance: 1, mic: true });
    drawOrb(ctx, 93, 82, .6, t, palette, true); drawOrb(ctx, 230, 96, .45, t + 1, palette, true);
  } else {
    drawWhale(ctx, 157, 107, 1.04, t, palette, { mood: 'wink', dance: 1, mic: true });
    drawFish(ctx, 65 + local * 12, 110, .55, t, palette, 1, true); drawJelly(ctx, 257, 126, .42, t, palette); drawOrb(ctx, 77, 55, .56, t, palette, true);
  }

  drawOverlayEffects(ctx, t, palette, scene);
  // A dark foreground bed stabilizes the small stage's depth.
  ctx.save(); ctx.globalAlpha = .28; fillRect(ctx, 0, 174, STAGE_W, 6, palette.ink); ctx.restore();
}

function drawCharacterSheet(t) {
  const palette = currentPalette();
  const chosen = cast.find((member) => member.id === state.selectedCast) || cast[0];
  characterCtx.clearRect(0, 0, STAGE_W, STAGE_H);
  const gradient = characterCtx.createLinearGradient(0, 0, STAGE_W, STAGE_H);
  gradient.addColorStop(0, palette.bg2); gradient.addColorStop(1, palette.deep);
  characterCtx.fillStyle = gradient; characterCtx.fillRect(0, 0, STAGE_W, STAGE_H);
  for (let x = 16; x < 320; x += 16) { characterCtx.save(); characterCtx.globalAlpha = .14; fillRect(characterCtx, x, 0, 1, 180, palette.light); characterCtx.restore(); }
  for (let y = 20; y < 180; y += 20) { characterCtx.save(); characterCtx.globalAlpha = .11; fillRect(characterCtx, 0, y, 320, 1, palette.light); characterCtx.restore(); }
  characterCtx.fillStyle = palette.light2; characterCtx.font = 'bold 8px monospace'; characterCtx.fillText(`${chosen.code} / ${chosen.type.toUpperCase()}`, 16, 19);
  characterCtx.fillStyle = palette.light; characterCtx.font = '6px monospace'; characterCtx.fillText('FRONT  •  BEAT POSE  •  PROP READY', 16, 30);
  if (chosen.type === 'whale') { drawWhale(characterCtx, 160, 111, 1.6, t, palette, { mood: 'wink', dance: 1, mic: true }); }
  if (chosen.type === 'jelly') { drawJelly(characterCtx, 160, 88, 1.9, t, palette); fillRect(characterCtx, 92, 145, 136, 6, palette.dress2); }
  if (chosen.type === 'fish') { drawFish(characterCtx, 158, 91, 3.1, t, palette, 1, true); drawOrb(characterCtx, 229, 73, .8, t, palette, true); }
  if (chosen.type === 'orb') { drawOrb(characterCtx, 160, 91, 3.5, t, palette, true); for (let i = 0; i < 6; i += 1) drawOrb(characterCtx, 88 + i * 29, 126 + Math.sin(t * 3 + i) * 8, .35, t + i, palette); }
  fillRect(characterCtx, 16, 157, 67, 2, palette.coral); fillRect(characterCtx, 16, 164, 127, 2, palette.light); fillRect(characterCtx, 16, 171, 88, 2, palette.pink);
}

function render(t) {
  drawMV(t);
  drawCharacterSheet(t);
  const shot = shotData[sceneAt(t)];
  const second = Math.min(47, Math.floor(t));
  $('#frameLabel').textContent = timeLabel(t);
  $('#sceneLabel').textContent = `${String(sceneAt(t) + 1).padStart(2, '0')} · ${shot.title}`;
  $('#captionKicker').textContent = shot.kicker;
  $('#captionTitle').textContent = shot.title;
  $('#captionDetail').textContent = secondCues[second][1];
  playhead.value = t.toFixed(2);
  updateBeatPips(t);
  if (second !== state.lastTimelineSecond) { state.lastTimelineSecond = second; updateActiveTimeline(second); }
}

function createTimeline() {
  secondCues.forEach(([title, detail], second) => {
    const button = document.createElement('button');
    const shot = shotData[Math.floor(second / 4)];
    const isCut = second % 4 === 0;
    button.className = `timeline-cell ${isCut ? 'cut' : ''}`;
    button.type = 'button'; button.dataset.second = String(second);
    button.innerHTML = `<b>${String(second).padStart(2, '0')}s</b><strong>${title}</strong><small>${detail}</small><i></i>`;
    button.addEventListener('click', () => { setTime(second); showToast(`跳至 ${String(second).padStart(2, '0')} 秒 · ${shot.title}`); });
    timelineGrid.append(button);
  });
}

function updateActiveTimeline(second) {
  timelineGrid.querySelectorAll('.timeline-cell').forEach((cell) => cell.classList.toggle('active', Number(cell.dataset.second) === second));
}

function createBeatPips() {
  const container = $('#beatPips');
  for (let i = 0; i < 4; i += 1) { const pip = document.createElement('i'); container.append(pip); }
}
function updateBeatPips(t) {
  const active = barPhase(t);
  $('#beatPips').querySelectorAll('i').forEach((pip, index) => pip.classList.toggle('active', index === active));
}

function createCast() {
  cast.forEach((member) => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'cast-button'; button.dataset.id = member.id;
    button.innerHTML = `<span class="cast-icon" style="background:${member.color}">${member.icon}</span><span><strong>${member.name}</strong><small>${member.role}</small></span><b>${member.code}</b>`;
    button.addEventListener('click', () => { state.selectedCast = member.id; updateCast(); showToast(`${member.name} 已载入模型表`); });
    castList.append(button);
  });
  updateCast();
}

function updateCast() {
  const member = cast.find((item) => item.id === state.selectedCast) || cast[0];
  castList.querySelectorAll('.cast-button').forEach((button) => button.classList.toggle('active', button.dataset.id === member.id));
  $('#characterCode').textContent = member.code;
  $('#characterRole').textContent = member.role;
  $('#characterName').textContent = member.name;
  $('#characterBio').textContent = member.bio;
  $('#modelSpecs').innerHTML = member.specs.map(([label, value]) => `<div><small>${label}</small><b>${value}</b></div>`).join('');
}

function selectStyle(style) {
  state.selectedStyle = style;
  styleGrid.querySelectorAll('.style-card').forEach((button) => {
    const active = button.dataset.style === style;
    button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active));
  });
  showToast(`已切换为「${palettes[style].name}」`);
  render(state.t);
}

function setTime(value) {
  state.t = clamp(Number(value), 0, DURATION - .001);
  state.lastAudioBeat = beatNumber(state.t) - 1;
  render(state.t);
}

function setPlaying(playing) {
  state.playing = playing;
  const icon = playing ? 'Ⅱ' : '▶';
  $('#stagePlayButton').textContent = icon;
  $('#stagePlayButton').setAttribute('aria-label', playing ? '暂停' : '播放');
  $('#playButtonText').textContent = playing ? '暂停预览' : `播放第 ${String(sceneAt(state.t) + 1).padStart(2, '0')} 幕`;
  if (playing) { ensureAudio(); }
}

function togglePlay() {
  if (!state.playing && state.t >= DURATION - .02) setTime(0);
  setPlaying(!state.playing);
}

function ensureAudio() {
  if (!state.audio) {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    state.audio = new Audio();
  }
  if (state.audio.state === 'suspended') state.audio.resume();
}

function playTone(frequency, length, gain, shape = 'sine') {
  if (!state.audio || !state.sound) return;
  const now = state.audio.currentTime;
  const oscillator = state.audio.createOscillator();
  const volume = state.audio.createGain();
  oscillator.type = shape; oscillator.frequency.setValueAtTime(frequency, now);
  volume.gain.setValueAtTime(.0001, now); volume.gain.exponentialRampToValueAtTime(gain, now + .008); volume.gain.exponentialRampToValueAtTime(.0001, now + length);
  oscillator.connect(volume); volume.connect(state.audio.destination); oscillator.start(now); oscillator.stop(now + length + .02);
}

function audioBeat(beat) {
  if (!state.sound) return;
  if (mod(beat, 4) === 0) { playTone(72, .12, .1, 'triangle'); playTone(216, .045, .025, 'sine'); }
  else { playTone(mod(beat, 2) ? 430 : 320, .035, .024, 'square'); }
  if (mod(beat, 8) === 6) playTone(620, .08, .028, 'sine');
}

function setSound(enabled) {
  state.sound = enabled;
  const button = $('#soundToggle'); button.setAttribute('aria-pressed', String(enabled)); button.textContent = enabled ? '♪ 节拍已开' : '♪ 引导节拍';
  if (enabled) { ensureAudio(); state.lastAudioBeat = beatNumber(state.t) - 1; }
  showToast(enabled ? '引导节拍已开启（124 BPM）' : '引导节拍已静音');
}

function showToast(message) {
  toast.textContent = message; toast.classList.add('show');
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove('show'), 1800);
}

function buildBlueprint() {
  return {
    title: '鲸歌深潜计划 / Abyssal Beat', duration_seconds: DURATION, bpm: BPM,
    production_rules: ['每秒至少一个可见事件', '每拍一次动作强调', '强拍执行切镜或转场', '所有画面由确定性代码绘制'],
    styles: Object.values(palettes).map((palette) => palette.name),
    cast: cast.map(({ code, name, role, specs }) => ({ code, name, role, specs: Object.fromEntries(specs) })),
    shots: shotData.map((shot, index) => ({ number: index + 1, at: `${String(shot.start).padStart(2, '0')}s`, title: shot.title, beat_note: shot.detail })),
    second_cues: secondCues.map(([event, detail], second) => ({ second, event, detail })),
  };
}
function downloadBlueprint() {
  const blob = new Blob([JSON.stringify(buildBlueprint(), null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'abyssal-beat-shot-blueprint.json'; document.body.append(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url); showToast('镜头制作蓝图已下载');
}

function bindEvents() {
  $('#playButton').addEventListener('click', togglePlay);
  $('#stagePlayButton').addEventListener('click', togglePlay);
  $('#rewindButton').addEventListener('click', () => { setPlaying(false); setTime(0); showToast('已回到第 01 幕'); });
  $('#soundToggle').addEventListener('click', () => setSound(!state.sound));
  $('#exportButton').addEventListener('click', downloadBlueprint);
  $('#downloadPlan').addEventListener('click', downloadBlueprint);
  $('#jumpButton').addEventListener('click', () => $('#timeline').scrollIntoView({ behavior: 'smooth', block: 'start' }));
  $('#fullScreenButton').addEventListener('click', () => { if (stage.parentElement.requestFullscreen) stage.parentElement.requestFullscreen(); });
  playhead.addEventListener('input', (event) => setTime(event.target.value));
  styleGrid.addEventListener('click', (event) => { const button = event.target.closest('.style-card'); if (button) selectStyle(button.dataset.style); });
  window.addEventListener('keydown', (event) => {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
    if (event.code === 'Space') { event.preventDefault(); togglePlay(); }
    if (event.key === 'ArrowRight') { event.preventDefault(); setTime(state.t + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); setTime(state.t - 1); }
    if (event.key.toLowerCase() === 's') setSound(!state.sound);
  });
}

function frame(now) {
  const delta = Math.min(.05, (now - state.lastFrame) / 1000);
  state.lastFrame = now;
  if (state.playing) {
    state.t += delta;
    if (state.t >= DURATION) { state.t = 0; state.lastAudioBeat = -1; }
    const beat = beatNumber(state.t);
    if (beat !== state.lastAudioBeat) { state.lastAudioBeat = beat; audioBeat(beat); }
  }
  render(state.t);
  requestAnimationFrame(frame);
}

createTimeline();
createBeatPips();
createCast();
bindEvents();
render(0);
requestAnimationFrame(frame);
