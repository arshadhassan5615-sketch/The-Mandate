import { create } from 'zustand'
import type { NewsArticle } from '../types/news'

interface NewsStore {
  articles: NewsArticle[]
  isOpen: boolean
  lastReadIndex: number
  readRecords: Record<string, number[]>     // publication_id -> weekNumbers

  addArticles: (articles: NewsArticle[]) => void
  markAllRead: () => void
  markArticleRead: (article: NewsArticle) => void
  setOpen: (open: boolean) => void

  // Intelligence system
  getPapersReadCount: (week: number) => number
  getEventsWithMultiplePapers: () => number
}

export const useNewsStore = create<NewsStore>((set, get) => ({
  articles: [],
  isOpen: false,
  lastReadIndex: -1,
  readRecords: {},

  addArticles: (articles) =>
    set((state) => ({ articles: [...state.articles, ...articles] })),

  markAllRead: () =>
    set((state) => ({ lastReadIndex: state.articles.length - 1 })),

  markArticleRead: (article) =>
    set((state) => {
      const key = article.publication
      const week = article.weekNumber
      const existing = state.readRecords[key] ?? []
      if (existing.includes(week)) return state
      return {
        readRecords: {
          ...state.readRecords,
          [key]: [...existing, week],
        },
      }
    }),

  setOpen: (open) => {
    set({ isOpen: open })
    if (open) get().markAllRead()
  },

  getPapersReadCount: (week: number) => {
    const { readRecords } = get()
    let count = 0
    for (const weeks of Object.values(readRecords)) {
      if (weeks.includes(week)) count++
    }
    return count
  },

  getEventsWithMultiplePapers: () => {
    const { readRecords, articles } = get()
    const weeks = new Set<number>()
    for (const a of articles) {
      if (a.templateId?.startsWith('div_')) weeks.add(a.weekNumber)
    }
    let multiPaperEvents = 0
    for (const week of weeks) {
      let papersRead = 0
      for (const weeksRead of Object.values(readRecords)) {
        if (weeksRead.includes(week)) papersRead++
      }
      if (papersRead >= 3) multiPaperEvents++
    }
    return multiPaperEvents
  },
}))
