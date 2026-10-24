// Scenes the player has read to the end, across every playthrough.
// Skip mode uses this to fast-forward through material already seen.

const LS_READ_SCENES = 'mandate-read-scenes'

const AUTO_ADVANCE_BASE_MS = 1400
const AUTO_ADVANCE_MS_PER_CHAR = 32
const AUTO_ADVANCE_CAP_MS = 6000

function loadReadScenes(): string[] {
  try {
    const raw = localStorage.getItem(LS_READ_SCENES)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is string => typeof id === 'string')
  } catch {
    return []
  }
}

export function hasReadScene(sceneId: string): boolean {
  return loadReadScenes().includes(sceneId)
}

export function markSceneRead(sceneId: string): void {
  const readScenes = loadReadScenes()
  if (readScenes.includes(sceneId)) return
  try {
    localStorage.setItem(LS_READ_SCENES, JSON.stringify([...readScenes, sceneId]))
  } catch {
    // Storage is unavailable: the scene simply is not remembered as read.
  }
}

/** Pure: delay before auto-advancing past a finished line. */
export function autoAdvanceDelayMs(text: string): number {
  return Math.min(AUTO_ADVANCE_CAP_MS, AUTO_ADVANCE_BASE_MS + AUTO_ADVANCE_MS_PER_CHAR * text.length)
}
