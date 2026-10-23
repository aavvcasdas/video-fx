/*
 * Whale Pixel Rig
 *
 * A source-faithful, part-animated JS reconstruction of the approved
 * 42868804351-1-192.mp4 heroine. The high-fidelity standing / hands / laptop
 * silhouettes are source-derived pixel RUNS in whale-pixel-model.js, painted
 * by Canvas code (never by loading or translating a PNG at runtime). Dynamic
 * facial cells, hair glints, tail ripples, beat breathing and staged pose
 * changes are layered on top of that exact approved pixel model.
 */
(function installWhalePixelRig(root) {
  'use strict';

  const MODELS = root.WHALE_PIXEL_MODEL || (
    typeof module === 'object' && module.exports && typeof require === 'function'
      ? require('./whale-pixel-model.js')
      : null
  );
  if (!MODELS) throw new Error('Whale Pixel Rig requires src/whale-pixel-model.js before it is loaded.');

  const surfaceCache = new Map();
  const FACE = Object.freeze({
    // Coordinates are in the same 120px-tall source-derived pixel grids.
    standing: { lx: 41, rx: 62, eyeY: 42, mouthX: 52, mouthY: 56, hair: [[19, 68], [79, 70]], tail: [92, 64] },
    hands: { lx: 39, rx: 61, eyeY: 42, mouthX: 51, mouthY: 57, hair: [[18, 72], [78, 74]], tail: [87, 83] },
    laptop: { lx: 46, rx: 65, eyeY: 39, mouthX: 56, mouthY: 53, hair: [[25, 66], [83, 65]], tail: [90, 88] },
  });

  const INK = '#17234f';
  const IRIS = '#2165aa';
  const IRIS_LIGHT = '#9fe8ff';
  const SKIN = '#f8d3c9';
  const BLUSH = '#e892a8';
  const TAIL_LIGHT = '#779fe2';
  const HAIR_LIGHT = '#72d5eb';

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function ease(value) { const p = clamp(value, 0, 1); return p * p * (3 - 2 * p); }
  function beat(t) { const phase = (t * 117 / 60) % 1; return Math.pow(1 - phase, 4); }
  function mod(value, divisor) { return ((value % divisor) + divisor) % divisor; }

  function normalisePose(options) {
    if (options && options.pose === 'hands') return 'hands';
    if (options && options.pose === 'laptop') return 'laptop';
    if (options && (options.laptop || options.pose === 'laptop')) return 'laptop';
    if (options && (options.heart || options.mood === 'surprise')) return 'hands';
    return 'standing';
  }

  function paintRuns(ctx, model) {
    const colours = model.colours;
    let active = -1;
    for (const run of model.runs) {
      const colour = run[3];
      if (colour !== active) { ctx.fillStyle = colours[colour]; active = colour; }
      ctx.fillRect(run[1], run[0], run[2], 1);
    }
  }

  function makeSurface(ctx, model) {
    let canvas = null;
    if (typeof OffscreenCanvas !== 'undefined') {
      try { canvas = new OffscreenCanvas(model.w, model.h); } catch (_) { canvas = null; }
    }
    if (!canvas && typeof document !== 'undefined') {
      canvas = document.createElement('canvas');
      canvas.width = model.w; canvas.height = model.h;
    }
    // @napi-rs/canvas gives the context a constructible canvas class. The
    // result is still painted from JS pixel runs; it is merely a fast cache.
    if (!canvas && ctx.canvas && ctx.canvas.constructor) {
      try { canvas = new ctx.canvas.constructor(model.w, model.h); } catch (_) { canvas = null; }
    }
    if (!canvas || !canvas.getContext) return null;
    const paint = canvas.getContext('2d');
    paint.imageSmoothingEnabled = false;
    paintRuns(paint, model);
    return canvas;
  }

  function sourceSurface(ctx, model) {
    if (surfaceCache.has(model)) return surfaceCache.get(model);
    const canvas = makeSurface(ctx, model);
    surfaceCache.set(model, canvas);
    return canvas;
  }

  function drawModel(ctx, model, scale) {
    const surface = sourceSurface(ctx, model);
    if (surface) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(surface, 0, 0, model.w, model.h);
      return;
    }
    // A conservative fallback for unusual Canvas implementations.
    paintRuns(ctx, model);
  }

  function square(ctx, x, y, w, h, colour) { ctx.fillStyle = colour; ctx.fillRect(x, y, w, h); }

  function openEye(ctx, x, y, gazeX, gazeY) {
    // A compact pixel eye built over the standing model's source wink only.
    square(ctx, x - 4, y - 4, 9, 1, INK);
    square(ctx, x - 5, y - 3, 11, 7, SKIN);
    square(ctx, x - 4, y - 3, 9, 1, INK);
    square(ctx, x - 5, y - 2, 1, 5, INK); square(ctx, x + 5, y - 2, 1, 5, INK);
    square(ctx, x - 3, y - 2, 7, 5, '#f8fbff');
    square(ctx, x - 1 + gazeX, y - 1 + gazeY, 4, 4, IRIS);
    square(ctx, x + gazeX, y + gazeY, 2, 2, '#173a79');
    square(ctx, x + 1 + gazeX, y - 1 + gazeY, 1, 1, IRIS_LIGHT);
    square(ctx, x - 3, y + 3, 7, 1, INK);
  }

  function closedEye(ctx, x, y) {
    square(ctx, x - 4, y - 1, 3, 1, INK);
    square(ctx, x - 1, y, 5, 1, INK);
    square(ctx, x + 4, y - 1, 2, 1, INK);
  }

  function microFace(ctx, pose, t, mood, options) {
    const face = FACE[pose];
    const blinkCycle = mod(t + (pose === 'hands' ? .5 : 0), 3.1);
    const blink = blinkCycle > 2.93 || mood === 'blink';
    const wink = mood === 'wink' && Math.sin(t * .72) > -.22;
    const surprise = mood === 'surprise';
    const sad = mood === 'sad' || mood === 'wistful';
    const searching = mood === 'search';
    const glance = searching ? Math.round(Math.sin(t * 4.2) * 1.5) : Math.round(Math.sin(t * 1.45) * .5);
    const gazeY = surprise ? -1 : 0;

    // The approved standing sheet has its characteristic source wink. Keep it
    // intact by default; an explicit story beat may ask for the code-painted
    // open-eye variation, while ordinary gaze motion only touches tiny pupils.
    if (pose === 'standing' && options.openBothEyes && !wink && !blink) openEye(ctx, face.rx, face.eyeY, glance, gazeY);
    if (blink) { closedEye(ctx, face.lx, face.eyeY + 1); closedEye(ctx, face.rx, face.eyeY + 1); }
    else if (wink) closedEye(ctx, face.rx, face.eyeY + 1);
    else {
      // Preserve source-rendered eyes while their pupils and highlights make
      // eye-line shifts visible at the one-pixel level.
      square(ctx, face.lx + glance, face.eyeY, 2, 2, '#254b94');
      square(ctx, face.rx + glance, face.eyeY, 2, 2, '#254b94');
      square(ctx, face.lx + 1 + glance, face.eyeY - 1, 1, 1, IRIS_LIGHT);
      square(ctx, face.rx + 1 + glance, face.eyeY - 1, 1, 1, IRIS_LIGHT);
    }

    if (surprise || sad) {
      square(ctx, face.lx - 6, face.eyeY + 10, 3, 1, BLUSH);
      square(ctx, face.rx + 4, face.eyeY + 10, 3, 1, BLUSH);
      square(ctx, face.mouthX - 2, face.mouthY - 1, surprise ? 5 : 4, surprise ? 3 : 1, surprise ? '#cf7e88' : '#a85f78');
    } else if (mood === 'smile' || mood === 'relieved' || mood === 'hopeful') {
      square(ctx, face.mouthX - 2, face.mouthY, 5, 1, '#a85f78');
      square(ctx, face.mouthX - 1, face.mouthY + 1, 3, 1, '#a85f78');
    }
  }

  function livingDetails(ctx, pose, t, options) {
    const face = FACE[pose];
    const sway = Math.round(Math.sin(t * 3.2 + (options.dance ? .7 : 0)) * (options.dance ? 2 : 1));
    const tail = face.tail;
    // These light cells ride existing source-derived hair/tail pixels. They
    // create follow-through without distorting the approved silhouette.
    square(ctx, face.hair[0][0] + sway, face.hair[0][1], 2, 1, HAIR_LIGHT);
    square(ctx, face.hair[1][0] - sway, face.hair[1][1] + 2, 2, 1, HAIR_LIGHT);
    square(ctx, tail[0] + sway, tail[1], 3, 1, TAIL_LIGHT);
    square(ctx, tail[0] - 3 + sway, tail[1] + 4, 2, 1, '#5576bc');
  }

  function draw(ctx, x, y, scale, t, palette, options = {}) {
    const pose = normalisePose(options);
    const model = MODELS[pose];
    const p = beat(t);
    const breathe = 1 + Math.sin(t * 2.15) * .014 - p * .027;
    const bob = Math.sin(t * 3.2 + (options.dance ? .6 : 0)) * (options.dance ? 1.35 : .7) - p * (options.dance ? 1.6 : .7);
    const turn = clamp(options.turn || 0, 0, 1);
    const turnScale = 1 - turn * .26;
    const rotation = options.rot || 0;

    ctx.save();
    ctx.translate(Math.round(x), Math.round(y + bob));
    ctx.rotate(rotation);
    ctx.scale(scale * breathe * turnScale, scale * breathe);
    // Low stage unit anchoring: character feet land around y + 36 while the
    // full source tail remains above/right of the heroine exactly as approved.
    ctx.translate(-model.w / 2, -model.h * .70);
    drawModel(ctx, model, scale);
    livingDetails(ctx, pose, t, options);
    microFace(ctx, pose, t, options.mood || 'neutral', options);
    ctx.restore();
  }

  const api = Object.freeze({
    version: '2.0.0-source-pixel',
    model: Object.freeze({
      source: '42868804351-1-192.mp4',
      kind: 'approved-model-sheet pixel runs',
      parts: ['source-pixel silhouette', 'eyes', 'lids', 'pupils', 'mouth', 'blush', 'hair glints', 'tail ripple', 'pose transitions'],
      sourceElements: ['ahoge', 'ruffled headband', 'blue fringe and long cyan-tip hair', 'fin ears and blue bow', 'blue eyes and source wink', 'cheeks and mouth', 'black bow jewel and buttons', 'puffed sleeves and gold skirt bows', 'white ruffled apron with whale emblem', 'socks and navy shoes', 'full dark-blue whale tail', 'hands-to-cheeks pose', 'laptop-and-tail-seat pose'],
      poses: ['standing', 'hands', 'laptop'],
    }),
    draw,
    ease,
  });

  root.WHALE_PIXEL_RIG = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
