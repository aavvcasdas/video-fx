// src/clawd.js — The Anthropic / ClaudeAnimationBase Clawd Mascot Character Rig
// Directly modeled on JohnHeibel/ClaudeAnimationBase (src/clawd.js) & PDoomVideo:
//   - Terracotta blocky 4-legged body (`PAL.coral`) with 5 views, hats (`top`, `party`, `hard`, `crown`, `cap`, `propeller`),
//   - Expressive eyes (`open`, `happy`, `wink`, `star`, `spark`, `scared`) & mouths (`smile`, `O`, `flat`),
//   - Bowtie / props & overhead emotes.

(function (root) {
  const CORE = root.CORE || (typeof require !== 'undefined' ? require('./core.js') : {});
  const WHALE = root.WHALE_GIRL || (typeof require !== 'undefined' ? require('./whale_girl.js') : {});
  const {
    PAL, clamp, boilSeed, ellPts, rectPts, rrPts, starPts, paint, inkLine
  } = CORE;

  function clawd(ctx, x, y, u = 14, o = {}) {
    boilSeed('clawd' + Math.round(x) + (o.seed || 0));
    const sq = clamp(o.sq || 0, -0.35, 0.35);
    const sx = (1 - sq * 0.55) * (o.flip ? -1 : 1);
    const sy = 1 + sq * 0.75;
    const dy = (o.dy || 0) * u;

    if (!o.noShadow) {
      paint(ctx, ellPts(x, y + 0.1 * u, 2.3 * u, 0.45 * u, 14), { wash: PAL.ink, washOp: 65, ink: null });
    }

    ctx.save();
    ctx.translate(x, y + dy);
    if (o.rot) ctx.rotate(o.rot);
    ctx.scale(sx, sy);

    // 4 blocky legs
    const wPh = o.walk != null ? o.walk * Math.PI : 0;
    const legXs = [-1.45, -0.52, 0.52, 1.45];
    legXs.forEach((lx, i) => {
      const lOff = o.walk != null ? Math.sin(wPh + i * 1.5) * 0.32 * u : 0;
      paint(ctx, rectPts((lx - 0.26) * u, -1.05 * u + lOff, 0.52 * u, 1.05 * u, 0.5), {
        wash: PAL.coralDk, fill: PAL.coral, fillOp: 90, ink: PAL.ink, sw: 0.9
      });
    });

    // Stubby side arms
    for (const [s, ang] of [[-1, o.aL ?? 0.3], [1, o.aR ?? 0.3]]) {
      ctx.save();
      ctx.translate(s * 2.2 * u, -2.35 * u);
      ctx.rotate(s * (-0.4 + ang));
      paint(ctx, rectPts(-0.26 * u, -0.1 * u, 0.52 * u, 1.05 * u, 0.5), {
        wash: PAL.coral, ink: PAL.ink, sw: 0.85
      });
      ctx.restore();
    }

    // Signature wide rectangular terracotta body
    paint(ctx, rrPts(-2.25 * u, -3.65 * u, 4.5 * u, 2.75 * u, 4, 0.8), {
      wash: PAL.coral, fill: PAL.peach, fillOp: 95, ink: PAL.ink, sw: 1.05
    });

    // Eyes & Mouth
    const ey = -2.45 * u;
    const eyeType = o.eyes || 'open';
    for (const s of [-1, 1]) {
      const ex = s * 0.95 * u;
      if (eyeType === 'happy' || (eyeType === 'wink' && s === 1)) {
        inkLine(ctx, [[ex - 0.38 * u, ey + 0.12 * u], [ex, ey - 0.28 * u], [ex + 0.38 * u, ey + 0.12 * u]], 1.2, PAL.ink, 'ink', 0.5);
      } else if (eyeType === 'star' || eyeType === 'spark') {
        paint(ctx, starPts(ex, ey, 0.52 * u, 0.4, 4), { wash: PAL.gold, ink: PAL.ink, sw: 0.7 });
      } else if (eyeType === 'scared') {
        paint(ctx, ellPts(ex, ey, 0.42 * u, 0.46 * u, 10), { wash: '#FFFFFF', ink: PAL.ink, sw: 0.8 });
        paint(ctx, ellPts(ex, ey, 0.14 * u, 0.14 * u, 6), { wash: PAL.ink, ink: null });
      } else {
        paint(ctx, rectPts(ex - 0.24 * u, ey - 0.34 * u, 0.48 * u, 0.68 * u, 0.4), { wash: PAL.ink, ink: null });
        paint(ctx, ellPts(ex - 0.08 * u, ey - 0.16 * u, 0.10 * u, 0.10 * u, 6), { wash: '#FFFFFF', ink: null });
      }
    }

    const my = -1.65 * u;
    if (o.mouth === 'O') {
      paint(ctx, ellPts(0, my, 0.32 * u, 0.38 * u, 10), { wash: PAL.ink, ink: null });
    } else {
      inkLine(ctx, [[-0.38 * u, my - 0.08 * u], [0, my + 0.18 * u], [0.38 * u, my - 0.08 * u]], 1.1, PAL.ink, 'ink', 0.5);
    }

    // Optional bowtie prop
    if (o.prop === 'bowtie') {
      WHALE.HATS.maid && paint(ctx, [[0, -1.1 * u], [-0.55 * u, -1.35 * u], [-0.55 * u, -0.85 * u]], { wash: PAL.rose, ink: PAL.ink, sw: 0.65 });
      paint(ctx, [[0, -1.1 * u], [0.55 * u, -1.35 * u], [0.55 * u, -0.85 * u]], { wash: PAL.rose, ink: PAL.ink, sw: 0.65 });
    }

    // Optional Hats (`top`, `party`, `hard`, `crown`, `cap`, `propeller`)
    const hy = -3.65 * u;
    if (o.hat === 'top') {
      paint(ctx, ellPts(0, hy, 1.65 * u, 0.32 * u, 12), { wash: '#1E293B', ink: PAL.ink, sw: 0.85 });
      paint(ctx, rectPts(-1.05 * u, hy - 1.55 * u, 2.1 * u, 1.55 * u, 0.5), { wash: '#1E293B', ink: PAL.ink, sw: 0.85 });
      paint(ctx, rectPts(-1.05 * u, hy - 0.35 * u, 2.1 * u, 0.3 * u, 0.3), { wash: PAL.rose, ink: PAL.ink, sw: 0.6 });
    } else if (o.hat === 'party') {
      paint(ctx, [[-0.85 * u, hy], [0, hy - 1.85 * u], [0.85 * u, hy]], { wash: PAL.rose, fill: PAL.gold, fillOp: 90, ink: PAL.ink, sw: 0.85 });
      paint(ctx, ellPts(0, hy - 1.95 * u, 0.25 * u, 0.25 * u, 8), { wash: PAL.gold, ink: PAL.ink, sw: 0.6 });
    } else if (o.hat === 'hard') {
      paint(ctx, ellPts(0, hy - 0.2 * u, 1.55 * u, 0.95 * u, 12), { wash: PAL.gold, ink: PAL.ink, sw: 0.85 });
      paint(ctx, rectPts(-1.85 * u, hy - 0.2 * u, 3.7 * u, 0.32 * u, 0.4), { wash: PAL.ochre, ink: PAL.ink, sw: 0.8 });
    } else if (o.hat === 'crown') {
      paint(ctx, [[-1.1 * u, hy], [-1.1 * u, hy - 0.95 * u], [-0.4 * u, hy - 0.45 * u], [0, hy - 1.15 * u], [0.4 * u, hy - 0.45 * u], [1.1 * u, hy - 0.95 * u], [1.1 * u, hy]], {
        wash: PAL.gold, ink: PAL.ink, sw: 0.85
      });
    } else if (o.hat === 'cap' || o.hat === 'propeller') {
      paint(ctx, ellPts(0, hy - 0.15 * u, 1.45 * u, 0.75 * u, 12), { wash: PAL.whaleBlue, fill: PAL.gold, fillOp: 90, ink: PAL.ink, sw: 0.85 });
      if (o.hat === 'propeller') {
        inkLine(ctx, [[0, hy - 0.85 * u], [0, hy - 1.35 * u]], 1.1, PAL.ink, 'ink', 0);
        paint(ctx, ellPts(0, hy - 1.35 * u, 0.95 * u, 0.18 * u, 8), { wash: PAL.rose, ink: PAL.ink, sw: 0.65 });
      }
    }

    if (o.emote && WHALE.EMOTES && WHALE.EMOTES[o.emote]) {
      WHALE.EMOTES[o.emote](ctx, 0, hy - 0.6 * u, u, 1, o.t || 0);
    }

    ctx.restore();
  }

  const CLAWD = { clawd };
  root.CLAWD = CLAWD;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CLAWD;
  }
})(typeof window !== 'undefined' ? window : globalThis);
