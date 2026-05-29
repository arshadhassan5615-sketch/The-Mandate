import { useGameStore } from '../stores/gameStore'
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
}

const PORTRAIT_SIZE = 52
const FRAME_SIZE    = PORTRAIT_SIZE + 10   // frame ring padding

function MiniOrnateFrame({ children }: { children: React.ReactNode }) {
  const A  = '#c8902a'
  const AD = '#8a621c'
  const C  = FRAME_SIZE / 2
  const R  = C - 1
  return (
    <div style={{ position: 'relative', width: FRAME_SIZE, height: FRAME_SIZE, flexShrink: 0 }}>
      <svg
        viewBox={`0 0 ${FRAME_SIZE} ${FRAME_SIZE}`}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}
      >
        <circle cx={C} cy={C} r={R}   fill="none" stroke={AD} strokeWidth="0.75"/>
        <circle cx={C} cy={C} r={R-3} fill="none" stroke={A}  strokeWidth="1.5"/>
        <circle cx={C} cy={C} r={R-6} fill="none" stroke={AD} strokeWidth="0.5" opacity="0.5"/>
        <polygon points={`${C},1 ${C+3},4 ${C},7 ${C-3},4`} fill={A}/>
        <polygon points={`${C},${FRAME_SIZE-1} ${C+3},${FRAME_SIZE-4} ${C},${FRAME_SIZE-7} ${C-3},${FRAME_SIZE-4}`} fill={A}/>
      </svg>
      <div style={{
        position: 'absolute',
        top: 6, left: 6, right: 6, bottom: 6,
        borderRadius: '50%', overflow: 'hidden',
        border: `2px solid ${A}`,
        zIndex: 1,
        boxShadow: `0 0 12px rgba(200,144,42,0.12)`,
      }}>
        {children}
      </div>
    </div>
  )
}

export default function KaterinHUD() {
  const appearance = useGameStore(s => s.playerAppearance)
  const currentAct = useGameStore(s => s.currentAct)

  return (
    <div style={{
      position: 'fixed',
      bottom: 14,
      left: 14,
      zIndex: 150,
      display: 'flex',
      alignItems: 'center',
      gap: '0.6rem',
      background: 'rgba(15,13,10,0.88)',
      border: '1px solid rgba(200,144,42,0.2)',
      borderRadius: '2px',
      padding: '6px 12px 6px 6px',
      backdropFilter: 'blur(4px)',
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

      <div>
        <p style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: '0.52rem',
          letterSpacing: '0.12em',
          color: 'var(--amber)',
          textTransform: 'uppercase',
          lineHeight: 1,
          marginBottom: '0.2rem',
        }}>
          {ACT_LABELS[currentAct] ?? 'Act I'}
        </p>
        <p style={{
          fontFamily: "'IM Fell English', Georgia, serif",
          fontSize: '0.72rem',
          color: 'var(--cream)',
          lineHeight: 1.1,
          opacity: 0.8,
        }}>
          Katerin Ashavel
        </p>
        <p style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: '0.48rem',
          letterSpacing: '0.08em',
          color: 'var(--muted)',
          textTransform: 'uppercase',
          lineHeight: 1,
          marginTop: '0.15rem',
        }}>
          Chancellor
        </p>
      </div>
    </div>
  )
}
