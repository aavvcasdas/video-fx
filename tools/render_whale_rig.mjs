#!/usr/bin/env node
/*
 * Renders the hand-built JS Whale Pixel Rig into transparent 320 × 180 layers.
 * tools/render_tide.py composites these layers over its lyric worlds, so the
 * shipped MP4 uses the exact same JS character logic as the browser preview.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createCanvas } = require('@napi-rs/canvas');
const rig = require('../src/whale-pixel-rig.js');

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const FPS = 24;
const DURATION = 31.843;
const WIDTH = 320;
const HEIGHT = 180;

const PALETTES = [
  { light: '#86f1ef' }, { light: '#86f1ef' }, { light: '#fff8da' }, { light: '#39fce1' },
];

// Every key is an acted thought, not a static source-pose selection. The rig
// gives the key independent eye, mouth, hair, tail and arm movement.
const KEYS = [
  { at: 0.00, pose: 'stand', mood: 'hopeful', x: 229, y: 129, s: 1.16 },
  { at: 2.42, pose: 'laptop', mood: 'hopeful', x: 203, y: 130, s: 1.17 },
  { at: 4.42, pose: 'laptop', mood: 'focus', x: 195, y: 130, s: 1.17 },
  { at: 6.58, pose: 'hands', mood: 'surprise', x: 223, y: 129, s: 1.18 },
  { at: 8.33, pose: 'hands', mood: 'sad', x: 223, y: 129, s: 1.18 },
  { at: 10.43, pose: 'stand', mood: 'wistful', x: 209, y: 132, s: 1.06 },
  { at: 12.43, pose: 'stand', mood: 'search', x: 221, y: 133, s: 1.05 },
  { at: 15.82, pose: 'stand', mood: 'relieved', x: 216, y: 133, s: 1.08 },
  { at: 18.12, pose: 'stand', mood: 'hopeful', x: 215, y: 132, s: 1.09 },
  { at: 20.12, pose: 'stand', mood: 'focus', x: 213, y: 134, s: 1.07 },
  { at: 24.03, pose: 'hands', mood: 'sad', x: 216, y: 134, s: 1.09 },
  { at: 26.13, pose: 'hands', mood: 'wistful', x: 217, y: 134, s: 1.09 },
  { at: 28.13, pose: 'stand', mood: 'search', x: 160, y: 130, s: 1.22, dance: true },
];

function clamp(value, min = 0, max = 1) { return Math.max(min, Math.min(max, value)); }
function ease(value) { const p = clamp(value); return p * p * (3 - 2 * p); }
function lerp(a, b, amount) { return a + (b - a) * amount; }

function keyAt(t) {
  let index = 0;
  for (let i = 0; i < KEYS.length; i += 1) { if (KEYS[i].at <= t) index = i; else break; }
  return [index, KEYS[index]];
}

function paletteAt(t) {
  const scene = Math.min(7, Math.floor(t / 4));
  return PALETTES[scene <= 3 ? 0 : scene === 4 ? 1 : scene === 5 ? 2 : 3];
}

function drawLayer(ctx, key, t, alpha = 1, transform = {}) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const x = (transform.x ?? key.x);
  const y = (transform.y ?? key.y);
  const s = (transform.s ?? key.s);
  rig.draw(ctx, x, y, s, t, paletteAt(t), {
    pose: key.pose,
    mood: key.mood,
    dance: key.dance || false,
    turn: transform.turn || 0,
    rot: transform.rot || 0,
  });
  ctx.restore();
}

function drawActor(ctx, t) {
  const [index, key] = keyAt(t);
  if (!index) { drawLayer(ctx, key, t); return; }
  const previous = KEYS[index - 1];
  const age = t - key.at;
  if (age >= .64) { drawLayer(ctx, key, t); return; }

  // The JS model changes thought through anticipation → narrow turn → take.
  // It draws the prior pose and next pose from the same part-based rig, never
  // crossfades two raster reference images.
  const p = ease(age / .64);
  const arc = Math.sin(Math.PI * p);
  const x = lerp(previous.x, key.x, p);
  const y = lerp(previous.y, key.y, p) - 8 * arc;
  const s = lerp(previous.s, key.s, p);
  drawLayer(ctx, previous, t, 1 - p, { x: x - 4 * p, y: y + 3 * p, s: s * (1 + .07 * p), turn: arc, rot: -.12 * p });
  drawLayer(ctx, key, t, p, { x: x + 4 * (1 - p), y: y - 3 * (1 - p), s: s * (.9 + .1 * p), turn: arc, rot: .12 * (1 - p) });
}

function outputDirFromArgs() {
  const arg = process.argv.find((entry) => entry.startsWith('--frames='));
  return path.resolve(ROOT, arg ? arg.slice('--frames='.length) : 'render/whale-rig');
}

const output = outputDirFromArgs();
fs.mkdirSync(output, { recursive: true });
const frameCount = Math.ceil(DURATION * FPS);
for (let index = 0; index < frameCount; index += 1) {
  const t = Math.min(DURATION - 1 / FPS, index / FPS);
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  drawActor(ctx, t);
  fs.writeFileSync(path.join(output, `${String(index + 1).padStart(6, '0')}.png`), canvas.toBuffer('image/png'));
  if (index % 72 === 0 || index === frameCount - 1) console.log(`rig frame ${String(index + 1).padStart(4, '0')}/${frameCount}  ${t.toFixed(2)}s`);
}
console.log(`Wrote ${frameCount} transparent rig frames to ${output}`);
