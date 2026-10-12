// Fiscal note printed on a bill before it is signed. Budget is the one
// figure the player is allowed to see, so the cost is stated plainly.
// budgetCost is in millions of ₭; negative = spending, which adds to the debt.

type Tone = 'cost' | 'revenue' | 'neutral'

const TONE_COLOR: Record<Tone, string> = {
  cost: 'var(--oxblood)',
  revenue: '#3d6a34',
  neutral: 'var(--doc-ink-muted)',
}

export function fiscalNoteText(budgetCost: number): string {
  if (budgetCost < 0) return `Adds ₭${Math.abs(budgetCost)}M to the national debt`
  if (budgetCost > 0) return `Reduces the national debt by ₭${budgetCost}M`
  return 'No cost to the treasury'
}

export default function FiscalNote({ budgetCost }: { budgetCost: number }) {
  const tone: Tone = budgetCost < 0 ? 'cost' : budgetCost > 0 ? 'revenue' : 'neutral'
  const color = TONE_COLOR[tone]

  return (
    <div
      data-testid="fiscal-note"
      data-tone={tone}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'baseline',
        justifyContent: 'center',
        gap: '4px 10px',
        margin: '0 auto 12px',
        padding: '4px 12px',
        border: `1px solid ${color}`,
        borderRadius: '2px',
        color,
        maxWidth: 'fit-content',
      }}
    >
      <span style={{
        fontFamily: 'var(--font-ui)',
        fontSize: '9px',
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
      }}>
        Fiscal note
      </span>
      <span style={{ fontFamily: "'Crimson Text', Georgia, serif", fontSize: '14px', fontWeight: 600 }}>
        {fiscalNoteText(budgetCost)}
      </span>
    </div>
  )
}
