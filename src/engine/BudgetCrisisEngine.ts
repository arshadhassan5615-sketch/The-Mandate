import type { GameState } from '../types/gameState'

export interface BudgetCrisisTrigger {
  sceneId: string
  crisisName: string
  crisisType: 'budget'
}

export function checkForBudgetCrisis(_state: GameState, activeFlags: string[]): BudgetCrisisTrigger | null {
  if (activeFlags.includes('budget_crisis_resolved_this_week')) return null

  if (
    activeFlags.includes('severe_deficit_crisis') &&
    !activeFlags.includes('deficit_crisis_resolved')
  ) {
    return {
      sceneId: 'crisis_deficit_emergency',
      crisisName: 'Fiscal Emergency',
      crisisType: 'budget',
    }
  }

  return null
}
