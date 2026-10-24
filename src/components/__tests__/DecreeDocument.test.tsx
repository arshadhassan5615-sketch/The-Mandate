// Decree page as a state document: seal, fiscal note and the reason a decree
// cannot be signed are all visible before the player signs.
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import DecreeInbox from '../DecreeInbox'
import { useDecreeStore } from '../../stores/decreeStore'
import { useGameStore } from '../../stores/gameStore'
import { ALL_DECREES } from '../../data/decrees'
import type { Decree } from '../../types/decree'

function decree(id: string): Decree {
  const found = ALL_DECREES.find(d => d.id === id)
  if (!found) throw new Error(`missing decree ${id}`)
  return found
}

function seed(pending: Decree, signed: Decree[] = []) {
  useDecreeStore.setState({
    pendingDecrees: [pending],
    signedDecrees: signed.map(d => ({ ...d, signed: true })),
    rejectedDecrees: [],
    tabledDecrees: [],
    selectedDecree: pending,
    pendingLongTermEffects: [],
  })
}

describe('decree document', () => {
  beforeEach(() => {
    useGameStore.getState().resetToInitial()
  })

  it('shows the seal and title of the selected decree', () => {
    const price = decree('decree_price_controls')
    seed(price)
    render(<DecreeInbox onClose={() => {}} />)
    expect(screen.getByTestId('national-seal')).toBeInTheDocument()
    expect(screen.getByTestId('decree-detail-title')).toHaveTextContent(price.title)
  })

  it('states the cost to the national debt before signing', () => {
    // Nationalization is authored as a ₭20M expenditure.
    seed(decree('decree_nationalization'))
    render(<DecreeInbox onClose={() => {}} />)
    expect(screen.getByTestId('fiscal-note')).toHaveTextContent('Adds ₭20M to the national debt')
  })

  it('states revenue as reducing the debt', () => {
    const austerity = ALL_DECREES.find(d =>
      d.immediateEffects.some(e => e.description === 'Deficit reduction begins'))!
    seed(austerity)
    render(<DecreeInbox onClose={() => {}} />)
    expect(screen.getByTestId('fiscal-note')).toHaveAttribute('data-tone', 'revenue')
  })

  it('names the conflicting decree and blocks signing', () => {
    const withConflict = ALL_DECREES.find(d => d.conflictsWith?.length)!
    const rival = decree(withConflict.conflictsWith![withConflict.conflictsWith!.length - 1])
    seed(withConflict, [rival])
    render(<DecreeInbox onClose={() => {}} />)
    expect(screen.getByTestId('decree-conflict')).toHaveTextContent(rival.title)
    expect(screen.getByRole('button', { name: /blocked by a conflicting decree/i })).toBeDisabled()
  })

  it('lets a decree with no conflict in force be signed', () => {
    seed(decree('decree_price_controls'))
    render(<DecreeInbox onClose={() => {}} />)
    expect(screen.queryByTestId('decree-conflict')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign decree' })).toBeEnabled()
  })
})
