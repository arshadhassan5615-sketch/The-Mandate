import type { Bill, BillHistoryEntry } from '../../types/bills'
import type { Decree } from '../../types/decree'

// Player-facing records for the State of the Republic panel. Only what the
// player already saw when deciding is carried over: titles, outcomes,
// proposers and summaries. Stat effects stay hidden.

export const LAW_OUTCOME: Record<BillHistoryEntry['decision'], { label: string; isLaw: boolean }> = {
  signed: { label: 'Signed into law', isLaw: true },
  auto_passed: { label: 'Became law unsigned', isLaw: true },
  overridden: { label: 'Veto overridden', isLaw: true },
  vetoed: { label: 'Vetoed', isLaw: false },
}

export interface LawRecord {
  key: string
  title: string
  outcome: string
  isLaw: boolean
  week: number
}

export interface DecreeRecord {
  id: string
  title: string
  category: string
  proposedBy: string
  summary: string
}

export function buildLawRecords(history: readonly BillHistoryEntry[], bills: readonly Bill[]): LawRecord[] {
  const titles = new Map(bills.map(b => [b.id, b.title || b.shortName]))
  return history
    .map((entry, index) => ({
      key: `${entry.billId}-${index}`,
      title: entry.billTitle ?? titles.get(entry.billId) ?? 'Untitled bill',
      outcome: LAW_OUTCOME[entry.decision].label,
      isLaw: LAW_OUTCOME[entry.decision].isLaw,
      week: entry.weekDecided,
      index,
    }))
    // Newest first; equal weeks keep the later decision on top.
    .sort((a, b) => b.week - a.week || b.index - a.index)
    .map(({ key, title, outcome, isLaw, week }) => ({ key, title, outcome, isLaw, week }))
}

export function buildDecreeRecords(signed: readonly Decree[]): DecreeRecord[] {
  // signedDecrees is appended in signing order, so reversing gives newest first.
  return [...signed].reverse().map(d => ({
    id: d.id,
    title: d.title,
    category: d.category.charAt(0).toUpperCase() + d.category.slice(1),
    proposedBy: d.proposedBy,
    summary: d.summary,
  }))
}
