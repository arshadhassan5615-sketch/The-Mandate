import { useMemo } from 'react'
import { useGameStore } from '../stores/gameStore'
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
      width: 1, height: 28,
      background: 'linear-gradient(180deg, transparent 0%, rgba(201,168,76,0.3) 50%, transparent 100%)',
      margin: '0 16px',
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

  const balance = useMemo(() => computeBudgetBalance(budget), [budget])
  const date = useMemo(() => weekToDate(currentWeek), [currentWeek])

  const approvalColor =
    publicImage >= 60 ? '#7fa65a' :
    publicImage >= 35 ? '#c9a84c' :
    '#e05c4a'

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: 52,
      zIndex: 210,
      background: 'linear-gradient(180deg, rgba(18,16,12,0.85) 0%, rgba(10,8,6,0.95) 100%)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(201,168,76,0.2)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,220,160,0.05)',
      display: 'flex', alignItems: 'center', gap: 0,
      padding: '0 20px',
      fontFamily: "'IBM Plex Mono', monospace",
    }}>
      {/* LEFT SECTION — Republic identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img src={veltriaSeal} alt="Veltria Seal" style={{ height: 32, opacity: 0.9, filter: 'drop-shadow(0 0 8px rgba(201,168,76,0.3))' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: '0.65rem', letterSpacing: '0.2em', color: '#c9a84c', lineHeight: 1, textShadow: '0 0 10px rgba(201,168,76,0.4)' }}>
            REPUBLIC OF VELTRIA
          </span>
          <span style={{ fontSize: '0.55rem', letterSpacing: '0.15em', color: 'rgba(220,210,190,0.4)', lineHeight: 1 }}>
            OFFICE OF THE CHANCELLOR
          </span>
        </div>
      </div>

      <GoldHairline />

      {/* SLOT 1 — ECONOMY */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '4px', border: '1px solid rgba(201,168,76,0.1)' }}>
        <img src={iconEconomy} alt="Economy" style={{ height: 28, width: 28, filter: 'brightness(1.8) contrast(1.2) drop-shadow(0 0 6px rgba(201,168,76,0.5))' }} />
        <div style={{ display: 'flex', gap: 3 }}>
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
                width: 4, height: 14, borderRadius: 1, 
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '4px', border: '1px solid rgba(201,168,76,0.1)' }}>
        <img src={iconTreasury} alt="Treasury" style={{ height: 34, width: 34, marginTop: '4px', filter: 'brightness(1.8) contrast(1.2) drop-shadow(0 0 6px rgba(201,168,76,0.5))' }} />
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 600,
          color: balance < 0 ? '#e05c4a' : '#e8dcc8', lineHeight: 1, textShadow: balance < 0 ? '0 0 8px rgba(224,92,74,0.4)' : '0 0 8px rgba(201,168,76,0.2)' }}>
          {balance.toLocaleString()}
        </span>
      </div>

      <GoldHairline />

      {/* SLOT 3 — PRIVY PURSE */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '4px', border: '1px solid rgba(201,168,76,0.1)' }}>
        <img src={iconWealth} alt="Wealth" style={{ height: 28, width: 28, marginTop: '4px', filter: 'brightness(1.8) contrast(1.2) drop-shadow(0 0 6px rgba(201,168,76,0.5))' }} />
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 600,
          color: '#c9a84c', lineHeight: 1, textShadow: '0 0 8px rgba(201,168,76,0.3)' }}>
          {personalWealth.toLocaleString()}
        </span>
      </div>

      <GoldHairline />

      {/* SLOT 4 — APPROVAL */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '4px', border: '1px solid rgba(201,168,76,0.1)' }}>
        <img src={iconApproval} alt="Approval" style={{ height: 28, width: 28, marginTop: '4px', filter: `brightness(1.8) contrast(1.2) drop-shadow(0 0 8px ${approvalColor}CC)` }} />
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 600,
          color: approvalColor, lineHeight: 1, minWidth: 30, textShadow: `0 0 8px ${approvalColor}40` }}>
          {publicImage}%
        </span>
        <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${publicImage}%`, height: '100%', background: approvalColor,
            boxShadow: `0 0 8px ${approvalColor}80`, borderRadius: 2, transition: 'width 0.5s ease' }} />
        </div>
      </div>

      {/* STATE OF EMERGENCY */}
      {stateOfEmergency && (
        <div style={{ marginLeft: 16, background: 'rgba(160,40,30,0.2)', border: '1px solid rgba(200,60,40,0.6)',
          padding: '4px 12px', borderRadius: 2, backdropFilter: 'blur(4px)' }}>
          <span style={{ fontSize: '0.6rem', letterSpacing: '0.2em', color: '#e05c4a', textTransform: 'uppercase', whiteSpace: 'nowrap', textShadow: '0 0 8px rgba(224,92,74,0.5)' }}>
            EMERGENCY · WK {soeWeek}
          </span>
        </div>
      )}

      {/* RIGHT SECTION — Dispatch stamp */}
      <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
        <span style={{ fontSize: '0.8rem', letterSpacing: '0.2em', color: '#c9a84c', lineHeight: 1, textShadow: '0 0 10px rgba(201,168,76,0.3)' }}>
          WEEK {currentWeek} / 52
        </span>
        <span style={{ fontSize: '0.6rem', letterSpacing: '0.1em', color: 'rgba(220,210,190,0.4)', lineHeight: 1 }}>
          {date}
        </span>
      </div>
    </div>
  )
}
