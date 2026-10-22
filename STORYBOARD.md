# Abyssal Beat — 48-second storyboard

The timing table is the source of truth in [`src/timeline.js`](src/timeline.js). This document is the creative brief for the functions that paint each shot. Cuts must land on the first beat of a four-second section at **124 BPM**.

| Time | Shot | REF-01 pose | Primary motion / cut rule |
| --- | --- | --- | --- |
| 00–04 | 信号下潜 | none → `standing` | light shaft and bubbles establish depth; orb appears on beat 1 |
| 04–08 | 鲸尾入镜 | `standing` | exact source heroine floats in from right; tail crosses on the fourth beat |
| 08–12 | 深海投票 | `laptop` | source laptop pose anchors the choice-board UI; cards pop one per beat |
| 12–16 | 规则浮现 | `laptop` | board items activate as keyboard particles answer the beat |
| 16–20 | 珊瑚步伐 | `standing` | stage translation / beat pulse only; no silhouette distortion |
| 20–24 | 水母接管 | `standing` | water-jelly DJ takes right composition; heroine remains source-locked counterpoint |
| 24–28 | 气泡弹幕 | `hands` | surprise pose meets a rising comment-bubble shower |
| 28–32 | 存档之门 | `laptop` | code-work pose and save door match cut through rectangular UI |
| 32–36 | 深潜独白 | `hands` / `standing` | close reaction alternates with light shafts; retain full headwear + tail in frame |
| 36–40 | 群像合拍 | `standing` | all four cast members pulse on one bar, heroine remains visual center |
| 40–44 | 潮汐建造 | `hands` | source reaction pose hits the build-up white flash |
| 44–48 | 蓝色回声 | `standing` | exact standing pose rises through title and returns to first beat |

## Every-second contract

The 48 cues in `secondCues` are not decoration. A second must visibly introduce one or more of: a character action, an environmental particle behavior, a UI change, a camera shift, a palette step, or a transition preparation. If a new cut is added, extend the data table first, then implement the visual function.

## Style-cut contract

- **Default pixel look**: use source PNG poses, composed at native stage resolution. This is the fidelity cut.
- **Cel pop / ink tide / neon sonar**: invoke the matching saved standing-style reference when a neutral standing pose is used; for `hands` or `laptop`, preserve the corresponding source pose rather than inventing an unmatched substitute.
- **Pixel RPG alternate**: use `pixel-rpg.png` only for model cards, interstitials or a deliberately full pixel restyle; label it as an alternate cut, not the source-lock default.
