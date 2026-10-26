import { Buf, clamp01, hex, lerp, smoothstep } from "./engine/pixel";
import { Camera, toScreen } from "./engine/fine";
import { LAKE_C, drawGeoCut, drawNyos, drawSoda, groundY, mistFront } from "./engine/nyos";
import { drawBird, drawBirdAs, drawCloseUp, drawNumber } from "./engine/sprites";
import { Shot, ShotCtx, lineStart, split } from "./shot-kit";

// Lake Nyos, Cameroon, 21 August 1986 (NASA Earth Observatory).

// The bird riding the degassing fountain, 21 logical px tall at scale 3.
const onFountain = (buf: Buf, c: ShotCtx, cam: Camera, flinch: boolean) => {
  const p = toScreen(cam, LAKE_C.x, LAKE_C.y - 30 * (0.92 + 0.08 * Math.sin(c.t * 9)));
  drawBirdAs(buf, p.x - 16, p.y - 19, c.frame, flinch ? "puffed" : "shades", false, 3);
};

// Faces on things (L28): two eyes drawn on a surface, half shut when sleepy, round when startled.
const eyesAt = (buf: Buf, cam: Camera, wx: number, wy: number, open: number, gap = 10) => {
  const z = cam.zoom, w = Math.max(3, Math.round(3.4 * z)), h = Math.max(2, Math.round((1 + 2.4 * open) * z));
  for (const dx of [-gap, gap]) {
    const p = toScreen(cam, wx + dx, wy);
    buf.rect(p.x - w / 2, p.y - h / 2, w, h, hex("#f4f1e8"));
    buf.rect(p.x - Math.round(w / 4), p.y - Math.round(h / 4), Math.max(1, Math.round(w / 2)), Math.max(1, Math.round(h / 2)), hex("#05040f"));
  }
};

// Frame 0 and the outro's last frame share this camera so the replay loops (L26).
const CAM0 = { x: LAKE_C.x, y: LAKE_C.y - 4, zoom: 2.3 };
const BURP = 0.9;

// Gag (L24): the sleepy lake burps and blows the bird head over heels.
const wide: Shot = (buf, c) => {
  const pull = smoothstep(0, 2.6, c.t), push = smoothstep(3.2, c.dur, c.t);
  const cam = { x: lerp(lerp(CAM0.x, 100, pull), 150, push), y: lerp(lerp(CAM0.y, 186, pull), 214, push), zoom: lerp(lerp(CAM0.zoom, 1.05, pull), 1.9, push) };
  drawNyos(buf, { t: c.t, cam, bulge: lerp(0.45, 1, smoothstep(0, 1.1, c.t)), cloud: smoothstep(0.6, c.dur, c.t) * 0.42 });
  eyesAt(buf, cam, LAKE_C.x, LAKE_C.y + 1, c.t < BURP ? 0.15 : 1);
  const blown = smoothstep(BURP, BURP + 0.7, c.t);
  const bx = lerp(140, 122, pull) + 14 * blown, by = 120 + Math.sin(c.t * 3) * 3 - 16 * blown + 12 * smoothstep(1.8, 3, c.t);
  if (c.t < BURP) drawBird(buf, bx, by, c.frame, true, 3);
  else if (c.t < BURP + 0.9) drawBirdAs(buf, bx, by, c.frame, "puffed", Math.floor(c.frame / 3) % 2 === 0, 3);
  else drawBird(buf, bx, by, c.frame, true, 3, true);
};

// The hook cuts on caption chunks (L27): sleepy lake, the burp, the bird's shocked face, then wide.
const hook: Shot = (buf, c) => (c.t >= 1.7 && c.t < 2.5 ? drawCloseUp(buf, c.t, c.frame, "shock", 6) : wide(buf, c));

const magma: Shot = (buf, c) => {
  const l1 = lineStart(c, 1, 3.4);
  drawGeoCut(buf, { t: c.t, camY: lerp(560, 190, smoothstep(l1 - 1, l1 + 1.4, c.t)), gas: smoothstep(l1, c.dur, c.t) });
};

const soda: Shot = (buf, c) => {
  const popAt = c.dur - 0.9;
  const push = smoothstep(0.3, popAt, c.t), back = smoothstep(popAt, popAt + 0.5, c.t);
  const cam = { x: 90, y: lerp(lerp(160, 96, push), 120, back), zoom: lerp(lerp(1, 1.9, push), 1.15, back) };
  const pop = clamp01((c.t - popAt) / 1.0);
  drawSoda(buf, c.t, smoothstep(0, popAt, c.t), pop, cam);
  eyesAt(buf, cam, 90, 112, pop > 0 ? 1 : 0.3 + 0.5 * smoothstep(0, popAt, c.t), 4);
  // Gag: the bird leans on the neck, sweating as the pressure builds, and the pop blows it away.
  const neck = toScreen(cam, 104, 104);
  const bx = neck.x - 4 + pop * 90, by = neck.y - 20 - pop * 40;
  if (pop <= 0) drawBird(buf, bx, by, c.frame, true, 3, c.t > popAt - 2.5);
  else drawBirdAs(buf, bx, by, c.frame, "puffed", Math.floor(c.frame / 3) % 2 === 0, 3);
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

// The peak (L28, L29): the cloud's front carries its speed on a label, then the bird reacts in
// close-up to "You couldn't outrun it."
const cloud: Shot = (buf, c) => {
  const l1 = lineStart(c, 1, 3.7);
  if (c.t > l1 + 1.6) return drawCloseUp(buf, c.t, c.frame, "sweat");
  const k = smoothstep(0, c.dur, c.t);
  const cam = { x: lerp(96, 168, k), y: lerp(172, 222, k), zoom: 1.5 };
  const amount = lerp(0.1, 0.55, k);
  drawNyos(buf, { t: c.t, cam, cloud: amount, bulge: 0.6, dark: 0.001 });
  const fx = mistFront(amount), p = toScreen(cam, fx, groundY(fx) - 26);
  if (c.t > l1 - 0.2) drawNumber(buf, "60 MPH", Math.min(150, Math.max(30, p.x)), Math.max(70, p.y), "#ffd23f", 2);
};

const village: Shot = (buf, c) => {
  const k = smoothstep(0, c.dur, c.t);
  drawNyos(buf, { t: c.t, cam: { x: lerp(168, 188, k), y: 234, zoom: 2.4 }, cloud: lerp(0.45, 0.85, k), dark: 0.001 });
};

const pipes: Shot = (buf, c) => {
  const k = smoothstep(0, c.dur, c.t);
  const cam = { x: lerp(60, 112, k), y: lerp(160, 196, k), zoom: lerp(2, 1.1, k) };
  const jet = smoothstep(0, 1, c.t);
  drawNyos(buf, { t: c.t, cam, dawn: 1, fountain: jet });
  // Gag: once the headline gives way to the reveal, the bird surfs the jet in sunglasses.
  const surf = lineStart(c, 1, 3.5) - 0.2;
  if (c.t >= surf) onFountain(buf, c, cam, false);
  else drawBird(buf, lerp(10, 44, smoothstep(0, surf, c.t)), 124 + Math.sin(c.t * 3) * 3, c.frame, false, 3);
};

// Loop (L26): from the calm dawn lake the picture rewinds to 1986, night and the sleepy lake, so the
// last frame is frame 0 and "...a tiny reminder that" runs into "this lake burped...".
const dawnLake: Shot = (buf, c) => {
  const k = smoothstep(0, 2.2, c.t);
  const cam = { x: LAKE_C.x, y: lerp(LAKE_C.y - 4, CAM0.y, k), zoom: lerp(1.6, CAM0.zoom, k) };
  drawNyos(buf, { t: c.t, cam, dawn: 1, fountain: 1 });
  const burp = (c.t % 2.6) > 1.8 && (c.t % 2.6) < 2.3;
  drawBirdAs(buf, 116, 176 + Math.sin(c.t * 3) * 3, c.frame, burp ? "puffed" : "shades", true, 3);
};
const frame0: Shot = (buf, c) => wide(buf, { ...c, t: 0 });
const outro: Shot = (buf, c) => split(c, c.dur - 1.4, dawnLake, frame0, 0.8);

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
