// Command bar: week + stats on the left, labelled government tools on the right
// (Suzerain-style HUD). Phones move the tools to a bar along the bottom.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act, fireEvent, within } from '@testing-library/react'
import TopBar from '../TopBar'
import { useGameStore } from '../../stores/gameStore'
import { useNewsStore } from '../../stores/newsStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useDecreeStore } from '../../stores/decreeStore'
import { ALL_DECREES } from '../../data/decrees'

const desktopWidth = window.innerWidth

function resetStores() {
  useGameStore.getState().resetToInitial()
  useNewsStore.setState({ isOpen: false, articles: [], lastReadIndex: -1, readRecords: {} })
  useSettingsStore.setState({ mapOpen: false, decreeInboxOpen: false, notepadOpen: false })
  useDecreeStore.setState({ pendingDecrees: [] })
}

describe('TopBar (command bar)', () => {
  beforeEach(resetStores)
  afterEach(() => { window.innerWidth = desktopWidth })

  it('shows the week, date and the visible stats', () => {
    const g = useGameStore.getState()
    useGameStore.setState({ currentWeek: 5, personal: { ...g.personal, publicImage: 61.6 } })
    render(<TopBar />)
    expect(screen.getByAltText('Seal of the Republic of Veltria')).toBeInTheDocument()
    expect(screen.getByText('Week 5')).toBeInTheDocument()
    expect(screen.getByText('29 January 1963')).toBeInTheDocument()
    expect(screen.getByTestId('stat-treasury')).toBeInTheDocument()
    expect(screen.getByTestId('stat-privy-purse')).toBeInTheDocument()
    expect(screen.getByTestId('stat-approval')).toHaveTextContent('62%')
  })

  it('lays the government tools out as a labelled row', () => {
    render(<TopBar />)
    const tools = screen.getByRole('navigation', { name: 'Government tools' })
    for (const label of ['Map', 'News', 'Briefs', 'Decrees', 'State', 'Journal', 'Letters', 'Notes', 'More', 'Settings']) {
      expect(within(tools).getByRole('button', { name: new RegExp(`^${label}`) })).toBeInTheDocument()
    }
  })

  it('toggles the map and the decree inbox from the bar', () => {
    render(<TopBar />)
    fireEvent.click(screen.getByRole('button', { name: /^Map/ }))
    expect(useSettingsStore.getState().mapOpen).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: /^Decrees/ }))
    expect(useSettingsStore.getState().decreeInboxOpen).toBe(true)
  })

  it('counts decrees awaiting signature on the Decrees tool', () => {
    useDecreeStore.setState({ pendingDecrees: ALL_DECREES.slice(0, 3) })
    render(<TopBar />)
    expect(screen.getByRole('button', { name: 'Decrees, 3 new' })).toBeInTheDocument()
  })

  it('opens State of the Republic and keeps the rest under More', () => {
    const onSave = vi.fn()
    render(<TopBar onSave={onSave} />)
    fireEvent.click(screen.getByRole('button', { name: /^State/ }))
    expect(screen.getByRole('dialog', { name: 'State of the Republic' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^More/ }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'National Statistics' }))
    expect(screen.getByTestId('stats-panel')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^More/ }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Save game' }))
    expect(onSave).toHaveBeenCalled()
  })

  it('moves the tools to a bottom bar on phones and drops the privy purse', () => {
    window.innerWidth = 390
    render(<TopBar />)
    expect(screen.queryByTestId('stat-privy-purse')).toBeNull()
    const tools = screen.getByRole('navigation', { name: 'Government tools' })
    expect(tools.style.bottom).toBe('0px')
  })

  it('hides while the newspaper is open and comes back after', () => {
    act(() => { useNewsStore.getState().setOpen(true) })
    render(<TopBar />)
    expect(screen.queryByTestId('command-bar')).toBeNull()
    act(() => { useNewsStore.getState().setOpen(false) })
    expect(screen.getByTestId('command-bar')).toBeInTheDocument()
  })
})
