#!/usr/bin/env python3
"""Offline frame renderer for the saved-reference 《潮汐》 lyric MV.

It intentionally draws only from assets/cast/whale-maid/ and never invokes a
model or network service. Encode its PNG frames with ffmpeg and 潮汐.MP3.

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


def scene_at(t: float) -> int:
    return min(7, int(t // 4))


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


def load_sprite(path: str):
    image = cv2.imread(str(ROOT / path), cv2.IMREAD_UNCHANGED)
    if image is None:
        raise RuntimeError(f'Missing saved reference asset: {path}')
    if image.shape[2] != 4:
        raise RuntimeError(f'Expected alpha PNG: {path}')
    return image


def composite(frame, sprite, center, height, opacity=1.0, scale=1.0, angle=0.0, squash=0.0, xscale=1.0):
    """Put a saved actor pose into the frame with cartoon squash/turn motion.

    The pose image never changes identity: this only applies reversible 2D
    staging transforms, analogous to Clawd's dy/sq/rot acting controls.
    """
    h = max(1, int(height * scale * (1 - squash)))
    w = max(1, int(sprite.shape[1] * h / sprite.shape[0] * (1 + squash * .72) * xscale))
    layer = cv2.resize(sprite, (w, h), interpolation=cv2.INTER_LANCZOS4)
    if abs(angle) > .01:
        pad = max(w, h) // 4 + 4
        layer = cv2.copyMakeBorder(layer, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=(0, 0, 0, 0))
        cy, cx = layer.shape[0] / 2, layer.shape[1] / 2
        matrix = cv2.getRotationMatrix2D((cx, cy), angle, 1.0)
        layer = cv2.warpAffine(layer, matrix, (layer.shape[1], layer.shape[0]), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
        h, w = layer.shape[:2]
    x0 = int(center[0] - w / 2)
    y0 = int(center[1] - h * .56)
    x1, y1 = x0 + w, y0 + h
    cx0, cy0, cx1, cy1 = max(0, x0), max(0, y0), min(W, x1), min(H, y1)
    if cx0 >= cx1 or cy0 >= cy1:
        return
    lx0, ly0 = cx0 - x0, cy0 - y0
    layer = layer[ly0:ly0 + (cy1 - cy0), lx0:lx0 + (cx1 - cx0)]
    alpha = (layer[:, :, 3:4].astype(np.float32) / 255.0) * opacity
    roi = frame[cy0:cy1, cx0:cx1].astype(np.float32)
    frame[cy0:cy1, cx0:cx1] = (layer[:, :, :3].astype(np.float32) * alpha + roi * (1 - alpha)).astype(np.uint8)


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

# The saved references are staged as a small 2D character rig. This follows
# the useful *structure* of ClaudeAnimationBase (key views, emotion keys,
# anticipation, take, overshoot and held reads), without borrowing its
# character artwork or drawing a replacement singer.
ACTING_KEYS = [
    # start,      saved pose,  ground/anchor,  height, mood
    (0.00, 'standing', (915, 516), 558, 'curious'),
    (2.42, 'laptop',   (812, 520), 540, 'hopeful'),
    (4.42, 'laptop',   (780, 520), 540, 'determined'),
    (6.58, 'hands',    (892, 518), 557, 'shocked'),
    (8.33, 'hands',    (892, 518), 557, 'retreat'),
    (10.43, 'pixel',   (835, 528), 500, 'wistful'),
    (12.43, 'pixel',   (882, 532), 490, 'seeking'),
    (15.82, 'cel',     (866, 532), 505, 'relieved'),
    (18.12, 'cel',     (860, 530), 510, 'hopeful'),
    (20.12, 'ink',     (852, 535), 505, 'distant'),
    (24.03, 'hands',   (864, 535), 510, 'retreat'),
    (26.13, 'hands',   (866, 535), 510, 'wistful'),
    (28.13, 'neon',    (644, 520), 575, 'seeking'),
]


def lerp(a, b, p):
    return a * (1 - p) + b * p


def acting_key_at(t):
    index = 0
    for i, key in enumerate(ACTING_KEYS):
        if key[0] <= t:
            index = i
        else:
            break
    return index, ACTING_KEYS[index]


def actor_motion(mood, t):
    """An emotion is a full body response, not a static label.

    Values are deliberately modest because the approved PNG is the model sheet:
    we animate staging (dy/sq/rot/turn), never redraw the heroine's face.
    """
    phase = (t * BPM / 60) % 1
    hit = (1 - phase) ** 4
    half = math.sin(phase * math.pi)
    swing = math.sin(t * 2.15)
    out = {'dx': 0.0, 'dy': -7 * abs(half) - hit * 7, 'sq': .025 * hit,
           'angle': swing * 1.1, 'xscale': 1.0, 'emote': 'spark'}
    if mood == 'curious':
        out.update(dx=8 * math.sin(t * 1.35), angle=-1.3 + swing * 1.6, emote='spark')
    elif mood == 'hopeful':
        out.update(dy=-14 * abs(half) - hit * 10, sq=-.045 + .045 * hit,
                   angle=.8 * swing, emote='spark')
    elif mood == 'determined':
        out.update(dx=5 * math.sin(t * 1.7), dy=-9 * abs(half) - hit * 9,
                   sq=-.025 + .055 * hit, angle=2.2 + swing * .55,
                   xscale=.95, emote='compass')
    elif mood == 'shocked':
        out.update(dx=4 * math.sin(t * 22), dy=-12 - 10 * abs(half), sq=-.09,
                   angle=math.sin(t * 14) * 1.1, xscale=.94, emote='shock')
    elif mood == 'retreat':
        out.update(dx=-15 - 7 * math.sin(t * 2.0), dy=-4 * abs(half), sq=.055 + .035 * hit,
                   angle=-2.2 + swing * .5, xscale=1.06, emote='retreat')
    elif mood == 'wistful':
        out.update(dx=4 * math.sin(t * .85), dy=-5 - 8 * abs(math.sin(t * .8)),
                   sq=-.035, angle=-1.6 + swing * .7, emote='memory')
    elif mood == 'seeking':
        out.update(dx=8 * math.sin(t * 3.8), dy=-11 * abs(half) - hit * 13,
                   sq=-.025 + .08 * hit, angle=math.sin(t * 7.5) * 2.0,
                   xscale=.97, emote='search')
    elif mood == 'relieved':
        out.update(dy=-7 * abs(half), sq=.04 + .025 * math.sin(t * .8),
                   angle=-.5 + swing * .8, emote='bubbles')
    elif mood == 'distant':
        out.update(dx=-5 + 4 * math.sin(t * .7), dy=-4 * abs(half), sq=.025,
                   angle=-2.6 + swing * .45, xscale=.91, emote='distance')
    return out


def pixel_emote(frame, center, height, mood, t, palette):
    """Tiny pixel symbols make the reaction legible without altering the PNG face."""
    _, _, light, accent = palette
    x = int(center[0] + height * .22)
    y = int(center[1] - height * .61)
    p = 1 + pulse(t) * .16
    if mood == 'spark':
        for ang in (0, math.pi / 2, math.pi / 4, math.pi * .75):
            dx, dy = int(math.cos(ang) * 18 * p), int(math.sin(ang) * 18 * p)
            cv2.line(frame, (x - dx, y - dy), (x + dx, y + dy), light, 3, cv2.LINE_8)
        cv2.rectangle(frame, (x - 4, y - 4), (x + 4, y + 4), accent, -1)
    elif mood == 'compass':
        cv2.circle(frame, (x, y), int(17 * p), light, 2, cv2.LINE_8)
        cv2.line(frame, (x - 10, y + 10), (x + 12, y - 13), accent, 3, cv2.LINE_8)
        cv2.rectangle(frame, (x + 8, y - 15), (x + 14, y - 9), light, -1)
    elif mood == 'shock':
        cv2.rectangle(frame, (x - 3, y - 23), (x + 3, y - 4), accent, -1)
        cv2.rectangle(frame, (x - 3, y + 6), (x + 3, y + 12), accent, -1)
        for sx in (-1, 1):
            cv2.rectangle(frame, (x + sx * 16 - 3, y - 13), (x + sx * 16 + 3, y - 7), light, -1)
    elif mood == 'retreat':
        for i in range(3):
            xx = x + 10 + i * 13
            yy = y + int(math.sin(t * 4 + i) * 4) + i * 7
            cv2.rectangle(frame, (xx, yy), (xx + 7, yy + 7), accent if i % 2 else light, -1)
    elif mood in ('memory', 'bubbles'):
        for i in range(3):
            a = t * 1.6 + i * math.pi * 2 / 3
            xx, yy = int(x + math.cos(a) * 19), int(y + math.sin(a) * 14)
            cv2.circle(frame, (xx, yy), 6, light, 2, cv2.LINE_8)
    elif mood == 'search':
        for r in (10, 18, 28):
            cv2.circle(frame, (x, y), int(r * p), light, 2, cv2.LINE_8)
        cv2.line(frame, (x, y), (x + 25, y - 13), accent, 2, cv2.LINE_8)
    elif mood == 'distance':
        cv2.circle(frame, (x - 16, y), 6, accent, -1, cv2.LINE_8)
        cv2.circle(frame, (x + 16, y), 6, light, -1, cv2.LINE_8)
        cv2.line(frame, (x - 8, y), (x + 8, y), (226, 238, 255), 2, cv2.LINE_8)



def draw_actor_transition(frame, t, begin, old_key, new_key, sprites, palette):
    """Layer the two approved poses during a readable 0.64-second transform."""
    u = ease((t - begin) / .64)
    old_pose, old_center, old_height, _ = old_key[1:]
    new_pose, new_center, new_height, new_mood = new_key[1:]
    cx = lerp(old_center[0], new_center[0], u)
    cy = lerp(old_center[1], new_center[1], u) - 36 * math.sin(u * math.pi)
    height = lerp(old_height, new_height, u)
    turn = math.sin(u * math.pi)
    _, _, light, accent = palette
    # Intentional held smear: previous positions arc toward the new anchor.
    for lag, opacity in ((.17, .075), (.10, .10), (.04, .13)):
        q = max(0.0, u - lag)
        gx = lerp(old_center[0], new_center[0], q)
        gy = lerp(old_center[1], new_center[1], q) + 12
        composite(frame, sprites[old_pose], (gx, gy), height, opacity=opacity,
                  scale=1 + .04 * q, angle=-5 * q, squash=.05 * turn,
                  xscale=1 - .27 * turn)
    composite(frame, sprites[old_pose], (cx - 15 * u, cy + 14 * u), height,
              opacity=1 - u, scale=1 + .11 * u, angle=-8 * u,
              squash=.10 * turn, xscale=1 - .38 * turn)
    composite(frame, sprites[new_pose], (cx + 17 * (1 - u), cy - 12 * (1 - u)), height,
              opacity=u, scale=.88 + .12 * u, angle=8 * (1 - u),
              squash=-.09 * turn, xscale=1 - .38 * turn)
    for i in range(24):
        a = i * 2.399 + t * 6
        r = 58 + 135 * turn + (i % 4) * 14
        x = int(cx + math.cos(a) * r)
        y = int(cy - 55 + math.sin(a) * r * .55)
        size = 3 + i % 4
        cv2.rectangle(frame, (x - size, y - size), (x + size, y + size), light if i % 2 else accent, -1)
    cv2.ellipse(frame, (int(cx), int(cy + height * .36)),
                (int(height * .22 * (1 - .2 * turn)), max(3, int(height * .035))),
                0, 0, 360, (22, 13, 39), 2, cv2.LINE_8)
    if u > .46:
        pixel_emote(frame, (cx, cy), height, new_mood, t, palette)


def acted_actor(frame, t, scene, sprites, palette):
    """Perform the lyric-keyed emotion timeline with anticipation and holds."""
    index, key = acting_key_at(t)
    start, pose, center, height, mood = key
    next_key = ACTING_KEYS[index + 1] if index + 1 < len(ACTING_KEYS) else None
    # The previous emotional state is visibly transformed into this one.
    if index and t < start + .64:
        draw_actor_transition(frame, t, start, ACTING_KEYS[index - 1], key, sprites, palette)
        return
    motion = actor_motion(mood, t)
    # Anticipation: compress and settle just before a new thought / pose lands.
    if next_key and 0 < next_key[0] - t < .18:
        prep = ease((.18 - (next_key[0] - t)) / .18)
        motion['sq'] += .11 * prep
        motion['dy'] += 21 * prep
        motion['angle'] -= 2.4 * prep
    cx = center[0] + motion['dx']
    cy = center[1] + motion['dy']
    # A stable, low pixel shadow keeps the saved sprite planted in each world.
    cv2.ellipse(frame, (int(cx), int(cy + height * .37)),
                (int(height * .27 * motion['xscale']), max(4, int(height * .045))),
                0, 0, 360, (22, 13, 39), -1, cv2.LINE_8)
    # Delayed copies make tail/hair follow-through visible on every beat.
    composite(frame, sprites[pose], (cx - 20, cy + 13), height, opacity=.055,
              scale=.985, angle=motion['angle'] - 4.2, squash=motion['sq'],
              xscale=motion['xscale'] * .98)
    composite(frame, sprites[pose], (cx - 8, cy + 5), height, opacity=.09,
              scale=.995, angle=motion['angle'] - 2.0, squash=motion['sq'],
              xscale=motion['xscale'] * .99)
    pixel_emote(frame, (cx, cy), height, motion['emote'], t, palette)
    composite(frame, sprites[pose], (cx, cy), height,
              scale=1 + pulse(t) * .035, angle=motion['angle'],
              squash=motion['sq'], xscale=motion['xscale'])


def pixel_finish(frame):
    """Commit the whole composition to a 320×180 pixel stage, then scale it.

    This makes scenery, type, effects and the reference sprite share the same
    deliberate pixel grid instead of pasting smooth art over pixel graphics.
    """
    low = cv2.resize(frame, (W // PIXEL_SIZE, H // PIXEL_SIZE), interpolation=cv2.INTER_AREA)
    # A restrained 8-level posterisation removes painterly micro-gradients while
    # retaining the saved heroine's blue / white / navy identity.
    levels = 8
    low = ((low.astype(np.uint16) * (levels - 1) + 127) // 255 * (255 // (levels - 1))).astype(np.uint8)
    return cv2.resize(low, (W, H), interpolation=cv2.INTER_NEAREST)

def render_frame(t, sprites, fonts):
    scene = scene_at(t)
    style_index = 0 if scene <= 3 else 1 if scene == 4 else 2 if scene == 5 else 3
    palette = PALETTES[style_index]
    # Each shot replaces the entire world, not merely a new prop on the same stage.
    if scene == 5:
        frame = scene_gradient((208, 202, 178), (83, 89, 77))
    elif scene == 7:
        frame = scene_gradient((84, 25, 100), (27, 10, 52))
    elif scene == 4:
        frame = scene_gradient((198, 126, 113), (86, 49, 77))
    else:
        frame = scene_gradient(palette[1], palette[0])
    scene_environment(frame, t, scene, palette)
    # The scene itself carries the lyric objective; keep the ambient layer quiet
    # enough that its single focal action can be read.
    bubbles(frame, t, palette)
    acted_actor(frame, t, scene, sprites, palette)
    lyric_card(frame, fonts, t, lyric_at(t), palette)
    title_end(frame, fonts, t, palette)
    return pixel_finish(frame)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--frames', default='render/tide-frames', help='Output directory for numbered PNG frames')
    parser.add_argument('--fps', type=int, default=FPS)
    parser.add_argument('--width', type=int, default=W)
    parser.add_argument('--height', type=int, default=H)
    args = parser.parse_args()
    if args.width != W or args.height != H:
        raise SystemExit('This renderer is intentionally fixed at 1280x720; scale after encoding if needed.')
    if args.fps != FPS:
        raise SystemExit('This timing sheet is authored at 24 fps.')

    fonts = make_fonts()
    sprites = {
        'standing': load_sprite('assets/cast/whale-maid/source/standing.png'),
        'hands': load_sprite('assets/cast/whale-maid/source/hands.png'),
        'laptop': load_sprite('assets/cast/whale-maid/source/laptop.png'),
        'pixel': load_sprite('assets/cast/whale-maid/styles/pixel-rpg.png'),
        'cel': load_sprite('assets/cast/whale-maid/styles/cel-pop.png'),
        'ink': load_sprite('assets/cast/whale-maid/styles/ink-tide.png'),
        'neon': load_sprite('assets/cast/whale-maid/styles/neon-sonar.png'),
    }
    output = ROOT / args.frames
    output.mkdir(parents=True, exist_ok=True)
    frame_count = math.ceil(DURATION * FPS)
    for number in range(frame_count):
        t = min(DURATION - 1 / FPS, number / FPS)
        frame = render_frame(t, sprites, fonts)
        cv2.imwrite(str(output / f'{number + 1:06d}.png'), frame)
        if number % 72 == 0 or number == frame_count - 1:
            print(f'frame {number + 1:04d}/{frame_count}  {t:05.2f}s')
    print(f'Wrote {frame_count} frames to {output}')


if __name__ == '__main__':
    main()
