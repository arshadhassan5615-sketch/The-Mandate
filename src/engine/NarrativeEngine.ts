import type { NarrativeNode, SceneChoice } from '../types/narrative'
import type { GameState } from '../types/gameState'
import { evaluateAll } from './conditionEvaluator'

// Load all scene JSON files at build time via Vite glob import.
// Files are sorted alphabetically by path; prerequisites govern logical ordering.
const sceneModules = import.meta.glob<NarrativeNode>(
  '../data/narrative/**/*.json',
  { eager: true, import: 'default' },
)

export const ALL_SCENES: NarrativeNode[] = Object.values(sceneModules)

export const SCENE_REGISTRY = new Map<string, NarrativeNode>(
  ALL_SCENES.map(s => [s.id, s]),
)

if (import.meta.env.DEV) {
  console.log(`[NarrativeEngine] Loaded ${ALL_SCENES.length} scenes into registry`)
  // Log any duplicate scene IDs
  const ids = ALL_SCENES.map(s => s.id)
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
  if (dupes.length > 0) console.warn('[NarrativeEngine] DUPLICATE SCENE IDs:', [...new Set(dupes)])
  // Log any scenes missing IDs
  const missing = ALL_SCENES.filter(s => !s.id)
  if (missing.length > 0) console.warn('[NarrativeEngine] SCENES MISSING IDs:', missing.length)
}

export function getScene(id: string): NarrativeNode | undefined {
  const scene = SCENE_REGISTRY.get(id)
  if (!scene) {
    console.error('[NarrativeEngine] SCENE NOT FOUND:', id)
    console.error('[NarrativeEngine] AVAILABLE SCENES:', [...SCENE_REGISTRY.keys()].slice(0, 20))
  }
  return scene
}

/**
 * Returns the first scene whose prerequisites pass, has not been visited,
 * and is available this week. Order determined by file path (alphabetical),
 * so prerequisites are the primary ordering mechanism.
 */
export function getNextAvailableScene(
  state: GameState,
  flags: string[],
  visited: string[],
): NarrativeNode | undefined {
  for (const scene of ALL_SCENES) {
    if (visited.includes(scene.id)) continue
    if (scene.weekAvailable > state.currentWeek) continue
    if (scene.weekDeadline !== undefined && state.currentWeek > scene.weekDeadline) continue
    if (!evaluateAll(scene.prerequisites, state, flags)) continue
    return scene
  }
  return undefined
}

/** Filters choices whose optional `conditions` array all pass. */
export function getAvailableChoices(
  scene: NarrativeNode | undefined,
  state: GameState,
  flags: string[],
): SceneChoice[] {
  if (!scene?.choices) return []
  return scene.choices.filter(
    c => !c.conditions || evaluateAll(c.conditions, state, flags),
  )
}

export interface GateCheckResult {
  canAdvance: boolean
  blockedBy?: NarrativeNode
}

export function canAdvanceWeek(
  currentWeek: number,
  completedSceneIds: string[],
): GateCheckResult {
  const gateScenes = ALL_SCENES.filter(scene =>
    scene.isWeekGate &&
    scene.weekAvailable <= currentWeek &&
    !completedSceneIds.includes(scene.id),
  )

  if (gateScenes.length > 0) {
    return { canAdvance: false, blockedBy: gateScenes[0] }
  }

  return { canAdvance: true }
}

export function getAvailableAgendaItems(
  currentWeek: number,
  completedSceneIds: string[],
  activeFlags: string[],
): NarrativeNode[] {
  return ALL_SCENES.filter(scene => {
    if (scene.weekAvailable > currentWeek) return false
    if (scene.weekDeadline !== undefined && currentWeek > scene.weekDeadline) return false
    if (completedSceneIds.includes(scene.id)) return false

    if (scene.prerequisiteSceneIds?.length) {
      const allPrereqsMet = scene.prerequisiteSceneIds.every(
        id => completedSceneIds.includes(id),
      )
      if (!allPrereqsMet) return false
    }

    if (scene.prerequisiteFlags?.length) {
      const allFlagsMet = scene.prerequisiteFlags.every(
        flag => activeFlags.includes(flag),
      )
      if (!allFlagsMet) return false
    }

    return true
  })
}

export function getUnavailableDueToPrerequisites(
  currentWeek: number,
  completedSceneIds: string[],
  activeFlags: string[],
): NarrativeNode[] {
  return ALL_SCENES.filter(scene => {
    if (scene.weekAvailable > currentWeek) return false
    if (scene.weekDeadline !== undefined && currentWeek > scene.weekDeadline) return false
    if (completedSceneIds.includes(scene.id)) return false

    if (scene.prerequisiteSceneIds?.length) {
      const allPrereqsMet = scene.prerequisiteSceneIds.every(
        id => completedSceneIds.includes(id),
      )
      if (allPrereqsMet) return false
      return true
    }

    if (scene.prerequisiteFlags?.length) {
      const allFlagsMet = scene.prerequisiteFlags.every(
        flag => activeFlags.includes(flag),
      )
      if (allFlagsMet) return false
      return true
    }

    return false
  })
}

export function getSceneForGate(gateId: string): NarrativeNode | undefined {
  return SCENE_REGISTRY.get(gateId)
}
