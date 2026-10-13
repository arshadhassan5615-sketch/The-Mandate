import { describe, it, expect } from 'vitest'
import { pageInsets, COMMAND_BAR_HEIGHT, PHONE_TOP_BAR, PHONE_BOTTOM_BAR } from '../layout'

describe('pageInsets', () => {
  it('reserves the desktop command bar and no side rail', () => {
    expect(pageInsets(false)).toEqual({ top: COMMAND_BAR_HEIGHT, right: 0, bottom: 0 })
  })

  it('reserves the phone top bar and bottom tool bar', () => {
    expect(pageInsets(true)).toEqual({ top: PHONE_TOP_BAR, right: 0, bottom: PHONE_BOTTOM_BAR })
  })
})
