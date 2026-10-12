// Turn recap (S16): what last week's decisions led to, at the top of the
// morning briefing. Hidden on week 1 and on weeks with no journal entries.
import { useJournalStore } from '../../stores/journalStore'
import { buildWeekRecap } from './recapItems'

export default function WeekRecap({ currentWeek }: { currentWeek: number }) {
  const entries = useJournalStore(s => s.entries)
  const items = buildWeekRecap(entries, currentWeek)
  if (items.length === 0) return null

  return (
    <section aria-labelledby="week-recap-heading" data-testid="week-recap" style={{ marginBottom: '2.5rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <h2 id="week-recap-heading" style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: '0.6rem',
          fontWeight: 400,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--amber-dim)',
          margin: '0 0 0.6rem',
        }}>
          ▸ Last Week — Week {currentWeek - 1}
        </h2>
        <div style={{ height: '1px', background: 'var(--border)' }} />
      </div>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        {items.map(item => (
          <li key={item.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem 0.9rem', alignItems: 'baseline' }}>
            <span style={{
              flexShrink: 0,
              minWidth: '5.5rem',
              fontFamily: "'Special Elite', monospace",
              fontSize: '0.55rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: item.color,
            }}>
              {item.categoryLabel}
            </span>
            {/* Wraps under the category label when the screen is narrow */}
            <div style={{ flex: '1 1 16rem', minWidth: 0 }}>
              <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '0.95rem', color: 'var(--cream)', margin: 0 }}>
                {item.title}
              </p>
              <p style={{ fontFamily: "'IM Fell English', Georgia, serif", fontSize: '0.9rem', color: 'var(--muted)', lineHeight: 1.6, margin: '0.15rem 0 0' }}>
                {item.text}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
