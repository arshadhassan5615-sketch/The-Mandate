import { describe, expect, it } from 'vitest'
import { GOVERNORS, ELECTION_CANDIDATES, getGovernor } from '../../data/governors'
import { HOME_PROVINCES } from '../provinceNews'
import { useGameStore } from '../../stores/gameStore'
import {
  governorInOffice,
  processGovernorsWeek,
  provincialElectionWinner,
} from '../governors'

const base = useGameStore.getState()

describe('GOVERNORS data', () => {
  it('has 15 entries with unique ids', () => {
    expect(GOVERNORS).toHaveLength(15)
    expect(new Set(GOVERNORS.map(g => g.id)).size).toBe(15)
  })

  it('has exactly one incumbent per home province', () => {
    for (const p of HOME_PROVINCES) {
      const incumbents = GOVERNORS.filter(g => g.provinceId === p && g.incumbent)
      expect(incumbents).toHaveLength(1)
    }
  })

  it('resolves every election candidate to a governor of that province', () => {
    for (const p of HOME_PROVINCES) {
      const { reform, opposition } = ELECTION_CANDIDATES[p]
      expect(getGovernor(reform)?.provinceId).toBe(p)
      expect(getGovernor(opposition)?.provinceId).toBe(p)
    }
  })
})

describe('governorInOffice', () => {
  it('returns the incumbent when no flags are active', () => {
    const r = governorInOffice('kravenstal', [])
    expect(r.governor.id).toBe('kral')
    expect(r.source).toBe('incumbent')
  })

  it('returns the appointee when an appointed flag is active', () => {
    const r = governorInOffice('kravenstal', ['governor_kravenstal_appointed_novak'])
    expect(r.governor.id).toBe('novak')
    expect(r.source).toBe('appointed')
  })

  it('prefers the elected governor over an appointed one', () => {
    const r = governorInOffice('kravenstal', [
      'governor_kravenstal_appointed_novak',
      'governor_kravenstal_elected_kral',
    ])
    expect(r.governor.id).toBe('kral')
    expect(r.source).toBe('elected')
  })
})

describe('provincialElectionWinner', () => {
  it('picks the reform candidate when reform score wins', () => {
    expect(provincialElectionWinner('kravenstal', { playerPolling: 68, kolvarPolling: 24 })).toBe('novak')
  })

  it('picks the opposition candidate when opposition score wins', () => {
    expect(provincialElectionWinner('thornfeld', { playerPolling: 40, kolvarPolling: 60 })).toBe('hollan')
  })
})

describe('processGovernorsWeek', () => {
  const state = { ...base, currentWeek: 9 }

  it('runs elections once the Self-Government Act is signed', () => {
    const first = processGovernorsWeek(state, ['self_government_act_signed'])
    const electionFlags = first.flags.filter(f => f.includes('_elected_'))
    expect(electionFlags).toHaveLength(6)
    expect(first.flags).toContain('provincial_elections_held')

    const second = processGovernorsWeek(state, ['self_government_act_signed', ...first.flags])
    expect(second.flags.filter(f => f.includes('_elected_'))).toHaveLength(0)
    expect(second.flags).not.toContain('provincial_elections_held')
  })

  it('applies a -1 workers modifier for a weak governor in a non-stable Kravenstal', () => {
    const s = { ...base, currentWeek: 9, nation: { ...base.nation, unemployment: 30 } }
    const { modifiers } = processGovernorsWeek(s, [])
    expect(modifiers).toContainEqual(expect.objectContaining({
      stat: 'factions.workersCoalition',
      value: -1,
      sourceId: 'governor_kravenstal',
    }))
  })

  it('applies a +1 workers modifier for a competent appointee in a non-stable Kravenstal', () => {
    const s = { ...base, currentWeek: 9, nation: { ...base.nation, unemployment: 30 } }
    const { modifiers } = processGovernorsWeek(s, ['governor_kravenstal_appointed_reiss'])
    expect(modifiers).toContainEqual(expect.objectContaining({
      stat: 'factions.workersCoalition',
      value: 1,
      sourceId: 'governor_kravenstal',
    }))
    expect(modifiers).not.toContainEqual(expect.objectContaining({
      stat: 'factions.workersCoalition',
      value: -1,
    }))
  })

  it('applies corruption +1 for low-integrity governors on weeks divisible by 8', () => {
    const s = { ...base, currentWeek: 8 }
    const corruption = processGovernorsWeek(s, []).modifiers.filter(m => m.stat === 'nation.corruption')
    const sources = corruption.map(m => m.sourceId).sort()
    expect(sources).toEqual(['governor_aldenmoor', 'governor_kravenstal'])
    expect(corruption.every(m => m.value === 1)).toBe(true)
  })

  it.each([4, 9])('applies no corruption modifiers in week %i, which is not divisible by 8', week => {
    const s = { ...base, currentWeek: week }
    const corruption = processGovernorsWeek(s, []).modifiers.filter(m => m.stat === 'nation.corruption')
    expect(corruption).toHaveLength(0)
  })

  it('flags a loyal majority when at least three governors are loyal', () => {
    const flags = [
      'governor_kravenstal_appointed_novak',
      'governor_sevagrad_appointed_lenart',
      'governor_ashenmere_elected_valen',
    ]
    expect(processGovernorsWeek(state, flags).flags).toContain('governors_loyal_majority')
    expect(processGovernorsWeek(state, []).flags).not.toContain('governors_loyal_majority')
  })
})
