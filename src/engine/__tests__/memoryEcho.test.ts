import { describe, expect, it } from 'vitest'
import { CHARACTERS } from '../../data/characters/roster'
import { PERSON_STATS, memoryEchoFor } from '../memoryEcho'

describe('memoryEchoFor', () => {
  it('names the faction when no one from it is present', () => {
    // Arrange
    const choice = { stateChanges: [{ stat: 'factions.ironCovenant', operation: 'add', value: 10 }] }

    // Act
    const echo = memoryEchoFor(choice, [])

    // Assert
    expect(echo).toEqual({ subjectId: 'faction:ironCovenant', name: 'The Iron Covenant' })
  })

  it('names the present faction member instead of the faction', () => {
    // Arrange
    const choice = { stateChanges: [{ stat: 'factions.ironCovenant', operation: 'add', value: 10 }] }

    // Act
    const echo = memoryEchoFor(choice, ['colonel_dusek'])

    // Assert
    expect(echo).toEqual({ subjectId: 'character_colonel_dusek', name: 'Col. Irina Dusek' })
  })

  it('names the family member for a personal stat', () => {
    // Arrange
    const choice = { stateChanges: [{ stat: 'personal.marriageHealth', operation: 'add', value: -8 }] }

    // Act
    const echo = memoryEchoFor(choice, [])

    // Assert
    expect(echo).toEqual({ subjectId: 'character_jonas_ashavel', name: 'Jonas Ashavel' })
  })

  it('returns null for a personal stat that names no one', () => {
    // Arrange
    const choice = { stateChanges: [{ stat: 'personal.publicImage', operation: 'add', value: 20 }] }

    // Act
    const echo = memoryEchoFor(choice, [])

    // Assert
    expect(echo).toBeNull()
  })

  it('ignores changes below the threshold', () => {
    // Arrange
    const choice = { stateChanges: [{ stat: 'factions.reformists', operation: 'add', value: 4 }] }

    // Act
    const echo = memoryEchoFor(choice, [])

    // Assert
    expect(echo).toBeNull()
  })

  it('counts a change exactly at the threshold', () => {
    // Arrange
    const choice = { stateChanges: [{ stat: 'factions.reformists', operation: 'add', value: -5 }] }

    // Act
    const echo = memoryEchoFor(choice, [])

    // Assert
    expect(echo).toEqual({ subjectId: 'faction:reformists', name: 'Civic Renewal' })
  })

  it('ignores set operations', () => {
    // Arrange
    const choice = { stateChanges: [{ stat: 'factions.ironCovenant', operation: 'set', value: 90 }] }

    // Act
    const echo = memoryEchoFor(choice, [])

    // Assert
    expect(echo).toBeNull()
  })

  it('lets the largest magnitude win', () => {
    // Arrange
    const choice = {
      stateChanges: [
        { stat: 'factions.reformists', operation: 'add', value: 7 },
        { stat: 'factions.ironCovenant', operation: 'add', value: -12 },
      ],
    }

    // Act
    const echo = memoryEchoFor(choice, [])

    // Assert
    expect(echo).toEqual({ subjectId: 'faction:ironCovenant', name: 'The Iron Covenant' })
  })

  it('keeps the first change on a tie', () => {
    // Arrange
    const choice = {
      stateChanges: [
        { stat: 'factions.reformists', operation: 'add', value: 7 },
        { stat: 'factions.ironCovenant', operation: 'add', value: -7 },
      ],
    }

    // Act
    const echo = memoryEchoFor(choice, [])

    // Assert
    expect(echo).toEqual({ subjectId: 'faction:reformists', name: 'Civic Renewal' })
  })

  it('uses legacy statEffects when stateChanges is missing', () => {
    // Arrange
    const choice = { statEffects: [{ stat: 'personal.marriageHealth', value: -8 }] }

    // Act
    const echo = memoryEchoFor(choice, [])

    // Assert
    expect(echo).toEqual({ subjectId: 'character_jonas_ashavel', name: 'Jonas Ashavel' })
  })

  it('uses legacy statEffects when stateChanges is empty', () => {
    // Arrange
    const choice = {
      stateChanges: [],
      statEffects: [{ stat: 'personal.marriageHealth', value: -8 }],
    }

    // Act
    const echo = memoryEchoFor(choice, [])

    // Assert
    expect(echo).toEqual({ subjectId: 'character_jonas_ashavel', name: 'Jonas Ashavel' })
  })

  it('names Vyktor Reznik for an advisor trust change', () => {
    // Arrange
    const choice = { stateChanges: [{ stat: 'advisorTrust.vyktor', operation: 'add', value: 6 }] }

    // Act
    const echo = memoryEchoFor(choice, [])

    // Assert
    expect(echo).toEqual({ subjectId: 'character_vyktor_reznik', name: 'Vyktor Reznik' })
  })

  it('names Danika Oberlin for an advisor trust change', () => {
    // Arrange
    const choice = { stateChanges: [{ stat: 'advisorTrust.danika', operation: 'add', value: 6 }] }

    // Act
    const echo = memoryEchoFor(choice, [])

    // Assert
    expect(echo).toEqual({ subjectId: 'character_danika_oberlin', name: 'Danika Oberlin' })
  })

  it('names Prof. Aldric Theron for an advisor trust change', () => {
    // Arrange
    const choice = { stateChanges: [{ stat: 'advisorTrust.theron', operation: 'add', value: 6 }] }

    // Act
    const echo = memoryEchoFor(choice, [])

    // Assert
    expect(echo).toEqual({ subjectId: 'character_aldric_theron', name: 'Prof. Aldric Theron' })
  })

  it('names Col. Irina Dusek for an advisor trust change', () => {
    // Arrange
    const choice = { stateChanges: [{ stat: 'advisorTrust.dusek', operation: 'add', value: -9 }] }

    // Act
    const echo = memoryEchoFor(choice, [])

    // Assert
    expect(echo).toEqual({ subjectId: 'character_colonel_dusek', name: 'Col. Irina Dusek' })
  })

  it('returns null for an advisor with no roster entry', () => {
    // Arrange
    const choice = { stateChanges: [{ stat: 'advisorTrust.soraya', operation: 'add', value: 20 }] }

    // Act
    const echo = memoryEchoFor(choice, [])

    // Assert
    expect(echo).toBeNull()
  })

  it('does not mutate frozen inputs', () => {
    // Arrange
    const change = Object.freeze({ stat: 'factions.ironCovenant', operation: 'add', value: 10 })
    const choice = Object.freeze({ stateChanges: Object.freeze([change]) })
    const presentIds = Object.freeze(['colonel_dusek'])

    // Act
    const echo = memoryEchoFor(choice, presentIds)

    // Assert
    expect(echo).toEqual({ subjectId: 'character_colonel_dusek', name: 'Col. Irina Dusek' })
    expect(choice.stateChanges).toEqual([change])
    expect(presentIds).toEqual(['colonel_dusek'])
  })
})

describe('PERSON_STATS', () => {
  it.each(Object.entries(PERSON_STATS))('%s points at an existing roster id', (_stat, id) => {
    // Arrange
    const rosterIds = CHARACTERS.map(character => character.id)

    // Act
    const exists = rosterIds.includes(id)

    // Assert
    expect(exists).toBe(true)
  })
})
