import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { useCommitmentStore } from '../../stores/commitmentStore'
import { useNarrativeStore } from '../../stores/narrativeStore'
import { getPortrait } from '../../assets/potraits'
import { charName } from '../narrative/speakers'
import { initialsFor } from '../narrative/initials'
import {
  RESOLUTION_RULES, commitmentStatus,
  type Commitment, type CommitmentStatus, type ResolutionRule,
} from '../../engine/commitments'
import PaperPanel, { PaperTabButton } from './PaperPanel'
import { CAB_BODY, CAB_FONT, CAB_LABEL } from '../ui/cabinet/cabinetStyles'
import { CabinetCard, StatusPill } from '../ui/cabinet/CabinetParts'
import { rem } from '../../constants/typography'

// Your word, on record: one state paper listing every promise the Chancellor has
// given, with the week, the scene, who heard it and, once the story has resolved
// it, a KEPT or BROKEN stamp. Read-only.

type Tab = 'record' | 'resolved'

interface CommitmentsPanelProps {
  onClose: () => void
  rules?: readonly ResolutionRule[]
}

interface Entry {
  commitment: Commitment
  status: CommitmentStatus
}

const PORTRAIT_SIZE = 22

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
const LABEL_SMALL: CSSProperties = { ...CAB_LABEL, fontSize: rem(10) }

const CARD_TITLE: Record<Tab, string> = {
  record: 'Promises on Record',
  resolved: 'Promises Resolved',
}

const EMPTY_ON_RECORD = 'You have given no commitments yet. When you give your word, it is recorded here.'
const EMPTY_RESOLVED = 'No commitment has been tested yet.'

function byNewestWeek(a: Entry, b: Entry): number {
  return b.commitment.week - a.commitment.week
}

export default function CommitmentsPanel({ onClose, rules = RESOLUTION_RULES }: CommitmentsPanelProps) {
  const commitments = useCommitmentStore(s => s.commitments)
  const activeFlags = useNarrativeStore(s => s.activeFlags)
  const [tab, setTab] = useState<Tab>('record')

  const entries = useMemo<Entry[]>(
    () => commitments.map(commitment => ({ commitment, status: commitmentStatus(commitment, activeFlags, rules) })),
    [commitments, activeFlags, rules],
  )
  const onRecord = useMemo(() => entries.filter(e => e.status === 'outstanding').sort(byNewestWeek), [entries])
  const resolved = useMemo(() => entries.filter(e => e.status !== 'outstanding').sort(byNewestWeek), [entries])

  const listed = tab === 'record' ? onRecord : resolved
  // Only the selected tab's panel is rendered, so only the selected tab names it.
  const panelId = `commitments-panel-${tab}`

  return (
    <PaperPanel
      testId="commitments-panel"
      titleId="commitments-panel-title"
      overline="Office of the Chancellor"
      title="Commitments"
      standfirst="Your word, as it was given."
      closeLabel="Close Commitments"
      onClose={onClose}
      tabsLabel="Commitments"
      tabs={
        <>
          <PaperTabButton
            id="commitments-tab-record"
            controls={tab === 'record' ? panelId : undefined}
            label="On record"
            count={onRecord.length}
            active={tab === 'record'}
            onSelect={() => setTab('record')}
            className="commitments-panel__tab"
          />
          <PaperTabButton
            id="commitments-tab-resolved"
            controls={tab === 'resolved' ? panelId : undefined}
            label="Resolved"
            count={resolved.length}
            active={tab === 'resolved'}
            onSelect={() => setTab('resolved')}
            className="commitments-panel__tab"
          />
        </>
      }
    >
      <div
        role="tabpanel"
        id={panelId}
        aria-labelledby={`commitments-tab-${tab}`}
        style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
      >
        <div
          role="region"
          aria-label="Commitments list"
          tabIndex={0}
          style={SCROLL_AREA}
        >
          {listed.length === 0
            ? <EmptyNote>{tab === 'record' ? EMPTY_ON_RECORD : EMPTY_RESOLVED}</EmptyNote>
            : (
              <CabinetCard title={CARD_TITLE[tab]} bodyStyle={CARD_BODY}>
                <CommitmentList entries={listed} />
              </CabinetCard>
            )}
        </div>
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

function CommitmentList({ entries }: { entries: Entry[] }) {
  return (
    <div>
      {entries.map((entry, index) => (
        <CommitmentEntry key={entry.commitment.id} entry={entry} isFirst={index === 0} />
      ))}
    </div>
  )
}

function CommitmentEntry({ entry, isFirst }: { entry: Entry; isFirst: boolean }) {
  const { commitment, status } = entry
  return (
    <article
      data-testid="commitment-entry"
      style={{ padding: '9px 14px', borderTop: isFirst ? undefined : '1px solid var(--cab-card-edge)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <span style={LABEL_SMALL}>{`Week ${commitment.week} · ${commitment.sceneTitle}`}</span>
        <StatusMark status={status} />
      </div>
      <blockquote style={{ ...CAB_BODY, fontStyle: 'italic', margin: '8px 0 10px' }}>
        {`“${commitment.quote}”`}
      </blockquote>
      {commitment.witnesses.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ ...LABEL_SMALL, marginRight: 10 }}>Heard by</span>
          {commitment.witnesses.map(id => <WitnessChip key={id} id={id} />)}
        </div>
      )}
    </article>
  )
}

function StatusMark({ status }: { status: CommitmentStatus }) {
  if (status === 'outstanding') {
    return (
      <span data-testid="commitment-status" data-status={status}>
        <StatusPill color="var(--cab-muted)">On record</StatusPill>
      </span>
    )
  }
  const isKept = status === 'kept'
  return (
    <span data-testid="commitment-status" data-status={status}>
      <StatusPill color={isKept ? 'var(--sev-calm)' : 'var(--sev-critical)'}>{isKept ? 'Kept' : 'Broken'}</StatusPill>
    </span>
  )
}

function WitnessChip({ id }: { id: string }) {
  const portrait = getPortrait(id)
  const name = charName(id)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 12 }}>
      {portrait ? (
        <img
          src={portrait}
          alt=""
          style={{ width: PORTRAIT_SIZE, height: PORTRAIT_SIZE, borderRadius: '50%', objectFit: 'cover' }}
        />
      ) : (
        <span
          aria-hidden
          style={{
            width: PORTRAIT_SIZE, height: PORTRAIT_SIZE, borderRadius: '50%',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: CAB_FONT.label, fontSize: rem(8), color: 'var(--cab-muted)',
            border: '1px solid var(--cab-card-edge)',
          }}
        >
          {initialsFor(name)}
        </span>
      )}
      <span style={{ fontFamily: CAB_FONT.body, fontSize: rem(14), color: 'var(--cab-text)' }}>{name}</span>
    </span>
  )
}
