// ============================================================================
// src/mv_douyin_3.js — #03 《天黑黑》(孙燕姿 · 深海鲸鱼娘篇) Full 230.40s MV Director
// Replicated from `每天每天的抖音 - 抖音_3.mp4` (230.40s, 30fps, 1280x720)
// Protagonist: `whaleGirl` (`src/whale_girl.js` 7-bone articulated rig) +
//              `drawGrandmaRig` (外婆 — 104x102 silver-haired grandma with straw fan)
// Audio & Beat Sync: `assets/douyin_3.mp3` + `assets/douyin_3_audio.js` (66 BPM)
// Visual Style: Neon Metropolis vs Pastoral Courtyard Contrast (`neon`)
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

  const DURATION_MV3 = 230.40;

  // ==========================================================================
  // Exact Subtitle Beat-Sync Table from `每天每天的抖音 - 抖音_3.mp4`
  // ==========================================================================
  const SUBTITLES_MV3 = [
    { t0: 12.8,  t1: 17.8,  zh: '我的小时候 吵闹任性的时候', bg: 'paper' },
    { t0: 17.8,  t1: 22.0,  zh: '我的外婆 总会唱歌哄我',     bg: 'paper' },
    { t0: 22.0,  t1: 26.8,  zh: '夏天的午后 姥姥的歌安慰我', bg: 'paper' },
    { t0: 26.8,  t1: 32.0,  zh: '那首歌 好像这样唱的',       bg: 'paper' },
    { t0: 32.5,  t1: 39.5,  zh: '♪ 天黑黑 欲落雨 ♪',        bg: 'gold' },
    { t0: 39.5,  t1: 44.5,  zh: '♪ 天黑黑 黑黑 ♪',          bg: 'gold' },
    { t0: 48.0,  t1: 52.8,  zh: '离开小时候 有了自己的生活', bg: 'dark' },
    { t0: 52.8,  t1: 57.0,  zh: '新鲜的歌 新鲜的念头',       bg: 'dark' },
    { t0: 57.0,  t1: 61.0,  zh: '任性和冲动 无法控制的时候', bg: 'dark' },
    { t0: 61.5,  t1: 66.5,  zh: '我忘记 还有这样的歌',       bg: 'dark' },
    { t0: 66.5,  t1: 73.5,  zh: '♪ 天黑黑 欲落雨 ♪',        bg: 'gold' },
    { t0: 73.5,  t1: 79.5,  zh: '♪ 天黑黑 黑黑 ♪',          bg: 'gold' },
    { t0: 79.8,  t1: 84.0,  zh: '我爱上让我奋不顾身的一个人', bg: 'dark' },
    { t0: 84.0,  t1: 88.8,  zh: '我以为这就是我所追求的世界', bg: 'dark' },
    { t0: 88.8,  t1: 93.0,  zh: '然而横冲直撞 被误解被骗',   bg: 'dark' },
    { t0: 93.0,  t1: 96.8,  zh: '是否成人的世界背后 总有残缺', bg: 'dark' },
    { t0: 96.8,  t1: 101.8, zh: '我走在每天必须面对的分岔路', bg: 'dark' },
    { t0: 101.8, t1: 105.8, zh: '我怀念过去单纯美好的小幸福', bg: 'dark' },
    { t0: 105.8, t1: 110.5, zh: '爱总是让人哭 让人觉得不满足', bg: 'dark' },
    { t0: 110.5, t1: 116.0, zh: '天空很大却看不清楚 好孤独', bg: 'dark' },
    { t0: 133.0, t1: 138.0, zh: '我爱上让我奋不顾身的一个人', bg: 'dark' },
    { t0: 138.0, t1: 143.0, zh: '我以为这就是我所追求的世界', bg: 'dark' },
    { t0: 143.0, t1: 147.0, zh: '然而横冲直撞 被误解被骗',   bg: 'dark' },
    { t0: 147.0, t1: 151.8, zh: '是否成人的世界背后 总有残缺', bg: 'dark' },
    { t0: 151.8, t1: 155.8, zh: '我走在每天必须面对的分岔路', bg: 'dark' },
    { t0: 155.8, t1: 160.8, zh: '我怀念过去单纯美好的小幸福', bg: 'paper' },
    { t0: 160.8, t1: 165.2, zh: '爱总是让人哭 让人觉得不满足', bg: 'dark' },
    { t0: 165.2, t1: 170.0, zh: '天空很大却看不清楚 好孤独', bg: 'dark' },
    { t0: 173.0, t1: 178.5, zh: '天黑的时候 我又想起那首歌', bg: 'dark' },
    { t0: 178.5, t1: 183.0, zh: '突然期待 下起安静的雨',     bg: 'dark' },
    { t0: 183.0, t1: 188.0, zh: '原来外婆的道理 早就唱给我听', bg: 'dark' },
    { t0: 188.0, t1: 192.0, zh: '下起雨 也要勇敢前进',       bg: 'dark' },
    { t0: 192.0, t1: 197.5, zh: '我相信 一切都会平息',       bg: 'dark' },
    { t0: 197.5, t1: 202.0, zh: '我现在 好想回家去',         bg: 'dark' },
    { t0: 206.0, t1: 212.5, zh: '♪ 天黑黑 欲落雨 ♪',        bg: 'gold' },
    { t0: 212.5, t1: 217.5, zh: '♪ 天黑黑 黑黑 ♪',          bg: 'gold' },
    { t0: 225.5, t1: 230.2, zh: '天亮了。',                   bg: 'dark' }
  ];

  function getSubtitleAt(t) {
    for (let i = 0; i < SUBTITLES_MV3.length; i++) {
      const s = SUBTITLES_MV3[i];
      if (t >= s.t0 && t < s.t1) return s;
    }
    return null;
  }

  function pxRect(ctx, x, y, w, h, col) {
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function drawNeonBox(ctx, x, y, w, h, bg = '#0B0F1D', border = '#00F5D4', inner = '#1E293B') {
    pxRect(ctx, x - 3, y - 3, w + 6, h + 6, '#04060C');
    pxRect(ctx, x - 2, y - 2, w + 4, h + 4, border);
    pxRect(ctx, x, y, w, h, inner);
    pxRect(ctx, x + 2, y + 2, w - 4, h - 4, bg);
  }

  // ==========================================================================
  // Protagonist: `drawNeonWhaleGirl` (`src/whale_girl.js` in `neon` style)
  // ==========================================================================
  function drawNeonWhaleGirl(ctx, x, y, u, opts = {}) {
    const t = opts.t || 0;
    const view = opts.view || 'front';
    const emo = opts.emotion || 'happy';
    const bp = beatPulse(t);
    const dy = (opts.dy || 0) - bp * 0.05;

    whaleGirl(ctx, x, y, u, Object.assign({}, feel(emo, t), opts, {
      view,
      style: 'neon',
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

    if (opts.childBun && view !== 'back') {
      p(-5, -91, 10, 7, '#1B428A');
      p(-4, -84, 8,  2, '#EF4444');
    }

    if (opts.tears && view !== 'back') {
      const td = Math.floor((t * 8) % 5);
      p(-8, -56, 2, 6, '#38BDF8');
      p(6,  -56, 2, 6, '#38BDF8');
      p(-8, -50 + td, 2, 2, '#E0F2FE');
      p(6,  -50 + td, 2, 2, '#E0F2FE');
    }

    ctx.restore();
  }

  // ==========================================================================
  // Supporting Character: `drawGrandmaRig` (外婆 — Silver Bun + Woven Straw Fan)
  // Built on the 104x102 7-bone pixel-grid anatomy with silver-grey hair &
  // warm brown/amber traditional tunic + animated woven straw fan (`蒲扇`)!
  // ==========================================================================
  const _grandmaPalCache = {};
  function getGrandmaPalettes(basePal) {
    if (_grandmaPalCache.headPal) return _grandmaPalCache;
    // Silver-grey hair & warm kindly skin
    _grandmaPalCache.headPal = basePal.map((hex) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      if (r >= b - 10) return hex;
      if (lum < 0.25) return '#334155';
      if (lum < 0.42) return '#64748B';
      if (lum < 0.60) return '#94A3B8';
      if (lum < 0.78) return '#CBD5E1';
      return '#F1F5F9';
    });
    // Warm chestnut/linen traditional vest & tunic
    _grandmaPalCache.torsoPal = basePal.map((hex) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      if (r > b + 20 && lum > 0.65) return hex;
      if (lum < 0.25) return '#451A03';
      if (lum < 0.45) return '#78350F';
      if (lum < 0.65) return '#92400E';
      if (lum < 0.82) return '#D97706';
      return '#FDE68A';
    });
    return _grandmaPalCache;
  }

  function drawGrandmaRig(ctx, x, y, u = 28, opts = {}) {
    const t = opts.t || 0;
    const rig = root.WHALE_GIRL_PIXEL_RIG || (typeof require === 'function' ? require('./whale_girl_rig_data.js') : null);
    if (!rig) return;

    const view = opts.view || 'front';
    const cell = u / rig.scale;
    const headBob = Math.sin(t * 2.2) * 0.04 * u;
    const isTurnView = (view && view !== 'front' && rig.views && rig.views[view]);
    const poseBones = isTurnView ? rig.views[view] : rig.poses.heart;
    const { headPal, torsoPal } = getGrandmaPalettes(rig.palette);

    if (!opts.noShadow) {
      paint(ctx, ellPts(x, y + 0.10 * u, 2.1 * u, 0.40 * u, 14), { wash: '#090D16', washOp: 65, ink: null });
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

    const p = (gx, gy, gw, gh, col) => {
      ctx.fillStyle = col;
      ctx.fillRect((gx - 0.5) * cell, (gy - 0.5) * cell, gw * cell + 0.4, gh * cell + 0.4);
    };

    drawRuns(poseBones.legL, headPal);
    drawRuns(poseBones.legR, headPal);

    ctx.save();
    ctx.translate(0, headBob);
    drawRuns(poseBones.torso, torsoPal);
    drawRuns(poseBones.head, headPal);
    // Silver hair bun on top of Grandma's head
    p(-6, -92, 12, 8, '#CBD5E1');
    p(-5, -91, 10, 6, '#F1F5F9');
    p(-6, -84, 12, 2, '#78350F');

    // Woven Straw Fan (`蒲扇`) swaying gently in Grandma's hand!
    const fanRot = Math.sin(t * 4.5) * 0.18;
    ctx.save();
    ctx.translate(-18 * cell, -34 * cell);
    ctx.rotate(fanRot);
    paint(ctx, ellPts(0, -6 * cell, 11 * cell, 10 * cell, 14), { wash: '#FDE047', ink: '#A16207', sw: 2 });
    pxRect(ctx, -1.5 * cell, 2 * cell, 3 * cell, 8 * cell, '#78350F');
    ctx.restore();

    ctx.restore();
    ctx.restore();
  }

  // ==========================================================================
  // Top Distance & Heart Status Bar (`离家 000 KM / 318 KM` + `♥♥♥`)
  // ==========================================================================
  function drawTopSkyHUD(ctx, t) {
    pxRect(ctx, 0, 0, W, 34, '#060810');
    pxRect(ctx, 0, 34, W, 2, '#1E293B');

    const isChildhood = (t >= 11.5 && t < 48.0) || (t >= 155.5 && t < 160.8) || (t >= 205.0);
    const distStr = isChildhood ? '000 KM' : (t >= 172.0 && t < 188.0 ? '??? KM' : '318 KM');

    ctx.save();
    // Sun or Moon icon on top-right
    if (isChildhood) {
      paint(ctx, ellPts(1132, 17, 7, 7, 10), { wash: '#FACC15', ink: null });
    } else {
      paint(ctx, ellPts(1132, 17, 7, 7, 10), { wash: '#E2E8F0', ink: null });
    }
    ctx.font = 'bold 15px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('离家', 1148, 22);
    ctx.font = 'bold 17px "Silkscreen", monospace';
    ctx.fillStyle = isChildhood ? '#4ADE80' : '#38BDF8';
    ctx.fillText(distStr, 1185, 22);

    // 3 Heart HP Icons during Chorus (`t = 76s .. 145s`)
    if (t >= 76.0 && t < 145.0) {
      const activeHearts = t < 96.0 ? 3 : (t < 105.8 ? 2 : (t < 112.0 ? 1 : 0));
      for (let h = 0; h < 3; h++) {
        const hCol = h < activeHearts ? '#F43F5E' : '#334155';
        paint(ctx, heartPts(1165 + h * 34, 54, 11), { wash: hCol, ink: '#0F172A', sw: 1.5 });
      }
    }
    ctx.restore();
  }

  // ==========================================================================
  // Reusable Set: Grandma's Traditional Courtyard House (`外婆家`)
  // ==========================================================================
  function drawGrandmaCourtyardSet(ctx, t, nightRain = false) {
    // Sky & Fluffy Clouds
    pxRect(ctx, 0, 36, W, 360, nightRain ? '#0F172A' : '#60A5FA');
    if (!nightRain) {
      paint(ctx, ellPts(240, 120, 95, 42, 16), { wash: '#FFFFFF', ink: null });
      paint(ctx, ellPts(980, 95, 115, 48, 16), { wash: '#FFFFFF', ink: null });
    }
    // Green rolling hills & rice paddies
    pxRect(ctx, 0, 360, W, 110, nightRain ? '#064E3B' : '#4ADE80');
    pxRect(ctx, 0, 445, W, H - 445, nightRain ? '#334155' : '#D6D3D1');

    // Traditional Tiled-Roof Courtyard House on right (x=510..1120, y=185..475)
    // Sloped grey tile roof
    ctx.fillStyle = nightRain ? '#1E293B' : '#334155';
    ctx.beginPath();
    ctx.moveTo(475, 295);
    ctx.lineTo(545, 195);
    ctx.lineTo(1085, 195);
    ctx.lineTo(1155, 295);
    ctx.closePath();
    ctx.fill();
    // House walls, wooden lattice windows, and red doorway with couplets
    pxRect(ctx, 515, 295, 600, 180, nightRain ? '#475569' : '#F5F5F4');
    pxRect(ctx, 560, 330, 130, 90, nightRain ? '#FACC15' : '#78350F');
    pxRect(ctx, 940, 330, 130, 90, nightRain ? '#FACC15' : '#78350F');
    pxRect(ctx, 765, 320, 95, 155, '#7F1D1D');
    // Red spring couplets flanking door
    pxRect(ctx, 742, 325, 14, 120, '#DC2626');
    pxRect(ctx, 869, 325, 14, 120, '#DC2626');

    // Big leafy tree on left
    pxRect(ctx, 185, 255, 36, 200, '#78350F');
    paint(ctx, ellPts(203, 225, 95, 68, 16), { wash: nightRain ? '#14532D' : '#16A34A', ink: null });

    if (nightRain) {
      for (let r = 0; r < 45; r++) {
        pxRect(ctx, (r * 79 + Math.floor(t * 260)) % W, 40 + ((r * 67 + Math.floor(t * 500)) % 580), 2, 18, '#7DD3FC');
      }
    }
  }

  // ==========================================================================
  // Main Frame Renderer: `renderDouyin3Frame(ctx, t)` (0.00s .. 230.40s)
  // ==========================================================================
  function renderDouyin3Frame(ctx, t) {
    reseedBoil(t);
    setActiveStyle('neon');
    ctx.save();

    // ------------------------------------------------------------------------
    // 1. 0.00s – 11.50s: Title Card `天黑黑 — 孙燕姿` & Neon City Rewind
    // ------------------------------------------------------------------------
    if (t < 11.50) {
      if (t < 4.5 || t >= 9.5) {
        pxRect(ctx, 0, 36, W, H - 36, '#60A5FA');
        for (let c = 0; c < 7; c++) {
          paint(ctx, ellPts(120 + c * 185, 610, 140, 95, 18), { wash: '#F8FAFC', ink: '#CBD5E1', sw: 2 });
        }
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = 'bold 108px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
        ctx.fillStyle = '#0F172A';
        ctx.fillText('天黑黑', 644, 244);
        ctx.fillStyle = '#1E293B';
        ctx.fillText('天黑黑', 640, 240);
        ctx.font = 'bold 44px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
        ctx.fillStyle = '#334155';
        ctx.fillText('孙燕姿 · 深海鲸鱼娘篇', 640, 335);
        ctx.restore();
        drawNeonWhaleGirl(ctx, 260, 625, 32, { t, view: 'front', emotion: 'happy', childBun: true });
      } else {
        // Bustling neon city skyline at night (`离家 318 KM`)
        pxRect(ctx, 0, 36, W, 480, '#090D1A');
        pxRect(ctx, 0, 516, W, H - 516, '#1E293B');
        for (let b = 0; b < 8; b++) {
          const bx = 30 + b * 155;
          pxRect(ctx, bx, 210, 135, 306, '#1E1B4B');
          for (let wy = 235; wy < 460; wy += 42) {
            pxRect(ctx, bx + 20, wy, 28, 24, '#FACC15');
            pxRect(ctx, bx + 75, wy, 28, 24, '#38BDF8');
          }
        }
        drawNeonWhaleGirl(ctx, 640, 585, 26, { t, view: 'side', emotion: 'sad', walk: t * 8 });
      }
    }

    // ------------------------------------------------------------------------
    // 2. 11.50s – 32.00s: Grandma's Courtyard & Summer Cicada (`我的外婆 总会唱歌哄我`)
    // ------------------------------------------------------------------------
    else if (t < 32.00) {
      if (t >= 22.0 && t < 27.0) {
        // Close-up of big summer tree trunk with singing Cicada (`知了——`)!
        pxRect(ctx, 0, 36, W, H - 36, '#60A5FA');
        pxRect(ctx, 790, 36, 230, H - 36, '#78350F');
        paint(ctx, ellPts(900, 95, 240, 120, 20), { wash: '#16A34A', ink: '#14532D', sw: 3 });
        // Cicada on trunk
        pxRect(ctx, 880, 310, 32, 54, '#1E293B');
        pxRect(ctx, 886, 325, 20, 34, '#E2E8F0');
        ctx.save();
        ctx.font = 'bold 28px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('知了——', 560, 210);
        ctx.fillText('知了——', 680, 330);
        ctx.fillText('知了——', 520, 430);
        ctx.restore();
        drawNeonWhaleGirl(ctx, 310, 675, 36, { t, view: 'side', emotion: 'curious', childBun: true });
      } else {
        drawGrandmaCourtyardSet(ctx, t, false);
        drawGrandmaRig(ctx, 740, 520, 24, { t, view: 'front' });
        drawNeonWhaleGirl(ctx, 560, 530, 22, { t, view: 'side', emotion: 'happy', childBun: true, pose: 'wave', waveArm: true });
        if (t >= 17.5 && t < 22.0) {
          drawNeonBox(ctx, 520, 82, 240, 44, '#0F172A', '#FACC15', '#1E293B');
          ctx.save();
          ctx.font = 'bold 20px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#FDE047';
          ctx.fillText('「外婆」出现了！', 640, 110);
          ctx.restore();
        }
      }
    }

    // ------------------------------------------------------------------------
    // 3. 32.00s – 48.00s: Green Leaf Raindrop (`♪ 天黑黑 欲落雨 ♪`) & Grandma Patting Head
    // ------------------------------------------------------------------------
    else if (t < 48.00) {
      if (t < 39.5) {
        pxRect(ctx, 0, 36, W, H - 36, '#475569');
        // Giant green leaf with a glistening raindrop sliding toward the tip!
        paint(ctx, [[80, 490], [340, 330], [790, 365], [420, 495]], { wash: '#22C55E', ink: '#15803D', sw: 3 });
        const dropX = lerp(380, 740, seg(t, 32.0, 39.0));
        paint(ctx, ellPts(dropX, 365, 12, 12, 12), { wash: '#E0F2FE', ink: '#38BDF8', sw: 2 });
        drawNeonWhaleGirl(ctx, 1020, 675, 36, { t, view: 'front', emotion: 'calm', childBun: true });
      } else if (t < 45.0) {
        pxRect(ctx, 0, 36, W, H - 36, '#271C19');
        drawNeonWhaleGirl(ctx, 520, 685, 44, { t, view: 'front', emotion: 'happy', childBun: true });
        // Grandma's warm hand gently patting young WhaleGirl's head!
        const patY = Math.sin(t * 6) * 8;
        pxRect(ctx, 840, 340 + patY, 440, 56, '#818CF8');
        pxRect(ctx, 680, 355 + patY, 170, 44, '#F7C9B6');
      } else {
        // RPG Skill Learned Modal: `学会了新技能：天黑黑`
        pxRect(ctx, 0, 36, W, H - 36, '#060810');
        drawNeonBox(ctx, 495, 78, 290, 48, '#0F172A', '#64748B', '#1E293B');
        drawNeonBox(ctx, 420, 215, 440, 210, '#0B1120', '#38BDF8', '#1E293B');
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = 'bold 22px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
        ctx.fillStyle = '#E2E8F0';
        ctx.fillText('我 睡着了。', 640, 108);
        ctx.fillStyle = '#94A3B8';
        ctx.fillText('学会了新技能', 640, 255);
        ctx.font = 'bold 54px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
        ctx.fillStyle = '#F8FAFC';
        ctx.fillText('天黑黑', 640, 325);
        ctx.font = 'bold 20px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
        ctx.fillStyle = '#64748B';
        ctx.fillText('效果：？？？', 640, 385);
        ctx.restore();
        drawNeonWhaleGirl(ctx, 230, 665, 34, { t, view: 'front', emotion: 'sleepy', childBun: true });
      }
    }

    // ------------------------------------------------------------------------
    // 4. 48.00s – 79.80s: Headphones (`新鲜的歌`), Declining Grandma's Call (`已拒接`),
    //                     & Pink Starburst (`♪ 天黑黑 黑黑 ♪`)
    // ------------------------------------------------------------------------
    else if (t < 79.80) {
      if (t < 57.0) {
        pxRect(ctx, 0, 36, W, H - 36, '#171126');
        drawNeonWhaleGirl(ctx, 480, 690, 46, {
          t,
          view: 'front',
          emotion: 'happy',
          hat: 'headphones',
          emote: 'music'
        });
        drawNeonBox(ctx, 760, 235, 320, 88, '#1E1B4B', '#A855F7', '#3B0764');
        ctx.save();
        ctx.font = 'bold 16px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
        ctx.fillStyle = '#C084FC';
        ctx.fillText('正在播放', 785, 265);
        ctx.font = 'bold 26px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('新鲜的歌', 785, 302);
        ctx.restore();
      } else if (t < 61.5) {
        // Incoming Call from Grandma `外婆` -> Stamped `[拒接 / 已拒接]`!
        pxRect(ctx, 0, 36, W, H - 36, '#140D26');
        drawNeonBox(ctx, 480, 65, 320, 520, '#0D0B18', '#EF4444', '#1E1B4B');
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = 'bold 20px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
        ctx.fillStyle = '#94A3B8';
        ctx.fillText('来电', 640, 115);
        paint(ctx, ellPts(640, 235, 52, 52, 18), { wash: '#334155', ink: '#CBD5E1', sw: 2 });
        ctx.font = 'bold 48px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
        ctx.fillStyle = '#EF4444';
        ctx.fillText('拒接', 640, 355);
        ctx.font = 'bold 22px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
        ctx.fillStyle = '#FCA5A5';
        ctx.fillText('已拒接：外婆', 640, 415);
        ctx.restore();
        drawNeonWhaleGirl(ctx, 240, 675, 36, { t, view: 'side', emotion: 'determined' });
      } else if (t < 74.5) {
        // Checking phone in dark apartment: `未接来电：外婆 (3)`
        pxRect(ctx, 0, 36, W, H - 36, '#121020');
        drawNeonBox(ctx, 180, 120, 280, 440, '#090D16', '#38BDF8', '#1E293B');
        ctx.save();
        ctx.font = 'bold 20px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
        ctx.fillStyle = '#38BDF8';
        ctx.fillText('未接来电', 265, 165);
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = '#E2E8F0';
          ctx.fillText(`外婆  (未接 #${i + 1})`, 215, 225 + i * 75);
        }
        ctx.restore();
        drawNeonWhaleGirl(ctx, 760, 680, 42, { t, view: 'front', emotion: 'sad' });
      } else {
        // Magenta/Pink Starburst (`♪ 天黑黑 黑黑 ♪` -> `我爱上让我奋不顾身的一个人`)
        pxRect(ctx, 0, 36, W, H - 36, '#9D174D');
        ctx.save();
        ctx.translate(640, 400);
        for (let i = 0; i < 16; i++) {
          const a0 = (i / 16) * TAU + t * 0.7;
          const a1 = a0 + TAU / 32;
          ctx.fillStyle = i % 2 === 0 ? '#BE185D' : '#DB2777';
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a0) * 900, Math.sin(a0) * 900);
          ctx.lineTo(Math.cos(a1) * 900, Math.sin(a1) * 900);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
        drawNeonWhaleGirl(ctx, 640, 695, 48, { t, view: 'front', emotion: 'excited', emote: 'heart' });
      }
    }

    // ------------------------------------------------------------------------
    // 5. 79.80s – 116.00s: Chorus 1 — Love, `MISSING TEXTURE` City Glitch, & `在线人数 1`
    // ------------------------------------------------------------------------
    else if (t < 116.00) {
      if (t < 88.8) {
        pxRect(ctx, 0, 36, W, H - 36, '#2E1065');
        drawNeonWhaleGirl(ctx, 480, 690, 46, { t, view: 'front', emotion: 'love', emote: 'heart' });
        paint(ctx, ellPts(960, 280, 85, 85, 20), { wash: '#F43F5E', ink: null });
        pxRect(ctx, 860, 365, 220, 340, '#0D9488');
      } else if (t < 96.8) {
        // City skyline with Magenta/Black `[MISSING TEXTURE]` Glitch Blocks (`是否成人的世界背后 总有残缺`)!
        pxRect(ctx, 0, 36, W, 480, '#090D1A');
        pxRect(ctx, 0, 516, W, H - 516, '#1E293B');
        for (let b = 0; b < 8; b++) {
          const bx = 25 + b * 155;
          pxRect(ctx, bx, 180, 135, 336, '#1E1B4B');
          for (let wy = 205; wy < 465; wy += 42) {
            pxRect(ctx, bx + 20, wy, 28, 24, '#FACC15');
            pxRect(ctx, bx + 75, wy, 28, 24, '#38BDF8');
          }
        }
        // Purple/Black checkerboard missing-texture patch across center buildings
        for (let gy = 210; gy < 370; gy += 20) {
          for (let gx = 360; gx < 860; gx += 20) {
            const isMag = (Math.floor(gx / 20) + Math.floor(gy / 20)) % 2 === 0;
            pxRect(ctx, gx, gy, 20, 20, isMag ? '#D946EF' : '#09060E');
          }
        }
        ctx.save();
        ctx.font = 'bold 28px "Silkscreen", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('MISSING TEXTURE', 610, 295);
        ctx.restore();
        drawNeonWhaleGirl(ctx, 610, 575, 26, { t, view: 'side', emotion: 'panic', walk: t * 9 });
      } else if (t < 110.5) {
        pxRect(ctx, 0, 36, W, H - 36, '#111827');
        drawNeonWhaleGirl(ctx, 360, 690, 46, { t, view: 'front', emotion: 'cry', tears: true });
      } else {
        // Vast dark cloudy sky: `在线人数  1` (`天空很大却看不清楚 好孤独`)
        pxRect(ctx, 0, 36, W, 540, '#090D1A');
        pxRect(ctx, 0, 576, W, H - 576, '#020617');
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = 'bold 22px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
        ctx.fillStyle = '#94A3B8';
        ctx.fillText('在线人数', 595, 195);
        ctx.font = 'bold 38px "Silkscreen", monospace';
        ctx.fillStyle = '#F8FAFC';
        ctx.fillText('1', 685, 202);
        ctx.restore();
        drawNeonWhaleGirl(ctx, 640, 585, 16, { t, view: 'front', emotion: 'sad' });
      }
    }

    // ------------------------------------------------------------------------
    // 6. 116.00s – 133.00s: City Work Grind Montage (`06:50` Alarm, Subway, Exhausted Bed)
    // ------------------------------------------------------------------------
    else if (t < 133.00) {
      if (t < 123.5) {
        pxRect(ctx, 0, 36, W, H - 36, '#141122');
        drawNeonBox(ctx, 450, 265, 380, 175, '#1F2937', '#EF4444', '#111827');
        ctx.save();
        ctx.font = 'bold 82px "Silkscreen", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#EF4444';
        ctx.fillText('06:50', 640, 380);
        ctx.restore();
        drawNeonWhaleGirl(ctx, 250, 665, 36, { t, view: 'side', emotion: 'sleepy' });
      } else {
        // Subway car window & exhausted apartment night
        pxRect(ctx, 0, 36, W, H - 36, '#0F172A');
        drawNeonBox(ctx, 320, 75, 480, 540, '#1E293B', '#64748B', '#0F172A');
        // Subway hanging straps
        for (const sx of [410, 560, 710]) {
          pxRect(ctx, sx, 80, 4, 85, '#94A3B8');
          paint(ctx, ellPts(sx + 2, 180, 18, 18, 12), { wash: null, ink: '#CBD5E1', sw: 4 });
        }
        drawNeonWhaleGirl(ctx, 560, 645, 36, { t, view: 'front', emotion: 'sleepy' });
      }
    }

    // ------------------------------------------------------------------------
    // 7. 133.00s – 170.00s: Chorus 2 — `[已删除]`, Boss Shadow `！？`, Missing Moon `缺1块`,
    //                       Grandma's Courtyard `[小幸福 +1]`, & `心之碎片 0/4`
    // ------------------------------------------------------------------------
    else if (t < 170.00) {
      if (t < 142.5) {
        pxRect(ctx, 0, 36, W, H - 36, '#0B0914');
        drawNeonBox(ctx, 490, 85, 300, 490, '#111827', '#475569', '#1E293B');
        ctx.save();
        ctx.font = 'bold 28px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#64748B';
        ctx.fillText('已删除', 640, 330);
        ctx.restore();
        drawNeonWhaleGirl(ctx, 260, 675, 36, { t, view: 'side', emotion: 'cry', tears: true });
      } else if (t < 147.0) {
        // Giant dark shadow pointing accusingly at tiny WhaleGirl (`！？` `[状态：被误解]`)
        pxRect(ctx, 0, 36, W, H - 36, '#171C30');
        paint(ctx, ellPts(960, 230, 110, 110, 20), { wash: '#04060E', ink: null });
        paint(ctx, [[780, 680], [830, 320], [1160, 320], [1220, 680]], { wash: '#04060E', ink: null });
        // Pointing arm
        paint(ctx, [[850, 360], [360, 250], [350, 290], [840, 420]], { wash: '#04060E', ink: null });
        ctx.save();
        ctx.font = 'bold 64px "Silkscreen", monospace';
        ctx.fillStyle = '#EF4444';
        ctx.fillText('!?', 320, 185);
        ctx.restore();
        drawNeonWhaleGirl(ctx, 220, 625, 24, { t, view: 'side', emotion: 'panic', sq: -0.18 });
      } else if (t < 155.8) {
        // Crescent Moon missing a puzzle piece (`缺 1 块`)
        pxRect(ctx, 0, 36, W, H - 36, '#090D1A');
        paint(ctx, ellPts(580, 210, 95, 95, 24), { wash: '#FEF08A', ink: null });
        paint(ctx, ellPts(625, 190, 75, 75, 20), { wash: '#090D1A', ink: null });
        pxRect(ctx, 515, 205, 42, 42, '#090D1A'); // Missing puzzle notch!
        ctx.save();
        ctx.font = 'bold 22px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
        ctx.fillStyle = '#94A3B8';
        ctx.fillText('缺 1 块', 735, 195);
        ctx.restore();
        drawNeonWhaleGirl(ctx, 640, 595, 24, { t, view: 'front', emotion: 'sad' });
      } else if (t < 160.8) {
        // Flashback to Grandma's sunny courtyard (`[小幸福 +1]`)!
        drawGrandmaCourtyardSet(ctx, t, false);
        drawGrandmaRig(ctx, 760, 520, 24, { t, view: 'front' });
        drawNeonWhaleGirl(ctx, 550, 530, 22, { t, view: 'side', emotion: 'happy', childBun: true });
        drawNeonBox(ctx, 540, 82, 200, 42, '#0F172A', '#FACC15', '#1E293B');
        ctx.save();
        ctx.font = 'bold 20px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FDE047';
        ctx.fillText('小幸福  +1', 640, 109);
        ctx.restore();
      } else {
        // RPG `心之碎片  0 / 4`
        pxRect(ctx, 0, 36, W, H - 36, '#0B0C1A');
        paint(ctx, heartPts(640, 265, 75), { wash: '#1E293B', ink: '#475569', sw: 3 });
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = 'bold 24px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
        ctx.fillStyle = '#94A3B8';
        ctx.fillText('心之碎片', 640, 125);
        ctx.font = 'bold 34px "Silkscreen", monospace';
        ctx.fillStyle = '#CBD5E1';
        ctx.fillText('0 / 4', 640, 435);
        ctx.restore();
        drawNeonWhaleGirl(ctx, 260, 665, 34, { t, view: 'side', emotion: 'cry', tears: true });
      }
    }

    // ------------------------------------------------------------------------
    // 8. 170.00s – 188.00s: Candle in the Dark, Raindrop in Palm, & Split-Screen Grandma Duet!
    // ------------------------------------------------------------------------
    else if (t < 188.00) {
      if (t < 178.5) {
        // Dark power-outage room lit by a single warm candle (`天黑的时候 我又想起那首歌`)
        pxRect(ctx, 0, 36, W, H - 36, '#080A12');
        paint(ctx, ellPts(680, 545, 220, 160, 24), { wash: '#F59E0B', washOp: 55, ink: null });
        pxRect(ctx, 635, 535, 12, 45, '#FEF3C7');
        pxRect(ctx, 633, 515, 16, 20, '#FACC15');
        drawNeonWhaleGirl(ctx, 745, 595, 26, { t, view: 'side', flip: true, emotion: 'calm' });
      } else if (t < 183.0) {
        // Outstretched hand catching quiet raindrops (`突然期待 下起安静的雨`)
        pxRect(ctx, 0, 36, W, H - 36, '#0A0D18');
        for (let r = 0; r < 35; r++) {
          pxRect(ctx, (r * 83) % W, 45 + ((r * 67 + Math.floor(t * 220)) % 560), 2, 18, '#7DD3FC');
        }
        pxRect(ctx, 820, 410, 460, 75, '#F8FAFC');
        pxRect(ctx, 510, 415, 320, 48, '#F7C9B6');
        drawNeonWhaleGirl(ctx, 250, 675, 36, { t, view: 'side', emotion: 'calm' });
      } else {
        // Split-Screen Duet: Grandma (`过去`) on warm cream left + WhaleGirl (`现在`) on night right!
        pxRect(ctx, 0, 36, 640, H - 36, '#FEF3C7');
        pxRect(ctx, 640, 36, 640, H - 36, '#141829');
        pxRect(ctx, 637, 36, 6, H - 36, '#FACC15');
        drawGrandmaRig(ctx, 320, 685, 44, { t, view: 'side', noShadow: true });
        drawNeonWhaleGirl(ctx, 960, 690, 44, { t, view: 'side', flip: true, emotion: 'love', tears: true, emote: 'music' });
      }
    }

    // ------------------------------------------------------------------------
    // 9. 188.00s – 205.00s: Walking Forward in Rain & Calling Grandma (`正在呼叫：外婆`)
    // ------------------------------------------------------------------------
    else if (t < 205.00) {
      if (t < 197.0) {
        pxRect(ctx, 0, 36, W, 480, '#090D1A');
        pxRect(ctx, 0, 516, W, H - 516, '#1E293B');
        for (let b = 0; b < 8; b++) {
          pxRect(ctx, 30 + b * 155, 200, 135, 316, '#1E1B4B');
        }
        for (let r = 0; r < 40; r++) {
          pxRect(ctx, (r * 73 + Math.floor(t * 280)) % W, 40 + ((r * 89 + Math.floor(t * 500)) % 560), 2, 18, '#60A5FA');
        }
        drawNeonWhaleGirl(ctx, 640, 575, 28, { t, view: 'side', emotion: 'determined', walk: t * 10 });
      } else {
        // Calling Grandma on Smartphone: `正在呼叫：外婆  嘟——` (`我现在 好想回家去`)!
        pxRect(ctx, 0, 36, W, H - 36, '#0D1021');
        drawNeonBox(ctx, 480, 65, 320, 520, '#090D16', '#38BDF8', '#1E293B');
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = 'bold 20px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
        ctx.fillStyle = '#7DD3FC';
        ctx.fillText('正在呼叫', 640, 118);
        paint(ctx, ellPts(640, 235, 52, 52, 18), { wash: '#334155', ink: '#38BDF8', sw: 3 });
        ctx.font = 'bold 42px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
        ctx.fillStyle = '#F8FAFC';
        ctx.fillText('外婆', 640, 355);
        ctx.font = 'bold 22px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
        ctx.fillStyle = '#94A3B8';
        ctx.fillText('嘟——', 640, 415);
        ctx.restore();
        drawNeonWhaleGirl(ctx, 240, 675, 36, { t, view: 'side', emotion: 'happy', tears: true });
      }
    }

    // ------------------------------------------------------------------------
    // 10. 205.00s – 221.00s: Returning to Grandma's Warm Courtyard (`♪ 天黑黑 黑黑 ♪`)
    // ------------------------------------------------------------------------
    else if (t < 221.00) {
      if (t < 213.5) {
        drawGrandmaCourtyardSet(ctx, t, true);
        drawGrandmaRig(ctx, 780, 520, 24, { t, view: 'front' });
        drawNeonWhaleGirl(ctx, 480, 535, 24, { t, view: 'side', emotion: 'happy', walk: t * 9 });
      } else {
        // Warm close-up of Grandma smiling & WhaleGirl hugging her!
        pxRect(ctx, 0, 36, W, H - 36, '#1E140C');
        paint(ctx, ellPts(640, 420, 390, 270, 24), { wash: '#F59E0B', washOp: 50, ink: null });
        drawGrandmaRig(ctx, 490, 685, 44, { t, view: 'front', noShadow: true });
        drawNeonWhaleGirl(ctx, 810, 690, 42, { t, view: 'side', flip: true, emotion: 'love', emote: 'heart' });
      }
    }

    // ------------------------------------------------------------------------
    // 11. 221.00s – 230.40s: Closing Title Card & Sunny Courtyard (`天亮了。`)
    // ------------------------------------------------------------------------
    else {
      drawGrandmaCourtyardSet(ctx, t, false);
      drawGrandmaRig(ctx, 740, 520, 24, { t, view: 'front' });
      drawNeonWhaleGirl(ctx, 590, 530, 24, { t, view: 'front', emotion: 'happy', pose: 'heart' });

      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = 'bold 54px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
      ctx.fillStyle = '#0F172A';
      ctx.fillText('天黑黑 · 孙燕姿', 640, 125);
      ctx.restore();
    }

    // ========================================================================
    // Top HUD & Bottom RPG Subtitle Box (Synced 1:1 with `每天每天的抖音 - 抖音_3.mp4`)
    // ========================================================================
    drawTopSkyHUD(ctx, t);

    const sub = getSubtitleAt(t);
    if (sub && sub.zh) {
      if (sub.bg === 'paper') {
        drawNeonBox(ctx, 355, 642, 570, 52, '#FEFCE8', '#78350F', '#D97706');
      } else if (sub.bg === 'dark') {
        drawNeonBox(ctx, 355, 642, 570, 52, 'rgba(11, 15, 29, 0.92)', '#38BDF8', '#1E293B');
      }
      const pop = backOut(seg(t, sub.t0, sub.t0 + 0.18));
      ctx.save();
      ctx.translate(640, 668);
      ctx.scale(0.94 + 0.06 * pop, 0.94 + 0.06 * pop);
      ctx.font = 'bold 26px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (sub.bg === 'paper') {
        ctx.fillStyle = '#1E293B';
        ctx.fillText(sub.zh, 0, 0);
      } else if (sub.bg === 'gold') {
        ctx.fillStyle = '#090D16';
        ctx.fillText(sub.zh, 2, 2);
        ctx.fillStyle = '#FACC15';
        ctx.fillText(sub.zh, 0, 0);
      } else {
        ctx.fillStyle = '#020617';
        ctx.fillText(sub.zh, 2, 2);
        ctx.fillStyle = '#F8FAFC';
        ctx.fillText(sub.zh, 0, 0);
      }
      ctx.restore();
    }

    ctx.restore();
  }

  const MV_DOUYIN_3 = {
    DURATION: DURATION_MV3,
    SUBTITLES: SUBTITLES_MV3,
    renderDouyin3Frame,
    drawNeonWhaleGirl,
    drawGrandmaRig
  };

  root.MV_DOUYIN_3 = MV_DOUYIN_3;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = MV_DOUYIN_3;
  }
})(typeof window !== 'undefined' ? window : globalThis);
