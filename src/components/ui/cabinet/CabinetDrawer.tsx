import { useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Z } from '../../../constants/zIndex'
import { PHONE_BOTTOM_BAR, PHONE_TOP_BAR } from '../../../constants/layout'
import { rem } from '../../../constants/typography'
import { usePageInsets } from '../../../hooks/usePageInsets'
import type { ViewportMode } from '../../../hooks/useViewportMode'
import { GoldFrame, MedallionClose, NationalSeal, OrnamentRule } from './CabinetParts'
import { CAB_BODY, CAB_LABEL, CAB_PANEL_BACKGROUND, CAB_PILL_GROUP, CAB_TITLE } from './cabinetStyles'
import { handleTablistKeyDown, useEscapeToClose, useFocusOnOpen } from './panelBehaviour'

// The Cabinet drawer: a full-height near-black panel docked beside the game's
// right-hand button rail. Desktop and compact dock to the rail; phones fill the
// width between the top and bottom bars.

export interface CabinetDrawerProps {
  testId: string
  titleId: string
  title: string
  overline?: string
  standfirst?: string
  closeLabel: string
  onClose: () => void
  /** Desktop width; compact and phone ignore it. */
  width?: string
  tabs?: ReactNode
  tabsLabel?: string
  footer?: string
  className?: string
  /** Stacking layer; defaults to Z.panel. */
  zIndex?: number
  children: ReactNode
}

const DESKTOP_DEFAULT_WIDTH = 'min(420px, calc(100vw - 220px))'
const COMPACT_WIDTH = 'min(380px, calc(100vw - 144px))'
const RULE_COLOUR = 'var(--cab-gold-line)'
const FOOTER_RULE_WIDTH = 30

/** Header and spacing values; compact and phone use the dense set so short screens keep more of the page. */
interface DrawerDensity {
  showSeal: boolean
  headerPadding: string
  closeInset: number
  titleFontSize: CSSProperties['fontSize']
  ruleMarginTop: number
  tabsMarginTop: number
  bodyMarginTop: number
}

const DESKTOP_DENSITY: DrawerDensity = {
  showSeal: true,
  headerPadding: '22px 26px 0',
  closeInset: 18,
  titleFontSize: CAB_TITLE.fontSize,
  ruleMarginTop: 8,
  tabsMarginTop: 14,
  bodyMarginTop: 12,
}

const DENSE_DENSITY: DrawerDensity = {
  showSeal: false,
  headerPadding: '12px 56px 0',
  closeInset: 12,
  titleFontSize: rem(19),
  ruleMarginTop: 4,
  tabsMarginTop: 8,
  bodyMarginTop: 8,
}

// Panel bodies written for ivory paper read through these, so they stay legible on the dark drawer.
const PAPER_TOKEN_OVERRIDES = {
  '--doc-ink': 'var(--cab-title)',
  '--doc-ink-muted': 'var(--cab-muted)',
  '--doc-rule': 'rgba(201,168,76,0.18)',
  '--doc-paper': 'var(--cab-panel)',
  '--oxblood': '#d0584a',
  '--law-green': 'var(--sev-calm)',
} as const

function drawerPlacement(mode: ViewportMode, rightInset: number, width: string | undefined): CSSProperties {
  if (mode === 'phone') return { left: 0, right: 0, top: PHONE_TOP_BAR, bottom: PHONE_BOTTOM_BAR }
  if (mode === 'compact') return { top: 0, bottom: 0, right: rightInset, width: COMPACT_WIDTH }
  return { top: 0, bottom: 0, right: rightInset, width: width ?? DESKTOP_DEFAULT_WIDTH }
}

export default function CabinetDrawer({
  testId,
  titleId,
  title,
  overline,
  standfirst,
  closeLabel,
  onClose,
  width,
  tabs,
  tabsLabel,
  footer,
  className,
  zIndex = Z.panel,
  children,
}: CabinetDrawerProps) {
  const insets = usePageInsets()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useFocusOnOpen([headingRef, closeRef])
  useEscapeToClose(onClose)

  const density = insets.mode === 'desktop' ? DESKTOP_DENSITY : DENSE_DENSITY

  const rootStyle = {
    position: 'fixed',
    ...drawerPlacement(insets.mode, insets.right, width),
    zIndex,
    display: 'flex',
    flexDirection: 'column',
    background: CAB_PANEL_BACKGROUND,
    color: 'var(--cab-text)',
    borderLeft: '1px solid #2a2a2a',
    boxShadow: '-12px 0 30px rgba(0,0,0,0.5)',
    overflow: 'hidden',
    ...PAPER_TOKEN_OVERRIDES,
  } as CSSProperties

  return (
    <div
      role="dialog"
      aria-labelledby={titleId}
      data-testid={testId}
      className={['cabinet-drawer', 'anim-slide-in-right', className].filter(Boolean).join(' ')}
      data-layout={insets.mode}
      style={rootStyle}
    >
      <GoldFrame inset={8} />

      <header style={{ position: 'relative', flexShrink: 0, padding: density.headerPadding, textAlign: 'center' }}>
        <MedallionClose
          label={closeLabel}
          onClick={onClose}
          buttonRef={closeRef}
          style={{ position: 'absolute', top: density.closeInset, right: density.closeInset, zIndex: 1 }}
        />
        {density.showSeal && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
            <NationalSeal surface="dark" size={46} />
          </div>
        )}
        {overline && (
          <div style={{ ...CAB_LABEL, color: 'var(--cab-gold)', fontSize: rem(10), letterSpacing: '0.3em' }}>
            {overline}
          </div>
        )}
        <h2
          ref={headingRef}
          id={titleId}
          tabIndex={-1}
          style={{ ...CAB_TITLE, fontSize: density.titleFontSize, outline: 'none' }}
        >
          {title}
        </h2>
        <div style={{ marginTop: density.ruleMarginTop }}>
          <OrnamentRule />
        </div>
        {standfirst && (
          <p style={{ ...CAB_BODY, fontStyle: 'italic', fontSize: rem(13.5), color: 'var(--cab-muted)', margin: '6px 0 0' }}>
            {standfirst}
          </p>
        )}
        {tabs !== undefined && (
          <div
            role="tablist"
            aria-label={tabsLabel}
            onKeyDown={handleTablistKeyDown}
            // On narrow drawers the pill row scrolls sideways instead of spilling past the frame.
            style={{ ...CAB_PILL_GROUP, marginTop: density.tabsMarginTop, maxWidth: '100%', overflowX: 'auto', scrollbarWidth: 'none' }}
          >
            {tabs}
          </div>
        )}
      </header>

      <div
        className="anim-rise-in"
        style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', marginTop: density.bodyMarginTop }}
      >
        {children}
      </div>

      {footer && (
        <div
          aria-hidden="true"
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: '8px 0 20px',
            ...CAB_LABEL,
            fontSize: rem(10),
            letterSpacing: '0.2em',
          }}
        >
          <span style={{ width: FOOTER_RULE_WIDTH, height: 1, background: RULE_COLOUR }} />
          {footer}
          <span style={{ width: FOOTER_RULE_WIDTH, height: 1, background: RULE_COLOUR }} />
        </div>
      )}
    </div>
  )
}
