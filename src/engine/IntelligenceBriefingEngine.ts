import type { GameState } from '../types/gameState'

export interface BriefingContext {
  injectedSegments: string[]
  threatLevel: 'routine' | 'elevated' | 'critical'
  availableChoices: string[]
}

/** Matches any minister corruption-exposed flag (e.g. "elara_vostane_corruption_exposed"). */
const CORRUPTION_EXPOSED_PATTERN = /^.+_corruption_exposed$/

export function computeBriefingContext(state: GameState, activeFlags: string[]): BriefingContext {
  const segments: string[] = []

  // MOLE PROGRESS — active investigation, not yet resolved
  if (state.clues.length > 0 && state.clues.length < 8) {
    segments.push('briefing_mole_progress')
  }

  // FACTION UNREST — Iron Covenant discontent or hardliner momentum
  if (state.factions.ironCovenant < 40 || state.nation.assemblyHardliner > 60) {
    segments.push('briefing_faction_unrest')
  }

  // TYVAREN MOVEMENT — border tension elevated
  if (state.tyvarenHostility > 50) {
    segments.push('briefing_tyvaren_movement')
  }

  // MORIVASK INSTABILITY — oil deal not yet completed
  if (!activeFlags.includes('morivask_oil_deal_complete')) {
    segments.push('briefing_morivask_instability')
  }

  // MINISTER CORRUPTION — any minister's corruption has been exposed
  const hasCorruptionFlag = activeFlags.some(f => CORRUPTION_EXPOSED_PATTERN.test(f))
  if (hasCorruptionFlag) {
    segments.push('briefing_minister_corruption')
  }

  // OLIGARCH ACTIVITY — Vael or Morvec influence elevated
  if (state.vaelInfluence > 40 || state.morvecInfluence > 30) {
    segments.push('briefing_oligarch_activity')
  }

  // ROUTINE QUIET — fallback when nothing significant is happening
  if (segments.length === 0) {
    segments.push('briefing_routine_quiet')
  }

  // Determine threat level for diary categorization
  const threatLevel = segments.includes('briefing_tyvaren_movement')
    || segments.includes('briefing_faction_unrest')
      ? 'critical'
      : segments.includes('briefing_mole_progress')
      || segments.includes('briefing_minister_corruption')
        ? 'elevated'
        : 'routine'

  return {
    injectedSegments: segments.slice(0, 3),
    threatLevel,
    availableChoices: ['briefing_fuller_report', 'briefing_standard', 'briefing_dismiss'],
  }
}

export function buildBriefingChainTriggers(currentWeek: number) {
  const briefingWeeks = [3, 7, 11, 15, 19, 23, 27, 31, 35, 39, 43, 47]
  return briefingWeeks
    .filter(w => w > currentWeek)
    .map(w => ({
      targetNodeId: 'intelligence_briefing_recurring',
      delayWeeks: w - currentWeek,
    }))
}
