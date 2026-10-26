import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONTS } from "../../tokens";

type DataBarProps = {
  label: string;
  value: number;
  maxValue: number;
  displayValue?: string;
  color?: string;
  trackColor?: string;
  delay?: number;
  duration?: number;
  height?: number;
  style?: React.CSSProperties;
};

export const DataBar: React.FC<DataBarProps> = ({
  label,
  value,
  maxValue,
  displayValue,
  color = COLORS.forestSage,
  trackColor = "rgba(197, 217, 168, 0.15)",
  delay = 0,
  duration = 50,
  height = 20,
  style,
}) => {
  const frame = useCurrentFrame();
  const ratio = maxValue > 0 ? Math.min(1, Math.max(0, value / maxValue)) : 0;
  const fill = interpolate(frame, [delay, delay + duration], [0, ratio], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div style={{ width: "100%", ...style }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontFamily: FONTS.heading,
            fontSize: 28,
            fontWeight: 600,
            color: COLORS.cream,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: FONTS.data,
            fontSize: 28,
            fontWeight: 700,
            color: COLORS.gold,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {displayValue ?? value.toLocaleString("en-US")}
        </div>
      </div>
      <div
        style={{
          width: "100%",
          height,
          backgroundColor: trackColor,
          borderRadius: height / 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: color,
            borderRadius: height / 2,
            transform: `scaleX(${fill})`,
            transformOrigin: "left",
          }}
        />
      </div>
    </div>
  );
};
