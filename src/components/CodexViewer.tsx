import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useCodexStore, ALL_CODEX_ENTRIES } from '../stores/codexStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import { useGameStore } from '../stores/gameStore'
import { useSettingsStore } from '../stores/settingsStore'
import { viewCodexEntry } from '../engine/codexEntryView'
import { useCabinetSnapshot } from '../hooks/useCodexEntryView'
import type { CodexCategory, CodexEntry } from '../types/codex'
import { CATEGORY_LABELS } from '../types/codex'
import CodexImages from './ui/cabinet/CodexImages'
import { getCodexImages } from '../assets/codexArt'
import { useIsMobile } from '../hooks/useIsMobile'
import { isBriefUnlocked } from './briefs/briefAccess'
import { rem } from '../constants/typography'
import CabinetDrawer from './ui/cabinet/CabinetDrawer'
import { CabinetCard, SeverityDot } from './ui/cabinet/CabinetParts'
import { PaperSheet } from './ui/cabinet/PaperParts'
import { CAB_BODY, CAB_FONT, CAB_LABEL, CAB_TITLE, cabPillSegment } from './ui/cabinet/cabinetStyles'

// ─── Cabinet styling ─────────────────────────────────────────────────────────

const GOLD_HAIRLINE = 'rgba(201,168,76,0.3)'
const HOVER_TINT = 'rgba(201,168,76,0.05)'
const SELECTED_TINT = 'rgba(201,168,76,0.08)'
const LIST_WIDTH = 250
const DRAWER_WIDTH = 'min(980px, calc(100vw - 220px))'
const DRAWER_FOOTER = 'New entries are marked with a gold dot · Ctrl+K to close'

// The reader is cream paper, so its text uses fixed inks rather than the dark panel tokens.
const PAPER_INK = '#2a241c'
const PAPER_MUTED = '#6b5f4b'
const PAPER_HEADING = '#7a2a2a'
const PAPER_RULE = 'rgba(42,36,28,0.3)'

const READER_BODY: CSSProperties = { ...CAB_BODY, fontSize: rem(16), lineHeight: 1.6, color: PAPER_INK }
const SUBHEADING: CSSProperties = {
  ...CAB_LABEL,
  fontFamily: CAB_FONT.label,
  fontWeight: 700,
  fontSize: rem(11),
  letterSpacing: '0.2em',
  color: PAPER_HEADING,
  margin: '18px 0 6px',
}
const PAPER_CLASSIFICATION: CSSProperties = {
  ...CAB_LABEL,
  fontSize: rem(9.5),
  letterSpacing: '0.2em',
  color: PAPER_MUTED,
}
const PAPER_TITLE: CSSProperties = {
  ...CAB_TITLE,
  fontWeight: 700,
  fontSize: rem(26),
  color: PAPER_INK,
  margin: '4px 0 8px',
}
const PAPER_RULE_LINE: CSSProperties = { height: 1, background: PAPER_INK, marginBottom: 12 }
const PAPER_IMAGE_FLOAT: CSSProperties = {
  float: 'right',
  width: 'min(220px, 40%)',
  margin: '2px 0 10px 18px',
}
const PHONE_IMAGE_BLOCK: CSSProperties = {
  width: '100%',
  textAlign: 'center',
  margin: '4px 0 12px',
}
const ENTRY_PAPER_STYLE: CSSProperties = {
  flex: 1,
  minWidth: 0,
  minHeight: 0,
  overflowY: 'auto',
  padding: '26px 34px',
}
const CHARACTER_MAP_PILL: CSSProperties = {
  ...cabPillSegment(false),
  fontSize: rem(10),
  padding: '3px 10px',
  border: '1px solid var(--cab-gold)',
  color: 'var(--cab-gold-bright)',
}
const SCROLLBAR: CSSProperties = {
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(201,168,76,0.3) transparent',
}
// Keeps the "New" marker readable to screen readers while the dot shows it visually.
const VISUALLY_HIDDEN: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
}

// ─── Lightweight markdown renderer ───────────────────────────────────────────

function parseInline(text: string): ReactNode {
  const parts: ReactNode[] = []
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g
  let last = 0
  let m: RegExpExecArray | null
  let key = 0
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    const raw = m[0]
    if (raw.startsWith('**')) {
      parts.push(<strong key={key++} style={{ color: '#1a140c', fontWeight: 600 }}>{raw.slice(2, -2)}</strong>)
    } else {
      parts.push(<em key={key++}>{raw.slice(1, -1)}</em>)
    }
    last = m.index + raw.length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts.length === 1 ? parts[0] : <>{parts}</>
}

function renderMarkdown(content: string): ReactNode {
  const blocks = content.split('\n\n')
  return (
    <>
      {blocks.map((block, i) => {
        if (block.startsWith('## ')) {
          return <h2 key={i} style={SUBHEADING}>{block.slice(3)}</h2>
        }
        if (block.startsWith('### ')) {
          return <h3 key={i} style={SUBHEADING}>{block.slice(4)}</h3>
        }
        // List block: all lines start with "- "
        const lines = block.split('\n')
        if (lines.every(l => l.startsWith('- ') || l === '')) {
          const items = lines.filter(l => l.startsWith('- '))
          return (
            <ul key={i} style={{ paddingLeft: '1.2em', margin: '0.5em 0' }}>
              {items.map((item, j) => (
                <li key={j} style={{ ...READER_BODY, marginBottom: '0.2em', listStyleType: 'disc' }}>
                  {parseInline(item.slice(2))}
                </li>
              ))}
            </ul>
          )
        }
        return (
          <p key={i} style={{ ...READER_BODY, margin: '0 0 0.7em', textAlign: 'justify' }}>
            {parseInline(block)}
          </p>
        )
      })}
    </>
  )
}

// ─── Section pill ─────────────────────────────────────────────────────────────

function CategoryPill({
  cat, active, hasNew, onClick,
}: { cat: CodexCategory; active: boolean; hasNew: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className="cabinet-pill-seg"
      onClick={onClick}
      style={{
        ...cabPillSegment(active),
        fontSize: rem(10),
        padding: '3px 10px',
        border: active ? '1px solid var(--cab-gold)' : `1px solid ${GOLD_HAIRLINE}`,
      }}
    >
      {hasNew && <SeverityDot color="var(--cab-gold)" />}
      {hasNew && <span style={VISUALLY_HIDDEN}>New </span>}
      {CATEGORY_LABELS[cat]}
    </button>
  )
}

// ─── Entry list item ──────────────────────────────────────────────────────────

function EntryItem({
  title, active, isFirst, isNew, onClick,
}: { title: string; active: boolean; isFirst: boolean; isNew: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={e => {
        if (!active) e.currentTarget.style.background = HOVER_TINT
      }}
      onMouseLeave={e => {
        if (!active) e.currentTarget.style.background = 'transparent'
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        width: '100%',
        textAlign: 'left',
        background: active ? SELECTED_TINT : 'transparent',
        border: 'none',
        borderTop: isFirst ? 'none' : '1px solid var(--cab-card-edge)',
        borderLeft: `3px solid ${active ? 'var(--cab-gold)' : 'transparent'}`,
        padding: '8px 12px',
        cursor: 'pointer',
        color: active ? 'var(--cab-gold-bright)' : 'var(--cab-text)',
        fontFamily: CAB_FONT.title,
        fontWeight: 700,
        fontSize: rem(14.5),
        lineHeight: 1.3,
      }}
    >
      {title}
      {isNew && <SeverityDot color="var(--cab-gold)" />}
      {isNew && <span style={VISUALLY_HIDDEN}>New</span>}
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
      textAlign: 'center',
    }}>
      <p style={{ ...CAB_LABEL, fontSize: rem(10), margin: 0 }}>
        — {CATEGORY_LABELS[category]} —
      </p>
      <p style={{ ...CAB_BODY, fontStyle: 'italic', color: 'var(--cab-muted)', margin: 0 }}>
        No entries unlocked yet.
      </p>
      <p style={{
        ...CAB_BODY,
        fontStyle: 'italic',
        fontSize: rem(13),
        color: 'var(--cab-muted)',
        maxWidth: 260,
        lineHeight: 1.6,
        margin: 0,
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
  const cabinetSnapshot = useCabinetSnapshot()

  // Determine which entries are accessible
  const isUnlocked = (entry: CodexEntry): boolean => isBriefUnlocked(entry, activeFlags, unlockedCodexIds)

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
  const activeView = activeEntry ? viewCodexEntry(activeEntry, cabinetSnapshot) : null

  // Phones can't fit two columns: show the list (sections + entries), then
  // the chosen entry full width with a way back.
  const isPhone = useIsMobile()
  const [phonePane, setPhonePane] = useState<'list' | 'entry'>('list')
  const showList = !isPhone || phonePane === 'list'
  const showEntry = !isPhone || phonePane === 'entry'

  if (!isOpen) return null

  const hasEntryImages = activeEntry ? getCodexImages(activeEntry.id).length > 0 : false

  // Check if any category has new entries (for section pills)
  const categoryHasNew = (cat: CodexCategory): boolean =>
    ALL_CODEX_ENTRIES.some(e => e.category === cat && isNew(e))

  return (
    <CabinetDrawer
      testId="codex-viewer"
      titleId="codex-title"
      title="Briefs Library"
      overline="Republic of Veltria — Chancellery briefs"
      closeLabel="Close briefs"
      onClose={closeCodex}
      width={DRAWER_WIDTH}
      footer={DRAWER_FOOTER}
    >
      {/* ── Section pills ─────────────────────────────────────── */}
      <div style={{
        display: showList ? 'flex' : 'none',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 6,
        padding: '0 18px',
        flexShrink: 0,
      }}>
        {ORDERED_CATEGORIES.map(cat => (
          <CategoryPill
            key={cat}
            cat={cat}
            active={cat === activeCategory}
            hasNew={categoryHasNew(cat)}
            onClick={() => setCategory(cat)}
          />
        ))}
        {/* Character Map link — available from any category, prominent in characters */}
        <button
          type="button"
          className="cabinet-pill-seg"
          onClick={() => setCharacterMapOpen(true)}
          style={CHARACTER_MAP_PILL}
        >
          ▸ Character Map
        </button>
      </div>

      {/* ── Body: entry list and reader ───────────────────────── */}
      <div style={{ display: 'flex', gap: 14, flex: 1, minHeight: 0, padding: '10px 18px 14px' }}>

        {/* Entry list */}
        <div style={{
          display: showList ? 'flex' : 'none',
          flexDirection: 'column',
          width: isPhone ? '100%' : LIST_WIDTH,
          flexShrink: 0,
          minHeight: 0,
        }}>
          <CabinetCard
            title={CATEGORY_LABELS[activeCategory]}
            style={{ flexShrink: 1, display: 'flex', flexDirection: 'column', minHeight: 0, maxHeight: '100%' }}
            bodyStyle={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(201,168,76,0.3) transparent',
            }}
          >
            {categoryEntries.length === 0 ? (
              <p style={{ ...CAB_BODY, fontStyle: 'italic', color: 'var(--cab-muted)', padding: 12, margin: 0 }}>
                No entries unlocked.
              </p>
            ) : (
              categoryEntries.map((entry, index) => (
                <EntryItem
                  key={entry.id}
                  title={viewCodexEntry(entry, cabinetSnapshot).title}
                  active={entry.id === activeEntry?.id}
                  isFirst={index === 0}
                  isNew={isNew(entry)}
                  onClick={() => { viewEntry(entry.id); if (isPhone) setPhonePane('entry') }}
                />
              ))
            )}
          </CabinetCard>
        </div>

        {/* Entry reader */}
        <div style={{
          display: showEntry ? 'flex' : 'none',
          flexDirection: 'column',
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          padding: '4px 6px 10px',
          ...SCROLLBAR,
        }}>
          {isPhone && (
            <button
              type="button"
              onClick={() => setPhonePane('list')}
              style={{
                ...CAB_LABEL,
                fontSize: rem(10),
                margin: '0 0 12px',
                padding: '4px 10px',
                background: 'transparent',
                border: `1px solid ${GOLD_HAIRLINE}`,
                color: 'var(--cab-muted)',
                cursor: 'pointer',
              }}
            >
              ← Back to {CATEGORY_LABELS[activeCategory]}
            </button>
          )}
          {activeEntry && activeView ? (
            <PaperSheet
              letterhead={false}
              watermark
              testId="codex-entry-paper"
              style={ENTRY_PAPER_STYLE}
              wrapStyle={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}
            >
              {/* Classification line */}
              <div style={PAPER_CLASSIFICATION}>
                BRIEF · {CATEGORY_LABELS[activeEntry.category]}
              </div>
              {/* Entry title */}
              <h1 style={PAPER_TITLE}>
                {activeView.title}
              </h1>
              <div style={PAPER_RULE_LINE} />
              {/* Entry image: floated right on desktop, centred block on phone */}
              {hasEntryImages && (
                <div style={isPhone ? PHONE_IMAGE_BLOCK : PAPER_IMAGE_FLOAT}>
                  <CodexImages entryId={activeEntry.id} surface="paper" />
                </div>
              )}
              {/* Markdown content */}
              <div>
                {renderMarkdown(activeView.content)}
              </div>
              {/* Footer note */}
              <div style={{
                marginTop: 24,
                paddingTop: 12,
                borderTop: `1px solid ${PAPER_RULE}`,
              }}>
                <p style={{
                  ...CAB_BODY,
                  fontStyle: 'italic',
                  fontSize: rem(13),
                  color: PAPER_MUTED,
                  lineHeight: 1.6,
                  margin: 0,
                }}>
                  This entry reflects information available as of Week {currentWeek} of the Mandate. Entries may be revised as new information is discovered.
                </p>
              </div>
            </PaperSheet>
          ) : (
            <EmptyCategory category={activeCategory} />
          )}
        </div>
      </div>
    </CabinetDrawer>
  )
}
