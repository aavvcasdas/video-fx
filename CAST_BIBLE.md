# Cast bible — read before painting a shot

This is the equivalent of a character module in a code-rendered MV: scenes **call a cast identity and pose** rather than inventing a new character per scene. Runtime metadata lives in [`src/cast.js`](src/cast.js); image provenance and variants live in [`assets/cast/whale-maid/manifest.json`](assets/cast/whale-maid/manifest.json); the live character implementation is [`src/whale-pixel-rig.js`](src/whale-pixel-rig.js). The seven saved images are authoritative model sheets only: the active 《潮汐》 MV builds the heroine from hand-written JavaScript Canvas parts, with no runtime image, encoded raster, replacement character or moving sprite.

## REF-01 · 鲸鱼娘 / locked heroine

The user explicitly approved the heroine from `42868804351-1-192.mp4` as the required exact character reference. Three segmented source poses are authoritative:

| Pose | Asset | Source frame | Use in MV |
| --- | --- | --- | --- |
| `standing` | `assets/cast/whale-maid/source/standing.png` | 01:04 | entrance, dance, finale, model sheet |
| `hands` | `assets/cast/whale-maid/source/hands.png` | 00:16 | surprise, build-up accent, reaction cut |
| `laptop` | `assets/cast/whale-maid/source/laptop.png` | 00:32 | vote board, rules, work/log shots |

### Locked visual facts

Do not replace these with a generic whale girl or redraw them loosely. The character must retain:

1. Blue-to-cyan long hair with a single curved ahoge and full side locks.
2. White ruffled maid headband, fin-like ears, and blue side bows.
3. Large blue eyes / chibi facial proportions from the reference pose.
4. Navy-and-white maid dress, black bow jewel, gold side ribbons, and whale-apron mark.
5. Large dark-blue whale tail with pale underside, white socks and navy shoes.

### Motion policy

The supplied poses are model sheets, not runtime sprites. `whale-pixel-rig.js` constructs the source-observed silhouette from hand-written Canvas paths: full whale tail/fluke, six curled blue/cyan hair locks, ahoge, ruffle puffs, ear fins/bows, eye whites/irises/lids/highlights, facial states, bodice, apron emblem, ruffled skirt, sleeves/hands, socks/shoes and laptop. Stage motion adds anticipation, narrow turns, beat breathing, bounce, head/eye gaze, blink/wink and hair/tail follow-through. Never substitute the outfit, crop out the tail, swap to a generic whale girl, use generated imagery, or load/encode the saved model-sheet images at runtime.

## Saved alternate style references

The standing pose is also preserved as four optional art-direction references. They are not replacements for the source-locked default; they are a controlled art direction library for alternate cuts:

| Key | File | Rule |
| --- | --- | --- |
| `pixel-rpg` | `styles/pixel-rpg.png` | 16-color, nearest-neighbour block treatment |
| `cel-pop` | `styles/cel-pop.png` | flat ten-color animation fill + navy contour |
| `ink-tide` | `styles/ink-tide.png` | cyan/navy ink wash + paper-dark contour |
| `neon-sonar` | `styles/neon-sonar.png` | violet/cyan electric treatment + alpha glow |

Every variant was made from the approved standing source pose, so the headwear, dress, apron mark and whale tail remain traceable. In the active 《潮汐》 MV they remain art-direction references for palette and scene treatment; `stand`, `hands` and `laptop` are all reconfigured states of the same JS rig. No runtime image generation or direct PNG-character compositing is allowed.

## Supporting cast

| Code | Character | Scene purpose | Reusable calls |
| --- | --- | --- | --- |
| `M-02` | 米沫 / water-jelly DJ | beat handoff and chorus counterpoint | idle, mix, pulse |
| `M-03` | 波波 / messenger fish | eye-line lead and match-cut guide | swim-left, swim-right, beacon |
| `M-04` | 露玛 / tide orb | audio visualization and particle punctuation | hover, burst, trail |

Supporting characters are deliberately code drawn. They cannot visually outrank REF-01 in a shot unless the storyboard explicitly calls for a handoff.
