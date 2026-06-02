import type { AgendaItem, AgendaCategory } from '../types/week'
import { useState } from 'react'
import { SLOT_MAX, CATEGORY_LABELS, CATEGORY_COLORS } from '../types/week'
import { useWeekStore } from '../stores/weekStore'
import { useGameStore } from '../stores/gameStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import { getScene, getUnavailableDueToPrerequisites } from '../engine/NarrativeEngine'
import { playPaperShuffle } from '../engine/audioEngine'

// ─── Agenda card ──────────────────────────────────────────────────────────────

interface CardProps {
  item: AgendaItem
  selected: boolean
  disabled: boolean
  onToggle: () => void
}

function AgendaCard({ item, selected, disabled, onToggle }: CardProps) {
  const color = CATEGORY_COLORS[item.category as AgendaCategory]
  const isMandatory = item.isMandatory ?? false
  const scene = getScene(item.sceneId)
  const isGate = scene?.isWeekGate ?? false
  const effectiveDisabled = (disabled && !selected) || (isMandatory && selected)

  return (
    <button
      onClick={onToggle}
      disabled={disabled && !selected}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        textAlign: 'left',
        background: selected ? 'var(--amber-glow-strong)' : 'var(--paper-raised)',
        border: `1px solid ${isGate ? 'var(--amber)' : isMandatory ? 'var(--accent-green)' : selected ? 'var(--amber)' : 'var(--border)'}`,
        borderLeft: isGate ? '4px solid var(--amber)' : undefined,
        borderRadius: '2px',
        padding: '1rem 1.1rem',
        cursor: effectiveDisabled ? 'default' : 'pointer',
        opacity: disabled && !selected ? 0.4 : 1,
        transition: 'border-color 0.15s, background 0.15s, opacity 0.15s',
        position: 'relative',
        width: '100%',
        animation: isGate ? 'gate-pulse 2s ease-in-out infinite' : undefined,
      }}
    >
      {/* Gate indicator */}
      {isGate && (
        <div
          style={{
            position: 'absolute',
            top: '0.6rem',
            right: '0.8rem',
            fontFamily: "'Special Elite', monospace",
            fontSize: '0.58rem',
            letterSpacing: '0.15em',
            color: 'var(--amber)',
            textTransform: 'uppercase',
          }}
        >
          Required
        </div>
      )}

      {/* Mandatory indicator */}
      {isMandatory && !isGate && (
        <div
          style={{
            position: 'absolute',
            top: '0.6rem',
            right: '0.8rem',
            fontFamily: "'Special Elite', monospace",
            fontSize: '0.58rem',
            letterSpacing: '0.15em',
            color: 'var(--accent-green)',
            textTransform: 'uppercase',
          }}
        >
          Mandatory
        </div>
      )}

      {/* Urgent indicator */}
      {item.isUrgent && !isMandatory && (
        <div
          style={{
            position: 'absolute',
            top: '0.6rem',
            right: '0.8rem',
            fontFamily: "'Special Elite', monospace",
            fontSize: '0.6rem',
            letterSpacing: '0.15em',
            color: 'var(--accent-red)',
            textTransform: 'uppercase',
          }}
        >
          Urgent
        </div>
      )}

      {/* Category badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span
          style={{
            display: 'inline-block',
            padding: '0.15rem 0.5rem',
            fontSize: '0.6rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontFamily: "'Special Elite', monospace",
            background: `${color}22`,
            border: `1px solid ${color}66`,
            color: color,
            borderRadius: '2px',
          }}
        >
          {CATEGORY_LABELS[item.category as AgendaCategory]}
        </span>
        <span
          style={{
            fontFamily: "'Special Elite', monospace",
            fontSize: '0.62rem',
            color: 'var(--muted)',
            letterSpacing: '0.12em',
          }}
        >
          {item.slotCost > 0
            ? `${item.slotCost} slot${item.slotCost !== 1 ? 's' : ''}`
            : 'Mandatory'}
        </span>
      </div>

      {/* Title */}
      <div
        style={{
          fontFamily: "'IM Fell English', Georgia, serif",
          fontSize: '1rem',
          color: selected ? 'var(--amber)' : 'var(--cream)',
          fontWeight: 400,
          lineHeight: 1.3,
        }}
      >
        {selected && '▸ '}{item.title}
      </div>

      {/* Description */}
      <p
        style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: '0.72rem',
          color: 'var(--muted)',
          lineHeight: 1.5,
          letterSpacing: '0.04em',
        }}
      >
        {item.description}
      </p>
    </button>
  )
}

// ─── Forced chain event card ──────────────────────────────────────────────────

function ForcedEventCard({ sceneId }: { sceneId: string }) {
  const scene = getScene(sceneId)
  if (!scene) return null
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
        textAlign: 'left',
        background: 'rgba(139,46,46,0.08)',
        border: '1px solid rgba(139,46,46,0.4)',
        borderRadius: '2px',
        padding: '0.8rem 1rem',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <span style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: '0.58rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--accent-red)',
        }}>
          ⚠ Required Event
        </span>
        <span style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: '0.58rem',
          letterSpacing: '0.12em',
          color: 'var(--muted)',
          textTransform: 'uppercase',
        }}>
          {scene.location}
        </span>
      </div>
      <div style={{
        fontFamily: "'IM Fell English', Georgia, serif",
        fontSize: '0.95rem',
        color: 'var(--cream)',
        lineHeight: 1.3,
      }}>
        {scene.title}
      </div>
      <p style={{
        fontFamily: "'Special Elite', monospace",
        fontSize: '0.68rem',
        color: 'var(--muted)',
        lineHeight: 1.5,
        letterSpacing: '0.04em',
      }}>
        This meeting has been forced by a prior decision. It cannot be skipped.
      </p>
    </div>
  )
}

// ─── Locked prerequisite card ─────────────────────────────────────────────────

function LockedCard({ sceneId }: { sceneId: string }) {
  const scene = getScene(sceneId)
  const prereqIds = scene?.prerequisiteSceneIds ?? []

  const [hovered, setHovered] = useState(false)

  const prereqNames = prereqIds
    .map(id => getScene(id)?.title)
    .filter(Boolean)
    .join(', ')

  if (!scene) return null

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        textAlign: 'left',
        background: 'var(--paper-raised)',
        border: '1px solid var(--border)',
        borderRadius: '2px',
        padding: '1rem 1.1rem',
        opacity: 0.5,
        position: 'relative',
        width: '100%',
        cursor: 'default',
      }}
    >
      <div style={{ position: 'absolute', top: '0.6rem', right: '0.8rem' }}>
        <span style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: '0.75rem',
          color: 'var(--muted)',
        }}>
          🔒
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: '0.58rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
        }}>
          Locked
        </span>
      </div>
      <div style={{
        fontFamily: "'IM Fell English', Georgia, serif",
        fontSize: '0.9rem',
        color: 'var(--muted)',
        lineHeight: 1.3,
      }}>
        {scene.title}
      </div>
      {hovered && prereqNames && (
        <p style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: '0.65rem',
          color: 'var(--amber-dim)',
          lineHeight: 1.4,
        }}>
          Complete first: {prereqNames}
        </p>
      )}
    </div>
  )
}

// ─── Slot pips ────────────────────────────────────────────────────────────────

function SlotPips({ used, max }: { used: number; max: number }) {
  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          style={{
            width: '20px',
            height: '20px',
            border: `1px solid ${i < used ? 'var(--amber)' : 'var(--border)'}`,
            background: i < used ? 'var(--amber-glow-strong)' : 'transparent',
            borderRadius: '2px',
            transition: 'background 0.15s, border-color 0.15s',
          }}
        />
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AgendaSelector() {
  const { agendaPool, selectedIds, slotsUsed, forcedChainIds, toggleAgendaItem, confirmAgenda } = useWeekStore()
  const { currentWeek } = useGameStore()
  const { visitedSceneIds, activeFlags } = useNarrativeStore()

  const canConfirm = selectedIds.length > 0 || forcedChainIds.length > 0

  const lockedScenes = getUnavailableDueToPrerequisites(currentWeek, visitedSceneIds, activeFlags)

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden fixed inset-0 z-[1]"
      style={{ background: 'rgba(15,13,10,0.94)', paddingTop: '48px', paddingRight: '60px' }}
    >
      {/* ── Header ──────────────────────────────────────────────── */}
      <div
        className="shrink-0 flex items-center px-8 py-3 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <span className="stamp">The Mandate — Republic of Veltria, 1963</span>
      </div>

      {/* ── Body ────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Agenda selection (full width now — briefing is its own phase) */}
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* Agenda header */}
          <div
            className="shrink-0 flex items-center justify-between px-8 py-4 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <div>
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
                Agenda Selection
              </p>
              <p
                style={{
                  fontFamily: "'Special Elite', monospace",
                  fontSize: '0.7rem',
                  color: 'var(--muted)',
                  letterSpacing: '0.08em',
                }}
              >
                Choose meetings for the week — {SLOT_MAX - slotsUsed} slot{SLOT_MAX - slotsUsed !== 1 ? 's' : ''} remaining
              </p>
            </div>
            <SlotPips used={slotsUsed} max={SLOT_MAX} />
          </div>

          {/* Cards grid */}
          <div
            className="flex-1 overflow-y-auto"
            style={{
              padding: '1.5rem 2rem',
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--amber-dim) transparent',
            }}
          >
            {/* Chain-forced required events */}
            {forcedChainIds.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{
                  fontFamily: "'Special Elite', monospace",
                  fontSize: '0.6rem',
                  letterSpacing: '0.2em',
                  color: 'var(--accent-red)',
                  textTransform: 'uppercase',
                  marginBottom: '0.6rem',
                }}>
                  ▸ Required Meetings — Consequence of Prior Decisions
                </p>
                <div style={{ height: '1px', background: 'rgba(139,46,46,0.3)', marginBottom: '0.8rem' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  {forcedChainIds.map(id => <ForcedEventCard key={id} sceneId={id} />)}
                </div>
              </div>
            )}

            {agendaPool.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontFamily: "'Special Elite', monospace", fontSize: '0.8rem' }}>
                No meetings available this week.
              </p>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                {agendaPool.map(item => (
                  <AgendaCard
                    key={item.id}
                    item={item}
                    selected={selectedIds.includes(item.id)}
                    disabled={slotsUsed >= SLOT_MAX}
                    onToggle={() => toggleAgendaItem(item.id)}
                  />
                ))}
              </div>
            )}
            {/* Locked prerequisite scenes */}
            {lockedScenes.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <div style={{ height: '1px', background: 'var(--border)', marginBottom: '1rem' }} />
                <p style={{
                  fontFamily: "'Special Elite', monospace",
                  fontSize: '0.58rem',
                  letterSpacing: '0.18em',
                  color: 'var(--muted)',
                  textTransform: 'uppercase',
                  marginBottom: '0.6rem',
                }}>
                  ▸ Not Yet Available
                </p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '0.75rem',
                  }}
                >
                  {lockedScenes.map(scene => (
                    <LockedCard key={scene.id} sceneId={scene.id} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm bar */}
          <div
            className="shrink-0 flex items-center justify-between px-8 py-4 border-t"
            style={{ borderColor: 'var(--border)' }}
          >
            <p
              style={{
                fontFamily: "'Special Elite', monospace",
                fontSize: '0.7rem',
                color: 'var(--muted)',
                letterSpacing: '0.08em',
              }}
            >
              {selectedIds.length} meeting{selectedIds.length !== 1 ? 's' : ''} scheduled
            </p>
            <button
              className="choice-btn"
              disabled={!canConfirm}
              onClick={() => { playPaperShuffle(); confirmAgenda() }}
              style={{
                width: 'auto',
                opacity: canConfirm ? 1 : 0.35,
                minWidth: '220px',
              }}
            >
              Confirm Agenda →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
