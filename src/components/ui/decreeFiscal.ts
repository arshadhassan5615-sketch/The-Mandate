import type { Decree } from '../../types/decree'

const DEBT_STAT = 'nation.nationalDebt'

/**
 * A decree's net effect on the national debt, in the bill `budgetCost`
 * convention FiscalNote expects: negative = spending (adds debt),
 * positive = revenue (reduces debt). Delayed effects are included because
 * the player commits to them by signing.
 */
export function decreeBudgetCost(decree: Pick<Decree, 'immediateEffects' | 'longTermEffects'>): number {
  const debtAdded = [...decree.immediateEffects, ...decree.longTermEffects]
    .filter(e => e.stat === DEBT_STAT && (e.operation ?? 'add') === 'add')
    .reduce((sum, e) => sum + e.value, 0)
  return 0 - debtAdded // not -debtAdded, which gives -0 for a decree with no cost
}
