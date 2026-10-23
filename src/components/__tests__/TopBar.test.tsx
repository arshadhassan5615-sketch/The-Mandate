// Command bar: the Suzerain-style HUD on desktop and landscape (crest, stat tab,
// medallion capsule) and the bottom tool bar on portrait phones.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act, fireEvent, within } from '@testing-library/react'
import TopBar from '../TopBar'
import { useGameStore } from '../../stores/gameStore'
import { useNewsStore } from '../../stores/newsStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useDecreeStore } from '../../stores/decreeStore'
import { useWeekStore } from '../../stores/weekStore'
import { ALL_DECREES } from '../../data/decrees'
import type { NewsArticle } from '../../types/news'

const desktopWidth = window.innerWidth

function resetStores() {
  useGameStore.getState().resetToInitial()
  useNewsStore.setState({ isOpen: false, articles: [], lastReadIndex: -1, readRecords: {} })
  useSettingsStore.setState({ mapOpen: false, decreeInboxOpen: false, notepadOpen: false })
  useDecreeStore.setState({ pendingDecrees: [] })
  useWeekStore.setState({ phase: 'map' })
}

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true, writable: true })
  Object.defineProperty(window, 'innerHeight', { value: height, configurable: true, writable: true })
}

/** Button labels in DOM order, without any "N new" badge suffix. */
function railLabels(rail: HTMLElement): string[] {
  return within(rail).getAllByRole('button').map(b => (b.getAttribute('aria-label') ?? '').split(',')[0])
}

function newsArticle(id: string): NewsArticle {
  return {
    id,
    headline: 'Headline',
    body: 'Body',
    publication: 'veltrian_times',
    weekNumber: 1,
    date: '1963-01-01',
    templateId: 'template',
    category: 'governance',
  }
}

describe('TopBar (command bar)', () => {
  beforeEach(resetStores)
  afterEach(() => { window.innerWidth = desktopWidth })

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

describe('desktop HUD (1440x900)', () => {
  beforeEach(() => { resetStores(); setViewport(1440, 900) })
  afterEach(() => { setViewport(1024, 768) })

  it('shows the flag and the visible stats in the stat tab', () => {
    const g = useGameStore.getState()
    useGameStore.setState({ currentWeek: 5, personal: { ...g.personal, publicImage: 61.6 } })
    render(<TopBar />)
    expect(screen.getByTestId('hud-crest')).toBeInTheDocument()
    expect(screen.getByTestId('command-bar')).toHaveAttribute('data-layout', 'desktop')
    expect(screen.queryByText(/^WK \d/)).toBeNull()
    expect(screen.getByTestId('stat-treasury')).toHaveTextContent('₭')
    expect(screen.getByTestId('stat-privy-purse')).toBeInTheDocument()
    expect(screen.getByTestId('stat-approval')).toHaveTextContent('62%')
  })

  it('shows the national medal inside the crest button', () => {
    render(<TopBar />)
    expect(within(screen.getByTestId('hud-crest')).getByTestId('national-medal')).toBeInTheDocument()
  })

  it('has no Map button on the HUD itself', () => {
    render(<TopBar />)
    expect(screen.queryByRole('button', { name: 'Map' })).toBeNull()
  })

  it('lists Map first in More and toggles the map from it', () => {
    render(<TopBar />)
    fireEvent.click(screen.getByRole('button', { name: /^More/ }))
    expect(screen.getAllByRole('menuitem')[0]).toHaveTextContent('Map')
    fireEvent.click(screen.getByRole('menuitem', { name: 'Map' }))
    expect(useSettingsStore.getState().mapOpen).toBe(true)
  })

  it('lists the government tools on the medallion capsule in order', () => {
    render(<TopBar />)
    const rail = screen.getByTestId('tool-rail')
    expect(railLabels(rail)).toEqual(['News', 'Briefs', 'Decrees', 'State', 'Letters', 'Journal', 'Notes', 'More', 'Settings'])
  })

  it('shows the unread count on the News medallion', () => {
    useNewsStore.setState({ articles: [newsArticle('a'), newsArticle('b'), newsArticle('c')], lastReadIndex: -1 })
    render(<TopBar />)
    expect(within(screen.getByTestId('tool-rail')).getByRole('button', { name: 'News' })).toHaveTextContent('3')
  })

  it('counts decrees awaiting signature on the Decrees medallion', () => {
    useDecreeStore.setState({ pendingDecrees: ALL_DECREES.slice(0, 3) })
    render(<TopBar />)
    expect(screen.getByRole('button', { name: 'Decrees, 3 new' })).toBeInTheDocument()
  })

  it('toggles the decree inbox from the rail', () => {
    render(<TopBar />)
    fireEvent.click(screen.getByRole('button', { name: /^Decrees/ }))
    expect(useSettingsStore.getState().decreeInboxOpen).toBe(true)
  })

  it('opens the nation overview from the crest', () => {
    render(<TopBar />)
    fireEvent.click(screen.getByRole('button', { name: 'Nation overview' }))
    expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument()
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

  it('keeps the stat tab during a scene at desktop size', () => {
    useWeekStore.setState({ phase: 'scene' })
    render(<TopBar />)
    expect(screen.getByTestId('command-bar')).toBeInTheDocument()
    expect(screen.getByTestId('tool-rail')).toBeInTheDocument()
  })

  it('narrows the stat tab beside the conversation column during a scene', () => {
    useWeekStore.setState({ phase: 'scene' })
    render(<TopBar />)
    expect(screen.getByTestId('command-bar')).toHaveAttribute('data-beside-column', 'true')
    expect(screen.queryByTestId('stat-privy-purse')).toBeNull()
    expect(screen.getByTestId('stat-treasury')).toBeInTheDocument()
    expect(screen.getByTestId('stat-approval')).toBeInTheDocument()
  })

  it('keeps the full stat tab outside scenes at desktop size', () => {
    useWeekStore.setState({ phase: 'map' })
    render(<TopBar />)
    expect(screen.getByTestId('command-bar')).not.toHaveAttribute('data-beside-column')
    expect(screen.getByTestId('stat-privy-purse')).toBeInTheDocument()
  })
})

describe('compact landscape layout (844x390)', () => {
  beforeEach(() => { resetStores(); setViewport(844, 390) })
  afterEach(() => { setViewport(1024, 768) })

  it('renders a compact stat tab and a compact medallion capsule', () => {
    render(<TopBar />)
    expect(screen.getByTestId('command-bar')).toHaveAttribute('data-layout', 'compact')
    expect(screen.getByTestId('tool-rail')).toHaveAttribute('data-layout', 'compact')
  })

  it('keeps Journal and Notes off the rail and puts them in More', () => {
    render(<TopBar />)
    const rail = screen.getByTestId('tool-rail')
    expect(railLabels(rail)).toEqual(['News', 'Briefs', 'Decrees', 'State', 'Letters', 'More', 'Settings'])

    fireEvent.click(within(rail).getByRole('button', { name: /^More/ }))
    expect(screen.getByRole('menuitem', { name: 'Journal' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Notes' })).toBeInTheDocument()
  })

  it('hides the privy purse but keeps treasury and approval', () => {
    render(<TopBar />)
    expect(screen.queryByTestId('stat-privy-purse')).toBeNull()
    expect(screen.getByTestId('stat-treasury')).toBeInTheDocument()
    expect(screen.getByTestId('stat-approval')).toBeInTheDocument()
  })

  it('drops the stat tab but keeps the rail during a scene', () => {
    useWeekStore.setState({ phase: 'scene' })
    render(<TopBar />)
    expect(screen.queryByTestId('command-bar')).toBeNull()
    expect(screen.getByTestId('tool-rail')).toBeInTheDocument()
  })

  it('shows both the stat tab and the rail on the map', () => {
    useWeekStore.setState({ phase: 'map' })
    render(<TopBar />)
    expect(screen.getByTestId('command-bar')).toBeInTheDocument()
    expect(screen.getByTestId('tool-rail')).toBeInTheDocument()
  })
})
