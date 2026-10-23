import { describe, it, expect } from 'vitest'
import { pickArt, getSealArt } from '../sealArt'

describe('pickArt', () => {
  it('returns the url when the file name matches a glob key', () => {
    expect(pickArt({ './images/seals/ashenmere.png': 'url:m' }, 'ashenmere.png')).toBe('url:m')
  })

  it('returns null when the glob map is empty', () => {
    expect(pickArt({}, 'ashenmere.png')).toBeNull()
  })

  it('returns null when only other files are present', () => {
    expect(pickArt({ './images/seals/other.png': 'x' }, 'ashenmere.png')).toBeNull()
  })
})

describe('getSealArt', () => {
  it('returns the painted medal for a province that has one', () => {
    const url = getSealArt('ashenmere')
    expect(typeof url).toBe('string')
    expect(url).toContain('ashenmere')
  })

  it('returns null for a province without a painted medal', () => {
    expect(getSealArt('no_such_province')).toBeNull()
  })
})
