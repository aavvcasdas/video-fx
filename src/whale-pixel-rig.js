/*
 * WHALE PIXEL RIG — source-observed, hand-drawn JavaScript character module.
 *
 * No source image, sprite sheet, encoded raster or drawImage character asset is
 * used here. Every visible feature is built with Canvas paths and pixel cells:
 * the curved ahoge, ruffled headband, fin ears, bows, blue-to-cyan hair locks,
 * independent eyes/lids/pupils, cheek/mouth states, maid dress, whale apron,
 * sleeve/hand poses, socks/shoes, laptop and full whale tail.
 *
 * The model is deliberately split into stable silhouette parts and transient
 * acting parts, following ClaudeAnimationBase's view/emotion/turn discipline.
 */
(function installWhalePixelRig(root) {
  'use strict';

  const C = Object.freeze({
    ink: '#111938', outline: '#17214a', navy: '#20275b', navy2: '#2e3a78', navy3: '#40538f',
    hairDeep: '#253b82', hair: '#3e66ad', hairMid: '#527fc4', hairLight: '#7acbe2', cyan: '#8ce9ea',
    skin: '#ffdecf', shade: '#eab1b5', blush: '#ef94a8', white: '#fff7ef', cream: '#f2e6e1',
    iris: '#2766ae', irisDeep: '#193a80', irisLight: '#9eeafe', gold: '#cba66a', goldHi: '#f4d77c',
    tail: '#344a8a', tailHi: '#607dc2', tailShade: '#26356f', bow: '#62bce2', jewel: '#5ed6e8',
  });

  function clamp(v, lo = 0, hi = 1) { return Math.max(lo, Math.min(hi, v)); }
  function ease(v) { const p = clamp(v); return p * p * (3 - 2 * p); }
  function beat(t) { const phase = (t * 117 / 60) % 1; return Math.pow(1 - phase, 4); }
  function mod(v, n) { return ((v % n) + n) % n; }
  function rr(ctx, x, y, w, h, r, fill, stroke = C.outline, lw = 1) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke && lw) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  }
  function ell(ctx, x, y, rx, ry, fill, stroke = C.outline, lw = 1) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke && lw) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  }
  function line(ctx, points, colour, width = 1) {
    ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
    ctx.strokeStyle = colour; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
  }
  function path(ctx, commands, fill, stroke = C.outline, lw = 1) {
    ctx.beginPath();
    commands.forEach((command) => {
      if (command[0] === 'M') ctx.moveTo(command[1], command[2]);
      else if (command[0] === 'L') ctx.lineTo(command[1], command[2]);
      else if (command[0] === 'C') ctx.bezierCurveTo(command[1], command[2], command[3], command[4], command[5], command[6]);
      else if (command[0] === 'Q') ctx.quadraticCurveTo(command[1], command[2], command[3], command[4]);
      else if (command[0] === 'Z') ctx.closePath();
    });
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke && lw) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
  }
  function poly(ctx, points, fill, stroke = C.outline, lw = 1) {
    path(ctx, [['M', ...points[0]], ...points.slice(1).map((p) => ['L', ...p]), ['Z']], fill, stroke, lw);
  }
  function star(ctx, x, y, r, colour) {
    poly(ctx, [[x, y - r], [x + r * .3, y - r * .3], [x + r, y], [x + r * .3, y + r * .3], [x, y + r], [x - r * .3, y + r * .3], [x - r, y], [x - r * .3, y - r * .3]], colour, null);
  }

  function poseOf(options) {
    if (options.pose === 'laptop' || options.laptop) return 'laptop';
    if (options.pose === 'hands' || options.heart || options.mood === 'surprise') return 'hands';
    return 'stand';
  }

  function drawTail(ctx, sway, seated = false) {
    if (seated) {
      // In the laptop view the same tail supports the heroine as a curled seat.
      path(ctx, [
        ['M', -35, 20], ['C', -56, 19, -64, 28, -62, 35], ['C', -48, 45, -15, 47, 16, 45],
        ['C', 46, 45, 59, 34, 58, 19], ['C', 57, 4, 43, -1, 30, 4],
        ['C', 35, -17, 45, -29, 56, -39], ['C', 64, -46, 64, -58, 58, -59],
        ['C', 51, -59, 48, -46, 43, -38], ['C', 37, -47, 26, -49, 22, -43],
        ['C', 12, -31, 11, -14, 5, 0], ['C', -7, 7, -23, 12, -35, 20], ['Z'],
      ], C.tail, C.outline, 2);
      path(ctx, [['M', -51, 31], ['C', -22, 40, 26, 42, 49, 28], ['C', 39, 39, 6, 41, -29, 34]], C.tailHi, null);
      line(ctx, [[-37, 31], [-2, 38], [34, 33], [49, 21]], '#9ab4e9', 1.4);
      return;
    }
    ctx.save(); ctx.translate(8, 7); ctx.rotate(sway * .025);
    path(ctx, [
      ['M', 15, 25], ['C', 23, 10, 32, -6, 36, -28], ['C', 40, -53, 36, -71, 42, -84],
      ['C', 46, -93, 52, -91, 55, -80], ['C', 59, -69, 66, -74, 73, -82],
      ['C', 80, -89, 89, -90, 91, -84], ['C', 94, -76, 83, -62, 72, -58],
      ['C', 61, -54, 53, -42, 49, -24], ['C', 44, -1, 36, 17, 26, 31], ['Z'],
    ], C.tail, C.outline, 2.1);
    path(ctx, [['M', 39, -72], ['C', 47, -76, 51, -77, 54, -69], ['C', 57, -59, 55, -47, 51, -37], ['C', 46, -50, 41, -62, 39, -72]], C.tailHi, null);
    path(ctx, [['M', 62, -71], ['C', 73, -84, 83, -86, 89, -82], ['C', 86, -72, 77, -64, 68, -61]], '#5268aa', null);
    line(ctx, [[26, 23], [36, 3], [43, -20], [47, -39]], '#90a8e0', 1.4);
    line(ctx, [[32, 22], [42, 3], [48, -17]], '#5069ad', 1);
    ctx.restore();
  }

  function drawHairBack(ctx, sway, seated = false) {
    const lift = seated ? 5 : 0;
    // Broad source-matched blue mass, then six long curled locks with cyan tips.
    path(ctx, [
      ['M', -24, -64 + lift], ['C', -48, -53 + lift, -54, -25 + lift, -51, 0 + lift],
      ['C', -59, 15 + lift, -55, 31 + lift, -43, 37 + lift], ['C', -35, 43 + lift, -28, 37 + lift, -24, 28 + lift],
      ['C', -18, 43 + lift, -4, 46 + lift, 3, 30 + lift], ['C', 11, 45 + lift, 26, 43 + lift, 30, 27 + lift],
      ['C', 39, 39 + lift, 52, 31 + lift, 51, 16 + lift], ['C', 58, -10 + lift, 47, -48 + lift, 24, -64 + lift], ['Z'],
    ], C.hairDeep, C.outline, 2);
    const locks = [
      { side: -1, x: -31, y: -36 + lift, length: 64 }, { side: -1, x: -19, y: -34 + lift, length: 70 },
      { side: 1, x: 31, y: -36 + lift, length: 64 }, { side: 1, x: 19, y: -34 + lift, length: 70 },
      { side: -1, x: -43, y: -24 + lift, length: 51 }, { side: 1, x: 43, y: -24 + lift, length: 51 },
    ];
    locks.forEach((lock, index) => {
      const dx = sway * lock.side * (1 + (index % 3) * .22);
      const endX = lock.x + dx * 1.4;
      const endY = lock.y + lock.length;
      path(ctx, [
        ['M', lock.x - 7, lock.y], ['C', lock.x - 13 + dx, lock.y + 17, lock.x - 11 + dx, endY - 12, endX - 4, endY],
        ['C', endX + 5, endY + 7, endX + 11, endY - 2, endX + 8, endY - 12],
        ['C', lock.x + 11 + dx, lock.y + 20, lock.x + 9, lock.y + 7, lock.x + 7, lock.y], ['Z'],
      ], index % 2 ? C.hair : C.hairMid, C.outline, 1.1);
      path(ctx, [['M', endX - 4, endY - 10], ['C', endX + 2, endY - 4, endX + 7, endY - 7, endX + 8, endY - 12], ['C', endX + 7, endY - 2, endX + 1, endY + 5, endX - 4, endY]], C.hairLight, null);
      line(ctx, [[lock.x + lock.side * 2, lock.y + 5], [lock.x + dx * .6, lock.y + 25], [endX + lock.side * 2, endY - 16]], '#8acfed', 1);
    });
  }

  function drawHeadwear(ctx) {
    // Source's white ruffle: individual puffs, not a generic strip.
    for (let i = -5; i <= 5; i += 1) {
      const x = i * 5;
      const y = -72 - (1 - Math.abs(i) / 6) * 4;
      ell(ctx, x, y, 4.1, 6.3, C.white, C.outline, .8);
      if (i !== 0) line(ctx, [[x - 1, y - 3], [x + 1, y + 2]], C.cream, .7);
    }
    line(ctx, [[-28, -66], [-15, -73], [0, -76], [15, -73], [28, -66]], '#d1d8ea', 1);
    // Ahoge has a dark outline and a blue inner, both independent of the cap.
    path(ctx, [['M', -1, -76], ['C', -10, -88, 2, -98, 13, -91], ['C', 19, -87, 17, -78, 9, -76]], null, C.outline, 3);
    path(ctx, [['M', -1, -76], ['C', -8, -87, 2, -94, 11, -89], ['C', 15, -86, 13, -79, 8, -77]], null, C.hairMid, 1.3);
  }

  function drawEarAndBow(ctx, side) {
    ctx.save(); ctx.scale(side, 1);
    path(ctx, [['M', 23, -51], ['C', 39, -62, 49, -57, 52, -49], ['C', 44, -43, 34, -39, 24, -40], ['Z']], C.navy2, C.outline, 1.6);
    path(ctx, [['M', 29, -47], ['C', 38, -53, 45, -52, 48, -49], ['C', 40, -47, 35, -45, 29, -45], ['Z']], C.white, C.outline, .8);
    poly(ctx, [[30, -55], [42, -62], [45, -50], [36, -46]], C.bow, C.outline, 1);
    ell(ctx, 35, -52, 3, 3, C.hairLight, C.outline, .6);
    ctx.restore();
  }

  function drawFace(ctx, mood, t, pose) {
    // Rounded chibi face, held above the back hair and below bangs.
    path(ctx, [
      ['M', -27, -52], ['C', -28, -34, -22, -21, 0, -19], ['C', 22, -20, 29, -34, 27, -52],
      ['C', 25, -67, 14, -75, 0, -75], ['C', -16, -75, -26, -66, -27, -52], ['Z'],
    ], C.skin, C.outline, 1.5);

    // Hair cap and source-style centre fringe.
    path(ctx, [
      ['M', -29, -54], ['C', -27, -72, -14, -83, 0, -83], ['C', 17, -83, 29, -71, 29, -52],
      ['C', 19, -58, 14, -54, 8, -46], ['C', 7, -58, 1, -63, -2, -48],
      ['C', -6, -59, -13, -60, -15, -46], ['C', -21, -53, -25, -55, -29, -54], ['Z'],
    ], C.hair, C.outline, 1.5);
    path(ctx, [['M', -22, -70], ['C', -15, -79, -5, -78, -2, -70], ['C', -5, -63, -8, -57, -14, -50], ['C', -17, -61, -20, -66, -22, -70]], C.hairMid, null);
    path(ctx, [['M', 2, -77], ['C', 13, -76, 22, -68, 23, -56], ['C', 17, -60, 12, -55, 7, -47], ['C', 7, -62, 4, -69, 2, -77]], C.hairDeep, null);
    line(ctx, [[-14, -72], [-10, -62], [-12, -55]], '#80b9e7', 1);
    line(ctx, [[10, -73], [13, -63], [11, -56]], '#74b4e3', 1);

    const blinkCycle = mod(t + (pose === 'hands' ? .42 : 0), 3.05);
    const blink = blinkCycle > 2.88 || mood === 'blink';
    const wink = mood === 'wink' || (pose === 'stand' && mood === 'neutral' && Math.sin(t * .6) > .84);
    const look = mood === 'search' ? Math.round(Math.sin(t * 4.1) * 1.2) : (mood === 'focus' ? 1 : 0);
    const eyeY = -48 + (mood === 'surprise' ? -1 : 0);
    function eye(x, closed) {
      if (closed) {
        line(ctx, [[x - 5, eyeY], [x - 2, eyeY + 2], [x + 4, eyeY]], C.outline, 1.5);
        return;
      }
      ell(ctx, x, eyeY, 6.6, 8.4, C.white, C.outline, 1.25);
      ell(ctx, x + look, eyeY + .6, 4.2, 5.7, C.iris, C.irisDeep, .8);
      ell(ctx, x + look, eyeY + 2, 2.1, 3.2, C.irisDeep, null);
      ell(ctx, x - 1 + look, eyeY - 2.2, 1.55, 2.1, '#ffffff', null);
      ell(ctx, x + 2 + look, eyeY + 3, .8, 1, C.irisLight, null);
      line(ctx, [[x - 6, eyeY - 6], [x - 2, eyeY - 8], [x + 4, eyeY - 6]], C.outline, 1.1);
    }
    eye(-11, blink); eye(11, blink || wink);
    // Cheeks, brows and variable mouth form the tiny emotion layer.
    if (mood === 'surprise' || mood === 'sad' || mood === 'wistful') {
      ell(ctx, -20, -35, 4.8, 2.1, C.blush, null); ell(ctx, 20, -35, 4.8, 2.1, C.blush, null);
    } else { ell(ctx, -20, -35, 3.2, 1.2, '#f2b1b7', null); ell(ctx, 20, -35, 3.2, 1.2, '#f2b1b7', null); }
    if (mood === 'sad' || mood === 'wistful') {
      line(ctx, [[-16, -60], [-11, -62], [-7, -60]], C.hairDeep, 1.1); line(ctx, [[7, -60], [11, -62], [16, -60]], C.hairDeep, 1.1);
      line(ctx, [[-3, -29], [0, -31], [3, -29]], '#aa6579', 1.1);
    } else if (mood === 'surprise') {
      ell(ctx, 0, -28, 3.7, 4.4, '#bd6d79', C.outline, .8);
    } else if (mood === 'smile' || mood === 'relieved' || mood === 'hopeful') {
      path(ctx, [['M', -4, -30], ['Q', 0, -27, 4, -30]], null, '#a85e76', 1.1);
    } else {
      line(ctx, [[-2, -29], [2, -29]], '#a85e76', 1);
    }
  }

  function drawBodice(ctx) {
    // Shoulder ruffles and layered navy maid bodice.
    ell(ctx, -23, -18, 9, 11, C.white, C.outline, 1); ell(ctx, 23, -18, 9, 11, C.white, C.outline, 1);
    path(ctx, [['M', -21, -26], ['C', -17, -33, 17, -33, 21, -26], ['L', 25, 4], ['L', -25, 4], ['Z']], C.navy, C.outline, 1.5);
    poly(ctx, [[-9, -28], [0, -19], [9, -28], [6, -7], [-6, -7]], C.white, C.outline, .8);
    poly(ctx, [[-11, -25], [-2, -22], [0, -16], [2, -22], [11, -25], [7, -15], [0, -12], [-7, -15]], C.navy2, C.outline, .8);
    ell(ctx, 0, -22, 3.1, 3.5, C.jewel, C.outline, .8);
    for (let y = -14; y <= -4; y += 5) ell(ctx, 0, y, 1, 1, C.ink, null);
    line(ctx, [[-18, -7], [18, -7]], C.gold, 1.2);
  }

  function drawSkirt(ctx) {
    path(ctx, [
      ['M', -24, -5], ['C', -34, 2, -40, 18, -42, 28], ['C', -25, 37, 24, 37, 42, 28],
      ['C', 39, 16, 34, 2, 24, -5], ['Z'],
    ], C.navy, C.outline, 1.7);
    path(ctx, [['M', -38, 23], ['C', -25, 31, 25, 31, 38, 23], ['L', 41, 30], ['C', 22, 40, -24, 40, -41, 30], ['Z']], C.white, C.outline, 1);
    // Individual ruffles read at low resolution more clearly than a generic band.
    for (let i = -5; i <= 5; i += 1) ell(ctx, i * 6, 31 + Math.abs(i) * .25, 4, 3.2, C.white, C.outline, .45);
    path(ctx, [['M', -22, 5], ['C', -12, 0, 12, 0, 22, 5], ['L', 20, 25], ['C', 10, 30, -10, 30, -20, 25], ['Z']], C.white, C.outline, 1.1);
    line(ctx, [[-17, 9], [-10, 24]], '#d7dae4', .7); line(ctx, [[17, 9], [10, 24]], '#d7dae4', .7);
    // The whale emblem is deliberately code drawn and matches source placement.
    ell(ctx, -1, 17, 6.6, 3.5, C.iris, null); poly(ctx, [[5, 17], [10, 13], [9, 20]], C.iris, null); ell(ctx, -3, 16, .7, .7, C.white, null);
    for (const side of [-1, 1]) {
      poly(ctx, [[side * 27, 18], [side * 34, 14], [side * 34, 23], [side * 28, 25]], C.gold, C.outline, .6);
      ell(ctx, side * 29, 21, 1.6, 1.6, C.goldHi, null);
    }
  }

  function drawLegs(ctx) {
    path(ctx, [['M', -19, 32], ['L', -15, 47], ['L', -6, 47], ['L', -7, 33], ['Z']], C.skin, C.outline, 1);
    path(ctx, [['M', 7, 33], ['L', 6, 47], ['L', 15, 47], ['L', 19, 32], ['Z']], C.skin, C.outline, 1);
    for (const side of [-1, 1]) {
      ell(ctx, side * 11, 45, 6.4, 3.2, C.white, C.outline, 1);
      line(ctx, [[side * 16, 43], [side * 11, 46], [side * 6, 43]], '#d8dbe5', .8);
      rr(ctx, side * 11 - 7, 47, 14, 7, 3, C.navy2, C.outline, 1);
      rr(ctx, side * 11 - 3, 49, 6, 2, 1, '#7185c5', null);
    }
  }

  function drawStandArms(ctx, mood) {
    for (const side of [-1, 1]) {
      ctx.save(); ctx.scale(side, 1);
      path(ctx, [['M', 22, -20], ['C', 34, -18, 34, -1, 27, 11], ['L', 20, 7], ['C', 24, -3, 22, -10, 17, -15], ['Z']], C.navy2, C.outline, 1.25);
      ell(ctx, 24, 9, 5.2, 4.4, C.skin, C.outline, 1);
      ell(ctx, 21, 5, 4.6, 3.8, C.white, C.outline, .8);
      ctx.restore();
    }
  }

  function drawHandsArms(ctx) {
    // Hands-to-cheeks pose from the supplied surprise reference.
    for (const side of [-1, 1]) {
      ctx.save(); ctx.scale(side, 1);
      path(ctx, [['M', 20, -18], ['C', 34, -19, 34, -37, 22, -42], ['L', 14, -34], ['C', 21, -28, 21, -22, 14, -18], ['Z']], C.navy2, C.outline, 1.25);
      ell(ctx, 19, -39, 5.3, 6.2, C.white, C.outline, .9);
      ell(ctx, 22, -42, 4.5, 5.4, C.skin, C.outline, .8);
      line(ctx, [[20, -45], [24, -47]], '#db9faa', .7); line(ctx, [[20, -40], [25, -40]], '#db9faa', .7);
      ctx.restore();
    }
  }

  function drawLaptop(ctx, t) {
    // White laptop is independently staged in front of the seated pose.
    const tap = Math.floor(t * 7) % 5;
    path(ctx, [['M', -46, -21], ['L', -7, -31], ['L', -3, 4], ['L', -41, 10], ['Z']], C.white, C.outline, 1.8);
    poly(ctx, [[-41, -18], [-11, -25], [-8, -1], [-38, 4]], '#b9d5e5', C.navy2, 1);
    line(ctx, [[-36, -12], [-14, -17]], '#6ba9d5', 1); line(ctx, [[-35, -7], [-16, -11]], '#8de4e8', 1);
    path(ctx, [['M', -7, 4], ['L', 21, 9], ['L', 11, 16], ['L', -41, 10], ['Z']], C.cream, C.outline, 1.2);
    for (let row = 0; row < 2; row += 1) for (let col = 0; col < 5; col += 1) rr(ctx, -23 + col * 6, 8 + row * 3, 3, 1.4, .4, '#7384a6', null);
    star(ctx, -50, -28 + Math.sin(t * 3) * 1, 4 + tap % 2, C.goldHi);
  }

  function drawSeatedBody(ctx, mood, t) {
    drawTail(ctx, Math.sin(t * 3), true);
    drawHairBack(ctx, Math.sin(t * 2.6) * 2, true);
    drawEarAndBow(ctx, -1); drawEarAndBow(ctx, 1); drawFace(ctx, mood, t, 'laptop'); drawHeadwear(ctx);
    // Compact seated skirt, legs tucked behind the laptop.
    drawBodice(ctx);
    path(ctx, [['M', -25, -2], ['C', -36, 10, -35, 25, -23, 29], ['C', -3, 35, 25, 29, 33, 16], ['C', 31, 5, 23, -1, 17, -4], ['Z']], C.navy, C.outline, 1.5);
    path(ctx, [['M', -23, 18], ['C', -7, 29, 14, 29, 27, 17], ['L', 29, 25], ['C', 10, 35, -15, 33, -30, 24], ['Z']], C.white, C.outline, .9);
    ell(ctx, 13, 20, 10, 4, C.navy2, C.outline, 1); ell(ctx, 22, 19, 7, 3.5, C.navy2, C.outline, 1);
    drawLaptop(ctx, t);
  }

  function drawStanding(ctx, pose, mood, t, options) {
    const sway = Math.sin(t * 2.7 + (options.dance ? .8 : 0)) * (options.dance ? 2.4 : 1.3);
    drawTail(ctx, sway, false);
    drawHairBack(ctx, sway, false);
    drawEarAndBow(ctx, -1); drawEarAndBow(ctx, 1); drawFace(ctx, mood, t, pose); drawHeadwear(ctx);
    drawBodice(ctx);
    if (pose === 'hands') drawHandsArms(ctx); else drawStandArms(ctx, mood);
    drawSkirt(ctx); drawLegs(ctx);
    // Beat-bound glints make the whole source-matched silhouette feel alive.
    const flash = beat(t);
    if (flash > .3) { star(ctx, -44, -58, 2 + flash * 2, C.cyan); star(ctx, 42, -17, 1 + flash * 2, C.hairLight); }
  }

  function draw(ctx, x, y, scale, t, palette, options = {}) {
    const pose = poseOf(options);
    const mood = options.mood || 'neutral';
    const hit = beat(t);
    const breathing = 1 + Math.sin(t * 2.2) * .018 - hit * .025;
    const bob = Math.sin(t * 3.3 + (options.dance ? .5 : 0)) * (options.dance ? 1.7 : .75) - hit * (options.dance ? 1.8 : .65);
    const turn = clamp(options.turn || 0);
    const rot = options.rot || 0;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(Math.round(x), Math.round(y + bob));
    ctx.rotate(rot);
    // The authored model includes the source's full high fluke and long hair;
    // fit it to the 320×180 storyboard stage without cropping the silhouette.
    const stageFit = .75;
    ctx.scale(scale * stageFit * breathing * (1 - turn * .25), scale * stageFit * breathing);
    // Ground anchor gives all source-inspired views the same feet / tail contact.
    ctx.translate(0, -15);
    if (pose === 'laptop') drawSeatedBody(ctx, mood, t); else drawStanding(ctx, pose, mood, t, options);
    ctx.restore();
  }

  const api = Object.freeze({
    version: '3.0.0-hand-drawn-js',
    model: Object.freeze({
      source: '42868804351-1-192.mp4',
      kind: 'hand-drawn Canvas parts only',
      parts: ['whale tail', 'six hair locks', 'ahoge', 'ruffled headband', 'fin ears', 'side bows', 'eye whites/irises/lids/highlights', 'brows', 'mouth/blush', 'maid bodice', 'apron whale emblem', 'ruffled skirt', 'hands/arms', 'socks/shoes', 'laptop'],
      poses: ['stand', 'hands', 'laptop'],
    }),
    draw,
    ease,
  });
  root.WHALE_PIXEL_RIG = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
