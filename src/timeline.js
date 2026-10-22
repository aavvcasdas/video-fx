/*
 * TIMELINE — the single source of timing for picture, beat and export.
 * Shot renderers only consume a time `t`; this file is deliberately data-first
 * so a frame can be rendered in any order, as in an offline video render.
 */
(() => {
  const shots = Object.freeze([
    { start: 0, title: '信号下潜', kicker: 'INTRO / 01', detail: '气泡 · 光束 · 8 分音符漂移', color: 'fx' },
    { start: 4, title: '鲸尾入镜', kicker: 'VERSE 01', detail: '摆尾落拍 · 远景推进', color: 'motion' },
    { start: 8, title: '深海投票', kicker: 'VERSE 01', detail: '四格卡片 · 眨眼选择', color: 'motion' },
    { start: 12, title: '规则浮现', kicker: 'PRE / 01', detail: '弹出 UI · 键盘音符', color: 'fx' },
    { start: 16, title: '珊瑚步伐', kicker: 'CHORUS / 01', detail: '四拍舞步 · 横向摇镜', color: 'motion' },
    { start: 20, title: '水母接管', kicker: 'CHORUS / 01', detail: 'DJ 触手 · 声呐圆环', color: 'cut' },
    { start: 24, title: '气泡弹幕', kicker: 'BREAK / 01', detail: '评论雨 · 尾鳍切屏', color: 'fx' },
    { start: 28, title: '存档之门', kicker: 'VERSE 02', detail: '像素门 · 色阶下潜', color: 'cut' },
    { start: 32, title: '深潜独白', kicker: 'VERSE 02', detail: '近景表情 · 低频涟漪', color: 'motion' },
    { start: 36, title: '群像合拍', kicker: 'PRE / 02', detail: '四人齐拍 · 镜头拉远', color: 'motion' },
    { start: 40, title: '潮汐建造', kicker: 'BUILD UP', detail: '光块堆叠 · 心跳闪白', color: 'fx' },
    { start: 44, title: '蓝色回声', kicker: 'FINAL CHORUS', detail: '跃出海面 · 标题收束', color: 'cut' },
  ]);

  const secondCues = Object.freeze([
    ['深蓝开场', '1 束顶光落下'], ['泡泡上浮', '8 个粒子错位'], ['声呐呼吸', '背景亮度起伏'], ['尾鳍掠过', '强拍擦镜'],
    ['剪影出现', '镜头推近 1 格'], ['第一次眨眼', '发梢跟拍'], ['手势落点', '裙摆弹性'], ['鲸尾扫屏', '转场对齐强拍'],
    ['选项 A 弹出', '橙色卡片跳入'], ['选项 B 弹出', '蓝色卡片跳入'], ['投票闪烁', '眼神切换'], ['点击确认', '四周泡泡爆开'],
    ['规则板展开', '纸片弹性'], ['条目 01 点亮', '左侧图标浮动'], ['条目 02 点亮', '键盘颗粒'], ['条目 03 点亮', '下潜切镜'],
    ['脚步一', '左脚+珊瑚摆动'], ['脚步二', '右脚+鱼群横穿'], ['旋身', '裙摆 3 帧展开'], ['定格', '镜头横摇落拍'],
    ['水母入场', '触手 1/4 拍'], ['低频脉冲', '圆环向外扩散'], ['DJ 刮碟', '声呐线扫描'], ['主唱回应', '两角构图切换'],
    ['评论泡出现', '文字粒子升起'], ['蓝泡', '尾鳍挑起'], ['金泡', '舞台闪烁'], ['泡泡雨', '匹配转场'],
    ['门框成型', '石块逐格堆砌'], ['存档图标', '3 色闪动'], ['色阶收缩', '调色板收窄'], ['门缝透光', '低频镜头抖动'],
    ['近景呼吸', '眼睛高光移动'], ['轻笑', '脸颊像素加亮'], ['左望', '头发延迟摆动'], ['抬头', '光束穿透海面'],
    ['信使入队', '鱼形信标绕行'], ['水母合拍', '四拍触手 wave'], ['光团上升', '群像拍手'], ['全员定格', '远景拉开'],
    ['方块堆叠', '每拍加一层'], ['海流反转', '气泡向下'], ['心跳白闪', '第 3 拍闪白'], ['跃迁门开', '标题碎片进入'],
    ['跃出水面', '浪花四散'], ['主标题亮起', '字符逐拍出现'], ['终止舞步', '尾鳍心形轨迹'], ['蓝色回声', '循环回到第一拍'],
  ]);

  window.ABYSSAL_TIMELINE = Object.freeze({ duration: 48, bpm: 124, shots, secondCues });
})();
