#!/usr/bin/env python3
"""Create a beat-cut crossover edit using only footage/audio already in this repo.

Picture source: the Day-0 Whale Girl video. Music source: the existing AAC track
from the short Douyin MV with the bionic puppy. There is no new character, story,
lyric or generated visual. The source scenes are re-ordered into 4/4 bars and
receive alternating color treatments so the Whale Girl stays recognizable.

Requirements: Pillow and imageio-ffmpeg (see requirements-video.txt).
"""
from __future__ import annotations

import argparse
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageOps
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[1]
PICTURE_SOURCE = ROOT / "42868804351-1-192.mp4"
MUSIC_SOURCE = ROOT / "每天每天的抖音 - 抖音_6.mp4"
OUT_DEFAULT = ROOT / "renders" / "whale-girl-beatcut.mp4"

WIDTH, HEIGHT = 1280, 720
FPS = 30
DURATION = 15.0
BPM = 158.0
BEAT_SECONDS = 60.0 / BPM
BAR_SECONDS = 4.0 * BEAT_SECONDS
# The local AAC track has a ~0.38s pulse (about 158 BPM double-time / 79 BPM
# half-time). RMS-envelope analysis places its first strong pulse at ~0.34s;
# trimming there makes the montage start on the pulse.
AUDIO_PHASE_SECONDS = 0.34

# Existing source-footage windows (seconds), in story order. Each bar uses a
# 1:1 slice from the Whale Girl MV; source footage carries the original labels.
SOURCE_STARTS = [4.8, 10.8, 18.8, 25.8, 34.0, 42.8, 50.8, 58.0, 65.2, 78.5]


def tint(image: Image.Image, color: tuple[int, int, int], amount: float) -> Image.Image:
    overlay = Image.new("RGB", image.size, color)
    return Image.blend(image, overlay, amount)


def style_frame(image: Image.Image, style: int, beat_phase: float) -> Image.Image:
    """Apply one of five legible, distinct treatments without changing content."""
    if style == 0:  # deep-sea anime, cooler and more luminous
        frame = ImageEnhance.Color(image).enhance(1.14)
        frame = ImageEnhance.Contrast(frame).enhance(1.05)
        frame = tint(frame, (12, 77, 137), 0.10)
    elif style == 1:  # cel-anime poster / clean ink edges
        poster = ImageOps.posterize(image, 4)
        edges = image.filter(ImageFilter.EDGE_ENHANCE)
        frame = Image.blend(poster, edges, 0.15)
        frame = ImageEnhance.Color(frame).enhance(1.18)
        frame = tint(frame, (27, 100, 153), 0.08)
    elif style == 2:  # warm archival film with restrained scanlines
        gray = ImageOps.grayscale(image)
        warm = ImageOps.colorize(gray, black="#122442", white="#F1C99A").convert("RGB")
        frame = Image.blend(image, warm, 0.46)
        frame = ImageEnhance.Contrast(frame).enhance(1.10)
        layer = Image.new("RGBA", image.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(layer)
        for y in range(0, HEIGHT, 8):
            draw.line((0, y, WIDTH, y), fill=(9, 16, 31, 18), width=1)
        frame = Image.alpha_composite(frame.convert("RGBA"), layer).convert("RGB")
    elif style == 3:  # cyan / violet split-channel comic print
        r, g, b = image.split()
        r = ImageChops.offset(r, 3, 0)
        b = ImageChops.offset(b, -3, 0)
        frame = Image.merge("RGB", (r, g, b))
        frame = ImageOps.posterize(frame, 5)
        frame = ImageEnhance.Color(frame).enhance(1.28)
        frame = tint(frame, (62, 42, 134), 0.08)
    else:  # return to the source's blue palette for the closing cards
        frame = ImageEnhance.Color(image).enhance(1.08)
        frame = ImageEnhance.Contrast(frame).enhance(1.07)
        frame = tint(frame, (13, 62, 121), 0.12)

    # Two-frame cyan flash on the downbeat, not a new caption or scene.
    flash = 0.12 * max(0.0, 1.0 - beat_phase / 0.075)
    if flash > 0.0:
        frame = tint(frame, (189, 244, 255), flash)
    return frame


def crop_punch(image: Image.Image, phase: float) -> Image.Image:
    """Small beat-synchronized camera punch; retain the original frame layout."""
    punch = max(0.0, 1.0 - phase / 0.14) * 0.018
    if punch <= 0.001:
        return image
    scale = 1.0 + punch
    crop_w, crop_h = round(WIDTH / scale), round(HEIGHT / scale)
    left = (WIDTH - crop_w) // 2
    top = (HEIGHT - crop_h) // 2
    return image.crop((left, top, left + crop_w, top + crop_h)).resize(
        (WIDTH, HEIGHT), Image.Resampling.LANCZOS
    )


def extract_music(ffmpeg: str, out_wav: Path) -> None:
    command = [
        ffmpeg, "-y", "-hide_banner", "-loglevel", "error",
        "-i", str(MUSIC_SOURCE), "-ss", str(AUDIO_PHASE_SECONDS),
        "-t", str(DURATION), "-map", "0:a:0", "-vn",
        "-ac", "2", "-ar", "44100", "-c:a", "pcm_s16le", str(out_wav),
    ]
    subprocess.run(command, check=True)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, default=OUT_DEFAULT, help="MP4 output path")
    args = parser.parse_args()
    for source in (PICTURE_SOURCE, MUSIC_SOURCE):
        if not source.is_file():
            raise SystemExit(f"Missing source video: {source}")
    args.out.parent.mkdir(parents=True, exist_ok=True)
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()

    reader = imageio_ffmpeg.read_frames(str(PICTURE_SOURCE), pix_fmt="rgb24")
    video_meta = next(reader)
    source_fps = float(video_meta["fps"])
    source_width, source_height = video_meta["size"]
    if (source_width, source_height) != (WIDTH, HEIGHT):
        raise SystemExit(f"Unexpected picture size: {source_width}x{source_height}")

    total_frames = round(FPS * DURATION)
    current_source_frame = -1
    frame_bytes: bytes | None = None
    with tempfile.TemporaryDirectory(prefix="whale-girl-beatcut-") as temp_dir:
        audio_path = Path(temp_dir) / "music.wav"
        extract_music(ffmpeg, audio_path)
        writer = imageio_ffmpeg.write_frames(
            str(args.out),
            (WIDTH, HEIGHT),
            fps=FPS,
            codec="libx264",
            pix_fmt_in="rgb24",
            pix_fmt_out="yuv420p",
            quality=8,
            macro_block_size=16,
            ffmpeg_log_level="error",
            audio_path=str(audio_path),
            audio_codec="aac",
            output_params=["-preset", "medium", "-movflags", "+faststart"],
        )
        writer.send(None)
        try:
            for i in range(total_frames):
                t = i / FPS
                bar = min(int(t / BAR_SECONDS), len(SOURCE_STARTS) - 1)
                bar_start = bar * BAR_SECONDS
                phase = t - bar_start
                source_t = SOURCE_STARTS[bar] + phase
                target_source_frame = round(source_t * source_fps)
                while current_source_frame < target_source_frame:
                    frame_bytes = next(reader)
                    current_source_frame += 1
                if frame_bytes is None:
                    raise RuntimeError("Could not decode a source frame")

                frame = Image.frombytes("RGB", (WIDTH, HEIGHT), frame_bytes)
                # Change grade every two bars; the original Whale Girl footage
                # and its embedded Chinese labels remain the source content.
                style = min(bar // 2, 4)
                frame = style_frame(frame, style, phase)
                frame = crop_punch(frame, phase)
                writer.send(frame.tobytes())
                if (i + 1) % FPS == 0 or i + 1 == total_frames:
                    print(f"rendered {i + 1}/{total_frames} frames")
        finally:
            writer.close()
            reader.close()
    print(f"wrote beat-cut remix: {args.out}")
    print(f"picture: {PICTURE_SOURCE.name}; music: {MUSIC_SOURCE.name}; estimated {BPM:.0f} BPM")


if __name__ == "__main__":
    main()
