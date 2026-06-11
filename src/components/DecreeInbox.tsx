import { useState, useEffect } from 'react'
import { useDecreeStore } from '../stores/decreeStore'
import { useGameStore } from '../stores/gameStore'
import type { Decree, DecreeCategory, MinisterStance } from '../types/decree'
import { getPortrait } from '../assets/potraits'

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
  favor: '#5a9e6b',
  against: '#b55a5a',
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
        border: '1.5px solid rgba(200,144,42,0.4)',
        background: 'rgba(26,20,16,0.8)',
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
          fontFamily: "'Special Elite', monospace",
          fontSize: size * 0.28,
          color: '#c9a84c',
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
      <div
        style={{
          width: '860px',
          maxWidth: 'calc(100vw - 80px)',
          height: '600px',
          maxHeight: 'calc(100vh - 100px)',
          background: '#0e0b07',
          border: '1px solid #c9a84c',
          borderRadius: '6px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── HEADER ────────────────────────────────────────────────────── */}
        <div style={{
          height: '52px',
          borderBottom: '1px solid rgba(201,168,76,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          flexShrink: 0,
        }}>
          <span style={{
            fontFamily: "'Special Elite', monospace",
            fontSize: '13px',
            letterSpacing: '3px',
            color: '#c9a84c',
            textTransform: 'uppercase',
          }}>
            Chancellor's Decree Inbox
          </span>
          <button
            onClick={onClose}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(201,168,76,0.1)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            style={{
              width: '32px',
              height: '32px',
              background: 'transparent',
              border: '1px solid rgba(201,168,76,0.3)',
              borderRadius: '3px',
              color: '#c9a84c',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease',
            }}
          >
            ×
          </button>
        </div>

        {/* ─── BODY ──────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
        }}>
          {/* LEFT COLUMN */}
          <div style={{
            width: '280px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid rgba(201,168,76,0.2)',
          }}>
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
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    fontFamily: "'Special Elite', monospace",
                    fontSize: '10px',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    padding: '3px 10px',
                    borderRadius: '2px',
                    border: `1px solid ${activeTab === tab ? '#c9a84c' : 'rgba(201,168,76,0.3)'}`,
                    background: activeTab === tab ? 'rgba(201,168,76,0.15)' : 'transparent',
                    color: activeTab === tab ? '#c9a84c' : 'rgba(201,168,76,0.5)',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tab === 'all' ? 'All' : CATEGORY_LABELS[tab]}
                </button>
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
                  fontFamily: "'IM Fell English', Georgia, serif",
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
                  fontFamily: "'Special Elite', monospace",
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
                  fontFamily: "'Special Elite', monospace",
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

          {/* RIGHT COLUMN */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {!detailDecree ? (
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'IM Fell English', Georgia, serif",
                fontSize: '14px',
                color: 'rgba(201,168,76,0.3)',
                fontStyle: 'italic',
              }}>
                Select a decree to review
              </div>
            ) : (
              <DecreeDetail
                decree={detailDecree}
                currentWeek={currentWeek}
                isConflict={isConflict}
                conflictTitle={conflictTitle}
                onSign={() => { signDecree(detailDecree.id) }}
                onReject={() => { rejectDecree(detailDecree.id) }}
                onTable={() => { tableDecree(detailDecree.id) }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
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

  return (
    <button
      onClick={onSelect}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0',
        padding: '10px 16px',
        background: isSelected
          ? 'rgba(201,168,76,0.08)'
          : 'transparent',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.12s ease',
        opacity: status === 'rejected' ? 0.45 : 1,
        borderBottom: '1px solid rgba(201,168,76,0.08)',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.background = 'rgba(201,168,76,0.05)'
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.background = 'transparent'
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
            fontFamily: "'IM Fell English', Georgia, serif",
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
              fontFamily: "'Special Elite', monospace",
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
          fontFamily: "'Special Elite', monospace",
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

// ─── Decree Detail ──────────────────────────────────────────────────────────

interface DecreeDetailProps {
  decree: Decree
  currentWeek: number
  isConflict: boolean
  conflictTitle: string | null
  onSign: () => void
  onReject: () => void
  onTable: () => void
}

function DecreeDetail({ decree, currentWeek, isConflict, conflictTitle, onSign, onReject, onTable }: DecreeDetailProps) {
  const isSigned = decree.signed
  const color = CATEGORY_COLORS[decree.category]

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Scrollable content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.2rem',
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(201,168,76,0.2) transparent',
      }}>
        {/* Category badge + title */}
        <div>
          <div style={{
            display: 'inline-block',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '9px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color,
            background: `${color}15`,
            border: `1px solid ${color}44`,
            padding: '2px 8px',
            borderRadius: '2px',
            marginBottom: '8px',
          }}>
            {CATEGORY_LABELS[decree.category]}
          </div>
          <h2 style={{
            fontFamily: "'IM Fell English', Georgia, serif",
            fontSize: '20px',
            fontWeight: 700,
            color: '#e8d5a3',
            margin: 0,
            lineHeight: 1.3,
          }}>
            {decree.title}
          </h2>
          <div style={{
            fontFamily: "'Special Elite', monospace",
            fontSize: '10px',
            color: 'rgba(201,168,76,0.4)',
            marginTop: '4px',
            letterSpacing: '0.05em',
          }}>
            Proposed by: {decree.proposedBy} · Week {decree.weekProposed}
          </div>
        </div>

        {/* Summary */}
        <div style={{
          fontFamily: "'IM Fell English', Georgia, serif",
          fontSize: '14px',
          fontStyle: 'italic',
          color: 'rgba(212,201,176,0.65)',
          lineHeight: 1.5,
          borderLeft: '2px solid rgba(201,168,76,0.2)',
          paddingLeft: '12px',
        }}>
          {decree.summary}
        </div>

        {/* Minister Positions */}
        <div>
          <div style={{
            fontFamily: "'Special Elite', monospace",
            fontSize: '10px',
            letterSpacing: '0.12em',
            color: 'rgba(201,168,76,0.4)',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}>
            Minister Positions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {decree.ministerPositions.map(pos => (
              <div
                key={pos.ministerId}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '8px 10px',
                  background: 'rgba(14,11,7,0.6)',
                  border: '1px solid rgba(201,168,76,0.1)',
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
                      fontFamily: "'IM Fell English', Georgia, serif",
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#d4c9b0',
                    }}>
                      {MINISTER_NAMES[pos.ministerId] ?? pos.ministerId.replace(/_/g, ' ')}
                    </span>
                    <StanceIcon stance={pos.stance} />
                    <span style={{
                      fontFamily: "'Special Elite', monospace",
                      fontSize: '9px',
                      color: STANCE_COLORS[pos.stance],
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                    }}>
                      {STANCE_LABELS[pos.stance]}
                    </span>
                  </div>
                  <div style={{
                    fontFamily: "'IM Fell English', Georgia, serif",
                    fontSize: '11px',
                    fontStyle: 'italic',
                    color: 'rgba(201,168,76,0.45)',
                    lineHeight: 1.4,
                  }}>
                    "{pos.reason}"
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <div style={{
            fontFamily: "'Special Elite', monospace",
            fontSize: '10px',
            letterSpacing: '0.12em',
            color: 'rgba(201,168,76,0.4)',
            textTransform: 'uppercase',
            marginBottom: '6px',
          }}>
            Full Description
          </div>
          <div style={{
            fontFamily: "'IM Fell English', Georgia, serif",
            fontSize: '13px',
            color: '#d4c9b0',
            lineHeight: 1.6,
          }}>
            {decree.description}
          </div>
        </div>

        {/* Immediate Effects */}
        {decree.immediateEffects.length > 0 && (
          <div>
            <div style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: '10px',
              letterSpacing: '0.12em',
              color: 'rgba(201,168,76,0.4)',
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
                    fontFamily: "'IM Fell English', Georgia, serif",
                    fontSize: '12px',
                  }}
                >
                  <span style={{
                    color: effect.value > 0 ? '#5a9e6b' : '#b55a5a',
                    fontWeight: 600,
                    minWidth: '40px',
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '11px',
                  }}>
                    {effect.value > 0 ? '+' : ''}{effect.value}
                  </span>
                  <span style={{ color: 'rgba(212,201,176,0.65)' }}>
                    {effect.description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Long-Term Effects */}
        {decree.longTermEffects.length > 0 && (
          <div>
            <div style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: '10px',
              letterSpacing: '0.12em',
              color: 'rgba(201,168,76,0.4)',
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
                    fontFamily: "'IM Fell English', Georgia, serif",
                    fontSize: '12px',
                  }}
                >
                  <span style={{
                    color: effect.value > 0 ? '#5a9e6b' : '#b55a5a',
                    fontWeight: 600,
                    minWidth: '40px',
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '11px',
                  }}>
                    {effect.value > 0 ? '+' : ''}{effect.value}
                  </span>
                  <span style={{ color: 'rgba(212,201,176,0.65)' }}>
                    {effect.description}
                  </span>
                  {effect.delayWeeks && (
                    <span style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: '9px',
                      color: 'rgba(201,168,76,0.3)',
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
            background: 'rgba(181,90,90,0.08)',
            border: '1px solid rgba(181,90,90,0.3)',
            borderRadius: '3px',
            fontFamily: "'IM Fell English', Georgia, serif",
            fontSize: '12px',
            color: '#b55a5a',
          }}>
            ⚠ Conflicts with: {conflictTitle}
          </div>
        )}
      </div>

      {/* Sticky action buttons */}
      <div style={{
        position: 'sticky',
        bottom: 0,
        background: '#0e0b07',
        borderTop: '1px solid rgba(201,168,76,0.2)',
        padding: '12px 24px',
        display: 'flex',
        gap: '12px',
        flexShrink: 0,
      }}>
        {isSigned ? (
          <div style={{
            fontFamily: "'Special Elite', monospace",
            fontSize: '12px',
            color: '#5a9e6b',
            letterSpacing: '0.05em',
          }}>
            ✓ Signed into law
          </div>
        ) : (
          <>
            <button
              onClick={onSign}
              disabled={isConflict}
              title={isConflict ? 'Cannot sign — conflicts with an existing decree' : undefined}
              style={{
                fontFamily: "'Special Elite', monospace",
                fontSize: '13px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '8px 20px',
                background: isConflict ? 'rgba(201,168,76,0.05)' : '#c9a84c',
                border: `1.5px solid ${isConflict ? 'rgba(201,168,76,0.15)' : '#c9a84c'}`,
                color: isConflict ? 'rgba(201,168,76,0.3)' : '#0e0b07',
                cursor: isConflict ? 'not-allowed' : 'pointer',
                borderRadius: '3px',
                transition: 'all 0.15s ease',
                fontWeight: 700,
              }}
            >
              Sign Decree
            </button>
            <button
              onClick={onTable}
              style={{
                fontFamily: "'Special Elite', monospace",
                fontSize: '13px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '8px 20px',
                background: 'transparent',
                border: '1.5px solid rgba(201,168,76,0.4)',
                color: '#c9a84c',
                cursor: 'pointer',
                borderRadius: '3px',
                transition: 'all 0.15s ease',
              }}
            >
              Table for Later
            </button>
            <button
              onClick={onReject}
              style={{
                fontFamily: "'Special Elite', monospace",
                fontSize: '13px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '8px 20px',
                background: 'transparent',
                border: '1.5px solid rgba(180,60,60,0.8)',
                color: '#b55a5a',
                cursor: 'pointer',
                borderRadius: '3px',
                transition: 'all 0.15s ease',
              }}
            >
              Reject
            </button>
          </>
        )}
      </div>
    </div>
  )
}
