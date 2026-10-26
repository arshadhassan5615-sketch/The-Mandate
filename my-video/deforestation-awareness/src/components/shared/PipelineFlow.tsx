import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, FONTS } from "../../tokens";
import { SPRING_CONFIGS, springProgress } from "../../utils/animation";

export type PipelineStep = {
  title: string;
  subtitle?: string;
};

type PipelineFlowProps = {
  steps: PipelineStep[];
  delay?: number;
  stagger?: number;
  accent?: string;
  style?: React.CSSProperties;
};

export const PipelineFlow: React.FC<PipelineFlowProps> = ({
  steps,
  delay = 0,
  stagger = 10,
  accent = COLORS.forestSage,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        width: "100%",
        ...style,
      }}
    >
      {steps.map((step, index) => {
        const p = springProgress(
          frame,
          fps,
          delay + index * stagger,
          SPRING_CONFIGS.entrance,
        );
        const isLast = index === steps.length - 1;
        return (
          <React.Fragment key={`${index}-${step.title}`}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: 260,
                opacity: p,
                transform: `translateY(${(1 - p) * 32}px)`,
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  border: `2px solid ${accent}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: FONTS.data,
                  fontSize: 28,
                  fontWeight: 600,
                  color: accent,
                  transform: `scale(${0.6 + p * 0.4})`,
                }}
              >
                {index + 1}
              </div>
              <div
                style={{
                  fontFamily: FONTS.heading,
                  fontSize: 28,
                  fontWeight: 600,
                  color: COLORS.cream,
                  textAlign: "center",
                  marginTop: 20,
                }}
              >
                {step.title}
              </div>
              {step.subtitle ? (
                <div
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 20,
                    color: COLORS.forestPale,
                    textAlign: "center",
                    marginTop: 10,
                    lineHeight: 1.4,
                  }}
                >
                  {step.subtitle}
                </div>
              ) : null}
            </div>
            {isLast ? null : (
              <div
                style={{
                  flex: 1,
                  alignSelf: "flex-start",
                  marginTop: 35,
                  margin: "35px 12px 0",
                }}
              >
                <div
                  style={{
                    height: 2,
                    width: "100%",
                    backgroundColor: accent,
                    opacity: 0.6,
                    transform: `scaleX(${p})`,
                    transformOrigin: "left",
                  }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
