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
  // ── H1 fix: legacy stat-path aliases ───────────────────────────────
  // Older scene JSONs reference flat or misnamed stats. Map them to the
  // canonical top-level / dotted paths so conditions and prerequisites
  // still resolve.
  const PATH_ALIASES: Record<string, string> = {
    'public_trust': 'factions.reformists',
    'reformist_credibility': 'factions.reformists',
    'budget': 'nation.nationalDebt',
    'business_confidence': 'factions.businessClass',
    'economy': 'nation.economyHealth',
    'assembly_support': 'factions.reformists',
    'labor_approval': 'factions.workersCoalition',
    'security_rating': 'factions.ironCovenant',
    'church_relations': 'factions.church',
    'military_confidence': 'factions.ironCovenant',
    'civil_liberties': 'nation.civilLiberties',
    'law_order': 'nation.lawOrder',
    'assembly_conservative': 'nation.assemblyConservative',
    'assembly_hardliner': 'nation.assemblyHardliner',
    'assembly_reformist': 'nation.assemblyReformist',
    'international_standing': 'nation.internationalStanding',
    'tyvaren_tension': 'tyvarenHostility',
    'personal.wealth': 'personal.personalWealth',
    'personal.stressLevel': 'personal.stressLevel',
    'personal.shadowInfluence': 'shadowInfluence',
    'moralCompass': 'personal.moralCompass',
    'nationalDebt': 'nation.nationalDebt',
    'factions.party_loyalists': 'factions.partyLoyalists',
    'convention_stability': 'nation.conventionStability',
    'education_standard': 'nation.educationStandard',
    'regional_support': 'nation.regionalSupport',
  }
  const stat = PATH_ALIASES[path] ?? path

  if (stat === 'currentWeek') return state.currentWeek
  if (stat === 'currentAct')  return state.currentAct

  // flags.some_flag → boolean membership check
  if (stat.startsWith('flags.')) {
    return flags.includes(stat.slice(6))
  }

  // dot-notation into nation / factions / personal
  const dot = stat.indexOf('.')
  if (dot !== -1) {
    const group = stat.slice(0, dot) as keyof GameState
    const key   = stat.slice(dot + 1)
    const sub   = state[group] as unknown as Record<string, unknown> | undefined
    if (sub && key in sub) return sub[key] as number
  } else {
    // Dotless path — check the top-level gameState directly so that
    // flat stats like vaelInfluence, shadowInfluence, tyvarenHostility,
    // vossRelation, morvecInfluence, sovarka_relation resolve correctly.
    if (stat in state) {
      const value = (state as unknown as Record<string, unknown>)[stat]
      if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') {
        return value
      }
    }
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
