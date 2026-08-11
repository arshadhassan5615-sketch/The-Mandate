import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
// import { useGameStore } from '../stores/gameStore' // only fed the commented-out statuses/medallion code
import { useNarrativeStore } from '../stores/narrativeStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useWeekStore } from '../stores/weekStore'
import type { GameState } from '../types/gameState'
import { MAP_RENDER_WIDTH, MAP_RENDER_HEIGHT, PROVINCE_PIN_POSITIONS, groupByProvince } from '../engine/LocationResolver'
import { MapPins } from './MapInteractionLayer'
import veltriaMapImg from '../assets/maps/veltria_map_full.jpeg'
import pinAshenmere    from '../assets/images/pins/pin_ashenmere.png'
import pinKravenstal   from '../assets/images/pins/pin_kravenstal.png'
import pinDravenhollow from '../assets/images/pins/pin_dravenhollow.png'
import pinThornfeld    from '../assets/images/pins/pin_thornfeld.png'
import pinAldenmoor    from '../assets/images/pins/pin_aldenmoor.png'
import pinSevagrad     from '../assets/images/pins/pin_sevagrad.png'

const PROVINCE_BUILDINGS = [
  { id: 'ashenmere',    img: pinAshenmere    },
  { id: 'kravenstal',   img: pinKravenstal   },
  { id: 'dravenhollow', img: pinDravenhollow },
  { id: 'thornfeld',    img: pinThornfeld    },
  { id: 'aldenmoor',    img: pinAldenmoor    },
  { id: 'sevagrad',     img: pinSevagrad     },
] as const

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

// const FACTION_LABELS: Record<string, string> = {
//   reformists: 'Reformist', workersCoalition: "Workers' Coalition", halvekists: 'Halvekist',
//   ironCovenant: 'Iron Covenant', church: 'Church', businessClass: 'Business', dravenni: 'Dravenni',
// }

// ─── Status computation ──────────────────────────────────────────────────────

// function stance(score: number): string {
//   if (score >= 68) return 'Strongly Supportive'
//   if (score >= 52) return 'Supportive'
//   if (score >= 36) return 'Neutral'
//   if (score >= 20) return 'Skeptical'
//   return 'Hostile'
// }

// function computeCrisisLevel(provinceId: string, state: GameState, flags: string[]): 0 | 1 | 2 {
//   const { nation: n, factions: f } = state
//   switch (provinceId) {
//     case 'kravenstal':
//       return n.unemployment > 28 || f.workersCoalition < 22 ? 2
//         : n.unemployment > 22 || f.workersCoalition < 36 ? 1 : 0
//     case 'dravenhollow':
//       return f.dravenni < 20 || flags.includes('bni_weaponized') ? 2
//         : f.dravenni < 38 || n.civilLiberties < 28 ? 1 : 0
//     case 'ashenmere':
//       return n.corruption > 78 || n.publicOrder < 28 || n.pressFreedom < 14 ? 2
//         : n.corruption > 60 || n.publicOrder < 44 || n.pressFreedom < 26 ? 1 : 0
//     case 'sevagrad':
//       return n.militaryReadiness < 28 || (n.publicOrder < 28 && n.internationalStanding < 26) ? 2
//         : n.militaryReadiness < 44 || n.internationalStanding < 36 ? 1 : 0
//     case 'thornfeld':
//       return f.halvekists < 18 || (n.publicOrder < 32 && f.church < 22) ? 2
//         : f.halvekists > 72 || f.church < 30 || n.publicOrder < 44 ? 1 : 0
//     case 'aldenmoor':
//       return f.businessClass < 18 || n.economyHealth < -62 ? 2
//         : f.businessClass < 32 || n.economyHealth < -28 ? 1 : 0
//     default: return 0
//   }
// }

// ─── Road / railway organic path (Veltria's 6 provinces only) ────────────────

function organicPath(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  bow: number = 0.12
): string {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  const nx = -dy / dist
  const ny = dx / dist
  const offset = dist * bow

  const c1x = p1.x + dx * 0.3 + nx * offset
  const c1y = p1.y + dy * 0.3 + ny * offset
  const c2x = p1.x + dx * 0.7 + nx * offset * 0.55
  const c2y = p1.y + dy * 0.7 + ny * offset * 0.55

  return `M ${p1.x},${p1.y} C ${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`
}

// Pin anchors for road network — references into PROVINCE_PIN_POSITIONS only
const ASHENMERE = PROVINCE_PIN_POSITIONS.ashenmere
const DRAVENHOLLOW = PROVINCE_PIN_POSITIONS.dravenhollow
const KRAVENSTAL = PROVINCE_PIN_POSITIONS.kravenstal
const THORNFELD = PROVINCE_PIN_POSITIONS.thornfeld
const ALDENMOOR = PROVINCE_PIN_POSITIONS.aldenmoor
const SEVAGRAD = PROVINCE_PIN_POSITIONS.sevagrad

// ─── Map Header ──────────────────────────────────────────────────────────────
// Compact helper cluster (not a full-width bar) so TopBar chips stay free.
// Shows pan/hotkey guidance only — map closes via M, not a header button.

function MapHeader() {
  return (
    <div
      data-testid="map-header-close-cluster"
      style={{
        position: 'fixed', top: '64px', right: '80px', zIndex: 10010,
        display: 'flex', alignItems: 'center', gap: '0.65rem',
        padding: '6px 10px',
        background: 'rgba(10,8,6,0.85)',
        borderRadius: '6px',
        border: '1px solid rgba(201,168,76,0.2)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
      }}
    >
      {false && (
        <span style={{
          fontSize: '0.52rem',
          letterSpacing: '0.08em',
          color: 'var(--muted)',
          whiteSpace: 'nowrap',
          fontFamily: "'IBM Plex Mono', monospace",
        }}>
          Drag to pan · hover provinces · M to close
        </span>
      )}
    </div>
  )
}

// ─── Main MapView ─────────────────────────────────────────────────────────────

export default function MapView({ onProvinceDetail }: {
  onProvinceDetail?: (id: string) => void
}) {
  const mapOpen    = useSettingsStore(s => s.mapOpen)
  const phase      = useWeekStore(s => s.phase)
  // gameState / factions / activeFlags fed only the commented-out statuses (HIDDEN medallion) block
  // const gameState  = useGameStore()
  // const factions   = useGameStore(s => s.factions)
  // const { activeFlags } = useNarrativeStore()
  const agendaPool      = useWeekStore(s => s.agendaPool)
  const visitedSceneIds = useNarrativeStore(s => s.visitedSceneIds)
  const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null)

  const provincesWithScenes = useMemo(() => {
    const active = new Set<string>()
    agendaPool.forEach(item => {
      if (!visitedSceneIds.includes(item.sceneId)) {
        const groups = groupByProvince([item])
        Object.keys(groups).forEach(p => active.add(p))
      }
    })
    return active
  }, [agendaPool, visitedSceneIds])

  // Zone highlight only (no mouse-following tooltip)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const [pan, setPan] = useState({ x: 0, y: 0 })
  const dragging    = useRef(false)
  const dragOrigin  = useRef({ mx: 0, my: 0, px: 0, py: 0 })
  const hasDragged  = useRef(false)
  const panRafRef   = useRef<number | null>(null)
  const [isCursorGrabbing, setIsCursorGrabbing] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const [focusedProvinceId, setFocusedProvinceId] = useState<string | null>(null)
  const FOCUS_ZOOM_MULTIPLIER = 1.6

  const [dynamicZoom, setDynamicZoom] = useState(1)
  useEffect(() => {
    const calcZoom = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const veltriaWidth = MAP_RENDER_WIDTH * 0.65
      const veltriaHeight = MAP_RENDER_HEIGHT * 0.70
      const scaleW = (vw - 80) / veltriaWidth
      const scaleH = (vh - 80) / veltriaHeight
      const fitZoom = Math.min(scaleW, scaleH)
      // Never go below full-viewport coverage (prevents exposed background)
      const coverZoom = Math.max(vw / MAP_RENDER_WIDTH, vh / MAP_RENDER_HEIGHT)
      setDynamicZoom(Math.max(fitZoom, coverZoom))
    }
    calcZoom()
    window.addEventListener('resize', calcZoom)
    return () => window.removeEventListener('resize', calcZoom)
  }, [])

  const effectiveZoom = focusedProvinceId ? dynamicZoom * FOCUS_ZOOM_MULTIPLIER : dynamicZoom
  const effectiveZoomRef = useRef(effectiveZoom)
  effectiveZoomRef.current = effectiveZoom

  function clampPan(x: number, y: number, zoom: number = effectiveZoom): { x: number; y: number } {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1920
    const vh = typeof window !== 'undefined' ? window.innerHeight : 1080
    return {
      x: Math.max(vw - MAP_RENDER_WIDTH * zoom, Math.min(0, x)),
      y: Math.max(vh - MAP_RENDER_HEIGHT * zoom, Math.min(0, y)),
    }
  }

  function centeredOnAshenmere(): { x: number; y: number } {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1920
    const vh = typeof window !== 'undefined' ? window.innerHeight : 1080
    const ash = PROVINCE_PIN_POSITIONS.ashenmere
    return clampPan(
      Math.round(vw / 2 - ash.x * dynamicZoom),
      Math.round(vh / 2 - ash.y * dynamicZoom),
    )
  }

  function centerOnProvince(id: string, zoom: number): { x: number; y: number } {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1920
    const vh = typeof window !== 'undefined' ? window.innerHeight : 1080
    const pos = PROVINCE_PIN_POSITIONS[id as keyof typeof PROVINCE_PIN_POSITIONS]
    if (!pos) return centeredOnAshenmere()
    return clampPan(
      Math.round(vw / 2 - pos.x * zoom),
      Math.round(vh / 2 - pos.y * zoom),
      zoom,
    )
  }

  const handleFocusProvince = (id: string) => {
    const targetZoom = dynamicZoom * FOCUS_ZOOM_MULTIPLIER
    setIsAnimating(true)
    setFocusedProvinceId(id)
    setPan(centerOnProvince(id, targetZoom))
    setTimeout(() => setIsAnimating(false), 500)
  }
  const handleUnfocusProvince = () => {
    setIsAnimating(true)
    setFocusedProvinceId(null)
    setPan(centerOnProvince('ashenmere', dynamicZoom))
    setTimeout(() => setIsAnimating(false), 500)
  }

  // Center on Ashenmere on first mount
  useEffect(() => {
    setPan(centeredOnAshenmere())
  }, [])

  // Re-center when map overlay opens
  useEffect(() => {
    if (mapOpen) setPan(centeredOnAshenmere())
  }, [mapOpen])

  // Stubbed-out status map — consumed only by the HIDDEN medallion block below
  // const statuses = useMemo(() => {
  //   const map = new Map<string, 0 | 1 | 2>()
  //   for (const p of PROVINCE_ZONES) map.set(p.id, computeCrisisLevel(p.id, gameState, activeFlags))
  //   return map
  // }, [gameState, activeFlags])

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
    const newX = clampPan(dragOrigin.current.px + dx, dragOrigin.current.py + dy, effectiveZoomRef.current).x
    const newY = clampPan(dragOrigin.current.px + dx, dragOrigin.current.py + dy, effectiveZoomRef.current).y
    // M10 — throttle setPan to one update per frame to avoid
    // re-rendering on every mousemove event.
    if (panRafRef.current !== null) cancelAnimationFrame(panRafRef.current)
    panRafRef.current = requestAnimationFrame(() => {
      setPan({ x: newX, y: newY })
      panRafRef.current = null
    })
  }, [])

  const onMouseUp = useCallback(() => {
    dragging.current = false
    setIsCursorGrabbing(false)
  }, [])

  const isGameplay = phase !== 'title' && phase !== 'customization' && phase !== 'prologue' && phase !== 'epilogue'
  if (!isGameplay) return null

  // Stubbed-out — only referenced by the HIDDEN medallion block; buildings call onProvinceDetail directly
  // function handleOpenDetail(id: string) {
  //   if (hasDragged.current) return
  //   onProvinceDetail?.(id)
  // }

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
          transform: `translate(${bgPan.x}px, ${bgPan.y}px) scale(${dynamicZoom})`,
          transformOrigin: '0 0',
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
              maxWidth: 'none',
              maxHeight: 'none',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
          {/* Road and railway network overlay — Veltria 6 provinces only (no Sovarka) */}
          <svg
            className="road-network-overlay"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 2752,
              height: 1536,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            {/* Roads — solid, warm brown, organic curves. Veltria's 6 provinces
                only. Sovarka and foreign are excluded — not part of the nation. */}
            <path d={organicPath(ASHENMERE, DRAVENHOLLOW, 0.10)}
              stroke="#8b6b47" strokeWidth={3} fill="none"
              strokeLinecap="round" opacity={0.55} />
            <path d={organicPath(DRAVENHOLLOW, KRAVENSTAL, -0.12)}
              stroke="#8b6b47" strokeWidth={3} fill="none"
              strokeLinecap="round" opacity={0.55} />
            <path d={organicPath(KRAVENSTAL, THORNFELD, 0.09)}
              stroke="#8b6b47" strokeWidth={3} fill="none"
              strokeLinecap="round" opacity={0.55} />
            <path d={organicPath(THORNFELD, ASHENMERE, -0.15)}
              stroke="#8b6b47" strokeWidth={3} fill="none"
              strokeLinecap="round" opacity={0.55} />
            <path d={organicPath(ASHENMERE, ALDENMOOR, 0.18)}
              stroke="#8b6b47" strokeWidth={3} fill="none"
              strokeLinecap="round" opacity={0.55} />
            <path d={organicPath(ASHENMERE, SEVAGRAD, -0.10)}
              stroke="#8b6b47" strokeWidth={3} fill="none"
              strokeLinecap="round" opacity={0.55} />
            <path d={organicPath(ALDENMOOR, SEVAGRAD, 0.13)}
              stroke="#8b6b47" strokeWidth={3} fill="none"
              strokeLinecap="round" opacity={0.55} />

            {/* Railway — dark slate, dash-dot, thinner. Single trunk line through
                the capital. */}
            <path d={organicPath(KRAVENSTAL, ASHENMERE, -0.08)}
              stroke="#3d3a35" strokeWidth={1.8} strokeDasharray="2,5"
              fill="none" strokeLinecap="round" opacity={0.7} />
            <path d={organicPath(ASHENMERE, SEVAGRAD, 0.06)}
              stroke="#3d3a35" strokeWidth={1.8} strokeDasharray="2,5"
              fill="none" strokeLinecap="round" opacity={0.7} />
          </svg>
          {/* Always-visible province buildings */}
          {PROVINCE_BUILDINGS.map(({ id, img }) => {
            const pos = PROVINCE_PIN_POSITIONS[id as keyof typeof PROVINCE_PIN_POSITIONS]
            if (!pos) return null
            const hasScenes  = provincesWithScenes.has(id)
            const isHovered  = hoveredBuilding === id
            return (
              <div
                key={id}
                style={{
                  position: 'absolute',
                  left: pos.x,
                  top: pos.y,
                  transform: `translate(-50%, -130%) scale(${isHovered ? 1.12 : 1.0})`,
                  transition: 'transform 0.18s ease, filter 0.18s ease',
                  cursor: 'pointer',
                  userSelect: 'none',
                  zIndex: isHovered ? 50 : 10,
                }}
                onMouseEnter={() => setHoveredBuilding(id)}
                onMouseLeave={() => setHoveredBuilding(null)}
                onClick={(e) => {
                  e.stopPropagation()
                  onProvinceDetail?.(id)
                }}
              >
                <img
                  src={img}
                  alt={id}
                  style={{
                    width: 140,
                    height: 'auto',
                    display: 'block',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    opacity: 0.92,
                    filter: hasScenes
                      ? `drop-shadow(0 0 12px rgba(201,168,76,0.8)) drop-shadow(0 4px 8px rgba(0,0,0,0.45))`
                      : `drop-shadow(0 4px 8px rgba(0,0,0,0.45))`,
                  }}
                  draggable={false}
                />
                {/* Province name tooltip on hover */}
                {isHovered && (
                  <div style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 6px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap',
                    background: 'linear-gradient(180deg, rgba(26,21,16,0.95) 0%, rgba(14,11,7,0.95) 100%)',
                    border: '1px solid rgba(201,168,76,0.5)',
                    borderRadius: '3px',
                    padding: '4px 10px',
                    pointerEvents: 'none',
                    zIndex: 100,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.6)',
                  }}>
                    <div style={{
                      fontFamily: "'Special Elite', monospace",
                      fontSize: '9px',
                      letterSpacing: '0.2em',
                      color: '#c9a84c',
                      textTransform: 'uppercase',
                    }}>
                      {id.charAt(0).toUpperCase() + id.slice(1)}
                    </div>
                    {hasScenes && (
                      <div style={{
                        fontFamily: "'Special Elite', monospace",
                        fontSize: '7px',
                        letterSpacing: '0.15em',
                        color: 'rgba(201,168,76,0.6)',
                        textTransform: 'uppercase',
                        marginTop: '2px',
                      }}>
                        Events available
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
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
      <MapHeader />

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
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${effectiveZoom})`,
          transformOrigin: '0 0',
          willChange: 'transform',
          userSelect: 'none',
          transition: isAnimating
            ? 'transform 480ms cubic-bezier(0.4, 0, 0.2, 1)'
            : 'none',
        }}>
          <img
            src={veltriaMapImg}
            alt="Veltria Map"
            draggable={false}
            style={{
              display: 'block',
              width: `${MAP_RENDER_WIDTH}px`,
              height: `${MAP_RENDER_HEIGHT}px`,
              maxWidth: 'none',
              maxHeight: 'none',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />

          {/* Province click zones — absolute on image, move with pan */}
          {PROVINCE_ZONES.map(zone => (
            <div
              key={zone.id}
              onMouseEnter={(e) => {
                e.stopPropagation()
                if (dragging.current) return
                setHoveredId(zone.id)
              }}
              onMouseLeave={(e) => {
                e.stopPropagation()
                if (dragging.current) return
                setHoveredId(null)
              }}
              style={{
                position: 'absolute',
                left: zone.left, top: zone.top,
                width: zone.width, height: zone.height,
                background: hoveredId === zone.id ? 'rgba(200,144,42,0.08)' : 'transparent',
                border: hoveredId === zone.id ? '1px solid rgba(200,144,42,0.2)' : '1px solid transparent',
                cursor: 'default',
                transition: 'background 0.3s ease, border-color 0.3s ease',
                zIndex: hoveredId === zone.id ? 3 : 1,
                borderRadius: '2px',
              }}
            />
          ))}

          {/* HIDDEN — replaced by MapScenePin building images
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
          */}

          {/* Road and railway network overlay — Veltria 6 provinces only (no Sovarka) */}
          <svg
            className="road-network-overlay"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 2752,
              height: 1536,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            {/* Roads — solid, warm brown, organic curves. Veltria's 6 provinces
                only. Sovarka and foreign are excluded — not part of the nation. */}
            <path d={organicPath(ASHENMERE, DRAVENHOLLOW, 0.10)}
              stroke="#8b6b47" strokeWidth={3} fill="none"
              strokeLinecap="round" opacity={0.55} />
            <path d={organicPath(DRAVENHOLLOW, KRAVENSTAL, -0.12)}
              stroke="#8b6b47" strokeWidth={3} fill="none"
              strokeLinecap="round" opacity={0.55} />
            <path d={organicPath(KRAVENSTAL, THORNFELD, 0.09)}
              stroke="#8b6b47" strokeWidth={3} fill="none"
              strokeLinecap="round" opacity={0.55} />
            <path d={organicPath(THORNFELD, ASHENMERE, -0.15)}
              stroke="#8b6b47" strokeWidth={3} fill="none"
              strokeLinecap="round" opacity={0.55} />
            <path d={organicPath(ASHENMERE, ALDENMOOR, 0.18)}
              stroke="#8b6b47" strokeWidth={3} fill="none"
              strokeLinecap="round" opacity={0.55} />
            <path d={organicPath(ASHENMERE, SEVAGRAD, -0.10)}
              stroke="#8b6b47" strokeWidth={3} fill="none"
              strokeLinecap="round" opacity={0.55} />
            <path d={organicPath(ALDENMOOR, SEVAGRAD, 0.13)}
              stroke="#8b6b47" strokeWidth={3} fill="none"
              strokeLinecap="round" opacity={0.55} />

            {/* Railway — dark slate, dash-dot, thinner. Single trunk line through
                the capital. */}
            <path d={organicPath(KRAVENSTAL, ASHENMERE, -0.08)}
              stroke="#3d3a35" strokeWidth={1.8} strokeDasharray="2,5"
              fill="none" strokeLinecap="round" opacity={0.7} />
            <path d={organicPath(ASHENMERE, SEVAGRAD, 0.06)}
              stroke="#3d3a35" strokeWidth={1.8} strokeDasharray="2,5"
              fill="none" strokeLinecap="round" opacity={0.7} />
          </svg>

          {/* Always-visible province buildings */}
          {PROVINCE_BUILDINGS.map(({ id, img }) => {
            const pos = PROVINCE_PIN_POSITIONS[id as keyof typeof PROVINCE_PIN_POSITIONS]
            if (!pos) return null
            const hasScenes  = provincesWithScenes.has(id)
            const isHovered  = hoveredBuilding === id
            return (
              <div
                key={id}
                style={{
                  position: 'absolute',
                  left: pos.x,
                  top: pos.y,
                  transform: `translate(-50%, -130%) scale(${isHovered ? 1.12 : 1.0})`,
                  transition: 'transform 0.18s ease, filter 0.18s ease',
                  cursor: 'pointer',
                  userSelect: 'none',
                  zIndex: isHovered ? 50 : 10,
                }}
                onMouseEnter={() => setHoveredBuilding(id)}
                onMouseLeave={() => setHoveredBuilding(null)}
                onClick={(e) => {
                  e.stopPropagation()
                  onProvinceDetail?.(id)
                }}
              >
                <img
                  src={img}
                  alt={id}
                  style={{
                    width: 140,
                    height: 'auto',
                    display: 'block',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    opacity: 0.92,
                    filter: hasScenes
                      ? `drop-shadow(0 0 12px rgba(201,168,76,0.8)) drop-shadow(0 4px 8px rgba(0,0,0,0.45))`
                      : `drop-shadow(0 4px 8px rgba(0,0,0,0.45))`,
                  }}
                  draggable={false}
                />
                {/* Province name tooltip on hover */}
                {isHovered && (
                  <div style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 6px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap',
                    background: 'linear-gradient(180deg, rgba(26,21,16,0.95) 0%, rgba(14,11,7,0.95) 100%)',
                    border: '1px solid rgba(201,168,76,0.5)',
                    borderRadius: '3px',
                    padding: '4px 10px',
                    pointerEvents: 'none',
                    zIndex: 100,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.6)',
                  }}>
                    <div style={{
                      fontFamily: "'Special Elite', monospace",
                      fontSize: '9px',
                      letterSpacing: '0.2em',
                      color: '#c9a84c',
                      textTransform: 'uppercase',
                    }}>
                      {id.charAt(0).toUpperCase() + id.slice(1)}
                    </div>
                    {hasScenes && (
                      <div style={{
                        fontFamily: "'Special Elite', monospace",
                        fontSize: '7px',
                        letterSpacing: '0.15em',
                        color: 'rgba(201,168,76,0.6)',
                        textTransform: 'uppercase',
                        marginTop: '2px',
                      }}>
                        Events available
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
          {/* Scene pins — absolute inside transform, move with map */}
          <MapPins
            onFocusProvince={handleFocusProvince}
            onUnfocusProvince={handleUnfocusProvince}
          />
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: '68px',
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
