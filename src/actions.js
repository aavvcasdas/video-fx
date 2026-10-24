// ============================================================================
// src/actions.js — 深海鲸鱼娘 · 全动作库 (Action Performance Library)
// ============================================================================
// 参考 (reference) 项目：
//   1. YunYueSama/codex-deepseek-pet  «大肥鱼 🐋 蓝色鲸鱼娘桌宠»
//      docs/2D角色与动作规范.md & docs/工作与思考小动作设计.md 给出的“动作分组”
//      以及“准备 → 表演 → 恢复”的表演结构：走路 / 挥手 / 吃东西 / 跳舞 / 偷吃 /
//      入睡 / 鼓腮 / 思考 / 小得意 / 托腮 / 掰指头 / 哼歌 / 揉眼伸懒腰 / 藏 token /
//      想通忍笑 / 等待晃脚 / 偷看进度。
//   2. roseion/dsh-dayu-fish-skin  «DSH 大肥鱼皮肤»
//      顶部女仆巡游（来回踱步 + 停下来挥手）、双角色切换时的转身、点击换表情、
//      双击喂白饭（连击 → 吃饱打嗝）、鱼群追鼠标（视线跟随）。
//
// 本项目原先只有 5 个立绘姿势 (`wave/wink/panic/laptop/heart`)，MV 里因此反复
// 出现同样几个画面（用户反馈：“一直循环几个画面细节太少”“动作太少了”）。
// 本模块在**不新增美术素材**的前提下，用现有 7 骨骼像素 Rig 的完整可动参数
// （walk / kneel / hipL / hipR / aL / aR / tailWag / sq / dy / dx / rot /
//  jump / headTilt / lookX / lookY / view / eyes / mouth / emote / hat / smear）
// 组合出 32 个可复用的完整身体动作，并统一提供：
//
//   ACTIONS[name] = { zh, en, cat, dur, loop, pose(t, o) }
//   ACT_LIST                       // 有序动作清单（用于预览页 & 分镜排期）
//   byCat(cat)                     // 按分类取动作
//   pickAction(i, opts)            // 按序号轮转（防止连续两镜重复同一动作）
//   drawAction(ctx, x, y, u, name, t, extra)
//
// 所有动作都是**确定性**的纯函数（只依赖 t 与显式参数），因此可以逐帧渲染出
// 稳定可复现的 MP4，也可以直接在 studio 预览页里实时播放。
// ============================================================================

(function (root) {
  const CORE = root.CORE || (typeof require !== 'undefined' ? require('./core.js') : {});
  const WHALE = root.WHALE_GIRL || (typeof require !== 'undefined' ? require('./whale_girl.js') : {});

  const {
    clamp = (v, a, b) => Math.max(a, Math.min(b, v)),
    lerp = (a, b, k) => a + (b - a) * k,
    ease = (k) => k * k * (3 - 2 * k),
    easeOut = (k) => 1 - (1 - k) * (1 - k),
    easeIn = (k) => k * k,
    backOut = (k) => 1 + 2.7 * Math.pow(k - 1, 3) + 1.7 * Math.pow(k - 1, 2)
  } = CORE;

  const whaleGirl = WHALE.whaleGirl || (() => {});
  const feel = WHALE.feel || ((n) => ({ emotion: n }));
  const spinView = WHALE.spinView || ((t, s) => ({ view: 'front' }));

  const TAU = Math.PI * 2;
  const wave01 = (t, hz = 1, ph = 0) => Math.sin(t * TAU * hz + ph);
  // 单次表演内的“准备 → 表演 → 恢复”包络
  const perform = (k, prep = 0.18, recover = 0.22) =>
    k < prep ? ease(k / prep) : (k > 1 - recover ? 1 - ease((k - (1 - recover)) / recover) : 1);

  // ---------------------------------------------------------------------------
  // 动作定义：pose(t, o) 返回传给 whaleGirl 的参数补丁
  //   t = 进入该动作后的秒数（循环动作请自行对 dur 取模）
  // ---------------------------------------------------------------------------
  const DEF = {
    // ==== 待机 & 呼吸 =========================================================
    idle: {
      zh: '呼吸待机', en: 'Idle Breathe', cat: 'idle', dur: 3.2, loop: true,
      pose: (t) => ({ ...feel('idle', t), sq: Math.sin(t * 2.2) * 0.02, tailWag: Math.sin(t * 1.6) * 0.05 })
    },
    blinkIdle: {
      zh: '待机 + 眨眼', en: 'Idle Blink', cat: 'idle', dur: 4.0, loop: true,
      pose: (t) => ({ ...feel('calm', t), squint: (t % 3.4) < 0.12 ? 0.95 : 0 })
    },
    lookAround: {
      zh: '东张西望', en: 'Look Around', cat: 'idle', dur: 4.2, loop: true,
      pose: (t) => {
        const p = (t % 4.2) / 4.2;
        const lookX = p < 0.3 ? -1 : p < 0.55 ? 0 : p < 0.85 ? 1 : 0;
        return {
          ...feel('confused', t),
          lookX, headTilt: lookX * 0.16,
          view: p > 0.3 && p < 0.85 ? 'q' : 'front',
          flip: lookX > 0,
          mouth: 'flat'
        };
      }
    },
    shakeTail: {
      zh: '轻摇尾巴', en: 'Tail Sway', cat: 'idle', dur: 1.6, loop: true,
      pose: (t) => ({ ...feel('happy', t), tailWag: Math.sin(t * TAU * 1.4) * 0.22, sq: Math.sin(t * 2.6) * 0.02 })
    },
    nod: {
      zh: '点头', en: 'Nod', cat: 'idle', dur: 1.4, loop: true,
      pose: (t) => ({ ...feel('happy', t), headTilt: Math.sin(t * TAU * 1.1) * 0.10, sq: Math.sin(t * TAU * 2.2) * 0.015 })
    },
    headShake: {
      zh: '摇头', en: 'Head Shake', cat: 'idle', dur: 1.4, loop: true,
      pose: (t) => ({ ...feel('deadpan', t), headTilt: Math.sin(t * TAU * 1.6) * 0.2, mouth: 'flat' })
    },

    // ==== 移动 ==============================================================
    walk: {
      zh: '散步（完整步态循环）', en: 'Walk Cycle', cat: 'move', dur: 1.3, loop: true,
      pose: (t) => ({
        ...feel('calm', t), view: 'q', walk: (t / 1.3) % 1, flip: false,
        aL: -0.5 + Math.sin((t / 1.3) * TAU) * 0.25, aR: 0.6 - Math.sin((t / 1.3) * TAU) * 0.25
      })
    },
    walkBack: {
      zh: '转身走回（背面）', en: 'Walk Back', cat: 'move', dur: 1.3, loop: true,
      pose: (t) => ({ ...feel('calm', t), view: 'back', walk: (t / 1.3) % 1, flip: true })
    },
    run: {
      zh: '快跑（带残影）', en: 'Run + Smear', cat: 'move', dur: 0.62, loop: true,
      pose: (t) => ({
        ...feel('excited', t), view: 'side', walk: (t / 0.62) % 1, smear: 0.8,
        aL: -0.85, aR: 1.15, sq: -0.06
      })
    },
    sneak: {
      zh: '蹑手蹑脚', en: 'Sneak', cat: 'move', dur: 1.8, loop: true,
      pose: (t) => ({
        ...feel('nervous', t), view: 'q', kneel: 0.34, walk: ((t / 1.8) % 1) * 0.7,
        aL: -0.15, aR: 0.35, headTilt: -0.1, emote: 'sweat', emoteK: 0.6
      })
    },
    dance: {
      zh: '跳舞（四拍律动）', en: 'Dance 4-Beat', cat: 'move', dur: 2.1, loop: true,
      pose: (t) => {
        const beat = Math.floor(t / 0.525) % 4;
        const hop = Math.abs(Math.sin(t * TAU * 0.95)) * 12;
        return {
          ...feel(beat % 2 ? 'joy' : 'happy', t),
          jump: hop, sq: Math.sin(t * TAU * 1.9) * 0.06,
          rot: Math.sin(t * TAU * 0.95) * 0.05,
          aL: beat === 0 ? -1.6 : beat === 1 ? 0.2 : beat === 2 ? -1.2 : 0.6,
          aR: beat === 0 ? 1.6 : beat === 1 ? -0.2 : beat === 2 ? 1.2 : -0.6,
          tailWag: Math.sin(t * TAU * 1.9) * 0.2,
          emote: 'music'
        };
      }
    },
    cheerJump: {
      zh: '欢呼跳跃', en: 'Cheer Jump', cat: 'move', dur: 1.5, loop: true,
      pose: (t) => {
        const p = (t % 1.5) / 1.5;
        const air = Math.sin(clamp(p / 0.75, 0, 1) * Math.PI);
        return {
          ...feel('joy', t), jump: Math.max(0, air) * 70 * (p < 0.75 ? 1 : 0),
          sq: p < 0.1 ? -0.12 : (p > 0.78 && p < 0.9 ? -0.1 : 0),
          aL: -1.9, aR: 1.9, view: 'front', emote: 'sparkle', waveArm: true
        };
      }
    },
    spin: {
      zh: '360° 转身', en: 'Spin Turn', cat: 'move', dur: 2.2, loop: false,
      pose: (t) => {
        const k = clamp(t / 2.2, 0, 1);
        const vw = spinView(k * 2.2, 2.2);
        return { ...feel('proud', t), view: vw.view, rot: Math.sin(k * TAU) * 0.06, aR: 1.1 };
      }
    },
    crouch: {
      zh: '蹲下（降到地面）', en: 'Crouch', cat: 'move', dur: 2.4, loop: false,
      pose: (t) => ({ ...feel('calm', t), kneel: clamp(t / 0.5, 0, 1) * (t > 1.9 ? 1 - ease(clamp((t - 1.9) / 0.5, 0, 1)) : 1), sq: -0.05 })
    },

    // ==== 位移姿态 ==========================================================
    tailSit: {
      zh: '盘尾坐（尾巴当坐垫）', en: 'Tail Cushion Sit', cat: 'body', dur: 3.6, loop: true,
      pose: (t) => ({ ...feel('calm', t), tailSit: true, tailWag: Math.sin(t * 1.5) * 0.1, headTilt: Math.sin(t * 1.1) * 0.05 })
    },
    kneelPick: {
      zh: '单膝跪地捡东西', en: 'Kneel & Pick Up', cat: 'body', dur: 2.6, loop: false,
      pose: (t) => {
        const kn = t < 0.7 ? ease(t / 0.7) : (t < 1.7 ? 1 : 1 - ease(clamp((t - 1.7) / 0.7, 0, 1)));
        return { ...feel('focused', t), kneel: kn * 0.9, aR: 1.0 - kn * 0.9, view: kn > 0.3 ? 'q' : 'front' };
      }
    },
    kickTail: {
      zh: '甩尾拍水', en: 'Tail Swat', cat: 'body', dur: 1.1, loop: true,
      pose: (t) => ({ ...feel('proud', t), tailWag: Math.sin(t * TAU * 0.9) * 0.5, rot: Math.sin(t * TAU * 0.9) * 0.05, aL: -0.9 })
    },
    stretch: {
      zh: '伸懒腰', en: 'Stretch', cat: 'body', dur: 2.8, loop: false,
      pose: (t) => {
        const k = perform(t / 2.8, 0.25, 0.3);
        return {
          ...feel(k > 0.4 ? 'happy' : 'sleepy', t),
          aL: -0.45 - k * 1.35, aR: 0.95 + k * 1.1,
          sq: k * 0.10, dy: -k * 0.18, headTilt: -k * 0.12,
          emote: k > 0.5 ? 'sparkle' : null, emoteK: 0.7
        };
      }
    },
    rubEyes: {
      zh: '揉眼睛', en: 'Rub Eyes', cat: 'body', dur: 2.2, loop: false,
      pose: (t) => {
        const k = perform(t / 2.2, 0.15, 0.25);
        return {
          ...feel('sleepy', t), squint: 0.9,
          aL: -0.5 - k * 1.0 + Math.sin(t * 9) * 0.12 * k,
          aR: 1.0 + k * 1.0 + Math.sin(t * 9) * 0.12 * k,
          headTilt: Math.sin(t * 5) * 0.06 * k, mouth: 'o'
        };
      }
    },
    sofaSitSwap: {
      zh: '坐姿换腿（晃脚）', en: 'Sit & Swing Feet', cat: 'body', dur: 3.0, loop: true,
      pose: (t) => ({ ...feel('happy', t), tailSit: true, hipL: Math.sin(t * 2.4) * 0.18, hipR: -Math.sin(t * 2.4) * 0.18, headTilt: Math.sin(t * 1.6) * 0.06 })
    },
    sleep: {
      zh: '蜷起来睡觉', en: 'Curl Up & Sleep', cat: 'body', dur: 4.0, loop: true,
      pose: (t) => ({
        ...feel('sleepy', t), tailSit: true, eyes: 'lids', mouth: 'o',
        headTilt: 0.18, kneel: 0.25, sq: Math.sin(t * 1.2) * 0.03,
        emote: 'zzz', emoteK: 0.9
      })
    },

    // ==== 情绪 / 表情表演 ====================================================
    wave: {
      zh: '挥手打招呼', en: 'Wave Hello', cat: 'express', dur: 2.2, loop: true,
      pose: (t) => ({ ...feel('happy', t), waveArm: true, aR: 1.2 + Math.sin(t * 9.5) * 0.42, aL: -0.35 })
    },
    waveBoth: {
      zh: '双手挥手欢呼', en: 'Both Hands Wave', cat: 'express', dur: 2.0, loop: true,
      pose: (t) => ({
        ...feel('joy', t), waveArm: true,
        aR: 1.35 + Math.sin(t * 9) * 0.4, aL: -0.5 - Math.sin(t * 9 + 0.7) * 0.4,
        jump: Math.abs(Math.sin(t * 3)) * 8, emote: 'sparkle'
      })
    },
    heart: {
      zh: '双手比心', en: 'Heart Hands', cat: 'express', dur: 2.6, loop: true,
      pose: (t) => ({ ...feel('love', t), heartHands: true, sq: Math.sin(t * 3) * 0.02, emote: 'heart' })
    },
    blushPuff: {
      zh: '鼓腮（嘴硬）', en: 'Puff Cheeks', cat: 'express', dur: 2.4, loop: true,
      pose: (t) => {
        const k = (t % 2.4) / 2.4;
        return {
          ...feel('pout', t), blush: true, sq: 0.05 + Math.sin(t * 3.2) * 0.03,
          headTilt: 0.1, mouth: 'pout', cheeks: 1, emote: k > 0.6 ? 'anger' : null, emoteK: 0.5
        };
      }
    },
    cry: {
      zh: '哭（眼泪）', en: 'Cry', cat: 'express', dur: 3.0, loop: true,
      pose: (t) => ({ ...feel('cry', t), eyes: 'cry', mouth: 'waveO', emote: 'sweat', sq: Math.sin(t * 8) * 0.03 })
    },
    proud: {
      zh: '小得意 / 忍笑', en: 'Smug & Proud', cat: 'express', dur: 2.4, loop: true,
      pose: (t) => {
        const k = (t % 2.4) / 2.4;
        return {
          ...feel('proud', t), hips: true, tailMode: 'highRight',
          headTilt: -0.08 + Math.sin(t * 2.4) * 0.04,
          emote: k > 0.35 && k < 0.8 ? 'sparkle' : null
        };
      }
    },
    thinkChin: {
      zh: '托腮思考', en: 'Thinking Chin Rest', cat: 'express', dur: 3.4, loop: true,
      pose: (t) => {
        const p = (t % 3.4) / 3.4;
        return {
          ...feel('thinking', t), tailSit: t > 1.2,
          aR: 1.35 + Math.sin(t * 1.6) * 0.06, aL: -0.25,
          headTilt: 0.14, lookX: p < 0.5 ? -1 : 0.4, mouth: 'flat',
          emote: p > 0.7 ? 'idea' : null, emoteK: 0.8
        };
      }
    },
    countFingers: {
      zh: '掰指头数数', en: 'Count on Fingers', cat: 'express', dur: 3.2, loop: false,
      pose: (t) => {
        const step = Math.floor(t / 0.55) % 4;
        return {
          ...feel('focused', t), aL: -1.25, aR: 0.55 - step * 0.08,
          headTilt: -0.06 + step * 0.04, lookX: -1,
          mouth: step % 2 ? 'o' : 'flat',
          emote: t > 2.6 ? 'idea' : null
        };
      }
    },
    hum: {
      zh: '偷偷哼歌', en: 'Hum a Tune', cat: 'express', dur: 3.6, loop: true,
      pose: (t) => ({
        ...feel('singing', t), eyes: 'happy', mouth: 'openSmile', headTilt: Math.sin(t * 2.6) * 0.12,
        rot: Math.sin(t * 2.6) * 0.03, tailWag: Math.sin(t * 2.6) * 0.16,
        aL: -0.8, aR: 0.5, emote: 'music'
      })
    },
    sing: {
      zh: '放声唱歌', en: 'Sing Out', cat: 'express', dur: 2.0, loop: true,
      pose: (t) => ({
        ...feel('singing', t), talking: true, eyes: 'happy',
        aR: 1.15 + Math.sin(t * 4) * 0.12, aL: -0.55,
        headTilt: Math.sin(t * 3) * 0.1, emote: 'music', emoteK: 1
      })
    },
    fistPump: {
      zh: '握拳“成了！”', en: 'Fist Pump Yes!', cat: 'express', dur: 1.8, loop: false,
      pose: (t) => {
        const k = perform(t / 1.8, 0.2, 0.25);
        return {
          ...feel('excited', t), aR: 0.3 + k * 1.6 + Math.sin(t * 12) * 0.06 * k, aL: -0.4,
          jump: Math.abs(Math.sin(t * 5)) * 14 * k, sq: k * 0.08,
          emote: 'sparkle', headTilt: -0.06 * k
        };
      }
    },

    // ==== 生活小动作（参考大肥鱼桌宠的“吃白饭 / 偷吃 token”系列）================
    eat: {
      zh: '吃白饭 / 嚼 token', en: 'Eat Rice & Tokens', cat: 'life', dur: 3.4, loop: false,
      pose: (t) => {
        const p = (t % 3.4) / 3.4;
        const lift = p < 0.25 ? ease(p / 0.25) : (p > 0.8 ? 1 - ease((p - 0.8) / 0.2) : 1);
        const chew = p > 0.3 && p < 0.8 ? (Math.floor(t * 5) % 2 ? 'o' : 'openSmile') : 'smile';
        return {
          ...feel('happy', t), aR: 0.4 + lift * 1.5 + Math.sin(t * 8) * 0.05 * lift,
          aL: -0.35, mouth: chew, sq: Math.sin(t * 12) * 0.02 * (p > 0.3 && p < 0.8 ? 1 : 0),
          headTilt: 0.06 * lift, armR: makeBowlProp(lift),
          emote: p > 0.86 ? 'heart' : null, emoteK: 0.6
        };
      }
    },
    sneakTreat: {
      zh: '偷吃一颗 token', en: 'Sneak a Token', cat: 'life', dur: 3.0, loop: false,
      pose: (t) => {
        const p = (t % 3.0) / 3.0;
        const grab = p < 0.35 ? ease(p / 0.35) : 1;
        const hide = p > 0.7 ? ease((p - 0.7) / 0.3) : 0;
        return {
          ...feel(hide > 0.4 ? 'nervous' : 'smug', t), view: p < 0.3 ? 'q' : 'front',
          lookX: p < 0.5 ? 1 : 0, kneel: grab * 0.22 * (1 - hide),
          aR: 0.4 + grab * 1.2 - hide * 0.9, aL: -0.3,
          mouth: p > 0.4 && p < 0.62 ? 'o' : 'smile',
          emote: hide > 0.3 ? 'sweat' : null, emoteK: 0.8
        };
      }
    },
    laptop: {
      zh: '盘尾敲代码', en: 'Code on Laptop', cat: 'life', dur: 2.4, loop: true,
      pose: (t) => ({
        ...feel('typing', t), tailSit: true, poseMode: 'laptop',
        aL: -0.55 + Math.sin(t * 11) * 0.06, aR: 1.05 + Math.sin(t * 13) * 0.06,
        headTilt: Math.sin(t * 1.4) * 0.05, mouth: 'flat',
        armR: makeLaptopProp()
      })
    },
    peek: {
      zh: '偷看工作进度', en: 'Peek at Progress', cat: 'life', dur: 3.0, loop: false,
      pose: (t) => {
        const p = (t % 3.0) / 3.0;
        const k = perform(p, 0.3, 0.3);
        return {
          ...feel('confused', t), headTilt: -0.12 * k, lookX: 1 * k,
          view: p > 0.25 && p < 0.8 ? 'q' : 'front', flip: true,
          kneel: 0.1 * k, aL: -0.4, aR: 0.6 - 0.25 * k, mouth: 'flat',
          emote: p > 0.75 ? 'question' : null, emoteK: 0.7
        };
      }
    },
    nodOff: {
      zh: '打瞌睡（点头）', en: 'Nod Off', cat: 'life', dur: 4.4, loop: true,
      pose: (t) => {
        const p = (t % 4.4) / 4.4;
        const drowse = p < 0.75 ? ease(p / 0.75) : 1 - ease((p - 0.75) / 0.25);
        return {
          ...feel('sleepy', t), tailSit: true, squint: drowse * 0.95,
          headTilt: 0.1 + drowse * 0.25, sq: -drowse * 0.04,
          mouth: 'o', emote: p > 0.55 ? 'zzz' : null, emoteK: 0.7 * drowse
        };
      }
    }
  };

  // ---- 道具回调（手掌坐标系内绘制，跟随手臂摆动）--------------------------------
  function makeBowlProp(lift = 1) {
    return (ctx, u) => {
      ctx.save();
      ctx.translate(0, 0.18 * u);
      // 碗
      ctx.fillStyle = '#F8FAFC';
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = Math.max(1.2, 0.06 * u);
      ctx.beginPath();
      ctx.moveTo(-0.55 * u, 0);
      ctx.quadraticCurveTo(0, 0.62 * u, 0.55 * u, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // 白饭堆
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(0, -0.06 * u, 0.46 * u, 0.22 * u, 0, Math.PI, TAU);
      ctx.fill();
      ctx.stroke();
      // 筷子
      ctx.strokeStyle = '#B45309';
      ctx.lineWidth = Math.max(1, 0.05 * u);
      ctx.beginPath();
      ctx.moveTo(-0.1 * u, -0.3 * u);
      ctx.lineTo(0.55 * u, -0.85 * u * lift);
      ctx.moveTo(0.06 * u, -0.28 * u);
      ctx.lineTo(0.74 * u, -0.78 * u * lift);
      ctx.stroke();
      ctx.restore();
    };
  }

  function makeLaptopProp() {
    return (ctx, u) => {
      ctx.save();
      ctx.translate(0, 0.05 * u);
      ctx.fillStyle = '#CBD5E1';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = Math.max(1.2, 0.055 * u);
      ctx.beginPath();
      ctx.roundRect(-0.62 * u, -0.10 * u, 1.24 * u, 0.16 * u, 0.05 * u);
      ctx.fill();
      ctx.stroke();
      // 屏幕上一只小鲸鱼
      ctx.fillStyle = '#2563EB';
      ctx.beginPath();
      ctx.ellipse(0, -0.02 * u, 0.16 * u, 0.06 * u, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    };
  }

  // ---------------------------------------------------------------------------
  // 每帧绘制：`drawAction(ctx, x, y, u, name, t, extra)`
  //   name  : 动作名（ACTIONS 的键）
  //   t     : 进入动作后的秒数（自动按 dur 循环）
  //   extra : 额外覆盖参数（x/y/flip/hat/style/view…）
  // ---------------------------------------------------------------------------
  function resolve(name) {
    return DEF[name] ? DEF[name] : DEF.idle;
  }

  function poseOf(name, t, extra = {}) {
    const def = resolve(name);
    const d = def.dur || 2;
    const local = def.loop ? ((t % d) + d) % d : clamp(t, 0, d);
    return Object.assign({ poseName: name, actionDef: def }, def.pose(local, extra), extra);
  }

  function drawAction(ctx, x, y, u, name, t, extra = {}) {
    const opts = poseOf(name, t, extra);
    whaleGirl(ctx, x, y, u, Object.assign({ t: extra.t !== undefined ? extra.t : t }, opts));
    return opts;
  }

  // ---------------------------------------------------------------------------
  // 动作排期工具：轮转取动作，避免连续两镜重复（用户反馈“一直循环几个画面”）
  // ---------------------------------------------------------------------------
  const ACT_LIST = Object.keys(DEF);
  function byCat(cat) {
    return ACT_LIST.filter((k) => DEF[k].cat === cat);
  }
  // 稳定但不重复的轮换序列（黄金分割步进，任意相邻 5 个都不相同）
  function pickAction(i, pool) {
    const list = pool && pool.length ? pool : ACT_LIST;
    const golden = 0.6180339887;
    const idx = Math.floor(((i * golden) % 1) * list.length);
    return list[clamp(idx, 0, list.length - 1)];
  }

  const ACTIONS = {};
  for (const k of ACT_LIST) ACTIONS[k] = DEF[k];

  const api = {
    ACTIONS,
    ACT_LIST,
    ACTION_LIST: ACT_LIST,
    ACTION_NAMES: ACT_LIST,
    byCat,
    pickAction,
    poseOf,
    drawAction,
    makeBowlProp,
    makeLaptopProp
  };

  root.ACTIONS = ACTIONS;
  root.ACTION_LIST = ACT_LIST;
  root.ACT = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
