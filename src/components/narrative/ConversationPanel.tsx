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

type ChoicePhase = 'idle' | 'pulsing' | 'fading' | 'showing_reactions' | 'reactions_fading' | 'done'

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
  const [advanceReady, setAdvanceReady] = useState(false)
  const [choicePhase, setChoicePhase] = useState<ChoicePhase>('idle')

  // Delay advance button appearance after scene ends (smoother transition)
  useEffect(() => {
    if (sceneDone) {
      setAdvanceReady(false)
      const t = setTimeout(() => setAdvanceReady(true), 800)
      return () => clearTimeout(t)
    } else {
      setAdvanceReady(false)
    }
  }, [sceneDone])

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
    if (choicePhase !== 'idle') return
    if (choiceProcessedRef.current.has(id)) return
    console.log('[GameLogic] Processing choice:', id)
    choiceProcessedRef.current.add(id)

    const choice = choices.find(c => c.id === id)
    if (choice?.reactions?.length) {
      setActiveReactions(choice.reactions)
    }

    try {
      onChoice(id)
    } catch (error) {
      console.error('[GameLogic] CRITICAL ERROR:', error)
    }

    setSelectedId(id)
    setChoicePhase('pulsing')
  }, [onChoice, choicePhase, choices])

  // Reactive animation sequencer — driven by choicePhase, not blocking game logic
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>

    switch (choicePhase) {
      case 'pulsing':
        timer = setTimeout(() => {
          setSelectedId(null)
          setFadingId(selectedId)
          setChoicePhase('fading')
        }, 200)
        break

      case 'fading':
        if (activeReactions) {
          setChoicePhase('showing_reactions')
        } else {
          timer = setTimeout(() => {
            setFadingId(null)
            setSelectedId(null)
            setChoicePhase('done')
          }, 800)
        }
        break

      case 'showing_reactions':
        timer = setTimeout(() => {
          setReactionsFading(true)
          setChoicePhase('reactions_fading')
        }, 2500)
        break

      case 'reactions_fading':
        timer = setTimeout(() => {
          setActiveReactions(null)
          setReactionsFading(false)
          setFadingId(null)
          setSelectedId(null)
          setChoicePhase('done')
        }, 500)
        break

      case 'done':
        timer = setTimeout(() => {
          setChoicePhase('idle')
        }, 100)
        break
    }

    return () => clearTimeout(timer)
  }, [choicePhase, selectedId, activeReactions])

  // Reset selection state when new choices appear
  useEffect(() => {
    setSelectedId(null)
    setFadingId(null)
    setActiveReactions(null)
    setReactionsFading(false)
    setChoicePhase('idle')
    choiceProcessedRef.current.clear()
  }, [choices])

  // Safety: force-reset choice phase when scene transitions to done.
  // Guards against any edge case where the animation sequencer remains non-idle
  // after processChoice sets sceneDone but the choices prop hasn't changed yet.
  useEffect(() => {
    if (sceneDone && choicePhase !== 'idle') {
      setSelectedId(null)
      setFadingId(null)
      setActiveReactions(null)
      setReactionsFading(false)
      setChoicePhase('idle')
      choiceProcessedRef.current.clear()
    }
  }, [sceneDone, choicePhase])

  // Fail-safe: if the choice animation sequencer is stuck (e.g. processChoice
  // returned early and the `choices` prop never changed), force a reset after 6s
  // so the player is never permanently frozen. Legitimate pulsing+fading+reactions
  // cycles complete in well under 4s.
  useEffect(() => {
    if (choicePhase === 'idle') return
    const t = setTimeout(() => {
      console.warn(
        '[ConversationPanel] STUCK RECOVERY: choicePhase was',
        choicePhase,
        'for >6s without choices prop changing — forcing reset',
      )
      setSelectedId(null)
      setFadingId(null)
      setActiveReactions(null)
      setReactionsFading(false)
      setChoicePhase('idle')
      choiceProcessedRef.current.clear()
    }, 6000)
    return () => clearTimeout(t)
  }, [choicePhase])

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
        const addition = (len - prevHistLenRef.current) * 110
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
    : 'katerin_ashavel'

  const portraitImg = portraitCharId ? getPortrait(portraitCharId) : null

  // Current speaker ID for name highlighting
  const currentSpeakerId = portraitCharId

  // Reset error state when speaker changes
  useEffect(() => {
    setPortraitImgError(false)
  }, [portraitCharId])

  const monologueFontSize = Math.round(12 + (panelHeight - 180) * 0.025)

  return (
    <>
      {isEmergency && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(180,30,20,0.06) 100%)',
          pointerEvents: 'none', zIndex: 90,
        }} />
      )}

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, pointerEvents: 'all', display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '16px', padding: '0 20px 20px 20px', maxWidth: '780px', margin: '0 auto' }}>

        {/* Hero Portrait — LEFT side of conversation row */}
        <div style={{
          flexShrink: 0,
          zIndex: 101,
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            border: '3px solid #c9a84c',
            boxShadow: '0 0 0 1px rgba(201,168,76,0.3), 0 4px 20px rgba(0,0,0,0.8)',
            overflow: 'hidden',
            background: 'rgba(10,8,6,0.9)',
            position: 'relative',
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
                  fontSize: '32px', color: '#c9a84c', fontWeight: 'bold',
                }}>
                  {charName(portraitCharId).split(' ').filter(Boolean).map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              boxShadow: 'inset 0 0 8px rgba(0,0,0,0.55)',
              pointerEvents: 'none',
            }} />
          </div>
        </div>

        {/* Expanding conversation panel — RIGHT side of row */}
        <div
          className="conversation-panel"
          style={{
            flex: 1,
            maxWidth: '520px',
            height: `${panelHeight}px`,
            maxHeight: `${MAX_PANEL_HEIGHT}px`,
            transition: 'height 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: '#0a0806',
            position: 'relative',
            borderTop: '1px solid rgba(201,168,76,0.25)',
            borderLeft: '1px solid rgba(201,168,76,0.25)',
            paddingBottom: '40px',
          }}
        >



        {/* Monologue — at the very top */}
        {shouldShowMonologue && (
          <div style={{
            position: 'relative',
            zIndex: 3,
            flexShrink: 0,
            padding: '14px 20px',
            borderBottom: '1px solid rgba(201,168,76,0.15)',
            background: '#0a0806',
            opacity: monologueVisible && !monologueFading ? 1 : 0,
            transition: 'opacity 0.5s ease',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              width: '100%',
            }}>
              <span style={{
                fontSize: `${Math.max(12, monologueFontSize - 2)}px`,
                color: 'rgba(201,168,76,0.5)',
                flexShrink: 0,
                marginTop: '2px',
                fontFamily: 'serif',
              }}>
                ✎
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: `${monologueFontSize}px`,
                  fontStyle: 'italic',
                  color: 'rgba(180,170,150,0.75)',
                  lineHeight: '1.5',
                  margin: 0,
                  fontFamily: "'Crimson Text', serif",
                }}>
                  {monologueText}
                </div>
                <div style={{
                  fontSize: '9px',
                  letterSpacing: '1px',
                  color: 'rgba(201,168,76,0.3)',
                  margin: '10px 0 0',
                  textAlign: 'right',
                  fontFamily: 'Georgia, serif',
                }}>
                  Press Space to continue
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable dialogue history */}
        <div
          ref={historyRef}
          className="dialogue-scroll-area"
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
            justifyContent: 'flex-start',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 40px, black calc(100% - 60px), transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 40px, black calc(100% - 60px), transparent 100%)',
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
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <div style={{
              flexShrink: 0,
              padding: '8px 16px 16px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              position: 'relative',
              zIndex: 3,
            }}>
              {choices.map((choice, i) => {
                const isSelected = selectedId === choice.id
                const isFading = fadingId === choice.id
                const isDimmed = fadingId && !isFading
                return (
                <div
                  key={i}
                  onClick={() => handleChoice(choice.id)}
                  style={{
                    padding: '11px 16px',
                    background: isSelected
                      ? 'rgba(201,168,76,0.18)'
                      : isFading
                      ? 'rgba(201,168,76,0.06)'
                      : 'rgba(201,168,76,0.06)',
                    border: isSelected
                      ? '2px solid rgba(201,168,76,0.7)'
                      : '1px solid rgba(201,168,76,0.25)',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: isSelected ? '#ffffff' : '#e8d5a3',
                    fontFamily: 'Georgia, serif',
                    lineHeight: '1.5',
                    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                    userSelect: 'none',
                    transform: isSelected ? 'scale(0.97)' : isDimmed ? 'scale(1)' : 'scale(1)',
                    opacity: isFading ? 0 : isDimmed ? 0.4 : 1,
                    boxShadow: isSelected
                      ? '0 0 20px rgba(201,168,76,0.3)'
                      : 'none',
                    animation: isSelected
                      ? 'choice-glow-burst 0.4s ease-out'
                      : isFading
                      ? 'choice-fade-out 0.8s ease forwards'
                      : isDimmed
                      ? 'choice-dim-others 0.3s ease forwards'
                      : 'none',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={e => {
                    if (!selectedId && !fadingId) {
                      e.currentTarget.style.background = 'rgba(201,168,76,0.14)'
                      e.currentTarget.style.borderColor = 'rgba(201,168,76,0.6)'
                      e.currentTarget.style.color = '#ffffff'
                      e.currentTarget.style.transform = 'translateY(-1px)'
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(201,168,76,0.12)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!selectedId && !fadingId) {
                      e.currentTarget.style.background = 'rgba(201,168,76,0.06)'
                      e.currentTarget.style.borderColor = 'rgba(201,168,76,0.25)'
                      e.currentTarget.style.color = '#e8d5a3'
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.boxShadow = 'none'
                    }
                  }}
                >
                  <span style={{ position: 'relative', zIndex: 1 }}>{choice.text}</span>
                  {isSelected && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: '200%',
                      height: '200%',
                      background: 'radial-gradient(circle, rgba(201,168,76,0.25) 0%, transparent 70%)',
                      transform: 'translate(-50%, -50%) scale(0)',
                      animation: 'choice-ripple 0.4s ease-out',
                      pointerEvents: 'none',
                      zIndex: 0,
                    }} />
                  )}
                </div>
                )
              })}
            </div>
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
        {sceneDone && advanceReady && (
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
    </>
  )
}
