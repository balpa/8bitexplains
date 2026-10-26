import { lerp, smoothstep } from "./engine/pixel";
import { toScreen } from "./engine/fine";
import { drawBird, drawBirdAs, drawCloseUp, drawEyes, drawNumber } from "./engine/sprites";
import { drawCityGrid, drawCityNight, drawNearMiss, drawOffice, drawShield, drawSunSurface } from "./engine/sun";
import { Shot, ShotCtx, lineStart, split } from "./shot-kit";

// Solar superstorms: 1859, Quebec 1989, the July 2012 near miss (NOAA, NASA).

const KEY = { x: 96, y: 200 };

const office0: Shot = (buf, c) => {
  const pull = smoothstep(0.4, 2.8, c.t);
  const cam = { x: lerp(KEY.x, 92, pull), y: lerp(KEY.y - 6, 168, pull), zoom: lerp(3, 1.5, pull) };
  drawOffice(buf, { t: c.t, cam, aurora: 1, sparks: 1, fire: smoothstep(0.15, 0.6, c.t) });
  // Gag (L24): the bird is the telegraph operator. The current shocks it like the 1859 operators,
  // then it flaps off sooty.
  const seat = toScreen(cam, KEY.x + 10, KEY.y - 8);
  const away = smoothstep(1.6, 3, c.t);
  const x = lerp(seat.x - 16, 132, away), y = lerp(seat.y - 20, 108, away) + Math.sin(c.t * 3) * 3 * away;
  if (c.t < 0.15) drawBird(buf, x, y, c.frame, true, 3);
  else if (c.t < 0.75) drawBirdAs(buf, x, y, c.frame, "zapped", true, 3);
  else drawBirdAs(buf, x, y, c.frame, "charred", true, 3, c.t < 1.6);
};

// The hook cuts on caption chunks (L27): the sparking telegraph, the Sun's flare, the bird's
// shocked face, then back to the office.
const hook: Shot = (buf, c) => {
  if (c.t >= 0.8 && c.t < 1.6) return drawSunSurface(buf, { t: c.t + 3, limbY: 186, flare: 1, cme: 0.3 });
  if (c.t >= 1.6 && c.t < 2.4) return drawCloseUp(buf, c.t, c.frame, "shock", 6);
  return office0(buf, c);
};

const surface: Shot = (buf, c) => {
  const l1 = lineStart(c, 1, 3.6);
  drawSunSurface(buf, {
    t: c.t,
    limbY: lerp(196, 176, smoothstep(0, c.dur, c.t)),
    flare: smoothstep(0, l1 - 0.6, c.t),
    cme: smoothstep(l1 - 0.8, c.dur, c.t),
    earth: smoothstep(l1, l1 + 0.6, c.t),
  });
  // The Sun scowls as it throws the storm at us (L28).
  drawEyes(buf, 90, lerp(196, 176, smoothstep(0, c.dur, c.t)) + 7, "angry", 5, 12);
};

const shield: Shot = (buf, c) => {
  const l1 = lineStart(c, 1, 2.4);
  const out = smoothstep(l1 - 0.4, l1 + 0.8, c.t);
  const cam = { x: lerp(98, 90, out), y: lerp(138, 160, out), zoom: lerp(1.9, 1, out) };
  const hit = smoothstep(l1, l1 + 1, c.t);
  drawShield(buf, c.t, hit, smoothstep(l1 + 1.4, c.dur, c.t), cam, smoothstep(0.2, 1.4, c.t));
  // Gag: the bird shelters under the umbrella until the harder storm shakes it and soaks it.
  const p = toScreen(cam, 106, 176 + Math.sin(c.t * 9) * 3 * hit);
  if (out < 0.6) return;
  if (hit < 0.5) drawBird(buf, p.x - 16, p.y - 20, c.frame, true, 3, false);
  else drawBirdAs(buf, p.x - 16, p.y - 20, c.frame, "puffed", true, 3, true);
};

const office: Shot = (buf, c) => {
  const l1 = lineStart(c, 1, 3.4);
  const k = smoothstep(0, c.dur, c.t);
  drawOffice(buf, {
    t: c.t,
    cam: { x: lerp(90, 104, k), y: lerp(150, 172, k), zoom: lerp(1.15, 1.7, k) },
    aurora: 1,
    sparks: smoothstep(l1 - 0.3, l1, c.t),
    fire: 0.7 * smoothstep(l1 + 0.8, l1 + 1.6, c.t),
  });
};

// The peak (L28, L29): a timer counts the 90 seconds next to the transformer, which panics, the
// dark city gets its 6,000,000 label, and the bird reacts in close-up.
const quebec: Shot = (buf, c) => {
  const l1 = lineStart(c, 1, 4.2);
  if (c.t > c.dur - 1.2) return drawCloseUp(buf, c.t, c.frame, "sweat");
  const dark = smoothstep(l1 + 0.2, l1 + 2, c.t);
  drawCityNight(buf, { t: c.t, dark, aurora: 1, spark: smoothstep(0.2, 0.5, c.t) * (1 - smoothstep(l1 + 0.3, l1 + 0.8, c.t)), candles: smoothstep(l1 + 2.4, l1 + 3.6, c.t) });
  drawEyes(buf, 75, 262, c.t < l1 + 0.8 ? "scared" : "open", 5, 10);
  if (c.t > l1) drawNumber(buf, `${Math.round(90 * smoothstep(l1, l1 + 1.8, c.t))} SEC`, 75, 180, "#ffd23f", 2);
  if (c.t > l1 + 2) drawNumber(buf, "6,000,000", 90, 104, "#f4f1e8", 2);
};

const nearmiss: Shot = (buf, c) => drawNearMiss(buf, c.t, smoothstep(0.2, c.dur - 0.3, c.t));

// The lights go out on "cut power for weeks", then back to the 1859 office: the bird reads the
// newspaper by aurora light (L25: an everyday effect instead of a cost estimate).
const grid: Shot = (buf, c) => drawCityGrid(buf, c.t, smoothstep(lineStart(c, 0, 0.3) + 1.6, lineStart(c, 1, 4) - 0.4, c.t), 0.8);
const reading: Shot = (buf, c) => {
  const l1 = lineStart(c, 1, 4);
  const k = smoothstep(l1, c.dur, c.t);
  const cam = { x: lerp(118, 132, k), y: lerp(186, 200, k), zoom: lerp(1.6, 2.4, k) };
  drawOffice(buf, { t: c.t, cam, aurora: 1, paper: 1 });
  const p = toScreen(cam, 116, 211);
  drawBird(buf, p.x - 16, p.y - 20, c.frame, false, 3);
};
const blackout: Shot = (buf, c) => split(c, lineStart(c, 1, 4) - 0.1, grid, reading);

// Loop (L26): the office again, the sooty bird jolted by the key, then the picture settles on
// frame 0 so "...because" runs into "the Sun can set your wires on fire."
const officeEnd: Shot = (buf, c) => {
  const k = smoothstep(0, 2.4, c.t);
  drawOffice(buf, { t: c.t, cam: { x: lerp(92, KEY.x, k), y: lerp(168, KEY.y - 6, k), zoom: lerp(1.5, 3, k) }, aurora: 1 });
  const jolt = (c.t % 2.4) > 1.7 && (c.t % 2.4) < 2.0;
  drawBirdAs(buf, 112, 178 + Math.sin(c.t * 3) * 3, c.frame, jolt ? "zapped" : "charred", true, 3);
};
const frame0: Shot = (buf, c) => office0(buf, { ...c, t: 0 });
const outro: Shot = (buf, c) => split(c, c.dur - 0.6, officeEnd, frame0, 0.8);

export const EP006_SHOTS: Record<string, Shot> = {
  "sun-hook": hook,
  "sun-surface": surface,
  "sun-shield": shield,
  "sun-office": office,
  "sun-quebec": quebec,
  "sun-nearmiss": nearmiss,
  "sun-blackout": blackout,
  "sun-outro": outro,
};

// The telegraph bursting into flame jolts the frame.
export const ep006Shake = (visual: string, c: ShotCtx) => {
  if (visual !== "sun-hook" && visual !== "sun-quebec") return null;
  const k = visual === "sun-hook" ? smoothstep(0.1, 0.3, c.t) * (1 - smoothstep(0.6, 1.1, c.t)) : smoothstep(0.2, 0.4, c.t) * (1 - smoothstep(0.8, 1.3, c.t)) * 0.6;
  return { x: Math.round(Math.sin(c.frame * 2.3) * 12 * k), y: Math.round(Math.cos(c.frame * 1.9) * 9 * k) };
};
