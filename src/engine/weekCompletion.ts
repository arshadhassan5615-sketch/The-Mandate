// Week-completion rules for the map flow.
//
// Shared by the map UI (which pins to show, when the week auto-ends) and the
// simulation harness, so both read the same definition of "done".
import type { AgendaItem } from '../types/week'

/**
 * Per-week cap on chain-forced items. When more delayed consequences come due
 * in one week than this (e.g. after loading an old autosave whose pending
 * chains are all overdue), only this many fire per week; the overflow carries
 * to the following weeks — never dropped, never all at once.
 */
export const MAX_FORCED_CHAINS_PER_WEEK = 3

/**
 * True once the player has finished this agenda item.
 *
 * `completedItemIds` are per-week item ids recorded when the item's queue run
 * finishes (needed for virtual items like `__budget__`, which never enter
 * visitedSceneIds). Optional so existing callers keep current behavior.
 */
export function isAgendaItemDone(
  item: AgendaItem,
  visitedSceneIds: readonly string[],
  completedItemIds: readonly string[] = [],
): boolean {
  return completedItemIds.includes(item.id) || visitedSceneIds.includes(item.sceneId)
}

/** True when every item in the week's pool is done and the week may end. */
export function isWeekComplete(
  pool: readonly AgendaItem[],
  visitedSceneIds: readonly string[],
  completedItemIds: readonly string[] = [],
): boolean {
  if (pool.length === 0) return false
  return pool.every(item => isAgendaItemDone(item, visitedSceneIds, completedItemIds))
}
