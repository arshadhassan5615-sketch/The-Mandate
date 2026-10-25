import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import InlineCodexPanel from '../InlineCodexPanel'
import { useCodexStore } from '../../../stores/codexStore'

const MORIVASK_ID = 'nation_morivask'
const HALVEK_ID = 'history_halvek_regime'

function openEntry(entryId: string) {
  act(() => {
    useCodexStore.getState().openInlineCodex(entryId)
  })
}

function renderPanel() {
  return render(<InlineCodexPanel />)
}

describe('InlineCodexPanel', () => {
  beforeEach(() => {
    localStorage.clear()
    act(() => {
      useCodexStore.setState({ inlineCodexOpen: false, activeEntryId: null })
    })
  })

  it('shows the entry card with its flag and the Briefs Library action when opened', () => {
    act(() => {
      useCodexStore.setState({ inlineCodexOpen: true, activeEntryId: MORIVASK_ID })
    })
    renderPanel()

    expect(screen.getByRole('dialog', { name: 'Codex' })).toBeInTheDocument()
    const card = screen.getByTestId('inline-codex-card')
    expect(card).toHaveTextContent('Morivask')
    expect(screen.getByText(/Flag of the Skala junta/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open in Briefs Library' })).toBeInTheDocument()
  })

  it('steps back and forward through the entries opened in this drawer', () => {
    act(() => {
      useCodexStore.setState({ inlineCodexOpen: true, activeEntryId: MORIVASK_ID })
    })
    renderPanel()

    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Forward' })).toBeDisabled()

    openEntry(HALVEK_ID)
    expect(screen.getByRole('button', { name: 'Back' })).toBeEnabled()
    expect(screen.getByTestId('inline-codex-card')).toHaveTextContent('The Halvek Regime')

    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByTestId('inline-codex-card')).toHaveTextContent('Morivask')
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Forward' })).toBeEnabled()

    fireEvent.click(screen.getByRole('button', { name: 'Forward' }))
    expect(screen.getByTestId('inline-codex-card')).toHaveTextContent('The Halvek Regime')
  })

  it('closes the drawer from the close button', () => {
    act(() => {
      useCodexStore.setState({ inlineCodexOpen: true, activeEntryId: MORIVASK_ID })
    })
    renderPanel()

    fireEvent.click(screen.getByRole('button', { name: 'Close codex' }))
    expect(useCodexStore.getState().inlineCodexOpen).toBe(false)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
