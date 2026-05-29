import type { GameState } from '../types/gameState'

export type AssassinationVariant = 'bombing' | 'sniper' | 'poisoning' | null

export interface AssassinationCheckResult {
  triggered: boolean
  variant: AssassinationVariant
  reason: string
}

export function evaluateAssassinationTrigger(
  state: GameState,
  flags: string[],
): AssassinationCheckResult {
  const { currentWeek, factions, nation } = state

  if (currentWeek < 30 || currentWeek > 36) {
    return { triggered: false, variant: null, reason: '' }
  }

  if (flags.includes('assassination_survived') || flags.includes('assassination_attempted')) {
    return { triggered: false, variant: null, reason: 'already triggered' }
  }

  // Condition A: halvekists < 15 AND ironCovenant < 20 (old guard eliminates you)
  if (factions.halvekists < 15 && factions.ironCovenant < 20) {
    return {
      triggered: true,
      variant: 'sniper',
      reason: 'old_guard_military',
    }
  }

  // Condition B: publicOrder < 20 AND any faction < 10 (extremist violence)
  if (nation.publicOrder < 20) {
    const desperateFactions = [
      { key: 'halvekists', value: factions.halvekists },
      { key: 'workersCoalition', value: factions.workersCoalition },
      { key: 'ironCovenant', value: factions.ironCovenant },
      { key: 'dravenni', value: factions.dravenni },
    ]
    const hasDesperate = desperateFactions.some(f => f.value < 10)
    if (hasDesperate) {
      return {
        triggered: true,
        variant: 'bombing',
        reason: 'extremist_violence',
      }
    }
  }

  // Condition C: ssd_assassination flag was used (retaliation)
  if (flags.includes('ssd_assassination')) {
    return {
      triggered: true,
      variant: 'bombing',
      reason: 'ssd_retaliation',
    }
  }

  // Condition D: Tyvaren war imminent AND you refused to negotiate
  if (flags.includes('tyvaren_war_imminent') && flags.includes('refused_tyvaren_negotiation')) {
    return {
      triggered: true,
      variant: 'poisoning',
      reason: 'tyvaren_foreign_op',
    }
  }

  return { triggered: false, variant: null, reason: '' }
}

export function getAssassinationSceneId(variant: AssassinationVariant): string {
  switch (variant) {
    case 'bombing':
      return 'act3_assassination_bombing'
    case 'sniper':
      return 'act3_assassination_sniper'
    case 'poisoning':
      return 'act3_assassination_poisoning'
    default:
      return 'act3_assassination_default'
  }
}
