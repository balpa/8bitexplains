---
name: new-episode
description: Make the next 8-Bit Explains reel end to end - pick the topic, write the script from commercially reusable sources, voice, animate, render, run QA and self-review, then hand the owner the MP4 and contact sheet. Use when the owner asks for a new episode or a new version of one.
---

# New episode

Read docs/style/style-guide.md and docs/style/learnings.md first. Every rule there applies.

1. **Topic.** It must pass L12: a question people already ask, or a surprising little-known fact.
   Use `tools/scout.py` for this week's trends and the latest `docs/topics/*.md` list for
   evergreen ideas; the owner picks from a short list. The primary source must be public domain
   or CC BY. Record the source URLs and licence in the episode JSON (`sources`).
2. **Script.** Write it from scratch in English, 45-55 s spoken, following the blueprint in
   learnings L15 and docs/research/retention-research.md: hook (number plus question by 3 s),
   how it works, payoff and re-hook before 20 s, peak at 30-42 s, answer, aftermath with
   sourced consequences (L11), takeaway, a short save-point line. Tag every scene with `beat`.
   Never copy or closely paraphrase the source. Every number must appear in a listed source.
3. **Shots.** Read docs/style/visual-ledger.md first and pick a world nobody has seen on the
   channel yet (L13). Plan the episode as one camera journey through it (style guide). For each
   scene pick the shot and what changes on screen every 2-3 s. Make the last frame rhyme with the
   first. Write new area renderers at fine detail (L14: `+= PX` loops and `buf.dot`).
4. **Episode file.** Write `episodes/NNN-slug.json` with `"detail": 2` (copy the latest episode
   as a template) and register its manifest in `remotion/src/Root.tsx`. Add a `cover` (L20) and
   start the caption with the searchable question on its own line (L22).
5. **Build.** `./build.sh episodes/NNN-slug.json`.
6. **QA.** Run the QA step on the MP4 (loudness, duration and format, contact sheet), then go
   through docs/style/review-checklist.md item by item. Fix failures and rebuild until it passes.
7. **Hand over.** Send the MP4, the contact sheet and the cover with SendUserFile, plus the post
   caption (sources listed, "Not affiliated with or endorsed by ..." where an agency is named).
   Say which checklist items you were unsure about.
8. **Ledger.** Add the episode's looks to docs/style/visual-ledger.md.
9. **Commit** the episode and any engine changes to `main` with a plain message.

When the owner replies with feedback, use the `feedback` skill.
