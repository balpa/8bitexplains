export const W = 180;
export const H = 320;
export const SCALE = 6;

export type RGB = [number, number, number];

export const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
export const ramp = (colors: string[]): RGB[] => colors.map(hex);

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

export const bayer = (x: number, y: number) => (BAYER[y & 3][x & 3] + 0.5) / 16;

// Picks one of `levels` steps for value v in [0, 1], ordered-dithered by pixel position.
export const dither = (x: number, y: number, v: number, levels: number) =>
  Math.max(0, Math.min(levels - 1, Math.floor(v * (levels - 1) + bayer(x, y))));

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

export class Buf {
  data = new Uint8ClampedArray(W * H * 4);

  put(x: number, y: number, c: RGB) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 4;
    this.data[i] = c[0];
    this.data[i + 1] = c[1];
    this.data[i + 2] = c[2];
    this.data[i + 3] = 255;
  }

  rect(x: number, y: number, w: number, h: number, c: RGB) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.put(x + i, y + j, c);
  }

  // Vertical dithered gradient across `colors`, from y0 to y1.
  gradient(colors: RGB[], y0 = 0, y1 = H) {
    for (let y = Math.max(0, Math.floor(y0)); y < Math.min(H, y1); y++) {
      const v = (y - y0) / (y1 - y0);
      for (let x = 0; x < W; x++) this.put(x, y, colors[dither(x, y, v, colors.length)]);
    }
  }
}

// Ordered-dither dissolve between two frames: t=0 shows a, t=1 shows b.
export const dissolve = (a: Buf, b: Buf, t: number) => {
  const out = new Buf();
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const src = t > bayer(x >> 1, y >> 1) ? b : a;
      const i = (y * W + x) * 4;
      out.data[i] = src.data[i];
      out.data[i + 1] = src.data[i + 1];
      out.data[i + 2] = src.data[i + 2];
      out.data[i + 3] = 255;
    }
  return out;
};

const hash3 = (x: number, y: number, z: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
};

const fade = (t: number) => t * t * (3 - 2 * t);

export const noise3 = (x: number, y: number, z: number) => {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = fade(x - xi), yf = fade(y - yi), zf = fade(z - zi);
  let v = 0;
  for (let dx = 0; dx < 2; dx++)
    for (let dy = 0; dy < 2; dy++)
      for (let dz = 0; dz < 2; dz++)
        v += hash3(xi + dx, yi + dy, zi + dz) * (dx ? xf : 1 - xf) * (dy ? yf : 1 - yf) * (dz ? zf : 1 - zf);
  return v;
};

export const fbm = (x: number, y: number, z: number) =>
  noise3(x, y, z) * 0.6 + noise3(x * 2.1, y * 2.1, z * 2.1) * 0.3 + noise3(x * 4.3, y * 4.3, z * 4.3) * 0.1;

// Deterministic pseudo-random sequence.
export const rng = (seed: number) => {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
};

export type Palette = Record<string, string>;

export const sprite = (buf: Buf, rows: string[], pal: Palette, ox: number, oy: number, flip = false, scale = 1) => {
  rows.forEach((row, j) =>
    [...row].forEach((ch, i) => {
      const col = pal[ch];
      if (!col) return;
      const c = hex(col);
      const px = flip ? row.length - 1 - i : i;
      for (let sy = 0; sy < scale; sy++)
        for (let sx = 0; sx < scale; sx++) buf.put(ox + px * scale + sx, oy + j * scale + sy, c);
    }),
  );
};
