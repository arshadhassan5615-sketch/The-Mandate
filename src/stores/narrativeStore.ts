import { create } from 'zustand'
import type { NarrativeNode, ChainTrigger } from '../types/narrative'
import type { NewsArticle, Publication } from '../types/news'
import type { GameState, StateModifier } from '../types/gameState'
import { getScene, getAvailableChoices } from '../engine/NarrativeEngine'
import { evaluateAll } from '../engine/conditionEvaluator'
import { useGameStore } from './gameStore'
import { useCabinetStore } from './cabinetStore'
import { useChainStore } from './chainStore'
import { useWeekStore } from './weekStore'
import { useNewsStore } from './newsStore'
import { useDecreeStore } from './decreeStore'
import { NEWS_TEMPLATES } from '../data/news/newsTemplates'
import { ALL_DECREES } from '../data/decrees'
import { playCodexUnlock } from '../engine/audioEngine'
import { useJournalStore } from '../stores/journalStore'
import { getJournalTemplate, getJournalCategory } from '../data/journal/templates'
import { getStructuredJournalTemplate, getStructuredJournalCategory } from '../data/journal/journalTemplates'
import type { ChoiceAlignment } from '../types/journal'
import {
  FLAG_HANDLERS,
  MOLE_CLUE_PATTERN,
  KICKBACK_PATTERN,
  handleMoleClue,
  handleKickback,
  handleMoleAccusation,
  buildCorruptionEntry,
} from '../engine/FlagHandlers'
import projectDefinitions from '../data/projects.json'
import type { DevelopmentProject } from '../types/projects'

const PROJECT_START_FLAGS: Record<string, string> = {
  'project_kravenstal_started': 'kravenstal_steel',
  'project_highway_started': 'amber_coast_highway',
  'project_university_started': 'university_expansion',
  'project_sevagrad_started': 'sevagrad_fortification',
  'project_electrification_started': 'rural_electrification',
  'project_metro_started': 'ashenmere_metro',
}

function getContractorSceneId(projectId: string): string | null {
  switch (projectId) {
    case 'kravenstal_steel': return 'project_contractor_steel'
    case 'amber_coast_highway': return 'project_contractor_highway'
    case 'university_expansion': return 'project_contractor_university'
    case 'sevagrad_fortification': return 'project_contractor_fortification'
    default: return null
  }
}

function getMidCrisisSceneId(projectId: string): string | null {
  switch (projectId) {
    case 'amber_coast_highway': return 'project_mid_crisis_highway'
    case 'kravenstal_steel': return 'project_mid_crisis_steel'
    case 'university_expansion': return 'project_mid_crisis_university'
    case 'sevagrad_fortification': return 'project_mid_crisis_fortification'
    default: return null
  }
}

function weekToDate(week: number): string {
  const d = new Date(1963, 0, 1)
  d.setDate(d.getDate() + (week - 1) * 7)
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
}

function generateNews(
  trigger: string,
  gameState: ReturnType<typeof useGameStore.getState>,
  activeFlags: string[],
): void {
  const matches = NEWS_TEMPLATES.filter(t => t.trigger === trigger)
  if (matches.length === 0) return

  const articles: NewsArticle[] = []
  const mediaControl = gameState.nation.mediaControl
  const pressFreedom = gameState.nation.pressFreedom

  for (const template of matches) {
    if (template.conditions?.length) {
      if (!evaluateAll(template.conditions, gameState, activeFlags)) continue
    }

    const pubIndex = articles.length % 2
    let publication: Publication
    let content: { headline: string; body: string }

    if (pubIndex === 0) {
      publication = 'ashenmere_herald'
      if (mediaControl < 20) {
        content = template.standard
      } else {
        content = template.herald
      }
    } else {
      publication = 'peoples_standard'
      content = template.standard
    }

    articles.push({
      id: `news_${trigger}_${articles.length}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      headline: content.headline,
      body: content.body,
      publication,
      weekNumber: gameState.currentWeek,
      date: weekToDate(gameState.currentWeek),
      templateId: template.trigger,
      category: template.category,
    })

    if (template.worker) {
      articles.push({
        id: `news_${trigger}_worker_${articles.length}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        headline: template.worker.headline,
        body: template.worker.body,
        publication: 'kravenstal_worker' as Publication,
        weekNumber: gameState.currentWeek,
        date: weekToDate(gameState.currentWeek),
        templateId: template.trigger,
        category: template.category,
      })
    }

    if (template.times) {
      articles.push({
        id: `news_${trigger}_times_${articles.length}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        headline: template.times.headline,
        body: template.times.body,
        publication: 'veltrian_voice' as Publication,
        weekNumber: gameState.currentWeek,
        date: weekToDate(gameState.currentWeek),
        templateId: template.trigger,
        category: template.category,
      })
    }

    if (template.gazette) {
      articles.push({
        id: `news_${trigger}_gazette_${articles.length}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        headline: template.gazette.headline,
        body: template.gazette.body,
        publication: 'thornfeld_gazette' as Publication,
        weekNumber: gameState.currentWeek,
        date: weekToDate(gameState.currentWeek),
        templateId: template.trigger,
        category: template.category,
      })
    }

    if (pressFreedom > 60 && mediaControl > 60 && pubIndex === 0) {
      articles.push({
        id: `news_${trigger}_voice_${articles.length}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        headline: template.standard.headline,
        body: `[The Veltrian Voice — Independent Press] ${template.standard.body}`,
        publication: 'veltrian_voice' as Publication,
        weekNumber: gameState.currentWeek,
        date: weekToDate(gameState.currentWeek),
        templateId: template.trigger,
        category: template.category,
      })
    }
  }

  if (articles.length > 0) {
    useNewsStore.getState().addArticles(articles)
  }
}

interface NarrativeStore {
  currentScene:      NarrativeNode | null
  activeSegmentId:   string | null   // non-null when playing a branch within a scene
  visitedSceneIds:   string[]
  activeFlags:       string[]
  unlockedCodexIds:  string[]    // codex entry IDs unlocked by choices
  metCharacters:     string[]    // character roster IDs the player has encountered
  sceneDone:         boolean     // true once the scene's choices have all resolved

  // Called by weekStore to start / reset a scene slot
  loadScene:    (id: string) => void
  resetScene:   () => void

  // Called by special-flow components (e.g. CabinetFormation) to record a
  // pseudo-scene as visited without loading it into the scene UI.
  markSceneVisited: (id: string) => void

  // Full narrative-state wipe for a new game (replaces manual setState literals)
  resetAll: () => void

  // Called by the scene UI when the player picks an option
  processChoice: (choiceId: string) => void

  // Called by the prologue and character creation to inject flags
  addFlags: (flags: string[]) => void

  // Dev tools — flag toggling for testing (activeFlags lives in this store)
  devSetFlag:  (flag: string, value: boolean) => void
  removeFlag:  (flag: string) => void
}

export const useNarrativeStore = create<NarrativeStore>((set, get) => ({
  currentScene:      null,
  activeSegmentId:   null,
  visitedSceneIds:   [],
  activeFlags:       [],
  unlockedCodexIds:  [],
  metCharacters:     [],
  sceneDone:         false,

  loadScene: (id) => {
    if (import.meta.env.DEV) console.log('[TRACE 3] loadScene called for:', id)
    const gameState  = useGameStore.getState()
    const { activeFlags, metCharacters } = get()
    let target = getScene(id)
    if (import.meta.env.DEV) console.log('[TRACE 4] getScene result:', !!target, target?.title ?? 'null')

    // Minister-variant redirect: swap scene if interior minister is Perov
    if (id === 'security_posture_choice') {
      const interior = useCabinetStore.getState().getMinister('interior')
      if (interior?.id === 'nikolai_perov') {
        const alt = getScene('security_posture_choice_perov')
        if (alt) target = alt
      }
    }

    // If scene not found, create a fallback so the game never hangs
    if (!target) {
      console.error(`[narrativeStore.loadScene] SCENE "${id}" NOT FOUND — creating fallback`)
      target = {
        id: `fallback_${id}`,
        title: 'Scene Not Found',
        act: 1,
        weekAvailable: 1,
        type: 'event' as const,
        agendaCost: 0,
        location: 'Unknown',
        characters: [],
        prerequisites: [],
        narrative: [{
          type: 'description',
          text: `The scene "${id}" could not be loaded. This is a bug — please report it. You can continue to the next event.`,
        }],
        choices: [],
      }
    }

    // If the scene has prerequisites that don't pass, walk the exclusive list
    // until we find a variant that qualifies (fallback routing for branching events).
    if (target?.prerequisites?.length && !evaluateAll(target.prerequisites, gameState, activeFlags)) {
      for (const altId of (target.exclusive ?? [])) {
        const alt = getScene(altId)
        if (alt && (!alt.prerequisites?.length || evaluateAll(alt.prerequisites, gameState, activeFlags))) {
          target = alt
          break
        }
      }
    }

    // C3 fix: some scenes store their top-level content under `dialogue`
    // instead of `narrative`. Normalize them before the scene goes live.
    if (target && !target.narrative && target.dialogue) {
      target = {
        ...target,
        narrative: Array.isArray(target.dialogue)
          ? target.dialogue
          : [{ type: 'description', text: target.dialogue }],
      }
    }

    // Track characters encountered in dialogue segments
    let newMet = metCharacters
    if (target) {
      const charsInScene = (target.narrative ?? [])
        .filter(seg => seg.type === 'dialogue' && seg.character)
        .map(seg => `character_${seg.character}`)
      const toAdd = charsInScene.filter(c => !newMet.includes(c))
      if (toAdd.length) newMet = [...newMet, ...toAdd]
    }

    set({ currentScene: target ?? null, sceneDone: !target, metCharacters: newMet })
    if (import.meta.env.DEV) console.log('[TRACE 5] currentScene set to:', target?.id ?? 'null', '| sceneDone:', !target)
  },

  resetScene: () => {
    set({ currentScene: null, activeSegmentId: null, sceneDone: false })
  },

  markSceneVisited: (id) => set((state) => ({
    visitedSceneIds: state.visitedSceneIds.includes(id)
      ? state.visitedSceneIds
      : [...state.visitedSceneIds, id],
  })),

  resetAll: () => set({
    currentScene:      null,
    activeSegmentId:   null,
    visitedSceneIds:   [],
    activeFlags:       [],
    unlockedCodexIds:  [],
    metCharacters:     [],
    sceneDone:         false,
  }),

  addFlags: (flags) => set((state) => ({
    activeFlags: [...new Set([...state.activeFlags, ...flags])],
  })),

  removeFlag: (flag) => set((state) => ({
    activeFlags: state.activeFlags.filter(f => f !== flag),
  })),

  devSetFlag: (flag, value) => {
    if (value) {
      get().addFlags([flag])
    } else {
      get().removeFlag(flag)
    }
  },

  processChoice: (choiceId) => {
    const { currentScene, visitedSceneIds, activeFlags } = get()
    const sceneChoices = currentScene?.choices ?? []
    const segmentsKeys = currentScene?.segments ? Object.keys(currentScene.segments) : []
    if (import.meta.env.DEV) console.log(
      '[narrativeStore.processChoice] choiceId:', choiceId,
      '| sceneId:', currentScene?.id ?? 'null',
      '| choicesInScene:', sceneChoices.map(c => c.id),
      '| hasNextNode:', !!sceneChoices.find(c => c.id === choiceId)?.nextNodeId,
      '| hasNextSegment:', !!sceneChoices.find(c => c.id === choiceId)?.nextSegment,
      '| segmentKeys:', segmentsKeys,
    )

    if (!currentScene) {
      console.warn('[narrativeStore.processChoice] BLOCKED: no currentScene loaded')
      return
    }

    const choice = sceneChoices.find(c => c.id === choiceId)
    if (!choice) {
      console.warn(
        '[narrativeStore.processChoice] BLOCKED: choice id not in currentScene.choices',
        '| requested:', choiceId,
        '| available:', sceneChoices.map(c => c.id),
        '| sceneId:', currentScene.id,
      )
      return
    }

    // Guard — choice conditions must pass
    const gameState = useGameStore.getState()
    const available = getAvailableChoices(currentScene, gameState, activeFlags)
    if (!available.find(c => c.id === choiceId)) {
      console.warn(
        '[narrativeStore.processChoice] BLOCKED: choice failed conditions',
        '| requested:', choiceId,
        '| passed:', available.map(c => c.id),
        '| sceneId:', currentScene.id,
      )
      return
    }

    // Log journal entry for major decisions
    const tag = choice.internalTag
    if (tag) {
      const structured = getStructuredJournalTemplate(currentScene.id, choiceId)
      const fallback = getJournalTemplate(choiceId, currentScene.title, tag as ChoiceAlignment)
      const template = structured ?? fallback
      const structuredCat = getStructuredJournalCategory(currentScene.id, choiceId)
      const fallbackCat = getJournalCategory(choiceId, currentScene.title, tag as ChoiceAlignment)
      const category = structuredCat ?? fallbackCat
      useJournalStore.getState().addEntry({
        sceneId: currentScene.id,
        choiceId,
        category,
        alignment: tag as ChoiceAlignment,
        title: template.title,
        description: template.description,
        icon: template.icon,
        flag: null,
        currentWeek: gameState.currentWeek,
      })
    }

    // ── C6 fix: legacy `statEffects` alias for `stateChanges` ──────────
    // Many Act 1–3 scene JSON files use `statEffects: [{ stat, value }]`
    // instead of the canonical `stateChanges: [{ stat, operation, value }]`.
    // When `stateChanges` is empty/missing, fall back to `statEffects`
    // mapped to operation = 'add'. This makes all 119 legacy choices
    // mechanically active without rewriting any JSON files.
    const effectiveChanges: StateModifier[] = (
      (choice.stateChanges?.length ?? 0) > 0
        ? (choice.stateChanges ?? [])
        : (choice.statEffects ?? []).map(e => ({
            stat: e.stat,
            operation: 'add' as const,
            value: e.value,
          }))
    )

    useGameStore.getState().applyModifiers(effectiveChanges)

    // Schedule any delayed consequences from this choice.
    // delayWeeks: 0 triggers are mid-week emergency interrupts — injected directly
    // into the current week's scene queue after the current scene.
    if (choice.chainTriggers?.length) {
      const immediate: ChainTrigger[] = []
      const delayed: ChainTrigger[] = []
      for (const trigger of choice.chainTriggers) {
        if (trigger.delayWeeks === 0) {
          immediate.push(trigger)
        } else {
          delayed.push(trigger)
        }
      }

      // Schedule delayed triggers normally
      if (delayed.length) {
        useChainStore.getState().schedule(
          delayed,
          useGameStore.getState().currentWeek,
          choice.id,
          currentScene.id,
        )
      }

      // Inject immediate triggers into the current week's queue
      for (const trigger of immediate) {
        const scene = getScene(trigger.targetNodeId)
        if (scene) {
          useWeekStore.getState().injectScene(trigger.targetNodeId, scene.title)
        }
      }
    }

    // ---------- Declarative flag dispatch ----------
    // Build a Partial<GameState> by looking up each flag in FLAG_HANDLERS,
    // then merge it onto the store in one setState. Adding a new choice flag
    // is now a one-line addition to FlagHandlers.ts.

    const stateForHandlers = useGameStore.getState()
    let stateUpdates: Partial<GameState> = {}
    let moleConsequenceFlags: string[] = []

    // Mole accusation runs at most once per choice (mutually exclusive flags,
    // and we don't want to apply consequences multiple times).
    const accusationResult = handleMoleAccusation(choice.flags ?? [], stateForHandlers)
    if (accusationResult) {
      stateUpdates = { ...stateUpdates, ...accusationResult.stateUpdates }
      moleConsequenceFlags = [...moleConsequenceFlags, ...accusationResult.consequenceFlags]
      if (accusationResult.statChanges.length) {
        useGameStore.getState().applyModifiers(accusationResult.statChanges)
      }
    }

    for (const flag of choice.flags ?? []) {
      if (flag in FLAG_HANDLERS) {
        // Skip the accused_* family — handled above as a single accusation.
        if (flag.startsWith('accused_')) continue
        stateUpdates = {
          ...stateUpdates,
          ...FLAG_HANDLERS[flag](stateForHandlers, choice, flag),
        }
        continue
      }

      // Regex/prefix patterns (the lookup table can't express these).
      if (MOLE_CLUE_PATTERN.test(flag)) {
        const partial = handleMoleClue(flag, stateForHandlers)
        if (partial) stateUpdates = { ...stateUpdates, ...partial }
        continue
      }
      if (KICKBACK_PATTERN.test(flag)) {
        const entry = handleKickback(flag, stateForHandlers)
        if (entry) {
          stateUpdates = {
            ...stateUpdates,
            corruptionLedger: [
              ...(stateUpdates.corruptionLedger ?? stateForHandlers.corruptionLedger),
              entry,
            ],
          }
        }
        continue
      }

      // Corruption-ledger flags (driven by CorruptionEngine.CORRUPTION_FLAG_MAP).
      const corruptionEntry = buildCorruptionEntry(stateForHandlers, flag)
      if (corruptionEntry) {
        stateUpdates = {
          ...stateUpdates,
          corruptionLedger: [
            ...(stateUpdates.corruptionLedger ?? stateForHandlers.corruptionLedger),
            corruptionEntry,
          ],
        }
      }
    }

    if (Object.keys(stateUpdates).length) {
      useGameStore.setState(stateUpdates)
    }

    // Detect project-start flags and kick off the project (multi-store flow:
    // activeProjects entry + chain-store scheduling for contractor + mid-crisis).
    for (const flag of choice.flags ?? []) {
      const projectId = PROJECT_START_FLAGS[flag]
      if (!projectId) continue
      useGameStore.getState().startProject(projectId)
      const contractorSceneId = getContractorSceneId(projectId)
      if (contractorSceneId) {
        useChainStore.getState().schedule(
          [{ targetNodeId: contractorSceneId, delayWeeks: 0 }],
          useGameStore.getState().currentWeek,
          `contractor_${projectId}`,
        )
      }
      const crisisSceneId = getMidCrisisSceneId(projectId)
      if (crisisSceneId) {
        const projectDef = (projectDefinitions as DevelopmentProject[]).find(d => d.id === projectId)
        const delay = projectDef?.durationWeeks ? Math.floor(projectDef.durationWeeks / 2) : 4
        useChainStore.getState().schedule(
          [{ targetNodeId: crisisSceneId, delayWeeks: delay }],
          useGameStore.getState().currentWeek,
          `mid_crisis_${projectId}`,
        )
      }
    }

    const newFlags      = [...new Set([...activeFlags, ...(choice.flags ?? []), ...moleConsequenceFlags])]
    const prevCodex     = get().unlockedCodexIds
    const newCodexIds   = [...new Set([...prevCodex, ...(choice.codexUnlocks ?? [])])]
    // M9 — dedup visitedSceneIds to prevent unbounded growth across chain loops
    const newVisited    = visitedSceneIds.includes(currentScene.id)
      ? visitedSceneIds
      : [...visitedSceneIds, currentScene.id]

    // Generate news articles for this choice + any flags just set
    generateNews(choice.id, useGameStore.getState(), newFlags)
    for (const flag of choice.flags ?? []) {
      generateNews(flag, useGameStore.getState(), newFlags)
    }

    // Chime when new codex entries are unlocked
    if (newCodexIds.length > prevCodex.length) {
      playCodexUnlock()
    }

    // nextNodeId chains scenes within the same agenda slot (e.g. a confrontation
    // that immediately spawns a follow-up scene without returning to the agenda).
    let nextScene: NarrativeNode | undefined
    if (choice.nextNodeId) {
      nextScene = getScene(choice.nextNodeId)
      if (!nextScene) {
        console.error(
          '[narrativeStore.processChoice] nextNodeId "' + choice.nextNodeId +
          '" not found in SCENE_REGISTRY — falling back to current scene',
        )
      }
    }

    // nextSegment branches within the current scene — load that segment's
    // narrative and choices into the current scene without ending it.
    // If neither transition resolves (e.g. a terminal choice), KEEP the
    // just-completed current scene in the store so the "Continue to Next
    // Meeting" button inside ConversationPanel can render. Setting
    // currentScene=null would short-circuit NarrativeScene.tsx's null-check
    // (line 218) and hide that button — that was the freeze bug.
    let updatedScene: NarrativeNode | null = null
    let nextSegmentId: string | null = null
    if (nextScene) {
      updatedScene = nextScene
    } else if (choice.nextSegment && currentScene.segments?.[choice.nextSegment]) {
      const seg = currentScene.segments[choice.nextSegment]
      const segNarrative = seg.narrative ??
        (seg.dialogue ? (
          Array.isArray(seg.dialogue)
            ? seg.dialogue
            : [{ type: 'description', text: seg.dialogue }]
        ) : [])
      updatedScene = {
        ...currentScene,
        narrative: segNarrative,
        choices:   seg.choices ?? [],
        monologue: seg.monologue ?? currentScene.monologue,
      }
      nextSegmentId = choice.nextSegment
    } else if (choice.nextSegment) {
      // nextSegment provided but the key is missing from this scene's segments map
      console.error(
        '[narrativeStore.processChoice] nextSegment "' + choice.nextSegment +
        '" not found in scene "' + currentScene.id + '" segments — available:',
        Object.keys(currentScene.segments ?? {}),
      )
      updatedScene = currentScene
    } else {
      // Terminal choice — keep the current scene on screen; sceneDone hides
      // the choice UI and the Continue button takes over.
      updatedScene = currentScene
      if (choice.nextNodeId) {
        console.error(
          '[narrativeStore.processChoice] Terminal choice has broken nextNodeId:',
          choice.nextNodeId,
        )
      }
    }

    const sceneDone = !nextScene && !nextSegmentId
    set({
      activeFlags:      newFlags,
      unlockedCodexIds: newCodexIds,
      visitedSceneIds:  newVisited,
      currentScene:     updatedScene,
      activeSegmentId:  nextSegmentId,
      sceneDone,
    })

    // Inject Parliamentary Bills into Decree Inbox
    if (newFlags.includes('cadre_bill_passed')) {
      const decree = ALL_DECREES.find(d => d.id === 'decree_cadre_qualifications')
      if (decree) {
        useDecreeStore.getState().addDecree(decree)
      }
    }
    if (newFlags.includes('housing_bill_passed')) {
      const decree = ALL_DECREES.find(d => d.id === 'decree_integrated_housing')
      if (decree) {
        useDecreeStore.getState().addDecree(decree)
      }
    }
    if (newFlags.includes('corporate_deal_passed')) {
      const decree = ALL_DECREES.find(d => d.id === 'decree_corporate_sweetheart')
      if (decree) {
        useDecreeStore.getState().addDecree(decree)
      }
    }
    if (import.meta.env.DEV) console.log(
      '[narrativeStore.processChoice] RESOLVED',
      '| nextScene:', nextScene?.id ?? 'null',
      '| nextSegment:', nextSegmentId,
      '| updatedSceneId:', updatedScene?.id ?? 'null',
      '| sceneDone:', !updatedScene,
    )
  },
}))

// Enable Hot Module Replacement (HMR) for Zustand store
// Preserves visited scenes, active flags, and codex unlocks across hot reloads
if (import.meta.hot) {
  import.meta.hot.accept()
}
