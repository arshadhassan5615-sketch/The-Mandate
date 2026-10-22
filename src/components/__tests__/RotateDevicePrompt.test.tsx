import { act, fireEvent, render, screen as rtlScreen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import RotateDevicePrompt from '../RotateDevicePrompt'
import { enterLandscapeFullscreen, PORTRAIT_TOUCH_QUERY } from '../../hooks/orientation'

type Listener = (e: { matches: boolean }) => void

function mockMatchMedia(matches: boolean) {
  const listeners: Listener[] = []
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        matches: query === PORTRAIT_TOUCH_QUERY ? matches : false,
        media: query,
        addEventListener: (_: string, l: Listener) => listeners.push(l),
        removeEventListener: (_: string, l: Listener) => {
          const i = listeners.indexOf(l)
          if (i >= 0) listeners.splice(i, 1)
        },
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
        onchange: null,
      }) as unknown as MediaQueryList,
  )
  return { listeners }
}

const originalRequestFullscreen = document.documentElement.requestFullscreen
const originalOrientation = Object.getOwnPropertyDescriptor(window.screen, 'orientation')

function stubOrientation(value: unknown) {
  Object.defineProperty(window.screen, 'orientation', { value, configurable: true })
}

describe('RotateDevicePrompt', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    document.documentElement.requestFullscreen = originalRequestFullscreen
    if (originalOrientation) Object.defineProperty(window.screen, 'orientation', originalOrientation)
    else delete (window.screen as unknown as Record<string, unknown>).orientation
  })

  it('renders nothing when the portrait touch query does not match', () => {
    mockMatchMedia(false)
    const { container } = render(<RotateDevicePrompt />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the dialog with its heading when the query matches', () => {
    mockMatchMedia(true)
    render(<RotateDevicePrompt />)
    expect(rtlScreen.getByRole('dialog')).toBeInTheDocument()
    expect(rtlScreen.getByRole('heading', { name: 'Turn your phone sideways' })).toBeInTheDocument()
  })

  it('requests fullscreen and locks landscape when the button is clicked', async () => {
    mockMatchMedia(true)
    const requestFullscreen = vi.fn().mockResolvedValue(undefined)
    const lock = vi.fn().mockResolvedValue(undefined)
    document.documentElement.requestFullscreen = requestFullscreen
    stubOrientation({ lock })
    render(<RotateDevicePrompt />)
    await act(async () => {
      fireEvent.click(rtlScreen.getByRole('button', { name: 'Play fullscreen' }))
    })
    expect(requestFullscreen).toHaveBeenCalledTimes(1)
    expect(lock).toHaveBeenCalledWith('landscape')
  })

  it('enterLandscapeFullscreen resolves false without throwing when everything fails', async () => {
    document.documentElement.requestFullscreen = vi.fn().mockRejectedValue(new Error('denied'))
    stubOrientation(undefined)
    await expect(enterLandscapeFullscreen()).resolves.toBe(false)
  })

  it('disappears when the media query changes to non-matching', () => {
    const { listeners } = mockMatchMedia(true)
    render(<RotateDevicePrompt />)
    expect(rtlScreen.getByRole('dialog')).toBeInTheDocument()
    act(() => {
      listeners.forEach((l) => l({ matches: false }))
    })
    expect(rtlScreen.queryByRole('dialog')).toBeNull()
  })
})
