import { describe, it, expect, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCabinetCompact } from '../useCabinetCompact'

describe('useCabinetCompact', () => {
  const originalWidth = window.innerWidth
  const originalHeight = window.innerHeight

  afterEach(() => {
    window.innerWidth = originalWidth
    window.innerHeight = originalHeight
  })

  it('returns false on a desktop viewport', () => {
    window.innerWidth = 1280
    window.innerHeight = 800
    const { result } = renderHook(() => useCabinetCompact())
    expect(result.current).toBe(false)
  })

  it('returns true on a short landscape (compact) viewport', () => {
    window.innerWidth = 844
    window.innerHeight = 390
    const { result } = renderHook(() => useCabinetCompact())
    expect(result.current).toBe(true)
  })

  it('returns true on a phone viewport', () => {
    window.innerWidth = 390
    window.innerHeight = 844
    const { result } = renderHook(() => useCabinetCompact())
    expect(result.current).toBe(true)
  })
})
