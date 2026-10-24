// Promises are recorded when the player makes them, saved with the game, restored
// on load, and cleared by resetAll. Older saves load with an empty ledger.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useNarrativeStore } from '../narrativeStore'
import { useGameStore } from '../gameStore'
import { useCommitmentStore } from '../commitmentStore'
import { useProvinceNewsStore } from '../provinceNewsStore'
import { saveGame, loadGame } from '../../engine/SaveManager'
import { SCENE_REGISTRY } from '../../engine/NarrativeEngine'
import { db, type SaveRecord } from '../../db/mandateDb'
import type { NarrativeNode } from '../../types/narrative'
import type { Commitment } from '../../engine/commitments'

const SCENE_ID = '__test_commitment_recording_scene__'
const SCENE_TITLE = 'Commitment Recording Test Scene'
const WITNESS_ID = 'test_witness'
const TEST_WEEK = 6
const TEST_SLOT = 4

// promise_choice contains a promise phrase; plain_choice does not;
// override_choice is plain text marked as a commitment by its author.
const TEST_SCENE: NarrativeNode = {
  id: SCENE_ID,
  title: SCENE_TITLE,
  act: 1,
  weekAvailable: 1,
  type: 'event',
  agendaCost: 0,
  location: 'Test',
  characters: ['katerin_ashavel', WITNESS_ID],
  prerequisites: [],
  narrative: [{ type: 'description', text: 'A scene for recording promises.' }],
  choices: [
    { id: 'promise_choice', text: '"I promise the workers will be paid."' },
    { id: 'plain_choice', text: 'Think about it.' },
    { id: 'override_choice', text: 'Very well.', commitment: true },
  ],
}

function startScene(): void {
  useNarrativeStore.getState().loadScene(SCENE_ID)
}

function expectedPromiseCommitment(): Commitment {
  return {
    id: `${SCENE_ID}:promise_choice`,
    sceneId: SCENE_ID,
    sceneTitle: SCENE_TITLE,
    choiceId: 'promise_choice',
    week: TEST_WEEK,
    quote: 'I promise the workers will be paid.',
    witnesses: [WITNESS_ID],
    flags: [],
  }
}

describe('narrativeStore commitment recording', () => {
  beforeEach(async () => {
    SCENE_REGISTRY.set(SCENE_ID, TEST_SCENE)
    useGameStore.getState().resetToInitial()
    useGameStore.setState({ currentWeek: TEST_WEEK })
    useNarrativeStore.getState().resetAll()
    useCommitmentStore.getState().reset()
    useProvinceNewsStore.getState().reset()
    await db.saves.clear()
  })

  afterEach(() => {
    SCENE_REGISTRY.delete(SCENE_ID)
    vi.restoreAllMocks()
  })

  it('records one commitment when the choice text contains "I promise"', () => {
    startScene()

    useNarrativeStore.getState().processChoice('promise_choice')

    expect(useCommitmentStore.getState().commitments).toEqual([expectedPromiseCommitment()])
  })

  it('records nothing for a plain choice', () => {
    startScene()

    useNarrativeStore.getState().processChoice('plain_choice')

    expect(useCommitmentStore.getState().commitments).toEqual([])
  })

  it('records one commitment for a plain-text choice marked commitment: true', () => {
    startScene()

    useNarrativeStore.getState().processChoice('override_choice')

    const commitments = useCommitmentStore.getState().commitments
    expect(commitments).toHaveLength(1)
    expect(commitments[0]).toMatchObject({
      id: `${SCENE_ID}:override_choice`,
      choiceId: 'override_choice',
      week: TEST_WEEK,
      witnesses: [WITNESS_ID],
    })
  })

  it('empties commitments and province-news seenIds on resetAll', () => {
    startScene()
    useNarrativeStore.getState().processChoice('promise_choice')
    useProvinceNewsStore.getState().markSeen(['prov_news_a'])

    useNarrativeStore.getState().resetAll()

    expect(useCommitmentStore.getState().commitments).toEqual([])
    expect(useProvinceNewsStore.getState().seenIds).toEqual([])
  })

  it('survives saveGame / loadGame after the store is mutated', async () => {
    startScene()
    useNarrativeStore.getState().processChoice('promise_choice')
    const before = useCommitmentStore.getState().commitments

    await saveGame(TEST_SLOT, 'commitment-save-test')

    useCommitmentStore.setState({ commitments: [] })
    expect(useCommitmentStore.getState().commitments).toEqual([])

    const ok = await loadGame(TEST_SLOT)
    expect(ok).toBe(true)
    expect(useCommitmentStore.getState().commitments).toEqual(before)
  })

  it('loads a save without the commitments field as an empty ledger', async () => {
    startScene()
    useNarrativeStore.getState().processChoice('promise_choice')
    await saveGame(TEST_SLOT, 'legacy-commitment-test')

    // Strip the field to mimic a save written before promises were recorded.
    const saved = await db.saves.get(TEST_SLOT)
    if (!saved) throw new Error('commitmentRecording test: save missing after saveGame')
    const legacy: Partial<SaveRecord> = { ...saved }
    delete legacy.commitments
    await db.saves.put(legacy as SaveRecord)

    // Start from non-empty state so the load has to actively replace it.
    useCommitmentStore.setState({ commitments: [expectedPromiseCommitment()] })

    const ok = await loadGame(TEST_SLOT)
    expect(ok).toBe(true)
    expect(useCommitmentStore.getState().commitments).toEqual([])
  })
})
