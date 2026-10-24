import { afterEach, beforeEach, describe, expect, it } from 'vitest'
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
