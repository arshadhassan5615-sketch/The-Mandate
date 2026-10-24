import { describe, it, expect } from 'vitest'
import { ROOT_FONT_PX, rem } from '../typography'
import { FONT_SIZE_CSS } from '../../stores/settingsStore'

describe('rem', () => {
  it('converts the normal root size to 1rem', () => {
    expect(rem(18)).toBe('1rem')
  })

  it('converts half the root size to 0.5rem', () => {
    expect(rem(9)).toBe('0.5rem')
  })

  it('rounds the converted value to four decimal places', () => {
    expect(rem(11)).toBe('0.6111rem')
  })
})

describe('ROOT_FONT_PX', () => {
  it('matches the normal text-size setting so the two cannot drift apart', () => {
    expect(ROOT_FONT_PX).toBe(parseFloat(FONT_SIZE_CSS.normal))
  })
})
