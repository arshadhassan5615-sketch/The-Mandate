// Command bar. Desktop and landscape use the Suzerain-style HUD: a framed flag
// top-left, a stat tab beside it, and a medallion capsule on the right edge. Portrait phones keep a compact top bar with the tools on a
// bar along the bottom.
import { useMemo, useState, useEffect, useRef } from 'react'
import { useGameStore } from '../stores/gameStore'
import { useNewsStore } from '../stores/newsStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useCodexStore, ALL_CODEX_ENTRIES } from '../stores/codexStore'
import { unreadBriefCount } from './briefs/briefAccess'
import { useDecreeStore } from '../stores/decreeStore'
import { useLetterStore } from '../stores/letterStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import { useWeekStore } from '../stores/weekStore'
import { useViewportMode } from '../hooks/useViewportMode'
import { Z } from '../constants/zIndex'
import { HUD_SHORTCUTS } from '../constants/hudShortcuts'
import { PHONE_TOP_BAR, PHONE_BOTTOM_BAR } from '../constants/layout'
import type { BudgetAllocations } from '../types/gameState'
import OverviewPanel from './panels/OverviewPanel'
import StatsPanel from './panels/StatsPanel'
import StatePanel from './panels/StatePanel'
import CommitmentsPanel from './panels/CommitmentsPanel'
import CalendarPanel from './panels/CalendarPanel'
import ScenePathsPanel from './panels/ScenePathsPanel'
import ConnectionsPanel from './panels/ConnectionsPanel'
import NotepadPanel from './panels/NotepadPanel'
import veltriaSeal from '../assets/images/veltria_seal.png'
import {
  MapIcon, NewsIcon, BriefsIcon, DecreeIcon, StateIcon, JournalIcon, LetterIcon, NotesIcon, MoreIcon,
} from './hud/icons'
import { HUD_SIZES, weekToDate, type HudScale, type RailItem } from './hud/hudSizes'
import HudCrest from './hud/HudCrest'
import StatTab from './hud/StatTab'
import MedallionRail from './hud/MedallionRail'

function computeBudgetBalance(budget: BudgetAllocations): number {
  const revenue = budget.taxRevenue + budget.stateIndustry + budget.customsTariffs + budget.foreignAid
  const expenditure = budget.military + budget.debtService + budget.govtAdmin + budget.infrastructure + budget.education + budget.healthcare + budget.welfare + budget.bniSecurity
  return revenue - expenditure
}

// ─── Tokens ───────────────────────────────────────────────────────────────────

const BAR_BG = 'linear-gradient(180deg, #14110d 0%, #0d0b08 100%)'
const BAR_EDGE = '1px solid rgba(181,154,94,0.35)'
const CREAM = '#e6dcc3'
const BRASS = 'var(--brass)'
const DELTA_UP = '#2e9e4f'
const DELTA_DOWN = '#c94a3a'
const DELTA_VISIBLE_MS = 2000
const SEAL_FILTER = 'brightness(0) invert(1) sepia(0.3) saturate(3) hue-rotate(10deg)'
type FlashState = 'positive' | 'negative' | null

function formatDelta(delta: number): string {
  const rounded = Math.round(delta)
  return rounded > 0 ? `+${rounded.toLocaleString()}` : rounded.toLocaleString()
}

/** Flash a stat and show its signed change for a moment whenever it moves. */
function useChangeFlash(value: number): { flash: FlashState; delta: number } {
  const [flash, setFlash] = useState<FlashState>(null)
  const [delta, setDelta] = useState(0)
  const prev = useRef(value)
  useEffect(() => {
    if (value === prev.current) return
    const change = value - prev.current
    prev.current = value
    setDelta(change)
    setFlash(change > 0 ? 'positive' : 'negative')
    const t = setTimeout(() => setFlash(null), DELTA_VISIBLE_MS)
    return () => clearTimeout(t)
  }, [value])
  return { flash, delta }
}

// ─── Pieces ───────────────────────────────────────────────────────────────────

function Stat({ label, value, valueColor = CREAM, flash = null, delta = 0 }: {
  label: string
  value: string
  valueColor?: string
  flash?: FlashState
  delta?: number
}) {
  return (
    <div data-testid={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`} style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
      <span style={{ fontFamily: 'var(--font-ui)', fontSize: '9px', letterSpacing: '0.16em', textTransform: 'uppercase', color: BRASS, lineHeight: 1 }}>
        {label}
      </span>
      <span style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
        <span style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '15px',
          fontWeight: 700,
          color: valueColor,
          lineHeight: 1,
          animation: flash ? `stat-flash-${flash} 0.6s ease-out` : undefined,
        }}>
          {value}
        </span>
        {flash !== null && delta !== 0 && (
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '11px', fontWeight: 700, color: delta > 0 ? DELTA_UP : DELTA_DOWN }}>
            {formatDelta(delta)}
          </span>
        )}
      </span>
    </div>
  )
}

const Divider = () => <span aria-hidden style={{ width: 1, alignSelf: 'stretch', margin: '10px 0', background: 'rgba(181,154,94,0.25)' }} />

interface ToolProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
  badge?: number
  shortcut?: string
}

/** A tool on the portrait-phone bottom bar. */
function ToolButton({ icon, label, onClick, active = false, badge = 0, shortcut }: ToolProps) {
  const [hovered, setHovered] = useState(false)
  const lit = active || hovered
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={badge > 0 ? `${label}, ${badge} new` : label}
      aria-pressed={active}
      aria-keyshortcuts={shortcut}
      title={shortcut ? `${label} (${shortcut})` : label}
      className="command-bar__tool"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '3px',
        minWidth: 0,
        flex: '1 1 0',
        height: '100%',
        padding: '0 2px',
        background: lit ? 'rgba(201,168,76,0.08)' : 'transparent',
        border: 'none',
        borderBottom: `2px solid ${active ? '#c9a84c' : 'transparent'}`,
        color: lit ? '#e8d5a3' : '#b59a5e',
        cursor: 'pointer',
        transition: 'background 0.15s ease, color 0.15s ease',
      }}
    >
      {icon}
      <span style={{ fontFamily: 'var(--font-ui)', fontSize: '8px', letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      {badge > 0 && (
        <span aria-hidden style={{
          position: 'absolute', top: 4, right: '18%',
          minWidth: 16, height: 16, padding: '0 4px', borderRadius: 8,
          background: '#b5452f', color: '#fff', fontSize: '10px', fontWeight: 700, lineHeight: '16px', textAlign: 'center',
        }}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  )
}

interface MoreItem { label: string; onClick: () => void }

interface MoreMenuProps {
  items: MoreItem[]
  /** Phone: the menu opens upward from the bottom bar. Desktop: it opens left of the medallion. */
  placement: 'up' | 'left'
  /** Desktop and landscape: the trigger is a medallion of this size. */
  medallionSize?: number
}

function MoreMenu({ items, placement, medallionSize }: MoreMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', close)
    window.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', close); window.removeEventListener('keydown', esc) }
  }, [open])
  const toggleOpen = () => setOpen(o => !o)
  const menuPosition = placement === 'left'
    ? { right: 'calc(100% + 6px)', top: 0, maxHeight: '80vh', overflowY: 'auto' as const }
    : { right: 0, bottom: '100%' }
  return (
    <div ref={ref} style={{
      position: 'relative', display: 'flex',
      ...(medallionSize === undefined ? { height: '100%', flex: '1 1 0' } : {}),
    }}>
      {medallionSize === undefined ? (
        <ToolButton icon={<MoreIcon />} label="More" onClick={toggleOpen} active={open} />
      ) : (
        <button
          type="button"
          className="hud-medallion"
          aria-label="More"
          aria-pressed={open}
          onClick={toggleOpen}
          style={{ width: medallionSize, height: medallionSize, flexShrink: 0 }}
        >
          <MoreIcon />
          <span className="hud-tip" aria-hidden="true">More</span>
        </button>
      )}
      {open && (
        <div role="menu" style={{
          position: 'absolute', ...menuPosition,
          minWidth: 200, background: '#14110d', border: BAR_EDGE, boxShadow: '0 10px 30px rgba(0,0,0,0.6)', padding: '6px 0',
        }}>
          {items.map(item => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => { setOpen(false); item.onClick() }}
              className="command-bar__menu-item"
              style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '9px 16px', background: 'transparent', border: 'none',
                color: '#e8d5a3', fontFamily: 'var(--font-ui)', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function toRailItem(tool: ToolProps): RailItem {
  return {
    key: tool.label,
    label: tool.label,
    icon: tool.icon,
    onClick: tool.onClick,
    active: tool.active,
    badge: tool.badge,
    shortcut: tool.shortcut,
  }
}

// ─── Command bar ──────────────────────────────────────────────────────────────

interface TopBarProps {
  onSave?: () => void
  onMainMenu?: () => void
}

export default function TopBar({ onSave, onMainMenu }: TopBarProps = {}) {
  const budget = useGameStore(s => s.budget)
  const personalWealth = useGameStore(s => s.personal.personalWealth)
  const publicImage = useGameStore(s => s.personal.publicImage)
  const currentWeek = useGameStore(s => s.currentWeek)
  const newsOpen = useNewsStore(s => s.isOpen)
  const setNewsOpen = useNewsStore(s => s.setOpen)
  const newsUnread = useNewsStore(s => Math.max(0, s.articles.length - (s.lastReadIndex + 1)))
  const {
    mapOpen, setMapOpen, decreeInboxOpen, setDecreeInboxOpen, setJournalOpen,
    notepadOpen, setNotepadOpen, setInvestmentOpen, setSettingsOpen,
  } = useSettingsStore()
  const openCodex = useCodexStore(s => s.openCodex)
  const seenBriefs = useCodexStore(s => s.seenEntryIds)
  const narrativeFlags = useNarrativeStore(s => s.activeFlags)
  const unlockedBriefs = useNarrativeStore(s => s.unlockedCodexIds)
  const briefsUnread = useMemo(
    () => unreadBriefCount(ALL_CODEX_ENTRIES, narrativeFlags, unlockedBriefs, seenBriefs),
    [narrativeFlags, unlockedBriefs, seenBriefs],
  )
  const pendingDecrees = useDecreeStore(s => s.pendingDecrees.length)
  const letterUnread = useLetterStore(s => s.unreadCount)
  const openLetters = useLetterStore(s => s.setOpen)
  const investigation = useNarrativeStore(s =>
    s.activeFlags.includes('mole_investigation_active') && !s.activeFlags.includes('mole_case_resolved'))
  const mode = useViewportMode()
  const isMobile = mode === 'phone'
  const isCompact = mode === 'compact'
  const phase = useWeekStore(s => s.phase)
  // In a conversation the compact stat tab would peek out from behind the
  // dialogue column's speaker medallions, so it is dropped (the rail stays).
  const showStatTab = !(isCompact && phase === 'scene')

  const [panel, setPanel] = useState<'state' | 'commitments' | 'stats' | 'overview' | 'assembly' | 'calendar' | 'paths' | null>(null)
  const toggle = (p: NonNullable<typeof panel>) => setPanel(cur => (cur === p ? null : p))

  const balance = useMemo(() => computeBudgetBalance(budget), [budget])
  const treasury = useChangeFlash(balance)
  const approval = useChangeFlash(publicImage)

  // Hide while the newspaper is open so the paper reads full-screen
  if (newsOpen) return null

  const hudScale: HudScale = isCompact ? 'compact' : 'desktop'

  const mapTool: ToolProps = { icon: <MapIcon />, label: 'Map', shortcut: HUD_SHORTCUTS.map, active: mapOpen, onClick: () => setMapOpen(!mapOpen) }
  const newsTool: ToolProps = { icon: <NewsIcon />, label: 'News', shortcut: HUD_SHORTCUTS.news, badge: newsUnread, onClick: () => setNewsOpen(true) }
  const briefsTool: ToolProps = { icon: <BriefsIcon />, label: 'Briefs', shortcut: HUD_SHORTCUTS.codex, badge: briefsUnread, onClick: () => openCodex() }
  const decreesTool: ToolProps = { icon: <DecreeIcon />, label: 'Decrees', shortcut: HUD_SHORTCUTS.decrees, badge: pendingDecrees, active: decreeInboxOpen, onClick: () => setDecreeInboxOpen(!decreeInboxOpen) }
  const stateTool: ToolProps = { icon: <StateIcon />, label: 'State', active: panel === 'state', onClick: () => toggle('state') }
  const journalTool: ToolProps = { icon: <JournalIcon />, label: 'Journal', shortcut: HUD_SHORTCUTS.journal, onClick: () => setJournalOpen(true) }
  const lettersTool: ToolProps = { icon: <LetterIcon />, label: 'Letters', shortcut: HUD_SHORTCUTS.letters, badge: letterUnread, onClick: () => openLetters(true) }
  const notesTool: ToolProps = { icon: <NotesIcon />, label: 'Notes', shortcut: HUD_SHORTCUTS.notepad, active: notepadOpen, onClick: () => setNotepadOpen(!notepadOpen) }

  const phoneTools: ToolProps[] = [mapTool, newsTool, briefsTool, decreesTool, stateTool, journalTool, lettersTool]

  // The medallion capsule. News is first and larger, showing its unread count.
  // On desktop and landscape the map lives first in More, not in the capsule.
  const railItems: RailItem[] = [
    { key: 'news', label: 'News', icon: newsTool.icon, onClick: newsTool.onClick, shortcut: newsTool.shortcut, big: true, count: newsUnread },
    toRailItem(briefsTool),
    toRailItem(decreesTool),
    toRailItem(stateTool),
    toRailItem(lettersTool),
    ...(isCompact ? [] : [toRailItem(journalTool), toRailItem(notesTool)]),
  ]

  const moreItems: MoreItem[] = [
    ...(isMobile ? [] : [{ label: 'Map', onClick: () => setMapOpen(!mapOpen) }]),
    ...(isCompact ? [
      { label: 'Journal', onClick: () => setJournalOpen(true) },
      { label: 'Notes', onClick: () => setNotepadOpen(!notepadOpen) },
    ] : []),
    ...(isMobile ? [{ label: 'Notes', onClick: () => setNotepadOpen(!notepadOpen) }] : []),
    { label: 'Assembly', onClick: () => toggle('assembly') },
    { label: 'National Statistics', onClick: () => toggle('stats') },
    { label: 'Commitments', onClick: () => toggle('commitments') },
    { label: 'Calendar', onClick: () => toggle('calendar') },
    { label: 'Scene Paths', onClick: () => toggle('paths') },
    { label: 'Nation Overview', onClick: () => toggle('overview') },
    { label: 'Discretionary Fund', onClick: () => setInvestmentOpen(true) },
    ...(isMobile ? [{ label: 'Settings', onClick: () => setSettingsOpen(true) }] : []),
    ...(onSave ? [{ label: 'Save game', onClick: onSave }] : []),
    ...(onMainMenu ? [{ label: 'Main menu', onClick: onMainMenu }] : []),
  ]

  return (
    <>
      {panel === 'state' && <StatePanel onClose={() => setPanel(null)} />}
      {panel === 'commitments' && <CommitmentsPanel onClose={() => setPanel(null)} />}
      {panel === 'stats' && <StatsPanel onClose={() => setPanel(null)} />}
      {panel === 'calendar' && <CalendarPanel onClose={() => setPanel(null)} />}
      {panel === 'paths' && <ScenePathsPanel onClose={() => setPanel(null)} />}
      {panel === 'overview' && <OverviewPanel onClose={() => setPanel(null)} />}
      {panel === 'assembly' && <ConnectionsPanel onClose={() => setPanel(null)} />}
      {notepadOpen && <NotepadPanel onClose={() => setNotepadOpen(false)} />}

      {isMobile ? (
        <>
          <header
            data-testid="command-bar"
            style={{
              position: 'fixed', top: 0, left: 0, right: 0,
              height: PHONE_TOP_BAR,
              zIndex: Z.topBar,
              display: 'flex', alignItems: 'stretch', gap: '12px',
              padding: '0 12px',
              background: BAR_BG, borderBottom: BAR_EDGE, boxShadow: '0 4px 16px rgba(0,0,0,0.45)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              <img src={veltriaSeal} alt="Seal of the Republic of Veltria" style={{
                width: 30, height: 30, objectFit: 'contain',
                filter: SEAL_FILTER, opacity: 0.85,
              }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: BRASS, lineHeight: 1 }}>
                  Week {currentWeek}
                </span>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '12px', color: CREAM, lineHeight: 1, whiteSpace: 'nowrap' }}>
                  {weekToDate(currentWeek)}
                </span>
              </div>
            </div>
            <Divider />
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
              <Stat label="Treasury" value={`₭${balance.toLocaleString()}`} valueColor={balance < 0 ? '#e05c4a' : CREAM} {...treasury} />
              <Stat label="Approval" value={`${Math.round(publicImage)}%`} {...approval} />
              {investigation && (
                <span title="Active investigation — classified" style={{
                  alignSelf: 'center', padding: '2px 6px', border: '1px solid rgba(200,80,60,0.6)', color: '#e85a44',
                  fontFamily: 'var(--font-ui)', fontSize: '9px', letterSpacing: '0.14em', animation: 'event-pulse-urgent 2s ease-in-out infinite',
                }}>
                  CLASSIFIED
                </span>
              )}
            </div>
          </header>

          <nav
            aria-label="Government tools"
            style={{
              position: 'fixed', left: 0, right: 0, bottom: 0, height: PHONE_BOTTOM_BAR, zIndex: Z.topBar,
              display: 'flex', alignItems: 'stretch', background: BAR_BG, borderTop: BAR_EDGE,
              boxShadow: '0 -4px 16px rgba(0,0,0,0.45)',
            }}
          >
            {phoneTools.map(t => <ToolButton key={t.label} {...t} />)}
            <MoreMenu items={moreItems} placement="up" />
          </nav>
        </>
      ) : (
        <>
          <HudCrest
            scale={hudScale}
            onOpenOverview={() => toggle('overview')}
          />
          {showStatTab && (
            <StatTab
              scale={hudScale}
              balance={balance}
              personalWealth={personalWealth}
              publicImage={publicImage}
              investigation={investigation}
              treasuryFlash={treasury}
              approvalFlash={approval}
              showPrivyPurse={!isCompact}
              besideColumn={mode === 'desktop' && phase === 'scene'}
            />
          )}
          <MedallionRail
            scale={hudScale}
            items={railItems}
            more={<MoreMenu items={moreItems} placement="left" medallionSize={HUD_SIZES[hudScale].medallion} />}
            settings={{ onClick: () => setSettingsOpen(true) }}
          />
        </>
      )}
    </>
  )
}
