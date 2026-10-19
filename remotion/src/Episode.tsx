import React from "react";
import { AbsoluteFill, Audio, Sequence, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { step } from "./pixel";
import { SceneArt } from "./scenes";
import { C, PIXEL_FONT, SAFE } from "./theme";
import type { Manifest, Scene } from "./types";

const STARS = Array.from({ length: 70 }, (_, i) => ({
  x: Math.floor(random(`x${i}`) * 135) * 8,
  y: Math.floor(random(`y${i}`) * 240) * 8,
  blink: Math.floor(random(`b${i}`) * 30),
}));

const Background: React.FC = () => {
  const frame = step(useCurrentFrame(), 6);
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {STARS.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: s.x,
            top: s.y,
            width: 8,
            height: 8,
            background: C.star,
            opacity: (frame + s.blink) % 60 < 40 ? 0.9 : 0.25,
          }}
        />
      ))}
      <AbsoluteFill
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 4px, transparent 4px, transparent 8px)",
        }}
      />
    </AbsoluteFill>
  );
};

const Hud: React.FC<{ level: number; levels: number; progress: number }> = ({ level, levels, progress }) => (
  <div style={{ position: "absolute", left: SAFE.left, top: SAFE.top, width: SAFE.right - SAFE.left, fontFamily: PIXEL_FONT }}>
    <div style={{ display: "flex", justifyContent: "space-between", color: C.white, fontSize: 28 }}>
      <span>
        8-BIT <span style={{ color: C.yellow }}>EXPLAINS</span>
      </span>
      <span style={{ color: C.cold }}>
        LV {level}/{levels}
      </span>
    </div>
    <div style={{ marginTop: 18, height: 24, border: `6px solid ${C.white}`, background: C.ink }}>
      <div style={{ height: "100%", width: `${progress * 100}%`, background: C.land }} />
    </div>
  </div>
);

const Title: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const shown = Math.min(scene.title.length, Math.floor(frame / 2));
  const big = scene.visual === "hook";
  return (
    <div
      style={{
        position: "absolute",
        left: SAFE.left,
        top: 330,
        width: SAFE.right - SAFE.left,
        fontFamily: PIXEL_FONT,
        textAlign: "center",
      }}
    >
      <div style={{ color: big ? C.hot : C.yellow, fontSize: big ? 60 : 56, lineHeight: 1.3, textShadow: `6px 6px 0 ${C.ink}` }}>
        {scene.title.slice(0, shown)}
      </div>
      {scene.sub && frame > scene.title.length * 2 && (
        <div style={{ marginTop: 22, color: C.white, fontSize: 36, lineHeight: 1.4, textShadow: `4px 4px 0 ${C.ink}` }}>
          {scene.sub}
        </div>
      )}
    </div>
  );
};

const Caption: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const current = [...scene.lines].reverse().find((l) => frame >= l.startFrame);
  if (!current) return null;
  const words = current.text.split(" ");
  const progress = Math.min(1, (frame - current.startFrame) / Math.max(1, current.endFrame - current.startFrame));
  const visible = Math.max(1, Math.ceil(words.length * progress));
  return (
    <div
      style={{
        position: "absolute",
        left: SAFE.left,
        top: 1190,
        width: SAFE.right - SAFE.left,
        minHeight: 220,
        padding: "28px 32px",
        boxSizing: "border-box",
        background: C.ink,
        border: `8px solid ${C.white}`,
        fontFamily: PIXEL_FONT,
        fontSize: 36,
        lineHeight: 1.6,
        color: C.white,
      }}
    >
      {words.map((w, i) => (
        <span key={i} style={{ opacity: i < visible ? 1 : 0 }}>
          {w}{" "}
        </span>
      ))}
    </div>
  );
};

const SceneSfx: React.FC<{ scene: Scene }> = ({ scene }) => {
  const sfx = (name: string, from = 0, volume = 0.5) => (
    <Sequence from={from} key={`${name}-${from}`}>
      <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
    </Sequence>
  );
  switch (scene.visual) {
    case "hook":
      return <>{[sfx("zap", 0, 0.4), sfx("thunder", 4, 0.35)]}</>;
    case "stat":
      return <>{[sfx("levelup", 0, 0.35), sfx("coin", 55, 0.45)]}</>;
    case "effects":
      return <>{[sfx("levelup", 0, 0.35), ...scene.lines.map((l) => sfx("blip", l.startFrame, 0.35))]}</>;
    case "outro":
      return <>{sfx("save", 40, 0.5)}</>;
    default:
      return <>{sfx("levelup", 0, 0.35)}</>;
  }
};

const SceneView: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <SceneArt scene={scene} frame={frame} />
      <Title scene={scene} />
      <Caption scene={scene} />
      <Audio src={staticFile(scene.audio)} />
      <SceneSfx scene={scene} />
    </AbsoluteFill>
  );
};

export const Episode: React.FC<{ manifest: Manifest }> = ({ manifest }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const starts = manifest.scenes.reduce<number[]>((acc, s, i) => [...acc, i === 0 ? 0 : acc[i - 1] + manifest.scenes[i - 1].durationInFrames], []);
  const current = starts.filter((s) => frame >= s).length - 1;
  const levels = manifest.scenes.filter((s) => s.title.startsWith("LEVEL")).length;
  const level = Math.min(levels, Math.max(1, manifest.scenes.slice(0, current + 1).filter((s) => s.title.startsWith("LEVEL")).length));
  return (
    <AbsoluteFill>
      <Background />
      <Audio src={staticFile("sfx/music.wav")} volume={0.16} />
      {manifest.scenes.map((scene, i) => (
        <Sequence key={i} from={starts[i]} durationInFrames={scene.durationInFrames}>
          <SceneView scene={scene} />
        </Sequence>
      ))}
      <Hud level={level} levels={levels} progress={frame / durationInFrames} />
    </AbsoluteFill>
  );
};
