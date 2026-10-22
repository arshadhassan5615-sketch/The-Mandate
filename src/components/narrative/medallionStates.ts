export type MedallionState = 'speaking' | 'present'

/**
 * Assigns each medallion a state. The character speaking now is 'speaking';
 * everyone else in the conversation is 'present'. Pure: `ids` is not mutated.
 */
export function medallionStates(ids: string[], currentId: string | null): Record<string, MedallionState> {
  const states: Record<string, MedallionState> = {}

  for (const id of ids) {
    states[id] = id === currentId ? 'speaking' : 'present'
  }

  return states
}
