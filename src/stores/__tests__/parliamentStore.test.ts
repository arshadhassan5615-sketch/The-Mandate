import { describe, it, expect, beforeEach } from 'vitest'
import { useParliamentStore } from '../parliamentStore'
import { useGameStore } from '../gameStore'
import type { ParliamentBill } from '../../types/parliament'
import type { AssemblyBloc } from '../../types/parliament'

function makeBill(overrides: Partial<ParliamentBill> = {}): ParliamentBill {
  return {
    id: 'pb_test',
    title: 'Test Parliament Bill',
    proposingBloc: 'reformist',
    weekAvailable: 5,
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

const STRONG_REFORM: Record<AssemblyBloc, number> = {
  reformist: 55,
  conservative: 25,
  hardliner: 25,
}

describe('parliamentStore', () => {
  beforeEach(() => {
    useGameStore.getState().resetToInitial()
    useParliamentStore.getState().reset()
    useParliamentStore.setState({ allParliamentBills: [] })
  })

  it('prepareSitting with no eligible bills returns []', () => {
    useParliamentStore.getState().loadParliamentBills([
      makeBill({ id: 'pb_future', weekAvailable: 20 }),
    ])
    const results = useParliamentStore.getState().prepareSitting(5, STRONG_REFORM)
    expect(results).toEqual([])
    expect(useParliamentStore.getState().currentSittingResults).toEqual([])
  })

  it('prepareSitting selects and resolves eligible bills correctly', () => {
    useParliamentStore.getState().loadParliamentBills([
      makeBill({
        id: 'pb_old',
        weekAvailable: 3,
        baselineStances: {
          reformist: 'for',
          conservative: 'against',
          hardliner: 'neutral',
        },
      }),
      makeBill({
        id: 'pb_mid',
        weekAvailable: 5,
        baselineStances: {
          reformist: 'for',
          conservative: 'for',
          hardliner: 'against',
        },
      }),
      makeBill({ id: 'pb_future', weekAvailable: 30 }),
    ])

    const results = useParliamentStore.getState().prepareSitting(10, STRONG_REFORM)

    expect(results).toHaveLength(2)
    expect(results.map(r => r.bill.id)).toEqual(['pb_old', 'pb_mid'])
    // Each result is a full resolveParliamentBill payload
    for (const r of results) {
      expect(r).toHaveProperty('passed')
      expect(r).toHaveProperty('forWeight')
      expect(r).toHaveProperty('againstWeight')
      expect(r).toHaveProperty('computedStances')
      expect(r).toHaveProperty('marginPercent')
    }
    expect(useParliamentStore.getState().currentSittingResults).toHaveLength(2)
    // History not written until finalize
    expect(useParliamentStore.getState().sittingHistory).toHaveLength(0)
  })

  it('finalizeSitting appends to history and clears currentSittingResults', () => {
    useParliamentStore.getState().loadParliamentBills([
      makeBill({ id: 'pb_a', weekAvailable: 4 }),
      makeBill({ id: 'pb_b', weekAvailable: 5 }),
    ])
    useParliamentStore.getState().prepareSitting(8, STRONG_REFORM)
    expect(useParliamentStore.getState().currentSittingResults).not.toBeNull()

    useParliamentStore.getState().finalizeSitting(8)

    const { sittingHistory, currentSittingResults } = useParliamentStore.getState()
    expect(currentSittingResults).toBeNull()
    expect(sittingHistory).toHaveLength(2)
    expect(sittingHistory.map(h => h.billId).sort()).toEqual(['pb_a', 'pb_b'])
    expect(sittingHistory[0].weekDecided).toBe(8)
    expect(typeof sittingHistory[0].passed).toBe('boolean')
    expect(typeof sittingHistory[0].isStrongMajority).toBe('boolean')
    expect(typeof sittingHistory[0].marginPercent).toBe('number')
  })

  it('excludes bills already in sittingHistory from a subsequent prepareSitting', () => {
    useParliamentStore.getState().loadParliamentBills([
      makeBill({ id: 'pb_done', weekAvailable: 2 }),
      makeBill({ id: 'pb_new', weekAvailable: 4 }),
    ])

    useParliamentStore.getState().prepareSitting(6, STRONG_REFORM)
    useParliamentStore.getState().finalizeSitting(6)

    const second = useParliamentStore.getState().prepareSitting(10, STRONG_REFORM)
    expect(second.map(r => r.bill.id)).toEqual([])
    // Both were eligible at week 6 and finalized; none left
    // Reload a fresh catalog entry that wasn't decided
    useParliamentStore.getState().loadParliamentBills([
      makeBill({ id: 'pb_done', weekAvailable: 2 }),
      makeBill({ id: 'pb_new', weekAvailable: 4 }),
      makeBill({ id: 'pb_extra', weekAvailable: 7 }),
    ])
    const third = useParliamentStore.getState().prepareSitting(10, STRONG_REFORM)
    expect(third.map(r => r.bill.id)).toEqual(['pb_extra'])
  })

  it('finalizeSitting updates gameStore.lastParliamentWeek and clears emergencyParliamentFlag', () => {
    useGameStore.setState({
      lastParliamentWeek: 0,
      emergencyParliamentFlag: true,
    })
    useParliamentStore.getState().loadParliamentBills([
      makeBill({ id: 'pb_x', weekAvailable: 1 }),
    ])
    useParliamentStore.getState().prepareSitting(9, STRONG_REFORM)
    useParliamentStore.getState().finalizeSitting(9)

    const gs = useGameStore.getState()
    expect(gs.lastParliamentWeek).toBe(9)
    expect(gs.emergencyParliamentFlag).toBe(false)
  })
})
