"""Voice an episode with Kokoro (Apache 2.0) and write the timing manifest Remotion reads."""
import json
import shutil
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
import espeakng_loader
from kokoro_onnx import EspeakConfig, Kokoro

ROOT = Path(__file__).resolve().parent.parent
FPS = 30
LEAD_S = 0.3
GAP_S = 0.2
TAIL_S = 0.45
OUTRO_PAUSE_S = 1.0


def gaps_after(scene: dict) -> list[float]:
    """Silence after each line; the outro holds a beat after the takeaway, before the follow line."""
    gaps = [GAP_S] * len(scene["vo"])
    if scene.get("beat") == "outro" and len(gaps) >= 2:
        gaps[-2] = OUTRO_PAUSE_S
    return gaps


def check_cover(cover: dict, scenes: list[dict]) -> None:
    """The cover frame must fall inside the named scene; Cover.tsx would otherwise throw at render time."""
    scene = next((s for s in scenes if s["visual"] == cover["scene"]), None)
    if scene is None:
        raise ValueError(f"cover scene {cover['scene']!r} is not in the episode")
    if not 0 <= round(cover["t"] * FPS) < scene["durationInFrames"]:
        raise ValueError(f"cover t {cover['t']}s is outside {cover['scene']!r} ({scene['durationInFrames'] / FPS:.1f}s)")


def espeak_data_path() -> str:
    # espeak-ng cannot read its data from a path containing spaces.
    target = Path.home() / ".cache" / "8bitexplains" / "espeak-ng-data"
    if not target.exists():
        shutil.copytree(espeakng_loader.get_data_path(), target)
    return str(target)


def main(episode_path: str) -> None:
    episode = json.loads(Path(episode_path).read_text())
    ep_id = episode["id"]
    audio_dir = ROOT / "remotion" / "public" / ep_id
    audio_dir.mkdir(parents=True, exist_ok=True)

    kokoro = Kokoro(
        str(ROOT / "models" / "kokoro-v1.0.onnx"),
        str(ROOT / "models" / "voices-v1.0.bin"),
        espeak_config=EspeakConfig(data_path=espeak_data_path()),
    )

    scenes = []
    for i, scene in enumerate(episode["scenes"]):
        sr = 24000
        chunks = [np.zeros(int(LEAD_S * sr), dtype=np.float32)]
        cursor = LEAD_S
        lines = []
        for text, gap in zip(scene["vo"], gaps_after(scene)):
            samples, sr = kokoro.create(text, voice=episode["voice"], speed=episode["speed"], lang="en-us")
            dur = len(samples) / sr
            lines.append({
                "text": text,
                "tokens": len(kokoro.tokenizer.phonemize(text, "en-us")),
                "startFrame": round(cursor * FPS),
                "endFrame": round((cursor + dur) * FPS),
            })
            chunks += [samples.astype(np.float32), np.zeros(int(gap * sr), dtype=np.float32)]
            cursor += dur + gap
        chunks.append(np.zeros(int(TAIL_S * sr), dtype=np.float32))
        audio = np.concatenate(chunks)
        name = f"scene-{i}.wav"
        sf.write(audio_dir / name, audio, sr)
        scenes.append({
            **scene,
            "audio": f"{ep_id}/{name}",
            "durationInFrames": int(np.ceil(len(audio) / sr * FPS)),
            "lines": lines,
        })
        print(f"scene {i}: {len(audio) / sr:.2f}s")

    manifest = {"id": ep_id, "title": episode["title"], "fps": FPS, "detail": episode.get("detail", 1), "scenes": scenes}
    if "cover" in episode:
        check_cover(episode["cover"], scenes)
        manifest["cover"] = episode["cover"]
    out = ROOT / "remotion" / "src" / "generated" / f"{ep_id}.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"total: {sum(s['durationInFrames'] for s in scenes) / FPS:.1f}s -> {out}")


if __name__ == "__main__":
    main(sys.argv[1])
