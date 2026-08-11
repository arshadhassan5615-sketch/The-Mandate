import { useState, useMemo } from 'react'
import type { BudgetAllocations } from '../types/gameState'
import { useGameStore } from '../stores/gameStore'
import { useWeekStore } from '../stores/weekStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import { computeBudgetModifiers, aggregateModifiers } from '../engine/budgetEffects'

// ─── Config ───────────────────────────────────────────────────────────────────

interface SliderConfig {
  key: keyof Pick<BudgetAllocations,
    'military' | 'debtService' | 'govtAdmin' | 'infrastructure' |
    'education' | 'healthcare' | 'welfare' | 'bniSecurity'>
  label: string
  min: number
  max: number
  warning?: string   // shown when value is at floor
}

const SLIDERS: SliderConfig[] = [
  { key: 'military',       label: 'Military',         min: 70,  max: 180, warning: 'COUP RISK AT MINIMUM' },
  { key: 'debtService',    label: 'Debt Service',     min: 50,  max: 120, warning: 'DEFAULT RISK AT MINIMUM' },
  { key: 'govtAdmin',      label: 'Govt. Admin.',     min: 35,  max: 100 },
  { key: 'infrastructure', label: 'Infrastructure',   min: 25,  max: 90  },
  { key: 'education',      label: 'Education',        min: 20,  max: 80  },
  { key: 'healthcare',     label: 'Healthcare',       min: 20,  max: 70  },
  { key: 'welfare',        label: 'Welfare',          min: 10,  max: 50,  warning: 'UNREST RISK AT MINIMUM' },
  { key: 'bniSecurity',    label: 'BNI / Security',   min: 10,  max: 40  },
]

const STAT_LABELS: Record<string, string> = {
  'nation.economyHealth':        'Economy Health',
  'nation.unemployment':         'Unemployment',
  'nation.inflation':            'Inflation',
  'nation.nationalDebt':         'National Debt',
  'nation.corruption':           'Corruption',
  'nation.militaryReadiness':    'Military Readiness',
  'nation.publicOrder':          'Public Order',
  'nation.pressFreedom':         'Press Freedom',
  'nation.civilLiberties':       'Civil Liberties',
  'nation.internationalStanding':'Intl. Standing',
  'factions.halvekists':         'Halvekists',
  'factions.workersCoalition':   "Workers' Coalition",
  'factions.reformists':         'Reformists',
  'factions.ironCovenant':       'Iron Covenant',
  'factions.church':             'Church',
  'factions.businessClass':      'Business Class',
  'factions.dravenni':           'Dravenni',
  'personal.marriageHealth':     'Marriage Health',
  'personal.lioraRelationship':  'Liora Relationship',
  'personal.tomasWellbeing':     'Tomas Wellbeing',
  'personal.personalWealth':     'Personal Wealth',
  'personal.publicImage':        'Public Image',
  'personal.moralCompass':       'Moral Compass',
}

// Stats where a higher value is bad (so positive delta is red)
const INVERSE_STATS = new Set([
  'nation.unemployment', 'nation.inflation', 'nation.nationalDebt', 'nation.corruption',
])

// ─── Subcomponents ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: "'Georgia', serif",
      fontSize: '10px',
      letterSpacing: '3px',
      color: '#c9a84c',
      textTransform: 'uppercase',
      fontWeight: '700',
      borderBottom: '1px solid rgba(201,168,76,0.2)',
      paddingBottom: '6px',
      marginBottom: '12px',
    }}>
      {children}
    </p>
  )
}

function Rule() {
  return <div style={{ height: '1px', background: 'rgba(201,168,76,0.2)', margin: '0.5rem 0 1rem' }} />
}

function RevenueRow({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid rgba(200,144,42,0.07)' }}>
      <span style={{ fontFamily: "'Georgia', serif", fontSize: '12px', color: '#e8d5a3', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontFamily: "'Georgia', serif", fontSize: '12px', fontWeight: '700', color: '#c9a84c', letterSpacing: '0.08em' }}>{value}M</span>
    </div>
  )
}

interface SliderRowProps {
  config: SliderConfig
  value: number
  baseline: number
  totalExpenditure: number
  onChange: (v: number) => void
}

function SliderRow({ config, value, baseline, totalExpenditure, onChange }: SliderRowProps) {
  const delta = value - baseline
  const barPct = totalExpenditure > 0 ? (value / totalExpenditure) * 100 : 0
  const atMin = value <= config.min

  return (
    <div style={{ marginBottom: '1.1rem' }}>
      {/* Label row */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.3rem', gap: '0.5rem' }}>
        <span style={{ fontFamily: "'Georgia', serif", fontSize: '13px', fontWeight: '600', color: atMin ? 'var(--accent-red)' : '#e8d5a3', letterSpacing: '0.5px', flex: 1 }}>
          {config.label}
          {atMin && config.warning && (
            <span style={{ marginLeft: '0.8em', fontSize: '9px', color: 'var(--accent-red)', letterSpacing: '0.12em' }}>
              ⚠ {config.warning}
            </span>
          )}
        </span>
        <span style={{ fontFamily: "'Georgia', serif", fontSize: '12px', fontWeight: '700', color: '#c9a84c', letterSpacing: '0.08em', minWidth: '3.5rem', textAlign: 'right' }}>
          {value}M ₭
        </span>
        <span style={{
          fontFamily: "'Georgia', serif",
          fontSize: '11px',
          letterSpacing: '0.06em',
          minWidth: '3.2rem',
          textAlign: 'right',
          color: delta === 0 ? 'var(--muted)' : delta > 0 ? '#c47a3a' : 'var(--accent-green)',
        }}>
          {delta === 0 ? '—' : `${delta > 0 ? '+' : ''}${delta}M`}
        </span>
      </div>

      {/* Slider */}
      <input
        type="range"
        className="budget-slider"
        min={config.min}
        max={config.max}
        step={5}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />

      {/* Bar visualization */}
      <div style={{ marginTop: '0.35rem', height: '5px', background: 'rgba(200,144,42,0.08)', position: 'relative' }}>
        {/* Baseline marker — gold diamond */}
        <div style={{
          position: 'absolute',
          left: `${(baseline / config.max) * 100}%`,
          top: '-2px',
          width: '0',
          height: '0',
          borderLeft: '4px solid transparent',
          borderRight: '4px solid transparent',
          borderBottom: '6px solid rgba(200,144,42,0.5)',
          transform: 'rotate(0deg)',
        }} />
        {/* Current fill */}
        <div style={{
          height: '100%',
          width: `${Math.min(barPct, 100)}%`,
          background: atMin ? 'var(--accent-red)' : delta > 0 ? 'rgba(196,122,58,0.7)' : delta < 0 ? 'rgba(74,107,58,0.7)' : 'rgba(200,144,42,0.5)',
          transition: 'width 0.1s ease, background 0.15s ease',
        }} />
      </div>
    </div>
  )
}

function ConsequenceRow({ stat, value }: { stat: string; value: number }) {
  const isInverse = INVERSE_STATS.has(stat)
  const isGood = isInverse ? value < 0 : value > 0
  const color = isGood ? 'var(--accent-green)' : 'var(--accent-red)'
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0', borderBottom: '1px solid rgba(200,144,42,0.06)' }}>
      <span style={{ fontFamily: "'Georgia', serif", fontSize: '11px', color: '#e8d5a3', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
        {STAT_LABELS[stat] ?? stat}
      </span>
      <span style={{ fontFamily: "'Georgia', serif", fontSize: '11px', color, letterSpacing: '0.08em', minWidth: '3rem', textAlign: 'right', fontWeight: '700' }}>
        {value > 0 ? '+' : ''}{value}
      </span>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function BudgetInterface() {
  const storedBudget  = useGameStore(s => s.budget)
  const { currentWeek } = useGameStore()
  const applyBudget   = useGameStore(s => s.applyBudget)
  const { advanceQueue, sceneQueue, currentQueueIndex, returnToMap } = useWeekStore()

  const [draft, setDraft] = useState<BudgetAllocations>(() => ({ ...storedBudget }))

  function setLine(key: keyof BudgetAllocations, value: number) {
    setDraft(prev => ({ ...prev, [key]: value }))
  }

  // ── Computed totals ────────────────────────────────────────────────────────
  const totalRevenue = draft.taxRevenue + draft.stateIndustry + draft.customsTariffs + draft.foreignAid

  const totalExpenditure = SLIDERS.reduce((sum, s) => sum + draft[s.key], 0)

  const deficit = totalExpenditure - totalRevenue

  const deficitColor = deficit <= 0
    ? 'var(--accent-green)'
    : deficit <= 65
    ? 'var(--amber-dim)'
    : deficit <= 100
    ? '#c47a3a'
    : 'var(--accent-red)'

  // ── Projected consequences ─────────────────────────────────────────────────
  const projectedMods = useMemo(
    () => computeBudgetModifiers(storedBudget, draft),
    [storedBudget, draft],
  )
  const aggregated = useMemo(() => aggregateModifiers(projectedMods.modifiers), [projectedMods])

  // ── Queue label ────────────────────────────────────────────────────────────
  const isLastScene = currentQueueIndex >= sceneQueue.length - 1
  const continueLabel = isLastScene
    ? (returnToMap ? 'Commit & Continue →' : 'Commit & Proceed to Evening Review →')
    : `Commit & Continue (${currentQueueIndex + 2}/${sceneQueue.length}) →`

  // ── Commit ─────────────────────────────────────────────────────────────────
  function handleCommit() {
    applyBudget(draft)
    useNarrativeStore.getState().addFlags(['budget_finalized'])
    advanceQueue()
  }

  function handleReset() {
    setDraft({ ...storedBudget })
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden fixed inset-0 z-[1]" style={{ background: 'rgba(8,6,4,0.92)', paddingTop: '48px' }}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between px-8 py-3" style={{ borderBottom: '1px solid rgba(201,168,76,0.25)' }}>
        <span style={{ fontFamily: "'Georgia', serif", fontSize: '11px', letterSpacing: '2px', color: 'rgba(201,168,76,0.7)', textTransform: 'uppercase' }}>
          The Mandate — Republic of Veltria, 1963
        </span>
        <span style={{ fontFamily: "'Georgia', serif", fontSize: '11px', letterSpacing: '2px', color: 'rgba(201,168,76,0.7)', textTransform: 'uppercase' }}>
          Week {currentWeek} · Budget Review
        </span>
      </div>

      {/* ── Body ────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden" style={{ paddingRight: '60px' }}>

        {/* ── Left: Revenue + Summary ─────────────────────────── */}
        <div
          className="hidden md:flex flex-col shrink-0 overflow-y-auto"
          style={{ borderColor: 'rgba(201,168,76,0.25)', borderRight: '1px solid rgba(201,168,76,0.25)', width: '230px', padding: '1.8rem 1.4rem' }}
        >
          {/* Document letterhead */}
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontFamily: "'Georgia', serif", fontSize: '11px', letterSpacing: '2px', color: 'rgba(201,168,76,0.7)', textTransform: 'uppercase', lineHeight: '1.8' }}>
              Republic of Veltria<br />
              Office of the Chancellor<br />
              Fiscal Year 1963–64
            </p>
            <div style={{ margin: '0.6rem 0', height: '2px', background: 'var(--border)' }} />
            <p style={{
              background: 'rgba(139,0,0,0.2)',
              border: '1px solid rgba(139,0,0,0.5)',
              color: '#ff6b6b',
              fontSize: '9px',
              letterSpacing: '2px',
              padding: '3px 8px',
              borderRadius: '2px',
              textTransform: 'uppercase',
              display: 'inline-block',
            }}>
              EYES ONLY — CLASSIFIED
            </p>
          </div>

          <SectionLabel>Revenue</SectionLabel>
          <Rule />
          <RevenueRow label="Tax Revenue"      value={draft.taxRevenue}     />
          <RevenueRow label="State Industries" value={draft.stateIndustry}  />
          <RevenueRow label="Customs & Tariffs"value={draft.customsTariffs} />
          <RevenueRow label="Foreign Aid"      value={draft.foreignAid}     />
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', marginTop: '8px', borderTop: '1px solid rgba(201,168,76,0.3)' }}>
            <span style={{ fontFamily: "'Georgia', serif", fontSize: '14px', fontWeight: '800', color: '#e8d5a3', letterSpacing: '0.08em' }}>TOTAL</span>
            <span style={{ fontFamily: "'Georgia', serif", fontSize: '14px', fontWeight: '800', color: '#c9a84c', letterSpacing: '0.08em' }}>{totalRevenue}M ₭</span>
          </div>

          <div style={{ margin: '1.2rem 0 0.8rem', height: '1px', background: 'var(--border)' }} />

          <SectionLabel>Fiscal Summary</SectionLabel>

          {/* Expenditure total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
            <span style={{ fontFamily: "'Georgia', serif", fontSize: '12px', color: '#e8d5a3', letterSpacing: '0.04em' }}>Expenditure</span>
            <span style={{ fontFamily: "'Georgia', serif", fontSize: '12px', fontWeight: '700', color: '#c9a84c', letterSpacing: '0.06em' }}>{totalExpenditure}M</span>
          </div>

          {/* Deficit */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', marginTop: '0.25rem', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontFamily: "'Georgia', serif", fontSize: '12px', color: '#e8d5a3', letterSpacing: '0.06em' }}>
              {deficit <= 0 ? 'SURPLUS' : 'DEFICIT'}
            </span>
            <span style={{ fontFamily: "'Georgia', serif", fontSize: '12px', color: deficitColor, letterSpacing: '0.08em', fontWeight: '700' }}>
              {deficit > 0 ? '-' : '+'}{Math.abs(deficit)}M ₭
            </span>
          </div>

          {/* Debt */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
            <span style={{ fontFamily: "'Georgia', serif", fontSize: '12px', color: '#e8d5a3', letterSpacing: '0.04em' }}>National Debt</span>
            <span style={{ fontFamily: "'Georgia', serif", fontSize: '12px', fontWeight: '700', color: '#c9a84c', letterSpacing: '0.06em' }}>340M ₭</span>
          </div>

          {deficit > 65 && (
            <p style={{ fontFamily: "'Georgia', serif", fontSize: '10px', letterSpacing: '0.1em', color: 'var(--accent-red)', textTransform: 'uppercase', marginTop: '0.8rem', lineHeight: 1.6 }}>
              ⚠ Deficit exceeds baseline. Debt growth accelerating.
            </p>
          )}

          {deficit <= 0 && (
            <p style={{ fontFamily: "'Georgia', serif", fontSize: '10px', letterSpacing: '0.1em', color: 'var(--accent-green)', textTransform: 'uppercase', marginTop: '0.8rem', lineHeight: 1.6 }}>
              ✓ Budget balanced. Debt service sustainable.
            </p>
          )}
        </div>

        {/* ── Centre: Expenditure sliders ──────────────────────── */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto budget-sliders" style={{ padding: '1.8rem 2rem' }}>

            <div style={{ marginBottom: '1.5rem' }}>
              <SectionLabel>Expenditure Allocation</SectionLabel>
              <Rule />
              <div style={{
                fontSize: '10px',
                color: 'rgba(201,168,76,0.4)',
                letterSpacing: '1px',
                fontStyle: 'italic',
                marginBottom: '12px',
                paddingLeft: '4px',
              }}>
                Drag sliders to adjust · Amber marker shows previous allocation
              </div>
            </div>

            {SLIDERS.map(config => (
              <SliderRow
                key={config.key}
                config={config}
                value={draft[config.key]}
                baseline={storedBudget[config.key]}
                totalExpenditure={totalExpenditure}
                onChange={v => setLine(config.key, v)}
              />
            ))}

            {/* Total row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', marginTop: '8px', borderTop: '1px solid rgba(201,168,76,0.3)' }}>
              <span style={{ fontFamily: "'Georgia', serif", fontSize: '14px', fontWeight: '800', color: '#e8d5a3', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Total Expenditure
              </span>
              <span style={{ fontFamily: "'Georgia', serif", fontSize: '14px', fontWeight: '800', color: '#c9a84c', letterSpacing: '0.08em' }}>
                {totalExpenditure}M ₭
              </span>
            </div>
          </div>

          {/* Commit bar */}
          <div className="shrink-0 flex items-center justify-between px-8 py-4" style={{ borderTop: '1px solid rgba(201,168,76,0.25)' }}>
            <button
              onClick={handleReset}
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: '11px',
                letterSpacing: '2px',
                color: 'rgba(201,168,76,0.7)',
                textTransform: 'uppercase',
                background: 'transparent',
                border: '1px solid rgba(201,168,76,0.4)',
                padding: '12px 24px',
                cursor: 'pointer',
              }}
            >
              Reset to Current
            </button>
            <button
              className="choice-btn"
              onClick={handleCommit}
              style={{
                width: 'auto',
                minWidth: '300px',
                border: '2px solid #c9a84c',
                color: '#1a1410',
                background: '#c9a84c',
                fontFamily: "'Georgia', serif",
                fontWeight: '700',
                letterSpacing: '1px',
                padding: '12px 32px',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#dbb960')}
              onMouseLeave={e => (e.currentTarget.style.background = '#c9a84c')}
            >
              {continueLabel}
            </button>
          </div>
        </div>

        {/* ── Right: Projected consequences ───────────────────── */}
        <div
          className="hidden lg:flex flex-col shrink-0 overflow-y-auto"
          style={{ borderLeft: '1px solid rgba(201,168,76,0.25)', width: '200px', padding: '1.8rem 1.2rem', maxWidth: '200px', overflowX: 'hidden' }}
        >
          <SectionLabel>Projected Effects</SectionLabel>
          <Rule />

          {aggregated.size === 0 ? (
            <p style={{ fontFamily: "'Georgia', serif", fontSize: '11px', color: '#e8d5a3', letterSpacing: '0.04em', lineHeight: 1.6 }}>
              No changes from current allocation.
            </p>
          ) : (
            Array.from(aggregated.entries()).map(([stat, value]) => (
              <ConsequenceRow key={stat} stat={stat} value={value} />
            ))
          )}

          <div style={{ marginTop: '2rem' }}>
            <Rule />
            <p style={{ fontFamily: "'Georgia', serif", fontSize: '9px', letterSpacing: '0.1em', color: 'rgba(201,168,76,0.4)', lineHeight: 1.8, textTransform: 'uppercase' }}>
              Effects are estimates. Actual outcomes depend on political conditions and implementation.
            </p>
          </div>
        </div>

      </div>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between px-8 py-3" style={{ borderTop: '1px solid rgba(201,168,76,0.25)' }}>
        <span style={{ fontFamily: "'Georgia', serif", fontSize: '9px', letterSpacing: '2px', color: 'rgba(201,168,76,0.4)', textTransform: 'uppercase' }}>
          STATUS: ACTIVE · WEEK {currentWeek}
        </span>
        <span style={{ fontFamily: "'Georgia', serif", fontSize: '9px', color: 'rgba(255,255,255,0.2)', letterSpacing: '1px' }}>
          THE MANDATE — V0.0.1 · CTRL+D — DEBUG
        </span>
      </div>
    </div>
  )
}
