import type { FactionState } from '../types/gameState'
import type { VoteProjection, VoteResult, SpendLevel, FactionVoteBreakdown } from '../types/vote'
import { SPEND_OPTIONS } from '../types/vote'
import { FACTION_SEATS } from '../data/vote/factionSeats'

/**
 * Random integer in [min, max] inclusive.
 */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Calculate projected Assembly vote from current faction support scores.
 * Formula: for each faction, (support / 100) * seats = base YES.
 * Support >= 60: all seats vote YES.
 * Support <= 30: all seats vote NO.
 * 31-59: proportional split — YES, NO, and undecided based on position in range.
 */
export function calculateProjection(
  factions: FactionState,
  threshold: number = 126,
): VoteProjection {
  const breakdown: FactionVoteBreakdown[] = []
  let yesSeats = 0
  let noSeats = 0
  let undecidedSeats = 0

  for (const fs of FACTION_SEATS) {
    const support = factions[fs.faction] ?? 50
    let yesVotes: number
    let noVotes: number
    let undecided: number

    if (support >= 60) {
      yesVotes = fs.seats
      noVotes = 0
      undecided = 0
    } else if (support <= 30) {
      yesVotes = 0
      noVotes = fs.seats
      undecided = 0
    } else {
      // 31-59: scale linearly
      // At 31: mostly NO with some undecided
      // At 45: split between YES/NO with undecided
      // At 59: mostly YES with some undecided
      const t = (support - 30) / 30 // 0 at 31, 1 at 59 (capped)
      const rawYes = t * fs.seats
      yesVotes = Math.floor(rawYes)
      const remainder = rawYes - yesVotes
      // Remainder becomes undecided; the rest is NO
      undecided = Math.round(remainder * fs.seats * 0.3)
      undecided = Math.min(undecided, fs.seats - yesVotes)
      noVotes = fs.seats - yesVotes - undecided
    }

    breakdown.push({
      faction: fs.faction,
      displayName: fs.displayName,
      seats: fs.seats,
      yesVotes,
      noVotes,
      undecided,
    })

    yesSeats += yesVotes
    noSeats += noVotes
    undecidedSeats += undecided
  }

  const totalSeats = yesSeats + noSeats + undecidedSeats
  const margin = yesSeats - threshold

  return {
    yesSeats,
    noSeats,
    undecidedSeats,
    threshold,
    totalSeats,
    willPass: yesSeats >= threshold,
    margin,
    breakdown,
  }
}

/**
 * Apply the effects of a lobbying spend level to a vote projection.
 * Swings seats from undecided/NO toward YES based on spend tier.
 * Returns the updated projection, corruption flags set, and wealth spent.
 */
export function applySpending(
  projection: VoteProjection,
  spendLevel: SpendLevel,
): { finalProjection: VoteProjection; corruptionFlags: string[]; wealthSpent: number } {
  const option = SPEND_OPTIONS.find(o => o.level === spendLevel)
  if (!option || spendLevel === 0) {
    return {
      finalProjection: { ...projection },
      corruptionFlags: [],
      wealthSpent: 0,
    }
  }

  const swing = randInt(option.swingMin, option.swingMax)
  const corruptionFlags: string[] = []

  // Corruption risk check
  if (option.corruptionFlag) {
    const riskChance = option.riskLevel === 'high' ? 0.8 : option.riskLevel === 'medium' ? 0.4 : 0.1
    if (Math.random() < riskChance) {
      corruptionFlags.push(option.corruptionFlag)
    }
    // High spend always sets an additional flag for vote-buying suspicion
    if (spendLevel >= 10000 && Math.random() < 0.5) {
      corruptionFlags.push('lobbying_vote_buying')
    }
  }

  // Swing from undecided first, then from NO if undecided exhausted
  let remainingSwing = swing
  let fromUndecided = Math.min(remainingSwing, projection.undecidedSeats)
  remainingSwing -= fromUndecided
  let fromNo = Math.min(remainingSwing, projection.noSeats)

  const newYes = projection.yesSeats + fromUndecided + fromNo
  const newUndecided = projection.undecidedSeats - fromUndecided
  const newNo = projection.noSeats - fromNo

  const finalProjection: VoteProjection = {
    ...projection,
    yesSeats: newYes,
    noSeats: newNo,
    undecidedSeats: newUndecided,
    willPass: newYes >= projection.threshold,
    margin: newYes - projection.threshold,
  }

  return {
    finalProjection,
    corruptionFlags,
    wealthSpent: spendLevel,
  }
}

/**
 * All-in-one: calculate projection + apply spending → final result.
 */
export function resolveVote(
  factions: FactionState,
  spendLevel: SpendLevel,
  threshold: number = 126,
): VoteResult {
  const projection = calculateProjection(factions, threshold)
  const { finalProjection, corruptionFlags, wealthSpent } = applySpending(projection, spendLevel)

  return {
    projection,
    spendLevel,
    finalYesSeats: finalProjection.yesSeats,
    finalNoSeats: finalProjection.noSeats,
    finalUndecidedSeats: finalProjection.undecidedSeats,
    passed: finalProjection.willPass,
    margin: finalProjection.margin,
    corruptionFlagSet: corruptionFlags.length > 0,
    personalWealthSpent: wealthSpent,
  }
}
