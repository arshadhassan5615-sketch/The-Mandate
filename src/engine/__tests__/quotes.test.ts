import { describe, it, expect } from 'vitest'
import { stripOuterQuotes } from '../quotes'

describe('stripOuterQuotes', () => {
  it('removes a straight pair of outer quotes', () => {
    expect(stripOuterQuotes('"I promise."')).toBe('I promise.')
  })

  it('removes a curly pair of outer quotes', () => {
    expect(stripOuterQuotes('“I promise.”')).toBe('I promise.')
  })

  it('removes only a leading quote when there is no trailing one', () => {
    expect(stripOuterQuotes('"I promise.')).toBe('I promise.')
  })

  it('removes only a trailing quote when there is no leading one', () => {
    expect(stripOuterQuotes('I promise."')).toBe('I promise.')
  })

  it('leaves inner quotes untouched', () => {
    expect(stripOuterQuotes('He said "no" today')).toBe('He said "no" today')
    expect(stripOuterQuotes('"He said "no" today"')).toBe('He said "no" today')
  })

  it('trims surrounding whitespace before and after removing quotes', () => {
    expect(stripOuterQuotes('   "Let them."   ')).toBe('Let them.')
    expect(stripOuterQuotes('  I promise.  ')).toBe('I promise.')
  })
})
