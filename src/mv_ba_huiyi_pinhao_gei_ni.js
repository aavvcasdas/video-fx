// ============================================================================
// src/mv_ba_huiyi_pinhao_gei_ni.js
// Full 142.11s (4,263 frames @ 30fps) Animated Music Video Director for:
//   《椰子水很甜 - 把回忆拼好给你（纯享Beat）》 (深海鲸鱼娘 · 42分镜全动态篇)
// Built following `tuzhechen2005/opus-video-skills` (`painted-animation` + `xz_set.js` / `xz_shots.js`):
//   - Locked to exact measured beat grid: 94.85 BPM, BEAT = 0.6326s, OFF = 0.415s
//   - 42 beat-cut shots (~3.3s per shot, 1 shot per 4-6 beats)
//   - Continuous character locomotion (`stroll`, `runTo`, `turn`, `spinView`, `jump`,
//     `arcPt`, `kneel`, `take`, `emotions`, dual-arm prop hooks `armL`/`armR`)
//   - Full camera choreography (`camBegin`/`camEnd` dolly, pan, tracking, POV close-up)
//   - Handmade transitions at every chapter seam (`brushWipe`, `smokeWipe`, `curtains`,
//     `spotDark`, `filmFX`, `iris`)
//   - Escalating Motif: 9-Piece Glowing Star-Whale Jigsaw Puzzle (0/9 -> 9/9) that
//     transforms into a swimming Bioluminescent Star-Whale in the climax!
// ============================================================================

(function (root) {
  'use strict';

  const CORE = (typeof window !== 'undefined' && window.CORE) ? window.CORE : require('./core.js');
  const WHALE = (typeof window !== 'undefined' && window.WHALE_GIRL) ? window.WHALE_GIRL : require('./whale_girl.js');
  const CAST = (typeof window !== 'undefined' && window.CAST) ? window.CAST : require('./cast.js');

  const {
    W, H, TAU, PAL,
    clamp, lerp, frac, seg, ease, easeIn, easeOut, backOut, hash,
    boilSeed, jit, kf, spring, arcPt, jump, take, stroll, runTo, shakeXY,
    mixCol, rectPts, ellPts, rrPts, starPts, heartPts, through, ribbon,
    setActiveStyle, paint, inkLine,
    camBegin, camEnd, toScreen,
    glow, flash, iris, brushWipe, curtains, spotDark, smokeWipe, filmFX
  } = CORE;
  const { whaleGirl, feel, emotions, turn, spinView, move } = WHALE;

  const DURATION = 142.11;
  const BPM = 94.85;
  const BEAT = 60 / BPM; // 0.6326s
  const OFF = 0.415;
  const B = (n) => OFF + n * BEAT; // Exact beat time helper from opus-video-skills

  // Palette looks across the 6 chapters (modeled on LOOK in opus-video-skills xz_set.js)
  const LOOK = {
    dusk: {
      sky: '#6E5A8A', sky2: '#E89980', glow: '#F7C888', far: '#5D4B7A', near: '#473D66',
      house: '#5A4870', roof: '#9E4F46', win: '#FACC15', winOn: 0.65,
      top: '#9A8B94', face: '#635568', edge: '#E8C46A', rail: '#261E30',
      train: '#2E6F73', trainDk: '#1B4447', trim: '#EAB308', stars: 0.2, style: 'watercolor'
    },
    sepia: {
      sky: '#EFE0BA', sky2: '#F8ECCB', glow: '#FFF5DA', far: '#D4BC94', near: '#C0A47A',
      house: '#B2956E', roof: '#8E6246', win: '#E8D2A6', winOn: 0.2,
      top: '#D4C29E', face: '#AA9270', edge: '#EADAB4', rail: '#5A4434',
      train: '#8A5A44', trainDk: '#5C3A2C', trim: '#D8B46C', stars: 0, sepia: true, style: 'ukiyoe'
    },
    rain: {
      sky: '#161E3C', sky2: '#263466', glow: '#384B82', far: '#1E274E', near: '#171E3F',
      house: '#22284A', roof: '#422C48', win: '#F59E0B', winOn: 0.9,
      top: '#3D4363', face: '#272B44', edge: '#94A3B8', rail: '#0F1424',
      train: '#266468', trainDk: '#163D40', trim: '#FACC15', stars: 0, rain: true, style: 'watercolor'
    },
    twilight: {
      sky: '#311E54', sky2: '#B85478', glow: '#F6A87E', far: '#3B285E', near: '#2B1D47',
      house: '#3A2856', roof: '#7D3C58', win: '#FDE047', winOn: 0.85,
      top: '#5E4B70', face: '#3D304E', edge: '#F59E0B', rail: '#1E162B',
      train: '#2F7470', trainDk: '#1E4A4A', trim: '#FACC15', stars: 0.6, style: 'risograph'
    },
    night: {
      sky: '#0B1026', sky2: '#1B2654', glow: '#2D3E78', far: '#141C40', near: '#0E1530',
      house: '#1A2044', roof: '#3A2444', win: '#FACC15', winOn: 1.0,
      top: '#323858', face: '#1E223B', edge: '#38BDF8', rail: '#090D1A',
      train: '#1E5E68', trainDk: '#113A42', trim: '#38BDF8', stars: 1.0, style: 'neon'
    },
    dawn: {
      sky: '#1E3A8A', sky2: '#F472B6', glow: '#FDE047', far: '#312E81', near: '#1E293B',
      house: '#334155', roof: '#BE185D', win: '#FEF08A', winOn: 0.5,
      top: '#64748B', face: '#475569', edge: '#FACC15', rail: '#1E293B',
      train: '#0284C7', trainDk: '#0369A1', trim: '#FACC15', stars: 0.4, style: 'watercolor'
    }
  };

  // Lyric / Story Narrative Subtitles synced to the 94.85 BPM bar structure
  const LYRICS = [
    { t0: 0.4,   t1: 5.4,   text: '~ 椰子水很甜 —《把回忆拼好给你》 · 深海鲸鱼娘全动态分镜篇 ~', hi: '把回忆拼好给你' },
    { t0: 5.5,   t1: 10.5,  text: '黄昏海风吹散了木盒 记忆化成九枚星光拼图',                   hi: '九枚星光拼图' },
    { t0: 10.6,  t1: 15.6,  text: '俯身拾起第一枚碎片 指尖亮起那年夏天的温度',                 hi: '第一枚碎片' },
    { t0: 15.7,  t1: 20.6,  text: '追着海风奔向站台 每一帧都是未完待续的旅途',                 hi: '奔向站台' },
    { t0: 20.7,  t1: 25.7,  text: '我们之间的回忆 全部都小心地收集',                           hi: '小心地收集' },
    { t0: 25.8,  t1: 30.8,  text: '椰子水很甜的午后 并肩走过洒满阳光的街口',                   hi: '椰子水很甜' },
    { t0: 30.9,  t1: 35.8,  text: '快门定格跃起的瞬间 笑容比盛夏的海浪更自由',                 hi: '跃起的瞬间' },
    { t0: 35.9,  t1: 40.9,  text: '纸飞机掠过金色桥头 替我们把心愿悄悄保留',                   hi: '纸飞机' },
    { t0: 41.0,  t1: 46.0,  text: '我总是偷偷地哭泣 像倦鸟失了归期',                           hi: '失了归期' },
    { t0: 46.1,  t1: 51.0,  text: '隔着雨夜模糊的车窗 你的掌心贴着滚烫的泪光',                 hi: '滚烫的泪光' },
    { t0: 51.1,  t1: 56.1,  text: '汽笛声催着列车远航 我沿着铁轨拼命追赶',                     hi: '拼命追赶' },
    { t0: 56.2,  t1: 61.1,  text: '水洼映出破碎的倒影 却在雾气里拾起第五枚星芒',               hi: '第五枚星芒' },
    { t0: 61.2,  t1: 66.2,  text: '但愿我相信的爱情 结局紧握在我手心',                         hi: '紧握在我手心' },
    { t0: 66.3,  t1: 71.3,  text: '灯塔画室的暮色里 一笔一画描摹重逢的轨迹',                   hi: '重逢的轨迹' },
    { t0: 71.4,  t1: 76.3,  text: '折一架发光的纸飞机 穿越浪花与小鲸鱼同行',                   hi: '穿越浪花' },
    { t0: 76.4,  t1: 81.4,  text: '时光匆匆却没有遗失过去 海鸥捎来远方的回信',                 hi: '没有遗失过去' },
    { t0: 81.5,  t1: 86.5,  text: '午夜星光洒满阁楼 蹲下身把散落的碎片温柔拼凑',               hi: '温柔拼凑' },
    { t0: 86.6,  t1: 91.5,  text: '每一道裂痕都藏着星辰 每一声叹息都化作晨曦',                 hi: '藏着星辰' },
    { t0: 91.6,  t1: 96.6,  text: '八枚碎片在掌心共鸣 只差夜空最高处那颗真心',                 hi: '那颗真心' },
    { t0: 96.7,  t1: 101.6, text: '推开天台的大门 迎着银河奔向最后的约定',                     hi: '最后的约定' },
    { t0: 101.7, t1: 106.7, text: '把回忆拼好给你 让所有遗憾都开出花期',                       hi: '把回忆拼好给你' },
    { t0: 106.8, t1: 111.8, text: '跃向漫天星海的怀抱 摘下第九枚发光的心跳',                   hi: '第九枚' },
    { t0: 111.9, t1: 116.8, text: '九枚拼图合一的刹那 星河巨鲸在夜空中苏醒',                   hi: '星河巨鲸' },
    { t0: 116.9, t1: 121.9, text: '乘着荧光鲸歌翱翔 越过山海与旧日的风霜',                     hi: '乘着荧光鲸歌' },
    { t0: 122.0, t1: 129.5, text: '破晓的列车穿过花海 载着完整的回忆向你驶来',                 hi: '完整的回忆' },
    { t0: 129.6, t1: 137.0, text: '这一次不再挥手告别 椰子水很甜而你就在身边',                 hi: '你就在身边' },
    { t0: 137.1, t1: 142.0, text: '把回忆拼好给你 · 愿每一份思念都有归期',                     hi: '都有归期' }
  ];

  // ==========================================================================
  // Held Props & Motif Objects (drawn in hand space or world space)
  // ==========================================================================

  // Glowing Jigsaw Puzzle Piece (id 1..9)
  function drawPuzzlePiece(ctx, x, y, r, col = '#FACC15', rot = 0, glowOn = true) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    if (glowOn) glow(ctx, 0, 0, r * 2.2, col, 0.55);
    const s = r * 0.75;
    paint(ctx, [
      [-s, -s], [0, -s * 1.35], [s, -s],
      [s * 1.35, 0], [s, s],
      [0, s * 0.72], [-s, s],
      [-s * 0.72, 0]
    ], { wash: col, fill: '#FFFBEB', fillOp: 95, ink: PAL.ink, sw: 1.1, curv: 0.25 });
    paint(ctx, starPts(0, 0, s * 0.45, 0.4, 4), { wash: '#FFFFFF', ink: null });
    ctx.restore();
  }

  // Hand-held prop callbacks for whaleGirl's armL / armR
  const holdPuzzle = (col = '#FACC15', rot = 0) => (ctx, u) => {
    drawPuzzlePiece(ctx, 0, 0, u * 0.65, col, rot, true);
  };
  const holdCoconut = (ctx, u) => {
    ctx.save();
    // Fresh green/white coconut drink with striped straw ("椰子水很甜")
    paint(ctx, ellPts(0, 0, u * 0.55, u * 0.50, 14), { wash: '#ECFDF5', fill: '#A7F3D0', fillOp: 90, ink: PAL.ink, sw: 1.0 });
    paint(ctx, ellPts(0, -u * 0.28, u * 0.42, u * 0.16, 10), { wash: '#10B981', ink: PAL.ink, sw: 0.8 });
    inkLine(ctx, [[0, -u * 0.28], [u * 0.35, -u * 0.95], [u * 0.55, -u * 0.95]], 2.2, '#F43F5E', 'ink', 0);
    ctx.restore();
  };
  const holdCamera = (flashK = 0) => (ctx, u) => {
    ctx.save();
    paint(ctx, rrPts(-u * 0.55, -u * 0.42, u * 1.1, u * 0.84, 4), { wash: '#FEF3C7', fill: '#F59E0B', fillOp: 80, ink: PAL.ink, sw: 1.0 });
    paint(ctx, ellPts(0, 0, u * 0.28, u * 0.28, 12), { wash: '#1E293B', ink: PAL.ink, sw: 0.9 });
    if (flashK > 0.05) glow(ctx, u * 0.35, -u * 0.25, u * 4.5 * flashK, '#FFFBEB', flashK);
    ctx.restore();
  };
  const holdPlane = (ctx, u) => {
    ctx.save();
    paint(ctx, [[-u * 0.5, 0], [u * 0.75, -u * 0.25], [-u * 0.2, u * 0.35]], { wash: '#E0F2FE', fill: '#38BDF8', fillOp: 70, ink: PAL.ink, sw: 0.9 });
    ctx.restore();
  };
  const holdBrush = (col = '#38BDF8') => (ctx, u) => {
    ctx.save();
    inkLine(ctx, [[-u * 0.4, u * 0.4], [u * 0.5, -u * 0.5]], 2.6, '#92400E', 'ink', 0);
    paint(ctx, ellPts(u * 0.62, -u * 0.62, u * 0.24, u * 0.16, 10, 0, -0.7), { wash: col, ink: PAL.ink, sw: 0.8 });
    ctx.restore();
  };

  // 3x3 Puzzle Progress Frame on the easel / sky / HUD
  function drawPuzzleBoard(ctx, cx, cy, size, count, t, glowAmt = 0.4) {
    const half = size / 2, cell = size / 3;
    ctx.save();
    if (glowAmt > 0.05) glow(ctx, cx, cy, size * 0.9, '#38BDF8', glowAmt);
    paint(ctx, rrPts(cx - half - 8, cy - half - 8, size + 16, size + 16, 10), {
      wash: '#1E293B', fill: '#0F172A', fillOp: 120, ink: '#FACC15', sw: 1.5
    });
    const cols = ['#38BDF8', '#60A5FA', '#818CF8', '#22D3EE', '#F472B6', '#34D399', '#A78BFA', '#FBBF24', '#FACC15'];
    for (let idx = 0; idx < 9; idx++) {
      const r = Math.floor(idx / 3), c = idx % 3;
      const px = cx - half + c * cell + cell / 2;
      const py = cy - half + r * cell + cell / 2;
      if (idx < count) {
        paint(ctx, rectPts(px - cell * 0.46, py - cell * 0.46, cell * 0.92, cell * 0.92, 1), {
          wash: cols[idx], fill: '#E0F2FE', fillOp: 70, ink: PAL.ink, sw: 0.9
        });
        if (idx === 4) {
          paint(ctx, heartPts(px, py, cell * 0.28), { wash: '#FB7185', ink: PAL.ink, sw: 0.7 });
        } else {
          paint(ctx, starPts(px, py, cell * 0.22, 0.4, 4), { wash: '#FEF08A', ink: null });
        }
      } else {
        paint(ctx, rectPts(px - cell * 0.44, py - cell * 0.44, cell * 0.88, cell * 0.88, 1), {
          wash: '#0F172A', washOp: 160, ink: '#475569', sw: 0.7
        });
      }
    }
    ctx.restore();
  }

  // Bioluminescent Star-Whale (`starWhale`, modeled on `koi` in opus-video-skills xz_set.js!)
  function drawStarWhale(ctx, x, y, s, ang, t) {
    boilSeed('starWhale');
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    if (Math.cos(ang) < 0) ctx.scale(1, -1);

    glow(ctx, 0, 0, s * 1.8, '#38BDF8', 0.65);

    const wave = (k) => Math.sin(t * 7.5 - k * 2.8) * s * 0.10 * k;
    const spine = [];
    for (let i = 0; i <= 10; i++) {
      const k = i / 10;
      spine.push([s * (1 - 2 * k), wave(k)]);
    }
    const wid = (k) => s * 0.38 * Math.pow(Math.sin(Math.PI * Math.min(1, k * 0.9 + 0.1)), 0.68) * (1 - 0.42 * k);
    const top = [], bot = [];
    for (let i = 0; i <= 10; i++) {
      const k = i / 10;
      top.push([spine[i][0], spine[i][1] - wid(k)]);
      bot.push([spine[i][0], spine[i][1] + wid(k)]);
    }
    const tb = spine[10], tw = Math.sin(t * 7.5 - 3.2) * 0.45;
    // Fluke tail fan
    paint(ctx, through([
      [tb[0] + s * 0.05, tb[1]],
      [tb[0] - s * 0.48, tb[1] - s * 0.44 + tw * s * 0.2],
      [tb[0] - s * 0.30, tb[1] + tw * s * 0.1],
      [tb[0] - s * 0.48, tb[1] + s * 0.44 + tw * s * 0.2],
      [tb[0] + s * 0.05, tb[1] + 2]
    ]), { wash: '#38BDF8', fill: '#F472B6', fillOp: 110, ink: PAL.ink, sw: 1.2 });

    // Whale body
    const body = top.concat(bot.reverse());
    paint(ctx, body, { wash: '#0284C7', fill: '#67E8F9', fillOp: 120, tex: 0.6, ink: PAL.ink, sw: 1.4, curv: 0.45 });

    // Glowing constellation stars along the whale's back
    for (const [k, dy] of [[0.25, -0.08], [0.50, 0.04], [0.72, -0.05]]) {
      const p = spine[Math.round(k * 10)];
      paint(ctx, starPts(p[0], p[1] + dy * s, s * 0.11, 0.38, 4, t * 2), { wash: '#FEF08A', ink: null });
    }

    // Eye & gentle smile
    const hx = s * 0.68;
    paint(ctx, ellPts(hx, -s * 0.06, s * 0.055, s * 0.065, 10), { wash: '#FFFFFF', ink: null });
    paint(ctx, ellPts(hx + s * 0.015, -s * 0.06, s * 0.03, s * 0.035, 8), { wash: PAL.ink, ink: null });
    inkLine(ctx, [[s * 0.82, s * 0.08], [s * 0.90, s * 0.12], [s * 0.96, s * 0.07]], 1.2, '#FEF08A', 'ink', 0.5);
    ctx.restore();
  }

  // ==========================================================================
  // Shared Sets & World Builders (modeled on `xz_set.js` in opus-video-skills)
  // ==========================================================================
  const RAIL_Y = 525;
  const PLAT_Y = 510;

  function drawSkyAndTown(ctx, L, t) {
    boilSeed('sky');
    paint(ctx, rectPts(-500, -600, W + 1000, 1400), { wash: L.sky, ink: null });
    paint(ctx, ellPts(W / 2, 500, 980, 250, 28, 6), { fill: L.sky2, fillOp: 145, bleed: 0.3, tex: 0.5, ink: null });
    paint(ctx, ellPts(W * 0.62, 430, 480, 95, 22, 5), { fill: L.glow, fillOp: 95, bleed: 0.3, tex: 0.4, ink: null });

    if (L.stars > 0) {
      const nStars = Math.round(45 * L.stars);
      for (let i = 0; i < nStars; i++) {
        boilSeed('st' + i);
        const sx = hash(i) * (W + 600) - 300;
        const sy = hash(i + 50) * 520 - 140;
        const tw = 0.55 + 0.45 * Math.sin(t * (1.8 + 2 * hash(i + 9)) + i);
        paint(ctx, starPts(sx, sy, (2.5 + 4 * hash(i + 3)) * tw, 0.35, 4), {
          wash: PAL.cream, washOp: Math.round(130 + 115 * tw), ink: null
        });
      }
    }

    // Soft drifting clouds
    for (let i = 0; i < 3; i++) {
      boilSeed('cl' + i);
      const cx = ((hash(i + 20) * 1800 + t * (14 + 8 * i)) % 2200) - 300;
      const cy = 120 + i * 75;
      paint(ctx, ellPts(cx, cy, 140 + 40 * i, 32, 20, 4), {
        fill: mixCol(L.sky2, PAL.cream, 0.35), fillOp: 105, ink: null
      });
    }

    // Distant hills & little coastal town houses
    boilSeed('hills');
    paint(ctx, ellPts(360, 540, 740, 165, 32, 2), { wash: L.far, ink: PAL.ink, sw: 0.7 });
    paint(ctx, ellPts(1080, 550, 680, 140, 32, 2), { wash: L.far, ink: PAL.ink, sw: 0.7 });

    for (let i = 0; i < 8; i++) {
      boilSeed('house' + i);
      const hx = -120 + i * 205 + 35 * hash(i);
      const hw = 78 + 34 * hash(i + 4);
      const hh = 56 + 42 * hash(i + 8);
      const hy = 475 + 18 * hash(i + 2);
      paint(ctx, rectPts(hx, hy - hh, hw, hh, 1), { wash: L.house, ink: PAL.ink, sw: 0.7 });
      paint(ctx, [[hx - 10, hy - hh], [hx + hw / 2, hy - hh - 38 - 14 * hash(i)], [hx + hw + 10, hy - hh]], {
        wash: L.roof, ink: PAL.ink, sw: 0.7
      });
      const lit = L.winOn > 0 && hash(i + 31) < L.winOn;
      paint(ctx, rectPts(hx + hw * 0.34, hy - hh * 0.68, hw * 0.32, hh * 0.32), {
        wash: lit ? L.win : mixCol(L.house, PAL.ink, 0.35), ink: null
      });
    }
  }

  function drawPlatformAndTrack(ctx, L) {
    boilSeed('track');
    paint(ctx, rectPts(-500, RAIL_Y - 22, W + 1000, 48), { wash: L.near, ink: null });
    inkLine(ctx, [[-500, RAIL_Y - 3], [W / 2, RAIL_Y - 4], [W + 500, RAIL_Y - 3]], 1.6, L.rail, 'ink', 0);

    boilSeed('plat');
    paint(ctx, [[-500, PLAT_Y], [W + 500, PLAT_Y], [W + 500, 650], [-500, 650]], {
      wash: L.top, fill: mixCol(L.top, PAL.ink, 0.22), fillOp: 55, ink: PAL.ink, sw: 1.0
    });
    paint(ctx, [[-500, PLAT_Y + 4], [W + 500, PLAT_Y + 4], [W + 500, PLAT_Y + 14], [-500, PLAT_Y + 14]], {
      wash: L.edge, washOp: 225, ink: null
    });
    paint(ctx, [[-500, 650], [W + 500, 650], [W + 500, 950], [-500, 950]], {
      wash: L.face, ink: PAL.ink, sw: 1.0
    });
  }

  function drawLampPost(ctx, x, L, on = 1) {
    boilSeed('lamp' + x);
    const top = 265, col = mixCol(L.rail, L.face, 0.3);
    paint(ctx, rectPts(x - 6, top, 12, 615 - top), { wash: col, ink: PAL.ink, sw: 0.8 });
    inkLine(ctx, [[x, top + 14], [x + 28, top - 8], [x + 48, top + 8]], 2.5, col, 'ink', 0.5);
    paint(ctx, [[x + 32, top + 6], [x + 64, top + 6], [x + 58, top + 42], [x + 38, top + 42]], {
      wash: on ? '#FFE3A0' : mixCol(L.face, PAL.cream, 0.3), ink: PAL.ink, sw: 0.8
    });
    if (on > 0.05) glow(ctx, x + 48, top + 24, 130 * on, '#FFC766', 0.85 * on);
  }

  function drawBench(ctx, x, y, L) {
    boilSeed('bench' + x);
    const wood = L.sepia ? '#A07A52' : '#8A5E48';
    paint(ctx, rectPts(x - 115, y - 102, 230, 18, 1), { wash: wood, ink: PAL.ink, sw: 0.8 });
    paint(ctx, rectPts(x - 115, y - 74, 230, 18, 1), { wash: wood, ink: PAL.ink, sw: 0.8 });
    paint(ctx, rectPts(x - 122, y - 42, 244, 16, 1), { wash: mixCol(wood, PAL.cream, 0.15), ink: PAL.ink, sw: 0.8 });
    for (const k of [-1, 1]) {
      paint(ctx, rectPts(x + k * 95 - 6, y - 102, 12, 102), { wash: mixCol(wood, PAL.ink, 0.35), ink: PAL.ink, sw: 0.7 });
    }
  }

  // Steam train with sliding doorway & window hooks (ported from opus-video-skills xz_set.js)
  const TRAIN_DOOR = -820;
  const TRAIN_CHIMNEY = -110;
  function drawTrain(ctx, xF, L, dist = 0, o = {}) {
    boilSeed('train');
    const C = L.train, D = L.trainDk, y = RAIL_Y;
    const wheel = (cx, r) => {
      paint(ctx, ellPts(cx, y - r, r, r, 18, 1), { wash: mixCol(D, PAL.ink, 0.4), ink: PAL.ink, sw: 0.9 });
      const a = dist / r;
      for (let k = 0; k < 3; k++) {
        const q = a + (k * Math.PI) / 3;
        inkLine(ctx, [
          [cx - Math.cos(q) * r * 0.82, y - r - Math.sin(q) * r * 0.82],
          [cx + Math.cos(q) * r * 0.82, y - r + Math.sin(q) * r * 0.82]
        ], 0.9, L.trim, 'ink', 0);
      }
    };
    const c0 = xF - 1120, c1 = xF - 450;
    paint(ctx, rrPts(c0, y - 245, c1 - c0, 190, 18, 1.5), { wash: C, fill: D, fillOp: 60, ink: PAL.ink, sw: 1.1 });
    paint(ctx, rectPts(c0, y - 102, c1 - c0, 12), { wash: L.trim, washOp: 220, ink: null });

    for (let i = 0; i < 4; i++) {
      const wx = c0 + 30 + i * 82 + (i > 1 ? 210 : 0), wy = y - 218, ww = 64, wh = 76;
      paint(ctx, rrPts(wx, wy, ww, wh, 8), { wash: o.lit ? '#FFE3A0' : mixCol(L.sky2, PAL.cream, 0.4), ink: PAL.ink, sw: 0.9 });
      if (o.window) o.window(wx, wy, ww, wh, i);
    }

    const dx = xF + TRAIN_DOOR, dw = 116, open = clamp(o.door ?? 0);
    paint(ctx, rectPts(dx - dw / 2, y - 230, dw, 165), { wash: mixCol(D, PAL.ink, 0.5), ink: null });
    if (o.inDoor) {
      o.inDoor(dx, y - 68);
      boilSeed('jamb');
      for (const s of [-1, 1]) {
        const x0 = s < 0 ? dx - dw / 2 - 48 : dx + dw / 2;
        paint(ctx, rectPts(x0, y - 242, 48, 186), { wash: C, fill: D, fillOp: 60, ink: null });
      }
    }
    paint(ctx, rectPts(dx - dw / 2 + dw * open * 0.92, y - 230, dw * (1 - open * 0.92), 165), {
      wash: mixCol(C, D, 0.3), ink: PAL.ink, sw: 1.0
    });
    for (const wx of [c0 + 115, c1 - 115]) { wheel(wx - 34, 28); wheel(wx + 34, 28); }

    // Locomotive front
    const L0 = xF - 435;
    paint(ctx, rrPts(xF - 345, y - 210, 280, 125, 42, 1.5), { wash: C, fill: D, fillOp: 70, ink: PAL.ink, sw: 1.1 });
    paint(ctx, rrPts(L0, y - 290, 130, 205, 10), { wash: C, fill: D, fillOp: 60, ink: PAL.ink, sw: 1.1 });
    paint(ctx, [
      [xF + TRAIN_CHIMNEY - 18, y - 210],
      [xF + TRAIN_CHIMNEY + 18, y - 210],
      [xF + TRAIN_CHIMNEY + 26, y - 290],
      [xF + TRAIN_CHIMNEY - 26, y - 290]
    ], { wash: D, ink: PAL.ink, sw: 1.0 });
    wheel(xF - 305, 48); wheel(xF - 190, 48); wheel(xF - 85, 28);
  }

  // Companion character (`her` / memory partner in golden-rose palette with flower hairpin)
  function drawPartnerWhale(ctx, x, y, u, o = {}) {
    whaleGirl(ctx, x, y, u, Object.assign({}, o, {
      style: o.style || 'ukiyoe',
      hat: o.hat || 'Star Hairpin',
      constructMode: 'pixelRig'
    }));
  }

  // KTV / Storyboard kinetic subtitle overlay
  function drawSubtitleOverlay(ctx, t, puzzleCount) {
    // Top-left Puzzle Counter HUD (`星鲸回忆拼图 N / 9`)
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.76)';
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(22, 18, 245, 42, 10);
    ctx.fill();
    ctx.stroke();

    drawPuzzlePiece(ctx, 48, 39, 13, '#FACC15', t * 0.8, false);
    ctx.font = 'bold 18px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
    ctx.fillStyle = '#F8FAFC';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`回忆拼图: ${puzzleCount} / 9`, 72, 40);

    // Top-right Song Title Badge
    ctx.fillStyle = 'rgba(15, 23, 42, 0.76)';
    ctx.strokeStyle = '#F472B6';
    ctx.beginPath();
    ctx.roundRect(895, 18, 362, 42, 10);
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = 'right';
    ctx.fillStyle = '#FDE047';
    ctx.fillText('椰子水很甜 ·《把回忆拼好给你》', 1242, 40);
    ctx.restore();

    let active = null;
    for (let i = 0; i < LYRICS.length; i++) {
      if (t >= LYRICS[i].t0 && t < LYRICS[i].t1) {
        active = LYRICS[i];
        break;
      }
    }
    if (!active) return;

    const dur = active.t1 - active.t0;
    const prog = clamp((t - active.t0) / Math.max(0.3, dur * 0.72), 0, 1);
    const hasHi = active.hi && prog > 0.35;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
    ctx.strokeStyle = hasHi ? '#FACC15' : '#38BDF8';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.roundRect(210, 636, 860, 56, 14);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 28px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const totalW = ctx.measureText(active.text).width;
    const xLeft = 640 - totalW / 2;

    // Base cream text + dark outline
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#090D1A';
    ctx.strokeText(active.text, 640, 664);
    ctx.fillStyle = '#F8FAFC';
    ctx.fillText(active.text, 640, 664);

    // Karaoke left-to-right golden fill (ported from opus-video-skills src/karaoke.js!)
    ctx.save();
    ctx.beginPath();
    ctx.rect(xLeft - 4, 634, (totalW + 8) * prog, 60);
    ctx.clip();
    ctx.fillStyle = '#FACC15';
    ctx.fillText(active.text, 640, 664);
    ctx.restore();

    ctx.restore();
  }

  // ==========================================================================
  // 42 High-Density Animated Shots (`SHOT_TABLE`)
  // Every shot has:
  //   - Camera choreography (`camBegin`/`camEnd`)
  //   - Real character locomotion (`stroll`, `runTo`, `turn`, `jump`, `kneel`, `arcPt`)
  //   - Visual cause -> effect event & seam transitions (`brushWipe`, `smokeWipe`, `curtains`, `iris`)
  // ==========================================================================
  function renderBaHuiyiFrame(ctx, t) {
    let puzzleCount = 0;
    if (t >= 10.5) puzzleCount = 1;
    if (t >= 25.7) puzzleCount = 2;
    if (t >= 35.8) puzzleCount = 3;
    if (t >= 48.5) puzzleCount = 4;
    if (t >= 58.6) puzzleCount = 5;
    if (t >= 68.7) puzzleCount = 6;
    if (t >= 78.8) puzzleCount = 7;
    if (t >= 91.5) puzzleCount = 8;
    if (t >= 109.2) puzzleCount = 9;

    ctx.save();

    // ========================================================================
    // CHAPTER 1 (0.00s – 20.66s, Bars 00–07, Shots 1–6):
    // Dusk Seaside Station & The Scattered Puzzle Box (`LOOK.dusk`)
    // ========================================================================
    if (t < B(4)) {
      // SHOT 1 (0.00 – 2.95s): Iris open on dusk station bench; whaleGirl sits holding the wooden puzzle box
      const lt = t;
      setActiveStyle('watercolor');
      camBegin(ctx, 640 + 25 * Math.sin(lt * 0.7), 470 - 12 * lt, 1.18 + 0.05 * lt);
      drawSkyAndTown(ctx, LOOK.dusk, t);
      drawPlatformAndTrack(ctx, LOOK.dusk);
      drawLampPost(ctx, 320, LOOK.dusk, 0.7);
      drawBench(ctx, 640, 610, LOOK.dusk);
      const m = emotions(lt, [[0, 'wistful'], [1.5, 'curious']], { take: 0.7 });
      whaleGirl(ctx, 640, 585, 25, Object.assign({}, m, {
        t, view: 'q', style: 'watercolor', hat: 'Side Bow',
        armR: holdPuzzle('#FACC15', lt * 0.5)
      }));
      const at = toScreen(640, 480);
      camEnd(ctx);
      if (lt < 0.75) iris(ctx, at[0], at[1], lerp(10, 950, easeOut(lt / 0.75)), PAL.night);

    } else if (t < B(8)) {
      // SHOT 2 (2.95 – 5.48s): Close-up — A gust of sea wind blows 9 glowing puzzle pieces out of the box!
      const lt = t - B(4);
      setActiveStyle('watercolor');
      camBegin(ctx, 660, 460, 1.38);
      drawSkyAndTown(ctx, LOOK.dusk, t);
      drawPlatformAndTrack(ctx, LOOK.dusk);
      drawBench(ctx, 560, 610, LOOK.dusk);
      const m = emotions(lt, [[0, 'surprised'], [1.1, 'panic']], { take: 1.0 });
      const jmp = jump(lt, 0.25, 0.75, 1.2);
      whaleGirl(ctx, 560, 585, 27, Object.assign({}, m, jmp, {
        t, view: 'q', style: 'watercolor', aL: 1.25, aR: 1.35
      }));
      // 9 glowing puzzle pieces swirling into the air along parabolic arcs
      for (let i = 0; i < 9; i++) {
        const k = clamp((lt - i * 0.08) / 2.1, 0, 1);
        const p = arcPt([580, 490], [740 + i * 55, 240 + (i % 3) * 85], 130 + (i % 4) * 35, k);
        drawPuzzlePiece(ctx, p[0], p[1], 18, ['#FACC15', '#38BDF8', '#F472B6'][i % 3], lt * 3 + i);
      }
      camEnd(ctx);

    } else if (t < B(12)) {
      // SHOT 3 (5.48 – 8.01s): Tracking shot — whaleGirl walks across the platform searching for the fallen pieces
      const lt = t - B(8);
      const w = stroll(lt, 0.1, 2.3, 380, 780, 25);
      setActiveStyle('watercolor');
      camBegin(ctx, lerp(480, 740, ease(lt / 2.5)), 485, 1.12);
      drawSkyAndTown(ctx, LOOK.dusk, t);
      drawPlatformAndTrack(ctx, LOOK.dusk);
      drawLampPost(ctx, 290, LOOK.dusk, 0.85);
      drawLampPost(ctx, 980, LOOK.dusk, 0.85);
      drawPuzzlePiece(ctx, 835, 602, 18, '#FACC15', Math.sin(t * 3) * 0.2);
      whaleGirl(ctx, w.x, 605, 25, Object.assign({}, feel('determined', t), w, {
        t, style: 'watercolor', hat: 'Side Bow'
      }));
      CAST.miniWhale(ctx, w.x - 110, 470 + Math.sin(t * 4) * 14, 18, { t });
      camEnd(ctx);

    } else if (t < B(16)) {
      // SHOT 4 (8.01 – 10.54s): Kneeling close-up — whaleGirl kneels down (`kneel`) and picks up Piece #1!
      const lt = t - B(12);
      const kneelAmt = lt < 1.2 ? ease(seg(lt, 0.2, 0.9)) : 1 - ease(seg(lt, 1.4, 2.1));
      const picked = lt >= 1.15;
      setActiveStyle('watercolor');
      camBegin(ctx, 760, 515, 1.32);
      drawSkyAndTown(ctx, LOOK.dusk, t);
      drawPlatformAndTrack(ctx, LOOK.dusk);
      if (!picked) {
        drawPuzzlePiece(ctx, 830, 606, 20, '#FACC15', 0.15);
      }
      const m = emotions(lt, [[0, 'curious'], [1.15, 'happy']], { take: 0.9 });
      whaleGirl(ctx, 750, 605, 26, Object.assign({}, m, {
        t, view: 'q', kneel: kneelAmt, style: 'watercolor',
        aR: picked ? 1.25 : -0.85,
        armR: picked ? holdPuzzle('#FACC15', lt * 2) : null
      }));
      camEnd(ctx);

    } else if (t < B(24)) {
      // SHOT 5 (10.54 – 15.60s): Spin & joy — whaleGirl turns (`turn()`) holding glowing Piece #1 high as warm memories shimmer
      const lt = t - B(16);
      setActiveStyle('watercolor');
      camBegin(ctx, 640, 470, lerp(1.22, 1.05, ease(lt / 5.0)));
      drawSkyAndTown(ctx, LOOK.dusk, t);
      drawPlatformAndTrack(ctx, LOOK.dusk);
      drawPuzzleBoard(ctx, 360, 340, 150, 1, t, 0.55);
      const trn = lt < 1.2 ? turn(lt, 0.2, 0.9, 'q', 'front') : { view: 'front' };
      const jmp = jump(lt, 1.4, 2.1, 1.4);
      whaleGirl(ctx, 680, 600, 26, Object.assign({}, feel('excited', t), trn, jmp, {
        t, style: 'watercolor', aR: 1.35, armR: holdPuzzle('#FACC15', t * 2)
      }));
      CAST.bionicPuppy(ctx, 860, 605, 18, { t, flip: true });
      camEnd(ctx);

    } else if (t < B(32)) {
      // SHOT 6 (15.60 – 20.66s): Energetic run (`runTo`) along the seaside promenade into the sepia brush wipe!
      const lt = t - B(24), dur = B(32) - B(24);
      const r = runTo(lt, 0.1, dur - 0.2, 220, 1040, 26);
      setActiveStyle('watercolor');
      camBegin(ctx, lerp(360, 920, ease(lt / dur)), 480, 1.08);
      drawSkyAndTown(ctx, LOOK.dusk, t);
      drawPlatformAndTrack(ctx, LOOK.dusk);
      drawLampPost(ctx, 420, LOOK.dusk, 1);
      drawLampPost(ctx, 880, LOOK.dusk, 1);
      whaleGirl(ctx, r.x, 605, 26, Object.assign({}, feel('determined', t), r, {
        t, style: 'watercolor', hat: 'Sailor Cap', armR: holdPuzzle('#FACC15', t * 3)
      }));
      CAST.miniWhale(ctx, r.x - 130, 440 + Math.sin(t * 6) * 18, 20, { t });
      camEnd(ctx);
      if (lt > dur - 0.45) brushWipe(ctx, (lt - (dur - 0.45)) / 0.9, ['#9A7250', '#D8BE8E']);

    // ========================================================================
    // CHAPTER 2 (20.66s – 40.90s, Bars 08–15, Shots 7–13):
    // Sepia Summer Memory Lane & Coconut Stand (`LOOK.sepia` + `filmFX`)
    // ========================================================================
    } else if (t < B(40)) {
      // SHOT 7 (20.66 – 25.72s): Sepia memory wipe opens — strolling together down sunlit memory lane!
      const lt = t - B(32), dur = B(40) - B(32);
      setActiveStyle('ukiyoe');
      const w1 = stroll(lt, 0.2, dur - 0.3, 300, 620, 25);
      const w2 = stroll(lt, 0.2, dur - 0.3, 450, 770, 24);
      camBegin(ctx, lerp(440, 680, ease(lt / dur)), 485, 1.12);
      drawSkyAndTown(ctx, LOOK.sepia, t);
      drawPlatformAndTrack(ctx, LOOK.sepia);
      whaleGirl(ctx, w1.x, 605, 25, Object.assign({}, feel('happy', t), w1, {
        t, style: 'ukiyoe', hat: 'Summer Straw Hat'
      }));
      drawPartnerWhale(ctx, w2.x, 605, 24, Object.assign({}, feel('love', t + 0.4), w2, {
        t: t + 0.4, flip: true, hat: 'Star Hairpin'
      }));
      drawPuzzlePiece(ctx, 695, 385 + Math.sin(t * 4) * 12, 20, '#38BDF8', t * 1.5);
      camEnd(ctx);
      filmFX(ctx, t);
      if (lt < 0.45) brushWipe(ctx, 0.5 + lt / 0.9, ['#9A7250', '#D8BE8E']);

    } else if (t < B(48)) {
      // SHOT 8 (25.72 – 30.78s): Seaside Coconut Stand ("椰子水很甜") — clinking fresh coconuts & dancing on the beat!
      const lt = t - B(40);
      setActiveStyle('ukiyoe');
      camBegin(ctx, 640, 490, 1.22 + 0.04 * Math.sin(lt * 2));
      drawSkyAndTown(ctx, LOOK.sepia, t);
      drawPlatformAndTrack(ctx, LOOK.sepia);
      // Bamboo coconut stall counter
      paint(ctx, rectPts(460, 480, 360, 125, 2), { wash: '#B45309', fill: '#78350F', fillOp: 80, ink: PAL.ink, sw: 1.2 });
      paint(ctx, [[430, 340], [640, 280], [850, 340]], { wash: '#F59E0B', ink: PAL.ink, sw: 1.2 });
      const d1 = move('bounce', t);
      whaleGirl(ctx, 520, 605, 26, Object.assign({}, feel('happy', t), d1, {
        t, view: 'q', style: 'ukiyoe', hat: 'Summer Straw Hat',
        aR: 0.95 + 0.25 * Math.sin(t * 8), armR: holdCoconut
      }));
      drawPartnerWhale(ctx, 760, 605, 25, Object.assign({}, feel('laugh', t), d1, {
        t, view: 'q', flip: true,
        aL: 0.95 + 0.25 * Math.sin(t * 8), armL: holdCoconut
      }));
      drawPuzzleBoard(ctx, 230, 360, 140, 2, t, 0.5);
      camEnd(ctx);
      filmFX(ctx, t);

    } else if (t < B(56)) {
      // SHOT 9 (30.78 – 35.84s): Polaroid Jump Snapshot! Both leap high (`jump()`) as the camera flashes!
      const lt = t - B(48);
      setActiveStyle('ukiyoe');
      const j1 = jump(lt, 1.1, 2.2, 2.2);
      const j2 = jump(lt, 1.15, 2.25, 2.0);
      const isFlash = lt > 1.75 && lt < 1.95;
      camBegin(ctx, 640, 465, 1.16);
      drawSkyAndTown(ctx, LOOK.sepia, t);
      drawPlatformAndTrack(ctx, LOOK.sepia);
      whaleGirl(ctx, 535, 600, 26, Object.assign({}, feel('excited', t), j1, {
        t, view: 'front', style: 'ukiyoe', hat: 'Summer Straw Hat',
        aR: 1.35, armR: holdCamera(isFlash ? 1 : 0)
      }));
      drawPartnerWhale(ctx, 745, 600, 25, Object.assign({}, feel('playful', t), j2, {
        t, view: 'front', flip: true, aL: 1.4, aR: 1.4
      }));
      drawPuzzlePiece(ctx, 640, 310, 22, '#F472B6', t * 2);
      camEnd(ctx);
      if (isFlash) flash(ctx, 0.45 * Math.sin(((lt - 1.75) / 0.2) * Math.PI), '#FFFBEB');
      filmFX(ctx, t);

    } else if (t < B(64)) {
      // SHOT 10 (35.84 – 40.90s): Throwing the Paper Airplane across the golden bridge -> Curtains close into Chapter 3!
      const lt = t - B(56), dur = B(64) - B(56);
      setActiveStyle('ukiyoe');
      const r = stroll(lt, 0.1, 1.8, 340, 580, 25);
      const thrown = lt >= 1.6;
      camBegin(ctx, lerp(480, 760, ease(lt / dur)), 470, 1.1);
      drawSkyAndTown(ctx, LOOK.sepia, t);
      drawPlatformAndTrack(ctx, LOOK.sepia);
      whaleGirl(ctx, r.x, 600, 26, Object.assign({}, feel('hopeful', t), r, {
        t, style: 'ukiyoe', aR: thrown ? 1.35 : 0.65,
        armR: !thrown ? holdPlane : null
      }));
      if (thrown) {
        const k = clamp((lt - 1.6) / 2.8, 0, 1);
        const p = arcPt([595, 470], [1160, 240], 160, k);
        ctx.save();
        ctx.translate(p[0], p[1]);
        ctx.rotate(-0.25 + k * 0.35);
        holdPlane(ctx, 34);
        ctx.restore();
        drawPuzzlePiece(ctx, p[0] - 45, p[1] + 20, 18, '#FACC15', t * 3);
      }
      camEnd(ctx);
      filmFX(ctx, t);
      if (lt > dur - 0.85) curtains(ctx, seg(lt, dur - 0.85, dur), t);

    // ========================================================================
    // CHAPTER 3 (40.90s – 61.14s, Bars 16–23, Shots 11–16):
    // Rainy Departure Station & Train Window Tear (`LOOK.rain` — homage to `xz_shots.js` Shots B–E!)
    // ========================================================================
    } else if (t < B(72)) {
      // SHOT 11 (40.90 – 45.96s): Curtains open on rainy night station; partner walks & hops into the train doorway!
      const lt = t - B(64);
      setActiveStyle('watercolor');
      const xf = 1180, doorX = xf + TRAIN_DOOR; // 360
      camBegin(ctx, 620, 465, 1.08);
      drawSkyAndTown(ctx, LOOK.rain, t);
      drawTrain(ctx, xf, LOOK.rain, 0, {
        lit: true,
        door: 1 - ease(seg(lt, 3.6, 4.4)),
        inDoor: lt > 2.4 ? (dx, fy) => {
          drawPartnerWhale(ctx, dx, fy + 62, 21, Object.assign({}, feel('sad', t), turn(lt, 2.4, 2.8, 'side', 'front'), { t }));
        } : null
      });
      drawPlatformAndTrack(ctx, LOOK.rain);
      drawLampPost(ctx, 940, LOOK.rain, 1);

      if (lt <= 2.4) {
        const w = stroll(lt, 0.3, 1.8, 560, doorX, 23);
        const jmp = lt > 1.8 ? jump(lt, 1.8, 2.4, 1.6) : { dy: 0, sq: 0 };
        drawPartnerWhale(ctx, w.x, 600, lerp(24, 21, seg(lt, 1.8, 2.4)), Object.assign({}, feel('sad', t), w, jmp, {
          t, flip: true
        }));
      }
      // whaleGirl steps after with reaching hand!
      const wMe = stroll(lt, 1.6, 3.4, 820, 580, 25);
      whaleGirl(ctx, wMe.x, 605, 25, Object.assign({}, feel('panic', t), wMe, {
        t, style: 'watercolor', flip: true, aL: 1.25
      }));
      camEnd(ctx);
      if (lt < 0.75) curtains(ctx, 1 - lt / 0.75, t);

    } else if (t < B(80)) {
      // SHOT 12 (45.96 – 51.02s): POV Train Window Close-Up (homage to `xz_shots.js` Shot D!) — tears & hand pressed to glass
      const lt = t - B(72), dur = B(80) - B(72);
      const slide = 950 * easeIn(seg(lt, 3.1, dur));
      const shk = lt > 2.8 ? shakeXY(t, 3) : [0, 0];
      setActiveStyle('watercolor');
      camBegin(ctx, 640 + shk[0], 360 + shk[1], 1.0 + 0.04 * seg(lt, 0, 3.0));
      const wx = 360 + slide, wy = 110, ww = 560, wh = 430;
      paint(ctx, rectPts(wx - 30, wy - 30, ww + 60, wh + 60), { wash: '#5E4430', ink: null });
      const press = ease(seg(lt, 1.4, 2.1));
      drawPartnerWhale(ctx, wx + ww / 2, wy + 465, 44, Object.assign({}, feel('cry', t), {
        t, view: 'front', aR: lerp(0.3, 1.35, press)
      }));
      if (press > 0.4) {
        paint(ctx, ellPts(wx + ww / 2 + 165, wy + 195, 34, 30, 14), { fill: PAL.cream, fillOp: 85, ink: null });
      }
      // Carriage wall framing the window
      const C = LOOK.rain.train;
      paint(ctx, rectPts(-1500, -150, W + 3000, wy + 150), { wash: C, ink: null });
      paint(ctx, rectPts(-1500, wy + wh, W + 3000, 450), { wash: C, ink: null });
      paint(ctx, rectPts(-1500, wy - 5, wx + 1500, wh + 10), { wash: C, ink: null });
      paint(ctx, rectPts(wx + ww, wy - 5, W + 1500, wh + 10), { wash: C, ink: null });
      paint(ctx, rrPts(wx, wy, ww, wh, 26), { ink: PAL.ink, sw: 2.2 });
      drawPuzzlePiece(ctx, wx + ww / 2 - 140, wy + 150, 22, '#38BDF8', t * 2);
      camEnd(ctx);

    } else if (t < B(88)) {
      // SHOT 13 (51.02 – 56.08s): Sprinting after the accelerating steam train! (`runTo` + billowing steam!)
      const lt = t - B(80), dur = B(88) - B(80);
      setActiveStyle('watercolor');
      const xf = 980 + 185 * Math.pow(lt + 0.5, 1.85);
      const r = runTo(lt, 0.1, 3.6, 320, 920, 26);
      camBegin(ctx, lerp(540, 820, ease(lt / dur)), 465, 1.0);
      drawSkyAndTown(ctx, LOOK.rain, t);
      drawTrain(ctx, xf, LOOK.rain, xf - 980, { lit: true, door: 0 });
      drawPlatformAndTrack(ctx, LOOK.rain);
      whaleGirl(ctx, r.x, 605, 26, Object.assign({}, feel(lt < 3.4 ? 'determined' : 'cry', t), r, {
        t, style: 'watercolor', aR: lt >= 3.4 ? 1.35 + 0.35 * Math.sin(t * 10) : undefined
      }));
      camEnd(ctx);

    } else if (t < B(96)) {
      // SHOT 14 (56.08 – 61.14s): Leaping over rain puddles & catching Piece #5 in the smoke wipe!
      const lt = t - B(88), dur = B(96) - B(88);
      setActiveStyle('watercolor');
      camBegin(ctx, 640, 485, 1.22);
      drawSkyAndTown(ctx, LOOK.rain, t);
      drawPlatformAndTrack(ctx, LOOK.rain);
      const jmp = jump(lt, 0.8, 1.9, 2.2);
      const p = lt > 0.8 && lt < 1.9 ? arcPt([460, 605], [760, 605], 110, seg(lt, 0.8, 1.9)) : [lt <= 0.8 ? 460 : 760, 605];
      whaleGirl(ctx, p[0], p[1], 26, Object.assign({}, feel('heroic', t), jmp, {
        t, view: 'q', style: 'watercolor', aR: 1.35, armR: holdPuzzle('#38BDF8', t * 3)
      }));
      drawPuzzleBoard(ctx, 250, 350, 145, 5, t, 0.6);
      camEnd(ctx);
      if (lt > dur - 0.9) smokeWipe(ctx, (lt - (dur - 0.9)) / 1.8);

    // ========================================================================
    // CHAPTER 4 (61.14s – 81.39s, Bars 24–31, Shots 15–19):
    // Twilight Lighthouse Studio & Paper Plane Over the Sea (`LOOK.twilight`)
    // ========================================================================
    } else if (t < B(104)) {
      // SHOT 15 (61.14 – 66.21s): Smoke clears in the Lighthouse Studio — walking from window to the easel!
      const lt = t - B(96);
      setActiveStyle('risograph');
      const w = stroll(lt, 0.4, 3.6, 300, 680, 26);
      camBegin(ctx, lerp(480, 660, ease(lt / 5.0)), 475, 1.14);
      paint(ctx, rectPts(-300, -200, W + 600, 900), { wash: '#2B1D47', ink: null });
      // Arched lighthouse window showing twilight sky, moon, sea horizon & mullions
      paint(ctx, rrPts(180, 150, 260, 320, 40), { wash: '#1E1B4B', fill: LOOK.twilight.sky2, fillOp: 135, ink: PAL.ink, sw: 2.2 });
      paint(ctx, rectPts(186, 360, 248, 104), { wash: '#1D4ED8', ink: PAL.ink, sw: 1.0 });
      paint(ctx, ellPts(365, 225, 28, 28, 14), { wash: '#FEF08A', ink: PAL.ink, sw: 1.0 });
      inkLine(ctx, [[310, 154], [310, 466]], 2.2, PAL.ink, 'ink', 0);
      inkLine(ctx, [[184, 310], [436, 310]], 2.2, PAL.ink, 'ink', 0);
      drawPuzzleBoard(ctx, 880, 390, 185, 5, t, 0.65);
      whaleGirl(ctx, w.x, 600, 26, Object.assign({}, feel('determined', t), w, {
        t, style: 'risograph', hat: 'Beret', armR: holdBrush('#F472B6')
      }));
      camEnd(ctx);
      if (lt < 0.9) smokeWipe(ctx, 0.5 + lt / 1.8);

    } else if (t < B(112)) {
      // SHOT 16 (66.21 – 71.27s): Close-up at the Easel — painting the 6th glowing puzzle piece into the board!
      const lt = t - B(104);
      setActiveStyle('risograph');
      camBegin(ctx, 760, 445, 1.34);
      paint(ctx, rectPts(-300, -200, W + 600, 900), { wash: '#2B1D47', ink: null });
      drawPuzzleBoard(ctx, 860, 395, 200, lt > 2.2 ? 6 : 5, t, 0.75);
      whaleGirl(ctx, 640, 595, 27, Object.assign({}, feel('happy', t), {
        t, view: 'q', style: 'risograph', hat: 'Beret',
        aR: 0.95 + 0.35 * Math.sin(t * 9),
        armR: holdBrush('#FACC15')
      }));
      camEnd(ctx);

    } else if (t < B(120)) {
      // SHOT 17 (71.27 – 76.33s): Launching the glowing paper airplane out the lighthouse window over the ocean!
      const lt = t - B(112);
      setActiveStyle('risograph');
      camBegin(ctx, lerp(420, 780, ease(lt / 5.0)), 440, 1.08);
      drawSkyAndTown(ctx, LOOK.twilight, t);
      // Ocean waves below
      for (let l = 0; l < 3; l++) {
        paint(ctx, rectPts(-400, 520 + l * 55, W + 800, 90), {
          wash: l % 2 ? '#1E3A8A' : '#1D4ED8', ink: PAL.ink, sw: 1.0
        });
      }
      const p = arcPt([260, 460], [1060, 280], 170, ease(lt / 4.8));
      ctx.save();
      ctx.translate(p[0], p[1]);
      ctx.rotate(-0.18 + (lt / 4.8) * 0.32);
      holdPlane(ctx, 42);
      ctx.restore();
      CAST.miniWhale(ctx, p[0] - 90, 500 + Math.sin(t * 5) * 24, 22, { t });
      whaleGirl(ctx, 240, 540, 24, Object.assign({}, feel('hopeful', t), {
        t, view: 'q', style: 'risograph', aR: 1.35
      }));
      camEnd(ctx);

    } else if (t < B(128)) {
      // SHOT 18 (76.33 – 81.39s): Catching Piece #7 on the lighthouse balcony as twilight turns to starry night!
      const lt = t - B(120), dur = B(128) - B(120);
      setActiveStyle('risograph');
      const jmp = jump(lt, 1.2, 2.3, 1.8);
      camBegin(ctx, 640, 465, 1.18);
      drawSkyAndTown(ctx, LOOK.twilight, t);
      drawPlatformAndTrack(ctx, LOOK.twilight);
      whaleGirl(ctx, 640, 595, 26, Object.assign({}, feel('starstruck', t), jmp, {
        t, view: 'front', style: 'risograph', hat: 'Crown',
        aR: 1.4, armR: holdPuzzle('#34D399', t * 2)
      }));
      drawPuzzleBoard(ctx, 960, 345, 155, 7, t, 0.7);
      camEnd(ctx);
      if (lt > dur - 0.5) brushWipe(ctx, (lt - (dur - 0.5)) / 1.0, ['#1E1B4B', '#38BDF8']);

    // ========================================================================
    // CHAPTER 5 (81.39s – 101.63s, Bars 32–39, Shots 19–22):
    // Midnight Starry Attic & Assembling the 8 Pieces (`LOOK.night` + `spotDark`)
    // ========================================================================
    } else if (t < B(136)) {
      // SHOT 19 (81.39 – 86.45s): Under a warm spotlight (`spotDark`), whaleGirl kneels to assemble the puzzle on the floor
      const lt = t - B(128);
      setActiveStyle('neon');
      const kneelK = ease(seg(lt, 0.3, 1.2));
      camBegin(ctx, 640, 500, 1.26);
      drawSkyAndTown(ctx, LOOK.night, t);
      drawPlatformAndTrack(ctx, LOOK.night);
      drawPuzzleBoard(ctx, 790, 520, 155, 7, t, 0.75);
      whaleGirl(ctx, 565, 600, 26, Object.assign({}, feel('wistful', t), {
        t, view: 'q', style: 'neon', kneel: kneelK,
        aR: 0.65 + 0.25 * Math.sin(t * 5), armR: holdPuzzle('#A78BFA', t)
      }));
      const at = toScreen(675, 510);
      camEnd(ctx);
      spotDark(ctx, at[0], at[1], 360, 0.72, '#050814');
      if (lt < 0.5) brushWipe(ctx, 0.5 + lt / 1.0, ['#1E1B4B', '#38BDF8']);

    } else if (t < B(144)) {
      // SHOT 20 (86.45 – 91.51s): Snapping Piece #8 into place -> 8/9 pieces glow, only the center Heart Piece #9 is missing!
      const lt = t - B(136);
      setActiveStyle('neon');
      camBegin(ctx, 680, 480, 1.35);
      drawSkyAndTown(ctx, LOOK.night, t);
      drawPlatformAndTrack(ctx, LOOK.night);
      const has8 = lt >= 1.8;
      drawPuzzleBoard(ctx, 770, 460, 185, has8 ? 8 : 7, t, has8 ? 0.95 : 0.6);
      const m = emotions(lt, [[0, 'determined'], [1.8, 'surprised']], { take: 0.9 });
      whaleGirl(ctx, 545, 595, 26, Object.assign({}, m, {
        t, view: 'q', style: 'neon',
        aR: has8 ? 1.25 : 0.45,
        armR: !has8 ? holdPuzzle('#FBBF24', t * 2) : null
      }));
      camEnd(ctx);

    } else if (t < B(152)) {
      // SHOT 21 (91.51 – 96.57s): Camera tilts up — Piece #9 (the Golden Heart Star) shines high in the night sky!
      const lt = t - B(144);
      setActiveStyle('neon');
      const cy = kf(lt, [[0, 490], [1.8, 395], [5.0, 385]]);
      camBegin(ctx, 640, cy, 1.12);
      drawSkyAndTown(ctx, LOOK.night, t);
      drawPlatformAndTrack(ctx, LOOK.night);
      // Glowing 9th puzzle piece high in the stars at y = 210
      drawPuzzlePiece(ctx, 640, 210 + Math.sin(t * 3) * 12, 34, '#FACC15', t * 1.2, true);
      whaleGirl(ctx, 640, 585, 26, Object.assign({}, feel('hopeful', t), {
        t, view: 'front', style: 'neon', lookY: -1, aL: 1.15, aR: 1.15
      }));
      camEnd(ctx);

    } else if (t < B(160)) {
      // SHOT 22 (96.57 – 101.63s): Pre-Drop Sprint! whaleGirl runs across the rooftop (`runTo`) toward the starlight launchpad!
      const lt = t - B(152), dur = B(160) - B(152);
      const r = runTo(lt, 0.1, dur - 0.1, 200, 1020, 26);
      setActiveStyle('neon');
      camBegin(ctx, lerp(340, 900, ease(lt / dur)), 475, 1.12);
      drawSkyAndTown(ctx, LOOK.night, t);
      drawPlatformAndTrack(ctx, LOOK.night);
      whaleGirl(ctx, r.x, 600, 26, Object.assign({}, feel('heroic', t), r, {
        t, style: 'neon', hat: 'Crown'
      }));
      CAST.miniWhale(ctx, r.x - 120, 440, 20, { t });
      CAST.bionicPuppy(ctx, r.x - 210, 600, 18, { t });
      camEnd(ctx);

    // ========================================================================
    // CHAPTER 6 (101.63s – 142.11s, Bars 40–55, Shots 23–28):
    // Final Drop Climax: Catching Piece #9, Star-Whale Flight & Dawn Reunion!
    // ========================================================================
    } else if (t < B(168)) {
      // SHOT 23 (101.63 – 106.69s): BIG DROP! Giant Leap into the Starry Sky (`jump` + `arcPt`) to catch Piece #9!
      const lt = t - B(160), dur = B(168) - B(160);
      setActiveStyle('neon');
      const k = easeOut(clamp(lt / (dur * 0.75), 0, 1));
      const p = arcPt([340, 580], [640, 385], 120, k);
      camBegin(ctx, lerp(480, 640, k), lerp(480, 345, k), lerp(1.05, 1.20, k));
      drawSkyAndTown(ctx, LOOK.night, t);
      for (let i = 1; i < 7; i++) {
        const tp = arcPt([340, 580], [640, 385], 120, Math.max(0, k - i * 0.05));
        paint(ctx, starPts(tp[0], tp[1], 18 - i * 2, 0.35, 4), { wash: '#FACC15', ink: null });
      }
      if (k < 0.92) {
        drawPuzzlePiece(ctx, 640, 275, 32, '#FACC15', t * 3, true);
      }
      whaleGirl(ctx, p[0], p[1], 26, Object.assign({}, feel('ecstatic', t), {
        t, view: 'q', style: 'neon', hat: 'Crown',
        aR: 1.45, armR: k >= 0.92 ? holdPuzzle('#FACC15', t * 4) : null
      }));
      camEnd(ctx);
      if (lt > 3.8 && lt < 4.1) flash(ctx, Math.sin(((lt - 3.8) / 0.3) * Math.PI) * 0.65, '#FEF08A');

    } else if (t < B(176)) {
      // SHOT 24 (106.69 – 111.75s): All 9/9 Puzzle Pieces Lock Together & Burst into Golden Starlight!
      const lt = t - B(168);
      setActiveStyle('neon');
      camBegin(ctx, 640, 430, 1.22 + 0.08 * Math.sin(lt * 3));
      drawSkyAndTown(ctx, LOOK.night, t);
      drawPuzzleBoard(ctx, 640, 340, 240, 9, t, 1.0);
      // Ring of bursting stars around the completed 9/9 board
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU + t * 1.2;
        const d = 155 + Math.sin(t * 6 + i) * 25;
        paint(ctx, starPts(640 + Math.cos(a) * d, 340 + Math.sin(a) * d, 16, 0.38, 4), { wash: '#FEF08A', ink: null });
      }
      const sp = spinView(t, 5.0);
      whaleGirl(ctx, 370, 565, 25, Object.assign({}, feel('love', t), sp, {
        t, style: 'neon', hat: 'Crown', aL: 1.3, aR: 1.3
      }));
      drawPartnerWhale(ctx, 910, 565, 25, Object.assign({}, feel('happy', t), {
        t, view: 'q', flip: true, aL: 1.3, aR: 1.3
      }));
      camEnd(ctx);

    } else if (t < B(192)) {
      // SHOT 25 (111.75 – 121.87s): The Completed Puzzle Transforms into the Giant Bioluminescent Star-Whale!
      // whaleGirl rides above the Star-Whale across the galaxy (`drawStarWhale` + `arcPt` flight!)
      const lt = t - B(176), dur = B(192) - B(176);
      setActiveStyle('neon');
      const k = clamp(lt / dur, 0, 1);
      const wp = [lerp(240, 1040, k), 340 + Math.sin(t * 2.2) * 55];
      const ang = Math.cos(t * 2.2) * 0.18;
      camBegin(ctx, wp[0], wp[1], 1.08);
      drawSkyAndTown(ctx, LOOK.night, t);
      drawStarWhale(ctx, wp[0], wp[1], 230, ang, t);
      whaleGirl(ctx, wp[0] + 25, wp[1] - 75, 23, Object.assign({}, feel('ecstatic', t), {
        t, view: 'q', style: 'neon', hat: 'Crown', aL: 1.2, aR: 1.35, noShadow: true
      }));
      CAST.miniWhale(ctx, wp[0] - 240, wp[1] + 65 + Math.sin(t * 5) * 18, 20, { t });
      CAST.miniWhale(ctx, wp[0] + 250, wp[1] - 85 + Math.cos(t * 5) * 18, 18, { t });
      camEnd(ctx);
      if (lt > dur - 0.5) brushWipe(ctx, (lt - (dur - 0.5)) / 1.0, ['#F472B6', '#FDE047']);

    } else if (t < B(208)) {
      // SHOT 26 (121.87 – 132.00s): Dawn Train Arrives at the Seaside Station! Reunion on the platform!
      const lt = t - B(192), dur = B(208) - B(192);
      setActiveStyle('watercolor');
      const xf = lt < 4.5 ? lerp(-200, 1180, easeOut(lt / 4.5)) : 1180;
      const doorX = 1180 + TRAIN_DOOR; // 360
      camBegin(ctx, 640, 475, 1.06);
      drawSkyAndTown(ctx, LOOK.dawn, t);
      drawTrain(ctx, xf, LOOK.dawn, xf + 200, {
        lit: true,
        door: ease(seg(lt, 4.2, 5.0))
      });
      drawPlatformAndTrack(ctx, LOOK.dawn);
      drawLampPost(ctx, 980, LOOK.dawn, 0.4);

      // Partner hops out of the train door and walks to meet whaleGirl in the center!
      const wHer = stroll(lt, 4.8, 8.2, doorX, 565, 24);
      const wMe = stroll(lt, 4.8, 8.2, 880, 695, 25);
      if (lt >= 4.5) {
        drawPartnerWhale(ctx, wHer.x, 600, 24, Object.assign({}, feel('love', t), wHer, {
          t, armR: holdCoconut
        }));
      }
      whaleGirl(ctx, wMe.x, 600, 25, Object.assign({}, feel('happy', t), wMe, {
        t, style: 'watercolor', flip: true, hat: 'Summer Straw Hat',
        armL: holdPuzzle('#FACC15', t * 2)
      }));
      camEnd(ctx);
      if (lt < 0.5) brushWipe(ctx, 0.5 + lt / 1.0, ['#F472B6', '#FDE047']);

    } else {
      // SHOT 27 (132.00 – 142.11s): Grand Finale Rhyme — Sitting together on the station bench at sunrise,
      // the completed 9/9 Star-Whale Puzzle rises into the sky & Iris closes on the winking Star!
      const lt = t - B(208), dur = DURATION - B(208);
      setActiveStyle('watercolor');
      const cy = kf(lt, [[0, 485], [4.5, 485], [7.5, 220], [dur, 200]]);
      camBegin(ctx, 640, cy, lerp(1.12, 1.24, seg(lt, 4.5, 8.5)));
      drawSkyAndTown(ctx, LOOK.dawn, t);
      drawPlatformAndTrack(ctx, LOOK.dawn);
      drawBench(ctx, 640, 610, LOOK.dawn);

      // Completed puzzle & glowing star high in the dawn sky (rhyming with Shot 1 & Shot G of xz_shots.js!)
      drawPuzzleBoard(ctx, 640, 175, 165, 9, t, 0.95);
      whaleGirl(ctx, 575, 585, 25, Object.assign({}, feel('love', t), {
        t, view: 'front', style: 'watercolor', hat: 'Summer Straw Hat',
        aR: 1.2 + 0.3 * Math.sin(t * 8), armL: holdCoconut
      }));
      drawPartnerWhale(ctx, 705, 585, 24, Object.assign({}, feel('happy', t), {
        t, view: 'front', flip: true, aL: 1.2 + 0.3 * Math.sin(t * 8)
      }));
      CAST.miniWhale(ctx, 410, 480 + Math.sin(t * 4) * 14, 19, { t });
      CAST.bionicPuppy(ctx, 860, 605, 18, { t, flip: true });
      const sp = toScreen(640, 175);
      camEnd(ctx);

      if (t > DURATION - 2.4) {
        const r = t < DURATION - 0.8
          ? lerp(980, 145, ease(seg(t, DURATION - 2.4, DURATION - 0.8)))
          : lerp(145, 0, easeIn(seg(t, DURATION - 0.8, DURATION - 0.05)));
        iris(ctx, sp[0], sp[1], r, '#0F172A');
      }
    }

    drawSubtitleOverlay(ctx, t, puzzleCount);
    ctx.restore();
  }

  const api = {
    DURATION,
    BPM,
    BEAT,
    OFF,
    LYRICS,
    renderBaHuiyiFrame
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.MV_BA_HUIYI = api;
})(typeof window !== 'undefined' ? window : globalThis);
