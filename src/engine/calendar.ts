import type { BillHistoryEntry } from '../types/bills'
import { ACTS, PUBLIC_EVENTS } from '../data/calendar/calendarFacts'
import { weekToDate } from './dates'

// The calendar of 1963: fifty-two weeks in four acts, each with what is publicly
// known about it. Bill notes only appear for weeks already lived, so a future bill
// is never named here, even if the history somehow holds it. The acts and scheduled
// events themselves are story facts and live in data/calendar/calendarFacts.ts.

export { ACTS, PUBLIC_EVENTS }
export type { CalendarAct, ScheduledEvent } from '../data/calendar/calendarFacts'

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
