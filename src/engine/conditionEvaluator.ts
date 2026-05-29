import type { Condition } from '../types/narrative'
import type { GameState } from '../types/gameState'

function resolveStatValue(
  path: string,
  state: GameState,
  flags: string[],
): number | string | boolean {
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

  console.warn(`[conditionEvaluator] Unknown stat path: "${path}"`)
  return 0
}

function compare(
  actual: number | string | boolean,
  op: Condition['operator'],
  expected: number | string | boolean,
): boolean {
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
}

export function evaluateCondition(
  cond: Condition,
  state: GameState,
  flags: string[],
): boolean {
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
