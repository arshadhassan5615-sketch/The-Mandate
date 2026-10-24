import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import NarrativeScene from '../../NarrativeScene'
import { SCENE_REGISTRY } from '../../../engine/NarrativeEngine'
import { useNarrativeStore } from '../../../stores/narrativeStore'
import { useSettingsStore } from '../../../stores/settingsStore'
import { useWeekStore } from '../../../stores/weekStore'
import { resetWorld } from '../../../test/simHarness'
import type { NarrativeNode } from '../../../types/narrative'

const SCENE_ID = 'scene_repeat_test'
const FIRST_LINE = 'Repeat first line.'
const SECOND_LINE = 'Repeat second line.'
const THIRD_LINE = 'Repeat third line.'
const CHOICE_TEXT = 'Only option'

// Upper bound on Space presses: each line needs at most two (skip typing, then advance).
const MAX_ADVANCE_PRESSES = 20

const THREE_LINES: NarrativeNode = {
  id: SCENE_ID,
  title: 'Repeat test',
  act: 1,
  weekAvailable: 1,
  type: 'meeting',
  agendaCost: 0,
  location: 'Cabinet Room',
  characters: [],
  prerequisites: [],
  narrative: [
    { type: 'description', text: FIRST_LINE },
    { type: 'description', text: SECOND_LINE },
    { type: 'description', text: THIRD_LINE },
  ],
  choices: [{ id: 'only_choice', text: CHOICE_TEXT }],
}

// jsdom has no ResizeObserver; ConversationPanel observes its history and choices.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function choiceButton() {
  return screen.queryByRole('button', { name: new RegExp(CHOICE_TEXT) })
}

// Space skips the typing of the active line, and a further Space moves on; stop once the choices show.
function advanceUntilChoicesShow() {
  for (let i = 0; i < MAX_ADVANCE_PRESSES && !choiceButton(); i++) {
    fireEvent.keyDown(window, { key: ' ' })
  }
}

describe('a scene loaded again while it is still on screen', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
    resetWorld()
    SCENE_REGISTRY.set(SCENE_ID, THREE_LINES)
    useWeekStore.setState({ phase: 'scene' })
    useSettingsStore.setState({ autoAdvance: false })
    useNarrativeStore.getState().loadScene(SCENE_ID)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    SCENE_REGISTRY.delete(SCENE_ID)
  })

  it('restarts its dialogue from the first line when the same scene is loaded again', () => {
    render(<NarrativeScene />)

    advanceUntilChoicesShow()
    expect(screen.getByText(THIRD_LINE)).toBeInTheDocument()
    expect(choiceButton()).not.toBeNull()

    act(() => {
      useNarrativeStore.getState().loadScene(SCENE_ID)
    })

    expect(screen.queryByText(THIRD_LINE)).toBeNull()
    expect(choiceButton()).toBeNull()

    // Space skips the typing of the restarted first line, so the line is then fully shown.
    fireEvent.keyDown(window, { key: ' ' })
    expect(screen.getByText(FIRST_LINE)).toBeInTheDocument()
    expect(screen.queryByText(SECOND_LINE)).toBeNull()
  })
})
