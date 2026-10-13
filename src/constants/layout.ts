// Space the fixed HUD takes up, so full-page phases (briefing, agenda, ...)
// can keep their content clear of it.
//
// Suzerain-style shell: one command bar across the top (stats on the left,
// labelled tools on the right). Phones keep a compact top bar and move the
// tools to a bar along the bottom.

export interface PageInsets { top: number; right: number; bottom: number }

/** Height of the desktop command bar. */
export const COMMAND_BAR_HEIGHT = 56
/** Height of the phone top bar (crest, week, two stats). */
export const PHONE_TOP_BAR = 52
/** Height of the phone bottom tool bar. */
export const PHONE_BOTTOM_BAR = 60

const DESKTOP_INSETS: PageInsets = { top: COMMAND_BAR_HEIGHT, right: 0, bottom: 0 }
const PHONE_INSETS: PageInsets = { top: PHONE_TOP_BAR, right: 0, bottom: PHONE_BOTTOM_BAR }

export function pageInsets(isPhone: boolean): PageInsets {
  return isPhone ? PHONE_INSETS : DESKTOP_INSETS
}
