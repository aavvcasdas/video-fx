// ============================================================================
// src/whale_girl.js — DeepSeek 深海鲸鱼娘 Character System
// Replicated from 42868804351-1-192.mp4 via:
//   Step 1 (先像素化): 100x102 pixel-grid anatomical extraction & 64-color palette
//   Step 2 (然后构造出来): Dual synchronized construction:
//     (A) Articulated 7-Bone Pixel-Grid Rig (tail, backHair, legL, legR, torso,
//         armR, head + dynamic face/hat/prop/smear transforms)
//     (B) Exact-Proportion Vector/Brush Multi-Polygon Anatomy using CORE.paint &
//         CORE.inkLine (for Watercolor/Ukiyo-e/Risograph/Neon styles & 5-view 3D
//         turnarounds: front, q, side, qback, back)
// Exports full ClaudeAnimationBase / PDoomVideo API:
//   whaleGirl, WhaleGirl, feel, emotions, move, turn, spinView,
//   EMO, HATS, VIEWS, EYES, MOUTHS, EMOTES
// ============================================================================

(function (root) {
  const CORE = root.CORE || (typeof require !== 'undefined' ? require('./core.js') : {});
  if (!root.WHALE_GIRL_PIXEL_RIG && typeof require === 'function') {
    try { require('./whale_girl_rig_data.js'); } catch (e) {}
  }

  const {
    TAU, PAL, clamp, lerp, seg, ease, easeOut, backOut, wob, hash,
    boilSeed, pulse, mixCol,
    rectPts, ellPts, rrPts, starPts, heartPts,
    getActiveStyle, paint, inkLine, letter
  } = CORE;

  // Exact Color Palette sampled from 42868804351-1-192.mp4
  const C = {
    ink:        '#121A34',
    hairDark:   '#1B428A',
    hairMain:   '#2558AA',
    hairMid:    '#387CD0',
    hairLight:  '#53AAE8',
    hairCyan:   '#72E2F7',
    hairGlow:   '#A2F2FF',
    haloArc:    '#6EB2F2',
    earDark:    '#1B2A4E',
    earMid:     '#2B4474',
    earFrill:   '#EEF5FC',
    skin:       '#FFEAE0',
    skinShadow: '#F4C5B4',
    blush:      '#FF8596',
    eyeLash:    '#111A36',
    eyeTop:     '#172C60',
    eyeMid:     '#2A62BE',
    eyeBot:     '#6CC0FA',
    eyePupil:   '#0F1E46',
    dressDark:  '#1A2240',
    dressMid:   '#28355E',
    dressEdge:  '#3A4E82',
    apronWhite: '#FFFFFF',
    apronShade: '#D7E0F0',
    whaleLogo:  '#2563EB',
    bowBlue:    '#4BAEE8',
    bowBlueHi:  '#82CEF8',
    gold:       '#E2B044',
    goldDark:   '#B88424',
    tailDark:   '#22355C',
    tailMid:    '#365284',
    tailLight:  '#587CB2',
    tailBelly:  '#9BB4DA',
    shoeNavy:   '#17203A'
  };

  const VIEWS = ['front', 'q', 'side', 'qback', 'back'];
  const VIEW_VX = { front: 0, q: 0.42, side: 0.85, qback: 1.05, back: 0 };

  // ==========================================================================
  // Modular Eyes (`EYES`) — Compatible with cast.js & 42868804351-1-192.mp4
  // ==========================================================================
  const EYES = {
    open(ctx, ex, ey, u, sc = 1, o = {}, isRight = false) {
      const rx = 0.30 * u * sc, ry = 0.34 * u * sc;
      const gx = (o.lookX || 0) * 0.08 * u;
      const gy = (o.lookY || 0) * 0.06 * u;
      // White sclera
      paint(ctx, ellPts(ex, ey, rx, ry, 14), { wash: '#FFFFFF', ink: null });
      // Deep navy upper iris -> sky-blue lower iris
      paint(ctx, ellPts(ex + gx, ey + gy + 0.02 * u * sc, rx * 0.88, ry * 0.88, 14), { wash: C.eyeTop, fill: C.eyeMid, fillOp: 130, ink: null });
      paint(ctx, ellPts(ex + gx, ey + gy + 0.11 * u * sc, rx * 0.78, ry * 0.52, 12), { wash: C.eyeBot, ink: null });
      // Dark pupil
      paint(ctx, ellPts(ex + gx, ey + gy + 0.02 * u * sc, rx * 0.42, ry * 0.44, 10), { wash: C.eyePupil, ink: null });
      // Big upper-left white catchlight + small lower-right catchlight
      paint(ctx, ellPts(ex + gx - 0.10 * u * sc, ey + gy - 0.11 * u * sc, 0.10 * u * sc, 0.09 * u * sc, 8), { wash: '#FFFFFF', ink: null });
      paint(ctx, ellPts(ex + gx + 0.10 * u * sc, ey + gy + 0.13 * u * sc, 0.05 * u * sc, 0.05 * u * sc, 6), { wash: '#FFFFFF', ink: null });
      // Thick curved anime upper eyelash
      const s = isRight ? 1 : -1;
      inkLine(ctx, [
        [ex - s * 0.29 * u * sc, ey - 0.12 * u * sc],
        [ex,                     ey - 0.33 * u * sc],
        [ex + s * 0.33 * u * sc, ey - 0.07 * u * sc]
      ], 1.65, C.eyeLash, 'ink', 0.45);
    },
    happy(ctx, ex, ey, u, sc = 1) {
      inkLine(ctx, [
        [ex - 0.28 * u * sc, ey + 0.05 * u * sc],
        [ex,                 ey - 0.18 * u * sc],
        [ex + 0.28 * u * sc, ey + 0.05 * u * sc]
      ], 1.65, C.eyeLash, 'ink', 0.5);
    },
    wink(ctx, ex, ey, u, sc = 1, o = {}, isRight = false) {
      if (isRight) {
        EYES.happy(ctx, ex, ey, u, sc);
      } else {
        EYES.open(ctx, ex, ey, u, sc, o, false);
      }
    },
    spark(ctx, ex, ey, u, sc = 1, o = {}, isRight = false) {
      EYES.open(ctx, ex, ey, u, sc * 1.06, o, isRight);
      paint(ctx, starPts(ex, ey + 0.02 * u * sc, 0.22 * u * sc, 0.09 * u * sc, 4), { wash: '#FFE45E', ink: null });
    },
    heart(ctx, ex, ey, u, sc = 1, o = {}, isRight = false) {
      EYES.open(ctx, ex, ey, u, sc, o, isRight);
      paint(ctx, heartPts(ex, ey + 0.04 * u * sc, 0.18 * u * sc), { wash: '#FF7597', ink: null });
    },
    wide(ctx, ex, ey, u, sc = 1, o = {}, isRight = false) {
      EYES.open(ctx, ex, ey, u, sc * 1.12, o, isRight);
    },
    cry(ctx, ex, ey, u, sc = 1, o = {}, isRight = false) {
      EYES.open(ctx, ex, ey, u, sc, o, isRight);
      const s = isRight ? 1 : -1;
      paint(ctx, ellPts(ex + s * 0.22 * u * sc, ey + 0.28 * u * sc, 0.09 * u * sc, 0.16 * u * sc, 8), { wash: '#67E8F9', ink: C.ink, sw: 0.5 });
    },
    angry(ctx, ex, ey, u, sc = 1, o = {}, isRight = false) {
      EYES.open(ctx, ex, ey, u, sc * 0.95, o, isRight);
      const s = isRight ? 1 : -1;
      inkLine(ctx, [[ex - s * 0.28 * u * sc, ey - 0.14 * u * sc], [ex + s * 0.28 * u * sc, ey - 0.30 * u * sc]], 1.6, C.ink, 'ink', 0);
    },
    lids(ctx, ex, ey, u, sc = 1, o = {}, isRight = false) {
      EYES.open(ctx, ex, ey, u, sc * 0.92, o, isRight);
      paint(ctx, rectPts(ex - 0.32 * u * sc, ey - 0.35 * u * sc, 0.64 * u * sc, 0.28 * u * sc), { wash: C.skin, ink: null });
      inkLine(ctx, [[ex - 0.31 * u * sc, ey - 0.07 * u * sc], [ex + 0.31 * u * sc, ey - 0.07 * u * sc]], 1.5, C.eyeLash, 'ink', 0);
    },
    dead(ctx, ex, ey, u, sc = 1) {
      inkLine(ctx, [[ex - 0.24 * u * sc, ey], [ex + 0.24 * u * sc, ey]], 1.6, C.eyeLash, 'ink', 0);
    },
    dizzy(ctx, ex, ey, u, sc = 1, o = {}) {
      const t = o.t || 0;
      const pts = [];
      for (let a = 0; a < Math.PI * 3.5; a += 0.4) {
        const r = (a / (Math.PI * 3.5)) * 0.26 * u * sc;
        pts.push([ex + Math.cos(a + t * 8) * r, ey + Math.sin(a + t * 8) * r]);
      }
      inkLine(ctx, pts, 1.2, C.eyeLash, 'ink', 0.3);
    },
    shades(ctx, ex, ey, u, sc = 1) {
      paint(ctx, rrPts(ex - 0.36 * u * sc, ey - 0.20 * u * sc, 0.72 * u * sc, 0.40 * u * sc, 3, 0.5), { wash: '#0F172A', ink: C.ink, sw: 0.9 });
      inkLine(ctx, [[ex - 0.18 * u * sc, ey - 0.08 * u * sc], [ex + 0.08 * u * sc, ey + 0.08 * u * sc]], 0.9, '#E2E8F0', 'ink', 0);
    }
  };

  // ==========================================================================
  // Modular Mouths (`MOUTHS`) — Compatible with cast.js & 42868804351-1-192.mp4
  // ==========================================================================
  const MOUTHS = {
    smile(ctx, mx, my, u) {
      inkLine(ctx, [[mx - 0.17 * u, my - 0.01 * u], [mx, my + 0.08 * u], [mx + 0.17 * u, my - 0.01 * u]], 1.15, '#B84A52', 'ink', 0.5);
    },
    openSmile(ctx, mx, my, u) {
      paint(ctx, [
        [mx - 0.21 * u, my - 0.05 * u],
        [mx + 0.21 * u, my - 0.05 * u],
        [mx + 0.17 * u, my + 0.15 * u],
        [mx,            my + 0.21 * u],
        [mx - 0.17 * u, my + 0.15 * u]
      ], { wash: '#FF9690', ink: '#B84A52', sw: 0.95, curv: 0.35 });
    },
    cat(ctx, mx, my, u) {
      inkLine(ctx, [
        [mx - 0.20 * u, my],
        [mx - 0.07 * u, my + 0.08 * u],
        [mx,            my + 0.01 * u],
        [mx + 0.07 * u, my + 0.08 * u],
        [mx + 0.20 * u, my]
      ], 1.15, '#B84A52', 'ink', 0.4);
    },
    o(ctx, mx, my, u) {
      paint(ctx, ellPts(mx, my + 0.05 * u, 0.18 * u, 0.14 * u, 10), { wash: '#FF9690', ink: '#B84A52', sw: 0.95 });
    },
    waveO(ctx, mx, my, u) {
      paint(ctx, ellPts(mx, my + 0.05 * u, 0.22 * u, 0.15 * u, 12), { wash: '#FF9690', ink: '#B84A52', sw: 0.95 });
    },
    pout(ctx, mx, my, u) {
      inkLine(ctx, [[mx - 0.16 * u, my + 0.08 * u], [mx, my - 0.02 * u], [mx + 0.16 * u, my + 0.08 * u]], 1.15, '#B84A52', 'ink', 0.4);
    },
    grin(ctx, mx, my, u) {
      paint(ctx, [
        [mx - 0.24 * u, my - 0.04 * u],
        [mx + 0.24 * u, my - 0.04 * u],
        [mx + 0.18 * u, my + 0.14 * u],
        [mx - 0.18 * u, my + 0.14 * u]
      ], { wash: '#FFFFFF', ink: '#B84A52', sw: 0.95 });
    },
    flat(ctx, mx, my, u) {
      inkLine(ctx, [[mx - 0.16 * u, my + 0.03 * u], [mx + 0.16 * u, my + 0.03 * u]], 1.1, '#B84A52', 'ink', 0);
    },
    smirk(ctx, mx, my, u) {
      inkLine(ctx, [[mx - 0.14 * u, my + 0.04 * u], [mx + 0.06 * u, my + 0.05 * u], [mx + 0.18 * u, my - 0.04 * u]], 1.15, '#B84A52', 'ink', 0.4);
    }
  };

  // ==========================================================================
  // Modular Overhead Emotes (`EMOTES`)
  // ==========================================================================
  const EMOTES = {
    spout(ctx, x, y, u, k = 1, t = 0) {
      for (const s of [-1, 1]) {
        const pts = [
          [x, y + 0.25 * u],
          [x + s * 0.45 * u * k, y - 0.45 * u * k],
          [x + s * 0.95 * u * k, y - 0.15 * u * k]
        ];
        inkLine(ctx, pts, 1.3, PAL.whaleCyan, 'ink', 0.5);
        paint(ctx, ellPts(x + s * 1.05 * u * k, y - 0.05 * u * k, 0.11 * u, 0.15 * u, 8), { wash: PAL.whaleCyan, ink: null });
      }
    },
    heart(ctx, x, y, u, k = 1, t = 0) {
      const dy = Math.sin(t * 5) * 0.12 * u;
      paint(ctx, heartPts(x + 1.55 * u, y + dy, 0.42 * u * k), { wash: '#FF5C8A', ink: C.ink, sw: 0.85 });
    },
    sparkle(ctx, x, y, u, k = 1, t = 0) {
      const sc = (0.85 + 0.2 * Math.sin(t * 7)) * k;
      paint(ctx, starPts(x - 1.75 * u, y + 0.2 * u, 0.36 * u * sc, 0.14 * u * sc, 4), { wash: PAL.gold, ink: C.ink, sw: 0.7 });
      paint(ctx, starPts(x + 1.75 * u, y + 0.45 * u, 0.28 * u * sc, 0.11 * u * sc, 4), { wash: PAL.whaleCyan, ink: C.ink, sw: 0.7 });
    },
    sweat(ctx, x, y, u, k = 1, t = 0) {
      const dy = ((t * 2.2) % 1) * 0.35 * u;
      paint(ctx, [
        [x + 1.65 * u, y + 0.45 * u + dy],
        [x + 1.82 * u, y + 0.85 * u + dy],
        [x + 1.65 * u, y + 1.02 * u + dy],
        [x + 1.48 * u, y + 0.85 * u + dy]
      ], { wash: '#67E8F9', ink: C.ink, sw: 0.75, curv: 0.4 });
    },
    anger(ctx, x, y, u, k = 1) {
      const ax = x + 1.35 * u, ay = y + 0.45 * u, r = 0.26 * u * k;
      inkLine(ctx, [[ax - r, ay - r * 0.3], [ax - r * 0.3, ay - r * 0.3], [ax - r * 0.3, ay - r]], 1.4, '#EF4444', 'ink', 0);
      inkLine(ctx, [[ax + r, ay - r * 0.3], [ax + r * 0.3, ay - r * 0.3], [ax + r * 0.3, ay - r]], 1.4, '#EF4444', 'ink', 0);
      inkLine(ctx, [[ax - r, ay + r * 0.3], [ax - r * 0.3, ay + r * 0.3], [ax - r * 0.3, ay + r]], 1.4, '#EF4444', 'ink', 0);
      inkLine(ctx, [[ax + r, ay + r * 0.3], [ax + r * 0.3, ay + r * 0.3], [ax + r * 0.3, ay + r]], 1.4, '#EF4444', 'ink', 0);
    },
    exclaim(ctx, x, y, u, k = 1) {
      paint(ctx, rrPts(x - 0.12 * u, y - 0.65 * u, 0.24 * u, 0.62 * u * k, 3, 0.4), { wash: '#FF4D6D', ink: C.ink, sw: 0.85 });
      paint(ctx, ellPts(x, y + 0.18 * u, 0.13 * u, 0.13 * u, 8), { wash: '#FF4D6D', ink: C.ink, sw: 0.85 });
    },
    question(ctx, x, y, u, k = 1) {
      letter(ctx, '?', x + 1.65 * u, y + 0.25 * u, Math.round(0.95 * u * k), PAL.gold, { stroke: C.ink });
    },
    music(ctx, x, y, u, k = 1, t = 0) {
      const ny = ((t * 1.8) % 1) * 0.55 * u;
      const mx = x + 1.75 * u, my = y + 0.45 * u - ny;
      paint(ctx, ellPts(mx, my, 0.16 * u * k, 0.12 * u * k, 8), { wash: PAL.whaleCyan, ink: C.ink, sw: 0.75 });
      inkLine(ctx, [[mx + 0.14 * u * k, my], [mx + 0.14 * u * k, my - 0.48 * u * k], [mx + 0.38 * u * k, my - 0.38 * u * k]], 1.3, PAL.whaleCyan, 'ink', 0);
    },
    idea(ctx, x, y, u, k = 1) {
      paint(ctx, ellPts(x, y - 0.25 * u, 0.32 * u * k, 0.36 * u * k, 12), { wash: '#FEF08A', fill: PAL.gold, fillOp: 140, ink: C.ink, sw: 0.85 });
      paint(ctx, rectPts(x - 0.14 * u * k, y + 0.12 * u, 0.28 * u * k, 0.16 * u * k), { wash: '#94A3B8', ink: C.ink, sw: 0.75 });
    },
    zzz(ctx, x, y, u, k = 1, t = 0) {
      const dy = ((t * 1.2) % 1) * 0.45 * u;
      letter(ctx, 'Zzz', x + 1.65 * u, y + 0.25 * u - dy, Math.round(0.65 * u * k), '#93C5FD', { stroke: C.ink });
    }
  };

  // ==========================================================================
  // 31 Acted Emotions (`EMO`) — Exact counterpart to ClaudeAnimationBase
  // Maps directly onto the 5 canonical poses of 42868804351-1-192.mp4 + variations
  // ==========================================================================
  const EMO = {
    neutral:     { poseMode: 'wave',   eyes: 'open',  mouth: 'smile',     blush: false },
    idle:        { poseMode: 'wave',   eyes: 'open',  mouth: 'smile',     blush: false },
    calm:        { poseMode: 'laptop', eyes: 'open',  mouth: 'smile',     tailSit: true },
    happy:       { poseMode: 'wave',   eyes: 'open',  mouth: 'openSmile', blush: true,  waveArm: true },
    excited:     { poseMode: 'wave',   eyes: 'spark', mouth: 'openSmile', blush: true,  waveArm: true, emote: 'sparkle' },
    joy:         { poseMode: 'heart',  eyes: 'happy', mouth: 'openSmile', blush: true,  heartHands: true, emote: 'heart' },
    love:        { poseMode: 'heart',  eyes: 'happy', mouth: 'cat',       blush: true,  heartHands: true, emote: 'heart' },
    starstruck:  { poseMode: 'wave',   eyes: 'spark', mouth: 'openSmile', blush: true,  emote: 'sparkle' },
    wink:        { poseMode: 'wink',   eyes: 'wink',  mouth: 'cat',       blush: true,  hips: true, tailMode: 'highRight' },
    smug:        { poseMode: 'wink',   eyes: 'lids',  mouth: 'smirk',     blush: false, hips: true, tailMode: 'highRight' },
    proud:       { poseMode: 'wink',   eyes: 'happy', mouth: 'grin',      blush: true,  hips: true, tailMode: 'highRight', emote: 'sparkle' },
    laugh:       { poseMode: 'wave',   eyes: 'happy', mouth: 'openSmile', blush: true,  waveArm: true },
    singing:     { poseMode: 'wave',   eyes: 'happy', mouth: 'openSmile', blush: true,  emote: 'music' },
    surprised:   { poseMode: 'panic',  eyes: 'wide',  mouth: 'o',         blush: true,  emote: 'exclaim' },
    shocked:     { poseMode: 'panic',  eyes: 'wide',  mouth: 'waveO',     blush: true,  cheekHands: true, emote: 'exclaim' },
    panic:       { poseMode: 'panic',  eyes: 'wide',  mouth: 'waveO',     blush: true,  cheekHands: true, emote: 'sweat' },
    nervous:     { poseMode: 'panic',  eyes: 'open',  mouth: 'waveO',     blush: true,  emote: 'sweat' },
    confused:    { poseMode: 'wave',   eyes: 'open',  mouth: 'flat',      headTilt: 0.14, emote: 'question' },
    question:    { poseMode: 'wave',   eyes: 'open',  mouth: 'o',         headTilt: 0.16, emote: 'question' },
    idea:        { poseMode: 'wave',   eyes: 'spark', mouth: 'openSmile', emote: 'idea' },
    thinking:    { poseMode: 'laptop', eyes: 'open',  mouth: 'flat',      tailSit: true, lookX: -1 },
    typing:      { poseMode: 'laptop', eyes: 'open',  mouth: 'smile',     tailSit: true },
    focused:     { poseMode: 'laptop', eyes: 'open',  mouth: 'flat',      tailSit: true },
    sad:         { poseMode: 'panic',  eyes: 'cry',   mouth: 'pout',      blush: false, emote: 'sweat' },
    cry:         { poseMode: 'panic',  eyes: 'cry',   mouth: 'waveO',     blush: true,  emote: 'sweat' },
    sob:         { poseMode: 'panic',  eyes: 'happy', mouth: 'waveO',     blush: true,  emote: 'sweat' },
    pout:        { poseMode: 'wink',   eyes: 'angry', mouth: 'pout',      blush: true,  hips: true },
    angry:       { poseMode: 'wink',   eyes: 'angry', mouth: 'pout',      blush: false, hips: true, emote: 'anger' },
    rage:        { poseMode: 'panic',  eyes: 'angry', mouth: 'waveO',     blush: true,  emote: 'anger' },
    deadpan:     { poseMode: 'wave',   eyes: 'lids',  mouth: 'flat',      blush: false },
    sleepy:      { poseMode: 'laptop', eyes: 'lids',  mouth: 'o',         tailSit: true, emote: 'zzz' }
  };

  const HATS = {
    maid: true, maidHeadband: true, crown: true, wizard: true, hard: true, hardHat: true,
    sweatband: true, diving: true, headphones: true, headset: true, party: true,
    halo: true, top: true, topHat: true, fedora: true, flower: true, cat: true, chef: true
  };

  function feel(name, t = 0, extra = {}) {
    const base = EMO[name] || EMO.happy;
    return Object.assign({}, base, { emotion: name, t }, extra);
  }

  function emotions(t, timeline = []) {
    let cur = 'happy';
    for (let i = 0; i < timeline.length; i++) {
      if (t >= timeline[i][0]) cur = timeline[i][1];
    }
    return feel(cur, t);
  }

  function move(mode = 'bounce', t = 0, seed = 0) {
    const ph = t * 6.5 + seed * 1.7;
    if (mode === 'walk' || mode === 'run') {
      const sp = mode === 'run' ? 11.5 : 7.5;
      const w = t * sp + seed;
      return {
        walk: w,
        dy: -Math.abs(Math.sin(w)) * 0.22,
        sq: Math.sin(w * 2) * 0.04,
        hipL: Math.sin(w) * 0.28,
        hipR: -Math.sin(w) * 0.28
      };
    }
    if (mode === 'wave') {
      return {
        dy: -Math.abs(Math.sin(ph)) * 0.14,
        sq: Math.sin(ph) * 0.03,
        waveArm: true
      };
    }
    if (mode === 'dance') {
      return {
        dy: -Math.abs(Math.sin(ph * 1.2)) * 0.24,
        sq: Math.sin(ph * 2.4) * 0.06,
        headTilt: Math.sin(ph) * 0.09,
        hipL: Math.sin(ph) * 0.18,
        hipR: -Math.sin(ph) * 0.18
      };
    }
    if (mode === 'shiver') {
      return {
        dx: Math.sin(t * 45) * 0.08,
        dy: 0,
        sq: -0.03
      };
    }
    return {
      dy: -Math.abs(Math.sin(ph)) * 0.14,
      sq: Math.sin(ph) * 0.03
    };
  }

  function turn(t, t0, dur, fromView = 'front', toView = 'side') {
    const p = clamp((t - t0) / Math.max(0.001, dur), 0, 1);
    const i0 = Math.max(0, VIEWS.indexOf(fromView));
    const i1 = Math.max(0, VIEWS.indexOf(toView));
    const idx = Math.round(lerp(i0, i1, p));
    return { view: VIEWS[idx] || toView };
  }

  function spinView(t, speed = 4.0) {
    const idx = Math.floor(t * speed) % VIEWS.length;
    return { view: VIEWS[idx] };
  }

  function resolvePoseKey(o = {}) {
    if (o.poseMode && ['wave', 'wink', 'panic', 'laptop', 'heart'].includes(o.poseMode)) {
      return o.poseMode;
    }
    if (o.tailSit || o.tailMode === 'cushion' || o.laptop) return 'laptop';
    if (o.heartHands || o.eyes === 'heart' || o.emotion === 'love' || o.emotion === 'joy') return 'heart';
    if (o.hips || o.tailMode === 'highRight' || o.eyes === 'wink' || o.emotion === 'wink' || o.emotion === 'smug' || o.emotion === 'proud') return 'wink';
    if (o.cheekHands || ['panic', 'shocked', 'surprised', 'cry', 'sob', 'sad', 'rage', 'angry'].includes(o.emotion) || o.eyes === 'wide' || o.eyes === 'cry') return 'panic';
    return 'wave';
  }

  // ==========================================================================
  // Main Character Renderer: `whaleGirl(ctx, x, y, u = 20, o = {})`
  // ==========================================================================
  function whaleGirl(ctx, x, y, u = 20, o = {}) {
    boilSeed('whaleGirl' + Math.round(x));
    const t = o.t ?? 0;
    const style = o.style || (typeof getActiveStyle === 'function' ? getActiveStyle() : 'pixel');
    const view = o.view || 'front';
    const vx = VIEW_VX[view] || 0;
    const isBack = view === 'back';
    const isQBack = view === 'qback';

    const sq = clamp(o.sq || 0, -0.35, 0.35);
    const sx = (1 - sq * 0.55) * (o.flip ? -1 : 1);
    const sy = 1 + sq * 0.65;
    const dx = (o.dx || 0) * u;
    const dy = (o.dy ?? -0.10 * pulse(t)) * u;

    const headBob = Math.sin(t * 4.2) * 0.04 * u;
    const headTilt = (o.headTilt || 0) + Math.sin(t * 2.1) * 0.03;
    const poseKey = resolvePoseKey(o);

    // Motion smear ghost (ClaudeAnimationBase style)
    if (o.smear && o.smear > 0.05) {
      ctx.save();
      ctx.globalAlpha = 0.25 * clamp(o.smear, 0, 1);
      paint(ctx, ellPts(x - 1.8 * u * o.smear, y - 4.5 * u, 2.2 * u, 3.8 * u, 16), { wash: C.hairLight, ink: null });
      ctx.restore();
    }

    // Ground shadow
    if (!o.noShadow) {
      paint(ctx, ellPts(x + dx, y + 0.10 * u, 2.45 * u, 0.44 * u, 16), { wash: C.ink, washOp: 68, ink: null });
    }

    ctx.save();
    ctx.translate(x + dx, y + dy);
    ctx.scale(sx, sy);

    // Decide whether to render via Mode A (Articulated 7-Bone Rig from 42868804351-1-192.mp4)
    // or Mode B (Multi-View Turnaround Vector/Brush Anatomy for q/side/qback/back or explicit 'vector' mode)
    const usePixelRig = (
      root.WHALE_GIRL_PIXEL_RIG &&
      view === 'front' &&
      o.constructMode !== 'vector'
    );

    if (usePixelRig) {
      drawArticulatedPixelRig(ctx, u, t, o, poseKey, headBob, headTilt, style);
    } else {
      drawVectorConstruct(ctx, u, t, o, poseKey, view, vx, isBack, isQBack, headBob, headTilt, style);
    }

    ctx.restore();
  }

  // ==========================================================================
  // MODE A: Articulated 7-Bone Pixel-Grid Rig (100% faithful to 42868804351-1-192.mp4)
  // Bones: tail, backHair, legL, legR, torso, armR, head + dynamic face/hat/props
  // ==========================================================================
  function drawArticulatedPixelRig(ctx, u, t, o, poseKey, headBob, headTilt, style) {
    const rig = root.WHALE_GIRL_PIXEL_RIG;
    const basePal = rig.palette;
    const poseBones = rig.poses[poseKey] || rig.poses.wave;
    const cell = u / rig.scale; // 1u = 10 grid cells; total character height ~9.5u

    // Style-specific palette transformation so Watercolor, Ukiyo-e, Risograph, and Neon look distinct
    const pal = basePal.map((hex) => {
      if (style === 'ukiyoe') return mixCol(hex, '#E8D5B5', 0.22);
      if (style === 'risograph') return mixCol(hex, '#FF5C8A', 0.14);
      if (style === 'neon') return mixCol(hex, '#00F5D4', 0.16);
      if (style === 'watercolor') return mixCol(hex, '#FFF8EE', 0.08);
      return hex;
    });

    const tailWag = Math.sin(t * 3.5) * 0.065;
    const hairSway = Math.sin(t * 2.4) * 0.032;
    const walkW = o.walk || 0;
    const hipL = o.hipL !== undefined ? o.hipL : (walkW ? Math.sin(walkW) * 0.28 : 0);
    const hipR = o.hipR !== undefined ? o.hipR : (walkW ? -Math.sin(walkW) * 0.28 : 0);

    const isSmoothBrush = (style === 'watercolor' || style === 'ukiyoe' || style === 'risograph') && o.constructMode !== 'pixelRig';

    const drawBoneRuns = (runs) => {
      if (!runs || !runs.length) return;
      let lastCol = -1;
      for (let i = 0; i < runs.length; i++) {
        const r = runs[i];
        const gy = r[0], gx1 = r[1], gx2 = r[2], cIdx = r[3];
        if (cIdx !== lastCol) {
          ctx.fillStyle = pal[cIdx];
          lastCol = cIdx;
        }
        if (isSmoothBrush) {
          const rx = (gx1 - 0.65) * cell;
          const ry = (gy - 0.65) * cell;
          const rw = (gx2 - gx1 + 1.35) * cell;
          const rh = cell * 1.35;
          ctx.beginPath();
          ctx.roundRect(rx, ry, rw, rh, cell * 0.48);
          ctx.fill();
        } else {
          ctx.fillRect(
            (gx1 - 0.5) * cell,
            (gy - 0.5) * cell,
            (gx2 - gx1 + 1) * cell + 0.45,
            cell + 0.45
          );
        }
      }
    };

    // Optional neon rim glow or risograph offset layer
    if (style === 'neon') {
      ctx.save();
      ctx.shadowColor = '#00F5D4';
      ctx.shadowBlur = 10;
      ctx.restore();
    } else if (style === 'risograph') {
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.translate(2.2, -1.8);
      ctx.fillStyle = '#FF3E88';
      for (const r of poseBones.torso) {
        ctx.fillRect((r[1] - 0.5) * cell, (r[0] - 0.5) * cell, (r[2] - r[1] + 1) * cell, cell);
      }
      ctx.restore();
    }

    // 1. Back Hair Bone (shares upper-body headBob so there is zero vertical seam!)
    if (poseKey !== 'wink') {
      ctx.save();
      ctx.translate(0, -5.2 * u + headBob);
      ctx.rotate(hairSway * 0.45);
      ctx.translate(0, 5.2 * u);
      drawBoneRuns(poseBones.backHair);
      ctx.restore();
    }

    // 2. Whale Tail Bone (wags dynamically around hip pivot!)
    ctx.save();
    if (poseKey === 'laptop') {
      const cBreathe = 1 + Math.sin(t * 3.0) * 0.015;
      ctx.scale(cBreathe, 1 / cBreathe);
      drawBoneRuns(poseBones.tail);
    } else {
      const px = poseKey === 'wave' ? -1.0 * u : 1.0 * u;
      const py = -1.8 * u;
      ctx.translate(px, py + headBob * 0.5);
      ctx.rotate(tailWag * (poseKey === 'wave' ? -1 : 1));
      ctx.translate(-px, -py);
      drawBoneRuns(poseBones.tail);
    }
    ctx.restore();

    if (poseKey === 'wink') {
      ctx.save();
      ctx.translate(0, -5.2 * u + headBob);
      ctx.rotate(hairSway * 0.45);
      ctx.translate(0, 5.2 * u);
      drawBoneRuns(poseBones.backHair);
      ctx.restore();
    }

    // 3. Left & Right Leg Bones (articulate with hipL & hipR)
    if (poseKey !== 'laptop') {
      ctx.save();
      ctx.translate(-0.72 * u, -1.35 * u);
      ctx.rotate(hipL);
      ctx.translate(0.72 * u, 1.35 * u);
      drawBoneRuns(poseBones.legL);
      ctx.restore();

      ctx.save();
      ctx.translate(0.72 * u, -1.35 * u);
      ctx.rotate(hipR);
      ctx.translate(-0.72 * u, 1.35 * u);
      drawBoneRuns(poseBones.legR);
      ctx.restore();
    }

    // 4. Torso, Bodice, Apron & Skirt Bone (shares upper-body headBob)
    ctx.save();
    ctx.translate(0, headBob);
    drawBoneRuns(poseBones.torso);
    ctx.restore();

    // 5. Waving Right Arm Bone (in wave pose)
    if (poseBones.armR && poseBones.armR.length > 0) {
      const waveRot = o.waveArm ? Math.sin(t * 8.5) * 0.08 : Math.sin(t * 4.0) * 0.03;
      ctx.save();
      ctx.translate(1.55 * u, -4.55 * u + headBob);
      ctx.rotate(waveRot);
      ctx.translate(-1.55 * u, 4.55 * u);
      drawBoneRuns(poseBones.armR);
      ctx.restore();
    }

    // Prop attachment hooks (`armL` / `armR` callbacks)
    if (typeof o.armL === 'function') {
      ctx.save();
      ctx.translate(-1.75 * u, -3.15 * u + headBob);
      o.armL(ctx, u, style);
      ctx.restore();
    }
    if (typeof o.armR === 'function') {
      ctx.save();
      ctx.translate(1.85 * u, (poseKey === 'wave' ? -5.15 : -3.15) * u + headBob);
      o.armR(ctx, u, style);
      ctx.restore();
    }

    // 6. Head Bone (tilts & nods around neck pivot)
    let headPoseKey = poseKey;
    if (o.eyes === 'happy' && poseKey !== 'laptop' && poseKey !== 'heart') {
      headPoseKey = 'heart';
    }
    const headRuns = (rig.poses[headPoseKey] || poseBones).head;
    const neckY = (poseKey === 'laptop' ? -3.85 : -4.68) * u;
    ctx.save();
    ctx.translate(0, neckY + headBob);
    ctx.rotate(headTilt * 0.45);
    ctx.translate(0, -neckY);
    drawBoneRuns(headRuns);

    // Layer surgical pixel-art emotion details directly at the exact eye/mouth coordinates
    // of 42868804351-1-192.mp4 (left eye: -0.60u, right eye: +0.56u, eyeY: -5.82u) without erasing bangs!
    const faceOffsetY = (poseKey === 'laptop' ? 0.85 : 0) * u;
    ctx.save();
    ctx.translate(0, faceOffsetY);
    const eLx = -0.60 * u, eRx = 0.56 * u, eY = -5.82 * u;

    if (o.eyes === 'spark') {
      // Crisp golden 4-point star sparkles inside both pupils!
      paint(ctx, starPts(eLx, eY, 0.24 * u, 0.09 * u, 4), { wash: '#FFE45E', ink: C.ink, sw: 0.55 });
      paint(ctx, starPts(eRx, eY, 0.24 * u, 0.09 * u, 4), { wash: '#FFE45E', ink: C.ink, sw: 0.55 });
    } else if (o.eyes === 'lids') {
      // Half-lidded smug/deadpan/sleepy upper eyelids right over the upper iris
      ctx.fillStyle = C.skin;
      ctx.fillRect(eLx - 0.26 * u, eY - 0.24 * u, 0.52 * u, 0.22 * u);
      ctx.fillRect(eRx - 0.26 * u, eY - 0.24 * u, 0.52 * u, 0.22 * u);
      ctx.fillStyle = C.eyeLash;
      ctx.fillRect(eLx - 0.28 * u, eY - 0.04 * u, 0.56 * u, 0.07 * u);
      ctx.fillRect(eRx - 0.28 * u, eY - 0.04 * u, 0.56 * u, 0.07 * u);
    } else if (o.eyes === 'cry') {
      // Glowing cyan teardrops at outer eye corners
      paint(ctx, ellPts(eLx - 0.22 * u, eY + 0.20 * u, 0.09 * u, 0.16 * u, 8), { wash: '#67E8F9', ink: C.ink, sw: 0.5 });
      paint(ctx, ellPts(eRx + 0.22 * u, eY + 0.20 * u, 0.09 * u, 0.16 * u, 8), { wash: '#67E8F9', ink: C.ink, sw: 0.5 });
    } else if (o.eyes === 'angry') {
      // Sharp angled angry/pouty eyebrows
      inkLine(ctx, [[eLx - 0.24 * u, eY - 0.34 * u], [eLx + 0.22 * u, eY - 0.18 * u]], 1.6, C.ink, 'ink', 0);
      inkLine(ctx, [[eRx + 0.24 * u, eY - 0.34 * u], [eRx - 0.22 * u, eY - 0.18 * u]], 1.6, C.ink, 'ink', 0);
    }

    // Lip-sync talking animation when singing/speaking in MV
    if (o.talking && (Math.floor(t * 9) % 2 === 1) && poseKey !== 'heart' && poseKey !== 'panic') {
      paint(ctx, ellPts(-0.02 * u, -5.28 * u, 0.14 * u, 0.11 * u, 8), { wash: C.skin, ink: null });
      inkLine(ctx, [[-0.14 * u, -5.28 * u], [0.10 * u, -5.28 * u]], 1.1, '#B84A52', 'ink', 0);
    }
    ctx.restore();

    // Overhead Emotes & Hats
    ctx.save();
    ctx.translate(0, faceOffsetY);
    if (o.emote && EMOTES[o.emote]) {
      EMOTES[o.emote](ctx, 0, -8.85 * u, u, o.emoteK ?? 1, t);
    }
    if (o.hat && o.hat !== 'none' && o.hat !== 'maid' && o.hat !== 'maidHeadband') {
      drawHat(ctx, u, t, o.hat, 0);
    }
    ctx.restore();

    ctx.restore();
  }

  // ==========================================================================
  // MODE B: Exact-Proportion Vector/Brush Multi-Polygon Anatomy
  // Uses CORE.paint & CORE.inkLine with exact 42868804351-1-192.mp4 landmarks
  // ==========================================================================
  function drawVectorConstruct(ctx, u, t, o, poseKey, view, vx, isBack, isQBack, headBob, headTilt, style) {
    const isTailSit = poseKey === 'laptop';
    const sitDrop = isTailSit ? 0.85 * u : 0;

    ctx.save();
    ctx.translate(0, sitDrop);

    // 1. Wide Wavy Back Hair Cascade (4-tier blue-to-cyan gradient waves, ±3.82u wide!)
    drawVectorBackHair(ctx, u, t, vx);

    // 2. Glossy Whale Tail (behind skirt for standing poses)
    const tailMode = o.tailMode || (
      poseKey === 'wink' ? 'highRight' :
      (poseKey === 'panic' || poseKey === 'heart') ? 'lowRight' :
      poseKey === 'laptop' ? 'cushion' : 'left'
    );
    if (!isTailSit) {
      drawVectorTail(ctx, u, t, tailMode);
    }

    // 3. Legs, Ruffled White Lace Socks & Dark-Navy Mary-Jane Shoes
    const walkW = o.walk || 0;
    const hipL = o.hipL !== undefined ? o.hipL : (walkW ? Math.sin(walkW) * 0.30 : 0);
    const hipR = o.hipR !== undefined ? o.hipR : (walkW ? -Math.sin(walkW) * 0.30 : 0);
    if (!isTailSit) {
      drawVectorLeg(ctx, u, -0.74 * u + vx * 0.15 * u, -1.42 * u, hipL, false);
      drawVectorLeg(ctx, u,  0.74 * u + vx * 0.15 * u, -1.42 * u, hipR, true);
    }

    // 4. Torso: Bodice, Twin White Ruffled Suspenders, High Collar, Navy Bow,
    //    Flared Dark-Navy Pleated Skirt, Gold Bows, Double Petticoat & Whale Apron
    drawVectorTorsoAndSkirt(ctx, u, t, vx, isBack || isQBack, headBob);

    // 4b. Giant U-curled Whale Tail Cushion (Pose 4: laptop)
    if (isTailSit) {
      ctx.save();
      ctx.translate(0, -sitDrop);
      drawVectorTailCushion(ctx, u, t);
      ctx.restore();
    }

    // 5. Puffed Navy Sleeves, Ruffled White Cuffs & Articulated Arms / Laptop
    drawVectorArms(ctx, u, t, o, poseKey, headBob, style);

    // 6. Chibi Head: Royal-Blue Hair Dome (-2.02u..+2.02u), Crescent White Ruffled Headband
    //    down to -6.22u, Blue Side Bows, Whale Fin-Ears, Narrow 2.48u Peach Skin Face,
    //    Large Anime Eyes (±0.64u, -5.66u), Cyan Cheek Locks, Bangs & Looped Ahoge
    ctx.save();
    ctx.translate(vx * 0.22 * u, -4.68 * u + headBob);
    ctx.rotate(headTilt);
    ctx.translate(0, 4.68 * u);

    drawVectorHeadBase(ctx, u, t, vx, isBack, isQBack, o.hat);
    if (!isBack && !isQBack) {
      drawVectorFaceFeatures(ctx, u, t, o, vx, false);
    }
    drawVectorForeheadBangs(ctx, u, t, vx, isBack);

    if (o.emote && EMOTES[o.emote]) {
      EMOTES[o.emote](ctx, vx * 0.22 * u, -8.85 * u, u, o.emoteK ?? 1, t);
    }
    if (o.hat && o.hat !== 'none' && o.hat !== 'maid' && o.hat !== 'maidHeadband') {
      drawHat(ctx, u, t, o.hat, vx);
    }
    ctx.restore();

    ctx.restore();
  }

  function drawVectorBackHair(ctx, u, t, vx) {
    const w1 = Math.sin(t * 2.5) * 0.09 * u;
    const w2 = Math.cos(t * 2.1 + 1.1) * 0.11 * u;
    const offX = -vx * 0.22 * u;

    // Tier 1: Full outer wavy silhouette in Royal Blue
    const outer = [
      [offX - 2.05 * u, -6.55 * u],
      [offX - 2.68 * u + w1 * 0.3, -5.35 * u],
      [offX - 3.38 * u + w1 * 0.6, -4.30 * u],
      [offX - 3.76 * u + w1,       -3.45 * u],
      [offX - 3.58 * u + w2,       -2.65 * u],
      [offX - 3.18 * u + w1 * 0.7, -2.18 * u],
      [offX - 3.36 * u + w2,       -1.82 * u],
      [offX - 2.78 * u + w2 * 0.7, -1.36 * u],
      [offX - 2.12 * u,            -1.72 * u],
      [offX - 1.82 * u,            -1.42 * u],
      [offX,                       -1.55 * u],
      [offX + 1.82 * u,            -1.42 * u],
      [offX + 2.12 * u,            -1.72 * u],
      [offX + 2.78 * u - w2 * 0.7, -1.36 * u],
      [offX + 3.36 * u - w2,       -1.82 * u],
      [offX + 3.18 * u - w1 * 0.7, -2.18 * u],
      [offX + 3.58 * u - w2,       -2.65 * u],
      [offX + 3.76 * u - w1,       -3.45 * u],
      [offX + 3.38 * u - w1 * 0.6, -4.30 * u],
      [offX + 2.68 * u - w1 * 0.3, -5.35 * u],
      [offX + 2.05 * u,            -6.55 * u]
    ];
    paint(ctx, outer, { wash: C.hairMain, fill: C.hairDark, fillOp: 85, ink: C.ink, sw: 1.15, curv: 0.35 });

    // Tier 2: Mid Sky-Blue wavy locks with deeply scalloped V-wave top transition (no flat line!)
    const midTier = [
      [offX - 3.32 * u + w1 * 0.6, -4.35 * u],
      [offX - 3.72 * u + w1,       -3.45 * u],
      [offX - 3.55 * u + w2,       -2.65 * u],
      [offX - 3.15 * u + w1 * 0.7, -2.18 * u],
      [offX - 3.32 * u + w2,       -1.82 * u],
      [offX - 2.75 * u + w2 * 0.7, -1.38 * u],
      [offX - 1.85 * u,            -1.52 * u],
      [offX + 1.85 * u,            -1.52 * u],
      [offX + 2.75 * u - w2 * 0.7, -1.38 * u],
      [offX + 3.32 * u - w2,       -1.82 * u],
      [offX + 3.15 * u - w1 * 0.7, -2.18 * u],
      [offX + 3.55 * u - w2,       -2.65 * u],
      [offX + 3.72 * u - w1,       -3.45 * u],
      [offX + 3.32 * u - w1 * 0.6, -4.35 * u],
      [offX + 2.65 * u,            -3.55 * u],
      [offX + 2.15 * u,            -4.45 * u],
      [offX,                       -3.45 * u],
      [offX - 2.15 * u,            -4.45 * u],
      [offX - 2.65 * u,            -3.55 * u]
    ];
    paint(ctx, midTier, { wash: C.hairLight, fill: C.hairMid, fillOp: 95, ink: null, curv: 0.35 });

    // Tier 3: Luminous Aqua-Cyan lower wave curls with deep W-wave top transition
    const cyanTier = [
      [offX - 3.58 * u + w2,       -2.85 * u],
      [offX - 3.14 * u + w1 * 0.7, -2.18 * u],
      [offX - 3.32 * u + w2,       -1.82 * u],
      [offX - 2.75 * u + w2 * 0.7, -1.38 * u],
      [offX - 2.10 * u,            -1.70 * u],
      [offX - 1.80 * u,            -1.45 * u],
      [offX + 1.80 * u,            -1.45 * u],
      [offX + 2.10 * u,            -1.70 * u],
      [offX + 2.75 * u - w2 * 0.7, -1.38 * u],
      [offX + 3.32 * u - w2,       -1.82 * u],
      [offX + 3.14 * u - w1 * 0.7, -2.18 * u],
      [offX + 3.58 * u - w2,       -2.85 * u],
      [offX + 2.85 * u,            -2.15 * u],
      [offX + 2.35 * u,            -2.95 * u],
      [offX,                       -2.05 * u],
      [offX - 2.35 * u,            -2.95 * u],
      [offX - 2.85 * u,            -2.15 * u]
    ];
    paint(ctx, cyanTier, { wash: C.hairCyan, fill: C.hairGlow, fillOp: 80, ink: null, curv: 0.35 });

    // Re-stroke outer contour and internal flowing hair strands
    inkLine(ctx, outer.concat([outer[0]]), 1.15, C.ink, 'ink', 0.35);
    for (const side of [-1, 1]) {
      const sw = side < 0 ? w2 : -w2;
      inkLine(ctx, [
        [offX + side * 2.25 * u, -5.20 * u],
        [offX + side * 3.12 * u + sw * 0.5, -3.75 * u],
        [offX + side * 2.88 * u + sw * 0.7, -2.25 * u],
        [offX + side * 3.05 * u + sw * 0.8, -1.65 * u]
      ], 0.85, C.hairDark, 'ink', 0.45);
      inkLine(ctx, [
        [offX + side * 2.05 * u, -4.60 * u],
        [offX + side * 2.65 * u + sw * 0.4, -3.20 * u],
        [offX + side * 2.45 * u + sw * 0.5, -1.85 * u]
      ], 0.8, C.hairDark, 'ink', 0.45);
    }
  }

  function drawVectorTail(ctx, u, t, tailMode) {
    const wag = Math.sin(t * 3.4) * 0.14 * u;
    if (tailMode === 'highRight') {
      const tailPts = [
        [ 0.95 * u, -1.35 * u],
        [ 2.35 * u, -1.55 * u],
        [ 3.85 * u, -2.55 * u + wag * 0.3],
        [ 4.45 * u, -4.35 * u + wag * 0.6],
        [ 4.35 * u, -6.15 * u + wag],
        [ 4.85 * u, -6.95 * u + wag],
        [ 4.82 * u, -7.85 * u + wag],
        [ 3.95 * u, -7.45 * u + wag],
        [ 3.45 * u, -8.35 * u + wag],
        [ 2.75 * u, -7.85 * u + wag],
        [ 3.15 * u, -6.45 * u + wag * 0.8],
        [ 2.95 * u, -4.55 * u + wag * 0.5],
        [ 2.15 * u, -2.85 * u],
        [ 0.95 * u, -2.25 * u]
      ];
      paint(ctx, tailPts, { wash: C.tailDark, fill: C.tailMid, fillOp: 110, ink: C.ink, sw: 1.15, curv: 0.3 });
      return;
    }
    if (tailMode === 'lowRight') {
      const tailPts = [
        [ 0.85 * u, -1.15 * u],
        [ 2.15 * u, -0.65 * u],
        [ 3.35 * u, -0.85 * u + wag * 0.4],
        [ 3.95 * u, -1.65 * u + wag * 0.7],
        [ 4.12 * u, -2.75 * u + wag],
        [ 3.55 * u, -2.45 * u + wag],
        [ 3.35 * u, -3.25 * u + wag],
        [ 2.65 * u, -2.55 * u + wag * 0.8],
        [ 2.85 * u, -1.65 * u + wag * 0.5],
        [ 1.85 * u, -1.45 * u],
        [ 0.85 * u, -1.75 * u]
      ];
      paint(ctx, tailPts, { wash: C.tailDark, fill: C.tailMid, fillOp: 110, ink: C.ink, sw: 1.15, curv: 0.3 });
      return;
    }
    // Default left tail (wave pose)
    const tailPts = [
      [-0.85 * u, -1.05 * u],
      [-1.95 * u, -0.48 * u],
      [-3.05 * u, -0.78 * u + wag * 0.3],
      [-3.85 * u, -1.55 * u + wag * 0.6],
      [-3.95 * u, -2.25 * u + wag * 0.8],
      [-4.52 * u, -2.45 * u + wag],
      [-4.35 * u, -3.12 * u + wag],
      [-3.55 * u, -2.68 * u + wag],
      [-3.18 * u, -3.18 * u + wag],
      [-2.75 * u, -2.45 * u + wag * 0.8],
      [-3.15 * u, -1.85 * u + wag * 0.6],
      [-2.35 * u, -1.25 * u + wag * 0.3],
      [-0.95 * u, -1.65 * u]
    ];
    paint(ctx, tailPts, { wash: C.tailDark, fill: C.tailMid, fillOp: 110, ink: C.ink, sw: 1.15, curv: 0.3 });
  }

  function drawVectorTailCushion(ctx, u, t) {
    const wag = Math.sin(t * 3.2) * 0.08 * u;
    const cushionPts = [
      [ 1.65 * u, -2.55 * u],
      [ 3.15 * u, -2.05 * u],
      [ 3.45 * u, -1.05 * u],
      [ 2.95 * u, -0.18 * u],
      [ 1.35 * u,  0.04 * u],
      [-0.65 * u,  0.02 * u],
      [-2.05 * u, -0.45 * u],
      [-2.55 * u, -1.05 * u + wag * 0.5],
      [-3.32 * u, -0.75 * u + wag],
      [-3.15 * u, -1.45 * u + wag],
      [-2.38 * u, -1.42 * u + wag],
      [-2.35 * u, -2.18 * u + wag],
      [-1.68 * u, -1.75 * u + wag * 0.7],
      [-1.65 * u, -1.05 * u],
      [-0.45 * u, -0.78 * u],
      [ 1.45 * u, -0.82 * u],
      [ 2.25 * u, -1.45 * u],
      [ 1.45 * u, -2.05 * u]
    ];
    paint(ctx, cushionPts, { wash: C.tailDark, fill: C.tailMid, fillOp: 115, ink: C.ink, sw: 1.2, curv: 0.3 });
  }

  function drawVectorLeg(ctx, u, hx, hy, angle, isRight) {
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(angle + (isRight ? -0.03 : 0.03));

    // Bare thigh
    paint(ctx, rrPts(-0.22 * u, 0, 0.44 * u, 0.58 * u, 4, 0.4), { wash: C.skin, ink: C.ink, sw: 0.95 });
    // White ankle sock
    paint(ctx, rrPts(-0.23 * u, 0.52 * u, 0.46 * u, 0.60 * u, 4, 0.4), { wash: C.apronWhite, ink: C.ink, sw: 0.95 });
    // Ruffled lace sock cuff
    for (let i = -1; i <= 1; i++) {
      paint(ctx, ellPts(i * 0.14 * u, 0.54 * u, 0.11 * u, 0.08 * u, 8), { wash: C.apronWhite, ink: C.ink, sw: 0.75 });
    }
    // Dark-navy Mary-Jane shoe
    const shoeX = isRight ? 0.03 * u : -0.03 * u;
    paint(ctx, ellPts(shoeX, 1.24 * u, 0.30 * u, 0.19 * u, 14), { wash: C.shoeNavy, ink: C.ink, sw: 1.05 });
    paint(ctx, ellPts(0, 1.15 * u, 0.15 * u, 0.08 * u, 10), { wash: C.apronWhite, ink: null });
    inkLine(ctx, [[-0.20 * u, 1.17 * u], [0.20 * u, 1.17 * u]], 1.2, C.shoeNavy, 'ink', 0);
    paint(ctx, ellPts(shoeX + (isRight ? 0.10 : -0.10) * u, 1.28 * u, 0.05 * u, 0.035 * u, 6), { wash: '#FFFFFF', ink: null });

    ctx.restore();
  }

  function drawVectorTorsoAndSkirt(ctx, u, t, vx, isBack, headBob) {
    const sway = Math.sin(t * 2.8) * 0.04 * u;

    // 1. Back white waist bow loops
    for (const s of [-1, 1]) {
      paint(ctx, [
        [s * 0.95 * u, -3.38 * u],
        [s * 1.48 * u, -3.62 * u],
        [s * 1.52 * u, -3.12 * u]
      ], { wash: C.apronWhite, ink: C.ink, sw: 0.9 });
    }

    // 2. Curved Double White Ruffled Petticoat Hem ((-2.22u, -1.95u) down to (0, -1.38u))
    const nFrills = 11;
    for (let i = 0; i <= nFrills; i++) {
      const p = (i / nFrills) * 2 - 1;
      const fx = p * 2.12 * u + sway;
      const fy = -1.42 * u - (p * p) * 0.52 * u;
      paint(ctx, ellPts(fx, fy, 0.28 * u, 0.19 * u, 10), { wash: C.apronWhite, ink: C.ink, sw: 0.9 });
    }

    // 3. Flared Dark-Navy Pleated Skirt
    const skirtPts = [];
    skirtPts.push([-1.05 * u, -3.42 * u]);
    skirtPts.push([ 1.05 * u, -3.42 * u]);
    skirtPts.push([ 1.68 * u + sway * 0.5, -2.75 * u]);
    skirtPts.push([ 2.25 * u + sway,       -2.05 * u]);
    for (let i = 8; i >= -8; i--) {
      const p = i / 8;
      skirtPts.push([p * 2.22 * u + sway, -1.52 * u - (p * p) * 0.52 * u]);
    }
    skirtPts.push([-2.25 * u + sway,       -2.05 * u]);
    skirtPts.push([-1.68 * u + sway * 0.5, -2.75 * u]);
    paint(ctx, skirtPts, { wash: C.dressDark, fill: C.dressMid, fillOp: 95, ink: C.ink, sw: 1.15, curv: 0.2 });

    // Gold trim arc & two Gold Ribbon Bows on skirt
    const goldArc = [];
    for (let i = -8; i <= 8; i++) {
      const p = i / 8;
      goldArc.push([p * 2.08 * u + sway, -1.66 * u - (p * p) * 0.48 * u]);
    }
    inkLine(ctx, goldArc, 1.0, C.gold, 'ink', 0.3);

    if (!isBack) {
      for (const s of [-1, 1]) {
        const bx = s * 1.45 * u + sway * 0.8, by = -2.08 * u;
        inkLine(ctx, [[bx - 0.16 * u, by - 0.08 * u], [bx + 0.16 * u, by + 0.08 * u]], 1.25, C.gold, 'ink', 0);
        inkLine(ctx, [[bx - 0.16 * u, by + 0.08 * u], [bx + 0.16 * u, by - 0.08 * u]], 1.25, C.gold, 'ink', 0);
      }

      // 4. Rounded U-Shaped White Waist Apron (x = -1.22u..+1.22u, y = -3.40u..-2.02u)
      for (let i = 0; i <= 10; i++) {
        const ang = (i / 10) * Math.PI;
        const lx = Math.cos(ang) * 1.24 * u + sway * 0.5;
        const ly = -2.95 * u + Math.sin(ang) * 0.96 * u;
        paint(ctx, ellPts(lx, ly, 0.17 * u, 0.15 * u, 8), { wash: C.apronWhite, ink: C.ink, sw: 0.8 });
      }
      const apronPts = [
        [-1.08 * u, -3.40 * u],
        [ 1.08 * u, -3.40 * u],
        [ 1.22 * u + sway * 0.4, -2.85 * u],
        [ 1.02 * u + sway * 0.5, -2.28 * u],
        [ 0.52 * u + sway * 0.5, -2.02 * u],
        [-0.52 * u + sway * 0.5, -2.02 * u],
        [-1.02 * u + sway * 0.5, -2.28 * u],
        [-1.22 * u + sway * 0.4, -2.85 * u]
      ];
      paint(ctx, apronPts, { wash: C.apronWhite, fill: C.apronShade, fillOp: 55, ink: C.ink, sw: 1.0, curv: 0.25 });

      // Blue Spouting Whale Logo on Apron at (0, -2.46u)
      const wx = sway * 0.45, wy = -2.46 * u;
      paint(ctx, ellPts(wx - 0.04 * u, wy, 0.22 * u, 0.14 * u, 12), { wash: C.whaleLogo, ink: null });
      paint(ctx, [[wx + 0.14 * u, wy], [wx + 0.28 * u, wy - 0.14 * u], [wx + 0.24 * u, wy + 0.04 * u]], { wash: C.whaleLogo, ink: null });
      inkLine(ctx, [[wx - 0.06 * u, wy - 0.18 * u], [wx - 0.12 * u, wy - 0.26 * u]], 1.0, C.bowBlue, 'ink', 0);
      inkLine(ctx, [[wx + 0.02 * u, wy - 0.18 * u], [wx + 0.08 * u, wy - 0.26 * u]], 1.0, C.bowBlue, 'ink', 0);
    }

    // 5. Dark-Navy Bodice & Twin White Ruffled Suspenders
    paint(ctx, [
      [-0.88 * u, -4.45 * u + headBob * 0.3],
      [ 0.88 * u, -4.45 * u + headBob * 0.3],
      [ 1.02 * u, -3.38 * u],
      [-1.02 * u, -3.38 * u]
    ], { wash: C.dressDark, fill: C.dressMid, fillOp: 90, ink: C.ink, sw: 1.05 });

    paint(ctx, rrPts(-1.06 * u, -3.49 * u, 2.12 * u, 0.18 * u, 3, 0.4), { wash: C.apronWhite, ink: C.ink, sw: 0.85 });

    if (!isBack) {
      for (const s of [-1, 1]) {
        const sx = s * 0.52 * u;
        for (let ry = -4.25; ry <= -3.55; ry += 0.22) {
          paint(ctx, ellPts(sx + s * 0.14 * u, ry * u, 0.11 * u, 0.10 * u, 8), { wash: C.apronWhite, ink: C.ink, sw: 0.7 });
        }
        paint(ctx, rrPts(sx - 0.12 * u, -4.38 * u, 0.24 * u, 0.96 * u, 2, 0.3), { wash: C.apronWhite, ink: C.ink, sw: 0.85 });
        paint(ctx, ellPts(s * 0.34 * u, -3.62 * u, 0.045 * u, 0.045 * u, 6), { wash: C.gold, ink: null });
      }

      // High White Collar & Dark-Navy Throat Bow
      paint(ctx, rrPts(-0.58 * u, -4.64 * u + headBob * 0.4, 1.16 * u, 0.36 * u, 3, 0.4), { wash: C.apronWhite, ink: C.ink, sw: 0.95 });
      const by = -4.32 * u + headBob * 0.4;
      paint(ctx, [[0, by], [-0.42 * u, by - 0.18 * u], [-0.38 * u, by + 0.18 * u]], { wash: C.dressDark, ink: C.ink, sw: 0.85 });
      paint(ctx, [[0, by], [ 0.42 * u, by - 0.18 * u], [ 0.38 * u, by + 0.18 * u]], { wash: C.dressDark, ink: C.ink, sw: 0.85 });
      paint(ctx, ellPts(0, by, 0.11 * u, 0.11 * u, 8), { wash: C.dressMid, ink: C.ink, sw: 0.85 });
    }
  }

  function drawVectorArms(ctx, u, t, o, poseKey, headBob, style) {
    const sy = -4.12 * u + headBob * 0.4;

    if (poseKey === 'laptop') {
      drawVectorArmSeg(ctx, u, -1.05 * u, sy, -1.45 * u, -3.15 * u);
      drawVectorArmSeg(ctx, u,  1.05 * u, sy,  0.45 * u, -2.95 * u);
      // 3D Silver Laptop on lap
      paint(ctx, [
        [-1.55 * u, -2.55 * u],
        [ 0.42 * u, -2.85 * u],
        [-0.25 * u, -2.22 * u],
        [-2.05 * u, -2.42 * u]
      ], { wash: '#D8E2F0', ink: C.ink, sw: 1.0 });
      paint(ctx, [
        [-2.95 * u, -4.15 * u],
        [-1.25 * u, -4.25 * u],
        [-0.85 * u, -2.45 * u],
        [-2.35 * u, -2.38 * u]
      ], { wash: '#F5F8FD', ink: C.ink, sw: 1.1 });
      paint(ctx, ellPts(-1.85 * u, -3.32 * u, 0.12 * u, 0.14 * u, 10), { wash: '#FFFFFF', ink: null });
      return;
    }

    if (poseKey === 'heart') {
      drawVectorArmBent(ctx, u, -1.05 * u, sy, -1.42 * u, -3.55 * u, -0.26 * u, -3.92 * u);
      drawVectorArmBent(ctx, u,  1.05 * u, sy,  1.42 * u, -3.55 * u,  0.26 * u, -3.92 * u);
      paint(ctx, heartPts(0, -3.95 * u, 0.28 * u), { wash: '#FF6B8B', ink: C.ink, sw: 0.75 });
      return;
    }

    if (poseKey === 'panic') {
      drawVectorArmBent(ctx, u, -1.05 * u, sy, -1.45 * u, -3.65 * u, -0.78 * u, -4.88 * u);
      drawVectorArmBent(ctx, u,  1.05 * u, sy,  1.45 * u, -3.65 * u,  0.78 * u, -4.88 * u);
      return;
    }

    if (poseKey === 'wink') {
      drawVectorArmBent(ctx, u, -1.05 * u, sy, -1.52 * u, -3.58 * u, -1.12 * u, -3.05 * u);
      drawVectorArmBent(ctx, u,  1.05 * u, sy,  1.52 * u, -3.58 * u,  1.12 * u, -3.05 * u);
      return;
    }

    const aL = o.aL !== undefined ? o.aL : -0.45;
    const aR = o.aR !== undefined ? o.aR : (0.95 + Math.sin(t * 6.5) * 0.14);
    const hxL = -1.05 * u - Math.cos(aL) * 0.92 * u;
    const hyL = sy - Math.sin(aL) * 0.92 * u;
    const hxR =  1.05 * u + Math.cos(aR) * 1.12 * u;
    const hyR = sy - Math.sin(aR) * 1.12 * u;

    drawVectorArmSeg(ctx, u, -1.05 * u, sy, hxL, hyL, o.armL, style);
    drawVectorArmSeg(ctx, u,  1.05 * u, sy, hxR, hyR, o.armR, style);
  }

  function drawVectorArmBent(ctx, u, sx, sy, ex, ey, hx, hy) {
    paint(ctx, ellPts(sx, sy, 0.28 * u, 0.26 * u, 10), { wash: C.dressDark, ink: C.ink, sw: 0.95 });
    inkLine(ctx, [[sx, sy], [ex, ey], [hx, hy]], 3.6, C.ink, 'ink', 0.25);
    inkLine(ctx, [[sx, sy], [ex, ey], [hx, hy]], 2.6, C.dressDark, 'ink', 0.25);
    const wx = ex + (hx - ex) * 0.72, wy = ey + (hy - ey) * 0.72;
    paint(ctx, ellPts(wx, wy, 0.20 * u, 0.15 * u, 10), { wash: C.apronWhite, ink: C.ink, sw: 0.8 });
    paint(ctx, ellPts(hx, hy, 0.18 * u, 0.16 * u, 10), { wash: C.skin, ink: C.ink, sw: 0.85 });
  }

  function drawVectorArmSeg(ctx, u, sx, sy, hx, hy, propFn, style) {
    paint(ctx, ellPts(sx, sy, 0.30 * u, 0.28 * u, 10), { wash: C.dressDark, ink: C.ink, sw: 1.0 });
    const dx = hx - sx, dy = hy - sy;
    const ang = Math.atan2(dy, dx);
    const nx = -Math.sin(ang) * 0.18 * u, ny = Math.cos(ang) * 0.18 * u;
    const wx = sx + dx * 0.78, wy = sy + dy * 0.78;
    paint(ctx, [
      [sx + nx, sy + ny],
      [wx + nx * 1.15, wy + ny * 1.15],
      [wx - nx * 1.15, wy - ny * 1.15],
      [sx - nx, sy - ny]
    ], { wash: C.dressDark, ink: C.ink, sw: 1.0 });
    paint(ctx, ellPts(wx, wy, 0.22 * u, 0.16 * u, 10), { wash: C.apronWhite, ink: C.ink, sw: 0.85 });
    paint(ctx, ellPts(hx, hy, 0.19 * u, 0.17 * u, 10), { wash: C.skin, ink: C.ink, sw: 0.9 });

    if (typeof propFn === 'function') {
      ctx.save();
      ctx.translate(hx, hy);
      propFn(ctx, u, style);
      ctx.restore();
    }
  }

  function drawVectorHeadBase(ctx, u, t, vx, isBack, isQBack, hat) {
    const earWag = Math.sin(t * 3.1) * 0.05 * u;

    // 1. Horizontal Dark-Navy Whale Pectoral-Fin Ears (±1.92u .. ±3.45u, y = -6.05u .. -5.25u)
    for (const s of [-1, 1]) {
      const ew = s < 0 ? earWag : -earWag;
      paint(ctx, [
        [s * 1.95 * u, -5.55 * u],
        [s * 2.55 * u, -5.25 * u + ew * 0.5],
        [s * 3.25 * u, -5.32 * u + ew],
        [s * 3.42 * u, -5.58 * u + ew],
        [s * 2.05 * u, -5.78 * u]
      ], { wash: C.earFrill, ink: C.ink, sw: 0.9, curv: 0.25 });

      paint(ctx, [
        [s * 1.92 * u, -6.05 * u],
        [s * 2.75 * u, -5.92 * u + ew * 0.5],
        [s * 3.45 * u, -5.58 * u + ew],
        [s * 2.65 * u, -5.45 * u + ew * 0.5],
        [s * 1.92 * u, -5.65 * u]
      ], { wash: C.earDark, fill: C.earMid, fillOp: 110, ink: C.ink, sw: 1.05, curv: 0.25 });
    }

    // 2. Deep Crescent White Ruffled Maid Headband hugging upper head dome (-2.02u..+2.02u)
    if (!hat || hat !== 'none') {
      const nScallops = 16;
      for (let i = 0; i <= nScallops; i++) {
        const ang = Math.PI * (0.05 + 0.90 * (i / nScallops));
        const rx = -Math.cos(ang) * 1.98 * u;
        const ry = -6.48 * u - Math.sin(ang) * 1.98 * u;
        paint(ctx, ellPts(rx, ry, 0.24 * u, 0.21 * u, 10), { wash: C.apronWhite, ink: C.ink, sw: 0.85 });
      }
      const bandArc = [];
      for (let i = 0; i <= 14; i++) {
        const ang = Math.PI * (0.06 + 0.88 * (i / 14));
        bandArc.push([-Math.cos(ang) * 1.84 * u, -6.48 * u - Math.sin(ang) * 1.84 * u]);
      }
      inkLine(ctx, bandArc, 1.6, C.dressDark, 'ink', 0.3);
    }

    // 3. Royal-Blue Head Hair Dome (width = 3.92u, y = -8.32u .. -4.80u)
    paint(ctx, ellPts(0, -6.54 * u, 1.94 * u, 1.74 * u, 24), { wash: C.hairMain, fill: C.hairDark, fillOp: 85, ink: C.ink, sw: 1.15 });

    // 4. Light-Blue Side Bows at temples (±2.02u, -6.18u)
    for (const s of [-1, 1]) {
      const bx = s * 2.02 * u, by = -6.18 * u;
      paint(ctx, ellPts(bx - s * 0.14 * u, by - 0.10 * u, 0.18 * u, 0.11 * u, 8), { wash: C.bowBlue, ink: C.ink, sw: 0.8 });
      paint(ctx, ellPts(bx + s * 0.16 * u, by + 0.06 * u, 0.18 * u, 0.11 * u, 8), { wash: C.bowBlue, ink: C.ink, sw: 0.8 });
      paint(ctx, ellPts(bx, by, 0.09 * u, 0.09 * u, 8), { wash: C.bowBlueHi, ink: C.ink, sw: 0.75 });
    }

    // 5. Delicate Chibi Peach Skin Face (width = 2.60u: x = -1.30u .. +1.30u, y = -6.40u .. -4.70u)
    if (!isBack && !isQBack) {
      const cx = vx * 0.25 * u;
      const facePts = [
        [cx - 1.18 * u, -6.40 * u],
        [cx + 1.18 * u, -6.40 * u],
        [cx + 1.30 * u, -5.65 * u],
        [cx + 1.28 * u, -5.22 * u],
        [cx + 0.96 * u, -4.90 * u],
        [cx + 0.36 * u, -4.72 * u],
        [cx,            -4.69 * u],
        [cx - 0.36 * u, -4.72 * u],
        [cx - 0.96 * u, -4.90 * u],
        [cx - 1.28 * u, -5.22 * u],
        [cx - 1.30 * u, -5.65 * u]
      ];
      paint(ctx, facePts, { wash: C.skin, fill: C.skinShadow, fillOp: 35, ink: C.ink, sw: 1.05, curv: 0.3 });
    }
  }

  function drawVectorForeheadBangs(ctx, u, t, vx, isBack) {
    if (isBack) return;
    const cx = vx * 0.20 * u;

    // 1. Two Continuous S-Curved Cheek Locks with Glowing Aqua-Cyan Tips (±1.32u)
    for (const s of [-1, 1]) {
      const lockFull = [
        [cx + s * 1.18 * u, -6.25 * u],
        [cx + s * 1.66 * u, -5.55 * u],
        [cx + s * 1.54 * u, -4.75 * u],
        [cx + s * 1.32 * u, -4.18 * u],
        [cx + s * 0.96 * u, -4.08 * u],
        [cx + s * 1.08 * u, -4.65 * u],
        [cx + s * 1.22 * u, -5.35 * u]
      ];
      paint(ctx, lockFull, { wash: C.hairMain, ink: C.ink, sw: 0.9, curv: 0.3 });

      const lockTip = [
        [cx + s * 1.15 * u, -4.95 * u],
        [cx + s * 1.52 * u, -4.75 * u],
        [cx + s * 1.32 * u, -4.18 * u],
        [cx + s * 0.96 * u, -4.08 * u],
        [cx + s * 1.06 * u, -4.58 * u]
      ];
      paint(ctx, lockTip, { wash: C.hairCyan, fill: C.hairLight, fillOp: 85, ink: C.ink, sw: 0.85, curv: 0.3 });
    }

    // 2. Full Tapered Royal-Blue Forehead Bangs (-8.30u down to -5.36u right over the eyebrows/eyes!)
    const bangs = [
      [cx - 1.82 * u, -6.35 * u],
      [cx - 1.52 * u, -7.68 * u],
      [cx - 0.82 * u, -8.22 * u],
      [cx,            -8.32 * u],
      [cx + 0.82 * u, -8.22 * u],
      [cx + 1.52 * u, -7.68 * u],
      [cx + 1.82 * u, -6.35 * u],
      [cx + 1.34 * u, -5.42 * u],
      [cx + 1.02 * u, -6.02 * u],
      [cx + 0.56 * u, -5.38 * u],
      [cx + 0.28 * u, -5.98 * u],
      [cx,            -5.34 * u],
      [cx - 0.28 * u, -5.98 * u],
      [cx - 0.56 * u, -5.38 * u],
      [cx - 1.02 * u, -6.02 * u],
      [cx - 1.34 * u, -5.42 * u]
    ];
    paint(ctx, bangs, { wash: C.hairMain, fill: C.hairMid, fillOp: 95, ink: C.ink, sw: 1.05, curv: 0.22 });

    // Internal bang strand lines
    inkLine(ctx, [[cx - 0.42 * u, -7.75 * u], [cx - 0.54 * u, -5.45 * u]], 0.8, C.hairDark, 'ink', 0.3);
    inkLine(ctx, [[cx + 0.42 * u, -7.75 * u], [cx + 0.54 * u, -5.45 * u]], 0.8, C.hairDark, 'ink', 0.3);
    inkLine(ctx, [[cx, -7.95 * u], [cx, -5.40 * u]], 0.8, C.hairDark, 'ink', 0.3);

    // 3. Crown Halo Highlight Band at y = -7.02u
    paint(ctx, [
      [cx - 1.32 * u, -6.88 * u],
      [cx - 0.65 * u, -7.22 * u],
      [cx + 0.65 * u, -7.22 * u],
      [cx + 1.32 * u, -6.88 * u],
      [cx + 1.12 * u, -6.66 * u],
      [cx,            -6.96 * u],
      [cx - 1.12 * u, -6.66 * u]
    ], { wash: C.haloArc, ink: null, curv: 0.35 });

    // 4. Looped Top Ahoge (-8.35u .. -9.32u) emerging from crown over headband
    const ahogeSway = Math.sin(t * 3.8) * 0.08 * u;
    inkLine(ctx, [
      [cx - 0.15 * u, -8.32 * u],
      [cx - 0.68 * u + ahogeSway, -8.98 * u],
      [cx - 0.15 * u + ahogeSway, -9.32 * u],
      [cx + 0.35 * u + ahogeSway, -8.98 * u],
      [cx + 0.08 * u, -8.35 * u]
    ], 3.2, C.ink, 'ink', 0.45);
    inkLine(ctx, [
      [cx - 0.15 * u, -8.32 * u],
      [cx - 0.68 * u + ahogeSway, -8.98 * u],
      [cx - 0.15 * u + ahogeSway, -9.32 * u],
      [cx + 0.35 * u + ahogeSway, -8.98 * u],
      [cx + 0.08 * u, -8.35 * u]
    ], 2.1, C.hairMid, 'ink', 0.45);
  }

  function drawVectorFaceFeatures(ctx, u, t, o, vx, handsOnCheeks) {
    const cx = vx * 0.30 * u;
    const eyeY = -5.54 * u;
    const eyeSpan = 0.64 * u;

    // Cheek blush
    if (o.blush !== false) {
      paint(ctx, ellPts(cx - 0.84 * u, -5.20 * u, 0.23 * u, 0.11 * u, 10), { wash: C.blush, washOp: 120, ink: null });
      paint(ctx, ellPts(cx + 0.84 * u, -5.20 * u, 0.23 * u, 0.11 * u, 10), { wash: C.blush, washOp: 120, ink: null });
    }

    const eyeKey = o.eyes || 'open';
    const eyeFn = EYES[eyeKey] || EYES.open;
    eyeFn(ctx, cx - eyeSpan, eyeY, u, 1.06, o, false);
    eyeFn(ctx, cx + eyeSpan, eyeY, u, 1.06, o, true);

    // Eyebrows
    for (const s of [-1, 1]) {
      const bx = cx + s * eyeSpan, by = eyeY - 0.44 * u;
      const tilt = (eyeKey === 'angry' ? s * 0.09 : (eyeKey === 'cry' || eyeKey === 'wide' ? -s * 0.09 : 0)) * u;
      inkLine(ctx, [[bx - 0.20 * u, by - tilt], [bx + 0.20 * u, by + tilt]], 1.1, C.ink, 'ink', 0);
    }

    // Mouth at (cx, -5.04u)
    if (!handsOnCheeks) {
      const mKey = o.talking ? ((Math.floor(t * 9) % 2 === 0) ? 'openSmile' : 'o') : (o.mouth || 'openSmile');
      const mouthFn = MOUTHS[mKey] || MOUTHS.openSmile;
      mouthFn(ctx, cx, -5.04 * u, u);
    }
  }

  function drawHat(ctx, u, t, hat, vx) {
    const cx = vx * 0.22 * u;
    const topY = -8.75 * u;

    if (hat === 'crown') {
      paint(ctx, [
        [cx - 0.95 * u, topY + 0.15 * u],
        [cx - 1.05 * u, topY - 0.65 * u],
        [cx - 0.45 * u, topY - 0.20 * u],
        [cx,            topY - 0.82 * u],
        [cx + 0.45 * u, topY - 0.20 * u],
        [cx + 1.05 * u, topY - 0.65 * u],
        [cx + 0.95 * u, topY + 0.15 * u]
      ], { wash: PAL.gold, fill: PAL.ochre, fillOp: 120, ink: C.ink, sw: 1.05 });
    } else if (hat === 'wizard') {
      paint(ctx, ellPts(cx, topY + 0.12 * u, 1.65 * u, 0.28 * u, 14), { wash: '#312E81', ink: C.ink, sw: 1.0 });
      paint(ctx, [[cx - 1.05 * u, topY + 0.10 * u], [cx + 0.15 * u, topY - 1.45 * u], [cx + 1.05 * u, topY + 0.10 * u]], { wash: '#4338CA', ink: C.ink, sw: 1.0 });
    } else if (hat === 'hard' || hat === 'hardHat') {
      paint(ctx, ellPts(cx, topY, 1.35 * u, 0.72 * u, 14), { wash: '#FACC15', ink: C.ink, sw: 1.05 });
      paint(ctx, rrPts(cx - 1.52 * u, topY + 0.10 * u, 3.04 * u, 0.26 * u, 4, 0.4), { wash: '#EAB308', ink: C.ink, sw: 1.05 });
    } else if (hat === 'sweatband') {
      paint(ctx, rrPts(cx - 1.75 * u, -7.75 * u, 3.50 * u, 0.34 * u, 3, 0.4), { wash: '#EF4444', ink: C.ink, sw: 0.95 });
    } else if (hat === 'diving') {
      paint(ctx, rrPts(cx - 1.25 * u, -7.85 * u, 2.50 * u, 0.72 * u, 5, 0.5), { wash: '#38BDF8', fill: '#E0F2FE', fillOp: 130, ink: C.ink, sw: 1.05 });
    } else if (hat === 'headphones' || hat === 'headset') {
      for (const s of [-1, 1]) {
        paint(ctx, ellPts(cx + s * 2.15 * u, -5.85 * u, 0.28 * u, 0.45 * u, 10), { wash: '#38BDF8', ink: C.ink, sw: 1.0 });
      }
    } else if (hat === 'party') {
      paint(ctx, [[cx - 0.65 * u, topY + 0.15 * u], [cx, topY - 1.05 * u], [cx + 0.65 * u, topY + 0.15 * u]], { wash: '#EC4899', ink: C.ink, sw: 1.0 });
    } else if (hat === 'halo') {
      paint(ctx, ellPts(cx, topY - 0.55 * u, 1.05 * u, 0.22 * u, 16), { wash: null, ink: PAL.gold, sw: 1.8 });
    } else if (hat === 'top' || hat === 'topHat') {
      paint(ctx, rrPts(cx - 0.72 * u, topY - 1.15 * u, 1.44 * u, 1.25 * u, 3, 0.4), { wash: '#1E293B', ink: C.ink, sw: 1.05 });
      paint(ctx, rrPts(cx - 1.28 * u, topY, 2.56 * u, 0.22 * u, 3, 0.4), { wash: '#1E293B', ink: C.ink, sw: 1.05 });
    } else if (hat === 'fedora') {
      paint(ctx, ellPts(cx, topY + 0.08 * u, 1.55 * u, 0.24 * u, 14), { wash: '#78350F', ink: C.ink, sw: 1.0 });
      paint(ctx, ellPts(cx, topY - 0.25 * u, 1.05 * u, 0.48 * u, 12), { wash: '#92400E', ink: C.ink, sw: 1.0 });
    } else if (hat === 'flower') {
      for (let a = 0; a < TAU; a += TAU / 5) {
        paint(ctx, ellPts(cx + 0.85 * u + Math.cos(a) * 0.22 * u, topY + Math.sin(a) * 0.22 * u, 0.16 * u, 0.16 * u, 8), { wash: '#F472B6', ink: C.ink, sw: 0.75 });
      }
      paint(ctx, ellPts(cx + 0.85 * u, topY, 0.14 * u, 0.14 * u, 8), { wash: PAL.gold, ink: C.ink, sw: 0.75 });
    } else if (hat === 'cat') {
      for (const s of [-1, 1]) {
        paint(ctx, [[cx + s * 0.75 * u, topY + 0.15 * u], [cx + s * 1.25 * u, topY - 0.65 * u], [cx + s * 1.55 * u, topY + 0.25 * u]], { wash: '#1E293B', ink: C.ink, sw: 1.0 });
      }
    }
  }

  // OOP Wrapper Class for standalone studio/comparison scripts
  class WhaleGirl {
    constructor(opts = {}) {
      this.x = opts.x || 640;
      this.y = opts.y || 520;
      this.scale = opts.scale || 1.0;
      this.view = opts.view || 'front';
      this.emotion = opts.emotion || 'happy';
      this.hat = opts.hat || 'maid';
      this.style = opts.style || 'pixel';
      this.constructMode = opts.constructMode || null;
      this.poseOps = opts.poseOps || {};
    }
    draw(ctx, t = 0) {
      const u = 34 * this.scale;
      whaleGirl(ctx, this.x, this.y, u, Object.assign({}, feel(this.emotion, t), this.poseOps, {
        view: this.view,
        hat: this.hat,
        style: this.style,
        constructMode: this.constructMode,
        t
      }));
    }
  }

  const WHALE_GIRL = {
    whaleGirl,
    WhaleGirl,
    feel,
    emotions,
    move,
    turn,
    spinView,
    EMO,
    HATS,
    VIEWS,
    EYES,
    MOUTHS,
    EMOTES,
    PALETTE: C
  };

  root.WHALE_GIRL = WHALE_GIRL;
  root.WhaleGirl = WhaleGirl;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = WHALE_GIRL;
  }
})(typeof window !== 'undefined' ? window : globalThis);
