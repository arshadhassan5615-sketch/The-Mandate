import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent, within } from '@testing-library/react'
import type { ViewportMode } from '../../hooks/useViewportMode'
import type { Bill } from '../../types/bills'
import LegislationOverlay from '../LegislationOverlay'
import { useBillStore } from '../../stores/billStore'
import { useGameStore } from '../../stores/gameStore'
import { useNarrativeStore } from '../../stores/narrativeStore'
import { useWeekStore } from '../../stores/weekStore'

const viewport = vi.hoisted(() => ({ mode: 'compact' as ViewportMode }))

// The shared setup mocks AudioManager without the lowercase `audioManager`
// instance the overlay uses for stamp music, so provide it for this file.
vi.mock('../../engine/AudioManager', () => ({
  audioManager: { fadeToTrack: vi.fn() },
  AudioManager: { play: vi.fn(), stop: vi.fn(), fadeOut: vi.fn(), setVolume: vi.fn() },
}))

vi.mock('../../hooks/usePageInsets', () => ({
  usePageInsets: () => {
    const insets = {
      desktop: { top: 52, right: 96, bottom: 0, left: 124 },
      compact: { top: 40, right: 64, bottom: 0, left: 80 },
      phone: { top: 52, right: 0, bottom: 60, left: 0 },
    }[viewport.mode]
    return {
      ...insets,
      isPhone: viewport.mode === 'phone',
      isCompact: viewport.mode === 'compact',
      mode: viewport.mode,
    }
  },
}))

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
    signFlags: [`${id}_signed`],
    vetoFlags: [`${id}_vetoed`],
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
  useNarrativeStore.setState({ activeFlags: [] })
  useWeekStore.setState({ phase: 'legislation' })
}

describe('LegislationOverlay dense (compact) layout', () => {
  beforeEach(() => {
    viewport.mode = 'compact'
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders Sign and Veto in a footer outside the scrolling body', () => {
    setUpStores([makeBill('bill_a')])
    render(<LegislationOverlay />)

    const body = screen.getByTestId('bill-body')
    const footer = screen.getByTestId('bill-footer')

    expect(within(footer).getByRole('button', { name: 'Sign' })).toBeInTheDocument()
    expect(within(footer).getByRole('button', { name: 'Veto' })).toBeInTheDocument()
    expect(body.contains(footer)).toBe(false)
    expect(footer.contains(body)).toBe(false)
    expect(body.contains(screen.getByRole('button', { name: 'Sign' }))).toBe(false)
    expect(body.contains(screen.getByRole('button', { name: 'Veto' }))).toBe(false)
  })

  it('keeps the bill text inside the scrolling body, not the footer', () => {
    setUpStores([makeBill('bill_a')])
    render(<LegislationOverlay />)

    expect(within(screen.getByTestId('bill-body')).getByText('Be it enacted.')).toBeInTheDocument()
    expect(screen.getByTestId('bill-body')).toHaveStyle({ overflowY: 'auto' })
  })

  it('signs the bill when Sign is clicked and applies the sign flags', () => {
    setUpStores([makeBill('bill_a')])
    render(<LegislationOverlay />)

    fireEvent.click(screen.getByRole('button', { name: 'Sign' }))

    expect(useNarrativeStore.getState().activeFlags).toContain('bill_a_signed')
    expect(useNarrativeStore.getState().activeFlags).not.toContain('bill_a_vetoed')

    act(() => {
      vi.advanceTimersByTime(3000)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Proceed to Agenda' }))

    const { history } = useBillStore.getState()
    expect(history).toHaveLength(1)
    expect(history[0]).toMatchObject({ billId: 'bill_a', decision: 'signed', weekDecided: WEEK })
    expect(useWeekStore.getState().phase).toBe('map')
  })

  it('vetoes the bill when Veto is clicked and applies the veto flags', () => {
    setUpStores([makeBill('bill_a')])
    render(<LegislationOverlay />)

    fireEvent.click(screen.getByRole('button', { name: 'Veto' }))

    expect(useNarrativeStore.getState().activeFlags).toContain('bill_a_vetoed')
    expect(useNarrativeStore.getState().activeFlags).not.toContain('bill_a_signed')

    act(() => {
      vi.advanceTimersByTime(2200)
    })
    expect(screen.getByRole('button', { name: 'Proceed to Agenda' })).toBeInTheDocument()
  })

  it('puts the Continue button in a non-scrolling footer after a decision', () => {
    setUpStores([makeBill('bill_a')])
    render(<LegislationOverlay />)

    fireEvent.click(screen.getByRole('button', { name: 'Sign' }))
    act(() => {
      vi.advanceTimersByTime(3000)
    })

    const reactionsBody = screen.getByTestId('bill-reactions-body')
    const reactionsFooter = screen.getByTestId('bill-reactions-footer')
    const continueButton = within(reactionsFooter).getByRole('button', { name: 'Proceed to Agenda' })

    expect(reactionsBody.contains(continueButton)).toBe(false)
    expect(reactionsFooter.contains(continueButton)).toBe(true)
  })
})

describe('LegislationOverlay desktop layout is unchanged', () => {
  beforeEach(() => {
    viewport.mode = 'desktop'
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not render the compact body or footer wrappers', () => {
    setUpStores([makeBill('bill_a')])
    render(<LegislationOverlay />)

    expect(screen.queryByTestId('bill-body')).not.toBeInTheDocument()
    expect(screen.queryByTestId('bill-footer')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Veto' })).toBeInTheDocument()
  })

  it('still signs the bill from the desktop Sign button', () => {
    setUpStores([makeBill('bill_a')])
    render(<LegislationOverlay />)

    fireEvent.click(screen.getByRole('button', { name: 'Sign' }))

    expect(useNarrativeStore.getState().activeFlags).toContain('bill_a_signed')
  })
})
