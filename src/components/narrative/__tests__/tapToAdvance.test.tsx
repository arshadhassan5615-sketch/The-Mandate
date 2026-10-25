import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import NarrativeScene from '../../NarrativeScene'
import { useNarrativeStore } from '../../../stores/narrativeStore'
import { useSettingsStore } from '../../../stores/settingsStore'
import { useWeekStore } from '../../../stores/weekStore'
import { resetWorld } from '../../../test/simHarness'
import type { NarrativeNode } from '../../../types/narrative'

const SCENE_ID = 'tap_advance_test'
const FIRST_LINE = 'First line.'
const SECOND_LINE = 'Second line.'
const DIALOGUE_LINE = 'Spoken line.'
const SPEAKER_ID = 'vyktor_reznik'
const MONOLOGUE_TEXT = 'Inner thought.'

const TWO_LINES: NarrativeNode = {
  id: SCENE_ID,
  title: 'Tap test',
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
  ],
  choices: [],
}

const SPEAKER_SCENE: NarrativeNode = {
  ...TWO_LINES,
  narrative: [
    { type: 'dialogue', character: SPEAKER_ID, text: DIALOGUE_LINE },
    { type: 'description', text: SECOND_LINE },
  ],
}

const MONOLOGUE_SCENE: NarrativeNode = {
  ...TWO_LINES,
  narrative: [{ type: 'description', text: FIRST_LINE }],
  monologue: MONOLOGUE_TEXT,
}

// jsdom has no ResizeObserver; ConversationPanel observes its history and choices.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Advance fake time in small steps so React re-renders (and re-arms effects) between them.
function step(totalMs: number, stepMs = 100) {
  for (let t = 0; t < totalMs; t += stepMs) act(() => { vi.advanceTimersByTime(stepMs) })
}

// Long enough for any of the short test lines to finish typing.
const TYPING_BUDGET_MS = 5000

function showScene(scene: NarrativeNode) {
  useNarrativeStore.setState({
    currentScene: scene,
    sceneDone: false,
    activeSegmentId: null,
  })
}

describe('NarrativeScene tap to advance', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
    resetWorld()
    useWeekStore.setState({ phase: 'scene' })
    useSettingsStore.setState({ autoAdvance: false })
    showScene(TWO_LINES)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('finishes typing on the first tap and advances on the second', () => {
    render(<NarrativeScene />)
    step(300)
    fireEvent.click(screen.getByText(/^Fir/))
    expect(screen.getByText(FIRST_LINE)).toBeInTheDocument()
    expect(screen.queryByText(SECOND_LINE)).toBeNull()

    fireEvent.click(screen.getByText(FIRST_LINE))
    step(TYPING_BUDGET_MS)
    expect(screen.getByText(SECOND_LINE)).toBeInTheDocument()
  })

  it('advances with the on-screen advance button', () => {
    render(<NarrativeScene />)
    step(300)

    fireEvent.click(screen.getByTestId('conversation-advance'))
    expect(screen.getByText(FIRST_LINE)).toBeInTheDocument()
    expect(screen.queryByText(SECOND_LINE)).toBeNull()

    fireEvent.click(screen.getByTestId('conversation-advance'))
    step(TYPING_BUDGET_MS)
    expect(screen.getByText(SECOND_LINE)).toBeInTheDocument()
  })

  it('does not advance when a speaker name is tapped', () => {
    showScene(SPEAKER_SCENE)
    render(<NarrativeScene />)
    step(TYPING_BUDGET_MS)
    expect(screen.getByText(DIALOGUE_LINE, { exact: false })).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('speaker-name'))
    step(TYPING_BUDGET_MS)
    expect(screen.queryByText(SECOND_LINE)).toBeNull()
  })

  it('dismisses the monologue on tap', () => {
    showScene(MONOLOGUE_SCENE)
    render(<NarrativeScene />)
    step(TYPING_BUDGET_MS)
    // The single line is fully typed, so one advance moves past it to the end of the segments.
    fireEvent.click(screen.getByTestId('conversation-advance'))
    step(1000)

    const monologue = screen.getByTestId('monologue')
    expect(monologue).toHaveTextContent('Press Space to continue')

    fireEvent.click(screen.getByText(MONOLOGUE_TEXT))
    step(1000)
    expect(screen.queryByTestId('monologue')).toBeNull()
  })
})
