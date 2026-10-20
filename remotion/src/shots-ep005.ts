import { clamp01, lerp, smoothstep } from "./engine/pixel";
import { LAKE_C, drawGeoCut, drawNyos, drawSoda } from "./engine/nyos";
import { drawBird, drawFloppy } from "./engine/sprites";
import { Shot, ShotCtx, lineStart, split } from "./shot-kit";

// Lake Nyos, Cameroon, 21 August 1986 (NASA Earth Observatory).

const hook: Shot = (buf, c) => {
  const pull = smoothstep(0, 2.6, c.t);
  drawNyos(buf, {
    t: c.t,
    cam: { x: lerp(LAKE_C.x, 100, pull), y: lerp(LAKE_C.y - 4, 186, pull), zoom: lerp(2.3, 1.05, pull) },
    bulge: lerp(0.45, 1, smoothstep(0, 1.1, c.t)),
    cloud: smoothstep(0.6, c.dur, c.t) * 0.42,
  });
  drawBird(buf, lerp(150, 128, pull), 96 + Math.sin(c.t * 3) * 3, c.frame, true, 2, c.t > 1);
};

const magma: Shot = (buf, c) => {
  const l1 = lineStart(c, 1, 3.4);
  drawGeoCut(buf, { t: c.t, camY: lerp(560, 190, smoothstep(l1 - 1, l1 + 1.4, c.t)), gas: smoothstep(l1, c.dur, c.t) });
};

const soda: Shot = (buf, c) => {
  const popAt = c.dur - 0.9;
  drawSoda(buf, c.t, smoothstep(0, popAt, c.t), clamp01((c.t - popAt) / 1.0));
  if (c.t > popAt) drawBird(buf, 130, 150 + Math.sin(c.t * 9) * 2, c.frame, true, 2, true);
};

// The deep water rises (cut-away), then the gas bursts out at "burst out at once" (surface).
const burstAt = (c: ShotCtx) => lineStart(c, 1, 5.6) - 1.5;
const geoBurst: Shot = (buf, c) => drawGeoCut(buf, { t: c.t, camY: 170, gas: 1, bubble: smoothstep(0.2, burstAt(c), c.t) });
const landBurst: Shot = (buf, c) => {
  const b = burstAt(c);
  const k = smoothstep(b, c.dur, c.t);
  drawNyos(buf, { t: c.t, cam: { x: LAKE_C.x + 6, y: LAKE_C.y - 12 * k, zoom: lerp(2.4, 1.8, k) }, erupt: smoothstep(b - 0.2, b + 1.2, c.t), bulge: 1 });
};
const burst: Shot = (buf, c) => split(c, burstAt(c), geoBurst, landBurst);

const cloud: Shot = (buf, c) => {
  const k = smoothstep(0, c.dur, c.t);
  drawNyos(buf, { t: c.t, cam: { x: lerp(96, 168, k), y: lerp(172, 222, k), zoom: 1.5 }, cloud: lerp(0.1, 0.55, k), bulge: 0.6, dark: 0.001 });
};

const village: Shot = (buf, c) => {
  const k = smoothstep(0, c.dur, c.t);
  drawNyos(buf, { t: c.t, cam: { x: lerp(168, 188, k), y: 234, zoom: 2.4 }, cloud: lerp(0.45, 0.85, k), dark: 0.001 });
};

const pipes: Shot = (buf, c) => {
  const k = smoothstep(0, c.dur, c.t);
  drawNyos(buf, { t: c.t, cam: { x: lerp(60, 112, k), y: lerp(160, 196, k), zoom: lerp(2, 1.1, k) }, dawn: 1, fountain: smoothstep(0, 1, c.t) });
  drawBird(buf, lerp(20, 60, k), 104 + Math.sin(c.t * 3) * 3, c.frame, false, 2);
};

const outro: Shot = (buf, c) => {
  const k = smoothstep(0, 2.2, c.t);
  drawNyos(buf, { t: c.t, cam: { x: LAKE_C.x, y: LAKE_C.y - 4 * k, zoom: lerp(1.6, 2.3, k) }, dawn: 1, fountain: 1 });
  drawFloppy(buf, 70, 96);
  drawBird(buf, 118, 182 + Math.sin(c.t * 3) * 3, c.frame, true);
};

export const EP005_SHOTS: Record<string, Shot> = {
  "nyos-hook": hook,
  "nyos-magma": magma,
  "nyos-soda": soda,
  "nyos-burst": burst,
  "nyos-cloud": cloud,
  "nyos-village": village,
  "nyos-pipes": pipes,
  "nyos-outro": outro,
};

// The lake erupting rumbles the frame.
export const ep005Shake = (visual: string, c: ShotCtx) => {
  if (visual !== "nyos-burst") return null;
  const b = burstAt(c);
  const k = smoothstep(b - 0.2, b + 0.3, c.t) * (1 - smoothstep(b + 1.2, b + 2, c.t));
  return { x: Math.round(Math.sin(c.frame * 2.3) * 10 * k), y: Math.round(Math.cos(c.frame * 1.9) * 8 * k) };
};
