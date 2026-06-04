import type { WeeklyEvent } from '../../types/week'

const IMPACT_DOT_COLORS = {
  positive: '#6B9B5F',
  negative: '#B85450',
  neutral: '#C9A84C',
}

const EVENT_ICONS: Record<WeeklyEvent['category'], string> = {
  political: '\u2696\uFE0F',
  economic: '\u25B6',
  military: '\u2694\uFE0F',
  personal: '\u2764\uFE0F',
  crisis: '\u26A0\uFE0F',
}

export default function WeeklyHighlights({ events }: { events: WeeklyEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="evening-empty">
        <p>A quiet week. The machinery of state turns slowly.</p>
      </div>
    )
  }

  return (
    <div className="evening-highlights">
      {events.map((event) => (
        <div key={event.id} className="evening-highlight-item">
          <div className="evening-highlight-header">
            <span className="evening-highlight-icon">
              {EVENT_ICONS[event.category]}
            </span>
            <span className="evening-highlight-title">{event.title}</span>
            <span
              className="evening-highlight-dot"
              style={{ background: IMPACT_DOT_COLORS[event.impact] }}
            />
          </div>
          <p className="evening-highlight-summary">{event.summary}</p>
        </div>
      ))}
    </div>
  )
}
