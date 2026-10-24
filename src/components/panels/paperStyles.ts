// Shared style tokens for the state papers. Kept apart from PaperPanel.tsx so that
// the component module exports components only.

export const SERIF_BODY = "'Crimson Text', Georgia, serif"

export const OVERLINE: React.CSSProperties = {
  fontFamily: 'var(--font-ui)',
  fontSize: '10px',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--doc-ink-muted)',
}

export const STANDFIRST: React.CSSProperties = {
  fontFamily: SERIF_BODY,
  fontStyle: 'italic',
  fontSize: '13px',
  margin: '4px 0 0',
  color: 'var(--doc-ink-muted)',
}

export const TABLIST: React.CSSProperties = {
  display: 'flex',
  gap: '20px',
  marginTop: '16px',
  borderBottom: '1px solid var(--doc-rule)',
}
