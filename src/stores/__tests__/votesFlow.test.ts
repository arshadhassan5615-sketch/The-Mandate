import { beforeEach, describe, expect, it } from 'vitest'
import { resetWorld, bootWeek, pool, poolIds, sleep } from '../../test/simHarness'
import { useWeekStore, recordVoteResult } from '../weekStore'
import { useNarrativeStore } from '../narrativeStore'
import { useGameStore } from '../gameStore'
import { resolveVote, applyVoteOutcome } from '../../engine/voteOutcome'
import type { VoteResult } from '../../types/vote'

const REFERENDUM_LOBBYING_ID = 'agenda_w25_referendum_lobbying'
const REFERENDUM_RESULT_ID = 'agenda_w26_referendum_vote_result'
const NO_CONFIDENCE_LOBBYING_ID = 'agenda_w13_lobbying'

function flags(): string[] {
  return useNarrativeStore.getState().activeFlags
}

/** Mirrors LobbyingInterface.handleCommit at zero spend: the shared resolve path. */
function commitLobbyingVote(): void {
  const voteConfig = useWeekStore.getState().voteConfig
  const outcome = resolveVote(voteConfig, 0, useGameStore.getState())
  applyVoteOutcome(outcome)
  recordVoteResult(voteConfig, outcome.voteResult)
  useWeekStore.setState({ phase: 'vote_result', voteResult: outcome.voteResult })
}

/** Launch a vote item from the map, commit it if it is a lobbying vote, then complete it. */
async function holdVote(itemId: string): Promise<void> {
  const item = pool().find(i => i.id === itemId)
  if (!item) throw new Error(`vote item ${itemId} is not in the week pool`)

  useWeekStore.getState().launchSingleScene(item)
  if (useWeekStore.getState().phase === 'lobbying') commitLobbyingVote()

  useWeekStore.getState().advanceQueue()
  await sleep(600)
}

/** completeWeek clears the week ledger before the next week's initWeek. */
function startNextWeek(week: number): void {
  useWeekStore.setState({ completedItemIds: [] })
  bootWeek(week)
}

function seatTotal(result: VoteResult): number {
  return result.finalYesSeats + result.finalNoSeats + result.finalUndecidedSeats
}

describe('assembly votes: held results and no-lobbying launch', () => {
  beforeEach(() => {
    resetWorld()
    // resetWorld predates the vote memory fields; clear them as startCustomization does.
    useWeekStore.setState({ lastVoteResults: {}, resolvedItemIds: [] })
  })

  it('week 25 lobbying vote applies its flags, stores the result, and the week 26 vote shows that result', async () => {
    // Arrange
    bootWeek(25)
    expect(poolIds()).toContain(REFERENDUM_LOBBYING_ID)

    // Act: hold the week 25 lobbying vote
    await holdVote(REFERENDUM_LOBBYING_ID)

    // Assert: the outcome flags were set and the result was stored
    const stored = useWeekStore.getState().lastVoteResults.referendum
    expect(stored).toBeDefined()
    const outcomeFlags = stored!.passed
      ? ['referendum_passed', 'constitution_ratified']
      : ['referendum_failed', 'constitution_rejected']
    for (const flag of outcomeFlags) expect(flags()).toContain(flag)

    // Act: enter week 26
    startNextWeek(26)

    // Assert: the held lobbying vote is not offered again
    expect(poolIds()).not.toContain(REFERENDUM_LOBBYING_ID)

    // Act: launch the week 26 result vote (lobbyingEnabled false)
    const flagsBefore = [...flags()]
    const resultItem = pool().find(i => i.id === REFERENDUM_RESULT_ID)
    expect(resultItem).toBeDefined()
    useWeekStore.getState().launchSingleScene(resultItem!)

    // Assert: the stored result is shown, seats are real, and no flags changed
    const ws = useWeekStore.getState()
    expect(ws.phase).toBe('vote_result')
    expect(ws.voteResult).toEqual(stored)
    expect(ws.voteResult!.passed).toBe(stored!.passed)
    expect(seatTotal(ws.voteResult!)).toBeGreaterThan(0)
    expect(flags()).toEqual(flagsBefore)
  })

  it('fresh game: the week 26 no-lobbying vote resolves now and applies one outcome', () => {
    // Arrange
    bootWeek(26)
    expect(useWeekStore.getState().lastVoteResults).toEqual({})
    const item = pool().find(i => i.id === REFERENDUM_RESULT_ID)
    expect(item).toBeDefined()

    // Act
    useWeekStore.getState().launchSingleScene(item!)

    // Assert: a real result is shown, not a 0-0 placeholder
    const ws = useWeekStore.getState()
    expect(ws.phase).toBe('vote_result')
    expect(ws.voteResult).not.toBeNull()
    expect(seatTotal(ws.voteResult!)).toBeGreaterThan(0)

    // Assert: exactly the matching outcome flags were applied, and the result is stored
    const successFlags = ['referendum_passed', 'constitution_ratified']
    const failureFlags = ['referendum_failed', 'constitution_rejected']
    const expected = ws.voteResult!.passed ? successFlags : failureFlags
    const other = ws.voteResult!.passed ? failureFlags : successFlags
    for (const flag of expected) expect(flags()).toContain(flag)
    for (const flag of other) expect(flags()).not.toContain(flag)
    expect(ws.lastVoteResults.referendum).toEqual(ws.voteResult)
  })

  it('week 13 no-confidence vote held in week 13 is not offered again in week 14', async () => {
    // Arrange
    bootWeek(13)
    expect(poolIds()).toContain(NO_CONFIDENCE_LOBBYING_ID)

    // Act
    await holdVote(NO_CONFIDENCE_LOBBYING_ID)
    startNextWeek(14)

    // Assert
    expect(poolIds()).not.toContain(NO_CONFIDENCE_LOBBYING_ID)
    expect(useWeekStore.getState().resolvedItemIds).toContain(NO_CONFIDENCE_LOBBYING_ID)
  })

  it('week 14 still offers the no-confidence vote when week 13 never held it', () => {
    // Arrange + Act
    bootWeek(14)

    // Assert
    expect(poolIds()).toContain(NO_CONFIDENCE_LOBBYING_ID)
  })
})
