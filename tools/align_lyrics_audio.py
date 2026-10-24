#!/usr/bin/env python3
"""tools/align_lyrics_audio.py — 用**人声活动检测**给歌词行定时。

问题：旧版字幕时间轴是手写的，等于猜（用户反馈“歌词和字幕不匹配 / 字幕对不上”）。

做法：
1. 把音轨解码成 16k 单声道，按 20ms 计算 RMS 能量。
2. 做自适应阈值 + 最小间隙合并，得到"有人声的乐句"（phrase）区间。
3. 把歌词行（人工整理的正确歌词，按演唱顺序）按顺序分配到乐句上：
   用动态规划做单调对齐，行数少于乐句数时优先选能量更强的乐句
   （弱乐句多为间奏鼓点），行数多于乐句数时合并相邻乐句。
4. 输出 `src/timings/<key>.json`，渲染器直接读取。

这样字幕的起止点落在**真的有人声唱的乐句**上，而不是均匀网格。
与 `tools/ocr_reference_subs.py` 的 OCR 结果可以互相校验（docs/SUB_TIMING.md）。

用法：
    /tmp/ocrenv/bin/python tools/align_lyrics_audio.py all
    /tmp/ocrenv/bin/python tools/align_lyrics_audio.py xinqiang
"""
import json
import os
import subprocess
import sys
import wave
import array
import math

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FFMPEG = os.environ.get("FFMPEG_PATH", "/tmp/tools/node_modules/@ffmpeg-installer/linux-x64/ffmpeg")

SR = 16000
HOP = 0.02  # 20ms

# ---------------------------------------------------------------------------
# 每首歌的正确歌词（按演唱顺序）。只写歌词本身，时间由算法测出来。
# ---------------------------------------------------------------------------
LYRICS = {
    "xinqiang": [
        "第一次遇见阴天 遮住你侧脸", "有什么故事好想了解", "我感觉我懂你的特别",
        "你的心有一道墙", "但我发现一扇窗", "偶尔透出一丝暖暖的微光",
        "你的心有一道墙", "但我发现一扇窗", "偶尔透出一丝暖暖的微光",
        "就算你有一道墙", "我的爱会攀上窗台盛放", "打开窗你会看到悲伤融化",
        "你会闻到幸福晴朗的芬芳"
    ],
    "ribuluo": [
        "我要送你日不落的想念", "寄出代表爱的明信片", "我要送你日不落的爱恋",
        "心牵着心把世界走遍", "你就是庆典 你就是晴天", "我的爱未眠",
        "不落的想念 飞在你身边", "我的爱未眠", "你睡吧 我不睡",
        "祈祷你像英勇的禁卫军", "动也不动地守护爱情", "你在回忆里留下的脚印",
        "是我爱的风景", "我要送你日不落的想念", "寄出代表爱的明信片",
        "我要送你日不落的爱恋", "心牵着心把世界走遍"
    ],
    "lianai_ing": [
        "陪你熬夜 聊天到爆肝也没关系", "陪你逛街 逛成扁平足也没关系",
        "超感谢你 让我重生 整个 ORZ", "让我重新认识 LOVE",
        "恋爱 ING happy ING", "心情就像是 坐上一台喷射机",
        "恋爱 ING 改变 ING", "改变了黄昏 黎明", "有你 都心跳到不行"
    ],
    "jimo_yanhuo": [
        "跨越过多少海洋去看你", "孤单的黑夜途中", "只要想着你", "我就不会惶恐",
        "时光的岸上人来了又走", "离开时你不用说我都懂", "感谢你曾让我",
        "留在你眼中", "我曾经走过最遥远的路", "想要去拥抱未成真的梦",
        "迷失的黑夜途中", "只要想起你", "就点亮了星空",
        "流浪的纸船忘不掉港口", "渐灭的花火割不断彩虹", "你就是我心中",
        "永恒的天空", "寂寞烟火"
    ],
    "ba_huiyi_56": [
        "我们都是天真 真实存在的", "祈愿小世界里不只有我", "直到遇见你 我以为就光明起来",
        "眼睛里看到的都是 广袤无垠的大海", "有你在的日子里不可能被击败",
        "在最难熬的日子 你陪着我", "你让我学会如何拨开阴霾", "将快乐全部留下来",
        "将不开心全都抛开", "你对我说的情话", "像转瞬即逝的烟花",
        "只停在绚烂的一刹那", "我却已无法自拔", "我们的爱总有时差",
        "也为你骗自己放下", "爱炙热的你 却忘了爱自己", "把回忆拼好给你"
    ],
    "douyin_6": [
        "我的世界 正在下雨", "大概 从你带我回家时放晴", "一头钻进了你拆开的快递",
        "让我成为你的惊喜", "主人别哭泣", "如果真有你说的命理",
        "哪怕变成了一颗星星", "还能再见到你"
    ],
    "chaoxi": [
        "枯树还没发芽 就被逼着开花", "妈妈说要快乐 却没告诉我方法",
        "成长它教会我 咽下多少风沙", "从黑夜到黎明 不管有多难耐",
        "失落陪着眼泪 汇成了这片海", "潮汐随月光澎湃 冲破深海的阴霾",
        "跃向星河的舞台 鲸歌在夜空盛开", "潮落之后再重来 迎接破晓的蔚蓝"
    ],
    "pengyou_de_jiu": [
        "昨日一去不复回 开心比什么都贵", "覆水不能再收回 桃花谢了又开",
        "人生几何能够得到知己", "来吧朋友干了这杯酒", "快把酒满上干了这杯大声歌唱",
        "好朋友好朋友今宵多欢畅", "理想改变了我们的模样", "也让我懂得了要珍惜朋友的肩膀",
        "阳光总会在风雨之后撒向苍茫", "让我们抬起头学会了坚强", "就像朋友的这杯烈酒烫我心上",
        "温暖我凡事别再放心上",
        "昨日一去不复回 开心比什么都贵", "覆水不能再收回 桃花谢了又开",
        "人生几何能够得到知己", "来吧朋友干了这杯酒", "快把酒满上干了这杯大声歌唱",
        "好朋友好朋友今宵多欢畅", "理想改变了我们的模样", "也让我懂得了要珍惜朋友的肩膀",
        "阳光总会在风雨之后撒向苍茫", "让我们抬起头学会了坚强", "就像朋友的这杯烈酒烫我心上",
        "温暖我凡事别再放心上"
    ],
    "ba_huiyi_pinhao": [
        "我们都是天真 真实存在的", "祈愿小世界里不只有我", "直到遇见你 我以为就光明起来",
        "眼睛里看到的都是 广袤无垠的大海", "有你在的日子里不可能被击败",
        "在最难熬的日子 你陪着我", "你让我学会如何拨开阴霾", "将快乐全部留下来",
        "将不开心全都抛开", "你对我说的情话", "像转瞬即逝的烟花",
        "只停在绚烂的一刹那", "我却已无法自拔", "我们的爱总有时差",
        "也为你骗自己放下", "爱炙热的你 却忘了爱自己", "把回忆拼好给你"
    ],
    "feng": [
        "乌云在我们心里搁下一块阴影", "我聆听沉寂已久的心情", "清晰透明就像美丽的风景",
        "总在回忆里才看的清", "被伤透的心能不能够继续爱我", "我用力牵起没温度的双手",
        "过往温柔已经被时间上锁", "只剩挥散不去的难过", "缓缓飘落的枫叶像思念",
        "我点燃烛火温暖岁末的秋天", "极光掠夺天边", "北风掠过想你的容颜",
        "我把爱烧成了落叶", "却换不回熟悉的那张脸", "缓缓飘落的枫叶像思念",
        "为何挽回要赶在冬天来之前", "爱你穿越时间", "两行来自秋末的眼泪",
        "让爱渗透了地面", "我要的只是你在我身边",
        "被伤透的心能不能够继续爱我", "我用力牵起没温度的双手", "过往温柔已经被时间上锁",
        "只剩挥散不去的难过", "在山腰间飘逸的红雨随着北风凋零", "我轻轻摇曳风铃",
        "想唤醒被遗弃的爱情", "雪花已铺满了地", "深怕窗外枫叶已结成冰",
        "缓缓飘落的枫叶像思念", "我点燃烛火温暖岁末的秋天", "极光掠夺天边",
        "北风掠过想你的容颜", "我把爱烧成了落叶", "却换不回熟悉的那张脸",
        "缓缓飘落的枫叶像思念", "为何挽回要赶在冬天来之前", "爱你穿越时间",
        "两行来自秋末的眼泪", "让爱渗透了地面", "我要的只是你在我身边"
    ],
    "huainvhai": [
        "I miss you", "Now", "don't you love me", "Sorry I'm so sorry",
        "那时我放开了的手", "转过身只剩了保重", "你话都没说 却哭了很久很久",
        "我喜欢坏坏的女友", "我喜欢刺激的感受", "你单纯太过 多余了那些温柔",
        "你消失在无名大街", "从此就没有再见面", "好长的时间 再没有你的来电",
        "在后来酒吧的房间", "舞池里跳动着音乐", "熟悉的侧脸 哦",
        "迷人的笑脸 吸引视线", "慵懒的靠在陌生肩", "黑色的眼线 你的指间",
        "有一点轻蔑", "在谁的怀中会有感觉", "被爱的深夜我在想念",
        "明明是为你才会改变", "却回不到从前"
    ],
    "meiguihua": [
        "离开你一百个星期", "我回到了这里", "寻找我们爱过的证据",
        "没有人愿意提起", "玫瑰花它的过去", "今天这里的主题",
        "我把它叫作回忆", "我知道爱情这东西", "它没什么道理",
        "过去我和你在一起", "是我自己太叛逆", "现在只剩我自己",
        "偷偷地想你", "玫瑰花葬礼", "真的好美丽",
        "你让我怎么忘记"
    ],
    "qunian_xiatian": [
        "坏掉的脑子 啊疼不痛", "这雨下得不合时宜", "总会过分要命的闷", "在这个时候",
        "我都会想象的念头", "别怕你就算我是你的", "小小狗也总会被打痛",
        "意念中的开心 却总是被一次掏空", "在去年夏天跟你说了", "一个小小要求",
        "答应了不放手", "还记得", "这故事中的人不太精彩", "夏去了又回来",
        "而人却已不在", "它重复着我汹涌的忍耐", "我拿了总会还", "你拿了就逃开",
        "在失去中我慢慢的变呆", "是不同步的未来", "却把记忆中的日记更改",
        "把虚伪的尘埃", "也全部都掩盖", "把每次心痛 都当成活该",
        "把心慢慢的释怀", "我相信总有一天你会明白"
    ],
    "suyan": [
        "这是一个浪漫的夏天", "我骑着单车带你去海边", "你说你喜欢这种感觉",
        "因为我对你很有感觉", "那是一个难忘的夏天", "我们相识在某个地点",
        "你说你喜欢这种感觉", "因为我对你很有感觉",
        "再靠近一点点", "就让你牵手", "再靠近一点点", "就让你拥有",
        "我已经准备好", "当一个好女友"
    ],
}

# 音频来源与时长：优先用仓库里的 mp3，没有就直接从参考片 `mv/*.mp4` 抽音轨
#（旧版 render_mv_folder.mjs 引用的 assets/mv_audio/*.mp3 从来没进过仓库）
AUDIO = {
    "xinqiang":        ("mv/心墙.mp4", 34.02),
    "ribuluo":         ("mv/日不落.mp4", 45.81),
    "lianai_ing":      ("mv/发现更多精彩视频 - 抖音搜索_2.mp4", 54.73),
    "jimo_yanhuo":     ("mv/寂寞烟火.mp4", 55.24),
    "ba_huiyi_56":     ("mv/《把回忆拼好给你》.mp4", 56.03),
    "douyin_6":        ("每天每天的抖音 - 抖音_6.mp4", 46.68),
    "ba_huiyi_pinhao": ("椰子水很甜 - 把回忆拼好给你（纯享Beat）.mp3", 142.10),
    "chaoxi":          ("assets/chaoxi.mp3", 31.84),
    "pengyou_de_jiu":  ("assets/pengyou_de_jiu.mp3", 188.25),
    "qunian_xiatian":  ("去年夏天.mp4", 78.20),
    "feng":            ("mv/枫.mp4", 274.58),
    "huainvhai":       ("mv/坏女孩.mp4", 245.55),
    "meiguihua":       ("mv/玫瑰花的葬礼.mp4", 236.77),
    "suyan":           ("mv/素颜1.mp4", 238.05),
}


def decode_pcm(path):
    wav = "/tmp/_align_tmp.wav"
    subprocess.run(
        [FFMPEG, "-y", "-hide_banner", "-loglevel", "error", "-i", path,
         "-ac", "1", "-ar", str(SR), "-f", "wav", wav],
        check=True,
    )
    with wave.open(wav, "rb") as w:
        n = w.getnframes()
        raw = w.readframes(n)
    if raw and len(raw) % 2:
        raw = raw[:-1]
    arr = array.array("h")
    arr.frombytes(raw)
    return arr


def envelope(pcm):
    hop = int(SR * HOP)
    env = []
    for i in range(0, len(pcm) - hop, hop):
        s = 0.0
        for j in range(i, i + hop, 4):  # 4x 抽样足够
            v = pcm[j] / 32768.0
            s += v * v
        env.append(math.sqrt(s / (hop / 4)))
    return env


def smooth(env, k=5):
    out = []
    for i in range(len(env)):
        a = max(0, i - k)
        b = min(len(env), i + k + 1)
        out.append(sum(env[a:b]) / (b - a))
    return out


def phrases(env, rel=0.30, min_gap=0.28, min_len=0.45):
    """自适应阈值找"有人声的乐句"。"""
    if not env:
        return []
    order = sorted(env)
    hi = order[int(len(order) * 0.90)]
    lo = order[int(len(order) * 0.20)]
    thr = lo + (hi - lo) * rel
    active = [v > thr for v in env]
    segs = []
    start = None
    gap = 0
    max_gap = int(min_gap / HOP)
    for i, a in enumerate(active):
        if a:
            if start is None:
                start = i
            gap = 0
        else:
            if start is not None:
                gap += 1
                if gap > max_gap:
                    segs.append((start, i - gap))
                    start = None
                    gap = 0
    if start is not None:
        segs.append((start, len(active) - 1))
    out = []
    for a, b in segs:
        if (b - a) * HOP < min_len:
            continue
        energy = sum(env[a:b + 1]) / max(1, (b - a + 1))
        out.append({"t0": a * HOP, "t1": (b + 1) * HOP, "e": energy})
    return out


def align(n_lines, segs, duration):
    """单调 DP：把 n_lines 行分配到乐句序列上（可合并相邻乐句、可跳过弱乐句）。"""
    m = len(segs)
    if m == 0:
        step = duration / max(1, n_lines)
        return [{"t0": i * step, "t1": (i + 1) * step} for i in range(n_lines)]
    INF = 1e18
    # dp[i][j] = 前 i 行用掉前 j 个乐句的最小代价
    dp = [[INF] * (m + 1) for _ in range(n_lines + 1)]
    back = [[None] * (m + 1) for _ in range(n_lines + 1)]
    dp[0][0] = 0
    for j in range(1, m + 1):
        dp[0][j] = dp[0][j - 1] + 0.05  # 跳过乐句的代价（弱乐句允许被跳过）
        back[0][j] = ("skip", j - 1)
    # dp[i][0] 无法放置任何一行，保持 INF
    for i in range(1, n_lines + 1):
        for j in range(1, m + 1):
            # 方案 A：第 i 行结束于第 j 个乐句（吃掉 1..k 个乐句）
            best = INF
            bestk = 0
            for k in range(1, min(4, j) + 1):
                a = segs[j - k]["t0"]
                b = segs[j - 1]["t1"]
                span = b - a
                # 一行歌词正常 2~7 秒
                cost = 0.0
                if span < 1.6:
                    cost += (1.6 - span) * 1.2
                if span > 8.0:
                    cost += (span - 8.0) * 0.6
                if k > 1:
                    cost += 0.25 * (k - 1)   # 跨句合并要付小代价
                cand = dp[i - 1][j - k] + cost
                if cand < best:
                    best = cand
                    bestk = k
            # 方案 B：跳过乐句 j（间奏 / 伴奏）
            skip = dp[i][j - 1] + 0.05
            if skip < best:
                dp[i][j] = skip
                back[i][j] = ("skip", j - 1)
            else:
                dp[i][j] = best
                back[i][j] = ("use", bestk)
    # 回溯
    i, j = n_lines, m
    slots = []
    if dp[i][j] >= INF / 2:
        # 兜底：乐句太少，按时间均匀分配
        step = duration / max(1, n_lines)
        return [{"t0": i * step, "t1": (i + 1) * step} for i in range(n_lines)]
    while i > 0 and j > 0:
        act, k = back[i][j]
        if act == "skip":
            j = k
        else:
            slots.append((j - k, j - 1))
            j = j - k
            i -= 1
    slots.reverse()
    out = []
    for a, b in slots:
        out.append({"t0": segs[a]["t0"], "t1": segs[b]["t1"]})
    return out


def process(key):
    audio_rel, duration = AUDIO[key]
    audio = os.path.join(ROOT, audio_rel)
    if not os.path.exists(audio):
        print(f"!! {key}: 缺少音频 {audio_rel}")
        return None
    lines = LYRICS.get(key)
    if not lines:
        print(f"!! {key}: 没有歌词表")
        return None
    pcm = decode_pcm(audio)
    env = smooth(envelope(pcm))
    segs = phrases(env)
    slots = align(len(lines), segs, duration)
    out = []
    for text, s in zip(lines, slots):
        out.append({"t0": round(s["t0"], 2), "t1": round(s["t1"], 2), "zh": text})
    # 保证单调、不重叠
    for a, b in zip(out, out[1:]):
        if b["t0"] < a["t1"]:
            a["t1"] = round(b["t0"], 2)
    data = {"key": key, "duration": duration, "source": audio_rel,
            "method": "vocal-activity-alignment", "lines": out}
    os.makedirs(os.path.join(ROOT, "src/timings"), exist_ok=True)
    with open(os.path.join(ROOT, "src/timings", key + ".json"), "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=1)
    print(f"== {key}: {len(lines)} 行 / {len(segs)} 个乐句")
    for ln in out:
        print(f"   {ln['t0']:7.2f} - {ln['t1']:7.2f}  {ln['zh']}")
    return data


def main():
    keys = sys.argv[1:] or list(AUDIO)
    if keys == ["all"]:
        keys = list(AUDIO)
    for k in keys:
        try:
            process(k)
        except Exception as exc:
            print(f"!! {k} failed: {exc}")


if __name__ == "__main__":
    main()
