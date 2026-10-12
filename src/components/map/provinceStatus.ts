// Province conditions as the player sees them: a level (Stable / Tense / Crisis)
// plus a one-line detail for the province panel. Shared by the province panel
// and the map chips.
import type { GameState } from '../../types/gameState'

export type ProvinceStatusLevel = 'Stable' | 'Tense' | 'Crisis'

export interface ProvinceStatus {
  level: ProvinceStatusLevel
  color: string
  detail: string
}

export const STATUS_COLORS: Record<ProvinceStatusLevel, string> = {
  Stable: 'var(--accent-green)',
  Tense: '#c47a3a',
  Crisis: 'var(--accent-red)',
}

const status = (level: ProvinceStatusLevel, detail: string): ProvinceStatus =>
  ({ level, color: STATUS_COLORS[level], detail })

export function computeProvinceStatus(provinceId: string, state: Pick<GameState, 'nation' | 'factions'>): ProvinceStatus {
  const { nation: n, factions: f } = state
  switch (provinceId) {
    case 'kravenstal':
      if (n.unemployment > 28 || f.workersCoalition < 22) return status('Crisis', `Unemployment ${n.unemployment}%, workers dissent`)
      if (n.unemployment > 22 || f.workersCoalition < 36) return status('Tense', `Unemployment ${n.unemployment}%, simmering unrest`)
      return status('Stable', `Unemployment ${n.unemployment}%, labor cooperative`)
    case 'dravenhollow':
      if (f.dravenni < 20) return status('Crisis', `Dravenni support ${f.dravenni}, separatist threat`)
      if (f.dravenni < 38 || n.civilLiberties < 28) return status('Tense', `Dravenni support ${f.dravenni}, civil liberties strained`)
      return status('Stable', `Dravenni support ${f.dravenni}, autonomy dialogue`)
    case 'ashenmere':
      if (n.corruption > 78 || n.publicOrder < 28) return status('Crisis', `Corruption ${n.corruption}, public order ${n.publicOrder}`)
      if (n.corruption > 60 || n.publicOrder < 44) return status('Tense', `Corruption ${n.corruption}, press scrutinizing`)
      return status('Stable', `Corruption ${n.corruption}, institutions functional`)
    case 'sevagrad':
      if (n.militaryReadiness < 28) return status('Crisis', `Military readiness ${n.militaryReadiness}, border vulnerable`)
      if (n.militaryReadiness < 44 || n.internationalStanding < 36) return status('Tense', `Military readiness ${n.militaryReadiness}, border watchful`)
      return status('Stable', `Military readiness ${n.militaryReadiness}, garrison loyal`)
    case 'thornfeld':
      if (f.halvekists < 18) return status('Crisis', `Halvekist support ${f.halvekists}, rural revolt`)
      if (f.church < 30 || n.publicOrder < 44) return status('Tense', `Church influence ${f.church}, traditionalists agitated`)
      return status('Stable', `Church influence ${f.church}, harvest proceeding`)
    case 'aldenmoor':
      if (f.businessClass < 18 || n.economyHealth < -62) return status('Crisis', `Business support ${f.businessClass}, economy ${n.economyHealth}`)
      if (f.businessClass < 32 || n.economyHealth < -28) return status('Tense', `Business support ${f.businessClass}, trade slowing`)
      return status('Stable', `Business support ${f.businessClass}, ports active`)
    default:
      return status('Stable', 'Nominal conditions')
  }
}
