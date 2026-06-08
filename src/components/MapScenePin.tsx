import { useState, useEffect, useRef } from 'react'
import type { AgendaItem } from '../types/week'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../types/week'
import type { ProvinceId } from '../engine/LocationResolver'
import { PROVINCE_PIN_POSITIONS, PROVINCE_NAMES } from '../engine/LocationResolver'

interface MapScenePinProps {
  provinceId: ProvinceId
  items: AgendaItem[]
  currentWeek: number
  onSelectScene: (item: AgendaItem) => void
}

const CATEGORY_ICONS: Record<string, string> = {
  cabinet: '🏛',
  meeting: '🏛',
  crisis: '⚠',
  security: '⚠',
  personal: '🏠',
  social: '🥂',
  finance: '💰',
  diplomacy: '🤝',
  parliament: '⚖',
  infrastructure: '🏗',
}

function getSceneIcon(category: string): string {
  return CATEGORY_ICONS[category] ?? '📜'
}

export default function MapScenePin({ provinceId, items, currentWeek, onSelectScene }: MapScenePinProps) {
  const [open, setOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const pos = PROVINCE_PIN_POSITIONS[provinceId]

  const hasMandatory = items.some(i => i.slotCost === 0)
  const hasUrgent = items.some(i => i.weekDeadline === currentWeek)
  const isMulti = items.length > 1

  const borderColor = hasUrgent ? 'var(--accent-red)' : hasMandatory ? 'var(--amber)' : '#6b6050'
  const glowColor = hasUrgent
    ? 'rgba(139,46,46,0.5)'
    : hasMandatory
      ? 'rgba(200,144,42,0.4)'
      : 'rgba(107,96,80,0.2)'
  const pulseClass = hasUrgent
    ? 'map-pin-pulse-urgent'
    : hasMandatory
      ? 'map-pin-pulse-gold'
      : ''

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

  return (
    <div style={{ position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)', zIndex: open ? 600 : 10 }}>
      <button
        onClick={() => setOpen(prev => !prev)}
        className={pulseClass}
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: 'rgba(20,18,12,0.9)',
          border: `2px solid ${borderColor}`,
          outline: `1px solid ${glowColor}`,
          outlineOffset: '3px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: `0 0 12px ${glowColor}, 0 2px 8px rgba(0,0,0,0.5)`,
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          position: 'relative',
          zIndex: open ? 600 : 1,
        }}
      >
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '10px',
          fontWeight: 700,
          color: borderColor,
          letterSpacing: '0.02em',
        }}>
          {items.length}
        </span>

        {isMulti && (
          <span style={{
            position: 'absolute',
            bottom: '-3px',
            right: '-3px',
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: 'rgba(20,18,12,0.95)',
            border: `1px solid ${borderColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '7px',
            color: borderColor,
            fontWeight: 700,
          }}>
            {items.length}
          </span>
        )}
      </button>

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
                <span style={{ fontSize: '16px', lineHeight: 1.2, flexShrink: 0 }}>
                  {getSceneIcon(item.category)}
                </span>
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
