# Reaching Kurzgesagt quality in pixel art (2026-10-27)

The owner likes ep005-ep007 v3 but says they are not at Kurzgesagt quality yet. They asked for
everything that exists on how Kurzgesagt works, whether their look is protected, how to use
their design language in 8-bit while still looking current in 2026, and what we need before the
Instagram launch.

Five studies fed this report:
1. Kurzgesagt's own statements and interviews on how they work.
2. A legal-risk overview.
3. 2026 trends in pixel art and short-form explainers.
4. Free, commercial-safe TTS voices.
5. A frame-by-frame measurement of Kurzgesagt's five most-viewed Shorts and two long videos
   against our ep005-ep007 v3.

**Grades.**
- [OFF] Kurzgesagt's own statement, a registry, or a policy or licence page.
- [INT] interview. [LAW] statute or case. [EXP] practitioner or lawyer commentary.
- [IND] press, blog or vendor. [BENCH] benchmark. [OURS] measured by us.
- [INF] our inference, not tested.

This is not legal advice. Section 3 is a risk overview from public sources.

---

## Bottom line

1. **Pacing is no longer the gap; the look is.** Our motion (25.6) and rate of big changes (6.3
   per 10 s) already match Kurzgesagt's Shorts (28.7, 5.7). The gaps [OURS]:
   - Their frames are much brighter: luma 95 against our 59.
   - They are more saturated: 187 against 147.
   - They use fewer colours per frame: 56 against 82.
   - Their surfaces are cleaner: edge density 5.0% against 8.5%.
   - Their main subject is bigger: 36% of the frame against 25%.
   - They show almost no text: about 1-3% of the frame against our 8-12%.
2. **A style is not protected; their concrete work is.** Flat shapes, gradients, rim light,
   colour logic and pacing are free to use. Their bird, their drawings and compositions, their
   music and their name are not. Our mascot must stay clearly different from their bird, which
   is also a bird (section 3).
3. **What looks "current" in pixel art is light, not resolution.** Modern pixel art keeps low
   resolution but adds lighting, glow, bloom, depth and a smooth camera. Strict NES limits read
   as retro; lit, bright, clean pixel art reads as 2026 [EXP + INF].
4. **The voice is the largest gap the picture cannot fix.** Qwen3-TTS (Apache-2.0, preset male
   voices, style prompts) is the first candidate to A/B against Kokoro. The owner's own voice
   is the highest ceiling (section 5).
5. **Launch advice [INF].** Pilot the new look on one episode, let the owner compare, then
   rebuild the other two. Launch with at least six episodes in stock, which is two weeks at three
   posts a week (section 7).

We cannot match Kurzgesagt's craft hours: about 1,200 hours and 4-6 artists per video (section 2).
We can match their *grammar*, because most of it is procedural-friendly:
- one big subject;
- bright flat grounds;
- faces on things;
- labels attached to objects;
- glow as drama;
- scale shown with everyday objects;
- graphic transitions;
- eased motion.

---

## 1. Measured: Kurzgesagt Shorts against ours [OURS]

Side-by-side sheet: `out/kurzgesagt-vs-ours.png` (not in git). Frames were captured in headless
Chromium from the YouTube player, nothing was downloaded. Shorts are the five most viewed on the
channel (13-20M views each); the long videos are the first 60 s of two recent ones. Ours are
the v3 renders. The capture matches the earlier competitor-shorts.md numbers for the same Short
(luma 75 against 76, motion 29.9 against 30.4).

| Video | Luma | Sat | Motion | Big/10 s | Avg shot (s) | Colours | Edge % | Largest subject % | Text area |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| KZ Shorts, mean of 5 | 95 | 187 | 28.7 | 5.7 | 3.2 | 56 | 5.0 | 36 | ~1-3% |
| KZ long-form, mean of 2 | 58 | 189 | 24.2 | 5.6 | 5.5 | 84 | 5.6 | 37 | - |
| Ours ep005-ep007, mean | 59 | 147 | 25.6 | 6.3 | 3.9* | 82 | 8.5 | 25 | ~8-12% |

How the columns were measured:
- 1 fps frames at 270x480; shot length was taken from 2-4 fps frames.
- **Colours** counts quantised colours that cover at least 0.1% of the frame.
- **Edge %** is the share of pixels with a Sobel gradient above 120.
- **Largest subject** is the biggest connected region that differs from the background colour.
- **Text area** was estimated by eye.

\* ep007's lightning flashes count as cuts, so our average shot length is a little low.

**What the frames show**
- **The mascot is the protagonist, at size.** Their bird fills 30-50% of the frame and acts:
  it sweats, holds a magnifier, gets a deadpan line in a speech bubble. Ours is a small sprite
  except in the close-up gag.
- **Flat, bright, single-colour grounds.** They use solid cyan, yellow, pink or deep navy with
  one gradient. In dark scenes the subject always glows: a black hole with a halo, a radial
  burst with a white core. Ours are night scenes with dense dither textures (trees, rain,
  brick), and the horizon splits the frame.
- **Faces on everything.** A banana, particles, alarm clocks. Our best frames already do this:
  the soda bottle, the transformer with "30 SEC", the heat ladder.
- **Numbers sit on the object.** They use a speech-bubble pill ("360 mg Potassium") or a
  numbered chapter pill ("1 PAY & DIE"). Huge display type appears once or twice per video.
  We keep the HUD, "LEVEL n", a 72 px headline, a sub line and a two-line caption on screen
  all the time.
- **Scale as an everyday picture.** A mountain of bananas with a price tag, a sandwich on a
  globe, a coin next to a black hole.
- **Graphic transitions.** Iris/portal circles, diagonal wipe splits and morphs, never a noisy
  dissolve.
- **They borrow blocky styles too.** "Earth as a cube" is voxel/Minecraft-like, and their
  process page lists "pixel-based illustration" [OFF]. That most likely means raster drawing,
  not pixel art [INF], but pixel looks are not foreign to them. That is one more reason to keep
  our own assets clearly ours (section 3).
- **Ours, at their best:** the soda bottle with a face, the umbrella shield, the heat ladder,
  the bird close-ups. These are the frames closest to Kurzgesagt's grammar.

---

## 2. How Kurzgesagt works

**Process** [OFF] (https://kurzgesagt.org/youtube/):
1. Research from books and papers, with experts consulted. Each video gets a public source
   sheet.
2. The script takes "about a dozen drafts".
3. A sketching phase settles the visual metaphors before the final art.
4. "Vector illustration, pixel-based illustration and infographics" are drawn.
5. The narrator's voice is recorded first and "provides the timing for the animation team".
6. Animation is "classic 2D flat animation with 3D elements".
7. Every video gets "its own specifically composed soundtrack" from Epic Mountain.

**Effort**
- Their 2020 "how we make a video" piece gives at least 1,200 hours per video [OFF, via a
  transcript, not checked against the video:
  https://www.lingq.com/ja/%E3%82%AA%E3%83%B3%E3%83%A9%E3%82%A4%E3%83%B3%E3%81%A7%E8%8B%B1%E8%AA%9E%E5%AD%A6%E7%BF%92/courses/689474/how-to-make-a-kurzgesagt-video-in-120-4887128/].
  The same piece gives:
  - about 200 panels per video, drawn in Illustrator;
  - 2-3 illustrators working 8-12 weeks;
  - 2-3 animators working about 8-10 weeks in After Effects;
  - "every single thing that's moving on-screen has been moved manually";
  - music composed after the cut, with sound effects as a key layer.
- The founder says "over a thousand working hours" per idea [INT,
  https://phdnet.mpg.de/208764/episode-25-kurzgesagt-and-visual-science-ft-philipp-dettmer].
- Their about page names Steve Taylor (voice) and Thomas Veith and Fabian Glaser (music and
  sound) [OFF, https://kurzgesagt.org/about/].

**Animation craft.** These details come from the official Skillshare course taught by a
Kurzgesagt motion designer [EXP,
https://www.skillshare.com/de/classes/animierte-grafiken-mit-kurzgesagt-teil-1/631970755]:
- Easing everywhere, with about 75% keyframe influence: a fast start and a soft settle. Never
  linear.
- Three tempos: normal moves of about 0.8 s, snappy moves of 0.3-0.5 s, pop-ins of 0.1-0.17 s.
- Related parts are staggered by 10-20 frames at 60 fps, so nothing moves in lockstep.
- Idle parts run ping-pong and cycle loops with time offsets, so the picture never freezes.
- Characters are rigged at the joints (wings, beak), and the face parts move as a group.

**Tone** [OFF]: "aesthetic, fun, accessible"; objective, rigorous and self-aware; optimistic.
An early founder quote: complex topics should not be "too serious" [IND,
https://birdinflight.com/en/inspiration/kurzgesagt.html].

**Short-form.**
- Kurzgesagt began a run of Shorts in May 2023 [IND] and lists TikTok on its timeline [OFF].
- A Forbes interview (October 2024) reportedly says that learning Shorts took them about a
  year, that the format settled at about one minute, and that Shorts must loop with the
  information intact. We could see this only in a search summary; the page blocked us, so it is
  not confirmed.
- Their Shorts we measured do loop, ending on the opening pose and backdrop [OURS]. That matches
  our L26.

**Not found anywhere credible.** There is no published breakdown of their palette method, rim
light, grain or depth rules. What we say about their look comes from our own frame
measurements and observation (section 1), not from a source.

---

## 3. Can we use their design language? (risk overview, not legal advice)

**A style as such is not protected; concrete expression is.**
- **US:** copyright covers expression, not ideas or style (17 U.S.C. §102(b)) [LAW]. Copying many
  distinctive elements together can still infringe (Steinberg v. Columbia Pictures, 1987) [EXP].
- **EU:** originality is the only test for a work (Cofemel C-683/17, Brompton C-833/18) [LAW].
  Neither case protects a general style.
- **Germany:** "copyright does not protect style as such" [EXP]. Unfair-competition law (UWG §4
  Nr. 3) only bites with a close copy that deceives viewers about who made it [EXP/LAW].
- **Turkey (FSEK):** a work needs a definite form and creativity, and ideas are free [EXP]. We
  found no article on style.
- **What their imprint protects:** "texts, photos, drawings and videos" by copyright and "logos
  and lettering" by trademark law [OFF, https://kurzgesagt.org/imprint].

**Their trademarks.** In the US, "KURZGESAGT IN A NUTSHELL" is a word-and-design mark (Reg.
6050127), and an image mark (Reg. 6187130, IR 1469395) is registered too [OFF via Justia
snippets; the image was not seen]. EU and German registrations are likely but not confirmed.

**Their mascot is a bird, and so is ours.** Their Shorts bird is a round duck-like bird, mostly
magenta or dark purple with an orange or yellow beak and one big eye [OURS, from the frames].
Ours today is a tiny pixel bird in white, yellow and pink. At its current size the overlap does
not matter. Once we enlarge our bird as recommended below, it must not read as their bird in
pixels:
- a different silhouette;
- a different main colour (not magenta or pink);
- a different eye and beak style.

| Borrowing | Risk | Why |
|---|---|---|
| Flat shapes, gradients, rim light, glow, colour logic | Low | Technique and style |
| Pacing, hook, loop ending, one camera journey | Low | Ideas and methods |
| Faces on objects, labels on objects, scale pictures | Low | Common explainer devices, our own drawings |
| Our own pixel bird, clearly different | Low | Original character |
| An enlarged bird that resembles theirs (pink, duck-like, one big eye) | Medium-High | Copyright in the character, plus a confusion risk |
| Copying their compositions, tracing frames, recreating shots | High | Direct infringement |
| Their music, scripts or narration | High | Protected works |
| "Kurzgesagt", "In a Nutshell" or "Kurzgesagt-style" in our name, bio, captions, hashtags | High | Registered mark; trades on their brand |
| A full look-alike package (palette + bird + format + name echo) | Medium-High | Confusion risk grows with each match |

**Platforms.** Instagram's originality ranking (extended on 30 April 2026) targets reposted and
aggregated content [IND, TechCrunch 2026-04-30]. Original episodes with our own art, voice and
script are unaffected. "Kurzgesagt, but 8-bit" stays an internal brief only. It never appears
in public text.

---

## 4. Looking current in 2026

**Modern pixel art = low resolution + high-fidelity light.**
- **HD-2D (Octopath Traveler):** the team kept old-style sprites and let dramatic light, shadow
  and depth carry the look [OFF/EXP,
  https://www.unrealengine.com/en-us/developer-interviews/octopath-traveler-ii-builds-a-bigger-bolder-world-in-its-stunning-hd-2d-style].
- **Lighting on flat sprites:** normal-map lighting makes them react to a light direction
  [EXP, https://80.lv/articles/exploring-next-gen-pixel-art-with-real-time-dynamic-lighting].
- **Glow:** bloom plus animated light on a low-ambient scene gives the glowing look [EXP].
- **Balatro's CRT finish:** a shader layer (scanlines, chromatic fringe, curvature) over a
  limited-palette sprite canvas [EXP, secondary].

Achievable in our procedural engine [INF]:
- analytic normals for planets, spheres and terrain, with one key light and a rim light;
- an additive, dithered bloom pass on glowing things;
- light shafts and a vignette;
- fake depth of field (far layers blurrier, bluer and lower in contrast, then re-quantised);
- particles in every shot (dust, sparks, motes);
- a smooth camera with sprites kept on the pixel grid.

True HD-2D, which needs a 3D scene with tilt-shift, is out of reach.

**Short-form science in 2026.**
- Zack D. Films leads with about 11M Instagram followers and about 5.3M average Reel plays
  [IND, third-party tracker, 2026-08].
- YouTube's April 2026 animation report says 61% of 14-24-year-old animation fans like
  independent animation as much as or more than studio series [OFF via Cartoon Brew].
- TikTok's 2026 trend report stresses honesty, "real process" and curiosity [IND, secondary].

We found no verified 2025-2026 growth data for pixel-art accounts, and no study showing that
lighting or a CRT finish raises retention. Treat those as things to test.

**Instagram facts that matter beyond the existing growth research**
- Reels can run up to 3 minutes (since January 2025) [OFF via news].
- The profile grid shows a 3:4 crop. Our cover rule (title inside y 280-1248) already fits it.
- The free Edits app exists. We do not need it, because we upload the master render.
- "Made with AI" is now called "AI info". The "AI-generated profile" label is only for accounts
  built around an AI persona, which we are not [IND].
- Reels on TV (Fire TV, Google TV, US only) favours clean, high-contrast art [IND].

---

## 5. Voice

The research (audio.md) already says modern TTS is fine for learning but loses on engagement and
emotion. Kokoro's limits are flat prosody and weak emphasis.

**Licence-clean candidates, checked on their model cards**

| Option | Licence | Why |
|---|---|---|
| **Qwen3-TTS 1.7B CustomVoice** | Apache-2.0 [OFF, card checked 2026-10-27] | Preset English male voices: Ryan ("dynamic ... strong rhythmic drive") and Aiden ("sunny American"). A free-text `instruct` prompt steers tone, rate and emotion. No reference clip needed. Runs on Mac via mlx-audio (MIT) [OFF]. Speed on our Mac not measured. |
| **Chatterbox / Chatterbox-Turbo** | MIT [OFF] | An `exaggeration` control and laugh tags. It needs a reference clip, so the only clean source is the owner's own voice. Watermarks its output. |
| **Orpheus 3B** | Apache-2.0 [OFF] | Emotion tags such as `<sigh>`. A 3B model is likely slow on a Mac (unverified). |
| VoxCPM2 | Apache-2.0 [OFF] | Designs a voice from a text description. The card admits instability on expressive input. |

**Fail our licence rule:**
- Fish Speech / OpenAudio: NC-SA.
- F5-TTS and Spark-TTS: NC.
- Higgs Audio v2: custom licence with a user cap.
- VibeVoice: research use only.
- XTTS-v2: CPML.
- IndexTTS2: custom licence, terms unread.

**Cloning a dataset speaker** (LibriTTS, VCTK) copies a real person's voice. We do not do that.

**The owner's own voice** has the highest ceiling. It needs about 10 minutes of recording per
script, a quiet soft room, the mic 10-15 cm away, and free processing: noise reduction, 3:1
compression, then normalising to -14 LUFS [IND]. His English delivery becomes the limit.

A more human voice does not remove the AI label as long as the voice is synthetic.

**Test.** Run a blind A/B on the same three scripts: Kokoro, Qwen3-TTS Ryan and Qwen3-TTS
Aiden, each with an `instruct` such as "warm, curious documentary narrator, slight pause before
key numbers". To pass, a voice must win on emphasis and on short lines and render in under about
2 minutes per episode.

---

## 6. Proposals (owner chooses; none is a rule yet)

The proposals are ordered by effect per hour of work. Each has a check QA can measure, so a
logged critique cannot come back. Targets come from the Kurzgesagt Shorts means in section 1.

| ID | Proposal | QA check / target |
|---|---|---|
| **K1** | **One big subject per shot**, centred on a near-empty ground. No default horizon-and-landscape. | Median largest-subject area ≥ 30% |
| **K2** | **High-key colour.** Bright flat grounds (cyan, yellow, pink, navy) with one gradient. Dark scenes only with a glowing subject, at most a third of the runtime. | Mean luma ≥ 85 (today the floor is 50, L30); mean saturation ≥ 175 |
| **K3** | **Clean surfaces.** Each object gets a flat fill, one shadow and one highlight. Dither only in gradients and glows, not as texture. 4-6 colours per object. | Edge density ≤ 6%; colours per frame ≤ 64 |
| **K4** | **Much less text.** After the hook, no HUD, LEVEL, headline or sub line. Captions of 1-3 words, smaller. Numbers as pills on the object. Big display type at most twice per episode. | Text area ≤ 4% outside the hook; one text block besides captions |
| **K5** | **The bird as protagonist at size.** Redrawn at fine detail, 30-50% of the frame in most scenes, acting and reacting. Clearly unlike Kurzgesagt's bird: no magenta or pink, own silhouette, eyes and beak. | Bird visible ≥ 50% of runtime, at ≥ 25% of the frame width |
| **K6** | **Faces on things** as the default way to explain a mechanism. | Every "how" scene has one object with eyes |
| **K7** | **Light as drama.** Radial bursts with a white core, halos, rim light, a bloom pass on glowing things, analytic shading on spheres. | Self-review: every dark shot has one glow source |
| **K8** | **Scale as an everyday picture** (a pile of soda bottles, a bolt next to a kettle), not a number badge. | Every peak number has a picture comparison |
| **K9** | **Graphic transitions:** iris/portal, diagonal wipe, zoom-through (visual-craft.md §3). | Already planned: no dither dissolve between worlds |
| **K10** | **Eased, staggered motion:** about 75% ease-out, three tempos (0.8 / 0.4 / 0.15 s), pop-ins with overshoot, related parts 3-6 frames apart, idle loops offset. | Unit tests on the easing and pop helpers |
| **K11** | **Voice A/B:** Kokoro against Qwen3-TTS (section 5). Owner decides by ear. | Blind A/B on three scripts |
| **K12** | **Music per episode, written to the cut:** motif, build, stop on the peak (audio.md, Priority 3). | Already planned |
| K13 | Optional subtle CRT finish (faint scanlines, vignette), text kept crisp. Test only after K1-K7. | Owner's taste |

**What stays ours:**
- the pixel grid (180x320, detail 2);
- chiptune;
- the bird;
- the loop ending;
- humour;
- everyday-life aftermaths;
- the "you" framing.

Kurzgesagt's grammar plus pixel light is the 2026 version of "8-bit". Strict NES dither texture
is what makes our frames dark and noisy.

**What K1-K4 change in practice [INF].** Our worlds become stages:
- a lake becomes one bright lake with a face;
- a night city becomes one glowing transformer on navy;
- a storm becomes one bolt on deep purple with a burst.

Most engine pieces already exist: the close-up, `drawNumber` pills, faces, `split()`. The work
is mostly in the shot files and in removing headline layers from `Episode.tsx`.

---

## 7. Instagram launch readiness

**Already done:**
- the posting checklist;
- AI-label steps;
- the hashtag limit;
- the cover generator and grid preview;
- the loop ending;
- QA guards;
- the data sheet plan (docs/publishing/posting-checklist.md, growth-and-data.md).

**Missing before launch [INF]:**
1. **The new look on ep005-ep007** (K1-K5 at least). Today's v3 frames are dark and full of
   text next to the reels they compete with. Do a pilot on ep007 first, show it side by side
   with v3, then do the other two.
2. **Six episodes in stock** before the first post: 3 a week means two weeks of buffer, so one
   slow week does not break the schedule. Candidates are the five topics in
   competitor-shorts.md and the ten in topics-and-visuals.md. Space is bright and new for us.
3. **A profile kit:**
   - an avatar (the redrawn bird, readable at 110 px);
   - a bio of one line saying what the channel is, plus "AI voice";
   - the handle reserved on both platforms;
   - caption drafts for the first six posts (searchable question, sources, disclaimer).
4. **Voice decision** (K11) before the six are rendered, because voice changes timing.
5. **The phone check** of the caption band on the first post, as the checklist already says.

ep001-ep004 are the old style and should not be posted.

---

## Limits

- Kurzgesagt's design method (palette, light, grain) has no primary source. Section 1 is our own
  measurement of seven videos.
- The Forbes Shorts quotes were seen only in a search summary.
- Trend data for pixel-art accounts in 2025-2026 is thin. Nothing shows that lighting or a CRT
  finish raises retention, so these are tests, not rules.
- TTS speed on our Mac and the Qwen3-TTS code licence on GitHub are unchecked.
- Trademark data comes from Justia snippets, not the USPTO or EUIPO registers.
- The legal section is a public-source overview. If the channel grows or monetises, a short check
  with an IP lawyer is worthwhile.
