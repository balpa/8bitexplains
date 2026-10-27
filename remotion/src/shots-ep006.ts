import { Buf, H, RGB, W, hex, lerp, smoothstep } from "./engine/pixel";
import { cover, drawFire, fineLine, glow, shadeAll } from "./engine/fine";
import { Mood, drawParts, ellipse, face, minus, part, roundRect, style, sweatDrop, tri, union } from "./engine/flat";
import { drawPip } from "./engine/hero";
import { GROUNDS, drawBurst, drawEarth, drawHouse, drawMolecule, drawSun, foreground, ground, pipClose, space } from "./engine/props";
import { drawPill } from "./engine/sprites";
import { Shot, ShotCtx, lineStart, split } from "./shot-kit";

// Solar superstorms: 1859, Quebec 1989, the July 2012 near miss (NOAA, NASA), v4 look (K1-K5,
// L31, L32): Pip as the protagonist, the Sun, the Earth and the machines as characters, numbers as
// pills, layered scenery or a layered space backdrop behind every shot.
// Layout: hook title y 55-90, subject y 95-205, captions y 215-227, reveal text y 110-150.

const WOOD = style("#c07a3a", "#844a22", "#f0b070");
const BRASS = style("#ffc23a", "#d0801e", "#fff1a0");
const PLASMA = style("#ff5ad0", "#c02a9a", "#ffc0f0");
const INK = "#140c26";
const SPARK = hex("#fff2b0");

// The storm (a coronal mass ejection): a wobbly magenta blob with a grin, charges orbiting it.
const drawBlob = (buf: Buf, cx: number, cy: number, r: number, mood: Mood, t: number, charges = true) => {
  glow(buf, cx, cy, r * 1.8, hex("#ff9ae8"), 0.8);
  const w = (i: number) => Math.sin(t * 5 + i * 1.9) * r * 0.08;
  drawParts(buf, [part(union(ellipse(0, 0, r, r * 0.9), ellipse(-r * 0.6, -r * 0.3 + w(1), r * 0.5, r * 0.45), ellipse(r * 0.5, -r * 0.45 + w(2), r * 0.45, r * 0.4), ellipse(-r * 0.4, r * 0.5 + w(3), r * 0.45, r * 0.4)), PLASMA), ...face(mood, [-r * 0.3, r * 0.3], -r * 0.05, r * 0.22)],
    { cx, cy, unit: 1, box: [-r * 1.2, -r * 1.1, r * 1.2, r * 1.1], edge: Math.max(0.4, r / 24) });
  if (charges) for (let i = 0; i < 4; i++) {
    const a = t * 2 + (i * Math.PI) / 2;
    drawPill(buf, i % 2 ? "-" : "+", cx + Math.cos(a) * r * 1.35, cy + Math.sin(a) * r * 1.1, i % 2 ? "#7a5af0" : "#ffd23f", i % 2 ? "#ffffff" : INK, 1);
  }
};

// Aurora curtains across the sky band y0..y1.
const AURORA = [hex("#3cf0a0"), hex("#ff6ad8"), hex("#8af8ff")];
const aurora = (buf: Buf, t: number, y0: number, y1: number, power = 1) =>
  shadeAll(buf, (x, y) => {
    for (let i = 0; i < 3; i++) {
      const mid = lerp(y0, y1, 0.25 + i * 0.25) + 10 * Math.sin(x * 0.045 + t * 1.1 + i * 2);
      const d = (y - (mid - 16)) / 26;
      if (d < 0 || d > 1) continue;
      const streak = 0.55 + 0.45 * Math.sin(x * 0.7 + i * 3 + t * 2);
      if (cover(x, y, d * streak * power)) return AURORA[i];
    }
    return null;
  }, 0, y0 - 30, W, y1 + 20);

// Telegraph poles with a sagging wire; `burn` sets the wire on fire.
const POLE = style("#a0663a", "#6a3e22", "#d09060");
const sag = (x: number, x0: number, x1: number, y: number) => y + 14 * (1 - ((2 * (x - x0)) / (x1 - x0) - 1) ** 2);
const wires = (buf: Buf, t: number, x0: number, x1: number, y: number, burn = 0, current = 0) => {
  for (const x of [x0, x1]) drawParts(buf, [part(union(roundRect(-2.5, -6, 2.5, 120, 1), roundRect(-10, -4, 10, 0, 1)), POLE)], { cx: x, cy: y, unit: 1, box: [-11, -7, 11, 121], edge: 0.6 });
  const col = current > 0 ? hex("#ffd23f") : hex(INK);
  for (let x = x0; x < x1; x += 0.5) fineLine(buf, x, sag(x, x0, x1, y), x + 0.5, sag(x + 0.5, x0, x1, y), col, 1.2);
  if (current > 0) for (let i = 0; i < 4; i++) {
    const x = lerp(x0, x1, (t * 0.6 + i / 4) % 1);
    drawMolecule(buf, x, sag(x, x0, x1, y) - 1, 4, "grin", style("#ffd23f", "#e08a1e", "#fff2b0"));
  }
  if (burn > 0) drawFire(buf, t, x0 + 8, x1 - 8, (x) => sag(x, x0, x1, y), 14 * burn, 0.9);
};

// The 1859 telegraph: a brass sounder with a face on a wooden board, key lever and paper tape.
const telegraph = (buf: Buf, cx: number, base: number, s: number, mood: Mood, t: number, fire = 0, sparks = 0) => {
  drawParts(buf, [
    part(roundRect(-34, -8, 34, 0, 3), WOOD),
    part(roundRect(-30, -12, -20, -8, 1), { fill: hex("#fbf8ef"), line: hex("#8a92b8") }),
    part(ellipse(14, -14, 20, 3, -0.25), BRASS),
    part(ellipse(30, -19, 5, 4), style("#3a2a4a", "#140c26", "#7a6a9a")),
    part(roundRect(-20, -34, 4, -8, 4), BRASS),
    ...face(mood, [-12, -3], -22, 3.6),
  ], { cx, cy: base, unit: s, box: [-36, -36, 36, 1], edge: s * 0.8 });
  if (sparks > 0 && Math.floor(t * 8) % 3 === 0) drawBurst(buf, cx - 8 * s, base - 34 * s, 10 * s, t, SPARK);
  if (fire > 0) drawFire(buf, t, cx - 36 * s, cx - 18 * s, () => base - 8 * s, 16 * fire * s, 0.9);
};

// Frame 0 and the outro's last frame (L26): Pip on the telegraph wire, the angry Sun in the sky.
const FLARE = 0.25;
const PIP0 = { x: 90, y: 140, size: 44 };
const wireFire = (buf: Buf, c: ShotCtx) => {
  ground(buf, GROUNDS.sky, c.t, 0, H, 44, 116);
  drawSun(buf, 44, 116, 22, "angry", c.t);
  const hit = c.t >= FLARE;
  if (hit && c.t < FLARE + 0.35) fineLine(buf, 60, 124, 90, 156, SPARK, 3);
  wires(buf, c.t, 20, 164, 150, smoothstep(FLARE, FLARE + 0.4, c.t));
  if (hit) drawBurst(buf, 92, 160, 16 * (1 - smoothstep(FLARE, 0.8, c.t) * 0.5), c.t, SPARK);
  const jump = smoothstep(FLARE, FLARE + 0.3, c.t);
  drawPip(buf, hit ? "puffed" : "look", PIP0.x + 8 * jump, PIP0.y - 22 * jump, PIP0.size, c.t, { look: { dx: -0.7, dy: -0.5 } });
};

const sunClose = (buf: Buf, c: ShotCtx) => {
  space(buf, GROUNDS.space, c.t, 90, 160);
  drawSun(buf, 90, 162, 46, "angry", c.t);
  for (let i = 0; i < 3; i++) {
    const a = -2.4 + i * 0.9 + Math.sin(c.t * 3 + i) * 0.1;
    fineLine(buf, 90 + Math.cos(a) * 60, 162 + Math.sin(a) * 60, 90 + Math.cos(a) * 80, 162 + Math.sin(a) * 80, SPARK, 2);
  }
};

const office1859 = (buf: Buf, c: ShotCtx, from: number) => {
  const t1 = c.t - from;
  ground(buf, GROUNDS.coral, c.t, 0, H, 90, 150);
  foreground(buf, GROUNDS.coral, c.t);
  drawParts(buf, [part(roundRect(-70, 0, 70, 8, 2), WOOD), part(roundRect(-60, 8, -52, 60, 1), WOOD), part(roundRect(52, 8, 60, 60, 1), WOOD)], { cx: 90, cy: 186, unit: 1, box: [-72, -1, 72, 61], edge: 1 });
  telegraph(buf, 70, 186, 1.2, t1 > 0.3 ? "shock" : "open", c.t, smoothstep(1.4, 2.2, t1), t1 > 0.2 ? 1 : 0);
  if (t1 > 0.2) drawPill(buf, "1859", 70, 120, "#ffd23f", INK, 2);
  drawPip(buf, t1 > 0.4 ? "puffed" : "look", 140, 162, 46, c.t, { look: { dx: -0.8, dy: 0.2 } });
};

const yourHouse = (buf: Buf, c: ShotCtx, from: number) => {
  const t1 = c.t - from;
  ground(buf, GROUNDS.dusk, c.t, 0, H, 70, 150);
  drawHouse(buf, 62, 204, 64, Math.floor(c.t * 7) % 5 !== 0);
  wires(buf, c.t, 112, 178, 130);
  drawPip(buf, "point", 128, 186, 44, c.t, { flip: true, look: { dx: -0.6, dy: -0.3 } });
  if (t1 > 0.4) drawPill(buf, "?", 140, 150, "#ffffff", INK, 3);
};

const hook: Shot = (buf, c) => {
  const l1 = lineStart(c, 1, 2.6);
  if (c.t < 0.85) return wireFire(buf, c);
  if (c.t < 1.7) return pipClose(buf, c.t, GROUNDS.yellow, "shock");
  if (c.t < l1) return sunClose(buf, c);
  if (c.t < l1 + 2.7) return office1859(buf, c, l1);
  yourHouse(buf, c, l1 + 2.7);
};

// Level 1: the Sun hurls the storm; it carries its charges, its weight on a pill, and the days
// count up on the Earth, where Pip stands watching it come.
const EARTH = { x: 134, y: 178, r: 26 };
const surface: Shot = (buf, c) => {
  const launch = 0.6, arrive = c.dur - 0.5;
  const k = smoothstep(launch, arrive, c.t);
  space(buf, GROUNDS.space, c.t, 20, 150);
  drawSun(buf, 4, 150, 58, c.t > launch ? "angry" : "smug", c.t);
  const bx = lerp(58, EARTH.x - 30, k), by = lerp(146, EARTH.y - 6, k) - Math.sin(k * Math.PI) * 26;
  if (c.t > launch) drawBlob(buf, bx, by, lerp(8, 18, k), "grin", c.t);
  const near = smoothstep(0.7, 1, k);
  drawEarth(buf, EARTH.x, EARTH.y, EARTH.r, near > 0.3 ? "shock" : "open", c.t, { dx: -0.8, dy: -0.2 });
  drawPip(buf, near > 0.3 ? "shock" : "look", EARTH.x + 2, EARTH.y - EARTH.r - 13, 26, c.t, { look: { dx: -0.8, dy: 0 } });
  if (c.t > 1.4 && c.t < 3.8) drawPill(buf, "BILLIONS OF TONS", 90, 104, "#ffffff", INK, 2);
  if (c.t > 4.2) drawPill(buf, `DAY ${Math.min(3, 1 + Math.floor((c.t - 4.2) / 0.6))}`, EARTH.x - 4, 120, "#ffd23f", INK, 2);
};

// Level 2: the magnetic field is the Earth's umbrella and the storm bounces off; then a storm
// whose field points south ("S" pill) shakes it, and the umbrella flaps.
const E2 = { x: 112, y: 168, r: 30 };
const umbrella = (buf: Buf, t: number, shake: number) => {
  const j = Math.sin(t * 38) * 3 * shake;
  const canopy = minus(ellipse(0, 0, 56, 64), ellipse(12, 0, 54, 66));
  drawParts(buf, [
    part(roundRect(-44, -1.2, -28, 1.2, 1), style("#3a2a4a", "#140c26", "#7a6a9a")),
    part(canopy, style("#3ce0ff", "#1290d8", "#c0f8ff")),
    part((x, y) => canopy(x, y) && Math.floor((y + 64) / 16) % 2 === 1, style("#ff6ad8", "#c02a9a", "#ffc0f0")),
  ], { cx: E2.x + j, cy: E2.y + j * 0.5, unit: 1, box: [-58, -66, -26, 66], edge: 1 });
};
const shield: Shot = (buf, c) => {
  const l1 = lineStart(c, 1, 2.9);
  const hit = smoothstep(l1 + 0.9, l1 + 1.2, c.t);
  space(buf, GROUNDS.space, c.t, 20, 160);
  for (let i = 0; i < 10; i++) {
    const p = (c.t * 0.7 + i / 10) % 1;
    const y0 = 110 + ((i * 29) % 110);
    const x = p < 0.6 ? lerp(-6, 56, p / 0.6) : 56 - (p - 0.6) * 60;
    const y = p < 0.6 ? y0 : y0 + (y0 < E2.y ? -1 : 1) * (p - 0.6) * 110;
    drawPill(buf, i % 2 ? "-" : "+", x, y, i % 2 ? "#7a5af0" : "#ffd23f", i % 2 ? "#ffffff" : INK, 1);
  }
  if (c.t > l1 - 0.2) {
    const k = smoothstep(l1 - 0.2, l1 + 1, c.t);
    const bx = lerp(-20, 34, k);
    drawBlob(buf, bx, 150, 18, "angry", c.t, false);
    drawPill(buf, "S", bx, 186, "#ff4a4a", "#ffffff", 2);
    drawParts(buf, [part(union(roundRect(-1.5, -10, 1.5, 4, 1), tri(-5, 3, 5, 3, 0, 9)), { fill: hex("#ffffff") })], { cx: bx + 12, cy: 182, unit: 1, box: [-6, -11, 6, 10], outline: hex(INK) });
  }
  umbrella(buf, c.t, hit * (1 - smoothstep(l1 + 2.6, c.dur, c.t) * 0.6));
  drawEarth(buf, E2.x, E2.y, E2.r, hit > 0 ? "shock" : "grin", c.t, { dx: -0.6, dy: 0 });
  drawPip(buf, hit > 0 ? "puffed" : "shades", E2.x + 18, E2.y - E2.r - 12, 28, c.t, { look: { dx: -0.8, dy: 0 } });
};

// Level 3: the shaking field (aurora) drives current along the long wires (little charges racing),
// the generator trick (a shaking magnet lights a bulb), then the 1859 office: the operator shocked,
// the tape alight.
const longWires = (buf: Buf, c: ShotCtx) => {
  ground(buf, GROUNDS.dusk, c.t, 0, H, 90, 110);
  aurora(buf, c.t, 96, 140, 0.9);
  wires(buf, c.t, 6, 174, 160, 0, 1);
  drawPip(buf, "look", 40, 140, 36, c.t, { look: { dx: 0.8, dy: 0.3 } });
};
const MAGNET = style("#ff4a4a", "#c0243a", "#ffb0a0");
const generator = (buf: Buf, c: ShotCtx, from: number) => {
  const t1 = c.t - from;
  ground(buf, GROUNDS.yellow, c.t, 0, H, 130, 140);
  foreground(buf, GROUNDS.yellow, c.t);
  const shake = Math.sin(c.t * 20) * 5;
  drawParts(buf, [part(minus(roundRect(-18, -22, 18, 22, 10), roundRect(-8, -10, 8, 23, 4)), MAGNET), part(union(roundRect(-18, 12, -8, 22, 1), roundRect(8, 12, 18, 22, 1)), style("#e0e6f4", "#8a92b8", "#ffffff")), ...face(t1 > 0.3 ? "grin" : "open", [-6, 6], -14, 3)],
    { cx: 46 + shake, cy: 170, unit: 1, box: [-20, -24, 20, 24], edge: 0.8 });
  for (let i = 0; i < 5; i++) drawParts(buf, [part(minus(ellipse(0, 0, 6, 12), ellipse(0, 0, 4, 10)), style("#ff8a3d", "#c4482a", "#ffd0a0"))], { cx: 76 + i * 5, cy: 172, unit: 1, box: [-7, -13, 7, 13], edge: 0.4 });
  for (let x = 100; x < 128; x += 0.5) buf.dot(x, 172, hex(INK));
  const lit = smoothstep(0.2, 0.6, t1) * (0.7 + 0.3 * Math.abs(Math.sin(c.t * 20)));
  if (lit > 0.2) glow(buf, 136, 150, 30 * lit, SPARK, 1);
  drawParts(buf, [part(ellipse(0, -8, 11, 12), lit > 0.2 ? style("#fff2b0", "#ffd23f", "#ffffff") : style("#d8e0f0", "#9aa4c0", "#ffffff")), part(roundRect(-5, 2, 5, 12, 1), style("#c8d0e6", "#8a92b8", "#ffffff")), ...face(lit > 0.2 ? "grin" : "blink", [-4, 4], -9, 2.6)],
    { cx: 136, cy: 158, unit: 1, box: [-12, -21, 12, 13], edge: 0.6 });
  drawPip(buf, "point", 130, 112, 30, c.t, { flip: true, look: { dx: -0.6, dy: 0.6 } });
};
const office: Shot = (buf, c) => {
  const l1 = lineStart(c, 1, 6.0);
  const gen = 3.9;
  if (c.t < gen) return longWires(buf, c);
  if (c.t < l1) return generator(buf, c, gen);
  office1859(buf, c, l1);
};

// The peak (L28, L29): the transformer sweats and overloads in 1989; then Quebec's windows go out
// while the timer counts 90 seconds, the 6,000,000 pill lands, and Pip reacts in close-up.
const transformer = (buf: Buf, c: ShotCtx, l1: number) => {
  const over = smoothstep(l1 - 1.0, l1 - 0.6, c.t);
  ground(buf, GROUNDS.night, c.t, 0, H, 90, 150);
  aurora(buf, c.t, 96, 130, 0.8);
  const body = style("#7aa0c0", "#4a6a90", "#c8e4f4");
  const jit = over > 0 ? Math.sin(c.t * 40) * 1.5 : 0;
  drawParts(buf, [
    part(union(...[-30, -24, 24, 30].map((x) => roundRect(x - 2, -44, x + 2, -6, 1))), body),
    part(roundRect(-24, -52, 24, 0, 4), body),
    ...[-14, 0, 14].map((x) => part(union(ellipse(x, -58, 5, 2.5), ellipse(x, -64, 4, 2.2), ellipse(x, -70, 3, 2)), style("#ffffff", "#a0a8c8", "#ffffff"))),
    ...face(over > 0 ? "shock" : c.t > 1.4 ? "angry" : "open", [-9, 9], -28, 6),
    ...(c.t > 1.6 ? [sweatDrop(20, -42, 0.9)] : []),
  ], { cx: 90 + jit, cy: 204, unit: 1, box: [-34, -74, 34, 1], edge: 1.2 });
  if (c.t > 0.4) drawPill(buf, "1989", 90, 100, "#ffd23f", INK, 2);
  if (over > 0) for (let i = 0; i < 3; i++) if (Math.floor(c.t * 9 + i) % 3 === 0) drawBurst(buf, 76 + i * 14, 140, 9, c.t, SPARK);
  drawPip(buf, over > 0 ? "puffed" : "look", 146, 186, 34, c.t, { flip: true, look: { dx: -0.8, dy: -0.3 } });
};
const TOWERS = [[14, 58, "#7a4af0"], [38, 84, "#3a6af0"], [64, 66, "#c04ac0"], [92, 100, "#4a5af0"], [120, 72, "#8a3ad0"], [148, 90, "#3a8ae0"]] as const;
const city = (buf: Buf, c: ShotCtx, l1: number) => {
  const t1 = c.t - l1;
  const dark = smoothstep(0.9, 2.8, t1);
  ground(buf, GROUNDS.night, c.t, 0, H, 90, 160);
  aurora(buf, c.t, 92, 128, 0.8);
  TOWERS.forEach(([x, h, col], i) => {
    const base = hex(col);
    drawParts(buf, [part(roundRect(-12, -h, 12, 0, 2), { fill: base, shade: base.map((v) => v * 0.7) as RGB, light: base.map((v) => Math.min(255, v * 1.35)) as RGB })], { cx: x, cy: 210, unit: 1, box: [-13, -h - 1, 13, 1], edge: 1 });
    for (let wy = 210 - h + 6; wy < 204; wy += 7) for (const wx of [-7, -1, 5]) {
      const off = (i * 7 + wx + wy) % 10 < dark * 10;
      buf.rect(x + wx, wy, 3, 3, off ? hex("#1a1048") : hex("#ffd23f"));
    }
  });
  drawParts(buf, face(dark > 0.6 ? "shock" : "open", [-5, 5], 0, 3.6), { cx: 92, cy: 128, unit: 1, box: [-10, -6, 10, 6], edge: 0.3 });
  if (t1 > 0.8) drawPill(buf, `${Math.round(90 * smoothstep(0.9, 2.8, t1))} SEC`, 90, 98, "#ffd23f", INK, 2);
  if (t1 > 3.0) drawPill(buf, "6,000,000", 90, 160, "#ffffff", INK, 2);
};
const quebec: Shot = (buf, c) => {
  const l1 = lineStart(c, 1, 4.3);
  if (c.t > c.dur - 1.1) return pipClose(buf, c.t, GROUNDS.night, "look", true);
  if (c.t < l1) return transformer(buf, c, l1);
  city(buf, c, l1);
};

// The answer: in 2012 a storm that strong crossed the Earth's path where the Earth had been about
// a week before. The Earth (and Pip on it) wipe their brows.
const nearmiss: Shot = (buf, c) => {
  const k = smoothstep(0.2, c.dur - 0.3, c.t);
  space(buf, GROUNDS.space, c.t, 10, 110);
  drawSun(buf, -4, 104, 34, "smug", c.t);
  const orbit = (a: number) => ({ x: 90 + 118 * Math.sin(a), y: 206 - 70 * Math.cos(a) });
  for (let a = -0.95; a < 0.95; a += 0.02) {
    const p = orbit(a);
    if (Math.floor(a * 50) % 2 === 0) for (const d of [0, 0.5]) buf.dot(p.x + d, p.y, hex("#c8d0ff"));
  }
  const cp = orbit(-0.42), ep = orbit(lerp(-0.05, 0.42, k));
  const bk = smoothstep(0.05, 0.75, k);
  const bx = lerp(16, cp.x, bk), by = lerp(112, cp.y, bk);
  drawBlob(buf, bx, by, 13, "angry", c.t, false);
  drawEarth(buf, ep.x, ep.y, 20, k > 0.6 ? "grin" : "shock", c.t, { dx: -0.8, dy: -0.4 });
  drawPip(buf, k > 0.6 ? "grin" : "shock", ep.x + 2, ep.y - 31, 24, c.t, { sweat: k > 0.6 });
  if (c.t > 0.3) drawPill(buf, "2012", Math.max(26, bx), by - 24, "#ffd23f", INK, 2);
  if (k > 0.75) drawPill(buf, "1 WEEK", (cp.x + ep.x) / 2, 180, "#ffffff", INK, 2);
};

// Aftermath (L25): the phone's map pin spins and the radio hisses, the lights go out and Pip lights
// a candle; then the 1859 aurora, bright enough for Pip to read the paper by.
const gadgets = (buf: Buf, c: ShotCtx) => {
  ground(buf, GROUNDS.cyan, c.t, 0, H, 90, 150);
  foreground(buf, GROUNDS.cyan, c.t);
  const spin = Math.sin(c.t * 9) * 8;
  drawParts(buf, [part(roundRect(-15, -27, 15, 27, 5), style("#3a2a5a", "#1a1038", "#7a6a9a")), part(roundRect(-12, -22, 12, 20, 2), style("#8ae8ff", "#3ab0e0", "#e0fbff")), part(union(ellipse(-4, -6, 8, 5), ellipse(5, 8, 6, 6)), style("#4cd85a", "#22a044", "#b0f490"))], { cx: 46, cy: 160, unit: 1, box: [-16, -28, 16, 28], edge: 0.8 });
  drawParts(buf, [part(union(ellipse(0, -6, 6, 6), tri(-5, -3, 5, -3, 0, 6)), style("#ff4a4a", "#c0243a", "#ffb0a0")), ...face("shock", [-2.2, 2.2], -6.5, 1.8)], { cx: 46 + spin, cy: 156, unit: 1, box: [-7, -13, 7, 7], edge: 0.4 });
  drawParts(buf, [part(roundRect(-1, -40, 1, -14, 1), style("#c8d0e6", "#8a92b8", "#ffffff")), part(roundRect(-24, -16, 24, 14, 4), style("#ff8a3d", "#c4482a", "#ffd0a0")), part(ellipse(-9, 0, 9, 9), style("#5a3a2a", "#2a1a12", "#8a6a4a")), ...face("angry", [7, 16], -3, 3.4)],
    { cx: 132, cy: 170, unit: 1, box: [-25, -41, 25, 15], edge: 0.8 });
  for (let i = 0; i < 3; i++) {
    const y = 140 + i * 10, ph = Math.floor(c.t * 12 + i);
    for (let x = 160; x < 176; x += 4) fineLine(buf, x, y + (((x + ph) / 4) % 2 ? 3 : -3), x + 4, y + (((x + 4 + ph) / 4) % 2 ? 3 : -3), hex("#ffffff"), 1);
  }
  drawPip(buf, "look", 90, 196, 34, c.t, { look: { dx: Math.sin(c.t * 3), dy: -0.4 } });
  drawPill(buf, "?", 90, 162, "#ffffff", INK, 2);
};
const candle = (buf: Buf, c: ShotCtx, from: number) => {
  const out = smoothstep(from + 0.8, from + 1.0, c.t);
  ground(buf, out > 0.5 ? GROUNDS.night : GROUNDS.dusk, c.t, 0, H, 90, 150);
  drawHouse(buf, 90, 206, 92, out < 0.5);
  if (out > 0.5) {
    glow(buf, 128, 176, 26, SPARK, 0.9);
    drawParts(buf, [part(roundRect(-2.5, -10, 2.5, 0, 1), style("#fbf8ef", "#c8b08a", "#ffffff"))], { cx: 128, cy: 188, unit: 1, box: [-3, -11, 3, 1], edge: 0.3 });
    drawFire(buf, c.t, 126, 130, () => 178, 6, 0.6);
  }
  drawPip(buf, out > 0.5 ? "look" : "grin", 148, 194, 36, c.t, { flip: true, look: { dx: -0.8, dy: 0 } });
};
const reading = (buf: Buf, c: ShotCtx) => {
  ground(buf, GROUNDS.night, c.t, 0, H, 90, 120);
  aurora(buf, c.t, 92, 150, 1);
  drawPip(buf, "look", 90, 176, 58, c.t, { look: { dx: 0, dy: 0.6 } });
  drawParts(buf, [part(roundRect(-22, -14, 22, 14, 1), style("#fbf8ef", "#c8c0d8", "#ffffff")), part(roundRect(-1, -14, 1, 14, 0.5), { fill: hex("#c8c0d8") })], { cx: 90, cy: 198, unit: 1, box: [-23, -15, 23, 15], edge: 0.6 });
  for (let i = 0; i < 4; i++) for (const x of [70, 93]) buf.rect(x, 190 + i * 4, 17 - (i % 2) * 5, 1, hex("#8a82a8"));
};
const blackout: Shot = (buf, c) => {
  const l1 = lineStart(c, 1, 4.8);
  if (c.t < 2.2) return gadgets(buf, c);
  if (c.t < l1) return candle(buf, c, 2.2);
  reading(buf, c);
};

// Loop (L26): a satellite with a face keeps watch on the Sun, Pip waves at it; then the picture
// settles on frame 0 so "...because" runs into "the Sun can set your wires on fire."
const watch: Shot = (buf, c) => {
  space(buf, GROUNDS.space, c.t, 20, 130);
  drawSun(buf, 10, 130, 34, "smug", c.t);
  drawParts(buf, [
    part(union(roundRect(-38, -6, -14, 6, 1), roundRect(14, -6, 38, 6, 1)), style("#3a6af0", "#2240b0", "#9ab8ff")),
    part(roundRect(-12, -12, 12, 12, 2), BRASS),
    part(ellipse(-10, -16, 7, 3, -0.6), style("#e0e6f4", "#8a92b8", "#ffffff")),
    ...face("open", [-5, 5], 0, 3.6, { dx: -0.9, dy: -0.2 }),
  ], { cx: 108, cy: 140 + Math.sin(c.t * 2) * 3, unit: 1.2, box: [-40, -20, 40, 14], edge: 1 });
  drawPip(buf, Math.floor(c.t * 2) % 2 ? "grin" : "point", 128, 190, 40, c.t, { flip: true, look: { dx: -0.6, dy: -0.4 } });
};
const frame0: Shot = (buf, c) => wireFire(buf, { ...c, t: 0 });
const outro: Shot = (buf, c) => split(c, c.dur - 1.3, watch, frame0, 0.8);

export const EP006_SHOTS: Record<string, Shot> = {
  "sun-hook": hook,
  "sun-surface": surface,
  "sun-shield": shield,
  "sun-office": office,
  "sun-quebec": quebec,
  "sun-nearmiss": nearmiss,
  "sun-blackout": blackout,
  "sun-outro": outro,
};

// The wire catching fire and the transformer's overload jolt the frame.
export const ep006Shake = (visual: string, c: ShotCtx) => {
  if (visual !== "sun-hook" && visual !== "sun-quebec") return null;
  const at = visual === "sun-hook" ? FLARE : lineStart(c, 1, 4.3) - 1.0;
  const k = smoothstep(at - 0.02, at + 0.08, c.t) * (1 - smoothstep(at + 0.4, at + 0.9, c.t)) * (visual === "sun-hook" ? 1 : 0.6);
  return { x: Math.round(Math.sin(c.frame * 2.3) * 12 * k), y: Math.round(Math.cos(c.frame * 1.9) * 9 * k) };
};
