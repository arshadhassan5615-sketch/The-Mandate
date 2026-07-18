// Test factories for The Mandate.
//
// The factories here produce MINIMAL-VALID objects that match the real types.
// Use them in tests instead of constructing objects inline — that way a type
// change in INITIAL_STATE or NarrativeNode surfaces as a test compile error
// at one well-known place, not scattered across the suite.
//
// Pattern: every factory accepts a Partial<...> overrides object and merges
// it onto a known-good base. Tests assert behavior, not construction, so the
// base is intentionally stable.

import type { GameState } from '../../types/gameState'

/**
 * Build a GameState suitable for engine / store tests.
 *
 * By default returns a fresh shallow copy of the Week-1 starting state.
 * Pass overrides to mutate specific fields (e.g. { currentWeek: 13, ... }).
 *
 * NOTE: returns a SHALLOW copy. If a test needs to mutate a nested object
 * (e.g. nation.economyHealth), it must spread that object too:
 *   buildGameState({ nation: { ...base.nation, economyHealth: 50 } })
 * This keeps the factory simple and forces tests to be explicit about which
 * state they care about.
 */
export function buildGameState(overrides: Partial<GameState> = {}): GameState {
  // Re-import on demand so the factory reflects whatever the store exports
  // at the moment the test runs. The real default lives in gameStore.ts;
  // we duplicate the small handful of Week-1 fields needed to satisfy the
  // type without a circular import (gameStore imports engines that import
  // factories would be a recipe for headaches).
  const base: GameState = {
    currentWeek: 1,
    currentAct: 1,
    nation: {
      economyHealth: -18,
      unemployment: 19,
      inflation: 9,
      nationalDebt: 340,
      corruption: 68,
      militaryReadiness: 52,
      publicOrder: 55,
      pressFreedom: 28,
      mediaControl: 25,
      civilLiberties: 22,
      internationalStanding: 42,
      assemblyVoteMargin: 0,
    },
    factions: {
      halvekists: 48,
      workersCoalition: 58,
      reformists: 68,
      ironCovenant: 50,
      church: 47,
      businessClass: 44,
      dravenni: 38,
    },
    personal: {
      marriageHealth: 65,
      lioraRelationship: 70,
      tomasWellbeing: 60,
      personalWealth: 12000,
      publicImage: 55,
      moralCompass: 0,
    },
    budget: {
      taxRevenue: 285,
      stateIndustry: 55,
      customsTariffs: 30,
      foreignAid: 10,
      military: 120,
      debtService: 75,
      govtAdmin: 65,
      infrastructure: 55,
      education: 45,
      healthcare: 40,
      welfare: 25,
      bniSecurity: 20,
    },
    playerBackground: 'Academic',
    playerPersonality: 'Measured',
    playerAppearance: 'Professional',
    termFocus: [],
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
    clues: [],
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
    sentLetters: [],
    radioBroadcastsUsed: 0,
    corruptionLedger: [],
    corruptionDiscoveredCount: 0,
    voteSpendingTotal: 0,
    activeProjects: [],
    completedProjects: [],
    personalNotes: '',
    diaryEntries: [],
    economyHistory: [],
    initialSnapshot: null,
  }

  return { ...base, ...overrides }
}
