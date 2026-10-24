import { useEffect, useRef } from 'react'
import { Z } from '../../constants/zIndex'
import { HUD_LEFT_GUTTER, type PageInsets } from '../../constants/layout'
import { usePageInsets } from '../../hooks/usePageInsets'
import type { ViewportMode } from '../../hooks/useViewportMode'
import veltriaSeal from '../../assets/images/veltria_seal.png'
import { OVERLINE, SERIF_BODY, STANDFIRST, TABLIST } from './paperStyles'

// The shared shell of the state papers: a fixed paper dialog with a seal, overline,
// title and optional standfirst, a close button, and Escape to close. Panels supply
// their own body, and optionally a tablist through `tabs`.
// The panel is non-modal: it takes focus when it opens and gives it back when it
// closes, but it does not trap focus.

const DEFAULT_DESKTOP_WIDTH = 'min(440px, calc(100vw - 112px))'
const DEFAULT_HEADER_PADDING = '18px 22px 0'
const DESKTOP_TOP_PX = 108
const DESKTOP_MAX_HEIGHT = 'calc(100vh - 120px)'
const COMPACT_EDGE_PX = 8
const PHONE_PLACEMENT: React.CSSProperties = { left: 8, right: 8, top: 84, bottom: 68 }
// The TopBar's More button. The desktop medallion and the phone tool both carry this label.
const MORE_BUTTON_SELECTOR = 'button[aria-label="More"]'

export interface PaperTabButtonProps {
  id: string
  /** Id of the tabpanel this tab controls. Omit it when that tabpanel is not rendered. */
  controls?: string
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
      tabIndex={active ? 0 : -1}
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

function panelPlacement(mode: ViewportMode, insets: PageInsets, desktopWidth: string): React.CSSProperties {
  if (mode === 'phone') return PHONE_PLACEMENT
  if (mode === 'compact') {
    return { left: insets.left, top: insets.top + COMPACT_EDGE_PX, bottom: COMPACT_EDGE_PX, width: desktopWidth }
  }
  // Desktop: the left edge clears the HUD crest.
  return { left: HUD_LEFT_GUTTER, top: DESKTOP_TOP_PX, width: desktopWidth, maxHeight: DESKTOP_MAX_HEIGHT }
}

/** An element that still sits in the document and can take focus. The body does not count. */
function canTakeFocus(element: Element | null): element is HTMLElement {
  return element instanceof HTMLElement
    && element !== document.body
    && element.isConnected
    && !element.hasAttribute('disabled')
}

function restoreFocus(opener: Element | null): void {
  if (canTakeFocus(opener)) {
    opener.focus()
    return
  }
  const moreButton = document.querySelector(MORE_BUTTON_SELECTOR)
  if (canTakeFocus(moreButton)) moreButton.focus()
}

/** Index of the tab an arrow, Home or End key moves to, wrapping at both ends. Null for other keys. */
function nextTabIndex(key: string, current: number, count: number): number | null {
  switch (key) {
    case 'ArrowRight': return (current + 1) % count
    case 'ArrowLeft': return (current - 1 + count) % count
    case 'Home': return 0
    case 'End': return count - 1
    default: return null
  }
}

function handleTablistKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
  const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]'))
  const current = tabs.indexOf(event.target as HTMLElement)
  if (current === -1) return
  const next = nextTabIndex(event.key, current, tabs.length)
  const nextTab = next === null ? undefined : tabs[next]
  if (!nextTab) return
  event.preventDefault()
  // Clicking the tab selects it through its own onSelect handler.
  nextTab.focus()
  nextTab.click()
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
  const insets = usePageInsets()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  // Focus the heading on open, and hand focus back to whatever had it on close.
  useEffect(() => {
    const opener = document.activeElement
    const focusTarget = headingRef.current ?? closeRef.current
    focusTarget?.focus()
    return () => restoreFocus(opener)
  }, [])

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

  return (
    <div
      role="dialog"
      aria-labelledby={titleId}
      data-testid={testId}
      className="paper-panel"
      style={{
        position: 'fixed',
        ...panelPlacement(insets.mode, insets, desktopWidth),
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
          ref={closeRef}
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
              ref={headingRef}
              id={titleId}
              tabIndex={-1}
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
          <div role="tablist" aria-label={tabsLabel} onKeyDown={handleTablistKeyDown} style={TABLIST}>
            {tabs}
          </div>
        )}
      </header>

      {children}
    </div>
  )
}
