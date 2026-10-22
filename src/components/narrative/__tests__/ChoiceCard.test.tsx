import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { CSSProperties, ReactElement } from 'react'
import ChoiceCard from '../ChoiceCard'

function renderCard(overrides: Partial<Parameters<typeof ChoiceCard>[0]> = {}) {
  const props = {
    index: 0,
    text: 'Order the guard to stand down.',
    state: 'idle' as const,
    onSelect: vi.fn(),
    onHoverChange: vi.fn(),
    ...overrides,
  }
  render(<ChoiceCard {...props} />)
  return props
}

describe('ChoiceCard', () => {
  it('is a real button, reachable by keyboard', () => {
    renderCard()
    const button = screen.getByRole('button', { name: /Order the guard to stand down/ })
    expect(button).toHaveAttribute('type', 'button')
  })

  it('shows its 1-based number, matching the number-key shortcut', () => {
    renderCard({ index: 2 })
    expect(screen.getByText('3.')).toBeInTheDocument()
  })

  it('runs the number and text as one line, so wrapped text returns under the number', () => {
    renderCard({ index: 0 })
    const button = screen.getByRole('button')
    expect(button.style.display).toBe('block')
    expect(screen.getByText('1.').style.display).not.toBe('block')
  })

  it('calls onSelect when clicked', () => {
    const props = renderCard()
    fireEvent.click(screen.getByRole('button'))
    expect(props.onSelect).toHaveBeenCalledTimes(1)
  })

  it('shows the author hint when the choice has one', () => {
    renderCard({ hint: 'Vyktor will remember this.' })
    expect(screen.getByText('Vyktor will remember this.')).toBeInTheDocument()
  })

  it('renders no hint line when the choice has none', () => {
    const { container } = render(
      <ChoiceCard index={0} text="Wait." state="idle" onSelect={() => {}} onHoverChange={() => {}} />,
    )
    expect(container.querySelector('.choice-card__hint')).toBeNull()
  })

  it('keeps Enter and Space from reaching the global advance handler', () => {
    const onWindowKey = vi.fn()
    window.addEventListener('keydown', onWindowKey)
    renderCard()
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' })
    fireEvent.keyDown(screen.getByRole('button'), { key: ' ' })
    window.removeEventListener('keydown', onWindowKey)
    expect(onWindowKey).not.toHaveBeenCalled()
  })

  it('is disabled while another choice is resolving', () => {
    renderCard({ state: 'dimmed' })
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('reports hover changes', () => {
    const props = renderCard()
    fireEvent.mouseEnter(screen.getByRole('button'))
    fireEvent.mouseLeave(screen.getByRole('button'))
    expect(props.onHoverChange).toHaveBeenNthCalledWith(1, true)
    expect(props.onHoverChange).toHaveBeenNthCalledWith(2, false)
  })

  it('is a thin-bordered box, transparent at rest', () => {
    renderCard()
    const button = screen.getByRole('button')
    expect(button.style.borderStyle).toBe('solid')
    expect(button.style.background).toBe('transparent')
  })

  it('is teal text at rest', () => {
    renderCard()
    expect(screen.getByRole('button').style.color).toBe('rgb(110, 158, 162)')
  })

  it('lights up on hover state', () => {
    renderCard({ state: 'hovered' })
    expect(screen.getByRole('button').style.color).toBe('rgb(168, 224, 227)')
  })

  it('uses viewport-scaled text and compact padding', () => {
    // jsdom's CSSStyleDeclaration drops clamp() font sizes, so read the style
    // object React receives from the rendered element tree instead of the DOM.
    const element = ChoiceCard({
      index: 0,
      text: 'Wait.',
      state: 'idle',
      onSelect: () => {},
      onHoverChange: () => {},
    }) as ReactElement<{ style: CSSProperties }>
    expect(element.props.style.fontSize).toBe('var(--choice-font, clamp(12px, 0.98vw, 15px))')
    expect(element.props.style.padding).toBe('3px 10px 3px 17px')
    expect(element.props.style.lineHeight).toBe(1.25)
  })

  it('draws the resting border in the olive grey of the Suzerain reference', () => {
    renderCard({ state: 'idle' })
    expect(screen.getByRole('button').style.borderColor).toBe('rgb(90, 87, 70)')
  })
})
