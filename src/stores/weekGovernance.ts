// Week-boundary governance: promises past their deadline and the provincial governors.
import { RESOLUTION_RULES, settleBrokenCommitments, type ResolutionRule } from '../engine/commitments'
import { processGovernorsWeek } from '../engine/governors'
import { useCommitmentStore } from './commitmentStore'
import { useGameStore } from './gameStore'
import { useNarrativeStore } from './narrativeStore'

/** Breaks promises past their deadline and applies each broken promise's consequences once. */
export function settleWeekCommitments(week: number, rules: readonly ResolutionRule[] = RESOLUTION_RULES): void {
  const { commitments, settledIds, markSettled } = useCommitmentStore.getState()
  const { activeFlags, addFlags } = useNarrativeStore.getState()
  const effects = settleBrokenCommitments(commitments, activeFlags, rules, week, settledIds)
  if (effects.length === 0) return
  const modifiers = effects.flatMap(effect => effect.modifiers)
  if (modifiers.length > 0) useGameStore.getState().applyModifiers(modifiers)
  const flags = effects.flatMap(effect => effect.flags)
  if (flags.length > 0) addFlags(flags)
  markSettled(effects.map(effect => effect.commitmentId))
}

/** Runs provincial elections when due, the governors' weekly effects and the loyalty flag. */
export function applyGovernorsWeek(): void {
  const state = useGameStore.getState()
  const { activeFlags, addFlags } = useNarrativeStore.getState()
  const { modifiers, flags } = processGovernorsWeek(state, activeFlags)
  if (flags.length > 0) addFlags(flags)
  if (modifiers.length > 0) useGameStore.getState().applyModifiers(modifiers)
}
