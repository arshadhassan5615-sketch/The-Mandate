import { useEffect, useMemo, useState } from 'react'
import { useBillStore } from '../../stores/billStore'
import { useDecreeStore } from '../../stores/decreeStore'
import { useIsMobile } from '../../hooks/useIsMobile'
import { Z } from '../../constants/zIndex'
import veltriaSeal from '../../assets/images/veltria_seal.png'
import { buildDecreeRecords, buildLawRecords, type DecreeRecord, type LawRecord } from './stateRecords'
import { useGameStore } from '../../stores/gameStore'
import { buildSituations, type Situation, type Severity, type Trend } from './situations'

// State of the Republic: one state paper with the ongoing situations (severity
// and trend, in words), every law decided and every decree signed. Read-only;
// it never shows stat values or effects.

type Tab = 'situations' | 'laws' | 'decrees'

const SERIF_BODY = "'Crimson Text', Georgia, serif"
const LAW_GREEN = '#3d6a34'

const OVERLINE: React.CSSProperties = {
  fontFamily: 'var(--font-ui)',
  fontSize: '10px',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--doc-ink-muted)',
}

interface StatePanelProps {
  onClose: () => void
}

export default function StatePanel({ onClose }: StatePanelProps) {
  const history = useBillStore(s => s.history)
  const bills = useBillStore(s => s.bills)
  const signedDecrees = useDecreeStore(s => s.signedDecrees)
  const pendingCount = useDecreeStore(s => s.pendingLongTermEffects.length)
  const isMobile = useIsMobile()
  const [tab, setTab] = useState<Tab>('situations')
  const nation = useGameStore(s => s.nation)
  const currentWeek = useGameStore(s => s.currentWeek)
  const economyHistory = useGameStore(s => s.economyHistory)
  const debtHistory = useGameStore(s => s.debtHistory)
  const inflationHistory = useGameStore(s => s.inflationHistory)
  const publicOrderHistory = useGameStore(s => s.publicOrderHistory)

  const laws = useMemo(() => buildLawRecords(history, bills), [history, bills])
  const decrees = useMemo(() => buildDecreeRecords(signedDecrees), [signedDecrees])
  const situations = useMemo(
    () => buildSituations({ nation, currentWeek, economyHistory, debtHistory, inflationHistory, publicOrderHistory }),
    [nation, currentWeek, economyHistory, debtHistory, inflationHistory, publicOrderHistory],
  )
  const pressing = situations.filter(x => x.severity !== 'Calm').length

  // Capture phase so Escape closes this panel only, not the next overlay
  // in App's Escape chain as well.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopImmediatePropagation()
      onClose()
    }
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [onClose])

  const placement: React.CSSProperties = isMobile
    ? { left: 8, right: 8, top: 84, bottom: 68 }
    : { left: 80, top: 96, width: 'min(440px, calc(100vw - 112px))', maxHeight: 'calc(100vh - 120px)' }

  return (
    <div
      role="dialog"
      aria-labelledby="state-panel-title"
      data-testid="state-panel"
      style={{
        position: 'fixed',
        ...placement,
        zIndex: Z.panel,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--doc-paper)',
        color: 'var(--doc-ink)',
        border: '1px solid var(--doc-paper-edge)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.55), inset 0 0 60px rgba(120,90,40,0.12)',
        borderRadius: '2px',
        overflow: 'hidden',
      }}
    >
      <header style={{ padding: '18px 22px 0', flexShrink: 0, position: 'relative' }}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close State of the Republic"
          className="state-panel__close"
          style={{
            position: 'absolute', top: 10, right: 10, zIndex: 1,
            width: 32, height: 32, border: 'none', background: 'transparent',
            color: 'var(--doc-ink-muted)', fontSize: '22px', lineHeight: 1, cursor: 'pointer',
          }}
        >
          ×
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={veltriaSeal} alt="" style={{ width: 40, height: 40, opacity: 0.75 }} />
          <div>
            <div style={OVERLINE}>Republic of Veltria</div>
            <h2
              id="state-panel-title"
              style={{
                margin: '2px 0 0',
                fontFamily: 'var(--font-headline)',
                fontSize: '22px',
                lineHeight: 1.15,
                color: 'var(--doc-ink)',
              }}
            >
              State of the Republic
            </h2>
          </div>
        </div>

        <div role="tablist" aria-label="Records" style={{ display: 'flex', gap: '20px', marginTop: '16px', borderBottom: '1px solid var(--doc-rule)' }}>
          <TabButton id="situations" label="Situations" count={pressing} active={tab === 'situations'} onSelect={setTab} />
          <TabButton id="laws" label="Laws" count={laws.length} active={tab === 'laws'} onSelect={setTab} />
          <TabButton id="decrees" label="Decrees" count={decrees.length} active={tab === 'decrees'} onSelect={setTab} />
        </div>
      </header>

      <div
        role="tabpanel"
        id={`state-panel-${tab}`}
        aria-labelledby={`state-tab-${tab}`}
        style={{ overflowY: 'auto', padding: '6px 22px 20px', flex: 1, minHeight: 0 }}
      >
        {tab === 'situations' && <SituationList situations={situations} />}
        {tab === 'laws' && <LawList laws={laws} />}
        {tab === 'decrees' && <DecreeList decrees={decrees} pendingCount={pendingCount} />}
      </div>
    </div>
  )
}

interface TabButtonProps {
  id: Tab
  label: string
  count: number
  active: boolean
  onSelect: (tab: Tab) => void
}

function TabButton({ id, label, count, active, onSelect }: TabButtonProps) {
  return (
    <button
      type="button"
      role="tab"
      id={`state-tab-${id}`}
      aria-selected={active}
      aria-controls={`state-panel-${id}`}
      onClick={() => onSelect(id)}
      className="state-panel__tab"
      style={{
        ...OVERLINE,
        fontSize: '11px',
        color: active ? 'var(--doc-ink)' : 'var(--doc-ink-muted)',
        background: 'transparent',
        border: 'none',
        borderBottom: `2px solid ${active ? 'var(--oxblood)' : 'transparent'}`,
        padding: '6px 0 8px',
        marginBottom: '-1px',
        cursor: 'pointer',
      }}
    >
      {label} <span style={{ fontFamily: SERIF_BODY, letterSpacing: 0 }}>({count})</span>
    </button>
  )
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: SERIF_BODY, fontStyle: 'italic', fontSize: '16px', color: 'var(--doc-ink-muted)', margin: '18px 0' }}>
      {children}
    </p>
  )
}

function LawList({ laws }: { laws: LawRecord[] }) {
  if (laws.length === 0) return <EmptyNote>No legislation has reached your desk yet.</EmptyNote>
  return (
    <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {laws.map(law => (
        <li key={law.key} style={{ padding: '12px 0', borderBottom: '1px solid var(--doc-rule)' }}>
          <div style={{ fontFamily: SERIF_BODY, fontSize: '17px', fontWeight: 600, lineHeight: 1.3 }}>{law.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
            <span
              style={{
                ...OVERLINE,
                color: law.isLaw ? LAW_GREEN : 'var(--oxblood)',
                border: `1px solid ${law.isLaw ? LAW_GREEN : 'var(--oxblood)'}`,
                padding: '1px 6px',
                borderRadius: '2px',
              }}
            >
              {law.outcome}
            </span>
            <span style={OVERLINE}>Week {law.week}</span>
          </div>
        </li>
      ))}
    </ol>
  )
}

function DecreeList({ decrees, pendingCount }: { decrees: DecreeRecord[]; pendingCount: number }) {
  return (
    <>
      {pendingCount > 0 && (
        <p style={{ ...OVERLINE, letterSpacing: '0.08em', margin: '14px 0 4px', color: 'var(--oxblood)' }}>
          {pendingCount === 1
            ? '1 consequence of your decrees is still to come'
            : `${pendingCount} consequences of your decrees are still to come`}
        </p>
      )}
      {decrees.length === 0 ? (
        <EmptyNote>You have not signed any decrees.</EmptyNote>
      ) : (
        <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {decrees.map(d => (
            <li key={d.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--doc-rule)' }}>
              <div style={OVERLINE}>{d.category} · {d.proposedBy}</div>
              <div style={{ fontFamily: SERIF_BODY, fontSize: '17px', fontWeight: 600, lineHeight: 1.3, marginTop: '2px' }}>{d.title}</div>
              <p style={{ fontFamily: SERIF_BODY, fontSize: '15px', lineHeight: 1.45, margin: '4px 0 0', color: 'var(--doc-ink-muted)' }}>
                {d.summary}
              </p>
            </li>
          ))}
        </ol>
      )}
    </>
  )
}

const SEVERITY_COLORS: Record<Severity, string> = {
  Calm: '#3d6a34',
  Strained: '#8a621c',
  Serious: '#a0522d',
  Critical: 'var(--oxblood)',
}

const TREND_MARKS: Record<Trend, { mark: string; color: string }> = {
  Worsening: { mark: '▼', color: 'var(--oxblood)' },
  Easing: { mark: '▲', color: '#3d6a34' },
  Holding: { mark: '■', color: 'var(--doc-ink-muted)' },
}

function SituationList({ situations }: { situations: Situation[] }) {
  return (
    <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {situations.map(sit => {
        const trend = TREND_MARKS[sit.trend]
        return (
          <li key={sit.id} data-testid={`situation-${sit.id}`} style={{ padding: '12px 0', borderBottom: '1px solid var(--doc-rule)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: SERIF_BODY, fontSize: '17px', fontWeight: 600, lineHeight: 1.3 }}>{sit.title}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  data-testid="situation-severity"
                  style={{
                    ...OVERLINE,
                    color: SEVERITY_COLORS[sit.severity],
                    border: `1px solid ${SEVERITY_COLORS[sit.severity]}`,
                    padding: '1px 6px',
                    borderRadius: '2px',
                  }}
                >
                  {sit.severity}
                </span>
                <span data-testid="situation-trend" style={{ ...OVERLINE, color: trend.color }}>
                  <span aria-hidden>{trend.mark} </span>{sit.trend}
                </span>
              </span>
            </div>
            <p style={{ fontFamily: SERIF_BODY, fontSize: '15px', lineHeight: 1.45, margin: '4px 0 0', color: 'var(--doc-ink-muted)' }}>
              {sit.summary}
            </p>
          </li>
        )
      })}
    </ol>
  )
}
