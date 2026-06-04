import { create } from 'zustand'
import type { DiplomaticLetter } from '../types/letters'

interface LetterStore {
  letters: DiplomaticLetter[]
  readIds: Set<string>
  currentIndex: number
  isOpen: boolean
  unreadCount: number

  loadLetters: (letters: DiplomaticLetter[]) => void
  triggerLetter: (id: string) => void
  setOpen: (open: boolean) => void
  setIndex: (index: number) => void
  markRead: (id: string) => void
}

export const useLetterStore = create<LetterStore>((set, get) => ({
  letters: [],
  readIds: new Set<string>(),
  currentIndex: 0,
  isOpen: false,
  unreadCount: 0,

  loadLetters: (letters) => set({
    letters,
    unreadCount: letters.length,
    readIds: new Set<string>(),
  }),

  triggerLetter: (id) => {
    const { letters, readIds } = get()
    const idx = letters.findIndex(l => l.id === id)
    if (idx < 0) return
    if (!readIds.has(id)) {
      const newReadIds = new Set(readIds)
      newReadIds.add(id)
      set({
        currentIndex: idx,
        isOpen: true,
        readIds: newReadIds,
        unreadCount: Math.max(0, get().unreadCount - 1),
      })
    } else {
      set({ currentIndex: idx, isOpen: true })
    }
  },

  setOpen: (open) => set({ isOpen: open }),
  setIndex: (index) => set({ currentIndex: index }),

  markRead: (id) => {
    const { readIds, unreadCount } = get()
    if (!readIds.has(id)) {
      const newReadIds = new Set(readIds)
      newReadIds.add(id)
      set({ readIds: newReadIds, unreadCount: Math.max(0, unreadCount - 1) })
    }
  },
}))

// Enable Hot Module Replacement (HMR) for Zustand store
// Preserves loaded letters and read state across hot reloads
if (import.meta.hot) {
  import.meta.hot.accept()
}
