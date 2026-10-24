import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDialogueFlow } from '../useDialogueFlow'
import { useSettingsStore } from '../../stores/settingsStore'
import type { NarrativeSegment } from '../../types/narrative'

// Long enough for the typewriter to finish any test line at medium speed.
const TYPE_OUT_MS = 5000

interface FlowProps {
  segments: NarrativeSegment[]
  resetKey: string
}

function line(text: string): NarrativeSegment {
  return { type: 'dialogue', character: 'vyktor_reznik', text }
}

// Fresh arrays each call, so identity is never what makes two scenes equal.
function alphaScene(): NarrativeSegment[] {
  return [line('First line alpha.'), line('Second line alpha.')]
}

function bravoScene(): NarrativeSegment[] {
  return [line('First line bravo.'), line('Second line bravo.')]
}

function renderFlow(initial: FlowProps) {
  return renderHook(
    ({ segments, resetKey }: FlowProps) => useDialogueFlow(segments, 1, resetKey),
    { initialProps: initial },
  )
}

// Reader lets the line finish typing, then presses continue to reach the next line.
function continueToNextLine(advance: () => void) {
  act(() => {
    vi.advanceTimersByTime(TYPE_OUT_MS)
  })
  act(() => {
    advance()
  })
}

describe('useDialogueFlow reset', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useSettingsStore.setState({ textSpeed: 'medium' })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('resets progress when new segments share the same ten-character prefix', () => {
    const { result, rerender } = renderFlow({ segments: alphaScene(), resetKey: 'a' })

    continueToNextLine(() => result.current.advance())
    expect(result.current.activeSegment?.text).toBe('Second line alpha.')
    expect(result.current.revealedSegments).toHaveLength(1)

    rerender({ segments: bravoScene(), resetKey: 'a' })

    expect(result.current.activeSegment?.text).toBe('First line bravo.')
    expect(result.current.revealedSegments).toHaveLength(0)
    expect(result.current.segmentDone).toBe(false)
    expect(result.current.allDone).toBe(false)
  })

  it('resets progress when the reset key changes even if the text is identical', () => {
    const { result, rerender } = renderFlow({ segments: alphaScene(), resetKey: 'a' })

    continueToNextLine(() => result.current.advance())
    expect(result.current.activeSegment?.text).toBe('Second line alpha.')

    rerender({ segments: alphaScene(), resetKey: 'b' })

    expect(result.current.activeSegment?.text).toBe('First line alpha.')
    expect(result.current.revealedSegments).toHaveLength(0)
    expect(result.current.segmentDone).toBe(false)
  })

  it('is done immediately when the first segments array is empty', () => {
    const { result } = renderFlow({ segments: [], resetKey: 'a' })

    expect(result.current.allDone).toBe(true)
    expect(result.current.segmentDone).toBe(true)
    expect(result.current.activeSegment).toBeUndefined()
    expect(result.current.revealedSegments).toHaveLength(0)
  })

  it('does not reset progress on a plain rerender with the same content and key', () => {
    const { result, rerender } = renderFlow({ segments: alphaScene(), resetKey: 'a' })

    continueToNextLine(() => result.current.advance())
    expect(result.current.activeSegment?.text).toBe('Second line alpha.')

    rerender({ segments: alphaScene(), resetKey: 'a' })

    expect(result.current.activeSegment?.text).toBe('Second line alpha.')
    expect(result.current.revealedSegments).toHaveLength(1)
  })
})
