import type { CodexEntry } from '../types/codex'

/** unlockCondition value: the entry unlocks the first time its character speaks a line the player sees. */
export const MET_UNLOCK = 'met'

/**
 * Codex ids to unlock for characters met for the first time. Only entries whose
 * unlockCondition is MET_UNLOCK and whose id is one of the newly met roster ids
 * (`character_<id>`) are returned, in the order the characters were met.
 */
export function codexIdsUnlockedByMeeting(
  newlyMetRosterIds: readonly string[],
  entries: readonly Pick<CodexEntry, 'id' | 'unlockCondition'>[],
): string[] {
  const metEntryIds = new Set(
    entries.filter(e => e.unlockCondition === MET_UNLOCK).map(e => e.id),
  )
  return [...new Set(newlyMetRosterIds.filter(id => metEntryIds.has(id)))]
}
