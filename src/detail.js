// ============================================================================
// src/detail.js — 画面"细节层"（ambient pass + foreground pass）
// ============================================================================
// 用户反馈"细节太少"。布景本身已经是完整画面，但缺少**前景遮挡**和**空气中的
// 东西**，看上去就像一张平贴纸。这里补两层：
//
//   drawAmbient(ctx, t, o)     空气层：光柱、飘落物、萤火、气泡、尘埃、镜头光
//   drawForeground(ctx, t, o)  前景层：草叶 / 栏杆 / 窗框 / 树枝 / 帘角 / 城市光斑
//
// 两层都按 `set` 名字和 `seed` 选素材，所以 21 个布景会自动得到 21 套细节，
// 不需要每个布景单独改。
// ============================================================================

(function (root) {
  const CORE = root.CORE || (typeof require !== 'undefined' ? require('./core.js') : {});
  const { W = 1280, H = 720, clamp = (v, a, b) => Math.max(a, Math.min(b, v)),
    lerp = (a, b, k) => a + (b - a) * k, rgba = (c, a) => c } = CORE;

  const TAU = Math.PI * 2;
  const hash = (n) => {
    let x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const rnd = (seed, i, j = 0) => hash(seed * 91.7 + i * 13.13 + j * 7.77);

  // ---- 素材归类：布景名 → 空气粒子 / 前景 --------------------------------
  function profileFor(setName) {
    const s = String(setName || '');
    if (/deepSea|beachNight|poolside|boardwalk|galaxy/.test(s)) return { kind: 'bubble', fg: 'water' };
    if (/fireworks|stage/.test(s)) return { kind: 'ember', fg: 'crowd' };
    if (/autumn|hillMeadow|greenhouse|garden|park/.test(s)) return { kind: 'petal', fg: 'grass' };
    if (/snow|rain|street/.test(s)) return { kind: 'drop', fg: 'railing' };
    if (/classroom|library|cafe|train|bedroom|observatory/.test(s)) return { kind: 'dust', fg: 'window' };
    if (/rooftop|desert|city/.test(s)) return { kind: 'dust', fg: 'bokeh' };
    return { kind: 'dust', fg: 'grass' };
  }

  // ---- 空气层 -------------------------------------------------------------
  function lightShafts(ctx, t, o) {
    const n = o.n || 3;
    const seed = o.seed || 1;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const x = -180 + rnd(seed, i) * (W + 360);
      const w = 90 + rnd(seed, i, 1) * 150;
      const a = (0.05 + rnd(seed, i, 2) * 0.06) * (o.strength || 1);
      const sway = Math.sin(t * 0.4 + i * 1.7) * 26;
      const g = ctx.createLinearGradient(x + sway, 0, x + sway + w * 0.5, H);
      g.addColorStop(0, rgba(o.col || '#BFE7FF', a));
      g.addColorStop(0.55, rgba(o.col || '#BFE7FF', a * 0.55));
      g.addColorStop(1, rgba(o.col || '#BFE7FF', 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x + sway, -60);
      ctx.lineTo(x + sway + w, -60);
      ctx.lineTo(x + sway + w * 2.1, H + 60);
      ctx.lineTo(x + sway + w * 1.2, H + 60);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function bubbles(ctx, t, o) {
    const n = o.n || 26;
    const seed = o.seed || 2;
    for (let i = 0; i < n; i++) {
      const speed = 26 + rnd(seed, i, 1) * 60;
      const x = rnd(seed, i) * (W + 160) - 80 + Math.sin(t * 0.8 + i) * 22;
      const y = H + 40 - ((t * speed + rnd(seed, i, 2) * (H + 200)) % (H + 200));
      const r = 2 + rnd(seed, i, 3) * 7;
      const a = 0.16 + rnd(seed, i, 4) * 0.3;
      ctx.strokeStyle = rgba(o.col || '#CFF3FF', a);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = rgba(o.col || '#CFF3FF', a * 0.35);
      ctx.beginPath();
      ctx.arc(x - r * 0.3, y - r * 0.35, r * 0.32, 0, TAU);
      ctx.fill();
    }
  }

  function petals(ctx, t, o) {
    const n = o.n || 26;
    const seed = o.seed || 3;
    const cols = o.cols || ['#FFC2D8', '#FFE0EC', '#FFD79A', '#F8A9C4'];
    for (let i = 0; i < n; i++) {
      const speed = 46 + rnd(seed, i, 1) * 70;
      const y = ((t * speed + rnd(seed, i, 2) * (H + 240)) % (H + 240)) - 60;
      const x = rnd(seed, i) * (W + 260) - 130 + Math.sin(t * 1.1 + i * 2.3) * 46;
      const r = 3 + rnd(seed, i, 3) * 6;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(t * (0.6 + rnd(seed, i, 4)) + i);
      ctx.fillStyle = rgba(cols[i % cols.length], 0.55 + rnd(seed, i, 5) * 0.35);
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.48, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function embers(ctx, t, o) {
    const n = o.n || 34;
    const seed = o.seed || 4;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const speed = 20 + rnd(seed, i, 1) * 46;
      const y = H + 30 - ((t * speed + rnd(seed, i, 2) * (H + 260)) % (H + 260));
      const x = rnd(seed, i) * (W + 200) - 100 + Math.sin(t * 1.4 + i) * 30;
      const r = 1.4 + rnd(seed, i, 3) * 3;
      const a = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * 3 + i * 1.7));
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
      g.addColorStop(0, rgba(o.col || '#FFD08A', a));
      g.addColorStop(1, rgba(o.col || '#FFD08A', 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r * 4, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drops(ctx, t, o) {
    const n = o.n || 90;
    const seed = o.seed || 5;
    const snow = o.snow;
    ctx.strokeStyle = rgba('#DCEBFF', snow ? 0.7 : 0.3);
    ctx.lineWidth = snow ? 2 : 1.4;
    for (let i = 0; i < n; i++) {
      const speed = snow ? 40 + rnd(seed, i, 1) * 40 : 900 + rnd(seed, i, 1) * 500;
      const len = snow ? 2 : 16 + rnd(seed, i, 2) * 22;
      const y = ((t * speed + rnd(seed, i, 2) * (H + 200)) % (H + 200)) - 40;
      const x = rnd(seed, i) * (W + 200) - 100 + (snow ? Math.sin(t * 0.9 + i) * 24 : 0);
      ctx.beginPath();
      if (snow) {
        ctx.arc(x, y, 1.6 + rnd(seed, i, 3) * 2.2, 0, TAU);
        ctx.fillStyle = rgba('#EAF4FF', 0.55 + rnd(seed, i, 4) * 0.4);
        ctx.fill();
      } else {
        ctx.moveTo(x, y);
        ctx.lineTo(x - 2, y + len);
        ctx.stroke();
      }
    }
  }

  function dust(ctx, t, o) {
    const n = o.n || 40;
    const seed = o.seed || 6;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const x = rnd(seed, i) * (W + 120) - 60 + Math.sin(t * 0.5 + i * 1.3) * 18;
      const y = rnd(seed, i, 1) * H + Math.sin(t * 0.7 + i) * 14;
      const r = 0.8 + rnd(seed, i, 2) * 1.8;
      const a = 0.12 + 0.28 * (0.5 + 0.5 * Math.sin(t * 1.6 + i * 2.1));
      ctx.fillStyle = rgba(o.col || '#FFF4CC', a);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  // ---- 前景层 -------------------------------------------------------------
  function fgGrass(ctx, t, o) {
    const seed = o.seed || 7;
    const g = ctx.createLinearGradient(0, H - 190, 0, H);
    g.addColorStop(0, rgba(o.col || '#0A1A16', 0.0));
    g.addColorStop(1, rgba(o.col || '#0A1A16', 0.78));
    ctx.save();
    ctx.fillStyle = g;
    for (let i = 0; i < 26; i++) {
      const x = rnd(seed, i) * (W + 200) - 100;
      const h = 26 + rnd(seed, i, 1) * 78;
      const w = 7 + rnd(seed, i, 3) * 9;
      const sw = Math.sin(t * 0.9 + i * 0.7) * 14;
      ctx.beginPath();
      ctx.moveTo(x - w, H + 20);
      // 叶尖收成一个圆头，不做成尖刺
      ctx.quadraticCurveTo(x + sw * 0.45 - w * 0.5, H - h * 0.6, x + sw, H - h);
      ctx.quadraticCurveTo(x + sw * 0.45 + w * 0.5, H - h * 0.6, x + w, H + 20);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function fgRailing(ctx, t, o) {
    ctx.save();
    const g = ctx.createLinearGradient(0, H - 100, 0, H);
    g.addColorStop(0, rgba(o.col || '#060E18', 0.82));
    g.addColorStop(1, rgba(o.col || '#060E18', 0.0));
    ctx.fillStyle = g;
    ctx.fillRect(-100, H - 100, W + 200, 110);
    ctx.fillStyle = rgba(o.col || '#060E18', 0.85);
    ctx.fillRect(-100, H - 150, W + 200, 12);
    for (let x = -60; x < W + 90; x += 130) ctx.fillRect(x, H - 150, 9, 62);
    ctx.restore();
  }

  function fgWindow(ctx, t, o) {
    ctx.save();
    // 左右各一道竖直窗框 + 顶部一道横梁，留出大片画面（不要做成黑边）
    const g = ctx.createLinearGradient(0, 0, 70, 0);
    g.addColorStop(0, rgba(o.col || '#050B14', 0.72));
    g.addColorStop(1, rgba(o.col || '#050B14', 0));
    ctx.fillStyle = g;
    ctx.fillRect(-80, -100, 150, H + 200);
    const g2 = ctx.createLinearGradient(W, 0, W - 70, 0);
    g2.addColorStop(0, rgba(o.col || '#050B14', 0.72));
    g2.addColorStop(1, rgba(o.col || '#050B14', 0));
    ctx.fillStyle = g2;
    ctx.fillRect(W - 70, -100, 150, H + 200);
    const g3 = ctx.createLinearGradient(0, -60, 0, 40);
    g3.addColorStop(0, rgba(o.col || '#050B14', 0.66));
    g3.addColorStop(1, rgba(o.col || '#050B14', 0));
    ctx.fillStyle = g3;
    ctx.fillRect(-80, -80, W + 160, 120);
    ctx.restore();
  }

  function fgWater(ctx, t, o) {
    ctx.save();
    const y0 = H - 130;
    const g = ctx.createLinearGradient(0, y0, 0, H);
    g.addColorStop(0, rgba(o.col || '#062033', 0.0));
    g.addColorStop(1, rgba(o.col || '#062033', 0.72));
    ctx.fillStyle = g;
    ctx.fillRect(-100, y0, W + 200, H - y0 + 100);
    ctx.strokeStyle = rgba('#9BE6FF', 0.28);
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      for (let x = -100; x <= W + 100; x += 22) {
        const y = y0 + 34 + i * 34 + Math.sin(x * 0.013 + t * (1.5 + i * 0.4) + i) * 9;
        if (x === -100) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function fgBokeh(ctx, t, o) {
    const seed = o.seed || 8;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 12; i++) {
      const x = rnd(seed, i) * (W + 200) - 100;
      const y = H - 40 - rnd(seed, i, 1) * 220;
      const r = 14 + rnd(seed, i, 2) * 34;
      const a = 0.05 + 0.09 * (0.5 + 0.5 * Math.sin(t * 0.7 + i));
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, rgba(o.col || '#8FD3FF', a));
      g.addColorStop(1, rgba(o.col || '#8FD3FF', 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function fgCrowd(ctx, t, o) {
    const seed = o.seed || 9;
    ctx.save();
    ctx.fillStyle = rgba(o.col || '#04070E', 0.92);
    ctx.beginPath();
    ctx.moveTo(-100, H + 60);
    for (let x = -100; x <= W + 100; x += 26) {
      const bump = 26 + Math.sin(x * 0.02 + seed) * 18 + Math.sin(x * 0.006 + t * 0.6) * 8;
      ctx.lineTo(x, H - bump);
    }
    ctx.lineTo(W + 100, H + 60);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  const FGS = {
    grass: fgGrass, railing: fgRailing, window: fgWindow,
    water: fgWater, bokeh: fgBokeh, crowd: fgCrowd
  };

  // ---- 对外接口 -----------------------------------------------------------
  /**
   * 空气层：画在布景之后、角色之前。
   * o = { set, seed, mood, t, strength }
   */
  function drawAmbient(ctx, t, o = {}) {
    const p = profileFor(o.set);
    const seed = (o.seed || 1) + 0.5;
    const night = /night|deepSea|galaxy|fireworks|stage/i.test(o.set || '') || o.mood === 'night';

    // 光柱只在"有光源"的场景出现
    if (!/deepSea|rain/i.test(o.set || '')) {
      lightShafts(ctx, t, { seed, n: 2, col: night ? '#9AD8FF' : '#FFF1BF', strength: night ? 0.7 : 1 });
    }

    const base = { seed, col: night ? '#CFEFFF' : null, snow: /snow/i.test(o.set || '') };
    if (p.kind === 'bubble') bubbles(ctx, t, { ...base, n: 24 });
    else if (p.kind === 'ember') embers(ctx, t, { ...base, n: 34 });
    else if (p.kind === 'petal') petals(ctx, t, { ...base, n: 26 });
    else if (p.kind === 'drop') drops(ctx, t, { ...base, n: base.snow ? 80 : 90 });
    else dust(ctx, t, { ...base, n: 44 });
  }

  /**
   * 前景层：画在角色之后，制造"隔着一层东西在看"的纵深。
   */
  function drawForeground(ctx, t, o = {}) {
    const p = profileFor(o.set || '');
    const fn = FGS[p.fg] || fgGrass;
    const night = /night|deepSea|galaxy|fireworks|stage/i.test(o.set || '') || o.mood === 'night';
    fn(ctx, t, { seed: (o.seed || 1) + 2.5, col: night ? '#03080F' : null });
  }

  /** 轻微暗角 —— 让中心主体更"亮" */
  function vignette(ctx, o = {}) {
    const g = ctx.createRadialGradient(W / 2, H * 0.48, H * 0.28, W / 2, H * 0.48, H * 0.95);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, rgba(o.col || '#03060E', o.strength ?? 0.42));
    ctx.fillStyle = g;
    ctx.fillRect(-200, -200, W + 400, H + 400);
  }

  const api = { drawAmbient, drawForeground, vignette, profileFor };
  root.DETAIL = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
