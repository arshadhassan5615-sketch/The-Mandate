import { useEffect, useMemo } from 'react'
import { useCodexStore, ALL_CODEX_ENTRIES } from '../stores/codexStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import { useGameStore } from '../stores/gameStore'
import { useSettingsStore } from '../stores/settingsStore'
import type { CodexCategory, CodexEntry } from '../types/codex'
import { CATEGORY_LABELS } from '../types/codex'
import CharacterPortrait from './portraits/CharacterPortrait'

// ─── Parchment palette (distinct from the game's dark theme) ─────────────────

const P = {
  bg:          '#f0e8d0',
  bgRaised:    '#f8f2e0',
  bgSelected:  '#ede0bb',
  sidebar:     '#e4d4a8',
  ink:         '#2a1a0a',
  inkDim:      '#5a4020',
  inkMuted:    '#8a6a40',
  border:      'rgba(120, 80, 30, 0.25)',
  borderStrong:'rgba(120, 80, 30, 0.5)',
  amber:       '#8b5a1a',
  amberLight:  '#b87830',
  newBadge:    '#7a1818',
  newBadgeBg:  'rgba(122, 24, 24, 0.12)',
  scrollbar:   '#c8a060',
}

// ─── Lightweight markdown renderer ───────────────────────────────────────────

function parseInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g
  let last = 0
  let m: RegExpExecArray | null
  let key = 0
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    const raw = m[0]
    if (raw.startsWith('**')) {
      parts.push(<strong key={key++} style={{ color: P.ink, fontWeight: 700 }}>{raw.slice(2, -2)}</strong>)
    } else {
      parts.push(<em key={key++}>{raw.slice(1, -1)}</em>)
    }
    last = m.index + raw.length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts.length === 1 ? parts[0] : <>{parts}</>
}

function renderMarkdown(content: string): React.ReactNode {
  const blocks = content.split('\n\n')
  return (
    <>
      {blocks.map((block, i) => {
        if (block.startsWith('## ')) {
          return (
            <h2 key={i} style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: '0.82rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: P.amber,
              margin: '1.4em 0 0.5em',
              paddingBottom: '0.3em',
              borderBottom: `1px solid ${P.border}`,
            }}>
              {block.slice(3)}
            </h2>
          )
        }
        if (block.startsWith('### ')) {
          return (
            <h3 key={i} style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: '0.72rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: P.inkDim,
              margin: '1.2em 0 0.4em',
            }}>
              {block.slice(4)}
            </h3>
          )
        }
        // List block: all lines start with "- "
        const lines = block.split('\n')
        if (lines.every(l => l.startsWith('- ') || l === '')) {
          const items = lines.filter(l => l.startsWith('- '))
          return (
            <ul key={i} style={{ paddingLeft: '1.2em', margin: '0.5em 0' }}>
              {items.map((item, j) => (
                <li key={j} style={{
                  fontFamily: "'IM Fell English', Georgia, serif",
                  fontSize: '0.88rem',
                  lineHeight: 1.7,
                  color: P.ink,
                  marginBottom: '0.2em',
                  listStyleType: 'disc',
                }}>
                  {parseInline(item.slice(2))}
                </li>
              ))}
            </ul>
          )
        }
        return (
          <p key={i} style={{
            fontFamily: "'IM Fell English', Georgia, serif",
            fontSize: '0.88rem',
            lineHeight: 1.78,
            color: P.ink,
            margin: '0 0 0.7em',
            textAlign: 'justify',
          }}>
            {parseInline(block)}
          </p>
        )
      })}
    </>
  )
}

// ─── Category tab ─────────────────────────────────────────────────────────────

function CategoryTab({
  cat, active, hasNew, onClick,
}: { cat: CodexCategory; active: boolean; hasNew: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        textAlign: 'left',
        background: active ? P.bgSelected : 'transparent',
        border: 'none',
        borderLeft: `3px solid ${active ? P.amberLight : 'transparent'}`,
        padding: '0.6rem 0.9rem',
        cursor: 'pointer',
        color: active ? P.ink : P.inkMuted,
        fontFamily: "'Special Elite', monospace",
        fontSize: '0.58rem',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={e => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(139,90,26,0.08)'
      }}
      onMouseLeave={e => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
      }}
    >
      {CATEGORY_LABELS[cat]}
      {hasNew && (
        <span style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: '0.45rem',
          letterSpacing: '0.1em',
          color: P.newBadge,
          background: P.newBadgeBg,
          border: `1px solid ${P.newBadge}`,
          padding: '0.1rem 0.3rem',
          flexShrink: 0,
        }}>
          NEW
        </span>
      )}
    </button>
  )
}

// ─── Entry list item ──────────────────────────────────────────────────────────

function EntryItem({
  entry, active, isNew, onClick,
}: { entry: CodexEntry; active: boolean; isNew: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        textAlign: 'left',
        background: active ? P.bgSelected : 'transparent',
        border: 'none',
        borderBottom: `1px solid ${P.border}`,
        padding: '0.65rem 1rem',
        cursor: 'pointer',
        color: active ? P.ink : P.inkDim,
        fontFamily: "'IM Fell English', Georgia, serif",
        fontSize: '0.88rem',
        lineHeight: 1.3,
        transition: 'background 0.12s ease',
      }}
      onMouseEnter={e => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(139,90,26,0.07)'
      }}
      onMouseLeave={e => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
      }}
    >
      {entry.title}
      {isNew && (
        <span style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: '0.45rem',
          letterSpacing: '0.1em',
          color: P.newBadge,
          background: P.newBadgeBg,
          border: `1px solid ${P.newBadge}`,
          padding: '0.1rem 0.3rem',
          flexShrink: 0,
          marginLeft: '0.5rem',
        }}>
          NEW
        </span>
      )}
    </button>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyCategory({ category }: { category: CodexCategory }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      gap: '0.5rem',
      opacity: 0.5,
    }}>
      <p style={{
        fontFamily: "'Special Elite', monospace",
        fontSize: '0.65rem',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: P.inkMuted,
      }}>
        — {CATEGORY_LABELS[category]} —
      </p>
      <p style={{
        fontFamily: "'IM Fell English', Georgia, serif",
        fontStyle: 'italic',
        fontSize: '0.85rem',
        color: P.inkMuted,
      }}>
        No entries unlocked yet.
      </p>
      <p style={{
        fontFamily: "'IM Fell English', Georgia, serif",
        fontStyle: 'italic',
        fontSize: '0.75rem',
        color: P.inkMuted,
        maxWidth: '260px',
        textAlign: 'center',
        lineHeight: 1.6,
      }}>
        Entries appear as you make decisions and learn more about the world.
      </p>
    </div>
  )
}

// ─── Main CodexViewer ─────────────────────────────────────────────────────────

const ORDERED_CATEGORIES: CodexCategory[] = [
  'nations', 'history', 'characters', 'ideologies', 'economy', 'laws', 'journal',
]

export default function CodexViewer() {
  const { isOpen, activeCategory, activeEntryId, seenEntryIds, closeCodex, setCategory, viewEntry } = useCodexStore()
  const setCharacterMapOpen = useSettingsStore(s => s.setCharacterMapOpen)
  const { activeFlags, unlockedCodexIds } = useNarrativeStore()
  const currentWeek = useGameStore(s => s.currentWeek)

  // Determine which entries are accessible
  const isUnlocked = (entry: CodexEntry): boolean => {
    if (entry.unlockCondition === 'start') return true
    return activeFlags.includes(entry.unlockCondition) || unlockedCodexIds.includes(entry.id)
  }

  const isNew = (entry: CodexEntry): boolean => {
    if (entry.unlockCondition === 'start') return false
    return isUnlocked(entry) && !seenEntryIds.includes(entry.id)
  }

  // Entries visible in the current category
  const categoryEntries = useMemo(
    () => ALL_CODEX_ENTRIES.filter(e => e.category === activeCategory && isUnlocked(e)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeCategory, activeFlags, unlockedCodexIds, ALL_CODEX_ENTRIES],
  )

  // Auto-select first entry when category changes and nothing is selected
  useEffect(() => {
    if (isOpen && categoryEntries.length > 0 && !categoryEntries.find(e => e.id === activeEntryId)) {
      viewEntry(categoryEntries[0].id)
    }
  }, [activeCategory, isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  const activeEntry = categoryEntries.find(e => e.id === activeEntryId) ?? categoryEntries[0] ?? null

  if (!isOpen) return null

  // Check if any category has new entries (for tab badges)
  const categoryHasNew = (cat: CodexCategory): boolean =>
    ALL_CODEX_ENTRIES.some(e => e.category === cat && isNew(e))

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10060,
      background: 'rgba(15, 8, 2, 0.82)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem',
    }}>
      <div style={{
        background: P.bg,
        border: `1px solid ${P.borderStrong}`,
        width: '100%',
        maxWidth: '1020px',
        height: '88vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
      }}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.9rem 1.5rem',
          background: P.sidebar,
          borderBottom: `2px solid ${P.borderStrong}`,
          flexShrink: 0,
        }}>
          <div>
            <p style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: '0.52rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: P.inkMuted,
              marginBottom: '0.1rem',
            }}>
              Republic of Veltria — Chancellor's Reference
            </p>
            <p style={{
              fontFamily: "'IM Fell English', Georgia, serif",
              fontSize: '1.15rem',
              color: P.ink,
              letterSpacing: '0.04em',
            }}>
              The Veltrian Codex
            </p>
          </div>
          <button
            onClick={closeCodex}
            style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: '0.6rem',
              letterSpacing: '0.15em',
              background: 'transparent',
              border: `1px solid ${P.border}`,
              color: P.inkMuted,
              padding: '0.4rem 0.8rem',
              cursor: 'pointer',
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* ── Body ────────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Category sidebar */}
          <div style={{
            width: '180px',
            flexShrink: 0,
            background: P.sidebar,
            borderRight: `1px solid ${P.borderStrong}`,
            overflowY: 'auto',
            paddingTop: '0.5rem',
          }}>
            <p style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: '0.48rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: P.inkMuted,
              padding: '0.5rem 0.9rem 0.3rem',
            }}>
              Sections
            </p>
            {ORDERED_CATEGORIES.map(cat => (
              <CategoryTab
                key={cat}
                cat={cat}
                active={cat === activeCategory}
                hasNew={categoryHasNew(cat)}
                onClick={() => setCategory(cat)}
              />
            ))}
            {/* Character Map link — available from any category, prominent in characters */}
            <div style={{ padding: '0.5rem 0.9rem', marginTop: '0.6rem', borderTop: `1px solid ${P.border}` }}>
              <button
                onClick={() => setCharacterMapOpen(true)}
                style={{
                  width: '100%',
                  padding: '0.4rem 0.5rem',
                  background: 'transparent',
                  border: `1px solid ${P.border}`,
                  color: P.amber,
                  fontFamily: "'Special Elite', monospace",
                  fontSize: '0.5rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.background = 'rgba(139,90,26,0.12)'
                  el.style.borderColor = P.amberLight
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.background = 'transparent'
                  el.style.borderColor = P.border
                }}
              >
                ▸ Character Map
              </button>
            </div>
          </div>

          {/* Entry list */}
          <div style={{
            width: '240px',
            flexShrink: 0,
            borderRight: `1px solid ${P.border}`,
            overflowY: 'auto',
            background: P.bgRaised,
            scrollbarWidth: 'thin',
            scrollbarColor: `${P.scrollbar} transparent`,
          }}>
            <p style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: '0.48rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: P.inkMuted,
              padding: '0.7rem 1rem 0.4rem',
              borderBottom: `1px solid ${P.border}`,
            }}>
              {CATEGORY_LABELS[activeCategory]}
            </p>
            {categoryEntries.length === 0 ? (
              <p style={{
                fontFamily: "'IM Fell English', Georgia, serif",
                fontStyle: 'italic',
                fontSize: '0.78rem',
                color: P.inkMuted,
                padding: '1rem',
                lineHeight: 1.6,
              }}>
                No entries unlocked.
              </p>
            ) : (
              categoryEntries.map(entry => (
                <EntryItem
                  key={entry.id}
                  entry={entry}
                  active={entry.id === activeEntry?.id}
                  isNew={isNew(entry)}
                  onClick={() => viewEntry(entry.id)}
                />
              ))
            )}
          </div>

          {/* Entry content */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            background: P.bg,
            scrollbarWidth: 'thin',
            scrollbarColor: `${P.scrollbar} transparent`,
          }}>
            {activeEntry ? (
              <div style={{
                padding: '2.5rem 3rem',
                maxWidth: '680px',
              }}>
                {/* Entry title */}
                <h1 style={{
                  fontFamily: "'IM Fell English', Georgia, serif",
                  fontSize: '1.5rem',
                  color: P.ink,
                  marginBottom: '0.2rem',
                  lineHeight: 1.2,
                }}>
                  {activeEntry.title}
                </h1>
                {/* Category tag */}
                <p style={{
                  fontFamily: "'Special Elite', monospace",
                  fontSize: '0.5rem',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: P.inkMuted,
                  marginBottom: '1.8rem',
                  paddingBottom: '0.8rem',
                  borderBottom: `1px solid ${P.border}`,
                }}>
                  {CATEGORY_LABELS[activeEntry.category]}
                </p>
                {/* Portrait float for character entries */}
                {activeEntry.category === 'characters' && (
                  <div style={{ float: 'right', marginLeft: '20px', marginBottom: '16px' }}>
                    <CharacterPortrait
                      characterId={activeEntry.id.replace(/^character_/, '')}
                      isActive={false}
                      size={120}
                      showName={false}
                    />
                  </div>
                )}
                {/* Markdown content */}
                <div>
                  {renderMarkdown(activeEntry.content)}
                </div>
                {/* Footer note */}
                <div style={{
                  marginTop: '3rem',
                  paddingTop: '1rem',
                  borderTop: `1px solid ${P.border}`,
                }}>
                  <p style={{
                    fontFamily: "'IM Fell English', Georgia, serif",
                    fontStyle: 'italic',
                    fontSize: '0.72rem',
                    color: P.inkMuted,
                    lineHeight: 1.6,
                  }}>
                    This entry reflects information available as of Week {currentWeek} of the Mandate. Entries may be revised as new information is discovered.
                  </p>
                </div>
              </div>
            ) : (
              <EmptyCategory category={activeCategory} />
            )}
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <div style={{
          flexShrink: 0,
          padding: '0.5rem 1.5rem',
          background: P.sidebar,
          borderTop: `1px solid ${P.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <p style={{
            fontFamily: "'Special Elite', monospace",
            fontSize: '0.48rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: P.inkMuted,
          }}>
            Codex entries marked NEW are recently unlocked. Click to read and dismiss the marker.
          </p>
          <p style={{
            fontFamily: "'Special Elite', monospace",
            fontSize: '0.48rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: P.inkMuted,
          }}>
            Ctrl+K — close
          </p>
        </div>
      </div>
    </div>
  )
}
