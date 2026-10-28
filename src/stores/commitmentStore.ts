import { create } from 'zustand'
import type { Commitment } from '../engine/commitments'

interface CommitmentStore {
  commitments: Commitment[]
  // Promises whose break has already been applied, so their consequences land once.
  settledIds: string[]
  record: (commitment: Commitment) => void
  markSettled: (ids: string[]) => void
  reset: () => void
}

export const useCommitmentStore = create<CommitmentStore>((set) => ({
  commitments: [],
  settledIds: [],

  record: (commitment) =>
    set((state) => {
      if (state.commitments.some(entry => entry.id === commitment.id)) return state
      return { commitments: [...state.commitments, commitment] }
    }),

  markSettled: (ids) =>
    set((state) => {
      const fresh = [...new Set(ids)].filter(id => !state.settledIds.includes(id))
      if (fresh.length === 0) return state
      return { settledIds: [...state.settledIds, ...fresh] }
    }),

  reset: () => set({ commitments: [], settledIds: [] }),
}))
