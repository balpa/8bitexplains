import { ramp } from "./pixel";

export const P = {
  ink: "#05040f",
  white: "#f4f1e8",
  yellow: "#ffd23f",
  pink: "#ff4f9a",
  cyan: "#3ee0ff",
  red: "#ff3d5a",
  orange: "#ff8a3d",
};

export const R = {
  space: ramp(["#05061a", "#0b0d2e", "#1a1248", "#2a1a5c"]),
  ocean: ramp(["#0a1640", "#14307a", "#2560c8", "#4fa3ff", "#9ad4ff"]),
  land: ramp(["#0e2e24", "#1b5a36", "#2f8f48", "#5cc65e", "#a7ec84"]),
  warm: ramp(["#3d0f2a", "#8f1f3a", "#e0453a", "#ff8a3d", "#ffd23f"]),
  cold: ramp(["#06123a", "#0f2a6e", "#1f55b5", "#4fa3ff"]),
  hot: ramp(["#3a0d2c", "#9a2238", "#ff5a3d", "#ffb347"]),
  daySky: ramp(["#152a6e", "#2c55b0", "#4f8ce0", "#8ec4f2", "#d4ecff"]),
  duskSky: ramp(["#1a1240", "#4a1d6b", "#a8336f", "#ff7a4a", "#ffc46b"]),
  deep: ramp(["#03071c", "#071442", "#0f2e78", "#1f5cc0"]),
  sun: ramp(["#ffd23f", "#fff2b0"]),
  halo: ramp(["#1d6fa8", "#3ee0ff"]),
};
