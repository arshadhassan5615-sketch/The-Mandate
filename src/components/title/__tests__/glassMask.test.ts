import { describe, it, expect } from 'vitest'
import { buildGlassMask, glassAlpha, MASK_LUM_LOW, MASK_LUM_HIGH, WINDOW_RECT } from '../glassMask'

const GREY_SCALE = 255
const MID_LUM = 0.145
const MID_TOLERANCE = 3

describe('glassAlpha', () => {
  it('returns 0 for black', () => {
    expect(glassAlpha(0, 0, 0)).toBe(0)
  })

  it('hides the window frame (dark pixel well below the low threshold)', () => {
    expect(glassAlpha(26, 26, 26)).toBe(0)
  })

  it('shows glass (bright pixel well above the high threshold) fully', () => {
    expect(glassAlpha(120, 130, 140)).toBe(255)
  })

  it('ramps smoothly to about half coverage at the midpoint luminance', () => {
    const v = Math.round(MID_LUM * GREY_SCALE)
    expect(Math.abs(glassAlpha(v, v, v) - 128)).toBeLessThanOrEqual(MID_TOLERANCE)
  })

  it('is 0 just below the low threshold and 255 just above the high threshold', () => {
    const lowV = Math.floor(MASK_LUM_LOW * GREY_SCALE)
    const highV = Math.ceil(MASK_LUM_HIGH * GREY_SCALE)
    expect(glassAlpha(lowV, lowV, lowV)).toBe(0)
    expect(glassAlpha(highV, highV, highV)).toBe(255)
  })

  it('exposes the window rectangle as fractions of the artwork', () => {
    expect(WINDOW_RECT).toEqual({ x: 0.58, y: 0.06, w: 0.19, h: 0.46 })
  })
})

describe('buildGlassMask', () => {
  it('keeps length, sets rgb to white, and sets alpha from glassAlpha', () => {
    const input = new Uint8ClampedArray([
      0, 0, 0, 255,
      26, 26, 26, 255,
      120, 130, 140, 255,
    ])
    const mask = buildGlassMask(input)

    expect(mask.length).toBe(input.length)
    expect(Array.from(mask.slice(0, 3))).toEqual([255, 255, 255])
    expect(mask[3]).toBe(glassAlpha(0, 0, 0))
    expect(mask[7]).toBe(glassAlpha(26, 26, 26))
    expect(mask[11]).toBe(glassAlpha(120, 130, 140))
    expect(Array.from(mask.slice(4, 7))).toEqual([255, 255, 255])
    expect(Array.from(mask.slice(8, 11))).toEqual([255, 255, 255])
  })

  it('does not mutate the input pixels', () => {
    const input = new Uint8ClampedArray([26, 26, 26, 255, 120, 130, 140, 255])
    const snapshot = Array.from(input)
    buildGlassMask(input)
    expect(Array.from(input)).toEqual(snapshot)
  })

  it('returns a new array, not the input instance', () => {
    const input = new Uint8ClampedArray([120, 130, 140, 255])
    expect(buildGlassMask(input)).not.toBe(input)
  })
})
