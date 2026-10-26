import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../../tokens";
import { SPRING_CONFIGS, springProgress } from "../../utils/animation";

type SectionDividerProps = {
  index?: string;
  eyebrow?: string;
  title: string;
  background?: string;
  style?: React.CSSProperties;
};

export const SectionDivider: React.FC<SectionDividerProps> = ({
  index,
  eyebrow,
  title,
  background = COLORS.forestMid,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const content = springProgress(frame, fps, 10, SPRING_CONFIGS.entrance);
  const rule = springProgress(frame, fps, 26, SPRING_CONFIGS.gentle);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: background,
        justifyContent: "center",
        padding: "0 160px",
        overflow: "hidden",
        ...style,
      }}
    >
      {index ? (
        <div
          style={{
            position: "absolute",
            right: 80,
            bottom: -60,
            fontFamily: FONTS.display,
            fontSize: 460,
            fontWeight: 800,
            color: "rgba(197, 217, 168, 0.08)",
            lineHeight: 1,
          }}
        >
          {index}
        </div>
      ) : null}
      {eyebrow ? (
        <div
          style={{
            fontFamily: FONTS.eyebrow,
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: "0.34em",
            textTransform: "uppercase",
            color: COLORS.gold,
            opacity: content,
          }}
        >
          {eyebrow}
        </div>
      ) : null}
      <div
        style={{
          width: 120 * rule,
          height: 4,
          backgroundColor: COLORS.gold,
          margin: "36px 0",
        }}
      />
      <div
        style={{
          fontFamily: FONTS.display,
          fontSize: 150,
          fontWeight: 800,
          color: COLORS.cream,
          lineHeight: 1.05,
          maxWidth: 1400,
          opacity: content,
          transform: `translateY(${(1 - content) * 40}px)`,
        }}
      >
        {title}
      </div>
    </AbsoluteFill>
  );
};
