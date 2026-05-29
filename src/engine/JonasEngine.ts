import type { JonasPublicStage } from '../types/gameState'

export function computeJonasStage(
  currentWeek: number,
  marriageHealth: number,
): JonasPublicStage {
  if (currentWeek >= 41) return 'decision'
  if (currentWeek >= 31) {
    if (marriageHealth > 60) return 'force'
    if (marriageHealth < 40) return 'force'
    return 'force'
  }
  if (currentWeek >= 21) return 'activist'
  if (currentWeek >= 11) return 'advocate'
  return 'supportive_spouse'
}

export function getJonasStageLabel(stage: JonasPublicStage): string {
  switch (stage) {
    case 'supportive_spouse': return 'The Supportive Spouse'
    case 'advocate': return 'The Advocate'
    case 'activist': return 'The Activist'
    case 'force': return 'The Force'
    case 'decision': return 'The Decision'
  }
}

export function getJonasStageDescription(stage: JonasPublicStage, marriageHealth: number): string {
  switch (stage) {
    case 'supportive_spouse':
      return 'Jonas attends events, supports you quietly, offers private opinions.'
    case 'advocate':
      return 'Jonas speaks publicly about architecture and urban renewal. His voice is developing.'
    case 'activist':
      return 'Jonas takes public positions on social issues. He is becoming a figure in his own right.'
    case 'force':
      if (marriageHealth > 60) return 'Jonas is your most powerful political asset, supporting your positions publicly.'
      if (marriageHealth < 40) return 'Jonas is a political liability, publicly criticizing your policies.'
      return 'Jonas has carved his own path — sometimes helping, sometimes hurting.'
    case 'decision':
      return 'Jonas faces a definitive choice about the marriage and his political future.'
  }
}
