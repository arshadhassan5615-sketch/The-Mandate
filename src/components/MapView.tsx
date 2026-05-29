import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useGameStore } from '../stores/gameStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useWeekStore } from '../stores/weekStore'
import type { GameState } from '../types/gameState'

// ─── Province click zones (percentage-based) ─────────────────────────────────

interface ProvinceZone {
  id: string
  name: string
  label: string
  top: string; left: string; width: string; height: string
  primaryFaction: keyof GameState['factions']
}

const PROVINCE_ZONES: ProvinceZone[] = [
  { id: 'ashenmere',    name: 'Ashenmere',    label: 'Capital Region',       top: '46%', left: '52%', width: '16%', height: '14%', primaryFaction: 'reformists' },
  { id: 'kravenstal',   name: 'Kravenstal',  label: 'Industrial Heartland',  top: '44%', left: '28%', width: '16%', height: '14%', primaryFaction: 'workersCoalition' },
  { id: 'thornfeld',    name: 'Thornfeld',    label: 'Agricultural South',    top: '65%', left: '35%', width: '16%', height: '14%', primaryFaction: 'halvekists' },
  { id: 'sevagrad',     name: 'Sevagrad',     label: 'Eastern Border',        top: '50%', left: '76%', width: '16%', height: '14%', primaryFaction: 'ironCovenant' },
  { id: 'aldenmoor',    name: 'Aldenmoor',    label: 'Amber Coast',           top: '68%', left: '58%', width: '16%', height: '14%', primaryFaction: 'businessClass' },
  { id: 'dravenhollow', name: 'Dravenhollow', label: 'Northern Mountains',    top: '28%', left: '47%', width: '16%', height: '14%', primaryFaction: 'dravenni' },
]

const FACTION_TINT: Record<string, string> = {
  reformists: '58,90,124', workersCoalition: '139,46,46', halvekists: '100,100,100',
  ironCovenant: '74,107,58', church: '155,123,58', businessClass: '90,122,90', dravenni: '123,90,58',
}

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

// ─── Province tooltip ───────────────────────────────────────────────────────

function ProvinceTooltip({ zone, crisisLevel, factionScore, factions, onOpenDetail, mouseX, mouseY }: {
  zone: ProvinceZone
  crisisLevel: 0 | 1 | 2
  factionScore: number
  factions: GameState['factions']
  onOpenDetail: () => void
  mouseX: number; mouseY: number
}) {
  const crisisLabel = crisisLevel === 2 ? 'Crisis' : crisisLevel === 1 ? 'Tense' : 'Stable'
  const crisisColor = crisisLevel === 2 ? 'var(--accent-red)' : crisisLevel === 1 ? '#c47a3a' : 'var(--accent-green)'
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)

  // Prevent tooltip from going off-screen
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
      {/* Header */}
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

      {/* Menu items */}
      <div style={{ padding: '4px 0' }}>
        <TooltipRow
          index={0}
          hoveredRow={hoveredRow}
          onHover={setHoveredRow}
          onClick={onOpenDetail}
          icon={<span style={{ fontSize: '0.7rem' }}>🔍</span>}
          label="Open Province Info"
        />
        {crisisLevel > 0 && (
          <TooltipRow
            index={1}
            hoveredRow={hoveredRow}
            onHover={setHoveredRow}
            onClick={onOpenDetail}
            icon={<span style={{ fontSize: '0.7rem' }}>📋</span>}
            label={`View Active Events (${crisisLevel})`}
          />
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
    <button
      onClick={onClick}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
      style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        width: '100%', textAlign: 'left',
        background: hoveredRow === index ? 'rgba(200,144,42,0.1)' : 'transparent',
        border: 'none', cursor: 'pointer',
        padding: '6px 14px',
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

// ─── Event medallion ────────────────────────────────────────────────────────

function EventMedallion({ zone, crisisLevel, onOpenDetail }: {
  zone: ProvinceZone
  crisisLevel: 0 | 1 | 2
  onOpenDetail: () => void
}) {
  const isUrgent = crisisLevel === 2
  const isTense = crisisLevel === 1
  const isStable = crisisLevel === 0

  const size = isStable ? '16px' : '48px'
  const borderWidth = isStable ? '1px' : '2.5px'
  const borderColor = isStable ? 'rgba(200,144,42,0.25)' : 'rgba(200,144,42,0.6)'
  const bgOpacity = isStable ? '0.5' : '0.92'
  const animation = isUrgent ? 'event-pulse-urgent 1.2s ease-in-out infinite'
    : isTense ? 'event-pulse 2s ease-in-out infinite' : undefined
  const icon = isStable ? '' : isUrgent ? '⚠' : '📋'

  return (
    <button
      onClick={onOpenDetail}
      style={{
        position: 'absolute',
        top: zone.top, left: zone.left,
        width: zone.width, height: zone.height,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', border: 'none', cursor: 'pointer',
        pointerEvents: 'all',
      }}
    >
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: `rgba(20,15,8,${bgOpacity})`,
        border: `${borderWidth} solid ${borderColor}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: isStable
          ? '0 1px 4px rgba(0,0,0,0.3)'
          : isUrgent
            ? '0 0 20px rgba(200,144,42,0.4), 0 2px 8px rgba(0,0,0,0.5)'
            : '0 2px 8px rgba(0,0,0,0.4)',
        animation,
        color: 'var(--amber)',
        transition: 'transform 0.2s ease',
      }}>
        {icon && <span style={{ fontSize: '18px' }}>{icon}</span>}
      </div>
    </button>
  )
}

// ─── Province click zone ────────────────────────────────────────────────────

function ProvinceClickZone({ zone, crisisLevel, factionScore, factions, onHover, onOpenDetail, hoveredId }: {
  zone: ProvinceZone
  crisisLevel: 0 | 1 | 2
  factionScore: number
  factions: GameState['factions']
  onHover: (id: string | null, x: number, y: number) => void
  onOpenDetail: (id: string) => void
  hoveredId: string | null
}) {
  const isHovered = hoveredId === zone.id

  return (
    <div
      onMouseEnter={(e) => onHover(zone.id, e.clientX, e.clientY)}
      onMouseMove={(e) => { if (isHovered) onHover(zone.id, e.clientX, e.clientY) }}
      onMouseLeave={() => onHover(null, 0, 0)}
      onClick={() => onOpenDetail(zone.id)}
      style={{
        position: 'absolute',
        top: zone.top, left: zone.left,
        width: zone.width, height: zone.height,
        background: isHovered ? 'rgba(200,144,42,0.08)' : 'transparent',
        border: isHovered ? '1px solid rgba(200,144,42,0.2)' : '1px solid transparent',
        cursor: 'pointer',
        transition: 'background 0.3s ease, border-color 0.3s ease',
        pointerEvents: 'all',
        zIndex: isHovered ? 3 : 1,
        borderRadius: '2px',
      }}
    />
  )
}

// ─── Neighbor markers ───────────────────────────────────────────────────────

function NeighborMarker({ label, top, left, tension }: {
  label: string
  top: string
  left: string
  tension?: 'high' | 'normal'
}) {
  return (
    <div style={{
      position: 'absolute', top, left,
      fontFamily: "'Special Elite', monospace",
      fontSize: '11px', letterSpacing: '2px',
      textTransform: 'uppercase',
      color: tension === 'high' ? 'rgba(200,80,60,0.5)' : 'rgba(255,255,255,0.5)',
      pointerEvents: 'none',
      textShadow: '0 0 8px rgba(0,0,0,0.8)',
      animation: tension === 'high' ? 'event-pulse 2.5s ease-in-out infinite' : undefined,
    }}>
      {label}
    </div>
  )
}

// ─── Map Header ─────────────────────────────────────────────────────────────

function MapHeader({ currentWeek, onClose }: { currentWeek: number; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0.6rem 2rem',
      background: 'rgba(10,8,6,0.95)',
      borderBottom: '1px solid rgba(200,144,42,0.2)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <span style={{
          fontFamily: "'Playfair Display', serif", fontSize: '0.8rem',
          letterSpacing: '0.08em', color: 'var(--amber)', fontStyle: 'italic',
        }}>
          Republic of Veltria — Strategic Overview
        </span>
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.58rem',
          letterSpacing: '0.12em', color: 'var(--muted)',
        }}>
          Week {currentWeek} · 1963
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontSize: '0.52rem', letterSpacing: '0.08em', color: 'var(--muted)' }}>
          Hover provinces for info · M to close
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: '1px solid var(--border)', color: 'var(--muted)',
            cursor: 'pointer', padding: '0.3rem 0.8rem', fontSize: '0.58rem',
            letterSpacing: '0.1em', fontFamily: "'IBM Plex Mono', monospace",
            transition: 'all 0.15s',
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

// ─── Main MapView ────────────────────────────────────────────────────────────

export default function MapView({ backgroundImage, onProvinceDetail }: {
  backgroundImage: string
  onProvinceDetail?: (id: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  const mapOpen = useSettingsStore(s => s.mapOpen)
  const setMapOpen = useSettingsStore(s => s.setMapOpen)
  const phase = useWeekStore(s => s.phase)
  const currentWeek = useGameStore(s => s.currentWeek)
  const gameState = useGameStore()
  const factions = useGameStore(s => s.factions)
  const militaryReadiness = useGameStore(s => s.nation.militaryReadiness)
  const { activeFlags } = useNarrativeStore()

  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  // ─── Drag/pan state ─────────────────────────────────────────────────────
  const [offset, setOffset] = useState({ x: -200, y: -100 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [lastOffset, setLastOffset] = useState({ x: -200, y: -100 })
  const hasDragged = useRef(false)
  const velocity = useRef({ x: 0, y: 0 })
  const lastPos = useRef({ x: 0, y: 0 })
  const animFrameRef = useRef<number>()

  const IMG_SCALE = 1.8

  const clampOffset = useCallback((newOffset: { x: number; y: number }) => {
    const container = containerRef.current
    if (!container) return newOffset
    const cw = container.offsetWidth
    const ch = container.offsetHeight
    const iw = cw * IMG_SCALE
    const ih = iw * (9 / 16)
    const maxX = 0
    const minX = cw - iw
    const maxY = 0
    const minY = ch - ih
    return {
      x: Math.max(minX, Math.min(maxX, newOffset.x)),
      y: Math.max(minY, Math.min(maxY, newOffset.y)),
    }
  }, [])

  // ─── Initial center on Veltria ──────────────────────────────────────────
  useEffect(() => {
    const doInit = () => {
      const container = containerRef.current
      if (!container) return
      const cw = container.offsetWidth
      const ch = container.offsetHeight
      const iw = cw * IMG_SCALE
      const ih = iw * (9 / 16)
      const vx = iw * 0.52
      const vy = ih * 0.46
      const ix = cw / 2 - vx
      const iy = ch / 2 - vy
      const clamped = clampOffset({ x: ix, y: iy })
      setOffset(clamped)
      setLastOffset(clamped)
    }
    const t = setTimeout(doInit, 100)
    return () => clearTimeout(t)
  }, [clampOffset])

  // ─── Drag handlers ──────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    hasDragged.current = false
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    setLastOffset(offset)
    lastPos.current = { x: e.clientX, y: e.clientY }
    velocity.current = { x: 0, y: 0 }
  }, [offset])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDragged.current = true
    setOffset(clampOffset({ x: lastOffset.x + dx, y: lastOffset.y + dy }))
    velocity.current = { x: e.clientX - lastPos.current.x, y: e.clientY - lastPos.current.y }
    lastPos.current = { x: e.clientX, y: e.clientY }
  }, [isDragging, dragStart, lastOffset, clampOffset])

  const applyMomentum = useCallback(() => {
    velocity.current.x *= 0.92
    velocity.current.y *= 0.92
    if (Math.abs(velocity.current.x) < 0.3 && Math.abs(velocity.current.y) < 0.3) return
    setOffset(prev => clampOffset({
      x: prev.x + velocity.current.x,
      y: prev.y + velocity.current.y,
    }))
    animFrameRef.current = requestAnimationFrame(applyMomentum)
  }, [clampOffset])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    animFrameRef.current = requestAnimationFrame(applyMomentum)
  }, [applyMomentum])

  // ─── Touch handlers ─────────────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    hasDragged.current = false
    setIsDragging(true)
    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })
    setLastOffset(offset)
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    velocity.current = { x: 0, y: 0 }
  }, [offset])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return
    e.preventDefault()
    const dx = e.touches[0].clientX - dragStart.x
    const dy = e.touches[0].clientY - dragStart.y
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDragged.current = true
    setOffset(clampOffset({ x: lastOffset.x + dx, y: lastOffset.y + dy }))
    velocity.current = { x: e.touches[0].clientX - lastPos.current.x, y: e.touches[0].clientY - lastPos.current.y }
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }, [isDragging, dragStart, lastOffset, clampOffset])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
    animFrameRef.current = requestAnimationFrame(applyMomentum)
  }, [applyMomentum])

  // ─── Non-passive wheel handler (trackpad + scroll wheel pan) ───────────
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const handleWheelNative = (e: WheelEvent) => {
      e.preventDefault()
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      setOffset(prev => {
        const clamped = clampOffset({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        })
        setLastOffset(clamped)
        return clamped
      })
    }
    container.addEventListener('wheel', handleWheelNative, { passive: false })
    return () => container.removeEventListener('wheel', handleWheelNative)
  }, [clampOffset, mapOpen])

  // ─── Cleanup momentum animation on unmount ────────────────────────────
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  // ─── Status computation ─────────────────────────────────────────────────
  const statuses = useMemo(() => {
    const map = new Map<string, 0 | 1 | 2>()
    for (const p of PROVINCE_ZONES) {
      map.set(p.id, computeCrisisLevel(p.id, gameState, activeFlags))
    }
    return map
  }, [gameState, activeFlags])

  const isGameplay = phase !== 'title' && phase !== 'customization' && phase !== 'prologue' && phase !== 'epilogue'
  if (!isGameplay) return null

  const tyvarenTension = militaryReadiness < 44

  function handleOpenDetail(id: string) {
    if (hasDragged.current) return
    onProvinceDetail?.(id)
  }

  function handleHover(id: string | null, x: number, y: number) {
    if (isDragging) return
    setHoveredId(id)
    setMousePos({ x, y })
  }

  const hoveredZone = hoveredId ? PROVINCE_ZONES.find(z => z.id === hoveredId) ?? null : null

  // ─── Shared map content (img + overlays) ────────────────────────────────
  const mapContent = (
    <>
      <img
        src={backgroundImage}
        alt="Veltria Map"
        draggable={false}
        style={{
          position: 'absolute',
          width: '180%',
          height: 'auto',
          minHeight: '100vh',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      />

      {/* Province click zones — inside image so they move with it */}
      {PROVINCE_ZONES.map(zone => {
        const crisisLevel = statuses.get(zone.id) ?? 0
        const factionScore = factions[zone.primaryFaction] ?? 40
        return (
          <ProvinceClickZone
            key={zone.id}
            zone={zone}
            crisisLevel={crisisLevel}
            factionScore={factionScore}
            factions={factions}
            onHover={handleHover}
            onOpenDetail={handleOpenDetail}
            hoveredId={hoveredId}
          />
        )
      })}

      {/* Event medallions */}
      {PROVINCE_ZONES.map(zone => {
        const crisisLevel = statuses.get(zone.id) ?? 0
        return (
          <EventMedallion
            key={`med-${zone.id}`}
            zone={zone}
            crisisLevel={crisisLevel}
            onOpenDetail={() => handleOpenDetail(zone.id)}
          />
        )
      })}

      {/* Neighbor nation labels */}
      <NeighborMarker label="Tyvaren Confederation" top="8%" left="38%" tension={tyvarenTension ? 'high' : 'normal'} />
      <NeighborMarker label="Lytheira" top="42%" left="3%" />
      <NeighborMarker label="Morivask" top="42%" left="88%" />
      <NeighborMarker label="Thalassic Sea" top="88%" left="40%" />

      {/* Tyvaren tension overlay */}
      {tyvarenTension && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '18%',
          background: 'linear-gradient(to bottom, rgba(180,40,30,0.06) 0%, transparent 100%)',
          pointerEvents: 'none',
          borderBottom: '1px solid rgba(180,80,50,0.1)',
          animation: 'event-pulse-urgent 2s ease-in-out infinite',
        }} />
      )}

      {/* Tooltip */}
      {hoveredZone && (
        <ProvinceTooltip
          zone={hoveredZone}
          crisisLevel={statuses.get(hoveredZone.id) ?? 0}
          factionScore={factions[hoveredZone.primaryFaction] ?? 40}
          factions={factions}
          onOpenDetail={() => handleOpenDetail(hoveredZone.id)}
          mouseX={mousePos.x}
          mouseY={mousePos.y}
        />
      )}
    </>
  )

  // ── Background mode (always visible) ──
  if (!mapOpen) {
    return (
      <div
        ref={containerRef}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          width: '100vw', height: '100vh',
          overflow: 'hidden', zIndex: 0,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div style={{
          position: 'absolute', inset: 0,
          transform: `translate(${offset.x}px, ${offset.y}px)`,
          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
        }}>
          {mapContent}
        </div>
      </div>
    )
  }

  // ── Full interactive overlay mode ──────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(8,6,4,0.98)',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'IBM Plex Mono', 'Special Elite', monospace",
    }}>
      <MapHeader currentWeek={currentWeek} onClose={() => setMapOpen(false)} />

      {/* Map content area */}
      <div
        ref={containerRef}
        style={{
          flex: 1, position: 'relative', overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'grab',
          marginTop: '42px',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div style={{
          position: 'absolute', inset: 0,
          transform: `translate(${offset.x}px, ${offset.y}px)`,
          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
        }}>
          {mapContent}
        </div>

        {/* Province list sidebar — fixed, does NOT move with map */}
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0,
          width: '220px', background: 'rgba(12,10,8,0.95)',
          borderLeft: '1px solid rgba(200,144,42,0.2)',
          overflowY: 'auto', scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(200,144,42,0.2) transparent',
          padding: '1rem 0.5rem',
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
                  padding: '0.4rem 0.5rem', marginBottom: '1px',
                  transition: 'background 0.15s',
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
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0.4rem 2rem', borderTop: '1px solid rgba(200,144,42,0.2)',
        background: 'rgba(10,8,6,0.95)',
      }}>
        <span style={{ fontSize: '0.48rem', letterSpacing: '0.08em', color: 'var(--muted)', textTransform: 'uppercase' }}>
          Province status reflects current national conditions
        </span>
        <span style={{
          fontFamily: "'Playfair Display', serif", fontSize: '0.52rem', letterSpacing: '0.06em',
          color: 'var(--amber-dim)', fontStyle: 'italic',
        }}>
          Classified — Chancellor Eyes Only
        </span>
      </div>
    </div>
  )
}
