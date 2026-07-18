import { describe, it, expect, beforeEach } from 'vitest'
import { useBillStore } from '../billStore'
import { useGameStore } from '../gameStore'
import type { Bill } from '../../types/bills'

function makeBill(overrides: Partial<Bill> = {}): Bill {
  return {
    id: 'bill_runtime_test',
    title: 'Runtime Test Act',
    shortName: 'R.T.A.',
    proposer: 'Test Proposer',
    faction: 'reformists',
    weekPresented: 1,
    fullText: 'Section 1. Runtime inject test.',
    budgetCost: 0,
    signEffects: [{ stat: 'nation.pressFreedom', operation: 'add', value: 1 }],
    vetoEffects: [{ stat: 'nation.pressFreedom', operation: 'add', value: -1 }],
    signFlags: ['runtime_signed'],
    vetoFlags: ['runtime_vetoed'],
    isVetoable: true,
    ...overrides,
  }
}

/** Mirrors LegislationOverlay's pendingBills filter (without phase gate). */
function pendingLikeOverlay(
  bills: Bill[],
  currentWeek: number,
  history: { billId: string }[],
): Bill[] {
  return bills.filter(b => {
    if (b.weekPresented !== currentWeek) return false
    if (history.some(h => h.billId === b.id)) return false
    return true
  })
}

describe('billStore.injectRuntimeBill', () => {
  beforeEach(() => {
    useGameStore.getState().resetToInitial()
    useBillStore.setState({
      bills: [],
      history: [],
      pendingBill: null,
      isOverlayOpen: false,
      vetoOverrideResult: null,
    })
  })

  it('appends without removing existing catalog bills', () => {
    const staticA = makeBill({ id: 'bill_static_a', weekPresented: 3 })
    const staticB = makeBill({ id: 'bill_static_b', weekPresented: 7 })
    useBillStore.getState().loadBills([staticA, staticB])

    useGameStore.setState({ currentWeek: 12 })
    useBillStore.getState().injectRuntimeBill(
      makeBill({ id: 'bill_runtime_1', weekPresented: 999 }),
    )

    const { bills } = useBillStore.getState()
    expect(bills).toHaveLength(3)
    expect(bills.map(b => b.id)).toEqual([
      'bill_static_a',
      'bill_static_b',
      'bill_runtime_1',
    ])
    // Catalog entries unchanged
    expect(bills[0].weekPresented).toBe(3)
    expect(bills[1].weekPresented).toBe(7)
  })

  it('forces weekPresented to currentWeek regardless of input', () => {
    useGameStore.setState({ currentWeek: 14 })
    useBillStore.getState().injectRuntimeBill(
      makeBill({ id: 'bill_wrong_week', weekPresented: 1 }),
    )

    const injected = useBillStore.getState().bills.find(b => b.id === 'bill_wrong_week')
    expect(injected).toBeDefined()
    expect(injected!.weekPresented).toBe(14)
  })

  it('surfaces via the same filter LegislationOverlay pendingBills uses', () => {
    useGameStore.setState({ currentWeek: 9 })
    useBillStore.getState().loadBills([
      makeBill({ id: 'bill_other_week', weekPresented: 2 }),
    ])
    useBillStore.getState().injectRuntimeBill(
      makeBill({ id: 'bill_inject_me', weekPresented: 50, isVetoable: false }),
    )

    const { bills, history } = useBillStore.getState()
    const currentWeek = useGameStore.getState().currentWeek
    const pending = pendingLikeOverlay(bills, currentWeek, history)

    expect(pending.map(b => b.id)).toEqual(['bill_inject_me'])
    expect(pending[0].isVetoable).toBe(false)
  })

  it('does not surface an injected bill already recorded in history', () => {
    useGameStore.setState({ currentWeek: 5 })
    useBillStore.getState().injectRuntimeBill(makeBill({ id: 'bill_done' }))
    useBillStore.setState({
      history: [{
        billId: 'bill_done',
        weekPresented: 5,
        decision: 'signed',
        weekDecided: 5,
      }],
    })

    const { bills, history } = useBillStore.getState()
    const pending = pendingLikeOverlay(bills, 5, history)
    expect(pending).toHaveLength(0)
  })
})
