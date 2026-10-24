import { describe, expect, it } from 'vitest'
import { ACTS, PUBLIC_EVENTS, calendarWeeks } from '../calendar'
import { weekToDate } from '../dates'
import type { BillHistoryEntry } from '../../types/bills'

const TITLES: Readonly<Record<string, string>> = {
  bill_land: 'Land Reform Act',
  bill_press: 'Free Press Bill',
  bill_tax: 'Tax Relief Bill',
  bill_mines: 'Mines Bill',
  bill_future: 'Future Bill',
}

function decided(billId: string, decision: BillHistoryEntry['decision'], weekDecided: number): BillHistoryEntry {
  return { billId, weekPresented: 1, decision, weekDecided }
}

describe('calendarWeeks', () => {
  it('returns the 52 weeks of 1963 in order', () => {
    const weeks = calendarWeeks(1, [], TITLES)
    expect(weeks).toHaveLength(52)
    expect(weeks.map(w => w.week)).toEqual(Array.from({ length: 52 }, (_, i) => i + 1))
    expect(weeks[0].date).toBe(weekToDate(1))
    expect(weeks[51].date).toBe(weekToDate(52))
  })

  it('covers weeks 1 to 52 with the four acts and no gaps', () => {
    expect(ACTS.map(a => a.number)).toEqual([1, 2, 3, 4])
    expect(ACTS[0].firstWeek).toBe(1)
    expect(ACTS[ACTS.length - 1].lastWeek).toBe(52)
    for (let i = 1; i < ACTS.length; i++) {
      expect(ACTS[i].firstWeek).toBe(ACTS[i - 1].lastWeek + 1)
    }
  })

  it('marks weeks before the current week as past, the current week as current, and later weeks as future', () => {
    const weeks = calendarWeeks(14, [], TITLES)
    expect(weeks[12].state).toBe('past')
    expect(weeks[13].state).toBe('current')
    expect(weeks[14].state).toBe('future')
    expect(weeks.filter(w => w.state === 'past')).toHaveLength(13)
    expect(weeks.filter(w => w.state === 'future')).toHaveLength(38)
  })

  it('writes Signed, Vetoed, Veto overridden and Passed without signature notes on the decided week', () => {
    const history = [
      decided('bill_land', 'signed', 5),
      decided('bill_press', 'vetoed', 5),
      decided('bill_tax', 'overridden', 7),
      decided('bill_mines', 'auto_passed', 9),
    ]
    const weeks = calendarWeeks(14, history, TITLES)
    expect(weeks[4].notes).toEqual(['Signed: Land Reform Act', 'Vetoed: Free Press Bill'])
    expect(weeks[6].notes).toEqual(['Veto overridden: Tax Relief Bill'])
    expect(weeks[8].notes).toEqual(['Passed without signature: Mines Bill'])
    expect(weeks[3].notes).toEqual([])
  })

  it('falls back to the history title, then the bill id, when the title map has no entry', () => {
    const history = [
      { ...decided('bill_unknown', 'signed', 3), billTitle: 'Recorded Title' },
      decided('bill_bare', 'vetoed', 4),
    ]
    const weeks = calendarWeeks(10, history, TITLES)
    expect(weeks[2].notes).toEqual(['Signed: Recorded Title'])
    expect(weeks[3].notes).toEqual(['Vetoed: bill_bare'])
  })

  it('never attaches bill notes to future weeks, even when the history holds them', () => {
    const history = [decided('bill_future', 'signed', 20)]
    const weeks = calendarWeeks(14, history, TITLES)
    expect(weeks[19].state).toBe('future')
    expect(weeks[19].notes).toEqual([])
    expect(JSON.stringify(weeks)).not.toContain('Future Bill')
  })

  it('shows the public events on week 26 and week 52', () => {
    const weeks = calendarWeeks(1, [], TITLES)
    expect(weeks[25].notes).toEqual(['Constitutional referendum'])
    expect(weeks[51].notes).toEqual(['End of the first year'])
    expect(PUBLIC_EVENTS.map(e => e.week)).toEqual([26, 52])
  })

  it('lists bill notes before the public event on the same week', () => {
    const history = [decided('bill_land', 'signed', 26)]
    const weeks = calendarWeeks(30, history, TITLES)
    expect(weeks[25].notes).toEqual(['Signed: Land Reform Act', 'Constitutional referendum'])
  })
})
