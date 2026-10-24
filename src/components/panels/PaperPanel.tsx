import { useEffect } from 'react'
import { useIsMobile } from '../../hooks/useIsMobile'
import { Z } from '../../constants/zIndex'
import veltriaSeal from '../../assets/images/veltria_seal.png'
import { OVERLINE, SERIF_BODY, STANDFIRST, TABLIST } from './paperStyles'

// The shared shell of the state papers: a fixed paper dialog with a seal, overline,
// title and optional standfirst, a close button, and Escape to close. Panels supply
// their own body, and optionally a tablist through `tabs`.

const DEFAULT_DESKTOP_WIDTH = 'min(440px, calc(100vw - 112px))'
const DEFAULT_HEADER_PADDING = '18px 22px 0'

export interface PaperTabButtonProps {
  id: string
  controls: string
  label: string
  count?: number
  active: boolean
  onSelect: () => void
  className?: string
}

export function PaperTabButton({ id, controls, label, count, active, onSelect, className }: PaperTabButtonProps) {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-selected={active}
      aria-controls={controls}
      onClick={() => onSelect()}
      className={className}
      style={{
        ...OVERLINE,
        fontSize: '11px',
        color: active ? 'var(--doc-ink)' : 'var(--doc-ink-muted)',
        background: 'transparent',
        border: 'none',
        borderBottom: `2px solid ${active ? 'var(--oxblood)' : 'transparent'}`,
        padding: '6px 0 8px',
        marginBottom: '-1px',
        cursor: 'pointer',
      }}
    >
      {count === undefined ? label : <>{label} <span style={{ fontFamily: SERIF_BODY, letterSpacing: 0 }}>({count})</span></>}
    </button>
  )
}

export interface PaperPanelProps {
  testId: string
  titleId: string
  overline: string
  title: string
  standfirst?: string
  closeLabel: string
  onClose: () => void
  desktopWidth?: string
  headerPadding?: string
  tabs?: React.ReactNode
  tabsLabel?: string
  children: React.ReactNode
}

export default function PaperPanel({
  testId,
  titleId,
  overline,
  title,
  standfirst,
  closeLabel,
  onClose,
  desktopWidth = DEFAULT_DESKTOP_WIDTH,
  headerPadding = DEFAULT_HEADER_PADDING,
  tabs,
  tabsLabel,
  children,
}: PaperPanelProps) {
  const isMobile = useIsMobile()

  // Capture phase so Escape closes this panel only, not the next overlay
  // in App's Escape chain as well.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopImmediatePropagation()
      onClose()
    }
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [onClose])

  const placement: React.CSSProperties = isMobile
    ? { left: 8, right: 8, top: 84, bottom: 68 }
    : { left: 80, top: 96, width: desktopWidth, maxHeight: 'calc(100vh - 120px)' }

  return (
    <div
      role="dialog"
      aria-labelledby={titleId}
      data-testid={testId}
      style={{
        position: 'fixed',
        ...placement,
        zIndex: Z.panel,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--doc-paper)',
        color: 'var(--doc-ink)',
        border: '1px solid var(--doc-paper-edge)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.55), inset 0 0 60px rgba(120,90,40,0.12)',
        borderRadius: '2px',
        overflow: 'hidden',
      }}
    >
      <header style={{ padding: headerPadding, flexShrink: 0, position: 'relative' }}>
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className={`${testId}__close`}
          style={{
            position: 'absolute', top: 10, right: 10, zIndex: 1,
            width: 32, height: 32, border: 'none', background: 'transparent',
            color: 'var(--doc-ink-muted)', fontSize: '22px', lineHeight: 1, cursor: 'pointer',
          }}
        >
          ×
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={veltriaSeal} alt="" style={{ width: 40, height: 40, opacity: 0.75 }} />
          <div>
            <div style={OVERLINE}>{overline}</div>
            <h2
              id={titleId}
              style={{
                margin: '2px 0 0',
                fontFamily: 'var(--font-headline)',
                fontSize: '22px',
                lineHeight: 1.15,
                color: 'var(--doc-ink)',
              }}
            >
              {title}
            </h2>
            {standfirst !== undefined && <p style={STANDFIRST}>{standfirst}</p>}
          </div>
        </div>
        {tabs !== undefined && (
          <div role="tablist" aria-label={tabsLabel} style={TABLIST}>
            {tabs}
          </div>
        )}
      </header>

      {children}
    </div>
  )
}
