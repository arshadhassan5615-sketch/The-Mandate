import { Fragment, useMemo, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useCodexStore, ALL_CODEX_ENTRIES } from '../../stores/codexStore'
import CabinetDrawer from '../ui/cabinet/CabinetDrawer'
import { CabinetButton, CabinetCard } from '../ui/cabinet/CabinetParts'
import CodexImages from '../ui/cabinet/CodexImages'
import { CAB_BODY, CAB_LABEL } from '../ui/cabinet/cabinetStyles'
import { renderWithEntities } from '../news/EntityLinker'
import { useCodexEntryView } from '../../hooks/useCodexEntryView'
import { rem } from '../../constants/typography'
import { Z } from '../../constants/zIndex'

const NAV_BUTTON_SIZE = 42

const NAV_BUTTON_STYLE: CSSProperties = {
  width: NAV_BUTTON_SIZE,
  height: NAV_BUTTON_SIZE,
  borderRadius: 4,
  background: 'linear-gradient(#2a2a2a, #141414)',
  border: '1px solid rgba(201,168,76,0.45)',
  color: 'var(--cab-gold-bright)',
  fontSize: rem(16),
  lineHeight: 1,
  padding: 0,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const PARAGRAPH_STYLE: CSSProperties = {
  ...CAB_BODY,
  fontSize: rem(15),
  lineHeight: 1.6,
  color: 'var(--cab-text)',
  margin: '0 0 0.6em',
}

const HEADING_STYLE: CSSProperties = {
  ...CAB_LABEL,
  fontSize: rem(11),
  letterSpacing: '.2em',
  color: 'var(--cab-gold)',
  margin: '16px 0 6px',
}

const LIST_STYLE: CSSProperties = { listStyle: 'none', padding: 0, margin: '0.3em 0' }

const LIST_ITEM_STYLE: CSSProperties = { ...PARAGRAPH_STYLE, margin: '0 0 0.25em', paddingLeft: '1.1em', position: 'relative' }

const BULLET_STYLE: CSSProperties = {
  position: 'absolute', left: 0, top: 0, color: 'var(--cab-gold)', fontSize: rem(9),
}

const SCROLL_STYLE: CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(201,168,76,0.3) transparent',
  padding: '0 20px 16px',
}

/** Splits a paragraph into bold / italic runs; plain runs get entity links. */
function parseInline(text: string): ReactNode {
  const parts: ReactNode[] = []
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g
  let last = 0
  let m: RegExpExecArray | null
  let key = 0
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(<Fragment key={key++}>{renderWithEntities(text.slice(last, m.index), true)}</Fragment>)
    const raw = m[0]
    if (raw.startsWith('**')) {
      parts.push(
        <strong key={key++} style={{ color: 'var(--cab-title)', fontWeight: 600 }}>
          {renderWithEntities(raw.slice(2, -2), true)}
        </strong>,
      )
    } else {
      parts.push(<em key={key++}>{renderWithEntities(raw.slice(1, -1), true)}</em>)
    }
    last = m.index + raw.length
  }
  if (last < text.length) parts.push(<Fragment key={key}>{renderWithEntities(text.slice(last), true)}</Fragment>)
  return parts
}

function renderBlock(block: string, index: number): ReactNode {
  if (block.startsWith('## ')) {
    return <h4 key={index} style={HEADING_STYLE}>{block.slice(3)}</h4>
  }
  if (block.startsWith('### ')) {
    return <h4 key={index} style={HEADING_STYLE}>{block.slice(4)}</h4>
  }
  const lines = block.split('\n')
  if (lines.every(l => l.startsWith('- ') || l === '')) {
    const items = lines.filter(l => l.startsWith('- '))
    return (
      <ul key={index} style={LIST_STYLE}>
        {items.map((item, j) => (
          <li key={j} style={LIST_ITEM_STYLE}>
            <span aria-hidden="true" style={BULLET_STYLE}>◆ </span>
            {parseInline(item.slice(2))}
          </li>
        ))}
      </ul>
    )
  }
  return <p key={index} style={PARAGRAPH_STYLE}>{parseInline(block)}</p>
}

function renderMarkdown(content: string): ReactNode {
  return content.split('\n\n').map(renderBlock)
}

function NavButton({ label, glyph, disabled, onClick }: { label: string; glyph: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.borderColor = 'var(--cab-gold)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.45)' }}
      style={{ ...NAV_BUTTON_STYLE, opacity: disabled ? 0.4 : 1, cursor: disabled ? 'default' : 'pointer' }}
    >
      <span aria-hidden="true">{glyph}</span>
    </button>
  )
}

export default function InlineCodexPanel() {
  const { inlineCodexOpen, activeEntryId, closeInlineCodex, openCodex, openInlineCodex } = useCodexStore()
  const entry = useMemo(() => {
    if (!activeEntryId) return null
    return ALL_CODEX_ENTRIES.find(e => e.id === activeEntryId) ?? null
  }, [activeEntryId])
  const view = useCodexEntryView(entry)

  const [history, setHistory] = useState<string[]>([])
  const [pos, setPos] = useState(0)

  // History follows the store's activeEntryId. State is adjusted during render (not in an effect),
  // so the drawer never paints a frame with a stale step. Each new entry becomes a step, and
  // opening an entry after going back drops the forward steps. Closing clears the history.
  if (!inlineCodexOpen) {
    if (history.length > 0 || pos !== 0) {
      setHistory([])
      setPos(0)
    }
  } else if (activeEntryId && activeEntryId !== history[pos]) {
    const next = [...history.slice(0, pos + 1), activeEntryId]
    setHistory(next)
    setPos(next.length - 1)
  }

  if (!inlineCodexOpen || !entry) return null
  const shown = view ?? { title: entry.title, content: entry.content }

  const goBack = () => {
    setPos(pos - 1)
    openInlineCodex(history[pos - 1])
  }
  const goForward = () => {
    setPos(pos + 1)
    openInlineCodex(history[pos + 1])
  }
  const openInBriefs = () => {
    openCodex(undefined, entry.id)
    closeInlineCodex()
  }

  return (
    <CabinetDrawer
      testId="inline-codex"
      titleId="inline-codex-title"
      title="Codex"
      closeLabel="Close codex"
      onClose={closeInlineCodex}
      width="min(440px, calc(100vw - 220px))"
      zIndex={Z.inlineCodex}
      footer="Esc · back to the conversation"
    >
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <nav aria-label="Codex history" style={{ display: 'flex', justifyContent: 'center', gap: 14, margin: '0 0 14px', flexShrink: 0 }}>
          <NavButton label="Open the Briefs Library" glyph="⌂" onClick={openInBriefs} />
          <NavButton label="Back" glyph="◀" disabled={pos === 0} onClick={goBack} />
          <NavButton label="Forward" glyph="▶" disabled={pos === history.length - 1} onClick={goForward} />
        </nav>
        <div style={SCROLL_STYLE}>
          <CabinetCard title={shown.title} testId="inline-codex-card" bodyStyle={{ padding: '14px 18px 16px' }}>
            <CodexImages entryId={entry.id} surface="dark" />
            <div style={{ textAlign: 'center', margin: '2px 0 14px' }}>
              <CabinetButton variant="primary" size="small" onClick={openInBriefs}>
                Open in Briefs Library
              </CabinetButton>
            </div>
            {renderMarkdown(shown.content)}
          </CabinetCard>
        </div>
      </div>
    </CabinetDrawer>
  )
}
