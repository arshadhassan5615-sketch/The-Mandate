import { afterEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import SettingsPanel from '../SettingsPanel'
import { useSettingsStore } from '../../stores/settingsStore'

describe('SettingsPanel Story Mode', () => {
  afterEach(() => {
    useSettingsStore.setState({ storyMode: false, settingsOpen: false })
  })

  it('toggling the Story Mode checkbox flips the store value', () => {
    useSettingsStore.setState({ storyMode: false, settingsOpen: true })
    render(<SettingsPanel />)
    fireEvent.click(screen.getByRole('tab', { name: 'Game' }))

    const checkbox = screen.getByLabelText('Story Mode') as HTMLInputElement
    expect(checkbox.checked).toBe(false)
    expect(screen.getByText('Story Mode is off.')).toBeTruthy()

    fireEvent.click(checkbox)
    expect(useSettingsStore.getState().storyMode).toBe(true)
    expect(screen.getByText('Story Mode is on.')).toBeTruthy()

    fireEvent.click(checkbox)
    expect(useSettingsStore.getState().storyMode).toBe(false)
  })
})
