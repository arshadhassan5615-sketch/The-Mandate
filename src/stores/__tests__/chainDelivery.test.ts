import { beforeEach, describe, expect, it } from 'vitest'
import { resetWorld } from '../../test/simHarness'
import { useChainStore } from '../chainStore'
import { resolveChains, type ScheduledChain } from '../../engine/ChainReactionEngine'
import { getScene } from '../../engine/NarrativeEngine'
import type { GameState } from '../../types/gameState'

// Diagnosis of the 12 SUSPECT dropped chains in branch-playthroughs-report.md.
// Each suspect has fireWeek = dropWeek + 1 and a target whose weekDeadline equals
// dropWeek. resolveChains evaluates the window at the fire week (the week passed to
// process), so the target is already expired there. These tests pin that rule with
// real scene data, so a chain whose window has closed is never delivered late.

const NO_STATE = {} as GameState
const SOURCE_ID = 'test_source_choice'

function chainTo(targetNodeId: string, fireWeek: number): ScheduledChain {
  return {
    id: `test_chain_${targetNodeId}_${fireWeek}`,
    targetNodeId,
    fireWeek,
    sourceId: SOURCE_ID,
  }
}

describe('chain delivery: window is evaluated at the fire week', () => {
  beforeEach(() => {
    resetWorld()
    useChainStore.setState({ scheduled: [] })
  })

  it('delivers a chain that fires at week 6, inside the family_bni_night window (5-6)', () => {
    // Arrange: family_bni_night is weekAvailable 5 / weekDeadline 6. Chains from
    // act1_week5_bni_crisis use delayWeeks 1, so they fire at week 6, the last open week.
    const scene = getScene('family_bni_night')
    expect(scene?.weekDeadline).toBe(6)

    // Act: the week-end tick into week 6 evaluates the chain with week 6.
    const result = resolveChains([chainTo('family_bni_night', 6)], 6, NO_STATE, [])

    // Assert: delivered at week 6, not re-queued.
    expect(result.fired).toEqual(['family_bni_night'])
    expect(result.remaining).toEqual([])
  })

  it('drops a chain whose fire week is one past the target weekDeadline (family_bni_night)', () => {
    // Arrange: family_bni_night weekDeadline is 6, so a fire at week 7 is expired.
    const scene = getScene('family_bni_night')
    expect(scene?.weekDeadline).toBe(6)

    // Act: the week-end tick into week 7 evaluates the chain with week 7.
    const result = resolveChains([chainTo('family_bni_night', 7)], 7, NO_STATE, [])

    // Assert: expired at fire time, not fired, not re-queued.
    expect(result.fired).toEqual([])
    expect(result.remaining).toEqual([])
  })

  it.each([
    ['act3_week31_inner_circle', 34, 33],
    ['act3_week32_tyvaren_ultimatum', 35, 34],
    ['act4_week41_reform_implementation', 44, 43],
    ['act3_week39_act3_climax', 41, 40],
  ])('drops %s when fired at week %i, one past its deadline %i', (targetId, fireWeek, deadline) => {
    expect(getScene(targetId)?.weekDeadline).toBe(deadline)

    const result = resolveChains([chainTo(targetId, fireWeek)], fireWeek, NO_STATE, [])

    expect(result.fired).toEqual([])
    expect(result.remaining).toEqual([])
  })

  it('fires the same chain at the deadline week itself (control)', () => {
    const result = resolveChains([chainTo('family_bni_night', 5)], 5, NO_STATE, [])

    expect(result.fired).toEqual(['family_bni_night'])
    expect(result.remaining).toEqual([])
  })

  it('keeps a chain scheduled while its target window has not opened yet', () => {
    // act3_week31_inner_circle opens at week 31; a fire at week 30 must wait, not drop.
    const result = resolveChains([chainTo('act3_week31_inner_circle', 30)], 30, NO_STATE, [])

    expect(result.fired).toEqual([])
    expect(result.remaining.map(c => c.targetNodeId)).toEqual(['act3_week31_inner_circle'])
  })
})
