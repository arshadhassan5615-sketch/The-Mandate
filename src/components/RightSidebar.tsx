import { useState, useEffect } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import { useCodexStore } from '../stores/codexStore'
import { useJournalStore } from '../stores/journalStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import { useLetterStore } from '../stores/letterStore'
import { useNewsStore } from '../stores/newsStore'
import ConnectionsPanel from './panels/ConnectionsPanel'
import NotepadPanel from './panels/NotepadPanel'

// ─── Chrome tokens ─────────────────────────────────────────────────────────────

const RING_BG = '#14110d'
const RING_BORDER = '#6b5a34'
const RING_BORDER_LIT = '#c9a84c'
const GOLD_ICON = '#d9c48a'
const UNREAD_GOLD = '#e8c84a'
const INK = '#2a2622'
const SERIF_DISPLAY = "'Playfair Display', serif"
const SERIF_BODY = "'Crimson Text', Georgia, serif"

const BUTTON_SIZE = { news: 64, main: 52, utility: 44 } as const
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

// ─── Tooltip ───────────────────────────────────────────────────────────────────

function Tooltip({ label, isMobile }: { label: string; isMobile: boolean }) {
  return (
    <div style={{
      position: 'absolute',
      ...(isMobile
        ? { bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' }
        : { right: 'calc(100% + 10px)', top: '50%', transform: 'translateY(-50%)' }),
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
  )
}

// ─── Sidebar button ────────────────────────────────────────────────────────────

interface SideButtonProps {
  icon: React.ReactNode
  label: string
  size: number
  isMobile: boolean
  active?: boolean
  /** Exact count pill — used where the number itself matters (Journal, Letters). */
  badge?: number
  /** Presence-only gold dot at bottom-right. */
  dot?: boolean
  onClick: () => void
}

function SideButton({ icon, label, size, isMobile, active, badge, dot, onClick }: SideButtonProps) {
  const [hovered, setHovered] = useState(false)
  const isLit = active || hovered
  const hasBadge = badge !== undefined && badge > 0

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {hovered && <Tooltip label={label} isMobile={isMobile} />}

      <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={label}
        title={label}
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

// ─── News button — tan circle with the unread count in it ──────────────────────

interface NewsButtonProps {
  unread: number
  size: number
  isMobile: boolean
  onClick: () => void
}

function NewsButton({ unread, size, isMobile, onClick }: NewsButtonProps) {
  const [hovered, setHovered] = useState(false)
  const isLarge = size >= BUTTON_SIZE.news

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {hovered && <Tooltip label="News Dispatch" isMobile={isMobile} />}

      <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={`News Dispatch, ${unread} unread`}
        title="News Dispatch"
        style={{
          width: size,
          height: size,
          padding: 0,
          borderRadius: '50%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #e6d7b2 0%, #c8b283 100%)',
          border: `1.5px solid ${hovered ? RING_BORDER_LIT : '#8a7440'}`,
          boxShadow: hovered
            ? '0 0 14px rgba(201,168,76,0.4), inset 0 0 6px rgba(0,0,0,0.15)'
            : '0 2px 8px rgba(0,0,0,0.4), inset 0 0 6px rgba(0,0,0,0.15)',
          color: INK,
          cursor: 'pointer',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        }}
      >
        <span style={{
          fontFamily: SERIF_DISPLAY,
          fontSize: isLarge ? '1.4rem' : '1.05rem',
          fontWeight: 700,
          lineHeight: 1,
        }}>
          {unread > 99 ? '99+' : unread}
        </span>
        <span style={{
          fontFamily: SERIF_BODY,
          fontSize: '0.6rem',
          fontWeight: 600,
          letterSpacing: '0.06em',
          lineHeight: 1,
          marginTop: '3px',
        }}>
          News
        </span>
      </button>
    </div>
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
        zIndex: 210,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        background: 'linear-gradient(180deg, #1a1510 0%, #12100b 100%)',
        borderTop: '1px solid rgba(181,154,94,0.35)',
        boxShadow: '0 -2px 12px rgba(0,0,0,0.4)',
        padding: '0 4px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }
    : {
        position: 'fixed',
        right: 0,
        top: '48px',
        width: '76px',
        zIndex: 210,
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

      <div style={containerStyle}>
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
              fontFamily: SERIF_DISPLAY,
              fontSize: '0.45rem', fontWeight: 700,
              color: '#e85a44', letterSpacing: '0.06em',
              textTransform: 'uppercase', textAlign: 'center',
              lineHeight: 1.1,
            }}>
              CLASS
            </span>
          </div>
        )}

        {/* 1. News — unread count in the tan circle */}
        <NewsButton
          unread={Math.max(0, newsUnread)}
          size={sizeNews}
          isMobile={isMobile}
          onClick={() => {
            closeLocalPanels()
            setNewsOpen(true)
          }}
        />

        {/* 2. Assembly / Connections */}
        <SideButton
          icon={<PeopleIcon />}
          label="Assembly"
          size={sizeMain}
          isMobile={isMobile}
          active={connectionsOpen}
          onClick={() => setConnectionsOpen(prev => !prev)}
        />

        {/* 3. Codex (the Character Dossier is reachable from inside it) */}
        <SideButton
          icon={<BookIcon />}
          label="Codex"
          size={sizeMain}
          isMobile={isMobile}
          onClick={() => {
            closeLocalPanels()
            openCodex()
          }}
        />

        {/* 4. Journal — exact entry count */}
        <SideButton
          icon={<QuillIcon />}
          label="Journal"
          size={sizeMain}
          isMobile={isMobile}
          badge={journalEntryCount}
          onClick={() => {
            closeLocalPanels()
            setJournalOpen(true)
          }}
        />

        {/* Notepad stays separate: folding it into JournalView is outside this file */}
        <SideButton
          icon={<NotepadIcon />}
          label="Notepad"
          size={sizeMain}
          isMobile={isMobile}
          active={notepadOpen}
          onClick={() => {
            closeLocalPanels()
            setNotepadOpen(!notepadOpen)
          }}
        />

        {/* 5. Letters — exact unread count */}
        <SideButton
          icon={<EnvelopeIcon />}
          label="Diplomatic Letters"
          size={sizeMain}
          isMobile={isMobile}
          badge={letterUnread > 0 ? letterUnread : undefined}
          onClick={() => {
            closeLocalPanels()
            openLetterInbox(true)
          }}
        />

        {!isMobile && (
          <div style={{ width: '28px', height: '1px', background: 'rgba(181,154,94,0.25)', flexShrink: 0 }} />
        )}

        {/* Discretionary Fund stays separate: this is its only entry point */}
        <SideButton
          icon={<FundIcon />}
          label="Discretionary Fund"
          size={sizeUtility}
          isMobile={isMobile}
          onClick={() => {
            closeLocalPanels()
            setInvestmentOpen(true)
          }}
        />

        {/* 6. Settings */}
        <SideButton
          icon={<GearIcon />}
          label="Settings"
          size={sizeUtility}
          isMobile={isMobile}
          onClick={() => {
            closeLocalPanels()
            setSettingsOpen(true)
          }}
        />
      </div>
    </>
  )
}
