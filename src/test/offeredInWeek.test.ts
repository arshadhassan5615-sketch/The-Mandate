// Offered-in-week proof (default suite).
//
// Fixed scene/week pairs taken from the timing audit. Each "offered" case must
// appear in the map pool at its week from a fresh world (plus the listed flags
// or stat). Each "not offered" case must be absent at its week under the stated
// condition. The nightmare control confirms the stat setup really opens that
// scene, so its "not offered" result is not vacuous.
import { describe, it, expect } from 'vitest'

import { useGameStore } from '../stores/gameStore'
import { resetWorld, bootWeek, pool, isDone } from './simHarness'

interface OfferedCase {
  sceneId: string
  week: number
  flags?: string[]
  stressLevel?: number
}

const OFFERED: OfferedCase[] = [
  { sceneId: 'act1_week3_armadine_investment', week: 3 },
  { sceneId: 'act1_week4_elena_introduction', week: 4 },
  { sceneId: 'act1_vael_party_funding', week: 4 },
  { sceneId: 'act1_week10_law_enforcement_choice', week: 10 },
  { sceneId: 'social_autumn_festival_wk18', week: 18 },
  { sceneId: 'social_state_dinner_wk24', week: 24 },
  { sceneId: 'act2_week29_sovarka_approach', week: 29 },
  { sceneId: 'social_independence_parade_wk36', week: 36 },
  { sceneId: 'act3_arcturian_cooldown', week: 27 },
  { sceneId: 'act3_superpower_pressure', week: 33 },
  { sceneId: 'act1_week12_nadia_voss', week: 12 },
  { sceneId: 'act2_week14_elena_favor', week: 14, flags: ['elena_introduced'] },
  // Control: the nightmare scene is open at week 30 with stress 90, so the
  // "not offered" case at week 58 is checked against a state that does offer it.
  { sceneId: 'act3_nightmare_sequence', week: 30, stressLevel: 90 },
]

const NOT_OFFERED: OfferedCase[] = [
  { sceneId: 'act1_week12_nadia_voss', week: 11 },
  { sceneId: 'act2_week14_elena_favor', week: 14 },
  { sceneId: 'act3_nightmare_sequence', week: 58, stressLevel: 90 },
]

/** Fresh world with the case's stat (if any) set before initWeek runs. */
function bootCase(c: OfferedCase): void {
  resetWorld()
  if (c.stressLevel !== undefined) {
    useGameStore.getState().applyModifiers([
      { stat: 'personal.stressLevel', operation: 'set', value: c.stressLevel },
    ])
  }
  bootWeek(c.week, { flags: c.flags })
}

describe('scenes are offered in their week from a fresh world', () => {
  it.each(OFFERED)('offers $sceneId in week $week', c => {
    bootCase(c)
    const item = pool().find(i => i.sceneId === c.sceneId)
    expect(item, `${c.sceneId} is not in the pool at week ${c.week}`).toBeDefined()
    expect(item ? isDone(item) : 'missing', `${c.sceneId} is in the pool but already done`).toBe(false)
  })
})

describe('scenes are not offered outside their conditions', () => {
  it.each(NOT_OFFERED)('does not offer $sceneId at week $week', c => {
    bootCase(c)
    const item = pool().find(i => i.sceneId === c.sceneId)
    expect(
      item,
      `${c.sceneId} should not be offered at week ${c.week}${c.stressLevel !== undefined ? ` (stress ${c.stressLevel})` : ''}`,
    ).toBeUndefined()
  })
})
