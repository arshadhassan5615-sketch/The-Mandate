import { useState, useEffect, useRef } from 'react'
import type { AgendaItem } from '../types/week'
import type { ProvinceId } from '../engine/LocationResolver'
import { PROVINCE_PIN_POSITIONS, PROVINCE_NAMES } from '../engine/LocationResolver'
import { getScene } from '../engine/NarrativeEngine'
import { useWeekStore } from '../stores/weekStore'
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
  const [sceneError, setSceneError] = useState<string | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const pos = PROVINCE_PIN_POSITIONS[provinceId]

  const phase = useWeekStore(s => s.phase)

  useEffect(() => {
    if (phase === 'scene') {
      setOpen(false)
    }
  }, [phase])

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
    onClick={(e) => { e.stopPropagation(); setOpen(prev => !prev) }}
    onMouseEnter={() => setHovered(true)}
    onMouseLeave={() => setHovered(false)}
    >
      <img
        src={mapPinImg}
        alt={PROVINCE_NAMES[provinceId] ?? provinceId}
        style={{
          width: '48px',
          height: 'auto',
          display: 'block',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
        draggable={false}
      />

      {open && (
        <div
          ref={popoverRef}
          style={{
            position: 'absolute',
            bottom: '110%',
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
            {sceneError && (
              <div style={{
                padding: '10px 12px',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '10px',
                color: 'var(--accent-red)',
                letterSpacing: '0.04em',
              }}>
                {sceneError}
              </div>
            )}
            {items.map(item => {
              const sceneExists = item.sceneId.startsWith('__') || !!getScene(item.sceneId)
              return (
              <button
                key={item.id}
                onClick={(e) => {
                  e.stopPropagation()
                  if (!sceneExists) {
                    setSceneError(`Scene not found: ${item.sceneId}`)
                    return
                  }
                  setSceneError(null)
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
                  cursor: sceneExists ? 'pointer' : 'not-allowed',
                  textAlign: 'left',
                  transition: 'background 0.12s ease',
                  opacity: sceneExists ? 1 : 0.5,
                }}
                onMouseEnter={e => { if (sceneExists) e.currentTarget.style.background = 'rgba(200,144,42,0.06)' }}
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
                    marginTop: '4px',
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '8px',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: item.slotCost === 0 ? 'var(--amber)' : 'rgba(200,185,155,0.35)',
                  }}>
                    {item.slotCost === 0 ? '★ Mandatory' : 'Optional'}
                  </div>
                </div>
              </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
