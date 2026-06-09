import type { AgendaItem } from '../types/week'
import { getScene } from './NarrativeEngine'

export type ProvinceId =
  | 'ashenmere' | 'kravenstal' | 'dravenhollow'
  | 'thornfeld' | 'aldenmoor' | 'sevagrad' | 'foreign'

// Rendered map dimensions (image fixed at 2800px wide; height from ~16:9 aspect ratio)
export const MAP_RENDER_WIDTH = 2800
export const MAP_RENDER_HEIGHT = 1575

export function resolveLocation(locationString: string): ProvinceId {
  const loc = locationString.toLowerCase()
  if (loc.includes('kravenstal')) return 'kravenstal'
  if (loc.includes('dravenhollow')) return 'dravenhollow'
  if (loc.includes('thornfeld')) return 'thornfeld'
  if (loc.includes('aldenmoor')) return 'aldenmoor'
  if (loc.includes('sevagrad')) return 'sevagrad'
  if (
    loc.includes('mirev') ||
    loc.includes('sovarka') ||
    loc.includes('morivask') ||
    loc.includes('tyvaren') ||
    loc.includes('arcturia') ||
    loc.includes('orythia') ||
    loc.includes('lytheira') ||
    loc.includes('abroad') ||
    loc.includes('embassy')
  ) return 'foreign'
  return 'ashenmere'
}

// Pin positions in pixels relative to the 2800×1575 rendered map image.
// x = MAP_RENDER_WIDTH * fraction, y = MAP_RENDER_HEIGHT * fraction
export const PROVINCE_PIN_POSITIONS: Record<ProvinceId, { x: number; y: number }> = {
  ashenmere:    { x: Math.round(2800 * 0.52), y: Math.round(1575 * 0.52) },   // capital, center
  kravenstal:   { x: Math.round(2800 * 0.32), y: Math.round(1575 * 0.52) },   // west industrial
  dravenhollow: { x: Math.round(2800 * 0.52), y: Math.round(1575 * 0.30) },   // north mountains
  thornfeld:    { x: Math.round(2800 * 0.34), y: Math.round(1575 * 0.65) },   // southwest farmland
  aldenmoor:    { x: Math.round(2800 * 0.57), y: Math.round(1575 * 0.68) },   // south coast
  sevagrad:     { x: Math.round(2800 * 0.72), y: Math.round(1575 * 0.50) },   // east border
  foreign:      { x: Math.round(2800 * 0.88), y: Math.round(1575 * 0.12) },   // off-map foreign
}

export const PROVINCE_NAMES: Record<ProvinceId, string> = {
  ashenmere:    'Ashenmere',
  kravenstal:   'Kravenstal',
  dravenhollow: 'Dravenhollow',
  thornfeld:    'Thornfeld',
  aldenmoor:    'Aldenmoor',
  sevagrad:     'Sevagrad',
  foreign:      'Foreign Affairs',
}

export function groupByProvince(
  items: AgendaItem[],
): Record<ProvinceId, AgendaItem[]> {
  const groups: Partial<Record<ProvinceId, AgendaItem[]>> = {}
  for (const item of items) {
    const scene = getScene(item.sceneId)
    const province = resolveLocation(scene?.location ?? '')
    if (!groups[province]) groups[province] = []
    groups[province]!.push(item)
  }
  for (const key of Object.keys(groups) as ProvinceId[]) {
    groups[key]!.sort((a, b) =>
      (a.executionOrder ?? 99) - (b.executionOrder ?? 99)
    )
  }
  return groups as Record<ProvinceId, AgendaItem[]>
}
