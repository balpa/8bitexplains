import { Buf, H, PX, RGB, W, clamp01, fbm, hex, lerp, noise3, ramp, rng, smoothstep } from "./pixel";
import { Bolt, Camera, cover, drawBolt, drawFire, drawRings, fineLine, glow, makeBolt, mix, pick, shadeAll, toScreen, toWorld } from "./fine";

// Lightning (ep007): a night prairie under a storm, the inside of the cloud, a balloon
// metaphor and a close-up of the white-hot channel.

const STORM = ramp(["#07060e", "#0e0c1c", "#18162c", "#26223e", "#3a3456"]);
const SKY = ramp(["#0a0a1a", "#121630", "#1c2244", "#2a2c50"]);
const HILLS = ramp(["#0a0c18", "#121628"]);
const GRASS = ramp(["#050806", "#0a120c", "#121e14", "#1c2c1c", "#2a3e26"]);
const FLASH = hex("#d8d4ff");
const CANOPY = ramp(["#04080a", "#0a1612", "#12241a", "#1c3424"]);
const TRUNK = ramp(["#0a0606", "#1a100c", "#2a1a12"]);
const HOUSE = ramp(["#0e0a10", "#1a1420", "#2a2030"]);
const WARM = hex("#ffd23f");

export const TREE = { x: 124, base: 236, h: 52 };
export const HOUSE_BOX = { x0: 20, x1: 62, y0: 212, y1: 242 };

const groundY = (x: number) => 222 + 4 * Math.sin(x / 30 + 1) + 2 * Math.sin(x / 11);

export type PrairieOpts = {
  t: number;
  cam?: Camera;
  flash?: number;
  rain?: number;
  treeFire?: number;
  forest?: number;
  door?: number;
  window?: number;
};

const FOREST = Array.from({ length: 34 }, (_, i) => ({ x: -10 + i * 6 + 2 * Math.sin(i * 5.1), h: 14 + ((i * 7) % 9) }));

export const drawPrairie = (buf: Buf, o: PrairieOpts) => {
  const { t } = o;
  const cam = o.cam ?? { x: W / 2, y: H / 2, zoom: 1 };
  const flash = o.flash ?? 0, forest = o.forest ?? 0;
  shadeAll(buf, (sx, sy) => {
    const { x, y } = toWorld(cam, sx, sy);
    const base = 96 + 14 * fbm(x * 0.02 + t * 0.05, 3, t * 0.1);
    let c: RGB;
    if (y < base) {
      const n = fbm(x * 0.03 + t * 0.04, y * 0.05, t * 0.15);
      const inner = flash * clamp01(1 - Math.hypot(x - 110, y - 70) / 140);
      c = pick(STORM, sx, sy, 0.15 + n * 0.45 + (y - base + 60) / 300 + inner * 0.9);
    } else {
      c = pick(SKY, sx, sy, (y - base) / 120 + flash * 0.4);
      const hill = 204 + 6 * Math.sin(x / 19) + 3 * Math.sin(x / 7);
      if (y > hill) c = pick(HILLS, sx, sy, 0.5 + flash * 0.5);
      if (forest > 0) {
        FOREST.forEach((f) => {
          const u = (groundY(f.x) - y) / f.h;
          if (u >= 0 && u <= 1 && Math.abs(x - f.x) < 3.4 * (1 - u) + 0.4) c = pick(CANOPY, sx, sy, 0.3 + (f.x - x) * 0.08 + flash * 0.6);
        });
      }
      if (y > groundY(x)) {
        const blade = Math.sin(x * 2.3 + noise3(x * 0.1, y * 0.2, t * 0.5) * 6 + t * 2) > 0.3;
        c = pick(GRASS, sx, sy, 0.15 + (y - 222) / 180 + (blade ? 0.25 : 0) + flash * 0.6);
      }
    }
    if (!forest) {
      const ty = TREE.base - TREE.h;
      const trunk = Math.abs(x - TREE.x - (y - TREE.base) * 0.05) < 2.2 - (TREE.base - y) * 0.02 && y > ty + 18 && y < TREE.base + 2;
      const canopy = Math.hypot((x - TREE.x) / 26, (y - ty - 14) / 18) < 0.85 + 0.25 * noise3(x * 0.18, y * 0.18, 4);
      if (canopy) c = pick(CANOPY, sx, sy, 0.35 + noise3(x * 0.3, y * 0.3, 1) * 0.4 - (x - TREE.x) / 80 + flash * 0.7);
      else if (trunk) c = pick(TRUNK, sx, sy, 0.4 + flash * 0.6);
      const hb = HOUSE_BOX;
      if (x > hb.x0 && x < hb.x1 && y > hb.y0 && y < hb.y1) {
        c = pick(HOUSE, sx, sy, 0.4 + (x - hb.x0) / 80 + flash * 0.6);
        const win = x > hb.x0 + 6 && x < hb.x0 + 14 && y > hb.y0 + 8 && y < hb.y0 + 16 && (o.window ?? 1) > 0;
        const door = x > hb.x1 - 14 && x < hb.x1 - 6 && y > hb.y1 - 16;
        if (win) c = Math.abs(x - hb.x0 - 10) < 0.5 || Math.abs(y - hb.y0 - 12) < 0.5 ? HOUSE[0] : WARM;
        if (door) c = (o.door ?? 0) > 0 ? hex("#ffb347") : HOUSE[0];
      }
      const roofH = 14;
      const ry = hb.y0 - y;
      if (ry > 0 && ry < roofH && Math.abs(x - (hb.x0 + hb.x1) / 2) < (hb.x1 - hb.x0) / 2 + 4 - ry * 1.7) c = pick(HOUSE, sx, sy, 0.15 + flash * 0.5);
    }
    if (flash > 0.02) c = mix(c, FLASH, flash * 0.35);
    return c;
  });
  const rain = o.rain ?? 0;
  if (rain > 0) {
    const r = rng(3);
    const drop = hex("#5a6a9a");
    for (let i = 0; i < 160 * rain; i++) {
      const x0 = r() * (W + 40), sp = 140 + r() * 60;
      const y = ((r() * H + t * sp) % (H + 20)) - 10, x = x0 - (y / H) * 30;
      fineLine(buf, x, y, x - 1.2, y + 5, drop, PX);
    }
  }
  if (o.treeFire) {
    const p = toScreen(cam, TREE.x, TREE.base - TREE.h + 14);
    drawFire(buf, t, p.x - 18 * cam.zoom, p.x + 18 * cam.zoom, (x) => p.y + 8 * cam.zoom + Math.sin(x * 0.3) * 2, 22 * cam.zoom * o.treeFire, 1);
    glow(buf, p.x, p.y, 40 * cam.zoom, hex("#ff8a3d"), 0.35 * o.treeFire);
  }
  if (forest > 0) {
    drawFire(buf, t, -4, W + 4, (x) => groundY(x) + 1, 34 * forest, 1.05);
    glow(buf, 90, 210, 120, hex("#ff5a2a"), 0.25 * forest);
    const smoke = [hex("#2a2030"), hex("#3a2e3a")];
    shadeAll(buf, (x, y) => {
      const n = fbm(x * 0.03, y * 0.04 + t * 0.4, t * 0.2);
      return y < 190 && n > 0.55 && cover(x, y, (n - 0.55) * 3 * forest * (y / 190)) ? smoke[n > 0.65 ? 1 : 0] : null;
    }, 0, 60, W, 190);
  }
};

export const strikeBolt = (seed: number, x1 = TREE.x, y1 = TREE.base - TREE.h + 4, x0 = 104): Bolt => makeBolt(seed, x0, 100, x1, y1, 9, 4);

export const drawStrike = (buf: Buf, bolt: Bolt, reach: number, cam?: Camera) => {
  const c = cam ?? { x: W / 2, y: H / 2, zoom: 1 };
  const b: Bolt = { pts: bolt.pts.map(([x, y]) => [toScreen(c, x, y).x, toScreen(c, x, y).y]), branches: bolt.branches.map((s) => s.map(([x, y]) => [toScreen(c, x, y).x, toScreen(c, x, y).y] as [number, number])) };
  drawBolt(buf, b, reach, hex("#9a8aff"), hex("#ffffff"), 1.6 * c.zoom);
};

// Inside the thundercloud: light ice (positive) rises, heavy hail (negative) sinks.
const CLOUD_IN = ramp(["#141626", "#24283e", "#383c58", "#545a78", "#7a809e"]);

export const drawCloudInside = (buf: Buf, t: number, smash: number, sep: number) => {
  shadeAll(buf, (x, y) => {
    const n = fbm(x * 0.025, y * 0.025 + t * 0.25, t * 0.1);
    let c = pick(CLOUD_IN, x, y, 0.2 + n * 0.7 - y / 900);
    if (sep > 0) {
      const top = smoothstep(150, 40, y) * sep, bottom = smoothstep(170, 290, y) * sep;
      c = mix(c, hex("#ff5a6a"), top * 0.25);
      c = mix(c, hex("#3a8aff"), bottom * 0.3);
    }
    return c;
  });
  const r = rng(17);
  const plus = hex("#ff6a7a"), minus = hex("#6ab0ff");
  for (let i = 0; i < 46; i++) {
    const ice = i % 2 === 0;
    const x0 = r() * W, y0 = r() * H, ph = r() * 6.28;
    const drift = ice ? -sep * 140 : sep * 120;
    let y = y0 + drift * (0.5 + 0.5 * r()) + Math.sin(t * 2 + ph) * 6 * (1 - sep);
    y = ((y % (H + 40)) + H + 40) % (H + 40) - 20;
    if (ice) y = lerp(y, 30 + (y0 / H) * 110, sep);
    else y = lerp(y, 190 + (y0 / H) * 110, sep);
    const x = x0 + Math.sin(t * 1.5 + ph) * 8;
    if (ice) {
      for (let k = -2; k <= 2; k += PX) {
        buf.dot(x + k, y, hex("#e6f0ff"));
        buf.dot(x, y + k, hex("#e6f0ff"));
        buf.dot(x + k * 0.7, y + k * 0.7, hex("#b0c8f0"));
        buf.dot(x - k * 0.7, y + k * 0.7, hex("#b0c8f0"));
      }
      if (sep > 0.3) {
        for (let k = -1.5; k <= 1.5; k += PX) {
          buf.dot(x + 5 + k, y - 5, plus);
          buf.dot(x + 5, y - 5 + k, plus);
        }
      }
    } else {
      shadeAll(buf, (px, py) => {
        const d = Math.hypot(px - x, py - y) / 4.5;
        return d < 1 ? pick(ramp(["#4a5070", "#8a90b0", "#d0d6ec"]), px, py, 0.9 - d * 0.5 - (px - x + py - y) / 12) : null;
      }, x - 5, y - 5, x + 6, y + 6);
      if (sep > 0.3) for (let k = -1.5; k <= 1.5; k += PX) buf.dot(x + 7 + k, y - 6, minus);
      // Grumpy hail (L28 faces on things): two eyes and a frown once the charges split.
      if (sep > 0.3 && i % 4 === 1) {
        const ink = hex("#05040f");
        buf.dot(x - 1.5, y - 0.5, ink); buf.dot(x + 1, y - 0.5, ink);
        buf.dot(x - 2, y - 1.5, ink); buf.dot(x + 1.5, y - 1.5, ink);
        buf.dot(x - 0.5, y + 1.5, ink); buf.dot(x, y + 1.5, ink);
      }
    }
  }
  if (smash > 0) {
    for (let k = 0; k < 7; k++) {
      if (Math.floor(t * 10 + k * 3) % 4 !== 0) continue;
      const x = 20 + ((k * 53 + Math.floor(t * 10) * 17) % 140), y = 60 + ((k * 37 + Math.floor(t * 10) * 29) % 200);
      glow(buf, x, y, 8, hex("#ffffff"), smash);
      buf.dot(x, y, hex("#ffffff"));
    }
  }
};

// Balloon metaphor: a balloon pops and its air bursts outward as a ring of pressure.
const BALLOON = ramp(["#5a0a1a", "#a01a2a", "#e0303a", "#ff7a7a", "#ffd0d0"]);

export const drawBalloon = (buf: Buf, t: number, pop: number, grow = 1) => {
  const cx = 90 + Math.sin(t * 1.3) * 3, cy = 150 + Math.sin(t * 0.9) * 2, r = lerp(22, 36, grow);
  shadeAll(buf, (x, y) => {
    const d = Math.hypot(x - 90, y - 120) / 220;
    return pick(ramp(["#05040f", "#100a24", "#1c1238", "#2c1c4c"]), x, y, 0.7 - d + (y > 250 ? -0.2 : 0));
  });
  if (pop <= 0) {
    shadeAll(buf, (x, y) => {
      const nx = (x - cx) / r, ny = (y - cy) / (r * 1.15);
      const d = nx * nx + ny * ny;
      if (d > 1) return null;
      const nz = Math.sqrt(1 - d);
      const light = clamp01(0.25 + 0.75 * (-nx * 0.5 - ny * 0.6 + nz * 0.6));
      const spec = Math.hypot(nx + 0.38, ny + 0.45) < 0.16;
      return spec ? BALLOON[4] : pick(BALLOON, x, y, light);
    }, cx - r, cy - r * 1.2, cx + r + 1, cy + r * 1.2);
    fineLine(buf, cx - 3, cy + r * 1.15, cx + 3, cy + r * 1.15, BALLOON[1], 2.4);
    // The balloon watches the spark coming, eyes widening (L28 faces on things).
    const fear = smoothstep(0.6, 1, grow), ink = hex("#05040f"), white = hex("#f4f1e8");
    for (const dx of [-7, 5]) {
      buf.rect(cx + dx, cy - 6, 3, 3 + Math.round(fear * 2), white);
      buf.put(cx + dx + 1 - Math.round(fear), cy - 5 + Math.round(fear), ink);
    }
    if (fear > 0.5) buf.rect(cx + 14, cy - 10 + ((t * 20) % 6), 1, 2, hex("#3ee0ff"));
    for (let y = cy + r * 1.18; y < 300; y += PX) buf.dot(cx + Math.sin(y / 9 + t * 2) * 3, y, hex("#c8c0d8"));
    if (grow > 0.75) {
      const k = (grow - 0.75) / 0.25;
      const sx = lerp(-4, cx - r - 2, k), sy = cy - 6;
      drawBolt(buf, makeBolt(Math.floor(t * 14), sx - 30, sy + 10, sx, sy, 3, 1), 1, hex("#9a8aff"), hex("#ffffff"), 1);
      glow(buf, sx, sy, 10, hex("#d8d4ff"), 0.8);
    }
    return;
  }
  const rr = rng(8);
  for (let i = 0; i < 22; i++) {
    const a = rr() * Math.PI * 2, sp = 40 + rr() * 90;
    const x = cx + Math.cos(a) * sp * pop, y = cy + Math.sin(a) * sp * pop + pop * pop * 60;
    fineLine(buf, x, y, x + Math.cos(a + 1.3) * 4, y + Math.sin(a + 1.3) * 4, BALLOON[2 + (i % 2)], 1.6);
  }
  drawRings(buf, cx, cy, pop * 1.6, hex("#ffffff"), 140, 3);
  drawRings(buf, cx, cy, Math.max(0, pop * 1.6 - 0.15), hex("#9a8aff"), 140, 3);
  glow(buf, cx, cy, 60 * (1 - pop), hex("#ffe8a0"), 1 - pop);
};

// Extreme close-up of a lightning channel next to the Sun for scale of heat.
export const drawChannel = (buf: Buf, t: number, heat: number, sunK: number, cam: Camera = { x: W / 2, y: H / 2, zoom: 1 }) => {
  shadeAll(buf, (sx, sy) => {
    const { x, y } = toWorld(cam, sx, sy);
    return pick(ramp(["#05030c", "#0e0820", "#1a0e34", "#2a1448"]), sx, sy, 0.25 + 0.5 * clamp01(1 - Math.abs(x - 30) / 120) * heat + noise3(x * 0.05, y * 0.05, t) * 0.15);
  });
  const path = (y: number) => 30 + 6 * Math.sin(y / 23 + 1) + 3 * Math.sin(y / 7 + t * 0.5) + 2 * noise3(y * 0.2, t * 3, 1);
  shadeAll(buf, (sx, sy) => {
    const { x, y } = toWorld(cam, sx, sy);
    const d = Math.abs(x - path(y));
    const shimmer = 2 * Math.sin(y * 0.6 - t * 14) * heat;
    if (d < 2.4) return hex("#ffffff");
    if (d < 5) return pick(ramp(["#9ad4ff", "#e6f6ff"]), sx, sy, 1 - (d - 2.4) / 2.6);
    if (d < 18 + shimmer) return cover(sx, sy, (1 - d / 20) * heat) ? (d < 10 ? hex("#b8a0ff") : hex("#6a4ad0")) : null;
    return null;
  });
  if (sunK > 0) {
    const cx = 140, cy = 230, sr = 18;
    shadeAll(buf, (sx, sy) => {
      const { x, y } = toWorld(cam, sx, sy);
      const d = Math.hypot(x - cx, y - cy) / sr;
      if (d < 1) return pick(ramp(["#8f1810", "#d0401a", "#ff7a2a", "#ffb347"]), sx, sy, (0.3 + 0.6 * Math.sqrt(1 - d * d)) * sunK);
      return d < 1.4 && cover(sx, sy, (1.4 - d) * sunK) ? hex("#8f3a1a") : null;
    });
  }
};

export const SHOCK = (buf: Buf, x: number, y: number, t: number) => drawRings(buf, x, y, t, hex("#d8d4ff"), 160, 3, 0.6);

// Heat ladder (L28): a kettle, lava, the Sun and a bolt on bars that grow with their temperature,
// each with a face and its number on a pill. `grow` holds each bar's progress in [0, 1].
const LADDER_BG = ramp(["#2a1648", "#5a2470", "#a8336f", "#e0603e", "#ff9a4a"]);
const BARS = [
  { x: 30, h: 22, label: "212°F", col: ramp(["#1f55b5", "#4fa3ff", "#bfe6ff"]) },
  { x: 70, h: 46, label: "2,000°F", col: ramp(["#8f1f1a", "#e0453a", "#ff8a3d"]) },
  { x: 110, h: 84, label: "10,000°F", col: ramp(["#e08a1a", "#ffd23f", "#fff2b0"]) },
  { x: 150, h: 190, label: "50,000°F", col: ramp(["#6a4ad0", "#b8a0ff", "#ffffff"]) },
];
const BASE = 200;

const eyes = (buf: Buf, x: number, y: number, mood: "sweat" | "smug" | "angry" | "cool") => {
  const ink = hex("#05040f"), white = hex("#f4f1e8");
  if (mood === "cool") {
    buf.rect(x - 6, y, 13, 2, ink);
    buf.rect(x - 6, y + 2, 5, 2, ink);
    buf.rect(x + 2, y + 2, 5, 2, ink);
    buf.put(x - 5, y, white);
    return;
  }
  for (const dx of [-4, 3]) {
    buf.rect(x + dx, y, 2, 2, white);
    buf.put(x + dx + (mood === "smug" ? 1 : 0), y + 1, ink);
  }
  if (mood === "angry") { buf.rect(x - 5, y - 2, 3, 1, ink); buf.rect(x + 4, y - 2, 3, 1, ink); }
  if (mood === "smug") { buf.rect(x - 4, y, 2, 1, ink); buf.rect(x + 3, y, 2, 1, ink); }
};

export const drawLadder = (buf: Buf, t: number, grow: number[], label: (number | null)[], drawNumber: (buf: Buf, text: string, cx: number, cy: number, color?: string, scale?: number) => void) => {
  shadeAll(buf, (x, y) => pick(LADDER_BG, x, y, 0.15 + y / 260 + 0.04 * Math.sin(x / 9 + t * 2)));
  const FLOOR = ramp(["#3a1d5c", "#7a2c6a", "#c04a4e", "#e0703e"]);
  shadeAll(buf, (x, y) => (y >= BASE ? pick(FLOOR, x, y, 0.85 - (y - BASE) / 140 + 0.06 * Math.sin(x / 5)) : null), 0, BASE, W, H);
  BARS.forEach((b, i) => {
    const g = clamp01(grow[i]);
    if (g <= 0) return;
    const top = BASE - b.h * g;
    shadeAll(buf, (x, y) => (Math.abs(x - b.x) < 10 && y >= top && y < BASE ? pick(b.col, x, y, 0.3 + (b.x - x) / -30 + 0.3) : null), b.x - 11, Math.max(0, top), b.x + 11, BASE);
    if (i === 3) glow(buf, b.x, Math.max(10, top), 26, hex("#d8d4ff"), 0.7 * g);
    const oy = Math.max(14, top - 12);
    if (i === 0) {
      buf.rect(b.x - 8, oy - 4, 16, 12, hex("#c9d4f0"));
      buf.rect(b.x + 8, oy - 1, 4, 2, hex("#c9d4f0"));
      buf.rect(b.x - 3, oy - 7, 6, 3, hex("#05040f"));
      for (let k = 0; k < 3; k++) buf.put(b.x - 2 + k * 2 + Math.sin(t * 6 + k) , oy - 10 - ((t * 12 + k * 4) % 8), hex("#f4f1e8"));
      eyes(buf, b.x, oy, "sweat");
      buf.rect(b.x - 9, oy - 2 + ((t * 20) % 6), 1, 2, hex("#3ee0ff"));
    } else if (i === 1) {
      shadeAll(buf, (x, y) => (Math.hypot((x - b.x) / 11, (y - oy) / 8) < 1 ? pick(ramp(["#8f1f1a", "#e0453a", "#ffb347"]), x, y, 0.8 - (y - oy) / 16) : null), b.x - 12, oy - 9, b.x + 12, oy + 9);
      eyes(buf, b.x, oy - 2, "smug");
    } else if (i === 2) {
      glow(buf, b.x, oy, 20, hex("#ffd23f"), 0.6);
      shadeAll(buf, (x, y) => (Math.hypot(x - b.x, y - oy) < 10 ? pick(ramp(["#ff8a3d", "#ffd23f", "#fff2b0"]), x, y, 0.9 - Math.hypot(x - b.x + 3, y - oy + 3) / 16) : null), b.x - 11, oy - 11, b.x + 11, oy + 11);
      eyes(buf, b.x, oy - 2, "cool");
    } else {
      drawBolt(buf, makeBolt(Math.floor(t * 12), b.x - 4, Math.max(2, top - 30), b.x + 3, Math.max(20, top), 4, 1), 1, hex("#9a8aff"), hex("#ffffff"), 1.6);
      eyes(buf, b.x, Math.max(16, top + 10), "angry");
    }
    const at = label[i];
    if (at !== null && at !== undefined && t >= at) drawNumber(buf, b.label, i === 3 ? 118 : b.x, i === 3 ? 44 : Math.max(30, oy - 22), i === 3 ? "#ffd23f" : "#f4f1e8", i === 3 ? 2 : 1);
  });
};
