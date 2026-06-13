import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import type { NarrativeSegment, SceneChoice, ChoiceReaction } from '../../types/narrative'
import { useNarrativeStore } from '../../stores/narrativeStore'
import { useWeekStore } from '../../stores/weekStore'
import { getCharacterColor } from '../portraits/CharacterPortraits'
import { renderWithEntities } from '../news/EntityLinker'
import { getPortrait } from '../../assets/potraits'

const CHAR_NAMES: Record<string, string> = {
  katerin_ashavel: 'Chancellor Ashavel',
  vyktor_reznik: 'Vyktor Reznik',
  jonas_ashavel: 'Jonas Ashavel',
  liora_ashavel: 'Liora Ashavel',
  tomas_ashavel: 'Tomas Ashavel',
  gregor_maric: 'Gregor Marić',
  aldric_theron: 'Prof. Aldric Theron',
  irina_dusek: 'Colonel Dusek',
  colonel_dusek: 'Colonel Dusek',
  stanislov_renek: 'Archbishop Renek',
  archbishop_renek: 'Archbishop Renek',
  danika_oberlin: 'Danika Oberlin',
  drazen_kolvar: 'Dražen Kolvar',
  delegate_kolvar: 'Delegate Kolvar',
  elara_vostane: 'Elara Vostane',
  elena_braskov: 'Elena Braskov',
  nikolai_perov: 'General Perov',
  general_brenner: 'General Brenner',
  oskar_brenner: 'Gen. Brenner',
  soraya_khaled: 'Soraya Khaled',
  lucan_vael: 'Lucan Vael',
  nadia_voss: 'Nadia Voss',
  harrison_cole: 'Amb. Harrison Cole',
  yevgeni_stahl: 'Commissar Stahl',
  stefan_morvec: 'Stefan Morvec',
  aleksei_morvec: 'Aleksei Morvec',
  dragan_vukov: 'Marshal Vukov',
  elodie_marchand: 'Elodie Marchand',
  radovan_skala: 'Warlord Skala',
  maren_tovik: 'Maren Tovik',
  viktor_dorne: 'Viktor Dorne',
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
  matthias_krel: 'Matthias Krel',
  emilian_voss: 'Dr. Emilian Voss',
  aleksander_igor: 'Aleksander Igor',
  andrei_luca: 'President Luca',
  idris_kaelen: 'Idris Kaelen',
  minister_volkov: 'Minister Volkov',
  other_oligarchs: 'The Oligarchs',
  generic: 'Official',
}

function charName(id: string): string {
  return CHAR_NAMES[id] ?? id.replace(/_/g, ' ')
}

function effectiveSegmentType(type: NarrativeSegment['type']): 'description' | 'dialogue' | 'internal_thought' {
  if (type === 'monologue') return 'internal_thought'
  if (type === 'narrative') return 'description'
  return type
}

interface ConversationHistoryEntry {
  id: string
  type: 'description' | 'dialogue' | 'narrative' | 'internal_thought' | 'player_spoken'
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
  const { currentScene } = useNarrativeStore()
  const phase = useWeekStore(s => s.phase)

  // Per-portrait image error tracking
  const [portraitErrors, setPortraitErrors] = useState<Record<string, boolean>>({})

  // Track the top of the stack for entrance animations
  const prevTopSpeakerRef = useRef<string | undefined>(undefined)

  // Deterministic stack built from actual history (prevents skipping bugs)
  const speakerStack = useMemo(() => {
    const stack: string[] = []
    const processId = (id: string | undefined) => {
      if (!id || id === 'katerin_ashavel') return
      const idx = stack.indexOf(id)
      if (idx > -1) stack.splice(idx, 1)
      stack.push(id)
    }

    // 1. Seed with primary character so narrative openings aren't empty
    if (activeSegment?.primaryCharacter && activeSegment.primaryCharacter !== 'katerin_ashavel') {
      processId(activeSegment.primaryCharacter)
    }

    // 2. Add everyone who actually spoke in history
    history.forEach(entry => {
      if (entry.type !== 'narrative' && entry.type !== 'description' && entry.type !== 'internal_thought' && entry.characterId) {
        processId(entry.characterId)
      }
    })

    // 3. Add the actively typing speaker
    if (activeSegment?.type === 'dialogue' && activeSegment.character) {
      processId(activeSegment.character)
    }

    return stack
  }, [history, activeSegment])

  // Which speaker just entered (for entrance animation trigger)
  const [newSpeakerId, setNewSpeakerId] = useState<string | undefined>(undefined)

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
    prevTopSpeakerRef.current = undefined
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
    if (import.meta.env.DEV) console.log('[GameLogic] Processing choice:', id)
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

  // Expanding panel state
  const MAX_PANEL_HEIGHT = Math.floor(window.innerHeight * 0.85 - 80)
  const [panelHeight, setPanelHeight] = useState(180)
  const prevHistLenRef = useRef(history.length)

  // Add extra height when choices are present so they aren't clipped
  const choiceExtraHeight =
    (choices && choices.length > 0 && !sceneDone)
      ? choices.length * 80
      : 0

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

  // Trigger entrance animation when the active speaker changes
  useEffect(() => {
    const topSpeaker = speakerStack[speakerStack.length - 1]
    if (topSpeaker && topSpeaker !== prevTopSpeakerRef.current) {
      setNewSpeakerId(topSpeaker)
      const t = setTimeout(() => setNewSpeakerId(undefined), 400)
      prevTopSpeakerRef.current = topSpeaker
      return () => clearTimeout(t)
    }
  }, [speakerStack])

  // Derive currentSpeakerId for name highlighting in history
  const currentSpeakerId = speakerStack[speakerStack.length - 1] ?? speakingCharacter ?? ''

  const monologueFontSize = Math.round(12 + (panelHeight - 180) * 0.025)

  // Effective height accounts for choice buttons needing space
  const effectiveHeight = Math.min(
    panelHeight + choiceExtraHeight,
    MAX_PANEL_HEIGHT
  )

  if (phase !== 'scene') return null

  return (
    <>
      <style>{`
        @keyframes portrait-enter {
          from {
            transform: scale(0.82);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
      {isEmergency && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(180,30,20,0.06) 100%)',
          pointerEvents: 'none', zIndex: 90,
        }} />
      )}

      {currentScene && (
      <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 600, marginBottom: '5px', pointerEvents: 'all', display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: '12px', padding: '0 16px', width: '100%', maxWidth: '780px', boxSizing: 'border-box' }}>

        {/* Portrait Stack — left column, stacks bottom-to-top */}
        <div
          style={{
            flexShrink: 0,
            zIndex: 101,
            display: 'flex',
            flexDirection: 'column-reverse',
            alignItems: 'center',
            gap: '6px',
            maxHeight: '260px',
            minWidth: '72px',
            width: '72px',
            overflow: 'visible',
            justifyContent: 'flex-end',
            alignSelf: 'flex-end',
          }}
        >
          {speakerStack.length === 0 || !currentScene ? null : (
            [...speakerStack].reverse().map((charId, reversedIdx) => {
              const isCurrent = reversedIdx === 0
              const isNew = charId === newSpeakerId
              const hasError = portraitErrors[charId] ?? false
              const img = getPortrait(charId)
              const name = charName(charId)
              const initials = name
                .split(' ')
                .filter(Boolean)
                .map((w: string) => w[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()

              const size = isCurrent ? 72 : 52
              const opacity = isCurrent ? 1 : 0.45
              const borderColor = isCurrent ? '#c9a84c' : 'rgba(201,168,76,0.3)'
              const borderWidth = isCurrent ? '3px' : '2px'
              const boxShadow = isCurrent
                ? '0 0 0 1px rgba(201,168,76,0.3), 0 4px 20px rgba(0,0,0,0.8)'
                : '0 2px 8px rgba(0,0,0,0.6)'

              return (
                <div
                  key={charId}
                  style={{
                    flexShrink: 0,
                    width: `${size}px`,
                    height: `${size}px`,
                    borderRadius: '50%',
                    border: `${borderWidth} solid ${borderColor}`,
                    boxShadow,
                    overflow: 'hidden',
                    background: 'rgba(10,8,6,0.9)',
                    position: 'relative',
                    opacity,
                    animation: isNew && isCurrent
                      ? 'portrait-enter 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
                      : 'none',
                    transition: isCurrent
                      ? 'opacity 0.3s ease, width 0.3s ease, height 0.3s ease, border-color 0.3s ease'
                      : 'opacity 0.3s ease, width 0.3s ease, height 0.3s ease',
                  }}
                >
                  {img && !hasError ? (
                    <img
                      src={img}
                      alt={name}
                      onError={() =>
                        setPortraitErrors(prev => ({ ...prev, [charId]: true }))
                      }
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center top',
                        display: 'block',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        background: 'rgba(201,168,76,0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Special Elite', monospace",
                          fontSize: isCurrent ? '28px' : '20px',
                          color: '#c9a84c',
                          fontWeight: 'bold',
                        }}
                      >
                        {initials}
                      </span>
                    </div>
                  )}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '50%',
                      boxShadow: 'inset 0 0 8px rgba(0,0,0,0.55)',
                      pointerEvents: 'none',
                    }}
                  />
                </div>
              )
            })
          )}
        </div>

        {/* Expanding conversation panel — RIGHT side of row */}
        <div style={{ position: 'relative', flex: 1, maxWidth: '520px', height: `${effectiveHeight}px`, maxHeight: `${MAX_PANEL_HEIGHT}px`, transition: 'height 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}>
        <div
          className="conversation-panel"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollbarWidth: 'thin',
            background: '#0a0806',
            borderTop: '1px solid rgba(201,168,76,0.25)',
            borderLeft: '1px solid rgba(201,168,76,0.25)',
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
            maskImage: 'linear-gradient(to bottom, black 0%, black calc(100% - 60px), transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black calc(100% - 60px), transparent 100%)',
          }}
        >
          {history.map((entry, _i) => {
            const opacity = 1
            void opacity
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
                  opacity: 1,
                }}
              >
                {/* Text content */}
                <div style={{ flex: 1 }}>
                  {/* Speaker name */}
                  {entry.type !== 'narrative' && entry.type !== 'description' && entry.type !== 'internal_thought' && (
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
                  {entry.type === 'internal_thought' && (
                    <div style={{
                      fontFamily: "'Special Elite', monospace",
                      fontSize: '9px',
                      letterSpacing: '2px',
                      color: 'rgba(201,168,76,0.5)',
                      textTransform: 'uppercase',
                      marginBottom: '3px',
                    }}>
                      Katerin Ashavel
                    </div>
                  )}

                  {/* Dialogue / narrative text */}
                  <div style={{
                    fontSize: '13px',
                    lineHeight: '1.6',
                    color: entry.type === 'narrative' || entry.type === 'description'
                      ? 'rgba(180,170,150,0.8)'
                      : entry.type === 'internal_thought'
                      ? '#c9a84c'
                      : 'rgba(232,213,163,0.92)',
                    fontFamily: "'Crimson Text', serif",
                    fontStyle: entry.type === 'narrative' || entry.type === 'description' || entry.type === 'internal_thought' ? 'italic' : 'normal',
                    borderLeft: entry.type === 'internal_thought' ? '2px solid rgba(201,168,76,0.4)' : 'none',
                    paddingLeft: entry.type === 'internal_thought' ? '16px' : '0',
                    marginLeft: entry.type === 'internal_thought' ? '8px' : '0',
                  }}>
                    {entry.type === 'dialogue' || entry.type === 'player_spoken'
                      ? `"${renderWithEntities(entry.text, true)}"`
                      : renderWithEntities(entry.text, true)
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
                {(() => {
                  const activeType = effectiveSegmentType(activeSegment.type)
                  return (
                    <>
                      {activeType === 'dialogue' && (
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
                      {activeType === 'internal_thought' && (
                        <div style={{
                          fontFamily: "'Special Elite', monospace",
                          fontSize: '9px',
                          letterSpacing: '2px',
                          color: 'rgba(201,168,76,0.5)',
                          textTransform: 'uppercase',
                          marginBottom: '4px',
                        }}>
                          Katerin Ashavel
                        </div>
                      )}
                      <div style={{
                        fontSize: activeType === 'internal_thought' ? '16px' : '13px',
                        lineHeight: '1.8',
                        color: activeType === 'dialogue'
                          ? 'rgba(232,213,163,0.92)'
                          : activeType === 'internal_thought'
                          ? '#c9a84c'
                          : 'rgba(220,210,190,0.85)',
                        fontFamily: "'Crimson Text', serif",
                        fontStyle: 'italic',
                        borderLeft: activeType === 'internal_thought'
                          ? '2px solid rgba(201,168,76,0.4)'
                          : 'none',
                        paddingLeft: activeType === 'internal_thought' ? '16px' : '0',
                        marginLeft: activeType === 'internal_thought' ? '8px' : '0',
                      }}>
                        {activeType === 'dialogue' ? '"' : ''}
                        {renderWithEntities(activeText, true)}
                        {showCursor && <span className="typewriter-cursor" />}
                        {activeType === 'dialogue' ? '"' : ''}
                      </div>
                    </>
                  )
                })()}
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
              maxHeight: '280px',
              overflowY: 'auto' as const,
              overflowX: 'hidden',
              paddingBottom: '16px',
              scrollbarWidth: 'thin' as const,
              msOverflowStyle: 'auto',
            }}
          >
            <div style={{
              flexShrink: 0,
              padding: '8px 16px 36px 16px',
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
                  key={choice.id ?? i}
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
              <div key={`${reaction.character}_${i}`} style={{ marginBottom: i < activeReactions.length - 1 ? 8 : 0 }}>
                {(reaction.type === 'dialogue' || reaction.type === 'concern' || reaction.type === 'satisfied') && (
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
                      {reaction.type !== 'dialogue' && (
                        <span style={{ opacity: 0.6, fontStyle: 'italic', marginLeft: '6px' }}>
                          [{reaction.type}]
                        </span>
                      )}
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
        {sceneDone && advanceReady && continueLabel && (
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
      </div>
      )}
    </>
  )
}
