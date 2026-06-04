import { create } from 'zustand'
import type { CodexCategory, CodexEntry } from '../types/codex'

// Load all codex JSON files at build time
const codexModules = import.meta.glob<CodexEntry[]>(
  '../data/codex/*.json',
  { eager: true },
)
export const ALL_CODEX_ENTRIES: CodexEntry[] = Object.values(codexModules).flat()

const LS_SEEN = 'mandate_codex_seen'

function loadSeen(): string[] {
  try { return JSON.parse(localStorage.getItem(LS_SEEN) ?? '[]') }
  catch { return [] }
}

function persistSeen(ids: string[]): void {
  localStorage.setItem(LS_SEEN, JSON.stringify(ids))
}

interface CodexStore {
  isOpen: boolean
  activeCategory: CodexCategory
  activeEntryId: string | null
  seenEntryIds: string[]
  inlineCodexOpen: boolean

  openCodex:   (category?: CodexCategory, entryId?: string) => void
  closeCodex:  () => void
  setCategory: (cat: CodexCategory) => void
  viewEntry:   (id: string) => void   // selects + marks seen
  openInlineCodex: (entryId: string) => void
  closeInlineCodex: () => void
}

export const useCodexStore = create<CodexStore>((set, get) => ({
  isOpen:        false,
  activeCategory: 'nations',
  activeEntryId:  null,
  seenEntryIds:   loadSeen(),
  inlineCodexOpen: false,

  openCodex: (category = 'nations', entryId) =>
    set({ isOpen: true, activeCategory: category, activeEntryId: entryId ?? null }),

  closeCodex: () => set({ isOpen: false }),

  setCategory: (cat) => set({ activeCategory: cat, activeEntryId: null }),

  openInlineCodex: (entryId) => {
    const { seenEntryIds } = get()
    if (!seenEntryIds.includes(entryId)) {
      const next = [...seenEntryIds, entryId]
      persistSeen(next)
      set({ seenEntryIds: next, activeEntryId: entryId, inlineCodexOpen: true })
    } else {
      set({ activeEntryId: entryId, inlineCodexOpen: true })
    }
  },

  closeInlineCodex: () => set({ inlineCodexOpen: false }),

  viewEntry: (id) => {
    const { seenEntryIds } = get()
    if (!seenEntryIds.includes(id)) {
      const next = [...seenEntryIds, id]
      persistSeen(next)
      set({ seenEntryIds: next, activeEntryId: id })
    } else {
      set({ activeEntryId: id })
    }
  },
}))

// Enable Hot Module Replacement (HMR) for Zustand store
// Preserves seen codex entries across hot reloads
if (import.meta.hot) {
  import.meta.hot.accept()
}
