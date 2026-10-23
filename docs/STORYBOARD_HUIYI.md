# Storyboard · 《椰子水很甜 - 把回忆拼好给你（纯享Beat）》(142.11s)

Built with the [tuzhechen2005/opus-video-skills](https://github.com/tuzhechen2005/opus-video-skills) `painted-animation` workflow (`references/music-video.md` & `examples/xiaozhen/STORYBOARD.md`).

**Logline:** On a dusk seaside railway platform, a gust of wind scatters 9 glowing jigsaw puzzle pieces from `whaleGirl`'s keepsake box. Across sepia summer streets (`椰子水很甜`), a rainy train departure, a twilight lighthouse studio, and a starry rooftop, she walks, runs, kneels, leaps, and collects all 9 fragments — until the completed puzzle comes alive as a giant bioluminescent Star-Whale that carries her back to the dawn station for a joyful reunion.

**Song Grid (`scripts/beat_grid.py`):** `94.85 BPM` (`half-time 47.425 BPM`), `BEAT = 0.6326 s`, `OFF = 0.415 s`, `1 bar = 4 beats = 2.530 s`, total duration `142.11 s` (`4,263 frames @ 30fps`).

**One World & Palette Arc:** A coastal railway town & lighthouse across 6 lighting chapters:
1. `LOOK.dusk` (`0.00–20.66s`) — Dusk violet & warm peach glow (`watercolor`)
2. `LOOK.sepia` (`20.66–40.90s`) — Golden-amber memory lane with `filmFX` scratches (`ukiyoe`)
3. `LOOK.rain` (`40.90–61.14s`) — Indigo rainy night platform & steam train (`watercolor`)
4. `LOOK.twilight` (`61.14–81.39s`) — Magenta-gold lighthouse studio & ocean waves (`risograph`)
5. `LOOK.night` (`81.39–101.63s`) — Deep midnight attic & spotlight (`neon` + `spotDark`)
6. `LOOK.dawn` (`101.63–142.11s`) — Star-Whale galaxy flight & rose-gold sunrise station (`neon` $\rightarrow$ `watercolor`)

**Escalating Motif:** The **9-Piece Glowing Star-Whale Jigsaw Puzzle (`回忆拼图: 0/9 -> 9/9`)**. Each chapter snaps new pieces into the 3×3 frame until `9/9` locks together at `106.7s` and transforms into the swimming `drawStarWhale`.

**Rhyme:** Opens with an `iris()` reveal on `whaleGirl` sitting alone on the dusk station bench (`0.0s`); ends at `142.11s` with `whaleGirl` and her companion sitting together on the same bench at sunrise, closing with an `iris()` on the completed 9/9 Star-Whale puzzle in the sky.

| Shot | Time (s) | Bars | Action, Locomotion & Camera Reads | Transition |
| :--- | :--- | :--- | :--- | :--- |
| **01** | `0.00–2.95` | `B(0)..B(4)` | Dusk station bench. `whaleGirl` sits holding the keepsake puzzle piece (`emotions`: `wistful` $\rightarrow$ `curious`). Camera slowly pushes in (`camBegin`). | `iris()` open |
| **02** | `2.95–5.48` | `B(4)..B(8)` | Close-up (`zoom=1.38`). Sea wind blows 9 glowing puzzle pieces out along `arcPt()` trajectories; `whaleGirl` jumps (`jump()`) in surprise (`emotions`: `surprised` $\rightarrow$ `panic`). | cut on action |
| **03** | `5.48–8.01` | `B(8)..B(12)` | Tracking pan (`camBegin` `480->740`). `whaleGirl` walks (`stroll()`) across the platform with full leg stride & arm swing while `CAST.miniWhale` floats beside her. | camera carry |
| **04** | `8.01–10.54` | `B(12)..B(16)` | Medium close-up (`zoom=1.32`). `whaleGirl` bends her knees (`kneel: 0->1->0`) to pick up glowing Piece #1 (`1/9`) from the platform floor. | cut on action |
| **05** | `10.54–15.60` | `B(16)..B(24)` | `whaleGirl` spins from 3/4 view to front (`turn()`), hops (`jump()`), and raises Piece #1 as the `1/9` puzzle board materializes. | pull back |
| **06** | `15.60–20.66` | `B(24)..B(32)` | Fast side-view run (`runTo()`, `smear`) across the promenade from `x=220` to `x=1040` as the camera tracks right. | `brushWipe()` sepia |
| **07** | `20.66–25.72` | `B(32)..B(40)` | **Beat Drop 1!** Sepia memory (`filmFX`). `whaleGirl` and `partnerWhale` stroll (`stroll()`) side-by-side down the sunlit street toward Piece #2 (`2/9`). | `brushWipe()` open |
| **08** | `25.72–30.78` | `B(40)..B(48)` | Seaside Coconut Stall (`椰子水很甜`). Both dance (`move('bounce')`) and clink fresh coconuts (`holdCoconut`) in `armR`/`armL`. | beat cut |
| **09** | `30.78–35.84` | `B(48)..B(56)` | Polaroid jump snapshot! Both leap (`jump()`) in front view as the camera flashes (`flash()`) and Piece #3 (`3/9`) sparkles between them. | flash cut |
| **10** | `35.84–40.90` | `B(56)..B(64)` | `whaleGirl` walks forward (`stroll()`) and throws a glowing paper plane along `arcPt()` across the bridge. | `curtains()` close |
| **11** | `40.90–45.96` | `B(64)..B(72)` | Theatre `curtains()` open on rainy night platform. `partnerWhale` walks (`stroll()`), hops (`jump()`) into `drawTrain()` (`inDoor` jamb layering), and `whaleGirl` steps after her reaching out. | `curtains()` open |
| **12** | `45.96–51.02` | `B(72)..B(80)` | POV Train Window Close-Up (`xz_shots.js` Shot D homage): `partnerWhale` cries (`feel('cry')`) and presses her hand to the glass as the carriage slides away (`4/9`). | cut on action |
| **13** | `51.02–56.08` | `B(80)..B(88)` | `whaleGirl` sprints (`runTo()`) along the wet platform chasing the accelerating steam locomotive, then stops and waves (`aR` wave). | camera pan |
| **14** | `56.08–61.14` | `B(88)..B(96)` | `whaleGirl` leaps (`jump()` + `arcPt()`) over rain puddles to catch Piece #5 (`5/9`) as locomotive steam fills the screen. | `smokeWipe()` |
| **15** | `61.14–66.21` | `B(96)..B(104)` | Smoke clears in the Twilight Lighthouse Studio (`risograph`). `whaleGirl` walks (`stroll()`) from the arched window to the easel holding a paintbrush (`holdBrush`). | `smokeWipe()` clear |
| **16** | `66.21–71.27` | `B(104)..B(112)` | Close-up at the easel (`zoom=1.34`): `whaleGirl` paints Piece #6 (`6/9`) into the glowing 3×3 puzzle frame. | match cut |
| **17** | `71.27–76.33` | `B(112)..B(120)` | Wide ocean tracking shot: the glowing paper airplane flies out the lighthouse window along `arcPt()` while `CAST.miniWhale` leaps over the waves. | camera pan |
| **18** | `76.33–81.39` | `B(120)..B(128)` | `whaleGirl` leaps (`jump()`) on the lighthouse balcony to catch Piece #7 (`7/9`). | `brushWipe()` night |
| **19** | `81.39–86.45` | `B(128)..B(136)` | Midnight attic under a warm `spotDark()` spotlight. `whaleGirl` kneels (`kneel`) beside the puzzle board holding Piece #8. | `brushWipe()` open |
| **20** | `86.45–91.51` | `B(136)..B(144)` | Close-up (`zoom=1.35`): `whaleGirl` snaps Piece #8 (`8/9`) into the frame (`emotions`: `determined` $\rightarrow$ `surprised` with `take`). | push in |
| **21** | `91.51–96.57` | `B(144)..B(152)` | Camera tilts up (`kf` `cy: 490->260`) to reveal the 9th Golden Heart Piece shining high in the starry sky. | tilt up |
| **22** | `96.57–101.63` | `B(152)..B(160)` | Pre-drop rooftop sprint (`runTo()`, `smear`) with `CAST.miniWhale` and `CAST.bionicPuppy` racing alongside! | cut on action |
| **23** | `101.63–106.69` | `B(160)..B(168)` | **Beat Drop 2!** `whaleGirl` leaps (`arcPt()`) into the starry sky with trailing starlight sparks and catches Piece #9 (`9/9`)! | `flash()` gold |
| **24** | `106.69–111.75` | `B(168)..B(176)` | All `9/9` puzzle pieces lock together in a starburst ring while `whaleGirl` spins (`spinView()`) in celebration! | starburst |
| **25** | `111.75–121.87` | `B(176)..B(192)` | The completed puzzle transforms into the giant swimming Bioluminescent Star-Whale (`drawStarWhale`); `whaleGirl` rides it across the night sky! | `brushWipe()` dawn |
| **26** | `121.87–132.00` | `B(192)..B(208)` | Dawn train pulls into the seaside station (`drawTrain`); the door opens and `partnerWhale` and `whaleGirl` walk (`stroll()`) toward each other for a joyful reunion! | `brushWipe()` open |
| **27** | `132.00–142.11` | `B(208)..end` | Sitting together on the station bench with coconuts (`椰子水很甜`); camera tilts up to the `9/9` Star-Whale puzzle in the dawn sky and closes with an `iris()`. | `iris()` close |
