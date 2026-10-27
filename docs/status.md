# Status and next steps

Read this first when resuming on another machine. Updated 2026-10-27.

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
3. **Catchiness** (owner, 2026-10-26: "nice, but needs to be catchy"). Research done in
   docs/research/catchiness.md. The owner chose humour first (L24) and then dropped death tolls
   for everyday-life effects (L25). On 2026-10-26 ep005-ep007 were reworked with bird gags and
   new aftermaths: ep005 "the lake that burped" (pipe plus fertile soil, "every fizzing soda is a
   tiny Lake Nyos"), ep006 GPS, radio and the 1859 aurora you could read by, ep007 the
   flash-to-bang count. Topic and visual review with ten new "you" topics:
   docs/research/topics-and-visuals.md. The other catchiness proposals are still open.
4. **Competitor rules** (owner, 2026-10-26): ten top science Shorts watched frame by frame
   (docs/research/competitor-shorts.md); the owner adopted L26-L30 and chose a loop ending over
   the follow line. Engine and QA done (4-word captions, loop outro, bird close-up face, motion,
   brightness and loop checks). ep007 v3, then ep005 and ep006 rebuilt the same way on 2026-10-26;
   all three pass every QA check (ep006 warns of a 4.0 s still in the 2012 near-miss scene).
5. **Kurzgesagt quality** (owner, 2026-10-27: "good, but not Kurzgesagt quality"). Report:
   docs/research/kurzgesagt-quality.md. Measured gap is the look, not the pacing: ours are darker
   (luma 59 vs 95), duller, noisier, with smaller subjects and 4x the text. Proposals K1-K13 wait
   for the owner's choice. The owner picked mascot "Pip" (out/bird-options.png) and an ep007 pilot
   with K1-K5: opt-in `"look": "v4"` (text layout in Episode.tsx, flat props in engine/flat.ts,
   hero.ts, props.ts, v4 QA checks). ep007 v4 rendered 2026-10-27; v3 kept as out/ep007-v3.mp4,
   side by side in out/ep007-v3-vs-v4.mp4. Owner liked the flow but not the flat backgrounds (L31,
   L32); from three options they picked "C" (layered scenery plus light) and it is now the v4
   backdrop in engine/props.ts. Re-rendered 2026-10-27: every QA check passes (edge-density and
   subject-share checks dropped: they mismeasure layered scenery; colour-area check added).
   The owner approved it (L33) and asked for ep005 and ep006 in the same look: both rebuilt in v4
   with Pip and backdrop C on 2026-10-27 (new `space()` backdrop and `drawEarth` in props.ts);
   v3 kept as out/ep005-v3.mp4 and out/ep006-v3.mp4, side by side in out/ep00N-v3-vs-v4.mp4.
6. **Audio arc** (Priority 3), then **visual craft** (Priority 4), one at a time, checked against
   the data.

## Setting up a new machine

- `git clone git@github.com:balpa/8bitexplains.git`, then `./build.sh episodes/<file>.json`. The
  first run creates `tools/.venv`, downloads the Kokoro model into `models/` and runs
  `npm install`.
- Not in git: `out/` (renders, QA reports, contact sheets), `models/`, generated audio in
  `remotion/public/ep*/`. Rebuild an episode to get them back.
- Claude's local memory does not travel between machines; everything needed to continue is in
  this repo (CLAUDE.md, docs/style/, docs/research/, this file).
