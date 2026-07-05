import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../stores/gameStore'
import { useWeekStore } from '../stores/weekStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import type { PlayerBackground, PlayerPersonality, PlayerAppearance, StateModifier } from '../types/gameState'
import katerinImg from '../assets/potraits/katerin_ashavel.jpeg'

// ─── Background effect data ───────────────────────────────────────────────────

type BackgroundFx = {
  label: string
  description: string
  modifiers: StateModifier[]
  flags: string[]
  advisorTrustMods: { key: 'theron' | 'soraya' | 'dusek'; value: number }[]
}

const BACKGROUND_FX: Record<PlayerBackground, BackgroundFx> = {
  Academic: {
    label: 'Academic',
    description: "Former professor at the University of Ashenmere. Your reputation among intellectuals and the press is impeccable. Aldric Theron, your academic rival turned advisor, trusts you deeply.",
    modifiers: [
      { stat: 'factions.reformists',   operation: 'add', value: 10 },
      { stat: 'nation.pressFreedom',   operation: 'add', value: 5  },
    ],
    flags: ['background_academic'],
    advisorTrustMods: [{ key: 'theron', value: 70 }],
  },
  Activist: {
    label: 'Street Activist',
    description: "You organized the Kravenstal textile workers in 1952 and marched in the Silent Clearances protests in Dravenhollow. Soraya Metsk, union president, considers you family.",
    modifiers: [
      { stat: 'factions.workersCoalition', operation: 'add', value: 10 },
      { stat: 'nation.publicOrder',        operation: 'add', value: 5  },
    ],
    flags: ['background_activist'],
    advisorTrustMods: [{ key: 'soraya', value: 60 }],
  },
  Lawyer: {
    label: 'Lawyer',
    description: "Constitutional attorney who argued three landmark civil liberties cases before the old courts. The law is your architecture. You know where every clause is buried.",
    modifiers: [
      { stat: 'nation.civilLiberties',       operation: 'add', value: 5 },
      { stat: 'nation.internationalStanding', operation: 'add', value: 5 },
    ],
    flags: ['background_lawyer', 'legal_knowledge'],
    advisorTrustMods: [],
  },
  MilitaryFamily: {
    label: 'Military Family',
    description: "Your father served under Halvek before becoming a dissident. You grew up knowing ranks, protocols, and exactly when soldiers listen — and when they don't. Colonel Dusek respects that.",
    modifiers: [
      { stat: 'factions.ironCovenant',    operation: 'add', value: 10 },
      { stat: 'nation.militaryReadiness', operation: 'add', value: 5  },
    ],
    flags: ['background_military_family'],
    advisorTrustMods: [{ key: 'dusek', value: 65 }],
  },
}

const PERSONALITY_DESC: Record<PlayerPersonality, string> = {
  Measured:  'You choose your words carefully. Calm diplomatic options appear more often. Opponents underestimate you — once.',
  Passionate: 'You speak from conviction. Emotionally resonant options unlock in critical moments. People know where you stand.',
  Cunning:   'You play the long game. Manipulation and strategic deception options are available. Trust, once spent, rarely returns.',
}

const BACKGROUNDS:   PlayerBackground[]  = ['Academic', 'Activist', 'Lawyer', 'MilitaryFamily']
const PERSONALITIES: PlayerPersonality[] = ['Measured', 'Passionate', 'Cunning']
const APPEARANCES:   PlayerAppearance[]  = ['Professional', 'Austere', 'Approachable', 'Military']

function cycle<T>(arr: T[], cur: T, dir: 1 | -1): T {
  const i = arr.indexOf(cur)
  return arr[(i + dir + arr.length) % arr.length]
}

// ─── Appearance CSS filters ────────────────────────────────────────────────────

const APPEARANCE_FILTERS: Record<PlayerAppearance, string> = {
  Professional:  'none',
  Austere:       'saturate(0.3) contrast(1.3) brightness(0.85)',
  Approachable:  'saturate(1.4) brightness(1.12) sepia(0.15)',
  Military:      'saturate(0.5) contrast(1.4) brightness(0.8) hue-rotate(-10deg)',
}

const APPEARANCE_HINTS: Record<PlayerAppearance, string> = {
  Professional:  'Your composed bearing commands immediate respect. Officials treat you as a peer from the first meeting.',
  Austere:       'You project severity over warmth. Opponents hesitate before testing you. Allies know not to waste your time.',
  Approachable:  "People underestimate how much you're listening. Characters open up faster. You hear things others don't.",
  Military:      'Your bearing reads as strength first, politician second. The military establishment grants you early credibility.',
}

function PortraitContent({ appearance }: { appearance: PlayerAppearance }) {
  return (
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
  )
}

function OrnateFrame({ children }: { children: React.ReactNode }) {
  const A = '#c8902a'
  const AD = '#8a621c'
  return (
    <div style={{ position: 'relative', width: 252, height: 252, flexShrink: 0 }}>
      {/* Ornate SVG ring overlay */}
      <svg
        viewBox="0 0 252 252"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}
      >
        <circle cx="126" cy="126" r="124" fill="none" stroke={AD}  strokeWidth="1"/>
        <circle cx="126" cy="126" r="120" fill="none" stroke={A}   strokeWidth="2.5"/>
        <circle cx="126" cy="126" r="116" fill="none" stroke={AD}  strokeWidth="0.5"/>
        {/* Cardinal diamonds */}
        <polygon points="126,4  131,9  126,14 121,9"  fill={A}/>
        <polygon points="248,126 243,131 238,126 243,121" fill={A}/>
        <polygon points="126,248 131,243 126,238 121,243" fill={A}/>
        <polygon points="4,126  9,131 14,126  9,121"  fill={A}/>
        {/* Inter-cardinal dots */}
        <circle cx="214" cy="38"  r="2.5" fill={AD}/>
        <circle cx="214" cy="214" r="2.5" fill={AD}/>
        <circle cx="38"  cy="214" r="2.5" fill={AD}/>
        <circle cx="38"  cy="38"  r="2.5" fill={AD}/>
        {/* Fine inner ring */}
        <circle cx="126" cy="126" r="112" fill="none" stroke={A} strokeWidth="0.75" opacity="0.4"/>
      </svg>
      {/* Portrait circle */}
      <div style={{
        position: 'absolute', top: 8, left: 8, right: 8, bottom: 8,
        borderRadius: '50%', overflow: 'hidden',
        border: `3px solid ${A}`, zIndex: 1,
        boxShadow: `0 0 20px rgba(200,144,42,0.15), inset 0 0 15px rgba(0,0,0,0.3)`,
      }}>
        {children}
      </div>
    </div>
  )
}

// ─── Cycle control ────────────────────────────────────────────────────────────

function CycleControl({ label, value, onPrev, onNext }: {
  label: string; value: string; onPrev: () => void; onNext: () => void
}) {
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <div style={{
        fontFamily: "'Special Elite', monospace",
        fontSize: '0.62rem', letterSpacing: '0.2em',
        color: 'var(--muted)', textTransform: 'uppercase',
        marginBottom: '0.35rem',
      }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
        <ArrowBtn onClick={onPrev}>◀</ArrowBtn>
        <span style={{
          fontFamily: "'IM Fell English', Georgia, serif",
          fontSize: '1rem', color: 'var(--cream)',
          flex: 1, textAlign: 'center', letterSpacing: '0.02em',
        }}>
          {value}
        </span>
        <ArrowBtn onClick={onNext}>▶</ArrowBtn>
      </div>
    </div>
  )
}

function ArrowBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent', border: '1px solid var(--border)',
        color: 'var(--amber)', width: 28, height: 28, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'serif', fontSize: '0.85rem', flexShrink: 0,
        transition: 'border-color 0.15s, color 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--amber)'; e.currentTarget.style.background = 'var(--amber-glow)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent' }}
    >
      {children}
    </button>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CharacterCustomization() {
  const [appearance,  setAppearance]  = useState<PlayerAppearance>('Professional')
  const [background,  setBackground]  = useState<PlayerBackground>('Academic')
  const [personality, setPersonality] = useState<PlayerPersonality>('Measured')

  const hasBegunRef = useRef(false)
  useEffect(() => {
    if (hasBegunRef.current) return
    hasBegunRef.current = true
    runBeginLogic()
  }, [])

  const applyModifiers  = useGameStore(s => s.applyModifiers)
  const setPlayerOptions = useGameStore(s => s.setPlayerOptions)
  const addFlags        = useNarrativeStore(s => s.addFlags)
  const startCinematic   = useWeekStore(s => s.startCinematic)

  function runBeginLogic() {
    setPlayerOptions({ background, personality, appearance })

    const fx = BACKGROUND_FX[background]
    // Apply background stat modifiers
    const mods: StateModifier[] = [...fx.modifiers]
    // Override advisor trust for chosen background
    for (const t of fx.advisorTrustMods) {
      mods.push({ stat: `advisorTrust.${t.key}`, operation: 'set', value: t.value })
    }
    applyModifiers(mods)
    addFlags([...fx.flags, `personality_${personality.toLowerCase()}`])

    startCinematic()
  }

  function handleBegin() {
    runBeginLogic()
  }

  const fx = BACKGROUND_FX[background]

  return null
}

function StampCorner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const style: React.CSSProperties = {
    position: 'absolute', width: 7, height: 7, opacity: 0.55,
    top:    pos.startsWith('t') ? 4 : undefined,
    bottom: pos.startsWith('b') ? 4 : undefined,
    left:   pos.endsWith('l')   ? 4 : undefined,
    right:  pos.endsWith('r')   ? 4 : undefined,
    borderTop:    pos.startsWith('t') ? '1px solid var(--amber)' : undefined,
    borderBottom: pos.startsWith('b') ? '1px solid var(--amber)' : undefined,
    borderLeft:   pos.endsWith('l')   ? '1px solid var(--amber)' : undefined,
    borderRight:  pos.endsWith('r')   ? '1px solid var(--amber)' : undefined,
  }
  return <span style={style}/>
}
