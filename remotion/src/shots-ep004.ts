import { hex, lerp, smoothstep } from "./engine/pixel";
import { P } from "./engine/palette";
import { drawBird, drawFloppy } from "./engine/sprites";
import { drawTub } from "./engine/tub";
import { drawBay, drawBrick } from "./engine/wave";
import { PlanetOpts, drawOcean, drawPlanet, drawSpace, project } from "./engine/worlds";
import { Shot, ShotCtx, lineStart, split } from "./shot-kit";

// Lituya Bay, Alaska (USGS).
const LITUYA = { lat: 58.6, lon: -137.6 };

const hook: Shot = (buf, c) => {
  const s = smoothstep(0.2, 2.2, c.t);
  drawBay(buf, { t: c.t, frame: c.frame, surge: s, reached: s, slide: 1 });
  drawBird(buf, 118, 60 + Math.sin(c.t * 3) * 3, c.frame, true, 2, s > 0.6);
};

const bay: Shot = (buf, c) => {
  const zoom = smoothstep(0, c.dur * 0.8, c.t);
  drawSpace(buf, c.t, zoom);
  const globe: PlanetOpts = { cx: 90, cy: 180, r: lerp(70, 380, zoom), lon0: lerp(-120, LITUYA.lon, zoom), lat0: lerp(40, LITUYA.lat, zoom), heat: 0, t: c.t };
  drawPlanet(buf, globe);
  const m = project(globe, LITUYA.lat, LITUYA.lon);
  if (m.visible && Math.floor(c.frame / 8) % 2 === 0) {
    const red = hex(P.red), white = hex(P.white);
    for (let i = -5; i <= 5; i++) {
      buf.put(m.x + i, m.y, white);
      buf.put(m.x, m.y + i, white);
    }
    buf.rect(m.x - 1, m.y - 1, 3, 3, red);
  }
};

const quake: Shot = (buf, c) => {
  drawBay(buf, { t: c.t, frame: c.frame, surge: 0, reached: 0, slide: 0 });
  const crack = hex(P.yellow);
  const k = smoothstep(0.6, c.dur - 0.5, c.t);
  for (let y = 40; y < 40 + 200 * k; y++) buf.put(70 + Math.sin(y / 6) * 6 + (y % 7 === 0 ? 2 : 0), y, crack);
};

const slideReal: Shot = (buf, c) => drawBay(buf, { t: c.t, frame: c.frame, surge: 0, reached: 0, slide: smoothstep(0.2, lineStart(c, 1, 3) - 0.3, c.t) });

const tub: Shot = (buf, c: ShotCtx) => {
  const l1 = lineStart(c, 1, 3), l2 = lineStart(c, 2, 5);
  const drop = smoothstep(l1 + 0.2, l2 - 0.2, c.t);
  const splash = smoothstep(l2 - 0.4, l2 + 0.6, c.t);
  const tilt = -1.6 * splash * (0.75 + 0.25 * Math.cos((c.t - l2) * 6) * Math.exp(-Math.max(0, c.t - l2)));
  drawTub(buf, { t: c.t, frame: c.frame, tilt, wind: 0, upwell: 0 });
  if (splash < 0.5) drawBrick(buf, 36, lerp(40, 170, drop * drop));
};

const slide: Shot = (buf, c) => split(c, lineStart(c, 1, 3) - 0.2, slideReal, tub);

const stat: Shot = (buf, c) => {
  const s = smoothstep(0, 2.4, c.t);
  drawBay(buf, { t: c.t, frame: c.frame, surge: s * (1 - smoothstep(4, c.dur, c.t) * 0.7), reached: s, slide: 1 });
};

const inland: Shot = (buf, c) => {
  drawOcean(buf, { t: c.t, horizon: 120, speed: 3.5, heat: -3, wind: 1, altitude: 1.4 });
  const foam = hex(P.white);
  const front = lerp(130, 330, (c.t / c.dur) % 1);
  for (let x = 0; x < 180; x++) for (let k = 0; k < 4; k++) buf.put(x, front + Math.sin(x / 5 + c.t * 8) * 3 + k, foam);
  drawBird(buf, 120, 96 + Math.sin(c.t * 3) * 3, c.frame, true, 2, true);
};

const outro: Shot = (buf, c) => {
  const out = smoothstep(0, 2.2, c.t);
  drawSpace(buf, c.t, 1 - out);
  drawPlanet(buf, { cx: 90, cy: lerp(250, 228, out), r: lerp(62, 34, out), lon0: -137 + c.t * 6, lat0: 40, heat: 0, t: c.t });
  drawFloppy(buf, 70, 96);
  drawBird(buf, 118, 182 + Math.sin(c.t * 3) * 3, c.frame, true);
};

export const EP004_SHOTS: Record<string, Shot> = {
  "wave-hook": hook,
  "wave-bay": bay,
  "wave-quake": quake,
  "wave-slide": slide,
  "wave-stat": stat,
  "wave-inland": inland,
  "wave-outro": outro,
};

// The earthquake scene shakes the whole frame.
export const ep004Shake = (visual: string, c: ShotCtx) => {
  if (visual !== "wave-quake") return null;
  const k = smoothstep(0.3, 0.8, c.t) * (1 - smoothstep(c.dur - 1, c.dur, c.t));
  return { x: Math.round(Math.sin(c.frame * 2.3) * 14 * k), y: Math.round(Math.cos(c.frame * 1.9) * 10 * k) };
};
