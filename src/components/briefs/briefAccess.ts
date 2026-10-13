// Which briefs (codex entries) the player may read, and which are unread.
// A brief is readable once the story has unlocked it; a keyword for a locked
// brief is shown as plain text so it can never spoil what comes later.
import type { CodexEntry } from '../../types/codex'

export function isBriefUnlocked(
  entry: Pick<CodexEntry, 'id' | 'unlockCondition'>,
  activeFlags: readonly string[],
  unlockedCodexIds: readonly string[],
): boolean {
  if (entry.unlockCondition === 'start') return true
  return activeFlags.includes(entry.unlockCondition) || unlockedCodexIds.includes(entry.id)
}

/** Unlocked briefs the player has not opened yet ("start" briefs are not news). */
export function unreadBriefCount(
  entries: readonly Pick<CodexEntry, 'id' | 'unlockCondition'>[],
  activeFlags: readonly string[],
  unlockedCodexIds: readonly string[],
  seenIds: readonly string[],
): number {
  return entries.filter(e =>
    e.unlockCondition !== 'start'
    && isBriefUnlocked(e, activeFlags, unlockedCodexIds)
    && !seenIds.includes(e.id)).length
}
