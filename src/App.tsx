import { useMemo, useEffect, useState, Component } from 'react'
import GameLayout from './components/GameLayout'
import DebugPanel from './components/DebugPanel'
import MapView from './components/MapView'
import SaveLoadMenu from './components/SaveLoadMenu'
import CodexViewer from './components/CodexViewer'
import CharacterMap from './components/CharacterMap'
import ProvinceDetail from './components/panels/ProvinceDetail'
import DiplomaticLetterPanel from './components/panels/DiplomaticLetterPanel'
import InlineCodexPanel from './components/panels/InlineCodexPanel'
import { useGameStore } from './stores/gameStore'
import { useSettingsStore } from './stores/settingsStore'
import { useCodexStore } from './stores/codexStore'
import { useWeekStore } from './stores/weekStore'
import { useLetterStore } from './stores/letterStore'
import { useJournalStore } from './stores/journalStore'
import { useNarrativeStore } from './stores/narrativeStore'
import { saveGame, loadGame, listSaves, AUTOSAVE_SLOT } from './engine/SaveManager'
import { useHotkeys } from './hooks/useHotkeys'
import { audioManager } from './engine/AudioManager'
import allLetters from './data/letters/diplomatic_letters.json'
import mapVeltriaFull from './assets/maps/veltria_map_full.jpeg'

// DIAGNOSTIC error boundary — remove after debugging
class MapErrorBoundary extends Component<{ children: React.ReactNode }, { error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('%c[MapErrorBoundary] MapView CRASHED', 'color: red; font-weight: bold;', error, info)
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: '#200', color: '#f88',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: 'monospace', fontSize: '14px', padding: '2rem',
        }}>
          <h2 style={{ marginBottom: '1rem' }}>MapView Error</h2>
          <pre style={{ whiteSpace: 'pre-wrap', maxWidth: '80vw' }}>{String(this.state.error)}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  const {
    saveMenuOpen, setSaveMenuOpen,
    settingsOpen, setSettingsOpen,
    mapOpen, setMapOpen,
    debugOpen, setDebugOpen,
    characterMapOpen, setCharacterMapOpen,
    journalOpen, setJournalOpen,
    notepadOpen, setNotepadOpen,
  } = useSettingsStore()
  const { openCodex, closeCodex, isOpen: codexOpen } = useCodexStore()
  const phase = useWeekStore(s => s.phase)
  const currentWeek = useGameStore(s => s.currentWeek)
  const sceneQueue = useWeekStore(s => s.sceneQueue)
  const currentQueueIndex = useWeekStore(s => s.currentQueueIndex)
  const transitionLabel = useWeekStore(s => s.transitionLabel)

  const [provinceDetailId, setProvinceDetailId] = useState<string | null>(null)

  const isGameplay = phase !== 'title' && phase !== 'epilogue'

  // DIAGNOSTIC LOGGING — remove after debugging black screen
  useEffect(() => {
    console.log(
      '%c[App.tsx] RENDER',
      'color: #ff0; font-weight: bold;',
      '\n  phase:', phase,
      '\n  currentWeek:', currentWeek,
      '\n  sceneQueue length:', sceneQueue.length,
      '\n  currentQueueIndex:', currentQueueIndex,
      '\n  transitionLabel:', transitionLabel,
      '\n  mapOpen:', mapOpen,
      '\n  isGameplay:', isGameplay,
    )
  }, [phase, currentWeek, sceneQueue.length, currentQueueIndex, transitionLabel, mapOpen, isGameplay])

  useEffect(() => {
    useLetterStore.getState().loadLetters(allLetters)
  }, [])

  useEffect(() => {
    const handleFirstInteraction = () => {
      audioManager.resume()
      audioManager.setUserInteracted()
      document.removeEventListener('click', handleFirstInteraction)
    }
    document.addEventListener('click', handleFirstInteraction)
    return () => document.removeEventListener('click', handleFirstInteraction)
  }, [])

  // One-time cleanup: deduplicate any existing journal entries from earlier sessions
  useEffect(() => {
    const { entries, deduplicateEntries, clearJournal } = useJournalStore.getState()
    if (entries.length > 0) {
      const deduped = deduplicateEntries(entries)
      if (deduped.length !== entries.length) {
        clearJournal()
        // Re-add deduplicated entries (addEntry will rebuild seenKeys)
        for (const entry of deduped) {
          useJournalStore.getState().addEntry({
            sceneId: entry.sceneId,
            choiceId: entry.choiceId,
            category: entry.category,
            alignment: entry.alignment,
            title: entry.title,
            description: entry.description,
            icon: entry.icon,
            flag: entry.flag,
            consequences: entry.consequences,
            currentWeek: entry.weekNumber,
          })
        }
      }
    }
  }, [])

  // ── Auto-close all UI panels the instant the game returns to the title screen ──
  // Prevents overlays (e.g. Settings, SaveMenu, Map, Journal) from persisting
  // across game sessions when returning from LegacyScreen, page refresh, etc.
  useEffect(() => {
    if (phase === 'title' || phase === 'customization' || phase === 'prologue') {
      setSettingsOpen(false)
      setSaveMenuOpen(false)
      setMapOpen(false)
      setDebugOpen(false)
      setCharacterMapOpen(false)
      setJournalOpen(false)
      setNotepadOpen(false)
    }
  }, [phase, setSettingsOpen, setSaveMenuOpen, setMapOpen, setDebugOpen, setCharacterMapOpen, setJournalOpen, setNotepadOpen])

  // DEV ONLY: Ctrl+Shift+9 instantly jumps to Week 9 for testing.
  // Use e.code (not e.key) because Shift+9 produces "(" on US layouts.
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.code === 'Digit9') {
        e.preventDefault()
        console.log('%c[DEV] Jumping to Week 9...', 'color: #0ff; font-weight: bold;')
        useSettingsStore.getState().setSettingsOpen(false)
        useGameStore.setState({ currentWeek: 9, currentAct: 1 })
        useNarrativeStore.getState().resetScene()
        useWeekStore.setState({
          transitionLabel: '',
          transitionWeek: null,
          cliffhangerText: null,
          diaryEntry: null,
          gateBlocked: false,
          gateMessage: null,
        })
        useWeekStore.getState().initWeek()
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  const bindings = useMemo(() => [
    // Escape: close panels in priority order (topmost first)
    { key: 'Escape', handler: () => {
      if (saveMenuOpen) setSaveMenuOpen(false)
      else if (codexOpen) closeCodex()
      else if (characterMapOpen) setCharacterMapOpen(false)
      else if (journalOpen) setJournalOpen(false)
      else if (settingsOpen) setSettingsOpen(false)
      else if (mapOpen) setMapOpen(false)
      else if (debugOpen) setDebugOpen(false)
    }},

    // Ctrl+S: save menu
    { key: 's', ctrl: true, handler: () => setSaveMenuOpen(true) },

    // S: quick save to autosave slot (gameplay only)
    { key: 's', handler: () => { saveGame(AUTOSAVE_SLOT, 'QUICKSAVE').catch(() => {}) }, enabled: () => isGameplay },

    // L: quick load most recent save (gameplay only)
    { key: 'l', handler: async () => {
      const saves = await listSaves()
      let best = -1; let bestTime = 0
      for (let i = 0; i < saves.length; i++) {
        const s = saves[i]
        if (s && s.timestamp > bestTime) { bestTime = s.timestamp; best = i }
      }
      if (best >= 0) await loadGame(best)
    }, enabled: () => isGameplay },

    // C: toggle codex
    { key: 'c', handler: () => codexOpen ? closeCodex() : openCodex() },

    // M: toggle map
    { key: 'm', handler: () => setMapOpen(!mapOpen) },

    // Ctrl+D: toggle debug
    { key: 'd', ctrl: true, handler: () => setDebugOpen(!debugOpen) },

    // J: toggle journal
    { key: 'j', handler: () => setJournalOpen(!journalOpen) },

    // N: toggle notepad
    { key: 'n', handler: () => setNotepadOpen(!notepadOpen) },
  ], [saveMenuOpen, codexOpen, characterMapOpen, settingsOpen, mapOpen, debugOpen, journalOpen, notepadOpen, isGameplay,
      setSaveMenuOpen, closeCodex, setCharacterMapOpen, setSettingsOpen, setMapOpen, setDebugOpen, setJournalOpen, setNotepadOpen,
      openCodex])

  useHotkeys(bindings)

  return (
    <>
      <MapErrorBoundary>
        <MapView backgroundImage={mapVeltriaFull} onProvinceDetail={setProvinceDetailId} />
      </MapErrorBoundary>
      <GameLayout />
      {debugOpen && <DebugPanel />}
      {characterMapOpen && <CharacterMap />}
      <SaveLoadMenu />
      <CodexViewer />
      {provinceDetailId && <ProvinceDetail initialProvince={provinceDetailId} onClose={() => setProvinceDetailId(null)} />}
      <DiplomaticLetterPanel />
      <InlineCodexPanel />
    </>
  )
}
