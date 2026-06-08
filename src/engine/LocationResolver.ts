import type { AgendaItem } from '../types/week'
import { getScene } from './NarrativeEngine'

export type ProvinceId =
  | 'ashenmere' | 'kravenstal' | 'dravenhollow'
  | 'thornfeld' | 'aldenmoor' | 'sevagrad' | 'foreign'

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

export const PROVINCE_PIN_POSITIONS: Record<ProvinceId, { x: number; y: number }> = {
  ashenmere:   { x: 47.7, y: 45.4 },
  kravenstal:  { x: 14.4, y: 53.8 },
  dravenhollow:{ x: 49.7, y: 19.2 },
  thornfeld:   { x: 18.8, y: 85.0 },
  aldenmoor:   { x: 54.1, y: 96.3 },
  sevagrad:    { x: 81.3, y: 60.0 },
  foreign:     { x: 88.0, y: 12.0 },
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
