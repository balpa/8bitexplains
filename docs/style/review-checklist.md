# Self-review checklist

Run after every render, before showing anything to the owner. Fix any failure, re-render, and
review again. Add a line here whenever a logged critique slips through.

## Automatic (from the QA step)

- [ ] Integrated loudness -15 to -13 LUFS, true peak below -1 dBTP.
- [ ] Speech at least 6 dB above the background between lines in every scene (QA table);
      music ducked under the voice while it speaks (DUCKED in Episode.tsx, about 20 dB under).
- [ ] Duration 45-60 s, 1080x1920, 30 fps, H.264 + AAC.
- [ ] No text outside the safe zone (x 90-990, y 220-1440).

## By eye (from the contact sheet)

- [ ] Every frame of the contact sheet is full-bleed; no empty band at the top or bottom.
- [ ] Composition is centred; the main subject sits on the vertical centre line or on a third.
- [ ] Each shot has at least three depth layers and visible lighting.
- [ ] Consecutive contact-sheet frames look different (something changes every 2-3 s).
- [ ] Captions: no box, readable on a phone, current word highlighted.
- [ ] Nothing looks like a slide, a label diagram or a UI panel.
- [ ] The first contact-sheet frame is already striking and moving (L9).
- [ ] Any globe or map shows real coastlines; named regions sit at their true location (L8).
- [ ] The mechanism is shown once as an everyday metaphor before the real view (L10).
- [ ] At most one short SFX per scene, none on top of a word (L6).
- [ ] Every rule in docs/style/learnings.md is satisfied; name any you are unsure about.
