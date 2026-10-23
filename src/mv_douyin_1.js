// ============================================================================
// src/mv_douyin_1.js — #01 《我怀念的》(孙燕姿 · 深海鲸鱼娘篇) Full 288.40s MV Director
// Replicated from `每天每天的抖音 - 抖音.mp4` (288.40s, 30fps, 1280x720)
// Protagonist: `whaleGirl` (`src/whale_girl.js` 7-bone articulated rig) +
//              `drawPartnerRig` (104x102 warm autumn cardigan partner rig) & `CAST`
// Audio & Beat Sync: `assets/douyin_1.mp3` + `assets/douyin_1_audio.js` (68 BPM)
// Visual Style: Ukiyo-e Woodblock & Warm Nostalgic Sunset/Starlight Cinema (`ukiyoe`)
// ============================================================================

(function (root) {
  const CORE = root.CORE || (typeof require !== 'undefined' ? require('./core.js') : {});
  const WHALE = root.WHALE_GIRL || (typeof require !== 'undefined' ? require('./whale_girl.js') : {});
  const CAST = root.CAST || (typeof require !== 'undefined' ? require('./cast.js') : {});

  const {
    W, H, FPS, TAU, PAL,
    clamp, lerp, seg, ease, easeIn, easeOut, backOut, wob, hash,
    reseedBoil, boilSeed, beatPulse,
    setActiveStyle, paint, inkLine, ellPts, heartPts, starPts
  } = CORE;
  const { whaleGirl, feel } = WHALE;

  const DURATION_MV1 = 288.40;

  // ==========================================================================
  // Exact 52 Subtitle Beat-Sync Timestamps from `每天每天的抖音 - 抖音.mp4`
  // ==========================================================================
  const SUBTITLES_MV1 = [
    { t0: 18.0,  t1: 20.8,  zh: '我问为什么' },
    { t0: 20.8,  t1: 25.5,  zh: '那女孩传简讯给我' },
    { t0: 25.5,  t1: 27.8,  zh: '而你为什么' },
    { t0: 27.8,  t1: 31.8,  zh: '不解释低着头沉默' },
    { t0: 31.8,  t1: 35.8,  zh: '我该相信你很爱我' },
    { t0: 35.8,  t1: 39.8,  zh: '不愿意敷衍我' },
    { t0: 39.8,  t1: 41.0,  zh: '还是明白' },
    { t0: 41.0,  t1: 46.2,  zh: '你已不想挽回什么' },
    { t0: 47.8,  t1: 49.8,  zh: '想问为什么' },
    { t0: 49.8,  t1: 54.0,  zh: '我不再是你的快乐' },
    { t0: 54.8,  t1: 56.8,  zh: '可是为什么' },
    { t0: 56.8,  t1: 60.8,  zh: '却苦笑说我都懂了' },
    { t0: 60.8,  t1: 64.5,  zh: '自尊常常将人拖着' },
    { t0: 64.5,  t1: 67.8,  zh: '把爱都走曲折' },
    { t0: 67.8,  t1: 69.8,  zh: '假装了解是怕' },
    { t0: 69.8,  t1: 72.8,  zh: '真相太赤裸裸' },
    { t0: 72.8,  t1: 75.8,  zh: '狼狈比失去难受' },
    { t0: 75.8,  t1: 79.8,  zh: '我怀念的 是无话不说' },
    { t0: 79.8,  t1: 82.8,  zh: '我怀念的 是一起做梦' },
    { t0: 82.8,  t1: 85.8,  zh: '我怀念的 是争吵以后' },
    { t0: 85.8,  t1: 89.8,  zh: '还是想要爱你的冲动' },
    { t0: 89.8,  t1: 93.8,  zh: '我记得那年生日' },
    { t0: 93.8,  t1: 96.8,  zh: '也记得那一首歌' },
    { t0: 96.8,  t1: 98.8,  zh: '记得那片星空' },
    { t0: 98.8,  t1: 100.8, zh: '最紧的右手' },
    { t0: 100.8, t1: 102.0, zh: '最暖的胸口' },
    { t0: 102.0, t1: 105.8, zh: '谁记得' },
    { t0: 105.8, t1: 108.8, zh: '谁忘了' },
    { t0: 117.8, t1: 119.8, zh: '想问为什么' },
    { t0: 119.8, t1: 125.0, zh: '我不再是你的快乐' },
    { t0: 125.0, t1: 127.5, zh: '可是为什么' },
    { t0: 127.5, t1: 131.8, zh: '却苦笑说我都懂了' },
    { t0: 131.8, t1: 134.8, zh: '自尊常常将人拖着' },
    { t0: 134.8, t1: 137.8, zh: '把爱都走曲折' },
    { t0: 137.8, t1: 139.8, zh: '假装了解是怕' },
    { t0: 139.8, t1: 142.8, zh: '真相太赤裸裸' },
    { t0: 142.8, t1: 145.8, zh: '狼狈比失去难受' },
    { t0: 145.8, t1: 149.8, zh: '我怀念的 是无话不说' },
    { t0: 149.8, t1: 152.8, zh: '我怀念的 是一起做梦' },
    { t0: 152.8, t1: 155.8, zh: '我怀念的 是争吵以后' },
    { t0: 155.8, t1: 159.8, zh: '还是想要爱你的冲动' },
    { t0: 159.8, t1: 163.5, zh: '我记得那年生日' },
    { t0: 163.5, t1: 166.8, zh: '也记得那一首歌' },
    { t0: 166.8, t1: 168.8, zh: '记得那片星空' },
    { t0: 168.8, t1: 170.8, zh: '最紧的右手' },
    { t0: 170.8, t1: 172.0, zh: '最暖的胸口' },
    { t0: 172.0, t1: 173.8, zh: '谁忘了' },
    { t0: 173.8, t1: 176.8, zh: '我怀念的 是无言感动' },
    { t0: 176.8, t1: 180.5, zh: '我怀念的 是绝对炽热' },
    { t0: 180.5, t1: 183.8, zh: '我怀念的 是你很激动' },
    { t0: 183.8, t1: 187.8, zh: '求我原谅抱得我都痛' },
    { t0: 187.8, t1: 190.8, zh: '我记得你在背后' },
    { t0: 190.8, t1: 193.8, zh: '也记得我颤抖着' },
    { t0: 193.8, t1: 196.2, zh: '记得感觉汹涌' },
    { t0: 196.2, t1: 198.8, zh: '最美的烟火' },
    { t0: 198.8, t1: 200.0, zh: '最长的相拥' },
    { t0: 200.0, t1: 202.5, zh: '谁爱得太自由' },
    { t0: 202.5, t1: 205.8, zh: '谁过头太远了' },
    { t0: 205.8, t1: 209.8, zh: '谁要走我的心' },
    { t0: 209.8, t1: 212.8, zh: '谁忘了那就是承诺' },
    { t0: 212.8, t1: 216.2, zh: '谁自顾自地走' },
    { t0: 216.2, t1: 219.8, zh: '谁忘了看着我' },
    { t0: 219.8, t1: 223.0, zh: '谁让爱变沉重' },
    { t0: 223.8, t1: 229.5, zh: '谁忘了要给你温柔' },
    { t0: 238.8, t1: 240.8, zh: '我怀念的' },
    { t0: 240.8, t1: 245.0, zh: '我还有想要爱你的冲动' },
    { t0: 245.8, t1: 248.8, zh: '我记得那年生日' },
    { t0: 248.8, t1: 252.2, zh: '也记得那一首歌' },
    { t0: 252.2, t1: 254.2, zh: '记得那片星空' },
    { t0: 254.2, t1: 255.8, zh: '最紧的右手' },
    { t0: 255.8, t1: 257.8, zh: '最暖的胸口' },
    { t0: 257.8, t1: 260.8, zh: '我放手' },
    { t0: 260.8, t1: 263.8, zh: '我让座' },
    { t0: 263.8, t1: 266.8, zh: '假洒脱' },
    { t0: 266.8, t1: 270.8, zh: '谁懂我多么不舍得' },
    { t0: 270.8, t1: 273.8, zh: '太爱了' },
    { t0: 273.8, t1: 277.5, zh: '所以我' },
    { t0: 277.5, t1: 281.5, zh: '没有哭' },
    { t0: 281.5, t1: 284.5, zh: '没有说' },
    { t0: 285.0, t1: 288.2, zh: 'THE END' }
  ];

  function getSubtitleAt(t) {
    for (let i = 0; i < SUBTITLES_MV1.length; i++) {
      const s = SUBTITLES_MV1[i];
      if (t >= s.t0 && t < s.t1) return s;
    }
    return null;
  }

  function pxRect(ctx, x, y, w, h, col) {
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function drawBox(ctx, x, y, w, h, bg = '#130F1C', border = '#A16207', inner = '#2E1F38') {
    pxRect(ctx, x - 3, y - 3, w + 6, h + 6, '#09060E');
    pxRect(ctx, x - 2, y - 2, w + 4, h + 4, border);
    pxRect(ctx, x, y, w, h, inner);
    pxRect(ctx, x + 2, y + 2, w - 4, h - 4, bg);
  }

  // ==========================================================================
  // Protagonist: `drawNostalgicWhaleGirl`
  // Renders `whaleGirl` (`src/whale_girl.js` 7-bone rig) in `ukiyoe` woodblock
  // warm nostalgia style, with optional autumn scarf, earphones, tears, or mask!
  // ==========================================================================
  function drawNostalgicWhaleGirl(ctx, x, y, u, opts = {}) {
    const t = opts.t || 0;
    const view = opts.view || 'front';
    const emo = opts.emotion || 'happy';
    const bp = beatPulse(t);
    const dy = (opts.dy || 0) - bp * 0.05;

    whaleGirl(ctx, x, y, u, Object.assign({}, feel(emo, t), opts, {
      view,
      style: 'ukiyoe',
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

    // Warm autumn amber ribbon/scarf at neck (`gy = -45..-40`, below chin `gy = -46`)
    if (view !== 'back') {
      p(-7, -45, 14, 2, '#9A3412');
      p(-6, -44, 12, 2, '#EA580C');
      p(-3, -42, 6,  2, '#F97316');
    }

    // Streaming pixel tears
    if (opts.tears && view !== 'back') {
      const td = Math.floor((t * 7) % 5);
      p(-8, -56, 2, 5, '#38BDF8');
      p(6,  -56, 2, 5, '#38BDF8');
      p(-8, -50 + td, 2, 2, '#BAE6FD');
      p(6,  -50 + td, 2, 2, '#BAE6FD');
    }

    // White wired earphone cord (`opts.earphone`)
    if (opts.earphone) {
      p(10, -58, 2, 4, '#FFFFFF');
      p(11, -54, 2, 14, '#E2E8F0');
      p(12, -40, 2, 14, '#E2E8F0');
    }

    // Split bitter-smile mask (`opts.splitMask` at t=54.5s..60.8s)
    if (opts.splitMask) {
      // Right half of face has a cool blue tearful tint + wavy vertical divider line
      ctx.fillStyle = 'rgba(56, 189, 248, 0.28)';
      ctx.fillRect(0, -78 * cell, 18 * cell, 32 * cell);
      p(0, -82, 1, 40, '#F8FAFC');
      p(6, -56, 2, 7, '#38BDF8');
    }

    // Floating white smiling mask descending over crying face (`opts.whiteMask` at t=137.8s..142.8s)
    if (opts.whiteMask !== undefined) {
      const my = lerp(-98, -62, clamp(opts.whiteMask, 0, 1));
      p(-11, my - 12, 22, 22, '#1E293B');
      p(-10, my - 11, 20, 20, '#F8FAFC');
      p(-7,  my - 4,  4,  2,  '#0F172A');
      p(3,   my - 4,  4,  2,  '#0F172A');
      p(-4,  my + 3,  8,  2,  '#E11D48');
    }

    // Black censor bar over eyes (`opts.censorBar` at t=277.5s..284.5s: "没有哭 / 没有说")
    if (opts.censorBar) {
      p(-16, -63, 32, 8, '#09060E');
      p(-15, -62, 30, 6, '#1E1B24');
    }

    ctx.restore();
  }

  // ==========================================================================
  // Partner Rig: `drawPartnerRig` (104x102 Articulated Pixel Rig in Autumn Cardigan)
  // ==========================================================================
  const _partnerPalCache = {};
  function getPartnerPalettes(basePal) {
    if (_partnerPalCache.headPal) return _partnerPalCache;
    _partnerPalCache.headPal = basePal.map((hex) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      if (r >= b - 10) return hex;
      if (lum < 0.24) return '#18131A';
      if (lum < 0.38) return '#2B2129';
      if (lum < 0.52) return '#42323B';
      if (lum < 0.68) return '#5B4550';
      return '#7A5E6B';
    });
    _partnerPalCache.torsoPal = basePal.map((hex) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      if (r > b + 20 && lum > 0.65) return hex;
      if (lum < 0.22) return '#431407';
      if (lum < 0.36) return '#7C2D12';
      if (lum < 0.50) return '#9A3412';
      if (lum < 0.66) return '#C2410C';
      if (lum < 0.82) return '#EA580C';
      return '#FDBA74';
    });
    return _partnerPalCache;
  }

  function drawPartnerRig(ctx, x, y, u = 28, opts = {}) {
    const t = opts.t || 0;
    const rig = root.WHALE_GIRL_PIXEL_RIG || (typeof require === 'function' ? require('./whale_girl_rig_data.js') : null);
    if (!rig) return;

    const view = opts.view || 'front';
    const cell = u / rig.scale;
    const headBob = Math.sin(t * 2.5 + 0.8) * 0.045 * u;
    const walkW = opts.walk ? t * 9 : 0;
    const hipL = walkW ? Math.sin(walkW) * 0.25 : 0;
    const hipR = walkW ? -Math.sin(walkW) * 0.25 : 0;

    let poseKey = opts.smiling ? 'heart' : (opts.crying ? 'panic' : 'wave');
    const isTurnView = (view && view !== 'front' && rig.views && rig.views[view]);
    const poseBones = isTurnView ? rig.views[view] : (rig.poses[poseKey] || rig.poses.wave);
    const { headPal, torsoPal } = getPartnerPalettes(rig.palette);

    if (!opts.noShadow) {
      paint(ctx, ellPts(x, y + 0.10 * u, 2.1 * u, 0.40 * u, 14), { wash: '#09060E', washOp: 65, ink: null });
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
  // Top Nostalgic Memory Star Bar (`回忆 星 × XX`)
  // ==========================================================================
  function getStarCountAt(t) {
    if (t < 75.8) return '00';
    if (t < 82.8) return '01';
    if (t < 95.0) return '03';
    if (t < 101.0) return '05';
    if (t < 104.5) return '07';
    if (t < 190.0) return '08';
    if (t < 236.0) return '09';
    return '99';
  }

  function drawTopMemoryHUD(ctx, t) {
    pxRect(ctx, 0, 0, W, 34, '#09060E');
    pxRect(ctx, 0, 34, W, 2, '#2E1F38');

    if (t >= 16.5 && t < 284.5) {
      const stars = getStarCountAt(t);
      ctx.save();
      ctx.font = 'bold 16px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText('回忆', 1175, 17);
      paint(ctx, starPts(1194, 17, 9, 4, 5), { wash: '#FACC15', ink: null });
      ctx.font = 'bold 20px "Silkscreen", monospace';
      ctx.fillStyle = '#FACC15';
      ctx.fillText(`x${stars}`, 1258, 17);
      ctx.restore();
    }
  }

  // ==========================================================================
  // Reusable Sets for #01 《我怀念的》
  // ==========================================================================
  function drawLivingRoomSet(ctx, t) {
    pxRect(ctx, 0, 36, W, 480, '#1A162B');
    pxRect(ctx, 0, 516, W, H - 516, '#2A1B18');
    // Framed wall art
    pxRect(ctx, 590, 125, 100, 82, '#78350F');
    pxRect(ctx, 598, 133, 84, 66, '#FDE68A');
    // Left window with night sky
    pxRect(ctx, 180, 95, 220, 220, '#312E81');
    pxRect(ctx, 190, 105, 200, 200, '#0F172A');
    // Blue Living Room Sofa (x=360..920, y=380..530)
    pxRect(ctx, 360, 385, 560, 140, '#1E3A8A');
    pxRect(ctx, 380, 395, 520, 85, '#1D4ED8');
    pxRect(ctx, 350, 430, 35, 95, '#1E40AF');
    pxRect(ctx, 895, 430, 35, 95, '#1E40AF');
    // Right Bookshelf
    pxRect(ctx, 1020, 220, 150, 300, '#451A03');
    for (let r = 0; r < 4; r++) {
      pxRect(ctx, 1032, 238 + r * 68, 126, 52, '#271206');
      pxRect(ctx, 1040, 248 + r * 68, 18, 42, '#EF4444');
      pxRect(ctx, 1062, 248 + r * 68, 22, 42, '#38BDF8');
      pxRect(ctx, 1088, 248 + r * 68, 16, 42, '#FACC15');
    }
  }

  function drawNeonStreetSet(ctx, t, raining = false) {
    pxRect(ctx, 0, 36, W, 480, '#0D0B18');
    pxRect(ctx, 0, 516, W, H - 516, '#1E1B2E');
    // Row of pixel storefronts & glowing neon signs
    const shops = [
      { x: 40,  w: 220, h: 360, col: '#1E1B4B', sign: '便利店', sCol: '#38BDF8' },
      { x: 280, w: 240, h: 410, col: '#172554', sign: '咖啡屋', sCol: '#F472B6' },
      { x: 540, w: 230, h: 380, col: '#1E1B4B', sign: '唱片行', sCol: '#FACC15' },
      { x: 790, w: 220, h: 420, col: '#0F172A', sign: '夜宵摊', sCol: '#2DD4BF' },
      { x: 1030,w: 210, h: 370, col: '#1E1B4B', sign: '书店',   sCol: '#FB7185' }
    ];
    ctx.save();
    for (const s of shops) {
      const by = 516 - s.h;
      pxRect(ctx, s.x, by, s.w, s.h, s.col);
      for (let wy = by + 28; wy < 380; wy += 48) {
        for (let wx = s.x + 22; wx < s.x + s.w - 35; wx += 46) {
          pxRect(ctx, wx, wy, 26, 30, (wx + wy) % 3 === 0 ? '#FDE047' : '#1E293B');
        }
      }
      // Glowing Neon Signboard
      drawBox(ctx, s.x + 24, 405, s.w - 48, 42, '#09060E', s.sCol, '#1E1B4B');
      ctx.font = 'bold 22px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = s.sCol;
      ctx.fillText(s.sign, s.x + s.w * 0.5, 433);
    }
    ctx.restore();

    // Sidewalk guardrails
    pxRect(ctx, 0, 502, W, 6, '#475569');
    for (let gx = 30; gx < W; gx += 60) {
      pxRect(ctx, gx, 476, 6, 40, '#64748B');
    }

    if (raining) {
      for (let r = 0; r < 48; r++) {
        const rx = (r * 79 + Math.floor(t * 280)) % W;
        const ry = 40 + ((r * 67 + Math.floor(t * 520)) % 580);
        pxRect(ctx, rx, ry, 2, 20, '#60A5FA');
      }
    }
  }

  function drawMemoryBookSet(ctx, t, rightTitle, rightYear, starsCount) {
    pxRect(ctx, 0, 36, W, H - 36, '#2A1810');
    // Open two-page album book (x=130..1150, y=55..630)
    drawBox(ctx, 130, 55, 1020, 575, '#FEF3C7', '#78350F', '#B45309');
    pxRect(ctx, 636, 55, 8, 575, '#92400E'); // Center spine

    // Left page: `回忆图鉴` 3x3 colored memory stamps
    ctx.save();
    ctx.font = 'bold 22px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
    ctx.fillStyle = '#78350F';
    ctx.fillText('回忆图鉴', 168, 96);
    const stampCols = ['#F97316', '#0284C7', '#EAB308', '#EC4899', '#10B981', '#8B5CF6', '#64748B', '#64748B', '#64748B'];
    for (let i = 0; i < 9; i++) {
      const sx = 175 + (i % 3) * 145;
      const sy = 128 + Math.floor(i / 3) * 150;
      pxRect(ctx, sx, sy, 120, 120, '#FFFFFF');
      pxRect(ctx, sx + 10, sy + 10, 100, 82, i < starsCount ? stampCols[i] : '#CBD5E1');
    }

    // Right page: Featured Polaroid Scene with WhaleGirl & Partner!
    drawBox(ctx, 685, 105, 415, 465, '#FDE68A', '#92400E', '#D97706');
    pxRect(ctx, 715, 135, 355, 275, '#1E293B');
    drawPartnerRig(ctx, 825, 395, 22, { t, view: 'front', smiling: true, noShadow: true });
    drawNostalgicWhaleGirl(ctx, 955, 400, 22, { t, view: 'front', emotion: 'love', emote: 'heart' });

    ctx.textAlign = 'center';
    ctx.font = 'bold 30px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
    ctx.fillStyle = '#78350F';
    ctx.fillText(rightTitle, 892, 462);
    ctx.font = 'bold 18px "Silkscreen", "ZCOOLKuaiLe", monospace';
    ctx.fillStyle = '#B45309';
    ctx.fillText(rightYear, 892, 502);
    ctx.restore();
  }

  // ==========================================================================
  // Main Frame Renderer: `renderDouyin1Frame(ctx, t)` (0.00s .. 288.40s)
  // ==========================================================================
  function renderDouyin1Frame(ctx, t) {
    reseedBoil(t);
    setActiveStyle('ukiyoe');
    ctx.save();

    // ------------------------------------------------------------------------
    // 1. 0.00s – 4.50s: 02:47 AM Dark Bedroom Clock & Glowing Smartphone
    // ------------------------------------------------------------------------
    if (t < 4.50) {
      pxRect(ctx, 0, 36, W, H - 36, '#0D0A14');
      // Digital clock `02:47`
      drawBox(ctx, 815, 185, 175, 68, '#181124', '#4C1D95', '#2E1065');
      ctx.save();
      ctx.font = 'bold 42px "Silkscreen", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#F43F5E';
      ctx.fillText('02:47', 902, 232);
      ctx.restore();

      // Glowing Smartphone on nightstand vibrating at t >= 1.5s
      const buzz = t >= 1.5 ? Math.sin(t * 45) * 4 : 0;
      drawBox(ctx, 470 + buzz, 210, 145, 255, t >= 1.5 ? '#3B0764' : '#111827', '#9333EA', '#1E1B4B');
      // WhaleGirl awake in the dark bedroom corner looking at the phone
      drawNostalgicWhaleGirl(ctx, 260, 665, 34, { t, view: 'side', emotion: 'sad' });
    }

    // ------------------------------------------------------------------------
    // 2. 4.50s – 11.00s: Sunset Hilltop Title Card 《我怀念的》 孙燕姿
    // ------------------------------------------------------------------------
    else if (t < 11.00) {
      // Warm Ukiyo-e Sunset Gradient Sky
      const bands = ['#1E1B4B', '#312E81', '#581C87', '#9D174D', '#EA580C', '#F59E0B', '#FDE047'];
      for (let i = 0; i < bands.length; i++) {
        pxRect(ctx, 0, 36 + i * 72, W, 74, bands[i]);
      }
      // Setting sun disc
      paint(ctx, ellPts(880, 475, 105, 105, 24), { wash: '#FEF9C3', ink: null });
      // Dark curved hilltop silhouette
      paint(ctx, [[-20, 720], [-20, 590], [450, 520], [920, 485], [1300, 540], [1300, 720]], { wash: '#140C08', ink: null });

      // WhaleGirl & Partner standing together on the sunset hill crest!
      drawPartnerRig(ctx, 845, 505, 18, { t, view: 'side', smiling: true });
      drawNostalgicWhaleGirl(ctx, 920, 510, 18, { t, view: 'side', flip: true, emotion: 'love', emote: 'heart' });

      // Top-left Title Typography: `我怀念的 — 孙燕姿`
      ctx.save();
      ctx.font = 'bold 86px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
      ctx.fillStyle = '#1E1B4B';
      ctx.fillText('我怀念的', 54, 154);
      ctx.fillStyle = '#FEF08A';
      ctx.fillText('我怀念的', 50, 150);
      ctx.font = 'bold 38px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
      ctx.fillStyle = '#FDBA74';
      ctx.fillText('孙燕姿 · 深海鲸鱼娘篇', 54, 218);

      // RPG Menu Box on bottom-right (`▶ 播放回忆 / 我的怀念 / 退出`)
      drawBox(ctx, 945, 495, 235, 155, '#1C100B', '#F59E0B', '#78350F');
      ctx.font = 'bold 22px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
      ctx.fillStyle = '#FACC15';
      ctx.fillText('> 播放回忆', 975, 538);
      ctx.fillStyle = '#CBD5E1';
      ctx.fillText('  我的怀念', 975, 580);
      ctx.fillText('  退出',     975, 622);
      ctx.restore();
    }

    // ------------------------------------------------------------------------
    // 3. 11.00s – 16.50s: '05 3 8 Birthday Candle Celebration
    // ------------------------------------------------------------------------
    else if (t < 16.50) {
      pxRect(ctx, 0, 36, W, H - 36, '#140E0C');
      paint(ctx, ellPts(640, 420, 390, 280, 24), { wash: '#D97706', washOp: 55, ink: null });

      drawPartnerRig(ctx, 465, 650, 36, { t, view: 'front', smiling: true });
      drawNostalgicWhaleGirl(ctx, 815, 655, 36, { t, view: 'front', emotion: 'happy', hat: 'party', pose: 'heart' });

      // Two-tier Birthday Cake with 3 lit candles in center
      pxRect(ctx, 535, 595, 210, 16, '#E2E8F0');
      pxRect(ctx, 555, 515, 170, 80, '#FEF3C7');
      pxRect(ctx, 555, 515, 170, 22, '#FFFFFF');
      for (const cx of [595, 640, 685]) {
        pxRect(ctx, cx - 5, 465, 10, 50, '#FB7185');
        pxRect(ctx, cx - 7, 442, 14, 22, '#FACC15');
      }
      // Timestamp `'05  3  8` in bottom right
      ctx.save();
      ctx.font = 'bold 28px "Silkscreen", monospace';
      ctx.fillStyle = '#F97316';
      ctx.fillText("'05  3  8", 1045, 625);
      ctx.restore();
    }

    // ------------------------------------------------------------------------
    // 4. 16.50s – 26.00s: Purple Smartphone Texts (`那个女孩传简讯给我`)
    // ------------------------------------------------------------------------
    else if (t < 26.00) {
      pxRect(ctx, 0, 36, W, H - 36, '#0F0B1A');
      if (t < 21.0) {
        // Looking over shoulder at glowing purple chat screen (`那个女孩`)
        drawBox(ctx, 680, 55, 420, 565, '#130D24', '#A855F7', '#3B0764');
        pxRect(ctx, 705, 80, 370, 44, '#581C87');
        ctx.save();
        ctx.font = 'bold 22px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
        ctx.fillStyle = '#F3E8FF';
        ctx.fillText('那个女孩', 845, 109);
        const texts = ['睡了吗？', '今天谢谢你送我回家', '下次再一起去看电影吧', '晚安呀~'];
        for (let i = 0; i < texts.length; i++) {
          pxRect(ctx, 715, 145 + i * 74, 310, 52, '#7E22CE');
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(texts[i], 732, 178 + i * 74);
        }
        ctx.restore();

        drawNostalgicWhaleGirl(ctx, 375, 690, 44, { t, view: 'front', emotion: 'shocked', tears: true });
      } else {
        // Close-up of WhaleGirl holding back tears (`那女孩传简讯给我`)
        paint(ctx, ellPts(640, 410, 360, 260, 24), { wash: '#312E81', washOp: 45, ink: null });
        drawNostalgicWhaleGirl(ctx, 640, 695, 48, { t, view: 'front', emotion: 'sad', tears: true });
      }
    }

    // ------------------------------------------------------------------------
    // 5. 26.00s – 32.00s: Living Room Sofa Silence (`不解释低着头沉默`)
    // ------------------------------------------------------------------------
    else if (t < 32.00) {
      drawLivingRoomSet(ctx, t);
      drawNostalgicWhaleGirl(ctx, 465, 535, 24, { t, view: 'side', emotion: 'sad' });
      drawPartnerRig(ctx, 795, 535, 24, { t, view: 'side', flip: true });
      ctx.save();
      ctx.font = 'bold 34px "Silkscreen", monospace';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText('...', 815, 345);
      ctx.restore();
    }

    // ------------------------------------------------------------------------
    // 6. 32.00s – 40.00s: RPG Choice Modal (`我该相信你很爱我 / 不愿意敷衍我`)
    // ------------------------------------------------------------------------
    else if (t < 40.00) {
      pxRect(ctx, 0, 36, W, H - 36, '#141122');
      drawNostalgicWhaleGirl(ctx, 330, 690, 44, { t, view: 'front', emotion: 'sad', tears: true });

      drawBox(ctx, 480, 150, 640, 210, '#1E142B', '#F59E0B', '#4C1D95');
      ctx.save();
      ctx.font = 'bold 24px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText('我该怎么想？', 515, 198);
      ctx.fillStyle = '#FACC15';
      ctx.fillText('> 相信：他很爱我，不会敷衍我', 515, 255);
      ctx.fillStyle = t >= 38.0 ? '#EF4444' : '#64748B';
      ctx.fillText('  明白：你已不想挽回什么', 515, 312);
      ctx.restore();
    }

    // ------------------------------------------------------------------------
    // 7. 40.00s – 47.50s: Widening Sofa Distance (`你已不想挽回什么`)
    // ------------------------------------------------------------------------
    else if (t < 47.50) {
      drawLivingRoomSet(ctx, t);
      const sep = easeOut(seg(t, 40.0, 46.5)) * 75;
      drawNostalgicWhaleGirl(ctx, 460 - sep, 535, 24, { t, view: 'side', flip: true, emotion: 'cry', tears: true });
      drawPartnerRig(ctx, 790 + sep, 535, 24, { t, view: 'side' });
    }

    // ------------------------------------------------------------------------
    // 8. 47.50s – 54.50s: Question Mark & Broken Heart (`想问为什么 / 我不再是你的快乐`)
    // ------------------------------------------------------------------------
    else if (t < 54.50) {
      if (t < 50.2) {
        pxRect(ctx, 0, 36, W, H - 36, '#120E1E');
        drawNostalgicWhaleGirl(ctx, 480, 690, 46, { t, view: 'side', emotion: 'sad', tears: true });
        ctx.save();
        ctx.font = 'bold 130px "ZCOOLKuaiLe", sans-serif';
        ctx.fillStyle = '#FACC15';
        ctx.fillText('？', 845, 265);
        ctx.restore();
      } else {
        drawLivingRoomSet(ctx, t);
        drawNostalgicWhaleGirl(ctx, 450, 535, 24, { t, view: 'front', emotion: 'cry', tears: true });
        paint(ctx, heartPts(640, 295, 28), { wash: '#F43F5E', ink: '#881337', sw: 2 });
        pxRect(ctx, 636, 265, 6, 60, '#1A162B'); // Crack down center of heart
      }
    }

    // ------------------------------------------------------------------------
    // 9. 54.50s – 60.80s: Split-Face Bitter Smile (`却苦笑说我都懂了`)
    // ------------------------------------------------------------------------
    else if (t < 60.80) {
      pxRect(ctx, 0, 36, W, H - 36, '#141829');
      drawNostalgicWhaleGirl(ctx, 640, 695, 48, {
        t,
        view: 'front',
        emotion: 'happy',
        splitMask: true
      });
      ctx.save();
      ctx.font = 'bold 28px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.fillText('苦笑', 380, 220);
      ctx.fillStyle = '#38BDF8';
      ctx.fillText('心碎', 840, 220);
      ctx.restore();
    }

    // ------------------------------------------------------------------------
    // 10. 60.80s – 67.80s: Glowing Blue Neon Labyrinth Maze (`把爱都走曲折`)
    // ------------------------------------------------------------------------
    else if (t < 67.80) {
      pxRect(ctx, 0, 36, W, H - 36, '#090D1A');
      // Full-screen glowing cyan/blue 2D labyrinth maze walls
      ctx.save();
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 8;
      ctx.strokeRect(100, 68, 1080, 540);
      for (let col = 0; col < 9; col++) {
        for (let row = 0; row < 5; row++) {
          const gx = 100 + col * 120;
          const gy = 68 + row * 108;
          ctx.beginPath();
          if ((col * 7 + row * 13) % 2 === 0) {
            ctx.moveTo(gx, gy); ctx.lineTo(gx + 120, gy);
          } else {
            ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + 108);
          }
          ctx.stroke();
        }
      }
      ctx.restore();
      // WhaleGirl & Partner trying to find each other inside the maze!
      const mx = 340 + Math.sin(t * 2.2) * 90;
      drawNostalgicWhaleGirl(ctx, mx, 395, 18, { t, view: 'front', emotion: 'panic', walk: t * 8 });
      drawPartnerRig(ctx, 920 - Math.cos(t * 2.2) * 90, 515, 18, { t, view: 'front', walk: true });
    }

    // ------------------------------------------------------------------------
    // 11. 67.80s – 75.80s: Stark White/Pink Spotlight (`真相太赤裸裸 / 狼狈比失去难受`)
    // ------------------------------------------------------------------------
    else if (t < 75.80) {
      pxRect(ctx, 0, 36, W, H - 36, '#FCE7F3');
      // Red stamp box `[赤裸裸]`
      drawBox(ctx, 780, 175, 195, 76, '#FFF1F2', '#E11D48', '#BE123C');
      ctx.save();
      ctx.font = 'bold 46px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#E11D48';
      ctx.fillText('赤裸裸', 877, 228);
      ctx.restore();

      drawNostalgicWhaleGirl(ctx, 520, 685, 42, { t, view: 'front', emotion: 'cry', tears: true });
    }

    // ------------------------------------------------------------------------
    // 12. 75.80s – 82.80s: Chorus 1 — Sunny Rooftop Endless Chatter (`是无话不说`)
    // ------------------------------------------------------------------------
    else if (t < 82.80) {
      // Warm sunset rooftop overlooking city skyline
      pxRect(ctx, 0, 36, W, 420, '#FDBA74');
      pxRect(ctx, 0, 220, W, 240, '#FED7AA');
      for (let b = 0; b < 9; b++) {
        pxRect(ctx, b * 145, 310 + (b % 3) * 30, 125, 160, '#9A3412');
      }
      pxRect(ctx, 0, 455, W, H - 455, '#78350F');

      drawPartnerRig(ctx, 510, 565, 28, { t, view: 'side', smiling: true });
      drawNostalgicWhaleGirl(ctx, 770, 570, 28, { t, view: 'side', flip: true, emotion: 'happy', pose: 'wave', waveArm: true });

      // Joyful chatter bubbles popping above them
      drawBox(ctx, 290, 255, 220, 62, '#FFFFFF', '#78350F', '#FDE68A');
      drawBox(ctx, 730, 235, 235, 62, '#FFFFFF', '#78350F', '#FDE68A');
      ctx.save();
      ctx.font = 'bold 20px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
      ctx.fillStyle = '#451A03';
      ctx.fillText('今天超开心的！', 315, 292);
      ctx.fillText('以后还要一起看海！', 752, 272);
      ctx.restore();
    }

    // ------------------------------------------------------------------------
    // 13. 82.80s – 89.80s: Memory Album Book (`是争吵以后 / 还是想要爱你的冲动`)
    // ------------------------------------------------------------------------
    else if (t < 89.80) {
      drawMemoryBookSet(ctx, t, '争吵以后', '2005 · 初秋', 3);
    }

    // ------------------------------------------------------------------------
    // 14. 89.80s – 93.80s: Birthday Bunting & Cake (`我记得那年生日`)
    // ------------------------------------------------------------------------
    else if (t < 93.80) {
      pxRect(ctx, 0, 36, W, H - 36, '#1C120C');
      // Colorful triangular party bunting across top
      const bCols = ['#EF4444', '#FACC15', '#38BDF8', '#4ADE80', '#F472B6'];
      for (let i = 0; i < 16; i++) {
        ctx.fillStyle = bCols[i % bCols.length];
        ctx.beginPath();
        ctx.moveTo(140 + i * 62, 65);
        ctx.lineTo(171 + i * 62, 110);
        ctx.lineTo(202 + i * 62, 65);
        ctx.closePath();
        ctx.fill();
      }
      ctx.save();
      ctx.font = 'bold 28px "Silkscreen", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FDE047';
      ctx.fillText('HAPPY BIRTHDAY', 640, 148);
      ctx.restore();

      drawNostalgicWhaleGirl(ctx, 640, 675, 42, { t, view: 'front', emotion: 'happy', hat: 'party', pose: 'heart' });
    }

    // ------------------------------------------------------------------------
    // 15. 93.80s – 102.00s: Sharing White Wired Earphones (`也记得那一首歌 / 最紧的右手`)
    // ------------------------------------------------------------------------
    else if (t < 102.00) {
      pxRect(ctx, 0, 36, W, H - 36, '#1E162B');
      for (let s = 0; s < 35; s++) {
        pxRect(ctx, (s * 97) % W, 55 + ((s * 61) % 520), 3, 3, '#FDE047');
      }
      drawPartnerRig(ctx, 445, 685, 44, { t, view: 'side', smiling: true });
      drawNostalgicWhaleGirl(ctx, 835, 690, 44, {
        t,
        view: 'side',
        flip: true,
        emotion: 'love',
        earphone: true,
        emote: 'music'
      });
      // Shared white earphone cable connecting them in a heart-shaped loop!
      ctx.save();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(465, 430);
      ctx.bezierCurveTo(540, 595, 740, 595, 815, 430);
      ctx.stroke();
      ctx.restore();
    }

    // ------------------------------------------------------------------------
    // 16. 102.00s – 109.00s: Split Screen `谁记得` & Memory Album `谁忘了`
    // ------------------------------------------------------------------------
    else if (t < 109.00) {
      if (t < 105.8) {
        pxRect(ctx, 0, 36, 640, H - 36, '#3B1D14');
        pxRect(ctx, 640, 36, 640, H - 36, '#0F172A');
        pxRect(ctx, 637, 36, 6, H - 36, '#F8FAFC');
        drawNostalgicWhaleGirl(ctx, 320, 675, 40, { t, view: 'front', emotion: 'sad' });
        drawPartnerRig(ctx, 960, 675, 40, { t, view: 'front' });
      } else {
        drawMemoryBookSet(ctx, t, '最暖的胸口', '2006 · 初冬', 7);
      }
    }

    // ------------------------------------------------------------------------
    // 17. 109.00s – 131.80s: Rainy Neon Street & Smartphone Chat (`我不再是你的快乐`)
    // ------------------------------------------------------------------------
    else if (t < 131.80) {
      if (t >= 124.5 && t < 129.0) {
        pxRect(ctx, 0, 36, W, H - 36, '#0B0914');
        drawBox(ctx, 430, 55, 420, 565, '#130F24', '#64748B', '#1E293B');
        const replies = ['在忙，先不说了', '今天加班，你自己吃吧', '早点睡'];
        ctx.save();
        ctx.font = 'bold 20px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
        for (let i = 0; i < replies.length; i++) {
          pxRect(ctx, 565, 115 + i * 85, 255, 52, '#EA580C');
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(replies[i], 582, 148 + i * 85);
        }
        ctx.fillStyle = '#94A3B8';
        ctx.fillText('可是为什么 |', 460, 575);
        ctx.restore();
        drawNostalgicWhaleGirl(ctx, 225, 665, 32, { t, view: 'side', emotion: 'cry', tears: true });
      } else {
        drawNeonStreetSet(ctx, t, true);
        drawNostalgicWhaleGirl(ctx, 440, 565, 26, { t, view: 'side', emotion: 'cry', tears: true });
        drawPartnerRig(ctx, 840, 565, 26, { t, view: 'side' });
      }
    }

    // ------------------------------------------------------------------------
    // 18. 131.80s – 137.80s: Heavy Iron Chains Labeled `自尊` (`自尊常常将人拖着`)
    // ------------------------------------------------------------------------
    else if (t < 137.80) {
      drawNeonStreetSet(ctx, t, false);
      // Heavy iron weights labeled `自尊` pulling both characters apart!
      drawBox(ctx, 130, 435, 110, 95, '#1E293B', '#94A3B8', '#334155');
      drawBox(ctx, 1040, 435, 110, 95, '#1E293B', '#94A3B8', '#334155');
      ctx.save();
      ctx.font = 'bold 30px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#F8FAFC';
      ctx.fillText('自尊', 185, 492);
      ctx.fillText('自尊', 1095, 492);
      ctx.restore();

      drawNostalgicWhaleGirl(ctx, 430, 565, 26, { t, view: 'side', emotion: 'sad', walk: t * 6 });
      drawPartnerRig(ctx, 850, 565, 26, { t, view: 'side', flip: true, walk: true });
    }

    // ------------------------------------------------------------------------
    // 19. 137.80s – 145.80s: White Smiling Mask & `[玩家状态：狼狈]` (`狼狈比失去难受`)
    // ------------------------------------------------------------------------
    else if (t < 145.80) {
      if (t < 142.8) {
        pxRect(ctx, 0, 36, W, H - 36, '#0F1322');
        const maskProg = seg(t, 137.8, 141.0);
        drawNostalgicWhaleGirl(ctx, 640, 690, 48, {
          t,
          view: 'front',
          emotion: 'cry',
          tears: true,
          whiteMask: maskProg
        });
      } else {
        drawNeonStreetSet(ctx, t, true);
        drawNostalgicWhaleGirl(ctx, 640, 575, 28, { t, view: 'front', emotion: 'cry', tears: true, sq: -0.15 });
        // Top RPG Danger Alert `[玩家状态：狼狈] 生命值即将清零`
        drawBox(ctx, 290, 62, 700, 74, '#450A0A', '#EF4444', '#7F1D1D');
        ctx.save();
        ctx.font = 'bold 26px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
        ctx.fillStyle = '#FCA5A5';
        ctx.fillText('玩家状态：狼狈  |  生命值比失去更难受', 345, 108);
        ctx.restore();
      }
    }

    // ------------------------------------------------------------------------
    // 20. 145.80s – 159.80s: Chorus 2 — Dream House Cloud & `冲动 99%` Bar
    // ------------------------------------------------------------------------
    else if (t < 159.80) {
      if (t < 153.5) {
        // Starry green hill with giant cloud thought bubble containing a cozy home!
        pxRect(ctx, 0, 36, W, 470, '#141824');
        pxRect(ctx, 0, 506, W, H - 506, '#14532D');
        paint(ctx, ellPts(640, 255, 280, 175, 24), { wash: '#F8FAFC', ink: '#CBD5E1', sw: 4 });
        // Little red-roof house inside cloud bubble
        pxRect(ctx, 560, 215, 140, 95, '#FEF3C7');
        ctx.fillStyle = '#DC2626';
        ctx.beginPath();
        ctx.moveTo(540, 215); ctx.lineTo(630, 145); ctx.lineTo(720, 215);
        ctx.closePath();
        ctx.fill();

        drawPartnerRig(ctx, 585, 555, 20, { t, view: 'front', smiling: true });
        drawNostalgicWhaleGirl(ctx, 695, 560, 20, { t, view: 'front', emotion: 'love', emote: 'heart' });
      } else {
        // `想要爱你的冲动 99%` progress bar
        pxRect(ctx, 0, 36, W, H - 36, '#1E1624');
        drawNostalgicWhaleGirl(ctx, 490, 690, 44, { t, view: 'front', emotion: 'love', tears: true });
        drawBox(ctx, 690, 175, 420, 88, '#130F24', '#F43F5E', '#3B0764');
        ctx.save();
        ctx.font = 'bold 22px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
        ctx.fillStyle = '#FDA4AF';
        ctx.fillText('想要爱你的冲动', 715, 210);
        pxRect(ctx, 715, 224, 330, 22, '#1E293B');
        pxRect(ctx, 715, 224, 322, 22, '#F43F5E');
        ctx.font = 'bold 20px "Silkscreen", monospace';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('99%', 1052, 242);
        ctx.restore();
      }
    }

    // ------------------------------------------------------------------------
    // 21. 159.80s – 176.80s: Birthday Wish (`许愿……`), Night Clouds & `无言感动`
    // ------------------------------------------------------------------------
    else if (t < 176.80) {
      if (t < 166.8) {
        pxRect(ctx, 0, 36, W, H - 36, '#140E0C');
        drawNostalgicWhaleGirl(ctx, 480, 680, 40, { t, view: 'front', emotion: 'calm' });
        pxRect(ctx, 780, 480, 210, 120, '#FEF3C7');
        pxRect(ctx, 880, 420, 10, 60, '#F43F5E');
        pxRect(ctx, 878, 398, 14, 22, '#FACC15');
        ctx.save();
        ctx.font = 'bold 28px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
        ctx.fillStyle = '#FDE68A';
        ctx.fillText('许愿……', 640, 185);
        ctx.restore();
      } else if (t < 172.5) {
        pxRect(ctx, 0, 36, W, 480, '#1C1917');
        pxRect(ctx, 0, 516, W, H - 516, '#14532D');
        for (let c = 0; c < 5; c++) {
          paint(ctx, ellPts(180 + c * 230, 195 + (c % 2) * 55, 85, 52, 16), { wash: '#57534E', ink: null });
        }
        drawNostalgicWhaleGirl(ctx, 640, 560, 24, { t, view: 'front', emotion: 'sad' });
      } else {
        drawMemoryBookSet(ctx, t, '无言感动', '？？？', 8);
      }
    }

    // ------------------------------------------------------------------------
    // 22. 176.80s – 183.80s: Exploding Red Thermometer (`爆表！ — 是绝对炽热`)
    // ------------------------------------------------------------------------
    else if (t < 183.80) {
      // Crimson sunburst rays + giant mercury thermometer bursting at 100°C!
      pxRect(ctx, 0, 36, W, H - 36, '#7F1D1D');
      ctx.save();
      ctx.translate(640, 380);
      for (let i = 0; i < 16; i++) {
        const a0 = (i / 16) * TAU + t * 0.8;
        const a1 = a0 + TAU / 32;
        ctx.fillStyle = i % 2 === 0 ? '#991B1B' : '#B91C1C';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a0) * 900, Math.sin(a0) * 900);
        ctx.lineTo(Math.cos(a1) * 900, Math.sin(a1) * 900);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // Center Mercury Thermometer
      pxRect(ctx, 608, 85, 64, 460, '#F8FAFC');
      paint(ctx, ellPts(640, 560, 62, 62, 20), { wash: '#F8FAFC', ink: '#EF4444', sw: 6 });
      paint(ctx, ellPts(640, 560, 46, 46, 18), { wash: '#EF4444', ink: null });
      const mercH = Math.round(lerp(180, 430, seg(t, 176.8, 180.0)));
      pxRect(ctx, 622, 540 - mercH, 36, mercH, '#EF4444');

      ctx.save();
      ctx.font = 'bold 52px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
      ctx.fillStyle = '#FDE047';
      ctx.fillText('爆表！', 745, 195);
      ctx.restore();

      drawNostalgicWhaleGirl(ctx, 310, 680, 38, { t, view: 'front', emotion: 'excited', emote: 'heart' });
    }

    // ------------------------------------------------------------------------
    // 23. 183.80s – 193.80s: Apology Embrace (`求我原谅抱得我都痛 / 也记得我颤抖着`)
    // ------------------------------------------------------------------------
    else if (t < 193.80) {
      pxRect(ctx, 0, 36, W, H - 36, '#1F1624');
      const tremor = t >= 190.5 ? Math.sin(t * 55) * 4 : 0;
      drawNostalgicWhaleGirl(ctx, 560 + tremor, 690, 46, {
        t,
        view: 'front',
        emotion: 'cry',
        tears: true
      });
      if (t < 188.5) {
        drawBox(ctx, 680, 210, 360, 115, '#2A1215', '#F43F5E', '#881337');
        ctx.save();
        ctx.font = 'bold 22px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
        ctx.fillStyle = '#FDA4AF';
        ctx.fillText('求我原谅：', 705, 248);
        ctx.fillStyle = '#FACC15';
        ctx.fillText('> 原谅    再抱紧一点', 705, 292);
        ctx.restore();
      }
    }

    // ------------------------------------------------------------------------
    // 24. 193.80s – 200.00s: Night Bridge Fireworks & `相拥 00:00:02` (`最美的烟火 / 最长的相拥`)
    // ------------------------------------------------------------------------
    else if (t < 200.00) {
      pxRect(ctx, 0, 36, W, 470, '#090D1A');
      pxRect(ctx, 0, 506, W, H - 506, '#0F172A');
      // Colorful pixel fireworks bursting in the night sky!
      const fwCenters = [[320, 180, '#FACC15'], [640, 140, '#F43F5E'], [960, 190, '#38BDF8']];
      for (const [fx, fy, fcol] of fwCenters) {
        const r = 25 + ((t * 75) % 85);
        for (let a = 0; a < 12; a++) {
          const ang = (a / 12) * TAU;
          pxRect(ctx, fx + Math.cos(ang) * r, fy + Math.sin(ang) * r, 6, 6, fcol);
        }
      }
      // Bridge railing
      pxRect(ctx, 0, 475, W, 8, '#475569');
      for (let gx = 40; gx < W; gx += 55) pxRect(ctx, gx, 435, 6, 70, '#334155');

      // Top center timer `相拥 00:00:02`
      drawBox(ctx, 480, 62, 320, 52, '#0F172A', '#64748B', '#1E293B');
      ctx.save();
      ctx.font = 'bold 24px "Silkscreen", "ZCOOLKuaiLe", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#F8FAFC';
      ctx.fillText('相拥  00:00:02', 640, 96);
      ctx.restore();

      // WhaleGirl & Partner embracing on the bridge
      drawPartnerRig(ctx, 615, 510, 22, { t, view: 'side', smiling: true });
      drawNostalgicWhaleGirl(ctx, 665, 515, 22, { t, view: 'side', flip: true, emotion: 'love', emote: 'heart' });
    }

    // ------------------------------------------------------------------------
    // 25. 200.00s – 205.80s: Perspective Highway `距离 318 M` (`谁过头太远了`)
    // ------------------------------------------------------------------------
    else if (t < 205.80) {
      pxRect(ctx, 0, 36, W, H - 36, '#0B0F19');
      // Perspective road converging to (640, 240)
      paint(ctx, [[320, 720], [595, 240], [685, 240], [960, 720]], { wash: '#1E293B', ink: '#475569', sw: 2 });
      for (let d = 0; d < 6; d++) {
        pxRect(ctx, 636, 265 + d * 72, 8, 38, '#FACC15');
      }
      const dist = Math.round(lerp(120, 318, seg(t, 200.0, 205.8)));
      ctx.save();
      ctx.font = 'bold 34px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#E2E8F0';
      ctx.fillText(`距离  ${dist} M`, 640, 115);
      ctx.restore();

      drawPartnerRig(ctx, 640, 310, 11, { t, view: 'back' });
      drawNostalgicWhaleGirl(ctx, 470, 655, 32, { t, view: 'side', emotion: 'sad' });
    }

    // ------------------------------------------------------------------------
    // 26. 205.80s – 212.80s: Two Pedestals `[心]` & `[承诺]` (`谁忘了那就是承诺`)
    // ------------------------------------------------------------------------
    else if (t < 212.80) {
      pxRect(ctx, 0, 36, W, H - 36, '#27272A');
      pxRect(ctx, 0, 495, W, H - 495, '#3F3F46');
      // Left pedestal (`心`) & Right pedestal (`承诺`)
      drawBox(ctx, 260, 395, 130, 110, '#52525B', '#A1A1AA', '#3F3F46');
      drawBox(ctx, 890, 395, 130, 110, '#2DD4BF', '#99F6E4', '#0D9488');
      paint(ctx, heartPts(325, 345, 24), { wash: '#F43F5E', ink: null });
      ctx.save();
      ctx.font = 'bold 28px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('心', 325, 458);
      ctx.fillText('承诺', 955, 458);
      ctx.restore();

      drawNostalgicWhaleGirl(ctx, 640, 565, 28, { t, view: 'front', emotion: 'sad' });
    }

    // ------------------------------------------------------------------------
    // 27. 212.80s – 219.80s: Neon Street Walking Past Each Other (`谁自顾自地走`)
    // ------------------------------------------------------------------------
    else if (t < 219.80) {
      drawNeonStreetSet(ctx, t, false);
      const off = (t - 212.8) * 35;
      drawNostalgicWhaleGirl(ctx, 460 - off, 565, 26, { t, view: 'side', flip: true, emotion: 'sad', walk: t * 7 });
      drawPartnerRig(ctx, 720 + off, 565, 26, { t, view: 'side', walk: true });
    }

    // ------------------------------------------------------------------------
    // 28. 219.80s – 223.80s: Giant `爱 9999 KG` Block Crushing Seesaw (`谁让爱变沉重`)
    // ------------------------------------------------------------------------
    else if (t < 223.80) {
      pxRect(ctx, 0, 36, W, H - 36, '#0F1322');
      // Giant heavy stone block `爱 9999 KG` pressing down on the scale/table!
      drawBox(ctx, 380, 295, 520, 145, '#334155', '#94A3B8', '#475569');
      ctx.save();
      ctx.font = 'bold 54px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#F8FAFC';
      ctx.fillText('爱', 640, 365);
      ctx.font = 'bold 22px "Silkscreen", monospace';
      ctx.fillStyle = '#CBD5E1';
      ctx.fillText('9999 KG', 640, 412);
      ctx.restore();

      drawNostalgicWhaleGirl(ctx, 480, 585, 22, { t, view: 'front', emotion: 'panic', sq: -0.22 });
      drawPartnerRig(ctx, 800, 585, 22, { t, view: 'front' });
    }

    // ------------------------------------------------------------------------
    // 29. 223.80s – 230.00s: Red Strikethrough `[温柔]` (`谁忘了要给你温柔`)
    // ------------------------------------------------------------------------
    else if (t < 230.00) {
      pxRect(ctx, 0, 36, W, H - 36, '#17152B');
      drawNostalgicWhaleGirl(ctx, 640, 690, 46, { t, view: 'front', emotion: 'cry', tears: true });
      drawBox(ctx, 510, 465, 260, 68, '#1E1B4B', '#EF4444', '#312E81');
      ctx.save();
      ctx.font = 'bold 34px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FDE047';
      ctx.fillText('给你温柔', 640, 508);
      pxRect(ctx, 525, 498, 230, 6, '#EF4444');
      ctx.restore();
    }

    // ------------------------------------------------------------------------
    // 30. 230.00s – 238.00s: Climbing the 5-Floor Stairwell (`3F -> 4F -> 5F -> RF ↑`)
    // ------------------------------------------------------------------------
    else if (t < 238.00) {
      pxRect(ctx, 0, 36, W, H - 36, '#0F1322');
      const floors = ['3F', '4F', '5F'];
      ctx.save();
      ctx.font = 'bold 34px "Silkscreen", monospace';
      ctx.fillStyle = '#94A3B8';
      for (let i = 0; i < 3; i++) {
        const fy = 555 - i * 185;
        pxRect(ctx, 120, fy, 1040, 10, '#334155');
        ctx.fillText(floors[i], 145, fy - 24);
      }
      ctx.fillStyle = '#FACC15';
      ctx.fillText('RF ^', 1055, 115);
      ctx.restore();

      const climbP = seg(t, 230.0, 237.8);
      const wx = lerp(320, 960, climbP);
      const wy = lerp(545, 175, climbP);
      drawNostalgicWhaleGirl(ctx, wx, wy, 18, { t, view: 'side', emotion: 'determined', walk: t * 12 });
    }

    // ------------------------------------------------------------------------
    // 31. 238.00s – 257.80s: Starry Rooftop & Constellations (`我记得那年生日 / 那一首歌`)
    // ------------------------------------------------------------------------
    else if (t < 257.80) {
      pxRect(ctx, 0, 36, W, 460, '#090D1A');
      pxRect(ctx, 0, 496, W, H - 496, '#111827');
      // Starfield
      for (let s = 0; s < 65; s++) {
        pxRect(ctx, (s * 83) % W, 48 + ((s * 59) % 380), 3, 3, s % 4 === 0 ? '#FDE047' : '#E2E8F0');
      }
      // Rooftop railing
      pxRect(ctx, 0, 455, W, 6, '#334155');
      for (let gx = 30; gx < W; gx += 50) pxRect(ctx, gx, 420, 6, 76, '#1E293B');

      // Star Constellations & Golden Memory Circle in Sky (245.5s .. 257.8s)
      if (t >= 245.0) {
        ctx.save();
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.65)';
        ctx.lineWidth = 2;
        const pts = [[320, 140], [380, 110], [450, 155], [410, 220], [335, 205], [320, 140]];
        ctx.beginPath();
        pts.forEach(([px, py], idx) => idx === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py));
        ctx.stroke();
        ctx.restore();

        // Golden Memory Medallion on top-right
        paint(ctx, ellPts(980, 195, 110, 110, 24), { wash: '#78350F', ink: '#FACC15', sw: 4 });
        drawPartnerRig(ctx, 945, 275, 16, { t, view: 'front', smiling: true, noShadow: true });
        drawNostalgicWhaleGirl(ctx, 1015, 280, 16, { t, view: 'front', emotion: 'happy', hat: 'party' });
      }

      drawNostalgicWhaleGirl(ctx, 640, 520, 22, { t, view: 'back', emotion: 'calm' });
    }

    // ------------------------------------------------------------------------
    // 32. 257.80s – 263.80s: Releasing the Golden Star Firefly (`我放手 / 我让座`)
    // ------------------------------------------------------------------------
    else if (t < 263.80) {
      pxRect(ctx, 0, 36, W, H - 36, '#0B1021');
      for (let s = 0; s < 50; s++) {
        pxRect(ctx, (s * 97) % W, 50 + ((s * 61) % 520), 3, 3, '#E2E8F0');
      }
      // Outstretched hand & sleeve releasing a glowing golden star orb into the night sky
      pxRect(ctx, 780, 445, 500, 95, '#EA580C');
      pxRect(ctx, 520, 455, 265, 52, '#F7C9B6');
      const starY = lerp(360, 165, seg(t, 257.8, 263.8));
      paint(ctx, ellPts(560, starY, 48, 48, 20), { wash: '#FACC15', washOp: 85, ink: null });
      paint(ctx, starPts(560, starY, 22, 9, 5), { wash: '#FEF08A', ink: null });

      drawNostalgicWhaleGirl(ctx, 260, 665, 36, { t, view: 'side', emotion: 'calm' });
    }

    // ------------------------------------------------------------------------
    // 33. 263.80s – 266.80s: Peace Sign & `[洒脱]` Stamp (`假洒脱`)
    // ------------------------------------------------------------------------
    else if (t < 266.80) {
      // Warm dawn sky
      pxRect(ctx, 0, 36, W, 340, '#C084FC');
      pxRect(ctx, 0, 376, W, H - 376, '#FDBA74');

      drawNostalgicWhaleGirl(ctx, 640, 695, 48, {
        t,
        view: 'front',
        emotion: 'happy',
        pose: 'wave',
        waveArm: true
      });
      // Red stamp `[洒脱]`
      drawBox(ctx, 845, 115, 145, 68, '#FEF2F2', '#DC2626', '#991B1B');
      ctx.save();
      ctx.font = 'bold 42px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#DC2626';
      ctx.fillText('洒脱', 917, 162);
      ctx.restore();
    }

    // ------------------------------------------------------------------------
    // 34. 266.80s – 277.50s: Dawn Horizon & Sunrise Skyline (`谁懂我多么不舍得 / 太爱了 / 所以我`)
    // ------------------------------------------------------------------------
    else if (t < 277.50) {
      pxRect(ctx, 0, 36, W, 240, '#6366F1');
      pxRect(ctx, 0, 276, W, 220, '#FDBA74');
      pxRect(ctx, 0, 496, W, H - 496, '#1E293B');
      if (t >= 273.5) {
        // City skyline silhouettes at sunrise + WhaleGirl looking out from foreground
        for (let b = 0; b < 11; b++) {
          const bh = 120 + (b * 37) % 140;
          pxRect(ctx, b * 120, 520 - bh, 95, bh + 120, '#3B82F6');
        }
        drawNostalgicWhaleGirl(ctx, 640, 695, 46, { t, view: 'back', emotion: 'calm' });
      } else {
        drawNostalgicWhaleGirl(ctx, 640, 520, 18, { t, view: 'side', emotion: 'sad' });
      }
    }

    // ------------------------------------------------------------------------
    // 35. 277.50s – 288.40s: Black Censor Bar (`没有哭 / 没有说`) & `THE END`
    // ------------------------------------------------------------------------
    else {
      if (t < 284.6) {
        pxRect(ctx, 0, 36, W, 320, '#A855F7');
        pxRect(ctx, 0, 356, W, H - 356, '#FDBA74');
        drawNostalgicWhaleGirl(ctx, 640, 695, 48, {
          t,
          view: 'front',
          emotion: 'happy',
          censorBar: true
        });
      } else {
        pxRect(ctx, 0, 0, W, H, '#09060E');
        ctx.save();
        ctx.font = 'bold 46px "Silkscreen", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#E2E8F0';
        ctx.fillText('THE END', 640, 360);
        ctx.restore();
      }
    }

    // ========================================================================
    // Top HUD & Bottom Subtitle Bar (Synced 1:1 with `每天每天的抖音 - 抖音.mp4`)
    // ========================================================================
    drawTopMemoryHUD(ctx, t);

    const sub = getSubtitleAt(t);
    if (sub && sub.zh && t < 284.6) {
      drawBox(ctx, 365, 644, 550, 50, 'rgba(13, 11, 24, 0.88)', '#A16207', '#2E1F38');
      const pop = backOut(seg(t, sub.t0, sub.t0 + 0.18));
      ctx.save();
      ctx.translate(640, 669);
      ctx.scale(0.94 + 0.06 * pop, 0.94 + 0.06 * pop);
      ctx.font = 'bold 28px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#09060E';
      ctx.fillText(sub.zh, 2, 2);
      ctx.fillStyle = '#F8FAFC';
      ctx.fillText(sub.zh, 0, 0);
      ctx.restore();
    }

    ctx.restore();
  }

  const MV_DOUYIN_1 = {
    DURATION: DURATION_MV1,
    SUBTITLES: SUBTITLES_MV1,
    renderDouyin1Frame,
    drawNostalgicWhaleGirl,
    drawPartnerRig
  };

  root.MV_DOUYIN_1 = MV_DOUYIN_1;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MV_DOUYIN_1;
  }
})(typeof window !== 'undefined' ? window : globalThis);
