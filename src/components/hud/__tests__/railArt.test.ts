import { describe, it, expect } from 'vitest'
import { getRailArt } from '../../../assets/railArt'
import { pickArt } from '../../../assets/sealArt'

describe('getRailArt', () => {
  it('returns null when no painted logo exists for the key', () => {
    expect(getRailArt('does-not-exist')).toBeNull()
  })
})

describe('pickArt for rail logos', () => {
  it('returns the url of the glob entry whose file name matches', () => {
    expect(pickArt({ './images/rail-icons/state.png': 'url' }, 'state.png')).toBe('url')
  })

  it('returns null when no glob entry matches the file name', () => {
    expect(pickArt({ './images/rail-icons/state.png': 'url' }, 'letters.png')).toBeNull()
  })
})
