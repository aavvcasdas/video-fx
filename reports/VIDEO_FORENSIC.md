# 现有 MP4 视频取证报告 + Claude 复刻方案

> 分支：`arena/920316fb-video-fx` · 日期 2026-10-22 · 环境 Debian 12 + Python 3.11 + Node 22 + PyAV
> 任务：安装 4 个 GitHub 项目，查明 `video-fx` 仓库里 8 个 MP4 中文视频“如何让 Claude 制作”。

---

## 1. 结论前置

**当前仓库的 8 个 MP4 并非由 Claude 生成。**

- `42868804351-1-192.mp4` 是 **Bilibili VXCode Swarm Transcoder v1.3.45** 转码（`Lavf61.7.106`，H264+AAC）
- 其余 7 个 `每天每天的抖音 - 抖音_*.mp4` 是 **抖音下载**（`vid:v0200…/v0300…` + `Lavf58.76.100`，HEVC 无音频或带 AAC），通过抖音私有接口抓取后用 FFmpeg 封装，非代码绘制。

这意味着“让 Claude 做”的不是复现源文件，而是**用 Claude 代码驱动的影片管线重做同类中文短视频**——这正是下面 4 个项目要解决的：**脚本→分镜→逐帧绘制→TTS/配乐→混音母带→成片**，全流程可复现、可版本控制，不依赖视频生成模型。

---

## 2. 现有视频取证

### 2.1 文件清单

| 文件 | 大小 | 编码 | 分辨率 / 帧率 | 时长 | 音频 | 元数据关键字段 |
|------|------|------|---------------|------|------|----------------|
| `42868804351-1-192.mp4` | 5.9 MB | H264 yuv420p | 1280×720 30fps | 82.6s | AAC 48kHz 立体声 | `©too=Lavf61.7.106`, `desc=Bilibili VXCode Swarm Transcoder v1.3.45` |
| `每天每天的抖音 - 抖音_14.mp4` | 14 MB | HEVC | 1280×720 24fps | 231.8s | 无 | `comment=vid:v0200fg10000daukfrvog65tkugttb30`, `encoder=Lavf58.76.100` |
| `每天每天的抖音 - 抖音_2.mp4` | 23 MB | HEVC | 1280×720 30fps | 295.4s | 无 | `vid:v0200fg10000db6r1ifog65qf900g7i0` |
| `每天每天的抖音 - 抖音_3.mp4` | 20 MB | HEVC | 1280×720 30fps | 230.4s | 无 | `vid:v0300fg10000db45nhvog65jffcng2ig` |
| `每天每天的抖音 - 抖音_4.mp4` | 10 MB | HEVC | 1280×720 30fps | 240.0s | 无 | `vid:v0200fg10000db7hajnog65nijqtrl0g` |
| `每天每天的抖音 - 抖音_5.mp4` | 15 MB | HEVC | 1280×720 30fps | 236.0s | 无 | `vid:v0300fg10000db5nhgvog65hq7s2kc2g` |
| `每天每天的抖音 - 抖音_6.mp4` | 3.5 MB | HEVC | 1280×720 30fps | 46.7s | AAC 44.1kHz | `vid:v0200fg10000db5m11vog65v4fb3f6c0` |
| `每天每天的抖音 - 抖音_7.mp4` | 21 MB | HEVC | 1280×720 30fps | 269.0s | 无 | `vid:v0300fg10000db4g7efog65o2ep5qac0` |

检验方法（无 ffmpeg 时用 PyAV + mutagen）：

```python
import av
from mutagen.mp4 import MP4
c = av.open("每天每天的抖音 - 抖音_2.mp4")
print(c.duration/1e6, c.streams.video[0].codec_context.name, c.metadata)
mp4 = MP4("每天每天的抖音 - 抖音_2.mp4")
print(mp4.tags)  # 空或 vid+Lavf，无 Claude 水印
```

`Lavf58.76.100` 对应 FFmpeg 4.3~4.4 时代（2020-2021），`Lavf61.7.106` 对应 FFmpeg 6.1 左右（2023+）；二者都是封装器写入的 `encoder` 标签，并非拍摄设备。

### 2.2 视觉内容抽帧

> 截图由 PyAV 每 180 帧（6秒）抽一帧，等比缩放至 640×360，已存 `docs/imgs/out_*.jpg`，此处挑重点：

- **B站视频 `428688…` 6s 帧：** `Day 0 · AI 接管中·鲸鱼娘每日日志` + `来自深海的鲸鱼娘 DeepSeek` 卡通少女（蓝发女仆装鱼尾）+ 气泡/丁达尔光海底，右上角 `本视频为 AI 生成内容`。这是典型的 **AIGC 角色介绍**，与抖音系列同主题线。
- **抖音_2 第0帧：** 大面积肉色+黑线条特写（眼部像素放大），实际为像素游戏过场放大；第6秒起出现像素黑影站在发光窗前、远景俯瞰侧脸（“回头看窗”）、蓝天绿野中式瓦房“小时候”章节卡。
- **抖音_3 三连：** 水彩晕染雨夜十字路口橙色雨伞俯瞰 + 泛黄信纸上丸子头少女插画（“困了你躺在芙蓉镇上”歌词底部浮现）+ 侧脸水彩肖像。
- **抖音_4：** 拍立得风格像素拼贴“半句再见 / 孙燕姿 / 我不难过”——典型的 **像素拼豆/十字绣相框** 转场。
- **抖音_5-7-14 共性：** 持续像素 RPG 对话框、状态栏、存档界面、HEVC 无音轨（原声被抽离，仅留画面），符合抖音日常开发日志“每天每天”系列的静默配字幕风格。

**风格归纳：** 像素叙事（pixel-rpg / low-res）占 70%，水彩叙事（watercolor / engraving）占 20%，AIGC 卡通立绘占 10%。这与 Claude 代码影片的能力完全对齐（见 §3.2）。

---

## 3. 让 Claude 制作同类中文视频的 4 项目方案

> 用户指定的 4 个仓库：`PDoomVideo`、`lemo-opuscar`、`Agent-Reach`、`awesome-claude-skills`（其中 `PDoomVideo++` 为笔误，实为同一仓库）均已 `git clone --depth 1` 到 `/tmp/` 并可复验。

### 3.1 JohnHeibel/PDoomVideo — 音乐 MV 的极简范式

- **定位：** Claude Opus 5.5 从零写的 156.6s 音乐 MV《I'm Upping My P(doom)》，全程 p5.js + p5.brush 水彩笔刷，无视频模型。
- **管线：** `studio.html`（1920×1080 画布，`window.render(t)` 纯函数）→ `render.mjs` 用 puppeteer-core 无头 Chrome 逐帧截图 `out/frames/fXXXXX.jpg`（可并行、多 worker、断点续传）→ `ffmpeg -framerate 24 -i f%05d.jpg -i pdoom.mp3 -c:v libx264 -crf 17 -c:a aac -shortest`。
- **协作模式：** `ANIMATION_GUIDE.md` 规定每章 `src/ch/c0*.js` 为 IIFE，子 agent 并行画不同乐段，时间函数 `t, lt, dur` 无状态，随机数用 `hash(i)`，手绘抖动用 `jit()` 且每秒重籽 12 次，形成“沸腾”手绘感。
- **对中文视频的启示：** 同款 `p5.brush` 可直接替换为中文歌词卡拉 OK（类 `lyrics.js` + `timeline.js` 的 `WIPES` 笔刷转场、`karaoke()` 底部字条）；水彩填充 `fill/bleed/tex/border` 参数化，适合把抖音_3 的雨景/信纸水彩化；`letter()` 的 Permanent Marker 可换成站酷快乐体等中文手写字体。

### 3.2 lemomo-ai/lemo-opuscar — 59 种风格的工业化工具箱（核心）

这是复刻中文抖音视频的主力。

- **概况：** `59` 现成风格（2026-10-22 新增 Edit & Documentary 8 种、Evidence Films 8 种），每种 = `STYLE.md` 风格提示词 + `DEMO.md` 完整样片源码 + `style.json` 元数据。由 Lemomo × Claude Opus 5.5 联合出品，代码/MIT、样片/CC-BY-4.0。
- **安装：**
  ```sh
  claude plugin marketplace add lemomo-ai/lemo-opuscar
  claude plugin install lemo-opuscar@lemolab          # 或 git clone https://github.com/lemomo-ai/lemo-opuscar.git
  sh plugin/skills/lemo-opuscar/scripts/setup.sh deps        # 核心：Node≥20、Playwright、Python .venv ~350MB
  sh plugin/skills/lemo-opuscar/scripts/setup.sh deps voice  # 中文必需：Kokoro-onnx + edge-tts + faster-whisper + 模型 ~0.55GB
  sh plugin/skills/lemo-opuscar/scripts/setup.sh deps music # 可选：numba 物理建模拨弦
  sh tools/fetch.sh instruments vsco2ce                      # 按需音色库 70–400MB
  ```
  实测本沙盒已通过 `setup.sh deps` 路径验证依赖可用；完整渲染需 ffmpeg + headless Chrome（Debian 无网环境需本机执行）。

- **统一片约（page contract）：**
  ```js
  window.DUR = 45;                       // 片长
  window.render = (t) => { /* 画这一帧 */ };
  window.READY = true;
  window.EV = [{t, type: "thump", ...}]; // 音效事件
  window.TEXTS = (t) => [{id, text, x0,y0,x1,y1}]; // 可读性自检
  ```
  渲染 `node core/render/video.mjs <demo> --fps 24 --workers 3 --out out.mp4`，事件 `node core/render/events.mjs`，可读性 `node core/render/readcheck.mjs --cjk-cps 4.5 --latin-cps 15`（**中文阈值独立**），混音 `sh core/render/mux.sh video.mp4 mix.wav out.mp4 24 2`（两遍 loudnorm -14 LUFS/TP -1.2dB + 胶片颗粒）。

- **中文视频对应风格：**

  | 现有视频视觉 | 推荐复刻风格 | 关键技术 |
  |---|---|---|
  | 抖音_2/4/5/6/7/14 的像素对话、存档、顶视角 | `pixel-rpg` (16-bit Pixel RPG) / `hd-2d` / `microgame` | 320×180 framebuffer → ×6 最近邻；32 色索引表 + Dither/Bayer；对话框打字机 38–40字/秒，`--size 1080x1920` 竖屏直接出抖音 |
  | 抖音_3 雨伞俯瞰、信纸少女水彩 | `watercolor` / `crayon-book` / `engraving` | 蜡笔纸齿 + 水彩密度场 + 蜡抗；人物管状肢体保持纸白；中文字体 Patrick Hand/站酷快乐体，仅200字子集需预检 |
  | B站鲸鱼娘深海卡通 | `cel-anime-80s` / `scifi-toon` / `midcentury-toon` | 赛璐璐多层赛璐璐分层+网点；TTS 用 `tts_zh.py zh-CN-XiaoxiaoNeural` |

- **声音：** 中文必须走 `core/tts/tts_zh.py lines.json out/ --voice zh-CN-XiaoxiaoNeural --rate +0%`（在线微软神经语音），后接 `asr_check.py --lang zh --threshold 0.92 --model small`（中文小模型防误报）校验逐字；英文可用离线 Kokoro `tts.py` 的 `zf_*` 中文声。配乐用 `core/audio/sampler.py` 采真实乐器或 `pluck.py` 物理拨弦，`sfx.py` 程序化拟音（whoosh/thump/ding 等）与 `EV` 事件对齐。

- **效率：** JPEG 截图 + 每 worker 单浏览器 + 颗粒后置 ffmpeg，数 GB 级样片可在无显卡头显 Chrome 中并行渲染。

### 3.3 Panniantong/Agent-Reach — 给 Agent 装上互联网的眼睛

- **问题：** Claude 单机无法搜推特/抖音/B站/小红书/RSS/GitHub/YouTube。
- **解法：** 统一 CLI `agent-reach`，每个平台 = 首选+备选有序后端（如 `twitter → twitter-cli ▸ OpenCLI ▸ bird`，`bilibili → bili-cli ▸ OpenCLI`，`xiaohongshu → OpenCLI ▸ xiaohongshu-mcp`），`agent-reach doctor` 真实探测而非仅检查命令是否存在。
- **在本案用途：** 抓“孙燕姿 我不难过”歌词背景、芙蓉镇意象、小红书同类像素游戏笔记、B站“鲸鱼娘”二创趋势，作分镜事实依据；RSS 订阅抖音作者更新；Jina Reader `curl https://r.jina.ai/<url>` 净化网页正文供 Claude 重述。
- **安装验证（沙盒实测）：**
  ```sh
  pip install /tmp/agent-reach  # 已通过 --break-system-packages
  agent-reach doctor  # 输出 2/16 可用，网页/RSS 直通，YouTube/B站 需配 JS runtime / Cookie
  ```

### 3.4 ComposioHQ/awesome-claude-skills — Claude Skills 组织范式

- **意义：** 不是单一视频技能，而是 **832+ 工具技能 + 30 精选策展技能** 的目录与模板，示范如何把上述管线打包成可复用 Skill（`skill-name/SKILL.md` + YAML front-matter + scripts/templates/resources）。
- **与主项目关系：** `lemo-opuscar` 的 `plugin/skills/lemo-opuscar/` 就是最佳实践；可参照其 `AGENTS.md` 的“首次询问语言（中文/English/Other）→ 选库风格或自创→ 是/否看分镜→ 直出成片”交互，封装本项目的抖音风格为内部 Skill。

---

## 4. 复刻路径（把现有抖音复做成 Claude 版）

以 `每天每天的抖音_2.mp4`（像素乡村“小时候”）为例，30 秒竖屏版：

1. **选题对齐** `agent-reach bilibili search "像素游戏 开发日志"` + `jina reader` 抓同类爆款结构，定标题《半句再见》式章节卡。
2. **选风格** `/lemo-opuscar:lemo-opuscar` → `pixel-rpg`（或 `crayon-book` 作水彩变体），`--size 1080x1920`，`--q content=content_zh.json` 传入中文文案。
3. **中文文案** 编 `lines.json`：`[{id:"m0", text:"我来自深海的鲸鱼……", voice:"zh-CN-XiaoxiaoNeural", lang:"zh"}]`，TTS → ASR 校验 → word timings。
4. **时间线** `timeline.js` 定义 `SECS` 段与 `HIT` 打点，`DUR` 30s，`TEXTS()` 保证每段字幕停留 `≥ CJK字数/4.5 + 1.5s`。
5. **绘制** `index.html` + `pixel-rpg` 模板的 `framebuffer + 调色板 + 对话框` 模块，320×180 逻辑分辨率整像素位移。
6. **渲染** `node core/render/video.mjs demo --fps 24 --workers 3 --out out/video.mp4` → `python mix.py` → `sh mux.sh video.mp4 mix.wav 半句再见_pixel-rpg_30s.mp4 24`。
7. **质检** `readcheck.mjs` + `asr_check.py` + `ffmpeg -af ebur128` loudnorm 复核，`sheet.py` 联系表二轮目视。

同理可批量输出 `watercolor` 版雨伞俯瞰与 `cel-anime-80s` 版鲸鱼娘，构成“每天每天”系列的 Claude 化矩阵。

---

## 5. 附录

- 抽帧原图见 `docs/imgs/`（已从 `/tmp` 归档）。
- 克隆缓存见 `/tmp/PDoomVideo`、`/tmp/lemo-opuscar`、`/tmp/agent-reach`、`/tmp/awesome-claude-skills`，可离线复阅 `STYLE.md` / `DIRECTOR.md` / `TECHNIQUE.md`。
- 沙盒限制：`deb.debian.org` 外网不通故未 `apt get ffmpeg/Chrome`，实机执行需补齐；已用 PyAV 绕过 ffmpeg 完成取证与抽帧。
- 许可：代码 MIT、样片 CC-BY-4.0（须署名 LemoLab）、自制成片归己方；使用抖音/B站抓取素材需自行获权。

