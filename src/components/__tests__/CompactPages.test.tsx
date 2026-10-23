// Landscape-phone (compact) layout: the stamp band goes away and the pages
// keep their primary footer button.
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import AgendaSelector from '../AgendaSelector'

const STAMP = 'The Mandate — Republic of Veltria, 1963'
const original = { w: window.innerWidth, h: window.innerHeight }

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width })
  Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: height })
}

describe('compact layout for Agenda', () => {
  afterEach(() => setViewport(original.w, original.h))

  it('agenda page drops the stamp band at 844x390', () => {
    setViewport(844, 390)
    render(<AgendaSelector />)
    expect(screen.getByTestId('agenda-page')).toHaveAttribute('data-layout', 'compact')
    expect(screen.queryByText(STAMP)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Confirm Agenda/ })).toBeInTheDocument()
  })

  it('agenda page keeps the stamp band on desktop', () => {
    setViewport(1440, 900)
    render(<AgendaSelector />)
    expect(screen.getByTestId('agenda-page')).not.toHaveAttribute('data-layout')
    expect(screen.getByText(STAMP)).toBeInTheDocument()
  })
})
