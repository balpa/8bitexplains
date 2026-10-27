import { Buf, H, PX, RGB, W, hex } from "./pixel";

// Flat-shape objects for the v4 look (K3): each part is one shape with one fill, one shadow on the
// lower right, one rim light on the upper left, a line where it overlaps a lower part, and a dark
// outline around the whole object. Parts live in local units and are rasterised in fine pixels.

export type Inside = (x: number, y: number) => boolean;
export type Style = { fill: RGB; shade?: RGB; light?: RGB; line?: RGB };
export type Part = Style & { inside: Inside };

export const INK = hex("#140c26");
export const WHITE = hex("#fbf8ef");

const darken = (c: RGB, k = 0.5): RGB => [c[0] * k, c[1] * k, c[2] * k];

// The line defaults to a darker shade of the part's own colour ("selective outline"), which keeps
// edges soft against bright grounds (K3); pass INK for a hard black line.
export const style = (fill: string, shade?: string, light?: string, line: RGB | null | "auto" = "auto"): Style => ({
  fill: hex(fill),
  shade: shade ? hex(shade) : undefined,
  light: light ? hex(light) : undefined,
  line: line === "auto" ? darken(hex(shade ?? fill)) : line ?? undefined,
});

export const ellipse = (cx: number, cy: number, rx: number, ry: number, rot = 0): Inside => {
  const c = Math.cos(rot), s = Math.sin(rot);
  return (x, y) => {
    const dx = x - cx, dy = y - cy;
    const u = (dx * c + dy * s) / rx, v = (-dx * s + dy * c) / ry;
    return u * u + v * v <= 1;
  };
};
export const roundRect = (x0: number, y0: number, x1: number, y1: number, r: number): Inside => (x, y) => {
  const qx = Math.max(x0 + r - x, 0, x - (x1 - r)), qy = Math.max(y0 + r - y, 0, y - (y1 - r));
  return x >= x0 && x <= x1 && y >= y0 && y <= y1 && qx * qx + qy * qy <= r * r;
};
export const tri = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number): Inside => (x, y) => {
  const d1 = (x - bx) * (ay - by) - (ax - bx) * (y - by);
  const d2 = (x - cx) * (by - cy) - (bx - cx) * (y - cy);
  const d3 = (x - ax) * (cy - ay) - (cx - ax) * (y - ay);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
};
// Upper half of a ring: a happy closed eye or a smile turned over.
export const arc = (cx: number, cy: number, r: number, w: number): Inside => (x, y) => {
  const d = Math.hypot(x - cx, y - cy);
  return y <= cy && d <= r && d >= r - w;
};
export const union = (...fs: Inside[]): Inside => (x, y) => fs.some((f) => f(x, y));
export const minus = (a: Inside, b: Inside): Inside => (x, y) => a(x, y) && !b(x, y);
export const part = (inside: Inside, s: Style): Part => ({ inside, ...s });

export type Mood = "open" | "shock" | "grin" | "angry" | "smug" | "blink";
export type Look = { dx: number; dy: number };

// A pair (or row) of eyes for anything with a face, centred at `xs` and `y`, radius `r`.
export const face = (mood: Mood, xs: number[], y: number, r: number, look: Look = { dx: 0, dy: 0 }): Part[] => {
  const parts: Part[] = [];
  xs.forEach((x, i) => {
    const side = xs.length > 1 ? (i === 0 ? -1 : 1) : 1;
    if (mood === "grin") return parts.push({ inside: arc(x, y + r * 0.4, r * 0.8, r * 0.35), fill: INK });
    if (mood === "blink") return parts.push({ inside: roundRect(x - r * 0.8, y - r * 0.1, x + r * 0.8, y + r * 0.1, r * 0.1), fill: INK });
    const er = mood === "shock" ? r * 1.15 : r;
    const pr = mood === "shock" ? er * 0.32 : er * 0.5;
    const px = x + look.dx * (er - pr - r * 0.1), py = y + look.dy * (er - pr - r * 0.1);
    parts.push({ inside: ellipse(x, y, er, er * 1.08), fill: WHITE, line: INK });
    parts.push({ inside: ellipse(px, py, pr, pr * 1.1), fill: INK });
    parts.push({ inside: ellipse(px - pr * 0.35, py - pr * 0.4, Math.max(r * 0.12, pr * 0.3), Math.max(r * 0.12, pr * 0.3)), fill: WHITE });
    if (mood === "angry") parts.push({ inside: tri(x - er * 1.2, y - er * (side < 0 ? 1.3 : 0.5), x + er * 1.2, y - er * (side < 0 ? 0.5 : 1.3), x, y - er * 1.6), fill: INK });
    if (mood === "smug") parts.push({ inside: roundRect(x - er * 1.1, y - er * 1.2, x + er * 1.1, y - er * 0.05, er * 0.2), fill: INK });
  });
  return parts;
};

export const sweatDrop = (x: number, y: number, s = 1): Part => ({
  inside: union(ellipse(x, y + 5 * s, 5 * s, 5.6 * s), tri(x - 4.2 * s, y + 3 * s, x + 4.2 * s, y + 3 * s, x, y - 8 * s)),
  fill: hex("#7fe8ff"),
  light: WHITE,
  line: hex("#1d6fa8"),
});

export type Place = {
  cx: number;
  cy: number;
  // Logical pixels per local unit.
  unit: number;
  // Local-unit box to scan; anything outside it is not drawn.
  box: [number, number, number, number];
  sx?: number;
  sy?: number;
  flip?: boolean;
  outline?: RGB | null;
  // Scales the shadow and rim-light depth; small objects need less than 1.
  edge?: number;
};

const darkenFill = (c: RGB) => darken(c);
const SHADE_OFF = 3.2;
const LIGHT_OFF = 2.2;

export const drawParts = (buf: Buf, parts: Part[], p: Place) => {
  const { cx, cy, unit, box } = p;
  const sx = (p.sx ?? 1) * unit, sy = (p.sy ?? 1) * unit;
  const dir = p.flip ? -1 : 1;
  // Outer outline: the touching part's own line colour unless a colour (or null for none) is given.
  const fixed = p.outline;
  const shadeOff = SHADE_OFF * (p.edge ?? 1), lightOff = LIGHT_OFF * (p.edge ?? 1);
  const top = (lx: number, ly: number) => {
    for (let i = parts.length - 1; i >= 0; i--) if (parts[i].inside(lx, ly)) return i;
    return -1;
  };
  const stepX = PX / sx, stepY = PX / sy;
  const x0 = Math.max(0, Math.min(cx + box[0] * sx * dir, cx + box[2] * sx * dir) - PX * 2);
  const x1 = Math.min(W, Math.max(cx + box[0] * sx * dir, cx + box[2] * sx * dir) + PX * 2);
  const y0 = Math.max(0, cy + box[1] * sy - PX * 2), y1 = Math.min(H, cy + box[3] * sy + PX * 2);
  for (let y = Math.floor(y0 / PX) * PX; y < y1; y += PX)
    for (let x = Math.floor(x0 / PX) * PX; x < x1; x += PX) {
      const lx = ((x - cx) / sx) * dir, ly = (y - cy) / sy;
      const i = top(lx, ly);
      if (i < 0) {
        if (fixed === null) continue;
        const n = Math.max(top(lx + stepX, ly), top(lx - stepX, ly), top(lx, ly + stepY), top(lx, ly - stepY));
        if (n >= 0) buf.dot(x, y, fixed ?? parts[n].line ?? darkenFill(parts[n].fill));
        continue;
      }
      const q = parts[i];
      let c = q.fill;
      if (q.line && [top(lx + stepX, ly), top(lx - stepX, ly), top(lx, ly + stepY), top(lx, ly - stepY)].some((k) => k >= 0 && k < i)) c = q.line;
      else if (q.shade && !q.inside(lx + shadeOff * dir, ly + shadeOff)) c = q.shade;
      else if (q.light && !q.inside(lx - lightOff * dir, ly - lightOff)) c = q.light;
      buf.dot(x, y, c);
    }
};
