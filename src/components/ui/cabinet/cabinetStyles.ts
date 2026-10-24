import type { CSSProperties } from 'react'
import { rem } from '../../../constants/typography'

export const CAB_FONT = {
  title: "'Playfair Display', Georgia, serif",
  label: "'Cinzel', 'Playfair Display SC', Georgia, serif",
  body: "'Crimson Text', Georgia, serif",
  script: "'IM Fell English', Georgia, serif",
  signature: "'Great Vibes', cursive",
} as const

/** Panel background: faint grain over near-black, warmed at the top. */
export const CAB_PANEL_BACKGROUND =
  'linear-gradient(180deg, rgba(201,168,76,0.06), transparent 160px), radial-gradient(rgba(255,255,255,0.022) 1px, transparent 1px) 0 0 / 4px 4px, var(--cab-panel)'

/** Small caps label: Cinzel, tracked. */
export const CAB_LABEL: CSSProperties = {
  fontFamily: CAB_FONT.label, fontWeight: 500, fontSize: rem(11),
  letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--cab-muted)',
}

export const CAB_TITLE: CSSProperties = {
  fontFamily: CAB_FONT.title, fontWeight: 400, fontSize: rem(24),
  letterSpacing: '0.02em', lineHeight: 1.15, color: 'var(--cab-title)', margin: 0,
}

export const CAB_BODY: CSSProperties = {
  fontFamily: CAB_FONT.body, fontSize: rem(15.5), lineHeight: 1.55, color: 'var(--cab-text)',
}

/** The segmented pill that holds tab buttons. */
export const CAB_PILL_GROUP: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 2, padding: 2,
  border: '1px solid rgba(201,168,76,0.45)', borderRadius: 16,
}

/** One segment of the pill; the active one is gold. */
export function cabPillSegment(active: boolean): CSSProperties {
  return {
    fontFamily: CAB_FONT.label, fontWeight: 500, fontSize: rem(11),
    letterSpacing: '0.16em', textTransform: 'uppercase',
    padding: '5px 14px', borderRadius: 14, cursor: 'pointer',
    border: `1px solid ${active ? 'var(--cab-gold)' : 'transparent'}`,
    background: active ? 'linear-gradient(#3a2e16, #241c0e)' : 'transparent',
    color: active ? 'var(--cab-gold-bright)' : '#cfc6b0',
  }
}
