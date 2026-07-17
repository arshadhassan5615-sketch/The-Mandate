import type { GameState } from '../types/gameState'
import { useCabinetStore } from '../stores/cabinetStore'

export type AssassinationVariant = 'bombing' | 'sniper' | 'poisoning' | null

export interface AssassinationCheckResult {
  triggered: boolean
  variant: AssassinationVariant
  reason: string
}

/**
 * Computes a hidden reliability modifier based on the player's chosen security
 * posture AND the interior minister's competence/loyalty. A corrupt or disloyal
 * interior minister silently undermines whatever posture was chosen.
 *
 * Returns a multiplier applied to trigger thresholds:
 *   < 1.0 → harder to trigger (strong security)
 *   = 1.0 → baseline (standard posture, reliable minister)
 *   > 1.0 → easier to trigger (weak security or compromised minister)
 */
function computeSecurityReliability(state: GameState): number {
  const interior = useCabinetStore.getState().getMinister('interior')

  let reliability =
    state.securityPosture === 'high'     ? 0.7 :
    state.securityPosture === 'minimal'  ? 1.4 :
    1.0  // standard

  // A corrupt or disloyal interior minister silently undermines
  // whatever posture was chosen
  if (interior) {
    if (interior.corruption_risk > 25) reliability *= 1.3
    if (interior.current_loyalty < 40) reliability *= 1.2
  }

  return reliability
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

  // Security reliability modifier — adjusts thresholds, not variant selection.
  // High posture → reliability < 1 → thresholds shrink → harder to trigger.
  // Low posture  → reliability > 1 → thresholds grow  → easier to trigger.
  const r = computeSecurityReliability(state)

  // Condition A: halvekists < 15 AND ironCovenant < 20 (old guard eliminates you)
  if (factions.halvekists < 15 / r && factions.ironCovenant < 20 / r) {
    return {
      triggered: true,
      variant: 'sniper',
      reason: 'old_guard_military',
    }
  }

  // Condition B: publicOrder < 20 AND any faction < 10 (extremist violence)
  if (nation.publicOrder < 20 / r) {
    const desperateFactions = [
      { key: 'halvekists', value: factions.halvekists },
      { key: 'workersCoalition', value: factions.workersCoalition },
      { key: 'ironCovenant', value: factions.ironCovenant },
      { key: 'dravenni', value: factions.dravenni },
    ]
    const hasDesperate = desperateFactions.some(f => f.value < 10 / r)
    if (hasDesperate) {
      return {
        triggered: true,
        variant: 'bombing',
        reason: 'extremist_violence',
      }
    }
  }

  // Condition C: ssd_assassination flag was used (retaliation)
  // No threshold to adjust — flag presence is binary.
  if (flags.includes('ssd_assassination')) {
    return {
      triggered: true,
      variant: 'bombing',
      reason: 'ssd_retaliation',
    }
  }

  // Condition D: Tyvaren war imminent AND you refused to negotiate
  // No threshold to adjust — flag presence is binary.
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
