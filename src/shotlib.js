// ============================================================================
// src/shotlib.js — 分镜引擎 (Shot Engine)
// ============================================================================
// 解决用户的三个核心抱怨：
//   1. “一直循环几个画面，细节太少”  → 一条歌词 = 一个独立镜头；镜头有推/拉/摇/移，
//                                      景别在 全景 / 中景 / 特写 之间交替；每条歌词
//                                      内部还会再切一次“反应镜头”。
//   2. “动作太少”                     → 每个镜头从 `src/actions.js` 的 37 个动作里
//                                      取动作，同一部片子里相邻 5 个镜头不重复。
//   3. “歌词和字幕不匹配 / 没有字幕”   → 字幕层独立于场景，永远画在最上面；
//                                      时间轴取自 `src/timings/<mv>.json`
//                                      （由 tools/ocr_reference_subs.py 从参考片 OCR 实测）。
//
// 对外 API：
//   SHOT.loadLines(key, fallback)      读取实测歌词时间轴（缺失时回退到旧表）
//   SHOT.plan(key, lines, opts)        编排分镜表（每句 1~2 个镜头）
//   SHOT.render(ctx, plan, t, opts)    渲染任意时刻的一帧
//   SHOT.drawLyrics(ctx, line, t, o)   统一的高对比卡拉 OK 字幕层
//   SHOT.stats(plan)                   统计独立布景 / 动作 / 镜头数（质量报告用）
//   SHOT.contactSheet(...)             分镜缩略图
// ============================================================================

(function (root) {
  const CORE = root.CORE || (typeof require !== 'undefined' ? require('./core.js') : {});
  const WHALE = root.WHALE_GIRL || (typeof require !== 'undefined' ? require('./whale_girl.js') : {});
  const CAST = root.CAST || (typeof require !== 'undefined' ? require('./cast.js') : {});
  const SETPB = root.SETPB || (typeof require !== 'undefined' ? require('./sets.js') : {});
  const ACT = root.ACT || (typeof require !== 'undefined' ? require('./actions.js') : {});
  const DETAIL = root.DETAIL || (typeof require !== 'undefined' ? require('./detail.js') : null);

  const { W = 1280, H = 720, clamp = (v, a, b) => Math.max(a, Math.min(b, v)),
    lerp = (a, b, k) => a + (b - a) * k, seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1),
    ease = (k) => k * k * (3 - 2 * k), easeOut = (k) => 1 - (1 - k) * (1 - k),
    paint, rrPts, ellPts, rectPts, camBegin, camEnd, brushWipe, iris } = CORE;

  const { whaleGirl, feel, emotions } = WHALE;
  const drawSet = SETPB.drawSet || root.drawSet || (() => {});
  const SET_NAMES = SETPB.SET_NAMES || root.SET_NAMES || ['deepSea'];
  const ACT_LIST = (ACT && ACT.ACTION_LIST) || ['idle'];
  const drawAction = ACT && ACT.drawAction;

  // ---------------------------------------------------------------------------
  // 1. 歌词时间轴
  // ---------------------------------------------------------------------------
  let TIMINGS = null;
  function allTimings() {
    if (TIMINGS) return TIMINGS;
    TIMINGS = {};
    if (typeof require === 'function') {
      try {
        const fs = require('fs');
        const path = require('path');
        const dir = path.join(__dirname, 'timings');
        if (fs.existsSync(dir)) {
          for (const f of fs.readdirSync(dir)) {
            if (!f.endsWith('.json') || f === 'overrides.json') continue;
            const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
            if (data && data.lines) TIMINGS[data.key || f.replace('.json', '')] = data;
          }
        }
      } catch (e) { /* 浏览器环境忽略 */ }
    }
    if (root.MV_TIMINGS) Object.assign(TIMINGS, root.MV_TIMINGS);
    return TIMINGS;
  }

  function loadLines(key, fallback = []) {
    const t = allTimings()[key];
    if (t && t.lines && t.lines.length >= 3) {
      // 应用到正字数（合并被 OCR 拆碎的短句）
      return t.lines.map((l) => ({ t0: l.t0, t1: l.t1, zh: l.zh }));
    }
    return fallback.map((s) => ({ t0: s.t0, t1: s.t1, zh: s.zh || s.text || '' }));
  }

  // ---------------------------------------------------------------------------
  // 2. 镜头语言
  // ---------------------------------------------------------------------------
  // 机位只描述"怎么动"，构图（对焦点 + 缩放）由景别 + 角色位置算出来，
  // 这样特写不会把脑袋切掉，全景也不会出现大片空地。
  // 14 部片子共用的"时辰"轮转表（顺序打散，保证相邻镜头光线不同）
  const MOOD_CYCLE = ['night', 'dusk', 'sunny', 'dawn', 'dusk', 'night', 'rain', 'sunny', 'dawn'];

  const CAMS = {
    static:   { dz: 0.00, dx: 0, dy: 0, rot: 0 },
    pushIn:   { dz: 0.20, dx: 0, dy: -8, rot: 0 },
    pullOut:  { dz: -0.18, dx: 0, dy: 8, rot: 0 },
    panRight: { dz: 0.03, dx: 80, dy: 0, rot: 0 },
    panLeft:  { dz: 0.03, dx: -80, dy: 0, rot: 0 },
    tiltUp:   { dz: 0.05, dx: 0, dy: -46, rot: 0 },
    tiltDown: { dz: 0.05, dx: 0, dy: 42, rot: 0 },
    orbit:    { dz: 0.09, dx: 64, dy: -18, rot: 0.015 },
    dutch:    { dz: 0.05, dx: 0, dy: -8, rot: -0.05 },
    drift:    { dz: -0.05, dx: -54, dy: 12, rot: 0 }
  };
  const CAM_NAMES = Object.keys(CAMS);

  // 景别：u = 角色比例；focus = 对焦点所在的身高比例（0 脚底，1 头顶）
  const SHOT_SIZES = {
    wide:   { u: 26, zoom: 0.96, focus: 0.50 },
    medium: { u: 32, zoom: 1.04, focus: 0.58 },
    hero:   { u: 36, zoom: 1.06, focus: 0.64 },
    close:  { u: 44, zoom: 1.24, focus: 0.82 }
  };
  const SIZE_NAMES = ['wide', 'medium', 'close', 'hero'];

  // ---------------------------------------------------------------------------
  // 3. 分镜编排
  // ---------------------------------------------------------------------------
  // 均匀覆盖 + 避开最近用过的（banned）：以 i*7 为起点线性扫描，
  // 保证列表内每个元素都能轮到，同时不会与最近 4 个镜头重复。
  // 最少使用优先（LRU）：在"最近几个不许重复"的前提下，挑用得最少的那个。
  // 这样 14 个布景会被均匀铺满整部片，而不是每隔 4 个镜头循环一次。
  function pickDistinct(list, i, banned, usage) {
    const n = list.length;
    let best = null;
    let bestScore = Infinity;
    for (let k = 0; k < n; k++) {
      const cand = list[(i + k) % n];
      if (banned.includes(cand)) continue;
      const score = ((usage && usage[cand]) || 0) * 100 + k;
      if (score < bestScore) { bestScore = score; best = cand; }
    }
    if (best !== null) return best;
    // 全被 banned（池子太小）：退回纯轮转
    return list[i % n];
  }

  const DEFAULT_POOL = [
    'wave', 'walk', 'heart', 'dance', 'thinkChin', 'hum', 'tailSit', 'spin',
    'cheerJump', 'eat', 'lookAround', 'proud', 'nod', 'stretch', 'sing',
    'sneak', 'crouch', 'kneelPick', 'blushPuff', 'peek', 'laptop', 'waveBoth',
    'blinkIdle', 'shakeTail', 'run', 'rubEyes', 'fistPump', 'countFingers'
  ];

  const X_POSITIONS = [455, 640, 760, 545, 700, 600];

  /**
   * plan(key, lines, opts)
   *   opts.sets    布景池      opts.pool   动作池
   *   opts.guests  配角        opts.style  画风
   *   opts.split   长句是否再切一个"反应镜头"（默认 true）
   */
  function plan(key, lines, opts = {}) {
    const usageSet = {};
    const usageAction = {};
    const sets = opts.sets && opts.sets.length ? opts.sets : ['deepSea', 'beachNight', 'rooftopCity', 'galaxy', 'hillMeadow', 'stage'];
    const pool = (opts.pool || DEFAULT_POOL).filter((n) => ACT_LIST.includes(n));
    const usePool = pool.length >= 6 ? pool : DEFAULT_POOL.filter((n) => ACT_LIST.includes(n));
    const camPool = opts.cams || CAM_NAMES;
    const style = opts.style || 'pixel';
    const guests = (opts.guests || []).filter((g) => CAST[g]);

    const shots = [];
    const recentActions = [];
    const recentSets = [];
    let idx = 0;

    const pushShot = (t0, t1, line, o = {}) => {
      const action = pickDistinct(usePool, idx, recentActions.slice(-4), usageAction);
      const set = pickDistinct(sets, idx + 1, recentSets.slice(-2), usageSet);
      usageAction[action] = (usageAction[action] || 0) + 1;
      usageSet[set] = (usageSet[set] || 0) + 1;
      const cam = camPool[idx % camPool.length];
      const size = o.size || SIZE_NAMES[idx % SIZE_NAMES.length];
      const hit = SHOT_SIZES[size] || SHOT_SIZES.medium;
      const shot = {
        i: idx,
        t0, t1,
        line,
        set,
        cam,
        size,
        action,
        x: X_POSITIONS[idx % X_POSITIONS.length],
        u: hit.u,
        zoom: hit.zoom * (o.zoomMul || 1),
        focus: hit.focus,
        flip: idx % 3 === 0,
        view: o.view || (idx % 4 === 1 ? 'q' : 'front'),
        hat: ['maidHeadband', 'crown', 'party', 'flower', 'halo', 'maidHeadband'][idx % 6],
        guest: guests.length && idx % 2 === 1 ? guests[idx % guests.length] : null,
        guestFlip: idx % 2 === 0,
        // 时间/光线轮换：同一布景在不同镜头里换"时辰"，重复布景也不再是同一张画
        mood: o.mood || MOOD_CYCLE[idx % MOOD_CYCLE.length],
        pan: ((idx % 3) - 1) * 34,
        pieces: 3 + (idx % 7),
        actionAge: o.actionAge || 0
      };
      idx++;
      recentActions.push(action);
      recentSets.push(set);
      shots.push(shot);
      return shot;
    };

    // 间奏 / 前奏 / 字幕空档：绝不能"卡住同一帧"。用无字幕的空镜把空隙填满，
    // 每段不超过 ~4s，换布景换动作，让 0 秒到结尾一直有画面在动。
    const FILL_MAX = 4.0;
    let cursor = 0;
    function fillGap(to) {
      const gap = to - cursor;
      if (gap < 0.8) return;
      const parts = Math.min(4, Math.max(1, Math.round(gap / FILL_MAX)));
      for (let p = 0; p < parts; p++) {
        const a = cursor + (gap * p) / parts;
        const b = cursor + (gap * (p + 1)) / parts;
        const empty = { t0: a, t1: b, zh: '' };
        pushShot(a, b, empty, { size: p % 2 === 0 ? 'wide' : 'medium' });
      }
      cursor = to;
    }

    for (let i = 0; i < lines.length; i++) {
      const ln = lines[i];
      if (ln.t0 - cursor > 0.8) fillGap(ln.t0);
      const dur = Math.max(0.8, ln.t1 - ln.t0);
      if (opts.split !== false && dur > 2.8) {
        // 长句切两镜：前半"表演"，后半"特写反应"（换机位 + 换景别 + 换动作）
        const mid = ln.t0 + dur * (0.5 + ((idx % 4) * 0.06));
        pushShot(ln.t0, mid, ln, { size: idx % 3 === 0 ? 'wide' : 'medium' });
        pushShot(mid, ln.t1, ln, { size: 'close' });
        // 特别长的句子再切一刀"环境空镜"，给喘气的地方
        if (dur > 7.2) {
          const b = ln.t0 + dur * 0.72;
          shots[shots.length - 1].t1 = b;
          pushShot(b, ln.t1, ln, { size: 'wide' });
        }
      } else {
        pushShot(ln.t0, ln.t1, ln, { size: dur < 2 ? 'hero' : 'medium' });
      }
      cursor = Math.max(cursor, ln.t1);
    }
    // 结尾到全片结束还有时间：同样补空镜
    const total = opts.duration || (lines.length ? lines[lines.length - 1].t1 : 0);
    if (total - cursor > 0.8) fillGap(total);
    return { key, style, shots, duration: opts.duration || (lines.length ? lines[lines.length - 1].t1 : 0), accent: opts.accent };
  }

  // ---------------------------------------------------------------------------
  // 4. 渲染单个镜头
  // ---------------------------------------------------------------------------
  const GROUND_Y = 620;

  // 视觉中心：把画面主体压在中间略偏上，避免"人物贴底、上面一大片天"
  const VISUAL_CENTER_Y = 400;

  function shotCamera(shot, k) {
    const cam = CAMS[shot.cam] || CAMS.static;
    const bodyH = shot.u * 9.4;              // 角色总高（≈ 9.4u）
    const focusY = GROUND_Y - bodyH * shot.focus;
    const zoom = shot.zoom * (1 + cam.dz * k);
    // 相机中心 = 人物对焦点 + 偏移，偏移量随缩放变化，保证人物落在视觉中心
    const shift = (focusY - VISUAL_CENTER_Y) * (zoom - 1) / Math.max(zoom, 0.001);
    return {
      cx: shot.x + cam.dx * (k - 0.5),
      cy: focusY - shift * 0.55 + cam.dy * (k - 0.5),
      zoom,
      rot: cam.rot * Math.sin(k * Math.PI)
    };
  }

  function renderShot(ctx, shot, t, style, opts = {}) {
    const dur = Math.max(0.01, shot.t1 - shot.t0);
    const lt = clamp(t - shot.t0, 0, dur);
    const k = lt / dur;
    const c = shotCamera(shot, ease(k));
    camBegin(ctx, c.cx, c.cy, c.zoom, c.rot);

    // 布景（带视差）
    drawSet(ctx, shot.set, t, {
      seed: shot.i + 3,
      pan: shot.pan * (k - 0.5),
      pieces: shot.pieces,
      mood: shot.mood
    });

    // 空气层（光柱 / 飘落物 / 萤火 / 气泡）—— 让画面"有空气"
    if (DETAIL) DETAIL.drawAmbient(ctx, t, { set: shot.set, seed: shot.i + 3, mood: shot.mood });

    // 配角
    if (shot.guest) {
      const gx = shot.x < 640 ? shot.x + 280 : shot.x - 280;
      CAST[shot.guest](ctx, gx, GROUND_Y + 2, 20, {
        t, flip: shot.guestFlip, emote: k > 0.35 ? 'sparkle' : null
      });
    }

    // 主角：动作库 + 循环内的"准备→表演→恢复"
    const actT = opts.actionAge !== undefined ? opts.actionAge : lt;
    if (drawAction) {
      drawAction(ctx, shot.x, GROUND_Y, shot.u, shot.action, actT, {
        t,
        lt,
        hat: shot.hat,
        style,
        view: shot.view,
        flip: shot.flip,
        seed: shot.i,
        emoteK: 1
      });
    }

    // 前景遮挡层 —— 制造纵深（隔着草叶 / 栏杆 / 窗框看人物）
    if (DETAIL) {
      DETAIL.drawForeground(ctx, t, { set: shot.set, seed: shot.i + 3, mood: shot.mood });
      DETAIL.vignette(ctx, { strength: 0.38 });
    }
    camEnd(ctx);
  }


  // ---------------------------------------------------------------------------
  // 5. 字幕层（永远画在最上层，保证可读）
  // ---------------------------------------------------------------------------
  function drawLyrics(ctx, line, t, o = {}) {
    if (!line || !line.zh) return;
    const zh = line.zh;
    const t0 = line.t0, t1 = line.t1;
    const lt = clamp(t - t0, 0, Math.max(0.2, t1 - t0));
    const dur = Math.max(0.2, t1 - t0);
    const prog = clamp(lt / (dur * 0.8), 0, 1);
    const accent = o.accent || '#7DD3FC';
    const pop = lt < 0.18 ? (1 - easeOut(lt / 0.18)) * 16 : 0;

    ctx.save();
    ctx.translate(0, pop);

    // 底部压暗：任何亮背景（雪地/教室/晴天）上字幕都能读
    const fade = ctx.createLinearGradient(0, H - 200, 0, H);
    fade.addColorStop(0, 'rgba(3,7,18,0)');
    fade.addColorStop(1, 'rgba(3,7,18,0.62)');
    ctx.fillStyle = fade;
    ctx.fillRect(0, H - 200, W, 200);

    // 字体自适应：长句自动缩小，绝不溢出
    let fontSize = o.fontSize || 40;
    ctx.font = `bold ${fontSize}px "ZCOOLKuaiLe", "NotoSansSC", sans-serif`;
    let tw = ctx.measureText(zh).width;
    const maxW = W - 260;
    if (tw > maxW) {
      fontSize = Math.max(22, Math.floor(fontSize * maxW / tw));
      ctx.font = `bold ${fontSize}px "ZCOOLKuaiLe", "NotoSansSC", sans-serif`;
      tw = ctx.measureText(zh).width;
    }

    const boxW = Math.min(W - 120, Math.max(360, tw + 96));
    const boxH = fontSize + 46;
    const bx = W / 2 - boxW / 2;
    const by = H - boxH - 46 + (o.yOffset || 0);

    // 半透明深色底 + 强调色描边 + 柔和外发光
    paint(ctx, rrPts(bx, by, boxW, boxH, 22), { wash: '#050A15', washOp: 224, fill: '#0B1526', fillOp: 150, ink: accent, sw: 2.4 });
    paint(ctx, rrPts(bx + 7, by + 7, boxW - 14, boxH - 14, 17), { wash: '#0E1B31', washOp: 90, ink: null });

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const ty = by + boxH / 2;

    // 底字（完整显示，保证任何时刻都能读全）
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#03060F';
    ctx.strokeText(zh, W / 2, ty);
    ctx.fillStyle = '#EAF4FF';
    ctx.fillText(zh, W / 2, ty);

    // 卡拉 OK 金色扫光
    ctx.save();
    ctx.beginPath();
    ctx.rect(W / 2 - tw / 2 - 4, by, tw * prog + 8, boxH);
    ctx.clip();
    ctx.fillStyle = o.hiColor || '#FDE047';
    ctx.fillText(zh, W / 2, ty);
    ctx.restore();

    // 左上角小标：集数 / 歌曲
    if (o.tag) {
      ctx.textAlign = 'left';
      ctx.font = 'bold 15px "ZCOOLKuaiLe", "NotoSansSC", sans-serif';
      const tw2 = ctx.measureText(o.tag).width;
      paint(ctx, rrPts(26, 24, tw2 + 34, 34, 12), { wash: '#050A15', washOp: 205, ink: accent, sw: 1.6 });
      ctx.fillStyle = accent;
      ctx.fillText(o.tag, 43, 42);
    }
    ctx.restore();
  }

  // 进度条 / 节拍点（可选的 HUD）
  function drawBeatBar(ctx, t, duration, accent = '#38BDF8') {
    const w = W - 120;
    const x = 60, y = H - 20;
    ctx.save();
    ctx.fillStyle = 'rgba(6,11,24,0.55)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, 7, 4);
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.roundRect(x, y, w * clamp(t / Math.max(1, duration), 0, 1), 7, 4);
    ctx.fill();
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // 6. 整帧渲染（含转场与字幕）
  // ---------------------------------------------------------------------------
  function activeShot(pl, t) {
    const shots = pl.shots;
    if (!shots.length) return null;
    if (t <= shots[0].t0) return { shot: shots[0], lt: 0, k: 0 };
    for (let i = 0; i < shots.length; i++) {
      const s = shots[i];
      if (t >= s.t0 && t < s.t1) {
        return { shot: s, lt: t - s.t0, k: clamp((t - s.t0) / Math.max(0.01, s.t1 - s.t0), 0, 1) };
      }
    }
    const last = shots[shots.length - 1];
    return { shot: last, lt: last.t1 - last.t0, k: 1 };
  }

  function render(ctx, pl, t, o = {}) {
    const found = activeShot(pl, t);
    if (!found) return;
    const { shot } = found;
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    // 动作的"起始时间"= 镜头起点之后 0.25s，让动作先起势再表演
    const actionAge = Math.max(0, found.lt - 0.25);
    renderShot(ctx, shot, t, pl.style, { actionAge });

    // 字幕：优先当前镜头的歌词行
    drawLyrics(ctx, shot.line, t, { accent: o.accent || shot.accent || pl.accent, tag: o.tag });

    // 片尾 iris
    if (pl.duration && t > pl.duration - 1.6) {
      const r = lerp(900, 0, ease(seg(t, pl.duration - 1.6, pl.duration - 0.05)));
      iris(ctx, W / 2, H / 2 - 40, r, '#04070F');
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // 7. 质量统计（写进 docs/MV_QUALITY_REPORT.md）
  // ---------------------------------------------------------------------------
  function stats(pl) {
    const shotCount = pl.shots.length;
    const sets = new Set(pl.shots.map((s) => s.set));
    const acts = new Set(pl.shots.map((s) => s.action));
    const cams = new Set(pl.shots.map((s) => s.cam));
    let repeats = 0;
    let adjacentSameAction = 0;
    for (let i = 1; i < pl.shots.length; i++) {
      if (pl.shots[i].action === pl.shots[i - 1].action) adjacentSameAction++;
      if (pl.shots[i].set === pl.shots[i - 1].set) repeats++;
    }
    return {
      key: pl.key,
      duration: +pl.duration.toFixed(2),
      shots: shotCount,
      uniqueSets: sets.size,
      uniqueActions: acts.size,
      uniqueCams: cams.size,
      adjacentSameAction,
      adjacentSameSet: repeats,
      sets: [...sets],
      actions: [...acts]
    };
  }

  const api = {
    loadLines, plan, render, renderShot, drawLyrics, drawBeatBar, stats, activeShot,
    CAM_NAMES, CAMS, SHOT_SIZES, DEFAULT_POOL, allTimings
  };
  root.SHOT = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
