// economyHistory: week-by-week economy tracking + Dexie save/load round-trip.
// Mirrors the completeWeek push (after deferred decree effects) and the
// SaveManager explicit field list so persistence is proven on the real path.

import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../gameStore'
import { saveGame, loadGame } from '../../engine/SaveManager'
import { db } from '../../db/mandateDb'

function resetStore() {
  useGameStore.getState().resetToInitial()
}

/** Same push used in weekStore.completeWeek after deferred decree effects. */
function pushEconomyHistorySnapshot() {
  useGameStore.setState((state) => ({
    economyHistory: [
      ...(state.economyHistory ?? []),
      { week: state.currentWeek, value: state.nation.economyHealth },
    ],
  }))
}

describe('economyHistory tracking', () => {
  beforeEach(async () => {
    resetStore()
    await db.saves.clear()
  })

  it('starts empty and appends { week, value } from current economyHealth', () => {
    expect(useGameStore.getState().economyHistory).toEqual([])

    useGameStore.setState({
      currentWeek: 3,
      nation: { ...useGameStore.getState().nation, economyHealth: -10 },
    })
    pushEconomyHistorySnapshot()

    expect(useGameStore.getState().economyHistory).toEqual([
      { week: 3, value: -10 },
    ])
  })

  it('appends multiple weeks without mutating prior entries', () => {
    useGameStore.setState({
      currentWeek: 1,
      nation: { ...useGameStore.getState().nation, economyHealth: -18 },
    })
    pushEconomyHistorySnapshot()

    useGameStore.setState({
      currentWeek: 2,
      nation: { ...useGameStore.getState().nation, economyHealth: -12 },
    })
    pushEconomyHistorySnapshot()

    const history = useGameStore.getState().economyHistory
    expect(history).toEqual([
      { week: 1, value: -18 },
      { week: 2, value: -12 },
    ])
  })

  it('persists economyHistory through saveGame / loadGame (Dexie path)', async () => {
    useGameStore.setState({
      currentWeek: 5,
      nation: { ...useGameStore.getState().nation, economyHealth: 4 },
    })
    pushEconomyHistorySnapshot()
    useGameStore.setState({
      currentWeek: 6,
      nation: { ...useGameStore.getState().nation, economyHealth: 7 },
    })
    pushEconomyHistorySnapshot()

    const before = useGameStore.getState().economyHistory
    expect(before).toEqual([
      { week: 5, value: 4 },
      { week: 6, value: 7 },
    ])

    await saveGame(1, 'economy-history-test')

    // Wipe live store so load cannot pass by leaving old memory in place
    resetStore()
    expect(useGameStore.getState().economyHistory).toEqual([])

    const ok = await loadGame(1)
    expect(ok).toBe(true)

    expect(useGameStore.getState().economyHistory).toEqual([
      { week: 5, value: 4 },
      { week: 6, value: 7 },
    ])
  })
})
