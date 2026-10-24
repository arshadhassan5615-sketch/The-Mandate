import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import SettingsPanel from '../SettingsPanel'
import { useSettingsStore } from '../../stores/settingsStore'

const LS_MEMORY_HINTS = 'mandate-memory-hints'

describe('SettingsPanel Memory Hints', () => {
  beforeEach(() => {
    localStorage.removeItem(LS_MEMORY_HINTS)
    useSettingsStore.setState({ memoryHints: true, settingsOpen: true })
  })

  afterEach(() => {
    localStorage.removeItem(LS_MEMORY_HINTS)
    useSettingsStore.setState({ memoryHints: true, settingsOpen: false })
  })

  it('is on by default', async () => {
    vi.resetModules()
    localStorage.removeItem(LS_MEMORY_HINTS)
    const fresh = await import('../../stores/settingsStore')
    expect(fresh.useSettingsStore.getState().memoryHints).toBe(true)
  })

  it('starts off when the saved value is false', async () => {
    vi.resetModules()
    // The persisted settings blob rehydrates over the initial value, so clear it too.
    localStorage.removeItem('mandate-settings')
    localStorage.setItem(LS_MEMORY_HINTS, 'false')
    const fresh = await import('../../stores/settingsStore')
    expect(fresh.useSettingsStore.getState().memoryHints).toBe(false)
  })

  it('clicking the Memory Hints toggle turns the setting off and saves it', () => {
    render(<SettingsPanel />)
    fireEvent.click(screen.getByRole('tab', { name: 'Game' }))

    fireEvent.click(screen.getByText('Memory Hints'))

    expect(useSettingsStore.getState().memoryHints).toBe(false)
    expect(localStorage.getItem(LS_MEMORY_HINTS)).toBe('false')

    fireEvent.click(screen.getByText('Memory Hints'))
    expect(useSettingsStore.getState().memoryHints).toBe(true)
  })
})
