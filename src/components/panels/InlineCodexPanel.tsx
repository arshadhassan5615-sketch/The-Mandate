import { useEffect, useMemo } from 'react'
import { useCodexStore, ALL_CODEX_ENTRIES } from '../../stores/codexStore'
import { CATEGORY_LABELS } from '../../types/codex'
import CharacterPortrait from '../portraits/CharacterPortrait'

const P = {
  bg:          '#f0e8d0',
  bgRaised:    '#f8f2e0',
  sidebar:     '#e4d4a8',
  ink:         '#2a1a0a',
  inkDim:      '#5a4020',
  inkMuted:    '#8a6a40',
  border:      'rgba(120, 80, 30, 0.25)',
  borderStrong:'rgba(120, 80, 30, 0.5)',
  amber:       '#8b5a1a',
}

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
              fontFamily: "'Special Elite', monospace", fontSize: '0.72rem',
              letterSpacing: '0.16em', textTransform: 'uppercase',
              color: P.amber, margin: '1em 0 0.4em',
              paddingBottom: '0.3em', borderBottom: `1px solid ${P.border}`,
            }}>{block.slice(3)}</h2>
          )
        }
        if (block.startsWith('### ')) {
          return (
            <h3 key={i} style={{
              fontFamily: "'Special Elite', monospace", fontSize: '0.65rem',
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: P.inkDim, margin: '0.8em 0 0.3em',
            }}>{block.slice(4)}</h3>
          )
        }
        const lines = block.split('\n')
        if (lines.every(l => l.startsWith('- ') || l === '')) {
          const items = lines.filter(l => l.startsWith('- '))
          return (
            <ul key={i} style={{ paddingLeft: '1em', margin: '0.3em 0' }}>
              {items.map((item, j) => (
                <li key={j} style={{
                  fontFamily: "'IM Fell English', Georgia, serif", fontSize: '0.78rem',
                  lineHeight: 1.6, color: P.ink, marginBottom: '0.15em', listStyleType: 'disc',
                }}>{parseInline(item.slice(2))}</li>
              ))}
            </ul>
          )
        }
        return (
          <p key={i} style={{
            fontFamily: "'IM Fell English', Georgia, serif", fontSize: '0.78rem',
            lineHeight: 1.7, color: P.ink, margin: '0 0 0.6em', textAlign: 'justify',
          }}>{parseInline(block)}</p>
        )
      })}
    </>
  )
}

export default function InlineCodexPanel() {
  const { inlineCodexOpen, activeEntryId, closeInlineCodex } = useCodexStore()
  const entry = useMemo(() => {
    if (!activeEntryId) return null
    return ALL_CODEX_ENTRIES.find(e => e.id === activeEntryId) ?? null
  }, [activeEntryId])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && inlineCodexOpen) {
        e.stopPropagation()
        closeInlineCodex()
      }
    }
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [inlineCodexOpen, closeInlineCodex])

  if (!inlineCodexOpen || !entry) return null

  return (
    <div style={{
      position: 'fixed', right: 0, top: 0, bottom: 0, zIndex: 110,
      width: '420px',
      background: P.bg,
      borderLeft: `1px solid ${P.borderStrong}`,
      boxShadow: '-6px 0 32px rgba(0,0,0,0.5)',
      display: 'flex', flexDirection: 'column',
      animation: 'inline-codex-slide-in 0.25s ease-out forwards',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.7rem 1.2rem', flexShrink: 0,
        background: P.sidebar, borderBottom: `1px solid ${P.borderStrong}`,
      }}>
        <div>
          <span style={{
            fontFamily: "'Special Elite', monospace", fontSize: '0.45rem',
            letterSpacing: '0.2em', textTransform: 'uppercase', color: P.inkMuted,
            display: 'block',
          }}>
            Codex — {CATEGORY_LABELS[entry.category]}
          </span>
          <span style={{
            fontFamily: "'IM Fell English', Georgia, serif", fontSize: '0.95rem',
            color: P.ink, letterSpacing: '0.02em',
          }}>
            {entry.title}
          </span>
        </div>
        <button
          onClick={closeInlineCodex}
          style={{
            background: 'none', border: `1px solid ${P.border}`,
            color: P.inkMuted, cursor: 'pointer',
            fontFamily: "'Special Elite', monospace", fontSize: '0.55rem',
            padding: '0.2rem 0.5rem', letterSpacing: '0.1em',
          }}
        >✕</button>
      </div>

      {/* Content */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '1.2rem 1.4rem',
        scrollbarWidth: 'thin', scrollbarColor: '#c8a060 transparent',
      }}>
        {entry.category === 'characters' && (
          <div style={{ float: 'right', marginLeft: '16px', marginBottom: '12px' }}>
            <CharacterPortrait
              characterId={entry.id.replace(/^character_/, '')}
              isActive={false}
              size={90}
              showName={false}
            />
          </div>
        )}
        {renderMarkdown(entry.content)}
      </div>

      {/* Footer */}
      <div style={{
        padding: '0.5rem 1.2rem', flexShrink: 0,
        background: P.sidebar, borderTop: `1px solid ${P.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{
          fontFamily: "'Special Elite', monospace", fontSize: '0.42rem',
          letterSpacing: '0.12em', textTransform: 'uppercase', color: P.inkMuted,
        }}>
          Press Escape to close
        </span>
        <button
          onClick={closeInlineCodex}
          style={{
            background: P.amber, border: 'none', color: '#f0e8d0',
            fontFamily: "'Special Elite', monospace", fontSize: '0.5rem',
            letterSpacing: '0.1em', padding: '0.3rem 0.8rem',
            cursor: 'pointer', textTransform: 'uppercase',
          }}
        >
          Close
        </button>
      </div>
    </div>
  )
}
