/*
 * Whale Maid Pixel Rig
 *
 * A hand-built Canvas model sheet for the source-locked whale maid. It is not
 * a moving PNG: hair, tail, headwear, eyes, brows, mouth, blush, hands, dress,
 * apron, shoes and props are separate drawable parts. The public draw() method
 * is time-pure and is shared by the browser preview and offline frame renderer.
 */
(function attachWhalePixelRig(root) {
  'use strict';

  const C = Object.freeze({
    ink: '#101633', navy: '#1c285e', navy2: '#314989', navy3: '#465d9d',
    hair: '#3557a8', hairDark: '#273b7e', hairHi: '#76cbe8', hairLite: '#a4e7f0',
    skin: '#ffe1cf', shade: '#eaa8a5', white: '#fff8ed', cream: '#e8edf2',
    bow: '#4b9ad2', gold: '#d6a55a', whale: '#337ab9', pupil: '#173774',
  });

  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const frac = (v) => v - Math.floor(v);
  const beat = (t, bpm = 117) => frac(t * bpm / 60);
  const pulse = (t) => Math.pow(1 - beat(t), 4);
  const q = (n) => Math.round(n);

  function poly(ctx, points, fill, stroke = null, width = 1) {
    ctx.beginPath();
    ctx.moveTo(q(points[0][0]), q(points[0][1]));
    for (let i = 1; i < points.length; i += 1) ctx.lineTo(q(points[i][0]), q(points[i][1]));
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
  }

  function line(ctx, points, color, width = 1) {
    ctx.beginPath();
    ctx.moveTo(q(points[0][0]), q(points[0][1]));
    for (let i = 1; i < points.length; i += 1) ctx.lineTo(q(points[i][0]), q(points[i][1]));
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
  }

  function oval(ctx, x, y, rx, ry, fill, stroke = null, width = 1) {
    ctx.beginPath(); ctx.ellipse(q(x), q(y), Math.max(1, q(rx)), Math.max(1, q(ry)), 0, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
  }

  function rect(ctx, x, y, w, h, fill, stroke = null, width = 1) {
    if (fill) { ctx.fillStyle = fill; ctx.fillRect(q(x), q(y), q(w), q(h)); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.strokeRect(q(x), q(y), q(w), q(h)); }
  }

  function blinkAt(t, offset = 0) {
    const phase = frac(t * .43 + offset);
    if (phase < .055) return Math.sin(phase / .055 * Math.PI);
    return 0;
  }

  function resolvePose(options) {
    if (options.pose) return options.pose;
    if (options.laptop) return 'laptop';
    if (options.hands || options.heart || options.mood === 'surprise' || options.mood === 'shocked') return 'hands';
    return 'stand';
  }

  function resolveEmotion(options) {
    const mood = options.mood || 'neutral';
    const map = {
      neutral: { eyes: 'soft', mouth: 'smile', brow: 0, blush: .18 },
      wink: { eyes: 'wink', mouth: 'smile', brow: 0, blush: .34 },
      smile: { eyes: 'soft', mouth: 'smile', brow: 0, blush: .28 },
      hopeful: { eyes: 'shine', mouth: 'smile', brow: -1, blush: .32 },
      focus: { eyes: 'focus', mouth: 'flat', brow: 1, blush: .08 },
      determined: { eyes: 'focus', mouth: 'flat', brow: 2, blush: .04 },
      surprise: { eyes: 'wide', mouth: 'o', brow: -2, blush: .74 },
      shocked: { eyes: 'wide', mouth: 'o', brow: -2, blush: .8 },
      sad: { eyes: 'sad', mouth: 'frown', brow: -1, blush: .25 },
      wistful: { eyes: 'soft', mouth: 'tiny', brow: -1, blush: .5 },
      search: { eyes: 'look', mouth: 'flat', brow: 1, blush: .1 },
      relieved: { eyes: 'closed', mouth: 'smile', brow: -1, blush: .28 },
    };
    return map[mood] || map.neutral;
  }

  function drawEye(ctx, x, y, side, t, emotion, lookX, lookY) {
    const forced = emotion.eyes === 'wink' && side > 0 ? 1 : 0;
    const blink = Math.max(forced, blinkAt(t, side < 0 ? .13 : .61));
    const isWide = emotion.eyes === 'wide';
    const isClosed = emotion.eyes === 'closed';
    const isSad = emotion.eyes === 'sad';
    const isFocus = emotion.eyes === 'focus';
    const isLook = emotion.eyes === 'look';
    const isShine = emotion.eyes === 'shine';
    const ry = isWide ? 8 : isFocus ? 5.7 : 6.6;
    const rx = isWide ? 6.2 : 5.7;
    if (isClosed || blink > .72) {
      line(ctx, [[x - rx, y + (isSad ? 1 : 0)], [x, y + 2 + (isSad ? 2 : 0)], [x + rx, y + (isSad ? 1 : 0)]], C.ink, 2);
      return;
    }
    // The eyelid is drawn separately from the eyeball so a blink has actual
    // lid movement rather than swapping an entire character image.
    oval(ctx, x, y, rx + 1, ry + 1, C.white, C.ink, 1.5);
    const ox = (isLook ? lookX * 2 : 0) + side * (isFocus ? .55 : 0);
    const oy = isLook ? lookY * 1.4 : (isSad ? 1 : 0);
    oval(ctx, x + ox, y + oy + .7, 4.2, ry - 1.4, '#4c8fd7');
    oval(ctx, x + ox, y + oy + 1.5, 2.35, ry - 3.1, C.pupil);
    rect(ctx, x + ox - 2, y + oy + 2, 4, 3, '#15295b');
    oval(ctx, x + ox - 1.25, y + oy - 1.65, 1.45, 1.65, C.white);
    if (isShine) { rect(ctx, x + ox + 1, y + oy + 3, 2, 2, C.hairLite); }
    if (blink > .05) {
      ctx.save(); ctx.globalAlpha = blink;
      oval(ctx, x, y - 1, rx + 1, ry * blink, C.skin);
      line(ctx, [[x - rx, y], [x, y + 1], [x + rx, y]], C.ink, 1.4);
      ctx.restore();
    }
  }

  function drawHeadwear(ctx, tailSway) {
    // A white ruffled maid band with visible individual scallops.
    line(ctx, [[-19, -61], [-14, -69], [-6, -73], [5, -73], [14, -68], [19, -61]], C.ink, 2);
    for (let i = -4; i <= 4; i += 1) {
      const x = i * 4.4;
      oval(ctx, x, -66 - Math.abs(i) * .32, 3.2, 4.7, C.white, C.ink, .8);
    }
    // The ahoge is a separate springy loop, so it can lag behind the head.
    ctx.save(); ctx.translate(0, -69); ctx.rotate(.2 + tailSway * .025);
    line(ctx, [[0, 0], [3, -9], [-2, -14], [-8, -12]], C.hairDark, 4);
    line(ctx, [[0, 0], [3, -9], [-2, -14], [-8, -12]], C.hairHi, 1);
    ctx.restore();
  }

  function drawTail(ctx, tailSway, pose) {
    // Whale tail is deliberately behind every human part and remains visible
    // in every pose, matching the source's long curled silhouette and fluke.
    ctx.save(); ctx.translate(18, 15); ctx.rotate(.06 + tailSway * .042 + (pose === 'laptop' ? .20 : 0));
    poly(ctx, [[-8, 13], [5, 3], [13, -15], [18, -38], [24, -56], [31, -57], [35, -46], [41, -54], [49, -49], [48, -36], [38, -25], [31, -17], [26, 5], [12, 23]], C.navy2, C.ink, 2);
    poly(ctx, [[20, -47], [25, -54], [31, -55], [34, -44], [30, -35]], '#4c64a4', C.ink, .8);
    poly(ctx, [[35, -44], [41, -52], [48, -49], [46, -39], [34, -28]], '#405890', C.ink, .8);
    line(ctx, [[4, 15], [18, 0], [25, -18], [29, -33]], '#8ca4df', 1.25);
    line(ctx, [[13, 18], [22, 7], [28, -3]], '#647fc5', 1);
    ctx.restore();
  }

  function drawHair(ctx, hairSway, pose) {
    // Back mass, then a set of separately delayed, cyan-tipped curls. The
    // layered curls preserve the source's blue-to-cyan long-hair silhouette.
    poly(ctx, [[-21, -55], [-34, -38], [-35, -13], [-39, 8], [-33, 25], [-22, 29], [-13, 18], [-7, 30], [3, 22], [12, 31], [24, 22], [35, 23], [40, 5], [34, -23], [20, -55]], C.hairDark, C.ink, 2);
    const curls = [
      { x: -25, y: -21, side: -1, r: 9, len: 31 }, { x: -18, y: -16, side: -1, r: 9, len: 39 },
      { x: 25, y: -21, side: 1, r: 9, len: 31 }, { x: 18, y: -16, side: 1, r: 9, len: 39 },
    ];
    curls.forEach((lock, i) => {
      const sw = hairSway * lock.side * (1 + (i % 2) * .3);
      const ex = lock.x + sw * 1.7;
      const ey = lock.y + lock.len;
      oval(ctx, lock.x, lock.y + 8, lock.r, 18, C.hair, C.ink, 1.3);
      oval(ctx, ex, ey - 9, lock.r + 1, 18, C.hair, C.ink, 1.3);
      oval(ctx, ex + lock.side * 1.5, ey + 3, lock.r - 1, 9, C.hairHi, null);
      line(ctx, [[lock.x - lock.side * 3, lock.y - 1], [lock.x + sw, lock.y + 16], [ex, ey]], C.hairLite, 1.15);
    });
    // Long central strands and a thin cyan rim prevent the body becoming a
    // single dark silhouette in the midnight-blue scenes.
    line(ctx, [[-9, -20], [-15 + hairSway * -.3, 8], [-12 + hairSway * -.7, 24]], C.hairHi, 2.2);
    line(ctx, [[9, -20], [15 + hairSway * .3, 8], [12 + hairSway * .7, 24]], C.hairHi, 2.2);
    // Ear fins and the distinctive cyan bow, both called out in the source.
    poly(ctx, [[-20, -42], [-35, -48], [-34, -37], [-22, -32]], C.navy2, C.ink, 1.4);
    poly(ctx, [[20, -42], [35, -48], [34, -37], [22, -32]], C.navy2, C.ink, 1.4);
    rect(ctx, -31, -42, 9, 2, C.white); rect(ctx, 22, -42, 9, 2, C.white);
    poly(ctx, [[22, -42], [32, -49], [33, -38], [25, -34]], C.bow, C.ink, .8);
    oval(ctx, 25, -40, 2.4, 2.4, C.hairLite, C.ink, .5);
  }

  function drawFace(ctx, t, emotion, pose) {
    oval(ctx, 0, -43, 23.5, 21.5, C.skin, C.ink, 1.5);
    // Forelock and side bangs deliberately overlap the top of the face.
    poly(ctx, [[-20, -50], [-13, -65], [-6, -64], [-2, -48], [2, -64], [11, -64], [19, -50], [11, -54], [4, -47], [0, -56], [-6, -47], [-13, -54]], C.hair, C.ink, 1.25);
    line(ctx, [[-13, -57], [-8, -49], [-5, -43]], C.hairHi, 1);
    line(ctx, [[11, -58], [7, -49], [4, -42]], C.hairHi, 1);

    const lookX = emotion.eyes === 'look' ? Math.sin(t * 2.2) * .9 : 0;
    const lookY = emotion.eyes === 'look' ? -.35 : 0;
    drawEye(ctx, -8.2, -43, -1, t, emotion, lookX, lookY);
    drawEye(ctx, 8.2, -43, 1, t, emotion, lookX, lookY);

    const browY = -53 + emotion.brow * .55;
    const browTilt = emotion.brow * 1.2;
    line(ctx, [[-13, browY + browTilt], [-5, browY - browTilt]], C.ink, 1.25);
    line(ctx, [[5, browY - browTilt], [13, browY + browTilt]], C.ink, 1.25);

    const blush = emotion.blush;
    if (blush) {
      ctx.save(); ctx.globalAlpha = blush;
      oval(ctx, -16, -32, 4.4, 2.1, '#f4a5ac'); oval(ctx, 16, -32, 4.4, 2.1, '#f4a5ac');
      line(ctx, [[-18, -33], [-14, -31]], '#ffffff', .7); line(ctx, [[14, -31], [18, -33]], '#ffffff', .7);
      ctx.restore();
    }
    if (emotion.mouth === 'o') oval(ctx, 0, -28, 3.2, 4.0, '#b75b73', C.ink, 1);
    else if (emotion.mouth === 'frown') line(ctx, [[-4, -26], [0, -29], [4, -26]], C.ink, 1.2);
    else if (emotion.mouth === 'flat') line(ctx, [[-4, -27], [4, -27]], C.ink, 1.2);
    else if (emotion.mouth === 'tiny') line(ctx, [[-2, -27], [1, -26], [3, -27]], C.ink, 1);
    else line(ctx, [[-4, -27], [0, -25.5], [4, -27]], C.ink, 1.25);

    if (pose === 'hands') {
      // Surprise has its own mouth and a higher red flush, like the reference.
      oval(ctx, 0, -27, 3.7, 4.6, '#bd6379', C.ink, 1.1);
    }
  }

  function drawDress(ctx, pose, breathing) {
    // Shoes and socks sit behind the skirt, allowing each pose to change legs.
    const legY = pose === 'laptop' ? 21 : 29;
    const legXs = pose === 'laptop' ? [-13, 6] : [-10, 10];
    legXs.forEach((x, i) => {
      rect(ctx, x - 4, legY - 4, 8, 10, C.white, C.ink, .8);
      for (let r = 0; r < 2; r += 1) rect(ctx, x - 4, legY + r * 3, 8, 1, C.cream);
      oval(ctx, x + (i ? 1 : -1), legY + 7, 7.5, 4.8, C.navy, C.ink, 1.1);
      rect(ctx, x - 2, legY + 5, 5, 1.4, C.white);
    });
    poly(ctx, [[-14, -15], [14, -15], [21, 17 + breathing], [14, 29], [-14, 29], [-21, 17 + breathing]], C.navy, C.ink, 1.65);
    poly(ctx, [[-19, 13], [-12, 23], [0, 26], [12, 23], [19, 13], [14, 28], [-14, 28]], C.navy2, C.ink, 1.05);
    // Lace hem: retained as chunky individual ruffles at pixel scale.
    for (let i = -4; i <= 4; i += 1) oval(ctx, i * 4.0, 27, 3, 2.5, C.white, C.ink, .55);
    // Bodice, collar, bow and exact whale-mark apron.
    rect(ctx, -11, -17, 22, 14, C.navy2, C.ink, 1.1);
    poly(ctx, [[-8, -17], [0, -9], [8, -17], [5, -2], [-5, -2]], C.white, C.ink, .75);
    poly(ctx, [[-7, -14], [0, -10], [7, -14], [0, -6]], C.navy, C.ink, .7);
    oval(ctx, 0, -11, 2.2, 2.2, C.hairLite, C.ink, .55);
    poly(ctx, [[-10, -1], [10, -1], [13, 20], [-13, 20]], C.white, C.ink, 1.15);
    oval(ctx, 0, 12, 4.4, 2.0, C.whale);
    oval(ctx, 4, 10.8, 1.8, 1.45, C.whale);
    poly(ctx, [[-4, 12], [-8, 9], [-8, 14]], C.whale);
    // gold side bows on the skirt
    for (const sx of [-15, 15]) {
      poly(ctx, [[sx, 14], [sx + (sx < 0 ? -6 : 6), 10], [sx + (sx < 0 ? -6 : 6), 18]], C.gold, C.ink, .55);
      oval(ctx, sx, 14, 1.7, 1.7, C.white);
    }
  }

  function drawArm(ctx, side, pose, t, breathing) {
    const s = side;
    let elbow = [s * 22, -3], hand = [s * 27, 9];
    if (pose === 'hands') { elbow = [s * 18, -10]; hand = [s * 17, -28]; }
    if (pose === 'laptop') { elbow = [s * 13, 2]; hand = [s * 10, 8]; }
    if (pose === 'sing') { elbow = [s * 22, -7]; hand = [s * 31, -16 + Math.sin(t * 5 + s) * 2]; }
    line(ctx, [[s * 12, -8], elbow, hand], C.navy, 7);
    line(ctx, [[s * 12, -8], elbow, hand], C.navy3, 2);
    oval(ctx, hand[0], hand[1], pose === 'hands' ? 4.5 : 3.6, pose === 'hands' ? 4.7 : 3.5, C.skin, C.ink, .7);
    // two tiny fingers make hands look deliberate at the 320×180 stage.
    line(ctx, [[hand[0] - s * 2, hand[1] + 1], [hand[0] - s * 4, hand[1] + 3]], C.shade, .65);
    line(ctx, [[hand[0] + s * 1, hand[1] + 2], [hand[0] + s * 3, hand[1] + 4]], C.shade, .65);
  }

  function drawLaptop(ctx) {
    // A real articulated prop, rather than a raster pose: the lid has a screen,
    // keyboard rows and a moving cursor reflected by the heroine's eye-line.
    ctx.save(); ctx.translate(-26, 6); ctx.rotate(-.08);
    poly(ctx, [[-15, -22], [27, -22], [21, 5], [-21, 5]], C.white, C.ink, 1.4);
    rect(ctx, -11, -18, 34, 18, '#d8edf2', C.navy2, .8);
    rect(ctx, -8, -15, 28, 12, '#679ed2');
    rect(ctx, 12, -10, 5, 2, C.hairLite);
    poly(ctx, [[-21, 5], [21, 5], [29, 11], [-28, 11]], '#e6edf0', C.ink, 1.1);
    for (let row = 0; row < 2; row += 1) for (let k = 0; k < 5; k += 1) rect(ctx, -14 + k * 6, 6 + row * 2, 4, 1, C.navy3);
    ctx.restore();
  }

  function drawEmotionMark(ctx, t, emotion, pose, accent) {
    const p = 1 + pulse(t) * .2;
    const x = 28, y = -67;
    ctx.save(); ctx.globalAlpha = .75;
    if (emotion.eyes === 'wide') {
      rect(ctx, x - 2, y - 12 * p, 4, 11 * p, accent); oval(ctx, x, y + 4, 2.2, 2.2, accent);
    } else if (emotion.eyes === 'look') {
      for (const r of [5, 10, 15]) { ctx.beginPath(); ctx.arc(x, y, r * p, 0, Math.PI * 2); ctx.strokeStyle = accent; ctx.lineWidth = 1; ctx.stroke(); }
    } else if (emotion.eyes === 'shine') {
      line(ctx, [[x - 7 * p, y], [x + 7 * p, y]], accent, 1.4); line(ctx, [[x, y - 7 * p], [x, y + 7 * p]], accent, 1.4);
    } else if (emotion.mouth === 'frown') {
      for (let i = 0; i < 3; i += 1) oval(ctx, x + i * 4, y + i * 2, 1.5, 1.5, accent);
    }
    ctx.restore();
  }

  function draw(ctx, x, y, scale, t, palette = {}, options = {}) {
    const pose = resolvePose(options);
    const emotion = resolveEmotion(options);
    const hit = pulse(t);
    const dance = options.dance ? 1 : 0;
    const bob = Math.sin(t * 3.2 + dance) * (1.1 + dance * 1.6) - hit * (1.7 + dance * 1.4);
    const breathing = Math.sin(t * 2.05) * .6 + hit * .8;
    const hairSway = Math.sin(t * 2.3 + .4) * (2.2 + dance) + hit * 1.5;
    const tailSway = Math.sin(t * 2.05 + .8) * (2.4 + dance * 1.5) + hit * 1.2;
    const turn = options.turn || 0;
    const accent = palette.light || '#86f1ef';

    ctx.save();
    ctx.translate(q(x), q(y + bob));
    ctx.rotate((options.rot || 0) + Math.sin(t * 1.1) * .01);
    const sx = scale * (1 - Math.abs(turn) * .18) * (emotion.eyes === 'wide' ? .98 : 1);
    const sy = scale * (1 + hit * .025);
    ctx.scale(sx, sy);
    ctx.imageSmoothingEnabled = false;

    // Shadow and tail are behind the performer. Body/face/arms then overlap in
    // a fixed model-sheet order, which makes the same character read in every frame.
    ctx.save(); ctx.globalAlpha = .22; oval(ctx, 0, 40, pose === 'laptop' ? 36 : 29, 5, C.ink); ctx.restore();
    drawTail(ctx, tailSway, pose);
    drawHair(ctx, hairSway, pose);
    drawHeadwear(ctx, tailSway);
    drawFace(ctx, t, emotion, pose);
    drawDress(ctx, pose, breathing);
    drawArm(ctx, -1, pose, t, breathing);
    drawArm(ctx, 1, pose, t, breathing);
    if (pose === 'laptop') drawLaptop(ctx);
    drawEmotionMark(ctx, t, emotion, pose, accent);
    ctx.restore();
  }

  const api = Object.freeze({ draw, resolvePose, resolveEmotion, model: Object.freeze({ source: '42868804351-1-192.mp4', parts: ['hair', 'headwear', 'eyeL', 'eyeR', 'brows', 'mouth', 'tail', 'dress', 'apron', 'arms', 'laptop'] }) });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.WHALE_PIXEL_RIG = api;
}(typeof window !== 'undefined' ? window : globalThis));
