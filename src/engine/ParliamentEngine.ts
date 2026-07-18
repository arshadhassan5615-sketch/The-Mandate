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

const MIN_WEEKS_BETWEEN_SITTINGS = 3
const MAX_WEEKS_BETWEEN_SITTINGS = 6

/**
 * Whether a parliament sitting should fire this week.
 * Pure decision logic — phase wiring happens in Sub-phase F once UI exists.
 */
export function shouldTriggerParliament(
  currentWeek: number,
  lastParliamentWeek: number,
  emergencyFlag: boolean,
): boolean {
  if (emergencyFlag) return true
  const weeksSince = currentWeek - lastParliamentWeek
  if (weeksSince < MIN_WEEKS_BETWEEN_SITTINGS) return false
  if (weeksSince >= MAX_WEEKS_BETWEEN_SITTINGS) return true
  // Loose window: roughly 4 weeks, with drift — random within the
  // eligible range rather than a hard trigger the instant it's
  // possible, so timing doesn't feel mechanically predictable
  const chance = (weeksSince - MIN_WEEKS_BETWEEN_SITTINGS) /
    (MAX_WEEKS_BETWEEN_SITTINGS - MIN_WEEKS_BETWEEN_SITTINGS)
  return Math.random() < chance
}

const MAX_BILLS_PER_SITTING = 3

let parliamentBillCache: ParliamentBill[] | null = null

/**
 * Load authored parliament bills via Vite glob.
 * Zero matches → empty object → empty array (no throw). Directory may be empty until content is authored.
 */
export async function loadAllParliamentBills(): Promise<ParliamentBill[]> {
  if (parliamentBillCache) return parliamentBillCache

  const billModules = import.meta.glob('../data/parliament/*.json', { eager: true }) as Record<
    string,
    { default: ParliamentBill }
  >
  parliamentBillCache = Object.values(billModules).map(m => m.default)
  parliamentBillCache.sort((a, b) => a.weekAvailable - b.weekAvailable || a.id.localeCompare(b.id))
  return parliamentBillCache
}

export function getParliamentBillsSync(): ParliamentBill[] {
  return parliamentBillCache ?? []
}

export function selectEligibleBills(
  allBills: ParliamentBill[],
  currentWeek: number,
  decidedBillIds: Set<string>,
): ParliamentBill[] {
  return allBills.filter(bill => {
    if (decidedBillIds.has(bill.id)) return false
    if (bill.weekAvailable > currentWeek) return false
    if (bill.weekDeadline !== undefined && currentWeek > bill.weekDeadline) return false
    return true
  })
}

export function selectBillsForSitting(
  eligibleBills: ParliamentBill[],
): ParliamentBill[] {
  // Deterministic, not random — oldest available content first,
  // capped at MAX_BILLS_PER_SITTING. Avoids "stacking random
  // bills" while still surfacing everything eligible over time.
  return [...eligibleBills]
    .sort((a, b) => a.weekAvailable - b.weekAvailable || a.id.localeCompare(b.id))
    .slice(0, MAX_BILLS_PER_SITTING)
}
