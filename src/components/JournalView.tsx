import { useState, useMemo } from 'react'
import { useJournalStore } from '../stores/journalStore'
import { useGameStore } from '../stores/gameStore'
import type { JournalCategory, ChoiceAlignment, JournalStats } from '../types/journal'
import { CATEGORY_COLORS, CATEGORY_LABELS, CATEGORY_ICONS, ALIGNMENT_LABELS, ALIGNMENT_COLORS } from '../types/journal'

const ALL_CATEGORIES: JournalCategory[] = ['policy', 'diplomacy', 'personal', 'legislation', 'crisis', 'reform']
const ACTS = [1, 2, 3, 4]
const DIARY_CATEGORY_LABELS: Record<string, string> = {
  political: 'Political', personal: 'Personal', crisis: 'Crisis', diplomatic: 'Diplomatic', military: 'Military',
}
const DIARY_CATEGORY_COLORS: Record<string, string> = {
  political: '#3a5a7c', personal: '#c8902a', crisis: '#8b2e2e', diplomatic: '#2a7a7a', military: '#5a6b3a',
}

function getActLabel(act: number): string {
  switch (act) {
    case 1: return 'Act I — The Foundation'
    case 2: return 'Act II — The Consolidation'
    case 3: return 'Act III — The Furnace'
    case 4: return 'Act IV — The Reckoning'
    default: return `Act ${act}`
  }
}

function getActDateRange(act: number): string {
  switch (act) {
    case 1: return 'Weeks 1–13 · Winter–Spring 1963'
    case 2: return 'Weeks 14–26 · Spring–Summer 1963'
    case 3: return 'Weeks 27–39 · Summer–Autumn 1963'
    case 4: return 'Weeks 40–52 · Autumn–Winter 1963'
    default: return ''
  }
}

function AlignmentBar({ stats }: { stats: JournalStats }) {
  const total = stats.totalEntries || 1
  const alignments = ['reformist', 'pragmatist', 'authoritarian', 'populist', 'personal', 'deflect'] as ChoiceAlignment[]
  const widths = alignments.map(a => ({
    label: ALIGNMENT_LABELS[a],
    color: ALIGNMENT_COLORS[a],
    count: stats.alignmentBreakdown[a] || 0,
    pct: Math.round(((stats.alignmentBreakdown[a] || 0) / total) * 100),
  })).filter(w => w.count > 0)

  if (widths.length === 0) return null

  return (
    <div style={{ marginTop: '0.5rem' }}>
      <div style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '0.42rem',
        letterSpacing: '0.15em',
        color: 'var(--muted)',
        textTransform: 'uppercase',
        marginBottom: '0.3rem',
      }}>
        Political Alignment
      </div>
      <div style={{ display: 'flex', height: '6px', borderRadius: '1px', overflow: 'hidden', marginBottom: '0.3rem' }}>
        {widths.map((w, i) => (
          <div
            key={w.label ?? i}
            style={{
              flex: w.count,
              background: w.color,
              minWidth: w.count > 0 ? '4px' : '0px',
            }}
            title={`${w.label}: ${w.pct}%`}
          />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {widths.map((w, i) => (
          <span key={w.label ?? i} style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.38rem',
            letterSpacing: '0.06em',
            color: w.color,
          }}>
            {w.label} {w.pct}%
          </span>
        ))}
      </div>
    </div>
  )
}

export default function JournalView({ onClose }: { onClose: () => void }) {
  const { entries, getStats } = useJournalStore()
  const diaryEntries = useGameStore(s => s.diaryEntries)
  const [selectedAct, setSelectedAct] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<JournalCategory | null>(null)
  const [searchText, setSearchText] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'journal' | 'diary'>('journal')

  const stats = useMemo(() => getStats(), [entries, getStats])

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      if (selectedAct !== null) {
        const eAct = e.weekNumber <= 13 ? 1 : e.weekNumber <= 26 ? 2 : e.weekNumber <= 39 ? 3 : 4
        if (eAct !== selectedAct) return false
      }
      if (selectedCategory !== null && e.category !== selectedCategory) return false
      if (searchText) {
        const q = searchText.toLowerCase()
        return e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)
      }
      return true
    })
  }, [entries, selectedAct, selectedCategory, searchText])

  const groupedByAct = useMemo(() => {
    const groups: Record<number, typeof filteredEntries> = { 1: [], 2: [], 3: [], 4: [] }
    for (const e of filteredEntries) {
      const act = e.weekNumber <= 13 ? 1 : e.weekNumber <= 26 ? 2 : e.weekNumber <= 39 ? 3 : 4
      groups[act].push(e)
    }
    return groups
  }, [filteredEntries])

  const dominantLabel = stats.dominantAlignment ? ALIGNMENT_LABELS[stats.dominantAlignment] : null
  const dominantColor = stats.dominantAlignment ? ALIGNMENT_COLORS[stats.dominantAlignment] : null

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div style={{
        width: '100%',
        maxWidth: '720px',
        maxHeight: '90vh',
        background: '#1a1815',
        border: '1px solid rgba(200,144,42,0.3)',
        boxShadow: '0 8px 48px rgba(0,0,0,0.7)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Header */}
        <div style={{
          padding: '0.9rem 1.2rem',
          borderBottom: '2px solid rgba(200,144,42,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          background: '#12100e',
        }}>
          <div>
            <div style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '1.1rem',
              color: 'var(--amber)',
              letterSpacing: '0.04em',
              lineHeight: 1.2,
            }}>
              The Chancellor's Journal
            </div>
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.42rem',
              letterSpacing: '0.2em',
              color: 'var(--muted)',
              textTransform: 'uppercase',
              marginTop: '2px',
            }}>
              {entries.length} entries · {stats.billsSigned} signed / {stats.billsVetoed} vetoed
              {dominantLabel && (
                <span style={{ marginLeft: '0.5rem', color: dominantColor ?? 'var(--muted)' }}>
                  · Aligned: {dominantLabel}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid rgba(200,144,42,0.2)',
              color: 'var(--muted)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              padding: '0.2rem 0.5rem',
              fontFamily: "'IBM Plex Mono', monospace",
              borderRadius: '1px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Filters */}
        <div style={{
          padding: '0.5rem 1.2rem',
          borderBottom: '1px solid rgba(200,144,42,0.12)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap',
          flexShrink: 0,
          background: '#151310',
        }}>
          {/* View mode toggle */}
          <div style={{ display: 'flex', gap: '3px' }}>
            <button
              onClick={() => setViewMode('journal')}
              style={filterPillStyle(viewMode === 'journal')}
            >
              Journal
            </button>
            <button
              onClick={() => setViewMode('diary')}
              style={filterPillStyle(viewMode === 'diary')}
            >
              Diary ({diaryEntries.length})
            </button>
          </div>

          <div style={{ width: '1px', height: '16px', background: 'rgba(200,144,42,0.15)' }} />
          {/* Act filter pills */}
          <div style={{ display: 'flex', gap: '3px' }}>
            <button
              onClick={() => setSelectedAct(null)}
              style={filterPillStyle(selectedAct === null)}
            >
              All
            </button>
            {ACTS.map(act => (
              <button
                key={act}
                onClick={() => setSelectedAct(selectedAct === act ? null : act)}
                style={filterPillStyle(selectedAct === act)}
              >
                Act {act}
              </button>
            ))}
          </div>

          <div style={{ width: '1px', height: '16px', background: 'rgba(200,144,42,0.15)' }} />

          {/* Category filter pills */}
          <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
            {ALL_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                style={filterPillStyle(selectedCategory === cat, CATEGORY_COLORS[cat])}
              >
                {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          {/* Search */}
          <input
            type="text"
            placeholder="Search..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{
              background: '#0d0b09',
              border: '1px solid rgba(200,144,42,0.15)',
              color: 'var(--cream)',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.48rem',
              padding: '0.25rem 0.5rem',
              width: '140px',
              outline: 'none',
              letterSpacing: '0.04em',
            }}
          />
        </div>

        {/* Alignment bar — journal mode only */}
        {viewMode === 'journal' && (
          <div style={{
            padding: '0.4rem 1.2rem',
            borderBottom: '1px solid rgba(200,144,42,0.1)',
            flexShrink: 0,
            background: '#151310',
          }}>
            <AlignmentBar stats={stats} />
          </div>
        )}

        {/* Entries list */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.8rem 1.2rem',
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--amber-dim) transparent',
        }}>
          {viewMode === 'diary' ? (
            /* ── Diary entries (newest first) ── */
            diaryEntries.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                color: 'var(--muted)',
                fontFamily: "'Crimson Text', Georgia, serif",
                fontSize: '0.85rem',
                fontStyle: 'italic',
              }}>
                No diary entries yet. Your personal reflections will appear here each week.
              </div>
            ) : (
              [...diaryEntries].reverse().map((entry) => {
                const eAct = entry.week <= 13 ? 1 : entry.week <= 26 ? 2 : entry.week <= 39 ? 3 : 4
                if (selectedAct !== null && eAct !== selectedAct) return null
                const catColor = DIARY_CATEGORY_COLORS[entry.category] ?? 'var(--muted)'
                const isExpanded = expandedId === `diary_${entry.week}`
                return (
                  <div
                    key={`diary_${entry.week}`}
                    onClick={() => setExpandedId(isExpanded ? null : `diary_${entry.week}`)}
                    style={{
                      padding: '0.5rem 0.6rem',
                      marginBottom: '0.3rem',
                      borderLeft: `3px solid ${catColor}`,
                      background: isExpanded ? 'rgba(200,144,42,0.05)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                      borderRadius: '1px',
                    }}
                    onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = 'rgba(200,144,42,0.03)' }}
                    onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = 'transparent' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <span style={{
                        fontFamily: "'Special Elite', monospace",
                        fontSize: '0.52rem',
                        color: 'var(--amber-dim)',
                        minWidth: '42px',
                        letterSpacing: '0.04em',
                        lineHeight: '1.3',
                        flexShrink: 0,
                      }}>
                        Wk {entry.week}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontFamily: "'Crimson Text', Georgia, serif",
                          fontSize: '0.78rem',
                          color: 'var(--cream)',
                          lineHeight: 1.4,
                          fontStyle: 'italic',
                          display: '-webkit-box',
                          WebkitLineClamp: isExpanded ? 99 : 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}>
                          {entry.text.split('\n')[0]}
                        </div>
                      </div>
                      <span style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: '0.36rem',
                        letterSpacing: '0.08em',
                        color: catColor,
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                        marginTop: '2px',
                        flexShrink: 0,
                      }}>
                        {DIARY_CATEGORY_LABELS[entry.category] ?? entry.category}
                      </span>
                    </div>
                    {isExpanded && (
                      <div style={{
                        marginTop: '0.5rem',
                        marginLeft: '3rem',
                        padding: '0.4rem 0.6rem',
                        background: 'rgba(200,144,42,0.06)',
                        borderLeft: '2px solid var(--amber-dim)',
                        borderRadius: '1px',
                      }}>
                        <div style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: '0.36rem',
                          color: 'var(--muted)',
                          letterSpacing: '0.06em',
                          marginBottom: '4px',
                        }}>
                          {entry.date}
                        </div>
                        <div style={{
                          fontFamily: "'Crimson Text', Georgia, serif",
                          fontSize: '0.72rem',
                          color: 'var(--cream)',
                          fontStyle: 'italic',
                          lineHeight: 1.5,
                          whiteSpace: 'pre-wrap',
                        }}>
                          {entry.text}
                        </div>
                      </div>
                    )}
                  </div>
                )
              }).filter(Boolean)
            )
          ) : (
            /* ── Journal entries (decision log) ── */
            filteredEntries.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                color: 'var(--muted)',
                fontFamily: "'Crimson Text', Georgia, serif",
                fontSize: '0.85rem',
                fontStyle: 'italic',
              }}>
                {entries.length === 0
                  ? 'No entries yet. Your decisions will be recorded here as you govern.'
                  : 'No entries match your filters.'}
              </div>
            ) : (
              ACTS.map(act => {
                const actEntries = groupedByAct[act]
                if (actEntries.length === 0) return null

                return (
                  <div key={act} style={{ marginBottom: '1.5rem' }}>
                    {/* Act header */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '0.6rem',
                      marginBottom: '0.6rem',
                      paddingBottom: '0.4rem',
                      borderBottom: '1px solid rgba(200,144,42,0.12)',
                    }}>
                      <span style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: '0.9rem',
                        color: 'var(--amber)',
                        letterSpacing: '0.03em',
                      }}>
                        {getActLabel(act)}
                      </span>
                      <span style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: '0.38rem',
                        color: 'var(--muted)',
                        letterSpacing: '0.1em',
                      }}>
                        {getActDateRange(act)}
                      </span>
                    </div>

                    {/* Entries */}
                    {actEntries.map((entry) => {
                      const isExpanded = expandedId === entry.id
                      return (
                        <div
                          key={entry.id}
                          onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                          style={{
                            padding: '0.5rem 0.6rem',
                            marginBottom: '0.3rem',
                            borderLeft: `3px solid ${CATEGORY_COLORS[entry.category]}`,
                            background: isExpanded ? 'rgba(200,144,42,0.05)' : 'transparent',
                            cursor: 'pointer',
                            transition: 'background 0.15s',
                            borderRadius: '1px',
                          }}
                          onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = 'rgba(200,144,42,0.03)' }}
                          onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = 'transparent' }}
                        >
                          {/* Entry header row */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                            <span style={{
                              fontFamily: "'Special Elite', monospace",
                              fontSize: '0.52rem',
                              color: 'var(--amber-dim)',
                              minWidth: '42px',
                              letterSpacing: '0.04em',
                              lineHeight: '1.3',
                              flexShrink: 0,
                            }}>
                              Wk {entry.weekNumber}
                            </span>
                            <span style={{
                              fontSize: '0.8rem',
                              flexShrink: 0,
                              marginTop: '-1px',
                            }}>
                              {entry.icon}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontFamily: "'Crimson Text', Georgia, serif",
                                fontSize: '0.85rem',
                                color: 'var(--cream)',
                                lineHeight: 1.3,
                                fontWeight: 600,
                              }}>
                                {entry.title}
                              </div>
                              <div style={{
                                fontFamily: "'Crimson Text', Georgia, serif",
                                fontSize: '0.72rem',
                                color: 'var(--muted)',
                                fontStyle: 'italic',
                                lineHeight: 1.35,
                                display: '-webkit-box',
                                WebkitLineClamp: isExpanded ? 99 : 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}>
                                {entry.description}
                              </div>
                            </div>
                            <span style={{
                              fontFamily: "'IBM Plex Mono', monospace",
                              fontSize: '0.36rem',
                              letterSpacing: '0.08em',
                              color: CATEGORY_COLORS[entry.category],
                              textTransform: 'uppercase',
                              whiteSpace: 'nowrap',
                              marginTop: '2px',
                              flexShrink: 0,
                            }}>
                              {CATEGORY_LABELS[entry.category]}
                            </span>
                          </div>

                          {/* Consequences — shown when expanded */}
                          {isExpanded && entry.consequences && (
                            <div style={{
                              marginTop: '0.5rem',
                              marginLeft: '5rem',
                              padding: '0.4rem 0.6rem',
                              background: 'rgba(200,144,42,0.06)',
                              borderLeft: '2px solid var(--amber-dim)',
                              borderRadius: '1px',
                            }}>
                              <span style={{
                                fontFamily: "'IBM Plex Mono', monospace",
                                fontSize: '0.38rem',
                                letterSpacing: '0.12em',
                                color: 'var(--amber-dim)',
                                textTransform: 'uppercase',
                              }}>
                                Consequences
                              </span>
                              <div style={{
                                fontFamily: "'Crimson Text', Georgia, serif",
                                fontSize: '0.68rem',
                                color: 'var(--cream)',
                                fontStyle: 'italic',
                                lineHeight: 1.35,
                                marginTop: '2px',
                              }}>
                                "{entry.consequences}"
                              </div>
                            </div>
                          )}

                          {/* Empty state when expanded but no consequences */}
                          {isExpanded && !entry.consequences && (
                            <div style={{
                              marginTop: '0.5rem',
                              marginLeft: '5rem',
                              padding: '0.4rem 0.6rem',
                              background: 'rgba(107,96,80,0.05)',
                              borderRadius: '1px',
                            }}>
                              <span style={{
                                fontFamily: "'Crimson Text', Georgia, serif",
                                fontSize: '0.6rem',
                                color: 'var(--muted)',
                                fontStyle: 'italic',
                              }}>
                                Consequences have not yet manifested.
                              </span>
                            </div>
                          )}

                          {/* Expanded metadata */}
                          {isExpanded && (
                            <div style={{
                              marginTop: '0.3rem',
                              marginLeft: '5rem',
                              display: 'flex',
                              gap: '0.8rem',
                              flexWrap: 'wrap',
                            }}>
                              <span style={{
                                fontFamily: "'IBM Plex Mono', monospace",
                                fontSize: '0.36rem',
                                color: 'var(--muted)',
                                letterSpacing: '0.06em',
                              }}>
                                {entry.date}
                              </span>
                              {entry.alignment && (
                                <span style={{
                                  fontFamily: "'IBM Plex Mono', monospace",
                                  fontSize: '0.36rem',
                                  color: ALIGNMENT_COLORS[entry.alignment],
                                  letterSpacing: '0.06em',
                                }}>
                                  {ALIGNMENT_LABELS[entry.alignment]}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })
            )
          )}
        </div>

        {/* Footer stats */}
        <div style={{
          padding: '0.5rem 1.2rem',
          borderTop: '2px solid rgba(200,144,42,0.15)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          background: '#12100e',
        }}>
          {viewMode === 'diary' ? (
            <>
              <span style={footerStatStyle}>
                {diaryEntries.length} diary entries
              </span>
              <span style={{ ...footerStatStyle, color: '#c8902a' }}>
                Weeks {diaryEntries.length > 0 ? `${diaryEntries[0].week}–${diaryEntries[diaryEntries.length - 1].week}` : '—'}
              </span>
            </>
          ) : (
            <>
              <span style={footerStatStyle}>
                {stats.categoryBreakdown.policy || 0} Policy
              </span>
              <span style={{ ...footerStatStyle, color: '#2a7a7a' }}>
                {stats.categoryBreakdown.diplomacy || 0} Diplomacy
              </span>
              <span style={{ ...footerStatStyle, color: '#c8902a' }}>
                {stats.categoryBreakdown.personal || 0} Personal
              </span>
              <span style={{ ...footerStatStyle, color: 'var(--accent-green)' }}>
                {stats.categoryBreakdown.legislation || 0} Legislation
              </span>
              <span style={{ ...footerStatStyle, color: 'var(--accent-red)' }}>
                {stats.categoryBreakdown.crisis || 0} Crisis
              </span>
              <span style={{ ...footerStatStyle, color: '#7a3a9a' }}>
                {stats.categoryBreakdown.reform || 0} Reform
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function filterPillStyle(active: boolean, color?: string): React.CSSProperties {
  return {
    background: active ? (color ?? 'rgba(200,144,42,0.15)') : 'transparent',
    border: `1px solid ${active ? (color ?? 'rgba(200,144,42,0.35)') : 'rgba(200,144,42,0.12)'}`,
    color: active ? (color ?? 'var(--amber)') : 'var(--muted)',
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: '0.4rem',
    letterSpacing: '0.08em',
    padding: '0.18rem 0.45rem',
    cursor: 'pointer',
    borderRadius: '1px',
    whiteSpace: 'nowrap',
  }
}

const footerStatStyle: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '0.4rem',
  letterSpacing: '0.08em',
  color: 'var(--muted)',
}
