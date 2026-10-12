import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import FiscalNote, { fiscalNoteText } from '../FiscalNote'

// budgetCost is in millions of ₭; negative = spending, which adds to the debt.
describe('fiscalNoteText', () => {
  it('describes spending as added debt', () => {
    expect(fiscalNoteText(-20)).toBe('Adds ₭20M to the national debt')
  })

  it('describes revenue as reduced debt', () => {
    expect(fiscalNoteText(80)).toBe('Reduces the national debt by ₭80M')
  })

  it('says when a bill costs nothing', () => {
    expect(fiscalNoteText(0)).toBe('No cost to the treasury')
  })
})

describe('FiscalNote', () => {
  it('renders a labelled note', () => {
    render(<FiscalNote budgetCost={-5} />)
    expect(screen.getByText('Fiscal note')).toBeInTheDocument()
    expect(screen.getByText('Adds ₭5M to the national debt')).toBeInTheDocument()
  })

  it('marks spending with the warning tone and revenue with the good tone', () => {
    const { rerender } = render(<FiscalNote budgetCost={-5} />)
    expect(screen.getByTestId('fiscal-note')).toHaveAttribute('data-tone', 'cost')
    rerender(<FiscalNote budgetCost={10} />)
    expect(screen.getByTestId('fiscal-note')).toHaveAttribute('data-tone', 'revenue')
    rerender(<FiscalNote budgetCost={0} />)
    expect(screen.getByTestId('fiscal-note')).toHaveAttribute('data-tone', 'neutral')
  })
})
