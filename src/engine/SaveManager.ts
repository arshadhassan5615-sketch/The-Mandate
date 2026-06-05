import { db, type SaveRecord } from '../db/mandateDb'
import { useGameStore } from '../stores/gameStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import { useChainStore } from '../stores/chainStore'
import { useWeekStore } from '../stores/weekStore'
import { useSettingsStore, currentPlayTimeMinutes } from '../stores/settingsStore'

export const AUTOSAVE_SLOT = 0
export const MANUAL_SLOT_COUNT = 10

// ─── Write ────────────────────────────────────────────────────────────────────

export async function saveGame(slot: number, name: string): Promise<void> {
  const gameState          = useGameStore.getState()
  const { visitedSceneIds, activeFlags, unlockedCodexIds } = useNarrativeStore.getState()
  const { scheduled: scheduledChains }   = useChainStore.getState()
  const { forcedChainIds }               = useWeekStore.getState()

  const record: SaveRecord = {
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
    scheduledChains,
    forcedChainIds,
  }

  await db.saves.put(record)
  console.log('[SaveManager] Saved game to slot:', slot, 'name:', record.name, 'week:', record.weekNumber, 'act:', record.actNumber)
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function loadGame(slot: number): Promise<boolean> {
  const record = await db.saves.get(slot)
  if (!record) {
    console.warn('[SaveManager] No save found at slot:', slot)
    return false
  }

  console.log('[SaveManager] Loading save from slot:', slot, 'name:', record.name, 'week:', record.weekNumber, 'act:', record.actNumber)

  // Restore state stores — Zustand shallow-merges so actions are preserved
  useGameStore.setState(record.gameState)

  useNarrativeStore.setState({
    visitedSceneIds:  record.visitedSceneIds,
    activeFlags:      record.activeFlags,
    unlockedCodexIds: record.unlockedCodexIds ?? [],
    currentScene:     null,
    sceneDone:        false,
  })

  useChainStore.setState({ scheduled: record.scheduledChains })

  // Set forcedChainIds before initWeek so it sees the right value
  useWeekStore.setState({ forcedChainIds: record.forcedChainIds })

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
  console.log('[SaveManager] listSaves found', all.length, 'records across', result.filter(Boolean).length, 'slots')
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

export function triggerImportPicker(onImport: (record: SaveRecord, json: string) => void): void {
  const input = document.createElement('input')
  input.type   = 'file'
  input.accept = '.json'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    const text = await file.text()
    try {
      const record = JSON.parse(text) as SaveRecord
      onImport(record, text)
    } catch {
      alert('Invalid save file.')
    }
  }
  input.click()
}

export async function importSaveToSlot(record: SaveRecord, slot: number): Promise<void> {
  await db.saves.put({ ...record, slot })
}
