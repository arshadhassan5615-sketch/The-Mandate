import { beforeEach, describe, expect, it } from 'vitest'
import { resetWorld, bootWeek, poolIds } from '../../test/simHarness'
import { useGameStore } from '../gameStore'

// Real data: act3_nightmare_sequence declares weekAvailable 30 / weekDeadline 52.
// initWeek injects it at stressLevel >= 80 with its own window
// (currentWeek .. currentWeek + 1), so the scene window must still apply.
const NIGHTMARE_ID = 'act3_nightmare_sequence'

// Hard-coded recurring item: citizen_petitions_<week> fires every 4 weeks and
// must stay offered after its scene's own weekDeadline (recurring exemption).
const PETITIONS_LATE_ID = 'citizen_petitions_56'

// Real data: pipeline_constitution_drafting declares weekAvailable 14 / weekDeadline unset.
const PIPELINE_W14_ID = 'pipeline_constitution_drafting'

function setStress(stressLevel: number): void {
  useGameStore.setState(state => ({
    personal: { ...state.personal, stressLevel },
  }))
}

describe('initWeek injected items respect their scene window', () => {
  beforeEach(() => {
    resetWorld()
  })

  it('offers the nightmare sequence at week 35 when stress is 90', () => {
    // Arrange
    setStress(90)

    // Act
    bootWeek(35)

    // Assert
    expect(poolIds()).toContain(NIGHTMARE_ID)
  })

  it('does not offer the nightmare sequence at week 58, past its scene deadline', () => {
    // Arrange
    setStress(90)

    // Act
    bootWeek(58)

    // Assert
    expect(poolIds()).not.toContain(NIGHTMARE_ID)
  })

  it('still offers a recurring injected petitions item in a late week', () => {
    // Act
    bootWeek(56)

    // Assert
    expect(poolIds()).toContain(PETITIONS_LATE_ID)
  })

  it('still offers the week-14 pipeline item in week 14', () => {
    // Act
    bootWeek(14)

    // Assert
    expect(poolIds()).toContain(PIPELINE_W14_ID)
  })
})
