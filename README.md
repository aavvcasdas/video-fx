# video-fx

> 分支 `arena/920316fb-video-fx` · 中文视频让 Claude 制作的完整取证 + 复刻方案。

## 快速看结论

当前仓库的 8 个 MP4 **并非 Claude 生成**：`428688…` 来自 B站转码，7 个 `每天每天的抖音_*.mp4` 来自抖音私有接口下载（`vid:` + `Lavf58.76.100` HEVC，大多无音轨）。真正的“让 Claude 做”是**用代码画每一帧**的工业化管线：`window.render(t)` + 无头 Chrome + FFmpeg + TTS/采样配乐 + loudnorm 母带，这在下面 4 个项目里已产品化。

## 4 个已安装项目

| 项目 | 用途 | 本地验证 |
|------|------|----------|
| [JohnHeibel/PDoomVideo](https://github.com/JohnHeibel/PDoomVideo) | 156s 音乐 MV 范式：p5.js 水彩笔刷，帧并行，卡拉 OK 底部条 | `git clone /tmp/PDoomVideo` · `render.mjs --frames/--encode` 就绪 |
| [lemomo-ai/lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar) | **主力**：59 种风格工具箱，每种 `STYLE.md` + 样片源码，中文 TTS + 可读性 `4.5字/秒` | `git clone /tmp/lemo-opuscar` · 61 个风格已列（含新增） |
| [Panniantong/Agent-Reach](https://github.com/Panniantong/Agent-Reach) | 给 Agent 装眼睛：B站/抖音/小红书/YouTube/RSS/网页 `doctor` 探测 | `pip install /tmp/agent-reach` · `agent-reach doctor 2/16 可用` |
| [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) | Claude Skills 封装规范与范例 | `git clone /tmp/awesome-claude-skills` |

一键重跑安装脚本：`bash scripts/install_all.sh`

## 本仓库现有视频怎么用 Claude 重做

- 抖音像素叙事（`每天每天_2/4/5/6/7/14`）→ `lemo-opuscar/styles/pixel-rpg`（320×180 帧缓冲 + 索引调色板 + 对话框打字机 40字/秒，`--size 1080x1920` 竖屏直出）
- 雨夜水彩/信纸少女（`抖音_3`）→ `watercolor` / `crayon-book`（蜡笔纸齿 + 水彩密度 + 蜡抗，站酷快乐体）
- 深海鲸鱼娘卡通（`428688…`）→ `cel-anime-80s` / `scifi-toon`（赛璐璐分层 + 微软神经声 `zh-CN-XiaoxiaoNeural`）

详细映射见 `reports/VIDEO_FORENSIC.md §3–§4`，分步手册见 `reports/CLAUDE_VIDEO_HOWTO_CN.md`。

## 文档导航

- **取证 + 复刻方案**：`reports/VIDEO_FORENSIC.md`（含元数据表与抽帧图 `docs/imgs/`）
- **安装实录**：`reports/INSTALL_LOG.md`
- **实战手册**：`reports/CLAUDE_VIDEO_HOWTO_CN.md`（选风格→文案→TTS→渲染→母带→自建风格）
- **中文像素样张**：`demo-chinese-pixel.html`（浏览器打开拖动时间轴预览，可改 `--size 1080x1920`）
- **复现脚本**：`scripts/install_all.sh`

## 在本机跑一条 30s 竖屏

```sh
# 1. 按技术文档装齐三层依赖（首次 ~350MB + 声 ~0.55GB）
sh plugin/skills/lemo-opuscar/scripts/setup.sh deps voice

# 2. 以 pixel-rpg 复刻“小时候”章节
LIB=~/lemo-opuscar
node $LIB/core/render/video.mjs films/daily-vlog-02 --fps 24 --workers 4 --size 1080x1920 --out films/daily-vlog-02/out/video.mp4
.venv/bin/python core/tts/tts_zh.py lines.json out/voice --voice zh-CN-XiaoxiaoNeural
.venv/bin/python films/daily-vlog-02/mix.py
sh $LIB/core/render/mux.sh films/daily-vlog-02/out/video.mp4 films/daily-vlog-02/out/mix.wav 每天每天_Claude版.mp4 24
```

> 沙盒无外网 apt，已用 PyAV 完成取证与抽帧；ffmpeg/Chrome 需本机补齐。上游风格与音频库详见 `/tmp/lemo-opuscar/{core/README.md,TECHNIQUE.md,DIRECTOR.md}`。
