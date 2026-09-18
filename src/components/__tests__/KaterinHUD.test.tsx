// KaterinHUD: framed portrait with no text overlay (identity lives in a popover);
// hidden during full-screen phases and while NewsOverlay is open.
import { describe, it, expect, beforeEach } from 'vitest'
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
