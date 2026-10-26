import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ViewportMode } from '../../hooks/useViewportMode'
import type { MinisterRequest } from '../../types/minister'
import { CabinetMeeting } from '../CabinetMeeting'
import { Z } from '../../constants/zIndex'

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

const request: MinisterRequest = {
  id: 'dense_test_request',
  minister_id: 'unknown_minister',
  week: 1,
  type: 'policy',
  title: 'Dense Test Directive',
  description: 'A test report for the dense cabinet meeting layout.',
  urgent: false,
  options: [
    {
      id: 'opt_approve',
      text: 'Approve the proposal',
      stat_effects: {},
      loyalty_effect: 1,
      satisfaction_effect: 1,
      consequence: 'The proposal moves forward',
    },
    {
      id: 'opt_reject',
      text: 'Reject the proposal',
      stat_effects: {},
      loyalty_effect: -1,
      satisfaction_effect: -1,
      consequence: 'The proposal is shelved',
    },
  ],
}

describe('CabinetMeeting dense layout', () => {
  beforeEach(() => {
    viewport.mode = 'compact'
  })

  it('renders above the HUD and map pins', () => {
    render(<CabinetMeeting requests={[request]} onComplete={vi.fn()} />)

    const header = screen.getByTestId('cabinet-header')
    const root = header.parentElement
    expect(root).not.toBeNull()
    expect(root?.style.zIndex).toBe(String(Z.overlay))
    expect(Z.overlay).toBe(800)
  })

  it('uses the dense header padding in compact mode', () => {
    render(<CabinetMeeting requests={[request]} onComplete={vi.fn()} />)

    expect(screen.getByTestId('cabinet-header')).toHaveStyle({ padding: '6px 16px' })
  })

  it('keeps the desktop header padding in desktop mode', () => {
    viewport.mode = 'desktop'
    render(<CabinetMeeting requests={[request]} onComplete={vi.fn()} />)

    expect(screen.getByTestId('cabinet-header')).toHaveStyle({ padding: '20px 48px 16px' })
  })

  it('reveals the next button after clicking an option', () => {
    render(<CabinetMeeting requests={[request]} onComplete={vi.fn()} />)

    expect(screen.queryByTestId('cabinet-meeting-next')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('cabinet-option-opt_approve'))

    expect(screen.getByTestId('cabinet-meeting-next')).toBeInTheDocument()
  })

  it('selects an option with the Enter key', () => {
    render(<CabinetMeeting requests={[request]} onComplete={vi.fn()} />)

    const option = screen.getByTestId('cabinet-option-opt_reject')
    expect(option).toHaveAttribute('role', 'button')
    expect(option).toHaveAttribute('tabindex', '0')
    fireEvent.keyDown(option, { key: 'Enter' })

    expect(screen.getByTestId('cabinet-meeting-next')).toBeInTheDocument()
    expect(screen.getByText('"Reject the proposal"')).toBeInTheDocument()
  })
})
