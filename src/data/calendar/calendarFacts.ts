// Story facts for the 1963 calendar: the four acts and the publicly scheduled events.
// The calendar engine reads these; it never defines them.

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
