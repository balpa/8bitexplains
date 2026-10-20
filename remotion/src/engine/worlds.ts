import { LAND_B64, LAND_H, LAND_W } from "./landmask";
import { Buf, H, PX, RGB, W, clamp01, dither, fbm, hex, lerp, noise3, ramp, rng, smoothstep } from "./pixel";
import { R } from "./palette";

const STAR_LAYERS = [0.15, 0.4, 1].map((depth, layer) => {
  const r = rng(101 + layer * 17);
  return Array.from({ length: [70, 40, 18][layer] }, () => ({ x: r() * W, y: r() * H, depth, tw: r() * 6.28 }));
});

// Starfield with three parallax layers and a faint dithered nebula; `zoom` pushes stars outwards.
export const drawSpace = (buf: Buf, t: number, zoom = 0, panY = 0) => {
  for (let y = 0; y < H; y += PX)
    for (let x = 0; x < W; x += PX) {
      const n = fbm(x / 60 + 3, (y + panY * 0.2) / 60, t * 0.02);
      const v = clamp01((y / H) * 0.5 + smoothstep(0.45, 0.8, n) * 0.6);
      buf.dot(x, y, R.space[dither(x, y, v, R.space.length)]);
    }
  const dim = hex("#6c6aa8"), mid = hex("#b7b5e6"), bright = hex("#ffffff");
  STAR_LAYERS.forEach((layer) =>
    layer.forEach((s) => {
      const k = 1 + zoom * s.depth * 1.6;
      const x = W / 2 + (s.x - W / 2) * k;
      const y = H / 2 + (s.y - H / 2 + panY * s.depth) * k;
      const twinkle = Math.sin(t * 3 + s.tw) > 0.6;
      buf.put(x, y, s.depth === 1 ? (twinkle ? bright : mid) : s.depth > 0.3 ? mid : dim);
      if (s.depth === 1 && zoom > 0.3) buf.put(x, y + 1, mid);
    }),
  );
};

export type PlanetOpts = {
  cx: number;
  cy: number;
  r: number;
  lon0: number;
  lat0?: number;
  heat: number;
  t: number;
  jetLat?: number;
  night?: number;
};

const LIGHT = (() => {
  const l = [-0.55, -0.45, 0.7];
  const n = Math.hypot(...l);
  return l.map((v) => v / n);
})();

const LAND = (() => {
  const bytes = Uint8Array.from(atob(LAND_B64), (ch) => ch.charCodeAt(0));
  const bits = new Uint8Array(LAND_W * LAND_H);
  for (let i = 0; i < bits.length; i++) bits[i] = (bytes[i >> 3] >> (7 - (i & 7))) & 1;
  return bits;
})();

const DEG = Math.PI / 180;
const wrap180 = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180;

export const isLand = (latDeg: number, lonDeg: number) => {
  const i = Math.floor(wrap180(lonDeg) + 180) % LAND_W;
  const j = Math.min(LAND_H - 1, Math.max(0, Math.floor(90 - latDeg)));
  return LAND[j * LAND_W + i] === 1;
};

// Orthographic projection of a geographic point onto the globe's screen disc.
export const project = (o: PlanetOpts, latDeg: number, lonDeg: number) => {
  const p0 = (o.lat0 ?? 0) * DEG, phi = latDeg * DEG, dl = (lonDeg - o.lon0) * DEG;
  const X = Math.cos(phi) * Math.sin(dl);
  const Y = Math.cos(p0) * Math.sin(phi) - Math.sin(p0) * Math.cos(phi) * Math.cos(dl);
  const visible = Math.sin(p0) * Math.sin(phi) + Math.cos(p0) * Math.cos(phi) * Math.cos(dl) > 0;
  return { x: o.cx + X * o.r, y: o.cy - Y * o.r, visible };
};

// Nino 3.4 region (5N-5S, 170W-120W) glows; it spreads towards the Americas as heat rises.
const warmth = (lat: number, lon: number, heat: number) => {
  const centre = -150 + heat * 25;
  return Math.exp(-((lat / 9) ** 2)) * Math.exp(-((wrap180(lon - centre) / (28 + heat * 18)) ** 2)) * heat;
};

const AIRGLOW = ramp(["#1f7a4a", "#7dff9a"]);
const ICE = ramp(["#5d7fb0", "#a9c4e8", "#e6f0ff", "#ffffff"]);
const DESERT = ramp(["#5a3a1e", "#9a6a34", "#d6a45a", "#f2d49a"]);

// Shaded pixel Earth (Natural Earth land mask) with rim light, halo, clouds and a glowing warm Pacific.
export const drawPlanet = (buf: Buf, o: PlanetOpts) => {
  const { cx, cy, r, heat, t } = o;
  const p0 = (o.lat0 ?? 0) * DEG;
  const pulse = 0.85 + 0.15 * Math.sin(t * 4);
  const halo = (o.night ?? 0) > 0.5 ? AIRGLOW : R.halo;
  const x0 = Math.max(0, Math.floor(cx - r - 8)), x1 = Math.min(W, Math.ceil(cx + r + 8));
  const y0 = Math.max(0, Math.floor(cy - r - 8)), y1 = Math.min(H, Math.ceil(cy + r + 8));
  for (let y = y0; y < y1; y += PX)
    for (let x = x0; x < x1; x += PX) {
      const nx = (x - cx + PX / 2) / r, ny = (y - cy + PX / 2) / r, d = nx * nx + ny * ny;
      if (d > 1) {
        const e = Math.sqrt(d) - 1;
        if (e < 1.5 / r) buf.dot(x, y, halo[1]);
        else if (e < 6 / r && dither(x, y, 0.55 - ((e * r - 1.5) / 4.5) * 0.55, 2)) buf.dot(x, y, halo[0]);
        continue;
      }
      const nz = Math.sqrt(1 - d);
      const X = nx, Y = -ny, rho = Math.sqrt(d), c = Math.asin(Math.min(1, rho));
      const lat = rho < 1e-9 ? p0 : Math.asin(Math.cos(c) * Math.sin(p0) + (Y * Math.sin(c) * Math.cos(p0)) / rho);
      const lon = o.lon0 * DEG + Math.atan2(X * Math.sin(c), rho * Math.cos(c) * Math.cos(p0) - Y * Math.sin(c) * Math.sin(p0));
      const latD = lat / DEG, lonD = lon / DEG;
      const px = Math.cos(lat) * Math.cos(lon), py = Math.sin(lat), pz = Math.cos(lat) * Math.sin(lon);
      const diff = Math.max(0, nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]);
      const shade = (0.12 + 0.88 * diff) * (1 - 0.72 * (o.night ?? 0));
      const tex = fbm(px * 4 + 5, py * 4, pz * 4);
      let pal = R.ocean;
      let v = shade;
      const land = isLand(latD, lonD);
      if ((land && Math.abs(latD) > 62 + tex * 8) || Math.abs(latD) > 80 + tex * 4) pal = ICE;
      else if (land) pal = Math.abs(latD) > 14 && Math.abs(latD) < 34 && tex > 0.45 ? DESERT : R.land;
      else {
        const w = warmth(latD, lonD, heat);
        if (w > 0.22) {
          pal = R.warm;
          v = Math.min(1, shade * (0.55 + w * 0.7 * pulse));
        } else v = shade * (0.9 + tex * 0.2);
      }
      const rim = Math.pow(1 - nz, 3) * Math.max(0, -nx * 0.6 + ny * 0.2 + 0.5);
      let col: RGB = pal[dither(x, y, Math.min(1, v + rim * 0.9), pal.length)];
      const cloud = smoothstep(0.7, 0.78, noise3(px * 3 + t * 0.15, py * 6, pz * 3 + 9));
      if (cloud > 0.5 && shade > 0.3) col = hex(shade > 0.7 ? "#ffffff" : "#c9d4f0");
      const night = o.night ?? 0;
      if (night > 0) {
        const k = 1 - 0.78 * night;
        col = [col[0] * k + 4 * night, col[1] * k + 6 * night, col[2] * k + 22 * night];
        const city = land && Math.abs(latD) < 60 && fbm(px * 40, py * 40, pz * 40) > 0.7 && dither(x, y, 0.5, 2) > 0;
        if (city && night > 0.5) col = hex(dither(x, y, 0.6, 2) ? "#ffd23f" : "#ff8a3d");
      }
      buf.dot(x, y, col);
    }
  if (o.jetLat !== undefined) {
    const white = hex("#f4f1e8"), cyan = hex("#3ee0ff");
    for (let k = 0; k < 720; k++) {
      const lon = -180 + k / 2;
      const p = project(o, o.jetLat + 5 * Math.sin(lon * 4 * DEG + t * 2.5), lon);
      if (!p.visible) continue;
      buf.put(p.x, p.y, (k + Math.floor(t * 30)) % 12 < 8 ? white : cyan);
      buf.put(p.x, p.y + 1, cyan);
    }
  }
};

export type OceanOpts = {
  t: number;
  horizon: number;
  speed: number;
  heat: number;
  wind: number;
  dusk?: number;
  altitude?: number;
};

// SNES Mode-7 style ocean plane: west (left) is warm, the warm front moves east as `heat` rises.
export const drawOcean = (buf: Buf, o: OceanOpts) => {
  const { t, horizon, speed, heat, wind } = o;
  const dusk = o.dusk ?? 0;
  const alt = o.altitude ?? 1;
  const sky = dusk > 0.5 ? R.duskSky : R.daySky;
  buf.gradient(sky, 0, horizon);
  const sun = R.sun;
  const sunX = lerp(142, W / 2, dusk);
  const sunY = lerp(horizon - 26, horizon - 6, dusk), sunR = lerp(9, 24, dusk);
  for (let y = Math.max(0, Math.floor(sunY - sunR)); y < Math.min(horizon, sunY + sunR); y += PX)
    for (let x = Math.floor(sunX - sunR); x < sunX + sunR; x += PX) {
      const d = Math.hypot(x - sunX, y - sunY);
      const stripe = dusk > 0.5 && y > sunY && Math.floor(y - sunY) % 5 < 2;
      if (d < sunR && !stripe) buf.dot(x, y, sun[dither(x, y, 1 - d / sunR, 2)]);
    }
  const cloud = dusk > 0.5 ? [hex("#7a3a7f"), hex("#e08a8f")] : [hex("#b8c8f0"), hex("#ffffff")];
  [[0.1, 0.55, 46], [0.55, 0.35, 56], [0.85, 0.7, 36]].forEach(([fx, fy, cw], i) => {
    const cx = ((fx * W - t * (4 + i * 3)) % (W + cw) + W + cw) % (W + cw) - cw;
    const cy = horizon * (0.5 + fy * 0.35);
    for (let y = 0; y < 9; y++)
      for (let x = 0; x < cw; x++) {
        const e = Math.abs(x - cw / 2) / (cw / 2) + Math.abs(y - 4.5) / 5.5;
        if (e < 1) buf.put(cx + x, cy + y, cloud[dither(Math.floor(cx + x), Math.floor(cy + y), 1 - y / 9, 2)]);
      }
  });
  const front = lerp(-0.9, 1.6, heat);
  const travel = t * speed;
  const white = hex("#f4f1e8");
  for (let y = Math.max(0, Math.floor(horizon)); y < H; y += PX) {
    const z = (55 * alt) / (y - horizon + 1.5);
    const fog = Math.min(1, z / 45);
    for (let x = 0; x < W; x += PX) {
      const wx = (x - W / 2) * z * 0.045;
      const wz = z + travel;
      const n = noise3(wx * 0.9, wz * 0.9, t * 0.25) * 0.65 + noise3(wx * 2.4, wz * 2.4, t * 0.45) * 0.35;
      const swell = 0.5 + 0.5 * Math.sin(wz * 2.2 + wx * 0.6 - t * 1.4);
      const wave = 0.15 + n * 0.75 + swell * 0.2;
      // Most visible rows are close to the camera (small z), so the front must wiggle at short wz scales.
      const edge = (noise3(wz * 0.9, 3.1, t * 0.1) - 0.5) * 1.6 + (noise3(wz * 2.6, 7.7, t * 0.3) - 0.5) * 0.6;
      const temp = 1 - smoothstep(front - 0.3, front + 0.3, wx + edge);
      const pal = temp > 0.5 ? R.hot : R.cold;
      const v = clamp01(wave * (1 - fog * 0.65) + (1 - fog) * 0.08);
      let c = pal[dither(x, y, v, pal.length)];
      if (wind > 0.05 && fog < 0.75) {
        const cap = noise3((wx + t * 1.6 * wind) * 3, wz * 6, 1.3);
        if (cap > 0.8 - 0.06 * wind && n > 0.5) c = white;
      }
      buf.dot(x, y, c);
    }
  }
  const glow = hex(dusk > 0.5 ? "#ffc46b" : "#d4ecff");
  for (let x = 0; x < W; x++) if (dither(x, Math.floor(horizon), 0.5, 2)) buf.put(x, horizon, glow);
};

export type UnderwaterOpts = {
  t: number;
  warmWest: number;
  warmEast: number;
  upwell: number;
  surface?: number;
};

// Layered underwater cross-section: warm surface layer, light rays, fish, bokeh, rock silhouettes.
export const drawUnderwater = (buf: Buf, o: UnderwaterOpts) => {
  const { t, warmWest, warmEast, upwell } = o;
  const S = o.surface ?? 96;
  buf.gradient(R.daySky, 0, S);
  const far = [hex("#5d78c8"), hex("#7f9ae0")];
  for (let x = 0; x < W; x += PX) {
    const hgt = 9 + 6 * Math.sin(x / 13 + 1) + 4 * Math.sin(x / 5.3);
    for (let y = Math.floor(S - hgt); y < S; y += PX) buf.dot(x, y, far[dither(x, y, (y - (S - hgt)) / hgt, 2)]);
  }
  for (let y = S; y < H; y += PX)
    for (let x = 0; x < W; x += PX) {
      const depth = y - S;
      const warmDepth = lerp(warmWest, warmEast, x / W) + 1.5 * Math.sin(x / 7 + t * 2);
      const ray = Math.max(0, Math.sin((x + y * 0.55 - t * 6) / 9)) ** 6 * Math.max(0, 1 - depth / 170);
      if (depth < warmDepth) buf.dot(x, y, R.warm[dither(x, y, 0.95 - (depth / Math.max(1, warmDepth)) * 0.7, R.warm.length)]);
      else buf.dot(x, y, R.deep[dither(x, y, clamp01((1 - depth / 210) * 0.75 + ray * 0.6), R.deep.length)]);
    }
  const foam = hex("#ffe2b8");
  for (let x = 0; x < W; x++) buf.put(x, S + Math.round(Math.sin(x / 4 + t * 3) * 1.2) - 1, foam);
  if (upwell > 0.02) {
    const cy = hex("#3ee0ff"), pale = hex("#9ad4ff");
    for (let i = 0; i < 14; i++) {
      const x = W - 46 + ((i * 37) % 34);
      const y = H - 40 - ((t * 26 + i * 23) % (H - S - 50));
      if (i / 14 > upwell) continue;
      buf.put(x, y, cy);
      buf.put(x - 1, y + 1, pale);
      buf.put(x + 1, y + 1, pale);
      buf.put(x, y + 2, pale);
    }
  }
  const fish = hex("#4fe0ff"), eye = hex("#05040f");
  for (let i = 0; i < 7; i++) {
    const fx = ((i * 41 + t * (10 + i * 2)) % (W + 20)) - 10;
    const fy = S + 70 + ((i * 29) % 90) + Math.sin(t * 2 + i) * 3;
    for (let k = 0; k < 5; k++) buf.put(fx - k, fy, fish);
    buf.put(fx - 1, fy - 1, fish);
    buf.put(fx - 1, fy + 1, fish);
    buf.put(fx - 5, fy - 1, fish);
    buf.put(fx - 5, fy + 1, fish);
    buf.put(fx - 1, fy, eye);
  }
  const rock = hex("#04030c"), rock2 = hex("#0a0820");
  for (let x = 0; x < W; x += PX) {
    const left = Math.max(0, 80 - x * 1.6) + 6 * Math.sin(x / 3);
    const right = Math.max(0, (x - 118) * 1.5) + 5 * Math.sin(x / 2.5);
    const hgt = Math.max(left, right);
    for (let y = Math.floor(H - hgt); y < H; y += PX) buf.dot(x, y, y < H - hgt + 2 ? rock2 : rock);
  }
  for (let k = 0; k < 4; k++) {
    const kx = [20, 34, 150, 164][k];
    for (let y = 0; y < 50; y++) {
      const x = kx + Math.sin(y / 6 + t * 1.6 + k) * 3;
      buf.put(x, H - 30 - y, rock2);
    }
  }
  const bok = [hex("#3ee0ff"), hex("#ffffff")];
  [[18, S + 60, 5, 0], [158, S + 40, 4, 1], [146, H - 70, 6, 2], [30, H - 60, 3, 3]].forEach(([bx, by, br, i]) => {
    const yy = by + Math.sin(t * 1.3 + i) * 4;
    for (let y = -br; y <= br; y++)
      for (let x = -br; x <= br; x++) {
        const d = Math.hypot(x, y) / br;
        if (d < 1 && dither(Math.floor(bx + x), Math.floor(yy + y), 0.5 - d * 0.4, 2)) buf.put(bx + x, yy + y, bok[d < 0.4 ? 1 : 0]);
      }
  });
};
