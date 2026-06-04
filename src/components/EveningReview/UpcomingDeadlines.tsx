import type { UpcomingDeadline } from '../../types/week'

const URGENCY_ICONS: Record<UpcomingDeadline['urgency'], string> = {
  critical: '\u26A0\uFE0F',
  warning: '\u26A0',
  info: '\u2139\uFE0F',
}

const URGENCY_COLORS: Record<UpcomingDeadline['urgency'], string> = {
  critical: '#B85450',
  warning: '#C9A84C',
  info: '#6B9B5F',
}

export default function UpcomingDeadlines({ deadlines }: { deadlines: UpcomingDeadline[] }) {
  if (deadlines.length === 0) {
    return (
      <div className="evening-empty">
        <p>No pressing matters on the horizon.</p>
      </div>
    )
  }

  return (
    <div className="evening-deadlines">
      {deadlines.map((deadline) => (
        <div key={deadline.id} className="evening-deadline-item">
          <span
            className="evening-deadline-icon"
            style={{ color: URGENCY_COLORS[deadline.urgency] }}
          >
            {URGENCY_ICONS[deadline.urgency]}
          </span>
          <div className="evening-deadline-info">
            <span className="evening-deadline-title">{deadline.title}</span>
            <span className="evening-deadline-desc">{deadline.description}</span>
          </div>
          <span
            className="evening-deadline-time"
            style={{ color: URGENCY_COLORS[deadline.urgency] }}
          >
            {deadline.timeRemaining}
          </span>
        </div>
      ))}
    </div>
  )
}
