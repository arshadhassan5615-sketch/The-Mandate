import { useRef, useEffect, useCallback, useState, useMemo } from 'react'
import { useNarrativeStore } from '../stores/narrativeStore'
import { useGameStore } from '../stores/gameStore'
import { useWeekStore } from '../stores/weekStore'
import { useSettingsStore } from '../stores/settingsStore'
import { recurringOpeningNodes } from '../engine/NarrativeEngine'
import { displayChoices } from '../engine/choiceLocks'
import type { NarrativeSegment } from '../types/narrative'
import { useDialogueFlow } from '../hooks/useDialogueFlow'
import { playTypewriterKeyThrottled, startAmbient } from '../engine/audioEngine'
import { getCharacterColor } from './portraits/CharacterPortraits'
import ConversationPanel from './narrative/ConversationPanel'
import MemoryLine from './narrative/MemoryLine'
import { memoryTextFor } from './narrative/memoryLineText'
import ReadingModeBadge from './narrative/ReadingModeBadge'
import { autoAdvanceDelayMs, hasReadScene, markSceneRead } from '../engine/readRegistry'

interface HistoryEntry {
  id: string
  type: 'description' | 'dialogue' | 'narrative' | 'internal_thought' | 'player_spoken'
  characterId?: string
  characterName?: string
  characterColor?: string
  text: string
}

// Skip mode advances one step per tick while Ctrl is held on a scene already read.
const SKIP_INTERVAL_MS = 60

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
}

function charName(id: string): string {
  return CHAR_NAMES[id] ?? id.replace(/_/g, ' ')
}

// The conversation history: the revealed prefix of the scene's segments, shaped as ConversationPanel entries.
function buildHistory(segments: readonly NarrativeSegment[], revealedCount: number, sceneId: string): HistoryEntry[] {
  return segments.slice(0, revealedCount).map((seg, i): HistoryEntry => {
    const effectiveType =
      seg.type === 'monologue' ? 'internal_thought' :
      seg.type === 'narrative' ? 'description' :
      seg.type
    return {
      id: `${sceneId}-rev-${i}`,
      type: effectiveType,
      characterId: seg.character,
      characterName: seg.character ? charName(seg.character) : undefined,
      characterColor: seg.character ? getCharacterColor(seg.character) : undefined,
      text: seg.text,
    }
  })
}

// Reading pauses when either of two things is true: a dialog is open outside the conversation
// column (a paper panel beside it, a map menu, the scene intro), or the column is covered at its
// centre by an open panel (a brief, a modal) so the reader cannot see the line being advanced.
// With no column mounted, or no elementFromPoint (jsdom), the centre check counts as uncovered.
function isReadingUninterrupted(column: HTMLElement | null): boolean {
  const dialogOutside = Array.from(document.querySelectorAll('[role="dialog"]'))
    .some(d => !column?.contains(d))
  if (dialogOutside) return false
  if (!column || typeof document.elementFromPoint !== 'function') return true
  const rect = column.getBoundingClientRect()
  const top = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
  return top === null || column.contains(top)
}

export default function NarrativeScene() {
  const { currentScene, sceneDone, activeFlags, processChoice, activeSegmentId, sceneLoadCount } = useNarrativeStore()
  const gameState = useGameStore()
  const currentWeek = useGameStore(s => s.currentWeek)
  const { sceneQueue, currentQueueIndex, advanceQueue, returnToMap } = useWeekStore()
  const radioOpen = useWeekStore(s => s.radioOpen)
  const memoryHints = useSettingsStore(s => s.memoryHints)
  const autoAdvance = useSettingsStore(s => s.autoAdvance)
  const toggleAutoAdvance = useSettingsStore(s => s.toggleAutoAdvance)
  // Tied to the week it was made in, so a recurring weekly scene never replays an old line.
  // It is not tied to a scene: the line follows the choice into a chained scene.
  const [memory, setMemory] = useState<{ key: number; text: string; week: number } | null>(null)
  // The conversation column, so the auto-advance and skip timers can tell whether reading is interrupted.
  const columnRef = useRef<HTMLDivElement>(null)

  const isEmergency = currentScene?.type === 'emergency'
  // Round B2 STEP 1 — inject the recurring opening topics only while no
  // segment is active. After a choice moves into a segment, the hub narrative
  // (already swapped into currentScene.narrative by processChoice) must not
  // get the opening topics re-appended (the D1 re-feed). Rule lives in
  // recurringOpeningNodes; this call site only applies it.
  const atSceneRoot = activeSegmentId == null
  const segments = useMemo(() => {
    const baseSegments = currentScene?.narrative ?? []
    const injected = recurringOpeningNodes(currentScene, gameState, activeFlags, atSceneRoot)
    return [...baseSegments, ...injected]
  }, [atSceneRoot, currentScene, gameState, activeFlags])

  const {
    revealedSegments,
    activeSegment,
    activeText,
    segmentDone,
    allDone,
    speakingCharacter,
    advance,
  } = useDialogueFlow(segments, isEmergency ? 2.5 : 1, `${currentScene?.id ?? ''}#${sceneLoadCount}`)

  // Timers read advance through this ref, so they are not restarted every time its identity changes.
  const advanceRef = useRef(advance)
  useEffect(() => {
    advanceRef.current = advance
  })

  const prevLen = useRef(0)
  const totalLen = revealedSegments.reduce((a, s) => a + s.text.length, 0) + activeText.length
  useEffect(() => {
    if (totalLen > prevLen.current) playTypewriterKeyThrottled()
    prevLen.current = totalLen
  }, [totalLen])

  useEffect(() => {
    startAmbient(currentScene?.type === 'personal' ? 'personal' : undefined)
  }, [currentScene?.id, currentScene?.type])

  const shownChoices = currentScene ? displayChoices(currentScene.choices ?? [], gameState, activeFlags) : []
  const choices = shownChoices.map(d => d.choice)
  // Stat-locked choices stay visible but cannot be picked by click or number key.
  const lockedReasons: Record<string, string> = Object.fromEntries(
    shownChoices.filter(d => d.lockedReason).map(d => [d.choice.id, d.lockedReason as string]),
  )

  // Shows the "will remember that" line for a choice that moves someone's standing.
  // Called before processChoice on both the click and number-key paths. The line
  // follows the choice into a chained scene: MemoryLine clears itself after its timer.
  const announceMemory = useCallback((id: string) => {
    const choice = currentScene?.choices?.find(c => c.id === id)
    const text = memoryTextFor(choice, currentScene?.characters ?? [], memoryHints)
    if (text) setMemory({ key: Date.now(), text, week: currentWeek })
  }, [currentScene, memoryHints, currentWeek])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null
    const tag = target?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

    const isEditable = target?.isContentEditable === true
    if ((e.key === 'a' || e.key === 'A') && !e.ctrlKey && !e.metaKey && !e.altKey && !e.repeat && !isEditable) {
      toggleAutoAdvance()
      return
    }

    if ((e.key === ' ' || e.key === 'Enter') && !sceneDone && !allDone) {
      e.preventDefault()
      advance()
      return
    }

    if (allDone && !sceneDone) {
      const num = parseInt(e.key)
      if (num >= 1 && num <= 5 && num <= choices.length) {
        const pressedId = choices[num - 1].id
        if (Object.hasOwn(lockedReasons, pressedId)) return
        e.preventDefault()
        announceMemory(pressedId)
        processChoice(pressedId)
      }
    }
  }, [advance, sceneDone, allDone, choices, lockedReasons, processChoice, announceMemory, toggleAutoAdvance])

  const handleProcessChoice = useCallback((id: string) => {
    if (import.meta.env.DEV) console.log(
      '[NarrativeScene] choice click | sceneId:', currentScene?.id,
      '| choiceId:', id,
      '| nextNode:', (currentScene?.choices ?? []).find(c => c.id === id)?.nextNodeId,
      '| nextSegment:', (currentScene?.choices ?? []).find(c => c.id === id)?.nextSegment,
    )
    announceMemory(id)
    try {
      processChoice(id)
    } catch (e) {
      console.error(
        '[NarrativeScene] processChoice THREW | sceneId:', currentScene?.id,
        '| choiceId:', id,
        '| error:', e,
      )
      // Unstick the game: clear any loading state and mark scene as done
      // so the player can advance to the next event instead of being frozen.
      useNarrativeStore.setState({ sceneDone: true })
    }
  }, [currentScene, processChoice, announceMemory])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Ctrl held = skip. Listened to on the window so a keyup is never missed, even after typing elsewhere.
  const ctrlHeldRef = useRef(false)
  const [ctrlHeld, setCtrlHeld] = useState(false)
  useEffect(() => {
    const setHeld = (held: boolean) => {
      ctrlHeldRef.current = held
      setCtrlHeld(held)
    }
    const handleCtrlDown = (e: KeyboardEvent) => { if (e.key === 'Control') setHeld(true) }
    const handleCtrlUp = (e: KeyboardEvent) => { if (e.key === 'Control') setHeld(false) }
    const handleBlur = () => setHeld(false)
    window.addEventListener('keydown', handleCtrlDown)
    window.addEventListener('keyup', handleCtrlUp)
    window.addEventListener('blur', handleBlur)
    return () => {
      window.removeEventListener('keydown', handleCtrlDown)
      window.removeEventListener('keyup', handleCtrlUp)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  // Skip only fast-forwards scenes read before, and stops at choices (allDone) or the scene end.
  const currentSceneId = currentScene?.id
  const sceneWasRead = currentSceneId != null && hasReadScene(currentSceneId)
  const skipping = ctrlHeld && !allDone && !sceneDone && sceneWasRead

  // Skip ticks do nothing while reading is interrupted (an open dialog or a panel covering the column).
  useEffect(() => {
    if (!skipping) return
    const id = setInterval(() => {
      if (ctrlHeldRef.current && isReadingUninterrupted(columnRef.current)) advanceRef.current()
    }, SKIP_INTERVAL_MS)
    return () => clearInterval(id)
  }, [skipping])

  // Reading pause: once a line has finished typing, move on by itself. Choices are never auto-picked.
  // While reading is interrupted the timer re-arms for the same delay instead of advancing.
  const finishedLineText = activeSegment?.text
  useEffect(() => {
    if (!autoAdvance || !segmentDone || allDone || sceneDone || finishedLineText == null) return
    const delayMs = autoAdvanceDelayMs(finishedLineText)
    let timerId: ReturnType<typeof setTimeout>
    const tick = () => {
      if (isReadingUninterrupted(columnRef.current)) advanceRef.current()
      else timerId = setTimeout(tick, delayMs)
    }
    timerId = setTimeout(tick, delayMs)
    return () => clearTimeout(timerId)
  }, [autoAdvance, segmentDone, allDone, sceneDone, finishedLineText])

  useEffect(() => {
    if (sceneDone && currentSceneId) markSceneRead(currentSceneId)
  }, [sceneDone, currentSceneId])

  // Auto-advance queue when scene is done and returnToMap is true (no button click needed)
  useEffect(() => {
    if (sceneDone && returnToMap) {
      const t = setTimeout(() => {
        const store = useWeekStore.getState()
        store.advanceQueue()
      }, 800)
      return () => clearTimeout(t)
    }
  }, [sceneDone, returnToMap])

  const isLastScene = currentQueueIndex >= sceneQueue.length - 1
  const continueLabel = isLastScene
    ? (returnToMap ? '' : 'Proceed to Evening Review →')
    : `Continue to Next Meeting (${currentQueueIndex + 2}/${sceneQueue.length}) →`

  const sceneCharacters = currentScene?.characters ?? []
  // History is the revealed prefix of the segments, so it resets with them and needs no effect.
  // ConversationPanel scrolls whenever its identity changes, so the array is held in state under a
  // content key: a store update that leaves the revealed lines unchanged keeps the same array.
  const revealedCount = revealedSegments.length
  const historySceneId = currentScene?.id ?? 'scene'
  const historyKey = `${historySceneId}|${revealedCount}|` + segments.slice(0, revealedCount)
    .map(s => `${s.type}\u0001${s.character ?? ''}\u0001${s.text}`)
    .join('\u0002')
  const [historyState, setHistoryState] = useState<{ key: string; entries: HistoryEntry[] }>(() => ({
    key: historyKey,
    entries: buildHistory(segments, revealedCount, historySceneId),
  }))
  const isHistoryCurrent = historyState.key === historyKey
  const history = isHistoryCurrent ? historyState.entries : buildHistory(segments, revealedCount, historySceneId)
  // Adjusting state during render: React re-runs this render straight away and reads back the same array.
  if (!isHistoryCurrent) setHistoryState({ key: historyKey, entries: history })
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const emergencyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Emergency safety net — if still stuck after 10s, force to review regardless
  useEffect(() => {
    if (!currentScene) {
      emergencyTimeoutRef.current = setTimeout(() => {
        const store = useWeekStore.getState()
        // The radio address is its own screen, not a story: it has no scene to load
        if (store.phase === 'scene' && !store.radioOpen && !useNarrativeStore.getState().currentScene) {
          console.error('[NarrativeScene] EMERGENCY: 10s timeout — forcing review phase')
          useWeekStore.setState({ phase: store.returnToMap || store.agendaPool?.length > 0 ? 'map' : 'review', transitionLabel: '' })
        }
      }, 10000)
    }
    return () => {
      if (emergencyTimeoutRef.current) clearTimeout(emergencyTimeoutRef.current)
    }
  // Re-arm when the radio closes: the radio was skipped above, so the timer
  // must start again once it is gone, or an empty scene screen never recovers.
  }, [currentScene, radioOpen])

  // Timeout fallback — if scene doesn't load within 5s, try to recover.
  // Uses Promise.race to add an async guard around the synchronous load cycle.
  // Skip if radio or cabinet meeting is open (they are the "current scene").
  useEffect(() => {
    if (!currentScene) {
      const timeoutPromise = new Promise<void>((resolve) => {
        loadTimeoutRef.current = setTimeout(resolve, 5000)
      })

      const loadPromise = new Promise<void>((resolve) => {
        const checkInterval = setInterval(() => {
          const narrativeState = useNarrativeStore.getState()
          if (narrativeState.currentScene) {
            clearInterval(checkInterval)
            resolve()
          }
        }, 100)
      })

      Promise.race([timeoutPromise, loadPromise]).then(() => {
        if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current)
        const store = useWeekStore.getState()
        const narrativeState = useNarrativeStore.getState()

        if (store.phase !== 'scene') return
        if (store.showCabinetMeeting || store.radioOpen) return
        if (narrativeState.currentScene) return

        console.error(
          '[NarrativeScene] SCENE LOAD TIMEOUT (5s)',
          '\n  phase:', store.phase,
          '\n  queue:', store.sceneQueue.map(s => s.sceneId).join(', '),
          '\n  index:', store.currentQueueIndex,
          '\n  transitionLabel:', store.transitionLabel,
        )

        if (store.transitionLabel) {
          console.warn('[NarrativeScene] Clearing stuck transitionLabel:', store.transitionLabel)
          useWeekStore.setState({ transitionLabel: '' })
        }

        if (store.sceneQueue.length > 0 && store.currentQueueIndex < store.sceneQueue.length - 1) {
          console.error('[NarrativeScene] Scene load timeout — advancing queue')
          store.advanceQueue()
        } else {
          console.error('[NarrativeScene] Scene load timeout with empty/exhausted queue — force-transitioning')
          useWeekStore.setState({ phase: store.returnToMap || store.agendaPool?.length > 0 ? 'map' : 'review', transitionLabel: '' })
        }
      })
    }
    return () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current)
    }
  }, [currentScene])

  if (!currentScene) {
    if (import.meta.env.DEV) console.log('NarrativeScene: NO SCENE LOADED',
      'sceneQueue:', sceneQueue.map(s => s.sceneId),
      'queueIndex:', currentQueueIndex)
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(10,9,8,0.5)', pointerEvents: 'none',
      }}>
        <p style={{ color: 'var(--muted)', fontFamily: "'Special Elite', monospace", fontSize: '0.8rem' }}>
          Loading scene...
        </p>
      </div>
    )
  }

  return (
    <>
      {isEmergency && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 500,
          background: 'rgba(180,30,20,0.5)',
          pointerEvents: 'none',
          animation: 'flash-emergency 1.8s ease forwards',
        }} />
      )}

      <ConversationPanel
        columnRef={columnRef}
        sceneTitle={currentScene.title}
        sceneLocation={currentScene.location}
        sceneType={currentScene.type}
        currentWeek={currentWeek}
        sceneCharacters={sceneCharacters}
        history={history}
        activeSegment={activeSegment ?? null}
        activeText={activeText}
        showCursor={!segmentDone}
        choices={choices}
        lockedReasons={lockedReasons}
        showChoices={allDone && !sceneDone}
        sceneDone={sceneDone}
        allDone={allDone}
        segmentDone={segmentDone}
        onAdvance={advance}
        onChoice={handleProcessChoice}
        onAdvanceQueue={advanceQueue}
        continueLabel={continueLabel}
        speakingCharacter={speakingCharacter}
        monologueText={currentScene?.monologue}
      />

      <ReadingModeBadge mode={skipping ? 'skip' : autoAdvance ? 'auto' : null} />

      {memory && memory.week === currentWeek && (
        <MemoryLine
          key={memory.key}
          text={memory.text}
          onDone={() => setMemory(null)}
        />
      )}

      {/* Save, Briefs, Notes and the rest live in the command bar */}
    </>
  )
}
