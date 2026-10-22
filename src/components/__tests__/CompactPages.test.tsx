// Landscape-phone (compact) layout: the stamp band goes away and the pages
// keep their primary footer button.
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import AgendaSelector from '../AgendaSelector'
import MorningBriefing from '../MorningBriefing'

const STAMP = 'The Mandate — Republic of Veltria, 1963'
const original = { w: window.innerWidth, h: window.innerHeight }

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width })
  Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: height })
}

describe('compact layout for Agenda and Morning Briefing', () => {
  afterEach(() => setViewport(original.w, original.h))

  it('agenda page drops the stamp band at 844x390', () => {
    setViewport(844, 390)
    render(<AgendaSelector />)
    expect(screen.getByTestId('agenda-page')).toHaveAttribute('data-layout', 'compact')
    expect(screen.queryByText(STAMP)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Confirm Agenda/ })).toBeInTheDocument()
  })

  it('briefing page drops the stamp band at 844x390', () => {
    setViewport(844, 390)
    render(<MorningBriefing />)
    expect(screen.getByTestId('briefing-page')).toHaveAttribute('data-layout', 'compact')
    expect(screen.queryByText(STAMP)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Continue to Press Summary/ })).toBeInTheDocument()
  })

  it('both pages keep the stamp band on desktop', () => {
    setViewport(1440, 900)
    const { unmount } = render(<AgendaSelector />)
    expect(screen.getByTestId('agenda-page')).not.toHaveAttribute('data-layout')
    expect(screen.getByText(STAMP)).toBeInTheDocument()
    unmount()
    render(<MorningBriefing />)
    expect(screen.getByTestId('briefing-page')).not.toHaveAttribute('data-layout')
    expect(screen.getByText(STAMP)).toBeInTheDocument()
  })
})
