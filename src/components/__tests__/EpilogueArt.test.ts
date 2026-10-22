import { describe, it, expect } from 'vitest'
import { getEpilogueArt } from '../../assets/epilogueArt'
import type { GovernanceOutcome } from '../../types/ending'

const OUTCOMES: GovernanceOutcome[] = [
  'democratic_triumph',
  'benevolent_autocrat',
  'war_survivor',
  'economic_survivor',
  'revolutionary',
  'collapse',
]

describe('getEpilogueArt', () => {
  it.each(OUTCOMES)('returns an image url for %s', (outcome) => {
    // Arrange / Act
    const url = getEpilogueArt(outcome)

    // Assert
    expect(url).not.toBeNull()
    expect(typeof url).toBe('string')
  })
})
