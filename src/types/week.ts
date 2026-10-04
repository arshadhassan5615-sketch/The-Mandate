import type { Condition } from './narrative'
import type { VoteConfig } from './vote'

export type GamePhase = 'title' | 'customization' | 'prologue' | 'cinematic' | 'briefing' | 'press' | 'legislation' | 'parliament' | 'agenda' | 'map' | 'scene' | 'budget' | 'constitution' | 'lobbying' | 'vote_result' | 'review' | 'epilogue'

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
  voteConfig?: VoteConfig
  /**
   * Week-scoped recurring entry (petitions / press conference / campaign
   * rally). Done-ness counts only this week's completion, so each occurrence
   * can replay although the shared sceneId was visited in an earlier week.
   */
  recurring?: boolean
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

export interface WeeklyStatChange {
  label: string
  oldValue: number
  newValue: number
  delta: number
  category: 'faction' | 'nation' | 'personal'
}

export interface WeeklyEvent {
  id: string
  title: string
  summary: string
  category: 'political' | 'economic' | 'military' | 'personal' | 'crisis'
  impact: 'positive' | 'negative' | 'neutral'
  week: number
}

export interface WeeklyDecision {
  title: string
  consequence: string
  impact: 'positive' | 'negative' | 'neutral'
}

export interface UpcomingDeadline {
  id: string
  title: string
  description: string
  urgency: 'critical' | 'warning' | 'info'
  timeRemaining: string
}

export interface NarrativeReflection {
  text: string
}

export interface WeeklySummary {
  statChanges: WeeklyStatChange[]
  events: WeeklyEvent[]
  decisions: WeeklyDecision[]
  deadlines: UpcomingDeadline[]
  reflection: NarrativeReflection
}
