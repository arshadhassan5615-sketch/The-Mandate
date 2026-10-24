import { useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Z } from '../../../constants/zIndex'
import { rem } from '../../../constants/typography'
import { usePageInsets } from '../../../hooks/usePageInsets'
import { GoldFrame, MedallionClose, NationalSeal, OrnamentRule } from './CabinetParts'
import { CAB_LABEL, CAB_PANEL_BACKGROUND, CAB_PILL_GROUP, CAB_TITLE } from './cabinetStyles'
import { handleTablistKeyDown, useEscapeToClose, useFocusOnOpen } from './panelBehaviour'

// A centred Cabinet window for dialogs that take over the screen: a dimmed backdrop,
// a gold-framed panel with a centred header, an optional row of tabs, a scrolling
// body and a pinned footer. Desktop uses the full header; compact and phone use the dense set.

export interface CabinetWindowProps {
  testId: string
  titleId: string
  title: string
  overline?: string
  closeLabel: string
  onClose: () => void
  tabs?: ReactNode
  tabsLabel?: string
  /** Pinned bottom bar; left and right groups. */
  footerStart?: ReactNode
  footerEnd?: ReactNode
  width?: number
  height?: number
  children: ReactNode
}

const DEFAULT_WIDTH = 760
const DEFAULT_HEIGHT = 560
const DEFAULT_OVERLINE = 'Chancellery'
const BACKDROP_BACKGROUND = 'rgba(8,8,6,0.55)'
const WINDOW_BORDER = '1px solid #2a2a2a'
const WINDOW_SHADOW = '0 30px 80px rgba(0,0,0,0.7)'
const FOOTER_BORDER = '1px solid rgba(201,168,76,0.2)'
const FOOTER_GROUP_STYLE: CSSProperties = { display: 'flex', gap: 10 }

/** Spacing values; compact and phone use the dense set so short screens keep more of the page. */
interface WindowDensity {
  showSeal: boolean
  showOrnament: boolean
  headerPadding: string
  closeInset: number
  titleFontSize: string
  tabsMarginTop: number
  bodyPadding: string
  footerPadding: string
}

const DESKTOP_DENSITY: WindowDensity = {
  showSeal: true,
  showOrnament: true,
  headerPadding: '18px 56px 0',
  closeInset: 18,
  titleFontSize: rem(26),
  tabsMarginTop: 14,
  bodyPadding: '14px 40px 8px',
  footerPadding: '14px 28px 22px',
}

const DENSE_DENSITY: WindowDensity = {
  showSeal: false,
  showOrnament: false,
  headerPadding: '10px 56px 0',
  closeInset: 10,
  titleFontSize: rem(19),
  tabsMarginTop: 8,
  bodyPadding: '8px 18px 6px',
  footerPadding: '8px 14px 12px',
}

export default function CabinetWindow({
  testId,
  titleId,
  title,
  overline,
  closeLabel,
  onClose,
  tabs,
  tabsLabel,
  footerStart,
  footerEnd,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  children,
}: CabinetWindowProps) {
  const { mode } = usePageInsets()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useFocusOnOpen([headingRef, closeRef])
  useEscapeToClose(onClose)

  const density = mode === 'desktop' ? DESKTOP_DENSITY : DENSE_DENSITY
  const hasFooter = Boolean(footerStart || footerEnd)

  return (
    <div
      data-testid={`${testId}-backdrop`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: Z.modal,
        background: BACKDROP_BACKGROUND,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
      }}
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid={testId}
        style={{
          position: 'relative',
          width: `min(${width}px, 100%)`,
          height: `min(${height}px, 100%)`,
          display: 'flex',
          flexDirection: 'column',
          background: CAB_PANEL_BACKGROUND,
          border: WINDOW_BORDER,
          boxShadow: WINDOW_SHADOW,
          color: 'var(--cab-text)',
        }}
      >
        <GoldFrame inset={8} />

        <MedallionClose
          label={closeLabel}
          onClick={onClose}
          buttonRef={closeRef}
          size={34}
          style={{ position: 'absolute', top: density.closeInset, right: density.closeInset }}
        />

        <header style={{ flexShrink: 0, textAlign: 'center', padding: density.headerPadding }}>
          {density.showSeal && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
              <NationalSeal surface="dark" size={40} />
            </div>
          )}
          <div
            style={{
              ...CAB_LABEL,
              color: 'var(--cab-gold)',
              fontSize: rem(10),
              letterSpacing: '0.3em',
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {overline ?? DEFAULT_OVERLINE}
          </div>
          <h2
            ref={headingRef}
            id={titleId}
            tabIndex={-1}
            style={{ ...CAB_TITLE, margin: '6px 0 0', fontSize: density.titleFontSize, outline: 'none' }}
          >
            {title}
          </h2>
          {density.showOrnament && (
            <div style={{ marginTop: 8 }}>
              <OrnamentRule lineWidth={70} />
            </div>
          )}
        </header>

        {tabs && (
          <div
            role="tablist"
            aria-label={tabsLabel}
            onKeyDown={handleTablistKeyDown}
            style={{
              ...CAB_PILL_GROUP,
              flexShrink: 0,
              alignSelf: 'center',
              marginTop: density.tabsMarginTop,
              maxWidth: 'calc(100% - 24px)',
              overflowX: 'auto',
              scrollbarWidth: 'none',
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
            padding: density.bodyPadding,
          }}
        >
          {children}
        </div>

        {hasFooter && (
          <div
            data-testid={`${testId}-footer`}
            style={{
              flexShrink: 0,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap',
              borderTop: FOOTER_BORDER,
              padding: density.footerPadding,
            }}
          >
            <div style={FOOTER_GROUP_STYLE}>{footerStart}</div>
            <div style={FOOTER_GROUP_STYLE}>{footerEnd}</div>
          </div>
        )}
      </div>
    </div>
  )
}
