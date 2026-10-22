// KaterinHUD: framed portrait with no text overlay (identity lives in a popover);
// hidden during full-screen phases and while NewsOverlay is open.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import KaterinHUD from '../KaterinHUD'
import { useGameStore } from '../../stores/gameStore'
import { useWeekStore } from '../../stores/weekStore'
import { useNewsStore } from '../../stores/newsStore'

function resetStores() {
  useGameStore.getState().resetToInitial()
  useWeekStore.setState({ phase: 'map' })
  useNewsStore.setState({ isOpen: false, articles: [], lastReadIndex: -1, readRecords: {} })
}

describe('KaterinHUD', () => {
  beforeEach(resetStores)

  it('renders the framed portrait and stress bar with no name/act text when news is closed', () => {
    render(<KaterinHUD />)
    expect(screen.getByAltText('Chancellor Katerin Ashavel')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Stress' })).toBeInTheDocument()
    // 6E-2 removed the text block: identity only appears in the popover.
    expect(screen.queryByText('Katerin Ashavel')).not.toBeInTheDocument()
    expect(screen.queryByText('Chancellor')).not.toBeInTheDocument()
    expect(screen.queryByText(/^Act [IVX]+$/)).not.toBeInTheDocument()
  })

  it('person button opens the identity popover with act, name and title', () => {
    render(<KaterinHUD />)
    fireEvent.click(screen.getByRole('button', { name: 'Chancellor details' }))
    expect(screen.getByRole('dialog', { name: 'Chancellor details' })).toBeInTheDocument()
    expect(screen.getByText('Katerin Ashavel')).toBeInTheDocument()
    expect(screen.getByText('Chancellor')).toBeInTheDocument()
    expect(screen.getByText(/^Act [IVX]+$/)).toBeInTheDocument()
  })

  it('returns null while useNewsStore isOpen is true', () => {
    act(() => { useNewsStore.getState().setOpen(true) })
    const { container } = render(<KaterinHUD />)
    expect(container.firstChild).toBeNull()
    expect(screen.queryByAltText('Chancellor Katerin Ashavel')).not.toBeInTheDocument()
  })

  it('returns null during agenda phase (existing chrome gate)', () => {
    useWeekStore.setState({ phase: 'agenda' })
    const { container } = render(<KaterinHUD />)
    expect(container.firstChild).toBeNull()
  })

  it('returns null during scene phase (existing chrome gate)', () => {
    useWeekStore.setState({ phase: 'scene' })
    const { container } = render(<KaterinHUD />)
    expect(container.firstChild).toBeNull()
  })

  it('renders again after news closes via setOpen(false)', () => {
    act(() => { useNewsStore.getState().setOpen(true) })
    render(<KaterinHUD />)
    expect(screen.queryByAltText('Chancellor Katerin Ashavel')).not.toBeInTheDocument()

    act(() => { useNewsStore.getState().setOpen(false) })
    expect(screen.getByAltText('Chancellor Katerin Ashavel')).toBeInTheDocument()
  })
})

describe('KaterinHUD compact (landscape phone)', () => {
  const originalWidth = window.innerWidth
  const originalHeight = window.innerHeight

  function setViewport(width: number, height: number) {
    Object.defineProperty(window, 'innerWidth', { value: width, configurable: true, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: height, configurable: true, writable: true })
  }

  beforeEach(resetStores)
  afterEach(() => setViewport(originalWidth, originalHeight))

  it('renders a 56px-wide portrait frame with data-layout="compact" at 844x390', () => {
    setViewport(844, 390)
    const { container } = render(<KaterinHUD />)
    const root = container.firstChild as HTMLElement
    expect(root).toHaveAttribute('data-layout', 'compact')
    const frame = screen.getByAltText('Chancellor Katerin Ashavel').parentElement as HTMLElement
    expect(frame).toHaveStyle({ width: '56px', height: '70px' })
    expect(screen.getByRole('button', { name: 'Chancellor details' })).toHaveStyle({ width: '28px', height: '28px' })
  })

  it('renders over the map phase in compact mode', () => {
    setViewport(844, 390)
    useWeekStore.setState({ phase: 'map' })
    const { container } = render(<KaterinHUD />)
    expect(container.querySelector('[data-layout="compact"]')).not.toBeNull()
  })

  it('renders nothing in compact mode outside the map phase', () => {
    setViewport(844, 390)
    useWeekStore.setState({ phase: 'briefing' })
    const { container } = render(<KaterinHUD />)
    expect(container.firstChild).toBeNull()
  })

  it('still renders during the briefing phase at desktop size', () => {
    setViewport(1440, 900)
    useWeekStore.setState({ phase: 'briefing' })
    render(<KaterinHUD />)
    expect(screen.getByAltText('Chancellor Katerin Ashavel')).toBeInTheDocument()
  })

  it('keeps the full-size frame on desktop', () => {
    setViewport(1440, 900)
    const { container } = render(<KaterinHUD />)
    expect((container.firstChild as HTMLElement)).toHaveAttribute('data-layout', 'desktop')
    const frame = screen.getByAltText('Chancellor Katerin Ashavel').parentElement as HTMLElement
    expect(frame).toHaveStyle({ width: '96px' })
  })
})
