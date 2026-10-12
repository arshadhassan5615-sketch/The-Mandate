import { useState, useEffect } from 'react'
import { useDecreeStore } from '../stores/decreeStore'
import { useGameStore } from '../stores/gameStore'
import { useCabinetStore } from '../stores/cabinetStore'
import type { Decree, DecreeCategory } from '../types/decree'
import { getPortrait } from '../assets/potraits'
import { DURATION_FAST, EASE_STANDARD_CSS } from '../styles/motion'
import { playStamp } from '../engine/audioEngine'
import signBtnImg from '../assets/images/buttons/Sign_Button.png'
import { Z } from '../constants/zIndex'
import { useIsMobile } from '../hooks/useIsMobile'
import FiscalNote from './ui/FiscalNote'
import { decreeBudgetCost } from './ui/decreeFiscal'
import { DocumentSeal, SignatureLine } from './ui/StateDocument'

// Parchment paper — same fill as LegislationOverlay bill document
const PARCHMENT = '#f5f0e0'
const INK_FAINT = '#6b5a40'

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

interface DecreeInboxProps {
  onClose: () => void
}

export default function DecreeInbox({ onClose }: DecreeInboxProps) {
  const {
    pendingDecrees, signedDecrees, rejectedDecrees, tabledDecrees,
    selectedDecree, selectDecree, signDecree, rejectDecree, tableDecree,
  } = useDecreeStore()

  const currentWeek = useGameStore(s => s.currentWeek)
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState<DecreeCategory | 'all'>('all')

  const filteredPending = activeTab === 'all'
    ? pendingDecrees
    : pendingDecrees.filter(d => d.category === activeTab)

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
  const wasPostponed = !!detailDecree && tabledDecrees.some(t => t.id === detailDecree.id)
  const isRejected = !!detailDecree && rejectedDecrees.some(r => r.id === detailDecree.id)
  // A decree cannot be signed while a decree it conflicts with is in force.
  const conflictingDecree = detailDecree?.conflictsWith
    ? signedDecrees.find(s => detailDecree.conflictsWith!.includes(s.id))
    : undefined
  const isConflict = conflictingDecree !== undefined
  const conflictTitle = conflictingDecree?.title

  return (
    <div
      data-testid="decree-inbox-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z.overlay,
        background: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <button
        onClick={onClose}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          width: '36px',
          height: '36px',
          background: 'rgba(201,168,76,0.1)',
          border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: '4px',
          color: '#c9a84c',
          fontSize: '18px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: Z.overlayRaised,
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(201,168,76,0.2)'
          e.currentTarget.style.borderColor = '#c9a84c'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(201,168,76,0.1)'
          e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)'
        }}
      >
        ×
      </button>

      {/* Phones stack the list above the document and scroll the whole column. */}
      <div style={isMobile ? {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        padding: '64px 12px 24px',
        boxSizing: 'border-box',
      } : {
        display: 'flex',
        gap: '24px',
        alignItems: 'stretch',
        height: 'calc(100vh - 80px)',
        marginTop: '40px',
        marginBottom: '40px',
      }}>
        {/* ─── LEFT-PANEL — dark standalone list ──────────────────────────── */}
        <div data-testid="decree-inbox-shell" style={{
          width: isMobile ? '100%' : '280px',
          maxHeight: isMobile ? '40vh' : undefined,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          background: '#0e0b07',
          border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: '6px',
          overflow: 'hidden',
          // maxHeight: 'calc(100vh - 100px)',
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
            {filteredPending.length === 0 && filteredRejected.length === 0 && (
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
            width: isMobile ? '100%' : '680px',
            height: '320px',
            flexShrink: 0,
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
            isMobile={isMobile}
            wasPostponed={wasPostponed}
            isRejected={isRejected}
            onSign={() => { signDecree(detailDecree.id) }}
            onReject={() => { rejectDecree(detailDecree.id) }}
            // A postponed decree leaves the list until next week; show the next one
            onTable={() => { tableDecree(detailDecree.id); selectDecree(null) }}
          />
        )}
      </div>
    </div>
  )
}

// ─── Interactive chrome controls ────────────────────────────────────────────

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
  isMobile: boolean
  /** Already postponed once; it cannot be postponed again. */
  wasPostponed: boolean
  isRejected: boolean
  onSign: () => void
  onReject: () => void
  onTable: () => void
}

function DecreeDetail({ decree, isConflict, conflictTitle, isMobile, wasPostponed, isRejected, onSign, onReject, onTable }: DecreeDetailProps) {
  const isSigned = decree.signed
  // Reject and postpone are open only while the decree is undecided
  const isUndecided = !isSigned && !isRejected
  const formationComplete = useCabinetStore(s => s.formation_complete)
  const [showSignature, setShowSignature] = useState(false)
  const padX = isMobile ? '16px' : '32px'

  useEffect(() => {
    setShowSignature(false)
  }, [decree.id])

  const handleSignClick = () => {
    if (isConflict || showSignature || !isUndecided) return
    setShowSignature(true)
    playStamp()
    setTimeout(() => {
      onSign()
    }, 1500) // 1.5s animation delay
  }

  return (
    <div
      data-testid="decree-detail"
      style={{
        width: isMobile ? '100%' : '520px',
        maxHeight: isMobile ? undefined : 'calc(100vh - 60px)',
        flexShrink: 0,
        background: '#fdfbf3',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        borderRadius: '4px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid rgba(0,0,0,0.1)',
        boxSizing: 'border-box',
      }}
    >
      {/* HEADER — seal, title, and what signing commits the treasury to */}
      <div style={{ padding: `20px ${padX} 12px`, borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
        <DocumentSeal size={44} />
        <h2
          data-testid="decree-detail-title"
          style={{ fontFamily: "'EnchantedLand', serif", fontSize: isMobile ? '24px' : '28px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 6px', textAlign: 'center' }}
        >
          {decree.title}
        </h2>
        <div style={{ fontSize: '9px', letterSpacing: '2px', color: '#6b4f2a', fontWeight: 600, textAlign: 'center', textTransform: 'uppercase', marginBottom: '12px' }}>
          {CATEGORY_LABELS[decree.category]} decree · Proposed by {decree.proposedBy}
        </div>
        <FiscalNote budgetCost={decreeBudgetCost(decree)} />
        {isConflict && (
          <p
            role="note"
            data-testid="decree-conflict"
            style={{
              margin: 0,
              padding: '6px 10px',
              border: '1px solid var(--oxblood)',
              color: 'var(--oxblood)',
              fontFamily: "'Crimson Text', serif",
              fontSize: '14px',
              textAlign: 'center',
            }}
          >
            Cannot be signed: it conflicts with the {conflictTitle ?? 'decree'} already in force.
          </p>
        )}
      </div>

      {/* BODY */}
      <div style={{ flex: 1, overflowY: 'auto', padding: `20px ${padX}`, scrollbarWidth: 'thin' }}>
        {/* Summary */}
        <p style={{ fontFamily: "'Crimson Text', serif", fontSize: '15px', lineHeight: 1.7, color: '#333', textAlign: isMobile ? 'left' : 'justify', margin: 0, marginBottom: '16px', fontStyle: 'italic' }}>
          {decree.summary}
        </p>
        {/* Description */}
        <div style={{ fontFamily: 'Georgia, serif', fontSize: '13.5px', lineHeight: 1.7, color: '#444', textAlign: isMobile ? 'left' : 'justify', whiteSpace: 'pre-line' }}>
          {decree.description}
        </div>

        {/* Minister Avatars - only renders if cabinet is formed */}
        {formationComplete && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', padding: '16px 0', borderTop: '1px solid #eee', marginTop: '24px', justifyContent: 'center' }}>
            {decree.ministerPositions.map(pos => (
              <div key={pos.ministerId} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ position: 'relative' }}>
                  <MinisterThumbnail ministerId={pos.ministerId} size={40} />
                  <div style={{
                    position: 'absolute', bottom: '-2px', right: '-2px', width: '16px', height: '16px', borderRadius: '50%',
                    background: pos.stance === 'favor' ? '#4CAF50' : pos.stance === 'against' ? '#e53935' : '#999',
                    border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: '9px', fontWeight: 'bold',
                  }}>
                    {pos.stance === 'favor' ? '✓' : pos.stance === 'against' ? '✗' : '—'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DECISION — reject for good, or postpone a week (once) */}
      {isUndecided && !showSignature && (
        <div data-testid="decree-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', padding: `12px ${padX} 0`, flexShrink: 0 }}>
          <DecisionButton tone="reject" onClick={onReject}>Reject</DecisionButton>
          <DecisionButton tone="neutral" onClick={onTable} disabled={wasPostponed}>
            {wasPostponed ? 'Already postponed once' : 'Postpone a week'}
          </DecisionButton>
        </div>
      )}

      {/* FOOTER (Signature & Sign Button) */}
      <div style={{ padding: `16px ${padX} 24px`, borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <SignatureLine
          isSigned={showSignature}
          caption="Chancellor of Veltria"
          width={isMobile ? 200 : 240}
          height={isMobile ? 100 : 120}
          signatureMaxWidth={260}
        />

        {isRejected ? (
          <RejectedStamp />
        ) : showSignature || isSigned ? (
          <div style={{ width: '90px', height: '90px', flexShrink: 0 }} /> // Empty placeholder after signing
        ) : (
          <button
            type="button"
            onClick={handleSignClick}
            disabled={isConflict}
            aria-label={isConflict ? 'Sign decree (blocked by a conflicting decree)' : 'Sign decree'}
            style={{
              width: '90px',
              height: '90px',
              flexShrink: 0,
              background: 'transparent',
              border: 'none',
              cursor: isConflict ? 'not-allowed' : 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isConflict ? 0.4 : 1,
              filter: isConflict ? 'grayscale(100%)' : 'none',
              transition: 'transform 0.15s ease'
            }}
            onMouseEnter={e => { if (!isConflict) e.currentTarget.style.transform = 'scale(1.08) translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            <img src={signBtnImg} alt="" style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }} />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Decision controls ──────────────────────────────────────────────────────

const DECISION_TONES = {
  reject: { color: '#a04040', border: 'rgba(160,64,64,0.6)', hover: 'rgba(160,64,64,0.08)' },
  neutral: { color: '#6b4f2a', border: 'rgba(107,79,42,0.5)', hover: 'rgba(107,79,42,0.08)' },
} as const

function DecisionButton({ tone, onClick, disabled = false, children }: {
  tone: keyof typeof DECISION_TONES
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  const t = DECISION_TONES[tone]
  const press = usePressHover()
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      {...(disabled ? {} : press.handlers)}
      style={{
        flex: '1 1 140px',
        minHeight: '40px',
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '11px',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: t.color,
        background: press.hovered && !disabled ? t.hover : 'transparent',
        border: `1px solid ${t.border}`,
        borderRadius: '2px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        transform: disabled ? undefined : press.transform,
        transition: press.transition,
      }}
    >
      {children}
    </button>
  )
}

function RejectedStamp() {
  return (
    <div
      data-testid="decree-rejected-stamp"
      style={{
        flexShrink: 0,
        padding: '6px 12px',
        border: '2px solid #a04040',
        color: '#a04040',
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '14px',
        fontWeight: 700,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        transform: 'rotate(-6deg)',
      }}
    >
      Rejected
    </div>
  )
}
