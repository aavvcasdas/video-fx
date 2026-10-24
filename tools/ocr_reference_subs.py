#!/usr/bin/env python3
"""tools/ocr_reference_subs.py — 从 `mv/` 参考片里 OCR 出**真实**的字幕文本与时间轴。

为什么需要它
------------
用户反馈“歌词和字幕不匹配 / 字幕对不上”。旧版字幕时间轴是手工估的，从未与
音轨核对。参考片本身就是正确字幕的唯一证据来源，所以这里直接量它：

1. 按固定帧率把参考片抽成 PNG（短片 2fps，长片 1fps）。
2. RapidOCR 逐帧识别（中文离线模型），记录每个文字块的 (文本, x0, x1, y)。
3. **帧内按 x 排序拼接**：参考片的字幕是一块块浮现的（拼图块 / 大字号动画词），
   单块只能读到半句，按 x 拼起来才是整句。
4. 时间轴上把连续的同一句合并成一段；段内把各帧的文字块按 x 做并集，
   得到这一句最完整的版本（后出现的词也会被补进来）。
5. 输出 `src/timings/<mv>.json`：

       { "key": "...", "duration": 34.02, "fps": 2,
         "lines": [ { "t0": 1.0, "t1": 4.5, "zh": "第一次遇见阴天遮住你侧脸" }, ... ] }

渲染器（`src/mv_pack_short.js` / `src/mv_pack_long.js` …）优先读取该文件，
因此字幕与音频逐帧对齐。

用法
----
    /tmp/ocrenv/bin/python tools/ocr_reference_subs.py all
    /tmp/ocrenv/bin/python tools/ocr_reference_subs.py feng
    /tmp/ocrenv/bin/python tools/ocr_reference_subs.py feng --max-frames 40
"""
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FFMPEG = os.environ.get(
    "FFMPEG_PATH", "/tmp/tools/node_modules/@ffmpeg-installer/linux-x64/ffmpeg"
)

MVS = {
    "xinqiang":      {"clip": "mv/心墙.mp4",                    "dur": 34.02,  "fps": 2.0},
    "ribuluo":       {"clip": "mv/日不落.mp4",                  "dur": 45.81,  "fps": 2.0},
    "douyin_6":      {"clip": "每天每天的抖音 - 抖音_6.mp4",     "dur": 46.68,  "fps": 2.0},
    "lianai_ing":    {"clip": "mv/发现更多精彩视频 - 抖音搜索_2.mp4", "dur": 54.73, "fps": 2.0},
    "jimo_yanhuo":   {"clip": "mv/寂寞烟火.mp4",                "dur": 55.24,  "fps": 2.0},
    "ba_huiyi_56":   {"clip": "mv/《把回忆拼好给你》.mp4",       "dur": 56.03,  "fps": 2.0},
    "qunian_xiatian":{"clip": "去年夏天.mp4",                   "dur": 78.20,  "fps": 2.0},
    "ba_huiyi_pinhao": {"clip": "mv/mv_ba_huiyi_pinhao_gei_ni_whale_girl (1).mp4", "dur": 142.10, "fps": 1.0},
    "huainvhai":     {"clip": "mv/坏女孩.mp4",                  "dur": 245.55, "fps": 1.0},
    "meiguihua":     {"clip": "mv/玫瑰花的葬礼.mp4",             "dur": 236.77, "fps": 1.0},
    "suyan":         {"clip": "mv/素颜1.mp4",                   "dur": 238.05, "fps": 1.0},
    "feng":          {"clip": "mv/枫.mp4",                      "dur": 274.58, "fps": 1.0},
}

CJK = re.compile(r"[\u4e00-\u9fff]")
NOISE = re.compile(r"^[\.\-_=~·•\s|/\\★☆♪]+$")
WATERMARK = re.compile(r"(抖音|小红书|bilibili|B站|剪映|关注|点赞|收藏|@|http|www)", re.I)


def keep(txt, score):
    """过滤水印、UI 文案和 OCR 噪声，只保留歌词。"""
    if score < 0.5:
        return False
    t = txt.strip().replace(" ", "")
    if not t or NOISE.match(t):
        return False
    if WATERMARK.search(t):
        return False
    n_cjk = len(CJK.findall(t))
    if n_cjk == 0:
        return False
    if n_cjk < 2 and len(t) < 6:
        return False
    return True


def extract_frames(key, fps):
    item = MVS[key]
    clip = os.path.join(ROOT, item["clip"])
    tmpdir = os.path.join("/tmp", "ocrframes_" + key)
    os.makedirs(tmpdir, exist_ok=True)
    pattern = os.path.join(tmpdir, "f_%05d.png")
    subprocess.run(
        [FFMPEG, "-y", "-hide_banner", "-loglevel", "error", "-i", clip,
         "-vf", "fps=%s,scale=1280:-1" % fps, "-q:v", "2", pattern],
        check=True,
    )
    files = sorted(f for f in os.listdir(tmpdir) if f.endswith(".png"))
    return tmpdir, files


def ocr_frames(files, tmpdir, key, fps, max_frames=None):
    from rapidocr_onnxruntime import RapidOCR
    ocr = RapidOCR()
    samples = []
    for i, f in enumerate(files):
        if max_frames and i >= max_frames:
            break
        res, _ = ocr(os.path.join(tmpdir, f))
        items = []
        for r in (res or []):
            box, txt, score = r[0], r[1], float(r[2])
            if not keep(txt, score):
                continue
            txt = txt.strip().replace(" ", "")
            xs = [p[0] for p in box]
            ys = [p[1] for p in box]
            items.append({"txt": txt, "x0": round(min(xs)), "x1": round(max(xs)),
                          "y": round((min(ys) + max(ys)) / 2), "score": round(score, 2)})
        samples.append({"t": round(i / fps, 3), "items": items})
        if i % 40 == 0:
            print(f"  {key}: {i}/{len(files)}", flush=True)
    return samples


def join_items(items):
    """帧内按 x 顺序拼接（同一位置只保留一个）。"""
    if not items:
        return ""
    srt = sorted(items, key=lambda d: d["x0"])
    out = []
    last_x1 = -1e9
    for it in srt:
        if it["x0"] < last_x1 - 8:      # 与上一块重叠，跳过（避免重复拼接）
            continue
        out.append(it["txt"])
        last_x1 = it["x1"]
    return "".join(out)


def union_items(items):
    """段内并集：同一 x 区间取最长的文本，再按 x 拼接。"""
    buckets = {}
    for it in items:
        k = it["x0"] // 46
        cur = buckets.get(k)
        if cur is None or len(it["txt"]) > len(cur["txt"]):
            buckets[k] = it
    ordered = [buckets[k] for k in sorted(buckets)]
    out = []
    last_x1 = -1e9
    for it in ordered:
        if it["x0"] < last_x1 - 12:
            # 落在上一块内部：只有明显更长才替换
            if len(it["txt"]) > len(out[-1]) + 1:
                out[-1] = it["txt"]
            continue
        out.append(it["txt"])
        last_x1 = it["x1"]
    return "".join(out)


def build_lines(samples, fps):
    # 1. 每帧一句话
    frames = []
    for s in samples:
        frames.append({"t": s["t"], "zh": join_items(s["items"]), "items": s["items"]})

    # 2. 时间轴分段：文本相同 / 互为前缀 / 前缀增长，视为同一句在逐词浮现
    segs = []
    cur = None
    for f in frames:
        zh = f["zh"]
        if cur is not None and zh:
            cp = 0
            for a, b in zip(cur["last"], zh):
                if a != b:
                    break
                cp += 1
            same = (zh == cur["last"] or zh in cur["last"] or cur["last"] in zh or cp >= 2)
            if same:
                cur["end"] = f["t"] + 1.0 / fps
                cur["items"].extend(f["items"])
                if len(zh) > len(cur["last"]):
                    cur["last"] = zh
                continue
        if cur is not None:
            segs.append(cur)
            cur = None
        if zh:
            cur = {"start": f["t"], "end": f["t"] + 1.0 / fps,
                   "last": zh, "items": list(f["items"]), "best": zh}
        else:
            # 空档：把上一段延长一点（字幕通常比 OCR 采样更持久）
            if segs and f["t"] - segs[-1]["end"] < 0.6:
                segs[-1]["end"] = f["t"] + 1.0 / fps
    if cur:
        segs.append(cur)

    # 3. 后处理：用并集补全、过滤过短段、合并重复
    min_dur = 1.2 if fps <= 1.2 else 0.8
    lines = []
    for s in segs:
        zh = s["best"]
        merged = union_items(s["items"])
        if len(merged) > len(zh):
            zh = merged
        # 去掉明显重复的尾巴（OCR 偶尔会把同一句读两遍）
        if len(zh) >= 8 and zh[: len(zh) // 2] == zh[len(zh) // 2: len(zh)]:
            zh = zh[: len(zh) // 2]
        dur = s["end"] - s["start"]
        if dur < min_dur or len(zh) < 3:
            continue
        if lines and lines[-1]["zh"] == zh:
            lines[-1]["t1"] = round(s["end"], 2)
            continue
        lines.append({"t0": round(s["start"], 2), "t1": round(s["end"], 2), "zh": zh})
    return lines


def process(key, fps_override=None, max_frames=None):
    item = MVS[key]
    fps = fps_override or item["fps"]
    print(f"== OCR {key} @ {fps}fps  ({item['clip']})", flush=True)
    tmpdir, files = extract_frames(key, fps)
    samples = ocr_frames(files, tmpdir, key, fps, max_frames)
    lines = build_lines(samples, fps)
    data = {"key": key, "duration": item["dur"], "fps": fps,
            "source": item["clip"], "lines": lines}
    os.makedirs(os.path.join(ROOT, "src/timings/ocr"), exist_ok=True)
    out = os.path.join(ROOT, "src/timings/ocr", key + ".json")
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=1)
    print(f"   -> {len(lines)} lines -> {out}", flush=True)
    for ln in lines:
        print(f"      {ln['t0']:7.2f} - {ln['t1']:7.2f}  {ln['zh']}", flush=True)
    # 清理抽帧
    for f in files:
        os.unlink(os.path.join(tmpdir, f))
    os.rmdir(tmpdir)
    return data


def main():
    args = sys.argv[1:]
    key = args[0] if args else "all"
    fps_override = None
    max_frames = None
    if "--fps" in args:
        fps_override = float(args[args.index("--fps") + 1])
    if "--max-frames" in args:
        max_frames = int(args[args.index("--max-frames") + 1])
    keys = list(MVS) if key == "all" else [key]
    for k in keys:
        try:
            process(k, fps_override, max_frames)
        except Exception as exc:  # 单片失败不影响整体
            print(f"!! {k} failed: {exc}", flush=True)


if __name__ == "__main__":
    main()
