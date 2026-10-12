// Single-key shortcuts for the HUD panels. App.tsx binds them; the nav rails
// show them in their tooltips, so the two can never disagree.
export const HUD_SHORTCUTS = {
  codex: 'C',
  journal: 'J',
  notepad: 'N',
  map: 'M',
  news: 'P', // "Press"
  decrees: 'D',
  letters: 'L',
} as const

export type HudShortcut = keyof typeof HUD_SHORTCUTS
