#!/usr/bin/env python3
"""tools/merge_timings.py — 把"正确的歌词文本"和"参考片实测的字幕时间"合起来。

为什么这样分工
--------------
* **文本**：歌名固定的老歌有官方歌词，直接人工整理（`tools/align_lyrics_audio.py`
  里的 `LYRICS`）。参考片字幕本身有错别字、水印、终端 UI 文案，不能直接用。
* **时间**：参考片里的字幕是**跟着人声对的**，所以用 OCR 逐帧识别出"字幕出现/变化"
  的时刻（`tools/ocr_reference_subs.py` 输出 `src/timings/ocr/*.json`），
  再用单调 DP 把这些时刻对齐到歌词行上。

两者结合后，字幕起止时间来自**真实参考片**，文本来自**正确歌词**。

输出：`src/timings/<key>.json`（渲染器读取）
      `docs/SUB_TIMING.md`（逐片对齐结果，方便人工复核）

用法：
    /tmp/ocrenv/bin/python tools/merge_timings.py all
    /tmp/ocrenv/bin/python tools/merge_timings.py xinqiang --report
"""
import json
import os
import sys
import difflib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TIMMINGS = os.path.join(ROOT, "src/timings")
OCR_DIR = os.path.join(TIMMINGS, "ocr")
LEGACY_DIR = os.path.join(TIMMINGS, "legacy")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from align_lyrics_audio import LYRICS, AUDIO  # noqa: E402


def lyric_lines(key):
    """歌词文本来源：优先老版本人工写的字幕表（文本准确），否则用内置表。

    返回 (歌词列表, 来源, 人工时间底稿或 None)。人工时间虽然粗糙，但它保留了
    "这句大概在第几秒"，比把空档平均分给几行要准得多，所以插值时拿它当底稿。
    """
    p = os.path.join(LEGACY_DIR, key + ".json")
    if os.path.exists(p):
        data = json.load(open(p, encoding="utf-8"))
        rows = [l for l in data["lines"] if l.get("zh")]
        if len(rows) >= 3:
            return [l["zh"] for l in rows], "legacy", [(l["t0"], l["t1"]) for l in rows]
    return list(LYRICS.get(key) or []), "curated", None


def norm(t):
    return "".join(ch for ch in t if ch.strip())


def similarity(a, b):
    a, b = norm(a), norm(b)
    if not a or not b:
        return 0.0
    return difflib.SequenceMatcher(None, a, b).ratio()


def align(lyrics, segs, duration):
    """单调 DP：歌词行 i ↔ OCR 段 j，可跳过段（间奏/UI 文本），可跳行（OCR 漏识）。"""
    n, m = len(lyrics), len(segs)
    INF = 1e9
    dp = [[INF] * (m + 1) for _ in range(n + 1)]
    back = [[None] * (m + 1) for _ in range(n + 1)]
    dp[0][0] = 0.0
    for j in range(1, m + 1):
        dp[0][j] = dp[0][j - 1] + 0.30  # 跳过 OCR 段的代价（间奏 / UI 文本）
        back[0][j] = ("skip", j - 1)
    SKIP_SEG = 0.30   # 跳过一段 OCR（间奏 / UI 文案）
    SKIP_LINE = 0.75  # 该行在参考片里没识别到（OCR 漏字），交给插值
    for i in range(1, n + 1):
        # 允许"跳过这一行"
        dp[i][0] = dp[i - 1][0] + SKIP_LINE
        back[i][0] = ("skipLine", 0)
        for j in range(1, m + 1):
            best = dp[i][j - 1] + SKIP_SEG
            bt = ("skip", j - 1)
            cand = dp[i - 1][j] + SKIP_LINE
            if cand < best:
                best = cand
                bt = ("skipLine", j)
            sim = similarity(lyrics[i - 1], segs[j - 1]["zh"])
            cand = dp[i - 1][j - 1] + (1.0 - sim) * 2.0
            if cand < best:
                best = cand
                bt = ("use", j - 1)
            dp[i][j] = best
            back[i][j] = bt
    # 回溯
    i, j = n, m
    match = [None] * n
    while i > 0:
        act, k = back[i][j]
        if act == "skipLine":
            i -= 1
            j = k
        elif act == "skip":
            j = k
        else:
            match[i - 1] = k
            i -= 1
            j -= 1
    return match, dp[n][m]


def legacy_only(key, duration, shift=0.0):
    legacy = json.load(open(os.path.join(LEGACY_DIR, key + ".json"), encoding="utf-8"))
    lines = []
    for l in legacy["lines"]:
        t0 = max(0.0, min(duration, l["t0"] + shift))
        t1 = max(t0 + 0.5, min(duration, l["t1"] + shift))
        lines.append({"t0": round(t0, 2), "t1": round(t1, 2), "zh": l["zh"]})
    lines.sort(key=lambda l: l["t0"])
    method = "legacy-handwritten + OCR 整体平移" if abs(shift) > 0.05 else "legacy-handwritten (未用 OCR 校验)"
    data = {"key": key, "duration": duration,
            "method": method,
            "matched": 0, "total": len(lines), "lines": lines,
            "_detail": [dict(l, _sim=0.0) for l in lines]}
    os.makedirs(TIMMINGS, exist_ok=True)
    with open(os.path.join(TIMMINGS, key + ".json"), "w", encoding="utf-8") as fh:
        json.dump({k: v for k, v in data.items() if k != "_detail"}, fh, ensure_ascii=False, indent=1)
    return data


def build(key):
    lyrics, src, draft = lyric_lines(key)
    if not lyrics:
        return None
    duration = AUDIO[key][1]
    ocr_path = os.path.join(OCR_DIR, key + ".json")

    if not os.path.exists(ocr_path):
        return legacy_only(key, duration)

    segs = json.load(open(ocr_path, encoding="utf-8"))["lines"]
    segs = [s for s in segs if s["t1"] > s["t0"]]
    # OCR 质量闸门：段数太少说明整段被并成一大块（水印 / 终端 UI / 我们的
    # 章节标签粘连），这种结果没有时间信息，直接退回人工时间轴。
    NONTEXT = ("Agent人生之旅", "SHOT", "INTRO", "CHORUS", "VERSE", "CODA", "FINALE")
    clean = [x for x in segs if not any(t in x["zh"] for t in NONTEXT)]
    if len(clean) < max(3, len(lyrics) * 0.4):
        print(f"   (OCR 质量不足：{len(clean)} 段 / {len(lyrics)} 行 → 用人工时间轴)")
        return legacy_only(key, duration)
    segs = clean
    match, cost = align(lyrics, segs, duration)

    # 匹配率太低说明 OCR 里基本没有真正的歌词（只有终端 UI / 水印 / 章节标签）。
    # 这时不要用 OCR 插值，而是拿"人工时间底稿"整体平移 —— 平移量用匹配上的
    # 那几行估出来，这样既保住人工表里的句间空隙，又能被 OCR 校正整体偏移。
    matched = sum(1 for m in match if m is not None)
    sims = [similarity(lyrics[idx], segs[sp]["zh"]) for idx, sp in enumerate(match) if sp is not None]
    weak = matched < 3 or (sum(sims) / len(sims) if sims else 0) < 0.6
    if draft and len(draft) == len(lyrics) and weak:
        # 用"行的中点"对齐，而不是起点：OCR 只抓到句尾几个字时，起点会偏晚
        deltas = [(segs[sp]["t0"] + segs[sp]["t1"]) / 2 - (draft[idx][0] + draft[idx][1]) / 2
                  for idx, sp in enumerate(match) if sp is not None]
        delta = sum(deltas) / len(deltas) if deltas else 0.0
        if abs(delta) > 12.0:
            delta = 0.0
        print(f"   (OCR 证据不足：命中 {matched}/{len(lyrics)} 行、平均相似度 "
              f"{(sum(sims)/len(sims) if sims else 0):.2f} → 人工时间底稿整体平移 {delta:+.2f}s)")
        data = legacy_only(key, duration, shift=delta)
        return data

    # 匹配上的行直接取 OCR 时间；没匹配上的按相邻已知点插值（按字数加权）
    times = [None] * len(lyrics)
    for idx, s in enumerate(match):
        if s is not None:
            times[idx] = [segs[s]["t0"], segs[s]["t1"], similarity(lyrics[idx], segs[s]["zh"])]
    # 插值缺失行：
    #   有"人工时间底稿"时，用它做分段线性映射 —— 用已匹配的锚点拟合
    #   (人工时间 → OCR 实测时间) 的对应关系，再把未匹配的行按底稿时间映射过去。
    #   没有底稿时才退化为"按字数权重均分空档"。
    anchors = [(i, times[i][0], times[i][1]) for i in range(len(lyrics)) if times[i]]
    if not anchors:
        anchors = [(0, 1.5, 1.5), (len(lyrics) - 1, duration - 1.0, duration - 1.0)]
        times = [[None, None, 0.0] for _ in lyrics]

    if draft and len(draft) == len(lyrics) and len(anchors) >= 3:
        # 拟合：用锚点的"人工 t0 → OCR t0"
        pairs = sorted((draft[i][0], times[i][0]) for i, _, _ in anchors)
        xs = [p[0] for p in pairs]
        ys = [p[1] for p in pairs]

        def map_t(x):
            if x <= xs[0]:
                k = (ys[1] - ys[0]) / max(1e-6, xs[1] - xs[0]) if len(xs) > 1 else 1.0
                return ys[0] + (x - xs[0]) * max(0.3, min(2.5, k))
            if x >= xs[-1]:
                k = (ys[-1] - ys[-2]) / max(1e-6, xs[-1] - xs[-2]) if len(xs) > 1 else 1.0
                return ys[-1] + (x - xs[-1]) * max(0.3, min(2.5, k))
            for a in range(len(xs) - 1):
                if xs[a] <= x <= xs[a + 1]:
                    span = max(1e-6, xs[a + 1] - xs[a])
                    return ys[a] + (ys[a + 1] - ys[a]) * (x - xs[a]) / span
            return x

        for i in range(len(lyrics)):
            if times[i]:
                times[i] = [times[i][0], times[i][1], times[i][2]]
                continue
            t0 = map_t(draft[i][0])
            t1 = map_t(draft[i][1])
            times[i] = [max(0.0, t0), max(0.0, t1), 0.0]
        # 时间顺序兜底（映射后可能交叉）
        for i in range(1, len(lyrics)):
            if times[i][0] < times[i - 1][0]:
                times[i][0] = times[i - 1][0] + 0.05
            if times[i][1] < times[i][0] + 0.4:
                times[i][1] = times[i][0] + 0.6
    else:
        def weights(a, b):
            w = [max(4, len(norm(lyrics[k]))) for k in range(a, b)]
            tot = sum(w) or 1
            return [x / tot for x in w]

        for idx, (i, t0, t1) in enumerate(anchors):
            times[i] = [t0, t1, times[i][2]]
        # 第一个锚点之前
        i0, s0, _ = anchors[0]
        if i0 > 0:
            start, end = 0.0, s0
            ws = weights(0, i0)
            cur = start
            for k, w in enumerate(ws):
                times[k] = [cur, cur + (end - start) * w, 0.0]
                cur += (end - start) * w
        # 锚点之间
        for (ia, _, ta1), (ib, tb0, _) in zip(anchors, anchors[1:]):
            gap_lines = ib - ia - 1
            if gap_lines <= 0:
                continue
            start, end = ta1, max(ta1 + 0.6, tb0)
            ws = weights(ia + 1, ib)
            cur = start
            for k, w in enumerate(ws):
                times[ia + 1 + k] = [cur, cur + (end - start) * w, 0.0]
                cur += (end - start) * w
        # 最后一个锚点之后
        il, _, tl1 = anchors[-1]
        if il < len(lyrics) - 1:
            start, end = tl1, duration
            ws = weights(il + 1, len(lyrics))
            cur = start
            for k, w in enumerate(ws):
                times[il + 1 + k] = [cur, cur + (end - start) * w, 0.0]
                cur += (end - start) * w

    # 参考片通常是歌曲**节选**：最后一行匹配之后的行在参考片里并不存在，
    # 直接丢弃（否则会被挤到结尾 1~2 秒内）。
    last = max([i for i, m in enumerate(match) if m is not None], default=None)
    if last is not None and last < len(lyrics) - 1:
        if (sum(1 for m in match if m is not None) / len(lyrics)) < 0.75:
            lyrics = lyrics[: last + 1]
            times = times[: last + 1]

    lines = []
    for text, (t0, t1, sim) in zip(lyrics, times):
        lines.append({"t0": round(max(0.0, t0), 2), "t1": round(min(duration, t1), 2),
                      "zh": text, "_sim": round(sim, 2)})
    lines.sort(key=lambda l: l["t0"])
    # 修正重叠
    for a, b in zip(lines, lines[1:]):
        if b["t0"] < a["t1"]:
            a["t1"] = b["t0"]
        if a["t1"] - a["t0"] < 0.35:
            a["t1"] = min(duration, a["t0"] + 0.8)
    data = {
        "key": key,
        "duration": duration,
        "method": "ocr-timed + curated-lyrics",
        "matched": sum(1 for m in match if m is not None),
        "total": len(lyrics),
        "lines": [{k: v for k, v in l.items() if k != "_sim"} for l in lines],
        "_detail": lines,
    }
    os.makedirs(TIMMINGS, exist_ok=True)
    with open(os.path.join(TIMMINGS, key + ".json"), "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=1)
    return data


def report(results):
    md = ["# 字幕时间轴对齐报告\n",
          "> 由 `tools/merge_timings.py` 生成。**文本**来自老模块里人工写的歌词表，",
          "> **时间**来自参考片逐帧 OCR 实测的字幕出现/消失时刻（`src/timings/ocr/*.json`）。\n",
          ">",
          "> 三种合成方式（每节的标题里注明）：",
          "> 1. `ocr-timed + curated-lyrics`：OCR 命中足够多，逐行取实测时间，",
          ">    未命中的行按人工时间底稿做分段线性映射；",
          "> 2. `legacy-handwritten + OCR 整体平移`：OCR 里基本没有歌词（终端 UI / 水印 / 长句叠显），",
          ">    用人工时间表，但整体按 OCR 校正一个平移量；",
          "> 3. `legacy-handwritten (未用 OCR 校验)`：没有参考片，只能用人工时间表。\n",
          "> 时间单位：秒；`相似度` 是该行与 OCR 原始文本的字符相似度（0 表示没匹配上）。\n"]
    for key, data in results.items():
        if not data:
            continue
        md.append(f"## {key}（{data['matched']}/{data['total']} 行直接匹配 · {data['method']}）\n")
        md.append("| # | 起 | 止 | 时长 | 歌词 | 文本相似度 |")
        md.append("|--:|--:|--:|--:|:--|--:|")
        for i, l in enumerate(data["_detail"]):
            md.append(f"| {i+1} | {l['t0']:.2f} | {l['t1']:.2f} | {l['t1']-l['t0']:.2f} | {l['zh']} | {l.get('_sim', 0):.2f} |")
        md.append("")
    with open(os.path.join(ROOT, "docs/SUB_TIMING.md"), "w", encoding="utf-8") as fh:
        fh.write("\n".join(md))
    print("报告 → docs/SUB_TIMING.md")


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    keys = list(LYRICS) if (not args or args[0] == "all") else args
    results = {}
    for k in keys:
        print(f"== {k}")
        try:
            data = build(k)
            results[k] = data
            if data:
                print(f"   匹配 {data['matched']}/{data['total']} 行")
                for l in data["_detail"]:
                    print(f"   {l['t0']:7.2f} - {l['t1']:7.2f}  {l['zh']}  [{l.get('_sim',0):.2f}]")
        except Exception as exc:
            print(f"!! {k}: {exc}")
    report(results)


if __name__ == "__main__":
    main()
