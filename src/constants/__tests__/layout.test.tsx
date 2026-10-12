import { describe, it, expect, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { pageInsets, PHONE_GOV_ROW_TOP, PHONE_RAIL_BUTTON, PHONE_BOTTOM_BAR } from '../layout'
import LeftSidebar from '../../components/LeftSidebar'

describe('pageInsets', () => {
  it('reserves the desktop top strip and right rail', () => {
    expect(pageInsets(false)).toEqual({ top: 48, right: 60, bottom: 0 })
  })

  it('reserves the phone Government row and bottom bar, not a right rail', () => {
    const phone = pageInsets(true)
    expect(phone.top).toBeGreaterThan(PHONE_GOV_ROW_TOP + PHONE_RAIL_BUTTON)
    expect(phone.right).toBe(0)
    expect(phone.bottom).toBe(PHONE_BOTTOM_BAR)
  })
})

describe('LeftSidebar on a phone', () => {
  const desktopWidth = window.innerWidth
  afterEach(() => { window.innerWidth = desktopWidth })

  it('lays the Government buttons out as a row under the TopBar', () => {
    window.innerWidth = 390
    render(<LeftSidebar />)
    const nav = screen.getByRole('navigation', { name: 'Government' })
    expect(nav.style.flexDirection).toBe('row')
    expect(nav.style.top).toBe(`${PHONE_GOV_ROW_TOP}px`)
  })

  it('keeps the desktop column', () => {
    window.innerWidth = 1440
    render(<LeftSidebar />)
    expect(screen.getByRole('navigation', { name: 'Government' }).style.flexDirection).toBe('column')
  })
})
