import { describe, it, expect } from 'vitest'
import { pageInsets, PHONE_TOP_BAR, PHONE_BOTTOM_BAR } from '../layout'

describe('pageInsets', () => {
  it('reserves the desktop stat tab and the medallion capsule', () => {
    expect(pageInsets(false)).toEqual({ top: 52, right: 84, bottom: 0 })
  })

  it('reserves the phone top bar and bottom tool bar', () => {
    expect(pageInsets(true)).toEqual({ top: PHONE_TOP_BAR, right: 0, bottom: PHONE_BOTTOM_BAR })
  })

  it('maps mode strings to the same insets', () => {
    expect(pageInsets('desktop')).toEqual({ top: 52, right: 84, bottom: 0 })
    expect(pageInsets('phone')).toEqual({ top: PHONE_TOP_BAR, right: 0, bottom: PHONE_BOTTOM_BAR })
  })

  it('reserves the compact stat strip and right tool rail', () => {
    expect(pageInsets('compact')).toEqual({ top: 40, right: 60, bottom: 0 })
  })
})
