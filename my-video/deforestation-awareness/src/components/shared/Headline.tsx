import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../../tokens";
import { SPRING_CONFIGS, springProgress } from "../../utils/animation";

type HeadlineProps = {
  text: string;
  size?: number;
  color?: string;
  delay?: number;
  stagger?: number;
  align?: "left" | "center" | "right";
  fontFamily?: string;
  maxWidth?: number | string;
  style?: React.CSSProperties;
};

export const Headline: React.FC<HeadlineProps> = ({
  text,
  size = 96,
  color = COLORS.cream,
  delay = 0,
  stagger = 2,
  align = "left",
  fontFamily = FONTS.display,
  maxWidth = "100%",
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");
  return (
    <div
      style={{
        fontFamily,
        fontSize: size,
        fontWeight: 700,
        color,
        lineHeight: 1.08,
        textAlign: align,
        maxWidth,
        ...style,
      }}
    >
      {words.map((word, index) => {
        const p = springProgress(
          frame,
          fps,
          delay + index * stagger,
          SPRING_CONFIGS.entrance,
        );
        return (
          <span
            key={`${index}-${word}`}
            style={{
              display: "inline-block",
              opacity: p,
              transform: `translateY(${(1 - p) * 48}px)`,
              marginRight: "0.28em",
              willChange: "transform, opacity",
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
