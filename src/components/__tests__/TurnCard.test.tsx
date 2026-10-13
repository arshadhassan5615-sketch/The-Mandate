// Turn card: shows the new week with last week's decisions, stays after the
// engine's short week transition ends, and is dismissed by the player.
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import TransitionOverlay from '../TransitionOverlay'
import { useWeekStore } from '../../stores/weekStore'
import { useJournalStore } from '../../stores/journalStore'

describe('turn card', () => {
  beforeEach(() => {
    useWeekStore.setState({ transitionLabel: '', transitionWeek: null })
    useJournalStore.setState({ entries: [] })
    useJournalStore.getState().addEntry({
      sceneId: 's', choiceId: 'c', category: 'legislation', alignment: 'reformist',
      title: 'Signed the press bill', description: 'd', icon: '', flag: null, currentWeek: 5,
    })
  })

  it('shows the week and last week’s decisions, and outlives the engine transition', () => {
    render(<TransitionOverlay />)
    act(() => { useWeekStore.setState({ transitionLabel: 'week', transitionWeek: 6 }) })
    expect(screen.getByRole('dialog', { name: 'Week 6' })).toBeInTheDocument()
    expect(screen.getByText('Signed the press bill')).toBeInTheDocument()

    act(() => { useWeekStore.setState({ transitionLabel: '', transitionWeek: null }) })
    expect(screen.getByTestId('turn-card')).toBeInTheDocument()
  })

  it('is dismissed with Space', async () => {
    render(<TransitionOverlay />)
    act(() => { useWeekStore.setState({ transitionLabel: 'week', transitionWeek: 6 }) })
    fireEvent.keyDown(window, { key: ' ' })
    await act(async () => { await new Promise(r => setTimeout(r, 400)) })
    expect(screen.queryByTestId('turn-card')).toBeNull()
  })
})
