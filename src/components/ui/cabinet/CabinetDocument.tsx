import { useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Z } from '../../../constants/zIndex'
import { COMPACT_LEFT_GUTTER, HUD_LEFT_GUTTER, PHONE_BOTTOM_BAR, PHONE_TOP_BAR } from '../../../constants/layout'
import { rem } from '../../../constants/typography'
import { usePageInsets } from '../../../hooks/usePageInsets'
import type { ViewportMode } from '../../../hooks/useViewportMode'
import { GoldFrame, MedallionClose, OrnamentRule } from './CabinetParts'
import { CAB_FONT, CAB_LABEL } from './cabinetStyles'
import { handleTablistKeyDown, useEscapeToClose, useFocusOnOpen } from './panelBehaviour'

// The Cabinet document: a full-height near-black centre column that holds paper
// tabs and a cream state document. Desktop and compact sit between the left
// gutter and the right rail; phones fill the width between the top and bottom bars.

export interface CabinetDocumentProps {
  testId: string
  titleId: string
  title: string
  overline?: string
  closeLabel: string
  onClose: () => void
  /** Optional controls under the title, e.g. a pager. */
  nav?: ReactNode
  tabs?: ReactNode
  tabsLabel?: string
  /** Pinned below the scrolling body, centred. */
  actions?: ReactNode
  /** Max column width on desktop; default 600. */
  maxWidth?: number
  children: ReactNode
}

const DEFAULT_MAX_WIDTH = 600
const DEFAULT_OVERLINE = 'Chancellery'

/** Header and spacing values; compact and phone use the dense set so short screens keep more of the page. */
interface DocumentDensity {
  showOverline: boolean
  showOrnament: boolean
  headerPadding: string
  titleFontSize: string
  navMarginTop: number
  tabsPadding: string
  actionsPadding: string
  actionsGap: number
}

const DESKTOP_DENSITY: DocumentDensity = {
  showOverline: true,
  showOrnament: true,
  headerPadding: '16px 56px 4px',
  titleFontSize: rem(21),
  navMarginTop: 8,
  tabsPadding: '8px 14px 0',
  actionsPadding: '10px 16px 20px',
  actionsGap: 10,
}

const DENSE_DENSITY: DocumentDensity = {
  showOverline: false,
  showOrnament: false,
  headerPadding: '8px 56px 2px',
  titleFontSize: rem(17),
  navMarginTop: 2,
  tabsPadding: '4px 10px 0',
  actionsPadding: '6px 12px 10px',
  actionsGap: 8,
}
const COLUMN_BACKGROUND =
  'radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px) 0 0 / 4px 4px, var(--cab-column)'
const CLOSE_OUTSIDE_COLUMN: CSSProperties = { position: 'absolute', top: 14, right: -46, zIndex: 1 }
const CLOSE_INSIDE_COLUMN: CSSProperties = { position: 'absolute', top: 12, right: 14, zIndex: 1 }
const HEADING_INK = '#e8d9ae'
const TAB_INK = '#2a241c'
const TAB_ACTIVE_BACKGROUND = '#ece6d3'
const TAB_INACTIVE_BACKGROUND = '#d9d0b8'
const TAB_INACTIVE_OPACITY = 0.82

function areaPlacement(mode: ViewportMode, rightInset: number): CSSProperties {
  if (mode === 'phone') return { left: 0, right: 0, top: PHONE_TOP_BAR, bottom: PHONE_BOTTOM_BAR }
  if (mode === 'compact') return { top: 0, bottom: 0, left: COMPACT_LEFT_GUTTER, right: rightInset }
  return { top: 0, bottom: 0, left: HUD_LEFT_GUTTER, right: rightInset }
}

export default function CabinetDocument({
  testId,
  titleId,
  title,
  overline,
  closeLabel,
  onClose,
  nav,
  tabs,
  tabsLabel,
  actions,
  maxWidth = DEFAULT_MAX_WIDTH,
  children,
}: CabinetDocumentProps) {
  const insets = usePageInsets()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useFocusOnOpen([headingRef, closeRef])
  useEscapeToClose(onClose)

  const isDesktop = insets.mode === 'desktop'
  const closeStyle = isDesktop ? CLOSE_OUTSIDE_COLUMN : CLOSE_INSIDE_COLUMN
  const density = isDesktop ? DESKTOP_DENSITY : DENSE_DENSITY

  return (
    <div
      data-testid={`${testId}-area`}
      style={{
        position: 'fixed',
        zIndex: Z.panel,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        ...areaPlacement(insets.mode, insets.right),
      }}
    >
      <div
        role="dialog"
        aria-labelledby={titleId}
        data-testid={testId}
        data-layout={insets.mode}
        className="cabinet-document anim-slide-in-top"
        style={{
          pointerEvents: 'auto',
          position: 'relative',
          width: '100%',
          maxWidth: isDesktop ? maxWidth : undefined,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: COLUMN_BACKGROUND,
          boxShadow: '0 0 40px rgba(0,0,0,0.6)',
          color: 'var(--cab-text)',
        }}
      >
        <GoldFrame inset={6} />

        <MedallionClose label={closeLabel} onClick={onClose} buttonRef={closeRef} style={closeStyle} />

        <header style={{ flexShrink: 0, textAlign: 'center', padding: density.headerPadding }}>
          {density.showOverline && (
            <div
              style={{
                ...CAB_LABEL,
                color: 'var(--cab-gold)',
                fontSize: rem(10),
                letterSpacing: '0.32em',
                fontWeight: 700,
              }}
            >
              {overline ?? DEFAULT_OVERLINE}
            </div>
          )}
          <h2
            ref={headingRef}
            id={titleId}
            tabIndex={-1}
            style={{
              margin: '2px 0 0',
              fontFamily: CAB_FONT.title,
              fontWeight: 400,
              fontSize: density.titleFontSize,
              color: HEADING_INK,
              outline: 'none',
            }}
          >
            {title}
          </h2>
          {density.showOrnament && (
            <div style={{ marginTop: 6 }}>
              <OrnamentRule lineWidth={60} />
            </div>
          )}
          {nav && <div style={{ marginTop: density.navMarginTop }}>{nav}</div>}
        </header>

        {tabs && (
          <div
            role="tablist"
            aria-label={tabsLabel}
            onKeyDown={handleTablistKeyDown}
            style={{
              flexShrink: 0,
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 6,
              padding: density.tabsPadding,
            }}
          >
            {tabs}
          </div>
        )}

        <div
          data-testid={`${testId}-body`}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(201,168,76,0.3) transparent',
            padding: tabs ? '0 12px 12px' : '10px 12px 12px',
          }}
        >
          {children}
        </div>

        {actions && (
          <div
            data-testid={`${testId}-actions`}
            style={{
              flexShrink: 0,
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: density.actionsGap,
              padding: density.actionsPadding,
            }}
          >
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

interface PaperTabProps {
  id: string
  controls?: string
  label: string
  count?: number
  active: boolean
  onSelect: () => void
}

/** A paper-coloured tab, like a divider on a cabinet file. The active one lifts and carries a gold top edge. */
export function PaperTab({ id, controls, label, count, active, onSelect }: PaperTabProps) {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-selected={active}
      aria-controls={controls}
      tabIndex={active ? 0 : -1}
      onClick={onSelect}
      className="cabinet-paper-tab"
      style={{
        fontFamily: CAB_FONT.title,
        fontWeight: 700,
        fontSize: rem(11.5),
        color: TAB_INK,
        background: active ? TAB_ACTIVE_BACKGROUND : TAB_INACTIVE_BACKGROUND,
        opacity: active ? 1 : TAB_INACTIVE_OPACITY,
        border: 'none',
        borderTop: active ? '2px solid var(--cab-gold)' : '2px solid transparent',
        borderRadius: '4px 4px 0 0',
        padding: '5px 10px',
        position: 'relative',
        top: active ? 2 : 0,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {label}
      {count !== undefined && (
        <span
          aria-label={`${count} items`}
          style={{
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            background: 'var(--cab-gold)',
            color: '#1a140a',
            fontSize: rem(9.5),
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
          }}
        >
          {count}
        </span>
      )}
    </button>
  )
}
