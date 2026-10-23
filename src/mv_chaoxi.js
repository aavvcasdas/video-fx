// src/mv_chaoxi.js — Director & Scene Engine for 《潮汐 (Natural)》(深海鲸鱼娘 · 荧光深海篇)
// Replicates `潮汐.MP3` (31.84s, 30fps, 1280x720) with `whale_girl` (`src/whale_girl.js`)
// as protagonist, synced to `assets/chaoxi.mp3` & `assets/chaoxi_audio.js` in `neon` style.

(function (root) {
  'use strict';

  const CORE = (typeof window !== 'undefined' && window.CORE) ? window.CORE : require('./core.js');
  const WHALE = (typeof window !== 'undefined' && window.WHALE_GIRL) ? window.WHALE_GIRL : require('./whale_girl.js');
  const CAST = (typeof window !== 'undefined' && window.CAST) ? window.CAST : require('./cast.js');
  const { whaleGirl, feel } = WHALE;

  const DURATION = 31.84;

  // Beat-synced lyric timeline for 潮汐.MP3 (31.84s chorus)
  const SUBTITLES = [
    { t0: 0.2,  t1: 3.8,  text: '枯树还没发芽 就被逼着开花',     hi: '开花' },
    { t0: 3.9,  t1: 7.8,  text: '妈妈说要快乐 却没告诉我方法',   hi: '方法' },
    { t0: 7.9,  t1: 11.8, text: '成长它教会我 咽下多少风沙',     hi: '风沙' },
    { t0: 11.9, t1: 15.8, text: '从黑夜到黎明 不管有多难耐',     hi: '黎明' },
    { t0: 15.9, t1: 19.8, text: '失落陪着眼泪 汇成了这片海',     hi: '这片海' },
    { t0: 19.9, t1: 23.8, text: '潮汐随月光澎湃 冲破深海的阴霾', hi: '潮汐' },
    { t0: 23.9, t1: 27.8, text: '跃向星河的舞台 鲸歌在夜空盛开', hi: '盛开' },
    { t0: 27.9, t1: 31.7, text: '潮落之后再重来 迎接破晓的蔚蓝', hi: '蔚蓝' }
  ];

  function drawWhaleNeon(ctx, x, y, opts = {}) {
    const t = opts.t || 0;
    const emo = opts.feel || 'singing';
    const u = (opts.scale || 2.4) * 11.5;
    const baseOps = Object.assign({}, feel(emo, t), opts, {
      view: opts.view || 'front',
      style: 'neon',
      constructMode: 'pixelRig',
      t
    });
    whaleGirl(ctx, x, y, u, baseOps);
  }

  // Bioluminescent jellyfish helper
  function drawBioJelly(ctx, x, y, r, col, t, phase) {
    ctx.save();
    const bob = Math.sin(t * 2.5 + phase) * 10;
    ctx.translate(x, y + bob);
    ctx.strokeStyle = col;
    ctx.lineWidth = 2.5;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * (r * 0.3), r * 0.2);
      ctx.quadraticCurveTo(
        i * (r * 0.35) + Math.sin(t * 4 + i + phase) * 8,
        r * 0.9,
        i * (r * 0.25) - Math.sin(t * 4 + i + phase) * 6,
        r * 1.5
      );
      ctx.stroke();
    }
    ctx.fillStyle = col;
    ctx.globalAlpha = 0.72;
    ctx.beginPath();
    ctx.arc(0, 0, r, Math.PI, 0, false);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Neon HUD & Audio Spectrum Bars
  function drawNeonFinish(ctx, t, energy) {
    ctx.save();
    // Top & bottom neon audio spectrum bars
    ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
    for (let i = 0; i < 64; i++) {
      const h = 4 + Math.abs(Math.sin(t * 8 + i * 0.45)) * 24 * energy;
      ctx.fillRect(20 + i * 19.5, 706 - h, 12, h);
    }
    // Neon border frame
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.45)';
    ctx.lineWidth = 4;
    ctx.strokeRect(12, 12, 1256, 696);

    // Top-right badge
    ctx.fillStyle = 'rgba(9, 13, 28, 0.78)';
    ctx.fillRect(970, 22, 282, 36);
    ctx.strokeStyle = '#22D3EE';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(970, 22, 282, 36);
    ctx.font = 'bold 16px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
    ctx.fillStyle = '#22D3EE';
    ctx.textAlign = 'right';
    ctx.fillText('《潮汐》 · 赛博荧光深海鲸鱼娘篇', 1240, 45);
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

    const prog = Math.min(1, (t - active.t0) / Math.max(0.25, (active.t1 - active.t0) * 0.45));
    const shown = active.text.slice(0, Math.max(1, Math.ceil(active.text.length * prog)));
    const hasHi = active.hi && shown.includes(active.hi);

    ctx.save();
    ctx.fillStyle = 'rgba(8, 12, 28, 0.76)';
    ctx.strokeStyle = hasHi ? '#F472B6' : '#22D3EE';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(320, 618, 640, 56, 14);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 30px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#090D1C';
    ctx.strokeText(shown, 640, 646);
    ctx.fillStyle = hasHi ? '#F472B6' : '#E0F2FE';
    ctx.fillText(shown, 640, 646);
    ctx.restore();
  }

  function renderChaoxiFrame(ctx, t) {
    const env = (typeof window !== 'undefined' && window.AUDIO_DATA) ? window.AUDIO_DATA : null;
    const fIdx = Math.min(env ? env.energy.length - 1 : 0, Math.max(0, Math.floor(t * 30)));
    const energy = env ? (env.energy[fIdx] || 0.8) : 0.8;
    const pulse = 1 + 0.05 * energy * Math.sin(t * 14);

    ctx.save();

    if (t < 7.9) {
      // ACT 1 (0.0–7.9s): Abyssal Withered Coral Reef & Blooming Neon Sea Anemones
      // ("枯树还没发芽 就被逼着开花 / 妈妈说要快乐 却没告诉我方法")
      const bg = ctx.createLinearGradient(0, 0, 0, 720);
      bg.addColorStop(0, '#050816');
      bg.addColorStop(1, '#0F172A');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 1280, 720);

      // Glowing cybernetic sea tree branches on left & right
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 5;
      for (const bx of [210, 1070]) {
        const dir = bx < 640 ? 1 : -1;
        ctx.beginPath();
        ctx.moveTo(bx, 620);
        ctx.quadraticCurveTo(bx + dir * 40, 420, bx + dir * 110, 240);
        ctx.moveTo(bx + dir * 45, 450);
        ctx.lineTo(bx + dir * 165, 340);
        ctx.moveTo(bx + dir * 25, 350);
        ctx.lineTo(bx - dir * 55, 250);
        ctx.stroke();

        // Neon blossoms opening along the branches
        const bloomR = Math.min(20, 4 + t * 2.5);
        for (const pt of [
          [bx + dir * 110, 240],
          [bx + dir * 165, 340],
          [bx - dir * 55, 250]
        ]) {
          ctx.fillStyle = '#F472B6';
          ctx.beginPath();
          ctx.arc(pt[0], pt[1], bloomR, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FEF08A';
          ctx.beginPath();
          ctx.arc(pt[0], pt[1], bloomR * 0.42, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Abyssal seabed
      ctx.fillStyle = '#090D1C';
      ctx.fillRect(0, 560, 1280, 160);
      ctx.strokeStyle = '#22D3EE';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 560);
      ctx.lineTo(1280, 560);
      ctx.stroke();

      drawBioJelly(ctx, 370, 210, 28, '#22D3EE', t, 0.5);
      drawBioJelly(ctx, 910, 185, 32, '#E879F9', t, 2.1);

      drawWhaleNeon(ctx, 640, 555, {
        view: t < 3.9 ? 'front' : 'q',
        feel: t < 3.9 ? 'wistful' : 'sad',
        scale: 2.45 * pulse,
        hat: 'Glow Jellyfish',
        t
      });

    } else if (t < 15.9) {
      // ACT 2 (7.9–15.9s): Swimming Upward Through Deep-Sea Currents & Glowing Tear Pearls
      // ("成长它教会我 咽下多少风沙 / 从黑夜到黎明 不管有多难耐")
      const bg = ctx.createLinearGradient(0, 0, 0, 720);
      bg.addColorStop(0, '#090D26');
      bg.addColorStop(0.6, '#1E1B4B');
      bg.addColorStop(1, '#0F172A');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 1280, 720);

      // Golden dawn horizon beam breaking through top of ocean at t >= 11.9s
      if (t >= 11.9) {
        const beamAlpha = Math.min(0.45, (t - 11.9) * 0.12);
        const beam = ctx.createLinearGradient(640, 0, 640, 520);
        beam.addColorStop(0, `rgba(250, 204, 21, ${beamAlpha})`);
        beam.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = beam;
        ctx.beginPath();
        ctx.moveTo(380, 0);
        ctx.lineTo(900, 0);
        ctx.lineTo(1160, 620);
        ctx.lineTo(120, 620);
        ctx.closePath();
        ctx.fill();
      }

      // Swirling neon current ribbons
      for (let w = 0; w < 5; w++) {
        ctx.strokeStyle = w % 2 === 0 ? 'rgba(34, 211, 238, 0.45)' : 'rgba(244, 114, 182, 0.4)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        for (let x = 0; x <= 1280; x += 32) {
          const y = 140 + w * 105 + Math.sin(x * 0.01 + t * 4 + w) * 32;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      CAST.miniWhale(ctx, 320, 340 + Math.sin(t * 3) * 18, 22, { t, flip: false });
      CAST.miniWhale(ctx, 960, 290 + Math.cos(t * 3) * 18, 22, { t, flip: true });

      drawWhaleNeon(ctx, 640, 535, {
        view: 'q',
        feel: t < 11.9 ? 'determined' : 'heroic',
        scale: 2.5 * pulse,
        jump: Math.abs(Math.sin(t * 4)) * 22,
        hat: 'Sailor Cap',
        t
      });

    } else if (t < 23.9) {
      // ACT 3 (15.9–23.9s): Giant Full Moon & Surging Bioluminescent Tidal Waves
      // ("失落陪着眼泪 汇成了这片海 / 潮汐随月光澎湃 冲破深海的阴霾")
      const sky = ctx.createLinearGradient(0, 0, 0, 480);
      sky.addColorStop(0, '#090D1C');
      sky.addColorStop(1, '#1E1B4B');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, 1280, 480);

      // Giant glowing neon full moon
      const moonR = 115 + energy * 14;
      const halo = ctx.createRadialGradient(640, 210, 40, 640, 210, moonR * 1.9);
      halo.addColorStop(0, 'rgba(254, 249, 195, 0.95)');
      halo.addColorStop(0.5, 'rgba(56, 189, 248, 0.42)');
      halo.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(640, 210, moonR * 1.9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FEF9C3';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(640, 210, moonR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Layered bioluminescent tidal waves
      for (let layer = 0; layer < 3; layer++) {
        const baseY = 435 + layer * 62;
        ctx.fillStyle = layer === 0 ? '#0284C7' : (layer === 1 ? '#0369A1' : '#0C4A6E');
        ctx.strokeStyle = layer === 0 ? '#67E8F9' : '#38BDF8';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 720);
        for (let x = 0; x <= 1280; x += 24) {
          const wy = baseY + Math.sin(x * 0.015 - t * (4 + layer) + layer) * (24 + energy * 12);
          ctx.lineTo(x, wy);
        }
        ctx.lineTo(1280, 720);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      drawWhaleNeon(ctx, 640, 545, {
        view: 'front',
        feel: 'singing',
        scale: 2.55 * pulse,
        hat: 'Crown',
        t
      });

    } else {
      // ACT 4 (23.9–31.84s): Starlight Galaxy Concert & Dawn Blue Horizon
      // ("跃向星河的舞台 鲸歌在夜空盛开 / 潮落之后再重来 迎接破晓的蔚蓝")
      const dawn = t >= 27.9 ? Math.min(1, (t - 27.9) / 3.5) : 0;
      const sky = ctx.createLinearGradient(0, 0, 0, 720);
      sky.addColorStop(0, dawn > 0.5 ? '#0284C7' : '#0F172A');
      sky.addColorStop(0.55, dawn > 0.5 ? '#38BDF8' : '#311042');
      sky.addColorStop(1, '#0369A1');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, 1280, 720);

      // Starlight galaxy ring & musical notes
      for (let i = 0; i < 36; i++) {
        const ang = (i / 36) * Math.PI * 2 + t * 0.6;
        const rx = 640 + Math.cos(ang) * 440;
        const ry = 290 + Math.sin(ang) * 145;
        ctx.fillStyle = i % 2 === 0 ? '#FEF08A' : '#67E8F9';
        ctx.beginPath();
        ctx.arc(rx, ry, 4 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }

      drawBioJelly(ctx, 240, 230, 30, '#67E8F9', t, 0.2);
      drawBioJelly(ctx, 1040, 230, 30, '#F472B6', t, 1.7);
      CAST.miniWhale(ctx, 390, 380 + Math.sin(t * 4) * 16, 22, { t, flip: false });
      CAST.miniWhale(ctx, 890, 380 + Math.cos(t * 4) * 16, 22, { t, flip: true });

      drawWhaleNeon(ctx, 640, 550, {
        view: 'front',
        feel: 'ecstatic',
        scale: 2.6 * pulse,
        jump: Math.abs(Math.sin(t * 5)) * 18,
        hat: 'Star Hairpin',
        t
      });
    }

    drawNeonFinish(ctx, t, energy);
    drawSubtitle(ctx, t);
    ctx.restore();
  }

  const api = {
    DURATION,
    SUBTITLES,
    renderChaoxiFrame
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.MV_CHAOXI = api;
})(typeof window !== 'undefined' ? window : globalThis);
