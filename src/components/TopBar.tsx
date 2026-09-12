import { useMemo, useState, useEffect, useRef } from 'react'
import { useGameStore } from '../stores/gameStore'
import { useNewsStore } from '../stores/newsStore'
import { useIsMobile } from '../hooks/useIsMobile'
import { Z } from '../constants/zIndex'
import type { BudgetAllocations } from '../types/gameState'
import iconEconomy from '../assets/images/ui/icon_economy.png'
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

// ─── Separator ─────────────────────────────────────────────────────────────────

function GoldHairline() {
  return (
    <div style={{
      width: 1, height: 22,
      background: 'linear-gradient(180deg, transparent 0%, rgba(201,168,76,0.3) 50%, transparent 100%)',
      margin: '0 8px',
      flexShrink: 0,
    }} />
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

  const balance = useMemo(() => computeBudgetBalance(budget), [budget])
  const date = useMemo(() => weekToDate(currentWeek), [currentWeek])

  const isMobile = useIsMobile()

  // Stat-change flash: briefly highlights approval/treasury when their
  // displayed value moves, so weekly shifts register at a glance.
  const [approvalFlash, setApprovalFlash] = useState<'positive' | 'negative' | null>(null)
  const [treasuryFlash, setTreasuryFlash] = useState<'positive' | 'negative' | null>(null)

  const prevApproval = useRef(publicImage)
  const prevTreasury = useRef(balance)

  useEffect(() => {
    if (publicImage !== prevApproval.current) {
      setApprovalFlash(publicImage > prevApproval.current ? 'positive' : 'negative')
      const t = setTimeout(() => setApprovalFlash(null), 600)
      prevApproval.current = publicImage
      return () => clearTimeout(t)
    }
  }, [publicImage])

  useEffect(() => {
    if (balance !== prevTreasury.current) {
      setTreasuryFlash(balance > prevTreasury.current ? 'positive' : 'negative')
      const t = setTimeout(() => setTreasuryFlash(null), 600)
      prevTreasury.current = balance
      return () => clearTimeout(t)
    }
  }, [balance])

  // NewsOverlay is zIndex 200; TopBar chips are 210 — hide while newspaper is open
  // (same unmount-while-open pattern as KaterinHUD for agenda/scene/news).
  if (newsOpen) return null

  const approvalColor =
    publicImage >= 60 ? '#7fa65a' :
    publicImage >= 35 ? '#c9a84c' :
    '#e05c4a'

  // Retained data (visuals removed in rewrite): week chip + SoE badge + polling/
  // approval hidden per spec, but state kept. Void references keep noUnusedLocals clean.
  void iconEconomy
  void iconTreasury
  void iconApproval
  void GoldHairline
  void economyHealth
  void playerPolling
  void kolvarPolling
  void isMobile
  void approvalFlash
  void approvalColor
  void stateOfEmergency
  void soeWeek
  void date

  // Shared chrome so left/right chips cannot drift on top/padding independently.
  const CHIP_TOP = '12px'
  const CHIP_PADDING = '6px 10px'
  const chipChrome: React.CSSProperties = {
    position: 'fixed',
    top: CHIP_TOP,
    width: 'auto',
    zIndex: Z.topBar,
    background: 'rgba(10,8,6,0.85)',
    borderRadius: '6px',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(201,168,76,0.2)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
    fontFamily: "'IBM Plex Mono', monospace",
    padding: CHIP_PADDING,
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
  }

  void chipChrome

  return (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: '60px',
    height: '48px',
    zIndex: Z.topBar,
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '12px',
    paddingRight: '12px',
    gap: '4px',
    background: 'linear-gradient(180deg, rgba(8,6,4,0.97) 0%, rgba(14,11,8,0.93) 100%)',
    borderBottom: '1px solid rgba(201,168,76,0.2)',
    boxShadow: '0 2px 16px rgba(0,0,0,0.6)',
    fontFamily: "'IBM Plex Mono', monospace",
    boxSizing: 'border-box',
  }}>

    {/* ECONOMY STAT */}
    <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'0 10px' }}>
      <div style={{
        width:'32px', height:'32px', borderRadius:'50%',
        border:'1.5px solid rgba(201,168,76,0.6)',
        background:'rgba(201,168,76,0.1)',
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow:'0 0 8px rgba(201,168,76,0.25)',
        flexShrink:0,
      }}>
        <img src={iconEconomy} alt="Economy" style={{
          width:'18px', height:'18px',
          filter:'brightness(2.2) saturate(1.4) drop-shadow(0 0 3px rgba(201,168,76,0.9))',
        }}/>
      </div>
      <span style={{
        fontFamily:"'Playfair Display', serif",
        fontSize:'0.95rem', fontWeight:700,
        color: balance < 0 ? '#e05c4a' : '#f0e8d0',
        textShadow: balance < 0 ? '0 0 8px rgba(224,92,74,0.5)' : '0 0 6px rgba(240,232,208,0.2)',
        animation: treasuryFlash ? `stat-flash-${treasuryFlash} 0.6s ease-out` : undefined,
        whiteSpace:'nowrap',
      }}>
        ₭{balance.toLocaleString()}
      </span>
    </div>

    {/* DIVIDER */}
    <div style={{ width:1, height:24, background:'rgba(201,168,76,0.2)', flexShrink:0 }}/>

    {/* WEALTH STAT */}
    <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'0 10px' }}>
      <div style={{
        width:'32px', height:'32px', borderRadius:'50%',
        border:'1.5px solid rgba(201,168,76,0.6)',
        background:'rgba(201,168,76,0.1)',
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow:'0 0 8px rgba(201,168,76,0.25)',
        flexShrink:0,
      }}>
        <img src={iconWealth} alt="Wealth" style={{
          width:'18px', height:'18px',
          filter:'brightness(2.2) saturate(1.4) drop-shadow(0 0 3px rgba(201,168,76,0.9))',
        }}/>
      </div>
      <span style={{
        fontFamily:"'Playfair Display', serif",
        fontSize:'0.95rem', fontWeight:700,
        color:'#c9a84c',
        textShadow:'0 0 6px rgba(201,168,76,0.3)',
        whiteSpace:'nowrap',
      }}>
        {personalWealth.toLocaleString()}
      </span>
    </div>

  </div>
)
}
