// Landscape-phone (compact) layout: Budget and Constitutional Reform drop their
// chrome so the scrolling content gets the height and the action button stays in view.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import BudgetInterface from '../BudgetInterface'
import ConstitutionalReform from '../ConstitutionalReform'
import { useGameStore } from '../../stores/gameStore'

const desktop = { width: window.innerWidth, height: window.innerHeight }

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true, writable: true })
  Object.defineProperty(window, 'innerHeight', { value: height, configurable: true, writable: true })
}

describe('compact Budget and Constitutional Reform layouts', () => {
  beforeEach(() => {
    useGameStore.getState().resetToInitial()
  })
  afterEach(() => {
    setViewport(desktop.width, desktop.height)
  })

  it('Budget at 844x390 drops the letterhead, stamp and footer but keeps the commit button and revenue', () => {
    setViewport(844, 390)
    const { container } = render(<BudgetInterface />)
    expect(container.firstElementChild).toHaveAttribute('data-layout', 'compact')
    expect(screen.getByRole('button', { name: /Commit/ })).toBeInTheDocument()
    expect(screen.queryByText(/Office of the Chancellor/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Budget Review/)).not.toBeInTheDocument()
    expect(screen.queryByText(/V0\.0\.1/i)).not.toBeInTheDocument()
    expect(screen.getByText('Tax Revenue')).toBeInTheDocument()
  })

  it('Budget at 1440x900 keeps the full letterhead', () => {
    setViewport(1440, 900)
    const { container } = render(<BudgetInterface />)
    expect(container.firstElementChild).not.toHaveAttribute('data-layout')
    expect(screen.getByText(/Office of the Chancellor/)).toBeInTheDocument()
  })

  it('Constitution at 844x390 drops the footer and intro but keeps the counter and action button', () => {
    setViewport(844, 390)
    const { container } = render(<ConstitutionalReform />)
    expect(container.firstElementChild).toHaveAttribute('data-layout', 'compact')
    expect(screen.queryByText(/Referendum: Week 26/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Select one variant per provision/)).not.toBeInTheDocument()
    expect(screen.getByText(/12 Provisions to Address/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Select Provisions First/ })).toBeInTheDocument()
  })

  it('Constitution at 1440x900 keeps the footer', () => {
    setViewport(1440, 900)
    render(<ConstitutionalReform />)
    expect(screen.getByText(/Referendum: Week 26/)).toBeInTheDocument()
  })
})
