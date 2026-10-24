import { create } from 'zustand'
import type { Commitment } from '../engine/commitments'

interface CommitmentStore {
  commitments: Commitment[]
  record: (commitment: Commitment) => void
  reset: () => void
}

export const useCommitmentStore = create<CommitmentStore>((set) => ({
  commitments: [],

  record: (commitment) =>
    set((state) => {
      if (state.commitments.some(entry => entry.id === commitment.id)) return state
      return { commitments: [...state.commitments, commitment] }
    }),

  reset: () => set({ commitments: [] }),
}))
