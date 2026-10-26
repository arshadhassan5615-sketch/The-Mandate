import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ViewportMode } from '../../hooks/useViewportMode'
import { CabinetFormation } from '../CabinetFormation'

const viewport = vi.hoisted(() => ({ mode: 'compact' as ViewportMode }))

vi.mock('../../hooks/usePageInsets', () => ({
  usePageInsets: () => {
    const insets = {
      desktop: { top: 52, right: 96, bottom: 0, left: 124 },
      compact: { top: 40, right: 64, bottom: 0, left: 80 },
      phone: { top: 52, right: 0, bottom: 60, left: 0 },
    }[viewport.mode]
    return {
      ...insets,
      isPhone: viewport.mode === 'phone',
      isCompact: viewport.mode === 'compact',
      mode: viewport.mode,
    }
  },
}))

describe('CabinetFormation dense layout', () => {
  beforeEach(() => {
    viewport.mode = 'compact'
  })

  it('renders the appointment title in compact mode', () => {
    render(<CabinetFormation onComplete={vi.fn()} />)

    expect(screen.getByText('Appoint Your Cabinet')).toBeInTheDocument()
  })

  it('marks a tapped candidate as pressed and updates the filled count', () => {
    render(<CabinetFormation onComplete={vi.fn()} />)
    fireEvent.click(screen.getByTestId('ministry-row-interior'))

    const card = screen.getByTestId('candidate-card-danika_oberlin')
    expect(card).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('0 of 10 ministries filled')).toBeInTheDocument()

    fireEvent.click(card)

    expect(card).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('1 of 10 ministries filled')).toBeInTheDocument()
  })

  it('selects a candidate with the keyboard', () => {
    render(<CabinetFormation onComplete={vi.fn()} />)
    fireEvent.click(screen.getByTestId('ministry-row-interior'))

    const card = screen.getByTestId('candidate-card-danika_oberlin')
    fireEvent.keyDown(card, { key: 'Enter' })

    expect(card).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('1 of 10 ministries filled')).toBeInTheDocument()
  })

  it('switches the candidate list when a ministry row is selected', () => {
    render(<CabinetFormation onComplete={vi.fn()} />)

    expect(screen.queryByTestId('candidate-card-danika_oberlin')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('ministry-row-interior'))

    expect(screen.getByTestId('candidate-card-danika_oberlin')).toBeInTheDocument()
  })

  it('uses the dense header padding in compact mode', () => {
    render(<CabinetFormation onComplete={vi.fn()} />)

    const header = screen.getByTestId('cabinet-header')
    expect(header).toHaveStyle({ padding: '6px 16px' })
  })

  it('keeps the desktop header padding in desktop mode', () => {
    viewport.mode = 'desktop'
    render(<CabinetFormation onComplete={vi.fn()} />)

    const header = screen.getByTestId('cabinet-header')
    expect(header).toHaveStyle({ padding: '20px 48px 16px' })
  })
})
