# Competitor Shorts, watched frame by frame (2026-10-26)

The owner asked to watch the most-viewed videos in our style, frame by frame, and to improve our
episodes from what they do. This file is the synthesis; the method and limits are at the end.

## The videos

Ten YouTube Shorts: the most popular Shorts of faceless animated science channels, one weaker
Short from a big channel, and one pixel-art channel in our exact niche. Numbers measured on
1 fps frames at 270x480: mean brightness (luma, 0-255), mean saturation, mean frame-to-frame
difference ("motion"), and changes above 12 per 10 s ("big changes"). Our ep005-ep007 renders are
measured the same way.

| Views | Channel: title | Length | Luma | Sat | Motion | Big changes / 10 s |
|---:|---|---:|---:|---:|---:|---:|
| 255.4M | Zack D. Films: How Stitches Work | 31 s | 135 | 110 | 17.1 | 7.9 |
| 157.3M | Zack D. Films: How Long Are Your Blood Vessels? | 40 s | 123 | 141 | 39.6 | 9.2 |
| 51.0M | What If: What If Earth Was Shaped Like a Donut? | 15 s | 55 | 70 | 25.5 | 8.5 |
| 20.2M | Kurzgesagt: The Deadly Power of a Coin-Sized Black Hole | 56 s | 76 | 191 | 30.4 | 6.5 |
| 17.9M | What If: What If Your Skin was Bulletproof? | 57 s | 49 | 129 | 16.7 | 7.1 |
| 14.6M | Kurzgesagt: Something in Your Kitchen Emits Antimatter | 60 s | 142 | 177 | 26.2 | 4.5 |
| 8.4M | AsapSCIENCE: Why you hate the sound of your own voice | 56 s | 143 | 64 | 17.7 | 9.1 |
| 3.8M | RealLifeLore: Why Canada is WAY Further South Than You Think | 59 s | 63 | 112 | 17.7 | 6.1 |
| 0.48M | minutephysics: Why Driving Backwards Is So Hard | 49 s | 216 | 3 | 4.7 | 0.0 |
| 631 | Pixel Cosmos: 1 Magnet = 30,000x Earth, How MRI Works | 58 s | 27 | 188 | 4.9 | 0.7 |
| - | **Ours ep005** (lake) | 58 s | 55 | 148 | 17.6 | 6.9 |
| - | **Ours ep006** (solar storm) | 60 s | 61 | 158 | 21.5 | 6.8 |
| - | **Ours ep007** (lightning) | 58 s | 40 | 133 | 17.5 | 4.8 |

View counts are not age-normalised (2021-2026 uploads), so read them as "proven to work", not as
a ranking.

## What separates the winners from the losers

1. **Motion.** The two weak videos move about a third as much (motion about 5 against 16-40).
   Ours is already in the winners' range (17-21). Keep it there; QA should measure it.
2. **Frame 0 states the premise on mute and is already moving.** Stitches: a needle already in
   an open wound. Blood vessels: the vessels ripped out at 0.25 s. Donut: the impossible planet,
   centred, Moon entering by 0.25 s. The weak minutephysics short opens on a blank page; the pixel
   rival on a static room with a number.
3. **"You" and the everyday.** 6 of the 8 strong videos have "your"/"you" in the title or the
   first line (your blood vessels, your skin, your kitchen, your own voice, "appears before you",
   "than you think"). The weak ones are third person.
4. **A face reacts, big.** Kurzgesagt's mascot fills 35-80% of the frame height in the hook and
   the re-ask and is stretched, eaten and shocked; Zack D.'s man flinches with an "o" mouth at
   0.5 s; AsapSCIENCE's face changes every second. Our bird is about 18% of the frame width and
   never in close-up. The weak videos have no reacting face at all.
5. **Turns every ~14 s.** "But only if...", "But the human body has...", "And not only...",
   "Option 2". Ours has one re-hook before 20 s.

Brightness is not decisive (What If's dark space videos have 18-51M views), but the body and
everyday hits are bright (123-143) and the pixel rival is the darkest (27). ep007 (40) is our
darkest.

## Proposed rules (each checkable on our renders)

**Hook**

- **R1 Premise on mute at frame 0.** The 0 s frame, with text hidden, shows the subject in its
  "problem" state, centred, at least 50% of the frame width, and the 0.25 s frame differs from it.
- **R2 The first line is the title, in the second person.** It ends by 3 s; the headline repeats
  it. Third-person history hooks ("In 1986, a lake...") become "you" hooks.
- **R3 Three to four picture changes in the first 3 s**, one per caption chunk (Kurzgesagt's
  antimatter hook cuts every 0.75 s). Today our hook is one camera pull.

**Middle**

- **R4 A turn at least every 15 s:** "But...", "And not only...", "Option 2". The first turn may
  set up a wrong human-scale guess that the video corrects ("you'd think about this long").
- **R5 Escalate one thing across familiar landmarks** for the peak number (a red line: football
  field, then New York to the Grand Canyon, then around the Earth). Numbers sit in a small pill
  next to their object, and the peak becomes money or an everyday unit.
- **R6 Faces on things.** At least three throwaway gags per episode, including objects with faces
  (Kurzgesagt's sleepy plant pot, shocked jar, angry antimatter "evil twins").

**Mascot**

- **R7 Bird close-ups.** At least two reaction close-ups where the bird's head fills at least 40%
  of the frame width (hook and peak), plus at least four appearances in total. This needs the
  bird redrawn as a larger, expressive sprite (the Priority 4 redraw, now backed by evidence).

**Text**

- **R8 Captions in chunks of one to four words**, each up for 1.2 s or less. Ours shows 3-7
  words. Zack D. and Kurzgesagt place captions lower (about y 1500, 78% of the height) than our
  1250-1420 band; check on a phone before moving them.

**Ending and length**

- **R9 Loop instead of call to action.** None of the strong videos asks to follow or subscribe;
  RealLifeLore, the one with a spoken "subscribe", also ends on a 9 s near-still. The strongest
  endings are a sentence loop (the last caption "...because," completes with the first line) and a
  last frame that matches frame 0. Our save point plus "Follow Eight Bit Explains." is a call to
  action.
- **R10 Shorter.** The two biggest are 31 s and 40 s and the donut is 15 s; shorter videos get
  more replays. Ours are 58-60 s. A 35-45 s cut would have to drop depth that L16 asks for, so
  this is a test, not a rule: post one episode in both lengths when Trial Reels unlock.

**Measured by QA**

- **R11 Motion floor:** mean frame difference at 1 fps of at least 10 (weak videos sit at 5).
- **R12 Brightness floor:** mean luma of at least 50 over the episode, and no scene below 30.

## The pixel-art niche

Pixel science Shorts exist but are tiny: Pixel Cosmos (631 views), Science_in8bit (1.2k),
8-Bit Curiosity (1.3k), 8-Bit Engineers (1k). Pixel Cosmos does several things we do (pixel
headline, navy palette, counters, loop) and fails on what we already guard against: a locked
camera, a dark frame (luma 27), an empty bottom third, jargon numbers with no everyday
comparison, and no captions. The niche is open; the bar is the general science Shorts above.

## What is trending now

Recent science Shorts ranked by views per day (searched 2026-10-26, uploaded in the last 45 days):

| Views/day | Views | Age | Title (channel) |
|---:|---:|---:|---|
| 1.15M | 10.1M | 9 d | What If Iron Man Replaced His Organs? (Super Labs) |
| 690k | 0.79M | 1 d | Did you know the Hunter's Moon actually helped us survive? (Gloy Space) |
| 492k | 8.2M | 17 d | Why Your Fingers Can Never Actually Touch (MORGAR) |
| 340k | 0.72M | 2 d | What If We Cool Down the Sun? (Kurzgesagt) |
| 178k | 1.6M | 9 d | What if you lived 1 trillion years? (Lunarzone Animates) |
| 142k | 5.9M | 42 d | How Does a Chicken Make an Egg? (EcoplanturUSA) |
| 119k | 4.5M | 37 d | The Physics Behind Escaping This Pit! (Tuning Science) |
| 94k | 1.4M | 15 d | What if your SPEED doubled every 2 seconds? (Alternate Outcomes) |

Patterns: body "what ifs", the Moon (the Hunter's Moon this month), "what if" with time or speed
scaling, and everyday processes. The weekly scout (out/scout-2026-10-26.md) adds: the Moon is up
1.9x on Wikipedia (NASA's 2028 lander news, a possible first exomoon), an M7.0 earthquake in
Tibet, and a solar storm that delayed a train.

Topic candidates that combine a trend with our rules (sources to verify at the topic step;
public-domain US government only):

1. **"Why does the Moon look huge on the horizon?"** Moon trend, everyday, a known illusion
   (NASA).
2. **"What would happen to your body on the Moon?"** Moon trend plus a body "what if" (NASA).
3. **"What if the Sun switched off for a day?"** The "what if" plus the Sun format that is working
   now (NASA).
4. **"Could you feel an earthquake on the other side of the world?"** This week's M7.0 (USGS).
5. **"Why you can never really touch anything"** is proven (8.2M) but needs a public-domain
   source; drop it if none is found.

## Method and limits

- Each Short was opened in a headless Chromium (Playwright) with consent declined, the video
  paused and seeked, and the frame read from the video element: 0, 0.25, 0.5, 0.75, 1, 1.5, 2,
  2.5, 3 s, then every second to the end. Nothing was downloaded. Five agents analysed two videos
  each from the frames.
- No audio: voice, music and sound effects are unknown. Narration was read from burned-in
  captions where present (Zack D. blood vessels, Kurzgesagt, What If skin, RealLifeLore); the
  stitches and donut videos have none. Motion between 1 s samples is inferred.
- View counts are a snapshot and not normalised for age or channel size.
- Frames, contact sheets (`hook.png`, `body.png`) and the capture scripts are in /tmp/shorts and
  out/shorts (not in git).
