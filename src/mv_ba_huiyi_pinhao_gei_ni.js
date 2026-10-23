// src/mv_ba_huiyi_pinhao_gei_ni.js — 56-Shot Storyboard Director for:
//   《椰子水很甜 - 把回忆拼好给你（纯享Beat）》(142.11s, 94.85 BPM, 56 Bars = 56 Shots)
// Built following JohnHeibel/PDoomVideo (`xz_shots.js`) & tuzhechen2005/opus-video-skills:
//   - 56 distinct storyboard shots (1 shot per bar = 2.5304s, plus intra-shot focus pulls & camera cuts)
//   - 100% authentic lyrics of 《把回忆拼好给你》 (作词：童子-T / Shingo.S / 一只然) synced bar-by-bar
//   - All 31 emotions from `characters/whale_girl_emotions_31.png` with 3-stage smooth mid-lyric transitions
//     (`WHALE.emotions(lt, [[0, emo1, em1], [0.85, emo2, em2], [1.70, emo3, em3]])`)
//   - Rich physical acting & micro-actions in every shot: walking (`stroll`), running with afterimage (`runTo` + `smear`),
//     parabolic leaps (`jump`), kneeling (`kneel`), 360 turnaround (`turn`/`spinView`), tail-cushion sitting (`tailSit`),
//     interactive prop hooks (`armL`/`armR`), and co-acting with `ladyGemini` (双子星 Gemini 大小姐) & `ladyClaude`!

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
    kf,
    arcPt,
    rrPts,
    ellPts,
    rectPts,
    paint,
    wobbly,
    boilSeed,
    setBoil,
    setActiveStyle,
    camBegin,
    camEnd,
    toScreen,
    shakeXY,
    iris,
    curtains,
    brushWipe,
    smokeWipe,
    spotDark,
    pulse
  } = CORE;

  const { whaleGirl, feel, emotions, turn, spinView } = WHALE;
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

  // Audio-envelope timing constants (from `assets/ba_huiyi_pinhao_gei_ni_audio.js`)
  const DURATION = 142.11;
  const BPM = 94.85;
  const BEAT = 60 / BPM;       // 0.6326s per beat
  const BAR = BEAT * 4;        // 2.5304s per bar (56 bars total)
  const OFF = 0.415;           // first downbeat offset
  const B = (n) => OFF + n * BEAT;
  const BAR_T = (barIdx) => OFF + barIdx * BAR;

  // ==========================================================================
  // 100% Authentic Lyrics of 《把回忆拼好给你》 (作词：童子-T / Shingo.S / 一只然)
  // Mapped 1-to-1 onto all 56 bars (0.00s – 142.11s)
  // ==========================================================================
  const LYRICS = [
    // Intro: Bars 00–07 (0.42s – 20.66s)
    { bar: 0,  t0: 0.20,        t1: BAR_T(1),    zh: '《把回忆拼好给你》 · 椰子水很甜',           en: 'PIECING MEMORIES TOGETHER FOR YOU', tag: 'INTRO · 序幕' },
    { bar: 1,  t0: BAR_T(1),    t1: BAR_T(2),    zh: '词：童子-T / Shingo.S / 一只然',            en: 'LYRICS: TONGZI-T / SHINGO.S / YIZHIRAN', tag: 'INTRO · 序幕' },
    { bar: 2,  t0: BAR_T(2),    t1: BAR_T(3),    zh: '深海鲸鱼娘 · 记忆拼图剧场',                 en: 'DEEP-SEA WHALE GIRL · MEMORY PUZZLE', tag: 'INTRO · 序幕' },
    { bar: 3,  t0: BAR_T(3),    t1: BAR_T(4),    zh: '星光落在海面 泛起旧日涟漪',                 en: 'Starlight falls upon the sea, stirring old ripples', tag: 'INTRO · 序幕' },
    { bar: 4,  t0: BAR_T(4),    t1: BAR_T(5),    zh: '拾起散落的碎片 拂去岁月微尘',               en: 'Picking up scattered shards, brushing off dust of time', tag: 'INTRO · 序幕' },
    { bar: 5,  t0: BAR_T(5),    t1: BAR_T(6),    zh: '每一片微光 都藏着我们的曾经',               en: 'Every glimmer holds the days we once shared', tag: 'INTRO · 序幕' },
    { bar: 6,  t0: BAR_T(6),    t1: BAR_T(7),    zh: '晚风轻轻吹过 海边的旧站台',                 en: 'Evening breeze drifts across the old seaside platform', tag: 'INTRO · 序幕' },
    { bar: 7,  t0: BAR_T(7),    t1: BAR_T(8),    zh: '把散落的温柔 一一拼回你掌心',               en: 'Piecing every scattered tenderness back into your palm', tag: 'INTRO · 序幕' },

    // Chorus 1: Bars 08–15 (20.66s – 40.90s)
    { bar: 8,  t0: BAR_T(8),    t1: BAR_T(9),    zh: '我们之间的回忆',                           en: 'All the memories between the two of us', tag: 'CHORUS 1 · 副歌' },
    { bar: 9,  t0: BAR_T(9),    t1: BAR_T(10),   zh: '全部都小心地收集',                         en: 'Every single one carefully gathered and kept', tag: 'CHORUS 1 · 副歌' },
    { bar: 10, t0: BAR_T(10),   t1: BAR_T(11),   zh: '我总是偷偷地哭泣',                         en: 'I always find myself crying in secret', tag: 'CHORUS 1 · 副歌' },
    { bar: 11, t0: BAR_T(11),   t1: BAR_T(12),   zh: '像倦鸟失了归期',                           en: 'Like a weary bird that lost its way home', tag: 'CHORUS 1 · 副歌' },
    { bar: 12, t0: BAR_T(12),   t1: BAR_T(13),   zh: '但愿我相信的爱情',                         en: 'May the love I have always believed in', tag: 'CHORUS 1 · 副歌' },
    { bar: 13, t0: BAR_T(13),   t1: BAR_T(14),   zh: '结局紧握在我手心',                         en: 'Hold its ending tightly within my palm', tag: 'CHORUS 1 · 副歌' },
    { bar: 14, t0: BAR_T(14),   t1: BAR_T(15),   zh: '时光匆匆却没有遗失过去',                   en: 'Time rushes by, yet never lost our past', tag: 'CHORUS 1 · 副歌' },
    { bar: 15, t0: BAR_T(15),   t1: BAR_T(16),   zh: '时光匆匆却没有遗失过去',                   en: 'Every memory still shines through the fleeting years', tag: 'CHORUS 1 · 副歌' },

    // Verse 1A: Bars 16–23 (40.90s – 61.14s)
    { bar: 16, t0: BAR_T(16),   t1: BAR_T(17),   zh: '希望我们 有光明的未来',                     en: 'Hoping that we will share a bright future ahead', tag: 'VERSE 1A · 主歌' },
    { bar: 17, t0: BAR_T(17),   t1: BAR_T(18),   zh: '还有能够装下星空的期待',                   en: 'And expectations vast enough to hold the starry sky', tag: 'VERSE 1A · 主歌' },
    { bar: 18, t0: BAR_T(18),   t1: BAR_T(19),   zh: '可现实为何让我感到如此懈怠',               en: 'Yet why does reality leave me feeling so weary', tag: 'VERSE 1A · 主歌' },
    { bar: 19, t0: BAR_T(19),   t1: BAR_T(20),   zh: '总怀念相遇时我们无视落叶和人海',           en: 'Missing when we first met, oblivious to falling leaves and crowds', tag: 'VERSE 1A · 主歌' },
    { bar: 20, t0: BAR_T(20),   t1: BAR_T(21),   zh: '是你让我勇敢不再像颗尘埃',                 en: 'It was you who made me brave, no longer a speck of dust', tag: 'VERSE 1A · 主歌' },
    { bar: 21, t0: BAR_T(21),   t1: BAR_T(22),   zh: '是你常帮我照料装着梦的盆栽',               en: 'It was you who tended the bonsai holding all my dreams', tag: 'VERSE 1A · 主歌' },
    { bar: 22, t0: BAR_T(22),   t1: BAR_T(23),   zh: '每一天我们都是如此愉快',                   en: 'Every single day we spent together was so joyful', tag: 'VERSE 1A · 主歌' },
    { bar: 23, t0: BAR_T(23),   t1: BAR_T(24),   zh: '一直到天色渐晚看着落日无奈离开',           en: 'Until dusk fell and we watched the sunset, parting reluctantly', tag: 'VERSE 1A · 主歌' },

    // Verse 1B: Bars 24–31 (61.14s – 81.39s)
    { bar: 24, t0: BAR_T(24),   t1: BAR_T(25),   zh: '我知道你爱集邮爱笑甚至爱发呆',             en: 'I know you love collecting stamps, smiling, and daydreaming', tag: 'VERSE 1B · 主歌' },
    { bar: 25, t0: BAR_T(25),   t1: BAR_T(26),   zh: '我知道你怕草虫还有夜晚的妖怪',             en: 'I know you fear grass-bugs and little monsters of the night', tag: 'VERSE 1B · 主歌' },
    { bar: 26, t0: BAR_T(26),   t1: BAR_T(27),   zh: '我喜欢你有一点心不在焉的状态',             en: 'I love the way you look when you are slightly absent-minded', tag: 'VERSE 1B · 主歌' },
    { bar: 27, t0: BAR_T(27),   t1: BAR_T(28),   zh: '看起来像个回到七岁时候的小孩',             en: 'Looking just like a child back when you were seven years old', tag: 'VERSE 1B · 主歌' },
    { bar: 28, t0: BAR_T(28),   t1: BAR_T(29),   zh: '该如何将我这份感情向你告白',               en: 'How should I confess all of these feelings in my heart to you', tag: 'VERSE 1B · 主歌' },
    { bar: 29, t0: BAR_T(29),   t1: BAR_T(30),   zh: '喜欢却又不敢爱 直到整个宇宙',             en: 'Fond of you yet afraid to love, until the whole universe', tag: 'VERSE 1B · 主歌' },
    { bar: 30, t0: BAR_T(30),   t1: BAR_T(31),   zh: '在为我焦虑失神慌张之中醒来',               en: 'Awakens amidst my anxious, dazed, and flustered heart', tag: 'VERSE 1B · 主歌' },
    { bar: 31, t0: BAR_T(31),   t1: BAR_T(32),   zh: '就像是黑暗过后黎明盛开',                   en: 'Just like daybreak blooming across the sky after darkness', tag: 'VERSE 1B · 主歌' },

    // Chorus 2: Bars 32–39 (81.39s – 101.63s)
    { bar: 32, t0: BAR_T(32),   t1: BAR_T(33),   zh: '我们之间的回忆',                           en: 'All the memories between the two of us', tag: 'CHORUS 2 · 副歌' },
    { bar: 33, t0: BAR_T(33),   t1: BAR_T(34),   zh: '全部都小心地收集',                         en: 'Every single one carefully gathered and kept', tag: 'CHORUS 2 · 副歌' },
    { bar: 34, t0: BAR_T(34),   t1: BAR_T(35),   zh: '我总是偷偷地哭泣',                         en: 'I always find myself crying in secret', tag: 'CHORUS 2 · 副歌' },
    { bar: 35, t0: BAR_T(35),   t1: BAR_T(36),   zh: '像倦鸟失了归期',                           en: 'Like a weary bird that lost its way home', tag: 'CHORUS 2 · 副歌' },
    { bar: 36, t0: BAR_T(36),   t1: BAR_T(37),   zh: '但愿我相信的爱情',                         en: 'May the love I have always believed in', tag: 'CHORUS 2 · 副歌' },
    { bar: 37, t0: BAR_T(37),   t1: BAR_T(38),   zh: '结局紧握在我手心',                         en: 'Hold its ending tightly within my palm', tag: 'CHORUS 2 · 副歌' },
    { bar: 38, t0: BAR_T(38),   t1: BAR_T(39),   zh: '时光匆匆却没有遗失过去',                   en: 'Time rushes by, yet never lost our past', tag: 'CHORUS 2 · 副歌' },
    { bar: 39, t0: BAR_T(39),   t1: BAR_T(40),   zh: '时光匆匆却没有遗失过去',                   en: 'Every memory still shines through the fleeting years', tag: 'CHORUS 2 · 副歌' },

    // Coda 1: Bars 40–47 (101.63s – 121.87s)
    { bar: 40, t0: BAR_T(40),   t1: BAR_T(41),   zh: '独自收集两个人之间的回忆',                 en: 'Collecting the memories between the two of us all alone', tag: 'CODA 1 · 尾声' },
    { bar: 41, t0: BAR_T(41),   t1: BAR_T(42),   zh: '即使每当到这时候我都会哭泣',               en: 'Even though every time this moment comes I still cry', tag: 'CODA 1 · 尾声' },
    { bar: 42, t0: BAR_T(42),   t1: BAR_T(43),   zh: '为何一切 变得如此',                         en: 'Why did everything change and become like this', tag: 'CODA 1 · 尾声' },
    { bar: 43, t0: BAR_T(43),   t1: BAR_T(44),   zh: '无法回到过去',                             en: 'Unable to ever return to the past we knew', tag: 'CODA 1 · 尾声' },
    { bar: 44, t0: BAR_T(44),   t1: BAR_T(45),   zh: '但我仍愿意感谢你给过我爱情',               en: 'Yet I am still grateful for the love you once gave me', tag: 'CODA 1 · 尾声' },
    { bar: 45, t0: BAR_T(45),   t1: BAR_T(46),   zh: '每一场风景都是我们爱的证明',               en: 'Every scenery we passed is proof of our love', tag: 'CODA 1 · 尾声' },
    { bar: 46, t0: BAR_T(46),   t1: BAR_T(47),   zh: '就算如今 天各一方',                         en: 'Even if today we stand beneath distant skies', tag: 'CODA 1 · 尾声' },
    { bar: 47, t0: BAR_T(47),   t1: BAR_T(48),   zh: '祝你余生动听啊',                           en: 'I wish the rest of your life a beautiful melody', tag: 'CODA 1 · 尾声' },

    // Coda 2 / Finale: Bars 48–55 (121.87s – 142.11s)
    { bar: 48, t0: BAR_T(48),   t1: BAR_T(49),   zh: '独自收集两个人之间的回忆',                 en: 'Collecting the memories between the two of us all alone', tag: 'FINALE · 终章' },
    { bar: 49, t0: BAR_T(49),   t1: BAR_T(50),   zh: '即使每当到这时候我都会哭泣',               en: 'Even though every time this moment comes I still cry', tag: 'FINALE · 终章' },
    { bar: 50, t0: BAR_T(50),   t1: BAR_T(51),   zh: '为何一切 变得如此',                         en: 'Why did everything change and become like this', tag: 'FINALE · 终章' },
    { bar: 51, t0: BAR_T(51),   t1: BAR_T(52),   zh: '无法回到过去',                             en: 'Unable to ever return to the past we knew', tag: 'FINALE · 终章' },
    { bar: 52, t0: BAR_T(52),   t1: BAR_T(53),   zh: '但我仍愿意感谢你给过我爱情',               en: 'Yet I am still grateful for the love you once gave me', tag: 'FINALE · 终章' },
    { bar: 53, t0: BAR_T(53),   t1: BAR_T(54),   zh: '每一场风景都是我们爱的证明',               en: 'Every scenery we passed is proof of our love', tag: 'FINALE · 终章' },
    { bar: 54, t0: BAR_T(54),   t1: BAR_T(55),   zh: '就算如今 天各一方',                         en: 'Even if today we stand beneath distant skies', tag: 'FINALE · 终章' },
    { bar: 55, t0: BAR_T(55),   t1: DURATION,    zh: '把回忆拼好给你',                           en: 'I have pieced every memory back together for you', tag: 'FINALE · 终章' }
  ];

  // ==========================================================================
  // Locomotion & Physical Acting Helpers (`PDoomVideo` + `opus-video-skills`)
  // ==========================================================================
  function stroll(t, t0, t1, x0, x1, u = 26) {
    const k = clamp((t - t0) / Math.max(0.001, t1 - t0), 0, 1);
    const walking = t >= t0 && t <= t1;
    const dist = Math.abs(x1 - x0);
    const cycles = Math.max(1.5, dist / (u * 3.0));
    const phase = walking ? k * cycles * Math.PI * 2 : 0;
    const goRight = x1 >= x0;
    return {
      x: lerp(x0, x1, k),
      view: walking ? 'q' : 'front',
      flip: !goRight,
      walk: walking ? phase / 4.2 : 0,
      dy: walking ? -Math.abs(Math.sin(phase)) * 0.16 : undefined,
      rot: walking ? (goRight ? 0.035 : -0.035) : 0
    };
  }

  function runTo(t, t0, t1, x0, x1, u = 26) {
    const k = clamp((t - t0) / Math.max(0.001, t1 - t0), 0, 1);
    const running = t >= t0 && t <= t1;
    const dist = Math.abs(x1 - x0);
    const cycles = Math.max(2.2, dist / (u * 2.4));
    const phase = running ? k * cycles * Math.PI * 2 : 0;
    const goRight = x1 >= x0;
    return {
      x: lerp(x0, x1, easeIn(k) * 0.35 + k * 0.65),
      view: running ? 'side' : 'q',
      flip: !goRight,
      walk: running ? phase / 4.2 : 0,
      smear: running ? 0.78 : 0,
      dy: running ? -Math.abs(Math.sin(phase)) * 0.28 : undefined,
      rot: running ? (goRight ? 0.12 : -0.12) : 0
    };
  }

  function jumpArc(t, t0, t1, x0, x1, y0, arcH = 95) {
    if (t < t0 - 0.14) return { x: x0, y: y0, sq: 0, jump: 0 };
    if (t < t0) {
      const p = (t - (t0 - 0.14)) / 0.14;
      return { x: x0, y: y0, sq: 0.24 * Math.sin(p * Math.PI), jump: 0 };
    }
    if (t <= t1) {
      const k = (t - t0) / Math.max(0.001, t1 - t0);
      const lift = Math.sin(k * Math.PI) * arcH;
      return {
        x: lerp(x0, x1, k),
        y: y0 - lift,
        sq: -0.18 * Math.sin(k * Math.PI),
        jump: 0
      };
    }
    if (t < t1 + 0.18) {
      const p = (t - t1) / 0.18;
      return { x: x1, y: y0, sq: 0.22 * Math.sin(p * Math.PI) * (1 - p), jump: 0 };
    }
    return { x: x1, y: y0, sq: 0, jump: 0 };
  }

  // ==========================================================================
  // Interactive Hand-Held Props (`armL` / `armR` Callbacks)
  // ==========================================================================
  function drawPuzzlePiece(ctx, x, y, r = 18, col = '#38BDF8', rot = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    paint(ctx, rrPts(-r, -r, r * 2, r * 2, r * 0.28), { fill: col, ink: '#161F3A', sw: 2.2 });
    paint(ctx, ellPts(0, -r - r * 0.26, r * 0.42, r * 0.42, 10), { fill: col, ink: '#161F3A', sw: 2.0 });
    paint(ctx, ellPts(r + r * 0.26, 0, r * 0.42, r * 0.42, 10), { fill: col, ink: '#161F3A', sw: 2.0 });
    paint(ctx, ellPts(-r * 0.25, -r * 0.25, r * 0.35, r * 0.22, 8), { fill: '#FFFFFF', fillOp: 160, ink: null });
    ctx.restore();
  }

  const holdPuzzle = (col = '#38BDF8', rot = 0) => (ctx, u) => {
    drawPuzzlePiece(ctx, 0, 0, u * 0.62, col, rot);
  };

  const holdStarJar = (t = 0) => (ctx, u) => {
    paint(ctx, rrPts(-0.48 * u, -0.55 * u, 0.96 * u, 1.15 * u, 0.22 * u), {
      fill: '#7DD3FC', fillOp: 150, ink: '#161F3A', sw: 2.0
    });
    paint(ctx, rectPts(-0.36 * u, -0.72 * u, 0.72 * u, 0.20 * u), { fill: '#D97706', ink: '#161F3A', sw: 1.8 });
    const glow = 0.22 + 0.06 * Math.sin(t * 7);
    paint(ctx, ellPts(0, 0.05 * u, glow * u, glow * u, 10), { fill: '#FDE047', ink: '#CA8A04', sw: 1.5 });
  };

  const holdUmbrella = (col = '#38BDF8') => (ctx, u) => {
    stroke(ctx, linePts(0, 0.35 * u, 0, -2.55 * u), { ink: '#161F3A', sw: 2.6 });
    const dome = [
      [-2.1 * u, -2.15 * u],
      [-1.3 * u, -2.95 * u],
      [0, -3.20 * u],
      [1.3 * u, -2.95 * u],
      [2.1 * u, -2.15 * u]
    ];
    paint(ctx, polyPts(dome), { fill: col, ink: '#161F3A', sw: 2.2 });
  };

  const holdBonsaiPot = (t = 0) => (ctx, u) => {
    // Terracotta pot + glowing green/starry dream bonsai
    paint(ctx, polyPts([[-0.55 * u, 0.05 * u], [0.55 * u, 0.05 * u], [0.42 * u, 0.68 * u], [-0.42 * u, 0.68 * u]]), {
      fill: '#D97706', ink: '#161F3A', sw: 2.0
    });
    stroke(ctx, linePts(0, 0.05 * u, 0, -0.55 * u), { ink: '#78350F', sw: 3.0 });
    paint(ctx, ellPts(-0.32 * u, -0.62 * u, 0.45 * u, 0.34 * u, 10), { fill: '#34D399', ink: '#161F3A', sw: 1.8 });
    paint(ctx, ellPts(0.28 * u, -0.72 * u, 0.48 * u, 0.36 * u, 10), { fill: '#10B981', ink: '#161F3A', sw: 1.8 });
    paint(ctx, ellPts(0, -0.95 * u + Math.sin(t * 5) * 2, 0.22 * u, 0.22 * u, 8), { fill: '#FDE047', ink: '#161F3A', sw: 1.5 });
  };

  const holdWateringCan = (pouring = false, t = 0) => (ctx, u) => {
    ctx.save();
    if (pouring) ctx.rotate(-0.48);
    paint(ctx, rrPts(-0.50 * u, -0.35 * u, 1.0 * u, 0.78 * u, 0.16 * u), { fill: '#60A5FA', ink: '#161F3A', sw: 2.0 });
    stroke(ctx, linePts(0.45 * u, -0.10 * u, 0.95 * u, -0.45 * u), { ink: '#161F3A', sw: 3.2 });
    if (pouring) {
      for (let i = 0; i < 4; i++) {
        const dropY = ((t * 4 + i * 0.25) % 1) * 0.95 * u;
        paint(ctx, ellPts(1.05 * u + i * 0.12 * u, -0.35 * u + dropY, 0.09 * u, 0.14 * u, 6), {
          fill: '#BAE6FD', ink: null
        });
      }
    }
    ctx.restore();
  };

  const holdStampAlbum = (ctx, u) => {
    paint(ctx, rrPts(-0.68 * u, -0.48 * u, 1.36 * u, 0.96 * u, 0.12 * u), { fill: '#FDE68A', ink: '#161F3A', sw: 2.2 });
    stroke(ctx, linePts(0, -0.46 * u, 0, 0.46 * u), { ink: '#92400E', sw: 2.0 });
    paint(ctx, rectPts(-0.50 * u, -0.30 * u, 0.34 * u, 0.26 * u), { fill: '#FB7185', ink: '#161F3A', sw: 1.4 });
    paint(ctx, rectPts(0.16 * u, -0.28 * u, 0.34 * u, 0.26 * u), { fill: '#38BDF8', ink: '#161F3A', sw: 1.4 });
    paint(ctx, rectPts(0.16 * u, 0.06 * u, 0.34 * u, 0.24 * u), { fill: '#A78BFA', ink: '#161F3A', sw: 1.4 });
  };

  const holdLoveLetter = (ctx, u) => {
    paint(ctx, rrPts(-0.58 * u, -0.38 * u, 1.16 * u, 0.76 * u, 0.10 * u), { fill: '#FFF1F2', ink: '#161F3A', sw: 2.0 });
    stroke(ctx, [[-0.54 * u, -0.34 * u], [0, 0.08 * u], [0.54 * u, -0.34 * u]], { ink: '#E11D48', sw: 2.0 });
    paint(ctx, ellPts(0, 0.02 * u, 0.18 * u, 0.16 * u, 8), { fill: '#FF4D6D', ink: '#161F3A', sw: 1.5 });
  };

  const holdLantern = (t = 0) => (ctx, u) => {
    stroke(ctx, linePts(0, 0, 0, 0.45 * u), { ink: '#161F3A', sw: 2.0 });
    const swing = Math.sin(t * 4.5) * 0.08 * u;
    paint(ctx, ellPts(swing, 0.78 * u, 0.48 * u, 0.58 * u, 12), { fill: '#FBBF24', fillOp: 180, ink: '#161F3A', sw: 2.0 });
    paint(ctx, ellPts(swing, 0.78 * u, 0.26 * u, 0.32 * u, 10), { fill: '#FEF08A', ink: null });
  };

  // ==========================================================================
  // 12 Full-Screen Painted Theatrical Environments ("Sets, Not Cards" — PDoomVideo)
  // ==========================================================================

  // SET 1: Starlit Bioluminescent Beach & Lighthouse Shoreline
  function drawStarlitBeachSet(ctx, t, mode = 'night') {
    const isDawn = mode === 'dawn';
    const skyTop = isDawn ? '#1E1B4B' : '#090D24';
    const skyBot = isDawn ? '#F472B6' : '#1E3A8A';
    const seaCol = isDawn ? '#312E81' : '#0F2952';

    const grad = ctx.createLinearGradient(0, -120, 0, H + 120);
    grad.addColorStop(0, skyTop);
    grad.addColorStop(0.62, skyBot);
    grad.addColorStop(1, seaCol);
    ctx.fillStyle = grad;
    ctx.fillRect(-400, -200, W + 800, H + 400);

    // Twinkling starfield + shooting star
    for (let i = 0; i < 36; i++) {
      const sx = ((i * 173) % 1400) - 60;
      const sy = ((i * 97) % 360) + 15;
      const tw = 1.5 + 1.8 * Math.sin(t * 3.5 + i);
      if (tw > 1.2) {
        ctx.fillStyle = i % 3 === 0 ? '#FDE047' : '#E0F2FE';
        ctx.fillRect(sx, sy, tw, tw);
      }
    }

    // Crescent Moon or Rising Sun
    if (isDawn) {
      paint(ctx, ellPts(640, 390, 130, 130, 24), { fill: '#FDE047', fillOp: 190, ink: '#FB923C', sw: 3 });
    } else {
      paint(ctx, ellPts(980, 135, 54, 54, 20), { fill: '#FEF08A', ink: '#F59E0B', sw: 2.2 });
      paint(ctx, ellPts(1002, 122, 44, 44, 18), { fill: skyTop, ink: null });
    }

    // Distant headland & lighthouse with rotating beam
    paint(ctx, polyPts([[-200, 440], [120, 375], [340, 440]]), { fill: '#0F172A', ink: '#1E293B', sw: 2 });
    paint(ctx, polyPts([[205, 395], [225, 395], [220, 310], [210, 310]]), { fill: '#F8FAFC', ink: '#161F3A', sw: 2 });
    paint(ctx, rectPts(206, 296, 18, 16), { fill: '#EF4444', ink: '#161F3A', sw: 2 });
    const beamAng = Math.sin(t * 1.4) * 0.18;
    ctx.save();
    ctx.translate(215, 304);
    ctx.rotate(beamAng);
    paint(ctx, polyPts([[0, 0], [520, -90], [520, 45]]), { fill: '#FEF08A', fillOp: 45, ink: null });
    ctx.restore();

    // Ocean horizon & bioluminescent waves
    paint(ctx, rectPts(-300, 435, W + 600, 150), { fill: seaCol, ink: '#38BDF8', sw: 2 });
    for (let w = 0; w < 5; w++) {
      const wy = 465 + w * 24;
      const wx = ((t * 35 * (w % 2 ? 1 : -1) + w * 210) % 1400) - 100;
      stroke(ctx, linePts(wx, wy, wx + 240, wy), { ink: '#7DD3FC', sw: 2.4 });
    }

    // Sandy beach foreground with glowing tide foam & seashells
    const sandPts = [[-300, 545], [260, 530], [780, 552], [1580, 535], [1580, 860], [-300, 860]];
    paint(ctx, polyPts(sandPts), { fill: isDawn ? '#FDE68A' : '#1E293B', ink: '#38BDF8', sw: 3.0 });
    for (let k = 0; k < 9; k++) {
      const fx = 90 + k * 140 + Math.sin(t * 2 + k) * 18;
      const fy = 555 + (k % 3) * 14;
      paint(ctx, ellPts(fx, fy, 9, 5, 8), { fill: '#38BDF8', fillOp: 180, ink: null });
    }
  }

  // SET 2: Candlelit Attic Observatory & Memory Puzzle Table
  function drawPuzzleObservatorySet(ctx, t, piecesCollected = 3) {
    paint(ctx, rectPts(-300, -200, W + 600, H + 400), { fill: '#17132B', ink: null });
    // Arched observatory window showing starry night
    paint(ctx, ellPts(640, 260, 290, 220, 28), { fill: '#0B1536', ink: '#475569', sw: 5 });
    for (let i = 0; i < 18; i++) {
      const sx = 420 + ((i * 67) % 440);
      const sy = 100 + ((i * 43) % 280);
      ctx.fillStyle = i % 2 ? '#FDE047' : '#7DD3FC';
      ctx.fillRect(sx, sy, 3, 3);
    }
    // Window mullions
    stroke(ctx, linePts(640, 40, 640, 480), { ink: '#475569', sw: 4 });
    stroke(ctx, linePts(350, 260, 930, 260), { ink: '#475569', sw: 4 });

    // Hanging constellation jars
    for (let j = 0; j < 5; j++) {
      const jx = 180 + j * 230;
      const jy = 120 + (j % 2) * 35 + Math.sin(t * 2.5 + j) * 6;
      stroke(ctx, linePts(jx, -40, jx, jy - 24), { ink: '#64748B', sw: 2 });
      paint(ctx, rrPts(jx - 18, jy - 24, 36, 48, 8), { fill: '#38BDF8', fillOp: 95, ink: '#E2E8F0', sw: 2 });
      paint(ctx, ellPts(jx, jy, 10, 10, 8), { fill: '#FDE047', ink: null });
    }

    // Wooden floor & glowing puzzle workbench
    paint(ctx, rectPts(-300, 540, W + 600, 300), { fill: '#2E1F18', ink: '#161F3A', sw: 3 });
    paint(ctx, rrPts(290, 470, 700, 110, 18), { fill: '#78350F', ink: '#161F3A', sw: 3 });
    // Glowing 3x3 puzzle board on the table
    const bx = 560, by = 485;
    paint(ctx, rrPts(bx, by, 160, 76, 10), { fill: '#FEF3C7', ink: '#161F3A', sw: 2.4 });
    const cols = ['#38BDF8', '#F472B6', '#FACC15', '#34D399', '#A78BFA', '#FB7185', '#60A5FA', '#FBBF24', '#2DD4BF'];
    for (let p = 0; p < Math.min(9, piecesCollected); p++) {
      const px = bx + 14 + (p % 3) * 48;
      const py = by + 10 + Math.floor(p / 3) * 20;
      paint(ctx, rrPts(px, py, 40, 16, 4), { fill: cols[p], ink: '#161F3A', sw: 1.5 });
    }
  }

  // SET 3: Rain-Streaked Neon Bus Stop & Puddle Reflection Street
  function drawRainBusStopSet(ctx, t) {
    paint(ctx, rectPts(-300, -200, W + 600, H + 400), { fill: '#111827', ink: null });
    // Distant city bokeh lights
    const bokehCols = ['#38BDF8', '#F472B6', '#FACC15', '#A78BFA'];
    for (let i = 0; i < 14; i++) {
      const bx = 80 + i * 88;
      const by = 240 + (i % 3) * 42;
      paint(ctx, ellPts(bx, by, 26 + (i % 3) * 8, 26 + (i % 3) * 8, 12), {
        fill: bokehCols[i % 4], fillOp: 45, ink: null
      });
    }
    // Wet asphalt & glowing puddles
    paint(ctx, rectPts(-300, 535, W + 600, 260), { fill: '#1E293B', ink: '#0F172A', sw: 3 });
    paint(ctx, ellPts(380, 610, 160, 24, 16), { fill: '#38BDF8', fillOp: 70, ink: '#7DD3FC', sw: 1.5 });
    paint(ctx, ellPts(880, 625, 190, 28, 16), { fill: '#F472B6', fillOp: 65, ink: '#F9A8D4', sw: 1.5 });

    // Bus stop glass shelter & route sign
    paint(ctx, rectPts(250, 220, 460, 320), { fill: '#38BDF8', fillOp: 35, ink: '#475569', sw: 4 });
    paint(ctx, rrPts(220, 200, 520, 28, 10), { fill: '#0284C7', ink: '#161F3A', sw: 3 });
    paint(ctx, rrPts(310, 465, 340, 22, 6), { fill: '#D97706', ink: '#161F3A', sw: 2.5 });
    // Bus stop pole
    stroke(ctx, linePts(860, 230, 860, 540), { ink: '#334155', sw: 6 });
    paint(ctx, ellPts(860, 210, 34, 34, 14), { fill: '#FACC15', ink: '#161F3A', sw: 2.5 });

    // Falling diagonal rain streaks + puddle ripples
    for (let r = 0; r < 42; r++) {
      const rx = ((r * 97 - t * 180) % 1400 + 1400) % 1400 - 60;
      const ry = ((r * 61 + t * 520) % 680) - 40;
      stroke(ctx, linePts(rx, ry, rx - 10, ry + 26), { ink: '#BAE6FD', sw: 1.4 });
    }
  }

  // SET 4: Twilight Clocktower & Lost Origami Birds Sky
  function drawClocktowerBirdsSet(ctx, t) {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#1E1B4B');
    grad.addColorStop(0.55, '#4C1D95');
    grad.addColorStop(1, '#BE185D');
    ctx.fillStyle = grad;
    ctx.fillRect(-300, -200, W + 600, H + 400);

    // Giant astronomical clock face in background
    ctx.save();
    ctx.translate(640, 285);
    paint(ctx, ellPts(0, 0, 210, 210, 28), { fill: '#FEF3C7', fillOp: 38, ink: '#FDE68A', sw: 3 });
    paint(ctx, ellPts(0, 0, 165, 165, 24), { fill: null, ink: '#FDE68A', sw: 2 });
    // Clock hands turning backward for "unable to return to the past"
    const hAng = -t * 0.45;
    const mAng = -t * 2.2;
    stroke(ctx, linePts(0, 0, Math.cos(hAng) * 110, Math.sin(hAng) * 110), { ink: '#FDE047', sw: 5 });
    stroke(ctx, linePts(0, 0, Math.cos(mAng) * 155, Math.sin(mAng) * 155), { ink: '#38BDF8', sw: 3.5 });
    ctx.restore();

    // Flocks of glowing origami birds circling across the twilight sky
    for (let b = 0; b < 9; b++) {
      const bx = ((b * 165 + t * 85) % 1400) - 60;
      const by = 110 + (b % 4) * 65 + Math.sin(t * 4 + b) * 18;
      const wing = Math.sin(t * 9 + b * 1.3) * 12;
      paint(ctx, polyPts([[bx - 18, by + wing], [bx, by - 6], [bx + 18, by + wing], [bx, by + 5]]), {
        fill: b % 2 ? '#FDE68A' : '#E0F2FE', ink: '#161F3A', sw: 1.6
      });
    }

    // Rooftop stone balustrade
    paint(ctx, rectPts(-300, 540, W + 600, 240), { fill: '#1E1B4B', ink: '#161F3A', sw: 3 });
    for (let p = 0; p < 12; p++) {
      paint(ctx, rectPts(40 + p * 105, 485, 28, 55), { fill: '#312E81', ink: '#161F3A', sw: 2 });
    }
    paint(ctx, rectPts(-200, 472, W + 400, 16), { fill: '#4338CA', ink: '#161F3A', sw: 2.5 });
  }

  // SET 5: Autumn Ginkgo Boulevard (Falling Golden Leaves & Crowd Silhouettes)
  function drawAutumnGinkgoSet(ctx, t) {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#FEF3C7');
    grad.addColorStop(0.55, '#FDE68A');
    grad.addColorStop(1, '#F59E0B');
    ctx.fillStyle = grad;
    ctx.fillRect(-300, -200, W + 600, H + 400);

    // Ginkgo tree trunks & golden canopies
    for (let tr = 0; tr < 5; tr++) {
      const tx = 140 + tr * 250;
      paint(ctx, rectPts(tx - 18, 220, 36, 320), { fill: '#78350F', ink: '#161F3A', sw: 2.5 });
      paint(ctx, ellPts(tx, 165, 135, 95, 20), { fill: '#FBBF24', ink: '#B45309', sw: 2.5 });
      paint(ctx, ellPts(tx - 45, 195, 85, 65, 16), { fill: '#F59E0B', ink: null });
      paint(ctx, ellPts(tx + 50, 185, 90, 68, 16), { fill: '#FDE047', ink: null });
    }

    // Leaf-covered brick avenue
    paint(ctx, rectPts(-300, 535, W + 600, 240), { fill: '#92400E', ink: '#161F3A', sw: 3 });
    // Swirling golden ginkgo leaves in the air
    for (let l = 0; l < 28; l++) {
      const lx = ((l * 113 + t * 72) % 1400) - 60;
      const ly = ((l * 79 + t * 55) % 580);
      const rot = t * 3 + l;
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(rot);
      paint(ctx, polyPts([[0, -7], [-9, 5], [0, 3], [9, 5]]), { fill: l % 2 ? '#FDE047' : '#F59E0B', ink: '#92400E', sw: 1.2 });
      ctx.restore();
    }
  }

  // SET 6: Sunlit Glasshouse Conservatory & Dream Bonsai Garden
  function drawGreenhouseBonsaiSet(ctx, t) {
    paint(ctx, rectPts(-300, -200, W + 600, H + 400), { fill: '#DCFCE7', ink: null });
    // Glasshouse iron ribs & sky panes
    for (let g = 0; g < 9; g++) {
      const gx = 80 + g * 140;
      stroke(ctx, linePts(gx, 0, gx, 540), { ink: '#86EFAC', sw: 3 });
    }
    // Diagonal sunbeams
    for (let b = 0; b < 3; b++) {
      const bx = 220 + b * 340;
      paint(ctx, polyPts([[bx, 0], [bx + 140, 0], [bx + 320, 540], [bx + 120, 540]]), {
        fill: '#FEF08A', fillOp: 55, ink: null
      });
    }
    // Wooden plant tables with potted dream-bonsais
    paint(ctx, rectPts(-300, 540, W + 600, 240), { fill: '#A7F3D0', ink: '#065F46', sw: 3 });
    paint(ctx, rrPts(160, 445, 960, 24, 8), { fill: '#B45309', ink: '#161F3A', sw: 2.5 });
    for (let p = 0; p < 6; p++) {
      const px = 230 + p * 160;
      paint(ctx, polyPts([[px - 22, 445], [px + 22, 445], [px + 16, 412], [px - 16, 412]]), {
        fill: '#D97706', ink: '#161F3A', sw: 2
      });
      paint(ctx, ellPts(px, 390, 32, 24, 12), { fill: p % 2 ? '#10B981' : '#34D399', ink: '#065F46', sw: 2 });
    }
  }

  // SET 7: Sunset Coastal Train Platform & Departing Electric Train
  function drawSunsetStationSet(ctx, t, trainOffset = 0) {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#7C2D12');
    grad.addColorStop(0.45, '#EA580C');
    grad.addColorStop(0.75, '#FBBF24');
    grad.addColorStop(1, '#1E3A8A');
    ctx.fillStyle = grad;
    ctx.fillRect(-300, -200, W + 600, H + 400);

    // Giant setting sun sinking into the sea
    paint(ctx, ellPts(640, 410, 115, 115, 24), { fill: '#FEF08A', fillOp: 210, ink: '#F97316', sw: 3 });
    paint(ctx, rectPts(-300, 445, W + 600, 95), { fill: '#1E3A8A', ink: '#F59E0B', sw: 2 });

    // Coastal electric train on tracks
    const tx = 180 + trainOffset;
    paint(ctx, rrPts(tx, 315, 860, 145, 18), { fill: '#FDE68A', ink: '#161F3A', sw: 3.2 });
    paint(ctx, rectPts(tx + 6, 392, 848, 22), { fill: '#EA580C', ink: null });
    for (let w = 0; w < 6; w++) {
      paint(ctx, rrPts(tx + 45 + w * 132, 338, 88, 46, 8), { fill: '#FEF9C3', ink: '#161F3A', sw: 2.2 });
    }

    // Station platform & yellow safety line
    paint(ctx, rectPts(-300, 535, W + 600, 240), { fill: '#334155', ink: '#161F3A', sw: 3 });
    paint(ctx, rectPts(-300, 548, W + 600, 10), { fill: '#FACC15', ink: null });
  }

  // SET 8: Cozy Stamp-Collecting & Childhood Sketchbook Study
  function drawStampStudySet(ctx, t) {
    paint(ctx, rectPts(-300, -200, W + 600, H + 400), { fill: '#FEF3C7', ink: null });
    // Warm wallpaper stripes & framed stamp/postcards on the wall
    for (let s = 0; s < 14; s++) {
      paint(ctx, rectPts(s * 100, 0, 50, 540), { fill: '#FDE68A', fillOp: 90, ink: null });
    }
    const frames = [
      [220, 140, '#38BDF8'],
      [480, 115, '#FB7185'],
      [780, 135, '#34D399'],
      [1030, 155, '#A78BFA']
    ];
    for (const [fx, fy, fc] of frames) {
      paint(ctx, rrPts(fx - 70, fy - 52, 140, 104, 10), { fill: '#FFFFFF', ink: '#78350F', sw: 3 });
      paint(ctx, rectPts(fx - 52, fy - 36, 104, 72), { fill: fc, fillOp: 160, ink: '#161F3A', sw: 1.8 });
    }
    // Warm wooden floor & rug
    paint(ctx, rectPts(-300, 535, W + 600, 240), { fill: '#92400E', ink: '#161F3A', sw: 3 });
    paint(ctx, ellPts(640, 605, 380, 55, 24), { fill: '#FDE047', fillOp: 150, ink: '#B45309', sw: 2.5 });
  }

  // SET 9: Spooky-Cute Midnight Firefly Woods & Friendly Night Yokai
  function drawFireflyForestSet(ctx, t) {
    paint(ctx, rectPts(-300, -200, W + 600, H + 400), { fill: '#061A23', ink: null });
    // Mystic tree silhouettes
    for (let tr = 0; tr < 7; tr++) {
      const tx = 70 + tr * 195;
      paint(ctx, rectPts(tx - 28, -50, 56, 600), { fill: '#0D2E3A', ink: '#041016', sw: 2.5 });
    }
    // Cute glowing forest spirits / little night yokai peeking from behind trees
    for (let y = 0; y < 4; y++) {
      const yx = 210 + y * 290 + Math.sin(t * 3 + y) * 14;
      const yy = 370 + (y % 2) * 45 + Math.cos(t * 4 + y) * 10;
      paint(ctx, ellPts(yx, yy, 26, 30, 14), { fill: '#A7F3D0', fillOp: 185, ink: '#161F3A', sw: 2 });
      paint(ctx, ellPts(yx - 8, yy - 4, 4, 5, 6), { fill: '#161F3A', ink: null });
      paint(ctx, ellPts(yx + 8, yy - 4, 4, 5, 6), { fill: '#161F3A', ink: null });
      paint(ctx, ellPts(yx, yy + 7, 5, 6, 6), { fill: '#161F3A', ink: null });
    }
    // Mossy forest path & glowing fireflies
    paint(ctx, rectPts(-300, 540, W + 600, 240), { fill: '#064E3B', ink: '#161F3A', sw: 3 });
    for (let f = 0; f < 26; f++) {
      const fx = ((f * 97 + Math.sin(t * 2 + f) * 45) % 1280 + 1280) % 1280;
      const fy = 150 + ((f * 67) % 390) + Math.cos(t * 3 + f) * 18;
      const r = 4 + 2.5 * Math.sin(t * 6 + f);
      paint(ctx, ellPts(fx, fy, r, r, 8), { fill: '#BEF264', ink: null });
    }
  }

  // SET 10: Cosmic Galaxy Vortex & Heart-Constellation Puzzle Wheel
  function drawCosmicGalaxySet(ctx, t, completedPieces = 6) {
    const grad = ctx.createRadialGradient(640, 320, 40, 640, 320, 720);
    grad.addColorStop(0, '#311068');
    grad.addColorStop(0.5, '#1E1B4B');
    grad.addColorStop(1, '#070919');
    ctx.fillStyle = grad;
    ctx.fillRect(-300, -200, W + 600, H + 400);

    // Rotating zodiac star-wheel & orbiting puzzle shards
    ctx.save();
    ctx.translate(640, 285);
    ctx.rotate(t * 0.25);
    paint(ctx, ellPts(0, 0, 235, 235, 32), { fill: null, ink: '#38BDF8', sw: 2.2 });
    paint(ctx, ellPts(0, 0, 175, 175, 28), { fill: null, ink: '#F472B6', sw: 1.8 });
    const cols = ['#38BDF8', '#F472B6', '#FACC15', '#34D399', '#A78BFA', '#FB7185', '#60A5FA', '#FBBF24', '#2DD4BF'];
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const rad = i < completedPieces ? 115 : 215;
      const px = Math.cos(a) * rad;
      const py = Math.sin(a) * rad;
      drawPuzzlePiece(ctx, px, py, 16, cols[i], -t * 0.25 + i * 0.4);
    }
    ctx.restore();

    // Starlight bridge floor
    paint(ctx, rectPts(-300, 545, W + 600, 220), { fill: '#1E1B4B', fillOp: 190, ink: '#38BDF8', sw: 3 });
  }

  // SET 11: Dawn Cherry-Blossom & Sea-Breeze Hill ("像是黑暗过后黎明盛开")
  function drawDawnBlossomHillSet(ctx, t) {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#38BDF8');
    grad.addColorStop(0.45, '#FDE68A');
    grad.addColorStop(0.80, '#F9A8D4');
    grad.addColorStop(1, '#86EFAC');
    ctx.fillStyle = grad;
    ctx.fillRect(-300, -200, W + 600, H + 400);

    // Blooming sunrise rays
    for (let r = 0; r < 10; r++) {
      const a = -Math.PI + (r / 9) * Math.PI;
      ctx.save();
      ctx.translate(640, 480);
      ctx.rotate(a);
      paint(ctx, polyPts([[0, 0], [55, -700], [-55, -700]]), { fill: '#FEF08A', fillOp: 42, ink: null });
      ctx.restore();
    }
    paint(ctx, ellPts(640, 445, 110, 110, 24), { fill: '#FEF9C3', ink: '#F59E0B', sw: 3 });

    // Rolling flower hill & drifting cherry blossom petals
    paint(ctx, ellPts(640, 740, 920, 220, 32), { fill: '#4ADE80', ink: '#166534', sw: 3 });
    for (let p = 0; p < 30; p++) {
      const px = ((p * 97 + t * 88) % 1400) - 60;
      const py = ((p * 61 + t * 42) % 580);
      paint(ctx, ellPts(px, py, 7, 4, 8), { fill: p % 2 ? '#FBCFE8' : '#F472B6', ink: null });
    }
  }

  // ==========================================================================
  // 56-Shot Master Schedule (1 Shot Per Bar = 2.5304s Across All 56 Bars!)
  // Cycles through all 31 canonical emotions with 3-stage mid-lyric transitions
  // ==========================================================================
  const SHOT_PLAN = [
    // --- INTRO: Bars 00–07 (Starlit Beach & Puzzle Discovery) ---
    { set: 'beachNight', style: 'watercolor', cam: [640, 375, 1.04, 0, 640, 355, 1.12, 0],
      act: 'walkRight', x0: 260, x1: 580, hat: 'Maid Headband', propR: 'lantern',
      emos: [[0.0, 'idle', null], [0.85, 'curious', 'question'], [1.70, 'sparkle', 'sparkle']], guest: 'miniWhale' },
    { set: 'beachNight', style: 'pixel', cam: [590, 390, 1.18, -0.01, 630, 380, 1.24, 0],
      act: 'kneelPick', x0: 600, x1: 600, hat: 'Maid Headband', propR: 'puzzle1',
      emos: [[0.0, 'curious', null], [0.80, 'gasp', 'exclaim'], [1.65, 'happy', 'sparkle']], guest: 'clawd' },
    { set: 'observatory', style: 'watercolor', cam: [640, 365, 1.06, 0, 620, 355, 1.14, 0],
      act: 'tailSit', x0: 640, x1: 640, hat: 'Wizard Hat', propL: 'starJar', propR: 'puzzle2',
      emos: [[0.0, 'think', 'idea'], [0.85, 'excited', 'sparkle'], [1.70, 'proud', 'music']], guest: 'ladyGemini' },
    { set: 'beachNight', style: 'watercolor', cam: [660, 380, 1.08, 0.01, 610, 370, 1.15, 0],
      act: 'spinTurn', x0: 620, x1: 660, hat: 'Maid Headband', propR: 'starJar',
      emos: [[0.0, 'zen', null], [0.85, 'shy', 'heart'], [1.70, 'love', 'heart']], guest: 'miniWhale' },
    { set: 'observatory', style: 'pixel', cam: [610, 375, 1.12, 0, 650, 365, 1.20, 0],
      act: 'walkLeft', x0: 760, x1: 520, hat: 'Maid Headband', propL: 'puzzle3',
      emos: [[0.0, 'determined', null], [0.85, 'wink', 'sparkle'], [1.70, 'happy', 'music']], guest: 'clawd' },
    { set: 'observatory', style: 'watercolor', cam: [640, 355, 1.16, 0, 640, 345, 1.26, 0],
      act: 'jumpJoy', x0: 560, x1: 680, hat: 'Crown', propR: 'puzzle1',
      emos: [[0.0, 'sparkle', 'sparkle'], [0.85, 'laugh', 'music'], [1.70, 'love', 'heart']], guest: 'ladyGemini' },
    { set: 'sunsetStation', style: 'watercolor', cam: [620, 385, 1.05, 0, 660, 375, 1.12, 0],
      act: 'walkRight', x0: 360, x1: 680, hat: 'Maid Headband', propR: 'lantern',
      emos: [[0.0, 'sigh', null], [0.85, 'worry', 'sweat'], [1.70, 'sad', null]], guest: 'bionicPuppy' },
    { set: 'beachNight', style: 'watercolor', cam: [640, 370, 1.14, 0, 640, 350, 1.24, 0],
      act: 'presentHeart', x0: 640, x1: 640, hat: 'Halo', propL: 'puzzle2', propR: 'starJar',
      emos: [[0.0, 'shy', null], [0.85, 'love', 'heart'], [1.70, 'determined', 'sparkle']], guest: 'ladyGemini' },

    // --- CHORUS 1: Bars 08–15 (Gathering Memories, Secret Tears, Clocktower Birds & Holding Fate) ---
    { set: 'observatory', style: 'watercolor', cam: [620, 365, 1.08, 0, 650, 355, 1.18, 0],
      act: 'walkRight', x0: 420, x1: 660, hat: 'Maid Headband', propR: 'puzzle1',
      emos: [[0.0, 'happy', 'sparkle'], [0.85, 'love', 'heart'], [1.70, 'shy', null]], guest: 'ladyGemini' },
    { set: 'observatory', style: 'pixel', cam: [640, 375, 1.16, -0.01, 640, 360, 1.24, 0],
      act: 'kneelPick', x0: 640, x1: 640, hat: 'Maid Headband', propL: 'starJar', propR: 'puzzle3',
      emos: [[0.0, 'curious', 'question'], [0.85, 'determined', 'exclaim'], [1.70, 'proud', 'sparkle']], guest: 'clawd' },
    { set: 'rainBusStop', style: 'watercolor', cam: [580, 385, 1.14, 0.01, 560, 375, 1.24, 0],
      act: 'umbrellaStand', x0: 540, x1: 540, hat: 'Maid Headband', propL: 'umbrella',
      emos: [[0.0, 'sad', null], [0.80, 'cry', 'sweat'], [1.65, 'plead', 'sweat']], guest: 'bionicPuppy' },
    { set: 'clocktower', style: 'watercolor', cam: [640, 355, 1.06, -0.02, 640, 335, 1.16, 0],
      act: 'runRight', x0: 340, x1: 760, hat: 'Maid Headband', propR: 'puzzle2',
      emos: [[0.0, 'worry', 'sweat'], [0.85, 'panicked', 'exclaim'], [1.70, 'sad', null]], guest: 'miniWhale' },
    { set: 'cosmicGalaxy', style: 'neon', cam: [640, 360, 1.10, 0, 640, 345, 1.20, 0],
      act: 'spinTurn', x0: 640, x1: 640, hat: 'Halo', propL: 'puzzle1', propR: 'starJar',
      emos: [[0.0, 'plead', null], [0.85, 'hope', 'sparkle'], [1.70, 'love', 'heart']], guest: 'ladyGemini' },
    { set: 'cosmicGalaxy', style: 'watercolor', cam: [640, 365, 1.18, 0, 640, 350, 1.28, 0],
      act: 'jumpJoy', x0: 580, x1: 660, hat: 'Crown', propR: 'puzzle3',
      emos: [[0.0, 'determined', 'exclaim'], [0.85, 'proud', 'sparkle'], [1.70, 'excited', 'heart']], guest: 'ladyClaude' },
    { set: 'clocktower', style: 'pixel', cam: [610, 370, 1.08, 0, 660, 360, 1.16, 0],
      act: 'walkLeft', x0: 780, x1: 500, hat: 'Maid Headband', propL: 'lantern', propR: 'puzzle2',
      emos: [[0.0, 'think', null], [0.85, 'zen', 'music'], [1.70, 'happy', 'sparkle']], guest: 'ladyGemini' },
    { set: 'observatory', style: 'watercolor', cam: [640, 360, 1.12, 0, 640, 345, 1.22, 0],
      act: 'presentHeart', x0: 640, x1: 640, hat: 'Maid Headband', propL: 'puzzle1', propR: 'puzzle3',
      emos: [[0.0, 'sparkle', 'sparkle'], [0.85, 'love', 'heart'], [1.70, 'wink', 'music']], guest: 'clawd' },

    // --- VERSE 1A: Bars 16–23 (Bright Future, Starry Sky, Autumn Leaves, Bonsai & Sunset Parting) ---
    { set: 'dawnHill', style: 'watercolor', cam: [620, 375, 1.06, 0, 660, 365, 1.14, 0],
      act: 'walkRight', x0: 360, x1: 680, hat: 'Flower Pin', propR: 'puzzle1',
      emos: [[0.0, 'happy', 'sparkle'], [0.85, 'excited', 'music'], [1.70, 'proud', 'sparkle']], guest: 'ladyGemini' },
    { set: 'beachNight', style: 'neon', cam: [640, 355, 1.10, 0, 640, 335, 1.20, 0],
      act: 'jumpJoy', x0: 540, x1: 680, hat: 'Wizard Hat', propL: 'starJar',
      emos: [[0.0, 'sparkle', 'sparkle'], [0.85, 'gasp', 'exclaim'], [1.70, 'love', 'heart']], guest: 'miniWhale' },
    { set: 'rainBusStop', style: 'watercolor', cam: [600, 385, 1.14, 0.02, 580, 390, 1.22, 0],
      act: 'tailSit', x0: 560, x1: 560, hat: 'Maid Headband',
      emos: [[0.0, 'bored', null], [0.85, 'sleepy', 'zzz'], [1.70, 'sigh', 'sweat']], guest: 'bionicPuppy' },
    { set: 'autumnGinkgo', style: 'watercolor', cam: [640, 370, 1.06, 0, 640, 360, 1.15, 0],
      act: 'duetWalk', x0: 380, x1: 620, hat: 'Beret', propR: 'loveLetter',
      emos: [[0.0, 'shy', 'heart'], [0.85, 'happy', 'sparkle'], [1.70, 'love', 'heart']], guest: 'ladyGemini' },
    { set: 'autumnGinkgo', style: 'pixel', cam: [630, 375, 1.12, -0.01, 660, 360, 1.20, 0],
      act: 'jumpJoy', x0: 520, x1: 680, hat: 'Crown', propR: 'puzzle2',
      emos: [[0.0, 'scared', 'sweat'], [0.85, 'determined', 'exclaim'], [1.70, 'proud', 'sparkle']], guest: 'ladyClaude' },
    { set: 'greenhouse', style: 'watercolor', cam: [640, 375, 1.10, 0, 640, 365, 1.18, 0],
      act: 'waterBonsai', x0: 560, x1: 620, hat: 'Flower Pin', propL: 'bonsai', propR: 'wateringCan',
      emos: [[0.0, 'zen', 'music'], [0.85, 'happy', 'sparkle'], [1.70, 'love', 'heart']], guest: 'ladyGemini' },
    { set: 'greenhouse', style: 'watercolor', cam: [640, 365, 1.08, 0, 640, 355, 1.16, 0],
      act: 'spinTurn', x0: 600, x1: 660, hat: 'Cat Ears', propL: 'bonsai', propR: 'puzzle3',
      emos: [[0.0, 'laugh', 'music'], [0.85, 'wink', 'sparkle'], [1.70, 'excited', 'heart']], guest: 'clawd' },
    { set: 'sunsetStation', style: 'watercolor', cam: [620, 380, 1.06, 0, 680, 375, 1.16, 0],
      act: 'runRight', x0: 360, x1: 760, hat: 'Maid Headband', propR: 'puzzle1',
      emos: [[0.0, 'worry', 'sweat'], [0.85, 'sad', null], [1.70, 'plead', 'sweat']], guest: 'ladyGemini' },

    // --- VERSE 1B: Bars 24–31 (Stamp Album, Night Yokai, Absent-Minded Child, Confession & Dawn) ---
    { set: 'stampStudy', style: 'watercolor', cam: [640, 375, 1.12, 0, 640, 365, 1.20, 0],
      act: 'tailSit', x0: 580, x1: 580, hat: 'Headphones', propL: 'stampAlbum',
      emos: [[0.0, 'curious', 'question'], [0.85, 'laugh', 'music'], [1.70, 'bored', 'zzz']], guest: 'ladyGemini' },
    { set: 'fireflyForest', style: 'pixel', cam: [630, 380, 1.10, 0.02, 650, 370, 1.18, -0.02],
      act: 'runLeft', x0: 780, x1: 460, hat: 'Maid Headband', propR: 'lantern',
      emos: [[0.0, 'scared', 'exclaim'], [0.80, 'shock', 'sweat'], [1.65, 'panicked', 'exclaim']], guest: 'clawd' },
    { set: 'stampStudy', style: 'watercolor', cam: [620, 375, 1.14, 0, 650, 365, 1.22, 0],
      act: 'walkRight', x0: 460, x1: 660, hat: 'Flower Pin', propR: 'stampAlbum',
      emos: [[0.0, 'confused', 'question'], [0.85, 'shy', 'heart'], [1.70, 'smug', 'sparkle']], guest: 'ladyGemini' },
    { set: 'autumnGinkgo', style: 'watercolor', cam: [640, 370, 1.10, 0, 640, 355, 1.18, 0],
      act: 'jumpJoy', x0: 520, x1: 680, hat: 'Party Cone', propL: 'starJar',
      emos: [[0.0, 'mischief', 'sparkle'], [0.85, 'laugh', 'music'], [1.70, 'excited', 'sparkle']], guest: 'bionicPuppy' },
    { set: 'beachNight', style: 'watercolor', cam: [640, 375, 1.16, 0, 640, 360, 1.26, 0],
      act: 'presentHeart', x0: 600, x1: 600, hat: 'Maid Headband', propL: 'loveLetter', propR: 'puzzle2',
      emos: [[0.0, 'shy', 'sweat'], [0.85, 'pout', 'heart'], [1.70, 'love', 'heart']], guest: 'ladyGemini' },
    { set: 'cosmicGalaxy', style: 'neon', cam: [640, 360, 1.08, -0.01, 640, 345, 1.20, 0.01],
      act: 'spinTurn', x0: 640, x1: 640, hat: 'Wizard Hat', propL: 'loveLetter', propR: 'starJar',
      emos: [[0.0, 'worry', 'sweat'], [0.85, 'gasp', 'exclaim'], [1.70, 'sparkle', 'sparkle']], guest: 'ladyGemini' },
    { set: 'cosmicGalaxy', style: 'pixel', cam: [640, 365, 1.14, 0.02, 640, 350, 1.24, -0.01],
      act: 'runRight', x0: 420, x1: 740, hat: 'Maid Headband', propR: 'puzzle3',
      emos: [[0.0, 'dizzy', 'sweat'], [0.80, 'panicked', 'exclaim'], [1.65, 'determined', 'exclaim']], guest: 'clawd' },
    { set: 'dawnHill', style: 'watercolor', cam: [640, 365, 1.06, 0, 640, 340, 1.18, 0],
      act: 'jumpJoy', x0: 580, x1: 660, hat: 'Halo', propL: 'puzzle1', propR: 'starJar',
      emos: [[0.0, 'gasp', 'sparkle'], [0.85, 'sparkle', 'sparkle'], [1.70, 'happy', 'heart']], guest: 'ladyGemini' },

    // --- CHORUS 2: Bars 32–39 (Second Chorus — Full Duet & Emotional Climax) ---
    { set: 'dawnHill', style: 'watercolor', cam: [620, 370, 1.08, 0, 660, 360, 1.16, 0],
      act: 'duetWalk', x0: 380, x1: 620, hat: 'Flower Pin', propR: 'puzzle1',
      emos: [[0.0, 'happy', 'sparkle'], [0.85, 'love', 'heart'], [1.70, 'proud', 'music']], guest: 'ladyGemini' },
    { set: 'observatory', style: 'watercolor', cam: [640, 370, 1.14, 0, 640, 355, 1.22, 0],
      act: 'kneelPick', x0: 620, x1: 620, hat: 'Crown', propL: 'puzzle2', propR: 'puzzle3',
      emos: [[0.0, 'determined', null], [0.85, 'sparkle', 'sparkle'], [1.70, 'happy', 'heart']], guest: 'ladyClaude' },
    { set: 'rainBusStop', style: 'pixel', cam: [600, 380, 1.16, 0, 580, 370, 1.24, 0],
      act: 'umbrellaStand', x0: 560, x1: 560, hat: 'Maid Headband', propL: 'umbrella',
      emos: [[0.0, 'sad', null], [0.80, 'cry', 'sweat'], [1.65, 'sigh', null]], guest: 'miniWhale' },
    { set: 'clocktower', style: 'watercolor', cam: [640, 360, 1.08, -0.01, 640, 345, 1.18, 0],
      act: 'runLeft', x0: 820, x1: 440, hat: 'Maid Headband', propR: 'lantern',
      emos: [[0.0, 'worry', 'sweat'], [0.85, 'plead', 'sweat'], [1.70, 'determined', 'exclaim']], guest: 'ladyGemini' },
    { set: 'cosmicGalaxy', style: 'neon', cam: [640, 360, 1.12, 0, 640, 345, 1.22, 0],
      act: 'presentHeart', x0: 620, x1: 620, hat: 'Halo', propL: 'loveLetter', propR: 'puzzle1',
      emos: [[0.0, 'shy', 'heart'], [0.85, 'love', 'heart'], [1.70, 'sparkle', 'sparkle']], guest: 'ladyGemini' },
    { set: 'cosmicGalaxy', style: 'watercolor', cam: [640, 365, 1.16, 0, 640, 350, 1.26, 0],
      act: 'jumpJoy', x0: 560, x1: 680, hat: 'Crown', propL: 'puzzle2', propR: 'puzzle3',
      emos: [[0.0, 'determined', 'exclaim'], [0.85, 'proud', 'sparkle'], [1.70, 'love', 'heart']], guest: 'clawd' },
    { set: 'sunsetStation', style: 'watercolor', cam: [620, 375, 1.08, 0, 660, 365, 1.16, 0],
      act: 'walkRight', x0: 400, x1: 680, hat: 'Maid Headband', propR: 'starJar',
      emos: [[0.0, 'zen', 'music'], [0.85, 'happy', 'sparkle'], [1.70, 'wink', 'heart']], guest: 'ladyGemini' },
    { set: 'observatory', style: 'pixel', cam: [640, 360, 1.14, 0, 640, 345, 1.24, 0],
      act: 'spinTurn', x0: 640, x1: 640, hat: 'Wizard Hat', propL: 'puzzle1', propR: 'starJar',
      emos: [[0.0, 'sparkle', 'sparkle'], [0.85, 'excited', 'music'], [1.70, 'love', 'heart']], guest: 'ladyClaude' },

    // --- CODA 1: Bars 40–47 (Collecting Memories Alone, Tears, Gratitude & Blessing) ---
    { set: 'beachNight', style: 'watercolor', cam: [620, 380, 1.08, 0, 650, 370, 1.16, 0],
      act: 'walkRight', x0: 340, x1: 640, hat: 'Maid Headband', propL: 'lantern', propR: 'puzzle1',
      emos: [[0.0, 'sad', null], [0.85, 'sigh', null], [1.70, 'determined', 'sparkle']], guest: 'miniWhale' },
    { set: 'rainBusStop', style: 'watercolor', cam: [600, 380, 1.16, 0, 600, 370, 1.24, 0],
      act: 'kneelPick', x0: 580, x1: 580, hat: 'Maid Headband', propR: 'puzzle2',
      emos: [[0.0, 'cry', 'sweat'], [0.85, 'plead', 'sweat'], [1.70, 'sad', null]], guest: 'bionicPuppy' },
    { set: 'clocktower', style: 'pixel', cam: [640, 365, 1.10, -0.02, 640, 355, 1.20, 0.02],
      act: 'runRight', x0: 360, x1: 760, hat: 'Maid Headband', propR: 'puzzle3',
      emos: [[0.0, 'angry', 'anger'], [0.85, 'annoyed', 'sweat'], [1.70, 'worry', 'exclaim']], guest: 'clawd' },
    { set: 'clocktower', style: 'watercolor', cam: [640, 370, 1.14, 0, 640, 355, 1.22, 0],
      act: 'tailSit', x0: 640, x1: 640, hat: 'Maid Headband', propL: 'starJar',
      emos: [[0.0, 'dead', null], [0.85, 'sad', 'sweat'], [1.70, 'sigh', null]], guest: 'miniWhale' },
    { set: 'greenhouse', style: 'watercolor', cam: [630, 370, 1.10, 0, 650, 360, 1.18, 0],
      act: 'waterBonsai', x0: 580, x1: 620, hat: 'Flower Pin', propL: 'bonsai', propR: 'loveLetter',
      emos: [[0.0, 'shy', 'heart'], [0.85, 'happy', 'sparkle'], [1.70, 'love', 'heart']], guest: 'ladyGemini' },
    { set: 'autumnGinkgo', style: 'watercolor', cam: [640, 370, 1.08, 0, 640, 355, 1.16, 0],
      act: 'duetWalk', x0: 400, x1: 640, hat: 'Crown', propR: 'stampAlbum',
      emos: [[0.0, 'sparkle', 'sparkle'], [0.85, 'proud', 'music'], [1.70, 'love', 'heart']], guest: 'ladyGemini' },
    { set: 'sunsetStation', style: 'watercolor', cam: [620, 375, 1.06, 0, 660, 365, 1.16, 0],
      act: 'walkLeft', x0: 760, x1: 520, hat: 'Maid Headband', propL: 'puzzle1', propR: 'lantern',
      emos: [[0.0, 'sigh', null], [0.85, 'zen', null], [1.70, 'happy', 'sparkle']], guest: 'ladyClaude' },
    { set: 'dawnHill', style: 'watercolor', cam: [640, 360, 1.12, 0, 640, 345, 1.22, 0],
      act: 'presentHeart', x0: 620, x1: 620, hat: 'Halo', propL: 'starJar', propR: 'loveLetter',
      emos: [[0.0, 'happy', 'music'], [0.85, 'wink', 'sparkle'], [1.70, 'love', 'heart']], guest: 'ladyGemini' },

    // --- CODA 2 / FINALE: Bars 48–55 (Final Assembly of All 9 Puzzle Pieces & Sunrise Finale) ---
    { set: 'observatory', style: 'pixel', cam: [640, 370, 1.10, 0, 640, 360, 1.18, 0],
      act: 'walkRight', x0: 420, x1: 640, hat: 'Maid Headband', propL: 'puzzle1', propR: 'puzzle2',
      emos: [[0.0, 'think', null], [0.85, 'determined', 'sparkle'], [1.70, 'proud', 'music']], guest: 'clawd' },
    { set: 'observatory', style: 'watercolor', cam: [640, 375, 1.16, 0, 640, 360, 1.24, 0],
      act: 'kneelPick', x0: 640, x1: 640, hat: 'Maid Headband', propR: 'puzzle3',
      emos: [[0.0, 'cry', 'sweat'], [0.85, 'shy', 'heart'], [1.70, 'happy', 'sparkle']], guest: 'ladyGemini' },
    { set: 'clocktower', style: 'watercolor', cam: [640, 360, 1.10, -0.01, 640, 345, 1.18, 0],
      act: 'spinTurn', x0: 640, x1: 640, hat: 'Wizard Hat', propL: 'lantern',
      emos: [[0.0, 'confused', 'question'], [0.85, 'worry', 'sweat'], [1.70, 'zen', null]], guest: 'miniWhale' },
    { set: 'beachNight', style: 'neon', cam: [640, 370, 1.12, 0, 640, 355, 1.20, 0],
      act: 'runRight', x0: 380, x1: 720, hat: 'Maid Headband', propR: 'starJar',
      emos: [[0.0, 'sad', null], [0.85, 'determined', 'exclaim'], [1.70, 'sparkle', 'sparkle']], guest: 'ladyGemini' },
    { set: 'cosmicGalaxy', style: 'watercolor', cam: [640, 355, 1.10, 0, 640, 340, 1.20, 0],
      act: 'presentHeart', x0: 600, x1: 600, hat: 'Crown', propL: 'loveLetter', propR: 'puzzle1',
      emos: [[0.0, 'shy', 'heart'], [0.85, 'love', 'heart'], [1.70, 'happy', 'sparkle']], guest: 'ladyGemini' },
    { set: 'dawnHill', style: 'watercolor', cam: [640, 365, 1.08, 0, 640, 350, 1.16, 0],
      act: 'duetWalk', x0: 400, x1: 640, hat: 'Flower Pin', propL: 'bonsai', propR: 'puzzle2',
      emos: [[0.0, 'happy', 'music'], [0.85, 'excited', 'sparkle'], [1.70, 'love', 'heart']], guest: 'ladyGemini' },
    { set: 'beachDawn', style: 'watercolor', cam: [640, 365, 1.06, 0, 640, 350, 1.16, 0],
      act: 'jumpJoy', x0: 540, x1: 660, hat: 'Halo', propL: 'starJar', propR: 'puzzle3',
      emos: [[0.0, 'zen', 'music'], [0.85, 'sparkle', 'sparkle'], [1.70, 'love', 'heart']], guest: 'ladyClaude' },
    { set: 'dawnHill', style: 'watercolor', cam: [640, 365, 1.06, 0, 640, 330, 1.22, 0],
      act: 'finaleEnsemble', x0: 580, x1: 580, hat: 'Crown', propL: 'loveLetter', propR: 'puzzle1',
      emos: [[0.0, 'love', 'heart'], [0.85, 'sparkle', 'sparkle'], [1.70, 'wink', 'heart']], guest: 'all' }
  ];

  function resolvePropFn(propName, t) {
    if (!propName) return undefined;
    if (propName === 'puzzle1') return holdPuzzle('#38BDF8', Math.sin(t * 3) * 0.2);
    if (propName === 'puzzle2') return holdPuzzle('#F472B6', -Math.sin(t * 3) * 0.2);
    if (propName === 'puzzle3') return holdPuzzle('#FACC15', Math.cos(t * 3) * 0.2);
    if (propName === 'starJar') return holdStarJar(t);
    if (propName === 'umbrella') return holdUmbrella('#38BDF8');
    if (propName === 'bonsai') return holdBonsaiPot(t);
    if (propName === 'wateringCan') return holdWateringCan(true, t);
    if (propName === 'stampAlbum') return holdStampAlbum;
    if (propName === 'loveLetter') return holdLoveLetter;
    if (propName === 'lantern') return holdLantern(t);
    return undefined;
  }

  // ==========================================================================
  // HUD & Beat-Synced Bilingual Lyric Subtitle Overlay
  // ==========================================================================
  function drawSubtitleOverlay(ctx, t, barIdx) {
    const active = LYRICS[clamp(barIdx, 0, LYRICS.length - 1)];
    if (!active) return;

    const pieces = clamp(Math.floor(((barIdx + 1) / 56) * 9), 1, 9);

    // Top-left chapter badge & Top-right 9/9 Memory Puzzle Progress HUD
    ctx.save();
    paint(ctx, rrPts(24, 20, 295, 38, 12), { fill: '#0F172A', fillOp: 185, ink: '#38BDF8', sw: 1.8 });
    ctx.font = 'bold 16px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
    ctx.fillStyle = '#7DD3FC';
    ctx.textAlign = 'left';
    ctx.fillText(`${active.tag} · SHOT ${String(barIdx + 1).padStart(2, '0')}/56`, 40, 45);

    paint(ctx, rrPts(W - 265, 20, 240, 38, 12), { fill: '#0F172A', fillOp: 185, ink: '#FACC15', sw: 1.8 });
    ctx.font = 'bold 16px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
    ctx.fillStyle = '#FDE047';
    ctx.textAlign = 'right';
    ctx.fillText(`记忆拼图 ${pieces}/9 片`, W - 40, 45);
    ctx.restore();

    // Bottom lyric subtitle pill with karaoke progress glow
    const lt = clamp(t - active.t0, 0, active.t1 - active.t0);
    const dur = Math.max(0.1, active.t1 - active.t0);
    const prog = clamp(lt / dur, 0, 1);
    const popY = lt < 0.16 ? (1 - backOut(lt / 0.16)) * 14 : 0;

    ctx.save();
    ctx.translate(0, popY);
    paint(ctx, rrPts(210, H - 102, W - 420, 78, 20), {
      fill: '#090D1E', fillOp: 205, ink: '#38BDF8', sw: 2.2
    });

    // Chinese lyric with golden karaoke fill sweep
    ctx.font = 'bold 31px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#090D1E';
    ctx.strokeText(active.zh, W / 2, H - 62);
    ctx.fillStyle = '#E0F2FE';
    ctx.fillText(active.zh, W / 2, H - 62);

    // Highlighted progress clip
    const textW = ctx.measureText(active.zh).width;
    ctx.save();
    ctx.beginPath();
    ctx.rect(W / 2 - textW / 2, H - 96, textW * prog, 46);
    ctx.clip();
    ctx.fillStyle = '#FDE047';
    ctx.fillText(active.zh, W / 2, H - 62);
    ctx.restore();

    // English subtitle line
    ctx.font = 'bold 14px "Silkscreen", "NotoSansSC", monospace';
    ctx.fillStyle = '#93C5FD';
    ctx.fillText(active.en, W / 2, H - 36);
    ctx.restore();
  }

  // ==========================================================================
  // Main Frame Renderer: `renderBaHuiyiFrame(ctx, t)`
  // ==========================================================================
  function renderBaHuiyiFrame(ctx, t) {
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    if (typeof setBoil === 'function') setBoil(t, 12);
    else if (typeof CORE.boilFrame === 'function') CORE.boilFrame(t);

    // Determine active bar / shot index (0..55)
    let barIdx = Math.floor((t - OFF) / BAR);
    barIdx = clamp(barIdx, 0, 55);
    const shot = SHOT_PLAN[barIdx] || SHOT_PLAN[0];
    const t0 = barIdx === 0 ? 0 : BAR_T(barIdx);
    const t1 = barIdx === 55 ? DURATION : BAR_T(barIdx + 1);
    const lt = clamp(t - t0, 0, t1 - t0);
    const dur = Math.max(0.1, t1 - t0);
    const k = clamp(lt / dur, 0, 1);

    setActiveStyle(shot.style || 'watercolor');

    // Intra-shot focus pull / camera cut at midpoint on energetic chorus/coda shots
    const midCut = (barIdx >= 8 && barIdx <= 15) || (barIdx >= 32 && barIdx <= 39);
    const zoomBoost = (midCut && lt > dur * 0.52) ? 1.07 : 1.0;
    const cx = lerp(shot.cam[0], shot.cam[4], ease(k));
    const cy = lerp(shot.cam[1], shot.cam[5], ease(k));
    const cz = lerp(shot.cam[2], shot.cam[6], ease(k)) * zoomBoost;
    const crot = lerp(shot.cam[3], shot.cam[7], ease(k));

    camBegin(ctx, cx, cy, cz, crot);

    // 1. Render Full-Screen Painted Environment Set
    const pieces = clamp(Math.floor(((barIdx + 1) / 56) * 9), 1, 9);
    switch (shot.set) {
      case 'beachNight':    drawStarlitBeachSet(ctx, t, 'night'); break;
      case 'beachDawn':     drawStarlitBeachSet(ctx, t, 'dawn'); break;
      case 'observatory':   drawPuzzleObservatorySet(ctx, t, pieces); break;
      case 'rainBusStop':   drawRainBusStopSet(ctx, t); break;
      case 'clocktower':    drawClocktowerBirdsSet(ctx, t); break;
      case 'autumnGinkgo':  drawAutumnGinkgoSet(ctx, t); break;
      case 'greenhouse':    drawGreenhouseBonsaiSet(ctx, t); break;
      case 'sunsetStation': drawSunsetStationSet(ctx, t, lt * 65); break;
      case 'stampStudy':    drawStampStudySet(ctx, t); break;
      case 'fireflyForest': drawFireflyForestSet(ctx, t); break;
      case 'cosmicGalaxy':  drawCosmicGalaxySet(ctx, t, pieces); break;
      case 'dawnHill':      drawDawnBlossomHillSet(ctx, t); break;
      default:              drawStarlitBeachSet(ctx, t, 'night'); break;
    }

    // 2. Compute Physical Action & Locomotion State for `whaleGirl`
    const groundY = 585;
    const u = 30;
    let actOpts = { x: shot.x0, y: groundY, view: 'front', flip: false, tailSit: false, poseMode: null };

    if (shot.act === 'walkRight' || shot.act === 'walkLeft') {
      const st = stroll(lt, 0.05, dur - 0.10, shot.x0, shot.x1, u);
      actOpts = Object.assign(actOpts, st);
    } else if (shot.act === 'runRight' || shot.act === 'runLeft') {
      const rn = runTo(lt, 0.05, dur - 0.10, shot.x0, shot.x1, u);
      actOpts = Object.assign(actOpts, rn);
    } else if (shot.act === 'jumpJoy') {
      const jp = jumpArc(lt, 0.45, 1.65, shot.x0, shot.x1, groundY, 92);
      actOpts.x = jp.x;
      actOpts.y = jp.y;
      actOpts.sq = jp.sq;
      actOpts.view = lt > 0.45 && lt < 1.65 ? 'q' : 'front';
      actOpts.waveArm = true;
    } else if (shot.act === 'kneelPick') {
      const kn = lt < 0.7 ? ease(lt / 0.7) : (lt < 1.85 ? 1 : 1 - ease((lt - 1.85) / 0.6));
      actOpts.kneel = kn * 0.85;
      actOpts.view = 'q';
      // Floating puzzle shard on the ground before pickup
      if (lt < 1.35) {
        drawPuzzlePiece(ctx, shot.x0 + 55, groundY - 12 - Math.sin(t * 6) * 6, 18, '#FACC15', t * 2);
      }
    } else if (shot.act === 'tailSit') {
      actOpts.tailSit = true;
      actOpts.y = groundY - 8;
    } else if (shot.act === 'spinTurn') {
      const vw = spinView(lt, 2.2);
      actOpts.view = vw.view;
      actOpts.x = lerp(shot.x0, shot.x1, k);
      actOpts.waveArm = true;
    } else if (shot.act === 'duetWalk') {
      const st = stroll(lt, 0.05, dur - 0.10, shot.x0, shot.x1, u);
      actOpts = Object.assign(actOpts, st);
    } else if (shot.act === 'waterBonsai') {
      actOpts.x = lerp(shot.x0, shot.x1, k);
      actOpts.view = 'q';
      actOpts.aR = 0.95 + Math.sin(t * 5) * 0.18;
    } else if (shot.act === 'presentHeart' || shot.act === 'finaleEnsemble') {
      actOpts.x = shot.x0;
      actOpts.heartHands = lt > 0.85 && lt < 1.75;
      actOpts.waveArm = true;
    }

    // 3. Render Guest Co-Stars (`ladyGemini`, `ladyClaude`, `clawd`, `miniWhale`, `bionicPuppy`)
    if (shot.guest === 'ladyGemini' || shot.guest === 'all') {
      const gx = shot.act === 'duetWalk' ? actOpts.x + 155 : 835 + Math.sin(t * 2.2) * 12;
      const gWalk = shot.act === 'duetWalk' ? actOpts.walk : 0;
      if (CAST.ladyGemini) {
        CAST.ladyGemini(ctx, gx, groundY, 28, {
          t,
          walk: gWalk,
          flip: true,
          emote: lt > 1.2 ? 'sparkle' : null
        });
      }
    }
    if (shot.guest === 'ladyClaude' || shot.guest === 'all') {
      const cxGuest = shot.guest === 'all' ? 395 : 830;
      if (CAST.ladyClaude) {
        CAST.ladyClaude(ctx, cxGuest, groundY, 27, {
          t,
          flip: cxGuest > actOpts.x,
          emote: lt > 1.1 ? 'heart' : null
        });
      }
    }
    if (shot.guest === 'clawd' || shot.guest === 'all') {
      const clx = shot.guest === 'all' ? 275 : actOpts.x - 140;
      if (CAST.clawd) {
        CAST.clawd(ctx, clx, groundY + 4, 21, { t, hat: 'crown', happy: true });
      }
    }
    if (shot.guest === 'miniWhale' || shot.guest === 'all') {
      const mwx = shot.guest === 'all' ? 965 : actOpts.x + 150;
      const mwy = groundY - 125 + Math.sin(t * 4.2) * 16;
      if (CAST.miniWhale) {
        CAST.miniWhale(ctx, mwx, mwy, 20, { t, spout: true });
      }
    }
    if (shot.guest === 'bionicPuppy' || shot.guest === 'all') {
      const bpx = shot.guest === 'all' ? 1020 : actOpts.x + 135;
      if (CAST.bionicPuppy) {
        CAST.bionicPuppy(ctx, bpx, groundY + 2, 19, { t, flip: true });
      }
    }

    // 4. Render Protagonist `whaleGirl` with 3-Stage Smooth Mid-Lyric Emotion Transitions (`emotions`)!
    const emoState = emotions(lt, shot.emos, { take: true });
    whaleGirl(ctx, actOpts.x, actOpts.y, u, Object.assign({}, emoState, actOpts, {
      t,
      lt,
      style: shot.style || 'watercolor',
      hat: shot.hat || 'Maid Headband',
      armL: resolvePropFn(shot.propL, t),
      armR: resolvePropFn(shot.propR, t)
    }));

    // In Finale Shot (Bar 55), display the completed 9/9 Golden Star-Whale Puzzle Constellation overhead!
    if (barIdx === 55) {
      drawPuzzlePiece(ctx, 640, 185 + Math.sin(t * 4) * 8, 34, '#FDE047', Math.sin(t * 2) * 0.15);
    }

    camEnd(ctx);

    // 5. Cinematic Transitions at Section Boundaries & Finale Iris Close
    if ([8, 16, 24, 32, 40, 48].includes(barIdx) && lt < 0.42) {
      brushWipe(ctx, lt / 0.42, ['#38BDF8', '#F472B6', '#FDE047']);
    }
    if (t > DURATION - 1.8) {
      const r = lerp(820, 0, easeIn(seg(t, DURATION - 1.8, DURATION - 0.05)));
      iris(ctx, 640, 320, r, '#090D1E');
    }

    // 6. Beat-Synced Authentic Lyric Subtitles & Puzzle Counter HUD
    drawSubtitleOverlay(ctx, t, barIdx);

    ctx.restore();
  }

  const api = {
    DURATION,
    BPM,
    BEAT,
    BAR,
    OFF,
    LYRICS,
    SHOT_PLAN,
    renderBaHuiyiFrame
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.MV_BA_HUIYI = api;
})(typeof window !== 'undefined' ? window : globalThis);
