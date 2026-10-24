import { describe, it, expect } from 'vitest'
import { speakerColor } from '../speakers'

describe('speakerColor', () => {
  it('returns the configured tint for a recurring character', () => {
    expect(speakerColor('vyktor_reznik')).toBe('#8fb3e0')
  })

  it('gives aliased ids the same colour', () => {
    expect(speakerColor('colonel_dusek')).toBe(speakerColor('irina_dusek'))
  })

  it('falls back to a non-empty colour for unknown ids', () => {
    expect(speakerColor('some_new_minister')).not.toBe('')
  })

  it('gives each inner-circle and family character a distinct colour', () => {
    const ids = [
      'katerin_ashavel',
      'jonas_ashavel',
      'vyktor_reznik',
      'danika_oberlin',
      'elara_vostane',
      'aldric_theron',
      'gregor_maric',
      'drazen_kolvar',
    ]
    const colours = ids.map(id => speakerColor(id))
    expect(new Set(colours).size).toBe(ids.length)
  })
})
