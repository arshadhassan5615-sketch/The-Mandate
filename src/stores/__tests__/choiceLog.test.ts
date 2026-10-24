// choiceLog: every real choice the player makes is recorded in order, cleared
// by resetAll, and survives a Dexie saveGame / loadGame round-trip together
// with the province-news read state. Older saves load with empty defaults.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useNarrativeStore } from '../narrativeStore'
import { useGameStore } from '../gameStore'
import { useProvinceNewsStore } from '../provinceNewsStore'
import { saveGame, loadGame } from '../../engine/SaveManager'
import { SCENE_REGISTRY, ENGINE_CONTINUE_ID } from '../../engine/NarrativeEngine'
import { db, type SaveRecord } from '../../db/mandateDb'
import type { NarrativeNode } from '../../types/narrative'

const SCENE_ID = '__test_choice_log_scene__'
const BRANCH_ID = '__test_choice_log_branch__'
const TEST_WEEK = 4
const TEST_SLOT = 3

// Two opening choices: choice_a opens a branch, choice_b is terminal.
const TEST_SCENE: NarrativeNode = {
  id: SCENE_ID,
  title: 'Choice Log Test Scene',
  act: 1,
  weekAvailable: 1,
  type: 'event',
  agendaCost: 0,
  location: 'Test',
  characters: [],
  prerequisites: [],
  narrative: [{ type: 'description', text: 'A scene for the choice log.' }],
  choices: [
    { id: 'choice_a', text: 'Option A', nextSegment: BRANCH_ID },
    { id: 'choice_b', text: 'Option B' },
  ],
  segments: {
    [BRANCH_ID]: {
      narrative: [{ type: 'description', text: 'A branch of the scene.' }],
      choices: [{ id: 'branch_choice', text: 'Branch option' }],
    },
  },
}

function startScene(): void {
  useNarrativeStore.getState().loadScene(SCENE_ID)
}

describe('narrativeStore.choiceLog', () => {
  beforeEach(async () => {
    SCENE_REGISTRY.set(SCENE_ID, TEST_SCENE)
    useGameStore.getState().resetToInitial()
    useGameStore.setState({ currentWeek: TEST_WEEK })
    useNarrativeStore.getState().resetAll()
    useProvinceNewsStore.getState().reset()
    await db.saves.clear()
  })

  afterEach(() => {
    SCENE_REGISTRY.delete(SCENE_ID)
    vi.restoreAllMocks()
  })

  it('appends one record for a real choice, with segmentId null and the current week', () => {
    startScene()

    useNarrativeStore.getState().processChoice('choice_b')

    expect(useNarrativeStore.getState().choiceLog).toEqual([
      { sceneId: SCENE_ID, segmentId: null, choiceId: 'choice_b', week: TEST_WEEK },
    ])
  })

  it('records the branch id for a choice made inside a branch', () => {
    startScene()

    useNarrativeStore.getState().processChoice('choice_a')
    useNarrativeStore.getState().processChoice('branch_choice')

    expect(useNarrativeStore.getState().choiceLog).toEqual([
      { sceneId: SCENE_ID, segmentId: null, choiceId: 'choice_a', week: TEST_WEEK },
      { sceneId: SCENE_ID, segmentId: BRANCH_ID, choiceId: 'branch_choice', week: TEST_WEEK },
    ])
  })

  it('appends nothing for an unknown choice id', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    startScene()

    useNarrativeStore.getState().processChoice('no_such_choice')

    expect(useNarrativeStore.getState().choiceLog).toEqual([])
  })

  it('appends nothing for the synthetic engine Continue', () => {
    startScene()

    useNarrativeStore.getState().processChoice(ENGINE_CONTINUE_ID)

    expect(useNarrativeStore.getState().choiceLog).toEqual([])
  })

  it('is emptied by resetAll', () => {
    startScene()
    useNarrativeStore.getState().processChoice('choice_b')

    useNarrativeStore.getState().resetAll()

    expect(useNarrativeStore.getState().choiceLog).toEqual([])
  })

  it('survives saveGame / loadGame with the province-news read state', async () => {
    startScene()
    useNarrativeStore.getState().processChoice('choice_a')
    useNarrativeStore.getState().processChoice('branch_choice')
    useProvinceNewsStore.getState().markSeen(['prov_news_a', 'prov_news_b'])
    const logBefore = useNarrativeStore.getState().choiceLog

    await saveGame(TEST_SLOT, 'choice-log-test')

    useNarrativeStore.getState().resetAll()
    useProvinceNewsStore.getState().reset()
    expect(useNarrativeStore.getState().choiceLog).toEqual([])
    expect(useProvinceNewsStore.getState().seenIds).toEqual([])

    const ok = await loadGame(TEST_SLOT)
    expect(ok).toBe(true)
    expect(useNarrativeStore.getState().choiceLog).toEqual(logBefore)
    expect(useProvinceNewsStore.getState().seenIds).toEqual(['prov_news_a', 'prov_news_b'])
  })

  it('loads older saves without the new fields as empty defaults', async () => {
    startScene()
    useNarrativeStore.getState().processChoice('choice_b')
    useProvinceNewsStore.getState().markSeen(['prov_news_a'])
    await saveGame(TEST_SLOT, 'legacy-save-test')

    // Strip the new fields to mimic a save written before this feature existed.
    const saved = await db.saves.get(TEST_SLOT)
    if (!saved) throw new Error('choiceLog test: save missing after saveGame')
    const legacy: Partial<SaveRecord> = { ...saved }
    delete legacy.choiceLog
    delete legacy.provinceNewsSeenIds
    await db.saves.put(legacy as SaveRecord)

    // Start from non-empty state so the load has to actively replace it.
    useNarrativeStore.getState().processChoice('choice_b')
    useProvinceNewsStore.getState().markSeen(['stale_id'])

    const ok = await loadGame(TEST_SLOT)
    expect(ok).toBe(true)
    expect(useNarrativeStore.getState().choiceLog).toEqual([])
    expect(useProvinceNewsStore.getState().seenIds).toEqual([])
  })
})
