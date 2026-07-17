import type { BudgetAllocations, StateModifier } from '../types/gameState'

// Stat change per +10M ₭ of spending in each expenditure category.
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

export interface BudgetModifierResult {
  modifiers: StateModifier[]
  flags?: string[]
}

export function computeBudgetModifiers(
  prev: BudgetAllocations,
  next: BudgetAllocations,
): BudgetModifierResult {
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

  // ── Budget balance consequences ──────────────────────────────────────────
  // Revenue = the four revenue streams; expenditure = the eight spend categories.
  // A deficit weakens the economy and grows debt; a surplus strengthens the
  // economy and pays debt down. Mirrors the per-10M scale used by category effects.
  const revenue = next.taxRevenue + next.stateIndustry + next.customsTariffs + next.foreignAid
  const expenditure = next.military + next.debtService + next.govtAdmin + next.infrastructure
    + next.education + next.healthcare + next.welfare + next.bniSecurity
  const balance = revenue - expenditure

  const flags: string[] = []

  if (balance < 0) {
    // economyHealth decreases 1 per 10M deficit; debt grows 1 per 10M deficit
    mods.push({ stat: 'nation.economyHealth', operation: 'add', value: Math.round(balance / 10) * -1 })
    mods.push({ stat: 'nation.nationalDebt', operation: 'add', value: Math.round(Math.abs(balance) / 10) })
    if (balance < -100) flags.push('severe_deficit_crisis')
  } else if (balance > 0) {
    // surplus strengthens economy (+0.5 / 10M) and reduces debt (-0.5 / 10M)
    mods.push({ stat: 'nation.economyHealth', operation: 'add', value: Math.round((balance / 10) * 0.5) })
    mods.push({ stat: 'nation.nationalDebt', operation: 'add', value: Math.round((balance / 10) * -0.5) })
  }

  return { modifiers: mods, flags: flags.length ? flags : undefined }
}

// Aggregate modifiers that affect the same stat into one net value.
export function aggregateModifiers(mods: StateModifier[]): Map<string, number> {
  const agg = new Map<string, number>()
  for (const mod of mods) {
    agg.set(mod.stat, (agg.get(mod.stat) ?? 0) + mod.value)
  }
  return agg
}
