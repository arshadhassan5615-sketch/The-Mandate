// Automatic enactment: once veto power is removed, the Assembly's bills become
// law without a signature. The overlay must walk each bill to the reactions
// screen and advance, with no dead end.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import LegislationOverlay from '../LegislationOverlay'
import type { Bill } from '../../types/bills'
import { useBillStore } from '../../stores/billStore'
import { useGameStore } from '../../stores/gameStore'
import { useNarrativeStore } from '../../stores/narrativeStore'
import { useWeekStore } from '../../stores/weekStore'

const WEEK = 3

function makeBill(id: string): Bill {
  return {
    id,
    title: `Bill ${id}`,
    shortName: id.toUpperCase(),
    proposer: 'Unlisted proposer',
    faction: 'reformists',
    weekPresented: WEEK,
    fullText: 'Be it enacted.',
    budgetCost: 0,
    signEffects: [],
    vetoEffects: [],
    signFlags: [],
    vetoFlags: [],
    isVetoable: true,
  }
}

function setUpStores(bills: Bill[]) {
  useGameStore.getState().resetToInitial()
  useGameStore.setState({ currentWeek: WEEK })
  useBillStore.setState({
    bills,
    history: [],
    pendingBill: null,
    isOverlayOpen: false,
    vetoOverrideResult: null,
  })
  useNarrativeStore.setState({ activeFlags: ['veto_removed'] })
  useWeekStore.setState({ phase: 'legislation' })
}

describe('LegislationOverlay under reformed constitution (auto-passed bills)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows the enacted box first, then reactions with the advance button, and records auto_passed', () => {
    setUpStores([makeBill('bill_a')])
    render(<LegislationOverlay />)

    expect(screen.getByText(/Bill 1 of 1 Enacted/)).toBeInTheDocument()
    expect(screen.getByTestId('enacted-bill-title').textContent).toBe('Bill bill_a')
    expect(screen.queryByTestId('auto-passed-banner')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Proceed to Agenda' })).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(400)
    })

    expect(screen.queryByText(/Bill 1 of 1 Enacted/)).not.toBeInTheDocument()
    expect(screen.getByTestId('auto-passed-banner')).toHaveTextContent('Enacted Automatically')
    expect(screen.getByTestId('auto-passed-bill-title').textContent).toBe('Bill bill_a')
    expect(screen.getByRole('button', { name: 'Proceed to Agenda' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Proceed to Agenda' }))

    const { history } = useBillStore.getState()
    expect(history).toHaveLength(1)
    expect(history[0]).toMatchObject({ billId: 'bill_a', decision: 'auto_passed', weekDecided: WEEK })
    expect(useWeekStore.getState().phase).toBe('map')
  })

  it('auto-passes the second bill after advancing the first, with no dead end', () => {
    setUpStores([makeBill('bill_a'), makeBill('bill_b')])
    render(<LegislationOverlay />)

    expect(screen.getByText(/Bill 1 of 2 Enacted/)).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(400)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Next Bill →' }))

    // The second bill is now the current bill: it enters its own auto-pass flow.
    expect(useBillStore.getState().history.map(h => h.billId)).toEqual(['bill_a'])
    expect(useWeekStore.getState().phase).toBe('legislation')
    expect(screen.getByText(/Enacted/)).toBeInTheDocument()
    expect(screen.getByText(/Bill 2 of 2 Enacted/)).toBeInTheDocument()
    expect(screen.getByTestId('enacted-bill-title').textContent).toBe('Bill bill_b')
    expect(screen.queryByTestId('auto-passed-banner')).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(screen.getByTestId('auto-passed-banner')).toBeInTheDocument()
    expect(screen.getByTestId('auto-passed-bill-title').textContent).toBe('Bill bill_b')
    fireEvent.click(screen.getByRole('button', { name: 'Proceed to Agenda' }))

    const { history } = useBillStore.getState()
    expect(history.map(h => ({ billId: h.billId, decision: h.decision }))).toEqual([
      { billId: 'bill_a', decision: 'auto_passed' },
      { billId: 'bill_b', decision: 'auto_passed' },
    ])
    expect(useWeekStore.getState().phase).toBe('map')
  })
})
