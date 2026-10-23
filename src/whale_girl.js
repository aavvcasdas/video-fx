// src/whale_girl.js — DeepSeek Whale Maid Girl (深海鲸鱼娘) Character Rig
// Built on the exact architecture of JohnHeibel/ClaudeAnimationBase (src/clawd.js) & PDoomVideo:
//   - 5 Key Views (`VIEWS`: front, q, side, qback, back) + `spinView(a)` + `turn(t, t0, t1, a0, a1)` + `smearTrail`
//   - 31 Acted Emotions (`EMO`) via `feel(name, t, over)` and `emotions(t, keys, o)`
//   - 24 Eyes, 16 Mouths (fang + voice lip-sync), 19 Emotes, 16+ Hats/Props, and custom `armL`/`armR` hooks

(function (root) {
  const CORE = root.CORE || (typeof require !== 'undefined' ? require('./core.js') : {});
  const {
    TAU, PAL, clamp, lerp, frac, seg, ease, easeIn, easeOut, backOut, wob,
    boilSeed, jit, pulse, pulse2, voiceAt, take, mixCol,
    rectPts, ellPts, rrPts, starPts, heartPts, ribbon, partial,
    paint, inkLine
  } = CORE;

  // Signature Palette from 42868804351-1-192.mp4
  const C = {
    hairTop: '#4CA8DF',
    hairMid: '#2D72B2',
    hairDark: '#1A3E72',
    skin: '#FFEFE5',
    blush: '#FF8DA1',
    dressNavy: '#19294B',
    dressBlue: '#284578',
    apron: '#FFFFFF',
    apronShd: '#DCE8F7',
    gold: '#F6C744',
    whaleLogo: '#2E86DE',
    eyeCyan: '#38BDF8',
    eyeNavy: '#14264C',
    mouthIn: '#9E2A3B',
    tongue: '#FF758F'
  };

  // ============================================================================
  // 1. 5 Key Views (`front`, `q`, `side`, `qback`, `back`) + `spinView` + `turn`
  // ============================================================================
  const VIEWS = {
    front: { face: 1, eyeShift: 0, farScale: 1, tailSide: 0.7, bowBack: false, back: false },
    q:     { face: 0.85, eyeShift: 0.55, farScale: 0.84, tailSide: 0.95, bowBack: false, back: false },
    side:  { face: 0.4, eyeShift: 1.05, farScale: 0, tailSide: 1.25, bowBack: false, back: false, profile: true },
    qback: { face: 0, eyeShift: 0, farScale: 0, tailSide: 0.95, bowBack: true, back: true, qback: true },
    back:  { face: 0, eyeShift: 0, farScale: 0, tailSide: 0.55, bowBack: true, back: true }
  };

  const SPIN_RING = [
    ['front', false], ['q', false], ['side', false], ['qback', false],
    ['back', false], ['qback', true], ['side', true], ['q', true]
  ];
  function spinView(a) {
    const idx = Math.round(frac(a) * 8) % 8;
    const [view, flip] = SPIN_RING[idx];
    return { view, flip };
  }
  function turn(t, t0, t1, a0 = 0, a1 = 1) {
    if (t <= t0) return spinView(a0);
    if (t >= t1) return spinView(a1);
    const u = (t - t0) / Math.max(1e-6, t1 - t0);
    const s = Math.sin(u * Math.PI);
    return { ...spinView(lerp(a0, a1, ease(u))), sq: -0.14 * s, dy: -0.22 * s };
  }

  // ============================================================================
  // 2. 24 Expressive Eyes (`EYES`)
  // ============================================================================
  const EYES = {
    open: (ctx, ex, ey, u, sc = 1, o = {}) => {
      const rx = 0.72 * u * sc, ry = 0.82 * u * sc;
      paint(ctx, ellPts(ex, ey, rx, ry, 16), { wash: '#FFFFFF', ink: PAL.ink, sw: 0.9 });
      const lx = (o.lookX || 0) * 0.22 * u, ly = (o.lookY || 0) * 0.18 * u;
      paint(ctx, ellPts(ex + lx, ey + ly + 0.05 * u, rx * 0.78, ry * 0.82, 14), {
        wash: C.eyeCyan, fill: C.eyeNavy, fillOp: 150, ink: PAL.ink, sw: 0.8
      });
      paint(ctx, ellPts(ex + lx, ey + ly, rx * 0.36, ry * 0.38, 10), { wash: C.eyeNavy, ink: null });
      paint(ctx, ellPts(ex - 0.22 * u * sc, ey - 0.26 * u * sc, 0.22 * u * sc, 0.22 * u * sc, 8), { wash: '#FFFFFF', ink: null });
      paint(ctx, ellPts(ex + 0.20 * u * sc, ey + 0.22 * u * sc, 0.11 * u * sc, 0.11 * u * sc, 8), { wash: '#FFFFFF', ink: null });
    },
    happy: (ctx, ex, ey, u, sc = 1) => {
      const w = 0.72 * u * sc, h = 0.52 * u * sc;
      inkLine(ctx, [[ex - w, ey + h * 0.35], [ex, ey - h], [ex + w, ey + h * 0.35]], 1.45, PAL.ink, 'ink', 0.65);
    },
    wink: (ctx, ex, ey, u, sc = 1, o = {}, isRight = false) => {
      if (isRight) EYES.happy(ctx, ex, ey, u, sc);
      else EYES.open(ctx, ex, ey, u, sc, o);
    },
    spark: (ctx, ex, ey, u, sc = 1, o = {}) => {
      EYES.open(ctx, ex, ey, u, sc * 1.06, o);
      paint(ctx, starPts(ex, ey - 0.08 * u, 0.52 * u * sc, 0.36, 4), { wash: PAL.gold, ink: PAL.ink, sw: 0.5 });
    },
    star: (ctx, ex, ey, u, sc = 1) => {
      paint(ctx, starPts(ex, ey, 0.98 * u * sc, 0.40, 4), { wash: PAL.gold, fill: PAL.ochre, fillOp: 90, ink: PAL.ink, sw: 0.95 });
    },
    heart: (ctx, ex, ey, u, sc = 1) => {
      paint(ctx, heartPts(ex, ey, 0.95 * u * sc), { wash: PAL.rose, fill: '#B91C1C', fillOp: 85, ink: PAL.ink, sw: 0.9 });
    },
    wide: (ctx, ex, ey, u, sc = 1, o = {}) => {
      paint(ctx, ellPts(ex, ey, 0.84 * u * sc, 0.92 * u * sc, 16), { wash: '#FFFFFF', ink: PAL.ink, sw: 1.0 });
      paint(ctx, ellPts(ex + (o.lookX || 0) * 0.2 * u, ey + (o.lookY || 0) * 0.2 * u, 0.32 * u * sc, 0.34 * u * sc, 10), { wash: C.eyeNavy, ink: PAL.ink, sw: 0.7 });
      paint(ctx, ellPts(ex - 0.22 * u * sc, ey - 0.26 * u * sc, 0.16 * u * sc, 0.16 * u * sc, 8), { wash: '#FFFFFF', ink: null });
    },
    pin: (ctx, ex, ey, u, sc = 1) => {
      paint(ctx, ellPts(ex, ey, 0.88 * u * sc, 0.95 * u * sc, 16), { wash: '#FFFFFF', ink: PAL.ink, sw: 1.0 });
      paint(ctx, ellPts(ex, ey, 0.18 * u * sc, 0.18 * u * sc, 8), { wash: PAL.ink, ink: null });
    },
    angry: (ctx, ex, ey, u, sc = 1, o = {}, isRight = false) => {
      EYES.open(ctx, ex, ey, u, sc * 0.92, o);
      const dir = isRight ? -1 : 1;
      inkLine(ctx, [[ex - 0.78 * u * dir, ey - 0.75 * u], [ex + 0.68 * u * dir, ey - 0.28 * u]], 1.5, PAL.ink, 'ink', 0);
    },
    sad: (ctx, ex, ey, u, sc = 1, o = {}, isRight = false) => {
      EYES.open(ctx, ex, ey, u, sc * 0.92, o);
      const dir = isRight ? -1 : 1;
      inkLine(ctx, [[ex - 0.75 * u * dir, ey - 0.32 * u], [ex + 0.75 * u * dir, ey - 0.78 * u]], 1.35, PAL.ink, 'ink', 0);
    },
    cry: (ctx, ex, ey, u, sc = 1) => {
      // Streaming waterfall tears + quivering closed arch
      paint(ctx, rectPts(ex - 0.38 * u * sc, ey, 0.76 * u * sc, 1.45 * u, 1), { wash: '#60A5FA', fill: '#3B82F6', fillOp: 120, ink: null });
      EYES.happy(ctx, ex, ey, u, sc);
    },
    lids: (ctx, ex, ey, u, sc = 1) => {
      paint(ctx, ellPts(ex, ey + 0.1 * u, 0.68 * u * sc, 0.45 * u * sc, 12), { wash: C.eyeCyan, ink: PAL.ink, sw: 0.8 });
      paint(ctx, rectPts(ex - 0.76 * u * sc, ey - 0.55 * u * sc, 1.52 * u * sc, 0.58 * u * sc, 0.6), { wash: C.skin, ink: PAL.ink, sw: 0.9 });
    },
    narrow: (ctx, ex, ey, u, sc = 1) => {
      inkLine(ctx, [[ex - 0.72 * u * sc, ey], [ex + 0.72 * u * sc, ey]], 1.55, PAL.ink, 'ink', 0);
      paint(ctx, ellPts(ex, ey + 0.12 * u, 0.28 * u * sc, 0.18 * u * sc, 8), { wash: C.eyeNavy, ink: PAL.ink, sw: 0.6 });
    },
    squint: (ctx, ex, ey, u, sc = 1, o = {}, isRight = false) => {
      const dir = isRight ? -1 : 1;
      inkLine(ctx, [[ex - 0.62 * u * dir, ey - 0.38 * u], [ex + 0.52 * u * dir, ey], [ex - 0.62 * u * dir, ey + 0.38 * u]], 1.4, PAL.ink, 'ink', 0);
    },
    x: (ctx, ex, ey, u, sc = 1) => {
      const s = 0.56 * u * sc;
      inkLine(ctx, [[ex - s, ey - s], [ex + s, ey + s]], 1.45, PAL.ink, 'ink', 0);
      inkLine(ctx, [[ex + s, ey - s], [ex - s, ey + s]], 1.45, PAL.ink, 'ink', 0);
    },
    swirl: (ctx, ex, ey, u, sc = 1, o = {}) => {
      const pts = [];
      const rot = (o.t || 0) * 6;
      for (let i = 0; i <= 22; i++) {
        const a = rot + (i / 22) * TAU * 1.85;
        const r = (i / 22) * 0.76 * u * sc;
        pts.push([ex + Math.cos(a) * r, ey + Math.sin(a) * r]);
      }
      inkLine(ctx, pts, 1.15, PAL.ink, 'ink', 0.3);
    },
    shades: (ctx, ex, ey, u, sc = 1, o = {}, isRight = false) => {
      paint(ctx, rrPts(ex - 0.85 * u * sc, ey - 0.45 * u * sc, 1.7 * u * sc, 0.92 * u * sc, 3, 0.5), {
        wash: '#111827', fill: '#374151', fillOp: 110, ink: PAL.ink, sw: 1.0
      });
      inkLine(ctx, [[ex - 0.52 * u * sc, ey - 0.25 * u * sc], [ex - 0.1 * u * sc, ey + 0.22 * u * sc]], 0.9, '#FFFFFF', 'inkfine', 0);
      if (!isRight) inkLine(ctx, [[ex + 0.8 * u * sc, ey - 0.15 * u], [ex + 1.4 * u * sc, ey - 0.15 * u]], 1.2, PAL.ink, 'ink', 0);
    },
     sleep: (ctx, ex, ey, u, sc = 1) => {
      const w = 0.68 * u * sc, h = 0.38 * u * sc;
      inkLine(ctx, [[ex - w, ey - h * 0.3], [ex, ey + h], [ex + w, ey - h * 0.3]], 1.35, PAL.ink, 'ink', 0.6);
    },
    Money: (ctx, ex, ey, u, sc = 1) => {
      EYES.star(ctx, ex, ey, u, sc);
    }
  };
  EYES.sleep = EYES[' sleep'];

  // ============================================================================
  // 3. 16 Expressive Mouths (`MOUTHS` — with signature cute single fang!)
  // ============================================================================
  const MOUTHS = {
    flat: (ctx, mx, my, u) => {
      inkLine(ctx, [[mx - 0.42 * u, my], [mx + 0.42 * u, my]], 1.15, PAL.ink, 'ink', 0);
    },
    smile: (ctx, mx, my, u) => {
      inkLine(ctx, [[mx - 0.52 * u, my - 0.12 * u], [mx, my + 0.28 * u], [mx + 0.52 * u, my - 0.12 * u]], 1.25, PAL.ink, 'ink', 0.6);
    },
    grin: (ctx, mx, my, u) => {
      const w = 0.68 * u, h = 0.52 * u;
      paint(ctx, [[mx - w, my - 0.1 * u], [mx + w, my - 0.1 * u], [mx + w * 0.75, my + h], [mx - w * 0.75, my + h]], {
        wash: C.mouthIn, fill: C.tongue, fillOp: 120, ink: PAL.ink, sw: 0.9, curv: 0.4
      });
      // Signature cute white fang on upper-right corner!
      paint(ctx, [[mx + 0.18 * u, my - 0.08 * u], [mx + 0.42 * u, my - 0.08 * u], [mx + 0.30 * u, my + 0.22 * u]], {
        wash: '#FFFFFF', ink: PAL.ink, sw: 0.5
      });
    },
    laugh: (ctx, mx, my, u) => {
      const w = 0.82 * u, h = 0.72 * u;
      paint(ctx, [[mx - w, my - 0.16 * u], [mx + w, my - 0.16 * u], [mx + w * 0.8, my + h], [mx - w * 0.8, my + h]], {
        wash: C.mouthIn, fill: C.tongue, fillOp: 140, ink: PAL.ink, sw: 0.95, curv: 0.45
      });
      paint(ctx, [[mx + 0.22 * u, my - 0.14 * u], [mx + 0.48 * u, my - 0.14 * u], [mx + 0.35 * u, my + 0.22 * u]], {
        wash: '#FFFFFF', ink: PAL.ink, sw: 0.5
      });
    },
    o: (ctx, mx, my, u) => {
      paint(ctx, ellPts(mx, my + 0.1 * u, 0.32 * u, 0.38 * u, 12), { wash: C.mouthIn, ink: PAL.ink, sw: 0.9 });
    },
    O: (ctx, mx, my, u) => {
      paint(ctx, ellPts(mx, my + 0.15 * u, 0.56 * u, 0.68 * u, 14), { wash: C.mouthIn, fill: C.tongue, fillOp: 110, ink: PAL.ink, sw: 0.95 });
      paint(ctx, [[mx + 0.15 * u, my - 0.45 * u], [mx + 0.38 * u, my - 0.45 * u], [mx + 0.26 * u, my - 0.15 * u]], {
        wash: '#FFFFFF', ink: PAL.ink, sw: 0.45
      });
    },
    frown: (ctx, mx, my, u) => {
      inkLine(ctx, [[mx - 0.50 * u, my + 0.22 * u], [mx, my - 0.14 * u], [mx + 0.50 * u, my + 0.22 * u]], 1.25, PAL.ink, 'ink', 0.6);
    },
    wavy: (ctx, mx, my, u) => {
      inkLine(ctx, [
        [mx - 0.58 * u, my + 0.08 * u],
        [mx - 0.20 * u, my - 0.16 * u],
        [mx + 0.20 * u, my + 0.18 * u],
        [mx + 0.58 * u, my - 0.08 * u]
      ], 1.2, PAL.ink, 'ink', 0.5);
    },
    smirk: (ctx, mx, my, u) => {
      inkLine(ctx, [[mx - 0.38 * u, my + 0.08 * u], [mx + 0.12 * u, my + 0.08 * u], [mx + 0.56 * u, my - 0.24 * u]], 1.25, PAL.ink, 'ink', 0.5);
      paint(ctx, [[mx + 0.18 * u, my + 0.02 * u], [mx + 0.42 * u, my - 0.08 * u], [mx + 0.32 * u, my + 0.25 * u]], {
        wash: '#FFFFFF', ink: PAL.ink, sw: 0.5
      });
    },
    cat: (ctx, mx, my, u) => {
      inkLine(ctx, [
        [mx - 0.56 * u, my - 0.06 * u],
        [mx - 0.28 * u, my + 0.22 * u],
        [mx, my - 0.08 * u],
        [mx + 0.28 * u, my + 0.22 * u],
        [mx + 0.56 * u, my - 0.06 * u]
      ], 1.2, PAL.ink, 'ink', 0.4);
    },
    grit: (ctx, mx, my, u) => {
      paint(ctx, rrPts(mx - 0.62 * u, my - 0.15 * u, 1.24 * u, 0.52 * u, 3, 0.5), { wash: '#FFFFFF', ink: PAL.ink, sw: 0.9 });
      inkLine(ctx, [[mx - 0.58 * u, my + 0.11 * u], [mx + 0.58 * u, my + 0.11 * u]], 0.8, PAL.ink, 'inkfine', 0);
    },
    tongue: (ctx, mx, my, u) => {
      MOUTHS.smile(ctx, mx, my, u);
      paint(ctx, ellPts(mx + 0.12 * u, my + 0.32 * u, 0.26 * u, 0.34 * u, 10), { wash: C.tongue, ink: PAL.ink, sw: 0.8 });
    }
  };

  // ============================================================================
  // 4. 19 Overhead Emotes (`EMOTES`)
  // ============================================================================
  const EMOTE_TOP = { bulb: 2.35, cloud: 2.35, spout: 2.35 };
  const EMOTES = {
    '!': (ctx, x, y, u, k = 1) => {
      const s = backOut(k);
      paint(ctx, rectPts(x - 0.22 * u * s, y - 2.1 * u * s, 0.44 * u * s, 1.25 * u * s, 0.6), { wash: PAL.gold, ink: PAL.ink, sw: 0.9 });
      paint(ctx, ellPts(x, y - 0.45 * u * s, 0.24 * u * s, 0.24 * u * s, 8), { wash: PAL.gold, ink: PAL.ink, sw: 0.9 });
    },
    '!!': (ctx, x, y, u, k = 1) => {
      EMOTES['!'](ctx, x - 0.42 * u, y, u, k);
      EMOTES['!'](ctx, x + 0.42 * u, y, u, k);
    },
    '?': (ctx, x, y, u, k = 1) => {
      letter(ctx, '?', x, y - 1.15 * u, 2.1 * u * backOut(k), PAL.whaleCyan, { stroke: PAL.ink, ink: false });
    },
    heart: (ctx, x, y, u, k = 1) => {
      const s = backOut(k);
      paint(ctx, heartPts(x, y - 1.15 * u, 1.15 * u * s), { wash: PAL.rose, fill: '#E11D48', fillOp: 100, ink: PAL.ink, sw: 0.9 });
    },
    hearts: (ctx, x, y, u, k = 1) => {
      EMOTES.heart(ctx, x - 0.85 * u, y + 0.2 * u, u * 0.72, k);
      EMOTES.heart(ctx, x + 0.75 * u, y - 0.25 * u, u * 0.85, k);
    },
    spark: (ctx, x, y, u, k = 1) => {
      const s = backOut(k);
      paint(ctx, starPts(x + 2.4 * u, y - 0.6 * u, 0.75 * u * s, 0.38, 4), { wash: PAL.gold, ink: PAL.ink, sw: 0.75 });
      paint(ctx, starPts(x - 2.3 * u, y - 0.2 * u, 0.55 * u * s, 0.38, 4), { wash: PAL.whaleCyan, ink: PAL.ink, sw: 0.65 });
    },
    sweat: (ctx, x, y, u, k = 1) => {
      const sx = x + 2.45 * u, sy = y + 0.4 * u + (1 - k) * 0.4 * u;
      paint(ctx, [[sx, sy - 0.65 * u], [sx + 0.36 * u, sy + 0.2 * u], [sx, sy + 0.45 * u], [sx - 0.36 * u, sy + 0.2 * u]], {
        wash: '#60A5FA', fill: '#FFFFFF', fillOp: 110, ink: PAL.ink, sw: 0.75, curv: 0.5
      });
    },
    anger: (ctx, x, y, u, k = 1) => {
      const ax = x + 1.85 * u, ay = y + 0.2 * u;
      for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        inkLine(ctx, [
          [ax + dx * 0.52 * u, ay + dy * 0.16 * u],
          [ax + dx * 0.16 * u, ay + dy * 0.16 * u],
          [ax + dx * 0.16 * u, ay + dy * 0.52 * u]
        ], 1.2, '#EF4444', 'ink', 0);
      }
    },
    steam: (ctx, x, y, u, k = 1) => {
      for (const s of [-1, 1]) {
        const px = x + s * 2.5 * u, py = y - 0.3 * u;
        paint(ctx, ellPts(px, py, 0.55 * u * k, 0.42 * u * k, 10), { wash: '#FFFFFF', ink: PAL.ink, sw: 0.75 });
        paint(ctx, ellPts(px + s * 0.45 * u, py - 0.42 * u, 0.42 * u * k, 0.34 * u * k, 10), { wash: '#FFFFFF', ink: PAL.ink, sw: 0.7 });
      }
    },
    bulb: (ctx, x, y, u, k = 1) => {
      const by = y - 1.15 * u;
      paint(ctx, ellPts(x, by, 0.68 * u * k, 0.74 * u * k, 14), { wash: PAL.gold, fill: '#FEF08A', fillOp: 130, ink: PAL.ink, sw: 0.9 });
      paint(ctx, rectPts(x - 0.32 * u * k, by + 0.55 * u * k, 0.64 * u * k, 0.32 * u * k, 0.4), { wash: '#94A3B8', ink: PAL.ink, sw: 0.75 });
      for (let a = -2.4; a <= -0.7; a += 0.55) {
        inkLine(ctx, [[x + Math.cos(a) * 0.9 * u, by + Math.sin(a) * 0.9 * u], [x + Math.cos(a) * 1.3 * u, by + Math.sin(a) * 1.3 * u]], 1.0, PAL.gold, 'ink', 0);
      }
    },
    music: (ctx, x, y, u, k = 1) => {
      const mx = x + 2.4 * u, my = y - 0.5 * u;
      paint(ctx, ellPts(mx, my, 0.32 * u * k, 0.24 * u * k, 10), { wash: PAL.whaleCyan, ink: PAL.ink, sw: 0.8 });
      inkLine(ctx, [[mx + 0.26 * u * k, my], [mx + 0.26 * u * k, my - 0.95 * u * k], [mx + 0.78 * u * k, my - 0.75 * u * k]], 1.2, PAL.ink, 'ink', 0);
    },
    zzz: (ctx, x, y, u, k = 1) => {
      letter(ctx, 'Z', x + 2.0 * u, y - 0.2 * u, 1.1 * u * k, PAL.whaleSky, { stroke: PAL.ink, ink: false });
      letter(ctx, 'z', x + 2.7 * u, y - 0.9 * u, 0.85 * u * k, PAL.whaleSky, { stroke: PAL.ink, ink: false });
    },
    dots: (ctx, x, y, u, k = 1) => {
      for (let i = 0; i < 3; i++) {
        paint(ctx, ellPts(x + (1.8 + i * 0.52) * u, y - 0.4 * u, 0.18 * u * k, 0.18 * u * k, 8), { wash: PAL.cream, ink: PAL.ink, sw: 0.7 });
      }
    },
    cloud: (ctx, x, y, u, k = 1) => {
      const cy = y - 1.35 * u;
      paint(ctx, ellPts(x, cy, 1.25 * u * k, 0.58 * u * k, 16), { wash: '#64748B', fill: '#334155', fillOp: 120, ink: PAL.ink, sw: 0.85 });
    },
    lines: (ctx, x, y, u, k = 1) => {
      for (let i = 0; i < 4; i++) {
        const lx = x + (1.6 + i * 0.32) * u;
        inkLine(ctx, [[lx, y + 0.1 * u], [lx, y + 1.1 * u * k]], 1.0, PAL.indigo, 'ink', 0);
      }
    },
    stars: (ctx, x, y, u, k = 1, t = 0) => {
      for (let i = 0; i < 3; i++) {
        const a = t * 4 + (i / 3) * TAU;
        const sx = x + Math.cos(a) * 1.45 * u, sy = y - 0.45 * u + Math.sin(a) * 0.38 * u;
        paint(ctx, starPts(sx, sy, 0.42 * u * k, 0.4, 4), { wash: PAL.gold, ink: PAL.ink, sw: 0.6 });
      }
    },
    spout: (ctx, x, y, u, k = 1) => {
      // Signature DeepSeek Whale Girl water-spout fountain with floating heart!
      for (const s of [-1, 1]) {
        inkLine(ctx, [
          [x, y + 0.1 * u],
          [x + s * 0.65 * u * k, y - 0.95 * u * k],
          [x + s * 1.35 * u * k, y - 0.35 * u * k]
        ], 1.25, PAL.whaleCyan, 'ink', 0.6);
      }
      paint(ctx, heartPts(x, y - 1.25 * u * k, 0.72 * u * k), { wash: PAL.rose, ink: PAL.ink, sw: 0.7 });
    }
  };
  const letter = CORE.letter;

  // ============================================================================
  // 5. 31 Acted Emotions (`EMO` + `feel()` + `emotions()`)
  //    Exact 1-to-1 counterpart to ClaudeAnimationBase/src/clawd.js!
  // ============================================================================
  const EMO = {
    neutral:    { eyes: 'open',   mouth: 'smile',  brows: 0 },
    happy:      { eyes: 'happy',  mouth: 'grin',   brows: 0.2,  blush: true, bounce: 1 },
    excited:    { eyes: 'spark',  mouth: 'laugh',  brows: 0.35, blush: true, bounce: 1.8, wave: 1, emote: 'spark' },
    laugh:      { eyes: 'happy',  mouth: 'laugh',  brows: 0.25, blush: true, sq: 0.10, bounce: 1.5, aL: 0.75, aR: 0.75 },
    love:       { eyes: 'heart',  mouth: 'grin',   brows: 0.2,  blush: true, sway: 1, emote: 'hearts' },
    shy:        { eyes: 'open',   mouth: 'cat',    brows: -0.3, blush: true, lookX: -0.6, lookY: 0.4, sq: -0.06, aL: -0.4, aR: -0.4 },
    proud:      { eyes: 'happy',  mouth: 'smirk',  brows: 0.25, sq: 0.11, lean: -0.05, aL: -0.35, aR: -0.35, emote: 'spark' },
    smug:       { eyes: 'lids',   mouth: 'smirk',  brows: 0.3,  lookX: 0.5, lean: -0.06, aL: -0.3, aR: 0.3 },
    relieved:   { eyes: 'happy',  mouth: 'smile',  brows: -0.25, blush: true, sq: -0.05, emote: 'sweat' },
    sad:        { eyes: 'sad',    mouth: 'frown',  brows: -0.45, lookY: 0.5, sq: -0.10, lean: 0.08, aL: -0.5, aR: -0.5, emote: 'cloud' },
    cry:        { eyes: 'cry',    mouth: 'O',      brows: -0.5, sq: -0.08, tremble: 1, aL: 0.6, aR: 0.6 },
    angry:      { eyes: 'angry',  mouth: 'grit',   brows: 0.6,  sq: -0.08, lean: 0.08, aL: 0.45, aR: 0.45, emote: 'anger' },
    furious:    { eyes: 'angry',  mouth: 'O',      brows: 0.75, sq: 0.12, tremble: 1.8, aL: 1.15, aR: 1.15, emote: 'steam' },
    scared:     { eyes: 'pin',    mouth: 'wavy',   brows: -0.5, sq: 0.12, tremble: 1.6, aL: 0.85, aR: 0.85, emote: 'sweat' },
    surprised:  { eyes: 'wide',   mouth: 'O',      brows: 0.5,  sq: 0.16, dy: -0.28, aL: 0.95, aR: 0.95, emote: '!' },
    confused:   { eyes: 'open',   mouth: 'wavy',   brows: -0.3, lookX: 0.4, lookY: -0.3, lean: 0.10, aL: -0.2, aR: 0.75, emote: '?' },
    thinking:   { eyes: 'open',   mouth: 'flat',   brows: 0.15, lookX: 0.5, lookY: -0.6, lean: -0.05, aL: -0.3, aR: 0.65, emote: 'dots' },
    idea:       { eyes: 'spark',  mouth: 'O',      brows: 0.45, sq: 0.14, dy: -0.22, aL: 0.3, aR: 1.25, emote: 'bulb' },
    determined: { eyes: 'angry',  mouth: 'smirk',  brows: 0.5,  sq: 0.06, lean: 0.08, aL: 0.6, aR: 0.85 },
    sleepy:     { eyes: 'sleep',  mouth: 'o',      brows: -0.2, sq: -0.09, sway: 0.5, aL: -0.5, aR: -0.5, emote: 'zzz' },
    bored:      { eyes: 'lids',   mouth: 'flat',   brows: 0,    lookX: -0.4, sq: -0.06, lean: -0.06 },
    nervous:    { eyes: 'wide',   mouth: 'wavy',   brows: -0.4, tremble: 1.1, lookX: 0.4, aL: 0.2, aR: 0.2, emote: 'sweat' },
    suspicious: { eyes: 'narrow', mouth: 'flat',   brows: 0.35, lookX: 0.7, lean: 0.08 },
    disgusted:  { eyes: 'squint', mouth: 'wavy',   brows: -0.3, sq: -0.06, lean: -0.10, emote: 'lines' },
    dizzy:      { eyes: 'swirl',  mouth: 'o',      brows: -0.2, sway: 1.6, aL: 0.3, aR: -0.2, emote: 'stars' },
    cool:       { eyes: 'shades', mouth: 'smirk',  brows: 0.2,  lean: -0.07, aL: -0.3, aR: 0.4, emote: 'spark' },
    starstruck: { eyes: 'star',   mouth: 'O',      brows: 0.4,  blush: true, bounce: 1.5, aL: 0.85, aR: 0.85, emote: 'spark' },
    ko:         { eyes: 'x',      mouth: 'tongue', brows: 0,    sq: -0.16, lean: 0.14, aL: -0.6, aR: -0.6, emote: 'stars' },
    playful:    { eyes: 'wink',   mouth: 'tongue', brows: 0.25, blush: true, lean: 0.08, aL: 0.4, aR: 0.95, emote: 'music' },
    mischief:   { eyes: 'squint', mouth: 'grin',   brows: 0.5,  lean: 0.09, aL: 0.35, aR: 0.35 },
    hopeful:    { eyes: 'spark',  mouth: 'smile',  brows: -0.25, blush: true, lookY: -0.4, sq: 0.06, aL: 0.25, aR: 0.25 }
  };

  function feel(name, t = 0, over = {}) {
    const e = EMO[name] || EMO.neutral;
    const ph = (over.seed || 0) * 1.7;
    let dy = e.dy || 0, sq = e.sq || 0, rot = e.lean || 0;
    let aL = e.aL ?? 0.2, aR = e.aR ?? 0.2;
    if (e.bounce) {
      const b = Math.abs(wob(t, 2.2 * e.bounce, ph));
      dy -= b * 0.22;
      sq += (b - 0.5) * 0.14;
    }
    if (e.sway) {
      rot += wob(t, 0.9 * e.sway, ph) * 0.08;
    }
    if (e.tremble) {
      rot += wob(t, 14, ph) * 0.025 * e.tremble;
      dy += wob(t, 19, ph + 1) * 0.04 * e.tremble;
    }
    if (e.wave) {
      aR = 0.95 + 0.45 * wob(t, 3.2, ph);
    }
    return {
      eyes: e.eyes,
      mouth: e.mouth,
      brows: e.brows,
      blush: e.blush,
      lookX: e.lookX || 0,
      lookY: e.lookY || 0,
      emote: e.emote || null,
      dy,
      sq,
      rot,
      aL,
      aR,
      t,
      ...over
    };
  }

  function emotions(t, keys, o = {}) {
    let idx = 0;
    for (let i = 0; i < keys.length; i++) {
      if (t >= keys[i][0]) idx = i;
    }
    const [t0, name, over] = keys[idx];
    const base = feel(name, t, { ...o, ...(over || {}) });
    if (idx > 0) {
      const tk = take(t, t0, 0.75);
      base.dy = (base.dy || 0) + tk.dy;
      base.sq = (base.sq || 0) + tk.sq;
      base.emoteK = clamp((t - t0) / 0.22, 0, 1);
    } else {
      base.emoteK = 1;
    }
    return base;
  }

  // ============================================================================
  // 6. Dance / Locomotion Presets (`move(style, t, variant)`)
  // ============================================================================
  function move(style = 'bounce', t = 0, variant = 0) {
    const p1 = pulse(t), p2 = pulse2(t);
    const ph = variant * 1.3;
    switch (style) {
      case 'wave':
        return {
          dy: -0.15 * p1,
          sq: 0.08 * p1,
          rot: wob(t, 1.2, ph) * 0.04,
          aL: 0.25,
          aR: 1.15 + 0.42 * Math.sin(t * 10 + ph)
        };
      case 'roof':
        return {
          dy: -0.26 * p1,
          sq: 0.14 * p1 - 0.08 * (1 - p1),
          rot: wob(t, 1.5, ph) * 0.06,
          aL: 1.15 + 0.25 * p2,
          aR: 1.15 + 0.25 * p2
        };
      case 'dance':
        return {
          dy: -0.22 * p2,
          sq: 0.12 * p2,
          rot: Math.sin(t * 6.5 + ph) * 0.08,
          aL: 0.65 + 0.55 * Math.sin(t * 6.5 + ph),
          aR: 0.65 - 0.55 * Math.sin(t * 6.5 + ph),
          walk: t * 2.5
        };
      case 'run':
        return {
          dy: -Math.abs(Math.sin(t * 15 + ph)) * 0.28,
          sq: Math.cos(t * 15 + ph) * 0.10,
          rot: 0.12,
          aL: Math.sin(t * 15 + ph) * 0.9,
          aR: -Math.sin(t * 15 + ph) * 0.9,
          walk: t * 5.2
        };
      case 'bounce':
      default:
        return {
          dy: -0.18 * p1,
          sq: 0.10 * p1 - 0.05 * (1 - p1),
          rot: wob(t, 1.0, ph) * 0.03,
          aL: 0.25 + 0.15 * p1,
          aR: 0.25 + 0.15 * p1
        };
    }
  }

  // ============================================================================
  // 7. 16+ Hats & Headgear (`HATS` — Default is `maid`: Ruffled Headband + Twin Blue Bows!)
  // ============================================================================
  function drawBow(ctx, bx, by, u, col = C.hairTop, sc = 1) {
    const s = u * sc;
    paint(ctx, [[bx, by], [bx - 0.72 * s, by - 0.42 * s], [bx - 0.62 * s, by + 0.42 * s]], { wash: col, ink: PAL.ink, sw: 0.75 });
    paint(ctx, [[bx, by], [bx + 0.72 * s, by - 0.42 * s], [bx + 0.62 * s, by + 0.42 * s]], { wash: col, ink: PAL.ink, sw: 0.75 });
    paint(ctx, ellPts(bx, by, 0.20 * s, 0.20 * s, 8), { wash: C.gold, ink: PAL.ink, sw: 0.65 });
  }

  const HATS = {
    // Default signature DeepSeek Whale Maid frilly white headband + twin side blue bows!
    maid: (ctx, hx, hy, u, F) => {
      const bandPts = [];
      for (let i = 0; i <= 10; i++) {
        const a = Math.PI + (i / 10) * Math.PI;
        const r = 2.65 * u + (i % 2 ? 0.18 * u : 0);
        bandPts.push([hx + Math.cos(a) * r, hy + 0.95 * u + Math.sin(a) * (1.35 * u)]);
      }
      for (let i = 10; i >= 0; i--) {
        const a = Math.PI + (i / 10) * Math.PI;
        bandPts.push([hx + Math.cos(a) * 2.15 * u, hy + 1.05 * u + Math.sin(a) * (0.95 * u)]);
      }
      paint(ctx, bandPts, { wash: '#FFFFFF', fill: C.apronShd, fillOp: 90, ink: PAL.ink, sw: 0.95 });
      if (!F.profile) {
        drawBow(ctx, hx - 2.35 * u, hy + 0.55 * u, u, C.hairTop, 0.88);
        drawBow(ctx, hx + 2.35 * u, hy + 0.55 * u, u, C.hairTop, 0.88);
      } else {
        drawBow(ctx, hx + 0.25 * u, hy + 0.55 * u, u, C.hairTop, 0.92);
      }
    },
    crown: (ctx, hx, hy, u, F) => {
      HATS.maid(ctx, hx, hy, u, F);
      const cy = hy - 0.25 * u, w = 1.65 * u, h = 1.35 * u;
      paint(ctx, [
        [hx - w, cy], [hx - w * 0.85, cy - h], [hx - w * 0.35, cy - h * 0.45],
        [hx, cy - h * 1.18], [hx + w * 0.35, cy - h * 0.45], [hx + w * 0.85, cy - h], [hx + w, cy]
      ], { wash: PAL.gold, fill: PAL.ochre, fillOp: 110, ink: PAL.ink, sw: 1.0 });
      paint(ctx, ellPts(hx, cy - h * 0.45, 0.24 * u, 0.24 * u, 8), { wash: '#EF4444', ink: PAL.ink, sw: 0.6 });
    },
    wizard: (ctx, hx, hy, u) => {
      const cy = hy - 0.1 * u;
      paint(ctx, ellPts(hx, cy, 2.85 * u, 0.52 * u, 18), { wash: '#3B0764', fill: '#581C87', fillOp: 110, ink: PAL.ink, sw: 1.0 });
      paint(ctx, [[hx - 1.85 * u, cy - 0.1 * u], [hx + 0.35 * u, cy - 3.35 * u], [hx + 1.85 * u, cy - 0.1 * u]], {
        wash: '#4C1D95', fill: '#2E1065', fillOp: 110, ink: PAL.ink, sw: 1.0
      });
      paint(ctx, starPts(hx + 0.05 * u, cy - 1.35 * u, 0.52 * u, 0.4, 5), { wash: PAL.gold, ink: PAL.ink, sw: 0.6 });
    },
    hard: (ctx, hx, hy, u) => {
      const cy = hy + 0.15 * u;
      paint(ctx, ellPts(hx, cy - 0.4 * u, 2.45 * u, 1.55 * u, 16), { wash: '#FACC15', fill: '#CA8A04', fillOp: 100, ink: PAL.ink, sw: 1.0 });
      paint(ctx, rrPts(hx - 2.85 * u, cy - 0.35 * u, 5.7 * u, 0.52 * u, 4, 0.6), { wash: '#EAB308', ink: PAL.ink, sw: 0.95 });
    },
    sweatband: (ctx, hx, hy, u, F) => {
      HATS.maid(ctx, hx, hy, u, F);
      paint(ctx, rrPts(hx - 2.65 * u, hy + 0.35 * u, 5.3 * u, 0.68 * u, 4, 0.6), { wash: '#EF4444', fill: '#FFFFFF', fillOp: 80, ink: PAL.ink, sw: 0.95 });
      letter(ctx, '必胜', hx, hy + 0.68 * u, 0.58 * u, '#FFFFFF', { stroke: PAL.ink, ink: false });
    },
    diving: (ctx, hx, hy, u, F) => {
      HATS.maid(ctx, hx, hy, u, F);
      const gy = hy + 0.48 * u;
      paint(ctx, rrPts(hx - 2.55 * u, gy - 0.45 * u, 5.1 * u, 0.85 * u, 5, 0.6), { wash: PAL.ochre, ink: PAL.ink, sw: 0.95 });
      for (const s of [-1, 1]) {
        paint(ctx, ellPts(hx + s * 1.05 * u, gy, 0.78 * u, 0.68 * u, 12), { wash: '#38BDF8', fill: '#E0F2FE', fillOp: 120, ink: PAL.ink, sw: 0.95 });
      }
    },
    headphones: (ctx, hx, hy, u, F) => {
      HATS.maid(ctx, hx, hy, u, F);
      inkLine(ctx, [[hx - 3.0 * u, hy + 1.8 * u], [hx, hy - 0.85 * u], [hx + 3.0 * u, hy + 1.8 * u]], 1.8, '#EC4899', 'ink', 0.6);
      for (const s of [-1, 1]) {
        paint(ctx, ellPts(hx + s * 2.95 * u, hy + 1.85 * u, 0.58 * u, 0.88 * u, 12), { wash: '#EC4899', fill: '#BE185D', fillOp: 100, ink: PAL.ink, sw: 0.95 });
      }
    },
    party: (ctx, hx, hy, u, F) => {
      HATS.maid(ctx, hx, hy, u, F);
      paint(ctx, [[hx - 1.15 * u, hy - 0.1 * u], [hx, hy - 2.45 * u], [hx + 1.15 * u, hy - 0.1 * u]], {
        wash: PAL.rose, fill: PAL.gold, fillOp: 95, ink: PAL.ink, sw: 0.95
      });
      paint(ctx, ellPts(hx, hy - 2.55 * u, 0.32 * u, 0.32 * u, 8), { wash: PAL.gold, ink: PAL.ink, sw: 0.7 });
    },
    halo: (ctx, hx, hy, u, F) => {
      HATS.maid(ctx, hx, hy, u, F);
      paint(ctx, ellPts(hx, hy - 0.95 * u, 1.85 * u, 0.42 * u, 16), { wash: PAL.gold, ink: PAL.ink, sw: 0.9 });
    },
    top: (ctx, hx, hy, u) => {
      paint(ctx, ellPts(hx, hy + 0.05 * u, 2.55 * u, 0.42 * u, 16), { wash: '#1E293B', ink: PAL.ink, sw: 0.95 });
      paint(ctx, rectPts(hx - 1.55 * u, hy - 2.15 * u, 3.1 * u, 2.2 * u, 0.8), { wash: '#1E293B', fill: '#0F172A', fillOp: 120, ink: PAL.ink, sw: 0.95 });
      paint(ctx, rectPts(hx - 1.55 * u, hy - 0.45 * u, 3.1 * u, 0.42 * u, 0.4), { wash: PAL.rose, ink: PAL.ink, sw: 0.75 });
    },
    fedora: (ctx, hx, hy, u) => {
      paint(ctx, ellPts(hx, hy + 0.1 * u, 2.85 * u, 0.45 * u, 16), { wash: '#78350F', ink: PAL.ink, sw: 0.95 });
      paint(ctx, rrPts(hx - 1.75 * u, hy - 1.35 * u, 3.5 * u, 1.45 * u, 8, 0.8), { wash: '#92400E', ink: PAL.ink, sw: 0.95 });
    },
    flower: (ctx, hx, hy, u, F) => {
      HATS.maid(ctx, hx, hy, u, F);
      const fx = hx + 1.85 * u, fy = hy - 0.05 * u;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * TAU;
        paint(ctx, ellPts(fx + Math.cos(a) * 0.42 * u, fy + Math.sin(a) * 0.42 * u, 0.34 * u, 0.34 * u, 8), { wash: PAL.rose, ink: PAL.ink, sw: 0.65 });
      }
      paint(ctx, ellPts(fx, fy, 0.26 * u, 0.26 * u, 8), { wash: PAL.gold, ink: PAL.ink, sw: 0.65 });
    },
    cat: (ctx, hx, hy, u) => {
      for (const s of [-1, 1]) {
        paint(ctx, [[hx + s * 0.85 * u, hy + 0.1 * u], [hx + s * 1.95 * u, hy - 1.35 * u], [hx + s * 2.45 * u, hy + 0.35 * u]], {
          wash: C.dressNavy, fill: PAL.rose, fillOp: 110, ink: PAL.ink, sw: 0.95
        });
      }
    }
  };

  // ============================================================================
  // 8. Apron Whale Emblem Helper (`drawApronWhaleLogo`)
  // ============================================================================
  function drawApronWhaleLogo(ctx, cx, cy, u) {
    paint(ctx, ellPts(cx - 0.1 * u, cy + 0.08 * u, 0.62 * u, 0.42 * u, 12), {
      wash: C.whaleLogo, fill: C.hairTop, fillOp: 110, ink: PAL.ink, sw: 0.65
    });
    paint(ctx, [[cx + 0.42 * u, cy + 0.08 * u], [cx + 0.85 * u, cy - 0.25 * u], [cx + 0.78 * u, cy + 0.32 * u]], {
      wash: C.whaleLogo, ink: PAL.ink, sw: 0.6
    });
    inkLine(ctx, [[cx - 0.15 * u, cy - 0.35 * u], [cx - 0.38 * u, cy - 0.68 * u]], 0.7, C.hairTop, 'inkfine', 0);
    inkLine(ctx, [[cx - 0.05 * u, cy - 0.35 * u], [cx + 0.18 * u, cy - 0.68 * u]], 0.7, C.hairTop, 'inkfine', 0);
  }

  // ============================================================================
  // 9. Master Character Rig (`whaleGirl(ctx, x, y, u, o)`)
  // ============================================================================
  function whaleGirlSingle(ctx, x, y, u = 20, o = {}) {
    boilSeed('whaleGirl' + (o.seed || 0) + Math.round(x));
    const F = VIEWS[o.view || 'front'] || VIEWS.front;
    const t = o.t || 0;
    const sq = clamp(o.sq || 0, -0.35, 0.35);
    const sx = (1 - sq * 0.55) * (o.flip ? -1 : 1);
    const sy = 1 + sq * 0.75;
    const dy = (o.dy || 0) * u;

    // Ground shadow
    if (!o.noShadow) {
      paint(ctx, ellPts(x, y + 0.15 * u, 2.45 * u * (1 - (o.dy || 0) * 0.15), 0.52 * u, 16), {
        wash: PAL.ink, washOp: 65, ink: null
      });
    }

    ctx.save();
    ctx.translate(x, y + dy);
    if (o.rot) ctx.rotate(o.rot);
    ctx.scale(sx, sy);

    // 1. SWAYING WHALE TAIL & FLUKE (behind body)
    const tailWag = Math.sin(t * 5.5 + (o.seed || 0)) * 0.24 * u;
    if (o.tailSit) {
      // Curled whale tail cushion in front/side for sitting with laptop!
      paint(ctx, ellPts(0.55 * u, -0.85 * u, 2.45 * u, 0.92 * u, 18), {
        wash: C.hairMid, fill: C.hairDark, fillOp: 120, ink: PAL.ink, sw: 1.05
      });
    } else {
      const tx0 = 0.65 * u * F.tailSide, ty0 = -1.65 * u;
      const tx1 = (2.85 * F.tailSide + 0.35) * u, ty1 = -2.35 * u + tailWag;
      paint(ctx, ribbon([[tx0, ty0], [(tx0 + tx1) * 0.5, ty0 - 0.15 * u], [tx1, ty1]], 1.35 * u, 0.62 * u, 4), {
        wash: C.hairMid, fill: C.hairDark, fillOp: 120, ink: PAL.ink, sw: 1.0
      });
      // Twin tail flukes
      paint(ctx, ellPts(tx1 + 0.35 * u, ty1 - 0.45 * u, 0.72 * u, 0.36 * u, 10, 0.6, -0.45), {
        wash: C.hairTop, fill: C.hairMid, fillOp: 100, ink: PAL.ink, sw: 0.9
      });
      paint(ctx, ellPts(tx1 + 0.42 * u, ty1 + 0.32 * u, 0.72 * u, 0.36 * u, 10, 0.6, 0.45), {
        wash: C.hairTop, fill: C.hairMid, fillOp: 100, ink: PAL.ink, sw: 0.9
      });
    }

    // 2. FLOWING BACK HAIR (`#2D72B2` -> `#4CA8DF`)
    paint(ctx, ellPts(0, -4.35 * u, 3.15 * u, 2.75 * u, 20), {
      wash: C.hairDark, fill: C.hairMid, fillOp: 125, ink: PAL.ink, sw: 1.05
    });

    // 3. LEGS & MARY-JANE SHOES (with `walk` cycle)
    if (!o.tailSit) {
      const wPh = o.walk != null ? o.walk * Math.PI : 0;
      const lOff = o.walk != null ? Math.sin(wPh) * 0.45 * u : 0;
      const rOff = o.walk != null ? -Math.sin(wPh) * 0.45 * u : 0;
      for (const [lx, lyOff] of [[-0.82 * u, lOff], [0.82 * u, rOff]]) {
        paint(ctx, rectPts(lx - 0.38 * u, -1.55 * u + lyOff * 0.3, 0.76 * u, 1.35 * u, 0.6), {
          wash: '#FFFFFF', fill: C.apronShd, fillOp: 80, ink: PAL.ink, sw: 0.9
        });
        paint(ctx, ellPts(lx, -0.18 * u + lyOff * 0.3, 0.56 * u, 0.32 * u, 10), {
          wash: C.dressNavy, ink: PAL.ink, sw: 0.95
        });
      }
    }

    // 4. NAVY SAILOR MAID DRESS & WHITE WHALE APRON
    const skirtPts = [
      [-1.55 * u, -3.65 * u],
      [1.55 * u, -3.65 * u],
      [2.35 * u, -1.25 * u],
      [-2.35 * u, -1.25 * u]
    ];
    paint(ctx, skirtPts, { wash: C.dressNavy, fill: C.dressBlue, fillOp: 115, ink: PAL.ink, sw: 1.1, curv: 0.25 });
    // White frilly hem along bottom of skirt
    paint(ctx, rrPts(-2.42 * u, -1.42 * u, 4.84 * u, 0.34 * u, 4, 0.6), {
      wash: '#FFFFFF', ink: PAL.ink, sw: 0.85
    });

    if (!F.back) {
      // Front White Apron with Blue Whale Emblem & Gold Side Bows
      paint(ctx, rrPts(-1.38 * u + F.eyeShift * 0.35 * u, -3.45 * u, 2.76 * u, 2.08 * u, 10, 0.8), {
        wash: C.apron, fill: C.apronShd, fillOp: 95, ink: PAL.ink, sw: 0.95
      });
      // Sailor collar V-neck & cyan gem
      paint(ctx, [[-1.15 * u, -3.65 * u], [0, -2.85 * u], [1.15 * u, -3.65 * u]], {
        wash: C.dressBlue, ink: PAL.ink, sw: 0.85
      });
      paint(ctx, ellPts(0, -3.35 * u, 0.24 * u, 0.24 * u, 8), { wash: PAL.whaleCyan, ink: PAL.ink, sw: 0.6 });
      drawApronWhaleLogo(ctx, F.eyeShift * 0.35 * u, -2.35 * u, u);
      // Tiny gold bows on apron corners
      drawBow(ctx, -1.45 * u, -1.55 * u, u, C.gold, 0.42);
      drawBow(ctx, 1.45 * u, -1.55 * u, u, C.gold, 0.42);
    } else {
      // Back view: Large white maid apron bow tied at the waist!
      drawBow(ctx, 0, -2.35 * u, u, '#FFFFFF', 1.35);
    }

    // 5. LEFT & RIGHT ARMS + PROP HOOKS (`armL`, `armR`, `tailSit` laptop, `heartHands`)
    const aL = o.heartHands ? 0.85 : (o.aL ?? 0.25);
    const aR = o.heartHands ? 0.85 : (o.aR ?? 0.25);

    const drawArm = (side, ang, propFn) => {
      ctx.save();
      ctx.translate(side * 1.55 * u, -3.25 * u);
      ctx.rotate(side * (-0.55 + ang));
      paint(ctx, rrPts(-0.42 * u, -0.2 * u, 0.84 * u, 1.65 * u, 5, 0.6), {
        wash: C.dressNavy, fill: C.dressBlue, fillOp: 100, ink: PAL.ink, sw: 0.95
      });
      paint(ctx, rectPts(-0.46 * u, 1.15 * u, 0.92 * u, 0.28 * u, 0.4), { wash: '#FFFFFF', ink: PAL.ink, sw: 0.75 });
      paint(ctx, ellPts(0, 1.58 * u, 0.38 * u, 0.38 * u, 10), { wash: C.skin, ink: PAL.ink, sw: 0.85 });
      if (propFn) {
        ctx.save();
        ctx.translate(0, 1.65 * u);
        propFn(ctx, u);
        ctx.restore();
      }
      ctx.restore();
    };

    if (!F.profile) drawArm(-1, aL, o.armL);
    drawArm(1, aR, o.armR);

    // Optional Laptop on curled tail when `o.tailSit === true`
    if (o.tailSit && !F.back) {
      paint(ctx, rrPts(-1.35 * u, -2.65 * u, 2.7 * u, 1.55 * u, 6, 0.6), {
        wash: '#CBD5E1', fill: '#94A3B8', fillOp: 110, ink: PAL.ink, sw: 1.0
      });
      paint(ctx, ellPts(0, -1.88 * u, 0.36 * u, 0.36 * u, 10), { wash: C.whaleLogo, ink: PAL.ink, sw: 0.6 });
    }

    // Optional Heart Hands in front of chest when `o.heartHands === true`
    if (o.heartHands && !F.back) {
      paint(ctx, heartPts(0, -2.85 * u, 1.05 * u), { wash: PAL.rose, fill: '#E11D48', fillOp: 110, ink: PAL.ink, sw: 0.9 });
    }

    // 6. CHIBI HEAD, HAIR BANGS, EARS/FINS, EYES, MOUTH, HAT & EMOTE
    const hx = F.eyeShift * 0.25 * u, hy = -5.65 * u;

    // Side twin-tails / gradient hair locks hanging past cheeks (`#2D72B2` -> `#4CA8DF`)
    const lockSides = F.profile ? [-0.35] : [-1, 1];
    for (const s of lockSides) {
      const lx = hx + s * 2.55 * u;
      paint(ctx, [
        [lx - 0.52 * u, hy - 0.1 * u],
        [lx + 0.52 * u, hy - 0.1 * u],
        [lx + 0.72 * u, hy + 3.45 * u],
        [lx - 0.42 * u, hy + 3.45 * u]
      ], { wash: C.hairTop, fill: C.hairMid, fillOp: 115, ink: PAL.ink, sw: 0.95, curv: 0.35 });
    }

    // Cute side whale-fin ears
    for (const s of (F.profile ? [-0.2] : [-1, 1])) {
      paint(ctx, [
        [hx + s * 2.35 * u, hy + 0.35 * u],
        [hx + s * 3.35 * u, hy - 0.05 * u],
        [hx + s * 2.95 * u, hy + 0.85 * u]
      ], { wash: C.hairTop, fill: '#FFFFFF', fillOp: 110, ink: PAL.ink, sw: 0.85 });
    }

    if (!F.back) {
      // Face oval (`C.skin`)
      paint(ctx, ellPts(hx, hy + 0.35 * u, 2.55 * u, 2.15 * u, 22), {
        wash: C.skin, fill: '#FAD8C6', fillOp: 65, ink: PAL.ink, sw: 1.05
      });

      // Top hair cap & scalloped bangs (`C.hairMid` -> `C.hairTop`)
      paint(ctx, [
        [hx - 2.62 * u, hy + 0.15 * u],
        [hx - 2.25 * u, hy - 1.55 * u],
        [hx, hy - 1.95 * u],
        [hx + 2.25 * u, hy - 1.55 * u],
        [hx + 2.62 * u, hy + 0.15 * u],
        [hx + 1.45 * u, hy - 0.35 * u],
        [hx + 0.55 * u, hy + 0.18 * u],
        [hx - 0.45 * u, hy - 0.32 * u],
        [hx - 1.55 * u, hy + 0.12 * u]
      ], { wash: C.hairMid, fill: C.hairTop, fillOp: 120, ink: PAL.ink, sw: 1.0, curv: 0.35 });

      // Signature Ahoge (top hair sprout curving up)
      inkLine(ctx, [[hx, hy - 1.85 * u], [hx + 0.35 * u, hy - 2.75 * u], [hx + 0.85 * u, hy - 2.45 * u]], 1.4, C.hairTop, 'ink', 0.6);

      // Rosy blush ovals on cheeks
      const ey = hy + 0.55 * u;
      const exOff = F.eyeShift * 0.55 * u;
      paint(ctx, ellPts(hx - 1.45 * u + exOff, ey + 0.58 * u, 0.42 * u, 0.22 * u, 8), {
        wash: C.blush, washOp: o.blush ? 210 : 140, ink: null
      });
      if (!F.profile) {
        paint(ctx, ellPts(hx + 1.45 * u + exOff, ey + 0.58 * u, 0.42 * u, 0.22 * u, 8), {
          wash: C.blush, washOp: o.blush ? 210 : 140, ink: null
        });
      }

      // Eyes (with automatic periodic blink when `eyes === 'open'`)
      let eyeKey = o.eyes || 'open';
      if (eyeKey === 'open' && t > 0 && ((t * 0.8 + (o.seed || 0)) % 3.6) > 3.45) {
        eyeKey = 'happy';
      }
      const eyeFn = EYES[eyeKey] || EYES.open;
      if (F.profile) {
        eyeFn(ctx, hx + 1.05 * u, ey, u, 0.95, o, true);
      } else {
        eyeFn(ctx, hx - 1.08 * u + exOff, ey, u, F.farScale, o, false);
        eyeFn(ctx, hx + 1.08 * u + exOff, ey, u, 1.0, o, true);
      }

      // Eyebrows
      const br = o.brows || 0;
      if (!F.profile) {
        inkLine(ctx, [[hx - 1.55 * u + exOff, ey - (0.85 - br * 0.25) * u], [hx - 0.65 * u + exOff, ey - (0.85 + br * 0.25) * u]], 1.0, PAL.ink, 'ink', 0);
      }
      inkLine(ctx, [[hx + 0.65 * u + exOff, ey - (0.85 + br * 0.25) * u], [hx + 1.55 * u + exOff, ey - (0.85 - br * 0.25) * u]], 1.0, PAL.ink, 'ink', 0);

      // Mouth (with optional automatic voice lip-sync!)
      let mouthKey = o.mouth || 'smile';
      if (o.talking && voiceAt(t) > 0.32) {
        mouthKey = voiceAt(t) > 0.62 ? 'O' : 'grin';
      }
      const mouthFn = MOUTHS[mouthKey] || MOUTHS.smile;
      mouthFn(ctx, hx + exOff * 0.85, hy + 1.38 * u, u);
    } else {
      // Back & 3/4-Back (`qback`) view of head:
      if (F.qback) {
        // Right cheek sliver peeking out from behind back hair in `qback` view!
        paint(ctx, ellPts(hx + 1.45 * u, hy + 0.55 * u, 1.35 * u, 1.65 * u, 14), {
          wash: C.skin, ink: PAL.ink, sw: 0.95
        });
      }
      paint(ctx, ellPts(hx, hy + 0.25 * u, 2.65 * u, 2.25 * u, 20), {
        wash: C.hairMid, fill: C.hairTop, fillOp: 125, ink: PAL.ink, sw: 1.05
      });
      inkLine(ctx, [[hx, hy - 1.85 * u], [hx + 0.35 * u, hy - 2.75 * u]], 1.4, C.hairTop, 'ink', 0.5);
    }

    // 7. HAT / HEADBAND (default `'maid'`)
    const hatName = o.hat === undefined ? 'maid' : o.hat;
    if (hatName && HATS[hatName]) {
      HATS[hatName](ctx, hx, hy - 1.45 * u, u, F);
    }

    // 8. OVERHEAD EMOTE (`o.emote`)
    if (o.emote && EMOTES[o.emote]) {
      const topOff = (EMOTE_TOP[o.emote] || 1.85) * u;
      EMOTES[o.emote](ctx, hx, hy - topOff, u, o.emoteK ?? 1, t);
    }

    ctx.restore();
  }

  // Wrapper supporting motion-smear echo trails (`o.smear > 0`)
  function whaleGirl(ctx, x, y, u = 20, o = {}) {
    if (o.smear && o.smear > 0.05) {
      const dir = o.smearDir || (o.flip ? 1 : -1);
      for (let k = 2; k >= 1; k--) {
        ctx.save();
        ctx.globalAlpha = 0.22 / k;
        whaleGirlSingle(ctx, x - dir * k * 1.15 * u * o.smear, y, u, { ...o, smear: 0, noShadow: true, emote: null });
        ctx.restore();
      }
    }
    whaleGirlSingle(ctx, x, y, u, o);
  }

  const WHALE_GIRL = {
    C,
    VIEWS,
    EYES,
    MOUTHS,
    EMOTES,
    EMOTE_TOP,
    EMO,
    HATS,
    spinView,
    turn,
    feel,
    emotions,
    move,
    drawApronWhaleLogo,
    whaleGirl
  };

  root.WHALE_GIRL = WHALE_GIRL;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = WHALE_GIRL;
  }
})(typeof window !== 'undefined' ? window : globalThis);
