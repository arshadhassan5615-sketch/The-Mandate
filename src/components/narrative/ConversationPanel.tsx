import { useRef, useEffect, useState, useCallback } from 'react'
import type { NarrativeSegment, SceneChoice, ChoiceReaction } from '../../types/narrative'
import { getCharacterColor } from '../portraits/CharacterPortraits'
import { renderWithEntities } from '../news/EntityLinker'
import { getPortrait } from '../../assets/potraits'

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
  sceneType, sceneCharacters: _sceneCharacters,
  history, activeSegment, activeText, showCursor,
  choices, showChoices, sceneDone, allDone, segmentDone,
  onAdvance: _onAdvance, onChoice, onAdvanceQueue, continueLabel,
  speakingCharacter, monologueText,
}: ConversationPanelProps) {
  const historyRef = useRef<HTMLDivElement>(null)
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

  const isEmergency = sceneType === 'emergency'
  const [portraitImgError, setPortraitImgError] = useState(false)

  // Expanding panel state
  const MAX_PANEL_HEIGHT = Math.floor(window.innerHeight * 0.72)
  const [panelHeight, setPanelHeight] = useState(180)
  const prevHistLenRef = useRef(history.length)

  useEffect(() => {
    const len = history.length + (activeSegment ? 1 : 0)
    if (len === 0) {
      setPanelHeight(180)
      prevHistLenRef.current = 0
      return
    }
    if (len > prevHistLenRef.current) {
      setPanelHeight(p => {
        const addition = (len - prevHistLenRef.current) * 80
        return Math.min(p + addition, MAX_PANEL_HEIGHT)
      })
    }
    if (len < prevHistLenRef.current) {
      setPanelHeight(180)
    }
    prevHistLenRef.current = len
  }, [history.length, activeSegment, MAX_PANEL_HEIGHT])

  // Auto-scroll history to bottom
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight
    }
  }, [history, activeText])

  // Determine which character's portrait to show outside the panel (hero portrait)
  const portraitCharId =
    (speakingCharacter && speakingCharacter !== 'katerin_ashavel') ? speakingCharacter
    : activeSegment?.character && activeSegment.character !== 'katerin_ashavel' ? activeSegment.character
    : activeSegment?.primaryCharacter && activeSegment.primaryCharacter !== 'katerin_ashavel' ? activeSegment.primaryCharacter
    : null

  const portraitImg = portraitCharId ? getPortrait(portraitCharId) : null

  // Current speaker ID for name highlighting
  const currentSpeakerId = portraitCharId

  // Reset error state when speaker changes
  useEffect(() => {
    setPortraitImgError(false)
  }, [portraitCharId])

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, pointerEvents: 'none' }}>
      {isEmergency && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(180,30,20,0.06) 100%)',
          pointerEvents: 'none', zIndex: 90,
        }} />
      )}

      {/* Hero Portrait — floating left of panel */}
      {portraitCharId && (
        <div style={{
          position: 'fixed',
          left: 'calc(50% - 320px)',
          bottom: '90px',
          zIndex: 101,
          pointerEvents: 'all',
          transition: 'opacity 0.35s ease',
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            border: '3px solid #c9a84c',
            boxShadow: '0 0 0 1px rgba(201,168,76,0.3), 0 4px 20px rgba(0,0,0,0.8)',
            overflow: 'hidden',
            background: 'rgba(10,8,6,0.9)',
          }}>
            {portraitImg && !portraitImgError ? (
              <img
                src={portraitImg}
                alt={charName(portraitCharId)}
                onError={() => setPortraitImgError(true)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center top',
                  display: 'block',
                }}
              />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                background: 'rgba(201,168,76,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{
                  fontFamily: "'Special Elite', monospace",
                  fontSize: '28px', color: '#c9a84c', fontWeight: 'bold',
                }}>
                  {charName(portraitCharId).split(' ').filter(Boolean).map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              boxShadow: 'inset 0 0 14px rgba(0,0,0,0.55)',
              pointerEvents: 'none',
            }} />
          </div>
        </div>
      )}

      {/* Expanding conversation panel */}
      <div
        className="conversation-panel"
        style={{
          position: 'fixed',
          left: '50%',
          transform: 'translateX(-50%)',
          bottom: '0',
          width: '520px',
          height: `${panelHeight}px`,
          transition: 'height 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          pointerEvents: 'all',
        }}
      >
        {/* Fade to transparent at top edge */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: 'linear-gradient(to bottom, transparent, rgba(10,8,6,0.92))',
          zIndex: 2,
          pointerEvents: 'none',
        }} />

        {/* Solid dark background below fade */}
        <div style={{
          position: 'absolute',
          top: '60px',
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(10,8,6,0.92)',
          borderTop: '1px solid rgba(201,168,76,0.25)',
          borderLeft: '1px solid rgba(201,168,76,0.25)',
          zIndex: 1,
        }} />

        {/* Scrollable dialogue history */}
        <div
          ref={historyRef}
          style={{
            position: 'relative',
            zIndex: 3,
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
        >
          {history.map((entry, i) => {
            const isLast = i === history.length - 1 && !activeSegment
            const opacity = isLast ? 1 : i === history.length - 2 ? 0.6 : 0.3
            const entrySpeakerId = entry.characterId ?? ''
            const isCurrentSpeaker = entrySpeakerId === currentSpeakerId && entrySpeakerId !== ''

            return (
              <div
                key={entry.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '6px 16px',
                  opacity,
                  transition: 'opacity 0.5s ease',
                }}
              >
                {/* Text content */}
                <div style={{ flex: 1 }}>
                  {/* Speaker name */}
                  {entry.type !== 'narrative' && (
                    <div style={{
                      fontSize: '9px',
                      letterSpacing: '1.5px',
                      color: entry.type === 'player_spoken'
                        ? 'rgba(232,220,200,0.7)'
                        : isCurrentSpeaker ? '#c9a84c' : 'rgba(201,168,76,0.4)',
                      textTransform: 'uppercase',
                      marginBottom: '3px',
                      fontFamily: 'Georgia, serif',
                      transition: 'color 0.4s ease',
                    }}>
                      {entry.type === 'player_spoken' ? 'YOU' : entry.characterName}
                    </div>
                  )}

                  {/* Dialogue / narrative text */}
                  <div style={{
                    fontSize: '13px',
                    lineHeight: '1.6',
                    color: entry.type === 'narrative'
                      ? 'rgba(180,170,150,0.8)'
                      : 'rgba(232,213,163,0.92)',
                    fontFamily: "'Crimson Text', serif",
                    fontStyle: entry.type === 'narrative' ? 'italic' : 'normal',
                  }}>
                    {entry.type === 'narrative'
                      ? renderWithEntities(entry.text, true)
                      : `"${renderWithEntities(entry.text, true)}"`
                    }
                  </div>
                </div>
              </div>
            )
          })}

          {/* Active segment typing */}
          {activeSegment && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '6px 16px',
              opacity: 1,
            }}>
              <div style={{ flex: 1 }}>
                {activeSegment.type === 'dialogue' && (
                  <div style={{
                    fontSize: '9px',
                    letterSpacing: '1.5px',
                    color: '#c9a84c',
                    textTransform: 'uppercase',
                    marginBottom: '3px',
                    fontFamily: 'Georgia, serif',
                  }}>
                    {charName(activeSegment.character ?? '')}
                  </div>
                )}
                <div style={{
                  fontSize: '13px',
                  lineHeight: '1.6',
                  color: activeSegment.type === 'dialogue'
                    ? 'rgba(232,213,163,0.92)'
                    : 'rgba(180,170,150,0.8)',
                  fontFamily: "'Crimson Text', serif",
                  fontStyle: activeSegment.type === 'dialogue' ? 'normal' : 'italic',
                }}>
                  {activeSegment.type === 'dialogue' ? '"' : ''}
                  {renderWithEntities(activeText, true)}
                  {showCursor && <span className="typewriter-cursor" />}
                  {activeSegment.type === 'dialogue' ? '"' : ''}
                </div>
              </div>
            </div>
          )}

          {/* Continue / skip hint */}
          {!allDone && !sceneDone && !showChoices && (
            <div style={{
              textAlign: 'right',
              padding: '4px 16px',
              opacity: segmentDone ? 0.5 : 0.25,
              fontFamily: 'Georgia, serif',
              fontSize: '10px',
              color: '#c9a84c',
              letterSpacing: '1px',
              animation: segmentDone ? 'pulse 1.5s ease-in-out infinite' : undefined,
            }}>
              {segmentDone ? '▼' : '▸ skip'}
            </div>
          )}
        </div>

        {/* Monologue */}
        {shouldShowMonologue && (
          <div style={{
            position: 'relative',
            zIndex: 3,
            flexShrink: 0,
            padding: '12px 16px',
            borderTop: '1px solid rgba(201,168,76,0.15)',
            background: 'rgba(10,8,6,0.85)',
            opacity: monologueVisible && !monologueFading ? 1 : 0,
            transition: 'opacity 0.5s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span style={{
                fontSize: '14px',
                color: 'rgba(201,168,76,0.5)',
                flexShrink: 0,
                marginTop: '1px',
                fontFamily: 'serif',
              }}>
                ✎
              </span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '12px',
                  fontStyle: 'italic',
                  color: 'rgba(180,170,150,0.75)',
                  lineHeight: '1.6',
                  margin: 0,
                  fontFamily: "'Crimson Text', serif",
                }}>
                  {monologueText}
                </div>
                <div style={{
                  fontSize: '9px',
                  letterSpacing: '1px',
                  color: 'rgba(201,168,76,0.3)',
                  margin: '8px 0 0',
                  textAlign: 'right',
                  fontFamily: 'Georgia, serif',
                }}>
                  Press Space to continue
                </div>
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
              position: 'relative',
              zIndex: 3,
              flexShrink: 0,
              maxHeight: '40vh',
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '10px 16px 14px',
              borderTop: '1px solid rgba(201,168,76,0.15)',
              background: 'rgba(10,8,6,0.85)',
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
                  style={{ maxHeight: '160px', overflow: 'hidden' }}
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
                fontSize: '10px',
                letterSpacing: '2px',
                padding: '8px',
                fontFamily: 'Georgia, serif',
                flexShrink: 0,
              }}>
                ▼ SCROLL FOR MORE OPTIONS
              </div>
            )}
          </div>
        )}

        {/* Micro-reactions */}
        {activeReactions && !sceneDone && (
          <div style={{
            position: 'relative',
            zIndex: 3,
            flexShrink: 0,
            padding: '12px 16px 14px',
            borderTop: '1px solid rgba(201,168,76,0.15)',
            background: 'rgba(10,8,6,0.85)',
            opacity: reactionsFading ? 0 : 1,
            transition: 'opacity 0.5s ease',
          }}>
            {activeReactions.map((reaction, i) => (
              <div key={i} style={{ marginBottom: i < activeReactions.length - 1 ? 8 : 0 }}>
                {reaction.type === 'dialogue' && (
                  <>
                    <div style={{
                      fontSize: '9px',
                      letterSpacing: '1.5px',
                      color: getCharacterColor(reaction.character),
                      textTransform: 'uppercase',
                      marginBottom: '2px',
                      fontFamily: 'Georgia, serif',
                    }}>
                      {charName(reaction.character)}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      lineHeight: '1.6',
                      color: 'rgba(200,185,155,0.85)',
                      fontFamily: "'Crimson Text', serif",
                    }}>
                      "{renderWithEntities(reaction.text, true)}"
                    </div>
                  </>
                )}
                {reaction.type === 'action' && (
                  <div style={{
                    fontSize: '12px',
                    fontStyle: 'italic',
                    color: 'rgba(180,170,150,0.75)',
                    lineHeight: '1.5',
                    fontFamily: "'Crimson Text', serif",
                  }}>
                    {reaction.text}
                  </div>
                )}
                {reaction.type === 'silence' && (
                  <>
                    <div style={{
                      fontSize: '9px',
                      letterSpacing: '1.5px',
                      color: getCharacterColor(reaction.character),
                      textTransform: 'uppercase',
                      marginBottom: '2px',
                      fontFamily: 'Georgia, serif',
                    }}>
                      {charName(reaction.character)}&nbsp;
                      <span style={{ opacity: 0.5, fontStyle: 'italic', fontWeight: 400 }}>
                        [silence]
                      </span>
                    </div>
                    <div style={{
                      fontSize: '11px',
                      fontStyle: 'italic',
                      color: 'rgba(180,170,150,0.75)',
                      lineHeight: '1.5',
                      fontFamily: "'Crimson Text', serif",
                    }}>
                      {reaction.text}
                    </div>
                  </>
                )}
                {reaction.type === 'narrative' && (
                  <div style={{
                    fontSize: '12px',
                    fontStyle: 'italic',
                    color: 'rgba(180,170,150,0.75)',
                    lineHeight: '1.5',
                    fontFamily: "'Crimson Text', serif",
                  }}>
                    {reaction.text}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Scene completed — advance button */}
        {sceneDone && (
          <div style={{
            position: 'relative',
            zIndex: 3,
            flexShrink: 0,
            padding: '12px 16px 14px',
            borderTop: '1px solid rgba(201,168,76,0.15)',
            background: 'rgba(10,8,6,0.85)',
          }}>
            <button
              onClick={onAdvanceQueue}
              style={{
                width: '100%',
                padding: '10px',
                background: 'rgba(201,168,76,0.08)',
                border: '1px solid rgba(201,168,76,0.35)',
                borderRadius: '2px',
                color: '#c9a84c',
                fontFamily: 'Georgia, serif',
                fontSize: '12px',
                letterSpacing: '2px',
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              {continueLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
