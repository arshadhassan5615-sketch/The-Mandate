// Size tables, shared CSS and date helpers for the Suzerain-style HUD
// (crest, stat tab and medallion rail). Desktop and landscape-phone use these;
// the portrait-phone bottom bar does not.
import type { ReactNode } from 'react'

export type HudScale = 'desktop' | 'compact'

export const HUD_SIZES = {
  desktop: { flagW: 120, flagH: 67, strip: 52, gaugeWidth: 120, chipFont: 15, icon: 34, medallion: 50, newsMedallion: 62, railGap: 10, railPadX: 10 },
  compact: { flagW: 76, flagH: 42, strip: 40, gaugeWidth: 84, chipFont: 13, icon: 24, medallion: 40, newsMedallion: 46, railGap: 5, railPadX: 6 },
} as const

/** Keeps HUD pieces clear of a notch on the left edge. */
export const SAFE_LEFT = 'env(safe-area-inset-left, 0px)'

export interface RailItem {
  key: string
  label: string
  icon: ReactNode
  onClick: () => void
  active?: boolean
  badge?: number
  shortcut?: string
  big?: boolean
  count?: number
}

/** Shared medallion look, rendered once by MedallionRail. HudCrest relies on it. */
export const HUD_CSS = `
.hud-medallion { position: relative; display: flex; align-items: center; justify-content: center; flex-direction: column; border: none; border-radius: 50%; cursor: pointer; color: #e8dcc0; background: radial-gradient(circle at 50% 35%, #262626 0%, #0a0a0a 72%); box-shadow: inset 0 0 0 2px #8a7440, 0 2px 6px rgba(0,0,0,0.6); transition: transform 0.18s cubic-bezier(0.16,1,0.3,1), box-shadow 0.18s ease, color 0.18s ease; }
.hud-medallion:hover, .hud-medallion:focus-visible { transform: scale(1.08); color: #ffe7b0; box-shadow: inset 0 0 0 2px #d9c48a, 0 0 12px rgba(201,168,76,0.45); outline: none; }
.hud-medallion[aria-pressed="true"] { box-shadow: inset 0 0 0 2px #e8b04a, 0 0 14px rgba(232,176,74,0.5); color: #ffe7b0; }
.hud-medallion:active { transform: scale(0.95); }
.hud-tip { position: absolute; right: calc(100% + 10px); top: 50%; transform: translateY(-50%); opacity: 0; pointer-events: none; white-space: nowrap; background: #0a0a0a; border: 1px solid rgba(181,154,94,0.5); color: #e8dcc0; font-family: var(--font-ui); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; padding: 4px 10px; border-radius: 3px; transition: opacity 0.15s ease; }
.hud-medallion:hover .hud-tip, .hud-medallion:focus-visible .hud-tip { opacity: 1; }
.hud-crest { transition: transform 0.18s ease; } .hud-crest:hover { transform: scale(1.04); }
`

// date helpers

export function weekToDate(week: number): string {
  const d = new Date(1963, 0, 1)
  d.setDate(d.getDate() + (week - 1) * 7)
  return `${d.getDate()} ${d.toLocaleString('en-US', { month: 'long' })} ${d.getFullYear()}`
}
