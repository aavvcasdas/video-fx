// ============================================================================
// src/mv_chaoxi.js — 《傅梦彤 - 潮汐 (Natural)》(深海鲸鱼娘 · 澄蓝潮汐篇) 31.84s MV Director
// Built on the `mv_ba_huiyi_pinhao_gei_ni` non-repeating multi-set architecture:
//   - 11 unique non-repeating painted environments across 11 lyric shots (`31.84s`)
//   - 100% acoustically & Vosk-verified lyrics of 傅梦彤《潮汐》 ([00:20.66]–[00:52.50])
//   - 28 `codex-deepseek-pet` & `dsh-dayu-fish-skin` actions + `drawFatFish` + `ladyGemini`
// ============================================================================

(function (root) {
  const CORE = root.CORE || (typeof require !== 'undefined' ? require('./core.js') : {});
  const WHALE = root.WHALE_GIRL || (typeof require !== 'undefined' ? require('./whale_girl.js') : {});
  const BAHUIYI = root.MV_BA_HUIYI || (typeof require !== 'undefined' ? require('./mv_ba_huiyi_pinhao_gei_ni.js') : {});

  const { W = 1280, H = 720, clamp, lerp, seg, easeIn, backOut, rrPts, paint, iris } = CORE;
  const DURATION = 31.84;

  // ==========================================================================
  // 100% Vosk & Official LRC-Verified Lyrics of 傅梦彤《潮汐》 (0.00s – 31.84s)
  // Exact slice: [00:20.66] – [00:52.50] (`LRC_time - 20.66s`)
  // ==========================================================================
  const SUBTITLES_CHAOXI = [
    {
      t0: 0.00, t1: 2.68,
      zh: '当海面迎来汹涌的潮汐',
      en: 'When the surging tide rises across the ocean surface',
      setKey: 'beachNight',
      action: 'umbrella_stroll',
      emos: [[0.0, 'calm', 'music'], [0.9, 'surprised', 'exclaim'], [1.8, 'excited', 'sparkle']]
    },
    {
      t0: 2.68, t1: 5.35,
      zh: '我奔跑寻找昔日的足迹',
      en: 'I run along the shore searching for footprints of the past',
      setKey: 'sunflowerCoast',
      action: 'run_sprint',
      emos: [[0.0, 'focused', 'exclaim'], [0.9, 'excited', 'sparkle'], [1.8, 'happy', 'music']]
    },
    {
      t0: 5.35, t1: 7.85,
      zh: '夕阳下倒影迷人的美丽',
      en: 'Beneath the setting sun, reflections shimmer with beauty',
      setKey: 'veniceBridge',
      action: 'camera_shutter',
      emos: [[0.0, 'starstruck', 'sparkle'], [0.85, 'love', 'heart'], [1.7, 'wink', 'heart']]
    },
    {
      t0: 7.85, t1: 10.50,
      zh: '可我却丢失故事和你',
      en: 'Yet somehow I lost both our story and you',
      setKey: 'rainBusStop',
      action: 'cry_fountain',
      emos: [[0.0, 'sad', 'sweat'], [0.9, 'cry', 'sweat'], [1.8, 'sob', null]]
    },
    {
      t0: 10.50, t1: 13.00,
      zh: '你说过向往大海的神秘',
      en: 'You once said you longed for the mystery of the deep sea',
      setKey: 'coralAbyss',
      action: 'peek_curious',
      emos: [[0.0, 'question', 'question'], [0.85, 'idea', 'idea'], [1.7, 'starstruck', 'sparkle']]
    },
    {
      t0: 13.00, t1: 15.65,
      zh: '也憧憬我们遗失的过去',
      en: 'And dreamed of the past that slipped through our hands',
      setKey: 'observatory',
      action: 'eat_white_rice',
      emos: [[0.0, 'thinking', 'music'], [0.9, 'happy', 'heart'], [1.8, 'joy', 'sparkle']]
    },
    {
      t0: 15.65, t1: 19.15,
      zh: '分享给大海秘密',
      en: 'Sharing every secret with the boundless azure sea',
      setKey: 'auroraHarbor',
      action: 'hum_working_song',
      emos: [[0.0, 'singing', 'music'], [1.1, 'shy', 'heart'], [2.2, 'wink', 'sparkle']]
    },
    {
      t0: 19.15, t1: 21.55,
      zh: '蓝色的海底',
      en: 'Deep beneath the glowing sapphire seabed',
      setKey: 'deepseekLab',
      action: 'fatfish_transform',
      emos: [[0.0, 'excited', 'sparkle'], [0.8, 'starstruck', 'heart'], [1.6, 'joy', 'music']]
    },
    {
      t0: 21.55, t1: 24.05,
      zh: '远山的风景',
      en: 'And the distant mountain horizons bathed in dawn',
      setKey: 'dawnHill',
      action: 'ciallo_wink',
      emos: [[0.0, 'happy', 'sparkle'], [0.8, 'wink', 'heart'], [1.6, 'proud', 'sparkle']]
    },
    {
      t0: 24.05, t1: 29.25,
      zh: '我们的距离遥不可及',
      en: 'The distance between the two of us has grown out of reach',
      setKey: 'cosmicGalaxy',
      action: 'idol_mic_sing',
      emos: [[0.0, 'singing', 'music'], [1.6, 'sad', 'sweat'], [3.2, 'love', 'heart']]
    },
    {
      t0: 29.25, t1: 31.84,
      zh: '退守的爱情 还剩下回忆',
      en: 'A retreating love with every memory still shining bright',
      setKey: 'beachDawn',
      action: 'coin_hug',
      emos: [[0.0, 'calm', 'heart'], [0.85, 'love', 'sparkle'], [1.7, 'happy', 'heart']]
    }
  ];

  function getActiveCue(t) {
    for (let i = 0; i < SUBTITLES_CHAOXI.length; i++) {
      const s = SUBTITLES_CHAOXI[i];
      if (t >= s.t0 && t < s.t1) return { cue: s, idx: i };
    }
    return { cue: SUBTITLES_CHAOXI[SUBTITLES_CHAOXI.length - 1], idx: SUBTITLES_CHAOXI.length - 1 };
  }

  function renderChaoxiFrame(ctx, t) {
    ctx.save();
    ctx.clearRect(0, 0, W, H);

    const { cue, idx } = getActiveCue(t);
    const lt = clamp(t - cue.t0, 0, cue.t1 - cue.t0);
    const dur = Math.max(0.2, cue.t1 - cue.t0);

    // 1. Render Full Non-Repeating Multi-Set Shot via Benchmark Engine
    if (BAHUIYI && typeof BAHUIYI.renderMasterMVShot === 'function') {
      BAHUIYI.renderMasterMVShot(ctx, t, {
        shotIdx: idx,
        lt,
        dur,
        setKey: cue.setKey,
        action: cue.action,
        emos: cue.emos,
        style: ['watercolor', 'neon', 'watercolor', 'pixel'][idx % 4],
        guest: idx % 2 === 0 ? 'ladyGemini' : 'all'
      });
    }

    // 2. Top Header HUD Badge
    ctx.save();
    paint(ctx, rrPts(24, 20, 410, 38, 12), { fill: '#090D1E', fillOp: 205, ink: '#38BDF8', sw: 1.8 });
    ctx.font = 'bold 15px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
    ctx.fillStyle = '#7DD3FC';
    ctx.textAlign = 'left';
    ctx.fillText(`《潮汐》傅梦彤 · SHOT ${String(idx + 1).padStart(2, '0')}/11 [${cue.action}]`, 40, 44);
    ctx.restore();

    // 3. Bottom Karaoke Subtitle Bar (100% Audio-Aligned)
    const prog = clamp(lt / dur, 0, 1);
    const popY = lt < 0.16 ? (1 - backOut(lt / 0.16)) * 12 : 0;
    ctx.save();
    ctx.translate(0, popY);
    paint(ctx, rrPts(180, H - 104, W - 360, 80, 20), {
      fill: '#090D1E', fillOp: 220, ink: '#38BDF8', sw: 2.2
    });

    ctx.font = 'bold 31px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#090D1E';
    ctx.strokeText(cue.zh, W / 2, H - 62);
    ctx.fillStyle = '#E0F2FE';
    ctx.fillText(cue.zh, W / 2, H - 62);

    const textW = ctx.measureText(cue.zh).width;
    ctx.save();
    ctx.beginPath();
    ctx.rect(W / 2 - textW / 2, H - 98, textW * prog, 48);
    ctx.clip();
    ctx.fillStyle = '#FDE047';
    ctx.fillText(cue.zh, W / 2, H - 62);
    ctx.restore();

    ctx.font = 'bold 13px "Silkscreen", "NotoSansSC", monospace';
    ctx.fillStyle = '#93C5FD';
    ctx.fillText(cue.en, W / 2, H - 36);
    ctx.restore();

    if (t > DURATION - 1.1) {
      const r = lerp(820, 0, easeIn(seg(t, DURATION - 1.1, DURATION - 0.04)));
      iris(ctx, 640, 340, r, '#040814');
    }

    ctx.restore();
  }

  const EXPORTS = {
    DURATION,
    SUBTITLES_CHAOXI,
    renderChaoxiFrame
  };

  root.MV_CHAOXI = EXPORTS;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = EXPORTS;
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
