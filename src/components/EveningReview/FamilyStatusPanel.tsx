import { useGameStore } from '../../stores/gameStore'

interface MoodInfo {
  label: string
  color: string
  barColor: string
}

function getMood(score: number): MoodInfo {
  if (score <= 20) return { label: 'Distant', color: '#c87070', barColor: '#7a2020' }
  if (score <= 40) return { label: 'Strained', color: '#b86040', barColor: '#6a3018' }
  if (score <= 60) return { label: 'Stable', color: '#a09030', barColor: '#5a5018' }
  if (score <= 80) return { label: 'Close', color: '#80a050', barColor: '#3a5020' }
  return { label: 'Devoted', color: '#50a840', barColor: '#245a20' }
}

function getMoodIcon(label: string): string {
  switch (label) {
    case 'Devoted':
    case 'Close':
      return '\u263A'
    case 'Stable':
      return '\u263A\u200D\u2195\uFE0F'
    case 'Strained':
      return '\u2639'
    case 'Distant':
      return '\u263A\u200D\u2194\uFE0F'
    default:
      return '\u263A\u200D\u2195\uFE0F'
  }
}

interface FamilyMemberDef {
  key: 'marriageHealth' | 'lioraRelationship' | 'tomasWellbeing'
  name: string
  role: string
  initials: string
}

const FAMILY: FamilyMemberDef[] = [
  { key: 'marriageHealth', name: 'Jonas', role: 'Husband', initials: 'JA' },
  { key: 'lioraRelationship', name: 'Liora', role: 'Daughter, 19', initials: 'LA' },
  { key: 'tomasWellbeing', name: 'Tomas', role: 'Son, 12', initials: 'TA' },
]

export default function FamilyStatusPanel() {
  const personal = useGameStore((s) => s.personal)

  return (
    <div className="evening-family">
      {FAMILY.map((member) => {
        const score = personal[member.key] as number
        const mood = getMood(score)

        return (
          <div key={member.key} className="evening-family-member">
            <div
              className="evening-family-portrait"
              style={{ borderColor: mood.color }}
            >
              <span className="evening-family-initials">{member.initials}</span>
              <span
                className="evening-family-mood-icon"
                title={mood.label}
              >
                {getMoodIcon(mood.label)}
              </span>
            </div>
            <div className="evening-family-info">
              <span className="evening-family-name">{member.name}</span>
              <span className="evening-family-role">{member.role}</span>
              <div className="evening-family-bar-track">
                <div
                  className="evening-family-bar-fill"
                  style={{
                    width: `${score}%`,
                    background: mood.barColor,
                  }}
                />
              </div>
              <span
                className="evening-family-mood-label"
                style={{ color: mood.color }}
              >
                {mood.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
