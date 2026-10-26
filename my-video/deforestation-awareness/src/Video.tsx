import React from "react";
import {
  AbsoluteFill,
  Composition,
  Sequence,
  interpolate,
  useCurrentFrame,
} from "remotion";
import {
  FPS,
  HEIGHT,
  SCENE_KEYS,
  SCENES,
  TOTAL_FRAMES,
  WIDTH,
} from "./constants";
import type { SceneKey } from "./constants";
import { COLORS, FONTS } from "./tokens";
import { progress } from "./utils/interpolation";

const SCENE_REGISTRY: Partial<Record<SceneKey, React.FC>> = {
  // Phase 2: register scene components here, e.g. S01: Scene01_ColdOpen
};

const pad2 = (value: number): string => (value < 10 ? `0${value}` : `${value}`);

const PlaceholderScene: React.FC<{ sceneKey: SceneKey; index: number }> = ({
  sceneKey,
  index,
}) => {
  const frame = useCurrentFrame();
  const timing = SCENES[sceneKey];
  const sceneProgress = progress(frame, timing.dur);
  const reveal = interpolate(frame, [6, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.forestDeep,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontFamily: FONTS.data,
          fontSize: 26,
          letterSpacing: "0.34em",
          textTransform: "uppercase",
          color: COLORS.gold,
          opacity: reveal,
        }}
      >
        {`Scene ${pad2(index + 1)}`}
      </div>
      <div
        style={{
          fontFamily: FONTS.display,
          fontSize: 64,
          color: COLORS.forestPale,
          marginTop: 24,
          opacity: reveal,
        }}
      >
        Awaiting Phase 2 scene build
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: 6,
          backgroundColor: "rgba(197, 217, 168, 0.12)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: "100%",
            backgroundColor: COLORS.gold,
            transform: `scaleX(${sceneProgress})`,
            transformOrigin: "left",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

const SceneSlot: React.FC<{ sceneKey: SceneKey; index: number }> = ({
  sceneKey,
  index,
}) => {
  const timing = SCENES[sceneKey];
  const SceneComponent = SCENE_REGISTRY[sceneKey];
  return (
    <Sequence
      from={timing.from}
      durationInFrames={timing.dur}
      name={`${pad2(index + 1)} · ${timing.from}–${timing.from + timing.dur}`}
    >
      {SceneComponent ? (
        <SceneComponent />
      ) : (
        <PlaceholderScene sceneKey={sceneKey} index={index} />
      )}
    </Sequence>
  );
};

const VideoContent: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.charcoal }}>
    {SCENE_KEYS.map((sceneKey, index) => (
      <SceneSlot key={sceneKey} sceneKey={sceneKey} index={index} />
    ))}
  </AbsoluteFill>
);

export const Video: React.FC = () => (
  <Composition
    id="DeforestationAwareness"
    component={VideoContent}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
  />
);
