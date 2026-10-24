// Settings window layout: a centred window with three tabs. On a landscape phone
// (844x390, compact mode) the header and close control stay pinned, the body scrolls,
// the spacing tightens and each setting stacks into one column. Desktop keeps its sizing.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import SettingsPanel from '../SettingsPanel'
import { useSettingsStore } from '../../stores/settingsStore'

const original = { w: window.innerWidth, h: window.innerHeight }
// Chrome buttons in the window: three tabs, the header ✕ and return-to-menu. Desktop adds the footer Close.
const CHROME_COMPACT_BUTTONS = 5
const CHROME_DESKTOP_BUTTONS = 6
const AUDIO_SLIDERS = 4 // Master, Music, Ambient, UI Sound
const DISPLAY_SEGMENTS = 7 // 4 text speeds, 3 font sizes
const GAME_CHECKBOXES = 1 // Story Mode
const WINDOW_WIDTH = 'min(760px, 100%)'

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width })
  Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: height })
}

function renderOpenPanel() {
  useSettingsStore.setState({ settingsOpen: true })
  render(<SettingsPanel />)
  const dialog = screen.getByRole('dialog', { name: 'Settings' })
  const body = screen.getByTestId('settings-panel-body')
  const closeX = screen.getByRole('button', { name: 'Close settings' })
  return { dialog, body, closeX }
}

function selectTab(name: string) {
  fireEvent.click(screen.getByRole('tab', { name }))
}

function controlCount(): number {
  return document.querySelectorAll('input, button').length
}

// jsdom's CSS parser drops min() values, so read the value React hands to the width setter.
function spyOnWidthSetter() {
  const styleProto = Object.getPrototypeOf(document.createElement('div').style)
  return vi.spyOn(styleProto, 'width', 'set')
}

describe('SettingsPanel layout', () => {
  afterEach(() => {
    useSettingsStore.setState({ settingsOpen: false })
    setViewport(original.w, original.h)
  })

  it('keeps every setting control in compact mode except the duplicate footer Close', () => {
    setViewport(844, 390)
    renderOpenPanel()
    expect(controlCount()).toBe(CHROME_COMPACT_BUTTONS + AUDIO_SLIDERS)
    expect(screen.getByText('Mute All Audio')).toBeInTheDocument()

    selectTab('Display & Accessibility')
    expect(controlCount()).toBe(CHROME_COMPACT_BUTTONS + DISPLAY_SEGMENTS)
    expect(screen.getByText('High Contrast Mode')).toBeInTheDocument()

    selectTab('Game')
    expect(controlCount()).toBe(CHROME_COMPACT_BUTTONS + GAME_CHECKBOXES) // the Game switches are role="switch" divs, not counted here
    expect(screen.getByText('Ironman Mode')).toBeInTheDocument()
  })

  it('drops the footer Close button in compact mode and keeps the header ✕ inside the window', () => {
    setViewport(844, 390)
    const { dialog, closeX } = renderOpenPanel()
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull()
    expect(closeX.textContent).toBe('✕')
    expect(dialog.contains(closeX)).toBe(true)
  })

  it('closes the settings from the header ✕ in compact mode', () => {
    setViewport(844, 390)
    renderOpenPanel()
    fireEvent.click(screen.getByRole('button', { name: 'Close settings' }))
    expect(useSettingsStore.getState().settingsOpen).toBe(false)
  })

  it('keeps the footer Close button on desktop', () => {
    setViewport(1440, 900)
    renderOpenPanel()
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })

  it('bounds the window to the viewport and makes only the body scroll in compact mode', () => {
    setViewport(844, 390)
    const { dialog, body } = renderOpenPanel()
    expect(dialog.style.display).toBe('flex')
    expect(dialog.style.flexDirection).toBe('column')
    expect(body.style.overflowY).toBe('auto')
    expect(body.style.flex).toBe('1 1 0%')
    expect(body.style.minHeight).toBe('0px')
  })

  it('uses the tighter scroll padding in compact mode', () => {
    setViewport(844, 390)
    const { body } = renderOpenPanel()
    expect(body.style.padding).toBe('8px 18px 6px')
  })

  it('keeps the desktop window width and every control on desktop', () => {
    setViewport(1440, 900)
    const widthSetter = spyOnWidthSetter()
    try {
      renderOpenPanel()
      expect(widthSetter).toHaveBeenCalledWith(WINDOW_WIDTH)
      expect(controlCount()).toBe(CHROME_DESKTOP_BUTTONS + AUDIO_SLIDERS)
      selectTab('Display & Accessibility')
      expect(controlCount()).toBe(CHROME_DESKTOP_BUTTONS + DISPLAY_SEGMENTS)
      selectTab('Game')
      expect(controlCount()).toBe(CHROME_DESKTOP_BUTTONS + GAME_CHECKBOXES)
    } finally {
      widthSetter.mockRestore()
    }
  })

  it('stacks each setting into one column on a landscape phone', () => {
    setViewport(844, 390)
    renderOpenPanel()
    const row = screen.getByText('Master Volume').closest('[data-testid="settings-row"]') as HTMLElement
    expect(row.style.gridTemplateColumns).toBe('1fr')
  })

  it('keeps the return button pinned in the footer and the Story Mode description as a title on a landscape phone', () => {
    setViewport(844, 390)
    const { body } = renderOpenPanel()
    selectTab('Game')
    const footer = screen.getByTestId('settings-panel-footer')
    const returnButton = screen.getByRole('button', { name: 'RETURN TO MAIN MENU' })
    expect(footer.contains(returnButton)).toBe(true)
    expect(body.contains(returnButton)).toBe(false)
    const storyModeLabel = screen.getByLabelText('Story Mode').closest('label') as HTMLElement
    expect(storyModeLabel.getAttribute('title')).toContain('Setbacks from your decisions')
  })

  it('hides the Web Audio info paragraph in compact mode', () => {
    setViewport(844, 390)
    renderOpenPanel()
    expect(screen.queryByText(/Web Audio API/)).toBeNull()
  })

  it('keeps the same window width on a landscape phone, where the viewport caps it', () => {
    setViewport(844, 390)
    const widthSetter = spyOnWidthSetter()
    try {
      renderOpenPanel()
      expect(widthSetter).toHaveBeenCalledWith(WINDOW_WIDTH)
    } finally {
      widthSetter.mockRestore()
    }
  })

  it('shows the Web Audio info paragraph at desktop size', () => {
    setViewport(1440, 900)
    renderOpenPanel()
    expect(screen.getByText(/Web Audio API/)).toBeInTheDocument()
  })
})

describe('SettingsPanel tabs', () => {
  afterEach(() => {
    useSettingsStore.setState({ settingsOpen: false })
    setViewport(original.w, original.h)
  })

  it('shows only the active tab controls and labels the tabpanel by the active tab', () => {
    setViewport(1440, 900)
    renderOpenPanel()
    expect(screen.getByRole('tab', { name: 'Audio' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Audio' })).toHaveAttribute('aria-controls', 'settings-columns')
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'settings-tab-audio')
    expect(screen.getByText('Master Volume')).toBeInTheDocument()
    expect(screen.queryByText('Text Speed')).toBeNull()

    selectTab('Display & Accessibility')
    expect(screen.getByRole('tab', { name: 'Display & Accessibility' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'settings-tab-display')
    expect(screen.getByText('Text Speed')).toBeInTheDocument()
    expect(screen.queryByText('Master Volume')).toBeNull()

    selectTab('Game')
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'settings-tab-game')
    expect(screen.getByText('Story Mode')).toBeInTheDocument()
    expect(screen.getByText('Memory Hints')).toBeInTheDocument()
    expect(screen.queryByText('Text Speed')).toBeNull()
  })
})
