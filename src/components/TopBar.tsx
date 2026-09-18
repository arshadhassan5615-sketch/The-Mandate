import { useMemo, useState, useEffect, useRef } from 'react'
import { useGameStore } from '../stores/gameStore'
import { useNewsStore } from '../stores/newsStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useIsMobile } from '../hooks/useIsMobile'
import { Z } from '../constants/zIndex'
import type { BudgetAllocations } from '../types/gameState'
import OverviewPanel from './panels/OverviewPanel'
import veltriaSeal from '../assets/images/veltria_seal.png'
import iconTreasury from '../assets/images/ui/icon_treasury.png'
import iconWealth from '../assets/images/ui/icon_wealth.png'
import iconApproval from '../assets/images/ui/icon_approval.png'

function computeBudgetBalance(budget: BudgetAllocations): number {
  const revenue = budget.taxRevenue + budget.stateIndustry + budget.customsTariffs + budget.foreignAid
  const expenditure = budget.military + budget.debtService + budget.govtAdmin + budget.infrastructure + budget.education + budget.healthcare + budget.welfare + budget.bniSecurity
  return revenue - expenditure
}

function weekToDate(week: number): string {
  const d = new Date(1963, 0, 1)
  d.setDate(d.getDate() + (week - 1) * 7)
  const day = d.getDate()
  const month = d.toLocaleString('en-US', { month: 'short' })
  const year = d.getFullYear()
  return `${day} ${month} ${year}`
}

// ─── Chrome tokens ─────────────────────────────────────────────────────────────

const SERIF_DISPLAY = "'Playfair Display', serif"
const RING_BG = '#14110d'
const RING_BORDER = '#6b5a34'
const RING_BORDER_LIT = '#c9a84c'
const GOLD_ICON = '#d9c48a'
const CREAM = '#e6dcc3'
const DELTA_UP = '#2e9e4f'
const DELTA_DOWN = '#c94a3a'

// How long the "(+3)" delta text stays beside a stat after it moves. The
// colour keyframe itself still runs 0.6s; the text needs longer to be read.
const DELTA_VISIBLE_MS = 2000

type FlashState = 'positive' | 'negative' | null

interface EconomyStatus {
  label: 'STABLE' | 'STRUGGLING' | 'CRITICAL' | 'CRISIS'
  color: string
}

function economyStatusFor(health: number): EconomyStatus {
  if (health >= 20) return { label: 'STABLE', color: '#2e7d3a' }
  if (health >= -20) return { label: 'STRUGGLING', color: '#8a6d1f' }
  if (health >= -60) return { label: 'CRITICAL', color: '#a35a1f' }
  return { label: 'CRISIS', color: '#a33a2a' }
}

function formatDelta(delta: number): string {
  const rounded = Math.round(delta)
  return rounded > 0 ? `(+${rounded.toLocaleString()})` : `(${rounded.toLocaleString()})`
}

// ─── Crest cluster pieces ──────────────────────────────────────────────────────

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

interface RingButtonProps {
  label: string
  size: number
  onClick: () => void
  children: React.ReactNode
}

function RingButton({ label, size, onClick, children }: RingButtonProps) {
  const [isHovered, setIsHovered] = useState(false)
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: size,
        height: size,
        padding: 0,
        borderRadius: '50%',
        background: RING_BG,
        border: `1.5px solid ${isHovered ? RING_BORDER_LIT : RING_BORDER}`,
        boxShadow: isHovered
          ? '0 0 14px rgba(201,168,76,0.4), inset 0 0 8px rgba(0,0,0,0.4)'
          : '0 2px 8px rgba(0,0,0,0.5), inset 0 0 8px rgba(0,0,0,0.4)',
        color: GOLD_ICON,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  )
}

interface StatChipProps {
  icon: string
  alt: string
  value: string
  valueColor?: string
  flash?: FlashState
  delta?: number
}

function StatChip({ icon, alt, value, valueColor = CREAM, flash = null, delta = 0 }: StatChipProps) {
  const showDelta = flash !== null && delta !== 0
  return (
    <div
      title={alt}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'rgba(20,17,13,0.85)',
        border: '1px solid rgba(181,154,94,0.35)',
        borderRadius: '20px',
        padding: '4px 12px 4px 6px',
        flexShrink: 0,
      }}
    >
      <div style={{
        width: 30,
        height: 30,
        borderRadius: '50%',
        background: RING_BG,
        border: '1px solid rgba(181,154,94,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <img
          src={icon}
          alt={alt}
          style={{ width: 26, height: 26, filter: 'brightness(2.0) saturate(1.3)', display: 'block' }}
        />
      </div>
      <span style={{
        fontFamily: SERIF_DISPLAY,
        fontSize: '0.95rem',
        fontWeight: 700,
        color: valueColor,
        lineHeight: 1,
        animation: flash ? `stat-flash-${flash} 0.6s ease-out` : undefined,
      }}>
        {value}
      </span>
      {showDelta && (
        <span style={{
          fontFamily: SERIF_DISPLAY,
          fontSize: '0.7rem',
          fontWeight: 700,
          color: delta > 0 ? DELTA_UP : DELTA_DOWN,
          marginLeft: '4px',
          lineHeight: 1,
        }}>
          {formatDelta(delta)}
        </span>
      )}
    </div>
  )
}

// ─── TopBar ────────────────────────────────────────────────────────────────────

export default function TopBar() {
  const budget = useGameStore(s => s.budget)
  const economyHealth = useGameStore(s => s.nation.economyHealth)
  const personalWealth = useGameStore(s => s.personal.personalWealth)
  const publicImage = useGameStore(s => s.personal.publicImage)
  const currentWeek = useGameStore(s => s.currentWeek)
  const stateOfEmergency = useGameStore(s => s.stateOfEmergency)
  const soeWeek = useGameStore(s => s.stateOfEmergencyWeek)
  const playerPolling = useGameStore(s => s.playerPolling)
  const kolvarPolling = useGameStore(s => s.kolvarPolling)
  const newsOpen = useNewsStore(s => s.isOpen)
  const setSettingsOpen = useSettingsStore(s => s.setSettingsOpen)

  const balance = useMemo(() => computeBudgetBalance(budget), [budget])
  const date = useMemo(() => weekToDate(currentWeek), [currentWeek])

  const isMobile = useIsMobile()

  const [overviewOpen, setOverviewOpen] = useState(false)

  // Stat-change flash: briefly highlights approval/treasury when their
  // displayed value moves, so weekly shifts register at a glance. The signed
  // delta is captured at trigger time and rendered beside the value.
  const [approvalFlash, setApprovalFlash] = useState<FlashState>(null)
  const [treasuryFlash, setTreasuryFlash] = useState<FlashState>(null)
  const [approvalDelta, setApprovalDelta] = useState(0)
  const [treasuryDelta, setTreasuryDelta] = useState(0)

  const prevApproval = useRef(publicImage)
  const prevTreasury = useRef(balance)

  useEffect(() => {
    if (publicImage !== prevApproval.current) {
      const delta = publicImage - prevApproval.current
      setApprovalDelta(delta)
      setApprovalFlash(delta > 0 ? 'positive' : 'negative')
      const t = setTimeout(() => setApprovalFlash(null), DELTA_VISIBLE_MS)
      prevApproval.current = publicImage
      return () => clearTimeout(t)
    }
  }, [publicImage])

  useEffect(() => {
    if (balance !== prevTreasury.current) {
      const delta = balance - prevTreasury.current
      setTreasuryDelta(delta)
      setTreasuryFlash(delta > 0 ? 'positive' : 'negative')
      const t = setTimeout(() => setTreasuryFlash(null), DELTA_VISIBLE_MS)
      prevTreasury.current = balance
      return () => clearTimeout(t)
    }
  }, [balance])

  // NewsOverlay is zIndex 200; TopBar chips are 210 — hide while newspaper is open
  // (same unmount-while-open pattern as KaterinHUD for agenda/scene/news).
  if (newsOpen) return null

  // Retained data (visuals removed in rewrite): week/date, SoE badge and
  // polling are hidden per spec, but state kept. Void references keep
  // noUnusedLocals clean.
  void playerPolling
  void kolvarPolling
  void stateOfEmergency
  void soeWeek
  void date

  const economy = economyStatusFor(economyHealth)
  const crestSize = isMobile ? 60 : 88
  const miniSize = isMobile ? 32 : 44

  return (
    <>
      {overviewOpen && <OverviewPanel onClose={() => setOverviewOpen(false)} />}

      <div style={{
        position: 'fixed',
        top: 8,
        left: 8,
        zIndex: Z.topBar,
        display: 'flex',
        alignItems: 'center',
        flexWrap: isMobile ? 'wrap' : 'nowrap',
        gap: isMobile ? '6px' : '10px',
        maxWidth: 'calc(100vw - 16px)',
      }}>
        {/* Crest */}
        <div style={{
          width: crestSize,
          height: crestSize,
          borderRadius: '50%',
          border: '3px solid #b59a5e',
          boxShadow: '0 0 16px rgba(0,0,0,0.5), inset 0 0 8px rgba(0,0,0,0.4)',
          background: RING_BG,
          padding: 8,
          boxSizing: 'border-box',
          flexShrink: 0,
        }}>
          <img
            src={veltriaSeal}
            alt="Seal of the Republic of Veltria"
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          />
        </div>

        {/* Globe (Overview) and menu (Settings) buttons, stacked beside the crest */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
          <RingButton label="Overview" size={miniSize} onClick={() => setOverviewOpen(prev => !prev)}>
            <GlobeIcon />
          </RingButton>
          <RingButton label="Settings" size={miniSize} onClick={() => setSettingsOpen(true)}>
            <MenuIcon />
          </RingButton>
        </div>

        {/* Economy status badge — tan box, only the status text is tinted */}
        <div
          title={`Economy: ${economy.label.toLowerCase()}`}
          style={{
            background: '#d8c9a3',
            color: '#2a2622',
            padding: '4px 10px',
            borderRadius: '3px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            lineHeight: 1.2,
            fontFamily: SERIF_DISPLAY,
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: '0.5rem', letterSpacing: '0.15em', fontWeight: 700, opacity: 0.7 }}>
            ECONOMY
          </span>
          <span style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', color: economy.color }}>
            {economy.label}
          </span>
        </div>

        {/* Stat chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
          <StatChip
            icon={iconTreasury}
            alt="Treasury"
            value={`₭${balance.toLocaleString()}`}
            valueColor={balance < 0 ? '#e05c4a' : CREAM}
            flash={treasuryFlash}
            delta={treasuryDelta}
          />
          {!isMobile && (
            <StatChip
              icon={iconWealth}
              alt="Privy Purse"
              value={personalWealth.toLocaleString()}
            />
          )}
          <StatChip
            icon={iconApproval}
            alt="Approval"
            value={`${Math.round(publicImage)}%`}
            flash={approvalFlash}
            delta={approvalDelta}
          />
        </div>
      </div>
    </>
  )
}
