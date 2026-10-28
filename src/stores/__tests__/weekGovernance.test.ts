import { beforeEach, describe, expect, it } from 'vitest'
import type { Commitment, ResolutionRule } from '../../engine/commitments'
import { resetWorld } from '../../test/simHarness'
import { useCommitmentStore } from '../commitmentStore'
import { useGameStore } from '../gameStore'
import { useNarrativeStore } from '../narrativeStore'
import { applyGovernorsWeek, settleWeekCommitments } from '../weekGovernance'

const commitment: Commitment = {
  id: 'scene_x:promise',
  sceneId: 'scene_x',
  sceneTitle: 'X',
  choiceId: 'promise',
  week: 3,
  quote: 'I promise.',
  witnesses: [],
  flags: ['test_promise'],
}

const rule: ResolutionRule = {
  madeBy: 'test_promise',
  keptBy: ['test_kept'],
  deadlineWeeks: 2,
  consequences: [{ stat: 'factions.workersCoalition', operation: 'add', value: -10 }],
}

beforeEach(() => {
  resetWorld()
  useCommitmentStore.getState().reset()
})

describe('settleWeekCommitments', () => {
  it('breaks a promise past its deadline once', () => {
    useCommitmentStore.getState().record(commitment)
    const before = useGameStore.getState().factions.workersCoalition

    settleWeekCommitments(5, [rule])
    expect(useGameStore.getState().factions.workersCoalition).toBe(before)
    expect(useNarrativeStore.getState().activeFlags).not.toContain('promise_broken_test_promise')

    settleWeekCommitments(6, [rule])
    expect(useGameStore.getState().factions.workersCoalition).toBe(before - 10)
    expect(useNarrativeStore.getState().activeFlags).toContain('promise_broken_test_promise')
    expect(useCommitmentStore.getState().settledIds).toContain('scene_x:promise')

    settleWeekCommitments(7, [rule])
    expect(useGameStore.getState().factions.workersCoalition).toBe(before - 10)
  })

  it('applies nothing to a promise that was kept', () => {
    useCommitmentStore.getState().record(commitment)
    useNarrativeStore.getState().addFlags(['test_kept'])
    const before = useGameStore.getState().factions.workersCoalition

    settleWeekCommitments(6, [rule])
    expect(useGameStore.getState().factions.workersCoalition).toBe(before)
    expect(useCommitmentStore.getState().settledIds).toEqual([])
  })
})

describe('applyGovernorsWeek', () => {
  it('holds provincial elections once', () => {
    useNarrativeStore.getState().addFlags(['self_government_act_signed'])

    applyGovernorsWeek()
    expect(useNarrativeStore.getState().activeFlags).toContain('provincial_elections_held')
    const countAfterFirst = useNarrativeStore.getState().activeFlags
      .filter(f => f.startsWith('governor_') && f.includes('_elected_')).length
    expect(countAfterFirst).toBe(6)

    applyGovernorsWeek()
    const countAfterSecond = useNarrativeStore.getState().activeFlags
      .filter(f => f.startsWith('governor_') && f.includes('_elected_')).length
    expect(countAfterSecond).toBe(6)
  })
})

describe('commitmentStore settledIds', () => {
  it('markSettled dedupes and reset clears', () => {
    useCommitmentStore.getState().markSettled(['a', 'a', 'b'])
    useCommitmentStore.getState().markSettled(['b'])
    expect(useCommitmentStore.getState().settledIds).toEqual(['a', 'b'])

    useCommitmentStore.getState().reset()
    expect(useCommitmentStore.getState().settledIds).toEqual([])
  })
})
