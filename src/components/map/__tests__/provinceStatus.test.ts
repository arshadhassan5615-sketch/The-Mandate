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

  it('treats an unknown province as stable', () => {
    expect(computeProvinceStatus('nowhere', buildGameState()).level).toBe('Stable')
  })
})
