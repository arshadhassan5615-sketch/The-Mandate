import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { AgendaItem } from '../types/week'
import type { ProvinceId } from '../engine/LocationResolver'
import { PROVINCE_PIN_POSITIONS, PROVINCE_NAMES } from '../engine/LocationResolver'
import { getScene } from '../engine/NarrativeEngine'
import { useWeekStore } from '../stores/weekStore'
import pinExclamation from '../assets/images/pins/pin_exclamation.png'

/**
 * Badge anchor relative to the province pin position.
 * X = 0 so translate(-50%, ...) aligns with the building's own horizontal center.
 * Y = −182 targets the building's top edge (140 rendered height × 1.3 translate factor).
 * May need a small manual nudge once seen against actual artwork — source images
 * can have blank margin above the visible silhouette.
 */
const BADGE_OFFSET_X = 0
const BADGE_OFFSET_Y = -150

interface MapScenePinProps {
  provinceId: ProvinceId
  items: AgendaItem[]
  currentWeek: number
  onSelectScene: (item: AgendaItem) => void
  onFocusProvince?: (id: string) => void
  onUnfocusProvince?: () => void
}

export default function MapScenePin({ provinceId, items, currentWeek, onSelectScene, onFocusProvince, onUnfocusProvince }: MapScenePinProps) {
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [sceneError, setSceneError] = useState<string | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const pos = PROVINCE_PIN_POSITIONS[provinceId]

  const phase = useWeekStore(s => s.phase)

  useEffect(() => {
    if (phase === 'scene') {
      setOpen(false)
      onUnfocusProvince?.()
    }
  }, [phase])

  const hasMandatory = items.some(i => i.slotCost === 0)
  const hasUrgent = items.some(i => i.weekDeadline === currentWeek)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false)
        onUnfocusProvince?.()
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
      left: pos.x + BADGE_OFFSET_X,
      top: pos.y + BADGE_OFFSET_Y,
      transform: `translate(-50%, -100%) scale(${hovered ? 1.15 : 1.0})`,
      transition: 'transform 0.15s ease, filter 0.15s ease',
      zIndex: open ? 600 : 300,
      cursor: 'pointer',
      filter: pinFilter,
      animation: pinAnimation,
    }}
    onClick={(e) => {
      e.stopPropagation()
      setOpen(prev => {
        const next = !prev
        if (next) onFocusProvince?.(provinceId)
        else onUnfocusProvince?.()
        return next
      })
    }}
    onMouseEnter={() => setHovered(true)}
    onMouseLeave={() => setHovered(false)}
    >
      <div style={{ position: 'relative', display: 'inline-block', pointerEvents: 'none' }}>
        {!open && (
          <img
            src={pinExclamation}
            alt=""
            draggable={false}
            style={{
              width: '80px',
              height: '80px',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
        )}
      </div>

      {createPortal(
        <AnimatePresence>
          {open && (
            <div style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 9999,
            }}>
              <motion.div
                ref={popoverRef}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 340, damping: 28, mass: 0.9 }}
                style={{
                  width: '340px',
                  background: 'rgba(10, 8, 6, 0.96)',
                  border: '1px solid rgba(200,144,42,0.35)',
                  borderRadius: '4px',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.6), 0 0 12px rgba(200,144,42,0.08)',
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
              fontSize: '11px',
              letterSpacing: '0.1em',
              color: 'var(--amber)',
              textTransform: 'uppercase',
            }}>
              {PROVINCE_NAMES[provinceId]}
            </span>
            <button
              onClick={() => { setOpen(false); onUnfocusProvince?.() }}
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
                  console.log('[DEBUG] Pin clicked, sceneId:', item.sceneId, 'sceneExists:', sceneExists)
                  if (!sceneExists) {
                    setSceneError(`Scene not found: ${item.sceneId}`)
                    return
                  }
                  setSceneError(null)
                  setOpen(false)
                  onUnfocusProvince?.()
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
                    fontSize: '15px',
                    fontWeight: 600,
                    color: '#d4c9b0',
                    lineHeight: 1.3,
                    marginBottom: '2px',
                  }}>
                    {item.title}
                  </div>
                  <div style={{
                    fontFamily: "'Crimson Text', Georgia, serif",
                    fontSize: '13px',
                    color: 'rgba(200,185,155,0.8)',
                    lineHeight: 1.4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {item.description}
                  </div>

                </div>
              </button>
              )
            })}
          </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
