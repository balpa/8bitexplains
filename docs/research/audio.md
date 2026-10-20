# Audio: emotion and emphasis without SFX clutter

Research summary, 2026-10-20. The problem: the reels feel flat. The aim is more emotion and emphasis
without breaking L6 (at most one SFX per scene, never on a word, at least 18 dB under the voice).

**Grades.** [PR] peer-reviewed. [OFF] official docs, a standard or the tool's own repo. [IND]
industry or vendor data. [EXP] expert or practitioner opinion. [LOCAL] tested on this machine, with
the result reported. "Abstract" means only the abstract was read.

## 0. Why it sounds flat (from reading the code)

- **One speed for every line.** `tts.py` passes `episode["speed"]` (1.18-1.2) to every line. Every
  gap is 0.2 s; the only exception is the 1.0 s before the follow line. Nothing in the timing marks
  a line as important.
- **One loop for the whole reel.** `chiptune.py` plays the same 132 BPM Am-F-C-G loop from start
  to finish, in every episode, ignoring the story's beats.
- **Ducking is the only dynamic.** `Episode.tsx` switches music between 0.2 under speech and 0.42
  in gaps: about -34 LUFS under speech (about 20 dB below the -14.3 LUFS voice) and about
  -27.5 LUFS in gaps. The levels are fine; the only shape the music has is "someone is talking".
- **The SFX are generic.** Every scene gets the same `blip`, the hook gets `zap` and the outro
  `save`, all at 0.25 volume. None of them belongs to anything on screen.

The fix is contrast, not more layers. Vary timing and level at a few chosen moments and keep
everything else steady.

## 1. Prosody and pausing

| Finding | Source | Grade |
|---|---|---|
| A silent pause *before* a word made listeners more likely to recognise that word later. It also changed how the word was processed (ERP). | MacGregor, Corley & Donaldson 2010, *Neuropsychologia* 48:3982-3992, https://doi.org/10.1016/j.neuropsychologia.2010.09.024 | PR (abstract) |
| A filler before a word improved recall of it; a cough of the same length did not. The gain comes from attention, not from extra time, so a pause has to be clean. | Fraundorf & Watson 2011, *JML* 65:161-175, https://pmc.ncbi.nlm.nih.gov/articles/PMC3134332/ | PR |
| A contrastive pitch accent (L+H*) improved memory for the accented item and helped listeners reject its alternative. | Fraundorf, Watson & Benjamin 2010, *JML* 63:367-386, https://pmc.ncbi.nlm.nih.gov/articles/PMC2935187/ | PR |
| Pauses and visual cues both drive the segmenting benefit. | Spanjers et al. 2012 (cited in explanation-depth.md) | PR (abstract) |
| **Voice principle.** Learners transferred better from a human voice than a machine voice (2003 synthesis). | Mayer, Sobko & Mautone 2003, *JEP* 95:419-425, https://doi.org/10.1037/0022-0663.95.2.419 | PR (abstract) |
| With a *modern* TTS engine, perceptions, learning and efficiency were mostly not different from a recorded human voice. An older engine did worse. | Craig & Schroeder 2019, *J. Educational Computing Research*, https://doi.org/10.1177/0735633118802877 (follows Craig & Schroeder 2017, *Computers & Education* 114:193-205) | PR (abstract) |
| For long stories, listeners enjoyed human narration more than synthetic. With the human voice they formed more mental images, paid more attention and remembered more. | Rodero & Lucas 2021, *New Media & Society*, https://doi.org/10.1177/14614448211024142 | PR (abstract) |
| A positive instructor (voice, face, gesture) made learners rate the lesson as more engaging, and they scored higher on a *delayed* test. There was no difference on the immediate test. | Lawson et al. 2021, *ETR&D*, https://doi.org/10.1007/s11423-021-10057-w | PR (abstract) |
| A happy instructor raised motivation but not test scores. | Horovitz & Mayer 2021, *Computers in Human Behavior*, https://par.nsf.gov/servlets/purl/10341389 | PR (secondary summary) |
| Moderate intonation at a medium rate beat both flatter and more exaggerated delivery on credibility and on attention and arousal. The authors call this the "expressive balance effect". | *J. Language and Social Psychology* 2022, https://doi.org/10.1177/0261927x221078317 | PR (abstract) |
| Faster, enthusiastic speakers held attention on edX (185-254 wpm), and comprehension held up to 2x playback. | Guo et al. 2014; Murphy et al. 2022 (see retention-research.md) | PR |

**What this means for us.** TTS is good enough for *learning* (Craig & Schroeder). Its cost is
*engagement and emotion* (Rodero & Lucas; Lawson), so prosody is the lever left. The cheapest
emphasis with evidence behind it is a short clean silence *before* the key number (MacGregor) and
a longer one *after* the peak (segmenting). The lengths are ours, not from a study: 0.3 s before,
0.6 s after. [EXP] Contrast is what makes emphasis work, and overdoing it hurts (expressive
balance), so mark only 2-3 moments: the hook question, the "click" line and the peak. Slightly
slowing the peak line fits how prominence is heard, but no study tests it in short video. [EXP]

## 2. What Kokoro and kokoro-onnx can control

We run kokoro-onnx 0.6.1 (MIT) with the Kokoro-82M v1.0 ONNX model (Apache 2.0) and espeak-ng G2P.

| Lever | Status | Grade |
|---|---|---|
| **Per-call speed** (0.5-2.0) | Works. `create()` takes `speed` on every call, so lines can differ. "One flash carries about a hundred million volts." took 3.05 s at speed 1.0, 2.71 s at 1.18 and 2.43 s at 1.3. | LOCAL |
| **Punctuation pauses** | `create()` takes `sentence_pause` (default 0.25 s) and `clause_pause` (default 0.1 s) and adds them at `. ! ? …` and `, ; :`. Writing "about... a hundred million volts" or "about — a hundred…" added 0.26 s. The Kokoro demo space also suggests punctuation `;:,.!?—…"()“”` for intonation. | LOCAL; OFF (https://huggingface.co/spaces/hexgrad/Kokoro-TTS) |
| **Phoneme input** | `create(ph, is_phonemes=True)` works with the IPA string from `tokenizer.phonemize()`. The vocabulary includes stress marks `ˈ ˌ`. | LOCAL; OFF (misaki EN_PHONES.md, https://github.com/hexgrad/misaki) |
| **Stress marks for emphasis** | Weak. The demo says raising stress "only works on less stressed, usually short words". We added `ˈ` to "that" in "So how does it get that hot?". The length was unchanged and the 90th-percentile pitch moved 163 to 159 Hz (crude autocorrelation tracker), which is no audible emphasis. Capital letters ("THAT") produced identical audio. | OFF; LOCAL |
| **misaki stress syntax** `[word](+2)`, `[word](-1)`, `[word](/phonemes/)` | Exists in misaki (Apache 2.0), the G2P Kokoro was trained with. kokoro-onnx uses espeak by default and recommends misaki for v1.0. Switching G2P is a bigger change; test it on one line first. | OFF |
| **Voice blending** | A style vector is a numpy array, so `0.7*am_michael + 0.3*am_puck` can be passed as `voice`. That ran (2.58 s for the test line). It changes timbre and liveliness, not emphasis. Which blend sounds best is a taste call. | LOCAL |
| **Other voices** | 54 voices under the same Apache licence. US male voices graded C+: am_michael, am_fenrir, am_puck. The rest are D or F+. af_heart (A) and af_bella (A-) are the best-graded voices overall. Only ja/fr voices list CC BY training data, so the English voices carry no extra terms. | OFF (VOICES.md, https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md) |
| **Short lines are weak** | VOICES.md warns of weakness on utterances under about 10-20 tokens and rushing over about 400. "Five times the Sun's surface." and "That bang is thunder." are near that edge. | OFF |
| **Phoneme timings** | `create_timed()` exists, but the v1.0 ONNX export has no duration output, so it returned 0 timings. Word-level timing would need a different export. | LOCAL |

**Emphasis levers, best first:** silence per line, speed per line, a pause mark before the key
number, and a voice blend as a taste A/B test. Treat misaki `(+2)` as an experiment only.

## 3. Music

| Finding | Source | Grade |
|---|---|---|
| Adding background music and/or sounds to a narrated animation (the lightning lesson) lowered retention and transfer. | Moreno & Mayer 2000, *JEP* 92:117-125, https://doi.org/10.1037/0022-0663.92.1.117 | PR |
| Meta-analysis: no global effect, which hides specific ones. Music disturbs reading, has small negative effects on memory, and *improves emotional reactions*. Tempo carries over into the tempo of activity. | Kämpfe, Sedlmeier & Renkewitz 2011, *Psychology of Music* 39:424-448, https://doi.org/10.1177/0305735610376261 | PR (abstract) |
| Only *fast and loud* instrumental music pushed reading comprehension below silence. Slow or quiet music did not. | Thompson, Schellenberg & Letnic 2012, *Psychology of Music*, https://doi.org/10.1177/0305735611400173 | PR (abstract) |
| De Groot 2006 found that music helped vocabulary learning; a 2016 replication did not. | Küssner et al. 2016, https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4990275/ | PR, mixed |
| Tempo changes arousal and mode changes mood, mostly independently. | Husain, Thompson & Schellenberg 2002, *Music Perception* 20:151-171, https://doi.org/10.1525/mp.2002.20.2.151 ; Gagnon & Peretz 2003, https://doi.org/10.1080/02699930302279 | PR |
| Positive or negative soundtracks steered how viewers read ambiguous film clips and what they remembered a week later. | Boltz 2001, *Music Perception* 18:427-454, https://doi.org/10.1525/mp.2001.18.4.427 | PR (abstract) |
| Peak pleasure in a breakdown, build-up and drop sat on the *drop*, with the highest skin conductance there. | Solberg & Dibben 2019, *Music Perception* 36:371-389, https://eprints.whiterose.ac.uk/145911/ | PR (abstract) |
| Tension comes from instability and uncertainty that build predictions, and it releases when they resolve. The model is the same across music and film. | Lehne & Koelsch 2015, *Frontiers in Psychology* 6:79, https://doi.org/10.3389/fpsyg.2015.00079 | PR (theory) |

**What this means for us.** Music under speech is a cost to learning, and fast and loud is worst.
Its benefit is emotional. So keep it low and slow-feeling *under words*, and put its energy *into
the gaps*. That is what ducking already does; the music just needs a shape over the reel. The
build-and-release pattern has physiological support (Solberg & Dibben). In a reel, the release
lands in the silence after the peak line, never on top of it.

**Score structure for science shorts.** We found no published interview on how Epic Mountain
scores Kurzgesagt. This is common practitioner practice and what we hear in the genre. [EXP]
Open with a signature motif and reuse it at the end. Put a low bed (bass plus soft arpeggio, no
busy lead) under the explanation. Build in the 4-8 s before the reveal. Stop to near silence for
the reveal line, and hit with the full texture in the pause after it. Resolve to the tonic at the
outro so the loop restarts cleanly. Mode sets the mood (Husain): minor for harm, major or Lydian
for wonder. Keep the BPM steady and get the sense of speed from note density.

## 4. Sound design, synchrony, loudness

| Finding | Source | Grade |
|---|---|---|
| A short tone synchronised with a visual change made that change pop out and cut search time sharply, even though the tone carried no location information (the "pip-and-pop" effect). | Van der Burg et al. 2008, *JEP:HPP* 34:1053-1065, https://doi.org/10.1037/0096-1523.34.5.1053 | PR (abstract) |
| Audio-visual binding depends on timing and has a tolerance window. Speech tests put the detection threshold at roughly 45 ms of audio lead and 125 ms of audio lag. Secondary sources disagree on the sign convention. | Vroomen & Keetels 2010 review, https://doi.org/10.3758/app.72.4.871 ; ITU-R BT.1359 via NTIA, https://its.ntia.gov/publications/download/11-474.pdf | PR (not read); OFF (secondary) |
| Descriptive sound effects in an audio story increased mental imagery and attention. | Rodero 2012, *Communication Research* 39:458-479, https://doi.org/10.1177/0093650210386947 | PR (abstract) |
| With AI voices, music or SFX alone enriched imagery, but the two together risked overwhelming listeners. | *Information Technology & Tourism* 2025, https://doi.org/10.1007/s40558-025-00332-4 | PR (abstract) |
| Earcons are abstract motifs that get their meaning by learning and consistency. Auditory icons are everyday sounds whose meaning is obvious. | Blattner, Sumikawa & Greenberg 1989, *HCI* 4:11-44, https://doi.org/10.1207/s15327051hci0401_1 ; Gaver 1986, https://doi.org/10.1207/s15327051hci0202_3 | PR (classic) |

**When a sound helps.** A sound helps when it is (a) caused by something on screen (thunder when
the flash lands, a hiss as the gas rises), (b) in sync with that event within about a frame, and
(c) in a gap between words. Then it works as a pip-and-pop attention cue and as an imagery cue
(Rodero). A sound hurts when it is decorative or stacked on music and voice at once (Moreno &
Mayer; the 2025 study). Brand earcons work only if each sound always means one thing:
`save` = episode end, `levelup` = new LEVEL. The generic per-scene `blip` means nothing, so it
is clutter.

**Loudness.** Neither Instagram nor TikTok publishes a loudness target or normalisation spec. We
searched; every figure out there comes from a vendor blog, and they disagree (-10 to -16 LUFS).
[IND] The AES streaming recommendations (TD1004 and TD1008, via summaries) anchor speech at about
-18 LUFS and keep true peak at -1 dBTP or below, with a margin for lossy re-encoding (Telos
summary, https://docs.telosalliance.com/docs/understanding-loudness-for-streaming-audio).
[OFF via IND] Keep our -14 LUFS / below -1 dBTP target. It is the common convention for
platforms that turn loud uploads down, and QA already enforces -15 to -13 LUFS.

## 5. Free, commercial-safe samples (the default stays procedural)

We keep synthesising everything in `chiptune.py`, so there is no licence risk and the sound is
our own. If we ever need a sample, these are the options:

| Source | Licence (checked on the official page) | Notes |
|---|---|---|
| Kenney, https://kenney.nl/assets/category:Audio | CC0; commercial use OK; no attribution needed; don't use the Kenney logo (https://kenney.nl/support) | Interface, Impact, Sci-fi, Digital Audio, RPG and Music Jingles packs. Safest choice. |
| Freesound, CC0 filter: https://freesound.org/search/?f=license%3A%22Creative+Commons+0%22 | Each sound is CC0, CC BY, CC BY-NC or legacy Sampling+ (https://freesound.org/help/faq/) | Use only the CC0 filter. The "Free Cultural Works" filter also lets CC BY through. Check each sound's own page and save that page with the file. |
| OpenGameArt, CC0 sound effects: https://opengameart.org/art-search-advanced?field_art_type_tid%5B%5D=13&field_art_licenses_tid%5B%5D=4 | Mixed: CC0, CC-BY, CC-BY-SA, OGA-BY, GPL. The FAQ says its licence summaries may contain errors (https://opengameart.org/content/faq) | CC0 only. SA and GPL are out (SA is banned by our rules). |
| Sonniss #GameAudioGDC, https://sonniss.com/gdc-bundle-license/ | **Not CC0.** Royalty-free licence: commercial use OK, no attribution needed, videos count as projects. You may not redistribute the sounds as sound effects or use them for AI training. | It meets our "free + commercial" rule, but it is a custom licence. If we use it, keep a copy of the licence version from the download date. |

## Pipeline changes (priority order)

Each item names the rule it would become and the QA check. Adding about 1.2 s of pauses means
cutting about 4 words or adding 0.02 to `speed` to stay within 60 s (L16).

1. **Per-line pause and speed in `tts.py`.** A `vo` item may become
   `{"text": "...", "pause": 0.6, "speed": 1.08}`; plain strings keep today's behaviour. Defaults:
   0.2 s after a line; 0.5 s after the mechanism's "click" line (tag it `"click": true`); 0.6 s
   after the peak line; peak line speed = episode speed minus 0.1; the 1.0 s outro pause stays.
   Record `pauseAfter` and `speed` per line in the manifest. *Rule:* "Emphasis by silence: at
   most three marked pauses per reel" (MacGregor; segmenting; expressive balance).
   *QA (`qa.py` script_checks):* the gap after the peak line is at least 0.5 s; the gap after
   the click line is at least 0.4 s; every unmarked gap is 0.35 s or less; at most 3 gaps are
   over 0.35 s, not counting the outro pause; the peak line's wpm is at least 8% below the median.
2. **Pre-number pause.** The peak line puts a pause mark ("…" or "—") before its number, which
   adds about 0.26 s in Kokoro (LOCAL). Optionally, pass `clause_pause` per line. *Rule:* "The big
   number comes after a breath" (MacGregor). *QA:* a lint check that the peak `vo` has "…" or "—"
   before its first digit or number word.
3. **Music arc in `chiptune.py`.** Build the score from the manifest's beats and line frames,
   not one loop. Hook: 2-bar motif. How: bass and soft arpeggio, no lead under words. 4-8 s
   before the peak: build (denser, one octave up). Peak line: stop (a low triangle at -12 dB or
   less). Post-peak pause: hit (full texture, bright chord). Answer and aftermath: calmer bed.
   Outro: tonic on the last word. Pick key, mode and lead per episode (minor for harm, major or
   Lydian for wonder) so consecutive episodes never share a loop. *Rule:* "The music has a
   shape: motif, bed, build, stop, hit, resolve" (Solberg & Dibben; Lehne & Koelsch; Husain).
   *QA:* on `music.wav`, the RMS over the 3 s before the peak line is at least 3 dB above the
   how-section bed; the RMS during the peak line is at least 12 dB below the bed; the RMS in the
   post-peak pause is at least the bed level; the last 0.5 s ends on the tonic (by construction,
   asserted in `test_chiptune.py`).
4. **A bigger post-peak opening in `Episode.tsx`.** `musicVolume` uses OPEN = 0.42 in gaps. Allow
   0.6 in the marked pause after the peak (read `pauseAfter` from the manifest) so the hit is
   heard, and keep DUCKED = 0.2 under all speech. *Rule:* the same rule as item 3; the voice
   still wins under words (Moreno & Mayer; Thompson). *QA:* the existing scene balance check
   (music at least 15 dB under voice during speech) still passes.
5. **Diegetic sounds instead of `blip`.** Replace the generic per-scene `blip` with one
   procedural sound for an on-screen event: thunder when the bolt lands, hiss, crackle, splash.
   Each shot declares `events: [{frame, sound}]`. The sound plays only in a gap and sits within
   1 frame of the visual event. Scenes with no such event get no sound. Keep `zap`, `levelup`
   and `save` as earcons with one fixed meaning each. *Rule:* L6 extended: "a sound needs a
   visible cause or a fixed meaning" (pip-and-pop; Rodero 2012; Blattner). *QA:* every SFX
   frame is at least 3 frames away from every line window; at most 1 SFX per scene; peak at
   least 18 dB under the voice; every non-earcon SFX has a matching shot event within 1 frame.
6. **Short-line guard.** QA warns when a line phonemizes to fewer than 20 tokens. The author
   either merges the line or accepts it after listening. *Rule:* follows VOICES.md.
7. **Voice blend A/B (taste).** Render the hook and peak lines with am_michael alone, with
   80/20 michael and puck, and with 80/20 michael and fenrir, and show the owner the three
   clips. No QA check; the owner's pick goes in the episode JSON as `voice_mix`.
8. **Experiment, not a default: misaki G2P with `(+2)` stress** on the peak number, compared
   with espeak on the same line. Adopt it only if a pitch or length change can be heard.

Not recommended: more SFX layers, louder music, emphasis on every key word, tempo changes in the
music, or relying on capital letters or `ˈ` marks (no effect in our test).
