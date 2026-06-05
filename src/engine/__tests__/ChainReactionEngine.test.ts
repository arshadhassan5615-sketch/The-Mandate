// Tests for the chain reaction engine — the spine of the political narrative
// arc. Every choice with delayed consequences routes through buildScheduled
// (when the choice is picked) and resolveChains (every week advance).
//
// What we lock down here:
//   1. buildScheduled: delay math (currentWeek + delayWeeks), unique IDs
//   2. resolveChains: fire on fireWeek <= week, condition-fail at fire time,
//      probability-roll-fail, chains with fireWeek > week stay in queue.

import { describe, it, expect, vi } from 'vitest'

import { buildScheduled, resolveChains } from '../ChainReactionEngine'
import { buildGameState } from '../../test/factories/gameStateFactory'
import type { ChainTrigger } from '../../types/narrative'

describe('ChainReactionEngine.buildScheduled', () => {
  it('computes fireWeek as currentWeek + delayWeeks for each trigger', () => {
    const triggers: ChainTrigger[] = [
      { targetNodeId: 'scene_a', delayWeeks: 2 },
      { targetNodeId: 'scene_b', delayWeeks: 5 },
      { targetNodeId: 'scene_c', delayWeeks: 0 },
    ]
    const scheduled = buildScheduled(triggers, /* currentWeek */ 10, 'choice_x', 'parent_scene')

    expect(scheduled).toHaveLength(3)
    expect(scheduled[0]).toMatchObject({ targetNodeId: 'scene_a', fireWeek: 12 })
    expect(scheduled[1]).toMatchObject({ targetNodeId: 'scene_b', fireWeek: 15 })
    expect(scheduled[2]).toMatchObject({ targetNodeId: 'scene_c', fireWeek: 10 })
  })

  it('produces unique IDs across multiple buildScheduled calls', () => {
    const trigger: ChainTrigger = { targetNodeId: 'scene_x', delayWeeks: 1 }
    const a = buildScheduled([trigger], 1, 'choice_a')
    const b = buildScheduled([trigger], 2, 'choice_b')

    const idsA = a.map(s => s.id)
    const idsB = b.map(s => s.id)
    expect(idsA[0]).not.toBe(idsB[0])
  })

  it('preserves conditions and probability from the trigger', () => {
    const triggers: ChainTrigger[] = [
      { targetNodeId: 'scene_q', delayWeeks: 3, probability: 0.5, conditions: [] },
    ]
    const [scheduled] = buildScheduled(triggers, 1, 'c', 's')
    expect(scheduled.probability).toBe(0.5)
    expect(scheduled.conditions).toEqual([])
  })
})

describe('ChainReactionEngine.resolveChains', () => {
  it('fires chains whose fireWeek is <= the current week', () => {
    const scheduled = buildScheduled(
      [{ targetNodeId: 'ready', delayWeeks: 0 }],
      1,
      'c1',
    )
    const { fired, remaining, firedChains } = resolveChains(scheduled, 1, buildGameState(), [])
    expect(fired).toEqual(['ready'])
    expect(remaining).toEqual([])
    expect(firedChains).toHaveLength(1)
  })

  it('keeps chains whose fireWeek is still in the future in the queue', () => {
    const scheduled = buildScheduled(
      [{ targetNodeId: 'not_yet', delayWeeks: 5 }],
      1,
      'c1',
    )
    const { fired, remaining } = resolveChains(scheduled, 3, buildGameState(), [])
    expect(fired).toEqual([])
    expect(remaining).toHaveLength(1)
    expect(remaining[0].targetNodeId).toBe('not_yet')
  })

  it('drops chains whose conditions fail at fire time (political moment passed)', () => {
    const scheduled = buildScheduled(
      [
        {
          targetNodeId: 'gated',
          delayWeeks: 0,
          conditions: [{ stat: 'nation.economyHealth', operator: '>', value: 0 }],
        },
      ],
      1,
      'c1',
    )
    // Week-1 economy is -18, so the >0 condition fails
    const { fired, remaining, firedChains } = resolveChains(scheduled, 1, buildGameState(), [])
    expect(fired).toEqual([])
    expect(remaining).toEqual([])
    expect(firedChains).toEqual([])
  })

  it('fires chains whose conditions pass at fire time', () => {
    const scheduled = buildScheduled(
      [
        {
          targetNodeId: 'gated_ok',
          delayWeeks: 0,
          conditions: [{ stat: 'nation.economyHealth', operator: '<', value: 0 }],
        },
      ],
      1,
      'c1',
    )
    const { fired } = resolveChains(scheduled, 1, buildGameState(), [])
    expect(fired).toEqual(['gated_ok'])
  })

  it('drops chains when the probability roll fails (stubbed Math.random)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99) // roll > probability 0.3
    try {
      const scheduled = buildScheduled(
        [{ targetNodeId: 'lucky', delayWeeks: 0, probability: 0.3 }],
        1, 'c1',
      )
      const { fired, firedChains } = resolveChains(scheduled, 1, buildGameState(), [])
      expect(fired).toEqual([])
      expect(firedChains).toEqual([])
    } finally {
      vi.restoreAllMocks()
    }
  })

  it('fires chains when the probability roll succeeds (stubbed Math.random)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1) // roll < probability 0.3
    try {
      const scheduled = buildScheduled(
        [{ targetNodeId: 'lucky', delayWeeks: 0, probability: 0.3 }],
        1, 'c1',
      )
      const { fired } = resolveChains(scheduled, 1, buildGameState(), [])
      expect(fired).toEqual(['lucky'])
    } finally {
      vi.restoreAllMocks()
    }
  })

  it('handles a mixed queue: future, fire, condition-fail, probability-fail all at once', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99) // make the probability fail
    try {
      const triggers: ChainTrigger[] = [
        { targetNodeId: 'future',     delayWeeks: 10 },                                  // future
        { targetNodeId: 'fires',      delayWeeks: 0 },                                   // fires
        { targetNodeId: 'cond_fail',  delayWeeks: 0, conditions: [
          { stat: 'nation.economyHealth', operator: '>', value: 0 },                    // fails (-18 < 0)
        ]},
        { targetNodeId: 'roll_fail',  delayWeeks: 0, probability: 0.3 },                // rolls 0.99 vs 0.3 → fail
      ]
      const scheduled = buildScheduled(triggers, 1, 'c1')
      const { fired, remaining } = resolveChains(scheduled, 1, buildGameState(), [])

      expect(fired).toEqual(['fires'])
      expect(remaining.map(s => s.targetNodeId)).toEqual(['future'])
    } finally {
      vi.restoreAllMocks()
    }
  })
})
