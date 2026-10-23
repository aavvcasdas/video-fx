/*
 * 潮汐 — single source of time for source audio, lyrics, picture and export.
 * Times are aligned to the supplied 31.843 s MP3 and should be refined only
 * here after a lyric review; frame functions remain pure functions of `t`.
 */
(() => {
  const lyrics = Object.freeze([
    { id: 'L01', start: 0.62, end: 2.42, text: '蓝色的海底', cue: '顶光落海，歌者第一次吸气', motif: 'sea' },
    { id: 'L02', start: 2.42, end: 4.42, text: '远山的风景', cue: '山脊在水面折射成两层', motif: 'mountain' },
    { id: 'L03', start: 4.42, end: 8.33, text: '我们的距离遥不可及', cue: '两枚光标被潮线越推越远', motif: 'distance' },
    { id: 'L04', start: 8.33, end: 10.43, text: '退守的爱情', cue: '珊瑚色纸片向后退潮', motif: 'retreat' },
    { id: 'L05', start: 10.43, end: 12.43, text: '还剩下回忆', cue: '记忆泡泡逐帧显影', motif: 'memory' },
    { id: 'L06', start: 12.43, end: 15.82, text: '疯狂地寻觅你的身影', cue: '声呐圆环扫过深海', motif: 'search' },
    { id: 'L07', start: 16.32, end: 18.12, text: '蓝色的海底', cue: '第二次潮起，色阶回到亮蓝', motif: 'sea' },
    { id: 'L08', start: 18.12, end: 20.12, text: '远山的风景', cue: '远山拆成像素层向左移动', motif: 'mountain' },
    { id: 'L09', start: 20.12, end: 24.03, text: '我们的距离遥不可及', cue: '两道轨迹跨不过发光分界', motif: 'distance' },
    { id: 'L10', start: 24.03, end: 26.13, text: '退守的爱情', cue: '尾迹倒放，手势收回胸前', motif: 'retreat' },
    { id: 'L11', start: 26.13, end: 28.13, text: '还剩下回忆', cue: '泡泡卡片聚成月牙', motif: 'memory' },
    { id: 'L12', start: 28.13, end: 31.62, text: '疯狂地寻觅你的身影', cue: '终场声呐变成潮汐标题', motif: 'search' },
  ]);

  const shots = Object.freeze([
    { start: 0, title: '蓝色海底', kicker: 'TIDE / OPEN', detail: '顶光 · 气泡 · 第一行识别卡', color: 'fx', pose: 'stand' },
    { start: 4, title: '远山折射', kicker: 'TIDE / VERSE', detail: '双层山影 · 漂浮歌者 · 距离线', color: 'motion', pose: 'dive' },
    { start: 8, title: '退守的潮线', kicker: 'TIDE / VERSE', detail: '后退纸片 · 回忆泡泡 · 卡片压拍', color: 'motion', pose: 'chorus' },
    { start: 12, title: '深海寻觅', kicker: 'TIDE / LIFT', detail: '声呐环 · 角色近景 · 光标搜索', color: 'fx', pose: 'dive' },
    { start: 16, title: '第二次潮起', kicker: 'TIDE / CHORUS', detail: '亮蓝色阶 · 山影像素 · 人声重入', color: 'cut', pose: 'stand' },
    { start: 20, title: '遥不可及', kicker: 'TIDE / CHORUS', detail: '两端轨迹 · 重拍拉远 · 潮流切镜', color: 'motion', pose: 'dive' },
    { start: 24, title: '回忆成月', kicker: 'TIDE / CODA', detail: '退潮尾迹 · 泡泡月牙 · 情绪抬升', color: 'fx', pose: 'chorus' },
    { start: 28, title: '你的身影', kicker: 'TIDE / OUTRO', detail: '声呐标题 · 逐字收束 · 回到海底', color: 'cut', pose: 'chorus' },
  ]);

  const secondCues = Object.freeze([
    ['前奏下潜', '顶光下切，气泡先于人声上浮'], ['蓝色的海底', '识别卡在第 1 个强拍弹入'], ['远山预显', '远景山脊以 3 层像素露出'], ['远山的风景', '歌者侧身，水面反射轻晃'],
    ['距离起笔', '两枚光标从同一点分开'], ['我们的距离', '潮线把光标推往画面两端'], ['遥不可及', '虚线断开，镜头后拉 1 格'], ['距离余波', '断点变成小气泡并上升'],
    ['退守的爱情', '珊瑚色纸片在强拍退后'], ['退潮手势', '手势缩回胸前，背景色降低'], ['还剩下回忆', '第一张记忆卡显影'], ['回忆浮起', '4 个泡泡轮流高亮'],
    ['疯狂地寻觅', '声呐从麦克风向外扩散'], ['寻找', '圆环扫过山影，鱼群避开'], ['你的身影', '轮廓光闪一下后隐去'], ['深海空拍', '只保留呼吸光与低频涟漪'],
    ['第二次潮起', '亮蓝色阶从底部回灌'], ['蓝色的海底', '歌词卡带着水滴重新进入'], ['远山预显', '远山换为像素平面并横移'], ['远山的风景', '歌者漂浮越过第二层山脊'],
    ['距离重拍', '两端信标在强拍亮起'], ['我们的距离', '信标沿各自轨迹离开中心'], ['遥不可及', '中央留下无法跨越的光缝'], ['距离切镜', '光缝放大成满屏潮线'],
    ['退守的爱情', '倒放尾迹把色彩拉回角色'], ['退潮停顿', '第 3 拍只保留裙带细节'], ['还剩下回忆', '泡泡卡片聚拢成月牙'], ['记忆成月', '月牙随弱拍旋转一格'],
    ['疯狂地寻觅', '终场声呐开始扫描标题'], ['寻找你的', '标题碎片依次点亮'], ['身影', '歌者合眼，水流绕成心跳线'], ['潮汐回声', '最后一拍回落至蓝色海底'],
  ]);

  window.ABYSSAL_TIMELINE = Object.freeze({
    title: '潮汐', duration: 31.843, bpm: 117, lyrics, shots, secondCues,
    recognition: Object.freeze({
      source: '潮汐.MP3',
      method: '音频时长、节拍峰值与歌词段落对齐草稿',
      status: 'draft — 可在 src/timeline.js 逐行校正',
    }),
  });
})();
