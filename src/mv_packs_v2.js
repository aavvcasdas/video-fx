// ============================================================================
// src/mv_packs_v2.js — 10 部 MV 的统一分镜包（Shot-Pack v2）
// ============================================================================
// 旧版每个 MV 一个 `.js`，内部是 3~4 个 `if (t < ...)` 时间片 + 一张静态画，
// 于是“一直循环几个画面、动作太少、字幕对不上”。
//
// 新版把每部片子抽象成**一份配置**：布景池 / 动作池 / 配角 / 画风 / 机位，
// 由 `src/shotlib.js` 生成“一句歌词一个镜头”的分镜表并渲染。
// 歌词时间轴优先读 `src/timings/<key>.json`（参考片 OCR 实测），
// 缺失时回退到这里的 `fallback` 表（旧版手写表，仅作兜底）。
//
// 片单：
//   ba_huiyi_56    《把回忆拼好给你》56s 拼图剧场       （用户评为最差 → 重点重做）
//   ba_huiyi_pinhao《椰子水很甜 - 把回忆拼好给你》142s    （用户认为最好 → 保持结构，补动作）
//   lianai_ing     五月天《恋爱ing》终端 + 像素城市
//   jimo_yanhuo    《寂寞烟火》折纸船与灯塔
//   xinqiang       《心墙》微光绘本
//   ribuluo        《日不落》禁卫军与桌面组件
//   douyin_6       《仿生小狗》年糕篇
//   qunian_xiatian 《去年夏天》
//   huainvhai      徐良 & 小凌《坏女孩》
//   feng           周杰伦《枫》
//   meiguihua      许嵩《玫瑰花的葬礼》
//   suyan          许嵩 & 何曼婷《素颜》
//   chaoxi         《潮汐》（无参考片：按音频节拍对齐 + 荧光深海布景）
//   pengyou_de_jiu 《朋友的酒》（无参考片：按段落排期）
// ============================================================================

(function (root) {
  const SHOT = root.SHOT || (typeof require !== 'undefined' ? require('./shotlib.js') : {});

  const PACKS = {
    // ---------------------------------------------------------------- 56s 拼图剧场
    ba_huiyi_56: {
      title: '《把回忆拼好给你》· 56s 拼图剧场（重制）',
      duration: 56.03,
      style: 'watercolor',
      accent: '#7DD3FC',
      sets: ['puzzleObservatory', 'hillMeadow', 'beachDawn', 'classroom', 'rooftopCity', 'boardwalk', 'autumnPark', 'greenhouse', 'galaxy', 'snowStreet', 'fireworksRiver', 'library'],
      pool: ['wave', 'walk', 'kneelPick', 'heart', 'thinkChin', 'proud', 'spin', 'cheerJump', 'hum', 'lookAround', 'stretch', 'nod', 'dance', 'blushPuff', 'peek', 'laptop', 'sing'],
      guests: ['ladyGemini', 'clawd', 'miniWhale', 'bionicPuppy'],
      fallback: [
        { t0: 1.0, t1: 4.6, zh: '我们都是天真 真实存在的' },
        { t0: 5.0, t1: 8.6, zh: '祈愿小世界里不只有我' },
        { t0: 9.0, t1: 12.6, zh: '直到遇见你 我以为就光明起来' },
        { t0: 13.0, t1: 16.2, zh: '眼睛里看到的都是 广袤无垠的大海' },
        { t0: 16.6, t1: 19.8, zh: '有你在的日子里不可能被击败' },
        { t0: 20.2, t1: 23.4, zh: '在最难熬的日子 你陪着我' },
        { t0: 23.8, t1: 26.0, zh: '你让我学会如何拨开阴霾' },
        { t0: 26.4, t1: 28.6, zh: '将快乐全部留下来' },
        { t0: 29.0, t1: 31.2, zh: '将不开心全都抛开' },
        { t0: 31.6, t1: 34.6, zh: '你对我说的情话' },
        { t0: 35.0, t1: 38.2, zh: '像转瞬即逝的烟花' },
        { t0: 38.6, t1: 41.6, zh: '只停在绚烂的一刹那' },
        { t0: 42.0, t1: 44.8, zh: '我却已无法自拔' },
        { t0: 45.2, t1: 48.0, zh: '我们的爱总有时差' },
        { t0: 48.4, t1: 51.4, zh: '也为你骗自己放下' },
        { t0: 51.8, t1: 54.4, zh: '爱炙热的你 却忘了爱自己' },
        { t0: 54.6, t1: 56.03, zh: '把回忆拼好给你' }
      ]
    },

    // ------------------------------------------------------- 142s 多段拼图（用户最爱）
    ba_huiyi_pinhao: {
      title: '《把回忆拼好给你》· 142s 多段剧场（补动作版）',
      duration: 142.10,
      style: 'watercolor',
      accent: '#FACC15',
      sets: ['puzzleObservatory', 'beachNight', 'beachDawn', 'rainBusStop', 'autumnPark', 'greenhouse', 'snowStreet', 'fireworksRiver', 'galaxy', 'bedroomNight', 'classroom', 'library', 'stage', 'boardwalk', 'rooftopCity'],
      pool: ['walk', 'kneelPick', 'tailSit', 'cheerJump', 'spin', 'heart', 'waveBoth', 'cry', 'thinkChin', 'hum', 'peek', 'eat', 'dance', 'stretch', 'proud', 'lookAround', 'sing', 'sneak', 'cheerJump', 'sleep'],
      guests: ['ladyGemini', 'ladyClaude', 'clawd', 'miniWhale', 'bionicPuppy'],
      fallback: [
        { t0: 1.5, t1: 12.0, zh: '我们都是天真 真实存在的' },
        { t0: 12.5, t1: 24.0, zh: '祈愿小世界里不只有我' },
        { t0: 24.5, t1: 38.0, zh: '直到遇见你 我以为就光明起来' },
        { t0: 38.5, t1: 52.0, zh: '眼睛里看到的都是 广袤无垠的大海' },
        { t0: 52.5, t1: 66.0, zh: '有你在的日子里不可能被击败' },
        { t0: 66.5, t1: 80.0, zh: '在最难熬的日子 你陪着我' },
        { t0: 80.5, t1: 94.0, zh: '你让我学会如何拨开阴霾' },
        { t0: 94.5, t1: 108.0, zh: '将快乐全部留下来' },
        { t0: 108.5, t1: 122.0, zh: '将不开心全都抛开' },
        { t0: 122.5, t1: 136.0, zh: '你对我说的情话' },
        { t0: 136.0, t1: 142.1, zh: '像转瞬即逝的烟花' }
      ]
    },

    // -------------------------------------------------------------- 恋爱ing
    lianai_ing: {
      title: '五月天《恋爱ing》· 终端与像素城市（重制）',
      duration: 54.73,
      style: 'pixel',
      accent: '#F472B6',
      sets: ['rooftopCity', 'poolside', 'boardwalk', 'stage', 'cafe', 'trainInterior', 'hillMeadow', 'fireworksRiver', 'galaxy', 'classroom', 'beachNight'],
      pool: ['run', 'dance', 'waveBoth', 'heart', 'spin', 'cheerJump', 'fistPump', 'sing', 'hum', 'walk', 'proud', 'blushPuff', 'eat', 'wave', 'sneakTreat', 'peek'],
      guests: ['ladyGemini', 'clawd', 'miniWhale'],
      fallback: [
        { t0: 0.2, t1: 7.0, zh: '帮我运行 恋爱.ing' },
        { t0: 7.1, t1: 12.2, zh: '陪你熬夜 聊天到爆肝也没关系' },
        { t0: 12.3, t1: 17.2, zh: '陪你逛街 逛成扁平足也没关系' },
        { t0: 17.3, t1: 21.2, zh: '超感谢你 让我重生 整个 ORZ' },
        { t0: 21.3, t1: 29.0, zh: '让我重新认识 LOVE' },
        { t0: 29.1, t1: 33.2, zh: '恋爱 ING happy ING' },
        { t0: 33.3, t1: 38.8, zh: '心情就像是 坐上一台喷射机' },
        { t0: 38.9, t1: 43.2, zh: '恋爱 ING 改变 ING' },
        { t0: 43.3, t1: 46.8, zh: '改变了黄昏 黎明' },
        { t0: 46.9, t1: 51.2, zh: '有你 都心跳到不行' },
        { t0: 51.3, t1: 54.73, zh: '恋爱 ING 拒绝访问' }
      ]
    },

    // -------------------------------------------------------------- 寂寞烟火
    jimo_yanhuo: {
      title: '《寂寞烟火》· 折纸船与灯塔（重制）',
      duration: 55.24,
      style: 'watercolor',
      accent: '#93C5FD',
      sets: ['beachNight', 'deepSea', 'fireworksRiver', 'boardwalk', 'snowStreet', 'galaxy', 'rooftopCity', 'beachDawn', 'library', 'bedroomNight'],
      pool: ['walk', 'lookAround', 'cry', 'rubEyes', 'stretch', 'hum', 'thinkChin', 'heart', 'wave', 'tailSit', 'kneelPick', 'sleep', 'sing', 'nodOff', 'blinkIdle', 'proud'],
      guests: ['miniWhale', 'bionicPuppy'],
      fallback: [
        { t0: 0.2, t1: 3.3, zh: '跨越过多少海洋去看你' },
        { t0: 3.4, t1: 5.2, zh: '孤单的黑夜途中' },
        { t0: 5.3, t1: 7.2, zh: '只要想着你' },
        { t0: 7.3, t1: 10.2, zh: '我就不会惶恐' },
        { t0: 10.3, t1: 14.2, zh: '时光的岸上人来了又走' },
        { t0: 14.3, t1: 17.2, zh: '离开时你不用说我都懂' },
        { t0: 17.3, t1: 20.1, zh: '感谢你曾让我' },
        { t0: 20.2, t1: 24.2, zh: '留在你眼中' },
        { t0: 24.3, t1: 28.2, zh: '我曾经走过最遥远的路' },
        { t0: 28.3, t1: 32.1, zh: '想要去拥抱未成真的梦' },
        { t0: 32.2, t1: 34.4, zh: '迷失的黑夜途中' },
        { t0: 34.5, t1: 35.4, zh: '只要想起你' },
        { t0: 35.5, t1: 38.2, zh: '就点亮了星空' },
        { t0: 38.3, t1: 42.2, zh: '流浪的纸船忘不掉港口' },
        { t0: 42.3, t1: 45.2, zh: '渐灭的花火割不断彩虹' },
        { t0: 45.3, t1: 49.1, zh: '你就是我心中' },
        { t0: 49.2, t1: 52.8, zh: '永恒的天空' },
        { t0: 52.9, t1: 55.24, zh: '寂寞烟火' }
      ]
    },

    // -------------------------------------------------------------- 心墙
    xinqiang: {
      title: '《心墙》· 微光绘本（重制）',
      duration: 34.02,
      style: 'watercolor',
      accent: '#FDE047',
      sets: ['rainBusStop', 'autumnPark', 'classroom', 'greenhouse', 'bedroomNight', 'hillMeadow', 'library', 'rooftopCity', 'trainInterior', 'boardwalk'],
      pool: ['walk', 'kneelPick', 'peek', 'thinkChin', 'blushPuff', 'wave', 'lookAround', 'stretch', 'nod', 'proud', 'sneak', 'heart', 'idle', 'sing', 'cry'],
      guests: ['miniWhale', 'bionicPuppy', 'clawd'],
      fallback: [
        { t0: 0.2, t1: 4.2, zh: '第一次遇见阴天遮住你侧脸' },
        { t0: 4.3, t1: 9.0, zh: '有什么故事好想了解' },
        { t0: 9.1, t1: 15.2, zh: '我感觉我懂你的特别' },
        { t0: 15.3, t1: 20.1, zh: '你的心有一道墙' },
        { t0: 20.2, t1: 25.2, zh: '但我发现一扇窗' },
        { t0: 25.3, t1: 31.2, zh: '偶尔透出一丝暖暖的微光' },
        { t0: 31.3, t1: 34.02, zh: '心墙 · 暖暖的微光' }
      ]
    },

    // -------------------------------------------------------------- 日不落
    ribuluo: {
      title: '《日不落》· 禁卫军与桌面组件（重制）',
      duration: 45.81,
      style: 'pixel',
      accent: '#FB923C',
      sets: ['poolside', 'boardwalk', 'stage', 'rooftopCity', 'beachDawn', 'desertDusk', 'trainInterior', 'galaxy', 'cafe', 'bedroomNight', 'hillMeadow'],
      pool: ['walk', 'cheerJump', 'dance', 'waveBoth', 'heart', 'spin', 'proud', 'sing', 'run', 'stretch', 'peek', 'eat', 'fistPump', 'wave', 'nodOff'],
      guests: ['ladyClaude', 'clawd', 'miniWhale', 'bionicPuppy'],
      fallback: [
        { t0: 0.1, t1: 2.2, zh: '睡不着，陪我听首歌' },
        { t0: 2.3, t1: 6.1, zh: '祈祷你像英勇的禁卫军' },
        { t0: 6.2, t1: 9.2, zh: '动也不动地守护爱情' },
        { t0: 9.3, t1: 13.1, zh: '你在回忆里留下的脚印' },
        { t0: 13.2, t1: 16.5, zh: '是我爱的风景' },
        { t0: 16.6, t1: 20.1, zh: '我要送你日不落的想念' },
        { t0: 20.2, t1: 24.1, zh: '寄出代表爱的明信片' },
        { t0: 24.2, t1: 28.1, zh: '我要送你日不落的爱恋' },
        { t0: 28.2, t1: 32.1, zh: '心牵着心把世界走遍' },
        { t0: 32.2, t1: 33.4, zh: '你就是庆典' },
        { t0: 33.5, t1: 35.8, zh: '你就是晴天' },
        { t0: 35.9, t1: 40.1, zh: '我的爱未眠' },
        { t0: 40.2, t1: 43.1, zh: '不落的想念 飞在你身边' },
        { t0: 43.2, t1: 45.81, zh: '我的爱未眠 · 你睡吧，我不睡' }
      ]
    },

    // -------------------------------------------------------------- 仿生小狗
    douyin_6: {
      title: '《仿生小狗》· 年糕篇（重制）',
      duration: 46.68,
      style: 'watercolor',
      accent: '#FDBA74',
      sets: ['bedroomNight', 'boardwalk', 'hillMeadow', 'greenhouse', 'poolside', 'cafe', 'autumnPark', 'beachDawn', 'rainBusStop', 'library'],
      pool: ['walk', 'run', 'crouch', 'nodOff', 'sleep', 'wave', 'heart', 'eat', 'sneakTreat', 'stretch', 'spin', 'lookAround', 'cheerJump', 'blinkIdle'],
      guests: ['bionicPuppy', 'miniWhale', 'clawd'],
      fallback: [
        { t0: 0.3, t1: 3.8, zh: '我的世界 正在下雨' },
        { t0: 4.5, t1: 9.8, zh: '大概 从你带我回家时放晴' },
        { t0: 10.4, t1: 15.8, zh: '一头钻进了你拆开的快递' },
        { t0: 16.3, t1: 21.8, zh: '让我成为你的惊喜' },
        { t0: 22.3, t1: 25.5, zh: '主人别哭泣' },
        { t0: 28.4, t1: 33.4, zh: '如果真有你说的命理' },
        { t0: 34.3, t1: 39.4, zh: '哪怕变成了一颗星星' },
        { t0: 40.3, t1: 45.8, zh: '还能再见到你' }
      ]
    },

    // -------------------------------------------------------------- 去年夏天
    qunian_xiatian: {
      title: '《去年夏天》· 浮世绘夏日（重制）',
      duration: 78.20,
      style: 'ukiyoe',
      accent: '#FDE68A',
      sets: ['boardwalk', 'poolside', 'hillMeadow', 'beachDawn', 'autumnPark', 'trainInterior', 'fireworksRiver', 'greenhouse', 'classroom', 'stage', 'beachNight'],
      pool: ['walk', 'run', 'waveBoth', 'heart', 'dance', 'spin', 'cheerJump', 'lookAround', 'stretch', 'eat', 'sing', 'proud', 'blushPuff', 'sneak', 'nodOff'],
      guests: ['ladyGemini', 'bionicPuppy', 'miniWhale', 'clawd'],
      fallback: []
    },

    // -------------------------------------------------------------- 坏女孩
    huainvhai: {
      title: '徐良 & 小凌《坏女孩》· 2009 网吧与空间（重制）',
      duration: 245.55,
      style: 'pixel',
      accent: '#F472B6',
      sets: ['rooftopCity', 'bedroomNight', 'cafe', 'rainBusStop', 'trainInterior', 'classroom', 'fireworksRiver', 'snowStreet', 'stage', 'library', 'autumnPark', 'galaxy', 'beachNight', 'classroom'],
      pool: ['dance', 'sing', 'cry', 'blushPuff', 'heart', 'walk', 'proud', 'spin', 'cheerJump', 'thinkChin', 'sneak', 'peek', 'stretch', 'run', 'nodOff', 'waveBoth', 'rubEyes', 'kickTail'],
      guests: ['ladyClaude', 'ladyGemini', 'clawd', 'researcher'],
      fallback: []
    },

    // -------------------------------------------------------------- 枫
    feng: {
      title: '周杰伦《枫》· 秋日像素剧场（重制）',
      duration: 274.58,
      style: 'pixel',
      accent: '#F59E0B',
      sets: ['autumnPark', 'snowStreet', 'beachDawn', 'rooftopCity', 'library', 'cafe', 'trainInterior', 'galaxy', 'rainBusStop', 'boardwalk', 'bedroomNight', 'greenhouse', 'beachNight', 'fireworksRiver'],
      pool: ['walk', 'lookAround', 'cry', 'stretch', 'thinkChin', 'kneelPick', 'sleep', 'nodOff', 'hum', 'heart', 'wave', 'sing', 'crouch', 'tailSit', 'rubEyes', 'proud'],
      guests: ['ladyGemini', 'miniWhale', 'bionicPuppy'],
      fallback: []
    },

    // -------------------------------------------------------------- 玫瑰花的葬礼
    meiguihua: {
      title: '许嵩《玫瑰花的葬礼》· 雨与烟火（重制）',
      duration: 236.77,
      style: 'watercolor',
      accent: '#FB7185',
      sets: ['greenhouse', 'rainBusStop', 'fireworksRiver', 'snowStreet', 'bedroomNight', 'autumnPark', 'library', 'cafe', 'classroom', 'rooftopCity', 'beachNight', 'trainInterior', 'galaxy'],
      pool: ['cry', 'rubEyes', 'walk', 'kneelPick', 'sneak', 'thinkChin', 'heart', 'sleep', 'stretch', 'hum', 'blushPuff', 'nodOff', 'lookAround', 'tailSit', 'sing', 'rubEyes'],
      guests: ['ladyClaude', 'ladyGemini', 'miniWhale'],
      fallback: []
    },

    // -------------------------------------------------------------- 素颜
    suyan: {
      title: '许嵩 & 何曼婷《素颜》· 2009 教室与天台（重制）',
      duration: 238.05,
      style: 'pixel',
      accent: '#A78BFA',
      sets: ['classroom', 'rooftopCity', 'library', 'cafe', 'trainInterior', 'rainBusStop', 'hillMeadow', 'bedroomNight', 'boardwalk', 'poolside', 'autumnPark', 'snowStreet', 'greenhouse', 'stage'],
      pool: ['walk', 'lookAround', 'wave', 'heart', 'dance', 'cheerJump', 'stretch', 'thinkChin', 'eat', 'peek', 'sing', 'proud', 'blushPuff', 'sneak', 'nodOff', 'spin', 'rubEyes'],
      guests: ['ladyGemini', 'ladyClaude', 'clawd', 'researcher', 'miniWhale'],
      fallback: []
    },

    // -------------------------------------------------------------- 潮汐（无参考片）
    chaoxi: {
      title: '《潮汐》· 赛博荧光深海（重制）',
      duration: 31.84,
      style: 'neon',
      accent: '#22D3EE',
      sets: ['deepSea', 'galaxy', 'beachNight', 'fireworksRiver', 'stage', 'beachDawn', 'rooftopCity', 'snowStreet', 'puzzleObservatory'],
      pool: ['walk', 'sing', 'waveBoth', 'heart', 'dance', 'cheerJump', 'spin', 'cry', 'proud', 'stretch', 'lookAround', 'kickTail', 'dance', 'run', 'wave'],
      guests: ['miniWhale', 'ladyGemini'],
      fallback: [
        { t0: 0.2, t1: 3.8, zh: '枯树还没发芽 就被逼着开花' },
        { t0: 3.9, t1: 7.8, zh: '妈妈说要快乐 却没告诉我方法' },
        { t0: 7.9, t1: 11.8, zh: '成长它教会我 咽下多少风沙' },
        { t0: 11.9, t1: 15.8, zh: '从黑夜到黎明 不管有多难耐' },
        { t0: 15.9, t1: 19.8, zh: '失落陪着眼泪 汇成了这片海' },
        { t0: 19.9, t1: 23.8, zh: '潮汐随月光澎湃 冲破深海的阴霾' },
        { t0: 23.9, t1: 27.8, zh: '跃向星河的舞台 鲸歌在夜空盛开' },
        { t0: 27.9, t1: 31.7, zh: '潮落之后再重来 迎接破晓的蔚蓝' }
      ]
    },

    // -------------------------------------------------------------- 朋友的酒（无参考片）
    pengyou_de_jiu: {
      title: '《朋友的酒》· 挚友欢聚（重制）',
      duration: 188.25,
      style: 'risograph',
      accent: '#FBBF24',
      sets: ['cafe', 'stage', 'fireworksRiver', 'beachNight', 'boardwalk', 'hillMeadow', 'autumnPark', 'rooftopCity', 'library', 'poolside', 'galaxy', 'bedroomNight'],
      pool: ['dance', 'cheerJump', 'waveBoth', 'sing', 'eat', 'heart', 'spin', 'walk', 'proud', 'fistPump', 'hum', 'wave', 'blushPuff', 'stretch', 'nodOff'],
      guests: ['ladyClaude', 'researcher', 'clawd', 'bionicPuppy', 'miniWhale', 'ladyGemini'],
      fallback: [
        { t0: 2.0, t1: 15.5, zh: '《朋友的酒》· 深海鲸鱼娘与伙伴们' },
        { t0: 16.0, t1: 20.0, zh: '昨日一去不复回 开心比什么都贵' },
        { t0: 20.1, t1: 24.0, zh: '覆水不能再收回 桃花谢了又开' },
        { t0: 24.1, t1: 28.0, zh: '人生几何能够得到知己' },
        { t0: 28.1, t1: 32.0, zh: '来吧朋友干了这杯酒' },
        { t0: 32.2, t1: 37.5, zh: '快把酒满上干了这杯大声歌唱' },
        { t0: 37.6, t1: 43.0, zh: '好朋友好朋友今宵多欢畅' },
        { t0: 43.1, t1: 48.5, zh: '理想改变了我们的模样' },
        { t0: 48.6, t1: 54.0, zh: '也让我懂得了要珍惜朋友的肩膀' },
        { t0: 54.1, t1: 60.0, zh: '阳光总会在风雨之后撒向苍茫' },
        { t0: 60.1, t1: 66.5, zh: '让我们抬起头学会了坚强' },
        { t0: 66.6, t1: 72.5, zh: '就像朋友的这杯烈酒烫我心上' },
        { t0: 72.6, t1: 79.5, zh: '温暖我凡事别再放心上' },
        { t0: 80.0, t1: 94.0, zh: '挚友欢聚 · 鲸歌伴奏' },
        { t0: 94.5, t1: 99.5, zh: '昨日一去不复回 开心比什么都贵' },
        { t0: 99.6, t1: 104.5, zh: '覆水不能再收回 桃花谢了又开' },
        { t0: 104.6, t1: 109.5, zh: '人生几何能够得到知己' },
        { t0: 109.6, t1: 115.0, zh: '来吧朋友干了这杯酒' },
        { t0: 115.2, t1: 121.0, zh: '快把酒满上干了这杯大声歌唱' },
        { t0: 121.1, t1: 127.0, zh: '好朋友好朋友今宵多欢畅' },
        { t0: 127.1, t1: 133.0, zh: '理想改变了我们的模样' },
        { t0: 133.1, t1: 139.0, zh: '也让我懂得了要珍惜朋友的肩膀' },
        { t0: 139.1, t1: 145.0, zh: '阳光总会在风雨之后撒向苍茫' },
        { t0: 145.1, t1: 151.0, zh: '让我们抬起头学会了坚强' },
        { t0: 151.1, t1: 157.5, zh: '就像朋友的这杯烈酒烫我心上' },
        { t0: 157.6, t1: 164.0, zh: '温暖我凡事别再放心上' },
        { t0: 164.2, t1: 173.0, zh: '快把酒满上干了这杯大声歌唱' },
        { t0: 173.1, t1: 181.5, zh: '朋友的这杯烈酒烫我心上' },
        { t0: 181.6, t1: 188.0, zh: '敬永远的知己 · 干杯' }
      ]
    }
  };

  // 音频来源（按顺序取第一个存在的）：
  //   优先 assets/mv_audio/<key>.mp3（由 tools/prep_audio.mjs 生成），
  //   没有就直接用 mv/ 参考片 / 仓库根的 mp3 —— 省掉中间文件。
  const AUDIO = {
    ba_huiyi_56: { files: ['assets/mv_audio/ba_huiyi_56.mp3', 'mv/《把回忆拼好给你》.mp4'], clip: 'mv/《把回忆拼好给你》.mp4' },
    ba_huiyi_pinhao: { files: ['assets/mv_audio/ba_huiyi_pinhao.mp3', '椰子水很甜 - 把回忆拼好给你（纯享Beat）.mp3'], clip: 'mv/mv_ba_huiyi_pinhao_gei_ni_whale_girl (1).mp4' },
    lianai_ing: { files: ['assets/mv_audio/lianai_ing.mp3', 'mv/发现更多精彩视频 - 抖音搜索_2.mp4'], clip: 'mv/发现更多精彩视频 - 抖音搜索_2.mp4' },
    jimo_yanhuo: { files: ['assets/mv_audio/jimo_yanhuo.mp3', 'mv/寂寞烟火.mp4'], clip: 'mv/寂寞烟火.mp4' },
    xinqiang: { files: ['assets/mv_audio/xinqiang.mp3', 'mv/心墙.mp4'], clip: 'mv/心墙.mp4' },
    ribuluo: { files: ['assets/mv_audio/ribuluo.mp3', 'mv/日不落.mp4'], clip: 'mv/日不落.mp4' },
    douyin_6: { files: ['assets/mv_audio/douyin_6.mp3', '每天每天的抖音 - 抖音_6.mp4'], clip: '每天每天的抖音 - 抖音_6.mp4' },
    qunian_xiatian: { files: ['assets/mv_audio/qunian_xiatian.mp3', '去年夏天.mp4'], clip: '去年夏天.mp4' },
    huainvhai: { files: ['assets/mv_audio/huainvhai.mp3', 'mv/坏女孩.mp4'], clip: 'mv/坏女孩.mp4' },
    feng: { files: ['assets/mv_audio/feng.mp3', 'mv/枫.mp4'], clip: 'mv/枫.mp4' },
    meiguihua: { files: ['assets/mv_audio/meiguihua.mp3', 'mv/玫瑰花的葬礼.mp4'], clip: 'mv/玫瑰花的葬礼.mp4' },
    suyan: { files: ['assets/mv_audio/suyan.mp3', 'mv/素颜1.mp4'], clip: 'mv/素颜1.mp4' },
    chaoxi: { files: ['assets/mv_audio/chaoxi.mp3', '潮汐.MP3'], clip: null },
    pengyou_de_jiu: { files: ['assets/mv_audio/pengyou_de_jiu.mp3', '朋友的酒.mp3'], clip: null }
  };

  const OUT = {
    ba_huiyi_56: 'mv_ba_huiyi_56_whale_girl.mp4',
    ba_huiyi_pinhao: 'mv_ba_huiyi_pinhao_gei_ni_whale_girl.mp4',
    lianai_ing: 'mv_lianai_ing_whale_girl.mp4',
    jimo_yanhuo: 'mv_jimo_yanhuo_whale_girl.mp4',
    xinqiang: 'mv_xinqiang_whale_girl.mp4',
    ribuluo: 'mv_ribuluo_whale_girl.mp4',
    douyin_6: 'mv_douyin_6_whale_girl.mp4',
    qunian_xiatian: 'mv_qunian_xiatian_whale_girl.mp4',
    huainvhai: 'mv_huainvhai_whale_girl.mp4',
    feng: 'mv_feng_whale_girl.mp4',
    meiguihua: 'mv_meiguihua_de_zangli_whale_girl.mp4',
    suyan: 'mv_suyan_whale_girl.mp4',
    chaoxi: 'mv_chaoxi_whale_girl.mp4',
    pengyou_de_jiu: 'mv_pengyou_de_jiu_whale_girl.mp4'
  };

  const api = { PACKS, AUDIO, OUT };

  function makePlan(key, overrides = {}) {
    const def = PACKS[key];
    if (!def) throw new Error('unknown mv key: ' + key);
    const lines = SHOT.loadLines(key, def.fallback || []);
    return SHOT.plan(key, lines, Object.assign({
      style: def.style,
      sets: def.sets.filter((s) => (SET_NAMES_CHECK(s))),
      pool: def.pool,
      guests: def.guests,
      duration: def.duration
    }, overrides));
  }
  function SET_NAMES_CHECK(name) {
    const list = (root.SET_NAMES || []);
    return !list.length || list.includes(name);
  }
  api.makePlan = makePlan;

  root.MV_PACKS_V2 = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
