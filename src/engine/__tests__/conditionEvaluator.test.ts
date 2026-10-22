// Tests for the condition evaluator — the engine gate every scene prerequisite
// and every chain trigger runs through. A bug here cascades into hundreds of
// broken scenes, so this module gets the deepest coverage in the first slice.

import { describe, it, expect, vi } from 'vitest'

import { evaluateCondition, evaluateAll } from '../conditionEvaluator'
import { buildGameState } from '../../test/factories/gameStateFactory'
import type { Condition } from '../../types/narrative'

describe('conditionEvaluator.evaluateCondition — stat conditions', () => {
  const state = buildGameState({
    nation: { ...buildGameState().nation, pressFreedom: 30, publicOrder: 80 },
  })

  it('evaluates a `>` comparison against a numeric nation stat', () => {
    const cond: Condition = { stat: 'nation.publicOrder', operator: '>', value: 50 }
    expect(evaluateCondition(cond, state, [])).toBe(true)
  })

  it('evaluates a `<` comparison that fails', () => {
    const cond: Condition = { stat: 'nation.pressFreedom', operator: '<', value: 20 }
    expect(evaluateCondition(cond, state, [])).toBe(false)
  })

  it('evaluates a `>=` boundary inclusively', () => {
    const cond: Condition = { stat: 'nation.pressFreedom', operator: '>=', value: 30 }
    expect(evaluateCondition(cond, state, [])).toBe(true)
  })

  it('evaluates a `<=` boundary inclusively', () => {
    const cond: Condition = { stat: 'nation.publicOrder', operator: '<=', value: 80 }
    expect(evaluateCondition(cond, state, [])).toBe(true)
  })

  it('evaluates a `==` comparison (handles number/string with loose equality)', () => {
    const cond: Condition = { stat: 'currentWeek', operator: '==', value: 1 }
    expect(evaluateCondition(cond, state, [])).toBe(true)
  })

  it('evaluates a `!=` comparison', () => {
    const cond: Condition = { stat: 'currentAct', operator: '!=', value: 4 }
    expect(evaluateCondition(cond, state, [])).toBe(true)
  })

  it('resolves top-level GameState fields like currentWeek and currentAct', () => {
    const cond: Condition = { stat: 'currentAct', operator: '==', value: 1 }
    expect(evaluateCondition(cond, state, [])).toBe(true)
  })

  it('returns false and logs in DEV for an unknown stat path', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const cond: Condition = { stat: 'nation.doesNotExist', operator: '>', value: 0 }

    // The unknown-path branch only emits a console.error in dev mode.
    // In any environment, the result is the safe default: false.
    const previousDev = (import.meta.env as { DEV?: boolean }).DEV
    ;(import.meta.env as { DEV?: boolean }).DEV = true
    try {
      expect(evaluateCondition(cond, state, [])).toBe(false)
      expect(errorSpy).toHaveBeenCalled()
    } finally {
      ;(import.meta.env as { DEV?: boolean }).DEV = previousDev
      errorSpy.mockRestore()
    }
  })
})

describe('conditionEvaluator.evaluateCondition — flag conditions', () => {
  it('passes when the flag is present and required=true', () => {
    const cond: Condition = { type: 'flag', flag: 'bni_dissolved', value: true }
    expect(evaluateCondition(cond, buildGameState(), ['bni_dissolved'])).toBe(true)
  })

  it('fails when the flag is absent and required=true', () => {
    const cond: Condition = { type: 'flag', flag: 'bni_dissolved', value: true }
    expect(evaluateCondition(cond, buildGameState(), [])).toBe(false)
  })

  it('passes when the flag is absent and required=false', () => {
    const cond: Condition = { type: 'flag', flag: 'bni_dissolved', value: false }
    expect(evaluateCondition(cond, buildGameState(), [])).toBe(true)
  })

  it('resolves `flags.X` style stat paths to a boolean membership check', () => {
    const cond: Condition = { stat: 'flags.met_jonas', operator: '==', value: true }
    expect(evaluateCondition(cond, buildGameState(), ['met_jonas'])).toBe(true)
    expect(evaluateCondition(cond, buildGameState(), [])).toBe(false)
  })
})

describe('conditionEvaluator.evaluateAll', () => {
  it('returns true when every condition in the array passes', () => {
    const state = buildGameState({
      nation: { ...buildGameState().nation, pressFreedom: 60 },
    })
    const conds: Condition[] = [
      { stat: 'nation.pressFreedom', operator: '>=', value: 50 },
      { type: 'flag', flag: 'constitution_in_force', value: true },
    ]
    expect(evaluateAll(conds, state, ['constitution_in_force'])).toBe(true)
  })

  it('returns false as soon as one condition fails', () => {
    const state = buildGameState()
    const conds: Condition[] = [
      { stat: 'currentWeek', operator: '>', value: 0 },     // passes
      { stat: 'nation.economyHealth', operator: '>', value: 0 },  // fails (-18)
    ]
    expect(evaluateAll(conds, state, [])).toBe(false)
  })

  it('treats an empty condition array as true (vacuously satisfied)', () => {
    expect(evaluateAll([], buildGameState(), [])).toBe(true)
  })
})

describe('conditionEvaluator.evaluateCondition — modifier-parity stat aliases', () => {
  it('resolves the education_index alias to nation.educationStandard', () => {
    const base = buildGameState()
    const state = buildGameState({ nation: { ...base.nation, educationStandard: 42 } })
    const cond: Condition = { stat: 'education_index', operator: '==', value: 42 }
    expect(evaluateCondition(cond, state, [])).toBe(true)
  })

  it('resolves the military_readiness alias to nation.militaryReadiness', () => {
    const base = buildGameState()
    const state = buildGameState({ nation: { ...base.nation, militaryReadiness: 42 } })
    const cond: Condition = { stat: 'military_readiness', operator: '==', value: 42 }
    expect(evaluateCondition(cond, state, [])).toBe(true)
  })

  it('resolves the oligarch_relations alias to factions.businessClass', () => {
    const base = buildGameState()
    const state = buildGameState({ factions: { ...base.factions, businessClass: 42 } })
    const cond: Condition = { stat: 'oligarch_relations', operator: '==', value: 42 }
    expect(evaluateCondition(cond, state, [])).toBe(true)
  })

  it('resolves the public_order alias to nation.publicOrder', () => {
    const base = buildGameState()
    const state = buildGameState({ nation: { ...base.nation, publicOrder: 42 } })
    const cond: Condition = { stat: 'public_order', operator: '==', value: 42 }
    expect(evaluateCondition(cond, state, [])).toBe(true)
  })

  it('resolves the reformist_support alias to factions.reformists', () => {
    const base = buildGameState()
    const state = buildGameState({ factions: { ...base.factions, reformists: 42 } })
    const cond: Condition = { stat: 'reformist_support', operator: '==', value: 42 }
    expect(evaluateCondition(cond, state, [])).toBe(true)
  })
})
