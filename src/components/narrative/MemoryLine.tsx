import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Z } from '../../constants/zIndex'
import { secondsToMs } from '../scene/cinematic'
import { MEMORY_FADE_IN_S, MEMORY_FADE_OUT_S, MEMORY_HOLD_MS } from './memoryLineText'

const MEMORY_EASE = [0.4, 0, 0.2, 1] as const

// Mirrors DESKTOP_COLUMN_WIDTH in ConversationPanel.tsx (duplicated, not imported).
const COLUMN_WIDTH = 'clamp(218px, 36.3vw, 1094px)'
const COLUMN_GAP_PX = 14
// Right-most strip occupied by the HUD tool rail.
const TOOL_RAIL_PX = 112

interface MemoryLineProps {
  text: string
  onDone: () => void
}

/**
 * One quiet line beside the conversation column, to its right and top-aligned,
 * so it never covers the speaker text. Slides in from the column edge, fades in,
 * holds, fades out, then calls `onDone`. Pointer-transparent so it never blocks input.
 */
export default function MemoryLine({ text, onDone }: MemoryLineProps) {
  const reduceMotion = useReducedMotion() ?? false
  const [leaving, setLeaving] = useState(false)
  const onDoneRef = useRef(onDone)

  // Keep the latest callback without restarting the timers on every parent render.
  useEffect(() => {
    onDoneRef.current = onDone
  }, [onDone])

  useEffect(() => {
    const fadeInMs = reduceMotion ? 0 : secondsToMs(MEMORY_FADE_IN_S)
    const leaveTimer = window.setTimeout(() => setLeaving(true), fadeInMs + MEMORY_HOLD_MS)
    return () => window.clearTimeout(leaveTimer)
  }, [reduceMotion])

  useEffect(() => {
    if (!leaving) return
    const fadeOutMs = reduceMotion ? 0 : secondsToMs(MEMORY_FADE_OUT_S)
    const doneTimer = window.setTimeout(() => onDoneRef.current(), fadeOutMs)
    return () => window.clearTimeout(doneTimer)
  }, [leaving, reduceMotion])

  return (
    <div
      style={{
        position: 'fixed',
        top: 'calc(20px + env(safe-area-inset-top, 0px))',
        left: `calc(50% - 0.3vw + ${COLUMN_WIDTH} / 2 + ${COLUMN_GAP_PX}px)`,
        maxWidth: `calc(50% + 0.3vw - ${COLUMN_WIDTH} / 2 - ${COLUMN_GAP_PX}px - ${TOOL_RAIL_PX}px)`,
        zIndex: Z.sceneTop + 1,
        pointerEvents: 'none',
      }}
    >
      <motion.div
        role="status"
        aria-live="polite"
        data-testid="memory-line"
        initial={reduceMotion ? false : { opacity: 0, x: -8 }}
        animate={{ opacity: leaving ? 0 : 1, x: 0 }}
        transition={{
          duration: reduceMotion ? 0 : leaving ? MEMORY_FADE_OUT_S : MEMORY_FADE_IN_S,
          ease: MEMORY_EASE,
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'flex-start',
          gap: 10,
          padding: '7px 16px 7px 12px',
          maxWidth: 'min(520px, 86vw)',
          background: 'rgba(10,9,8,0.92)',
          border: '1px solid rgba(201,168,76,0.45)',
          borderRadius: 2,
          boxShadow: '0 6px 18px rgba(0,0,0,0.55)',
        }}
      >
        <span aria-hidden="true" style={{ color: '#c9a84c', fontSize: 10, marginTop: 4 }}>◆</span>
        <span
          style={{
            fontFamily: "'Crimson Text', Georgia, serif",
            fontStyle: 'italic',
            fontSize: 15,
            color: '#e8dcc0',
            lineHeight: 1.3,
          }}
        >
          {text}
        </span>
      </motion.div>
    </div>
  )
}
