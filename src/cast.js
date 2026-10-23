// src/cast.js — Full Cast Rigs & ClaudeAnimationBase/PDoomVideo Model Sheet Renderers
// Includes:
//   1. `whaleGirl`        (DeepSeek Whale Maid Girl — 5 views, 31 emotions, 16+ hats)
//   2. `ladyClaude`       (Lady Claude 大小姐 — golden ringlets, black velvet bow, crimson Victorian gown, teacup/fan)
//   3. `clawd`            (ClaudeAnimationBase 4-legged terracotta mascot)
//   4. `researcher`       (Human Researcher — lab coat, glasses, key handover, beach vacation mode, time-lapse wizard beard!)
//   5. `agentReachBot`    (Agent-Reach Octopus Search Drone)
//   6. `bionicPuppy`      (Mechanical Companion Puppy)
//   7. `miniWhale`        (DeepSeek Mini Blue Whale)
//   8. `biliTvMascot`     (Bilibili Little TV Mascot)
// Plus model sheet renderers (`renderEmotionsSheet`, `renderViewsSheet`, `renderStylesSheet`, `renderAllCastSheet`).

(function (root) {
  const CORE = root.CORE || (typeof require !== 'undefined' ? require('./core.js') : {});
  const WHALE = root.WHALE_GIRL || (typeof require !== 'undefined' ? require('./whale_girl.js') : {});
  const CLAWD = root.CLAWD || (typeof require !== 'undefined' ? require('./clawd.js') : {});

  const {
    W, H, TAU, PAL, clamp, lerp, wob, boilSeed, pulse, mixCol,
    rectPts, ellPts, rrPts, starPts, heartPts,
    setActiveStyle, paint, inkLine, letter
  } = CORE;
  const { whaleGirl, EMO, HATS, VIEWS, feel, move } = WHALE;
  const { clawd } = CLAWD;

  // ---------- 2. Lady Claude (隔壁的 Claude 大小姐 — Victorian Ringlets & Tea Fan) ----------
  function ladyClaude(ctx, x, y, u = 19, o = {}) {
    boilSeed('ladyClaude' + Math.round(x));
    const t = o.t || 0;
    const dy = (o.dy ?? -0.12 * pulse(t)) * u;

    if (!o.noShadow) {
      paint(ctx, ellPts(x, y + 0.12 * u, 2.5 * u, 0.5 * u, 16), { wash: PAL.ink, washOp: 65, ink: null });
    }

    ctx.save();
    ctx.translate(x, y + dy);
    if (o.flip) ctx.scale(-1, 1);

    // Victorian Crimson/Rose Ruffle Gown
    paint(ctx, [
      [-1.35 * u, -3.55 * u],
      [1.35 * u, -3.55 * u],
      [2.65 * u, -0.15 * u],
      [-2.65 * u, -0.15 * u]
    ], { wash: '#9F1239', fill: '#E11D48', fillOp: 110, ink: PAL.ink, sw: 1.1, curv: 0.25 });
    // White lace apron panel & hem frills
    paint(ctx, [[-1.05 * u, -3.45 * u], [1.05 * u, -3.45 * u], [1.55 * u, -0.35 * u], [-1.55 * u, -0.35 * u]], {
      wash: PAL.cream, fill: PAL.paperDk, fillOp: 85, ink: PAL.ink, sw: 0.9
    });
    paint(ctx, rrPts(-2.7 * u, -0.45 * u, 5.4 * u, 0.36 * u, 5, 0.6), { wash: PAL.gold, ink: PAL.ink, sw: 0.85 });

    // Golden Twin Drill Ringlets (left & right)
    for (const s of [-1, 1]) {
      for (let k = 0; k < 3; k++) {
        paint(ctx, ellPts(s * 2.45 * u, (-5.1 + k * 0.82) * u, (0.72 - k * 0.08) * u, 0.52 * u, 12), {
          wash: PAL.gold, fill: PAL.ochre, fillOp: 115, ink: PAL.ink, sw: 0.9
        });
      }
    }

    // Arms & Folding Fan / Teacup
    paint(ctx, rrPts(-2.05 * u, -3.35 * u, 0.72 * u, 1.55 * u, 4, 0.5), { wash: '#9F1239', ink: PAL.ink, sw: 0.9 });
    paint(ctx, rrPts(1.35 * u, -3.35 * u, 0.72 * u, 1.55 * u, 4, 0.5), { wash: '#9F1239', ink: PAL.ink, sw: 0.9 });
    if (o.hasFan) {
      // Ornate Rose-Gold Folding Fan held gracefully near chin ("Ohohoho~")
      paint(ctx, [[0.85 * u, -2.55 * u], [2.45 * u, -3.85 * u], [2.75 * u, -2.35 * u]], {
        wash: PAL.gold, fill: PAL.rose, fillOp: 110, ink: PAL.ink, sw: 0.95
      });
    }

    // Head & Haughty Ojou-sama Face
    const hy = -5.45 * u;
    paint(ctx, ellPts(0, hy + 0.3 * u, 2.35 * u, 2.05 * u, 20), { wash: '#FFEFE5', ink: PAL.ink, sw: 1.0 });
    // Golden hair bangs
    paint(ctx, [
      [-2.42 * u, hy + 0.1 * u], [-2.1 * u, hy - 1.55 * u], [0, hy - 1.85 * u],
      [2.1 * u, hy - 1.55 * u], [2.42 * u, hy + 0.1 * u], [0, hy - 0.35 * u]
    ], { wash: PAL.gold, fill: PAL.ochre, fillOp: 110, ink: PAL.ink, sw: 0.95, curv: 0.35 });

    // Large Black Velvet Ribbon Bow on top of head
    paint(ctx, [[0, hy - 1.75 * u], [-1.85 * u, hy - 2.55 * u], [-1.55 * u, hy - 1.15 * u]], { wash: '#1E1B2E', ink: PAL.ink, sw: 0.95 });
    paint(ctx, [[0, hy - 1.75 * u], [1.85 * u, hy - 2.55 * u], [1.55 * u, hy - 1.15 * u]], { wash: '#1E1B2E', ink: PAL.ink, sw: 0.95 });
    paint(ctx, ellPts(0, hy - 1.75 * u, 0.35 * u, 0.35 * u, 8), { wash: PAL.gold, ink: PAL.ink, sw: 0.7 });

    // Smug Ojou-sama eyes & smile
    WHALE.EYES.lids(ctx, -0.95 * u, hy + 0.45 * u, u, 0.92);
    WHALE.EYES.lids(ctx, 0.95 * u, hy + 0.45 * u, u, 0.92);
    WHALE.MOUTHS.smirk(ctx, 0, hy + 1.25 * u, u);

    ctx.restore();
  }

  // ---------- 4. Human Researcher (人类研究员 — Lab Coat / Beach Vacation / Long White Beard!) ----------
  function researcher(ctx, x, y, u = 15, o = {}) {
    boilSeed('researcher' + Math.round(x));
    const t = o.t || 0;
    const dy = (o.dy || 0) * u;
    const sq = clamp(o.sq || 0, -0.35, 0.35);

    if (!o.noShadow) {
      paint(ctx, ellPts(x, y + 0.12 * u, 2.1 * u, 0.45 * u, 14), { wash: PAL.ink, washOp: 65, ink: null });
    }

    ctx.save();
    ctx.translate(x, y + dy);
    if (o.flip) ctx.scale(-1, 1);
    ctx.scale(1 - sq * 0.5, 1 + sq * 0.7);

    // Legs (walking or running)
    if (!o.sit) {
      const wPh = (o.walk ?? o.run ?? 0) * Math.PI;
      for (const [s, ph] of [[-0.65, wPh], [0.65, wPh + Math.PI]]) {
        const lOff = (o.walk != null || o.run != null) ? Math.sin(ph) * 0.45 * u : 0;
        paint(ctx, rectPts((s - 0.32) * u, -1.85 * u + lOff * 0.3, 0.64 * u, 1.85 * u, 0.5), {
          wash: o.vacation ? '#F59E0B' : '#334155', ink: PAL.ink, sw: 0.9
        });
      }
    }

    // Torso: White Lab Coat (or Bright Hawaiian Shirt when `o.vacation === true`!)
    const coatCol = o.vacation ? '#06B6D4' : '#F8FAFC';
    const coatFill = o.vacation ? '#F43F5E' : '#CBD5E1';
    paint(ctx, rrPts(-1.55 * u, -4.55 * u, 3.1 * u, 2.85 * u, 6, 0.8), {
      wash: coatCol, fill: coatFill, fillOp: 95, ink: PAL.ink, sw: 1.05
    });
    if (!o.vacation && !o.back) {
      // Red necktie on lab shirt
      paint(ctx, [[-0.22 * u, -4.35 * u], [0.22 * u, -4.35 * u], [0.32 * u, -2.65 * u], [0, -2.35 * u], [-0.32 * u, -2.65 * u]], {
        wash: '#DC2626', ink: PAL.ink, sw: 0.75
      });
    }

    // Arms & Golden Key (`o.hasKey`)
    const aR = o.aR ?? 0.35;
    ctx.save();
    ctx.translate(1.55 * u, -4.15 * u);
    ctx.rotate(-0.4 + aR);
    paint(ctx, rrPts(-0.35 * u, -0.1 * u, 0.7 * u, 1.75 * u, 4, 0.5), { wash: coatCol, ink: PAL.ink, sw: 0.9 });
    paint(ctx, ellPts(0, 1.75 * u, 0.36 * u, 0.36 * u, 8), { wash: '#FDE68A', ink: PAL.ink, sw: 0.8 });
    if (o.hasKey) {
      // Giant Golden Account Key!
      paint(ctx, ellPts(0.65 * u, 2.15 * u, 0.55 * u, 0.55 * u, 10), { wash: PAL.gold, ink: PAL.ink, sw: 0.9 });
      paint(ctx, rectPts(1.1 * u, 2.0 * u, 1.35 * u, 0.3 * u, 0.4), { wash: PAL.gold, ink: PAL.ink, sw: 0.85 });
    }
    ctx.restore();

    // Head
    const hy = -6.15 * u;
    paint(ctx, ellPts(0, hy + 0.35 * u, 1.95 * u, 1.85 * u, 18), {
      wash: o.back ? '#3B2F2F' : '#FFE4D6', ink: PAL.ink, sw: 1.0
    });
    // Spiky brown hair (stands straight up when startled `o.hairUp > 0`!)
    const hUp = (o.hairUp || 0) * 0.85 * u;
    paint(ctx, [
      [-2.05 * u, hy + 0.1 * u], [-1.75 * u, hy - 1.45 * u - hUp], [-0.45 * u, hy - 1.15 * u],
      [0.25 * u, hy - 1.75 * u - hUp], [1.75 * u, hy - 1.35 * u - hUp], [2.05 * u, hy + 0.1 * u]
    ], { wash: '#3B2F2F', ink: PAL.ink, sw: 0.95 });

    if (!o.back) {
      if (o.vacation) {
        // Cool Vacation Sunglasses & grin!
        WHALE.EYES.shades(ctx, -0.75 * u, hy + 0.35 * u, u, 0.82, o, false);
        WHALE.EYES.shades(ctx, 0.75 * u, hy + 0.35 * u, u, 0.82, o, true);
        WHALE.MOUTHS.grin(ctx, 0, hy + 1.15 * u, u * 0.85);
      } else {
        // Round scientist glasses
        for (const s of [-1, 1]) {
          paint(ctx, ellPts(s * 0.75 * u, hy + 0.35 * u, 0.62 * u, 0.58 * u, 12), { wash: '#E0F2FE', ink: PAL.ink, sw: 0.95 });
          paint(ctx, ellPts(s * 0.75 * u, hy + 0.35 * u, 0.18 * u, 0.18 * u, 6), { wash: PAL.ink, ink: null });
        }
        inkLine(ctx, [[-0.15 * u, hy + 0.35 * u], [0.15 * u, hy + 0.35 * u]], 0.95, PAL.ink, 'ink', 0);
        WHALE.MOUTHS.o(ctx, 0, hy + 1.15 * u, u * 0.85);
      }

      // Time-Lapse Long White Wizard Beard Gag (`o.beardLen` 0..1 during Shot 3.3 Deep Thinking!)
      if (o.beardLen && o.beardLen > 0.05) {
        const bh = 3.8 * u * o.beardLen;
        paint(ctx, [
          [-1.15 * u, hy + 1.05 * u],
          [1.15 * u, hy + 1.05 * u],
          [0.65 * u, hy + 1.05 * u + bh],
          [0, hy + 1.45 * u + bh],
          [-0.65 * u, hy + 1.05 * u + bh]
        ], { wash: '#F8FAFC', fill: '#CBD5E1', fillOp: 110, ink: PAL.ink, sw: 0.95, curv: 0.35 });
      }
    }

    if (o.emote && WHALE.EMOTES[o.emote]) {
      WHALE.EMOTES[o.emote](ctx, 0, hy - 1.55 * u, u, o.emoteK ?? 1, t);
    }

    ctx.restore();
  }

  // ---------- 5. Agent-Reach Bot (全网检索章鱼小机器人) ----------
  function agentReachBot(ctx, x, y, u = 13, o = {}) {
    boilSeed('agentBot' + Math.round(x));
    const t = o.t || 0;
    const bob = Math.sin(t * 5) * 0.35 * u;
    ctx.save();
    ctx.translate(x, y + bob);
    // 4 mechanical tentacles
    for (let i = -1.5; i <= 1.5; i += 1) {
      const sw = Math.sin(t * 7 + i) * 0.35 * u;
      inkLine(ctx, [[i * 0.65 * u, 0.4 * u], [i * 0.85 * u + sw, 1.45 * u]], 1.5, PAL.whaleCyan, 'ink', 0.4);
    }
    // Drone dome & radar antenna
    inkLine(ctx, [[0, -1.35 * u], [0, -2.15 * u]], 1.4, PAL.ink, 'ink', 0);
    paint(ctx, ellPts(0, -2.25 * u, 0.28 * u, 0.28 * u, 8), { wash: PAL.gold, ink: PAL.ink, sw: 0.7 });
    paint(ctx, ellPts(0, -0.35 * u, 1.55 * u, 1.25 * u, 18), { wash: '#1E293B', fill: PAL.whaleBlue, fillOp: 110, ink: PAL.ink, sw: 1.0 });
    paint(ctx, ellPts(0, -0.35 * u, 0.75 * u, 0.55 * u, 12), { wash: PAL.whaleCyan, ink: PAL.ink, sw: 0.8 });
    paint(ctx, ellPts(0, -0.35 * u, 0.25 * u, 0.25 * u, 8), { wash: PAL.ink, ink: null });
    ctx.restore();
  }

  // ---------- 6. Bionic Companion Puppy (机械小狗) ----------
  function bionicPuppy(ctx, x, y, u = 13, o = {}) {
    boilSeed('puppy' + Math.round(x));
    const t = o.t || 0;
    const bounce = Math.abs(Math.sin(t * 6)) * 0.28 * u;
    ctx.save();
    ctx.translate(x, y - bounce);
    if (o.flip) ctx.scale(-1, 1);
    // Legs & body
    paint(ctx, rrPts(-1.25 * u, -1.85 * u, 2.5 * u, 1.35 * u, 5, 0.6), { wash: '#F59E0B', fill: '#D97706', fillOp: 95, ink: PAL.ink, sw: 0.95 });
    for (const lx of [-0.95, -0.35, 0.35, 0.95]) {
      paint(ctx, rectPts((lx - 0.2) * u, -0.65 * u, 0.4 * u, 0.65 * u, 0.4), { wash: '#B45309', ink: PAL.ink, sw: 0.8 });
    }
    // Head & floppy ears
    paint(ctx, ellPts(-1.15 * u, -2.35 * u, 1.05 * u, 0.95 * u, 14), { wash: '#FBBF24', ink: PAL.ink, sw: 0.95 });
    paint(ctx, ellPts(-0.55 * u, -2.35 * u, 0.35 * u, 0.65 * u, 10), { wash: '#92400E', ink: PAL.ink, sw: 0.8 });
    paint(ctx, ellPts(-1.45 * u, -2.45 * u, 0.18 * u, 0.18 * u, 8), { wash: PAL.ink, ink: null });
    // Wagging tail
    inkLine(ctx, [[1.25 * u, -1.65 * u], [1.85 * u, -2.35 * u + Math.sin(t * 14) * 0.35 * u]], 1.4, '#D97706', 'ink', 0);
    ctx.restore();
  }

  // ---------- 7. Mini Blue Whale (深海小蓝鲸) ----------
  function miniWhale(ctx, x, y, u = 14, o = {}) {
    boilSeed('miniWhale' + Math.round(x));
    const t = o.t || 0;
    const bob = Math.sin(t * 4.5) * 0.35 * u;
    ctx.save();
    ctx.translate(x, y + bob);
    if (o.flip) ctx.scale(-1, 1);
    paint(ctx, [[1.35 * u, 0], [2.25 * u, -0.65 * u], [2.05 * u, 0.55 * u]], { wash: '#38BDF8', ink: PAL.ink, sw: 0.85 });
    paint(ctx, ellPts(0, 0, 1.65 * u, 1.05 * u, 18), { wash: '#38BDF8', fill: '#0284C7', fillOp: 110, ink: PAL.ink, sw: 0.95 });
    paint(ctx, ellPts(-0.25 * u, 0.35 * u, 1.15 * u, 0.55 * u, 14), { wash: '#E0F2FE', ink: PAL.ink, sw: 0.75 });
    paint(ctx, ellPts(-0.85 * u, -0.15 * u, 0.22 * u, 0.22 * u, 8), { wash: PAL.ink, ink: null });
    // Water spout
    inkLine(ctx, [[-0.2 * u, -1.05 * u], [-0.55 * u, -1.75 * u]], 1.1, PAL.whaleCyan, 'ink', 0);
    inkLine(ctx, [[0.0 * u, -1.05 * u], [0.35 * u, -1.75 * u]], 1.1, PAL.whaleCyan, 'ink', 0);
    ctx.restore();
  }

  // ---------- 8. Bilibili Little TV Mascot (B站小电视) ----------
  function biliTvMascot(ctx, x, y, u = 13, o = {}) {
    boilSeed('biliTv' + Math.round(x));
    const t = o.t || 0;
    const dy = -Math.abs(Math.sin(t * 5.5)) * 0.25 * u;
    ctx.save();
    ctx.translate(x, y + dy);
    // Antennas
    inkLine(ctx, [[-0.55 * u, -2.55 * u], [-1.05 * u, -3.35 * u]], 1.3, PAL.ink, 'ink', 0);
    inkLine(ctx, [[0.55 * u, -2.55 * u], [1.05 * u, -3.35 * u]], 1.3, PAL.ink, 'ink', 0);
    // TV box
    paint(ctx, rrPts(-1.55 * u, -2.55 * u, 3.1 * u, 2.25 * u, 6, 0.7), { wash: '#38BDF8', fill: '#0284C7', fillOp: 95, ink: PAL.ink, sw: 1.0 });
    paint(ctx, rrPts(-1.25 * u, -2.25 * u, 2.5 * u, 1.65 * u, 4, 0.5), { wash: '#FFFFFF', ink: PAL.ink, sw: 0.85 });
    // Cute `^ ^` eyes & `ω` mouth
    inkLine(ctx, [[-0.85 * u, -1.45 * u], [-0.55 * u, -1.75 * u], [-0.25 * u, -1.45 * u]], 1.1, PAL.ink, 'ink', 0.4);
    inkLine(ctx, [[0.25 * u, -1.45 * u], [0.55 * u, -1.75 * u], [0.85 * u, -1.45 * u]], 1.1, PAL.ink, 'ink', 0.4);
    inkLine(ctx, [[-0.35 * u, -1.05 * u], [0, -0.85 * u], [0.35 * u, -1.05 * u]], 1.0, PAL.ink, 'ink', 0.4);
    ctx.restore();
  }

  // ============================================================================
  // Model Sheet Renderers (Exact counterpart to ClaudeAnimationBase/src/sheets.js!)
  // ============================================================================
  function drawPaperSheetBg(ctx, style = 'watercolor') {
    setActiveStyle(style);
    ctx.save();
    if (style === 'pixel') {
      ctx.fillStyle = '#0B1D42';
      ctx.fillRect(0, 0, W, H);
    } else if (style === 'neon') {
      ctx.fillStyle = '#070B1E';
      ctx.fillRect(0, 0, W, H);
    } else {
      ctx.fillStyle = PAL.paper;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
    CORE.applyMediumOverlay(ctx, style);
  }

  function sheetFloor(ctx, y, x0 = 36, x1 = W - 36, style = 'watercolor') {
    const col = (style === 'pixel' || style === 'neon') ? '#3B82F6' : mixCol(PAL.paper, PAL.ink, 0.38);
    inkLine(ctx, [[x0, y + 3], [W / 2, y + 1], [x1, y + 4]], 0.75, col, 'inkfine', 0.4);
  }

  function sheetLabel(ctx, txt, x, y, size = 14, style = 'watercolor') {
    const isDark = style === 'pixel' || style === 'neon';
    ctx.save();
    ctx.fillStyle = isDark ? '#BAE6FD' : PAL.ink;
    ctx.globalAlpha = 0.86;
    ctx.font = `bold ${size}px "Silkscreen", "ZCOOLKuaiLe", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(txt.toUpperCase(), x, y);
    ctx.restore();
  }

  // 1. All 31 Acted Emotions Sheet (`whale_emotions` -> `docs/emotions.png`)
  function renderEmotionsSheet(ctx, t = 1.2, style = 'watercolor') {
    drawPaperSheetBg(ctx, style);
    const names = Object.keys(EMO); // All 31 emotions!
    const cols = 8, cw = W / cols, ch = H / 4;
    names.forEach((name, i) => {
      const cx = cw * (i % cols) + cw / 2;
      const gy = ch * Math.floor(i / cols) + ch - 36;
      whaleGirl(ctx, cx, gy, 11.2, { ...feel(name, t, { seed: i }), talking: false });
      sheetLabel(ctx, name, cx, gy + 22, 13, style);
    });
    for (let r = 0; r < 4; r++) {
      sheetFloor(ctx, ch * (r + 1) - 36, 28, W - 28, style);
    }
  }

  // 2. 5 Key Views + 16 Hats & Props Sheet (`whale_views` -> `docs/views.png`)
  function renderViewsSheet(ctx, t = 1.2, style = 'watercolor') {
    drawPaperSheetBg(ctx, style);
    // Row 1: 5 Key Views (`front`, `q`, `side`, `qback`, `back`) + `tailSit` + `heartHands` + `smear`
    const row1 = [
      ['front', { view: 'front' }],
      ['3/4 (q)', { view: 'q' }],
      ['side', { view: 'side' }],
      ['3/4 back', { view: 'qback' }],
      ['back', { view: 'back' }],
      ['tail-sit', { tailSit: true, hat: 'wizard', eyes: 'spark' }],
      ['heart-hands', { heartHands: true, eyes: 'heart', blush: true }],
      ['run smear', { view: 'side', smear: 0.8, walk: t * 4, eyes: 'angry' }]
    ];
    const cw = W / 8;
    row1.forEach(([lbl, opts], i) => {
      const cx = cw * i + cw / 2, gy = 215;
      whaleGirl(ctx, cx, gy, 13.5, { ...opts, t });
      sheetLabel(ctx, lbl, cx, gy + 26, 13, style);
    });
    sheetFloor(ctx, 215, 28, W - 28, style);

    // Rows 2 & 3: 12 Hats & Costumes + 4 Cast Companions
    const row2 = ['maid', 'crown', 'wizard', 'hard', 'sweatband', 'diving', 'headphones', 'party'];
    row2.forEach((hat, i) => {
      const cx = cw * i + cw / 2, gy = 450;
      whaleGirl(ctx, cx, gy, 12.5, { hat, eyes: i % 2 ? 'happy' : 'open', t });
      sheetLabel(ctx, 'hat: ' + hat, cx, gy + 24, 12, style);
    });
    sheetFloor(ctx, 450, 28, W - 28, style);

    const row3 = ['halo', 'top', 'fedora', 'flower', 'cat'];
    row3.forEach((hat, i) => {
      const cx = cw * i + cw / 2, gy = 675;
      whaleGirl(ctx, cx, gy, 12.2, { hat, eyes: 'wink', t });
      sheetLabel(ctx, 'hat: ' + hat, cx, gy + 24, 12, style);
    });
    // Plus 3 companions on right of Row 3
    clawd(ctx, cw * 5.5, 675, 11.5, { hat: 'crown', eyes: 'star', t });
    sheetLabel(ctx, 'clawd', cw * 5.5, 699, 12, style);
    ladyClaude(ctx, cw * 6.5, 675, 11.5, { hasFan: true, t });
    sheetLabel(ctx, 'lady claude', cw * 6.5, 699, 12, style);
    researcher(ctx, cw * 7.5, 675, 10.5, { hasKey: true, t });
    sheetLabel(ctx, 'researcher', cw * 7.5, 699, 12, style);
    sheetFloor(ctx, 675, 28, W - 28, style);
  }

  // 3. 6 Visual Styles Comparison Sheet (`whale_styles`)
  function renderStylesSheet(ctx, t = 1.2) {
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, W, H);
    const styles = [
      ['pixel', '16-BIT PIXEL ART', '#0E224D'],
      ['watercolor', 'PDOOM WATERCOLOR', '#F5EFE4'],
      ['ukiyoe', 'UKIYO-E WOODBLOCK', '#EFE2C6'],
      ['risograph', 'RISOGRAPH PRINT', '#F8F1E5'],
      ['neon', 'CYBERPUNK NEON', '#090D24'],
      ['watercolor', 'ROYAL CROWN MODE', '#1E293B']
    ];
    const cols = 3, cw = W / 3, ch = H / 2;
    styles.forEach(([st, title, bg], i) => {
      const x0 = (i % cols) * cw, y0 = Math.floor(i / cols) * ch;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x0 + 8, y0 + 8, cw - 16, ch - 16);
      ctx.clip();
      ctx.fillStyle = bg;
      ctx.fillRect(x0, y0, cw, ch);
      setActiveStyle(st);
      whaleGirl(ctx, x0 + cw / 2, y0 + ch - 58, 22, {
        ...feel(i === 5 ? 'starstruck' : 'excited', t, { seed: i }),
        hat: i === 5 ? 'crown' : 'maid',
        t
      });
      sheetLabel(ctx, title, x0 + cw / 2, y0 + ch - 24, 16, st === 'watercolor' || st === 'ukiyoe' || st === 'risograph' ? 'watercolor' : 'pixel');
      ctx.restore();
    });
  }

  // 4. All 8 Cast Members Sheet (`all_cast`)
  function renderAllCastSheet(ctx, t = 1.2, style = 'watercolor') {
    drawPaperSheetBg(ctx, style);
    letter(ctx, '深海鲸鱼娘 DeepSeek · 全员 8 角色设定集 (PDoomVideo Rig)', W / 2, 48, 32, style === 'pixel' ? PAL.gold : PAL.whaleNavy, {
      stroke: style === 'pixel' ? PAL.ink : false, ink: false
    });

    const castList = [
      ['深海鲸鱼娘 DeepSeek', (cx, gy) => whaleGirl(ctx, cx, gy, 18, { ...feel('excited', t), emote: 'spout', t })],
      ['隔壁 Claude 大小姐', (cx, gy) => ladyClaude(ctx, cx, gy, 17, { hasFan: true, t })],
      ['Clawd 吉祥物', (cx, gy) => clawd(ctx, cx, gy, 15, { ...move('bounce', t), hat: 'party', eyes: 'star', t })],
      ['人类研究员 (交接前)', (cx, gy) => researcher(ctx, cx, gy, 14, { hasKey: true, t })],
      ['人类研究员 (海滩度假)', (cx, gy) => researcher(ctx, cx, gy, 14, { vacation: true, t })],
      ['Agent-Reach 检索机', (cx, gy) => agentReachBot(ctx, cx, gy - 45, 16, { t })],
      ['深海小蓝鲸', (cx, gy) => miniWhale(ctx, cx, gy - 40, 16, { t })],
      ['B站小电视 & 机械狗', (cx, gy) => { biliTvMascot(ctx, cx - 45, gy, 13, { t }); bionicPuppy(ctx, cx + 45, gy, 13, { t }); }]
    ];

    const cols = 4, cw = W / 4, ch = (H - 80) / 2;
    castList.forEach(([title, drawFn], i) => {
      const cx = (i % cols) * cw + cw / 2;
      const gy = 80 + Math.floor(i / cols) * ch + ch - 48;
      drawFn(cx, gy);
      sheetLabel(ctx, title, cx, gy + 26, 15, style);
    });
    sheetFloor(ctx, 80 + ch - 48, 36, W - 36, style);
    sheetFloor(ctx, 80 + ch * 2 - 48, 36, W - 36, style);
  }

  function renderCharacterSheet(ctx, t = 1.2, mode = 'all_cast', style = 'watercolor') {
    if (mode === 'whale_emotions' || mode === 'emotions') {
      renderEmotionsSheet(ctx, t, style);
    } else if (mode === 'whale_views' || mode === 'views' || mode === 'whale_poses') {
      renderViewsSheet(ctx, t, style);
    } else if (mode === 'whale_styles' || mode === 'styles') {
      renderStylesSheet(ctx, t);
    } else {
      renderAllCastSheet(ctx, t, style);
    }
  }

  const CAST = {
    whaleGirl,
    clawd,
    ladyClaude,
    researcher,
    humanResearcher: researcher,
    agentReachBot,
    bionicPuppy,
    miniWhale,
    biliTvMascot,
    renderEmotionsSheet,
    renderViewsSheet,
    renderStylesSheet,
    renderAllCastSheet,
    renderCharacterSheet
  };

  root.CAST = CAST;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CAST;
  }
})(typeof window !== 'undefined' ? window : globalThis);
