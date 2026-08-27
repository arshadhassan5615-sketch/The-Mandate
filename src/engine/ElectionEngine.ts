import type { GameState } from '../types/gameState'

export interface ElectionResult {
  playerVoteShare: number
  kolvarVoteShare: number
  winner: 'player' | 'kolvar'
  summary: string
}

export function calculateElectionResult(state: GameState, flags: string[]): ElectionResult {
  // Read the final polling numbers calculated by the weekly Polling Engine
  const playerVoteShare = state.playerPolling
  const kolvarVoteShare = state.kolvarPolling
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
