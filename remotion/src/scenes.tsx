import React from "react";
import { interpolate } from "remotion";
import { ArtWindow, Rect, SPRITES, Sprite, step } from "./pixel";
import { ART, C, PIXEL_FONT } from "./theme";
import type { Scene } from "./types";

const W = ART.width / ART.px;
const H = ART.height / ART.px;
const SEA_Y = 30;
const WEST = 9;
const EAST = W - 9;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const Label: React.FC<{ x: number; y: number; text: string; color?: string; size?: number; anchor?: "start" | "middle" | "end" }> = ({
  x,
  y,
  text,
  color = C.white,
  size = 3,
  anchor = "start",
}) => (
  <text x={x} y={y} fill={color} fontFamily={PIXEL_FONT} fontSize={size} textAnchor={anchor}>
    {text}
  </text>
);

const WindArrows: React.FC<{ frame: number; strength: number }> = ({ frame, strength }) => {
  const rows = [10, 16, 22];
  const count = Math.round(lerp(2, 5, strength));
  const speed = lerp(0.15, 0.9, strength);
  return (
    <g>
      {rows.flatMap((y, r) =>
        Array.from({ length: count }, (_, i) => {
          const span = EAST - WEST;
          const x = EAST - ((step(frame, 2) * speed + i * (span / count) + r * 7) % span);
          return (
            <g key={`${r}-${i}`}>
              <Rect x={x} y={y} w={1} h={1} fill={C.white} />
              <Rect x={x + 1} y={y - 1} w={1} h={3} fill={C.white} />
              <Rect x={x + 2} y={y} w={4} h={1} fill={C.white} />
            </g>
          );
        }),
      )}
    </g>
  );
};

export const OceanArt: React.FC<{ frame: number; warmth: number; thermometer?: boolean; boat?: boolean }> = ({
  frame,
  warmth,
  thermometer,
  boat,
}) => {
  const f = step(frame);
  const cloudX = lerp(12, 64, warmth);
  return (
    <ArtWindow>
      <Rect x={0} y={0} w={W} h={SEA_Y} fill={C.sky} />
      <Rect x={0} y={0} w={W} h={8} fill={C.skyLight} />
      <Rect x={0} y={SEA_Y} w={W} h={H - SEA_Y} fill={C.seaDeep} />
      <Rect x={0} y={SEA_Y} w={W} h={14} fill={C.sea} />
      {Array.from({ length: EAST - WEST }, (_, i) => {
        const x = WEST + i;
        const t = i / (EAST - WEST);
        const normal = lerp(20, 2, t);
        const elnino = lerp(9, 12, t);
        const depth = Math.round(lerp(normal, elnino, warmth));
        return (
          <g key={x}>
            <Rect x={x} y={SEA_Y} w={1} h={depth} fill={C.warm} />
            <Rect x={x} y={SEA_Y} w={1} h={Math.max(1, Math.round(depth * 0.35))} fill={C.hot} />
          </g>
        );
      })}
      {warmth < 0.6 &&
        Array.from({ length: 3 }, (_, i) => {
          const y = H - 4 - ((f * 0.5 + i * 14) % (H - SEA_Y - 6));
          return (
            <g key={i} opacity={1 - warmth * 1.6}>
              <Rect x={EAST - 8} y={y} w={1} h={4} fill={C.cold} />
              <Rect x={EAST - 9} y={y + 1} w={3} h={1} fill={C.cold} />
            </g>
          );
        })}
      <Rect x={0} y={18} w={WEST} h={H - 18} fill={C.land} />
      <Rect x={0} y={18} w={WEST} h={2} fill={C.landDark} />
      <Rect x={EAST} y={16} w={W - EAST} h={H - 16} fill={C.land} />
      <Rect x={EAST} y={16} w={W - EAST} h={2} fill={C.landDark} />
      <Label x={1} y={16} text="ASIA" size={2.5} />
      <Label x={W - 1} y={14} text="AMERICAS" size={2.5} anchor="end" />
      <WindArrows frame={frame} strength={1 - warmth * 0.85} />
      <Sprite rows={SPRITES.cloud} palette={{ c: C.cloud }} x={Math.round(cloudX)} y={2} />
      {f % 12 < 6 && <Sprite rows={SPRITES.rain} palette={{ b: C.cold }} x={Math.round(cloudX) + 2} y={8} />}
      {boat && <Sprite rows={SPRITES.boat} palette={{ w: C.white, b: C.sand }} x={EAST - 22} y={SEA_Y - 7 + (f % 18 < 9 ? 0 : 1)} />}
      {thermometer && (
        <Sprite
          rows={SPRITES.thermometer}
          palette={{ w: C.white, r: f % 12 < 6 ? C.hot : C.warm }}
          x={22}
          y={4}
          scale={2}
        />
      )}
      <Label x={W / 2} y={H - 3} text="PACIFIC OCEAN" size={2.5} color={C.cold} anchor="middle" />
    </ArtWindow>
  );
};

export const StatArt: React.FC<{ frame: number; scene: Scene }> = ({ frame, scene }) => {
  const target = parseFloat((scene.stat ?? "0").replace(/[^0-9.]/g, ""));
  const value = interpolate(frame, [10, 55], [0, target], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fill = interpolate(frame, [10, 55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tubeTop = 6;
  const tubeH = 46;
  const level = Math.round(tubeH * (0.15 + 0.8 * fill));
  return (
    <>
      <ArtWindow>
        <Rect x={0} y={0} w={W} h={H} fill={C.bg2} />
        <Rect x={14} y={tubeTop - 1} w={10} h={tubeH + 2} fill={C.white} />
        <Rect x={15} y={tubeTop} w={8} h={tubeH} fill={C.ink} />
        <Rect x={15} y={tubeTop + tubeH - level} w={8} h={level} fill={C.hot} />
        <Rect x={11} y={tubeTop + tubeH} w={16} h={12} fill={C.white} />
        <Rect x={12} y={tubeTop + tubeH + 1} w={14} h={10} fill={C.hot} />
        {Array.from({ length: 6 }, (_, i) => (
          <Rect key={i} x={25} y={tubeTop + 4 + i * 8} w={3} h={1} fill={C.grey} />
        ))}
      </ArtWindow>
      <div
        style={{
          position: "absolute",
          left: ART.x + 260,
          top: ART.y + 170,
          width: 600,
          fontFamily: PIXEL_FONT,
          color: C.hot,
          fontSize: 120,
          textShadow: `8px 8px 0 ${C.ink}`,
        }}
      >
        +{value.toFixed(1)}
        <span style={{ fontSize: 60 }}> C</span>
        <div style={{ fontSize: 34, color: C.white, marginTop: 40, lineHeight: 1.6 }}>{scene.statLabel}</div>
      </div>
    </>
  );
};

const JetStream: React.FC<{ frame: number }> = ({ frame }) => (
  <svg viewBox="0 0 24 8" width={192} height={64} shapeRendering="crispEdges">
    {Array.from({ length: 24 }, (_, x) => {
      const y = Math.round(3.5 + 3 * Math.sin((x + step(frame, 2) * 0.4) / 3));
      return <rect key={x} x={x} y={y} width={1} height={1} fill={C.cold} />;
    })}
  </svg>
);

const Icon: React.FC<{ rows: string[]; palette: Record<string, string> }> = ({ rows, palette }) => (
  <svg viewBox="0 0 14 9" width={192} height={124} shapeRendering="crispEdges">
    <Sprite rows={rows} palette={palette} x={1} y={1} />
  </svg>
);

export const EffectsArt: React.FC<{ frame: number; scene: Scene }> = ({ frame, scene }) => {
  const icons = [
    <JetStream key="jet" frame={frame} />,
    <Icon key="sun" rows={SPRITES.sun} palette={{ y: C.yellow }} />,
    <Icon key="rain" rows={[...SPRITES.cloud, ...SPRITES.rain]} palette={{ c: C.cloud, b: C.cold }} />,
  ];
  return (
    <div style={{ position: "absolute", left: ART.x, top: ART.y, width: ART.width, height: ART.height }}>
      {(scene.items ?? []).map((item, i) => {
        const at = scene.lines[i]?.startFrame ?? i * 30;
        if (frame < at) return null;
        const pop = frame - at < 4 ? 0.85 : 1;
        return (
          <div
            key={item}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 32,
              height: 180,
              marginBottom: 16,
              padding: "0 24px",
              background: C.bg2,
              border: `8px solid ${C.white}`,
              transform: `scale(${pop})`,
              fontFamily: PIXEL_FONT,
              color: C.white,
              fontSize: 34,
              lineHeight: 1.5,
            }}
          >
            <div style={{ width: 192, display: "flex", justifyContent: "center" }}>{icons[i % icons.length]}</div>
            <div>{item}</div>
          </div>
        );
      })}
    </div>
  );
};

export const FactArt: React.FC<{ frame: number }> = ({ frame }) => {
  const f = step(frame);
  return (
    <>
      <OceanArt frame={frame} warmth={1} boat />
      <ArtWindow>
        {f % 18 < 12 && <Sprite rows={SPRITES.star} palette={{ y: C.yellow }} x={20} y={3} scale={2} />}
        <Label x={W / 2} y={46} text="EL NINO" size={7} color={C.yellow} anchor="middle" />
        <Label x={W / 2} y={56} text="= THE LITTLE BOY" size={3.5} anchor="middle" />
      </ArtWindow>
    </>
  );
};

export const OutroArt: React.FC<{ frame: number }> = ({ frame }) => {
  const f = step(frame);
  const saved = Math.min(1, frame / 40);
  return (
    <ArtWindow>
      <Rect x={0} y={0} w={W} h={H} fill={C.bg2} />
      {(f % 18 < 12 || saved < 1) && (
        <Sprite rows={SPRITES.floppy} palette={{ k: C.cold, w: C.white, g: C.ink }} x={W / 2 - 13} y={6} scale={2} />
      )}
      <Rect x={24} y={36} w={60} h={6} fill={C.white} />
      <Rect x={25} y={37} w={Math.round(58 * saved)} h={4} fill={C.land} />
      <Label x={W / 2} y={52} text={saved < 1 ? "SAVING..." : "GAME SAVED!"} size={4} anchor="middle" />
      <Label x={W / 2} y={64} text="@8BITEXPLAINS" size={4} color={C.yellow} anchor="middle" />
    </ArtWindow>
  );
};

export const SceneArt: React.FC<{ scene: Scene; frame: number }> = ({ scene, frame }) => {
  switch (scene.visual) {
    case "hook":
      return <OceanArt frame={frame} warmth={1} thermometer />;
    case "normal":
      return <OceanArt frame={frame} warmth={0} />;
    case "elnino":
      return (
        <OceanArt frame={frame} warmth={interpolate(frame, [15, 75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      );
    case "stat":
      return <StatArt frame={frame} scene={scene} />;
    case "effects":
      return <EffectsArt frame={frame} scene={scene} />;
    case "fact":
      return <FactArt frame={frame} />;
    case "outro":
      return <OutroArt frame={frame} />;
    default:
      return null;
  }
};
