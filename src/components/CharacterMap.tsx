import { useState } from 'react'
import { useGameStore } from '../stores/gameStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import {
  CHARACTERS,
  getRelationshipLabel,
  CATEGORY_LABELS,
  type CharacterCategory,
  type CharacterMapEntry,
} from '../data/characters/roster'
import CharacterPortrait from './portraits/CharacterPortrait'

const P = {
  bg: '#f0e8d0',
  sidebar: '#e4d4a8',
  ink: '#2a1a0a',
  inkMuted: '#5c4430',
  amber: '#8a621c',
  border: 'rgba(138, 98, 28, 0.3)',
  green: '#4a6b3a',
  red: '#8b2e2e',
}

function relationshipColor(score: number): string {
  if (score >= 65) return P.green
  if (score >= 35) return P.amber
  return P.red
}

function getScore(entry: CharacterMapEntry): number {
  const state = useGameStore.getState()
  if (entry.personalKey) {
    const val = state.personal[entry.personalKey]
    return typeof val === 'number' ? val : 50
  }
  if (entry.factionKey) {
    return state.factions[entry.factionKey] ?? 50
  }
  return 50
}

export default function CharacterMap() {
  const { characterMapOpen, setCharacterMapOpen } = useSettingsStore()
  const metCharacters = useNarrativeStore(s => s.metCharacters)
  const [category, setCategory] = useState<CharacterCategory>('cabinet')

  const metCount = CHARACTERS.filter(c => metCharacters.includes(c.id)).length
  const totalCount = CHARACTERS.length

  const filtered = CHARACTERS
    .filter(c => c.category === category)
    .sort((a, b) => {
      const aMet = metCharacters.includes(a.id) ? 1 : 0
      const bMet = metCharacters.includes(b.id) ? 1 : 0
      return bMet - aMet
    })

  if (!characterMapOpen) return null

  return (
    <div
      className="anim-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10040,
        background: 'rgba(0,0,0,0.78)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) setCharacterMapOpen(false) }}
    >
      <div
        className="anim-pop-in"
        style={{
          width: '780px',
          maxWidth: '94vw',
          maxHeight: '88vh',
          background: P.bg,
          border: `1px solid ${P.border}`,
          borderRadius: '2px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.9rem 1.2rem',
            borderBottom: `1px solid ${P.border}`,
            background: P.sidebar,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.8rem' }}>
            <span
              style={{
                fontFamily: "'Special Elite', monospace",
                fontSize: '0.72rem',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: P.amber,
              }}
            >
              Character Dossier
            </span>
            <span style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: '0.55rem',
              color: P.inkMuted,
              letterSpacing: '0.06em',
            }}>
              {metCount} of {totalCount} encountered
            </span>
          </div>
          <button
            onClick={() => setCharacterMapOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: P.inkMuted,
              fontFamily: "'Special Elite', monospace",
              fontSize: '0.8rem',
              padding: 0,
            }}
          >
            ✕ CLOSE
          </button>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Sidebar */}
          <div
            style={{
              width: '130px',
              flexShrink: 0,
              borderRight: `1px solid ${P.border}`,
              background: P.sidebar,
              padding: '0.6rem 0',
              overflowY: 'auto',
            }}
          >
            {(Object.keys(CATEGORY_LABELS) as CharacterCategory[]).map(cat => {
              const count = CHARACTERS.filter(c => c.category === cat).length
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.55rem 1rem',
                    background: cat === category ? 'rgba(138,98,28,0.15)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: "'Special Elite', monospace",
                    fontSize: '0.6rem',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: cat === category ? P.amber : P.inkMuted,
                    transition: 'background 0.15s',
                  }}
                >
                  {CATEGORY_LABELS[cat]}
                  {count > 0 && (
                    <span style={{ marginLeft: '0.5em', opacity: 0.5, fontSize: '0.55rem' }}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Main area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.2rem' }}>
            {filtered.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  minHeight: '200px',
                }}
              >
                <p
                  style={{
                    fontFamily: "'IM Fell English', Georgia, serif",
                    fontStyle: 'italic',
                    color: P.inkMuted,
                    opacity: 0.6,
                    fontSize: '0.95rem',
                  }}
                >
                  No contacts in this category.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '0.8rem',
                }}
              >
                {filtered.map(entry => {
                  const score = getScore(entry)
                  const color = relationshipColor(score)
                  const label = getRelationshipLabel(score)
                  const isMet = metCharacters.includes(entry.id)
                  const portraitId = entry.id.replace(/^character_/, '')
                  return (
                    <div
                      key={entry.id}
                      style={{
                        background: 'rgba(255,255,255,0.35)',
                        border: `1px solid ${P.border}`,
                        borderLeft: `4px solid ${isMet ? color : P.border}`,
                        borderRadius: '2px',
                        padding: '0.8rem 1rem',
                        opacity: isMet ? 1 : 0.6,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '14px',
                        transition: 'border-left-color 0.2s',
                      }}
                      onMouseEnter={e => {
                        if (isMet) (e.currentTarget as HTMLDivElement).style.borderLeftColor = P.amber
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLDivElement).style.borderLeftColor = isMet ? color : P.border
                      }}
                    >
                      {/* Portrait */}
                      {isMet ? (
                        <div
                          style={{ flexShrink: 0, transition: 'transform 0.2s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.1)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)' }}
                        >
                          <CharacterPortrait characterId={portraitId} isActive={false} showName={false} size={60} />
                        </div>
                      ) : (
                        <div style={{
                          width: 60, height: 60, borderRadius: '50%',
                          background: 'rgba(0,0,0,0.08)',
                          border: `2px solid ${P.border}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <span style={{ fontSize: 20, color: P.inkMuted, opacity: 0.5 }}>?</span>
                        </div>
                      )}

                      {/* Text content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontFamily: "'IM Fell English', Georgia, serif",
                          fontSize: '1rem', color: P.ink, margin: 0, lineHeight: 1.2,
                        }}>
                          {isMet ? entry.name : 'UNKNOWN — CLASSIFIED'}
                        </p>
                        <p style={{
                          fontFamily: "'Special Elite', monospace",
                          fontSize: '0.55rem', letterSpacing: '0.1em',
                          textTransform: 'uppercase', color: P.inkMuted,
                          margin: '0.25rem 0 0.5rem',
                        }}>
                          {entry.title}
                        </p>
                        {isMet && (
                          <p style={{
                            fontFamily: "'IM Fell English', Georgia, serif",
                            fontSize: '0.75rem', color: P.inkMuted,
                            margin: '0 0 0.5rem', lineHeight: 1.4, fontStyle: 'italic',
                          }}>
                            {entry.description}
                          </p>
                        )}
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span style={{
                            fontFamily: "'Special Elite', monospace",
                            fontSize: '0.52rem', letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: CATEGORY_LABELS[entry.category] === 'Cabinet' ? P.amber : color,
                            background: 'rgba(0,0,0,0.06)',
                            padding: '0.15rem 0.4rem', borderRadius: '1px',
                          }}>
                            {CATEGORY_LABELS[entry.category]}
                          </span>
                          {isMet ? (
                            <span style={{
                              fontFamily: "'Special Elite', monospace",
                              fontSize: '0.55rem', color, letterSpacing: '0.04em',
                            }}>
                              {label}
                            </span>
                          ) : (
                            <span style={{
                              fontFamily: "'IM Fell English', Georgia, serif",
                              fontSize: '0.65rem', color: P.inkMuted,
                              fontStyle: 'italic', letterSpacing: '0.03em',
                            }}>
                              Not yet encountered
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
