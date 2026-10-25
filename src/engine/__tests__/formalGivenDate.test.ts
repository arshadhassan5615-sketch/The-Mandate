import { describe, it, expect } from 'vitest'
import { formalGivenDate, ordinalWord, weekToDate, yearWords } from '../dates'

/** First week of 1963 whose date falls on the given day of the month. */
function weekOnDay(day: number): number {
  for (let week = 1; week <= 52; week++) {
    if (weekToDate(week).startsWith(`${day} `)) return week
  }
  throw new Error(`no week in 1963 falls on day ${day}`)
}

describe('ordinalWord', () => {
  it('spells the day of the month in words', () => {
    expect(ordinalWord(1)).toBe('first')
    expect(ordinalWord(8)).toBe('eighth')
    expect(ordinalWord(21)).toBe('twenty-first')
    expect(ordinalWord(22)).toBe('twenty-second')
    expect(ordinalWord(30)).toBe('thirtieth')
    expect(ordinalWord(31)).toBe('thirty-first')
  })

  it('rejects days outside 1-31', () => {
    expect(() => ordinalWord(0)).toThrow(RangeError)
    expect(() => ordinalWord(32)).toThrow(RangeError)
  })
})

describe('yearWords', () => {
  it('spells 1900-1999 years in words', () => {
    expect(yearWords(1900)).toBe('nineteen hundred')
    expect(yearWords(1907)).toBe('nineteen hundred and seven')
    expect(yearWords(1963)).toBe('nineteen hundred and sixty-three')
    expect(yearWords(1970)).toBe('nineteen hundred and seventy')
    expect(yearWords(1999)).toBe('nineteen hundred and ninety-nine')
  })

  it('rejects years outside 1900-1999', () => {
    expect(() => yearWords(2001)).toThrow(RangeError)
  })
})

describe('formalGivenDate', () => {
  it('dates week 2 as the eighth of January 1963', () => {
    expect(weekToDate(2)).toBe('8 January 1963')
    expect(formalGivenDate(2)).toBe('this eighth day of January, in the year nineteen hundred and sixty-three')
  })

  it.each([21, 22, 30])('uses the ordinal for day %i', (day) => {
    const week = weekOnDay(day)
    expect(formalGivenDate(week)).toContain(`this ${ordinalWord(day)} day of `)
  })
})
