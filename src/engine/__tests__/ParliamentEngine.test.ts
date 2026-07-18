import { describe, it, expect } from 'vitest'
import {
  computeBlocStance,
  resolveParliamentBill,
  computeOverrideChance,
} from '../ParliamentEngine'
import type { ParliamentBill } from '../../types/parliament'

function makeBill(overrides: Partial<ParliamentBill> = {}): ParliamentBill {
  return {
    id: 'pb_test',
    title: 'Test Parliament Bill',
    proposingBloc: 'reformist',
    weekAvailable: 10,
    description: 'A test bill for the sitting.',
    baselineStances: {
      conservative: 'against',
      hardliner: 'against',
      reformist: 'for',
    },
    fullText: 'Section 1. Test.',
    signEffects: [{ stat: 'nation.pressFreedom', operation: 'add', value: 5 }],
    vetoEffects: [{ stat: 'nation.pressFreedom', operation: 'add', value: -5 }],
    signFlags: ['pb_test_signed'],
    vetoFlags: ['pb_test_vetoed'],
    ...overrides,
  }
}

describe('computeBlocStance', () => {
  it('preserves baseline when bloc strength is at or above the weak threshold (25)', () => {
    expect(computeBlocStance('for', 25)).toBe('for')
    expect(computeBlocStance('against', 40)).toBe('against')
    expect(computeBlocStance('for', 100)).toBe('for')
  })

  it("downgrades 'for' to neutral when bloc strength is below 25", () => {
    expect(computeBlocStance('for', 24)).toBe('neutral')
    expect(computeBlocStance('for', 0)).toBe('neutral')
  })

  it("downgrades 'against' to neutral when bloc strength is below 25", () => {
    expect(computeBlocStance('against', 24)).toBe('neutral')
    expect(computeBlocStance('against', 10)).toBe('neutral')
  })

  it('keeps neutral baseline regardless of strength', () => {
    expect(computeBlocStance('neutral', 0)).toBe('neutral')
    expect(computeBlocStance('neutral', 24)).toBe('neutral')
    expect(computeBlocStance('neutral', 50)).toBe('neutral')
    expect(computeBlocStance('neutral', 100)).toBe('neutral')
  })
})

describe('resolveParliamentBill', () => {
  it('returns a clear pass when for-weight dominates against-weight', () => {
    const bill = makeBill({
      baselineStances: {
        reformist: 'for',
        conservative: 'for',
        hardliner: 'against',
      },
    })
    // for: 50+40=90, against: 30 → pass, margin 60 (all blocs >= 25 so stances hold)
    const result = resolveParliamentBill(bill, {
      reformist: 50,
      conservative: 40,
      hardliner: 30,
    })

    expect(result.passed).toBe(true)
    expect(result.forWeight).toBe(90)
    expect(result.againstWeight).toBe(30)
    expect(result.marginPercent).toBe(60)
    expect(result.computedStances).toEqual({
      reformist: 'for',
      conservative: 'for',
      hardliner: 'against',
    })
  })

  it('returns a clear fail when against-weight dominates for-weight', () => {
    const bill = makeBill({
      baselineStances: {
        reformist: 'for',
        conservative: 'against',
        hardliner: 'against',
      },
    })
    // for: 30, against: 40+35=75 → fail
    const result = resolveParliamentBill(bill, {
      reformist: 30,
      conservative: 40,
      hardliner: 35,
    })

    expect(result.passed).toBe(false)
    expect(result.forWeight).toBe(30)
    expect(result.againstWeight).toBe(75)
    expect(result.marginPercent).toBe(-45)
    expect(result.isStrongMajority).toBe(false)
  })

  it('flips a would-be-fail into a pass when a weak opposing bloc softens to neutral', () => {
    // Without weakness rule: for=30, against=28+24=52 → fail
    // With weakness rule: hardliner 24 < 25 softens against→neutral → against=28 only → pass
    // conservative 28 >= 25 keeps 'against'
    const bill = makeBill({
      baselineStances: {
        reformist: 'for',
        conservative: 'against',
        hardliner: 'against',
      },
    })
    const result = resolveParliamentBill(bill, {
      reformist: 30,
      conservative: 28,
      hardliner: 24,
    })

    expect(result.computedStances.hardliner).toBe('neutral')
    expect(result.computedStances.conservative).toBe('against')
    expect(result.forWeight).toBe(30)
    expect(result.againstWeight).toBe(28)
    expect(result.passed).toBe(true)
  })
})

describe('resolveParliamentBill — isStrongMajority', () => {
  it('is true when passed and margin is exactly 30', () => {
    const bill = makeBill({
      baselineStances: {
        reformist: 'for',
        conservative: 'against',
        hardliner: 'neutral',
      },
    })
    // for: 55, against: 25 → margin 30 (both active blocs >= 25)
    const result = resolveParliamentBill(bill, {
      reformist: 55,
      conservative: 25,
      hardliner: 10,
    })

    expect(result.passed).toBe(true)
    expect(result.marginPercent).toBe(30)
    expect(result.isStrongMajority).toBe(true)
  })

  it('is true when margin is above 30', () => {
    const bill = makeBill({
      baselineStances: {
        reformist: 'for',
        conservative: 'against',
        hardliner: 'neutral',
      },
    })
    // for: 60, against: 25 → margin 35
    const result = resolveParliamentBill(bill, {
      reformist: 60,
      conservative: 25,
      hardliner: 10,
    })

    expect(result.marginPercent).toBe(35)
    expect(result.isStrongMajority).toBe(true)
  })

  it('is false when margin is just under 30 (29)', () => {
    const bill = makeBill({
      baselineStances: {
        reformist: 'for',
        conservative: 'against',
        hardliner: 'neutral',
      },
    })
    // for: 54, against: 25 → margin 29
    const result = resolveParliamentBill(bill, {
      reformist: 54,
      conservative: 25,
      hardliner: 10,
    })

    expect(result.passed).toBe(true)
    expect(result.marginPercent).toBe(29)
    expect(result.isStrongMajority).toBe(false)
  })

  it('is false when the bill fails even with a large absolute margin against', () => {
    const bill = makeBill({
      baselineStances: {
        reformist: 'for',
        conservative: 'against',
        hardliner: 'against',
      },
    })
    const result = resolveParliamentBill(bill, {
      reformist: 20,
      conservative: 50,
      hardliner: 40,
    })

    expect(result.passed).toBe(false)
    expect(result.isStrongMajority).toBe(false)
  })
})

describe('computeOverrideChance', () => {
  it('returns 0 at margin 0', () => {
    expect(computeOverrideChance(0)).toBe(0)
  })

  it('increases with margin', () => {
    const low = computeOverrideChance(20)
    const mid = computeOverrideChance(40)
    const high = computeOverrideChance(60)
    expect(low).toBe(0.1)
    expect(mid).toBe(0.2)
    expect(high).toBe(0.3)
    expect(mid).toBeGreaterThan(low)
    expect(high).toBeGreaterThan(mid)
  })

  it('never exceeds 0.4', () => {
    expect(computeOverrideChance(80)).toBe(0.4)
    expect(computeOverrideChance(100)).toBe(0.4)
    expect(computeOverrideChance(1000)).toBe(0.4)
  })

  it('clamps negative margins to 0', () => {
    expect(computeOverrideChance(-10)).toBe(0)
    expect(computeOverrideChance(-100)).toBe(0)
  })
})
