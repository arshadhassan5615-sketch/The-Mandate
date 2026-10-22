// newlyMetIds: characters a scene introduces for the first time.
// No existing narrativeStore test file exists, so this file covers the field.
import { describe, it, expect, beforeEach } from 'vitest'

import { useNarrativeStore } from '../narrativeStore'
import { SCENE_REGISTRY } from '../../engine/NarrativeEngine'

const SCENE_ID = 'act1_week1_inauguration'

/** Mirrors the loadScene rule: dialogue speakers, de-duplicated, in first-line order. */
function expectedSpeakersInFirstLineOrder(sceneId: string): string[] {
  const scene = SCENE_REGISTRY.get(sceneId)
  const speakers = (scene?.narrative ?? [])
    .filter(seg => seg.type === 'dialogue' && seg.character)
    .map(seg => seg.character as string)
  return [...new Set(speakers)]
}

describe('narrativeStore.newlyMetIds', () => {
  beforeEach(() => {
    useNarrativeStore.getState().resetAll()
  })

  it('lists the first-time speakers of the scene, de-duplicated, in first-line order', () => {
    const expected = expectedSpeakersInFirstLineOrder(SCENE_ID)

    useNarrativeStore.getState().loadScene(SCENE_ID)

    expect(useNarrativeStore.getState().newlyMetIds).toEqual(expected)
    expect(expected).toEqual(['vyktor_reznik'])
  })

  it('is empty when the same scene is loaded again because the characters are already met', () => {
    useNarrativeStore.getState().loadScene(SCENE_ID)
    expect(useNarrativeStore.getState().newlyMetIds.length).toBeGreaterThan(0)

    useNarrativeStore.getState().loadScene(SCENE_ID)

    expect(useNarrativeStore.getState().newlyMetIds).toEqual([])
  })

  it('stores ids without the character_ prefix in metCharacters-compatible form', () => {
    useNarrativeStore.getState().loadScene(SCENE_ID)

    const { newlyMetIds, metCharacters } = useNarrativeStore.getState()
    for (const id of newlyMetIds) {
      expect(metCharacters).toContain(`character_${id}`)
    }
  })

  it('records each character in metCharacters only once, even with repeated dialogue lines', () => {
    useNarrativeStore.getState().loadScene(SCENE_ID)

    const { metCharacters: m } = useNarrativeStore.getState()
    expect(new Set(m).size).toBe(m.length)
    expect(m.filter(id => id === 'character_vyktor_reznik')).toHaveLength(1)
  })

  it('is cleared by resetAll', () => {
    useNarrativeStore.getState().loadScene(SCENE_ID)
    useNarrativeStore.getState().resetAll()

    expect(useNarrativeStore.getState().newlyMetIds).toEqual([])
  })
})
