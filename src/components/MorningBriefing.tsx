import { useMemo } from 'react'
import type { AgendaItem, AgendaCategory } from '../types/week'
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../types/week'
import type { NewsItem } from '../engine/newsTemplates'
import { selectHeadlines, generateVyktorOpening, NEWSPAPER_LABELS } from '../engine/newsTemplates'
import { useGameStore } from '../stores/gameStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import { useWeekStore } from '../stores/weekStore'
import { useBillStore } from '../stores/billStore'
import { useLetterStore } from '../stores/letterStore'
import { evaluateBillPrerequisites } from '../engine/BillEngine'
import { getScene } from '../engine/NarrativeEngine'
import { playStamp } from '../engine/audioEngine'

// ─── News card ────────────────────────────────────────────────────────────────

function NewsCard({ item }: { item: NewsItem }) {
  return (
    <div style={{
      background: 'var(--paper-raised)',
      border: '1px solid var(--border)',
      borderRadius: '2px',
      padding: '1rem 1.2rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
        <span style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: '0.58rem',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--amber)',
        }}>
          {NEWSPAPER_LABELS[item.newspaper]}
        </span>
        <span style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: '0.55rem',
          color: 'var(--muted)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          · {item.category}
        </span>
      </div>
      <p style={{
        fontFamily: "'Special Elite', monospace",
        fontSize: '0.74rem',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--cream)',
        lineHeight: 1.45,
        fontWeight: 'bold',
      }}>
        {item.headline}
      </p>
      <p style={{
        fontFamily: "'IM Fell English', Georgia, serif",
        fontSize: '0.8rem',
        color: 'var(--muted)',
        lineHeight: 1.6,
        fontStyle: 'italic',
      }}>
        {item.subline}
      </p>
    </div>
  )
}

// ─── Forced event row ─────────────────────────────────────────────────────────

function ForcedEventRow({ sceneId }: { sceneId: string }) {
  const scene = getScene(sceneId)
  if (!scene) return null
  return (
    <div style={{
      display: 'flex',
      gap: '0.8rem',
      alignItems: 'flex-start',
      padding: '0.75rem 1rem',
      background: 'rgba(139,46,46,0.07)',
      border: '1px solid rgba(139,46,46,0.35)',
      borderRadius: '2px',
    }}>
      <span style={{
        fontFamily: "'Special Elite', monospace",
        fontSize: '0.58rem',
        color: 'var(--accent-red)',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        paddingTop: '0.15rem',
        flexShrink: 0,
      }}>
        ⚠ Required
      </span>
      <div>
        <div style={{
          fontFamily: "'IM Fell English', Georgia, serif",
          fontSize: '0.92rem',
          color: 'var(--cream)',
          marginBottom: '0.2rem',
        }}>
          {scene.title}
        </div>
        <div style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: '0.6rem',
          color: 'var(--muted)',
          letterSpacing: '0.08em',
        }}>
          {scene.location} · Consequence of a prior decision — cannot be skipped
        </div>
      </div>
    </div>
  )
}

// ─── Agenda preview row (read-only) ──────────────────────────────────────────

function AgendaPreviewRow({ item }: { item: AgendaItem }) {
  const color = CATEGORY_COLORS[item.category as AgendaCategory]
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '0.55rem 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <span style={{
        padding: '0.1rem 0.45rem',
        fontSize: '0.55rem',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        fontFamily: "'Special Elite', monospace",
        background: `${color}22`,
        border: `1px solid ${color}55`,
        color: color,
        borderRadius: '2px',
        flexShrink: 0,
      }}>
        {CATEGORY_LABELS[item.category as AgendaCategory]}
      </span>
      <span style={{
        fontFamily: "'IM Fell English', Georgia, serif",
        fontSize: '0.88rem',
        color: 'var(--cream)',
        flex: 1,
      }}>
        {item.title}
        {item.isUrgent && (
          <span style={{
            fontFamily: "'Special Elite', monospace",
            fontSize: '0.58rem',
            color: 'var(--accent-red)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginLeft: '0.6rem',
          }}>
            urgent
          </span>
        )}
      </span>
      <span style={{
        fontFamily: "'Special Elite', monospace",
        fontSize: '0.6rem',
        color: 'var(--muted)',
        flexShrink: 0,
        letterSpacing: '0.08em',
      }}>
        {item.slotCost > 0
          ? `${item.slotCost} slot${item.slotCost !== 1 ? 's' : ''}`
          : 'Mandatory'}
      </span>
    </div>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ label, color = 'var(--amber-dim)' }: { label: string; color?: string }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <p style={{
        fontFamily: "'Special Elite', monospace",
        fontSize: '0.6rem',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color,
        marginBottom: '0.6rem',
      }}>
        ▸ {label}
      </p>
      <div style={{ height: '1px', background: color === 'var(--accent-red)' ? 'rgba(139,46,46,0.3)' : 'var(--border)' }} />
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function MorningBriefing() {
  const gameState = useGameStore()
  const { currentWeek } = useGameStore()
  const { activeFlags } = useNarrativeStore()
  const { agendaPool, forcedChainIds, endBriefing } = useWeekStore()
  const letterStore = useLetterStore()

  const headlines = selectHeadlines(gameState, activeFlags)
  const urgentCount = agendaPool.filter(a => a.isUrgent).length
  const vyktorLines = generateVyktorOpening(currentWeek, headlines, forcedChainIds.length, urgentCount)

  // New diplomatic letters this week
  const newLettersThisWeek = letterStore.letters.filter(
    l => l.weekTriggered === currentWeek && !letterStore.readIds.has(l.id),
  )

  const { bills, history } = useBillStore()
  const pendingBills = useMemo(() =>
    bills.filter(b => {
      if (b.weekPresented !== currentWeek) return false
      if (history.some(h => h.billId === b.id)) return false
      if (b.prerequisites?.length) {
        if (!evaluateBillPrerequisites(b, gameState, activeFlags)) return false
      }
      return true
    }),
    [bills, currentWeek, history, gameState, activeFlags],
  )

  const FACTION_NAMES: Record<string, string> = {
    reformists: 'Civic Renewal',
    halvekists: 'Halvekists',
    workersCoalition: "Workers' Coalition",
    ironCovenant: 'Iron Covenant',
    church: 'Church',
    businessClass: 'Business',
    dravenni: 'Dravenni',
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden fixed inset-0 z-[1]" style={{ background: 'rgba(15,13,10,0.94)' }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between px-8 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <span className="stamp">The Mandate — Republic of Veltria, 1963</span>
        <span className="stamp">Week {currentWeek} of 52 · Morning Briefing</span>
      </div>

      {/* ── Scrollable body ───────────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--amber-dim) transparent' }}
      >
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2.5rem 2rem 2rem' }}>

          {/* Vyktor dialogue */}
          <div style={{ marginBottom: '2.5rem' }}>
            <SectionHeader label="Morning Briefing — Vyktor Reznik, Chief of Staff" />
            <div style={{ paddingLeft: '0.25rem' }}>
              {vyktorLines.map((line, i) => (
                <p key={i} style={{
                  fontFamily: "'IM Fell English', Georgia, serif",
                  fontSize: '0.97rem',
                  color: i === 0 ? 'var(--cream)' : 'var(--muted)',
                  lineHeight: 1.75,
                  marginBottom: '0.55em',
                }}>
                  {line}
                </p>
              ))}
            </div>
          </div>

          {/* Diplomatic correspondence notification */}
          {newLettersThisWeek.length > 0 && (
            <div style={{ marginBottom: '2.5rem' }}>
              <SectionHeader label="Diplomatic Correspondence" color="var(--amber)" />
              <div style={{ padding: '1rem 1.2rem', background: 'rgba(200,144,42,0.06)', border: '1px solid rgba(200,144,42,0.25)', borderRadius: '2px' }}>
                <p style={{
                  fontFamily: "'Special Elite', monospace",
                  fontSize: '0.62rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--amber)',
                  marginBottom: '0.6rem',
                }}>
                  You have received diplomatic correspondence.
                </p>
                {newLettersThisWeek.map(letter => (
                  <div key={letter.id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.8rem',
                    padding: '0.5rem 0', borderBottom: '1px solid rgba(200,144,42,0.08)',
                  }}>
                    <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '0.85rem', color: 'var(--cream)', flex: 1 }}>
                      {letter.headline}
                    </span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.5rem', color: 'var(--muted)', letterSpacing: '0.06em' }}>
                      {letter.sender}
                    </span>
                    <button
                      onClick={() => {
                        letterStore.setOpen(true)
                        letterStore.setIndex(letterStore.letters.findIndex(l => l.id === letter.id))
                        letterStore.markRead(letter.id)
                      }}
                      style={{
                        background: 'rgba(200,144,42,0.12)', border: '1px solid rgba(200,144,42,0.25)',
                        color: 'var(--amber-dim)', cursor: 'pointer',
                        fontFamily: "'Special Elite', monospace", fontSize: '0.5rem',
                        letterSpacing: '0.08em', padding: '3px 10px', borderRadius: '2px',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--amber)'; e.currentTarget.style.borderColor = 'var(--amber)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--amber-dim)'; e.currentTarget.style.borderColor = 'rgba(200,144,42,0.25)' }}
                    >
                      Read
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div
        className="shrink-0 flex items-center justify-between px-8 py-4 border-t"
        style={{ borderColor: 'var(--border)' }}
      >
        <span className="stamp" style={{ color: 'var(--muted)' }}>
          Review the briefing, then read the press summary
        </span>
        <button
          className="choice-btn"
          onClick={() => { playStamp(); endBriefing() }}
          style={{ width: 'auto', minWidth: '220px' }}
        >
          Continue to Press Summary →
        </button>
      </div>
    </div>
  )
}
