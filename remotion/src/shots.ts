import { Buf, clamp01, lerp, smoothstep } from "./engine/pixel";
import { drawBird, drawBoat, drawFloppy, drawRainIcon, drawShimmer, drawStar, drawSunIcon, drawThermometer } from "./engine/sprites";
import { drawTub } from "./engine/tub";
import { PlanetOpts, drawOcean, drawPlanet, drawSpace, drawUnderwater, project } from "./engine/worlds";
import { EP002_SHOTS } from "./shots-ep002";
import { EP003_SHOTS } from "./shots-ep003";
import { EP004_SHOTS, ep004Shake } from "./shots-ep004";
import { EP005_SHOTS, ep005Shake } from "./shots-ep005";
import { EP006_SHOTS, ep006Shake } from "./shots-ep006";
import { EP007_SHOTS, ep007Shake } from "./shots-ep007";
import { Shot, ShotCtx, lineStart, split } from "./shot-kit";

export type { ShotCtx } from "./shot-kit";

// Normal and El Nino scenes switch from the bathtub metaphor to the real ocean on their second line.
export const metaphorEnds = (c: ShotCtx) => lineStart(c, 1, 3.2) - 0.2;

const SLAM = 0.35;

const hook: Shot = (buf, c) => {
  const back = smoothstep(0, 2.4, c.t);
  drawSpace(buf, c.t, 1 - back);
  drawPlanet(buf, { cx: 90, cy: lerp(185, 172, back), r: lerp(260, 56, back), lon0: lerp(-140, -150, back), lat0: 4, heat: 1, t: c.t });
  const drop = smoothstep(SLAM - 0.2, SLAM, c.t);
  const t2 = lineStart(c, 1, 3.5);
  if (c.t > SLAM - 0.2) drawThermometer(buf, 120, lerp(-60, 90, drop), 36, lerp(0.35, 1, smoothstep(t2, t2 + 1.5, c.t)), c.frame);
  const bx = lerp(-30, 22, smoothstep(1.4, 2.8, c.t));
  drawBird(buf, bx, 104 + Math.sin(c.t * 3) * 3, c.frame, false, 2, c.t > 1.4);
};

const normalTub: Shot = (buf, c) =>
  drawTub(buf, { t: c.t, frame: c.frame, tilt: smoothstep(0.2, 1.8, c.t), wind: 1, upwell: smoothstep(1.2, 2.6, c.t) });
const normalUnder: Shot = (buf, c) => drawUnderwater(buf, { t: c.t, warmWest: 72, warmEast: 8, upwell: 1 });
const normal: Shot = (buf, c) => split(c, metaphorEnds(c), normalTub, normalUnder);

const ninoTub: Shot = (buf, c) => {
  const slosh = 1 - 1.5 * smoothstep(0.4, metaphorEnds(c), c.t) + 0.25 * Math.sin(c.t * 5) * Math.exp(-c.t);
  drawTub(buf, { t: c.t, frame: c.frame, tilt: slosh, wind: 1 - smoothstep(0, 0.9, c.t), upwell: 1 - smoothstep(0.4, 1.6, c.t) });
};
const ninoSurface: Shot = (buf, c) => {
  const s = lineStart(c, 1, 3);
  drawOcean(buf, { t: c.t, horizon: 124, speed: 2, heat: lerp(0.2, 0.95, smoothstep(s, c.dur - 0.5, c.t)), wind: 0.2, altitude: 1.2 });
  drawBird(buf, 82, 160 + Math.sin(c.t * 4) * 3, c.frame, false, 2, true);
};
const elnino: Shot = (buf, c) => split(c, metaphorEnds(c), ninoTub, ninoSurface);

const stat: Shot = (buf, c) => {
  const rise = smoothstep(0, 1.6, c.t);
  drawSpace(buf, c.t, 0.6);
  drawPlanet(buf, { cx: 90, cy: lerp(330, 290, rise), r: lerp(150, 118, rise), lon0: -140 + c.t * 1.5, lat0: 4, heat: 1, t: c.t });
  drawShimmer(buf, c.t, 150, 320, 46);
  drawThermometer(buf, 22, 112, 64, smoothstep(0.3, 2, c.t), c.frame);
  drawBird(buf, 130, 196 + Math.sin(c.t * 3) * 3, c.frame, true, 2, true);
};

const effects: Shot = (buf, c) => {
  const back = smoothstep(0, 1.4, c.t);
  drawSpace(buf, c.t, 1 - back);
  const l1 = lineStart(c, 1, 2.5), l2 = lineStart(c, 2, 5);
  const globe: PlanetOpts = { cx: 90, cy: 178, r: lerp(96, 66, back), lon0: -108, lat0: 26, heat: 0.8, t: c.t, jetLat: lerp(54, 38, smoothstep(0.8, l1, c.t)) };
  drawPlanet(buf, globe);
  const north = project(globe, 46, -100), gulf = project(globe, 31, -88);
  if (c.t > l1 && north.visible) drawSunIcon(buf, north.x - 8, north.y - 8 + (c.t - l1 < 0.15 ? 2 : 0));
  if (c.t > l2 && gulf.visible) drawRainIcon(buf, gulf.x - 12, gulf.y - 8 + (c.t - l2 < 0.15 ? 2 : 0), c.frame);
  drawBird(buf, 140, 96 + Math.sin(c.t * 3) * 3, c.frame, true);
};

const fact: Shot = (buf, c) => {
  drawOcean(buf, { t: c.t, horizon: 150, speed: 0.8, heat: 0.6, wind: 0.1, dusk: 1 });
  drawStar(buf, 34, 36, c.frame);
  const bob = Math.sin(c.t * 2.2) * 2;
  drawBoat(buf, 69, 158 + bob, 3);
  drawBird(buf, 112, 150 + bob, c.frame, true, 2);
};

const outro: Shot = (buf, c) => {
  const out = smoothstep(0, 2.2, c.t);
  drawSpace(buf, c.t, 1 - out);
  drawPlanet(buf, { cx: 90, cy: lerp(250, 228, out), r: lerp(62, 34, out), lon0: -150 + c.t * 8, lat0: 10, heat: 0.7, t: c.t });
  drawFloppy(buf, 70, 96);
  drawBird(buf, 118, 182 + Math.sin(c.t * 3) * 3, c.frame, true);
};

export const SHOTS: Record<string, Shot> = { hook, normal, elnino, stat, effects, fact, outro, ...EP002_SHOTS, ...EP003_SHOTS, ...EP004_SHOTS, ...EP005_SHOTS, ...EP006_SHOTS, ...EP007_SHOTS };

const EPISODE_SHAKES = [ep004Shake, ep005Shake, ep006Shake, ep007Shake];

// Screen shake in output pixels: the thermometer slam in the hook.
export const shakeAt = (visual: string, c: ShotCtx) => {
  for (const shake of EPISODE_SHAKES) {
    const s = shake(visual, c);
    if (s) return s;
  }
  if (visual !== "hook") return { x: 0, y: 0 };
  const k = clamp01(1 - (c.t - SLAM) / 0.4);
  if (c.t < SLAM || k <= 0) return { x: 0, y: 0 };
  return { x: Math.round(Math.sin(c.frame * 2.1) * 18 * k), y: Math.round(Math.cos(c.frame * 1.7) * 14 * k) };
};

export const drawShot = (visual: string, c: ShotCtx): Buf => {
  const buf = new Buf();
  const shot = SHOTS[visual];
  const out = shot ? shot(buf, c) : undefined;
  return out ?? buf;
};
