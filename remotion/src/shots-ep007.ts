import { Buf, clamp01, hex, lerp, smoothstep } from "./engine/pixel";
import { P } from "./engine/palette";
import { SHOCK, TREE, drawBalloon, drawChannel, drawCloudInside, drawPrairie, drawStrike, strikeBolt } from "./engine/lightning";
import { Camera, toScreen } from "./engine/fine";
import { drawBird, drawBirdAs, drawFloppy } from "./engine/sprites";
import { Shot, ShotCtx, lineStart, split } from "./shot-kit";

// Lightning: charge, thunder, heat and harm (NOAA National Weather Service).

const STRIKE = 0.18;
const TOP = { x: TREE.x, y: TREE.base - TREE.h + 4 };
// Gag (L24): the bird perches on the tree the bolt is about to hit. It flickers as an x-ray, sits
// there sooty and dazed while the tree burns, then flaps off still smoking.
const hookBird = (buf: Buf, c: ShotCtx, cam: Camera) => {
  const perch = toScreen(cam, TREE.x - 3, TREE.base - TREE.h - 1);
  const away = smoothstep(1.7, 3.2, c.t);
  const x = lerp(perch.x - 16, 30, away), y = lerp(perch.y - 20, 108, away) + Math.sin(c.t * 3) * 3 * away;
  if (c.t < STRIKE) drawBird(buf, x, y, 6, false, 3);
  else if (c.t < 0.75) drawBirdAs(buf, x, y, c.frame, "zapped", false, 3);
  else drawBirdAs(buf, x, y, c.frame, "charred", false, 3, c.t < 1.7);
};

const flashAt = (t: number, at: number) => (t < at ? 0 : Math.exp(-(t - at) * 4.5) * (Math.floor(t * 24) % 5 === 0 ? 0.6 : 1));

const hook: Shot = (buf, c) => {
  const pull = smoothstep(0.6, 2.8, c.t), push = smoothstep(3.2, c.dur, c.t);
  const cam = { x: lerp(lerp(TREE.x - 6, 92, pull), TREE.x, push), y: lerp(lerp(186, 176, pull), 180, push), zoom: lerp(lerp(1.6, 1.05, pull), 1.5, push) };
  drawPrairie(buf, { t: c.t, cam, flash: Math.max(0.15 * smoothstep(0, STRIKE, c.t), flashAt(c.t, STRIKE)), rain: 0.5, treeFire: smoothstep(0.4, 1.4, c.t) * 0.7 });
  if (c.t < 1.1 && !(c.t > 0.5 && Math.floor(c.t * 20) % 3 === 0)) drawStrike(buf, strikeBolt(4), smoothstep(0, STRIKE, c.t), cam);
  if (c.t > STRIKE) {
    const p = { x: 90 + (TOP.x - cam.x) * cam.zoom, y: 160 + (TOP.y - cam.y) * cam.zoom };
    SHOCK(buf, p.x, p.y, c.t - STRIKE);
  }
  hookBird(buf, c, cam);
};

const cloud: Shot = (buf, c) => {
  const l1 = lineStart(c, 1, 3);
  drawCloudInside(buf, c.t, c.t < l1 ? 1 : 0.3, smoothstep(l1, l1 + 1.8, c.t));
  // Gag: the bird flies through the cloud and its feathers stand on end once the charges split.
  const bx = lerp(150, 104, smoothstep(0, 1.6, c.t)) + Math.sin(c.t * 9) * (c.t < l1 ? 2 : 0), by = 150 + Math.sin(c.t * 2.5) * 4;
  if (c.t < l1 + 0.3) drawBird(buf, bx, by, c.frame, true, 3, c.t > l1 - 1);
  else drawBirdAs(buf, bx, by, c.frame, "puffed", true, 3);
};

const balloon: Shot = (buf, c) => {
  const popAt = lineStart(c, 1, 5.5) - 1.3;
  const pop = clamp01((c.t - popAt) / 1.1);
  drawBalloon(buf, c.t, pop, smoothstep(0, popAt, c.t));
  // Gag: the bird watches from beside the balloon and is blown off screen by the pop.
  const bx = 128 + pop * pop * 90, by = 124 + Math.sin(c.t * 3) * 2 - pop * 70;
  if (pop <= 0) drawBird(buf, bx, by, c.frame, true, 3, c.t > popAt - 1);
  else drawBirdAs(buf, bx, by, c.frame, "puffed", Math.floor(c.frame / 3) % 2 === 0, 3);
};
const thunder: Shot = (buf, c) => {
  const l1 = lineStart(c, 1, 5.5);
  const at = l1 + 0.1;
  drawPrairie(buf, { t: c.t, flash: flashAt(c.t, at) * 0.8 + 0.05, rain: 0.6 });
  if (c.t > at && c.t < at + 0.6) drawStrike(buf, strikeBolt(9, 150, 214, 132), 1);
  if (c.t > at) SHOCK(buf, 150, 200, (c.t - at) * 1.1);
};
const boom: Shot = (buf, c) => split(c, lineStart(c, 1, 5.5) - 0.05, balloon, thunder, 0.3);

const strike: Shot = (buf, c) => {
  const cam = { x: lerp(100, 116, smoothstep(0, c.dur, c.t)), y: 170, zoom: lerp(1.05, 1.35, smoothstep(0, c.dur, c.t)) };
  const l1 = lineStart(c, 1, 4.6);
  const hits = [l1 + 0.2, l1 + 1.0, l1 + 1.8];
  const f = Math.max(0.12 * Math.max(0, Math.sin(c.t * 7)) * (c.t < l1 ? smoothstep(0, l1, c.t) : 0), ...hits.map((h) => flashAt(c.t, h)));
  drawPrairie(buf, { t: c.t, cam, flash: f, rain: 0.7 });
  if (c.t < hits[0] && Math.floor(c.t * 18) % 4 !== 0) drawStrike(buf, strikeBolt(20, 60, 222, 70), 0.75 * smoothstep(0.4, l1 + 0.2, c.t), cam);
  hits.forEach((h, i) => {
    if (c.t > h - 0.12 && c.t < h + 0.5) drawStrike(buf, strikeBolt(20 + i, 60 + i * 30, 222, 70 + i * 20), i === 0 ? 1 : smoothstep(h - 0.12, h, c.t), cam);
  });
};

const heat: Shot = (buf, c) => {
  const l1 = lineStart(c, 0, 0.3), l2 = lineStart(c, 1, 6.5);
  const into = smoothstep(l1, l2 - 0.3, c.t), out = smoothstep(l2 - 0.3, l2 + 0.5, c.t);
  const cam = { x: lerp(lerp(90, 36, into), 96, out), y: lerp(lerp(160, 140, into), 196, out), zoom: lerp(lerp(1, 2.4, into), 1.2, out) };
  drawChannel(buf, c.t, lerp(0.35, 1, into), smoothstep(l2 - 0.3, l2 + 0.4, c.t), cam);
  // Gag: next to the Sun for scale, the bird slides in wearing sunglasses.
  const k = smoothstep(l2 + 0.1, l2 + 0.8, c.t);
  if (k > 0) drawBirdAs(buf, lerp(-34, 78, k), 180 + Math.sin(c.t * 3) * 2, c.frame, "shades", false, 3);
};

const fire: Shot = (buf, c) => drawPrairie(buf, { t: c.t, forest: smoothstep(0, 2.2, c.t), flash: flashAt(c.t, 0.1) * 0.6 });

// Flash to bang (L25): a distant strike, the bird ticks off the seconds, and the thunder ring
// reaches it about five seconds later and puffs its feathers.
const people: Shot = (buf, c) => {
  const at = 0.45;
  const k = smoothstep(at + 0.4, at + 4.6, c.t);
  const cam = { x: lerp(100, 74, k), y: lerp(186, 200, k), zoom: lerp(1.1, 1.9, k) };
  drawPrairie(buf, { t: c.t, cam, rain: 0.8, door: 1, flash: flashAt(c.t, at) * 0.6 });
  if (c.t > at - 0.1 && c.t < at + 0.4) drawStrike(buf, strikeBolt(41, 160, 214, 152), smoothstep(at - 0.1, at, c.t), cam);
  const src = toScreen(cam, 160, 214);
  const bird = { x: 30, y: 170 + Math.sin(c.t * 3) * 2 };
  const reach = Math.hypot(src.x - bird.x - 16, src.y - bird.y - 10);
  if (c.t > at) SHOCK(buf, src.x, src.y, (reach * (c.t - at)) / 4.6 / 90);
  const boom = at + 4.6;
  if (c.t < boom) {
    const ticks = Math.max(0, Math.min(5, Math.floor(c.t - at) + 1));
    for (let i = 0; i < ticks; i++) buf.rect(bird.x + 3 + i * 6, bird.y - 10, 2, 5, hex(P.yellow));
    drawBird(buf, bird.x, bird.y, c.frame, false, 3, c.t > at);
  } else drawBirdAs(buf, bird.x + Math.round(Math.sin(c.frame * 2.1) * 2 * (1 - smoothstep(boom, boom + 0.5, c.t))), bird.y, c.frame, "puffed", false, 3);
};

const outro: Shot = (buf, c) => {
  const k = smoothstep(0, 2.2, c.t);
  drawPrairie(buf, { t: c.t, cam: { x: lerp(92, TREE.x - 6, k), y: lerp(176, 186, k), zoom: lerp(1.05, 1.6, k) }, rain: 0.5, door: 1, flash: flashAt(c.t % 2.7, 1.9) * 0.25 });
  drawFloppy(buf, 70, 96);
  // Callback to the hook: still a little sooty, the bird flinches at every distant flash.
  const flinch = (c.t % 2.7) > 1.9 && (c.t % 2.7) < 2.4;
  drawBirdAs(buf, 112, 178 + Math.sin(c.t * 3) * 3, c.frame, flinch ? "puffed" : "charred", true, 3);
};

export const EP007_SHOTS: Record<string, Shot> = {
  "bolt-hook": hook,
  "bolt-cloud": cloud,
  "bolt-balloon": boom,
  "bolt-strike": strike,
  "bolt-heat": heat,
  "bolt-fire": fire,
  "bolt-people": people,
  "bolt-outro": outro,
};

// The strike in the hook and the thunder clap shake the frame.
export const ep007Shake = (visual: string, c: ShotCtx) => {
  if (visual !== "bolt-hook") return null;
  const k = smoothstep(STRIKE - 0.02, STRIKE + 0.05, c.t) * (1 - smoothstep(0.5, 1, c.t));
  return { x: Math.round(Math.sin(c.frame * 2.3) * 14 * k), y: Math.round(Math.cos(c.frame * 1.9) * 10 * k) };
};
