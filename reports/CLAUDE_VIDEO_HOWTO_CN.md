# 用 Claude 做同款中文视频 · 实战手册

> 针对 `video-fx` 7 条抖音 + 1 条 B站视频的 Claude 复刻路径，聚焦“代码生视频”而非 Sora/可灵等生成模型。

## 思路一句话

**不生成视频，只写代码画每一帧**：`window.render(t)` 纯函数 + 无头 Chrome 截图 + FFmpeg 合成 + TTS/采样配乐 + loudnorm 母带。风格是“提示词”，内容是你的中文故事。

## 1. 选风格

打开可选库（59 种）：

```sh
# 技能模式（推荐）
claude plugin marketplace add lemomo-ai/lemo-opuscar
claude plugin install lemo-opuscar@lemolab
/lemo-opuscar:lemo-opuscar  # 选语言→ 选“库里挑”或“改成我的”或“空白起步”

# 或仓库模式
git clone https://github.com/lemomo-ai/lemo-opuscar.git && cd lemo-opuscar && claude
```

针对本仓库视频，建议：

- 日更像素对话 → `pixel-rpg` / `hd-2d` / `microgame` / `lowpoly-island`
- 雨景水彩 / 信纸插画 → `watercolor` / `crayon-book` / `engraving` / `ink-wash`
- 深海鲸鱼娘卡通 → `cel-anime-80s` / `midcentury-toon` / `scifi-toon`
- 版式歌词卡 → `swiss-motion` / `pictogram-motion` / `news-package`

每种风格的必读是 `styles/<slug>/STYLE.md`，它定义：用色、材质、字体、运镜、声音、忌讳。导演总纲在 `DIRECTOR.md`，技术总纲在 `TECHNIQUE.md`。

## 2. 准备中文素材

### 文案

用 `Agent-Reach` 搜齐事实：

```sh
agent-reach doctor                    # 看可用渠道
# 抖音/B站/小红书/YouTube/RSS/GitHub 按需
pip install browser-cookie3 playwright # 解锁 OpenCLI 渠道后可用浏览器登录态抓取
curl https://r.jina.ai/https://example.com/article  # 净化网页供 Claude 重写
```

### 配音

中文必须用微软神经声，经 `edge-tts` 在线：

```json
// lines.json
[
  {"id":"a01","text":"我来自深海的鲸鱼，大家好。","voice":"zh-CN-XiaoxiaoNeural","lang":"zh","rate":"+4%"},
  {"id":"a02","text":"今天是第二天，像素小屋盖好了。","voice":"zh-CN-YunxiNeural","lang":"zh"}
]
```

```sh
.venv/bin/python core/tts/tts_zh.py lines.json out/voice --voice zh-CN-XiaoxiaoNeural
.venv/bin/python core/tts/asr_check.py lines.json out/voice --lang zh --threshold 0.92 --model small
cat out/voice/dur.json  # 每句时长，供时间线对齐
```

英文可用离线 `tts.py`（Kokoro, `af_bella` 等 30+ 声），但其中文较平，不推荐。

### 配乐

```sh
sh tools/fetch.sh instruments vsco2ce  # 按需 70-400MB
# 或纯合成：无需下载，plucks/芯片音直接 numpy 生成
```

乐谱由 `timeline.js` 的 `SECS/HIT` 节拍表驱动，事件落在帧上 0ms 误差（`cuecheck.py` 校验）。

## 3. 建片文件夹

```sh
mkdir -p films/daily-vlog-02
cp -r /tmp/lemo-opuscar/styles/pixel-rpg/demo/* films/daily-vlog-02/  # 或从模板起
```

必需文件：

- `index.html` 暴露 `window.render(t)`、`window.DUR`、`window.EV`、`window.TEXTS(t)`
- `timeline.js` 单一信源的所有段、节拍、锚点
- `content_zh.json` 你的中文文案/数据
- `mix.py` 产 `mix.wav`（音乐+拟音+人声，duck/compress/limit）

## 4. 渲染与母带

```sh
LIB=$HOME/lemo-opuscar  # 或你的 clone 路径
cd $LIB

# 快检
node core/render/still.mjs ~/films/daily-vlog-02 0 6 12 --range 0:30:2
.venv/bin/python core/render/sheet.py out.jpg ~/films/daily-vlog-02/stills/*.jpg --cols 4 --w 480

# 事件与可读性
node core/render/events.mjs ~/films/daily-vlog-02
node core/render/readcheck.mjs ~/films/daily-vlog-02 --cjk-cps 4.5 --latin-cps 15 --pad 1.5 --min 1.5

# 成片（竖屏抖音示例）
node core/render/video.mjs ~/films/daily-vlog-02 --fps 24 --workers 4 --size 1080x1920 --out ~/films/daily-vlog-02/out/video.mp4
.venv/bin/python ~/films/daily-vlog-02/mix.py
sh core/render/mux.sh ~/films/daily-vlog-02/out/video.mp4 ~/films/daily-vlog-02/out/mix.wav ~/films/daily-vlog-02/每天每天的抖音_Claude_复刻.mp4 24 2

# 质检
ffmpeg -i ~/films/daily-vlog-02/每天每天的抖音_Claude_复刻.mp4 -af ebur128 -f null -
```

要点：

- 渲染是确定性的，可并行、断点续传、任意帧单测；动画用 `hash`/`mulberry` 而非 `Math.random()`。
- 中文可读性由 `TEXTS()` 保证，阈值 4.5 字/秒；低于阈值 `readcheck` 非零退出。
- 颗粒/扫描线等重噪声放 `mux` 的 ffmpeg 滤镜加，避免画布自噪致压缩膨胀。
- 竖屏只需改 `--size 1080x1920`，版式自动跟 `innerWidth/Height`。

## 5. 自建风格（把“每天每天”做成品牌）

`/lemo-opuscar:lemo-opuscar` 选“改一个库风格”或“空白起步”：

1. 逐题定：用途/平台/品牌色/logo/常驻角色/最多5处改动（安全改/改性质/不可改三档）
2. 看汇总→ 敲定
3. 看单帧样张（左原右新对比）→ 2 轮内调收敛
4. 看 15–30s 样片（含声）→ 1 轮修正
5. 满意后 `~/lemo-my-styles/<slug>/` 落盘，之后可如库风格般调用：`用我的 夜色浮世绘 风格做一条 30s 的……`

## 6. PDoom 分支技巧

若做歌词 MV，参考 `PDoomVideo` 的 `src/timeline.js + src/lyrics.js`：

- `chapter(name, start, end, [[t0, shotFn], ...])`，`shot(t, lt, dur)` 必须画满全帧
- `WIPES` 笔刷转场、`karaoke()` 底部色块+逐字高亮、`cornerMeter()` 数值挂件
- `p5.brush` 的 `paint(pts, {wash/fill/hatch/ink})` 与 `PAL` 调色板，中文描边建议 `inkfine` 0.8–1.6px

## 7. 常见坑

- 中文截字：`ZCOOL KuaiLe` 等子集仅 ~200 字，提前把文案字符集跑 `npm run build:fonts` 检查
- 音画对齐：所有声音由 `EV` 帧事件驱动，不用 `setTimeout`，否则并行渲染错位
- 竖屏版式：字幕下置、上部留安全边距 960px 以上（参考 PDoom 的 975–1070  karaoke 带）
- 授权：抓抖音/B站他站素材需获权；自制 Claude 片归自有。

---

做完即可在本仓库 `films/` 持续产出与现有 7 条抖音同调性的日更，且每条都可 Git 追溯、PR 评审、A/B 版 `--q` 并行渲染。
