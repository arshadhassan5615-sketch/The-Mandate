// Journal slips show an ink stamp for bill outcomes: SIGNED for signed bills, VETOED for vetoed bills.
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import JournalView from '../JournalView'
import { useJournalStore } from '../../stores/journalStore'

describe('JournalView outcome stamps', () => {
  beforeEach(() => {
    useJournalStore.setState({ entries: [], seenKeys: new Set<string>() })
    const base = { sceneId: 's', alignment: 'reformist' as const, category: 'legislation' as const, icon: '', currentWeek: 5 }
    useJournalStore.getState().addEntry({ ...base, choiceId: 'c_sign', title: 'Signed the press bill', description: 'd', flag: 'bill_signed' })
    useJournalStore.getState().addEntry({ ...base, choiceId: 'c_veto', title: 'Vetoed the trade bill', description: 'd', flag: 'bill_vetoed' })
    useJournalStore.getState().addEntry({ ...base, choiceId: 'c_plain', title: 'Held a press briefing', description: 'd', flag: null })
  })

  it('stamps signed and vetoed slips and leaves unflagged slips unstamped', () => {
    render(<JournalView onClose={() => {}} />)

    const slips = screen.getAllByTestId('journal-slip')
    expect(slips).toHaveLength(3)

    const stamps = screen.getAllByTestId('journal-stamp')
    expect(stamps).toHaveLength(2)
    expect(stamps.map(s => s.textContent)).toEqual(['SIGNED', 'VETOED'])

    const signedSlip = screen.getByText('Signed the press bill').closest('article') as HTMLElement
    expect(within(signedSlip).getByTestId('journal-stamp')).toHaveTextContent('SIGNED')

    const plainSlip = screen.getByText('Held a press briefing').closest('article') as HTMLElement
    expect(within(plainSlip).queryByTestId('journal-stamp')).toBeNull()
  })
})
