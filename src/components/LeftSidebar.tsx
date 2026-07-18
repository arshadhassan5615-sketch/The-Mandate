import { useState } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import { useNewsStore } from '../stores/newsStore'
import { useDecreeStore } from '../stores/decreeStore'
import StatsPanel from './panels/StatsPanel'
import iconNews from '../assets/images/ui/icon_nav_news.png'
import iconDecree from '../assets/images/ui/icon_nav_decrees.png'
// PLACEHOLDER: no dedicated stats/line-graph icon on disk yet.
// Swap to real asset when generated.
import iconEconomy from '../assets/images/ui/icon_economy.png'
const iconStats = iconEconomy

// ─── Sidebar button (mirrored tooltip: opens to the right of the icon) ─────────

interface SideButtonProps {
  icon: React.ReactNode
  label: string
  active?: boolean
  badge?: number
  onClick: () => void
  'data-testid'?: string
}

function SideButton({
  icon,
  label,
  active,
  badge,
  onClick,
  'data-testid': testId,
}: SideButtonProps) {
  const [hovered, setHovered] = useState(false)

  const isLit = active || hovered

  return (
    <div style={{ position: 'relative' }}>
      {hovered && (
        <div style={{
          position: 'absolute',
          left: '56px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'rgba(10,8,6,0.97)',
          border: '1px solid rgba(200,144,42,0.35)',
          padding: '0.28rem 0.65rem',
          whiteSpace: 'nowrap',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.56rem',
          letterSpacing: '0.12em',
          color: 'var(--amber)',
          textTransform: 'uppercase',
          pointerEvents: 'none',
          zIndex: 200,
          boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
        }}>
          {label}
        </div>
      )}

      <button
        data-testid={testId}
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: active
            ? 'linear-gradient(rgba(201,168,76,0.28), rgba(201,168,76,0.28)), rgba(15,12,8,0.85)'
            : hovered
            ? 'linear-gradient(rgba(201,168,76,0.18), rgba(201,168,76,0.18)), rgba(15,12,8,0.85)'
            : 'rgba(15,12,8,0.85)',
          border: `1.5px solid ${active ? 'rgba(201,168,76,0.95)' : hovered ? 'rgba(201,168,76,0.85)' : 'rgba(201,168,76,0.6)'}`,
          color: isLit ? '#c9a84c' : 'rgba(201,168,76,0.9)',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          position: 'relative',
          boxShadow: isLit
            ? '0 0 18px rgba(201,168,76,0.5), inset 0 0 10px rgba(201,168,76,0.15)'
            : hovered ? '0 0 14px rgba(200,144,42,0.4)' : '0 2px 6px rgba(0,0,0,0.4)',
          opacity: 1,
          fontWeight: 700,
        }}
        title={label}
      >
        {icon}
        {badge !== undefined && badge > 0 && (
          <div style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            background: '#c0392b',
            color: 'white',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '10px',
            fontWeight: 'bold',
            minWidth: '16px',
            height: '16px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            lineHeight: 1,
            pointerEvents: 'none',
            boxShadow: '0 1px 3px rgba(0,0,0,0.5)',
          }}>
            {badge > 99 ? '99+' : badge}
          </div>
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

  const iconStyle = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    objectFit: 'cover' as const,
    opacity: 1,
    filter: 'brightness(1.9) contrast(1.35) drop-shadow(0 0 10px rgba(201,168,76,0.8))',
  }

  return (
    <>
      {statsOpen && <StatsPanel onClose={() => setStatsOpen(false)} />}

      <div
        data-testid="left-sidebar-cluster"
        style={{
          position: 'fixed',
          left: '12px',
          top: '60px',
          zIndex: 210,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '10px 0',
          gap: '8px',
          background: 'transparent',
        }}
      >
        <SideButton
          icon={<img src={iconNews} alt="News" style={iconStyle} />}
          label="News Dispatch"
          badge={unreadCount}
          onClick={() => {
            setNewsOpen(true)
          }}
        />

        <SideButton
          icon={<img src={iconDecree} alt="Decrees" style={iconStyle} />}
          label="Decrees"
          badge={pendingCount}
          onClick={() => {
            setDecreeInboxOpen(!decreeInboxOpen)
          }}
        />

        <SideButton
          data-testid="stats-button"
          icon={<img src={iconStats} alt="Statistics" style={iconStyle} />}
          label="National Statistics"
          active={statsOpen}
          onClick={() => setStatsOpen(prev => !prev)}
        />
      </div>
    </>
  )
}
