import { Buf, H, RGB, W, clamp01, dither, fbm, hex, lerp, ramp, sprite } from "./pixel";
import { P } from "./palette";

const MOON = ramp(["#2a2838", "#55526a", "#8f8ca4", "#c9c6d8", "#f0eef8"]);
const LIGHT = (() => {
  const l = [-0.6, -0.35, 0.7];
  const n = Math.hypot(...l);
  return l.map((v) => v / n);
})();

// Shaded, cratered pixel Moon.
export const drawMoon = (buf: Buf, cx: number, cy: number, r: number, rot: number) => {
  for (let y = Math.max(0, Math.floor(cy - r - 2)); y < Math.min(H, cy + r + 2); y++)
    for (let x = Math.max(0, Math.floor(cx - r - 2)); x < Math.min(W, cx + r + 2); x++) {
      const nx = (x - cx + 0.5) / r, ny = (y - cy + 0.5) / r, d = nx * nx + ny * ny;
      if (d > 1) continue;
      const nz = Math.sqrt(1 - d);
      const lon = Math.atan2(nx, nz) + rot, lat = Math.asin(ny);
      const px = Math.cos(lat) * Math.cos(lon), py = Math.sin(lat), pz = Math.cos(lat) * Math.sin(lon);
      const crater = fbm(px * 6 + 2, py * 6, pz * 6);
      const mare = fbm(px * 1.6 + 9, py * 1.6, pz * 1.6) > 0.55 ? -0.18 : 0;
      const diff = Math.max(0, nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]);
      const rim = crater > 0.62 ? 0.15 : crater < 0.38 ? -0.15 : 0;
      buf.put(x, y, MOON[dither(x, y, clamp01(0.08 + 0.9 * diff + rim + mare), MOON.length)]);
    }
};

const ORION = [
  "....ww....",
  "...wwww...",
  "..wwkkww..",
  "..wwwwww..",
  ".wwwwwwww.",
  ".gggggggg.",
  "gg.gg.gg.g",
  "gggggggggg",
  "...bbbb...",
];

// Orion capsule with its service module; `flame` in [0, 1] shows the engine burn.
export const drawOrion = (buf: Buf, x: number, y: number, frame: number, flame = 0, scale = 2) => {
  sprite(buf, ORION, { w: P.white, k: P.cyan, g: "#9aa6d8", b: "#5d6aa8" }, Math.round(x), Math.round(y), false, scale);
  if (flame <= 0) return;
  const fire = ramp(["#ff5a3d", "#ffb347", "#fff2b0"]);
  const len = Math.round(lerp(4, 18, flame) * (0.85 + 0.15 * Math.sin(frame)));
  for (let j = 0; j < len; j++)
    for (let i = -3; i <= 3; i++) {
      if (Math.abs(i) > 3 - (j / len) * 3) continue;
      const px = x + 5 * scale + i, py = y + 9 * scale + j;
      buf.put(px, py, fire[dither(Math.floor(px), Math.floor(py), 1 - j / len, fire.length)]);
    }
};

export const line = (buf: Buf, x0: number, y0: number, x1: number, y1: number, c: RGB) => {
  const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)));
  for (let i = 0; i <= n; i++) buf.put(lerp(x0, x1, i / Math.max(1, n)), lerp(y0, y1, i / Math.max(1, n)), c);
};

export type Well = { x: number; z: number; depth: number; width: number };

// "Rubber sheet" picture of gravity: a perspective grid sagging into wells, with an optional marble.
export const drawWellGrid = (buf: Buf, t: number, wells: Well[], marble?: { x: number; z: number }) => {
  buf.gradient(ramp(["#05061a", "#0b0d2e", "#1a1248"]), 0, H);
  const height = (x: number, z: number) => wells.reduce((h, w) => h - w.depth / (1 + ((x - w.x) ** 2 + (z - w.z) ** 2) / w.width ** 2), 0);
  const project = (x: number, z: number) => {
    const d = z + 1.4;
    return { x: W / 2 + (x * 140) / d, y: 40 + ((1.3 - height(x, z)) * 190) / d };
  };
  const grid = [hex("#2c2a6e"), hex("#4f4ab0"), hex("#7d7ae0")];
  const shade = (z: number) => grid[z < 1.2 ? 2 : z < 2.4 ? 1 : 0];
  for (let i = -12; i <= 12; i++) {
    const x = i * 0.18;
    let prev = project(x, 0);
    for (let k = 1; k <= 60; k++) {
      const z = k * 0.06;
      const p = project(x, z);
      line(buf, prev.x, prev.y, p.x, p.y, shade(z));
      prev = p;
    }
  }
  for (let k = 0; k <= 20; k++) {
    const z = k * 0.18;
    let prev = project(-2.2, z);
    for (let i = 1; i <= 60; i++) {
      const p = project(-2.2 + i * (4.4 / 60), z);
      line(buf, prev.x, prev.y, p.x, p.y, shade(z));
      prev = p;
    }
  }
  if (marble) {
    const p = project(marble.x, marble.z);
    const ball = ramp(["#9a2238", "#ff5a3d", "#ffd23f"]);
    for (let y = -3; y <= 3; y++)
      for (let x = -3; x <= 3; x++)
        if (x * x + y * y <= 9) buf.put(p.x + x, p.y - 3 + y, ball[dither(Math.floor(p.x + x), Math.floor(p.y + y), clamp01(0.8 - (x + y) / 8), ball.length)]);
  }
  void t;
  return project;
};

// Free-return path around the Moon, drawn up to `progress` in [0, 1]; returns the head position.
export const FREE_RETURN: [number, number][] = [
  [72, 242], [98, 200], [126, 158], [150, 124], [152, 98], [132, 86], [112, 100], [112, 136], [92, 186], [64, 228], [54, 246],
];

export const pathPoint = (pts: [number, number][], s: number) => {
  const f = clamp01(s) * (pts.length - 1);
  const i = Math.min(pts.length - 2, Math.floor(f));
  const u = f - i;
  const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
  const cr = (a: number, b: number, c: number, d: number) =>
    0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
  return [cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])] as [number, number];
};

export const drawPath = (buf: Buf, pts: [number, number][], progress: number, frame: number) => {
  const dot = hex(P.yellow), dim = hex("#8f8cc9");
  for (let k = 0; k <= 360; k++) {
    const s = k / 360;
    const [x, y] = pathPoint(pts, s);
    if (s <= progress) {
      if ((k + Math.floor(frame / 2)) % 5 < 3) {
        buf.put(x, y, dot);
        buf.put(x + 1, y, dot);
        buf.put(x, y + 1, dot);
      }
    } else if (k % 8 === 0) buf.put(x, y, dim);
  }
};
