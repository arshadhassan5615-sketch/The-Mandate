// GDD Section 14.2 — Core Data Structures

import type { ActiveProject } from './projects'

export type PlayerBackground = 'Academic' | 'Activist' | 'Lawyer' | 'MilitaryFamily'
export type PlayerPersonality = 'Measured' | 'Passionate' | 'Cunning'
export type PlayerAppearance = 'Professional' | 'Austere' | 'Approachable' | 'Military'

export interface AdvisorTrust {
  vyktor: number   // 0-100 — Chief of Staff Vyktor Reznik
  danika: number   // 0-100 — Minister of Interior Danika Oberlin
  theron: number   // 0-100 — Prof. Aldric Theron
  soraya: number   // 0-100 — Soraya Metsk (union leader)
  dusek: number    // 0-100 — Col. Irina Dusek
  valdek: number   // 0-100 — Orin Valdek
}

export interface BudgetAllocations {
  // Revenue (in millions ₭) — editable via revenue events
  taxRevenue:     number   // 285
  stateIndustry:  number   // 55
  customsTariffs: number   // 30
  foreignAid:     number   // 10
  // Expenditure (in millions ₭) — player-adjustable at budget review points
  military:       number   // 120
  debtService:    number   // 75
  govtAdmin:      number   // 65
  infrastructure: number   // 55
  education:      number   // 45
  healthcare:     number   // 40
  welfare:        number   // 25
  bniSecurity:    number   // 20
}

export interface NationState {
  economyHealth: number        // -100 to 100
  unemployment: number         // 0 to 40 (percent)
  inflation: number            // 0 to 30 (percent)
  nationalDebt: number         // absolute ₭ value (millions)
  corruption: number           // 0 to 100
  militaryReadiness: number    // 0 to 100
  militaryTech: number         // 0-100 - Tech level of military equipment
  publicOrder: number          // 0 to 100
  pressFreedom: number         // 0 to 100
  mediaControl: number          // 0 to 100 — who controls the narrative
  civilLiberties: number       // 0 to 100
  internationalStanding: number // 0 to 100
  assemblyVoteMargin: number    // 0 to 250 — margin of last Assembly vote
  lawOrder: number
  assemblyConservative: number
  assemblyHardliner: number
  assemblyReformist: number
  energyIndependence: number
  conventionStability: number
  educationStandard: number
  regionalSupport: number
}

export interface FactionState {
  halvekists: number       // 0-100
  workersCoalition: number // 0-100
  reformists: number       // 0-100
  ironCovenant: number     // 0-100
  church: number           // 0-100
  businessClass: number    // 0-100
  dravenni: number         // 0-100
  partyLoyalists: number   // 0-100
}

export interface PersonalState {
  marriageHealth: number    // 0-100
  lioraRelationship: number // 0-100
  tomasWellbeing: number    // 0-100
  personalWealth: number    // ₭ amount
  publicImage: number       // 0-100
  moralCompass: number      // -100 to +100
  stressLevel: number
  fiscalRestraint: number
}

export interface CorruptionEntry {
  id: string
  weekRecorded: number
  description: string
  witnesses: string[]
  evidence: string
  discovered: boolean
  discoveryWeek: number | null
}

export interface StateModifier {
  stat: string
  operation: 'add' | 'set' | 'multiply'
  value: number
}

/** Central audit trail of numeric stat mutations applied via applyModifier. */
export interface EffectLogEntry {
  week: number
  stat: string
  delta: number
  operation: string
  sourceType: string
  sourceId: string
}

export type MoleIdentity = 'petrin_half' | 'irina_dusek' | 'karsten_volek' | null

export type EconomicDirection = 'free_market' | 'planned' | 'mixed' | 'pragmatic' | null

export type JonasPublicStage = 'supportive_spouse' | 'advocate' | 'activist' | 'force' | 'decision'

export type LetterTone = 'formal' | 'personal' | 'threatening' | 'conciliatory'

export interface DiaryEntry {
  week: number
  date: string
  text: string
  category: 'political' | 'personal' | 'crisis' | 'diplomatic' | 'military'
}

export interface SentLetter {
  id: string
  recipient: string
  tone: LetterTone
  weekSent: number
  title: string
  content: string
  responseSceneId?: string
  responseArrived: boolean
}

export interface Clue {
  id: string
  description: string
  suspectPointer: MoleIdentity
  weekDiscovered: number
}

export interface GameState {
  currentWeek: number
  currentAct: number
  furthestWeek: number         // monotonically forward — tracks the highest week ever reached (anti-scum)
  nation: NationState
  factions: FactionState
  personal: PersonalState
  budget: BudgetAllocations
  // Character creation
  playerBackground: PlayerBackground
  playerPersonality: PlayerPersonality
  playerAppearance: PlayerAppearance
  termFocus: string[]
  advisorTrust: AdvisorTrust
  // Hidden stats
  vaelInfluence: number        // 0-100 — Margrave Vael's grip on your government
  morvecInfluence: number      // 0-100 — Stefan Morvec's influence over your government
  shadowInfluence: number       // 0-100 — off-the-books political power
  shadowFootprint: number       // 0-100 — accumulated blowback from shadowInfluence actions
  // Spy Master
  activeAgents: number          // currently recruited agents
  maxAgents: number             // maximum agent slots
  activeOperations: number      // operations currently running
  tyvarenHostility: number      // 0-100 — Tyvaren foreign-relations tension
  vossRelation: number          // -100..100 — Kael Voss's personal disposition
  sovarka_relation: number      // -100..100 — Sovarka foreign-relations warmth
  danika_loyalty: number        // 0-100 — Danika's loyalty to the player
  refugeeCount: number          // 0-50000 — Morivask refugees currently in Veltria
  religiousAdherence: number    // 0-100 — % of population regularly attending Church
  // Dynamic Polling
  playerPolling: number            // 0-100 - Player's current vote share
  kolvarPolling: number            // 0-100 - Kolvar's current vote share
  // State of Emergency
  stateOfEmergency: boolean         // true when SOE is active
  stateOfEmergencyWeek: number      // week number SOE was declared (0 if inactive)
  stateOfEmergencyExtensions: number // how many times the emergency has been extended
  emergencyDecreesIssued: number    // total emergency decrees issued under this SOE
  seridaAlive: boolean              // whether Serida Valk survived the assassination
  // Spy / Mole subplot
  moleIdentity: MoleIdentity        // randomized at game start: petrin_half | irina_dusek | karsten_volek
  clues: Clue[]                     // discovered clues (max 8)
  moleDiscovered: boolean           // true if player correctly identified the mole
  moleWronglyAccused: string | null // which innocent was wrongly accused, if any
  // Soren prosecution plotline
  sorenImmunityRevoked: boolean      // true if constitution strips Soren's immunity
  sorenTrialOutcome: string | null   // 'public_trial' | 'plea_deal' | 'left_alone' | 'files_released' | 'political_leverage' | null
  sorenFilesRevealed: boolean        // true if the BNI files linking Soren to executions were found
  sorenLinkedToMikhael: boolean      // true if files confirm Soren signed Mikhael's execution order
  // Economic direction (Week 3 choice)
  economicDirection: EconomicDirection // free_market | planned | mixed | pragmatic
  // Jonas public role
  jonasPublicStage: JonasPublicStage     // supportive_spouse | advocate | activist | force | decision
  // Security posture (affects assassination trigger thresholds)
  securityPosture: 'minimal' | 'standard' | 'high'
  // Serida Valk tracking
  seridaTrust: number                    // 0-100 — her trust in you as a leader
  seridaMorale: number                   // 0-100 — her emotional state (100 = hopeful, 0 = broken)
  // Letter writing
  sentLetters: SentLetter[]              // letters sent by the player
  // Radio broadcasts
  radioBroadcastsUsed: number            // how many of 4 total broadcasts have been used
  // Corruption tracking
  corruptionLedger: CorruptionEntry[]
  corruptionDiscoveredCount: number   // how many corruption entries have been revealed
  voteSpendingTotal: number            // total ₭ spent on lobbying and vote-buying
  // Development projects
  activeProjects: ActiveProject[]
  completedProjects: string[]
  // Personal notepad
  personalNotes: string
  journalReflections: Array<{ week: number; text: string; date: string }>
  // Diary entries
  diaryEntries: DiaryEntry[]
  // Week-by-week economy trend (pushed at end of each completeWeek after deferred effects)
  economyHistory: Array<{ week: number; value: number }>
  // Week-by-week national debt (M ₭) — same push timing as economyHistory
  debtHistory: Array<{ week: number; value: number }>
  // Week-by-week inflation (%) — same push timing as economyHistory
  inflationHistory: Array<{ week: number; value: number }>
  // Week-by-week public order — same push timing as economyHistory
  publicOrderHistory: Array<{ week: number; value: number }>
  // Central log of every successful applyModifier mutation (capped at 500)
  effectLog: EffectLogEntry[]
  // Parliament sitting cadence (engine-only until Sub-phase F wires the phase)
  lastParliamentWeek: number       // week of the last sitting, 0 if none yet
  emergencyParliamentFlag: boolean // set by narrative scenes to force a sitting
  // Initial snapshot for end-game comparison
  initialSnapshot: GameState | null
}

// Stat clamping ranges
export const STAT_RANGES: Record<string, [number, number]> = {
  'nation.economyHealth': [-100, 100],
  'nation.unemployment': [0, 40],
  'nation.inflation': [0, 30],
  'nation.nationalDebt': [0, Infinity],
  'nation.corruption': [0, 100],
  'nation.militaryReadiness': [0, 100],
  'nation.militaryTech': [0, 100],
  'nation.publicOrder': [0, 100],
  'nation.pressFreedom': [0, 100],
  'nation.mediaControl': [0, 100],
  'nation.civilLiberties': [0, 100],
  'nation.lawOrder': [0, 100],
  'nation.internationalStanding': [0, 100],
  'nation.assemblyVoteMargin': [0, 250],
  'nation.assemblyConservative': [0, 100],
  'nation.assemblyHardliner': [0, 100],
  'nation.assemblyReformist': [0, 100],
  'factions.halvekists': [0, 100],
  'factions.workersCoalition': [0, 100],
  'factions.reformists': [0, 100],
  'factions.ironCovenant': [0, 100],
  'factions.church': [0, 100],
  'factions.businessClass': [0, 100],
  'factions.dravenni': [0, 100],
  'personal.marriageHealth': [0, 100],
  'personal.lioraRelationship': [0, 100],
  'personal.tomasWellbeing': [0, 100],
  'personal.personalWealth': [0, Infinity],
  'personal.publicImage': [0, 100],
  'personal.moralCompass': [-100, 100],
  'personal.stressLevel': [0, 100],
  'personal.fiscalRestraint': [0, 100],
  'nation.energyIndependence': [0, 100],
  'nation.conventionStability': [0, 100],
  'nation.educationStandard': [0, 100],
  'nation.regionalSupport': [0, 100],
  'factions.partyLoyalists': [0, 100],
  'advisorTrust.theron': [0, 100],
  'advisorTrust.soraya': [0, 100],
  'advisorTrust.dusek':  [0, 100],
  'advisorTrust.vyktor': [0, 100],
  'advisorTrust.danika': [0, 100],
  'advisorTrust.valdek': [0, 100],
  'vaelInfluence':              [0, 100],
  'morvecInfluence':            [0, 100],
  'shadowInfluence':            [0, 100],
  'shadowFootprint':            [0, 100],
  'tyvarenHostility':           [0, 100],
  'vossRelation':               [-100, 100],
  'sovarka_relation':           [-100, 100],
  'danika_loyalty':             [0, 100],
  'refugeeCount':               [0, 50000],
  'religiousAdherence':         [0, 100],
  'corruptionDiscoveredCount':  [0, Infinity],
  'voteSpendingTotal':           [0, Infinity],
  'seridaTrust':                 [0, 100],
  'seridaMorale':                [0, 100],
  'playerPolling':               [0, 100],
  'kolvarPolling':               [0, 100],
}
