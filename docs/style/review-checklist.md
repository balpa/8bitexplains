# Self-review checklist

Run after every render, before showing anything to the owner. Fix any failure, re-render, and
review again. Add a line here whenever a logged critique slips through.

## Automatic (from the QA step)

- [ ] Integrated loudness -15 to -13 LUFS, true peak below -1 dBTP.
- [ ] Speech at least 6 dB above the background between lines in every scene (QA table);
      music ducked under the voice while it speaks (DUCKED in Episode.tsx, about 20 dB under).
- [ ] Duration 45-60 s, 1080x1920, 30 fps, H.264 + AAC.
- [ ] First word by 0.35 s, 160-200 wpm, aftermath scene right before the outro (QA script
      checks).
- [ ] No text outside the safe zone (x 90-990, y 220-1440).
- [ ] No picture holds over 4 s before the outro; read the warnings for 3-4 s stretches
      (L18).
- [ ] Motion at least 10, brightness at least 50 with no scene under 30, and the last frame
      returns to frame 0; the outro is one open-ended line with no follow line (L26, L30).
- [ ] No short-line warnings, or each one listened to and kept on purpose (L21).

## By eye (from the contact sheet)

- [ ] Every frame of the contact sheet is full-bleed; no empty band at the top or bottom.
- [ ] Composition is centred; the main subject sits on the vertical centre line or on a third.
- [ ] Each shot has at least three depth layers and visible lighting.
- [ ] No shot sits on a plain colour field: far, mid and near layers behind the subject (L31).
- [ ] v4: one big subject per shot, at least 30% of the frame (K1); QA cannot measure this once
      the backdrop is layered.
- [ ] Consecutive contact-sheet frames look different (something changes every 2-3 s).
- [ ] Captions: no box, readable on a phone, current word highlighted.
- [ ] Nothing looks like a slide, a label diagram or a UI panel.
- [ ] The first contact-sheet frame is already striking and moving (L9).
- [ ] Any globe or map shows real coastlines; named regions sit at their true location (L8).
- [ ] The mechanism is shown once as an everyday metaphor before the real view (L10).
- [ ] At most one short SFX per scene, none on top of a word (L6).
- [ ] The script does not end on the mechanism: an aftermath scene with sourced, concrete
      real-life effects (what you can notice, use or compare, what changed) comes right before
      the outro (L11). No death toll in the aftermath or the closer (L25).
- [ ] The hook works with no background: a popular question or a "wait, what?" fact with one
      concrete number or image (L12).
- [ ] No look from docs/style/visual-ledger.md is reused as-is; compare the contact sheet with
      the earlier episodes' contact sheets in out/. New looks are added to the ledger (L13).
- [ ] The episode JSON has `"detail": 2`; zoom into a contact-sheet frame and check that large
      surfaces use the fine pixels, not 6 px blocks (L14).
- [ ] Blueprint timing (L15): number plus question by 3 s, payoff and re-hook before 20 s, one
      peak at 30-42 s, every big number has a human-scale comparison, the opening question is
      answered, the last frame rhymes with frame 1.
- [ ] Script depth (L16): the hook asks how or why and the answer beat answers it; 3-4 causal
      links; every outcome verb has its cause next to it; at most 2 technical terms, each glossed;
      the metaphor is mapped explicitly.
- [ ] The outro's line ends open and reads on into the first line ("...and remember: the
      lightning you see..."); no floppy, "GAME SAVED" or follow line (L26).
- [ ] Hook (L27): frame 0 shows the subject in its problem state, centred and at least half the
      frame wide, already moving; the first line is the title in the second person and ends by
      3 s; the picture changes 3-4 times in the first 3 s.
- [ ] A turn at least every 15 s, the peak number escalates across familiar things with each
      number on a label next to its object, and three or more gags including faces on things
      (L28).
- [ ] At least two bird close-ups with the head at 40% or more of the frame width (hook and peak)
      and four or more appearances (L29). Caption chunks of one to four words (L30).
- [ ] At most one text block besides the captions in every contact-sheet frame (L19).
- [ ] `out/<id>-cover.png` exists; in `out/grid-preview.png` the title reads at grid size and the
      series looks consistent (L20).
- [ ] The caption's first line is the searchable question (L22).
- [ ] At least three bird gags, each one the science happening to the bird; one in the first
      3 s, the outro calls back to it, none in the deaths scene; the bird reads at phone size
      (scale 3) (L24).
- [ ] Every rule in docs/style/learnings.md is satisfied; name any you are unsure about.
