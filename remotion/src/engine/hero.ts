import { Look, Part, drawParts, ellipse, face, part, roundRect, style, sweatDrop, tri, union } from "./flat";
import { Buf, hex } from "./pixel";

// Pip, the mascot (K5, owner's pick 2026-10-27): a round teal bird facing the viewer, orange crest,
// yellow beak and feet. Drawn large from flat parts in a 100-unit box; never pink or duck-like, so
// it cannot read as Kurzgesagt's bird (docs/research/kurzgesagt-quality.md §3).

export type HeroPose = "look" | "shock" | "grin" | "point" | "shades" | "puffed";
export type HeroOpts = { look?: Look; flip?: boolean; sweat?: boolean; squash?: number };

const BODY = style("#2fc4b2", "#16808a", "#a8f5e2");
const BELLY = style("#e6fff6", "#a8e8d8", "#fbf8ef", null);
const CREST = style("#ff8a3d", "#c4482a", "#ffd0a0");
const BEAK = style("#ffd23f", "#e08a1e", "#fff2b0");
const INK_ONLY = { fill: hex("#140c26") };
const GLASS = { fill: hex("#140c26"), light: hex("#5a5a8a") };

const wing = (x: number, rot: number) => part(ellipse(x, 10, 14, 9, rot), BODY);

const pipParts = (pose: HeroPose, t: number, look: Look, blink: boolean, sweat: boolean): Part[] => {
  const flap = Math.sin(t * 9);
  const alarmed = pose === "shock" || pose === "puffed";
  const lift = alarmed ? -5 : 0;
  const open = pose === "shock" || pose === "grin" || pose === "puffed";
  const mood = pose === "grin" ? "grin" : alarmed ? "shock" : blink ? "blink" : "open";
  const spikes: Part[] =
    pose === "puffed"
      ? [part(union(...Array.from({ length: 11 }, (_, k) => {
          const a = (k / 11) * Math.PI * 2 + 0.2;
          const ax = Math.cos(a), ay = Math.sin(a);
          return tri(ax * 30 - ay * 7, 4 + ay * 30 + ax * 7, ax * 30 + ay * 7, 4 + ay * 30 - ax * 7, ax * 52, 4 + ay * 51);
        })), BODY)]
      : [];
  const left = pose === "point" ? wing(-36, 1.15 + flap * 0.15) : wing(-36, alarmed ? -1.15 + flap * 0.2 : 1.15 + flap * 0.15);
  const right = pose === "point" ? part(ellipse(50, 4, 16, 7, -0.35), BODY) : wing(36, alarmed ? 1.15 - flap * 0.2 : -1.15 - flap * 0.15);
  return [
    ...spikes,
    part(union(ellipse(-8, -42 + lift, 4, 10, -0.5), ellipse(0, -46 + lift, 4, 11), ellipse(8, -42 + lift, 4, 10, 0.5)), CREST),
    part(ellipse(-12, 40, 7, 5), BEAK),
    part(ellipse(12, 40, 7, 5), BEAK),
    left,
    ...(pose === "point" ? [] : [right]),
    part(ellipse(0, 4, 40, 39), BODY),
    part(ellipse(0, 18, 26, 20), BELLY),
    ...(pose === "point" ? [right] : []),
    ...(pose === "shades"
      ? [part(union(roundRect(-26, -16, -3, -1, 5), roundRect(3, -16, 26, -1, 5), roundRect(-4, -12, 4, -9, 1)), GLASS)]
      : face(mood, [-14, 14], -8, 11.5, look)),
    open ? part(union(tri(-8, 5, 8, 5, 0, 11), tri(-6, 13, 6, 13, 0, 20), roundRect(-5, 9, 5, 14, 2)), INK_ONLY) : part(tri(-7, 4, 7, 4, 0, 14), BEAK),
    ...(open ? [part(union(tri(-8, 4, 8, 4, 0, 10), tri(-6, 14, 6, 14, 0, 20)), BEAK)] : []),
    ...(sweat || pose === "shock" ? [sweatDrop(34, -30)] : []),
  ];
};

// Draws Pip centred on (cx, cy) at `size` logical px tall. `t` drives the bob, blink and flutter.
export const drawPip = (buf: Buf, pose: HeroPose, cx: number, cy: number, size: number, t: number, o: HeroOpts = {}) => {
  const blink = pose !== "shock" && t % 3.1 > 2.95;
  const bob = pose === "shock" ? Math.sin(t * 40) * 0.6 : Math.sin(t * 4) * 1.2;
  const squash = o.squash ?? (pose === "shock" || pose === "puffed" ? 1.08 : pose === "grin" ? 0.95 : 1);
  drawParts(buf, pipParts(pose, t, o.look ?? { dx: 0.4, dy: 0 }, blink, o.sweat ?? false), {
    cx,
    cy: cy + bob,
    unit: size / 100,
    sx: 1 / Math.sqrt(squash),
    sy: squash,
    flip: o.flip,
    box: [-70, -62, 70, 60],
  });
};
