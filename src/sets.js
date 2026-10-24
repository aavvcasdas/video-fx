// ============================================================================
// src/sets.js — 20 个可复用的"布景"（Painted Environment Sets）
// ============================================================================
// 用户反馈旧版 MV“一直循环几个画面细节太少”。根因是每个包只有 3~4 个写死的
// `if (t < ...)` 时间片场景，循环套用同一张画。
//
// 本模块把布景抽成**独立、可参数化**的画家函数：
//
//   SETS[name](ctx, t, o)     o = { seed, mood, horizon, groundY, style, pan, zoom }
//
// 同一个画家通过 `mood`（夜晚/黄昏/清晨）、`seed`（布局随机但确定）、
// `pan`（视差位移）就能产出明显不同的画面，因此 20 个布景 ≈ 上百种镜头。
// 每个布景都包含：远景 / 中景 / 近景三层视差 + 动态粒子，避免"一张静态图"。
// ============================================================================

(function (root) {
  const CORE = root.CORE || (typeof require !== 'undefined' ? require('./core.js') : {});
  const { W = 1280, H = 720, clamp = (v, a, b) => Math.max(a, Math.min(b, v)),
    lerp = (a, b, k) => a + (b - a) * k, paint, rectPts, ellPts, rrPts, mixCol, rgba } = CORE;

  const TAU = Math.PI * 2;
  // 确定性伪随机（同一 seed 每帧结果一致，保证逐帧可复现）
  const hash = (n) => {
    let x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const rnd = (seed, i, j = 0) => hash(seed * 91.7 + i * 13.13 + j * 7.77);

  // ---------- 通用零件 --------------------------------------------------------
  function skyGradient(ctx, stops, y0 = 0, y1 = H) {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    for (const [k, c] of stops) g.addColorStop(k, c);
    ctx.fillStyle = g;
    ctx.fillRect(-200, -200, W + 400, H + 400);
  }

  function stars(ctx, t, o = {}) {
    const n = o.n || 90;
    const seed = o.seed || 1;
    for (let i = 0; i < n; i++) {
      const x = rnd(seed, i) * (W + 200) - 100;
      const y = rnd(seed, i, 1) * (o.area || 460);
      const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * (1.2 + rnd(seed, i, 2) * 2.4) + i));
      ctx.fillStyle = rgba(o.col || '#EAF6FF', tw * (o.alpha || 0.9));
      const s = 1 + rnd(seed, i, 3) * 2;
      ctx.fillRect(x, y, s, s);
    }
  }

  function moon(ctx, x, y, r, col = '#FDF6D8', halo = '#8FD3FF') {
    const g = ctx.createRadialGradient(x, y, r * 0.4, x, y, r * 3.2);
    g.addColorStop(0, rgba(halo, 0.35));
    g.addColorStop(1, rgba(halo, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r * 3.2, 0, TAU);
    ctx.fill();
    paint(ctx, ellPts(x, y, r, r, 22), { wash: col, ink: null });
    paint(ctx, ellPts(x - r * 0.3, y - r * 0.25, r * 0.22, r * 0.18, 12), { wash: '#E7E2C6', ink: null });
    paint(ctx, ellPts(x + r * 0.28, y + r * 0.2, r * 0.14, r * 0.12, 10), { wash: '#E7E2C6', ink: null });
  }

  function clouds(ctx, t, o = {}) {
    const n = o.n || 5;
    const y0 = o.y || 150;
    const seed = o.seed || 3;
    const speed = o.speed || 12;
    for (let i = 0; i < n; i++) {
      const w = 150 + rnd(seed, i) * 220;
      const x = ((rnd(seed, i, 1) * (W + 400) + t * speed * (0.4 + rnd(seed, i, 2))) % (W + 500)) - 250;
      const y = y0 + rnd(seed, i, 3) * 130;
      ctx.fillStyle = rgba(o.col || '#DCE9F7', o.alpha ?? 0.75);
      for (let b = 0; b < 4; b++) {
        ctx.beginPath();
        ctx.ellipse(x + (b - 1.5) * w * 0.26, y + Math.sin(b * 2.1) * 8, w * 0.26, w * 0.13, 0, 0, TAU);
        ctx.fill();
      }
    }
  }

  function hills(ctx, y, col, amp = 60, seed = 5, n = 3) {
    for (let k = 0; k < n; k++) {
      ctx.fillStyle = k === 0 ? col : mixCol(col, '#0B1220', 0.14 * k);
      ctx.beginPath();
      ctx.moveTo(-200, H + 200);
      for (let x = -200; x <= W + 200; x += 24) {
        const yy = y + k * 26 + Math.sin((x + seed * 130 + k * 210) * 0.0022) * amp * (1 - k * 0.22);
        ctx.lineTo(x, yy);
      }
      ctx.lineTo(W + 200, H + 200);
      ctx.closePath();
      ctx.fill();
    }
  }

  function waterBand(ctx, t, y, col = '#123A6B', hi = '#6FD3FF', amp = 10) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(-200, H + 200);
    for (let x = -200; x <= W + 200; x += 20) {
      ctx.lineTo(x, y + Math.sin(x * 0.012 + t * 1.6) * amp);
    }
    ctx.lineTo(W + 200, H + 200);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba(hi, 0.45);
    ctx.lineWidth = 2;
    for (let row = 0; row < 4; row++) {
      ctx.beginPath();
      for (let x = -200; x <= W + 200; x += 26) {
        const yy = y + 16 + row * 26 + Math.sin(x * 0.016 + t * (1.2 + row * 0.3) + row) * (amp * 0.7);
        if (x === -200) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
  }

  function floorPlane(ctx, y, col = '#1B2540', line = '#3C4E7A') {
    ctx.fillStyle = col;
    ctx.fillRect(-200, y, W + 400, H - y + 200);
    ctx.strokeStyle = rgba(line, 0.5);
    ctx.lineWidth = 1.5;
    for (let i = 0; i <= 16; i++) {
      const x = -200 + i * 100;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (x - W / 2) * 0.9, H + 60);
      ctx.stroke();
    }
    for (let i = 1; i <= 5; i++) {
      const yy = y + Math.pow(i / 5, 1.7) * (H - y);
      ctx.beginPath();
      ctx.moveTo(-200, yy);
      ctx.lineTo(W + 200, yy);
      ctx.stroke();
    }
  }

  function particles(ctx, t, o = {}) {
    const n = o.n || 40;
    const seed = o.seed || 7;
    for (let i = 0; i < n; i++) {
      const sp = o.speed || 30;
      const x = ((rnd(seed, i) * (W + 160) + Math.sin(t * 0.7 + i) * 22 + t * sp * 0.3) % (W + 160)) - 80;
      const y = (((rnd(seed, i, 1) * (H + 120) + t * sp) % (H + 120))) - 60;
      const r = (o.size || 2) * (0.5 + rnd(seed, i, 2));
      ctx.fillStyle = rgba(o.col || '#BFE9FF', o.alpha ?? 0.55);
      if (o.shape === 'leaf') {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(t * 1.4 + i);
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 3, r * 1.4, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      } else if (o.shape === 'snow') {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TAU);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, r * 1.6, r * 1.6);
      }
    }
  }

  function windowFrame(ctx, x, y, w, h, col = '#0E1A30', bar = '#2A3B5C') {
    ctx.strokeStyle = col;
    ctx.lineWidth = 10;
    ctx.strokeRect(x, y, w, h);
    ctx.lineWidth = 6;
    ctx.strokeStyle = bar;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y);
    ctx.lineTo(x + w / 2, y + h);
    ctx.moveTo(x, y + h * 0.55);
    ctx.lineTo(x + w, y + h * 0.55);
    ctx.stroke();
  }

  function stringLights(ctx, t, x0, x1, y, n = 12, col = '#FFD36E') {
    ctx.strokeStyle = 'rgba(20,28,44,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const x = lerp(x0, x1, i / 40);
      const yy = y + Math.sin((i / 40) * Math.PI) * 40;
      if (i === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
    }
    ctx.stroke();
    for (let i = 0; i < n; i++) {
      const k = i / (n - 1);
      const x = lerp(x0, x1, k);
      const yy = y + Math.sin(k * Math.PI) * 40 + 6;
      const flick = 0.65 + 0.35 * Math.sin(t * 3 + i);
      ctx.fillStyle = rgba(col, flick);
      ctx.beginPath();
      ctx.arc(x, yy, 5, 0, TAU);
      ctx.fill();
      const g = ctx.createRadialGradient(x, yy, 1, x, yy, 26);
      g.addColorStop(0, rgba(col, 0.35 * flick));
      g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, yy, 26, 0, TAU);
      ctx.fill();
    }
  }

  function rain(ctx, t, o = {}) {
    const n = o.n || 90;
    const seed = o.seed || 11;
    ctx.strokeStyle = rgba(o.col || '#9CC7FF', o.alpha ?? 0.4);
    ctx.lineWidth = o.sw || 1.6;
    for (let i = 0; i < n; i++) {
      const x = rnd(seed, i) * (W + 300) - 150;
      const speed = 900 + rnd(seed, i, 1) * 500;
      const y = ((rnd(seed, i, 2) * H + t * speed) % (H + 200)) - 100;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 8, y + 34);
      ctx.stroke();
    }
  }

  // ---------- 布景定义 --------------------------------------------------------
  const SETS = {};

  // 1. 星夜海滩（用户认为最好的那部的核心布景）
  SETS.beachNight = (ctx, t, o = {}) => {
    skyGradient(ctx, [[0, '#071026'], [0.45, '#102A54'], [0.72, '#1E4C7D'], [1, '#0A1A33']]);
    stars(ctx, t, { seed: o.seed || 2, n: 110, area: 420 });
    moon(ctx, 1020 + (o.pan || 0) * 0.1, 130, 46);
    clouds(ctx, t, { y: 190, col: '#3C5C8C', alpha: 0.35, seed: (o.seed || 2) + 1, speed: 6 });
    waterBand(ctx, t, 430, '#0E2E58', '#7DD3FC', 12);
    // 沙滩
    paint(ctx, [[-200, 600], [W + 200, 560], [W + 200, H + 200], [-200, H + 200]], { wash: '#C7B08A', fill: '#9C8663', ink: null });
    for (let i = 0; i < 26; i++) {
      const x = rnd(9, i) * (W + 100) - 50;
      const y = 600 + rnd(9, i, 1) * 110;
      paint(ctx, ellPts(x, y, 3 + rnd(9, i, 2) * 4, 2.5, 8), { wash: '#8A7454', ink: null });
    }
    particles(ctx, t, { n: 28, col: '#FFE9A8', seed: 21, speed: 16, size: 2.2, alpha: 0.7 });
    stringLights(ctx, t, 60, 520, 120, 8, '#FFD98A');
    if (o.prop === 'boat') {
      paint(ctx, [[760, 520], [980, 512], [950, 556], [790, 560]], { wash: '#F2E8D5', ink: '#1A2440', sw: 2 });
    }
  };

  // 2. 黎明海滩
  SETS.beachDawn = (ctx, t, o = {}) => {
    skyGradient(ctx, [[0, '#2A2350'], [0.35, '#7A4A72'], [0.6, '#E08A6B'], [0.8, '#F7C98B'], [1, '#2A3358']]);
    const sx = 640 + (o.pan || 0) * -0.05;
    const g = ctx.createRadialGradient(sx, 470, 20, sx, 470, 420);
    g.addColorStop(0, 'rgba(255,240,190,0.95)');
    g.addColorStop(0.5, 'rgba(255,190,120,0.35)');
    g.addColorStop(1, 'rgba(255,160,90,0)');
    ctx.fillStyle = g;
    ctx.fillRect(-200, -200, W + 400, H + 400);
    paint(ctx, ellPts(sx, 468, 72, 72, 26), { wash: '#FFF3CC', ink: null });
    clouds(ctx, t, { y: 230, col: '#F0C7A8', alpha: 0.55, seed: 12, speed: 8 });
    waterBand(ctx, t, 470, '#1E4C7D', '#FFE3A8', 9);
    paint(ctx, [[-200, 610], [W + 200, 590], [W + 200, H + 200], [-200, H + 200]], { wash: '#D9C6A3', fill: '#B7A181', ink: null });
    particles(ctx, t, { n: 26, col: '#FFD9A0', seed: 4, speed: 12, size: 2 });
  };

  // 3. 深海（水母 / 光柱 / 鱼群）
  SETS.deepSea = (ctx, t, o = {}) => {
    skyGradient(ctx, [[0, '#04203A'], [0.5, '#083A5C'], [1, '#01121F']]);
    // 光柱
    for (let i = 0; i < 6; i++) {
      const x = 120 + i * 210 + Math.sin(t * 0.5 + i) * 22;
      const g = ctx.createLinearGradient(x, 0, x + 90, H);
      g.addColorStop(0, 'rgba(140, 230, 255, 0.22)');
      g.addColorStop(1, 'rgba(140, 230, 255, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x - 40, -50);
      ctx.lineTo(x + 120, -50);
      ctx.lineTo(x + 230, H + 50);
      ctx.lineTo(x + 10, H + 50);
      ctx.closePath();
      ctx.fill();
    }
    // 水母
    for (let i = 0; i < 5; i++) {
      const jx = 150 + i * 250 + Math.sin(t * 0.8 + i * 2) * 26;
      const jy = 180 + (i % 3) * 110 + Math.sin(t * 1.3 + i) * 18;
      const r = 22 + (i % 3) * 9;
      const col = i % 2 ? '#7DE8FF' : '#F0A8FF';
      ctx.fillStyle = rgba(col, 0.55);
      ctx.beginPath();
      ctx.arc(jx, jy, r, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = rgba(col, 0.7);
      ctx.lineWidth = 2;
      for (let k = -2; k <= 2; k++) {
        ctx.beginPath();
        ctx.moveTo(jx + k * r * 0.32, jy);
        ctx.quadraticCurveTo(jx + k * r * 0.5 + Math.sin(t * 2.4 + k) * 8, jy + r * 1.2, jx + k * r * 0.3, jy + r * 2.1);
        ctx.stroke();
      }
    }
    // 鱼群剪影
    for (let i = 0; i < 16; i++) {
      const fx = ((rnd(31, i) * (W + 300) + t * (40 + rnd(31, i, 1) * 40)) % (W + 300)) - 150;
      const fy = 240 + rnd(31, i, 2) * 380;
      ctx.fillStyle = rgba('#CDEFFF', 0.5);
      ctx.beginPath();
      ctx.ellipse(fx, fy, 13, 5, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(fx - 12, fy);
      ctx.lineTo(fx - 22, fy - 6);
      ctx.lineTo(fx - 22, fy + 6);
      ctx.closePath();
      ctx.fill();
    }
    // 海床
    hills(ctx, 620, '#0A2138', 26, 6, 2);
    particles(ctx, t, { n: 40, col: '#BFEFFF', seed: 33, speed: -22, size: 2.4, alpha: 0.45 });
  };

  // 4. 城市天台夜景
  SETS.rooftopCity = (ctx, t, o = {}) => {
    skyGradient(ctx, [[0, '#0A0F24'], [0.55, '#1A2450'], [1, '#2A1A3E']]);
    stars(ctx, t, { seed: 8, n: 70, area: 300 });
    moon(ctx, 240, 120, 34, '#F5F0E0', '#A78BFA');
    // 楼群
    for (let layer = 0; layer < 3; layer++) {
      const base = 520 + layer * 40;
      const col = ['#14203C', '#1B2A4A', '#22355A'][layer];
      for (let i = 0; i < 12; i++) {
        const bw = 60 + rnd(layer + 3, i) * 80;
        const bh = 100 + rnd(layer + 3, i, 1) * (200 - layer * 30);
        const bx = i * 118 - 60 + (o.pan || 0) * (0.1 + layer * 0.12);
        ctx.fillStyle = col;
        ctx.fillRect(bx, base - bh, bw, bh + 200);
        for (let wy = 0; wy < 8; wy++) {
          for (let wx = 0; wx < 3; wx++) {
            const on = rnd(layer * 17 + i, wy * 3 + wx) > 0.55;
            if (!on) continue;
            ctx.fillStyle = rgba('#FFD79A', 0.75);
            ctx.fillRect(bx + 10 + wx * (bw / 3.4), base - bh + 14 + wy * 26, 10, 12);
          }
        }
      }
    }
    // 天台
    paint(ctx, [[-200, 610], [W + 200, 600], [W + 200, H + 200], [-200, H + 200]], { wash: '#2A3350', fill: '#38425E', ink: null });
    // 栏杆
    ctx.strokeStyle = '#5A6B90';
    ctx.lineWidth = 3;
    for (let x = -100; x < W + 120; x += 46) {
      ctx.beginPath();
      ctx.moveTo(x, 600);
      ctx.lineTo(x, 520);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(-100, 522);
    ctx.lineTo(W + 150, 514);
    ctx.stroke();
    stringLights(ctx, t, -60, W, 470, 14, '#FFCF7A');
    particles(ctx, t, { n: 20, col: '#FFD79A', seed: 44, speed: 8, size: 1.8 });
  };

  // 5. 雨夜公交站
  SETS.rainBusStop = (ctx, t, o = {}) => {
    skyGradient(ctx, [[0, '#101B33'], [0.6, '#1E2C48'], [1, '#0A1120']]);
    rain(ctx, t, { n: 120, alpha: 0.32, seed: 41 });
    // 街灯
    const lx = 300 + (o.pan || 0) * 0.08;
    ctx.strokeStyle = '#3B4A6B';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(lx, 620);
    ctx.lineTo(lx, 220);
    ctx.lineTo(lx + 70, 220);
    ctx.stroke();
    const g = ctx.createRadialGradient(lx + 74, 232, 6, lx + 74, 232, 220);
    g.addColorStop(0, 'rgba(255,231,170,0.85)');
    g.addColorStop(1, 'rgba(255,231,170,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(lx + 74, 232, 220, 0, TAU);
    ctx.fill();
    // 站台
    paint(ctx, rrPts(760, 330, 380, 260, 10), { wash: '#25314E', ink: '#0B1220', sw: 3 });
    paint(ctx, rrPts(780, 350, 340, 120, 8), { wash: '#37507A', ink: '#6F89B5', sw: 2 });
    ctx.fillStyle = '#C9D8EF';
    ctx.font = 'bold 26px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
    ctx.fillText('末班车 23:40', 812, 404);
    paint(ctx, [[-200, 610], [W + 200, 600], [W + 200, H + 200], [-200, H + 200]], { wash: '#1A2338', fill: '#232E48', ink: null });
    // 地面反光
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = rgba('#FFE7AA', 0.08 + 0.05 * Math.sin(t * 2 + i));
      ctx.fillRect(lx + 20 + i * 26, 620 + (i % 3) * 18, 16, 5);
    }
    particles(ctx, t, { n: 30, col: '#BFE0FF', seed: 51, speed: 40, size: 1.6, alpha: 0.3 });
  };

  // 6. 秋日公园（银杏）
  SETS.autumnPark = (ctx, t, o = {}) => {
    skyGradient(ctx, [[0, '#F2D9A8'], [0.5, '#E8B87C'], [1, '#B9764A']]);
    clouds(ctx, t, { y: 130, col: '#FFF1D8', alpha: 0.8, seed: 61, speed: 10 });
    hills(ctx, 470, '#C98F52', 48, 62, 2);
    // 树干
    for (let i = 0; i < 4; i++) {
      const tx = 120 + i * 330 + (o.pan || 0) * 0.14;
      paint(ctx, [[tx, 640], [tx + 34, 640], [tx + 26, 250], [tx + 6, 250]], { wash: '#6B4A2E', fill: '#835B38', ink: '#3A2618', sw: 2 });
      for (let b = 0; b < 5; b++) {
        paint(ctx, ellPts(tx + 16 + Math.sin(b * 2) * 90, 230 + b * 26, 80 + b * 12, 54, 16), { wash: '#F2C14E', fill: '#E0A33A', ink: '#8A5A1E', sw: 1.6 });
      }
    }
    // 小径
    paint(ctx, [[520, 640], [760, 640], [900, H + 200], [380, H + 200]], { wash: '#D7B183', fill: '#C39A6B', ink: null });
    // 长椅
    paint(ctx, rrPts(880, 520, 240, 26, 6), { wash: '#8A5A33', ink: '#3A2618', sw: 2 });
    paint(ctx, rrPts(880, 476, 240, 22, 6), { wash: '#8A5A33', ink: '#3A2618', sw: 2 });
    particles(ctx, t, { n: 46, col: '#E8A93F', seed: 63, speed: 46, size: 2.4, shape: 'leaf', alpha: 0.85 });
  };

  // 7. 教室（黑板 + 课桌）
  SETS.classroom = (ctx, t, o = {}) => {
    skyGradient(ctx, [[0, '#DDE7DA'], [1, '#B9C7C0']]);
    paint(ctx, [[-200, -200], [W + 200, -200], [W + 200, 560], [-200, 560]], { wash: '#E4E0D2', ink: null });
    // 黑板
    paint(ctx, rrPts(210, 110, 860, 330, 12), { wash: '#27403A', ink: '#7C5A3A', sw: 8 });
    ctx.fillStyle = rgba('#EAF6EC', 0.9);
    ctx.font = 'bold 40px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
    ctx.fillText('毕业前的最后一课', 300, 210);
    ctx.font = 'bold 26px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
    ctx.fillStyle = rgba('#D6F0D9', 0.75);
    ctx.fillText('青春 · 回忆 · 我们', 300, 276);
    ctx.strokeStyle = rgba('#EAF6EC', 0.5);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(300, 320);
    ctx.lineTo(700, 316);
    ctx.stroke();
    // 粉笔灰
    particles(ctx, t, { n: 18, col: '#FFFFFF', seed: 71, speed: 8, size: 1.6, alpha: 0.5 });
    // 地面与课桌
    paint(ctx, [[-200, 540], [W + 200, 540], [W + 200, H + 200], [-200, H + 200]], { wash: '#B79A72', fill: '#A98A62', ink: null });
    for (let i = 0; i < 3; i++) {
      const dx = 180 + i * 380 + (o.pan || 0) * 0.1;
      paint(ctx, rrPts(dx, 520, 260, 22, 6), { wash: '#C89A63', ink: '#5A3D22', sw: 2 });
      paint(ctx, rectPts(dx + 18, 542, 14, 90), { wash: '#7A5636', ink: '#3A2618', sw: 1.5 });
      paint(ctx, rectPts(dx + 228, 542, 14, 90), { wash: '#7A5636', ink: '#3A2618', sw: 1.5 });
      paint(ctx, rrPts(dx + 60, 500, 70, 18, 4), { wash: '#F6F1E2', ink: '#8C7A5C', sw: 1.4 });
    }
    // 晨光
    const g = ctx.createLinearGradient(980, 0, 560, H);
    g.addColorStop(0, 'rgba(255, 246, 210, 0.55)');
    g.addColorStop(1, 'rgba(255, 246, 210, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(-200, -200, W + 400, H + 400);
  };

  // 8. 夜晚卧室（窗外月光）
  SETS.bedroomNight = (ctx, t, o = {}) => {
    paint(ctx, [-200, -200, W + 400, H + 400].length ? [[-200, -200], [W + 200, -200], [W + 200, H + 200], [-200, H + 200]] : [], { wash: '#141C33', ink: null });
    // 窗户
    paint(ctx, rrPts(720, 90, 460, 380, 10), { wash: '#0A1530', ink: '#2A3B5C', sw: 8 });
    stars(ctx, t, { seed: 81, n: 40, area: 110, col: '#EAF6FF' });
    moon(ctx, 1010, 180, 40);
    windowFrame(ctx, 720, 90, 460, 380);
    // 窗台
    paint(ctx, rrPts(700, 466, 500, 22, 6), { wash: '#2A3450', ink: '#101828', sw: 2 });
    // 床
    paint(ctx, rrPts(120, 470, 620, 150, 18), { wash: '#2C3C63', ink: '#101828', sw: 3 });
    paint(ctx, rrPts(150, 440, 170, 70, 14), { wash: '#F3F6FF', ink: '#C6D2E8', sw: 2 });
    paint(ctx, rrPts(120, 610, 640, 20, 6), { wash: '#1A2338', ink: null });
    // 床头灯
    const g = ctx.createRadialGradient(300, 400, 10, 300, 400, 220);
    g.addColorStop(0, 'rgba(255,214,140,0.55)');
    g.addColorStop(1, 'rgba(255,214,140,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(300, 400, 220, 0, TAU);
    ctx.fill();
    paint(ctx, [[240, 470], [360, 470], [340, 400], [260, 400]], { wash: '#FFE0A8', ink: '#7A5A32', sw: 2 });
    particles(ctx, t, { n: 16, col: '#C9DBFF', seed: 83, speed: 6, size: 1.4, alpha: 0.4 });
  };

  // 9. 夏日海边栈道
  SETS.boardwalk = (ctx, t, o = {}) => {
    skyGradient(ctx, [[0, '#79C7E8'], [0.55, '#B8E6F2'], [1, '#E9F7E4']]);
    clouds(ctx, t, { y: 90, col: '#FFFFFF', alpha: 0.85, seed: 91, speed: 14 });
    waterBand(ctx, t, 400, '#2C82B5', '#BFEFFF', 8);
    // 沙滩
    paint(ctx, [[-200, 470], [W + 200, 470], [W + 200, H + 200], [-200, H + 200]], { wash: '#F2E1BE', ink: null });
    // 木栈道
    paint(ctx, [[-200, 620], [W + 200, 560], [W + 200, H + 200], [-200, H + 200]], { wash: '#C8A06A', fill: '#B08850', ink: null });
    for (let i = 0; i < 22; i++) {
      ctx.strokeStyle = 'rgba(90,60,30,0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-200 + i * 78, 626 - i * 3);
      ctx.lineTo(-160 + i * 78, H + 40);
      ctx.stroke();
    }
    // 遮阳伞
    const px = 980 + (o.pan || 0) * 0.06;
    paint(ctx, [[px, 620], [px + 8, 620], [px + 4, 430], [px - 4, 430]], { wash: '#8A6A46', ink: '#4A3320', sw: 2 });
    for (let s = 0; s < 6; s++) {
      ctx.fillStyle = s % 2 ? '#F87171' : '#FDE68A';
      ctx.beginPath();
      ctx.moveTo(px, 430);
      ctx.arc(px, 430, 110, Math.PI + (s / 6) * Math.PI, Math.PI + ((s + 1) / 6) * Math.PI);
      ctx.closePath();
      ctx.fill();
    }
    particles(ctx, t, { n: 22, col: '#FFFFFF', seed: 93, speed: 10, size: 1.8, alpha: 0.4 });
  };

  // 10. 温室花园
  SETS.greenhouse = (ctx, t, o = {}) => {
    skyGradient(ctx, [[0, '#DDF0DA'], [1, '#A9CDB4']]);
    // 玻璃顶
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 4;
    for (let i = 0; i <= 10; i++) {
      ctx.beginPath();
      ctx.moveTo(160 + i * 100, 60);
      ctx.lineTo(240 + i * 90, 420);
      ctx.stroke();
    }
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(120, 130 + i * 90);
      ctx.lineTo(W - 100, 130 + i * 90);
      ctx.stroke();
    }
    // 花盆与植物
    for (let i = 0; i < 7; i++) {
      const px = 90 + i * 175 + (o.pan || 0) * 0.1;
      const py = 560 + (i % 2) * 30;
      paint(ctx, [[px - 46, py], [px + 46, py], [px + 34, py + 80], [px - 34, py + 80]], { wash: '#C97A55', ink: '#6B3A22', sw: 2 });
      for (let l = 0; l < 5; l++) {
        const ang = -Math.PI / 2 + (l - 2) * 0.32 + Math.sin(t * 1.4 + i + l) * 0.05;
        const len = 90 + (l % 3) * 40;
        paint(ctx, ellPts(px + Math.cos(ang) * len * 0.5, py + Math.sin(ang) * len * 0.5, len * 0.42, 18, 14, 2, ang), { wash: '#3E8A55', fill: '#2F7145', ink: '#1C4A2C', sw: 1.4 });
      }
      if (i % 2 === 0) {
        paint(ctx, ellPts(px + 10, py - 130, 22, 22, 14), { wash: '#F7A8C4', ink: '#B34B6E', sw: 1.6 });
      }
    }
    paint(ctx, [[-200, 640], [W + 200, 640], [W + 200, H + 200], [-200, H + 200]], { wash: '#7A6A50', ink: null });
    particles(ctx, t, { n: 24, col: '#FFF6C8', seed: 101, speed: 8, size: 1.8, alpha: 0.55 });
  };

  // 11. 雪夜街道
  SETS.snowStreet = (ctx, t, o = {}) => {
    skyGradient(ctx, [[0, '#1B2440'], [0.6, '#2C3A5E'], [1, '#3A4A70']]);
    stars(ctx, t, { seed: 111, n: 40, area: 260 });
    // 街道两侧房屋
    for (let i = 0; i < 6; i++) {
      const bx = -80 + i * 240 + (o.pan || 0) * 0.08;
      const bh = 200 + rnd(112, i) * 120;
      paint(ctx, rrPts(bx, 520 - bh, 180, bh, 8), { wash: ['#2A3350', '#313D5E', '#27314C'][i % 3], ink: '#121A2E', sw: 2 });
      for (let w = 0; w < 4; w++) {
        ctx.fillStyle = rgba('#FFD9A0', rnd(112, i * 7 + w) > 0.35 ? 0.85 : 0.2);
        ctx.fillRect(bx + 24 + (w % 2) * 80, 520 - bh + 40 + Math.floor(w / 2) * 70, 44, 40);
      }
      // 屋顶积雪
      paint(ctx, [[bx - 8, 520 - bh], [bx + 188, 520 - bh], [bx + 170, 520 - bh - 20], [bx + 10, 520 - bh - 20]], { wash: '#E8F1FF', ink: null });
    }
    // 路灯
    for (let i = 0; i < 3; i++) {
      const lx = 220 + i * 430;
      ctx.strokeStyle = '#4A5878';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(lx, 640);
      ctx.lineTo(lx, 300);
      ctx.stroke();
      const g = ctx.createRadialGradient(lx, 296, 4, lx, 296, 160);
      g.addColorStop(0, 'rgba(255,236,190,0.8)');
      g.addColorStop(1, 'rgba(255,236,190,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(lx, 296, 160, 0, TAU);
      ctx.fill();
    }
    paint(ctx, [[-200, 600], [W + 200, 580], [W + 200, H + 200], [-200, H + 200]], { wash: '#DCE8FA', fill: '#C3D3EA', ink: null });
    particles(ctx, t, { n: 110, col: '#FFFFFF', seed: 113, speed: 46, size: 2.2, shape: 'snow', alpha: 0.85 });
  };

  // 12. 烟火夜空（河面倒影）
  SETS.fireworksRiver = (ctx, t, o = {}) => {
    skyGradient(ctx, [[0, '#0A0A1E'], [0.6, '#1B1B3A'], [1, '#0A1224']]);
    stars(ctx, t, { seed: 121, n: 60, area: 300 });
    for (let fw = 0; fw < 4; fw++) {
      const cx = 200 + fw * 300;
      const cy = 140 + (fw % 2) * 70;
      const phase = (t * 0.35 + fw * 0.27) % 1;
      const r = phase * 120;
      const col = ['#FFD166', '#FF6B9D', '#7DE8FF', '#C6A8FF'][fw];
      for (let p = 0; p < 22; p++) {
        const a = (p / 22) * TAU + fw;
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * r + Math.pow(phase, 2) * 26;
        ctx.fillStyle = rgba(col, Math.max(0, 1 - phase * 1.1));
        ctx.beginPath();
        ctx.arc(px, py, 3.4, 0, TAU);
        ctx.fill();
      }
    }
    waterBand(ctx, t, 460, '#101A38', '#7DD3FC', 8);
    // 倒影
    for (let fw = 0; fw < 4; fw++) {
      const cx = 200 + fw * 300;
      const phase = (t * 0.35 + fw * 0.27) % 1;
      ctx.fillStyle = rgba(['#FFD166', '#FF6B9D', '#7DE8FF', '#C6A8FF'][fw], 0.18 * (1 - phase));
      ctx.fillRect(cx - 40, 500 + Math.sin(t * 2 + fw) * 4, 80, 60);
    }
    // 河岸
    paint(ctx, [[-200, 560], [W + 200, 540], [W + 200, H + 200], [-200, H + 200]], { wash: '#1A2338', fill: '#232E48', ink: null });
    particles(ctx, t, { n: 26, col: '#FFE4A0', seed: 123, speed: -16, size: 1.8, alpha: 0.6 });
  };

  // 13. 列车车厢
  SETS.trainInterior = (ctx, t, o = {}) => {
    paint(ctx, [[-200, -200], [W + 200, -200], [W + 200, H + 200], [-200, H + 200]].length ? [[-200, -200], [W + 200, -200], [W + 200, H + 200], [-200, H + 200]] : [], { wash: '#D8DEE8', ink: null });
    // 车窗（外面风景滚动）
    for (let i = 0; i < 3; i++) {
      const wx = 90 + i * 400;
      paint(ctx, rrPts(wx, 120, 320, 260, 18), { wash: '#8FC5E8', ink: '#5A6A82', sw: 8 });
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(wx, 120, 320, 260, 18);
      ctx.clip();
      // 滚动山影
      for (let k = 0; k < 3; k++) {
        const off = (t * (60 + k * 40)) % 320;
        ctx.fillStyle = ['#6FA8C8', '#5C94B8', '#4C82A6'][k];
        ctx.beginPath();
        ctx.moveTo(wx - 40 + off - 320, 380);
        for (let x = 0; x <= 320; x += 20) {
          ctx.lineTo(wx + x - 40 + off - 320, 300 + k * 26 + Math.sin((x + off) * 0.02 + k) * 26);
        }
        ctx.lineTo(wx + 360, 400);
        ctx.lineTo(wx - 40, 400);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
    // 座椅
    for (let i = 0; i < 3; i++) {
      const sx = 40 + i * 420;
      paint(ctx, rrPts(sx, 470, 300, 110, 16), { wash: '#3E5C8C', ink: '#1E2A44', sw: 3 });
      paint(ctx, rrPts(sx, 400, 300, 80, 16), { wash: '#4A6EA4', ink: '#1E2A44', sw: 3 });
      paint(ctx, rrPts(sx + 6, 484, 288, 16, 6), { wash: '#8FB6E0', ink: null });
    }
    paint(ctx, [[-200, 580], [W + 200, 580], [W + 200, H + 200], [-200, H + 200]], { wash: '#8794A8', ink: null });
    // 车厢灯
    for (let i = 0; i < 5; i++) {
      paint(ctx, rrPts(90 + i * 260, 46, 190, 18, 8), { wash: '#FFF6D8', ink: null });
    }
  };

  // 14. 咖啡馆
  SETS.cafe = (ctx, t, o = {}) => {
    paint(ctx, [[-200, -200], [W + 200, -200], [W + 200, H + 200], [-200, H + 200]], { wash: '#3A2A22', ink: null });
    // 木墙
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = i % 2 ? 'rgba(120,80,52,0.55)' : 'rgba(96,62,40,0.55)';
      ctx.fillRect(-200 + i * 150, -200, 150, 640);
    }
    // 吊灯
    for (let i = 0; i < 3; i++) {
      const lx = 300 + i * 340;
      ctx.strokeStyle = '#20140E';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(lx, -20);
      ctx.lineTo(lx, 150);
      ctx.stroke();
      paint(ctx, [[lx - 40, 200], [lx + 40, 200], [lx + 22, 150], [lx - 22, 150]], { wash: '#FFD9A0', ink: '#4A3320', sw: 2 });
      const g = ctx.createRadialGradient(lx, 210, 6, lx, 210, 190);
      g.addColorStop(0, 'rgba(255,214,150,0.5)');
      g.addColorStop(1, 'rgba(255,214,150,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(lx, 210, 190, 0, TAU);
      ctx.fill();
    }
    // 吧台
    paint(ctx, rrPts(-100, 500, W + 200, 40, 8), { wash: '#6B4426', ink: '#2A1A10', sw: 3 });
    paint(ctx, rrPts(-100, 540, W + 200, 180, 4), { wash: '#4A2E1A', ink: '#2A1A10', sw: 3 });
    // 杯子
    for (let i = 0; i < 4; i++) {
      const cx = 240 + i * 260;
      paint(ctx, rrPts(cx, 462, 46, 42, 6), { wash: '#F6EFE4', ink: '#3A2618', sw: 2 });
      ctx.strokeStyle = rgba('#FFFFFF', 0.35);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx + 14, 448);
      ctx.quadraticCurveTo(cx + 22, 420 + Math.sin(t * 2 + i) * 6, cx + 6, 400);
      ctx.stroke();
    }
    particles(ctx, t, { n: 18, col: '#FFE0B0', seed: 131, speed: -10, size: 1.6, alpha: 0.4 });
  };

  // 15. 图书馆书架
  SETS.library = (ctx, t, o = {}) => {
    paint(ctx, [[-200, -200], [W + 200, -200], [W + 200, H + 200], [-200, H + 200]], { wash: '#2A2118', ink: null });
    for (let row = 0; row < 3; row++) {
      const y = 100 + row * 170;
      paint(ctx, rrPts(60, y, W - 120, 22, 4), { wash: '#5A3E28', ink: '#2A1A10', sw: 2 });
      for (let b = 0; b < 26; b++) {
        const bw = 14 + rnd(141 + row, b) * 16;
        const bh = 90 + rnd(141 + row, b, 1) * 40;
        const bx = 80 + b * 46;
        ctx.fillStyle = ['#B4553E', '#3E6B8C', '#8C6E3E', '#4E7A5A', '#7A4E7A'][Math.floor(rnd(141 + row, b, 2) * 5)];
        ctx.fillRect(bx, y - bh + 22, bw, bh);
      }
    }
    paint(ctx, [[-200, 620], [W + 200, 620], [W + 200, H + 200], [-200, H + 200]], { wash: '#6B4A30', ink: null });
    // 顶灯光束
    const g = ctx.createLinearGradient(640, 0, 640, H);
    g.addColorStop(0, 'rgba(255,231,170,0.35)');
    g.addColorStop(1, 'rgba(255,231,170,0)');
    ctx.fillStyle = g;
    ctx.fillRect(-200, -200, W + 400, H + 400);
    particles(ctx, t, { n: 22, col: '#FFE7AA', seed: 143, speed: 4, size: 1.4, alpha: 0.35 });
  };

  // 16. 黄昏沙丘
  SETS.desertDusk = (ctx, t, o = {}) => {
    skyGradient(ctx, [[0, '#3A1A3E'], [0.4, '#8A3F52'], [0.7, '#E08A50'], [1, '#F6C77A']]);
    paint(ctx, ellPts(880, 380, 90, 90, 26), { wash: '#FFE7B0', ink: null });
    hills(ctx, 470, '#C98A50', 40, 151, 3);
    hills(ctx, 560, '#B5763F', 30, 152, 2);
    hills(ctx, 640, '#8A5A32', 22, 153, 1);
    // 仙人掌
    const cx = 260 + (o.pan || 0) * 0.1;
    paint(ctx, rrPts(cx, 420, 34, 190, 14), { wash: '#3E6B4A', ink: '#1E3A28', sw: 2 });
    paint(ctx, rrPts(cx - 50, 470, 22, 90, 10), { wash: '#3E6B4A', ink: '#1E3A28', sw: 2 });
    paint(ctx, rrPts(cx - 50, 470, 60, 22, 10), { wash: '#3E6B4A', ink: '#1E3A28', sw: 2 });
    particles(ctx, t, { n: 34, col: '#FFD9A0', seed: 155, speed: 14, size: 1.6, alpha: 0.5 });
  };

  // 17. 山坡草地（放风筝）
  SETS.hillMeadow = (ctx, t, o = {}) => {
    skyGradient(ctx, [[0, '#7DC8F0'], [0.55, '#BFE6F5'], [1, '#E8F6E0']]);
    clouds(ctx, t, { y: 110, col: '#FFFFFF', alpha: 0.9, seed: 161, speed: 16 });
    hills(ctx, 470, '#7FBF7A', 50, 162, 2);
    hills(ctx, 560, '#5FA85E', 38, 163, 2);
    // 花
    for (let i = 0; i < 60; i++) {
      const fx = rnd(164, i) * (W + 120) - 60;
      const fy = 520 + rnd(164, i, 1) * 180;
      ctx.fillStyle = ['#F87171', '#FBBF24', '#FFFFFF', '#C4B5FD'][i % 4];
      ctx.beginPath();
      ctx.arc(fx, fy + Math.sin(t * 1.5 + i) * 3, 3 + (i % 3), 0, TAU);
      ctx.fill();
    }
    // 风筝
    const kx = 940 + Math.sin(t * 0.7) * 40;
    const ky = 170 + Math.cos(t * 0.9) * 30;
    paint(ctx, [[kx, ky - 34], [kx + 26, ky], [kx, ky + 34], [kx - 26, ky]], { wash: '#F472B6', ink: '#7A2044', sw: 2 });
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(kx, ky + 34);
    ctx.quadraticCurveTo(kx - 90, 300, 640, 600);
    ctx.stroke();
    particles(ctx, t, { n: 26, col: '#FFE9A8', seed: 165, speed: -12, size: 1.8, alpha: 0.4 });
  };

  // 18. 星河 / 宇宙
  SETS.galaxy = (ctx, t, o = {}) => {
    skyGradient(ctx, [[0, '#05030F'], [0.45, '#160B33'], [0.75, '#2A1150'], [1, '#080418']]);
    stars(ctx, t, { seed: 171, n: 180, area: 520 });
    // 星云
    for (let n = 0; n < 3; n++) {
      const cx = 300 + n * 340 + Math.sin(t * 0.3 + n) * 30;
      const cy = 260 + n * 60;
      const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, 300);
      g.addColorStop(0, ['rgba(126,231,255,0.28)', 'rgba(196,138,255,0.24)', 'rgba(255,138,196,0.2)'][n]);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, 300, 0, TAU);
      ctx.fill();
    }
    // 星球
    paint(ctx, ellPts(980, 250, 130, 130, 30), { wash: '#3A5FA8', fill: '#2A4480', ink: '#9BD0FF', sw: 2 });
    paint(ctx, ellPts(940, 210, 40, 24, 14), { wash: '#4E76C4', ink: null });
    ctx.strokeStyle = 'rgba(190,230,255,0.65)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(980, 250, 200, 46, -0.42, 0, TAU);
    ctx.stroke();
    // 浮空岛
    paint(ctx, [[120, 560], [420, 540], [380, 600], [160, 620]], { wash: '#243A5E', ink: '#0A1424', sw: 2 });
    paint(ctx, [[120, 560], [420, 540], [400, 520], [140, 536]], { wash: '#3E6B5A', ink: '#0A1424', sw: 2 });
    particles(ctx, t, { n: 50, col: '#CFE9FF', seed: 173, speed: -14, size: 1.6, alpha: 0.6 });
  };

  // 19. 演唱会舞台
  SETS.stage = (ctx, t, o = {}) => {
    skyGradient(ctx, [[0, '#0A0A1E'], [1, '#140A26']]);
    // 灯束
    for (let i = 0; i < 8; i++) {
      const a = -1.2 + i * 0.34 + Math.sin(t * 0.8 + i) * 0.12;
      const g = ctx.createLinearGradient(640, 60, 640 + Math.cos(a) * 900, 60 + Math.sin(a) * 900);
      const col = ['#38BDF8', '#F472B6', '#A78BFA', '#FDE047'][i % 4];
      g.addColorStop(0, rgba(col, 0.45));
      g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(600, 40);
      ctx.lineTo(680, 40);
      ctx.lineTo(640 + Math.cos(a) * 900 + 80, 60 + Math.sin(a) * 900);
      ctx.lineTo(640 + Math.cos(a) * 900 - 80, 60 + Math.sin(a) * 900);
      ctx.closePath();
      ctx.fill();
    }
    // 舞台地板
    paint(ctx, [[-200, 560], [W + 200, 560], [W + 200, H + 200], [-200, H + 200]], { wash: '#1A1230', fill: '#241A44', ink: null });
    for (let i = 0; i < 14; i++) {
      ctx.fillStyle = rgba(['#38BDF8', '#F472B6', '#FDE047'][i % 3], 0.28 + 0.2 * Math.sin(t * 3 + i));
      ctx.fillRect(60 + i * 88, 578 + (i % 2) * 22, 60, 8);
    }
    // 观众剪影
    for (let i = 0; i < 26; i++) {
      const x = rnd(181, i) * (W + 100) - 50;
      const y = 640 + rnd(181, i, 1) * 60;
      ctx.fillStyle = 'rgba(6,8,18,0.9)';
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, TAU);
      ctx.fill();
      ctx.fillRect(x - 16, y + 8, 32, 60);
    }
    particles(ctx, t, { n: 40, col: '#FFE9A8', seed: 183, speed: -30, size: 1.6, alpha: 0.6 });
  };

  // 20. 泳池夏日
  SETS.poolside = (ctx, t, o = {}) => {
    skyGradient(ctx, [[0, '#6FC4EE'], [0.6, '#B6E7F6'], [1, '#EAF9E8']]);
    clouds(ctx, t, { y: 80, col: '#FFFFFF', alpha: 0.9, seed: 191, speed: 12 });
    // 棕榈
    for (const tx of [140, 1120]) {
      paint(ctx, [[tx, 620], [tx + 20, 620], [tx + 12, 330], [tx + 4, 330]], { wash: '#8A6A46', ink: '#4A3320', sw: 2 });
      for (let l = 0; l < 6; l++) {
        const ang = -Math.PI / 2 + (l - 2.5) * 0.42;
        paint(ctx, ellPts(tx + 8 + Math.cos(ang) * 80, 330 + Math.sin(ang) * 60, 84, 20, 14, 2, ang), { wash: '#3E8A55', ink: '#1C4A2C', sw: 1.6 });
      }
    }
    // 泳池
    paint(ctx, rrPts(200, 520, 880, 190, 18), { wash: '#2FA8D8', ink: '#E8F6FF', sw: 6 });
    for (let i = 0; i < 6; i++) {
      ctx.strokeStyle = rgba('#FFFFFF', 0.4);
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 210; x < 1070; x += 20) {
        const y = 540 + i * 28 + Math.sin(x * 0.02 + t * (1.4 + i * 0.2)) * 5;
        if (x === 210) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // 躺椅
    paint(ctx, [[120, 600], [300, 600], [320, 640], [100, 640]], { wash: '#F6EFE4', ink: '#5A6A82', sw: 2 });
    particles(ctx, t, { n: 20, col: '#FFFFFF', seed: 193, speed: 8, size: 1.6, alpha: 0.35 });
  };

  // 21. 拼图观测台（ba_huiyi_pinhao_gei_ni 的水彩拼图棚）
  SETS.puzzleObservatory = (ctx, t, o = {}) => {
    skyGradient(ctx, [[0, '#101A36'], [0.6, '#1E2E56'], [1, '#0A1224']]);
    stars(ctx, t, { seed: 201, n: 90, area: 380 });
    // 巨型拼图墙
    const pieces = o.pieces || 6;
    for (let i = 0; i < pieces; i++) {
      const px = 120 + (i % 4) * 280;
      const py = 90 + Math.floor(i / 4) * 240;
      const filled = i < pieces;
      paint(ctx, rrPts(px, py, 250, 210, 16), {
        wash: filled ? '#3B5B96' : 'rgba(60,80,120,0.25)',
        fill: filled ? '#4E76BC' : null,
        ink: '#8FD3FF', sw: 2
      });
      if (filled) {
        paint(ctx, ellPts(px + 125, py + 95, 52, 42, 18), { wash: '#FFE7A0', ink: null });
      }
    }
    paint(ctx, [[-200, 620], [W + 200, 620], [W + 200, H + 200], [-200, H + 200]], { wash: '#1A2540', fill: '#22304E', ink: null });
    particles(ctx, t, { n: 36, col: '#BFE9FF', seed: 203, speed: -12, size: 1.8, alpha: 0.5 });
  };

  // ---------- 导出 ------------------------------------------------------------
  const SET_NAMES = Object.keys(SETS);

  // 每个布景的"情绪"变体：同一个画家，不同色调 / 时间
  // 同一张布景换"时间"就换一张画 —— 这是让重复布景不重复的关键。
  // 每个 mood = 一层调色 + 一层压光，覆盖整个画面后再叠暗角。
  const MOODS = {
    night: { overlay: ['#0B1A3A', 0.34], light: ['#8FB8FF', 0.08], vig: 0.46 },
    dusk:  { overlay: ['#5A1E32', 0.20], light: ['#FF9A5A', 0.13], vig: 0.34 },
    dawn:  { overlay: ['#2A2350', 0.16], light: ['#FFC7D2', 0.13], vig: 0.26 },
    rain:  { overlay: ['#1D2B3E', 0.28], light: ['#9FC4E0', 0.08], vig: 0.40 },
    sunny: { overlay: ['#7A5A22', 0.10], light: ['#FFF0B8', 0.14], vig: 0.18 }
  };

  function applyMood(ctx, mood) {
    const m = MOODS[mood];
    if (!m) return;
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = rgba(m.overlay[0], m.overlay[1]);
    ctx.fillRect(-200, -200, W + 400, H + 400);
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = rgba(m.light[0], m.light[1]);
    ctx.fillRect(-200, -200, W + 400, H + 400);
    ctx.restore();
  }

  function drawSet(ctx, name, t, o = {}) {
    const fn = SETS[name] || SETS.deepSea;
    ctx.save();
    if (o.mood === 'rain' && name !== 'rainBusStop') {
      // 统一的雨天调色：整体压暗偏蓝
      ctx.filter = 'none';
    }
    fn(ctx, t, o);
    ctx.restore();
    applyMood(ctx, o.mood);
    // 统一氛围叠加（暗角）
    if (o.vignette !== false) {
      const strength = (MOODS[o.mood] && MOODS[o.mood].vig) ?? 0.38;
      const g = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.35, W / 2, H * 0.5, H * 0.95);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, o.vignetteCol || rgba('#04081A', strength));
      ctx.fillStyle = g;
      ctx.fillRect(-200, -200, W + 400, H + 400);
    }
  }

  const api = { SETS, SET_NAMES, MOODS, drawSet, helpers: { skyGradient, stars, moon, clouds, hills, waterBand, floorPlane, particles, rain, stringLights } };
  root.SETS = SETS;
  root.SET_NAMES = SET_NAMES;
  root.drawSet = drawSet;
  root.SETPB = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
