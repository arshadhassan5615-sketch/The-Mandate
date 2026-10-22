import { useEffect } from 'react'
import type { CSSProperties } from 'react'
import nations from '../../data/nations/foreignNations.json'
import { useGameStore } from '../../stores/gameStore'
import { useCodexStore } from '../../stores/codexStore'
import { useViewportMode } from '../../hooks/useViewportMode'
import { Z } from '../../constants/zIndex'
import { relationFor } from './nationRelations'
import type { RelationLabel } from './nationRelations'
import { getFlagArt } from '../../assets/flags'

const BRASS = '#b59a5e'
const CREAM = '#e6dcc3'
const RAIL_WIDTH = 60

const RELATION_COLOR: Record<RelationLabel, string> = {
  Allied: '#6b9b5f',
  Friendly: '#6b9b5f',
  Neutral: CREAM,
  Strained: '#c8902a',
  Hostile: '#b85450',
}

const LABEL_STYLE: CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.15em',
  color: BRASS,
}

interface NationDossierProps {
  nationId: string
  onClose: () => void
}

function PlaceholderFlag({ name, colors, width }: { name: string; colors: string[]; width: number }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width,
        aspectRatio: '3 / 2',
        background: `linear-gradient(to bottom, ${colors[0]} 50%, ${colors[1]} 50%)`,
        border: `1px solid ${BRASS}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Playfair Display', serif",
        fontWeight: 700,
        fontSize: Math.round(width / 3),
        color: CREAM,
        textShadow: '0 1px 4px rgba(0,0,0,0.7)',
        flexShrink: 0,
      }}
    >
      {name.replace(/^(The|Republic of)\s+/i, '').charAt(0)}
    </div>
  )
}

function NationFlag({ name, flag, colors, width }: { name: string; flag: string; colors: string[]; width: number }) {
  const flagArt = getFlagArt(flag)
  if (!flagArt) return <PlaceholderFlag name={name} colors={colors} width={width} />
  return (
    <img
      src={flagArt}
      alt={`Flag of ${name}`}
      data-testid="nation-flag"
      style={{
        width,
        aspectRatio: '16 / 9',
        objectFit: 'cover',
        display: 'block',
        border: '1px solid #c9a84c',
        boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
        flexShrink: 0,
      }}
    />
  )
}

export default function NationDossier({ nationId, onClose }: NationDossierProps) {
  const nation = nations.find(n => n.id === nationId)
  const tyvarenHostility = useGameStore(s => s.tyvarenHostility)
  const sovarkaRelation = useGameStore(s => s.sovarka_relation)
  const openCodex = useCodexStore(s => s.openCodex)
  const isCompact = useViewportMode() === 'compact'

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!nation) return null

  const relation = relationFor(nation.id, { tyvarenHostility, sovarka_relation: sovarkaRelation })
  const rows: Array<[string, string, string?]> = [
    ['Relations', relation, RELATION_COLOR[relation]],
    ['Stance', nation.stance],
    ['Military', nation.military],
    ['Population', nation.population],
    ['Leader', nation.leader],
    ['Government', nation.government],
    ['Capital', nation.capital],
    ['Official language', nation.language],
  ]
  const hasCodex = nation.codexEntryId !== null
  const titleId = `nation-dossier-title-${nation.id}`

  const handleOpenCodex = () => {
    if (!nation.codexEntryId) return
    openCodex('nations', nation.codexEntryId)
    onClose()
  }

  const codexButton = (
    <button
      type="button"
      onClick={handleOpenCodex}
      disabled={!hasCodex}
      title={hasCodex ? undefined : 'No brief on file yet'}
      style={{
        ...LABEL_STYLE,
        minHeight: 40,
        padding: '0 12px',
        background: 'transparent',
        border: `1px solid ${BRASS}`,
        cursor: hasCodex ? 'pointer' : 'not-allowed',
        opacity: hasCodex ? 1 : 0.4,
      }}
    >
      Open Codex Entry
    </button>
  )

  const table = (
    <div>
      {rows.map(([label, value, color]) => (
        <div
          key={label}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 12,
            padding: isCompact ? '2px 0' : '5px 0',
            borderBottom: '1px solid rgba(181,154,94,0.2)',
          }}
        >
          <span style={LABEL_STYLE}>{label}</span>
          <span style={{ fontFamily: "'Crimson Text', serif", fontSize: 15, color: color ?? CREAM, textAlign: 'right' }}>
            {value}
          </span>
        </div>
      ))}
    </div>
  )

  const summary = (
    <p style={{
      fontFamily: "'Crimson Text', serif", fontStyle: 'italic', fontSize: isCompact ? 13 : 14,
      color: 'rgba(230,220,195,0.8)', margin: isCompact ? '6px 0 0' : '10px 0 0', lineHeight: 1.3,
    }}>
      {nation.summary}
    </p>
  )

  return (
    <div
      data-testid="nation-dossier-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: Z.modal,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        paddingRight: isCompact ? RAIL_WIDTH : 0,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-layout={isCompact ? 'compact' : 'desktop'}
        onClick={e => e.stopPropagation()}
        style={{
          width: isCompact ? `min(620px, calc(100vw - ${RAIL_WIDTH + 32}px))` : 'min(460px, calc(100vw - 32px))',
          maxHeight: 'calc(100dvh - 24px)',
          overflowY: 'auto',
          background: '#0d0b08',
          border: `1px solid ${BRASS}`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
        }}
      >
        <div style={{ background: '#1a1410', padding: isCompact ? '4px 52px 4px 16px' : '10px 52px 10px 16px', position: 'relative' }}>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            style={{
              position: 'absolute', top: 0, right: 0, width: 40, height: 40,
              background: 'transparent', border: 'none', color: CREAM, fontSize: 22, cursor: 'pointer',
            }}
          >
            ×
          </button>
          <h2 id={titleId} style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 600, color: CREAM }}>
            {nation.name}
          </h2>
          {!isCompact && (
            <div style={{ ...LABEL_STYLE, letterSpacing: '0.2em', marginTop: 2 }}>{nation.epithet}</div>
          )}
        </div>
        {isCompact ? (
          <div style={{ display: 'flex', gap: 16, padding: 10, alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch', width: 150 }}>
              <NationFlag name={nation.name} flag={nation.flag} colors={nation.colors} width={120} />
              <div style={{ ...LABEL_STYLE, letterSpacing: '0.2em' }}>{nation.epithet}</div>
              {codexButton}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>{table}{summary}</div>
          </div>
        ) : (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <NationFlag name={nation.name} flag={nation.flag} colors={nation.colors} width={150} />
              {codexButton}
            </div>
            <div>{table}{summary}</div>
          </div>
        )}
      </div>
    </div>
  )
}
