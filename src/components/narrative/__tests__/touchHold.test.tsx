import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import NarrativeScene from '../../NarrativeScene'
import { TOUCH_HOLD_MS } from '../touchHold'
import { useNarrativeStore } from '../../../stores/narrativeStore'
import { useSettingsStore } from '../../../stores/settingsStore'
import { useWeekStore } from '../../../stores/weekStore'
import { useCodexStore } from '../../../stores/codexStore'
import { markSceneRead } from '../../../engine/readRegistry'
import { resetWorld } from '../../../test/simHarness'
import type { NarrativeNode } from '../../../types/narrative'

const LINES = ['Line one.', 'Line two.', 'Line three.', 'Line four.', 'Line five.']

function sceneWithId(id: string): NarrativeNode {
  return {
    id,
    title: 'Touch hold test',
    act: 1,
    weekAvailable: 1,
    type: 'meeting',
    agendaCost: 0,
    location: 'Cabinet Room',
    characters: [],
    prerequisites: [],
    narrative: LINES.map(text => ({ type: 'description' as const, text })),
    choices: [],
  }
}

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function step(totalMs: number, stepMs = 50) {
  for (let t = 0; t < totalMs; t += stepMs) act(() => { vi.advanceTimersByTime(stepMs) })
}

function mount(scene: NarrativeNode) {
  useNarrativeStore.setState({ currentScene: scene, sceneDone: false, activeSegmentId: null })
  render(<NarrativeScene />)
  step(3000)
}

describe('NarrativeScene touch hold to skip', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
    localStorage.clear()
    resetWorld()
    useCodexStore.setState({ inlineCodexOpen: false })
    useWeekStore.setState({ phase: 'scene' })
    useSettingsStore.setState({ autoAdvance: false })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('a finger held on a read scene fast-forwards it, and lifting it does not advance an extra line', () => {
    markSceneRead('touch_hold_read')
    mount(sceneWithId('touch_hold_read'))
    const first = screen.getByText(LINES[0])

    fireEvent.pointerDown(first, { pointerType: 'touch', pointerId: 1 })
    step(TOUCH_HOLD_MS + 2000)
    expect(screen.getByText(LINES[4])).toBeInTheDocument()

    fireEvent.pointerUp(first, { pointerType: 'touch', pointerId: 1 })
    fireEvent.click(first)
    expect(useNarrativeStore.getState().sceneDone).toBe(false)
  })

  it('a hold shorter than the threshold is an ordinary tap', () => {
    markSceneRead('touch_hold_short')
    mount(sceneWithId('touch_hold_short'))
    const first = screen.getByText(LINES[0])

    fireEvent.pointerDown(first, { pointerType: 'touch', pointerId: 1 })
    step(TOUCH_HOLD_MS - 200)
    fireEvent.pointerUp(first, { pointerType: 'touch', pointerId: 1 })
    fireEvent.click(first)
    step(3000)

    expect(screen.getByText(LINES[1])).toBeInTheDocument()
    expect(screen.queryByText(LINES[2])).not.toBeInTheDocument()
  })

  it('a hold on a scene never read before does not skip', () => {
    mount(sceneWithId('touch_hold_unread'))
    const first = screen.getByText(LINES[0])

    fireEvent.pointerDown(first, { pointerType: 'touch', pointerId: 1 })
    step(TOUCH_HOLD_MS + 2000)

    expect(screen.queryByText(LINES[1])).not.toBeInTheDocument()
  })

  it('a mouse press held down does not skip', () => {
    markSceneRead('touch_hold_mouse')
    mount(sceneWithId('touch_hold_mouse'))
    const first = screen.getByText(LINES[0])

    fireEvent.pointerDown(first, { pointerType: 'mouse', pointerId: 1 })
    step(TOUCH_HOLD_MS + 2000)

    expect(screen.queryByText(LINES[1])).not.toBeInTheDocument()
  })
})
