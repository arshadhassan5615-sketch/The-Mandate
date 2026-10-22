import { describe, it, expect, beforeEach } from 'vitest'
import { LS_ENDINGS, getReachedEndings, recordEnding } from '../collections'

describe('collections', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts empty', () => {
    expect(getReachedEndings()).toEqual([])
  })

  it('records an ending once', () => {
    expect(recordEnding('a')).toEqual(['a'])
    expect(recordEnding('a')).toEqual(['a'])
    expect(recordEnding('b')).toEqual(['a', 'b'])
    expect(getReachedEndings()).toEqual(['a', 'b'])
  })

  it('returns [] for invalid JSON', () => {
    localStorage.setItem(LS_ENDINGS, '{not json')
    expect(getReachedEndings()).toEqual([])
  })

  it('records after invalid JSON', () => {
    localStorage.setItem(LS_ENDINGS, '{not json')
    expect(recordEnding('x')).toEqual(['x'])
    expect(getReachedEndings()).toEqual(['x'])
  })
})
