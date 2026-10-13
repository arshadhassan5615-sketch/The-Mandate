// The desk: this week's meetings with a Begin button each, the same next
// meeting per province the map pins offer.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DeskScreen from '../DeskScreen'
import { nextMeetings } from '../nextMeetings'
import { useWeekStore } from '../../../stores/weekStore'
import { useNarrativeStore } from '../../../stores/narrativeStore'
import { useGameStore } from '../../../stores/gameStore'
import type { AgendaItem } from '../../../types/week'

const meeting = (id: string, order: number, over: Partial<AgendaItem> = {}): AgendaItem => ({
  id, title: `Meeting ${id}`, description: `About ${id}`, category: 'cabinet',
  sceneId: 'act1_week1_first_briefing', slotCost: 1, executionOrder: order, weekAvailable: 1, ...over,
})

describe('nextMeetings', () => {
  it('offers one meeting per province, in execution order', () => {
    const pool = [meeting('b', 2), meeting('a', 1)]
    const slots = nextMeetings(pool, [], [])
    expect(slots).toHaveLength(1)
    expect(slots[0].item.id).toBe('a')
  })

  it('moves on once a meeting is completed', () => {
    const pool = [meeting('a', 1), meeting('b', 2)]
    expect(nextMeetings(pool, [], ['a'])[0].item.id).toBe('b')
  })
})

describe('DeskScreen', () => {
  beforeEach(() => {
    useGameStore.getState().resetToInitial()
    useNarrativeStore.setState({ visitedSceneIds: [] })
    useWeekStore.setState({ agendaPool: [meeting('a', 1, { isUrgent: true })], completedItemIds: [] })
  })

  it('lists the week and its meetings', () => {
    render(<DeskScreen />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('1963')
    expect(screen.getAllByTestId('desk-meeting')).toHaveLength(1)
    expect(screen.getByText('Meeting a')).toBeInTheDocument()
    expect(screen.getByText('URGENT')).toBeInTheDocument()
  })

  it('begins a meeting exactly as a map pin would', () => {
    const launch = vi.fn()
    useWeekStore.setState({ launchSingleScene: launch })
    render(<DeskScreen />)
    fireEvent.click(screen.getByRole('button', { name: /Begin meeting/ }))
    expect(launch).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }))
  })

  it('says when the week is done', () => {
    useWeekStore.setState({ completedItemIds: ['a'] })
    render(<DeskScreen />)
    expect(screen.getByText(/week's business is concluded/)).toBeInTheDocument()
    expect(screen.getByText('Concluded this week')).toBeInTheDocument()
  })
})
