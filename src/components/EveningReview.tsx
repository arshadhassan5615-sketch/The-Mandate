import { useWeekStore } from '../stores/weekStore'
import { useGameStore } from '../stores/gameStore'
import type { GameState, NationState, FactionState, PersonalState } from '../types/gameState'
import FamilyStatus from './FamilyStatus'
import { useSettingsStore } from '../stores/settingsStore'
import { saveGame } from '../engine/SaveManager'
import { playPageTurn } from '../engine/audioEngine'

// ─── Delta computation ────────────────────────────────────────────────────────

interface StatDelta { label: string; delta: number }

function computeDeltas(before: GameState, after: GameState): StatDelta[] {
  const deltas: StatDelta[] = []

  const nationLabels: Record<keyof NationState, string> = {
    economyHealth:        'Economy Health',
    unemployment:         'Unemployment',
    inflation:            'Inflation',
    nationalDebt:         'National Debt',
    corruption:           'Corruption',
    militaryReadiness:    'Military Readiness',
    publicOrder:          'Public Order',
    pressFreedom:         'Press Freedom',
    mediaControl:         'Media Control',
    civilLiberties:       'Civil Liberties',
    internationalStanding:'Intl. Standing',
    assemblyVoteMargin:   'Assembly Margin',
  }
  for (const [k, label] of Object.entries(nationLabels)) {
    const key = k as keyof NationState
    const d = after.nation[key] - before.nation[key]
    if (d !== 0) deltas.push({ label, delta: d })
  }

  const factionLabels: Record<keyof FactionState, string> = {
    halvekists:       'Halvekists',
    workersCoalition: "Workers' Coalition",
    reformists:       'Reformists',
    ironCovenant:     'Iron Covenant',
    church:           'Church',
    businessClass:    'Business Class',
    dravenni:         'Dravenni',
  }
  for (const [k, label] of Object.entries(factionLabels)) {
    const key = k as keyof FactionState
    const d = after.factions[key] - before.factions[key]
    if (d !== 0) deltas.push({ label, delta: d })
  }

  const personalLabels: Record<keyof PersonalState, string> = {
    marriageHealth:    'Marriage Health',
    lioraRelationship: 'Liora Relationship',
    tomasWellbeing:    'Tomas Wellbeing',
    personalWealth:    'Personal Wealth',
    publicImage:       'Public Image',
    moralCompass:      'Moral Compass',
  }
  for (const [k, label] of Object.entries(personalLabels)) {
    const key = k as keyof PersonalState
    const d = after.personal[key] - before.personal[key]
    if (d !== 0) deltas.push({ label, delta: d })
  }

  return deltas
}

// ─── Delta row ────────────────────────────────────────────────────────────────

function DeltaRow({ label, delta }: StatDelta) {
  const positive = delta > 0
  const color = positive ? 'var(--accent-green)' : 'var(--accent-red)'
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.3rem 0',
        borderBottom: '1px solid rgba(200,144,42,0.08)',
      }}
    >
      <span
        style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: '0.72rem',
          color: 'var(--muted)',
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: '0.72rem',
          color,
          letterSpacing: '0.08em',
          minWidth: '3rem',
          textAlign: 'right',
        }}
      >
        {positive ? '+' : ''}{delta.toFixed(0)}
      </span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EveningReview() {
  const { sceneQueue, weekStartSnapshot, completeWeek, gateBlocked, gateMessage, dismissGate } = useWeekStore()
  const gameState = useGameStore()
  const { currentWeek } = useGameStore()
  const { setSaveMenuOpen, ironmanMode } = useSettingsStore()

  const deltas = weekStartSnapshot ? computeDeltas(weekStartSnapshot, gameState) : []

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden fixed inset-0 z-[1]"
      style={{ background: 'rgba(15,13,10,0.94)', paddingTop: '48px', paddingRight: '60px', paddingBottom: '80px', paddingLeft: '16px' }}
    >
      {/* ── Header ──────────────────────────────────────────────── */}
      <div
        className="shrink-0 flex items-center justify-between px-8 py-3 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <span className="stamp">The Mandate — Republic of Veltria, 1963</span>
        <span className="stamp" style={{ marginRight: '80px' }}>End of Week {currentWeek} · Evening Review</span>
      </div>

      {/* ── Body ────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: meetings attended */}
        <div
          className="hidden md:flex flex-col shrink-0 border-r overflow-y-auto"
          style={{
            borderColor: 'var(--border)',
            width: '260px',
            padding: '2rem 1.5rem',
            paddingBottom: '80px',
          }}
        >
          <p
            style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: '0.65rem',
              letterSpacing: '0.2em',
              color: 'var(--amber-dim)',
              textTransform: 'uppercase',
              marginBottom: '1rem',
            }}
          >
            ▸ Meetings Attended
          </p>
          <div style={{ height: '1px', background: 'var(--border)', marginBottom: '1.5rem' }} />
          {sceneQueue.map((item, i) => (
            <div key={item.id} style={{ marginBottom: '1rem' }}>
              <p
                style={{
                  fontFamily: "'Special Elite', monospace",
                  fontSize: '0.62rem',
                  color: 'var(--muted)',
                  letterSpacing: '0.1em',
                  marginBottom: '0.2rem',
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </p>
              <p
                style={{
                  fontFamily: "'IM Fell English', Georgia, serif",
                  fontSize: '0.9rem',
                  color: 'var(--cream)',
                  lineHeight: 1.4,
                }}
              >
                {item.title}
              </p>
            </div>
          ))}

          {/* Family status — personal life at a glance */}
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(200,144,42,0.12)', paddingTop: '0.5rem' }}>
            <FamilyStatus />
          </div>
        </div>

        {/* Right: stat deltas */}
        <div className="flex flex-col flex-1 overflow-hidden px-8 py-8 max-w-2xl">
          <div style={{ marginBottom: '2rem' }}>
            <p
              style={{
                fontFamily: "'Special Elite', monospace",
                fontSize: '0.65rem',
                letterSpacing: '0.2em',
                color: 'var(--amber-dim)',
                textTransform: 'uppercase',
                marginBottom: '0.4rem',
              }}
            >
              ▸ Weekly Consequences
            </p>
            <div style={{ height: '1px', background: 'var(--border)' }} />
          </div>

          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--amber-dim) transparent' }}>
            {deltas.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontFamily: "'Special Elite', monospace", fontSize: '0.8rem' }}>
                No measurable changes this week.
              </p>
            ) : (
              deltas.map(d => <DeltaRow key={d.label} {...d} />)
            )}

            {/* Narrative coda */}
            <div
              style={{
                marginTop: '2.5rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid var(--border)',
              }}
            >
              <p
                style={{
                  fontFamily: "'IM Fell English', Georgia, serif",
                  fontStyle: 'italic',
                  color: 'var(--muted)',
                  fontSize: '0.95rem',
                  lineHeight: 1.7,
                }}
              >
                Outside the palace windows, Ashenmere settles into night. The Republic continues. Week {currentWeek} is recorded.
              </p>
            </div>
          </div>

          {/* Advance + save buttons */}
          <div
            className="shrink-0 pt-6 border-t mt-6"
            style={{ borderColor: 'var(--border)', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}
          >
            {gateBlocked && (
              <div style={{ flexBasis: '100%', marginBottom: '0.5rem' }}>
                <div style={{
                  padding: '0.8rem 1.2rem',
                  border: '1px solid var(--accent-red)',
                  background: 'rgba(139,46,46,0.1)',
                  borderRadius: '2px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div>
                    <p style={{
                      fontFamily: "'Special Elite', monospace",
                      fontSize: '0.62rem',
                      letterSpacing: '0.15em',
                      color: 'var(--accent-red)',
                      textTransform: 'uppercase',
                      marginBottom: '0.25rem',
                    }}>
                      ▸ Required Before Advancing
                    </p>
                    <p style={{
                      fontFamily: "'IM Fell English', Georgia, serif",
                      fontStyle: 'italic',
                      fontSize: '0.85rem',
                      color: 'var(--muted)',
                      lineHeight: 1.4,
                    }}>
                      {gateMessage}
                    </p>
                  </div>
                  <button
                    onClick={dismissGate}
                    style={{
                      fontFamily: "'Special Elite', monospace",
                      fontSize: '0.55rem',
                      color: 'var(--muted)',
                      background: 'none',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      padding: '0.3rem 0.6rem',
                      letterSpacing: '0.08em',
                    }}
                  >
                    DISMISS
                  </button>
                </div>
              </div>
            )}
            <button
              className="choice-btn"
              onClick={() => { if (!gateBlocked) { playPageTurn(); completeWeek() } }}
              style={{ width: 'auto', minWidth: '260px', opacity: gateBlocked ? 0.35 : 1, pointerEvents: gateBlocked ? 'none' : 'auto' }}
              title={gateBlocked ? (gateMessage ?? 'Complete required agenda items first') : undefined}
            >
              {gateBlocked
                ? 'Complete Required Items First'
                : currentWeek >= 52 ? 'The Mandate is Complete →' : `Advance to Week ${currentWeek + 1} →`}
            </button>
            {!ironmanMode && (
              <button
                className="choice-btn"
                onClick={() => setSaveMenuOpen(true)}
                style={{ width: 'auto', minWidth: '160px', opacity: 0.7 }}
              >
                Save / Load
              </button>
            )}
            {!ironmanMode && (
              <button
                className="choice-btn"
                onClick={() => saveGame(0, 'AUTOSAVE').then(() => {})}
                style={{ width: 'auto', minWidth: '160px', opacity: 0.6 }}
              >
                Quick Save
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
