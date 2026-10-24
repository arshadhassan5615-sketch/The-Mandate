import type { NarrativeNode, SceneChoice } from '../types/narrative'
import type { ChoiceRecord } from '../stores/narrativeStore'

// Scene Paths: the branch tree of one finished scene. Pure: it reads the scene
// definition and the choice log and returns a new tree. The untaken options are
// included so the panel can seal them; the panel never shows their text.

export type PathTarget = { kind: 'segment'; id: string } | { kind: 'scene'; id: string } | { kind: 'end' }

export interface PathChoice {
  id: string
  text: string
  taken: boolean
  target: PathTarget
  next: PathNode | null
}

export interface PathNode {
  segmentId: string | null
  choices: PathChoice[]
}

export interface ScenePathSummary {
  root: PathNode
  explored: number
  total: number
}

type SceneShape = Pick<NarrativeNode, 'id' | 'choices' | 'segments'>

function choiceKey(segmentId: string | null, choiceId: string): string {
  return JSON.stringify([segmentId, choiceId])
}

function segmentChoices(scene: SceneShape, segmentId: string): readonly SceneChoice[] {
  return scene.segments?.[segmentId]?.choices ?? []
}

function resolveTarget(scene: SceneShape, choice: SceneChoice): PathTarget {
  if (choice.nextSegment && scene.segments?.[choice.nextSegment]) {
    return { kind: 'segment', id: choice.nextSegment }
  }
  if (choice.nextNodeId) {
    return { kind: 'scene', id: choice.nextNodeId }
  }
  return { kind: 'end' }
}

function buildNode(
  scene: SceneShape,
  segmentId: string | null,
  choices: readonly SceneChoice[],
  takenKeys: ReadonlySet<string>,
  ancestors: ReadonlySet<string>,
): PathNode {
  return {
    segmentId,
    choices: choices.map(choice => {
      const taken = takenKeys.has(choiceKey(segmentId, choice.id))
      const target = resolveTarget(scene, choice)
      // Only a taken segment choice opens a deeper decision point. A segment
      // already on the current path is not expanded again, so cycles end here.
      const expands = taken && target.kind === 'segment' && !ancestors.has(target.id)
      const next = expands
        ? buildNode(
            scene,
            target.id,
            segmentChoices(scene, target.id),
            takenKeys,
            new Set([...ancestors, target.id]),
          )
        : null
      return { id: choice.id, text: choice.text, taken, target, next }
    }),
  }
}

/** Every (segment, choice) pair the scene declares, the opening included. */
function declaredKeys(scene: SceneShape): Set<string> {
  const keys = new Set<string>()
  for (const choice of scene.choices ?? []) {
    keys.add(choiceKey(null, choice.id))
  }
  for (const [segmentId, segment] of Object.entries(scene.segments ?? {})) {
    for (const choice of segment.choices ?? []) {
      keys.add(choiceKey(segmentId, choice.id))
    }
  }
  return keys
}

export function buildScenePath(
  scene: Pick<NarrativeNode, 'id' | 'choices' | 'segments'>,
  log: readonly ChoiceRecord[],
): ScenePathSummary {
  const declared = declaredKeys(scene)
  const takenKeys = new Set<string>()
  for (const record of log) {
    if (record.sceneId === scene.id) {
      takenKeys.add(choiceKey(record.segmentId, record.choiceId))
    }
  }
  const explored = [...takenKeys].filter(key => declared.has(key)).length

  return {
    root: buildNode(scene, null, scene.choices ?? [], takenKeys, new Set()),
    explored,
    total: declared.size,
  }
}
