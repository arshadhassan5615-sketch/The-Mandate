import type { StateModifier } from './gameState'
import type { Condition } from './narrative'

export interface Bill {
  id: string
  title: string
  shortName: string
  proposer: string
  faction: string
  weekPresented: number
  fullText: string
  budgetCost: number
  signEffects: StateModifier[]
  vetoEffects: StateModifier[]
  signFlags: string[]
  vetoFlags: string[]
  prerequisites?: Condition[]
  isVetoable: boolean
}

export interface BillHistoryEntry {
  billId: string
  billTitle?: string
  weekPresented: number
  decision: 'signed' | 'vetoed' | 'overridden' | 'auto_passed'
  weekDecided: number
}

export interface VetoOverrideResult {
  overridden: boolean
  assemblyVote: number
  threshold: number
}
