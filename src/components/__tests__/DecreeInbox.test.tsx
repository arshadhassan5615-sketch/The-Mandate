// Decree inbox: the Chancellor can sign, reject for good, or postpone a decree
// one week (once). Drives the real component and store with real decrees.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DecreeInbox from '../DecreeInbox'
import { useDecreeStore } from '../../stores/decreeStore'
import { useGameStore } from '../../stores/gameStore'
import { ALL_DECREES } from '../../data/decrees'
import type { Decree } from '../../types/decree'

const decree = (id: string): Decree => {
  const found = ALL_DECREES.find(d => d.id === id)
  if (!found) throw new Error(`missing decree ${id}`)
  return found
}

function seed(pending: Decree[]) {
  useDecreeStore.setState({
    pendingDecrees: pending,
    signedDecrees: [],
    rejectedDecrees: [],
    tabledDecrees: [],
    selectedDecree: pending[0] ?? null,
    pendingLongTermEffects: [],
  })
}

/** Start a new week the way weekStore does. */
function nextWeek() {
  const g = useGameStore.getState()
  useGameStore.setState({ currentWeek: g.currentWeek + 1 })
  useDecreeStore.getState().initDecrees(g.currentWeek + 1, useGameStore.getState(), [])
}

describe('DecreeInbox decisions', () => {
  beforeEach(() => {
    useGameStore.getState().resetToInitial()
    useGameStore.setState({ currentWeek: 20 })
  })

  it('offers Reject and Postpone on an undecided decree', () => {
    seed([decree('decree_price_controls')])
    render(<DecreeInbox onClose={() => {}} />)
    expect(screen.getByRole('button', { name: 'Reject' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Postpone a week' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Sign decree' })).toBeEnabled()
  })

  it('rejects for good: stamped, no further actions, never offered again', () => {
    seed([decree('decree_price_controls')])
    render(<DecreeInbox onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Reject' }))

    expect(screen.getByTestId('decree-rejected-stamp')).toBeInTheDocument()
    expect(screen.queryByTestId('decree-actions')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Sign decree' })).toBeNull()

    nextWeek()
    expect(useDecreeStore.getState().pendingDecrees.some(d => d.id === 'decree_price_controls')).toBe(false)
  })

  it('postpones a decree to next week, and only once', () => {
    seed([decree('decree_price_controls'), decree('decree_nationalization')])
    const { unmount } = render(<DecreeInbox onClose={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Postpone a week' }))
    // Gone this week; the next decree is shown instead
    expect(useDecreeStore.getState().pendingDecrees.some(d => d.id === 'decree_price_controls')).toBe(false)
    unmount()

    nextWeek()
    expect(useDecreeStore.getState().pendingDecrees.some(d => d.id === 'decree_price_controls')).toBe(true)

    useDecreeStore.getState().selectDecree(decree('decree_price_controls'))
    render(<DecreeInbox onClose={() => {}} />)
    expect(screen.getByRole('button', { name: 'Already postponed once' })).toBeDisabled()
  })

  it('ignores a second postpone through the store too', () => {
    seed([decree('decree_price_controls')])
    useDecreeStore.getState().tableDecree('decree_price_controls')
    nextWeek()
    useDecreeStore.getState().tableDecree('decree_price_controls')
    expect(useDecreeStore.getState().pendingDecrees.some(d => d.id === 'decree_price_controls')).toBe(true)
  })

  it('shows the empty state when nothing is pending', () => {
    seed([])
    render(<DecreeInbox onClose={() => {}} />)
    expect(screen.getByText(/No decrees available this week/i)).toBeInTheDocument()
    expect(screen.queryByText(/Select a decree to review/i)).toBeNull()
  })
})

describe('DecreeInbox compact (landscape phone) layout', () => {
  const origW = window.innerWidth
  const origH = window.innerHeight

  beforeEach(() => {
    window.innerWidth = 844
    window.innerHeight = 390
    useGameStore.getState().resetToInitial()
    useGameStore.setState({ currentWeek: 20 })
  })
  afterEach(() => {
    window.innerWidth = origW
    window.innerHeight = origH
  })

  it('marks the root as compact', () => {
    seed([decree('decree_price_controls')])
    render(<DecreeInbox onClose={() => {}} />)
    expect(screen.getByTestId('decree-inbox-overlay')).toHaveAttribute('data-layout', 'compact')
  })

  it('keeps Sign, Reject and Postpone present', () => {
    seed([decree('decree_price_controls')])
    render(<DecreeInbox onClose={() => {}} />)
    expect(screen.getByRole('button', { name: 'Reject' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Postpone a week' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Sign decree' })).toBeEnabled()
  })

  it('pins the actions outside the scrolling document', () => {
    seed([decree('decree_price_controls')])
    render(<DecreeInbox onClose={() => {}} />)
    const scroll = screen.getByTestId('decree-doc-scroll')
    const actions = screen.getByTestId('decree-actions')
    expect(scroll.contains(actions)).toBe(false)
    expect(actions.contains(screen.getByRole('button', { name: 'Sign decree' }))).toBe(true)
    expect(actions.contains(screen.getByRole('button', { name: 'Reject' }))).toBe(true)
    expect(scroll.contains(screen.getByTestId('decree-detail-title'))).toBe(true)
  })
})
