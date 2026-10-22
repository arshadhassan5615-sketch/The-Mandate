import { useEffect, useState } from 'react'

export const PORTRAIT_TOUCH_QUERY = '(orientation: portrait) and (pointer: coarse)'

/** True when a touch device is held upright: the game asks to be turned sideways. */
export function useNeedsRotation(): boolean {
  const [needsRotation, setNeedsRotation] = useState<boolean>(
    () => window.matchMedia(PORTRAIT_TOUCH_QUERY).matches,
  )

  useEffect(() => {
    const mql = window.matchMedia(PORTRAIT_TOUCH_QUERY)
    const onChange = (e: { matches: boolean }) => setNeedsRotation(e.matches)
    setNeedsRotation(mql.matches)
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    }
    mql.addListener(onChange)
    return () => mql.removeListener(onChange)
  }, [])

  return needsRotation
}

/** Enters fullscreen and locks landscape where the browser allows. Never throws. Returns true if the lock succeeded. */
export async function enterLandscapeFullscreen(): Promise<boolean> {
  try {
    if (!document.fullscreenElement && typeof document.documentElement.requestFullscreen === 'function') {
      await document.documentElement.requestFullscreen()
    }
  } catch {
    // Fullscreen refused: continue, the orientation lock may still work.
  }
  try {
    const orientation = screen.orientation as
      | (ScreenOrientation & { lock?: (o: string) => Promise<void> })
      | undefined
    if (orientation && typeof orientation.lock === 'function') {
      await orientation.lock('landscape')
      return true
    }
  } catch {
    // Lock unsupported or refused.
  }
  return false
}
