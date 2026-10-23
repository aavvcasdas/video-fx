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
    if not lyric:
        return
    code, start, _, text, _ = lyric
    _, _, light, accent = palette
    p = min(1, max(0, (t - start) / .16))
    x, y, w, h = 42, 42, int(405 * (0.6 + .4 * p)), 102
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


def scene_environment(frame, t, scene, palette):
    """Eight lyric-led worlds with a visible objective in every four-bar shot.

    The environment is deliberately keyed to the *active lyric*, including the
    two-lyric shots, so the repeating chorus receives a new dramatic response
    instead of a recycled background.
    """
    deep, upper, light, accent = palette

    if scene == 0:  # L01 sea → L02 mountain: the first view gains a destination.
        for i in range(7):
            x = int(i * 210 + math.sin(t * .55 + i) * 35)
            translucent_poly(frame, [(x - 50, 0), (x + 40, 0), (x + 170, 490), (x + 58, 490)], light, .055)
        for y in (92, 118, 147):
            pts = np.array([[0, y], [180, y - 12], [360, y + 8], [560, y - 10], [770, y + 5], [1010, y - 12], [1280, y + 6]], np.int32)
            cv2.polylines(frame, [pts], False, light, 2, cv2.LINE_AA)
        for i in range(10):
            x = 35 + i * 133
            cv2.ellipse(frame, (x, 665), (13, 36 + (i % 3) * 12), -10 + i * 9, 190, 355, (99, 133, 65), 4, cv2.LINE_AA)
        # On “distant mountain scenery,” a destination rises from the sea.
        if t >= 2.25:
            p = ease((t - 2.25) / .55)
            for j in range(-1, 7):
                x = j * 238 - int((t - 2.25) * 25)
                peak = int(530 - 165 * p + (j % 2) * 34)
                translucent_poly(frame, [(x, 620), (x + 118, peak), (x + 252, 620)], mix(deep, upper, .35), .54)
                cv2.line(frame, (x + 118, peak), (x + 252, 620), light, 1, cv2.LINE_AA)

    elif scene == 1:  # L03 distance: two mountain shores and two departing markers.
        left_shore = [(0, 720), (0, 402), (270, 432), (455, 625), (455, 720)]
        right_shore = [(W, 720), (W, 395), (W - 255, 430), (W - 472, 627), (W - 472, 720)]
        translucent_poly(frame, left_shore, deep, .92)
        translucent_poly(frame, right_shore, deep, .92)
        p = ease((t - 4.0) / 3.45)
        gap = int(42 + 210 * p)
        left, right = (W // 2 - gap, 405), (W // 2 + gap, 405)
        cv2.circle(frame, left, 16 + int(pulse(t) * 8), accent, -1, cv2.LINE_AA)
        cv2.circle(frame, right, 16 + int(pulse(t) * 8), light, -1, cv2.LINE_AA)
        for x in range(left[0] + 28, right[0] - 18, 31):
            cv2.line(frame, (x, 405), (x + 14, 405), (224, 240, 255), 2, cv2.LINE_AA)
        # A tiny coordinate panel motivates the saved laptop pose without
        # replacing the distance event with generic scenery.
        panel = frame.copy(); cv2.rectangle(panel, (70, 250), (320, 415), (25, 43, 75), -1)
        cv2.addWeighted(panel, .70, frame, .30, 0, frame)
        cv2.rectangle(frame, (70, 250), (320, 415), light, 2)
        cv2.line(frame, (105, 370), (285, 288), light, 2, cv2.LINE_AA)
        cv2.circle(frame, (138, 355), 5, accent, -1, cv2.LINE_AA)
        cv2.circle(frame, (266, 297), 5, light, -1, cv2.LINE_AA)

    elif scene == 2:  # L04 retreat → L05 memory: things withdraw, then become a keepsake.
        horizon = [(0, 510), (180, 486), (420, 526), (690, 492), (965, 532), (W, 500), (W, H), (0, H)]
        translucent_poly(frame, horizon, deep, .62)
        if t < 10.43:
            # Coral paper slips backwards on each beat: an explicit retreat.
            for n in range(15):
                x = int(W - ((t - 8.25) * (110 + n * 8) + n * 137) % (W + 190))
                y = 220 + (n % 6) * 59
                cv2.rectangle(frame, (x, y), (x + 34, y + 18), accent if n % 2 else (110, 136, 255), -1)
                if n % 3 == 0:
                    cv2.line(frame, (x + 34, y + 18), (x + 57, y + 31), light, 1, cv2.LINE_AA)
        else:
            p = ease((t - 10.43) / .5)
            cv2.circle(frame, (420, 338), int(62 + 62 * p), (236, 238, 226), -1, cv2.LINE_AA)
            for n in range(9):
                a = t * .9 + n * math.pi * 2 / 9
                x = int(420 + math.cos(a) * (118 + n % 3 * 20))
                y = int(340 + math.sin(a * 1.2) * (65 + n % 2 * 25))
                cv2.circle(frame, (x, y), 10 + n % 3, light, 2, cv2.LINE_AA)

    elif scene == 3:  # L06 search: sonar shrine is the action and the answer is absent.
        cv2.ellipse(frame, (W // 2, 350), (360, 245), 0, 180, 360, (42, 88, 106), -1, cv2.LINE_AA)
        for r in [105, 185, 270]:
            cv2.ellipse(frame, (W // 2, 390), (r, int(r * .55)), 0, 196, 344, light, 2, cv2.LINE_AA)
        for i in range(6):
            x = 110 + i * 215
            cv2.rectangle(frame, (x, 245 + (i % 2) * 25), (x + 25, 570), (58, 62, 75), -1)
            cv2.circle(frame, (x + 12, 280 + (i % 2) * 25), 7, accent, -1)
        # The scan target keeps moving just beyond the last ring.
        tx = int(720 + math.sin(t * 2.4) * 190)
        cv2.circle(frame, (tx, 307), 9, accent, 2, cv2.LINE_AA)

    elif scene == 4:  # L07 sea → L08 mountain: tide rises before pixel ridges resolve.
        for i in range(5):
            y = 630 - i * 78 - int((t - 16) * 46)
            cv2.ellipse(frame, (W // 2, y), (600 + i * 80, 120), 0, 180, 360, light, 3, cv2.LINE_AA)
        for i in range(7):
            x = int(i * 195 + math.sin(t + i) * 25)
            translucent_poly(frame, [(x, H), (x + 170, H), (x + 105, 105), (x - 60, 105)], light, .07)
        if t >= 18.0:
            p = ease((t - 18.0) / .55)
            for j in range(-1, 7):
                x = j * 250 - int((t - 18) * 48)
                base, peak = 570, int(570 - 185 * p - (j % 2) * 34)
                pts = [(x, base), (x + 124, peak), (x + 250, base)]
                translucent_poly(frame, pts, (128, 105, 158), .46)
                cv2.polylines(frame, [np.array(pts, np.int32)], False, light, 2, cv2.LINE_AA)

    elif scene == 5:  # L09 distance reprise: ink shores cannot meet across the white gap.
        paper = frame.copy(); paper[:] = (196, 184, 147)
        cv2.addWeighted(paper, .28, frame, .72, 0, frame)
        left = [(0, 720), (0, 358), (205, 290), (472, 620), (472, 720)]
        right = [(W, 720), (W, 352), (W - 228, 275), (W - 470, 620), (W - 470, 720)]
        translucent_poly(frame, left, (98, 82, 48), .56)
        translucent_poly(frame, right, (98, 82, 48), .56)
        cv2.polylines(frame, [np.array(left[:4], np.int32)], False, (65, 52, 35), 4, cv2.LINE_AA)
        cv2.polylines(frame, [np.array(right[:4], np.int32)], False, (65, 52, 35), 4, cv2.LINE_AA)
        p = ease((t - 20) / 3.6)
        for y in range(318, 565, 32):
            cv2.line(frame, (486, y), (int(794 + p * 85), y + 12), (243, 237, 198), 1, cv2.LINE_AA)
        for i in range(46):
            x = int((i * 97) % W); y = int(138 + (i * 47) % 450)
            cv2.circle(frame, (x, y), 1 + i % 3, (74, 67, 43), -1)

    elif scene == 6:  # L10 retreat → L11 memory: rejected colour becomes a moon archive.
        if t < 26.13:
            for n in range(13):
                x = int(W - ((t - 24) * (100 + n * 7) + n * 154) % (W + 190))
                y = 190 + (n % 6) * 67
                cv2.rectangle(frame, (x, y), (x + 37, y + 22), accent if n % 2 else (117, 92, 211), -1)
            cv2.circle(frame, (W // 2, 332), 90, (105, 72, 126), -1, cv2.LINE_AA)
        else:
            cv2.circle(frame, (W // 2, 332), 176, (226, 232, 240), -1, cv2.LINE_AA)
            cv2.circle(frame, (W // 2 + 66, 285), 160, deep, -1, cv2.LINE_AA)
            for i in range(13):
                a = t * .72 + i * math.pi * 2 / 13
                x = int(W // 2 + math.cos(a) * (275 + i % 3 * 27))
                y = int(414 + math.sin(a * 1.13) * (110 + i % 2 * 34))
                cv2.circle(frame, (x, y), 18, (250, 246, 235), 2, cv2.LINE_AA)
                cv2.circle(frame, (x - 5, y - 6), 4, light, -1, cv2.LINE_AA)

    else:  # L12 search: neon current closes the loop through a graphic climax.
        for i in range(8):
            a = t * .85 + i * .7
            r = 82 + i * 43
            cv2.ellipse(frame, (W // 2, 382), (r, int(r * .48)), int(math.sin(a) * 22), 35, 330, light, 2, cv2.LINE_AA)
        for x in range(-100, W + 160, 95):
            cv2.line(frame, (W // 2, 255), (x + int(math.sin(t * 2) * 20), H), (154, 88, 217), 1, cv2.LINE_AA)

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
    (10.43, 'pixel',   (760, 520), 556, 'wistful'),
    (12.43, 'pixel',   (648, 520), 570, 'seeking'),
    (15.82, 'cel',     (646, 520), 570, 'relieved'),
    (18.12, 'cel',     (646, 520), 570, 'hopeful'),
    (20.12, 'ink',     (642, 522), 565, 'distant'),
    (24.03, 'hands',   (645, 521), 565, 'retreat'),
    (26.13, 'hands',   (645, 521), 565, 'wistful'),
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
    # A lyric is a visual objective, not just a title: its motif advances while
    # the recognition card is on screen.
    lyric_motif(frame, t, lyric_at(t), palette)
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
