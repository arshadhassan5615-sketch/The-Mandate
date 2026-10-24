import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { autoAdvanceDelayMs, hasReadScene, markSceneRead } from '../readRegistry'

const LS_READ_SCENES = 'mandate-read-scenes'

describe('readRegistry', () => {
  beforeEach(() => {
    localStorage.removeItem(LS_READ_SCENES)
  })

  afterEach(() => {
    localStorage.removeItem(LS_READ_SCENES)
  })

  it('reports a scene as read only after it is marked', () => {
    // Arrange
    expect(hasReadScene('act1_briefing')).toBe(false)

    // Act
    markSceneRead('act1_briefing')

    // Assert
    expect(hasReadScene('act1_briefing')).toBe(true)
    expect(hasReadScene('act1_other')).toBe(false)
  })

  it('stores each scene id once', () => {
    // Act
    markSceneRead('act1_briefing')
    markSceneRead('act1_briefing')
    markSceneRead('act2_family')

    // Assert
    expect(JSON.parse(localStorage.getItem(LS_READ_SCENES) ?? '[]')).toEqual([
      'act1_briefing',
      'act2_family',
    ])
  })

  it('treats corrupted JSON as an empty registry', () => {
    // Arrange
    localStorage.setItem(LS_READ_SCENES, '{not json')

    // Act
    const read = hasReadScene('act1_briefing')

    // Assert
    expect(read).toBe(false)
  })

  it('treats a non-array payload as an empty registry', () => {
    // Arrange
    localStorage.setItem(LS_READ_SCENES, '{"act1_briefing":true}')

    // Assert
    expect(hasReadScene('act1_briefing')).toBe(false)
  })

  it('ignores non-string entries in a stored array', () => {
    // Arrange
    localStorage.setItem(LS_READ_SCENES, JSON.stringify([42, null, 'act1_briefing']))

    // Assert
    expect(hasReadScene('act1_briefing')).toBe(true)
    expect(hasReadScene('42')).toBe(false)
  })
})

describe('readRegistry cache', () => {
  beforeEach(() => {
    localStorage.removeItem(LS_READ_SCENES)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.removeItem(LS_READ_SCENES)
  })

  it('reports a scene as read immediately after it is marked', () => {
    // Arrange
    hasReadScene('act1_briefing')
    const parseSpy = vi.spyOn(JSON, 'parse')

    // Act
    markSceneRead('act1_briefing')
    const read = hasReadScene('act1_briefing')

    // Assert
    expect(read).toBe(true)
    expect(parseSpy).not.toHaveBeenCalled()
    expect(JSON.parse(localStorage.getItem(LS_READ_SCENES) ?? '[]')).toEqual(['act1_briefing'])
  })

  it('parses storage at most once for repeated reads of unchanged storage', () => {
    // Arrange
    localStorage.setItem(LS_READ_SCENES, JSON.stringify(['act1_briefing']))
    expect(hasReadScene('act1_briefing')).toBe(true)
    const parseSpy = vi.spyOn(JSON, 'parse')

    // Act
    const results = [
      hasReadScene('act1_briefing'),
      hasReadScene('act2_family'),
      hasReadScene('act1_briefing'),
    ]

    // Assert
    expect(results).toEqual([true, false, true])
    expect(parseSpy).not.toHaveBeenCalled()
  })

  it('picks up a registry written directly to storage', () => {
    // Arrange
    expect(hasReadScene('act1_briefing')).toBe(false)

    // Act
    localStorage.setItem(LS_READ_SCENES, JSON.stringify(['act2_family']))

    // Assert
    expect(hasReadScene('act2_family')).toBe(true)
    expect(hasReadScene('act1_briefing')).toBe(false)
  })
})

describe('autoAdvanceDelayMs', () => {
  it('gives a short line at least the 1400ms reading pause', () => {
    expect(autoAdvanceDelayMs('Yes.')).toBeGreaterThanOrEqual(1400)
    expect(autoAdvanceDelayMs('')).toBe(1400)
  })

  it('caps a long line at 6000ms', () => {
    // Arrange
    const longText = 'x'.repeat(1000)

    // Act
    const delay = autoAdvanceDelayMs(longText)

    // Assert
    expect(delay).toBe(6000)
  })

  it('grows with line length below the cap', () => {
    // Arrange
    const text = 'x'.repeat(10)

    // Assert
    expect(autoAdvanceDelayMs(text)).toBe(1400 + 32 * 10)
  })
})
