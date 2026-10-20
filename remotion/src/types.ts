export type Line = { text: string; startFrame: number; endFrame: number };

export type Scene = {
  visual: string;
  title: string;
  sub: string;
  stat?: string;
  statLabel?: string;
  statLine?: number;
  items?: string[];
  reveal?: { main: string; sub: string; line: number };
  vo: string[];
  audio: string;
  durationInFrames: number;
  lines: Line[];
};

export type Cover = { title: string; scene: string; t: number };

export type Manifest = { id: string; title: string; fps: number; detail?: number; cover?: Cover; scenes: Scene[] };
