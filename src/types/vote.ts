import type { FactionState } from './gameState'

export type VoteType = 'no_confidence' | 'referendum' | 'impeachment' | 'bill'

export type SpendLevel = 0 | 2000 | 5000 | 10000

export interface VoteConfig {
  voteType: VoteType
  threshold: number
  totalSeats: number
  successFlags: string[]
  failureFlags: string[]
  corruptionRisk: 'none' | 'low' | 'medium' | 'high'
  lobbyingEnabled: boolean
  narrativeSceneId?: string
}

export interface FactionSeats {
  faction: keyof FactionState
  displayName: string
  seats: number
}

export interface FactionVoteBreakdown {
  faction: keyof FactionState
  displayName: string
  seats: number
  yesVotes: number
  noVotes: number
  undecided: number
}

export interface VoteProjection {
  yesSeats: number
  noSeats: number
  undecidedSeats: number
  threshold: number
  totalSeats: number
  willPass: boolean
  margin: number
  breakdown: FactionVoteBreakdown[]
}

export interface SpendOption {
  level: SpendLevel
  label: string
  swingMin: number
  swingMax: number
  riskLevel: 'none' | 'low' | 'medium' | 'high'
  corruptionFlag?: string
  factionShift: number
}

export interface VoteResult {
  projection: VoteProjection
  spendLevel: SpendLevel
  finalYesSeats: number
  finalNoSeats: number
  finalUndecidedSeats: number
  passed: boolean
  margin: number
  corruptionFlagSet: boolean
  personalWealthSpent: number
}

export const DEFAULT_THRESHOLD = 126
export const DEFAULT_TOTAL_SEATS = 250

export const SPEND_OPTIONS: SpendOption[] = [
  {
    level: 0,
    label: 'No spending — rely purely on political support',
    swingMin: 0,
    swingMax: 0,
    riskLevel: 'none',
    factionShift: 0,
  },
  {
    level: 2000,
    label: '2,000 VK — routine political outreach and fundraising',
    swingMin: 8,
    swingMax: 12,
    riskLevel: 'low',
    factionShift: 0,
  },
  {
    level: 5000,
    label: '5,000 VK — significant lobbying and favors called in',
    swingMin: 15,
    swingMax: 22,
    riskLevel: 'medium',
    corruptionFlag: 'lobbying_questionable_5k',
    factionShift: 0,
  },
  {
    level: 10000,
    label: '10,000 VK — full mobilization, every lever pulled',
    swingMin: 25,
    swingMax: 35,
    riskLevel: 'high',
    corruptionFlag: 'lobbying_corrupt_10k',
    factionShift: 0,
  },
]
