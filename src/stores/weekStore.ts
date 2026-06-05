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
import { useNewsStore } from './newsStore'
import { NEWS_TEMPLATES } from '../data/news/newsTemplates'
import { processCorruptionDiscovery, shouldTriggerImpeachment } from '../engine/CorruptionEngine'
import projectDefinitions from '../data/projects.json'
import type { DevelopmentProject } from '../types/projects'
import type { NewsCategory } from '../types/news'
import { saveGame, AUTOSAVE_SLOT } from '../engine/SaveManager'
import { evaluateAssassinationTrigger, getAssassinationSceneId } from '../engine/AssassinationEngine'
import { computeJonasStage } from '../engine/JonasEngine'
import { MAX_BROADCASTS } from '../engine/RadioEngine'
import { useLetterStore } from './letterStore'
import { generateDiaryEntry } from '../engine/DiaryEngine'
import { generateCliffhanger } from '../engine/CliffhangerEngine'
import { DIVERGENT_ARTICLES } from '../data/newspapers/divergent_coverage'
import { useCabinetStore } from './cabinetStore'
import { generateWeeklyRequests } from '../data/ministerRequests'

// Load all agenda pool JSON files at build time.
// Each file exports an AgendaItem[].
const agendaModules = import.meta.glob<AgendaItem[]>(
  '../data/agenda/*.json',
  { eager: true, import: 'default' },
)
const ALL_AGENDA: AgendaItem[] = Object.values(agendaModules).flat()

function buildPool(week: number, state: GameState, flags: string[], visited: string[]): AgendaItem[] {
  return ALL_AGENDA.filter(item => {
    if (item.weekAvailable > week) return false
    if (item.weekDeadline !== undefined && week > item.weekDeadline) return false
    if (item.prerequisites?.length) {
      if (!evaluateAll(item.prerequisites, state, flags)) return false
    }

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

    return true
  })
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

  // Gate check
  gateBlocked: boolean
  gateMessage: string | null
  dismissGate: () => void

  // Actions
  startCustomization: () => void    // new game → character sheet (resets all state)
  startPrologue:      () => void    // customization → childhood prologue
  initWeek:          () => void
  endBriefing:       () => void     // briefing → press (then agenda)
  endPress:          () => void     // press → agenda (or legislation if bills)
  endLegislation:    () => void     // legislation → agenda
  toggleAgendaItem:  (id: string) => void
  confirmAgenda:     () => void
  advanceQueue:      () => void     // move to next scene or review phase
  injectScene:       (sceneId: string, title: string) => void  // mid-week emergency interrupt
  resolveMidpoint:   () => void                                    // clear pending midpoint modal
  openTermReport:    () => void                                    // show term report after epilogue
  openLegacy:        () => void                                    // show legacy screen after term report
  completeWeek:      () => void     // advance week counter → new week
  radioOpen: boolean
  setRadioOpen: (open: boolean) => void

  // Cabinet
  showCabinetFormation: boolean
  showCabinetMeeting: boolean
  triggerCabinetFormation: () => void
  dismissCabinetMeeting: () => void
}

export const useWeekStore = create<WeekStore>((set, get) => ({
  phase: 'title',
  agendaPool:          [],
  selectedIds:         [],
  slotsUsed:           0,
  forcedChainIds:      [],
  sceneQueue:          [],
  currentQueueIndex:   0,
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
  gateBlocked: false,
  gateMessage: null,
  radioOpen: false,

  showCabinetFormation: false,
  showCabinetMeeting: false,

  triggerCabinetFormation: () => set({ showCabinetFormation: true }),
  dismissCabinetMeeting: () => set({ showCabinetMeeting: false, phase: 'briefing' }),

  startCustomization: () => {
    // Full state reset for a clean new game
    useGameStore.getState().resetToInitial()
    // Randomize the mole identity for this playthrough
    useGameStore.getState().randomizeMoleIdentity()
    // Snapshot the initial state for end-game comparison
    useGameStore.getState().captureSnapshot()
    useNarrativeStore.setState({
      visitedSceneIds: [],
      activeFlags:     [],
      unlockedCodexIds: [],
      metCharacters:   [],
      currentScene:    null,
      sceneDone:       false,
    })
    useChainStore.setState({ scheduled: [] })
    useNewsStore.setState({ articles: [], isOpen: false, lastReadIndex: -1 })
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
    set({
      phase: 'customization',
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

  initWeek: () => {
    const gameState  = useGameStore.getState()
    const { activeFlags, visitedSceneIds } = useNarrativeStore.getState()
    const pool = buildPool(gameState.currentWeek, gameState, activeFlags, visitedSceneIds)
    // Add radio broadcast agenda item if player has broadcasts remaining
    if (gameState.radioBroadcastsUsed < MAX_BROADCASTS) {
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
        cabinetStore.ministers
      )
      if (newRequests.length > 0) {
        newRequests.forEach(req => cabinetStore.addRequest(req))
        showMeeting = true
      }
    }

    // Auto-select mandatory items
    const mandatoryItems = pool.filter(item => item.isMandatory)
    const mandatoryIds = mandatoryItems.map(item => item.id)
    const mandatoryCost = mandatoryItems.reduce((sum, item) => sum + item.slotCost, 0)
    // Note: forcedChainIds is NOT reset here — it is set by completeWeek before initWeek runs.
    // On first load (GameLayout mount), forcedChainIds stays [] from initial state.
    set({
      phase:        showMeeting ? 'scene' : 'briefing',
      agendaPool:   pool,
      selectedIds:  mandatoryIds,
      slotsUsed:    mandatoryCost,
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
    set({ phase: 'press' })
  },

  endPress: () => {
    const gameState = useGameStore.getState()
    const { activeFlags } = useNarrativeStore.getState()
    const { bills, history } = useBillStore.getState()

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
      set({ phase: 'agenda' })
    }
  },

  endLegislation: () => set({ phase: 'agenda' }),

  toggleAgendaItem: (id) => {
    const { agendaPool, selectedIds, slotsUsed } = get()
    const item = agendaPool.find(a => a.id === id)
    if (!item) return

    const isSelected = selectedIds.includes(id)
    if (isSelected) {
      if (item.isMandatory) return
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
      .map(id => agendaPool.find(a => a.id === id)!)
      .filter(Boolean)
      .sort((a, b) => a.executionOrder - b.executionOrder)

    const sorted = [...chainItems, ...playerItems]
      .sort((a, b) => a.executionOrder - b.executionOrder)
    if (sorted.length === 0) {
      console.warn('[confirmAgenda] No items in queue — transitioning to review')
      set({ phase: 'review' })
      return
    }

    console.log('[confirmAgenda] Queue:', sorted.map((s, i) => `[${i}] ${s.id} (${s.sceneId})`).join(', '))

    // Snapshot stats before any scene runs (used by EveningReview for deltas)
    const snapshot = { ...gameState }
    const first = sorted[0]
    const base = { sceneQueue: sorted, currentQueueIndex: 0, weekStartSnapshot: snapshot, transitionLabel: '', transitionWeek: null }

    if (first.sceneId === '__budget__') {
      set({ ...base, phase: 'budget' })
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
      console.log('[confirmAgenda] Loading scene:', first.sceneId, 'from item:', first.id, 'title:', first.title)
      useNarrativeStore.getState().loadScene(first.sceneId)
      set({ ...base, phase: 'scene' })
    }
  },

  advanceQueue: () => {
    const { currentQueueIndex, transitionLabel } = get()
    // Guard against double-tap during transition
    if (transitionLabel) return

    const next = currentQueueIndex + 1

    useNarrativeStore.getState().resetScene()
    // Scene-to-scene fade transition (500ms)
    set({ transitionLabel: 'scene' })
    setTimeout(() => {
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
          console.log('[advanceQueue] Loading scene:', item.sceneId, '| queue index:', next, 'of', q.length, '|', item.title)
          if (item.sceneId === '__budget__') {
            set({ phase: 'budget', transitionLabel: '' })
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
            useNarrativeStore.getState().loadScene(item.sceneId)
            set({ phase: 'scene' })
          }
        } else {
          console.log('[advanceQueue] Queue exhausted — transitioning to review. Queue was:', q.map((s, i) => `[${i}] ${s.id}`).join(', '), '| last index:', next - 1)
          set({ phase: 'review', transitionLabel: '' })
        }
      } catch (e) {
        console.error('[advanceQueue] CRASHED — clearing transitionLabel to prevent black screen:', e)
        set({ transitionLabel: '', phase: 'review' })
      }
    }, 500)
  },

  // Mid-week emergency interrupt — injects a chain-triggered scene into the
  // current week's queue directly after the currently-playing scene.
  injectScene: (sceneId, title) => {
    const { sceneQueue, currentQueueIndex } = get()
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

  resolveMidpoint: () => set({ pendingMidpointProjectId: null }),

  openTermReport: () => set({ showTermReport: true }),
  openLegacy: () => set({ showTermReport: false, showLegacy: true }),
  setRadioOpen: (open) => set({ radioOpen: open }),
  dismissGate: () => set({ gateBlocked: false, gateMessage: null }),

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
        // Inject Vyktor press briefing as a forced chain
        useChainStore.getState().schedule(
          [{ targetNodeId: 'vyktor_press_briefing', delayWeeks: 0 }],
          newWeek,
          'vyktor_press_intelligence',
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

  completeWeek: () => {
    const gameState = useGameStore.getState()
    const { visitedSceneIds } = useNarrativeStore.getState()

    const gateResult = canAdvanceWeek(gameState.currentWeek, visitedSceneIds)
    if (!gateResult.canAdvance && gateResult.blockedBy) {
      set({
        gateBlocked: true,
        gateMessage: gateResult.blockedBy.gateMessage ?? `You must complete "${gateResult.blockedBy.title}" before the week can end.`,
      })
      return
    }

    // Week 52 → epilogue transition (game over)
    if (gameState.currentWeek >= 52) {
      set({ transitionWeek: null, transitionLabel: 'epilogue' })
      setTimeout(() => set({ transitionLabel: '', phase: 'epilogue' }), 1200)
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
        id: `news_week_${newWeek}_${Date.now()}`,
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
    setTimeout(() => {
      try {
        const { activeFlags: flags2 } = useNarrativeStore.getState()
        const fired = useChainStore.getState().process(newWeek, nextState, flags2)
        set({ forcedChainIds: fired, transitionWeek: null, transitionLabel: '' })

        // Generate cliffhanger for the week that just ended (old week, before advance)
        // The cliffhanger reflects on the old week's events
        const cliffhanger = generateCliffhanger(gameState.currentWeek)
        set({ cliffhangerText: cliffhanger })

        saveGame(AUTOSAVE_SLOT, 'AUTOSAVE').catch(console.error)
      } catch (e) {
        console.error('[completeWeek] setTimeout CRASHED — clearing transitionLabel to prevent black screen:', e)
        set({ transitionWeek: null, transitionLabel: '', cliffhangerText: 'Your week has concluded. The Republic continues.' })
      }
    }, 1500)
  },
}))

// Enable Hot Module Replacement (HMR) for Zustand store
// Preserves week/agenda state across hot reloads during local development
if (import.meta.hot) {
  import.meta.hot.accept()
}
