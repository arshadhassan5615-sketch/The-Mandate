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
import { describe, it, expect, beforeEach, vi } from 'vitest'

import { useGameStore } from '../stores/gameStore'
import { useNarrativeStore, filterNarrative } from '../stores/narrativeStore'
import type { NarrativeSegment } from '../types/narrative'
import { useWeekStore } from '../stores/weekStore'
import { useChainStore } from '../stores/chainStore'
import { db } from '../db/mandateDb'
import { saveGame, loadGame, AUTOSAVE_SLOT } from '../engine/SaveManager'
import { getAvailableChoices } from '../engine/NarrativeEngine'
import { MAX_OVERDUE_CHAINS_PER_WEEK } from '../engine/weekCompletion'
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
    for (let tick = 0; tick < 4; tick++) {
      await finishWeek()
      const fired = useWeekStore
        .getState()
        .forcedChainIds.filter(id => OVERDUE_TARGETS.includes(id))
      expect.soft(fired.length).toBeLessThanOrEqual(MAX_OVERDUE_CHAINS_PER_WEEK)
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

describe('Fix 2a — exclusive redirects record BOTH ids as visited', () => {
  it('(2a) a redirected scene counts as visited alongside the scene that played', () => {
    resetWorld()
    bootWeek(26)
    // Narrow prereqs (post-STEP-1: halvekists<=55, reformists 48..61) fail on
    // reformists: narrow.exclusive walks to decisive, which qualifies here.
    useGameStore.setState(s => ({
      factions: { ...s.factions, reformists: 65, halvekists: 30 },
    }))
    useNarrativeStore.getState().loadScene('act2_week26_referendum_narrow')

    // Premise: the exclusive redirect fired.
    expect(useNarrativeStore.getState().currentScene?.id).toBe('act2_week26_referendum_decisive')
    // Contract: the requested scene id is recorded too, not just the one played.
    expect(useNarrativeStore.getState().visitedSceneIds).toContain('act2_week26_referendum_narrow')

    // Completing the redirected scene records its own id as before.
    const current = useNarrativeStore.getState().currentScene
    const avail = current
      ? getAvailableChoices(current, useGameStore.getState(), useNarrativeStore.getState().activeFlags)
      : []
    if (avail.length > 0) useNarrativeStore.getState().processChoice(avail[0].id)
    expect(useNarrativeStore.getState().visitedSceneIds).toContain('act2_week26_referendum_decisive')
  }, 10000)
})

describe('Fix 2b — chains defer to the target week; late chains still play', () => {
  function chainState(week: number) {
    return {
      game: useGameStore.getState(),
      flags: useNarrativeStore.getState().activeFlags,
      week,
    }
  }

  it('(2b) a chain due before its target week waits for that week', () => {
    resetWorld()
    bootWeek(10)
    // act2_week22_oil_outcome opens at week 22; the chain is due at week 10.
    useChainStore.getState().schedule(
      [{ targetNodeId: 'act2_week22_oil_outcome', delayWeeks: 0 }],
      10,
      'sim_early',
    )
    let s = chainState(10)
    const early = useChainStore.getState().process(s.week, s.game, s.flags)
    expect(early).toEqual([])
    expect(
      useChainStore.getState().scheduled.map(c => c.targetNodeId),
    ).toContain('act2_week22_oil_outcome')

    // At the target week it fires as normal.
    s = chainState(22)
    const onTime = useChainStore.getState().process(s.week, s.game, s.flags)
    expect(onTime).toContain('act2_week22_oil_outcome')
  }, 10000)

  it('(2b2) an overdue chain still plays at the next tick and is logged', () => {
    resetWorld()
    bootWeek(10)
    // act1_week1_inauguration opened at week 1; due since week 5.
    useChainStore.getState().schedule(
      [{ targetNodeId: 'act1_week1_inauguration', delayWeeks: 0 }],
      5,
      'sim_late',
    )
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    try {
      const s = chainState(10)
      const fired = useChainStore.getState().process(s.week, s.game, s.flags)
      expect(fired).toContain('act1_week1_inauguration')
      expect(
        spy.mock.calls.some(args => String(args[0]).includes('act1_week1_inauguration')),
      ).toBe(true)
    } finally {
      spy.mockRestore()
    }
  }, 10000)
})

describe('Fix 2c — on-time chains uncapped, overdue backlog max 2/week', () => {
  function fireAt(processWeek: number, scheduledWeek: number, delayWeeks: number, n: number, prefix: string) {
    useChainStore.getState().schedule(
      Array.from({ length: n }, (_, i) => ({
        targetNodeId: `${prefix}_${i}`,
        delayWeeks,
      })),
      scheduledWeek,
      `sim_2c_${prefix}`,
    )
    return useChainStore
      .getState()
      .process(processWeek, useGameStore.getState(), useNarrativeStore.getState().activeFlags)
  }

  it('(2c) five chains due this week all fire in one tick', () => {
    resetWorld()
    bootWeek(10)
    const fired = fireAt(10, 10, 0, 5, 'sim2c_on')
    expect(fired).toHaveLength(5)
    expect(useChainStore.getState().scheduled.filter(c => c.targetNodeId.startsWith('sim2c_on'))).toHaveLength(0)
  }, 10000)

  it('(2c2) five overdue chains drain at most 2 per tick, none dropped', () => {
    resetWorld()
    bootWeek(10)
    const first = fireAt(10, 5, 0, 5, 'sim2c_over')
    expect(first).toHaveLength(2)
    expect(
      useChainStore.getState().scheduled.filter(c => c.targetNodeId.startsWith('sim2c_over')),
    ).toHaveLength(3)
    const second = useChainStore
      .getState()
      .process(10, useGameStore.getState(), useNarrativeStore.getState().activeFlags)
    expect(second.filter(id => id.startsWith('sim2c_over'))).toHaveLength(2)
  }, 10000)
})

describe('Fix 2d — filterNarrative echoGroup; election_eve opening max 5 echoes', () => {
  // echoGroup does not exist on the type yet (arrives with the fix); the cast
  // keeps tsc green while the runtime behavior is asserted red-first.
  function groupedNodes(): NarrativeSegment[] {
    return [
      { type: 'description', text: 'a1', echoGroup: 'g1' },
      { type: 'description', text: 'a2', echoGroup: 'g1' },
      { type: 'description', text: 'b1', echoGroup: 'g2' },
      { type: 'description', text: 'plain1' },
      { type: 'description', text: 'plain2' },
    ] as unknown as NarrativeSegment[]
  }

  function simState() {
    return {
      game: useGameStore.getState(),
      flags: useNarrativeStore.getState().activeFlags,
    }
  }

  it('(2d) echoGroup survivors are capped per group; ungrouped nodes unchanged', () => {
    resetWorld()
    bootWeek(20)
    const s = simState()
    const kept = filterNarrative(groupedNodes(), s.game, s.flags) ?? []
    // g1 -> 1 survivor, g2 -> 1 survivor, both plains pass = 4 (5 before the fix).
    expect(kept).toHaveLength(4)
    expect(kept.map(n => n.text).sort()).toEqual(['a1', 'b1', 'plain1', 'plain2'])
  }, 10000)

  it('(2d2) nodes without echoGroup behave exactly as today', () => {
    resetWorld()
    bootWeek(20)
    const s = simState()
    const plain: NarrativeSegment[] = [
      { type: 'description', text: 'p1' },
      {
        type: 'description',
        text: 'p2',
        conditions: [{ type: 'flag', flag: 'sim_never_set', value: true }],
      },
      { type: 'dialogue', character: 'vyktor_reznik', text: 'p3' },
    ]
    const kept = filterNarrative(plain, s.game, s.flags) ?? []
    expect(kept.map(n => n.text)).toEqual(['p1', 'p3'])
  }, 10000)

  it('(2d3) election_eve opening shows at most 5 echoes under a full history', () => {
    resetWorld()
    bootWeek(103)
    useNarrativeStore.getState().addFlags(EVE_RICH_FLAGS)
    useNarrativeStore.getState().loadScene('act7_week103_election_eve')
    const shown = useNarrativeStore.getState().currentScene?.narrative ?? []
    const echoes = shown.filter(n => (n.conditions?.length ?? 0) > 0)
    expect(echoes.length).toBeLessThanOrEqual(5)
  }, 10000)
})

// Every =true flag the election_eve opening can read (theron flags stay
// absent so the two ==false fallbacks pass exactly as authored).
const EVE_RICH_FLAGS = [
  'interview62_cut',
  'debate_wednesday_gates',
  'debate_wednesday_work',
  'debate_wednesday_honest',
  'heir101_deal_signed',
  'deep_state_public_arrests',
  'remnant_plot_buried',
  'krel_rogue_covered',
  'krel_men_arrested',
  'lastcab98_files_burned',
  'lastcab98_archive_open',
  'vyktor_covered',
  'vyktor_slush_taken',
  'vyktor_exposed',
  'colonels70_dusek_promoted',
  'colonels70_received',
  'colonels70_published',
  'kravenstal102_told_truth',
  'kolvar_arrested_treason',
  'kolvar_blackmailed_dropout',
  'kitchen99_promised_thursday',
  'kitchen99_family_on_steps',
  'kitchen99_told_truth',
  'heir101_boxes_returned',
  'heir101_offer_published',
  'heir101_refused',
  'lastcab98_files_sealed',
  'colonels70_watched',
  'kravenstal102_furnace_saved',
  'kravenstal102_kept_quiet',
  'debate_chose_concede',
  'debate_chose_attack',
  'debate_chose_record',
  'krel_rogue_punished',
  'coup_plot_stopped',
  'war_with_oligarchs',
]
