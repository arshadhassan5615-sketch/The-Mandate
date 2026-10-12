import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import StatePanel from '../StatePanel'
import { useBillStore } from '../../../stores/billStore'
import { useDecreeStore } from '../../../stores/decreeStore'
import type { Decree } from '../../../types/decree'

const signed: Decree = {
  id: 'price_ceilings', title: 'Price Ceilings Act', category: 'economic', proposedBy: 'Workers Coalition',
  summary: 'Caps prices on essentials.', description: 'long', weekProposed: 5, ministerPositions: [],
  immediateEffects: [{ stat: 'vaelInfluence', value: 5, description: 'Oligarch influence grows' }],
  longTermEffects: [], signed: true,
}

describe('StatePanel', () => {
  beforeEach(() => {
    useBillStore.setState({
      bills: [],
      history: [
        { billId: 'b1', billTitle: 'Land Reform Bill', weekPresented: 3, decision: 'signed', weekDecided: 3 },
        { billId: 'b2', billTitle: 'Press Licensing Bill', weekPresented: 6, decision: 'vetoed', weekDecided: 6 },
      ],
    })
    useDecreeStore.setState({
      signedDecrees: [signed],
      pendingLongTermEffects: [
        { stat: 'x', value: 1, operation: 'add', applyAtWeek: 9, description: 'secret later effect' },
        { stat: 'y', value: 1, operation: 'add', applyAtWeek: 12, description: 'another secret' },
      ],
    })
  })

  it('is a labelled dialog titled State of the Republic', () => {
    render(<StatePanel onClose={() => {}} />)
    expect(screen.getByRole('dialog', { name: 'State of the Republic' })).toBeInTheDocument()
  })

  it('shows decided laws with their outcome and week on the Laws tab', () => {
    render(<StatePanel onClose={() => {}} />)
    expect(screen.getByText('Land Reform Bill')).toBeInTheDocument()
    expect(screen.getByText('Press Licensing Bill')).toBeInTheDocument()
    expect(screen.getByText(/Vetoed/)).toBeInTheDocument()
    expect(screen.getByText(/Week 6/)).toBeInTheDocument()
  })

  it('shows signed decrees on the Decrees tab without revealing effects', () => {
    render(<StatePanel onClose={() => {}} />)
    fireEvent.click(screen.getByRole('tab', { name: /Decrees/ }))
    expect(screen.getByText('Price Ceilings Act')).toBeInTheDocument()
    expect(screen.getByText('Caps prices on essentials.')).toBeInTheDocument()
    expect(screen.queryByText(/Oligarch influence/)).toBeNull()
    expect(screen.queryByText(/secret/)).toBeNull()
  })

  it('counts pending decree consequences without describing them', () => {
    render(<StatePanel onClose={() => {}} />)
    fireEvent.click(screen.getByRole('tab', { name: /Decrees/ }))
    expect(screen.getByText(/2 consequences of your decrees are still to come/)).toBeInTheDocument()
  })

  it('shows tab counts', () => {
    render(<StatePanel onClose={() => {}} />)
    expect(screen.getByRole('tab', { name: /Laws/ })).toHaveTextContent('2')
    expect(screen.getByRole('tab', { name: /Decrees/ })).toHaveTextContent('1')
  })

  it('shows an empty state when nothing has been decided', () => {
    useBillStore.setState({ history: [] })
    render(<StatePanel onClose={() => {}} />)
    expect(screen.getByText(/No legislation has reached your desk yet/)).toBeInTheDocument()
  })

  it('closes from the close button and from Escape', () => {
    const onClose = vi.fn()
    render(<StatePanel onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /Close/ }))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
