import { describe, it, expect } from 'vitest'
import { paperName } from '../paperName'
import { NEWSPAPERS } from '../newspapers'

describe('paperName', () => {
  it('returns the masthead name for a known paper', () => {
    // Arrange
    const publication = 'ashenmere_herald'

    // Act
    const name = paperName(publication)

    // Assert
    expect(name).toBe(NEWSPAPERS.ashenmere_herald.name)
    expect(name).toBe('The Ashenmere Herald')
  })

  it('builds a readable title from a paper id with no masthead entry', () => {
    expect(paperName('veltrian_voice')).toBe('The Veltrian Voice')
  })

  it('does not double the article when the id starts with "the_"', () => {
    expect(paperName('the_veltrian_voice')).toBe('The Veltrian Voice')
  })

  it('does not treat inherited Object properties as known papers', () => {
    expect(paperName('toString')).toBe('The ToString')
  })
})
