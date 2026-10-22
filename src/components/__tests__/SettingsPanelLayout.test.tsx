// Settings modal layout: on a landscape phone (844x390, compact mode) the
// header and close control stay pinned, only the body scrolls, and the
// spacing tightens. Desktop keeps its original sizing. Every control stays.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import SettingsPanel from '../SettingsPanel'
import { useSettingsStore } from '../../stores/settingsStore'

const original = { w: window.innerWidth, h: window.innerHeight }
const SETTINGS_CONTROL_COUNT = 15 // 4 sliders, 1 story-mode checkbox, 7 segmented buttons, return-to-menu, header close, footer close

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width })
  Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: height })
}

function renderOpenPanel() {
  useSettingsStore.setState({ settingsOpen: true })
  render(<SettingsPanel />)
  const title = screen.getByText('▸ Settings')
  const header = title.parentElement as HTMLElement
  const container = header.parentElement as HTMLElement
  const body = header.nextElementSibling as HTMLElement
  const closeX = screen.getByRole('button', { name: 'Close settings' })
  return { header, container, body, closeX }
}

describe('SettingsPanel layout', () => {
  afterEach(() => {
    useSettingsStore.setState({ settingsOpen: false })
    setViewport(original.w, original.h)
  })

  it('keeps every setting control in compact mode except the duplicate footer Close', () => {
    setViewport(844, 390)
    renderOpenPanel()
    expect(document.querySelectorAll('input, button').length).toBe(SETTINGS_CONTROL_COUNT - 1)
    expect(screen.getByText('Mute All Audio')).toBeInTheDocument()
    expect(screen.getByText('High Contrast Mode')).toBeInTheDocument()
    expect(screen.getByText('Ironman Mode')).toBeInTheDocument()
  })

  it('drops the footer Close button in compact mode and gives the header ✕ a touch-sized target', () => {
    setViewport(844, 390)
    const { header, closeX } = renderOpenPanel()
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull()
    expect(closeX.textContent).toBe('✕')
    expect(closeX.style.minWidth).toBe('40px')
    expect(closeX.style.minHeight).toBe('40px')
    expect(closeX.style.marginRight).toBe('-0.5rem')
    expect(header.contains(closeX)).toBe(true)
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

  it('bounds the modal to the viewport and makes only the body scroll in compact mode', () => {
    setViewport(844, 390)
    const { header, container, body, closeX } = renderOpenPanel()
    expect(container.style.display).toBe('flex')
    expect(container.style.flexDirection).toBe('column')
    expect(container.style.maxHeight).toBe('calc(100dvh - 16px)')
    expect(container.style.overflow).toBe('hidden')
    expect(header.style.flexShrink).toBe('0')
    expect(closeX.style.flexShrink).toBe('0')
    expect(body.style.overflowY).toBe('auto')
    expect(body.style.flex).toBe('1 1 0%')
    expect(body.style.minHeight).toBe('0px')
  })

  it('uses smaller vertical padding in compact mode than on desktop', () => {
    setViewport(844, 390)
    const compact = renderOpenPanel()
    const compactBodyPadding = compact.body.style.padding
    const compactHeaderPadding = compact.header.style.padding
    expect(compactBodyPadding).toBe('0.5rem 1.5rem')
    expect(compactHeaderPadding).toBe('0.5rem 1.5rem')
  })

  it('keeps the desktop sizing unchanged', () => {
    setViewport(1440, 900)
    const { header, container, body, closeX } = renderOpenPanel()
    expect(container.style.maxHeight).toBe('85vh')
    expect(container.style.width).toBe('480px')
    expect(header.style.padding).toBe('1rem 1.5rem')
    expect(header.style.flexShrink).toBe('0')
    expect(closeX.style.flexShrink).toBe('0')
    expect(body.style.padding).toBe('1.5rem')
    expect(body.style.overflowY).toBe('auto')
    expect(document.querySelectorAll('input, button').length).toBe(SETTINGS_CONTROL_COUNT)
  })

  it('lays the body out in two columns on a landscape phone', () => {
    setViewport(844, 390)
    renderOpenPanel()
    const columns = screen.getByTestId('settings-columns')
    expect(columns.style.gridTemplateColumns).toBe('1fr 1fr')
  })

  it('keeps the return button in the right column and the Story Mode description as a title on a landscape phone', () => {
    setViewport(844, 390)
    renderOpenPanel()
    const rightColumn = screen.getByTestId('settings-columns').children[1] as HTMLElement
    const returnButton = screen.getByRole('button', { name: 'RETURN TO MAIN MENU' })
    expect(rightColumn.contains(returnButton)).toBe(true)
    const storyModeLabel = screen.getByLabelText('Story Mode').closest('label') as HTMLElement
    expect(storyModeLabel.getAttribute('title')).toContain('Setbacks from your decisions')
  })

  it('hides the Web Audio info paragraph in compact mode', () => {
    setViewport(844, 390)
    renderOpenPanel()
    expect(screen.queryByText(/Web Audio API/)).toBeNull()
  })

  it('widens the modal to fit the landscape phone viewport', () => {
    // jsdom's CSS parser drops min() values, so read the value React hands to the width setter.
    setViewport(844, 390)
    const styleProto = Object.getPrototypeOf(document.createElement('div').style)
    const widthSetter = vi.spyOn(styleProto, 'width', 'set')
    try {
      renderOpenPanel()
      expect(widthSetter).toHaveBeenCalledWith('min(820px, calc(100vw - 24px))')
    } finally {
      widthSetter.mockRestore()
    }
  })

  it('keeps the single-column body and info paragraph at desktop size', () => {
    setViewport(1440, 900)
    renderOpenPanel()
    expect(screen.queryByTestId('settings-columns')).toBeNull()
    expect(screen.getByText(/Web Audio API/)).toBeInTheDocument()
  })
})
