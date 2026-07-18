/**
 * Full-chain integration: prepareSitting → complete handler logic →
 * injectRuntimeBill / finalizeSitting / phase routing.
 * Mirrors GameLayout.handleParliamentComplete without rendering React.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { useParliamentStore } from '../parliamentStore'
import { useBillStore } from '../billStore'
import { useGameStore } from '../gameStore'
import { useWeekStore } from '../weekStore'
import { billFromParliamentResult } from '../../engine/ParliamentEngine'
import type { ParliamentBill, ParliamentBillResult } from '../../types/parliament'

function makeParliamentBill(overrides: Partial<ParliamentBill> = {}): ParliamentBill {
  return {
    id: 'pb_int_1',
    title: 'Integration Safety Act',
    proposingBloc: 'reformist',
    weekAvailable: 1,
    description: 'Integration fixture.',
    baselineStances: {
      conservative: 'against',
      hardliner: 'against',
      reformist: 'for',
    },
    fullText: 'Full text of the integration bill.',
    signEffects: [{ stat: 'nation.pressFreedom', operation: 'add', value: 3 }],
    vetoEffects: [{ stat: 'nation.pressFreedom', operation: 'add', value: -3 }],
    signFlags: ['int_signed'],
    vetoFlags: ['int_vetoed'],
    ...overrides,
  }
}

/** Same routing as GameLayout.handleParliamentComplete */
function completeSitting(results: ParliamentBillResult[]) {
  const passedResults = results.filter(r => r.passed)
  for (const result of passedResults) {
    useBillStore.getState().injectRuntimeBill(billFromParliamentResult(result))
  }
  useParliamentStore.getState().finalizeSitting(useGameStore.getState().currentWeek)

  if (passedResults.length > 0) {
    useWeekStore.setState({ phase: 'legislation' })
  } else {
    useWeekStore.setState({ phase: 'map' })
  }
}

describe('Parliament full chain integration', () => {
  beforeEach(() => {
    useGameStore.getState().resetToInitial()
    useGameStore.setState({ currentWeek: 8 })
    useBillStore.setState({
      bills: [],
      history: [],
      pendingBill: null,
      isOverlayOpen: false,
      vetoOverrideResult: null,
    })
    useParliamentStore.getState().reset()
    useParliamentStore.setState({ allParliamentBills: [] })
    useWeekStore.setState({ phase: 'press' })
  })

  it('prepareSitting → complete with passes: injects, finalizes, phase legislation', () => {
    // Strong reformist weight → pass; margin large enough for strong majority
    useParliamentStore.getState().loadParliamentBills([
      makeParliamentBill({
        id: 'pb_pass',
        weekAvailable: 1,
        baselineStances: {
          reformist: 'for',
          conservative: 'against',
          hardliner: 'neutral',
        },
      }),
    ])

    const results = useParliamentStore.getState().prepareSitting(8, {
      reformist: 55,
      conservative: 25,
      hardliner: 10,
    })

    expect(results.length).toBe(1)
    expect(results[0].passed).toBe(true)

    completeSitting(results)

    const bills = useBillStore.getState().bills
    expect(bills.some(b => b.id === 'parliament_pb_pass')).toBe(true)
    expect(bills.find(b => b.id === 'parliament_pb_pass')!.weekPresented).toBe(8)

    expect(useGameStore.getState().lastParliamentWeek).toBe(8)
    expect(useGameStore.getState().emergencyParliamentFlag).toBe(false)
    expect(useParliamentStore.getState().currentSittingResults).toBeNull()
    expect(useParliamentStore.getState().sittingHistory.some(h => h.billId === 'pb_pass')).toBe(true)
    expect(useWeekStore.getState().phase).toBe('legislation')
  })

  it('complete with only failed bills: no inject, phase map', () => {
    useParliamentStore.getState().loadParliamentBills([
      makeParliamentBill({
        id: 'pb_fail',
        weekAvailable: 1,
        baselineStances: {
          reformist: 'for',
          conservative: 'against',
          hardliner: 'against',
        },
      }),
    ])

    const results = useParliamentStore.getState().prepareSitting(8, {
      reformist: 30,
      conservative: 40,
      hardliner: 35,
    })

    expect(results[0].passed).toBe(false)

    completeSitting(results)

    expect(useBillStore.getState().bills).toHaveLength(0)
    expect(useWeekStore.getState().phase).toBe('map')
    expect(useGameStore.getState().lastParliamentWeek).toBe(8)
    expect(useParliamentStore.getState().sittingHistory[0].passed).toBe(false)
  })

  it('mixed sitting: only passed bills injected', () => {
    useParliamentStore.getState().loadParliamentBills([
      makeParliamentBill({
        id: 'pb_yes',
        weekAvailable: 1,
        baselineStances: {
          reformist: 'for',
          conservative: 'for',
          hardliner: 'against',
        },
      }),
      makeParliamentBill({
        id: 'pb_no',
        weekAvailable: 1,
        baselineStances: {
          reformist: 'for',
          conservative: 'against',
          hardliner: 'against',
        },
      }),
    ])

    // Force resolve outcomes via prepareSitting with mixed strengths:
    // reformist+conservative for first bill, second still fails if hardliner+cons against
    const results = useParliamentStore.getState().prepareSitting(8, {
      reformist: 50,
      conservative: 40,
      hardliner: 30,
    })

    expect(results.length).toBe(2)
    const passedIds = results.filter(r => r.passed).map(r => r.bill.id)
    const failedIds = results.filter(r => !r.passed).map(r => r.bill.id)

    completeSitting(results)

    const injectedIds = useBillStore.getState().bills.map(b => b.id)
    for (const id of passedIds) {
      expect(injectedIds).toContain(`parliament_${id}`)
    }
    for (const id of failedIds) {
      expect(injectedIds).not.toContain(`parliament_${id}`)
    }

    if (passedIds.length > 0) {
      expect(useWeekStore.getState().phase).toBe('legislation')
    } else {
      expect(useWeekStore.getState().phase).toBe('map')
    }
  })
})
