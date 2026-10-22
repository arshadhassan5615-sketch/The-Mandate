/** Window frame is darker than this: snow fully hidden. */
export const MASK_LUM_LOW = 0.12
/** Glass is brighter than this: snow fully visible. */
export const MASK_LUM_HIGH = 0.17
/** Source rectangle of the window inside the artwork, as fractions. */
export const WINDOW_RECT = { x: 0.58, y: 0.06, w: 0.19, h: 0.46 } as const

const RGBA_STRIDE = 4
const MAX_CHANNEL = 255
const LUM_RED = 0.2126
const LUM_GREEN = 0.7152
const LUM_BLUE = 0.0722

/**
 * Maps one pixel's colour to a glass coverage alpha (0..255).
 * Dark frame pixels map to 0, bright glass pixels map to 255, with a
 * smoothstep ramp between the two luminance thresholds.
 */
export function glassAlpha(r: number, g: number, b: number): number {
  const lum = (LUM_RED * r + LUM_GREEN * g + LUM_BLUE * b) / MAX_CHANNEL
  const t = Math.min(1, Math.max(0, (lum - MASK_LUM_LOW) / (MASK_LUM_HIGH - MASK_LUM_LOW)))
  const smooth = t * t * (3 - 2 * t)
  return Math.round(smooth * MAX_CHANNEL)
}

/**
 * Builds a white RGBA mask from RGBA pixels, where the alpha channel is the
 * glass coverage of each input pixel. Returns a new array; the input is untouched.
 */
export function buildGlassMask(pixels: Uint8ClampedArray): Uint8ClampedArray {
  const mask = new Uint8ClampedArray(pixels.length)
  for (let i = 0; i < pixels.length; i += RGBA_STRIDE) {
    mask[i] = MAX_CHANNEL
    mask[i + 1] = MAX_CHANNEL
    mask[i + 2] = MAX_CHANNEL
    mask[i + 3] = glassAlpha(pixels[i], pixels[i + 1], pixels[i + 2])
  }
  return mask
}
