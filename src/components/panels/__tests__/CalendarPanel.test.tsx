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

  it('marks the current week with aria-current and says "this week" in its label', () => {
    render(<CalendarPanel onClose={() => {}} />)
    const currentCell = screen.getByTestId('week-14')
    expect(currentCell).toHaveAttribute('aria-current', 'date')
    expect(currentCell).toHaveAttribute('aria-label', expect.stringContaining('this week'))
  })

  it('says "past" in the label of a past week and leaves it without aria-current', () => {
    render(<CalendarPanel onClose={() => {}} />)
    const pastCell = screen.getByTestId('week-5')
    expect(pastCell).toHaveAttribute('aria-label', expect.stringContaining('past'))
    expect(pastCell).not.toHaveAttribute('aria-current')
  })

  it('says "upcoming" in the label of a future week', () => {
    render(<CalendarPanel onClose={() => {}} />)
    expect(screen.getByTestId('week-20')).toHaveAttribute('aria-label', expect.stringContaining('upcoming'))
  })

  it('does not announce the detail line as a live region', () => {
    render(<CalendarPanel onClose={() => {}} />)
    expect(screen.getByTestId('calendar-detail')).not.toHaveAttribute('aria-live')
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
