import type { GameState } from '../types/gameState'

export interface DinnerContext {
  injectedSegments: string[]
  dominantTheme: 'political' | 'personal' | 'crisis'
  jonasStance: 'supportive' | 'concerned' | 'hostile'
  availableChoices: string[]
}

export function computeDinnerContext(state: GameState, activeFlags: string[]): DinnerContext {
  const segments: string[] = []

  // POLITICAL THEME INJECTIONS (check cabinet / political choices via flags)
  if (activeFlags.includes('minister_defense_brenner')) {
    segments.push('dinner_military_presence')
  }
  if (activeFlags.includes('morvec_debt_owed')) {
    segments.push('dinner_oligarch_rumors')
  }
  if (activeFlags.includes('workers_deal_struck')) {
    segments.push('dinner_union_praise')
  }
  if (activeFlags.includes('press_suppressed')) {
    segments.push('dinner_journalist_arrest')
  }

  // CRISIS THEME INJECTIONS
  if (state.nation.publicOrder < 40) {
    segments.push('dinner_protest_sounds')
  }
  if (state.stateOfEmergency) {
    segments.push('dinner_curfew_discussion')
  }

  // PERSONAL THEME INJECTIONS
  if (state.personal.marriageHealth < 40) {
    segments.push('dinner_marital_tension')
  }
  if (state.personal.tomasWellbeing < 30) {
    segments.push('dinner_tomas_trouble')
  }

  // Determine Jonas's stance based on marriageHealth
  let jonasStance: 'supportive' | 'concerned' | 'hostile' = 'supportive'
  if (state.personal.marriageHealth < 50) jonasStance = 'concerned'
  if (state.personal.marriageHealth < 30) jonasStance = 'hostile'

  // Determine dominant theme for diary categorization
  const dominantTheme = state.stateOfEmergency || state.nation.publicOrder < 40
    ? 'crisis'
    : segments.length > 2 ? 'political' : 'personal'

  return {
    injectedSegments: segments.slice(0, 3),
    dominantTheme,
    jonasStance,
    availableChoices: ['dinner_engage', 'dinner_deflect', 'dinner_work_late'],
  }
}

export function buildDinnerChainTriggers(currentWeek: number) {
  const dinnerWeeks = [6, 12, 18, 24, 30, 36, 42, 48]
  return dinnerWeeks
    .filter(w => w > currentWeek)
    .map(w => ({
      targetNodeId: 'family_dinner_recurring',
      delayWeeks: w - currentWeek,
    }))
}
