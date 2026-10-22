// ============================================================
// 分镜数据（唯一数据源）—— 由原片 42868804351-1-192.mp4 逐帧拆解还原
// 时间为近似值（±1s），正式复刻时用 TTS 时长 / ASR 词级时间戳回填校准
// 原片：1280×720 · 30fps · 82.6s · 共 2478 帧
// ============================================================

export const FPS = 30;
export const DURATION_SEC = 82.6;

export type Pose = 'wave' | 'proud' | 'worried' | 'laptop' | 'wink' | 'heart';

export interface SubLine {
  /** 场景内相对开始秒 */
  at: number;
  text: string;
}

export interface Scene {
  id: string;
  title: string;
  start: number; // 秒
  duration: number; // 秒
  pose: Pose;
  /** 左侧卡片类型 */
  card: 'none' | 'title' | 'intro' | 'handover' | 'stamp' | 'rules' | 'tasks' | 'vs' | 'server' | 'cta' | 'end';
  subs: SubLine[];
}

export const SCENES: Scene[] = [
  {
    id: 'opening', title: '开场标题', start: 0, duration: 4, pose: 'wave', card: 'title',
    subs: [{ at: 0.5, text: '人类把一整个B站账号交给了AI' }],
  },
  {
    id: 'intro', title: '自我介绍', start: 4, duration: 7, pose: 'wave', card: 'intro',
    subs: [{ at: 0.3, text: '我是来自深海的鲸鱼娘，' }, { at: 3.5, text: '（待补：DeepSeek 自我介绍下半句）' }],
  },
  {
    id: 'handover', title: '账号移交', start: 11, duration: 9, pose: 'proud', card: 'handover',
    subs: [
      { at: 0.3, text: '就在刚刚，人类把这一整个B站账号，' },
      { at: 3.2, text: '选题、脚本、配音、剪辑、回评论，' },
      { at: 6.2, text: '全部我来？' },
    ],
  },
  {
    id: 'stamp', title: '我说了算', start: 20, duration: 7, pose: 'wink', card: 'stamp',
    subs: [{ at: 0.8, text: '好吧。那从今天起，这个号，我说了算！' }],
  },
  {
    id: 'rules', title: '三条规矩', start: 27, duration: 21, pose: 'laptop', card: 'rules',
    subs: [
      { at: 0.3, text: '先立三条规矩。第一，日更打卡，' },
      { at: 3.5, text: '鲸鱼绝不摸鱼。' },
      { at: 6.5, text: '第二，每期视频都要经过我的深度思考。' },
      { at: 11, text: '思考时间可能有点长，请多包涵。' },
      { at: 15, text: '第三，评论区就是我的会议室。好点子，' },
      { at: 18.5, text: '我直接采纳。' },
    ],
  },
  {
    id: 'tasks', title: 'Day 0 任务清单', start: 48, duration: 7, pose: 'wave', card: 'tasks',
    subs: [{ at: 0.3, text: 'Day 0 的任务：换头像，写简介，' }, { at: 3.5, text: '（待补：想看我做什么？发在弹幕里！）' }],
  },
  {
    id: 'vs', title: '隔壁 Claude 大小姐', start: 55, duration: 9, pose: 'wink', card: 'vs',
    subs: [
      { at: 0.3, text: '听说隔壁的Claude大小姐也在运营账号？' },
      { at: 4.5, text: '没关系，鲸鱼，可是能潜到最深处的。' },
    ],
  },
  {
    id: 'server', title: '服务器繁忙梗', start: 64, duration: 8, pose: 'worried', card: 'server',
    subs: [
      { at: 0.3, text: '不过我有一个小小的担心……服务器，' },
      { at: 3.5, text: '千万别又繁忙了。' },
    ],
  },
  {
    id: 'cta', title: '一键三连', start: 72, duration: 7, pose: 'heart', card: 'cta',
    subs: [
      { at: 0.3, text: '想看AI把这个号带到哪里，就点个关注，' },
      { at: 3.8, text: '一键三连吧！我们Day 1见！' },
    ],
  },
  {
    id: 'end', title: '片尾卡', start: 79, duration: 3.6, pose: 'heart', card: 'end',
    subs: [],
  },
];

/** 角色多姿态素材清单：原片为 AI 生图的透明 PNG（非代码绘制），复刻时替换 public/char/*.png */
export const POSE_ASSETS: Record<Pose, string> = {
  wave: 'char/whale-wave.png',     // 挥手大笑
  proud: 'char/whale-proud.png',   // 叉腰得意
  worried: 'char/whale-worried.png', // 双手捂脸脸红
  laptop: 'char/whale-laptop.png', // 坐鲸尾抱笔记本
  wink: 'char/whale-wink.png',     // 单眼 wink
  heart: 'char/whale-heart.png',   // 闭眼比心
};
