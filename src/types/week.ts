import type { Condition } from './narrative'
import type { VoteConfig } from './vote'

export type GamePhase = 'title' | 'customization' | 'prologue' | 'briefing' | 'press' | 'legislation' | 'agenda' | 'scene' | 'budget' | 'constitution' | 'lobbying' | 'vote_result' | 'review' | 'epilogue'

export type AgendaCategory =
  | 'cabinet'
  | 'parliament'
  | 'diplomacy'
  | 'security'
  | 'personal'
  | 'crisis'
  | 'finance'
  | 'infrastructure'

export interface AgendaItem {
  id: string
  title: string
  description: string        // shown on the agenda card
  category: AgendaCategory
  sceneId: string            // NarrativeNode.id to load
  slotCost: number           // 1 or 2
  executionOrder: number     // lower runs first; determines within-week ordering
  weekAvailable: number
  weekDeadline?: number      // undefined = always available after weekAvailable
  prerequisites?: Condition[]
  isUrgent?: boolean
  isMandatory?: boolean
  voteConfig?: VoteConfig
}

export const SLOT_MAX = 3

export const CATEGORY_LABELS: Record<AgendaCategory, string> = {
  cabinet:    'Cabinet',
  parliament: 'Parliament',
  diplomacy:  'Diplomacy',
  security:   'Security',
  personal:   'Personal',
  crisis:     'Crisis',
  finance:    'Finance',
  infrastructure: 'Infrastructure',
}

export const CATEGORY_COLORS: Record<AgendaCategory, string> = {
  cabinet:    'var(--accent-blue)',
  parliament: 'var(--amber-dim)',
  diplomacy:  '#5a7c6a',
  security:   'var(--accent-red)',
  personal:   'var(--accent-green)',
  crisis:     '#c4493a',
  finance:    '#8a7c3a',
  infrastructure: '#6a5acd',
}
