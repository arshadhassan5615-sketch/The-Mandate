import { describe, it, expect } from 'vitest'
import { charName, speakerRole } from '../speakers'

describe('speakers', () => {
  it('maps speaker ids to display names', () => {
    expect(charName('katerin_ashavel')).toBe('Chancellor Ashavel')
    expect(charName('vyktor_reznik')).toBe('Vyktor Reznik')
  })

  it('falls back to a readable name for unlisted ids', () => {
    expect(charName('some_new_minister')).toBe('some new minister')
  })

  it('looks up the role title from the character roster', () => {
    expect(speakerRole('vyktor_reznik')).toBe('Chief of Staff')
    expect(speakerRole('danika_oberlin')).toBe('Minister of the Interior')
  })

  it('accepts roster-style ids too', () => {
    expect(speakerRole('character_elara_vostane')).toBe('Minister of Finance')
  })

  it('returns undefined for speakers without a roster entry', () => {
    expect(speakerRole('generic')).toBeUndefined()
    expect(speakerRole('')).toBeUndefined()
  })
})
