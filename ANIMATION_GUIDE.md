# 《潮汐》动画指南

在修改场景前先读 [`STORYBOARD.md`](STORYBOARD.md)、[`CAST_BIBLE.md`](CAST_BIBLE.md) 与 [`src/timeline.js`](src/timeline.js)。本项目采用和代码渲染 MV 相同的拆分方式：角色、时间表、分镜和帧绘制相互独立。

## 不可变约束

- 原曲：根目录 `潮汐.MP3`，浏览器使用它的 `currentTime` 作为播放时钟。
- 时长：`31.843 s`；节拍草稿：`117 BPM`。
- 舞台：原生 `320 × 180`，展示时最近邻放大。
- 主角：只能从 `src/cast.js` 的 `whaleMaid` 素材读取，不使用运行时生图、外部 URL 或未保存图片。
- 每一秒：`secondCues` 至少有一个可见变化；每一行：`lyrics` 至少有识别卡与一种画面隐喻。
- 离线 MP4 统一通过 `tools/render_tide.py` 的 `pixel_finish()` 先落至 `320 × 180`，再用最近邻放大；不得在最后输出使用平滑放大、模糊或另一张未保存角色图。

## 项目职责

```text
src/timeline.js   修改歌词起止时间、镜头、每秒提示；不要在 app.js 写散乱秒数
src/cast.js       修改已经存在的素材路径与角色规则；不创建临时形象
app.js            绘制背景、保存姿势、歌词卡、歌词隐喻及播放器控件
STORYBOARD.md     复核每段应该调用的姿势和特效
```

## 保存姿势调用

调用 `drawWhale(context, x, y, scale, t, palette, options)`：

```js
// 开场：强制完整源片站姿
drawWhale(ctx, 235, 120, .9, t, palette, { sourceLocked: true, mood: 'wink' });

// 日记 / 距离：直接调用笔记本源片姿势
drawWhale(ctx, 176, 119, .92, t, palette, { laptop: true });

// 回忆 / 退守：直接调用捧脸源片姿势
drawWhale(ctx, 220, 123, .88, t, palette, { mood: 'surprise' });

// 中性段：按当前 pixel / cel / ink / neon 读取保存的对应 PNG
drawWhale(ctx, 151, 115, 1.0, t, palette, { mood: 'focus', dance: 1 });
```

对角色只允许保存姿势的可逆舞台变换：位移、节拍缩放、轻微旋转、压缩/拉伸、透明尾迹、环境遮挡和最近邻缩放。离线渲染器的 `ACTING_KEYS` / `actor_motion()` 采用模型表、情绪键、预备、take、过冲和停顿的结构；切换必须遵循“预备 → 水流/像素碎片变形 → 下一个清晰姿势”的因果顺序，并留出读姿势的停顿。不可重绘脸、改变服装、裁去鲸尾或用任何生成接口替换角色。

## 歌词卡规则

`activeLyric(t)` 从 `timeline.lyrics` 找到当前行。`drawOverlayEffects()` 必须同时绘制：

1. `歌词识别 · Lxx` 标识；
2. 当前歌词文本；
3. 对应 `motif`（海浪、远山、距离、退守、回忆或搜索）；
4. 强拍卡片边条，以及推进中的歌词语义事件。

歌词时间的修正仅发生在 `src/timeline.js`。完成试听后，检查每一个 `start` 是否和人声首字对齐。

## 验收

```bash
npm run check
```

然后播放整首歌并逐一检查：00、04、08、12、16、20、24、28 秒镜头边界；L01–L12 卡片；四个保存风格；以及末尾 31.843 秒是否正常停止。
