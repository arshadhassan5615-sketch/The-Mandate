import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../../tokens";
import { fadeOpacity } from "../../utils/animation";

type SceneWrapperProps = {
  background?: string;
  fadeIn?: number;
  fadeOut?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
};

export const SceneWrapper: React.FC<SceneWrapperProps> = ({
  background = COLORS.forestDeep,
  fadeIn = 18,
  fadeOut = 18,
  style,
  children,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const opacity = fadeOpacity(frame, durationInFrames, fadeIn, fadeOut);
  return (
    <AbsoluteFill
      style={{ backgroundColor: background, opacity, ...style }}
    >
      {children}
    </AbsoluteFill>
  );
};
