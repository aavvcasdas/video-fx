# 潮汐 · 歌词卡点 MV 工作台

一个以仓库内 [`潮汐.MP3`](潮汐.MP3) 驱动的、代码绘制的歌词音乐视频项目。浏览器播放原曲时，画面以音频时间为时钟同步：**31.843 秒、117 BPM、8 段镜头、32 个逐秒事件、12 张歌词识别卡**。

> 本版不调用任何生图接口，也不创建新的主角形象。七张已保存的鲸鱼娘图片仅作经批准的**模型表参照**；浏览器预览和最终 MP4 均由 `src/whale-pixel-rig.js` 逐部件绘制，绝不把 PNG 当作会移动的角色贴图。

## 运行

```bash
npm start
# http://localhost:4173
```

```bash
npm run check
```

点击播放后会播放本地 `潮汐.MP3`，并由它的 `currentTime` 驱动 Canvas。`Space` 播放/暂停，`←` / `→` 前后跳 1 秒，`S` 开关原曲音轨。

## 歌词识别与卡点

歌词、时间、镜头和逐秒细节都在 [`src/timeline.js`](src/timeline.js) 中。当前对齐是根据上传音频的 31.843 秒长度、节拍峰值与歌曲段落形成的**可编辑识别草稿**；如果听感需要微调，只修改该文件的 `lyrics` 起止时间，不要把时间散落到场景绘制函数中。

| 识别卡 | 歌词 | 画面隐喻 |
| --- | --- | --- |
| L01 / L07 | 蓝色的海底 | 顶光、波线、亮蓝色阶回灌 |
| L02 / L08 | 远山的风景 | 三层山脊、水面折射、像素横移 |
| L03 / L09 | 我们的距离遥不可及 | 两枚信标、断开的光缝、后拉镜头 |
| L04 / L10 | 退守的爱情 | 珊瑚色纸片与倒放尾迹 |
| L05 / L11 | 还剩下回忆 | 记忆泡泡、卡片显影、月牙聚拢 |
| L06 / L12 | 疯狂地寻觅你的身影 | 声呐圆环、搜索光标、标题碎片 |

每一秒都对应 `secondCues` 中的一个可见行为，播放画面顶部同时显示 `LYRIC Lxx` 识别卡、歌词、已过去时间和强拍高亮。

## 已保存角色模型表（唯一可用主角参照）

### 源片锁定姿势

| 姿势 | 文件 | 在《潮汐》中的使用 |
| --- | --- | --- |
| 捧脸惊讶 | `assets/cast/whale-maid/source/hands.png` | 回忆、退守、情绪 Build Up |
| 坐姿笔记本 | `assets/cast/whale-maid/source/laptop.png` | 远山日记、距离和搜索段 |
| 站姿眨眼与鲸尾 | `assets/cast/whale-maid/source/standing.png` | 开场源片锁定镜头、模型表 |

### 同一角色的保存风格参照

| 风格 | 文件 | 运行规则 |
| --- | --- | --- |
| 16 色像素 RPG | `assets/cast/whale-maid/styles/pixel-rpg.png` | `pixel` 模式的中性站姿 |
| 赛璐璐平涂 | `assets/cast/whale-maid/styles/cel-pop.png` | `cel` 模式的中性站姿 |
| 潮汐水墨 | `assets/cast/whale-maid/styles/ink-tide.png` | `ink` 模式的中性站姿 |
| 霓虹声呐 | `assets/cast/whale-maid/styles/neon-sonar.png` | `neon` 模式的中性站姿 |

这些图片保留为受控的视觉模型表，用来核对蓝发、白色荷叶边发箍、青蓝耳鳍/蝴蝶结、大蓝眼、围裙鲸标、长鲸尾、笔记本与捧脸读姿。构建时，`tools/build_whale_pixel_model.py` 将三个批准姿势透明像素化、量化为 120px 高的 Canvas 像素 run；运行时 `src/whale-pixel-model.js` 逐格重绘这个一比一的发型、服装、裙褶、尾巴、鞋、手势与笔记本模型。JS micro-rig 再叠加眼睑/瞳孔/高光、嘴形、腮红、发丝高光与尾巴波纹，因此眨眼、眨单眼、视线、嘴形、呼吸、跟随摆动与姿势转场仍可独立运动。

## PDoomVideo 式项目结构

```text
src/cast.js                              角色注册表与模型表路径
src/whale-pixel-model.js                 三个批准姿势的一比一像素 run（不含运行时图片读取）
src/whale-pixel-rig.js                   浏览器/离线共用的 JS 像素模型 + 微表情 rig
src/timeline.js                          原曲、歌词草稿、镜头、逐秒事件的时间源
tools/build_whale_pixel_model.py         从批准模型表可复现地构建像素 run
tools/render_whale_rig.mjs               将同一 JS rig 烘焙为透明角色层
assets/cast/whale-maid/source/*.png      三张源片锁定模型表
assets/cast/whale-maid/styles/*.png      四张已保存风格参照
assets/cast/whale-maid/manifest.json     来源、锁定细节与风格清单
CAST_BIBLE.md                            角色外形与姿势规则
STORYBOARD.md                            8 段《潮汐》歌词分镜
ANIMATION_GUIDE.md                       以时间纯函数绘制和审片规范
app.js                                   Canvas 场景、音频同步、歌词卡与 JSON 导出
```

## 制作规则

1. **时间表优先**：先修改 `src/timeline.js`，再改任何场景函数。
2. **歌词优先**：每个识别行必须有一张卡、一个构图动词和一个环境隐喻。
3. **身份锁定**：主角只可依照 `src/cast.js` 声明的已保存鲸鱼娘模型表；不得调用生图、外部 URL、另一位角色或运行时 PNG 精灵。
4. **部件动画**：主角必须由 `src/whale-pixel-rig.js` 的独立部件绘制；每个情绪键都应改变眼神、嘴形、眨眼、头发或鲸尾中的可读细节。
5. **每秒有事发生**：`secondCues` 每一项都必须在画面中有可检查的动作、粒子、景别或 UI 变化。
6. **可复现**：`drawMV(t)` 和离线 rig 只依赖时间、时间表、调色板和已保存模型表；不使用无约束的随机状态。

点击“导出歌词蓝图”可下载 `tide-lyric-mv-blueprint.json`，其中包含音轨、歌词识别草稿、角色素材路径、镜头和逐秒事件，供后续离线帧渲染与 MP4 封装使用。

## 已输出 MP4

成片已在 [`output/tide-lyric-mv.mp4`](output/tide-lyric-mv.mp4)：**1280 × 720、24 fps、31.84 秒、H.264 + AAC**。它只合成 JavaScript 绘制的鲸鱼娘角色层、代码环境/歌词识别卡和仓库内 `潮汐.MP3`。

可复现渲染分三步：先以 `PYTHONPATH=/tmp/tide-render-libs python3 tools/build_whale_pixel_model.py` 从批准模型表构建一比一 JS 像素 run；再运行 `node tools/render_whale_rig.mjs --frames=render/whale-rig`，它用 `@napi-rs/canvas` 逐帧调用与浏览器相同的 rig，写出 765 张透明 `320 × 180` 角色层；最后 `tools/render_tide.py --rig-frames render/whale-rig` 只合成这些 JS 层。逐句表演键会触发预备压缩、转身、落点回弹、停顿读姿势与独立微表情。成帧统一先落到 **320 × 180** 的像素舞台，再以最近邻放大到 1280 × 720，并进行克制的 8 阶色彩归并，因此人物、歌词卡、特效和环境处在同一像素语言中。

分镜仍按歌词给予明确的视觉目标：海面揭示、地图/远山、不可跨越的裂隙、声呐寻找、潮汐回灌、墨色山景、记忆月亮和霓虹终场。歌词卡出现时，歌词语义图形也持续推进。帧序列写入被忽略的 `render/tide-frames/`，以避免把中间 PNG 提交进仓库；最终 MP4 则保留并推送。
