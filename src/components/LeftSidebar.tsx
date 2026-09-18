import { useState } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import { useNewsStore } from '../stores/newsStore'
import { useDecreeStore } from '../stores/decreeStore'
import StatsPanel from './panels/StatsPanel'

// ─── Chrome tokens (matches RightSidebar) ──────────────────────────────────────

const RING_BG = '#14110d'
const RING_BORDER = '#6b5a34'
const RING_BORDER_LIT = '#c9a84c'
const GOLD_ICON = '#d9c48a'
const UNREAD_GOLD = '#e8c84a'
const INK = '#2a2622'
const SERIF_DISPLAY = "'Playfair Display', serif"
const SERIF_BODY = "'Crimson Text', Georgia, serif"

const BUTTON_SIZE = 52

// The TopBar crest (88px at top 8px) ends at 96px; the cluster starts below it.
const CLUSTER_TOP = '112px'

// ─── Inline line-art icons (stroke only, 24-unit grid) ─────────────────────────

const ICON_PROPS = {
  viewBox: '0 0 24 24',
  width: 24,
  height: 24,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

function NewspaperIcon() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M7 9h4v4H7zM13.5 9.5h4M13.5 12.5h4M7 16h10.5" />
    </svg>
  )
}

function DecreeIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M7 3h10v18l-2.5-1.6L12 21l-2.5-1.6L7 21z" />
      <path d="M10 8h4M10 11.5h4M10 15h2.5" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M4 20V4M4 20h16" />
      <path d="M8 15l3.5-4 3 2.5L19 8" />
    </svg>
  )
}

// ─── Sidebar button (tooltip opens to the right of the icon) ───────────────────

interface SideButtonProps {
  icon: React.ReactNode
  label: string
  active?: boolean
  /** Exact count pill — used where the number itself matters (Decrees). */
  badge?: number
  /** Presence-only gold dot at bottom-right. */
  dot?: boolean
  onClick: () => void
  'data-testid'?: string
}

function SideButton({
  icon,
  label,
  active,
  badge,
  dot,
  onClick,
  'data-testid': testId,
}: SideButtonProps) {
  const [hovered, setHovered] = useState(false)
  const isLit = active || hovered
  const hasBadge = badge !== undefined && badge > 0

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {hovered && (
        <div style={{
          position: 'absolute',
          left: 'calc(100% + 10px)',
          top: '50%',
          transform: 'translateY(-50%)',
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
          zIndex: 200,
          boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
        }}>
          {label}
        </div>
      )}

      <button
        type="button"
        data-testid={testId}
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={label}
        title={label}
        style={{
          width: BUTTON_SIZE,
          height: BUTTON_SIZE,
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
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          position: 'relative',
        }}
      >
        {icon}

        {hasBadge && (
          <div style={{
            position: 'absolute',
            bottom: '-2px',
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
          }}>
            {badge > 99 ? '99+' : badge}
          </div>
        )}

        {dot && !hasBadge && (
          <div style={{
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
          }} />
        )}
      </button>
    </div>
  )
}

// ─── LeftSidebar — News + Decrees + National Statistics ───────────────────────

export default function LeftSidebar() {
  const { setDecreeInboxOpen, decreeInboxOpen } = useSettingsStore()
  const setNewsOpen = useNewsStore(s => s.setOpen)
  const unreadCount = useNewsStore(s => s.articles.length - (s.lastReadIndex + 1))
  const pendingCount = useDecreeStore(s => s.pendingDecrees.length)

  const [statsOpen, setStatsOpen] = useState(false)

  return (
    <>
      {statsOpen && <StatsPanel onClose={() => setStatsOpen(false)} />}

      <div
        data-testid="left-sidebar-cluster"
        style={{
          position: 'fixed',
          left: '12px',
          top: CLUSTER_TOP,
          zIndex: 210,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '10px 0',
          gap: '12px',
          background: 'transparent',
        }}
      >
        {/* Presence dot only: the exact unread count lives in the right rail's News circle */}
        <SideButton
          icon={<NewspaperIcon />}
          label="News Dispatch"
          dot={unreadCount > 0}
          onClick={() => {
            setNewsOpen(true)
          }}
        />

        <SideButton
          icon={<DecreeIcon />}
          label="Decrees"
          active={decreeInboxOpen}
          badge={pendingCount}
          onClick={() => {
            setDecreeInboxOpen(!decreeInboxOpen)
          }}
        />

        <SideButton
          data-testid="stats-button"
          icon={<ChartIcon />}
          label="National Statistics"
          active={statsOpen}
          onClick={() => setStatsOpen(prev => !prev)}
        />
      </div>
    </>
  )
}
