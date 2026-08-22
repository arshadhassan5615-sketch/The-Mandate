import type { GameState } from '../types/gameState'

export interface ElectionResult {
  playerVoteShare: number
  kolvarVoteShare: number
  winner: 'player' | 'kolvar'
  summary: string
}

export function calculateElectionResult(state: GameState, flags: string[]): ElectionResult {
  let playerVoteShare = 0

  // 1. Base Popularity (Public Image, Reformists, Workers)
  playerVoteShare += state.personal.publicImage * 0.5
  playerVoteShare += state.factions.reformists * 0.2
  playerVoteShare += state.factions.workersCoalition * 0.2

  // 2. Economy Modifier
  if (state.nation.economyHealth > 20) playerVoteShare += 10
  if (state.nation.economyHealth < -20) playerVoteShare -= 10

  // 3. Scandal Modifier
  if (state.nation.corruption > 60) playerVoteShare -= 15

  // 4. Oligarch Interference
  if (flags.includes('government_captured')) {
    // You sold out to the oligarchs. They guarantee your victory.
    playerVoteShare = 100
  } else if (flags.includes('oligarch_debts_refused')) {
    // You refused them. They fund Kolvar heavily.
    playerVoteShare -= 25
  } else if (flags.includes('oligarchs_destroyed')) {
    // You destroyed them. No money in play, pure test of stats.
    playerVoteShare -= 5
  }

  // Clamp to 0-95 (Kolvar always gets at least 5%)
  playerVoteShare = Math.max(5, Math.min(95, playerVoteShare))

  const kolvarVoteShare = 100 - playerVoteShare
  const winner = playerVoteShare >= 50 ? 'player' : 'kolvar'

  let summary = ''
  if (winner === 'player') {
    summary = flags.includes('government_captured')
      ? 'The election is a landslide in your favor, bought and paid for by Morvec and Vael. The Republic is yours, but so are its masters.'
      : `You secured ${Math.round(playerVoteShare)}% of the vote. The Republic has renewed your mandate.`
  } else {
    summary = `Kolvar secured ${Math.round(kolvarVoteShare)}% of the vote. The Republic has chosen a new path. Your Chancellorship is over.`
  }

  return {
    playerVoteShare,
    kolvarVoteShare,
    winner,
    summary
  }
}
