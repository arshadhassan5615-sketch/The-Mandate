import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RailButton from '../RailButton'

const Icon = () => <svg data-testid="icon" />

describe('RailButton', () => {
  it('renders an accessible button with the label', () => {
    render(<RailButton icon={<Icon />} label="Journal" onClick={() => {}} />)
    expect(screen.getByRole('button', { name: 'Journal' })).toBeInTheDocument()
  })

  it('hides the tooltip until hover', () => {
    render(<RailButton icon={<Icon />} label="Journal" onClick={() => {}} />)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    fireEvent.mouseEnter(screen.getByRole('button'))
    expect(screen.getByRole('tooltip')).toHaveTextContent('Journal')
    fireEvent.mouseLeave(screen.getByRole('button'))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('shows the tooltip on keyboard focus too', () => {
    render(<RailButton icon={<Icon />} label="Codex" onClick={() => {}} />)
    fireEvent.focus(screen.getByRole('button'))
    expect(screen.getByRole('tooltip')).toHaveTextContent('Codex')
    fireEvent.blur(screen.getByRole('button'))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('shows the shortcut key in the tooltip and exposes it to assistive tech', () => {
    render(<RailButton icon={<Icon />} label="Journal" shortcut="J" onClick={() => {}} />)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-keyshortcuts', 'J')
    fireEvent.focus(button)
    expect(screen.getByRole('tooltip')).toHaveTextContent('J')
  })

  it('renders a count badge and caps it at 99+', () => {
    const { rerender } = render(<RailButton icon={<Icon />} label="Letters" badge={3} onClick={() => {}} />)
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByRole('button')).toHaveAccessibleName('Letters, 3 unread')
    rerender(<RailButton icon={<Icon />} label="Letters" badge={140} onClick={() => {}} />)
    expect(screen.getByText('99+')).toBeInTheDocument()
  })

  it('omits the badge at zero', () => {
    render(<RailButton icon={<Icon />} label="Letters" badge={0} onClick={() => {}} />)
    expect(screen.getByRole('button')).toHaveAccessibleName('Letters')
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('marks the active state with aria-pressed', () => {
    render(<RailButton icon={<Icon />} label="Notepad" active onClick={() => {}} />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
  })

  it('calls onClick', () => {
    const onClick = vi.fn()
    render(<RailButton icon={<Icon />} label="Codex" onClick={onClick} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
