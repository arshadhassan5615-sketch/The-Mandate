import { useRef, useEffect, useState, useCallback } from 'react'
import type { NarrativeSegment, SceneChoice, ChoiceReaction } from '../../types/narrative'
import CharacterPortrait from '../portraits/CharacterPortrait'
import { getCharacterColor } from '../portraits/CharacterPortraits'
import { renderWithEntities } from '../news/EntityLinker'

const CHAR_NAMES: Record<string, string> = {
  vyktor_reznik: 'Vyktor Reznik', danika_oberlin: 'Danika Oberlin',
  katerin_ashavel: 'Chancellor Ashavel', elara_vostane: 'Elara Vostane',
  gregor_maric: 'Gregor Marić', irina_dusek: 'Col. Irina Dusek',
  aldric_theron: 'Prof. Aldric Theron', stanislov_renek: 'Archbishop Renek',
  jonas_ashavel: 'Jonas Ashavel', liora_ashavel: 'Liora Ashavel',
  tomas_ashavel: 'Tomas Ashavel', drazen_kolvar: 'Dražen Kolvar',
  nikolai_perov: 'General Perov',
  soraya_khaled: 'Soraya Khaled', lucan_vael: 'Lucan Vael',
  oskar_brenner: 'Gen. Brenner', nadia_voss: 'Nadia Voss',
  harrison_cole: 'Amb. Harrison Cole', yevgeni_stahl: 'Commissar Stahl',
  dragan_vukov: 'Marshal Vukov', elodie_marchand: 'Premier Marchand',
  radovan_skala: 'Warlord Skala', maren_tovik: 'Maren Tovik',
  viktor_dorne: 'Viktor Dorne', elena_braskov: 'Elena Braskov',
  serida_valk: 'Serida Valk',
  roman_kesic: 'Roman Kešić',
  petra_solec: 'Petra Solec',
  vera_sorin: 'Vera Sorin',
  henryk_borac: 'Henryk Borač',
  marta_solen: 'Dr. Marta Solén',
  petr_horak: 'Petr Horák',
  lena_kaspar: 'Dr. Lena Kaspar',
  august_meln: 'Dr. August Meln',
  benedikt_varro: 'Benedikt Varro',
  sofia_drenek: 'Sofia Drenek',
  orin_valdek: 'Orin Valdek',
  daria_voss: 'Daria Voss',
}

function charName(id: string): string {
  return CHAR_NAMES[id] ?? id.replace(/_/g, ' ')
}

interface ConversationHistoryEntry {
  id: string
  type: 'dialogue' | 'narrative' | 'player_spoken'
  characterId?: string
  characterName?: string
  characterColor?: string
  text: string
}

interface ConversationPanelProps {
  sceneTitle: string
  sceneLocation: string
  sceneType: string
  currentWeek: number
  sceneCharacters: string[]
  history: ConversationHistoryEntry[]
  activeSegment: NarrativeSegment | null
  activeText: string
  showCursor: boolean
  choices: SceneChoice[]
  showChoices: boolean
  sceneDone: boolean
  allDone: boolean
  segmentDone: boolean
  onAdvance: () => void
  onChoice: (id: string) => void
  onAdvanceQueue: () => void
  continueLabel: string
  speakingCharacter: string | undefined
  monologueText?: string
}

export default function ConversationPanel({
  sceneTitle, sceneLocation, sceneType, currentWeek, sceneCharacters: _sceneCharacters,
  history, activeSegment, activeText, showCursor,
  choices, showChoices, sceneDone, allDone, segmentDone,
  onAdvance: _onAdvance, onChoice, onAdvanceQueue, continueLabel,
  speakingCharacter, monologueText,
}: ConversationPanelProps) {
  const dialogueEndRef = useRef<HTMLDivElement>(null)
  const choicesRef = useRef<HTMLDivElement>(null)
  const choiceProcessedRef = useRef<Set<string>>(new Set())
  const [choicesOverflow, setChoicesOverflow] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [fadingId, setFadingId] = useState<string | null>(null)
  const [activeReactions, setActiveReactions] = useState<ChoiceReaction[] | null>(null)
  const [reactionsFading, setReactionsFading] = useState(false)
  const [monologueDone, setMonologueDone] = useState(false)
  const [monologueFading, setMonologueFading] = useState(false)
  const [monologueVisible, setMonologueVisible] = useState(false)

  // When choices area is about to show, check for monologue
  const shouldShowChoices = showChoices && !sceneDone
  const shouldShowMonologue = shouldShowChoices && !!monologueText && !monologueDone
  const actualShowChoices = shouldShowChoices && (!monologueText || monologueDone)

  // Fade in monologue after a brief pause
  useEffect(() => {
    if (shouldShowMonologue && !monologueVisible) {
      const t = setTimeout(() => setMonologueVisible(true), 500)
      return () => clearTimeout(t)
    }
    if (!shouldShowMonologue && monologueVisible) {
      setMonologueVisible(false)
    }
  }, [shouldShowMonologue, monologueVisible])

  // Auto-advance monologue after 4 seconds
  useEffect(() => {
    if (shouldShowMonologue && monologueVisible) {
      const t = setTimeout(() => dismissMonologue(), 4000)
      return () => clearTimeout(t)
    }
  }, [shouldShowMonologue, monologueVisible])

  // Reset monologue state when new scene comes
  useEffect(() => {
    setMonologueDone(false)
    setMonologueFading(false)
    setMonologueVisible(false)
  }, [monologueText])

  const dismissMonologue = useCallback(() => {
    if (monologueFading) return
    setMonologueFading(true)
    setTimeout(() => {
      setMonologueDone(true)
      setMonologueFading(false)
      setMonologueVisible(false)
    }, 500)
  }, [monologueFading])

  // Space/Enter dismisses monologue
  useEffect(() => {
    if (!shouldShowMonologue) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        e.stopPropagation()
        dismissMonologue()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [shouldShowMonologue, dismissMonologue])

  const handleChoice = useCallback((id: string) => {
    if (selectedId || fadingId) return // prevent double-click
    if (choiceProcessedRef.current.has(id)) return // prevent StrictMode / effect double-fire
    choiceProcessedRef.current.add(id)
    setSelectedId(id)
    // Find the choice to get its reactions
    const choice = choices.find(c => c.id === id)
    // Pulse animation plays (200ms), then fade + reactions
    setTimeout(() => {
      setSelectedId(null)
      setFadingId(id)
      // Show reactions if present
      if (choice?.reactions?.length) {
        setActiveReactions(choice.reactions)
        // After reaction display time (2.5s), fade and trigger
        setTimeout(() => {
          setReactionsFading(true)
          setTimeout(() => {
            setActiveReactions(null)
            setReactionsFading(false)
            onChoice(id)
          }, 500)
        }, 2500)
      } else {
        // No reactions, just trigger after fade-out
        setTimeout(() => {
          onChoice(id)
        }, 800)
      }
    }, 200)
  }, [onChoice, selectedId, fadingId, choices])

  // Reset selection state when new choices appear
  useEffect(() => {
    setSelectedId(null)
    setFadingId(null)
    setActiveReactions(null)
    setReactionsFading(false)
    choiceProcessedRef.current.clear()
  }, [choices])

  useEffect(() => {
    if (dialogueEndRef.current) {
      dialogueEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [history, activeText])

  // Detect if choices overflow their container
  useEffect(() => {
    const el = choicesRef.current
    if (!el) return
    const check = () => setChoicesOverflow(el.scrollHeight > el.clientHeight + 4)
    check()
    const observer = new ResizeObserver(check)
    observer.observe(el)
    return () => observer.disconnect()
  }, [choices, actualShowChoices])

  // Build portrait stack from characters who have actually spoken,
  // NOT from the full scene characters list (which may include non-speaking NPCs).
  const spokenChars = new Set<string>()
  history.forEach(entry => {
    if (entry.characterId && entry.characterId !== 'katerin_ashavel') {
      spokenChars.add(entry.characterId)
    }
  })
  const speakerOrder = [...spokenChars]

  if (speakingCharacter && speakingCharacter !== 'katerin_ashavel' && !speakerOrder.includes(speakingCharacter)) {
    speakerOrder.push(speakingCharacter)
  } else if (speakingCharacter && speakingCharacter !== 'katerin_ashavel') {
    const idx = speakerOrder.indexOf(speakingCharacter)
    if (idx >= 0) { speakerOrder.splice(idx, 1); speakerOrder.push(speakingCharacter) }
  } else if (activeSegment?.primaryCharacter && activeSegment.primaryCharacter !== 'katerin_ashavel' && !speakerOrder.includes(activeSegment.primaryCharacter)) {
    speakerOrder.push(activeSegment.primaryCharacter)
  } else if (activeSegment?.primaryCharacter && activeSegment.primaryCharacter !== 'katerin_ashavel') {
    const idx = speakerOrder.indexOf(activeSegment.primaryCharacter)
    if (idx >= 0) { speakerOrder.splice(idx, 1); speakerOrder.push(activeSegment.primaryCharacter) }
  }

  const isEmergency = sceneType === 'emergency'

  return (
    <>
      {isEmergency && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(180,30,20,0.06) 100%)',
          pointerEvents: 'none', zIndex: 90,
        }} />
      )}

      {/* ── Portrait: bottom-left, large, overlapping dialogue bar ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0,
        zIndex: 101, pointerEvents: 'none',
        paddingBottom: '20px', paddingLeft: '20px',
      }}>
        {speakerOrder.map((charId, i) => {
          const isLatest = i === speakerOrder.length - 1
          if (!isLatest) return null
          return (
            <div key={charId} style={{
              transition: 'all 0.3s ease',
              filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.7))',
            }}>
              <CharacterPortrait
                characterId={charId}
                isActive={true}
                size={180}
                showName={true}
              />
            </div>
          )
        })}
      </div>

      {/* ── Dialogue bar: bottom of screen, full width ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        zIndex: 100, pointerEvents: 'all',
        background: 'linear-gradient(to top, rgba(8,6,4,0.97) 0%, rgba(10,9,8,0.95) 80%, rgba(10,9,8,0.85) 100%)',
        borderTop: '1px solid rgba(196,148,58,0.2)',
        paddingLeft: '220px', paddingRight: '60px',
        paddingBottom: '20px',
        minHeight: '120px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}>
        {/* Active segment typing */}
        {activeSegment && (
          <div style={{ marginBottom: 8 }}>
            {activeSegment.type === 'dialogue' ? (
              <>
                <span style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.62rem', letterSpacing: '0.1em',
                  textTransform: 'uppercase', fontWeight: 700,
                  color: getCharacterColor(activeSegment.character ?? ''),
                }}>
                  {charName(activeSegment.character ?? '')} :
                </span>
                <p style={{
                  fontFamily: "'Crimson Text', serif",
                  fontSize: '1.05rem', lineHeight: 1.6,
                  color: '#e8dcc8', margin: '6px 0 0', paddingLeft: 2,
                }}>
                  &ldquo;{renderWithEntities(activeText, true)}{showCursor && <span className="typewriter-cursor" />}&rdquo;
                </p>
              </>
            ) : (
              <p style={{
                fontFamily: "'Crimson Text', serif",
                fontSize: '1.05rem', fontStyle: 'italic',
                color: '#8a7d6a', margin: '4px 0', lineHeight: 1.6,
              }}>
                {renderWithEntities(activeText, true)}{showCursor && <span className="typewriter-cursor" />}
              </p>
            )}
          </div>
        )}

        {/* Click to continue hint */}
        {!allDone && !sceneDone && !showChoices && activeSegment && (
          <div style={{
            textAlign: 'right', padding: '4px 0', opacity: segmentDone ? 0.6 : 0.3,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.52rem', color: 'var(--accent-gold)',
            letterSpacing: '0.08em',
            animation: segmentDone ? 'pulse 1.5s ease-in-out infinite' : undefined,
          }}>
            {segmentDone ? '▼ Click to continue' : 'skip ▸'}
          </div>
        )}

        {/* Monologue */}
        {shouldShowMonologue && (
          <div style={{
            padding: '10px 0',
            borderTop: '1px solid rgba(196,148,58,0.08)',
            opacity: monologueVisible && !monologueFading ? 1 : 0,
            transition: 'opacity 0.5s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.7rem', color: 'var(--amber-dim)', flexShrink: 0,
                opacity: 0.5, marginTop: '2px',
              }}>
                ✎
              </span>
              <div style={{ flex: 1 }}>
                <p style={{
                  fontFamily: "'Crimson Text', serif",
                  fontSize: '0.9rem', fontStyle: 'italic',
                  color: '#8a7d6a', lineHeight: 1.6, margin: 0,
                }}>
                  {monologueText}
                </p>
                <p style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.48rem', letterSpacing: '0.08em',
                  color: 'var(--muted)', margin: '8px 0 0',
                  opacity: 0.5, textAlign: 'right',
                }}>
                  Press Space to continue
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Choices */}
        {actualShowChoices && (
          <div
            ref={choicesRef}
            className="conversation-choices"
            style={{
              maxHeight: '35vh', overflowY: 'auto', overflowX: 'hidden',
              padding: '8px 0',
              borderTop: '1px solid rgba(196,148,58,0.12)',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {choices.map((ch, i) => {
              const isSelected = selectedId === ch.id
              const isFading = fadingId === ch.id
              return (
                <div
                  key={ch.id}
                  className={`choice-frame choice-card${isSelected ? ' selected-frame' : ''}${isFading ? ' fading' : ''}`}
                  style={{ maxHeight: '180px', overflow: 'hidden' }}
                >
                  <span className="choice-key-hint">{i + 1}</span>
                  <button
                    className="choice-btn choice-frame-inner"
                    onClick={() => handleChoice(ch.id)}
                    disabled={selectedId !== null || fadingId !== null}
                  >
                    {renderWithEntities(ch.text, true)}
                  </button>
                </div>
              )
            })}
            {choicesOverflow && (
              <div style={{
                textAlign: 'center',
                color: 'rgba(201,168,76,0.5)',
                fontSize: '11px',
                letterSpacing: '2px',
                padding: '8px',
                fontFamily: "'Special Elite', monospace",
              }}>
                ▼ SCROLL FOR MORE OPTIONS
              </div>
            )}
          </div>
        )}

        {/* Micro-reactions */}
        {activeReactions && !sceneDone && (
          <div style={{
            padding: '8px 0',
            borderTop: '1px solid rgba(196,148,58,0.08)',
            opacity: reactionsFading ? 0 : 1,
            transition: 'opacity 0.5s ease',
          }}>
            {activeReactions.map((reaction, i) => (
              <div key={i} style={{ marginBottom: i < activeReactions.length - 1 ? 8 : 0 }}>
                {reaction.type === 'dialogue' && (
                  <>
                    <span style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: '0.55rem', letterSpacing: '0.08em',
                      textTransform: 'uppercase', fontWeight: 600,
                      color: getCharacterColor(reaction.character),
                    }}>
                      {charName(reaction.character)}
                    </span>
                    <p style={{
                      fontFamily: "'Crimson Text', serif",
                      fontSize: '0.85rem', lineHeight: 1.5,
                      color: '#c8bfa0', margin: '2px 0 0', paddingLeft: 2,
                    }}>
                      &ldquo;{renderWithEntities(reaction.text, true)}&rdquo;
                    </p>
                  </>
                )}
                {reaction.type === 'action' && (
                  <p style={{
                    fontFamily: "'Crimson Text', serif",
                    fontSize: '0.82rem', fontStyle: 'italic',
                    color: '#8a7d6a', margin: 0, lineHeight: 1.5,
                  }}>
                    {reaction.text}
                  </p>
                )}
                {reaction.type === 'silence' && (
                  <>
                    <span style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: '0.55rem', letterSpacing: '0.08em',
                      textTransform: 'uppercase', fontWeight: 600,
                      color: getCharacterColor(reaction.character),
                    }}>
                      {charName(reaction.character)}&nbsp;
                      <span style={{ opacity: 0.5, fontStyle: 'italic', fontWeight: 400 }}>
                        [silence]
                      </span>
                    </span>
                    <p style={{
                      fontFamily: "'Crimson Text', serif",
                      fontSize: '0.8rem', fontStyle: 'italic',
                      color: '#8a7d6a', margin: '2px 0 0', paddingLeft: 2, lineHeight: 1.5,
                    }}>
                      {reaction.text}
                    </p>
                  </>
                )}
                {reaction.type === 'narrative' && (
                  <p style={{
                    fontFamily: "'Crimson Text', serif",
                    fontSize: '0.82rem', fontStyle: 'italic',
                    color: '#8a7d6a', margin: 0, lineHeight: 1.5,
                  }}>
                    {reaction.text}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Scene completed — advance button */}
        {sceneDone && (
          <div style={{ padding: '8px 0' }}>
            <button
              onClick={onAdvanceQueue}
              style={{
                width: '100%', padding: '12px',
                background: 'rgba(196,148,58,0.08)',
                border: '1px solid rgba(196,148,58,0.4)',
                color: 'var(--amber)',
                fontFamily: "'Special Elite', monospace",
                fontSize: '0.65rem', letterSpacing: '0.12em',
                cursor: 'pointer', textTransform: 'uppercase',
              }}
            >
              {continueLabel}
            </button>
          </div>
        )}
      </div>

      {/* ── History: scrollable area above dialogue bar ── */}
      <div style={{
        position: 'fixed', top: 40, left: 0, right: 60, bottom: 0,
        zIndex: 99, pointerEvents: 'none',
        overflowY: 'auto', overflowX: 'hidden',
        padding: '20px 80px 160px 80px',
        scrollbarWidth: 'thin', scrollbarColor: 'rgba(196,148,58,0.2) transparent',
      }}>
        {/* Scene header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '16px',
          paddingBottom: '8px', borderBottom: '1px solid rgba(196,148,58,0.12)',
        }}>
          <span style={{
            fontFamily: "'Special Elite', monospace",
            fontSize: '0.5rem', letterSpacing: '0.12em',
            color: 'var(--muted)', textTransform: 'uppercase',
          }}>
            {sceneTitle} · Week {currentWeek}
          </span>
          <span style={{
            fontFamily: "'Special Elite', monospace",
            fontSize: '0.42rem', color: 'rgba(200,144,42,0.3)',
            letterSpacing: '0.08em',
          }}>
            {sceneLocation}
          </span>
        </div>

        {/* History entries */}
        {history.map(entry => (
          <div key={entry.id} style={{ marginBottom: 12 }}>
            {entry.type === 'narrative' ? (
              <p style={{
                fontFamily: "'Crimson Text', serif",
                fontSize: '0.88rem', fontStyle: 'italic',
                color: '#8a7d6a', margin: '4px 0', lineHeight: 1.6,
              }}>
                {renderWithEntities(entry.text, true)}
              </p>
            ) : (
              <>
                <span style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '0.58rem', letterSpacing: '0.08em',
                  textTransform: 'uppercase', fontWeight: 600,
                  color: entry.type === 'player_spoken'
                    ? '#e8dcc8' : (entry.characterColor ?? '#c8902a'),
                }}>
                  {entry.type === 'player_spoken' ? 'YOU' : entry.characterName} :
                </span>
                <p style={{
                  fontFamily: "'Crimson Text', serif",
                  fontSize: '0.88rem', lineHeight: 1.6,
                  color: '#d4c8b0', margin: '2px 0 0', paddingLeft: 2,
                }}>
                  &ldquo;{renderWithEntities(entry.text, true)}&rdquo;
                </p>
              </>
            )}
          </div>
        ))}
        <div ref={dialogueEndRef} />
      </div>
    </>
  )
}
