import { db, type SaveRecord } from '../db/mandateDb'
import { useGameStore, INITIAL_STATE } from '../stores/gameStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import type { GameState } from '../types/gameState'
import { useChainStore } from '../stores/chainStore'
import { useWeekStore } from '../stores/weekStore'
import { useSettingsStore, currentPlayTimeMinutes } from '../stores/settingsStore'
import { useDecreeStore } from '../stores/decreeStore'
import { useCabinetStore } from '../stores/cabinetStore'
import { useBillStore } from '../stores/billStore'
import { useParliamentStore } from '../stores/parliamentStore'
import { useJournalStore } from '../stores/journalStore'
import { useNewsStore } from '../stores/newsStore'
import { useLetterStore } from '../stores/letterStore'

export const AUTOSAVE_SLOT = 0
export const MANUAL_SLOT_COUNT = 10

// ─── localStorage fallback ───────────────────────────────────────────────────

const LS_PREFIX = 'mandate-save-slot-'

async function saveToLocalStorage(record: SaveRecord): Promise<void> {
  const key = `${LS_PREFIX}${record.slot}`
  const json = JSON.stringify(record)
  localStorage.setItem(key, json)
  if (import.meta.env.DEV) console.log('[SaveManager] Fallback localStorage save succeeded, slot:', record.slot)
}

async function loadFromLocalStorage(slot: number): Promise<SaveRecord | null> {
  try {
    const key = `${LS_PREFIX}${slot}`
    const json = localStorage.getItem(key)
    if (!json) return null
    return JSON.parse(json) as SaveRecord
  } catch {
    return null
  }
}

function listLocalStorageSaves(): Map<number, SaveRecord> {
  const result = new Map<number, SaveRecord>()
  for (let i = 0; i <= MANUAL_SLOT_COUNT; i++) {
    const key = `${LS_PREFIX}${i}`
    const json = localStorage.getItem(key)
    if (json) {
      try {
        const record = JSON.parse(json) as SaveRecord
        result.set(i, record)
      } catch {
        // skip corrupt entry
      }
    }
  }
  return result
}

function deleteLocalStorageSave(slot: number): void {
  localStorage.removeItem(`${LS_PREFIX}${slot}`)
}

// ─── Write ────────────────────────────────────────────────────────────────────

export async function saveGame(slot: number, name: string): Promise<void> {
  const gameState          = useGameStore.getState()
  const { visitedSceneIds, activeFlags, unlockedCodexIds, metCharacters } = useNarrativeStore.getState()
  const { scheduled: scheduledChains }   = useChainStore.getState()
  const { forcedChainIds }               = useWeekStore.getState()
  const decreeState = useDecreeStore.getState()
  const cabinetState = useCabinetStore.getState()
  const billState = useBillStore.getState()
  const parliamentState = useParliamentStore.getState()
  const journalState = useJournalStore.getState()
  const newsState = useNewsStore.getState()
  const letterState = useLetterStore.getState()

  let saveName = name
  if (slot !== AUTOSAVE_SLOT && name === 'AUTOSAVE') {
    try {
      const existing = await db.saves.get(slot)
      if (existing?.name && existing.name !== 'AUTOSAVE') {
        saveName = existing.name
      }
    } catch {
      // ignore — use provided name
    }
  }

  let record: SaveRecord = {
    version: 2,
    slot,
    name: slot === AUTOSAVE_SLOT ? 'AUTOSAVE' : saveName,
    timestamp: Date.now(),
    weekNumber: gameState.currentWeek,
    actNumber:  gameState.currentAct,
    playTimeMinutes: currentPlayTimeMinutes(),
    gameState: {
      currentWeek: gameState.currentWeek,
      currentAct: gameState.currentAct,
      furthestWeek: gameState.furthestWeek,
      nation: { ...gameState.nation },
      factions: { ...gameState.factions },
      personal: { ...gameState.personal },
      budget: { ...gameState.budget },
      playerBackground: gameState.playerBackground,
      playerPersonality: gameState.playerPersonality,
      playerAppearance: gameState.playerAppearance,
      termFocus: gameState.termFocus,
      advisorTrust: { ...gameState.advisorTrust },
      vaelInfluence: gameState.vaelInfluence,
      morvecInfluence: gameState.morvecInfluence,
      shadowInfluence: gameState.shadowInfluence,
      shadowFootprint: gameState.shadowFootprint,
      tyvarenHostility: gameState.tyvarenHostility,
      vossRelation: gameState.vossRelation,
      sovarka_relation: gameState.sovarka_relation,
      danika_loyalty: gameState.danika_loyalty,
      refugeeCount: gameState.refugeeCount,
      religiousAdherence: gameState.religiousAdherence,
      stateOfEmergency: gameState.stateOfEmergency,
      stateOfEmergencyWeek: gameState.stateOfEmergencyWeek,
      stateOfEmergencyExtensions: gameState.stateOfEmergencyExtensions,
      emergencyDecreesIssued: gameState.emergencyDecreesIssued,
      seridaAlive: gameState.seridaAlive,
      moleIdentity: gameState.moleIdentity,
      clues: gameState.clues,
      moleDiscovered: gameState.moleDiscovered,
      moleWronglyAccused: gameState.moleWronglyAccused,
      sorenImmunityRevoked: gameState.sorenImmunityRevoked,
      sorenTrialOutcome: gameState.sorenTrialOutcome,
      sorenFilesRevealed: gameState.sorenFilesRevealed,
      sorenLinkedToMikhael: gameState.sorenLinkedToMikhael,
      economicDirection: gameState.economicDirection,
      jonasPublicStage: gameState.jonasPublicStage,
      seridaTrust: gameState.seridaTrust,
      seridaMorale: gameState.seridaMorale,
      sentLetters: gameState.sentLetters,
      radioBroadcastsUsed: gameState.radioBroadcastsUsed,
      corruptionLedger: gameState.corruptionLedger,
      corruptionDiscoveredCount: gameState.corruptionDiscoveredCount,
      voteSpendingTotal: gameState.voteSpendingTotal,
      activeProjects: gameState.activeProjects,
      completedProjects: gameState.completedProjects,
      personalNotes: gameState.personalNotes,
      journalReflections: gameState.journalReflections,
      diaryEntries: gameState.diaryEntries,
      economyHistory: gameState.economyHistory ?? [],
      debtHistory: gameState.debtHistory ?? [],
      inflationHistory: gameState.inflationHistory ?? [],
      publicOrderHistory: gameState.publicOrderHistory ?? [],
      effectLog: gameState.effectLog ?? [],
      lastParliamentWeek: gameState.lastParliamentWeek ?? 0,
      emergencyParliamentFlag: gameState.emergencyParliamentFlag ?? false,
      initialSnapshot: null, // Never save initialSnapshot — it contains Zustand actions and can't be cloned by IndexedDB
    } as GameState,
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
      dismissedMinisters: cabinetState.dismissedMinisters ?? [],
      formation_complete: cabinetState.formation_complete,
      formation_week: cabinetState.formation_week,
      pending_requests: cabinetState.pending_requests,
      completed_requests: cabinetState.completed_requests,
    },
    billState: {
      bills: billState.bills,
      history: billState.history,
    },
    // Catalog reloads from JSON each session; currentSittingResults is
    // deliberately transient (interrupted mid-sitting resets on load).
    parliamentState: {
      sittingHistory: parliamentState.sittingHistory,
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

  // Step 2 diagnostics
  if (import.meta.env.DEV) console.log('[SaveManager] db.isOpen():', db.isOpen(), 'slot:', record.slot)

  // Step 3 — size guard: trim news articles if record exceeds 4 MB
  const recordJson = JSON.stringify(record)
  if (import.meta.env.DEV) console.log('[SaveManager] Record size:', recordJson.length, 'bytes')
  if (recordJson.length > 4_000_000) {
    console.warn('[SaveManager] Record too large, trimming news articles')
    record = {
      ...record,
      newsState: {
        ...record.newsState!,
        articles: (record.newsState?.articles ?? []).slice(-50),
      },
    }
  }

  // Step 4 — ensure database is open
  if (!db.isOpen()) {
    if (import.meta.env.DEV) console.log('[SaveManager] Database not open, opening...')
    await db.open()
  }

  // Step 1 + 5 — try Dexie, fall back to localStorage
  try {
    await db.saves.put(record)
    if (import.meta.env.DEV) console.log('[SaveManager] Dexie save succeeded, slot:', slot, 'week:', record.weekNumber)
  } catch (e) {
    const err = e as Error & { name?: string; message?: string; inner?: unknown }
    console.error('[SaveManager] Dexie save failed:', JSON.stringify({
      name: err?.name,
      message: err?.message,
      inner: String(err?.inner),
    }))
    console.warn('[SaveManager] Falling back to localStorage')
    await saveToLocalStorage(record)
  }
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function loadGame(slot: number): Promise<boolean> {
  // Try Dexie first, fall back to localStorage
  let record: SaveRecord | undefined
  try {
    record = await db.saves.get(slot)
  } catch {
    console.warn('[SaveManager] Dexie load failed, trying localStorage')
  }
  if (!record) {
    const fallback = await loadFromLocalStorage(slot)
    if (fallback) record = fallback
  }

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
  useWeekStore.setState({ forcedChainIds: record.forcedChainIds ?? [], activeSlot: record.slot })

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
      dismissedMinisters: record.cabinetState?.dismissedMinisters ?? [],
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

  // Restore parliament sitting history (catalog not restored — reloads from JSON)
  if (record.parliamentState) {
    useParliamentStore.setState({
      sittingHistory: record.parliamentState.sittingHistory ?? [],
      currentSittingResults: null,
    })
  } else {
    // Legacy / pre-parliament saves: empty history
    useParliamentStore.setState({
      sittingHistory: [],
      currentSittingResults: null,
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
  // Delete from both storages
  try {
    await db.saves.delete(slot)
  } catch {
    // Dexie may fail silently
  }
  deleteLocalStorageSave(slot)
}

// ─── List ─────────────────────────────────────────────────────────────────────

// Returns an array of length MANUAL_SLOT_COUNT + 1.
// Index = slot number. Undefined = empty slot.
export async function listSaves(): Promise<(SaveRecord | undefined)[]> {
  // Merge Dexie saves with localStorage fallback saves
  const dexieSaves = new Map<number, SaveRecord>()
  try {
    const all = await db.saves.toArray()
    for (const s of all) dexieSaves.set(s.slot, s)
  } catch {
    console.warn('[SaveManager] Dexie listSaves failed, checking localStorage')
  }

  const lsSaves = listLocalStorageSaves()

  // Dexie takes priority; localStorage fills gaps
  const result = Array.from({ length: MANUAL_SLOT_COUNT + 1 }, (_, i): SaveRecord | undefined => {
    if (dexieSaves.has(i)) return dexieSaves.get(i)
    if (lsSaves.has(i)) return lsSaves.get(i)
    return undefined
  })

  if (import.meta.env.DEV) {
    const count = result.filter(Boolean).length
    console.log('[SaveManager] listSaves found', count, 'slots (Dexie:', dexieSaves.size, 'localStorage:', lsSaves.size, ')')
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
  const withSlot = { ...record, slot }
  // Try Dexie, fall back to localStorage
  try {
    await db.saves.put(withSlot)
  } catch {
    await saveToLocalStorage(withSlot)
  }
}

// ─── Anti-scum: backward-load safety check ─────────────────────────────────

export interface LoadSafetyResult {
  safe: boolean
  weeksLost: number
}

/**
 * Checks whether loading a save would go backward in progress.
 * Does NOT block the load — only reports whether it's a backward load
 * and by how many weeks. The UI layer handles the confirmation dialog.
 */
export function checkLoadSafety(targetSave: SaveRecord): LoadSafetyResult {
  const currentFurthest = useGameStore.getState().furthestWeek
  const targetWeek = targetSave.weekNumber ?? targetSave.gameState?.currentWeek ?? 1

  const weeksLost = currentFurthest - targetWeek
  return {
    safe: weeksLost <= 0,
    weeksLost: Math.max(0, weeksLost),
  }
}