"""Automatic QA for a rendered episode: format, loudness, voice/background balance and a contact sheet."""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from PIL import Image, ImageDraw
from scipy.signal import resample_poly

ROOT = Path(__file__).resolve().parent.parent
REMOTION = ROOT / "remotion" / "node_modules" / ".bin" / "remotion"

LUFS_RANGE = (-15.0, -13.0)
TRUE_PEAK_MAX = -1.0
DURATION_RANGE = (45.0, 60.0)
MIN_SPEECH_OVER_GAP_DB = 6.0
SHEET_EVERY_S = 2.5


def tool(name: str, *args: str) -> str:
    return subprocess.run([str(REMOTION), name, *args], cwd=ROOT / "remotion", capture_output=True, text=True, check=True).stdout


def probe(mp4: Path) -> dict:
    out = json.loads(tool("ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_type,codec_name,width,height,r_frame_rate", "-of", "json", str(mp4)))
    video = next(s for s in out["streams"] if s["codec_type"] == "video")
    audio = next((s for s in out["streams"] if s["codec_type"] == "audio"), {})
    num, den = video["r_frame_rate"].split("/")
    return {
        "width": video["width"],
        "height": video["height"],
        "fps": int(num) / int(den),
        "video": video["codec_name"],
        "audio": audio.get("codec_name"),
        "duration": float(out["format"]["duration"]),
    }


def db(x: float) -> float:
    return 20 * np.log10(max(x, 1e-9))


def rms_db(audio: np.ndarray) -> float:
    return db(float(np.sqrt(np.mean(audio**2)))) if len(audio) else -120.0


def true_peak_db(audio: np.ndarray) -> float:
    return db(float(np.abs(resample_poly(audio, 4, 1, axis=0)).max()))


def speech_mask(manifest: dict, n: int, sr: int) -> np.ndarray:
    mask = np.zeros(n, dtype=bool)
    fps, start = manifest["fps"], 0
    for scene in manifest["scenes"]:
        for line in scene["lines"]:
            a = int((start + line["startFrame"]) / fps * sr)
            b = int((start + line["endFrame"]) / fps * sr)
            mask[a:min(b, n)] = True
        start += scene["durationInFrames"]
    return mask


def scene_balance(manifest: dict, mono: np.ndarray, sr: int) -> list[dict]:
    mask = speech_mask(manifest, len(mono), sr)
    rows, start = [], 0
    for i, scene in enumerate(manifest["scenes"]):
        a = int(start / manifest["fps"] * sr)
        b = min(len(mono), int((start + scene["durationInFrames"]) / manifest["fps"] * sr))
        seg, m = mono[a:b], mask[a:b]
        speech, gap = rms_db(seg[m]), rms_db(seg[~m])
        rows.append({"scene": i, "visual": scene["visual"], "speech_db": speech, "gap_db": gap, "ok": speech - gap >= MIN_SPEECH_OVER_GAP_DB})
        start += scene["durationInFrames"]
    return rows


def grid(count: int, cols: int) -> tuple[int, int]:
    return cols, (count + cols - 1) // cols


def contact_sheet(mp4: Path, duration: float, out: Path, cols: int = 7, size: tuple[int, int] = (270, 480)) -> None:
    times = np.arange(SHEET_EVERY_S / 2, duration, SHEET_EVERY_S)
    with tempfile.TemporaryDirectory() as tmp:
        frames = []
        for k, t in enumerate(times):
            path = Path(tmp) / f"f{k:03d}.png"
            tool("ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", f"{t:.2f}", "-i", str(mp4), "-frames:v", "1", "-update", "1", str(path))
            frames.append((t, Image.open(path).convert("RGB").resize(size, Image.NEAREST)))
        c, r = grid(len(frames), cols)
        sheet = Image.new("RGB", (c * size[0], r * size[1]), (20, 18, 28))
        draw = ImageDraw.Draw(sheet)
        for k, (t, im) in enumerate(frames):
            x, y = (k % cols) * size[0], (k // cols) * size[1]
            sheet.paste(im, (x, y))
            draw.text((x + 6, y + 6), f"{t:.1f}s", fill=(255, 255, 0))
        sheet.save(out)


def main(mp4_path: str, manifest_path: str) -> int:
    mp4, manifest = Path(mp4_path), json.loads(Path(manifest_path).read_text())
    ep = manifest["id"]
    info = probe(mp4)
    with tempfile.TemporaryDirectory() as tmp:
        wav = Path(tmp) / "a.wav"
        tool("ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(mp4), "-vn", "-ac", "2", "-ar", "48000", str(wav))
        audio, sr = sf.read(wav)
    lufs = pyln.Meter(sr).integrated_loudness(audio)
    peak = true_peak_db(audio)
    balance = scene_balance(manifest, audio.mean(axis=1), sr)

    checks = [
        ("format 1080x1920 @30 fps, h264 + aac", info["width"] == 1080 and info["height"] == 1920 and round(info["fps"]) == 30 and info["video"] == "h264" and info["audio"] == "aac"),
        (f"duration {info['duration']:.1f}s in {DURATION_RANGE}", DURATION_RANGE[0] <= info["duration"] <= DURATION_RANGE[1]),
        (f"loudness {lufs:.1f} LUFS in {LUFS_RANGE}", LUFS_RANGE[0] <= lufs <= LUFS_RANGE[1]),
        (f"true peak {peak:.1f} dBTP below {TRUE_PEAK_MAX}", peak < TRUE_PEAK_MAX),
        (f"voice >= {MIN_SPEECH_OVER_GAP_DB:.0f} dB over background in every scene", all(r["ok"] for r in balance)),
    ]
    sheet = mp4.with_name(f"{ep}-contact.png")
    contact_sheet(mp4, info["duration"], sheet)

    lines = [f"# QA {ep}", "", *[f"- [{'x' if ok else ' '}] {name}" for name, ok in checks], "", "| scene | visual | speech dB | gap dB | ok |", "|---|---|---|---|---|"]
    lines += [f"| {r['scene']} | {r['visual']} | {r['speech_db']:.1f} | {r['gap_db']:.1f} | {'yes' if r['ok'] else 'NO'} |" for r in balance]
    lines += ["", f"Contact sheet: {sheet.name}. Now do the by-eye half of docs/style/review-checklist.md."]
    report = mp4.with_name(f"{ep}-qa.md")
    report.write_text("\n".join(lines) + "\n")
    print("\n".join(lines))
    return 0 if all(ok for _, ok in checks) else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1], sys.argv[2]))
