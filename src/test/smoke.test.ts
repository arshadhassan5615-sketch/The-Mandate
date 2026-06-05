// Smoke test — confirms the Vitest harness, jsdom env, audio mocks, and
// fake-indexeddb are all wired up before we write 200 real tests against them.
//
// If this test fails, the failure is configuration, not a product bug.
// Check vitest.config.ts and src/test/setup.ts first.

import { describe, it, expect } from 'vitest'

import { buildGameState } from './factories/gameStateFactory'
import { buildNarrativeNode } from './factories/sceneFactory'
import { STAT_RANGES } from '../types/gameState'

describe('test harness', () => {
  it('loads the buildGameState factory and produces a Week-1 state', () => {
    const state = buildGameState()
    expect(state.currentWeek).toBe(1)
    expect(state.currentAct).toBe(1)
    expect(state.nation.economyHealth).toBe(-18)
  })

  it('loads the buildNarrativeNode factory with sane defaults', () => {
    const scene = buildNarrativeNode()
    expect(scene.id).toBe('test_scene_1')
    expect(scene.segments).toHaveLength(1)
    expect(scene.choices).toEqual([])
  })

  it('reads STAT_RANGES from the real types module', () => {
    expect(STAT_RANGES['nation.economyHealth']).toEqual([-100, 100])
    expect(STAT_RANGES['factions.halvekists']).toEqual([0, 100])
  })

  it('jsdom environment provides window and document', () => {
    expect(typeof window).toBe('object')
    expect(typeof document).toBe('object')
  })
})
