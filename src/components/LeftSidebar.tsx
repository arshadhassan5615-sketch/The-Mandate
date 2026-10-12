import { useState } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import { useDecreeStore } from '../stores/decreeStore'
import { Z } from '../constants/zIndex'
import { HUD_SHORTCUTS } from '../constants/hudShortcuts'
import RailButton from './ui/RailButton'
import { useIsMobile } from '../hooks/useIsMobile'
import { PHONE_GOV_ROW_TOP, PHONE_RAIL_BUTTON } from '../constants/layout'
import StatsPanel from './panels/StatsPanel'
import StatePanel from './panels/StatePanel'

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

function PillarIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M3 9.5L12 4l9 5.5" />
      <path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8" />
      <path d="M3 20.5h18" />
    </svg>
  )
}

// ─── LeftSidebar — Decrees + National Statistics ──────────────────────────────
// News lives in RightSidebar only (its tan circle carries the unread count).

export default function LeftSidebar() {
  const { setDecreeInboxOpen, decreeInboxOpen } = useSettingsStore()
  const pendingCount = useDecreeStore(s => s.pendingDecrees.length)

  const [statsOpen, setStatsOpen] = useState(false)
  const [stateOpen, setStateOpen] = useState(false)
  // Phones: a row under the TopBar crest, so it never sits on page content
  // (pages reserve this space via constants/layout pageInsets).
  const isMobile = useIsMobile()
  const buttonSize = isMobile ? PHONE_RAIL_BUTTON : undefined

  return (
    <>
      {statsOpen && <StatsPanel onClose={() => setStatsOpen(false)} />}
      {stateOpen && <StatePanel onClose={() => setStateOpen(false)} />}

      <nav
        aria-label="Government"
        data-testid="left-sidebar-cluster"
        style={{
          position: 'fixed',
          left: '12px',
          top: isMobile ? `${PHONE_GOV_ROW_TOP}px` : CLUSTER_TOP,
          zIndex: Z.navRail,
          display: 'flex',
          flexDirection: isMobile ? 'row' : 'column',
          alignItems: 'center',
          padding: isMobile ? 0 : '10px 0',
          gap: isMobile ? '10px' : '12px',
          background: 'transparent',
        }}
      >
        <RailButton
          size={buttonSize}
          icon={<DecreeIcon />}
          label="Decrees"
          shortcut={HUD_SHORTCUTS.decrees}
          active={decreeInboxOpen}
          badge={pendingCount}
          badgeNoun="pending"
          onClick={() => setDecreeInboxOpen(!decreeInboxOpen)}
        />

        <RailButton
          size={buttonSize}
          data-testid="stats-button"
          icon={<ChartIcon />}
          label="National Statistics"
          active={statsOpen}
          onClick={() => setStatsOpen(prev => !prev)}
        />

        <RailButton
          size={buttonSize}
          data-testid="state-button"
          icon={<PillarIcon />}
          label="State of the Republic"
          active={stateOpen}
          onClick={() => setStateOpen(prev => !prev)}
        />
      </nav>
    </>
  )
}
