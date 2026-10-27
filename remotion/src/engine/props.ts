import { Mood, Part, Style, drawParts, ellipse, face, part, roundRect, style, sweatDrop, tri, union } from "./flat";
import { Buf, H, PX, RGB, W, hex, ramp } from "./pixel";
import { cover, fineLine, glow, mix, pick, shadeAll } from "./fine";
import { HeroPose, drawPip } from "./hero";

// Flat props for the v4 look (K1-K3, K6): bright grounds, one big object per shot, faces on
// things. Coordinates are logical pixels; every prop is one drawParts call.

// Backdrop behind the subject (L31, owner's pick "C" 2026-10-27): never a plain colour field.
// Banded light, rays, floating motes and a vignette behind the subject, then far cloud strips, a
// hazy ridge, hue-shifted mid hills and a foreground with grass.

const WHITE_RGB: RGB = [255, 255, 255];
const NIGHT: RGB = [20, 12, 38];

// Hue-shifted tone of a colour (degrees, saturation and value factors): back layers change hue
// instead of going grey, as pixel-art palettes do.
const shift = (c: RGB, dh: number, sk: number, vk: number): RGB => {
  const [r, g, b] = c.map((v) => v / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = d === 0 ? 0 : mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (((h * 60 + dh) % 360) + 360) % 360;
  const sat = Math.min(1, (mx === 0 ? 0 : d / mx) * sk), val = Math.min(1, mx * vk);
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return (val - val * sat * Math.max(0, Math.min(k, 4 - k, 1))) * 255;
  };
  return [f(5), f(3), f(1)];
};

const ridge = (x: number, seed: number, amp: number, freq: number) =>
  amp * (0.6 * Math.sin(x * freq + seed) + 0.3 * Math.sin(x * freq * 2.3 + seed * 1.7) + 0.1 * Math.sin(x * freq * 5.1 + seed * 0.3));

const scenery = (buf: Buf, base: RGB, t: number) => {
  const far = mix(base, WHITE_RGB, 0.3), farShade = mix(base, WHITE_RGB, 0.18);
  [[48, 70, 0.6], [84, 54, -0.4], [118, 40, 0.3]].forEach(([y, w, sp], i) => {
    const x0 = ((((i * 67 + t * sp * 6) % 240) + 240) % 240) - 30;
    for (const dx of [0, 120]) drawParts(buf, [part(union(roundRect(-w / 2, -3, w / 2, 3, 3), ellipse(-w / 6, -4, w / 5, 5), ellipse(w / 8, -3, w / 6, 4)), { fill: far, shade: farShade })],
      { cx: x0 + dx - 60, cy: y, unit: 1, box: [-w / 2 - 2, -10, w / 2 + 2, 5], outline: null, edge: 0.4 });
  });
  const hazeRidge = mix(shift(base, -20, 0.9, 1), WHITE_RGB, 0.15), midHill = shift(base, -35, 1, 0.86), midTop = shift(base, -35, 0.8, 1);
  shadeAll(buf, (x, y) => (y > 176 + ridge(x, 1.3, 9, 0.045) ? hazeRidge : null), 0, 150, W, H);
  shadeAll(buf, (x, y) => {
    const top = 204 + ridge(x + t * 1.5, 4.1, 8, 0.035);
    return y > top ? (y < top + 2 ? midTop : midHill) : null;
  }, 0, 180, W, H);
  near(buf, base, t);
};

const near = (buf: Buf, base: RGB, t: number) => {
  const c = shift(base, -50, 1, 0.66);
  shadeAll(buf, (x, y) => (y > 268 + ridge(x, 7.7, 10, 0.06) ? c : null), 0, 240, W, H);
  for (let i = 0; i < 9; i++) {
    const x = (i * 23 + 7) % W, y = 270 + ridge(x, 7.7, 10, 0.06);
    const sway = Math.sin(t * 2 + i) * 1.5;
    drawParts(buf, [part(union(tri(-4, 0, 0, 0, -2 + sway, -9), tri(-1, 0, 3, 0, 2 + sway, -12), tri(2, 0, 6, 0, 5 + sway, -8)), { fill: c })], { cx: x, cy: y + 1, unit: 1, box: [-5, -13, 7, 1], outline: null, edge: 0 });
  }
};

// The near layer alone, for shots whose own land covers the backdrop's lower half.
export const foreground = (buf: Buf, colors: string[], t = 0) => near(buf, ramp(colors)[1], t);

const light = (buf: Buf, base: RGB, t: number, fx: number, fy: number) => {
  const bands = [0.06, 0.12, 0.2].map((k) => mix(base, WHITE_RGB, k));
  shadeAll(buf, (x, y) => {
    const a = Math.atan2(y - fy, x - fx) + t * 0.15;
    const ray = Math.sin(a * 9) > 0.55;
    const d = Math.hypot(x - fx, (y - fy) * 0.85) / 150;
    const v = (1 - d) * (ray ? 1.25 : 1);
    if (v <= 0.15) return null;
    const step = Math.min(2, Math.floor((v - 0.15) * 4.2));
    return pick([bands[Math.max(0, step - 1)], bands[step]], x, y, (v - 0.15) * 4.2 - step);
  });
  const vin = mix(base, NIGHT, 0.3);
  shadeAll(buf, (x, y) => {
    const d = Math.hypot((x - 90) / 120, (y - 160) / 200);
    return d > 0.82 && cover(x, y, (d - 0.82) * 2.2) ? vin : null;
  });
  for (let i = 0; i < 26; i++) {
    const x = (i * 41 + Math.sin(t * 0.7 + i) * 6) % W, y = H - ((t * (6 + (i % 5) * 2) + i * 53) % H);
    const r = 0.6 + (i % 3) * 0.5;
    shadeAll(buf, (px, py) => (Math.hypot(px - x, py - y) < r ? mix(base, WHITE_RGB, 0.65) : null), x - 2, y - 2, x + 2, y + 2);
  }
};

// The ground: a gentle vertical gradient over close colours plus the backdrop. `fx, fy` is
// where the light comes from (behind the main subject).
export const ground = (buf: Buf, colors: string[], t = 0, y0 = 0, y1 = H, fx = 90, fy = 150) => {
  const pal = ramp(colors);
  shadeAll(buf, (x, y) => pick(pal, x, y, 0.15 + ((y - y0) / (y1 - y0)) * 0.7 + 0.04 * Math.sin(x / 23 + t)), 0, y0, W, y1);
  light(buf, pal[1], t, fx, fy);
  scenery(buf, pal[1], t);
};

// Space backdrop (L31 in space): the same banded light, then drifting hue-shifted nebula strips
// (mid) and twinkling stars (far), so space is never a flat field either.
export const space = (buf: Buf, colors: string[], t = 0, fx = 90, fy = 150) => {
  const pal = ramp(colors);
  shadeAll(buf, (x, y) => pick(pal, x, y, 0.15 + (y / H) * 0.7 + 0.04 * Math.sin(x / 23 + t)));
  const base = pal[1];
  light(buf, base, t, fx, fy);
  const neb = [shift(base, 45, 1, 1.35), shift(base, -45, 1, 1.3)];
  [[78, 120, 0.5], [196, 140, -0.3], [262, 100, 0.4]].forEach(([y, w, sp], i) => {
    const x0 = ((((i * 61 + t * sp * 4) % 260) + 260) % 260) - 40;
    const c = neb[i % 2];
    drawParts(buf, [part(union(ellipse(-w * 0.3, 0, w * 0.35, w * 0.09), ellipse(w * 0.1, -w * 0.04, w * 0.4, w * 0.12), ellipse(w * 0.4, w * 0.02, w * 0.25, w * 0.08)), { fill: mix(c, base, 0.45), shade: mix(c, base, 0.7) })],
      { cx: x0, cy: y, unit: 1, box: [-w * 0.7, -w * 0.2, w * 0.7, w * 0.15], outline: null, edge: 1.4 });
  });
  const star = mix(base, WHITE_RGB, 0.85);
  for (let i = 0; i < 46; i++) {
    const x = (i * 97 + 13) % W, y = (i * 181 + 29) % H;
    if (Math.sin(t * (1.5 + (i % 4) * 0.6) + i) < -0.4) continue;
    buf.dot(x, y, star);
    if (i % 7 === 0) for (const [dx, dy] of [[PX, 0], [-PX, 0], [0, PX], [0, -PX]]) buf.dot(x + dx, y + dy, star);
  }
};

// The Earth with a face; the land drifts as it turns.
const OCEAN = style("#2a9cf4", "#1a64c8", "#a0e0ff");
const LAND = style("#4cd85a", "#22a044", "#b0f490");
export const drawEarth = (buf: Buf, cx: number, cy: number, r: number, mood: Mood, t: number, look = { dx: 0, dy: 0 }) => {
  const globe = ellipse(0, 0, r, r);
  const u = (t * 0.08) % 2;
  const land = (x: number, y: number) => [[-0.5, -0.45, 0.4, 0.3], [0.45, 0.2, 0.35, 0.45], [-0.3, 0.55, 0.3, 0.2], [1.5, -0.3, 0.4, 0.3]].some(([lx, ly, rx, ry]) => {
    const px = ((lx - u + 3) % 2) - 1;
    return ((x / r - px) / rx) ** 2 + ((y / r - ly) / ry) ** 2 <= 1;
  });
  drawParts(buf, [part(globe, OCEAN), part((x, y) => globe(x, y) && land(x, y), LAND), part((x, y) => globe(x, y) && ellipse(-r * 0.2, -r * 0.7, r * 0.35, r * 0.1)(x, y), { fill: WHITE_RGB }), ...face(mood, [-r * 0.32, r * 0.32], r * 0.02, r * 0.2, look)],
    at(cx, cy, [-r - 1, -r - 1, r + 1, r + 1], r / 30));
};

// Close-up: Pip fills the frame below the hook title (y 55-90).
export const pipClose = (buf: Buf, t: number, colors = GROUNDS.cyan, pose: HeroPose = "shock", sweat = false) => {
  ground(buf, colors, t);
  drawPip(buf, pose, 90, 170, 124, t, { sweat, look: { dx: 0, dy: 0 } });
};

export const GROUNDS = {
  sky: ["#0c9cec", "#12a8f2", "#1ab4f6"],
  yellow: ["#ffb81a", "#ffc224", "#ffcc30"],
  coral: ["#ff5a32", "#ff6a3a", "#ff7a44"],
  cyan: ["#10c4ee", "#18cdf2", "#22d6f6"],
  storm: ["#3814b4", "#401ac4", "#4820d2"],
  steel: ["#2f45d8", "#3a4fe8", "#4559f2"],
  dusk: ["#ff5e3a", "#ff7040", "#ff8848"],
  space: ["#2430c8", "#2c3ad8", "#3444e4"],
  night: ["#3a1cb8", "#4224c8", "#4a2cd6"],
};

const at = (cx: number, cy: number, box: [number, number, number, number], edge = 1) => ({ cx, cy, unit: 1, box, edge });

// A rolling hill across the bottom of the frame.
export const drawHill = (buf: Buf, top: number, col = style("#2ec048", "#16903a", "#8ae870")) =>
  drawParts(buf, [part(ellipse(0, 150, 170, 150), col)], at(90, top, [-100, 0, 100, H - top + 4], 1.6));

const CLOUD_LIGHT = style("#9e88ff", "#7458f0", "#d2c6ff");
const CLOUD_DARK = style("#5c3ad6", "#3e22a6", "#8c6cf4");

// A storm cloud of round puffs with a flat base and a face; `dark` for the storm sky.
export const drawCloud = (buf: Buf, cx: number, cy: number, w: number, mood: Mood, t: number, dark = false, look = { dx: 0, dy: 0.3 }) => {
  const k = w / 100;
  const puffs = [[-34, 6, 26], [-12, -10, 32], [16, -14, 30], [38, 4, 24], [0, 10, 36]].map(([x, y, r], i) =>
    ellipse(x * k, (y + Math.sin(t * 1.5 + i) * 1.2) * k, r * k, r * 0.86 * k));
  const parts: Part[] = [
    part(union(...puffs, roundRect(-52 * k, 0, 52 * k, 26 * k, 12 * k)), dark ? CLOUD_DARK : CLOUD_LIGHT),
    ...face(mood, [-12 * k, 12 * k], 4 * k, 7 * k, look),
  ];
  drawParts(buf, parts, at(cx, cy, [-64 * k, -50 * k, 64 * k, 44 * k], Math.max(0.6, k)));
};

const SUN = style("#ffc23a", "#f08a1e", "#fff1a0");

export const drawSun = (buf: Buf, cx: number, cy: number, r: number, mood: Mood, t: number, sweat = false) => {
  glow(buf, cx, cy, r * 1.7, hex("#fff2b0"), 0.8);
  const rays = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2 + t * 0.4;
    const ca = Math.cos(a), sa = Math.sin(a);
    return tri(ca * r * 0.9 - sa * r * 0.22, sa * r * 0.9 + ca * r * 0.22, ca * r * 0.9 + sa * r * 0.22, sa * r * 0.9 - ca * r * 0.22, ca * r * 1.35, sa * r * 1.35);
  });
  drawParts(buf, [part(union(...rays), style("#ffd23f", "#f08a1e", "#fff2b0")), part(ellipse(0, 0, r, r), SUN), ...face(mood, [-r * 0.32, r * 0.32], -r * 0.05, r * 0.2), ...(sweat ? [sweatDrop(r * 0.85, -r * 0.6, r / 30)] : [])],
    at(cx, cy, [-r * 1.4, -r * 1.4, r * 1.4, r * 1.4], r / 30));
};

// One round tree with a face; `burn` in [0, 1] chars the canopy.
export const drawTree = (buf: Buf, cx: number, base: number, h: number, mood: Mood, burn = 0) => {
  const r = h * 0.42;
  const leaf = burn > 0.5 ? style("#8a5a3a", "#5a3424", "#b88050") : style("#4cbf5a", "#2a8a44", "#9ae486");
  drawParts(buf, [
    part(roundRect(-r * 0.16, -h * 0.45, r * 0.16, 0, r * 0.06), style("#a0663a", "#6a3e22", "#d09060")),
    part(union(ellipse(0, -h + r, r, r * 0.95), ellipse(-r * 0.6, -h + r * 1.5, r * 0.6, r * 0.55), ellipse(r * 0.6, -h + r * 1.5, r * 0.6, r * 0.55)), leaf),
    ...face(mood, [-r * 0.3, r * 0.3], -h + r * 1.05, r * 0.2),
  ], at(cx, base, [-r * 1.4, -h - 4, r * 1.4, 2], r / 26));
};

// A small house; the door is a dark rectangle that lights up when `lit`.
export const drawHouse = (buf: Buf, cx: number, base: number, s: number, lit = false) =>
  drawParts(buf, [
    part(roundRect(-s * 0.5, -s * 0.7, s * 0.5, 0, s * 0.04), style("#f4e6c8", "#c8b08a", "#fff8e6")),
    part(tri(-s * 0.66, -s * 0.66, s * 0.66, -s * 0.66, 0, -s * 1.15), style("#e0503a", "#a02e2a", "#ff8a6a")),
    part(roundRect(-s * 0.14, -s * 0.42, s * 0.14, 0, s * 0.04), { fill: hex(lit ? "#ffd23f" : "#3a2a4a") }),
    part(roundRect(s * 0.2, -s * 0.5, s * 0.4, -s * 0.32, s * 0.03), { fill: hex("#ffe58a"), line: hex("#140c26") }),
  ], at(cx, base, [-s * 0.7, -s * 1.2, s * 0.7, 1], s / 40));

const BALLOON = style("#ff4a4a", "#c02a3a", "#ffb0a0");

export const drawBalloon4 = (buf: Buf, cx: number, cy: number, r: number, mood: Mood, t: number) => {
  for (let y = cy + r * 1.15; y < cy + r * 2.6; y += PX) buf.dot(cx + Math.sin(y / 7 + t * 2) * 2, y, hex("#140c26"));
  drawParts(buf, [part(union(ellipse(0, 0, r, r * 1.12), tri(-r * 0.14, r * 1.05, r * 0.14, r * 1.05, 0, r * 1.25)), BALLOON), ...face(mood, [-r * 0.3, r * 0.3], -r * 0.1, r * 0.2), ...(mood === "shock" ? [sweatDrop(r * 0.9, -r * 0.5, r / 34)] : [])],
    at(cx, cy, [-r * 1.3, -r * 1.3, r * 1.3, r * 1.35], r / 30));
};

// Air molecule, ice crystal and hail stone: small round characters with faces (K6).
export const drawMolecule = (buf: Buf, cx: number, cy: number, r: number, mood: Mood, col: Style = style("#5cbcff", "#2a7ae0", "#bfe6ff"), look = { dx: 0, dy: 0 }) =>
  drawParts(buf, [part(ellipse(0, 0, r, r), col), ...face(mood, [-r * 0.36, r * 0.36], -r * 0.05, r * 0.27, look)], at(cx, cy, [-r - 1, -r - 1, r + 1, r + 1], r / 18));

export const drawCrystal = (buf: Buf, cx: number, cy: number, s: number, mood: Mood) =>
  drawParts(buf, [part(union(tri(-s, 0, s, 0, 0, -s * 1.3), tri(-s, 0, s, 0, 0, s * 1.3)), style("#e6fbff", "#8ad0f0", "#ffffff")), ...face(mood, [-s * 0.35, s * 0.35], 0, s * 0.26)],
    at(cx, cy, [-s - 1, -s * 1.4, s + 1, s * 1.4], s / 18));

export const drawHail = (buf: Buf, cx: number, cy: number, r: number, mood: Mood) =>
  drawParts(buf, [part(ellipse(0, 0, r, r * 0.95), style("#d6dcec", "#8a92b8", "#ffffff")), ...face(mood, [-r * 0.35, r * 0.35], 0, r * 0.26)], at(cx, cy, [-r - 1, -r - 1, r + 1, r + 1], r / 18));

export const drawKettle = (buf: Buf, cx: number, cy: number, s: number, mood: Mood, t: number) => {
  for (let k = 0; k < 3; k++) {
    const y = cy - s * 0.9 - ((t * 14 + k * 5) % 14);
    shadeAll(buf, (x, yy) => (Math.hypot(x - (cx + Math.sin(t * 5 + k) * 2 - 2 + k * 2), yy - y) < 2 ? hex("#ffffff") : null), cx - s, y - 3, cx + s, y + 3);
  }
  drawParts(buf, [
    part(roundRect(s * 0.5, -s * 0.2, s * 0.95, s * 0.05, s * 0.1), style("#c8d0e6", "#8a92b8", "#ffffff")),
    part(union(ellipse(0, 0, s * 0.7, s * 0.55), roundRect(-s * 0.7, 0, s * 0.7, s * 0.45, s * 0.1)), style("#c8d0e6", "#8a92b8", "#ffffff")),
    part(roundRect(-s * 0.18, -s * 0.72, s * 0.18, -s * 0.5, s * 0.06), { fill: hex("#140c26") }),
    ...face(mood, [-s * 0.24, s * 0.24], s * 0.05, s * 0.16),
  ], at(cx, cy, [-s, -s * 0.8, s, s * 0.5], s / 30));
};

// A radial light burst with a white core (K7): halo, rays, then the core.
export const drawBurst = (buf: Buf, cx: number, cy: number, r: number, t: number, col: RGB = hex("#fff2b0")) => {
  glow(buf, cx, cy, r * 1.3, col, 1);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + t * 0.8 + (i % 2) * 0.1;
    const len = r * (i % 2 ? 1.1 : 1.6);
    fineLine(buf, cx + Math.cos(a) * r * 0.35, cy + Math.sin(a) * r * 0.35, cx + Math.cos(a) * len, cy + Math.sin(a) * len, i % 3 ? col : hex("#ffffff"), i % 2 ? 1.2 : 2);
  }
  shadeAll(buf, (x, y) => (Math.hypot(x - cx, y - cy) < r * 0.4 ? hex("#ffffff") : null), cx - r, cy - r, cx + r, cy + r);
};
