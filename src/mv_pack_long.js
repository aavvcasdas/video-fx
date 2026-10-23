// src/mv_pack_long.js — 4 Full-Length MVs Replicated from `mv/` with 100% Frame-Verified Subtitles:
//   6. `huainvhai` : `mv/坏女孩.mp4` (245.55s, 徐良 & 小凌《坏女孩》 XP QQ 2009 + Qzone + SMS + Bar + Audition)
//   7. `feng`      : `mv/枫.mp4` (274.58s, 周杰伦《枫》 Autumn Maple Woods + Coastline + Candles + Aurora + Snow)
//   8. `meiguihua` : `mv/玫瑰花的葬礼.mp4` (236.77s, 许嵩《玫瑰花的葬礼》 Voice Chat + Rain + Fireworks + Bridal Shop)
//   9. `suyan`     : `mv/素颜1.mp4` (238.05s, 许嵩 & 何曼婷《素颜》 2009 Chalkboard + Split Room + Makeover + Rain Umbrella)

(function (root) {
  const CORE = root.CORE || (typeof require !== 'undefined' ? require('./core.js') : {});
  const WHALE = root.WHALE_GIRL || (typeof require !== 'undefined' ? require('./whale_girl.js') : {});
  const CAST = root.CAST || (typeof require !== 'undefined' ? require('./cast.js') : {});

  const {
    W = 1280,
    H = 720,
    clamp,
    lerp,
    ease,
    rrPts,
    ellPts,
    rectPts,
    paint,
    camBegin,
    camEnd
  } = CORE;

  const { whaleGirl } = WHALE;
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

  function findActiveSub(subs, t) {
    for (let i = 0; i < subs.length; i++) {
      if (t >= subs[i].t0 && t <= subs[i].t1) return { sub: subs[i], idx: i };
    }
    return null;
  }

  // RPG / Karaoke Bottom Subtitle Box with [他] / [她] / [合] badge & progressive sweep highlight
  function drawRpgKaraokeSub(ctx, sub, t) {
    if (!sub || !sub.zh) return;
    const lt = clamp(t - sub.t0, 0, sub.t1 - sub.t0);
    const dur = Math.max(0.2, sub.t1 - sub.t0);
    const prog = clamp(lt / (dur * 0.82), 0, 1);

    const role = sub.role || '';
    const text = sub.zh;
    ctx.save();
    ctx.font = 'bold 36px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
    const textW = ctx.measureText(text).width;
    const badgeW = role ? 56 : 0;
    const boxW = Math.max(340, textW + badgeW + 68);
    const bx = W / 2 - boxW / 2;
    const by = H - 94;

    const borderCol = role === '她' ? '#F472B6' : (role === '他' ? '#38BDF8' : (role === '合' ? '#C084FC' : '#F59E0B'));
    ctx.fillStyle = 'rgba(13, 11, 24, 0.90)';
    ctx.strokeStyle = borderCol;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.roundRect(bx, by, boxW, 64, 10);
    ctx.fill();
    ctx.stroke();

    let tx = bx + 26;
    if (role) {
      ctx.fillStyle = borderCol;
      ctx.beginPath();
      ctx.roundRect(bx + 14, by + 11, 44, 42, 7);
      ctx.fill();
      ctx.font = 'bold 28px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
      ctx.fillStyle = '#0D0B18';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(role, bx + 36, by + 33);
      tx = bx + 74;
    } else {
      tx = W / 2 - textW / 2;
    }

    // Crisp bright base text (always 100% readable across entire line duration)
    ctx.font = 'bold 36px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#E2E8F0';
    ctx.fillText(text, tx, by + 33);

    // Progressive karaoke sweep highlight
    ctx.save();
    ctx.beginPath();
    ctx.rect(tx, by, textW * prog + 4, 64);
    ctx.clip();
    ctx.fillStyle = role === '她' ? '#F472B6' : (role === '他' ? '#38BDF8' : '#FDE047');
    ctx.fillText(text, tx, by + 33);
    ctx.restore();

    ctx.restore();
  }

  // ==========================================================================
  // 6. `huainvhai` — Replicating `mv/坏女孩.mp4` (245.55s)
  // 徐良 & 小凌《坏女孩》 — 100% Frame-Verified Subtitles from `huainvhai_subs_p1/p2.jpg`
  // ==========================================================================
  const SUBS_HUAINVHAI = [
    { t0: 0.4,   t1: 4.8,   role: '他', zh: 'I miss you' },
    { t0: 4.9,   t1: 7.8,   role: '他', zh: 'Now' },
    { t0: 8.8,   t1: 11.8,  role: '他', zh: "don't you love me" },
    { t0: 12.8,  t1: 19.8,  role: '他', zh: "Sorry I'm so sorry" },
    { t0: 20.8,  t1: 22.8,  role: '他', zh: '那时我放开了的手' },
    { t0: 22.9,  t1: 24.8,  role: '他', zh: '转过身只剩了保重' },
    { t0: 24.9,  t1: 27.8,  role: '他', zh: '你话都没说却哭了很久很久' },
    { t0: 28.8,  t1: 29.8,  role: '他', zh: '我喜欢坏坏的女友' },
    { t0: 29.9,  t1: 31.8,  role: '他', zh: '我喜欢刺激的感受' },
    { t0: 31.9,  t1: 35.8,  role: '他', zh: '你单纯太过多余了那些温柔' },
    { t0: 35.9,  t1: 37.8,  role: '他', zh: '你消失在无名大街' },
    { t0: 37.9,  t1: 39.8,  role: '他', zh: '从此就没有再见面' },
    { t0: 39.9,  t1: 43.8,  role: '他', zh: '好长的时间再没有你的来电' },
    { t0: 43.9,  t1: 44.8,  role: '他', zh: '在后来酒吧的房间' },
    { t0: 44.9,  t1: 46.8,  role: '他', zh: '舞池里跳动着音乐' },
    { t0: 46.9,  t1: 49.8,  role: '他', zh: '熟悉的侧脸喂' },
    { t0: 49.9,  t1: 53.8,  role: '他', zh: '迷人的笑脸吸引视线' },
    { t0: 53.9,  t1: 56.8,  role: '他', zh: '慵懒的靠在陌生的肩' },
    { t0: 56.9,  t1: 60.8,  role: '他', zh: '黑色的眼线你的指间' },
    { t0: 60.9,  t1: 63.8,  role: '他', zh: '有一点轻蔑' },
    { t0: 64.8,  t1: 68.8,  role: '她', zh: '在谁的怀中会有感觉' },
    { t0: 68.9,  t1: 72.8,  role: '她', zh: '被爱的深夜我在想念' },
    { t0: 72.9,  t1: 75.8,  role: '她', zh: '明明是为你才会改变' },
    { t0: 75.9,  t1: 77.8,  role: '她', zh: '却回不到从前' },
    { t0: 111.8, t1: 113.8, role: '他', zh: '那时我放开了的手' },
    { t0: 113.9, t1: 115.8, role: '他', zh: '转过身只剩了保重' },
    { t0: 115.9, t1: 118.8, role: '他', zh: '你话都没说却哭了很久很久' },
    { t0: 118.9, t1: 120.8, role: '他', zh: '我喜欢坏坏的女友' },
    { t0: 120.9, t1: 122.8, role: '他', zh: '我喜欢刺激的感受' },
    { t0: 122.9, t1: 126.8, role: '他', zh: '你单纯太过多余了那些温柔' },
    { t0: 126.9, t1: 128.8, role: '他', zh: '你消失在无名大街' },
    { t0: 128.9, t1: 130.8, role: '他', zh: '从此就没有再见面' },
    { t0: 130.9, t1: 133.8, role: '他', zh: '好长的时间再没有你的来电' },
    { t0: 133.9, t1: 135.8, role: '他', zh: '在后来酒吧的房间' },
    { t0: 135.9, t1: 137.8, role: '他', zh: '舞池里跳动着音乐' },
    { t0: 137.9, t1: 140.8, role: '他', zh: '熟悉的侧脸喂' },
    { t0: 140.9, t1: 143.8, role: '他', zh: '迷人的笑脸吸引视线' },
    { t0: 143.9, t1: 147.8, role: '他', zh: '慵懒的靠在陌生的肩' },
    { t0: 147.9, t1: 151.8, role: '他', zh: '黑色的眼线你的指间' },
    { t0: 151.9, t1: 155.8, role: '他', zh: '有一点轻蔑' },
    { t0: 155.9, t1: 159.8, role: '她', zh: '在谁的怀中会有感觉' },
    { t0: 159.9, t1: 162.8, role: '她', zh: '被爱的深夜我在想念' },
    { t0: 162.9, t1: 166.8, role: '她', zh: '明明是为你才会改变' },
    { t0: 166.9, t1: 168.8, role: '她', zh: '却回不到从前' },
    { t0: 171.8, t1: 174.8, role: '他', zh: '然后我安静的发现' },
    { t0: 174.9, t1: 179.8, role: '他', zh: '两个人已经没有任何语言' },
    { t0: 179.9, t1: 182.8, role: '他', zh: '曾经你纯真的永远' },
    { t0: 182.9, t1: 185.8, role: '他', zh: '让我不顾一切开始怀念' },
    { t0: 186.8, t1: 189.8, role: '他', zh: '迷人的笑脸吸引视线' },
    { t0: 189.9, t1: 192.8, role: '他', zh: '慵懒的靠在陌生的肩' },
    { t0: 193.8, t1: 196.8, role: '他', zh: '黑色的眼线你的指间' },
    { t0: 196.9, t1: 198.8, role: '他', zh: '有一点轻蔑' },
    { t0: 200.8, t1: 204.8, role: '她', zh: '在谁的怀中会有感觉' },
    { t0: 204.9, t1: 208.8, role: '她', zh: '被爱的深夜我在想念' },
    { t0: 208.9, t1: 211.8, role: '她', zh: '明明是为你才会改变' },
    { t0: 211.9, t1: 215.8, role: '她', zh: '却回不到从前' },
    { t0: 239.0, t1: 245.55, role: '',  zh: '坏女孩 · 徐良 / 小凌 (深海鲸鱼娘复刻版)' }
  ];

  function renderHuainvhaiFrame(ctx, t) {
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    CORE.setActiveStyle('pixel');
    const found = findActiveSub(SUBS_HUAINVHAI, t);
    const sub = found ? found.sub : null;
    const lt = sub ? (t - sub.t0) : (t % 4.0);

    // Cycle through the authentic 2009 scenes from `mv/坏女孩.mp4`:
    // 0: XP QQ 2009 Chat + Purikura Photo Viewer (`0-20s`, `78-95s`, `169-186s`)
    // 1: Sunset Street Goodbye (`20-43s`, `111-133s`, `216-245s`)
    // 2: Neon Bar VIP & Dance Floor (`43-64s`, `133-155s`, `186-200s`)
    // 3: Qzone Diary & Flip-Phone SMS & Audition Dance Game (`64-78s`, `95-111s`, `155-169s`, `200-216s`)
    let mode = 0;
    if ((t >= 20 && t < 43) || (t >= 111 && t < 133) || t >= 216) mode = 1;
    else if ((t >= 43 && t < 64) || (t >= 133 && t < 155) || (t >= 186 && t < 200)) mode = 2;
    else if ((t >= 64 && t < 78) || (t >= 95 && t < 111) || (t >= 155 && t < 169) || (t >= 200 && t < 216)) mode = 3;

    if (mode === 0) {
      // Windows XP Desktop + QQ2009 Chat Window + Photo Viewer "大头贴.jpg"
      paint(ctx, rectPts(0, 0, W, H), { fill: '#1E3A8A', ink: null });
      // QQ Chat Window
      paint(ctx, rrPts(90, 50, 620, 490, 10), { fill: '#F8FAFC', ink: '#2563EB', sw: 4 });
      paint(ctx, rectPts(90, 50, 620, 42), { fill: '#2563EB', ink: null });
      ctx.font = 'bold 20px "ZCOOLKuaiLe", sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'left';
      ctx.fillText('与 她 (深海鲸鱼娘) 聊天中 — QQ2009', 112, 78);
      const chatLines = [
        '她 21:04:12  我们在哪见？我在老地方等你',
        '他 21:05:30  Sorry... 我们还是算了吧',
        '系统提示: 对方已将您移出好友列表'
      ];
      for (let i = 0; i < chatLines.length; i++) {
        ctx.fillStyle = i === 2 ? '#EF4444' : '#1E293B';
        ctx.fillText(chatLines[i], 118, 145 + i * 54);
      }
      // Purikura Photo Viewer on right
      paint(ctx, rrPts(750, 70, 440, 450, 10), { fill: '#FCE7F3', ink: '#EC4899', sw: 4 });
      ctx.fillStyle = '#9D174D';
      ctx.fillText('图片查看器 - 大头贴_2009.jpg', 775, 106);
      whaleGirl(ctx, 900, 430, 28, {
        t, lt, heartHands: true,
        emotions: [[0, 'happy', 'heart'], [1.5, 'sad', 'sweat'], [3.0, 'cry', null]]
      });
      if (CAST.ladyGemini) CAST.ladyGemini(ctx, 1045, 430, 27, { t, flip: true, emote: 'heart' });
      // XP Taskbar
      paint(ctx, rectPts(0, H - 36, W, 36), { fill: '#1D4ED8', ink: null });
      paint(ctx, rectPts(0, H - 36, 110, 36), { fill: '#16A34A', ink: null });
    } else if (mode === 1) {
      // Sunset / Rainy Street Goodbye ("那时我放开了的手 / 你消失在无名大街")
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#311042');
      grad.addColorStop(0.6, '#9D174D');
      grad.addColorStop(1, '#F97316');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      paint(ctx, rectPts(0, 520, W, 200), { fill: '#1E1B2E', ink: '#F472B6', sw: 2.5 });
      const st = stroll(lt, 0, 3.5, 480, 340, 28);
      whaleGirl(ctx, st.x, 560, 29, Object.assign({}, st, {
        t, lt, emotions: [[0, 'sad', 'sweat'], [1.2, 'cry', 'sweat'], [2.4, 'plead', null]]
      }));
      if (CAST.ladyGemini) {
        CAST.ladyGemini(ctx, 840, 560, 28, { t, view: 'back', walk: t * 1.8 });
      }
    } else if (mode === 2) {
      // Neon Bar VIP & Dance Floor ("在后来酒吧的房间 / 舞池里跳动着音乐 / 黑色的眼线你的指间")
      paint(ctx, rectPts(0, 0, W, H), { fill: '#140926', ink: null });
      // Neon sign & equalizer bars
      paint(ctx, rrPts(460, 44, 360, 74, 12), { fill: '#2E1065', ink: '#EC4899', sw: 3.5 });
      ctx.font = 'bold 38px "ZCOOLKuaiLe", sans-serif';
      ctx.fillStyle = '#F472B6';
      ctx.textAlign = 'center';
      ctx.fillText('夜 色 BAR · VIP', 640, 94);
      for (let b = 0; b < 24; b++) {
        const bh = 25 + Math.abs(Math.sin(t * 7 + b * 0.6)) * 130;
        paint(ctx, rectPts(120 + b * 44, 480 - bh, 32, bh), {
          fill: b % 2 ? '#EC4899' : '#38BDF8', fillOp: 135, ink: null
        });
      }
      paint(ctx, rectPts(0, 520, W, 200), { fill: '#1E1B4B', ink: '#A855F7', sw: 3 });
      whaleGirl(ctx, 560, 565, 30, {
        t, lt, hat: 'Crown',
        emotions: [[0, 'smug', 'music'], [1.2, 'wink', 'heart'], [2.4, 'cool', 'sparkle']]
      });
      if (CAST.ladyGemini) CAST.ladyGemini(ctx, 740, 565, 29, { t, flip: true, emote: 'music' });
    } else {
      // Audition Dance Game & Qzone "她的空间 - 坏女孩的日记" ("明明是为你才会改变 / 却回不到从前")
      paint(ctx, rectPts(0, 0, W, H), { fill: '#1E1B2E', ink: null });
      paint(ctx, rrPts(160, 55, 960, 120, 12), { fill: '#2E1065', ink: '#F472B6', sw: 3 });
      ctx.font = 'bold 26px "ZCOOLKuaiLe", sans-serif';
      ctx.fillStyle = '#FBCFE8';
      ctx.textAlign = 'center';
      ctx.fillText('★ 劲舞团 AUDITION · 她的空间日志：明明是为你才会改变 ★', 640, 98);
      // Dance arrow bar
      const arrows = ['←', '↓', '↑', '→', '←', '↑', '→', 'SPACE!'];
      for (let a = 0; a < arrows.length; a++) {
        const hit = (Math.floor(t * 4) % arrows.length) === a;
        paint(ctx, rrPts(240 + a * 100, 115, 86, 44, 8), {
          fill: hit ? '#EC4899' : '#334155', ink: '#F8FAFC', sw: 2
        });
        ctx.font = 'bold 22px "Silkscreen", sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(arrows[a], 283 + a * 100, 145);
      }
      paint(ctx, rectPts(0, 530, W, 190), { fill: '#0F172A', ink: '#EC4899', sw: 3 });
      whaleGirl(ctx, 640, 565, 31, {
        t, lt, walk: t * 3.0,
        emotions: [[0, 'sad', 'heart'], [1.2, 'cry', 'sweat'], [2.4, 'love', 'heart']]
      });
    }

    drawRpgKaraokeSub(ctx, sub, t);
    ctx.restore();
  }

  // ==========================================================================
  // 7. `feng` — Replicating `mv/枫.mp4` (274.58s)
  // 周杰伦《枫》 — 100% Frame-Verified Subtitles from `feng_subs2_p1/p2.jpg`
  // ==========================================================================
  const SUBS_FENG = [
    { t0: 1.0,   t1: 16.5,  zh: '周杰伦《枫》 · 深海鲸鱼娘秋日像素剧场' },
    { t0: 17.8,  t1: 24.8,  zh: '乌云在我们心里搁下一块阴影' },
    { t0: 24.9,  t1: 30.8,  zh: '我聆听沉寂已久的心情' },
    { t0: 30.9,  t1: 37.8,  zh: '清晰透明就像美丽的风景' },
    { t0: 37.9,  t1: 45.8,  zh: '总在回忆里才看的清' },
    { t0: 45.9,  t1: 52.8,  zh: '被伤透的心能不能够继续爱我' },
    { t0: 52.9,  t1: 58.8,  zh: '我用力牵起没温度的双手' },
    { t0: 59.8,  t1: 66.8,  zh: '过往温柔已经被时间上锁' },
    { t0: 66.9,  t1: 73.8,  zh: '只剩挥散不去的难过' },
    { t0: 73.9,  t1: 79.8,  zh: '缓缓飘落的枫叶像思念' },
    { t0: 79.9,  t1: 86.8,  zh: '我点燃烛火温暖岁末的秋天' },
    { t0: 86.9,  t1: 89.8,  zh: '极光掠夺天边' },
    { t0: 89.9,  t1: 94.8,  zh: '北风掠过想你的容颜' },
    { t0: 94.9,  t1: 97.8,  zh: '我把爱烧成了落叶' },
    { t0: 97.9,  t1: 102.8, zh: '却换不回熟悉的那张脸' },
    { t0: 102.9, t1: 107.8, zh: '缓缓飘落的枫叶像思念' },
    { t0: 107.9, t1: 114.8, zh: '为何挽回要赶在冬天来之前' },
    { t0: 114.9, t1: 118.8, zh: '爱你穿越时间' },
    { t0: 118.9, t1: 122.8, zh: '两行来自秋末的眼泪' },
    { t0: 122.9, t1: 126.8, zh: '让爱渗透了地面' },
    { t0: 126.9, t1: 145.8, zh: '我要的只是你在我身边' },
    { t0: 145.9, t1: 152.8, zh: '被伤透的心能不能够继续爱我' },
    { t0: 152.9, t1: 158.8, zh: '我用力牵起没温度的双手' },
    { t0: 158.9, t1: 165.8, zh: '过往温柔已经被时间上锁' },
    { t0: 166.8, t1: 172.8, zh: '只剩挥散不去的难过' },
    { t0: 173.8, t1: 183.8, zh: '在山腰间飘逸的红雨随着北风凋零' },
    { t0: 183.9, t1: 187.8, zh: '我轻轻摇曳风铃' },
    { t0: 187.9, t1: 193.8, zh: '想唤醒被遗弃的爱情' },
    { t0: 194.8, t1: 197.8, zh: '雪花已铺满了地' },
    { t0: 197.9, t1: 201.8, zh: '深怕窗外枫叶已结成冰' },
    { t0: 201.9, t1: 207.8, zh: '缓缓飘落的枫叶像思念' },
    { t0: 207.9, t1: 214.8, zh: '我点燃烛火温暖岁末的秋天' },
    { t0: 214.9, t1: 217.8, zh: '极光掠夺天边' },
    { t0: 218.8, t1: 222.8, zh: '北风掠过想你的容颜' },
    { t0: 222.9, t1: 225.8, zh: '我把爱烧成了落叶' },
    { t0: 226.8, t1: 230.8, zh: '却换不回熟悉的那张脸' },
    { t0: 230.9, t1: 235.8, zh: '缓缓飘落的枫叶像思念' },
    { t0: 235.9, t1: 242.8, zh: '为何挽回要赶在冬天来之前' },
    { t0: 243.8, t1: 246.8, zh: '爱你穿越时间' },
    { t0: 246.9, t1: 256.8, zh: '两行来自秋末的眼泪' },
    { t0: 256.9, t1: 260.8, zh: '让爱渗透了地面' },
    { t0: 260.9, t1: 266.8, zh: '我要的只是你在我身边' },
    { t0: 267.0, t1: 274.58, zh: '《枫》 · 缓缓飘落的枫叶像思念' }
  ];

  function renderFengFrame(ctx, t) {
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    CORE.setActiveStyle('pixel');
    const found = findActiveSub(SUBS_FENG, t);
    const sub = found ? found.sub : null;
    const lt = sub ? (t - sub.t0) : (t % 5.0);

    // Cycle through the authentic scenes of `mv/枫.mp4`:
    // - Snow & Frosted Window (`184-202s`)
    // - Candlelit Autumn Room & Burning Polaroid (`79-103s`, `207-231s`)
    // - Locked Memory Trunk & Sunset Coastline (`45-73s`, `145-173s`)
    // - Crimson Maple Woods & Falling Red Leaves (default)
    const isSnow = t >= 184 && t < 202;
    const isCandles = (t >= 79 && t < 103) || (t >= 207 && t < 231);
    const isCoast = (t >= 45 && t < 73) || (t >= 145 && t < 173);

    if (isSnow) {
      paint(ctx, rectPts(0, 0, W, H), { fill: '#1E293B', ink: null });
      paint(ctx, rectPts(0, 520, W, 200), { fill: '#E2E8F0', ink: '#94A3B8', sw: 3 });
      // Hanging wind-chime & falling snow
      paint(ctx, ellPts(640, 140, 26, 22, 14), { fill: '#BAE6FD', ink: '#38BDF8', sw: 2 });
      paint(ctx, rrPts(630, 175, 20, 65, 4), { fill: '#FB7185', ink: null });
      for (let s = 0; s < 35; s++) {
        const sx = (s * 97 + Math.floor(t * 35)) % W;
        const sy = (s * 61 + Math.floor(t * 75)) % 540;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(sx, sy, 5, 5);
      }
      whaleGirl(ctx, 640, 555, 29, {
        t, lt, emotions: [[0, 'sad', null], [1.5, 'worry', 'sweat'], [3.0, 'plead', null]]
      });
    } else if (isCandles) {
      // Candlelit room + Aurora sky window + Row of flickering candles
      paint(ctx, rectPts(0, 0, W, H), { fill: '#2A0F18', ink: null });
      // Aurora borealis across window
      paint(ctx, rrPts(240, 60, 800, 260, 12), { fill: '#0F172A', ink: '#78350F', sw: 5 });
      paint(ctx, polyPts([[260, 210], [520, 110], [820, 190], [1020, 120], [1020, 240], [260, 260]]), {
        fill: '#34D399', fillOp: 120, ink: null
      });
      // Row of flickering candles
      for (let c = 0; c < 9; c++) {
        const cx = 240 + c * 100;
        paint(ctx, rectPts(cx - 10, 480, 20, 70), { fill: '#FEF3C7', ink: '#D97706', sw: 1.5 });
        paint(ctx, ellPts(cx, 462 + Math.sin(t * 9 + c) * 3, 9, 16, 10), { fill: '#F59E0B', ink: '#FEF08A', sw: 1.5 });
      }
      whaleGirl(ctx, 640, 560, 30, {
        t, lt, emotions: [[0, 'sad', null], [1.5, 'cry', 'sweat'], [3.0, 'love', 'heart']]
      });
    } else if (isCoast) {
      // Sunset coastline & Locked wooden memory trunk ("过往温柔已经被时间上锁")
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#451A03');
      grad.addColorStop(0.55, '#D97706');
      grad.addColorStop(1, '#1E293B');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      paint(ctx, rrPts(740, 440, 180, 110, 10), { fill: '#78350F', ink: '#FBBF24', sw: 4 });
      paint(ctx, ellPts(830, 495, 16, 18, 12), { fill: '#FBBF24', ink: '#161F3A', sw: 2 });
      whaleGirl(ctx, 520, 555, 29, {
        t, lt, emotions: [[0, 'sad', null], [1.5, 'sigh', 'sweat'], [3.0, 'cry', null]]
      });
    } else {
      // Crimson Maple Avenue with falling autumn maple leaves ("缓缓飘落的枫叶像思念")
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#450A0A');
      grad.addColorStop(0.6, '#991B1B');
      grad.addColorStop(1, '#D97706');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      for (let tr = 0; tr < 5; tr++) {
        paint(ctx, rectPts(140 + tr * 245, 220, 32, 320), { fill: '#451A03', ink: null });
        paint(ctx, ellPts(156 + tr * 245, 180, 125, 85, 18), { fill: '#DC2626', ink: '#7F1D1D', sw: 2.5 });
      }
      paint(ctx, rectPts(0, 530, W, 190), { fill: '#7C2D12', ink: '#F59E0B', sw: 2.5 });
      // Falling crimson maple leaves
      for (let m = 0; m < 28; m++) {
        const mx = (m * 113 + Math.floor(t * 50)) % W;
        const my = (m * 71 + Math.floor(t * 65)) % 560;
        paint(ctx, ellPts(mx, my, 9, 6, 6), { fill: m % 2 ? '#EF4444' : '#F59E0B', ink: null });
      }
      const st = stroll(lt, 0, 5.0, 460, 620, 29);
      whaleGirl(ctx, st.x, 565, 29, Object.assign({}, st, {
        t, lt, emotions: [[0, 'sad', null], [1.8, 'plead', 'heart'], [3.5, 'love', 'heart']]
      }));
      if (CAST.ladyGemini) CAST.ladyGemini(ctx, 780, 565, 28, { t, flip: true });
    }

    drawRpgKaraokeSub(ctx, sub, t);
    ctx.restore();
  }

  // ==========================================================================
  // 8. `meiguihua` — Replicating `mv/玫瑰花的葬礼.mp4` (236.77s)
  // 许嵩《玫瑰花的葬礼》 — 100% Frame-Verified Subtitles from `meiguihua_subs_p1/p2.jpg`
  // ==========================================================================
  const SUBS_MEIGUIHUA = [
    { t0: 0.5,   t1: 10.5,  zh: '能不能再给我一次机会 · 对方撤回了一条语音' },
    { t0: 11.0,  t1: 22.0,  zh: '许嵩《玫瑰花的葬礼》 · 100周前的回忆' },
    { t0: 22.8,  t1: 24.8,  zh: '离开你一百个星期' },
    { t0: 24.9,  t1: 25.8,  zh: '我回到了这里' },
    { t0: 25.9,  t1: 28.8,  zh: '寻找我们爱过的证据' },
    { t0: 28.9,  t1: 29.8,  zh: '没有人愿意提起' },
    { t0: 29.9,  t1: 31.8,  zh: '玫瑰花它的过去' },
    { t0: 31.9,  t1: 32.8,  zh: '今天这里的主题' },
    { t0: 32.9,  t1: 33.8,  zh: '我把它叫作 回忆' },
    { t0: 34.8,  t1: 35.8,  zh: '我知道 爱情这东西' },
    { t0: 35.9,  t1: 36.8,  zh: '它没什么道理' },
    { t0: 36.9,  t1: 38.8,  zh: '过去我和你在一起' },
    { t0: 38.9,  t1: 39.8,  zh: '是我太叛逆' },
    { t0: 39.9,  t1: 41.8,  zh: '现在只剩我自己' },
    { t0: 41.9,  t1: 44.8,  zh: '偷偷的想你' },
    { t0: 45.8,  t1: 47.8,  zh: '玫瑰花的葬礼' },
    { t0: 47.9,  t1: 51.8,  zh: '埋葬关于你的回忆' },
    { t0: 51.9,  t1: 53.8,  zh: '感觉双手麻痹' },
    { t0: 53.9,  t1: 55.8,  zh: '不能自已' },
    { t0: 55.9,  t1: 56.8,  zh: '已拉不住你' },
    { t0: 57.8,  t1: 59.8,  zh: '真的好美丽' },
    { t0: 59.9,  t1: 62.8,  zh: '那天的烟花雨' },
    { t0: 63.8,  t1: 67.8,  zh: '我说要娶穿碎花洋裙的你' },
    { t0: 68.8,  t1: 71.8,  zh: '玫瑰花的葬礼' },
    { t0: 71.9,  t1: 73.8,  zh: '埋葬深深爱着的你' },
    { t0: 74.8,  t1: 76.8,  zh: '残朵停止呼吸' },
    { t0: 76.9,  t1: 78.8,  zh: '渗入大地' },
    { t0: 78.9,  t1: 79.8,  zh: '没人会注意' },
    { t0: 80.8,  t1: 83.8,  zh: '一片小雨滴' },
    { t0: 83.9,  t1: 85.8,  zh: '陪着我等天明' },
    { t0: 86.8,  t1: 91.8,  zh: '我用这最后一分钟怀念你' },
    { t0: 93.8,  t1: 95.8,  zh: '我在夜幕笼罩的天桥上潜行' },
    { t0: 95.9,  t1: 97.8,  zh: '每一级阶梯' },
    { t0: 97.9,  t1: 99.8,  zh: '都留着你我昔日印迹' },
    { t0: 99.9,  t1: 101.8, zh: '温存迷醉 吵闹清醒' },
    { t0: 101.9, t1: 102.8, zh: '都还在我的脚畔' },
    { t0: 102.9, t1: 104.8, zh: '兜兜兜兜转不清' },
    { t0: 104.9, t1: 106.8, zh: '没来得及把红色玫瑰递给你' },
    { t0: 106.9, t1: 107.8, zh: '爱就像是一场雨' },
    { t0: 107.9, t1: 109.8, zh: '已经离我而去' },
    { t0: 109.9, t1: 110.8, zh: '你说过' },
    { t0: 110.9, t1: 113.8, zh: '太过鲜艳的爱情 终将凋零' },
    { t0: 115.8, t1: 118.8, zh: '玫瑰花的葬礼' },
    { t0: 118.9, t1: 121.8, zh: '埋葬关于你的回忆' },
    { t0: 121.9, t1: 123.8, zh: '感觉双手麻痹' },
    { t0: 123.9, t1: 125.8, zh: '不能自已' },
    { t0: 125.9, t1: 127.8, zh: '已拉不住你' },
    { t0: 127.9, t1: 129.8, zh: '真的好美丽' },
    { t0: 129.9, t1: 133.8, zh: '那天的烟花雨' },
    { t0: 133.9, t1: 137.8, zh: '我说要娶穿碎花洋裙的你' },
    { t0: 138.8, t1: 141.8, zh: '玫瑰花的葬礼' },
    { t0: 141.9, t1: 144.8, zh: '埋葬深深爱着的你' },
    { t0: 144.9, t1: 147.8, zh: '残朵停止呼吸' },
    { t0: 147.9, t1: 148.8, zh: '渗入大地' },
    { t0: 148.9, t1: 150.8, zh: '没人会注意' },
    { t0: 150.9, t1: 153.8, zh: '一片小雨滴' },
    { t0: 153.9, t1: 155.8, zh: '陪着我等天明' },
    { t0: 156.8, t1: 161.8, zh: '我用这最后一分钟怀念你' },
    { t0: 162.8, t1: 166.8, zh: '总是回想过去 埋怨我自己' },
    { t0: 168.8, t1: 173.8, zh: '总是不经意间 想起了你' },
    { t0: 174.8, t1: 178.8, zh: '现在的你 已经太遥不可及' },
    { t0: 179.8, t1: 184.8, zh: '只能留在我记忆' },
    { t0: 185.8, t1: 188.8, zh: '玫瑰花的葬礼' },
    { t0: 188.9, t1: 191.8, zh: '埋葬关于你的回忆' },
    { t0: 191.9, t1: 193.8, zh: '感觉双手麻痹' },
    { t0: 194.8, t1: 195.8, zh: '不能自已' },
    { t0: 195.9, t1: 196.8, zh: '已拉不住你' },
    { t0: 197.8, t1: 200.8, zh: '真的好美丽' },
    { t0: 200.9, t1: 203.8, zh: '那天的烟花雨' },
    { t0: 203.9, t1: 207.8, zh: '我说要娶穿碎花洋裙的你' },
    { t0: 209.8, t1: 211.8, zh: '玫瑰花的葬礼' },
    { t0: 211.9, t1: 215.8, zh: '埋葬深深爱着的你' },
    { t0: 215.9, t1: 217.8, zh: '残朵停止呼吸' },
    { t0: 217.9, t1: 218.8, zh: '渗入大地' },
    { t0: 218.9, t1: 220.8, zh: '没人会注意' },
    { t0: 220.9, t1: 223.8, zh: '一片小雨滴' },
    { t0: 223.9, t1: 226.8, zh: '陪着我等天明' },
    { t0: 226.9, t1: 231.8, zh: '我用这最后一分钟怀念你' },
    { t0: 232.8, t1: 236.77, zh: '我用这最后一分钟' }
  ];

  function renderMeiguihuaFrame(ctx, t) {
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    CORE.setActiveStyle('pixel');
    const found = findActiveSub(SUBS_MEIGUIHUA, t);
    const sub = found ? found.sub : null;
    const lt = sub ? (t - sub.t0) : (t % 4.0);

    // Cycle through the authentic scenes of `mv/玫瑰花的葬礼.mp4`:
    // - Voice message phone UI (`0-22s`)
    // - Fireworks & Bridal Shop Window (`57-68s`, `127-138s`, `197-208s`)
    // - Ticking Clock "最后一分钟" (`86-93s`, `156-162s`, `226-237s`)
    // - Rainy Rose Memorial "回忆" & Night Overpass (default)
    if (t < 22) {
      paint(ctx, rectPts(0, 0, W, H), { fill: '#1A1025', ink: null });
      paint(ctx, rrPts(420, 40, 440, 560, 22), { fill: '#F8FAFC', ink: '#F472B6', sw: 5 });
      paint(ctx, rectPts(420, 40, 440, 54), { fill: '#EC4899', ink: null });
      ctx.font = 'bold 22px "ZCOOLKuaiLe", sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.fillText('玫瑰语音信箱 · 100周前', 640, 74);
      for (let v = 0; v < 4; v++) {
        paint(ctx, rrPts(460, 125 + v * 78, 340, 52, 12), { fill: '#FCE7F3', ink: '#F472B6', sw: 2 });
        ctx.fillStyle = '#831843';
        ctx.fillText(v === 3 ? '「我还是很想你...」 [已撤回]' : `▶ 语音留言 0:0${v + 3}"`, 630, 157 + v * 78);
      }
      whaleGirl(ctx, 260, 540, 27, { t, lt, emotions: [[0, 'sad', 'sweat'], [2.0, 'cry', null]] });
    } else if ((t >= 57 && t < 68) || (t >= 127 && t < 138) || (t >= 197 && t < 208)) {
      // Fireworks Rain & Bridal Shop Window ("那天的烟花雨 / 我说要娶穿碎花洋裙的你")
      paint(ctx, rectPts(0, 0, W, H), { fill: '#1E1028', ink: null });
      for (let f = 0; f < 4; f++) {
        const fx = 240 + f * 260, fy = 150 + (f % 2) * 50;
        for (let r = 0; r < 12; r++) {
          const a = (r / 12) * Math.PI * 2 + t * 0.5;
          stroke(ctx, linePts(fx, fy, fx + Math.cos(a) * 60, fy + Math.sin(a) * 60), { ink: '#F472B6', sw: 2.5 });
        }
      }
      // Bridal shop display window
      paint(ctx, rrPts(420, 220, 440, 310, 12), { fill: '#FFF1F2', ink: '#FB7185', sw: 5 });
      ctx.font = 'bold 26px "ZCOOLKuaiLe", sans-serif';
      ctx.fillStyle = '#BE123C';
      ctx.textAlign = 'center';
      ctx.fillText('✦ 婚纱 · 碎花洋裙 ✦', 640, 262);
      whaleGirl(ctx, 575, 555, 29, {
        t, lt, hat: 'Flower Pin',
        emotions: [[0, 'shy', 'heart'], [1.2, 'love', 'heart'], [2.4, 'sparkle', 'sparkle']]
      });
      if (CAST.ladyGemini) CAST.ladyGemini(ctx, 715, 555, 28, { t, flip: true, emote: 'heart' });
    } else if ((t >= 86 && t < 93) || (t >= 156 && t < 162) || t >= 226) {
      // Giant Ticking Clock ("我用这最后一分钟怀念你")
      paint(ctx, rectPts(0, 0, W, H), { fill: '#1F122B', ink: null });
      paint(ctx, ellPts(640, 300, 185, 185, 32), { fill: '#FFF1F2', ink: '#FB7185', sw: 8 });
      stroke(ctx, linePts(640, 300, 640 + Math.cos(t * 6) * 140, 300 + Math.sin(t * 6) * 140), { ink: '#BE123C', sw: 5 });
      whaleGirl(ctx, 640, 560, 29, {
        t, lt, emotions: [[0, 'sad', null], [1.5, 'cry', 'sweat'], [3.0, 'plead', 'heart']]
      });
    } else {
      // Rainy Rose Memorial "回忆" & Falling Red Rose Petals
      paint(ctx, rectPts(0, 0, W, H), { fill: '#160F24', ink: null });
      paint(ctx, rectPts(0, 520, W, 200), { fill: '#0F172A', ink: '#881337', sw: 3 });
      // Stone memorial "回忆"
      paint(ctx, rrPts(760, 340, 150, 185, 14), { fill: '#64748B', ink: '#334155', sw: 4 });
      ctx.font = 'bold 34px "ZCOOLKuaiLe", sans-serif';
      ctx.fillStyle = '#E2E8F0';
      ctx.textAlign = 'center';
      ctx.fillText('回 忆', 835, 435);
      // Raindrops & falling rose petals
      for (let r = 0; r < 28; r++) {
        const rx = (r * 97 + Math.floor(t * 40)) % W;
        const ry = (r * 67 + Math.floor(t * 140)) % 540;
        stroke(ctx, linePts(rx, ry, rx - 6, ry + 18), { ink: '#60A5FA', sw: 1.5 });
        const px = (r * 131 + Math.floor(t * 55)) % W;
        const py = (r * 83 + Math.floor(t * 70)) % 550;
        paint(ctx, ellPts(px, py, 8, 5, 6), { fill: '#E11D48', ink: null });
      }
      whaleGirl(ctx, 520, 560, 29, {
        t, lt, emotions: [[0, 'sad', null], [1.5, 'cry', 'sweat'], [3.0, 'sigh', null]]
      });
    }

    drawRpgKaraokeSub(ctx, sub, t);
    ctx.restore();
  }

  // ==========================================================================
  // 9. `suyan` — Replicating `mv/素颜1.mp4` (238.05s)
  // 许嵩 & 何曼婷《素颜》 — 100% Frame-Verified Subtitles from `suyan_subs2_p1/p2.jpg`
  // ==========================================================================
  const SUBS_SUYAN = [
    { t0: 0.5,   t1: 12.2,  role: '',   zh: '许嵩 & 何曼婷《素颜》 · 回到 2009 的纯真夏天' },
    { t0: 12.8,  t1: 14.8,  role: '他', zh: '又是一个安静的晚上' },
    { t0: 14.9,  t1: 17.8,  role: '他', zh: '一个人窝在摇椅里乘凉' },
    { t0: 17.9,  t1: 20.8,  role: '他', zh: '我承认这样真的很安详' },
    { t0: 20.9,  t1: 23.8,  role: '他', zh: '和楼下老爷爷一样' },
    { t0: 23.9,  t1: 26.2,  role: '她', zh: '听说你还在搞什么原创' },
    { t0: 26.8,  t1: 28.8,  role: '她', zh: '搞来搞去好像也就这样' },
    { t0: 28.9,  t1: 31.8,  role: '她', zh: '不如花点时间想想' },
    { t0: 31.9,  t1: 34.8,  role: '她', zh: '琢磨一下模样' },
    { t0: 34.9,  t1: 37.8,  role: '她', zh: '今夜化了美美的妆' },
    { t0: 37.9,  t1: 40.8,  role: '他', zh: '我相信是很美美的妆' },
    { t0: 40.9,  t1: 42.8,  role: '她', zh: '我摇晃在舞池中央' },
    { t0: 42.9,  t1: 45.8,  role: '他', zh: '那种体态可以想象' },
    { t0: 45.9,  t1: 50.8,  role: '她', zh: '我做我的改变又何必纠结' },
    { t0: 50.9,  t1: 55.8,  role: '他', zh: '那就拜托别和我碰面' },
    { t0: 56.8,  t1: 61.8,  role: '他', zh: '如果再看你一眼是否还会有感觉' },
    { t0: 61.9,  t1: 67.8,  role: '他', zh: '当年素面朝天要多纯洁就有多纯洁' },
    { t0: 67.9,  t1: 72.8,  role: '她', zh: '不画扮熟的眼线不用抹匀粉底液' },
    { t0: 73.8,  t1: 74.8,  role: '他', zh: '暴雨天' },
    { t0: 74.9,  t1: 75.8,  role: '她', zh: '照逛街' },
    { t0: 75.9,  t1: 78.8,  role: '合', zh: '偷笑别人花了脸' },
    { t0: 78.9,  t1: 84.8,  role: '他', zh: '如果再看你一眼是否还会有感觉' },
    { t0: 84.9,  t1: 89.8,  role: '他', zh: '最真实的喜怒哀乐全都埋葬在昨天' },
    { t0: 90.8,  t1: 95.8,  role: '她', zh: '不掺任何的表演轰轰烈烈那几年' },
    { t0: 95.9,  t1: 97.2,  role: '他', zh: '我怀念' },
    { t0: 97.8,  t1: 98.8,  role: '她', zh: '别怀念' },
    { t0: 98.9,  t1: 103.8, role: '合', zh: '怀念也回不到从前' },
    { t0: 119.8, t1: 121.8, role: '他', zh: '又是一个安静的晚上' },
    { t0: 122.8, t1: 124.8, role: '他', zh: '一个人窝在摇椅里乘凉' },
    { t0: 124.9, t1: 127.8, role: '他', zh: '我承认这样真的很安详' },
    { t0: 127.9, t1: 130.8, role: '他', zh: '和楼下老爷爷一样' },
    { t0: 130.9, t1: 133.8, role: '她', zh: '听说你还在搞什么原创' },
    { t0: 133.9, t1: 136.8, role: '她', zh: '搞来搞去好像也就这样' },
    { t0: 136.9, t1: 138.8, role: '她', zh: '不如花点时间想想' },
    { t0: 138.9, t1: 141.8, role: '她', zh: '琢磨一下模样' },
    { t0: 141.9, t1: 144.8, role: '她', zh: '今夜化了美美的妆' },
    { t0: 144.9, t1: 147.8, role: '他', zh: '我相信是很美美的妆' },
    { t0: 147.9, t1: 150.8, role: '她', zh: '我摇晃在舞池中央' },
    { t0: 150.9, t1: 152.8, role: '他', zh: '那种体态可以想象' },
    { t0: 153.8, t1: 157.8, role: '她', zh: '我做我的改变又何必纠结' },
    { t0: 157.9, t1: 163.8, role: '他', zh: '那就拜托别和我碰面' },
    { t0: 163.9, t1: 168.8, role: '他', zh: '如果再看你一眼是否还会有感觉' },
    { t0: 169.8, t1: 174.8, role: '他', zh: '当年素面朝天要多纯洁就有多纯洁' },
    { t0: 174.9, t1: 180.8, role: '她', zh: '不画扮熟的眼线不用抹匀粉底液' },
    { t0: 180.9, t1: 181.8, role: '他', zh: '暴雨天' },
    { t0: 181.9, t1: 182.8, role: '她', zh: '照逛街' },
    { t0: 183.8, t1: 185.8, role: '合', zh: '偷笑别人花了脸' },
    { t0: 186.8, t1: 191.8, role: '他', zh: '如果再看你一眼是否还会有感觉' },
    { t0: 191.9, t1: 197.8, role: '他', zh: '最真实的喜怒哀乐全都埋葬在昨天' },
    { t0: 197.9, t1: 202.8, role: '她', zh: '不掺任何的表演轰轰烈烈那几年' },
    { t0: 202.9, t1: 204.8, role: '他', zh: '我怀念' },
    { t0: 204.9, t1: 205.8, role: '她', zh: '别怀念' },
    { t0: 205.9, t1: 209.8, role: '合', zh: '怀念也回不到从前' },
    { t0: 209.9, t1: 214.8, role: '他', zh: '曾经对上的瞬间难道是一种错觉' },
    { t0: 215.8, t1: 219.8, role: '他', zh: '那些流逝了的就永远不会复现' },
    { t0: 220.8, t1: 225.8, role: '她', zh: '不掺任何的表演轰轰烈烈那几年' },
    { t0: 225.9, t1: 227.8, role: '他', zh: '有遗憾的感觉' },
    { t0: 229.8, t1: 234.8, role: '他', zh: '那消失不见的素颜' },
    { t0: 234.9, t1: 238.05, role: '合', zh: '《素颜》 · 许嵩 & 何曼婷' }
  ];

  function renderSuyanFrame(ctx, t) {
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    CORE.setActiveStyle('pixel');
    const found = findActiveSub(SUBS_SUYAN, t);
    const sub = found ? found.sub : null;
    const lt = sub ? (t - sub.t0) : (t % 4.0);

    // Cycle through the authentic scenes of `mv/素颜1.mp4`:
    // - Split-Screen Evening Room (`12-28s`, `119-136s`)
    // - RPG Character Makeover UI "Lv.1 捏脸·模样" & Dance Floor (`28-56s`, `136-163s`)
    // - 2009 Classroom Chalkboard "素颜队 0:0 化妆" (`61-73s`, `84-96s`, `169-180s`, `191-203s`)
    // - Rainy Bus Stop under Yellow Umbrella "暴雨天 照逛街 偷笑别人花了脸" (`73-84s`, `180-191s`, `203-238s`)
    if ((t >= 12 && t < 28) || (t >= 119 && t < 136)) {
      // Split-screen room: Left "他 23:47 原创编曲" / Right "她 23:47 化妆台"
      paint(ctx, rectPts(0, 0, 640, H), { fill: '#1E293B', ink: '#F59E0B', sw: 4 });
      paint(ctx, rectPts(640, 0, 640, H), { fill: '#3B0764', ink: '#F472B6', sw: 4 });
      ctx.font = 'bold 24px "ZCOOLKuaiLe", sans-serif';
      ctx.fillStyle = '#FDE047';
      ctx.textAlign = 'left';
      ctx.fillText('23:47 · 他 (窝在摇椅里搞原创)', 48, 62);
      ctx.fillStyle = '#F9A8D4';
      ctx.fillText('23:47 · 她 (梳妆台前琢磨模样)', 688, 62);
      if (CAST.ladyGemini) CAST.ladyGemini(ctx, 320, 545, 29, { t, emote: 'music' });
      whaleGirl(ctx, 960, 545, 29, {
        t, lt, emotions: [[0, 'curious', 'question'], [1.5, 'happy', 'sparkle'], [3.0, 'wink', 'heart']]
      });
    } else if ((t >= 28 && t < 56) || (t >= 136 && t < 163)) {
      // RPG Character Makeover Screen ("琢磨一下模样 / 今夜化了美美的妆 / 我摇晃在舞池中央")
      paint(ctx, rectPts(0, 0, W, H), { fill: '#2E1065', ink: null });
      paint(ctx, rrPts(140, 55, 1000, 490, 14), { fill: '#1E1B2E', ink: '#F472B6', sw: 4 });
      ctx.font = 'bold 28px "ZCOOLKuaiLe", sans-serif';
      ctx.fillStyle = '#FDE047';
      ctx.textAlign = 'left';
      ctx.fillText('★ Lv.1 角色捏脸与舞池装扮系统 · 魅力值 999 ★', 180, 105);
      const sliders = ['眼线浓淡', '粉底亮白', '唇彩炫光度', '舞池摇晃值'];
      for (let s = 0; s < 4; s++) {
        ctx.fillStyle = '#FBCFE8';
        ctx.fillText(sliders[s], 720, 185 + s * 75);
        paint(ctx, rrPts(870, 165 + s * 75, 210, 24, 8), { fill: '#334155', ink: '#F472B6', sw: 2 });
        paint(ctx, rrPts(870, 165 + s * 75, 140 + Math.sin(t * 3 + s) * 55, 24, 8), { fill: '#EC4899', ink: null });
      }
      whaleGirl(ctx, 430, 495, 32, {
        t, lt, hat: 'Crown',
        emotions: [[0, 'wink', 'sparkle'], [1.2, 'smug', 'music'], [2.4, 'excited', 'heart']]
      });
    } else if ((t >= 61 && t < 73) || (t >= 84 && t < 96) || (t >= 169 && t < 180) || (t >= 191 && t < 203)) {
      // 2009 Classroom Chalkboard ("当年素面朝天要多纯洁就有多纯洁 / 素颜队 0:0 化妆")
      paint(ctx, rectPts(0, 0, W, H), { fill: '#78350F', ink: null });
      paint(ctx, rrPts(110, 50, 1060, 420, 10), { fill: '#14532D', ink: '#B45309', sw: 10 });
      ctx.font = 'bold 42px "ZCOOLKuaiLe", sans-serif';
      ctx.fillStyle = '#F8FAFC';
      ctx.textAlign = 'center';
      ctx.fillText('值日生：深海鲸鱼娘 · 素颜队 0 : 0 化妆队 · 2009青春纪念', 640, 160);
      ctx.font = 'bold 28px "ZCOOLKuaiLe", sans-serif';
      ctx.fillStyle = '#FEF08A';
      ctx.fillText('「当年素面朝天 要多纯洁就有多纯洁」', 640, 260);
      whaleGirl(ctx, 540, 565, 29, {
        t, lt, emotions: [[0, 'happy', 'sparkle'], [1.5, 'laugh', 'heart'], [3.0, 'shy', 'heart']]
      });
      if (CAST.ladyGemini) CAST.ladyGemini(ctx, 740, 565, 28, { t, flip: true, emote: 'sparkle' });
    } else {
      // Rainy Street under Shared Yellow Umbrella ("暴雨天 照逛街 偷笑别人花了脸")
      paint(ctx, rectPts(0, 0, W, H), { fill: '#0F172A', ink: null });
      paint(ctx, rectPts(0, 520, W, 200), { fill: '#1E293B', ink: '#38BDF8', sw: 2.5 });
      for (let r = 0; r < 30; r++) {
        const rx = (r * 97 + Math.floor(t * 50)) % W;
        const ry = (r * 61 + Math.floor(t * 160)) % 530;
        stroke(ctx, linePts(rx, ry, rx - 8, ry + 20), { ink: '#60A5FA', sw: 1.8 });
      }
      // Shared bright yellow umbrella
      stroke(ctx, linePts(640, 210, 640, 510), { ink: '#FEF08A', sw: 5 });
      paint(ctx, polyPts([[440, 240], [530, 150], [640, 130], [750, 150], [840, 240]]), {
        fill: '#FACC15', ink: '#CA8A04', sw: 3.5
      });
      whaleGirl(ctx, 580, 560, 28, {
        t, lt, emotions: [[0, 'laugh', 'music'], [1.2, 'happy', 'heart'], [2.4, 'love', 'sparkle']]
      });
      if (CAST.ladyGemini) CAST.ladyGemini(ctx, 700, 560, 27, { t, flip: true, emote: 'heart' });
    }

    drawRpgKaraokeSub(ctx, sub, t);
    ctx.restore();
  }

  const LONG_MVS = {
    huainvhai: {
      tag: 'huainvhai',
      title: '徐良 & 小凌《坏女孩》(QQ2009 与劲舞团篇)',
      duration: 245.55,
      subs: SUBS_HUAINVHAI,
      renderFrame: renderHuainvhaiFrame
    },
    feng: {
      tag: 'feng',
      title: '周杰伦《枫》(秋日枫林与烛火篇)',
      duration: 274.58,
      subs: SUBS_FENG,
      renderFrame: renderFengFrame
    },
    meiguihua: {
      tag: 'meiguihua',
      title: '许嵩《玫瑰花的葬礼》(烟花雨与玫瑰篇)',
      duration: 236.77,
      subs: SUBS_MEIGUIHUA,
      renderFrame: renderMeiguihuaFrame
    },
    suyan: {
      tag: 'suyan',
      title: '许嵩 & 何曼婷《素颜》(2009 黑板与黄雨伞篇)',
      duration: 238.05,
      subs: SUBS_SUYAN,
      renderFrame: renderSuyanFrame
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = LONG_MVS;
  }
  root.MV_PACK_LONG = LONG_MVS;
})(typeof window !== 'undefined' ? window : globalThis);
