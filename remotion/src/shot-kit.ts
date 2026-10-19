import { Buf, dissolve, smoothstep } from "./engine/pixel";

export type ShotCtx = {
  t: number;
  frame: number;
  dur: number;
  lines: { start: number; end: number }[];
};

export type Shot = (buf: Buf, c: ShotCtx) => Buf | void;

export const lineStart = (c: ShotCtx, i: number, fallback: number) => c.lines[i]?.start ?? fallback;

// Draws two sub-shots and dithers from one to the other around `at` seconds.
export const split = (c: ShotCtx, at: number, a: Shot, b: Shot, width = 0.4): Buf => {
  const k = smoothstep(at - width / 2, at + width / 2, c.t);
  const A = new Buf(), B = new Buf();
  if (k < 1) a(A, c);
  if (k > 0) b(B, c);
  return k <= 0 ? A : k >= 1 ? B : dissolve(A, B, k);
};
