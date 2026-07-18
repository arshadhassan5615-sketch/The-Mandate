import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { calculateVetoOverrideChance } from '../BillEngine'
import { useGameStore } from '../../stores/gameStore'
import type { Bill } from '../../types/bills'

function makeBill(overrides: Partial<Bill> = {}): Bill {
  return {
    id: 'bill_test',
    title: 'Test Bill',
    shortName: 'T.B.',
    proposer: 'Test',
    faction: 'reformists',
    weekPresented: 10,
    fullText: 'Test.',
    budgetCost: 0,
    signEffects: [],
    vetoEffects: [
      { stat: 'factions.reformists', operation: 'add', value: -15 },
      { stat: 'factions.halvekists', operation: 'add', value: 10 },
    ],
    signFlags: [],
    vetoFlags: [],
    isVetoable: true,
    ...overrides,
  }
}

describe('calculateVetoOverrideChance — parliament margin path', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  beforeEach(() => {
    useGameStore.getState().resetToInitial()
  })

  it('uses computeOverrideChance when parliamentMarginPercent is set', () => {
    // margin 40 → chance = 40/200 = 0.2
    const bill = makeBill({ parliamentMarginPercent: 40 })
    const gs = useGameStore.getState()

    vi.spyOn(Math, 'random').mockReturnValue(0.1) // 0.1 < 0.2 → overridden
    const low = calculateVetoOverrideChance(bill, gs)
    expect(low.overridden).toBe(true)
    expect(low.assemblyVote).toBe(20)
    expect(low.threshold).toBe(50)

    vi.spyOn(Math, 'random').mockReturnValue(0.5) // 0.5 >= 0.2 → not overridden
    const high = calculateVetoOverrideChance(bill, gs)
    expect(high.overridden).toBe(false)
    expect(high.assemblyVote).toBe(20)
  })

  it('regression: bill WITHOUT parliamentMarginPercent still uses faction formula (30–50% band)', () => {
    const bill = makeBill() // no parliamentMarginPercent
    const gs = useGameStore.getState()

    vi.spyOn(Math, 'random').mockReturnValue(0.0)
    const result = calculateVetoOverrideChance(bill, gs)

    // Faction formula clamps to [0.30, 0.50] — never the parliament 0–0.4 absolute scale
    expect(result.assemblyVote).toBeGreaterThanOrEqual(30)
    expect(result.assemblyVote).toBeLessThanOrEqual(50)
    expect(result.threshold).toBe(50)
    // With random 0, always overridden when chance is in 0.30–0.50
    expect(result.overridden).toBe(true)
  })

  it('regression: same inputs without margin field yield stable assemblyVote across calls', () => {
    const bill = makeBill()
    const gs = useGameStore.getState()
    vi.spyOn(Math, 'random').mockReturnValue(0.42)

    const a = calculateVetoOverrideChance(bill, gs)
    const b = calculateVetoOverrideChance(bill, gs)
    expect(a).toEqual(b)
  })
})
