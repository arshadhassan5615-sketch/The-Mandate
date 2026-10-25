import { describe, it, expect } from 'vitest'
import { getCodexImages, resolveDropIns } from '../codexArt'

describe('getCodexImages', () => {
  it('returns both Morivask flags, junta first, with their captions', () => {
    const images = getCodexImages('nation_morivask')
    expect(images).toHaveLength(2)
    expect(images.every(img => img.kind === 'flag')).toBe(true)
    expect(images[0].caption).toBe('Flag of the Skala junta · since 1959')
    expect(images[1].caption).toBe('Republic of Morivask · until 1959')
  })

  it('returns one flag for the Veltria overview', () => {
    const images = getCodexImages('veltria_overview')
    expect(images).toHaveLength(1)
    expect(images[0].kind).toBe('flag')
    expect(images[0].src).toBeTruthy()
  })

  it('returns a medal for a province that has painted seal art', () => {
    const images = getCodexImages('province_ashenmere')
    expect(images).toHaveLength(1)
    expect(images[0].kind).toBe('medal')
    expect(images[0].caption).toBe('Seal of Ashenmere')
  })

  it('returns a portrait with the character id stripped of its prefix', () => {
    const images = getCodexImages('character_vyktor_reznik')
    expect(images).toEqual([{ kind: 'portrait', characterId: 'vyktor_reznik' }])
  })

  it('returns an empty list for an unknown id', () => {
    expect(getCodexImages('no_such_entry')).toEqual([])
  })
})

describe('resolveDropIns', () => {
  const files = {
    './images/codex/nation_lytheira.png': 'url:main',
    './images/codex/nation_lytheira--winter.jpg': 'url:winter',
    './images/codex/nation_lytheira--autumn.webp': 'url:autumn',
    './images/codex/other_entry.png': 'url:other',
  }

  it('returns the file named exactly as the entry id as the main picture', () => {
    const { main } = resolveDropIns(files, 'nation_lytheira')
    expect(main).toEqual({ kind: 'picture', src: 'url:main' })
  })

  it('returns "--" suffixed files as extra pictures sorted by name', () => {
    const { extras } = resolveDropIns(files, 'nation_lytheira')
    expect(extras.map(e => e.src)).toEqual(['url:autumn', 'url:winter'])
  })

  it('returns no main or extras when no file matches', () => {
    expect(resolveDropIns(files, 'nation_morivask')).toEqual({ main: null, extras: [] })
  })
})
