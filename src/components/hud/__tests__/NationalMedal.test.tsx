import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import NationalMedal from '../NationalMedal'

describe('NationalMedal', () => {
  it('renders the medal at the requested width and height', () => {
    render(<NationalMedal size={76} />)
    const medal = screen.getByTestId('national-medal')
    expect(medal).toHaveAttribute('width', '76')
    expect(medal).toHaveAttribute('height', '76')
  })

  it('draws 18 laurel leaves and one raised star', () => {
    render(<NationalMedal size={120} />)
    const medal = screen.getByTestId('national-medal')
    expect(within(medal).getAllByTestId('medal-leaf')).toHaveLength(18)
    expect(within(medal).getAllByTestId('medal-star')).toHaveLength(1)
  })

  it('keeps element ids unique when two medals share a tree', () => {
    const { container } = render(
      <div>
        <NationalMedal size={76} />
        <NationalMedal size={120} />
      </div>,
    )
    const ids = Array.from(container.querySelectorAll('[id]'), (el) => el.id)
    expect(ids.length).toBeGreaterThan(0)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('points every gradient reference at a gradient in the same medal', () => {
    const { container } = render(<NationalMedal size={76} />)
    const ids = new Set(Array.from(container.querySelectorAll('[id]'), (el) => el.id))
    const refs = Array.from(container.querySelectorAll('[fill]'), (el) => el.getAttribute('fill') ?? '')
      .filter((fill) => fill.startsWith('url(#'))
    expect(refs.length).toBeGreaterThan(0)
    for (const ref of refs) {
      expect(ids.has(ref.slice(5, -1))).toBe(true)
    }
  })
})
