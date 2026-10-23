import { useRef, useEffect, useLayoutEffect, useState, useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { NarrativeSegment, SceneChoice, ChoiceReaction } from '../../types/narrative'
import type { CodexEntry } from '../../types/codex'
import { useNarrativeStore } from '../../stores/narrativeStore'
import { useWeekStore } from '../../stores/weekStore'
import { ALL_CODEX_ENTRIES, useCodexStore } from '../../stores/codexStore'
import { charName } from './speakers'
import ChoiceCard from './ChoiceCard'
import type { ChoiceCardState } from './ChoiceCard'
import { renderWithEntities } from '../news/EntityLinker'
import PortraitRail from './PortraitRail'
import { sceneParticipants } from './participants'
import { isBriefUnlocked } from '../briefs/briefAccess'
import { useViewportMode } from '../../hooks/useViewportMode'
import { Z } from '../../constants/zIndex'

// Speaker label: "NAME :" (uppercased by CSS). No role.
function SpeakerLabelText({ name }: { name: string }) {
  return <>{name} :</>
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

// A keyword in dialogue that opens its brief over the conversation; closing the
// brief returns to the same line. Locked briefs stay plain text (no spoilers);
// unread ones carry a dot.
function CodexTermLink({ text, entryId }: { text: string; entryId: string }) {
  const openInlineCodex = useCodexStore(s => s.openInlineCodex)
  const isUnread = useCodexStore(s => !s.seenEntryIds.includes(entryId))
  const activeFlags = useNarrativeStore(s => s.activeFlags)
  const unlockedCodexIds = useNarrativeStore(s => s.unlockedCodexIds)
  const entry = CODEX_ENTRIES.find(e => e.id === entryId)
  if (!entry || !isBriefUnlocked(entry, activeFlags, unlockedCodexIds)) return <>{text}</>
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(e) => { e.stopPropagation(); openInlineCodex(entryId) }}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); openInlineCodex(entryId) } }}
      style={{ color: KEYWORD_COLOR, cursor: 'pointer', borderBottom: isUnread ? `1px dotted ${KEYWORD_COLOR}` : undefined }}
      title={`Open brief: ${text}`}
      data-unread={isUnread || undefined}
    >
      {text}
      {isUnread && <sup aria-label="unread" style={{ color: '#e8b04a', fontSize: '0.6em', marginLeft: '1px' }}>●</sup>}
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
// Suzerain-style palette for the column: pure black ground, orange speaker
// labels (red for the player), teal keyword links, cream dialogue.
const COLUMN_BG = '#000000'
const NPC_LABEL_COLOR = '#7f3d19'
// The newest line is white; everything above it settles to grey.
const NEWEST_TEXT_COLOR = '#ffffff'
const PLAYER_NAME_COLOR = '#d0503d'
const KEYWORD_COLOR = '#4a9ca2'

interface ColumnTextStyles {
  entryRow: React.CSSProperties
  speakerLabel: React.CSSProperties
  thoughtText: React.CSSProperties
  descriptionText: React.CSSProperties
  dialogueText: React.CSSProperties
}

// One text scale for every viewport, matching the Suzerain reference: 1.05vw
// reading text, 0.95vw speaker labels.
const SERIF = "'Crimson Text', Georgia, serif"
const READING_SIZE = 'clamp(7px, 1.05vw, 32px)'
const READING_LINE_HEIGHT = 1.4

const COLUMN_TEXT_STYLES: ColumnTextStyles = {
  entryRow: {
    marginBottom: '10px',
  },
  speakerLabel: {
    fontFamily: SERIF,
    fontSize: 'clamp(6.5px, 0.95vw, 29px)',
    fontWeight: 600,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    marginBottom: '3px',
  },
  thoughtText: {
    fontFamily: SERIF,
    fontStyle: 'italic',
    fontSize: READING_SIZE,
    color: '#8e8e8e',
    lineHeight: READING_LINE_HEIGHT,
    margin: 0,
    textAlign: 'left',
  },
  descriptionText: {
    fontFamily: SERIF,
    fontStyle: 'italic',
    fontSize: READING_SIZE,
    color: '#8e8e8e',
    lineHeight: READING_LINE_HEIGHT,
    margin: 0,
    paddingLeft: 0,
    textAlign: 'left',
  },
  dialogueText: {
    fontFamily: SERIF,
    fontStyle: 'normal',
    fontSize: READING_SIZE,
    lineHeight: READING_LINE_HEIGHT,
    color: '#b9b9b9',
    paddingLeft: '6px',
    margin: 0,
  },
}

const THOUGHT_WRAPPER_STYLE: React.CSSProperties = {
  padding: '2px 8px 2px 0px',
  margin: '2px 0',
}

const CHOICES_OVERFLOW_MASK = 'linear-gradient(to bottom, black 0%, black calc(100% - 36px), transparent 100%)'

const DESCRIPTION_WRAPPER_STYLE: React.CSSProperties = {
  padding: '4px 0px',
  margin: '4px 0',
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

// Suzerain-style layout, identical on every viewport: the week map stays in view
// on both sides and the conversation runs in a solid column in the centre, with
// the people in the meeting as round portraits down its left edge.
const DESKTOP_COLUMN_WIDTH = 'clamp(218px, 36.3vw, 1094px)'
/** Smallest gap in px kept between the portrait stack and the top or bottom of the column. */
const RAIL_MIN_TOP = 8
/** How close (px) to the bottom the history must be for a resize to keep it pinned there. */
const HISTORY_BOTTOM_TOLERANCE_PX = 24
/** Medallion sizes, read by PortraitRail's column layout from the panel root. */
const RAIL_SIZE_VARS: React.CSSProperties = {
  ['--rail-small' as string]: 'clamp(24px, 4.2vw, 126px)',
  ['--rail-big' as string]: 'clamp(48px, 8.4vw, 252px)',
}
/** Choice card text sizes, read by ChoiceCard via var(--choice-font) / var(--choice-hint-font). */
const DESKTOP_CHOICE_VARS: React.CSSProperties = {
  ['--choice-font' as string]: 'clamp(6.5px, 0.95vw, 29px)',
  ['--choice-hint-font' as string]: 'clamp(6px, 0.85vw, 26px)',
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
  history, activeSegment, activeText, showCursor,
  choices, showChoices, sceneDone, allDone, segmentDone,
  onChoice, onAdvanceQueue, continueLabel,
  monologueText,
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
  const viewportMode = useViewportMode()

  // Per-portrait image error tracking — half-implemented; portrait fallback uses img/initials instead
  // const [portraitErrors, setPortraitErrors] = useState<Record<string, boolean>>({})

  const panelInnerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const railAnchorRef = useRef<HTMLDivElement>(null)
  // Top of the portrait stack in px, measured so its bottom sits on the newest line.
  // null until the first measurement; the anchor then falls back to 19vh.
  const [railTop, setRailTop] = useState<number | null>(null)

  // Keeps the portrait stack's bottom level with the newest line of text. The
  // stack is clamped to the visible part of the history and to the panel height.
  const measureRail = useCallback(() => {
    const panel = panelRef.current
    const scroller = historyRef.current
    const rail = railAnchorRef.current
    if (!panel || !scroller || !rail) return
    const entries = panel.querySelectorAll<HTMLElement>('[data-entry]')
    const last = entries[entries.length - 1]
    if (!last) return

    const panelTop = panel.getBoundingClientRect().top
    const visibleBottom = scroller.getBoundingClientRect().bottom - panelTop
    const lastBottom = Math.min(last.getBoundingClientRect().bottom - panelTop, visibleBottom)
    const railHeight = rail.getBoundingClientRect().height
    const top = Math.max(
      RAIL_MIN_TOP,
      Math.min(lastBottom - railHeight, panel.clientHeight - railHeight - RAIL_MIN_TOP),
    )
    const rounded = Math.round(top)
    setRailTop(prev => (prev !== null && Math.abs(prev - rounded) < 1 ? prev : rounded))
  }, [])

  // Delay advance button appearance after scene ends (smoother transition).
  // Any change of sceneDone hides the button again; it reappears 800ms after the scene ends.
  const [prevSceneDone, setPrevSceneDone] = useState(sceneDone)
  if (prevSceneDone !== sceneDone) {
    setPrevSceneDone(sceneDone)
    setAdvanceReady(false)
  }
  useEffect(() => {
    if (!sceneDone) return
    const t = setTimeout(() => setAdvanceReady(true), 800)
    return () => clearTimeout(t)
  }, [sceneDone])

  // When choices area is about to show, check for monologue
  const shouldShowChoices = showChoices && !sceneDone
  const shouldShowMonologue = shouldShowChoices && !!monologueText && !monologueDone
  const actualShowChoices = shouldShowChoices && (!monologueText || monologueDone)

  // Re-measure the portrait stack whenever the newest line changes: a new history
  // entry, typing growth, choices appearing, or the history scrolling / window resizing.
  useLayoutEffect(() => {
    measureRail()
    const scroller = historyRef.current
    scroller?.addEventListener('scroll', measureRail)
    window.addEventListener('resize', measureRail)
    return () => {
      scroller?.removeEventListener('scroll', measureRail)
      window.removeEventListener('resize', measureRail)
    }
  }, [measureRail, history.length, activeSegment, activeText.length, actualShowChoices])

  // Pins the history to its newest line and re-measures the portrait stack.
  const pinHistoryToBottom = useCallback(() => {
    const scroller = historyRef.current
    if (!scroller) return
    scroller.scrollTop = scroller.scrollHeight
    measureRail()
  }, [measureRail])

  // Choices appearing shrink the history without adding a line, so pin it again
  // to keep the newest line above them.
  useLayoutEffect(() => {
    pinHistoryToBottom()
  }, [pinHistoryToBottom, actualShowChoices, history.length, activeText.length])

  // The history's own size changes (choices, reactions, window resizes) should
  // keep the newest line visible, but only for a reader already at the bottom.
  const isSceneVisible = phase === 'scene' && !!currentScene
  const wasAtBottomRef = useRef(true)
  useEffect(() => {
    const scroller = historyRef.current
    if (!scroller) return
    const onScroll = () => {
      wasAtBottomRef.current =
        scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight <= HISTORY_BOTTOM_TOLERANCE_PX
    }
    scroller.addEventListener('scroll', onScroll)
    let observer: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        if (wasAtBottomRef.current) pinHistoryToBottom()
      })
      observer.observe(scroller)
    }
    return () => {
      scroller.removeEventListener('scroll', onScroll)
      observer?.disconnect()
    }
  }, [pinHistoryToBottom, isSceneVisible])

  // Reset monologue state when new scene comes
  const [prevMonologueText, setPrevMonologueText] = useState(monologueText)
  if (prevMonologueText !== monologueText) {
    setPrevMonologueText(monologueText)
    setMonologueDone(false)
    setMonologueFading(false)
    setMonologueVisible(false)
  }

  // Hide the monologue as soon as it should no longer show
  if (!shouldShowMonologue && monologueVisible) {
    setMonologueVisible(false)
  }

  // Fade in monologue after a brief pause
  useEffect(() => {
    if (!shouldShowMonologue || monologueVisible) return
    const t = setTimeout(() => setMonologueVisible(true), 500)
    return () => clearTimeout(t)
  }, [shouldShowMonologue, monologueVisible])

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
          // With reactions to show, the fade runs alongside them
          setChoicePhase(activeReactions ? 'showing_reactions' : 'fading')
        }, 200)
        break

      case 'fading':
        timer = setTimeout(() => {
          setFadingId(null)
          setSelectedId(null)
          setChoicePhase('done')
        }, 800)
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
  const [prevChoices, setPrevChoices] = useState(choices)
  if (prevChoices !== choices) {
    setPrevChoices(choices)
    setSelectedId(null)
    setFadingId(null)
    setActiveReactions(null)
    setReactionsFading(false)
    setChoicePhase('idle')
    setHoveredChoiceId(null)
  }
  useEffect(() => {
    choiceProcessedRef.current.clear()
  }, [choices])

  // Safety: force-reset choice phase when scene transitions to done.
  // Guards against any edge case where the animation sequencer remains non-idle
  // after processChoice sets sceneDone but the choices prop hasn't changed yet.
  const forceIdle = sceneDone && choicePhase !== 'idle'
  if (forceIdle) {
    setSelectedId(null)
    setFadingId(null)
    setActiveReactions(null)
    setReactionsFading(false)
    setChoicePhase('idle')
  }
  useEffect(() => {
    if (sceneDone) choiceProcessedRef.current.clear()
  }, [sceneDone])

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

  // Everyone who has spoken so far (never the player), speaking now first
  const participants = useMemo(() => sceneParticipants(history, activeSegment), [history, activeSegment])

  // Speaker runs. A run is broken only by dialogue from a different speaker;
  // descriptions and internal thoughts inside a turn do not restart it, so a
  // speaker's name renders once at the top of the run and never per line.
  const labelledEntryIds = new Set<string>()
  let lastSpokenSpeaker: string | null = null
  for (const entry of history) {
    if (entry.type !== 'dialogue' && entry.type !== 'player_spoken') continue
    const speaker = entry.characterId ?? ''
    if (speaker !== lastSpokenSpeaker) {
      labelledEntryIds.add(entry.id)
      lastSpokenSpeaker = speaker
    }
  }

  const activeType = activeSegment ? effectiveSegmentType(activeSegment.type) : null
  const isActiveContinuation = activeType === 'dialogue' && lastSpokenSpeaker === (activeSegment?.character ?? '')
  // The active line opens a new speaker run, so it carries the name label.
  const anchorIsActive = activeType === 'dialogue' && !isActiveContinuation

  // Plain "…" line in place of the old uppercase button. The routing text
  // ("Proceed to Evening Review", "Continue to Next Meeting (2/3)") is kept;
  // only the trailing arrow is swapped for an ellipsis.
  const continueText = `${continueLabel.replace(/\s*→\s*$/, '')}…`

  // The conversation column: solid, over the map, a fixed width with auto margins
  // between left:0 and right:0.6vw, so it sits 0.3vw left of centre as in the
  // Suzerain reference. The same column on every viewport;
  // data-layout alone reports which mode is active.
  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: Z.scene,
    pointerEvents: 'all',
    display: 'flex',
    flexDirection: 'column',
    background: COLUMN_BG,
    boxShadow: '0 0 60px rgba(0,0,0,0.85)',
    animation: 'panel-fade-in 0.6s ease-out forwards',
    ...RAIL_SIZE_VARS,
    ...DESKTOP_CHOICE_VARS,
    top: 0, bottom: 0, left: 0, right: '0.6vw',
    width: DESKTOP_COLUMN_WIDTH, margin: '0 auto',
    overflow: 'visible',
  }
  if (phase !== 'scene') return null

  return (
    <>
      {currentScene && (
      <>
      {/* Dim the map a little so the column reads; the map stays in view */}
      <div aria-hidden="true" data-testid="scene-map-scrim" style={{ position: 'fixed', inset: 0, zIndex: Z.sceneBackdrop, background: 'rgba(6,5,4,0.4)', pointerEvents: 'none' }} />
      <div ref={panelRef} data-layout={viewportMode} style={panelStyle}>
        {/* Medallion centres sit on the column's left border (translateX(-100%)). */}
        <div
          ref={railAnchorRef}
          data-testid="portrait-rail-anchor"
          data-rail-top={railTop ?? ''}
          style={{
            position: 'absolute',
            top: railTop === null ? '19vh' : `${railTop}px`,
            transition: 'top 0.35s cubic-bezier(0.16,1,0.3,1)',
            left: 'calc(var(--rail-small) / 2)',
            transform: 'translateX(-100%)',
            transformOrigin: 'top right',
            zIndex: Z.sceneTop,
          }}
        >
          <PortraitRail ids={participants.ids} currentId={participants.currentId} layout="column" />
        </div>

        {/* Scroll-to-top chevron */}
        <button
          type="button"
          aria-label="Scroll to top of conversation"
          onClick={() => historyRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
          onMouseEnter={() => setIsChevronHovered(true)}
          onMouseLeave={() => setIsChevronHovered(false)}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '22px',
            height: '22px',
            padding: 0,
            borderRadius: '50%',
            background: '#000',
            border: isChevronHovered ? '1.5px solid #ffeac1' : '1.5px solid #c9a84c',
            boxShadow: isChevronHovered ? '0 0 12px rgba(201,168,76,0.35)' : 'none',
            color: '#ffeac1',
            zIndex: Z.sceneTop,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          }}
        >
          <svg
            width="12"
            height="12"
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
            padding: '22px 30px 18px 38px',
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
          }}
        >
          {history.map((entry, index) => {
            const isNewest = !activeSegment && index === history.length - 1
            const newestColor = isNewest ? { color: NEWEST_TEXT_COLOR } : undefined
            const showLabel = labelledEntryIds.has(entry.id)
            const isPlayer = entry.type === 'player_spoken'
            const labelText = isPlayer ? 'YOU' : (entry.characterName ?? charName(entry.characterId ?? ''))

            return (
              <div
                key={entry.id}
                data-entry
                style={COLUMN_TEXT_STYLES.entryRow}
              >
                {/* Text content */}
                <div style={{ flex: 1 }}>
                  {/* Speaker name — uppercase orange "NAME :" (red for the player) */}
                  {showLabel && (
                    <div
                      style={{
                        ...COLUMN_TEXT_STYLES.speakerLabel,
                        color: isPlayer ? PLAYER_NAME_COLOR : NPC_LABEL_COLOR,
                      }}
                    >
                      <SpeakerLabelText name={labelText} />
                    </div>
                  )}
                  {/* internal_thought / monologue — no label */}
                  {entry.type === 'internal_thought' && (
                    <div style={THOUGHT_WRAPPER_STYLE}>
                      <p style={{ ...COLUMN_TEXT_STYLES.thoughtText, ...newestColor }}>
                        {renderWithEntities(entry.text, true)}
                      </p>
                    </div>
                  )}

                  {/* description / narrative — left-aligned, faded, no label */}
                  {(entry.type === 'description' || entry.type === 'narrative') && (
                    <div style={DESCRIPTION_WRAPPER_STYLE}>
                      <p style={{ ...COLUMN_TEXT_STYLES.descriptionText, ...newestColor }}>
                        {renderWithCodexLinks(entry.text)}
                      </p>
                    </div>
                  )}

                  {/* dialogue / player_spoken — character label + quoted text */}
                  {(entry.type === 'dialogue' || entry.type === 'player_spoken') && (
                    <div style={{ ...COLUMN_TEXT_STYLES.dialogueText, ...newestColor }}>
                      {'"'}{renderWithCodexLinks(entry.text)}{'"'}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Active segment typing */}
          {activeSegment && (
            <div data-entry style={COLUMN_TEXT_STYLES.entryRow}>
              <div style={{ flex: 1 }}>
                {(() => {
                  return (
                    <>
                      {anchorIsActive && (
                        <div
                          style={{
                            ...COLUMN_TEXT_STYLES.speakerLabel,
                            color: NPC_LABEL_COLOR,
                          }}
                        >
                          <SpeakerLabelText name={charName(activeSegment.character ?? '')} />
                        </div>
                      )}
                      {/* internal_thought / monologue — no label */}
                      {activeType === 'internal_thought' && (
                        <div style={THOUGHT_WRAPPER_STYLE}>
                          <p style={{ ...COLUMN_TEXT_STYLES.thoughtText, color: NEWEST_TEXT_COLOR }}>
                            {renderWithEntities(activeText, true)}
                            {showCursor && <span className="typewriter-cursor" />}
                          </p>
                        </div>
                      )}

                      {/* description — left-aligned, faded, no label */}
                      {activeType === 'description' && (
                        <div style={DESCRIPTION_WRAPPER_STYLE}>
                          <p style={{ ...COLUMN_TEXT_STYLES.descriptionText, color: NEWEST_TEXT_COLOR }}>
                            {renderWithCodexLinks(activeText)}
                            {showCursor && <span className="typewriter-cursor" />}
                          </p>
                        </div>
                      )}

                      {/* dialogue — character label + quoted text */}
                      {activeType === 'dialogue' && (
                        <div style={{ ...COLUMN_TEXT_STYLES.dialogueText, color: NEWEST_TEXT_COLOR }}>
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
              gap: '7px',
              padding: '10px 0 8px',
              // the reference boxes start a little left of the speaker labels
              margin: '0 2px 0 -5px',
              maxHeight: '40vh',
              overflowY: 'auto',
              overflowX: 'hidden',
              // soft fade at the bottom edge when choices overflow (no text cue)
              ...(choicesOverflow ? { maskImage: CHOICES_OVERFLOW_MASK, WebkitMaskImage: CHOICES_OVERFLOW_MASK } : {}),
            }}
          >
            {choices.map((choice, i) => {
              // Same precedence as before: selected > fading > dimmed > hovered.
              const state: ChoiceCardState =
                selectedId === choice.id ? 'selected'
                : fadingId === choice.id ? 'fading'
                : fadingId ? 'dimmed'
                : hoveredChoiceId === choice.id && selectedId === null ? 'hovered'
                : 'idle'
              return (
                <ChoiceCard
                  key={choice.id ?? i}
                  index={i}
                  text={choice.text}
                  hint={choice.tooltip}
                  state={state}
                  onSelect={() => handleChoice(choice.id)}
                  onHoverChange={(hovered) => {
                    if (!hovered) setHoveredChoiceId(null)
                    else if (selectedId === null && fadingId === null) setHoveredChoiceId(choice.id)
                  }}
                />
              )
            })}
          </div>
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
