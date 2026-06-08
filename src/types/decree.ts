export type DecreeCategory =
  | 'economic'
  | 'judicial'
  | 'religious'
  | 'welfare'
  | 'development'

export type MinisterStance = 'favor' | 'against' | 'neutral'

export interface MinisterPosition {
  ministerId: string
  stance: MinisterStance
  reason: string
}

export interface DecreeEffect {
  stat: string
  value: number
  operation?: 'add' | 'set' | 'multiply'
  delayWeeks?: number
  description: string
}

export interface PendingLongTermEffect {
  stat: string
  value: number
  operation: 'add' | 'set' | 'multiply'
  applyAtWeek: number
  description: string
}

export interface Decree {
  id: string
  title: string
  category: DecreeCategory
  proposedBy: string
  summary: string
  description: string
  weekProposed: number
  weekDeadline?: number
  prerequisites?: Array<{ stat: string; operator: string; value: unknown }>
  ministerPositions: MinisterPosition[]
  immediateEffects: DecreeEffect[]
  longTermEffects: DecreeEffect[]
  conflictsWith?: string[]
  signed?: boolean
  rejected?: boolean
  tabled?: boolean
}
