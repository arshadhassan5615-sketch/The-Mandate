import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import ReadingModeBadge from '../ReadingModeBadge'
import SettingsPanel from '../../SettingsPanel'
import { useSettingsStore } from '../../../stores/settingsStore'

const LS_AUTO_ADVANCE = 'mandate-auto-advance'

describe('ReadingModeBadge', () => {
  it('shows AUTO in auto mode', () => {
    render(<ReadingModeBadge mode="auto" />)

    expect(screen.getByTestId('reading-mode')).toHaveTextContent('AUTO')
  })

  it('shows SKIP in skip mode', () => {
    render(<ReadingModeBadge mode="skip" />)

    expect(screen.getByTestId('reading-mode')).toHaveTextContent('SKIP ▸▸')
  })

  it('renders nothing when no mode is active', () => {
    render(<ReadingModeBadge mode={null} />)

    expect(screen.queryByTestId('reading-mode')).toBeNull()
  })

  it('does not intercept pointer input', () => {
    render(<ReadingModeBadge mode="auto" />)

    expect(screen.getByTestId('reading-mode')).toHaveStyle({ pointerEvents: 'none' })
  })
})

describe('Auto-Advance setting', () => {
  beforeEach(() => {
    localStorage.removeItem(LS_AUTO_ADVANCE)
    useSettingsStore.setState({ autoAdvance: false, settingsOpen: true })
  })

  afterEach(() => {
    localStorage.removeItem(LS_AUTO_ADVANCE)
    useSettingsStore.setState({ autoAdvance: false, settingsOpen: false })
  })

  it('is off by default', async () => {
    vi.resetModules()
    localStorage.removeItem(LS_AUTO_ADVANCE)
    localStorage.removeItem('mandate-settings')
    const fresh = await import('../../../stores/settingsStore')

    expect(fresh.useSettingsStore.getState().autoAdvance).toBe(false)
  })

  it('starts on when the saved value is true', async () => {
    vi.resetModules()
    // The persisted settings blob rehydrates over the initial value, so clear it too.
    localStorage.removeItem('mandate-settings')
    localStorage.setItem(LS_AUTO_ADVANCE, 'true')
    const fresh = await import('../../../stores/settingsStore')

    expect(fresh.useSettingsStore.getState().autoAdvance).toBe(true)
  })

  it('clicking the Auto-Advance toggle flips the setting and saves it', () => {
    render(<SettingsPanel />)

    fireEvent.click(screen.getByText('Auto-Advance'))

    expect(useSettingsStore.getState().autoAdvance).toBe(true)
    expect(localStorage.getItem(LS_AUTO_ADVANCE)).toBe('true')

    fireEvent.click(screen.getByText('Auto-Advance'))

    expect(useSettingsStore.getState().autoAdvance).toBe(false)
    expect(localStorage.getItem(LS_AUTO_ADVANCE)).toBe('false')
  })
})
