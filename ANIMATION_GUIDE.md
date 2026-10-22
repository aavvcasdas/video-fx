# Animation guide — read before editing `app.js`

This is a small browser-based adaptation of a code-rendered MV workflow. It follows three rules:

1. **Time is input.** A frame is a pure rendering of `t`, timeline data, a palette and cast assets. Do not rely on prior-frame state or unconstrained `Math.random()`.
2. **Timeline first.** Add or change timing in [`src/timeline.js`](src/timeline.js), then change the shot behavior in `app.js`. The blueprint exporter reads the same data.
3. **Cast first.** REF-01 is source-locked by [`src/cast.js`](src/cast.js) and [`CAST_BIBLE.md`](CAST_BIBLE.md). Scene code may select poses, never redraw its identity.

## Project anatomy

```text
src/cast.js                              cast metadata, source-pose and style-sheet paths
src/timeline.js                          48-second timing source of truth
assets/cast/whale-maid/source/*.png      source-locked heroine poses
assets/cast/whale-maid/styles/*.png      saved alternate standing-pose treatments
assets/cast/whale-maid/manifest.json     provenance and variant policy
CAST_BIBLE.md                            character lock / visual facts
STORYBOARD.md                            shot list and pose assignment
app.js                                   canvas paint functions, controls and JSON export
```

## Stage constraints

- Paint into the native **320 × 180** `CanvasRenderingContext2D`; CSS does the nearest-neighbour presentation.
- `BPM = 124`, `BEAT = 60 / BPM`, and four beats make the visual bar. `beatPulse(t)` should animate only a small, deliberate hit.
- `drawMV(t)` owns full-frame shot composition. Any new shot must paint its own background before its characters.
- The source heroine assets are alpha PNGs. Call `drawWhale(...)`; do not call `drawWhaleVector(...)` except as an asset-loading fallback.

## Reference-lock rules

- Select only `hands`, `laptop` or `standing` for an exact-source character pose.
- Preserve the complete silhouette: do not crop away the tail, headband, ears, apron or feet in a hero shot.
- Use `state.selectedStyle` only to select one of the saved treatments for a **neutral standing** shot. A laptop/reaction shot must use its matching source pose because no invented restyle is approved for it.
- New alternate treatments must be derived from `source/standing.png`, saved under `assets/cast/whale-maid/styles/`, and added to `manifest.json` and `src/cast.js` before use.

## Render / review checklist

1. Scrub 00, 04, 08 … 44 seconds: each cut must start on its defined beat.
2. Scrub every integer second: a cue must be visibly observable.
3. Review all four style cards and all four cast model cards.
4. Check that `REF-01` loads `source/standing.png` in pixel mode and does not silently fall back to vector art.
5. Run `npm run check`; then use the JSON export as the render manifest for a future MP4 sequence.
