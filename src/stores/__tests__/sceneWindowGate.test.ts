import { beforeEach, describe, expect, it } from 'vitest'
import { resetWorld, bootWeek, poolIds, pool } from '../../test/simHarness'

// Real data: agenda_w11_nadia_inquiry (week11.json) has weekAvailable 11, but
// its scene act1_week12_nadia_voss declares weekAvailable 12 / weekDeadline 14.
// buildPool must intersect the agenda window with the scene window.
const NADIA_SCENE_ID = 'act1_week12_nadia_voss'

describe('buildPool scene window gate', () => {
  beforeEach(() => {
    resetWorld()
  })

  it('does not offer the nadia inquiry at week 11, before its scene opens', () => {
    // Arrange + Act
    bootWeek(11)

    // Assert
    const nadiaItems = pool().filter(i => i.sceneId === NADIA_SCENE_ID)
    expect(nadiaItems).toEqual([])
    expect(poolIds()).not.toContain('agenda_w11_nadia_inquiry')
  })

  it('offers the nadia inquiry at week 12, when its scene window opens', () => {
    // Arrange + Act
    bootWeek(12)

    // Assert
    const nadiaItems = pool().filter(i => i.sceneId === NADIA_SCENE_ID)
    expect(nadiaItems.length).toBeGreaterThan(0)
    expect(poolIds()).toContain('agenda_w11_nadia_inquiry')
  })

  it('keeps recurring petitions offered after their scene weekDeadline', () => {
    // Arrange: act_citizen_petitions declares weekAvailable 4 / weekDeadline 5.
    // Recurring items are pushed by initWeek and reuse that scene every 4 weeks,
    // so week 8 is past the scene's own deadline and must still be offered.
    // Note: no agenda JSON entry is `recurring: true`; this covers the
    // hard-coded recurring petition item only.

    // Act
    bootWeek(8)

    // Assert
    expect(poolIds()).toContain('citizen_petitions_8')
  })
})
