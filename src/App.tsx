import { useMemo, useEffect, useState } from 'react'
import { MotionConfig } from 'framer-motion'
import GameLayout from './components/GameLayout'
import MapView from './components/MapView'
import SaveLoadMenu from './components/SaveLoadMenu'
import CodexViewer from './components/CodexViewer'
import CharacterMap from './components/CharacterMap'
import ProvinceDetail from './components/panels/ProvinceDetail'
import InlineCodexPanel from './components/panels/InlineCodexPanel'
import { ErrorBoundary } from './components/ErrorBoundary'
import RotateDevicePrompt from './components/RotateDevicePrompt'
import { useGameStore } from './stores/gameStore'
import { useSettingsStore } from './stores/settingsStore'
import { useCodexStore } from './stores/codexStore'
import { useWeekStore } from './stores/weekStore'
import { useLetterStore } from './stores/letterStore'
import { useJournalStore } from './stores/journalStore'
import { useNarrativeStore } from './stores/narrativeStore'
import { useNewsStore } from './stores/newsStore'
import { saveGame, AUTOSAVE_SLOT } from './engine/SaveManager'
import { useHotkeys } from './hooks/useHotkeys'
import { HUD_SHORTCUTS } from './constants/hudShortcuts'
import { audioManager } from './engine/AudioManager'
import allLetters from './data/letters/diplomatic_letters.json'


export default function App() {
  const {
    saveMenuOpen, setSaveMenuOpen,
    settingsOpen, setSettingsOpen,
    mapOpen, setMapOpen,
    debugOpen, setDebugOpen,
    characterMapOpen, setCharacterMapOpen,
    journalOpen, setJournalOpen,
    notepadOpen, setNotepadOpen,
    letterOpen, setLetterOpen,
    decreeInboxOpen, setDecreeInboxOpen,
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
    if (!import.meta.env.DEV) return
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

  // The week map is the home screen: it opens when the map phase begins and
  // closes when any other phase starts, so a meeting never opens under it.
  // Depends on phase only, so the player can still close it with M.
  useEffect(() => {
    setMapOpen(phase === 'map')
  }, [phase, setMapOpen])

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
      // M14 — also close overlays that were previously skipped
      else if (notepadOpen) setNotepadOpen(false)
      else if (letterOpen) setLetterOpen(false)
      else if (decreeInboxOpen) setDecreeInboxOpen(false)
      else if (useNewsStore.getState().isOpen) useNewsStore.getState().setOpen(false)
      else if (useLetterStore.getState().isOpen) useLetterStore.getState().setOpen(false)
    }},

    // Ctrl+S: save menu
    { key: 's', ctrl: true, handler: () => setSaveMenuOpen(true) },

    // S: quick save to autosave slot (gameplay only)
    { key: 's', handler: () => { saveGame(AUTOSAVE_SLOT, 'QUICKSAVE').catch((e) => console.warn('Autosave failed:', e)) }, enabled: () => isGameplay },

    // Panel keys come from HUD_SHORTCUTS, which the nav-rail tooltips also show.
    { key: HUD_SHORTCUTS.codex, handler: () => codexOpen ? closeCodex() : openCodex() },
    { key: HUD_SHORTCUTS.map, handler: () => setMapOpen(!mapOpen) },

    // Ctrl+D: toggle debug
    { key: 'd', ctrl: true, handler: () => setDebugOpen(!debugOpen) },

    { key: HUD_SHORTCUTS.journal, handler: () => setJournalOpen(!journalOpen) },
    { key: HUD_SHORTCUTS.notepad, handler: () => setNotepadOpen(!notepadOpen) },

    // Rail-only panels: gameplay only, since their buttons exist only then.
    { key: HUD_SHORTCUTS.news, enabled: () => isGameplay,
      handler: () => { const news = useNewsStore.getState(); news.setOpen(!news.isOpen) } },
    { key: HUD_SHORTCUTS.decrees, enabled: () => isGameplay,
      handler: () => setDecreeInboxOpen(!decreeInboxOpen) },
    { key: HUD_SHORTCUTS.letters, enabled: () => isGameplay,
      handler: () => { const letters = useLetterStore.getState(); letters.setOpen(!letters.isOpen) } },
  ], [saveMenuOpen, codexOpen, characterMapOpen, settingsOpen, mapOpen, debugOpen, journalOpen, notepadOpen, letterOpen, decreeInboxOpen, isGameplay,
      setSaveMenuOpen, closeCodex, setCharacterMapOpen, setSettingsOpen, setMapOpen, setDebugOpen, setJournalOpen, setNotepadOpen, setLetterOpen, setDecreeInboxOpen,
      openCodex])

  useHotkeys(bindings)

  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <MapView onProvinceDetail={setProvinceDetailId} />
        <GameLayout />
        {characterMapOpen && <CharacterMap />}
        <SaveLoadMenu />
        <CodexViewer />
        {provinceDetailId && <ProvinceDetail initialProvince={provinceDetailId} onClose={() => setProvinceDetailId(null)} />}
        {/* DiplomaticLetterPanel is mounted once, inside GameLayout */}
        <InlineCodexPanel />
        <RotateDevicePrompt />
      </MotionConfig>
    </ErrorBoundary>
  )
}
