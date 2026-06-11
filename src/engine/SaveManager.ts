import { db, type SaveRecord } from '../db/mandateDb'
import { useGameStore, INITIAL_STATE } from '../stores/gameStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import { useChainStore } from '../stores/chainStore'
import { useWeekStore } from '../stores/weekStore'
import { useSettingsStore, currentPlayTimeMinutes } from '../stores/settingsStore'
import { useDecreeStore } from '../stores/decreeStore'
import { useCabinetStore } from '../stores/cabinetStore'
import { useBillStore } from '../stores/billStore'
import { useJournalStore } from '../stores/journalStore'
import { useNewsStore } from '../stores/newsStore'
import { useLetterStore } from '../stores/letterStore'

export const AUTOSAVE_SLOT = 0
export const MANUAL_SLOT_COUNT = 10

// ─── Write ────────────────────────────────────────────────────────────────────

export async function saveGame(slot: number, name: string): Promise<void> {
  const gameState          = useGameStore.getState()
  const { visitedSceneIds, activeFlags, unlockedCodexIds, metCharacters } = useNarrativeStore.getState()
  const { scheduled: scheduledChains }   = useChainStore.getState()
  const { forcedChainIds }               = useWeekStore.getState()
  const decreeState = useDecreeStore.getState()
  const cabinetState = useCabinetStore.getState()
  const billState = useBillStore.getState()
  const journalState = useJournalStore.getState()
  const newsState = useNewsStore.getState()
  const letterState = useLetterStore.getState()

  const record: SaveRecord = {
    version: 2,
    slot,
    name: slot === AUTOSAVE_SLOT ? 'AUTOSAVE' : name,
    timestamp: Date.now(),
    weekNumber: gameState.currentWeek,
    actNumber:  gameState.currentAct,
    playTimeMinutes: currentPlayTimeMinutes(),
    gameState:  { ...gameState },
    visitedSceneIds,
    activeFlags,
    unlockedCodexIds,
    metCharacters: metCharacters ?? [],
    scheduledChains,
    forcedChainIds,
    decreeState: {
      pendingDecrees: decreeState.pendingDecrees,
      signedDecrees: decreeState.signedDecrees,
      rejectedDecrees: decreeState.rejectedDecrees,
      tabledDecrees: decreeState.tabledDecrees,
      pendingLongTermEffects: decreeState.pendingLongTermEffects,
    },
    cabinetState: {
      ministers: cabinetState.ministers,
      formation_complete: cabinetState.formation_complete,
      formation_week: cabinetState.formation_week,
      pending_requests: cabinetState.pending_requests,
      completed_requests: cabinetState.completed_requests,
    },
    billState: {
      bills: billState.bills,
      history: billState.history,
    },
    journalState: {
      entries: journalState.entries,
    },
    newsState: {
      articles: newsState.articles,
      readRecords: newsState.readRecords,
      lastReadIndex: newsState.lastReadIndex,
    },
    letterState: {
      letters: letterState.letters,
      readIds: Array.from(letterState.readIds),
      currentIndex: letterState.currentIndex,
    },
  }

  await db.saves.put(record)
  if (import.meta.env.DEV) {
    console.log('[SaveManager] Saved game to slot:', slot, 'name:', record.name, 'week:', record.weekNumber, 'act:', record.actNumber)
  }
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function loadGame(slot: number): Promise<boolean> {
  const record = await db.saves.get(slot)
  if (!record) {
    if (import.meta.env.DEV) {
      console.warn('[SaveManager] No save found at slot:', slot)
    }
    return false
  }

  if (import.meta.env.DEV) {
    console.log('[SaveManager] Loading save from slot:', slot, 'name:', record.name, 'week:', record.weekNumber, 'act:', record.actNumber)
  }

  // Detect legacy saves (version < 2) so we can fill in missing store
  // states with sensible defaults rather than crash.
  const isLegacy = !record.version || record.version < 2

  // Merge gameState over INITIAL_STATE to guarantee every new field has
  // a default. This is the H3 fix — never spread old state over live
  // state, which would leak values from the previous playthrough.
  const mergedGameState = { ...INITIAL_STATE, ...(record.gameState as object) }

  // Restore state stores — Zustand shallow-merges so actions are preserved
  useGameStore.setState(mergedGameState)

  useNarrativeStore.setState({
    visitedSceneIds:  record.visitedSceneIds ?? [],
    activeFlags:      record.activeFlags ?? [],
    unlockedCodexIds: record.unlockedCodexIds ?? [],
    metCharacters:    record.metCharacters ?? [],
    currentScene:     null,
    sceneDone:        false,
    activeSegmentId:  null,
  })

  useChainStore.setState({ scheduled: record.scheduledChains ?? [] })

  // Set forcedChainIds before initWeek so it sees the right value
  useWeekStore.setState({ forcedChainIds: record.forcedChainIds ?? [] })

  // Restore decree state (with default fallback for legacy saves)
  if (record.decreeState) {
    useDecreeStore.setState({
      pendingDecrees:        record.decreeState.pendingDecrees,
      signedDecrees:         record.decreeState.signedDecrees,
      rejectedDecrees:       record.decreeState.rejectedDecrees,
      tabledDecrees:         record.decreeState.tabledDecrees,
      pendingLongTermEffects: record.decreeState.pendingLongTermEffects ?? [],
      selectedDecree:        null,
    })
  } else if (isLegacy) {
    // Legacy save: reset to initial empty values
    useDecreeStore.setState({
      pendingDecrees: [],
      signedDecrees: [],
      rejectedDecrees: [],
      tabledDecrees: [],
      selectedDecree: null,
      pendingLongTermEffects: [],
    })
  }

  // Restore cabinet state
  if (record.cabinetState) {
    useCabinetStore.setState({
      ministers:          record.cabinetState.ministers,
      formation_complete: record.cabinetState.formation_complete,
      formation_week:     record.cabinetState.formation_week,
      pending_requests:   record.cabinetState.pending_requests,
      completed_requests: record.cabinetState.completed_requests,
    })
  } else if (isLegacy) {
    useCabinetStore.setState({
      ministers: {
        finance: null, interior: null, defense: null, justice: null,
        labor: null, foreign_affairs: null, education: null, health: null,
        development: null, resources: null,
      },
      formation_complete: false,
      formation_week: null,
      pending_requests: [],
      completed_requests: [],
    })
  }

  // Restore bill state
  if (record.billState) {
    useBillStore.setState({
      bills:    record.billState.bills,
      history:  record.billState.history,
      pendingBill: null,
      isOverlayOpen: false,
      vetoOverrideResult: null,
    })
  } else if (isLegacy) {
    useBillStore.setState({
      bills: [],
      history: [],
      pendingBill: null,
      isOverlayOpen: false,
      vetoOverrideResult: null,
    })
  }

  // Restore journal state
  if (record.journalState) {
    useJournalStore.setState({
      entries: record.journalState.entries,
    })
  } else if (isLegacy) {
    useJournalStore.setState({
      entries: [],
      seenKeys: new Set<string>(),
    })
  }

  // Restore news state
  if (record.newsState) {
    useNewsStore.setState({
      articles:      record.newsState.articles,
      readRecords:   record.newsState.readRecords,
      lastReadIndex: record.newsState.lastReadIndex,
      isOpen:        false,
    })
  } else if (isLegacy) {
    useNewsStore.setState({
      articles: [],
      isOpen: false,
      lastReadIndex: -1,
      readRecords: {},
    })
  }

  // Restore letter state
  if (record.letterState) {
    useLetterStore.setState({
      letters:       record.letterState.letters,
      readIds:       new Set(record.letterState.readIds),
      currentIndex:  record.letterState.currentIndex,
      isOpen:        false,
      unreadCount:   record.letterState.letters.length - record.letterState.readIds.length,
    })
  } else if (isLegacy) {
    useLetterStore.setState({
      letters: [],
      readIds: new Set<string>(),
      currentIndex: 0,
      isOpen: false,
      unreadCount: 0,
    })
  }

  // Reset session timer with the loaded play time as baseline
  useSettingsStore.getState().setPlayTime(record.playTimeMinutes)

  // Re-enter agenda phase for the loaded week
  useWeekStore.getState().initWeek()

  return true
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteSave(slot: number): Promise<void> {
  await db.saves.delete(slot)
}

// ─── List ─────────────────────────────────────────────────────────────────────

// Returns an array of length MANUAL_SLOT_COUNT + 1.
// Index = slot number. Undefined = empty slot.
export async function listSaves(): Promise<(SaveRecord | undefined)[]> {
  const all = await db.saves.toArray()
  const bySlot = new Map(all.map(s => [s.slot, s]))
  const result = Array.from({ length: MANUAL_SLOT_COUNT + 1 }, (_, i) => bySlot.get(i))
  if (import.meta.env.DEV) {
    console.log('[SaveManager] listSaves found', all.length, 'records across', result.filter(Boolean).length, 'slots')
  }
  return result
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function downloadSaveJson(record: SaveRecord): void {
  const json = JSON.stringify(record, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `mandate-save-${record.slot === 0 ? 'autosave' : `slot${record.slot}`}-week${record.weekNumber}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Import ───────────────────────────────────────────────────────────────────

function validateImportedSave(parsed: unknown): asserts parsed is SaveRecord {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid save file')
  }
  const obj = parsed as Record<string, unknown>
  if (!obj.version || !obj.gameState) {
    throw new Error('Invalid save structure')
  }
  if (typeof (obj.gameState as Record<string, unknown>).currentWeek !== 'number') {
    throw new Error('Corrupted save')
  }
}

export function triggerImportPicker(onImport: (record: SaveRecord, json: string) => void): void {
  const input = document.createElement('input')
  input.type   = 'file'
  input.accept = '.json'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    const text = await file.text()
    try {
      const parsed = JSON.parse(text)
      validateImportedSave(parsed)
      onImport(parsed, text)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      if (import.meta.env.DEV) {
        console.warn('[SaveManager] Import failed:', msg)
      }
    }
  }
  input.click()
}

export async function importSaveToSlot(record: SaveRecord, slot: number): Promise<void> {
  await db.saves.put({ ...record, slot })
}
