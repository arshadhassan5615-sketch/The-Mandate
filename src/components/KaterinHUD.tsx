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

const PORTRAIT_SIZE = 60
const FRAME_SIZE    = PORTRAIT_SIZE + 10   // frame ring padding

function MiniOrnateFrame({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: 'relative',
      width: FRAME_SIZE,
      height: FRAME_SIZE,
      flexShrink: 0,
      borderRadius: '50%',
      padding: '3px',
      background: 'linear-gradient(135deg, rgba(201,168,76,0.9) 0%, rgba(160,120,40,0.6) 50%, rgba(201,168,76,0.9) 100%)',
      boxShadow: '0 0 16px rgba(201,168,76,0.4), 0 0 32px rgba(201,168,76,0.15), inset 0 0 8px rgba(0,0,0,0.4)',
    }}>
      <div style={{
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        overflow: 'hidden',
        border: '1.5px solid rgba(201,168,76,0.4)',
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.6)',
      }}>
        {children}
      </div>
    </div>
  )
}

export default function KaterinHUD() {
  const appearance = useGameStore(s => s.playerAppearance)
  const currentAct = useGameStore(s => s.currentAct)
  const stressLevel = useGameStore(s => s.personal.stressLevel)
  const phase = useWeekStore(s => s.phase)
  const newsOpen = useNewsStore(s => s.isOpen)

  const isMobile = useIsMobile()

  // Stress-change flash: rising stress flashes red (negative), falling stress
  // flashes green (positive). Applied to the stress section container so the
  // label text carries the flash — the color keyframes need text to show.
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

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      zIndex: Z.katerinHud,
      display: 'flex',
      alignItems: 'center',
      gap: '0.8rem',
      background: 'linear-gradient(180deg, rgba(18,16,12,0.85) 0%, rgba(10,8,6,0.95) 100%)',
      border: '1px solid rgba(201,168,76,0.2)',
      borderRadius: '4px',
      padding: '8px 16px 8px 8px',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,220,160,0.05)',
      fontFamily: "'IBM Plex Mono', monospace",
    }}>
      <MiniOrnateFrame>
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
      </MiniOrnateFrame>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={{ 
          fontSize: '0.55rem', letterSpacing: '0.2em', color: '#c9a84c', 
          textTransform: 'uppercase', lineHeight: 1, textShadow: '0 0 8px rgba(201,168,76,0.3)' 
        }}>
          {ACT_LABELS[currentAct] ?? 'Act I'}
        </span>
        <span style={{ 
          fontFamily: "'Playfair Display', serif", fontSize: '1rem', fontWeight: 600,
          color: '#e8dcc8', lineHeight: 1, textShadow: '0 0 10px rgba(201,168,76,0.2)' 
        }}>
          Katerin Ashavel
        </span>
        <span style={{ 
          fontSize: '0.5rem', letterSpacing: '0.15em', color: 'rgba(220,210,190,0.5)', 
          textTransform: 'uppercase', lineHeight: 1 
        }}>
          Chancellor
        </span>
        <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px',
          animation: stressFlash ? `stat-flash-${stressFlash} 0.6s ease-out` : undefined }}>
          <span style={{ fontSize: '0.45rem', letterSpacing: '0.15em', color: 'rgba(220,210,190,0.4)', textTransform: 'uppercase', lineHeight: 1 }}>
            Stress
          </span>
          <div style={{ width: '60px', height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              width: `${stressLevel}%`,
              height: '100%',
              background: stressLevel > 80 ? '#e05c4a' : stressLevel > 50 ? '#c9a84c' : '#7fa65a',
              boxShadow: `0 0 6px ${stressLevel > 80 ? 'rgba(224,92,74,0.6)' : stressLevel > 50 ? 'rgba(201,168,76,0.4)' : 'rgba(127,166,90,0.3)'}`,
              transition: 'width 0.5s ease, background 0.5s ease',
            }} />
          </div>
        </div>
      </div>
    </div>
  )
}
