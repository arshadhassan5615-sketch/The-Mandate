// Week-completion rules for the map flow.
//
// Shared by the map UI (which pins to show, when the week auto-ends) and the
// simulation harness, so both read the same definition of "done".
import type { AgendaItem } from '../types/week'

/**
 * Per-tick cap on OVERDUE chain fires. Chains due this week always fire
 * (on-time consequences are never throttled); chains whose fire week already
 * passed — e.g. after loading an old autosave — drain at most this many per
 * week. Overflow stays scheduled: never dropped, never all at once.
 */
export const MAX_OVERDUE_CHAINS_PER_WEEK = 2

/**
 * True once the player has finished this agenda item.
 *
 * - `completedItemIds` are per-week item ids recorded when the item's queue
 *   run finishes (virtual items like `__budget__` never enter visitedSceneIds).
 * - Recurring entries (`recurring: true` — petitions / press / rally) are
 *   week-scoped: only this week's completion counts, so each occurrence can
 *   replay even though the shared sceneId was visited in an earlier week.
 * - Everything else is done once its scene has been visited this playthrough.
 */
export function isAgendaItemDone(
  item: AgendaItem,
  visitedSceneIds: readonly string[],
  completedItemIds: readonly string[] = [],
): boolean {
  if (completedItemIds.includes(item.id)) return true
  if (item.recurring) return false
  return visitedSceneIds.includes(item.sceneId)
}

/**
 * True when every item in the week's pool is done and the week may end.
 *
 * `__radio__` never blocks: a radio address is optional flavor (bounded by
 * MAX_BROADCASTS), so the week may end with one unplayed. An empty required
 * set (empty pool, or only radio left) means there is nothing left to do.
 */
export function isWeekComplete(
  pool: readonly AgendaItem[],
  visitedSceneIds: readonly string[],
  completedItemIds: readonly string[] = [],
): boolean {
  const required = pool.filter(item => item.sceneId !== '__radio__')
  return required.every(item => isAgendaItemDone(item, visitedSceneIds, completedItemIds))
}
