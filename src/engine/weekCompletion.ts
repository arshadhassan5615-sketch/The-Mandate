// Week-completion rules for the map flow.
//
// Shared by the map UI (which pins to show, when the week auto-ends) and the
// simulation harness, so both read the same definition of "done".
import type { AgendaItem } from '../types/week'

/** True once the player has finished this agenda item. */
export function isAgendaItemDone(item: AgendaItem, visitedSceneIds: readonly string[]): boolean {
  return visitedSceneIds.includes(item.sceneId)
}

/** True when every item in the week's pool is done and the week may end. */
export function isWeekComplete(pool: readonly AgendaItem[], visitedSceneIds: readonly string[]): boolean {
  if (pool.length === 0) return false
  return pool.every(item => isAgendaItemDone(item, visitedSceneIds))
}
