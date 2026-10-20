import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Buf, H, K, W, dissolve, setDetail } from "./engine/pixel";
import { ShotCtx, drawShot, metaphorEnds, shakeAt } from "./shots";
import { C, OUTLINE, PIXEL_FONT, SAFE, WIDTH } from "./theme";
import type { Manifest, Scene } from "./types";

const TRANSITION = 12;
const HUD_S = 1.5;

// Press Start 2P is drawn on an 8 px grid, so multiples of 24 put its pixels on the 3 px art grid.
const fit = (text: string, width: number, sizes = [120, 96, 72, 48]) => sizes.find((s) => text.length * s <= width) ?? 24;

// Besides the captions only one text block is on screen: the headline until a stat, reveal or the
// save screen takes over.
const overlayFrom = (scene: Scene) => {
  if (scene.visual.endsWith("outro")) return scene.lines[scene.lines.length - 1]?.startFrame ?? 0;
  if (scene.stat) return scene.statLine === undefined ? 0 : scene.lines[scene.statLine]?.startFrame ?? 0;
  if (scene.reveal) return scene.lines[scene.reveal.line]?.startFrame ?? 0;
  return Infinity;
};

export const sceneStarts = (m: Manifest) =>
  m.scenes.reduce<number[]>((acc, s, i) => [...acc, i === 0 ? 0 : acc[i - 1] + m.scenes[i - 1].durationInFrames], []);

const ctxFor = (scene: Scene, local: number, fps: number): ShotCtx => ({
  t: local / fps,
  frame: local,
  dur: scene.durationInFrames / fps,
  lines: scene.lines.map((l) => ({ start: l.startFrame / fps, end: l.endFrame / fps })),
});

export const renderFrame = (m: Manifest, frame: number): Buf => {
  setDetail(m.detail ?? 1);
  const starts = sceneStarts(m);
  const i = Math.max(0, starts.filter((s) => frame >= s).length - 1);
  const scene = m.scenes[i];
  const local = frame - starts[i];
  const cur = drawShot(scene.visual, ctxFor(scene, local, m.fps));
  if (i === 0 || local >= TRANSITION) return cur;
  const prev = m.scenes[i - 1];
  const prevBuf = drawShot(prev.visual, ctxFor(prev, prev.durationInFrames - 1 + local, m.fps));
  return dissolve(prevBuf, cur, local / TRANSITION);
};

const PixelStage: React.FC<{ manifest: Manifest }> = ({ manifest }) => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const buf = renderFrame(manifest, frame);
    ctx.putImageData(new ImageData(buf.data, buf.w, buf.h), 0, 0);
  }, [frame, manifest]);
  setDetail(manifest.detail ?? 1);
  const starts = sceneStarts(manifest);
  const i = Math.max(0, starts.filter((s) => frame >= s).length - 1);
  const scene = manifest.scenes[i];
  const shake = shakeAt(scene.visual, ctxFor(scene, frame - starts[i], manifest.fps));
  return (
    <canvas
      ref={ref}
      width={W * K}
      height={H * K}
      style={{
        position: "absolute",
        left: -24,
        top: -24,
        width: "calc(100% + 48px)",
        height: "calc(100% + 48px)",
        imageRendering: "pixelated",
        transform: `translate(${shake.x}px, ${shake.y}px)`,
      }}
    />
  );
};

export const column: React.CSSProperties = {
  position: "absolute",
  left: SAFE.left,
  width: SAFE.right - SAFE.left,
  textAlign: "center",
  fontFamily: PIXEL_FONT,
  color: C.white,
};

const Hud: React.FC<{ level: number; levels: number }> = ({ level, levels }) => (
  <div style={{ ...column, top: SAFE.top + 8, fontSize: 24, textShadow: OUTLINE(3) }}>
    8-BIT <span style={{ color: C.yellow }}>EXPLAINS</span>
    <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 18 }}>
      {Array.from({ length: levels }, (_, i) => (
        <div key={i} style={{ width: 18, height: 18, background: i < level ? C.yellow : "transparent", border: `4px solid ${i < level ? C.ink : C.dim}` }} />
      ))}
    </div>
  </div>
);

const Headline: React.FC<{ scene: Scene; fps: number; level: number; levels: number }> = ({ scene, fps, level, levels }) => {
  const frame = useCurrentFrame();
  if (frame >= overlayFrom(scene)) return null;
  const pop = interpolate(frame, [0, 4, 7], [0.6, 1.08, 1], { extrapolateRight: "clamp" });
  const isLevel = scene.title.startsWith("LEVEL");
  const main = isLevel ? scene.sub : scene.title;
  const sub = isLevel || scene.visual.endsWith("outro") ? "" : scene.sub;
  return (
    <>
      {frame < HUD_S * fps && <Hud level={level} levels={levels} />}
      <div style={{ ...column, top: 330, transform: `scale(${pop})` }}>
        {isLevel && frame < HUD_S * fps && <div style={{ fontSize: 24, color: C.cyan, textShadow: OUTLINE(3), marginBottom: 18 }}>{scene.title}</div>}
        <div style={{ fontSize: scene.visual.endsWith("hook") ? 72 : 48, lineHeight: 1.3, color: scene.visual.endsWith("hook") ? C.red : C.yellow, textShadow: OUTLINE(5) }}>
          {main}
        </div>
        {sub && <div style={{ fontSize: 24, marginTop: 24, textShadow: OUTLINE(3) }}>{sub}</div>}
      </div>
    </>
  );
};

const CHUNK = 5;
const CHUNK_CHARS = 26;

// Greedy word groups that fit two caption lines at 48 px; returns each group's first word index.
const chunkStarts = (words: string[]) =>
  words.reduce<{ starts: number[]; len: number }>(
    (acc, w, i) => {
      const from = acc.starts[acc.starts.length - 1];
      const len = acc.len + (i === from ? 0 : 1) + w.length;
      return i > from && (len > CHUNK_CHARS || i - from >= CHUNK) ? { starts: [...acc.starts, i], len: w.length } : { starts: acc.starts, len };
    },
    { starts: [0], len: 0 },
  ).starts;

const Caption: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const line = [...scene.lines].reverse().find((l) => frame >= l.startFrame);
  if (!line || frame > line.endFrame + 8) return null;
  const words = line.text.split(" ");
  const p = Math.min(0.999, Math.max(0, (frame - line.startFrame) / Math.max(1, line.endFrame - line.startFrame)));
  const current = Math.floor(p * words.length);
  const starts = chunkStarts(words);
  const k = starts.filter((st) => st <= current).length - 1;
  const from = starts[k], to = starts[k + 1] ?? words.length;
  return (
    <div style={{ ...column, top: 1230, fontSize: 48, lineHeight: 1.5, textShadow: OUTLINE(4) }}>
      {words.slice(from, to).map((w, i) => (
        <span key={i}>
          <span style={from + i === current ? { color: C.ink, background: C.yellow, textShadow: "none", padding: "0 8px" } : undefined}>{w}</span>{" "}
        </span>
      ))}
    </div>
  );
};

const Label: React.FC<{ side: "left" | "right"; top: number; children: React.ReactNode }> = ({ side, top, children }) => (
  <div style={{ position: "absolute", top, [side]: SAFE.left, fontFamily: PIXEL_FONT, fontSize: 24, color: C.white, textShadow: OUTLINE(3) }}>{children}</div>
);

const Overlay: React.FC<{ scene: Scene; fps: number }> = ({ scene, fps }) => {
  const frame = useCurrentFrame();
  switch (scene.visual) {
    case "normal":
    case "elnino": {
      const inTub = frame / fps < metaphorEnds(ctxFor(scene, frame, fps));
      const top = inTub ? 800 : 1140;
      return (
        <>
          <Label side="left" top={top}>{inTub ? "ASIA" : "< ASIA"}</Label>
          <Label side="right" top={top}>{inTub ? "AMERICAS" : "AMERICAS >"}</Label>
        </>
      );
    }
    default:
      break;
  }
  const from = overlayFrom(scene);
  if (frame < from) return null;
  if (scene.visual.endsWith("outro"))
    return (
      <div style={{ ...column, top: 820, textShadow: OUTLINE(4) }}>
        <div style={{ fontSize: 48 }}>{frame < from + 40 ? "SAVING..." : "GAME SAVED!"}</div>
        <div style={{ fontSize: 48, color: C.yellow, marginTop: 24 }}>@8BITEXPLAINS</div>
      </div>
    );
  if (scene.stat) {
    const [, prefix, num, suffix] = scene.stat.match(/^([^0-9]*)([0-9.,]+)(.*)$/) ?? ["", "", "0", ""];
    const decimals = (num.split(".")[1] ?? "").length;
    const v = interpolate(frame - from, [10, 60], [0, parseFloat(num.replace(/,/g, ""))], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const shown = num.includes(",") ? Math.round(v).toLocaleString("en-US") : v.toFixed(decimals);
    return (
      <div style={{ ...column, top: 700, textShadow: OUTLINE(6) }}>
        <div style={{ fontSize: fit(scene.stat, SAFE.right - SAFE.left), color: C.red }}>
          {prefix}
          {shown}
          {suffix}
        </div>
        <div style={{ fontSize: 24, marginTop: 24, lineHeight: 1.5, textShadow: OUTLINE(3) }}>{scene.statLabel}</div>
      </div>
    );
  }
  if (scene.reveal)
    return (
      <div style={{ ...column, top: 660, textShadow: OUTLINE(6) }}>
        <div style={{ fontSize: 72, lineHeight: 1.3, color: C.yellow }}>{scene.reveal.main}</div>
        <div style={{ fontSize: 24, marginTop: 24, lineHeight: 1.5, textShadow: OUTLINE(3) }}>{scene.reveal.sub}</div>
      </div>
    );
  return null;
};

const SceneSfx: React.FC<{ scene: Scene }> = ({ scene }) => {
  const sfx = (name: string, from = 0, volume = 0.5) => (
    <Sequence from={from} key={`${name}-${from}`}>
      <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
    </Sequence>
  );
  // One short SFX per scene (learnings L6): on the scene change before the first word,
  // or after the last word in the outro; about 19 dB under the voice.
  const lastWord = scene.lines[scene.lines.length - 1]?.endFrame ?? 40;
  switch (scene.visual) {
    default:
      if (scene.visual.endsWith("hook")) return <>{sfx("zap", 0, 0.25)}</>;
      if (scene.visual.endsWith("outro")) return <>{sfx("save", lastWord + 2, 0.25)}</>;
      return <>{sfx("blip", 0, 0.25)}</>;
  }
};

const DUCKED = 0.2;
const OPEN = 0.42;
const RAMP = 6;

// Music volume per frame: low while anyone speaks, back up in the gaps, with short ramps.
const musicVolume = (m: Manifest) => {
  const starts = sceneStarts(m);
  const speech = m.scenes.flatMap((s, i) => s.lines.map((l) => [starts[i] + l.startFrame, starts[i] + l.endFrame] as const));
  return (f: number) => {
    const dist = Math.min(...speech.map(([a, b]) => (f < a ? a - f : f > b ? f - b : 0)));
    return DUCKED + (OPEN - DUCKED) * Math.min(1, dist / RAMP);
  };
};

export const Episode: React.FC<{ manifest: Manifest }> = ({ manifest }) => {
  const starts = sceneStarts(manifest);
  const levels = manifest.scenes.filter((s) => s.title.startsWith("LEVEL")).length;
  return (
    <AbsoluteFill style={{ background: C.ink, width: WIDTH }}>
      <PixelStage manifest={manifest} />
      <Audio src={staticFile(`${manifest.id}/music.wav`)} volume={musicVolume(manifest)} />
      {manifest.scenes.map((scene, i) => (
        <Sequence key={i} from={starts[i]} durationInFrames={scene.durationInFrames}>
          <Headline scene={scene} fps={manifest.fps} level={manifest.scenes.slice(0, i + 1).filter((s) => s.title.startsWith("LEVEL")).length} levels={levels} />
          <Overlay scene={scene} fps={manifest.fps} />
          <Caption scene={scene} />
          <Audio src={staticFile(scene.audio)} />
          <SceneSfx scene={scene} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
