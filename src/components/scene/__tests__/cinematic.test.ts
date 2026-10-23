import { describe, it, expect } from 'vitest'
import { cardDwellMs, secondsToMs, zoomDurationS } from '../cinematic'

describe('cinematic timing', () => {
  it('adds the fade-in to the hold when motion is allowed', () => {
    expect(cardDwellMs(6000, false)).toBe(8200)
  })

  it('uses only the hold when reduced motion is requested', () => {
    expect(cardDwellMs(6000, true)).toBe(6000)
  })

  it('runs the zoom across fade-in, hold and fade-out', () => {
    expect(zoomDurationS(6000)).toBeCloseTo(10, 5)
  })

  it('converts seconds to whole milliseconds', () => {
    expect(secondsToMs(1.8)).toBe(1800)
  })
})
