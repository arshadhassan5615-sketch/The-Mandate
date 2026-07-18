import type { StateModifier } from './gameState'

export type AssemblyBloc = 'conservative' | 'hardliner' | 'reformist'
export type Stance = 'for' | 'against' | 'neutral'

export interface ParliamentBill {
  id: string
  title: string
  proposingBloc: AssemblyBloc
  weekAvailable: number
  weekDeadline?: number
  description: string // shown during the sitting
  baselineStances: Record<AssemblyBloc, Stance> // author-set
  fullText: string // shown on the sign/veto screen if passed
  signEffects: StateModifier[] // reuse Bill's StateModifier type
  vetoEffects: StateModifier[]
  signFlags: string[]
  vetoFlags: string[]
  canSpeak?: boolean // Katerin may address the sitting (flavor only)
  speakFlavorText?: string
}

export interface ParliamentBillResult {
  bill: ParliamentBill
  computedStances: Record<AssemblyBloc, Stance>
  forWeight: number
  againstWeight: number
  passed: boolean
  isStrongMajority: boolean
  marginPercent: number // used later for veto-override odds
}

/** Persistable record of a bill decided during a parliament sitting. */
export interface SittingHistoryEntry {
  billId: string
  weekPresented: number
  weekDecided: number
  passed: boolean
  isStrongMajority: boolean
  marginPercent: number
}
