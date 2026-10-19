export type Line = { text: string; startFrame: number; endFrame: number };

export type Scene = {
  visual: string;
  title: string;
  sub: string;
  stat?: string;
  statLabel?: string;
  items?: string[];
  vo: string[];
  audio: string;
  durationInFrames: number;
  lines: Line[];
};

export type Manifest = { id: string; title: string; fps: number; scenes: Scene[] };
