import { Buf, hex, lerp, smoothstep } from "./engine/pixel";
import { P } from "./engine/palette";
import { FREE_RETURN, drawMoon, drawOrion, drawPath, drawWellGrid, pathPoint } from "./engine/moon";
import { drawBird, drawFloppy } from "./engine/sprites";
import { drawPlanet, drawSpace } from "./engine/worlds";
import { Shot, lineStart } from "./shot-kit";

const EARTH = { cx: 54, cy: 262, r: 34 };
const MOON = { cx: 132, cy: 112, r: 18 };

const map = (buf: Buf, c: { t: number }) => {
  drawSpace(buf, c.t, 0);
  drawPlanet(buf, { ...EARTH, lon0: -60 + c.t * 4, lat0: 15, heat: 0, t: c.t });
  drawMoon(buf, MOON.cx, MOON.cy, MOON.r, c.t * 0.05);
};

const hook: Shot = (buf, c) => {
  const zoom = smoothstep(0, 2.4, c.t);
  drawSpace(buf, c.t, 1 - zoom);
  drawMoon(buf, 90, lerp(150, 120, zoom), lerp(150, 52, zoom), 0.4 + c.t * 0.05);
  const s = smoothstep(0.4, c.dur - 0.4, c.t);
  const a = lerp(Math.PI * 0.9, Math.PI * 2.4, s);
  const R = lerp(170, 66, zoom);
  const x = 90 + Math.cos(a) * R - 10, y = lerp(150, 120, zoom) + Math.sin(a) * R * 0.45 - 9;
  if (Math.sin(a) < 0.2 || Math.cos(a) < -0.3) drawOrion(buf, x, y, c.frame, 0, 2);
  drawBird(buf, 24, 236 + Math.sin(c.t * 3) * 3, c.frame, false);
};

const push: Shot = (buf, c) => {
  const k = smoothstep(0, c.dur, c.t);
  drawSpace(buf, c.t, 0.3);
  drawPlanet(buf, { cx: 90, cy: lerp(330, 420, k), r: lerp(150, 130, k), lon0: -80, lat0: 20, heat: 0, t: c.t });
  drawOrion(buf, 80 + Math.sin(c.t * 9) * 1.5, lerp(170, 110, k), c.frame, 1, 3);
  drawBird(buf, 124, 120 + Math.sin(c.t * 3) * 3, c.frame, true);
};

const wells: Shot = (buf, c) => {
  const l1 = lineStart(c, 1, 2);
  const dip = smoothstep(l1 - 0.6, l1 + 0.8, c.t);
  const roll = smoothstep(l1 + 1, c.dur - 0.2, c.t);
  drawWellGrid(
    buf,
    c.t,
    [
      { x: -0.5, z: 0.5, depth: 0.9 * dip, width: 0.45 },
      { x: 0.7, z: 2.2, depth: 0.45 * dip, width: 0.3 },
    ],
    dip > 0.3 ? { x: lerp(-0.2, 0.55, roll), z: lerp(0.8, 2.0, roll) } : undefined,
  );
  drawBird(buf, 130, 104 + Math.sin(c.t * 3) * 3, c.frame, true);
};

const slingshot: Shot = (buf, c) => {
  map(buf, c);
  const p = smoothstep(0, c.dur - 0.6, c.t);
  drawPath(buf, FREE_RETURN, p, c.frame);
  const [x, y] = pathPoint(FREE_RETURN, p);
  drawOrion(buf, x - 10, y - 9, c.frame, 0, 2);
};

const stat: Shot = (buf, c) => {
  drawSpace(buf, c.t, 0);
  const pull = smoothstep(0, c.dur, c.t);
  drawMoon(buf, 90, 300, lerp(130, 120, pull), 2.6 + c.t * 0.03);
  drawPlanet(buf, { cx: 148, cy: 150, r: lerp(7, 5, pull), lon0: -40, lat0: 10, heat: 0, t: c.t });
  drawOrion(buf, 30, 170 + Math.sin(c.t * 2) * 2, c.frame, 0, 2);
};

const blackout: Shot = (buf, c) => {
  drawSpace(buf, c.t, 0);
  const slide = smoothstep(0, c.dur * 0.6, c.t);
  drawPlanet(buf, { cx: lerp(120, 96, slide), cy: 210, r: 16, lon0: -40, lat0: 10, heat: 0, t: c.t });
  drawMoon(buf, 60, 250, 120, 2.2);
  const blink = Math.floor(c.frame / 10) % 2 === 0;
  const red = hex(P.red), dim = hex("#5d5a7a");
  for (let i = 0; i < 4; i++) buf.rect(126 + i * 6, 76 - i * 4, 4, 6 + i * 4, blink ? (i === 0 ? red : dim) : dim);
  drawOrion(buf, 120, 140 + Math.sin(c.t * 2) * 2, c.frame, 0, 2);
};

const outro: Shot = (buf, c) => {
  const out = smoothstep(0, 2.2, c.t);
  drawSpace(buf, c.t, 1 - out);
  drawPlanet(buf, { cx: 78, cy: lerp(250, 232, out), r: lerp(56, 30, out), lon0: -60 + c.t * 6, lat0: 12, heat: 0, t: c.t });
  drawMoon(buf, 128, lerp(206, 196, out), lerp(18, 10, out), c.t * 0.1);
  drawFloppy(buf, 70, 96);
  drawBird(buf, 118, 150 + Math.sin(c.t * 3) * 3, c.frame, true);
};

export const EP003_SHOTS: Record<string, Shot> = {
  "moon-hook": hook,
  "moon-push": push,
  "moon-wells": wells,
  "moon-slingshot": slingshot,
  "moon-stat": stat,
  "moon-blackout": blackout,
  "moon-outro": outro,
};
