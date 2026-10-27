import { Buf, H, W, clamp01, hex, lerp, smoothstep } from "./engine/pixel";
import { cover, drawRings, glow, mix, shadeAll } from "./engine/fine";
import { Look, Mood, Part, drawParts, ellipse, face, part, roundRect, style, sweatDrop, tri, union } from "./engine/flat";
import { drawPip } from "./engine/hero";
import { GROUNDS, drawBurst, drawCloud, drawHouse, drawMolecule, foreground, ground, pipClose } from "./engine/props";
import { drawPill } from "./engine/sprites";
import { Push, Shot, ShotCtx, lineStart, push, split } from "./shot-kit";

// Lake Nyos, Cameroon, 21 August 1986 (NASA Earth Observatory, USGS), v4 look (K1-K5, L31, L32):
// Pip as the protagonist, the lake as a character with a face, carbon dioxide as little
// molecules, numbers as pills, layered scenery behind every shot.
// Layout: hook title y 55-90, subject y 95-205, captions y 215-227, reveal text y 110-150.

const WATER = style("#28c8f4", "#1290d8", "#b0f2ff");
const DEEP = style("#3a3ae0", "#2424b0", "#7a7af4");
const RIM = style("#3cc85a", "#22924a", "#a0ec86");
const BUBBLE = style("#d8f8ff", "#86d8f4", "#ffffff");
const ROCK = style("#a898d0", "#6a5a9a", "#e0d8f8");
const GAS = hex("#f4eeff");
const GAS_EDGE = hex("#b8a4ff");
const ONE = push(1.18, 90, 196);

// Carbon dioxide (K6): a grey carbon with a face between two red oxygens.
const drawCO2 = (buf: Buf, cx: number, cy: number, s: number, mood: Mood, look: Look = { dx: 0, dy: -0.4 }, squash = 1) =>
  drawParts(buf, [
    part(ellipse(-s * 1.05, 0, s * 0.72, s * 0.72), style("#ff4a6a", "#c0244a", "#ffb0c0")),
    part(ellipse(s * 1.05, 0, s * 0.72, s * 0.72), style("#ff4a6a", "#c0244a", "#ffb0c0")),
    part(ellipse(0, 0, s, s), style("#6a6a90", "#40405e", "#b0b0d0")),
    ...face(mood, [-s * 0.36, s * 0.36], -s * 0.05, s * 0.27, look),
  ], { cx, cy, unit: 1, sx: 1 / squash, sy: squash, box: [-s * 1.9, -s - 1, s * 1.9, s + 1], edge: s / 18 });

// The lake from the side and a little above: a crater rim, the water, and its face.
const LAKE = { x: 90, y: 190 };
const lake = (buf: Buf, Z: Push, t: number, mood: Mood, look: Look = { dx: 0, dy: 0 }, boil = 0) => {
  drawParts(buf, [
    part(union(ellipse(-76, -6, 46, 30), ellipse(76, -6, 46, 30), ellipse(0, 12, 100, 30)), RIM),
    part(ellipse(0, 0, 66, 15), WATER),
    ...face(mood, [-16, 16], 1, 6, look),
  ], { cx: Z.x(LAKE.x), cy: Z.y(LAKE.y), unit: Z.s(1), box: [-124, -40, 124, 44], edge: 1.4 });
  for (let i = 0; i < 7 * boil; i++) {
    const r = 2 + ((t * 3 + i * 0.37) % 1) * 3;
    drawParts(buf, [part(ellipse(0, 0, r, r * 0.8), BUBBLE)], { cx: Z.x(LAKE.x - 52 + i * 15 + Math.sin(t * 5 + i) * 3), cy: Z.y(LAKE.y - 2 - r * 0.6 + (i % 2) * 6), unit: Z.s(1), box: [-r - 1, -r, r + 1, r], edge: 0.3 });
  }
};
const bubble = (buf: Buf, Z: Push, r: number) =>
  drawParts(buf, [part(ellipse(0, 0, r, r * 0.92), BUBBLE)], { cx: Z.x(LAKE.x + 26), cy: Z.y(LAKE.y - 4 - r * 0.8), unit: Z.s(1), box: [-r - 1, -r, r + 1, r], edge: Math.max(0.4, r / 20) });

// The gas you can't see: a dithered, barely-there cloud with a dotted edge (and, when asked, eyes).
const blobDist = (x: number, y: number, puffs: number[][]) => Math.min(...puffs.map(([px, py, rx, ry]) => Math.hypot((x - px) / rx, (y - py) / ry)));
const ghost = (buf: Buf, cx: number, cy: number, w: number, t: number, mood: Mood | null, look: Look = { dx: 0, dy: 0 }) => {
  const puffs = [[-0.32, 0.1, 0.36, 0.3], [0, -0.12, 0.4, 0.36], [0.34, 0.06, 0.34, 0.3], [0, 0.16, 0.56, 0.22]].map(([x, y, rx, ry], i) => [cx + x * w, cy + (y + Math.sin(t * 2 + i) * 0.02) * w, rx * w, ry * w]);
  shadeAll(buf, (x, y) => {
    const d = blobDist(x, y, puffs);
    if (d > 1) return null;
    if (d > 0.9) return cover(x, y, 0.75) ? GAS_EDGE : null;
    return cover(x, y, 0.3) ? GAS : null;
  }, cx - w * 0.7, cy - w * 0.6, cx + w * 0.7, cy + w * 0.6);
  if (mood) drawParts(buf, face(mood, [-w * 0.12, w * 0.12], 0, w * 0.07, look), { cx, cy: cy - w * 0.02, unit: 1, box: [-w * 0.25, -w * 0.12, w * 0.25, w * 0.12], edge: 0.3 });
};

// The gas lying on the land: everything under `top(x)` and over the ground, dithered so the land
// shows through.
const flood = (buf: Buf, top: (x: number) => number, land: (x: number) => number, x0: number, x1: number) =>
  shadeAll(buf, (x, y) => {
    const tp = top(x);
    if (x < x0 || x > x1 || y < tp || y > land(x)) return null;
    if (y < tp + 2) return GAS_EDGE;
    if (y < tp + 4) return cover(x, y, 0.7) ? GAS : null;
    return cover(x, y, 0.5) ? GAS : null;
  });

// The cross-section (Level 1-3): rock layers around the lake bowl, magma far below. World y is
// screen y + camY; the lake surface sits at SURF.
const SURF = 112;
const MAGMA = { x: 90, y: 600 };
const STRATA = ["#f07a2a", "#e8543a", "#d03c5c", "#b03078", "#8a2a90", "#6a26a0"].map(hex);
const bowl = (x: number, wy: number) => wy >= SURF && ((x - 90) / 76) ** 2 + ((wy - SURF) / 100) ** 2 <= 1;
const crack = (wy: number) => 90 + 16 * Math.sin(wy / 38) + 6 * Math.sin(wy / 13);
const PEBBLES = Array.from({ length: 70 }, (_, i) => ({ x: (i * 73) % W, y: SURF + 14 + ((i * 131) % 600), r: 1.5 + (i % 4) }));
type Section = { layer?: number; mood?: Mood; look?: Look; sweat?: boolean; arrows?: number; rise?: number };
const section = (buf: Buf, t: number, camY: number, o: Section = {}) => {
  const layer = o.layer ?? SURF + 46;
  ground(buf, GROUNDS.sky, t, 0, H, 90, Math.max(40, SURF - camY - 40));
  const band = (x: number, wy: number) => {
    const v = (wy - SURF + 8 * Math.sin(x * 0.07 + wy * 0.01)) / 96;
    const i = Math.max(0, Math.min(STRATA.length - 1, Math.floor(v)));
    const f = v - Math.floor(v);
    return f > 0.82 && i + 1 < STRATA.length && cover(x, wy, (f - 0.82) / 0.18) ? STRATA[i + 1] : STRATA[i];
  };
  shadeAll(buf, (x, y) => {
    const wy = y + camY;
    if (wy < SURF || bowl(x, wy)) return null;
    if (wy < SURF + 4) return RIM.fill;
    if (Math.abs(x - crack(wy)) < 1.6 && wy > SURF + 96) return mix(band(x, wy), [20, 12, 38], 0.55);
    return band(x, wy);
  });
  for (const p of PEBBLES) {
    const y = p.y - camY;
    if (y < -6 || y > H + 6 || bowl(p.x, p.y)) continue;
    const c = band(p.x, p.y);
    drawParts(buf, [part(ellipse(0, 0, p.r * 1.4, p.r), { fill: mix(c, [20, 12, 38], 0.25), light: mix(c, [255, 255, 255], 0.3) })], { cx: p.x, cy: y, unit: 1, box: [-p.r * 1.5, -p.r - 1, p.r * 1.5, p.r + 1], outline: null, edge: 0.3 });
  }
  const my = MAGMA.y - camY;
  if (my < H + 60) {
    glow(buf, MAGMA.x, my, 110, hex("#ffb040"), 0.8);
    const bub = (i: number) => Math.sin(t * 3 + i * 1.7) * 4;
    drawParts(buf, [part(union(ellipse(0, 0, 74, 34), ellipse(-44, -14 + bub(1), 30, 22), ellipse(40, -12 + bub(2), 32, 24), ellipse(0, -24 + bub(3), 28, 18)), style("#ff6a1a", "#d03a10", "#ffd23f")), ...face("smug", [-16, 16], -6, 9, { dx: 0, dy: -0.6 })],
      { cx: MAGMA.x, cy: my, unit: 1, box: [-80, -46, 80, 36], edge: 1.4 });
  }
  shadeAll(buf, (x, y) => {
    const wy = y + camY;
    if (!bowl(x, wy)) return null;
    const lt = layer + 2 * Math.sin(x * 0.12 + t * 2);
    if (Math.abs(wy - lt) < 0.8) return mix(DEEP.fill, [255, 255, 255], 0.5);
    if (wy < lt) return wy < SURF + 2 ? WATER.light! : WATER.fill;
    return wy > SURF + 98 - Math.abs(x - 90) * 0.4 ? DEEP.shade! : DEEP.fill;
  });
  const rim = SURF - camY;
  if (rim > -30) {
    drawParts(buf, [part(union(ellipse(-82, 0, 32, 14), ellipse(82, 0, 32, 14)), RIM)], { cx: 90, cy: rim, unit: 1, box: [-116, -16, 116, 1], edge: 1 });
    drawParts(buf, face(o.mood ?? "open", [-16, 16], 0, 5, o.look), { cx: 90, cy: rim + 16, unit: 1, box: [-24, -8, 24, 8], edge: 0.3 });
    if (o.sweat) drawParts(buf, [sweatDrop(34, -2, 0.8)], { cx: 90, cy: rim + 16, unit: 1, box: [26, -12, 42, 10], edge: 0.3 });
  }
  // The water's weight: chevrons pressing down on the deep layer.
  for (let k = 0; k < 3 * (o.arrows ?? 0); k++) {
    const y = SURF + 22 + ((t * 18 + k * 9) % Math.max(4, layer - SURF - 26)) - camY;
    drawParts(buf, [part(union(tri(-8, -4, 0, 4, 0, 0), tri(8, -4, 0, 4, 0, 0)), { fill: hex("#ffffff") })], { cx: 50 + (k % 3) * 40, cy: y, unit: 1, box: [-9, -5, 9, 5], outline: hex("#1290d8") });
  }
};
// The gas packed into the deep layer: up to `n` molecules, squashed by `squeeze`.
const DEEP_SPOTS = Array.from({ length: 16 }, (_, i) => ({ x: 34 + ((i * 37) % 112), y: 12 + ((i * 23) % 38) }));
const packed = (buf: Buf, t: number, camY: number, layer: number, n: number, squeeze: number, mood: Mood, grow = 1) =>
  DEEP_SPOTS.slice(0, Math.round(n)).forEach((p, i) => {
    const wy = Math.min(layer + p.y, SURF + 92 - Math.abs(p.x - 90) * 0.5);
    const x = p.x + Math.sin(t * 2 + i) * 2;
    if (!bowl(x, wy)) return;
    drawCO2(buf, x, wy - camY + Math.cos(t * 3 + i) * 1.2, 5.5 * grow, mood, { dx: 0, dy: -0.6 }, 1 - squeeze * 0.25);
  });

// Frame 0 and the outro's last frame (L26): the sleepy lake with a bubble swelling and Pip on the
// rim.
const BURP = 0.32;
const PIP0 = { x: 140, y: 160, size: 56 };
const hookBurp = (buf: Buf, c: ShotCtx) => {
  ground(buf, GROUNDS.sky, c.t, 0, H, 116, 170);
  const popped = c.t >= BURP;
  lake(buf, ONE, c.t, popped ? "shock" : "blink");
  if (!popped) bubble(buf, ONE, lerp(16, 22, c.t / BURP));
  else {
    const k = c.t - BURP;
    drawBurst(buf, ONE.x(LAKE.x + 26), ONE.y(LAKE.y - 20), 26 * (1 - smoothstep(0, 0.5, k) * 0.5), c.t, hex("#d8f8ff"));
    drawRings(buf, ONE.x(LAKE.x + 26), ONE.y(LAKE.y - 20), k * 1.4, hex("#ffffff"), 120, 2, 0.7);
    for (let i = 0; i < 10; i++) {
      const a = -0.3 - i * 0.28, d = 14 + k * 90;
      drawParts(buf, [part(ellipse(0, 0, 2.6, 3.2), WATER)], { cx: ONE.x(LAKE.x + 26) + Math.cos(a) * d, cy: ONE.y(LAKE.y - 20) + Math.sin(a) * d + k * k * 60, unit: 1, box: [-4, -4, 4, 4], edge: 0.3 });
    }
  }
  const blown = smoothstep(BURP, BURP + 0.4, c.t);
  drawPip(buf, popped ? "puffed" : "look", ONE.x(PIP0.x + 10 * blown), ONE.y(PIP0.y - 6 * blown), ONE.s(PIP0.size), c.t, { look: { dx: -0.8, dy: 0.3 } });
};

// "A gas cloud you couldn't see": only its eyes give it away, and Pip looks the wrong way.
const unseen = (buf: Buf, c: ShotCtx, from: number) => {
  const k = smoothstep(from, from + 1.2, c.t);
  ground(buf, GROUNDS.cyan, c.t, 0, H, 90, 150);
  ghost(buf, lerp(140, 104, k), 150, 90, c.t, "smug", { dx: 0.6, dy: 0.2 });
  drawPip(buf, "look", 54, 178, 64, c.t, { look: { dx: -0.9, dy: -0.2 } });
};

const hookWide = (buf: Buf, c: ShotCtx, l1: number) => {
  const Z = push(1.18 + 0.25 * smoothstep(l1, c.dur, c.t), 90, 196);
  ground(buf, GROUNDS.sky, c.t, 0, H, 90, 150);
  const noWave = l1 + 1.7, noFire = l1 + 2.3, how = l1 + 3.0;
  lake(buf, Z, c.t, c.t > how ? "blink" : "open", { dx: 0.4, dy: -0.6 });
  if (c.t > l1 + 0.2) drawPill(buf, "CAMEROON", Z.x(90), Z.y(150), "#ffffff", "#140c26", 2);
  if (c.t > l1 + 0.8) drawPill(buf, "1986", Z.x(90), Z.y(166), "#ffd23f", "#140c26", 2);
  if (c.t > noWave && c.t < how) {
    drawParts(buf, [part(union(ellipse(0, 0, 14, 12), ellipse(10, -8, 8, 6)), WATER)], { cx: 34, cy: 120, unit: 1, box: [-16, -16, 20, 14], edge: 0.8 });
    if (c.t > noWave + 0.25) drawPill(buf, "X", 46, 132, "#ff4a4a", "#ffffff", 2);
  }
  if (c.t > noFire && c.t < how) {
    drawParts(buf, [part(union(ellipse(0, 4, 10, 10), tri(-10, 4, 10, 4, 0, -18)), style("#ff8a2a", "#e0481a", "#ffd23f"))], { cx: 146, cy: 120, unit: 1, box: [-12, -20, 12, 15], edge: 0.8 });
    if (c.t > noFire + 0.25) drawPill(buf, "X", 158, 132, "#ff4a4a", "#ffffff", 2);
  }
  const asking = c.t > how;
  drawPip(buf, asking ? "point" : "look", Z.x(138), Z.y(162), Z.s(48), c.t, { look: { dx: -0.6, dy: 0.2 }, flip: asking });
  if (asking) drawPill(buf, "?", Z.x(118), Z.y(128), "#ffffff", "#140c26", 3);
  if (asking && (c.t - how) % 1.4 < 0.5) bubble(buf, Z, 4 + ((c.t - how) % 1.4) * 8);
};

const hook: Shot = (buf, c) => {
  const l1 = lineStart(c, 1, 2.9);
  if (c.t < 0.9) return hookBurp(buf, c);
  if (c.t < 1.7) return pipClose(buf, c.t, GROUNDS.yellow, "shock");
  if (c.t < l1) return unseen(buf, c, 1.7);
  hookWide(buf, c, l1);
};

// Level 1: fifty miles down, the magma leaks carbon dioxide; the camera rides it up the crack into
// the lake's deepest water, where it gathers. Pip watches from the rim.
const CO2_TRAIL = Array.from({ length: 9 }, (_, k) => k / 9);
const magma: Shot = (buf, c) => {
  const l1 = lineStart(c, 1, 3.7);
  const rise = smoothstep(l1 - 0.6, c.dur - 0.4, c.t);
  const camY = lerp(470, 0, rise);
  const layer = SURF + 46;
  section(buf, c.t, camY, { layer, mood: rise > 0.9 ? "open" : "blink" });
  packed(buf, c.t, camY, layer, lerp(2, 8, smoothstep(l1 + 0.6, c.dur, c.t)), 0, "open");
  CO2_TRAIL.forEach((p0, k) => {
    const p = (p0 + c.t * 0.16) % 1;
    const wy = lerp(MAGMA.y - 34, SURF + 96, p);
    const y = wy - camY;
    if (y < -10 || y > H + 10) return;
    drawCO2(buf, crack(wy), y, 6, k % 3 ? "open" : "grin", { dx: 0, dy: -0.8 });
  });
  if (c.t > 0.5 && camY > 300) drawPill(buf, "50 MILES DOWN", 90, Math.min(130, MAGMA.y - camY - 56), "#ffd23f", "#140c26", 2);
  if (rise > 0.85) drawPip(buf, "look", 154, SURF - 14, 30, c.t, { look: { dx: -0.6, dy: 0.8 } });
};

// Level 2: the water's weight squeezes the gas (chevrons), "like a soda cap" (the bottle, with Pip
// leaning on it and sweating), then the deep layer that never mixes fills up with more and more gas.
const GLASS = style("#a8f4e4", "#4ac0b0", "#eafff8");
const SODA = style("#ff8a2a", "#e0581a", "#ffc070");
const CAP = style("#ff3a4a", "#b81a3a", "#ff9aa0");
const bottle = (buf: Buf, cx: number, base: number, s: number, mood: Mood, t: number, capOff = 0, packedFizz = 1) => {
  const bubbles: Part[] = Array.from({ length: 14 }, (_, i) => {
    const bx = -0.32 + ((i * 0.23) % 0.64), by = -1.18 + ((i * 0.37) % 0.4) * packedFizz + Math.sin(t * 6 + i) * 0.015;
    return part(ellipse(bx * s, by * s, 0.06 * s, 0.06 * s), { fill: hex("#fff2d8"), line: hex("#e0581a") });
  });
  const lift = capOff * 1.4 * s;
  drawParts(buf, [
    part(union(roundRect(-0.5 * s, -1.5 * s, 0.5 * s, 0, 0.16 * s), ellipse(0, -1.46 * s, 0.5 * s, 0.24 * s), roundRect(-0.17 * s, -2.12 * s, 0.17 * s, -1.4 * s, 0.05 * s)), GLASS),
    part(roundRect(-0.41 * s, -1.28 * s, 0.41 * s, -0.08 * s, 0.12 * s), SODA),
    ...bubbles,
    ...face(mood, [-0.17 * s, 0.17 * s], -0.62 * s, 0.11 * s),
    ...(capOff < 1 ? [part(union(roundRect(-0.23 * s, -2.28 * s - lift, 0.23 * s, -2.06 * s - lift, 0.04 * s), ...[-0.18, -0.06, 0.06, 0.18].map((x) => tri((x - 0.05) * s, -2.06 * s - lift, (x + 0.05) * s, -2.06 * s - lift, x * s, -1.98 * s - lift))), CAP)] : []),
  ], { cx, cy: base, unit: 1, box: [-0.56 * s, -2.4 * s - lift, 0.56 * s, 1], edge: s / 40 });
};

const soda: Shot = (buf, c) => {
  const l1 = lineStart(c, 1, 4.1);
  const sodaAt = 2.9, back = l1 + 1.5;
  if (c.t < sodaAt) {
    const z = 1 + 0.35 * smoothstep(0, sodaAt, c.t);
    section(buf, c.t, 40 * z, { arrows: 1, mood: "angry", look: { dx: 0, dy: 0.8 } });
    packed(buf, c.t, 40 * z, SURF + 46, 8, smoothstep(0.4, 1.6, c.t), "angry");
    return;
  }
  if (c.t < back) {
    ground(buf, GROUNDS.yellow, c.t, 0, H, 110, 140);
    const strain = smoothstep(sodaAt, back, c.t);
    const shake = Math.sin(c.t * 40) * 1.2 * strain;
    foreground(buf, GROUNDS.yellow, c.t);
    bottle(buf, 112 + shake, 206, 46, strain > 0.5 ? "shock" : "open", c.t, 0, 1 - strain * 0.8);
    drawPip(buf, "look", 62, 182, 58, c.t, { sweat: strain > 0.3, look: { dx: 0.8, dy: -0.6 } });
    return;
  }
  // "Never mixes with the top": the gas keeps coming, the boundary holds, the lake starts to sweat.
  const k = smoothstep(back, c.dur, c.t);
  const camY = lerp(20, 0, k);
  section(buf, c.t, camY, { mood: k > 0.4 ? "shock" : "open", sweat: k > 0.4, look: { dx: 0, dy: 0.8 } });
  packed(buf, c.t, camY, SURF + 46, lerp(8, 16, k), 0.6 * k, k > 0.5 ? "angry" : "open");
  drawPip(buf, "look", 154, SURF - 14 - camY, 30, c.t, { sweat: k > 0.5, look: { dx: -0.6, dy: 0.8 } });
};

// Level 3: on 21 August the deep water rose, the pressure dropped and the molecules swelled into
// bubbles; then the surface boils and erupts, and Pip is blown off the rim. Then the suspects.
const burstAt = (c: ShotCtx) => lineStart(c, 1, 5.9) - 1.4;
const rising: Shot = (buf, c) => {
  const b = burstAt(c);
  const up = smoothstep(0.6, b - 1.6, c.t);
  const layer = lerp(SURF + 46, SURF + 10, up);
  const swell = smoothstep(b - 2, b - 1, c.t);
  section(buf, c.t, 0, { layer, mood: swell > 0.3 ? "shock" : "open", look: { dx: 0, dy: 0.8 } });
  packed(buf, c.t, 0, layer, 16, 0, swell > 0.3 ? "shock" : "open", lerp(1, 1.45, swell));
  if (c.t > 0.3) drawPill(buf, "AUG 21, 1986", 72, 100, "#ffd23f", "#140c26", 2);
  drawPip(buf, "look", 154, SURF - 14, 30, c.t, { look: { dx: -0.6, dy: 0.8 } });
};
const erupt: Shot = (buf, c) => {
  const b = burstAt(c);
  const k = smoothstep(b - 0.1, b + 0.4, c.t);
  ground(buf, GROUNDS.sky, c.t, 0, H, 90, 140);
  lake(buf, ONE, c.t, "shock", { dx: 0, dy: -0.8 }, c.t < b ? 1 : 0);
  if (c.t >= b) {
    const h = 110 * k;
    drawParts(buf, [part(union(roundRect(-14, -h, 14, 0, 8), ellipse(0, -h, 26, 16), ellipse(-16, -h + 12, 14, 10), ellipse(16, -h + 14, 14, 10)), WATER)], { cx: LAKE.x, cy: LAKE.y - 2, unit: 1, box: [-30, -h - 18, 30, 2], edge: 1 });
    ghost(buf, LAKE.x, LAKE.y - h - 8, 120 * k, c.t, null);
    drawRings(buf, LAKE.x, LAKE.y - 30, (c.t - b) * 1.3, hex("#ffffff"), 140, 2, 0.6);
    drawBurst(buf, LAKE.x, LAKE.y - 6, 22, c.t, hex("#d8f8ff"));
  }
  const blown = smoothstep(b, b + 0.8, c.t);
  drawPip(buf, c.t >= b ? "puffed" : "shock", PIP0.x + 30 * blown, PIP0.y - 40 * blown, PIP0.size, c.t, { look: { dx: -0.8, dy: 0.2 } });
};
// "Nobody knows exactly what tipped it": a landslide rock and a cold-rain cloud get a "?" each.
const suspects: Shot = (buf, c) => {
  const l1 = lineStart(c, 1, 5.9);
  const t1 = c.t - l1;
  ground(buf, GROUNDS.cyan, c.t, 0, H, 90, 160);
  lake(buf, ONE, c.t, "blink");
  drawParts(buf, [part(union(ellipse(0, 0, 13, 11), ellipse(-8, 4, 9, 7)), ROCK), ...face(t1 > 0.4 ? "shock" : "open", [-5, 5], -1, 3.4)], { cx: 30, cy: 158, unit: 1, box: [-18, -12, 15, 12], edge: 0.7 });
  drawCloud(buf, 140, 112, 50, t1 > 1.1 ? "shock" : "open", c.t);
  if (t1 > 0.4) drawPill(buf, "?", 30, 136, "#ffffff", "#140c26", 2);
  if (t1 > 1.1) drawPill(buf, "?", 140, 90 + 8, "#ffffff", "#140c26", 2);
  const look = t1 < 0.4 ? { dx: 0.6, dy: 0 } : t1 < 1.1 ? { dx: -0.9, dy: -0.2 } : { dx: 0.8, dy: -0.7 };
  drawPip(buf, t1 > 1.6 ? "point" : "look", 96, 150, 46, c.t, { look, flip: t1 > 1.6 });
  if (t1 > 1.6) drawPill(buf, "?", 76, 120, "#ffd23f", "#140c26", 3);
};
const burst: Shot = (buf, c) => {
  const b = burstAt(c);
  if (c.t < b - 1.2) return rising(buf, c);
  if (c.t < lineStart(c, 1, 5.9)) return erupt(buf, c);
  suspects(buf, c);
};

// Level 4: carbon dioxide outweighs air (a seesaw), then it pours downhill as a flood at 60 mph,
// Pip hopping ahead of it; Pip's sweating close-up on "You couldn't outrun it."
const seesaw = (buf: Buf, c: ShotCtx) => {
  ground(buf, GROUNDS.yellow, c.t, 0, H, 90, 150);
  foreground(buf, GROUNDS.yellow, c.t);
  const a = -0.32 * smoothstep(0.4, 1.0, c.t) + Math.sin(c.t * 6) * 0.02 * smoothstep(0.9, 1.3, c.t);
  const px = 90, py = 178, L = 62;
  drawParts(buf, [part(tri(-14, 26, 14, 26, 0, 0), style("#a0663a", "#6a3e22", "#d09060")), part(ellipse(0, 0, L + 4, 3.4, a), style("#ff8a3d", "#c4482a", "#ffd0a0"))], { cx: px, cy: py, unit: 1, box: [-70, -26, 70, 28], edge: 0.8 });
  const end = (s: number) => ({ x: px + Math.cos(a) * L * s, y: py + Math.sin(a) * L * s });
  const l = end(-0.82), r = end(0.82);
  drawCO2(buf, l.x, l.y - 13, 10, c.t > 1 ? "smug" : "open", { dx: 0.6, dy: 0 });
  drawMolecule(buf, r.x, r.y - 10, 9, c.t > 1 ? "shock" : "open", undefined, { dx: -0.6, dy: 0 });
  drawPip(buf, "look", 90, 120, 40, c.t, { look: { dx: c.t > 1 ? -0.8 : 0.6, dy: 0.4 } });
};
const slope = (x: number) => 112 + x * 0.52 + 5 * Math.sin(x / 17);
const pour = (buf: Buf, c: ShotCtx, from: number, l1: number, end: number) => {
  ground(buf, GROUNDS.sky, c.t, 0, H, 150, 150);
  drawParts(buf, [part((x, y) => y > slope(x), RIM)], { cx: 0, cy: 0, unit: 1, box: [0, 100, W, H], edge: 1.6 });
  foreground(buf, GROUNDS.sky, c.t);
  drawParts(buf, [part(ellipse(0, 0, 18, 5), WATER)], { cx: 18, cy: slope(18) - 2, unit: 1, box: [-20, -6, 20, 6], edge: 0.5 });
  drawHouse(buf, 156, slope(156) + 2, 18);
  const k = smoothstep(from, end, c.t);
  const front = lerp(24, 128, k);
  const depth = (x: number) => 4 + 16 * clamp01((front - x) / 40) * clamp01(x / 20);
  flood(buf, (x) => slope(x) - depth(x) + Math.sin(x * 0.3 - c.t * 8), slope, 0, front);
  drawParts(buf, face("smug", [-5, 5], 0, 3.6, { dx: 0.8, dy: 0.2 }), { cx: front - 12, cy: slope(front - 12) - 9, unit: 1, box: [-10, -6, 10, 6], edge: 0.3 });
  if (c.t > l1) for (let i = 0; i < 4; i++) drawParts(buf, [part(roundRect(-8 - i * 2, -0.8, 8, 0.8, 0.8), { fill: hex("#ffffff") })], { cx: front - 26 - i * 6, cy: slope(front - 26) - 18 + i * 5, unit: 1, box: [-18, -2, 9, 2], outline: null, edge: 0 });
  if (c.t > l1) drawPill(buf, "60 MPH", Math.min(130, front - 6), slope(front) - 40, "#ffd23f", "#140c26", 2);
  const px = Math.min(166, front + 24);
  drawPip(buf, "shock", px, slope(px) - 18 - Math.abs(Math.sin(c.t * 12)) * 5, 34, c.t, { sweat: true, look: { dx: -0.9, dy: 0 } });
};
const cloud: Shot = (buf, c) => {
  const l1 = lineStart(c, 1, 4.0);
  const close = l1 + 1.6;
  if (c.t < 2.0) return seesaw(buf, c);
  if (c.t < close) return pour(buf, c, 2.0, l1, close);
  pipClose(buf, c.t, GROUNDS.coral, "look", true);
};

// The answer: the gas fills the valley like water fills a bowl and pushes the air out; the air
// molecules flee upward. Pip watches from the high ground.
const valley = (x: number) => 118 + 84 * Math.exp(-(((x - 86) / 46) ** 2));
const AIR = Array.from({ length: 7 }, (_, i) => ({ x: 56 + i * 9, y: 176 + (i % 3) * 7 }));
const village: Shot = (buf, c) => {
  const k = smoothstep(0.4, c.dur - 0.6, c.t);
  const Z = push(1 + 0.2 * smoothstep(0, c.dur, c.t), 86, 190);
  ground(buf, GROUNDS.dusk, c.t, 0, H, 86, 130);
  drawParts(buf, [part((x, y) => y > valley(x), RIM)], { cx: Z.x(0), cy: Z.y(0), unit: Z.s(1), box: [0, 100, W / Z.s(1) + 40, H], edge: 1.6 });
  foreground(buf, GROUNDS.dusk, c.t);
  [[64, 15], [84, 18], [104, 15]].forEach(([x, s]) => drawHouse(buf, Z.x(x), Z.y(valley(x) + 1), Z.s(s)));
  AIR.forEach((p, i) => {
    const out = smoothstep(0.2 + i * 0.08, 0.6 + i * 0.08, k);
    const x = Z.x(lerp(p.x, i < 3 ? 14 + i * 6 : 150 + i * 4, out)), y = Z.y(lerp(p.y, 96 - (i % 3) * 8, out) + Math.sin(c.t * 5 + i) * 2);
    drawMolecule(buf, x, y, Z.s(6), out > 0.1 ? "shock" : "open", undefined, { dx: 0, dy: -0.8 });
  });
  const level = lerp(206, 168, k);
  flood(buf, (x) => Z.y(level) + Math.sin(x * 0.25 + c.t * 3), (x) => Z.y(valley((x - Z.x(0)) / Z.s(1))), 0, W);
  drawPip(buf, k > 0.3 ? "shock" : "look", Z.x(158), Z.y(valley(158) - 15), Z.s(32), c.t, { look: { dx: -0.8, dy: 0.5 } });
};

// Aftermath: a pipe lets the gas out a little at a time (Pip surfs the jet in shades), then the
// fertile fields grow while the reveal "10,000 LIVE HERE" sits above them.
const pipe: Shot = (buf, c) => {
  ground(buf, GROUNDS.cyan, c.t, 0, H, 90, 120);
  lake(buf, ONE, c.t, "grin");
  const jet = smoothstep(0, 0.8, c.t), h = 58 * jet + Math.sin(c.t * 9) * 3;
  drawParts(buf, [part(roundRect(-3, -6, 3, 4, 1), style("#c8d0e6", "#8a92b8", "#ffffff")), part(union(roundRect(-4, -h, 4, -6, 3), ellipse(0, -h, 9, 6)), WATER)], { cx: LAKE.x, cy: LAKE.y - 2, unit: 1, box: [-12, -h - 8, 12, 5], edge: 0.6 });
  for (let i = 0; i < 4; i++) {
    const p = (c.t * 0.35 + i * 0.25) % 1;
    drawCO2(buf, LAKE.x + Math.sin(p * 9 + i) * 10, LAKE.y - h - 10 - p * 50, 4, "grin", { dx: 0, dy: -0.6 });
  }
  drawPip(buf, "shades", LAKE.x, LAKE.y - h - 20, 40, c.t);
};
const CROPS = Array.from({ length: 15 }, (_, i) => ({ x: 14 + (i % 5) * 36 + (Math.floor(i / 5) % 2) * 18, y: 176 + Math.floor(i / 5) * 13, d: (i * 0.13) % 0.9 }));
const fields: Shot = (buf, c) => {
  const l1 = lineStart(c, 1, 3.7);
  const Z = push(1 + 0.45 * smoothstep(l1, c.dur, c.t), 110, 196);
  ground(buf, GROUNDS.yellow, c.t, 0, H, 140, 120);
  drawParts(buf, [part((x, y) => y > 164 + 6 * Math.sin(x / 26), style("#a0663a", "#6a3e22", "#d09060"))], { cx: Z.x(0), cy: Z.y(0), unit: Z.s(1), box: [-40, 150, W + 40, H], edge: 1.4 });
  foreground(buf, GROUNDS.yellow, c.t);
  drawHouse(buf, Z.x(26), Z.y(166), Z.s(16));
  drawHouse(buf, Z.x(156), Z.y(168), Z.s(14));
  CROPS.forEach((p) => {
    const g = smoothstep(l1 - 0.2 + p.d, l1 + 1.2 + p.d, c.t);
    if (g <= 0) return;
    const s = 10 * g, sway = Math.sin(c.t * 2 + p.x) * 0.15;
    drawParts(buf, [part(union(roundRect(-0.8, -s, 0.8, 0, 0.5), ellipse(-s * 0.4, -s * 0.6, s * 0.45, s * 0.16, 0.5 + sway), ellipse(s * 0.4, -s * 0.75, s * 0.45, s * 0.16, -0.5 + sway)), style("#4cd85a", "#22a044", "#b0f490")), ...(g > 0.8 ? [part(ellipse(s * 0.1, -s * 0.95, s * 0.14, s * 0.26), style("#ffd23f", "#e08a1e", "#fff2b0"))] : [])],
      { cx: Z.x(p.x), cy: Z.y(p.y), unit: Z.s(1), box: [-s, -s * 1.3, s, 1], edge: 0.4 });
  });
  const walk = smoothstep(l1 + 0.6, c.dur - 0.3, c.t);
  const hop = Math.abs(Math.sin(c.t * 7)) * 5 * (walk > 0 && walk < 1 ? 1 : 0);
  drawPip(buf, Math.floor(c.t * 2) % 3 === 2 ? "grin" : "shades", Z.x(lerp(44, 120, walk)), Z.y(190 - hop), Z.s(38), c.t);
};
const pipes: Shot = (buf, c) => split(c, lineStart(c, 1, 3.7) - 0.1, pipe, fields, 0.3);

// Loop (L26): Pip opens a soda, it fizzes, Pip burps; then the picture settles on frame 0 so "...a
// tiny reminder that" runs into "this lake burped...".
const sodaPip: Shot = (buf, c) => {
  ground(buf, GROUNDS.yellow, c.t, 0, H, 110, 150);
  foreground(buf, GROUNDS.yellow, c.t);
  const pop = smoothstep(0.7, 1.0, c.t);
  bottle(buf, 118, 204, 26, pop > 0 ? "grin" : "open", c.t, pop, 0.3);
  if (pop > 0) for (let i = 0; i < 6; i++) {
    const p = (c.t * 0.9 + i / 6) % 1;
    drawParts(buf, [part(ellipse(0, 0, 2, 2), BUBBLE)], { cx: 118 + Math.sin(p * 8 + i) * 5, cy: 146 - p * 46, unit: 1, box: [-3, -3, 3, 3], edge: 0.2 });
  }
  const burp = c.t > 1.9 && c.t < 2.4;
  drawPip(buf, burp ? "puffed" : pop > 0 ? "grin" : "look", 64, 178, 58, c.t, { look: { dx: 0.8, dy: -0.3 } });
};
const frame0: Shot = (buf, c) => hookBurp(buf, { ...c, t: 0 });
const outro: Shot = (buf, c) => split(c, c.dur - 1.3, sodaPip, frame0, 0.8);

export const EP005_SHOTS: Record<string, Shot> = {
  "nyos-hook": hook,
  "nyos-magma": magma,
  "nyos-soda": soda,
  "nyos-burst": burst,
  "nyos-cloud": cloud,
  "nyos-village": village,
  "nyos-pipes": pipes,
  "nyos-outro": outro,
};

// The burp in the hook and the eruption rumble the frame.
export const ep005Shake = (visual: string, c: ShotCtx) => {
  const at = visual === "nyos-hook" ? BURP : visual === "nyos-burst" ? burstAt(c) : null;
  if (at === null) return null;
  const k = smoothstep(at - 0.02, at + 0.08, c.t) * (1 - smoothstep(at + 0.5, at + 1.1, c.t)) * (visual === "nyos-hook" ? 0.7 : 1);
  return { x: Math.round(Math.sin(c.frame * 2.3) * 12 * k), y: Math.round(Math.cos(c.frame * 1.9) * 9 * k) };
};
