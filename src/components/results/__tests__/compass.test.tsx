import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { compassPosition, compassLabel } from '../compass'
import CompassPlot from '../CompassPlot'
import type { ChoiceAlignment } from '../../../types/journal'

const counts = (over: Partial<Record<ChoiceAlignment, number>>): Record<ChoiceAlignment, number> => ({
  reformist: 0, pragmatist: 0, authoritarian: 0, populist: 0, personal: 0, deflect: 0, ...over,
})

describe('compassPosition', () => {
  it('needs a few political choices before plotting', () => {
    expect(compassPosition(counts({ reformist: 2, personal: 40 }))).toBeNull()
  })

  it('ignores personal and deflecting choices', () => {
    const a = compassPosition(counts({ reformist: 4 }))!
    const b = compassPosition(counts({ reformist: 4, personal: 9, deflect: 9 }))!
    expect(b).toEqual(a)
  })

  it('places reform at the top and populism to the right', () => {
    const p = compassPosition(counts({ reformist: 6, populist: 3, pragmatist: 1 }))!
    expect(p.y).toBeCloseTo(0.6)
    expect(p.x).toBeCloseTo(0.2)
    expect(p.label).toBe('Tribune of Reform')
  })
})

describe('compassLabel', () => {
  it('names each quadrant and the centre', () => {
    expect(compassLabel(0, 0)).toBe('Steward of the Centre')
    expect(compassLabel(-0.5, 0.5)).toBe('Reforming Technocrat')
    expect(compassLabel(-0.5, -0.5)).toBe('Iron Administrator')
    expect(compassLabel(0.5, -0.5)).toBe('Strong Hand of the People')
    expect(compassLabel(0, -0.6)).toBe('Chancellor of Order')
  })
})

describe('CompassPlot', () => {
  it('describes the position for screen readers', () => {
    render(<CompassPlot position={compassPosition(counts({ authoritarian: 5, pragmatist: 3 }))} />)
    expect(screen.getByRole('img', { name: /Iron Administrator, from 8 decisions/ })).toBeInTheDocument()
  })

  it('says so when there is nothing to plot', () => {
    render(<CompassPlot position={null} />)
    expect(screen.getByTestId('compass-empty')).toBeInTheDocument()
  })
})
