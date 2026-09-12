import { useState, useEffect } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import { useCodexStore } from '../stores/codexStore'
import { useJournalStore } from '../stores/journalStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import { useLetterStore } from '../stores/letterStore'
import ConnectionsPanel from './panels/ConnectionsPanel'
import OverviewPanel from './panels/OverviewPanel'
import NotepadPanel from './panels/NotepadPanel'
import iconConnections from '../assets/images/ui/icon_nav_connections.png'
import iconOverview from '../assets/images/ui/icon_nav_overview.png'
import iconCodex from '../assets/images/ui/icon_nav_codex.png'
import iconDossiers from '../assets/images/ui/icon_nav_dossiers.png'
import iconJournal from '../assets/images/ui/icon_nav_journal.png'
import iconLetters from '../assets/images/ui/icon_nav_letters.png'
import iconNotepad from '../assets/images/ui/icon_nav_notepad.png'
import iconSettings from '../assets/images/ui/icon_nav_settings.png'

// ─── Sidebar button ────────────────────────────────────────────────────────────

interface SideButtonProps {
  icon: React.ReactNode
  label: string
  active?: boolean
  badge?: number
  onClick: () => void
}

function SideButton({ icon, label, active, badge, onClick }: SideButtonProps) {
  const [hovered, setHovered] = useState(false)

  const isLit = active || hovered

  return (
    <div style={{ position: 'relative' }}>
      {/* Tooltip label */}
      {hovered && (
        <div style={{
          position: 'absolute',
          right: '56px',
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
          border: `1.5px solid ${active ? 'rgba(201,168,76,0.95)' : hovered ? 'rgba(201,168,76,0.85)' : 'rgba(201,168,76,0.75)'}`,
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
        {/* Notification badge */}
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

// ─── RightSidebar ─────────────────────────────────────────────────────────────

export default function RightSidebar() {
  const { setSettingsOpen, setCharacterMapOpen, setJournalOpen, notepadOpen, setNotepadOpen, setInvestmentOpen } = useSettingsStore()
  const journalEntryCount = useJournalStore(s => s.entries.length)
  const letterUnread     = useLetterStore(s => s.unreadCount)
  const openLetterInbox  = useLetterStore(s => s.setOpen)
  const { openCodex }     = useCodexStore()

  const [connectionsOpen, setConnectionsOpen] = useState(false)
  const [overviewOpen, setOverviewOpen] = useState(false)

  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const moleActive = useNarrativeStore(s => s.activeFlags.includes('mole_investigation_active'))
  const moleResolved = useNarrativeStore(s => s.activeFlags.includes('mole_case_resolved'))
  const showMoleBadge = moleActive && !moleResolved

  // Reusable icon style for maximum visibility
  const iconStyle = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    objectFit: 'cover' as const,
    opacity: 1,
    filter: 'brightness(2.2) contrast(1.1) saturate(1.4) drop-shadow(0 0 8px rgba(201,168,76,0.9))',
  }

  const containerStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60px',
        zIndex: 210,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        background: 'linear-gradient(180deg, #1a1510 0%, #12100b 100%)',
        borderTop: '1px solid rgba(201,168,76,0.35)',
        boxShadow: '0 -2px 12px rgba(0,0,0,0.4)',
        padding: '0 4px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }
    : {
        position: 'fixed',
        right: 0,
        top: '60px',
        width: '60px',
        zIndex: 210,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '4px 8px',
        gap: '6px',
        background: 'linear-gradient(180deg, rgba(10,8,6,0.92) 0%, rgba(18,14,10,0.88) 100%)',
        borderLeft: '1px solid rgba(201,168,76,0.15)',
      }

  return (
    <>
      {connectionsOpen && <ConnectionsPanel onClose={() => setConnectionsOpen(false)} />}
      {overviewOpen && <OverviewPanel onClose={() => setOverviewOpen(false)} />}
      {notepadOpen && <NotepadPanel onClose={() => setNotepadOpen(false)} />}

      {/* Registry panel */}
      <div style={containerStyle}>
        {/* Header */}
        {!isMobile && (
          <div style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            fontFamily: "'Special Elite', monospace",
            fontSize: '7px',
            letterSpacing: '0.2em',
            color: 'rgba(201,168,76,0.65)',
            textTransform: 'uppercase',
            marginBottom: '8px',
            flexShrink: 0,
          }}>
            REGISTRY
          </div>
        )}
        {!isMobile && <div style={{ width: '24px', height: '1px', background: 'rgba(200,144,42,0.35)', marginBottom: '6px', flexShrink: 0 }} />}

        {/* CLASSIFIED investigation badge */}
        {showMoleBadge && (
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%',
            background: 'rgba(180,30,20,0.2)',
            border: '1.5px solid rgba(200,80,60,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '0', flexShrink: 0,
            animation: 'event-pulse-urgent 2s ease-in-out infinite',
            cursor: 'default',
          }}
            title="Active Investigation — Classified"
          >
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.4rem', fontWeight: 700,
              color: '#e85a44', letterSpacing: '0.06em',
              textTransform: 'uppercase', textAlign: 'center',
              lineHeight: 1.1,
            }}>
              CLASS
            </span>
          </div>
        )}

        <SideButton
          icon={<img src={iconConnections} alt="Connections" style={iconStyle} />}
          label="Connections"
          active={connectionsOpen}
          onClick={() => {
            setOverviewOpen(false)
            setConnectionsOpen(prev => !prev)
          }}
        />

        <SideButton
          icon={<img src={iconOverview} alt="Overview" style={{ ...iconStyle, width: '52px', height: '52px' }} />}
          label="Overview"
          active={overviewOpen}
          onClick={() => {
            setConnectionsOpen(false)
            setOverviewOpen(prev => !prev)
          }}
        />

        {!isMobile && <div style={{ width: '20px', height: '1px', background: 'rgba(200,144,42,0.25)', margin: '0', flexShrink: 0 }} />}

        {/* INTELLIGENCE group */}
        {!isMobile && <div style={{ fontFamily: "'Special Elite', monospace", fontSize: '6px', letterSpacing: '0.15em', color: 'rgba(201,168,76,0.45)', marginBottom: '0', flexShrink: 0 }}>INTEL</div>}

        <SideButton
          icon={<img src={iconCodex} alt="Codex" style={iconStyle} />}
          label="Codex"
          onClick={() => {
            setConnectionsOpen(false)
            setOverviewOpen(false)
            openCodex()
          }}
        />

        <SideButton
          icon={<img src={iconDossiers} alt="Dossiers" style={iconStyle} />}
          label="Dossiers"
          onClick={() => {
            setConnectionsOpen(false)
            setOverviewOpen(false)
            setCharacterMapOpen(true)
          }}
        />

        {!isMobile && <div style={{ width: '20px', height: '1px', background: 'rgba(200,144,42,0.25)', margin: '0', flexShrink: 0 }} />}

        {/* PERSONAL group */}
        {!isMobile && <div style={{ fontFamily: "'Special Elite', monospace", fontSize: '6px', letterSpacing: '0.15em', color: 'rgba(201,168,76,0.45)', marginBottom: '0', flexShrink: 0 }}>PERSONAL</div>}

        <SideButton
          icon={<img src={iconJournal} alt="Journal" style={iconStyle} />}
          label="Journal"
          badge={journalEntryCount}
          onClick={() => {
            setConnectionsOpen(false)
            setOverviewOpen(false)
            setJournalOpen(true)
          }}
        />

        <SideButton
          icon={<img src={iconLetters} alt="Letters" style={{ ...iconStyle, width: '52px', height: '52px' }} />}
          label="Diplomatic Letters"
          badge={letterUnread > 0 ? letterUnread : undefined}
          onClick={() => {
            setConnectionsOpen(false)
            setOverviewOpen(false)
            openLetterInbox(true)
          }}
        />

        <SideButton
          icon={<img src={iconNotepad} alt="Notepad" style={iconStyle} />}
          label="Notepad"
          active={notepadOpen}
          onClick={() => {
            setConnectionsOpen(false)
            setOverviewOpen(false)
            setNotepadOpen(!notepadOpen)
          }}
        />

        <SideButton
          icon={
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
          label="Discretionary Fund"
          onClick={() => {
            setConnectionsOpen(false)
            setOverviewOpen(false)
            setInvestmentOpen(true)
          }}
        />

        <SideButton
          icon={<img src={iconSettings} alt="Settings" style={iconStyle} />}
          label="Settings"
          onClick={() => {
            setConnectionsOpen(false)
            setOverviewOpen(false)
            setSettingsOpen(true)
          }}
        />

        {!isMobile && <div style={{ width: '24px', height: '1px', background: 'rgba(200,144,42,0.35)', marginTop: '6px', flexShrink: 0 }} />}
      </div>
    </>
  )
}
