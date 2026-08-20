import { useState, useEffect } from 'react'
import { useDecreeStore } from '../stores/decreeStore'
import { useGameStore } from '../stores/gameStore'
import { useCabinetStore } from '../stores/cabinetStore'
import type { Decree, DecreeCategory } from '../types/decree'
import { getPortrait } from '../assets/potraits'
import { DURATION_FAST, EASE_STANDARD_CSS } from '../styles/motion'
import katerinSignature from '../assets/images/katerin_signature.jpeg'
import { playStamp } from '../engine/audioEngine'
import signBtnImg from '../assets/images/buttons/Sign_Button.png'

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
    pendingDecrees, signedDecrees, rejectedDecrees,
    selectedDecree, selectDecree, signDecree, rejectDecree, tableDecree,
  } = useDecreeStore()

  const currentWeek = useGameStore(s => s.currentWeek)
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
          zIndex: 700,
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

      <div style={{ 
        display: 'flex', 
        gap: '24px', 
        alignItems: 'stretch', 
        height: 'calc(100vh - 80px)', 
        marginTop: '40px', 
        marginBottom: '40px',
      }}>
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

function DecreeDetail({ decree, currentWeek: _currentWeek, isConflict, onSign, onReject: _onReject, onTable: _onTable }: DecreeDetailProps) {
  const isSigned = decree.signed
  const formationComplete = useCabinetStore(s => s.formation_complete)
  const [showSignature, setShowSignature] = useState(false)

  useEffect(() => {
    setShowSignature(false)
  }, [decree.id])

  const handleSignClick = () => {
    if (isConflict || showSignature || isSigned) return
    setShowSignature(true)
    playStamp()
    setTimeout(() => {
      onSign()
    }, 1500) // 1.5s animation delay
  }

  return (
    <>
    <div
      data-testid="decree-detail"
      style={{
        width: '520px', // Made narrower for a vertical look
        maxHeight: 'calc(100vh - 60px)',
        background: '#fdfbf3',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        borderRadius: '4px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid rgba(0,0,0,0.1)',
      }}
    >
      {/* HEADER */}
      <div style={{ padding: '24px 32px 16px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
        <h2 style={{ fontFamily: "'EnchantedLand', serif", fontSize: '28px', fontWeight: 700, color: '#1a1a1a', margin: 0, textAlign: 'center' }}>
          {decree.title}
        </h2>
      </div>

      {/* BODY */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', scrollbarWidth: 'thin' }}>
        {/* Summary */}
        <p style={{ fontFamily: "'Crimson Text', serif", fontSize: '15px', lineHeight: 1.7, color: '#333', textAlign: 'justify', margin: 0, marginBottom: '16px', fontStyle: 'italic' }}>
          {decree.summary}
        </p>
        {/* Description */}
        <div style={{ fontFamily: 'Georgia, serif', fontSize: '13px', lineHeight: 1.7, color: '#444', textAlign: 'justify', whiteSpace: 'pre-line' }}>
          {decree.description}
        </div>
        
        {/* Minister Avatars - only renders if cabinet is formed */}
        {formationComplete && (
          <div style={{ display: 'flex', gap: '16px', padding: '16px 0', borderTop: '1px solid #eee', marginTop: '24px', justifyContent: 'center' }}>
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

      {/* FOOTER (Signature & Sign Button) */}
      <div style={{ padding: '16px 32px 24px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        {/* Signature Area - Left Side */}
        <div style={{ width: '240px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: '240px',
            height: '120px',
            borderBottom: '1px solid #333',
            position: 'relative',
            marginBottom: '6px',
            overflow: 'visible'
          }}>
            {showSignature && (
              <img
                src={katerinSignature}
                alt="Signature"
                style={{
                  position: 'absolute',
                  bottom: '-20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  height: '120px',
                  width: 'auto',
                  maxWidth: '260px',
                  objectFit: 'contain',
                  mixBlendMode: 'multiply',
                  filter: 'contrast(1.2)',
                  animation: 'signatureWrite 900ms ease-out forwards',
                  pointerEvents: 'none',
                }}
              />
            )}
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '8px', color: '#aaa', letterSpacing: '1px', marginTop: '2px' }}>
            CHANCELLOR OF VELTRIA
          </div>
        </div>

        {/* Sign Button - Right Side */}
        {showSignature || isSigned ? (
          <div style={{ width: '90px', height: '90px' }} /> // Empty placeholder after signing
        ) : (
          <button 
            onClick={handleSignClick} 
            disabled={isConflict} 
            style={{
              width: '90px', 
              height: '90px', 
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
            <img src={signBtnImg} alt="Sign" style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain'
              // Removed mixBlendMode so the button is fully visible
            }} />
          </button>
        )}
      </div>
    </div>
    </>
  )
}
