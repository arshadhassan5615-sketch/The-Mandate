import type { EconomicDirection } from '../types/gameState'

export interface EconomicEffect {
  unlockFlags: string[]
  lockFlags: string[]
  foreignBonus: { ally: string; value: number }
  foreignPenalty: { rival: string; value: number }
  projectUnlocks: string[]
  projectLocks: string[]
  billUnlocks: string[]
  billLocks: string[]
}

export function getEconomicEffects(direction: EconomicDirection): EconomicEffect {
  switch (direction) {
    case 'free_market':
      return {
        unlockFlags: ['privatization_available', 'arcturian_trade_open', 'oligarch_cooperation'],
        lockFlags: ['nationalization_locked', 'workers_council_locked'],
        foreignBonus: { ally: 'Arcturia', value: 10 },
        foreignPenalty: { rival: 'Orythia', value: -8 },
        projectUnlocks: ['kravenstal_steel', 'amber_coast_highway'],
        projectLocks: ['sevagrad_fortification'],
        billUnlocks: ['privatization_act', 'foreign_investment_act'],
        billLocks: ['nationalization_act', 'worker_ownership_act'],
      }
    case 'planned':
      return {
        unlockFlags: ['nationalization_available', 'workers_council_available', 'orythian_loans_available'],
        lockFlags: ['privatization_locked', 'oligarch_cooperation_locked'],
        foreignBonus: { ally: 'Orythia', value: 10 },
        foreignPenalty: { rival: 'Arcturia', value: -8 },
        projectUnlocks: ['sevagrad_fortification', 'rural_electrification'],
        projectLocks: ['ashenmere_metro'],
        billUnlocks: ['nationalization_act', 'worker_ownership_act'],
        billLocks: ['privatization_act', 'foreign_investment_act'],
      }
    case 'mixed':
      return {
        unlockFlags: ['privatization_available', 'nationalization_available'],
        lockFlags: [],
        foreignBonus: { ally: 'neutral', value: 3 },
        foreignPenalty: { rival: 'neutral', value: -2 },
        projectUnlocks: ['kravenstal_steel', 'rural_electrification'],
        projectLocks: [],
        billUnlocks: ['privatization_act', 'nationalization_act'],
        billLocks: [],
      }
    case 'pragmatic':
      return {
        unlockFlags: ['privatization_available', 'nationalization_available', 'case_by_case_approach'],
        lockFlags: [],
        foreignBonus: { ally: 'flexible', value: 2 },
        foreignPenalty: { rival: 'unpredictable', value: -4 },
        projectUnlocks: [],
        projectLocks: [],
        billUnlocks: [],
        billLocks: [],
      }
    default:
      return {
        unlockFlags: [],
        lockFlags: [],
        foreignBonus: { ally: 'none', value: 0 },
        foreignPenalty: { rival: 'none', value: 0 },
        projectUnlocks: [],
        projectLocks: [],
        billUnlocks: [],
        billLocks: [],
      }
  }
}

export function getEconomicDirectionLabel(direction: EconomicDirection): string {
  switch (direction) {
    case 'free_market': return 'Free Market'
    case 'planned': return 'Planned Economy'
    case 'mixed': return 'Mixed Economy'
    case 'pragmatic': return 'Pragmatic (Case by Case)'
    default: return 'Undecided'
  }
}
