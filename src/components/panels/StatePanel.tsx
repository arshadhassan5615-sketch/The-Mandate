import { useMemo, useState } from 'react'
import { useBillStore } from '../../stores/billStore'
import { useDecreeStore } from '../../stores/decreeStore'
import { buildDecreeRecords, buildLawRecords, type DecreeRecord, type LawRecord } from './stateRecords'
import { useGameStore } from '../../stores/gameStore'
import { buildSituations, type Situation, type Severity, type Trend } from './situations'
import PaperPanel, { PaperTabButton } from './PaperPanel'
import { OVERLINE, SERIF_BODY } from './paperStyles'

// State of the Republic: one state paper with the ongoing situations (severity
// and trend, in words), every law decided and every decree signed. Read-only;
// it never shows stat values or effects.

type Tab = 'situations' | 'laws' | 'decrees'

const LAW_GREEN = '#3d6a34'

interface StatePanelProps {
  onClose: () => void
}

export default function StatePanel({ onClose }: StatePanelProps) {
  const history = useBillStore(s => s.history)
  const bills = useBillStore(s => s.bills)
  const signedDecrees = useDecreeStore(s => s.signedDecrees)
  const pendingCount = useDecreeStore(s => s.pendingLongTermEffects.length)
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

  return (
    <PaperPanel
      testId="state-panel"
      titleId="state-panel-title"
      overline="Republic of Veltria"
      title="State of the Republic"
      closeLabel="Close State of the Republic"
      onClose={onClose}
      tabsLabel="Records"
      tabs={
        <>
          <PaperTabButton
            id="state-tab-situations"
            controls="state-panel-situations"
            label="Situations"
            count={pressing}
            active={tab === 'situations'}
            onSelect={() => setTab('situations')}
            className="state-panel__tab"
          />
          <PaperTabButton
            id="state-tab-laws"
            controls="state-panel-laws"
            label="Laws"
            count={laws.length}
            active={tab === 'laws'}
            onSelect={() => setTab('laws')}
            className="state-panel__tab"
          />
          <PaperTabButton
            id="state-tab-decrees"
            controls="state-panel-decrees"
            label="Decrees"
            count={decrees.length}
            active={tab === 'decrees'}
            onSelect={() => setTab('decrees')}
            className="state-panel__tab"
          />
        </>
      }
    >
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
    </PaperPanel>
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
