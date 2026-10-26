import { interpolate } from "remotion";

export const clamp01 = (value: number): number =>
  Math.min(1, Math.max(0, value));

export const progress = (
  frame: number,
  durationInFrames: number,
): number => clamp01(frame / Math.max(1, durationInFrames));

export const windowProgress = (
  frame: number,
  startFrame: number,
  durationInFrames: number,
): number => clamp01((frame - startFrame) / Math.max(1, durationInFrames));

export type EasingFn = (input: number) => number;

export const mapRange = (
  frame: number,
  startFrame: number,
  durationInFrames: number,
  output: [number, number],
  easing?: EasingFn,
): number =>
  interpolate(frame, [startFrame, startFrame + durationInFrames], output, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

export const staggerOffset = (index: number, staggerFrames: number): number =>
  index * staggerFrames;
