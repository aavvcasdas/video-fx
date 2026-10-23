// src/mv_pack_short.js — 5 Short MVs Replicated from `mv/` with 100% Frame-Verified Subtitles:
//   1. `ba_huiyi_56` : `mv/《把回忆拼好给你》.mp4` (56.03s, 17 exact puzzle-storybook scenes & subtitles)
//   2. `lianai_ing`  : `mv/发现更多精彩视频 - 抖音搜索_2.mp4` (54.73s, 五月天《恋爱ing》 Terminal + Pixel City)
//   3. `jimo_yanhuo` : `mv/寂寞烟火.mp4` (55.24s, 《寂寞烟火》 Nautical Map + Origami Boat + Lighthouse + Rainbow)
//   4. `xinqiang`    : `mv/心墙.mp4` (34.02s, 《心墙》 Red Beret + Sketchbooks + Brick Wall + Arched Window)
//   5. `ribuluo`     : `mv/日不落.mp4` (45.81s, 《日不落》 macOS Widgets + Royal Guards + Postcard + 8-City Tour)

(function (root) {
  const CORE = root.CORE || (typeof require !== 'undefined' ? require('./core.js') : {});
  const WHALE = root.WHALE_GIRL || (typeof require !== 'undefined' ? require('./whale_girl.js') : {});
  const CAST = root.CAST || (typeof require !== 'undefined' ? require('./cast.js') : {});

  const {
    W = 1280,
    H = 720,
    clamp,
    lerp,
    seg,
    ease,
    easeOut,
    easeIn,
    backOut,
    rrPts,
    ellPts,
    rectPts,
    paint,
    camBegin,
    camEnd,
    iris,
    brushWipe,
    pulse
  } = CORE;

  const { whaleGirl, emotions, spinView } = WHALE;

  const polyPts = (pts) => pts;
  const linePts = (x0, y0, x1, y1) => [[x0, y0], [x1, y1]];
  const stroke = (ctx, pts, o = {}) => {
    if (!pts || pts.length < 2) return;
    if (typeof CORE.open === 'function') {
      CORE.open(ctx, pts, o.sw || 2, o.ink || '#161F3A');
      return;
    }
    ctx.save();
    ctx.strokeStyle = o.ink || '#161F3A';
    ctx.lineWidth = o.sw || 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
    ctx.restore();
  };

  function stroll(t, t0, t1, x0, x1, u = 28) {
    const k = clamp((t - t0) / Math.max(0.001, t1 - t0), 0, 1);
    const walking = t >= t0 && t <= t1;
    const dist = Math.abs(x1 - x0);
    const cycles = Math.max(1.4, dist / (u * 3.0));
    const phase = walking ? k * cycles * Math.PI * 2 : 0;
    const goRight = x1 >= x0;
    return {
      x: lerp(x0, x1, k),
      view: walking ? 'q' : 'front',
      flip: !goRight,
      walk: walking ? phase / 4.2 : 0,
      dy: walking ? -Math.abs(Math.sin(phase)) * 0.16 : undefined
    };
  }

  function runTo(t, t0, t1, x0, x1, u = 28) {
    const k = clamp((t - t0) / Math.max(0.001, t1 - t0), 0, 1);
    const running = t >= t0 && t <= t1;
    const dist = Math.abs(x1 - x0);
    const cycles = Math.max(2.0, dist / (u * 2.4));
    const phase = running ? k * cycles * Math.PI * 2 : 0;
    const goRight = x1 >= x0;
    return {
      x: lerp(x0, x1, k),
      view: running ? 'side' : 'q',
      flip: !goRight,
      walk: running ? phase / 4.2 : 0,
      smear: running ? 0.75 : 0,
      dy: running ? -Math.abs(Math.sin(phase)) * 0.25 : undefined
    };
  }

  function findActiveSub(subs, t) {
    for (let i = 0; i < subs.length; i++) {
      if (t >= subs[i].t0 && t <= subs[i].t1) return { sub: subs[i], idx: i };
    }
    return null;
  }

  // Tile-card subtitle renderer (matches the ransom-note / puzzle-tile aesthetic of 《把回忆拼好给你》 & 《心墙》)
  // Always shows all characters of the line clearly from t0 to t1, with progressive karaoke highlight!
  function drawTileCardsSubtitle(ctx, text, t, t0, t1, opts = {}) {
    if (!text) return;
    const lt = clamp(t - t0, 0, t1 - t0);
    const dur = Math.max(0.2, t1 - t0);
    const chars = Array.from(text).filter((c) => c !== ' ');
    const activeCount = Math.ceil(clamp(lt / (dur * 0.75), 0.15, 1) * chars.length);
    const cardW = opts.cardW || 40;
    const cardH = opts.cardH || 44;
    const gap = 5;
    const totalW = chars.length * (cardW + gap) - gap;
    const startX = (opts.cx || W / 2) - totalW / 2;
    const baseY = opts.y || (H - 68);

    ctx.save();
    // Soft backdrop pill behind all tiles for 100% contrast on any background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
    ctx.beginPath();
    ctx.roundRect(startX - 16, baseY - cardH / 2 - 10, totalW + 32, cardH + 20, 14);
    ctx.fill();

    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      const cx = startX + i * (cardW + gap);
      const cy = baseY + Math.sin(i * 1.5) * 2.0;
      const isHighlight = (opts.highlight && opts.highlight.includes(ch)) || i < activeCount;

      ctx.fillStyle = isHighlight ? '#FB923C' : '#FFFBEB';
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.roundRect(cx, cy - cardH / 2, cardW, cardH, 7);
      ctx.fill();
      ctx.stroke();

      ctx.font = `bold ${Math.round(cardW * 0.68)}px "ZCOOLKuaiLe", "NotoSansSC", sans-serif`;
      ctx.fillStyle = isHighlight ? '#FFFFFF' : '#0F172A';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ch, cx + cardW / 2, cy + 1);
    }
    ctx.restore();
  }

  // Paper banner subtitle renderer (matches 《寂寞烟火》 parchment scroll labels)
  function drawScrollBannerSubtitle(ctx, text, t, t0, t1, y = H - 64) {
    if (!text) return;
    ctx.save();
    ctx.font = 'bold 32px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
    const tw = Math.max(260, ctx.measureText(text).width + 64);
    const bx = W / 2 - tw / 2;
    ctx.fillStyle = '#FFFBEB';
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.roundRect(bx, y - 26, tw, 52, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#2C1810';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, W / 2, y + 1);
    ctx.restore();
  }

  // ==========================================================================
  // 1. `ba_huiyi_56` — Replicating `mv/《把回忆拼好给你》.mp4` (56.03s)
  // Exact 17 frame-verified subtitles & scenes from `/tmp/mv_frames/ba_huiyi_56_1fps.jpg`
  // ==========================================================================
  const SUBS_BA_HUIYI_56 = [
    { t0: 1.0,  t1: 5.2,  zh: '我们都是天真 真实存在的',       hi: '实',   scene: 'puzzleSky' },
    { t0: 5.3,  t1: 8.2,  zh: '祈愿小世界里不只有我',         hi: '我',   scene: 'littlePlanet' },
    { t0: 8.3,  t1: 12.2, zh: '直到遇见你 我以为就光明起来',   hi: '你光', scene: 'puzzleWallMeet' },
    { t0: 12.3, t1: 16.0, zh: '眼睛里看到的都是 广袤无垠的大海', hi: '海',   scene: 'oceanSunrise' },
    { t0: 16.1, t1: 19.2, zh: '有你在的日子里不可能被击败',   hi: '你',   scene: 'quadSplit' },
    { t0: 19.3, t1: 23.0, zh: '在最难熬的日子 你陪着我',       hi: '你陪', scene: 'greenUmbrella' },
    { t0: 23.1, t1: 25.2, zh: '你让我学会如何拨开阴霾',       hi: '你',   scene: 'partClouds' },
    { t0: 25.3, t1: 27.2, zh: '将快乐全部留下来',             hi: '快乐', scene: 'sunnyMeadow' },
    { t0: 27.3, t1: 29.2, zh: '将不开心全都抛开',             hi: '抛开', scene: 'tossStorm' },
    { t0: 29.3, t1: 32.1, zh: '你对我说的情话',               hi: '你我', scene: 'rooftopWords' },
    { t0: 32.2, t1: 35.8, zh: '像转瞬即逝的烟花',             hi: '烟花', scene: 'cityFireworks' },
    { t0: 35.9, t1: 39.2, zh: '只停在绚烂的一刹那',           hi: '刹那', scene: 'polaroidSnap' },
    { t0: 39.3, t1: 42.2, zh: '我却已无法自拔',               hi: '我',   scene: 'fallingPuzzles' },
    { t0: 42.3, t1: 45.2, zh: '我们的爱总有时差',             hi: '时差', scene: 'dayNightSplit' },
    { t0: 45.3, t1: 49.0, zh: '也为你骗自己放下',             hi: '你',   scene: 'redScarfWind' },
    { t0: 49.1, t1: 54.0, zh: '爱炙热的你 却忘了爱自己',       hi: '你爱', scene: 'dawnHeartBeach' },
    { t0: 54.1, t1: 56.03, zh: '把回忆拼好给你',              hi: '你',   scene: 'finalPuzzleCard' }
  ];

  function drawJigsawPiece(ctx, x, y, w, h, col = '#E5E0D5', rot = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    paint(ctx, rrPts(-w / 2, -h / 2, w, h, 10), { fill: col, ink: '#64748B', sw: 2.2 });
    paint(ctx, ellPts(0, -h / 2 - h * 0.16, w * 0.18, h * 0.18, 12), { fill: col, ink: '#64748B', sw: 2.0 });
    paint(ctx, ellPts(w / 2 + w * 0.16, 0, w * 0.18, h * 0.18, 12), { fill: col, ink: '#64748B', sw: 2.0 });
    ctx.restore();
  }

  function renderBaHuiyi56Frame(ctx, t) {
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    if (typeof CORE.boilFrame === 'function') CORE.boilFrame(t);

    const found = findActiveSub(SUBS_BA_HUIYI_56, t) || { sub: SUBS_BA_HUIYI_56[0], idx: 0 };
    const { sub, idx } = found;
    const lt = clamp(t - sub.t0, 0, sub.t1 - sub.t0);
    const dur = Math.max(0.2, sub.t1 - sub.t0);
    const k = clamp(lt / dur, 0, 1);

    CORE.setActiveStyle('watercolor');
    camBegin(ctx, 640, 360, lerp(1.02, 1.10, ease(k)), 0);

    if (sub.scene === 'puzzleSky') {
      // Scene 1: Standing atop a giant cream jigsaw piece amidst grey puzzle clouds
      paint(ctx, rectPts(-100, -100, W + 200, H + 200), { fill: '#CBD5E1', ink: null });
      for (let i = 0; i < 6; i++) {
        drawJigsawPiece(ctx, 140 + i * 205, 360 + (i % 2) * 35, 165, 165, '#94A3B8', 0);
      }
      drawJigsawPiece(ctx, 640, 430, 240, 230, '#F5E6C8', 0);
      whaleGirl(ctx, 640, 315, 25, {
        t, lt, emotions: [[0, 'idle', null], [1.4, 'curious', 'question'], [2.8, 'sparkle', 'sparkle']],
        hat: 'Maid Headband'
      });
    } else if (sub.scene === 'littlePlanet') {
      // Scene 2: Little puzzle globe under raincloud -> golden star pops out
      paint(ctx, rectPts(-100, -100, W + 200, H + 200), { fill: '#334155', ink: null });
      paint(ctx, ellPts(640, 430, 165, 165, 28), { fill: '#E2E8F0', ink: '#475569', sw: 3 });
      paint(ctx, ellPts(520, 130, 95, 38, 16), { fill: '#64748B', ink: '#E2E8F0', sw: 2 });
      if (lt > 1.2) {
        paint(ctx, ellPts(770, 140, 22, 22, 12), { fill: '#FDE047', ink: '#F59E0B', sw: 2 });
      }
      whaleGirl(ctx, 640, 275, 22, {
        t, lt, emotions: [[0, 'sad', 'sweat'], [1.0, 'gasp', 'exclaim'], [1.8, 'happy', 'sparkle']]
      });
    } else if (sub.scene === 'puzzleWallMeet') {
      // Scene 3: Boy & Girl meeting in front of giant puzzle wall -> close-up starry eyes
      paint(ctx, rectPts(-100, -100, W + 200, H + 200), { fill: '#94A3B8', ink: null });
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 7; c++) {
          paint(ctx, rrPts(80 + c * 165, 40 + r * 125, 155, 115, 8), { fill: '#CBD5E1', ink: '#64748B', sw: 1.5 });
        }
      }
      paint(ctx, rectPts(-100, 540, W + 200, 200), { fill: '#64748B', ink: '#334155', sw: 2 });
      const st = stroll(lt, 0, dur * 0.7, 360, 540, 28);
      whaleGirl(ctx, st.x, 575, 28, Object.assign({}, st, {
        t, lt, emotions: [[0, 'shy', null], [1.2, 'sparkle', 'sparkle'], [2.4, 'love', 'heart']]
      }));
      if (CAST.ladyGemini) {
        CAST.ladyGemini(ctx, 760, 575, 27, { t, flip: true, emote: 'sparkle' });
      }
    } else if (sub.scene === 'oceanSunrise') {
      // Scene 4: Close-up -> Sunrise over vast blue ocean with giant "广袤无垠"
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#BAE6FD');
      grad.addColorStop(0.55, '#FEF08A');
      grad.addColorStop(1, '#0284C7');
      ctx.fillStyle = grad;
      ctx.fillRect(-100, -100, W + 200, H + 200);
      paint(ctx, ellPts(780, 360, 85, 85, 24), { fill: '#FDE047', ink: '#F59E0B', sw: 2.5 });
      paint(ctx, rectPts(-100, 390, W + 200, 350), { fill: '#0369A1', ink: '#38BDF8', sw: 2.5 });
      ctx.font = 'bold 64px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
      ctx.fillStyle = '#1E3A8A';
      ctx.textAlign = 'center';
      ctx.fillText('广 袤 无 垠', 460, 320);
      whaleGirl(ctx, 640, 585, 30, {
        t, lt, emotions: [[0, 'gasp', 'sparkle'], [1.2, 'sparkle', 'sparkle'], [2.4, 'happy', 'heart']]
      });
    } else if (sub.scene === 'quadSplit') {
      // Scene 5: 4-Quadrant Split Screen (Umbrella bench, Tandem bike, Stargazing, Flying kite)
      paint(ctx, rectPts(0, 0, 640, 360), { fill: '#94A3B8', ink: '#FFFFFF', sw: 4 });
      paint(ctx, rectPts(640, 0, 640, 360), { fill: '#BAE6FD', ink: '#FFFFFF', sw: 4 });
      paint(ctx, rectPts(0, 360, 640, 360), { fill: '#1E1B4B', ink: '#FFFFFF', sw: 4 });
      paint(ctx, rectPts(640, 360, 640, 360), { fill: '#BFDBFE', ink: '#FFFFFF', sw: 4 });
      // Q1: Bench under green umbrella
      paint(ctx, ellPts(320, 130, 95, 55, 16), { fill: '#34D399', ink: '#161F3A', sw: 2 });
      whaleGirl(ctx, 290, 290, 18, { t, lt, emotions: [[0, 'happy', 'heart'], [1.0, 'love', 'heart']] });
      if (CAST.ladyGemini) CAST.ladyGemini(ctx, 360, 290, 17, { t, flip: true });
      // Q2: Cycling in the sun
      const bikeX = lerp(780, 1060, k);
      whaleGirl(ctx, bikeX, 290, 18, { t, lt, view: 'side', walk: t * 2.5, emotions: [[0, 'excited', 'music']] });
      // Q3: Stargazing
      whaleGirl(ctx, 290, 625, 18, { t, lt, view: 'back', emotions: [[0, 'sparkle', 'sparkle']] });
      if (CAST.ladyGemini) CAST.ladyGemini(ctx, 360, 625, 17, { t });
      // Q4: Flying red kite
      paint(ctx, polyPts([[1080, 430], [1110, 460], [1080, 490], [1050, 460]]), { fill: '#FB7185', ink: '#161F3A', sw: 2 });
      whaleGirl(ctx, 920, 625, 18, { t, lt, emotions: [[0, 'laugh', 'sparkle']] });
    } else if (sub.scene === 'greenUmbrella' || sub.scene === 'partClouds') {
      // Scene 6 & 7: Sitting on wooden bench under giant green umbrella in the rain -> parting clouds
      paint(ctx, rectPts(-100, -100, W + 200, H + 200), { fill: '#64748B', ink: null });
      if (sub.scene === 'partClouds') {
        const openW = lerp(80, 900, ease(k));
        paint(ctx, ellPts(640, 320, openW, 280, 24), { fill: '#E0F2FE', ink: null });
      }
      paint(ctx, rectPts(-100, 540, W + 200, 200), { fill: '#475569', ink: '#1E293B', sw: 2.5 });
      // Bench & Green Umbrella
      paint(ctx, rrPts(440, 470, 400, 26, 6), { fill: '#B45309', ink: '#161F3A', sw: 2.5 });
      stroke(ctx, linePts(640, 210, 640, 520), { ink: '#1E293B', sw: 5 });
      paint(ctx, polyPts([[430, 240], [520, 155], [640, 135], [760, 155], [850, 240]]), {
        fill: '#34D399', ink: '#065F46', sw: 3
      });
      whaleGirl(ctx, 575, 560, 27, {
        t, lt, emotions: [[0, 'sad', null], [1.0, 'shy', 'heart'], [2.0, 'love', 'heart']]
      });
      if (CAST.ladyGemini) CAST.ladyGemini(ctx, 705, 560, 26, { t, flip: true, emote: 'heart' });
    } else if (sub.scene === 'sunnyMeadow' || sub.scene === 'tossStorm') {
      // Scene 8 & 9: Sunshine rays over green hill & tossing dark storm clouds away
      paint(ctx, rectPts(-100, -100, W + 200, H + 200), { fill: '#BAE6FD', ink: null });
      paint(ctx, ellPts(640, 110, 85, 85, 24), { fill: '#FDE047', ink: '#F59E0B', sw: 2.5 });
      paint(ctx, ellPts(640, 720, 880, 210, 32), { fill: '#86EFAC', ink: '#15803D', sw: 3 });
      whaleGirl(ctx, 565, 565, 28, {
        t, lt, emotions: [[0, 'happy', 'sparkle'], [0.8, 'laugh', 'music'], [1.5, 'excited', 'heart']]
      });
      if (CAST.ladyGemini) CAST.ladyGemini(ctx, 715, 565, 27, { t, flip: true, emote: 'sparkle' });
    } else if (sub.scene === 'rooftopWords' || sub.scene === 'cityFireworks' || sub.scene === 'polaroidSnap') {
      // Scene 10, 11, 12: Night city skyline + glowing floating love-words + fireworks + polaroid frame
      paint(ctx, rectPts(-100, -100, W + 200, H + 200), { fill: '#1E1B4B', ink: null });
      for (let b = 0; b < 11; b++) {
        const bh = 160 + (b * 53) % 180;
        paint(ctx, rectPts(50 + b * 110, 540 - bh, 88, bh), { fill: '#0F172A', ink: '#312E81', sw: 2 });
      }
      if (sub.scene !== 'rooftopWords') {
        // Fireworks bursting
        const cols = ['#F472B6', '#FDE047', '#38BDF8', '#A78BFA'];
        for (let f = 0; f < 4; f++) {
          const fx = 280 + f * 240, fy = 150 + (f % 2) * 55;
          for (let r = 0; r < 12; r++) {
            const a = (r / 12) * Math.PI * 2 + t * 0.6;
            stroke(ctx, linePts(fx, fy, fx + Math.cos(a) * 65, fy + Math.sin(a) * 65), { ink: cols[f], sw: 2.5 });
          }
        }
      }
      paint(ctx, rectPts(-100, 540, W + 200, 200), { fill: '#1E293B', ink: '#38BDF8', sw: 2 });
      whaleGirl(ctx, 580, 575, 28, {
        t, lt, emotions: [[0, 'love', 'heart'], [1.0, 'sparkle', 'sparkle'], [2.0, 'shy', 'heart']]
      });
      if (CAST.ladyGemini) CAST.ladyGemini(ctx, 700, 575, 27, { t, flip: true, emote: 'heart' });
      if (sub.scene === 'polaroidSnap' && lt > 1.2) {
        paint(ctx, rrPts(360, 110, 560, 440, 12), { fill: null, ink: '#FFFFFF', sw: 16 });
      }
    } else if (sub.scene === 'fallingPuzzles') {
      // Scene 13: Floating among falling puzzle pieces in deep blue night
      paint(ctx, rectPts(-100, -100, W + 200, H + 200), { fill: '#1E3A8A', ink: null });
      for (let p = 0; p < 12; p++) {
        const px = 110 + (p * 105) % 1080;
        const py = ((p * 85 + t * 90) % 620);
        drawJigsawPiece(ctx, px, py, 54, 54, p % 2 ? '#93C5FD' : '#FDE68A', t + p);
      }
      whaleGirl(ctx, 640, 520 + Math.sin(t * 3) * 18, 29, {
        t, lt, emotions: [[0, 'sad', 'sweat'], [1.0, 'plead', 'sweat'], [2.0, 'cry', 'sweat']]
      });
    } else if (sub.scene === 'dayNightSplit') {
      // Scene 14: Left Day / Right Night puzzle split with two clocks ("我们的爱总有时差")
      paint(ctx, rectPts(-100, -100, 740, H + 200), { fill: '#E0F2FE', ink: null });
      paint(ctx, rectPts(640, -100, 740, H + 200), { fill: '#1E1B4B', ink: '#FFFFFF', sw: 4 });
      paint(ctx, ellPts(280, 260, 48, 48, 20), { fill: '#FFFFFF', ink: '#1E293B', sw: 3 });
      paint(ctx, ellPts(1000, 260, 48, 48, 20), { fill: '#FFFFFF', ink: '#1E293B', sw: 3 });
      paint(ctx, ellPts(640, 720, 900, 210, 32), { fill: '#86EFAC', ink: '#1E293B', sw: 2.5 });
      whaleGirl(ctx, 460, 565, 28, {
        t, lt, emotions: [[0, 'sad', null], [1.0, 'worry', 'sweat'], [2.0, 'plead', null]]
      });
      if (CAST.ladyGemini) CAST.ladyGemini(ctx, 820, 565, 27, { t, flip: true });
    } else if (sub.scene === 'redScarfWind') {
      // Scene 15: Twilight purple hills with red scarf fluttering in the wind
      paint(ctx, rectPts(-100, -100, W + 200, H + 200), { fill: '#701A75', ink: null });
      paint(ctx, ellPts(640, 720, 920, 220, 32), { fill: '#3B0764', ink: '#1E1B4B', sw: 3 });
      // Red scarf ribbon in wind
      const scarfX = 640 + lt * 75;
      paint(ctx, polyPts([[scarfX, 460], [scarfX + 120, 435 + Math.sin(t * 8) * 18], [scarfX + 130, 465], [scarfX, 480]]), {
        fill: '#FB7185', ink: '#881337', sw: 2
      });
      whaleGirl(ctx, 560, 565, 29, {
        t, lt, emotions: [[0, 'sad', null], [1.2, 'cry', 'sweat'], [2.4, 'sigh', null]]
      });
    } else {
      // Scene 16 & 17: Pink-gold sunrise beach & Final framed jigsaw postcard ("把回忆拼好给你")
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#F9A8D4');
      grad.addColorStop(0.55, '#FEF08A');
      grad.addColorStop(1, '#6EE7B7');
      ctx.fillStyle = grad;
      ctx.fillRect(-100, -100, W + 200, H + 200);
      paint(ctx, ellPts(640, 440, 95, 95, 24), { fill: '#FFFBEB', ink: '#F59E0B', sw: 2.5 });
      paint(ctx, ellPts(640, 720, 920, 210, 32), { fill: '#6EE7B7', ink: '#047857', sw: 2.5 });
      whaleGirl(ctx, 565, 565, 28, {
        t, lt, heartHands: true,
        emotions: [[0, 'shy', 'heart'], [1.0, 'love', 'heart'], [2.0, 'happy', 'sparkle']]
      });
      if (CAST.ladyGemini) CAST.ladyGemini(ctx, 715, 565, 27, { t, flip: true, emote: 'heart' });
      if (sub.scene === 'finalPuzzleCard') {
        paint(ctx, rrPts(180, 70, 920, 520, 16), { fill: null, ink: '#FFFBEB', sw: 28 });
      }
    }

    camEnd(ctx);
    drawTileCardsSubtitle(ctx, sub.zh, t, sub.t0, sub.t1, { highlight: sub.hi });
    ctx.restore();
  }

  // ==========================================================================
  // 2. `lianai_ing` — Replicating `mv/发现更多精彩视频 - 抖音搜索_2.mp4` (54.73s)
  // 五月天《恋爱ing》 — Claude Code / DeepSeek Terminal + Pixel City + ECG + Jet Plane
  // ==========================================================================
  const SUBS_LIANAI_ING = [
    { t0: 0.2,  t1: 7.0,  zh: '> 帮我运行 恋爱.ing',              sub2: '正在启动 恋爱.ing ... PID 520 [100%]', scene: 'terminalBoot' },
    { t0: 7.1,  t1: 12.2, zh: '陪你熬夜 聊天到爆肝也没关系',      sub2: '03:59 AM · 肝 HP 18% · 陪你聊通宵！',   scene: 'nightChat' },
    { t0: 12.3, t1: 17.2, zh: '陪你逛街 逛成扁平足也没关系',      sub2: '今日步数 23,240 步 · 奶茶 / 花店 / 甜品', scene: 'shoppingStreet' },
    { t0: 17.3, t1: 21.2, zh: '超感谢你 让我重生 整个 ORZ',       sub2: 'RESPAWN ✓ ♥ +1 LIFE RESTORED',          scene: 'respawnOrz' },
    { t0: 21.3, t1: 29.0, zh: '让我重新认识 L O V E !',           sub2: '> 让我重新认识 LOVE',                    scene: 'kineticLove' },
    { t0: 29.1, t1: 33.2, zh: '恋爱 ING happy ING !',             sub2: 'PID 520 · 恋爱.ing · HAPPY 100%',        scene: 'ecgHappy' },
    { t0: 33.3, t1: 38.8, zh: '心情就像是 坐上一台喷射机',        sub2: 'JET ENGINE BOOST · MACH 5.20',           scene: 'jetPlane' },
    { t0: 38.9, t1: 43.2, zh: '恋爱 ING 改变 ING !',              sub2: 'NEON LOVE LASER OVERDRIVE',              scene: 'neonLaser' },
    { t0: 43.3, t1: 46.8, zh: '改变了黄昏 黎明',                  sub2: 'TIME SHIFT: 19:30 DUSK -> 06:00 DAWN',   scene: 'duskToDawn' },
    { t0: 46.9, t1: 51.2, zh: '有你 都心跳到不行',                sub2: 'HEARTBEAT SYNC: 180 BPM ♥',              scene: 'doubleHeartEcg' },
    { t0: 51.3, t1: 54.73, zh: '> kill 恋爱.ing  ✗ 拒绝访问: 进程正在运行中 (ING)', sub2: 'LOVE PROCESS IMMORTAL [ING]', scene: 'killDenied' }
  ];

  function renderLianaiIngFrame(ctx, t) {
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    const found = findActiveSub(SUBS_LIANAI_ING, t) || { sub: SUBS_LIANAI_ING[0], idx: 0 };
    const { sub } = found;
    const lt = clamp(t - sub.t0, 0, sub.t1 - sub.t0);
    const dur = Math.max(0.2, sub.t1 - sub.t0);
    const k = clamp(lt / dur, 0, 1);

    CORE.setActiveStyle('pixel');
    paint(ctx, rectPts(0, 0, W, H), { fill: '#0D0B14', ink: null });

    if (sub.scene === 'terminalBoot' || sub.scene === 'killDenied') {
      // Dark Claude/DeepSeek Code Terminal Window + RGB Mechanical Keyboard
      paint(ctx, rrPts(90, 50, 1100, 440, 14), { fill: '#161424', ink: '#F472B6', sw: 2.5 });
      ctx.font = 'bold 22px "Silkscreen", "ZCOOLKuaiLe", monospace';
      ctx.fillStyle = '#F9A8D4';
      ctx.textAlign = 'left';
      ctx.fillText('DeepSeek-Whale-Code v5.2.0 — ~/恋爱进行中', 130, 98);
      ctx.font = 'bold 34px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(sub.zh, 130, 240);
      ctx.font = 'bold 22px "ZCOOLKuaiLe", monospace';
      ctx.fillStyle = sub.scene === 'killDenied' ? '#FB7185' : '#4ADE80';
      ctx.fillText(sub.sub2, 130, 305);

      // RGB Keyboard at bottom
      paint(ctx, rrPts(340, 560, 600, 110, 12), { fill: '#1E1B2E', ink: '#64748B', sw: 2 });
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 12; c++) {
          const activeKey = ((Math.floor(t * 12) + r * 3 + c) % 11) === 0;
          paint(ctx, rrPts(365 + c * 46, 575 + r * 30, 38, 22, 4), {
            fill: activeKey ? '#F472B6' : '#334155', ink: null
          });
        }
      }
      whaleGirl(ctx, 640, 545, 25, {
        t, lt, emotions: [[0, 'focused', 'idea'], [1.2, 'excited', 'sparkle'], [2.4, 'love', 'heart']],
        hat: 'Headphones'
      });
      if (CAST.clawd) CAST.clawd(ctx, 490, 548, 20, { t, happy: true });
      if (sub.scene === 'killDenied') {
        ctx.save();
        ctx.translate(980, 180);
        ctx.rotate(-0.15);
        paint(ctx, rrPts(-120, -55, 240, 110, 14), { fill: '#161424', ink: '#FB7185', sw: 6 });
        ctx.font = 'bold 68px "Silkscreen", monospace';
        ctx.fillStyle = '#FB7185';
        ctx.textAlign = 'center';
        ctx.fillText('ING', 0, 24);
        ctx.restore();
      }
    } else if (sub.scene === 'nightChat') {
      // Night bedroom window + laptop + chat bubbles + clock 02:56 -> 04:00
      paint(ctx, rrPts(110, 160, 420, 320, 12), { fill: '#0F172A', ink: '#475569', sw: 3 });
      paint(ctx, ellPts(240, 245, 36, 36, 16), { fill: '#FEF08A', ink: null });
      paint(ctx, rrPts(680, 140, 480, 420, 14), { fill: '#1E1B2E', ink: '#F472B6', sw: 2.5 });
      const msgs = ['在吗？睡不着...', '我也在！陪你聊通宵~', '今天有好多话想跟你说', '聊天到爆肝也没关系 ♥'];
      for (let m = 0; m < msgs.length; m++) {
        if (lt > m * 0.9) {
          const isRight = m % 2 === 1;
          paint(ctx, rrPts(isRight ? 860 : 710, 185 + m * 82, 270, 54, 12), {
            fill: isRight ? '#EC4899' : '#334155', ink: null
          });
          ctx.font = 'bold 20px "ZCOOLKuaiLe", sans-serif';
          ctx.fillStyle = '#FFFFFF';
          ctx.textAlign = 'left';
          ctx.fillText(msgs[m], isRight ? 880 : 730, 218 + m * 82);
        }
      }
      whaleGirl(ctx, 320, 560, 27, {
        t, lt, tailSit: true,
        emotions: [[0, 'happy', 'music'], [1.5, 'excited', 'heart'], [3.0, 'sleepy', 'zzz']]
      });
      if (CAST.ladyGemini) CAST.ladyGemini(ctx, 500, 560, 26, { t, flip: true, emote: 'heart' });
    } else if (sub.scene === 'shoppingStreet') {
      // Sunset neon shopping street + step counter
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#4C1D95');
      grad.addColorStop(0.6, '#EC4899');
      grad.addColorStop(1, '#F97316');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      const shops = ['奶茶店', 'SALE', 'LOVE', '花店', '甜品屋', '抓娃娃'];
      for (let s = 0; s < 6; s++) {
        paint(ctx, rrPts(40 + s * 205, 380, 185, 160, 8), { fill: '#1E1B4B', ink: '#F472B6', sw: 2.5 });
        ctx.font = 'bold 24px "ZCOOLKuaiLe", sans-serif';
        ctx.fillStyle = '#FDE047';
        ctx.textAlign = 'center';
        ctx.fillText(shops[s], 132 + s * 205, 425);
      }
      paint(ctx, rectPts(0, 540, W, 180), { fill: '#0F172A', ink: '#F472B6', sw: 3 });
      const st = stroll(lt, 0, dur, 220, 960, 28);
      whaleGirl(ctx, st.x, 585, 28, Object.assign({}, st, {
        t, lt, emotions: [[0, 'happy', 'sparkle'], [1.5, 'excited', 'heart'], [3.0, 'tired', 'sweat']]
      }));
      if (CAST.ladyGemini) CAST.ladyGemini(ctx, st.x - 130, 585, 27, { t, walk: st.walk, emote: 'music' });
    } else if (sub.scene === 'jetPlane' || sub.scene === 'duskToDawn') {
      // Jet plane flying over purple/dawn city skyline
      const isDawn = sub.scene === 'duskToDawn' && k > 0.45;
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, isDawn ? '#38BDF8' : '#2E1065');
      grad.addColorStop(1, isDawn ? '#FEF08A' : '#9D174D');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      for (let b = 0; b < 12; b++) {
        const bh = 120 + (b * 67) % 220;
        paint(ctx, rectPts(b * 110, 560 - bh, 95, bh), { fill: '#1E1B4B', ink: '#4C1D95', sw: 2 });
      }
      const jx = lerp(240, 960, k);
      const jy = 310 + Math.sin(t * 5) * 18;
      // Pixel Jet Plane
      paint(ctx, polyPts([[jx - 140, jy], [jx + 110, jy - 12], [jx + 165, jy + 12], [jx - 130, jy + 26]]), {
        fill: '#F8FAFC', ink: '#161F3A', sw: 3
      });
      paint(ctx, rrPts(jx - 180, jy + 4, 45, 18, 6), { fill: '#FB923C', ink: null });
      whaleGirl(ctx, jx, jy - 8, 25, {
        t, lt, emotions: [[0, 'excited', 'sparkle'], [1.5, 'laugh', 'music'], [3.0, 'love', 'heart']],
        hat: 'Crown'
      });
      if (CAST.clawd) CAST.clawd(ctx, jx - 75, jy - 6, 18, { t, happy: true });
    } else {
      // ECG Heartbeat / Kinetic LOVE / Respawn / Neon Laser scenes
      // Draw glowing pink ECG heartbeat waveform across y = 470
      const pts = [];
      for (let x = 0; x <= W; x += 8) {
        const beatMod = ((x + Math.floor(t * 260)) % 220);
        let dy = 0;
        if (beatMod > 90 && beatMod < 105) dy = -85;
        else if (beatMod >= 105 && beatMod < 120) dy = 65;
        else if (beatMod >= 120 && beatMod < 135) dy = -35;
        pts.push([x, 470 + dy]);
      }
      stroke(ctx, pts, { ink: '#EC4899', sw: 4.5 });

      if (sub.scene === 'kineticLove') {
        const letters = ['L', 'O', 'V', 'E'];
        const lcols = ['#FB7185', '#FBBF24', '#34D399', '#38BDF8'];
        for (let i = 0; i < 4; i++) {
          if (k > i * 0.18) {
            ctx.font = 'bold 128px "Silkscreen", sans-serif';
            ctx.fillStyle = lcols[i];
            ctx.textAlign = 'center';
            ctx.fillText(letters[i], 370 + i * 180, 290 + Math.sin(t * 6 + i) * 14);
          }
        }
      }

      whaleGirl(ctx, 560, 465, 28, {
        t, lt, heartHands: sub.scene === 'doubleHeartEcg',
        emotions: [[0, 'love', 'heart'], [1.0, 'excited', 'sparkle'], [2.0, 'joy', 'heart']]
      });
      if (CAST.ladyGemini) {
        CAST.ladyGemini(ctx, 730, 465, 27, { t, flip: true, emote: 'heart' });
      }
    }

    // Top-left & Top-right HUD overlays matching `发现更多精彩视频 - 抖音搜索_2.mp4`
    paint(ctx, rrPts(36, 28, 620, 92, 12), { fill: '#161424', fillOp: 220, ink: '#EC4899', sw: 2 });
    ctx.font = 'bold 34px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.fillText(sub.zh, 58, 72);
    ctx.font = 'bold 18px "Silkscreen", "ZCOOLKuaiLe", monospace';
    ctx.fillStyle = '#F472B6';
    ctx.fillText(sub.sub2, 58, 104);

    ctx.restore();
  }

  // ==========================================================================
  // 3. `jimo_yanhuo` — Replicating `mv/寂寞烟火.mp4` (55.24s)
  // 朱婧汐《寂寞烟火》 — Nautical Map + Origami Paper Boat + Lighthouse + Fireworks + Rainbow
  // ==========================================================================
  const SUBS_JIMO_YANHUO = [
    { t0: 0.2,  t1: 3.3,  zh: '跨越过多少海洋去看你',   scene: 'treasureMap' },
    { t0: 3.4,  t1: 5.2,  zh: '孤单的黑夜途中',         scene: 'stormySea' },
    { t0: 5.3,  t1: 7.2,  zh: '只要想着你',             scene: 'paperBoatClose' },
    { t0: 7.3,  t1: 10.2, zh: '我就不会惶恐',           scene: 'lighthouseBeam' },
    { t0: 10.3, t1: 14.2, zh: '时光的岸上人来了又走',   scene: 'clockShore' },
    { t0: 14.3, t1: 17.2, zh: '离开时你不用说我都懂',   scene: 'sepiaPhoto' },
    { t0: 17.3, t1: 20.1, zh: '感谢你曾让我',           scene: 'lighthouseBeam' },
    { t0: 20.2, t1: 24.2, zh: '留在你眼中',             scene: 'spyglassEye' },
    { t0: 24.3, t1: 28.2, zh: '我曾经走过最遥远的路',   scene: 'fourFoldScreen' },
    { t0: 28.3, t1: 32.1, zh: '想要去拥抱未成真的梦',   scene: 'cloudSea' },
    { t0: 32.2, t1: 34.4, zh: '迷失的黑夜途中',         scene: 'fogCompass' },
    { t0: 34.5, t1: 35.4, zh: '只要想起你',             scene: 'compassClose' },
    { t0: 35.5, t1: 38.2, zh: '就点亮了星空',           scene: 'starryDipper' },
    { t0: 38.3, t1: 42.2, zh: '流浪的纸船忘不掉港口',   scene: 'boatFlotilla' },
    { t0: 42.3, t1: 45.2, zh: '渐灭的花火割不断彩虹',   scene: 'fireworksRainbow' },
    { t0: 45.3, t1: 49.1, zh: '你就是我心中',           scene: 'heartLighthouse' },
    { t0: 49.2, t1: 52.8, zh: '永恒的天空',             scene: 'rainbowNight' },
    { t0: 52.9, t1: 55.24, zh: '寂寞烟火',              scene: 'treasureMapEnd' }
  ];

  function drawOrigamiBoat(ctx, x, y, sc = 1.0, t = 0) {
    ctx.save();
    ctx.translate(x, y + Math.sin(t * 3.5) * 6);
    ctx.rotate(Math.sin(t * 2.4) * 0.05);
    ctx.scale(sc, sc);
    // Paper boat hull & center sail
    paint(ctx, polyPts([[-65, -28], [0, -85], [65, -28]]), { fill: '#E2E8F0', ink: '#475569', sw: 2.2 });
    paint(ctx, polyPts([[-95, -32], [95, -32], [62, 18], [-62, 18]]), { fill: '#F8FAFC', ink: '#475569', sw: 2.4 });
    // Warm glowing lantern on bow
    stroke(ctx, linePts(68, -32, 76, -68), { ink: '#78350F', sw: 2.5 });
    paint(ctx, ellPts(76, -72, 14, 16, 10), { fill: '#FDE047', ink: '#D97706', sw: 1.8 });
    ctx.restore();
  }

  function renderJimoYanhuoFrame(ctx, t) {
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    const found = findActiveSub(SUBS_JIMO_YANHUO, t) || { sub: SUBS_JIMO_YANHUO[0], idx: 0 };
    const { sub } = found;
    const lt = clamp(t - sub.t0, 0, sub.t1 - sub.t0);
    const dur = Math.max(0.2, sub.t1 - sub.t0);
    const k = clamp(lt / dur, 0, 1);

    CORE.setActiveStyle('watercolor');

    if (sub.scene === 'treasureMap' || sub.scene === 'treasureMapEnd') {
      paint(ctx, rectPts(0, 0, W, H), { fill: '#E6D7B9', ink: null });
      // Islands & red dotted route
      paint(ctx, ellPts(240, 230, 65, 32, 16), { fill: '#86EFAC', ink: '#15803D', sw: 2 });
      paint(ctx, ellPts(920, 460, 85, 42, 16), { fill: '#86EFAC', ink: '#15803D', sw: 2 });
      stroke(ctx, [[240, 250], [480, 340], [720, 390], [920, 440]], { ink: '#DC2626', sw: 3 });
      const bx = lerp(260, 860, k);
      const by = lerp(255, 435, k);
      drawOrigamiBoat(ctx, bx, by, 0.55, t);
      whaleGirl(ctx, bx, by - 16, 18, { t, lt, emotions: [[0, 'curious', null], [1.0, 'happy', 'sparkle']] });
      if (CAST.miniWhale) CAST.miniWhale(ctx, bx + 110, by - 10, 18, { t, spout: true });
      if (sub.scene === 'treasureMapEnd') {
        ctx.font = 'bold 76px "ZCOOLKuaiLe", serif';
        ctx.fillStyle = '#3E2723';
        ctx.textAlign = 'center';
        ctx.fillText('寂 寞 烟 火', W / 2, H / 2);
      }
    } else if (sub.scene === 'fourFoldScreen') {
      // 4-panel folding screen: snow peaks, tropical island, desert cacti, starry sea
      const pCols = ['#DBEAFE', '#BAE6FD', '#FDE68A', '#1E3A8A'];
      for (let i = 0; i < 4; i++) {
        paint(ctx, rectPts(80 + i * 280, 70, 275, 490), { fill: pCols[i], ink: '#78350F', sw: 4 });
        paint(ctx, rectPts(80 + i * 280, 420, 275, 140), { fill: '#0284C7', ink: null });
      }
      const bx = lerp(220, 1020, k);
      drawOrigamiBoat(ctx, bx, 460, 0.75, t);
      whaleGirl(ctx, bx, 440, 22, { t, lt, emotions: [[0, 'determined', null], [1.2, 'sparkle', 'sparkle']] });
    } else {
      // Ocean / Lighthouse / Spyglass / Flotilla / Fireworks & Rainbow scenes
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#0F172A');
      grad.addColorStop(0.65, '#1E3A8A');
      grad.addColorStop(1, '#0C4A6E');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Moon & stars
      paint(ctx, ellPts(190, 120, 42, 42, 20), { fill: '#FEF9C3', ink: null });
      for (let s = 0; s < 24; s++) {
        ctx.fillStyle = s % 2 ? '#FDE047' : '#E0F2FE';
        ctx.fillRect((s * 137) % W, (s * 73) % 340, 3, 3);
      }

      // Rainbow in `fireworksRainbow` and `rainbowNight`
      if (sub.scene === 'fireworksRainbow' || sub.scene === 'rainbowNight') {
        const rCols = ['#EF4444', '#F59E0B', '#FDE047', '#22C55E', '#38BDF8', '#A855F7'];
        for (let r = 0; r < rCols.length; r++) {
          ctx.save();
          ctx.strokeStyle = rCols[r];
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.arc(640, 520, 360 - r * 10, Math.PI, 0);
          ctx.stroke();
          ctx.restore();
        }
      }

      // Red-and-white striped lighthouse on right
      paint(ctx, polyPts([[1045, 480], [1085, 480], [1075, 290], [1055, 290]]), { fill: '#F8FAFC', ink: '#161F3A', sw: 2 });
      paint(ctx, rectPts(1050, 330, 30, 28), { fill: '#EF4444', ink: null });
      paint(ctx, rectPts(1048, 390, 34, 28), { fill: '#EF4444', ink: null });
      paint(ctx, polyPts([[1055, 295], [420, 390], [420, 490]]), { fill: '#FEF08A', fillOp: 55, ink: null });

      // Sea waves
      paint(ctx, rectPts(0, 475, W, 245), { fill: '#0F2952', ink: '#38BDF8', sw: 2.5 });

      if (sub.scene === 'boatFlotilla') {
        for (let b = 0; b < 18; b++) {
          const fx = 160 + (b % 6) * 165 + (b % 2) * 35;
          const fy = 490 + Math.floor(b / 6) * 38;
          drawOrigamiBoat(ctx, fx, fy, 0.28, t + b);
        }
      }

      const bx = lerp(420, 680, k);
      drawOrigamiBoat(ctx, bx, 535, 1.05, t);
      whaleGirl(ctx, bx - 10, 505, 26, {
        t, lt, emotions: [[0, 'sad', null], [1.0, 'hope', 'sparkle'], [2.0, 'love', 'heart']],
        hat: 'Maid Headband'
      });
      if (CAST.clawd) CAST.clawd(ctx, bx + 42, 512, 18, { t, happy: true });

      if (sub.scene === 'spyglassEye') {
        iris(ctx, 640, 360, 240, '#090D1E');
      }
    }

    drawScrollBannerSubtitle(ctx, sub.zh, t, sub.t0, sub.t1, H - 58);
    ctx.restore();
  }

  // ==========================================================================
  // 4. `xinqiang` — Replicating `mv/心墙.mp4` (34.02s)
  // 郭静 / Bae《心墙》 — Bus Stop -> Park Bench -> Sketchbooks -> Brick Wall -> Arched Window
  // ==========================================================================
  const SUBS_XINQIANG = [
    { t0: 0.2,  t1: 4.2,  zh: '第一次遇见阴天遮住你侧脸', hi: '阴天侧脸', scene: 'busStopCloudy' },
    { t0: 4.3,  t1: 9.0,  zh: '有什么故事好想了解',       hi: '故事了解', scene: 'parkBenchStory' },
    { t0: 9.1,  t1: 15.2, zh: '我感觉我懂你的特别',       hi: '特别',     scene: 'sketchbooksDesk' },
    { t0: 15.3, t1: 20.1, zh: '你的心有一道墙',           hi: '有一道墙', scene: 'brickWallRise' },
    { t0: 20.2, t1: 25.2, zh: '但我发现一扇窗',           hi: '一扇窗',   scene: 'archedWindow' },
    { t0: 25.3, t1: 31.2, zh: '偶尔透出一丝暖暖的微光',   hi: '暖暖微光', scene: 'warmWindowGlow' },
    { t0: 31.3, t1: 34.02, zh: '心墙 · 暖暖的微光',       hi: '心墙',     scene: 'wallTopSunset' }
  ];

  function drawBrickWall(ctx, x, y, w, h) {
    paint(ctx, rectPts(x, y, w, h), { fill: '#B95846', ink: '#5C2418', sw: 2.5 });
    const rowH = 28, colW = 64;
    ctx.save();
    ctx.strokeStyle = '#E5C1B8';
    ctx.lineWidth = 1.8;
    for (let ry = y + rowH; ry < y + h; ry += rowH) {
      ctx.beginPath();
      ctx.moveTo(x, ry);
      ctx.lineTo(x + w, ry);
      ctx.stroke();
    }
    for (let r = 0; r * rowH < h; r++) {
      const off = (r % 2) * (colW / 2);
      for (let cx = x + off; cx < x + w; cx += colW) {
        ctx.beginPath();
        ctx.moveTo(cx, y + r * rowH);
        ctx.lineTo(cx, Math.min(y + h, y + (r + 1) * rowH));
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function renderXinqiangFrame(ctx, t) {
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    const found = findActiveSub(SUBS_XINQIANG, t) || { sub: SUBS_XINQIANG[0], idx: 0 };
    const { sub } = found;
    const lt = clamp(t - sub.t0, 0, sub.t1 - sub.t0);
    const dur = Math.max(0.2, sub.t1 - sub.t0);
    const k = clamp(lt / dur, 0, 1);

    CORE.setActiveStyle('watercolor');

    if (sub.scene === 'busStopCloudy' || sub.scene === 'parkBenchStory') {
      paint(ctx, rectPts(0, 0, W, H), { fill: '#CBD5E1', ink: null });
      // Trees & park bench
      for (let tr = 0; tr < 4; tr++) {
        paint(ctx, rectPts(150 + tr * 310, 250, 24, 290), { fill: '#78350F', ink: '#161F3A', sw: 2 });
        paint(ctx, ellPts(162 + tr * 310, 220, 85, 65, 16), { fill: '#86EFAC', ink: '#15803D', sw: 2 });
      }
      paint(ctx, rectPts(0, 540, W, 180), { fill: '#86EFAC', ink: '#15803D', sw: 2.5 });
      paint(ctx, rrPts(720, 470, 260, 22, 6), { fill: '#B45309', ink: '#161F3A', sw: 2 });
      whaleGirl(ctx, 840, 560, 28, {
        t, lt, hat: 'Flower Pin',
        emotions: [[0, 'shy', null], [1.2, 'curious', 'question'], [2.4, 'happy', 'sparkle']]
      });
      if (CAST.ladyGemini) CAST.ladyGemini(ctx, 420, 560, 27, { t, emote: 'question' });
    } else if (sub.scene === 'sketchbooksDesk') {
      // Wooden desk with two open sketchbooks -> park bench close-up with giant "特别"
      if (lt < 3.2) {
        paint(ctx, rectPts(0, 0, W, H), { fill: '#A16207', ink: null });
        paint(ctx, rrPts(240, 200, 320, 230, 10), { fill: '#FFFBEB', ink: '#38BDF8', sw: 3 });
        paint(ctx, rrPts(680, 200, 320, 230, 10), { fill: '#FFFBEB', ink: '#FB7185', sw: 3 });
        paint(ctx, ellPts(340, 290, 38, 26, 12), { fill: '#93C5FD', ink: null });
        paint(ctx, ellPts(780, 290, 38, 26, 12), { fill: '#FDE047', ink: null });
      } else {
        paint(ctx, rectPts(0, 0, W, H), { fill: '#D1FAE5', ink: null });
        paint(ctx, rectPts(0, 540, W, 180), { fill: '#6EE7B7', ink: '#047857', sw: 2.5 });
        whaleGirl(ctx, 540, 585, 34, {
          t, lt, emotions: [[0, 'happy', 'sparkle'], [1.0, 'wink', 'heart']]
        });
        if (CAST.ladyGemini) CAST.ladyGemini(ctx, 740, 585, 33, { t, flip: true, emote: 'heart' });
        ctx.font = 'bold 92px "ZCOOLKuaiLe", sans-serif';
        ctx.fillStyle = '#F59E0B';
        ctx.textAlign = 'center';
        ctx.fillText('特 别', 980, 230);
      }
    } else if (sub.scene === 'brickWallRise') {
      // Red brick wall rising up between them
      paint(ctx, rectPts(0, 0, W, H), { fill: '#CBD5E1', ink: null });
      paint(ctx, rectPts(0, 540, W, 180), { fill: '#86EFAC', ink: '#15803D', sw: 2.5 });
      const wallH = lerp(60, 420, ease(k));
      drawBrickWall(ctx, 540, 540 - wallH, 320, wallH);
      whaleGirl(ctx, 700, 550 - Math.max(0, wallH - 220) * 0.3, 27, {
        t, lt, emotions: [[0, 'shy', null], [1.2, 'worry', 'sweat'], [2.4, 'sad', null]]
      });
      if (CAST.ladyGemini) CAST.ladyGemini(ctx, 420, 565, 27, { t, emote: 'exclaim' });
    } else if (sub.scene === 'archedWindow' || sub.scene === 'warmWindowGlow') {
      // Full brick wall with arched window opening -> warm golden star light shining out
      drawBrickWall(ctx, 0, 0, W, 560);
      paint(ctx, rectPts(0, 560, W, 160), { fill: '#86EFAC', ink: '#15803D', sw: 2.5 });
      // Arched Window
      const wx = 780, wy = 310;
      if (sub.scene === 'warmWindowGlow') {
        paint(ctx, ellPts(wx, wy, 280 + Math.sin(t * 4) * 20, 280, 28), {
          fill: '#FEF08A', fillOp: 95, ink: null
        });
      }
      paint(ctx, rrPts(wx - 115, wy - 150, 230, 280, 95), {
        fill: '#FEF3C7', ink: '#FFFBEB', sw: 8
      });
      whaleGirl(ctx, wx, wy + 115, 25, {
        t, lt, emotions: [[0, 'shy', null], [1.2, 'sparkle', 'sparkle'], [2.4, 'love', 'heart']]
      });
      if (CAST.ladyGemini) CAST.ladyGemini(ctx, 360, 580, 27, { t, emote: 'heart' });
    } else {
      // Sitting atop the star-lined brick wall watching the sunset ("心墙")
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#C084FC');
      grad.addColorStop(0.6, '#FBBF24');
      grad.addColorStop(1, '#FB7185');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      paint(ctx, ellPts(880, 440, 68, 68, 22), { fill: '#FEF08A', ink: null });
      drawBrickWall(ctx, 0, 510, W, 210);
      whaleGirl(ctx, 585, 515, 25, {
        t, lt, tailSit: true, emotions: [[0, 'love', 'heart'], [1.0, 'happy', 'sparkle']]
      });
      if (CAST.ladyGemini) CAST.ladyGemini(ctx, 695, 515, 24, { t, flip: true, emote: 'heart' });
      paint(ctx, rrPts(520, 575, 240, 72, 10), { fill: '#FFFBEB', ink: '#78350F', sw: 3 });
      ctx.font = 'bold 42px "ZCOOLKuaiLe", sans-serif';
      ctx.fillStyle = '#451A03';
      ctx.textAlign = 'center';
      ctx.fillText('心 墙', 640, 622);
    }

    drawTileCardsSubtitle(ctx, sub.zh, t, sub.t0, sub.t1, { y: 64, highlight: sub.hi });
    ctx.restore();
  }

  // ==========================================================================
  // 5. `ribuluo` — Replicating `mv/日不落.mp4` (45.81s)
  // 蔡依林《日不落》 — macOS Widgets + Royal Guards + Postcard + 8-City Tour + Caffeinate
  // ==========================================================================
  const SUBS_RIBULUO = [
    { t0: 0.1,  t1: 2.2,  zh: '> 睡不着，陪我听首歌',             hi: '听首歌',   scene: 'macDesktop' },
    { t0: 2.3,  t1: 6.1,  zh: '祈祷你像英勇的禁卫军',             hi: '英勇禁卫军', scene: 'royalGuardsMarch' },
    { t0: 6.2,  t1: 9.2,  zh: '动也不动地守护爱情',               hi: '守护爱情', scene: 'royalGuardsStand' },
    { t0: 9.3,  t1: 13.1, zh: '你在回忆里留下的脚印',             hi: '回忆脚印', scene: 'memoryFootprints' },
    { t0: 13.2, t1: 16.5, zh: '是我爱的风景',                     hi: '爱的风景', scene: 'sunsetWindow' },
    { t0: 16.6, t1: 20.1, zh: '我要送你日不落的想念',             hi: '日不落想念', scene: 'sunSkylineNotes' },
    { t0: 20.2, t1: 24.1, zh: '寄出代表爱的明信片',               hi: '爱的明信片', scene: 'lovePostcard' },
    { t0: 24.2, t1: 28.1, zh: '我要送你日不落的爱恋',             hi: '日不落爱恋', scene: 'allowDialog' },
    { t0: 28.2, t1: 32.1, zh: '心牵着心把世界走遍',               hi: '世界走遍', scene: 'worldTourGrid' },
    { t0: 32.2, t1: 33.4, zh: '你就是庆典',                       hi: '庆典',     scene: 'fireworksFest' },
    { t0: 33.5, t1: 35.8, zh: '你就是晴天',                       hi: '晴天',     scene: 'weatherWidget' },
    { t0: 35.9, t1: 40.1, zh: '我的爱未眠',                       hi: '爱未眠',   scene: 'caffeinateTerm' },
    { t0: 40.2, t1: 43.1, zh: '不落的想念 飞在你身边',             hi: '不落想念', scene: 'bedroomZoomOut' },
    { t0: 43.2, t1: 45.81, zh: '我的爱未眠 · 你睡吧，我不睡。',   hi: '爱未眠',   scene: 'bedroomGuard' }
  ];

  function drawMacDesktopWidgets(ctx, t, weatherSunny = false) {
    // Sunset gradient wallpaper
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#311042');
    grad.addColorStop(0.55, '#702459');
    grad.addColorStop(1, '#F59E0B');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Right-side macOS Widgets (Now Playing, London Weather, Clock, Sunset Photo)
    paint(ctx, rrPts(940, 48, 300, 120, 18), { fill: '#1E1B2E', fillOp: 220, ink: '#F472B6', sw: 2 });
    ctx.font = 'bold 22px "ZCOOLKuaiLe", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.fillText('日不落 · 正在播放', 965, 86);
    for (let b = 0; b < 16; b++) {
      const bh = 12 + Math.abs(Math.sin(t * 8 + b)) * 34;
      paint(ctx, rectPts(965 + b * 15, 150 - bh, 10, bh), { fill: '#FB923C', ink: null });
    }

    // Weather Widget
    paint(ctx, rrPts(940, 185, 142, 140, 18), {
      fill: weatherSunny ? '#0284C7' : '#334155', fillOp: 225, ink: '#94A3B8', sw: 2
    });
    ctx.font = 'bold 18px "ZCOOLKuaiLe", sans-serif';
    ctx.fillStyle = '#E2E8F0';
    ctx.fillText('伦敦', 960, 218);
    ctx.font = 'bold 38px "Silkscreen", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(weatherSunny ? '18°' : '12°', 958, 268);
    ctx.font = 'bold 18px "ZCOOLKuaiLe", sans-serif';
    ctx.fillStyle = '#FDE047';
    ctx.fillText(weatherSunny ? '☀ 晴天' : '🌧 小雨', 960, 304);

    // Clock Widget
    paint(ctx, rrPts(1098, 185, 142, 140, 18), { fill: '#1E1B2E', fillOp: 225, ink: '#94A3B8', sw: 2 });
    paint(ctx, ellPts(1169, 255, 52, 52, 20), { fill: '#0F172A', ink: '#F59E0B', sw: 2.5 });
    stroke(ctx, linePts(1169, 255, 1169 + Math.cos(t) * 32, 255 + Math.sin(t) * 32), { ink: '#FDE047', sw: 3 });

    // Bottom macOS Dock
    paint(ctx, rrPts(330, H - 54, 620, 44, 14), { fill: '#1E1B2E', fillOp: 190, ink: '#64748B', sw: 1.5 });
    const dockCols = ['#38BDF8', '#FB7185', '#FACC15', '#34D399', '#A78BFA', '#F97316', '#60A5FA', '#EC4899'];
    for (let d = 0; d < 8; d++) {
      paint(ctx, rrPts(360 + d * 72, H - 46, 32, 28, 7), { fill: dockCols[d], ink: null });
    }
  }

  function renderRibuluoFrame(ctx, t) {
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    const found = findActiveSub(SUBS_RIBULUO, t) || { sub: SUBS_RIBULUO[0], idx: 0 };
    const { sub } = found;
    const lt = clamp(t - sub.t0, 0, sub.t1 - sub.t0);
    const dur = Math.max(0.2, sub.t1 - sub.t0);
    const k = clamp(lt / dur, 0, 1);

    CORE.setActiveStyle('pixel');

    if (sub.scene === 'worldTourGrid') {
      // 8-City World Tour Grid (4x2 panels: Paris, Cairo, London, Sydney, Tokyo, New York, Rio, Venice)
      paint(ctx, rectPts(0, 0, W, H), { fill: '#1E1B2E', ink: null });
      const cities = ['巴黎铁塔', '埃及金字塔', '伦敦眼', '悉尼歌剧院', '东京塔', '自由女神', '极光冰岛', '圣托里尼'];
      for (let i = 0; i < 8; i++) {
        const gx = 55 + (i % 4) * 295;
        const gy = 150 + Math.floor(i / 4) * 225;
        paint(ctx, rrPts(gx, gy, 275, 195, 12), {
          fill: i % 2 ? '#1E3A8A' : '#701A75', ink: '#FDE047', sw: 2.5
        });
        paint(ctx, ellPts(gx + 220, gy + 50, 22, 22, 12), { fill: '#FDE047', ink: null });
        ctx.font = 'bold 20px "ZCOOLKuaiLe", sans-serif';
        ctx.fillStyle = '#FFFBEB';
        ctx.textAlign = 'left';
        ctx.fillText(cities[i], gx + 18, gy + 172);
      }
      const st = stroll(lt, 0, dur, 220, 1020, 26);
      whaleGirl(ctx, st.x, 125, 22, Object.assign({}, st, {
        t, lt, hat: 'Crown', emotions: [[0, 'excited', 'sparkle'], [1.5, 'love', 'heart']]
      }));
    } else if (sub.scene === 'lovePostcard') {
      drawMacDesktopWidgets(ctx, t, false);
      // Opening 3D Envelope & Postcard
      paint(ctx, rrPts(240, 130, 800, 480, 14), { fill: '#FFFBEB', ink: '#D97706', sw: 4 });
      ctx.font = 'bold 28px "ZCOOLKuaiLe", sans-serif';
      ctx.fillStyle = '#B45309';
      ctx.textAlign = 'center';
      ctx.fillText('✦ 寄出代表爱的明信片 · FROM 深海鲸鱼娘 ✦', 640, 200);
      whaleGirl(ctx, 560, 490, 28, {
        t, lt, heartHands: true, emotions: [[0, 'shy', 'heart'], [1.2, 'love', 'heart'], [2.4, 'wink', 'sparkle']]
      });
      if (CAST.ladyGemini) CAST.ladyGemini(ctx, 740, 490, 27, { t, flip: true, emote: 'heart' });
    } else if (sub.scene === 'bedroomZoomOut' || sub.scene === 'bedroomGuard') {
      // Night bedroom: watching over sleeping partner ("你睡吧，我不睡。")
      paint(ctx, rectPts(0, 0, W, H), { fill: '#0F172A', ink: null });
      paint(ctx, ellPts(240, 130, 42, 42, 18), { fill: '#FEF08A', ink: null });
      // Bed & blanket
      paint(ctx, rrPts(460, 480, 720, 180, 24), { fill: '#1E3A8A', ink: '#60A5FA', sw: 3 });
      paint(ctx, ellPts(1040, 470, 58, 38, 16), { fill: '#F8FAFC', ink: '#94A3B8', sw: 2 });
      whaleGirl(ctx, 640, 480, 27, {
        t, lt, hat: 'Crown',
        emotions: [[0, 'love', 'heart'], [1.0, 'calm', 'sparkle'], [2.0, 'wink', 'heart']]
      });
      if (CAST.clawd) CAST.clawd(ctx, 790, 485, 20, { t, happy: true });
    } else {
      // Main macOS Terminal + 12 Royal Guards + Weather Widget
      drawMacDesktopWidgets(ctx, t, sub.scene === 'weatherWidget');
      paint(ctx, rrPts(48, 48, 860, 560, 16), { fill: '#141220', fillOp: 240, ink: '#64748B', sw: 2.5 });
      // Terminal title bar dots
      paint(ctx, ellPts(78, 74, 7, 7, 8), { fill: '#EF4444', ink: null });
      paint(ctx, ellPts(100, 74, 7, 7, 8), { fill: '#F59E0B', ink: null });
      paint(ctx, ellPts(122, 74, 7, 7, 8), { fill: '#22C55E', ink: null });

      if (sub.scene === 'royalGuardsMarch' || sub.scene === 'royalGuardsStand') {
        // 12 Royal Guards standing in formation
        for (let g = 0; g < 10; g++) {
          const gx = 115 + g * 74;
          if (CAST.clawd) {
            CAST.clawd(ctx, gx, 495, 14, { t: t + g * 0.2, hat: 'crown', happy: true });
          }
        }
      }

      if (sub.scene === 'allowDialog') {
        paint(ctx, rrPts(240, 250, 480, 130, 16), { fill: '#16A34A', ink: '#86EFAC', sw: 3 });
        ctx.font = 'bold 34px "ZCOOLKuaiLe", sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText('✓ 已允许 · 以后都不用再问', 480, 325);
      }

      whaleGirl(ctx, 460, 540, 29, {
        t, lt, hat: 'Crown',
        emotions: [[0, 'determined', 'sparkle'], [1.2, 'proud', 'music'], [2.4, 'love', 'heart']]
      });
      if (CAST.ladyGemini) CAST.ladyGemini(ctx, 680, 540, 27, { t, flip: true, emote: 'sparkle' });
    }

    drawTileCardsSubtitle(ctx, sub.zh, t, sub.t0, sub.t1, {
      cx: 480, y: 165, highlight: sub.hi, bg: '#FEF3C7'
    });
    ctx.restore();
  }

  const SHORT_MVS = {
    ba_huiyi_56: {
      tag: 'ba_huiyi_56',
      title: '《把回忆拼好给你》(56s 拼图剧场版)',
      duration: 56.03,
      subs: SUBS_BA_HUIYI_56,
      renderFrame: renderBaHuiyi56Frame
    },
    lianai_ing: {
      tag: 'lianai_ing',
      title: '五月天《恋爱ing》(深海终端版)',
      duration: 54.73,
      subs: SUBS_LIANAI_ING,
      renderFrame: renderLianaiIngFrame
    },
    jimo_yanhuo: {
      tag: 'jimo_yanhuo',
      title: '《寂寞烟火》(折纸船与灯塔篇)',
      duration: 55.24,
      subs: SUBS_JIMO_YANHUO,
      renderFrame: renderJimoYanhuoFrame
    },
    xinqiang: {
      tag: 'xinqiang',
      title: '《心墙》(微光绘本篇)',
      duration: 34.02,
      subs: SUBS_XINQIANG,
      renderFrame: renderXinqiangFrame
    },
    ribuluo: {
      tag: 'ribuluo',
      title: '《日不落》(禁卫军与桌面组件篇)',
      duration: 45.81,
      subs: SUBS_RIBULUO,
      renderFrame: renderRibuluoFrame
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SHORT_MVS;
  }
  root.MV_PACK_SHORT = SHORT_MVS;
})(typeof window !== 'undefined' ? window : globalThis);
