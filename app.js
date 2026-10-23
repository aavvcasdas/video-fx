/*
 * 潮汐 / TIDE lyric MV
 * A deterministic canvas music-video study using the approved local model sheet
 * and a shared part-based JavaScript whale-maid rig.
 * The 320 × 180 stage is intentionally small and nearest-neighbour scaled.
 */

const STAGE_W = 320;
const STAGE_H = 180;
const timeline = window.ABYSSAL_TIMELINE;
const castBible = window.ABYSSAL_CAST;
const storyboard = window.TIDE_STORYBOARD;
const DURATION = timeline.duration;
const BPM = timeline.bpm;
const BEAT = 60 / BPM;

const stage = document.querySelector('#mvCanvas');
const ctx = stage.getContext('2d');
const characterCanvas = document.querySelector('#characterCanvas');
const characterCtx = characterCanvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
characterCtx.imageSmoothingEnabled = false;

// The saved source poses remain the model sheet. Runtime drawing is now the
// part-based JS rig in src/whale-pixel-rig.js, so the heroine has independent
// hair/tail/eye/mouth/arm motion instead of being a translated PNG.

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

// Data-first modules mirror a code-rendered MV: timing and cast identity
// remain independent from the frame painter below.
const shotData = timeline.shots;
const secondCues = timeline.secondCues;
const cast = castBible.members;

const state = {
  t: 0,
  playing: false,
  lastFrame: performance.now(),
  selectedStyle: 'pixel',
  selectedCast: 'lan',
  sound: true,
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
const tideTrack = $('#tideTrack');

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
  if (options.heart || options.mood === 'surprise') return 'hands';
  return 'stand';
}

function drawWhale(context, x, y, scale, t, palette, options = {}) {
  const rig = window.WHALE_PIXEL_RIG;
  const rigOptions = { ...options, pose: options.pose || sourcePose(options) };
  if (rig && typeof rig.draw === 'function') {
    rig.draw(context, x, y, scale, t, palette, rigOptions);
    return;
  }
  // This remains a JS-only emergency fallback for a partially loaded page;
  // normal preview and export always use the complete Whale Pixel Rig.
  drawWhaleVector(context, x, y, scale, t, palette, rigOptions);
}

function activeLyric(t) {
  return timeline.lyrics.find((line) => t >= line.start && t < line.end) || null;
}

function drawOverlayEffects(context, t, palette, scene) {
  const lyric = activeLyric(t);
  if (!lyric) return;
  const age = clamp((t - lyric.start) / .22);
  const pulse = beatPulse(t, 1);

  // Recognition card: the text, timing ID and a live beat marker always
  // travel together, making lyric review possible directly in the preview.
  context.save();
  context.globalAlpha = easeOut(age);
  fillRect(context, 12, 13, 130, 26, 'rgba(4, 19, 50, .82)');
  fillRect(context, 12, 13, 3 + pulse * 6, 26, palette.light);
  context.fillStyle = palette.light; context.font = '6px monospace';
  context.fillText(`LYRIC ${lyric.id}  •  ${Math.floor((t - lyric.start) * 10) / 10}s`, 21, 22);
  context.fillStyle = palette.white; context.font = 'bold 10px sans-serif';
  context.fillText(lyric.text, 21, 34);
  context.restore();

  if (lyric.motif === 'sea') {
    for (let i = 0; i < 5; i += 1) {
      const y = 112 + i * 9 + Math.sin(t * 3 + i) * 2;
      line(context, [[0, y], [60, y - 3], [120, y + 2], [190, y - 2], [320, y + 2]], palette.light, i === 0 ? 2 : 1);
    }
  }
  if (lyric.motif === 'mountain') {
    for (let i = 0; i < 4; i += 1) {
      const xx = -20 + i * 100 - mod(t * (5 + i), 22);
      context.save(); context.globalAlpha = .18 + i * .07;
      polygon(context, [[xx, 126], [xx + 48, 76 - i * 6], [xx + 98, 126]], i % 2 ? palette.dress2 : palette.light);
      context.restore();
    }
  }
  if (lyric.motif === 'distance') {
    const spread = 18 + clamp((t - lyric.start) / (lyric.end - lyric.start)) * 112;
    context.save(); context.globalAlpha = .85;
    ellipse(context, 160 - spread, 101, 4 + pulse * 2, 4 + pulse * 2, palette.coral);
    ellipse(context, 160 + spread, 101, 4 + pulse * 2, 4 + pulse * 2, palette.light);
    for (let x = 160 - spread + 10; x < 160 + spread - 8; x += 9) fillRect(context, x, 101, 4, 1, palette.white);
    context.restore();
  }
  if (lyric.motif === 'retreat') {
    for (let i = 0; i < 7; i += 1) {
      const x = 282 - mod((t - lyric.start) * (34 + i * 3) + i * 39, 340);
      const y = 71 + (i % 4) * 16;
      context.save(); context.globalAlpha = .38 + pulse * .28; fillRect(context, x, y, 11, 7, i % 2 ? palette.coral : palette.pink); context.restore();
    }
  }
  if (lyric.motif === 'memory') {
    for (let i = 0; i < 8; i += 1) {
      const orbit = t * .8 + i * .78;
      const x = 161 + Math.cos(orbit) * (28 + (i % 3) * 10);
      const y = 112 + Math.sin(orbit * 1.4) * (15 + (i % 2) * 7);
      context.save(); context.globalAlpha = .45 + pulse * .25; ellipse(context, x, y, 4, 3, palette.white); fillRect(context, x - 2, y - 1, 7, 1, palette.light); context.restore();
    }
  }
  if (lyric.motif === 'search') {
    for (let i = 0; i < 3; i += 1) {
      const radius = 12 + mod((t - lyric.start) * 28 + i * 17, 48);
      context.save(); context.globalAlpha = .44 - i * .1; context.strokeStyle = palette.light; context.lineWidth = 1; context.beginPath(); context.arc(164, 98, radius, 0, Math.PI * 2); context.stroke(); context.restore();
    }
  }

  // A one-frame high-light on each strong beat gives the lyric card a visible
  // hit even between larger scene changes.
  if (barPhase(t) === 0) { context.save(); context.globalAlpha = pulse * .14; fillRect(context, 0, 0, STAGE_W, STAGE_H, palette.light2); context.restore(); }
}

function drawStoryboardBridge(context, t, palette) {
  if (!storyboard) return;
  const bridge = storyboard.bridgeAt(t);
  if (!bridge) return;
  const p = bridge.p;
  const cx = STAGE_W / 2;
  const cy = STAGE_H / 2;
  context.save();
  context.globalAlpha = .36 * Math.sin(Math.PI * p);
  if (bridge.type === 'shape-morph' || bridge.type === 'callback') {
    const r = Math.round(8 + p * 46);
    context.strokeStyle = palette.light; context.lineWidth = 2;
    context.beginPath(); context.arc(cx, cy, r, 0, Math.PI * 2); context.stroke();
    const s = Math.round(4 + (1 - p) * 8);
    context.fillStyle = palette.accent || palette.light;
    context.beginPath(); context.moveTo(cx, cy - s); context.lineTo(cx + s, cy); context.lineTo(cx, cy + s); context.lineTo(cx - s, cy); context.closePath(); context.fill();
  } else if (bridge.type === 'cause-effect') {
    context.strokeStyle = palette.coral; context.lineWidth = 2;
    context.beginPath(); context.moveTo(cx - 48 * (1 - p), cy + 18); context.lineTo(cx + 48 * p, cy - 18); context.stroke();
  } else {
    fillRect(context, Math.round(cx - 1), Math.round(cy - 28 * p), 2, Math.round(56 * p), palette.light);
  }
  context.restore();
}

function drawMV(t) {
  const palette = currentPalette();
  const scene = sceneAt(t);
  const camera = storyboard ? storyboard.cameraAt(t) : { x: 0, y: 0, zoom: 1 };
  ctx.clearRect(0, 0, STAGE_W, STAGE_H);
  // Animate-style board camera: every lyric beat receives an authored lens
  // instead of reusing one static mid-shot through the entire song.
  ctx.save();
  ctx.translate(STAGE_W / 2, STAGE_H / 2);
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-STAGE_W / 2 + camera.x, -STAGE_H / 2 + camera.y);
  drawBackground(ctx, t, palette, Math.sin(t * .65) * 2);
  drawCoral(ctx, t, palette, 2);

  if (scene === 0) {
    // The JS stand rig opens on the source-locked model-sheet silhouette.
    drawWhale(ctx, 235, 120, .9, t, palette, { pose: 'stand', mood: 'wink' });
    drawOrb(ctx, 84, 95, .68, t, palette, true);
    drawFish(ctx, 38 + mod(t * 16, 105), 122, .38, t, palette, 1, true);
  } else if (scene === 1) {
    // The JS laptop parts turn the distant-view lyric into a diary shot.
    drawWhale(ctx, 176, 119, .92, t, palette, { pose: 'laptop', mood: 'hopeful' });
    drawFish(ctx, 40 + mod(t * 12, 250), 76, .31, t, palette, 1, true);
    drawOrb(ctx, 270, 82, .52, t, palette);
  } else if (scene === 2) {
    drawWhale(ctx, 220, 123, .88, t, palette, { pose: 'hands', mood: 'surprise' });
    drawOrb(ctx, 82, 92, .66, t, palette, true);
    drawFish(ctx, 120, 136, .34, t, palette, -1, false);
  } else if (scene === 3) {
    drawWhale(ctx, 151, 115, 1.0, t, palette, { pose: 'stand', mood: 'focus', dance: 1 });
    drawOrb(ctx, 64, 64, .44, t, palette, true); drawOrb(ctx, 265, 128, .55, t + 1, palette, true);
  } else if (scene === 4) {
    drawWhale(ctx, 155, 123, .94, t, palette, { pose: 'stand', mood: 'smile', dance: 1 });
    drawFish(ctx, 33 + mod(t * 22, 255), 136, .45, t, palette, 1, true);
  } else if (scene === 5) {
    drawWhale(ctx, 165, 115, .88, t, palette, { pose: 'laptop', mood: 'focus' });
    drawOrb(ctx, 83, 87, .64, t, palette, true); drawOrb(ctx, 244, 70, .43, t + 1, palette);
  } else if (scene === 6) {
    drawWhale(ctx, 160, 126, .98, t, palette, { pose: 'hands', mood: 'surprise' });
    for (let i = 0; i < 4; i += 1) drawOrb(ctx, 60 + i * 66, 128 + Math.sin(t * 2 + i) * 8, .28, t + i, palette, true);
  } else {
    drawWhale(ctx, 160, 119, 1.08, t, palette, { pose: 'stand', mood: 'wink', dance: 1 });
    drawFish(ctx, 48 + mod(t * 14, 230), 83, .37, t, palette, 1, true);
  }
  ctx.restore();
  drawStoryboardBridge(ctx, t, palette);
  drawOverlayEffects(ctx, t, palette, scene);
  ctx.save(); ctx.globalAlpha = .25; fillRect(ctx, 0, 174, STAGE_W, 6, palette.ink); ctx.restore();
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
  const second = Math.min(secondCues.length - 1, Math.floor(t));
  const lyric = activeLyric(t);
  $('#frameLabel').textContent = timeLabel(t);
  $('#sceneLabel').textContent = `${String(sceneAt(t) + 1).padStart(2, '0')} · ${shot.title}`;
  $('#captionKicker').textContent = lyric ? `LYRIC RECOG / ${lyric.id}` : shot.kicker;
  $('#captionTitle').textContent = lyric ? lyric.text : shot.title;
  $('#captionDetail').textContent = lyric ? lyric.cue : secondCues[second][1];
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
  if (tideTrack && Number.isFinite(tideTrack.duration)) tideTrack.currentTime = state.t;
  render(state.t);
}

function setPlaying(playing) {
  state.playing = playing;
  const icon = playing ? 'Ⅱ' : '▶';
  $('#stagePlayButton').textContent = icon;
  $('#stagePlayButton').setAttribute('aria-label', playing ? '暂停' : '播放');
  $('#playButtonText').textContent = playing ? '暂停《潮汐》' : `播放第 ${String(sceneAt(state.t) + 1).padStart(2, '0')} 幕`;
  if (!tideTrack) return;
  if (playing) {
    tideTrack.muted = !state.sound;
    tideTrack.currentTime = state.t;
    tideTrack.play().catch(() => {
      // The visual composer stays usable even if a browser blocks media.
      showToast('浏览器暂未允许播放原曲，画面仍会按时间表预览');
    });
  } else {
    tideTrack.pause();
  }
}

function togglePlay() {
  if (!state.playing && state.t >= DURATION - .02) setTime(0);
  setPlaying(!state.playing);
}

function setSound(enabled) {
  state.sound = enabled;
  if (tideTrack) tideTrack.muted = !enabled;
  const button = $('#soundToggle');
  button.setAttribute('aria-pressed', String(enabled));
  button.textContent = enabled ? '♪ 原曲音轨' : '♪ 原曲静音';
  showToast(enabled ? '《潮汐》原曲音轨已开启' : '《潮汐》原曲已静音');
}

function showToast(message) {
  toast.textContent = message; toast.classList.add('show');
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove('show'), 1800);
}

function buildBlueprint() {
  return {
    title: '潮汐 / TIDE', audio: timeline.recognition.source, duration_seconds: DURATION, bpm: BPM,
    lyric_recognition: { ...timeline.recognition, lines: timeline.lyrics },
    lead_character: {
      code: castBible.whaleMaid.code,
      concept: '已保存鲸鱼娘参照库',
      source_poses: castBible.whaleMaid.poses,
      saved_style_references: castBible.whaleMaid.styleSheets,
      lock: castBible.whaleMaid.reference.lock,
    },
    production_rules: ['每秒至少一个可见事件', '每句歌词必须有对应画面隐喻', '强拍执行卡片或镜头强调', '所有画面由确定性代码绘制'],
    styles: Object.values(palettes).map((palette) => palette.name),
    cast: cast.map(({ code, name, role, specs }) => ({ code, name, role, specs: Object.fromEntries(specs) })),
    shots: shotData.map((shot, index) => ({ number: index + 1, at: `${String(shot.start).padStart(2, '0')}s`, title: shot.title, beat_note: shot.detail, pose: shot.pose })),
    second_cues: secondCues.map(([event, detail], second) => ({ second, event, detail })),
  };
}
function downloadBlueprint() {
  const blob = new Blob([JSON.stringify(buildBlueprint(), null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'tide-lyric-mv-blueprint.json'; document.body.append(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url); showToast('《潮汐》歌词 MV 蓝图已下载');
}

function bindEvents() {
  $('#playButton').addEventListener('click', togglePlay);
  $('#stagePlayButton').addEventListener('click', togglePlay);
  $('#rewindButton').addEventListener('click', () => { setPlaying(false); setTime(0); showToast('已回到第 01 幕'); });
  $('#soundToggle').addEventListener('click', () => setSound(!state.sound));
  tideTrack.addEventListener('ended', () => {
    state.t = DURATION - .001;
    setPlaying(false);
    render(state.t);
  });
  tideTrack.addEventListener('loadedmetadata', () => {
    tideTrack.muted = !state.sound;
    $('#durationLabel').textContent = `00:${DURATION.toFixed(1).padStart(4, '0')}`;
  });
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
    // The supplied MP3 is the playback clock whenever it is available; the
    // small fallback keeps visual scrubbing functional before media is ready.
    if (tideTrack && !tideTrack.paused && Number.isFinite(tideTrack.currentTime)) state.t = tideTrack.currentTime;
    else state.t += delta;
    if (state.t >= DURATION) {
      state.t = DURATION - .001;
      setPlaying(false);
    }
  }
  render(state.t);
  requestAnimationFrame(frame);
}

playhead.max = String(DURATION);
$('#durationLabel').textContent = `00:${DURATION.toFixed(1).padStart(4, '0')}`;
tideTrack.muted = !state.sound;
createTimeline();
createBeatPips();
createCast();
bindEvents();
render(0);
requestAnimationFrame(frame);
