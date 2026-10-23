#!/usr/bin/env python3
"""Offline frame renderer for the hand-drawn-JS 《潮汐》 lyric MV.

It composites only transparent frames emitted by the shared JavaScript whale
rig, then draws its deterministic 12-beat storyboard worlds. It never invokes
a model, network service, or runtime character image. Encode PNG frames with ffmpeg and 潮汐.MP3.

Example:
  PYTHONPATH=/tmp/audio-libs python3 tools/render_tide.py --frames render/tide-frames
  /path/to/ffmpeg -framerate 24 -i render/tide-frames/%06d.png -i 潮汐.MP3 \
    -shortest -c:v libx264 -pix_fmt yuv420p -c:a aac output/tide-lyric-mv.mp4
"""

from __future__ import annotations

import argparse
import math
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
W, H, FPS, DURATION, BPM = 1280, 720, 24, 31.843, 117
# Every final frame is resolved on this small stage and enlarged with nearest
# neighbour sampling. It is a deliberate pixel language, not a blur filter.
PIXEL_SIZE = 4
FONT_DIR = Path('/tmp/noto-cjk/Sans/OTF/SimplifiedChinese')
FONT_REGULAR = FONT_DIR / 'NotoSansCJKsc-Regular.otf'
FONT_BOLD = FONT_DIR / 'NotoSansCJKsc-Bold.otf'

LYRICS = [
    ('L01', .62, 2.42, '蓝色的海底', 'sea'),
    ('L02', 2.42, 4.42, '远山的风景', 'mountain'),
    ('L03', 4.42, 8.33, '我们的距离遥不可及', 'distance'),
    ('L04', 8.33, 10.43, '退守的爱情', 'retreat'),
    ('L05', 10.43, 12.43, '还剩下回忆', 'memory'),
    ('L06', 12.43, 15.82, '疯狂地寻觅你的身影', 'search'),
    ('L07', 16.32, 18.12, '蓝色的海底', 'sea'),
    ('L08', 18.12, 20.12, '远山的风景', 'mountain'),
    ('L09', 20.12, 24.03, '我们的距离遥不可及', 'distance'),
    ('L10', 24.03, 26.13, '退守的爱情', 'retreat'),
    ('L11', 26.13, 28.13, '还剩下回忆', 'memory'),
    ('L12', 28.13, 31.62, '疯狂地寻觅你的身影', 'search'),
]

CUES = [
    '顶光下切，气泡先于人声上浮', '识别卡在第一个强拍弹入', '远景山脊以三层像素露出', '歌者侧身，水面反射轻晃',
    '两枚光标从同一点分开', '潮线把光标推往画面两端', '虚线断开，镜头后拉一格', '断点变成小气泡并上升',
    '珊瑚色纸片在强拍退后', '手势缩回胸前，背景色降低', '第一张记忆卡显影', '四个泡泡轮流高亮',
    '声呐从麦克风向外扩散', '圆环扫过山影，鱼群避开', '轮廓光闪一下后隐去', '只保留呼吸光与低频涟漪',
    '亮蓝色阶从底部回灌', '歌词卡带着水滴重新进入', '远山换为像素平面并横移', '歌者漂浮越过第二层山脊',
    '两端信标在强拍亮起', '信标沿各自轨迹离开中心', '中央留下无法跨越的光缝', '光缝放大成满屏潮线',
    '倒放尾迹把色彩拉回角色', '第三拍只保留裙带细节', '泡泡卡片聚拢成月牙', '月牙随弱拍旋转一格',
    '终场声呐开始扫描标题', '标题碎片依次点亮', '歌者合眼，水流绕成心跳线', '最后一拍回落至蓝色海底',
]

# OpenCV BGR colours: deep, upper water, key light, accent.
PALETTES = [
    ((67, 24, 4), (145, 71, 13), (241, 237, 114), (117, 220, 255)),
    ((75, 30, 37), (178, 83, 91), (120, 230, 255), (167, 139, 255)),
    ((74, 67, 43), (197, 189, 147), (204, 238, 245), (140, 162, 77)),
    ((51, 8, 20), (155, 35, 73), (225, 252, 67), (200, 65, 255)),
]


def pulse(t: float) -> float:
    phase = (t * BPM / 60) % 1
    return (1 - phase) ** 4


def lyric_at(t: float):
    for item in LYRICS:
        if item[1] <= t < item[2]:
            return item
    return None


# Animate-style beat board: each lyric step receives its own world objective,
# focal anchor and match-object bridge rather than four-second generic scenes.
SHOT_STARTS = (0.00, 2.42, 4.42, 6.58, 8.33, 10.43, 12.43, 15.82, 18.12, 20.12, 24.03, 28.13)
ENV_BY_SHOT = (0, 0, 1, 1, 2, 2, 3, 4, 4, 5, 6, 7)
PALETTE_BY_SHOT = (0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 3)


def scene_at(t: float) -> int:
    index = 0
    for i, start in enumerate(SHOT_STARTS):
        if start <= t:
            index = i
        else:
            break
    return index


def mix(a, b, p):
    return tuple(int(a[i] * (1 - p) + b[i] * p) for i in range(3))


def make_fonts():
    if not FONT_REGULAR.exists() or not FONT_BOLD.exists():
        raise RuntimeError(f'Missing CJK font at {FONT_DIR}; clone notofonts/noto-cjk or update FONT_DIR.')
    return {
        'small': ImageFont.truetype(str(FONT_REGULAR), 18),
        'body': ImageFont.truetype(str(FONT_REGULAR), 26),
        'lyric': ImageFont.truetype(str(FONT_BOLD), 34),
        'title': ImageFont.truetype(str(FONT_BOLD), 64),
    }


def draw_text(frame, fonts, text, xy, font_key, fill, anchor='la'):
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    pil = Image.fromarray(rgb)
    ImageDraw.Draw(pil).text(xy, text, font=fonts[font_key], fill=fill, anchor=anchor)
    frame[:] = cv2.cvtColor(np.asarray(pil), cv2.COLOR_RGB2BGR)


def background(t, palette):
    deep, upper, light, accent = palette
    y = np.linspace(0, 1, H, dtype=np.float32)[:, None, None]
    top = np.array(upper, dtype=np.float32)[None, None, :]
    bottom = np.array(deep, dtype=np.float32)[None, None, :]
    frame = np.broadcast_to(top * (1 - y) + bottom * y, (H, W, 3)).copy().astype(np.uint8)
    # Moving shafts: every frame changes as the current travels through water.
    for i in range(7):
        x = int((i * 196 + math.sin(t * .45 + i) * 58) % (W + 180) - 90)
        pts = np.array([[x, 0], [x + 76, 0], [x + 210, 550], [x + 96, 550]], np.int32)
        overlay = frame.copy()
        cv2.fillConvexPoly(overlay, pts, light)
        cv2.addWeighted(overlay, .065 + pulse(t) * .018, frame, .935 - pulse(t) * .018, 0, frame)
    # Seabed parallax contour.
    floor = np.array([[0, 666], [180, 645], [400, 670], [600, 646], [850, 675], [1040, 651], [1280, 668], [1280, 720], [0, 720]], np.int32)
    cv2.fillPoly(frame, [floor], mix(deep, (2, 12, 40), .5))
    return frame


def bubbles(frame, t, palette):
    _, _, light, _ = palette
    for i in range(44):
        seed = math.sin(i * 53.14) * 43758.5
        frac = seed - math.floor(seed)
        x = int(frac * W + math.sin(t * .7 + i) * 12)
        speed = 28 + (i % 7) * 8
        y = int((H + 40 - (t * speed + i * 73)) % (H + 60) - 20)
        radius = 2 + i % 5
        cv2.circle(frame, (x, y), radius, light, 1, cv2.LINE_AA)
        if i % 4 == 0:
            cv2.circle(frame, (x - 1, y - 1), 1, (255, 255, 255), -1, cv2.LINE_AA)


def fish(frame, x, y, scale, color, flip=1):
    body = np.array([[x - 22 * scale * flip, y], [x - 8 * scale * flip, y - 10 * scale], [x + 17 * scale * flip, y], [x - 8 * scale * flip, y + 10 * scale]], np.int32)
    tail = np.array([[x - 18 * scale * flip, y], [x - 31 * scale * flip, y - 13 * scale], [x - 30 * scale * flip, y + 13 * scale]], np.int32)
    cv2.fillConvexPoly(frame, body, color)
    cv2.fillConvexPoly(frame, tail, (118, 135, 245))
    cv2.circle(frame, (int(x + 8 * scale * flip), int(y - 2 * scale)), max(1, int(2 * scale)), (12, 25, 58), -1)


def lyric_motif(frame, t, lyric, palette):
    if not lyric:
        return
    _, start, end, _, motif = lyric
    _, _, light, accent = palette
    p = min(1, max(0, (t - start) / max(.01, end - start)))
    if motif == 'sea':
        for n in range(5):
            yy = int(458 + n * 33 + math.sin(t * 3 + n) * 9)
            pts = np.array([[0, yy], [220, yy - 14], [470, yy + 8], [730, yy - 12], [1000, yy + 7], [1280, yy - 9]], np.int32)
            cv2.polylines(frame, [pts], False, light, 2 if n == 0 else 1, cv2.LINE_AA)
    elif motif == 'mountain':
        for n in range(4):
            base = 535 + n * 18
            offset = int((t * (22 + n * 7)) % 180)
            pts = np.array([[-160 + n * 300 - offset, base], [110 + n * 300 - offset, base - 160 - n * 24], [390 + n * 300 - offset, base]], np.int32)
            layer = frame.copy()
            cv2.fillConvexPoly(layer, pts, light if n % 2 else accent)
            cv2.addWeighted(layer, .12 + n * .035, frame, .88 - n * .035, 0, frame)
    elif motif == 'distance':
        spread = int(70 + p * 430)
        left, right = (W // 2 - spread, 412), (W // 2 + spread, 412)
        cv2.circle(frame, left, 13 + int(pulse(t) * 7), accent, -1, cv2.LINE_AA)
        cv2.circle(frame, right, 13 + int(pulse(t) * 7), light, -1, cv2.LINE_AA)
        for x in range(left[0] + 28, right[0] - 15, 28):
            cv2.line(frame, (x, 412), (x + 13, 412), (230, 240, 255), 2, cv2.LINE_AA)
    elif motif == 'retreat':
        for n in range(10):
            x = int(W - ((t - start) * (95 + n * 7) + n * 133) % (W + 140))
            y = 250 + (n % 5) * 62
            cv2.rectangle(frame, (x, y), (x + 37, y + 21), accent if n % 2 else (107, 135, 255), -1)
    elif motif == 'memory':
        for n in range(9):
            a = t * .85 + n * math.pi * 2 / 9
            x = int(640 + math.cos(a) * (140 + n % 3 * 36))
            y = int(475 + math.sin(a * 1.25) * (76 + n % 2 * 26))
            cv2.circle(frame, (x, y), 14, (245, 248, 255), -1, cv2.LINE_AA)
            cv2.line(frame, (x - 8, y), (x + 10, y), light, 3, cv2.LINE_AA)
    elif motif == 'search':
        for n in range(3):
            radius = int(58 + ((t - start) * 145 + n * 86) % 220)
            cv2.circle(frame, (640, 398), radius, light, 2, cv2.LINE_AA)


def lyric_card(frame, fonts, t, lyric, palette):
    """A recognition card enters on the vocal, then leaves the shot to breathe.

    It remains a synchronised lyric-recognition card, but it is not a permanent
    HUD covering the focal action for the entire line.
    """
    if not lyric:
        return
    code, start, _, text, _ = lyric
    _, _, light, accent = palette
    age = t - start
    enter = ease(age / .14)
    leave = ease((age - 1.05) / .22) if age > 1.05 else 0
    if leave >= .995:
        return
    x = int(42 - leave * 470)
    y, w, h = 42, int(405 * (0.58 + .42 * enter)), 102
    overlay = frame.copy()
    cv2.rectangle(overlay, (x, y), (x + w, y + h), (12, 24, 57), -1)
    cv2.addWeighted(overlay, .80, frame, .20, 0, frame)
    cv2.rectangle(frame, (x, y), (x + max(6, int(13 + pulse(t) * 18)), y + h), light, -1)
    draw_text(frame, fonts, f'歌词识别  ·  {code}', (x + 28, y + 27), 'small', tuple(light[::-1]))
    draw_text(frame, fonts, text, (x + 28, y + 70), 'lyric', (255, 250, 240))


def title_end(frame, fonts, t, palette):
    if t < 29.3:
        return
    _, _, light, _ = palette
    alpha = min(1, (t - 29.3) / .5)
    overlay = frame.copy()
    cv2.rectangle(overlay, (0, 0), (W, 110), (4, 15, 43), -1)
    cv2.addWeighted(overlay, alpha * .75, frame, 1 - alpha * .75, 0, frame)
    draw_text(frame, fonts, '潮汐', (W // 2, 62), 'title', (255, 255, 255), anchor='ma')
    cv2.line(frame, (W // 2 - 150, 95), (W // 2 + 150, 95), light, 3, cv2.LINE_AA)


def ease(p):
    p = min(1.0, max(0.0, p))
    return p * p * (3 - 2 * p)


def lerp(a, b, p):
    return a * (1 - p) + b * p


def scene_gradient(top, bottom):
    y = np.linspace(0, 1, H, dtype=np.float32)[:, None, None]
    frame = np.broadcast_to(np.array(top, dtype=np.float32)[None, None, :] * (1 - y) + np.array(bottom, dtype=np.float32)[None, None, :] * y, (H, W, 3))
    return frame.copy().astype(np.uint8)


def translucent_poly(frame, points, color, alpha):
    layer = frame.copy()
    cv2.fillPoly(layer, [np.array(points, np.int32)], color)
    cv2.addWeighted(layer, alpha, frame, 1 - alpha, 0, frame)


def pixel_star(frame, x, y, r, colour):
    """A four-point point of focus, deliberately sized for the final pixel grid."""
    pts = np.array([(x, y - r), (x + r // 3, y - r // 3), (x + r, y),
                    (x + r // 3, y + r // 3), (x, y + r),
                    (x - r // 3, y + r // 3), (x - r, y),
                    (x - r // 3, y - r // 3)], np.int32)
    cv2.fillPoly(frame, [pts], colour)


def draw_mountain_chain(frame, t, base, palette, rise=1.0, offset=0, ink=None):
    """Layered islands with waterfalls and roof-lights, not anonymous triangles."""
    deep, upper, light, accent = palette
    dark = ink or mix(deep, (23, 22, 39), .42)
    cols = [mix(deep, upper, .22), mix(deep, upper, .46), mix(upper, light, .18)]
    for layer, col in enumerate(cols):
        shift = int((t * (15 + layer * 8) + offset + layer * 93) % 260)
        for j in range(-2, 7):
            x = j * 255 - shift
            height = int((118 + (j * 31 + layer * 29) % 96) * rise)
            peak_x = x + 92 + (j % 3) * 16
            pts = [(x, base), (peak_x, base - height), (x + 250, base)]
            translucent_poly(frame, pts, col, .72 - layer * .12)
            # A stepped ridge, waterfall and one roof-light create a readable place.
            cv2.line(frame, (peak_x, base - height), (x + 250, base), light, 2, cv2.LINE_8)
            if (j + layer) % 2 == 0:
                cv2.rectangle(frame, (peak_x - 8, base - height + 20), (peak_x + 8, base - height + 42), dark, -1)
                cv2.rectangle(frame, (peak_x - 3, base - height + 24), (peak_x + 3, base - height + 31), accent, -1)
            if (j + layer) % 3 == 0:
                cv2.line(frame, (x + 165, base - height // 2), (x + 175, base - 12), light, 2, cv2.LINE_8)


def draw_lighthouse(frame, x, floor, s, palette, on, flip=1):
    """A small lighthouse prop: its beam gives the eye a clear story target."""
    deep, upper, light, accent = palette
    w, h = int(28 * s), int(132 * s)
    body = np.array([(x - w, floor), (x + w, floor), (x + int(w * .58), floor - h), (x - int(w * .58), floor - h)], np.int32)
    cv2.fillPoly(frame, [body], mix(deep, upper, .42))
    cv2.rectangle(frame, (x - int(w * .78), floor - h - int(17 * s)), (x + int(w * .78), floor - h), deep, -1)
    cv2.rectangle(frame, (x - int(w * .4), floor - h - int(13 * s)), (x + int(w * .4), floor - h - int(4 * s)), accent if on else upper, -1)
    for y in range(floor - int(h * .7), floor - 8, int(31 * s)):
        cv2.line(frame, (x - int(w * .58), y), (x + int(w * .58), y), light, 2, cv2.LINE_8)
    if on:
        beam = [(x + flip * int(7 * s), floor - h - int(9 * s)),
                (x + flip * int(430 * s), floor - h - int(155 * s)),
                (x + flip * int(430 * s), floor - h + int(125 * s))]
        translucent_poly(frame, beam, light, .14 + .08 * pulse(on))


def draw_boat(frame, x, y, s, palette, tilt=0.0):
    """A paper boat is the physical stand-in for the love that retreats."""
    deep, upper, light, accent = palette
    pts = np.array([(x - 45 * s, y), (x + 48 * s, y), (x + 25 * s, y + 21 * s), (x - 24 * s, y + 21 * s)], np.int32)
    cv2.fillPoly(frame, [pts], (234, 239, 232))
    sail = np.array([(x - 8 * s, y - 68 * s), (x - 8 * s, y), (x + 37 * s, y)], np.int32)
    cv2.fillPoly(frame, [sail], accent)
    cv2.line(frame, (int(x - 8 * s), int(y - 75 * s)), (int(x - 8 * s), int(y + 12 * s)), deep, 3, cv2.LINE_8)
    cv2.line(frame, (int(x - 43 * s), int(y + 4 * s)), (int(x + 47 * s), int(y + 4 * s)), light, 2, cv2.LINE_8)


def draw_arch(frame, cx, floor, s, palette, phase):
    """The sonar shrine has a gate, steps and a moving scan: a stage for seeking."""
    deep, upper, light, accent = palette
    col = mix(deep, upper, .4)
    leg_w, top = int(34 * s), int(230 * s)
    for dx in (-int(220 * s), int(220 * s)):
        cv2.rectangle(frame, (cx + dx - leg_w // 2, floor - top), (cx + dx + leg_w // 2, floor), col, -1)
        cv2.rectangle(frame, (cx + dx - leg_w // 2, floor - top), (cx + dx + leg_w // 2, floor - top + int(20 * s)), accent, -1)
    cv2.ellipse(frame, (cx, floor - top + int(55 * s)), (int(220 * s), int(160 * s)), 0, 180, 360, col, int(30 * s), cv2.LINE_8)
    for step in range(4):
        yy = floor - step * int(18 * s)
        cv2.rectangle(frame, (cx - int((170 - step * 18) * s), yy), (cx + int((170 - step * 18) * s), yy + int(10 * s)), mix(deep, upper, .58), -1)
    for r in (72, 140, 210):
        rr = int((r + ((phase * 100) % 42)) * s)
        cv2.ellipse(frame, (cx, floor - int(100 * s)), (rr, int(rr * .43)), 0, 190, 350, light, 2, cv2.LINE_8)


def draw_memory_frame(frame, x, y, s, kind, palette):
    """Three tiny tangible memories—pearl, mountain and beacon—rather than random dots."""
    deep, upper, light, accent = palette
    cv2.rectangle(frame, (int(x - 23 * s), int(y - 20 * s)), (int(x + 23 * s), int(y + 20 * s)), (235, 229, 207), -1)
    cv2.rectangle(frame, (int(x - 19 * s), int(y - 16 * s)), (int(x + 19 * s), int(y + 16 * s)), mix(deep, upper, .48), -1)
    if kind == 0:
        cv2.circle(frame, (int(x), int(y)), max(3, int(7 * s)), light, -1, cv2.LINE_8)
    elif kind == 1:
        pts = np.array([(x - 15 * s, y + 12 * s), (x, y - 13 * s), (x + 15 * s, y + 12 * s)], np.int32)
        cv2.fillPoly(frame, [pts], accent)
    else:
        cv2.rectangle(frame, (int(x - 3 * s), int(y - 13 * s)), (int(x + 3 * s), int(y + 14 * s)), light, -1)
        cv2.circle(frame, (int(x), int(y - 9 * s)), max(3, int(5 * s)), accent, -1, cv2.LINE_8)


def scene_environment(frame, t, scene, palette):
    """A connected eight-shot pixel story, built as actions and props.

    Each scene has one thing to read, a cause, and an on-screen reaction. Motifs
    carry over: pearl → route → boat → sonar → tide → beacon → memory → signal.
    """
    deep, upper, light, accent = palette

    if scene == 0:  # 00–04: a pearl signal wakes, then points to a mountain.
        draw_mountain_chain(frame, t, 600, palette, rise=ease((t - 2.18) / .62), offset=30)
        for i in range(7):
            x = 40 + i * 198 + int(math.sin(t + i) * 8)
            cv2.line(frame, (x, 690), (x + 9, 615 - (i % 3) * 36), (86, 125, 62), 5, cv2.LINE_8)
            cv2.line(frame, (x + 9, 645), (x - 8, 626), (86, 125, 62), 3, cv2.LINE_8)
        # Ruined stone arch makes the pearl an object in a place, not decoration.
        cv2.rectangle(frame, (130, 430), (190, 665), mix(deep, upper, .35), -1)
        cv2.rectangle(frame, (370, 430), (430, 665), mix(deep, upper, .35), -1)
        cv2.ellipse(frame, (280, 445), (150, 90), 0, 180, 360, mix(deep, upper, .35), 44, cv2.LINE_8)
        age = max(0, t - .72)
        glow = int(38 + 28 * (1 + math.sin(t * 7)) + age * 22)
        for r, op in ((glow + 70, .10), (glow + 35, .18)):
            layer = frame.copy(); cv2.circle(layer, (280, 520), r, light, -1, cv2.LINE_8); cv2.addWeighted(layer, op, frame, 1 - op, 0, frame)
        cv2.circle(frame, (280, 520), 25 + int(pulse(t) * 12), (235, 241, 232), -1, cv2.LINE_8)
        pixel_star(frame, 280, 520, 18 + int(pulse(t) * 9), accent)
        # The wake-up beam becomes the mountain route at the lyric change.
        if t > 2.35:
            cv2.line(frame, (305, 505), (715, 382), light, 5, cv2.LINE_8)
            for k in range(6):
                x = 350 + k * 61
                cv2.rectangle(frame, (x, 482 - k * 18), (x + 16, 490 - k * 18), accent, -1)

    elif scene == 1:  # 04–08: map route stretches across two actual shores, then breaks.
        draw_mountain_chain(frame, t, 603, palette, rise=1, offset=140)
        left = [(0, 720), (0, 450), (240, 405), (458, 636), (458, 720)]
        right = [(W, 720), (W, 424), (W - 230, 385), (W - 456, 635), (W - 456, 720)]
        cv2.fillPoly(frame, [np.array(left, np.int32)], deep)
        cv2.fillPoly(frame, [np.array(right, np.int32)], deep)
        draw_lighthouse(frame, 235, 514, 1.1, palette, t, 1)
        draw_lighthouse(frame, 1048, 500, 1.1, palette, t + .5, -1)
        # Map desk with a pin, then its line creates the impossible route.
        cv2.rectangle(frame, (65, 473), (420, 504), (66, 64, 76), -1)
        cv2.rectangle(frame, (92, 310), (357, 472), (213, 222, 205), -1)
        cv2.rectangle(frame, (101, 319), (348, 463), mix(deep, upper, .42), -1)
        route = [(122, 425), (168, 390), (208, 414), (252, 355), (302, 370)]
        cv2.polylines(frame, [np.array(route, np.int32)], False, light, 3, cv2.LINE_8)
        cv2.circle(frame, (122, 425), 8, accent, -1, cv2.LINE_8)
        cv2.circle(frame, (302, 370), 8, light, -1, cv2.LINE_8)
        spread = int(42 + 190 * ease((t - 4.38) / 3.25))
        a, b = (640 - spread, 406), (640 + spread, 406)
        cv2.circle(frame, a, 17, accent, -1, cv2.LINE_8)
        cv2.circle(frame, b, 17, light, -1, cv2.LINE_8)
        for x in range(a[0] + 28, b[0] - 15, 31): cv2.line(frame, (x, 406), (x + 14, 406), (225, 239, 244), 2, cv2.LINE_8)
        if t > 6.55:
            cv2.rectangle(frame, (625, 394), (655, 418), deep, -1)  # decisive broken-route beat
            for i in range(8):
                xx = 635 + int(math.cos(i * .8) * (20 + i * 8)); yy = 405 + int(math.sin(i * .8) * (13 + i * 5))
                cv2.rectangle(frame, (xx, yy), (xx + 6, yy + 6), accent, -1)

    elif scene == 2:  # 08–12: the boat retreats, folds and becomes one memory.
        # A low tide wall holds the boat back; its retreat has a spatial cause.
        for i in range(7):
            x = 0 + i * 210
            cv2.line(frame, (x, 589 + (i % 2) * 12), (x + 190, 582 - (i % 2) * 8), upper, 3, cv2.LINE_8)
        wall_x = 470
        for y in range(250, 645, 38):
            cv2.rectangle(frame, (wall_x, y), (wall_x + 26, y + 18), light, -1)
        if t < 10.42:
            u = ease((t - 8.35) / 1.82)
            bx = lerp(850, 555, u)
            draw_boat(frame, bx, 535 + math.sin(t * 5) * 8, 1.25, palette)
            # Boat hits the wall, then visibly turns back instead of vanishing.
            if t > 9.5:
                for i in range(7):
                    cv2.rectangle(frame, (int(bx - 14 - i * 13), int(500 + math.sin(i) * 20)), (int(bx - 7 - i * 13), int(507 + math.sin(i) * 20)), accent, -1)
        else:
            u = ease((t - 10.42) / .55)
            cv2.circle(frame, (555, 470), int(28 + 62 * u), (237, 240, 226), -1, cv2.LINE_8)
            pixel_star(frame, 555, 470, 12 + int(20 * u), light)
            for i in range(8):
                a = t * 1.7 + i * math.pi / 4
                cv2.circle(frame, (int(555 + math.cos(a) * 120), int(470 + math.sin(a) * 76)), 8, light, 2, cv2.LINE_8)

    elif scene == 3:  # 12–16: the memory becomes an active sonar gate.
        draw_arch(frame, 640, 630, 1.0, palette, t - 12.4)
        # A school leaves the scan before a small target deliberately slips through the gate.
        target_x = int(820 + math.sin(t * 2.2) * 135)
        for i in range(9):
            x = int(120 + ((i * 115 + (t - 12.4) * (48 + i * 2)) % 560))
            y = 280 + (i % 4) * 45
            fish(frame, x, y, .45 + (i % 3) * .08, mix(upper, light, .35), 1)
        cv2.circle(frame, (target_x, 285), 17, accent, 2, cv2.LINE_8)
        cv2.line(frame, (target_x - 25, 285), (target_x + 25, 285), light, 2, cv2.LINE_8)
        cv2.line(frame, (target_x, 260), (target_x, 310), light, 2, cv2.LINE_8)

    elif scene == 4:  # 16–20: sonar turns into a tide that carries the route upward.
        draw_mountain_chain(frame, t, 610, palette, rise=ease((t - 17.92) / .58), offset=20)
        u = ease((t - 16.0) / 3.65)
        crest_x = int(-250 + u * 980)
        wave = [(crest_x - 280, 720), (crest_x - 250, 465), (crest_x - 145, 390), (crest_x - 60, 446),
                (crest_x + 35, 318), (crest_x + 125, 420), (crest_x + 185, 555), (crest_x + 330, 720)]
        cv2.fillPoly(frame, [np.array(wave, np.int32)], mix(upper, light, .38))
        cv2.polylines(frame, [np.array(wave[:7], np.int32)], False, light, 5, cv2.LINE_8)
        for i in range(7):
            x = crest_x - 160 + i * 55
            y = 410 + abs(math.sin(t * 3 + i)) * 36
            cv2.rectangle(frame, (int(x), int(y)), (int(x + 15), int(y + 8)), (238, 243, 237), -1)
        # The pearl now travels as a carried light, connecting opening to chorus return.
        px = int(300 + u * 575); py = int(470 - 145 * math.sin(u * math.pi))
        cv2.circle(frame, (px, py), 16 + int(pulse(t) * 8), (239, 244, 232), -1, cv2.LINE_8)
        pixel_star(frame, px, py, 10, accent)

    elif scene == 5:  # 20–24: mountain beacons try to close the ink distance.
        paper = frame.copy(); paper[:] = (190, 194, 179)
        cv2.addWeighted(paper, .26, frame, .74, 0, frame)
        left = [(0, 720), (0, 442), (216, 255), (485, 622), (485, 720)]
        right = [(W, 720), (W, 432), (W - 220, 258), (W - 490, 622), (W - 490, 720)]
        cv2.fillPoly(frame, [np.array(left, np.int32)], (84, 82, 71))
        cv2.fillPoly(frame, [np.array(right, np.int32)], (84, 82, 71))
        cv2.polylines(frame, [np.array(left[:4], np.int32)], False, (52, 48, 38), 5, cv2.LINE_8)
        cv2.polylines(frame, [np.array(right[:4], np.int32)], False, (52, 48, 38), 5, cv2.LINE_8)
        draw_lighthouse(frame, 215, 462, .78, palette, t, 1)
        draw_lighthouse(frame, 1060, 460, .78, palette, t + .35, -1)
        p = ease((t - 20.1) / 3.55)
        for i in range(8):
            xx = int(285 + i * 89)
            if i < int(p * 10): cv2.rectangle(frame, (xx, 365 + (i % 2) * 8), (xx + 29, 370 + (i % 2) * 8), (242, 238, 202), -1)
        # The final dash never bridges it; it rises toward the next memory shot.
        if t > 22.7:
            a = ease((t - 22.7) / .9)
            cv2.circle(frame, (int(640 + 90 * a), int(378 - 170 * a)), 9, light, -1, cv2.LINE_8)

    elif scene == 6:  # 24–28: the lost route reappears as three curated memories.
        moon_x, moon_y = 410, 315
        if t > 26.05:
            cv2.circle(frame, (moon_x, moon_y), 145, (233, 235, 224), -1, cv2.LINE_8)
            cv2.circle(frame, (moon_x + 58, moon_y - 35), 132, deep, -1, cv2.LINE_8)
        else:
            cv2.circle(frame, (moon_x, moon_y), 72, mix(upper, accent, .35), -1, cv2.LINE_8)
        for i in range(3):
            a = (t - 24) * .82 + i * math.pi * 2 / 3
            radius = 150 if t > 26.05 else 220
            draw_memory_frame(frame, moon_x + math.cos(a) * radius, moon_y + math.sin(a) * radius * .58, .92, i, palette)
        # Retreat fragments leave first; the framed memories stay to be read.
        if t < 26.13:
            for i in range(9):
                x = int(1040 - (t - 24) * (90 + i * 6) - i * 88)
                y = 205 + (i % 5) * 70
                cv2.rectangle(frame, (x, y), (x + 22, y + 13), accent if i % 2 else light, -1)

    else:  # 28–31.843: every earlier object resolves into the same searching signal.
        # No extra title-card background: final objects are staged as a coherent payoff.
        for i, (x, y) in enumerate(((285, 460), (430, 330), (850, 330), (1000, 460))):
            cv2.circle(frame, (x, y), 18, accent if i % 2 else light, -1, cv2.LINE_8)
            cv2.line(frame, (x, y), (640, 402), light, 2, cv2.LINE_8)
        for r in range(95, 430, 58):
            a = t * .95 + r * .02
            cv2.ellipse(frame, (640, 400), (r, int(r * .45)), int(math.sin(a) * 12), 25, 332, light, 3, cv2.LINE_8)
        for x in range(-80, W + 100, 84):
            cv2.line(frame, (640, 410), (x + int(math.sin(t * 2 + x) * 16), 720), (147, 60, 189), 2, cv2.LINE_8)
        beat = pulse(t)
        cv2.circle(frame, (640, 402), 28 + int(22 * beat), (235, 244, 232), -1, cv2.LINE_8)
        pixel_star(frame, 640, 402, 20 + int(12 * beat), accent)


def storyboard_layer(frame, t, shot, palette):
    """Shot-specific foreground and bridge beats from the 12-beat story board.

    The environment is a reusable set, while this layer makes the beat a
    readable cause/effect moment: one anchor, a world action and a reaction.
    """
    deep, upper, light, accent = palette
    if shot == 1:  # Pearl beam turns into a look-out window / mountain route.
        cv2.rectangle(frame, (38, 118), (442, 428), mix(deep, upper, .28), -1)
        cv2.rectangle(frame, (52, 132), (428, 414), mix(deep, upper, .68), -1)
        cv2.rectangle(frame, (52, 132), (428, 414), light, 4)
        draw_mountain_chain(frame, t, 454, palette, rise=1, offset=77)
        cv2.line(frame, (100, 362), (424, 224), accent, 3, cv2.LINE_8)
    elif shot == 3:  # The map proof becomes two visibly separate shore beacons.
        cv2.rectangle(frame, (460, 342), (820, 464), mix(deep, upper, .36), -1)
        for side in (-1, 1):
            x = 640 + side * 128
            cv2.circle(frame, (x, 390), 18 + int(pulse(t) * 8), accent if side < 0 else light, 2, cv2.LINE_8)
            cv2.line(frame, (x, 420), (x, 450), light, 2, cv2.LINE_8)
        cv2.rectangle(frame, (627, 377), (653, 404), deep, -1)
    elif shot == 5:  # Retreating boat's folded result: tangible memory orbit.
        for i in range(5):
            a = (t - 10.43) * 1.7 + i * math.pi * 2 / 5
            x, y = int(555 + math.cos(a) * 116), int(470 + math.sin(a) * 65)
            cv2.rectangle(frame, (x - 12, y - 9), (x + 12, y + 9), (235, 241, 232), -1)
            cv2.rectangle(frame, (x - 9, y - 6), (x + 9, y + 6), accent if i % 2 else upper, -1)
        cv2.circle(frame, (555, 470), 23 + int(pulse(t) * 10), light, -1, cv2.LINE_8)
        pixel_star(frame, 555, 470, 12, accent)
    elif shot == 6:  # Searching gets a moving crosshair, not only abstract rings.
        x = int(805 + math.sin(t * 2.4) * 128)
        cv2.circle(frame, (x, 274), 22, accent, 2, cv2.LINE_8)
        cv2.line(frame, (x - 34, 274), (x + 34, 274), light, 2, cv2.LINE_8)
        cv2.line(frame, (x, 240), (x, 308), light, 2, cv2.LINE_8)
        for i in range(4):
            cv2.rectangle(frame, (x - 8 + i * 5, 266), (x - 4 + i * 5, 282), light, -1)
    elif shot == 8:  # Callback: carried pearl reaches a newly lit mountain roof.
        draw_mountain_chain(frame, t, 618, palette, rise=1, offset=11)
        cv2.circle(frame, (376, 272), 16 + int(pulse(t) * 7), light, -1, cv2.LINE_8)
        pixel_star(frame, 376, 272, 10, accent)
        cv2.line(frame, (376, 288), (510, 387), light, 3, cv2.LINE_8)
    elif shot == 10:  # Archive holds literal callbacks from the prior worlds.
        for i, kind in enumerate((0, 1, 2)):
            a = (t - 24.03) * .75 + i * math.pi * 2 / 3
            draw_memory_frame(frame, 420 + math.cos(a) * 170, 306 + math.sin(a) * 92, .88, kind, palette)
    elif shot == 11:  # Final board connects every recurring object to one pearl.
        for x, y in ((204, 488), (391, 320), (889, 320), (1076, 488)):
            cv2.line(frame, (x, y), (640, 402), light, 2, cv2.LINE_8)
            cv2.circle(frame, (x, y), 12, accent, -1, cv2.LINE_8)
        cv2.circle(frame, (640, 402), 22 + int(pulse(t) * 12), (242, 246, 235), -1, cv2.LINE_8)
        pixel_star(frame, 640, 402, 14, accent)


def pixel_finish(frame):
    """Commit worlds, type and the JS-built heroine to one pixel grid."""
    low = cv2.resize(frame, (W // PIXEL_SIZE, H // PIXEL_SIZE), interpolation=cv2.INTER_AREA)
    levels = 8
    low = ((low.astype(np.uint16) * (levels - 1) + 127) // 255 * (255 // (levels - 1))).astype(np.uint8)
    return cv2.resize(low, (W, H), interpolation=cv2.INTER_NEAREST)


def composite_rig_layer(frame, actor_layer):
    """Composite the transparent JS-rig frame on the 1280×720 movie canvas."""
    if actor_layer is None or actor_layer.shape[2] != 4:
        raise RuntimeError('Expected a transparent BGRA actor layer from tools/render_whale_rig.mjs')
    layer = cv2.resize(actor_layer, (W, H), interpolation=cv2.INTER_NEAREST)
    alpha = layer[:, :, 3:4].astype(np.float32) / 255.0
    frame[:] = (layer[:, :, :3].astype(np.float32) * alpha + frame.astype(np.float32) * (1 - alpha)).astype(np.uint8)


def render_frame(t, fonts, actor_layer):
    shot = scene_at(t)
    environment = ENV_BY_SHOT[shot]
    palette = PALETTES[PALETTE_BY_SHOT[shot]]
    # Every board shot gets a legible world plus a foreground story action.
    # The gradient changes on world turns, while the bridge object stays visible.
    if environment == 5:
        frame = scene_gradient((208, 202, 178), (83, 89, 77))
    elif environment == 7:
        frame = scene_gradient((84, 25, 100), (27, 10, 52))
    elif environment == 4:
        frame = scene_gradient((198, 126, 113), (86, 49, 77))
    else:
        frame = scene_gradient(palette[1], palette[0])
    scene_environment(frame, t, environment, palette)
    storyboard_layer(frame, t, shot, palette)
    # The scene itself carries the lyric objective; keep the ambient layer quiet
    # enough that its single focal action can be read.
    bubbles(frame, t, palette)
    # The heroine layer is generated by the shared part-based JS rig. No
    # saved source PNG is composited into the finished MV.
    composite_rig_layer(frame, actor_layer)
    lyric_card(frame, fonts, t, lyric_at(t), palette)
    title_end(frame, fonts, t, palette)
    return pixel_finish(frame)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--frames', default='render/tide-frames', help='Output directory for numbered PNG frames')
    parser.add_argument('--rig-frames', default='render/whale-rig', help='Transparent 320×180 layers made by tools/render_whale_rig.mjs')
    parser.add_argument('--fps', type=int, default=FPS)
    parser.add_argument('--width', type=int, default=W)
    parser.add_argument('--height', type=int, default=H)
    args = parser.parse_args()
    if args.width != W or args.height != H:
        raise SystemExit('This renderer is intentionally fixed at 1280x720; scale after encoding if needed.')
    if args.fps != FPS:
        raise SystemExit('This timing sheet is authored at 24 fps.')

    fonts = make_fonts()
    output = ROOT / args.frames
    output.mkdir(parents=True, exist_ok=True)
    rig_dir = ROOT / args.rig_frames
    if not rig_dir.is_dir():
        raise SystemExit(f'Missing JS rig frames at {rig_dir}; run node tools/render_whale_rig.mjs first.')
    frame_count = math.ceil(DURATION * FPS)
    for number in range(frame_count):
        t = min(DURATION - 1 / FPS, number / FPS)
        rig_frame = rig_dir / f'{number + 1:06d}.png'
        actor_layer = cv2.imread(str(rig_frame), cv2.IMREAD_UNCHANGED)
        if actor_layer is None or actor_layer.shape[:2] != (180, 320) or actor_layer.shape[2] != 4:
            raise SystemExit(f'Invalid JS rig frame: {rig_frame}')
        frame = render_frame(t, fonts, actor_layer)
        cv2.imwrite(str(output / f'{number + 1:06d}.png'), frame)
        if number % 72 == 0 or number == frame_count - 1:
            print(f'frame {number + 1:04d}/{frame_count}  {t:05.2f}s')
    print(f'Wrote {frame_count} frames to {output}')


if __name__ == '__main__':
    main()
