# Style guide (v2 target)

## Look: "Kurzgesagt, but 8-bit"

- **One camera journey.** An episode is one continuous move through one world (for example
  space, then the planet, then the ocean surface, then underwater), not a slideshow of cards.
  Scenes hand over with a zoom, dive or pan, never a hard cut to a new box.
- **Depth inside the pixels.** Every shot has at least three layers (far, mid, near) that move
  at different speeds. Far layers are hazier and bluer, near layers darker and bigger.
  3D objects (planets, spheres, Mode-7 planes) are shaded with a light direction, a 4-6 step
  colour ramp and ordered (Bayer) dithering, plus a rim light on the dark side.
- **Light and glow.** Hot or important things glow (dithered halo, bloom-like rim). Light rays
  under water, sun on the horizon.
- **Visual metaphors.** Explain with things you can see happen (warm water physically sloshing,
  a fever thermometer on a planet), not with labels and boxes.
- **Constant life.** Something moves or changes every 2-3 seconds; nothing is ever fully still.
- **Mascot.** A small pixel bird reacts to what happens (flies, points, sweats, cheers).
- **Palette.** Deep navy/purple backgrounds, saturated accents (cyan, magenta, orange, yellow).
  Keep one palette per episode and reuse colour meaning (orange/red = warm, cyan/blue = cold).

## Frame and layout (1080x1920, 9:16)

- Art is full-bleed: it fills the whole frame, including behind the app UI zones.
- Text and key subjects stay inside the safe zone and are centred horizontally:
  x 90-990, y 220-1440. Nothing important below y 1440 (captions/buttons of the apps) or in the
  right-hand 120 px rail.
- Logical pixel canvas 180x320; new episodes use `"detail": 2` (360x640 physical, 3 px on
  screen, see learnings L14), nearest-neighbour. Text uses Press Start 2P.

## Captions

- No caption box. Centred, outlined text, 3-7 words on screen at a time, current word
  highlighted. Positioned around y 1250-1420.
- Headline per scene: one short line, centred, near the top of the safe zone.

## Audio

- Voice: Kokoro `am_michael`, speed 1.18-1.2 (episodes 001-004 used 1.08).
- Target final loudness about -14 LUFS integrated, true peak below -1 dBTP.
- Music 15-18 dB under the voice while it speaks (ducked), rising between lines.
- SFX are seasoning: short, soft, at least 10 dB under the voice, never on top of a word.

## Pacing

- 55-60 s (60 s hard maximum) so the causal chain fits (learnings L16). Follow the
  second-by-second blueprint in docs/research/retention-research.md (learnings L15).
- Structure, each scene tagged with `beat`: hook (0-3 s, number plus question), how it works
  (one cause per shot), payoff and re-hook (before 20 s), peak (30-42 s, the surprising number at
  human scale), answer, aftermath (consequences, L11), takeaway plus save point (1 s or less).
