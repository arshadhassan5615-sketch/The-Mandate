import { useState, useEffect, type CSSProperties } from 'react'
import { useDecreeStore } from '../stores/decreeStore'
import { useGameStore } from '../stores/gameStore'
import { useCabinetStore } from '../stores/cabinetStore'
import type { Decree, DecreeCategory, MinisterStance } from '../types/decree'
import { getPortrait } from '../assets/potraits'
import { DURATION_FAST, EASE_STANDARD_CSS } from '../styles/motion'
import veltriaSeal from '../assets/images/veltria_seal.png'

// Parchment paper — same fill as LegislationOverlay bill document
const PARCHMENT = '#f5f0e0'
const INK = '#0d0a06'
const INK_MUTED = '#4a4030'
const INK_FAINT = '#6b5a40'
const RULE = 'rgba(13,10,6,0.12)'

const CATEGORY_COLORS: Record<DecreeCategory, string> = {
  economic: '#c9a84c',
  judicial: '#5a7fb5',
  religious: '#8b6b9e',
  welfare: '#5a9e6b',
  development: '#b57a5a',
}

const CATEGORY_LABELS: Record<DecreeCategory, string> = {
  economic: 'Economic',
  judicial: 'Judicial',
  religious: 'Religious',
  welfare: 'Welfare',
  development: 'Development',
}

const STANCE_COLORS: Record<MinisterStance, string> = {
  favor: '#3d7a4a',
  against: '#a04040',
  neutral: '#6b6050',
}

const STANCE_LABELS: Record<MinisterStance, string> = {
  favor: 'In Favor',
  against: 'Against',
  neutral: 'Neutral',
}

const MINISTER_NAMES: Record<string, string> = {
  gregor_maric: 'Gregor Marić',
  elara_vostane: 'Elara Vostane',
  aldric_theron: 'Aldric Theron',
  irina_dusek: 'Col. Irina Dusek',
  danika_oberlin: 'Danika Oberlin',
  vyktor_reznik: 'Vyktor Reznik',
  stanislov_renek: 'Archbishop Renek',
  benedikt_varro: 'Benedikt Varro',
  drazen_kolvar: 'Dražen Kolvar',
  stefan_morvec: 'Stefan Morvec',
}

/** Shared hover + press micro-interaction (ImageButton language: scale 0.94 press). */
function usePressHover() {
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)
  return {
    hovered,
    pressed,
    transform: `scale(${pressed ? 0.94 : hovered ? 1.03 : 1})`,
    transition: `all ${DURATION_FAST}ms ${EASE_STANDARD_CSS}`,
    handlers: {
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => {
        setHovered(false)
        setPressed(false)
      },
      onMouseDown: () => setPressed(true),
      onMouseUp: () => setPressed(false),
    },
  }
}

function MinisterThumbnail({ ministerId, size = 40 }: { ministerId: string; size?: number }) {
  const imgSrc = getPortrait(ministerId)
  const name = MINISTER_NAMES[ministerId] ?? ministerId.replace(/_/g, ' ')
  const initials = name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        border: '1.5px solid rgba(107,79,42,0.45)',
        background: 'rgba(245,240,224,0.9)',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      title={name}
    >
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
        />
      ) : (
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: size * 0.28,
          color: '#6b4f2a',
          fontWeight: 'bold',
        }}>
          {initials}
        </span>
      )}
    </div>
  )
}

function StanceIcon({ stance }: { stance: MinisterStance }) {
  const icon = stance === 'favor' ? '✓' : stance === 'against' ? '✗' : '—'
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '20px',
      height: '20px',
      borderRadius: '50%',
      background: `${STANCE_COLORS[stance]}22`,
      color: STANCE_COLORS[stance],
      fontSize: '11px',
      fontWeight: 700,
      flexShrink: 0,
    }}>
      {icon}
    </span>
  )
}

interface DecreeInboxProps {
  onClose: () => void
}

export default function DecreeInbox({ onClose }: DecreeInboxProps) {
  const {
    pendingDecrees, signedDecrees, rejectedDecrees,
    selectedDecree, selectDecree, signDecree, rejectDecree, tableDecree,
  } = useDecreeStore()

  const currentWeek = useGameStore(s => s.currentWeek)
  const [activeTab, setActiveTab] = useState<DecreeCategory | 'all'>('all')

  const filteredPending = activeTab === 'all'
    ? pendingDecrees
    : pendingDecrees.filter(d => d.category === activeTab)

  const filteredSigned = activeTab === 'all'
    ? signedDecrees
    : signedDecrees.filter(d => d.category === activeTab)

  const filteredRejected = activeTab === 'all'
    ? rejectedDecrees
    : rejectedDecrees.filter(d => d.category === activeTab)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const detailDecree = selectedDecree ?? filteredPending[0]
  const isConflict = detailDecree?.conflictsWith
    ? detailDecree.conflictsWith.some(cid => signedDecrees.some(s => s.id === cid))
    : false
  const conflictTitle = isConflict && detailDecree?.conflictsWith
    ? signedDecrees.find(s => s.id === detailDecree.conflictsWith![0])?.title
    : null

  return (
    <div
      data-testid="decree-inbox-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 600,
        background: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <CloseButton onClose={onClose} />

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        {/* ─── LEFT-PANEL — dark standalone list ──────────────────────────── */}
        <div style={{
          width: '280px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          background: '#0e0b07',
          border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: '6px',
          overflow: 'hidden',
          maxHeight: 'calc(100vh - 100px)',
          boxShadow: [
            '0 24px 64px rgba(0,0,0,0.75)',
            '0 0 0 1px rgba(201,168,76,0.12)',
            'inset 0 1px 0 rgba(255,220,160,0.14)',
            'inset 0 -2px 8px rgba(0,0,0,0.35)',
          ].join(', '),
        }}>
          <div style={{
            height: '52px',
            borderBottom: '1px solid rgba(201,168,76,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 16px',
            flexShrink: 0,
          }}>
            <span style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: '12px',
              letterSpacing: '2px',
              color: '#c9a84c',
              textTransform: 'uppercase',
            }}>
              Decree Inbox
            </span>
          </div>

          {/* Stats row */}
          <div style={{
            padding: '10px 16px',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '11px',
            color: 'rgba(201,168,76,0.6)',
            borderBottom: '1px solid rgba(201,168,76,0.15)',
          }}>
            {pendingDecrees.length} pending · {signedDecrees.length} signed · {rejectedDecrees.length} rejected
          </div>

          {/* Category filter tabs */}
          <div style={{
            padding: '10px 12px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            borderBottom: '1px solid rgba(201,168,76,0.15)',
          }}>
            {(['all', 'economic', 'judicial', 'religious', 'welfare', 'development'] as const).map(tab => (
              <CategoryChip
                key={tab}
                active={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                label={tab === 'all' ? 'All' : CATEGORY_LABELS[tab]}
              />
            ))}
          </div>

          {/* Decree list */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(201,168,76,0.2) transparent',
          }}>
            {filteredPending.length === 0 && filteredSigned.length === 0 && filteredRejected.length === 0 && (
              <div style={{
                padding: '2rem 1rem',
                textAlign: 'center',
                fontFamily: "'Crimson Text', Georgia, serif",
                fontSize: '13px',
                color: 'rgba(201,168,76,0.25)',
                fontStyle: 'italic',
              }}>
                No decrees available this week
              </div>
            )}

            {filteredPending.map(decree => (
              <DecreeRow
                key={decree.id}
                decree={decree}
                currentWeek={currentWeek}
                isSelected={detailDecree?.id === decree.id}
                onSelect={() => selectDecree(decree)}
                status="pending"
              />
            ))}

            {filteredSigned.length > 0 && (
              <div style={{
                padding: '8px 16px',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '9px',
                letterSpacing: '0.1em',
                color: 'rgba(90,158,107,0.6)',
                textTransform: 'uppercase',
                borderTop: '1px solid rgba(201,168,76,0.1)',
                marginTop: '4px',
              }}>
                Signed ({filteredSigned.length})
              </div>
            )}
            {filteredSigned.map(decree => (
              <DecreeRow
                key={decree.id}
                decree={decree}
                currentWeek={currentWeek}
                isSelected={detailDecree?.id === decree.id}
                onSelect={() => selectDecree(decree)}
                status="signed"
              />
            ))}

            {filteredRejected.length > 0 && (
              <div style={{
                padding: '8px 16px',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '9px',
                letterSpacing: '0.1em',
                color: 'rgba(181,90,90,0.5)',
                textTransform: 'uppercase',
                borderTop: '1px solid rgba(201,168,76,0.1)',
                marginTop: '4px',
              }}>
                Rejected ({filteredRejected.length})
              </div>
            )}
            {filteredRejected.map(decree => (
              <DecreeRow
                key={decree.id}
                decree={decree}
                currentWeek={currentWeek}
                isSelected={detailDecree?.id === decree.id}
                onSelect={() => selectDecree(decree)}
                status="rejected"
              />
            ))}
          </div>
        </div>

        {/* ─── PARCHMENT DOCUMENT — centered LegislationOverlay style ─────── */}
        {!detailDecree ? (
          <div style={{
            width: '680px',
            height: '320px',
            background: PARCHMENT,
            border: '1px solid rgba(201,168,76,0.15)',
            borderRadius: '2px',
            boxShadow: '0 0 80px rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Crimson Text', Georgia, serif",
            fontSize: '14px',
            color: INK_FAINT,
            fontStyle: 'italic',
          }}>
            Select a decree to review
          </div>
        ) : (
          <DecreeDetail
            decree={detailDecree}
            currentWeek={currentWeek}
            isConflict={isConflict}
            conflictTitle={conflictTitle ?? null}
            onSign={() => { signDecree(detailDecree.id) }}
            onReject={() => { rejectDecree(detailDecree.id) }}
            onTable={() => { tableDecree(detailDecree.id) }}
          />
        )}
      </div>
    </div>
  )
}

// ─── Interactive chrome controls ────────────────────────────────────────────

function CloseButton({ onClose }: { onClose: () => void }) {
  const press = usePressHover()
  return (
    <button
      onClick={onClose}
      {...press.handlers}
      style={{
        width: '32px',
        height: '32px',
        background: press.hovered ? 'rgba(201,168,76,0.1)' : 'transparent',
        border: '1px solid rgba(201,168,76,0.3)',
        borderRadius: '3px',
        color: '#c9a84c',
        fontSize: '16px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: press.transform,
        transition: press.transition,
      }}
    >
      ×
    </button>
  )
}

function CategoryChip({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  const press = usePressHover()
  return (
    <button
      type="button"
      onClick={onClick}
      {...press.handlers}
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '10px',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        padding: '3px 10px',
        borderRadius: '2px',
        border: `1px solid ${active ? '#c9a84c' : 'rgba(201,168,76,0.3)'}`,
        background: active ? 'rgba(201,168,76,0.15)' : press.hovered ? 'rgba(201,168,76,0.08)' : 'transparent',
        color: active ? '#c9a84c' : 'rgba(201,168,76,0.5)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transform: press.transform,
        transition: press.transition,
      }}
    >
      {label}
    </button>
  )
}

// ─── Decree Row ─────────────────────────────────────────────────────────────

interface DecreeRowProps {
  decree: Decree
  currentWeek: number
  isSelected: boolean
  onSelect: () => void
  status: 'pending' | 'signed' | 'rejected'
}

function DecreeRow({ decree, currentWeek, isSelected, onSelect, status }: DecreeRowProps) {
  const isDeadline = decree.weekDeadline === currentWeek && status === 'pending'
  const color = CATEGORY_COLORS[decree.category]
  const press = usePressHover()

  return (
    <button
      type="button"
      onClick={onSelect}
      {...press.handlers}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0',
        padding: '10px 16px',
        background: isSelected
          ? 'rgba(201,168,76,0.08)'
          : press.hovered
            ? 'rgba(201,168,76,0.05)'
            : 'transparent',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        opacity: status === 'rejected' ? 0.45 : 1,
        borderBottom: '1px solid rgba(201,168,76,0.08)',
        transform: press.transform,
        transition: press.transition,
      }}
    >
      {/* Category color bar */}
      <div style={{
        width: '4px',
        alignSelf: 'stretch',
        borderRadius: '2px',
        background: status === 'signed' ? '#5a9e6b' : status === 'rejected' ? 'rgba(181,90,90,0.4)' : color,
        flexShrink: 0,
        marginRight: '10px',
      }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          {status === 'signed' && (
            <span style={{ color: '#5a9e6b', fontSize: '10px', flexShrink: 0 }}>✓</span>
          )}
          {status === 'rejected' && (
            <span style={{ color: '#b55a5a', fontSize: '10px', flexShrink: 0 }}>✗</span>
          )}
          <span style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '13px',
            fontWeight: 600,
            color: isSelected ? '#c9a84c' : '#d4c9b0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {decree.title}
          </span>
          {isDeadline && (
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '9px',
              letterSpacing: '0.08em',
              color: '#b55a5a',
              background: 'rgba(181,90,90,0.12)',
              border: '1px solid rgba(181,90,90,0.3)',
              padding: '1px 6px',
              borderRadius: '2px',
              flexShrink: 0,
              textTransform: 'uppercase',
            }}>
              Deadline
            </span>
          )}
        </div>
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '10px',
          color: 'rgba(201,168,76,0.4)',
          marginTop: '2px',
          letterSpacing: '0.05em',
        }}>
          {decree.proposedBy}
        </div>
      </div>
    </button>
  )
}

// ─── Decree Detail (parchment official-document surface) ────────────────────

interface DecreeDetailProps {
  decree: Decree
  currentWeek: number
  isConflict: boolean
  conflictTitle: string | null
  onSign: () => void
  onReject: () => void
  onTable: () => void
}

function DecreeDetail({ decree, currentWeek: _currentWeek, isConflict, conflictTitle, onSign, onReject, onTable }: DecreeDetailProps) {
  const isSigned = decree.signed
  const formationComplete = useCabinetStore(s => s.formation_complete)
  const color = CATEGORY_COLORS[decree.category]

  return (
    <div
      data-testid="decree-detail"
      style={{
        width: '680px',
        maxHeight: 'calc(100vh - 80px)',
        background: PARCHMENT,
        boxShadow: '0 0 80px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        padding: '16px 44px 0',
      }}
    >
      {/* SEAL */}
      <div style={{
        textAlign: 'center',
        marginBottom: '6px',
      }}>
        <img
          src={veltriaSeal}
          alt="Veltria Seal"
          style={{
            width: '52px',
            height: '52px',
            objectFit: 'contain',
            display: 'block',
            margin: '0 auto',
            mixBlendMode: 'multiply',
            opacity: 0.92,
          }}
        />
      </div>

      {/* DECREE TITLE */}
      <div style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: '19px',
        fontWeight: 700,
        color: INK,
        textAlign: 'center',
        lineHeight: 1.25,
        marginBottom: '4px',
      }}>
        {decree.title}
      </div>

      {/* CATEGORY BADGE + PROPOSER LINE */}
      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
        <span style={{
          display: 'inline-block',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '9px',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: color === '#c9a84c' ? '#6b4f2a' : color,
          background: `${color}18`,
          border: `1px solid ${color}55`,
          padding: '2px 10px',
          borderRadius: '2px',
          marginBottom: '6px',
        }}>
          {CATEGORY_LABELS[decree.category]}
        </span>
        <div style={{
          fontSize: '9px',
          letterSpacing: '2px',
          color: '#6b4f2a',
          fontWeight: 600,
          fontFamily: "'IBM Plex Mono', monospace",
        }}>
          Proposed by {decree.proposedBy} · Week {decree.weekProposed}, 1963
        </div>
      </div>

      {/* SCROLLABLE BODY */}
      <div style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        paddingRight: '8px',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(139,115,85,0.2) transparent',
      }}>
        {/* Summary */}
        <p style={{
          fontFamily: "'Crimson Text', Georgia, serif",
          fontSize: '14px',
          fontStyle: 'italic',
          color: INK_MUTED,
          lineHeight: 1.5,
          borderLeft: `2px solid ${RULE}`,
          paddingLeft: '12px',
          marginTop: 0,
          marginBottom: '14px',
        }}>
          {decree.summary}
        </p>

        {/* Minister Positions */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '10px',
            letterSpacing: '0.12em',
            color: INK_FAINT,
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}>
            Minister Positions
          </div>
          {formationComplete ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {decree.ministerPositions.map(pos => (
                <div
                  key={pos.ministerId}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '8px 10px',
                    background: 'rgba(255,255,255,0.35)',
                    border: `1px solid ${RULE}`,
                    borderRadius: '3px',
                  }}
                >
                  <MinisterThumbnail ministerId={pos.ministerId} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '2px',
                    }}>
                      <span style={{
                        fontFamily: "'Crimson Text', Georgia, serif",
                        fontSize: '13px',
                        fontWeight: 600,
                        color: INK,
                      }}>
                        {MINISTER_NAMES[pos.ministerId] ?? pos.ministerId.replace(/_/g, ' ')}
                      </span>
                      <StanceIcon stance={pos.stance} />
                      <span style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: '9px',
                        color: STANCE_COLORS[pos.stance],
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                      }}>
                        {STANCE_LABELS[pos.stance]}
                      </span>
                    </div>
                    <div style={{
                      fontFamily: "'Crimson Text', Georgia, serif",
                      fontSize: '12px',
                      fontStyle: 'italic',
                      color: INK_MUTED,
                      lineHeight: 1.4,
                    }}>
                      "{pos.reason}"
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              padding: '14px 16px',
              fontFamily: "'Crimson Text', Georgia, serif",
              fontSize: '13px',
              fontStyle: 'italic',
              color: INK_FAINT,
              textAlign: 'center',
              border: `1px solid ${RULE}`,
              borderRadius: '3px',
              background: 'rgba(255,255,255,0.2)',
            }}>
              Cabinet not yet formed — minister positions pending appointment.
            </div>
          )}
        </div>

        {/* Description */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{
            fontFamily: 'Georgia, serif',
            fontSize: '11.5px',
            lineHeight: 1.55,
            color: INK,
            textAlign: 'justify',
            whiteSpace: 'pre-line',
            overflowWrap: 'break-word',
          }}>
            {decree.description}
          </div>
        </div>

        {/* Immediate Effects */}
        {decree.immediateEffects.length > 0 && (
          <div style={{ marginBottom: '14px' }}>
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '10px',
              letterSpacing: '0.12em',
              color: INK_FAINT,
              textTransform: 'uppercase',
              marginBottom: '6px',
            }}>
              Immediate Effects
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {decree.immediateEffects.map((effect, i) => (
                <div
                  key={effect.description ?? i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontFamily: "'Crimson Text', Georgia, serif",
                    fontSize: '12px',
                  }}
                >
                  <span style={{
                    color: effect.value > 0 ? '#3d7a4a' : '#a04040',
                    fontWeight: 600,
                    minWidth: '40px',
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '11px',
                  }}>
                    {effect.value > 0 ? '+' : ''}{effect.value}
                  </span>
                  <span style={{ color: INK_MUTED }}>
                    {effect.description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Long-Term Effects */}
        {decree.longTermEffects.length > 0 && (
          <div style={{ marginBottom: '14px' }}>
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '10px',
              letterSpacing: '0.12em',
              color: INK_FAINT,
              textTransform: 'uppercase',
              marginBottom: '6px',
            }}>
              Long-Term Effects
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {decree.longTermEffects.map((effect, i) => (
                <div
                  key={effect.description ?? i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontFamily: "'Crimson Text', Georgia, serif",
                    fontSize: '12px',
                  }}
                >
                  <span style={{
                    color: effect.value > 0 ? '#3d7a4a' : '#a04040',
                    fontWeight: 600,
                    minWidth: '40px',
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '11px',
                  }}>
                    {effect.value > 0 ? '+' : ''}{effect.value}
                  </span>
                  <span style={{ color: INK_MUTED }}>
                    {effect.description}
                  </span>
                  {effect.delayWeeks && (
                    <span style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: '9px',
                      color: INK_FAINT,
                      flexShrink: 0,
                    }}>
                      (in {effect.delayWeeks} weeks)
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conflict notice */}
        {isConflict && conflictTitle && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(160,64,64,0.08)',
            border: '1px solid rgba(160,64,64,0.35)',
            borderRadius: '3px',
            fontFamily: "'Crimson Text', Georgia, serif",
            fontSize: '12px',
            color: '#a04040',
          }}>
            Conflicts with: {conflictTitle}
          </div>
        )}
      </div>

      {/* SIGNATURE BLOCK */}
      <div style={{
        flexShrink: 0,
        marginTop: '14px',
        paddingTop: '14px',
        borderTop: '1px solid #ccc',
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <div style={{
          width: '280px',
          height: '40px',
          borderBottom: '1px solid #333',
          marginBottom: '6px',
        }} />
        <div style={{
          fontSize: '8px',
          letterSpacing: '3px',
          color: '#666',
          textTransform: 'uppercase',
          textAlign: 'center',
        }}>
          Chancellor of the Republic
        </div>
      </div>

      {/* BUTTON ROW — circular buttons matching LegislationOverlay */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 32px 12px',
        borderTop: '1px solid #e0d5c0',
        marginTop: '16px',
        width: '100%',
        boxSizing: 'border-box',
      }}>
        {isSigned ? (
          <div style={{
            width: '100%',
            textAlign: 'center',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '12px',
            color: '#3d7a4a',
            letterSpacing: '0.05em',
          }}>
            ✓ Signed into law
          </div>
        ) : (
          <>
            <button
              onClick={onReject}
              disabled={isSigned}
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 38% 32%, #e06868, #8b1515)',
                border: '3px solid rgba(255,255,255,0.12)',
                color: 'white',
                fontFamily: 'Georgia, serif',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                cursor: isSigned ? 'default' : 'pointer',
                boxShadow: '0 6px 28px rgba(139,21,21,0.65), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -3px 8px rgba(0,0,0,0.25)',
                textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={e => {
                if (isSigned) return
                e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 10px 36px rgba(139,21,21,0.85), 0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -3px 8px rgba(0,0,0,0.25)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = '0 6px 28px rgba(139,21,21,0.65), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -3px 8px rgba(0,0,0,0.25)'
              }}
              onMouseDown={e => {
                if (isSigned) return
                e.currentTarget.style.transform = 'scale(0.97)'
              }}
            >
              Reject
            </button>
            <button
              onClick={onSign}
              disabled={isConflict || isSigned}
              title={isConflict ? 'Cannot sign — conflicts with an existing decree' : undefined}
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 38% 32%, #e8d5a3, #8b6914)',
                border: '3px solid rgba(255,255,255,0.15)',
                color: '#0d0a06',
                fontFamily: 'Georgia, serif',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                cursor: isConflict || isSigned ? 'default' : 'pointer',
                boxShadow: '0 6px 28px rgba(139,105,20,0.65), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -3px 8px rgba(0,0,0,0.15)',
                textShadow: '0 1px 2px rgba(255,255,255,0.15)',
                transition: 'all 0.15s ease',
                opacity: isConflict ? 0.35 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={e => {
                if (isConflict || isSigned) return
                e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 10px 36px rgba(139,105,20,0.85), 0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -3px 8px rgba(0,0,0,0.15)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = '0 6px 28px rgba(139,105,20,0.65), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -3px 8px rgba(0,0,0,0.15)'
              }}
              onMouseDown={e => {
                if (isConflict || isSigned) return
                e.currentTarget.style.transform = 'scale(0.97)'
              }}
            >
              Sign Decree
            </button>
          </>
        )}
      </div>

      {/* Table for Later — small text link below button row */}
      {!isSigned && (
        <div style={{
          textAlign: 'center',
          padding: '0 0 14px',
          flexShrink: 0,
        }}>
          <button
            onClick={onTable}
            style={{
              background: 'none',
              border: 'none',
              fontFamily: "'Crimson Text', Georgia, serif",
              fontSize: '12px',
              fontStyle: 'italic',
              color: INK_FAINT,
              cursor: 'pointer',
              textDecoration: 'underline',
              textUnderlineOffset: '2px',
              textDecorationColor: 'rgba(107,90,64,0.3)',
              padding: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = INK_MUTED }}
            onMouseLeave={e => { e.currentTarget.style.color = INK_FAINT }}
          >
            Table for Later
          </button>
        </div>
      )}
    </div>
  )
}
