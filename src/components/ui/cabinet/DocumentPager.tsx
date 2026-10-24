import type { CSSProperties } from 'react'
import { rem } from '../../../constants/typography'
import { CAB_FONT } from './cabinetStyles'

export interface DocumentPagerProps {
  /** 0-based index of the item shown. */
  index: number
  total: number
  /** Singular noun for the label and aria labels, e.g. "Decree" or "Letter". */
  noun: string
  onPrevious: () => void
  onNext: () => void
}

const PAGER_STYLE: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }

const LABEL_STYLE: CSSProperties = {
  fontFamily: CAB_FONT.label,
  fontWeight: 500,
  fontSize: rem(11),
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--cab-muted)',
  minWidth: 120,
  textAlign: 'center',
}

function pagerButtonStyle(disabled: boolean): CSSProperties {
  return {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: 'radial-gradient(circle at 50% 30%, #2c2c2c 0%, #101010 68%)',
    border: '1.5px solid var(--cab-gold-rim)',
    color: 'var(--cab-gold-bright)',
    fontSize: rem(11),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    cursor: 'pointer',
    opacity: disabled ? 0.35 : 1,
  }
}

/** Previous / next stepper for a single-document-at-a-time view, with an "X of Y" label. */
export function DocumentPager({ index, total, noun, onPrevious, onNext }: DocumentPagerProps) {
  const singular = noun.toLowerCase()
  const isAtStart = index <= 0
  const isAtEnd = index >= total - 1
  const label = total === 0 ? `No ${singular}s` : `${noun} ${index + 1} of ${total}`

  return (
    <div data-testid="document-pager" style={PAGER_STYLE}>
      <button
        type="button"
        className="cabinet-close"
        aria-label={`Previous ${singular}`}
        disabled={isAtStart}
        onClick={onPrevious}
        style={pagerButtonStyle(isAtStart)}
      >
        <span aria-hidden="true">◀</span>
      </button>
      <span aria-live="polite" style={LABEL_STYLE}>{label}</span>
      <button
        type="button"
        className="cabinet-close"
        aria-label={`Next ${singular}`}
        disabled={isAtEnd}
        onClick={onNext}
        style={pagerButtonStyle(isAtEnd)}
      >
        <span aria-hidden="true">▶</span>
      </button>
    </div>
  )
}
