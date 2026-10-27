import { Buf, Palette, RGB, hex, ramp, sprite } from "./pixel";
import { pick, shadeAll } from "./fine";
import { P } from "./palette";

const BIRD_UP = [
  "k.......k..",
  "kk.....kk..",
  ".kwkkkwk...",
  "..kwwwwkkyy",
  ".kwwwkwwk..",
  ".kbbbbbk...",
  "..k...k....",
];
const BIRD_DOWN = [
  "...........",
  "...kkkkk...",
  "..kwwwwkkyy",
  ".kwwwkwwk..",
  "kwwbbbbbkk.",
  "kk.k...k.kk",
  "...........",
];
const BIRD_PAL: Palette = { k: P.ink, w: P.white, y: P.yellow, b: P.pink };

// Mascot bird, 11x7 logical pixels before scaling; flaps on a 6-frame cycle.
export const drawBird = (buf: Buf, x: number, y: number, frame: number, flip = false, scale = 2, sweat = false) => {
  const up = Math.floor(frame / 6) % 2 === 0;
  sprite(buf, up ? BIRD_UP : BIRD_DOWN, BIRD_PAL, Math.round(x), Math.round(y), flip, scale);
  if (sweat && Math.floor(frame / 9) % 3 !== 2) {
    const drop = hex(P.cyan);
    const dx = flip ? x - 2 : x + 11 * scale + 1;
    buf.put(dx, y + 2 + (frame % 9) / 3, drop);
    buf.put(dx, y + 3 + (frame % 9) / 3, drop);
  }
};

const BIRD_XRAY = [
  "w.......w..",
  "ww.....ww..",
  ".wkkkkkw...",
  "..kwkwkkkww",
  ".kkwwwkwk..",
  ".kwkwkwk...",
  "..w...w....",
];
const SOOT_PAL: Palette = { k: P.ink, w: "#3a3440", y: P.yellow, b: "#241e2c" };

export type BirdMood = "zapped" | "charred" | "puffed" | "shades";

// Gag poses for the mascot (L24): an x-ray flicker while electrocuted, soot with smoke and dizzy
// stars afterwards, feathers on end from static, and sunglasses next to something very bright.
export const drawBirdAs = (buf: Buf, x: number, y: number, frame: number, mood: BirdMood, flip = false, scale = 2, sit = false) => {
  const ox = Math.round(x), oy = Math.round(y);
  const at = (i: number, j: number) => ({ x: ox + (flip ? 10 - i : i) * scale, y: oy + j * scale });
  const block = (i: number, j: number, c: string) => {
    const p = at(i, j);
    buf.rect(p.x, p.y, scale, scale, hex(c));
  };
  if (mood === "zapped") {
    if (Math.floor(frame / 2) % 2 === 0) sprite(buf, BIRD_XRAY, { k: P.ink, w: P.white }, ox, oy, flip, scale);
    else sprite(buf, BIRD_UP, { k: P.white, w: P.yellow, y: P.white, b: P.yellow }, ox, oy, flip, scale);
    return;
  }
  const up = !sit && Math.floor(frame / 6) % 2 === 0;
  const eye = up ? 4 : 3;
  sprite(buf, up ? BIRD_UP : BIRD_DOWN, mood === "charred" ? SOOT_PAL : BIRD_PAL, ox, oy, flip, scale);
  if (mood === "charred") {
    block(5, eye, P.white);
    [2, 4, 6].forEach((i, k) => block(i, -1 - ((frame >> 3) + k) % 2, P.ink));
    for (let k = 0; k < 3; k++) {
      const age = ((frame + k * 10) % 30) / 30;
      const p = at(5, -2);
      buf.rect(p.x + Math.sin(age * 6 + k) * 3, p.y - age * 16, 2, 2, hex(age < 0.5 ? "#8a8494" : "#5a5464"));
    }
    for (let k = 0; k < 2; k++) {
      const a = frame * 0.25 + k * Math.PI, c = at(5, -1);
      buf.put(c.x + Math.cos(a) * 8, c.y + Math.sin(a) * 2, hex(P.yellow));
    }
  }
  if (mood === "puffed") {
    const c = at(5, 3);
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2 + Math.sin(frame * 0.9 + k) * 0.15;
      const r = 6.5 * (scale / 2) + ((frame + k) % 3);
      buf.put(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r * 0.75, hex(k % 4 ? P.white : P.cyan));
    }
  }
  if (mood === "shades") {
    [3, 4, 5, 6, 7].forEach((i) => block(i, eye, P.ink));
    [4, 6].forEach((i) => block(i, eye + 1, P.ink));
    if (Math.floor(frame / 20) % 3 === 0) block(6, eye, P.white);
  }
};

const FACE = [
  "..kk................kk..",
  "..kwk..............kwk..",
  "...kwkkkkkkkkkkkkkkwk...",
  "...kwwwwwwwwwwwwwwwwk...",
  "..kwwwwwwwwwwwwwwwwwwk..",
  ".kwwwwwwwwwwwwwwwwwwwwk.",
  ".kwwwwwwwwwwwwwwwwwwwwk.",
  ".kwwwwwwwwwwwwwwwwwwwwk.",
  ".kwwwwwwwwwwwwwwwwwwwwk.",
  ".kwwwwwwwwyyyywwwwwwwwk.",
  ".kwbbwwwwyyyyyywwwwbbwk.",
  ".kwbbwwwwkyyyykwwwwbbwk.",
  ".kwwwwwwwwkyykwwwwwwwwk.",
  "..kwwwwwwwwkkwwwwwwwwk..",
  "...kwwwwwwwwwwwwwwwwk...",
  "....kkkkkkkkkkkkkkkk....",
];
const FACE_PAL: Palette = { k: P.ink, w: P.white, y: P.yellow, b: P.pink, r: P.red, c: P.cyan };

export type FaceMood = "look" | "shock" | "squint" | "grin" | "sweat";

// Close-up of the mascot's head for reaction shots (L29): 24x16 logical pixels before scaling, so
// scale 3 fills 40% of the frame width. Eyes, brows and beak change with the mood.
export const drawBirdFace = (buf: Buf, x: number, y: number, frame: number, mood: FaceMood, scale = 3) => {
  const rows = FACE.map((r) => r.split(""));
  const set = (i: number, j: number, ch: string) => { if (rows[j] && rows[j][i] !== undefined) rows[j][i] = ch; };
  const eye = (x0: number, draw: (i: number, j: number) => string | null) => {
    for (let j = 5; j <= 8; j++) for (let i = x0; i < x0 + 4; i++) { const ch = draw(i - x0, j - 5); if (ch) set(i, j, ch); }
  };
  const blink = mood === "look" && frame % 90 > 84;
  for (const x0 of [5, 15]) {
    if (blink || mood === "squint") eye(x0, (i, j) => (j === 2 ? "k" : null));
    else if (mood === "grin") eye(x0, (i, j) => ((j === 1 && (i === 1 || i === 2)) || (j === 2 && (i === 0 || i === 3)) ? "k" : null));
    else if (mood === "shock") eye(x0, (i, j) => (i === 0 || i === 3 || j === 0 || j === 3 ? "k" : i === 1 && j === 1 ? "k" : null));
    else {
      const look = mood === "sweat" ? 0 : 1;
      eye(x0, (i, j) => (i === 0 || i === 3 || j === 0 || j === 3 ? "k" : i === 1 + look && j >= 1 && j <= 2 ? "k" : null));
    }
  }
  if (mood === "shock") {
    for (const x0 of [5, 15]) for (let i = 0; i < 4; i++) set(x0 + i, 3, "k");
    ["kkkk", "krrk", "krrk"].forEach((r, j) => r.split("").forEach((ch, i) => set(10 + i, 11 + j, ch)));
  }
  if (mood === "squint") for (const x0 of [5, 15]) for (let i = 0; i < 4; i++) set(x0 + i, 4, "k");
  if (mood === "grin") ["krrrrk", ".krrk."].forEach((r, j) => r.split("").forEach((ch, i) => ch !== "." && set(9 + i, 11 + j, ch)));
  sprite(buf, rows.map((r) => r.join("")), FACE_PAL, Math.round(x), Math.round(y), false, scale);
  if (mood === "sweat" && Math.floor(frame / 9) % 3 !== 2) {
    const d = hex(P.cyan), dy = (frame % 18) / 3;
    buf.rect(x + 21 * scale, y + (3 + dy) * scale * 0.5 + 6, scale, scale * 2, d);
  }
};

const DIGITS: Record<string, string[]> = {
  "0": ["www", "w.w", "w.w", "w.w", "www"],
  "1": [".w.", "ww.", ".w.", ".w.", "www"],
  "2": ["www", "..w", "www", "w..", "www"],
  "3": ["www", "..w", "www", "..w", "www"],
  "4": ["w.w", "w.w", "www", "..w", "..w"],
  "5": ["www", "w..", "www", "..w", "www"],
  "6": ["www", "w..", "www", "w.w", "www"],
  "7": ["www", "..w", "..w", ".w.", ".w."],
  "8": ["www", "w.w", "www", "w.w", "www"],
  "9": ["www", "w.w", "www", "..w", "www"],
  ",": ["...", "...", "...", ".w.", "w.."],
  "°": ["ww.", "ww.", "...", "...", "..."],
  F: ["www", "w..", "ww.", "w..", "w.."],
  M: ["w.w", "www", "www", "w.w", "w.w"],
  P: ["ww.", "w.w", "ww.", "w..", "w.."],
  H: ["w.w", "w.w", "www", "w.w", "w.w"],
  S: [".ww", "w..", ".w.", "..w", "ww."],
  E: ["www", "w..", "ww.", "w..", "www"],
  C: [".ww", "w..", "w..", "w..", ".ww"],
  A: [".w.", "w.w", "www", "w.w", "w.w"],
  B: ["ww.", "w.w", "ww.", "w.w", "ww."],
  D: ["ww.", "w.w", "w.w", "w.w", "ww."],
  G: [".ww", "w..", "w.w", "w.w", ".ww"],
  I: ["www", ".w.", ".w.", ".w.", "www"],
  J: ["..w", "..w", "..w", "w.w", ".w."],
  K: ["w.w", "w.w", "ww.", "w.w", "w.w"],
  L: ["w..", "w..", "w..", "w..", "www"],
  N: ["ww.", "w.w", "w.w", "w.w", "w.w"],
  O: [".w.", "w.w", "w.w", "w.w", ".w."],
  Q: [".w.", "w.w", "w.w", "ww.", ".ww"],
  R: ["ww.", "w.w", "ww.", "w.w", "w.w"],
  T: ["www", ".w.", ".w.", ".w.", ".w."],
  U: ["w.w", "w.w", "w.w", "w.w", "www"],
  V: ["w.w", "w.w", "w.w", "w.w", ".w."],
  W: ["w.w", "w.w", "www", "www", "w.w"],
  X: ["w.w", "w.w", ".w.", "w.w", "w.w"],
  Y: ["w.w", "w.w", ".w.", ".w.", ".w."],
  Z: ["www", "..w", ".w.", "w..", "www"],
  "+": ["...", ".w.", "www", ".w.", "..."],
  "-": ["...", "...", "www", "...", "..."],
  "=": ["...", "www", "...", "www", "..."],
  "?": ["ww.", "..w", ".w.", "...", ".w."],
  "!": [".w.", ".w.", ".w.", "...", ".w."],
  ".": ["...", "...", "...", "...", ".w."],
  " ": ["...", "...", "...", "...", "..."],
};

// A number label on a dark pill, centred on (cx, cy), for numbers that sit next to their object (L28).
export const drawNumber = (buf: Buf, text: string, cx: number, cy: number, color: string = P.white, scale = 2) => {
  const w = text.length * 4 * scale - scale, h = 5 * scale;
  const x0 = Math.round(cx - w / 2), y0 = Math.round(cy - h / 2);
  buf.rect(x0 - 2, y0 - 2, w + 4, h + 4, hex(P.ink));
  [...text].forEach((ch, k) => sprite(buf, DIGITS[ch] ?? ["...", "...", "...", "...", "..."], { w: color }, x0 + k * 4 * scale, y0, false, scale));
};

// A label on a rounded pill in the pill's colour (v4 look, K4), centred on (cx, cy).
export const drawPill = (buf: Buf, text: string, cx: number, cy: number, bg: string = P.yellow, fg: string = P.ink, scale = 2) => {
  const w = text.length * 4 * scale - scale, h = 5 * scale, pad = scale + 1;
  const x0 = Math.round(cx - w / 2), y0 = Math.round(cy - h / 2);
  const ink = hex(P.ink), fill = hex(bg);
  buf.rect(x0 - pad, y0 - pad - 1, w + pad * 2, h + pad * 2 + 2, ink);
  buf.rect(x0 - pad - 1, y0 - pad, w + pad * 2 + 2, h + pad * 2, ink);
  buf.rect(x0 - pad + 1, y0 - pad, w + pad * 2 - 2, h + pad * 2, fill);
  buf.rect(x0 - pad, y0 - pad + 1, w + pad * 2, h + pad * 2 - 2, fill);
  [...text].forEach((ch, k) => sprite(buf, DIGITS[ch] ?? DIGITS[" "], { w: fg }, x0 + k * 4 * scale, y0, false, scale));
};

// Two eyes on an object (L28 faces on things), in logical pixels around (cx, cy).
export const drawEyes = (buf: Buf, cx: number, cy: number, mood: "angry" | "scared" | "open", size = 3, gap = 6) => {
  const ink = hex(P.ink), white = hex(P.white);
  for (const side of [-1, 1]) {
    const x = Math.round(cx + side * gap - size / 2), y = Math.round(cy - size / 2);
    buf.rect(x - 1, y - 1, size + 2, size + 2, ink);
    buf.rect(x, y, size, size, white);
    const p = Math.max(1, Math.floor(size / 2));
    buf.rect(x + (mood === "scared" ? Math.floor((size - p) / 2) : side < 0 ? size - p : 0), y + Math.floor((size - p) / 2), p, p, ink);
    if (mood === "angry") for (let k = 0; k < size + 2; k++) buf.put(x - 1 + k, y - 2 - Math.round((side > 0 ? k : size + 1 - k) / 3), ink);
    if (mood === "scared") buf.rect(x, y - 3, size, 1, ink);
  }
};

const CLOSE_BG = ramp(["#0f6a8a", "#1f9ec0", "#3ee0ff", "#9af2ff"]);

// Full-frame reaction shot (L29): the bird's head at 40% of the frame width on a bright backdrop,
// with optional sparks circling it.
export const drawCloseUp = (buf: Buf, t: number, frame: number, mood: FaceMood, sparks = 0, bg: RGB[] = CLOSE_BG) => {
  shadeAll(buf, (x, y) => pick(bg, x, y, 0.35 + y / 420 + 0.05 * Math.sin((x + y) / 14 - t * 3)));
  drawBirdFace(buf, 54, 104 + Math.round(Math.sin(t * 5) * 2), frame, mood, 3);
  for (let k = 0; k < sparks; k++) {
    const a = t * 7 + k * 2.1, r = 50 + 6 * Math.sin(t * 11 + k);
    buf.rect(90 + Math.cos(a) * r, 128 + Math.sin(a) * r * 0.8, 2, 2, hex(P.yellow));
  }
};

// Thermometer with a mercury level in [0, 1]; the bulb blinks when hot.
export const drawThermometer = (buf: Buf, x: number, y: number, h: number, level: number, frame: number) => {
  const white = hex(P.white), ink = hex(P.ink), red = hex(Math.floor(frame / 8) % 2 ? P.red : P.orange);
  buf.rect(x - 1, y - 1, 7, h + 2, white);
  buf.rect(x, y, 5, h, ink);
  const fill = Math.round(h * Math.max(0.08, Math.min(1, level)));
  buf.rect(x + 1, y + h - fill, 3, fill, red);
  buf.rect(x - 3, y + h, 11, 9, white);
  buf.rect(x - 2, y + h + 1, 9, 7, red);
  for (let k = 0; k < 5; k++) buf.rect(x + 6, y + 3 + k * Math.floor(h / 5), 2, 1, white);
};

const BOAT = [
  "......w.......",
  "......ww......",
  "......www.....",
  "......wwww....",
  "......wwwww...",
  "......w.......",
  "rrrrrrrrrrrrrr",
  ".rrrrrrrrrrrr.",
  "..kkkkkkkkkk..",
];
export const drawBoat = (buf: Buf, x: number, y: number, scale = 2) =>
  sprite(buf, BOAT, { w: P.white, r: P.pink, k: P.ink }, Math.round(x), Math.round(y), false, scale);

const STAR = ["...y...", "...y...", "..yyy..", "yyyyyyy", "..yyy..", "...y...", "...y..."];
export const drawStar = (buf: Buf, x: number, y: number, frame: number, scale = 2) => {
  if (Math.floor(frame / 10) % 4 === 3) sprite(buf, ["y"], { y: P.white }, x + 3 * scale, y + 3 * scale, false, scale);
  else sprite(buf, STAR, { y: P.yellow }, x, y, false, scale);
};

const SUN = ["..y..y..", "y.yyyy.y", ".yyyyyy.", "yyyyyyyy", "yyyyyyyy", ".yyyyyy.", "y.yyyy.y", "..y..y.."];
export const drawSunIcon = (buf: Buf, x: number, y: number, scale = 2) => sprite(buf, SUN, { y: P.yellow }, x, y, false, scale);

const CLOUD = ["...cccc.....", "..cccccc.cc.", ".cccccccccc.", "cccccccccccc", ".cccccccccc."];
const DROPS_A = ["..b..b..b...", ".b..b..b....", "..b..b..b..."];
const DROPS_B = [".b..b..b....", "..b..b..b...", ".b..b..b...."];
export const drawRainIcon = (buf: Buf, x: number, y: number, frame: number, scale = 2) =>
  sprite(buf, CLOUD.concat(Math.floor(frame / 6) % 2 ? DROPS_A : DROPS_B), { c: "#c9d4f0", b: P.cyan }, x, y, false, scale);

const FLOPPY = [
  "kkkkkkkkkkkk.",
  "kwwwwwwwwkkkk",
  "kwwwwwwwwkgkk",
  "kwwwwwwwwkgkk",
  "kwwwwwwwwkkkk",
  "kkkkkkkkkkkkk",
  "kkgggggggggkk",
  "kkgkkkkkkkgkk",
  "kkgkkkkkkkgkk",
  "kkgggggggggkk",
  "kkkkkkkkkkkkk",
];
export const drawFloppy = (buf: Buf, x: number, y: number, scale = 3) =>
  sprite(buf, FLOPPY, { k: P.cyan, w: P.white, g: P.ink }, x, y, false, scale);

// Rising heat-shimmer pixels.
export const drawShimmer = (buf: Buf, t: number, y0: number, y1: number, count = 24) => {
  const c1 = hex(P.orange), c2 = hex(P.yellow);
  for (let i = 0; i < count; i++) {
    const x = ((i * 53) % 180) + Math.sin(t * 2 + i) * 3;
    const y = y1 - ((t * 30 + i * 37) % (y1 - y0));
    buf.put(x, y, i % 3 ? c1 : c2);
  }
};
