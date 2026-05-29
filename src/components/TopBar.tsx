import { useRef, useEffect, useState, useMemo } from 'react'
import { useGameStore } from '../stores/gameStore'
import { useNewsStore } from '../stores/newsStore'
import type { BudgetAllocations } from '../types/gameState'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getEconomyLabel(health: number): string {
  if (health < -60) return 'CRISIS'
  if (health < -20) return 'RECESSION'
  if (health < 20) return 'STAGNANT'
  if (health < 60) return 'GROWING'
  return 'BOOMING'
}

function economyLabelColor(label: string): string {
  switch (label) {
    case 'CRISIS': return 'var(--accent-red)'
    case 'RECESSION': return '#b85a30'
    case 'STAGNANT': return 'var(--amber-dim)'
    case 'GROWING': return '#7a9a3a'
    case 'BOOMING': return 'var(--accent-green)'
    default: return 'var(--muted)'
  }
}

function economyToSegments(health: number): number {
  // Map -100..100 → 0..10
  return Math.max(0, Math.min(10, Math.round(((health + 100) / 200) * 10)))
}

function segmentColor(index: number, total: number): string {
  // Gradient from red (segment 0) through yellow to green (segment 9)
  const t = total === 0 ? 0 : index / (total - 1)
  if (t <= 0.5) {
    // red → yellow
    const r = 200
    const g = Math.round(50 + (t * 2) * 180)
    const b = 30
    return `rgb(${r},${g},${b})`
  }
  // yellow → green
  const r = Math.round(200 - ((t - 0.5) * 2) * 150)
  const g = Math.round(190 - ((t - 0.5) * 2) * 80)
  const b = 30
  return `rgb(${r},${g},${b})`
}

function computeBudgetBalance(budget: BudgetAllocations): number {
  const revenue = budget.taxRevenue + budget.stateIndustry + budget.customsTariffs + budget.foreignAid
  const expenditure = budget.military + budget.debtService + budget.govtAdmin + budget.infrastructure + budget.education + budget.healthcare + budget.welfare + budget.bniSecurity
  return revenue - expenditure
}

function getBudgetColor(balance: number): string {
  if (balance >= 0) return 'var(--accent-green)'
  if (balance > -30) return 'var(--amber-dim)'
  return 'var(--accent-red)'
}

function getWealthColor(wealth: number): string {
  return wealth > 5 ? 'var(--accent-green)' : 'var(--accent-red)'
}

function weekToDate(week: number): string {
  const d = new Date(1963, 0, 1)
  d.setDate(d.getDate() + (week - 1) * 7)
  const day = d.getDate()
  const month = d.toLocaleString('en-US', { month: 'short' })
  const year = d.getFullYear()
  return `${day} ${month} ${year}`
}

// ─── Stat Box ─────────────────────────────────────────────────────────────────

function StatBox({ label, value, color, children }: {
  label: string
  value: string
  color?: string
  children?: React.ReactNode
}) {
  const [flash, setFlash] = useState(false)
  const prev = useRef(value)

  useEffect(() => {
    if (prev.current !== value) {
      setFlash(true)
      prev.current = value
      const t = setTimeout(() => setFlash(false), 600)
      return () => clearTimeout(t)
    }
  }, [value])

  return (
    <div
      className={flash ? 'stat-changed' : ''}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1px',
        minWidth: '90px',
      }}
    >
      <span
        style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: '0.48rem',
          letterSpacing: '0.12em',
          color: 'var(--muted)',
          textTransform: 'uppercase',
          lineHeight: 1,
        }}
      >
        {label}
      </span>
      {children ? (
        children
      ) : (
        <span
          style={{
            fontFamily: "'Special Elite', monospace",
            fontSize: '0.7rem',
            letterSpacing: '0.06em',
            color: color ?? 'var(--cream)',
            background: 'var(--paper-raised)',
            border: `1px solid ${color ?? 'var(--border)'}`,
            padding: '2px 8px',
            borderRadius: '1px',
            lineHeight: 1.3,
          }}
        >
          {value}
        </span>
      )}
    </div>
  )
}

// ─── Economy Bar ──────────────────────────────────────────────────────────────

function EconomyBar() {
  const economyHealth = useGameStore(s => s.nation.economyHealth)
  const segments = economyToSegments(economyHealth)
  const label = getEconomyLabel(economyHealth)
  const labelClr = economyLabelColor(label)
  const [flash, setFlash] = useState(false)
  const prev = useRef(economyHealth)

  useEffect(() => {
    if (prev.current !== economyHealth) {
      setFlash(true)
      prev.current = economyHealth
      const t = setTimeout(() => setFlash(false), 600)
      return () => clearTimeout(t)
    }
  }, [economyHealth])

  return (
    <div
      className={flash ? 'stat-changed' : ''}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}
    >
      <span
        style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: '0.48rem',
          letterSpacing: '0.12em',
          color: 'var(--muted)',
          textTransform: 'uppercase',
          lineHeight: 1,
        }}
      >
        ECONOMY
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ display: 'flex', gap: '1px' }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: '7px',
                height: '16px',
                background: i < segments ? segmentColor(i, segments) : 'var(--paper-raised)',
                border: i < segments
                  ? `1px solid ${segmentColor(i, segments)}`
                  : '1px solid rgba(200,144,42,0.15)',
                transition: 'background 0.3s, border-color 0.3s',
              }}
            />
          ))}
        </div>
        <span
          style={{
            fontFamily: "'Special Elite', monospace",
            fontSize: '0.52rem',
            letterSpacing: '0.08em',
            color: labelClr,
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
      </div>
    </div>
  )
}

// ─── TopBar ────────────────────────────────────────────────────────────────────

export default function TopBar() {
  const budget = useGameStore(s => s.budget)
  const personalWealth = useGameStore(s => s.personal.personalWealth)
  const currentWeek = useGameStore(s => s.currentWeek)
  const stateOfEmergency = useGameStore(s => s.stateOfEmergency)
  const soeWeek = useGameStore(s => s.stateOfEmergencyWeek)
  const unreadCount = useNewsStore(s => s.articles.length - (s.lastReadIndex + 1))
  const setNewsOpen = useNewsStore(s => s.setOpen)

  const balance = useMemo(() => computeBudgetBalance(budget), [budget])
  const budgetColor = getBudgetColor(balance)
  const wealthThousands = Math.round(personalWealth / 1000)
  const wealthColor = getWealthColor(wealthThousands)
  const date = useMemo(() => weekToDate(currentWeek), [currentWeek])
  const soeDaysLeft = useMemo(() => {
    if (!stateOfEmergency || !soeWeek) return 0
    return Math.max(0, 90 - (currentWeek - soeWeek) * 7)
  }, [stateOfEmergency, soeWeek, currentWeek])

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 140,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 16px',
        background: 'rgba(15,13,10,0.92)',
        borderBottom: '1px solid rgba(200,144,42,0.18)',
        backdropFilter: 'blur(6px)',
        height: '48px',
      }}
    >
      {/* LEFT — 3 stat indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <EconomyBar />

        {/* Separator */}
        <div style={{ width: '1px', height: '20px', background: 'rgba(200,144,42,0.15)' }} />

        <StatBox label="BUDGET" value={`[${balance >= 0 ? '+' : ''}${balance}]`} color={budgetColor} />

        <StatBox label="WEALTH" value={`[${wealthThousands}]`} color={wealthColor} />
      </div>

      {/* CENTER — SOE indicator + NEWS badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {stateOfEmergency && (
          <div
            style={{
              background: 'rgba(220,50,50,0.15)',
              border: '1px solid var(--accent-red)',
              padding: '3px 10px',
              borderRadius: '1px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span
              style={{
                fontFamily: "'Special Elite', monospace",
                fontSize: '0.48rem',
                letterSpacing: '0.12em',
                color: 'var(--accent-red)',
                textTransform: 'uppercase',
                lineHeight: 1,
              }}
            >
              STATE OF EMERGENCY
            </span>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '0.42rem',
                color: 'var(--muted)',
                lineHeight: 1,
              }}
            >
              {soeDaysLeft}d left
            </span>
          </div>
        )}
        <button
          onClick={() => setNewsOpen(true)}
          title="News"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'transparent',
            border: '1px solid rgba(200,144,42,0.25)',
            color: 'var(--amber-dim)',
            fontFamily: "'Special Elite', monospace",
            fontSize: '0.55rem',
            letterSpacing: '0.14em',
            padding: '4px 12px',
            cursor: 'pointer',
            borderRadius: '1px',
            transition: 'border-color 0.15s, color 0.15s',
            lineHeight: 1,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--amber)'
            e.currentTarget.style.color = 'var(--amber)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(200,144,42,0.25)'
            e.currentTarget.style.color = 'var(--amber-dim)'
          }}
        >
          NEWS
          {unreadCount > 0 && (
            <span
              style={{
                background: 'var(--accent-red)',
                color: 'var(--cream)',
                fontFamily: "'Special Elite', monospace",
                fontSize: '0.45rem',
                fontWeight: 700,
                padding: '0px 5px',
                borderRadius: '2px',
                lineHeight: '16px',
                minWidth: '16px',
                textAlign: 'center',
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* RIGHT — Week counter + date */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1px' }}>
        <span
          style={{
            fontFamily: "'Special Elite', monospace",
            fontSize: '0.55rem',
            letterSpacing: '0.08em',
            color: 'var(--amber)',
            textTransform: 'uppercase',
            lineHeight: 1,
          }}
        >
          Week {currentWeek} of 52
        </span>
        <span
          style={{
            fontFamily: "'Special Elite', monospace",
            fontSize: '0.45rem',
            letterSpacing: '0.06em',
            color: 'var(--muted)',
            textTransform: 'uppercase',
            lineHeight: 1,
          }}
        >
          {date}
        </span>
      </div>
    </div>
  )
}
