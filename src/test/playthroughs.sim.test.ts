// Scripted full-game playthroughs — four decision profiles walking weeks 1-103
// through the REAL week flow (initWeek → launchSingleScene → advanceQueue pool
// rebuild → completeWeek chain tick). Behind an env var because each run walks
// the whole game twice over:
//
//   MANDATE_PLAYTHROUGHS=1 npx vitest run src/test/playthroughs.sim.test.ts
//
// Fast mode: fake timers (setTimeout/clearTimeout only — Dexie keeps its
// immediates) plus the harness waiter, so a full run takes seconds.
//
// What each week asserts:
//   - the week opens with something to do (or is a week that may end)
//   - every offered item launches (scenes resolve in the registry)
//   - the week ends, advances, and overdue chain fires stay capped (on-time
//     fires are uncapped by design)
// Run end: finishing week 103 raises the term limit and the epilogue.
// Week 104 is unplayable by engine design — observed here, never authored (hold).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { useGameStore } from '../stores/gameStore'
import { useWeekStore } from '../stores/weekStore'
import { useChainStore } from '../stores/chainStore'
import { MAX_OVERDUE_CHAINS_PER_WEEK } from '../engine/weekCompletion'
import {
  resetWorld,
  bootWeek,
  pool,
  isDone,
  offeredIds,
  playItem,
  finishWeek,
  weekComplete,
  setWaiter,
} from './simHarness'

const RUN = process.env.MANDATE_PLAYTHROUGHS === '1'

interface Profile {
  name: string
  flags: string[]
}

// Real engine flags — the ones the content actually reads — so each walk opens
// the branch content its route earned (the flag-profile runtime sweep).
const PROFILES: Profile[] = [
  { name: 'untouched (no flags)', flags: [] },
  {
    name: 'reformist',
    flags: [
      'constitution_in_force',
      'referendum_won_decisive',
      'bca_funded',
      'commissioner_vasic_appointed',
    ],
  },
  {
    name: 'hardliner',
    flags: [
      'hawk_network_active',
      'permanent_injury_sustained',
      'assassination_survived',
      'coup_attempted',
      'government_survived',
    ],
  },
  {
    name: 'exile branch',
    flags: [
      'government_in_exile',
      'coup_succeeded',
      'chancellor_fled',
      'brenner_controls_capital',
      'coup_attempted',
    ],
  },
]

describe.skipIf(!RUN)('scripted playthroughs (env MANDATE_PLAYTHROUGHS=1)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    setWaiter(ms => vi.advanceTimersByTimeAsync(ms))
    resetWorld()
  })

  afterEach(() => {
    setWaiter(null)
    vi.useRealTimers()
  })

  for (const profile of PROFILES) {
    it(`plays weeks 1-103 as ${profile.name}`, async () => {
      bootWeek(1, { flags: profile.flags })
      // Scripted polling: the walk wins both elections, so every profile
      // covers Term 2 as well.
      useGameStore.setState({ playerPolling: 78, kolvarPolling: 22 })

      for (let week = 1; week <= 103; week++) {
        // The week opens with something to do, or may end.
        expect.soft(
          offeredIds().length > 0 || weekComplete(),
          `week ${week} has nothing to do`,
        ).toBe(true)

        // The scripted player clears everything offered, once each.
        const played = new Set<string>()
        for (let guard = 0; guard < 40; guard++) {
          const next = pool().find(i => !isDone(i) && !played.has(i.id))
          if (!next) break
          played.add(next.id)
          const ok = await playItem(next)
          expect.soft(ok, `week ${week}: ${next.sceneId} (${next.id}) did not launch`).toBe(true)
        }

        // Snapshot the backlog before the tick so overdue fires (due in an
        // earlier week) can be counted apart from on-time fires, which are
        // uncapped by design. Chains scheduled mid-tick count as on-time.
        const backlog = new Map(
          useChainStore.getState().scheduled.map(c => [c.targetNodeId, c.fireWeek] as const),
        )
        await finishWeek()
        const landedWeek = useGameStore.getState().currentWeek
        const overdueFired = useWeekStore
          .getState()
          .forcedChainIds.filter(id => (backlog.get(id) ?? landedWeek) < landedWeek)
        expect.soft(
          overdueFired.length,
          `week ${week}: overdue chain flood`,
        ).toBeLessThanOrEqual(MAX_OVERDUE_CHAINS_PER_WEEK)

        if (week < 103) {
          expect.soft(
            useGameStore.getState().currentWeek,
            `week ${week} did not advance`,
          ).toBe(week + 1)
          useWeekStore.getState().initWeek() // closeDiary seam: next week starts
        }
      }

      expect(useGameStore.getState().currentWeek).toBe(104)
      expect(useWeekStore.getState().phase).toBe('epilogue')
    }, 240000)
  }
})
