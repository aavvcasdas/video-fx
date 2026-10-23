# 潮汐 · 歌词卡点 MV 工作台

一个以仓库内 [`潮汐.MP3`](潮汐.MP3) 驱动的、代码绘制的歌词音乐视频项目。浏览器播放原曲时，画面以音频时间为时钟同步：**31.843 秒、117 BPM、8 段镜头、32 个逐秒事件、12 张歌词识别卡**。

> 本版不调用任何生图接口，也不创建新的主角形象。MV 只使用项目已经保存的鲸鱼娘素材：`hands.png`、`laptop.png`、`standing.png`，以及由同一站姿保存的 pixel RPG、赛璐璐、水墨、霓虹四种风格图。

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

## 已保存角色库（唯一可用主角）

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

笔记本和捧脸镜头始终使用准确的源片姿势；中性站姿根据风格切换到对应的已保存 PNG。它们会在原生 `320 × 180` 舞台中以轻微的整数位移和节拍缩放合成，随后最近邻放大；不会变形角色脸、服装、鲸尾或轮廓。

## PDoomVideo 式项目结构

```text
src/cast.js                              角色注册表与保存素材路径
src/timeline.js                          原曲、歌词草稿、镜头、逐秒事件的时间源
assets/cast/whale-maid/source/*.png      三张源片锁定姿势
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
3. **素材锁定**：主角只可调用 `src/cast.js` 声明的已保存鲸鱼娘素材。
4. **每秒有事发生**：`secondCues` 每一项都必须在画面中有可检查的动作、粒子、景别或 UI 变化。
5. **可复现**：`drawMV(t)` 只依赖时间、时间表、调色板和已保存资源；不使用无约束的随机状态。

点击“导出歌词蓝图”可下载 `tide-lyric-mv-blueprint.json`，其中包含音轨、歌词识别草稿、角色素材路径、镜头和逐秒事件，供后续离线帧渲染与 MP4 封装使用。

## 已输出 MP4

成片已在 [`output/tide-lyric-mv.mp4`](output/tide-lyric-mv.mp4)：**1280 × 720、24 fps、31.84 秒、H.264 + AAC**。它只合成已保存的七张鲸鱼娘参照图、代码背景/歌词卡和仓库内 `潮汐.MP3`。

可复现渲染器在 [`tools/render_tide.py`](tools/render_tide.py)。帧序列写入被忽略的 `render/tide-frames/`，以避免把中间 PNG 提交进仓库；最终 MP4 则保留并推送。
