// Provincial governors: who holds office in each home province and what they do each week.
//
// Flag conventions (read from activeFlags / emitted in flags):
// - appointed: `governor_<provinceId>_appointed_<governorId>`  (e.g. `governor_kravenstal_appointed_novak`)
// - elected:   `governor_<provinceId>_elected_<governorId>`    (e.g. `governor_kravenstal_elected_novak`)
// - dismissed: `governor_<provinceId>_dismissed_<governorId>` — sacked; never holds office again
// - backed:    `governor_<provinceId>_backed_<governorId>`    — publicly backed in a crisis; more loyal
// - `self_government_act_signed`  set by a bill
// - `provincial_elections_held`   set once the elections have run
// - `governors_loyal_majority`    set once at least 3 governors have loyalty >= 60
import { GOVERNORS, ELECTION_CANDIDATES, type Governor } from '../data/governors'
import { PROVINCES } from '../data/provinces'
import { HOME_PROVINCES, type HomeProvinceId } from './provinceNews'
import { computeProvinceStatus } from '../components/map/provinceStatus'
import type { GameState, StateModifier } from '../types/gameState'

/** A low-integrity governor adds a point of national corruption this often, in weeks. */
const CORRUPTION_TICK_WEEKS = 8

/** A governor the Chancellor stood by in a crisis is this much more loyal. */
const BACKED_LOYALTY_BONUS = 25

export type GovernorSource = 'incumbent' | 'appointed' | 'elected'

export interface GovernorInOffice {
  governor: Governor
  source: GovernorSource
}

function appointedFlag(provinceId: string, governorId: string): string {
  return `governor_${provinceId}_appointed_${governorId}`
}

function electedFlag(provinceId: string, governorId: string): string {
  return `governor_${provinceId}_elected_${governorId}`
}

function dismissedFlag(provinceId: string, governorId: string): string {
  return `governor_${provinceId}_dismissed_${governorId}`
}

function backedFlag(provinceId: string, governorId: string): string {
  return `governor_${provinceId}_backed_${governorId}`
}

export function governorInOffice(provinceId: HomeProvinceId, activeFlags: readonly string[]): GovernorInOffice {
  const active = new Set(activeFlags)
  const roster = GOVERNORS.filter(g => g.provinceId === provinceId)
  const eligible = roster.filter(g => !active.has(dismissedFlag(provinceId, g.id)))

  const elected = eligible.find(g => active.has(electedFlag(provinceId, g.id)))
  if (elected) return { governor: elected, source: 'elected' }

  const appointed = eligible.find(g => active.has(appointedFlag(provinceId, g.id)))
  if (appointed) return { governor: appointed, source: 'appointed' }

  const incumbent = roster.find(g => g.incumbent)
  if (!incumbent) throw new Error(`No incumbent governor defined for province "${provinceId}"`)
  if (eligible.includes(incumbent)) return { governor: incumbent, source: 'incumbent' }

  const [acting] = eligible
  if (acting) return { governor: acting, source: 'appointed' }
  return { governor: incumbent, source: 'incumbent' }
}

export function effectiveLoyalty(provinceId: HomeProvinceId, governor: Governor, activeFlags: readonly string[]): number {
  return Math.min(100, governor.loyalty + (activeFlags.includes(backedFlag(provinceId, governor.id)) ? BACKED_LOYALTY_BONUS : 0))
}

export const PROVINCE_KEY_STAT: Record<HomeProvinceId, string> = {
  ashenmere: 'nation.publicOrder',
  kravenstal: 'factions.workersCoalition',
  thornfeld: 'factions.church',
  sevagrad: 'nation.militaryReadiness',
  aldenmoor: 'factions.businessClass',
  dravenhollow: 'factions.dravenni',
}

export function provincialElectionWinner(
  provinceId: HomeProvinceId,
  state: Pick<GameState, 'playerPolling' | 'kolvarPolling'>,
): string {
  const politics = PROVINCES[provinceId].politics
  const reformShare = (politics.reformist ?? 0) + (politics.workers ?? 0)
  const total = Object.values(politics).reduce((sum, v) => sum + v, 0)
  const oppShare = total - reformShare
  const reformScore = reformShare * state.playerPolling
  const oppScore = oppShare * state.kolvarPolling
  return reformScore >= oppScore ? ELECTION_CANDIDATES[provinceId].reform : ELECTION_CANDIDATES[provinceId].opposition
}

export function processGovernorsWeek(
  state: GameState,
  activeFlags: readonly string[],
): { modifiers: StateModifier[]; flags: string[] } {
  const modifiers: StateModifier[] = []
  const flags: string[] = []
  const known = [...activeFlags]

  // b. Provincial elections, once, after the Self-Government Act is signed.
  if (known.includes('self_government_act_signed') && !known.includes('provincial_elections_held')) {
    for (const p of HOME_PROVINCES) {
      const flag = electedFlag(p, provincialElectionWinner(p, state))
      flags.push(flag)
      known.push(flag)
    }
    flags.push('provincial_elections_held')
    known.push('provincial_elections_held')
  }

  // c. Weekly effects per province.
  for (const p of HOME_PROVINCES) {
    const g = governorInOffice(p, known).governor
    const level = computeProvinceStatus(p, state).level

    if (level !== 'Stable' && g.competence < 50) {
      modifiers.push({ stat: PROVINCE_KEY_STAT[p], operation: 'add', value: -1, sourceType: 'weekly_tick', sourceId: 'governor_' + p })
    }
    if (level !== 'Stable' && g.competence >= 75) {
      modifiers.push({ stat: PROVINCE_KEY_STAT[p], operation: 'add', value: 1, sourceType: 'weekly_tick', sourceId: 'governor_' + p })
    }
    if (g.integrity < 40 && state.currentWeek % CORRUPTION_TICK_WEEKS === 0) {
      modifiers.push({ stat: 'nation.corruption', operation: 'add', value: 1, sourceType: 'weekly_tick', sourceId: 'governor_' + p })
    }
  }

  // d. Loyal majority flag.
  const loyal = HOME_PROVINCES.filter(p => effectiveLoyalty(p, governorInOffice(p, known).governor, known) >= 60).length
  if (loyal >= 3 && !known.includes('governors_loyal_majority')) {
    flags.push('governors_loyal_majority')
  }

  return { modifiers, flags }
}
