import { create } from 'zustand'
import type { JournalEntry, JournalCategory, ChoiceAlignment, JournalStats } from '../types/journal'
import { ALIGNMENT_COLORS } from '../types/journal'

function weekToDate(week: number): string {
  const d = new Date(1963, 0, 1)
  d.setDate(d.getDate() + (week - 1) * 7)
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
}

interface JournalStore {
  entries: JournalEntry[]

  addEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'date'> & { currentWeek: number }) => void
  updateConsequences: (sceneId: string, choiceId: string, consequences: string) => void
  getStats: () => JournalStats
  clearJournal: () => void
  getEntriesByAct: () => Record<number, JournalEntry[]>
  getEntriesByCategory: (category: JournalCategory) => JournalEntry[]
}

let _seq = 0

export const useJournalStore = create<JournalStore>((set, get) => ({
  entries: [],

  addEntry: ({ currentWeek, ...data }) => {
    const entry: JournalEntry = {
      ...data,
      id: `journal_${++_seq}_${Date.now()}`,
      weekNumber: currentWeek,
      date: weekToDate(currentWeek),
      consequences: null,
      createdAt: Date.now(),
    }
    set((state) => {
      const entries = [...state.entries, entry].sort((a, b) => a.weekNumber - b.weekNumber)
      return { entries }
    })
  },

  updateConsequences: (sceneId, choiceId, consequences) => {
    set((state) => ({
      entries: state.entries.map(e =>
        e.choiceId === choiceId && e.sceneId === sceneId
          ? { ...e, consequences }
          : e
      ),
    }))
  },

  getStats: () => {
    const { entries } = get()
    const alignmentBreakdown: Record<string, number> = {
      reformist: 0,
      pragmatist: 0,
      authoritarian: 0,
      populist: 0,
      personal: 0,
      deflect: 0,
    }
    const categoryBreakdown: Record<string, number> = {
      policy: 0,
      diplomacy: 0,
      personal: 0,
      legislation: 0,
      crisis: 0,
      reform: 0,
    }
    let billsSigned = 0
    let billsVetoed = 0

    for (const e of entries) {
      if (e.alignment) alignmentBreakdown[e.alignment]++
      if (e.category) categoryBreakdown[e.category]++
      if (e.flag === 'bill_signed') billsSigned++
      if (e.flag === 'bill_vetoed') billsVetoed++
    }

    let dominant: ChoiceAlignment | null = null
    let maxCount = 0
    for (const [key, count] of Object.entries(alignmentBreakdown)) {
      if (count > maxCount) {
        maxCount = count
        dominant = key as ChoiceAlignment
      }
    }

    return {
      totalEntries: entries.length,
      alignmentBreakdown: alignmentBreakdown as Record<ChoiceAlignment, number>,
      categoryBreakdown: categoryBreakdown as Record<JournalCategory, number>,
      billsSigned,
      billsVetoed,
      dominantAlignment: dominant,
    }
  },

  clearJournal: () => set({ entries: [] }),

  getEntriesByAct: () => {
    const { entries } = get()
    const byAct: Record<number, JournalEntry[]> = { 1: [], 2: [], 3: [], 4: [] }
    for (const e of entries) {
      const act = e.weekNumber <= 13 ? 1 : e.weekNumber <= 26 ? 2 : e.weekNumber <= 39 ? 3 : 4
      byAct[act].push(e)
    }
    return byAct
  },

  getEntriesByCategory: (category) => {
    return get().entries.filter(e => e.category === category)
  },
}))
