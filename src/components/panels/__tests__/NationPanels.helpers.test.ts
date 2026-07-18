// Pure helpers for PublicOrderPanel, InflationPanel, DebtPanel
import { describe, it, expect } from 'vitest'
import {
  publicOrderColor,
  mapPublicOrderHistoryToPoints,
} from '../PublicOrderPanel'
import {
  inflationColor,
  formatInflation,
  mapInflationHistoryToPoints,
} from '../InflationPanel'
import {
  debtStatusTier,
  debtStatusColor,
  formatDebt,
  computeDebtYAxisMax,
  mapDebtHistoryToPoints,
} from '../DebtPanel'

describe('publicOrderColor / mapPublicOrderHistoryToPoints', () => {
  it('uses Stable/Volatile bands: green >65, red <32, gold between', () => {
    expect(publicOrderColor(66)).toBe('var(--accent-green)')
    expect(publicOrderColor(100)).toBe('var(--accent-green)')
    expect(publicOrderColor(31)).toBe('var(--accent-red)')
    expect(publicOrderColor(0)).toBe('var(--accent-red)')
    expect(publicOrderColor(32)).toBe('#c9a84c')
    expect(publicOrderColor(65)).toBe('#c9a84c')
    expect(publicOrderColor(48)).toBe('#c9a84c')
  })

  it('maps 0…100 domain: higher value → lower SVG y', () => {
    const points = mapPublicOrderHistoryToPoints(
      [
        { week: 1, value: 0 },
        { week: 2, value: 100 },
      ],
      280,
      140,
      12,
    )
    expect(points).toHaveLength(2)
    expect(points[1].x).toBeGreaterThan(points[0].x)
    expect(points[1].y).toBeLessThan(points[0].y)
    // Value 100 sits at top pad; value 0 at bottom pad
    expect(points[1].y).toBe(12)
    expect(points[0].y).toBe(140 - 12)
  })
})

describe('inflationColor / formatInflation / mapInflationHistoryToPoints', () => {
  it('inverts color: red >15, gold >8, green ≤8 (Overview thresholds)', () => {
    expect(inflationColor(16)).toBe('var(--accent-red)')
    expect(inflationColor(30)).toBe('var(--accent-red)')
    expect(inflationColor(8.1)).toBe('#c9a84c')
    expect(inflationColor(15)).toBe('#c9a84c')
    expect(inflationColor(8)).toBe('var(--accent-green)')
    expect(inflationColor(0)).toBe('var(--accent-green)')
  })

  it('formats with one decimal and percent sign', () => {
    expect(formatInflation(8.7)).toBe('8.7%')
    expect(formatInflation(9)).toBe('9.0%')
  })

  it('maps 0…30 domain: higher inflation → lower SVG y', () => {
    const points = mapInflationHistoryToPoints(
      [
        { week: 1, value: 0 },
        { week: 2, value: 30 },
      ],
      280,
      140,
      12,
    )
    expect(points[1].y).toBeLessThan(points[0].y)
    expect(points[1].y).toBe(12)
    expect(points[0].y).toBe(140 - 12)
  })
})

describe('debt helpers (tier / format / dynamic axis)', () => {
  it('tiers STABLE ≤300, ELEVATED ≤450, CRITICAL >450', () => {
    expect(debtStatusTier(0)).toBe('STABLE')
    expect(debtStatusTier(300)).toBe('STABLE')
    expect(debtStatusTier(301)).toBe('ELEVATED')
    expect(debtStatusTier(450)).toBe('ELEVATED')
    expect(debtStatusTier(451)).toBe('CRITICAL')
    expect(debtStatusColor('STABLE')).toBe('var(--accent-green)')
    expect(debtStatusColor('ELEVATED')).toBe('#c9a84c')
    expect(debtStatusColor('CRITICAL')).toBe('var(--accent-red)')
  })

  it('formats Overview-style millions ₭', () => {
    expect(formatDebt(340)).toBe('340M ₭')
  })

  it('computeDebtYAxisMax rounds up to 100 + headroom', () => {
    // max 340 → ceil(3.4)*100 + 100 = 400 + 100 = 500
    expect(computeDebtYAxisMax([{ value: 340 }])).toBe(500)
    // max 300 already on a hundred → 300 + 100 = 400
    expect(computeDebtYAxisMax([{ value: 300 }])).toBe(400)
    // empty → Math.max(..., 100) → 100 + 100 = 200
    expect(computeDebtYAxisMax([])).toBe(200)
    // already on hundred: 400 → 400 + 100 = 500
    expect(computeDebtYAxisMax([{ value: 400 }])).toBe(500)
  })

  it('mapDebtHistoryToPoints uses dynamic yAxisMax; threshold 300 sits mid-scale when max=600', () => {
    const yMax = 600
    const points = mapDebtHistoryToPoints(
      [
        { week: 1, value: 0 },
        { week: 2, value: 300 },
        { week: 3, value: 600 },
      ],
      yMax,
      280,
      140,
      12,
    )
    expect(points).toHaveLength(3)
    // 0 at bottom, 600 at top, 300 halfway
    expect(points[0].y).toBe(140 - 12)
    expect(points[2].y).toBe(12)
    const mid = 12 + (140 - 24) / 2
    expect(points[1].y).toBeCloseTo(mid, 5)
  })
})
