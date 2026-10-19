"""Level the generated stems so the final Remotion mix lands near -14 LUFS with the voice on top."""
import json
import sys
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
VOICE_LUFS = -14.3
MUSIC_LUFS = -20.0
SFX_PEAK = 0.3
CEILING = 0.85


def loudness(audio: np.ndarray, sr: int) -> float:
    return pyln.Meter(sr).integrated_loudness(audio.astype(np.float64))


def gain_to(audio: np.ndarray, sr: int, target_lufs: float) -> float:
    return 10 ** ((target_lufs - loudness(audio, sr)) / 20)


def soft_limit(audio: np.ndarray, ceiling: float = CEILING) -> np.ndarray:
    # Linear below half the ceiling, tanh knee above it, never exceeding the ceiling.
    knee = ceiling / 2
    out = audio.copy()
    over = np.abs(audio) > knee
    out[over] = np.sign(audio[over]) * (knee + (ceiling - knee) * np.tanh((np.abs(audio[over]) - knee) / (ceiling - knee)))
    return out


def lowpass(audio: np.ndarray, sr: int, cutoff: float) -> np.ndarray:
    a = np.exp(-2 * np.pi * cutoff / sr)
    out = np.empty_like(audio)
    acc = 0.0
    for i, x in enumerate(audio):
        acc = (1 - a) * x + a * acc
        out[i] = acc
    return out


def mix_voice(paths: list[Path]) -> None:
    clips = [sf.read(p) for p in paths]
    sr = clips[0][1]
    joined = np.concatenate([c for c, _ in clips])
    g = gain_to(joined, sr, VOICE_LUFS)
    for p, (c, _) in zip(paths, clips):
        sf.write(p, soft_limit(c * g).astype(np.float32), sr)
    print(f"voice: {loudness(joined, sr):.1f} LUFS -> gain {20 * np.log10(g):+.1f} dB")


def mix_music(path: Path) -> None:
    audio, sr = sf.read(path)
    g = gain_to(audio, sr, MUSIC_LUFS)
    sf.write(path, soft_limit(audio * g).astype(np.float32), sr)
    print(f"music: gain {20 * np.log10(g):+.1f} dB")


def mix_sfx(path: Path) -> None:
    audio, sr = sf.read(path)
    soft = lowpass(audio, sr, 4500)
    peak = np.abs(soft).max() or 1.0
    sf.write(path, (soft / peak * SFX_PEAK).astype(np.float32), sr)


def main(manifest_path: str) -> None:
    manifest = json.loads(Path(manifest_path).read_text())
    public = ROOT / "remotion" / "public"
    mix_voice([public / s["audio"] for s in manifest["scenes"]])
    mix_music(public / "sfx" / "music.wav")
    for p in sorted((public / "sfx").glob("*.wav")):
        if p.name != "music.wav":
            mix_sfx(p)
    print("sfx: low-passed and peak-normalised")


if __name__ == "__main__":
    main(sys.argv[1])
