import { create } from 'zustand'
import type { NarrativeNode, ChainTrigger } from '../types/narrative'
import type { NewsArticle } from '../types/news'
import { getScene, getAvailableChoices } from '../engine/NarrativeEngine'
import { evaluateAll } from '../engine/conditionEvaluator'
import { useGameStore } from './gameStore'
import { useChainStore } from './chainStore'
import { useWeekStore } from './weekStore'
import { useNewsStore } from './newsStore'
import { NEWS_TEMPLATES } from '../data/news/newsTemplates'
import { playCodexUnlock } from '../engine/audioEngine'
import { recordCorruptionFlag } from '../engine/CorruptionEngine'
import { useJournalStore } from '../stores/journalStore'
import { getJournalTemplate, getJournalCategory } from '../data/journal/templates'
import { getStructuredJournalTemplate, getStructuredJournalCategory } from '../data/journal/journalTemplates'
import type { ChoiceAlignment } from '../types/journal'
import { ALL_CLUES, getMoleConsequences } from '../engine/MoleEngine'
import type { MoleIdentity } from '../types/gameState'
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
      id: `news_${trigger}_${articles.length}_${Date.now()}`,
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
        id: `news_${trigger}_worker_${articles.length}_${Date.now()}`,
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
        id: `news_${trigger}_times_${articles.length}_${Date.now()}`,
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
        id: `news_${trigger}_gazette_${articles.length}_${Date.now()}`,
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
        id: `news_${trigger}_voice_${articles.length}_${Date.now()}`,
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

  // Called by the scene UI when the player picks an option
  processChoice: (choiceId: string) => void

  // Called by the prologue and character creation to inject flags
  addFlags: (flags: string[]) => void
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
    console.log('[narrativeStore.loadScene] id:', id)
    const gameState  = useGameStore.getState()
    const { activeFlags, metCharacters } = get()
    let target = getScene(id)
    console.log('[narrativeStore.loadScene] target found:', !!target, target?.title ?? 'null')

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

    // Track characters encountered in dialogue segments
    let newMet = metCharacters
    if (target) {
      const charsInScene = target.narrative
        .filter(seg => seg.type === 'dialogue' && seg.character)
        .map(seg => `character_${seg.character}`)
      const toAdd = charsInScene.filter(c => !newMet.includes(c))
      if (toAdd.length) newMet = [...newMet, ...toAdd]
    }

    set({ currentScene: target ?? null, sceneDone: !target, metCharacters: newMet })
    console.log('[narrativeStore.loadScene] set currentScene:', target?.id ?? 'null')
  },

  resetScene: () => {
    set({ currentScene: null, activeSegmentId: null, sceneDone: false })
  },

  addFlags: (flags) => set((state) => ({
    activeFlags: [...new Set([...state.activeFlags, ...flags])],
  })),

  processChoice: (choiceId) => {
    const { currentScene, visitedSceneIds, activeFlags } = get()
    if (!currentScene) return

    const choice = currentScene.choices.find(c => c.id === choiceId)
    if (!choice) return

    // Guard — choice conditions must pass
    const gameState = useGameStore.getState()
    const available = getAvailableChoices(currentScene, gameState, activeFlags)
    if (!available.find(c => c.id === choiceId)) return

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

    useGameStore.getState().applyModifiers(choice.stateChanges)

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

    // Detect mole clues and add them to game state
    for (const flag of choice.flags) {
      const clueMatch = flag.match(/^mole_clue_(\d+)_found$/)
      if (clueMatch) {
        const clue = ALL_CLUES.find(c => c.id === flag.replace('_found', ''))
        if (clue) {
          useGameStore.getState().discoverClue(clue)
        }
      }
    }

    // Detect mole accusation and check against identity
    let moleConsequenceFlags: string[] = []
    const accusedFlags = choice.flags.filter(f =>
      f === 'accused_petrin_half' || f === 'accused_irina_dusek' || f === 'accused_karsten_volek')
    if (accusedFlags.length > 0) {
      const moleId = useGameStore.getState().moleIdentity
      const accusedMap: Record<string, MoleIdentity> = {
        accused_petrin_half: 'petrin_half',
        accused_irina_dusek: 'irina_dusek',
        accused_karsten_volek: 'karsten_volek',
      }
      const accusedIdentity = accusedMap[accusedFlags[0]]
      const isCorrect = accusedIdentity === moleId

      if (isCorrect && moleId) {
        const consequences = getMoleConsequences(moleId, true)
        useGameStore.getState().applyModifiers(consequences.statChanges as { stat: string; operation: 'add' | 'set'; value: number }[])
        useGameStore.getState().markMoleDiscovered()
        moleConsequenceFlags = consequences.flags
      } else if (accusedIdentity) {
        const consequences = getMoleConsequences(accusedIdentity, false)
        useGameStore.getState().applyModifiers(consequences.statChanges as { stat: string; operation: 'add' | 'set'; value: number }[])
        useGameStore.getState().setMoleWronglyAccused(accusedIdentity)
        moleConsequenceFlags = consequences.flags
      }
    }

    const newFlags      = [...new Set([...activeFlags, ...choice.flags, ...moleConsequenceFlags])]
    const prevCodex     = get().unlockedCodexIds
    const newCodexIds   = [...new Set([...prevCodex, ...(choice.codexUnlocks ?? [])])]
    const newVisited    = [...visitedSceneIds, currentScene.id]

    // Generate news articles for this choice + any flags just set
    generateNews(choice.id, useGameStore.getState(), newFlags)
    for (const flag of choice.flags) {
      generateNews(flag, useGameStore.getState(), newFlags)
    }

    // Record corruption flags in the ledger (undiscovered)
    const corruptionState = useGameStore.getState()
    for (const flag of choice.flags) {
      const entry = recordCorruptionFlag(corruptionState, flag)
      if (entry) {
        useGameStore.getState().recordCorruptionEntry(entry)
      }
      // Vael kickback corruption recording
      if (flag.startsWith('kickback_accepted_')) {
        useGameStore.getState().recordCorruptionEntry({
          id: `corruption_${flag}_${Date.now()}`,
          weekRecorded: corruptionState.currentWeek,
          description: `Accepted personal kickback from Lucan Vael in exchange for project contract. Payment of 2,500-4,000 ₭ deposited in Morivask account.`,
          witnesses: ['lucan_vael'],
          evidence: 'Offshore bank records in Morivask',
          discovered: false,
          discoveryWeek: null,
        })
      }
    }

    // Detect State of Emergency flag and activate SOE in game state
    if (choice.flags.includes('state_of_emergency')) {
      useGameStore.getState().declareStateOfEmergency()
    }
    if (choice.flags.includes('serida_died_bombing')) {
      useGameStore.getState().setSeridaDead()
    }
    if (choice.flags.includes('soe_expired')) {
      useGameStore.getState().liftStateOfEmergency()
    }
    if (choice.flags.includes('soe_extended')) {
      useGameStore.getState().extendStateOfEmergency()
    }

    // Detect Soren plotline flags
    if (choice.flags.includes('soren_immunity_revoked') || choice.flags.includes('soren_immunity_limited_revoked')) {
      useGameStore.getState().revokeSorenImmunity()
    }
    if (choice.flags.includes('soren_files_revealed')) {
      const linkedToMikhael = choice.flags.includes('soren_linked_to_mikhael')
      useGameStore.getState().revealSorenFiles(linkedToMikhael)
    }
    if (choice.flags.includes('soren_trial_public')) {
      useGameStore.getState().setSorenTrialOutcome('public_trial')
    }
    if (choice.flags.includes('soren_trial_plea')) {
      useGameStore.getState().setSorenTrialOutcome('plea_deal')
    }
    if (choice.flags.includes('soren_left_alone')) {
      useGameStore.getState().setSorenTrialOutcome('left_alone')
    }
    if (choice.flags.includes('soren_files_public')) {
      useGameStore.getState().setSorenTrialOutcome('files_released')
    }
    if (choice.flags.includes('soren_leveraged')) {
      useGameStore.getState().setSorenTrialOutcome('political_leverage')
    }

    // Detect economic direction flag
    if (choice.flags.includes('economy_free_market')) {
      useGameStore.getState().setEconomicDirection('free_market')
    }
    if (choice.flags.includes('economy_planned')) {
      useGameStore.getState().setEconomicDirection('planned')
    }
    if (choice.flags.includes('economy_mixed')) {
      useGameStore.getState().setEconomicDirection('mixed')
    }
    if (choice.flags.includes('economy_pragmatic')) {
      useGameStore.getState().setEconomicDirection('pragmatic')
    }

    // Detect Serida Valk scene outcomes
    if (choice.flags.includes('serida_warm_intro')) {
      useGameStore.getState().setSeridaTrust(20)
      useGameStore.getState().setSeridaMorale(10)
    }
    if (choice.flags.includes('serida_school_heard')) {
      useGameStore.getState().setSeridaTrust(10)
      useGameStore.getState().setSeridaMorale(5)
    }
    if (choice.flags.includes('serida_school_dismissed')) {
      useGameStore.getState().setSeridaTrust(-5)
      useGameStore.getState().setSeridaMorale(-10)
    }
    if (choice.flags.includes('serida_factory_positive')) {
      useGameStore.getState().setSeridaTrust(15)
      useGameStore.getState().setSeridaMorale(15)
    }
    if (choice.flags.includes('serida_heard_something')) {
      useGameStore.getState().setSeridaTrust(15)
    }
    if (choice.flags.includes('serida_sent_home')) {
      useGameStore.getState().setSeridaTrust(10)
      useGameStore.getState().setSeridaMorale(8)
    }
    if (choice.flags.includes('serida_stayed_late')) {
      useGameStore.getState().setSeridaMorale(-10)
    }
    if (choice.flags.includes('serida_refugees_kind')) {
      useGameStore.getState().setSeridaTrust(10)
      useGameStore.getState().setSeridaMorale(10)
    }
    if (choice.flags.includes('serida_refugees_policy')) {
      useGameStore.getState().setSeridaTrust(-3)
      useGameStore.getState().setSeridaMorale(-5)
    }
    if (choice.flags.includes('serida_epilogue_positive')) {
      useGameStore.getState().setSeridaTrust(20)
      useGameStore.getState().setSeridaMorale(20)
    }

    // Detect project-start flags and kick off the project
    for (const flag of choice.flags) {
      const projectId = PROJECT_START_FLAGS[flag]
      if (projectId) {
        useGameStore.getState().startProject(projectId)
        // Schedule contractor selection scene for this project
        const contractorSceneId = getContractorSceneId(projectId)
        if (contractorSceneId) {
          useChainStore.getState().schedule(
            [{ targetNodeId: contractorSceneId, delayWeeks: 0 }],
            useGameStore.getState().currentWeek,
            `contractor_${projectId}`,
          )
        }
        // Schedule mid-project crisis scene
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
    }

    // Chime when new codex entries are unlocked
    if (newCodexIds.length > prevCodex.length) {
      playCodexUnlock()
    }

    // nextNodeId chains scenes within the same agenda slot (e.g. a confrontation
    // that immediately spawns a follow-up scene without returning to the agenda).
    let nextScene: NarrativeNode | undefined
    if (choice.nextNodeId) nextScene = getScene(choice.nextNodeId)

    // nextSegment branches within the current scene — load that segment's
    // narrative and choices into the current scene without ending it.
    let updatedScene = nextScene ?? null
    let nextSegmentId: string | null = null
    if (!nextScene && choice.nextSegment && currentScene.segments?.[choice.nextSegment]) {
      const seg = currentScene.segments[choice.nextSegment]
      // Create a new scene object with the segment's narrative + choices
      updatedScene = { ...currentScene, narrative: seg.narrative, choices: seg.choices, monologue: seg.monologue ?? currentScene.monologue }
      nextSegmentId = choice.nextSegment
    }

    set({
      activeFlags:      newFlags,
      unlockedCodexIds: newCodexIds,
      visitedSceneIds:  newVisited,
      currentScene:     updatedScene,
      activeSegmentId:  nextSegmentId,
      sceneDone:        !updatedScene,
    })
  },
}))
