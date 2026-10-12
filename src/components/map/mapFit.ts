// Pure geometry for the Veltria map: how far to zoom and where the map may pan.
// Map coordinates are in rendered map pixels (MAP_RENDER_WIDTH × MAP_RENDER_HEIGHT).
import { MAP_RENDER_WIDTH, MAP_RENDER_HEIGHT, PROVINCE_PIN_POSITIONS } from '../../engine/LocationResolver'

export interface Point { x: number; y: number }
export interface Rect { left: number; top: number; right: number; bottom: number }

/** The six Veltrian provinces; Sovarka and the foreign pin are not the nation. */
const VELTRIA_PROVINCES = ['ashenmere', 'kravenstal', 'dravenhollow', 'thornfeld', 'aldenmoor', 'sevagrad'] as const

// Province buildings (180px wide) sit above their pin, so pad the pin box to hold them.
const BUILDING_HALF_WIDTH = 120
const BUILDING_HEIGHT = 220
const BELOW_PIN = 80
/** Side room on phones for the province chips, which overhang their buildings. */
const PHONE_GUTTER = 96

/** Bounding box of the country's six province buildings, in map pixels. */
export function countryBounds(): Rect {
  const pins = VELTRIA_PROVINCES.map(id => PROVINCE_PIN_POSITIONS[id])
  return {
    left: Math.min(...pins.map(p => p.x)) - BUILDING_HALF_WIDTH,
    right: Math.max(...pins.map(p => p.x)) + BUILDING_HALF_WIDTH,
    top: Math.min(...pins.map(p => p.y)) - BUILDING_HEIGHT,
    bottom: Math.max(...pins.map(p => p.y)) + BELOW_PIN,
  }
}

/** Desktop zoom: frame most of Veltria but always cover the viewport (no exposed sea edge). */
export function desktopZoom(vw: number, vh: number): number {
  const fitZoom = Math.min((vw - 80) / (MAP_RENDER_WIDTH * 0.65), (vh - 80) / (MAP_RENDER_HEIGHT * 0.70))
  const coverZoom = Math.max(vw / MAP_RENDER_WIDTH, vh / MAP_RENDER_HEIGHT)
  return Math.max(fitZoom, coverZoom)
}

/**
 * Phone zoom: fit the whole country inside the usable area (viewport minus the
 * HUD bars). May go below cover zoom; the sea colour fills the gap.
 */
export function phoneZoom(vw: number, vh: number, chromeHeight: number): number {
  const b = countryBounds()
  return Math.min((vw - PHONE_GUTTER) / (b.right - b.left), (vh - chromeHeight) / (b.bottom - b.top))
}

/** Pan offset that puts the centre of `rect` at the centre of the viewport. */
export function panToCenter(rect: Rect, zoom: number, vw: number, vh: number): Point {
  return {
    x: Math.round(vw / 2 - ((rect.left + rect.right) / 2) * zoom),
    y: Math.round(vh / 2 - ((rect.top + rect.bottom) / 2) * zoom),
  }
}

/**
 * Keep the map on screen. On an axis where the map is larger than the viewport
 * it may not pull away from the edges; where it is smaller it is centred.
 */
export function clampPan(x: number, y: number, zoom: number, vw: number, vh: number): Point {
  return {
    x: clampAxis(x, MAP_RENDER_WIDTH * zoom, vw),
    y: clampAxis(y, MAP_RENDER_HEIGHT * zoom, vh),
  }
}

function clampAxis(offset: number, mapSize: number, viewSize: number): number {
  if (mapSize <= viewSize) return Math.round((viewSize - mapSize) / 2)
  return Math.max(viewSize - mapSize, Math.min(0, offset))
}
