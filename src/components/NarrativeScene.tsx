import { useRef, useEffect, useCallback, useState } from 'react'
import type { NarrativeSegment, SceneChoice } from '../types/narrative'
import { useNarrativeStore } from '../stores/narrativeStore'
import { useGameStore } from '../stores/gameStore'
import { useWeekStore } from '../stores/weekStore'
import { getAvailableChoices } from '../engine/NarrativeEngine'
import { useDialogueFlow } from '../hooks/useDialogueFlow'
import { useSettingsStore } from '../stores/settingsStore'
import { useCodexStore } from '../stores/codexStore'
import { playTypewriterKeyThrottled, startAmbient } from '../engine/audioEngine'
import { getCharacterColor } from './portraits/CharacterPortraits'
import ConversationPanel from './narrative/ConversationPanel'

interface HistoryEntry {
  id: string
  type: 'dialogue' | 'narrative' | 'player_spoken'
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
  const { currentScene, sceneDone, activeFlags, processChoice } = useNarrativeStore()
  const gameState = useGameStore()
  const currentWeek = useGameStore(s => s.currentWeek)
  const { sceneQueue, currentQueueIndex, advanceQueue } = useWeekStore()
  const setSaveMenuOpen = useSettingsStore(s => s.setSaveMenuOpen)
  const setCharacterMapOpen = useSettingsStore(s => s.setCharacterMapOpen)
  const setNotepadOpen = useSettingsStore(s => s.setNotepadOpen)
  const openCodex = useCodexStore(s => s.openCodex)

  const segments = currentScene?.narrative ?? []
  const isEmergency = currentScene?.type === 'emergency'

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

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const isLastScene = currentQueueIndex >= sceneQueue.length - 1
  const continueLabel = isLastScene
    ? 'Proceed to Evening Review →'
    : `Continue to Next Meeting (${currentQueueIndex + 2}/${sceneQueue.length}) →`

  const sceneCharacters = currentScene?.characters ?? []

  const [history, setHistory] = useState<HistoryEntry[]>([])
  const prevRevealed = useRef(0)

  useEffect(() => {
    const currentCount = revealedSegments.length + (activeSegment && segmentDone ? 1 : 0)
    if (currentCount > prevRevealed.current) {
      const newEntries: HistoryEntry[] = []
      for (let i = prevRevealed.current; i < revealedSegments.length; i++) {
        const seg = revealedSegments[i]
        newEntries.push({
          id: `rev-${i}`,
          type: seg.type === 'dialogue' ? 'dialogue' : 'narrative',
          characterId: seg.character,
          characterName: seg.character ? charName(seg.character) : undefined,
          characterColor: seg.character ? getCharacterColor(seg.character) : undefined,
          text: seg.text,
        })
      }
      if (newEntries.length > 0) {
        setHistory(h => [...h, ...newEntries])
      }
      prevRevealed.current = currentCount
    }
  }, [revealedSegments.length, activeSegment, segmentDone])

  if (!currentScene) {
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
        activeSegment={activeSegment}
        activeText={activeText}
        showCursor={!segmentDone}
        choices={choices}
        showChoices={allDone && !sceneDone}
        sceneDone={sceneDone}
        allDone={allDone}
        segmentDone={segmentDone}
        onAdvance={advance}
        onChoice={(id) => processChoice(id)}
        onAdvanceQueue={advanceQueue}
        continueLabel={continueLabel}
        speakingCharacter={speakingCharacter}
        monologueText={currentScene?.monologue}
      />

      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 101,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0.35rem 1rem', borderTop: '1px solid rgba(196,148,58,0.15)',
        background: 'rgba(10,9,8,0.85)', pointerEvents: 'all',
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
