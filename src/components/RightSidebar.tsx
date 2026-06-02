import { useState } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import { useNewsStore } from '../stores/newsStore'
import { useCodexStore } from '../stores/codexStore'
import { useGameStore } from '../stores/gameStore'
import { useJournalStore } from '../stores/journalStore'
import { useLetterStore } from '../stores/letterStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import FactionIndicators from './FactionIndicators'
import ConnectionsPanel from './panels/ConnectionsPanel'
import OverviewPanel from './panels/OverviewPanel'
import NotepadPanel from './panels/NotepadPanel'

// ─── SVG Icon components ───────────────────────────────────────────────────────

function IconNews() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <line x1="7" y1="8" x2="17" y2="8" />
      <line x1="7" y1="12" x2="17" y2="12" />
      <line x1="7" y1="16" x2="13" y2="16" />
    </svg>
  )
}

function IconParliament() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" strokeLinecap="round">
      <rect x="2" y="20" width="20" height="2" rx="0.5" />
      <rect x="2" y="8" width="20" height="2" rx="0.5" />
      <rect x="11" y="3" width="2" height="6" rx="0.5" />
      <rect x="4" y="10" width="2" height="10" rx="0.5" />
      <rect x="8" y="10" width="2" height="10" rx="0.5" />
      <rect x="14" y="10" width="2" height="10" rx="0.5" />
      <rect x="18" y="10" width="2" height="10" rx="0.5" />
    </svg>
  )
}

function IconCodex() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="5" y="2" width="14" height="20" rx="1" />
      <line x1="5" y1="2" x2="5" y2="22" strokeWidth="3" />
      <line x1="9" y1="8" x2="16" y2="8" />
      <line x1="9" y1="12" x2="16" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  )
}

function IconDossiers() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="9" cy="7" r="3" />
      <path d="M3,21 C3,16.5 5.5,14 9,14 C12.5,14 15,16.5 15,21" />
      <circle cx="17" cy="7" r="2.5" />
      <path d="M15,14 C17,14 21,15.5 21,20" />
    </svg>
  )
}

function IconBudget() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
    </svg>
  )
}

function IconNotepad() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="2" width="12" height="20" rx="1.5" />
      <line x1="10" y1="6" x2="14" y2="6" />
      <line x1="10" y1="10" x2="16" y2="10" />
      <line x1="10" y1="14" x2="14" y2="14" />
      <polyline points="18,6 20,7 20,22 4,22 4,7 6,6" />
    </svg>
  )
}

function IconJournal() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="3" width="14" height="18" rx="1.5" />
      <line x1="5" y1="3" x2="5" y2="21" strokeWidth="3" />
      <line x1="10" y1="8" x2="17" y2="8" />
      <line x1="10" y1="12" x2="17" y2="12" />
      <line x1="10" y1="16" x2="14" y2="16" />
    </svg>
  )
}

function IconLetter() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="1" />
      <polyline points="3,5 12,14 21,5" />
      <line x1="12" y1="14" x2="12" y2="19" />
    </svg>
  )
}

function IconSettings() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4,15 A1.65,1.65 0 0 0 19.82,13.4 L21.17,11.4 A1.65,1.65 0 0 0 19.83,8.9 L18.11,8.14 A1.65,1.65 0 0 0 15.9,8.66 L15.06,7.84 A1.65,1.65 0 0 0 12.55,6.52 L12,4.75 A1.65,1.65 0 0 0 9.45,4.75 L8.9,6.52 A1.65,1.65 0 0 0 6.39,7.84 L5.56,8.66 A1.65,1.65 0 0 0 3.35,8.14 L1.63,8.9 A1.65,1.65 0 0 0 0.29,11.4 L1.64,13.4 A1.65,1.65 0 0 0 2.06,15 L1.63,15.6 A1.65,1.65 0 0 0 2.97,18.1 L4.69,18.86 A1.65,1.65 0 0 0 6.9,18.34 L7.73,19.16 A1.65,1.65 0 0 0 10.24,20.48 L10.79,22.25 A1.65,1.65 0 0 0 13.34,22.25 L13.89,20.48 A1.65,1.65 0 0 0 16.4,19.16 L17.23,18.34 A1.65,1.65 0 0 0 19.44,18.86 L21.16,18.1 A1.65,1.65 0 0 0 22.5,15.6 Z" />
    </svg>
  )
}

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
          right: '52px',
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
          width: '44px',
          height: '44px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: active
            ? 'rgba(201,168,76,0.15)'
            : hovered ? 'rgba(201,168,76,0.12)' : 'rgba(20,18,12,0.85)',
          border: `1.5px solid ${active ? 'rgba(201,168,76,0.9)' : hovered ? 'rgba(201,168,76,0.8)' : 'rgba(201,168,76,0.5)'}`,
          color: isLit ? '#c9a84c' : 'rgba(201,168,76,0.9)',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          position: 'relative',
          boxShadow: isLit
            ? '0 0 12px rgba(201,168,76,0.3), inset 0 0 8px rgba(201,168,76,0.1)'
            : hovered ? '0 0 8px rgba(200,144,42,0.2)' : 'none',
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

// ─── Parliament floating panel ─────────────────────────────────────────────────

function ParliamentPanel({ onClose }: { onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed',
      right: '48px',
      top: '80px',
      width: '200px',
      background: 'rgba(12,10,8,0.97)',
      border: '1px solid var(--border)',
      borderRight: 'none',
      zIndex: 210,
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '-4px 4px 24px rgba(0,0,0,0.6)',
      maxHeight: 'calc(100vh - 60px)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.7rem 0.85rem 0.5rem',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.5rem',
          letterSpacing: '0.18em',
          color: 'var(--amber-dim)',
          textTransform: 'uppercase',
        }}>
          Parliament · Factions
        </span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.9rem', lineHeight: 1, padding: 0 }}
        >
          ×
        </button>
      </div>
      {/* Faction indicators */}
      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'var(--amber-dim) transparent' }}>
        <FactionIndicators />
      </div>
    </div>
  )
}

// ─── RightSidebar ─────────────────────────────────────────────────────────────

export default function RightSidebar() {
  const { setSettingsOpen, setCharacterMapOpen, setJournalOpen, setLetterOpen, notepadOpen, setNotepadOpen } = useSettingsStore()
  const setNewsOpen       = useNewsStore(s => s.setOpen)
  const unreadCount       = useNewsStore(s => s.articles.length - (s.lastReadIndex + 1))
  const journalEntryCount = useJournalStore(s => s.entries.length)
  const letterUnread     = useLetterStore(s => s.unreadCount)
  const openLetters      = useLetterStore(s => s.setOpen)
  const { openCodex }     = useCodexStore()

  const [connectionsOpen, setConnectionsOpen] = useState(false)
  const [overviewOpen,    setOverviewOpen]    = useState(false)
  const moleActive = useNarrativeStore(s => s.activeFlags.includes('mole_investigation_active'))
  const moleResolved = useNarrativeStore(s => s.activeFlags.includes('mole_case_resolved'))
  const showMoleBadge = moleActive && !moleResolved

  return (
    <>
      {connectionsOpen && <ConnectionsPanel onClose={() => setConnectionsOpen(false)} />}
      {overviewOpen && <OverviewPanel onClose={() => setOverviewOpen(false)} />}
      {notepadOpen && <NotepadPanel onClose={() => setNotepadOpen(false)} />}

      {/* Vertical icon strip */}
      <div style={{
        position: 'fixed',
        right: 0,
        top: '80px',
        bottom: 0,
        width: '52px',
        zIndex: 210,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'transparent',
        padding: '8px 6px',
        gap: '4px',
      }}>
        {/* Decorative top rule */}
        <div style={{ width: '24px', height: '1px', background: 'rgba(200,144,42,0.2)', marginBottom: '6px', flexShrink: 0 }} />

        {/* CLASSIFIED investigation badge */}
        {showMoleBadge && (
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: 'rgba(180,30,20,0.15)',
            border: '1.5px solid rgba(200,80,60,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '4px', flexShrink: 0,
            animation: 'event-pulse-urgent 2s ease-in-out infinite',
            cursor: 'default',
          }}
            title="Active Investigation — Classified"
          >
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.38rem', fontWeight: 700,
              color: '#c8503c', letterSpacing: '0.06em',
              textTransform: 'uppercase', textAlign: 'center',
              lineHeight: 1.1,
            }}>
              CLASS
            </span>
          </div>
        )}

        <SideButton
          icon={<IconNews />}
          label="News Dispatch"
          badge={unreadCount}
          onClick={() => {
            setConnectionsOpen(false)
            setOverviewOpen(false)
            setNewsOpen(true)
          }}
        />

        <SideButton
          icon={<IconParliament />}
          label="Connections"
          active={connectionsOpen}
          onClick={() => {
            setOverviewOpen(false)
            setConnectionsOpen(prev => !prev)
          }}
        />

        <SideButton
          icon={<IconCodex />}
          label="Codex"
          onClick={() => {
            setConnectionsOpen(false)
            setOverviewOpen(false)
            openCodex()
          }}
        />

        <SideButton
          icon={<IconDossiers />}
          label="Dossiers"
          onClick={() => {
            setConnectionsOpen(false)
            setOverviewOpen(false)
            setCharacterMapOpen(true)
          }}
        />

        <SideButton
          icon={<IconBudget />}
          label="Overview"
          active={overviewOpen}
          onClick={() => {
            setConnectionsOpen(false)
            setOverviewOpen(prev => !prev)
          }}
        />

        {/* Journal, Letters, Notepad, Settings — same styling as top group */}
        <SideButton
          icon={<IconJournal />}
          label="Journal"
          badge={journalEntryCount}
          onClick={() => {
            setConnectionsOpen(false)
            setOverviewOpen(false)
            setJournalOpen(true)
          }}
        />

        <SideButton
          icon={<IconLetter />}
          label="Diplomatic Letters"
          badge={letterUnread > 0 ? letterUnread : undefined}
          onClick={() => {
            setConnectionsOpen(false)
            setOverviewOpen(false)
            openLetters(true)
          }}
        />

        <SideButton
          icon={<IconNotepad />}
          label="Notepad"
          active={notepadOpen}
          onClick={() => {
            setConnectionsOpen(false)
            setOverviewOpen(false)
            setNotepadOpen(!notepadOpen)
          }}
        />

        <SideButton
          icon={<IconSettings />}
          label="Settings"
          onClick={() => {
            setConnectionsOpen(false)
            setOverviewOpen(false)
            setSettingsOpen(true)
          }}
        />

        {/* Decorative bottom rule */}
        <div style={{ width: '24px', height: '1px', background: 'rgba(200,144,42,0.2)', marginTop: '6px', flexShrink: 0 }} />
      </div>
    </>
  )
}
