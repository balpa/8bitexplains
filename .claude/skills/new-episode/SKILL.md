---
name: new-episode
description: Make the next 8-Bit Explains reel end to end - pick the topic, write the script from commercially reusable sources, voice, animate, render, run QA and self-review, then hand the owner the MP4 and contact sheet. Use when the owner asks for a new episode or a new version of one.
---

# New episode

Read docs/style/style-guide.md and docs/style/learnings.md first. Every rule there applies.

1. **Topic.** Run `tools/scout.py` and take the top candidate whose primary source is public
   domain or CC BY. Record the source URLs and licence in the episode JSON (`sources`).
2. **Script.** Write it from scratch in English, 45-60 s spoken: hook in the first sentence,
   "how it works" levels, the surprising number, why it matters, fun fact, save-point outro.
   Never copy or closely paraphrase the source. Every number must appear in a listed source.
3. **Shots.** Plan the episode as one camera journey through one world (style guide). For each
   scene pick the shot and what changes on screen every 2-3 s.
4. **Episode file.** Write `episodes/NNN-slug.json` (copy the latest episode as a template) and
   register its manifest in `remotion/src/Root.tsx`.
5. **Build.** `./build.sh episodes/NNN-slug.json`.
6. **QA.** Run the QA step on the MP4 (loudness, duration and format, contact sheet), then go
   through docs/style/review-checklist.md item by item. Fix failures and rebuild until it passes.
7. **Hand over.** Send the MP4 and the contact sheet with SendUserFile, plus the post caption
   (sources listed, "Not affiliated with or endorsed by ..." where an agency is named).
   Say which checklist items you were unsure about.
8. **Commit** the episode and any engine changes to `main` with a plain message.

When the owner replies with feedback, use the `feedback` skill.
