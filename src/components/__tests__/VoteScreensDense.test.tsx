import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent, within } from '@testing-library/react'
import type { ViewportMode } from '../../hooks/useViewportMode'
import type { VoteConfig, VoteResult } from '../../types/vote'
import { SPEND_OPTIONS } from '../../types/vote'
import VoteResultView from '../VoteResult'
import LobbyingInterface from '../LobbyingInterface'
import { useGameStore } from '../../stores/gameStore'
import { useNarrativeStore } from '../../stores/narrativeStore'
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

// Mirrors agenda_w13_lobbying in src/data/agenda/week13.json.
const NO_CONFIDENCE: VoteConfig = {
  voteType: 'no_confidence',
  threshold: 126,
  totalSeats: 250,
  successFlags: ['no_confidence_defeated', 'act1_climax_resolved', 'transition_to_act2'],
  failureFlags: ['no_confidence_passed', 'government_fallen'],
  corruptionRisk: 'medium',
  lobbyingEnabled: true,
  narrativeSceneId: 'act1_week13_no_confidence',
}

// Far enough from the threshold that the result stage follows the count directly.
const PASSED_RESULT: VoteResult = {
  projection: {
    yesSeats: 150,
    noSeats: 90,
    undecidedSeats: 10,
    threshold: 126,
    totalSeats: 250,
    willPass: true,
    margin: 24,
    breakdown: [],
  },
  spendLevel: 0,
  finalYesSeats: 150,
  finalNoSeats: 90,
  finalUndecidedSeats: 10,
  passed: true,
  margin: 24,
  corruptionFlagSet: false,
  personalWealthSpent: 0,
}

// Voting (3000ms) + counting (5000ms) + settle (800ms) lands on the result stage.
const RESULT_STAGE_MS = 9000
const STEP_MS = 100

// Each stage schedules the next from a re-render, so time must advance in small steps
// with an act() flush between them.
function advanceToResultStage() {
  for (let elapsed = 0; elapsed < RESULT_STAGE_MS; elapsed += STEP_MS) {
    act(() => {
      vi.advanceTimersByTime(STEP_MS)
    })
  }
}

describe('VoteResult dense (non-desktop) layout', () => {
  let advanceSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    viewport.mode = 'compact'
    vi.useFakeTimers()
    advanceSpy = vi.fn(async () => {})
    useWeekStore.setState({
      phase: 'vote_result',
      voteConfig: NO_CONFIDENCE,
      voteResult: PASSED_RESULT,
      advanceQueue: advanceSpy as unknown as () => Promise<void>,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders CONTINUE in a footer outside the scrolling body', () => {
    render(<VoteResultView />)

    const body = screen.getByTestId('vote-result-body')
    const footer = screen.getByTestId('vote-result-footer')
    const button = within(footer).getByRole('button', { name: 'CONTINUE' })

    expect(body.contains(footer)).toBe(false)
    expect(body.contains(button)).toBe(false)
    expect(button).toHaveStyle({ minHeight: '44px' })
  })

  it('keeps CONTINUE disabled until the result stage, then advances on click', () => {
    render(<VoteResultView />)

    const button = screen.getByRole('button', { name: 'CONTINUE' })
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(advanceSpy).not.toHaveBeenCalled()

    advanceToResultStage()

    expect(screen.getByRole('button', { name: 'CONTINUE' })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'CONTINUE' }))
    expect(advanceSpy).toHaveBeenCalledTimes(1)
  })

  it('keeps the original floating CONTINUE on desktop with no footer', () => {
    viewport.mode = 'desktop'
    render(<VoteResultView />)

    expect(screen.queryByTestId('vote-result-footer')).toBeNull()
    expect(screen.queryByRole('button', { name: 'CONTINUE' })).toBeNull()

    advanceToResultStage()
    fireEvent.click(screen.getByRole('button', { name: 'CONTINUE' }))
    expect(advanceSpy).toHaveBeenCalledTimes(1)
  })
})

describe('LobbyingInterface dense (non-desktop) layout', () => {
  beforeEach(() => {
    viewport.mode = 'compact'
    useGameStore.getState().resetToInitial()
    useNarrativeStore.setState({ activeFlags: [] })
    useWeekStore.setState({
      phase: 'lobbying',
      voteConfig: NO_CONFIDENCE,
      voteResult: null,
    })
  })

  it('renders the commit action in a footer outside the scrolling body', () => {
    render(<LobbyingInterface />)

    const body = screen.getByTestId('lobbying-body')
    const footer = screen.getByTestId('lobbying-footer')
    const commit = within(footer).getByRole('button', { name: 'PROCEED WITHOUT SPENDING' })

    expect(body.contains(footer)).toBe(false)
    expect(body.contains(commit)).toBe(false)
    expect(commit).toHaveStyle({ minHeight: '44px' })
  })

  it('renders every spend option as a chip at least 40px tall in the body', () => {
    render(<LobbyingInterface />)

    const chips = within(screen.getByTestId('lobbying-body')).getAllByRole('button')
    expect(chips).toHaveLength(SPEND_OPTIONS.length)
    for (const chip of chips) {
      expect(chip).toHaveStyle({ minHeight: '40px' })
    }
  })

  it('commits the lobbying step: sets vote_result and one outcome flag set', () => {
    render(<LobbyingInterface />)

    fireEvent.click(screen.getByRole('button', { name: 'PROCEED WITHOUT SPENDING' }))

    const state = useWeekStore.getState()
    expect(state.phase).toBe('vote_result')
    expect(state.voteResult).not.toBeNull()

    const flags = useNarrativeStore.getState().activeFlags
    const successHits = NO_CONFIDENCE.successFlags.filter(f => flags.includes(f))
    const failureHits = NO_CONFIDENCE.failureFlags.filter(f => flags.includes(f))
    expect(successHits.length + failureHits.length).toBeGreaterThan(0)
    expect(successHits.length > 0 && failureHits.length > 0).toBe(false)
  })

  it('keeps the commit action inside the layout on desktop', () => {
    viewport.mode = 'desktop'
    render(<LobbyingInterface />)

    expect(screen.queryByTestId('lobbying-footer')).toBeNull()
    expect(screen.getByRole('button', { name: 'PROCEED WITHOUT SPENDING' })).toBeInTheDocument()
  })
})
