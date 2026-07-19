// KaterinHUD: hide during full-screen phases and while NewsOverlay is open.
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
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

  it('renders chancellor label from real game store when news is closed', () => {
    render(<KaterinHUD />)
    expect(screen.getByText('Katerin Ashavel')).toBeInTheDocument()
    expect(screen.getByText('Chancellor')).toBeInTheDocument()
    expect(screen.getByAltText('Chancellor Katerin Ashavel')).toBeInTheDocument()
  })

  it('returns null while useNewsStore isOpen is true', () => {
    act(() => { useNewsStore.getState().setOpen(true) })
    const { container } = render(<KaterinHUD />)
    expect(container.firstChild).toBeNull()
    expect(screen.queryByText('Katerin Ashavel')).not.toBeInTheDocument()
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
    expect(screen.queryByText('Katerin Ashavel')).not.toBeInTheDocument()

    act(() => { useNewsStore.getState().setOpen(false) })
    expect(screen.getByText('Katerin Ashavel')).toBeInTheDocument()
  })
})
