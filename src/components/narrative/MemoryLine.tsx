import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, RefObject } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Z } from '../../constants/zIndex'
import type { PageInsets } from '../../constants/layout'
import { secondsToMs } from '../scene/cinematic'
import { usePageInsets } from '../../hooks/usePageInsets'
import { MEMORY_FADE_IN_S, MEMORY_FADE_OUT_S, MEMORY_HOLD_MS } from './memoryLineText'

const MEMORY_EASE = [0.4, 0, 0.2, 1] as const

/** Gap kept between the line and the column, and between the line and the HUD rail. */
const MARGIN_PX = 12
/** A right-hand gap at least this wide always wins, which keeps desktop on the right. */
const PREFER_RIGHT_GAP_PX = 200
/** When both side gaps are narrower than this, the line drops to the bottom of the viewport. */
const MIN_SIDE_GAP_PX = 120
/** Top of a right-side line, below the top edge. */
const RIGHT_TOP_PX = 20
/** Top of a left-side line: starts below the crest (desktop 124, compact and phone 84). */
const LEFT_TOP_DESKTOP_PX = 124
const LEFT_TOP_COMPACT_PX = 84
/** Width cap for the bottom-of-viewport fallback. */
const BOTTOM_MAX_WIDTH = 'min(90vw, 360px)'

const LINE_BOX: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'flex-start',
  maxWidth: 'min(520px, 86vw)',
}
const BOTTOM_BOX: CSSProperties = { ...LINE_BOX, maxWidth: BOTTOM_MAX_WIDTH }

interface ColumnBox {
  left: number
  right: number
}

interface LineGeometry {
  column: ColumnBox | null
  viewportWidth: number
}

interface LinePlacement {
  wrapper: CSSProperties
  box: CSSProperties
  textAlign: CSSProperties['textAlign']
}

interface SideGaps {
  rightGap: number
  leftGap: number
}

function sideGapsOf(column: ColumnBox, viewportWidth: number, railInset: number): SideGaps {
  return {
    rightGap: viewportWidth - railInset - column.right - 2 * MARGIN_PX,
    leftGap: column.left - 2 * MARGIN_PX,
  }
}

type Side = 'right' | 'left' | 'bottom'

function chooseSide({ rightGap, leftGap }: SideGaps): Side {
  if (rightGap >= PREFER_RIGHT_GAP_PX) return 'right'
  if (Math.max(rightGap, leftGap) < MIN_SIDE_GAP_PX) return 'bottom'
  return leftGap > rightGap ? 'left' : 'right'
}

function bottomPlacement(insets: PageInsets): LinePlacement {
  return {
    wrapper: {
      left: 0,
      right: 0,
      bottom: `calc(${MARGIN_PX + insets.bottom}px)`,
      textAlign: 'center',
    },
    box: BOTTOM_BOX,
    textAlign: 'center',
  }
}

/**
 * Places the line in whichever side gap beside the column is wider, so it never
 * overlaps the column. Falls back to the bottom when no column is measured or both gaps are tiny.
 */
function linePlacement(geometry: LineGeometry, insets: PageInsets, isDesktop: boolean): LinePlacement {
  const { column, viewportWidth } = geometry
  if (!column) return bottomPlacement(insets)

  const gaps = sideGapsOf(column, viewportWidth, insets.right)
  const side = chooseSide(gaps)
  if (side === 'bottom') return bottomPlacement(insets)

  if (side === 'right') {
    return {
      wrapper: {
        left: column.right + MARGIN_PX,
        top: `calc(${RIGHT_TOP_PX}px + env(safe-area-inset-top, 0px))`,
        maxWidth: gaps.rightGap,
      },
      box: LINE_BOX,
      textAlign: 'left',
    }
  }

  const leftTop = isDesktop ? LEFT_TOP_DESKTOP_PX : LEFT_TOP_COMPACT_PX
  return {
    wrapper: {
      left: MARGIN_PX,
      top: `calc(${leftTop}px + env(safe-area-inset-top, 0px))`,
      maxWidth: gaps.leftGap,
    },
    box: LINE_BOX,
    textAlign: 'left',   // the diamond marker leads the line on either side
  }
}

interface MemoryLineProps {
  text: string
  onDone: () => void
  columnRef: RefObject<HTMLDivElement | null>
}

/**
 * One quiet line beside the conversation column, in whichever side gap is wider,
 * so it never covers the speaker text. The left side starts below the HUD crest.
 * Slides in, fades in, holds, fades out, then calls `onDone`. Pointer-transparent
 * so it never blocks input. The spoken announcement is made by the status region
 * in NarrativeScene, not here.
 */
export default function MemoryLine({ text, onDone, columnRef }: MemoryLineProps) {
  const reduceMotion = useReducedMotion() ?? false
  const insets = usePageInsets()
  const [geometry, setGeometry] = useState<LineGeometry>(() => ({
    column: null,
    viewportWidth: window.innerWidth,
  }))
  const [leaving, setLeaving] = useState(false)
  const onDoneRef = useRef(onDone)

  // Keep the latest callback without restarting the timers on every parent render.
  useEffect(() => {
    onDoneRef.current = onDone
  }, [onDone])

  // Measure the column before paint, and again whenever the window or layout mode changes.
  useLayoutEffect(() => {
    const measure = () => {
      const rect = columnRef.current?.getBoundingClientRect()
      setGeometry({
        column: rect ? { left: rect.left, right: rect.right } : null,
        viewportWidth: window.innerWidth,
      })
    }
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('orientationchange', measure)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('orientationchange', measure)
    }
  }, [columnRef, insets.mode])

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

  const placement = linePlacement(geometry, insets, insets.mode === 'desktop')

  return (
    <div
      style={{
        position: 'fixed',
        ...placement.wrapper,
        zIndex: Z.sceneTop + 1,
        pointerEvents: 'none',
      }}
    >
      <motion.div
        data-testid="memory-line"
        initial={reduceMotion ? false : { opacity: 0, x: -8 }}
        animate={{ opacity: leaving ? 0 : 1, x: 0 }}
        transition={{
          duration: reduceMotion ? 0 : leaving ? MEMORY_FADE_OUT_S : MEMORY_FADE_IN_S,
          ease: MEMORY_EASE,
        }}
        style={{
          ...placement.box,
          gap: 10,
          padding: '7px 16px 7px 12px',
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
            textAlign: placement.textAlign,
          }}
        >
          {text}
        </span>
      </motion.div>
    </div>
  )
}
