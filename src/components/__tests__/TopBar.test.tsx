// Layout tests for TopBar: compact top-left resource chip + top-right week chip.
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import TopBar from '../TopBar'
import { useGameStore } from '../../stores/gameStore'
import { useNewsStore } from '../../stores/newsStore'

function resetStore() {
  useGameStore.getState().resetToInitial()
  useNewsStore.setState({ isOpen: false, articles: [], lastReadIndex: -1, readRecords: {} })
}

/** Direct children of the RTL container that are the two fixed chips. */
function fixedChips(container: HTMLElement): HTMLElement[] {
  return Array.from(container.children).filter(
    (el): el is HTMLElement =>
      el instanceof HTMLElement && el.style.position === 'fixed',
  )
}

describe('TopBar', () => {
  beforeEach(resetStore)

  it('renders seal label, resource values, and week from the real store', () => {
    useGameStore.setState({ currentWeek: 12 })
    render(<TopBar />)
    expect(screen.getByText('REPUBLIC OF VELTRIA')).toBeInTheDocument()
    expect(screen.getByText('OFFICE OF THE CHANCELLOR')).toBeInTheDocument()
    expect(screen.getByText(/WEEK 12 \/ 52/)).toBeInTheDocument()
    expect(screen.getByAltText('Veltria Seal')).toBeInTheDocument()
    expect(screen.getByAltText('Economy')).toBeInTheDocument()
    expect(screen.getByAltText('Treasury')).toBeInTheDocument()
    expect(screen.getByAltText('Wealth')).toBeInTheDocument()
    expect(screen.getByAltText('Approval')).toBeInTheDocument()
  })

  it('splits HUD into top-left resource chip and top-right week chip', () => {
    const { container } = render(<TopBar />)
    const chips = fixedChips(container)
    expect(chips.length).toBe(2)

    const left = chips.find((c) => c.style.left === '12px')
    const right = chips.find((c) => c.style.right === '12px')
    expect(left).toBeTruthy()
    expect(right).toBeTruthy()

    // Top edges and outer padding must match exactly (shared chipChrome)
    expect(left!.style.top).toBe('12px')
    expect(right!.style.top).toBe('12px')
    expect(left!.style.top).toBe(right!.style.top)
    expect(left!.style.padding).toBe('6px 10px')
    expect(right!.style.padding).toBe('6px 10px')
    expect(left!.style.padding).toBe(right!.style.padding)

    expect(left!.style.width).toBe('auto')
    expect(right!.style.width).toBe('auto')
    expect(left!.style.borderRadius).toBe('6px')
    expect(right!.style.borderRadius).toBe('6px')

    // Chip fill (jsdom keeps the authored string; normalize spaces)
    const bg = left!.style.background.replace(/\s/g, '')
    expect(bg).toContain('rgba(10,8,6,0.85)')

    // Not a full-width spanning bar
    expect(left!.style.right).not.toBe('0px')
    expect(left!.style.width).not.toBe('100%')

    // Week lives on the right chip only
    expect(right!.textContent).toMatch(/WEEK/)
    expect(left!.textContent).not.toMatch(/WEEK \d+ \/ 52/)
    expect(left!.textContent).toMatch(/REPUBLIC OF VELTRIA/)
  })

  it('scales body text smaller than the old full-bar sizes', () => {
    render(<TopBar />)
    const republic = screen.getByText('REPUBLIC OF VELTRIA')
    const week = screen.getByText(/WEEK \d+ \/ 52/)
    // Prior: 0.65rem / 0.8rem — compact targets ~15–20% down
    expect(republic.style.fontSize).toBe('0.54rem')
    expect(week.style.fontSize).toBe('0.66rem')
  })

  it('returns null while useNewsStore isOpen is true (does not paint over newspaper)', () => {
    act(() => { useNewsStore.getState().setOpen(true) })
    const { container } = render(<TopBar />)
    expect(container.firstChild).toBeNull()
    expect(screen.queryByText('REPUBLIC OF VELTRIA')).not.toBeInTheDocument()
    expect(screen.queryByText(/WEEK \d+ \/ 52/)).not.toBeInTheDocument()
  })

  it('renders again after news closes via setOpen(false)', () => {
    act(() => { useNewsStore.getState().setOpen(true) })
    render(<TopBar />)
    expect(screen.queryByText('REPUBLIC OF VELTRIA')).not.toBeInTheDocument()

    act(() => { useNewsStore.getState().setOpen(false) })
    expect(screen.getByText('REPUBLIC OF VELTRIA')).toBeInTheDocument()
  })
})
