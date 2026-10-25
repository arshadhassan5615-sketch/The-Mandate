import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import TransitionOverlay from '../TransitionOverlay'
import { useWeekStore } from '../../stores/weekStore'

describe('week transition (no turn card)', () => {
  beforeEach(() => {
    useWeekStore.setState({ transitionLabel: '', transitionWeek: null })
  })

  it('does not render a turn card or the continue prompt when a new week begins', () => {
    render(<TransitionOverlay />)
    act(() => { useWeekStore.setState({ transitionLabel: 'week', transitionWeek: 6 }) })
    expect(screen.queryByTestId('turn-card')).toBeNull()
    expect(screen.queryByText('click or press space to continue')).toBeNull()
  })
})
