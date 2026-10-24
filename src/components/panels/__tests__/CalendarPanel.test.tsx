import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CalendarPanel from '../CalendarPanel'
import { useBillStore } from '../../../stores/billStore'
import { useGameStore } from '../../../stores/gameStore'
import type { BillHistoryEntry } from '../../../types/bills'
import { weekToDate } from '../../hud/hudSizes'

const landAct: BillHistoryEntry = {
  billId: 'bill_land',
  billTitle: 'Land Reform Act',
  weekPresented: 2,
  decision: 'signed',
  weekDecided: 5,
}

const futureAct: BillHistoryEntry = {
  billId: 'bill_future',
  billTitle: 'Future Bill',
  weekPresented: 15,
  decision: 'signed',
  weekDecided: 20,
}

describe('CalendarPanel', () => {
  beforeEach(() => {
    useGameStore.setState({ currentWeek: 14 })
    useBillStore.setState({ bills: [], history: [landAct, futureAct] })
  })

  it('is a labelled dialog titled The Year 1963', () => {
    render(<CalendarPanel onClose={() => {}} />)
    expect(screen.getByRole('dialog', { name: 'The Year 1963' })).toBeInTheDocument()
  })

  it('renders a button for each of the 52 weeks', () => {
    render(<CalendarPanel onClose={() => {}} />)
    expect(screen.getAllByTestId(/^week-\d+$/)).toHaveLength(52)
  })

  it('marks the current week with data-state current', () => {
    render(<CalendarPanel onClose={() => {}} />)
    expect(screen.getByTestId('week-14')).toHaveAttribute('data-state', 'current')
    expect(screen.getByTestId('week-5')).toHaveAttribute('data-state', 'past')
    expect(screen.getByTestId('week-20')).toHaveAttribute('data-state', 'future')
  })

  it('shows the signed bill in the detail line when a past week is hovered', () => {
    render(<CalendarPanel onClose={() => {}} />)
    fireEvent.mouseEnter(screen.getByTestId('week-5'))
    expect(screen.getByTestId('calendar-detail')).toHaveTextContent('Signed: Land Reform Act')
  })

  it('does not name a future bill when a future week is hovered', () => {
    render(<CalendarPanel onClose={() => {}} />)
    fireEvent.mouseEnter(screen.getByTestId('week-20'))
    expect(screen.getByTestId('calendar-detail')).toHaveTextContent('Nothing recorded.')
    expect(screen.getByTestId('calendar-detail')).not.toHaveTextContent('Future Bill')
  })

  it('shows the current week in the detail line by default', () => {
    render(<CalendarPanel onClose={() => {}} />)
    expect(screen.getByTestId('calendar-detail')).toHaveTextContent(`Week 14 · ${weekToDate(14)}`)
  })

  it('closes from the close button and from Escape', () => {
    const onClose = vi.fn()
    render(<CalendarPanel onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Close Calendar' }))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
