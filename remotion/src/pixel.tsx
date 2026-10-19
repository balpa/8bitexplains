import React from "react";
import { ART } from "./theme";

export const step = (frame: number, every = 3) => Math.floor(frame / every) * every;

export const Rect: React.FC<{ x: number; y: number; w: number; h: number; fill: string }> = ({ x, y, w, h, fill }) => (
  <rect x={x} y={y} width={w} height={h} fill={fill} />
);

export const Sprite: React.FC<{
  rows: string[];
  palette: Record<string, string>;
  x: number;
  y: number;
  scale?: number;
}> = ({ rows, palette, x, y, scale = 1 }) => (
  <g>
    {rows.flatMap((row, j) =>
      [...row].map((ch, i) =>
        palette[ch] ? (
          <rect key={`${i}-${j}`} x={x + i * scale} y={y + j * scale} width={scale} height={scale} fill={palette[ch]} />
        ) : null,
      ),
    )}
  </g>
);

export const ArtWindow: React.FC<{ children: React.ReactNode; width?: number; height?: number }> = ({
  children,
  width = ART.width / ART.px,
  height = ART.height / ART.px,
}) => (
  <svg
    viewBox={`0 0 ${width} ${height}`}
    width={ART.width}
    height={ART.height}
    shapeRendering="crispEdges"
    style={{ position: "absolute", left: ART.x, top: ART.y }}
  >
    {children}
  </svg>
);

export const SPRITES = {
  thermometer: [
    "..www..",
    "..wrw..",
    "..wrw..",
    "..wrw..",
    "..wrw..",
    "..wrw..",
    ".wrrrw.",
    "wrrrrrw",
    "wrrrrrw",
    ".wrrrw.",
    "..www..",
  ],
  sun: [
    "..y..y..",
    "y.yyyy.y",
    ".yyyyyy.",
    "yyyyyyyy",
    "yyyyyyyy",
    ".yyyyyy.",
    "y.yyyy.y",
    "..y..y..",
  ],
  cloud: [
    "...cccc....",
    "..cccccc.cc",
    ".ccccccccccc",
    "ccccccccccccc",
    ".ccccccccccc.",
  ],
  rain: ["b..b..b..", ".b..b..b.", "b..b..b.."],
  boat: [
    "....w....",
    "....ww...",
    "....www..",
    "....wwww.",
    "....w....",
    "bbbbbbbbb",
    ".bbbbbbb.",
  ],
  fish: ["..yy..", ".yyyy.y", "yykyyyy", ".yyyy.y", "..yy.."],
  star: ["..y..", ".yyy.", "yyyyy", ".yyy.", "y...y"],
  floppy: [
    "kkkkkkkkkkkk.",
    "kwwwwwwwwkkkk",
    "kwwwwwwwwkgkk",
    "kwwwwwwwwkgkk",
    "kwwwwwwwwkkkk",
    "kkkkkkkkkkkkk",
    "kkgggggggggkk",
    "kkgkkkkkkkgkk",
    "kkgkkkkkkkgkk",
    "kkgggggggggkk",
    "kkkkkkkkkkkkk",
  ],
};
