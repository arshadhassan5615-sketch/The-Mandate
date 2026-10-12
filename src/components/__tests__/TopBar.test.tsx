// TopBar: crest, Overview/Settings buttons and the resource chips.
// (The old "Republic of Veltria" label and week chip were removed on purpose.)
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import TopBar from '../TopBar'
import { useGameStore } from '../../stores/gameStore'
import { useNewsStore } from '../../stores/newsStore'

const desktopWidth = window.innerWidth

function resetStore() {
  useGameStore.getState().resetToInitial()
  useNewsStore.setState({ isOpen: false, articles: [], lastReadIndex: -1, readRecords: {} })
}

describe('TopBar', () => {
  beforeEach(resetStore)
  afterEach(() => { window.innerWidth = desktopWidth })

  it('shows the crest and the Overview and Settings buttons', () => {
    render(<TopBar />)
    expect(screen.getByAltText('Seal of the Republic of Veltria')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Overview' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument()
  })

  it('shows treasury, privy purse and approval from the real store', () => {
    const g = useGameStore.getState()
    useGameStore.setState({ personal: { ...g.personal, publicImage: 61.6 } })
    render(<TopBar />)
    expect(screen.getByAltText('Treasury')).toBeInTheDocument()
    expect(screen.getByAltText('Privy Purse')).toBeInTheDocument()
    expect(screen.getByAltText('Approval')).toBeInTheDocument()
    expect(screen.getByText('62%')).toBeInTheDocument()
  })

  it('drops the privy purse on phones', () => {
    window.innerWidth = 390
    render(<TopBar />)
    expect(screen.queryByAltText('Privy Purse')).toBeNull()
    expect(screen.getByAltText('Treasury')).toBeInTheDocument()
  })

  it('returns null while the newspaper is open (does not paint over it)', () => {
    act(() => { useNewsStore.getState().setOpen(true) })
    const { container } = render(<TopBar />)
    expect(container.firstChild).toBeNull()
  })

  it('renders again after the newspaper closes', () => {
    act(() => { useNewsStore.getState().setOpen(true) })
    render(<TopBar />)
    expect(screen.queryByAltText('Treasury')).toBeNull()

    act(() => { useNewsStore.getState().setOpen(false) })
    expect(screen.getByAltText('Treasury')).toBeInTheDocument()
  })
})
