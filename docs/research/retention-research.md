# What keeps viewers watching a 45-60 s explainer reel

Research summary, October 2026. Scope: vertical 9:16 science explainers, faceless, AI voice, chiptune
music, word-highlight captions, on Instagram Reels and TikTok.

**Grades.** [PR] peer-reviewed paper or conference paper. [IND] platform or industry data (not
science: unknown methods, commercial interest). [EXP] expert or practitioner opinion. [MYTH]
folklore with no traceable evidence.

**Main caveat.** Almost no peer-reviewed work measures second-by-second retention of short-form
video. Most of the evidence below comes from nearby fields: ad zapping, MOOC video, multimedia
learning, curiosity research and news sharing. Platform statements tell us what the ranking
optimises. They do not tell us what causes viewers to stay. The blueprint at the end turns both
into rules. Each rule says how strong its evidence is.

---

## 1. Hook window (first 0-3 s)

| Finding | Number | Source | Grade |
|---|---|---|---|
| Instagram's Reels ranker explicitly predicts "how likely you are to watch less than three seconds". The 3 s mark is a ranking target, not folklore. | 3 s | Meta Transparency Center, Instagram Reels ranking system, https://transparency.meta.com/features/explaining-ranking/ig-reels-chaining/ | IND (official) |
| People spent about 1.7 s on a piece of mobile feed content (2.5 s on desktop). They recalled feed content at above-chance rates after 0.25 s of exposure. | 1.7 s / 0.25 s | Facebook IQ, "Capturing attention in feed" (2016), summarised at https://www.socialmediatoday.com/news/facebook-releases-new-guide-to-help-advertisers-maximize-video-ad-performan/450818 | IND |
| Over 63% of TikTok's highest-CTR ads showed the key message within the first 3 s. TikTok's help centre says to put the hook in the first 6 s and the proposition in the first 3 s. | 63% | TikTok for Business, "9 creative tips" https://ads.tiktok.com/business/en-US/blog/9-creative-tips-to-drive-auction-ad-performance ; https://ads.tiktok.com/help/article/creative-best-practices | IND (correlational) |
| Surprise concentrates attention. A rising level of joy is what keeps viewers from zapping. The dynamics matter more than the average. | n=58, eye tracking + face coding | Teixeira, Wedel & Pieters 2012, *Journal of Marketing Research* 49(2):144-159, https://research.tilburguniversity.edu/en/publications/emotion-induced-engagement-in-internet-video-ads/ | PR |
| Curiosity peaks at moderate confidence (inverted U). People are most curious about answers they think they half-know. | 40 trivia items, fMRI | Kang et al. 2009, *Psychological Science* 20(8):963-973, https://pubmed.ncbi.nlm.nih.gov/19619181/ ; replicated by Spitzer et al. 2023 | PR |
| Negative words in headlines raised click-through, and positive words lowered it. This holds within-story across Upworthy A/B tests. | ~105k variants, 370M impressions | Robertson et al. 2023, *Nature Human Behaviour* 7:812-822, https://epub.ub.uni-muenchen.de/94951/ | PR |
| Instagram photos with faces got 38% more likes and 32% more comments. These were photos, not video. | 1.1M photos | Bakhshi, Shamma & Gilbert 2014, CHI, pp. 965-974 | PR |
| Cartoon faces on learning graphics (anthropomorphism) plus pleasant colours improved retention. | d ≈ 0.39 (secondary source) | Brom, Starkova & D'Mello 2018, *Educational Research Review* 25:100-119, https://artemis.ms.mff.cuni.cz/main/papers/emodesign_manuscript_1rev_180928_FINAL_norev.pdf | PR (meta-analysis) |
| Cuts and motion trigger orienting responses that raise attention and encoding. | — | Lang et al. 2000, *J. Broadcasting & Electronic Media* 44(1):94-109 | PR |

**Applied.** No study isolates "motion in frame 1" or "text at frame 1" in short-form video. Two
things support them anyway: the orienting-response work, and the sound-off data in section 6. For
a faceless channel, the mascot's face is the nearest substitute for a human face. That is an
inference from Bakhshi and Brom, not something tested on reels. Tested hook openings include a
concrete stake or negative consequence (Robertson), surprise (Teixeira), and a question the viewer
half-knows (Kang). The claim that viewers decide within 1.3 s, attributed to a "Meta 2025 attention
study", could not be traced. [MYTH until sourced]

## 2. Retention-curve shape and length

- **Shape.** In measured sessions, swipes cluster at the start of a video and near its end. This
  gives a steep early cliff, a slow middle decay and a bump at the end. Source: Dashlet,
  short-video streaming study, arXiv 2204.12954, https://arxiv.org/pdf/2204.12954. Grade: PR
  (systems paper, measures behaviour, not content). Facebook (2016) reported that 65% of people who
  watch 3 s reach 10 s, and 45% reach 30 s. Grade: IND, primary source not located.
- **Platforms normalise for length.** Instagram predicts whether you will "watch more of a reel
  than 95% of users who watched reels of the same length" (Meta Transparency, above). Kuaishou
  engineers correct watch-time models for duration bias. Source: Zhan et al. 2022, "Deconfounding
  Duration Bias in Watch-time Prediction", KDD, https://arxiv.org/abs/2206.06003. Grade: PR.
  **Implication:** a 50 s reel is not penalised for being 50 s. It competes against other 50 s
  reels, so pick the length that fits the story and cut padding.
- **Length benchmarks.** TikTok recommends 21-34 s for in-feed ads
  (https://ads.tiktok.com/business/library/7TopCreativeTips.pdf). Grade: IND, ads only. Wistia
  reports that videos under 1 min average 52% engagement, with little difference between 1 and
  5 min (https://wistia.com/blog/optimal-video-length). Grade: IND, non-feed context. On edX,
  median engagement was near 100% for videos under 6 min and dropped steeply after that. Source:
  Guo, Kim & Rubin 2014, ACM Learning@Scale, doi:10.1145/2556325.2566239. Grade: PR, learners
  rather than scrollers. 45-60 s sits safely inside every benchmark.
- **Rewatch and loops.** No peer-reviewed evidence was found. Views now count replays: YouTube
  Shorts since March 2025, and Instagram as well. That makes a seamless loop a plausible
  view-count lever. Grade: EXP.

## 3. Curiosity gaps and open loops

- **Information-gap theory.** Curiosity arises when attention is drawn to a specific gap in one's
  knowledge. It needs some prior knowledge, so the viewer can see the gap. Source: Loewenstein 1994,
  *Psychological Bulletin* 116(1):75-98. Grade: PR (theory review).
- **Curiosity buys attention and memory.** In Kang et al. 2009, curiosity activated reward regions
  (caudate). People spent scarce tokens or waiting time to learn answers, and curiosity predicted
  recall of surprising answers 1-2 weeks later. Grade: PR. In Gruber, Gelman & Ranganath 2014,
  high-curiosity states improved memory for the answers and for unrelated faces shown while people
  waited, both immediately and after a day. The effect ran through midbrain-hippocampus coupling.
  Source: *Neuron* 84(2):486-496, https://pmc.ncbi.nlm.nih.gov/articles/PMC4252494/. Grade: PR.
  **Implication:** whatever appears during the wait for the payoff is remembered better. The
  anticipation window is the best place for the explanation itself.
- **Open loops: an honest version.** A 2025 meta-analysis found no reliable memory advantage for
  unfinished tasks (the Zeigarnik effect). People do reliably tend to resume interrupted tasks (the
  Ovsiankina effect). Source: Ghibellini & Meier 2025, *Humanities and Social Sciences
  Communications*, https://ideas.repec.org/a/pal/palcom/v12y2025i1d10.1057_s41599-025-05000-w.html.
  Grade: PR. Open loops work through anticipated reward (Kang, Gruber), not through a brain that
  "can't let go". "Zeigarnik makes viewers remember cliffhangers" is [MYTH].
- **Payoff late, but not only late.** Teixeira shows that joy needs to keep rising. An unpaid
  promise also risks "Not interested" taps, which Instagram predicts directly. Give small payoffs
  along the way and the big one near the end. Grade: EXP, inferred from PR and IND sources.

## 4. Pacing

- More edits raised physiological arousal, self-reported arousal and memory, without much extra
  cognitive load. Source: Lang et al. 2000 (above). Grade: PR. When fast pacing was combined with
  arousing content, verbal recognition fell while visual recognition held. Source: Lang, Bolls,
  Potter & Kawahara 1999, *J. Broadcasting & Electronic Media* 43(4):451-475. Grade: PR.
  **Implication:** fast visuals are fine, but the narration must stay simple when the visuals are
  intense.
- Average shot length in popular films fell from roughly 10-12 s in the 1930s to about 4 s today.
  Source: Cutting 2016, *Cognitive Research: Principles and Implications*,
  https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5256470/. Grade: PR (descriptive).
- "Change something every 2-3 s" is a practitioner heuristic. It fits the orienting-response
  literature, but no study tests it on reels. Grade: EXP.
- **Seductive details.** Interesting but irrelevant additions hurt recall and transfer, and visual
  ones hurt the most. Source: Rey 2012, *Educational Research Review* 7(3):216-237. A later pooled
  estimate puts the effect at g ≈ -0.33 (Sundararajan & Adesope 2020). Grade: PR. **Implication:**
  constant motion must show the mechanism, not decoration.

## 5. Narrative, emotion, numbers

- Narrative improves comprehension, interest and engagement for non-expert audiences. Source:
  Dahlstrom 2014, *PNAS* 111(S4):13614-13620, https://pmc.ncbi.nlm.nih.gov/articles/PMC4183170.
  Grade: PR (review).
- Content that evokes high-arousal emotions was more likely to be shared: awe, anger and anxiety.
  Sadness, a low-arousal emotion, reduced sharing. Practical utility, interest and surprise also
  helped. The study covered about 7,000 NYT articles plus lab experiments. Source: Berger & Milkman
  2012, *JMR* 49(2):192-205, doi:10.1509/jmr.10.0353. Grade: PR. The exact odds per emotion were
  not verified here, so none are quoted.
- A single identified person moves people more than statistics do (the identifiable-victim
  effect). Source: Small, Loewenstein & Slovic 2007, *Organizational Behavior and Human Decision
  Processes* 102:143-153. Grade: PR.
- Short "perspective" sentences improved recall of numbers, estimation and error detection. One
  example: "that's about the height of the Empire State Building". The studies had over 3,200
  participants. Source: Barrio, Goldstein & Hofman 2016, CHI,
  https://www.microsoft.com/en-us/research/?p=215388. A follow-up found the effects lasted six
  weeks (Riederer, Hofman & Goldstein 2018, CHI). Grade: PR.

## 6. Captions, voice, music

- **Sound-off viewing.** 69% of US adults watch video with the sound off in public, and 80% say
  they are more likely to finish a video that has captions. Source: Verizon Media and Publicis
  2019, n=5,616, self-reported. Grade: IND. Facebook found that captions raised ad view time by 12%
  on average. Grade: IND. A review of over 100 studies found captions improve comprehension,
  attention and memory. Source: Gernsbacher 2015, *Policy Insights from the Behavioral and Brain
  Sciences* 2(1):195-202. Grade: PR (review), strongest for non-native and hard-of-hearing viewers.
- **Redundancy.** Narration plus identical on-screen text plus animation hurts learning. Short
  captions that pick out key words help. Sources: Mayer & Johnson 2008, *J. Educational Psychology*
  100(2):380-386; Yue, Bjork & Bjork 2013. Spoken plus written text beats spoken alone only when
  there are no pictures. Source: Adesope & Nesbit 2012, *JEP* 104(1):250-263. Grade: PR.
  **Implication:** our 3-7 word captions are a compromise between sound-off reach and redundancy.
  Highlighting the current word works as signalling (section 8). Do not add a second block of text
  on top of the captions.
- **Voice pace.** On edX, faster and enthusiastic speakers held attention better; Brame cites
  185-254 wpm from this data. Sources: Guo et al. 2014; Brame 2016. Comprehension showed little
  loss up to 2x playback speed. Source: Murphy et al. 2021/22, *Applied Cognitive Psychology*,
  https://castel.psych.ucla.edu/wp-content/uploads/sites/111/2022/03/Applied-Cognitive-Psychology-2021-Murphy-Learning-in-double-time-The-effect-of-lecture-video-speed-on-immediate-and.pdf.
  Grade: PR. A modern TTS voice matched a human voice on learning and credibility, which weakens
  Mayer's older "human voice" principle. Source: Craig & Schroeder 2017, *Computers & Education*.
  Grade: PR, details from secondary sources.
- **Music.** Background music and sound effects reduced retention and transfer from narrated
  animations. Source: Moreno & Mayer 2000, *JEP* 92:117-125. Grade: PR. 88% of TikTok users say
  sound is essential to the experience. Source: TikTok/Kantar,
  https://ads.tiktok.com/business/tr/blog/kantar-report-how-brands-are-making-noise-and-driving-impact-with-sound-on-tiktok.
  Grade: IND. Both findings fit the style guide's ducked-music rule.

## 7. Endings, shares, saves

- **Peak-end rule.** Viewers' overall rating of a film clip was predicted by its peak moment and
  its final moment, while its length barely mattered. Source: Fredrickson & Kahneman 1993, *JPSP*
  65(1):45-55. Grade: PR. **Implication:** end on the strongest consequence or takeaway, not on a
  fade-out or a plea.
- **What Instagram ranks on.** Reshares, shares off Instagram, follows, comments, and "Interested"
  taps are all explicit predictions (Meta Transparency). Grade: IND (official). Mosseri's reported
  claim that watch time, likes per reach and sends per reach are the top three signals appears only
  in secondary sources. Grade: IND, unverified. "Sends are worth 3-5x likes" is [MYTH].
- Practical utility and awe drive sharing (Berger & Milkman). Grade: PR.
- **CTA placement and loop endings.** No peer-reviewed evidence was found. Grade: EXP only.

## 8. Learning research applied to short form

- **Signalling** (cue key words, arrows, colour) improves learning, d ≈ 0.38 across 29
  experiments. Source: Alpizar, Adesope & Wong 2020, *ETR&D*. Grade: PR (meta-analysis).
- **Coherence and weeding.** Cut extraneous sound, music and decoration (Moreno & Mayer 2000;
  Rey 2012). Grade: PR.
- **Segmenting** helps learning (Rey et al. 2019, *Educational Psychology Review*; effect size not
  verified here). A reel cannot pause, so apply it as clearly bounded "levels", each with one idea.
  Grade: PR, adapted.
- **Brame 2016** recommends: keep videos at or under 6 minutes; signal with two or three on-screen
  keywords; weed out background music and busy backgrounds; speak conversationally ("you", "I");
  speak at about 185-254 wpm with enthusiasm. Source: *CBE-Life Sciences Education* 15(4):es6,
  https://pmc.ncbi.nlm.nih.gov/articles/PMC5132380/. Grade: PR (review).

## Folklore to stop repeating

- **"Humans have an 8-second attention span, less than a goldfish."** It comes from a 2015
  Microsoft Canada marketing report that cited Statistic Brain, a source nobody could trace. It was
  debunked in Bradbury 2016, *Advances in Physiology Education* 40(4):509-513. [MYTH]
- **"Attention drops after 10 minutes of a lecture."** Weak evidence. Sources: Wilson & Korn 2007,
  *Teaching of Psychology*; Bradbury 2016. [MYTH]
- **"85% of Facebook video is watched without sound."** It comes from 2016 publisher anecdotes. Use
  the Verizon survey (69% in public) instead. [MYTH or weak IND]
- **"Viewers decide in 1.3 s", "47% of campaign value comes in the first 3 s", "sends = 3-5x
  likes".** None could be traced to a primary source. [MYTH until sourced]
- **"Unfinished stories are remembered better (Zeigarnik)."** Not supported by the 2025
  meta-analysis. [MYTH]

---

## Second-by-second blueprint for a 50 s reel

| Time | Visual | Voice | Text | Sound | Evidence |
|---|---|---|---|---|---|
| **0-1 s** | Camera already moving at frame 0, mid-action. Show the most striking image of the episode as a teaser of the peak. Mascot visible and reacting. | First word by 0.3 s. No greeting, no channel name. | Headline (≤6 words) on screen from frame 0, stating the stake or surprising number. | Voice plus a soft music bed. One small SFX accent is optional. | Meta "<3 s" prediction; Facebook 1.7 s; Lang (orienting response); Verizon (sound-off); Bakhshi and Brom (faces) |
| **1-3 s** | First zoom or dive by ~2.5 s. | Finish the hook: a concrete number or consequence plus an open question the viewer half-knows ("...so how did a wave get taller than a skyscraper?"). | Captions start; the key number is highlighted. | Duck the music under the voice. | TikTok 63% / 3 s; Kang (moderate confidence); Robertson (stakes); Teixeira (surprise) |
| **3-8 s** | Establish the world. Three depth layers. A visual change every 2-4 s. | Say why it matters to *you* (conversational); promise the answer. | Captions, 3-7 words. | Bed only. | Brame (personalisation); Dahlstrom (narrative) |
| **8-20 s** | Level 1: one causal step per shot. A visual metaphor that shows the mechanism, with no decorative motion. | One idea per sentence. 165-190 wpm. | Highlight the key term (signalling). | No SFX on top of words. | Lang 1999 (keep words simple when visuals are busy); Rey (seductive details); Alpizar (signalling) |
| **~15 s** | Mini-payoff: a visible partial answer, then a new question (re-hook). | "But that's not the strange part..." | — | Small musical lift in the gap. | Teixeira (rising joy); Gruber (anticipation boosts memory) |
| **20-32 s** | Level 2: escalation, bigger scale, the camera journey continues. | Narration stays clear while the visuals intensify. | One perspective comparison for each number. | — | Barrio (perspectives); Lang 2000 (edits help memory) |
| **32-40 s** | **Peak.** The surprising number at human scale (person, building, bathtub). The biggest visual, with glow. Mascot reacts. | Short sentence, then a 0.5 s pause. | Number plus perspective, large. | Music rises into the pause. | Berger & Milkman (awe); Fredrickson & Kahneman (peak); Small et al. (human scale) |
| **40-46 s** | Consequence for people or the planet. Close the opening question visibly. | Answer the hook question explicitly. | — | Duck again. | Loewenstein (close the gap); Berger (practical utility) |
| **46-50 s** | Takeaway image. The last frame visually rhymes with frame 1, so the replay feels seamless. | One quotable takeaway line. The reel ends on the last word, with no dead air. | Optional share prompt, ≤1 s, never over the payoff line. | Music resolves on the cut. | Peak-end rule; Meta reshare/follow predictions; loops [EXP] |

## Checklist (each rule is checkable on the render)

1. Frame 0 differs from frame 3 (motion present). No title card or logo in the first 3 s.
2. Headline is visible at frame 0, ≤6 words, inside the safe zone.
3. First spoken word starts at ≤0.3 s.
4. By 3.0 s the voice has stated a concrete number or consequence and an open question.
5. No shot stays visually static for more than 3 s, and every moving element relates to the
   narration.
6. Captions show 3-7 words, highlight the current word, and colour the key term. There is no second
   text block that duplicates the narration.
7. Speech rate is 160-200 wpm (word count divided by voiced seconds).
8. Music sits 15-18 dB under the voice while it speaks. SFX are at least 10 dB under the voice and
   never overlap a word.
9. Every large number has a human-scale perspective comparison, on screen and in the voice.
10. At least one mini-payoff lands before 20 s, and a re-hook line follows it.
11. A single peak (biggest visual plus surprising number) lands between 30 and 42 s.
12. The opening question is answered explicitly before the final 5 s.
13. The final line is a consequence or takeaway, not a CTA. Any CTA lasts ≤1 s and comes after it.
14. The last frame rhymes visually with the first frame, with ≤0.3 s of silence after the last
   word.
15. Total length is 45-55 s. Any sentence that does not serve the opening question is cut.
