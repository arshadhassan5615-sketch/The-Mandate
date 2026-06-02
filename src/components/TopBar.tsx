import { useMemo } from 'react'
import { useGameStore } from '../stores/gameStore'
import type { BudgetAllocations } from '../types/gameState'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getEconomyLabel(health: number): string {
  if (health < -60) return 'CRISIS'
  if (health < -20) return 'RECESSION'
  if (health < 20) return 'STAGNANT'
  if (health < 60) return 'GROWING'
  return 'BOOMING'
}

function economyToSegments(health: number): number {
  return Math.max(0, Math.min(10, Math.round(((health + 100) / 200) * 10)))
}

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
  const economyLabel = useMemo(() => getEconomyLabel(economyHealth), [economyHealth])
  const wealthThousands = Math.round(personalWealth / 1000)

  const approvalValue = publicImage
  const approvalColor =
    approvalValue >= 70 ? '#00cc44' :
    approvalValue >= 50 ? '#f0c040' :
    approvalValue >= 30 ? '#ff8800' :
    '#ff3333'
  const approvalGlow =
    approvalValue >= 70 ? 'rgba(0,204,68,0.6)' :
    approvalValue >= 50 ? 'rgba(240,192,64,0.6)' :
    approvalValue >= 30 ? 'rgba(255,136,0,0.6)' :
    'rgba(255,51,51,0.6)'
  const date = useMemo(() => weekToDate(currentWeek), [currentWeek])
  const soeDaysLeft = useMemo(() => {
    if (!stateOfEmergency || !soeWeek) return 0
    return Math.max(0, 90 - (currentWeek - soeWeek) * 7)
  }, [stateOfEmergency, soeWeek, currentWeek])

  return (
    <>
      {/* ===== COMPACT LEFT STATS BAR ===== */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 210,
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          height: '40px',
          background: 'transparent',
          borderBottom: 'none',
          borderRight: 'none',
          borderBottomRightRadius: '0',
          padding: '0',
          width: 'fit-content',
          minWidth: '0',
          boxShadow: 'none',
          backdropFilter: 'none',
        }}
      >
        {/* Economy — colored squares only */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          padding: '0 8px',
          borderRight: '1px solid rgba(201,168,76,0.3)',
        }}>
          <span style={{
            fontSize: '12px',
            marginRight: '4px',
            filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.9))',
          }}>📊</span>
          <div style={{ display: 'flex', gap: '2px' }}>
            {(() => {
              const red = '#ff3333'
              const yellow = '#ffaa00'
              const grey = 'rgba(255,255,255,0.15)'
              const green = '#00cc44'
              const brightGreen = '#00e64d'
              let colors: string[] = []
              if (economyHealth < -60) colors = [red, red, red, red, red]
              else if (economyHealth < -20) colors = [red, red, red, yellow, grey]
              else if (economyHealth < 20) colors = [red, red, yellow, grey, grey]
              else if (economyHealth < 60) colors = [green, green, green, green, green]
              else colors = [brightGreen, brightGreen, brightGreen, brightGreen, brightGreen]
              return colors.map((c, i) => (
                <div key={i} style={{ width: '8px', height: '14px', borderRadius: '2px', background: c }} />
              ))
            })()}
          </div>
        </div>

        {/* Budget — coin icon + number only */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '0 10px',
          borderRight: '1px solid rgba(201,168,76,0.3)',
        }}>
          <span style={{
            fontSize: '16px',
            filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.9))',
          }}>💰</span>
          <span style={{
            fontSize: '16px',
            fontWeight: '900',
            color: '#ff4444',
            fontFamily: 'Georgia, serif',
            textShadow: '0 1px 4px rgba(0,0,0,1), 0 0 10px rgba(255,68,68,0.7)',
          }}>
            {balance}
          </span>
        </div>

        {/* Wealth — bank icon + number only */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '0 10px',
        }}>
          <span style={{
            fontSize: '16px',
            filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.9))',
          }}>🏛️</span>
          <span style={{
            fontSize: '16px',
            fontWeight: '900',
            color: '#f0c040',
            fontFamily: 'Georgia, serif',
            textShadow: '0 1px 4px rgba(0,0,0,1), 0 0 10px rgba(240,192,64,0.7)',
          }}>
            {wealthThousands}
          </span>
        </div>

        {/* Approval — public image */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '0 10px',
          borderLeft: '1px solid rgba(201,168,76,0.3)',
        }}>
          <span style={{
            fontSize: '16px',
            filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.9))',
          }}>👥</span>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
          }}>
            <span style={{
              fontSize: '14px',
              fontWeight: '900',
              color: approvalColor,
              fontFamily: 'Georgia, serif',
              textShadow: `0 1px 4px rgba(0,0,0,1), 0 0 10px ${approvalGlow}`,
              lineHeight: 1,
            }}>
              {approvalValue}%
            </span>
            <div style={{
              width: '36px',
              height: '3px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${approvalValue}%`,
                height: '100%',
                background: approvalColor,
                borderRadius: '2px',
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* ===== STATE OF EMERGENCY INDICATOR ===== */}
      {stateOfEmergency && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '170px',
        zIndex: 25,
          background: 'rgba(220,50,50,0.15)',
          border: '1px solid #c0392b',
          padding: '3px 10px',
          borderRadius: '2px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <span style={{
            fontFamily: "'Special Elite', monospace",
            fontSize: '9px',
            letterSpacing: '1.5px',
            color: '#ff6b6b',
            textTransform: 'uppercase',
            lineHeight: 1,
            fontWeight: 'bold',
          }}>
            STATE OF EMERGENCY
          </span>
          <span style={{
            fontFamily: 'monospace',
            fontSize: '9px',
            color: '#c9a84c',
            lineHeight: 1,
          }}>
            {soeDaysLeft}d left
          </span>
        </div>
      )}

      {/* ===== SVG EMBLEM + WEEK ===== */}
      <div style={{
        position: 'fixed',
        top: '8px',
        right: '12px',
        zIndex: 30,
        textAlign: 'right',
      }}>
        <div style={{
          fontSize: '11px',
          fontWeight: '700',
          color: '#c9a84c',
          letterSpacing: '2px',
          fontFamily: 'Georgia, serif',
          textShadow: '0 1px 3px rgba(0,0,0,0.9)',
        }}>
          WEEK {currentWeek} OF 52
        </div>
        <div style={{
          fontSize: '9px',
          color: 'rgba(201,168,76,0.5)',
          letterSpacing: '1px',
        }}>
          {date}
        </div>
      </div>
    </>
  )
}
