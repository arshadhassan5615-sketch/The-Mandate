import { useMemo, useState } from 'react'
import { useBillStore } from '../../stores/billStore'
import { useGameStore } from '../../stores/gameStore'
import { weekToDate } from '../../engine/dates'
import { ACTS, PUBLIC_EVENTS, calendarWeeks, type CalendarWeek } from '../../engine/calendar'
import type { Bill } from '../../types/bills'
import PaperPanel from './PaperPanel'
import { OVERLINE, SERIF_BODY } from './paperStyles'
import { rem } from '../../constants/typography'

// The year of the mandate on one state paper: fifty-two weeks in four acts. Lived
// weeks show what was decided in words, the current week is ringed, and publicly
// scheduled events are marked. Future bills are never named. Read-only.

const PAST_FILL = 'rgba(60,40,20,0.10)'

const STATE_LABELS: Record<CalendarWeek['state'], string> = {
  current: 'this week',
  past: 'past',
  future: 'upcoming',
}

interface CalendarPanelProps {
  onClose: () => void
}

function billTitlesOf(bills: readonly Bill[]): Record<string, string> {
  return Object.fromEntries(bills.map(bill => [bill.id, bill.title || bill.shortName]))
}

export default function CalendarPanel({ onClose }: CalendarPanelProps) {
  const currentWeek = useGameStore(s => s.currentWeek)
  const history = useBillStore(s => s.history)
  const bills = useBillStore(s => s.bills)
  // The week under the pointer or keyboard focus; the detail line falls back to the current week.
  const [previewWeek, setPreviewWeek] = useState<number | null>(null)

  const weeks = useMemo(
    () => calendarWeeks(currentWeek, history, billTitlesOf(bills)),
    [currentWeek, history, bills],
  )
  const shownWeek = weeks.find(w => w.week === (previewWeek ?? currentWeek))

  return (
    <PaperPanel
      testId="calendar-panel"
      titleId="calendar-panel-title"
      overline="Republic of Veltria"
      title="The Year 1963"
      standfirst={`Week ${currentWeek} · ${weekToDate(currentWeek)}`}
      closeLabel="Close Calendar"
      onClose={onClose}
      desktopWidth="min(520px, calc(100vw - 112px))"
      headerPadding="18px 22px 12px"
    >
      <div style={{ overflowY: 'auto', padding: '0 22px 12px', flex: 1, minHeight: 0 }}>
        {ACTS.map(act => (
          <section key={act.number} style={{ paddingTop: 12 }}>
            <h3 style={{ ...OVERLINE, fontSize: rem(11), fontWeight: 400, margin: '0 0 8px' }}>{act.title}</h3>
            <WeekGrid
              weeks={weeks.filter(w => w.week >= act.firstWeek && w.week <= act.lastWeek)}
              onPreview={setPreviewWeek}
            />
          </section>
        ))}
      </div>

      <WeekDetail week={shownWeek} />
    </PaperPanel>
  )
}

interface WeekGridProps {
  weeks: CalendarWeek[]
  onPreview: (week: number | null) => void
}

function WeekGrid({ weeks, onPreview }: WeekGridProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(32px, 1fr))', gap: 4 }}>
      {weeks.map(week => <WeekCell key={week.week} week={week} onPreview={onPreview} />)}
    </div>
  )
}

interface WeekCellProps {
  week: CalendarWeek
  onPreview: (week: number | null) => void
}

function WeekCell({ week, onPreview }: WeekCellProps) {
  const isCurrent = week.state === 'current'
  const hasPublicEvent = PUBLIC_EVENTS.some(event => event.week === week.week)
  const hasNotes = week.notes.length > 0
  const stateLabel = STATE_LABELS[week.state]
  const label = `Week ${week.week}, ${week.date}, ${stateLabel}${hasNotes ? `: ${week.notes.join('; ')}` : ''}`

  return (
    <button
      type="button"
      data-testid={`week-${week.week}`}
      data-state={week.state}
      aria-label={label}
      aria-current={isCurrent ? 'date' : undefined}
      onMouseEnter={() => onPreview(week.week)}
      onMouseLeave={() => onPreview(null)}
      onFocus={() => onPreview(week.week)}
      onBlur={() => onPreview(null)}
      style={{
        aspectRatio: '1',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        minHeight: 32,
        border: isCurrent ? '2px solid var(--oxblood)' : '1px solid var(--doc-ink-muted)',
        background: week.state === 'past' ? PAST_FILL : 'transparent',
        color: week.state === 'future' ? 'var(--doc-ink-muted)' : 'var(--doc-ink)',
        fontFamily: SERIF_BODY,
        fontSize: rem(13),
        fontWeight: isCurrent ? 700 : 400,
        lineHeight: 1,
        cursor: 'pointer',
      }}
    >
      <span>{week.week}</span>
      <span
        aria-hidden
        style={{
          height: 8,
          lineHeight: '8px',
          fontSize: hasPublicEvent ? rem(7) : rem(9),
          color: hasPublicEvent ? 'var(--oxblood)' : 'var(--doc-ink-muted)',
        }}
      >
        {hasPublicEvent ? '◆' : hasNotes ? '•' : ''}
      </span>
    </button>
  )
}

function WeekDetail({ week }: { week: CalendarWeek | undefined }) {
  return (
    <div
      data-testid="calendar-detail"
      style={{
        flexShrink: 0,
        minHeight: 44,
        padding: '10px 22px 14px',
        borderTop: '1px solid var(--doc-rule)',
      }}
    >
      {week === undefined || week.notes.length === 0 ? (
        <>
          {week !== undefined && <div style={OVERLINE}>{`Week ${week.week} · ${week.date}`}</div>}
          <p style={{ fontFamily: SERIF_BODY, fontStyle: 'italic', fontSize: rem(14), margin: '2px 0 0', color: 'var(--doc-ink-muted)' }}>
            Nothing recorded.
          </p>
        </>
      ) : (
        <>
          <div style={OVERLINE}>{`Week ${week.week} · ${week.date}`}</div>
          {week.notes.map((note, index) => (
            <p key={`${index}-${note}`} style={{ fontFamily: SERIF_BODY, fontSize: rem(14), lineHeight: 1.4, margin: '2px 0 0', color: 'var(--doc-ink)' }}>
              {note}
            </p>
          ))}
        </>
      )}
    </div>
  )
}
