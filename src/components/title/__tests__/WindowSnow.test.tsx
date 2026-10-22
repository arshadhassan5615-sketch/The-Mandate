import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import WindowSnow from '../WindowSnow'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function makeCtxStub() {
  const gradient = { addColorStop: vi.fn() }
  return {
    clearRect: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    beginPath: vi.fn(),
    setTransform: vi.fn(),
    fillRect: vi.fn(),
    createLinearGradient: vi.fn(() => gradient),
    save: vi.fn(),
    restore: vi.fn(),
    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
    putImageData: vi.fn(),
    fillStyle: '',
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    filter: 'none',
  }
}

function stubMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

/** jsdom does not implement HTMLImageElement.decode, so the mask path needs an explicit stub. */
function stubImageDecode(impl: () => Promise<void>) {
  Object.defineProperty(HTMLImageElement.prototype, 'decode', {
    configurable: true,
    writable: true,
    value: vi.fn(impl),
  })
}

function clearImageDecode() {
  delete (HTMLImageElement.prototype as { decode?: unknown }).decode
}

describe('WindowSnow', () => {
  const originalMatchMedia = window.matchMedia
  let ctxStub: ReturnType<typeof makeCtxStub>
  let rafSpy: ReturnType<typeof vi.spyOn>
  let cafSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    ctxStub = makeCtxStub()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () => ctxStub as unknown as CanvasRenderingContext2D,
    )
    rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1)
    cafSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
    stubMatchMedia(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    window.matchMedia = originalMatchMedia
    clearImageDecode()
  })

  it('renders an aria-hidden canvas and does not throw when getContext returns null', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    const { unmount } = render(<WindowSnow />)
    const canvas = screen.getByTestId('window-snow')
    expect(canvas.tagName).toBe('CANVAS')
    expect(canvas).toHaveAttribute('aria-hidden', 'true')
    expect(() => unmount()).not.toThrow()
    expect(rafSpy).not.toHaveBeenCalled()
  })

  it('starts an animation loop when a 2d context is available', () => {
    const { unmount } = render(<WindowSnow />)
    expect(rafSpy).toHaveBeenCalled()
    unmount()
  })

  it('draws flakes into the canvas when a 2d context is available', () => {
    const { unmount } = render(<WindowSnow />)
    expect(ctxStub.setTransform).toHaveBeenCalled()
    expect(ctxStub.arc).toHaveBeenCalled()
    unmount()
  })

  it('draws one static frame and does not start the loop under reduced motion', () => {
    stubMatchMedia(true)
    const { unmount } = render(<WindowSnow />)
    expect(ctxStub.arc).toHaveBeenCalled()
    expect(rafSpy).not.toHaveBeenCalled()
    unmount()
  })

  it('queries the reduced-motion media query', () => {
    render(<WindowSnow />)
    expect(window.matchMedia).toHaveBeenCalledWith(REDUCED_MOTION_QUERY)
  })

  it('cancels the animation frame on unmount', () => {
    const { unmount } = render(<WindowSnow />)
    unmount()
    expect(cafSpy).toHaveBeenCalledWith(1)
  })

  it('still draws flakes and does not throw when the mask fails to build', async () => {
    stubImageDecode(() => Promise.reject(new Error('decode failed')))
    const { unmount } = render(<WindowSnow />)
    await act(async () => {})
    expect(ctxStub.arc).toHaveBeenCalled()
    expect(ctxStub.globalCompositeOperation).not.toBe('destination-in')
    expect(() => unmount()).not.toThrow()
  })

  it('applies the glass mask with destination-in once the mask builds (reduced motion)', async () => {
    stubMatchMedia(true)
    stubImageDecode(() => Promise.resolve())
    const { unmount } = render(<WindowSnow />)
    await waitFor(() => expect(ctxStub.globalCompositeOperation).toBe('destination-in'))
    expect(ctxStub.getImageData).toHaveBeenCalled()
    expect(ctxStub.putImageData).toHaveBeenCalled()
    unmount()
  })
})
