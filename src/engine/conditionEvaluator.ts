import type { Condition, StatCondition } from '../types/narrative'
import type { GameState } from '../types/gameState'

// Type-narrowing helpers for the Condition discriminated union.
function isFlagCondition(c: Condition): c is Extract<Condition, { type: 'flag' }> {
  return (c as { type?: string }).type === 'flag'
}

function resolveStatValue(
  path: string,
  state: GameState,
  flags: string[],
): number | string | boolean | undefined {
  if (path === 'currentWeek') return state.currentWeek
  if (path === 'currentAct')  return state.currentAct

  // flags.some_flag → boolean membership check
  if (path.startsWith('flags.')) {
    return flags.includes(path.slice(6))
  }

  // dot-notation into nation / factions / personal
  const dot = path.indexOf('.')
  if (dot !== -1) {
    const group = path.slice(0, dot) as keyof GameState
    const key   = path.slice(dot + 1)
    const sub   = state[group] as unknown as Record<string, unknown> | undefined
    if (sub && key in sub) return sub[key] as number
  }

  // Unknown path — return undefined so caller can detect the failure
  return undefined
}

function compare(
  actual: number | string | boolean | undefined,
  op: StatCondition['operator'],
  expected: number | string | boolean,
): boolean {
  // Unknown / unresolved stat path — condition fails
  if (actual === undefined) {
    if (import.meta.env.DEV) {
      console.error(`[conditionEvaluator] CRITICAL: Condition failed due to unknown stat path — operator: ${op}, expected: ${expected}`)
    }
    return false
  }

  switch (op) {
    case '>':  return (actual as number) >  (expected as number)
    case '<':  return (actual as number) <  (expected as number)
    case '>=': return (actual as number) >= (expected as number)
    case '<=': return (actual as number) <= (expected as number)
    // eslint-disable-next-line eqeqeq
    case '==': return actual == expected   // intentional loose — handles bool/string/number
    // eslint-disable-next-line eqeqeq
    case '!=': return actual != expected
  }
  return false
}

export function evaluateCondition(
  cond: Condition,
  state: GameState,
  flags: string[],
): boolean {
  if (isFlagCondition(cond)) {
    return flags.includes(cond.flag) === cond.value
  }
  const actual = resolveStatValue(cond.stat, state, flags)
  return compare(actual, cond.operator, cond.value)
}

export function evaluateAll(
  conditions: Condition[],
  state: GameState,
  flags: string[],
): boolean {
  return conditions.every(c => evaluateCondition(c, state, flags))
}
