import React from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../../tokens";
import { SPRING_CONFIGS, springProgress } from "../../utils/animation";

type StatCardProps = {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  label: string;
  sublabel?: string;
  accent?: string;
  delay?: number;
  countDuration?: number;
  style?: React.CSSProperties;
};

export const StatCard: React.FC<StatCardProps> = ({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  label,
  sublabel,
  accent = COLORS.gold,
  delay = 0,
  countDuration = 60,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrance = springProgress(frame, fps, delay, SPRING_CONFIGS.entrance);
  const count = interpolate(frame, [delay, delay + countDuration], [0, value], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const formatted = count.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return (
    <div
      style={{
        display: "flex",
        gap: 28,
        opacity: entrance,
        transform: `translateY(${(1 - entrance) * 36}px)`,
        ...style,
      }}
    >
      <div
        style={{
          width: 6,
          backgroundColor: accent,
          borderRadius: 3,
          transform: `scaleY(${entrance})`,
          transformOrigin: "top",
        }}
      />
      <div>
        <div
          style={{
            fontFamily: FONTS.data,
            fontSize: 120,
            fontWeight: 700,
            color: accent,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {prefix}
          {formatted}
          {suffix}
        </div>
        <div
          style={{
            fontFamily: FONTS.eyebrow,
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: COLORS.cream,
            marginTop: 20,
          }}
        >
          {label}
        </div>
        {sublabel ? (
          <div
            style={{
              fontFamily: FONTS.body,
              fontSize: 24,
              color: COLORS.forestPale,
              marginTop: 12,
              maxWidth: 640,
              lineHeight: 1.45,
            }}
          >
            {sublabel}
          </div>
        ) : null}
      </div>
    </div>
  );
};
