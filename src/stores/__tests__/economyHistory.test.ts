// Week-by-week nation history (economy / debt / inflation / public order)
// + Dexie save/load round-trip. Mirrors the completeWeek push (after deferred
// decree effects) and the SaveManager explicit field list.

import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../gameStore'
import { saveGame, loadGame } from '../../engine/SaveManager'
import { db } from '../../db/mandateDb'

function resetStore() {
  useGameStore.getState().resetToInitial()
}

/**
 * Same multi-series push used in weekStore.completeWeek after deferred
 * decree effects — one setState for all four histories.
 */
function pushWeekHistorySnapshots() {
  useGameStore.setState((state) => ({
    economyHistory: [
      ...(state.economyHistory ?? []),
      { week: state.currentWeek, value: state.nation.economyHealth },
    ],
    debtHistory: [
      ...(state.debtHistory ?? []),
      { week: state.currentWeek, value: state.nation.nationalDebt },
    ],
    inflationHistory: [
      ...(state.inflationHistory ?? []),
      { week: state.currentWeek, value: state.nation.inflation },
    ],
    publicOrderHistory: [
      ...(state.publicOrderHistory ?? []),
      { week: state.currentWeek, value: state.nation.publicOrder },
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
    pushWeekHistorySnapshots()

    expect(useGameStore.getState().economyHistory).toEqual([
      { week: 3, value: -10 },
    ])
  })

  it('appends multiple weeks without mutating prior entries', () => {
    useGameStore.setState({
      currentWeek: 1,
      nation: { ...useGameStore.getState().nation, economyHealth: -18 },
    })
    pushWeekHistorySnapshots()

    useGameStore.setState({
      currentWeek: 2,
      nation: { ...useGameStore.getState().nation, economyHealth: -12 },
    })
    pushWeekHistorySnapshots()

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
    pushWeekHistorySnapshots()
    useGameStore.setState({
      currentWeek: 6,
      nation: { ...useGameStore.getState().nation, economyHealth: 7 },
    })
    pushWeekHistorySnapshots()

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

describe('debtHistory / inflationHistory / publicOrderHistory tracking', () => {
  beforeEach(async () => {
    resetStore()
    await db.saves.clear()
  })

  it('all three start empty and append from current nation stats', () => {
    const s0 = useGameStore.getState()
    expect(s0.debtHistory).toEqual([])
    expect(s0.inflationHistory).toEqual([])
    expect(s0.publicOrderHistory).toEqual([])

    useGameStore.setState({
      currentWeek: 3,
      nation: {
        ...useGameStore.getState().nation,
        nationalDebt: 355,
        inflation: 11,
        publicOrder: 48,
      },
    })
    pushWeekHistorySnapshots()

    const s1 = useGameStore.getState()
    expect(s1.debtHistory).toEqual([{ week: 3, value: 355 }])
    expect(s1.inflationHistory).toEqual([{ week: 3, value: 11 }])
    expect(s1.publicOrderHistory).toEqual([{ week: 3, value: 48 }])
  })

  it('appends multiple weeks without mutating prior entries', () => {
    useGameStore.setState({
      currentWeek: 1,
      nation: {
        ...useGameStore.getState().nation,
        nationalDebt: 340,
        inflation: 9,
        publicOrder: 55,
      },
    })
    pushWeekHistorySnapshots()

    useGameStore.setState({
      currentWeek: 2,
      nation: {
        ...useGameStore.getState().nation,
        nationalDebt: 348,
        inflation: 10,
        publicOrder: 52,
      },
    })
    pushWeekHistorySnapshots()

    const s = useGameStore.getState()
    expect(s.debtHistory).toEqual([
      { week: 1, value: 340 },
      { week: 2, value: 348 },
    ])
    expect(s.inflationHistory).toEqual([
      { week: 1, value: 9 },
      { week: 2, value: 10 },
    ])
    expect(s.publicOrderHistory).toEqual([
      { week: 1, value: 55 },
      { week: 2, value: 52 },
    ])
  })

  it('persists all three through saveGame / loadGame (Dexie path)', async () => {
    useGameStore.setState({
      currentWeek: 5,
      nation: {
        ...useGameStore.getState().nation,
        nationalDebt: 360,
        inflation: 12,
        publicOrder: 44,
      },
    })
    pushWeekHistorySnapshots()
    useGameStore.setState({
      currentWeek: 6,
      nation: {
        ...useGameStore.getState().nation,
        nationalDebt: 370,
        inflation: 13,
        publicOrder: 40,
      },
    })
    pushWeekHistorySnapshots()

    expect(useGameStore.getState().debtHistory).toEqual([
      { week: 5, value: 360 },
      { week: 6, value: 370 },
    ])
    expect(useGameStore.getState().inflationHistory).toEqual([
      { week: 5, value: 12 },
      { week: 6, value: 13 },
    ])
    expect(useGameStore.getState().publicOrderHistory).toEqual([
      { week: 5, value: 44 },
      { week: 6, value: 40 },
    ])

    await saveGame(1, 'nation-history-test')

    resetStore()
    expect(useGameStore.getState().debtHistory).toEqual([])
    expect(useGameStore.getState().inflationHistory).toEqual([])
    expect(useGameStore.getState().publicOrderHistory).toEqual([])

    const ok = await loadGame(1)
    expect(ok).toBe(true)

    expect(useGameStore.getState().debtHistory).toEqual([
      { week: 5, value: 360 },
      { week: 6, value: 370 },
    ])
    expect(useGameStore.getState().inflationHistory).toEqual([
      { week: 5, value: 12 },
      { week: 6, value: 13 },
    ])
    expect(useGameStore.getState().publicOrderHistory).toEqual([
      { week: 5, value: 44 },
      { week: 6, value: 40 },
    ])
  })
})
