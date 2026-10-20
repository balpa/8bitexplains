# Posting checklist

What the owner does for every post. Background and sources: docs/research/growth-and-data.md.

## Before the first post (once)

- Instagram: creator account. TikTok: personal account. Same handle on both.
- Avatar: the pixel bird. Bio mentions "AI voice".

## Every post

1. **Upload the master render** (`out/<id>.mp4`) natively on each platform. Never re-upload a
   file downloaded from another app (watermark), never post the same video twice on one platform.
   The `-share.mp4` copies are only for previewing over Remote Control.
2. **Turn on the AI label.** Required on both platforms because the narration is a realistic AI
   voice.
   - Instagram: "Add AI label" while posting.
   - TikTok: "More options", then "AI-generated content". TikTok says the label does not reduce
     reach; unlabelled realistic AI content can be removed or restricted.
   - Instagram's "AI-generated profile" label is only for accounts that feature an AI-generated
     person. It does not apply to us.
3. **Cover:** the episode's cover frame, `out/<id>-cover.png` (written by `build.sh`).
4. **Caption:** first line is the searchable question and matches the on-screen headline. Then
   the sources and "Not affiliated with or endorsed by ..." from the episode JSON.
5. **Hashtags:** 3-5 specific ones. Instagram allows at most 5.
6. **Schedule:** 3 posts a week on fixed days, the same day on both platforms.
7. **First post only:** take a phone screenshot of the reel playing with the app UI visible, so we
   can check whether the captions (y 1250-1420) sit under the app's buttons.

## After posting

- At 72 h and at 7 d, write the numbers into `docs/data/posts.csv` (views, average watch time,
  completion or retention, likes, shares, saves, follows). Retention screenshots are enough;
  Claude transcribes them.
- Weekly, 20 minutes: compare each video with the median of the last 10. A change becomes a rule
  only after 6 matched pairs agree.
