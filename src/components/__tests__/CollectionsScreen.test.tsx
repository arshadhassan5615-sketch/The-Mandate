import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CollectionsScreen from '../CollectionsScreen'
import { LS_ENDINGS } from '../../engine/collections'
import { ALL_CODEX_ENTRIES } from '../../stores/codexStore'
import epilogues from '../../data/epilogues.json'

describe('CollectionsScreen', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem(LS_ENDINGS, JSON.stringify([epilogues[0].id]))
  })

  it('shows reached and sealed endings', () => {
    render(<CollectionsScreen onClose={vi.fn()} />)
    expect(screen.getByText(`1 of ${epilogues.length} endings reached`)).toBeInTheDocument()
    expect(screen.getByText(epilogues[0].title)).toBeInTheDocument()
    expect(screen.getAllByLabelText('Sealed ending').length).toBeGreaterThan(0)
  })

  it('switches to the Briefs tab', async () => {
    const user = userEvent.setup()
    render(<CollectionsScreen onClose={vi.fn()} />)
    await user.click(screen.getByRole('tab', { name: 'Briefs' }))
    expect(screen.getByText(new RegExp(`of ${ALL_CODEX_ENTRIES.length} briefs read`))).toBeInTheDocument()
  })

  it('calls onClose from Back', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<CollectionsScreen onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose on Escape', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<CollectionsScreen onClose={onClose} />)
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })
})
