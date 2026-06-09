import { useState, useEffect, useRef } from 'react'
import type { AgendaItem } from '../types/week'
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../types/week'
import type { ProvinceId } from '../engine/LocationResolver'
import { PROVINCE_PIN_POSITIONS, PROVINCE_NAMES } from '../engine/LocationResolver'
import mapPinImg from '../assets/images/map_pin.png'

interface MapScenePinProps {
  provinceId: ProvinceId
  items: AgendaItem[]
  currentWeek: number
  onSelectScene: (item: AgendaItem) => void
}

export default function MapScenePin({ provinceId, items, currentWeek, onSelectScene }: MapScenePinProps) {
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const pos = PROVINCE_PIN_POSITIONS[provinceId]

  const hasMandatory = items.some(i => i.slotCost === 0)
  const hasUrgent = items.some(i => i.weekDeadline === currentWeek)

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

  const isPulsing = hasMandatory
  const pinFilter = hasUrgent
    ? 'drop-shadow(0 0 12px rgba(220,60,60,0.9))'
    : isPulsing
      ? 'drop-shadow(0 0 12px rgba(201,168,76,0.9))'
      : 'drop-shadow(0 0 6px rgba(201,168,76,0.5))'

  const pinAnimation = hasUrgent
    ? 'medallion-pulse-red 2s ease-in-out infinite'
    : isPulsing
      ? 'medallion-pulse 2s ease-in-out infinite'
      : undefined

  return (
    <div style={{
      position: 'absolute',
      left: pos.x,
      top: pos.y,
      transform: `translate(-50%, -100%) scale(${hovered ? 1.15 : 1.0})`,
      transition: 'transform 0.15s ease, filter 0.15s ease',
      zIndex: open ? 600 : 300,
      cursor: 'pointer',
      filter: pinFilter,
      animation: pinAnimation,
    }}
    onClick={() => setOpen(prev => !prev)}
    onMouseEnter={() => setHovered(true)}
    onMouseLeave={() => setHovered(false)}
    >
      <img
        src={mapPinImg}
        alt={PROVINCE_NAMES[provinceId] ?? provinceId}
        style={{
          width: '64px',
          height: 'auto',
          display: 'block',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
        draggable={false}
      />

      {/* Province name label below pin */}
      <div style={{
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginTop: '4px',
        color: '#c9a84c',
        fontFamily: "'Special Elite', monospace",
        fontSize: '10px',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        textShadow: '0 1px 3px rgba(0,0,0,0.9)',
        pointerEvents: 'none',
      }}>
        {PROVINCE_NAMES[provinceId] ?? provinceId}
      </div>

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
