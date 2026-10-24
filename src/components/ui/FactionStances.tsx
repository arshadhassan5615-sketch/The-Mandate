// Printed under the fiscal note: which factions back and which oppose a bill.
// Words only. Strength is shown as "(leaning)" and never as a number.

import { billStances } from '../../engine/billStances'
import type { FactionStance } from '../../engine/billStances'
import type { Bill } from '../../types/bills'
import { rem } from '../../constants/typography'

interface StanceColumnProps {
  label: string
  stances: FactionStance[]
  mark: string
  markColor: string
}

interface FactionStancesProps {
  bill: Pick<Bill, 'signEffects'>
  /** Horizontal inset, so the box lines up with the bill text column. */
  inset?: string
}

const BLOCK_STYLE = {
  padding: '8px 10px',
  border: '1px solid var(--doc-ink-muted)',
  borderRadius: '2px',
}

const COLUMNS_STYLE = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
}

const HEADING_STYLE = {
  fontSize: rem(9),
  letterSpacing: '0.2222em',
  textTransform: 'uppercase' as const,
  fontWeight: 600,
  color: 'var(--doc-ink-muted)',
  marginBottom: 4,
}

const LIST_STYLE = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
}

const LINE_STYLE = {
  fontFamily: 'var(--font-body)',
  fontSize: rem(12.5),
  color: 'var(--doc-ink)',
}

const EMPTY_LABEL = 'None'

function StanceColumn({ label, stances, mark, markColor }: StanceColumnProps) {
  return (
    <div>
      <div style={HEADING_STYLE}>{label}</div>
      <ul aria-label={label} style={LIST_STYLE}>
        {stances.length === 0 ? (
          <li style={{ ...LINE_STYLE, color: 'var(--doc-ink-muted)' }}>{EMPTY_LABEL}</li>
        ) : (
          stances.map(stance => (
            <li key={stance.key} style={LINE_STYLE}>
              <span aria-hidden="true" style={{ color: markColor, marginRight: 6 }}>{mark}</span>
              {stance.name}
              {stance.strength === 'leaning' && (
                <span style={{ fontStyle: 'italic', color: 'var(--doc-ink-muted)' }}> (leaning)</span>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  )
}

export default function FactionStances({ bill, inset = '0' }: FactionStancesProps) {
  const { supporters, opponents } = billStances(bill)
  if (supporters.length === 0 && opponents.length === 0) return null

  return (
    <div data-testid="faction-stances" style={{ ...BLOCK_STYLE, margin: `0 ${inset} 12px` }}>
      <div style={COLUMNS_STYLE}>
        <StanceColumn label="In favour" stances={supporters} mark="✓" markColor="var(--law-green, #3d6a34)" />
        <StanceColumn label="Opposed" stances={opponents} mark="✕" markColor="var(--oxblood)" />
      </div>
    </div>
  )
}
