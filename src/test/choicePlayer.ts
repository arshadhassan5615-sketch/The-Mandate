// Scripted choice-making for simulation walks.
//
// The scene UI shows getAvailableChoices(...) (or the terminal Continue from
// ensureTerminalChoice when that list is empty) and calls processChoice with
// the pick. playScene does the same against the live stores, so choice flags,
// consequence flags, nextNodeId / nextSegment transitions and chain
// scheduling all happen exactly as they do in play.
import { useNarrativeStore } from '../stores/narrativeStore'
import { useGameStore } from '../stores/gameStore'
import { getAvailableChoices, ensureTerminalChoice } from '../engine/NarrativeEngine'
import type { ChoiceTag, SceneChoice } from '../types/narrative'

/** Guard against a scene that never reaches sceneDone (e.g. every pick is rejected). */
export const MAX_CHOICES_PER_ITEM = 60

export type PickChoice = (choices: SceneChoice[]) => SceneChoice

export interface ChoicePlayResult {
  choicesMade: number
  /** True when MAX_CHOICES_PER_ITEM was reached before the scene completed. */
  loopHit: boolean
  /** Id of the scene still on screen when play stopped (null when none). */
  endedSceneId: string | null
}

/**
 * Play the scene currently loaded in narrativeStore to completion, choosing
 * with `pick` whenever real choices are offered. A scene with no offered
 * choices is completed through the synthetic Continue, as the UI does.
 */
export function playScene(pick: PickChoice): ChoicePlayResult {
  let choicesMade = 0
  while (choicesMade < MAX_CHOICES_PER_ITEM) {
    const nar = useNarrativeStore.getState()
    if (nar.sceneDone || !nar.currentScene) {
      return { choicesMade, loopHit: false, endedSceneId: nar.currentScene?.id ?? null }
    }
    const real = getAvailableChoices(nar.currentScene, useGameStore.getState(), nar.activeFlags)
    const choice = real.length > 0 ? pick(real) : ensureTerminalChoice([])[0]
    nar.processChoice(choice.id)
    choicesMade += 1
  }
  const nar = useNarrativeStore.getState()
  return { choicesMade, loopHit: true, endedSceneId: nar.currentScene?.id ?? null }
}

/** Seeded PRNG (mulberry32): returns floats in [0, 1). Same seed, same sequence. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Prefers the first choice whose internalTag matches `tags`, tried in order.
 * Falls back to the first offered choice.
 */
export function preferTags(tags: readonly ChoiceTag[]): PickChoice {
  return choices => {
    for (const tag of tags) {
      const hit = choices.find(c => c.internalTag === tag)
      if (hit) return hit
    }
    return choices[0]
  }
}

/** Uniform random pick from a seeded PRNG. Create one per walk for reproducibility. */
export function seededPick(seed: number): PickChoice {
  const rng = mulberry32(seed)
  return choices => choices[Math.floor(rng() * choices.length)]
}
