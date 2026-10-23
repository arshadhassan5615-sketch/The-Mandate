// Dialog listing a province's recent newspaper reports, opened from a news pin on the map.
import { useEffect, type CSSProperties, type MouseEvent as ReactMouseEvent } from 'react'
import { NEWSPAPERS } from '../../data/newspapers'
import type { ProvinceNewsItem } from '../../engine/provinceNews'
import { Z } from '../../constants/zIndex'

interface ProvinceNewsPopoverProps {
  provinceName: string
  items: readonly ProvinceNewsItem[]
  onClose: () => void
  onOpenPapers: () => void
}

const EXCERPT_MAX_CHARS = 220
const GOLD = '#c9a84c'
const MONO_FONT = "'IBM Plex Mono', monospace"
const HEADLINE_FONT = "'Playfair Display', serif"
const BODY_FONT = "'Crimson Text', Georgia, serif"
const HAIRLINE = '1px solid rgba(200,144,42,0.15)'
const RULE = '1px solid rgba(200,144,42,0.2)'

const BACKDROP_STYLE: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: Z.modalRaised,
  background: 'rgba(0,0,0,0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const PANEL_STYLE: CSSProperties = {
  width: 'min(440px, 92vw)',
  maxHeight: '70vh',
  display: 'flex',
  flexDirection: 'column',
  background: 'rgba(10,8,6,0.97)',
  border: '1px solid rgba(200,144,42,0.4)',
  borderRadius: 4,
  boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
}

const BODY_STYLE: CSSProperties = {
  fontFamily: BODY_FONT,
  fontSize: 13,
  lineHeight: 1.45,
  color: '#b8ad95',
  margin: 0,
}

const META_STYLE: CSSProperties = {
  fontFamily: MONO_FONT,
  fontSize: 9,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'rgba(201,168,76,0.6)',
}

const URGENT_STYLE: CSSProperties = {
  fontFamily: MONO_FONT,
  fontSize: 9,
  color: '#e07a5f',
  border: '1px solid #e07a5f',
  padding: '0 4px',
  marginLeft: 8,
  borderRadius: 2,
}

const HEADLINE_STYLE: CSSProperties = {
  fontFamily: HEADLINE_FONT,
  fontWeight: 700,
  fontSize: 15,
  color: '#efe1bb',
  margin: '4px 0',
}

const FOOTER_BUTTON_STYLE: CSSProperties = {
  background: 'transparent',
  border: `1px solid ${GOLD}`,
  color: GOLD,
  fontFamily: MONO_FONT,
  fontSize: 10,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  padding: '6px 14px',
  cursor: 'pointer',
}

function excerpt(text: string): string {
  return text.length > EXCERPT_MAX_CHARS ? `${text.slice(0, EXCERPT_MAX_CHARS)}…` : text
}

export default function ProvinceNewsPopover({ provinceName, items, onClose, onOpenPapers }: ProvinceNewsPopoverProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleBackdropClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div data-testid="province-news-backdrop" onClick={handleBackdropClick} style={BACKDROP_STYLE}>
      <div role="dialog" aria-modal="true" aria-label={`${provinceName} dispatches`} style={PANEL_STYLE}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 14px',
          borderBottom: RULE,
        }}>
          <span style={{ fontFamily: MONO_FONT, fontSize: 11, letterSpacing: '0.14em', color: '#c9a84c' }}>
            {`${provinceName.toUpperCase()} — DISPATCHES`}
          </span>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: GOLD, fontSize: 18, cursor: 'pointer' }}
          >
            ×
          </button>
        </div>

        <div style={{ overflowY: 'auto', padding: '4px 14px' }}>
          {items.length === 0 && (
            <p style={{ ...BODY_STYLE, padding: 14 }}>No reports from this province in the last two weeks.</p>
          )}
          {items.map(({ article, isAlert }, index) => {
            const paper = NEWSPAPERS[article.publication]?.name ?? article.publication
            const isLast = index === items.length - 1
            return (
              <article key={article.id} style={{ padding: '10px 0', borderBottom: isLast ? 'none' : HAIRLINE }}>
                <div>
                  <span style={META_STYLE}>{`${paper} · ${article.date}`}</span>
                  {isAlert && <span style={URGENT_STYLE}>URGENT</span>}
                </div>
                <h3 style={HEADLINE_STYLE}>{article.headline}</h3>
                <p style={BODY_STYLE}>{excerpt(article.body)}</p>
              </article>
            )
          })}
        </div>

        <div style={{ padding: '10px 14px', borderTop: RULE }}>
          <button type="button" onClick={onOpenPapers} style={FOOTER_BUTTON_STYLE}>
            Open the newspapers
          </button>
        </div>
      </div>
    </div>
  )
}
