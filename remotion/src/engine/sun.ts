import { Buf, H, PX, RGB, W, clamp01, hex, lerp, noise3, ramp, rng, smoothstep } from "./pixel";
import { Camera, cover, drawBolt, drawFire, fineLine, fineStars, glow, makeBolt, mix, pick, shadeAll, toScreen, toWorld } from "./fine";

// Solar superstorms (ep006): the Sun's surface, a garden-hose metaphor, an 1859 telegraph
// office, Quebec in 1989, the 2012 near miss and a city grid seen from above.

const SUN = ramp(["#4a0608", "#8f1810", "#d0401a", "#ff7a2a", "#ffb347", "#ffe08a", "#fff6d0"]);
const CORONA = hex("#ff9a3a");

// Worley-style cell pattern: returns the distance to the nearest cell edge (0 on the lanes).
const cells = (x: number, y: number, t: number) => {
  const ix = Math.floor(x), iy = Math.floor(y);
  let d1 = 9, d2 = 9;
  for (let j = -1; j <= 1; j++)
    for (let i = -1; i <= 1; i++) {
      const cx = ix + i, cy = iy + j;
      const h = Math.sin(cx * 127.1 + cy * 311.7) * 43758.5453;
      const px = cx + 0.5 + 0.4 * Math.sin(h + t * 0.7), py = cy + 0.5 + 0.4 * Math.cos(h * 1.3 + t * 0.6);
      const d = Math.hypot(x - px, y - py);
      if (d < d1) {
        d2 = d1;
        d1 = d;
      } else if (d < d2) d2 = d;
    }
  return d2 - d1;
};

export type SunOpts = { t: number; limbY: number; flare: number; cme: number; earth?: number };

// Close-up of the solar surface: boiling granules, sunspots, a flare loop and a launched CME.
export const drawSunSurface = (buf: Buf, o: SunOpts) => {
  const { t, limbY, flare, cme } = o;
  const R = 420, cx = 90, cy = limbY + R;
  shadeAll(buf, (x, y) => {
    const d = Math.hypot(x - cx, y - cy);
    if (d > R) {
      const e = d - R;
      if (e < 26 && cover(x, y, (1 - e / 26) ** 2 * (0.8 + 0.2 * Math.sin(Math.atan2(y - cy, x - cx) * 40 + t)))) return mix(CORONA, hex("#5a1a2a"), e / 30);
      return pick(ramp(["#05030c", "#0e0618", "#1a0a22"]), x, y, 0.3 + (1 - Math.min(1, e / 200)) * 0.5);
    }
    const mu = Math.sqrt(1 - (d / R) ** 2);
    const lane = cells(x / 4.2, y / 4.2 + t * 0.05, t);
    let v = 0.3 + 0.5 * mu + smoothstep(0, 0.25, lane) * 0.16 + noise3(x * 0.06, y * 0.06, t * 0.2) * 0.22 - (1 - mu) * 0.2;
    const spot = Math.hypot((x - 132) / 16, (y - limbY - 70) / 10);
    if (spot < 1) v = spot < 0.55 ? 0.02 : 0.2;
    const spot2 = Math.hypot((x - 40) / 9, (y - limbY - 110) / 6);
    if (spot2 < 1) v = spot2 < 0.5 ? 0.04 : 0.22;
    return pick(SUN, x, y, v);
  });
  fineStars(buf, t, 70, Math.max(0, limbY - 30), 3);
  if (flare > 0) {
    const fx0 = 62, fx1 = 112, base = limbY + 8, hgt = 58 * flare;
    for (let a = 0; a <= Math.PI; a += 0.012) {
      const x = lerp(fx0, fx1, (1 - Math.cos(a)) / 2), y = base - Math.sin(a) * hgt;
      const w = 3 + 1.5 * Math.sin(a * 3 + t * 6);
      for (let k = -w; k <= w; k += PX) {
        const c = Math.abs(k) < w * 0.35 ? hex("#fff6d0") : Math.abs(k) < w * 0.7 ? hex("#ffb347") : hex("#ff5a2a");
        if (cover(x + k, y, 1 - Math.abs(k) / (w + 1) + 0.3)) buf.dot(x + k, y + Math.sin(a * 9 + t * 4) * 0.8, c);
      }
    }
    glow(buf, 87, base - hgt * 0.8, 26 * flare, hex("#ffe08a"), 0.5);
  }
  if (cme > 0) {
    const r = rng(41);
    const ccx = lerp(87, 150, cme * cme), ccy = lerp(limbY - 30, -40, cme), rad = lerp(10, 70, cme);
    for (let i = 0; i < 900; i++) {
      const a = r() * Math.PI * 2, rr = rad * (0.75 + 0.25 * r());
      const x = ccx + Math.cos(a) * rr, y = ccy + Math.sin(a) * rr * 0.8;
      if (Math.sin(a) > 0.7 && r() > 0.3) continue;
      buf.dot(x, y, r() > 0.6 ? hex("#ffe08a") : hex("#ff8a3d"));
    }
  }
  if (o.earth !== undefined && o.earth > 0) {
    const ex = 152, ey = 40;
    glow(buf, ex, ey, 7, hex("#3ee0ff"), 0.6 * o.earth);
    shadeAll(buf, (x, y) => (Math.hypot(x - ex, y - ey) < 2.6 ? pick(ramp(["#1a3a8a", "#3a7ad8", "#7fd0a0"]), x, y, 0.8 - (x - ex + y - ey) / 6) : null), ex - 4, ey - 4, ex + 4, ey + 4);
  }
};

// Garden metaphor: a hose (the solar wind) sprays at an umbrella (Earth's magnetic field);
// with a big hit some spray gets past and lights up the long wire behind it.
const AFTERNOON = ramp(["#3a6ab8", "#5a8ad0", "#8ab0e0", "#c0d4ee", "#f0dcc8"]);
const LAWN = ramp(["#1f4a24", "#2f6a2e", "#4a8a3a", "#6aa848"]);
const CANOPY = [ramp(["#7a1020", "#c02a3a", "#ff5a6a"]), ramp(["#8a6a10", "#e0b020", "#ffe06a"])];

export const drawShield = (buf: Buf, t: number, hit: number, current: number, cam: Camera = { x: W / 2, y: H / 2, zoom: 1 }, open = 1) => {
  const ucx = 98, ucy = 150, ur = 38, urw = ur * lerp(0.18, 1, open), tilt = Math.sin(t * 9) * 0.12 * hit;
  const z = cam.zoom;
  const S = (x: number, y: number) => toScreen(cam, x, y);
  const line = (x0: number, y0: number, x1: number, y1: number, c: RGB, w: number) => {
    const a = S(x0, y0), b = S(x1, y1);
    fineLine(buf, a.x, a.y, b.x, b.y, c, w * z);
  };
  shadeAll(buf, (sx, sy) => {
    const { x, y } = toWorld(cam, sx, sy);
    if (y < 190) return pick(AFTERNOON, sx, sy, 0.1 + y / 210);
    const far = y < 196;
    return far ? pick(ramp(["#2a5a3a", "#3a6a44"]), sx, sy, 0.5) : pick(LAWN, sx, sy, 0.9 - (y - 196) / 140 + 0.1 * Math.sin(x * 0.7 + y * 0.3));
  });
  shadeAll(buf, (sx, sy) => {
    const { x, y } = toWorld(cam, sx, sy);
    const fence = y > 168 && y < 196 && Math.floor(x) % 9 < 6 && (y > 172 || Math.floor(x) % 9 > 1);
    return fence ? pick(ramp(["#8a7a6a", "#c8b8a0", "#e8dcc8"]), sx, sy, 0.4 + (Math.floor(x) % 9) / 12) : null;
  });
  const wire = hex("#1a1420");
  line(150, 120, 150, 230, hex("#4a3020"), 3);
  line(140, 124, 160, 124, hex("#4a3020"), 2);
  const wireY = (x: number) => (x < 150 ? 124 + ((150 - x) / 150) ** 2 * 26 - 4 : 124 + ((x - 150) / 30) ** 2 * 6);
  for (let x = -2; x < W + 2; x += PX / z) {
    const p = S(x, wireY(x));
    for (let o = 0; o < z * PX; o += PX) buf.dot(p.x, p.y + o, wire);
  }
  if (current > 0) {
    for (let k = 0; k < 6; k++) {
      const x = ((t * 80 + k * 30) % 180);
      if (cover(x, 0, current)) {
        const p = S(x, wireY(x));
        glow(buf, p.x, p.y, 6 * z, hex("#ffd23f"), current);
        buf.dot(p.x, p.y, hex("#ffffff"));
      }
    }
  }
  shadeAll(buf, (sx, sy) => {
    const { x, y } = toWorld(cam, sx, sy);
    const dx = x - ucx, dy = y - ucy;
    const rx = dx * Math.cos(tilt) + dy * Math.sin(tilt), ry = -dx * Math.sin(tilt) + dy * Math.cos(tilt);
    if (ry > 0 || ry < -ur * 0.62) return null;
    const e = (rx / urw) ** 2 + (ry / (ur * 0.62)) ** 2;
    if (e > 1) return null;
    const scallop = ry > -2 && Math.abs(Math.sin((rx / urw) * Math.PI * 3)) > 0.85 && ry > -1;
    if (scallop) return null;
    const seg = Math.floor(((Math.atan2(ry, rx) + Math.PI) / Math.PI) * 6) % 2;
    return pick(CANOPY[seg], sx, sy, 0.85 - (rx + urw) / (2 * urw) * 0.6 - e * 0.2);
  });
  line(ucx + Math.sin(tilt) * 4, ucy - ur * 0.62, ucx - Math.sin(tilt) * 40, ucy + 46, hex("#3a2a20"), 1.5);
  line(-2, 214, 26, 200, hex("#1f7a3a"), 3.5);
  line(26, 200, 34, 196, hex("#c0c0c8"), 3);
  const jet = hex("#9ad4ff");
  for (let u = 0; u <= 1; u += 0.01) {
    const x = lerp(34, ucx - ur + 4, u), y = 196 - u * 46 + u * u * 22 + Math.sin(u * 30 - t * 20) * 0.6;
    line(x, y, x + 1.2, y, u > 0.9 ? hex("#e6f6ff") : jet, 1.2 + hit * 1.2);
  }
  const r = rng(5);
  const drop = [hex("#9ad4ff"), hex("#e6f6ff")];
  const n = Math.round(lerp(90, 200, hit));
  for (let i = 0; i < n; i++) {
    const life = (t * (1.4 + hit) + r()) % 1, spread = (r() - 0.5) * (14 + 30 * hit);
    let x = 36 + life * 120, y = 196 - life * 46 + life * life * 26 + spread * life;
    const through = r() < hit * 0.35 || open < 0.5;
    if (!through && x > ucx - urw - 2 && Math.hypot((x - ucx) / urw, (y - ucy) / (ur * 0.7)) < 1.05) {
      const back = (x - (ucx - urw)) * 0.9;
      x = ucx - urw - back * 0.6;
      y = y + back * 0.8;
    }
    const p = S(x, y);
    buf.put(p.x, p.y, drop[i % 2]);
  }
};

// 1859 telegraph office at night, lit by the aurora through the window.
const PLANK = ramp(["#1a0e0a", "#2e1a10", "#4a2a16", "#6a3e1e"]);
const DESK = ramp(["#140806", "#2a1208", "#46200e", "#6a3416"]);
const BRASS = ramp(["#4a3010", "#8a6020", "#d0a040", "#ffe08a"]);
const AURORA = [hex("#0a3a2a"), hex("#1f8a5a"), hex("#4fe08a"), hex("#b0ffd0")];

// Folded aurora curtain: a bright, wavy lower hem with rays fading upwards.
export const aurora = (x: number, y: number, t: number, top: number, bottom: number) => {
  const span = bottom - top;
  const hem = top + span * (0.62 + 0.16 * Math.sin(x * 0.045 + t * 0.35) + 0.08 * Math.sin(x * 0.13 - t * 0.6));
  if (y > hem + 3) return 0;
  const up = (hem - y) / (span * (0.45 + 0.25 * noise3(x * 0.03, t * 0.2, 2)));
  const rays = 0.45 + 0.55 * noise3(x * 0.35, t * 0.8, 5);
  const fold = 0.6 + 0.4 * Math.sin(x * 0.07 + Math.sin(x * 0.02 + t * 0.3) * 4);
  const v = y > hem ? 1 - (y - hem) / 3 : Math.exp(-up * 2.2) * rays;
  return clamp01(v * fold * 1.25);
};

export type OfficeOpts = { t: number; cam: Camera; aurora: number; sparks?: number; fire?: number; paper?: number };

export const drawOffice = (buf: Buf, o: OfficeOpts) => {
  const { t, cam } = o;
  const win = { x0: 52, x1: 128, y0: 62, y1: 150 };
  const tint = hex("#2a8a5a");
  shadeAll(buf, (sx, sy) => {
    const { x, y } = toWorld(cam, sx, sy);
    let c: RGB;
    if (x > win.x0 && x < win.x1 && y > win.y0 && y < win.y1) {
      const bar = Math.abs(x - 90) < 1.2 || Math.abs(y - 106) < 1.2;
      if (bar) return pick(PLANK, sx, sy, 0.3);
      c = pick(ramp(["#04040e", "#0a0c22", "#141838"]), sx, sy, (y - win.y0) / 120);
      const a = aurora(x * 1.4, y, t, win.y0 - 10, win.y1 + 20) * o.aurora;
      if (a > 0.1) c = pick(AURORA, sx, sy, a * 1.15);
      if (y > 134) c = pick(ramp(["#02020a", "#0a0a1a"]), sx, sy, 0.5 + 0.5 * Math.sin(x * 0.4));
      return c;
    }
    const frame = x > win.x0 - 4 && x < win.x1 + 4 && y > win.y0 - 4 && y < win.y1 + 6;
    if (frame) return pick(PLANK, sx, sy, 0.85);
    if (y > 214) {
      c = pick(DESK, sx, sy, 0.75 - (y - 214) / 120 + 0.08 * Math.sin(x * 0.5 + y * 0.05));
      if (y < 217) c = DESK[3];
    } else {
      const plank = Math.floor(x / 11);
      const seam = Math.abs(x - plank * 11) < 0.6;
      c = seam ? PLANK[0] : pick(PLANK, sx, sy, 0.45 + 0.15 * Math.sin(plank * 2.7) + 0.12 * noise3(x * 0.1, y * 0.02, plank) - Math.abs(x - 90) / 400);
    }
    const lit = o.aurora * clamp01(1 - Math.hypot(x - 90, y - 120) / 140) * 0.35;
    const lamp = clamp01(1 - Math.hypot(x - 30, y - 196) / 70) * 0.35;
    c = mix(c, tint, lit);
    c = mix(c, hex("#ffb347"), lamp * 0.6);
    return c;
  });
  const P = (x: number, y: number) => toScreen(cam, x, y);
  const z = cam.zoom;
  shadeAll(buf, (sx, sy) => {
    const { x, y } = toWorld(cam, sx, sy);
    const base = x > 70 && x < 112 && y > 206 && y < 214;
    const post = x > 76 && x < 82 && y > 196 && y < 207;
    const ang = -0.12 + (o.sparks ?? 0) * 0.05 * Math.sin(t * 30);
    const ly = 198 + (x - 80) * ang;
    const lever = x > 76 && x < 108 && Math.abs(y - ly) < 1.6;
    const knob = Math.hypot(x - 106, y - (198 + 26 * ang) + 3) < 4.2;
    const coil = x > 92 && x < 102 && y > 200 && y < 207;
    if (knob) return pick(ramp(["#05040f", "#1a1420", "#3a3040"]), sx, sy, 0.8 - (x - 102) / 10);
    if (lever || post || coil) return pick(BRASS, sx, sy, 0.75 - (x - 76) / 80 + (coil ? 0.15 * Math.sin(y * 3) : 0));
    if (base) return pick(DESK, sx, sy, 0.95);
    const lampBody = x > 22 && x < 38 && y > 186 && y < 214 && Math.abs(x - 30) < 3 + (y - 186) * 0.25;
    if (lampBody) return y < 200 ? pick(ramp(["#ff8a3d", "#ffd23f", "#fff2b0"]), sx, sy, 0.9 - Math.abs(x - 30) / 8) : pick(BRASS, sx, sy, 0.5);
    if (o.paper && x > 120 && x < 160 && y > 207 && y < 216) {
      const ink = Math.floor(y) % 2 === 0 && x > 123 && x < 157 && Math.sin(x * 2.3) > -0.4;
      return ink ? hex("#4a5a50") : mix(hex("#e8e0c8"), tint, 0.35 * o.paper);
    }
    return null;
  }, 0, 0, W, H);
  const a = P(84, 197), b = P(84, 110), cTop = P(160, 70);
  fineLine(buf, a.x, a.y, b.x, b.y, hex("#1a1210"), Math.max(PX, 0.8 * z));
  fineLine(buf, b.x, b.y, cTop.x, cTop.y, hex("#1a1210"), Math.max(PX, 0.8 * z));
  const sparks = o.sparks ?? 0;
  if (sparks > 0) {
    for (let k = 0; k < 4; k++) {
      if (Math.floor(t * 12 + k * 3) % 3 === 0) continue;
      const s0 = P(96 + k * 2, 200), s1 = P(96 + k * 2 + (k - 1.5) * 8, 186 - k * 4);
      drawBolt(buf, makeBolt(Math.floor(t * 15) + k * 7, s0.x, s0.y, s1.x, s1.y, 2 * z, 0), 1, hex("#3ee0ff"), hex("#ffffff"), 0.8);
    }
    const g = P(97, 202);
    glow(buf, g.x, g.y, 18 * z * sparks, hex("#9ad4ff"), 0.6);
  }
  const fire = o.fire ?? 0;
  if (fire > 0) {
    const f0 = P(68, 206), f1 = P(114, 206);
    drawFire(buf, t, f0.x, f1.x, (x) => f0.y + Math.sin(x) * 0.5, 22 * z * fire, 1);
  }
};

// Ground-level city at night under an aurora, with pylons and a transformer in front.
const TOWERS = (() => {
  const r = rng(77);
  const out: { x: number; w: number; h: number }[] = [];
  for (let x = -6; x < W + 10; ) {
    const w = 8 + r() * 14;
    out.push({ x, w, h: 24 + r() * 60 });
    x += w + 1 + r() * 3;
  }
  return out;
})();

export type CityOpts = { t: number; dark: number; aurora: number; spark?: number; candles?: number };

export const drawCityNight = (buf: Buf, o: CityOpts) => {
  const { t, dark } = o;
  const horizon = 210;
  shadeAll(buf, (x, y) => {
    if (y < horizon) {
      let c = pick(ramp(["#03040e", "#080a20", "#101436", "#1a1a44"]), x, y, y / 230);
      const a = aurora(x, y, t, 20, 170) * o.aurora;
      if (a > 0.12) c = pick(AURORA, x, y, a * 1.1);
      const tw = TOWERS.find((tw) => x >= tw.x && x < tw.x + tw.w);
      if (tw && y > horizon - tw.h) {
        c = pick(ramp(["#05060e", "#0c0e1c", "#161a2c"]), x, y, 0.4 + (x - tw.x) / tw.w * 0.4);
        const wx = Math.floor((x - tw.x) / 2.5), wy = Math.floor((y - horizon + tw.h) / 3);
        const on = Math.abs(Math.sin(wx * 9.1 + wy * 3.7 + tw.x)) > 0.45;
        const out = (tw.x + tw.w / 2) / W < dark * 1.25 - 0.1;
        if (on && (x - tw.x) % 2.5 < 1.2 && (y - horizon + tw.h) % 3 < 1.5 && x > tw.x + 1 && x < tw.x + tw.w - 1 && y > horizon - tw.h + 2)
          c = out ? ((o.candles ?? 0) > 0 && Math.sin(wx * 7.3 + wy * 3.1 + tw.x) > 0.75 && Math.sin(t * 9 + wx * 3 + wy) > -0.6 * (o.candles ?? 0) ? hex("#a0501a") : hex("#0e1020")) : hex(Math.sin(wx + wy) > 0 ? "#ffd23f" : "#ffe8a0");
      }
      return c;
    }
    return pick(ramp(["#020306", "#06080e", "#0c0e18"]), x, y, 0.7 - (y - horizon) / 160);
  });
  const steel = hex("#05060c");
  [[20, 130, 0.9], [150, 150, 0.7]].forEach(([px, top, s]) => {
    fineLine(buf, px - 10 * s, 300, px, top, steel, 1.6);
    fineLine(buf, px + 10 * s, 300, px, top, steel, 1.6);
    fineLine(buf, px - 18 * s, top + 14, px + 18 * s, top + 14, steel, 1.4);
    for (let k = 0; k < 5; k++) fineLine(buf, px - 9 * s + k * 0.4, 290 - k * 34 * s, px + 9 * s - k * 0.4, 260 - k * 34 * s, steel, 0.8);
  });
  for (let x = -2; x < W + 2; x += PX) {
    const sag = (u: number) => 6 * Math.sin(u * Math.PI);
    const u = (x - 20) / 130;
    if (u > 0 && u < 1) {
      buf.dot(x, 144 + sag(u), steel);
      buf.dot(x, 144 + sag(u) + 8, steel);
    }
  }
  shadeAll(buf, (x, y) => (x > 46 && x < 104 && y > 236 && y < 292 ? pick(ramp(["#0a0c14", "#1a1e2c", "#2a3040"]), x, y, 0.3 + (x - 46) / 90 + (Math.floor(y) % 6 === 0 ? 0.2 : 0)) : null), 46, 236, 104, 292);
  [56, 75, 94].forEach((ix) => fineLine(buf, ix, 236, ix, 222, hex("#4a5060"), 2.4));
  const spark = o.spark ?? 0;
  if (spark > 0) {
    [56, 75, 94].forEach((ix, i) => {
      if (Math.floor(t * 14 + i * 5) % 3 === 0) return;
      drawBolt(buf, makeBolt(Math.floor(t * 20) + i * 13, ix, 221, ix + (i - 1) * 12, 196 - i * 4, 4, 1), 1, hex("#3ee0ff"), hex("#ffffff"), 1);
    });
    glow(buf, 75, 224, 40 * spark, hex("#9ad4ff"), 0.7 * spark);
  }
};

// July 2012: a CME leaves the Sun and crosses Earth's orbit about a week before Earth gets there.
export const drawNearMiss = (buf: Buf, t: number, k: number) => {
  shadeAll(buf, (x, y) => pick(ramp(["#03020a", "#07051a", "#0d0a26"]), x, y, 0.4 + y / 900));
  fineStars(buf, t, 160, H, 23);
  const scx = -70, scy = 250, sr = 120;
  shadeAll(buf, (x, y) => {
    const d = Math.hypot(x - scx, y - scy);
    if (d < sr) return pick(SUN, x, y, 0.35 + 0.55 * Math.sqrt(1 - (d / sr) ** 2) + cells(x / 6, y / 6, t) * 0.4);
    if (d < sr + 22 && cover(x, y, (1 - (d - sr) / 22) ** 2)) return CORONA;
    return null;
  }, 0, scy - sr - 24, sr + scx + 24, scy + sr + 24);
  const orbit = (a: number) => ({ x: scx + Math.cos(a) * 230, y: scy + Math.sin(a) * 200 });
  for (let a = -1.55; a < 0.2; a += 0.004) {
    if (Math.floor(a * 160) % 3 !== 0) continue;
    const p = orbit(a);
    buf.dot(p.x, p.y, hex("#5a6aa8"));
  }
  const cross = -0.62;
  const ea = lerp(-1.4, cross - 0.12, k);
  const e = orbit(ea);
  glow(buf, e.x, e.y, 8, hex("#3ee0ff"), 0.6);
  shadeAll(buf, (x, y) => (Math.hypot(x - e.x, y - e.y) < 3.2 ? pick(ramp(["#1a3a8a", "#3a7ad8", "#7fd0a0"]), x, y, 0.8 - (x - e.x + y - e.y) / 7) : null), e.x - 5, e.y - 5, e.x + 5, e.y + 5);
  const target = orbit(cross);
  const dirx = target.x - scx, diry = target.y - scy, len = Math.hypot(dirx, diry);
  const travel = lerp(sr + 10, len + 140, smoothstep(0, 1, k));
  const ccx = scx + (dirx / len) * travel, ccy = scy + (diry / len) * travel, rad = 14 + travel * 0.22;
  const r = rng(9);
  for (let i = 0; i < 1100; i++) {
    const a = Math.atan2(diry, dirx) + (r() - 0.5) * 2.4, rr = rad * (0.7 + 0.3 * r());
    buf.dot(ccx + Math.cos(a) * rr - (dirx / len) * rad * 0.6, ccy + Math.sin(a) * rr - (diry / len) * rad * 0.6, r() > 0.5 ? hex("#ffb347") : hex("#ff6a3a"));
  }
};

// A city seen from a plane at night: a perspective street grid whose lights go out.
export const drawCityGrid = (buf: Buf, t: number, dark: number, auroraK: number) => {
  const horizon = 96;
  shadeAll(buf, (x, y) => {
    if (y < horizon) {
      let c = pick(ramp(["#03040e", "#080a20", "#101436"]), x, y, y / 110);
      const a = aurora(x, y, t, 0, horizon + 20) * auroraK;
      if (a > 0.12) c = pick(AURORA, x, y, a);
      return c;
    }
    const z = 70 / (y - horizon + 2);
    const wx = (x - W / 2) * z * 0.09 + Math.sin(t * 0.05) * 0.5, wz = z * 1.4 + t * 0.35;
    const fx = wx - Math.floor(wx), fz = wz - Math.floor(wz);
    const street = fx < 0.07 || fz < 0.09;
    const blockId = Math.floor(wx) * 17 + Math.floor(wz) * 31;
    const out = noise3(Math.floor(wx) * 0.4, Math.floor(wz) * 0.4, 7) < dark * 1.05 - 0.15;
    const fog = Math.min(1, z / 18);
    const lane = fx < 0.07 ? wz : wx;
    const car = (fx < 0.07 || fz < 0.09) && ((lane * 3 + t * (fx < 0.07 ? 0.9 : -0.7) + Math.floor(fx < 0.07 ? wx : wz) * 0.37) % 1 + 1) % 1 < 0.04;
    if (car && fog < 0.75) return out ? hex("#ffffff") : hex("#ff5a5a");
    if (fog > 0.8) return out ? hex("#04050a") : pick(ramp(["#0a0a18", "#3a2a30", "#8a5a3a"]), x, y, 0.45 + 0.3 * noise3(x * 0.3, y, 1));
    if (street) {
      const lamp = ((fx < 0.07 ? wz : wx) * 4) % 1 < 0.12;
      if (out) return pick(ramp(["#05060c", "#0e1222"]), x, y, 0.5 - fog * 0.4);
      return lamp ? hex("#ffc46b") : pick(ramp(["#0e0a0c", "#2a1c14", "#4a3018"]), x, y, 0.5 - fog * 0.3);
    }
    if (out) return pick(ramp(["#020306", "#070912", "#10142a"]), x, y, 0.5 - fog * 0.4 + (fx + fz) * 0.15);
    const win = Math.sin(blockId * 1.7 + Math.floor(fx * 9) * 3.1 + Math.floor(fz * 9) * 1.7) > 0.82 && (fx * 9) % 1 < 0.5 && (fz * 9) % 1 < 0.5;
    return win ? hex("#ffe08a") : pick(ramp(["#05060e", "#0a0c18", "#12142a"]), x, y, 0.55 - fog * 0.5 + (fx + fz) * 0.1);
  });
};
