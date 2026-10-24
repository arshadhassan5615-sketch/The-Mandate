import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import NarrativeScene from '../../NarrativeScene'
import { useNarrativeStore } from '../../../stores/narrativeStore'
import { useSettingsStore } from '../../../stores/settingsStore'
import { useWeekStore } from '../../../stores/weekStore'
import { resetWorld } from '../../../test/simHarness'
import type { NarrativeNode } from '../../../types/narrative'

const SCENE_ID = 'scene_keys_test'
const FIRST_LINE = 'First line.'
const SECOND_LINE = 'Second line.'
const LS_READ_SCENES = 'mandate-read-scenes'

const TWO_LINES: NarrativeNode = {
  id: SCENE_ID,
  title: 'Keys test',
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

// jsdom has no ResizeObserver; ConversationPanel observes its history and choices.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// jsdom has no elementFromPoint, so tests install one that reports what covers the column.
function coverColumnWith(hit: Element | null) {
  Object.defineProperty(document, 'elementFromPoint', {
    value: vi.fn(() => hit),
    configurable: true,
    writable: true,
  })
}

function uncoverWithRail(): Element {
  return screen.getByTestId('portrait-rail-anchor')
}

// A role="dialog" element appended to the body, outside the conversation column, as a paper panel renders.
let outsideDialog: HTMLElement | null = null
function openOutsideDialog(): HTMLElement {
  outsideDialog = document.createElement('div')
  outsideDialog.setAttribute('role', 'dialog')
  document.body.appendChild(outsideDialog)
  return outsideDialog
}

// Advance fake time in small steps so React re-renders (and re-arms effects) between them.
function step(totalMs: number, stepMs = 100) {
  for (let t = 0; t < totalMs; t += stepMs) act(() => { vi.advanceTimersByTime(stepMs) })
}

// Enough for the first line to type, its reading delay (about 1.75s) and the second line to type.
const AUTO_ADVANCE_BUDGET_MS = 4000

describe('NarrativeScene keyboard and cover handling', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
    resetWorld()
    useWeekStore.setState({ phase: 'scene' })
    useSettingsStore.setState({ autoAdvance: false })
    useNarrativeStore.setState({
      currentScene: TWO_LINES,
      sceneDone: false,
      activeSegmentId: null,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    delete (document as { elementFromPoint?: unknown }).elementFromPoint
    outsideDialog?.remove()
    outsideDialog = null
    localStorage.removeItem(LS_READ_SCENES)
  })

  describe('the global A key', () => {
    it('toggles auto-advance when A is pressed on the page', () => {
      render(<NarrativeScene />)
      fireEvent.keyDown(document.body, { key: 'a' })
      expect(useSettingsStore.getState().autoAdvance).toBe(true)
    })

    it('ignores A typed into a content-editable element', () => {
      render(<NarrativeScene />)
      const editor = document.createElement('div')
      Object.defineProperty(editor, 'isContentEditable', { value: true })
      document.body.appendChild(editor)

      fireEvent.keyDown(editor, { key: 'a' })
      editor.remove()

      expect(useSettingsStore.getState().autoAdvance).toBe(false)
    })

    it('ignores A with Ctrl, Meta or Alt held', () => {
      render(<NarrativeScene />)
      fireEvent.keyDown(document.body, { key: 'a', ctrlKey: true })
      fireEvent.keyDown(document.body, { key: 'a', metaKey: true })
      fireEvent.keyDown(document.body, { key: 'a', altKey: true })
      expect(useSettingsStore.getState().autoAdvance).toBe(false)
    })
  })

  describe('auto-advance under an open panel', () => {
    it('holds the line while another panel covers the column, then advances once it is uncovered', () => {
      vi.useFakeTimers()
      useSettingsStore.setState({ autoAdvance: true })

      // Control: uncovered, the timer reaches the second line within the budget.
      const control = render(<NarrativeScene />)
      coverColumnWith(uncoverWithRail())
      step(AUTO_ADVANCE_BUDGET_MS)
      expect(screen.getByText(SECOND_LINE)).toBeInTheDocument()
      control.unmount()

      // Paused: under a cover the same budget leaves the first line on screen.
      render(<NarrativeScene />)
      coverColumnWith(document.body)
      step(AUTO_ADVANCE_BUDGET_MS)
      expect(screen.getByText(FIRST_LINE)).toBeInTheDocument()
      expect(screen.queryByText(SECOND_LINE)).toBeNull()

      // Resumed: once the column is uncovered the held line advances.
      coverColumnWith(uncoverWithRail())
      step(AUTO_ADVANCE_BUDGET_MS)
      expect(screen.getByText(SECOND_LINE)).toBeInTheDocument()
    })

    it('holds the line while a dialog is open outside the column, then advances once it closes', () => {
      vi.useFakeTimers()
      useSettingsStore.setState({ autoAdvance: true })

      // Control: no dialog, the timer reaches the second line within the budget.
      const control = render(<NarrativeScene />)
      coverColumnWith(uncoverWithRail())
      step(AUTO_ADVANCE_BUDGET_MS)
      expect(screen.getByText(SECOND_LINE)).toBeInTheDocument()
      control.unmount()

      // Paused: a dialog outside the column holds the first line.
      render(<NarrativeScene />)
      coverColumnWith(uncoverWithRail())
      const dialog = openOutsideDialog()
      step(AUTO_ADVANCE_BUDGET_MS)
      expect(screen.getByText(FIRST_LINE)).toBeInTheDocument()
      expect(screen.queryByText(SECOND_LINE)).toBeNull()

      // Resumed: closing the dialog lets the held line advance.
      dialog.remove()
      step(AUTO_ADVANCE_BUDGET_MS)
      expect(screen.getByText(SECOND_LINE)).toBeInTheDocument()
    })
  })

  describe('skip under an open panel', () => {
    it('does not fast-forward while another panel covers the column', () => {
      vi.useFakeTimers()
      localStorage.setItem(LS_READ_SCENES, JSON.stringify([SCENE_ID]))
      coverColumnWith(document.body)
      render(<NarrativeScene />)

      fireEvent.keyDown(window, { key: 'Control' })
      act(() => { vi.advanceTimersByTime(2000) })
      expect(screen.queryByText(SECOND_LINE)).toBeNull()

      coverColumnWith(uncoverWithRail())
      act(() => { vi.advanceTimersByTime(2000) })
      act(() => { vi.advanceTimersByTime(2000) })
      expect(screen.getByText(SECOND_LINE)).toBeInTheDocument()
      fireEvent.keyUp(window, { key: 'Control' })
    })

    it('does not fast-forward while a dialog is open outside the column', () => {
      vi.useFakeTimers()
      localStorage.setItem(LS_READ_SCENES, JSON.stringify([SCENE_ID]))
      render(<NarrativeScene />)
      coverColumnWith(uncoverWithRail())
      const dialog = openOutsideDialog()

      fireEvent.keyDown(window, { key: 'Control' })
      act(() => { vi.advanceTimersByTime(2000) })
      expect(screen.queryByText(SECOND_LINE)).toBeNull()

      dialog.remove()
      act(() => { vi.advanceTimersByTime(2000) })
      act(() => { vi.advanceTimersByTime(2000) })
      expect(screen.getByText(SECOND_LINE)).toBeInTheDocument()
      fireEvent.keyUp(window, { key: 'Control' })
    })
  })
})
