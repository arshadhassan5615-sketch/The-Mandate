// Simulation harness — drives the real Zustand week flow without React.
//
// The week loop lives entirely in Zustand actions:
//   initWeek → map → launchSingleScene / confirmAgenda → scene →
//   advanceQueue (500ms) → return-to-map pool rebuild →
//   completeWeek (1500ms chain tick) → next initWeek
// This harness calls those actions in the same order the UI does, so engine
// bugs surface as assertion failures instead of black screens.
//
// Timing: advanceQueue rebuilds the pool inside a 500ms trackedTimeout and
// completeWeek fires chains inside a 1500ms one. We use real timers and sleep
// past them — no fake timers, because completeWeek also awaits Dexie saves.
import { useGameStore } from '../stores/gameStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import { useWeekStore } from '../stores/weekStore'
import { isAgendaItemDone, isWeekComplete } from '../engine/weekCompletion'
import { saveGame, loadGame } from '../engine/SaveManager'
import type { AgendaItem } from '../types/week'

/** Real-time settle for the store's trackedTimeout transitions. */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Pluggable settle. Tests may install a fake-timer waiter
 * (`ms => vi.advanceTimersByTimeAsync(ms)`) so long scripted playthroughs run
 * in seconds instead of minutes. `null` restores real-time sleeps.
 */
type Waiter = (ms: number) => Promise<void>
let waiter: Waiter | null = null

export function setWaiter(fn: Waiter | null): void {
  waiter = fn
}

function wait(ms: number): Promise<void> {
  return waiter ? waiter(ms) : sleep(ms)
}

/**
 * Wipe every store plus localStorage so tests cannot leak state into each
 * other (gameStore has a persist middleware backed by localStorage).
 */
export function resetWorld(): void {
  try {
    localStorage.clear()
  } catch {
    /* ignore */
  }
  useWeekStore.getState().clearPendingTimeouts()
  useGameStore.getState().bootNewGame()
  useWeekStore.setState({
    phase: 'title',
    agendaPool: [],
    selectedIds: [],
    slotsUsed: 0,
    forcedChainIds: [],
    completedItemIds: [],
    sceneQueue: [],
    currentQueueIndex: 0,
    returnToMap: false,
    weekStartSnapshot: null,
    transitionWeek: null,
    transitionLabel: '',
    pendingMidpointProjectId: null,
    showTermReport: false,
    showLegacy: false,
    voteConfig: null,
    voteResult: null,
    diaryEntry: null,
    cliffhangerText: null,
    cutscenePanels: null,
    gateBlocked: false,
    gateMessage: null,
    radioOpen: false,
  })
}

/** Boot a week the way the game does: set the week, seed flags, run initWeek. */
export function bootWeek(week: number, opts: { flags?: string[] } = {}): void {
  useGameStore.getState().devSetWeek(week)
  if (opts.flags?.length) useNarrativeStore.getState().addFlags(opts.flags)
  useWeekStore.getState().initWeek()
}

export function pool(): AgendaItem[] {
  return useWeekStore.getState().agendaPool
}

export function poolIds(): string[] {
  return pool().map(i => i.id)
}

/**
 * Per-week completed-item ids. Fix A adds `completedItemIds` to the week
 * store (virtual items like `__budget__` are never marked visited, so their
 * done-ness has to come from somewhere). Read tolerantly so the harness
 * compiles and runs before and after the fix.
 */
export function completedItemIds(): string[] {
  const s = useWeekStore.getState() as { completedItemIds?: string[] }
  return s.completedItemIds ?? []
}

/** True when the map would treat this item as finished. */
export function isDone(item: AgendaItem): boolean {
  return isAgendaItemDone(
    item,
    useNarrativeStore.getState().visitedSceneIds,
    completedItemIds(),
  )
}

/** The map's week-complete predicate over live store state. */
export function weekComplete(): boolean {
  return isWeekComplete(
    pool(),
    useNarrativeStore.getState().visitedSceneIds,
    completedItemIds(),
  )
}

/** Item ids the map still offers (in the pool and not done). */
export function offeredIds(): string[] {
  return pool().filter(i => !isDone(i)).map(i => i.id)
}

/**
 * Play one agenda item the way the map does: launch it as a single-scene
 * queue (returnToMap), complete it, and let advanceQueue rebuild the pool.
 *
 * Virtual items (`__budget__`, `__radio__`, …) have no narrative scene; their
 * phase screens complete the item and call advanceQueue directly, which is
 * what this seam mirrors. Returns false when the launch was a no-op (e.g. the
 * scene is missing from the registry) so scripted playthroughs can report it.
 */
export async function playItem(item: AgendaItem): Promise<boolean> {
  useWeekStore.getState().launchSingleScene(item)
  const launched = useWeekStore.getState().sceneQueue[0]?.id === item.id
  if (!launched) return false
  const sceneId = item.sceneId
  if (!sceneId.startsWith('__')) {
    useNarrativeStore.getState().markSceneVisited(sceneId)
  } else if (sceneId === '__budget__') {
    // BudgetInterface.handleCommit
    useGameStore.getState().applyBudget(useGameStore.getState().budget)
    useNarrativeStore.getState().addFlags(['budget_finalized'])
  } else if (sceneId === '__radio__') {
    useWeekStore.getState().setRadioOpen(false)
  }
  useWeekStore.getState().advanceQueue()
  await wait(700) // 500ms scene transition + margin for the pool rebuild
  return true
}

/**
 * Play every offered item except the one with `skipSceneId` (e.g. leave
 * `__radio__` unplayed and assert the week can still end).
 */
export async function playAllExcept(skipSceneId: string | null): Promise<void> {
  const played = new Set<string>()
  for (let guard = 0; guard < 40; guard++) {
    const next = pool().find(
      i => !isDone(i) && !played.has(i.id) && i.sceneId !== skipSceneId,
    )
    if (!next) return
    played.add(next.id)
    await playItem(next)
  }
}

/**
 * Run completeWeek and wait out its 1500ms chain tick (and the 2000ms
 * election label, so the next week's queue advances). Returns after the
 * chain process has run (forcedChainIds updated).
 */
export async function finishWeek(): Promise<void> {
  await useWeekStore.getState().completeWeek()
  await wait(2200)
}

/**
 * Save the live state, wipe the world, and load the save back — a mid-week
 * reload exactly as SaveManager performs it.
 */
export async function saveAndReload(slot: number): Promise<void> {
  await saveGame(slot, 'SIM SAVE')
  resetWorld()
  const ok = await loadGame(slot)
  if (!ok) throw new Error(`simHarness: loadGame(${slot}) found no save`)
}
