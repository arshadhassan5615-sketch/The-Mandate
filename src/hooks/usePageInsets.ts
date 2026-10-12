import { useIsMobile } from './useIsMobile'
import { pageInsets, type PageInsets } from '../constants/layout'

/** Phone flag plus the space a full-page phase must leave for the fixed HUD. */
export function usePageInsets(): PageInsets & { isPhone: boolean } {
  const isPhone = useIsMobile()
  return { ...pageInsets(isPhone), isPhone }
}
