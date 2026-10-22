#!/usr/bin/env python3
"""Render an original 15-second pixel-RPG lyric-animation-style sample.

Frames are authored on a 320x180 logical canvas and nearest-neighbour scaled
4x to 1280x720. The MP4 is intentionally silent; no source song or lyrics are
copied from the reference clips.

Requirements: Pillow and imageio-ffmpeg (see requirements-video.txt).
"""
from __future__ import annotations

import argparse
import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[1]
W, H = 320, 180
SCALE = 4
FPS = 30
SECONDS = 15
OUT_DEFAULT = ROOT / "renders" / "moonlight-post-office-pixel-rpg.mp4"
FONT_PATH = ROOT / "assets" / "fonts" / "NotoSansSC-pixel-rpg.ttf"

# Original narration/captions written for this sample; kept here so the
# bundled CJK font subset can be regenerated if the text changes.
FONT_TEXT = (
    "月光邮局一封迟到的信今晚替一颗星星送信越过沉睡的屋顶"
    "沿着微光前行把想念寄给还没到来的清晨愿你明天醒来仍有光"
    "任务完成明天见小邮差星邮差关卡等级PIXELSTORYDAYNEWQUESTLV"
    "0123456789·:，。！？」（）"
)

INK = (10, 14, 34)
NIGHT = (15, 23, 54)
BLUE = (31, 48, 93)
MID = (48, 75, 125)
CYAN = (82, 206, 220)
PALE = (221, 233, 231)
GOLD = (250, 202, 108)
PINK = (233, 138, 151)
ROSE = (191, 94, 121)


def clamp(x: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, x))


def smooth(x: float) -> float:
    x = clamp(x)
    return x * x * (3 - 2 * x)


def mix(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    t = clamp(t)
    return tuple(round(x + (y - x) * t) for x, y in zip(a, b))


def font(size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONT_PATH), size=size)


# Text is drawn after pixel upscaling so Chinese strokes remain readable while
# the art stays intentionally blocky, matching the reference clips' subtitle treatment.
TEXT_FONTS = {
    "hud": font(22),
    "tiny": font(18),
    "caption": font(32),
    "title": font(66),
    "subtitle": font(30),
    "end": font(54),
}


# Deterministic skyline blocks: each item is (x, width, height, shade, seed).
_RNG = random.Random(3407)
_BUILDINGS = []
for layer, count in ((0, 22), (1, 16)):
    x = -12
    for i in range(count):
        width = _RNG.randint(12, 25) if layer == 0 else _RNG.randint(15, 32)
        height = _RNG.randint(20, 59) if layer == 0 else _RNG.randint(15, 42)
        shade = _RNG.randint(0, 3)
        seed = _RNG.randint(0, 10000)
        _BUILDINGS.append((layer, x, width, height, shade, seed))
        x += width + _RNG.randint(2, 7)

_STARS = []
for _ in range(54):
    _STARS.append((_RNG.randrange(W), _RNG.randrange(5, 94), _RNG.choice((1, 1, 1, 2)), _RNG.randrange(40)))


def pixel_star(draw: ImageDraw.ImageDraw, x: int, y: int, size: int, color: tuple[int, int, int]) -> None:
    draw.rectangle((x - size, y - 1, x + size, y + 1), fill=color)
    draw.rectangle((x - 1, y - size, x + 1, y + size), fill=color)
    if size > 2:
        draw.rectangle((x - 1, y - 1, x + 1, y + 1), fill=(255, 244, 181))


def draw_sky(im: Image.Image, t: float, dawn: float) -> None:
    draw = ImageDraw.Draw(im)
    top = mix((9, 13, 37), (67, 91, 133), dawn)
    bottom = mix((30, 41, 83), (241, 157, 126), dawn)
    for y in range(0, 106, 4):
        p = y / 106
        color = mix(top, bottom, p)
        draw.rectangle((0, y, W, y + 3), fill=color)

    # Square stars twinkle on a fixed grid, so frames remain reproducible.
    for i, (x, y, size, phase) in enumerate(_STARS):
        visible = math.sin(t * 2.7 + phase) > -0.15
        if visible and dawn < 0.78:
            color = mix((137, 178, 220), (253, 226, 177), dawn)
            if i % 9 == 0:
                pixel_star(draw, x, y, size, color)
            else:
                draw.rectangle((x, y, x + size, y + size), fill=color)

    # Moon turns into the first dawn glow.
    moon_alpha = 1.0 - smooth((dawn - 0.2) / 0.7)
    if moon_alpha > 0.05:
        mx, my = 265, 31
        draw.rectangle((mx - 9, my - 9, mx + 9, my + 9), fill=(155, 171, 195))
        draw.rectangle((mx - 7, my - 10, mx + 8, my + 8), fill=(240, 222, 173))
        draw.rectangle((mx + 3, my - 7, mx + 8, my + 4), fill=mix((240, 222, 173), top, 0.7))
    if dawn > 0.18:
        sun_y = 93 - round(23 * smooth((dawn - 0.18) / 0.82))
        draw.rectangle((243, sun_y - 7, 259, sun_y + 7), fill=(255, 210, 139))
        draw.rectangle((247, sun_y - 11, 255, sun_y + 11), fill=(255, 222, 156))

    # A tiny shooting star marks the beginning of the delivery.
    if 2.2 <= t <= 4.7:
        p = smooth((t - 2.2) / 2.5)
        sx = int(-12 + 78 * p)
        sy = int(44 - 26 * p)
        c = (255, 230, 154)
        draw.line((sx - 15, sy + 5, sx, sy), fill=mix(c, top, 0.25), width=2)
        pixel_star(draw, sx, sy, 2, c)


def draw_skyline(draw: ImageDraw.ImageDraw, t: float, dawn: float) -> None:
    horizon = 105
    for layer in (0, 1):
        shift = int(t * (4 if layer == 0 else 2)) % 390
        for item_layer, raw_x, width, height, shade, seed in _BUILDINGS:
            if item_layer != layer:
                continue
            x = (raw_x - shift + 390) % 390 - 35
            y = horizon - height
            base = (16, 23, 51) if layer == 0 else (21, 31, 66)
            building = mix(base, (106, 87, 107), dawn * 0.65)
            draw.rectangle((x, y, x + width, horizon + 8), fill=building)
            draw.rectangle((x, y, x + width, y + 2), fill=mix(building, (69, 88, 139), 0.4))
            rng = random.Random(seed)
            for wy in range(y + 5, horizon - 2, 7):
                for wx in range(x + 3, x + width - 2, 6):
                    if rng.random() > 0.38:
                        lit = mix((230, 179, 103), (170, 208, 206), dawn * 0.55)
                        if rng.random() > 0.35:
                            lit = mix(lit, building, 0.5)
                        draw.rectangle((wx, wy, wx + 2, wy + 3), fill=lit)
            # Occasional rooftop antennas and signs create the game-like parallax.
            if seed % 3 == 0:
                draw.rectangle((x + width // 2, y - 5, x + width // 2 + 1, y), fill=(53, 77, 121))
                draw.rectangle((x + width // 2 - 2, y - 6, x + width // 2 + 3, y - 5), fill=(81, 167, 190))

    # Distant elevated railway and its signal lights.
    draw.rectangle((0, 101, W, 104), fill=(29, 42, 78))
    draw.rectangle((0, 104, W, 105), fill=(63, 89, 132))
    for x in (35, 115, 206, 286):
        draw.rectangle((x, 99, x + 2, 102), fill=(232, 128, 126))


def draw_ground(draw: ImageDraw.ImageDraw, t: float, dawn: float) -> None:
    ground = mix((12, 18, 42), (67, 56, 73), dawn * 0.75)
    draw.rectangle((0, 105, W, H), fill=ground)
    draw.rectangle((0, 105, W, 108), fill=(67, 89, 131))
    draw.rectangle((0, 108, W, 110), fill=(27, 37, 69))

    # Rooftop walkway and pixel reflections.
    draw.rectangle((0, 137, W, 180), fill=mix((17, 23, 46), (88, 63, 69), dawn * 0.5))
    draw.rectangle((0, 137, W, 140), fill=(86, 109, 150))
    draw.rectangle((0, 141, W, 143), fill=(30, 42, 77))
    for i in range(18):
        x = (i * 23 - int(t * 13)) % (W + 20)
        y = 149 + (i % 5) * 5
        width = 4 + ((i * 7) % 14)
        color = (40, 56, 91) if i % 2 else (58, 69, 102)
        draw.rectangle((x, y, x + width, y + 1), fill=mix(color, (173, 115, 111), dawn * 0.45))
    draw.rectangle((0, 174, W, 179), fill=(8, 12, 28))


def draw_mailbox(draw: ImageDraw.ImageDraw, t: float, dawn: float, glow: float) -> None:
    x, y = 257, 112
    pole = mix((60, 77, 115), (131, 97, 104), dawn * 0.6)
    draw.rectangle((x + 7, y + 15, x + 10, 141), fill=pole)
    draw.rectangle((x + 2, 140, x + 15, 142), fill=(32, 40, 67))
    body = (38, 73, 127) if glow < 0.2 else mix((38, 73, 127), (247, 185, 105), glow)
    draw.rectangle((x, y + 2, x + 17, y + 16), fill=(12, 19, 43))
    draw.rectangle((x + 1, y + 1, x + 16, y + 14), fill=body)
    draw.rectangle((x + 3, y + 4, x + 14, y + 6), fill=(92, 157, 192))
    draw.rectangle((x + 5, y + 8, x + 13, y + 9), fill=(17, 30, 59))
    draw.rectangle((x + 7, y + 9, x + 11, y + 10), fill=(241, 206, 135))
    if glow > 0.25:
        pixel_star(draw, x + 8, y + 11, 2, (255, 233, 163))
    # Small flag flips up as the letter arrives.
    flag = 0 if t < 10.7 else round(5 * smooth((t - 10.7) / 0.5))
    draw.rectangle((x + 16, y + 5 - flag, x + 19, y + 10 - flag), fill=(224, 117, 126))


def draw_character(draw: ImageDraw.ImageDraw, x: int, foot_y: int, t: float, moving: bool, carrying: bool) -> None:
    # The courier is an original, compact pixel sprite; one logical pixel
    # becomes a crisp 4x4 block in the delivered MP4.
    step = math.sin(t * 11.0) if moving else 0.0
    bob = round(abs(math.sin(t * 5.5)) * 1.3) if moving else 0
    y = foot_y - 23 - bob

    # Backpack and outline.
    draw.rectangle((x + 1, y + 9, x + 5, y + 17), fill=(13, 20, 43))
    draw.rectangle((x + 2, y + 10, x + 5, y + 16), fill=(42, 116, 142))
    draw.rectangle((x + 3, y + 12, x + 5, y + 14), fill=(80, 196, 194))

    # Hair silhouette, face and a few deliberately chunky details.
    draw.rectangle((x + 5, y + 1, x + 13, y + 9), fill=(13, 18, 37))
    draw.rectangle((x + 6, y + 3, x + 12, y + 8), fill=(232, 174, 145))
    draw.rectangle((x + 5, y + 2, x + 12, y + 4), fill=(28, 34, 66))
    draw.rectangle((x + 5, y + 5, x + 7, y + 8), fill=(28, 34, 66))
    draw.rectangle((x + 9, y + 5, x + 10, y + 5), fill=(15, 24, 50))
    draw.rectangle((x + 5, y + 1, x + 11, y + 2), fill=(44, 55, 91))
    draw.rectangle((x + 12, y + 4, x + 13, y + 7), fill=(44, 55, 91))

    # Coat and scarf.
    draw.rectangle((x + 4, y + 9, x + 13, y + 18), fill=(14, 20, 42))
    draw.rectangle((x + 5, y + 10, x + 12, y + 17), fill=(235, 184, 91))
    draw.rectangle((x + 8, y + 10, x + 10, y + 13), fill=(241, 222, 160))
    draw.rectangle((x + 10, y + 14, x + 12, y + 16), fill=(196, 119, 85))

    # Arms swing on alternate frames.
    arm_y = y + 12 + (1 if step > 0 else -1)
    draw.rectangle((x + 3, arm_y, x + 5, arm_y + 3), fill=(232, 174, 145))
    draw.rectangle((x + 12, y + 12 - (1 if step > 0 else -1), x + 14, y + 15), fill=(232, 174, 145))

    # Walking legs.
    left_leg = round(step * 2) if moving else 0
    right_leg = -left_leg
    draw.rectangle((x + 6, y + 17, x + 8, y + 21 + left_leg), fill=(29, 41, 76))
    draw.rectangle((x + 10, y + 17, x + 12, y + 21 + right_leg), fill=(29, 41, 76))
    draw.rectangle((x + 5, y + 21 + left_leg, x + 8, y + 22 + left_leg), fill=(236, 213, 163))
    draw.rectangle((x + 10, y + 21 + right_leg, x + 13, y + 22 + right_leg), fill=(236, 213, 163))

    if carrying:
        pixel_star(draw, x + 16, y + 13, 2, (255, 229, 139))


def draw_caption(draw: ImageDraw.ImageDraw, text: str) -> None:
    if not text:
        return
    x0, y0, x1, y1 = 15, 148, 305, 172
    draw.rectangle((x0, y0, x1, y1), fill=(8, 14, 35))
    draw.rectangle((x0, y0, x1, y0 + 1), fill=(111, 172, 198))
    draw.rectangle((x0, y1 - 1, x1, y1), fill=(54, 87, 133))
    draw.rectangle((x0, y0, x0 + 1, y1), fill=(111, 172, 198))
    draw.rectangle((x1 - 1, y0, x1, y1), fill=(54, 87, 133))
    # A tiny RPG dialogue marker; caption text is overlaid at full resolution.
    draw.rectangle((20, 157, 23, 160), fill=GOLD)


def draw_hud(draw: ImageDraw.ImageDraw, t: float) -> None:
    draw.rectangle((7, 6, 117, 18), fill=(9, 15, 37))
    draw.rectangle((7, 6, 117, 7), fill=(81, 134, 178))
    draw.rectangle((7, 17, 117, 18), fill=(44, 77, 125))
    draw.rectangle((271, 6, 312, 18), fill=(9, 15, 37))
    draw.rectangle((271, 6, 312, 7), fill=(81, 134, 178))

    # Three-step progress pips fill as the message is delivered.
    draw.rectangle((9, 24, 49, 31), fill=(9, 15, 37))
    progress = clamp(t / 12.5)
    for i in range(3):
        color = CYAN if progress >= (i + 1) / 3 else (47, 62, 92)
        draw.rectangle((34 + i * 5, 26, 37 + i * 5, 29), fill=color)


def caption_for(t: float) -> str:
    if 2.65 <= t < 5.25:
        return "今晚，替一颗星星送信。"
    if 5.25 <= t < 8.2:
        return "越过沉睡的屋顶，沿着微光前行。"
    if 8.2 <= t < 11.2:
        return "把想念，寄给还没到来的清晨。"
    if 11.2 <= t < 13.25:
        return "愿你明天醒来，仍有光。"
    return ""


def render_frame(t: float) -> Image.Image:
    dawn = smooth((t - 10.4) / 4.6)
    im = Image.new("RGB", (W, H), INK)
    draw_sky(im, t, dawn)
    draw = ImageDraw.Draw(im)
    draw_skyline(draw, t, dawn)
    draw_ground(draw, t, dawn)

    # Rooftop lamp pools brighten toward dawn.
    for x in (42, 155, 280):
        lamp = mix((46, 68, 110), (242, 163, 113), dawn * 0.7)
        draw.rectangle((x, 130, x + 2, 137), fill=lamp)
        draw.rectangle((x - 2, 136, x + 4, 137), fill=mix(lamp, (20, 28, 56), 0.4))

    # Small neon shop sign establishes the recurring place.
    draw.rectangle((68, 97, 113, 109), fill=(11, 17, 39))
    draw.rectangle((69, 98, 112, 108), fill=(26, 48, 83))
    draw.rectangle((70, 98, 111, 99), fill=(86, 159, 192))

    # A closed sky-mailbox waits on the far edge of the roof.
    delivery = smooth((t - 10.0) / 1.2)
    draw_mailbox(draw, t, dawn, delivery)

    # The courier walks toward the mailbox with a glowing star-letter.
    walk_p = smooth((t - 3.1) / 6.8)
    hero_x = round(35 + 196 * walk_p)
    is_walking = 3.3 <= t <= 9.85
    carrying = t < 9.9

    # A soft pixel glow follows the letter without blurring the pixel edges.
    if carrying:
        hx = hero_x + 16
        hy = 108 + round(math.sin(t * 7) * 2)
        glow_color = mix((50, 91, 139), (202, 142, 101), dawn)
        draw.rectangle((hx - 4, hy - 4, hx + 4, hy + 4), fill=glow_color)
        pixel_star(draw, hx, hy, 2, (255, 230, 149))

    draw_character(draw, hero_x, 140, t, is_walking, carrying)

    # The star-letter arcs from the courier's hand into the mailbox.
    if 9.7 <= t <= 11.25:
        p = smooth((t - 9.7) / 1.55)
        sx = round((35 + 196 * smooth((9.7 - 3.1) / 6.8)) + 14 + (258 - (35 + 196 * smooth((9.7 - 3.1) / 6.8) + 14)) * p)
        sy = round(111 - 20 * math.sin(math.pi * p))
        pixel_star(draw, sx, sy, 3, (255, 239, 171))
        if p > 0.6:
            for i in range(3):
                draw.rectangle((sx - 7 - i * 3, sy + 2 + i, sx - 5 - i * 3, sy + 3 + i), fill=(238, 193, 127))

    # Starburst around the mailbox once the letter lands.
    if delivery > 0.55:
        intensity = smooth((delivery - 0.55) / 0.45)
        for i, (dx, dy) in enumerate(((-10, -6), (10, -4), (-8, 8), (12, 7))):
            if math.sin(t * 9 + i) > -0.35:
                pixel_star(draw, 265 + dx, 123 + dy, 1, mix((245, 199, 133), (255, 241, 194), intensity))

    draw_hud(draw, t)
    draw_caption(draw, caption_for(t))

    # Opening chapter card.
    if t < 2.7:
        card = (54, 43, 266, 91)
        draw.rectangle(card, fill=(9, 15, 38))
        draw.rectangle((54, 43, 266, 45), fill=(91, 150, 188))
        draw.rectangle((54, 89, 266, 91), fill=(48, 81, 132))

    # Final quest-complete panel; the city warms as night gives way to dawn.
    if t >= 13.25:
        draw.rectangle((77, 49, 243, 103), fill=(10, 17, 38))
        draw.rectangle((77, 49, 243, 51), fill=(105, 170, 194))
        draw.rectangle((77, 101, 243, 103), fill=(73, 113, 155))

    # Keep the art pixelated, then add anti-aliased Chinese type at delivery size.
    im = im.resize((W * SCALE, H * SCALE), Image.Resampling.NEAREST)
    text = ImageDraw.Draw(im)
    text.text((48, 23), "DAY 01 · 星邮差", font=TEXT_FONTS["hud"], fill=(204, 221, 226))
    text.text((1114, 23), "LV 01", font=TEXT_FONTS["hud"], fill=(250, 202, 108))
    text.text((48, 96), "QUEST", font=TEXT_FONTS["tiny"], fill=(130, 166, 199))
    text.text((360, 399), "月光邮局", font=TEXT_FONTS["tiny"], fill=(221, 216, 167), anchor="mm")

    caption = caption_for(t)
    if caption:
        text.text((640, 640), caption, font=TEXT_FONTS["caption"], fill=(221, 233, 231), anchor="mm")

    if t < 2.7:
        text.text((640, 231), "月光邮局", font=TEXT_FONTS["title"], fill=(244, 221, 163), anchor="mm")
        text.text((640, 305), "一封迟到的信", font=TEXT_FONTS["subtitle"], fill=(196, 218, 226), anchor="mm")
        text.text((640, 341), "PIXEL STORY · 01", font=TEXT_FONTS["tiny"], fill=(116, 166, 194), anchor="mm")

    if t >= 13.25:
        text.text((640, 270), "任务完成", font=TEXT_FONTS["end"], fill=(255, 222, 148), anchor="mm")
        text.text((640, 349), "明天见 · 小邮差", font=TEXT_FONTS["subtitle"], fill=(205, 224, 225), anchor="mm")
    return im


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, default=OUT_DEFAULT, help="MP4 output path")
    parser.add_argument("--fps", type=int, default=FPS)
    parser.add_argument("--seconds", type=float, default=SECONDS)
    args = parser.parse_args()
    if args.fps <= 0 or args.seconds <= 0:
        parser.error("--fps and --seconds must be positive")
    if not FONT_PATH.is_file():
        raise SystemExit(f"Missing bundled CJK font: {FONT_PATH}")

    args.out.parent.mkdir(parents=True, exist_ok=True)
    total_frames = round(args.fps * args.seconds)
    writer = imageio_ffmpeg.write_frames(
        str(args.out),
        (W * SCALE, H * SCALE),
        fps=args.fps,
        codec="libx264",
        pix_fmt_in="rgb24",
        pix_fmt_out="yuv420p",
        quality=8,
        macro_block_size=16,
        ffmpeg_log_level="error",
        output_params=["-preset", "medium", "-movflags", "+faststart", "-an"],
    )
    writer.send(None)
    for i in range(total_frames):
        frame = render_frame(i / args.fps)
        writer.send(frame.tobytes())
        if (i + 1) % args.fps == 0 or i + 1 == total_frames:
            print(f"rendered {i + 1}/{total_frames} frames")
    writer.close()
    print(f"wrote silent {args.fps} fps video: {args.out}")


if __name__ == "__main__":
    main()
