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

1. **QA guards and cover** (Priority 2 of the plan). Code done on 2026-10-20:
   - hold-time check in `tools/qa.py` (L18), short-line warning (L21);
   - text layout rule and 24 px font grid in `Episode.tsx` (L19), captions chunked to two lines;
   - cover generator `remotion/src/Cover.tsx` plus `tools/covers.py` grid preview (L20);
   - camera moves fixing the flagged stills in ep005 (hook, soda), ep006 (shield), ep007 (hook,
     heat); caption question first (L22).
   - ep005-ep007 re-rendered on 2026-10-20 and sent: all QA checks pass, longest stills 1.0 s,
     3.5 s and 2.5 s. ep007 keeps the 19-token line "That bang is thunder." (the longer version
     ran 60.3 s). Ready to post.
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
