import { useState } from 'react'
import { useGameStore } from '../stores/gameStore'
import type { FactionState } from '../types/gameState'

// ─── Level definitions ────────────────────────────────────────────────────────

interface Level {
  label: string
  barColor: string   // fill color for the bar
  textColor: string  // label text color
}

// Ordered from lowest to highest. Score <= max → use this level.
const LEVELS: (Level & { max: number })[] = [
  { max: 15,  label: 'Hostile',    barColor: '#7a2020', textColor: '#c87070' },
  { max: 30,  label: 'Cold',       barColor: '#6a3018', textColor: '#b86040' },
  { max: 45,  label: 'Wary',       barColor: '#5a4018', textColor: '#a08030' },
  { max: 55,  label: 'Neutral',    barColor: '#5a5018', textColor: '#a09030' },
  { max: 70,  label: 'Warm',       barColor: '#3a5020', textColor: '#80a050' },
  { max: 85,  label: 'Supportive', barColor: '#2e5020', textColor: '#60a048' },
  { max: 100, label: 'Devoted',    barColor: '#245a20', textColor: '#50a840' },
]

function getLevel(score: number): Level {
  return LEVELS.find(l => score <= l.max) ?? LEVELS[LEVELS.length - 1]
}

// ─── Faction definitions ──────────────────────────────────────────────────────

interface FactionDef {
  key: keyof FactionState
  short: string     // short display name (fits ~13 chars @ 0.52rem in 140px)
  full: string      // full name for tooltip header
  tooltips: Record<Level['label'], string>
}

const FACTIONS: FactionDef[] = [
  {
    key: 'halvekists',
    short: 'Halvekists',
    full: 'Halvekist Old Guard',
    tooltips: {
      Hostile:    'The old guard is funding your rivals. Coup backing is being arranged.',
      Cold:       'Opposition is organizing against you. Parliamentary obstruction ahead.',
      Wary:       'Halvekists are suspicious. They will block what they can.',
      Neutral:    'An uneasy truce. They are watching and waiting.',
      Warm:       'The old guard is cautiously cooperative. Handle with care.',
      Supportive: 'Halvekists are backing you. The price will reveal itself.',
      Devoted:    'The old guard is entirely yours. You may be becoming what you replaced.',
    },
  },
  {
    key: 'workersCoalition',
    short: "Workers' Coal.",
    full: "Workers' Unity Coalition",
    tooltips: {
      Hostile:    'Strike imminent. Kravenstal is on the edge of open riots.',
      Cold:       'Labor is restless. Slowdowns are spreading through the factories.',
      Wary:       'The coalition is skeptical. They voted for change — not this.',
      Neutral:    'The workers are watching. Their patience is not unlimited.',
      Warm:       'Labor is cautiously with you. Do not take them for granted.',
      Supportive: 'The workers stand behind you. Kravenstal is steady.',
      Devoted:    'Absolute labor loyalty — a force capital fears and courts envy.',
    },
  },
  {
    key: 'reformists',
    short: 'Reformists',
    full: 'Civic Renewal Movement',
    tooltips: {
      Hostile:    'Your own movement has turned. A no-confidence motion is being drafted.',
      Cold:       'The base is fracturing. Theron is fielding questions you dread.',
      Wary:       'Reformists are impatient. They expected more progress by now.',
      Neutral:    'Your base holds — barely. They need something to believe in.',
      Warm:       'The Civic Renewal movement trusts you. Keep the faith.',
      Supportive: 'Your base is energized. The mandate feels real.',
      Devoted:    'Absolute reformist loyalty. The movement and the Chancellor are one.',
    },
  },
  {
    key: 'ironCovenant',
    short: 'Iron Covenant',
    full: 'Iron Covenant (Military)',
    tooltips: {
      Hostile:    'General Brenner has stopped returning calls. The barracks are restless.',
      Cold:       'The military is displeased. Keep one eye on the garrison.',
      Wary:       'Officers are skeptical of civilian leadership. Tread carefully.',
      Neutral:    'The military tolerates you. For now, that is enough.',
      Warm:       'Officers are cooperative. The barracks are quiet and disciplined.',
      Supportive: 'Military backing secured — a double-edged sword.',
      Devoted:    'The army is entirely yours. Ask yourself why, and what comes next.',
    },
  },
  {
    key: 'church',
    short: 'Church',
    full: 'Church of the Eternal Flame',
    tooltips: {
      Hostile:    'The Archbishop is preaching against you. Congregations are turning.',
      Cold:       'The Church is cooling. Rural parishes are growing restless.',
      Wary:       'Ecclesiastical patience is finite. They want concessions.',
      Neutral:    'The Church observes. They have not moved against you — yet.',
      Warm:       'Pastoral goodwill. The Archbishop is not hostile.',
      Supportive: 'The Church blesses your government. The rural vote follows.',
      Devoted:    'The Church stands fully with you. Secularists are alarmed.',
    },
  },
  {
    key: 'businessClass',
    short: 'Business Class',
    full: 'Business Consortium',
    tooltips: {
      Hostile:    'Capital is fleeing Veltria. Investment has collapsed.',
      Cold:       'Business confidence is falling. The Krone is under pressure.',
      Wary:       'The merchant class is nervous. Contracts are being delayed.',
      Neutral:    'Business watches your policy direction with cautious curiosity.',
      Warm:       'Markets are responding positively to your leadership.',
      Supportive: 'The business community stands with you. Economic stability holds.',
      Devoted:    'Capital is entirely loyal. Consider what that loyalty costs.',
    },
  },
  {
    key: 'dravenni',
    short: 'Dravenni',
    full: 'Dravenni Liberation Front',
    tooltips: {
      Hostile:    'Separatist violence is erupting in Dravenhollow. The DLF is mobilizing.',
      Cold:       'The Dravenni are withdrawing from engagement. Autonomy calls grow louder.',
      Wary:       'Dravenni leaders are cautious. Past promises were never kept.',
      Neutral:    'The Dravenni are watching. Recognition would mean everything to them.',
      Warm:       'Tentative Dravenni engagement — the first steps toward real trust.',
      Supportive: 'The Dravenni community is cautiously behind you.',
      Devoted:    'Full Dravenni support. A historic reconciliation, if it holds.',
    },
  },
]

// ─── Tooltip ──────────────────────────────────────────────────────────────────

interface TooltipState {
  faction: FactionDef
  level: Level
  y: number   // clientY of the hovered row — for fixed positioning
}

function Tooltip({ faction, level, y }: TooltipState) {
  return (
    <div style={{
      position: 'fixed',
      left: 156,   // just past the 148px sidebar
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
        color: level.textColor,
        marginBottom: '0.25rem',
      }}>
        {faction.full} — {level.label}
      </div>
      <p style={{
        fontFamily: "'IM Fell English', Georgia, serif",
        fontSize: '0.8rem',
        color: 'var(--cream)',
        lineHeight: 1.65,
        fontStyle: 'italic',
      }}>
        "{faction.tooltips[level.label]}"
      </p>
    </div>
  )
}

// ─── Single faction row ───────────────────────────────────────────────────────

interface BarRowProps {
  faction: FactionDef
  score: number
  onHover: (state: TooltipState | null) => void
}

function BarRow({ faction, score, onHover }: BarRowProps) {
  const level = getLevel(score)
  // Bar fill as % of track
  const fillPct = score   // score is 0-100, directly usable

  return (
    <div
      style={{ marginBottom: '0.85rem', cursor: 'default' }}
      onMouseEnter={e => onHover({
        faction,
        level,
        y: e.currentTarget.getBoundingClientRect().top + 10,
      })}
      onMouseLeave={() => onHover(null)}
    >
      {/* Faction name */}
      <div style={{
        fontFamily: "'Special Elite', monospace",
        fontSize: '0.5rem',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--muted)',
        marginBottom: '0.25rem',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {faction.short}
      </div>

      {/* Bar track */}
      <div style={{
        height: '4px',
        background: 'rgba(200, 144, 42, 0.07)',
        position: 'relative',
        marginBottom: '0.2rem',
      }}>
        {/* Bar fill */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: `${fillPct}%`,
          background: level.barColor,
          transition: 'width 0.6s ease, background 0.4s ease',
        }} />
        {/* Danger threshold tick marks */}
        <DangerTick pct={getDangerThreshold(faction.key)} />
      </div>

      {/* Level label */}
      <div style={{
        fontFamily: "'Special Elite', monospace",
        fontSize: '0.48rem',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: level.textColor,
        transition: 'color 0.4s ease',
      }}>
        {level.label}
      </div>
    </div>
  )
}

// Small tick mark at the danger threshold so the player can see "this is the danger zone"
// without knowing the actual number (just a subtle visual marker)
function DangerTick({ pct }: { pct: number }) {
  return (
    <div style={{
      position: 'absolute',
      left: `${pct}%`,
      top: -2,
      bottom: -2,
      width: '1px',
      background: 'rgba(139, 46, 46, 0.35)',
      pointerEvents: 'none',
    }} />
  )
}

// Returns the "critical" threshold as a percentage (for tick mark placement).
// These come from GDD Section 4.3 faction threshold effects.
// We show the lowest danger threshold (below this → something bad triggers).
function getDangerThreshold(key: keyof FactionState): number {
  const thresholds: Partial<Record<keyof FactionState, number>> = {
    halvekists:       10,   // below 10 → coup funding
    workersCoalition: 10,   // below 10 → riots
    reformists:       15,   // below 15 → no-confidence
    ironCovenant:     25,   // below 25 → coup
    church:           10,   // below 10 → excommunication
    businessClass:    10,   // below 10 → economic collapse
    dravenni:          5,   // below 5  → secession attempt
  }
  return thresholds[key] ?? 20
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function FactionIndicators() {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const factions = useGameStore(s => s.factions)

  return (
    <div style={{ padding: '1.2rem 0.85rem 1rem', height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ marginBottom: '1rem' }}>
        <p style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: '0.52rem',
          letterSpacing: '0.2em',
          color: 'var(--amber-dim)',
          textTransform: 'uppercase',
          marginBottom: '0.4rem',
        }}>
          ▸ Factions
        </p>
        <div style={{ height: '1px', background: 'var(--border)' }} />
      </div>

      {/* Faction bars */}
      <div style={{ flex: 1 }}>
        {FACTIONS.map(faction => (
          <BarRow
            key={faction.key}
            faction={faction}
            score={factions[faction.key]}
            onHover={setTooltip}
          />
        ))}
      </div>

      {/* Footer note */}
      <div style={{
        fontFamily: "'Special Elite', monospace",
        fontSize: '0.44rem',
        letterSpacing: '0.1em',
        color: 'rgba(107, 96, 80, 0.4)',
        textTransform: 'uppercase',
        lineHeight: 1.6,
        marginTop: '0.5rem',
        borderTop: '1px solid rgba(200, 144, 42, 0.08)',
        paddingTop: '0.5rem',
      }}>
        Tick = crisis<br />threshold
      </div>

      {/* Tooltip — rendered at fixed position outside the sidebar */}
      {tooltip && <Tooltip {...tooltip} />}
    </div>
  )
}
