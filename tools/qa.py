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
FIRST_WORD_MAX_S = 0.35
WPM_RANGE = (160.0, 200.0)
LIFE_FPS = 1
LIFE_SIZE = (270, 480)
MOTION_MIN = 10.0
LUMA_MIN = 50.0
SCENE_LUMA_MIN = 30.0
LOOP_MAX = 35.0
SHEET_EVERY_S = 2.5
HOLD_FPS = 2
HOLD_CROP = (0, 0, 1080, 1180)
HOLD_CELLS = (45, 49)
HOLD_CHANGE = 0.20
HOLD_WARN_S = 3.0
HOLD_FAIL_S = 4.0
MIN_LINE_TOKENS = 20


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


def script_checks(manifest: dict) -> list[tuple[str, bool]]:
    """Retention rules (learnings L15) and the aftermath beat (L11) that can be read off the manifest."""
    fps, scenes = manifest["fps"], manifest["scenes"]
    first = scenes[0]["lines"][0]["startFrame"] / fps
    lines = [l for s in scenes for l in s["lines"]]
    words = sum(len(l["text"].split()) for l in lines)
    voiced = sum(l["endFrame"] - l["startFrame"] for l in lines) / fps
    wpm = words / voiced * 60 if voiced else 0.0
    aftermath = len(scenes) >= 2 and scenes[-2].get("beat") == "aftermath"
    outro = scenes[-1]["lines"]
    last = outro[-1]["text"].rstrip()
    return [
        (f"first word at {first:.2f}s (<= {FIRST_WORD_MAX_S}s)", first <= FIRST_WORD_MAX_S),
        (f"speech rate {wpm:.0f} wpm in {WPM_RANGE}", WPM_RANGE[0] <= wpm <= WPM_RANGE[1]),
        ("aftermath scene right before the outro", aftermath),
        ("outro is one takeaway line, no follow line", len(outro) == 1 and "follow" not in last.lower()),
        ("last line ends open, so the first line completes it on replay", not last.endswith((".", "!", "?"))),
    ]


def short_lines(manifest: dict) -> list[str]:
    """Kokoro reads lines under about 20 phoneme tokens weakly (VOICES.md); tts.py stores the count."""
    return [l["text"] for s in manifest["scenes"] for l in s["lines"] if l.get("tokens", MIN_LINE_TOKENS) < MIN_LINE_TOKENS]


def motion_frames(mp4: Path) -> np.ndarray:
    """Grey frames at HOLD_FPS without the caption band, box-averaged so star and rain sparkle cancels out."""
    with tempfile.TemporaryDirectory() as tmp:
        tool("ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(mp4), "-r", str(HOLD_FPS), str(Path(tmp) / "f%04d.png"))
        return np.array([np.asarray(Image.open(p).convert("L").crop(HOLD_CROP).resize(HOLD_CELLS, Image.BOX), float) for p in sorted(Path(tmp).glob("f*.png"))])


def life_frames(mp4: Path) -> np.ndarray:
    """Whole grey frames at 1 fps and 270x480, the scale competitor-shorts.md measured on."""
    with tempfile.TemporaryDirectory() as tmp:
        tool("ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(mp4), "-r", str(LIFE_FPS), str(Path(tmp) / "f%04d.png"))
        return np.array([np.asarray(Image.open(p).convert("L").resize(LIFE_SIZE, Image.BOX), float) for p in sorted(Path(tmp).glob("f*.png"))])


def life_stats(frames: np.ndarray, scene_starts_s: list[float], fps: float = LIFE_FPS) -> dict:
    """Mean frame-to-frame change, mean brightness, the darkest scene's brightness and the loop gap (L26, L30)."""
    t = np.arange(len(frames)) / fps
    scenes = [frames[(t >= a) & (t < b)].mean() for a, b in zip(scene_starts_s, [*scene_starts_s[1:], np.inf]) if ((t >= a) & (t < b)).any()]
    return {
        "motion": float(np.abs(np.diff(frames, axis=0)).mean()) if len(frames) > 1 else 0.0,
        "luma": float(frames.mean()),
        "darkest_scene": float(min(scenes)),
        "loop": float(np.abs(frames[-1] - frames[0]).mean()),
    }


def holds(frames: np.ndarray, fps: float = HOLD_FPS, change: float = HOLD_CHANGE) -> np.ndarray:
    """Seconds each frame's picture lasts before a later frame differs from it; per-frame normalising ignores flashes."""
    z = (frames - frames.mean(axis=(1, 2), keepdims=True)) / (frames.std(axis=(1, 2), keepdims=True) + 1e-6)
    out = np.zeros(len(z))
    for t in range(len(z)):
        k = t
        while k + 1 < len(z) and np.abs(z[k + 1] - z[t]).mean() < change:
            k += 1
        out[t] = (k - t) / fps
    return out


def long_holds(h: np.ndarray, until_s: float, fps: float = HOLD_FPS, warn_s: float = HOLD_WARN_S) -> list[tuple[float, float]]:
    """(start, seconds) of each still stretch of warn_s or more that starts before until_s (the save point is exempt)."""
    length = [min(h[t], until_s - t / fps) for t in range(len(h)) if t / fps < until_s]
    out, t = [], 0
    while t < len(length):
        if length[t] < warn_s:
            t += 1
            continue
        end = t + int(length[t] * fps)
        best = max(range(t, min(end, len(length) - 1) + 1), key=lambda k: length[k])
        out.append((best / fps, length[best]))
        t = best + int(length[best] * fps) + 1
    return out


def grid(count: int, cols: int) -> tuple[int, int]:
    return cols, (count + cols - 1) // cols


def sheet_times(duration: float) -> np.ndarray:
    """Sample times for the contact sheet; a seek into the last 0.1 s can land past the final frame."""
    return np.arange(SHEET_EVERY_S / 2, duration - 0.1, SHEET_EVERY_S)


def contact_sheet(mp4: Path, duration: float, out: Path, cols: int = 7, size: tuple[int, int] = (270, 480)) -> None:
    times = sheet_times(duration)
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
    outro_s = sum(s["durationInFrames"] for s in manifest["scenes"][:-1]) / manifest["fps"]
    h = holds(motion_frames(mp4))
    stills = long_holds(h, outro_s)
    longest = max((min(d, outro_s - t / HOLD_FPS) for t, d in enumerate(h) if t / HOLD_FPS < outro_s), default=0.0)
    weak = short_lines(manifest)
    starts = np.cumsum([0, *[s["durationInFrames"] for s in manifest["scenes"][:-1]]]) / manifest["fps"]
    life = life_stats(life_frames(mp4), list(starts))

    checks = [
        ("format 1080x1920 @30 fps, h264 + aac", info["width"] == 1080 and info["height"] == 1920 and round(info["fps"]) == 30 and info["video"] == "h264" and info["audio"] == "aac"),
        (f"duration {info['duration']:.1f}s in {DURATION_RANGE}", DURATION_RANGE[0] <= info["duration"] <= DURATION_RANGE[1]),
        (f"loudness {lufs:.1f} LUFS in {LUFS_RANGE}", LUFS_RANGE[0] <= lufs <= LUFS_RANGE[1]),
        (f"true peak {peak:.1f} dBTP below {TRUE_PEAK_MAX}", peak < TRUE_PEAK_MAX),
        (f"voice >= {MIN_SPEECH_OVER_GAP_DB:.0f} dB over background in every scene", all(r["ok"] for r in balance)),
        *script_checks(manifest),
        (f"no picture holds over {HOLD_FAIL_S:.0f}s before the outro (longest {longest:.1f}s)", longest <= HOLD_FAIL_S),
        (f"motion {life['motion']:.1f} >= {MOTION_MIN:.0f} (mean change per second)", life["motion"] >= MOTION_MIN),
        (f"brightness {life['luma']:.0f} >= {LUMA_MIN:.0f}, darkest scene {life['darkest_scene']:.0f} >= {SCENE_LUMA_MIN:.0f}", life["luma"] >= LUMA_MIN and life["darkest_scene"] >= SCENE_LUMA_MIN),
        (f"last frame returns to frame 0 (difference {life['loop']:.0f} <= {LOOP_MAX:.0f})", life["loop"] <= LOOP_MAX),
    ]
    sheet = mp4.with_name(f"{ep}-contact.png")
    contact_sheet(mp4, info["duration"], sheet)

    lines = [f"# QA {ep}", "", *[f"- [{'x' if ok else ' '}] {name}" for name, ok in checks], "", "| scene | visual | speech dB | gap dB | ok |", "|---|---|---|---|---|"]
    lines += [f"| {r['scene']} | {r['visual']} | {r['speech_db']:.1f} | {r['gap_db']:.1f} | {'yes' if r['ok'] else 'NO'} |" for r in balance]
    warnings = [f"picture holds {d:.1f}s from {t:.1f}s" for t, d in stills] + [f"short line, Kokoro may read it weakly: {text!r}" for text in weak]
    if warnings:
        lines += ["", "Warnings:", *[f"- {w}" for w in warnings]]
    lines += ["", f"Contact sheet: {sheet.name}. Now do the by-eye half of docs/style/review-checklist.md."]
    report = mp4.with_name(f"{ep}-qa.md")
    report.write_text("\n".join(lines) + "\n")
    print("\n".join(lines))
    return 0 if all(ok for _, ok in checks) else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1], sys.argv[2]))
