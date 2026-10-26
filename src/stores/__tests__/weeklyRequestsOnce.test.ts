import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createElement, useEffect } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { MinisterRequest, MinistryType } from '../../types/minister'
import { useCabinetStore } from '../cabinetStore'
import { useGameStore } from '../gameStore'
import { useWeekStore } from '../weekStore'
import { resetWorld } from '../../test/simHarness'
import { MINISTER_CANDIDATES } from '../../data/ministers'
import { CabinetMeeting } from '../../components/CabinetMeeting'

vi.mock('../../hooks/usePageInsets', () => ({
  usePageInsets: () => ({
    top: 52,
    right: 96,
    bottom: 0,
    left: 124,
    isPhone: false,
    isCompact: false,
    mode: 'desktop',
  }),
}))

const EMPTY_MINISTERS: Record<MinistryType, null> = {
  finance: null,
  interior: null,
  defense: null,
  justice: null,
  labor: null,
  foreign_affairs: null,
  education: null,
  health: null,
  development: null,
  resources: null,
}

const candidateFor = (ministry: MinistryType) => {
  const candidate = MINISTER_CANDIDATES.find(c => c.ministry === ministry)
  if (!candidate) throw new Error(`No candidate for ${ministry}`)
  return candidate
}

/** Formation complete with finance + foreign affairs appointed. Week 4 yields the finance
 *  budget report and the foreign affairs ambassador request; week 5 yields only the latter. */
const setUpCabinet = (week: number) => {
  useCabinetStore.setState({
    ministers: { ...EMPTY_MINISTERS },
    dismissedMinisters: [],
    formation_complete: false,
    formation_week: null,
    pending_requests: [],
    completed_requests: [],
    requests_generated_week: null,
  })
  useGameStore.setState({ currentWeek: week })
  useCabinetStore.getState().appointMinister(candidateFor('finance'), 1)
  useCabinetStore.getState().appointMinister(candidateFor('foreign_affairs'), 1)
  useCabinetStore.getState().completeFormation(1)
}

const makeRequest = (id: string, title: string): MinisterRequest => ({
  id,
  minister_id: 'unknown_minister',
  week: 1,
  type: 'policy',
  title,
  description: `${title} description.`,
  urgent: false,
  options: [
    {
      id: `${id}_approve`,
      text: `Approve ${title}`,
      stat_effects: {},
      loyalty_effect: 1,
      satisfaction_effect: 1,
      consequence: 'Moves forward',
    },
    {
      id: `${id}_reject`,
      text: `Reject ${title}`,
      stat_effects: {},
      loyalty_effect: -1,
      satisfaction_effect: -1,
      consequence: 'Shelved',
    },
  ],
})

describe('weekly minister requests are generated once per week', () => {
  beforeEach(() => {
    resetWorld()
    setUpCabinet(4)
  })

  afterEach(() => {
    cleanup()
  })

  it('generates on the first initWeek of a week and opens the meeting', () => {
    // Act
    useWeekStore.getState().initWeek()

    // Assert
    expect(useCabinetStore.getState().pending_requests.length).toBeGreaterThan(0)
    expect(useCabinetStore.getState().requests_generated_week).toBe(4)
    expect(useWeekStore.getState().showCabinetMeeting).toBe(true)
  })

  it('does not regenerate requests when the meeting is dismissed within the same week', () => {
    // Arrange
    useWeekStore.getState().initWeek()
    const countAfterInit = useCabinetStore.getState().pending_requests.length

    // Act
    useWeekStore.getState().dismissCabinetMeeting()

    // Assert
    expect(useCabinetStore.getState().pending_requests.length).toBe(countAfterInit)
    expect(useWeekStore.getState().showCabinetMeeting).toBe(false)
  })

  it('does not regenerate on repeated initWeek calls within the same week', () => {
    // Arrange
    useWeekStore.getState().initWeek()
    const countAfterInit = useCabinetStore.getState().pending_requests.length

    // Act
    useWeekStore.getState().initWeek()
    useWeekStore.getState().initWeek()

    // Assert
    expect(useCabinetStore.getState().pending_requests.length).toBe(countAfterInit)
    expect(useWeekStore.getState().showCabinetMeeting).toBe(false)
  })

  it('generates again once the week advances', () => {
    // Arrange
    useWeekStore.getState().initWeek()
    useWeekStore.getState().dismissCabinetMeeting()
    const countWeek4 = useCabinetStore.getState().pending_requests.length
    useCabinetStore.setState({ pending_requests: [] })
    useGameStore.setState({ currentWeek: 5 })

    // Act
    useWeekStore.getState().initWeek()

    // Assert
    expect(useCabinetStore.getState().requests_generated_week).toBe(5)
    expect(useCabinetStore.getState().pending_requests.length).toBeGreaterThan(0)
    expect(useCabinetStore.getState().pending_requests.length).toBeLessThanOrEqual(countWeek4)
    expect(useWeekStore.getState().showCabinetMeeting).toBe(true)
  })

  it('marks the week as generated even when no request was produced, so it is not retried', () => {
    // Arrange: no ministers appointed, so generateWeeklyRequests returns nothing
    useCabinetStore.setState({ ministers: { ...EMPTY_MINISTERS } })

    // Act
    useWeekStore.getState().initWeek()

    // Assert
    expect(useCabinetStore.getState().pending_requests).toHaveLength(0)
    expect(useCabinetStore.getState().requests_generated_week).toBe(4)
    expect(useWeekStore.getState().showCabinetMeeting).toBe(false)
  })
})

describe('CabinetMeeting walks each request exactly once', () => {
  beforeEach(() => {
    resetWorld()
    useCabinetStore.setState({
      pending_requests: [
        makeRequest('first_req', 'First Directive'),
        makeRequest('second_req', 'Second Directive'),
      ],
      completed_requests: [],
    })
  })

  afterEach(() => {
    cleanup()
  })

  /** Mirrors GameLayout: the parent re-renders from the live store list, which shrinks
   *  as requests are completed. */
  const LiveHost = ({ onComplete }: { onComplete: () => void }) => {
    const pending = useCabinetStore(s => s.pending_requests)
    useEffect(() => undefined, [pending])
    return createElement(CabinetMeeting, { requests: pending, onComplete })
  }

  it('shows the second request after the first is decided, with a "2 of 2" header', () => {
    // Arrange
    render(createElement(LiveHost, { onComplete: vi.fn() }))
    expect(screen.getByText('First Directive')).toBeInTheDocument()
    expect(screen.getByText('1 of 2')).toBeInTheDocument()

    // Act
    fireEvent.click(screen.getByTestId('cabinet-option-first_req_approve'))
    fireEvent.click(screen.getByTestId('cabinet-meeting-next'))

    // Assert
    expect(screen.getByText('Second Directive')).toBeInTheDocument()
    expect(screen.getByText('2 of 2')).toBeInTheDocument()
    expect(useCabinetStore.getState().completed_requests).toEqual(['first_req'])
  })
})
