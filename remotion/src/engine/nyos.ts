import { Buf, H, RGB, W, clamp01, hex, lerp, noise3, ramp, smoothstep } from "./pixel";
import { Camera, cover, fineStars, mix, pick, shadeAll, toWorld } from "./fine";

// Lake Nyos, Cameroon (ep005): a crater lake on a hill above a valley village, seen from the side.

const NIGHT_SKY = ramp(["#060818", "#0c1030", "#1a1748", "#2c2058"]);
const DAWN_SKY = ramp(["#2a2a6a", "#6a3f88", "#d0607a", "#ffa070", "#ffd8a0"]);
const FAR = ramp(["#141a3c", "#1f2a52", "#2d3c68"]);
const HILL = ramp(["#06120f", "#0c2018", "#163322", "#22492c", "#3a6a3a"]);
const HILL_DAY = ramp(["#1d3a26", "#2f5a34", "#4a7f42", "#6fa650", "#a8cf70"]);
const LAKE = ramp(["#03101a", "#08232e", "#103a44", "#1d5a60"]);
const LAKE_DAY = ramp(["#1d4a6a", "#2f6f8f", "#5aa0b8", "#9fd0dc"]);
const MIST = ramp(["#4f7a78", "#86b0a8", "#c4e4da"]);
const WALL = ramp(["#2a1e2a", "#4a3440", "#6a4c50"]);
const WALL_DAY = ramp(["#8a6a50", "#b08a62", "#d8b07a"]);
const ROOF = ramp(["#1a0e14", "#3a1e22", "#5a2e2a"]);
const ROOF_DAY = ramp(["#6a2e22", "#9a4a2e", "#c86a3a"]);
const WINDOW = hex("#ffd23f");
const WINDOW_GLOW = hex("#ff8a3d");
const JET = ramp(["#9ad4ff", "#e6f6ff", "#ffffff"]);

export const LAKE_C = { x: 52, y: 154, rx: 38, ry: 8 };
const RIM = 94;
const FLOOR_X = 168;

export const groundY = (wx: number) => {
  if (wx < RIM) return 145 + 2 * Math.sin(wx / 7) + Math.sin(wx / 2.3) * 0.6;
  if (wx < FLOOR_X) {
    const u = (wx - RIM) / (FLOOR_X - RIM);
    return 145 + 103 * (u * u * (3 - 2 * u)) + Math.sin(wx / 4) * 0.8;
  }
  return 248 + 2 * Math.sin(wx / 9);
};

export const HOUSES = [112, 126, 140, 158, 172, 186, 199, 213, 228].map((x, i) => ({ x, w: 9 + (i % 3), h: 7 + ((i * 5) % 3) }));

const TREES = Array.from({ length: 46 }, (_, i) => {
  const x = -30 + i * 6.3 + 3 * Math.sin(i * 7.7);
  return { x, h: 6 + ((i * 7) % 5), w: 2.4 + ((i * 3) % 3) * 0.5 };
}).filter((tr) => Math.abs(tr.x - LAKE_C.x) > LAKE_C.rx + 3 && !HOUSES.some((h) => tr.x > h.x - 3 && tr.x < h.x + h.w + 3));
const TREE = ramp(["#030a08", "#0a1a12", "#14301e"]);
const TREE_DAY = ramp(["#123020", "#1f4a2a", "#2f6a36"]);

export type NyosOpts = {
  t: number;
  cam: Camera;
  bulge?: number;
  cloud?: number;
  dark?: number;
  dawn?: number;
  fountain?: number;
  erupt?: number;
};

const mistFront = (cloud: number) => lerp(RIM + 4, 250, cloud);

const mistAt = (o: NyosOpts, wx: number, wy: number) => {
  const t = o.t, cloud = o.cloud ?? 0, bulge = o.bulge ?? 0, erupt = o.erupt ?? 0;
  let a = 0;
  const domeR = 30 * bulge + 8 * erupt;
  if (domeR > 0.5) {
    const dy = (wy - (LAKE_C.y - 6 * bulge - 12 * erupt)) / (domeR * (0.45 + erupt * 0.5));
    const dx = (wx - LAKE_C.x) / (domeR * 1.4);
    const d = dx * dx + dy * dy;
    if (d < 1) a = Math.max(a, (1 - d) * 1.3);
  }
  if (cloud > 0) {
    const front = mistFront(cloud);
    const x0 = LAKE_C.x - LAKE_C.rx * 0.6;
    if (wx > x0 - 10 && wx < front + 4) {
      const g = wx < RIM ? 150 : groundY(wx) + 2;
      const thick = 26 + 14 * noise3(wx * 0.06 - t * 0.5, t * 0.3, 2) + 5 * Math.sin(wx / 9 - t * 2);
      const h = g - wy;
      const k = smoothstep(thick, thick * 0.25, h) * smoothstep(-6, 2, h) * smoothstep(front + 4, front - 20, wx) * smoothstep(x0 - 10, x0 + 18, wx);
      a = Math.max(a, k * 0.85);
      const hd = Math.hypot((wx - front + 8) / 20, (wy - groundY(front) + 12) / 18);
      if (front > RIM && hd < 1) a = Math.max(a, (1 - hd) * 1.1);
    }
  }
  if (a <= 0) return 0;
  return clamp01(a * (0.2 + 1.1 * noise3(wx * 0.12 - t * 1.4, wy * 0.18, t * 0.35)));
};

// Whole scene; the camera zooms and pans over it, so every layer is shaded per pixel.
export const drawNyos = (buf: Buf, o: NyosOpts) => {
  const { t, cam } = o;
  const dawn = o.dawn ?? 0, dark = o.dark ?? 0, fountain = o.fountain ?? 0;
  const sky = (x: number, y: number) => {
    const v = clamp01(y / 200);
    return dawn > 0.5 ? pick(DAWN_SKY, x, y, v * 1.05) : pick(NIGHT_SKY, x, y, v + 0.05);
  };
  const front = mistFront(o.cloud ?? 0);
  shadeAll(buf, (sx, sy) => {
    const { x: wx, y: wy } = toWorld(cam, sx, sy);
    const farZoom = 1 + (cam.zoom - 1) * 0.3;
    const fx = cam.x * 0.5 + (sx - W / 2) / farZoom, fy = cam.y + (sy - H / 2) / farZoom;
    const farTop = 132 + 9 * Math.sin(fx / 17 + 1) + 4 * Math.sin(fx / 7);
    let col: RGB = sky(sx, sy);
    if (fy > farTop) col = pick(dawn > 0.5 ? ramp(["#4a3a6a", "#6a4f7a", "#8a6a8a"]) : FAR, sx, sy, 0.8 - (fy - farTop) / 60);
    const g = groundY(wx);
    if (wy >= g) {
      const depth = wy - g;
      const lit = clamp01(0.75 - depth / 70 + noise3(wx * 0.3, wy * 0.3, 1) * 0.35);
      col = pick(dawn > 0.5 ? HILL_DAY : HILL, sx, sy, depth < 1.2 ? 0.95 : lit);
      if (depth > 5) {
        const cx = Math.floor(wx / 6), cy = Math.floor(wy / 7);
        const r = Math.abs(Math.sin(cx * 12.9898 + cy * 78.233) * 43758.5453) % 1;
        const tx = cx * 6 + 1 + r * 4, ty = cy * 7 + 6;
        const u = (ty - wy) / 6;
        if (r < 0.62 && u >= 0 && u <= 1 && Math.abs(wx - tx) < 2.4 * (1 - u) + 0.3)
          col = pick(dawn > 0.5 ? TREE_DAY : TREE, sx, sy, 0.2 + (tx - wx) * 0.15 + clamp01(0.6 - depth / 120));
      }
      const road = RIM - 2 + (wy - 145) * 0.62 + 7 * Math.sin(wy / 11);
      if (wy > 147 && wy < 252 && Math.abs(wx - road) < 1.3) col = dawn > 0.5 ? hex("#b08a62") : hex("#3a3040");
    }
    const lx = (wx - LAKE_C.x) / LAKE_C.rx, ly = (wy - LAKE_C.y) / LAKE_C.ry;
    const ld = lx * lx + ly * ly;
    if (ld < 1) {
      const swell = (o.bulge ?? 0) * Math.max(0, 1 - ld * 2.2) + (o.erupt ?? 0) * Math.max(0, 1 - ld * 1.5);
      const ripple = 0.5 + 0.5 * Math.sin(wx * 0.9 + wy * 2.4 - t * 2 + Math.sin(wx * 0.2 + t) * 2);
      const v = 0.18 + ripple * 0.22 + swell * 0.7 - ld * 0.15;
      col = pick(dawn > 0.5 ? LAKE_DAY : LAKE, sx, sy, v);
      if (ld > 0.86) col = pick(dawn > 0.5 ? HILL_DAY : HILL, sx, sy, 0.98);
    }
    TREES.forEach((tr) => {
      const base = groundY(tr.x) + 1;
      const u = (base - wy) / tr.h;
      if (u < 0 || u > 1) return;
      if (Math.abs(wx - tr.x) < tr.w * (1 - u) + 0.4) col = pick(dawn > 0.5 ? TREE_DAY : TREE, sx, sy, 0.3 + (tr.x - wx) / tr.w * 0.4 + u * 0.3);
    });
    HOUSES.forEach((h, i) => {
      const hg = groundY(h.x + h.w / 2);
      if (wx < h.x || wx > h.x + h.w || wy > hg + 1) return;
      const roofTop = hg - h.h - 5;
      if (wy < roofTop) return;
      const off = i / HOUSES.length < dark || (o.cloud !== undefined && h.x + 4 < front && dark > 0);
      if (wy < hg - h.h) {
        const half = (h.w / 2 + 1) * ((wy - roofTop) / 5);
        if (Math.abs(wx - (h.x + h.w / 2)) <= half) col = pick(dawn > 0.5 ? ROOF_DAY : ROOF, sx, sy, 0.3 + (wx - h.x) / h.w * 0.6);
        return;
      }
      col = pick(dawn > 0.5 ? WALL_DAY : WALL, sx, sy, 0.3 + (wx - h.x) / h.w * 0.6);
      const win = wx > h.x + 2 && wx < h.x + 5 && wy > hg - h.h + 2 && wy < hg - h.h + 5;
      const door = wx > h.x + h.w - 4 && wx < h.x + h.w - 1.5 && wy > hg - 5;
      if (win || door) col = dawn > 0.5 ? hex("#2a1e2a") : off ? hex("#0a0810") : win ? WINDOW : WINDOW_GLOW;
    });
    const erupt = o.erupt ?? 0;
    if (erupt > 0) {
      const hgt = 75 * erupt, up = LAKE_C.y - wy;
      const w = 3 + up * 0.22 + 2 * noise3(wy * 0.3 - t * 6, t, 4);
      if (up > -2 && up < hgt && Math.abs(wx - LAKE_C.x) < w) col = pick(JET, sx, sy, 0.3 + 0.7 * noise3(wx * 0.5, wy * 0.4 + t * 12, 1) - up / hgt * 0.3);
    }
    if (fountain > 0) {
      const top = LAKE_C.y - 30 * fountain * (0.92 + 0.08 * Math.sin(t * 9));
      const w = 0.9 + 0.5 * (wy - top) / 30;
      if (Math.abs(wx - LAKE_C.x) < w && wy > top && wy < LAKE_C.y) col = pick(JET, sx, sy, 0.6 + 0.4 * Math.sin(wy * 0.8 - t * 20));
      for (let k = 0; k < 18; k++) {
        const age = (t * 0.9 + k / 18) % 1;
        const dir = (k % 2 ? 1 : -1) * (2 + (k % 5));
        const px = LAKE_C.x + dir * age * 3, py = top + age * age * 30 - age * 4;
        if (Math.abs(wx - px) < 0.5 && Math.abs(wy - py) < 0.5) col = JET[2];
      }
    }
    const m = mistAt(o, wx, wy);
    if (m > 0 && cover(sx, sy, m)) col = pick(MIST, sx, sy, m * 1.2);
    if (sy > 300) {
      const blade = 300 + 8 * noise3(sx * 0.9 + cam.x * 0.8, 1, t * 0.6) + 3 * Math.sin(sx * 2.1);
      if (sy > blade) col = pick(dawn > 0.5 ? ramp(["#0e2416", "#1b3a22"]) : ramp(["#020604", "#06100a"]), sx, sy, (sy - blade) / 20);
    }
    return col;
  });
  if (dawn < 0.5) fineStars(buf, t, 120, 120, 11);
};

// Geological cut through the crater: magma 80 km down, gas rising through cracks, a dense gas
// layer at the lake bottom, and (optionally) the giant bubble breaking out.
const ROCK = ramp(["#120a1a", "#24142a", "#3a2234", "#55303a", "#6e4440"]);
const MAGMA = ramp(["#5a0a18", "#b0201e", "#ff5a2a", "#ffb347", "#fff2b0"]);
const WATER = ramp(["#05202c", "#0a3646", "#145462", "#2a7a80"]);
const GAS = ramp(["#1a0e32", "#2e1a52", "#4a2c74"]);

export const CRACKS = [-22, 2, 26].map((dx, i) => (wy: number) => 90 + dx * (wy - 150) / 480 + 6 * Math.sin(wy / (13 + i * 4) + i * 2) + 3 * Math.sin(wy / 5 + i));

export type GeoOpts = { t: number; camY: number; gas: number; bubble?: number };

export const drawGeoCut = (buf: Buf, o: GeoOpts) => {
  const { t, camY, gas } = o;
  const bubble = o.bubble ?? 0;
  const lakeTop = 92, bowl = (wx: number) => 92 + 52 * Math.sqrt(Math.max(0, 1 - ((wx - 90) / 66) ** 2));
  const gasTop = (wx: number) => lerp(bowl(wx), lakeTop + 10, gas * 0.75) + Math.sin(wx / 6 + t) * 1.2;
  shadeAll(buf, (sx, sy) => {
    const wx = sx, wy = camY + (sy - H / 2);
    if (wy < 70) return pick(NIGHT_SKY, sx, sy, (wy - camY + 160) / 140);
    const surf = 70 + 4 * Math.sin(wx / 9);
    const inBowl = Math.abs(wx - 90) < 66 && wy < bowl(wx);
    if (wy < surf && !inBowl) return pick(NIGHT_SKY, sx, sy, 0.7);
    if (inBowl && wy < lakeTop) return pick(NIGHT_SKY, sx, sy, 0.75);
    if (inBowl) {
      let c = pick(WATER, sx, sy, 0.75 - (wy - lakeTop) / 80);
      if (wy > gasTop(wx)) {
        c = pick(GAS, sx, sy, 0.5 + 0.4 * noise3(wx * 0.2, wy * 0.2 - t, t));
        if (noise3(wx * 1.3, wy * 1.3 + t * 3, 5) > 0.82) c = hex("#9a7ad0");
      }
      if (bubble > 0) {
        const by = lerp(bowl(90) - 6, lakeTop - 30, bubble * bubble), br = 10 + 22 * bubble;
        const d = Math.hypot(wx - 90, (wy - by) * 1.2) / br;
        if (d < 1) c = pick(MIST, sx, sy, 1.1 - d * 0.9 - (wx - 90 + wy - by) / (br * 4));
      }
      return c;
    }
    const band = Math.floor((wy + 6 * Math.sin(wx / 23) + 4 * noise3(wx * 0.05, wy * 0.05, 0)) / 26);
    let c = pick(ROCK, sx, sy, 0.55 - (band % 3) * 0.12 - (wy - 100) / 1400 + noise3(wx * 0.25, wy * 0.25, 3) * 0.3);
    if (wy < surf + 2) c = hex("#2f5a34");
    const md = Math.hypot((wx - 90) / 70, (wy - 640) / 34);
    if (md < 1.6) {
      const heat = clamp01(1.25 - md) + noise3(wx * 0.15, wy * 0.15, t * 0.5) * 0.35;
      if (md < 1) c = pick(MAGMA, sx, sy, heat);
      else if (cover(sx, sy, (1.6 - md) * 0.8)) c = MAGMA[1];
    }
    CRACKS.forEach((cx) => {
      if (wy > 140 && wy < 620 && Math.abs(wx - cx(wy)) < 1.1) c = mix(c, hex("#ff8a3d"), clamp01((wy - 400) / 260) * 0.8);
      else if (wy > 140 && wy < 620 && Math.abs(wx - cx(wy)) < 1.8) c = hex("#0a0610");
    });
    return c;
  });
  const bub = hex("#c9b8ff");
  CRACKS.forEach((cx, i) => {
    for (let k = 0; k < 9; k++) {
      const wy = 610 - (((t * 55 + k * 53 + i * 31) % 470));
      const sy = wy - camY + H / 2;
      if (sy < -2 || sy > H + 2) continue;
      buf.dot(cx(wy), sy, bub);
      buf.dot(cx(wy) + 0.5, sy, bub);
      buf.dot(cx(wy), sy + 0.5, bub);
    }
  });
};

// Soda bottle metaphor: gas packed in the liquid; `pop` blows the cap off and foam erupts.
const GLASS = ramp(["#0e3a22", "#1d6a3a", "#3fa060", "#9fe0b0"]);
const SODA = ramp(["#3a1a0a", "#6a3214", "#9a5220", "#c8783a"]);
const FOAM = ramp(["#c8b8a0", "#f0e6d4", "#ffffff"]);
const WALLPAPER = ramp(["#1a1030", "#24163e", "#2e1c4c"]);
const TABLE = ramp(["#2a140c", "#4a2412", "#6a3818", "#8a4c22"]);

const halfWidth = (y: number) => {
  if (y < 72 || y > 252) return 0;
  if (y < 96) return 7;
  if (y < 122) return lerp(7, 22, smoothstep(96, 122, y));
  if (y > 246) return lerp(22, 18, (y - 246) / 6);
  return 22;
};

export const drawSoda = (buf: Buf, t: number, pressure: number, pop: number, cam: Camera = { x: W / 2, y: H / 2, zoom: 1 }) => {
  const cx = 90;
  shadeAll(buf, (sx, sy) => {
    const { x, y } = toWorld(cam, sx, sy);
    let c = pick(WALLPAPER, sx, sy, 0.4 + 0.25 * Math.sin(x / 3) * (Math.floor(x / 12) % 2 ? 1 : 0) + 0.2 * (1 - Math.abs(x - 90) / 120));
    if (y > 252) c = pick(TABLE, sx, sy, 0.8 - (y - 252) / 90 + 0.12 * Math.sin(x / 6 + y / 30));
    if (y > 252 && y < 256) c = TABLE[3];
    const sh = Math.hypot((x - cx - 6) / 34, (y - 256) / 5);
    if (y > 252 && sh < 1 && cover(sx, sy, 0.8)) c = hex("#12080a");
    const hw = halfWidth(y);
    if (hw > 0 && Math.abs(x - cx) < hw) {
      const u = (x - cx) / hw;
      const light = 0.55 - u * 0.35 + (u < -0.55 && u > -0.75 ? 0.5 : 0);
      const liquidTop = lerp(100, 116, pop);
      if (y > liquidTop) {
        c = pick(SODA, sx, sy, light * 0.9);
        const pack = pressure * smoothstep(liquidTop, 250, y);
        if (noise3(x * 1.1, y * 1.1 + t * (pop > 0 ? 18 : 2), t) > 1 - pack * 0.4) c = FOAM[1];
      } else c = pick(GLASS, sx, sy, light * 0.6);
      if (Math.abs(u) > 0.88) c = pick(GLASS, sx, sy, light);
    }
    return c;
  });
  const capY = lerp(66, -40, smoothstep(0, 0.35, pop)), capRot = pop * 9;
  shadeAll(buf, (sx, sy) => {
    const { x, y } = toWorld(cam, sx, sy);
    return Math.abs(x - cx - Math.sin(capRot) * 2) < 8 && y > capY && y < capY + 6 ? pick(ramp(["#8a1020", "#d0303a", "#ff6a6a"]), sx, sy, 0.8 - (x - cx + 8) / 20) : null;
  });
  if (pop > 0) {
    const h = 150 * smoothstep(0, 0.5, pop);
    shadeAll(buf, (sx, sy) => {
      const { x, y } = toWorld(cam, sx, sy);
      const top = 72 - h;
      if (y < top || y > 76) return null;
      const w = 6 + (72 - y) * 0.18 + 3 * noise3(x * 0.3, y * 0.2 - t * 8, t);
      return Math.abs(x - cx) < w ? pick(FOAM, sx, sy, 0.4 + noise3(x * 0.5, y * 0.4 - t * 10, 2) * 0.7) : null;
    });
  }
};
