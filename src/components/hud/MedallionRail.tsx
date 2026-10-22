// Floating capsule of round gold-rimmed medallion buttons hugging the right edge
// (desktop and landscape). News comes first and is larger, showing its count.
// Phones keep the bottom tool bar instead.
import type { ReactNode } from 'react'
import { Z } from '../../constants/zIndex'
import { GearIcon } from './icons'
import { HUD_CSS, HUD_SIZES, type HudScale, type RailItem } from './hudSizes'

interface MedallionRailProps {
  scale: HudScale
  items: RailItem[]
  more: ReactNode
  settings: { onClick: () => void }
}

const CAPSULE_BG = 'linear-gradient(90deg,#0d0d0d 0%,#030303 100%)'
const CREAM = '#e6dcc3'
const BADGE_RED = '#b5452f'

interface MedallionButtonProps {
  item: RailItem
  scale: HudScale
}

function MedallionButton({ item, scale }: MedallionButtonProps) {
  const sizes = HUD_SIZES[scale]
  const { label, icon, onClick, active, badge = 0, shortcut, big = false, count = 0 } = item
  const size = big ? sizes.newsMedallion : sizes.medallion
  const compact = scale === 'compact'
  return (
    <button
      type="button"
      className="hud-medallion"
      onClick={onClick}
      aria-label={badge > 0 ? `${label}, ${badge} new` : label}
      aria-pressed={active}
      aria-keyshortcuts={shortcut}
      style={{ width: size, height: size, flexShrink: 0 }}
    >
      {big ? (
        <>
          <span style={{
            fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: compact ? '15px' : '20px',
            lineHeight: 1, color: CREAM,
          }}>
            {count}
          </span>
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace", fontSize: '8px', letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'rgba(230,220,195,0.8)',
          }}>
            {label}
          </span>
        </>
      ) : icon}
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

export default function MedallionRail({ scale, items, more, settings }: MedallionRailProps) {
  const sizes = HUD_SIZES[scale]
  return (
    <nav
      aria-label="Government tools"
      data-testid="tool-rail"
      data-layout={scale}
      style={{
        position: 'fixed', right: 'env(safe-area-inset-right, 0px)', top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: `${sizes.railGap}px`,
        padding: `${sizes.railPadX}px ${sizes.railPadX - 2}px ${sizes.railPadX}px ${sizes.railPadX}px`,
        background: CAPSULE_BG,
        border: '1px solid rgba(181,154,94,0.35)', borderRight: 'none',
        borderRadius: '40px 0 0 40px',
        boxShadow: '-6px 0 20px rgba(0,0,0,0.5)',
        overflow: 'visible',
        zIndex: Z.topBar,
      }}
    >
      <style>{HUD_CSS}</style>
      {items.map(item => <MedallionButton key={item.key} item={item} scale={scale} />)}
      {more}
      <MedallionButton
        item={{ key: 'settings', label: 'Settings', icon: <GearIcon />, onClick: settings.onClick }}
        scale={scale}
      />
    </nav>
  )
}
