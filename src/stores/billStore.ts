import { create } from 'zustand'
import type { Bill, BillHistoryEntry } from '../types/bills'
import { useJournalStore } from './journalStore'
import { useGameStore } from './gameStore'

interface BillStore {
  bills: Bill[]
  history: BillHistoryEntry[]
  pendingBill: Bill | null
  isOverlayOpen: boolean
  vetoOverrideResult: { overridden: boolean } | null

  loadBills: (bills: Bill[]) => void
  presentBill: (bill: Bill) => void
  recordDecision: (entry: BillHistoryEntry) => void
  closeOverlay: () => void
  setOverrideResult: (result: { overridden: boolean } | null) => void
  getDecidedBillIds: () => Set<string>
}

export const useBillStore = create<BillStore>((set, get) => ({
  bills: [],
  history: [],
  pendingBill: null,
  isOverlayOpen: false,
  vetoOverrideResult: null,

  loadBills: (bills) => set({ bills }),

  presentBill: (bill) => set({ pendingBill: bill, isOverlayOpen: true, vetoOverrideResult: null }),

  recordDecision: (entry) => {
    const currentWeek = useGameStore.getState().currentWeek
    const billTitle = entry.billTitle ?? 'Unknown Bill'
    const isSigned = entry.decision === 'signed' || entry.decision === 'auto_passed' || entry.decision === 'overridden'
    const isVetoed = entry.decision === 'vetoed'

    if (isSigned || isVetoed) {
      const action = isSigned ? 'Signed' : 'Vetoed'
      const flag = isSigned ? 'bill_signed' : 'bill_vetoed'
      const description = isSigned
        ? `"I signed the ${billTitle} into law. The ink dried quickly. The consequences will take longer. Every signature is a bet on the future — and I just placed mine."`
        : `"I returned the ${billTitle} to the Assembly with my objections. A veto is not a no — it is a 'not this way.' The question is whether the Assembly will find another way, or whether the bill dies with my objections."`
      const icon = isSigned ? '§' : '✕'

      useJournalStore.getState().addEntry({
        sceneId: `bill_${entry.billId}`,
        choiceId: `bill_${isSigned ? 'sign' : 'veto'}_${entry.billId}`,
        category: 'legislation',
        alignment: isSigned ? 'pragmatist' : 'authoritarian',
        title: `${action}: ${billTitle}`,
        description,
        icon,
        flag,
        currentWeek,
      })
    }

    set((state) => ({
      history: [...state.history, entry],
      pendingBill: null,
      isOverlayOpen: false,
      vetoOverrideResult: null,
    }))
  },

  closeOverlay: () =>
    set({ pendingBill: null, isOverlayOpen: false, vetoOverrideResult: null }),

  setOverrideResult: (result) => set({ vetoOverrideResult: result }),

  getDecidedBillIds: () => {
    const { history } = get()
    return new Set(history.map(h => h.billId))
  },
}))
