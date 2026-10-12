import { describe, it, expect } from 'vitest'
import { buildSituations, severityOf, trendOf } from '../situations'
import { buildGameState } from '../../../test/factories/gameStateFactory'

const lowIsBad = { higherIsWorse: false, bounds: [65, 45, 28] as const, deadBand: 2 }
const highIsBad = { higherIsWorse: true, bounds: [300, 450, 600] as const, deadBand: 5 }

describe('severityOf', () => {
  it('grades a measure where lower is worse', () => {
    expect(severityOf(80, lowIsBad)).toBe('Calm')
    expect(severityOf(50, lowIsBad)).toBe('Strained')
    expect(severityOf(30, lowIsBad)).toBe('Serious')
    expect(severityOf(10, lowIsBad)).toBe('Critical')
  })

  it('grades a measure where higher is worse', () => {
    expect(severityOf(200, highIsBad)).toBe('Calm')
    expect(severityOf(340, highIsBad)).toBe('Strained')
    expect(severityOf(500, highIsBad)).toBe('Serious')
    expect(severityOf(700, highIsBad)).toBe('Critical')
  })
})

describe('trendOf', () => {
  const history = [{ week: 3, value: 60 }, { week: 4, value: 55 }, { week: 5, value: 50 }]

  it('compares with two weeks ago', () => {
    // week 7: compares with the week-5 snapshot (50)
    expect(trendOf(40, history, 7, lowIsBad)).toBe('Worsening')
    expect(trendOf(58, history, 7, lowIsBad)).toBe('Easing')
  })

  it('ignores changes inside the dead band', () => {
    expect(trendOf(51, history, 7, lowIsBad)).toBe('Holding')
  })

  it('reads a rising value as worsening when higher is worse', () => {
    expect(trendOf(400, [{ week: 1, value: 340 }], 3, highIsBad)).toBe('Worsening')
  })

  it('holds when there is no history yet', () => {
    expect(trendOf(10, [], 1, lowIsBad)).toBe('Holding')
  })
})

describe('buildSituations', () => {
  it('lists the four national situations, most severe first', () => {
    const base = buildGameState()
    const list = buildSituations({
      ...base,
      currentWeek: 6,
      nation: { ...base.nation, publicOrder: 20, economyHealth: 30, nationalDebt: 200, inflation: 2 },
    })
    expect(list.map(s => s.id).sort()).toEqual(['debt', 'economy', 'inflation', 'order'])
    expect(list[0]).toMatchObject({ id: 'order', severity: 'Critical' })
  })

  it('never puts numbers in what the player reads', () => {
    for (const s of buildSituations(buildGameState())) {
      expect(`${s.title} ${s.severity} ${s.trend} ${s.summary}`).not.toMatch(/\d/)
    }
  })
})
