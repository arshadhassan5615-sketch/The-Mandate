// sceneLoadCount: every loadScene call advances it, so a scene loaded again
// (even the same id) gets a new identity. resetAll must leave it unchanged.

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useNarrativeStore } from '../narrativeStore'
import { SCENE_REGISTRY } from '../../engine/NarrativeEngine'
import type { NarrativeNode } from '../../types/narrative'

const SCENE_ID = '__test_scene_load_count__'

const TEST_SCENE: NarrativeNode = {
  id: SCENE_ID,
  title: 'Scene Load Count Test Scene',
  act: 1,
  weekAvailable: 1,
  type: 'event',
  agendaCost: 0,
  location: 'Test',
  characters: [],
  prerequisites: [],
  narrative: [{ type: 'description', text: 'A scene loaded twice.' }],
  choices: [{ id: 'only_choice', text: 'Only option' }],
}

describe('narrativeStore.sceneLoadCount', () => {
  beforeEach(() => {
    SCENE_REGISTRY.set(SCENE_ID, TEST_SCENE)
    useNarrativeStore.getState().resetAll()
  })

  afterEach(() => {
    SCENE_REGISTRY.delete(SCENE_ID)
  })

  it('starts a freshly loaded scene at its root, even if a branch was active', () => {
    useNarrativeStore.setState({ activeSegmentId: 'stale_branch' })
    useNarrativeStore.getState().loadScene(SCENE_ID)
    expect(useNarrativeStore.getState().activeSegmentId).toBeNull()
  })

  it('increments by one on each loadScene, so loading the same id twice adds 2', () => {
    const before = useNarrativeStore.getState().sceneLoadCount

    useNarrativeStore.getState().loadScene(SCENE_ID)
    useNarrativeStore.getState().loadScene(SCENE_ID)

    expect(useNarrativeStore.getState().sceneLoadCount).toBe(before + 2)
  })

  it('is not moved back to zero by resetAll', () => {
    useNarrativeStore.getState().loadScene(SCENE_ID)
    const before = useNarrativeStore.getState().sceneLoadCount

    useNarrativeStore.getState().resetAll()

    expect(useNarrativeStore.getState().sceneLoadCount).toBe(before)
  })
})
