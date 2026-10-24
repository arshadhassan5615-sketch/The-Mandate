import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderToStaticMarkup } from 'react-dom/server'
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
    // jsdom's CSSStyleDeclaration drops clamp() font sizes, so check the
    // serialised style attribute instead of the parsed DOM. (The component
    // uses hooks, so it must be rendered rather than called directly.)
    const markup = renderToStaticMarkup(
      <ChoiceCard index={0} text="Wait." state="idle" onSelect={() => {}} onHoverChange={() => {}} />,
    )
    expect(markup).toContain('font-size:var(--choice-font, clamp(12px, 0.98vw, 15px))')
    expect(markup).toContain('padding:3px 10px 3px 17px')
    expect(markup).toContain('line-height:1.25')
  })

  it('draws the resting border in the olive grey of the Suzerain reference', () => {
    renderCard({ state: 'idle' })
    expect(screen.getByRole('button').style.borderColor).toBe('rgb(90, 87, 70)')
  })
})

describe('ChoiceCard when stat-locked', () => {
  const REASON = 'Requires stronger military readiness'

  it('stays focusable, marked aria-disabled, and shows the reason with a padlock', () => {
    renderCard({ lockedReason: REASON })
    const button = screen.getByRole('button')
    expect(button).not.toBeDisabled()
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(button).toHaveAttribute('data-locked', 'true')
    expect(screen.getByTestId('choice-lock-reason')).toHaveTextContent(REASON)
    expect(screen.getByTestId('choice-lock-reason').querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('does not call onSelect when clicked', () => {
    const props = renderCard({ lockedReason: REASON })
    fireEvent.click(screen.getByRole('button'))
    expect(props.onSelect).not.toHaveBeenCalled()
  })

  it('can be reached with the Tab key, so a keyboard user hears the reason', async () => {
    const user = userEvent.setup()
    renderCard({ lockedReason: REASON })
    await user.tab()
    expect(screen.getByRole('button')).toHaveFocus()
    expect(screen.getByRole('button')).toHaveAccessibleDescription(REASON)
  })

  it('does not call onSelect when Enter or Space is pressed on it', async () => {
    const user = userEvent.setup()
    const props = renderCard({ lockedReason: REASON })
    await user.tab()
    await user.keyboard('{Enter}')
    await user.keyboard(' ')
    expect(props.onSelect).not.toHaveBeenCalled()
  })

  it('still calls onSelect when an available card is activated with Enter', async () => {
    const user = userEvent.setup()
    const props = renderCard()
    await user.tab()
    await user.keyboard('{Enter}')
    expect(props.onSelect).toHaveBeenCalledTimes(1)
  })

  it('keeps the choice text as its accessible name, without the reason', () => {
    renderCard({ lockedReason: REASON })
    expect(screen.getByRole('button', { name: '1. Order the guard to stand down.' })).toBeInTheDocument()
  })

  it('exposes the reason once, as its accessible description', () => {
    renderCard({ lockedReason: REASON })
    expect(screen.getByRole('button')).toHaveAccessibleDescription(REASON)
  })

  it('renders greyed out, dashed and not-allowed', () => {
    renderCard({ lockedReason: REASON, state: 'hovered' })
    const button = screen.getByRole('button')
    expect(button.style.color).toBe('rgb(125, 138, 139)')
    expect(button.style.borderStyle).toBe('dashed')
    expect(button.style.background).toBe('transparent')
    expect(button.style.opacity).toBe('1')
    expect(button.style.cursor).toBe('not-allowed')
  })

  it('dims only the choice text by colour, not the whole button, so the reason stays readable', () => {
    renderCard({ lockedReason: REASON })
    const button = screen.getByRole('button')
    expect(button.style.opacity).not.toBe('0.6')
    expect(button.style.color).toBe('rgb(125, 138, 139)')
    expect(screen.getByTestId('choice-lock-reason').style.color).toBe('rgb(176, 134, 106)')
  })
})

describe('ChoiceCard when available', () => {
  it('carries no lock marking or reason line', () => {
    renderCard()
    const button = screen.getByRole('button')
    expect(button).not.toHaveAttribute('data-locked')
    expect(button).not.toHaveAttribute('aria-disabled')
    expect(screen.queryByTestId('choice-lock-reason')).toBeNull()
  })
})
