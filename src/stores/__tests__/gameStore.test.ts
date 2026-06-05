// Tests for the master gameStore. This is where the project's CLAUDE.md
// calls out consolidation work: dedupe state-object literals, declare missing
// setters. These tests lock in the CURRENT behavior so the refactor can move
// safely.
//
// Pattern: use the Zustand vanilla API (useGameStore.getState() / setState())
// directly, not React hooks. This keeps tests fast and isolated.

import { describe, it, expect, beforeEach } from 'vitest'

import { useGameStore } from '../gameStore'
import { buildGameState } from '../../test/factories/gameStateFactory'
import type { StateModifier } from '../../types/gameState'

// Helper: reset the store to its built-in INITIAL_STATE before each test.
// resetToInitial() preserves the action methods (applyModifiers, etc.),
// which a raw setState(replace: true) would blow away.
function resetStore() {
  useGameStore.getState().resetToInitial()
}

describe('gameStore.applyModifiers', () => {
  beforeEach(resetStore)

  it('adds a value to a numeric stat within the same sub-object', () => {
    const before = useGameStore.getState().nation.pressFreedom
    useGameStore.getState().applyModifiers([
      { stat: 'nation.pressFreedom', operation: 'add', value: 10 },
    ])
    expect(useGameStore.getState().nation.pressFreedom).toBe(before + 10)
  })

  it('clamps the result to STAT_RANGES (above max)', () => {
    // nation.publicOrder has range [0, 100]
    useGameStore.setState({
      nation: { ...useGameStore.getState().nation, publicOrder: 95 },
    })
    useGameStore.getState().applyModifiers([
      { stat: 'nation.publicOrder', operation: 'add', value: 50 },
    ])
    expect(useGameStore.getState().nation.publicOrder).toBe(100) // clamped, not 145
  })

  it('clamps the result to STAT_RANGES (below min)', () => {
    useGameStore.setState({
      nation: { ...useGameStore.getState().nation, publicOrder: 5 },
    })
    useGameStore.getState().applyModifiers([
      { stat: 'nation.publicOrder', operation: 'add', value: -20 },
    ])
    expect(useGameStore.getState().nation.publicOrder).toBe(0) // clamped, not -15
  })

  it('clamps the result of a multiply operation', () => {
    useGameStore.setState({
      nation: { ...useGameStore.getState().nation, publicOrder: 80 },
    })
    useGameStore.getState().applyModifiers([
      { stat: 'nation.publicOrder', operation: 'multiply', value: 2 },
    ])
    expect(useGameStore.getState().nation.publicOrder).toBe(100) // 160 → clamped to 100
  })

  it('applies a set operation to the exact value (still clamps)', () => {
    useGameStore.getState().applyModifiers([
      { stat: 'nation.pressFreedom', operation: 'set', value: 75 },
    ])
    expect(useGameStore.getState().nation.pressFreedom).toBe(75)
  })

  it('leaves the state unchanged for an unknown stat path', () => {
    // Snapshot key fields before applying the bogus modifier
    resetStore()
    const before = useGameStore.getState()
    const mod: StateModifier = { stat: 'nation.bogusField', operation: 'add', value: 100 }
    useGameStore.getState().applyModifiers([mod])

    // State is unchanged for the fields we care about. The applyModifier
    // helper logs a console.warn for unknown paths and returns the same
    // sub-state, so equality on representative stats is the right assertion.
    const after = useGameStore.getState()
    expect(after.nation.pressFreedom).toBe(before.nation.pressFreedom)
    expect(after.nation.economyHealth).toBe(before.nation.economyHealth)
  })

  it('applies multiple modifiers in order', () => {
    useGameStore.setState({
      nation: { ...useGameStore.getState().nation, publicOrder: 50 },
    })
    useGameStore.getState().applyModifiers([
      { stat: 'nation.publicOrder', operation: 'add', value: 10 },        // 60
      { stat: 'nation.publicOrder', operation: 'multiply', value: 1.5 },  // 90
    ])
    expect(useGameStore.getState().nation.publicOrder).toBe(90)
  })
})

describe('gameStore.declareStateOfEmergency', () => {
  beforeEach(resetStore)

  it('flips stateOfEmergency to true and stamps the current week', () => {
    useGameStore.setState({ currentWeek: 12 })
    useGameStore.getState().declareStateOfEmergency()

    const s = useGameStore.getState()
    expect(s.stateOfEmergency).toBe(true)
    expect(s.stateOfEmergencyWeek).toBe(12)
    expect(s.stateOfEmergencyExtensions).toBe(0)
    expect(s.emergencyDecreesIssued).toBe(0)
  })
})

describe('gameStore.extendStateOfEmergency', () => {
  beforeEach(resetStore)

  it('increments the extension counter and updates the stamped week', () => {
    useGameStore.getState().declareStateOfEmergency()
    useGameStore.setState({ currentWeek: 14 })
    useGameStore.getState().extendStateOfEmergency()

    const s = useGameStore.getState()
    expect(s.stateOfEmergencyExtensions).toBe(1)
    expect(s.stateOfEmergencyWeek).toBe(14)
    expect(s.stateOfEmergency).toBe(true) // still active
  })
})

describe('gameStore.liftStateOfEmergency', () => {
  beforeEach(resetStore)

  it('flips stateOfEmergency to false and resets the stamped week to 0', () => {
    useGameStore.getState().declareStateOfEmergency()
    useGameStore.getState().liftStateOfEmergency()

    const s = useGameStore.getState()
    expect(s.stateOfEmergency).toBe(false)
    expect(s.stateOfEmergencyWeek).toBe(0)
  })
})

describe('gameStore.setSeridaDead', () => {
  beforeEach(resetStore)

  it('flips seridaAlive to false', () => {
    expect(useGameStore.getState().seridaAlive).toBe(true)
    useGameStore.getState().setSeridaDead()
    expect(useGameStore.getState().seridaAlive).toBe(false)
  })
})
