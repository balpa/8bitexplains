import { Buf, hex, lerp, smoothstep } from "./engine/pixel";
import { P } from "./engine/palette";
import { drawBird, drawFloppy } from "./engine/sprites";
import { drawAirglowRipples, drawChimney, drawStorm, drawUpdraft } from "./engine/storm";
import { PlanetOpts, drawOcean, drawPlanet, drawSpace, project } from "./engine/worlds";
import { Shot, ShotCtx, lineStart, split } from "./shot-kit";

// Hurricane Simon's eye on 11 Oct 2026: about 50 km off Mexico's Pacific coast (NASA Earth Observatory).
const SIMON = { lat: 19.3, lon: -105.6 };

const withStorm = (buf: Buf, globe: PlanetOpts, c: ShotCtx, strength = 1, eye = 0.12, radiusDeg = 11) => {
  drawPlanet(buf, globe);
  drawStorm(buf, globe, { ...SIMON, radiusDeg, strength, eye, t: c.t });
};

const steam = (buf: Buf, t: number, y0: number, y1: number) => {
  const w = [hex("#ffffff"), hex("#c9d4f0")];
  for (let i = 0; i < 36; i++) {
    const x = ((i * 47) % 180) + Math.sin(t * 2 + i) * 4;
    const y = y1 - ((t * 24 + i * 29) % (y1 - y0));
    buf.put(x, y, w[i % 2]);
    buf.put(x, y - 1, w[1]);
  }
};

const hook: Shot = (buf, c) => {
  const back = smoothstep(0, 2.6, c.t);
  drawSpace(buf, c.t, 1 - back);
  const globe: PlanetOpts = { cx: 90, cy: lerp(200, 196, back), r: lerp(230, 74, back), lon0: lerp(-106, -100, back), lat0: lerp(19, 12, back), heat: 0, t: c.t, night: 1 };
  withStorm(buf, globe, c);
  const eye = project(globe, SIMON.lat, SIMON.lon);
  drawAirglowRipples(buf, eye.x, eye.y - 6, c.t, lerp(160, 90, back));
  drawBird(buf, lerp(200, 128, smoothstep(1.6, 3, c.t)), 104 + Math.sin(c.t * 3) * 3, c.frame, true, 2, true);
};

const fuel: Shot = (buf, c) => {
  drawOcean(buf, { t: c.t, horizon: lerp(80, 124, smoothstep(0, 1.6, c.t)), speed: 2, heat: 1.6, wind: 0, altitude: lerp(2, 1, smoothstep(0, 1.6, c.t)) });
  steam(buf, c.t, 70, 300);
  drawBird(buf, 80, 170 + Math.sin(c.t * 4) * 3, c.frame, false, 2, true);
};

const chimney: Shot = (buf, c) =>
  split(
    c,
    lineStart(c, 2, 5.5) - 0.2,
    (b, cc) => {
      drawChimney(b, cc.t, cc.frame, smoothstep(lineStart(cc, 1, 1.5) - 0.3, lineStart(cc, 1, 1.5) + 0.5, cc.t));
      drawBird(b, 132, 120 + Math.sin(cc.t * 3) * 3, cc.frame, true);
    },
    (b, cc) => drawUpdraft(b, cc.t, smoothstep(lineStart(cc, 2, 5.5) - 0.2, cc.dur - 0.5, cc.t)),
  );

const spin: Shot = (buf, c) => {
  drawSpace(buf, c.t, 0.4);
  const globe: PlanetOpts = { cx: 90, cy: 170, r: 150, lon0: -105 + c.t * 0.4, lat0: 19, heat: 0, t: c.t };
  const l2 = lineStart(c, 2, 5);
  withStorm(buf, globe, c, lerp(0.35, 1, smoothstep(0, l2, c.t)), lerp(0, 0.12, smoothstep(l2, l2 + 1.2, c.t)), lerp(5, 11, smoothstep(0, l2, c.t)));
  drawBird(buf, 132, 110 + Math.sin(c.t * 3) * 3, c.frame, true);
};

const stat: Shot = (buf, c) => {
  drawSpace(buf, c.t, 0.5);
  const globe: PlanetOpts = { cx: 90, cy: 268, r: 120, lon0: -103, lat0: 20, heat: 0, t: c.t };
  withStorm(buf, globe, c);
  const eye = project(globe, SIMON.lat, SIMON.lon);
  const white = hex(P.white);
  for (let i = 0; i < 10; i++) {
    const a = c.t * 4 + (i / 10) * Math.PI * 2;
    const r = 26 + (i % 3) * 8;
    for (let k = 0; k < 5; k++) buf.put(eye.x + Math.cos(a - k * 0.06) * r, eye.y - Math.sin(a - k * 0.06) * r * 0.8, white);
  }
  drawBird(buf, 24, 220 + Math.sin(c.t * 5) * 4, c.frame, false, 2, true);
};

const ripples: Shot = (buf, c) => {
  drawSpace(buf, c.t, 0);
  const globe: PlanetOpts = { cx: 90, cy: 280, r: 150, lon0: -105, lat0: 8, heat: 0, t: c.t, night: 1 };
  withStorm(buf, globe, c);
  const eye = project(globe, SIMON.lat, SIMON.lon);
  drawAirglowRipples(buf, eye.x, eye.y - 4, c.t, 200);
  drawBird(buf, 132, 120 + Math.sin(c.t * 3) * 3, c.frame, true);
};

const outro: Shot = (buf, c) => {
  const out = smoothstep(0, 2.2, c.t);
  drawSpace(buf, c.t, 1 - out);
  const globe: PlanetOpts = { cx: 90, cy: lerp(250, 228, out), r: lerp(62, 34, out), lon0: -105 + c.t * 6, lat0: 12, heat: 0, t: c.t };
  withStorm(buf, globe, c, 1, 0.14, 9);
  drawFloppy(buf, 70, 96);
  drawBird(buf, 118, 182 + Math.sin(c.t * 3) * 3, c.frame, true);
};

export const EP002_SHOTS: Record<string, Shot> = {
  "simon-hook": hook,
  "simon-fuel": fuel,
  "simon-chimney": chimney,
  "simon-spin": spin,
  "simon-stat": stat,
  "simon-ripples": ripples,
  "simon-outro": outro,
};
