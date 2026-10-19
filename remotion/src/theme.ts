import { loadFont } from "@remotion/google-fonts/PressStart2P";

export const { fontFamily: PIXEL_FONT } = loadFont();

export const WIDTH = 1080;
export const HEIGHT = 1920;
export const FPS = 30;

// Instagram Reels and TikTok overlay their UI on the top bar, the right-hand
// action rail and the bottom caption area; nothing important may sit there.
export const SAFE = { top: 220, bottom: 1440, left: 60, right: 920 };

export const ART = { x: SAFE.left, y: 560, width: 864, height: 592, px: 8 };

export const C = {
  bg: "#0d0b26",
  bg2: "#17143d",
  star: "#6c6aa8",
  white: "#f4f1e8",
  ink: "#05040f",
  sky: "#2a2a6e",
  skyLight: "#3b3f8f",
  sea: "#1b4fa0",
  seaDeep: "#123a7a",
  cold: "#4fd1ff",
  warm: "#ff7a3d",
  hot: "#ff3d5a",
  land: "#3fa34d",
  landDark: "#2a7337",
  sand: "#e8c170",
  yellow: "#ffd23f",
  cloud: "#c9c9e6",
  grey: "#7a7aa0",
  accent: "#ff4f9a",
};
