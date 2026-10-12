import { useState } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import { useCodexStore } from '../stores/codexStore'
import { useJournalStore } from '../stores/journalStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import { useLetterStore } from '../stores/letterStore'
import { useNewsStore } from '../stores/newsStore'
import { useIsMobile } from '../hooks/useIsMobile'
import { Z } from '../constants/zIndex'
import { HUD_SHORTCUTS } from '../constants/hudShortcuts'
import RailButton, { type TooltipSide } from './ui/RailButton'
import ConnectionsPanel from './panels/ConnectionsPanel'
import NotepadPanel from './panels/NotepadPanel'

// ─── Sizes ───────────────────────────────────────────────────────────────────

const BUTTON_SIZE = { news: 52, main: 52, utility: 44 } as const
const MOBILE_SCALE = 0.75

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

function PeopleIcon() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <circle cx="17" cy="9" r="2.6" />
      <path d="M15.5 14.2c2.7 0 5 1.8 5 4.8" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
      <path d="M4 20.5V5.5M20 18v3H6.5" />
      <path d="M8 7h8M8 10.5h8" />
    </svg>
  )
}

function QuillIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M20 4c-6 0-11 4-13 10l-3 6 6-3c6-2 10-7 10-13z" />
      <path d="M6 18l8-8" />
    </svg>
  )
}

function NotepadIcon() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="5" y="4" width="14" height="17" rx="1.5" />
      <path d="M9 2.5v3M15 2.5v3M8.5 10h7M8.5 13.5h7M8.5 17h4" />
    </svg>
  )
}

function EnvelopeIcon() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="3" y="5.5" width="18" height="13" rx="1.5" />
      <path d="M3.5 7l8.5 6 8.5-6" />
    </svg>
  )
}

function FundIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" />
    </svg>
  )
}

// News glyph scales with its button (24px in 52px, like the other icons).
function NewspaperIcon({ size }: { size: number }) {
  return (
    <svg {...ICON_PROPS} width={size} height={size}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
      <path d="M7 8h5v4.5H7z" />
      <path d="M14.5 8.5h3M14.5 11h3M7 15.5h10.5" />
    </svg>
  )
}

// ─── RightSidebar ─────────────────────────────────────────────────────────────

export default function RightSidebar() {
  const { setSettingsOpen, setJournalOpen, notepadOpen, setNotepadOpen, setInvestmentOpen } = useSettingsStore()
  const journalEntryCount = useJournalStore(s => s.entries.length)
  const letterUnread     = useLetterStore(s => s.unreadCount)
  const openLetterInbox  = useLetterStore(s => s.setOpen)
  const { openCodex }     = useCodexStore()
  const setNewsOpen      = useNewsStore(s => s.setOpen)
  const newsUnread       = useNewsStore(s => s.articles.length - (s.lastReadIndex + 1))

  const [connectionsOpen, setConnectionsOpen] = useState(false)

  const isMobile = useIsMobile()
  const tooltipSide: TooltipSide = isMobile ? 'top' : 'left'

  const moleActive = useNarrativeStore(s => s.activeFlags.includes('mole_investigation_active'))
  const moleResolved = useNarrativeStore(s => s.activeFlags.includes('mole_case_resolved'))
  const showMoleBadge = moleActive && !moleResolved

  const scale = isMobile ? MOBILE_SCALE : 1
  const sizeNews = Math.round(BUTTON_SIZE.news * scale)
  const sizeMain = Math.round(BUTTON_SIZE.main * scale)
  const sizeUtility = Math.round(BUTTON_SIZE.utility * scale)

  const closeLocalPanels = () => setConnectionsOpen(false)

  const containerStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60px',
        zIndex: Z.navRail,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        background: 'linear-gradient(180deg, #1a1510 0%, #12100b 100%)',
        borderTop: '1px solid rgba(181,154,94,0.35)',
        boxShadow: '0 -2px 12px rgba(0,0,0,0.4)',
        padding: '0 4px',
        // No overflow scrolling: it clipped the tooltips drawn above the bar.
        // The buttons fit at 320px+; wrap rather than scroll if one is added.
        flexWrap: 'wrap',
      }
    : {
        position: 'fixed',
        right: 0,
        top: '48px',
        width: '76px',
        zIndex: Z.navRail,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '14px',
        paddingTop: '16px',
        paddingBottom: '16px',
        background: 'linear-gradient(180deg, rgba(10,8,6,0.92), rgba(18,14,10,0.88))',
        borderLeft: '1px solid rgba(181,154,94,0.15)',
      }

  return (
    <>
      {connectionsOpen && <ConnectionsPanel onClose={() => setConnectionsOpen(false)} />}
      {notepadOpen && <NotepadPanel onClose={() => setNotepadOpen(false)} />}

      <nav aria-label="Dossiers" style={containerStyle}>
        {/* CLASSIFIED investigation badge */}
        {showMoleBadge && (
          <div style={{
            width: sizeUtility, height: sizeUtility, borderRadius: '50%',
            background: 'rgba(180,30,20,0.2)',
            border: '1.5px solid rgba(200,80,60,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            animation: 'event-pulse-urgent 2s ease-in-out infinite',
            cursor: 'default',
          }}
            title="Active Investigation — Classified"
          >
            <span style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '0.45rem', fontWeight: 700,
              color: '#e85a44', letterSpacing: '0.06em',
              textTransform: 'uppercase', textAlign: 'center',
              lineHeight: 1.1,
            }}>
              CLASS
            </span>
          </div>
        )}

        {/* 1. News — unread count on the top-right */}
        <RailButton
          icon={<NewspaperIcon size={Math.round(sizeNews * 0.46)} />}
          label="News Dispatch"
          shortcut={HUD_SHORTCUTS.news}
          size={sizeNews}
          tooltipSide={tooltipSide}
          badge={Math.max(0, newsUnread)}
          badgeCorner="top"
          onClick={() => {
            closeLocalPanels()
            setNewsOpen(true)
          }}
        />

        {/* 2. Assembly / Connections */}
        <RailButton
          icon={<PeopleIcon />}
          label="Assembly"
          size={sizeMain}
          tooltipSide={tooltipSide}
          active={connectionsOpen}
          onClick={() => setConnectionsOpen(prev => !prev)}
        />

        {/* 3. Codex (the Character Dossier is reachable from inside it) */}
        <RailButton
          icon={<BookIcon />}
          label="Codex"
          shortcut={HUD_SHORTCUTS.codex}
          size={sizeMain}
          tooltipSide={tooltipSide}
          onClick={() => {
            closeLocalPanels()
            openCodex()
          }}
        />

        {/* 4. Journal — exact entry count */}
        <RailButton
          icon={<QuillIcon />}
          label="Journal"
          shortcut={HUD_SHORTCUTS.journal}
          size={sizeMain}
          tooltipSide={tooltipSide}
          badge={journalEntryCount}
          badgeNoun="entries"
          onClick={() => {
            closeLocalPanels()
            setJournalOpen(true)
          }}
        />

        {/* Notepad stays separate: folding it into JournalView is outside this file */}
        <RailButton
          icon={<NotepadIcon />}
          label="Notepad"
          shortcut={HUD_SHORTCUTS.notepad}
          size={sizeMain}
          tooltipSide={tooltipSide}
          active={notepadOpen}
          onClick={() => {
            closeLocalPanels()
            setNotepadOpen(!notepadOpen)
          }}
        />

        {/* 5. Letters — exact unread count */}
        <RailButton
          icon={<EnvelopeIcon />}
          label="Diplomatic Letters"
          shortcut={HUD_SHORTCUTS.letters}
          size={sizeMain}
          tooltipSide={tooltipSide}
          badge={letterUnread}
          onClick={() => {
            closeLocalPanels()
            openLetterInbox(true)
          }}
        />

        {!isMobile && (
          <div style={{ width: '28px', height: '1px', background: 'rgba(181,154,94,0.25)', flexShrink: 0 }} />
        )}

        {/* Discretionary Fund stays separate: this is its only entry point */}
        <RailButton
          icon={<FundIcon />}
          label="Discretionary Fund"
          size={sizeUtility}
          tooltipSide={tooltipSide}
          onClick={() => {
            closeLocalPanels()
            setInvestmentOpen(true)
          }}
        />

        {/* 6. Settings */}
        <RailButton
          icon={<GearIcon />}
          label="Settings"
          size={sizeUtility}
          tooltipSide={tooltipSide}
          onClick={() => {
            closeLocalPanels()
            setSettingsOpen(true)
          }}
        />
      </nav>
    </>
  )
}
