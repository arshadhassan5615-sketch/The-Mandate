import type { NewsItem } from '../engine/newsTemplates'
import { selectHeadlines, generateVyktorOpening, NEWSPAPER_LABELS } from '../engine/newsTemplates'
import { useGameStore } from '../stores/gameStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import { useWeekStore } from '../stores/weekStore'
import { useLetterStore } from '../stores/letterStore'
import { useChainStore } from '../stores/chainStore'
import { buildDinnerChainTriggers } from '../engine/FamilyDinnerEngine'
import { buildBriefingChainTriggers } from '../engine/IntelligenceBriefingEngine'
import { playStamp } from '../engine/audioEngine'
import { useEffect, useState } from 'react'

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
  const [spinChosen, setSpinChosen] = useState(false)
  const applyModifiers = useGameStore(s => s.applyModifiers)

  const gameState = useGameStore()
  const { currentWeek } = useGameStore()
  const { activeFlags } = useNarrativeStore()
  const { agendaPool, forcedChainIds, endBriefing } = useWeekStore()
  const letterStore = useLetterStore()

  const headlines = selectHeadlines(gameState, activeFlags)

  useEffect(() => {
    if (activeFlags.includes('family_dinner_chains_scheduled')) return
    const triggers = buildDinnerChainTriggers(currentWeek)
    if (triggers.length > 0) {
      useChainStore.getState().schedule(triggers, currentWeek, 'family_dinner_init')
      useNarrativeStore.getState().addFlags(['family_dinner_chains_scheduled'])
    }
  }, [activeFlags, currentWeek])

  useEffect(() => {
    if (activeFlags.includes('intelligence_briefing_chains_scheduled')) return
    const triggers = buildBriefingChainTriggers(currentWeek)
    if (triggers.length > 0) {
      useChainStore.getState().schedule(triggers, currentWeek, 'intelligence_briefing_init')
      useNarrativeStore.getState().addFlags(['intelligence_briefing_chains_scheduled'])
    }
  }, [activeFlags, currentWeek])

  // Fallback headlines for Week 1 — news hasn't been generated yet
  const displayHeadlines = headlines.length > 0 ? headlines : (currentWeek === 1 ? [
    {
      id: 'wk1_economy',
      headline: 'Kravenstal Steel Output Falls 8% — Vael-Kross Seeks Finance Ministry Meeting',
      subline: 'Steel output in Kravenstal fell eight percent last quarter. Vael-Kross Holdings has requested a meeting with the Finance Ministry. They will want concessions. I recommend we hear them out before deciding what to offer.',
      newspaper: 'herald',
      category: 'economy',
    },
    {
      id: 'wk1_foreign',
      headline: 'Morivask Crisis Deepens — 47,000 Refugees Registered in Veltria',
      subline: 'The Morivask situation continues. Forty-seven thousand refugees are now registered in Veltria. The Asturien Forum vote on peacekeeping authorization is expected this week. The Orythian Dominion is expected to veto. This will become your problem regardless of how the vote goes.',
      newspaper: 'standard',
      category: 'foreign',
    },
    {
      id: 'wk1_security',
      headline: 'Tyvaren Border Incident — Patrol Crosses, Retreats Before Engagement',
      subline: 'There was an incident on the Tyvaren border overnight. A patrol crossing — they turned back before our forces engaged. Colonel Dusek\'s assessment is in your secure briefing. I suggest you read it before the week is out.',
      newspaper: 'dispatch',
      category: 'military',
    },
  ] as NewsItem[] : [])
  const urgentCount = agendaPool.filter(a => a.isUrgent).length
  const vyktorLines = generateVyktorOpening(currentWeek, displayHeadlines, forcedChainIds.length, urgentCount)

  // New diplomatic letters this week
  const newLettersThisWeek = letterStore.letters.filter(
    l => l.weekTriggered === currentWeek && !letterStore.readIds.has(l.id),
  )

  return (
    <div className="flex flex-col h-screen w-screen fixed inset-0" style={{ zIndex: 1, background: 'rgba(15,13,10,1)', paddingTop: '48px', paddingRight: '60px' }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center px-8 py-3 border-b" style={{ borderColor: 'var(--border)', maxWidth: 'calc(100% - 200px)' }}>
        <span className="stamp">The Mandate — Republic of Veltria, 1963</span>
      </div>

      {/* ── Scrollable body ───────────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-hidden overflow-y-auto"
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

          {/* Headlines */}
          {displayHeadlines.length > 0 && (
            <div style={{ marginBottom: '2.5rem' }}>
              <SectionHeader label={`Overnight Headlines — ${displayHeadlines.length} item${displayHeadlines.length !== 1 ? 's' : ''}`} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                {displayHeadlines.map((h, i) => (
                  <div key={h.id}>
                    <NewsCard item={h} />
                    {i < displayHeadlines.length - 1 && (
                      <div style={{
                        height: '1px',
                        background: 'linear-gradient(90deg, transparent, rgba(200,144,42,0.25), transparent)',
                        marginTop: '1.2rem',
                      }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

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

      {/* Press Gallery — Dynamic Narrative Spin */}
      {!spinChosen ? (
        <div style={{ marginBottom: '2.5rem', padding: '1.5rem', background: 'rgba(20,18,12,0.6)', border: '1px solid rgba(201,168,76,0.3)' }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', color: '#c9a84c', margin: '0 0 0.5rem' }}>Press Gallery</h3>
          <p style={{ fontFamily: "'IM Fell English', serif", fontSize: '0.9rem', color: '#b8a890', margin: '0 0 1rem', fontStyle: 'italic' }}>
            Vyktor awaits your direction. "The papers will print what we give them, Chancellor. How do we frame this week?"
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button 
              onClick={() => { applyModifiers([{ stat: 'factions.reformists', operation: 'add', value: 4 }, { stat: 'factions.ironCovenant', operation: 'add', value: -3 }]); setSpinChosen(true) }}
              style={{ background: 'rgba(10,8,6,0.8)', border: '1px solid rgba(201,168,76,0.4)', color: '#e8dcc8', padding: '0.5rem 1rem', cursor: 'pointer', textAlign: 'left', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem' }}
            >
              <strong>Reformist Spin:</strong> Focus on human rights and democratic progress. <span style={{ color: '#7fa65a' }}>(Reformists +4, Iron Covenant -3)</span>
            </button>
            <button 
              onClick={() => { applyModifiers([{ stat: 'factions.ironCovenant', operation: 'add', value: 4 }, { stat: 'factions.reformists', operation: 'add', value: -3 }]); setSpinChosen(true) }}
              style={{ background: 'rgba(10,8,6,0.8)', border: '1px solid rgba(201,168,76,0.4)', color: '#e8dcc8', padding: '0.5rem 1rem', cursor: 'pointer', textAlign: 'left', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem' }}
            >
              <strong>Law & Order Spin:</strong> Emphasize stability, security, and state authority. <span style={{ color: '#7fa65a' }}>(Iron Covenant +4, Reformists -3)</span>
            </button>
            <button 
              onClick={() => { applyModifiers([{ stat: 'factions.businessClass', operation: 'add', value: 4 }, { stat: 'factions.workersCoalition', operation: 'add', value: -3 }]); setSpinChosen(true) }}
              style={{ background: 'rgba(10,8,6,0.8)', border: '1px solid rgba(201,168,76,0.4)', color: '#e8dcc8', padding: '0.5rem 1rem', cursor: 'pointer', textAlign: 'left', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.75rem' }}
            >
              <strong>Economic Spin:</strong> Highlight growth, investment, and fiscal responsibility. <span style={{ color: '#7fa65a' }}>(Business Class +4, Workers -3)</span>
            </button>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: '2.5rem', padding: '1rem', background: 'rgba(20,18,12,0.6)', border: '1px solid rgba(127,166,90,0.3)', textAlign: 'center' }}>
          <p style={{ fontFamily: "'IM Fell English', serif", fontSize: '0.9rem', color: '#7fa65a', margin: 0, fontStyle: 'italic' }}>
            The spin has been sent to the printers. The morning editions will carry your framing.
          </p>
        </div>
      )}

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div
        className="shrink-0 flex items-center justify-between px-8 py-4 border-t"
        style={{ borderColor: 'var(--border)', paddingRight: '70px' }}
      >
        <span className="stamp" style={{ color: 'var(--muted)' }}>
          Review the briefing, then read the press summary
        </span>
        <button
          className="choice-btn"
          disabled={!spinChosen}
          onClick={() => { playStamp(); endBriefing() }}
          style={{ width: 'auto', minWidth: '220px', whiteSpace: 'nowrap', overflow: 'visible', padding: '0.65rem 1.5rem', opacity: spinChosen ? 1 : 0.4, cursor: spinChosen ? 'pointer' : 'not-allowed' }}
        >
          Continue to Press Summary →
        </button>
      </div>
    </div>
  )
}
