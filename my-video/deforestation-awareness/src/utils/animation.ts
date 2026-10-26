import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { SpringConfig } from "remotion";
import { EASING } from "../tokens";

export type BezierTuple = [number, number, number, number];

export const SPRING_CONFIGS = {
  gentle: { damping: 200, mass: 1, stiffness: 100, overshootClamping: false },
  entrance: { damping: 26, mass: 0.9, stiffness: 160, overshootClamping: false },
  overshoot: { damping: 12, mass: 0.7, stiffness: 140, overshootClamping: false },
} satisfies Record<string, SpringConfig>;

export const bezierEase = (bezier: BezierTuple) =>
  Easing.bezier(bezier[0], bezier[1], bezier[2], bezier[3]);

export const EASE_OUT = bezierEase(EASING.easeOut);
export const EASE_IN_OUT = bezierEase(EASING.easeInOut);
export const EASE_SPRING = bezierEase(EASING.spring);
export const EASE_CINEMATIC = bezierEase(EASING.cinematic);

export const springProgress = (
  frame: number,
  fps: number,
  delay = 0,
  config: SpringConfig = SPRING_CONFIGS.gentle,
): number => spring({ frame: frame - delay, fps, config });

export const useSpringProgress = (
  delay = 0,
  config: SpringConfig = SPRING_CONFIGS.gentle,
): number => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return springProgress(frame, fps, delay, config);
};

export const fadeOpacity = (
  frame: number,
  durationInFrames: number,
  fadeInFrames = 18,
  fadeOutFrames = 18,
): number =>
  Math.min(
    interpolate(frame, [0, Math.max(1, fadeInFrames)], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.quad),
    }),
    interpolate(
      frame,
      [Math.max(0, durationInFrames - Math.max(1, fadeOutFrames)), durationInFrames],
      [1, 0],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.in(Easing.quad),
      },
    ),
  );

export const useFadeOpacity = (fadeInFrames = 18, fadeOutFrames = 18): number => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return fadeOpacity(frame, durationInFrames, fadeInFrames, fadeOutFrames);
};
