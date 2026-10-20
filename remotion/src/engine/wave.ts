import { Buf, H, PX, W, clamp01, dither, hex, lerp, noise3, ramp, rng } from "./pixel";
import { P, R } from "./palette";

const WATER_Y = 228;
const SLOPE = { x0: 104, y0: WATER_Y, x1: 182, y1: 52 };
const slopeY = (x: number) => lerp(SLOPE.y0, SLOPE.y1, clamp01((x - SLOPE.x0) / (SLOPE.x1 - SLOPE.x0)));

const TREES = (() => {
  const r = rng(58);
  return Array.from({ length: 70 }, () => {
    const x = SLOPE.x0 + 4 + r() * (SLOPE.x1 - SLOPE.x0 - 6);
    return { x, y: slopeY(x) - 1 - r() * 3, h: 5 + Math.floor(r() * 4) };
  });
})();

export type BayOpts = {
  t: number;
  frame: number;
  surge: number;
  reached: number;
  slide: number;
  shake?: number;
};

// Side view of a steep Alaskan bay: rock wall on the left, forested slope on the right.
// `surge` is the current wave height up the slope and `reached` the highest point so far
// (trees below it are stripped away), both in [0, 1] of the slope height.
export const drawBay = (buf: Buf, o: BayOpts) => {
  buf.gradient(ramp(["#152a6e", "#2c55b0", "#6f9ee0", "#b8d4f2"]), 0, WATER_Y);
  const far = [hex("#3a4a8a"), hex("#5d6aa8"), hex("#f4f1e8")];
  for (let x = 0; x < W; x += PX) {
    const peak = 132 + 16 * Math.sin(x / 15 + 1.3) + 7 * Math.sin(x / 6);
    for (let y = Math.floor(peak); y < WATER_Y; y += PX) buf.dot(x, y, y < peak + 4 ? far[2] : far[dither(x, y, 1 - (y - peak) / 90, 2)]);
  }
  const rock = ramp(["#1c1830", "#3a3550", "#5d5878", "#8a85a0"]);
  const cliffEdge = (y: number) => 34 + 10 * Math.sin(y / 9) + (y < 120 ? 0 : (y - 120) * 0.15);
  const missing = o.slide;
  for (let y = 40; y < H; y += PX)
    for (let x = 0; x < cliffEdge(y); x += PX) {
      const scar = missing > 0 && y > 70 && y < 150 && x > cliffEdge(y) - 16 * missing;
      buf.dot(x, y, scar ? rock[3] : rock[dither(x, y, clamp01(0.3 + noise3(x * 0.2, y * 0.2, 0) * 0.6 - x / 200), rock.length)]);
    }
  const soil = hex("#6b4a2e"), bare = hex("#8f6a40"), grass = ramp(["#1b4a2a", "#2f7a3a", "#4fa84a"]);
  const reachedY = lerp(WATER_Y, SLOPE.y1, o.reached);
  const forest = ramp(["#0b2414", "#163f22", "#24622e", "#3a8a44"]);
  for (let x = SLOPE.x0; x < W; x += PX) {
    const top = slopeY(x);
    for (let y = Math.floor(top); y < H; y += PX) {
      const depth = y - top;
      if (top > reachedY - 2) buf.dot(x, y, depth < 2 ? bare : soil);
      else {
        const canopy = noise3(x * 0.35, y * 0.35, 1) * 0.6 + 0.4 - depth / 260;
        buf.dot(x, y, depth < 2 ? grass[2] : forest[dither(x, y, clamp01(canopy), forest.length)]);
      }
    }
  }
  const tree = ramp(["#0e2e1a", "#1f5a2e", "#3a8a44"]);
  TREES.forEach((tr) => {
    if (tr.y > reachedY) return;
    for (let j = 0; j < tr.h; j++) {
      const half = Math.floor((j / tr.h) * 3);
      for (let i = -half; i <= half; i++) buf.put(tr.x + i, tr.y - tr.h + j, tree[dither(Math.floor(tr.x + i), Math.floor(tr.y + j), 0.4 + i * 0.1, tree.length)]);
    }
  });
  for (let y = WATER_Y; y < H; y += PX)
    for (let x = Math.floor(cliffEdge(y)); x < SLOPE.x0 + (y - WATER_Y) * 0.4; x += PX)
      buf.dot(x, y, R.cold[dither(x, y, clamp01(0.85 - (y - WATER_Y) / 110), R.cold.length)]);
  const foam = hex(P.white), water = R.cold;
  if (o.surge > 0.01) {
    // A sheet of water running up the slope: thick near the bay, thinning towards the run-up line.
    const xs = lerp(SLOPE.x0, SLOPE.x1, o.surge);
    const x0 = SLOPE.x0 - 40;
    for (let x = x0; x < Math.min(W, xs + 2); x += PX) {
      const ground = x < SLOPE.x0 ? WATER_Y : slopeY(x);
      const u = clamp01((x - x0) / Math.max(1, xs - x0));
      const thick = 5 + 34 * Math.sin(Math.min(1, u * 1.6) * Math.PI * 0.5) * (1 - u) + 6 * (1 - u);
      const top = ground - thick + Math.sin(x / 3 + o.t * 12) * 1.5;
      for (let y = Math.floor(top); y < ground + 2; y += PX)
        buf.dot(x, y, y < top + 2 ? foam : water[dither(x, y, 0.8 - (y - top) / 60, water.length)]);
    }
  }
  if (o.slide > 0 && o.slide < 1) {
    const fy = lerp(90, WATER_Y, o.slide * o.slide);
    const r = rng(9);
    for (let i = 0; i < 40; i++) buf.rect(30 + r() * 26, fy + r() * 24 - 12, 3, 3, rock[1 + Math.floor(r() * 3)]);
  }
};

// Bricks for the bathtub metaphor.
export const drawBrick = (buf: Buf, x: number, y: number) => {
  const red = ramp(["#5a1a24", "#9a2e2e", "#c85a3a"]);
  for (let j = 0; j < 12; j++)
    for (let i = 0; i < 22; i++) {
      const seam = j === 5 || ((i + (j < 5 ? 0 : 5)) % 11 === 0);
      buf.put(x + i, y + j, seam ? hex("#3a1418") : red[dither(Math.floor(x + i), Math.floor(y + j), 0.5 + (11 - j) / 30, red.length)]);
    }
};
