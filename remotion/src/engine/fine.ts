import { Buf, H, PX, RGB, W, clamp01, dither, hex, lerp, noise3, rng } from "./pixel";

// Helpers for fine-detail (L14) worlds: everything here steps by PX and draws with `dot`.

export type Camera = { x: number; y: number; zoom: number };

// Screen point to world point for a camera centred on (x, y).
export const toWorld = (cam: Camera, sx: number, sy: number) => ({ x: cam.x + (sx - W / 2) / cam.zoom, y: cam.y + (sy - H / 2) / cam.zoom });
export const toScreen = (cam: Camera, wx: number, wy: number) => ({ x: W / 2 + (wx - cam.x) * cam.zoom, y: H / 2 + (wy - cam.y) * cam.zoom });

// Calls `shade` for every physical pixel; `shade` returns a colour or null to leave the pixel.
export const shadeAll = (buf: Buf, shade: (x: number, y: number) => RGB | null, x0 = 0, y0 = 0, x1 = W, y1 = H) => {
  for (let y = Math.max(0, Math.floor(y0)); y < Math.min(H, y1); y += PX)
    for (let x = Math.max(0, Math.floor(x0)); x < Math.min(W, x1); x += PX) {
      const c = shade(x, y);
      if (c) buf.dot(x, y, c);
    }
};

// Picks a ramp step for v in [0, 1], ordered-dithered.
export const pick = (pal: RGB[], x: number, y: number, v: number) => pal[dither(x, y, clamp01(v), pal.length)];

// Dithered "alpha": true on a share `a` of the pixels.
export const cover = (x: number, y: number, a: number) => dither(x, y, clamp01(a), 2) > 0;

export const mix = (a: RGB, b: RGB, k: number): RGB => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

// Soft round glow, dithered towards the edge.
export const glow = (buf: Buf, cx: number, cy: number, r: number, c: RGB, strength = 1) =>
  shadeAll(
    buf,
    (x, y) => {
      const d = Math.hypot(x - cx, y - cy) / r;
      return d < 1 && cover(x, y, (1 - d) * (1 - d) * strength) ? c : null;
    },
    cx - r,
    cy - r,
    cx + r + 1,
    cy + r + 1,
  );

// Thick anti-aliasing-free line in fine pixels.
export const fineLine = (buf: Buf, x0: number, y0: number, x1: number, y1: number, c: RGB, width = PX) => {
  const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / PX) + 1;
  for (let i = 0; i <= n; i++) {
    const x = lerp(x0, x1, i / n), y = lerp(y0, y1, i / n);
    for (let oy = -width / 2; oy < width / 2; oy += PX) for (let ox = -width / 2; ox < width / 2; ox += PX) buf.dot(x + ox, y + oy, c);
  }
};

export const fineDisc = (buf: Buf, cx: number, cy: number, r: number, c: RGB) =>
  shadeAll(buf, (x, y) => (Math.hypot(x - cx, y - cy) <= r ? c : null), cx - r, cy - r, cx + r + 1, cy + r + 1);

// Fine-pixel starfield: no nebula, gentle twinkle, a slow drift.
export const fineStars = (buf: Buf, t: number, count = 140, yMax = H, seed = 7) => {
  const r = rng(seed);
  const cols = [hex("#6c6aa8"), hex("#b7b5e6"), hex("#ffffff")];
  for (let i = 0; i < count; i++) {
    const x = r() * W, y = r() * yMax, b = r(), tw = r() * 6.28;
    const lit = Math.sin(t * (1.5 + b * 2) + tw) > -0.3;
    buf.dot(x, y, cols[b > 0.85 && lit ? 2 : b > 0.5 ? 1 : 0]);
    if (b > 0.93 && lit) {
      buf.dot(x + PX, y, cols[1]);
      buf.dot(x - PX, y, cols[1]);
      buf.dot(x, y + PX, cols[1]);
      buf.dot(x, y - PX, cols[1]);
    }
  }
};

// A jagged lightning or spark path from (x0, y0) to (x1, y1) with optional branches.
export type Bolt = { pts: [number, number][]; branches: [number, number][][] };
export const makeBolt = (seed: number, x0: number, y0: number, x1: number, y1: number, jag = 6, branches = 3): Bolt => {
  const r = rng(seed);
  const n = 18;
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    const off = i === 0 || i === n ? 0 : (r() - 0.5) * jag * 2;
    pts.push([lerp(x0, x1, k) + off, lerp(y0, y1, k) + (r() - 0.5) * 2]);
  }
  const br: [number, number][][] = [];
  for (let b = 0; b < branches; b++) {
    const i = 3 + Math.floor(r() * (n - 8));
    let [x, y] = pts[i];
    const dir = r() > 0.5 ? 1 : -1;
    const seg: [number, number][] = [[x, y]];
    for (let k = 0; k < 6; k++) {
      x += dir * (3 + r() * 5);
      y += 3 + r() * 6;
      seg.push([x, y]);
    }
    br.push(seg);
  }
  return { pts, branches: br };
};

// Draws a bolt with a white core and a coloured glow; `reach` in [0, 1] grows it from the top.
export const drawBolt = (buf: Buf, b: Bolt, reach: number, glowCol: RGB, core = hex("#ffffff"), width = 1.5) => {
  const upto = Math.floor(reach * (b.pts.length - 1));
  const segs: [number, number][][] = [b.pts.slice(0, upto + 1), ...(reach >= 1 ? b.branches : [])];
  segs.forEach((pts, si) => {
    const w = si === 0 ? width : width * 0.5;
    for (let i = 1; i < pts.length; i++) {
      fineLine(buf, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], glowCol, w * 2.6);
    }
    for (let i = 1; i < pts.length; i++) fineLine(buf, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], core, w);
  });
};

// Flickering fire inside a region whose base is `baseY(x)`; `height` is the flame height.
export const drawFire = (buf: Buf, t: number, x0: number, x1: number, baseY: (x: number) => number, height: number, power = 1) => {
  const pal = [hex("#7a1a22"), hex("#d63a2a"), hex("#ff8a3d"), hex("#ffd23f"), hex("#fff2b0")];
  for (let x = Math.floor(x0); x < x1; x += PX) {
    const b = baseY(x);
    for (let y = b - height * 1.4; y < b; y += PX) {
      const u = (b - y) / height;
      const n = noise3(x * 0.35, y * 0.25 + t * 6, t * 1.5) * 0.7 + noise3(x * 0.9, y * 0.7 + t * 9, 3) * 0.3;
      const edge = Math.min(1, Math.min(x - x0, x1 - x) / 6);
      const f = (n * 1.25 - u * 0.75) * power * edge;
      if (f > 0.25) buf.dot(x, y, pick(pal, x, y, (f - 0.25) * 1.6));
    }
  }
};

// Expanding pressure rings (thunder, a pop) around (cx, cy).
export const drawRings = (buf: Buf, cx: number, cy: number, t: number, c: RGB, maxR = 120, count = 3, squash = 1) => {
  for (let k = 0; k < count; k++) {
    const r = t * 90 - k * 22;
    if (r <= 2 || r > maxR) continue;
    const fade = 1 - r / maxR;
    const steps = Math.ceil(r * 8);
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * squash;
      if (cover(x, y, fade)) {
        buf.dot(x, y, c);
        buf.dot(x + Math.cos(a) * PX, y + Math.sin(a) * PX * squash, c);
      }
    }
  }
};
