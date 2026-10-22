import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import NationDossier from '../NationDossier'
import { useGameStore } from '../../../stores/gameStore'
import { useCodexStore } from '../../../stores/codexStore'
import { getFlagArt } from '../../../assets/flags'
import nations from '../../../data/nations/foreignNations.json'

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true, writable: true })
  Object.defineProperty(window, 'innerHeight', { value: height, configurable: true, writable: true })
}

describe('NationDossier', () => {
  const originalWidth = window.innerWidth
  const originalHeight = window.innerHeight
  let openCodex: ReturnType<typeof vi.fn>

  beforeEach(() => {
    setViewport(1440, 900)
    openCodex = vi.fn()
    useCodexStore.setState({ openCodex })
    useGameStore.setState({ tyvarenHostility: 80, sovarka_relation: 0 })
  })
  afterEach(() => setViewport(originalWidth, originalHeight))

  it('shows relation and leader for Tyvaren', () => {
    render(<NationDossier nationId="tyvaren" onClose={vi.fn()} />)
    expect(screen.getByText('Hostile')).toBeInTheDocument()
    expect(screen.getByText('Marshal Dragan Vukov')).toBeInTheDocument()
  })

  it('shows the real flag art for Tyvaren', () => {
    render(<NationDossier nationId="tyvaren" onClose={vi.fn()} />)
    expect(screen.getByRole('img', { name: 'Flag of The Tyvaren Confederation' })).toBeInTheDocument()
  })

  it('resolves flag art for every nation in the data', () => {
    for (const nation of nations) {
      expect(getFlagArt(nation.flag), nation.id).not.toBeNull()
    }
  })

  it('opens the codex entry then closes', () => {
    const onClose = vi.fn()
    render(<NationDossier nationId="tyvaren" onClose={onClose} />)
    const btn = screen.getByRole('button', { name: /open codex entry/i })
    expect(btn).toBeEnabled()
    fireEvent.click(btn)
    expect(openCodex).toHaveBeenCalledWith('nations', 'nation_tyvaren_confederation')
    expect(onClose).toHaveBeenCalled()
  })

  it('disables Open Codex for Lytheira', () => {
    render(<NationDossier nationId="lytheira" onClose={vi.fn()} />)
    expect(screen.getByRole('button', { name: /open codex entry/i })).toBeDisabled()
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    render(<NationDossier nationId="morivask" onClose={onClose} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('closes on backdrop click but not card click', () => {
    const onClose = vi.fn()
    render(<NationDossier nationId="sovarka" onClose={onClose} />)
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(screen.getByTestId('nation-dossier-backdrop'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('uses the compact layout at 844x390', () => {
    setViewport(844, 390)
    render(<NationDossier nationId="tyvaren" onClose={vi.fn()} />)
    expect(screen.getByRole('dialog')).toHaveAttribute('data-layout', 'compact')
  })
})
