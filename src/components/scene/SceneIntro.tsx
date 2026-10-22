import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useNarrativeStore } from '../../stores/narrativeStore'
import { useViewportMode, type ViewportMode } from '../../hooks/useViewportMode'
import { cutsceneVariants, getCutsceneArt } from '../../assets/cutscenes'
import { getPortrait } from '../../assets/potraits'
import { getLocationArt } from '../../assets/locationArt'
import establishingShots from '../../data/locations/establishingShots.json'
import { useCabinetStore } from '../../stores/cabinetStore'
import { useGameStore } from '../../stores/gameStore'
import { charName, speakerRole } from '../narrative/speakers'
import { PLAYER_ID } from '../narrative/participants'
import { Z } from '../../constants/zIndex'
import {
  buildIntroQueue,
  matchEstablishingShot,
  type IntroCard,
  type IntroDeps,
} from './introQueue'
import { establishingShownWeek } from './establishingMemory'

const REAL_DEPS: IntroDeps = {
  art: getCutsceneArt,
  establishing: location => {
    const shot = matchEstablishingShot(location, establishingShots)
    const url = shot === null ? null : getLocationArt(shot.image)
    return shot === null || url === null ? null : { image: url, label: shot.label }
  },
  minister: ministry => useCabinetStore.getState().getMinister(ministry)?.id ?? null,
  variants: cutsceneVariants,
  portrait: getPortrait,
  name: charName,
  role: speakerRole,
  playerId: PLAYER_ID,
}

const CARD_FADE_S = 0.6
const CAPTION_DELAY_S = 0.5
const ESTABLISHING_LABEL_DELAY_S = 0.3
const LETTERBOX = '7vh'
const CREAM = '#e8dcc0'
const GOLD = '#c9a84c'
const MONO = "'IBM Plex Mono', monospace"
const DISPLAY = "'Playfair Display', serif"
const FELL = "'IM Fell English', serif"

interface CardProps {
  card: IntroCard
  mode: ViewportMode
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

function StillCard({ card, reduceMotion }: Omit<CardProps, 'mode'>) {
  if (card.kind !== 'still') return null
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <motion.img
        src={card.image}
        alt=""
        initial={{ scale: 1 }}
        animate={reduceMotion ? { scale: 1 } : { scale: 1.08 }}
        transition={{ duration: card.durationMs / 1000, ease: 'linear' }}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <CinemaOverlay />
      {card.caption && (
        <motion.p
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduceMotion ? 0 : CAPTION_DELAY_S, duration: reduceMotion ? 0 : CARD_FADE_S }}
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

function EstablishingCard({ card, reduceMotion }: Omit<CardProps, 'mode'>) {
  if (card.kind !== 'establishing') return null
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <motion.img
        src={card.image}
        alt=""
        initial={{ scale: 1 }}
        animate={reduceMotion ? { scale: 1 } : { scale: 1.05 }}
        transition={{ duration: card.durationMs / 1000, ease: 'linear' }}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <CinemaOverlay />
      <motion.div
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduceMotion ? 0 : ESTABLISHING_LABEL_DELAY_S, duration: reduceMotion ? 0 : CARD_FADE_S }}
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

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(word => word.length > 0)
    .slice(0, 2)
    .map(word => word.charAt(0).toUpperCase())
    .join('')
}

function PortraitFrame({ name, portrait }: { name: string; portrait: string | null }) {
  const frameStyle = {
    width: 'clamp(110px, 32vh, 220px)',
    aspectRatio: '4 / 5',
    border: `1px solid ${GOLD}`,
    overflow: 'hidden',
    flexShrink: 0,
    position: 'relative' as const,
  }
  if (portrait === null) {
    return (
      <div style={{ ...frameStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: DISPLAY, fontSize: 'clamp(2rem, 8vh, 4rem)', color: GOLD }}>
          {initialsOf(name)}
        </span>
      </div>
    )
  }
  return (
    <div style={frameStyle}>
      <img
        src={portrait}
        alt={name}
        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
      />
    </div>
  )
}

function IntroductionCard({ card, mode, reduceMotion }: CardProps) {
  if (card.kind !== 'introduction') return null
  const isPhone = mode === 'phone'
  return (
    <div
      style={{
        position: 'absolute', inset: 0,
        display: 'flex',
        flexDirection: isPhone ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isPhone ? '20px' : '40px',
        padding: '0 6vw',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', top: '50%', left: '50%', pointerEvents: 'none',
          width: '90vh', height: '90vh', transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, rgba(201,168,76,0.22) 0%, rgba(201,168,76,0) 60%)`,
        }}
      />
      <motion.div
        initial={reduceMotion ? false : { x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.6, ease: 'easeOut' }}
        style={{ position: 'relative' }}
      >
        <PortraitFrame name={card.name} portrait={card.portrait} />
      </motion.div>
      <div style={{ position: 'relative', maxWidth: 420, textAlign: isPhone ? 'center' : 'left' }}>
        <div style={{ fontFamily: MONO, fontSize: '10px', letterSpacing: '0.3em', color: GOLD }}>
          FIRST MEETING
        </div>
        <h2
          style={{
            fontFamily: DISPLAY, fontWeight: 700, fontSize: 'clamp(1.6rem, 6vh, 3rem)',
            color: CREAM, margin: '8px 0 0', lineHeight: 1.1,
          }}
        >
          {card.name}
        </h2>
        <div style={{ width: '60px', height: '1px', background: GOLD, margin: isPhone ? '14px auto' : '14px 0' }} />
        {card.role !== undefined && (
          <p
            style={{
              fontFamily: FELL, fontStyle: 'italic', fontSize: 'clamp(0.9rem, 2.6vh, 1.25rem)',
              color: 'rgba(232,220,192,0.75)', margin: 0,
            }}
          >
            {card.role}
          </p>
        )}
      </div>
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
 * scene JSON, then first-meeting cards for one or two newly met characters.
 * Consumes Space/Enter/Escape in the capture phase so the dialogue underneath
 * never sees those keys while the intro is on screen.
 */
export default function SceneIntro() {
  const currentScene = useNarrativeStore(s => s.currentScene)
  const sceneId = currentScene?.id ?? null
  const mode = useViewportMode()
  const reduceMotion = useReducedMotion() ?? false

  const [queue, setQueue] = useState<IntroCard[]>([])
  const [index, setIndex] = useState(0)
  const lastSceneIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (sceneId === lastSceneIdRef.current) return
    lastSceneIdRef.current = sceneId
    const { currentScene: scene, newlyMetIds } = useNarrativeStore.getState()
    const week = useGameStore.getState().currentWeek
    const shot = scene === null ? null : matchEstablishingShot(scene.location, establishingShots)
    const allowEstablishing = shot !== null && establishingShownWeek.get(shot.image) !== week
    const nextQueue = buildIntroQueue(scene, newlyMetIds, REAL_DEPS, { allowEstablishing })
    if (shot !== null && nextQueue.some(c => c.kind === 'establishing')) {
      establishingShownWeek.set(shot.image, week)
    }
    setQueue(nextQueue)
    setIndex(0)
  }, [sceneId])

  const card = queue[index] ?? null
  const total = queue.length

  const finish = useCallback(() => {
    setQueue([])
    setIndex(0)
  }, [])

  const advance = useCallback(() => {
    if (index + 1 >= total) {
      finish()
      return
    }
    setIndex(index + 1)
  }, [index, total, finish])

  useEffect(() => {
    if (!card) return
    const timer = window.setTimeout(advance, card.durationMs)
    return () => window.clearTimeout(timer)
  }, [card, advance])

  useEffect(() => {
    if (!card) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopImmediatePropagation()
        finish()
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
  }, [card, advance, finish])

  if (!card) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Scene introduction"
      data-testid="scene-intro"
      data-kind={card.kind}
      onClick={advance}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z.modalRaised,
        background: '#050505',
        cursor: 'pointer',
        overflow: 'hidden',
      }}
    >
      <SkipHint mode={mode} />
      <AnimatePresence>
        <motion.div
          key={index}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : CARD_FADE_S }}
          style={{ position: 'absolute', inset: 0 }}
        >
          {card.kind === 'still' && <StillCard card={card} reduceMotion={reduceMotion} />}
          {card.kind === 'establishing' && <EstablishingCard card={card} reduceMotion={reduceMotion} />}
          {card.kind === 'introduction' && <IntroductionCard card={card} mode={mode} reduceMotion={reduceMotion} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
