import type { BudgetAllocations, StateModifier } from '../types/gameState'

// Stat change per +10M VK of spending in each expenditure category.
// Negative perTenM means the stat goes DOWN when spending goes UP (e.g. BNI → -civilLiberties).
interface CategoryEffect {
  stat: string
  perTenM: number
}

const BUDGET_EFFECTS: Record<keyof Pick<BudgetAllocations,
  'military' | 'debtService' | 'govtAdmin' | 'infrastructure' |
  'education' | 'healthcare' | 'welfare' | 'bniSecurity'
>, CategoryEffect[]> = {
  military: [
    { stat: 'nation.militaryReadiness', perTenM:  5 },
    { stat: 'factions.ironCovenant',    perTenM:  8 },
  ],
  debtService: [
    { stat: 'nation.nationalDebt',           perTenM: -8 },
    { stat: 'nation.inflation',              perTenM: -2 },
    { stat: 'nation.internationalStanding',  perTenM:  3 },
  ],
  govtAdmin: [
    { stat: 'nation.corruption',  perTenM: -6 },
    { stat: 'nation.publicOrder', perTenM:  2 },
  ],
  infrastructure: [
    { stat: 'nation.economyHealth',   perTenM: 4 },
    { stat: 'factions.businessClass', perTenM: 3 },
  ],
  education: [
    { stat: 'nation.economyHealth',  perTenM: 2 },
    { stat: 'factions.reformists',   perTenM: 5 },
    { stat: 'personal.publicImage',  perTenM: 2 },
  ],
  healthcare: [
    { stat: 'nation.publicOrder',          perTenM: 4 },
    { stat: 'factions.workersCoalition',   perTenM: 5 },
  ],
  welfare: [
    { stat: 'factions.workersCoalition', perTenM:  6 },
    { stat: 'nation.publicOrder',        perTenM:  3 },
    { stat: 'nation.inflation',          perTenM:  1 },
  ],
  bniSecurity: [
    { stat: 'nation.civilLiberties', perTenM: -5 },
    { stat: 'nation.pressFreedom',   perTenM: -4 },
  ],
}

export function computeBudgetModifiers(
  prev: BudgetAllocations,
  next: BudgetAllocations,
): StateModifier[] {
  const mods: StateModifier[] = []

  for (const [category, effects] of Object.entries(BUDGET_EFFECTS)) {
    const key = category as keyof typeof BUDGET_EFFECTS
    const delta = next[key] - prev[key]
    if (delta === 0) continue

    for (const effect of effects) {
      const value = Math.round((delta / 10) * effect.perTenM)
      if (value !== 0) mods.push({ stat: effect.stat, operation: 'add', value })
    }
  }

  return mods
}

// Aggregate modifiers that affect the same stat into one net value.
export function aggregateModifiers(mods: StateModifier[]): Map<string, number> {
  const agg = new Map<string, number>()
  for (const mod of mods) {
    agg.set(mod.stat, (agg.get(mod.stat) ?? 0) + mod.value)
  }
  return agg
}
