import { describe, it, expect } from 'vitest'
import { initialsFor } from '../initials'

describe('initialsFor', () => {
  it('returns the initials of a two-word name', () => {
    expect(initialsFor('Gregor Marić')).toBe('GM')
  })

  it('takes only the first two words of a longer name', () => {
    expect(initialsFor('Col. Irina Dusek')).toBe('CI')
  })

  it('returns a single initial for a one-word name', () => {
    expect(initialsFor('Vyktor')).toBe('V')
  })

  it('ignores extra and leading or trailing whitespace', () => {
    expect(initialsFor('  Irina    Dusek  ')).toBe('ID')
  })

  it('returns an empty string for an empty name', () => {
    expect(initialsFor('')).toBe('')
  })

  it('returns an empty string for a blank name', () => {
    expect(initialsFor('   ')).toBe('')
  })

  it('upper-cases a non-Latin first letter', () => {
    expect(initialsFor('žarko Ilić')).toBe('ŽI')
    expect(initialsFor('Žarko Ilić')).toBe('ŽI')
  })
})
