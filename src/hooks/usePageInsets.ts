import { useViewportMode, type ViewportMode } from './useViewportMode'
import { pageInsets, type PageInsets } from '../constants/layout'

/** Viewport mode flags plus the space a full-page phase must leave for the fixed HUD. */
export function usePageInsets(): PageInsets & { isPhone: boolean; isCompact: boolean; mode: ViewportMode } {
  const mode = useViewportMode()
  return { ...pageInsets(mode), isPhone: mode === 'phone', isCompact: mode === 'compact', mode }
}
