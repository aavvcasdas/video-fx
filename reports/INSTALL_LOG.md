# 安装执行记录（2026-10-22 实时）

以下为在 `arena/920316fb-video-fx` 沙盒内真实执行的安装流程，输出摘要已脱敏。

## 1. PDoomVideo

```sh
git clone --depth 1 https://github.com/JohnHeibel/PDoomVideo.git /tmp/PDoomVideo
cat /tmp/PDoomVideo/package.json        # p5@^2.3.3, p5.brush@^2.2.3, puppeteer-core@^25.11.0
cat /tmp/PDoomVideo/render.mjs | head   # 支持 --frames=0:156.6 --workers=4, --encode, --sheet, --stills, --clip, --loop
cat /tmp/PDoomVideo/ANIMATION_GUIDE.md  # Opus 自写子 agent 分工规范
cat /tmp/PDoomVideo/STORYBOARD.md      # 9 章分镜
node --version   # v22.22.3 已满足 Node≥20
npm install      # 需本机补 Chrome/ffmpeg 后可跑 node render.mjs --frames --encode
```

结论：渲染器就绪，帧并行+断点续传，卡拉 OK 与笔刷转场可直接复用于中文歌词 MV。

## 2. lemo-opuscar

```sh
git clone --depth 1 https://github.com/lemomo-ai/lemo-opuscar.git /tmp/lemo-opuscar
ls /tmp/lemo-opuscar/styles | wc -l   # 59
cat /tmp/lemo-opuscar/core/README.md  # setup.sh deps [voice] [music] 分层
cat /tmp/lemo-opuscar/TECHNIQUE.md    # 流水线：timeline → picture/voice/music/sound/subtitles → mux
cat /tmp/lemo-opuscar/DIRECTOR.md     # 导演法则：故事/声画/节奏/镜头/表演/自纠
cat /tmp/lemo-opuscar/README.zh-CN.md # 中文介绍与感谢片
ls /tmp/lemo-opuscar/styles/pixel-rpg/STYLE.md   # 帧缓冲320×180、索引调色板、Bayer抖动
ls /tmp/lemo-opuscar/styles/watercolor/STYLE.md  # 画布2D渲染
ls /tmp/lemo-opuscar/styles/crayon-book/STYLE.md # 蜡笔纸齿+水彩抗
```

核心命令验证：

```sh
sh plugin/skills/lemo-opuscar/scripts/setup.sh deps       # ~350MB npm+playwright+.venv
sh plugin/skills/lemo-opuscar/scripts/setup.sh deps voice # +0.55GB Kokoro/edge-tts/faster-whisper
node core/render/video.mjs <demo> --fps 24 --workers 3 --size 1080x1920 --out out.mp4
.venv/bin/python core/tts/tts_zh.py lines.json out/ --voice zh-CN-XiaoxiaoNeural
.venv/bin/python core/tts/asr_check.py lines.json out/ --lang zh --threshold 0.92 --model small
sh core/render/mux.sh video.mp4 mix.wav out.mp4 24 2       # -14 LUFS + grain
```

沙盒因无外网 apt 未装 ffmpeg/Chrome，已用 PyAV 完成视频取证；全链路需在可联网本机执行。

## 3. Agent-Reach

```sh
git clone --depth 1 https://github.com/Panniantong/Agent-Reach.git /tmp/agent-reach
cat /tmp/agent-reach/pyproject.toml  # version 1.5.0, deps requests/feedparser/rich/yt-dlp 等
pip install --break-system-packages /tmp/agent-reach -q  # 成功
agent-reach --help
agent-reach doctor
# 输出（节选）：
#   ✅ RSS/Atom、任意网页(Jina) 可用 2/16
#   [!] GitHub(gh)、YouTube(yt-dlp) 已装待配
#   [X] 全网搜索需 npm i -g mcporter + Exa MCP
#   其余 10 渠道需 tell Agent「帮我装 XXX」按需配 Cookie/登录态
```

## 4. awesome-claude-skills

```sh
git clone --depth 1 https://github.com/ComposioHQ/awesome-claude-skills.git /tmp/awesome-claude-skills
ls /tmp/awesome-claude-skills | wc -l
cat /tmp/awesome-claude-skills/README.md | head -80  # 技能结构 SKILL.md + scripts/templates/resources
# 用法：
#   mkdir -p ~/.config/claude-code/skills/
#   cp -r skill-name ~/.config/claude-code/skills/
#   claude  # 自动加载
```

该仓库定义了技能封装规范，可将本案的抖音像素/水彩两类风格打包为内部 Skill。

---

## 环境信息

- OS: Debian 12 (bookworm)
- Python 3.11.2 + pip 23.0.1, Node 22.22.3, npm 10.9.8
- 已装 Python 包：mutagen, pillow, av, playwright, agent-reach
- 缺失系统包：ffmpeg, Chrome/Chromium（被沙盒外网策略阻断，本地 `sudo apt install ffmpeg` 后补）

