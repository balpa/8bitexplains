import React from "react";
import { Composition } from "remotion";
import { Episode } from "./Episode";
import ep001 from "./generated/ep001.json";
import ep002 from "./generated/ep002.json";
import ep003 from "./generated/ep003.json";
import ep004 from "./generated/ep004.json";
import { FPS, HEIGHT, WIDTH } from "./theme";
import type { Manifest } from "./types";

const episodes: Manifest[] = [ep001 as Manifest, ep002 as Manifest, ep003 as Manifest, ep004 as Manifest];

export const Root: React.FC = () => (
  <>
    {episodes.map((manifest) => (
      <Composition
        key={manifest.id}
        id={manifest.id}
        component={Episode}
        width={WIDTH}
        height={HEIGHT}
        fps={FPS}
        durationInFrames={manifest.scenes.reduce((sum, s) => sum + s.durationInFrames, 0)}
        defaultProps={{ manifest }}
      />
    ))}
  </>
);
