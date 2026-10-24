// Space the fixed HUD takes up, so full-page phases (briefing, agenda, ...)
// can keep their content clear of it.
//
// Suzerain-style HUD: a gold crest and round map button top-left, a compact
// stat tab beside them, and a floating capsule of medallion buttons on the
// right edge. Phones keep a compact top bar and move the tools to a bar along
// the bottom. Short landscape screens (compact) use a small stat strip
// top-left and a tool rail down the right edge. Full-page phases also keep
// clear of the crest and portrait on the left.

import type { ViewportMode } from '../hooks/useViewportMode'

export interface PageInsets { top: number; right: number; bottom: number; left: number }

/** Height of the desktop stat tab. */
export const COMMAND_BAR_HEIGHT = 52
/** Width the desktop medallion capsule takes from the right edge (89px), plus a small gap. */
export const HUD_RAIL_WIDTH = 96
/** Height of the phone top bar (crest, week, two stats). */
export const PHONE_TOP_BAR = 52
/** Height of the phone bottom tool bar. */
export const PHONE_BOTTOM_BAR = 60
/** Height of the compact top-left stat strip. */
export const COMPACT_STRIP_HEIGHT = 40
/** Width of the compact right-hand tool rail (57px), plus a small gap. */
export const COMPACT_RAIL_WIDTH = 64
/** Width the desktop crest (top-left) and player portrait (bottom-left) take from the left edge, plus a small gap. */
export const HUD_LEFT_GUTTER = 124
/** Width the compact crest takes from the left edge, plus a small gap (the portrait is hidden off the map). */
export const COMPACT_LEFT_GUTTER = 80

const DESKTOP_INSETS: PageInsets = { top: COMMAND_BAR_HEIGHT, right: HUD_RAIL_WIDTH, bottom: 0, left: HUD_LEFT_GUTTER }
const PHONE_INSETS: PageInsets = { top: PHONE_TOP_BAR, right: 0, bottom: PHONE_BOTTOM_BAR, left: 0 }
const COMPACT_INSETS: PageInsets = { top: COMPACT_STRIP_HEIGHT, right: COMPACT_RAIL_WIDTH, bottom: 0, left: COMPACT_LEFT_GUTTER }

// A boolean is the legacy isPhone flag.
export function pageInsets(mode: ViewportMode | boolean): PageInsets {
  if (mode === true || mode === 'phone') return PHONE_INSETS
  if (mode === 'compact') return COMPACT_INSETS
  return DESKTOP_INSETS
}
