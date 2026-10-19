"""Original 8-bit music and sound effects, synthesized from scratch (no samples, no third-party audio)."""
import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
SR = 44100
BPM = 132
STEP = 60 / BPM / 4

# Minor-key loop: i - VI - III - VII (Am - F - C - G), one bar each, 16 steps per bar.
BASS_ROOTS = ["A2", "F2", "C3", "G2"]
LEAD = [
    "A4", None, "C5", None, "E5", None, "C5", "A4", "B4", None, "C5", None, "E5", None, None, None,
    "A4", None, "C5", None, "F5", None, "E5", "C5", "A4", None, None, None, "C5", None, None, None,
    "G4", None, "C5", None, "E5", None, "G5", "E5", "D5", None, "C5", None, "E5", None, None, None,
    "D5", None, "B4", None, "G4", None, "B4", "D5", "E5", None, None, None, None, None, None, None,
]

NOTE_INDEX = {"C": -9, "D": -7, "E": -5, "F": -4, "G": -2, "A": 0, "B": 2}


def freq(note: str) -> float:
    semis = NOTE_INDEX[note[0]] + (int(note[-1]) - 4) * 12
    return 440.0 * 2 ** (semis / 12)


def pulse(f: float, dur: float, duty: float = 0.25) -> np.ndarray:
    t = np.arange(int(dur * SR)) / SR
    return np.where((t * f) % 1 < duty, 1.0, -1.0)


def triangle(f: float, dur: float) -> np.ndarray:
    t = np.arange(int(dur * SR)) / SR
    return 2 * np.abs(2 * ((t * f) % 1) - 1) - 1


def noise(dur: float, seed: int = 0) -> np.ndarray:
    return np.random.default_rng(seed).choice([-1.0, 1.0], int(dur * SR))


def env(x: np.ndarray, attack: float = 0.005, decay: float = 0.0) -> np.ndarray:
    n = len(x)
    e = np.ones(n)
    a = min(n, int(attack * SR))
    e[:a] = np.linspace(0, 1, a)
    if decay:
        e *= np.exp(-np.arange(n) / (decay * SR))
    r = min(n, int(0.01 * SR))
    e[n - r:] *= np.linspace(1, 0, r)
    return x * e


def place(track: np.ndarray, clip: np.ndarray, at: float) -> None:
    i = int(at * SR)
    if i >= len(track):
        return
    j = min(len(track), i + len(clip))
    track[i:j] += clip[: j - i]


def music(seconds: float) -> np.ndarray:
    bar = 16 * STEP
    out = np.zeros(int((seconds + 4 * bar + 1) * SR))
    t = 0.0
    while t < seconds:
        for b, root in enumerate(BASS_ROOTS):
            bar_t = t + b * bar
            for s in range(0, 16, 2):
                octave_up = root[0] + str(int(root[-1]) + (s // 2) % 2)
                place(out, 0.30 * env(triangle(freq(octave_up), STEP * 1.8)), bar_t + s * STEP)
            for s in range(16):
                note = LEAD[b * 16 + s]
                if note:
                    place(out, 0.12 * env(pulse(freq(note), STEP * 1.6), decay=0.25), bar_t + s * STEP)
                if s % 4 == 2:
                    place(out, 0.06 * env(noise(0.04, s), decay=0.015), bar_t + s * STEP)
        t += 4 * bar
    out = out[: int(seconds * SR)]
    fade = int(1.5 * SR)
    out[-fade:] *= np.linspace(1, 0, fade)
    return out


def sweep(f0: float, f1: float, dur: float, duty: float = 0.5) -> np.ndarray:
    n = int(dur * SR)
    f = np.geomspace(f0, f1, n)
    phase = np.cumsum(f) / SR
    return np.where(phase % 1 < duty, 1.0, -1.0)


def sfx() -> dict:
    coin = np.concatenate([env(pulse(freq("B5"), 0.07, 0.5)), env(pulse(freq("E6"), 0.25, 0.5), decay=0.1)])
    levelup = np.concatenate([env(pulse(freq(n), 0.07, 0.5)) for n in ["C5", "E5", "G5", "C6", "E6", "G6"]])
    blip = env(pulse(freq("A5"), 0.05, 0.5))
    thunder = env(noise(1.6, 7), attack=0.01, decay=0.5)
    thunder = np.convolve(thunder, np.ones(40) / 40, mode="same")
    zap = env(sweep(2400, 200, 0.25, 0.5), decay=0.1)
    save = np.concatenate([env(pulse(freq(n), 0.12, 0.5)) for n in ["G5", "C6", "E6"]] + [env(pulse(freq("G6"), 0.5, 0.5), decay=0.25)])
    return {"coin": coin, "levelup": levelup, "blip": blip, "thunder": thunder, "zap": zap, "save": save}


def main(manifest_path: str) -> None:
    manifest = json.loads(Path(manifest_path).read_text())
    total = sum(s["durationInFrames"] for s in manifest["scenes"]) / manifest["fps"]
    out_dir = ROOT / "remotion" / "public" / "sfx"
    out_dir.mkdir(parents=True, exist_ok=True)
    sf.write(ROOT / "remotion" / "public" / manifest["id"] / "music.wav", music(total).astype(np.float32), SR)
    for name, clip in sfx().items():
        sf.write(out_dir / f"{name}.wav", (0.5 * clip).astype(np.float32), SR)
    print(f"music {total:.1f}s + {len(sfx())} sfx -> {out_dir}")


if __name__ == "__main__":
    main(sys.argv[1])
