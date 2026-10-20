import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { H, K, W, setDetail } from "./engine/pixel";
import { drawBird } from "./engine/sprites";
import { column, fit, longestWord, renderFrame, sceneStarts } from "./Episode";
import { C, OUTLINE } from "./theme";
import type { Manifest } from "./types";

// One series template (docs/research/visual-craft.md §5): the peak image, a short title and the
// bird, all inside x 65-1015 and y 280-1248 so both the app UI and the 3:4 grid crop leave them.
export const coverFrame = (m: Manifest) => {
  const cover = m.cover!;
  const i = m.scenes.findIndex((s) => s.visual === cover.scene);
  const local = Math.round(cover.t * m.fps);
  if (i < 0 || local < 0 || local >= m.scenes[i].durationInFrames) throw new Error(`${m.id}: cover ${cover.scene} @ ${cover.t}s is not inside a scene`);
  return sceneStarts(m)[i] + local;
};

const Art: React.FC<{ manifest: Manifest }> = ({ manifest }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const buf = renderFrame(manifest, coverFrame(manifest));
    drawBird(buf, 136, 178, 0, true, 2);
    ctx.putImageData(new ImageData(buf.data, buf.w, buf.h), 0, 0);
  }, [manifest]);
  setDetail(manifest.detail ?? 1);
  return <canvas ref={ref} width={W * K} height={H * K} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", imageRendering: "pixelated" }} />;
};

export const Cover: React.FC<{ manifest: Manifest }> = ({ manifest }) => (
  <AbsoluteFill style={{ background: C.ink }}>
    <Art manifest={manifest} />
    <div style={{ ...column, left: 65, width: 950, top: 312, fontSize: 48, textShadow: OUTLINE(4) }}>
      8-BIT <span style={{ color: C.yellow }}>EXPLAINS</span>
    </div>
    <div style={{ ...column, left: 65, width: 950, top: 552, fontSize: fit(longestWord(manifest.cover!.title), 950, [120, 96, 72]), lineHeight: 1.25, color: C.yellow, textShadow: OUTLINE(6) }}>
      {manifest.cover!.title}
    </div>
    <div style={{ ...column, left: 65, width: 950, top: 1176, fontSize: 48, color: C.cyan, textShadow: OUTLINE(4) }}>
      #{parseInt(manifest.id.slice(2), 10)}
    </div>
  </AbsoluteFill>
);
