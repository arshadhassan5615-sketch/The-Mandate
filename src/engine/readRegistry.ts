// Scenes the player has read to the end, across every playthrough.
// Skip mode uses this to fast-forward through material already seen.

const LS_READ_SCENES = 'mandate-read-scenes'

const AUTO_ADVANCE_BASE_MS = 1400
const AUTO_ADVANCE_MS_PER_CHAR = 32
const AUTO_ADVANCE_CAP_MS = 6000

// Parsed once, then kept in step with every write. The raw string is compared on
// each read, so a change made outside this module (another tab, a test) is picked up.
let cachedRaw: string | null | undefined
let cachedSet: Set<string> = new Set()

function parseReadScenes(raw: string | null): string[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is string => typeof id === 'string')
  } catch {
    return []
  }
}

function readSet(): Set<string> {
  let raw: string | null
  try {
    raw = localStorage.getItem(LS_READ_SCENES)
  } catch {
    // Storage is unavailable: answer from what this session already knows.
    return cachedSet
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw
    cachedSet = new Set(parseReadScenes(raw))
  }
  return cachedSet
}

export function hasReadScene(sceneId: string): boolean {
  return readSet().has(sceneId)
}

export function markSceneRead(sceneId: string): void {
  const readScenes = readSet()
  if (readScenes.has(sceneId)) return
  const nextIds = [...readScenes, sceneId]
  // Updated even if the write fails, so this session still treats the scene as read.
  cachedSet = new Set(nextIds)
  try {
    const nextRaw = JSON.stringify(nextIds)
    localStorage.setItem(LS_READ_SCENES, nextRaw)
    cachedRaw = nextRaw
  } catch {
    // Storage is unavailable: the scene is not remembered across reloads.
  }
}

/** Pure: delay before auto-advancing past a finished line. */
export function autoAdvanceDelayMs(text: string): number {
  return Math.min(AUTO_ADVANCE_CAP_MS, AUTO_ADVANCE_BASE_MS + AUTO_ADVANCE_MS_PER_CHAR * text.length)
}
