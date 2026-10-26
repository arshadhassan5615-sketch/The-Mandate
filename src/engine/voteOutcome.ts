// Shared resolution for Assembly votes (whip count and no-lobbying tally).
//
// The seat math stays in VoteEngine. This module adds the outcome bookkeeping
// (corruption and outcome flags, assembly margin, personal wealth) so the
// lobbying screen and the no-lobbying launch path apply the same effects.
import type { GameState } from '../types/gameState'
import type { VoteConfig, VoteProjection, VoteResult, SpendLevel } from '../types/vote'
import { DEFAULT_THRESHOLD } from '../types/vote'
import { calculateProjection, applySpending } from './VoteEngine'
import { useGameStore } from '../stores/gameStore'
import { useNarrativeStore } from '../stores/narrativeStore'

/** A lobbying spend already applied to a projection (random swing, computed once). */
export type SpendingOutcome = ReturnType<typeof applySpending>

export interface VoteOutcome {
  finalProjection: VoteProjection
  voteResult: VoteResult
  /** Corruption flags from spending plus the success or failure flags of the config. */
  flagsToAdd: string[]
  assemblyMargin: number
}

/**
 * Resolve a vote without applying anything to the game.
 *
 * `spending` lets the caller reuse a spend result it already displayed (the
 * lobbying screen previews the swing before commit, so commit must not roll a
 * different one). When omitted, the spend is rolled here.
 */
export function resolveVote(
  voteConfig: VoteConfig | null,
  spendLevel: SpendLevel,
  state: Pick<GameState, 'factions'>,
  spending?: SpendingOutcome,
): VoteOutcome {
  const threshold = voteConfig?.threshold ?? DEFAULT_THRESHOLD
  const baseProjection = calculateProjection(state.factions, threshold)
  const spend = spending ?? applySpending(baseProjection, spendLevel)
  const finalProjection = spend.finalProjection

  const outcomeFlags = voteConfig
    ? (finalProjection.willPass ? voteConfig.successFlags : voteConfig.failureFlags)
    : []

  return {
    finalProjection,
    voteResult: {
      projection: baseProjection,
      spendLevel,
      finalYesSeats: finalProjection.yesSeats,
      finalNoSeats: finalProjection.noSeats,
      finalUndecidedSeats: finalProjection.undecidedSeats,
      passed: finalProjection.willPass,
      margin: finalProjection.margin,
      corruptionFlagSet: spend.corruptionFlags.length > 0,
      personalWealthSpent: spendLevel,
    },
    flagsToAdd: [...spend.corruptionFlags, ...outcomeFlags],
    assemblyMargin: Math.abs(finalProjection.margin),
  }
}

/**
 * Apply a resolved vote to the game: deduct spent wealth, set outcome flags,
 * and store the assembly margin. Each vote must be applied exactly once.
 */
export function applyVoteOutcome(outcome: VoteOutcome): void {
  const spent = outcome.voteResult.personalWealthSpent

  if (spent > 0) {
    useGameStore.getState().applyModifiers([
      { stat: 'personal.personalWealth', operation: 'add', value: -spent },
      { stat: 'voteSpendingTotal', operation: 'add', value: spent },
    ])
  }

  if (outcome.flagsToAdd.length > 0) {
    useNarrativeStore.getState().addFlags(outcome.flagsToAdd)
  }

  useGameStore.getState().applyModifiers([
    { stat: 'nation.assemblyVoteMargin', operation: 'set', value: outcome.assemblyMargin },
  ])
}
