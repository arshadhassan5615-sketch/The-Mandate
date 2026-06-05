// Narrative / scene test factories.

import type { NarrativeNode, SceneChoice, NarrativeSegment } from '../../types/narrative'

/**
 * Build a minimal NarrativeNode suitable for engine tests.
 *
 * Defaults are the smallest valid scene: one description segment, no
 * choices, weekAvailable=1, weekDeadline undefined (always available).
 * Tests pass overrides to add choices, prerequisites, deadlines, etc.
 */
export function buildNarrativeNode(overrides: Partial<NarrativeNode> = {}): NarrativeNode {
  const base: NarrativeNode = {
    id: 'test_scene_1',
    title: 'Test Scene',
    act: 1,
    weekAvailable: 1,
    segments: [
      {
        type: 'description',
        text: 'A test scene plays out.',
      } satisfies NarrativeSegment,
    ],
    choices: [],
    visited: false,
    exclusive: [],
  }

  return { ...base, ...overrides }
}

/**
 * Build a minimal SceneChoice. Defaults to a no-op choice (no state changes,
 * no chain triggers, no flags) so tests can assert against a known baseline.
 */
export function buildSceneChoice(overrides: Partial<SceneChoice> = {}): SceneChoice {
  const base: SceneChoice = {
    id: 'test_choice_1',
    text: 'A test choice.',
    internalTag: 'pragmatist',
    stateChanges: [],
    chainTriggers: [],
    flags: [],
    codexUnlocks: [],
  }

  return { ...base, ...overrides }
}
