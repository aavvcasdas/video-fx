// src/mv_pengyou_de_jiu.js — Director & Scene Engine for 《朋友的酒》(深海鲸鱼娘 · 挚友欢聚篇)
// Replicates `朋友的酒.mp3` (188.25s, 30fps, 1280x720) with `whale_girl` (`src/whale_girl.js`)
// and all `CAST` friends (`src/cast.js`), synced to `assets/pengyou_de_jiu.mp3` &
// `assets/pengyou_de_jiu_audio.js` in `risograph` duotone print style.

(function (root) {
  'use strict';

  const CORE = (typeof window !== 'undefined' && window.CORE) ? window.CORE : require('./core.js');
  const WHALE = (typeof window !== 'undefined' && window.WHALE_GIRL) ? window.WHALE_GIRL : require('./whale_girl.js');
  const CAST = (typeof window !== 'undefined' && window.CAST) ? window.CAST : require('./cast.js');
  const { whaleGirl, feel } = WHALE;

  const DURATION = 188.25;

  // Beat-synced lyric timeline for 李晓杰《朋友的酒》 (188.25s)
  const SUBTITLES = [
    { t0: 2.0,   t1: 15.5,  text: '♪ 《朋友的酒》 · 深海鲸鱼娘与伙伴们篇 ♪', hi: '朋友的酒' },
    { t0: 16.0,  t1: 20.0,  text: '昨日一去不复回 开心比什么都贵',         hi: '开心' },
    { t0: 20.1,  t1: 24.0,  text: '覆水不能再收回 桃花谢了又开',           hi: '又开' },
    { t0: 24.1,  t1: 28.0,  text: '人生几何能够得到知己 失去生命的力量也不可惜', hi: '知己' },
    { t0: 28.1,  t1: 32.0,  text: '来吧朋友干了这杯酒 伤心的事全都丢脑后', hi: '干了这杯酒' },
    { t0: 32.2,  t1: 37.5,  text: '快把酒满上干了这杯大声歌唱',             hi: '大声歌唱' },
    { t0: 37.6,  t1: 43.0,  text: '好朋友好朋友今宵多欢畅',                 hi: '今宵多欢畅' },
    { t0: 43.1,  t1: 48.5,  text: '理想改变了我们的模样',                   hi: '理想' },
    { t0: 48.6,  t1: 54.0,  text: '也让我懂得了要珍惜朋友的肩膀',           hi: '朋友的肩膀' },
    { t0: 54.1,  t1: 60.0,  text: '阳光总会在风雨之后撒向苍茫',             hi: '阳光' },
    { t0: 60.1,  t1: 66.5,  text: '让我们抬起头学会了坚强',                 hi: '学会了坚强' },
    { t0: 66.6,  t1: 72.5,  text: '就像朋友的这杯烈酒烫我心上',             hi: '烫我心上' },
    { t0: 72.6,  t1: 79.5,  text: '温暖我凡事别再放心上',                   hi: '别再放心上' },
    { t0: 80.0,  t1: 94.0,  text: '♪ 挚友欢聚 · 鲸歌伴奏间奏 ♪',            hi: '挚友欢聚' },
    { t0: 94.5,  t1: 99.5,  text: '昨日一去不复回 开心比什么都贵',         hi: '开心' },
    { t0: 99.6,  t1: 104.5, text: '覆水不能再收回 桃花谢了又开',           hi: '桃花' },
    { t0: 104.6, t1: 109.5, text: '人生几何能够得到知己 真心换真情永不分离', hi: '知己' },
    { t0: 109.6, t1: 115.0, text: '来吧朋友干了这杯酒 四海之内皆是好朋友', hi: '好朋友' },
    { t0: 115.2, t1: 121.0, text: '快把酒满上干了这杯大声歌唱',             hi: '大声歌唱' },
    { t0: 121.1, t1: 127.0, text: '好朋友好朋友今宵多欢畅',                 hi: '今宵多欢畅' },
    { t0: 127.1, t1: 133.0, text: '理想改变了我们的模样',                   hi: '理想' },
    { t0: 133.1, t1: 139.0, text: '也让我懂得了要珍惜朋友的肩膀',           hi: '朋友的肩膀' },
    { t0: 139.1, t1: 145.0, text: '阳光总会在风雨之后撒向苍茫',             hi: '风雨之后' },
    { t0: 145.1, t1: 151.0, text: '让我们抬起头学会了坚强',                 hi: '坚强' },
    { t0: 151.1, t1: 157.5, text: '就像朋友的这杯烈酒烫我心上',             hi: '烈酒' },
    { t0: 157.6, t1: 164.0, text: '温暖我凡事别再放心上',                   hi: '温暖' },
    { t0: 164.2, t1: 173.0, text: '快把酒满上干了这杯大声歌唱 今宵多欢畅', hi: '今宵多欢畅' },
    { t0: 173.1, t1: 181.5, text: '朋友的这杯烈酒烫我心上 温暖我凡事别再放心上', hi: '朋友' },
    { t0: 181.6, t1: 188.0, text: '敬永远的知己 · 干杯！',                  hi: '干杯' }
  ];

  function drawWhaleRiso(ctx, x, y, opts = {}) {
    const t = opts.t || 0;
    const emo = opts.feel || 'happy';
    const u = (opts.scale || 2.35) * 11.5;
    const baseOps = Object.assign({}, feel(emo, t), opts, {
      view: opts.view || 'front',
      style: 'risograph',
      constructMode: 'pixelRig',
      t
    });
    whaleGirl(ctx, x, y, u, baseOps);
  }

  // Sparkling golden cheers mug prop
  function drawCheersMug(ctx, x, y, scale, tilt = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    ctx.scale(scale, scale);

    // Handle
    ctx.strokeStyle = '#FEF08A';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(24, 4, 14, -Math.PI / 2, Math.PI / 2, false);
    ctx.stroke();

    // Glass body with amber drink
    ctx.fillStyle = '#F59E0B';
    ctx.strokeStyle = '#1E1B4B';
    ctx.lineWidth = 4;
    ctx.fillRect(-22, -20, 44, 52);
    ctx.strokeRect(-22, -20, 44, 52);

    // Fluffy white foam head
    ctx.fillStyle = '#FFFBEB';
    ctx.beginPath();
    ctx.arc(-12, -22, 12, 0, Math.PI * 2);
    ctx.arc(0, -25, 14, 0, Math.PI * 2);
    ctx.arc(12, -22, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Risograph halftone dot texture & misregistration border
  function drawRisographFinish(ctx, t, energy) {
    ctx.save();
    // Halftone dot accents in top corners
    ctx.fillStyle = 'rgba(244, 63, 94, 0.22)';
    for (let y = 24; y < 140; y += 16) {
      for (let x = 24; x < 180; x += 16) {
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Offset duotone print registration frame
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.55)';
    ctx.lineWidth = 4;
    ctx.strokeRect(14, 14, 1252, 692);
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.55)';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, 1252, 692);

    // Top-right badge
    ctx.fillStyle = 'rgba(24, 16, 40, 0.82)';
    ctx.fillRect(960, 22, 292, 36);
    ctx.strokeStyle = '#FB7185';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(960, 22, 292, 36);
    ctx.font = 'bold 16px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
    ctx.fillStyle = '#FDE047';
    ctx.textAlign = 'right';
    ctx.fillText('《朋友的酒》 · 孔版印刷鲸鱼娘篇', 1240, 45);
    ctx.restore();
  }

  function drawSubtitle(ctx, t) {
    let active = null;
    for (let i = 0; i < SUBTITLES.length; i++) {
      if (t >= SUBTITLES[i].t0 && t < SUBTITLES[i].t1) {
        active = SUBTITLES[i];
        break;
      }
    }
    if (!active) return;

    const prog = Math.min(1, (t - active.t0) / Math.max(0.25, (active.t1 - active.t0) * 0.4));
    const shown = active.text.slice(0, Math.max(1, Math.ceil(active.text.length * prog)));
    const hasHi = active.hi && shown.includes(active.hi);

    ctx.save();
    ctx.fillStyle = 'rgba(24, 16, 40, 0.78)';
    ctx.strokeStyle = hasHi ? '#FACC15' : '#FB7185';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(250, 618, 780, 56, 14);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 28px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#181028';
    ctx.strokeText(shown, 640, 646);
    ctx.fillStyle = hasHi ? '#FACC15' : '#FFF1F2';
    ctx.fillText(shown, 640, 646);
    ctx.restore();
  }

  // Izakaya / Seaside Lantern Tavern background
  function drawLanternTavern(ctx, t, energy) {
    const bg = ctx.createLinearGradient(0, 0, 0, 720);
    bg.addColorStop(0, '#1E1136');
    bg.addColorStop(0.65, '#3B1C54');
    bg.addColorStop(1, '#581C87');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1280, 720);

    // String of festive glowing lanterns across top
    ctx.strokeStyle = '#FDE047';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 85);
    ctx.quadraticCurveTo(640, 155, 1280, 85);
    ctx.stroke();

    for (let i = 0; i < 9; i++) {
      const lx = 110 + i * 132;
      const ly = 95 + Math.sin((i / 8) * Math.PI) * 35 + Math.sin(t * 4 + i) * 4;
      ctx.fillStyle = i % 2 === 0 ? '#F43F5E' : '#F59E0B';
      ctx.strokeStyle = '#FEF08A';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(lx, ly + 22, 22, 28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Wooden banquet table at bottom
    ctx.fillStyle = '#78350F';
    ctx.fillRect(80, 490, 1120, 230);
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 4;
    ctx.strokeRect(80, 490, 1120, 230);
  }

  function renderPengyouDeJiuFrame(ctx, t) {
    const env = (typeof window !== 'undefined' && window.AUDIO_DATA) ? window.AUDIO_DATA : null;
    const fIdx = Math.min(env ? env.energy.length - 1 : 0, Math.max(0, Math.floor(t * 30)));
    const energy = env ? (env.energy[fIdx] || 0.6) : 0.6;
    const beatBounce = Math.abs(Math.sin(t * 7.2)) * 16 * energy;
    const pulse = 1 + 0.05 * energy;

    ctx.save();

    // Map the 188.25s song into 6 rich visual chapters that cycle through verse, chorus, bridge, solo, and grand finale
    const cycleT = t % 94.0;

    if (t < 16.0 || (t >= 80.0 && t < 94.0)) {
      // INTRO / INTERLUDE: Seaside Starlight Stage & Peach Blossoms
      drawLanternTavern(ctx, t, energy);
      // Floating peach blossom petals
      for (let i = 0; i < 28; i++) {
        const px = ((i * 97 + t * 65) % 1280);
        const py = ((i * 53 + t * 42) % 480);
        ctx.fillStyle = '#FDA4AF';
        ctx.beginPath();
        ctx.ellipse(px, py, 7, 4, t + i, 0, Math.PI * 2);
        ctx.fill();
      }
      CAST.miniWhale(ctx, 290, 360 - beatBounce, 22, { t, flip: false });
      CAST.bionicPuppy(ctx, 980, 470 - beatBounce * 0.6, 20, { t, flip: true });
      drawWhaleRiso(ctx, 640, 540, {
        view: 'front',
        feel: 'singing',
        scale: 2.45 * pulse,
        jump: beatBounce,
        hat: 'Party Cone',
        t
      });
      drawCheersMug(ctx, 510, 455, 0.9, -0.15);
      drawCheersMug(ctx, 770, 455, 0.9, 0.15);

    } else if (cycleT >= 16.0 && cycleT < 32.2) {
      // VERSE ("昨日一去不复回 开心比什么都贵 / 覆水不能再收回 桃花谢了又开 / 来吧朋友干了这杯酒")
      const sky = ctx.createLinearGradient(0, 0, 0, 720);
      sky.addColorStop(0, '#2E1065');
      sky.addColorStop(1, '#831843');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, 1280, 720);

      // Peach tree in full bloom on left
      ctx.fillStyle = '#451A03';
      ctx.fillRect(180, 260, 34, 300);
      ctx.fillStyle = '#FB7185';
      ctx.beginPath();
      ctx.arc(195, 220, 110, 0, Math.PI * 2);
      ctx.arc(275, 250, 85, 0, Math.PI * 2);
      ctx.fill();

      // Terrace floor
      ctx.fillStyle = '#1E1B4B';
      ctx.fillRect(0, 550, 1280, 170);

      // WhaleGirl & friends toasting under the peach blossoms
      CAST.researcher(ctx, 410, 545, 24, { t, flip: false });
      drawWhaleRiso(ctx, 640, 555, {
        view: 'front',
        feel: 'happy',
        scale: 2.4 * pulse,
        jump: beatBounce * 0.7,
        hat: 'Flower Crown',
        t
      });
      CAST.ladyClaude(ctx, 870, 545, 24, { t, flip: true });

      const clink = Math.sin(t * 6) * 14;
      drawCheersMug(ctx, 560 + clink, 430, 0.95, 0.2);
      drawCheersMug(ctx, 720 - clink, 430, 0.95, -0.2);

    } else if (cycleT >= 32.2 && cycleT < 54.0) {
      // CHORUS A ("快把酒满上干了这杯大声歌唱 / 好朋友好朋友今宵多欢畅 / 理想改变了我们的模样 / 珍惜朋友的肩膀")
      drawLanternTavern(ctx, t, energy);

      // Radiant starburst behind the banquet table
      ctx.save();
      ctx.translate(640, 320);
      for (let i = 0; i < 16; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI) / 8 + t * 0.35);
        ctx.fillStyle = i % 2 === 0 ? 'rgba(250, 204, 21, 0.14)' : 'rgba(244, 63, 94, 0.14)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-45, -700);
        ctx.lineTo(45, -700);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();

      // Full cast gathered around the banquet table
      CAST.clawd(ctx, 250, 480 - beatBounce * 0.5, 22, { t });
      CAST.bionicPuppy(ctx, 430, 485 - beatBounce * 0.7, 20, { t });
      drawWhaleRiso(ctx, 640, 535, {
        view: 'front',
        feel: 'ecstatic',
        scale: 2.5 * pulse,
        jump: beatBounce,
        hat: 'Crown',
        t
      });
      CAST.agentReachBot(ctx, 855, 480 - beatBounce * 0.7, 21, { t, flip: true });
      CAST.miniWhale(ctx, 1030, 430 - beatBounce * 0.5, 22, { t, flip: true });

      // Clinking mugs in center with golden foam sparks
      const clink = Math.abs(Math.sin(t * 7)) * 18;
      drawCheersMug(ctx, 565 + clink, 415, 1.05, 0.22);
      drawCheersMug(ctx, 715 - clink, 415, 1.05, -0.22);

    } else if (cycleT >= 54.0 && cycleT < 66.6) {
      // BRIDGE ("阳光总会在风雨之后撒向苍茫 / 让我们抬起头学会了坚强")
      const sky = ctx.createLinearGradient(0, 0, 0, 720);
      sky.addColorStop(0, '#0F172A');
      sky.addColorStop(0.55, '#BE185D');
      sky.addColorStop(1, '#F59E0B');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, 1280, 720);

      // Giant golden sun rising over rainbow arc after the storm
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.55)';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.arc(640, 560, 420, Math.PI, 0, false);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.55)';
      ctx.beginPath();
      ctx.arc(640, 560, 398, Math.PI, 0, false);
      ctx.stroke();

      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(640, 350, 95 + energy * 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1E1B4B';
      ctx.fillRect(0, 555, 1280, 165);

      drawWhaleRiso(ctx, 550, 560, {
        view: 'q',
        feel: 'heroic',
        scale: 2.45 * pulse,
        hat: 'Sailor Cap',
        t
      });
      drawWhaleRiso(ctx, 740, 560, {
        view: 'q',
        flip: true,
        feel: 'confident',
        scale: 2.35 * pulse,
        hat: 'Star Hairpin',
        t: t + 0.5
      });

    } else {
      // CHORUS B & GRAND FINALE ("就像朋友的这杯烈酒烫我心上 / 温暖我凡事别再放心上 / 敬永远的知己 · 干杯！")
      drawLanternTavern(ctx, t, energy);

      // Celebratory fireworks bursting in the night sky
      for (let fw = 0; fw < 4; fw++) {
        const cx = 240 + fw * 265;
        const cy = 190 + (fw % 2) * 45;
        const r = 20 + ((t * 55 + fw * 30) % 75);
        ctx.fillStyle = fw % 2 === 0 ? '#FACC15' : '#FB7185';
        for (let p = 0; p < 12; p++) {
          const a = (p / 12) * Math.PI * 2 + t;
          ctx.beginPath();
          ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      CAST.researcher(ctx, 260, 535, 23, { t });
      CAST.ladyClaude(ctx, 435, 535, 23, { t });
      drawWhaleRiso(ctx, 640, 545, {
        view: 'front',
        feel: 'love',
        scale: 2.55 * pulse,
        jump: beatBounce,
        hat: 'Crown',
        t
      });
      CAST.clawd(ctx, 845, 485 - beatBounce * 0.6, 22, { t, flip: true });
      CAST.bionicPuppy(ctx, 1020, 490 - beatBounce * 0.6, 21, { t, flip: true });

      drawCheersMug(ctx, 560, 415, 1.1, 0.25);
      drawCheersMug(ctx, 720, 415, 1.1, -0.25);
    }

    drawRisographFinish(ctx, t, energy);
    drawSubtitle(ctx, t);
    ctx.restore();
  }

  const api = {
    DURATION,
    SUBTITLES,
    renderPengyouDeJiuFrame
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.MV_PENGYOU_DE_JIU = api;
})(typeof window !== 'undefined' ? window : globalThis);
