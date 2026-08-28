import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  BudgetAllocations, GameState, StateModifier, EffectLogEntry,
  PlayerBackground, PlayerPersonality, PlayerAppearance, DiaryEntry,
  EconomicDirection, JonasPublicStage, SentLetter,
} from '../types/gameState'
import { STAT_RANGES } from '../types/gameState'
import type { RadioTheme } from '../engine/RadioEngine'
import type { ActiveProject } from '../types/projects'
import { computeBudgetModifiers } from '../engine/budgetEffects'
import { useNarrativeStore } from './narrativeStore'
import projectDefinitions from '../data/projects.json'
import type { DevelopmentProject } from '../types/projects'

// GDD Section 8.1 — Fiscal Year 1963-64 starting allocations
const INITIAL_BUDGET: BudgetAllocations = {
  taxRevenue:     285,
  stateIndustry:   55,
  customsTariffs:  30,
  foreignAid:      10,
  military:       120,
  debtService:     75,
  govtAdmin:       65,
  infrastructure:  55,
  education:       45,
  healthcare:      40,
  welfare:         25,
  bniSecurity:     20,
}

// GDD Week 1, 1963 — Katerin has just taken office
export const INITIAL_STATE: GameState = {
  currentWeek: 1,
  currentAct: 1,
  furthestWeek: 1,

  nation: {
    economyHealth: -18,     // Stagnant, slight contraction (GDD: GDP ~2.1B, slight contraction)
    unemployment: 19,       // 19.4% per GDD
    inflation: 9,           // 8.7% per GDD, rounding up as it's rising
    nationalDebt: 340,      // 340M ₭ per GDD
    corruption: 68,         // Halvek legacy — high
    militaryReadiness: 52,  // Inherited military, functional but unreformed
    militaryTech: 35,       // Halvek-era equipment, overdue for procurement
    publicOrder: 55,        // Tense post-authoritarian period
    pressFreedom: 28,       // Halvek gutted it; independent radio just emerging
    mediaControl: 25,      // Elena Braskov dominates — but competition is emerging
    civilLiberties: 22,     // Halvek constitution still in force
    lawOrder: 50,
    internationalStanding: 42, // New democracy, watched cautiously
    assemblyVoteMargin: 0,   // No vote has been held yet
    assemblyConservative: 30,
    assemblyHardliner: 20,
    assemblyReformist: 40,
    energyIndependence: 40,
    conventionStability: 50,
    educationStandard: 45,
    regionalSupport: 30,
  },

  factions: {
    halvekists: 48,         // 35% of seats, entrenched but losing legitimacy
    workersCoalition: 58,   // Won on coalition, cautiously supportive
    reformists: 68,         // Your base; honeymoon approval
    ironCovenant: 50,       // Military "allowed" transition; neutral-watchful
    church: 47,             // Backed Halvek; now hedging bets
    businessClass: 44,      // Uncertain about new chancellor's economic direction
    dravenni: 38,           // Suppressed under Halvek; hopeful but not won over
    partyLoyalists: 50,
  },

  personal: {
    marriageHealth: 65,     // Strain of the campaign has already cost something
    lioraRelationship: 70,  // Close; she's proud but starting to have opinions
    tomasWellbeing: 60,     // Fame is harder on a 12-year-old than anyone admits
    personalWealth: 12000,  // 12,000 ₭ per GDD
    publicImage: 55,        // Honeymoon with caveats — significant opposition press
    moralCompass: 0,        // Blank slate; every decision will define this
    stressLevel: 15,
    fiscalRestraint: 50,
  },

  budget: INITIAL_BUDGET,

  playerBackground:  'Academic'     as PlayerBackground,
  playerPersonality: 'Measured'     as PlayerPersonality,
  playerAppearance:  'Professional' as PlayerAppearance,
  termFocus: [] as string[],
  advisorTrust: { vyktor: 50, danika: 50, theron: 50, soraya: 50, dusek: 50, valdek: 50 },
  vaelInfluence: 15,
  morvecInfluence: 0,
  shadowInfluence: 5,
  shadowFootprint: 0,
  // Spy Master
  activeAgents: 2,
  maxAgents: 3,
  activeOperations: 0,
  tyvarenHostility: 0,
  vossRelation: 0,
  sovarka_relation: 0,
  danika_loyalty: 50,
  refugeeCount: 2800,
  religiousAdherence: 72,
  // Dynamic Polling — inauguration-day honeymoon (61% by Week 4 per GDD narrative)
  playerPolling: 68,
  kolvarPolling: 24,
  stateOfEmergency: false,
  stateOfEmergencyWeek: 0,
  stateOfEmergencyExtensions: 0,
  emergencyDecreesIssued: 0,
  seridaAlive: true,
  moleIdentity: null,
  clues: [] as import('../types/gameState').Clue[],
  moleDiscovered: false,
  moleWronglyAccused: null,
  sorenImmunityRevoked: false,
  sorenTrialOutcome: null,
  sorenFilesRevealed: false,
  sorenLinkedToMikhael: false,
  economicDirection: null,
  jonasPublicStage: 'supportive_spouse',
  securityPosture: 'standard',
  seridaTrust: 50,
  seridaMorale: 70,
  sentLetters: [] as import('../types/gameState').SentLetter[],
  radioBroadcastsUsed: 0,
  corruptionLedger: [],
  corruptionDiscoveredCount: 0,
  voteSpendingTotal: 0,
  activeProjects: [] as ActiveProject[],
  completedProjects: [] as string[],
  personalNotes: '',
  journalReflections: [] as Array<{ week: number; text: string; date: string }>,
  diaryEntries: [] as DiaryEntry[],
  economyHistory: [] as Array<{ week: number; value: number }>,
  debtHistory: [] as Array<{ week: number; value: number }>,
  inflationHistory: [] as Array<{ week: number; value: number }>,
  publicOrderHistory: [] as Array<{ week: number; value: number }>,
  effectLog: [] as EffectLogEntry[],
  lastParliamentWeek: 0,
  emergencyParliamentFlag: false,
  initialSnapshot: null,
}

interface GameStore extends GameState {
  applyModifiers:  (modifiers: StateModifier[]) => void
  applyBudget:     (next: BudgetAllocations) => void
  advanceWeek:     () => void
  // Dev tools
  devSetWeek:      (week: number) => void
  devSetStat:      (stat: string, value: number) => void
  setPlayerOptions: (opts: {
    background:  PlayerBackground
    personality: PlayerPersonality
    appearance:  PlayerAppearance
  }) => void
  setTermFocus:      (focus: string[]) => void
  setVaelInfluence:  (value: number) => void
  setMorvecInfluence: (value: number) => void
  // Economic direction
  setEconomicDirection:  (direction: import('../types/gameState').EconomicDirection) => void
  // Jonas public role
  setJonasPublicStage:   (stage: import('../types/gameState').JonasPublicStage) => void
  // State of Emergency
  declareStateOfEmergency:  () => void
  extendStateOfEmergency:   () => void
  liftStateOfEmergency:     () => void
  issueEmergencyDecree:     () => void
  setSeridaDead:            () => void
  // Serida Valk tracking
  setSeridaTrust:   (value: number) => void
  setSeridaMorale:  (value: number) => void
  // Letters
  sendLetter:                 (letter: import('../types/gameState').SentLetter) => void
  markLetterResponseArrived:  (letterId: string) => void
  // Radio broadcasts
  useRadioBroadcast:  (theme: RadioTheme) => void
  // Spy / Mole
  randomizeMoleIdentity:   () => void
  discoverClue:             (clue: import('../types/gameState').Clue) => void
  markMoleDiscovered:       () => void
  setMoleWronglyAccused:    (identity: string) => void
  // Soren prosecution
  revokeSorenImmunity:      () => void
  setSorenTrialOutcome:     (outcome: string) => void
  revealSorenFiles:         (linkedToMikhael: boolean) => void
  // Projects
  startProject:      (projectId: string) => void
  advanceProjectWeek: (projectId: string) => void
  completeProject:   (projectId: string) => void
  cancelProject:     (projectId: string) => void
  resolveMidpoint:   (projectId: string, choiceId: string) => void
  setPersonalNotes:  (notes: string) => void
  addJournalReflection: (week: number, text: string) => void
  addDiaryEntry:     (entry: DiaryEntry) => void
  captureSnapshot:            () => void
  resetToInitial:             () => void
  recordCorruptionEntry:      (entry: import('../types/gameState').CorruptionEntry) => void
  applyDiscoveredCorruption:  (entries: import('../types/gameState').CorruptionEntry[]) => void
}

function clamp(stat: string, value: number): number {
  const range = STAT_RANGES[stat]
  if (!range) return value
  const [min, max] = range
  return Math.max(min, Math.min(max === Infinity ? value : max, value))
}

/** Append one effect-log entry; keep newest 500 to bound save size. */
function withEffectLog(
  state: GameState,
  entry: EffectLogEntry,
): EffectLogEntry[] {
  return [...(state.effectLog ?? []), entry].slice(-500)
}

// Resolve dot-notation path and apply an operation to the correct sub-object
function applyModifier(state: GameState, mod: StateModifier): GameState {
  // ── H1 fix: legacy stat-path aliases ───────────────────────────────
  // Older scene JSONs reference flat or misnamed stats. Map them to the
  // canonical top-level / dotted paths so modifiers land on the right field.
  const PATH_ALIASES: Record<string, string> = {
    'public_trust': 'factions.reformists',
    'reformist_credibility': 'factions.reformists',
    'budget': 'nation.nationalDebt',
    'business_confidence': 'factions.businessClass',
    'economy': 'nation.economyHealth',
    'assembly_support': 'factions.reformists',
    'labor_approval': 'factions.workersCoalition',
    'security_rating': 'factions.ironCovenant',
    'church_relations': 'factions.church',
    'military_confidence': 'factions.ironCovenant',
    'civil_liberties': 'nation.civilLiberties',
    'law_order': 'nation.lawOrder',
    'assembly_conservative': 'nation.assemblyConservative',
    'assembly_hardliner': 'nation.assemblyHardliner',
    'assembly_reformist': 'nation.assemblyReformist',
    'international_standing': 'nation.internationalStanding',
    'tyvaren_tension': 'tyvarenHostility',
    'personal.wealth': 'personal.personalWealth',
    'personal.stressLevel': 'personal.stressLevel',
    'personal.shadowInfluence': 'shadowInfluence',
    'moralCompass': 'personal.moralCompass',
    'nationalDebt': 'nation.nationalDebt',
    'factions.party_loyalists': 'factions.partyLoyalists',
    'convention_stability': 'nation.conventionStability',
    'education_standard': 'nation.educationStandard',
    'education_index': 'nation.educationStandard',
    'regional_support': 'nation.regionalSupport',
    'military_readiness': 'nation.militaryReadiness',
    'public_order': 'nation.publicOrder',
    'reformist_support': 'factions.reformists',
    'oligarch_relations': 'factions.businessClass',
  }
  const resolvedStat = PATH_ALIASES[mod.stat] ?? mod.stat
  mod = { ...mod, stat: resolvedStat }

  const dot = mod.stat.indexOf('.')

  // Dotless stat — operates directly on a top-level gameState field
  // (e.g. vaelInfluence, shadowInfluence, tyvarenHostility, morvecInfluence).
  if (dot === -1) {
    const field = mod.stat as keyof GameState
    if (!(field in state)) {
      console.warn(`[gameStore] Unknown stat path: ${mod.stat}`)
      return state
    }
    const current = state[field] as unknown as number
    if (typeof current !== 'number') {
      console.warn(`[gameStore] Stat path is not numeric: ${mod.stat}`)
      return state
    }
    let next: number
    switch (mod.operation) {
      case 'add':      next = current + mod.value; break
      case 'set':      next = mod.value; break
      case 'multiply': next = current * mod.value; break
    }
    next = clamp(mod.stat, next)
    // StateModifier carries no source metadata — placeholder until callers tag it.
    const logEntry: EffectLogEntry = {
      week: state.currentWeek,
      stat: mod.stat,
      delta: next - current,
      operation: mod.operation,
      sourceType: 'unknown',
      sourceId: 'unknown',
    }
    return {
      ...state,
      [field]: next,
      effectLog: withEffectLog(state, logEntry),
    }
  }

  // Dotted stat — group.key into nation / factions / personal / etc.
  const group = mod.stat.slice(0, dot) as keyof GameState
  const key   = mod.stat.slice(dot + 1)
  const subState = state[group] as unknown as Record<string, number>
  if (typeof subState !== 'object' || !(key in subState)) {
    console.warn(`[gameStore] Unknown stat path: ${mod.stat}`)
    return state
  }

  const current = subState[key] as number
  let next: number
  switch (mod.operation) {
    case 'add':      next = current + mod.value; break
    case 'set':      next = mod.value; break
    case 'multiply': next = current * mod.value; break
  }
  next = clamp(mod.stat, next)

  // StateModifier carries no source metadata — placeholder until callers tag it.
  const logEntry: EffectLogEntry = {
    week: state.currentWeek,
    stat: mod.stat,
    delta: next - current,
    operation: mod.operation,
    sourceType: 'unknown',
    sourceId: 'unknown',
  }
  return {
    ...state,
    [group]: { ...subState, [key]: next },
    effectLog: withEffectLog(state, logEntry),
  }
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,

      applyModifiers: (modifiers) =>
    set((state) => {
      let next: GameState = { ...state }
      for (const mod of modifiers) next = applyModifier(next, mod)
      return next
    }),

  applyBudget: (next) =>
    set((state) => {
      const { modifiers, flags } = computeBudgetModifiers(state.budget, next)
      let nextState: GameState = { ...state, budget: next }
      for (const mod of modifiers) nextState = applyModifier(nextState, mod)
      if (flags) useNarrativeStore.getState().addFlags(flags)
      return nextState
    }),

  advanceWeek: () =>
    set((state) => {
      const newWeek = state.currentWeek + 1
      const newState = {
        ...state,
        currentWeek: newWeek,
        currentAct: state.currentWeek >= 39 ? 4
                  : state.currentWeek >= 26 ? 3
                  : state.currentWeek >= 13 ? 2
                  : 1,
        furthestWeek: Math.max(state.furthestWeek, newWeek),
      }
      // Dexie SaveManager is the only save system — no localStorage fallback
      if (import.meta.env.DEV) {
        console.log(`[gameStore] Week ${newState.currentWeek} advanced.`)
      }
      return newState
    }),

  // Dev tool — set the week directly. Act derivation copies advanceWeek's
  // ternary exactly: advanceWeek evaluates it against the pre-increment week
  // (entering week N derives act from N-1), so the same holds here.
  devSetWeek: (week) =>
    set(() => ({
      currentWeek: week,
      currentAct: week - 1 >= 39 ? 4
                : week - 1 >= 26 ? 3
                : week - 1 >= 13 ? 2
                : 1,
    })),

  // Dev tool — set a stat via the existing applyModifiers pipeline
  devSetStat: (stat, value) => {
    useGameStore.getState().applyModifiers([{ stat, operation: 'set', value }])
  },

  setPlayerOptions: ({ background, personality, appearance }) =>
    set(() => ({
      playerBackground:  background,
      playerPersonality: personality,
      playerAppearance:  appearance,
    })),

  setTermFocus: (focus) => set(() => ({ termFocus: focus })),

  setVaelInfluence: (value) => set(() => ({
    vaelInfluence: clamp('vaelInfluence', value),
  })),

  setMorvecInfluence: (value) => set(() => ({
    morvecInfluence: clamp('morvecInfluence', value),
  })),

  declareStateOfEmergency: () => set((state) => ({
    stateOfEmergency: true,
    stateOfEmergencyWeek: state.currentWeek,
    stateOfEmergencyExtensions: 0,
    emergencyDecreesIssued: 0,
  })),

  extendStateOfEmergency: () => set((state) => ({
    stateOfEmergencyExtensions: state.stateOfEmergencyExtensions + 1,
    stateOfEmergencyWeek: state.currentWeek,
  })),

  liftStateOfEmergency: () => set(() => ({
    stateOfEmergency: false,
    stateOfEmergencyWeek: 0,
  })),

  issueEmergencyDecree: () => set((state) => ({
    emergencyDecreesIssued: state.emergencyDecreesIssued + 1,
    personal: {
      ...state.personal,
      moralCompass: clamp('personal.moralCompass', state.personal.moralCompass - 5),
    },
  })),

  setSeridaDead: () => set(() => ({
    seridaAlive: false,
  })),

  randomizeMoleIdentity: () => {
    const pool: import('../types/gameState').MoleIdentity[] = ['petrin_half', 'irina_dusek', 'karsten_volek']
    const idx = Math.floor(Math.random() * pool.length)
    set(() => ({ moleIdentity: pool[idx] }))
  },

  discoverClue: (clue) => set((state) => {
    if (state.clues.some(c => c.id === clue.id)) return state
    return {
      clues: [...state.clues, { ...clue, weekDiscovered: state.currentWeek }],
    }
  }),

  markMoleDiscovered: () => set(() => ({ moleDiscovered: true })),
  setMoleWronglyAccused: (identity) => set(() => ({ moleWronglyAccused: identity })),

  revokeSorenImmunity: () => set(() => ({ sorenImmunityRevoked: true })),
  setSorenTrialOutcome: (outcome) => set(() => ({ sorenTrialOutcome: outcome })),
  revealSorenFiles: (linkedToMikhael) => set(() => ({
    sorenFilesRevealed: true,
    sorenLinkedToMikhael: linkedToMikhael,
  })),
  // Economic direction
  setEconomicDirection: (direction: EconomicDirection) => set(() => ({
    economicDirection: direction,
  })),
  // Jonas public role
  setJonasPublicStage: (stage: JonasPublicStage) => set(() => ({
    jonasPublicStage: stage,
  })),
  // Serida
  setSeridaTrust: (v: number) => set((state) => {
    const next = state.seridaTrust + v
    return { seridaTrust: clamp('seridaTrust', Math.max(0, next)) }
  }),
  setSeridaMorale: (v: number) => set((state) => {
    const next = state.seridaMorale + v
    return { seridaMorale: clamp('seridaMorale', Math.max(0, next)) }
  }),
  // Letters
  sendLetter: (letter: SentLetter) => set((state) => ({
    sentLetters: [...state.sentLetters, letter],
  })),
  markLetterResponseArrived: (letterId: string) => set((state) => ({
    sentLetters: state.sentLetters.map(l =>
      l.id === letterId ? { ...l, responseArrived: true } : l
    ),
  })),
  // Radio broadcasts
  useRadioBroadcast: (_theme: RadioTheme) => set((state) => ({
    radioBroadcastsUsed: state.radioBroadcastsUsed + 1,
  })),

  recordCorruptionEntry: (entry) => set((state) => ({
    corruptionLedger: [...state.corruptionLedger, entry],
  })),

  applyDiscoveredCorruption: (newEntries) => set((state) => {
    const updated = state.corruptionLedger.map(existing => {
      const match = newEntries.find(e => e.description === existing.description)
      return match ? { ...existing, discovered: true, discoveryWeek: match.discoveryWeek } : existing
    })
    // Add any completely new entries that weren't in the ledger
    for (const entry of newEntries) {
      if (!updated.some(e => e.description === entry.description)) {
        updated.push(entry)
      }
    }
    return {
      corruptionLedger: updated,
      corruptionDiscoveredCount: updated.filter(e => e.discovered).length,
    }
  }),

  captureSnapshot: () => set((state) => ({
    initialSnapshot: { ...state, initialSnapshot: null },
  })),

  startProject: (projectId) => {
    const defs = projectDefinitions as DevelopmentProject[]
    const def = defs.find(d => d.id === projectId)
    if (!def) return

    set((state) => {
      const active: ActiveProject = {
        projectId,
        startedWeek: state.currentWeek,
        currentWeek: 0,
        phase: 'active',
        midpointResolved: false,
        totalCost: def.cost,
      }
      return {
        activeProjects: [...state.activeProjects, active],
      }
    })
  },

  advanceProjectWeek: (projectId) =>
    set((state) => ({
      activeProjects: state.activeProjects.map(p =>
        p.projectId === projectId ? { ...p, currentWeek: p.currentWeek + 1 } : p
      ),
    })),

  completeProject: (projectId) => {
    const defs = projectDefinitions as DevelopmentProject[]
    const def = defs.find(d => d.id === projectId)
    if (!def) return

    set((state) => {
      let next: GameState = {
        ...state,
        activeProjects: state.activeProjects.map(p =>
          p.projectId === projectId ? { ...p, phase: 'completed' as const } : p
        ),
        completedProjects: [...state.completedProjects, projectId],
      }
      for (const mod of def.effects) next = applyModifier(next, mod)
      return next
    })
  },

  cancelProject: (projectId) =>
    set((state) => ({
      activeProjects: state.activeProjects.map(p =>
        p.projectId === projectId ? { ...p, phase: 'cancelled' as const } : p
      ),
      personal: { ...state.personal, publicImage: clamp('personal.publicImage', state.personal.publicImage - 5) },
    })),

  resolveMidpoint: (projectId, choiceId) => {
    const defs = projectDefinitions as DevelopmentProject[]
    const def = defs.find(d => d.id === projectId)
    if (!def) return

    const choice = def.midpointChoices.find(c => c.id === choiceId)
    if (!choice) return

    set((state) => {
      let next: GameState = {
        ...state,
        activeProjects: state.activeProjects.map(p =>
          p.projectId === projectId
            ? { ...p, midpointResolved: true, totalCost: p.totalCost + (choice.costChange ?? 0) }
            : p
        ),
      }
      for (const mod of choice.effects) next = applyModifier(next, mod)
      return next
    })
  },

  setPersonalNotes: (notes) => set({ personalNotes: notes.slice(0, 50000) }),

  addJournalReflection: (week, text) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const d = new Date(1963, 0, 1)
    d.setDate(d.getDate() + (week - 1) * 7)
    const date = d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    const entry = { week, text: trimmed.slice(0, 2000), date }
    set((state) => {
      const existing = state.journalReflections.findIndex(e => e.week === week)
      if (existing >= 0) {
        const updated = [...state.journalReflections]
        updated[existing] = entry
        return { journalReflections: updated }
      }
      return { journalReflections: [...state.journalReflections, entry] }
    })
  },

  addDiaryEntry: (entry) => set((state) => ({
    diaryEntries: [...state.diaryEntries, entry],
  })),

  resetToInitial: () => {
    // Unconditional reset — do NOT read from localStorage. A "New Game"
    // must always start from INITIAL_STATE, never restore an old save.
    set(() => ({ ...INITIAL_STATE }))
  },
    }),
    {
      name: 'the-mandate-save',
      version: 2,
      // Only persist plain data fields — never functions (actions)
      partialize: (state) => ({
        currentWeek: state.currentWeek,
        currentAct: state.currentAct,
        nation: state.nation,
        factions: state.factions,
        personal: state.personal,
        budget: state.budget,
        playerBackground: state.playerBackground,
        playerPersonality: state.playerPersonality,
        playerAppearance: state.playerAppearance,
        termFocus: state.termFocus,
        advisorTrust: state.advisorTrust,
        vaelInfluence: state.vaelInfluence,
        morvecInfluence: state.morvecInfluence,
        shadowInfluence: state.shadowInfluence,
        shadowFootprint: state.shadowFootprint,
        tyvarenHostility: state.tyvarenHostility,
        vossRelation: state.vossRelation,
        sovarka_relation: state.sovarka_relation,
        danika_loyalty: state.danika_loyalty,
        refugeeCount: state.refugeeCount,
        religiousAdherence: state.religiousAdherence,
        playerPolling: state.playerPolling,
        kolvarPolling: state.kolvarPolling,
        activeAgents: state.activeAgents,
        maxAgents: state.maxAgents,
        activeOperations: state.activeOperations,
        stateOfEmergency: state.stateOfEmergency,
        stateOfEmergencyWeek: state.stateOfEmergencyWeek,
        stateOfEmergencyExtensions: state.stateOfEmergencyExtensions,
        emergencyDecreesIssued: state.emergencyDecreesIssued,
        seridaAlive: state.seridaAlive,
        moleIdentity: state.moleIdentity,
        clues: state.clues,
        moleDiscovered: state.moleDiscovered,
        moleWronglyAccused: state.moleWronglyAccused,
        sorenImmunityRevoked: state.sorenImmunityRevoked,
        sorenTrialOutcome: state.sorenTrialOutcome,
        sorenFilesRevealed: state.sorenFilesRevealed,
        sorenLinkedToMikhael: state.sorenLinkedToMikhael,
        economicDirection: state.economicDirection,
        jonasPublicStage: state.jonasPublicStage,
        seridaTrust: state.seridaTrust,
        seridaMorale: state.seridaMorale,
        sentLetters: state.sentLetters,
        radioBroadcastsUsed: state.radioBroadcastsUsed,
        corruptionLedger: state.corruptionLedger,
        corruptionDiscoveredCount: state.corruptionDiscoveredCount,
        voteSpendingTotal: state.voteSpendingTotal,
        activeProjects: state.activeProjects,
        completedProjects: state.completedProjects,
        personalNotes: state.personalNotes,
        diaryEntries: state.diaryEntries,
        economyHistory: state.economyHistory,
        debtHistory: state.debtHistory,
        inflationHistory: state.inflationHistory,
        publicOrderHistory: state.publicOrderHistory,
        effectLog: state.effectLog,
        lastParliamentWeek: state.lastParliamentWeek,
        emergencyParliamentFlag: state.emergencyParliamentFlag,
        initialSnapshot: state.initialSnapshot,
      }),
      migrate: (persistedState: unknown, version: number) => {
        if (version === 0 || version === 1) {
          return {
            ...INITIAL_STATE,
            ...(persistedState as object),
          }
        }
        return persistedState
      },
    }
  )
)

// Enable Hot Module Replacement (HMR) for Zustand store
// This prevents the game state from resetting when files are saved during local development
if (import.meta.hot) {
  import.meta.hot.accept()
  import.meta.hot.dispose(() => {
    // Optional: cleanup logic if needed before module is disposed
  })
}
