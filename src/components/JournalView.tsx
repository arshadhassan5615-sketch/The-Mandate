import { useState, useMemo } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useJournalStore } from '../stores/journalStore'
import { useGameStore } from '../stores/gameStore'
import type { DiaryEntry } from '../types/gameState'
import type { JournalCategory, ChoiceAlignment, JournalStats, JournalEntry } from '../types/journal'
import { CATEGORY_COLORS, CATEGORY_LABELS, CATEGORY_ICONS, ALIGNMENT_LABELS } from '../types/journal'
import { rem } from '../constants/typography'
import CabinetDrawer from './ui/cabinet/CabinetDrawer'
import { SeverityDot } from './ui/cabinet/CabinetParts'
import { CAB_BODY, CAB_FONT, CAB_LABEL, cabPillSegment } from './ui/cabinet/cabinetStyles'
import { PaperTabButton } from './panels/PaperPanel'

const ALL_CATEGORIES: JournalCategory[] = ['policy', 'diplomacy', 'personal', 'legislation', 'crisis', 'reform']
const ACTS = [1, 2, 3, 4]
const DIARY_CATEGORY_LABELS: Record<string, string> = {
  political: 'Political', personal: 'Personal', crisis: 'Crisis', diplomatic: 'Diplomatic', military: 'Military',
}
const DIARY_CATEGORY_COLORS: Record<string, string> = {
  political: '#3a5a7c', personal: '#c8902a', crisis: '#8b2e2e', diplomatic: '#2a7a7a', military: '#5a6b3a',
}
// Alignment tones follow meaning, drawn from the severity palette.
const ALIGNMENT_TONES: Record<ChoiceAlignment, string> = {
  reformist: 'var(--sev-calm)',
  pragmatist: 'var(--sev-strained)',
  authoritarian: 'var(--sev-critical)',
  populist: 'var(--sev-serious)',
  personal: 'var(--cab-gold)',
  deflect: 'var(--cab-muted)',
}
const TAB_JOURNAL_ID = 'journal-tab-journal'
const TAB_DIARY_ID = 'journal-tab-diary'
const TABPANEL_ID = 'journal-tabpanel'
const DRAWER_WIDTH = 'min(760px, calc(100vw - 220px))'

// Slips are cream paper, so their text uses fixed inks rather than the dark panel tokens.
const PAPER_INK = '#2a241c'
const PAPER_INK_SOFT = '#5a4d3a'
const PAPER_MUTED = '#6b5f4b'
const PAPER_HEADING = '#7a2a2a'
const PAPER_RULE = 'rgba(42,36,28,0.3)'

const FILTER_ROW: CSSProperties = { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6 }
const SLIP_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.012) 0 1px, transparent 1px 3px), #ece6d3',
  border: `1px solid ${PAPER_RULE}`,
  borderRadius: 2,
  boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
  padding: '14px 18px',
  color: PAPER_INK,
  cursor: 'pointer',
}
const SLIP_LABEL: CSSProperties = {
  ...CAB_LABEL,
  fontSize: rem(9.5),
  letterSpacing: '0.18em',
  color: PAPER_INK_SOFT,
  display: 'flex',
  alignItems: 'center',
}
const SLIP_TITLE: CSSProperties = {
  fontFamily: CAB_FONT.title,
  fontWeight: 700,
  fontSize: rem(17),
  lineHeight: 1.3,
  color: PAPER_INK,
  margin: '8px 0 6px',
}
const SLIP_TEXT: CSSProperties = { fontFamily: CAB_FONT.body, fontSize: rem(15), lineHeight: 1.5, color: PAPER_INK }
const SLIP_META: CSSProperties = {
  ...CAB_LABEL,
  fontSize: rem(10),
  letterSpacing: '0.14em',
  color: PAPER_MUTED,
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 12,
}
const SLIP_SUBHEAD: CSSProperties = { ...CAB_LABEL, fontSize: rem(10), color: PAPER_HEADING }
const SLIP_TOP_ROW: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }
const SIGNED_INK = 'rgba(61,106,52,0.85)'
const VETOED_INK = 'rgba(122,42,42,0.85)'
const SEARCH_INPUT: CSSProperties = {
  background: 'rgba(0,0,0,0.35)',
  border: '1px solid rgba(201,168,76,0.35)',
  borderRadius: 4,
  color: 'var(--cab-text)',
  fontFamily: "'Crimson Text', Georgia, serif",
  fontSize: rem(14),
  padding: '7px 10px',
  width: '100%',
  boxSizing: 'border-box',
}

function actOf(week: number): number {
  return week <= 13 ? 1 : week <= 26 ? 2 : week <= 39 ? 3 : 4
}

function getActLabel(act: number): string {
  switch (act) {
    case 1: return 'Act I · The Foundation'
    case 2: return 'Act II · The Consolidation'
    case 3: return 'Act III · The Furnace'
    case 4: return 'Act IV · The Reckoning'
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

function filterPill(active: boolean): CSSProperties {
  return {
    ...cabPillSegment(active),
    fontSize: rem(10),
    padding: '3px 10px',
    border: active ? '1px solid var(--cab-gold)' : '1px solid rgba(201,168,76,0.3)',
  }
}

/** Collapsed entries clamp their text to two lines; expanded entries show it all. */
function clampStyle(isExpanded: boolean): CSSProperties {
  return {
    display: '-webkit-box',
    WebkitLineClamp: isExpanded ? 99 : 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  }
}

function AlignmentBar({ stats }: { stats: JournalStats }) {
  const total = stats.totalEntries || 1
  const alignments = ['reformist', 'pragmatist', 'authoritarian', 'populist', 'personal', 'deflect'] as ChoiceAlignment[]
  const widths = alignments.map(a => ({
    label: ALIGNMENT_LABELS[a],
    tone: ALIGNMENT_TONES[a],
    count: stats.alignmentBreakdown[a] || 0,
    pct: Math.round(((stats.alignmentBreakdown[a] || 0) / total) * 100),
  })).filter(w => w.count > 0)

  if (widths.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ ...CAB_LABEL, fontSize: rem(10), textAlign: 'center' }}>
        Political Alignment
      </div>
      <div style={{ display: 'flex', height: 4, background: 'rgba(201,168,76,0.18)', overflow: 'hidden' }}>
        {widths.map((w, i) => (
          <div
            key={w.label ?? i}
            style={{
              flex: w.count,
              background: w.tone,
              minWidth: '4px',
            }}
            title={`${w.label}: ${w.pct}%`}
          />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
        {widths.map((w, i) => (
          <span key={w.label ?? i} style={{ ...CAB_LABEL, fontSize: rem(10), letterSpacing: '0.08em', color: w.tone }}>
            {w.label} {w.pct}%
          </span>
        ))}
      </div>
    </div>
  )
}

function EmptyNote({ text }: { text: string }) {
  return (
    <div style={{ ...CAB_BODY, fontStyle: 'italic', color: 'var(--cab-muted)', textAlign: 'center', padding: '24px 8px' }}>
      {text}
    </div>
  )
}

function ActSection({ act, children }: { act: number; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ ...CAB_LABEL, color: 'var(--cab-gold)', letterSpacing: '0.3em' }}>{`— ${getActLabel(act)} —`}</div>
        <div style={{ ...CAB_LABEL, fontSize: rem(10), letterSpacing: '0.16em', marginTop: 2 }}>{getActDateRange(act)}</div>
      </div>
      {children}
    </div>
  )
}

interface PaperSlipProps {
  index: number
  onToggle: () => void
  children: ReactNode
}

/** Ink stamp for a bill outcome; returns null for entries with no outcome. */
function OutcomeStamp({ flag }: { flag: string | null }) {
  if (flag !== 'bill_signed' && flag !== 'bill_vetoed') return null
  const text = flag === 'bill_signed' ? 'SIGNED' : 'VETOED'
  const ink = flag === 'bill_signed' ? SIGNED_INK : VETOED_INK
  return (
    <span
      data-testid="journal-stamp"
      style={{
        fontFamily: CAB_FONT.label,
        fontWeight: 700,
        fontSize: rem(9),
        letterSpacing: '.16em',
        color: ink,
        border: `1.5px solid ${ink}`,
        padding: '1px 7px',
        transform: 'rotate(-4deg)',
        mixBlendMode: 'multiply',
      }}
    >
      {text}
    </span>
  )
}

/** A cream paper slip, tilted slightly so consecutive entries look hand-placed. */
function PaperSlip({ index, onToggle, children }: PaperSlipProps) {
  const tilt = index % 2 === 0 ? -0.3 : 0.25
  return (
    <article data-testid="journal-slip" onClick={onToggle} style={{ ...SLIP_STYLE, transform: `rotate(${tilt}deg)` }}>
      {children}
    </article>
  )
}

interface JournalEntrySlipProps {
  entry: JournalEntry
  index: number
  isExpanded: boolean
  onToggle: () => void
}

function JournalEntrySlip({ entry, index, isExpanded, onToggle }: JournalEntrySlipProps) {
  return (
    <PaperSlip index={index} onToggle={onToggle}>
      <div style={SLIP_TOP_ROW}>
        <div style={SLIP_LABEL}>
          <SeverityDot color={CATEGORY_COLORS[entry.category]} />
          {CATEGORY_LABELS[entry.category]} · Week {entry.weekNumber}
        </div>
        <OutcomeStamp flag={entry.flag} />
      </div>
      <h3 style={SLIP_TITLE}>{entry.title}</h3>
      <div style={{ ...SLIP_TEXT, ...clampStyle(isExpanded) }}>
        {entry.description}
      </div>

      {isExpanded && entry.consequences && (
        <div style={{ borderLeft: `2px solid ${PAPER_RULE}`, paddingLeft: 10 }}>
          <div style={SLIP_SUBHEAD}>Consequences</div>
          <div style={{ ...SLIP_TEXT, fontStyle: 'italic' }}>
            "{entry.consequences}"
          </div>
        </div>
      )}

      {isExpanded && !entry.consequences && (
        <div style={{ ...CAB_BODY, fontSize: rem(13), fontStyle: 'italic', color: PAPER_MUTED }}>
          Consequences have not yet manifested.
        </div>
      )}

      {isExpanded && (
        <div style={SLIP_META}>
          <span>{entry.date}</span>
          {entry.alignment && (
            <span style={{ color: ALIGNMENT_TONES[entry.alignment] }}>
              {ALIGNMENT_LABELS[entry.alignment]}
            </span>
          )}
        </div>
      )}
    </PaperSlip>
  )
}

interface DiaryEntrySlipProps {
  entry: DiaryEntry
  index: number
  isExpanded: boolean
  onToggle: () => void
}

function DiaryEntrySlip({ entry, index, isExpanded, onToggle }: DiaryEntrySlipProps) {
  return (
    <PaperSlip index={index} onToggle={onToggle}>
      <div style={SLIP_LABEL}>
        <SeverityDot color={DIARY_CATEGORY_COLORS[entry.category] ?? PAPER_MUTED} />
        Diary · Week {entry.week}
      </div>
      <div style={{ ...SLIP_TEXT, fontStyle: 'italic', ...clampStyle(isExpanded) }}>
        {entry.text.split('\n')[0]}
      </div>

      {isExpanded && (
        <>
          <div style={SLIP_META}>
            <span>{DIARY_CATEGORY_LABELS[entry.category] ?? entry.category}</span>
            <span>{entry.date}</span>
          </div>
          <div style={{ ...SLIP_TEXT, fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
            {entry.text}
          </div>
        </>
      )}
    </PaperSlip>
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
        if (actOf(e.weekNumber) !== selectedAct) return false
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
      groups[actOf(e.weekNumber)].push(e)
    }
    return groups
  }, [filteredEntries])

  const isDiary = viewMode === 'diary'
  const dominantLabel = stats.dominantAlignment ? ALIGNMENT_LABELS[stats.dominantAlignment] : null
  const journalFooter = `${entries.length} entries · ${stats.billsSigned} signed / ${stats.billsVetoed} vetoed`
    + (dominantLabel ? ` · Aligned: ${dominantLabel}` : '')
  const diaryWeekRange = diaryEntries.length > 0 ? `${diaryEntries[0].week}–${diaryEntries[diaryEntries.length - 1].week}` : '—'
  const diaryFooter = `${diaryEntries.length} diary entries · Weeks ${diaryWeekRange}`

  const tabs = (
    <>
      <PaperTabButton
        id={TAB_JOURNAL_ID}
        controls={TABPANEL_ID}
        label="Journal"
        active={!isDiary}
        onSelect={() => setViewMode('journal')}
      />
      <PaperTabButton
        id={TAB_DIARY_ID}
        controls={TABPANEL_ID}
        label="Diary"
        count={diaryEntries.length}
        active={isDiary}
        onSelect={() => setViewMode('diary')}
      />
    </>
  )

  const diaryContent = diaryEntries.length === 0
    ? <EmptyNote text="No diary entries yet. Your personal reflections will appear here each week." />
    : [...diaryEntries].reverse().map((entry, index) => {
      if (selectedAct !== null && actOf(entry.week) !== selectedAct) return null
      const key = `diary_${entry.week}`
      const isExpanded = expandedId === key
      return (
        <DiaryEntrySlip
          key={key}
          entry={entry}
          index={index}
          isExpanded={isExpanded}
          onToggle={() => setExpandedId(isExpanded ? null : key)}
        />
      )
    })

  const journalContent = filteredEntries.length === 0
    ? (
      <EmptyNote
        text={entries.length === 0
          ? 'No entries yet. Your decisions will be recorded here as you govern.'
          : 'No entries match your filters.'}
      />
    )
    : ACTS.map(act => {
      const actEntries = groupedByAct[act]
      if (actEntries.length === 0) return null
      return (
        <ActSection key={act} act={act}>
          {actEntries.map((entry, index) => {
            const isExpanded = expandedId === entry.id
            return (
              <JournalEntrySlip
                key={entry.id}
                entry={entry}
                index={index}
                isExpanded={isExpanded}
                onToggle={() => setExpandedId(isExpanded ? null : entry.id)}
              />
            )
          })}
        </ActSection>
      )
    })

  return (
    <CabinetDrawer
      testId="journal-view"
      titleId="journal-title"
      title="The Chancellor's Journal"
      overline="Private papers"
      closeLabel="Close journal"
      onClose={onClose}
      width={DRAWER_WIDTH}
      tabs={tabs}
      tabsLabel="Journal sections"
      footer={isDiary ? diaryFooter : journalFooter}
    >
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8, padding: '0 22px 10px' }}>
        {/* Act filter pills */}
        <div style={FILTER_ROW}>
          <button
            type="button"
            className="cabinet-pill-seg"
            aria-pressed={selectedAct === null}
            onClick={() => setSelectedAct(null)}
            style={filterPill(selectedAct === null)}
          >
            All
          </button>
          {ACTS.map(act => (
            <button
              key={act}
              type="button"
              className="cabinet-pill-seg"
              aria-pressed={selectedAct === act}
              onClick={() => setSelectedAct(selectedAct === act ? null : act)}
              style={filterPill(selectedAct === act)}
            >
              Act {act}
            </button>
          ))}
        </div>

        {/* Category filter pills */}
        <div style={FILTER_ROW}>
          {ALL_CATEGORIES.map(cat => {
            const isActive = selectedCategory === cat
            return (
              <button
                key={cat}
                type="button"
                className="cabinet-pill-seg"
                aria-pressed={isActive}
                onClick={() => setSelectedCategory(isActive ? null : cat)}
                style={filterPill(isActive)}
              >
                <SeverityDot color={CATEGORY_COLORS[cat]} />
                {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]} {stats.categoryBreakdown[cat] || 0}
              </button>
            )
          })}
        </div>

        <input
          type="text"
          placeholder="Search..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={SEARCH_INPUT}
        />
      </div>

      <div
        id={TABPANEL_ID}
        role="tabpanel"
        aria-labelledby={isDiary ? TAB_DIARY_ID : TAB_JOURNAL_ID}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(201,168,76,0.3) transparent',
          padding: '4px 20px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {!isDiary && <AlignmentBar stats={stats} />}
        {isDiary ? diaryContent : journalContent}
      </div>
    </CabinetDrawer>
  )
}
