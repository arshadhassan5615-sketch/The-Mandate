// Declarative flag-to-state map for narrative choices.
// Each handler returns a Partial<GameState> that the caller merges into the
// game store via setState(...). This keeps the engine content-agnostic —
// adding a new choice flag = adding a row here, not editing processChoice.
//
// Complex multi-store flows (mole accusation consequences, project starts with
// chain scheduling) live in helper functions below the record so they can do
// work beyond a simple state patch.

import { STAT_RANGES, type CorruptionEntry, type GameState, type StateModifier } from '../types/gameState'
import type { SceneChoice } from '../types/narrative'
import { ALL_CLUES, getMoleConsequences } from './MoleEngine'
import { recordCorruptionFlag } from './CorruptionEngine'

// ---------- clamp helper (mirrors gameStore.clamp) ----------

function clamp(stat: string, value: number): number {
  const range = STAT_RANGES[stat]
  if (!range) return value
  const [min, max] = range
  return Math.max(min, Math.min(max === Infinity ? value : max, value))
}

function addClamped(stat: string, current: number, delta: number): number {
  return clamp(stat, current + delta)
}

// ---------- handler type ----------

export type FlagHandler = (
  state: GameState,
  choice: SceneChoice,
  flag: string,
) => Partial<GameState>

// ---------- declarative state-mutation map ----------

export const FLAG_HANDLERS: Record<string, FlagHandler> = {
  // ===== State of Emergency =====
  'state_of_emergency': (state) => ({
    stateOfEmergency: true,
    stateOfEmergencyWeek: state.currentWeek,
    stateOfEmergencyExtensions: 0,
    emergencyDecreesIssued: 0,
  }),
  'soe_extended': (state) => ({
    stateOfEmergencyExtensions: state.stateOfEmergencyExtensions + 1,
    stateOfEmergencyWeek: state.currentWeek,
  }),
  'soe_expired': () => ({
    stateOfEmergency: false,
    stateOfEmergencyWeek: 0,
  }),

  // ===== Serida assassination =====
  'serida_died_bombing': () => ({ seridaAlive: false }),

  // ===== Soren prosecution =====
  'soren_immunity_revoked':        () => ({ sorenImmunityRevoked: true }),
  'soren_immunity_limited_revoked': () => ({ sorenImmunityRevoked: true }),
  'soren_files_revealed': (_state, choice) => ({
    sorenFilesRevealed: true,
    sorenLinkedToMikhael: (choice.flags ?? []).includes('soren_linked_to_mikhael'),
  }),
  'soren_trial_public': () => ({ sorenTrialOutcome: 'public_trial' }),
  'soren_trial_plea':   () => ({ sorenTrialOutcome: 'plea_deal' }),
  'soren_left_alone':   () => ({ sorenTrialOutcome: 'left_alone' }),
  'soren_files_public': () => ({ sorenTrialOutcome: 'files_released' }),
  'soren_leveraged':    () => ({ sorenTrialOutcome: 'political_leverage' }),

  // ===== Economic direction =====
  'economy_free_market': () => ({ economicDirection: 'free_market' }),
  'economy_planned':     () => ({ economicDirection: 'planned' }),
  'economy_mixed':       () => ({ economicDirection: 'mixed' }),
  'economy_pragmatic':   () => ({ economicDirection: 'pragmatic' }),

  // ===== Serida Valk scene outcomes =====
  'serida_warm_intro': (s) => ({
    seridaTrust:  addClamped('seridaTrust',  s.seridaTrust,  20),
    seridaMorale: addClamped('seridaMorale', s.seridaMorale, 10),
  }),
  'serida_school_heard': (s) => ({
    seridaTrust:  addClamped('seridaTrust',  s.seridaTrust,  10),
    seridaMorale: addClamped('seridaMorale', s.seridaMorale,  5),
  }),
  'serida_school_dismissed': (s) => ({
    seridaTrust:  addClamped('seridaTrust',  s.seridaTrust,  -5),
    seridaMorale: addClamped('seridaMorale', s.seridaMorale, -10),
  }),
  'serida_factory_positive': (s) => ({
    seridaTrust:  addClamped('seridaTrust',  s.seridaTrust,  15),
    seridaMorale: addClamped('seridaMorale', s.seridaMorale, 15),
  }),
  'serida_heard_something': (s) => ({
    seridaTrust: addClamped('seridaTrust', s.seridaTrust, 15),
  }),
  'serida_sent_home': (s) => ({
    seridaTrust:  addClamped('seridaTrust',  s.seridaTrust,  10),
    seridaMorale: addClamped('seridaMorale', s.seridaMorale,  8),
  }),
  'serida_stayed_late': (s) => ({
    seridaMorale: addClamped('seridaMorale', s.seridaMorale, -10),
  }),
  'serida_refugees_kind': (s) => ({
    seridaTrust:  addClamped('seridaTrust',  s.seridaTrust,  10),
    seridaMorale: addClamped('seridaMorale', s.seridaMorale, 10),
  }),
  'serida_refugees_policy': (s) => ({
    seridaTrust:  addClamped('seridaTrust',  s.seridaTrust,  -3),
    seridaMorale: addClamped('seridaMorale', s.seridaMorale, -5),
  }),
  'serida_epilogue_positive': (s) => ({
    seridaTrust:  addClamped('seridaTrust',  s.seridaTrust,  20),
    seridaMorale: addClamped('seridaMorale', s.seridaMorale, 20),
  }),
}

// ---------- regex / prefix patterns (loop-based dispatch) ----------

/** `mole_clue_<n>_found` — discover a Clue object and add it to state.clues. */
export const MOLE_CLUE_PATTERN = /^mole_clue_(\d+)_found$/

export function handleMoleClue(flag: string, state: GameState): Partial<GameState> | null {
  if (!MOLE_CLUE_PATTERN.test(flag)) return null
  const clue = ALL_CLUES.find(c => c.id === flag.replace('_found', ''))
  if (!clue) return null
  if (state.clues.some(c => c.id === clue.id)) return null
  return {
    clues: [...state.clues, { ...clue, weekDiscovered: state.currentWeek }],
  }
}

/** `kickback_accepted_<...>` — append a personal-corruption ledger entry. */
export const KICKBACK_PATTERN = /^kickback_accepted_/

export function handleKickback(flag: string, state: GameState): CorruptionEntry | null {
  if (!KICKBACK_PATTERN.test(flag)) return null
  return {
    id: `corruption_${flag}_${Date.now()}`,
    weekRecorded: state.currentWeek,
    description: 'Accepted personal kickback from Lucan Vael in exchange for project contract. Payment of 2,500-4,000 ₭ deposited in Morivask account.',
    witnesses: ['lucan_vael'],
    evidence: 'Offshore bank records in Morivask',
    discovered: false,
    discoveryWeek: null,
  }
}

/** Corruption-ledger flag → CorruptionEntry (driven by CorruptionEngine). */
export function buildCorruptionEntry(state: GameState, flag: string): CorruptionEntry | null {
  return recordCorruptionFlag(state, flag)
}

// ---------- mole accusation (multi-step: state + flag generation + stat changes) ----------

export const ACCUSATION_FLAG_MAP: Record<string, 'petrin_half' | 'irina_dusek' | 'karsten_volek'> = {
  accused_petrin_half: 'petrin_half',
  accused_irina_dusek: 'irina_dusek',
  accused_karsten_volek: 'karsten_volek',
}

export interface MoleAccusationResult {
  stateUpdates: Partial<GameState>
  consequenceFlags: string[]
  statChanges: StateModifier[]
}

export function handleMoleAccusation(flags: string[], state: GameState): MoleAccusationResult | null {
  const accusedFlag = flags.find(f => f in ACCUSATION_FLAG_MAP)
  if (!accusedFlag) return null
  const accusedIdentity = ACCUSATION_FLAG_MAP[accusedFlag]
  const isCorrect = accusedIdentity === state.moleIdentity

  if (isCorrect && state.moleIdentity) {
    const consequences = getMoleConsequences(state.moleIdentity, true)
    return {
      stateUpdates: { moleDiscovered: true },
      consequenceFlags: consequences.flags,
      statChanges: consequences.statChanges as StateModifier[],
    }
  }
  const consequences = getMoleConsequences(accusedIdentity, false)
  return {
    stateUpdates: { moleWronglyAccused: accusedIdentity },
    consequenceFlags: consequences.flags,
    statChanges: consequences.statChanges as StateModifier[],
  }
}
