# Status and next steps

Read this first when resuming on another machine. Updated 2026-10-20.

## Where we are

- Episodes 001-007 are in `episodes/`. 005-007 (Lake Nyos, 1859 solar storm, lightning) are v2:
  detail 2, causal chain (L16), outro pause (L17), all nine QA checks pass.
- Research finished: retention-research.md, explanation-depth.md, growth-and-data.md, audio.md,
  visual-craft.md. Their synthesis and the agreed order of work is
  docs/research/improvement-plan.md.
- On 2026-10-20 the owner approved that order: "tamam önerdiğin sırayla devam edelim".
- Nothing has been posted yet. The per-post routine is docs/publishing/posting-checklist.md.

## Next steps (in order)

1. **QA guards and cover** (Priority 2 of the plan):
   - hold-time check in `tools/qa.py` (warn above 3 s still, fail above 4 s, outro exempt);
   - text layout rule in `Episode.tsx` (captions plus at most one other text block, fonts in
     multiples of 24 px);
   - short-line warning (Kokoro reads lines under about 20 tokens weakly);
   - cover generator: `out/<id>-cover.png`, title 96-120 px inside x 65-1015, y 400-1248;
   - fix what the new guards flag in ep005-ep007, re-render them, send MP4, contact sheet, cover.
2. **Owner posts** ep005-ep007 with the checklist; `docs/data/posts.csv` starts.
3. **Audio arc** (Priority 3), then **visual craft** (Priority 4), one at a time, checked against
   the data.

## Setting up a new machine

- `git clone git@github.com:balpa/8bitexplains.git`, then `./build.sh episodes/<file>.json`. The
  first run creates `tools/.venv`, downloads the Kokoro model into `models/` and runs
  `npm install`.
- Not in git: `out/` (renders, QA reports, contact sheets), `models/`, generated audio in
  `remotion/public/ep*/`. Rebuild an episode to get them back.
- Claude's local memory does not travel between machines; everything needed to continue is in
  this repo (CLAUDE.md, docs/style/, docs/research/, this file).
