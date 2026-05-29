import type { StateModifier } from './gameState'
import type { Condition } from './narrative'

export type ProjectPhase = 'proposed' | 'active' | 'completed' | 'failed' | 'cancelled'
export type ProjectCategory = 'infrastructure' | 'industry' | 'education' | 'military' | 'welfare' | 'urban'

export interface ProjectMidpointChoice {
  id: string
  text: string
  effects: StateModifier[]
  costChange?: number
  flags: string[]
}

export interface DevelopmentProject {
  id: string
  title: string
  description: string
  cost: number
  durationWeeks: number
  category: ProjectCategory
  effects: StateModifier[]
  midpointWeek: number
  midpointChoices: ProjectMidpointChoice[]
  prerequisites?: Condition[]
  flags: string[]
  codexUnlocks: string[]
}

export interface ActiveProject {
  projectId: string
  startedWeek: number
  currentWeek: number
  phase: ProjectPhase
  midpointResolved: boolean
  totalCost: number
  contractor?: 'state' | 'vael' | 'foreign'
}
