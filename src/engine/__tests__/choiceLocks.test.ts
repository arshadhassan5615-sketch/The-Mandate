import { describe, expect, it } from 'vitest'
import { choiceAvailability, displayChoices, lockReason, STAT_LABELS } from '../choiceLocks'
import { ENGINE_CONTINUE_ID } from '../NarrativeEngine'
import { INITIAL_STATE } from '../../stores/gameStore'
import type { Condition, SceneChoice, StatCondition } from '../../types/narrative'
import type { GameState, NationState, PersonalState } from '../../types/gameState'

function withNation(patch: Partial<NationState>): GameState {
  return { ...INITIAL_STATE, nation: { ...INITIAL_STATE.nation, ...patch } }
}

function withPersonal(patch: Partial<PersonalState>): GameState {
  return { ...INITIAL_STATE, personal: { ...INITIAL_STATE.personal, ...patch } }
}

function choiceWith(conditions: Condition[]): { conditions: Condition[] } {
  return { conditions }
}

const MILITARY_READINESS_STAT = 'nation.militaryReadiness'

// Content stats that stat-gated choices use; each must have a lock label.
const CONTENT_STATS: readonly string[] = [
  'personal.publicImage',
  'personal.personalWealth',
  'advisorTrust.theron',
  'nation.economyHealth',
  'nation.militaryReadiness',
  'factions.dravenni',
  'nation.pressFreedom',
  'personal.marriageHealth',
  'personal.tomasWellbeing',
  'nation.internationalStanding',
  'factions.ironCovenant',
  'factions.reformists',
  'personal.moralCompass',
  'factions.workersCoalition',
  'nation.publicOrder',
  'factions.halvekists',
  'nation.militaryTech',
]

describe('choiceAvailability', () => {
  it('is available when the choice has no conditions', () => {
    expect(choiceAvailability({}, INITIAL_STATE, [])).toEqual({ kind: 'available' })
    expect(choiceAvailability(choiceWith([]), INITIAL_STATE, [])).toEqual({ kind: 'available' })
  })

  it('is available when every condition passes', () => {
    const choice = choiceWith([{ stat: MILITARY_READINESS_STAT, operator: '>', value: 40 }])
    expect(choiceAvailability(choice, INITIAL_STATE, [])).toEqual({ kind: 'available' })
  })

  it('is hidden when a failing flag condition exists', () => {
    const choice = choiceWith([{ type: 'flag', flag: 'met_theron', value: true }])
    expect(choiceAvailability(choice, INITIAL_STATE, [])).toEqual({ kind: 'hidden' })
  })

  it('is hidden when a failing flags.* stat condition exists', () => {
    const choice = choiceWith([{ stat: 'flags.met_theron', operator: '==', value: true }])
    expect(choiceAvailability(choice, INITIAL_STATE, [])).toEqual({ kind: 'hidden' })
  })

  it('is hidden when a story gate fails even if a stat condition also fails', () => {
    const choice = choiceWith([
      { stat: MILITARY_READINESS_STAT, operator: '>', value: 90 },
      { type: 'flag', flag: 'met_theron', value: true },
    ])
    expect(choiceAvailability(choice, INITIAL_STATE, [])).toEqual({ kind: 'hidden' })
  })

  it('is available when a flag condition passes', () => {
    const choice = choiceWith([{ type: 'flag', flag: 'met_theron', value: true }])
    expect(choiceAvailability(choice, INITIAL_STATE, ['met_theron'])).toEqual({ kind: 'available' })
  })

  it('is locked with the reason of the first failing stat condition', () => {
    const choice = choiceWith([
      { stat: MILITARY_READINESS_STAT, operator: '>', value: 60 },
      { stat: 'nation.economyHealth', operator: '>', value: 50 },
    ])
    expect(choiceAvailability(choice, INITIAL_STATE, [])).toEqual({
      kind: 'locked',
      reason: 'Requires stronger military readiness',
    })
  })

  it('is locked with the "<=" direction reason', () => {
    const choice = choiceWith([{ stat: 'nation.economyHealth', operator: '<=', value: -30 }])
    expect(choiceAvailability(choice, INITIAL_STATE, [])).toEqual({
      kind: 'locked',
      reason: 'Requires a weaker economy',
    })
  })

  it('is locked with a faction reason', () => {
    const choice = choiceWith([{ stat: 'factions.ironCovenant', operator: '>=', value: 70 }])
    expect(choiceAvailability(choice, INITIAL_STATE, [])).toEqual({
      kind: 'locked',
      reason: 'Requires the support of the Iron Covenant',
    })
  })

  it('is hidden when the stat is unknown', () => {
    const choice = choiceWith([{ stat: 'nation.doesNotExist', operator: '>', value: 1 }])
    expect(choiceAvailability(choice, INITIAL_STATE, [])).toEqual({ kind: 'hidden' })
  })

  it('is hidden when a failing condition uses the == operator', () => {
    const choice = choiceWith([{ stat: MILITARY_READINESS_STAT, operator: '==', value: 10 }])
    expect(choiceAvailability(choice, INITIAL_STATE, [])).toEqual({ kind: 'hidden' })
  })

  it('reflects the state it is given', () => {
    const choice = choiceWith([{ stat: MILITARY_READINESS_STAT, operator: '>', value: 60 }])
    const stronger = withNation({ militaryReadiness: 75 })
    expect(choiceAvailability(choice, INITIAL_STATE, [])).toEqual({
      kind: 'locked',
      reason: 'Requires stronger military readiness',
    })
    expect(choiceAvailability(choice, stronger, [])).toEqual({ kind: 'available' })
  })

  it('does not mutate the state it is given', () => {
    const state = withPersonal({ publicImage: 40 })
    const snapshot = JSON.stringify(state)
    choiceAvailability(choiceWith([{ stat: 'personal.publicImage', operator: '>', value: 80 }]), state, [])
    expect(JSON.stringify(state)).toBe(snapshot)
  })
})

describe('lockReason', () => {
  it('uses the "more" phrase for ">" and ">="', () => {
    const condition: StatCondition = { stat: MILITARY_READINESS_STAT, operator: '>', value: 60 }
    expect(lockReason(condition)).toBe('Requires stronger military readiness')
    expect(lockReason({ ...condition, operator: '>=' })).toBe('Requires stronger military readiness')
  })

  it('uses the "less" phrase for "<" and "<="', () => {
    const condition: StatCondition = { stat: MILITARY_READINESS_STAT, operator: '<', value: 30 }
    expect(lockReason(condition)).toBe('Requires lower military readiness')
    expect(lockReason({ ...condition, operator: '<=' })).toBe('Requires lower military readiness')
  })

  it('names a faction by its display name', () => {
    expect(lockReason({ stat: 'factions.ironCovenant', operator: '>', value: 60 }))
      .toBe('Requires the support of the Iron Covenant')
  })

  it('names reformists as Civic Renewal without an article', () => {
    expect(lockReason({ stat: 'factions.reformists', operator: '>', value: 90 }))
      .toBe('Requires the support of Civic Renewal')
    expect(lockReason({ stat: 'factions.reformists', operator: '<', value: 10 }))
      .toBe('Requires less support from Civic Renewal')
  })

  it('returns null for an unknown stat', () => {
    expect(lockReason({ stat: 'nation.doesNotExist', operator: '>', value: 1 })).toBeNull()
  })

  it('returns null for == and != operators', () => {
    expect(lockReason({ stat: MILITARY_READINESS_STAT, operator: '==', value: 1 })).toBeNull()
    expect(lockReason({ stat: MILITARY_READINESS_STAT, operator: '!=', value: 1 })).toBeNull()
  })

  it('returns null for story flag stats', () => {
    expect(lockReason({ stat: 'flags.met_theron', operator: '>', value: 1 })).toBeNull()
  })

  it.each(CONTENT_STATS)('has a lock label for %s in both directions', stat => {
    expect(STAT_LABELS[stat]).toBeDefined()
    expect(lockReason({ stat, operator: '>', value: 0 })).toBeTypeOf('string')
    expect(lockReason({ stat, operator: '<', value: 0 })).toBeTypeOf('string')
  })
})

describe('displayChoices', () => {
  const OPEN: SceneChoice = { id: 'open', text: 'Open choice' }
  const LOCKED: SceneChoice = {
    id: 'locked',
    text: 'Stat-locked choice',
    conditions: [{ stat: MILITARY_READINESS_STAT, operator: '>', value: 60 }],
  }
  const HIDDEN: SceneChoice = {
    id: 'hidden',
    text: 'Story-gated choice',
    conditions: [{ type: 'flag', flag: 'met_theron', value: true }],
  }
  const OTHER_OPEN: SceneChoice = { id: 'other', text: 'Another open choice' }

  it('keeps scene order across available, locked and hidden choices', () => {
    const shown = displayChoices([OPEN, LOCKED, HIDDEN, OTHER_OPEN], INITIAL_STATE, [])
    expect(shown.map(d => d.choice.id)).toEqual(['open', 'locked', 'other'])
  })

  it('marks locked choices with their reason and available ones with null', () => {
    const shown = displayChoices([OPEN, LOCKED], INITIAL_STATE, [])
    expect(shown).toEqual([
      { choice: OPEN, lockedReason: null },
      { choice: LOCKED, lockedReason: 'Requires stronger military readiness' },
    ])
  })

  it('adds no Continue when at least one choice is available', () => {
    const shown = displayChoices([LOCKED, OPEN], INITIAL_STATE, [])
    expect(shown.map(d => d.choice.id)).not.toContain(ENGINE_CONTINUE_ID)
  })

  it('adds Continue after the locked choices when none is available', () => {
    const shown = displayChoices([LOCKED, HIDDEN], INITIAL_STATE, [])
    expect(shown).toEqual([
      { choice: LOCKED, lockedReason: 'Requires stronger military readiness' },
      { choice: { id: ENGINE_CONTINUE_ID, text: 'Continue…' }, lockedReason: null },
    ])
  })

  it('yields only Continue when every choice is hidden', () => {
    const shown = displayChoices([HIDDEN], INITIAL_STATE, [])
    expect(shown).toEqual([
      { choice: { id: ENGINE_CONTINUE_ID, text: 'Continue…' }, lockedReason: null },
    ])
  })

  it('yields only Continue when there are no choices', () => {
    expect(displayChoices([], INITIAL_STATE, []).map(d => d.choice.id)).toEqual([ENGINE_CONTINUE_ID])
  })

  it('unlocks a stat-locked choice when the state changes', () => {
    const stronger = withNation({ militaryReadiness: 75 })
    const shown = displayChoices([LOCKED], stronger, [])
    expect(shown).toEqual([{ choice: LOCKED, lockedReason: null }])
  })

  it('does not mutate the choices or the state it is given', () => {
    const choices: SceneChoice[] = [OPEN, LOCKED, HIDDEN]
    const state = withPersonal({ publicImage: 40 })
    const snapshot = JSON.stringify({ choices, state })
    displayChoices(choices, state, [])
    expect(JSON.stringify({ choices, state })).toBe(snapshot)
  })
})
