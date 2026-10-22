# remotion-whale · 深海鲸鱼娘 Day 0 复刻工程

原片拆解见 [`../docs/ANALYSIS.md`](../docs/ANALYSIS.md)。本工程为数据驱动脚手架：**只改 `src/data/script.ts` 即可换题材重拍**。

## 快速开始（本地，需 Node 20+）

```bash
npm install
npm run studio     # Remotion Studio 逐帧预览
npm run stills     # 关键帧自检图 -> out/
npm run render     # 全片 -> out/whale-day0.mp4 （1280x720 / 30fps / 82.6s）
```

## 换上真实角色图

把 6 张透明底 PNG 放到 `public/char/`（命名见 `script.ts` 的 `POSE_ASSETS`：wave/proud/worried/laptop/wink/heart），然后渲染 `WhaleDay0-Png` 合成：

```bash
npx remotion render WhaleDay0-Png out/whale-day0.mp4
```

## 已知事项

- `script.ts` 时序为抽帧还原的近似值（±1s），2 句台词标了「待补」；接 TTS 后用词级时间戳回填。
- 沙箱环境无法下载 Chrome Headless Shell 且缺 `libnss3/libnspr4`，无头渲染请在本地执行；`tsc` 与 `remotion bundle` 已验证通过。
