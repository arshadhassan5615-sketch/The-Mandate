import type { JonasPublicStage } from '../types/gameState'

export function computeJonasStage(
  currentWeek: number,
  marriageHealth: number,
): JonasPublicStage {
  // Act IV — the marriage reaches its crux
  if (currentWeek >= 41) return 'decision'

  // Act III (Weeks 31-40) — Jonas's public role diverges sharply based on marriage health
  if (currentWeek >= 31) {
    if (marriageHealth >= 75) return 'decision'   // Power couple, fully aligned — the marriage is the platform
    if (marriageHealth >= 50) return 'advocate'   // Supportive but independent, building his own voice
    if (marriageHealth >= 25) return 'activist'   // Publicly critical, the strain is visible
    return 'force'                                // Hostile, actively working against you
  }

  // Act II late (Weeks 21-30) — Jonas finds his public voice
  if (currentWeek >= 21) {
    if (marriageHealth >= 60) return 'activist'   // Strong marriage gives him confidence to take positions
    if (marriageHealth >= 35) return 'advocate'   // Strained — stays in advocate lane, cautious
    return 'activist'                             // Damaged marriage pushes him to act out publicly
  }

  // Act II early (Weeks 11-20) — Jonas begins speaking publicly
  if (currentWeek >= 11) {
    if (marriageHealth >= 50) return 'advocate'   // Healthy — develops his voice at a measured pace
    return 'supportive_spouse'                    // Strained — retreats from public life
  }

  // Act I (Weeks 1-10) — Jonas is the supportive spouse
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
      return marriageHealth >= 50
        ? 'Jonas attends events, supports you quietly, offers private opinions. The marriage is steady.'
        : 'Jonas is distant. He attends when required but offers nothing beyond the expected gestures.'
    case 'advocate':
      return marriageHealth >= 50
        ? 'Jonas speaks publicly about architecture and urban renewal. His voice is developing, and the marriage is strong enough to support it.'
        : 'Jonas speaks carefully, choosing topics that do not touch your government. The marriage constrains his ambition.'
    case 'activist':
      return marriageHealth >= 50
        ? 'Jonas takes public positions on social issues. He is becoming a figure in his own right, and you are proud of him.'
        : 'Jonas takes public positions that sometimes conflict with your agenda. The marriage is strained, and the public can see it.'
    case 'force':
      if (marriageHealth >= 50) return 'Jonas is your most powerful political asset, supporting your positions publicly — but the weight of it is costing you both.'
      if (marriageHealth >= 25) return 'Jonas has become a political liability, publicly criticizing your policies while the marriage frays.'
      return 'Jonas is hostile. He is actively working to undermine your government, and the marriage is a formality.'
    case 'decision':
      return 'Jonas faces a definitive choice about the marriage and his political future.'
  }
}
