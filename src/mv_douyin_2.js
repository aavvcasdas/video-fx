// ============================================================================
// src/mv_douyin_2.js — #02 《我不难过》(孙燕姿 · 深海鲸鱼娘篇) Full 295.43s MV Director
// Replicated from `每天每天的抖音 - 抖音_2.mp4` (295.43s, 30fps, 1280x720)
// Protagonist: `whaleGirl` (`src/whale_girl.js` 7-bone articulated rig) +
//              `drawPartnerRig` (104x102 crimson/indigo partner rig) & `CAST`
// Audio & Beat Sync: `assets/douyin_2.mp3` + `assets/douyin_2_audio.js` (64 BPM)
// Visual Style: Risograph Duotone Halftone & Crimson/Teal Cinema (`risograph`)
// ============================================================================

(function (root) {
  const CORE = root.CORE || (typeof require !== 'undefined' ? require('./core.js') : {});
  const WHALE = root.WHALE_GIRL || (typeof require !== 'undefined' ? require('./whale_girl.js') : {});

  const {
    W, H, FPS, TAU,
    clamp, lerp, seg, ease, easeIn, easeOut, backOut,
    reseedBoil, beatPulse,
    setActiveStyle, paint, inkLine, ellPts, heartPts, starPts
  } = CORE;
  const { whaleGirl, feel } = WHALE;

  const DURATION_MV2 = 295.43;

  // ==========================================================================
  // Exact Subtitle Beat-Sync Table from `每天每天的抖音 - 抖音_2.mp4`
  // ==========================================================================
  const SUBTITLES_MV2 = [
    { t0: 21.0,  t1: 24.5,  zh: '又站在你家的门口' },
    { t0: 24.5,  t1: 27.5,  zh: '我们重复沉默' },
    { t0: 27.5,  t1: 31.2,  zh: '这样子单方面的守候' },
    { t0: 31.2,  t1: 36.5,  zh: '还能多久' },
    { t0: 36.8,  t1: 39.8,  zh: '终于你开口向我诉说' },
    { t0: 39.8,  t1: 42.8,  zh: '她有多温柔' },
    { t0: 42.8,  t1: 46.2,  zh: '虽然你还握着我的手' },
    { t0: 46.2,  t1: 51.5,  zh: '但我已不在你心中' },
    { t0: 51.5,  t1: 58.2,  zh: '我真的懂你不是喜新厌旧' },
    { t0: 58.2,  t1: 61.5,  zh: '是我没有' },
    { t0: 61.5,  t1: 66.8,  zh: '陪在你身边当你寂寞时候' },
    { t0: 66.8,  t1: 70.0,  zh: '别再看着我' },
    { t0: 70.0,  t1: 73.2,  zh: '说着你爱过别太伤痛' },
    { t0: 73.8,  t1: 76.8,  zh: '我不难过这不算什么' },
    { t0: 76.8,  t1: 79.8,  zh: '只是为什么眼泪会流' },
    { t0: 79.8,  t1: 81.0,  zh: '我也不懂' },
    { t0: 81.0,  t1: 85.8,  zh: '就让我走让我开始' },
    { t0: 85.8,  t1: 88.8,  zh: '享受自由' },
    { t0: 88.8,  t1: 91.2,  zh: '回忆很多' },
    { t0: 91.2,  t1: 96.8,  zh: '你的影子也会充满我生活' },
    { t0: 96.8,  t1: 100.2, zh: '我并不懦弱你比谁都懂' },
    { t0: 101.5, t1: 103.8, zh: '虽然寂寞' },
    { t0: 103.8, t1: 108.5, zh: '这会是我最后的宽容' },
    { t0: 125.8, t1: 128.8, zh: '终于你开口向我诉说' },
    { t0: 128.8, t1: 131.2, zh: '她有多温柔' },
    { t0: 131.2, t1: 134.8, zh: '虽然你还握着我的手' },
    { t0: 134.8, t1: 139.8, zh: '但我已不在你心中' },
    { t0: 139.8, t1: 146.5, zh: '我真的懂你不是喜新厌旧' },
    { t0: 146.5, t1: 151.8, zh: '是我没有陪在你身边' },
    { t0: 151.8, t1: 155.8, zh: '当你寂寞时候' },
    { t0: 155.8, t1: 160.8, zh: '别再看着我说着你爱过' },
    { t0: 160.8, t1: 162.0, zh: '别太伤痛' },
    { t0: 162.0, t1: 165.5, zh: '我不难过这不算什么' },
    { t0: 165.5, t1: 168.2, zh: '只是为什么眼泪会流' },
    { t0: 168.2, t1: 170.0, zh: '我也不懂' },
    { t0: 170.0, t1: 176.8, zh: '就让我走让我开始享受自由' },
    { t0: 176.8, t1: 179.8, zh: '回忆很多' },
    { t0: 179.8, t1: 185.8, zh: '你的影子也会充满我生活' },
    { t0: 185.8, t1: 189.5, zh: '我并不懦弱你比谁都懂' },
    { t0: 190.8, t1: 195.8, zh: '虽然寂寞这会是我' },
    { t0: 195.8, t1: 199.5, zh: '最后的宽容' },
    { t0: 200.0, t1: 203.5, zh: '抱紧我再抱紧我' },
    { t0: 203.5, t1: 205.2, zh: '这一份感动' },
    { t0: 205.2, t1: 207.8, zh: '请你让我留在胸口' },
    { t0: 207.8, t1: 211.5, zh: '别再说是你的错' },
    { t0: 211.5, t1: 214.8, zh: '爱到了尽头 是非对错就让它随风' },
    { t0: 214.8, t1: 222.5, zh: '忘了所有过得比你快活' },
    { t0: 222.5, t1: 229.5, zh: '我真的懂你不是喜新厌旧' },
    { t0: 229.5, t1: 234.8, zh: '是我没有陪在你身边' },
    { t0: 234.8, t1: 238.8, zh: '当你寂寞时候' },
    { t0: 238.8, t1: 243.8, zh: '别再看着我说着你爱过' },
    { t0: 243.8, t1: 245.2, zh: '别太伤痛' },
    { t0: 245.2, t1: 248.8, zh: '我不难过这不算什么' },
    { t0: 248.8, t1: 251.2, zh: '只是为什么眼泪会流' },
    { t0: 251.2, t1: 253.0, zh: '我也不懂' },
    { t0: 253.0, t1: 256.5, zh: '不要再说或许' },
    { t0: 256.5, t1: 259.8, zh: '这是最好的结果' },
    { t0: 259.8, t1: 265.2, zh: '现在分手 总好过你不爱我' },
    { t0: 265.5, t1: 268.8, zh: '一拖再拖' },
    { t0: 268.8, t1: 273.8, zh: '松开你的手离开你左右' },
    { t0: 273.8, t1: 278.5, zh: '我向前走这会是我' },
    { t0: 278.5, t1: 282.5, zh: '真正的解脱' }
  ];

  function getSubtitleAt(t) {
    for (let i = 0; i < SUBTITLES_MV2.length; i++) {
      const s = SUBTITLES_MV2[i];
      if (t >= s.t0 && t < s.t1) return s;
    }
    return null;
  }

  function pxRect(ctx, x, y, w, h, col) {
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function drawRisoBox(ctx, x, y, w, h, bg = '#12101E', border = '#F43F5E', inner = '#1E1B32') {
    // Risograph misregistration offset shadow (crimson/cyan duotone shift)
    pxRect(ctx, x + 4, y + 4, w, h, 'rgba(244, 63, 94, 0.35)');
    pxRect(ctx, x - 3, y - 3, w + 6, h + 6, '#07060D');
    pxRect(ctx, x - 2, y - 2, w + 4, h + 4, border);
    pxRect(ctx, x, y, w, h, inner);
    pxRect(ctx, x + 2, y + 2, w - 4, h - 4, bg);
  }

  // ==========================================================================
  // Protagonist: `drawRisoWhaleGirl` (`src/whale_girl.js` in `risograph` style)
  // ==========================================================================
  function drawRisoWhaleGirl(ctx, x, y, u, opts = {}) {
    const t = opts.t || 0;
    const view = opts.view || 'front';
    const emo = opts.emotion || 'happy';
    const bp = beatPulse(t);
    const dy = (opts.dy || 0) - bp * 0.05;

    whaleGirl(ctx, x, y, u, Object.assign({}, feel(emo, t), opts, {
      view,
      style: 'risograph',
      constructMode: 'pixelRig',
      t,
      dy
    }));

    const cell = u / 10;
    const headBob = Math.sin(t * 2.8) * 0.055 * u;
    const vx = view === 'side' ? (opts.flip ? -0.45 : 0.45) : 0;

    ctx.save();
    ctx.translate(x + vx * u, y + dy * u + headBob);
    if (opts.flip) ctx.scale(-1, 1);

    const p = (gx, gy, gw, gh, col) => {
      ctx.fillStyle = col;
      ctx.fillRect((gx - 0.5) * cell, (gy - 0.5) * cell, gw * cell + 0.4, gh * cell + 0.4);
    };

    // Signature Crimson Scarf of #02 《我不难过》 at neck (`gy = -45..-40`, below chin `gy = -46`)
    if (view !== 'back') {
      p(-8, -45, 16, 2, '#881337');
      p(-7, -44, 14, 2, '#E11D48');
      p(-4, -42, 8,  2, '#F43F5E');
    }

    // Streaming pixel tears
    if (opts.tears && view !== 'back') {
      const td = Math.floor((t * 8) % 5);
      p(-8, -56, 2, 6, '#38BDF8');
      p(6,  -56, 2, 6, '#38BDF8');
      p(-8, -50 + td, 2, 2, '#BAE6FD');
      p(6,  -50 + td, 2, 2, '#BAE6FD');
    }

    // Overhead `[不]难过` sign (`opts.buNanGuoBadge`)
    if (opts.buNanGuoBadge) {
      drawRisoBox(ctx, -18 * cell, -106 * cell, 36 * cell, 14 * cell, '#1E1B2E', '#F43F5E', '#312E81');
      pxRect(ctx, -16 * cell, -104 * cell, 11 * cell, 10 * cell, '#E11D48');
      ctx.font = `bold ${Math.round(8.5 * cell)}px "ZCOOLKuaiLe", "NotoSansSC", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('不', -10.5 * cell, -99 * cell);
      ctx.fillText('难过', 6 * cell, -99 * cell);
    }

    ctx.restore();
  }

  // ==========================================================================
  // Supporting Partner Rig (`drawRisoPartner`)
  // ==========================================================================
  const _risoPartnerCache = {};
  function getRisoPartnerPalettes(basePal) {
    if (_risoPartnerCache.headPal) return _risoPartnerCache;
    _risoPartnerCache.headPal = basePal.map((hex) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      if (r >= b - 10) return hex;
      if (lum < 0.24) return '#141420';
      if (lum < 0.38) return '#252336';
      if (lum < 0.54) return '#3B3754';
      return '#565078';
    });
    _risoPartnerCache.torsoPal = basePal.map((hex) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      if (r > b + 20 && lum > 0.65) return hex;
      if (lum < 0.24) return '#134E4A';
      if (lum < 0.42) return '#0F766E';
      if (lum < 0.62) return '#0D9488';
      if (lum < 0.80) return '#14B8A6';
      return '#5EEAD4';
    });
    return _risoPartnerCache;
  }

  function drawRisoPartner(ctx, x, y, u = 28, opts = {}) {
    const t = opts.t || 0;
    const rig = root.WHALE_GIRL_PIXEL_RIG || (typeof require === 'function' ? require('./whale_girl_rig_data.js') : null);
    if (!rig) return;

    const view = opts.view || 'front';
    const cell = u / rig.scale;
    const headBob = Math.sin(t * 2.5 + 0.9) * 0.045 * u;
    const walkW = opts.walk ? t * 9 : 0;
    const hipL = walkW ? Math.sin(walkW) * 0.25 : 0;
    const hipR = walkW ? -Math.sin(walkW) * 0.25 : 0;

    let poseKey = opts.smiling ? 'heart' : 'wave';
    const isTurnView = (view && view !== 'front' && rig.views && rig.views[view]);
    const poseBones = isTurnView ? rig.views[view] : (rig.poses[poseKey] || rig.poses.wave);
    const { headPal, torsoPal } = getRisoPartnerPalettes(rig.palette);

    if (!opts.noShadow) {
      paint(ctx, ellPts(x, y + 0.10 * u, 2.1 * u, 0.40 * u, 14), { wash: '#07060D', washOp: 65, ink: null });
    }

    ctx.save();
    ctx.translate(x, y);
    if (opts.flip) ctx.scale(-1, 1);

    const drawRuns = (runs, activePal) => {
      if (!runs || !runs.length) return;
      let lastCol = -1;
      for (let i = 0; i < runs.length; i++) {
        const [gy, gx1, gx2, cIdx] = runs[i];
        if (cIdx !== lastCol) {
          ctx.fillStyle = activePal[cIdx];
          lastCol = cIdx;
        }
        ctx.fillRect((gx1 - 0.5) * cell, (gy - 0.5) * cell, (gx2 - gx1 + 1) * cell + 0.45, cell + 0.45);
      }
    };

    ctx.save();
    ctx.translate(-0.72 * u, -1.35 * u);
    ctx.rotate(hipL);
    ctx.translate(0.72 * u, 1.35 * u);
    drawRuns(poseBones.legL, headPal);
    ctx.restore();

    ctx.save();
    ctx.translate(0.72 * u, -1.35 * u);
    ctx.rotate(hipR);
    ctx.translate(-0.72 * u, 1.35 * u);
    drawRuns(poseBones.legR, headPal);
    ctx.restore();

    ctx.save();
    ctx.translate(0, headBob);
    drawRuns(poseBones.torso, torsoPal);
    drawRuns(poseBones.head, headPal);
    ctx.restore();

    ctx.restore();
  }

  // ==========================================================================
  // Top Tear Counter Bar (`眼泪 💧 × XX`) matching `每天每天的抖音 - 抖音_2.mp4`
  // ==========================================================================
  function getTearCountAt(t) {
    if (t < 52.0) return '01';
    if (t < 75.0) return '02';
    if (t < 82.0) return '03';
    if (t < 165.0) return '07';
    if (t < 172.0) return '12';
    if (t < 202.0) return '17';
    if (t < 214.0) return '18';
    if (t < 250.0) return '19';
    if (t < 256.0) return '29';
    return '32';
  }

  function drawTopTearHUD(ctx, t) {
    pxRect(ctx, 0, 0, W, 34, '#080710');
    pxRect(ctx, 0, 34, W, 2, '#312E81');

    if (t >= 11.0 && t < 285.0) {
      const tears = getTearCountAt(t);
      ctx.save();
      // Cyan pixel teardrop icon at (1192, 11)
      pxRect(ctx, 1192, 9, 4, 4, '#38BDF8');
      pxRect(ctx, 1190, 13, 8, 6, '#38BDF8');
      pxRect(ctx, 1189, 19, 10, 6, '#0284C7');
      ctx.font = 'bold 20px "Silkscreen", monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#7DD3FC';
      ctx.fillText(`x${tears}`, 1258, 17);
      ctx.restore();
    }
  }

  // ==========================================================================
  // Reusable Sets for #02 《我不难过》
  // ==========================================================================
  function drawDoor302Set(ctx, t) {
    pxRect(ctx, 0, 36, W, H - 36, '#E7E5E4');
    pxRect(ctx, 0, 500, W, H - 500, '#14B8A6');
    // Red Apartment Door `302` in center (x=445..835, y=36..680)
    pxRect(ctx, 435, 36, 410, 660, '#450A0A');
    pxRect(ctx, 455, 45, 370, 645, '#991B1B');
    pxRect(ctx, 485, 75, 310, 260, '#7F1D1D');
    pxRect(ctx, 485, 375, 310, 270, '#7F1D1D');
    // Gold Room Plate `302` + Peephole + Handle
    drawRisoBox(ctx, 580, 95, 120, 48, '#FEF08A', '#854D0E', '#CA8A04');
    ctx.save();
    ctx.font = 'bold 34px "Silkscreen", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#451A03';
    ctx.fillText('302', 640, 128);
    ctx.restore();
    paint(ctx, ellPts(640, 215, 12, 12, 12), { wash: '#FACC15', ink: '#451A03', sw: 2 });
    pxRect(ctx, 755, 340, 24, 52, '#E2E8F0');
    // Doorbell on right wall
    drawRisoBox(ctx, 885, 255, 58, 82, '#F8FAFC', '#94A3B8', '#CBD5E1');
    paint(ctx, ellPts(914, 305, 12, 12, 10), { wash: '#EF4444', ink: null });
  }

  function drawConvenienceStoreSet(ctx, t) {
    pxRect(ctx, 0, 36, W, 490, '#0D0B18');
    pxRect(ctx, 0, 526, W, H - 526, '#1E293B');
    // 24H Convenience Store Building (`便利店 24`)
    pxRect(ctx, 260, 110, 760, 416, '#F8FAFC');
    pxRect(ctx, 245, 95, 790, 68, '#0F766E');
    pxRect(ctx, 245, 163, 790, 16, '#F43F5E');
    ctx.save();
    ctx.font = 'bold 44px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('便 利 店', 310, 146);
    paint(ctx, ellPts(945, 129, 26, 26, 14), { wash: '#EF4444', ink: '#FFFFFF', sw: 2 });
    ctx.font = 'bold 20px "Silkscreen", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('24', 945, 136);
    ctx.restore();

    // Bright store windows & shelves
    for (let s = 0; s < 3; s++) {
      pxRect(ctx, 295 + s * 235, 215, 205, 265, '#FEF9C3');
      for (let r = 0; r < 4; r++) {
        pxRect(ctx, 310 + s * 235, 250 + r * 52, 175, 8, '#94A3B8');
        pxRect(ctx, 320 + s * 235, 232 + r * 52, 28, 18, '#F43F5E');
        pxRect(ctx, 360 + s * 235, 232 + r * 52, 28, 18, '#38BDF8');
        pxRect(ctx, 400 + s * 235, 232 + r * 52, 28, 18, '#FACC15');
      }
    }
  }

  function drawMemory365Grid(ctx, t, modalTitle, btn1, btn2) {
    pxRect(ctx, 0, 36, W, H - 36, '#141122');
    drawRisoBox(ctx, 360, 58, 760, 460, '#1E1B32', '#F43F5E', '#312E81');
    ctx.save();
    ctx.font = 'bold 18px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
    ctx.fillStyle = '#F472B6';
    ctx.fillText('回忆档案', 385, 88);
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('365 / 365', 1015, 88);

    const cols = ['#F43F5E', '#38BDF8', '#FACC15', '#A855F7', '#10B981', '#F97316', '#EC4899', '#6366F1'];
    for (let i = 0; i < 8; i++) {
      const gx = 390 + (i % 4) * 178;
      const gy = 110 + Math.floor(i / 4) * 165;
      pxRect(ctx, gx, gy, 155, 140, '#F8FAFC');
      pxRect(ctx, gx + 10, gy + 10, 135, 95, cols[i]);
    }

    // Center confirmation dialog modal
    if (modalTitle) {
      drawRisoBox(ctx, 510, 385, 460, 135, '#0F0D1A', '#FACC15', '#312E81');
      ctx.textAlign = 'center';
      ctx.font = 'bold 24px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
      ctx.fillStyle = '#F8FAFC';
      ctx.fillText(modalTitle, 740, 428);
      drawRisoBox(ctx, 565, 455, 140, 42, '#E11D48', '#FDA4AF', '#881337');
      drawRisoBox(ctx, 775, 455, 140, 42, '#334155', '#94A3B8', '#1E293B');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(btn1, 635, 482);
      ctx.fillText(btn2, 845, 482);
    }
    ctx.restore();

    drawRisoWhaleGirl(ctx, 210, 680, 38, { t, view: 'front', emotion: 'sad', tears: true });
  }

  // ==========================================================================
  // Main Frame Renderer: `renderDouyin2Frame(ctx, t)` (0.00s .. 295.43s)
  // ==========================================================================
  function renderDouyin2Frame(ctx, t) {
    reseedBoil(t);
    setActiveStyle('risograph');
    ctx.save();

    // ------------------------------------------------------------------------
    // 1. 0.00s – 11.00s: Venetian Blinds Shadow & Title Card `我[不]难过 — 孙燕姿`
    // ------------------------------------------------------------------------
    if (t < 11.00) {
      if (t < 4.2) {
        // Warm venetian blinds shadow across waking eyes
        pxRect(ctx, 0, 36, W, H - 36, '#E7C8B4');
        for (let y = 55; y < H; y += 64) {
          pxRect(ctx, 0, y, W, 24, 'rgba(69, 26, 3, 0.25)');
        }
        drawRisoWhaleGirl(ctx, 640, 685, 46, { t, view: 'front', emotion: 'sleepy' });
      } else {
        // Title Card: `我 [不] 难过 — 孙燕姿`
        pxRect(ctx, 0, 36, W, H - 36, '#09070E');
        // Left Typography with `[不]` in a vivid crimson stamp box!
        ctx.save();
        ctx.font = 'bold 84px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
        ctx.fillStyle = '#F8FAFC';
        ctx.fillText('我', 68, 255);
        pxRect(ctx, 162, 178, 92, 92, '#E11D48');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('不', 166, 255);
        ctx.fillStyle = '#F8FAFC';
        ctx.fillText('难过', 266, 255);
        ctx.font = 'bold 42px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
        ctx.fillStyle = '#CBD5E1';
        ctx.fillText('孙燕姿 · 深海鲸鱼娘篇', 68, 330);
        ctx.restore();

        // Right Portrait Frame with Venetian Blind Shadows over WhaleGirl!
        drawRisoBox(ctx, 695, 58, 460, 560, '#78350F', '#F59E0B', '#451A03');
        ctx.save();
        ctx.beginPath();
        ctx.rect(700, 63, 450, 550);
        ctx.clip();
        drawRisoWhaleGirl(ctx, 925, 675, 52, { t, view: 'front', emotion: 'sad' });
        for (let sy = 70; sy < 610; sy += 46) {
          pxRect(ctx, 700, sy, 450, 16, 'rgba(9, 7, 14, 0.38)');
        }
        ctx.restore();
      }
    }

    // ------------------------------------------------------------------------
    // 2. 11.00s – 25.00s: Night Window & Red Apartment Door `302` (`又站在你家的门口`)
    // ------------------------------------------------------------------------
    else if (t < 25.00) {
      if (t < 15.5) {
        pxRect(ctx, 0, 36, W, H - 36, '#0B0F24');
        // Lit yellow upstairs window with two silhouettes
        pxRect(ctx, 185, 65, 250, 235, '#FEF08A');
        pxRect(ctx, 305, 65, 10, 235, '#78350F');
        pxRect(ctx, 185, 180, 250, 10, '#78350F');
        drawRisoWhaleGirl(ctx, 845, 685, 42, { t, view: 'side', flip: true, emotion: 'sad' });
      } else {
        drawDoor302Set(ctx, t);
        drawRisoWhaleGirl(ctx, 310, 685, 38, { t, view: 'side', emotion: 'sad' });
      }
    }

    // ------------------------------------------------------------------------
    // 3. 25.00s – 36.80s: One-Sided Chat Messages & Sofa (`这样子单方面的守候 / 还能多久`)
    // ------------------------------------------------------------------------
    else if (t < 36.80) {
      if (t < 31.2) {
        pxRect(ctx, 0, 36, W, H - 36, '#0D1322');
        drawRisoBox(ctx, 430, 55, 420, 555, '#090D16', '#14B8A6', '#1E293B');
        const sent = ['今天降温了，记得多穿点', '我做了你爱吃的菜', '什么时候回来呀？', '还在忙吗……'];
        ctx.save();
        ctx.font = 'bold 19px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
        for (let i = 0; i < sent.length; i++) {
          pxRect(ctx, 520, 105 + i * 85, 305, 48, '#0D9488');
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(sent[i], 535, 135 + i * 85);
          ctx.fillStyle = '#64748B';
          ctx.fillText('未读', 465, 135 + i * 85);
        }
        ctx.restore();
        drawRisoWhaleGirl(ctx, 225, 675, 34, { t, view: 'side', emotion: 'sad' });
      } else {
        pxRect(ctx, 0, 36, W, 480, '#1A162B');
        pxRect(ctx, 0, 516, W, H - 516, '#2A1B18');
        pxRect(ctx, 360, 385, 560, 140, '#0F766E');
        drawRisoWhaleGirl(ctx, 460, 535, 24, { t, view: 'side', emotion: 'sad' });
        drawRisoPartner(ctx, 790, 535, 24, { t, view: 'side', flip: true });
      }
    }

    // ------------------------------------------------------------------------
    // 4. 36.80s – 51.50s: Giant Yellow Umbrella (`她有多温柔`) & `他的心·存储箱` (`但我已不在你心中`)
    // ------------------------------------------------------------------------
    else if (t < 51.50) {
      if (t < 46.2) {
        pxRect(ctx, 0, 36, W, H - 36, '#1E1633');
        // Giant yellow pleated umbrella canopy across top!
        paint(ctx, ellPts(640, 210, 480, 120, 28), { wash: '#FACC15', ink: '#854D0E', sw: 4 });
        pxRect(ctx, 634, 210, 12, 390, '#78350F');
        drawRisoPartner(ctx, 595, 595, 22, { t, view: 'front', smiling: true });
        // WhaleGirl standing outside in the rain on left watching
        drawRisoWhaleGirl(ctx, 215, 645, 28, { t, view: 'side', emotion: 'cry', tears: true });
      } else {
        // RPG Storage Box `他的心 · 存储箱 (容量 1/1)`
        pxRect(ctx, 0, 36, W, H - 36, '#0F0D1D');
        drawRisoBox(ctx, 380, 110, 520, 320, '#18142C', '#F43F5E', '#312E81');
        ctx.save();
        ctx.font = 'bold 22px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
        ctx.fillStyle = '#FDA4AF';
        ctx.fillText('他的心 · 存储箱', 410, 148);
        ctx.fillStyle = '#94A3B8';
        ctx.fillText('容量  1 / 1', 765, 148);
        // Left slot (`已取出：我`) vs Right heart slot (`存入：她`)
        drawRisoBox(ctx, 425, 185, 185, 185, '#090712', '#64748B', '#1E293B');
        drawRisoBox(ctx, 670, 185, 185, 185, '#2A1215', '#F43F5E', '#881337');
        paint(ctx, heartPts(762, 265, 36), { wash: '#F43F5E', ink: null });
        ctx.restore();
        drawRisoWhaleGirl(ctx, 515, 355, 16, { t, view: 'front', emotion: 'cry', tears: true });
      }
    }

    // ------------------------------------------------------------------------
    // 5. 51.50s – 66.80s: Starry Streetlamp (`我真的懂你不是喜新厌旧`) & Rainy Cry (`当你寂寞时候`)
    // ------------------------------------------------------------------------
    else if (t < 66.80) {
      if (t < 61.5) {
        pxRect(ctx, 0, 36, W, 480, '#090D1A');
        pxRect(ctx, 0, 516, W, H - 516, '#1E293B');
        // Warm conical streetlamp beam at x=760
        paint(ctx, [[760, 185], [580, 520], [940, 520]], { wash: '#FACC15', washOp: 55, ink: null });
        pxRect(ctx, 756, 175, 8, 345, '#475569');
        drawRisoWhaleGirl(ctx, 540, 555, 24, { t, view: 'side', emotion: 'sad' });
        drawRisoPartner(ctx, 775, 550, 24, { t, view: 'side', flip: true });
      } else {
        pxRect(ctx, 0, 36, W, H - 36, '#171C30');
        for (let r = 0; r < 45; r++) {
          pxRect(ctx, (r * 73 + Math.floor(t * 250)) % W, 40 + ((r * 89 + Math.floor(t * 480)) % 580), 2, 18, '#60A5FA');
        }
        drawRisoWhaleGirl(ctx, 640, 690, 48, { t, view: 'front', emotion: 'cry', tears: true });
      }
    }

    // ------------------------------------------------------------------------
    // 6. 66.80s – 81.00s: RPG Dialog (`我不难过`) & `[不]难过` Badge (`只是为什么眼泪会流`)
    // ------------------------------------------------------------------------
    else if (t < 81.00) {
      pxRect(ctx, 0, 36, W, H - 36, '#14182B');
      if (t < 73.8) {
        drawRisoWhaleGirl(ctx, 330, 690, 44, { t, view: 'front', emotion: 'sad', tears: true });
        drawRisoBox(ctx, 480, 155, 620, 210, '#1E142B', '#F43F5E', '#4C1D95');
        ctx.save();
        ctx.font = 'bold 24px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
        ctx.fillStyle = '#64748B';
        ctx.fillText('  大哭一场', 515, 205);
        ctx.fillText('  问他为什么', 515, 258);
        ctx.fillStyle = '#FACC15';
        ctx.fillText('> 我不难过，这不算什么', 515, 312);
        ctx.restore();
      } else {
        drawRisoWhaleGirl(ctx, 640, 695, 46, {
          t,
          view: 'front',
          emotion: 'cry',
          tears: true,
          buNanGuoBadge: true
        });
      }
    }

    // ------------------------------------------------------------------------
    // 7. 81.00s – 91.20s: Letting Go of Hands (`就让我走`) & 8-Panel Polaroids (`回忆很多`)
    // ------------------------------------------------------------------------
    else if (t < 91.20) {
      if (t < 88.5) {
        pxRect(ctx, 0, 36, W, H - 36, '#0F292E');
        const gap = lerp(20, 210, seg(t, 81.0, 88.0));
        // Left & right hands pulling apart across the screen + WhaleGirl below
        pxRect(ctx, 180 - gap * 0.5, 320, 260, 56, '#F7C9B6');
        pxRect(ctx, 840 + gap * 0.5, 320, 260, 56, '#F7C9B6');
        drawRisoWhaleGirl(ctx, 640, 685, 36, { t, view: 'front', emotion: 'sad', tears: true });
      } else {
        drawMemory365Grid(ctx, t, null, '', '');
      }
    }

    // ------------------------------------------------------------------------
    // 8. 91.20s – 109.00s: 24H Convenience Store (`便利店 24`) & Rainy Window (`最后的宽容`)
    // ------------------------------------------------------------------------
    else if (t < 109.00) {
      if (t < 100.2) {
        drawConvenienceStoreSet(ctx, t);
        // WhaleGirl walking past the convenience store accompanied by a blue memory shadow!
        drawRisoWhaleGirl(ctx, 590, 575, 26, { t, view: 'side', emotion: 'sad', walk: t * 8 });
        ctx.save();
        ctx.globalAlpha = 0.45;
        drawRisoPartner(ctx, 665, 575, 26, { t, view: 'side', walk: true });
        ctx.restore();
      } else {
        pxRect(ctx, 0, 36, W, H - 36, '#111827');
        drawRisoBox(ctx, 220, 85, 840, 420, '#0F172A', '#475569', '#1E293B');
        for (let r = 0; r < 30; r++) {
          pxRect(ctx, 240 + ((r * 67) % 800), 100 + ((r * 53 + Math.floor(t * 240)) % 380), 2, 18, '#38BDF8');
        }
        drawRisoWhaleGirl(ctx, 480, 500, 32, { t, view: 'front', emotion: 'sad', tears: true });
      }
    }

    // ------------------------------------------------------------------------
    // 9. 109.00s – 125.80s: Two Toothbrushes (`牙刷 2 -> 1`) & Clearing 365 Memories
    // ------------------------------------------------------------------------
    else if (t < 125.80) {
      if (t < 118.0) {
        pxRect(ctx, 0, 36, W, 470, '#78716C');
        pxRect(ctx, 0, 506, W, H - 506, '#78350F');
        // White toothbrush cup in center (x=585..695, y=340..506)
        pxRect(ctx, 585, 340, 110, 166, '#F8FAFC');
        // Blue & Pink toothbrushes (at t >= 115s, only 1 remains!)
        pxRect(ctx, 595, 225, 10, 120, '#38BDF8');
        pxRect(ctx, 585, 210, 24, 24, '#E0F2FE');
        if (t < 115.2) {
          pxRect(ctx, 675, 225, 10, 120, '#F43F5E');
          pxRect(ctx, 665, 210, 24, 24, '#FFE4E6');
        }
        drawRisoWhaleGirl(ctx, 310, 665, 36, { t, view: 'side', emotion: 'sad' });
      } else {
        drawMemory365Grid(ctx, t, '删除全部 365 个回忆？', '确认', '取消');
      }
    }

    // ------------------------------------------------------------------------
    // 10. 125.80s – 146.50s: `他的心·存取记录` & Search Bar `[他]`
    // ------------------------------------------------------------------------
    else if (t < 146.50) {
      if (t < 134.8) {
        pxRect(ctx, 0, 36, W, H - 36, '#141122');
        drawRisoWhaleGirl(ctx, 640, 690, 46, { t, view: 'front', emotion: 'sad', tears: true });
      } else if (t < 141.5) {
        // `他的心 · 存取记录` Terminal Log
        pxRect(ctx, 0, 36, W, H - 36, '#0D0B18');
        drawRisoBox(ctx, 410, 95, 680, 440, '#131024', '#F43F5E', '#312E81');
        ctx.save();
        ctx.font = 'bold 24px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
        ctx.fillStyle = '#FDA4AF';
        ctx.fillText('他的心 · 存取记录', 440, 138);
        const records = [
          ['3年前',   '存入：我'],
          ['1年前',   '位置：变小'],
          ['3个月前', '取出：我'],
          ['1个月前', '存入：她']
        ];
        for (let i = 0; i < records.length; i++) {
          const ry = 205 + i * 68;
          ctx.fillStyle = '#94A3B8';
          ctx.fillText(records[i][0], 445, ry);
          ctx.fillStyle = i === 3 ? '#F43F5E' : '#F8FAFC';
          ctx.fillText(records[i][1], 595, ry);
        }
        paint(ctx, heartPts(965, 285, 48), { wash: '#F43F5E', ink: null });
        ctx.restore();
        drawRisoWhaleGirl(ctx, 215, 665, 34, { t, view: 'side', emotion: 'cry', tears: true });
      } else {
        // Search Modal `[他]`
        pxRect(ctx, 0, 36, W, H - 36, '#0B0914');
        drawRisoBox(ctx, 320, 140, 640, 360, '#120F24', '#64748B', '#1E293B');
        ctx.save();
        ctx.font = 'bold 54px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#E2E8F0';
        ctx.fillText('他', 640, 295);
        ctx.restore();
        drawRisoWhaleGirl(ctx, 195, 665, 32, { t, view: 'side', emotion: 'sad' });
      }
    }

    // ------------------------------------------------------------------------
    // 11. 146.50s – 170.00s: Busy Call Screen & `[不]难过` Chorus 2 (`我不难过这不算什么`)
    // ------------------------------------------------------------------------
    else if (t < 170.00) {
      if (t < 155.8) {
        pxRect(ctx, 0, 36, W, H - 36, '#18181B');
        drawRisoBox(ctx, 490, 65, 300, 520, '#090D16', '#EF4444', '#1E293B');
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = 'bold 22px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
        ctx.fillStyle = '#FCA5A5';
        ctx.fillText('对方正在通话中', 640, 125);
        ctx.font = 'bold 44px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('我', 640, 340);
        paint(ctx, ellPts(640, 495, 28, 28, 14), { wash: '#EF4444', ink: null });
        ctx.restore();
        drawRisoWhaleGirl(ctx, 250, 675, 36, { t, view: 'side', emotion: 'cry', tears: true });
      } else if (t < 162.0) {
        pxRect(ctx, 0, 36, W, H - 36, '#14182B');
        drawRisoWhaleGirl(ctx, 435, 685, 44, { t, view: 'side', emotion: 'cry', tears: true });
        drawRisoPartner(ctx, 845, 685, 44, { t, view: 'side', flip: true });
      } else {
        pxRect(ctx, 0, 36, W, H - 36, '#14182B');
        drawRisoWhaleGirl(ctx, 640, 695, 46, {
          t,
          view: 'front',
          emotion: 'cry',
          tears: true,
          buNanGuoBadge: true
        });
      }
    }

    // ------------------------------------------------------------------------
    // 12. 170.00s – 199.50s: Leaving Door 302, Blue Shadow, & RPG Backpack `【原谅】`
    // ------------------------------------------------------------------------
    else if (t < 199.50) {
      if (t < 179.8) {
        drawDoor302Set(ctx, t);
        drawRisoWhaleGirl(ctx, 280, 685, 38, { t, view: 'front', emotion: 'calm' });
      } else if (t < 190.8) {
        pxRect(ctx, 0, 36, W, 470, '#0D0B18');
        pxRect(ctx, 0, 506, W, H - 506, '#1E293B');
        drawRisoWhaleGirl(ctx, 490, 575, 28, { t, view: 'side', emotion: 'sad', walk: t * 7 });
        // Translucent cyan shadow silhouette walking right behind her (`你的影子也会充满我生活`)
        ctx.save();
        ctx.globalAlpha = 0.55;
        drawRisoPartner(ctx, 595, 575, 28, { t, view: 'side', walk: true });
        ctx.restore();
      } else {
        // RPG Inventory `[背包 — 最后的宽容：【原谅】]`
        pxRect(ctx, 0, 36, W, H - 36, '#0B0914');
        drawRisoBox(ctx, 355, 95, 570, 420, '#131024', '#F43F5E', '#312E81');
        ctx.save();
        ctx.font = 'bold 22px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
        ctx.fillStyle = '#F8FAFC';
        ctx.fillText('背包', 385, 132);
        ctx.fillStyle = '#94A3B8';
        ctx.fillText('重要物品', 810, 132);
        for (let i = 0; i < 4; i++) {
          drawRisoBox(ctx, 390 + i * 128, 165, 108, 108, '#090712', i === 0 ? '#FACC15' : '#475569', '#1E293B');
        }
        ctx.fillStyle = '#FACC15';
        ctx.fillText('【原谅】  最后的宽容 x 1', 395, 345);
        ctx.restore();
        drawRisoWhaleGirl(ctx, 205, 665, 34, { t, view: 'side', emotion: 'calm' });
      }
    }

    // ------------------------------------------------------------------------
    // 13. 199.50s – 222.50s: Thermal Embrace `36.5°C` (`抱紧我再抱紧我`) & `[✓] 过得比你快活`
    // ------------------------------------------------------------------------
    else if (t < 222.50) {
      if (t < 207.8) {
        // Thermal Infrared Embrace (`36.5°C`)!
        pxRect(ctx, 0, 36, W, H - 36, '#090612');
        paint(ctx, ellPts(640, 360, 210, 250, 24), { wash: '#EF4444', washOp: 65, ink: null });
        paint(ctx, ellPts(640, 360, 130, 170, 20), { wash: '#FACC15', washOp: 75, ink: null });
        drawRisoPartner(ctx, 610, 565, 28, { t, view: 'side', smiling: true, noShadow: true });
        drawRisoWhaleGirl(ctx, 670, 570, 28, { t, view: 'side', flip: true, emotion: 'love', emote: 'heart' });
        ctx.save();
        ctx.font = 'bold 42px "Silkscreen", monospace';
        ctx.fillStyle = '#F8FAFC';
        ctx.fillText('36.5 C', 825, 310);
        ctx.restore();
      } else if (t < 214.8) {
        pxRect(ctx, 0, 36, W, H - 36, '#14182B');
        drawRisoWhaleGirl(ctx, 430, 685, 44, { t, view: 'side', emotion: 'sad', tears: true });
        drawRisoPartner(ctx, 850, 685, 44, { t, view: 'side', flip: true });
      } else {
        drawMemory365Grid(ctx, t, '任务：[✓] 忘了所有过得比你快活', '已完成', '确定');
      }
    }

    // ------------------------------------------------------------------------
    // 14. 222.50s – 256.50s: Corridor `302`, Sunburst `我不难过`, & `💧 ×99+` Burst!
    // ------------------------------------------------------------------------
    else if (t < 256.50) {
      if (t < 238.8) {
        // Apartment corridor walking past room 302
        pxRect(ctx, 0, 36, W, 480, '#E7E5E4');
        pxRect(ctx, 0, 516, W, H - 516, '#14B8A6');
        pxRect(ctx, 210, 110, 210, 406, '#3B82F6');
        pxRect(ctx, 680, 110, 210, 406, '#991B1B');
        drawRisoWhaleGirl(ctx, 550, 575, 26, { t, view: 'side', emotion: 'sad', walk: t * 8 });
        drawRisoPartner(ctx, 785, 570, 26, { t, view: 'front' });
      } else if (t < 250.5) {
        // Crimson/Purple Sunburst + Smiling through tears `[我不难过]`
        pxRect(ctx, 0, 36, W, H - 36, '#581C87');
        ctx.save();
        ctx.translate(480, 420);
        for (let i = 0; i < 16; i++) {
          const a0 = (i / 16) * TAU + t * 0.6;
          const a1 = a0 + TAU / 32;
          ctx.fillStyle = i % 2 === 0 ? '#7E22CE' : '#9D174D';
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a0) * 900, Math.sin(a0) * 900);
          ctx.lineTo(Math.cos(a1) * 900, Math.sin(a1) * 900);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();

        drawRisoWhaleGirl(ctx, 480, 695, 48, { t, view: 'front', emotion: 'happy', tears: true });
        drawRisoBox(ctx, 820, 165, 310, 105, '#2A1215', '#F43F5E', '#881337');
        ctx.save();
        ctx.font = 'bold 56px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('我不难过', 975, 232);
        ctx.restore();
      } else {
        // `💧 ×99+` Radial Teardrop Burst (`只是为什么眼泪会流 / 我也不懂`)
        pxRect(ctx, 0, 36, W, H - 36, '#091526');
        for (let i = 0; i < 24; i++) {
          const ang = (i / 24) * TAU + t * 0.8;
          const r = 110 + ((i * 45 + Math.floor(t * 160)) % 220);
          paint(ctx, ellPts(420 + Math.cos(ang) * r, 320 + Math.sin(ang) * r, 8, 12, 10), { wash: '#38BDF8', ink: null });
        }
        ctx.save();
        ctx.font = 'bold 72px "Silkscreen", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#F8FAFC';
        ctx.fillText('x99+', 420, 335);
        ctx.restore();

        drawRisoWhaleGirl(ctx, 920, 690, 44, { t, view: 'front', emotion: 'cry', tears: true });
      }
    }

    // ------------------------------------------------------------------------
    // 15. 256.50s – 284.00s: Crossroads Signpost, Streetlamp Parting, & Dawn Walk (`真正的解脱`)
    // ------------------------------------------------------------------------
    else if (t < 284.00) {
      if (t < 265.2) {
        pxRect(ctx, 0, 36, W, 470, '#141128');
        pxRect(ctx, 0, 506, W, H - 506, '#1E293B');
        // Crossroads signposts: `[继续走下去]` vs `[到此为止]`
        pxRect(ctx, 515, 360, 8, 150, '#94A3B8');
        pxRect(ctx, 695, 390, 8, 120, '#94A3B8');
        drawRisoBox(ctx, 440, 340, 145, 42, '#0284C7', '#7DD3FC', '#0369A1');
        drawRisoBox(ctx, 630, 375, 145, 42, '#E11D48', '#FDA4AF', '#881337');
        ctx.save();
        ctx.font = 'bold 20px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('继续走下去', 512, 367);
        ctx.fillText('到此为止',   702, 402);
        ctx.restore();
        drawRisoWhaleGirl(ctx, 310, 575, 26, { t, view: 'side', emotion: 'calm' });
      } else if (t < 273.8) {
        pxRect(ctx, 0, 36, W, 480, '#090D1A');
        pxRect(ctx, 0, 516, W, H - 516, '#1E293B');
        paint(ctx, [[920, 165], [760, 520], [1080, 520]], { wash: '#FACC15', washOp: 55, ink: null });
        drawRisoWhaleGirl(ctx, 460, 555, 24, { t, view: 'side', flip: true, emotion: 'calm', walk: t * 7 });
        drawRisoPartner(ctx, 920, 555, 24, { t, view: 'front' });
      } else {
        // Walking forward into the warm dawn street (`我向前走这会是我 / 真正的解脱`)
        pxRect(ctx, 0, 36, W, 320, '#6366F1');
        pxRect(ctx, 0, 356, W, 160, '#FDBA74');
        pxRect(ctx, 0, 516, W, H - 516, '#334155');
        drawRisoWhaleGirl(ctx, 640, 685, 44, { t, view: 'front', emotion: 'happy', walk: t * 8 });
      }
    }

    // ------------------------------------------------------------------------
    // 16. 284.00s – 295.43s: Final Title Reveal — `[不]` Vanishes -> `我 难过 (眼泪 x 32)`!
    // ------------------------------------------------------------------------
    else {
      pxRect(ctx, 0, 0, W, H, '#09070E');
      const hideBu = t >= 286.0;
      ctx.save();
      ctx.font = 'bold 84px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
      ctx.fillStyle = '#F8FAFC';
      ctx.fillText('我', 68, 255);
      if (!hideBu) {
        pxRect(ctx, 162, 178, 92, 92, '#E11D48');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('不', 166, 255);
      }
      ctx.fillStyle = '#F8FAFC';
      ctx.fillText('难过', 266, 255);
      ctx.font = 'bold 42px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
      ctx.fillStyle = '#CBD5E1';
      ctx.fillText('孙燕姿 · 深海鲸鱼娘篇', 68, 330);
      ctx.font = 'bold 20px "Silkscreen", "ZCOOLKuaiLe", monospace';
      ctx.fillStyle = '#38BDF8';
      ctx.fillText('眼泪  x 32', 68, 410);
      ctx.restore();

      drawRisoBox(ctx, 695, 58, 460, 560, '#78350F', '#F59E0B', '#451A03');
      ctx.save();
      ctx.beginPath();
      ctx.rect(700, 63, 450, 550);
      ctx.clip();
      drawRisoWhaleGirl(ctx, 925, 675, 52, { t, view: 'front', emotion: 'cry', tears: true });
      for (let sy = 70; sy < 610; sy += 46) {
        pxRect(ctx, 700, sy, 450, 16, 'rgba(9, 7, 14, 0.42)');
      }
      ctx.restore();
    }

    // ========================================================================
    // Top Tear HUD & Bottom Subtitle Bar (Synced 1:1 with `每天每天的抖音 - 抖音_2.mp4`)
    // ========================================================================
    drawTopTearHUD(ctx, t);

    const sub = getSubtitleAt(t);
    if (sub && sub.zh && t < 284.0) {
      drawRisoBox(ctx, 355, 644, 570, 50, 'rgba(12, 10, 22, 0.90)', '#F43F5E', '#1E1B32');
      const pop = backOut(seg(t, sub.t0, sub.t0 + 0.18));
      ctx.save();
      ctx.translate(640, 669);
      ctx.scale(0.94 + 0.06 * pop, 0.94 + 0.06 * pop);
      ctx.font = 'bold 27px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#07060D';
      ctx.fillText(sub.zh, 2, 2);
      ctx.fillStyle = '#F8FAFC';
      ctx.fillText(sub.zh, 0, 0);
      ctx.restore();
    }

    ctx.restore();
  }

  const MV_DOUYIN_2 = {
    DURATION: DURATION_MV2,
    SUBTITLES: SUBTITLES_MV2,
    renderDouyin2Frame,
    drawRisoWhaleGirl,
    drawRisoPartner
  };

  root.MV_DOUYIN_2 = MV_DOUYIN_2;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MV_DOUYIN_2;
  }
})(typeof window !== 'undefined' ? window : globalThis);
