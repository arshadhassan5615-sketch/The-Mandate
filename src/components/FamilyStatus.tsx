import { useState } from 'react'
import { useGameStore } from '../stores/gameStore'
import type { PersonalState } from '../types/gameState'

// ─── Mood definitions ─────────────────────────────────────────────────────────

interface Mood {
  label: string
  barColor: string
  textColor: string
}

const MOODS: (Mood & { max: number })[] = [
  { max: 20,  label: 'Distant',  barColor: '#7a2020', textColor: '#c87070' },
  { max: 40,  label: 'Strained', barColor: '#6a3018', textColor: '#b86040' },
  { max: 60,  label: 'Stable',   barColor: '#5a5018', textColor: '#a09030' },
  { max: 80,  label: 'Close',    barColor: '#3a5020', textColor: '#80a050' },
  { max: 100, label: 'Devoted',  barColor: '#245a20', textColor: '#50a840' },
]

function getMood(score: number): Mood {
  return MOODS.find(m => score <= m.max) ?? MOODS[MOODS.length - 1]
}

// ─── Member definitions ───────────────────────────────────────────────────────

interface FamilyMember {
  key: keyof PersonalState
  name: string
  role: string
  tooltips: Record<Mood['label'], string>
}

const MEMBERS: FamilyMember[] = [
  {
    key: 'marriageHealth',
    name: 'Jonas',
    role: 'Husband',
    tooltips: {
      Distant:  'Jonas has stopped asking how your day was. You have stopped noticing.',
      Strained: 'Something is wrong between you and neither of you has named it yet.',
      Stable:   'Your marriage holds. Quietly, carefully, like a building under load.',
      Close:    'Jonas is still your first thought in the morning. That means something.',
      Devoted:  'You are still each other\'s people. In everything you\'ve lost, this remains.',
    },
  },
  {
    key: 'lioraRelationship',
    name: 'Liora',
    role: 'Daughter, 19',
    tooltips: {
      Distant:  'Liora has stopped calling. You tell yourself she\'s busy at university.',
      Strained: 'She asks hard questions and you give careful answers. She notices.',
      Stable:   'She is proud of you, even when she disagrees. That pride is fragile.',
      Close:    'Liora sees you — not the Chancellor, but her mother. Hold on to that.',
      Devoted:  'She believes in what you\'re trying to do. Don\'t make her regret it.',
    },
  },
  {
    key: 'tomasWellbeing',
    name: 'Tomas',
    role: 'Son, 12',
    tooltips: {
      Distant:  'Tomas has retreated somewhere inside himself. You haven\'t found the way back.',
      Strained: 'He is angry in ways he doesn\'t have words for yet. Give him time. Give him you.',
      Stable:   'He is managing. Children manage. That isn\'t the same as thriving.',
      Close:    'He still runs to show you things. He still believes you have time.',
      Devoted:  'He thinks you hung the moon. That kind of faith is both gift and weight.',
    },
  },
]

// ─── Tooltip ──────────────────────────────────────────────────────────────────

interface TooltipState {
  member: FamilyMember
  mood: Mood
  y: number
}

function Tooltip({ member, mood, y }: TooltipState) {
  return (
    <div style={{
      position: 'fixed',
      left: 156,
      top: Math.max(60, Math.min(window.innerHeight - 120, y - 30)),
      background: 'rgba(10, 8, 6, 0.97)',
      border: '1px solid var(--border)',
      padding: '0.65rem 0.85rem',
      zIndex: 10001,
      width: '240px',
      pointerEvents: 'none',
    }}>
      <div style={{
        fontFamily: "'Special Elite', monospace",
        fontSize: '0.55rem',
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: mood.textColor,
        marginBottom: '0.25rem',
      }}>
        {member.name} — {mood.label}
      </div>
      <p style={{
        fontFamily: "'IM Fell English', Georgia, serif",
        fontSize: '0.8rem',
        color: 'var(--cream)',
        lineHeight: 1.65,
        fontStyle: 'italic',
      }}>
        "{member.tooltips[mood.label]}"
      </p>
    </div>
  )
}

// ─── Single member row ────────────────────────────────────────────────────────

interface MemberRowProps {
  member: FamilyMember
  score: number
  onHover: (state: TooltipState | null) => void
}

function MemberRow({ member, score, onHover }: MemberRowProps) {
  const mood = getMood(score)
  return (
    <div
      style={{ marginBottom: '0.9rem', cursor: 'default' }}
      onMouseEnter={e => onHover({
        member,
        mood,
        y: e.currentTarget.getBoundingClientRect().top + 10,
      })}
      onMouseLeave={() => onHover(null)}
    >
      {/* Name + role */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.25rem' }}>
        <span style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: '0.5rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--cream)',
          whiteSpace: 'nowrap',
        }}>
          {member.name}
        </span>
        <span style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: '0.42rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          whiteSpace: 'nowrap',
        }}>
          {member.role}
        </span>
      </div>

      {/* Bar track */}
      <div style={{
        height: '3px',
        background: 'rgba(200, 144, 42, 0.07)',
        position: 'relative',
        marginBottom: '0.2rem',
      }}>
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: `${score}%`,
          background: mood.barColor,
          transition: 'width 0.6s ease, background 0.4s ease',
        }} />
      </div>

      {/* Mood label */}
      <div style={{
        fontFamily: "'Special Elite', monospace",
        fontSize: '0.44rem',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: mood.textColor,
        transition: 'color 0.4s ease',
      }}>
        {mood.label}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function FamilyStatus() {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const personal = useGameStore(s => s.personal)

  return (
    <div style={{ padding: '1.2rem 0.85rem 1rem' }}>

      {/* Header */}
      <div style={{ marginBottom: '0.85rem' }}>
        <p style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: '0.52rem',
          letterSpacing: '0.2em',
          color: 'var(--amber-dim)',
          textTransform: 'uppercase',
          marginBottom: '0.4rem',
        }}>
          ▸ Family
        </p>
        <div style={{ height: '1px', background: 'var(--border)' }} />
      </div>

      {MEMBERS.map(member => (
        <MemberRow
          key={member.key}
          member={member}
          score={personal[member.key] as number}
          onHover={setTooltip}
        />
      ))}

      {tooltip && <Tooltip {...tooltip} />}
    </div>
  )
}
