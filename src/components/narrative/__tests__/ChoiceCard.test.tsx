import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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
})
