import type { FactionState } from '../../types/gameState'

// One place for how the game names each faction.
// `name` is used on labels and badges; `subject` begins a sentence.
export interface FactionName {
  name: string
  subject: string
}

export const FACTION_NAMES: Record<keyof FactionState, FactionName> = {
  reformists: { name: 'Civic Renewal', subject: 'Civic Renewal' },
  halvekists: { name: 'Halvekists', subject: 'The Halvekists' },
  workersCoalition: { name: "Workers' Coalition", subject: "The Workers' Coalition" },
  ironCovenant: { name: 'Iron Covenant', subject: 'The Iron Covenant' },
  church: { name: 'Church of the Eternal Flame', subject: 'The Church' },
  businessClass: { name: 'Business Community', subject: 'The business community' },
  dravenni: { name: 'Dravenni Liberation Front', subject: 'The Dravenni' },
  partyLoyalists: { name: 'Party Loyalists', subject: 'The Party loyalists' },
}

export function isFactionKey(key: string): key is keyof FactionState {
  return Object.hasOwn(FACTION_NAMES, key)
}
