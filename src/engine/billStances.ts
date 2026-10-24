import type { Bill } from '../types/bills'
import type { FactionState } from '../types/gameState'
import { FACTION_NAMES, isFactionKey } from '../data/factions/factionNames'

export interface FactionStance { key: keyof FactionState; name: string; strength: 'firm' | 'leaning' }
export interface BillStances { supporters: FactionStance[]; opponents: FactionStance[] }

/** A change of at least this size is a firm stance; anything smaller but non-zero is leaning. */
export const FIRM_STANCE = 10

const FACTION_PREFIX = 'factions.'

function sumFactionAdds(signEffects: Bill['signEffects']): Map<keyof FactionState, number> {
  const totals = new Map<keyof FactionState, number>()
  for (const effect of signEffects) {
    if (effect.operation !== 'add' || !effect.stat.startsWith(FACTION_PREFIX)) continue
    const key = effect.stat.slice(FACTION_PREFIX.length)
    if (!isFactionKey(key)) continue
    totals.set(key, (totals.get(key) ?? 0) + effect.value)
  }
  return totals
}

function compareNames(a: string, b: string): number {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

/** Derives which factions back or oppose a bill from its sign effects. No numbers are exposed beyond strength. */
export function billStances(bill: Pick<Bill, 'signEffects'>): BillStances {
  const entries = [...sumFactionAdds(bill.signEffects).entries()]
    .filter(([, total]) => total !== 0)
    .sort(([keyA, totalA], [keyB, totalB]) =>
      Math.abs(totalB) - Math.abs(totalA) || compareNames(FACTION_NAMES[keyA].name, FACTION_NAMES[keyB].name),
    )

  const supporters: FactionStance[] = []
  const opponents: FactionStance[] = []
  for (const [key, total] of entries) {
    const stance: FactionStance = {
      key,
      name: FACTION_NAMES[key].name,
      strength: Math.abs(total) >= FIRM_STANCE ? 'firm' : 'leaning',
    }
    if (total > 0) supporters.push(stance)
    else opponents.push(stance)
  }
  return { supporters, opponents }
}
