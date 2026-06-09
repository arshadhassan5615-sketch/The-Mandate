import { useState, useEffect, useRef } from 'react'
import type { AgendaItem } from '../types/week'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../types/week'
import type { ProvinceId } from '../engine/LocationResolver'
import { PROVINCE_PIN_POSITIONS, PROVINCE_NAMES } from '../engine/LocationResolver'
import { useSettingsStore } from '../stores/settingsStore'

interface MapScenePinProps {
  provinceId: ProvinceId
  items: AgendaItem[]
  currentWeek: number
  onSelectScene: (item: AgendaItem) => void
}

function getCategoryIcon(category: string) {
  switch (category) {
    case 'crisis':
    case 'security':
      return (
        <>
          <path d="M30 22 L38 36 L22 36 Z"
            fill="none" stroke="#e85c5c" strokeWidth="1.5" strokeLinejoin="round"/>
          <line x1="30" y1="27" x2="30" y2="32"
            stroke="#e85c5c" strokeWidth="1.5"/>
          <circle cx="30" cy="34" r="1"
            fill="#e85c5c"/>
        </>
      )
    case 'personal':
    case 'social':
      return (
        <>
          <path d="M24 38 L24 30 Q24 24 30 24 Q36 24 36 30 L36 38"
            fill="none" stroke="#c9a84c" strokeWidth="1.5"/>
          <circle cx="30" cy="21" r="3"
            fill="none" stroke="#c9a84c" strokeWidth="1.5"/>
        </>
      )
    default:
      return (
        <path d="M22 38 L22 26 L30 20 L38 26 L38 38 Z
                 M26 38 L26 32 L34 32 L34 38"
          fill="none" stroke="#c9a84c" strokeWidth="1.5" strokeLinejoin="round"/>
      )
  }
}

function getDominantCategory(items: AgendaItem[]): string {
  const counts: Record<string, number> = {}
  for (const item of items) {
    counts[item.category] = (counts[item.category] || 0) + 1
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'cabinet'
}

export default function MapScenePin({ provinceId, items, currentWeek, onSelectScene }: MapScenePinProps) {
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const pos = PROVINCE_PIN_POSITIONS[provinceId]
  const pan = useSettingsStore(s => s.mapPan)

  const hasMandatory = items.some(i => i.slotCost === 0)
  const hasUrgent = items.some(i => i.weekDeadline === currentWeek)
  const isMulti = items.length > 1
  const dominantCategory = getDominantCategory(items)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const pinFilter = hasUrgent
    ? 'drop-shadow(0 0 8px rgba(220,60,60,0.9))'
    : hasMandatory
      ? 'drop-shadow(0 0 8px rgba(201,168,76,0.9))'
      : 'drop-shadow(0 0 4px rgba(201,168,76,0.4))'

  const pinAnimation = hasUrgent
    ? 'medallion-pulse-red 2s ease-in-out infinite'
    : hasMandatory
      ? 'medallion-pulse 2s ease-in-out infinite'
      : undefined

  return (
    <div style={{
      position: 'fixed',
      left: pos.x + pan.x,
      top: pos.y + pan.y,
      transform: `translate(-50%, -50%) scale(${hovered ? 1.1 : 1.0})`,
      transition: 'transform 0.15s ease',
      zIndex: open ? 600 : 10,
      cursor: 'pointer',
    }}>
      <svg
        width="60" height="60" viewBox="0 0 60 60"
        style={{ display: 'block', filter: pinFilter, animation: pinAnimation }}
        onClick={() => setOpen(prev => !prev)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <circle cx="30" cy="30" r="28" fill="none" stroke="#c9a84c" strokeWidth="1.5" opacity="0.6"/>
        <circle cx="30" cy="30" r="22" fill="none" stroke="#c9a84c" strokeWidth="0.8" opacity="0.4"/>
        <circle cx="30" cy="30" r="19" fill="rgba(10, 8, 4, 0.92)" stroke="#c9a84c" strokeWidth="1.5"/>
        <circle cx="30" cy="2" r="1.5" fill="#c9a84c" opacity="0.8"/>
        <circle cx="30" cy="58" r="1.5" fill="#c9a84c" opacity="0.8"/>
        <circle cx="2" cy="30" r="1.5" fill="#c9a84c" opacity="0.8"/>
        <circle cx="58" cy="30" r="1.5" fill="#c9a84c" opacity="0.8"/>
        {getCategoryIcon(dominantCategory)}
        {isMulti && (
          <g>
            <circle cx="46" cy="14" r="8" fill="#8B1A1A"/>
            <text x="46" y="18" textAnchor="middle" fill="white" fontSize="9" fontFamily="Special Elite">{items.length}</text>
          </g>
        )}
      </svg>

      <span style={{
        position: 'absolute',
        bottom: '-18px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '8px',
        letterSpacing: '0.12em',
        color: 'rgba(200,185,155,0.5)',
        textTransform: 'uppercase',
        textShadow: '1px 1px 3px rgba(0,0,0,0.9)',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
      }}>
        {PROVINCE_NAMES[provinceId]}
      </span>

      {open && (
        <div
          ref={popoverRef}
          style={{
            position: 'absolute',
            bottom: '54px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '280px',
            background: 'rgba(10, 8, 6, 0.96)',
            border: '1px solid rgba(200,144,42,0.35)',
            borderRadius: '4px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.6), 0 0 12px rgba(200,144,42,0.08)',
            zIndex: 600,
            overflow: 'hidden',
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 12px',
            borderBottom: '1px solid rgba(200,144,42,0.15)',
          }}>
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '9px',
              letterSpacing: '0.1em',
              color: 'var(--amber)',
              textTransform: 'uppercase',
            }}>
              {PROVINCE_NAMES[provinceId]}
            </span>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                cursor: 'pointer',
                fontSize: '12px',
                lineHeight: 1,
                padding: '2px',
              }}
            >
              ×
            </button>
          </div>

          <div style={{ maxHeight: '320px', overflowY: 'auto', scrollbarWidth: 'thin' }}>
            {items.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setOpen(false)
                  onSelectScene(item)
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 12px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid rgba(200,144,42,0.08)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.12s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,144,42,0.06)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: "'Crimson Text', Georgia, serif",
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#d4c9b0',
                    lineHeight: 1.3,
                    marginBottom: '2px',
                  }}>
                    {item.title}
                  </div>
                  <div style={{
                    fontFamily: "'Crimson Text', Georgia, serif",
                    fontSize: '11px',
                    color: 'rgba(200,185,155,0.45)',
                    lineHeight: 1.4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {item.description}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '4px',
                  }}>
                    <span style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: '8px',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: item.slotCost === 0 ? 'var(--amber)' : 'rgba(200,185,155,0.35)',
                      background: item.slotCost === 0 ? 'rgba(200,144,42,0.12)' : 'transparent',
                      border: item.slotCost === 0 ? '1px solid rgba(200,144,42,0.3)' : '1px solid rgba(200,144,42,0.1)',
                      padding: '1px 5px',
                      borderRadius: '2px',
                    }}>
                      {item.slotCost === 0 ? 'Mandatory' : `Slot ${item.slotCost}`}
                    </span>
                    <span style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: '8px',
                      letterSpacing: '0.06em',
                      color: CATEGORY_COLORS[item.category] ?? 'rgba(200,185,155,0.3)',
                    }}>
                      {CATEGORY_LABELS[item.category]}
                    </span>
                    {item.weekDeadline === currentWeek && (
                      <span style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: '8px',
                        letterSpacing: '0.06em',
                        color: 'var(--accent-red)',
                      }}>
                        Deadline
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
