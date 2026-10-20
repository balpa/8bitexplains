# Visual craft: mascot, change rate, transitions, pixel craft, text

Research summary, October 2026. It addresses the weak spots in the ep005-ep007 contact sheets:
near-identical frames for 6-9 s, noisy dissolves between unrelated worlds, a bird that only
hovers, mixed pixel sizes, busy text, and no designed cover.

**Grades.** [PR] peer-reviewed. [OFF] official platform documentation. [IND] industry blogs and
tools. [EXP] practitioner or expert. [OURS] measured on our renders or code in this study (verified).
[INF] our inference, untested.

---

## 1. The mascot as a pedagogical agent

- **Emotional design helps, modestly.** Faces on learning graphics plus pleasant colours improved
  retention (d ≈ 0.39) and transfer (d ≈ 0.33) across 33 samples. Source: Brom, Starkova & D'Mello
  2018, *Educational Research Review* 25:100-119,
  https://artemis.ms.mff.cuni.cz/main/papers/emodesign_manuscript_1rev_180928_FINAL_norev.pdf [PR].
  A replication found retention g ≈ 0.35 and transfer g ≈ 0.27. Source: Wong & Adesope 2021,
  *Educational Psychology Review* 33(2):357-385,
  https://rex.libraries.wsu.edu/esploro/outputs/journalArticle/Meta-Analysis-of-Emotional-Designs-in-Multimedia/99900601054701842
  [PR; effect sizes taken from citing papers].
- **The origin studies.** Warm colours and round shapes raised positive emotion and comprehension.
  Sources: Um, Plass, Hayward & Homer 2012, *J. Educational Psychology* 104(2):485-498; Plass et
  al. 2014, *Learning and Instruction* 29:128-140. Giving a virus and a cell expressive eyes and
  colour raised learning with medium effects (d ≈ 0.65-0.69). Source: Mayer & Estrella 2014,
  *Learning and Instruction* 33:12-18. [PR; from abstracts and later reviews]
- **Agents give a small benefit, and 2D works best.** Agents beat no agent at g ≈ 0.20, and 2D
  agents (g ≈ 0.38) beat 3D ones (g ≈ 0.11). Nonverbal behaviour, motion and voice did not
  moderate the effect. Source: Castro-Alonso et al. 2021, *Educational Psychology Review*
  33:989-1015,
  https://research.birmingham.ac.uk/en/publications/effectiveness-of-multimedia-pedagogical-agents-predicted-by-diver/
  [PR]. Generic liveliness adds nothing.
- **Pointing is the active ingredient.** An agent that pointed at the exact part being named drew
  more fixations there. It also beat general pointing, other gestures and no gestures on retention
  and transfer, both immediately and a week later. Source: Li, Wang, Mayer & Liu, "Getting the
  point", *J. Educational Psychology*, 2019 [PR; journal year taken from citations]. Gesture
  benefits came from deictic (pointing) gestures (Davis 2018, *Educational Research Review*
  24:193-209). Gesturing more often raised persona ratings but gave mixed learning results (Davis,
  Vincent & Wan 2021, *Int. J. Educ. Tech. in Higher Ed.* 18). [PR]
- **Gaze steers attention reflexively, even from a cartoon.** Schematic eyes looking aside shift
  attention within about 100-300 ms, even when the gaze carries no information. Source: Frischen,
  Bayliss & Tipper 2007, *Psychological Bulletin* 133(4):694-724,
  https://pmc.ncbi.nlm.nih.gov/articles/PMC1950440/ [PR].
- **Caution.** Irrelevant motion is a seductive detail and hurts learning (retention-research.md
  §4).

**Applied [INF].** The bird earns its place by *directing* attention. It looks, then points, at
what the voice is about to name, about 0.3 s before the word. Emotion poses mark the beats. No
study gives an action rate, and more gestures did not mean more learning. So: one new action every
3-6 s, each held at least 1 s.

**The bird's six actions** (fine detail, 2-px eyes so expressions read):

| Action | Look | When |
|---|---|---|
| `idle` | Hover, blink, slow bob | Default; never longer than 6 s |
| `look` | Head and eyes turn to a target `(x, y)` | 0.3 s before something on screen is named |
| `point` | Wing toward the target, eyes on it | Each causal link in the "how" beats |
| `gasp` | Eyes wide, beak open, "!" pop, hop | Hook number; peak number |
| `sweat` | Existing drops plus a wobble | Danger and aftermath |
| `cheer` | Wings up, sparkle, small loop | Payoff, the answer, the save point |

## 2. Visual change rate and attention

- **Shots got shorter and motion went up.** The average shot in popular films is now about 4 s.
  Within a film, shots lengthen and motion falls in the setup, and both reverse in the climax.
  Cutting measured motion as the correlation between frames n and n+2 on 256x256 greyscale.
  Source: Cutting 2016, *Cognitive Research: P&I*, https://pmc.ncbi.nlm.nih.gov/articles/PMC5256470/
  [PR]. Shot-length sequences approach 1/f, which may help hold attention. Source: Cutting,
  DeLong & Nothelfer 2010, *Psychological Science*, doi:10.1177/0956797610361679 [PR; debated].
- **Related edits help and unrelated ones cost.** More camera changes *within one scene* raised
  arousal and memory without adding much load (Lang et al. 2000, *JBEM* 44(1):94-109). *Unrelated*
  cuts to new content need more processing just after the cut, and their content is remembered
  worse (Lang, Geiger, Strickwerda & Sumner 1993, *Communication Research* 20(1):4-29; read at
  abstract level). In the limited-capacity model, a cut is cheap when it continues the same world
  and costly when the viewer must rebuild the scene (Lang 2000, *J. Communication* 50(1):46-70).
  [PR]
- **Meaningful change means events.** Viewers mark event boundaries mainly where the *action*
  breaks. A change of place or time alone matters little. Source: Magliano & Zacks 2011,
  *Cognitive Science* 35(8):1489-1517, https://pmc.ncbi.nlm.nih.gov/articles/PMC3208769 [PR].

**Definition [INF].** A meaningful change is a change in composition, camera or the subject's
state: the gas rises, the crack opens, the bird points. Rain, twinkling stars and wing flaps are
*life*. They keep frames alive but do not renew attention.

**Proposed metric: picture hold time [OURS].**
1. Sample the MP4 at 2 fps and crop to y 0-1180, which drops the caption band. Convert to grey
   and box-downscale to 45x49, so each cell covers 24x24 screen px and sparkle averages out.
2. Normalise each frame to mean 0 and SD 1, so global flicker such as lightning does not count.
3. `hold(t)` = the time until a later frame differs from frame t by a mean absolute z-difference
   of 0.20 or more.

Calibrated on our renders, it finds exactly the stretches the owner saw as static:

| Episode | Longest hold | Starts at | Content |
|---|---|---|---|
| ep004 | 9.0 s | 12.5 s and 29.5 s | Two stills |
| ep005 | 6.5 s | 16.0 s | Soda bottle |
| ep006 | 5.5 s | 14.5 s | Umbrella and hose |
| ep007 | 7.0 s | 31.0 s | Lightning channel |
| ep007 | 4.0 s | 3.0 s | Hook |

**Threshold.** WARN at a 3.0 s hold, FAIL above 4.0 s. The save-point tail is exempt. Raw
differencing without normalisation missed the ep007 lightning. SSIM (Wang, Bovik, Sheikh &
Simoncelli 2004, *IEEE TIP* 13(4), https://www.cns.nyu.edu/~lcv/pubs/makeAbs.php?loc=Wang03) [PR]
would also work, but it adds a dependency for no gain at 45x49.

## 3. Transitions and camera

- **Continuity editing hides cuts by steering attention.** A quarter of cuts between two views of
  one scene went unnoticed, and a third when the cut coincided with the onset of motion. Source:
  Smith & Henderson 2008, *J. Eye Movement Research* 2(2), https://bop.unibe.ch/JEMR/article/view/2264
  [PR]. Smith's attentional theory explains match-action cuts, matched exits and entrances, and the
  180° rule: where attention is pointed carries across the cut. Source: Smith 2012, *Projections*
  6(1):1-27, https://ualresearchonline.arts.ac.uk/id/eprint/21187/ [PR].
- **Motion-design practice** lists the hard cut, dissolve, cut on action, match cut, infinite zoom
  and morph. Source: School of Motion,
  https://schoolofmotion.com/blog/six-essential-motion-design-transitions-tutorial [IND].
- **Kurzgesagt** describes its style only as 2D flat animation with 3D elements, timed to the
  voice (https://kurzgesagt.org/youtube/) [OFF]. No first-party or expert breakdown of its
  transitions was found. From viewing the films, the continuity seems to come from three moves:
  zooming into an object until its inside is the next scene, scale jumps along one path, and shape
  matches, all within one colour world [INF, unverified].

**Why our dissolves look noisy [OURS, from the code].** `dissolve()` in `engine/pixel.ts` flips each
2x2 Bayer cell at a different moment. Between two unrelated, high-contrast worlds this crawls like a
checkerboard for 0.4 s. It is Lang's costly unrelated cut with noise added, and it gives the eye
nothing to follow.

**Four transitions to build:**
1. **Zoom-through** (`zoomThrough`). Push into a focal object in A (a window, crater, bottle neck
   or cloud gap). B shows through its mask and grows to full frame. Use it for changes of world or
   scale.
2. **Match cut** (`matchCut`). Hard-cut at peak motion where a shape in A (the sun, a balloon, the
   magma pocket) matches the position and size of a shape in B. An optional 2-frame flash covers
   the cut. Use it for metaphor ↔ reality.
3. **Directional pan or tilt** (`pan`). A leaves and B enters in the same direction as the earlier
   motion, in whole physical pixels. Use it for the same world, next place.
4. **Iris wipe** (`iris`). A pixel-stepped circle closes on the subject. This is the 8-bit idiom,
   at most once per episode (for example into the outro).

Dither dissolves remain only for same-world changes (time of day, x-ray), at 0.4 s or less.

## 4. Pixel-art craft for phones

- **Mixels.** "Mixels" are changes of pixel size within one piece. Practitioners call them
  inconsistent and allow them at most for whole background layers
  (https://community.flowlab.io/t/mini-rant-stop-using-mixels/38287). Keep one density per scene
  and scale only by integer multiples (https://pixnote.net/en/learn/resolution). [EXP]
  **Our mixels [OURS]:**
  - The bird uses `sprite(..., scale = 2)` through `buf.put`, so each bird pixel is 12 screen px
    against 3 px fills.
  - The floppy is 18 px per pixel.
  - Press Start 2P is meant for multiples of 8 px (https://fontsource.org/fonts/press-start-2p/about
    [OFF]), but `Episode.tsx` uses 54, 44, 34 and 30 px.
- **Readability.** Outlines separate an object from what is behind it, so they should always raise
  contrast: darker than both the object and the background, lighter toward the light
  (https://lospec.com/articles/pixel-art-outlines-part-2-using-color). Too many similar colours blur
  together (https://www.derekyu.com/makegames/pixelart2.html). [EXP]
- **Palettes.** Use few colours per image. Ramps peak in saturation mid-ramp and shift hue about
  20° per step, warmer toward the highlights
  (https://www.slynyrd.com/blog/2018/1/10/pixelblog-1-color-palettes). A 2026 landscape walkthrough
  uses 15 colours in total
  (https://www.slynyrd.com/blog/2026/5/27/pixelblog-62-landscape-backgrounds). [EXP]
- **Depth.** Far planes take on the haze colour and lose saturation and contrast. Parallax only
  convinces if the still frame already reads as deep. Movement happens in whole pixels, with the
  slowest layer at about 1 px per frame
  (https://slynyrd.com/blog/2018/11/16/pixelblog-11-landscape-pixeling,
  https://www.slynyrd.com/blog/2019/11/12/pixelblog-23-parallax-scrolling). [EXP] Our sprites round
  to *logical* pixels, so at detail 2 a slow drift steps 6 px at a time [OURS].

## 5. On-screen text in vertical video

- **How much.** A duplicate text block on top of narration and animation hurts learning, while
  short keyword captions help (Mayer & Johnson 2008; retention-research.md §6) [PR]. TikTok asks
  for text that gives context, the proposition in the first 3 s, and at most 5-10 words per second
  (https://ads.tiktok.com/help/article/creative-best-practices) [OFF]. Our stat scenes show up to
  five text blocks: HUD, "LEVEL n", headline, stat plus label, captions [OURS].
- **Safe zones.** Meta's Reels ad spec keeps the top 14%, the bottom 35% and 6% at each side clear
  (https://www.facebook.com/business/ads-guide/update/video/instagram-reels) [OFF]. On 1080x1920
  that leaves y 269-1248 and x 65-1015. Our caption band (y 1250-1420) sits inside the ads' bottom
  zone. Organic reels have less UI, but no official organic figure was found. Guides put the right
  rail at about 230 px wide near the bottom (https://www.hopperhq.com/blog/instagram-reel-size/)
  [IND]. TikTok's overlay files were not reachable. Guides quote about 130 px top, 140 px right and
  480 px bottom [IND].
- **Captions.** No peer-reviewed comparison of caption styles exists for short-form video.
  Highlighting the current word works as signalling (d ≈ 0.38; retention-research.md §8)
  [PR, adapted].
- **Cover.** The profile grid crops to 3:4, so a 1080x1920 cover shows only y 240-1680. The crop
  can be adjusted (https://www.kapwing.com/resources/instagrams-new-grid-layout-size-and-dimensions-2025/,
  Hopper above) [IND]. Covers can be uploaded as images [IND]. Guides agree on short, bold,
  high-contrast titles, nothing over busy areas, and one template across the series [IND/EXP].
  **Size [INF]:** a grid tile is about a third of the phone width, so a cover shows at roughly 12%
  of its size. A 120 px title (15 px font pixels) then reads as about 12 pt, with at most 7
  characters per line across 950 px.

---

## Engine changes (priority order)

**1. Hold-time check in `tools/qa.py`.**
- *Rule (L18 candidate):* No picture holds longer than 3 s outside the save point. Something
  meaningful (camera, composition, subject state or a bird action) changes every 2-4 s. QA warns
  at 3.0 s and fails above 4.0 s, using the §2 metric.
- *Verify:* on today's renders it flags ep005 at 16.0 s, ep006 at 14.5 s and ep007 at 31.0 s.
  After the fix, all holds are under 3 s. Add a `test_qa.py` fixture for both a pass and a fail.

**2. Text layout in `Episode.tsx`.**
- *Rule:*
  - Besides the captions, at most one text block is on screen. The stat replaces the headline.
  - The HUD and "LEVEL n" show only for the first 1.5 s of a scene, never next to a stat.
  - Font sizes are multiples of 24 (24, 48, 72, 96, 120), so text pixels land on the 3 px art
    grid.
  - Captions end above y 1248, unless a phone check shows the organic UI leaves today's band clear.
- *Verify:*
  - QA counts the visible text blocks per frame from manifest timing and fails above 2.
  - A test asserts the font sizes.
  - Screenshot a private test post on a phone to check the caption band.

**3. Fine-detail bird and floppy with a reaction API.**
- *Rule:* Sprites share the fill pixel size. At detail 2 they draw with `buf.dot`, so the bird
  becomes a 44x28 physical-pixel sprite: the same on-screen size with 4x the detail. Sprites move
  in whole physical pixels. Each scene lists `reactions: [{ line, word?, pose, target? }]`:
  - `look` and `point` start 0.3 s before the word that names the target;
  - every beat gets at least one reaction;
  - the hook and the peak get `gasp`, and the answer gets `cheer`;
  - pose changes come at least 1 s apart, and at most one per 3 s.
- *Verify:* `out/bird-poses.png` (all six poses) for the owner. QA checks that every scene has a
  reaction and the peak has `gasp`. Add the checklist line: "No mixels: sprites, art and text share
  the 3 px grid."

**4. Transition helpers in `shot-kit.ts`.**
- *Rule:* Every scene boundary declares `transition: zoom | match | pan | iris | dither`. A world
  change uses zoom or match. `dither` is only for the same world, at 0.4 s or less. Pans keep the
  earlier motion direction.
- *Verify:* QA writes `out/epNNN-transitions.png`, 8 frames at 1/15 s steps around each boundary,
  and rejects `dither` between different worlds.

**5. Cover generator.**
- *Rule:* Every episode ships `out/epNNN-cover.png` from one template:
  - the peak image as the background;
  - a 2-4 word title at 96 or 120 px, 7 characters per line at most, with a 6 px outline;
  - the episode badge and the bird in fixed corners;
  - everything inside x 65-1015, y 280-1248, which also fits the 3:4 grid crop.
- *Verify:* render it from a Remotion `Still`. QA writes `out/grid-preview.png`: this cover and
  the previous 8, cropped to 3:4 at 360 px wide. Check the title is readable and the series looks
  consistent.

**6. Whole-pixel motion.**
- *Rule:* Camera, parallax and sprite offsets snap to physical pixels (1/K logical). A layer moves
  at least 1 physical px per frame, or holds still.
- *Verify:* a unit test on the snap helper, plus frame-by-frame checks of a slow pan for 6 px steps.
