import { useMemo, useState } from 'react'
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
import { OVERLINE, SERIF_BODY } from './paperStyles'
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

const STAMP: React.CSSProperties = {
  fontFamily: 'var(--font-ui)',
  fontSize: rem(10),
  fontWeight: 700,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  padding: '2px 7px',
  border: '1.5px solid currentColor',
  borderRadius: 2,
  transform: 'rotate(-4deg)',
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
          style={{ overflowY: 'auto', padding: '6px 22px 20px', flex: 1, minHeight: 0 }}
        >
          {listed.length === 0
            ? <EmptyNote>{tab === 'record' ? EMPTY_ON_RECORD : EMPTY_RESOLVED}</EmptyNote>
            : <CommitmentList entries={listed} />}
        </div>
      </div>
    </PaperPanel>
  )
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: SERIF_BODY, fontStyle: 'italic', fontSize: rem(14), color: 'var(--doc-ink-muted)', margin: 0, padding: '18px 0' }}>
      {children}
    </p>
  )
}

function CommitmentList({ entries }: { entries: Entry[] }) {
  return (
    <div>
      {entries.map((entry, index) => (
        <CommitmentEntry key={entry.commitment.id} entry={entry} isLast={index === entries.length - 1} />
      ))}
    </div>
  )
}

function CommitmentEntry({ entry, isLast }: { entry: Entry; isLast: boolean }) {
  const { commitment, status } = entry
  return (
    <article
      data-testid="commitment-entry"
      style={{ padding: '14px 0', borderBottom: isLast ? 'none' : '1px solid var(--doc-rule)' }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '10px' }}>
        <span style={OVERLINE}>{`Week ${commitment.week} · ${commitment.sceneTitle}`}</span>
        <StatusMark status={status} />
      </div>
      <blockquote
        style={{ margin: '8px 0 10px', fontFamily: SERIF_BODY, fontStyle: 'italic', fontSize: rem(16), lineHeight: 1.45, color: 'var(--doc-ink)' }}
      >
        {`“${commitment.quote}”`}
      </blockquote>
      {commitment.witnesses.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ ...OVERLINE, marginRight: '10px' }}>Heard by</span>
          {commitment.witnesses.map(id => <WitnessChip key={id} id={id} />)}
        </div>
      )}
    </article>
  )
}

function StatusMark({ status }: { status: CommitmentStatus }) {
  if (status === 'outstanding') {
    return <span data-testid="commitment-status" data-status={status} style={OVERLINE}>On record</span>
  }
  const isKept = status === 'kept'
  return (
    <span
      data-testid="commitment-status"
      data-status={status}
      style={{ ...STAMP, color: isKept ? 'var(--law-green)' : 'var(--oxblood)' }}
    >
      {isKept ? 'Kept' : 'Broken'}
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
            fontFamily: 'var(--font-ui)', fontSize: rem(8), color: 'var(--doc-ink-muted)',
            border: '1px solid var(--doc-rule)',
          }}
        >
          {initialsFor(name)}
        </span>
      )}
      <span style={{ fontFamily: SERIF_BODY, fontSize: rem(13) }}>{name}</span>
    </span>
  )
}
