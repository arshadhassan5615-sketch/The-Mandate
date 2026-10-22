export const PLAYER_ID = 'katerin_ashavel'
export const MAX_PARTICIPANTS = 6

export interface ParticipantLine {
  type: string
  characterId?: string
}

export interface ActiveLine {
  type: string
  character?: string
}

export interface SceneParticipants {
  /**
   * Everyone (not the player) who has spoken a dialogue line so far, at most MAX_PARTICIPANTS.
   * The set is the most recently active speakers. The order is the order of first appearance
   * in the conversation (earliest first), except that the current speaker is moved to the end,
   * so the rail shows them large at the bottom, as Suzerain does.
   */
  ids: string[]
  /** The non-player character speaking the latest line, or null when the latest line is the player's or nobody has spoken. */
  currentId: string | null
}

interface SpokenLine {
  id: string
  isPlayer: boolean
}

function spokenLinesFrom(history: readonly ParticipantLine[], active: ActiveLine | null): SpokenLine[] {
  const lines: SpokenLine[] = []

  for (const entry of history) {
    if (entry.type === 'player_spoken') {
      lines.push({ id: entry.characterId || PLAYER_ID, isPlayer: true })
    } else if (entry.type === 'dialogue' && entry.characterId) {
      lines.push({ id: entry.characterId, isPlayer: entry.characterId === PLAYER_ID })
    }
  }

  if (active && active.type === 'dialogue' && active.character) {
    lines.push({ id: active.character, isPlayer: active.character === PLAYER_ID })
  }

  return lines
}

function recentSpeakerSet(lines: readonly SpokenLine[]): Set<string> {
  const recent = new Set<string>()

  for (let i = lines.length - 1; i >= 0 && recent.size < MAX_PARTICIPANTS; i--) {
    const line = lines[i]
    if (!line.isPlayer) recent.add(line.id)
  }

  return recent
}

function inFirstAppearanceOrder(lines: readonly SpokenLine[], recent: ReadonlySet<string>): string[] {
  const ordered: string[] = []

  for (const line of lines) {
    if (line.isPlayer || !recent.has(line.id) || ordered.includes(line.id)) continue
    ordered.push(line.id)
  }

  return ordered
}

function speakerLast(ids: readonly string[], currentId: string | null): string[] {
  if (currentId === null || !ids.includes(currentId)) return [...ids]
  return [...ids.filter(id => id !== currentId), currentId]
}

/**
 * Works out who is in a conversation and who is speaking now.
 * Pure: neither argument is mutated.
 */
export function sceneParticipants(
  history: readonly ParticipantLine[],
  active: ActiveLine | null,
): SceneParticipants {
  const lines = spokenLinesFrom(history, active)
  const newest = lines.at(-1)
  const currentId = newest && !newest.isPlayer ? newest.id : null
  const ordered = inFirstAppearanceOrder(lines, recentSpeakerSet(lines))

  return { ids: speakerLast(ordered, currentId), currentId }
}
