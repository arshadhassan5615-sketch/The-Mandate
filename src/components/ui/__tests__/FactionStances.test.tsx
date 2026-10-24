import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import FactionStances from '../FactionStances'
import type { Bill } from '../../../types/bills'

type StanceSource = Pick<Bill, 'signEffects'>

const SAMPLE: StanceSource = {
  signEffects: [
    { stat: 'factions.reformists', operation: 'add', value: 15 },
    { stat: 'factions.halvekists', operation: 'add', value: -10 },
    { stat: 'factions.church', operation: 'add', value: 4 },
  ],
}

const SUPPORTERS_ONLY: StanceSource = {
  signEffects: [
    { stat: 'factions.reformists', operation: 'add', value: 12 },
  ],
}

const NO_FACTION_EFFECTS: StanceSource = {
  signEffects: [
    { stat: 'nation.nationalDebt', operation: 'add', value: 5 },
  ],
}

describe('FactionStances', () => {
  it('renders supporters and opponents in the right lists', () => {
    render(<FactionStances bill={SAMPLE} />)

    const favour = screen.getByRole('list', { name: 'In favour' })
    const opposed = screen.getByRole('list', { name: 'Opposed' })

    expect(within(favour).getByText('Civic Renewal')).toBeInTheDocument()
    expect(within(favour).getByText('Church of the Eternal Flame')).toBeInTheDocument()
    expect(within(favour).queryByText('Halvekists')).toBeNull()
    expect(within(opposed).getByText('Halvekists')).toBeInTheDocument()
    expect(within(opposed).queryByText('Civic Renewal')).toBeNull()
  })

  it('marks leaning factions with (leaning) and leaves firm ones unmarked', () => {
    render(<FactionStances bill={SAMPLE} />)

    const favour = screen.getByRole('list', { name: 'In favour' })
    const opposed = screen.getByRole('list', { name: 'Opposed' })

    expect(within(favour).getAllByText('(leaning)')).toHaveLength(1)
    expect(within(favour).getByText('Church of the Eternal Flame').closest('li')).toHaveTextContent('(leaning)')
    expect(within(favour).getByText('Civic Renewal').closest('li')).not.toHaveTextContent('(leaning)')
    expect(within(opposed).queryByText('(leaning)')).toBeNull()
  })

  it('shows an em dash in a column with no factions', () => {
    render(<FactionStances bill={SUPPORTERS_ONLY} />)

    const opposed = screen.getByRole('list', { name: 'Opposed' })

    expect(within(opposed).getByText('—')).toBeInTheDocument()
    expect(within(opposed).queryByRole('listitem')).toHaveTextContent('—')
  })

  it('insets the box horizontally by the inset prop', () => {
    render(<FactionStances bill={SAMPLE} inset="44px" />)

    expect(screen.getByTestId('faction-stances')).toHaveStyle({ marginLeft: '44px', marginRight: '44px' })
  })

  it('renders nothing for a bill with no faction effects', () => {
    render(<FactionStances bill={NO_FACTION_EFFECTS} />)

    expect(screen.queryByTestId('faction-stances')).toBeNull()
  })
})
