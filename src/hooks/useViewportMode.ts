import { useState, useEffect } from 'react'

export type ViewportMode = 'desktop' | 'compact' | 'phone'

/** Landscape screens no taller than this use the compact (Suzerain-style rail) layout. */
export const COMPACT_MAX_HEIGHT = 540
/** Portrait/narrow screens below this width use the phone layout. */
export const PHONE_MAX_WIDTH = 768

export function getViewportMode(width: number, height: number): ViewportMode {
  if (height <= COMPACT_MAX_HEIGHT && width > height) return 'compact'
  if (width < PHONE_MAX_WIDTH) return 'phone'
  return 'desktop'
}

export function useViewportMode(): ViewportMode {
  const [mode, setMode] = useState<ViewportMode>(() =>
    getViewportMode(window.innerWidth, window.innerHeight),
  )
  useEffect(() => {
    const handler = () => setMode(getViewportMode(window.innerWidth, window.innerHeight))
    window.addEventListener('resize', handler)
    window.addEventListener('orientationchange', handler)
    return () => {
      window.removeEventListener('resize', handler)
      window.removeEventListener('orientationchange', handler)
    }
  }, [])
  return mode
}
