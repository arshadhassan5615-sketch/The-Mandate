import type { AgendaItem, AgendaCategory } from '../types/week'
import { useState, useMemo } from 'react'
import { SLOT_MAX, CATEGORY_LABELS, CATEGORY_COLORS } from '../types/week'
import { useWeekStore } from '../stores/weekStore'
import { useGameStore } from '../stores/gameStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import { getScene, getUnavailableDueToPrerequisites } from '../engine/NarrativeEngine'
import { checkForEmergencies } from '../engine/EmergencyDecreeEngine'
import { checkIntelligenceIntegrity } from '../engine/WhisperNetworkEngine'
import { checkForBudgetCrisis } from '../engine/BudgetCrisisEngine'
import { playPaperShuffle } from '../engine/audioEngine'
import { useIsMobile } from '../hooks/useIsMobile'
import { pageInsets } from '../constants/layout'

// ─── Agenda card ──────────────────────────────────────────────────────────────

interface CardProps {
  item: AgendaItem
  selected: boolean
  disabled: boolean
  onToggle: () => void
}

function AgendaCard({ item, selected, disabled, onToggle }: CardProps) {
  // const scene = item.sceneId.startsWith('__') ? undefined : getScene(item.sceneId) // unused — card renders from item
  const effectiveDisabled = disabled && !selected
  const color = CATEGORY_COLORS[item.category as AgendaCategory] ?? 'var(--amber)'

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
        border: item.isUrgent ? '1.5px solid rgba(224,92,74,0.8)' : (selected ? '1.5px solid var(--amber)' : '1.5px solid rgba(196,148,58,0.15)'),
        boxShadow: item.isUrgent ? '0 0 12px rgba(224,92,74,0.3)' : (selected ? '0 0 12px rgba(196,148,58,0.2)' : 'none'),
        animation: item.isUrgent ? 'event-pulse-urgent 1.2s ease-in-out infinite' : undefined,
        borderRadius: '2px',
        padding: '1rem 1.1rem',
        cursor: effectiveDisabled ? 'default' : 'pointer',
        opacity: disabled && !selected ? 0.4 : 1,
        transition: 'border-color 0.15s, background 0.15s, opacity 0.15s',
        position: 'relative',
        width: '100%',
      }}
    >
      {/* Urgent indicator */}
      {item.isUrgent && (
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
            : 'Required'}
        </span>
      </div>

      {/* Ticking clock badge */}
      {item.isUrgent && (
        <span style={{
          display: 'inline-block',
          background: 'rgba(224,92,74,0.2)',
          color: '#e05c4a',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.45rem',
          letterSpacing: '0.1em',
          padding: '2px 6px',
          borderRadius: '2px',
          textTransform: 'uppercase',
          marginBottom: '4px',
          border: '1px solid rgba(224,92,74,0.4)',
        }}>
          ⚠ Ticking Clock
        </span>
      )}

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
  // Keep clear of the fixed HUD; phones also clear the Government row and bottom bar
  const isMobile = useIsMobile()
  const insets = pageInsets(isMobile)
  const padX = isMobile ? 'px-4' : 'px-8'
  const { agendaPool, selectedIds, slotsUsed, forcedChainIds, toggleAgendaItem, confirmAgenda } = useWeekStore()
  const gameState = useGameStore()
  const { currentWeek } = useGameStore()
  const { visitedSceneIds, activeFlags } = useNarrativeStore()

  const emergency = useMemo(
    () => checkForEmergencies(gameState, activeFlags),
    [gameState, activeFlags],
  )

  const intel = useMemo(
    () => emergency ? { compromised: false, sceneId: '' } : checkIntelligenceIntegrity(gameState, activeFlags),
    [gameState, activeFlags, emergency],
  )

  const budgetCrisis = useMemo(
    () => emergency ? null : checkForBudgetCrisis(gameState, activeFlags),
    [gameState, activeFlags, emergency],
  )

  const pipelineSceneId = useMemo(() => {
    if (currentWeek === 14 && !activeFlags.includes('constitution_pipeline_stage_1_done')) {
      return 'pipeline_constitution_drafting'
    }
    if (currentWeek === 15 && activeFlags.includes('constitution_pipeline_stage_1_done') && !activeFlags.includes('constitution_pipeline_stage_2_done')) {
      return 'pipeline_constitution_committee'
    }
    if (currentWeek === 16 && activeFlags.includes('constitution_pipeline_stage_2_done') && !activeFlags.includes('constitution_floor_vote_resolved')) {
      return 'pipeline_constitution_floor_vote'
    }
    return null
  }, [currentWeek, activeFlags])

  const canConfirm = selectedIds.length > 0 || forcedChainIds.length > 0

  const lockedScenes = getUnavailableDueToPrerequisites(currentWeek, visitedSceneIds, activeFlags)

  // Shared markup for forced agenda sections (chain events, crises, intel
  // alerts, fiscal emergencies, constitution pipeline). Multi-scene sections
  // get the stacked wrapper; single-scene sections render one card.
  const renderForcedSection = (title: string, sceneIds: string[], titleColor: string, hairlineColor: string) => (
    <div style={{ marginBottom: '1.5rem' }}>
      <p style={{
        fontFamily: "'Special Elite', monospace",
        fontSize: '0.6rem',
        letterSpacing: '0.2em',
        color: titleColor,
        textTransform: 'uppercase',
        marginBottom: '0.6rem',
      }}>
        {title}
      </p>
      <div style={{ height: '1px', background: hairlineColor, marginBottom: '0.8rem' }} />
      {sceneIds.length > 1 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {sceneIds.map(id => <ForcedEventCard key={id} sceneId={id} />)}
        </div>
      ) : (
        <ForcedEventCard sceneId={sceneIds[0]} />
      )}
    </div>
  )

  return (
    <div
      data-testid="agenda-page"
      className="flex flex-col h-screen w-screen overflow-hidden fixed inset-0 z-[800]"
      style={{ background: 'rgba(15,13,10,0.94)', paddingTop: insets.top, paddingRight: insets.right, paddingBottom: insets.bottom }}
    >
      {/* ── Header ──────────────────────────────────────────────── */}
      <div
        className={`shrink-0 flex items-center ${padX} py-3 border-b`}
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
            className={`shrink-0 flex items-center justify-between gap-3 ${padX} py-4 border-b`}
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
              padding: isMobile ? '1rem' : '1.5rem 2rem',
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--amber-dim) transparent',
            }}
          >
            {/* Chain-forced required events */}
            {forcedChainIds.length > 0 && renderForcedSection(
              '▸ Required Meetings — Consequence of Prior Decisions',
              forcedChainIds,
              'var(--accent-red)',
              'rgba(139,46,46,0.3)',
            )}

            {/* Emergency crisis scene — forced into the agenda */}
            {emergency && renderForcedSection(
              `▸ Crisis — ${emergency.crisisName}`,
              [emergency.sceneId],
              'var(--accent-red)',
              'rgba(139,46,46,0.3)',
            )}

            {/* Compromised intelligence scene */}
            {intel.compromised && renderForcedSection(
              `▸ Intelligence Alert — ${intel.sceneId === 'morning_briefing_compromised' ? 'Compromised Dossier' : ''}`,
              [intel.sceneId],
              'var(--amber)',
              'rgba(200,144,42,0.3)',
            )}

            {/* Budget crisis scene */}
            {budgetCrisis && renderForcedSection(
              `▸ Fiscal Emergency — ${budgetCrisis.crisisName}`,
              [budgetCrisis.sceneId],
              'var(--accent-red)',
              'rgba(139,46,46,0.3)',
            )}

            {/* Legislative pipeline scene — forced multi-week arc */}
            {pipelineSceneId && renderForcedSection(
              `▸ Constitutional Pipeline — Stage ${pipelineSceneId === 'pipeline_constitution_drafting' ? '1: Drafting' : pipelineSceneId === 'pipeline_constitution_committee' ? '2: Committee' : '3: Floor Vote'}`,
              [pipelineSceneId],
              'var(--accent-green)',
              'rgba(26,107,42,0.3)',
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
            className={`shrink-0 flex flex-wrap items-center justify-between gap-3 ${padX} py-4 border-t`}
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
                minWidth: isMobile ? 0 : '220px',
                flex: isMobile ? '1 1 auto' : undefined,
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
