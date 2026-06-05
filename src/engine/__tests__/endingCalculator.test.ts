// Tests for the ending calculator. This is the single most important engine
// in the game: a wrong weight here routes 52 weeks of player choices to the
// wrong epilogue. The pre-implementation read of endingCalculator.ts surfaced
// a real implementation quirk worth flagging:
//
//   determineGovernanceOutcome checks `governanceScore < 30 → collapse`
//   AFTER the war/coup/revolutionary/democratic_triumph/benevolent_autocrat/
//   economic_survivor branches. So collapse-as-fallback is unreachable for
//   governanceScore in [0, 30) UNLESS none of those branch conditions match
//   and the score is < 30. The tests below document the actual behavior
//   and lock it in; future reconciliation with the GDD can happen safely.

import { describe, it, expect } from 'vitest'

import {
  calculateEnding,
  computeGovernanceScore,
  computePersonalScore,
  determineGovernanceOutcome,
  determinePersonalOutcome,
} from '../endingCalculator'
import { buildGameState } from '../../test/factories/gameStateFactory'

describe('endingCalculator.computeGovernanceScore', () => {
  it('returns a score in [0, 100] for the default Week-1 state', () => {
    const score = computeGovernanceScore(buildGameState(), [])
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('rewards the constitution_in_force flag with a flat 100 sub-score boost', () => {
    const state = buildGameState()
    const without = computeGovernanceScore(state, [])
    const withConstitution = computeGovernanceScore(state, ['constitution_in_force'])
    expect(withConstitution).toBeGreaterThan(without)
  })
})

describe('endingCalculator.computePersonalScore', () => {
  it('returns a score in [0, 100] for the default Week-1 state', () => {
    const score = computePersonalScore(buildGameState())
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })
})

describe('endingCalculator.determineGovernanceOutcome — precedence', () => {
  it('returns war_survivor when a war outcome flag is set, regardless of score', () => {
    const state = buildGameState() // low score
    const outcome = determineGovernanceOutcome(state, ['war_victory'], /* governanceScore */ 0)
    expect(outcome).toBe('war_survivor')
  })

  it('returns collapse when coup_succeeded flag is set, even at high score', () => {
    const state = buildGameState()
    const outcome = determineGovernanceOutcome(state, ['coup_succeeded'], 100)
    expect(outcome).toBe('collapse')
  })

  it('returns collapse when ending_assassination flag is set', () => {
    const outcome = determineGovernanceOutcome(buildGameState(), ['ending_assassination'], 100)
    expect(outcome).toBe('collapse')
  })

  it('returns revolutionary when khaled_alliance and strong workers coalition', () => {
    const state = buildGameState({
      factions: { ...buildGameState().factions, workersCoalition: 60 },
    })
    const outcome = determineGovernanceOutcome(state, ['khaled_alliance'], 30)
    expect(outcome).toBe('revolutionary')
  })

  it('returns democratic_triumph when constitution is in force and score ≥ 55', () => {
    const outcome = determineGovernanceOutcome(
      buildGameState(),
      ['constitution_in_force'],
      /* governanceScore */ 70,
    )
    expect(outcome).toBe('democratic_triumph')
  })

  it('returns benevolent_autocrat when emergency_powers_retained flag is set', () => {
    const outcome = determineGovernanceOutcome(
      buildGameState(),
      ['emergency_powers_retained'],
      /* governanceScore */ 50,
    )
    expect(outcome).toBe('benevolent_autocrat')
  })

  it('returns economic_survivor when ima_deal_accepted flag is set', () => {
    // The benevolent_autocrat branch (line 85 in endingCalculator.ts) checks
    // `ironCovenant >= 30 && moralCompass <= 10 && score >= 40` BEFORE the
    // ima_deal_accepted branch (line 90). We need a state that fails all
    // benevolent_autocrat gates so the ima branch can fire.
    const state = buildGameState({
      factions: { ...buildGameState().factions, ironCovenant: 10 },
      personal: { ...buildGameState().personal, moralCompass: 20 },
    })
    const outcome = determineGovernanceOutcome(
      state,
      ['ima_deal_accepted'],
      /* governanceScore */ 50,
    )
    expect(outcome).toBe('economic_survivor')
  })
})

describe('endingCalculator.determinePersonalOutcome', () => {
  it('returns family_strong at high personal score with no family-ending flag', () => {
    const state = buildGameState({
      personal: {
        ...buildGameState().personal,
        marriageHealth: 90,
        lioraRelationship: 90,
        tomasWellbeing: 90,
        publicImage: 80,
        moralCompass: 50,
      },
    })
    const outcome = determinePersonalOutcome(state, [], /* personalScore */ 80)
    expect(outcome).toBe('family_strong')
  })

  it('returns family_broken when family_chosen flag is set and personal score < 50', () => {
    const outcome = determinePersonalOutcome(buildGameState(), ['family_chosen'], 30)
    expect(outcome).toBe('family_broken')
  })

  it('returns family_strained when marriage_ended flag is set and personal score ≥ 40', () => {
    const outcome = determinePersonalOutcome(buildGameState(), ['marriage_ended'], 50)
    expect(outcome).toBe('family_strained')
  })
})

describe('endingCalculator.calculateEnding — composition', () => {
  it('composes governance + personal outcomes into a variantId', () => {
    const state = buildGameState()
    const ending = calculateEnding(state, ['constitution_in_force', 'war_victory'])

    // War flag wins over constitution (precedence test)
    expect(ending.governanceOutcome).toBe('war_survivor')
    expect(ending.variantId).toMatch(/^war_survivor__/)
    expect(ending.governanceScore).toBeGreaterThan(0)
    expect(ending.personalScore).toBeGreaterThanOrEqual(0)
  })
})
