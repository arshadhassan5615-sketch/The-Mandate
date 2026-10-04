// Week-flow simulation — the engine contract behind Fixes A, B and C
// (see docs/AGENT_LOG.md, H-1 / H-2). Each assertion is written against the
// DESIRED behavior; the STEP 1 baseline recorded in the log says which fail
// before the fixes land.
//
//   (a) Fix A   — initWeek-injected items survive the mid-week pool rebuild
//   (b) Fix B   — delayed chain scenes reach the map
//   (c) Fix C   — the week can end with special items in the pool
//   (d) guard   — mid-week save/reload still offers injected items  [Fix A risk]
//   (e) guard   — overdue chains: per-week cap, overflow carried, never dropped
//   (f) guard   — a chain-forced scene appears exactly once        [Fix B risk]
//
// Real timers throughout: each playItem waits out the 500ms scene transition
// and each finishWeek the 1500ms chain tick, so slow tests get explicit
// timeouts below (vitest defaults to 5s).
import { describe, it, expect, beforeEach } from 'vitest'

import { useGameStore } from '../stores/gameStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import { useWeekStore } from '../stores/weekStore'
import { useChainStore } from '../stores/chainStore'
import { db } from '../db/mandateDb'
import { saveGame, loadGame, AUTOSAVE_SLOT } from '../engine/SaveManager'
import { MAX_FORCED_CHAINS_PER_WEEK } from '../engine/weekCompletion'
import type { AgendaItem, AgendaCategory } from '../types/week'
import {
  resetWorld,
  bootWeek,
  pool,
  poolIds,
  offeredIds,
  playItem,
  playAllExcept,
  finishWeek,
  saveAndReload,
  weekComplete,
} from './simHarness'

// Real chain scenes (all present in SCENE_REGISTRY) used as overdue targets.
const OVERDUE_TARGETS = [
  'act1_chain_capital_strike',
  'act1_chain_deficit_crisis',
  'act1_chain_kravenstal_unrest',
  'act1_chain_bni_press',
  'act1_chain_budget_revision',
  'act1_chain_jonas_advisor',
  'act1_chain_liora_archive',
  'act1_chain_kolvar_escalation',
]

function requireItem(id: string): AgendaItem {
  const item = pool().find(i => i.id === id)
  if (!item) throw new Error(`sim: expected pool item "${id}" not found`)
  return item
}

beforeEach(() => {
  resetWorld()
})

describe('Fix A — initWeek-injected items survive the mid-week pool rebuild', () => {
  it('(a) keeps injected items after another scene plays and the pool rebuilds', async () => {
    bootWeek(8)
    expect(poolIds()).toContain('citizen_petitions_8')
    expect(poolIds()).toContain('__radio_address__')

    await playItem(requireItem('agenda_w8_church_and_state'))

    expect(poolIds()).toContain('citizen_petitions_8')
    expect(poolIds()).toContain('__radio_address__')
  }, 20000)
})

describe('Fix B — delayed chain scenes reach the map', () => {
  it('(b) offers a fired chain scene in the next week pool', async () => {
    bootWeek(20)
    useChainStore.getState().schedule(
      [{ targetNodeId: 'act1_chain_deficit_crisis', delayWeeks: 0 }],
      20,
      'sim_choice',
    )
    await finishWeek() // week 20 → 21; the chain tick fires the consequence

    expect(useWeekStore.getState().forcedChainIds).toContain('act1_chain_deficit_crisis')

    useWeekStore.getState().initWeek() // closeDiary seam: the next week starts
    expect(pool().map(i => i.sceneId)).toContain('act1_chain_deficit_crisis')
  }, 20000)

  it('(b2) does not re-offer a chain scene the player already visited', () => {
    useNarrativeStore.getState().markSceneVisited('act1_chain_deficit_crisis')
    useWeekStore.setState({ forcedChainIds: ['act1_chain_deficit_crisis'] })
    bootWeek(21)
    expect(pool().map(i => i.sceneId)).not.toContain('act1_chain_deficit_crisis')
  }, 10000)
})

describe('Fix C — the week can end with special items in the pool', () => {
  it('(c) completes a week containing __budget__ / __constitution__, leaving __radio__ optional', async () => {
    bootWeek(15)
    expect(pool().map(i => i.sceneId)).toContain('__budget__')
    expect(pool().map(i => i.sceneId)).toContain('__radio__')

    await playAllExcept('__radio__')

    expect(weekComplete()).toBe(true)
  }, 40000)

  it('(c2) treats an empty pool as a week that may end', () => {
    expect(weekComplete()).toBe(true)
  }, 10000)
})

describe('Fix A risk guard — mid-week save/reload', () => {
  it('(d) still offers the injected items after save + reload mid-week', async () => {
    bootWeek(8)
    await playItem(requireItem('agenda_w8_church_and_state'))

    await saveAndReload(AUTOSAVE_SLOT)

    expect(poolIds()).toContain('citizen_petitions_8')
    expect(poolIds()).toContain('__radio_address__')
    expect(offeredIds()).toContain('citizen_petitions_8')
  }, 20000)
})

describe('Fix B risk guard — overdue chains never flood a week', () => {
  async function loadOldAutosaveWithOverdueChains(): Promise<void> {
    bootWeek(20)
    // Calm the state so no engine-triggered chain competes for cap slots.
    useGameStore.setState(s => ({
      nation: { ...s.nation, economyHealth: 50, corruption: 5 },
      tyvarenHostility: 10,
    }))
    await saveGame(AUTOSAVE_SLOT, 'OLD AUTOSAVE')
    const rec = await db.saves.get(AUTOSAVE_SLOT)
    if (!rec) throw new Error('sim: autosave missing after saveGame')
    rec.scheduledChains = OVERDUE_TARGETS.map((targetNodeId, i) => ({
      id: `sim_chain_${i}`,
      targetNodeId,
      fireWeek: 2, // long past — the save is old
      sourceId: 'sim_old_save',
    }))
    await db.saves.put(rec)
    resetWorld()
    const ok = await loadGame(AUTOSAVE_SLOT)
    if (!ok) throw new Error('sim: loadGame did not restore the old autosave')
  }

  it('(e) caps forced chain items per week, carries the overflow, never drops any', async () => {
    await loadOldAutosaveWithOverdueChains()

    const simFired: string[] = []
    for (let tick = 0; tick < 3; tick++) {
      await finishWeek()
      const fired = useWeekStore
        .getState()
        .forcedChainIds.filter(id => OVERDUE_TARGETS.includes(id))
      expect.soft(fired.length).toBeLessThanOrEqual(MAX_FORCED_CHAINS_PER_WEEK)
      simFired.push(...fired)
      const remaining = useChainStore
        .getState()
        .scheduled.filter(c => c.id.startsWith('sim_chain_')).length
      expect.soft(remaining).toBe(OVERDUE_TARGETS.length - simFired.length)
    }
    expect(simFired.length).toBe(OVERDUE_TARGETS.length)
  }, 40000)
})

describe('Fix B risk guard — a chain-forced scene plays exactly once', () => {
  const dupSceneId = 'act1_chain_capital_strike'

  function dupPoolItem(): AgendaItem {
    return {
      id: 'sim_selected_dup',
      title: 'Sim duplicate selection',
      description: 'The player also picked the forced scene from the pool.',
      category: 'crisis' as AgendaCategory,
      sceneId: dupSceneId,
      slotCost: 0,
      executionOrder: 5,
      weekAvailable: 20,
    }
  }

  it('(f) does not duplicate a forced scene the player also selected', () => {
    bootWeek(20)
    useWeekStore.setState(s => ({
      forcedChainIds: [dupSceneId],
      agendaPool: [...s.agendaPool, dupPoolItem()],
      selectedIds: ['sim_selected_dup'],
    }))
    useWeekStore.getState().confirmAgenda()

    const queued = useWeekStore
      .getState()
      .sceneQueue.filter(i => i.sceneId === dupSceneId)
    expect(queued).toHaveLength(1)
  }, 10000)

  it('(f2) still queues the forced scene exactly once when nothing is selected', () => {
    bootWeek(20)
    useWeekStore.setState({ forcedChainIds: [dupSceneId] })
    useWeekStore.getState().confirmAgenda()

    const queued = useWeekStore
      .getState()
      .sceneQueue.filter(i => i.sceneId === dupSceneId)
    expect(queued).toHaveLength(1)
  }, 10000)
})
