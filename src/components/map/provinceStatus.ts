// Province conditions as the player sees them: a level (Stable / Tense / Crisis)
// plus a one-line detail for the province panel. Shared by the province panel
// and the map chips. Details are words only: the stats behind them are hidden
// from the player, so no numbers.
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
      if (n.unemployment > 28 || f.workersCoalition < 22) return status('Crisis', 'Workers in open dissent')
      if (n.unemployment > 22 || f.workersCoalition < 36) return status('Tense', 'Simmering unrest')
      return status('Stable', 'Labor cooperative')
    case 'dravenhollow':
      if (f.dravenni < 20) return status('Crisis', 'Separatist threat')
      if (f.dravenni < 38 || n.civilLiberties < 28) return status('Tense', 'Civil liberties strained')
      return status('Stable', 'Autonomy dialogue')
    case 'ashenmere':
      if (n.corruption > 78 || n.publicOrder < 28) return status('Crisis', 'Public order breaking down')
      if (n.corruption > 60 || n.publicOrder < 44) return status('Tense', 'Press scrutinizing')
      return status('Stable', 'Institutions functional')
    case 'sevagrad':
      if (n.militaryReadiness < 28) return status('Crisis', 'Border vulnerable')
      if (n.militaryReadiness < 44 || n.internationalStanding < 36) return status('Tense', 'Border watchful')
      return status('Stable', 'Garrison loyal')
    case 'thornfeld':
      if (f.halvekists < 18) return status('Crisis', 'Rural revolt')
      if (f.church < 30 || n.publicOrder < 44) return status('Tense', 'Traditionalists agitated')
      return status('Stable', 'Harvest proceeding')
    case 'aldenmoor':
      if (f.businessClass < 18 || n.economyHealth < -62) return status('Crisis', 'Trade collapsing')
      if (f.businessClass < 32 || n.economyHealth < -28) return status('Tense', 'Trade slowing')
      return status('Stable', 'Ports active')
    default:
      return status('Stable', 'Nominal conditions')
  }
}
