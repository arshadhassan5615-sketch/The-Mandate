import { useState, useEffect, useRef } from 'react'
import { useGameStore } from '../stores/gameStore'
import { useWeekStore } from '../stores/weekStore'
import { useNewsStore } from '../stores/newsStore'
import { useIsMobile } from '../hooks/useIsMobile'
import { Z } from '../constants/zIndex'
import type { PlayerAppearance } from '../types/gameState'
import katerinImg from '../assets/potraits/katerin_ashavel.jpeg'

const APPEARANCE_FILTERS: Record<PlayerAppearance, string> = {
  Professional:  'none',
  Austere:       'saturate(0.7) contrast(1.15)',
  Approachable:  'sepia(0.1) brightness(1.08) saturate(1.1)',
  Military:      'saturate(0.6) brightness(0.92) contrast(1.2) hue-rotate(-5deg)',
}

const ACT_LABELS: Record<number, string> = {
  1: 'Act I',
  2: 'Act II',
  3: 'Act III',
  4: 'Act IV',
  5: 'Act V',
  6: 'Act VI',
  7: 'Act VII',
}

// ─── Chrome tokens ─────────────────────────────────────────────────────────────

const FRAME_WIDTH = 96
const FRAME_HEIGHT = 104
const RING_BG = '#14110d'
const GOLD_LINE = '#b59a5e'
const GOLD_LIT = '#c9a84c'
const GOLD_ICON = '#d9c48a'
const CREAM = '#e6dcc3'
const SERIF_DISPLAY = "'Playfair Display', serif"

const STRESS_HIGH = 80
const STRESS_MID = 50

function stressColor(level: number): string {
  if (level > STRESS_HIGH) return '#e05c4a'
  if (level > STRESS_MID) return '#c9a84c'
  return '#7fa65a'
}

function stressGlow(level: number): string {
  if (level > STRESS_HIGH) return 'rgba(224,92,74,0.6)'
  if (level > STRESS_MID) return 'rgba(201,168,76,0.4)'
  return 'rgba(127,166,90,0.3)'
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
    </svg>
  )
}

export default function KaterinHUD() {
  const appearance = useGameStore(s => s.playerAppearance)
  const currentAct = useGameStore(s => s.currentAct)
  const stressLevel = useGameStore(s => s.personal.stressLevel)
  const phase = useWeekStore(s => s.phase)
  const newsOpen = useNewsStore(s => s.isOpen)

  const isMobile = useIsMobile()

  const [isIdentityOpen, setIsIdentityOpen] = useState(false)

  // Stress-change flash: rising stress flashes red (negative), falling stress
  // flashes green (positive). Applied to the stress bar fill as a glow burst
  // since there is no longer a text label to carry a colour keyframe.
  const [stressFlash, setStressFlash] = useState<'positive' | 'negative' | null>(null)
  const prevStress = useRef(stressLevel)

  useEffect(() => {
    if (stressLevel !== prevStress.current) {
      setStressFlash(stressLevel > prevStress.current ? 'negative' : 'positive')
      const t = setTimeout(() => setStressFlash(null), 600)
      prevStress.current = stressLevel
      return () => clearTimeout(t)
    }
  }, [stressLevel])

  // Hide during full-screen narrative phases and while the newspaper overlay is open
  // (NewsOverlay zIndex 200 is below this HUD's 250, so chrome must unmount — not stack).
  if (phase === 'agenda' || phase === 'scene' || newsOpen) return null
  if (isMobile) return null

  const flashGlow = stressFlash === 'negative'
    ? '0 0 10px 2px rgba(224,92,74,0.9)'
    : '0 0 10px 2px rgba(127,166,90,0.9)'
  const actLabel = ACT_LABELS[currentAct] ?? 'Act I'

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      zIndex: Z.katerinHud,
    }}>
      {/* Identity popover — opened by the person button */}
      {isIdentityOpen && (
        <div
          role="dialog"
          aria-label="Chancellor details"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 12px)',
            left: 0,
            minWidth: '176px',
            background: RING_BG,
            border: '1px solid #6b5a34',
            borderRadius: '3px',
            boxShadow: `0 4px 16px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(181,154,94,0.15)`,
            padding: '10px 14px',
            fontFamily: SERIF_DISPLAY,
          }}
        >
          <div style={{ fontSize: '0.55rem', letterSpacing: '0.2em', color: GOLD_LIT, textTransform: 'uppercase', lineHeight: 1 }}>
            {actLabel}
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: CREAM, lineHeight: 1.2, margin: '5px 0 3px' }}>
            Katerin Ashavel
          </div>
          <div style={{ fontSize: '0.55rem', letterSpacing: '0.15em', color: '#b8ad95', textTransform: 'uppercase', lineHeight: 1 }}>
            Chancellor
          </div>
        </div>
      )}

      {/* Square framed portrait */}
      <div style={{
        position: 'relative',
        width: FRAME_WIDTH,
        height: FRAME_HEIGHT,
        boxSizing: 'border-box',
        background: RING_BG,
        border: `3px solid ${RING_BG}`,
        boxShadow: `inset 0 0 0 1px ${GOLD_LINE}, 0 4px 16px rgba(0,0,0,0.5)`,
        padding: '4px',
      }}>
        <img
          src={katerinImg}
          alt="Chancellor Katerin Ashavel"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
            display: 'block',
            filter: APPEARANCE_FILTERS[appearance],
            transition: 'filter 0.4s ease',
          }}
        />

        {/* Stress bar along the frame's bottom edge */}
        <div
          role="progressbar"
          aria-label="Stress"
          aria-valuenow={stressLevel}
          aria-valuemin={0}
          aria-valuemax={100}
          title={`Stress ${stressLevel}%`}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'rgba(0,0,0,0.4)',
          }}
        >
          <div style={{
            width: `${stressLevel}%`,
            height: '100%',
            background: stressColor(stressLevel),
            boxShadow: stressFlash ? flashGlow : `0 0 6px ${stressGlow(stressLevel)}`,
            opacity: stressFlash ? 1 : 0.9,
            transition: 'width 0.5s ease, background 0.5s ease, box-shadow 0.3s ease, opacity 0.3s ease',
          }} />
        </div>

        {/* Person button — toggles the identity popover */}
        <button
          type="button"
          aria-label="Chancellor details"
          aria-expanded={isIdentityOpen}
          title="Chancellor details"
          onClick={() => setIsIdentityOpen(prev => !prev)}
          style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            width: '40px',
            height: '40px',
            padding: 0,
            borderRadius: '50%',
            background: RING_BG,
            border: `1.5px solid ${isIdentityOpen ? GOLD_LIT : GOLD_LINE}`,
            boxShadow: isIdentityOpen ? '0 0 14px rgba(201,168,76,0.4)' : '0 2px 8px rgba(0,0,0,0.5)',
            color: GOLD_ICON,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          }}
        >
          <PersonIcon />
        </button>
      </div>
    </div>
  )
}
