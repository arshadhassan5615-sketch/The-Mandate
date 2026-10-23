import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useNarrativeStore } from '../../stores/narrativeStore'
import { useViewportMode, type ViewportMode } from '../../hooks/useViewportMode'
import { cutsceneVariants, getCutsceneArt } from '../../assets/cutscenes'
import { getLocationArt } from '../../assets/locationArt'
import establishingShots from '../../data/locations/establishingShots.json'
import { useCabinetStore } from '../../stores/cabinetStore'
import { useGameStore } from '../../stores/gameStore'
import { Z } from '../../constants/zIndex'
import {
  buildIntroQueue,
  matchEstablishingShot,
  type IntroCard,
  type IntroDeps,
} from './introQueue'
import { establishingShownWeek } from './establishingMemory'
import {
  CINEMA_FADE_IN_S,
  CINEMA_FADE_OUT_S,
  CINEMA_SKIP_FADE_S,
  CINEMA_ZOOM_SCALE,
  CINEMA_EASE,
  cardDwellMs,
  zoomDurationS,
  secondsToMs,
} from './cinematic'

const REAL_DEPS: IntroDeps = {
  art: getCutsceneArt,
  establishing: location => {
    const shot = matchEstablishingShot(location, establishingShots)
    const url = shot === null ? null : getLocationArt(shot.image)
    return shot === null || url === null ? null : { image: url, label: shot.label }
  },
  minister: ministry => useCabinetStore.getState().getMinister(ministry)?.id ?? null,
  variants: cutsceneVariants,
}

const TEXT_DELAY_S = CINEMA_FADE_IN_S * 0.6
const TEXT_FADE_S = 1.2
const CARD_GAP_DELAY_S = CINEMA_FADE_OUT_S * 0.5
const LETTERBOX = '7vh'
const CREAM = '#e8dcc0'
const GOLD = '#c9a84c'
const MONO = "'IBM Plex Mono', monospace"
const DISPLAY = "'Playfair Display', serif"
const FELL = "'IM Fell English', serif"

interface CardProps {
  card: IntroCard
  reduceMotion: boolean
}

function CinemaOverlay() {
  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.85) 100%)',
        }}
      />
      <div aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: LETTERBOX, background: '#000' }} />
      <div aria-hidden="true" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: LETTERBOX, background: '#000' }} />
    </>
  )
}

function StillCard({ card, reduceMotion }: CardProps) {
  if (card.kind !== 'still') return null
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <motion.img
        src={card.image}
        alt=""
        initial={{ scale: 1 }}
        animate={reduceMotion ? { scale: 1 } : { scale: CINEMA_ZOOM_SCALE }}
        transition={{ duration: reduceMotion ? 0 : zoomDurationS(card.durationMs), ease: 'linear' }}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <CinemaOverlay />
      {card.caption && (
        <motion.p
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: reduceMotion ? 0 : TEXT_DELAY_S,
            duration: reduceMotion ? 0 : TEXT_FADE_S,
            ease: CINEMA_EASE,
          }}
          style={{
            position: 'absolute', left: 0, right: 0, margin: '0 auto',
            bottom: `calc(${LETTERBOX} + 16px)`,
            width: 'min(760px, 88vw)',
            textAlign: 'center',
            fontFamily: FELL,
            fontStyle: 'italic',
            fontSize: 'clamp(0.95rem, 2.6vh + 0.4vw, 1.5rem)',
            color: CREAM,
            textShadow: '0 2px 6px rgba(0,0,0,0.9)',
          }}
        >
          {card.caption}
        </motion.p>
      )}
    </div>
  )
}

function EstablishingCard({ card, reduceMotion }: CardProps) {
  if (card.kind !== 'establishing') return null
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <motion.img
        src={card.image}
        alt=""
        initial={{ scale: 1 }}
        animate={reduceMotion ? { scale: 1 } : { scale: CINEMA_ZOOM_SCALE }}
        transition={{ duration: reduceMotion ? 0 : zoomDurationS(card.durationMs), ease: 'linear' }}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <CinemaOverlay />
      <motion.div
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          delay: reduceMotion ? 0 : TEXT_DELAY_S,
          duration: reduceMotion ? 0 : TEXT_FADE_S,
          ease: CINEMA_EASE,
        }}
        style={{
          position: 'absolute', left: '6vw', bottom: `calc(${LETTERBOX} + 3vh)`,
          maxWidth: 'min(640px, 88vw)',
          textShadow: '0 2px 8px rgba(0,0,0,0.9)',
        }}
      >
        {card.detail !== undefined && (
          <div style={{ fontFamily: MONO, fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: GOLD }}>
            {card.detail}
          </div>
        )}
        <div
          style={{
            fontFamily: DISPLAY, fontWeight: 600, fontSize: 'clamp(1.2rem, 4vh, 2rem)',
            color: CREAM, marginTop: card.detail !== undefined ? '6px' : 0,
          }}
        >
          {card.label}
        </div>
      </motion.div>
    </div>
  )
}

function SkipHint({ mode }: { mode: ViewportMode }) {
  const text = mode === 'desktop' ? 'Space — continue · Esc — skip' : 'Tap to continue'
  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(14px + env(safe-area-inset-top, 0px))',
        right: 'calc(14px + env(safe-area-inset-right, 0px))',
        zIndex: 3,
        fontFamily: MONO,
        fontSize: '10px',
        textTransform: 'uppercase',
        letterSpacing: '0.2em',
        color: 'rgba(232,220,192,0.45)',
        pointerEvents: 'none',
      }}
    >
      {text}
    </div>
  )
}

/**
 * Skippable cinematic shown when a scene starts: painted stills from the
 * scene JSON, or a location establishing shot when the scene has no stills.
 * Stills and establishing shots fade in and zoom slowly, and the overlay fades
 * out at the end instead of vanishing. Consumes Space/Enter/Escape in the
 * capture phase so the dialogue underneath never sees those keys while the
 * intro is on screen.
 */
export default function SceneIntro() {
  const currentScene = useNarrativeStore(s => s.currentScene)
  const sceneId = currentScene?.id ?? null
  const mode = useViewportMode()
  const reduceMotion = useReducedMotion() ?? false

  const [queue, setQueue] = useState<IntroCard[]>([])
  const [index, setIndex] = useState(0)
  const [closing, setClosing] = useState<'natural' | 'skip' | null>(null)
  const lastSceneIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (sceneId === lastSceneIdRef.current) return
    lastSceneIdRef.current = sceneId
    const { currentScene: scene } = useNarrativeStore.getState()
    const week = useGameStore.getState().currentWeek
    const shot = scene === null ? null : matchEstablishingShot(scene.location, establishingShots)
    const allowEstablishing = shot !== null && establishingShownWeek.get(shot.image) !== week
    const nextQueue = buildIntroQueue(scene, REAL_DEPS, { allowEstablishing })
    if (shot !== null && nextQueue.some(c => c.kind === 'establishing')) {
      establishingShownWeek.set(shot.image, week)
    }
    setQueue(nextQueue)
    setIndex(0)
    setClosing(null)
  }, [sceneId])

  const card = queue[index] ?? null
  const total = queue.length

  const clearIntro = useCallback(() => {
    setQueue([])
    setIndex(0)
    setClosing(null)
  }, [])

  const finish = useCallback((how: 'natural' | 'skip') => {
    if (reduceMotion) {
      clearIntro()
      return
    }
    setClosing(how)
  }, [reduceMotion, clearIntro])

  const advance = useCallback(() => {
    if (index + 1 >= total) {
      finish('natural')
      return
    }
    setIndex(index + 1)
  }, [index, total, finish])

  useEffect(() => {
    if (closing === null) return
    const timer = window.setTimeout(
      clearIntro,
      secondsToMs(closing === 'skip' ? CINEMA_SKIP_FADE_S : CINEMA_FADE_OUT_S),
    )
    return () => window.clearTimeout(timer)
  }, [closing, clearIntro])

  useEffect(() => {
    if (!card || closing !== null) return
    const timer = window.setTimeout(advance, cardDwellMs(card.durationMs, reduceMotion))
    return () => window.clearTimeout(timer)
  }, [card, advance, closing, reduceMotion])

  useEffect(() => {
    if (!card || closing !== null) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopImmediatePropagation()
        finish('skip')
        return
      }
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        e.stopImmediatePropagation()
        if (!e.repeat) advance()
      }
    }
    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [card, advance, finish, closing])

  if (!card) return null

  const rootFadeS = reduceMotion
    ? 0
    : closing === 'skip'
      ? CINEMA_SKIP_FADE_S
      : closing === 'natural'
        ? CINEMA_FADE_OUT_S
        : CINEMA_FADE_IN_S * 0.5

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Scene introduction"
      data-testid="scene-intro"
      data-kind={card.kind}
      data-closing={closing === null ? 'false' : 'true'}
      onClick={closing === null ? advance : undefined}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: closing === null ? 1 : 0 }}
      transition={{ duration: rootFadeS, ease: CINEMA_EASE }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z.modalRaised,
        background: '#050505',
        cursor: 'pointer',
        overflow: 'hidden',
        pointerEvents: closing === null ? 'auto' : 'none',
      }}
    >
      <SkipHint mode={mode} />
      <AnimatePresence>
        <motion.div
          key={index}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{
            opacity: 1,
            transition: {
              duration: reduceMotion ? 0 : CINEMA_FADE_IN_S,
              delay: reduceMotion || index === 0 ? 0 : CARD_GAP_DELAY_S,
              ease: CINEMA_EASE,
            },
          }}
          exit={{
            opacity: 0,
            transition: { duration: reduceMotion ? 0 : CINEMA_FADE_OUT_S, ease: CINEMA_EASE },
          }}
          style={{ position: 'absolute', inset: 0 }}
        >
          {card.kind === 'still' && <StillCard card={card} reduceMotion={reduceMotion} />}
          {card.kind === 'establishing' && <EstablishingCard card={card} reduceMotion={reduceMotion} />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
