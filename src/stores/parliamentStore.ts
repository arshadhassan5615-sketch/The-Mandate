import { create } from 'zustand'
import type {
  AssemblyBloc,
  ParliamentBill,
  ParliamentBillResult,
  SittingHistoryEntry,
} from '../types/parliament'
import {
  selectEligibleBills,
  selectBillsForSitting,
  resolveParliamentBill,
} from '../engine/ParliamentEngine'
import { useGameStore } from './gameStore'

interface ParliamentStore {
  allParliamentBills: ParliamentBill[]
  sittingHistory: SittingHistoryEntry[]
  currentSittingResults: ParliamentBillResult[] | null

  loadParliamentBills: (bills: ParliamentBill[]) => void
  prepareSitting: (
    currentWeek: number,
    blocStrengths: Record<AssemblyBloc, number>,
  ) => ParliamentBillResult[]
  finalizeSitting: (currentWeek: number) => void
  reset: () => void
}

export const useParliamentStore = create<ParliamentStore>((set, get) => ({
  allParliamentBills: [],
  sittingHistory: [],
  currentSittingResults: null,

  loadParliamentBills: (bills) => set({ allParliamentBills: bills }),

  prepareSitting: (currentWeek, blocStrengths) => {
    const { allParliamentBills, sittingHistory } = get()
    const decidedBillIds = new Set(sittingHistory.map(h => h.billId))
    const eligible = selectEligibleBills(allParliamentBills, currentWeek, decidedBillIds)
    const selected = selectBillsForSitting(eligible)

    if (selected.length === 0) {
      set({ currentSittingResults: [] })
      return []
    }

    const results = selected.map(bill => resolveParliamentBill(bill, blocStrengths))
    set({ currentSittingResults: results })
    return results
  },

  finalizeSitting: (currentWeek) => {
    const { currentSittingResults } = get()
    if (!currentSittingResults || currentSittingResults.length === 0) {
      set({ currentSittingResults: null })
      useGameStore.setState({
        lastParliamentWeek: currentWeek,
        emergencyParliamentFlag: false,
      })
      return
    }

    const entries: SittingHistoryEntry[] = currentSittingResults.map(result => ({
      billId: result.bill.id,
      weekPresented: result.bill.weekAvailable,
      weekDecided: currentWeek,
      passed: result.passed,
      isStrongMajority: result.isStrongMajority,
      marginPercent: result.marginPercent,
    }))

    set(s => ({
      sittingHistory: [...s.sittingHistory, ...entries],
      currentSittingResults: null,
    }))

    useGameStore.setState({
      lastParliamentWeek: currentWeek,
      emergencyParliamentFlag: false,
    })
  },

  reset: () =>
    set({
      sittingHistory: [],
      currentSittingResults: null,
    }),
}))

// Enable Hot Module Replacement (HMR) for Zustand store
if (import.meta.hot) {
  import.meta.hot.accept()
}
