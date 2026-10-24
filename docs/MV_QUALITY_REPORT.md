# MV 质量报告（Shot-Pack v2）

> 由 `node render_mv_v2.mjs stats` 自动生成。判断标准：同一部片子里
> **镜头数 / 独立布景数 / 独立动作数** 越多，画面越不重复；
> 相邻镜头动作或布景重复（`adjSame`）应为 0。

| MV | 时长 | 歌词句 | 镜头 | 独立布景 | 独立动作 | 机位 | 相邻重复动作 | 相邻重复布景 |
|:--|--:|--:|--:|--:|--:|--:|--:|--:|
| 《把回忆拼好给你》· 56s 拼图剧场（重制） | 56.03s | 22 | 29 | 12 | 17 | 10 | 0 | 0 |
| 《把回忆拼好给你》· 142s 多段剧场（补动作版） | 142.1s | 55 | 55 | 15 | 19 | 10 | 0 | 0 |
| 五月天《恋爱ing》· 终端与像素城市（重制） | 54.73s | 12 | 22 | 11 | 16 | 10 | 0 | 0 |
| 《寂寞烟火》· 折纸船与灯塔（重制） | 55.24s | 18 | 29 | 10 | 16 | 10 | 0 | 0 |
| 《心墙》· 微光绘本（重制） | 34.02s | 8 | 14 | 10 | 14 | 10 | 0 | 0 |
| 《日不落》· 禁卫军与桌面组件（重制） | 45.81s | 17 | 20 | 11 | 15 | 10 | 0 | 0 |
| 《仿生小狗》· 年糕篇（重制） | 46.68s | 16 | 18 | 10 | 14 | 10 | 0 | 0 |
| 《去年夏天》· 浮世绘夏日（重制） | 78.2s | 31 | 41 | 11 | 15 | 10 | 0 | 0 |
| 徐良 & 小凌《坏女孩》· 2009 网吧与空间（重制） | 245.55s | 80 | 110 | 13 | 18 | 10 | 0 | 0 |
| 周杰伦《枫》· 秋日像素剧场（重制） | 274.58s | 55 | 97 | 14 | 16 | 10 | 0 | 0 |
| 许嵩《玫瑰花的葬礼》· 雨与烟火（重制） | 236.77s | 91 | 124 | 13 | 15 | 10 | 0 | 0 |
| 许嵩 & 何曼婷《素颜》· 2009 教室与天台（重制） | 238.05s | 76 | 113 | 14 | 17 | 10 | 0 | 0 |
| 《潮汐》· 赛博荧光深海（重制） | 31.84s | 8 | 16 | 9 | 14 | 10 | 0 | 0 |
| 《朋友的酒》· 挚友欢聚（重制） | 188.25s | 36 | 64 | 12 | 15 | 10 | 0 | 0 |

## 各片布景 / 动作清单

### 《把回忆拼好给你》· 56s 拼图剧场（重制）

- 布景（12）：hillMeadow、beachDawn、classroom、rooftopCity、boardwalk、autumnPark、greenhouse、galaxy、snowStreet、fireworksRiver、library、puzzleObservatory
- 动作（17）：wave、walk、kneelPick、heart、thinkChin、proud、spin、cheerJump、hum、lookAround、stretch、nod、dance、blushPuff、peek、laptop、sing

### 《把回忆拼好给你》· 142s 多段剧场（补动作版）

- 布景（15）：beachNight、beachDawn、rainBusStop、autumnPark、greenhouse、snowStreet、fireworksRiver、galaxy、bedroomNight、classroom、library、stage、boardwalk、rooftopCity、puzzleObservatory
- 动作（19）：walk、kneelPick、tailSit、cheerJump、spin、heart、waveBoth、cry、thinkChin、hum、peek、eat、dance、stretch、proud、lookAround、sing、sneak、sleep

### 五月天《恋爱ing》· 终端与像素城市（重制）

- 布景（11）：poolside、boardwalk、stage、cafe、trainInterior、hillMeadow、fireworksRiver、galaxy、classroom、beachNight、rooftopCity
- 动作（16）：run、dance、waveBoth、heart、spin、cheerJump、fistPump、sing、hum、walk、proud、blushPuff、eat、wave、sneakTreat、peek

### 《寂寞烟火》· 折纸船与灯塔（重制）

- 布景（10）：deepSea、fireworksRiver、boardwalk、snowStreet、galaxy、rooftopCity、beachDawn、library、bedroomNight、beachNight
- 动作（16）：walk、lookAround、cry、rubEyes、stretch、hum、thinkChin、heart、wave、tailSit、kneelPick、sleep、sing、nodOff、blinkIdle、proud

### 《心墙》· 微光绘本（重制）

- 布景（10）：autumnPark、classroom、greenhouse、bedroomNight、hillMeadow、library、rooftopCity、trainInterior、boardwalk、rainBusStop
- 动作（14）：walk、kneelPick、peek、thinkChin、blushPuff、wave、lookAround、stretch、nod、proud、sneak、heart、idle、sing

### 《日不落》· 禁卫军与桌面组件（重制）

- 布景（11）：boardwalk、stage、rooftopCity、beachDawn、desertDusk、trainInterior、galaxy、cafe、bedroomNight、hillMeadow、poolside
- 动作（15）：walk、cheerJump、dance、waveBoth、heart、spin、proud、sing、run、stretch、peek、eat、fistPump、wave、nodOff

### 《仿生小狗》· 年糕篇（重制）

- 布景（10）：boardwalk、hillMeadow、greenhouse、poolside、cafe、autumnPark、beachDawn、rainBusStop、library、bedroomNight
- 动作（14）：walk、run、crouch、nodOff、sleep、wave、heart、eat、sneakTreat、stretch、spin、lookAround、cheerJump、blinkIdle

### 《去年夏天》· 浮世绘夏日（重制）

- 布景（11）：poolside、hillMeadow、beachDawn、autumnPark、trainInterior、fireworksRiver、greenhouse、classroom、stage、beachNight、boardwalk
- 动作（15）：walk、run、waveBoth、heart、dance、spin、cheerJump、lookAround、stretch、eat、sing、proud、blushPuff、sneak、nodOff

### 徐良 & 小凌《坏女孩》· 2009 网吧与空间（重制）

- 布景（13）：bedroomNight、cafe、rainBusStop、trainInterior、classroom、fireworksRiver、snowStreet、stage、library、autumnPark、galaxy、beachNight、rooftopCity
- 动作（18）：dance、sing、cry、blushPuff、heart、walk、proud、spin、cheerJump、thinkChin、sneak、peek、stretch、run、nodOff、waveBoth、rubEyes、kickTail

### 周杰伦《枫》· 秋日像素剧场（重制）

- 布景（14）：snowStreet、beachDawn、rooftopCity、library、cafe、trainInterior、galaxy、rainBusStop、boardwalk、bedroomNight、greenhouse、beachNight、fireworksRiver、autumnPark
- 动作（16）：walk、lookAround、cry、stretch、thinkChin、kneelPick、sleep、nodOff、hum、heart、wave、sing、crouch、tailSit、rubEyes、proud

### 许嵩《玫瑰花的葬礼》· 雨与烟火（重制）

- 布景（13）：rainBusStop、fireworksRiver、snowStreet、bedroomNight、autumnPark、library、cafe、classroom、rooftopCity、beachNight、trainInterior、galaxy、greenhouse
- 动作（15）：cry、rubEyes、walk、kneelPick、sneak、thinkChin、heart、sleep、stretch、hum、blushPuff、nodOff、lookAround、tailSit、sing

### 许嵩 & 何曼婷《素颜》· 2009 教室与天台（重制）

- 布景（14）：rooftopCity、library、cafe、trainInterior、rainBusStop、hillMeadow、bedroomNight、boardwalk、poolside、autumnPark、snowStreet、greenhouse、stage、classroom
- 动作（17）：walk、lookAround、wave、heart、dance、cheerJump、stretch、thinkChin、eat、peek、sing、proud、blushPuff、sneak、nodOff、spin、rubEyes

### 《潮汐》· 赛博荧光深海（重制）

- 布景（9）：galaxy、beachNight、fireworksRiver、stage、beachDawn、rooftopCity、snowStreet、puzzleObservatory、deepSea
- 动作（14）：walk、sing、waveBoth、heart、dance、cheerJump、spin、cry、proud、stretch、lookAround、kickTail、run、wave

### 《朋友的酒》· 挚友欢聚（重制）

- 布景（12）：stage、fireworksRiver、beachNight、boardwalk、hillMeadow、autumnPark、rooftopCity、library、poolside、galaxy、bedroomNight、cafe
- 动作（15）：dance、cheerJump、waveBoth、sing、eat、heart、spin、walk、proud、fistPump、hum、wave、blushPuff、stretch、nodOff
