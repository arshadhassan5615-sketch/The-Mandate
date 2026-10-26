import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent, within } from '@testing-library/react'
import type { ViewportMode } from '../../hooks/useViewportMode'
import type { DiaryEntry } from '../../engine/DiaryEngine'
import EveningReview from '../EveningReview'
import DiaryScreen from '../DiaryScreen'
import RadioAddressView from '../RadioAddressView'
import { useGameStore } from '../../stores/gameStore'
import { useWeekStore } from '../../stores/weekStore'

const viewport = vi.hoisted(() => ({ mode: 'compact' as ViewportMode }))

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

const DIARY_ENTRY: DiaryEntry = {
  week: WEEK,
  date: 'Week 3',
  text: 'The Assembly sat late.\n\nThe papers said nothing new.',
  category: 'political',
}

// jsdom has no matchMedia pointer query by default; swap in a coarse pointer for one test.
function withCoarsePointer(run: () => void) {
  const original = window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === '(pointer: coarse)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
  try {
    run()
  } finally {
    Object.defineProperty(window, 'matchMedia', { writable: true, value: original })
  }
}

describe('EveningReview compact footer', () => {
  beforeEach(() => {
    viewport.mode = 'compact'
    useGameStore.getState().resetToInitial()
    useGameStore.setState({ currentWeek: WEEK })
    useWeekStore.setState({
      sceneQueue: [],
      weekStartSnapshot: null,
      gateBlocked: false,
      gateMessage: null,
      agendaPool: [],
    })
  })

  it('keeps the advance button in a footer outside the scrolling body', () => {
    render(<EveningReview />)

    const body = screen.getByTestId('evening-review-body')
    const footer = screen.getByTestId('evening-review-footer')

    expect(body).toHaveStyle({ overflowY: 'auto' })
    expect(body.contains(footer)).toBe(false)
    expect(within(footer).getByRole('button', { name: 'Advance to Week 4 →' })).toBeInTheDocument()
  })

  it('advances the week when the footer advance button is tapped', () => {
    const completeWeek = vi.fn()
    useWeekStore.setState({ completeWeek })
    render(<EveningReview />)

    const footer = screen.getByTestId('evening-review-footer')
    fireEvent.click(within(footer).getByRole('button', { name: 'Advance to Week 4 →' }))

    expect(completeWeek).toHaveBeenCalledTimes(1)
  })

  it('does not split the layout on desktop', () => {
    viewport.mode = 'desktop'
    render(<EveningReview />)

    expect(screen.queryByTestId('evening-review-body')).toBeNull()
    expect(screen.getByTestId('evening-review-footer')).toBeInTheDocument()
  })
})

describe('DiaryScreen tap to continue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it.each(['desktop', 'compact', 'phone'] as const)('continues on a tap of the screen (%s)', mode => {
    viewport.mode = mode
    const onContinue = vi.fn()
    const { container } = render(<DiaryScreen entry={DIARY_ENTRY} onContinue={onContinue} />)

    fireEvent.click(container.firstElementChild as HTMLElement)
    expect(onContinue).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(onContinue).toHaveBeenCalledTimes(1)
  })

  it('shows the keyboard hint with a mouse pointer', () => {
    viewport.mode = 'phone'
    render(<DiaryScreen entry={DIARY_ENTRY} onContinue={vi.fn()} />)

    expect(screen.getByText('Press Space to continue')).toBeInTheDocument()
  })

  it('shows the tap hint with a coarse pointer', () => {
    viewport.mode = 'phone'
    withCoarsePointer(() => {
      render(<DiaryScreen entry={DIARY_ENTRY} onContinue={vi.fn()} />)
    })

    expect(screen.getByText('Tap to continue')).toBeInTheDocument()
  })
})

describe('RadioAddressView compact footer', () => {
  beforeEach(() => {
    viewport.mode = 'compact'
    useGameStore.getState().resetToInitial()
    useWeekStore.setState({ phase: 'map' })
  })

  it('keeps Cancel and PREVIEW SPEECH in a footer outside the scrolling body', () => {
    render(<RadioAddressView onClose={vi.fn()} />)

    const body = screen.getByTestId('radio-body')
    const footer = screen.getByTestId('radio-footer')

    expect(body.contains(footer)).toBe(false)
    expect(within(footer).getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(within(footer).getByRole('button', { name: 'PREVIEW SPEECH' })).toBeInTheDocument()
  })

  it('closes when Cancel in the footer is tapped', () => {
    const onClose = vi.fn()
    render(<RadioAddressView onClose={onClose} />)

    fireEvent.click(within(screen.getByTestId('radio-footer')).getByRole('button', { name: 'Cancel' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('moves to the speech preview with TRANSMIT LIVE in the footer', () => {
    render(<RadioAddressView onClose={vi.fn()} />)

    fireEvent.click(within(screen.getByTestId('radio-footer')).getByRole('button', { name: 'PREVIEW SPEECH' }))

    expect(within(screen.getByTestId('radio-footer')).getByRole('button', { name: 'TRANSMIT LIVE' })).toBeInTheDocument()
    expect(within(screen.getByTestId('radio-footer')).getByRole('button', { name: /Change Theme/ })).toBeInTheDocument()
  })

  it('does not add a footer split on desktop', () => {
    viewport.mode = 'desktop'
    render(<RadioAddressView onClose={vi.fn()} />)

    expect(screen.queryByTestId('radio-footer')).toBeNull()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })
})
