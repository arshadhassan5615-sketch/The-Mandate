import { describe, it, expect } from 'vitest'
import { pinTipOffsetY, PIN_TIP_OFFSET_X } from '../pinPlacement'
import { SEAL_TILT_RATIO, sealLift, sealSizeFor } from '../seals/provinceSeals'

describe('pinTipOffsetY', () => {
  it('places a seal province pin just above the medal', () => {
    const expected = -Math.round(sealSizeFor('kravenstal') * SEAL_TILT_RATIO * 0.46) - sealLift('kravenstal')
    expect(pinTipOffsetY('kravenstal')).toBe(expected)
  })

  it('falls back to a fixed offset for an unknown province', () => {
    expect(pinTipOffsetY('nowhere')).toBe(-40)
  })
})

describe('PIN_TIP_OFFSET_X', () => {
  it('centres pins horizontally on the anchor', () => {
    expect(PIN_TIP_OFFSET_X).toBe(0)
  })
})
