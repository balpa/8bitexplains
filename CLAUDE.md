# 8-Bit Explains

Faceless Instagram Reels / TikTok channel: ~50 s English science explainers in an 8-bit style,
aiming for "Kurzgesagt, but 8-bit". Pipeline and licences are in README.md.
Current state and the agreed next steps are in docs/status.md; read it when resuming.

## Working with the owner

- The owner is not an animation or audio specialist. Research, decide and show results; do not
  ask technical questions. Ask only about taste, and only with something to look at.
- They often work over Remote Control from another device. Show visuals as files (stills, contact
  sheets, MP4s), never as localhost URLs.
- Everything must be free, and every source, tool and asset must allow commercial use.
- Private repo: commit straight to `main` with plain messages; the owner pushes from their terminal.

## The improvement loop (every episode, every round)

1. Before touching visuals, audio or scripts, read @docs/style/style-guide.md and
   @docs/style/learnings.md. Learnings override the style guide when they disagree.
2. Build the episode with the `new-episode` skill.
3. After every render, run the QA step and the self-review in
   docs/style/review-checklist.md. Fix what fails before showing anything.
4. Send the owner the MP4 plus the contact sheet.
5. When the owner gives feedback, run the `feedback` skill: log it in docs/feedback/log.md and
   turn each point into a dated rule in docs/style/learnings.md, then apply it.

A critique that has already been logged must never come back. If it does, that is a failure
of step 1 or step 3: tighten the checklist so it is caught next time.

## Content rules

- Facts only from public-domain or CC BY sources; scripts are written from scratch.
- Never use Evrim Ağacı (its terms forbid videos and scripts), The Conversation (CC BY-ND) or
  anything NC/ND/SA.
- No agency logos; add "Not affiliated with or endorsed by ..." when naming an agency.
- Topics must be catchy (learnings L12): a popular question or a surprising little-known fact.
  `tools/scout.py` finds weekly trends; `docs/topics/*.md` holds evergreen candidates.

## Rendering

Remotion's built-in static server stalls headless Chrome on this machine. `build.sh` bundles,
serves the bundle with `python3 -m http.server` and renders from the URL; keep it that way.
