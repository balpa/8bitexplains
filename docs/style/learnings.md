# Learnings

Rules distilled from the owner's feedback. Newest first. Each rule says where it came from.
These override docs/style/style-guide.md when they disagree.

## 2026-10-26 (ep005-ep007 v2 review)

- **L23 Keep the v2 build, add catchiness on top.** The owner found ep005-ep007 nice overall, so
  their look, pacing and depth (L14-L22) stay. Retention alone is not enough: every episode also
  needs a reason to send it, comment and follow. docs/research/catchiness.md lists the levers
  (second-person framing, a guess before the peak, an awe peak, a usable takeaway, a series name,
  a bird gag). Until the owner picks from it, a new episode at least names in its plan which of
  those levers it uses.
- **L24 Make it witty, about the science.** The owner wants humour in every episode. Related
  humour helped motivation and recall in a video-lecture study, unrelated jokes did nothing
  (docs/research/catchiness.md §5). So every joke shows the mechanism happening to someone:
  the bird is the victim or the witness (zapped by the strike it is learning about, puffed up by
  static, blown away by the pressure wave). Each episode has at least three bird gags, one of
  them in the first 3 s, and the outro calls back to the hook gag. At most two dry witty lines in
  the voice-over, and only when they replace words, never add time. No jokes in the scenes about
  deaths or victims; there the bird is serious.
- **L25 Effects from everyday life, not death tolls.** The owner does not want "1,800 people
  died" as the payoff. The aftermath (L11) gives one or two sourced, concrete facts about how the
  topic shows up in real life: something the viewer can notice, use or compare (count flash to
  bang and divide by five; one flash could light a bulb for three months). A death toll is never
  the aftermath or the closer, and it appears at all only when the topic cannot be told without
  it. Pick the fact per topic; the question is "where does this touch my life?".

## 2026-10-20 (improvement plan, Priority 2)

Research-backed guards the owner approved with the plan (docs/research/improvement-plan.md).

- **L18 No still picture over 4 s.** Outside the save point, the picture above the caption band
  changes meaningfully every 2-4 s: a camera move, a new subject state, a reveal. Life such as
  twinkle or rain does not count. QA measures it (docs/research/visual-craft.md §2), warns at
  3 s and fails above 4 s. Fix a flagged stretch with a camera move or a story event tied to the
  line being spoken, never with noise.
- **L19 One text block besides the captions.** The headline shows until a stat, reveal or the
  save screen takes over (`overlayFrom` in Episode.tsx); one that starts in the first 0.5 s owns
  the scene from frame 0. The HUD and the "LEVEL n" tag form the scene header: they show for the
  first 1.5 s of every scene, stat scenes included, and the tag keeps its space when it hides so
  the headline never jumps. Font sizes are multiples of 24 so Press Start 2P lands on the
  3 px art grid (`test_layout.py`).
- **L20 Every episode ships a cover.** `cover: {title, scene, t}` in the episode JSON renders
  `out/<id>-cover.png` from one template: the peak image, a 2-4 word title at 120 px (7 characters
  a line), the badge and the bird, all inside x 65-1015 and y 280-1248. Check
  `out/grid-preview.png` for readability at grid size.
- **L21 No line under 20 phoneme tokens.** Kokoro reads very short lines weakly; QA warns.
  Lengthen or merge the line, or keep it after listening.
- **L22 The caption opens with the searchable question.** First caption line is the question the
  video answers, on its own line, matching the hook. Posting routine:
  docs/publishing/posting-checklist.md.

## 2026-10-20 (ep005-ep007 review)

- **L16 Explain the why.** The owner heard "this burned, that blew up" without the cause.
  docs/research/explanation-depth.md sets the recipe. The mechanism has 3-4 causal links, each
  in its own sentence with "so", "because" or "which". Every outcome verb (burned, exploded,
  blacked out, killed) gets its cause in the same or the next sentence. Use at most 2 technical
  terms: say it plainly, then name it, then highlight it once. Map the one metaphor explicitly
  ("the water's weight is the cap") and follow it with the real mechanism within a line. The
  answer beat restates the whole chain. Say "nobody knows exactly" once where that is true. Every
  fact added for depth cites a public-domain US government page in `sources`. Budget 140-155
  words. That runs 55-60 s, which replaces the 45-55 s aim in L15; 60 s stays the hard limit.
- **L17 Breathe before the follow line.** The outro has two lines: the takeaway, then a separate
  "Follow Eight Bit Explains." `tts.py` holds 1.0 s of silence between them (`OUTRO_PAUSE_S`), and
  QA fails if that pause is under 0.8 s.

## 2026-10-20 (ep002-ep004 review)

- **L15 Follow the retention blueprint.** docs/research/retention-research.md sets the timeline.
  Instagram's ranker predicts whether a viewer watches less than 3 s, and it compares watch time
  with reels of the same length, so the first 3 s decide distribution. The rules:
  1. Frame 0 shows the most striking image in motion, plus a headline of 6 words or fewer.
     No logo, no greeting. First word by 0.35 s (QA checks this).
  2. By 3 s the voice has given a concrete number or consequence and asked a question the viewer
     half-knows.
  3. A small payoff before 20 s, then a re-hook line ("But that's not the strange part...").
  4. Every big number gets a human-scale comparison, on screen and spoken.
  5. One peak between 30 and 42 s: the biggest visual and the surprising number, with a short
     pause after it.
  6. Answer the opening question explicitly, then the aftermath (L11), then one takeaway line.
     The save-point line stays at 1 s or less and comes after the takeaway.
  7. The last frame rhymes with frame 1, so a replay loops smoothly.
  8. 160-200 words per minute (QA checks this). Every moving thing serves the narration.
     Aim for 45-55 s.
  Scenes carry a `beat` field (hook, how, payoff, peak, answer, aftermath, outro) so QA and the
  review can find them.

- **L14 Finer pixels.** New episodes set `"detail": 2` in the episode JSON: the canvas is still
  drawn in logical 180x320 units, but each logical pixel holds 2x2 physical pixels (360x640,
  3 px on screen instead of 6 px), so shading and dithering are finer and easier on the eyes.
  Area fills (skies, planets, water, terrain) loop with `y += PX` / `x += PX` and draw with
  `buf.dot`; sprites, lines and small props keep whole logical pixels with `buf.put`. Episodes
  001-004 stay at detail 1 and render unchanged.
- **L13 Never repeat a look.** The owner noticed the same ocean water in different episodes.
  Before planning shots, read docs/style/visual-ledger.md. A world, setting or metaphor object
  already listed there may not be reused as-is: either pick a new setting, or change at least
  palette, time of day, camera angle and composition, and log why. Everyday metaphor objects are
  never reused. The brand elements (HUD, pixel bird, "GAME SAVED!" text) are the only things that
  repeat. After each render, add the episode's looks to the ledger.
- **L12 Catchy topics only.** A topic qualifies only if it is (a) a question many people already
  ask ("why does...", "how does...") or (b) a little-known, surprising fact that makes people say
  "wait, what?". The hook names it in one spoken sentence with one concrete number or image and
  needs no background to be interesting. A trending story is used only if it also passes this.
- **L11 End on the consequence.** Never stop on the mechanism. Before the save point, every
  episode has an aftermath beat (its own scene, 1-2 lines, an on-screen number) with concrete,
  sourced consequences: what changed afterwards or what it means for the viewer (L25 replaces
  the death-toll option). Topics without harm end on what it changed or what
  it means for you.

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
