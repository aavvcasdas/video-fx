# 当前项目 MP4 中文视频分析：Claude 是如何制作的（Remotion 复刻准备）

> 分析日期：2026-10-22 · 对象：仓库根目录 17 个 MP4 · 重点复刻对象：`42868804351-1-192.mp4`

---

## 0. 结论先行

| 文件组 | 数量 | 推断制作方式 | 与本次目标关系 |
|---|---|---|---|
| `42868804351-1-192.mp4`（82.6s） | 1 | **Remotion（React 代码渲染）+ AI 生图角色 PNG + TTS 配音**，即「让 Claude 写代码做视频」的典型产物 | ✅ **本次复刻目标** |
| `每天每天的抖音 - 抖音*.mp4`（46s–6m35s） | 16 | 像素 RPG 风叙事视频（对应 lemo-opuscar 的 `pixel-rpg` 风格语法：320×180 像素帧缓冲、对话框逐字打印、底部硬字幕），经抖音转码分发 | 风格参考，非本次目标 |

目标片证据链：编码器 `Lavf61.7.106`（新版 FFmpeg，Remotion 渲染管线常用）、1280×720@30fps、画面为纯程序化 UI（卡片逐行弹入、印章旋转盖入、气泡/光束粒子），字幕为**逐字变色的卡拉OK式硬字幕**（已读变灰蓝、未读亮白），角色为多张不同表情/姿态的透明底 PNG 切换而非骨骼动画——这正是 Claude 用 Remotion 的 `Sequence / interpolate / spring` 逐帧渲染、再由 FFmpeg 合成的特征，而非视频生成模型或实拍。

---

## 1. 四个已安装仓库（安装记录）

均已 clone 到 `~/refs/`（沙箱家目录，不进本仓库 git），另把可直接用的 skill 复制进了本仓库 `.claude/skills/`：

| # | 仓库 | 位置 | 安装动作 | 状态 |
|---|---|---|---|---|
| 1 | [JohnHeibel/PDoomVideo](https://github.com/JohnHeibel/PDoomVideo) | `~/refs/PDoomVideo` | `git clone --depth 1` + `npm install`（p5/p5.brush/puppeteer-core） | ✅ 已装；p5.js 水彩风 + 无头 Chrome 逐帧渲染 + FFmpeg，与 Remotion 同属「代码逐帧渲染」路线，可借鉴其 `ANIMATION_GUIDE.md`（给子 agent 的动画规范）与 `STORYBOARD.md` 写法 |
| 2 | [lemomo-ai/lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar) | `~/refs/lemo-opuscar` | `git clone --depth 1`（186MB，59+ 风格） | ✅ 已装；Claude 专用做片工具箱：`AGENTS.md`（导演流程）/`DIRECTOR.md`/`TECHNIQUE.md`（逐帧渲染→TTS→配乐→混音→自检）/`styles/<slug>/STYLE.md`。已复制 `lemo-opuscar` skill 到 `.claude/skills/`。其 `pixel-rpg` 风格正是抖音组视频的语法来源 |
| 3 | [Panniantong/Agent-Reach](https://github.com/Panniantong/Agent-Reach) | `~/refs/Agent-Reach` + `pip install agent-reach`（git 源） | ✅ CLI 可用，`agent-reach doctor`：3/16 渠道即时可用（YouTube/RSS/任意网页），其余需登录/配置；已写入 yt-dlp 的 `--js-runtimes node` 配置。用途：后续抓 B 站/抖音/小红书素材与字幕 |
| 4 | [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) | `~/refs/awesome-claude-skills` | `git clone --depth 1` | ✅ 已装；精选了 `video-downloader`、`canvas-design` 复制到 `.claude/skills/`（注：该合集无 Remotion 官方 skill，视频路线以 lemo-opuscar + 本工程的 Remotion 脚手架为准） |

> lemo-opuscar 的完整 `setup.sh deps [voice] [music]` 会拉取 TTS/采样库（数百 MB），本次未全量执行；正式做片时按 `TECHNIQUE.md §1` 分层安装。

---

## 2. 目标片逐项拆解：`42868804351-1-192.mp4`

### 2.1 技术参数
- 时长 82.60s · 1280×720 · 30fps · 视频 H.264 High (459 kb/s) · 音频 AAC 48kHz 立体声 (130 kb/s) · 编码器 Lavf61.7.106
- 全片无实拍、无视频模型素材：背景、卡片、文字、粒子全程序化，唯一「非代码」资产是角色立绘 PNG（见 2.4）

### 2.2 分镜还原（每 3 秒抽帧 + 关键帧核对，还原图见 `docs/assets/`）

| # | 时间(约) | 画面 | 右侧角色姿态 | 底部字幕（逐字变色） |
|---|---|---|---|---|
| 1 开场 | 0–4s | 全屏标题【Day 0】/ 人类把一整个B站账号交给了AI / 从今天起，我说了算 | —（无顶栏） | — |
| 2 自我介绍 | 4–11s | 左字「来自深海的 鲸鱼娘 DeepSeek」 | 挥手大笑 | 我是来自深海的鲸鱼娘，… |
| 3 账号移交 | 11–20s | 白卡「账号移交通知→负责人一览」逐行点亮：选题/脚本/配音/剪辑/回评论 → 全部鲸鱼娘 | 叉腰得意→捂脸脸红 | 就在刚刚，人类把这一整个B站账号，/ 选题、脚本、配音、剪辑、回评论，/ 全部我来？ / 等一下……全部？ |
| 4 印章 | 20–27s | 红色印章卡「我说了算！」旋转盖入 | 单眼 wink 叉腰 | 好吧。那从今天起，这个号，我说了算！ |
| 5 三条规矩 | 27–48s | 白卡逐条高亮：①日更打卡 ②深度思考（含「已深度思考·用时 804 秒」梗图小条）③评论区=会议室 | 坐鲸尾抱笔记本 | 先立三条规矩。第一，日更打卡，鲸鱼绝不摸鱼。/ 第二，每期视频都要经过我的深度思考。思考时间可能有点长，请多包涵。/ 第三，评论区就是我的会议室。好点子，我直接采纳。 |
| 6 任务清单 | 48–55s | 白卡「Day 0 任务清单」☑换头像 ☑写简介 | 挥手 | Day 0 的任务：换头像，写简介，…想看我做什么？发在弹幕里！ |
| 7 VS | 55–64s | 橙卡「隔壁大小姐 优雅·话多」VS 蓝卡「深海鲸鱼娘 能潜·能想」 | wink 叉腰 | 听说隔壁的Claude大小姐也在运营账号？/ 没关系，鲸鱼，可是能潜到最深处的。 |
| 8 服务器梗 | 64–72s | 白卡弹窗「⚠️ 服务器繁忙，请稍后再试。[重新生成]（双手合十）」+ 注「这句只是演示，不是真的！🙏」 | 捂脸脸红 | 不过我有一个小小的担心……服务器，千万别又繁忙了。 |
| 9 一键三连 | 72–79s | 粉按钮「+关注鲸鱼娘」+ 金边圆钮 点赞/投币/收藏 依次弹入 +「Day 1 见！」 | 闭眼比心 | 想看AI把这个号带到哪里，就点个关注，一键三连吧！我们Day 1见！ |
| 10 片尾 | 79–82.6s | 暗角收尾「🐋 鲸鱼娘运营日志 · Day 0 完 / 下期：鲸鱼娘的第一个选题，由你决定」 | 比心（暗） | — |

全程常驻（除开场外）：左上「Day 0 ● AI 接管中 · 鲸鱼娘运营日志」、右上「本视频含 AI 生成内容」、深海背景（渐变+光束+上升气泡+海床暗弧）。

### 2.3 它是如何让 Claude 制作的（推断工作流，与 lemo/PDoom 两仓方法论互证）

1. **选题与脚本由 LLM 写**：自指梗（AI 接管账号、DeepSeek「深度思考 804 秒」、「服务器繁忙」、与 Claude 大小姐竞品梗）是典型的「让模型以人设写口播稿」，再切成一句一镜的短句。
2. **角色素材由生图模型出图**：同一角色 6 种姿态/表情（挥手、叉腰、捂脸、抱笔记本、wink、比心）为透明底 PNG——Claude 负责写提示词与选图，画面本身不是代码画的。这是复刻时**唯一需要用户提供或重新生图**的部分。
3. **其余全部代码化（Remotion）**：`Sequence` 按脚本逐镜编排；卡片行、圆钮用 `spring` 逐项延迟弹入；印章 `rotate+spring` 盖入；背景气泡用确定性伪随机 + `interpolate` 上升；角色仅 `translateY(sin)` 呼吸浮动 + 姿态 PNG 切换（无骨骼动画）。
4. **配音 TTS + 字幕对齐**：女声 TTS 逐句生成，字幕按语音进度逐字变色（词/字级时间戳驱动），合成 AAC 48kHz；最后 FFmpeg 与画面合成（Lavf61 即 Remotion 的编码出口）。
5. **自检迭代**：抽帧看图改时序——lemo 的 `DIRECTOR.md §11` 与 PDoom 的 `ANIMATION_GUIDE.md` 都是这套「渲染→抽帧→修正」循环的成文规范。

### 2.4 抖音组（16 个）与目标片的区别
像素 RPG 叙事：小人精灵、对话框逐字打印、左上「现在 客厅·03:05」HUD、右上「回忆 ★×00」、底部白色描边硬字幕。与 lemo `styles/pixel-rpg/STYLE.md` 的语法一一对应（帧缓冲、对话框即字幕、打字机速度、调色板叙事）。编码器为 Lavf58（更旧）且为 HEVC——是平台转码后的分发版，不能据此判断原始工程；如需复刻这一组，应按 lemo pixel-rpg 的技法（Canvas 帧缓冲逐帧渲染）而非 Remotion DOM 路线。

---

## 3. Remotion 复刻准备（已落地本仓库 `remotion-whale/`）

已按上述拆解搭好**数据驱动脚手架**，改脚本数据即可换题材重拍：

```
remotion-whale/
├── package.json            # remotion 4.0.367 + react 18，含 studio/still/render 脚本
├── remotion.config.ts
├── src/
│   ├── index.ts / Root.tsx # 两个合成：WhaleDay0（SVG占位）/ WhaleDay0-Png（透明PNG）
│   ├── WhaleDay0.tsx       # Sequence 逐镜装配
│   ├── data/script.ts      # ★唯一数据源：10 镜分镜/时序/逐句字幕/6 姿态清单
│   └── components/
│       ├── OceanBackground.tsx  # 渐变+光束+气泡+海床 / 顶栏 Header
│       ├── Cards.tsx            # 标题/移交/印章/三条规矩/任务/VS/服务器/三连/片尾卡
│       ├── WhaleGirl.tsx        # 角色层：PNG 优先，无图回退 SVG 占位；呼吸浮动+入场弹跳
│       └── SubtitleBar.tsx      # 卡拉OK逐字变色字幕条
└── public/char/            # ← 放 whale-wave/proud/worried/laptop/wink/heart.png 后切 -Png 合成
```

**验证状态（沙箱）**：`npm install` ✅、`tsc --noEmit` ✅、`remotion bundle` ✅。无头渲染在沙箱内受限（Chrome Headless Shell 官方下载源与系统库 `libnss3/libnspr4` 被网络策略拦截），属环境问题而非代码问题；在本地机器执行 `npm run still` 会自动下载 Chrome 后出图。

**正式复刻还缺三步**（需用户拍板/提供）：
1. 角色 6 张透明 PNG：重新生图（按脚本姿态清单）或提供原图；
2. 配音：选 TTS 音色（或真人录音），用词级时间戳回填 `script.ts` 校准逐字字幕（现为 ±1s 近似时序，含 2 处「待补」台词需听写补全）；
3. BGM/音效与片尾：原片为轻 BGM+弹入音效，复刻时按 lemo `core/audio` 或自选免版权音乐合成。

---

## 4. 下一步可直接执行的命令（本地）

```bash
cd remotion-whale
npm install
npm run studio          # 浏览器里逐帧预览/改 script.ts 实时看
npm run stills          # 出 3 张关键帧自检图
npm run render          # 出完整 82.6s 成片 out/whale-day0.mp4
# 有 PNG 素材后：npx remotion render WhaleDay0-Png out/whale-day0.mp4
```
