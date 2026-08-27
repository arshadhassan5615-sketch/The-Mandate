import { useMemo, useState, useEffect } from 'react'
import { useGameStore } from '../stores/gameStore'
import { useNewsStore } from '../stores/newsStore'
import type { BudgetAllocations } from '../types/gameState'
import veltriaSeal from '../assets/images/veltria_seal.png'
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

  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // NewsOverlay is zIndex 200; TopBar chips are 210 — hide while newspaper is open
  // (same unmount-while-open pattern as KaterinHUD for agenda/scene/news).
  if (newsOpen) return null

  const approvalColor =
    publicImage >= 60 ? '#7fa65a' :
    publicImage >= 35 ? '#c9a84c' :
    '#e05c4a'

  // Shared chrome so left/right chips cannot drift on top/padding independently.
  const CHIP_TOP = '12px'
  const CHIP_PADDING = '6px 10px'
  const chipChrome: React.CSSProperties = {
    position: 'fixed',
    top: CHIP_TOP,
    width: 'auto',
    zIndex: 210,
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

  return (
    <>
      {/* LEFT CLUSTER — seal + resources (top-left chip, not full-width bar) */}
      <div style={{
        ...chipChrome,
        left: '12px',
        gap: 0,
      }}>
        {/* LEFT SECTION — Republic identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src={veltriaSeal} alt="Veltria Seal" style={{ height: 26, opacity: 0.9, filter: 'drop-shadow(0 0 8px rgba(201,168,76,0.3))' }} />
          {!isMobile && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: '0.54rem', letterSpacing: '0.2em', color: '#c9a84c', lineHeight: 1, textShadow: '0 0 10px rgba(201,168,76,0.4)' }}>
                REPUBLIC OF VELTRIA
              </span>
              <span style={{ fontSize: '0.46rem', letterSpacing: '0.15em', color: 'rgba(220,210,190,0.4)', lineHeight: 1 }}>
                OFFICE OF THE CHANCELLOR
              </span>
            </div>
          )}
        </div>

        <GoldHairline />

        {/* SLOT 1 — ECONOMY */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.03)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(201,168,76,0.1)' }}>
          <img src={iconEconomy} alt="Economy" style={{ height: 22, width: 22, filter: 'brightness(1.8) contrast(1.2) drop-shadow(0 0 6px rgba(201,168,76,0.5))' }} />
          <div style={{ display: 'flex', gap: 2 }}>
            {(() => {
              const red = '#e05c4a'; const yellow = '#c9a84c'; const grey = 'rgba(255,255,255,0.1)'
              const green = '#7fa65a'; const brightGreen = '#a5d678'
              let colors: string[] = []
              if (economyHealth < -60) colors = [red, red, red, red, red]
              else if (economyHealth < -20) colors = [red, red, red, yellow, grey]
              else if (economyHealth < 20) colors = [yellow, yellow, grey, grey, grey]
              else if (economyHealth < 60) colors = [green, green, green, grey, grey]
              else colors = [brightGreen, brightGreen, brightGreen, brightGreen, brightGreen]
              return colors.map((c, i) => (
                <div key={i} style={{
                  width: 3, height: 12, borderRadius: 1,
                  background: c,
                  boxShadow: c !== grey ? `0 0 6px ${c}80` : 'none',
                  transition: 'background 0.4s ease'
                }} />
              ))
            })()}
          </div>
        </div>

        <GoldHairline />

        {/* SLOT 2 — TREASURY */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.03)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(201,168,76,0.1)' }}>
          <img src={iconTreasury} alt="Treasury" style={{ height: 26, width: 26, marginTop: '2px', filter: 'brightness(1.8) contrast(1.2) drop-shadow(0 0 6px rgba(201,168,76,0.5))' }} />
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '0.9rem', fontWeight: 600,
            color: balance < 0 ? '#e05c4a' : '#e8dcc8', lineHeight: 1, textShadow: balance < 0 ? '0 0 8px rgba(224,92,74,0.4)' : '0 0 8px rgba(201,168,76,0.2)' }}>
            {balance.toLocaleString()}
          </span>
        </div>

        {!isMobile && (
          <>
            <GoldHairline />

            {/* SLOT 3 — PRIVY PURSE */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.03)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(201,168,76,0.1)' }}>
              <img src={iconWealth} alt="Wealth" style={{ height: 22, width: 22, marginTop: '2px', filter: 'brightness(1.8) contrast(1.2) drop-shadow(0 0 6px rgba(201,168,76,0.5))' }} />
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '0.9rem', fontWeight: 600,
                color: '#c9a84c', lineHeight: 1, textShadow: '0 0 8px rgba(201,168,76,0.3)' }}>
                {personalWealth.toLocaleString()}
              </span>
            </div>
          </>
        )}

        <GoldHairline />

        {/* SLOT 4 — APPROVAL */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.03)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(201,168,76,0.1)' }}>
          <img src={iconApproval} alt="Approval" style={{ height: 22, width: 22, marginTop: '2px', filter: `brightness(1.8) contrast(1.2) drop-shadow(0 0 8px ${approvalColor}CC)` }} />
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '0.9rem', fontWeight: 600,
            color: approvalColor, lineHeight: 1, minWidth: 26, textShadow: `0 0 8px ${approvalColor}40` }}>
            {publicImage}%
          </span>
          <div style={{ width: 32, height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${publicImage}%`, height: '100%', background: approvalColor,
              boxShadow: `0 0 8px ${approvalColor}80`, borderRadius: 2, transition: 'width 0.5s ease' }} />
          </div>
        </div>

        <GoldHairline />

        {/* SLOT 5 — POLLING */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 90 }}>
          <span style={{ fontSize: '0.55rem', letterSpacing: '0.15em', color: 'rgba(220,210,190,0.5)', textTransform: 'uppercase' }}>Polling</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 600,
              color: '#c9a84c', lineHeight: 1, minWidth: 35, textShadow: '0 0 8px rgba(201,168,76,0.3)' }}>
              {playerPolling}%
            </span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)' }}>vs</span>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 600,
              color: '#e05c4a', lineHeight: 1, minWidth: 35, textShadow: '0 0 8px rgba(224,92,74,0.3)' }}>
              {kolvarPolling}%
            </span>
          </div>
        </div>

        {/* STATE OF EMERGENCY */}
        {stateOfEmergency && (
          <div style={{ marginLeft: 10, background: 'rgba(160,40,30,0.2)', border: '1px solid rgba(200,60,40,0.6)',
            padding: '3px 8px', borderRadius: 2, backdropFilter: 'blur(4px)' }}>
            <span style={{ fontSize: '0.5rem', letterSpacing: '0.2em', color: '#e05c4a', textTransform: 'uppercase', whiteSpace: 'nowrap', textShadow: '0 0 8px rgba(224,92,74,0.5)' }}>
              EMERGENCY · WK {soeWeek}
            </span>
          </div>
        )}
      </div>

      {/* RIGHT CHIP — week/date (independent top-right, not marginLeft auto) */}
      <div style={{
        ...chipChrome,
        right: '12px',
        flexDirection: 'column',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 2,
      }}>
        <span style={{ fontSize: '0.66rem', letterSpacing: '0.2em', color: '#c9a84c', lineHeight: 1, textShadow: '0 0 10px rgba(201,168,76,0.3)' }}>
          WEEK {currentWeek} / 52
        </span>
        {!isMobile && (
          <span style={{ fontSize: '0.5rem', letterSpacing: '0.1em', color: 'rgba(220,210,190,0.4)', lineHeight: 1 }}>
            {date}
          </span>
        )}
      </div>
    </>
  )
}
