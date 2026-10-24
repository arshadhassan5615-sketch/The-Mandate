import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import NarrativeScene from '../../NarrativeScene'
import { SCENE_REGISTRY } from '../../../engine/NarrativeEngine'
import { useNarrativeStore } from '../../../stores/narrativeStore'
import { useWeekStore } from '../../../stores/weekStore'
import { resetWorld } from '../../../test/simHarness'
import type { NarrativeNode, SceneChoice } from '../../../types/narrative'

const FIRST_ID = 'memory_chain_test_first'
const SECOND_ID = 'memory_chain_test_second'
const JONAS = 'character_jonas_ashavel'

const CONFRONT: SceneChoice = {
  id: 'confront',
  text: 'Confront him about the affair',
  nextNodeId: SECOND_ID,
  stateChanges: [{ stat: 'personal.marriageHealth', operation: 'add', value: -10 }],
}

function syntheticScene(id: string, choices: SceneChoice[]): NarrativeNode {
  return {
    id,
    title: 'Memory chain test',
    act: 1,
    weekAvailable: 1,
    type: 'meeting',
    agendaCost: 0,
    location: 'Cabinet Room',
    characters: [JONAS],
    prerequisites: [],
    narrative: [{ type: 'description', text: 'A short line.' }],
    choices,
  }
}

// jsdom has no ResizeObserver; the choice list observes its own height.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('memory line across a scene-chaining choice', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
    resetWorld()
    SCENE_REGISTRY.set(SECOND_ID, syntheticScene(SECOND_ID, []))
    SCENE_REGISTRY.set(FIRST_ID, syntheticScene(FIRST_ID, [CONFRONT]))
    useWeekStore.setState({ phase: 'scene' })
    useNarrativeStore.setState({
      currentScene: syntheticScene(FIRST_ID, [CONFRONT]),
      sceneDone: false,
      activeSegmentId: null,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    SCENE_REGISTRY.delete(FIRST_ID)
    SCENE_REGISTRY.delete(SECOND_ID)
  })

  it('keeps the memory line on screen after the choice moves play into the chained scene', () => {
    render(<NarrativeScene />)

    // Space skips the typing, a second Space finishes the only line and shows the choices.
    fireEvent.keyDown(window, { key: ' ' })
    fireEvent.keyDown(window, { key: ' ' })
    fireEvent.click(screen.getByRole('button', { name: /Confront him about the affair/ }))

    expect(useNarrativeStore.getState().currentScene?.id).toBe(SECOND_ID)
    expect(screen.getByTestId('memory-line')).toHaveTextContent('Jonas Ashavel will remember that.')
  })

  it('hands the memory text to the always-mounted status region for screen readers', () => {
    render(<NarrativeScene />)
    const status = screen.getByTestId('memory-status')
    expect(status).toHaveAttribute('role', 'status')
    expect(status).toHaveAttribute('aria-live', 'polite')
    expect(status.textContent).toBe('')

    fireEvent.keyDown(window, { key: ' ' })
    fireEvent.keyDown(window, { key: ' ' })
    fireEvent.click(screen.getByRole('button', { name: /Confront him about the affair/ }))

    expect(screen.getByTestId('memory-status')).toHaveTextContent('Jonas Ashavel will remember that.')
  })
})
