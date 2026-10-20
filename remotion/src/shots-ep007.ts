import { clamp01, lerp, smoothstep } from "./engine/pixel";
import { SHOCK, TREE, drawBalloon, drawChannel, drawCloudInside, drawPrairie, drawStrike, strikeBolt } from "./engine/lightning";
import { drawBird, drawFloppy } from "./engine/sprites";
import { Shot, ShotCtx, lineStart, split } from "./shot-kit";

// Lightning: charge, thunder, heat and harm (NOAA National Weather Service).

const STRIKE = 0.18;
const TOP = { x: TREE.x, y: TREE.base - TREE.h + 4 };
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
  drawBird(buf, lerp(28, 40, pull), 150 + Math.sin(c.t * 3) * 3, c.frame, false, 2, true);
};

const cloud: Shot = (buf, c) => {
  const l1 = lineStart(c, 1, 3);
  drawCloudInside(buf, c.t, c.t < l1 ? 1 : 0.3, smoothstep(l1, l1 + 1.8, c.t));
};

const balloon: Shot = (buf, c) => {
  const popAt = lineStart(c, 1, 5.5) - 1.3;
  drawBalloon(buf, c.t, clamp01((c.t - popAt) / 1.1), smoothstep(0, popAt, c.t));
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
  const l1 = lineStart(c, 1, 3), l2 = lineStart(c, 2, 9);
  const into = smoothstep(l1, l2 - 0.3, c.t), out = smoothstep(l2 - 0.3, l2 + 0.5, c.t);
  const cam = { x: lerp(lerp(90, 36, into), 96, out), y: lerp(lerp(160, 140, into), 196, out), zoom: lerp(lerp(1, 2.4, into), 1.2, out) };
  drawChannel(buf, c.t, lerp(0.35, 1, into), smoothstep(l2 - 0.3, l2 + 0.4, c.t), cam);
};

const fire: Shot = (buf, c) => drawPrairie(buf, { t: c.t, forest: smoothstep(0, 2.2, c.t), flash: flashAt(c.t, 0.1) * 0.6 });

const people: Shot = (buf, c) => {
  const k = smoothstep(0, c.dur, c.t);
  const cam = { x: lerp(70, 46, k), y: lerp(200, 222, k), zoom: lerp(1.3, 2.2, k) };
  const hits = [1.2, 3.8, 6.4, 8.6];
  drawPrairie(buf, { t: c.t, cam, rain: 1, door: 1, flash: Math.max(...hits.map((h) => flashAt(c.t, h))) * 0.5 });
  hits.forEach((h, i) => {
    if (c.t > h - 0.1 && c.t < h + 0.35) drawStrike(buf, strikeBolt(40 + i, 150 + i * 14, 214, 140 + i * 10), smoothstep(h - 0.1, h, c.t), cam);
  });
  drawBird(buf, lerp(150, 100, k), lerp(150, 196, k) + Math.sin(c.t * 4) * 2, c.frame, true, 2, true);
};

const outro: Shot = (buf, c) => {
  const k = smoothstep(0, 2.2, c.t);
  drawPrairie(buf, { t: c.t, cam: { x: lerp(92, TREE.x - 6, k), y: lerp(176, 186, k), zoom: lerp(1.05, 1.6, k) }, rain: 0.5, door: 1, flash: flashAt(c.t % 2.7, 1.9) * 0.25 });
  drawFloppy(buf, 70, 96);
  drawBird(buf, 118, 182 + Math.sin(c.t * 3) * 3, c.frame, true);
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
