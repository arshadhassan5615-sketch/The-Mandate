// GDD Section 14.2 — Narrative Engine types
import type { StateModifier } from './gameState'

export type NarrativeSegmentType =
  | 'description'
  | 'dialogue'
  | 'internal_thought'
  // Legacy aliases used in older Act 1–3 scene JSON files. The renderer maps
  // them to their canonical equivalents at runtime.
  | 'narrative'
  | 'monologue'

export interface NarrativeSegment {
  type: NarrativeSegmentType
  text: string
  character?: string       // only present when type === 'dialogue'
  primaryCharacter?: string // for description segments: which character's portrait to show
}

export interface StatCondition {
  stat: string                              // dot-notation: "nation.pressFreedom", "flags.bni_dissolved", "currentWeek"
  operator: '>' | '<' | '==' | '>=' | '<=' | '!='
  value: number | string | boolean
}

export interface FlagCondition {
  type: 'flag'
  flag: string                              // exact activeFlag name
  value: boolean                            // required membership state
}

export type Condition = StatCondition | FlagCondition

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
  type: 'dialogue' | 'narrative' | 'action' | 'silence' | 'concern' | 'satisfied'
}

export interface SceneChoice {
  id: string
  text: string
  internalTag?: ChoiceTag
  tooltip?: string
  conditions?: Condition[]                  // gates whether this choice is shown
  stateChanges?: StateModifier[]
  // Legacy key used in older Act 1–3 scene JSON files. The engine treats
  // `statEffects` as an alias for `stateChanges` (operation = 'add') when
  // `stateChanges` is empty or missing, so adding this field keeps the
  // existing JSON files compatible without a data migration.
  statEffects?: Array<{ stat: string; value: number }>
  chainTriggers?: ChainTrigger[]
  nextNodeId?: string                       // explicit transition; bypasses auto-advance
  nextSegment?: string                      // transition to a branch within the same scene
  flags?: string[]                           // boolean flags set on pick
  codexUnlocks?: string[]
  reactions?: ChoiceReaction[]              // micro-reactions from present characters
}

export interface NarrativeSegmentSet {
  narrative?: NarrativeSegment[]
  // Legacy alias: some segments store content under `dialogue` instead of
  // `narrative`. The engine normalizes this at load / choice time.
  dialogue?: NarrativeSegment[] | string
  choices?: SceneChoice[]
  monologue?: string
}

export type SceneType = 'meeting' | 'event' | 'crisis' | 'personal' | 'diplomacy' | 'emergency' | 'social_event'

export interface SocialInteraction {
  id: string
  character?: string
  title: string
  location: string
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
  isWeekGate?: boolean
  gateMessage?: string
  prerequisiteSceneIds?: string[]
  prerequisiteFlags?: string[]
  unlocksSceneIds?: string[]
  location: string
  characters: string[]
  prerequisites: Condition[]
  exclusive?: string[]
  narrative?: NarrativeSegment[]
  // Legacy alias: some scenes store their top-level content under `dialogue`
  // instead of `narrative`. The engine normalizes this at load time.
  dialogue?: NarrativeSegment[] | string
  choices?: SceneChoice[]
  segments?: Record<string, NarrativeSegmentSet>
  monologue?: string
  socialInteractions?: SocialInteraction[]
}
