# Learnings

Rules distilled from the owner's feedback. Newest first. Each rule says where it came from.
These override docs/style/style-guide.md when they disagree.

## 2026-10-19 (ep001 v3 direction)

- **L10 One memorable metaphor.** Every episode explains its mechanism with one everyday object
  the viewer already understands (ep001: the Pacific as a bathtub, the bird blowing the water
  west, the water sloshing back), then cuts to the real view.
- **L9 Win the first two seconds.** Frame 1 already shows the most striking image, in motion
  (ep001: close-up of the glowing Pacific pulling back to the planet, thermometer slam with a
  screen shake). No slow fade-ins.
- **L8 Real geography.** Planets and maps use the Natural Earth land mask
  (remotion/src/engine/landmask.ts) and real coordinates via `project()`; never invented
  continents. Place regions and icons at their actual latitude/longitude.

## 2026-10-19 (ep001 v2 review)

- **L7 Keep the v2 direction.** The owner liked v2 overall: one camera journey, shaded planet,
  Mode-7 ocean, underwater diorama, mascot, boxless word-highlight captions. Build on it.
- **L6 Fewer, quieter SFX.** Even placed between lines, v2's SFX competed with the voice. At most
  one SFX per scene, only on the scene change or after the last word, at least 18 dB under the
  voice; no SFX on individual lines.

## 2026-10-19 (ep001 v1 review)

- **L5 Depth, not diagrams.** Flat 2D cross-sections with labels read as "too simple". Use
  layered parallax, dithered 3D shading, lighting and one continuous camera journey
  (the owner chose: planet from space, then a Mode-7 ocean flyover, then an underwater diorama).
- **L4 No caption box.** The big black caption box looked plain and ate the frame. Use
  borderless, outlined, word-highlighted captions.
- **L3 Centre the frame.** v1 shifted everything left (margins 60/160) and left the bottom
  quarter empty. Art must be full-bleed and the content column centred.
- **L2 Balance the mix.** SFX were louder than the voice and the overall level was about
  -25 dBFS RMS. Measure loudness on every render and follow the audio targets in the
  style guide.
- **L1 Show, don't ask.** The owner cannot answer technical style questions. Research the
  reference style yourself and show 2-3 mockups to choose from.
