import { Buf, H, K, PX, W, clamp01, dither, hex, lerp, noise3, ramp, smoothstep } from "./pixel";
import { P, R } from "./palette";
import { PlanetOpts, project } from "./worlds";

const DEG = Math.PI / 180;

export type StormOpts = {
  lat: number;
  lon: number;
  radiusDeg: number;
  strength: number;
  eye: number;
  t: number;
};

// Spiral cloud bands of a tropical cyclone drawn on the globe; northern-hemisphere storms turn
// counter-clockwise when seen from above.
export const drawStorm = (buf: Buf, globe: PlanetOpts, s: StormOpts) => {
  const night = (globe.night ?? 0) > 0.5;
  const shades = night ? [hex("#5d6aa8"), hex("#8f9ad0"), hex("#c9d0f0")] : [hex("#9aa6d8"), hex("#dfe6ff"), hex("#ffffff")];
  for (let rr = 0.15; rr < s.radiusDeg; rr += 0.08 * PX) {
    const steps = Math.max(32, Math.round(rr * 60)) * K;
    for (let k = 0; k < steps; k++) {
      const theta = (k / steps) * Math.PI * 2;
      const u = rr / s.radiusDeg;
      const phase = theta - s.t * 1.6 + Math.log(rr + 0.3) * 3.2;
      const band = 0.5 + 0.5 * Math.sin(phase * 2);
      const core = smoothstep(s.eye, s.eye + 0.1, u) * (1 - smoothstep(0.7, 1, u));
      const density = s.strength * (band * (0.45 + 0.55 * core) + core * 0.45);
      if (density < 0.42 + noise3(theta * 2, rr * 0.5, s.t * 0.3) * 0.18) continue;
      const lat = s.lat + rr * Math.sin(theta);
      const lon = s.lon + (rr * Math.cos(theta)) / Math.cos(lat * DEG);
      const p = project(globe, lat, lon);
      if (!p.visible) continue;
      buf.dot(p.x, p.y, shades[density > 0.85 ? 2 : density > 0.62 ? 1 : 0]);
    }
  }
};

// Concentric gravity-wave ripples glowing in the airglow layer, spreading out from a point.
export const drawAirglowRipples = (buf: Buf, x: number, y: number, t: number, maxR = 110) => {
  const glow = [hex("#1f7a4a"), hex("#4fd17a"), hex("#a8ffbe")];
  for (let k = 0; k < 5; k++) {
    const r = (t * 24 + k * (maxR / 5)) % maxR;
    const fade = 1 - r / maxR;
    for (let a = Math.PI * 1.02; a < Math.PI * 1.98; a += 0.5 / Math.max(8, r)) {
      for (let w = 0; w < 2; w++) {
        const px = x + Math.cos(a) * (r + w), py = y + Math.sin(a) * (r + w) * 0.6;
        if (dither(Math.floor(px), Math.floor(py), fade, 3) > 0) buf.put(px, py, glow[fade > 0.7 ? 2 : fade > 0.4 ? 1 : 0]);
      }
    }
  }
};

const BRICK = ramp(["#5a2433", "#8f3a3f", "#b85a4a"]);

// Literal chimney metaphor: a fire pulls air in at the bottom and smoke rises out of the top.
export const drawChimney = (buf: Buf, t: number, frame: number, pull: number) => {
  buf.gradient(R.duskSky, 0, H);
  const left = 66, right = 114, top = 96, base = 276;
  const ground = ramp(["#1a0c1e", "#2a1430", "#3a1c40"]);
  for (let y = base; y < H; y += PX)
    for (let x = 0; x < W; x += PX) buf.dot(x, y, ground[dither(x, y, 1 - (y - base) / (H - base), ground.length)]);
  for (let y = top; y < base; y += PX)
    for (let x = left; x < right; x += PX) {
      const row = Math.floor((y - top) / 6);
      const seam = Math.floor(y - top) % 6 === 0 || Math.floor(x - left + (row % 2) * 6) % 12 === 0;
      buf.dot(x, y, seam ? hex("#2a1020") : BRICK[dither(x, y, 0.4 + 0.5 * (1 - (x - left) / (right - left)), BRICK.length)]);
    }
  buf.rect(left - 6, top - 6, right - left + 12, 8, hex("#3a1428"));
  const mouthL = 74, mouthR = 106, mouthTop = 238;
  buf.rect(mouthL, mouthTop, mouthR - mouthL, base - mouthTop, hex("#0a0410"));
  const fire = ramp(["#9a2238", "#ff5a3d", "#ffb347", "#ffe8a0"]);
  for (let y = mouthTop + 8; y < base; y += PX)
    for (let x = mouthL + 3; x < mouthR - 3; x += PX) {
      const f = (noise3(x * 0.25, y * 0.25 + t * 4, t) * (y - mouthTop)) / (base - mouthTop);
      if (f > 0.26) buf.dot(x, y, fire[dither(x, y, clamp01((f - 0.26) * 2.2), fire.length)]);
    }
  const smoke = [hex("#9a8fb8"), hex("#d8d0ee")];
  for (let i = 0; i < 9; i++) {
    const age = (t * 0.6 + i / 9) % 1;
    const cx = 90 + Math.sin(age * 6 + i) * 12 * age;
    const cy = top - 10 - age * 40;
    const r = 3 + age * 8;
    for (let y = -r; y <= r; y++)
      for (let x = -r; x <= r; x++)
        if (x * x + y * y < r * r && dither(Math.floor(cx + x), Math.floor(cy + y), 1 - age, 2)) buf.put(cx + x, cy + y, smoke[(x + y) & 1 ? 0 : 1]);
  }
  drawInflow(buf, t, 262, mouthL, mouthR, pull);
};

// Arrows flowing towards a centre line from both sides at height y.
export const drawInflow = (buf: Buf, t: number, y: number, xl: number, xr: number, strength: number) => {
  const white = hex(P.white);
  const n = Math.round(strength * 4);
  for (let i = 0; i < n; i++) {
    const k = (t * 0.8 + i / Math.max(1, n)) % 1;
    const lx = lerp(4, xl - 10, k), rx = lerp(W - 4, xr + 10, k), yy = y + (i % 2) * 8;
    for (let j = 0; j < 6; j++) {
      buf.put(lx + j, yy, white);
      buf.put(rx - j, yy, white);
    }
    buf.put(lx + 5, yy - 1, white);
    buf.put(lx + 5, yy + 1, white);
    buf.put(rx - 5, yy - 1, white);
    buf.put(rx - 5, yy + 1, white);
  }
};

const CLOUD = ramp(["#5d6aa8", "#9aa6d8", "#d8def5", "#ffffff"]);

// One dithered cumulus puff, lit from the upper left.
const puff = (buf: Buf, cx: number, cy: number, r: number) => {
  for (let y = -r; y <= r; y += PX)
    for (let x = -r; x <= r; x += PX) {
      const d = (x * x + y * y) / (r * r);
      if (d > 1) continue;
      const light = clamp01(0.85 - (x + y) / (2.4 * r) - d * 0.35);
      buf.dot(cx + x, cy + y, CLOUD[dither(cx + x, cy + y, light, CLOUD.length)]);
    }
};

// Cross-section of a hurricane: warm sea, inflow at the surface, rising air, towering cloud wall.
export const drawUpdraft = (buf: Buf, t: number, build: number) => {
  buf.gradient(ramp(["#0b1033", "#1a2a6e", "#2f4fa8"]), 0, 250);
  for (let y = 250; y < H; y += PX)
    for (let x = 0; x < W; x += PX)
      buf.dot(x, y, R.hot[dither(x, y, clamp01(0.9 - (y - 250) / 90 + noise3(x * 0.1, y * 0.1, t) * 0.2), R.hot.length)]);
  const levels = Math.round(lerp(1, 9, build));
  for (let i = 0; i < levels; i++) {
    const y = 232 - i * 18;
    const spread = i > 6 ? 76 : 34 + i * 3;
    for (let k = -3; k <= 3; k++) {
      if (Math.abs(k) < 1 && i < 7) continue;
      const r = 10 + ((i * 3 + k * 5) % 4) + (i > 6 ? 3 : 0);
      puff(buf, 90 + k * (spread / 3) + Math.sin(t + i + k) * 2, y - Math.abs(k) * 2, r);
    }
  }
  const warm = hex(P.orange), pale = hex("#ffe2b8");
  for (let i = 0; i < 12; i++) {
    const x = 90 + ((i % 3) - 1) * 6;
    const y = 244 - ((t * 60 + i * 23) % 150);
    buf.put(x, y, pale);
    buf.put(x, y + 1, warm);
    buf.put(x - 1, y + 1, warm);
    buf.put(x + 1, y + 1, warm);
    buf.put(x, y + 2, warm);
  }
  drawInflow(buf, t, 240, 70, 110, 1);
  const rain = hex(P.cyan);
  for (let i = 0; i < 26; i++) {
    const x = (i * 37) % W;
    if (Math.abs(x - 90) < 56) continue;
    const y = 170 + ((t * 90 + i * 31) % 70);
    buf.put(x, y, rain);
    buf.put(x, y + 2, rain);
  }
};
