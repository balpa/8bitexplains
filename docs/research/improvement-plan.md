# Improvement plan (2026-10-20)

Synthesis of four studies, each with graded sources:

- docs/research/growth-and-data.md: platform ranking, AI labelling, posting, data loop
- docs/research/audio.md: prosody, Kokoro controls, music arc, sound design
- docs/research/visual-craft.md: mascot, hold time, transitions, mixels, text and cover
- docs/research/explanation-depth.md and retention-research.md: already applied as L15-L17

## Hard constraints found

1. **AI label on every post, on both platforms.** A reel narrated by a realistic AI voice must be
   labelled: Instagram "Add AI label", TikTok "AI-generated content". On TikTok the label does not
   change distribution; unlabelled realistic AI content can be removed or restricted. Instagram's
   newer "AI-generated profile" label (31 Aug 2026) is only for accounts that feature an
   AI-generated person, so it does not apply to us.
2. **Upload the master render natively on each platform.** Never re-upload a downloaded file
   (watermark), never post the same video twice on one platform.
3. **Instagram: at most 5 hashtags.** Trial Reels unlock at 200 followers.
4. **TikTok Creator Rewards pays only for videos over 60 s.** We stay at 55-60 s for now; this is
   an open decision for later (near 10K followers).
5. **Captions may sit in the app UI zone.** Meta's Reels ad spec keeps the bottom 35% clear
   (from y 1248); our captions are at y 1250-1420. There is no official organic figure, so check it
   on a phone with a real post before moving anything.

## Priority 1: launch and start measuring (biggest unknown is real viewer data)

- Owner: creator account on Instagram, personal account on TikTok, same handle, the bird as the
  avatar, bio says "AI voice".
- 3 posts a week on fixed days, same day on both platforms.
- The first caption line is the searchable question and matches the on-screen headline. Add 3-5
  specific hashtags.
- Cover frame per episode: one series template, title 96-120 px, inside x 65-1015 and
  y 400-1248, so the 3:4 grid crop and the UI both leave it readable.
- `docs/data/posts.csv` with snapshots at 72 h and 7 d; weekly 20-minute routine; compare each
  video with the median of the last 10; a test becomes a rule only after 6 matched pairs agree.

## Priority 2: cheap QA guards (stop known flaws from coming back)

- **Hold-time check** in `tools/qa.py`: frames at 2 fps, caption band removed, 45x49 cells,
  brightness-normalised, change threshold 0.20; warn above 3 s still, fail above 4 s, outro exempt.
  Calibrated on our renders, it catches the stretches seen by eye (ep005 16 s, ep006 14.5 s,
  ep007 31 s).
- **Text layout rule** in `Episode.tsx`: captions plus at most one other text block; hide the HUD
  and the headline while a stat or reveal is up; font sizes in multiples of 24 px so Press Start 2P
  lands on the 3 px grid.
- **Short-line warning**: Kokoro reads lines under about 20 tokens weakly.

## Priority 3: audio with an emotional arc

- **Per-line pauses** in `tts.py` (`{text, pause, speed}`): 0.5 s after the mechanism's "click"
  line, 0.6 s after the peak line, the peak line read 0.1 slower; at most 3 marked pauses. QA checks
  gap lengths.
- **Music arc from the manifest** in `chiptune.py`: motif in the hook, quiet bed under the how
  scenes, build towards the peak, stop on the peak line, hit in the pause after it, resolve on the
  tonic in the outro. Key, mode and tempo per episode instead of one 132 BPM Am-F-C-G loop.
- **Sounds tied to events**: replace the generic per-scene blip with a sound that something on
  screen causes (thunder after a bolt, gas hiss, telegraph crackle), only in gaps, within 1 frame
  of the event. Keep zap, level-up and save as fixed-meaning sounds.
- **Voice blend A/B** (am_michael with puck or fenrir): a taste choice for the owner, by ear.

## Priority 4: visual craft

- **Bird and floppy redrawn at fine detail** with six actions: idle, look, point, gasp, sweat,
  cheer. One action every 3-6 s, held at least 1 s. Look and point start 0.3 s before the word they
  refer to, aimed at the thing being named (signalling and gaze cueing help learning; extra
  gestures do not).
- **Transitions** in `shot-kit.ts`: zoom-through, match cut, directional pan, iris wipe. Keep the
  dither dissolve only for same-world changes of 0.4 s or less.
- **Whole-pixel motion**: positions snap to physical pixels to stop shimmering.

## Order of work

1. Priority 2 guards and the cover generator, then re-render ep005-ep007 so they are ready to post.
2. Owner opens accounts and posts ep005-ep007 with the checklist; data collection starts.
3. Priority 3 audio, then Priority 4 visuals, one at a time, each checked against the data.
