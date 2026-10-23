import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Z } from '../../constants/zIndex'
import {
  CINEMA_FADE_IN_S,
  CINEMA_FADE_OUT_S,
  CINEMA_SKIP_FADE_S,
  CINEMA_ZOOM_SCALE,
  CINEMA_EASE,
  zoomDurationS,
  secondsToMs,
} from './cinematic'

const SKIP_KEYS = [' ', 'Enter', 'Escape']

interface CinematicPlateProps {
  image: string
  /** Time the image stays fully visible, after the fade-in. */
  holdMs: number
  /** Called once, after the plate has faded out. */
  onDone: () => void
}

/**
 * Full-screen painting shown on its own: fades in from black, drifts with a slow
 * zoom, then fades out and calls `onDone`. Click, Space, Enter or Escape skips
 * with a quick fade. Keys are consumed in the capture phase so they never reach
 * the page underneath.
 */
export default function CinematicPlate({ image, holdMs, onDone }: CinematicPlateProps) {
  const reduceMotion = useReducedMotion() ?? false
  const [leaving, setLeaving] = useState<'natural' | 'skip' | null>(null)
  const onDoneRef = useRef(onDone)
  const doneRef = useRef(false)

  useEffect(() => {
    onDoneRef.current = onDone
  }, [onDone])

  const finish = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    onDoneRef.current()
  }, [])

  const leave = useCallback((how: 'natural' | 'skip') => {
    if (reduceMotion) {
      finish()
      return
    }
    setLeaving(how)
  }, [reduceMotion, finish])

  // Natural end: fade-in plus hold, then start leaving.
  useEffect(() => {
    if (leaving !== null) return
    const delayMs = reduceMotion ? holdMs : secondsToMs(CINEMA_FADE_IN_S) + holdMs
    const timer = window.setTimeout(() => leave('natural'), delayMs)
    return () => window.clearTimeout(timer)
  }, [leaving, holdMs, reduceMotion, leave])

  // Fade-out finished: hand control back to the page.
  useEffect(() => {
    if (leaving === null) return
    const timer = window.setTimeout(
      finish,
      secondsToMs(leaving === 'skip' ? CINEMA_SKIP_FADE_S : CINEMA_FADE_OUT_S),
    )
    return () => window.clearTimeout(timer)
  }, [leaving, finish])

  useEffect(() => {
    if (leaving !== null) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!SKIP_KEYS.includes(e.key)) return
      e.preventDefault()
      e.stopImmediatePropagation()
      if (!e.repeat) leave('skip')
    }
    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [leaving, leave])

  const rootFadeS = reduceMotion
    ? 0
    : leaving === 'skip'
      ? CINEMA_SKIP_FADE_S
      : leaving === 'natural'
        ? CINEMA_FADE_OUT_S
        : CINEMA_FADE_IN_S

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Ending"
      data-testid="cinematic-plate"
      data-leaving={leaving === null ? 'false' : 'true'}
      onClick={leaving === null ? () => leave('skip') : undefined}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: leaving === null ? 1 : 0 }}
      transition={{ duration: rootFadeS, ease: CINEMA_EASE }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z.modalRaised,
        background: '#050505',
        cursor: 'pointer',
        overflow: 'hidden',
        pointerEvents: leaving === null ? 'auto' : 'none',
      }}
    >
      <motion.img
        src={image}
        alt=""
        initial={{ scale: 1 }}
        animate={reduceMotion ? { scale: 1 } : { scale: CINEMA_ZOOM_SCALE }}
        transition={{ duration: reduceMotion ? 0 : zoomDurationS(holdMs), ease: 'linear' }}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.8) 100%)',
        }}
      />
    </motion.div>
  )
}
