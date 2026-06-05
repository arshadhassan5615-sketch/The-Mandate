import { create } from 'zustand'
import type {
  BudgetAllocations, GameState, StateModifier,
  PlayerBackground, PlayerPersonality, PlayerAppearance, DiaryEntry,
  EconomicDirection, JonasPublicStage, SentLetter,
} from '../types/gameState'
import { STAT_RANGES } from '../types/gameState'
import type { RadioTheme } from '../engine/RadioEngine'
import type { ActiveProject } from '../types/projects'
import { computeBudgetModifiers } from '../engine/budgetEffects'
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

  nation: {
    economyHealth: -18,     // Stagnant, slight contraction (GDD: GDP ~2.1B, slight contraction)
    unemployment: 19,       // 19.4% per GDD
    inflation: 9,           // 8.7% per GDD, rounding up as it's rising
    nationalDebt: 340,      // 340M ₭ per GDD
    corruption: 68,         // Halvek legacy — high
    militaryReadiness: 52,  // Inherited military, functional but unreformed
    publicOrder: 55,        // Tense post-authoritarian period
    pressFreedom: 28,       // Halvek gutted it; independent radio just emerging
    mediaControl: 25,      // Elena Braskov dominates — but competition is emerging
    civilLiberties: 22,     // Halvek constitution still in force
    internationalStanding: 42, // New democracy, watched cautiously
    assemblyVoteMargin: 0,   // No vote has been held yet
  },

  factions: {
    halvekists: 48,         // 35% of seats, entrenched but losing legitimacy
    workersCoalition: 58,   // Won on coalition, cautiously supportive
    reformists: 68,         // Your base; honeymoon approval
    ironCovenant: 50,       // Military "allowed" transition; neutral-watchful
    church: 47,             // Backed Halvek; now hedging bets
    businessClass: 44,      // Uncertain about new chancellor's economic direction
    dravenni: 38,           // Suppressed under Halvek; hopeful but not won over
  },

  personal: {
    marriageHealth: 65,     // Strain of the campaign has already cost something
    lioraRelationship: 70,  // Close; she's proud but starting to have opinions
    tomasWellbeing: 60,     // Fame is harder on a 12-year-old than anyone admits
    personalWealth: 12000,  // 12,000 ₭ per GDD
    publicImage: 55,        // Honeymoon with caveats — significant opposition press
    moralCompass: 0,        // Blank slate; every decision will define this
  },

  budget: INITIAL_BUDGET,

  playerBackground:  'Academic'     as PlayerBackground,
  playerPersonality: 'Measured'     as PlayerPersonality,
  playerAppearance:  'Professional' as PlayerAppearance,
  termFocus: [] as string[],
  advisorTrust: { theron: 50, soraya: 50, dusek: 50 },
  vaelInfluence: 15,
  morvecInfluence: 0,
  shadowInfluence: 5,
  refugeeCount: 2800,
  religiousAdherence: 72,
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
  diaryEntries: [] as DiaryEntry[],
  initialSnapshot: null,
}

interface GameStore extends GameState {
  applyModifiers:  (modifiers: StateModifier[]) => void
  applyBudget:     (next: BudgetAllocations) => void
  advanceWeek:     () => void
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

// Resolve dot-notation path and apply an operation to the correct sub-object
function applyModifier(state: GameState, mod: StateModifier): GameState {
  const [group, key] = mod.stat.split('.') as [keyof GameState, string]
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

  return {
    ...state,
    [group]: { ...subState, [key]: next },
  }
}

export const useGameStore = create<GameStore>((set) => ({
  ...INITIAL_STATE,

  applyModifiers: (modifiers) =>
    set((state) => {
      let next: GameState = { ...state }
      for (const mod of modifiers) next = applyModifier(next, mod)
      return next
    }),

  applyBudget: (next) =>
    set((state) => {
      const mods = computeBudgetModifiers(state.budget, next)
      let nextState: GameState = { ...state, budget: next }
      for (const mod of mods) nextState = applyModifier(nextState, mod)
      return nextState
    }),

  advanceWeek: () =>
    set((state) => ({
      currentWeek: state.currentWeek + 1,
      currentAct: state.currentWeek >= 39 ? 4
                : state.currentWeek >= 26 ? 3
                : state.currentWeek >= 13 ? 2
                : 1,
    })),

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

  addDiaryEntry: (entry) => set((state) => ({
    diaryEntries: [...state.diaryEntries, entry],
  })),

  resetToInitial: () => set(() => ({ ...INITIAL_STATE })),
}))

// Enable Hot Module Replacement (HMR) for Zustand store
// This prevents the game state from resetting when files are saved during local development
if (import.meta.hot) {
  import.meta.hot.accept()
  import.meta.hot.dispose(() => {
    // Optional: cleanup logic if needed before module is disposed
  })
}
