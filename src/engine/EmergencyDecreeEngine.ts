import type { GameState } from '../types/gameState'

export interface EmergencyTrigger {
  sceneId: string
  crisisName: string
  crisisType: 'border' | 'riots'
}

export function checkForEmergencies(state: GameState, activeFlags: string[]): EmergencyTrigger | null {
  if (activeFlags.includes('emergency_resolved_this_week')) return null

  if (state.nation.publicOrder < 40 && !activeFlags.includes('tyvaren_border_resolved')) {
    return { sceneId: 'emergency_decree_tyvaren_border', crisisName: 'Tyvaren Border Incursion', crisisType: 'border' }
  }

  if (state.nation.publicOrder < 25 && !activeFlags.includes('capital_riots_resolved')) {
    return { sceneId: 'emergency_decree_capital_riots', crisisName: 'Ashenmere General Strike', crisisType: 'riots' }
  }

  return null
}
