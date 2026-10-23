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


def composite(frame, sprite, center, height, opacity=1.0, scale=1.0):
    h = max(1, int(height * scale))
    w = max(1, int(sprite.shape[1] * h / sprite.shape[0]))
    layer = cv2.resize(sprite, (w, h), interpolation=cv2.INTER_LANCZOS4)
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
    x, y, w, h = 42, 42, int(405 * (0.6 + .4 * p)), 116
    overlay = frame.copy()
    cv2.rectangle(overlay, (x, y), (x + w, y + h), (12, 24, 57), -1)
    cv2.addWeighted(overlay, .89, frame, .11, 0, frame)
    cv2.rectangle(frame, (x, y), (x + max(6, int(13 + pulse(t) * 18)), y + h), light, -1)
    draw_text(frame, fonts, f'LYRIC {code}  ·  {t - start:04.1f}s', (x + 28, y + 29), 'small', tuple(light[::-1]))
    draw_text(frame, fonts, text, (x + 28, y + 76), 'lyric', (255, 250, 240))
    cue = CUES[min(len(CUES) - 1, int(t))]
    draw_text(frame, fonts, cue, (42, 675), 'body', (224, 239, 255))


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


def render_frame(t, sprites, fonts):
    scene = scene_at(t)
    # Saved pixel → cel → ink → neon treatments cycle across neutral standing shots.
    style_index = 0 if scene <= 3 else 1 if scene == 4 else 2 if scene == 5 else 3
    palette = PALETTES[style_index]
    frame = background(t, palette)
    bubbles(frame, t, palette)
    lyric = lyric_at(t)
    lyric_motif(frame, t, lyric, palette)

    bob = math.sin(t * 3.5) * 7 - pulse(t) * 8
    if scene == 0:
        composite(frame, sprites['standing'], (918, 500 + bob), 515, scale=1 + pulse(t) * .025)
        fish(frame, 180 + int((t * 55) % 230), 510, .9, palette[3])
    elif scene == 1:
        composite(frame, sprites['laptop'], (760, 500 + bob), 485, scale=1 + pulse(t) * .02)
        fish(frame, 180 + int((t * 45) % 760), 260, .65, palette[2])
    elif scene == 2:
        composite(frame, sprites['hands'], (920, 510 + bob), 505, scale=1 + pulse(t) * .03)
    elif scene == 3:
        composite(frame, sprites['pixel'], (675, 515 + bob), 500, scale=1 + pulse(t) * .03)
    elif scene == 4:
        composite(frame, sprites['cel'], (670, 525 + bob), 505, scale=1 + pulse(t) * .03)
    elif scene == 5:
        composite(frame, sprites['ink'], (670, 520 + bob), 505, scale=1 + pulse(t) * .03)
    elif scene == 6:
        composite(frame, sprites['hands'], (650, 525 + bob), 520, scale=1 + pulse(t) * .03)
    else:
        composite(frame, sprites['neon'], (660, 510 + bob), 530, scale=1 + pulse(t) * .04)

    lyric_card(frame, fonts, t, lyric, palette)
    title_end(frame, fonts, t, palette)
    return frame


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
