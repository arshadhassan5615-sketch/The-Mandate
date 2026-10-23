import { create } from 'zustand'

interface ProvinceNewsStore {
  seenIds: string[]
  markSeen: (ids: readonly string[]) => void
  reset: () => void
}

export const useProvinceNewsStore = create<ProvinceNewsStore>((set) => ({
  seenIds: [],

  markSeen: (ids) =>
    set((state) => {
      const known = new Set(state.seenIds)
      const fresh: string[] = []
      for (const id of ids) {
        if (known.has(id)) continue
        known.add(id)
        fresh.push(id)
      }
      if (fresh.length === 0) return state
      return { seenIds: [...state.seenIds, ...fresh] }
    }),

  reset: () => set({ seenIds: [] }),
}))
