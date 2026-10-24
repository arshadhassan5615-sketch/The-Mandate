import { describe, it, expect } from 'vitest'
import { pageInsets, HUD_LEFT_GUTTER, PHONE_TOP_BAR, PHONE_BOTTOM_BAR } from '../layout'

describe('pageInsets', () => {
  it('reserves the desktop stat tab, the medallion capsule and the crest/portrait gutter', () => {
    expect(pageInsets(false)).toEqual({ top: 52, right: 96, bottom: 0, left: 124 })
  })

  it('reserves the phone top bar and bottom tool bar', () => {
    expect(pageInsets(true)).toEqual({ top: PHONE_TOP_BAR, right: 0, bottom: PHONE_BOTTOM_BAR, left: 0 })
  })

  it('maps mode strings to the same insets', () => {
    expect(pageInsets('desktop')).toEqual({ top: 52, right: 96, bottom: 0, left: 124 })
    expect(pageInsets('phone')).toEqual({ top: PHONE_TOP_BAR, right: 0, bottom: PHONE_BOTTOM_BAR, left: 0 })
  })

  it('reserves the compact stat strip, right tool rail and crest gutter', () => {
    expect(pageInsets('compact')).toEqual({ top: 40, right: 64, bottom: 0, left: 80 })
  })

  it('keeps the desktop left gutter clear of the crest and portrait', () => {
    expect(HUD_LEFT_GUTTER).toBeGreaterThanOrEqual(118)
    expect(pageInsets('desktop').left).toBe(HUD_LEFT_GUTTER)
  })
})
