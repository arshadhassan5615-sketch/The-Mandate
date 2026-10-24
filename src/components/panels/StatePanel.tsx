import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { useBillStore } from '../../stores/billStore'
import { useDecreeStore } from '../../stores/decreeStore'
import { buildDecreeRecords, buildLawRecords, type DecreeRecord, type LawRecord } from './stateRecords'
import { useGameStore } from '../../stores/gameStore'
import { buildSituations, type Situation, type Severity, type Trend } from './situations'
import PaperPanel, { PaperTabButton } from './PaperPanel'
import { CAB_BODY, CAB_FONT, CAB_LABEL } from '../ui/cabinet/cabinetStyles'
import { CabinetCard, SeverityDot, StatusPill } from '../ui/cabinet/CabinetParts'
import { rem } from '../../constants/typography'

// State of the Republic: one state paper with the ongoing situations (severity
// and trend, in words), every law decided and every decree signed. Read-only;
// it never shows stat values or effects.

type Tab = 'situations' | 'laws' | 'decrees'

const SEVERITY_COLORS: Record<Severity, string> = {
  Calm: 'var(--sev-calm)',
  Strained: 'var(--sev-strained)',
  Serious: 'var(--sev-serious)',
  Critical: 'var(--sev-critical)',
}

const TREND_MARKS: Record<Trend, { mark: string; color: string }> = {
  Worsening: { mark: '▼', color: 'var(--sev-critical)' },
  Easing: { mark: '▲', color: 'var(--sev-calm)' },
  Holding: { mark: '■', color: 'var(--cab-muted)' },
}

const SCROLL_AREA: CSSProperties = {
  overflowY: 'auto',
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(201,168,76,0.3) transparent',
  padding: '4px 20px 20px',
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

const CARD_BODY: CSSProperties = { padding: '4px 0' }
const LIST_RESET: CSSProperties = { listStyle: 'none', margin: 0, padding: 0 }
const ROW: CSSProperties = { padding: '9px 14px' }
const ROW_RULE: CSSProperties = { borderTop: '1px solid var(--cab-card-edge)' }
const ITEM_TITLE: CSSProperties = {
  fontFamily: CAB_FONT.title,
  fontWeight: 700,
  fontSize: rem(15.5),
  lineHeight: 1.3,
  color: 'var(--cab-title)',
}
const LABEL_SMALL: CSSProperties = { ...CAB_LABEL, fontSize: rem(10) }

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
            controls={tab === 'situations' ? 'state-panel-situations' : undefined}
            label="Situations"
            count={pressing}
            active={tab === 'situations'}
            onSelect={() => setTab('situations')}
            className="state-panel__tab"
          />
          <PaperTabButton
            id="state-tab-laws"
            controls={tab === 'laws' ? 'state-panel-laws' : undefined}
            label="Laws"
            count={laws.length}
            active={tab === 'laws'}
            onSelect={() => setTab('laws')}
            className="state-panel__tab"
          />
          <PaperTabButton
            id="state-tab-decrees"
            controls={tab === 'decrees' ? 'state-panel-decrees' : undefined}
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
        style={SCROLL_AREA}
      >
        {tab === 'situations' && <SituationList situations={situations} />}
        {tab === 'laws' && <LawList laws={laws} />}
        {tab === 'decrees' && <DecreeList decrees={decrees} pendingCount={pendingCount} />}
      </div>
    </PaperPanel>
  )
}

function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <p style={{ ...CAB_BODY, fontStyle: 'italic', color: 'var(--cab-muted)', textAlign: 'center', margin: '18px 0' }}>
      {children}
    </p>
  )
}

function LawList({ laws }: { laws: LawRecord[] }) {
  if (laws.length === 0) return <EmptyNote>No legislation has reached your desk yet.</EmptyNote>
  return (
    <CabinetCard title="Laws Decided" bodyStyle={CARD_BODY}>
      <ol style={LIST_RESET}>
        {laws.map((law, index) => (
          <li key={law.key} style={{ ...ROW, ...(index > 0 ? ROW_RULE : undefined) }}>
            <div style={ITEM_TITLE}>{law.title}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <StatusPill color={law.isLaw ? 'var(--sev-calm)' : 'var(--sev-critical)'}>{law.outcome}</StatusPill>
              <span style={LABEL_SMALL}>Week {law.week}</span>
            </div>
          </li>
        ))}
      </ol>
    </CabinetCard>
  )
}

function DecreeList({ decrees, pendingCount }: { decrees: DecreeRecord[]; pendingCount: number }) {
  return (
    <>
      {pendingCount > 0 && (
        <p style={{ ...CAB_LABEL, fontSize: rem(10), color: 'var(--sev-strained)', margin: '0 0 10px' }}>
          {pendingCount === 1
            ? '1 consequence of your decrees is still to come'
            : `${pendingCount} consequences of your decrees are still to come`}
        </p>
      )}
      {decrees.length === 0 ? (
        <EmptyNote>You have not signed any decrees.</EmptyNote>
      ) : (
        <CabinetCard title="Decrees Signed" bodyStyle={CARD_BODY}>
          <ol style={LIST_RESET}>
            {decrees.map((d, index) => (
              <li key={d.id} style={{ ...ROW, ...(index > 0 ? ROW_RULE : undefined) }}>
                <div style={LABEL_SMALL}>{d.category} · {d.proposedBy}</div>
                <div style={ITEM_TITLE}>{d.title}</div>
                <p style={{ ...CAB_BODY, fontSize: rem(14), color: 'var(--cab-muted)', margin: '4px 0 0' }}>
                  {d.summary}
                </p>
              </li>
            ))}
          </ol>
        </CabinetCard>
      )}
    </>
  )
}

function SituationList({ situations }: { situations: Situation[] }) {
  return (
    <CabinetCard title="Currently Active" bodyStyle={CARD_BODY}>
      <ol style={LIST_RESET}>
        {situations.map((sit, index) => {
          const severityColor = SEVERITY_COLORS[sit.severity]
          const trend = TREND_MARKS[sit.trend]
          return (
            <li key={sit.id} data-testid={`situation-${sit.id}`} style={{ ...ROW, ...(index > 0 ? ROW_RULE : undefined) }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: CAB_FONT.title, fontWeight: 700, fontSize: rem(16), color: severityColor }}>
                  <SeverityDot color={severityColor} />
                  {sit.title}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span data-testid="situation-severity">
                    <StatusPill color={severityColor}>{sit.severity}</StatusPill>
                  </span>
                  <span data-testid="situation-trend">
                    <StatusPill color={trend.color}>
                      <span aria-hidden>{trend.mark} </span>{sit.trend}
                    </StatusPill>
                  </span>
                </span>
              </div>
              <p style={{ ...CAB_BODY, fontSize: rem(14.5), margin: '4px 0 0' }}>{sit.summary}</p>
            </li>
          )
        })}
      </ol>
    </CabinetCard>
  )
}
