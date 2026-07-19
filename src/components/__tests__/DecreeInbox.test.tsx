// DecreeInbox detail panel: parchment paper + official-document typography.
// Drives the real component with real decreeStore fixtures (no style reimplementation).
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import DecreeInbox from '../DecreeInbox'
import { useDecreeStore } from '../../stores/decreeStore'
import { useGameStore } from '../../stores/gameStore'
import { ALL_DECREES } from '../../data/decrees'
import type { Decree } from '../../types/decree'

function seedPendingDecree(decree: Decree) {
  useDecreeStore.setState({
    pendingDecrees: [decree],
    signedDecrees: [],
    rejectedDecrees: [],
    tabledDecrees: [],
    selectedDecree: decree,
    pendingLongTermEffects: [],
  })
}

function resetStores() {
  useGameStore.getState().resetToInitial()
  useDecreeStore.setState({
    pendingDecrees: [],
    signedDecrees: [],
    rejectedDecrees: [],
    tabledDecrees: [],
    selectedDecree: null,
    pendingLongTermEffects: [],
  })
}

/** Normalize css color for assertions (jsdom may keep hex or expand to rgb). */
function colorKey(value: string): string {
  const v = value.replace(/\s/g, '').toLowerCase()
  if (v === '#f5f0e0' || v === 'rgb(245,240,224)') return 'parchment'
  if (v === '#0d0a06' || v === 'rgb(13,10,6)') return 'ink'
  if (v === '#0e0b07' || v === 'rgb(14,11,7)') return 'shell'
  if (v === '#c9a84c' || v === 'rgb(201,168,76)') return 'gold'
  if (v === '#a04040' || v === 'rgb(160,64,64)') return 'reject'
  return v
}

describe('DecreeInbox parchment detail', () => {
  beforeEach(resetStores)

  it('renders real decree title/summary on detail surface with parchment + Playfair + Crimson', () => {
    const decree = ALL_DECREES.find(d => d.id === 'decree_price_controls')
    expect(decree).toBeTruthy()
    seedPendingDecree(decree!)

    render(<DecreeInbox onClose={() => {}} />)

    // Real catalog content — title appears in list + detail; assert via detail test id
    const titleEl = screen.getByTestId('decree-detail-title')
    expect(titleEl.textContent).toBe(decree!.title)
    expect(screen.getByText(decree!.summary)).toBeInTheDocument()
    expect(screen.getByText(/Minister Positions/i)).toBeInTheDocument()
    expect(screen.getByText('Sign Decree')).toBeInTheDocument()
    expect(screen.getByText('Table for Later')).toBeInTheDocument()
    expect(screen.getByText('Reject')).toBeInTheDocument()

    // Shipped detail surface uses parchment fill (LegislationOverlay reference #f5f0e0)
    const detail = screen.getByTestId('decree-detail')
    expect(colorKey(detail.style.background)).toBe('parchment')

    expect(titleEl.style.fontFamily).toMatch(/Playfair Display/i)
    // Dark ink on paper (not cream-on-dark)
    expect(colorKey(titleEl.style.color)).toBe('ink')

    // Body prose uses Crimson Text (summary is italic body on detail)
    const summary = screen.getByText(decree!.summary)
    expect(summary.style.fontFamily).toMatch(/Crimson Text/i)

    // Outer shell stays dark brass chrome
    const shell = screen.getByTestId('decree-inbox-shell')
    expect(colorKey(shell.style.background)).toBe('shell')
    // Layered material-depth shadow present on outer frame
    expect(shell.style.boxShadow).toMatch(/inset/i)
    expect(shell.style.boxShadow).toMatch(/24px|64px|0\.75/i)
  })

  it('keeps sign/table/reject color meaning (gold / neutral / red)', () => {
    const decree = ALL_DECREES[0]
    seedPendingDecree(decree)
    render(<DecreeInbox onClose={() => {}} />)

    const sign = screen.getByText('Sign Decree')
    const table = screen.getByText('Table for Later')
    const reject = screen.getByText('Reject')

    expect(colorKey(sign.style.background)).toBe('gold')
    expect(table.style.border).toMatch(/107|79|42|6b4f2a|rgb/i)
    expect(colorKey(reject.style.color)).toBe('reject')
  })

  it('shows empty state when no decrees are pending', () => {
    render(<DecreeInbox onClose={() => {}} />)
    expect(screen.getByText(/No decrees available this week/i)).toBeInTheDocument()
    expect(screen.getByText(/Select a decree to review/i)).toBeInTheDocument()
  })
})
