# Topics and visuals: what to improve next (2026-10-26)

The owner asked what we can improve in topic choice and visuals. This review comes from the
ep001-ep007 contact sheets, the cover grid, docs/research/catchiness.md and
docs/research/visual-craft.md. Grades as elsewhere: [PR] peer-reviewed, [IND] industry, [EXP] our
own judgement from the renders.

## Topics

### What is wrong today

1. **Three dark stories in a row.** ep005-ep007 are a gas cloud that killed 1,800 people, a solar
   storm and lightning deaths. Every peak is a death toll or a disaster. High-arousal emotions are
   shared, sadness is not (Berger & Milkman, [PR]), and a profile full of deaths sets a gloomy
   tone. [EXP]
2. **Third-person history.** "In 1986, a lake ..." puts the viewer outside the event. The largest
   faceless animated channels put the viewer inside it ("what happens if you ...", "could you
   survive ..."), and felt self-relevance causally raises sharing (catchiness.md §1, [PR] + [IND]).
3. **One topic family.** Everything so far is weather, geology and space disasters. The families
   that recur among top performers (your body and brain, survival, space and scale, everyday
   "why", animals) are mostly untouched. [IND]
4. **Niche names in the hook.** "Lake Nyos" and "Carrington" mean nothing to most viewers. The
   hook works because of the number, not the name. Lead with the situation, keep the name for the
   caption. [EXP]

### New rules to propose

- **T1 Viewer inside.** The hook, title and cover put "you" in the situation. History topics
  become "what if it happened today" or "could you have survived it".
- **T2 Rotate families.** Never two episodes in a row from the same family. No episode ends on a
  death toll; the aftermath is an everyday-life effect (owner, 2026-10-26, learnings L25).
- **T3 Situation first, name later.** The first spoken line has no proper noun the viewer has to
  know.

### Ten candidates in the new framing

Facts not verified yet. Each gets a public-domain US government source (NASA, NOAA, USGS, NPS,
NIH/NIDCD, CDC) at the topic step, as the new-episode skill requires. MedlinePlus encyclopedia
pages are licensed from A.D.A.M., not public domain, so they are excluded.

| # | Family | Hook (spoken) | Likely source |
|---|---|---|---|
| 1 | Space + body | "What happens to your body in space without a suit? Not what movies show." | NASA |
| 2 | Space + scale | "Fall into a black hole and you'd be stretched like spaghetti." | NASA |
| 3 | Survival | "How deep could you dive before the ocean crushes you?" | NOAA Ocean Exploration |
| 4 | Space + survival | "On Mars, you'd have about two minutes. Here's why." | NASA |
| 5 | Body, everyday why | "Why do your ears pop on a plane?" | NIH NIDCD |
| 6 | Survival | "Death Valley's ground hit 201°F. How long could you last?" | NPS |
| 7 | Space + "what if" | "What if the asteroid that flattened Siberia hit your city?" | NASA |
| 8 | Survival | "Could you outrun a volcano's blast? Mount St. Helens says no." | USGS |
| 9 | Animals | "One bat eats its weight in bugs every night. You'd need 300 burgers." | USFWS |
| 10 | Body | "Your blood vessels would wrap around Earth twice." | NIH (to verify) |

Recommended start: #2 (black hole) or #4 (Mars), since space is bright, colourful and new for the
channel, and both are "you" questions with a payoff.

## Visuals

### What is wrong today (from the contact sheets)

1. **Too dark.** All three v2 episodes are at night: a night lake, a night office and night city,
   a night storm. Next to ep002 (bright globe, sunset chimney) they look muddy, and on the cover
   grid the three tiles blur together. [EXP]
2. **The bird is too small to act.** At 22 px logical (about 130 screen px) it is a dot; you
   cannot read its face or a reaction on a phone. At scale 3 (the ep007 sample) the gags read.
   The planned fine-detail redraw with six poses (visual-craft.md §1) is still open.
3. **No people on screen, so numbers stay abstract.** "1,800 people", "6 million people",
   "27 deaths" appear only as text. Kurzgesagt-style explainers show tiny crowds, a person next
   to the giant thing, a row of houses going dark. We say the human-scale comparison but never
   draw it (L15 rule 4 is only half met). [EXP]
4. **Text sits on the art.** Red stat numbers at 120 px cover the middle of the frame for 5-10 s
   (ep005 "1,800", ep006 "$2 TRILLION" over an almost black frame). The number should land on a
   visual that shows the same thing, then shrink or leave. [EXP]
5. **Some frames are abstract.** ep006's street grid from above (yellow dashes on black) and
   ep005's brown soil cut read as noise at phone size. The everyday metaphors (soda bottle,
   umbrella, balloon) are the clearest frames in every episode. [EXP]
6. **Covers lack a subject.** The title is readable, but the picture is a dark scene with a small
   bird. A cover needs one big, bright subject (the bolt, the planet, the bird reacting). [EXP]
7. **Scene changes are mostly dissolves.** Planned zoom-through, match cut, pan and iris
   transitions are not built yet (visual-craft.md §3). [EXP]

### Proposed changes, in order of effect per hour

1. **Brightness and colour budget.** At least half of each episode's frames in a lit setting
   (day, sunset, a glowing subject filling the frame). QA measures average luminance and
   saturation per scene and warns on a dark run longer than 15 s.
2. **Bigger, more expressive bird** (L24 already sets scale 3 for gags): finish the six-pose
   redraw, give it a face that shows fear, joy and shock.
3. **Draw the human scale.** Every big number gets a picture: a crowd of tiny pixel people,
   a person next to the object, houses switching off one by one.
4. **Number on the picture, not over it.** The stat appears for 1.5-2 s at full size, then
   shrinks to a corner badge while the picture shows the quantity.
5. **Metaphor-first frames.** Whenever a frame would be abstract (a map, a cut, a grid), add
   the everyday object instead.
6. **Cover with one subject.** A bright subject filling a third of the frame, plus the bird
   reacting at large size.
7. **Transitions** from visual-craft.md §3 (zoom-through between worlds, match cuts).
