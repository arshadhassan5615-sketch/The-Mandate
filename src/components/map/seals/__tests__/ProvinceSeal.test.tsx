import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProvinceSeal from '../ProvinceSeal'
import { PROVINCE_SEALS, SEAL_TILT_RATIO, sealSizeFor, type SealEmblem } from '../provinceSeals'

const CITY_SIZE = 128
const EMBLEMS: SealEmblem[] = ['compass', 'hammer_pick', 'wheat', 'fortress', 'anchor', 'mountain']
const CROWN_SELECTOR = 'path[d^="M86 74"]'

describe('ProvinceSeal', () => {
  it('letters the province name around the rim', () => {
    render(<ProvinceSeal {...PROVINCE_SEALS.kravenstal} size={CITY_SIZE} />)
    expect(screen.getAllByText('KRAVENSTAL').length).toBeGreaterThanOrEqual(1)
  })

  it('marks the capital and gives it a laurel instead of rivets', () => {
    const { container } = render(
      <ProvinceSeal {...PROVINCE_SEALS.ashenmere} size={sealSizeFor('ashenmere')} />,
    )
    expect(screen.getByTestId('province-seal').getAttribute('data-capital')).toBe('true')
    expect(container.querySelectorAll('[data-testid="seal-laurel"]')).toHaveLength(12)
    expect(container.querySelectorAll('[data-testid="seal-rivet"]')).toHaveLength(0)
  })

  it('gives a city three rivets', () => {
    const { container } = render(
      <ProvinceSeal {...PROVINCE_SEALS.thornfeld} size={sealSizeFor('thornfeld')} />,
    )
    expect(container.querySelectorAll('[data-testid="seal-rivet"]')).toHaveLength(3)
    expect(container.querySelectorAll('[data-testid="seal-laurel"]')).toHaveLength(0)
    expect(screen.getByTestId('province-seal').getAttribute('data-capital')).toBe('false')
  })

  it.each(EMBLEMS)('renders the %s emblem', (emblem) => {
    const { container } = render(
      <ProvinceSeal name="Test" emblem={emblem} field="#000000" size={CITY_SIZE} />,
    )
    expect(container.querySelector(`[data-emblem="${emblem}"]`)).not.toBeNull()
  })

  it('draws a crown only on the capital', () => {
    const capitalTree = render(
      <ProvinceSeal {...PROVINCE_SEALS.ashenmere} size={sealSizeFor('ashenmere')} />,
    )
    const capitalGroup = capitalTree.container.querySelector('[data-emblem="compass"]')
    expect(capitalGroup).not.toBeNull()
    expect(capitalGroup?.querySelector(CROWN_SELECTOR)).not.toBeNull()

    const cityTree = render(<ProvinceSeal {...PROVINCE_SEALS.kravenstal} size={CITY_SIZE} />)
    const cityGroup = cityTree.container.querySelector('[data-emblem="hammer_pick"]')
    expect(cityGroup).not.toBeNull()
    expect(cityGroup?.querySelector(CROWN_SELECTOR)).toBeNull()
  })

  it('uses unique ids per seal', () => {
    const { container } = render(
      <>
        <ProvinceSeal {...PROVINCE_SEALS.ashenmere} size={sealSizeFor('ashenmere')} />
        <ProvinceSeal {...PROVINCE_SEALS.kravenstal} size={CITY_SIZE} />
      </>,
    )
    const ids = Array.from(container.querySelectorAll('[id]'), (el) => el.id)
    expect(ids.length).toBeGreaterThan(0)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('squashes the seal to lie on the map', () => {
    render(<ProvinceSeal name="Test" emblem="mountain" field="#000000" size={CITY_SIZE} />)
    expect(screen.getByTestId('province-seal').style.height).toBe(
      `${Math.round(128 * SEAL_TILT_RATIO)}px`,
    )
  })

  it('sizes the capital larger than a city', () => {
    expect(sealSizeFor('ashenmere')).toBe(215)
    expect(sealSizeFor('thornfeld')).toBe(175)
  })

  it('defines exactly the six provinces', () => {
    expect(Object.keys(PROVINCE_SEALS).sort()).toEqual([
      'aldenmoor',
      'ashenmere',
      'dravenhollow',
      'kravenstal',
      'sevagrad',
      'thornfeld',
    ])
  })

  it('shows the painted medal instead of the drawn seal when art is given', () => {
    const { container } = render(
      <ProvinceSeal {...PROVINCE_SEALS.ashenmere} size={sealSizeFor('ashenmere')} art="painted.png" />,
    )
    expect(screen.getByTestId('province-seal-art')).toHaveAttribute('src', 'painted.png')
    expect(container.querySelector('[data-emblem]')).toBeNull()
    expect(screen.getByTestId('province-seal').getAttribute('data-capital')).toBe('true')
  })

  it('draws the seal when no art is given', () => {
    const { container } = render(
      <ProvinceSeal {...PROVINCE_SEALS.kravenstal} size={CITY_SIZE} />,
    )
    expect(screen.queryByTestId('province-seal-art')).toBeNull()
    expect(container.querySelector('[data-emblem]')).not.toBeNull()
  })

  it('shows no mood aura when the province is calm', () => {
    render(<ProvinceSeal {...PROVINCE_SEALS.kravenstal} size={CITY_SIZE} mood="calm" />)
    expect(screen.queryByTestId('province-mood')).toBeNull()
  })

  it('shows no mood aura by default', () => {
    render(<ProvinceSeal {...PROVINCE_SEALS.kravenstal} size={CITY_SIZE} />)
    expect(screen.queryByTestId('province-mood')).toBeNull()
  })

  it('shows no aura when the province is only tense', () => {
    render(<ProvinceSeal {...PROVINCE_SEALS.kravenstal} size={CITY_SIZE} mood="tense" />)
    expect(screen.queryByTestId('province-mood')).toBeNull()
  })

  it('casts only a plain shadow, never a gold glow', () => {
    render(<ProvinceSeal {...PROVINCE_SEALS.kravenstal} size={CITY_SIZE} />)
    expect(screen.getByTestId('province-seal').style.filter).not.toMatch(/232, ?190, ?90/)
  })

  it('shows a red breathing aura when the province is in crisis', () => {
    render(<ProvinceSeal {...PROVINCE_SEALS.kravenstal} size={CITY_SIZE} mood="crisis" />)
    const aura = screen.getByTestId('province-mood')
    expect(aura).toHaveAttribute('data-mood', 'crisis')
    expect(aura).toHaveClass('province-mood--crisis')
  })

  it('keeps the painted medal and the drawn emblem visible alongside the aura', () => {
    const { container } = render(
      <ProvinceSeal {...PROVINCE_SEALS.ashenmere} size={sealSizeFor('ashenmere')} mood="crisis" art="painted.png" />,
    )
    expect(screen.getByTestId('province-seal-art')).toHaveAttribute('src', 'painted.png')
    expect(screen.getByTestId('province-mood')).toBeInTheDocument()

    const drawn = render(
      <ProvinceSeal {...PROVINCE_SEALS.kravenstal} size={CITY_SIZE} mood="tense" />,
    )
    expect(drawn.container.querySelector('[data-emblem]')).not.toBeNull()
    expect(container.querySelector('[data-emblem]')).toBeNull()
  })
})
