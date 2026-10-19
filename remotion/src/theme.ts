import { loadFont } from "@remotion/google-fonts/PressStart2P";

export const { fontFamily: PIXEL_FONT } = loadFont();

export const WIDTH = 1080;
export const HEIGHT = 1920;
export const FPS = 30;

// Instagram Reels and TikTok overlay their UI on the top bar, the right-hand
// action rail and the bottom caption area; text and key subjects stay inside.
export const SAFE = { top: 220, bottom: 1440, left: 90, right: 990 };

export const C = {
  ink: "#05040f",
  white: "#f4f1e8",
  yellow: "#ffd23f",
  cyan: "#3ee0ff",
  red: "#ff3d5a",
  dim: "#8f8cc9",
};

export const OUTLINE = (px: number, color = C.ink) =>
  [`${px}px ${px}px 0 ${color}`, `-${px}px -${px}px 0 ${color}`, `${px}px -${px}px 0 ${color}`, `-${px}px ${px}px 0 ${color}`, `0 ${px * 2}px 0 ${color}`].join(", ");
