import { useRef, useEffect, useCallback, useState, useMemo } from 'react'
import { useNarrativeStore } from '../stores/narrativeStore'
import { useGameStore } from '../stores/gameStore'
import { useWeekStore } from '../stores/weekStore'
import { getAvailableChoices } from '../engine/NarrativeEngine'
import { useDialogueFlow } from '../hooks/useDialogueFlow'
import { useSettingsStore } from '../stores/settingsStore'
import { useCodexStore } from '../stores/codexStore'
import { playTypewriterKeyThrottled, startAmbient } from '../engine/audioEngine'
import { getCharacterColor } from './portraits/CharacterPortraits'
import { computeDinnerContext } from '../engine/FamilyDinnerEngine'
import { computeBriefingContext } from '../engine/IntelligenceBriefingEngine'
import ConversationPanel from './narrative/ConversationPanel'

interface HistoryEntry {
  id: string
  type: 'description' | 'dialogue' | 'narrative' | 'internal_thought' | 'player_spoken'
  characterId?: string
  characterName?: string
  characterColor?: string
  text: string
}

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

export default function NarrativeScene() {
  const { currentScene, sceneDone, activeFlags, processChoice, activeSegmentId } = useNarrativeStore()
  const gameState = useGameStore()
  const currentWeek = useGameStore(s => s.currentWeek)
  const { sceneQueue, currentQueueIndex, advanceQueue, returnToMap } = useWeekStore()
  const setSaveMenuOpen = useSettingsStore(s => s.setSaveMenuOpen)
  const setCharacterMapOpen = useSettingsStore(s => s.setCharacterMapOpen)
  const setNotepadOpen = useSettingsStore(s => s.setNotepadOpen)
  const openCodex = useCodexStore(s => s.openCodex)

  const baseSegments = currentScene?.narrative ?? []
  const isEmergency = currentScene?.type === 'emergency'
  const segments = useMemo(() => {
    if (currentScene?.id === 'family_dinner_recurring' && currentScene.segments) {
      const dinnerCtx = computeDinnerContext(gameState, activeFlags)
      const injected = dinnerCtx.injectedSegments
        .filter(id => currentScene.segments![id])
        .flatMap(id => currentScene.segments![id].narrative ?? [])
      return [...baseSegments, ...injected]
    }
    if (currentScene?.id === 'intelligence_briefing_recurring' && currentScene.segments) {
      const briefingCtx = computeBriefingContext(gameState, activeFlags)
      const injected = briefingCtx.injectedSegments
        .filter(id => currentScene.segments![id])
        .flatMap(id => currentScene.segments![id].narrative ?? [])
      return [...baseSegments, ...injected]
    }
    return baseSegments
  }, [currentScene?.id, currentScene?.segments, baseSegments, gameState, activeFlags])

  const {
    revealedSegments,
    activeSegment,
    activeText,
    segmentDone,
    allDone,
    speakingCharacter,
    advance,
  } = useDialogueFlow(segments, isEmergency ? 2.5 : 1)

  const prevLen = useRef(0)
  const totalLen = revealedSegments.reduce((a, s) => a + s.text.length, 0) + activeText.length
  useEffect(() => {
    if (totalLen > prevLen.current) playTypewriterKeyThrottled()
    prevLen.current = totalLen
  }, [totalLen])

  useEffect(() => {
    startAmbient(currentScene?.type === 'personal' ? 'personal' : undefined)
  }, [currentScene?.id, currentScene?.type])

  const choices = currentScene ? getAvailableChoices(currentScene, gameState, activeFlags) : []

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

    if ((e.key === ' ' || e.key === 'Enter') && !sceneDone && !allDone) {
      e.preventDefault()
      advance()
      return
    }

    if (allDone && !sceneDone) {
      const num = parseInt(e.key)
      if (num >= 1 && num <= 5 && num <= choices.length) {
        e.preventDefault()
        processChoice(choices[num - 1].id)
      }
    }
  }, [advance, sceneDone, allDone, choices, processChoice])

  const handleProcessChoice = useCallback((id: string) => {
    if (import.meta.env.DEV) console.log(
      '[NarrativeScene] choice click | sceneId:', currentScene?.id,
      '| choiceId:', id,
      '| nextNode:', (currentScene?.choices ?? []).find(c => c.id === id)?.nextNodeId,
      '| nextSegment:', (currentScene?.choices ?? []).find(c => c.id === id)?.nextSegment,
    )
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
  }, [currentScene, processChoice])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

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

  const [history, setHistory] = useState<HistoryEntry[]>([])
  const prevRevealed = useRef(0)
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const emergencyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Emergency safety net — if still stuck after 10s, force to review regardless
  useEffect(() => {
    if (!currentScene) {
      emergencyTimeoutRef.current = setTimeout(() => {
        const store = useWeekStore.getState()
        if (store.phase === 'scene' && !useNarrativeStore.getState().currentScene) {
          console.error('[NarrativeScene] EMERGENCY: 10s timeout — forcing review phase')
          useWeekStore.setState({ phase: store.returnToMap || store.agendaPool?.length > 0 ? 'map' : 'review', transitionLabel: '' })
        }
      }, 10000)
    }
    return () => {
      if (emergencyTimeoutRef.current) clearTimeout(emergencyTimeoutRef.current)
    }
  }, [currentScene])

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
        if (store.showCabinetMeeting) return
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

  // Reset conversation history when a new scene or segment loads
  useEffect(() => {
    setHistory([])
    prevRevealed.current = 0
  }, [currentScene?.id, activeSegmentId])

  useEffect(() => {
    // Reset tracking when segments shrink (scene transition or branch)
    if (revealedSegments.length < prevRevealed.current) {
      prevRevealed.current = 0
    }
    if (revealedSegments.length > prevRevealed.current) {
      const newEntries: HistoryEntry[] = []
      for (let i = prevRevealed.current; i < revealedSegments.length; i++) {
        const seg = revealedSegments[i]
        const effectiveType =
          seg.type === 'monologue' ? 'internal_thought' :
          seg.type === 'narrative' ? 'description' :
          seg.type
        newEntries.push({
          id: `${currentScene?.id ?? 'scene'}-rev-${i}`,
          type: effectiveType,
          characterId: seg.character,
          characterName: seg.character ? charName(seg.character) : undefined,
          characterColor: seg.character ? getCharacterColor(seg.character) : undefined,
          text: seg.text,
        })
      }
      if (newEntries.length > 0) {
        setHistory(h => [...h, ...newEntries])
      }
      prevRevealed.current = revealedSegments.length
    }
  }, [revealedSegments, revealedSegments.length, activeSegment, segmentDone, currentScene?.id])

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

      <div style={{
        position: 'fixed', bottom: 0, left: '200px', right: 0, zIndex: 101,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0.35rem 1rem', paddingRight: '70px',
        borderTop: '1px solid rgba(196,148,58,0.15)',
        background: 'rgba(10,9,8,0.85)', pointerEvents: 'none',
      }}>
        <span style={{
          fontFamily: "'Special Elite', monospace",
          fontSize: '0.45rem', letterSpacing: '0.1em',
          color: 'var(--muted)', textTransform: 'uppercase',
        }}>
          Week {currentWeek} · S save · C codex · M map
        </span>
        <div style={{ display: 'flex', gap: '0.8rem' }}>
          {[
            { label: 'Save', action: () => setSaveMenuOpen(true) },
            { label: 'Codex', action: () => openCodex() },
            { label: 'Dossier', action: () => setCharacterMapOpen(true) },
            { label: '📝 Notes', action: () => setNotepadOpen(true) },
          ].map(({ label, action }) => (
            <button key={label} onClick={action} style={{
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--muted)', cursor: 'pointer',
              fontFamily: "'Special Elite', monospace",
              fontSize: '0.45rem', letterSpacing: '0.08em',
              padding: '2px 8px', textTransform: 'uppercase',
            }}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
