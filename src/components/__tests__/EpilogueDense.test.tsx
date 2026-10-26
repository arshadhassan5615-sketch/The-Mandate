import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import type { ViewportMode } from '../../hooks/useViewportMode'
import EpilogueScreen from '../EpilogueScreen'

const viewport = vi.hoisted(() => ({ mode: 'compact' as ViewportMode }))

vi.mock('../../hooks/usePageInsets', () => ({
  usePageInsets: () => ({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    isPhone: viewport.mode === 'phone',
    isCompact: viewport.mode === 'compact',
    mode: viewport.mode,
  }),
}))

const MAX_ADVANCES = 20

/** Taps the cinematic plate so it fades out and hands control back to the page. */
async function dismissPlate() {
  const plate = screen.getByTestId('cinematic-plate')
  fireEvent.click(plate)
  await waitFor(() => expect(screen.queryByTestId('cinematic-plate')).not.toBeInTheDocument(), {
    timeout: 3000,
  })
}

describe('EpilogueScreen on compact and phone viewports', () => {
  beforeEach(() => {
    viewport.mode = 'compact'
  })

  it('pins the primary advance button in a footer in compact mode', async () => {
    render(<EpilogueScreen />)
    await dismissPlate()

    const footer = screen.getByTestId('epilogue-footer')
    const button = within(footer).getByRole('button', { name: 'Read the Epilogue' })
    expect(button).toBeInTheDocument()
  })

  it('advances the epilogue when the footer button is tapped', async () => {
    render(<EpilogueScreen />)
    await dismissPlate()

    const footer = screen.getByTestId('epilogue-footer')
    fireEvent.click(within(footer).getByRole('button', { name: 'Read the Epilogue' }))

    expect(within(screen.getByTestId('epilogue-footer')).getByRole('button')).toHaveTextContent(
      'Continue Reading',
    )
  })

  it('reveals the declassified report after reading every vignette from the footer', async () => {
    render(<EpilogueScreen />)
    await dismissPlate()

    let advances = 0
    while (screen.queryByTestId('epilogue-footer')) {
      expect(advances).toBeLessThan(MAX_ADVANCES)
      const footer = screen.getByTestId('epilogue-footer')
      fireEvent.click(within(footer).getByRole('button'))
      advances += 1
    }

    expect(advances).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /View Declassified Assessment Report/ })).toBeInTheDocument()
  })
})

describe('EpilogueScreen on desktop', () => {
  beforeEach(() => {
    viewport.mode = 'desktop'
  })

  it('keeps the advance button inline with the text and renders no footer', async () => {
    render(<EpilogueScreen />)
    await dismissPlate()

    expect(screen.queryByTestId('epilogue-footer')).not.toBeInTheDocument()
    const button = screen.getByRole('button', { name: 'Read the Epilogue' })
    fireEvent.click(button)
    expect(screen.getByRole('button', { name: 'Continue Reading' })).toBeInTheDocument()
  })
})
