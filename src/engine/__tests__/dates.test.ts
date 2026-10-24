import { describe, expect, it } from 'vitest'
import { formatGameDate, weekToDate } from '../dates'

describe('formatGameDate', () => {
  it('formats a date as day, full month name, year', () => {
    expect(formatGameDate(new Date(1963, 2, 15))).toBe('15 March 1963')
  })
})

describe('weekToDate', () => {
  it('returns the 1963 start date for week 1', () => {
    expect(weekToDate(1)).toBe('1 January 1963')
  })

  it('advances seven days per week', () => {
    expect(weekToDate(2)).toBe('8 January 1963')
  })

  it('rolls over month boundaries', () => {
    expect(weekToDate(9)).toBe('26 February 1963')
  })

  it('returns the final week of the year', () => {
    expect(weekToDate(52)).toBe('24 December 1963')
  })

  it('rolls the year over into 1964', () => {
    expect(weekToDate(53)).toBe('31 December 1963')
    expect(weekToDate(54)).toBe('7 January 1964')
  })
})
