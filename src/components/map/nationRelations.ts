export type RelationLabel = 'Allied' | 'Friendly' | 'Neutral' | 'Strained' | 'Hostile'

export function relationFor(
  nationId: string,
  state: { tyvarenHostility: number; sovarka_relation: number },
): RelationLabel {
  switch (nationId) {
    case 'tyvaren': {
      // tyvarenHostility is a tension counter accumulating from an already-hostile baseline, so never better than Strained.
      return state.tyvarenHostility >= 50 ? 'Hostile' : 'Strained'
    }
    case 'sovarka': {
      const r = state.sovarka_relation
      if (r >= 60) return 'Allied'
      if (r >= 20) return 'Friendly'
      if (r > -20) return 'Neutral'
      if (r > -60) return 'Strained'
      return 'Hostile'
    }
    case 'morivask':
      return 'Hostile'
    default:
      return 'Neutral'
  }
}
