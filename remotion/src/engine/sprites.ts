import { Buf, Palette, hex, sprite } from "./pixel";
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
