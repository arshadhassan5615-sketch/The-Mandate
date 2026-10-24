import { CHARACTERS, getRelationshipLabel } from '../../data/characters/roster'
import type { CharacterMapEntry } from '../../data/characters/roster'
import { FACTION_NAMES } from '../../data/factions/factionNames'
import type { GameState } from '../../types/gameState'
import { PLAYER_ID } from './participants'

export interface CharacterCardData {
  id: string
  name: string
  title: string
  faction: string | null
  relationship: string
  description: string
}

const ROSTER_ID_PREFIX = 'character_'
const NEUTRAL_SCORE = 50

type CardState = Pick<GameState, 'personal' | 'factions'>

function relationshipScore(entry: CharacterMapEntry, state: CardState): number {
  if (entry.personalKey) {
    const value = state.personal[entry.personalKey]
    return typeof value === 'number' ? value : NEUTRAL_SCORE
  }
  if (entry.factionKey) return state.factions[entry.factionKey] ?? NEUTRAL_SCORE
  return NEUTRAL_SCORE
}

/** Card data for a conversation id (no `character_` prefix), or null when the character is not in the roster. */
export function characterCardData(id: string, state: CardState): CharacterCardData | null {
  if (id === PLAYER_ID) return null
  const entry = CHARACTERS.find(c => c.id === `${ROSTER_ID_PREFIX}${id}`)
  if (!entry) return null
  return {
    id,
    name: entry.name,
    title: entry.title,
    faction: entry.factionKey ? FACTION_NAMES[entry.factionKey].name : null,
    relationship: getRelationshipLabel(relationshipScore(entry, state)),
    description: entry.description,
  }
}
