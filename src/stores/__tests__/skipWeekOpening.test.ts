import { beforeEach, describe, expect, it } from 'vitest'
import { useWeekStore } from '../weekStore'
import { useGameStore } from '../gameStore'
import { useBillStore } from '../billStore'

describe('skipWeekOpening', () => {
  beforeEach(() => {
    useGameStore.getState().resetToInitial()
    useBillStore.setState({ bills: [], history: [] })
    useWeekStore.setState({ phase: 'briefing' })
  })

  it('goes straight to the map in week 1', () => {
    // Arrange
    useGameStore.setState({ currentWeek: 1 })

    // Act
    useWeekStore.getState().skipWeekOpening()

    // Assert
    expect(useWeekStore.getState().phase).toBe('map')
  })

  it('goes to the map in week 3 when no parliament sitting or bills are due, never passing through press', () => {
    // Arrange: lastParliamentWeek = currentWeek makes shouldTriggerParliament return false
    useGameStore.setState({ currentWeek: 3, lastParliamentWeek: 3, emergencyParliamentFlag: false })
    const phases: string[] = []
    const unsubscribe = useWeekStore.subscribe(state => { phases.push(state.phase) })

    // Act
    useWeekStore.getState().skipWeekOpening()
    unsubscribe()

    // Assert
    expect(useWeekStore.getState().phase).toBe('map')
    expect(phases).not.toContain('press')
  })
})
