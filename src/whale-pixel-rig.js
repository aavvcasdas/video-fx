/*
 * WHALE PIXEL RIG — component-authored JavaScript character module.
 *
 * No source image, sprite sheet, encoded raster, traced pixel run or bitmap-blit
 * character asset is used here. Every visible feature is built from named Canvas
 * components: the curled ahoge, folded headband, fin ears, bows, layered hair
 * ribbons, independent eyes/lids/pupils, cheek/mouth states, maid dress, whale
 * apron, sleeves/hands, socks/shoes, laptop and full whale tail.
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
  function grad(ctx, x0, y0, x1, y1, stops) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    stops.forEach(([p, colour]) => g.addColorStop(p, colour));
    return g;
  }
  function dot(ctx, x, y, r, fill) { ell(ctx, x, y, r, r, fill, null); }
  function frill(ctx, x, y, w, h, flip = 1) {
    // A pinched fabric lobe: used for the cap, cuffs and apron instead of a
    // generic dotted trim. It is deliberately a reusable authored component.
    path(ctx, [['M', x - w, y], ['C', x - w, y - h * .7, x - w * .45, y - h, x, y - h],
      ['C', x + w * .45, y - h, x + w, y - h * .7, x + w, y],
      ['C', x + w * .65, y + h * .28 * flip, x - w * .65, y + h * .28 * flip, x - w, y], ['Z']], C.white, C.outline, .65);
    line(ctx, [[x, y - h * .72], [x, y + h * .03 * flip]], C.cream, .55);
  }
  function poseOf(options) {
    if (options.pose === 'laptop' || options.laptop) return 'laptop';
    if (options.pose === 'hands' || options.heart || options.mood === 'surprise') return 'hands';
    return 'stand';
  }

  function drawTail(ctx, sway, seated = false) {
    if (seated) {
      // In the laptop view the tail is a visible crescent seat: its fluke sits
      // at the near left, while the body curves behind the dress and returns at right.
      path(ctx, [
        ['M', -68, 9], ['C', -79, -4, -82, -14, -74, -20], ['C', -66, -25, -55, -15, -51, -7],
        ['C', -45, -20, -34, -24, -28, -17], ['C', -19, -8, -29, 5, -44, 12],
        ['C', -58, 18, -60, 28, -48, 36], ['C', -24, 52, 25, 55, 53, 40],
        ['C', 73, 29, 70, 7, 51, -3], ['C', 43, -7, 34, -3, 28, 6],
        ['C', 28, -16, 39, -31, 52, -42], ['C', 60, -50, 61, -61, 55, -64],
        ['C', 47, -65, 44, -50, 39, -40], ['C', 31, -49, 20, -48, 16, -39],
        ['C', 5, -19, 7, 4, -10, 14], ['C', -28, 23, -48, 20, -68, 9], ['Z'],
      ], grad(ctx, 0, -62, 0, 53, [[0, '#3c5092'], [.55, C.tail], [1, '#283970']]), C.outline, 2);
      path(ctx, [['M', -63, 11], ['C', -70, 1, -71, -9, -66, -13], ['C', -57, -17, -51, -7, -52, 2], ['C', -56, 7, -59, 10, -63, 11]], '#526bb0', C.outline, 1.05);
      path(ctx, [['M', -48, 34], ['C', -17, 47, 27, 47, 55, 31], ['C', 40, 43, 5, 47, -31, 38]], '#607dc2', null);
      path(ctx, [['M', -41, 35], ['C', -6, 43, 29, 39, 50, 25]], null, '#a1bbed', 1.3);
      return;
    }
    ctx.save(); ctx.translate(11, 7); ctx.rotate(sway * .025); ctx.scale(.86, 1);
    path(ctx, [
      ['M', 15, 25], ['C', 23, 10, 32, -6, 36, -28], ['C', 40, -53, 36, -71, 42, -84],
      ['C', 46, -93, 52, -91, 55, -80], ['C', 59, -69, 66, -74, 73, -82],
      ['C', 80, -89, 89, -90, 91, -84], ['C', 94, -76, 83, -62, 72, -58],
      ['C', 61, -54, 53, -42, 49, -24], ['C', 44, -1, 36, 17, 26, 31], ['Z'],
    ], grad(ctx, 25, 31, 68, -88, [[0, '#273873'], [.55, '#344c90'], [1, '#435ba0']]), C.outline, 2.1);
    // Hand-painted tail planes and a fine edge reflection distinguish the
    // fluke from a flat graphic while retaining independent tail motion.
    path(ctx, [['M', 39, -72], ['C', 47, -76, 51, -77, 54, -69], ['C', 57, -59, 55, -47, 51, -37], ['C', 46, -50, 41, -62, 39, -72]], grad(ctx, 40, -80, 55, -35, [[0, '#92a9df'], [1, C.tailHi]]), null);
    path(ctx, [['M', 62, -71], ['C', 73, -84, 83, -86, 89, -82], ['C', 86, -72, 77, -64, 68, -61]], '#5268aa', null);
    path(ctx, [['M', 26, 25], ['C', 38, 10, 43, -21, 48, -42], ['C', 50, -50, 50, -56, 49, -62]], null, '#9cb9ee', 1.25);
    line(ctx, [[32, 22], [42, 3], [48, -17]], '#5069ad', 1);
    for (let i = 0; i < 4; i += 1) dot(ctx, 40 + i * 3, -6 - i * 13, .75, '#a2c0f0');
    ctx.restore();
  }

  function drawSeatedFluke(ctx) {
    // The foreground fluke is a separate tail component in the laptop pose;
    // its two lobes stay readable in front of the low hair mass.
    path(ctx, [['M', -43, 8], ['C', -64, -5, -79, -3, -83, 9], ['C', -87, 20, -76, 31, -62, 30],
      ['C', -72, 40, -60, 49, -45, 43], ['C', -33, 38, -29, 25, -35, 16], ['Z']], grad(ctx, -70, 0, -43, 43, [[0, '#344a8a'], [1, '#607dc2']]), C.outline, 1.5);
    path(ctx, [['M', -75, 14], ['C', -66, 12, -56, 16, -48, 23]], null, '#91afe4', 1.05);
  }

  function drawHairBack(ctx, sway, seated = false) {
    const lift = seated ? 5 : 0;
    // Broad source-matched blue mass, then six long curled locks with cyan tips.
    path(ctx, [
      ['M', -24, -64 + lift], ['C', -48, -53 + lift, -54, -25 + lift, -51, 0 + lift],
      ['C', -59, 15 + lift, -55, 31 + lift, -43, 37 + lift], ['C', -35, 43 + lift, -28, 37 + lift, -24, 28 + lift],
      ['C', -18, 43 + lift, -4, 46 + lift, 3, 30 + lift], ['C', 11, 45 + lift, 26, 43 + lift, 30, 27 + lift],
      ['C', 39, 39 + lift, 52, 31 + lift, 51, 16 + lift], ['C', 58, -10 + lift, 47, -48 + lift, 24, -64 + lift], ['Z'],
    ], grad(ctx, 0, -67 + lift, 0, 43 + lift, [[0, '#263c82'], [.52, '#3f67ad'], [1, '#527fc4']]), C.outline, 2);
    // Three irregular overlay locks per side make the hair read as a painted
    // cascade. These are soft filled components—not repeated tube strokes.
    for (const side of [-1, 1]) {
      ctx.save(); ctx.scale(side, 1); ctx.translate(sway * side * .42, 0);
      path(ctx, [['M', 27, -57 + lift], ['C', 48, -45 + lift, 52, -18 + lift, 44, 5 + lift],
        ['C', 41, 15 + lift, 49, 24 + lift, 43, 33 + lift], ['C', 38, 41 + lift, 29, 35 + lift, 32, 25 + lift],
        ['C', 39, 2 + lift, 35, -29 + lift, 21, -50 + lift], ['Z']], grad(ctx, 25, -58 + lift, 42, 40 + lift, [[0, '#385eaa'], [.62, '#4f80c2'], [1, '#72c7dc']]), null);
      path(ctx, [['M', 14, -53 + lift], ['C', 33, -37 + lift, 31, -8 + lift, 27, 13 + lift],
        ['C', 25, 25 + lift, 34, 31 + lift, 28, 41 + lift], ['C', 23, 49 + lift, 14, 41 + lift, 17, 31 + lift],
        ['C', 21, 12 + lift, 17, -19 + lift, 5, -43 + lift], ['Z']], grad(ctx, 10, -52 + lift, 25, 44 + lift, [[0, '#304f9a'], [.65, '#4777bd'], [1, '#79d4df']]), null);
      path(ctx, [['M', 45, -38 + lift], ['C', 57, -20 + lift, 54, 4 + lift, 48, 21 + lift],
        ['C', 45, 30 + lift, 48, 35 + lift, 43, 39 + lift], ['C', 39, 41 + lift, 37, 32 + lift, 40, 23 + lift],
        ['C', 47, 1 + lift, 42, -21 + lift, 34, -42 + lift], ['Z']], '#416fae', null);
      // Narrow reflected lines terminate before the hair tips, as in painted hair.
      path(ctx, [['M', 28, -51 + lift], ['C', 42, -35 + lift, 43, -8 + lift, 37, 12 + lift]], null, '#9cdded', 1.25);
      path(ctx, [['M', 15, -46 + lift], ['C', 25, -25 + lift, 23, 2 + lift, 22, 17 + lift]], null, '#8bd4e8', 1.08);
      path(ctx, [['M', 46, -30 + lift], ['C', 52, -12 + lift, 49, 8 + lift, 46, 16 + lift]], null, '#80c6e5', .9);
      ctx.restore();
    }
  }

  function drawHeadwear(ctx) {
    // The maid band is an arc of folded fabric, not a chain of circles.
    path(ctx, [['M', -31, -65], ['C', -26, -81, -13, -87, 0, -88], ['C', 14, -87, 27, -80, 31, -65],
      ['L', 27, -62], ['C', 21, -74, 11, -79, 0, -80], ['C', -11, -79, -21, -74, -27, -62], ['Z']], C.cream, C.outline, 1.15);
    for (let i = -6; i <= 6; i += 1) {
      const q = Math.abs(i) / 7; const x = i * 4.65; const y = -69 - (1 - q * q) * 10.5;
      frill(ctx, x, y, 3.25, 5.6 - q * .8, 1);
    }
    line(ctx, [[-28, -65], [-16, -76], [0, -80], [16, -76], [28, -65]], '#cfd8ec', .85);
    // A high, curled ahoge is a separate silhouette layer above the frill arc.
    path(ctx, [['M', -2, -82], ['C', -9, -92, -9, -100, -1, -102], ['C', 8, -103, 13, -96, 7, -88]], null, C.outline, 2.55);
    path(ctx, [['M', -2, -82], ['C', -7, -92, -7, -98, -1, -99], ['C', 6, -100, 9, -95, 5, -89]], null, C.hairMid, 1.22);
    path(ctx, [['M', -4, -84], ['C', -6, -91, -4, -96, 1, -97]], null, '#9ddbf1', .58);
  }

  function drawEarAndBow(ctx, side) {
    ctx.save(); ctx.scale(side, 1);
    // Whale fin ear, its white inner ruffle and a cyan four-lobed ribbon are
    // independent components so the bow can bounce during an acted beat.
    path(ctx, [['M', 22, -54], ['C', 32, -66, 45, -65, 54, -55], ['C', 58, -50, 55, -45, 48, -42], ['C', 39, -37, 30, -38, 22, -41], ['Z']], grad(ctx, 27, -62, 49, -40, [[0, C.navy3], [1, C.navy]]), C.outline, 1.65);
    path(ctx, [['M', 27, -45], ['C', 36, -55, 46, -56, 51, -52], ['C', 44, -48, 36, -45, 28, -43], ['Z']], C.white, C.outline, .8);
    for (let i = 0; i < 3; i += 1) frill(ctx, 33 + i * 5, -45 - i * .7, 2.1, 2.4, -1);
    path(ctx, [['M', 38, -57], ['C', 43, -64, 52, -61, 52, -54], ['C', 49, -49, 43, -49, 38, -53], ['Z']], '#62bce2', C.outline, .8);
    path(ctx, [['M', 39, -52], ['C', 46, -47, 53, -46, 53, -52], ['C', 49, -56, 44, -56, 39, -55], ['Z']], C.bow, C.outline, .8);
    ell(ctx, 42, -53, 3.1, 3.3, '#91e4ef', C.outline, .55);
    dot(ctx, 41, -54, .75, '#e7ffff');
    ctx.restore();
  }

  function drawFace(ctx, mood, t, pose) {
    // Rounded chibi face, held above the back hair and below bangs.
    path(ctx, [
      ['M', -29, -54], ['C', -30, -36, -24, -20, 0, -18], ['C', 24, -20, 30, -36, 29, -54],
      ['C', 27, -70, 15, -79, 0, -79], ['C', -17, -79, -28, -69, -29, -54], ['Z'],
    ], grad(ctx, 0, -80, 0, -18, [[0, '#ffe9dd'], [1, C.skin]]), C.outline, 1.45);
    // Soft facial planes prevent a flat skin fill while keeping the eyes,
    // mouth and blush as independently animatable components.
    path(ctx, [['M', -27, -43], ['C', -24, -29, -14, -21, 0, -20], ['C', 13, -21, 22, -28, 26, -40],
      ['C', 17, -33, -16, -33, -27, -43], ['Z']], 'rgba(234,177,181,.22)', null);
    ell(ctx, -22, -38, 5.8, 4.2, 'rgba(255,244,230,.28)', null);
    ell(ctx, 22, -38, 5.8, 4.2, 'rgba(231,157,173,.14)', null);

    // Layered cap and four tapered bangs keep the huge head soft and round,
    // rather than reducing it to a single flat helmet.
    path(ctx, [
      ['M', -31, -54], ['C', -29, -75, -16, -86, 0, -86], ['C', 18, -86, 30, -73, 31, -53],
      ['C', 23, -61, 17, -60, 10, -48], ['C', 8, -62, 3, -68, -2, -48],
      ['C', -7, -62, -14, -63, -17, -47], ['C', -23, -55, -27, -56, -31, -54], ['Z'],
    ], grad(ctx, 0, -86, 0, -47, [[0, '#4269ad'], [.62, '#365da5'], [1, '#274487']]), C.outline, 1.5);
    const bangs = [
      [['M', -23, -73], ['C', -16, -83, -6, -82, -4, -72], ['C', -4, -63, -9, -54, -16, -48], ['C', -18, -60, -21, -67, -23, -73]],
      [['M', -7, -83], ['C', 1, -87, 10, -79, 9, -69], ['C', 6, -58, 1, -51, -2, -47], ['C', -2, -63, -5, -72, -7, -83]],
      [['M', 8, -79], ['C', 19, -77, 25, -67, 24, -55], ['C', 17, -60, 12, -55, 7, -47], ['C', 8, -63, 7, -71, 8, -79]],
    ];
    bangs.forEach((commands, index) => path(ctx, commands, index === 1 ? C.hairDeep : C.hairMid, null));
    path(ctx, [['M', -20, -72], ['C', -17, -79, -8, -80, -5, -74]], null, '#91c7ea', 1.15);
    path(ctx, [['M', 3, -80], ['C', 9, -78, 14, -74, 16, -68]], null, '#80bbe8', 1.1);
    // Face-framing locks overlap the cheek at different depths and pick up a
    // small cyan tip, echoing the long curls without copying a raster contour.
    for (const side of [-1, 1]) {
      ctx.save(); ctx.scale(side, 1);
      path(ctx, [['M', 25, -59], ['C', 35, -52, 32, -37, 27, -28], ['C', 24, -22, 27, -17, 31, -19], ['C', 36, -22, 35, -32, 34, -40], ['C', 34, -52, 31, -60, 25, -64], ['Z']], grad(ctx, 25, -62, 31, -18, [[0, C.hair], [.7, C.hairMid], [1, C.hairLight]]), C.outline, 1.0);
      path(ctx, [['M', 31, -31], ['C', 28, -24, 29, -20, 32, -20]], null, '#b1f2ef', 1.1);
      ctx.restore();
    }

    const blinkCycle = mod(t + (pose === 'hands' ? .42 : 0), 3.05);
    const blink = blinkCycle > 2.88 || mood === 'blink';
    const wink = mood === 'wink' || (pose === 'stand' && mood !== 'sad' && mood !== 'surprise' && Math.sin(t * .78) > .79);
    const look = mood === 'search' ? Math.round(Math.sin(t * 4.1) * 1.2) : (mood === 'focus' ? 1 : 0);
    const eyeY = -48 + (mood === 'surprise' ? -1 : 0);
    function eye(x, closed) {
      if (closed) {
        line(ctx, [[x - 5, eyeY], [x - 2, eyeY + 2], [x + 4, eyeY]], C.outline, 1.5);
        return;
      }
      ell(ctx, x, eyeY, 7.2, 8.9, '#fffaf7', C.outline, 1.25);
      ell(ctx, x + look, eyeY + .5, 4.8, 6.3, grad(ctx, x, eyeY - 5, x, eyeY + 7, [[0, '#6ed9ee'], [.5, C.iris], [1, C.irisDeep]]), C.irisDeep, .65);
      ell(ctx, x + look, eyeY + 2.5, 2.35, 3.25, '#1b397c', null);
      ell(ctx, x - 1.5 + look, eyeY - 2.6, 1.8, 2.25, '#ffffff', null);
      ell(ctx, x + 2.1 + look, eyeY + 3.7, 1.1, 1.25, C.irisLight, null);
      dot(ctx, x - 4.7, eyeY + 4.2, .75, '#c5f7ff');
      path(ctx, [['M', x - 6.6, eyeY - 5.7], ['Q', x - 1.5, eyeY - 9, x + 5.9, eyeY - 5.6]], null, '#162046', 1.5);
      line(ctx, [[x - 6.1, eyeY - 4], [x - 7.8, eyeY - 5.7]], '#162046', .8);
    }
    eye(-11, blink); eye(11, blink || wink);
    // Cheeks, brows and variable mouth form the tiny emotion layer.
    if (mood === 'surprise' || mood === 'sad' || mood === 'wistful') {
      ell(ctx, -20, -35, 5.3, 2.7, C.blush, null); ell(ctx, 20, -35, 5.3, 2.7, C.blush, null);
    } else { ell(ctx, -20, -35, 3.8, 1.55, '#f2a5af', null); ell(ctx, 20, -35, 3.8, 1.55, '#f2a5af', null); }
    for (const side of [-1, 1]) {
      line(ctx, [[side * 17, -36], [side * 22, -33]], '#f7bcc1', .6);
      line(ctx, [[side * 19, -38], [side * 24, -35]], '#f7bcc1', .5);
    }
    if (mood === 'sad' || mood === 'wistful') {
      line(ctx, [[-16, -60], [-11, -62], [-7, -60]], C.hairDeep, 1.1); line(ctx, [[7, -60], [11, -62], [16, -60]], C.hairDeep, 1.1);
      line(ctx, [[-3, -29], [0, -31], [3, -29]], '#aa6579', 1.1);
    } else if (mood === 'surprise') {
      ell(ctx, 0, -29, 4.8, 5.25, '#b95f72', C.outline, .75);
      ell(ctx, 0, -27.8, 2.5, 2.2, '#ffb6b9', null);
    } else if (mood === 'smile' || mood === 'relieved' || mood === 'hopeful') {
      path(ctx, [['M', -4, -30], ['Q', 0, -27, 4, -30]], null, '#a85e76', 1.1);
    } else {
      line(ctx, [[-2, -29], [2, -29]], '#a85e76', 1);
    }
  }

  function drawBodice(ctx) {
    // Hold the neckline below the mouth: the source has a clear chin-to-collar
    // gap, which also leaves room for the animated lip shape to read.
    ctx.save(); ctx.translate(0, 7);
    // Shoulder ruffles and a fitted navy bodice with visible bib, buttons and bow.
    for (const side of [-1, 1]) { frill(ctx, side * 23, -20, 5.5, 6, 1); frill(ctx, side * 20, -14, 4.8, 5, 1); }
    path(ctx, [['M', -22, -27], ['C', -16, -35, 16, -35, 22, -27], ['L', 27, 5], ['L', -27, 5], ['Z']], grad(ctx, 0, -34, 0, 6, [[0, '#303b7d'], [1, '#1b2457']]), C.outline, 1.5);
    path(ctx, [['M', -9, -29], ['C', -5, -25, 5, -25, 9, -29], ['L', 7, -5], ['L', -7, -5], ['Z']], C.white, C.outline, .75);
    poly(ctx, [[-13, -26], [-3, -24], [0, -18], [3, -24], [13, -26], [8, -16], [0, -13], [-8, -16]], '#27346e', C.outline, .8);
    ell(ctx, 0, -22, 3.4, 3.8, grad(ctx, 0, -26, 0, -18, [[0, '#d8ffff'], [1, C.jewel]]), C.outline, .75);
    dot(ctx, -1.1, -23.1, .8, '#ffffff');
    for (let y = -13; y <= -4; y += 4.7) { dot(ctx, 0, y, 1.05, '#152153'); dot(ctx, .2, y - .25, .35, '#f4dfa5'); }
    line(ctx, [[-20, -5], [20, -5]], C.gold, 1.2);
    line(ctx, [[-18, -7], [18, -7]], '#9a7f62', .45);
    ctx.restore();
  }

  function drawSkirt(ctx) {
    path(ctx, [
      ['M', -25, -6], ['C', -37, 2, -44, 17, -44, 29], ['C', -27, 39, 27, 39, 44, 29],
      ['C', 43, 17, 36, 2, 25, -6], ['Z'],
    ], grad(ctx, 0, -5, 0, 37, [[0, '#26316a'], [1, '#18204c']]), C.outline, 1.7);
    // Fine skirt folds and stitch flecks; each is independent of the apron panel.
    for (let i = -3; i <= 3; i += 1) path(ctx, [['M', i * 7, 0], ['C', i * 9, 10, i * 10, 21, i * 11, 30]], null, i % 2 ? '#435790' : '#31427e', .7);
    for (let i = -4; i <= 4; i += 1) { dot(ctx, i * 7.2, 23 + Math.abs(i) * .65, .65, '#c3a968'); dot(ctx, i * 7.2 + 1.3, 25 + Math.abs(i) * .65, .45, '#dcd59f'); }
    path(ctx, [['M', -40, 24], ['C', -24, 33, 24, 33, 40, 24], ['L', 43, 31], ['C', 24, 42, -24, 42, -43, 31], ['Z']], C.white, C.outline, .85);
    for (let i = -7; i <= 7; i += 1) frill(ctx, i * 5.15, 32 + Math.abs(i) * .13, 3.1, 3.3, 1);
    // Curved apron + side ruffles, preserving the visible whale badge target.
    path(ctx, [['M', -20, 3], ['C', -13, 0, 13, 0, 20, 3], ['L', 22, 21], ['C', 16, 29, -16, 29, -22, 21], ['Z']], grad(ctx, 0, 1, 0, 30, [[0, '#fffdf9'], [1, '#eeeef0']]), C.outline, 1.05);
    for (const side of [-1, 1]) { frill(ctx, side * 22, 8, 2.8, 3.5, 1); frill(ctx, side * 22.5, 15, 2.6, 3.5, 1); }
    line(ctx, [[-16, 8], [-10, 24]], '#d7dae4', .7); line(ctx, [[16, 8], [10, 24]], '#d7dae4', .7);
    ell(ctx, -1, 17, 6.8, 3.55, '#3674c0', null); poly(ctx, [[5, 17], [10, 13], [9, 20]], '#3674c0', null); ell(ctx, -3, 16, .8, .8, C.white, null);
    for (const side of [-1, 1]) {
      // Twin gold loops and a knot—recognisably the dress bows, not squares.
      ctx.save(); ctx.scale(side, 1);
      path(ctx, [['M', 26, 20], ['C', 30, 13, 36, 14, 36, 19], ['C', 35, 23, 30, 23, 27, 21], ['Z']], '#b38a52', C.outline, .55);
      path(ctx, [['M', 27, 20], ['C', 31, 22, 35, 26, 31, 28], ['C', 27, 28, 25, 24, 26, 20], ['Z']], '#b38a52', C.outline, .55);
      ell(ctx, 27, 20.5, 2.0, 2.0, C.goldHi, C.outline, .42);
      line(ctx, [[28, 19], [33, 17]], '#f5df91', .45);
      ctx.restore();
    }
    for (let i = -3; i <= 3; i += 1) {
      const x = i * 8.6; const y = 14 + (Math.abs(i) % 2) * 3;
      line(ctx, [[x - 1.1, y], [x + 1.1, y]], '#e6cf81', .52);
      line(ctx, [[x, y - 1.1], [x, y + 1.1]], '#e6cf81', .52);
    }
  }

  function drawLegs(ctx) {
    path(ctx, [['M', -20, 33], ['C', -19, 40, -16, 48, -14, 51], ['L', -5, 51], ['L', -6, 33], ['Z']], '#ffdbcf', C.outline, .9);
    path(ctx, [['M', 6, 33], ['L', 5, 51], ['L', 14, 51], ['C', 16, 47, 19, 40, 20, 33], ['Z']], '#ffdbcf', C.outline, .9);
    for (const side of [-1, 1]) {
      for (let i = -1; i <= 1; i += 1) frill(ctx, side * 10 + i * 2.5, 48.2, 2.3, 2.5, 1);
      path(ctx, [['M', side * 17, 49], ['C', side * 11, 53, side * 5, 54, side * 4, 58], ['C', side * 9, 61, side * 18, 61, side * 21, 57], ['C', side * 21, 53, side * 19, 50, side * 17, 49], ['Z']], grad(ctx, 0, 49, 0, 61, [[0, '#384d91'], [1, '#18214d']]), C.outline, 1.05);
      rr(ctx, side * 11 - 3, 52, 6, 2.1, 1, '#ffffff', null);
      dot(ctx, side * 12, 50.5, 1.1, C.goldHi);
      line(ctx, [[side * 17, 56], [side * 10, 56]], '#8097d5', .75);
    }
  }

  function drawStandArms(ctx, mood) {
    for (const side of [-1, 1]) {
      ctx.save(); ctx.scale(side, 1);
      path(ctx, [['M', 21, -22], ['C', 32, -18, 34, -5, 29, 9], ['C', 27, 14, 24, 15, 20, 10], ['C', 25, 1, 23, -10, 16, -17], ['Z']], grad(ctx, 18, -22, 31, 14, [[0, '#344384'], [1, '#1e275d']]), C.outline, 1.15);
      // Cuff and five compact fingertip lobes read as a hand at the apron edge.
      frill(ctx, 23, 7.2, 4.6, 3.4, 1);
      ell(ctx, 26, 11, 5.3, 4.5, C.skin, C.outline, .85);
      for (let i = -1; i <= 1; i += 1) line(ctx, [[25 + i * 2, 9], [26 + i * 2, 12]], '#d99ca8', .45);
      ctx.restore();
    }
  }

  function drawHandsArms(ctx) {
    // Raised sleeves end in five small fingers pressed to the cheeks.
    for (const side of [-1, 1]) {
      ctx.save(); ctx.scale(side, 1);
      path(ctx, [['M', 19, -18], ['C', 34, -19, 36, -36, 24, -45], ['L', 15, -36], ['C', 22, -29, 21, -22, 14, -18], ['Z']], grad(ctx, 20, -46, 28, -18, [[0, '#455898'], [1, '#202961']]), C.outline, 1.2);
      frill(ctx, 20, -39, 4.4, 3.9, -1);
      ell(ctx, 23, -43, 5.0, 5.7, C.skin, C.outline, .8);
      for (let i = -1; i <= 1; i += 1) line(ctx, [[21 + i * 2, -46], [24 + i * 2, -45]], '#db9faa', .55);
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
    drawSeatedFluke(ctx);
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
    if (pose === 'hands') drawHandsArms(ctx);
    drawSkirt(ctx);
    // The standing palms deliberately come forward over the apron corners;
    // that keeps the source pose's hands-on-waist read at MV scale.
    if (pose !== 'hands') drawStandArms(ctx, mood);
    drawLegs(ctx);
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
    version: '5.0.0-component-illustration-js',
    model: Object.freeze({
      source: '42868804351-1-192.mp4',
      kind: 'component-authored Canvas paths, gradients and animated parts only',
      parts: ['standing and seated whale-tail planes', 'layered wavy hair mass/highlights', 'curled ahoge', 'folded ruffle headband', 'fin ears', 'side bows', 'eye whites/irises/lids/highlights', 'brows', 'mouth/blush', 'maid bodice', 'apron whale emblem', 'pleated ruffled skirt', 'hands/arms', 'ruffled socks/shoes', 'laptop'],
      poses: ['stand', 'hands', 'laptop'],
    }),
    draw,
    ease,
  });
  root.WHALE_PIXEL_RIG = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
