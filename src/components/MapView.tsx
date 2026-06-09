import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useGameStore } from '../stores/gameStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useWeekStore } from '../stores/weekStore'
import type { GameState } from '../types/gameState'
import { MAP_RENDER_WIDTH, MAP_RENDER_HEIGHT, PROVINCE_PIN_POSITIONS } from '../engine/LocationResolver'
import { MapPins } from './MapInteractionLayer'
import veltriaMapImg from '../assets/images/veltria_map_full.jpeg'

// ─── Province click zones (pixel-based, relative to map image dimensions) ─────

interface ProvinceZone {
  id: string
  name: string
  label: string
  left: number; top: number; width: number; height: number
  primaryFaction: keyof GameState['factions']
}

const PROVINCE_ZONES: ProvinceZone[] = [
  { id: 'ashenmere',    name: 'Ashenmere',    label: 'Capital Region',
    left: Math.round(MAP_RENDER_WIDTH * 0.42), top: Math.round(MAP_RENDER_HEIGHT * 0.36),
    width: Math.round(MAP_RENDER_WIDTH * 0.18), height: Math.round(MAP_RENDER_HEIGHT * 0.22),
    primaryFaction: 'reformists' },
  { id: 'kravenstal',   name: 'Kravenstal',   label: 'Industrial Heartland',
    left: Math.round(MAP_RENDER_WIDTH * 0.20), top: Math.round(MAP_RENDER_HEIGHT * 0.34),
    width: Math.round(MAP_RENDER_WIDTH * 0.20), height: Math.round(MAP_RENDER_HEIGHT * 0.24),
    primaryFaction: 'workersCoalition' },
  { id: 'thornfeld',    name: 'Thornfeld',    label: 'Agricultural South',
    left: Math.round(MAP_RENDER_WIDTH * 0.22), top: Math.round(MAP_RENDER_HEIGHT * 0.55),
    width: Math.round(MAP_RENDER_WIDTH * 0.20), height: Math.round(MAP_RENDER_HEIGHT * 0.20),
    primaryFaction: 'halvekists' },
  { id: 'sevagrad',     name: 'Sevagrad',     label: 'Eastern Border',
    left: Math.round(MAP_RENDER_WIDTH * 0.62), top: Math.round(MAP_RENDER_HEIGHT * 0.36),
    width: Math.round(MAP_RENDER_WIDTH * 0.18), height: Math.round(MAP_RENDER_HEIGHT * 0.24),
    primaryFaction: 'ironCovenant' },
  { id: 'aldenmoor',    name: 'Aldenmoor',    label: 'Amber Coast',
    left: Math.round(MAP_RENDER_WIDTH * 0.45), top: Math.round(MAP_RENDER_HEIGHT * 0.58),
    width: Math.round(MAP_RENDER_WIDTH * 0.20), height: Math.round(MAP_RENDER_HEIGHT * 0.20),
    primaryFaction: 'businessClass' },
  { id: 'dravenhollow', name: 'Dravenhollow', label: 'Northern Mountains',
    left: Math.round(MAP_RENDER_WIDTH * 0.40), top: Math.round(MAP_RENDER_HEIGHT * 0.14),
    width: Math.round(MAP_RENDER_WIDTH * 0.22), height: Math.round(MAP_RENDER_HEIGHT * 0.22),
    primaryFaction: 'dravenni' },
]

const FACTION_LABELS: Record<string, string> = {
  reformists: 'Reformist', workersCoalition: "Workers' Coalition", halvekists: 'Halvekist',
  ironCovenant: 'Iron Covenant', church: 'Church', businessClass: 'Business', dravenni: 'Dravenni',
}

// ─── Status computation ──────────────────────────────────────────────────────

function stance(score: number): string {
  if (score >= 68) return 'Strongly Supportive'
  if (score >= 52) return 'Supportive'
  if (score >= 36) return 'Neutral'
  if (score >= 20) return 'Skeptical'
  return 'Hostile'
}

function computeCrisisLevel(provinceId: string, state: GameState, flags: string[]): 0 | 1 | 2 {
  const { nation: n, factions: f } = state
  switch (provinceId) {
    case 'kravenstal':
      return n.unemployment > 28 || f.workersCoalition < 22 ? 2
        : n.unemployment > 22 || f.workersCoalition < 36 ? 1 : 0
    case 'dravenhollow':
      return f.dravenni < 20 || flags.includes('bni_weaponized') ? 2
        : f.dravenni < 38 || n.civilLiberties < 28 ? 1 : 0
    case 'ashenmere':
      return n.corruption > 78 || n.publicOrder < 28 || n.pressFreedom < 14 ? 2
        : n.corruption > 60 || n.publicOrder < 44 || n.pressFreedom < 26 ? 1 : 0
    case 'sevagrad':
      return n.militaryReadiness < 28 || (n.publicOrder < 28 && n.internationalStanding < 26) ? 2
        : n.militaryReadiness < 44 || n.internationalStanding < 36 ? 1 : 0
    case 'thornfeld':
      return f.halvekists < 18 || (n.publicOrder < 32 && f.church < 22) ? 2
        : f.halvekists > 72 || f.church < 30 || n.publicOrder < 44 ? 1 : 0
    case 'aldenmoor':
      return f.businessClass < 18 || n.economyHealth < -62 ? 2
        : f.businessClass < 32 || n.economyHealth < -28 ? 1 : 0
    default: return 0
  }
}

// ─── Province tooltip ────────────────────────────────────────────────────────

function HoverLabel({ zone, crisisLevel, onOpenDetail, mouseX, mouseY }: {
  zone: ProvinceZone
  crisisLevel: 0 | 1 | 2
  onOpenDetail: () => void
  mouseX: number; mouseY: number
}) {
  const crisisLabel = crisisLevel === 2 ? 'Crisis' : crisisLevel === 1 ? 'Tense' : 'Stable'
  const crisisColor = crisisLevel === 2 ? 'var(--accent-red)' : crisisLevel === 1 ? '#c47a3a' : 'var(--accent-green)'
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)

  const vw = typeof window !== 'undefined' ? window.innerWidth : 1920
  const vh = typeof window !== 'undefined' ? window.innerHeight : 1080
  const tipW = 240; const tipH = 130
  let left = mouseX + 16; let top = mouseY - 20
  if (left + tipW > vw - 20) left = mouseX - tipW - 16
  if (top + tipH > vh - 20) top = vh - tipH - 20
  if (top < 20) top = 20

  return (
    <div style={{
      position: 'fixed', left, top, zIndex: 10001,
      minWidth: '220px', maxWidth: '250px',
      background: 'rgba(12,10,8,0.95)',
      border: '1px solid rgba(200,144,42,0.4)',
      borderRadius: '2px',
      pointerEvents: 'all',
      boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
    }}>
      <div style={{ padding: '10px 14px 6px', borderBottom: '1px solid rgba(200,144,42,0.15)' }}>
        <p style={{
          fontFamily: "'Playfair Display', serif", fontSize: '0.95rem', fontWeight: 600,
          color: 'var(--cream)', margin: 0, lineHeight: 1.2,
        }}>
          {zone.name}
        </p>
        <p style={{
          fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.55rem',
          color: 'var(--amber-dim)', margin: '2px 0 0', letterSpacing: '0.06em',
        }}>
          {zone.label} · <span style={{ color: crisisColor }}>{crisisLabel}</span>
        </p>
      </div>
      <div style={{ padding: '4px 0' }}>
        <TooltipRow index={0} hoveredRow={hoveredRow} onHover={setHoveredRow}
          onClick={onOpenDetail} icon={<span style={{ fontSize: '0.7rem' }}>🔍</span>} label="Open Province Info" />
        {crisisLevel > 0 && (
          <TooltipRow index={1} hoveredRow={hoveredRow} onHover={setHoveredRow}
            onClick={onOpenDetail} icon={<span style={{ fontSize: '0.7rem' }}>📋</span>}
            label={`View Active Events (${crisisLevel})`} />
        )}
      </div>
    </div>
  )
}

function TooltipRow({ index, hoveredRow, onHover, onClick, icon, label }: {
  index: number; hoveredRow: number | null; onHover: (i: number | null) => void
  onClick: () => void; icon: React.ReactNode; label: string
}) {
  return (
    <button onClick={onClick} onMouseEnter={() => onHover(index)} onMouseLeave={() => onHover(null)}
      style={{
        display: 'flex', alignItems: 'center', gap: '8px', width: '100%', textAlign: 'left',
        background: hoveredRow === index ? 'rgba(200,144,42,0.1)' : 'transparent',
        border: 'none', cursor: 'pointer', padding: '6px 14px',
        color: hoveredRow === index ? 'var(--amber)' : 'var(--muted)',
        fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.55rem',
        letterSpacing: '0.04em', transition: 'all 0.12s',
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

// ─── Map Header ──────────────────────────────────────────────────────────────

const HEADER_H = 42

function MapHeader({ currentWeek, onClose }: { currentWeek: number; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10010,
      height: `${HEADER_H}px`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 2rem',
      background: 'rgba(10,8,6,0.95)',
      borderBottom: '1px solid rgba(200,144,42,0.2)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '0.8rem', letterSpacing: '0.08em', color: 'var(--amber)', fontStyle: 'italic' }}>
          Republic of Veltria — Strategic Overview
        </span>
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.58rem', letterSpacing: '0.12em', color: 'var(--muted)' }}>
          Week {currentWeek} · 1963
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontSize: '0.52rem', letterSpacing: '0.08em', color: 'var(--muted)' }}>
          Drag to pan · hover provinces · M to close
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: '1px solid var(--border)', color: 'var(--muted)',
            cursor: 'pointer', padding: '0.3rem 0.8rem', fontSize: '0.58rem',
            letterSpacing: '0.1em', fontFamily: "'IBM Plex Mono', monospace", transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--amber)'; e.currentTarget.style.color = 'var(--amber)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)' }}
        >
          CLOSE MAP
        </button>
      </div>
    </div>
  )
}

// ─── Pan helpers ─────────────────────────────────────────────────────────────

function clampPan(x: number, y: number): { x: number; y: number } {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1920
  const vh = typeof window !== 'undefined' ? window.innerHeight : 1080
  return {
    x: Math.max(vw - MAP_RENDER_WIDTH, Math.min(0, x)),
    y: Math.max(vh - MAP_RENDER_HEIGHT, Math.min(0, y)),
  }
}

function centeredOnAshenmere(): { x: number; y: number } {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1920
  const vh = typeof window !== 'undefined' ? window.innerHeight : 1080
  const ash = PROVINCE_PIN_POSITIONS.ashenmere
  return clampPan(
    Math.round(vw / 2 - ash.x),
    Math.round(vh / 2 - ash.y),
  )
}

// ─── Main MapView ─────────────────────────────────────────────────────────────

export default function MapView({ onProvinceDetail }: {
  onProvinceDetail?: (id: string) => void
}) {
  const mapOpen    = useSettingsStore(s => s.mapOpen)
  const setMapOpen = useSettingsStore(s => s.setMapOpen)
  const phase      = useWeekStore(s => s.phase)
  const currentWeek = useGameStore(s => s.currentWeek)
  const gameState  = useGameStore()
  const factions   = useGameStore(s => s.factions)
  const { activeFlags } = useNarrativeStore()

  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [mousePos, setMousePos]   = useState({ x: 0, y: 0 })

  const [pan, setPan] = useState({ x: 0, y: 0 })
  const dragging    = useRef(false)
  const dragOrigin  = useRef({ mx: 0, my: 0, px: 0, py: 0 })
  const hasDragged  = useRef(false)
  const [isCursorGrabbing, setIsCursorGrabbing] = useState(false)

  // Center on Ashenmere on first mount
  useEffect(() => {
    setPan(centeredOnAshenmere())
  }, [])

  // Re-center when map overlay opens
  useEffect(() => {
    if (mapOpen) setPan(centeredOnAshenmere())
  }, [mapOpen])

  const statuses = useMemo(() => {
    const map = new Map<string, 0 | 1 | 2>()
    for (const p of PROVINCE_ZONES) map.set(p.id, computeCrisisLevel(p.id, gameState, activeFlags))
    return map
  }, [gameState, activeFlags])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    dragging.current = true
    hasDragged.current = false
    dragOrigin.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y }
    setIsCursorGrabbing(true)
  }, [pan])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current) return
    const dx = e.clientX - dragOrigin.current.mx
    const dy = e.clientY - dragOrigin.current.my
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDragged.current = true
    setPan(clampPan(dragOrigin.current.px + dx, dragOrigin.current.py + dy))
  }, [])

  const onMouseUp = useCallback(() => {
    dragging.current = false
    setIsCursorGrabbing(false)
  }, [])

  const isGameplay = phase !== 'title' && phase !== 'customization' && phase !== 'prologue' && phase !== 'epilogue'
  if (!isGameplay) return null

  function handleOpenDetail(id: string) {
    if (hasDragged.current) return
    onProvinceDetail?.(id)
  }

  function handleHover(id: string | null, x: number, y: number) {
    if (dragging.current) return
    setHoveredId(id)
    setMousePos({ x, y })
  }

  const hoveredZone = hoveredId ? PROVINCE_ZONES.find(z => z.id === hoveredId) ?? null : null

  // ── Background mode: map behind game UI, centered, not pannable ─────────────
  if (!mapOpen) {
    const bgPan = centeredOnAshenmere()
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        overflow: 'hidden', zIndex: 0,
        background: '#7a9aaa',
        cursor: 'default',
      }}>
        {/* Transform div: map image + scene pins move together */}
        <div style={{
          position: 'absolute',
          transform: `translate(${bgPan.x}px, ${bgPan.y}px)`,
          willChange: 'transform',
          userSelect: 'none',
        }}>
          <img
            src={veltriaMapImg}
            alt="Veltria Map"
            draggable={false}
            style={{
              display: 'block',
              width: `${MAP_RENDER_WIDTH}px`,
              height: `${MAP_RENDER_HEIGHT}px`,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
          {/* Scene pins — absolute inside transform, move with map */}
          <MapPins />
        </div>

        {/* Province medallions — fixed, computed from bgPan */}
        {PROVINCE_ZONES.map(zone => {
          const crisisLevel = statuses.get(zone.id) ?? 0
          const isUrgent = crisisLevel === 2
          const isTense = crisisLevel === 1
          const borderColor = isUrgent ? 'rgba(220,60,40,0.9)' : isTense ? 'rgba(201,168,76,0.9)' : '#c9a84c'
          const anim = isUrgent ? 'event-pulse-urgent 1.2s ease-in-out infinite'
            : isTense ? 'event-pulse 2s ease-in-out infinite' : undefined
          const icon = isUrgent ? '⚠' : isTense ? '📋' : '✦'
          const cx = bgPan.x + zone.left + zone.width / 2
          const cy = bgPan.y + zone.top + zone.height / 2
          return (
            <button
              key={zone.id}
              onClick={() => handleOpenDetail(zone.id)}
              onMouseEnter={(e) => handleHover(zone.id, e.clientX, e.clientY)}
              onMouseMove={(e) => { if (hoveredId === zone.id) handleHover(zone.id, e.clientX, e.clientY) }}
              onMouseLeave={() => handleHover(null, 0, 0)}
              style={{
                position: 'fixed',
                left: cx - 22, top: cy - 22,
                width: '44px', height: '44px',
                background: 'transparent', border: 'none', cursor: 'pointer',
                pointerEvents: 'all', padding: 0, zIndex: 5,
              }}
            >
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                background: 'rgba(20,18,12,0.85)',
                border: '2px solid #c9a84c',
                outline: '1px solid rgba(201,168,76,0.3)', outlineOffset: '3px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isUrgent
                  ? '0 0 16px rgba(220,60,40,0.4), 0 2px 8px rgba(0,0,0,0.5)'
                  : '0 0 8px rgba(201,168,76,0.3), 0 2px 6px rgba(0,0,0,0.4)',
                animation: anim, color: borderColor,
              }}>
                <span style={{ fontSize: '18px' }}>{icon}</span>
              </div>
              <span style={{
                position: 'absolute', bottom: '-16px', left: '50%',
                transform: 'translateX(-50%)',
                fontFamily: "'Special Elite', monospace", fontSize: '9px', fontWeight: 700,
                color: '#c9a84c', letterSpacing: '2px', textTransform: 'uppercase',
                textShadow: '1px 1px 3px rgba(0,0,0,0.9)', whiteSpace: 'nowrap', pointerEvents: 'none',
              }}>
                {zone.name}
              </span>
            </button>
          )
        })}
        {hoveredId && hoveredZone && (
          <HoverLabel
            zone={hoveredZone}
            crisisLevel={statuses.get(hoveredZone.id) ?? 0}
            onOpenDetail={() => handleOpenDetail(hoveredZone.id)}
            mouseX={mousePos.x} mouseY={mousePos.y}
          />
        )}
      </div>
    )
  }

  // ── Interactive overlay mode: full-screen pannable map ──────────────────────
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: '#7a9aaa',
      fontFamily: "'IBM Plex Mono', 'Special Elite', monospace",
    }}>
      <MapHeader currentWeek={currentWeek} onClose={() => setMapOpen(false)} />

      {/* Pannable container — covers full viewport, header floats on top */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          cursor: isCursorGrabbing ? 'grabbing' : 'grab',
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {/* Transform div: map image + zones + medallions + scene pins move together */}
        <div style={{
          position: 'absolute',
          transform: `translate(${pan.x}px, ${pan.y}px)`,
          willChange: 'transform',
          userSelect: 'none',
        }}>
          <img
            src={veltriaMapImg}
            alt="Veltria Map"
            draggable={false}
            style={{
              display: 'block',
              width: `${MAP_RENDER_WIDTH}px`,
              height: `${MAP_RENDER_HEIGHT}px`,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />

          {/* Province click zones — absolute on image, move with pan */}
          {PROVINCE_ZONES.map(zone => (
            <div
              key={zone.id}
              onMouseEnter={(e) => { e.stopPropagation(); handleHover(zone.id, e.clientX, e.clientY) }}
              onMouseMove={(e) => { e.stopPropagation(); if (hoveredId === zone.id) handleHover(zone.id, e.clientX, e.clientY) }}
              onMouseLeave={(e) => { e.stopPropagation(); handleHover(null, 0, 0) }}
              onClick={(e) => { e.stopPropagation(); handleOpenDetail(zone.id) }}
              style={{
                position: 'absolute',
                left: zone.left, top: zone.top,
                width: zone.width, height: zone.height,
                background: hoveredId === zone.id ? 'rgba(200,144,42,0.08)' : 'transparent',
                border: hoveredId === zone.id ? '1px solid rgba(200,144,42,0.2)' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'background 0.3s ease, border-color 0.3s ease',
                zIndex: hoveredId === zone.id ? 3 : 1,
                borderRadius: '2px',
              }}
            />
          ))}

          {/* Event medallions — absolute on image, move with pan */}
          {PROVINCE_ZONES.map(zone => {
            const crisisLevel = statuses.get(zone.id) ?? 0
            const isUrgent = crisisLevel === 2
            const isTense = crisisLevel === 1
            const borderColor = isUrgent ? 'rgba(220,60,40,0.9)' : isTense ? 'rgba(201,168,76,0.9)' : '#c9a84c'
            const anim = isUrgent ? 'event-pulse-urgent 1.2s ease-in-out infinite'
              : isTense ? 'event-pulse 2s ease-in-out infinite' : undefined
            const icon = isUrgent ? '⚠' : isTense ? '📋' : '✦'
            const cx = zone.left + zone.width / 2
            const cy = zone.top + zone.height / 2
            return (
              <button
                key={`med-${zone.id}`}
                onClick={(e) => { e.stopPropagation(); handleOpenDetail(zone.id) }}
                style={{
                  position: 'absolute',
                  left: cx - 22, top: cy - 22,
                  width: '44px', height: '44px',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  pointerEvents: 'all', padding: 0, zIndex: 5,
                }}
              >
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: 'rgba(20,18,12,0.85)',
                  border: '2px solid #c9a84c',
                  outline: '1px solid rgba(201,168,76,0.3)', outlineOffset: '3px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: isUrgent
                    ? '0 0 16px rgba(220,60,40,0.4), 0 2px 8px rgba(0,0,0,0.5)'
                    : '0 0 8px rgba(201,168,76,0.3), 0 2px 6px rgba(0,0,0,0.4)',
                  animation: anim, color: borderColor,
                }}>
                  <span style={{ fontSize: '18px' }}>{icon}</span>
                </div>
                <span style={{
                  position: 'absolute', bottom: '-16px', left: '50%',
                  transform: 'translateX(-50%)',
                  fontFamily: "'Special Elite', monospace", fontSize: '9px', fontWeight: 700,
                  color: '#c9a84c', letterSpacing: '2px', textTransform: 'uppercase',
                  textShadow: '1px 1px 3px rgba(0,0,0,0.9)', whiteSpace: 'nowrap', pointerEvents: 'none',
                }}>
                  {zone.name}
                </span>
              </button>
            )
          })}

          {/* Scene pins — absolute inside transform, move with map */}
          <MapPins />
        </div>
      </div>

      {/* Province list sidebar — fixed, does NOT pan */}
      <div style={{
        position: 'fixed', right: 0, top: HEADER_H, bottom: 0,
        width: '220px', background: 'rgba(12,10,8,0.95)',
        borderLeft: '1px solid rgba(200,144,42,0.2)',
        overflowY: 'auto', scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(200,144,42,0.2) transparent',
        padding: '1rem 0.5rem',
        zIndex: 10005,
      }}>
        <p style={{
          fontFamily: "'Playfair Display', serif", fontSize: '0.75rem',
          color: 'var(--amber)', margin: '0 0 0.6rem 0.5rem', letterSpacing: '0.03em', fontStyle: 'italic',
        }}>
          Provinces
        </p>
        {PROVINCE_ZONES.map(zone => {
          const crisisLevel = statuses.get(zone.id) ?? 0
          const dotColor = crisisLevel === 2 ? 'var(--accent-red)' : crisisLevel === 1 ? '#c47a3a' : 'var(--accent-green)'
          const factionScore = factions[zone.primaryFaction] ?? 40
          return (
            <button
              key={zone.id}
              onClick={() => handleOpenDetail(zone.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                padding: '0.4rem 0.5rem', marginBottom: '1px', transition: 'background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,144,42,0.05)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
            >
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
              <div style={{ textAlign: 'left', flex: 1 }}>
                <span style={{ fontFamily: "'Crimson Text', serif", fontSize: '0.72rem', color: '#d4c8b0', display: 'block' }}>
                  {zone.name}
                </span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.4rem', color: 'var(--muted)', letterSpacing: '0.04em' }}>
                  {FACTION_LABELS[zone.primaryFaction] ?? zone.primaryFaction} · {stance(factionScore)}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Hover label — fixed, always on top */}
      {hoveredId && hoveredZone && (
        <HoverLabel
          zone={hoveredZone}
          crisisLevel={statuses.get(hoveredZone.id) ?? 0}
          onOpenDetail={() => handleOpenDetail(hoveredZone.id)}
          mouseX={mousePos.x} mouseY={mousePos.y}
        />
      )}

      {/* Footer */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0.4rem 2rem', borderTop: '1px solid rgba(200,144,42,0.2)',
        background: 'rgba(10,8,6,0.95)', zIndex: 10005,
      }}>
        <span style={{ fontSize: '0.48rem', letterSpacing: '0.08em', color: 'var(--muted)', textTransform: 'uppercase' }}>
          Province status reflects current national conditions
        </span>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '0.52rem', letterSpacing: '0.06em', color: 'var(--amber-dim)', fontStyle: 'italic' }}>
          Classified — Chancellor Eyes Only
        </span>
      </div>
    </div>
  )
}
