import { describe, it, expect, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { getViewportMode, useViewportMode, type ViewportMode } from '../useViewportMode'

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true, writable: true })
  Object.defineProperty(window, 'innerHeight', { value: height, configurable: true, writable: true })
}

describe('getViewportMode', () => {
  const cases: Array<[number, number, ViewportMode]> = [
    [844, 390, 'compact'],
    [740, 360, 'compact'],
    [932, 430, 'compact'],
    [1024, 540, 'compact'],
    [1024, 541, 'desktop'],
    [390, 844, 'phone'],
    [500, 500, 'phone'],
    [1440, 900, 'desktop'],
    [800, 541, 'desktop'],
  ]
  it.each(cases)('%ix%i -> %s', (w, h, expected) => {
    expect(getViewportMode(w, h)).toBe(expected)
  })
})

describe('useViewportMode', () => {
  const origW = window.innerWidth
  const origH = window.innerHeight
  afterEach(() => setViewport(origW, origH))

  it('reacts to resize', () => {
    setViewport(1440, 900)
    const { result } = renderHook(() => useViewportMode())
    expect(result.current).toBe('desktop')
    act(() => {
      setViewport(844, 390)
      window.dispatchEvent(new Event('resize'))
    })
    expect(result.current).toBe('compact')
  })

  it('reacts to orientationchange', () => {
    setViewport(390, 844)
    const { result } = renderHook(() => useViewportMode())
    expect(result.current).toBe('phone')
    act(() => {
      setViewport(844, 390)
      window.dispatchEvent(new Event('orientationchange'))
    })
    expect(result.current).toBe('compact')
  })
})
