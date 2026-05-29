import { useState, useEffect, useRef } from 'react'
import type { NarrativeSegment } from '../types/narrative'
import { useSettingsStore, TEXT_SPEED_MS } from '../stores/settingsStore'

export interface TypewriterState {
  completedSegments: NarrativeSegment[]
  currentSegment: NarrativeSegment | undefined
  currentText: string
  done: boolean
}

export function useSegmentTypewriter(
  segments: NarrativeSegment[],
): TypewriterState {
  const textSpeed = useSettingsStore(s => s.textSpeed)
  const speedMs = TEXT_SPEED_MS[textSpeed]

  const [segIdx,  setSegIdx]  = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [done,    setDone]    = useState(false)

  const segmentsRef = useRef(segments)
  const segIdxRef   = useRef(0)
  const charIdxRef  = useRef(0)

  // Reset everything when segments array identity changes (scene transition)
  useEffect(() => {
    segmentsRef.current = segments
    segIdxRef.current   = 0
    charIdxRef.current  = 0
    setSegIdx(0)
    setCharIdx(0)
    setDone(segments.length === 0)
  }, [segments])

  // Drive the per-character interval at the current text speed
  useEffect(() => {
    if (done) return

    // Instant mode — reveal everything immediately
    if (speedMs === 0) {
      setDone(true)
      return
    }

    const id = setInterval(() => {
      const segs = segmentsRef.current
      const si   = segIdxRef.current
      const ci   = charIdxRef.current
      const seg  = segs[si]

      if (!seg) {
        clearInterval(id)
        setDone(true)
        return
      }

      const next = ci + 1

      if (next > seg.text.length) {
        if (si + 1 >= segs.length) {
          clearInterval(id)
          setDone(true)
        } else {
          segIdxRef.current  = si + 1
          charIdxRef.current = 0
          setSegIdx(si + 1)
          setCharIdx(0)
        }
      } else {
        charIdxRef.current = next
        setCharIdx(next)
      }
    }, speedMs)

    return () => clearInterval(id)
  }, [speedMs, done])

  return {
    completedSegments: done ? segments : segments.slice(0, segIdx),
    currentSegment:    done ? undefined : segments[segIdx],
    currentText:       done ? '' : (segments[segIdx]?.text.slice(0, charIdx) ?? ''),
    done,
  }
}
