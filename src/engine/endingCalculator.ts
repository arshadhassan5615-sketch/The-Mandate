import type { GameState } from '../types/gameState'
import type { EndingResult, GovernanceOutcome, PersonalOutcome } from '../types/ending'

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  if (inMax === inMin) return outMin
  const t = (value - inMin) / (inMax - inMin)
  return clamp(outMin + t * (outMax - outMin), outMin, outMax)
}

export function computeGovernanceScore(state: GameState, flags: string[]): number {
  const n = state.nation
  const f = state.factions

  // Economy sub-score (30%): economyHealth mapped from [-100,100] to [0,100],
  // minus penalties for extreme unemployment and inflation
  const econHealthScore = mapRange(n.economyHealth, -100, 100, 0, 100)
  const unemploymentPenalty = n.unemployment > 25 ? (n.unemployment - 25) * 1.5 : 0
  const inflationPenalty = n.inflation > 15 ? (n.inflation - 15) * 2 : 0
  const economyScore = clamp(econHealthScore - unemploymentPenalty - inflationPenalty, 0, 100)

  // Democracy sub-score (25%): civil liberties, press freedom, anti-corruption
  const democracyScore = (n.pressFreedom + n.civilLiberties + (100 - n.corruption)) / 3

  // Security sub-score (20%): military readiness, public order, international standing
  const securityScore = (n.militaryReadiness + n.publicOrder + n.internationalStanding) / 3

  // Faction stability (15%): support from democratic factions
  const factionScore = (f.reformists + f.workersCoalition) / 2

  // Constitutional legacy (10%): big bonus if constitution passed
  const constitutionScore = flags.includes('constitution_in_force') ? 100 : f.reformists * 0.7

  const raw = economyScore * 0.30 + democracyScore * 0.25 + securityScore * 0.20
            + factionScore * 0.15 + constitutionScore * 0.10
  return Math.round(clamp(raw, 0, 100))
}

export function computePersonalScore(state: GameState): number {
  const p = state.personal

  const marriageScore = p.marriageHealth
  const lioraScore = p.lioraRelationship
  const tomasScore = p.tomasWellbeing
  const imageScore = p.publicImage
  const moralScore = mapRange(p.moralCompass, -100, 100, 0, 100)

  const raw = marriageScore * 0.25 + lioraScore * 0.25 + tomasScore * 0.25
            + imageScore * 0.15 + moralScore * 0.10
  return Math.round(clamp(raw, 0, 100))
}

export function determineGovernanceOutcome(
  state: GameState,
  flags: string[],
  governanceScore: number,
): GovernanceOutcome {
  // War outcomes take precedence — the defining event of the Chancellorship
  if (flags.includes('war_victory') || flags.includes('war_defeat') || flags.includes('war_stalemate')) {
    return 'war_survivor'
  }

  // Coup or assassination — state failure
  if (flags.includes('coup_succeeded') || flags.includes('ending_assassination')) {
    return 'collapse'
  }

  // Revolutionary path
  if (flags.includes('khaled_alliance') && state.factions.workersCoalition >= 40) {
    return 'revolutionary'
  }

  // Democratic triumph: constitution passed, strong reform, decent economy
  if (flags.includes('constitution_in_force') && governanceScore >= 55) {
    return 'democratic_triumph'
  }

  // Benevolent autocrat: ruled through strength, order maintained
  if (flags.includes('emergency_powers_retained') || flags.includes('executive_governance')) {
    return 'benevolent_autocrat'
  }
  if (state.factions.ironCovenant >= 30 && state.personal.moralCompass <= 10 && governanceScore >= 40) {
    return 'benevolent_autocrat'
  }

  // Economic survivor: IMA path, austerity
  if (flags.includes('ima_deal_accepted') || (state.nation.economyHealth <= -10 && governanceScore >= 25)) {
    return 'economic_survivor'
  }

  // Default collapse
  if (governanceScore < 30) return 'collapse'

  // Fallback: classify by governance score
  if (governanceScore >= 55) return 'democratic_triumph'
  if (governanceScore >= 35) return 'economic_survivor'
  return 'collapse'
}

export function determinePersonalOutcome(
  _state: GameState,
  flags: string[],
  personalScore: number,
): PersonalOutcome {
  if (flags.includes('family_chosen')) {
    return personalScore >= 50 ? 'family_strained' : 'family_broken'
  }

  if (flags.includes('marriage_ended') || flags.includes('jonas_left')) {
    return personalScore >= 40 ? 'family_strained' : 'family_broken'
  }

  if (personalScore >= 60) return 'family_strong'
  if (personalScore >= 30) return 'family_strained'
  return 'family_broken'
}

export function calculateEnding(state: GameState, flags: string[]): EndingResult {
  const governanceScore = computeGovernanceScore(state, flags)
  const personalScore = computePersonalScore(state)
  const governanceOutcome = determineGovernanceOutcome(state, flags, governanceScore)
  const personalOutcome = determinePersonalOutcome(state, flags, personalScore)

  const variantId = `${governanceOutcome}__${personalOutcome}`

  return {
    governanceScore,
    personalScore,
    governanceOutcome,
    personalOutcome,
    variantId,
  }
}
