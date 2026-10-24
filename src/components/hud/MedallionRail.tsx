// Suzerain-style tool rail on desktop and landscape. News floats on its own at the top
// right; a dark capsule below it holds the four main tools. On desktop a mirrored stack on
// the left holds the less-used tools, then More and Settings. Compact screens keep More and
// Settings inside the capsule. Phones keep the bottom tool bar instead.
import type { CSSProperties, ReactNode } from 'react'
import { Z } from '../../constants/zIndex'
import { getRailArt } from '../../assets/railArt'
import { GearIcon } from './icons'
import { HUD_CSS, HUD_SIZES, type HudScale, type RailItem } from './hudSizes'

interface MedallionRailProps {
  scale: HudScale
  news: RailItem
  items: RailItem[]
  leftItems?: RailItem[]
  more: ReactNode
  settings: { onClick: () => void }
}

const BADGE_RED = '#b5452f'
/** How far the News plaque hangs below the News disc. */
const NEWS_PLAQUE_OVERHANG = 12
/** The right capsule has a left border only; the left stack has a right border only. */
const CAPSULE_BORDER = 1
/** Top of the left stack, in px. */
const LEFT_STACK_TOP = 132

interface MedallionButtonProps {
  item: RailItem
  scale: HudScale
  /** Smaller button for the left stack; its tooltip opens to the right. */
  minor?: boolean
  style?: CSSProperties
}

function MedallionButton({ item, scale, minor = false, style }: MedallionButtonProps) {
  const sizes = HUD_SIZES[scale]
  const { label, icon, onClick, active, badge = 0, shortcut, big = false, count = 0 } = item
  const size = big ? sizes.newsMedallion : minor ? sizes.minorMedallion : sizes.medallion
  const compact = scale === 'compact'
  const className = big
    ? 'hud-medallion hud-medallion--news'
    : minor ? 'hud-medallion hud-medallion--left' : 'hud-medallion'
  const art = big ? null : getRailArt(item.key)
  const iconScale = minor ? sizes.minorMedallion / sizes.medallion : 1
  // The logo is sized directly, not inside the scaled wrapper: a transform isolates it, and the
  // screen blend would then keep the logo's black background instead of letting it fall away.
  const artSize = sizes.icon * 1.25 * iconScale
  const glyph = art === null
    ? <span style={{ display: 'flex', transform: `scale(${iconScale})` }}>{icon}</span>
    : <img src={art} alt="" aria-hidden="true" style={{ width: artSize, height: artSize, objectFit: 'contain', mixBlendMode: 'screen', pointerEvents: 'none' }} />

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      aria-label={badge > 0 ? `${label}, ${badge} new` : label}
      aria-pressed={active}
      aria-keyshortcuts={shortcut}
      style={{ width: size, height: size, flexShrink: 0, marginBottom: big ? 6 : undefined, ...style }}
    >
      {big ? (
        <>
          <span style={{
            fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: compact ? '17px' : '23px',
            lineHeight: 1, color: '#f3e3b8',
          }}>
            {count}
          </span>
          <span data-testid="news-plaque" style={{
            position: 'absolute', left: '50%', bottom: compact ? -8 : -10, transform: 'translateX(-50%)',
            padding: compact ? '0 5px' : '0 7px', borderRadius: 6,
            background: '#2a2a2a', border: '1px solid #5c5c5c',
            fontFamily: "'Playfair Display', serif", fontWeight: 700,
            fontSize: compact ? '9px' : '11px', lineHeight: compact ? '13px' : '16px',
            color: '#efe1bb', whiteSpace: 'nowrap', boxShadow: '0 2px 4px rgba(0,0,0,0.6)',
          }}>
            {label}
          </span>
        </>
      ) : (
        glyph
      )}
      {!big && badge > 0 && (
        <span aria-hidden style={{
          position: 'absolute', top: -2, right: -2,
          minWidth: 16, height: 16, padding: '0 4px', borderRadius: 8,
          background: BADGE_RED, color: '#fff', fontSize: '10px', fontWeight: 700, lineHeight: '16px', textAlign: 'center',
        }}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      {!big && <span className="hud-tip" aria-hidden="true">{label}</span>}
    </button>
  )
}

export default function MedallionRail({ scale, news, items, leftItems = [], more, settings }: MedallionRailProps) {
  const sizes = HUD_SIZES[scale]
  const isDesktop = scale === 'desktop'
  const capsuleTop = sizes.newsTop + sizes.newsMedallion + NEWS_PLAQUE_OVERHANG + sizes.capsuleGap
  // Outer width of the right capsule: the buttons, side padding (right is 2px less) and the left border.
  const capsuleWidth = sizes.medallion + sizes.railPadX * 2 - 2 + CAPSULE_BORDER
  const newsRight = (capsuleWidth - sizes.newsMedallion) / 2
  const settingsItem: RailItem = { key: 'settings', label: 'Settings', icon: <GearIcon />, onClick: settings.onClick }

  return (
    <>
      <style>{HUD_CSS}</style>
      <MedallionButton
        item={news}
        scale={scale}
        style={{
          position: 'fixed',
          top: `calc(${sizes.newsTop}px + env(safe-area-inset-top, 0px))`,
          right: `calc(${newsRight}px + env(safe-area-inset-right, 0px))`,
          zIndex: Z.topBar,
        }}
      />
      <nav
        aria-label="Government tools"
        data-testid="tool-rail"
        data-layout={scale}
        style={{
          position: 'fixed', right: 'env(safe-area-inset-right, 0px)', top: `calc(${capsuleTop}px + env(safe-area-inset-top, 0px))`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: `${sizes.railGap}px`,
          padding: `${sizes.railPadX}px ${sizes.railPadX - 2}px ${sizes.railPadX}px ${sizes.railPadX}px`,
          background: '#111111',
          border: '1px solid rgba(120,120,120,0.35)', borderRight: 'none',
          borderRadius: '40px 0 0 40px',
          boxShadow: '-6px 0 20px rgba(0,0,0,0.5)',
          overflow: 'visible',
          zIndex: Z.topBar,
        }}
      >
        {items.map(item => <MedallionButton key={item.key} item={item} scale={scale} />)}
        {!isDesktop && more}
        {!isDesktop && <MedallionButton item={settingsItem} scale={scale} />}
      </nav>
      {isDesktop && (
        <nav
          aria-label="More tools"
          data-testid="tool-rail-left"
          style={{
            position: 'fixed', left: 'env(safe-area-inset-left, 0px)', top: `${LEFT_STACK_TOP}px`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: `${sizes.railGap}px`,
            padding: `${sizes.railPadX}px ${sizes.railPadX}px ${sizes.railPadX}px ${sizes.railPadX - 2}px`,
            background: '#111111',
            border: '1px solid rgba(120,120,120,0.35)', borderLeft: 'none',
            borderRadius: '0 40px 40px 0',
            boxShadow: '6px 0 20px rgba(0,0,0,0.5)',
            overflow: 'visible',
            zIndex: Z.topBar,
          }}
        >
          {leftItems.map(item => <MedallionButton key={item.key} item={item} scale={scale} minor />)}
          {more}
          <MedallionButton item={settingsItem} scale={scale} minor />
        </nav>
      )}
    </>
  )
}
