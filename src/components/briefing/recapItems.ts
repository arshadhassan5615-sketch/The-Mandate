// "Last week" recap for the morning briefing, built from the journal: the
// player's own recorded decisions, which the Journal view already shows them.
import type { JournalEntry, JournalCategory } from '../../types/journal'
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../../types/journal'

export const RECAP_LIMIT = 3

export interface RecapItem {
  id: string
  category: JournalCategory
  categoryLabel: string
  color: string
  title: string
  /** What came of it, falling back to what was decided. */
  text: string
}

/**
 * Up to three of last week's journal entries. Entries that record a
 * consequence come first (they say what changed), then the most recent.
 */
export function buildWeekRecap(entries: readonly JournalEntry[], currentWeek: number): RecapItem[] {
  const lastWeek = currentWeek - 1
  return entries
    .filter(e => e.weekNumber === lastWeek)
    .sort((a, b) => Number(!!b.consequences) - Number(!!a.consequences) || b.createdAt - a.createdAt)
    .slice(0, RECAP_LIMIT)
    .map(e => ({
      id: e.id,
      category: e.category,
      categoryLabel: CATEGORY_LABELS[e.category],
      color: CATEGORY_COLORS[e.category],
      title: e.title,
      text: e.consequences || e.description,
    }))
}
