# 《潮汐》动画指南

在修改场景前先读 [`STORYBOARD.md`](STORYBOARD.md)、[`CAST_BIBLE.md`](CAST_BIBLE.md) 与 [`src/timeline.js`](src/timeline.js)。本项目采用和代码渲染 MV 相同的拆分方式：角色、时间表、分镜和帧绘制相互独立。

## 不可变约束

- 原曲：根目录 `潮汐.MP3`，浏览器使用它的 `currentTime` 作为播放时钟。
- 时长：`31.843 s`；节拍草稿：`117 BPM`。
- 舞台：原生 `320 × 180`，展示时最近邻放大。
- 主角：只能依照 `src/cast.js` 的 `whaleMaid` 模型表与 `src/whale-pixel-rig.js` 绘制；不使用运行时生图、外部 URL、另一位角色或移动的 PNG 精灵。
- 每一秒：`secondCues` 至少有一个可见变化；每一行：`lyrics` 至少有识别卡与一种画面隐喻。
- 离线 MP4 先由 `tools/render_whale_rig.mjs` 写出共享 JS rig 的透明 `1280 × 720` 角色层；`tools/render_tide.py` 先将环境与歌词卡经 `pixel_finish()` 落到 `320 × 180` 的像素网格，再叠加全分辨率角色部件线稿。不得使用一张保存角色图、精灵表、Base64、像素运行数据或运行时图像读取。

## 项目职责

```text
src/timeline.js           修改歌词起止时间、镜头、每秒提示；不要在 app.js 写散乱秒数
src/cast.js               保存模型表路径与身份规则；不创建临时形象
src/whale-pixel-rig.js    手写 Canvas 组件、路径与渐变，绘制并动画鲸尾、分层卷发、五官、服装、手势与笔记本
src/storyboard-renderer.js 12 拍分镜板：锚点、因果、镜头、match-object 转场及角色表演键
app.js                    绘制背景、JS rig、分镜镜头、歌词卡、歌词隐喻及播放器控件
tools/render_whale_rig.mjs 逐帧调用同一 JS rig 与分镜表，写出透明角色层
STORYBOARD.md             复核每段应该调用的姿势和特效
```

## JS 鲸鱼娘 rig 调用

`drawWhale(context, x, y, scale, t, palette, options)` 委派给共享的 `WHALE_PIXEL_RIG.draw()`。所有姿势都是由相同的代码部件重新排演，而非选取图片：

```js
// 开场：站姿 + 温和的眨眼/视线
 drawWhale(ctx, 235, 120, .9, t, palette, { pose: 'stand', mood: 'wink' });

// 日记 / 距离：独立绘制笔记本和键盘
 drawWhale(ctx, 176, 119, .92, t, palette, { pose: 'laptop', mood: 'focus' });

// 回忆 / 退守：手臂与手移动到脸颊，嘴和眉独立改变
 drawWhale(ctx, 220, 123, .88, t, palette, { pose: 'hands', mood: 'surprise' });

// 搜索：发锁/尾巴跟随，眼神扫动，角色随节拍呼吸
 drawWhale(ctx, 151, 115, 1.0, t, palette, { pose: 'stand', mood: 'search', dance: true });
```

`src/whale-pixel-rig.js` 必须用 JavaScript 命名组件、Canvas 路径和渐变持续构造完整的尾巴、分层发量/高光、呆毛、发箍、耳鳍/蝴蝶结、眼白/虹膜/眼睑/高光、眉、嘴、腮红、手臂/手、裙装/围裙、鞋和笔记本；不可读取、嵌入、编码、描摹像素运行数据或移动模型表位图。情绪键至少改变两项可读细节；切换遵循“预备 → 窄幅转身/起跳 → 落点回弹 → 清晰读姿势”的因果顺序。离线生成器以相同参数调用该 rig。

## 歌词卡规则

`activeLyric(t)` 从 `timeline.lyrics` 找到当前行。`drawOverlayEffects()` 必须同时绘制：

1. `歌词识别 · Lxx` 标识；
2. 当前歌词文本；
3. 对应 `motif`（海浪、远山、距离、退守、回忆或搜索）；
4. 强拍卡片边条，以及推进中的歌词语义事件。

识别卡在每行人声起点弹入并在约一秒后退出，不可整行持续覆盖镜头焦点；退出后，当前镜头的物体、因果和反应必须独立读得懂。歌词时间的修正仅发生在 `src/timeline.js`。完成试听后，检查每一个 `start` 是否和人声首字对齐。

## 验收

```bash
npm run check
npm run render:rig
PYTHONPATH=/tmp/tide-render-libs python3 tools/render_tide.py --rig-frames render/whale-rig
```

然后播放整首歌并逐一检查：00、04、08、12、16、20、24、28 秒镜头边界；L01–L12 卡片；眨眼、单眨眼、视线、嘴形、手势、发锁和鲸尾的独立运动；以及末尾 31.843 秒是否正常停止。
