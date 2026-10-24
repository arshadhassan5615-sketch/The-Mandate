import { describe, expect, it } from 'vitest'
import { FIRM_STANCE, billStances } from '../billStances'
import { FACTION_NAMES } from '../../data/factions/factionNames'
import type { Bill } from '../../types/bills'

type Effects = Pick<Bill, 'signEffects'>['signEffects']

function effects(list: Effects): Pick<Bill, 'signEffects'> {
  return { signEffects: list }
}

const KNOWN_NAMES = Object.values(FACTION_NAMES).map(entry => entry.name)

describe('billStances', () => {
  it('splits supporters and opponents from signEffects', () => {
    const result = billStances(effects([
      { stat: 'factions.reformists', operation: 'add', value: 12 },
      { stat: 'factions.halvekists', operation: 'add', value: -10 },
    ]))

    expect(result.supporters).toEqual([
      { key: 'reformists', name: 'Civic Renewal', strength: 'firm' },
    ])
    expect(result.opponents).toEqual([
      { key: 'halvekists', name: 'Halvekists', strength: 'firm' },
    ])
  })

  it('sums repeated factions into one stance', () => {
    const result = billStances(effects([
      { stat: 'factions.church', operation: 'add', value: 6 },
      { stat: 'factions.church', operation: 'add', value: 5 },
    ]))

    expect(result.supporters).toEqual([
      { key: 'church', name: 'Church of the Eternal Flame', strength: 'firm' },
    ])
    expect(result.opponents).toEqual([])
  })

  it('excludes a faction whose repeated changes sum to zero', () => {
    const result = billStances(effects([
      { stat: 'factions.dravenni', operation: 'add', value: 7 },
      { stat: 'factions.dravenni', operation: 'add', value: -7 },
    ]))

    expect(result).toEqual({ supporters: [], opponents: [] })
  })

  it('ignores non-faction stats, unknown faction keys and non-add operations', () => {
    const result = billStances(effects([
      { stat: 'nation.pressFreedom', operation: 'add', value: 15 },
      { stat: 'factions.nonsense', operation: 'add', value: 20 },
      { stat: 'factions.reformists', operation: 'set', value: 30 },
      { stat: 'factions.reformists', operation: 'multiply', value: 2 },
      { stat: 'factions.businessClass', operation: 'add', value: -9 },
    ]))

    expect(result.supporters).toEqual([])
    expect(result.opponents).toEqual([
      { key: 'businessClass', name: 'Business Community', strength: 'leaning' },
    ])
  })

  it('treats exactly FIRM_STANCE as firm and anything smaller as leaning', () => {
    expect(FIRM_STANCE).toBe(10)

    const result = billStances(effects([
      { stat: 'factions.reformists', operation: 'add', value: FIRM_STANCE },
      { stat: 'factions.halvekists', operation: 'add', value: FIRM_STANCE - 1 },
      { stat: 'factions.church', operation: 'add', value: -FIRM_STANCE },
      { stat: 'factions.dravenni', operation: 'add', value: -(FIRM_STANCE - 1) },
    ]))

    expect(result.supporters.map(s => [s.key, s.strength])).toEqual([
      ['reformists', 'firm'],
      ['halvekists', 'leaning'],
    ])
    expect(result.opponents.map(s => [s.key, s.strength])).toEqual([
      ['church', 'firm'],
      ['dravenni', 'leaning'],
    ])
  })

  it('sorts by absolute total descending, then by name ascending', () => {
    const result = billStances(effects([
      { stat: 'factions.halvekists', operation: 'add', value: 4 },
      { stat: 'factions.businessClass', operation: 'add', value: -4 },
      { stat: 'factions.workersCoalition', operation: 'add', value: 15 },
      { stat: 'factions.reformists', operation: 'add', value: 4 },
      { stat: 'factions.ironCovenant', operation: 'add', value: -20 },
    ]))

    expect(result.supporters.map(s => s.name)).toEqual([
      "Workers' Coalition",
      'Civic Renewal',
      'Halvekists',
    ])
    expect(result.opponents.map(s => s.name)).toEqual([
      'Iron Covenant',
      'Business Community',
    ])
  })

  it('does not mutate the input bill', () => {
    const list: Effects = [
      { stat: 'factions.reformists', operation: 'add', value: 3 },
      { stat: 'factions.reformists', operation: 'add', value: 4 },
    ]
    const snapshot = JSON.parse(JSON.stringify(list)) as Effects

    billStances(effects(list))

    expect(list).toEqual(snapshot)
  })

  it('runs over every real bill without throwing and only names known factions', () => {
    const modules = import.meta.glob('../../data/bills/*.json', { eager: true }) as Record<
      string,
      { default: Bill }
    >
    const bills = Object.values(modules).map(module => module.default)
    expect(bills.length).toBeGreaterThan(0)

    for (const bill of bills) {
      const result = billStances(bill)
      for (const stance of [...result.supporters, ...result.opponents]) {
        expect(KNOWN_NAMES).toContain(stance.name)
      }
    }
  })
})
