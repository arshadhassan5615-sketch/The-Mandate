// GDD Section 14.2 — Narrative Engine types
import type { StateModifier } from './gameState'

export type NarrativeSegmentType = 'description' | 'dialogue' | 'internal_thought'

export interface NarrativeSegment {
  type: NarrativeSegmentType
  text: string
  character?: string  // only present when type === 'dialogue'
}

export interface Condition {
  stat: string                              // dot-notation: "nation.pressFreedom", "flags.bni_dissolved", "currentWeek"
  operator: '>' | '<' | '==' | '>=' | '<=' | '!='
  value: number | string | boolean
}

export interface ChainTrigger {
  targetNodeId: string
  delayWeeks: number
  conditions?: Condition[]
  probability?: number                      // 0-1; omit = always fires
}

export type ChoiceTag = 'reformist' | 'pragmatist' | 'authoritarian' | 'populist' | 'personal' | 'deflect'

export interface ChoiceReaction {
  character: string
  text: string
  type: 'dialogue' | 'narrative' | 'action' | 'silence'
}

export interface SceneChoice {
  id: string
  text: string
  internalTag: ChoiceTag
  tooltip?: string
  conditions?: Condition[]                  // gates whether this choice is shown
  stateChanges: StateModifier[]
  chainTriggers: ChainTrigger[]
  nextNodeId?: string                       // explicit transition; bypasses auto-advance
  nextSegment?: string                      // transition to a branch within the same scene
  flags: string[]                           // boolean flags set on pick
  codexUnlocks: string[]
  reactions?: ChoiceReaction[]              // micro-reactions from present characters
}

export interface NarrativeSegmentSet {
  narrative: NarrativeSegment[]
  choices: SceneChoice[]
  monologue?: string
}

export type SceneType = 'meeting' | 'event' | 'crisis' | 'personal' | 'diplomacy' | 'emergency' | 'social_event'

export interface SocialInteraction {
  id: string
  character?: string
  title: string
  location: string
  mandatory?: boolean
  mutualExclusive?: string
  narrative: NarrativeSegment[]
  choices: SceneChoice[]
}

export interface NarrativeNode {
  id: string
  title: string
  act: number
  weekAvailable: number
  weekDeadline?: number
  type: SceneType
  agendaCost: number
  isMandatory: boolean
  isWeekGate?: boolean
  gateMessage?: string
  prerequisiteSceneIds?: string[]
  prerequisiteFlags?: string[]
  unlocksSceneIds?: string[]
  location: string
  characters: string[]
  prerequisites: Condition[]
  exclusive?: string[]
  narrative: NarrativeSegment[]
  choices: SceneChoice[]
  segments?: Record<string, NarrativeSegmentSet>
  monologue?: string
  socialInteractions?: SocialInteraction[]
}
