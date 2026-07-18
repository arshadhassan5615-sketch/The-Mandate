// EconomyPanel: pure helpers (color thresholds, history→SVG) + store-fed mount.
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import EconomyPanel, {
  economyHealthColor,
  mapEconomyHistoryToPoints,
  pointsToPolyline,
} from '../EconomyPanel'
import { useGameStore } from '../../../stores/gameStore'

function resetStore() {
  useGameStore.getState().resetToInitial()
}

describe('economyHealthColor', () => {
  it('returns green branch for health > 10', () => {
    expect(economyHealthColor(11)).toBe('var(--accent-green)')
    expect(economyHealthColor(50)).toBe('var(--accent-green)')
  })

  it('returns red branch for health < -10', () => {
    expect(economyHealthColor(-11)).toBe('var(--accent-red)')
    expect(economyHealthColor(-50)).toBe('var(--accent-red)')
  })

  it('returns neutral gold for -10…10 inclusive', () => {
    expect(economyHealthColor(10)).toBe('#c9a84c')
    expect(economyHealthColor(-10)).toBe('#c9a84c')
    expect(economyHealthColor(0)).toBe('#c9a84c')
    expect(economyHealthColor(5)).toBe('#c9a84c')
  })
})

describe('mapEconomyHistoryToPoints / pointsToPolyline', () => {
  it('returns empty array for empty history', () => {
    expect(mapEconomyHistoryToPoints([])).toEqual([])
    expect(pointsToPolyline([])).toBe('')
  })

  it('maps multi-point history: later week → higher x, higher value → lower y', () => {
    const history = [
      { week: 1, value: -20 },
      { week: 5, value: 40 },
      { week: 10, value: 0 },
    ]
    const points = mapEconomyHistoryToPoints(history, 280, 120, 12)
    expect(points).toHaveLength(3)

    // Week order drives x (strictly increasing with week)
    expect(points[1].x).toBeGreaterThan(points[0].x)
    expect(points[2].x).toBeGreaterThan(points[1].x)

    // Higher value → smaller SVG y (value 40 vs -20)
    expect(points[1].y).toBeLessThan(points[0].y)

    // Coordinates scale with input — swapping values changes y, not hardcoded
    const swapped = mapEconomyHistoryToPoints(
      [
        { week: 1, value: 40 },
        { week: 5, value: -20 },
      ],
      280,
      120,
      12,
    )
    expect(swapped[0].y).toBeLessThan(swapped[1].y)
    expect(swapped[0].y).not.toBe(points[0].y)

    // Polyline string includes all points and is driven by geometry
    const poly = pointsToPolyline(points)
    for (const p of points) {
      expect(poly).toContain(`${p.x},${p.y}`)
    }
  })

  it('places a single history entry inside the padded chart bounds', () => {
    const points = mapEconomyHistoryToPoints([{ week: 3, value: -18 }], 200, 100, 10)
    expect(points).toHaveLength(1)
    expect(points[0].x).toBeGreaterThanOrEqual(10)
    expect(points[0].x).toBeLessThanOrEqual(190)
    expect(points[0].y).toBeGreaterThanOrEqual(10)
    expect(points[0].y).toBeLessThanOrEqual(90)
    expect(points[0].week).toBe(3)
    expect(points[0].value).toBe(-18)
  })
})

describe('EconomyPanel (store-fed)', () => {
  beforeEach(resetStore)

  it('shows economyHealth from the store and ECONOMY header', () => {
    useGameStore.setState(s => ({
      nation: { ...s.nation, economyHealth: -18 },
      economyHistory: [],
    }))
    render(<EconomyPanel onClose={() => {}} />)
    expect(screen.getByText('ECONOMY')).toBeInTheDocument()
    expect(screen.getByTestId('economy-health-value').textContent).toBe('-18')
    expect(screen.getByTestId('economy-trend-empty')).toBeInTheDocument()
  })

  it('renders SVG polyline when economyHistory has multiple points', () => {
    const history = [
      { week: 1, value: -18 },
      { week: 2, value: -10 },
      { week: 3, value: 12 },
    ]
    useGameStore.setState(s => ({
      nation: { ...s.nation, economyHealth: 12 },
      economyHistory: history,
    }))
    render(<EconomyPanel onClose={() => {}} />)
    expect(screen.getByTestId('economy-health-value').textContent).toBe('+12')
    const svg = screen.getByTestId('economy-trend-svg')
    expect(svg).toBeInTheDocument()

    // Single cream/gold polyline through all mapped points (no polarity split)
    const mapped = mapEconomyHistoryToPoints(history, 280, 140)
    const poly = screen.getByTestId('economy-trend-polyline')
    expect(poly.getAttribute('points')).toBe(pointsToPolyline(mapped))
    expect(poly.getAttribute('stroke')).toBe('#e8dcc0')
  })
})
