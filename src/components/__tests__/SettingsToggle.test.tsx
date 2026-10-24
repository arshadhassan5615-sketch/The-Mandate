import { afterEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import SettingsPanel from '../SettingsPanel'
import { useSettingsStore } from '../../stores/settingsStore'

function renderOpenPanel() {
  useSettingsStore.setState({ settingsOpen: true })
  render(<SettingsPanel />)
}

describe('SettingsPanel toggles', () => {
  afterEach(() => {
    useSettingsStore.setState({ settingsOpen: false, masterMuted: false })
  })

  it('exposes each toggle as a switch with its checked state', () => {
    renderOpenPanel()
    const muteSwitch = screen.getByRole('switch', { name: 'Mute All Audio' })
    expect(muteSwitch).toHaveAttribute('aria-checked', 'false')
    expect(muteSwitch).toHaveAttribute('tabindex', '0')
  })

  it('toggles with the Space key', () => {
    renderOpenPanel()
    const muteSwitch = screen.getByRole('switch', { name: 'Mute All Audio' })
    fireEvent.keyDown(muteSwitch, { key: ' ' })
    expect(useSettingsStore.getState().masterMuted).toBe(true)
    expect(muteSwitch).toHaveAttribute('aria-checked', 'true')
  })

  it('toggles with the Enter key', () => {
    renderOpenPanel()
    const muteSwitch = screen.getByRole('switch', { name: 'Mute All Audio' })
    fireEvent.keyDown(muteSwitch, { key: 'Enter' })
    expect(useSettingsStore.getState().masterMuted).toBe(true)
  })

  it('still toggles on click', () => {
    renderOpenPanel()
    fireEvent.click(screen.getByRole('switch', { name: 'Mute All Audio' }))
    expect(useSettingsStore.getState().masterMuted).toBe(true)
  })
})
