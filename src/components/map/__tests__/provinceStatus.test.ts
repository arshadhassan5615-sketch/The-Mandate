import { describe, it, expect } from 'vitest'
import { computeProvinceStatus } from '../provinceStatus'
import { buildGameState } from '../../../test/factories/gameStateFactory'

describe('computeProvinceStatus', () => {
  it('reads Kravenstal from unemployment and the Workers Coalition', () => {
    const base = buildGameState()
    const calm = { ...base, nation: { ...base.nation, unemployment: 10 }, factions: { ...base.factions, workersCoalition: 60 } }
    const tense = { ...calm, nation: { ...calm.nation, unemployment: 25 } }
    const crisis = { ...calm, factions: { ...calm.factions, workersCoalition: 10 } }
    expect(computeProvinceStatus('kravenstal', calm).level).toBe('Stable')
    expect(computeProvinceStatus('kravenstal', tense).level).toBe('Tense')
    expect(computeProvinceStatus('kravenstal', crisis).level).toBe('Crisis')
  })

  it('never puts hidden-stat numbers in the detail line', () => {
    const base = buildGameState()
    const extremes = [0, 50, 100].map(v => ({
      ...base,
      nation: { ...base.nation, unemployment: v / 2, corruption: v, publicOrder: v, militaryReadiness: v, civilLiberties: v, internationalStanding: v, economyHealth: v - 100 },
      factions: { ...base.factions, workersCoalition: v, dravenni: v, halvekists: v, church: v, businessClass: v },
    }))
    for (const id of ['ashenmere', 'kravenstal', 'dravenhollow', 'thornfeld', 'aldenmoor', 'sevagrad']) {
      for (const state of extremes) expect(computeProvinceStatus(id, state).detail).not.toMatch(/\d/)
    }
  })

  it('treats an unknown province as stable', () => {
    expect(computeProvinceStatus('nowhere', buildGameState()).level).toBe('Stable')
  })
})
