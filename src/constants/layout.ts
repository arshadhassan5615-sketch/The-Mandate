// Space the fixed HUD takes up, so full-page phases (briefing, agenda, ...)
// can keep their content clear of it.
//
// Suzerain-style HUD: a gold crest and round map button top-left, a compact
// stat tab beside them, and a floating capsule of medallion buttons on the
// right edge. Phones keep a compact top bar and move the tools to a bar along
// the bottom. Short landscape screens (compact) use a small stat strip
// top-left and a tool rail down the right edge.

import type { ViewportMode } from '../hooks/useViewportMode'

export interface PageInsets { top: number; right: number; bottom: number }

/** Height of the desktop stat tab. */
export const COMMAND_BAR_HEIGHT = 52
/** Width the desktop medallion capsule takes from the right edge. */
export const HUD_RAIL_WIDTH = 84
/** Height of the phone top bar (crest, week, two stats). */
export const PHONE_TOP_BAR = 52
/** Height of the phone bottom tool bar. */
export const PHONE_BOTTOM_BAR = 60
/** Height of the compact top-left stat strip. */
export const COMPACT_STRIP_HEIGHT = 40
/** Width of the compact right-hand tool rail. */
export const COMPACT_RAIL_WIDTH = 60

const DESKTOP_INSETS: PageInsets = { top: COMMAND_BAR_HEIGHT, right: HUD_RAIL_WIDTH, bottom: 0 }
const PHONE_INSETS: PageInsets = { top: PHONE_TOP_BAR, right: 0, bottom: PHONE_BOTTOM_BAR }
const COMPACT_INSETS: PageInsets = { top: COMPACT_STRIP_HEIGHT, right: COMPACT_RAIL_WIDTH, bottom: 0 }

// A boolean is the legacy isPhone flag.
export function pageInsets(mode: ViewportMode | boolean): PageInsets {
  if (mode === true || mode === 'phone') return PHONE_INSETS
  if (mode === 'compact') return COMPACT_INSETS
  return DESKTOP_INSETS
}
