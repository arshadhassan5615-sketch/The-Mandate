import type {
  AssemblyBloc,
  ParliamentBill,
  ParliamentBillResult,
  Stance,
} from '../types/parliament'

const WEAK_BLOC_THRESHOLD = 25 // below this, a bloc can't mount
// real support or opposition — baseline stance softens to neutral

const STRONG_MAJORITY_MARGIN = 30 // points of for-vs-against
// weight difference needed to skip the veto option entirely

export function computeBlocStance(
  baseline: Stance,
  blocStrength: number,
): Stance {
  if (blocStrength < WEAK_BLOC_THRESHOLD && baseline !== 'neutral') {
    return 'neutral'
  }
  return baseline
}

export function resolveParliamentBill(
  bill: ParliamentBill,
  blocStrengths: Record<AssemblyBloc, number>,
): ParliamentBillResult {
  const blocs: AssemblyBloc[] = ['conservative', 'hardliner', 'reformist']
  const computedStances = {} as Record<AssemblyBloc, Stance>
  let forWeight = 0
  let againstWeight = 0

  for (const bloc of blocs) {
    const stance = computeBlocStance(bill.baselineStances[bloc], blocStrengths[bloc])
    computedStances[bloc] = stance
    if (stance === 'for') forWeight += blocStrengths[bloc]
    if (stance === 'against') againstWeight += blocStrengths[bloc]
  }

  const passed = forWeight > againstWeight
  const margin = forWeight - againstWeight
  const isStrongMajority = passed && margin >= STRONG_MAJORITY_MARGIN

  return {
    bill,
    computedStances,
    forWeight,
    againstWeight,
    passed,
    isStrongMajority,
    marginPercent: margin,
  }
}

// Reused later (Sub-phase F) for veto-override odds — narrow
// margins should make override unlikely, mirroring how a slim
// majority can't realistically reach supermajority-override.
export function computeOverrideChance(marginPercent: number): number {
  // Clamp to a sane probability range; narrow margins → low chance
  return Math.max(0, Math.min(0.4, marginPercent / 200))
}
