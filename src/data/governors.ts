import type { FactionState } from '../types/gameState'
import type { HomeProvinceId } from '../engine/provinceNews'
import data from './governors.json'

export interface Governor {
  id: string
  name: string
  characterId: string     // id used as `character` in scene dialogue
  provinceId: HomeProvinceId
  faction: keyof FactionState
  competence: number      // 0-100, hidden from the player
  loyalty: number         // 0-100 loyalty to the Chancellor, hidden
  integrity: number       // 0-100, hidden
  incumbent: boolean      // true = Halvek's appointee in office when the game starts
  bio: string             // one sentence the player may see
}

// JSON imports widen string literals, so the casts restore the declared types.
export const GOVERNORS: readonly Governor[] = data.governors as readonly Governor[]

/** Who stands in each province's election once the Self-Government Act is signed. */
export const ELECTION_CANDIDATES = data.electionCandidates as Record<HomeProvinceId, { reform: string; opposition: string }>

export function getGovernor(id: string): Governor | undefined {
  return GOVERNORS.find(g => g.id === id)
}
