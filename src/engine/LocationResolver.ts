import type { AgendaItem } from '../types/week'
import { getScene } from './NarrativeEngine'

export type ProvinceId =
  | 'ashenmere' | 'kravenstal' | 'dravenhollow'
  | 'thornfeld' | 'aldenmoor' | 'sevagrad' | 'sovarka' | 'foreign'

// Rendered map dimensions (image exact at 2752x1536, the natural pixel size of the JPEG)
export const MAP_RENDER_WIDTH = 2752
export const MAP_RENDER_HEIGHT = 1536

export function resolveLocation(locationString: string): ProvinceId {
  const loc = locationString.toLowerCase()
  if (loc.includes('kravenstal')) return 'kravenstal'
  if (loc.includes('dravenhollow')) return 'dravenhollow'
  if (loc.includes('thornfeld')) return 'thornfeld'
  if (loc.includes('aldenmoor')) return 'aldenmoor'
  if (loc.includes('sevagrad')) return 'sevagrad'
  if (loc.includes('sovarka') || loc.includes('mirev')) return 'sovarka'
  if (
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

// Pin positions in pixels relative to the 2752×1536 rendered map image.
export const PROVINCE_PIN_POSITIONS: Record<ProvinceId, { x: number; y: number }> = {
  ashenmere:    { x: 1377, y: 785  },
  kravenstal:   { x: 869,  y: 730  },
  dravenhollow: { x: 1449, y: 461  },
  thornfeld:    { x: 941,  y: 985  },
  aldenmoor:    { x: 1600, y: 1020 },
  sevagrad:     { x: 1855, y: 827  },
  sovarka:      { x: 2125, y: 1301 },
  foreign:      { x: 2500, y: 200  },
}

export const PROVINCE_NAMES: Record<ProvinceId, string> = {
  ashenmere:    'Ashenmere',
  kravenstal:   'Kravenstal',
  dravenhollow: 'Dravenhollow',
  thornfeld:    'Thornfeld',
  aldenmoor:    'Aldenmoor',
  sevagrad:     'Sevagrad',
  sovarka:      'Sovarka',
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
