// Shared style tokens for the state papers. Kept apart from PaperPanel.tsx so that
// the component module exports components only.

import { rem } from '../../constants/typography'

export const SERIF_BODY = "'Crimson Text', Georgia, serif"

export const OVERLINE: React.CSSProperties = {
  fontFamily: 'var(--font-ui)',
  fontSize: rem(11),
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--doc-ink-muted)',
}

export const STANDFIRST: React.CSSProperties = {
  fontFamily: SERIF_BODY,
  fontStyle: 'italic',
  fontSize: rem(13),
  margin: '4px 0 0',
  color: 'var(--doc-ink-muted)',
}

export const TABLIST: React.CSSProperties = {
  display: 'flex',
  gap: '20px',
  marginTop: '16px',
  borderBottom: '1px solid var(--doc-rule)',
}
