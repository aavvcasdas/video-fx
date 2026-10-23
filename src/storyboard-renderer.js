/*
 * Tide Storyboard Renderer
 *
 * An original renderer plan built from the current high-star procedural
 * storyboard pattern in cth9191/animate (not copied code): a named beat board,
 * one anchor for the eye, an acted cause → effect → reaction in every shot,
 * beat-grid cuts, intentional camera values, and a concrete bridge object
 * between worlds. Both the Canvas preview and the offline rig renderer consume
 * this single deterministic plan.
 */
(function installTideStoryboard(root) {
  'use strict';

  const BPM = 117;
  const BEAT = 60 / BPM;
  const SHOTS = Object.freeze([
    { id: 'S01', start: 0.00, end: 2.42, world: 'pearl-garden', anchor: 'pearl', link: 'hold',
      setup: 'ruin and sleeping pearl', action: 'pearl wakes on the first vocal', reaction: 'its beam finds the route', camera: [0, 0, 1.00], actor: ['stand', 'hopeful', 229, 129, 1.16] },
    { id: 'S02', start: 2.42, end: 4.42, world: 'mountain-window', anchor: 'route', link: 'match-position',
      setup: 'beam becomes a mountain route', action: 'hero reads the distant line', reaction: 'laptop opens into the next problem', camera: [-7, 1, 1.05], actor: ['laptop', 'hopeful', 203, 130, 1.17] },
    { id: 'S03', start: 4.42, end: 6.58, world: 'map-desk', anchor: 'pin', link: 'pov',
      setup: 'one pin on an actual map desk', action: 'two signals pull apart', reaction: 'hero focuses on the failing route', camera: [-4, 2, 1.08], actor: ['laptop', 'focus', 195, 130, 1.17] },
    { id: 'S04', start: 6.58, end: 8.33, world: 'split-shores', anchor: 'break', link: 'cause-effect',
      setup: 'two lighthouses face one another', action: 'the dotted route snaps at centre', reaction: 'hands reach cheeks in shock', camera: [4, -1, 1.12], actor: ['hands', 'surprise', 223, 129, 1.18] },
    { id: 'S05', start: 8.33, end: 10.43, world: 'tide-wall', anchor: 'boat', link: 'shape-morph',
      setup: 'a paper boat meets the tide wall', action: 'the wall pushes it backward', reaction: 'hero withdraws with it', camera: [3, 2, 1.03], actor: ['hands', 'sad', 223, 129, 1.18] },
    { id: 'S06', start: 10.43, end: 12.43, world: 'memory-orbit', anchor: 'pearl', link: 'shape-morph',
      setup: 'boat folds to the opening pearl', action: 'memory bubbles circle the pearl', reaction: 'hero holds the lost light', camera: [0, -2, 1.00], actor: ['stand', 'wistful', 209, 132, 1.06] },
    { id: 'S07', start: 12.43, end: 15.82, world: 'sonar-shrine', anchor: 'target', link: 'pov',
      setup: 'target sits behind a sonar gate', action: 'scan rings drive fish aside', reaction: 'eyes follow the target between pillars', camera: [-5, 0, 1.10], actor: ['stand', 'search', 221, 133, 1.05] },
    { id: 'S08', start: 15.82, end: 18.12, world: 'wave-lift', anchor: 'pearl', link: 'match-position',
      setup: 'the gate scan becomes one tide', action: 'wave carries the pearl up', reaction: 'hero breathes as the world opens', camera: [0, -4, 1.08], actor: ['stand', 'relieved', 216, 133, 1.08] },
    { id: 'S09', start: 18.12, end: 20.12, world: 'ridge-reveal', anchor: 'mountain-light', link: 'scale-out',
      setup: 'wave recedes into lit ridges', action: 'roof lights appear in depth', reaction: 'hero looks upward toward the distance', camera: [4, -3, 1.00], actor: ['stand', 'hopeful', 215, 132, 1.09] },
    { id: 'S10', start: 20.12, end: 24.03, world: 'ink-beacons', anchor: 'gap', link: 'cause-effect',
      setup: 'two mountain beacons share a dark gap', action: 'their dashes almost meet', reaction: 'last dash rises away instead', camera: [0, 1, 1.02], actor: ['stand', 'focus', 213, 134, 1.07] },
    { id: 'S11', start: 24.03, end: 28.13, world: 'moon-archive', anchor: 'memory-frame', link: 'callback',
      setup: 'three previous objects orbit the archive moon', action: 'frames settle into one crescent', reaction: 'hero remembers, then looks out', camera: [4, -2, 1.05], actor: ['hands', 'wistful', 217, 134, 1.09] },
    { id: 'S12', start: 28.13, end: 31.843, world: 'signal-payoff', anchor: 'pearl', link: 'callback',
      setup: 'all callback nodes surround the hero', action: 'their routes resolve into a signal', reaction: 'opening pearl returns changed at the centre', camera: [0, 0, 1.12], actor: ['stand', 'search', 160, 130, 1.22, true] },
  ]);

  function clamp(v, lo = 0, hi = 1) { return Math.max(lo, Math.min(hi, v)); }
  function ease(v) { const p = clamp(v); return p * p * (3 - 2 * p); }
  function shotAt(t) {
    for (let i = SHOTS.length - 1; i >= 0; i -= 1) if (t >= SHOTS[i].start) return SHOTS[i];
    return SHOTS[0];
  }
  function shotIndex(t) { return SHOTS.indexOf(shotAt(t)); }
  function onBeat(t, subdivision = 1, tolerance = .035) {
    const unit = BEAT / subdivision;
    return Math.abs(t / unit - Math.round(t / unit)) < tolerance / unit;
  }
  function cameraAt(t) {
    const shot = shotAt(t);
    const local = clamp((t - shot.start) / (shot.end - shot.start));
    const drift = Math.sin(local * Math.PI) * .55;
    return Object.freeze({ x: shot.camera[0] + drift, y: shot.camera[1] - drift * .5, zoom: shot.camera[2], shot });
  }
  function bridgeAt(t) {
    const index = shotIndex(t);
    if (!index) return null;
    const shot = SHOTS[index];
    const previous = SHOTS[index - 1];
    const age = t - shot.start;
    if (age > .42) return null;
    return Object.freeze({ from: previous.anchor, to: shot.anchor, type: shot.link, p: ease(age / .42), shot });
  }
  function actorKeyAt(t) {
    const shot = shotAt(t);
    const [pose, mood, x, y, scale, dance = false] = shot.actor;
    return Object.freeze({ at: shot.start, pose, mood, x, y, s: scale, dance });
  }

  const api = Object.freeze({
    version: 'animate-inspired-board-v1', BPM, BEAT, shots: SHOTS, shotAt, shotIndex, onBeat, cameraAt, bridgeAt, actorKeyAt,
    principles: Object.freeze(['one eye anchor per shot', 'cause-effect acting', 'beat-grid cuts', 'match-object transitions', 'screen-position hero anchoring', 'callback payoff']),
  });
  root.TIDE_STORYBOARD = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
