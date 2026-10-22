/*
 * CAST BIBLE — one source of truth for all recurring characters.
 * Mirrors the PDoomVideo pattern: scene code receives a cast identity/pose;
 * visual assets and model-sheet facts never live inside a shot function.
 */
(() => {
  const ROOT = 'assets/cast/whale-maid';

  const whaleMaid = Object.freeze({
    id: 'whale-maid',
    code: 'REF-01',
    reference: Object.freeze({
      sourceVideo: '42868804351-1-192.mp4',
      sourceFrame: Object.freeze({ hands: '00:16', laptop: '00:32', standing: '01:04' }),
      lock: 'User-approved source-locked heroine. Do not redraw, replace, or alter silhouette details in the default pixel look.',
      features: Object.freeze([
        'blue-to-cyan long hair and single ahoge',
        'white ruffled maid headband',
        'whale-fin ears and blue side bows',
        'navy-and-white maid dress with whale apron mark',
        'dark-blue whale tail, white socks and navy shoes',
      ]),
    }),
    poses: Object.freeze({
      hands: `${ROOT}/source/hands.png`,
      laptop: `${ROOT}/source/laptop.png`,
      standing: `${ROOT}/source/standing.png`,
    }),
    // Each file is a saved visual treatment of the approved standing pose.
    // The original pose remains the default for `pixel` to retain exactness.
    styleSheets: Object.freeze({
      pixel: `${ROOT}/source/standing.png`,
      cel: `${ROOT}/styles/cel-pop.png`,
      ink: `${ROOT}/styles/ink-tide.png`,
      neon: `${ROOT}/styles/neon-sonar.png`,
      pixelRpg: `${ROOT}/styles/pixel-rpg.png`,
    }),
  });

  const members = Object.freeze([
    {
      id: 'lan', code: 'REF-01', icon: '◒', name: '鲸鱼娘 · 参考锁定', role: '主唱 / 源片形象母版',
      bio: '人物形象直接按用户提供视频复刻：蓝色渐变长发、女仆头饰、耳鳍、蓝白裙装、鲸图围裙和深蓝鲸尾。站姿、捧脸与笔记本三套姿势会按镜头调用。',
      specs: [['POSE', '03 源片姿势'], ['LOOK', '参考锁定'], ['STYLE', '04 已存参照'], ['PROP', '笔记本 / 鲸尾']], color: '#3866bc', type: 'whale'
    },
    {
      id: 'mimo', code: 'M-02', icon: '♧', name: '米沫 · 水母 DJ', role: '节拍设计 / 声呐采样',
      bio: '用 4 条触手分别控制鼓、贝斯、和声与环境音；蓄力时伞盖会按 8 分音符闪烁。',
      specs: [['RIG', '04 触手律动'], ['FACE', '03 眼神'], ['PROP', '珊瑚唱盘']], color: '#9e61d8', type: 'jelly'
    },
    {
      id: 'bo', code: 'M-03', icon: '›', name: '波波 · 信使鱼', role: '转场信使 / 镜头引导',
      bio: '不是装饰鱼群。它负责把观众的视线带进下一个镜头，并在每一个强拍留下轨迹。',
      specs: [['RIG', '03 游姿'], ['FACE', '02 表情'], ['PROP', '发光信标']], color: '#ef8c68', type: 'fish'
    },
    {
      id: 'luma', code: 'M-04', icon: '✦', name: '露玛 · 潮汐光团', role: '环境角标 / 能量可视化',
      bio: '把鼓点转译为可见的光。它能组成字幕、声呐环和转场粒子，也参与最终群像。',
      specs: [['RIG', '无限变形'], ['FACE', '02 状态'], ['PROP', '星屑尾迹']], color: '#54cfd2', type: 'orb'
    },
  ]);

  window.ABYSSAL_CAST = Object.freeze({ whaleMaid, members });
})();
