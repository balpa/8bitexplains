import { lerp, smoothstep } from "./engine/pixel";
import { drawBird, drawFloppy } from "./engine/sprites";
import { drawCityGrid, drawCityNight, drawNearMiss, drawOffice, drawShield, drawSunSurface } from "./engine/sun";
import { Shot, ShotCtx, lineStart } from "./shot-kit";

// Solar superstorms: 1859, Quebec 1989, the July 2012 near miss (NOAA, NASA).

const KEY = { x: 96, y: 200 };

const hook: Shot = (buf, c) => {
  const pull = smoothstep(0.4, 2.8, c.t);
  drawOffice(buf, {
    t: c.t,
    cam: { x: lerp(KEY.x, 92, pull), y: lerp(KEY.y - 6, 168, pull), zoom: lerp(3, 1.5, pull) },
    aurora: 1,
    sparks: 1,
    fire: smoothstep(0.15, 0.6, c.t),
  });
  drawBird(buf, lerp(190, 140, smoothstep(1.4, 2.6, c.t)), 112 + Math.sin(c.t * 3) * 3, c.frame, true, 2, true);
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
};

const shield: Shot = (buf, c) => {
  const l1 = lineStart(c, 1, 2.4);
  const out = smoothstep(l1 - 0.4, l1 + 0.8, c.t);
  const cam = { x: lerp(98, 90, out), y: lerp(138, 160, out), zoom: lerp(1.9, 1, out) };
  drawShield(buf, c.t, smoothstep(l1, l1 + 1, c.t), smoothstep(l1 + 1.4, c.dur, c.t), cam, smoothstep(0.2, 1.4, c.t));
  if (out >= 1) drawBird(buf, 136, 184 + Math.sin(c.t * 3) * 2, c.frame, true, 2, true);
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

const quebec: Shot = (buf, c) => {
  const l1 = lineStart(c, 1, 4.2);
  drawCityNight(buf, { t: c.t, dark: smoothstep(l1 + 0.2, l1 + 2, c.t), aurora: 1, spark: smoothstep(0.2, 0.5, c.t) * (1 - smoothstep(l1 + 0.3, l1 + 0.8, c.t)), candles: smoothstep(l1 + 2.4, l1 + 3.6, c.t) });
};

const nearmiss: Shot = (buf, c) => drawNearMiss(buf, c.t, smoothstep(0.2, c.dur - 0.3, c.t));

const blackout: Shot = (buf, c) => {
  drawCityGrid(buf, c.t, smoothstep(2.6, 5.2, c.t), 0.8);
};

const outro: Shot = (buf, c) => {
  const k = smoothstep(0, 2.4, c.t);
  drawOffice(buf, { t: c.t, cam: { x: lerp(92, KEY.x, k), y: lerp(168, KEY.y - 6, k), zoom: lerp(1.5, 3, k) }, aurora: 1 });
  drawFloppy(buf, 70, 96);
  drawBird(buf, 118, 182 + Math.sin(c.t * 3) * 3, c.frame, true);
};

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
