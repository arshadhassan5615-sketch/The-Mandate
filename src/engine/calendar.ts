import type { BillHistoryEntry } from '../types/bills'
import { weekToDate } from './dates'

// The calendar of 1963: fifty-two weeks in four acts, each with what is publicly
// known about it. Bill notes only appear for weeks already lived, so a future bill
// is never named here, even if the history somehow holds it.

export interface CalendarAct {
  number: 1 | 2 | 3 | 4
  title: string
  firstWeek: number
  lastWeek: number
}

export const ACTS: readonly CalendarAct[] = [
  { number: 1, title: 'Act I — The First Months', firstWeek: 1, lastWeek: 13 },
  { number: 2, title: 'Act II — The Referendum', firstWeek: 14, lastWeek: 26 },
  { number: 3, title: 'Act III — The Storm', firstWeek: 27, lastWeek: 39 },
  { number: 4, title: 'Act IV — The Reckoning', firstWeek: 40, lastWeek: 52 },
]

export interface ScheduledEvent {
  week: number
  label: string
}

export const PUBLIC_EVENTS: readonly ScheduledEvent[] = [
  { week: 26, label: 'Constitutional referendum' },
  { week: 52, label: 'End of the first year' },
]

export type WeekState = 'past' | 'current' | 'future'

export interface CalendarWeek {
  week: number
  date: string
  state: WeekState
  notes: string[]
}

const TOTAL_WEEKS = 52

const DECISION_NOTE: Record<BillHistoryEntry['decision'], string> = {
  signed: 'Signed',
  vetoed: 'Vetoed',
  overridden: 'Veto overridden',
  auto_passed: 'Passed without signature',
}

function weekState(week: number, currentWeek: number): WeekState {
  if (week < currentWeek) return 'past'
  if (week === currentWeek) return 'current'
  return 'future'
}

function billNotes(
  week: number,
  history: readonly BillHistoryEntry[],
  billTitles: Readonly<Record<string, string>>,
): string[] {
  return history
    .filter(entry => entry.weekDecided === week)
    .map(entry => {
      const title = billTitles[entry.billId] ?? entry.billTitle ?? entry.billId
      return `${DECISION_NOTE[entry.decision]}: ${title}`
    })
}

function eventNotes(week: number): string[] {
  return PUBLIC_EVENTS.filter(event => event.week === week).map(event => event.label)
}

export function calendarWeeks(
  currentWeek: number,
  history: readonly BillHistoryEntry[],
  billTitles: Readonly<Record<string, string>>,
): CalendarWeek[] {
  return Array.from({ length: TOTAL_WEEKS }, (_, index) => {
    const week = index + 1
    const state = weekState(week, currentWeek)
    const bills = state === 'future' ? [] : billNotes(week, history, billTitles)
    return { week, date: weekToDate(week), state, notes: [...bills, ...eventNotes(week)] }
  })
}
