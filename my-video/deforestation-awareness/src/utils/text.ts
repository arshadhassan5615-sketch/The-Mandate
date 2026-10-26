import type { CSSProperties } from "react";
import { FONTS } from "../tokens";

export type FontKey = keyof typeof FONTS;

export const fontFamily = (key: FontKey): string => FONTS[key];

export const eyebrowStyle = (color: string, size = 22): CSSProperties => ({
  fontFamily: FONTS.eyebrow,
  fontSize: size,
  fontWeight: 600,
  letterSpacing: "0.32em",
  textTransform: "uppercase",
  color,
});

export const displayStyle = (
  size: number,
  color: string,
  weight = 700,
): CSSProperties => ({
  fontFamily: FONTS.display,
  fontSize: size,
  fontWeight: weight,
  color,
  lineHeight: 1.08,
});

export const headingStyle = (
  size: number,
  color: string,
  weight = 600,
): CSSProperties => ({
  fontFamily: FONTS.heading,
  fontSize: size,
  fontWeight: weight,
  color,
  lineHeight: 1.2,
});

export const bodyStyle = (
  size: number,
  color: string,
  weight = 400,
): CSSProperties => ({
  fontFamily: FONTS.body,
  fontSize: size,
  fontWeight: weight,
  color,
  lineHeight: 1.5,
});

export const dataStyle = (
  size: number,
  color: string,
  weight = 600,
): CSSProperties => ({
  fontFamily: FONTS.data,
  fontSize: size,
  fontWeight: weight,
  color,
  lineHeight: 1.1,
  fontVariantNumeric: "tabular-nums",
});
