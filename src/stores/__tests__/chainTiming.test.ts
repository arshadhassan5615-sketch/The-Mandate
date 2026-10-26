import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetWorld, bootWeek, pool, sleep } from '../../test/simHarness'
import { useWeekStore, recordVoteResult } from '../weekStore'
import { useChainStore } from '../chainStore'
import { useGameStore } from '../gameStore'
import { useNarrativeStore } from '../narrativeStore'
import { resolveChains, type ScheduledChain } from '../../engine/ChainReactionEngine'
import { resolveVote, applyVoteOutcome } from '../../engine/voteOutcome'
import type { AgendaItem } from '../../types/week'
import type { GameState } from '../../types/gameState'

// Real scene: act1_week9_soren_immunity opens week 9 and closes week 11.
// It is absent from every agenda bank, so only a chain can put it on the map.
const SCENE_ID = 'act1_week9_soren_immunity'
const SCENE_OPEN_WEEK = 9
const SCENE_DEADLINE_WEEK = 11
const CHAIN_ITEM_ID = `__chain__${SCENE_ID}`
const SOURCE_ID = 'test_source_choice'
const NO_CONFIDENCE_LOBBYING_ID = 'agenda_w13_lobbying'

const NO_STATE = {} as GameState

function chainFor(fireWeek: number): ScheduledChain {
  return {
    id: `test_chain_${fireWeek}`,
    targetNodeId: SCENE_ID,
    fireWeek,
    sourceId: SOURCE_ID,
  }
}

function budgetItem(week: number): AgendaItem {
  return {
    id: '__budget__',
    title: 'Budget',
    description: 'Budget session',
    category: 'cabinet' as AgendaItem['category'],
    sceneId: '__budget__',
    slotCost: 0,
    executionOrder: 0,
    weekAvailable: week,
  }
}

/** Finish one virtual queue item and let the 500ms return-to-map rebuild run. */
async function finishItemAndRebuildPool(week: number): Promise<void> {
  useWeekStore.getState().launchSingleScene(budgetItem(week))
  useWeekStore.getState().advanceQueue()
  await sleep(600)
}

function chainItemsInPool(): AgendaItem[] {
  return pool().filter(i => i.sceneId === SCENE_ID)
}

describe('chain timing: same-week delivery, window expiry, no double fire', () => {
  beforeEach(() => {
    resetWorld()
    useChainStore.setState({ scheduled: [] })
  })

  it('(a) a delay-0 chain scheduled mid-week reaches the pool at the next pool rebuild', async () => {
    // Arrange
    bootWeek(SCENE_OPEN_WEEK)
    expect(chainItemsInPool()).toEqual([])
    useChainStore.getState().schedule(
      [{ targetNodeId: SCENE_ID, delayWeeks: 0 }],
      SCENE_OPEN_WEEK,
      SOURCE_ID,
    )

    // Act
    await finishItemAndRebuildPool(SCENE_OPEN_WEEK)

    // Assert
    const items = chainItemsInPool()
    expect(items).toHaveLength(1)
    expect(items[0].id).toBe(CHAIN_ITEM_ID)
    expect(useChainStore.getState().scheduled).toEqual([])
  })

  it('(b) a chain whose target scene weekDeadline has passed is dropped, never injected', async () => {
    // Arrange: the scene closed after week 11, so week 12 is past its window.
    const lateWeek = SCENE_DEADLINE_WEEK + 1
    bootWeek(lateWeek)

    // Act: a due chain (fireWeek === week) and an overdue one (fireWeek < week)
    const dueFired = resolveChains([chainFor(lateWeek)], lateWeek, NO_STATE, []).fired
    const overdueFired = resolveChains([chainFor(SCENE_OPEN_WEEK)], lateWeek, NO_STATE, []).fired

    // Assert: neither fires
    expect(dueFired).toEqual([])
    expect(overdueFired).toEqual([])

    // Assert: a mid-week delivery at the late week injects nothing for the scene
    useChainStore.getState().schedule([{ targetNodeId: SCENE_ID, delayWeeks: 0 }], lateWeek, SOURCE_ID)
    await finishItemAndRebuildPool(lateWeek)
    expect(chainItemsInPool()).toEqual([])
    expect(useWeekStore.getState().agendaPool.some(i => i.id === CHAIN_ITEM_ID)).toBe(false)
  })

  it('(c) a deferred chain fires in the target scene first week, not before it', () => {
    // Arrange: due at week 7, but the scene opens at week 9
    const scheduled = [chainFor(7)]

    // Act + Assert: before the scene opens the chain stays scheduled
    const early = resolveChains(scheduled, 8, NO_STATE, [])
    expect(early.fired).toEqual([])
    expect(early.remaining).toHaveLength(1)

    // Act + Assert: in the scene's first week it fires
    const opening = resolveChains(early.remaining, SCENE_OPEN_WEEK, NO_STATE, [])
    expect(opening.fired).toEqual([SCENE_ID])
    expect(opening.remaining).toEqual([])
  })

  it('(d) a chain delivered mid-week is not fired again at week-end processing', async () => {
    // Arrange
    bootWeek(SCENE_OPEN_WEEK)
    useChainStore.getState().schedule([{ targetNodeId: SCENE_ID, delayWeeks: 0 }], SCENE_OPEN_WEEK, SOURCE_ID)
    await finishItemAndRebuildPool(SCENE_OPEN_WEEK)
    expect(chainItemsInPool()).toHaveLength(1)

    // Act: week-end processing for the next week (what completeWeek does)
    const weekEndFired = useChainStore.getState().process(
      SCENE_OPEN_WEEK + 1,
      useGameStore.getState(),
      useNarrativeStore.getState().activeFlags,
    )

    // Assert
    expect(weekEndFired).not.toContain(SCENE_ID)
    expect(useChainStore.getState().scheduled.some(c => c.targetNodeId === SCENE_ID)).toBe(false)
  })

  it('(e) a held vote is recorded as resolved at commit, before its queue completes', () => {
    // Arrange
    bootWeek(13)
    const item = pool().find(i => i.id === NO_CONFIDENCE_LOBBYING_ID)
    expect(item).toBeDefined()
    useWeekStore.getState().launchSingleScene(item!)
    const voteConfig = useWeekStore.getState().voteConfig
    expect(useWeekStore.getState().phase).toBe('lobbying')

    // Act: commit without advancing the queue (mirrors LobbyingInterface.handleCommit)
    const outcome = resolveVote(voteConfig, 0, useGameStore.getState())
    applyVoteOutcome(outcome)
    recordVoteResult(voteConfig, outcome.voteResult)

    // Assert
    expect(useWeekStore.getState().resolvedItemIds).toContain(NO_CONFIDENCE_LOBBYING_ID)
  })

  it('(f) an overdue chain with probability 0.5 is not rolled by mid-week rebuilds', async () => {
    // Arrange: due at week 8, still pending at week 9; a roll would drop it (0.99 > 0.5)
    bootWeek(SCENE_OPEN_WEEK)
    const overdue = { ...chainFor(SCENE_OPEN_WEEK - 1), probability: 0.5 }
    useChainStore.setState({ scheduled: [overdue] })
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99)
    try {
      // Act: five mid-week pool rebuilds
      for (let i = 0; i < 5; i++) {
        await finishItemAndRebuildPool(SCENE_OPEN_WEEK)
      }
      // Assert: the overdue chain was never evaluated, so it is still scheduled
      expect(useChainStore.getState().scheduled).toEqual([overdue])
      expect(chainItemsInPool()).toEqual([])
    } finally {
      randomSpy.mockRestore()
    }
  }, 20000)

  it('(g) agenda-queue path: a same-week chain scheduled in the queue is appended and plays before review', async () => {
    // Arrange: a non-map queue whose current item is the budget
    bootWeek(SCENE_OPEN_WEEK)
    useWeekStore.setState({
      sceneQueue: [budgetItem(SCENE_OPEN_WEEK)],
      currentQueueIndex: 0,
      returnToMap: false,
      phase: 'budget',
    })
    useChainStore.getState().schedule(
      [{ targetNodeId: SCENE_ID, delayWeeks: 0 }],
      SCENE_OPEN_WEEK,
      SOURCE_ID,
    )

    // Act: the budget completes; the chain is due this week
    useWeekStore.getState().advanceQueue()
    await sleep(600)

    // Assert: the chain item is appended and becomes the current scene
    const afterFirst = useWeekStore.getState()
    expect(afterFirst.sceneQueue.map(i => i.id)).toEqual(['__budget__', CHAIN_ITEM_ID])
    expect(afterFirst.currentQueueIndex).toBe(1)
    expect(afterFirst.phase).toBe('scene')
    expect(useChainStore.getState().scheduled).toEqual([])

    // Act: the chain scene completes; the queue ends in review
    useWeekStore.getState().advanceQueue()
    await sleep(600)
    expect(useWeekStore.getState().phase).toBe('review')
  }, 20000)
})
