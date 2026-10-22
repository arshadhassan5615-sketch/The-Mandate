import { useEffect, useState } from 'react'
import { Z } from '../constants/zIndex'
import { ALL_CODEX_ENTRIES, useCodexStore } from '../stores/codexStore'
import { getReachedEndings } from '../engine/collections'
import { useViewportMode } from '../hooks/useViewportMode'
import epilogueData from '../data/epilogues.json'
import type { EpilogueVariant } from '../types/ending'

const BRASS = '#b59a5e'
const CREAM = '#e6dcc3'
const MONO = "'IBM Plex Mono', monospace"
const SERIF_TITLE = "'Playfair Display', 'IM Fell English', Georgia, serif"

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  zIndex: Z.modal,
  background: 'rgba(8,7,5,0.96)',
} as const

const backButtonStyle = {
  position: 'fixed',
  top: 12,
  right: 'calc(12px + env(safe-area-inset-right, 0px))',
  zIndex: 1,
  minHeight: 40,
  padding: '0 16px',
  background: 'transparent',
  border: `1px solid ${BRASS}`,
  color: BRASS,
  fontFamily: MONO,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.2em',
  cursor: 'pointer',
} as const

function useEscapeToClose(onClose: () => void): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])
}

const variants: EpilogueVariant[] = epilogueData as EpilogueVariant[]

type Tab = 'endings' | 'briefs'

function EndingsTab() {
  const [reached] = useState(() => new Set(getReachedEndings()))
  const reachedCount = variants.filter(v => reached.has(v.id)).length

  return (
    <>
      <p style={{ fontFamily: MONO, fontSize: 11, color: BRASS, letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 12px' }}>
        {reachedCount} of {variants.length} endings reached
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {variants.map(v =>
          reached.has(v.id) ? (
            <div key={v.id} style={{ border: `1px solid ${BRASS}`, padding: 12, background: '#0d0b08' }}>
              <h3 style={{ fontFamily: SERIF_TITLE, fontSize: 16, color: CREAM, fontWeight: 600, margin: '0 0 4px' }}>
                {v.title}
              </h3>
              <p style={{ fontFamily: "'Crimson Text', Georgia, serif", fontStyle: 'italic', fontSize: 13, color: CREAM, opacity: 0.7, margin: '0 0 8px' }}>
                {v.subtitle}
              </p>
              <span style={{ fontFamily: MONO, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', color: BRASS }}>
                {v.governanceOutcome}
              </span>
            </div>
          ) : (
            <div
              key={v.id}
              aria-label="Sealed ending"
              style={{ border: '1px solid rgba(181,154,94,0.2)', padding: 12, background: '#0d0b08' }}
            >
              <h3 style={{ fontFamily: SERIF_TITLE, fontSize: 16, color: CREAM, opacity: 0.5, fontWeight: 600, margin: 0 }}>
                <span aria-hidden="true">🔒 </span>Sealed
              </h3>
            </div>
          ),
        )}
      </div>
    </>
  )
}

function BriefsTab() {
  const seen = useCodexStore(s => s.seenEntryIds)
  const seenSet = new Set(seen)
  const seenCount = ALL_CODEX_ENTRIES.filter(e => seenSet.has(e.id)).length
  const categories = Array.from(new Set(ALL_CODEX_ENTRIES.map(e => e.category)))

  return (
    <>
      <p style={{ fontFamily: MONO, fontSize: 11, color: BRASS, letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 12px' }}>
        {seenCount} of {ALL_CODEX_ENTRIES.length} briefs read
      </p>
      {categories.map(category => (
        <section key={category} style={{ marginBottom: 16 }}>
          <h3 style={{ fontFamily: MONO, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.25em', color: BRASS, fontWeight: 400, margin: '0 0 6px' }}>
            {category}
          </h3>
          {ALL_CODEX_ENTRIES.filter(e => e.category === category).map(e => (
            <div
              key={e.id}
              style={{
                fontFamily: "'Crimson Text', Georgia, serif",
                fontSize: 16,
                padding: '4px 0',
                borderBottom: '1px solid rgba(181,154,94,0.12)',
                color: seenSet.has(e.id) ? CREAM : 'var(--muted)',
              }}
            >
              {seenSet.has(e.id) ? e.title : '— classified —'}
            </div>
          ))}
        </section>
      ))}
    </>
  )
}

export default function CollectionsScreen({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('endings')
  const mode = useViewportMode()
  const isCompact = mode === 'compact'
  useEscapeToClose(onClose)

  const tabButton = (id: Tab, label: string) => (
    <button
      key={id}
      type="button"
      role="tab"
      id={`collections-tab-${id}`}
      aria-selected={tab === id}
      aria-controls="collections-panel"
      onClick={() => setTab(id)}
      style={{
        background: 'transparent',
        border: 'none',
        borderBottom: `2px solid ${tab === id ? BRASS : 'transparent'}`,
        color: tab === id ? CREAM : BRASS,
        fontFamily: MONO,
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: '0.2em',
        minHeight: 36,
        padding: '0 12px',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )

  return (
    <div
      role="dialog"
      aria-label="Collections"
      aria-modal="true"
      style={{ ...overlayStyle, display: 'flex', flexDirection: 'column' }}
    >
      <button type="button" onClick={onClose} style={backButtonStyle}>
        Back
      </button>
      <header
        style={{
          flexShrink: 0,
          display: 'flex',
          flexDirection: isCompact ? 'row' : 'column',
          alignItems: isCompact ? 'center' : 'flex-start',
          justifyContent: isCompact ? 'space-between' : 'flex-start',
          gap: isCompact ? 16 : 8,
          padding: isCompact ? '10px 120px 0 24px' : 'clamp(16px, 5vh, 48px) 24px 0',
        }}
      >
        <h2 style={{ fontFamily: SERIF_TITLE, color: CREAM, fontSize: 'clamp(1.3rem, 4.5vh, 2rem)', margin: 0 }}>
          Collections
        </h2>
        <div role="tablist" aria-label="Collections" style={{ display: 'flex', gap: 8 }}>
          {tabButton('endings', 'Endings')}
          {tabButton('briefs', 'Briefs')}
        </div>
      </header>
      <div
        role="tabpanel"
        id="collections-panel"
        aria-labelledby={`collections-tab-${tab}`}
        style={{ flex: 1, overflowY: 'auto', padding: '12px 24px 24px' }}
      >
        {tab === 'endings' ? <EndingsTab /> : <BriefsTab />}
      </div>
    </div>
  )
}
