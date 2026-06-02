export type MinistryType =
  | 'finance'
  | 'interior'
  | 'defense'
  | 'justice'
  | 'labor'
  | 'foreign_affairs'
  | 'education'
  | 'health'
  | 'development'
  | 'resources'

export type IdeologyType =
  | 'reformist'
  | 'conservative'
  | 'pragmatist'
  | 'nationalist'
  | 'progressive'
  | 'loyalist'

export type TraitType =
  | 'intellectual'
  | 'principled'
  | 'academic'
  | 'practical'
  | 'direct'
  | 'calculating'
  | 'ambitious'
  | 'compassionate'
  | 'decisive'
  | 'cautious'
  | 'loyal'
  | 'bureaucratic'
  | 'visionary'
  | 'collaborative'
  | 'connected'
  | 'methodical'
  | 'scientific'
  | 'idealistic'
  | 'resourceful'
  | 'results-driven'
  | 'evidence-based'

export interface MinisterCandidate {
  id: string
  name: string
  title: string
  ministry: MinistryType
  portrait: string
  age: number
  ideology: IdeologyType
  loyalty: number
  competence: number
  corruption_risk: number
  faction_ties: string[]
  traits: TraitType[]
  background: string
  vyktor_assessment: string
  weakness: string
}

export interface AppointedMinister extends MinisterCandidate {
  appointed_week: number
  current_loyalty: number
  satisfaction: number
  last_report_week: number
  active_request?: MinisterRequest
}

export interface MinisterRequest {
  id: string
  minister_id: string
  week: number
  type: 'budget' | 'policy' | 'support' | 'crisis' | 'advice'
  title: string
  description: string
  options: MinisterRequestOption[]
  deadline_week?: number
  urgent: boolean
}

export interface MinisterRequestOption {
  id: string
  text: string
  stat_effects: Record<string, number>
  loyalty_effect: number
  satisfaction_effect: number
  flag?: string
  consequence: string
}

export interface CabinetState {
  ministers: Record<MinistryType, AppointedMinister | null>
  formation_complete: boolean
  formation_week: number | null
  pending_requests: MinisterRequest[]
  completed_requests: string[]
}
