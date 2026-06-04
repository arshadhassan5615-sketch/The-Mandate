import type { WeeklyDecision } from '../../types/week'

const IMPACT_ICONS: Record<WeeklyDecision['impact'], string> = {
  positive: '\u2713',
  negative: '\u2717',
  neutral: '\u2014',
}

export default function MajorDecisions({ decisions }: { decisions: WeeklyDecision[] }) {
  if (decisions.length === 0) {
    return (
      <div className="evening-empty">
        <p>No major decisions were recorded this week.</p>
      </div>
    )
  }

  return (
    <div className="evening-decisions">
      {decisions.map((decision, i) => (
        <div key={i} className="evening-decision-item">
          <div className="evening-decision-header">
            <span className={`evening-decision-check ${decision.impact}`}>
              {IMPACT_ICONS[decision.impact]}
            </span>
            <span className="evening-decision-title">{decision.title}</span>
          </div>
          <p className="evening-decision-consequence">{decision.consequence}</p>
        </div>
      ))}
    </div>
  )
}
