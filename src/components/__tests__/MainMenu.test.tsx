import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const { listSavesMock } = vi.hoisted(() => ({ listSavesMock: vi.fn() }))

vi.mock('../../engine/SaveManager', () => ({
  listSaves: listSavesMock,
  loadGame: vi.fn(),
  saveGame: vi.fn(),
  deleteSave: vi.fn(),
}))

vi.mock('../../engine/AudioManager', () => ({
  audioManager: { playTrack: vi.fn(), pause: vi.fn() },
}))

import MainMenu from '../MainMenu'
import { useSettingsStore } from '../../stores/settingsStore'

describe('MainMenu', () => {
  beforeEach(() => {
    listSavesMock.mockReset()
    listSavesMock.mockResolvedValue([])
  })

  afterEach(() => {
    useSettingsStore.getState().setSettingsOpen(false)
  })

  it('renders the title and the main menu buttons', async () => {
    render(<MainMenu />)
    expect(screen.getByRole('heading', { name: /the mandate/i })).toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: 'Main menu' })
    for (const name of ['New Game', 'Continue', 'Load', 'Options']) {
      expect(within(nav).getByRole('button', { name })).toBeInTheDocument()
    }
    await waitFor(() => expect(listSavesMock).toHaveBeenCalled())
  })

  it('disables Continue and Load when there are no saves', async () => {
    render(<MainMenu />)
    await waitFor(() => expect(listSavesMock).toHaveBeenCalled())
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Load' })).toBeDisabled()
  })

  it('enables Continue and Load once a save exists', async () => {
    listSavesMock.mockResolvedValue([{ timestamp: 1 }])
    render(<MainMenu />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled())
    expect(screen.getByRole('button', { name: 'Load' })).toBeEnabled()
  })

  it('opens settings when Options is clicked', async () => {
    const user = userEvent.setup()
    render(<MainMenu />)
    await user.click(screen.getByRole('button', { name: 'Options' }))
    expect(useSettingsStore.getState().settingsOpen).toBe(true)
  })

  it('shows the save slot screen when New Game is clicked', async () => {
    const user = userEvent.setup()
    render(<MainMenu />)
    await user.click(screen.getByRole('button', { name: 'New Game' }))
    expect(await screen.findByRole('heading', { name: 'SAVE GAME' })).toBeInTheDocument()
  })

  it('has Collections and Credits buttons', () => {
    render(<MainMenu />)
    const nav = screen.getByRole('navigation', { name: 'Main menu' })
    expect(within(nav).getByRole('button', { name: 'Collections' })).toBeInTheDocument()
    expect(within(nav).getByRole('button', { name: 'Credits' })).toBeInTheDocument()
  })

  it('opens the credits dialog', async () => {
    const user = userEvent.setup()
    render(<MainMenu />)
    await user.click(screen.getByRole('button', { name: 'Credits' }))
    const dialog = await screen.findByRole('dialog', { name: 'Credits' })
    expect(within(dialog).getByText('Suzerain, by Torpor Games')).toBeInTheDocument()
  })

  it('opens the collections screen', async () => {
    const user = userEvent.setup()
    render(<MainMenu />)
    await user.click(screen.getByRole('button', { name: 'Collections' }))
    expect(await screen.findByRole('heading', { name: 'Collections' })).toBeInTheDocument()
  })

  it('scales menu items on hover, focus, and press without scaling disabled items', () => {
    const { container } = render(<MainMenu />)
    const css = container.querySelector('style')?.textContent ?? ''
    expect(css).toContain('scale(1.08)')
    expect(css).toContain('@media (hover: hover) and (pointer: fine)')
    expect(css).toContain('scale(0.97)')
    expect(css).toContain('transform: none')
  })

  it('shows the illustrated title scene behind the menu', () => {
    render(<MainMenu />)
    const scene = screen.getByTestId('title-scene')
    expect(scene.querySelector('img')).not.toBeNull()
  })

  it('draws the menu without a panel background', () => {
    render(<MainMenu />)
    expect(screen.getByTestId('title-menu').style.background).toBe('')
  })

  it('includes the brush-stroke, lamp flicker, and rain animation styles', () => {
    const { container } = render(<MainMenu />)
    const css = container.querySelector('style')?.textContent ?? ''
    expect(css).toContain('::before')
    expect(css).toContain('title-lamp-flicker')
    expect(css).not.toContain('title-rain')
    expect(screen.getByTestId('window-snow')).toBeInTheDocument()
  })

  it('keeps all six menu buttons inside the main menu', () => {
    render(<MainMenu />)
    const nav = screen.getByRole('navigation', { name: 'Main menu' })
    for (const name of ['New Game', 'Continue', 'Load', 'Options', 'Collections', 'Credits']) {
      expect(within(nav).getByRole('button', { name })).toBeInTheDocument()
    }
  })
})
