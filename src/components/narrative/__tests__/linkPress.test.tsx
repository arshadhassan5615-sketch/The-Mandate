import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { codexLinkHandlers, LONG_PRESS_MS } from '../linkPress'
import NarrativeScene from '../../NarrativeScene'
import { useNarrativeStore } from '../../../stores/narrativeStore'
import { useSettingsStore } from '../../../stores/settingsStore'
import { useWeekStore } from '../../../stores/weekStore'
import { useCodexStore } from '../../../stores/codexStore'
import { resetWorld } from '../../../test/simHarness'
import type { NarrativeNode } from '../../../types/narrative'

const LINK_TEXT = 'Codex Link'

function stubCoarsePointer(matches: boolean) {
  window.matchMedia = vi.fn(() => ({ matches }) as MediaQueryList)
}

function removeMatchMedia() {
  delete (window as { matchMedia?: unknown }).matchMedia
}

// A column whose click advances (counter), holding one codex link with the handlers under test.
function LinkColumn({ open }: { open: () => void }) {
  const [advances, setAdvances] = useState(0)
  return (
    <div data-testid="column" onClick={() => setAdvances(n => n + 1)}>
      <span role="button" {...codexLinkHandlers(open)}>{LINK_TEXT}</span>
      <output data-testid="advances">{advances}</output>
    </div>
  )
}

describe('codexLinkHandlers on a coarse pointer', () => {
  beforeEach(() => stubCoarsePointer(true))
  afterEach(() => removeMatchMedia())

  it('lets a short tap fall through so the column advances, without opening the Codex', () => {
    const open = vi.fn()
    render(<LinkColumn open={open} />)
    const link = screen.getByText(LINK_TEXT)

    fireEvent.pointerDown(link, { pointerType: 'touch' })
    fireEvent.pointerUp(link)
    fireEvent.click(link)

    expect(screen.getByTestId('advances')).toHaveTextContent('1')
    expect(open).not.toHaveBeenCalled()
  })

  it('opens the Codex once on a long press and swallows the click that follows', () => {
    vi.useFakeTimers()
    try {
      const open = vi.fn()
      render(<LinkColumn open={open} />)
      const link = screen.getByText(LINK_TEXT)

      fireEvent.pointerDown(link, { pointerType: 'touch' })
      act(() => { vi.advanceTimersByTime(LONG_PRESS_MS + 50) })
      expect(open).toHaveBeenCalledTimes(1)

      fireEvent.pointerUp(link)
      fireEvent.click(link)
      expect(screen.getByTestId('advances')).toHaveTextContent('0')
      expect(open).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it('does not open the Codex when the press is released before the long-press delay', () => {
    vi.useFakeTimers()
    try {
      const open = vi.fn()
      render(<LinkColumn open={open} />)
      const link = screen.getByText(LINK_TEXT)

      fireEvent.pointerDown(link, { pointerType: 'touch' })
      act(() => { vi.advanceTimersByTime(LONG_PRESS_MS - 100) })
      fireEvent.pointerUp(link)
      act(() => { vi.advanceTimersByTime(LONG_PRESS_MS) })

      expect(open).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('suppresses the context menu', () => {
    render(<LinkColumn open={vi.fn()} />)
    const notCancelled = fireEvent.contextMenu(screen.getByText(LINK_TEXT))
    expect(notCancelled).toBe(false)
  })
})

describe('codexLinkHandlers on a fine pointer', () => {
  beforeEach(() => removeMatchMedia())

  it('a click opens the Codex and does not advance the column', () => {
    const open = vi.fn()
    render(<LinkColumn open={open} />)

    fireEvent.click(screen.getByText(LINK_TEXT))

    expect(open).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('advances')).toHaveTextContent('0')
  })
})

const CODEX_LINK_TERM = 'The National Debt'
const FIRST_LINE = `Read about ${CODEX_LINK_TERM} before the vote.`
const SECOND_LINE = 'Second line after the tap.'
const TAP_SCENE: NarrativeNode = {
  id: 'link_press_tap_test',
  title: 'Link press test',
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

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function step(totalMs: number, stepMs = 100) {
  for (let t = 0; t < totalMs; t += stepMs) act(() => { vi.advanceTimersByTime(stepMs) })
}

describe('NarrativeScene codex links on a coarse pointer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
    stubCoarsePointer(true)
    resetWorld()
    useCodexStore.setState({ inlineCodexOpen: false })
    useWeekStore.setState({ phase: 'scene' })
    useSettingsStore.setState({ autoAdvance: false })
    useNarrativeStore.setState({ currentScene: TAP_SCENE, sceneDone: false, activeSegmentId: null })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    removeMatchMedia()
  })

  it('a short tap on a codex link advances the dialogue and does not open the inline codex', () => {
    render(<NarrativeScene />)
    step(5000)
    const link = screen.getByText(CODEX_LINK_TERM, { selector: '[data-codex-link]', exact: false })

    fireEvent.pointerDown(link, { pointerType: 'touch' })
    fireEvent.pointerUp(link)
    fireEvent.click(link)
    step(5000)

    expect(screen.getByText(SECOND_LINE)).toBeInTheDocument()
    expect(useCodexStore.getState().inlineCodexOpen).toBe(false)
  })
})
