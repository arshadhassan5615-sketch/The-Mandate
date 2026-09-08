import { create } from 'zustand'
import type { AgendaItem, AgendaCategory, GamePhase } from '../types/week'
import { SLOT_MAX } from '../types/week'
import type { GameState } from '../types/gameState'
import type { VoteConfig, VoteResult } from '../types/vote'
import { evaluateAll } from '../engine/conditionEvaluator'
import { getScene, canAdvanceWeek } from '../engine/NarrativeEngine'
import { useGameStore } from './gameStore'
import { useNarrativeStore } from './narrativeStore'
import { useChainStore } from './chainStore'
import { useBillStore } from './billStore'
import { useParliamentStore } from './parliamentStore'
import { useNewsStore } from './newsStore'
import { useDecreeStore } from './decreeStore'
import { shouldTriggerParliament } from '../engine/ParliamentEngine'
import { NEWS_TEMPLATES } from '../data/news/newsTemplates'
import { processCorruptionDiscovery, shouldTriggerImpeachment } from '../engine/CorruptionEngine'
import projectDefinitions from '../data/projects.json'
import type { DevelopmentProject } from '../types/projects'
import type { NewsCategory } from '../types/news'
import { saveGame, AUTOSAVE_SLOT } from '../engine/SaveManager'
import { useSettingsStore } from './settingsStore'
import { evaluateAssassinationTrigger, getAssassinationSceneId } from '../engine/AssassinationEngine'
import { computeJonasStage } from '../engine/JonasEngine'
import { MAX_BROADCASTS } from '../engine/RadioEngine'
import { useLetterStore } from './letterStore'
import { useJournalStore } from './journalStore'
import { generateDiaryEntry } from '../engine/DiaryEngine'
import { generateCliffhanger } from '../engine/CliffhangerEngine'
import { DIVERGENT_ARTICLES } from '../data/newspapers/divergent_coverage'
import { useCabinetStore } from './cabinetStore'
import { generateWeeklyRequests } from '../data/ministerRequests'
import { calculateElectionResult } from '../engine/ElectionEngine'

// ─── Pending transition timeouts ──────────────────────────────────────────────
// Track setTimeout IDs so resetToInitial / startCustomization can cancel them
// and prevent stale state mutations from running after a new game begins.
const pendingTimeouts: ReturnType<typeof setTimeout>[] = []

function trackedTimeout(fn: () => void, delay: number): ReturnType<typeof setTimeout> {
  const id = setTimeout(() => {
    const idx = pendingTimeouts.indexOf(id)
    if (idx >= 0) pendingTimeouts.splice(idx, 1)
    fn()
  }, delay)
  pendingTimeouts.push(id)
  return id
}

function clearAllTimeouts(): void {
  while (pendingTimeouts.length > 0) {
    const id = pendingTimeouts.pop()
    if (id !== undefined) clearTimeout(id)
  }
}

// Load all agenda pool JSON files at build time.
// Each file exports { week: number, agenda: AgendaItem[] }.
const agendaModules = import.meta.glob(
  '../data/agenda/*.json',
  { eager: true },
)
const ALL_AGENDA: AgendaItem[] = Object.values(agendaModules).flatMap((mod: unknown) => {
  // Vite might wrap JSON in { default: ... } or provide it raw
  const data = (mod as { default?: unknown } | null | undefined)?.default ?? mod;
  if (Array.isArray(data)) return data as AgendaItem[];
  if (data && Array.isArray((data as { agenda?: unknown }).agenda)) return (data as { agenda: AgendaItem[] }).agenda;
  return [];
});

function buildPool(week: number, state: GameState, flags: string[], visited: string[]): AgendaItem[] {
  const result = ALL_AGENDA.filter(item => {
    // Broad guard: drop any agenda item missing required fields before further processing
    if (item == null || item.sceneId == null) return false
    if (item.weekAvailable > week) return false
    if (item.weekDeadline !== undefined && week > item.weekDeadline) return false
    if (item.prerequisites?.length) {
      if (!evaluateAll(item.prerequisites, state, flags)) return false
    }

    // Skip scene-level prerequisite checks for special virtual scenes (__ prefix)
    if (!item.sceneId.startsWith('__')) {
      const scene = getScene(item.sceneId)
      if (scene) {
        if (scene.prerequisiteSceneIds?.length) {
          const allPrereqsMet = scene.prerequisiteSceneIds.every(id => visited.includes(id))
          if (!allPrereqsMet) return false
        }
        if (scene.prerequisiteFlags?.length) {
          const allFlagsMet = scene.prerequisiteFlags.every(f => flags.includes(f))
          if (!allFlagsMet) return false
        }
      }
    }

    return true
  })
  if (import.meta.env.DEV) console.log('[buildPool] week:', week,
    'ALL_AGENDA count:', ALL_AGENDA.length,
    'passed filter:', result.length)

  // Week 1 — Address the Nation (fires once, rebuilt every time pool is rebuilt)
  if (week === 1 && !visited.includes('act1_week1_address_nation')) {
    result.push({
      id: 'act1_week1_address_nation',
      title: 'Address the Nation',
      description: 'The Republic is listening. Your first words as Chancellor will define this government.',
      category: 'ceremony' as AgendaCategory,
      sceneId: 'act1_week1_address_nation',
      slotCost: 0,
      executionOrder: 2,
      weekAvailable: 1,
      weekDeadline: 2,
    })
  }

  // Week 6 — Kravenstal police incident (fires once, chains from labor tensions)
  if (week === 6 && !visited.includes('act1_week6_police_incident')) {
    result.push({
      id: 'act1_week6_police_incident',
      title: 'The Kravenstal Incident',
      description: 'Three workers were hospitalized during the factory dispersal. A photograph is already moving. The Commissioner has not called.',
      category: 'crisis' as AgendaCategory,
      sceneId: 'act1_week6_police_incident',
      slotCost: 0,
      executionOrder: 7,
      weekAvailable: 6,
      weekDeadline: 7,
    })
  }

  // Week 7 — Commissioner replacement (fires once, follows Kravenstal incident)
  if (week === 7 && !visited.includes('act1_week7_commissioner')) {
    result.push({
      id: 'act1_week7_commissioner',
      title: "The Commissioner's Chair",
      description: 'The Commissioner has submitted his resignation. Three candidates wait to replace him. This appointment will define the national police force for years.',
      category: 'meeting' as AgendaCategory,
      sceneId: 'act1_week7_commissioner',
      slotCost: 1,
      executionOrder: 3,
      weekAvailable: 7,
      weekDeadline: 8,
    })
  }

  return result
}

// VoteConfig factories for chain-injected votes
function makeNoConfidenceVoteItem(order: number, week: number): AgendaItem {
  return {
    id: '__no_confidence_vote__',
    title: 'Motion of No Confidence — Assembly Division',
    description: 'The Speaker calls the division. Every member casts their vote.',
    category: 'crisis' as AgendaCategory,
    sceneId: '__vote__',
    slotCost: 0,
    executionOrder: order,
    weekAvailable: week,
    isUrgent: true,
    voteConfig: {
      voteType: 'no_confidence',
      threshold: 126,
      totalSeats: 250,
      successFlags: ['no_confidence_passed', 'government_fallen'],
      failureFlags: ['no_confidence_failed', 'government_survived'],
      corruptionRisk: 'none',
      lobbyingEnabled: true,
    } as VoteConfig,
  }
}

function makeNoConfidenceSurvivedItem(order: number, week: number): AgendaItem {
  return {
    id: '__no_confidence_survived__',
    title: 'The Assembly Has Spoken — Motion Defeated',
    description: 'The no-confidence motion failed. The government survives.',
    category: 'crisis' as AgendaCategory,
    sceneId: 'act3_no_confidence_survived',
    slotCost: 0,
    executionOrder: order,
    weekAvailable: week,
    isUrgent: true,
    prerequisites: [{ stat: 'flags.no_confidence_failed', operator: '==' as const, value: true }],
  }
}

function makeNoConfidenceFallenItem(order: number, week: number): AgendaItem {
  return {
    id: '__no_confidence_fallen__',
    title: 'The Government Has Fallen',
    description: 'The no-confidence motion passed. The government must respond.',
    category: 'crisis' as AgendaCategory,
    sceneId: 'act3_no_confidence_fallen',
    slotCost: 0,
    executionOrder: order,
    weekAvailable: week,
    isUrgent: true,
    prerequisites: [{ stat: 'flags.no_confidence_passed', operator: '==' as const, value: true }],
  }
}

function makeImpeachmentVoteItem(order: number, week: number): AgendaItem {
  return {
    id: '__impeachment_vote__',
    title: 'Articles of Impeachment — Assembly Division',
    description: 'The Assembly votes on whether to proceed with the articles.',
    category: 'crisis' as AgendaCategory,
    sceneId: '__vote__',
    slotCost: 0,
    executionOrder: order,
    weekAvailable: week,
    isUrgent: true,
    voteConfig: {
      voteType: 'impeachment',
      threshold: 126,
      totalSeats: 250,
      successFlags: ['impeachment_vote_passed'],
      failureFlags: ['impeachment_vote_failed'],
      corruptionRisk: 'none',
      lobbyingEnabled: true,
    } as VoteConfig,
  }
}

function makeImpeachmentVindicatedItem(order: number, week: number): AgendaItem {
  return {
    id: '__impeachment_vindicated__',
    title: 'Articles of Impeachment — Rejected',
    description: 'The Assembly rejected the articles. The government survives.',
    category: 'crisis' as AgendaCategory,
    sceneId: 'act4_impeachment_vote_vindicated',
    slotCost: 0,
    executionOrder: order,
    weekAvailable: week,
    isUrgent: true,
    prerequisites: [{ stat: 'flags.impeachment_vote_failed', operator: '==' as const, value: true }],
  }
}

interface WeekStore {
  phase: GamePhase

  // Agenda phase
  agendaPool:      AgendaItem[]
  selectedIds:     string[]
  slotsUsed:       number
  forcedChainIds:  string[]   // scene IDs that chain reactions fired this week

  // Scene phase
  sceneQueue:         AgendaItem[]   // sorted selected items (chain scenes first)
  currentQueueIndex:  number
  returnToMap:        boolean        // true when launched from map — returns to 'map' after queue

  // Evening review
  weekStartSnapshot: GameState | null

  // Transitions
  transitionWeek: number | null
  transitionLabel: string

  // Project midpoint
  pendingMidpointProjectId: string | null

  // Term report
  showTermReport: boolean
  showLegacy: boolean

  // Vote / lobbying
  voteConfig: VoteConfig | null
  voteResult: VoteResult | null

  // Diary
  diaryEntry: { week: number; date: string; text: string; category: 'political' | 'personal' | 'crisis' | 'diplomatic' | 'military' } | null
  closeDiary: () => void

  // Cliffhanger
  cliffhangerText: string | null
  closeCliffhanger: () => void

  // Comic cutscene
  cutscenePanels: Array<{ image: string; caption: string; sfx?: string; duration?: number }> | null
  triggerCutscene: (panels: Array<{ image: string; caption: string; sfx?: string; duration?: number }>) => void
  clearCutscene: () => void

  // Gate check
  gateBlocked: boolean
  gateMessage: string | null
  dismissGate: () => void

  // Actions
  startCustomization: () => void    // new game → character sheet (resets all state)
  startPrologue:      () => void    // customization → childhood prologue
  startCinematic:     () => void    // cinematic sequence
  initWeek:          () => void
  endBriefing:       () => void     // briefing → press (then agenda)
  endPress:          () => void     // press → agenda (or legislation if bills)
  endLegislation:    () => void     // legislation → agenda
  toggleAgendaItem:  (id: string) => void
  confirmAgenda:     () => void
  advanceQueue:      () => Promise<void>     // move to next scene or review phase
  injectScene:       (sceneId: string, title: string) => void  // mid-week emergency interrupt
  launchSingleScene: (item: AgendaItem) => void                 // map → single scene → back to map
  resolveMidpoint:   () => void                                    // clear pending midpoint modal
  openTermReport:    () => void                                    // show term report after epilogue
  openLegacy:        () => void                                    // show legacy screen after term report
  completeWeek:      () => Promise<void>     // advance week counter → new week
  clearPendingTimeouts: () => void  // cancel any in-flight transition timeouts
  devJumpToWeek:     (targetWeek: number) => void  // dev tool — bypasses completeWeek pipeline
  radioOpen: boolean
  setRadioOpen: (open: boolean) => void

  // Active save slot
  activeSlot: number
  setActiveSlot: (slot: number) => void

  // Cabinet
  showCabinetFormation: boolean
  showCabinetMeeting: boolean
  reshuffleMinistry: import('../types/minister').MinistryType | undefined
  reshuffleMode: boolean
  triggerCabinetFormation: () => void
  triggerReshuffle: (ministry: import('../types/minister').MinistryType) => void
  dismissCabinetMeeting: () => void
}

export const useWeekStore = create<WeekStore>((set, get) => ({
      phase: 'prologue',
  agendaPool:          [],
  selectedIds:         [],
  slotsUsed:           0,
  forcedChainIds:      [],
  sceneQueue:          [],
  currentQueueIndex:   0,
  returnToMap:         false,
  weekStartSnapshot:   null,
  transitionWeek:      null,
  transitionLabel:     '',
  pendingMidpointProjectId: null,
  showTermReport: false,
  showLegacy: false,
  voteConfig: null,
  voteResult: null,
  diaryEntry: null,
  cliffhangerText: null,
  cutscenePanels: null,
  gateBlocked: false,
  gateMessage: null,
  radioOpen: false,
  activeSlot: 0,

  showCabinetFormation: false,
  showCabinetMeeting: false,
  reshuffleMinistry: undefined,
  reshuffleMode: false,

  setActiveSlot: (slot) => set({ activeSlot: slot }),

  triggerCabinetFormation: () => set({ showCabinetFormation: true }),
  triggerReshuffle: (ministry) => set({ showCabinetFormation: true, reshuffleMinistry: ministry, reshuffleMode: true }),
  dismissCabinetMeeting: () => {
    set({ showCabinetMeeting: false, phase: 'briefing' })
    get().initWeek()
  },

  startCustomization: () => {
    // Cancel any pending transition timeouts so they can't mutate state
    // after a new game has begun.
    clearAllTimeouts()
    // Reset playtime
    useSettingsStore.getState().resetPlaytime()
    // Reset codex seen entries
    try {
      localStorage.removeItem('mandate-codex-seen')
    } catch { /* ignore */ }
    // Full state reset for a clean new game.
    // Stores that have a reset() action (e.g. gameStore.resetToInitial)
    // are called via ?.(); stores without one use setState to wipe state.
    useGameStore.getState().resetToInitial()
    // Randomize the mole identity for this playthrough
    useGameStore.getState().randomizeMoleIdentity()
    // Snapshot the initial state for end-game comparison
    useGameStore.getState().captureSnapshot()
    useDecreeStore.setState({
      pendingDecrees: [],
      signedDecrees: [],
      rejectedDecrees: [],
      tabledDecrees: [],
      selectedDecree: null,
      pendingLongTermEffects: [],
    })
    useCabinetStore.setState({
      ministers: {
        finance: null, interior: null, defense: null, justice: null,
        labor: null, foreign_affairs: null, education: null, health: null,
        development: null, resources: null,
      },
      formation_complete: false,
      formation_week: null,
      pending_requests: [],
      completed_requests: [],
    })
    useBillStore.setState({
      bills: [],
      history: [],
      pendingBill: null,
      isOverlayOpen: false,
      vetoOverrideResult: null,
    })
    useNarrativeStore.getState().resetAll()
    useChainStore.setState({ scheduled: [] })
    useNewsStore.setState({ articles: [], isOpen: false, lastReadIndex: -1, readRecords: {} })
    useJournalStore.setState({ entries: [], seenKeys: new Set<string>() })
    useLetterStore.setState({ letters: [], readIds: new Set<string>(), currentIndex: 0, isOpen: false, unreadCount: 0 })
    set({
      phase: 'customization',
      activeSlot: 0,
      agendaPool: [],
      selectedIds: [],
      slotsUsed: 0,
      forcedChainIds: [],
      sceneQueue: [],
      currentQueueIndex: 0,
      weekStartSnapshot: null,
      transitionWeek: null,
      transitionLabel: '',
      pendingMidpointProjectId: null,
      showTermReport: false,
      showCabinetFormation: false,
      showCabinetMeeting: false,
      voteConfig: null,
      voteResult: null,
      gateBlocked: false,
      gateMessage: null,
    })
  },

  startPrologue: () => set({ phase: 'prologue' }),

  startCinematic: () => set({ phase: 'cinematic' }),

  initWeek: () => {
    const gameState  = useGameStore.getState()
    const { activeFlags, visitedSceneIds } = useNarrativeStore.getState()
    const pool = buildPool(gameState.currentWeek, gameState, activeFlags, visitedSceneIds)
    // Week 14 — Constitution drafting (fires once)
    if (gameState.currentWeek === 14 && !visitedSceneIds.includes('pipeline_constitution_drafting')) {
      pool.push({
        id: 'pipeline_constitution_drafting',
        title: 'The Constitutional Drafting Committee',
        description: 'The committee meets to begin drafting the Republic\'s constitution.',
        category: 'meeting' as AgendaCategory,
        sceneId: 'pipeline_constitution_drafting',
        slotCost: 0,
        executionOrder: 1,
        weekAvailable: 14,
        weekDeadline: 14,
      })
    }

    // Week 15 — Constitution committee (fires once)
    if (gameState.currentWeek === 15 && !visitedSceneIds.includes('pipeline_constitution_committee')) {
      pool.push({
        id: 'pipeline_constitution_committee',
        title: 'The Committee Vote',
        description: 'The drafting committee is ready to vote on the constitutional framework.',
        category: 'meeting' as AgendaCategory,
        sceneId: 'pipeline_constitution_committee',
        slotCost: 0,
        executionOrder: 1,
        weekAvailable: 15,
        weekDeadline: 15,
      })
    }

    // Week 16 — Constitution floor vote (fires once)
    if (gameState.currentWeek === 16 && !visitedSceneIds.includes('pipeline_constitution_floor_vote')) {
      pool.push({
        id: 'pipeline_constitution_floor_vote',
        title: 'The Floor Vote',
        description: 'The Assembly votes on the constitution.',
        category: 'meeting' as AgendaCategory,
        sceneId: 'pipeline_constitution_floor_vote',
        slotCost: 0,
        executionOrder: 2,
        weekAvailable: 16,
        weekDeadline: 16,
      })
    }

    // Week 18 — Morivask oil discovery (fires once)
    if (gameState.currentWeek === 18 && !visitedSceneIds.includes('act2_week18_morivask_oil_discovery')) {
      pool.push({
        id: 'act2_week18_morivask_oil_discovery',
        title: 'Black Smoke on the Eastern Border',
        description: 'Vyktor has been standing for forty minutes. Morivask has oil. Tyvaren wants it.',
        category: 'crisis' as AgendaCategory,
        sceneId: 'act2_week18_morivask_oil_discovery',
        slotCost: 0,
        executionOrder: 1,
        weekAvailable: 18,
        weekDeadline: 18,
      })
    }

    // Week 19 — Informant Network (fires once)
    if (gameState.currentWeek === 19 && !visitedSceneIds.includes('act1_week19_informant_network')) {
      pool.push({
        id: 'act1_week19_informant_network',
        title: 'The Informant Network',
        description: 'The Commissioner has requested an urgent meeting. They bypassed the Interior Ministry to reach you directly.',
        category: 'crisis' as AgendaCategory,
        sceneId: 'act1_week19_informant_network',
        slotCost: 1,
        executionOrder: 2,
        weekAvailable: 19,
        weekDeadline: 20,
      })
    }

    // Week 20 — Oil negotiation (fires once)
    if (gameState.currentWeek === 20 && !visitedSceneIds.includes('act2_week20_oil_negotiation')) {
      pool.push({
        id: 'act2_week20_oil_negotiation',
        title: 'The Tyvaren Shadow',
        description: 'Tyvaren\'s formal offer has landed. Time to decide.',
        category: 'crisis' as AgendaCategory,
        sceneId: 'act2_week20_oil_negotiation',
        slotCost: 0,
        executionOrder: 1,
        weekAvailable: 20,
        weekDeadline: 20,
      })
    }

    // Week 21 — Megaproject decision (fires once)
    if (gameState.currentWeek === 20 && !visitedSceneIds.includes('act2_week20_megaproject_choice')) {
      pool.push({
        id: 'act2_week20_megaproject_choice',
        title: 'The Megaproject Dilemma',
        description: 'Minister Varro is ready to present the three infrastructure proposals. One budget. One decision.',
        category: 'crisis' as AgendaCategory,
        sceneId: 'act2_week20_megaproject_choice',
        slotCost: 0,
        executionOrder: 1,
        weekAvailable: 21,
        weekDeadline: 21,
      })
    }

    // Week 22 — Oil outcome (fires once)
    if (gameState.currentWeek === 22 && !visitedSceneIds.includes('act2_week22_oil_outcome')) {
      pool.push({
        id: 'act2_week22_oil_outcome',
        title: 'The Price of Black Gold',
        description: 'The Foreign Minister\'s telegram arrived at six in the morning.',
        category: 'crisis' as AgendaCategory,
        sceneId: 'act2_week22_oil_outcome',
        slotCost: 0,
        executionOrder: 1,
        weekAvailable: 22,
        weekDeadline: 22,
      })
    }

    // Week 1 — Inaugural ball (fires once)
    if (gameState.currentWeek === 1 && !visitedSceneIds.includes('social_inaugural_ball_wk1')) {
      pool.push({
        id: 'social_inaugural_ball_wk1',
        title: 'The Inaugural Ball',
        description: 'The Republic celebrates. You must be present.',
        category: 'social' as AgendaCategory,
        sceneId: 'social_inaugural_ball_wk1',
        slotCost: 0,
        executionOrder: 5,
        weekAvailable: 1,
        weekDeadline: 1,
      })
    }

    // Week 3 — Mole investigation choice (fires once)
    if (gameState.currentWeek === 3 && !visitedSceneIds.includes('mole_week3_choice')) {
      pool.push({
        id: 'mole_week3_choice',
        title: 'The Investigation Question',
        description: 'Danika needs a decision on how far to take this.',
        category: 'crisis' as AgendaCategory,
        sceneId: 'mole_week3_choice',
        slotCost: 0,
        executionOrder: 1,
        weekAvailable: 3,
        weekDeadline: 4,
      })
    }

    // Week 5 — Mole complication (fires once)
    if (gameState.currentWeek === 5 && !visitedSceneIds.includes('mole_week5_complication')) {
      pool.push({
        id: 'mole_week5_complication',
        title: 'The Investigation Complicates',
        description: 'Something unexpected has emerged in the mole investigation.',
        category: 'crisis' as AgendaCategory,
        sceneId: 'mole_week5_complication',
        slotCost: 0,
        executionOrder: 1,
        weekAvailable: 5,
        weekDeadline: 6,
      })
    }

    // Week 13 — Hawk arc induction (fires once)
    if (gameState.currentWeek === 13 && !visitedSceneIds.includes('act1_shadow_hawk_induction')) {
      pool.push({
        id: 'act1_shadow_hawk_induction',
        title: 'The Man in the Greenhouse',
        description: 'A note, slipped under the study door. Three words: The greenhouse. Now.',
        category: 'personal' as AgendaCategory,
        sceneId: 'act1_shadow_hawk_induction',
        slotCost: 0,
        executionOrder: 1,
        weekAvailable: 13,
        weekDeadline: 13,
      })
    }

    // Week 16 — Hawk arc first operation (fires once)
    if (gameState.currentWeek === 16 && !visitedSceneIds.includes('act1_shadow_hawk_first_operation')) {
      pool.push({
        id: 'act1_shadow_hawk_first_operation',
        title: 'The First Account',
        description: 'Service corridor. Tonight.',
        category: 'personal' as AgendaCategory,
        sceneId: 'act1_shadow_hawk_first_operation',
        slotCost: 0,
        executionOrder: 1,
        weekAvailable: 16,
        weekDeadline: 16,
      })
    }

    // Week 22 — Hawk arc Voss connection (fires once)
    if (gameState.currentWeek === 22 && !visitedSceneIds.includes('act2_shadow_hawk_voss_connection')) {
      pool.push({
        id: 'act2_shadow_hawk_voss_connection',
        title: 'The Same Cell',
        description: 'The Arcturian intelligence cell watching Dr. Voss — it is the same cell that ran Yelena Dorova.',
        category: 'crisis' as AgendaCategory,
        sceneId: 'act2_shadow_hawk_voss_connection',
        slotCost: 0,
        executionOrder: 2,
        weekAvailable: 22,
        weekDeadline: 22,
      })
    }

    // Week 22 — Protest or Riot (fires once)
    if (gameState.currentWeek === 22 && !visitedSceneIds.includes('act2_week22_protest_or_riot')) {
      pool.push({
        id: 'act2_week22_protest_or_riot',
        title: 'Protest or Riot',
        description: 'Twelve thousand in Republic Square. A counter-demonstration has appeared. The Commissioner is requesting guidance.',
        category: 'crisis' as AgendaCategory,
        sceneId: 'act2_week22_protest_or_riot',
        slotCost: 0,
        executionOrder: 3,
        weekAvailable: 22,
        weekDeadline: 23,
      })
    }

    // Week 24 — Voss introduction (fires once)
    if (gameState.currentWeek === 24 && !visitedSceneIds.includes('act2_week24_voss_introduction')) {
      pool.push({
        id: 'act2_week24_voss_introduction',
        title: 'The Man With Chalk on His Sleeve',
        description: 'Dr. Emilian Voss has been requesting a government meeting for six weeks.',
        category: 'meeting' as AgendaCategory,
        sceneId: 'act2_week24_voss_introduction',
        slotCost: 0,
        executionOrder: 1,
        weekAvailable: 24,
        weekDeadline: 24,
      })
    }

    // Week 28 — Hawk arc Morvec option (fires once)
    if (gameState.currentWeek === 28 && !visitedSceneIds.includes('act2_shadow_hawk_morvec_option')) {
      pool.push({
        id: 'act2_shadow_hawk_morvec_option',
        title: 'The Second Envelope',
        description: 'One word this time: Greenhouse.',
        category: 'personal' as AgendaCategory,
        sceneId: 'act2_shadow_hawk_morvec_option',
        slotCost: 0,
        executionOrder: 1,
        weekAvailable: 28,
        weekDeadline: 28,
      })
    }

    // Week 32 — Voss outcome (fires once)
    if (gameState.currentWeek === 32 && !visitedSceneIds.includes('act2_week32_voss_outcome')) {
      pool.push({
        id: 'act2_week32_voss_outcome',
        title: 'The Price of the Engine',
        description: 'The engine is complete. Vyktor confirmed it this morning.',
        category: 'meeting' as AgendaCategory,
        sceneId: 'act2_week32_voss_outcome',
        slotCost: 0,
        executionOrder: 2,
        weekAvailable: 32,
        weekDeadline: 32,
      })
    }

    // Week 35 — Hawk arc exposure crisis (fires once)
    if (gameState.currentWeek === 35 && !visitedSceneIds.includes('act3_shadow_hawk_exposure_crisis')) {
      pool.push({
        id: 'act3_shadow_hawk_exposure_crisis',
        title: 'The Pattern',
        description: 'Danika has been building a list for fourteen months without saying a word.',
        category: 'crisis' as AgendaCategory,
        sceneId: 'act3_shadow_hawk_exposure_crisis',
        slotCost: 0,
        executionOrder: 1,
        weekAvailable: 35,
        weekDeadline: 35,
      })
    }

    // Week 28 — Voss crisis (fires once)
    if (gameState.currentWeek === 28 && !visitedSceneIds.includes('act2_week28_voss_crisis')) {
      pool.push({
        id: 'act2_week28_voss_crisis',
        title: 'The Knock at the Door',
        description: 'Vyktor\'s message arrived at six in the morning. Voss is here. He came himself.',
        category: 'crisis' as AgendaCategory,
        sceneId: 'act2_week28_voss_crisis',
        slotCost: 0,
        executionOrder: 1,
        weekAvailable: 28,
        weekDeadline: 28,
      })
    }

    // Week 32 — Morvec confrontation (fires once)
    if (gameState.currentWeek === 32 && !visitedSceneIds.includes('act3_week32_morvec_confrontation')) {
      pool.push({
        id: 'act3_week32_morvec_confrontation',
        title: 'The Morvec Confrontation',
        description: 'Stefan Morvec has demanded a private meeting. This cannot be deferred.',
        category: 'crisis' as AgendaCategory,
        sceneId: 'act3_week32_morvec_confrontation',
        slotCost: 0,
        executionOrder: 1,
        weekAvailable: 32,
        weekDeadline: 32,
      })
    }

    // Week 44 — The Loyal Force (police loyalty check)
    if (gameState.currentWeek === 44 && !visitedSceneIds.includes('act3_week44_loyal_force')) {
      pool.push({
        id: 'act3_week44_loyal_force',
        title: 'The Loyal Force',
        description: 'The Commissioner has requested a meeting without stating a reason. In thirty-seven weeks, they have always stated a reason.',
        category: 'meeting' as AgendaCategory,
        sceneId: 'act3_week44_loyal_force',
        slotCost: 1,
        executionOrder: 2,
        weekAvailable: 44,
        weekDeadline: 45,
      })
    }

    // Add radio broadcast agenda item if player has broadcasts remaining
    if (gameState.radioBroadcastsUsed < MAX_BROADCASTS && gameState.currentWeek > 3) {
      pool.push({
        id: '__radio_address__',
        title: `Address the Nation (${MAX_BROADCASTS - gameState.radioBroadcastsUsed} of ${MAX_BROADCASTS} remaining)`,
        description: 'Deliver a national radio address. Each broadcast has diminishing effectiveness. Choose your message and your moment carefully.',
        category: 'cabinet',
        sceneId: '__radio__',
        slotCost: 0,
        executionOrder: 999,
        weekAvailable: gameState.currentWeek,
      })
    }

    // Trigger diplomatic letters for the current week
    const letterStore = useLetterStore.getState()
    const dueLetters = letterStore.letters.filter(l => l.weekTriggered === gameState.currentWeek)
    for (const letter of dueLetters) {
      if (!letterStore.readIds.has(letter.id)) {
        letterStore.triggerLetter(letter.id)
        // Close immediately so the notification shows in briefing
        // The player opens it via sidebar or notification
        letterStore.setOpen(false)
      }
    }

    // Cabinet — generate minister requests for the week
    const cabinetStore = useCabinetStore.getState()
    let showMeeting = false
    if (cabinetStore.formation_complete) {
      const newRequests = generateWeeklyRequests(
        gameState.currentWeek,
        cabinetStore.ministers,
        activeFlags
      )
      if (newRequests.length > 0) {
        newRequests.forEach(req => cabinetStore.addRequest(req))
        showMeeting = true
      }
    }

    // Decrees — filter eligible decrees for the current week
    useDecreeStore.getState().initDecrees(gameState.currentWeek, gameState, activeFlags)

    // Week 40 — The Border Ultimatum (Ticking Clock)
    if (gameState.currentWeek === 40 && !visitedSceneIds.includes('act3_week40_border_ultimatum')) {
      pool.push({
        id: 'act3_week40_border_ultimatum',
        title: 'The Border Ultimatum',
        description: '03:00 AM. Marshal Vukov has moved three armored divisions to the Gravenmark Pass. You have four hours.',
        category: 'crisis' as AgendaCategory,
        sceneId: 'act3_week40_border_ultimatum',
        slotCost: 2,
        executionOrder: -5,
        weekAvailable: 40,
        weekDeadline: 40,
        isUrgent: true
      })
    }

    // Week 36-40 — The Rival's Shadow (Minister Poaching)
    if (gameState.currentWeek >= 36 && gameState.currentWeek <= 40 && !visitedSceneIds.includes('act3_rival_poaching') && gameState.advisorTrust.dusek < 25) {
      pool.push({
        id: 'act3_rival_poaching',
        title: "The Rival's Shadow",
        description: 'Vyktor has evidence that Kolvar is meeting with Dusek. Her loyalty is in question.',
        category: 'crisis' as AgendaCategory,
        sceneId: 'act3_rival_poaching',
        slotCost: 1,
        executionOrder: 0,
        weekAvailable: 36,
        weekDeadline: 40,
        isUrgent: true
      })
    }

    // Stress Level 80+ — The Long Night (Nightmare Sequence)
    if (gameState.currentWeek >= 30 && !visitedSceneIds.includes('act3_nightmare_sequence') && gameState.personal.stressLevel >= 80) {
      pool.push({
        id: 'act3_nightmare_sequence',
        title: 'The Long Night',
        description: 'You wake on the floor of your study. The stress is breaking you. You cannot go on like this.',
        category: 'personal' as AgendaCategory,
        sceneId: 'act3_nightmare_sequence',
        slotCost: 1,
        executionOrder: -4,
        weekAvailable: gameState.currentWeek,
        weekDeadline: gameState.currentWeek + 1,
        isUrgent: true
      })
    }

    // Week 50 — The Two Letters (Oligarch Reckoning before Election)
    if (gameState.currentWeek === 50 && !visitedSceneIds.includes('act4_week50_two_letters')) {
      pool.push({
        id: 'act4_week50_two_letters',
        title: 'The Two Letters',
        description: 'Two couriers arrived this morning. Morvec and Vael are calling in their markers. The election is in two weeks.',
        category: 'crisis' as AgendaCategory,
        sceneId: 'act4_week50_two_letters',
        slotCost: 1,
        executionOrder: -5,
        weekAvailable: 50,
        weekDeadline: 51,
        isUrgent: true
      })
    }

    // Monthly Citizens' Petitions (Every 4 weeks)
    if (gameState.currentWeek > 0 && gameState.currentWeek % 4 === 0 && !visitedSceneIds.includes(`citizen_petitions_${gameState.currentWeek}`)) {
      pool.push({
        id: `citizen_petitions_${gameState.currentWeek}`,
        title: "The Citizens' Mailbag",
        description: 'The monthly cabinet meeting. Thousands of petitions have arrived. Choose one to address.',
        category: 'cabinet' as AgendaCategory,
        sceneId: 'act_citizen_petitions',
        slotCost: 1,
        executionOrder: 0,
        weekAvailable: gameState.currentWeek,
        weekDeadline: gameState.currentWeek + 1,
        isUrgent: false
      })
    }

    // Monthly Press Conference (Every 4 weeks, offset by 2)
    if (gameState.currentWeek > 4 && (gameState.currentWeek - 2) % 4 === 0 && !visitedSceneIds.includes(`press_conference_${gameState.currentWeek}`)) {
      pool.push({
        id: `press_conference_${gameState.currentWeek}`,
        title: "Monthly Press Conference",
        description: 'The press corps is waiting. Step up to the podium and set the tone for the month.',
        category: 'cabinet' as AgendaCategory,
        sceneId: 'act_monthly_press_conference',
        slotCost: 1,
        executionOrder: 0,
        weekAvailable: gameState.currentWeek,
        weekDeadline: gameState.currentWeek + 1,
        isUrgent: false
      })
    }

    // Campaign Trail (Election Seasons: Weeks 45-51 and 97-103)
    if (((gameState.currentWeek >= 45 && gameState.currentWeek <= 51) || (gameState.currentWeek >= 97 && gameState.currentWeek <= 103)) && !visitedSceneIds.includes(`campaign_rally_${gameState.currentWeek}`)) {
      pool.push({
        id: `campaign_rally_${gameState.currentWeek}`,
        title: "The Campaign Trail",
        description: 'The election is approaching. Kolvar is campaigning. You need to be on the road.',
        category: 'cabinet' as AgendaCategory,
        sceneId: 'act_campaign_rally',
        slotCost: 1,
        executionOrder: 0,
        weekAvailable: gameState.currentWeek,
        weekDeadline: gameState.currentWeek + 1,
        isUrgent: false
      })
    }

    // Sort pool by executionOrder so downstream readers (e.g. MapInteractionLayer)
    // always see items in canonical sequence. Items missing executionOrder
    // sink to the end (coerced to 99).
    pool.sort((a, b) =>
      (a.executionOrder ?? 999) -
      (b.executionOrder ?? 999)
    )

    // Note: forcedChainIds is NOT reset here — it is set by completeWeek before initWeek runs.
    // On first load (GameLayout mount), forcedChainIds stays [] from initial state.
    set({
      phase:        showMeeting ? 'scene' : 'briefing',
      agendaPool:   pool,
      selectedIds:  [],
      slotsUsed:    0,
      sceneQueue:   [],
      currentQueueIndex: 0,
      pendingMidpointProjectId: null,
      showTermReport: false,
      voteConfig: null,
      voteResult: null,
      transitionLabel: '',
      transitionWeek: null,
      showCabinetMeeting: showMeeting,
    })
  },

  endBriefing: () => {
    const gameState = useGameStore.getState()
    if (gameState.currentWeek === 1) {
      set({ phase: 'map' })
    } else {
      set({ phase: 'press' })
    }
  },

  endPress: () => {
    const gameState = useGameStore.getState()
    const { activeFlags } = useNarrativeStore.getState()
    const { bills, history } = useBillStore.getState()

    // Parliament sitting check BEFORE legislation — passed bills route to
    // legislation afterward via GameLayout.handleParliamentComplete.
    const shouldFireParliament = shouldTriggerParliament(
      gameState.currentWeek,
      gameState.lastParliamentWeek,
      gameState.emergencyParliamentFlag,
    )

    if (shouldFireParliament) {
      const blocStrengths = {
        conservative: gameState.nation.assemblyConservative,
        hardliner: gameState.nation.assemblyHardliner,
        reformist: gameState.nation.assemblyReformist,
      }
      const results = useParliamentStore.getState().prepareSitting(
        gameState.currentWeek,
        blocStrengths,
      )
      if (results.length > 0) {
        set({ phase: 'parliament' })
        return
      }
      // No eligible bill content this cycle — fall through to the
      // existing legislation/map check below, do NOT set phase:
      // 'parliament' with zero results (softlock guard)
    }

    const pendingBills = bills.filter(b => {
      if (b.weekPresented !== gameState.currentWeek) return false
      if (history.some(h => h.billId === b.id)) return false
      if (b.prerequisites?.length) {
        if (!evaluateAll(b.prerequisites, gameState, activeFlags)) return false
      }
      return true
    })

    if (pendingBills.length > 0) {
      set({ phase: 'legislation' })
    } else {
      set({ phase: 'map' })
    }
  },

  endLegislation: () => set({ phase: 'map' }),

  toggleAgendaItem: (id) => {
    const { agendaPool, selectedIds, slotsUsed } = get()
    const item = agendaPool.find(a => a.id === id)
    if (!item) return

    const isSelected = selectedIds.includes(id)
    if (isSelected) {
      set({
        selectedIds: selectedIds.filter(s => s !== id),
        slotsUsed:   slotsUsed - item.slotCost,
      })
    } else {
      if (slotsUsed + item.slotCost > SLOT_MAX) return   // would exceed budget
      set({
        selectedIds: [...selectedIds, id],
        slotsUsed:   slotsUsed + item.slotCost,
      })
    }
  },

  confirmAgenda: () => {
    const { agendaPool, selectedIds, forcedChainIds } = get()
    const gameState = useGameStore.getState()

    // Synthesize AgendaItems for chain-forced scenes (run before player selections)
    const rawChainItems: AgendaItem[] = forcedChainIds
      .map((sceneId, i): AgendaItem | null => {
        const scene = getScene(sceneId)
        if (!scene) {
          console.warn(`[weekStore] Chain target "${sceneId}" not found — skipping`)
          return null
        }
        return {
          id: `__chain__${sceneId}`,
          title: scene.title,
          description: 'A consequence of a past decision.',
          category: 'crisis' as AgendaCategory,
          sceneId,
          slotCost: 0,
          executionOrder: -(forcedChainIds.length - i),  // negative → before player items
          weekAvailable: gameState.currentWeek,
          isUrgent: true,
        }
      })
      .filter((x): x is AgendaItem => x !== null)

    // Augment chain items: inject lobbying votes before/after special scenes
    const chainItems: AgendaItem[] = []
    for (const item of rawChainItems) {
      if (item.sceneId === 'act3_confidence_vote') {
        // Strategy narrative first, then the Assembly division, then conditional aftermath
        chainItems.push(item)
        const base = item.executionOrder
        chainItems.push(makeNoConfidenceVoteItem(base + 1, gameState.currentWeek))
        chainItems.push(makeNoConfidenceSurvivedItem(base + 2, gameState.currentWeek))
        chainItems.push(makeNoConfidenceFallenItem(base + 3, gameState.currentWeek))
      } else if (item.sceneId === 'act4_impeachment_proceedings') {
        // Vote comes first, then the response narrative (conditional on outcome)
        const base = item.executionOrder
        chainItems.push(makeImpeachmentVoteItem(base - 1, gameState.currentWeek))
        chainItems.push({
          ...item,
          prerequisites: [{ stat: 'flags.impeachment_vote_passed', operator: '==' as const, value: true }],
        })
        chainItems.push(makeImpeachmentVindicatedItem(base + 1, gameState.currentWeek))
      } else {
        chainItems.push(item)
      }
    }

    // Player-selected items
    const playerItems = selectedIds
      .map(id => agendaPool.find(a => a.id === id))
      .filter((item): item is AgendaItem => item != null)
      .sort((a, b) => a.executionOrder - b.executionOrder)

    const sorted = [...chainItems, ...playerItems]
      .sort((a, b) => a.executionOrder - b.executionOrder)
    if (sorted.length === 0) {
      console.warn('[confirmAgenda] No items in queue — transitioning to review')
      set({ phase: 'review' })
      return
    }

    if (import.meta.env.DEV) console.log('[confirmAgenda] Queue:', sorted.map((s, i) => `[${i}] ${s.id} (${s.sceneId})`).join(', '))

    // Snapshot stats before any scene runs (used by EveningReview for deltas)
    const snapshot = { ...gameState }
    const first = sorted[0]
    const base = { sceneQueue: sorted, currentQueueIndex: 0, weekStartSnapshot: snapshot, transitionLabel: '', transitionWeek: null }

    if (first.sceneId === '__budget__') {
      set({ ...base, phase: 'budget' })
    } else if (first.sceneId === '__cabinet_reshuffle__') {
      set({ ...base, phase: 'scene', showCabinetFormation: true, reshuffleMinistry: undefined, reshuffleMode: true })
    } else if (first.sceneId === '__constitution__') {
      set({ ...base, phase: 'constitution' })
    } else if (first.sceneId === '__radio__') {
      set({ ...base, phase: 'scene', radioOpen: true })
    } else if (first.sceneId === '__vote__') {
      const voteConfig = first.voteConfig ?? null
      set({ ...base, phase: voteConfig?.lobbyingEnabled !== false ? 'lobbying' : 'vote_result', voteConfig })
    } else if (first.sceneId?.startsWith('__project__')) {
      useNarrativeStore.getState().loadScene(first.sceneId)
      set({ ...base, phase: 'scene' })
    } else if (first.sceneId?.startsWith('act1_week2_cabinet')) {
      set({ ...base, phase: 'scene', showCabinetFormation: true })
    } else {
      if (import.meta.env.DEV) console.log('[confirmAgenda] Loading scene:', first.sceneId, 'from item:', first.id, 'title:', first.title)
      useNarrativeStore.getState().loadScene(first.sceneId)
      set({ ...base, phase: 'scene' })
    }
  },

  advanceQueue: async () => {
    const { currentQueueIndex, transitionLabel, sceneQueue } = get()
    if (import.meta.env.DEV) console.log('[TRACE 1] advanceQueue called. Queue length:', sceneQueue.length, 'next index:', currentQueueIndex + 1, 'transitionLabel:', transitionLabel)
    // Guard against double-tap during transition
    if (transitionLabel) return

    const next = currentQueueIndex + 1

    useNarrativeStore.getState().resetScene()
    // Scene-to-scene fade transition (500ms)
    set({ transitionLabel: 'scene' })
    trackedTimeout(async () => {
      try {
        const { sceneQueue: q } = get()
        if (next < q.length) {
          const item = q[next]

          // Skip items whose prerequisites are not met (e.g. conditional aftermath scenes)
          const { activeFlags } = useNarrativeStore.getState()
          const gameState = useGameStore.getState()
          if (item.prerequisites?.length && !evaluateAll(item.prerequisites, gameState, activeFlags)) {
            set({ currentQueueIndex: next, transitionLabel: '' })
            get().advanceQueue()
            return
          }

          set({ currentQueueIndex: next, transitionLabel: '' })
          if (import.meta.env.DEV) console.log('[advanceQueue] Loading scene:', item.sceneId, '| queue index:', next, 'of', q.length, '|', item.title)
          if (item.sceneId === '__budget__') {
            set({ phase: 'budget', transitionLabel: '' })
          } else if (item.sceneId === '__cabinet_reshuffle__') {
            set({ phase: 'scene', showCabinetFormation: true, reshuffleMinistry: undefined, reshuffleMode: true, transitionLabel: '' })
          } else if (item.sceneId === '__constitution__') {
            set({ phase: 'constitution', transitionLabel: '' })
          } else if (item.sceneId === '__radio__') {
            set({ phase: 'scene', transitionLabel: '', radioOpen: true })
          } else if (item.sceneId === '__vote__') {
            const voteConfig = item.voteConfig ?? null
            set({ phase: voteConfig?.lobbyingEnabled !== false ? 'lobbying' : 'vote_result', voteConfig })
          } else if (item.sceneId.startsWith('act1_week2_cabinet')) {
            set({ phase: 'scene', showCabinetFormation: true, transitionLabel: '' })
          } else {
            if (import.meta.env.DEV) console.log('[TRACE 2] Next scene determined:', item.sceneId, '| Loading via loadScene...')
            useNarrativeStore.getState().loadScene(item.sceneId)
            set({ phase: 'scene' })
          }
        } else {
          if (import.meta.env.DEV) console.log('[TRACE 2] Queue exhausted — transitioning. Queue was:', q.map((s, i) => `[${i}] ${s.id}`).join(', '), '| last index:', next - 1)
          const { returnToMap } = get()
          if (returnToMap) {
            const completedItem = q[q.length - 1]
            // News reactions must fire for every scene completed this run,
            // regardless of its position in the queue (the last item is not
            // necessarily the scene the reaction belongs to).
            const completedSceneIds = new Set(q.map(item => item.sceneId))

            // Inject inauguration news after oath completes
            if (completedSceneIds.has('act1_week1_inauguration')) {
              const d = new Date(1963, 2, 15) // March 15 1963
              const dateStr = d.toLocaleDateString('en-US', {
                day: 'numeric', month: 'long', year: 'numeric'
              })
              useNewsStore.getState().addArticles([
                {
                  id: `news_inauguration_herald_${Date.now()}`,
                  headline: 'ASHAVEL SWORN IN AS CHANCELLOR',
                  body: 'Katerin Ashavel was sworn in as Chancellor before sixty thousand people in Republic Square this morning. In her address to the nation she spoke of unity and accountability. Markets opened flat. The kroner held steady. Former Chancellor Halvek was not present and issued no statement.',
                  publication: 'ashenmere_herald' as const,
                  weekNumber: 1,
                  date: dateStr,
                  templateId: 'inauguration_herald',
                  category: 'governance' as const,
                },
                {
                  id: `news_inauguration_worker_${Date.now()}`,
                  headline: 'SHE CAME FROM US',
                  body: "Her father worked the foundries. Her mother took in mending to keep the lights on. Today their daughter took the oath in Republic Square. Workers across Kravenstal gathered around radio sets to hear the ceremony. When it was over nobody went back to work immediately. They just sat with it. Our demands remain: restore the pension freeze adjustments, reinstate collective bargaining rights stripped in 1957, invest in the northern infrastructure neglected for a decade. We wish Chancellor Ashavel well. We will be watching.",
                  publication: 'kravenstal_worker' as const,
                  weekNumber: 1,
                  date: dateStr,
                  templateId: 'inauguration_worker',
                  category: 'governance' as const,
                },
                {
                  id: `news_inauguration_gazette_${Date.now()}`,
                  headline: 'A NEW HAND ON THE WHEEL',
                  body: "The eastern provinces watched the inauguration with hope and familiar caution. Chancellor Ashavel's speech made no specific mention of the eastern provinces. This was noted. Across the border Morivask state media offered a brief neutral report — two paragraphs, no analysis. The Tyvaren Confederation's response was a single line: we acknowledge the change of government and expect continuity of existing agreements. The Gazette congratulates Chancellor Ashavel and reminds her that Veltria extends to the eastern coast.",
                  publication: 'thornfeld_gazette' as const,
                  weekNumber: 1,
                  date: dateStr,
                  templateId: 'inauguration_gazette',
                  category: 'governance' as const,
                },
                {
                  id: `news_inauguration_standard_${Date.now()}`,
                  headline: 'THE REPUBLIC SPEAKS',
                  body: "By a margin that surprised even her supporters, Katerin Ashavel has become the first Chancellor in Veltrian history whose family did not appear in the pre-war Registry of Notable Persons. She is the daughter of a foundry worker and a seamstress. She has a doctorate in constitutional law and sixteen years in elected office. Whether that combination produces good governance or merely good symbolism remains to be seen. The People's Standard endorsed her candidacy. We do not regret it. We will hold her to everything she said today.",
                  publication: 'peoples_standard' as const,
                  weekNumber: 1,
                  date: dateStr,
                  templateId: 'inauguration_standard',
                  category: 'governance' as const,
                },
                {
                  id: `news_inauguration_times_${Date.now()}`,
                  headline: 'A CHANCELLOR FOR A CHANGED REPUBLIC',
                  body: 'The Veltrian Times congratulates Chancellor Ashavel on her historic inauguration. The ceremony was conducted with dignity. The speech was measured and thoughtful. The transition of power was peaceful — something that cannot be taken for granted in this region or this era. We note that the new government inherits a structural deficit, a fragile coalition, and neighbors who are watching closely. The Chancellor is aware of these realities. She demonstrated as much today. The Times will report on what follows without favor and without prejudice.',
                  publication: 'veltrian_times' as const,
                  weekNumber: 1,
                  date: dateStr,
                  templateId: 'inauguration_times',
                  category: 'governance' as const,
                },
              ])
            }

            if (completedSceneIds.has('act1_week1_address_nation')) {
              const d = new Date(1963, 2, 15)
              const dateStr = d.toLocaleDateString('en-US', {
                day: 'numeric', month: 'long', year: 'numeric'
              })
              const flags = useNarrativeStore.getState().activeFlags

              // Determine which speech was given
              const speechType = flags.includes('address_unity_chosen')
                ? 'unity'
                : flags.includes('address_reform_chosen')
                  ? 'reform'
                  : flags.includes('address_strength_chosen')
                    ? 'strength'
                    : 'unity'

              const headlines: Record<string, {
                herald: string, standard: string,
                worker: string, times: string, gazette: string,
                heraldBody: string, standardBody: string,
                workerBody: string, timesBody: string, gazetteBody: string
              }> = {
                unity: {
                  herald: 'CHANCELLOR CALLS FOR NATIONAL UNITY',
                  heraldBody: 'Katerin Ashavel was sworn in as Chancellor before sixty thousand people in Republic Square this morning. In her address to the nation she spoke of unity and accountability. Markets opened flat. The kroner held steady. Former Chancellor Halvek was not present and issued no statement.',
                  standard: 'A VOICE FOR ALL OF US',
                  standardBody: 'By a margin that surprised even her supporters, Katerin Ashavel has become the first Chancellor in Veltrian history whose family did not appear in the pre-war Registry of Notable Persons. She is the daughter of a foundry worker and a seamstress. She has a doctorate in constitutional law and sixteen years in elected office. Whether that combination produces good governance or merely good symbolism remains to be seen. The People\'s Standard endorsed her candidacy. We do not regret it. We will hold her to everything she said today.',
                  worker: 'UNITY IS NOT ENOUGH',
                  workerBody: 'Her father worked the foundries. Her mother took in mending to keep the lights on. Today their daughter took the oath in Republic Square. Workers across Kravenstal gathered around radio sets to hear the ceremony. When it was over nobody went back to work immediately. They just sat with it. Our demands remain: restore the pension freeze adjustments, reinstate collective bargaining rights stripped in 1957, invest in the northern infrastructure neglected for a decade. We wish Chancellor Ashavel well. We will be watching.',
                  times: 'THE CHANCELLOR CHOOSES CONCILIATION',
                  timesBody: 'Chancellor Ashavel\'s inaugural address was notable less for what it promised than for what it did not promise. No specific timelines. No named targets. No figures attached to reform commitments. The Veltrian Times notes this as either admirable caution or studied vagueness. The new government has goodwill. It has, by our estimate, approximately six weeks before that goodwill requires evidence.',
                  gazette: 'ASHENMERE SPEAKS OF UNITY. THE EAST LISTENS.',
                  gazetteBody: 'The eastern provinces watched the inauguration with hope and familiar caution. Chancellor Ashavel\'s speech made no specific mention of the eastern provinces. This was noted. Across the border Morivask state media offered a brief neutral report — two paragraphs, no analysis. The Tyvaren Confederation\'s response was a single line: we acknowledge the change of government and expect continuity of existing agreements. The Gazette congratulates Chancellor Ashavel and reminds her that Veltria extends to the eastern coast.',
                },
                reform: {
                  herald: 'CHANCELLOR NAMES THE PENSION FREEZE IN FIRST ADDRESS',
                  heraldBody: 'In a striking departure from inaugural convention, Chancellor Ashavel named the pension freeze of 1959 directly in her first national address — promising reversal within thirty days. She also committed to opening the BNI files to an independent commission. The Finance Ministry had no comment. Markets fell two points in the first hour of trading before recovering.',
                  standard: 'SHE SAID IT. OUT LOUD. ON THE RADIO.',
                  standardBody: 'The pension freeze. The stolen contracts. The judicial appointments handed to party loyalists. She named them. Not metaphorically. By name. In her first hour as Chancellor. The People\'s Standard has been writing about this for four years. Today the Chancellor of the Republic said it into a microphone and the whole country heard it. This is what courage sounds like.',
                  worker: 'THIRTY DAYS. WE ARE COUNTING.',
                  workerBody: 'She gave us a timeline. Thirty days to open the BNI files. Thirty days to begin pension restoration. Workers across Kravenstal have set their calendars. We will be here on day thirty-one. We will remember every word she said today. We wish her the strength to keep them.',
                  times: 'A CHANCELLOR WHO NAMES NAMES',
                  timesBody: 'Chancellor Ashavel\'s first address was the most substantive inaugural speech delivered from this podium in a generation. Whether the commitments made today — pension restoration, BNI review, contract accountability — can be delivered within the stated timelines is a question the Times will track carefully. The Finance Ministry\'s silence speaks volumes. The Assembly\'s reaction tomorrow will speak more.',
                  gazette: 'REFORM REACHES THE RADIO',
                  gazetteBody: 'The Chancellor\'s address was heard in every farmhouse and workshop in Thornfeld. The pension freeze affected fourteen thousand families in this province alone. They heard her name it today. The Gazette is cautious by nature. But we will say this: she did not speak like someone who intends to forget.',
                },
                strength: {
                  herald: 'CHANCELLOR SENDS SIGNAL TO TYVAREN IN FIRST ADDRESS',
                  heraldBody: 'Chancellor Ashavel used her first national address to send a direct message to Veltria\'s neighbors — without naming them. Sovereignty, she said, is not negotiable. Borders are not negotiable. Patience, she said, should not be mistaken for weakness. The Tyvaren Confederation\'s embassy filed a report within the hour. The Iron Covenant issued a statement of support. The Foreign Ministry issued nothing.',
                  standard: 'STRENGTH IS NOT ENOUGH WITHOUT JUSTICE',
                  standardBody: 'The Chancellor chose strength. We understand the instinct. We do not fully share it. A government that leads with its fist before it has fed its people is a government that has confused priorities. We note that the word pension was not spoken today. We note that the word worker was not spoken today. We will give the Chancellor time. We are not yet convinced she knows where Kravenstal is.',
                  worker: 'SHE IS NOT AFRAID. NEITHER ARE WE.',
                  workerBody: 'She is not afraid. Neither are we. But fear of Tyvaren is not what fills the gap in a pension check. Courage at the border does not rehire the men laid off at the Sevagrad foundry. We heard the speech. We will wait to see the budget. Then we will know what kind of Chancellor she intends to be.',
                  times: 'A CHANCELLOR WHO SPEAKS TO NEIGHBORS AS MUCH AS CITIZENS',
                  timesBody: 'A Chancellor who addresses her neighbors in her first speech is a Chancellor who has decided what kind of government this will be before the government has properly begun. The Veltrian Times neither endorses nor condemns this choice. We note that it is a choice with consequences — some of which will arrive before the end of this term.',
                  gazette: 'THORNFELD HEARD A DIFFERENT SPEECH THAN ASHENMERE',
                  gazetteBody: 'Thornfeld heard a different speech than Ashenmere. In the capital they heard a Chancellor. In the east they heard someone who knows we share a border with people who do not wish us well. The Gazette has been saying this for eleven years. We are glad someone in the Palace is finally listening. We will reserve full judgment for the moment she mentions the eastern road infrastructure.',
                },
              }

              const h = headlines[speechType]

              useNewsStore.getState().addArticles([
                {
                  id: `news_address_herald_${Date.now()}`,
                  headline: h.herald,
                  body: h.heraldBody,
                  publication: 'ashenmere_herald' as const,
                  weekNumber: 1,
                  date: dateStr,
                  templateId: 'address_herald',
                  category: 'governance' as const,
                },
                {
                  id: `news_address_standard_${Date.now()}`,
                  headline: h.standard,
                  body: h.standardBody,
                  publication: 'peoples_standard' as const,
                  weekNumber: 1,
                  date: dateStr,
                  templateId: 'address_standard',
                  category: 'governance' as const,
                },
                {
                  id: `news_address_worker_${Date.now()}`,
                  headline: h.worker,
                  body: h.workerBody,
                  publication: 'kravenstal_worker' as const,
                  weekNumber: 1,
                  date: dateStr,
                  templateId: 'address_worker',
                  category: 'governance' as const,
                },
                {
                  id: `news_address_times_${Date.now()}`,
                  headline: h.times,
                  body: h.timesBody,
                  publication: 'veltrian_times' as const,
                  weekNumber: 1,
                  date: dateStr,
                  templateId: 'address_times',
                  category: 'governance' as const,
                },
                {
                  id: `news_address_gazette_${Date.now()}`,
                  headline: h.gazette,
                  body: h.gazetteBody,
                  publication: 'thornfeld_gazette' as const,
                  weekNumber: 1,
                  date: dateStr,
                  templateId: 'address_gazette',
                  category: 'governance' as const,
                },
              ])
            }

            if (completedSceneIds.has('act1_week7_commissioner')) {
              const d = new Date(1963, 2, 29)
              const dateStr = d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
              const flags = useNarrativeStore.getState().activeFlags
              const commType = flags.includes('commissioner_vasic_appointed') ? 'vasic'
                : flags.includes('commissioner_solc_appointed') ? 'solc'
                : 'stanko'
              const headlines = {
                vasic: {
                  herald: 'CHANCELLOR DISMISSES COMMISSIONER, APPOINTS REFORM CANDIDATE',
                  heraldBody: 'Chancellor Ashavel has dismissed the National Police Commissioner following the Kravenstal incident and appointed Commandant Rena Vasić as his replacement. Vasić, known for the lowest use-of-force record in the country during her tenure in Thornfeld, has already requested full personnel files from the dispersal. The Chancellor called the appointment a signal that accountability in this government is not a statement — it is a process.',
                  standard: 'SHE FIRED HIM. AND REPLACED HIM WITH SOMEONE WHO WILL ACTUALLY INVESTIGATE.',
                  standardBody: 'The Commissioner is gone. Not resigned — dismissed. There is a difference and the Chancellor made sure everyone knew it. His replacement is Commandant Rena Vasić, who once testified against her own colleagues in a misconduct hearing. The People\'s Standard has been waiting for this kind of appointment for eleven years. We will hold Vasić to the same standard she has held others.',
                  worker: 'FOR TEODOR VRANIĆ',
                  workerBody: 'Teodor Vranić is recovering. The man who ordered the baton charge has been suspended. The Commissioner who knew and said nothing is dismissed. His replacement has already asked for the personnel files of every officer at the Kravenstal dispersal. The Kravenstal Worker does not celebrate government decisions — we evaluate them. This one, today, looks like accountability. We will watch to see if it stays that way.',
                  times: 'A COMMISSIONER DISMISSED, A PRECEDENT SET',
                  timesBody: 'The Chancellor\'s decision to formally dismiss rather than accept the resignation of the outgoing Commissioner is a studied choice. It asserts that accountability flows downward from the Chancellor\'s office — not upward from the resignations of those caught. Commandant Vasić\'s appointment reinforces this reading. The Times notes that institutional reform requires sustained pressure, not single appointments. We will track whether this precedent holds.',
                  gazette: 'THORNFELD\'S OWN VASIĆ APPOINTED NATIONAL COMMISSIONER',
                  gazetteBody: 'Rena Vasić ran the Thornfeld Regional Police for six years. During that time, use-of-force incidents dropped by sixty percent. She testified against fellow officers twice. The police association called her difficult. The communities she served called her fair. She is now the National Commissioner. The Gazette is proud that the appointment began here, in the east, in a region that has too often been told that standards are for other places.'
                },
                stanko: {
                  herald: 'COMMISSIONER REPLACED WITH DEPUTY IN STABILITY APPOINTMENT',
                  heraldBody: 'Deputy Commissioner Lev Stańko has been appointed National Police Commissioner following the resignation of his predecessor over the Kravenstal incident. The appointment maintains continuity in the force while a full accountability review proceeds. Chancellor Ashavel stated that the review will run to completion regardless of its findings.',
                  standard: 'STABILITY. WE HAVE HEARD THAT WORD BEFORE.',
                  standardBody: 'The Commissioner is gone. His deputy has his chair. The People\'s Standard is not satisfied. Stability is what the police force has had for twenty years — stability that protected officers who broke the law and punished workers who demanded their rights. We will watch the accountability review. If it closes before it is complete, we will say so.',
                  worker: 'THE DEPUTY TAKES THE CHAIR. WE TAKE NOTES.',
                  workerBody: 'Stańko was not at Kravenstal. That is the argument for his appointment. The Kravenstal Worker notes that the institution that produced the Kravenstal dispersal is still largely intact. We will watch the accountability review. We have set a calendar reminder for thirty days.',
                  times: 'A MEASURED APPOINTMENT IN AN UNMEASURED MOMENT',
                  timesBody: 'The appointment of Deputy Commissioner Stańko is the choice of institutional continuity over institutional reform. It may prove wise — the force needs stability to function. It may prove insufficient — the force needs accountability to regain public trust. The Times will evaluate this appointment by its outcomes, not its intentions.',
                  gazette: 'ACCOUNTABILITY REVIEW ORDERED — GAZETTE WILL TRACK IT',
                  gazetteBody: 'The Chancellor has ordered a full accountability review of the Kravenstal incident and replaced the Commissioner. The Gazette notes that review processes are only as meaningful as their outcomes. We will publish the results when they are available. We will notice if they are not.'
                },
                solc: {
                  herald: 'CIVILIAN APPOINTED NATIONAL POLICE COMMISSIONER IN UNPRECEDENTED MOVE',
                  heraldBody: 'Dr. Mirko Šolc, a civilian academic with no prior service in the national police force, has been appointed Commissioner by Chancellor Ashavel following the Kravenstal incident. The appointment is without precedent in Veltrian history. The police association has expressed serious concerns. Three senior commanders have requested urgent meetings with the Interior Ministry. Dr. Šolc has already requested five years of personnel files.',
                  standard: 'A CIVILIAN IN THE COMMISSIONER\'S CHAIR. YES.',
                  standardBody: 'The Chancellor has appointed a civilian to run the national police force. Dr. Mirko Šolc has never worn a uniform. He has spent fifteen years studying what police forces do wrong and what communities need them to do right. The People\'s Standard believes this is the most significant appointment this government has made. The force will resist him. That resistance will tell us everything about whether reform is possible.',
                  worker: 'THEY SENT AN ACADEMIC. WE SENT OUR VOTE.',
                  workerBody: 'Dr. Šolc has never made an arrest. He has never ordered a dispersal. He has spent his career documenting what happens when police forces become instruments of institutional power rather than community safety. The Kravenstal Worker has read his published framework. His first act was to request personnel files. We will watch what he does with them.',
                  times: 'THE BOLDEST APPOINTMENT OF THE ASHAVEL GOVERNMENT',
                  timesBody: 'The appointment of Dr. Šolc is either the most consequential reform decision this government will make or its most significant political miscalculation. The Times cannot yet determine which. What we can say is that the appointment signals a Chancellor willing to make enemies for the sake of a principle. Whether that principle survives contact with institutional resistance remains to be seen. We will watch very carefully.',
                  gazette: 'AN ACADEMIC RUNS THE POLICE. THE EAST WAITS TO BE CONVINCED.',
                  gazetteBody: 'The Gazette has read Dr. Šolc\'s published work on community policing. His frameworks have worked in Lythairan cities. Whether they work in Veltria — where the police force has spent two decades as a political tool — is a different question. The Gazette congratulates the Chancellor on the boldness of the appointment. We reserve judgment on its wisdom until we see what Dr. Šolc does on day thirty-one.'
                }
              }
              const h = headlines[commType]
              useNewsStore.getState().addArticles([
                {
                  id: `news_commissioner_herald_${Date.now()}`,
                  headline: h.herald,
                  body: h.heraldBody,
                  publication: 'ashenmere_herald' as const,
                  weekNumber: useGameStore.getState().currentWeek,
                  date: dateStr,
                  templateId: 'commissioner_herald',
                  category: 'governance' as const,
                },
                {
                  id: `news_commissioner_standard_${Date.now()}`,
                  headline: h.standard,
                  body: h.standardBody,
                  publication: 'peoples_standard' as const,
                  weekNumber: useGameStore.getState().currentWeek,
                  date: dateStr,
                  templateId: 'commissioner_standard',
                  category: 'governance' as const,
                },
                {
                  id: `news_commissioner_worker_${Date.now()}`,
                  headline: h.worker,
                  body: h.workerBody,
                  publication: 'kravenstal_worker' as const,
                  weekNumber: useGameStore.getState().currentWeek,
                  date: dateStr,
                  templateId: 'commissioner_worker',
                  category: 'governance' as const,
                },
                {
                  id: `news_commissioner_times_${Date.now()}`,
                  headline: h.times,
                  body: h.timesBody,
                  publication: 'veltrian_times' as const,
                  weekNumber: useGameStore.getState().currentWeek,
                  date: dateStr,
                  templateId: 'commissioner_times',
                  category: 'governance' as const,
                },
                {
                  id: `news_commissioner_gazette_${Date.now()}`,
                  headline: h.gazette,
                  body: h.gazetteBody,
                  publication: 'thornfeld_gazette' as const,
                  weekNumber: useGameStore.getState().currentWeek,
                  date: dateStr,
                  templateId: 'commissioner_gazette',
                  category: 'governance' as const,
                },
              ])
            }

            const { activeFlags, visitedSceneIds: vs } = useNarrativeStore.getState()
            const freshPool = buildPool(useGameStore.getState().currentWeek, useGameStore.getState(), activeFlags, vs)
            set({
              phase: 'map',
              transitionLabel: '',
              returnToMap: false,
              agendaPool: freshPool,
            })
            // Autosave after every completed scene
            try {
              await saveGame(AUTOSAVE_SLOT, 'AUTOSAVE')
              if (import.meta.env.DEV) console.log('[Autosave] Saved after scene:', completedItem.id)
            } catch (e) {
              console.warn('[Autosave] Failed:', e)
            }
          } else {
            set({ phase: 'review', transitionLabel: '' })
          }
        }
      } catch (e) {
        console.error('[advanceQueue] CRASHED — clearing transitionLabel to prevent black screen:', e)
        const { returnToMap: rtMap } = get()
        set({ transitionLabel: '', phase: rtMap ? 'map' : 'review' })
      }
    }, 500)
  },

  // Mid-week emergency interrupt — injects a chain-triggered scene into the
  // current week's queue directly after the currently-playing scene.
  injectScene: (sceneId, title) => {
    const { sceneQueue, currentQueueIndex } = get()
    // M4 cycle guard — never inject a scene the player has already
    // visited in this playthrough.
    const { visitedSceneIds } = useNarrativeStore.getState()
    if (visitedSceneIds.includes(sceneId)) {
      if (import.meta.env.DEV) {
        console.warn('[weekStore.injectScene] cycle guard blocked re-injection of', sceneId)
      }
      return
    }
    const gameState = useGameStore.getState()
    const item: AgendaItem = {
      id: `__emergency__${sceneId}`,
      title,
      description: 'Emergency — requires immediate attention.',
      category: 'crisis' as AgendaCategory,
      sceneId,
      slotCost: 0,
      executionOrder: 0,
      weekAvailable: gameState.currentWeek,
      isUrgent: true,
    }
    const newQueue = [...sceneQueue]
    newQueue.splice(currentQueueIndex + 1, 0, item)
    set({ sceneQueue: newQueue })
  },

  launchSingleScene: (item) => {
    console.log('[DEBUG] launchSingleScene called with:', item.sceneId)
    const snapshot = useGameStore.getState()

    // Special agenda items are not narrative scenes; they switch to dedicated
    // phases/UI just like advanceQueue and confirmAgenda do for queued items.
    if (item.sceneId === '__radio__') {
      set({
        phase: 'scene',
        sceneQueue: [item],
        currentQueueIndex: 0,
        weekStartSnapshot: snapshot,
        returnToMap: true,
        radioOpen: true,
      })
      console.log('[DEBUG] launchSingleScene: radio address started')
      return
    }

    if (item.sceneId === '__budget__') {
      set({
        phase: 'budget',
        sceneQueue: [item],
        currentQueueIndex: 0,
        weekStartSnapshot: snapshot,
        returnToMap: true,
      })
      return
    }

    if (item.sceneId === '__cabinet_reshuffle__') {
      set({
        phase: 'scene',
        sceneQueue: [item],
        currentQueueIndex: 0,
        weekStartSnapshot: snapshot,
        showCabinetFormation: true,
        reshuffleMinistry: undefined,
        reshuffleMode: true,
        returnToMap: true,
      })
      return
    }

    if (item.sceneId === '__constitution__') {
      set({
        phase: 'constitution',
        sceneQueue: [item],
        currentQueueIndex: 0,
        weekStartSnapshot: snapshot,
        returnToMap: true,
      })
      return
    }

    if (item.sceneId === '__vote__') {
      const voteConfig = item.voteConfig ?? null
      set({
        phase: voteConfig?.lobbyingEnabled !== false ? 'lobbying' : 'vote_result',
        sceneQueue: [item],
        currentQueueIndex: 0,
        weekStartSnapshot: snapshot,
        returnToMap: true,
        voteConfig,
      })
      return
    }

    if (item.sceneId?.startsWith('__project__')) {
      useNarrativeStore.getState().loadScene(item.sceneId)
      set({
        phase: 'scene',
        sceneQueue: [item],
        currentQueueIndex: 0,
        weekStartSnapshot: snapshot,
        returnToMap: true,
      })
      return
    }

    if (item.sceneId?.startsWith('act1_week2_cabinet')) {
      set({
        phase: 'scene',
        sceneQueue: [item],
        currentQueueIndex: 0,
        weekStartSnapshot: snapshot,
        returnToMap: true,
        showCabinetFormation: true,
      })
      return
    }

    const sceneNode = getScene(item.sceneId)
    if (!sceneNode) {
      console.warn('[launchSingleScene] Scene not found:', item.sceneId)
      return
    }
    useNarrativeStore.getState().loadScene(item.sceneId)
    console.log('[DEBUG] launchSingleScene: phase about to set to scene. currentScene:', useNarrativeStore.getState().currentScene?.id)
    set({
      phase: 'scene',
      sceneQueue: [item],
      currentQueueIndex: 0,
      weekStartSnapshot: snapshot,
      returnToMap: true,
    })
    console.log('[DEBUG] launchSingleScene: state set. phase:', useWeekStore.getState().phase, 'sceneQueue:', useWeekStore.getState().sceneQueue.map(s => s.sceneId))
  },

  resolveMidpoint: () => set({ pendingMidpointProjectId: null }),

  openTermReport: () => set({ showTermReport: true }),
  openLegacy: () => set({ showTermReport: false, showLegacy: true }),
  setRadioOpen: (open) => set({ radioOpen: open }),
  triggerCutscene: (panels) => set({ cutscenePanels: panels }),
  clearCutscene: () => set({ cutscenePanels: null }),
  dismissGate: () => set({ gateBlocked: false, gateMessage: null }),

  clearPendingTimeouts: () => clearAllTimeouts(),

  // Dev tool — jump directly to a week without running the completeWeek()
  // pipeline. Sets the week via gameStore.devSetWeek (which derives currentAct
  // with the same ternary advanceWeek uses), clears any active scene so the
  // player isn't mid-scene, then rebuilds the agenda pool via initWeek().
  devJumpToWeek: (targetWeek) => {
    const week = Math.max(1, Math.min(104, Math.round(targetWeek)))
    useGameStore.getState().devSetWeek(week)
    useNarrativeStore.getState().resetScene()
    // Dev-only: seed a minimal flag preset so late-week jumps don't produce
    // hollow narrative (missing branches/fallbacks). Must run before initWeek()
    // because pool-building reads activeFlags. Never runs in production.
    if (import.meta.env.DEV) {
      const seedFlags: string[] = []
      if (week >= 13) seedFlags.push('hawk_network_active')
      if (week >= 30) seedFlags.push('permanent_injury_sustained', 'assassination_survived')
      if (week >= 52) seedFlags.push('term_1_complete', 'election_won_first')
      if (week >= 53) seedFlags.push('term_2_begun')
      if (week >= 65) seedFlags.push('diplomatic_table_attended')
      if (week >= 80) seedFlags.push('geological_survey_funded')
      if (seedFlags.length > 0) useNarrativeStore.getState().addFlags(seedFlags)
    }
    get().initWeek()
  },

  closeCliffhanger: () => {
    const state = useGameStore.getState()
    const newWeek = state.currentWeek
    set({ cliffhangerText: null })

    // Press intelligence trigger: if player has read 3+ papers for 2+ events by Week 4+
    const { activeFlags } = useNarrativeStore.getState()
    if (newWeek >= 4 && !activeFlags.includes('vyktor_press_briefing_complete')) {
      const store = useNewsStore.getState()
      const eventsCount = store.getEventsWithMultiplePapers()
      if (eventsCount >= 2) {
        // M5 — fire the Vyktor briefing immediately in the current week's
        // pool by injecting it as an emergency scene, rather than
        // scheduling it for the next chain-process tick.
        useWeekStore.getState().injectScene(
          'vyktor_press_briefing',
          'Vyktor — The Press Briefing',
        )
      }
    }

    // Generate diary for the week just started (Week 1+)
    const diary = generateDiaryEntry(newWeek)
    useGameStore.getState().addDiaryEntry({ week: diary.week, date: diary.date, text: diary.text, category: diary.category })
    set({ diaryEntry: diary })
  },

  closeDiary: () => {
    set({ phase: 'briefing', diaryEntry: null, transitionLabel: '', transitionWeek: null })
    get().initWeek()
  },

  completeWeek: async () => {
    const gameState = useGameStore.getState()
    const { visitedSceneIds } = useNarrativeStore.getState()
    const { agendaPool } = get()

    const gateResult = canAdvanceWeek(gameState.currentWeek, visitedSceneIds, agendaPool)
    if (!gateResult.canAdvance && gateResult.blockedBy) {
      set({
        gateBlocked: true,
        gateMessage: gateResult.blockedBy.gateMessage ?? `You must complete "${gateResult.blockedBy.title}" before the week can end.`,
      })
      return
    }

    // Assassination trigger check (Week 30-36)
    const { activeFlags } = useNarrativeStore.getState()
    const assassResult = evaluateAssassinationTrigger(gameState, activeFlags)
    if (assassResult.triggered) {
      const sceneId = getAssassinationSceneId(assassResult.variant)
      useChainStore.getState().schedule(
        [{ targetNodeId: sceneId, delayWeeks: 0 }],
        gameState.currentWeek,
        'assassination_trigger',
      )
    }

    useGameStore.getState().advanceWeek()
    const nextState = useGameStore.getState()
    const newWeek = nextState.currentWeek

    // --- Dynamic Polling Engine ---
    // Start with the previous week's polling to preserve campaign boosts
    let playerPoll = nextState.playerPolling

    // Apply weekly drift based on governance performance
    if (nextState.nation.economyHealth > 20) playerPoll += 2
    if (nextState.nation.economyHealth < -20) playerPoll -= 2
    if (nextState.personal.publicImage > 60) playerPoll += 1
    if (nextState.personal.publicImage < 35) playerPoll -= 1
    if (nextState.nation.corruption > 60) playerPoll -= 2

    // Oligarch interference
    if (activeFlags.includes('government_captured')) playerPoll = 85 // Bought election
    if (activeFlags.includes('oligarch_debts_refused')) playerPoll -= 1 // Oligarchs funding Kolvar

    // Clamp player polling (min 15%, max 90%)
    playerPoll = Math.max(15, Math.min(90, playerPoll))
    const kolvarPoll = 100 - playerPoll

    useGameStore.setState({ playerPolling: playerPoll, kolvarPolling: kolvarPoll })

    // Democratic Election Check (Every 52 weeks)
    if (newWeek > 0 && newWeek % 52 === 0) {
      const { activeFlags } = useNarrativeStore.getState()
      const result = calculateElectionResult(nextState, activeFlags)
      
      if (result.winner === 'kolvar') {
        // Player loses the election
        set({ transitionWeek: null, transitionLabel: 'defeat' })
        trackedTimeout(() => {
          set({ transitionLabel: '', phase: 'epilogue' })
        }, 1500)
        return
      } else {
        // Player wins the election
        
        // TWO-TERM LIMIT: If this is the second election (Week 104+), the game ends.
        if (newWeek >= 104) {
          set({ transitionWeek: null, transitionLabel: 'term_limit' })
          trackedTimeout(() => {
            set({ transitionLabel: '', phase: 'epilogue' })
          }, 1500)
          return
        }
        
        // Otherwise, continue to the next term
        set({ transitionLabel: 'Election Victory' })
        trackedTimeout(() => {
          set({ transitionLabel: '' })
        }, 2000)
        // Clear oligarch election flags so they don't affect the next term
        useNarrativeStore.getState().addFlags(['election_won_term_' + (newWeek / 52)])
      }
    }

    // Update Jonas's public stage based on week and marriage health
    const newJonasStage = computeJonasStage(newWeek, nextState.personal.marriageHealth)
    useGameStore.getState().setJonasPublicStage(newJonasStage)

    // State of Emergency weekly effects
    if (nextState.stateOfEmergency) {
      const soeDuration = newWeek - nextState.stateOfEmergencyWeek
      const store = useGameStore.getState()

      // Each emergency decree costs moral compass
      // (per-decree moralCompass is reduced when issued, but SOE itself degrades it weekly)

      // International condemnation after Week 4 of emergency
      if (soeDuration > 4) {
        store.applyModifiers([
          { stat: 'nation.internationalStanding', operation: 'add', value: -2 },
        ])
      }

      // Reformist protests intensify over time
      if (soeDuration > 6) {
        store.applyModifiers([
          { stat: 'factions.reformists', operation: 'add', value: -1 },
        ])
      }

      // Press freedom erodes under extended emergency
      if (soeDuration > 8) {
        store.applyModifiers([
          { stat: 'nation.pressFreedom', operation: 'add', value: -1 },
        ])
      }

      // Civil liberties continue to decay
      if (nextState.stateOfEmergencyExtensions > 1) {
        store.applyModifiers([
          { stat: 'nation.civilLiberties', operation: 'add', value: -2 },
          { stat: 'personal.moralCompass', operation: 'add', value: -2 },
        ])
      }
    }

    // Advance active project weeks and auto-complete finished projects
    for (const project of nextState.activeProjects) {
      if (project.phase !== 'active') continue
      useGameStore.getState().advanceProjectWeek(project.projectId)
    }
    const updatedProjects = useGameStore.getState().activeProjects
    const defs = projectDefinitions as DevelopmentProject[]
    for (const project of updatedProjects) {
      if (project.phase !== 'active') continue
      const def = defs.find(d => d.id === project.projectId)
      if (def && project.currentWeek >= def.durationWeeks) {
        useGameStore.getState().completeProject(project.projectId)
      }
    }

    // Detect projects that hit their midpoint this week
    const finalProjects = useGameStore.getState().activeProjects
    for (const project of finalProjects) {
      if (project.phase !== 'active' || project.midpointResolved) continue
      const def = defs.find(d => d.id === project.projectId)
      if (def && project.currentWeek >= def.midpointWeek) {
        set({ pendingMidpointProjectId: project.projectId })
        break
      }
    }

    // Corruption discovery check
    const { activeFlags: corruptionFlags } = useNarrativeStore.getState()
    const discovered = processCorruptionDiscovery(nextState, corruptionFlags)
    if (discovered.length > 0) {
      useGameStore.getState().applyDiscoveredCorruption(discovered)
    }

    // Impeachment check
    const discoveredCount = useGameStore.getState().corruptionDiscoveredCount
    if (shouldTriggerImpeachment(discoveredCount) && !corruptionFlags.includes('impeachment_triggered')) {
      // Force impeachment scene into the agenda via chain
      useChainStore.getState().schedule(
        [{ targetNodeId: 'act4_impeachment_proceedings', delayWeeks: 0 }],
        newWeek,
        'corruption_impeachment',
      )
    }

    // Generate week-summary news article
    const summaryTemplate = NEWS_TEMPLATES.find(t => t.trigger === '__week_summary__')
    if (summaryTemplate) {
      const d = new Date(1963, 0, 1)
      d.setDate(d.getDate() + (newWeek - 1) * 7)
      const dateStr = d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
      const pub = newWeek % 2 === 0 ? 'ashenmere_herald' as const : 'peoples_standard' as const
      const content = pub === 'ashenmere_herald' ? summaryTemplate.herald : summaryTemplate.standard
      useNewsStore.getState().addArticles([{
        id: `news_week_${newWeek}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        headline: content.headline,
        body: content.body,
        publication: pub,
        weekNumber: newWeek,
        date: dateStr,
        templateId: '__week_summary__',
        category: 'governance',
      }])
    }

    // Inject divergent newspaper coverage for key weeks (5 events × 5 papers)
    const divergents = DIVERGENT_ARTICLES.filter(a => a.weekNumber === newWeek)
    if (divergents.length > 0) {
      const articles = divergents.map(a => ({
        id: a.id,
        headline: a.headline,
        body: a.body,
        publication: a.publication,
        weekNumber: a.weekNumber,
        date: a.date,
        templateId: a.id,
        category: a.category as NewsCategory,
      }))
      useNewsStore.getState().addArticles(articles)
    }

    // Show week number transition for 1.5s, then cliffhanger
    set({ transitionWeek: newWeek, transitionLabel: 'week' })
    trackedTimeout(() => {
      try {
        const { activeFlags: flags2 } = useNarrativeStore.getState()
        const fired = useChainStore.getState().process(newWeek, nextState, flags2)
        set({ forcedChainIds: fired, transitionWeek: null, transitionLabel: '' })

        // Process pending long-term decree effects
        const decreeState = useDecreeStore.getState()
        const dueEffects = decreeState.pendingLongTermEffects.filter(e => e.applyAtWeek <= newWeek)
        if (dueEffects.length > 0) {
          const mods = dueEffects.map(e => ({
            stat: e.stat,
            operation: e.operation as 'add' | 'set' | 'multiply',
            value: e.value,
          }))
          useGameStore.getState().applyModifiers(mods)
          useDecreeStore.setState(s => ({
            pendingLongTermEffects: s.pendingLongTermEffects.filter(e => e.applyAtWeek > newWeek),
          }))
        }

        // Week-by-week nation trends: record AFTER deferred decree effects so the
        // snapshots include long-term adjustments due this week.
        useGameStore.setState((state) => ({
          economyHistory: [
            ...(state.economyHistory ?? []),
            { week: state.currentWeek, value: state.nation.economyHealth },
          ],
          debtHistory: [
            ...(state.debtHistory ?? []),
            { week: state.currentWeek, value: state.nation.nationalDebt },
          ],
          inflationHistory: [
            ...(state.inflationHistory ?? []),
            { week: state.currentWeek, value: state.nation.inflation },
          ],
          publicOrderHistory: [
            ...(state.publicOrderHistory ?? []),
            { week: state.currentWeek, value: state.nation.publicOrder },
          ],
        }))

        // Generate cliffhanger for the week that just ended (old week, before advance)
        // The cliffhanger reflects on the old week's events
        const cliffhanger = generateCliffhanger(gameState.currentWeek)
        set({
          cliffhangerText: cliffhanger,
          phase: 'review',
        })

        saveGame(AUTOSAVE_SLOT, 'AUTOSAVE').catch(console.error)
        // Also save to active manual slot if one is assigned
        const { activeSlot: aSlot } = get()
        if (aSlot > 0) {
          saveGame(aSlot, 'PROGRESS SAVE').catch(console.error)
        }
      } catch (e) {
        console.error('[completeWeek] setTimeout CRASHED — clearing transitionLabel to prevent black screen:', e)
        set({ transitionWeek: null, transitionLabel: '', cliffhangerText: 'Your week has concluded. The Republic continues.' })
      }
    }, 1500)

    // Autosave after week completes
    try {
      await saveGame(AUTOSAVE_SLOT, 'AUTOSAVE')
      if (import.meta.env.DEV) console.log('[Autosave] Saved after week', useGameStore.getState().currentWeek)
    } catch (e) {
      console.warn('[Autosave] Failed:', e)
    }
  },
}))

// Enable Hot Module Replacement (HMR) for Zustand store
// Preserves week/agenda state across hot reloads during local development
if (import.meta.hot) {
  import.meta.hot.accept()
}
