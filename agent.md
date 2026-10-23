# agent.md — DeepSeek Whale Maid Girl (`深海鲸鱼娘`) Animation & MV Engine

> See also [`AGENT.md`](./AGENT.md) for the full specification. Both files are kept in sync for tool and agent compatibility.

This repository implements a deterministic 30fps HTML5 Canvas + Node (`@napi-rs/canvas` + `ffmpeg`) character animation and music-video production studio, modeled directly after **[JohnHeibel/PDoomVideo](https://github.com/JohnHeibel/PDoomVideo)**, **[JohnHeibel/ClaudeAnimationBase](https://github.com/JohnHeibel/ClaudeAnimationBase)**, and **[tuzhechen2005/opus-video-skills](https://github.com/tuzhechen2005/opus-video-skills)**.

---

## 1. Core Architecture & Files

- **`src/core.js`**: Deterministic animation curves (`clamp`, `lerp`, `seg`, `ease`, `easeIn`, `easeOut`, `backOut`, `kf`, `arcPt`), hand-drawn boil (`setBoil`, `boilFrame`), camera rig (`camBegin`, `camEnd`, `toScreen`, `shakeXY`), and transitions (`iris`, `curtains`, `brushWipe`, `smokeWipe`, `spotDark`).
- **`src/whale_girl_rig_data.js`**: **7-Bone Articulated `104×102` Pixel-Grid Rig** (`WHALE_GIRL_PIXEL_RIG`) with 5 canonical poses (`wave`, `wink`, `panic`, `laptop`, `heart`), 5 dense perspective-warped turnaround views (`front`, `q`, `side`, `qback`, `back`), unified non-split legs (`legL: gx = -10..-4`, `legR: gx = 7..15` extended to `gy = -21`), and 16-bit cast sprites (`ladyClaude`, `ladyGemini`, `researcher`).
- **`src/whale_girl.js`**: Protagonist renderer `whaleGirl(ctx, x, y, u, opts)`, 31 acted emotions (`EMO` + `feel()`), smooth multi-stage emotion transition engine (`emotions(t, keys, opts)`), locomotion helpers (`move`, `turn`, `spinView`), 13 hats (`HATS`), and 16-bit overhead emotes (`EMOTES`).
- **`src/cast.js`**: Full 8-character cast (`whaleGirl`, `ladyClaude`, `ladyGemini` (`双子星 Gemini 大小姐`), `clawd`, `researcher`, `agentReachBot`, `miniWhale`, `bionicPuppy`, `biliTvMascot`) and model sheet generators (`renderEmotionsSheet`, `renderViewsSheet`, `renderCharacterSheet`).
- **`src/mv_ba_huiyi_pinhao_gei_ni.js`**: **56-Shot Storyboard Director** for 《椰子水很甜 - 把回忆拼好给你（纯享Beat）》 (`142.11s`, `94.85 BPM`, 1 shot per bar = `2.5304s`), with 12 painted sets, authentic song lyrics (作词：童子-T/Shingo.S/一只然), all 31 emotions with 3-stage mid-lyric transitions, and co-acting with `ladyGemini`.
- **`src/mv_douyin_6.js`, `src/mv_qunian_xiatian.js`, `src/mv_chaoxi.js`, `src/mv_pengyou_de_jiu.js`**: Full beat-synced Whale-Girl MVs (`mv_douyin_6_whale_girl.mp4`, `mv_qunian_xiatian_whale_girl.mp4`, `mv_chaoxi_whale_girl.mp4`, `mv_pengyou_de_jiu_whale_girl.mp4`).

---

## 2. Standing Engineering Rules

1. **Require Order in Node Renderers**: Always `require('./src/whale_girl_rig_data.js')` **before** `require('./src/whale_girl.js')`.
2. **Non-Split Walking Legs**: Keep `legL` (`gx = -10..-4`, pivot `-0.70 * u`) and `legR` (`gx = 7..15`, pivot `+1.10 * u`) 100% unified with upper thighs extended to `gy = -21` and drawn underneath `torso`. Never leave leg columns in `torso` or `tail`.
3. **Dense Grid Perspective Warping for Turnarounds**: Build `q`, `side`, `qback`, and `back` views by warping a dense 2D pixel grid before RLE encoding — never scale RLE endpoints directly.
4. **Seamless 31-Emotion Transitions**: Use `WHALE.emotions(lt, [[t0, emo1, emote1], [t1, emo2, emote2], ...])` so every expression change is bridged by an anticipatory blink (`squint`), a squash-stretch `take`, and interpolated posture.
5. **High Shot Density & Physical Acting**: Design MVs at ~1 shot per bar (`~2.5s`), pairing full-screen painted environments with active locomotion (`stroll`, `runTo` + `smear`, `jumpArc`, `kneel`, `spinView`, `tailSit`) and hand-held props (`armL`/`armR`).
