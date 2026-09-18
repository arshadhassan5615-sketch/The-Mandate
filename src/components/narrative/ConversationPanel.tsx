import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { NarrativeSegment, SceneChoice, ChoiceReaction } from '../../types/narrative'
import type { CodexEntry } from '../../types/codex'
import { useNarrativeStore } from '../../stores/narrativeStore'
import { useWeekStore } from '../../stores/weekStore'
import { ALL_CODEX_ENTRIES, useCodexStore } from '../../stores/codexStore'
import { getCharacterColor } from '../portraits/CharacterPortraits'
import { renderWithEntities } from '../news/EntityLinker'
import { getPortrait } from '../../assets/potraits'
import { useIsMobile } from '../../hooks/useIsMobile'

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
  general_vass: 'General Vass',
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
  rena_vasic: 'Commandant Vasić',
  lev_stanko: 'Deputy Commissioner Stančko',
  mirko_solc: 'Dr. Mirko Šolc',
  idris_kaelen: 'Idris Kaelen',
  minister_volkov: 'Minister Volkov',
  other_oligarchs: 'The Oligarchs',
  generic: 'Official',
}

function charName(id: string): string {
  return CHAR_NAMES[id] ?? id.replace(/_/g, ' ')
}

// Saturated per-character label tints (Suzerain reference). Anyone not listed
// falls back to the shared portrait palette.
const SPEAKER_TINT: Record<string, string> = {
  katerin_ashavel: '#d95a4a', vyktor_reznik: '#a3b6d3', drazen_kolvar: '#c96a3b',
  stefan_morvec: '#b08a4a', lucan_vael: '#9b7bd6', matthias_krel: '#7b8f7a',
  nadia_voss: '#4ba3b8', oskar_brenner: '#8c9a4c', irina_dusek: '#7fb069',
  jonas_ashavel: '#d4a86a', elara_vostane: '#c9a84c', aldric_theron: '#b9a0d0',
  danika_oberlin: '#d99a5b', gregor_maric: '#c25d4b',
}

const PLAYER_LABEL_COLOR = '#d95a4a'

function speakerColor(id: string): string {
  return SPEAKER_TINT[id] ?? getCharacterColor(id)
}

// ── Codex term links ───────────────────────────────────────────────────────
// Codex titles read "Name — Subtitle" or "Term (ABBR)", and dialogue almost
// never contains a full title, so each entry also matches on its name half and
// its parenthesised abbreviation. Keys are word-boundary, case-sensitive, and
// the longest key wins at any position.
const MIN_CODEX_KEY_LENGTH = 4

function codexKeysForTitle(title: string): string[] {
  const beforeDash = title.split(/\s+[—–-]\s+/)[0]
  const beforeParen = beforeDash.split(' (')[0]
  const inParens = /\(([^)]+)\)/.exec(title)?.[1] ?? ''
  return [title, beforeDash, beforeParen, inParens]
    .map(key => key.trim())
    .filter(key => key.length >= MIN_CODEX_KEY_LENGTH && /[A-Za-z]/.test(key))
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ALL_CODEX_ENTRIES comes from an eager import.meta.glob over JSON files, which
// yields module namespace objects ({ default: CodexEntry[] }) rather than the
// flat entry list its type claims. Accept both shapes and drop anything that
// is not a real entry so a data quirk can never crash scene rendering.
function normalizeCodexEntries(raw: readonly unknown[]): CodexEntry[] {
  return raw
    .flatMap((item): unknown[] => {
      if (Array.isArray(item)) return item
      const wrapped = (item as { default?: unknown } | null)?.default
      return Array.isArray(wrapped) ? wrapped : [item]
    })
    .filter((item): item is CodexEntry => {
      const entry = item as Partial<CodexEntry> | null
      return typeof entry?.id === 'string' && typeof entry?.title === 'string'
    })
}

const CODEX_ENTRIES: readonly CodexEntry[] = normalizeCodexEntries(ALL_CODEX_ENTRIES)

const CODEX_KEY_TO_ID: ReadonlyMap<string, string> = (() => {
  const map = new Map<string, string>()
  for (const entry of CODEX_ENTRIES) {
    for (const key of codexKeysForTitle(entry.title)) {
      if (!map.has(key)) map.set(key, entry.id)
    }
  }
  return map
})()

const CODEX_KEY_REGEX: RegExp | null = CODEX_KEY_TO_ID.size > 0
  ? new RegExp(
      `\\b(${[...CODEX_KEY_TO_ID.keys()]
        .sort((a, b) => b.length - a.length)
        .map(escapeRegExp)
        .join('|')})\\b`,
    )
  : null

function CodexTermLink({ text, entryId }: { text: string; entryId: string }) {
  const openInlineCodex = useCodexStore(s => s.openInlineCodex)
  return (
    <span
      onClick={(e) => { e.stopPropagation(); openInlineCodex(entryId) }}
      style={{ color: '#4ba3b8', cursor: 'pointer' }}
      title={`Open Codex: ${text}`}
    >
      {text}
    </span>
  )
}

function linkCodexTerms(text: string, keyPrefix: string): ReactNode[] {
  if (!CODEX_KEY_REGEX) return [text]
  // split() with one capture group alternates plain text and matches.
  return text.split(CODEX_KEY_REGEX).map((part, i) => {
    if (i % 2 === 0) return part
    const entryId = CODEX_KEY_TO_ID.get(part)
    return entryId
      ? <CodexTermLink key={`${keyPrefix}-${i}`} text={part} entryId={entryId} />
      : part
  })
}

// Layers codex-title links on top of the existing entity links: elements
// produced by renderWithEntities pass through untouched and only the plain
// string gaps between them are scanned.
function renderWithCodexLinks(text: string): ReactNode {
  const base = renderWithEntities(text, true)
  if (typeof base === 'string') return linkCodexTerms(base, 'cx')
  if (!Array.isArray(base)) return base
  return (base as ReactNode[]).flatMap((node, i) =>
    typeof node === 'string' ? linkCodexTerms(node, `cx${i}`) : [node],
  )
}

function effectiveSegmentType(type: NarrativeSegment['type']): 'description' | 'dialogue' | 'internal_thought' {
  if (type === 'monologue') return 'internal_thought'
  if (type === 'narrative') return 'description'
  return type
}

// Shared text styles — rendered identically in the history log and in the
// active typing segment; centralised so the two sites can never drift.
const ENTRY_ROW_STYLE: React.CSSProperties = {
  marginBottom: '14px',
}

const SPEAKER_LABEL_STYLE: React.CSSProperties = {
  fontFamily: "'Crimson Text', Georgia, serif",
  fontSize: '13px',
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  marginBottom: '4px',
}

const THOUGHT_WRAPPER_STYLE: React.CSSProperties = {
  padding: '2px 8px 2px 0px',
  margin: '2px 0',
}

const THOUGHT_TEXT_STYLE: React.CSSProperties = {
  fontFamily: "'Crimson Text', Georgia, serif",
  fontStyle: 'italic',
  fontSize: '16px',
  color: '#cbbfa4',
  lineHeight: 1.6,
  margin: 0,
  textAlign: 'left',
}

const THOUGHT_GLYPH_STYLE: React.CSSProperties = {
  color: '#c9a84c',
  marginRight: '8px',
  fontSize: '12px',
}

const DESCRIPTION_WRAPPER_STYLE: React.CSSProperties = {
  padding: '4px 0px',
  margin: '4px 0',
}

const DESCRIPTION_TEXT_STYLE: React.CSSProperties = {
  fontFamily: "'Crimson Text', Georgia, serif",
  fontStyle: 'italic',
  fontSize: '16px',
  color: '#b8ad95',
  lineHeight: 1.6,
  margin: 0,
  paddingLeft: 0,
  textAlign: 'left',
}

const DIALOGUE_TEXT_STYLE: React.CSSProperties = {
  fontFamily: "'Crimson Text', Georgia, serif",
  fontStyle: 'normal',
  fontSize: '17px',
  lineHeight: 1.55,
  color: '#e6dcc3',
  paddingLeft: '24px',
  margin: 0,
}

// Micro-reaction strip shown briefly after a choice.
const REACTION_LABEL_STYLE: React.CSSProperties = {
  fontFamily: "'Crimson Text', Georgia, serif",
  fontSize: '10px',
  letterSpacing: '0.1em',
  color: '#8f8570',
  textTransform: 'uppercase',
  marginBottom: '2px',
}

const REACTION_TEXT_STYLE: React.CSSProperties = {
  fontFamily: "'Crimson Text', Georgia, serif",
  fontSize: '13px',
  fontStyle: 'italic',
  lineHeight: 1.5,
  color: '#b8ad95',
}

// The player never gets a portrait, whatever role she plays in a segment.
const PLAYER_ID = 'katerin_ashavel'

// Inline speaker portraits: one per speaker turn, beside the name label. The
// most recent turn in the whole panel is "current" (large, bright); every
// earlier turn in scrollback is small and dim.
const PORTRAIT_SIZE = { current: 64, other: 36 }
const ACTIVE_TURN_KEY = '__active__'

// ─── Speaker header: portrait + "NAME :" rendered once at the top of a turn ──

function SpeakerHeader({ characterId, label, color, isCurrent, showPortrait = true }: {
  characterId: string
  label: string
  color: string
  isCurrent: boolean
  showPortrait?: boolean
}) {
  const hasPortrait = showPortrait && characterId !== '' && characterId !== PLAYER_ID
  const img = hasPortrait ? getPortrait(characterId) : undefined
  const size = isCurrent ? PORTRAIT_SIZE.current : PORTRAIT_SIZE.other
  const initials = label.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase()

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
      {hasPortrait && (
        <div style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          overflow: 'hidden',
          flexShrink: 0,
          border: isCurrent ? '2px solid #d9c48a' : '1.5px solid rgba(181,154,94,0.4)',
          opacity: isCurrent ? 1 : 0.5,
          boxShadow: isCurrent ? '0 0 14px rgba(201,168,76,0.4)' : 'none',
          background: '#0a0806',
          transition: 'all 0.35s ease',
        }}>
          {img ? (
            <img
              src={img}
              alt={label}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(201,168,76,0.2)',
            }}>
              <span style={{
                fontFamily: "'Crimson Text', Georgia, serif",
                fontWeight: 600,
                fontSize: isCurrent ? '22px' : '13px',
                color: '#c9a84c',
              }}>{initials}</span>
            </div>
          )}
        </div>
      )}
      <span style={{ ...SPEAKER_LABEL_STYLE, marginBottom: 0, color }}>{`${label} :`}</span>
    </div>
  )
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
  sceneType,
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
  const [hoveredChoiceId, setHoveredChoiceId] = useState<string | null>(null)
  const [isContinueHovered, setIsContinueHovered] = useState(false)
  const [isChevronHovered, setIsChevronHovered] = useState(false)
  const { currentScene } = useNarrativeStore()
  const phase = useWeekStore(s => s.phase)
  const isMobile = useIsMobile()

  // Per-portrait image error tracking — half-implemented; portrait fallback uses img/initials instead
  // const [portraitErrors, setPortraitErrors] = useState<Record<string, boolean>>({})

  const panelInnerRef = useRef<HTMLDivElement>(null)

  // Deterministic stack built from actual history (prevents skipping bugs)
  const speakerStack = useMemo(() => {
    const stack: string[] = []
    const processId = (id: string | undefined) => {
      if (!id || id === PLAYER_ID) return
      const idx = stack.indexOf(id)
      if (idx > -1) stack.splice(idx, 1)
      stack.push(id)
    }

    // 1. Seed with primary character so narrative openings aren't empty
    processId(activeSegment?.primaryCharacter)

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
    setHoveredChoiceId(null)
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

  // Panel height now wraps content naturally (max-height + overflow).
  // All fixed-height state calculations removed.
  const monologueFontSize = 12

  // Auto-scroll history to bottom
  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight
    }
  }, [history, activeText])

  // Track inner content height and animate wrapper
  useEffect(() => {
    // ResizeObserver disabled to allow full-height CSS layout
  }, [])

  // Retained per spec: LRU list of everyone who has spoken (Katerin excluded).
  // The inline render below does not need it; kept for "who is here" callers.
  void speakerStack

  // Speaker runs. A run is broken only by dialogue from a different speaker;
  // descriptions and internal thoughts inside a turn do not restart it, so a
  // speaker's portrait + name render once at the top of the run, never per line.
  const labelledEntryIds = new Set<string>()
  let runStartEntryId: string | null = null
  let lastSpokenSpeaker: string | null = null
  for (const entry of history) {
    if (entry.type !== 'dialogue' && entry.type !== 'player_spoken') continue
    const speaker = entry.characterId ?? ''
    if (speaker !== lastSpokenSpeaker) {
      labelledEntryIds.add(entry.id)
      runStartEntryId = entry.id
      lastSpokenSpeaker = speaker
    }
  }

  // The active block opens a new turn only when its speaker differs from the
  // last spoken run in history; otherwise its lines continue that run.
  const activeType = activeSegment ? effectiveSegmentType(activeSegment.type) : null
  const activeSpeakerId = activeSegment?.character ?? speakingCharacter ?? ''
  const isActiveContinuation = activeType === 'dialogue' && lastSpokenSpeaker === activeSpeakerId
  const activeOpensTurn = activeType === 'dialogue' && !isActiveContinuation

  // Exactly one turn is "current": the most recent one in the combined
  // sequence — the active block when it opens a turn, else the last run in
  // history. Its portrait renders large and bright; every earlier turn's
  // portrait in scrollback renders small and dim. Katerin's turns have no
  // portrait, so when she is last nothing is bright.
  const currentTurnKey = activeOpensTurn ? ACTIVE_TURN_KEY : runStartEntryId

  // Plain "…" line in place of the old uppercase button. The routing text
  // ("Proceed to Evening Review", "Continue to Next Meeting (2/3)") is kept;
  // only the trailing arrow is swapped for an ellipsis.
  const continueText = `${continueLabel.replace(/\s*→\s*$/, '')}…`

  // Full-height opaque column. Desktop: centred 36vw strip with the portrait
  // stack hanging off its left edge (overflow visible). Mobile: edge-to-edge,
  // stopping above the 60px bottom nav.
  const panelStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        top: 0,
        bottom: '60px',
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 600,
        pointerEvents: 'all',
        display: 'flex',
        flexDirection: 'column',
        background: '#070605',
        borderLeft: '1px solid rgba(181,154,94,0.25)',
        borderRight: '1px solid rgba(181,154,94,0.25)',
        boxShadow: '0 0 40px rgba(0,0,0,0.6)',
        overflow: 'visible',
        animation: 'panel-fade-in 0.6s ease-out forwards',
      }
    : {
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'clamp(480px, 46vw, 760px)',
        height: '100vh',
        zIndex: 600,
        pointerEvents: 'all',
        display: 'flex',
        flexDirection: 'column',
        background: '#070605',
        borderLeft: '1px solid rgba(181,154,94,0.25)',
        borderRight: '1px solid rgba(181,154,94,0.25)',
        boxShadow: '0 0 40px rgba(0,0,0,0.6)',
        overflow: 'visible',
        animation: 'panel-fade-in 0.6s ease-out forwards',
      }
  if (phase !== 'scene') return null

  return (
    <>
      {isEmergency && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(180,30,20,0.06) 100%)',
          pointerEvents: 'none', zIndex: 90,
        }} />
      )}

      {currentScene && (
      <>
      <div style={panelStyle}>

        {/* Scroll-to-top chevron */}
        <button
          type="button"
          aria-label="Scroll to top of conversation"
          onClick={() => historyRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
          onMouseEnter={() => setIsChevronHovered(true)}
          onMouseLeave={() => setIsChevronHovered(false)}
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            width: '40px',
            height: '40px',
            padding: 0,
            borderRadius: '50%',
            background: '#14110d',
            border: isChevronHovered ? '1.5px solid #c9a84c' : '1.5px solid #6b5a34',
            boxShadow: isChevronHovered ? '0 0 12px rgba(201,168,76,0.35)' : 'none',
            color: '#d9c48a',
            zIndex: 602,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 15 12 9 18 15" />
          </svg>
        </button>

        {/* Inner text column. The dialogue history below is the scroller;
            this column only scrolls if the pinned bottom sections overflow. */}
        <div
          ref={panelInnerRef}
          style={{
            position: 'relative',
            width: '100%',
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            padding: isMobile ? '56px 16px 16px 16px' : '56px 32px 24px 32px',
            boxSizing: 'border-box',
            background: 'transparent',
            borderTop: 'none',
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollbarWidth: 'thin',
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
                fontSize: `${monologueFontSize - 2}px`,
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
          {history.map((entry) => {
            const showLabel = labelledEntryIds.has(entry.id)
            const isPlayer = entry.type === 'player_spoken'
            const labelText = isPlayer ? 'YOU' : (entry.characterName ?? charName(entry.characterId ?? ''))

            return (
              <div
                key={entry.id}
                style={ENTRY_ROW_STYLE}
              >
                {/* Text content */}
                <div style={{ flex: 1 }}>
                  {/* Turn header — portrait + "NAME :" once per speaker run */}
                  {showLabel && (
                    <SpeakerHeader
                      characterId={entry.characterId ?? ''}
                      label={labelText}
                      color={isPlayer ? PLAYER_LABEL_COLOR : speakerColor(entry.characterId ?? '')}
                      isCurrent={currentTurnKey === entry.id}
                      showPortrait={!isPlayer}
                    />
                  )}
                  {/* internal_thought / monologue — no label, ✦ symbol */}
                  {entry.type === 'internal_thought' && (
                    <div style={THOUGHT_WRAPPER_STYLE}>
                      <p style={THOUGHT_TEXT_STYLE}>
                        <span style={THOUGHT_GLYPH_STYLE}>✦</span>
                        {renderWithEntities(entry.text, true)}
                      </p>
                    </div>
                  )}

                  {/* description / narrative — left-aligned, faded, no label */}
                  {(entry.type === 'description' || entry.type === 'narrative') && (
                    <div style={DESCRIPTION_WRAPPER_STYLE}>
                      <p style={DESCRIPTION_TEXT_STYLE}>
                        {renderWithCodexLinks(entry.text)}
                      </p>
                    </div>
                  )}

                  {/* dialogue / player_spoken — character label + quoted text */}
                  {(entry.type === 'dialogue' || entry.type === 'player_spoken') && (
                    <div style={DIALOGUE_TEXT_STYLE}>
                      {'"'}{renderWithCodexLinks(entry.text)}{'"'}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Active segment typing */}
          {activeSegment && (
            <div style={ENTRY_ROW_STYLE}>
              <div style={{ flex: 1 }}>
                {(() => {
                  return (
                    <>
                      {activeOpensTurn && (
                        <SpeakerHeader
                          characterId={activeSpeakerId}
                          label={charName(activeSpeakerId)}
                          color={speakerColor(activeSpeakerId)}
                          isCurrent={currentTurnKey === ACTIVE_TURN_KEY}
                        />
                      )}
                      {/* internal_thought / monologue — no label, ✦ symbol */}
                      {activeType === 'internal_thought' && (
                        <div style={THOUGHT_WRAPPER_STYLE}>
                          <p style={THOUGHT_TEXT_STYLE}>
                            <span style={THOUGHT_GLYPH_STYLE}>✦</span>
                            {renderWithEntities(activeText, true)}
                            {showCursor && <span className="typewriter-cursor" />}
                          </p>
                        </div>
                      )}

                      {/* description — left-aligned, faded, no label */}
                      {activeType === 'description' && (
                        <div style={DESCRIPTION_WRAPPER_STYLE}>
                          <p style={DESCRIPTION_TEXT_STYLE}>
                            {renderWithCodexLinks(activeText)}
                            {showCursor && <span className="typewriter-cursor" />}
                          </p>
                        </div>
                      )}

                      {/* dialogue — character label + quoted text */}
                      {activeType === 'dialogue' && (
                        <div style={DIALOGUE_TEXT_STYLE}>
                          {'"'}{renderWithCodexLinks(activeText)}
                          {showCursor && <span className="typewriter-cursor" />}
                          {'"'}
                        </div>
                      )}
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

        {/* Choices — numbered, bordered; scroll internally past 40vh */}
        {actualShowChoices && (
          <>
          <div
            ref={choicesRef}
            className="conversation-choices"
            style={{
              position: 'relative',
              zIndex: 3,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '18px 0 8px',
              maxHeight: '40vh',
              overflowY: 'auto',
              overflowX: 'hidden',
            }}
          >
            {choices.map((choice, i) => {
              const isSelected = selectedId === choice.id
              const isFading = fadingId === choice.id
              const isDimmed = fadingId && !isFading
              const isHovered = hoveredChoiceId === choice.id && selectedId === null && fadingId === null
              const isLit = isSelected || isHovered
              return (
              <div
                key={choice.id ?? i}
                onClick={() => handleChoice(choice.id)}
                style={{
                  display: 'flex',
                  gap: '10px',
                  padding: '14px 18px',
                  border: isLit ? '1px solid #c9a84c' : '1px solid rgba(181,154,94,0.55)',
                  borderRadius: '4px',
                  background: isSelected
                    ? 'rgba(201,168,76,0.18)'
                    : isHovered
                    ? 'rgba(201,168,76,0.08)'
                    : 'rgba(15,12,8,0.6)',
                  color: '#e6dcc3',
                  fontFamily: "'Crimson Text', Georgia, serif",
                  fontSize: '16px',
                  lineHeight: 1.45,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  userSelect: 'none',
                  flexShrink: 0,
                  transform: isSelected ? 'scale(0.97)' : 'scale(1)',
                  opacity: isFading ? 0 : isDimmed ? 0.4 : 1,
                  boxShadow: isSelected
                    ? '0 0 20px rgba(201,168,76,0.3)'
                    : isHovered
                    ? '0 0 12px rgba(201,168,76,0.18)'
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
                onMouseEnter={() => {
                  if (selectedId === null && fadingId === null) setHoveredChoiceId(choice.id)
                }}
                onMouseLeave={() => {
                  setHoveredChoiceId(null)
                }}
              >
                <span style={{ position: 'relative', zIndex: 1, flexShrink: 0, color: '#b59a5e' }}>{i + 1}.</span>
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
              color: '#b8ad95',
              fontSize: '11px',
              letterSpacing: '0.12em',
              padding: '4px 0 8px',
              fontFamily: "'Crimson Text', Georgia, serif",
              flexShrink: 0,
            }}>
              ▼ SCROLL FOR MORE OPTIONS
            </div>
          )}
          </>
        )}

        {/* Micro-reactions */}
        {activeReactions && !sceneDone && (
          <div style={{
            position: 'relative',
            zIndex: 3,
            flexShrink: 0,
            padding: '12px 0 14px',
            borderTop: '1px solid rgba(181,154,94,0.25)',
            background: 'transparent',
            opacity: reactionsFading ? 0 : 1,
            transition: 'opacity 0.5s ease',
          }}>
            {activeReactions.map((reaction, i) => (
              <div key={`${reaction.character}_${i}`} style={{ marginBottom: i < activeReactions.length - 1 ? 8 : 0 }}>
                {(reaction.type === 'dialogue' || reaction.type === 'concern' || reaction.type === 'satisfied') && (
                  <>
                    <div style={REACTION_LABEL_STYLE}>
                      {charName(reaction.character)}
                      {reaction.type !== 'dialogue' && (
                        <span style={{ opacity: 0.6, fontStyle: 'italic', marginLeft: '6px' }}>
                          [{reaction.type}]
                        </span>
                      )}
                    </div>
                    <div style={REACTION_TEXT_STYLE}>
                      <>{'"'}{renderWithEntities(reaction.text, true)}{'"'}</>
                    </div>
                  </>
                )}
                {reaction.type === 'action' && (
                  <div style={REACTION_TEXT_STYLE}>
                    {reaction.text}
                  </div>
                )}
                {reaction.type === 'silence' && (
                  <>
                    <div style={REACTION_LABEL_STYLE}>
                      {charName(reaction.character)}&nbsp;
                      <span style={{ opacity: 0.5, fontStyle: 'italic', fontWeight: 400 }}>
                        [silence]
                      </span>
                    </div>
                    <div style={REACTION_TEXT_STYLE}>
                      {reaction.text}
                    </div>
                  </>
                )}
                {reaction.type === 'narrative' && (
                  <div style={REACTION_TEXT_STYLE}>
                    {reaction.text}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Scene completed — plain "Continue…" line, same gating as before */}
        {sceneDone && advanceReady && continueLabel && (
          <div style={{ position: 'relative', zIndex: 3, flexShrink: 0 }}>
            <button
              type="button"
              onClick={onAdvanceQueue}
              onMouseEnter={() => setIsContinueHovered(true)}
              onMouseLeave={() => setIsContinueHovered(false)}
              style={{
                display: 'block',
                width: '100%',
                padding: '14px 0',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                fontFamily: "'Crimson Text', Georgia, serif",
                fontSize: '16px',
                color: isContinueHovered ? '#c9a84c' : '#e6dcc3',
                cursor: 'pointer',
                transition: 'color 0.15s ease',
              }}
            >
              {continueText}
            </button>
          </div>
        )}
        </div>
      </div>
      </>
      )}
    </>
  )
}
