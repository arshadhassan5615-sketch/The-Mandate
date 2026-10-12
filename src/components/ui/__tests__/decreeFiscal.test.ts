import { describe, it, expect } from 'vitest'
import { decreeBudgetCost } from '../decreeFiscal'
import { ALL_DECREES } from '../../../data/decrees'
import type { DecreeEffect } from '../../../types/decree'

const debt = (value: number, delayWeeks?: number): DecreeEffect =>
  ({ stat: 'nation.nationalDebt', value, operation: 'add', delayWeeks, description: '' })

describe('decreeBudgetCost', () => {
  it('reports spending as a negative budget cost', () => {
    expect(decreeBudgetCost({ immediateEffects: [debt(20)], longTermEffects: [] })).toBe(-20)
  })

  it('nets immediate and delayed debt effects', () => {
    expect(decreeBudgetCost({ immediateEffects: [debt(12)], longTermEffects: [debt(-10, 4)] })).toBe(-2)
  })

  it('ignores effects on other stats', () => {
    const other: DecreeEffect = { stat: 'factions.church', value: 10, description: '' }
    expect(decreeBudgetCost({ immediateEffects: [other], longTermEffects: [] })).toBe(0)
  })
})

// Guards the authored data: every debt effect described as a cost must add debt,
// every one described as revenue or deficit reduction must reduce it.
describe('decree debt effects match their descriptions', () => {
  const effects = ALL_DECREES.flatMap(d => [...d.immediateEffects, ...d.longTermEffects])
    .filter(e => e.stat === 'nation.nationalDebt')

  it('has debt effects to check', () => {
    expect(effects.length).toBeGreaterThan(0)
  })

  it.each(effects.map(e => [e.description, e.value] as const))('%s (%d)', (description, value) => {
    const isRevenue = /revenue|deficit reduction/i.test(description) && !/loss/i.test(description)
    expect(Math.sign(value)).toBe(isRevenue ? -1 : 1)
  })
})
