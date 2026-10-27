import { Buf, clamp01, hex, lerp, smoothstep } from "./engine/pixel";
import { drawBolt, drawFire, drawRings, glow, makeBolt } from "./engine/fine";
import { Mood, drawParts, ellipse, face, part, roundRect, style, tri, union } from "./engine/flat";
import { drawPip } from "./engine/hero";
import {
  GROUNDS,
  drawBalloon4,
  drawBurst,
  drawCloud,
  drawCrystal,
  drawHail,
  drawHill,
  drawHouse,
  drawKettle,
  drawMolecule,
  drawSun,
  drawTree,
  ground,
  pipClose,
} from "./engine/props";
import { drawPill } from "./engine/sprites";
import { Shot, ShotCtx, lineStart, push, split } from "./shot-kit";

// Lightning, v4 look (docs/research/kurzgesagt-quality.md, K1-K5): Pip as the protagonist, one big
// subject per shot on a bright flat ground, faces on things, numbers as pills on their objects.
// Layout: hook title y 55-90, subject y 95-205, captions y 205-217.

const BOLT_GLOW = hex("#c9a6ff");
const STRIKE = 0.18;
const HIT = { x: 140, y: 196 };
const PIP0 = { x: 74, y: 166, size: 72 };
const flashAt = (t: number, at: number) => (t < at ? 0 : Math.exp(-(t - at) * 4.5));

// Frame 0 and the outro's last frame (L26): Pip on the hill under the storm, the bolt on its way.
const storm = (buf: Buf, t: number, flash: number) => {
  ground(buf, flash > 0.45 ? ["#d8d0ff", "#e4deff", "#f0ecff"] : GROUNDS.storm, t);
  drawCloud(buf, 92, 30, 170, "angry", t, true, { dx: 0.4, dy: 0.5 });
  drawHill(buf, 196);
  drawHouse(buf, 22, 204, 26);
};
const bolt = (buf: Buf, seed: number, reach: number, x0 = 118, y0 = 44, x1 = HIT.x, y1 = HIT.y, width = 2.6) =>
  drawBolt(buf, makeBolt(seed, x0, y0, x1, y1, 8, 3), reach, BOLT_GLOW, hex("#ffffff"), width);

// Hook (L27): the strike lands beside Pip, Pip's shocked face, the Sun against the bolt, then the
// grumpy cloud with Pip asking how.
const hookStrike: Shot = (buf, c) => {
  const f = flashAt(c.t, STRIKE);
  storm(buf, c.t, f);
  const reach = lerp(0.45, 1, smoothstep(0, STRIKE, c.t));
  bolt(buf, 4, reach);
  if (c.t > STRIKE) {
    drawBurst(buf, HIT.x, HIT.y, 26 * (1 - smoothstep(STRIKE, 0.8, c.t) * 0.5), c.t, BOLT_GLOW);
    drawRings(buf, HIT.x, HIT.y, (c.t - STRIKE) * 1.4, hex("#ffffff"), 120, 2, 0.7);
  }
  drawPip(buf, c.t < STRIKE ? "look" : "puffed", PIP0.x, PIP0.y, PIP0.size, c.t, { look: { dx: 0.7, dy: -0.3 } });
};

const sunVsBolt = (buf: Buf, c: ShotCtx, from: number) => {
  ground(buf, GROUNDS.yellow, c.t, 0, 320, 134, 166);
  const k = smoothstep(from, from + 0.35, c.t);
  drawSun(buf, 50, 166, 30, "shock", c.t, true);
  drawPill(buf, "10,000°F", 48, 112, "#ffffff", "#140c26", 2);
  glow(buf, 134, 166, 50 * k, BOLT_GLOW, 0.9);
  bolt(buf, 11, k, 126, 120, 140, 240, 4);
  drawParts(buf, face("smug", [-6, 6], 0, 4.5), { cx: 134, cy: 166, unit: 1, box: [-12, -8, 12, 8], edge: 0.3 });
  if (k > 0.6) drawPill(buf, "50,000°F", 134, 104, "#ffd23f", "#140c26", 2);
};

const cloudAsk = (buf: Buf, c: ShotCtx, from: number) => {
  ground(buf, GROUNDS.sky, c.t, 0, 320, 90, 100);
  const k = smoothstep(from, c.dur, c.t);
  drawCloud(buf, 90, lerp(96, 102, k), lerp(150, 168, k), "angry", c.t, false, { dx: 0.2, dy: 0.6 });
  if (Math.floor(c.t * 6) % 5 === 0) bolt(buf, Math.floor(c.t * 6), 0.5, 80, 120, 70, 170, 1.5);
  drawPip(buf, "look", 120, 186, 54, c.t, { look: { dx: -0.4, dy: -0.8 } });
  if (c.t > from + 0.4) drawPill(buf, "?", 142, 150, "#ffffff", "#140c26", 3);
};

const hook: Shot = (buf, c) => {
  const l1 = lineStart(c, 1, 2.9);
  if (c.t < 0.8) return hookStrike(buf, c);
  if (c.t < 1.65) return pipClose(buf, c.t, GROUNDS.cyan, "shock");
  if (c.t < 2.6) return sunVsBolt(buf, c, 1.65);
  cloudAsk(buf, c, Math.min(2.6, l1));
};

// Level 1, the charge: inside the cloud, rising air smashes ice and hail; then ice turns positive
// and floats up, hail turns negative and sinks. Pip's crest stands on end.
const ICE = Array.from({ length: 5 }, (_, i) => ({ x: 30 + ((i * 47) % 120), y: 136 + ((i * 31) % 50) }));
const HAIL = Array.from({ length: 4 }, (_, i) => ({ x: 46 + ((i * 59) % 96), y: 150 + ((i * 37) % 44) }));
const cloud: Shot = (buf, c) => {
  const l1 = lineStart(c, 1, 4.2);
  const sep = smoothstep(l1 + 0.3, l1 + 2.6, c.t);
  const Z = push(1 + 0.4 * smoothstep(1.4, 3.2, c.t) - 0.4 * smoothstep(l1 - 0.2, l1 + 0.8, c.t), 90, 165);
  ground(buf, GROUNDS.sky, c.t);
  const body = style("#9474ff", "#6a48f0", "#c8b8ff");
  const top = style("#ffe48a", "#f0b840", "#fff6c8");
  drawParts(buf, [
    part(union(ellipse(0, -20, 74, 54), ellipse(-40, 20, 44, 40), ellipse(40, 20, 44, 40), roundRect(-80, 0, 80, 64, 18)), body),
    ...(sep > 0 ? [part((x, y) => ellipse(0, -20, 74, 54)(x, y) && y < -20 - 20 * (1 - sep) + 10 * sep - 30, top)] : []),
  ], { cx: Z.x(90), cy: Z.y(150), unit: Z.s(1), box: [-86, -78, 86, 68], edge: 1.4 });
  // Rising air: chevrons drifting up through the middle.
  for (let k = 0; k < 6; k++) {
    const y = 210 - ((c.t * 26 + k * 18) % 108);
    drawParts(buf, [part(union(tri(-10, 5, 0, -5, 0, 1), tri(10, 5, 0, -5, 0, 1)), { fill: hex("#ffffff") })], { cx: Z.x(90 + (k % 2 ? -18 : 18)), cy: Z.y(y), unit: Z.s(1), box: [-11, -6, 11, 6], outline: hex("#9a8ef0") });
  }
  const smash = 1 - sep;
  ICE.forEach((p, i) => {
    const jx = Math.sin(c.t * 9 + i) * 3 * smash, jy = Math.cos(c.t * 7 + i * 2) * 2 * smash;
    const x = Z.x(p.x + jx), y = Z.y(lerp(p.y, 104 + (i % 3) * 10, sep) + jy);
    drawCrystal(buf, x, y, Z.s(9), sep > 0.3 ? "grin" : "shock");
    if (sep > 0.2) drawPill(buf, "+", x + 10, y - 11, "#ffd23f", "#140c26", 1);
  });
  HAIL.forEach((p, i) => {
    const jx = Math.cos(c.t * 8 + i) * 3 * smash;
    const x = Z.x(p.x + jx), y = Z.y(lerp(p.y, 190 + (i % 2) * 8, sep));
    drawHail(buf, x, y, Z.s(10), sep > 0.3 ? "angry" : "shock");
    if (sep > 0.2) drawPill(buf, "-", x + 11, y - 12, "#7a5af0", "#ffffff", 1);
  });
  drawPip(buf, sep > 0.5 ? "puffed" : "look", Z.x(156), Z.y(196), Z.s(44), c.t, { look: { dx: -0.8, dy: -0.6 } });
};

// Level 2, the spark: a line of air molecules holds the charges apart, sweats, then breaks into one
// giant spark. The camera pushes in on the strain and cuts back wide on the break.
const strike: Shot = (buf, c) => {
  const l1 = lineStart(c, 1, 4.6);
  const brk = l1 + 0.6;
  const broken = smoothstep(brk, brk + 0.5, c.t);
  const strain = smoothstep(0.6, brk, c.t);
  const f = flashAt(c.t, brk);
  const Z = push(c.t < brk ? 1 + 0.5 * smoothstep(1.0, 4.4, c.t) : 1, 90, 150);
  ground(buf, f > 0.4 ? ["#e8e4ff", "#f0ecff", "#faf8ff"] : GROUNDS.steel, c.t);
  drawParts(buf, [part(union(...[-70, -36, 0, 36, 70].map((x, i) => ellipse(x, -6 + (i % 2) * 6, 30, 24)), roundRect(-100, -40, 100, 10, 0)), style("#5a3ab8", "#3e2890", "#8a6ae0"))],
    { cx: Z.x(90), cy: Z.y(40), unit: Z.s(1), box: [-100, -50, 100, 40], edge: 1.2 });
  for (const x of [30, 90, 150]) drawPill(buf, "-", Z.x(x), Z.y(58), "#7a5af0", "#ffffff", 2);
  drawHill(buf, Z.y(214));
  for (const x of [34, 90, 146]) drawPill(buf, "+", Z.x(x), Z.y(232), "#ffd23f", "#140c26", 2);
  if (c.t < brk) for (let k = 0; k < 3; k++) if (Math.floor(c.t * 10 + k) % 4 === 0) bolt(buf, Math.floor(c.t * 10) + k, 0.5 + strain * 0.3, Z.x(30 + k * 60), Z.y(64), Z.x(36 + k * 58), Z.y(130), 1.2 * Z.s(1));
  const n = 5;
  for (let i = 0; i < n; i++) {
    const x0 = 22 + i * 34, y0 = 150 + Math.sin(c.t * 18 + i) * 2 * strain;
    const away = broken * (i < 2 ? -1 : i > 2 ? 1 : 0);
    const x = Z.x(x0 + away * 60), y = Z.y(y0 - broken * (i === 2 ? 90 : 20));
    if (i < n - 1 && broken < 0.05) drawParts(buf, [part(roundRect(0, -1.5, 34, 1.5, 1), style("#9ad8ff", "#4f9ae0"))], { cx: Z.x(x0), cy: Z.y(y0), unit: Z.s(1), box: [0, -3, 34, 3], edge: 0.3 });
    if (i === 2 && broken > 0.5) continue;
    drawMolecule(buf, x, y, Z.s(13), broken > 0 ? "shock" : strain > 0.6 ? "angry" : "open", undefined, { dx: 0, dy: -0.6 });
    if (strain > 0.5 && broken < 0.5) drawParts(buf, [part(ellipse(0, 0, 2.5, 3.2), style("#7fe8ff", "#1d6fa8", "#ffffff"))], { cx: x + Z.s(12), cy: y - Z.s(12) + ((c.t * 20 + i * 3) % 6), unit: Z.s(1), box: [-4, -5, 4, 5], edge: 0.3 });
  }
  if (c.t > brk) {
    glow(buf, 90, 140, 70, BOLT_GLOW, 1 - broken * 0.3);
    bolt(buf, 21, smoothstep(brk - 0.05, brk + 0.08, c.t), 92, 50, 96, 224, 5);
    drawBurst(buf, 96, 220, 30, c.t, BOLT_GLOW);
  }
};

// Level 3, the heat: the channel heats the air around it, then the heat ladder (kettle, lava, the
// Sun, the bolt), Pip in shades by the Sun, and a sweating close-up at the end.
const BAR = [
  { x: 26, h: 34, label: "212°F" },
  { x: 68, h: 62, label: "2,000°F" },
  { x: 110, h: 100, label: "10,000°F" },
  { x: 154, h: 240, label: "50,000°F" },
];
const BASE = 210;
const channel = (buf: Buf, c: ShotCtx, end: number) => {
  ground(buf, GROUNDS.storm, c.t);
  const heat = smoothstep(0.2, end, c.t);
  glow(buf, 90, 150, 80, BOLT_GLOW, 0.9);
  bolt(buf, 30 + Math.floor(c.t * 8), 1, 86, -10, 94, 330, 7);
  for (let i = 0; i < 6; i++) {
    const a = i * 1.05 + c.t * 0.6, r = 44 + (i % 2) * 18;
    const hot = clamp01(heat * 1.4 - i * 0.08);
    const col = hot > 0.5 ? style("#ff6a3a", "#c03a2a", "#ffc0a0") : style("#5cbcff", "#2a7ae0", "#bfe6ff");
    drawMolecule(buf, 90 + Math.cos(a) * r, 150 + Math.sin(a) * r * 1.3, 11 + Math.sin(c.t * 30 + i) * hot, hot > 0.5 ? "shock" : "open", col);
  }
  drawPill(buf, `${Math.round(lerp(70, 50000, heat * heat) / 10) * 10}°F`.replace(/\B(?=(\d{3})+(?!\d))/g, ","), 90, 66, "#ffd23f", "#140c26", 2);
};

const ladder = (buf: Buf, c: ShotCtx, at: number[]) => {
  ground(buf, GROUNDS.coral, c.t, 0, 320, 110, 110);
  const cols = [style("#5aa8ff", "#2a6ad0", "#bfe6ff"), style("#ff6a3a", "#c03a2a", "#ffb080"), style("#ffd23f", "#e08a1e", "#fff2b0"), style("#b8a0ff", "#7a5ae0", "#ffffff")];
  BAR.forEach((b, i) => {
    const g = smoothstep(at[i], at[i] + 0.8, c.t);
    if (g <= 0) return;
    const top = BASE - b.h * g;
    drawParts(buf, [part(roundRect(-14, top - BASE, 14, 0, 4), cols[i])], { cx: b.x, cy: BASE, unit: 1, box: [-15, -BASE - 4, 15, 1], edge: 1 });
    const oy = Math.max(30, top - 18);
    const mood: Mood = i === 3 ? "smug" : i === 2 ? "shock" : "open";
    if (i === 0) drawKettle(buf, b.x, oy + 4, 20, c.t > at[1] ? "shock" : "open", c.t);
    else if (i === 1) drawParts(buf, [part(ellipse(0, 0, 18, 13), style("#ff6a3a", "#b02a1a", "#ffd23f")), ...face("smug", [-6, 6], -1, 4)], { cx: b.x, cy: oy, unit: 1, box: [-19, -14, 19, 14], edge: 0.7 });
    else if (i === 2) drawSun(buf, b.x, oy, 17, c.t > at[3] ? "shock" : "open", c.t, c.t > at[3]);
    else {
      glow(buf, b.x, Math.max(20, top), 30, BOLT_GLOW, 0.8);
      bolt(buf, 40 + Math.floor(c.t * 10), 1, b.x - 4, Math.max(-20, top - 40), b.x + 3, Math.max(14, top + 4), 2.4);
      drawParts(buf, face(mood, [-5, 5], 0, 3.6), { cx: b.x, cy: Math.max(30, top + 14), unit: 1, box: [-10, -6, 10, 6], edge: 0.3 });
    }
    if (c.t >= at[i] + 0.4) drawPill(buf, b.label, i === 3 ? 120 : Math.min(156, Math.max(24, b.x)), i === 3 ? 60 : Math.max(16, oy - 26), i === 3 ? "#ffd23f" : "#ffffff", "#140c26", i === 3 ? 2 : 1);
  });
  if (c.t > at[2] + 0.4) drawPip(buf, c.t > at[3] + 0.4 ? "puffed" : "shades", 70, 196, 44, c.t, { look: { dx: 0.8, dy: -0.6 } });
};

const heat: Shot = (buf, c) => {
  const l1 = lineStart(c, 1, 3.6), l2 = lineStart(c, 2, 8.3);
  if (c.t < l1 - 0.1) return channel(buf, c, l1 - 0.3);
  if (c.t > l2 + 2.8) return pipClose(buf, c.t, GROUNDS.coral, "look", true);
  ladder(buf, c, [l1 + 0.2, l1 + 2.6, l2 + 0.1, l2 + 1.5]);
};

// Level 4, the boom: Pip pokes a balloon, it pops and blows Pip away; then the sky pops its
// balloon and Pip covers its ears.
const balloon: Shot = (buf, c) => {
  const popAt = lineStart(c, 1, 4.3) - 1.3;
  const pop = clamp01((c.t - popAt) / 0.9);
  ground(buf, GROUNDS.yellow, c.t, 0, 320, 90, 120);
  if (pop <= 0) {
    const grow = smoothstep(0, popAt, c.t);
    drawBalloon4(buf, 90, 120, lerp(26, 40, grow), grow > 0.7 ? "shock" : "open", c.t);
    const reach = smoothstep(popAt - 0.8, popAt, c.t);
    drawPip(buf, "look", lerp(54, 74, reach), lerp(196, 176, reach), 56, c.t, { look: { dx: 0.5, dy: -0.8 } });
    return;
  }
  drawBurst(buf, 90, 120, 40 * (1 - pop * 0.6), c.t, hex("#ffffff"));
  drawRings(buf, 90, 120, pop * 1.6, hex("#c02a3a"), 160, 3);
  for (let i = 0; i < 12; i++) {
    const a = i * 0.52 + 0.3, d = 20 + pop * 80;
    drawParts(buf, [part(tri(-3, -2, 3, -2, 0, 4), style("#ff4a4a", "#c02a3a"))], { cx: 90 + Math.cos(a) * d, cy: 120 + Math.sin(a) * d + pop * pop * 30, unit: 1, box: [-4, -3, 4, 5], edge: 0.2 });
  }
  drawPip(buf, "puffed", lerp(74, 20, pop), lerp(176, 230, pop), 56, c.t, { flip: true });
};
const skyPop: Shot = (buf, c) => {
  const at = lineStart(c, 1, 4.3) + 0.1;
  const f = flashAt(c.t, at);
  ground(buf, f > 0.4 ? ["#d8d0ff", "#e4deff", "#f0ecff"] : GROUNDS.storm, c.t);
  drawCloud(buf, 90, 52, 170, "angry", c.t, true);
  if (c.t > at && c.t < at + 0.7) bolt(buf, 9, 1, 118, 70, 150, 220, 3);
  if (c.t > at) for (let k = 0; k < 3; k++) drawRings(buf, 140, 160, (c.t - at) * 1.3 - k * 0.12, hex("#ffffff"), 170, 1, 0.8);
  drawPip(buf, c.t > at ? "shock" : "look", 70, 170, 76, c.t, { look: { dx: 0.6, dy: -0.6 } });
};
const boom: Shot = (buf, c) => split(c, lineStart(c, 1, 4.3) - 0.05, balloon, skyPop, 0.3);

// Aftermath: one tree, hit, catching fire; the number sits on it.
const fire: Shot = (buf, c) => {
  const hit = 0.25;
  ground(buf, GROUNDS.coral, c.t);
  drawHill(buf, 214, style("#4cbf5a", "#2a8a44", "#9ae486"));
  const burn = smoothstep(hit, hit + 1.8, c.t);
  drawTree(buf, 92, 214, 120, c.t < hit ? "open" : "shock", burn);
  if (c.t > hit) drawFire(buf, c.t, 60, 124, () => 132 - burn * 6, 30 * burn + 6, 0.9);
  if (c.t > hit - 0.1 && c.t < hit + 0.4) bolt(buf, 12, 1, 80, -6, 92, 110, 3);
  if (c.t > hit + 0.8) drawPill(buf, "10,000 FIRES", 90, 64, "#ffd23f", "#140c26", 2);
  if (c.t > hit + 1.3) drawPill(buf, "A YEAR", 90, 82, "#ffffff", "#140c26", 2);
  drawPip(buf, "shock", 152, 194, 44, c.t, { look: { dx: -0.8, dy: -0.4 } });
};

// Try this (L25): flash, then Pip counts one to five while the camera pushes in, and the thunder
// ring reaches it at five.
const people: Shot = (buf, c) => {
  const at = 0.45, bang = at + 4.6;
  const Z = push(1 + 0.3 * smoothstep(1.0, 5.0, c.t), 56, 186);
  ground(buf, GROUNDS.dusk, c.t, 0, 320, 150, 110);
  drawCloud(buf, Z.x(150), Z.y(72), Z.s(80), "angry", c.t, true);
  drawParts(buf, [part(union(ellipse(30, 40, 90, 40), ellipse(150, 46, 80, 36)), style("#8424d4", "#5e14a4", "#b06af0"))], { cx: Z.x(0), cy: Z.y(196), unit: Z.s(1), box: [-60, 0, 240, 120], edge: 1 });
  if (c.t > at - 0.1 && c.t < at + 0.4) bolt(buf, 41, smoothstep(at - 0.1, at, c.t), Z.x(150), Z.y(84), Z.x(160), Z.y(206), 1.6);
  if (c.t > at) for (let k = 0; k < 2; k++) drawRings(buf, Z.x(160), Z.y(206), ((c.t - at) / 4.6) * 1.55 * Z.s(1) - k * 0.04, hex("#ffffff"), 200, 1, 0.6);
  const ticks = c.t < at ? 0 : Math.min(5, Math.floor(c.t - at) + 1);
  for (let i = 0; i < ticks; i++) {
    const fresh = c.t - at - i < 0.25;
    drawPill(buf, String(i + 1), Z.x(84 + i * 14), Z.y(184), i === 4 ? "#ffd23f" : "#ffffff", "#140c26", fresh ? 3 : 2);
  }
  const pose = c.t >= bang ? "puffed" : ticks === 0 ? "look" : Math.floor((c.t - at) * 2) % 2 ? "grin" : "point";
  drawPip(buf, pose, Z.x(52), Z.y(190), Z.s(50), c.t, { look: { dx: 0.8, dy: -0.2 } });
};

// Loop (L26): Pip runs for the house, stops at the door, forgets, and walks back to the hill top,
// where frame 0 starts again with the bolt on its way.
const outro: Shot = (buf, c) => {
  storm(buf, c.t, c.t < c.dur - 1.2 ? flashAt(c.t % 1.4, 0.5) * 0.6 : 0);
  const go = smoothstep(0.1, 1.4, c.t), back = smoothstep(2.2, c.dur - 0.25, c.t);
  const x = lerp(lerp(PIP0.x, 34, go), PIP0.x, back);
  const hop = Math.abs(Math.sin(c.t * 9)) * 4 * (go < 1 || (back > 0 && back < 1) ? 1 : 0);
  const pose = back >= 1 ? "look" : back > 0 ? "grin" : "shock";
  drawPip(buf, pose, x, PIP0.y - hop, PIP0.size, c.t, { flip: go < 1 && back === 0, look: { dx: 0.7, dy: -0.3 } });
  const reach = smoothstep(c.dur - 0.4, c.dur, c.t) * 0.45;
  if (reach > 0) bolt(buf, 4, reach);
};

export const EP007_SHOTS: Record<string, Shot> = {
  "bolt-hook": hook,
  "bolt-cloud": cloud,
  "bolt-balloon": boom,
  "bolt-strike": strike,
  "bolt-heat": heat,
  "bolt-fire": fire,
  "bolt-people": people,
  "bolt-outro": outro,
};

// The strike in the hook and the sky's pop shake the frame.
export const ep007Shake = (visual: string, c: ShotCtx) => {
  if (visual !== "bolt-hook") return null;
  const k = smoothstep(STRIKE - 0.02, STRIKE + 0.05, c.t) * (1 - smoothstep(0.5, 1, c.t));
  return { x: Math.round(Math.sin(c.frame * 2.3) * 14 * k), y: Math.round(Math.cos(c.frame * 1.9) * 10 * k) };
};
