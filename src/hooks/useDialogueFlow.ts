import { useState, useEffect, useRef, useCallback } from 'react'
import type { NarrativeSegment } from '../types/narrative'
import { useSettingsStore, TEXT_SPEED_MS } from '../stores/settingsStore'

export interface DialogueFlowState {
  /** Segments before the active one — fully revealed, static */
  revealedSegments: NarrativeSegment[]
  /** The segment currently being typed (undefined when allDone) */
  activeSegment: NarrativeSegment | undefined
  /** Partial text for the active segment */
  activeText: string
  /** True when active segment has finished typing */
  segmentDone: boolean
  /** True when all segments are fully revealed */
  allDone: boolean
  /** Character ID currently speaking (undefined when no dialogue segment is active) */
  speakingCharacter: string | undefined
  /** Skip or advance: first call skips typing, second advances to next segment */
  advance: () => void
}

export function useDialogueFlow(segments: NarrativeSegment[], speedMultiplier = 1): DialogueFlowState {
  const textSpeed = useSettingsStore(s => s.textSpeed)
  const speedMs   = speedMultiplier > 1
    ? Math.max(1, Math.round(TEXT_SPEED_MS[textSpeed] / speedMultiplier))
    : TEXT_SPEED_MS[textSpeed]

  const [activeIdx, setActiveIdx] = useState(0)
  const [charIdx,   setCharIdx]   = useState(0)
  const [segDone,   setSegDone]   = useState(false)
  const [allDone,   setAllDone]   = useState(false)

  // Refs mirror state for use inside intervals/callbacks without stale closures
  const activeIdxRef = useRef(0)
  const charIdxRef   = useRef(0)
  const segDoneRef   = useRef(false)
  const allDoneRef   = useRef(false)

  // Reset when the segments array changes (new scene loaded)
  useEffect(() => {
    const empty = segments.length === 0
    activeIdxRef.current = 0
    charIdxRef.current   = 0
    segDoneRef.current   = empty
    allDoneRef.current   = empty
    setActiveIdx(0)
    setCharIdx(0)
    setSegDone(empty)
    setAllDone(empty)
  }, [segments])

  // Typewriter driver for the active segment
  useEffect(() => {
    if (segDone || allDone || segments.length === 0) return

    if (speedMs === 0) {
      // Instant mode — reveal entire segment immediately
      const len = segments[activeIdxRef.current]?.text.length ?? 0
      charIdxRef.current = len
      setCharIdx(len)
      segDoneRef.current = true
      setSegDone(true)
      return
    }

    const id = setInterval(() => {
      if (segDoneRef.current || allDoneRef.current) {
        clearInterval(id)
        return
      }
      const len  = segments[activeIdxRef.current]?.text.length ?? 0
      const next = charIdxRef.current + 1
      if (next > len) {
        clearInterval(id)
        segDoneRef.current = true
        setSegDone(true)
      } else {
        charIdxRef.current = next
        setCharIdx(next)
      }
    }, speedMs)

    return () => clearInterval(id)
  }, [segments, activeIdx, speedMs, segDone, allDone])

  const advance = useCallback(() => {
    if (allDoneRef.current) return

    if (!segDoneRef.current) {
      // First call: skip typing, show full segment text
      const len = segments[activeIdxRef.current]?.text.length ?? 0
      charIdxRef.current = len
      setCharIdx(len)
      segDoneRef.current = true
      setSegDone(true)
      return
    }

    // Second call: move to next segment
    const next = activeIdxRef.current + 1
    if (next >= segments.length) {
      allDoneRef.current = true
      setAllDone(true)
    } else {
      activeIdxRef.current = next
      charIdxRef.current   = 0
      segDoneRef.current   = false
      setActiveIdx(next)
      setCharIdx(0)
      setSegDone(false)
    }
  }, [segments])

  const activeSeg = segments[activeIdx]

  return {
    revealedSegments: allDone ? segments : segments.slice(0, activeIdx),
    activeSegment:    allDone ? undefined : activeSeg,
    activeText:       allDone ? '' : (activeSeg?.text.slice(0, charIdx) ?? ''),
    segmentDone:      segDone || allDone,
    allDone,
    speakingCharacter: (!allDone && activeSeg?.type === 'dialogue')
      ? activeSeg.character
      : undefined,
    advance,
  }
}
