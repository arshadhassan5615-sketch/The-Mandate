// effectLog: centralized audit trail at applyModifier chokepoint.
// Proves real applyModifiers appends correctly-shaped entries, caps at 500,
// and survives Dexie saveGame / loadGame round-trip.

import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../gameStore'
import { saveGame, loadGame } from '../../engine/SaveManager'
import { db } from '../../db/mandateDb'

function resetStore() {
  useGameStore.getState().resetToInitial()
}

describe('effectLog (applyModifier chokepoint)', () => {
  beforeEach(async () => {
    resetStore()
    await db.saves.clear()
  })

  it('starts empty', () => {
    expect(useGameStore.getState().effectLog).toEqual([])
  })

  it('appends a correctly-shaped entry when applyModifiers succeeds', () => {
    useGameStore.setState({ currentWeek: 7 })
    const before = useGameStore.getState().nation.pressFreedom

    useGameStore.getState().applyModifiers([
      { stat: 'nation.pressFreedom', operation: 'add', value: 10 },
    ])

    const after = useGameStore.getState()
    expect(after.nation.pressFreedom).toBe(before + 10)
    expect(after.effectLog).toHaveLength(1)

    const entry = after.effectLog[0]
    expect(entry).toEqual({
      week: 7,
      stat: 'nation.pressFreedom',
      delta: 10,
      operation: 'add',
      sourceType: 'unknown',
      sourceId: 'unknown',
    })
  })

  it('records actual post-clamp delta for set operations', () => {
    useGameStore.setState({
      currentWeek: 2,
      nation: { ...useGameStore.getState().nation, publicOrder: 50 },
    })

    useGameStore.getState().applyModifiers([
      { stat: 'nation.publicOrder', operation: 'set', value: 75 },
    ])

    const entry = useGameStore.getState().effectLog[0]
    expect(entry.stat).toBe('nation.publicOrder')
    expect(entry.operation).toBe('set')
    expect(entry.delta).toBe(25) // 75 - 50
    expect(entry.sourceType).toBe('unknown')
    expect(entry.sourceId).toBe('unknown')
  })

  it('does not append for unknown stat paths', () => {
    useGameStore.getState().applyModifiers([
      { stat: 'nation.bogusField', operation: 'add', value: 100 },
    ])
    expect(useGameStore.getState().effectLog).toEqual([])
  })

  it('caps the log at 500 entries (keeps newest)', () => {
    // publicOrder is 0–100; each +1 from 0 still lands after clamp to 100 eventually,
    // but every successful apply still appends a log entry.
    useGameStore.setState({
      nation: { ...useGameStore.getState().nation, publicOrder: 0 },
    })

    for (let i = 0; i < 520; i++) {
      useGameStore.getState().applyModifiers([
        { stat: 'nation.publicOrder', operation: 'add', value: 1 },
      ])
    }

    const log = useGameStore.getState().effectLog
    expect(log).toHaveLength(500)
    // Newest entry is last; after many adds publicOrder is clamped at 100 so late
    // deltas are 0, but the log still has exactly 500 newest entries.
    expect(log[log.length - 1].stat).toBe('nation.publicOrder')
    expect(log[0].week).toBe(1)
  })

  it('persists effectLog through saveGame / loadGame (Dexie path)', async () => {
    useGameStore.setState({ currentWeek: 4 })
    useGameStore.getState().applyModifiers([
      { stat: 'nation.economyHealth', operation: 'add', value: 5 },
    ])
    useGameStore.getState().applyModifiers([
      { stat: 'factions.reformists', operation: 'add', value: -3 },
    ])

    const before = useGameStore.getState().effectLog
    expect(before).toHaveLength(2)
    expect(before[0].stat).toBe('nation.economyHealth')
    expect(before[0].delta).toBe(5)
    expect(before[1].stat).toBe('factions.reformists')
    expect(before[1].delta).toBe(-3)

    await saveGame(2, 'effect-log-test')

    resetStore()
    expect(useGameStore.getState().effectLog).toEqual([])

    const ok = await loadGame(2)
    expect(ok).toBe(true)

    const loaded = useGameStore.getState().effectLog
    expect(loaded).toEqual(before)
  })
})
