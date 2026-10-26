// opensScreen: a scene choice can open a game screen once it has been processed.
// The cabinet-formation screen is the only target so far; the scene is then closed
// (currentScene cleared) so the conversation column unmounts while the screen is up.

import { describe, it, expect, beforeEach } from 'vitest'
import { useNarrativeStore } from '../narrativeStore'
import { useGameStore } from '../gameStore'
import { useWeekStore } from '../weekStore'
import { useCabinetStore } from '../cabinetStore'
import { SCENE_REGISTRY } from '../../engine/NarrativeEngine'
import type { NarrativeNode } from '../../types/narrative'
import formationMeeting from '../../data/narrative/act1/act1_week2_cabinet_formation_meeting.json'

const OPENER_SCENE_ID = '__test_opens_screen_scene__'
const OPENER_FLAG = '__test_opens_screen_flag__'

const OPENER_SCENE: NarrativeNode = {
  id: OPENER_SCENE_ID,
  title: 'Opens Screen Test Scene',
  act: 1,
  weekAvailable: 1,
  type: 'meeting',
  agendaCost: 0,
  location: 'Test',
  characters: [],
  prerequisites: [],
  narrative: [{ type: 'description', text: 'A scene that opens a screen.' }],
  choices: [
    {
      id: 'open_screen_choice',
      text: 'Open it',
      flags: [OPENER_FLAG],
      opensScreen: 'cabinet_formation',
    },
  ],
}

describe('narrativeStore.opensScreen', () => {
  beforeEach(() => {
    SCENE_REGISTRY.set(OPENER_SCENE_ID, OPENER_SCENE)
    useGameStore.getState().resetToInitial()
    useNarrativeStore.getState().resetAll()
    useWeekStore.setState({ showCabinetFormation: false })
    useCabinetStore.setState({ formation_complete: false })
  })

  it('opens the cabinet formation screen after a choice that opensScreen', () => {
    // Arrange
    useNarrativeStore.getState().loadScene(OPENER_SCENE_ID)

    // Act
    useNarrativeStore.getState().processChoice('open_screen_choice')

    // Assert
    expect(useWeekStore.getState().showCabinetFormation).toBe(true)
    expect(useNarrativeStore.getState().activeFlags).toContain(OPENER_FLAG)
    expect(useNarrativeStore.getState().visitedSceneIds).toContain(OPENER_SCENE_ID)
    expect(useNarrativeStore.getState().currentScene).toBeNull()
  })

  it('does not open the cabinet formation screen when formation is already complete', () => {
    // Arrange
    useCabinetStore.setState({ formation_complete: true })
    useNarrativeStore.getState().loadScene(OPENER_SCENE_ID)

    // Act
    useNarrativeStore.getState().processChoice('open_screen_choice')

    // Assert
    expect(useWeekStore.getState().showCabinetFormation).toBe(false)
    expect(useNarrativeStore.getState().visitedSceneIds).toContain(OPENER_SCENE_ID)
  })

  it('wires the interview meeting final choice to the cabinet formation screen', () => {
    // Arrange
    const segments = formationMeeting.segments as Record<string, { choices?: Array<{ id: string; opensScreen?: string }> }>
    const choice = segments.transition_to_appointments?.choices?.find(c => c.id === 'enter_appointment_screen')

    // Assert
    expect(choice?.opensScreen).toBe('cabinet_formation')
  })
})
