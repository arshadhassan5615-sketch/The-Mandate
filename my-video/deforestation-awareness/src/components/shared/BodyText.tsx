import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../../tokens";
import { SPRING_CONFIGS, springProgress } from "../../utils/animation";

type BodyTextProps = {
  text: string;
  size?: number;
  color?: string;
  delay?: number;
  maxWidth?: number | string;
  align?: "left" | "center" | "right";
  weight?: number;
  lineHeight?: number;
  style?: React.CSSProperties;
};

export const BodyText: React.FC<BodyTextProps> = ({
  text,
  size = 30,
  color = COLORS.forestPale,
  delay = 0,
  maxWidth = 900,
  align = "left",
  weight = 400,
  lineHeight = 1.5,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = springProgress(frame, fps, delay, SPRING_CONFIGS.gentle);
  return (
    <div
      style={{
        fontFamily: FONTS.body,
        fontSize: size,
        fontWeight: weight,
        color,
        maxWidth,
        textAlign: align,
        lineHeight,
        opacity: p,
        transform: `translateY(${(1 - p) * 28}px)`,
        ...style,
      }}
    >
      {text}
    </div>
  );
};
