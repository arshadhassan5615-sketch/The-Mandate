import { useState } from 'react'

// Shared round HUD button for the left and right nav rails. The label shows
// on hover AND keyboard focus, with the shortcut key when there is one.

const RING_BG = '#14110d'
const RING_BORDER = '#6b5a34'
const RING_BORDER_LIT = '#c9a84c'
const GOLD_ICON = '#d9c48a'
const CREAM = '#e6dcc3'
const UNREAD_GOLD = '#e8c84a'
const INK = '#2a2622'
const SERIF_DISPLAY = "'Playfair Display', serif"
const SERIF_BODY = "'Crimson Text', Georgia, serif"

export type TooltipSide = 'left' | 'right' | 'top'

const TOOLTIP_POSITION: Record<TooltipSide, React.CSSProperties> = {
  right: { left: 'calc(100% + 10px)', top: '50%', transform: 'translateY(-50%)' },
  left: { right: 'calc(100% + 10px)', top: '50%', transform: 'translateY(-50%)' },
  top: { bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' },
}

interface RailButtonProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  size?: number
  tooltipSide?: TooltipSide
  shortcut?: string
  active?: boolean
  /** Exact count pill, for when the number itself matters. */
  badge?: number
  /** Where the count pill sits; News keeps its historical top-right spot. */
  badgeCorner?: 'top' | 'bottom'
  /** Spoken after the count: 'unread' (default) or e.g. 'entries'. */
  badgeNoun?: string
  /** Presence-only gold dot, shown when there is no badge. */
  dot?: boolean
  'data-testid'?: string
}

export default function RailButton({
  icon,
  label,
  onClick,
  size = 52,
  tooltipSide = 'right',
  shortcut,
  active = false,
  badge,
  badgeCorner = 'bottom',
  badgeNoun = 'unread',
  dot = false,
  'data-testid': testId,
}: RailButtonProps) {
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const isLit = active || hovered || focused
  const hasBadge = badge !== undefined && badge > 0
  const accessibleName = hasBadge ? `${label}, ${badge} ${badgeNoun}` : label

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {(hovered || focused) && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            ...TOOLTIP_POSITION[tooltipSide],
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(10,8,6,0.97)',
            border: '1px solid rgba(181,154,94,0.35)',
            padding: '0.28rem 0.65rem',
            whiteSpace: 'nowrap',
            fontFamily: SERIF_BODY,
            fontSize: '0.7rem',
            letterSpacing: '0.06em',
            color: GOLD_ICON,
            textTransform: 'uppercase',
            pointerEvents: 'none',
            zIndex: 1,
            boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
          }}
        >
          {label}
          {shortcut && (
            <kbd style={{
              fontFamily: SERIF_DISPLAY,
              fontSize: '0.65rem',
              padding: '0 5px',
              border: '1px solid rgba(181,154,94,0.5)',
              borderRadius: '3px',
              color: CREAM,
            }}>
              {shortcut}
            </kbd>
          )}
        </div>
      )}

      <button
        type="button"
        className="rail-button"
        data-testid={testId}
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-label={accessibleName}
        aria-pressed={active || undefined}
        aria-keyshortcuts={shortcut}
        style={{
          width: size,
          height: size,
          padding: 0,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: RING_BG,
          border: `1.5px solid ${isLit ? RING_BORDER_LIT : RING_BORDER}`,
          boxShadow: isLit ? '0 0 14px rgba(201,168,76,0.4)' : '0 2px 8px rgba(0,0,0,0.4)',
          color: GOLD_ICON,
          cursor: 'pointer',
          transition: 'border-color var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)',
          position: 'relative',
        }}
      >
        {icon}

        {hasBadge && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              [badgeCorner]: '-2px',
              right: '-2px',
              minWidth: '18px',
              height: '18px',
              padding: '0 5px',
              borderRadius: '9px',
              background: UNREAD_GOLD,
              border: `1.5px solid ${RING_BG}`,
              color: INK,
              fontFamily: SERIF_DISPLAY,
              fontSize: '10px',
              fontWeight: 700,
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
              pointerEvents: 'none',
            }}
          >
            {badge > 99 ? '99+' : badge}
          </div>
        )}

        {dot && !hasBadge && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              bottom: '-2px',
              right: '-2px',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: UNREAD_GOLD,
              border: `1.5px solid ${RING_BG}`,
              boxSizing: 'border-box',
              pointerEvents: 'none',
            }}
          />
        )}
      </button>
    </div>
  )
}
