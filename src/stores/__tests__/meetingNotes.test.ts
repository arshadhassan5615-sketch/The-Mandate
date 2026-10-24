// meetingNotes: Katerin's automatic journal notes. A scene's `notebook` lines
// are recorded once, when the scene completes; the list is saved and loaded
// with the game, and older saves load with an empty list.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useNarrativeStore } from '../narrativeStore'
import { useGameStore } from '../gameStore'
import { saveGame, loadGame } from '../../engine/SaveManager'
import { SCENE_REGISTRY, ENGINE_CONTINUE_ID } from '../../engine/NarrativeEngine'
import { db, type SaveRecord } from '../../db/mandateDb'
import type { NarrativeNode } from '../../types/narrative'
import type { MeetingNote } from '../../types/meetingNotes'

const NOTED_SCENE_ID = '__test_meeting_notes_scene__'
const PLAIN_SCENE_ID = '__test_meeting_notes_plain_scene__'
const TEST_WEEK = 6
const TEST_SLOT = 4

const NOTED_SCENE: NarrativeNode = {
  id: NOTED_SCENE_ID,
  title: 'Meeting Notes Test Scene',
  act: 1,
  weekAvailable: 1,
  type: 'meeting',
  agendaCost: 0,
  location: 'Test',
  characters: [],
  prerequisites: [],
  narrative: [{ type: 'description', text: 'A scene that writes notes.' }],
  choices: [{ id: 'notes_terminal', text: 'Finish' }],
  notebook: ['The treasury is short by two months of wages.', '   ', 'Vyktor wants the vote on Friday.'],
}

const PLAIN_SCENE: NarrativeNode = {
  id: PLAIN_SCENE_ID,
  title: 'Plain Test Scene',
  act: 1,
  weekAvailable: 1,
  type: 'meeting',
  agendaCost: 0,
  location: 'Test',
  characters: [],
  prerequisites: [],
  narrative: [{ type: 'description', text: 'A scene with no notebook.' }],
  choices: [{ id: 'plain_terminal', text: 'Finish' }],
}

const NOTE: MeetingNote = {
  sceneId: 'some_scene',
  title: 'Some Scene',
  week: TEST_WEEK,
  lines: ['First line.'],
}

describe('gameStore.meetingNotes', () => {
  beforeEach(async () => {
    SCENE_REGISTRY.set(NOTED_SCENE_ID, NOTED_SCENE)
    SCENE_REGISTRY.set(PLAIN_SCENE_ID, PLAIN_SCENE)
    useGameStore.getState().resetToInitial()
    useGameStore.setState({ currentWeek: TEST_WEEK })
    useNarrativeStore.getState().resetAll()
    await db.saves.clear()
  })

  afterEach(() => {
    SCENE_REGISTRY.delete(NOTED_SCENE_ID)
    SCENE_REGISTRY.delete(PLAIN_SCENE_ID)
    vi.restoreAllMocks()
  })

  it('addMeetingNote records a note once per scene id', () => {
    useGameStore.getState().addMeetingNote(NOTE)
    useGameStore.getState().addMeetingNote({ ...NOTE, lines: ['A different line.'] })

    expect(useGameStore.getState().meetingNotes).toEqual([NOTE])
  })

  it('addMeetingNote drops blank lines and ignores a note with no lines left', () => {
    useGameStore.getState().addMeetingNote({ ...NOTE, lines: ['  ', ''] })
    expect(useGameStore.getState().meetingNotes).toEqual([])

    useGameStore.getState().addMeetingNote({ ...NOTE, lines: ['Kept.', ' '] })
    expect(useGameStore.getState().meetingNotes).toEqual([{ ...NOTE, lines: ['Kept.'] }])
  })

  it('completing a scene with a notebook records exactly one note with its title and week', () => {
    useNarrativeStore.getState().loadScene(NOTED_SCENE_ID)

    useNarrativeStore.getState().processChoice('notes_terminal')

    expect(useGameStore.getState().meetingNotes).toEqual([{
      sceneId: NOTED_SCENE_ID,
      title: 'Meeting Notes Test Scene',
      week: TEST_WEEK,
      lines: [
        'The treasury is short by two months of wages.',
        'Vyktor wants the vote on Friday.',
      ],
    }])
  })

  it('does not record a second note when the completed scene is continued afterwards', () => {
    useNarrativeStore.getState().loadScene(NOTED_SCENE_ID)
    useNarrativeStore.getState().processChoice('notes_terminal')

    useNarrativeStore.getState().processChoice(ENGINE_CONTINUE_ID)

    expect(useGameStore.getState().meetingNotes).toHaveLength(1)
  })

  it('records a note when a scene with no choices completes through the synthetic Continue', () => {
    const noChoices: NarrativeNode = { ...NOTED_SCENE, id: '__test_meeting_notes_no_choices__', choices: [] }
    SCENE_REGISTRY.set(noChoices.id, noChoices)
    try {
      useNarrativeStore.getState().loadScene(noChoices.id)

      useNarrativeStore.getState().processChoice(ENGINE_CONTINUE_ID)

      expect(useGameStore.getState().meetingNotes.map(n => n.sceneId)).toEqual([noChoices.id])
    } finally {
      SCENE_REGISTRY.delete(noChoices.id)
    }
  })

  it('records nothing for a scene without a notebook', () => {
    useNarrativeStore.getState().loadScene(PLAIN_SCENE_ID)

    useNarrativeStore.getState().processChoice('plain_terminal')

    expect(useGameStore.getState().meetingNotes).toEqual([])
  })

  it('is emptied by resetToInitial', () => {
    useGameStore.getState().addMeetingNote(NOTE)

    useGameStore.getState().resetToInitial()

    expect(useGameStore.getState().meetingNotes).toEqual([])
  })

  it('survives saveGame / loadGame', async () => {
    useNarrativeStore.getState().loadScene(NOTED_SCENE_ID)
    useNarrativeStore.getState().processChoice('notes_terminal')
    const notesBefore = useGameStore.getState().meetingNotes

    await saveGame(TEST_SLOT, 'meeting-notes-test')
    useGameStore.getState().resetToInitial()
    expect(useGameStore.getState().meetingNotes).toEqual([])

    const ok = await loadGame(TEST_SLOT)
    expect(ok).toBe(true)
    expect(useGameStore.getState().meetingNotes).toEqual(notesBefore)
  })

  it('loads an older save without meetingNotes as an empty list', async () => {
    useGameStore.getState().addMeetingNote(NOTE)
    await saveGame(TEST_SLOT, 'legacy-meeting-notes-test')

    // Strip the new field to mimic a save written before this feature existed.
    const saved = await db.saves.get(TEST_SLOT)
    if (!saved) throw new Error('meetingNotes test: save missing after saveGame')
    const legacy: Partial<SaveRecord> = { ...saved }
    delete legacy.meetingNotes
    await db.saves.put(legacy as SaveRecord)

    // Start from non-empty state so the load has to actively replace it.
    useGameStore.getState().addMeetingNote({ ...NOTE, sceneId: 'stale_scene' })

    const ok = await loadGame(TEST_SLOT)
    expect(ok).toBe(true)
    expect(useGameStore.getState().meetingNotes).toEqual([])
  })
})
