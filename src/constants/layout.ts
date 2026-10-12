// Space the fixed HUD takes up, so full-page phases (briefing, agenda, ...)
// can keep their content clear of it.
//
// Desktop: TopBar strip across the top, nav rail down the right edge.
// Phone:   TopBar crest + pills at the top, the Government buttons in a row
//          under it, and the nav as a bar along the bottom.

export interface PageInsets { top: number; right: number; bottom: number }

/** Top of the phone row of Government buttons (under the 60px TopBar crest). */
export const PHONE_GOV_ROW_TOP = 76
/** Phone Government button size; matches the bottom bar (52px × 0.75). */
export const PHONE_RAIL_BUTTON = 40
/** Height of the phone bottom nav bar (RightSidebar). */
export const PHONE_BOTTOM_BAR = 60

const DESKTOP_INSETS: PageInsets = { top: 48, right: 60, bottom: 0 }
const PHONE_INSETS: PageInsets = {
  top: PHONE_GOV_ROW_TOP + PHONE_RAIL_BUTTON + 12,
  right: 0,
  bottom: PHONE_BOTTOM_BAR,
}

export function pageInsets(isPhone: boolean): PageInsets {
  return isPhone ? PHONE_INSETS : DESKTOP_INSETS
}
