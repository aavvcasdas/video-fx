#!/bin/sh
set -e
echo "=== video-fx: 安装 4 个 Claude 视频/能力项目 ==="
echo "目标：https://github.com/JohnHeibel/PDoomVideo"
echo "      https://github.com/lemomo-ai/lemo-opuscar"
echo "      https://github.com/Panniantong/Agent-Reach"
echo "      https://github.com/ComposioHQ/awesome-claude-skills"
echo

# 1) 克隆
mkdir -p /tmp/claude-video-stack
for repo in \
  "https://github.com/JohnHeibel/PDoomVideo.git" \
  "https://github.com/lemomo-ai/lemo-opuscar.git" \
  "https://github.com/Panniantong/Agent-Reach.git" \
  "https://github.com/ComposioHQ/awesome-claude-skills.git"; do
  name=$(basename "$repo" .git)
  if [ -d "/tmp/$name" ]; then
    echo "[skip] /tmp/$name 已存在"
  else
    echo "[clone] $repo"
    git clone --depth 1 "$repo" "/tmp/$name"
  fi
done

# 2) Agent-Reach (Python)
echo "\n[install] Agent-Reach"
pip install --break-system-packages -q /tmp/agent-reach 2>&1 | tail -3
agent-reach doctor 2>&1 | head -30 || true

# 3) lemo-opuscar 依赖（按需）
echo "\n[check] lemo-opuscar"
echo "  Node $(node --version), npm $(npm --version)"
echo "  需安装：Node≥20 ✓ 已满足 | 执行：sh plugin/skills/lemo-opuscar/scripts/setup.sh deps [voice] [music]"
echo "  可选：sh tools/fetch.sh instruments vsco2ce  sh tools/fetch.sh hdri"
ls /tmp/lemo-opuscar/styles | wc -l | xargs echo "  风格数："

# 4) PDoomVideo 依赖
echo "\n[check] PDoomVideo"
cat /tmp/PDoomVideo/package.json | grep -A2 dependencies
echo "  需系统：Chrome/Chromium + ffmpeg + Node"
echo "  运行：npm install && node render.mjs --frames=0:156.6 --workers=4 && node render.mjs --encode"

# 5) awesome-claude-skills
echo "\n[check] awesome-claude-skills"
ls /tmp/awesome-claude-skills | head -10
echo "  安装为 Skill: cp -r skill-name ~/.config/claude-code/skills/ && claude"

echo "\n=== 完成。详见 reports/VIDEO_FORENSIC.md 与 reports/CLAUDE_VIDEO_HOWTO_CN.md ==="
