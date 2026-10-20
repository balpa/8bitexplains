# Growth and data: distribution, AI labels, metrics and the measurement loop

Research summary, 20 October 2026. Hook, pacing and retention-curve evidence lives in
`retention-research.md` and is not repeated here.

**Grades.** [OFF] official platform documentation. [PR] peer-reviewed. [IND] industry dataset or
trade press (unknown methods, commercial interest). [EXP] practitioner opinion or our own
inference. [MYTH] folklore with no traceable source. Sources are numbered [S1]-[S31] at the end;
every URL was loaded on 2026-10-20.

## Hard constraints (read first)

1. **Every reel gets the AI label on both platforms.** The Kokoro narration is a realistic AI
   voice, and both platforms require a label for that (section 2).
2. **TikTok Creator Rewards needs videos over one minute** [S22, OFF]. Our 55-60 s format earns
   nothing there. It matters only near 10K followers.
3. **Instagram Trial Reels need a public professional account with 200+ followers** [S11, OFF].
4. **Instagram allows at most 5 hashtags per caption** (from Dec 2025) [S16, IND].
5. **No other platform's watermark, ever.** Never post the same video twice on one platform.

---

## 1. How a new account's videos get distributed

**Instagram**

- **There is a test audience, but no stated time window.** Eligible reels go first to a small
  audience, followers or not. The best performers go wider, and the best of those wider again
  [S8, OFF, 2024]. The "first-hour test" is [MYTH]; no Meta source gives a window.
- **What the ranker predicts:** watching less than 3 s (it counts skips within 2 s), watching
  more of a reel than 95% of viewers of reels the same length, comments, reshares, shares off
  Instagram, follows, and "Use audio" taps [S6, OFF, updated Nov 2025]. Mosseri named watch time,
  likes and sends as the top three signals. Sends count slightly more for non-followers, likes
  for followers [S28, IND reporting his video, Jan 2025].
- **What gets content down-ranked.** The Recommendations Guidelines list unoriginal content that
  is "largely repurposed" with minor edits. They also list long captions unrelated to the content,
  and coordinated comment networks [S7, OFF]. Watermarked reels and reels already posted on
  Instagram are made less visible [S10, OFF, 2023]. When a copy is detected, only the original is
  recommended [S8].
- **Originality, 2026 version.** An account stays eligible for recommendations only if most of
  what it posted in the last 30 days is original. 75% of US recommendations now come from
  original posts [S9, OFF, Apr 2026]. Our material is generated in code, so this works for us.
  Limits show up under Account Status.
- **Trial Reels** go only to non-followers. Insights arrive within 24 h, and a trial can be shared
  to followers by hand or automatically. Content shared before "may get limited reach". Trials do
  not affect your normal reels [S11, OFF; S12, OFF, Dec 2024].

**TikTok**

- **Follower count and past hits are not direct factors.** Finishing a longer video is a strong
  signal [S17, OFF, 2020]. The system predicts likes, shares, comments and skips, and reads the
  caption, sound, hashtags and length. A similarity check swaps out near-duplicates, for example
  videos with the same sound [S18, OFF].
- **Exploration is large.** Only 30-50% of a new user's first 1,000 videos matched interests
  they had already shown. Following was the main driver of personalization [S23, PR, 347 users,
  9.2M recommendations]. That leaves room for unknown creators and makes follows valuable [EXP].
- **Unoriginal** means copied, repurposed without creative edits, low-value compilations, or
  carrying someone else's watermark. It may be removed from the For You feed and cannot be
  monetized [S19, OFF, Sep 2026]. **Content Check Lite** (TikTok Studio web) checks For You
  eligibility before posting [S20, OFF, 2025].
- In 400 labelled TikTok videos, follower count predicted virality best, and on-screen text also
  helped [S24, PR, small sample]. Early posts will be small whatever their quality.

## 2. AI-generated content disclosure (2026)

**Instagram / Meta** [S1, OFF; Help Center checked 2026-10-20]

- **Required:** "photorealistic video or realistic-sounding audio" that was digitally generated or
  altered, including with AI. One of Meta's own examples of content that needs a label is "a reel
  narrated with a realistic AI-generated voiceover". That describes our reels exactly.
- **Not required:** a cartoon-style video, or images. Our pixel art on its own would not need a
  label. The voice does.
- **How:** while creating the reel, turn on **Add AI label**. The separate "AI-generated
  profile" label is aimed at accounts featuring photorealistic AI people [S7], so we skip it [EXP].
- **Penalty:** "There may be penalties if you do not label content as required." The penalties
  are not specified. Meta may also apply the label itself when it detects AI signals.
- **Distribution:** no Meta source says the label lowers reach. Only fact-checker ratings of False
  or Altered do that [S5, OFF, updated Sep 2024].

**TikTok** [S2, OFF; S3, OFF, released 25 Aug 2026, effective 24 Sep 2026]

- **Required:** TikTok requires a label on all AI-generated content "that contains realistic
  images, audio, and video". Its own example of significant AI editing is AI-generated speech.
- **How:** tap Next, then More options, and turn on **AI-generated content**. The post shows
  "creator labeled as AI-generated".
- **Distribution:** "Turning on the AI-generated content setting won't affect the distribution of
  your video" as long as the video follows the guidelines [S2].
- **Penalty:** unlabelled realistic AI content "may be removed, restricted, or labeled" [S3].
  TikTok is testing an invisible watermark and a viewer control to see less AI content
  [S4, OFF, Nov 2025].
- **Forbidden even with a label:** fake authoritative sources or crisis events, and the likeness of
  minors or of private adults used without consent [S2]. Our weather-disaster topics must never
  look like real news footage.

**Monetization.** Neither platform bans AI voice or faceless content from monetization. TikTok
requires original content and videos over one minute [S19, S22]. Claims that TikTok
"demonetizes faceless channels" are [MYTH]: no official source was found.

## 3. What insights show and which metrics matter

| Metric | Instagram | TikTok |
|---|---|---|
| Views | Plays, replays included [S13] | Post views [S21] |
| Unique reach | Viewers (estimated) [S13] | Unique and returning viewers [S21] |
| Average watch time | Watch time ÷ initial views [S13] | Yes [S21] |
| Completion | via retention chart | Watched full video % [S21] |
| Retention graph | Yes, since Aug 2025 [S15, IND] | Retention rate with drop-off points [S21] |
| Early swipe-away | Skip rate: % skipping in first 3 s [S14, OFF; S15] | Read from the retention graph at 3 s |
| Shares, saves, comments, likes | Yes; reposts too [S14] | Yes [S21] |
| Follows from the post | Follows [S13] | New followers (top posts) [S21] |
| Traffic source | Follower vs non-follower split in app [EXP, not documented] | Traffic source and search queries [S21] |
| Export | None in the app. The Graph API exposes `reels_skip_rate`, `ig_reels_avg_watch_time` and more [S14] | Studio Web: download up to 365 days at a time [S21] |

Instagram keeps reel insights for two years [S13]. TikTok Studio also shows when viewers are most
active and what they search for (Creator Search Insights) [S21, OFF].

**Which metrics predict distribution.** Ranked by what the rankers optimise [S6, S17, S18, S28]
(an [EXP] inference from [OFF] sources):

1. **Skip rate / 3 s hold.** Tests the hook.
2. **Average watch time ÷ length.** Tests the body. Instagram scores it against reels of the same
   length.
3. **Shares (sends) per 1,000 views.** Tests whether people pass it on to non-followers.
4. **Follows per 1,000 views.** Tests whether people want the series.
5. Saves and comments come next. Likes come last.

## 4. Posting strategy for a brand-new account

- **Cadence.** Instagram data from Buffer covered 2.1M posts from 102K accounts. Going from 1-2 to
  3-5 posts a week roughly doubled follower growth. Gains shrank above that, and a week with no
  posts dragged growth below baseline [S26, IND, 2025]. Buffer's TikTok data covered 11.4M posts.
  The median post got about 500 views whatever the frequency. The 90th percentile rose from 3.7K
  views (1 post a week) to 14.4K (11+ a week) [S27, IND, 2025]. More posts buy more chances at a
  breakout, not a better typical post. **Our plan:** 3 posts a week on fixed days, each episode on
  both platforms the same day, and never at the cost of quality.
- **Best times.** Sprout Social (about 2B engagements, Nov 2025-Feb 2026) found midweek
  afternoons best and weekends weakest on both platforms [S29, IND]. The data is pooled brand data
  in local time, so it is weak evidence for us. Start at about 13:00-16:00 US Eastern,
  Tuesday-Thursday. Switch to TikTok's "most active times" once it has data [S21]. An exact
  "golden hour" is [MYTH].
- **First 10-20 posts.** Each post is judged on its own [S8, S17]; there is no warm-up penalty.
  Keep one recognisable format (mascot, headline style, series name), so a new follower knows what
  comes next [EXP; S23]. Lead with the 10 most searchable evergreen questions in `docs/topics/`.
  Never delete and repost a flop; duplicates are suppressed [S8, S11].
- **Cover frame.** The Instagram grid is 3:4, and a 1080×1920 cover shows at 1013×1350; "Adjust
  preview" fixes it later [S30, IND]. A centred 3:4 crop keeps about y 240-1680 [EXP arithmetic],
  so our headline zone (from y 220) can be clipped. Make a dedicated cover frame with large
  headline type between y 400 and 1300, mascot visible.
- **Caption.** One or two plain sentences. The first line is the question in searchable words
  ("Why can lightning strike twice?"), and the same phrase appears in the headline and the
  narration. TikTok reads captions [S17, S18] and rewards "search value" [S22]. Instagram
  professional posts can appear in Google (since July 2025) [S31, IND]. Long, off-topic captions
  count as low quality [S7].
- **Hashtags.** On Instagram, use up to 5. Mosseri says they do not increase reach, but they do
  describe the post [S16]. On TikTok they are a content signal [S18]. Use 3-5 specific ones on
  both platforms (#science, #weather, the topic). Tags like #fyp or #viral are [MYTH].
- **Audio.** Use our own chiptune: original, never muted, and it can become the series sound. The
  idea that trending audio boosts reach is [MYTH] here. The ranker predicts audio reuse [S6], not a
  bonus for trends.
- **Cross-posting.** Upload the clean master render natively to both apps. Never re-upload a video
  saved from TikTok, because it carries a watermark [S10, S19].
- **Comments.** Answer real questions within a day or two; they seed episodes. No engagement pods
  or "comment X" bait, because coordinated comments are down-ranked [S7].
- **Accounts.** Public Instagram creator account, needed for Trial Reels and Google indexing
  [S11, S31]. Personal TikTok account, needed for Creator Rewards [S22]. The bio on both says
  "AI voice".

## 5. The measurement loop

- **Views are heavy-tailed.** On TikTok the 90th-percentile post gets 7.6-31× the median [S27].
  Never average raw views. Compare each video to the **median of our last 10** on that platform,
  using ratios (skip rate, watch %, shares per 1K).
- **Snapshots at 72 h and 7 days.** Instagram's trial decision uses the first 72 h [S12], and early
  growth predicts a cascade's final size [S25, PR].
- **How many posts before drawing conclusions.**
  - Skip rate and watch % are fairly stable, so start reading them after 5 posts.
  - Reach and follows need 10+ posts per platform.
  - A format comparison needs at least 6 matched pairs. If all 6 favour one variant, a sign test
    gives two-sided p ≈ 0.03 [EXP, standard statistics]. A 5-1 split is only a hint.
- **Running comparisons.**
  - Alternate variants across episodes, ABAB (hook style, headline, cover, length), one change at
    a time. Never post two versions of one episode on a platform [S8, S11].
  - From 200 followers, Trial Reels are the cleanest test: non-followers only, no effect on the
    main feed [S11]. Post a *new* episode as a trial and compare it with past trials [S12].
  - Instagram versus TikTok is not an A/B test; the audiences differ.
- **Turning results into rules.** A passing comparison becomes a dated rule in
  `docs/style/learnings.md` via the `feedback` skill, with episode IDs and medians, e.g. "number-first
  hooks; skip 31% vs 44%, 6/6 pairs". A rule that loses 6 pairs later is retired explicitly.

---

## Launch checklist

- [ ] Instagram: public **creator** account; bio states "AI voice"; Account Status clean.
- [ ] TikTok: **personal** account; TikTok Studio analytics opened once to confirm access.
- [ ] Same handle and avatar (the mascot) on both platforms.
- [ ] Every post: **Add AI label** on Instagram and **AI-generated content** on TikTok, each set
      separately.
- [ ] No topic or frame that could pass for real news footage of a disaster [S2].
- [ ] Upload the master render, never a re-download; no third-party watermark anywhere.
- [ ] Cover frame exported separately, headline inside y 400-1300; grid preview checked after
      posting.
- [ ] Caption: first line is the searchable question; 1-2 sentences; 3-5 specific hashtags (max 5
      on Instagram).
- [ ] Audio is our own track, posted as original sound.
- [ ] Before each TikTok post, run Content Check Lite on TikTok Studio Web when available [S20].
- [ ] First 10 episodes are the most searchable evergreen questions, all in one recognisable format.
- [ ] 3 posts a week on fixed days and a fixed slot, same day on both platforms.
- [ ] `docs/data/posts.csv` created; a reminder to fill it in at 72 h and 7 d after each post.
- [ ] At 200 Instagram followers, switch format tests to Trial Reels.
- [ ] Recorded open decision: stay at 55-60 s, or make some episodes 61-75 s for TikTok Creator
      Rewards (once the account is near 10K followers).

## Data loop

**`docs/data/posts.csv`.** One row per post, per platform, per snapshot.

```
episode_id,platform,post_url,posted_at_utc,weekday,snapshot,length_s,topic_tag,
hook_type,hook_text,headline_text,caption_first_line,hashtags,cover_variant,
experiment_id,arm,is_trial,ai_label_on,views,viewers,avg_watch_s,avg_watch_pct,
skip_rate_pct,hold_3s_pct,watched_full_pct,likes,comments,shares,saves,reposts,
follows,non_follower_pct,search_pct,top_search_query,followers_total,notes
```

`snapshot` is `72h` or `7d`; `avg_watch_pct` = `avg_watch_s` ÷ `length_s`; `skip_rate_pct` is
Instagram's figure, `hold_3s_pct` is read off either retention graph at 3 s; `search_pct` and
`top_search_query` are TikTok only; `arm` is A/B within `experiment_id` (e.g.
`X03-hook-number-first`). Leave unreported cells empty, never 0.

**Weekly routine (Monday, about 20 minutes)**

1. Fill in every snapshot that has come due: 72 h and 7 d rows, both platforms. For TikTok, use
   the Studio Web download.
2. For each new row, compute the ratio to the median of the last 10 posts on the same platform
   for: skip rate / 3 s hold, watch %, shares per 1K views, follows per 1K views.
3. On the week's best and worst retention graphs, note the second of the biggest drop and what was
   on screen. Add a check to `docs/style/review-checklist.md` if the moment repeats.
4. Update open experiments. When one reaches 6 pairs, decide it and log a rule via `feedback`.
5. Write down one change for next week's episodes, and only one.
6. Each month, check Account Status (Instagram) and look for any "not eligible for For You"
   notices (TikTok).

---

## Sources

- S1 Instagram Help Center, "Label AI content on Instagram", Meta, 2026. https://help.instagram.com/761121959519495 [OFF]
- S2 TikTok Support, "About AI-generated content", TikTok, 2026. https://www.tiktok.com/support/faq_detail?id=7636670084747893268 [OFF]
- S3 TikTok Community Guidelines, "Integrity and Authenticity", 2026. https://www.tiktok.com/community-guidelines/en/integrity-authenticity [OFF]
- S4 TikTok Newsroom, "More ways to spot, shape and understand AI-generated content", 2025. https://newsroom.tiktok.com/more-ways-to-spot-shape-and-understand-ai-content?lang=en [OFF]
- S5 Meta Newsroom, "Our approach to labeling AI-generated content and manipulated media", 2024. https://about.fb.com/news/2024/04/metas-approach-to-labeling-ai-generated-content-and-manipulated-media/ [OFF]
- S6 Meta Transparency Center, "Instagram Reels" ranking explainer, updated 2025. https://transparency.meta.com/features/explaining-ranking/ig-reels-chaining/ [OFF]
- S7 Instagram Help Center, "Recommendations on Instagram". https://help.instagram.com/313829416281232 [OFF]
- S8 Instagram Creators, "Helping creators find new audiences", 2024. https://creators.instagram.com/recommendations-and-originality [OFF]
- S9 Instagram Creators, "Rewarding original creators on Instagram", 2026. https://creators.instagram.com/blog/rewarding-original-creators-on-instagram [OFF]
- S10 A. Mosseri, "Instagram ranking explained", Instagram, 2023. https://about.instagram.com/blog/announcements/instagram-ranking-explained [OFF]
- S11 Instagram Help Center, "About trial reels on Instagram". https://help.instagram.com/1013292530224018/ [OFF]
- S12 Instagram Creators, "Trial reels", 2024. https://creators.instagram.com/blog/instagram-trial-reels [OFF]
- S13 Instagram Help Center, "View insights on your Instagram reels". https://help.instagram.com/202865988324236/ [OFF]
- S14 Meta for Developers, "Instagram Media Insights". https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/insights/ [OFF]
- S15 Social Samosa, "Instagram adds Retention chart & Skip Rate", 2025. https://www.socialsamosa.com/news-2/instagram-retention-chart-skip-rate-new-performance-metrics-reels-9730992 [IND]
- S16 Social Media Today, "Instagram implements new limits on hashtag use", 2025. https://www.socialmediatoday.com/news/instagram-implements-new-limits-on-hashtag-use/808309/ [IND]
- S17 TikTok Newsroom, "How TikTok recommends videos #ForYou", 2020. https://newsroom.tiktok.com/en-us/how-tiktok-recommends-videos-for-you [OFF]
- S18 TikTok Transparency Center, "Introduction to the TikTok recommendation system". https://www.tiktok.com/transparency/en/recommendation-system [OFF]
- S19 TikTok Creator Academy, "Understanding TikTok's Originality Policy", 2026. https://www.tiktok.com/creator-academy/article/tiktok-originality-policy [OFF]
- S20 TikTok Newsroom, "New tools for creators" (Content Check Lite), 2025. https://newsroom.tiktok.com/new-tools-for-creators?lang=en [OFF]
- S21 TikTok Creator Academy, "Introducing TikTok analytics", 2026. https://www.tiktok.com/creator-academy/article/tool-analytics-intro [OFF]
- S22 TikTok Newsroom, "Introducing the new Creator Rewards Program", 2024. https://newsroom.tiktok.com/introducing-the-new-creator-rewards-program?lang=en [OFF]
- S23 Vombatkere, Mousavi, Zannettou, Roesner, Gummadi, "TikTok and the Art of Personalization", ACM Web Conference 2024. https://arxiv.org/abs/2403.12410 (figures: https://www.newswise.com/articles/qa-how-tiktok-s-black-box-algorithm-and-design-shape-user-behavior) [PR]
- S24 Ling, Blackburn, De Cristofaro, Stringhini, "Slapping Cats, Bopping Heads, and Oreo Shakes", ACM WebSci 2022. https://arxiv.org/abs/2111.02452 [PR]
- S25 Cheng, Adamic, Dow, Kleinberg, Leskovec, "Can cascades be predicted?", WWW 2014. https://arxiv.org/abs/1403.4608 [PR]
- S26 J. Winternheimer, "How often should you post on Instagram", Buffer, 2025. https://buffer.com/resources/how-often-to-post-on-instagram/ [IND]
- S27 J. Winternheimer, "How often should you post on TikTok", Buffer, 2025. https://buffer.com/resources/how-often-should-you-post-on-tiktok/ [IND]
- S28 Social Media Today, "Instagram shares algorithm insights for 2025" (Mosseri video), 2025. https://www.socialmediatoday.com/news/instagram-shares-algorithm-insights-2025/738034/ [IND]
- S29 Sprout Social, "Best times to post on social media", 2026. https://sproutsocial.com/best-times-to-post [IND]
- S30 Planoly, "A complete guide to Instagram's new vertical grid", 2025. https://planoly.com/blog/guide-to-instagrams-new-vertical-grid [IND]
- S31 Storyboard18, "Instagram to make public posts searchable on Google, Bing", 2025. https://www.storyboard18.com/digital/instagram-to-make-public-posts-searchable-on-googlebing-74611.htm [IND]
