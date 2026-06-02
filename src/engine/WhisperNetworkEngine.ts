import type { GameState } from '../types/gameState'

export interface IntelligenceStatus {
  compromised: boolean
  sceneId: string
}

export function checkIntelligenceIntegrity(state: GameState, activeFlags: string[]): IntelligenceStatus {
  if (activeFlags.includes('briefing_verified_this_week') || activeFlags.includes('trusted_compromised_intel')) {
    return { compromised: false, sceneId: '' }
  }

  if (activeFlags.includes('emergency_resolved_this_week')) {
    return { compromised: false, sceneId: '' }
  }

  if (state.advisorTrust.dusek < 40 || state.factions.ironCovenant < 30) {
    return { compromised: true, sceneId: 'morning_briefing_compromised' }
  }

  return { compromised: false, sceneId: '' }
}
