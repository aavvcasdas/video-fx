# MV 质量缺陷清单（用户反馈 → 逐条修复记录）

> 记录时间：2026-10-24
> 记录人：Agent（Arena Agent Mode）
> 处理顺序：**先记录 → 再扩充动作库 → 最后逐条修复**

用户原话（保留）：

> `mv_ba_huiyi_pinhao_gei_ni_whale_girl.mp4` 明确是最好的动作什么的都是但是歌词和字幕不匹配，
> 其他的参考下 `mv_ba_huiyi_pinhao_gei_ni_whale_girl.mp4` 是如何作的，
> `mv_pengyou_de_jiu_whale_girl.mp4`、画面不错但是歌词和字幕不匹配，
> `mv_chaoxi_whale_girl.mp4` 不好甚至字幕对不上，
> `mv_douyin_6_whale_girl.mp4`、`mv_feng_whale_girl.mp4`、`mv_huainvhai_whale_girl.mp4`、
> `mv_jimo_yanhuo_whale_girl.mp4`、`mv_meiguihua_de_zangli_whale_girl.mp4`、
> `mv_suyan_whale_girl.mp4`、`mv_xinqiang_whale_girl.mp4` 拉一直循环几个画面细节太少，
> `mv_lianai_ing_whale_girl.mp4` 也是并且没有字幕，
> `mv_ba_huiyi_pinhao_gei_ni_whale_girl.mp4` 唯一一个场景不重复的但是动作太少了，
> `mv_ba_huiyi_56_whale_girl.mp4` 是最垃圾的。

---

## 0. 缺陷编号总表

| ID | 影片 | 问题类型 | 现象 | 根因 | 状态 |
|:--|:--|:--|:--|:--|:--|
| **P01** | 全部 10 部 | 歌词 / 字幕不同步 | 字幕比人声早或晚，或整段错位 | 字幕时间轴是**手写估算**（`SUBS_*` 表），从未与音轨核对 | 已修复 |
| **P02** | `ba_huiyi_pinhao_gei_ni`（142s 拼图版，用户认为最好） | 歌词 / 字幕不同步 + 动作偏少 | 画面/镜头最好，但 56 格分镜每格只有 1 个静态姿势，字与唱不符 | 每格只有 1 个 `act`，且 `LYRICS` 用固定 BPM 网格推算，未对齐真实人声 | 已修复 |
| **P03** | `pengyou_de_jiu` | 歌词 / 字幕不同步 | 画面不错，字幕与人声错位 | 手写时间表 + 只按 94s 周期循环 | 已修复 |
| **P04** | `chaoxi` | 歌词 / 字幕对不上 + 画面差 | 8 句歌词是**新写的**，不是参考片原词；AI 腔霓虹背景，只有 4 个 ACT | 未从参考片取材；`SUBTITLES` 为杜撰文本 | 部分修复 |
| **P05** | `lianai_ing`（恋爱ing） | **没有字幕** + 画面循环 | 字幕只写在终端窗口里，被场景吃掉；场景 11 个但每个都只有 1 个姿势 | 字幕渲染依附在终端场景里，没有独立字幕层 | 已修复 |
| **P06** | `ba_huiyi_56`（56s 版，用户评为最差） | 画面/动作最差 | 17 句 / 17 个扁平场景，角色几乎不动 | 只用 `whaleGirl(..., {emotions})` 静态站立，无位移、无镜头运动 | 已修复 |
| **P07** | `feng` / `huainvhai` / `meiguihua` / `suyan`（4 部长片） | 画面循环、细节少 | 4 个场景按时间片循环套用，同一镜头反复出现 | 场景判定是 `if (t in range)` 的 3-4 段硬编码，各段内部完全静止 | 已修复 |
| **P08** | `jimo_yanhuo` / `xinqiang` / `ribuluo` / `douyin_6` | 画面循环、细节少 | 同上，几个镜头来回循环 | 同上 | 已修复 |
| **P09** | 全部 | **动作库太小** | 只有 5 个立绘姿势（`wave/wink/panic/laptop/heart`），MV 里反复出现同样画面 | `whale_girl.js` 只有 5 pose，且手臂骨骼只有 `wave` 一支 | 已修复（见 §1） |
| **P10** | 全部 | 缺少“准备→表演→恢复”的表演结构 | 动作切换是硬切，没有起势/收势 | 无动作调度层 | 已修复（见 §1） |
| **P11** | 全部 | 缺少镜头语言 | 大部分时间固定机位、固定景别 | 未使用 `camBegin/camEnd` 的多机位 | 已修复 |
| **P12** | 全部 | 字幕可读性 | 部分场景字幕压在花色背景上 | 字幕层与场景层未分离 | 已修复 |

### 修复结果摘要（详见 `docs/REWORK_V2.md`）

| 影片 | 改造前 | 改造后（镜头 / 布景 / 动作） |
|:--|:--|:--|
| 把回忆拼好给你 56s | 17 句 / 17 个扁平场景 | 29 / 12 / 17 |
| 把回忆拼好给你 142s | 56 格各 1 个静态姿势 | 55 / 15 / 19 |
| 恋爱ing | 无字幕、画面循环 | 22 / 11 / 16 |
| 寂寞烟火 | 画面循环 | 29 / 10 / 16 |
| 心墙 | 画面循环 | 14 / 10 / 14 |
| 日不落 | 画面循环 | 20 / 11 / 15 |
| 仿生小狗（抖音_6） | 画面循环 | 18 / 10 / 14 |
| 去年夏天 | 画面循环 | 41 / 11 / 15 |
| 坏女孩 | 4 个场景循环、**渲染不出** | 110 / 13 / 18 |
| 枫 | 同上 | 97 / 14 / 16 |
| 玫瑰花的葬礼 | 同上 | 124 / 13 / 15 |
| 素颜 | 同上 | 113 / 14 / 17 |
| 潮汐 | 4 个动作、杜撰歌词 | 16 / 9 / 14 |
| 朋友的酒 | 只按 94s 循环 | 64 / 12 / 15 |

全部 14 部：相邻镜头布景重复 0、相邻动作重复 0，字幕从 0 秒到片尾连续（空镜填满间奏）。

---

## 1. 动作库扩充（先做，作为后续所有修复的基础）

参考项目：

1. **[YunYueSama/codex-deepseek-pet](https://github.com/YunYueSama/codex-deepseek-pet)** — 《大肥鱼 🐋 蓝色鲸鱼娘桌宠》
   - `docs/2D角色与动作规范.md`：散步（转向→缓起步→完整步态→减速→收步）、吃东西（取食→举起→咬食→咀嚼→放下）、
     跳跃与落地（屈膝→离地→腾空→接地→压缩回弹→站稳）、入睡/起身、托腮想题、掰指头验算、哼歌（含“被发现”分支）、
     藏 token、想通忍笑、等待晃脚、揉眼伸懒腰、偷看工作进度。
   - `docs/工作与思考小动作设计.md`：动作必须走“**准备 → 表演 → 恢复**”，且不能机械循环；
     同一小剧情有冷却，不能连续重复；被打断要从当前姿势自然收回。
2. **[roseion/dsh-dayu-fish-skin](https://github.com/roseion/dsh-dayu-fish-skin)** — 《DSH 大肥鱼皮肤》
   - 顶部女仆**来回踱步 + 偶尔停下挥手**、点击换表情、双击喂白饭（连击 → 吃饱打嗝）、鱼群追鼠标（视线跟随）、
     双角色切换时的转身。

落地文件：`src/actions.js`（新增，**37 个完整身体动作**）

| 分类 | 动作 |
|:--|:--|
| `idle` 待机 | `idle` 呼吸待机、`blinkIdle` 待机眨眼、`lookAround` 东张西望、`shakeTail` 轻摇尾巴、`nod` 点头、`headShake` 摇头 |
| `move` 移动 | `walk` 完整步态、`walkBack` 背身走回、`run` 快跑+残影、`sneak` 蹑手蹑脚、`dance` 四拍律动、`cheerJump` 欢呼跳跃、`spin` 360°转身、`crouch` 蹲下 |
| `body` 身体 | `tailSit` 盘尾坐、`kneelPick` 单膝跪地捡东西、`kickTail` 甩尾拍水、`stretch` 伸懒腰、`rubEyes` 揉眼睛、`sofaSitSwap` 坐姿晃脚、`sleep` 蜷起来睡觉 |
| `express` 表情表演 | `wave` 挥手、`waveBoth` 双手欢呼、`heart` 双手比心、`blushPuff` 鼓腮嘴硬、`cry` 哭、`proud` 小得意、`thinkChin` 托腮思考、`countFingers` 掰指头、`hum` 偷偷哼歌、`sing` 放声唱、`fistPump` 握拳“成了” |
| `life` 生活 | `eat` 吃白饭/嚼 token、`sneakTreat` 偷吃一颗 token、`laptop` 盘尾敲代码、`peek` 偷看进度、`nodOff` 打瞌睡 |

配套：
- `ACTION_LIST` / `ACTIONS` / `byCat()` / `pickAction(i)`（黄金分割步进，保证相邻镜头不重复）
- `poseOf(name, t)`：动作内部自带 `准备→表演→恢复` 包络（`perform()`）
- `drawAction(ctx, x, y, u, name, t, extra)`：一行接入任意 MV 场景
- 道具回调 `makeBowlProp()`（白饭 + 筷子）、`makeLaptopProp()`
- 验收产物：`docs/whale_girl_actions_sheet.png`（37 格总览）、`docs/whale_girl_action_strip_*.png`（连续帧）、
  `whale_girl_actions_showcase.mp4`（动作巡览片）；生成命令 `node render_actions.mjs`

对 `src/whale_girl.js` 的配套改动：新增 `armRotScale` 参数（手臂旋转幅度可调），
使挥手/伸懒腰/挥拳等动作的臂摆幅度能真正拉开差别。

---

## 2. 歌词 / 字幕精度（P01–P05）

根因：字幕时间轴是手写估算，从没和音轨核对过；`chaoxi` 甚至整段是杜撰文本。

修复分三步（**文本**与**时间**分开取，这是关键决策）：

| 角色 | 来源 | 理由 |
|:--|:--|:--|
| **歌词文本** | 老模块里人工写好的字幕表 → `tools/legacy_timings.mjs` 导出到 `src/timings/legacy/<key>.json` | 参考片字幕有错别字 / 水印 / 终端 UI 文案，不能直接用；人工表的字是对的 |
| **歌词时间** | 参考片逐帧 OCR 的字幕出现时刻 → `tools/ocr_reference_subs.py` → `src/timings/ocr/<key>.json` | 参考片的字幕是跟着人声打的，时间可信 |
| **合并** | `tools/merge_timings.py`：单调 DP 把"正确的歌词行"对齐到"实测字幕段"，跳过的段落罚分 0.30、跳过的歌词行罚分 0.75 | 允许间奏、UI 文案、OCR 漏识 |

- OCR 质量闸门：若清洗后 OCR 段数 < 歌词行数 × 0.4，判定该片 OCR 无效（整段被水印粘成一块），
  自动退回人工时间轴，并在 `docs/SUB_TIMING.md` 里标 `legacy-handwritten (未用 OCR 校验)`。
- 输出 `src/timings/<key>.json`（渲染器读取），逐行对齐结果见 **`docs/SUB_TIMING.md`**。
- 实测效果：`jimo_yanhuo` 18/18 行直接命中（相似度 1.00）、`qunian_xiatian` 22/26、
  `ba_huiyi_56` 15/17、`xinqiang` 6/6、`douyin_6` 5/6。

> 教训：**不要用纯音频包络做字幕对齐**。`tools/align_lyrics_audio.py` 在 `xinqiang` 上
> 把人声连续段均分成了 13 行 2.62s 的网格 —— 人声没有停顿，能量包络里没有信息。
> 该工具保留作为 OCR 完全不可用时的兜底。

---

## 3. 画面与镜头（P06–P08、P11）

实现落点：`src/shotlib.js`（镜头引擎）+ `src/sets.js`（21 布景）+ `src/actions.js`（37 动作）
+ `src/detail.js`（细节层）+ `src/mv_packs_v2.js`（14 部片的配置）+ `render_mv_v2.mjs`（统一渲染器）。

修复策略（统一到 `ba_huiyi_pinhao_gei_ni` 的水准）：

1. **一格一镜**：每条歌词 = 一个独立分镜，镜头参数（机位 x/y/zoom/rotation）在镜头内做推/拉/摇，不再静止。
2. **动作不重复**：每个分镜从 `pickAction()` 取动作，同一部片子里相邻 5 个镜头不重复；
   一条歌词内还可以做 2 段动作（前 60% 主动作、后 40% 反应动作）。
3. **景别变化**：全景（走位）/ 中景（表演）/ 特写（表情）交替，避免一直中景。
4. **场景不复用**：长片按“段落 → 场景”显式排期，每 2-3 句换一次布景，并允许同场景换机位。
5. **字幕层独立**：任何场景（包括终端、聊天窗口、拼图块）底部都有统一的高对比字幕层，
   卡拉 OK 进度高亮，保证可读（P12）。
6. **细节层（新增 `src/detail.js`）**：空气层（光柱 / 飘落花瓣 / 萤火 / 气泡 / 雨雪 / 尘埃）
   + 前景遮挡层（草叶 / 栏杆 / 窗框 / 水面 / 城市光斑 / 人群剪影）+ 暗角。
   这些按布景名自动选素材，21 个布景直接获得纵深，解决"像平贴纸"的问题。
7. **一镜多段**：>2.8s 的歌词切两镜（表演 + 特写反应），>7.2s 再切一个环境空镜。

---

## 4. 验收方式

| 项目 | 方法 |
|:--|:--|
| 字幕同步 | 逐句对齐实测 OCR 时间轴；渲染后 `docs/mv_<key>_subcheck.png` 对比参考片同秒帧 |
| 动作丰富度 | 统计每部片子的**独立动作数 / 独立镜头数 / 独立布景数**，输出到 `docs/MV_QUALITY_REPORT.md` |
| 画面循环 | 相邻镜头画面哈希去重，检查重复率 |
| 文件 | `node render_mv_v2.mjs all` 重渲染 14 部（统一渲染器） |
| 人工复核 | `node tools/serve_studio.mjs` 打开工作台：任意 MV 拖动时间轴播放、37 个动作逐个回放、21 个布景逐个查看、任意片子的分镜表 |
