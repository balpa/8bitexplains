import { Buf, PX, W, clamp01, dither, hex, lerp, ramp, sprite } from "./pixel";
import { P, R } from "./palette";
import { drawBird } from "./sprites";

export type TubOpts = {
  t: number;
  frame: number;
  tilt: number;
  wind: number;
  upwell: number;
};

const LEFT = 18;
const RIGHT = 162;
const RIM = 150;
const BOTTOM = 236;
const BASE = 170;
const FLOOR = 256;

const WALL = ramp(["#1c1440", "#2a1d5c", "#3a2a78"]);
const PORCELAIN = ramp(["#8f8cc9", "#c9c6ee", "#f4f1e8"]);
const DUCK = ["..yy....", ".yyky...", ".yyyyoo.", "yyyyyy..", "yyyyyyy.", ".yyyyy.."];

// Surface height above the tub floor; positive tilt piles water up on the west (left) end.
export const surfaceY = (x: number, o: TubOpts) => {
  const u = (x - LEFT) / (RIGHT - LEFT);
  return BASE - o.tilt * 16 * (1 - 2 * u) + Math.sin(x / 5 + o.t * 6) * (0.6 + o.wind * 0.8);
};

const warmThickness = (u: number, tilt: number) => Math.max(2, 12 + 14 * tilt * (1 - 2 * u));

const insideTub = (x: number, y: number) => {
  if (x < LEFT || x > RIGHT || y > BOTTOM) return false;
  const corner = 14;
  const dx = x < LEFT + corner ? LEFT + corner - x : x > RIGHT - corner ? x - (RIGHT - corner) : 0;
  const dy = y > BOTTOM - corner ? y - (BOTTOM - corner) : 0;
  return dx * dx + dy * dy <= corner * corner;
};

// Cut-away bathtub metaphor for the Pacific: Asia on the left, the Americas on the right.
export const drawTub = (buf: Buf, o: TubOpts) => {
  for (let y = 0; y < 320; y += PX)
    for (let x = 0; x < W; x += PX) {
      const grout = Math.floor(x) % 20 === 0 || Math.floor(y) % 20 === 0;
      const v = clamp01(0.25 + 0.5 * (1 - Math.abs(x - 90) / 120) - y / 900);
      buf.dot(x, y, grout ? hex("#120c2c") : WALL[dither(x, y, v, WALL.length)]);
    }
  const tileA = hex("#2a1d5c"), tileB = hex("#3e2c80"), seam = hex("#120c2c"), shadow = hex("#0c0820");
  for (let y = FLOOR; y < 320; y += PX) {
    const depth = 40 / (y - FLOOR + 6);
    for (let x = 0; x < W; x += PX) {
      const fx = (x - W / 2) * depth * 0.12, fz = depth * 4;
      const onSeam = Math.abs(fx - Math.round(fx)) < 0.04 || Math.abs(fz - Math.round(fz)) < 0.05;
      const checker = (Math.floor(fx) + Math.floor(fz)) & 1;
      const inShadow = ((x - 90) / 82) ** 2 + ((y - FLOOR - 4) / 8) ** 2 < 1;
      buf.dot(x, y, inShadow ? shadow : onSeam ? seam : checker ? tileA : tileB);
    }
  }
  for (let y = RIM - 6; y <= BOTTOM + 6; y += PX)
    for (let x = LEFT - 6; x <= RIGHT + 6; x += PX) {
      if (insideTub(x, y)) continue;
      const near = [[-6, 0], [6, 0], [0, 6], [-4, 4], [4, 4]].some(([dx, dy]) => insideTub(x + dx, y - dy));
      if (near && y >= RIM - 6) buf.dot(x, y, PORCELAIN[dither(x, y, 1 - (y - RIM) / 120, PORCELAIN.length)]);
    }
  buf.rect(LEFT - 8, RIM - 8, RIGHT - LEFT + 16, 4, hex(P.white));
  [[LEFT + 6, 0], [RIGHT - 16, 1]].forEach(([fx]) => {
    buf.rect(fx, BOTTOM + 6, 10, 4, PORCELAIN[1]);
    buf.rect(fx + 2, BOTTOM + 10, 6, 8, PORCELAIN[0]);
  });
  for (let x = LEFT; x <= RIGHT; x += PX) {
    const u = (x - LEFT) / (RIGHT - LEFT);
    const top = Math.round(surfaceY(x, o) / PX) * PX;
    const warm = warmThickness(u, o.tilt);
    for (let y = top; y <= BOTTOM; y += PX) {
      if (!insideTub(x, y)) continue;
      const depth = y - top;
      if (depth < warm) buf.dot(x, y, R.warm[dither(x, y, 0.95 - (depth / warm) * 0.7, R.warm.length)]);
      else buf.dot(x, y, R.cold[dither(x, y, clamp01(0.85 - (y - top - warm) / 70), R.cold.length)]);
    }
    if (insideTub(x, top)) buf.dot(x, top, hex("#ffe2b8"));
  }
  if (o.upwell > 0.02) {
    const cyan = hex(P.cyan), pale = hex("#9ad4ff");
    for (let i = 0; i < 10; i++) {
      if (i / 10 > o.upwell) continue;
      const x = RIGHT - 40 + ((i * 13) % 30);
      const y = BOTTOM - 6 - ((o.t * 22 + i * 17) % 50);
      buf.put(x, y, cyan);
      buf.put(x - 1, y + 1, pale);
      buf.put(x + 1, y + 1, pale);
      buf.put(x, y + 2, pale);
    }
  }
  const duckX = lerp(70, 110, clamp01(0.5 - o.tilt * 0.5)) + Math.sin(o.t * 1.3) * 4;
  sprite(buf, DUCK, { y: P.yellow, k: P.ink, o: P.orange }, Math.round(duckX), Math.round(surfaceY(duckX, o)) - 6, false, 2);
  const white = hex(P.white);
  const puffs = Math.round(o.wind * 6);
  for (let i = 0; i < puffs; i++) {
    const x = RIGHT - 6 - ((o.t * 70 * o.wind + i * 23) % 120);
    const y = RIM - 20 + ((i * 7) % 12);
    for (let k = 0; k < 7; k++) buf.put(x + k, y + Math.round(Math.sin((x + k) / 2)), white);
  }
  drawBird(buf, RIGHT - 4, RIM - 40 + Math.sin(o.t * 3) * 2, o.frame, true, 2, o.wind < 0.4);
};
