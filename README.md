# 8-Bit Explains

Short 8-bit style science explainers for Instagram Reels and TikTok (1080x1920, 9:16, ~50 s).

Every part of the pipeline is free and allows commercial use, and every episode is written
from public-domain or openly licensed sources, so the channel can be monetized later without
licence trouble.

## Pipeline

```
episodes/<n>-<slug>.json   script, sources, caption (written by hand / by Claude)
        |
tools/tts.py               Kokoro TTS -> remotion/public/<id>/scene-N.wav + timing manifest
tools/chiptune.py          original chiptune music + SFX synthesized from code
        |
remotion/                  React/Remotion template -> out/<id>.mp4
```

```bash
./build.sh episodes/001-super-el-nino.json
```

The first run creates `tools/.venv`, downloads the Kokoro model (~350 MB) into `models/` and runs
`npm install`. Preview and tweak with `cd remotion && npx remotion studio`.

## Licences of everything used

| Part | Tool | Licence |
| --- | --- | --- |
| Voice | [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) via [kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx) | Apache 2.0 / MIT |
| Music and SFX | `tools/chiptune.py` (synthesized, no samples) | our own work |
| Video | [Remotion](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md) | free for individuals and companies of up to 3 people |
| Font | Press Start 2P | SIL Open Font License |
| Art | pixel sprites drawn in code (`remotion/src/pixel.tsx`) | our own work |

Do not swap in voices or music with NC (non-commercial) or SA terms, for example Piper's
Turkish `dfki` voice (CC BY-NC-SA), macOS `say` voices or the Instagram music library.

## Content rules

1. Facts are free, wording is not. Every script is written from scratch; never copy or closely
   paraphrase an article.
2. Take facts only from public-domain or CC BY sources: US federal agencies (NASA, NOAA, USGS,
   NIH), CC BY 4.0 papers and OpenStax. Use Wikipedia (CC BY-SA) for checking facts only.
3. Never use Evrim Ağacı: its terms forbid turning articles into videos or scripts.
4. List the sources in the post caption, and add "Not affiliated with or endorsed by ..." when
   naming an agency. No agency logos.
5. Topic choice: this week's science story with real attention (news coverage, Wikipedia
   pageviews from users rather than bots) that also has a public-domain primary source.

## Layout and safe zones

Instagram and TikTok draw their UI over the top bar, the right-hand action rail and the bottom
caption area. Everything important stays inside `SAFE` in `remotion/src/theme.ts`
(x 60-920, y 220-1440).

## Adding an episode

1. Add `episodes/00N-slug.json` (copy `001-super-el-nino.json`; scene `visual` picks the art).
2. Import its generated manifest in `remotion/src/Root.tsx`.
3. Run `./build.sh episodes/00N-slug.json`.
