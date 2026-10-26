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
import { applySpending, calculateProjection } from '../engine/VoteEngine'
import { PROVISIONS } from '../data/constitution/provisions'
import { saveGame, loadGame } from '../engine/SaveManager'
import { DEFAULT_THRESHOLD, type SpendLevel, type VoteResult } from '../types/vote'
import type { AgendaItem } from '../types/week'
import { playScene, type ChoicePlayResult, type PickChoice } from './choicePlayer'

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

/** Tally and flags for one `__vote__` item, as LobbyingInterface.handleCommit records them. */
export interface VoteOutcome {
  voteType: string
  threshold: number
  totalSeats: number
  spendLevel: SpendLevel
  yes: number
  no: number
  undecided: number
  margin: number
  passed: boolean
  /** Corruption flags from spending plus the success or failure flags of the config. */
  flagsApplied: string[]
  lobbyingEnabled: boolean
}

/**
 * How one virtual phase item was resolved. `resolution` is a short note for
 * the audit report; `vote` is set only for `__vote__` items.
 */
export interface ItemResolution {
  week: number
  itemId: string
  sceneId: string
  resolution: string
  vote?: VoteOutcome
}

/** Resolutions recorded since the last drain. Read by the timing audit. */
const resolutionLog: ItemResolution[] = []

/** Take and clear the resolutions recorded since the last call. */
export function drainResolutions(): ItemResolution[] {
  return resolutionLog.splice(0, resolutionLog.length)
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
  resolutionLog.length = 0
  useWeekStore.getState().clearPendingTimeouts()
  useGameStore.getState().bootNewGame()
  useWeekStore.setState({
    phase: 'title',
    agendaPool: [],
    selectedIds: [],
    slotsUsed: 0,
    forcedChainIds: [],
    completedItemIds: [],
    lastVoteResults: {},
    resolvedItemIds: [],
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
 * Narrative scenes (including `__project__*` scenes, which are real scene JSON)
 * are played and marked visited. Other virtual items are resolved by
 * `resolveVirtual`, which calls the same store actions and engine functions the
 * phase screen calls. Returns false when the launch was a no-op (e.g. the
 * scene is missing from the registry) so scripted playthroughs can report it.
 *
 * With `opts.choose`, a narrative scene is played through its choices
 * (processChoice) before completion. Without it the scene is completed with no
 * choices.
 */
export interface PlayItemOptions {
  /** Picks one of the offered choices; enables choice play for narrative scenes. */
  choose?: PickChoice
  /** Receives the summary of each scene played through `choose`. */
  onChoices?: (result: ChoicePlayResult) => void
  /**
   * Spend level for a `__vote__` item (LobbyingInterface's whip-count choice).
   * Default 0: no lobbying, straight tally. Ignored when the config has
   * lobbyingEnabled false, because the real screen offers no spending there.
   */
  decideVote?: (item: AgendaItem) => SpendLevel
}

/** Scenes whose id starts with `__` are virtual, except real project scenes. */
function isNarrativeScene(sceneId: string): boolean {
  return !sceneId.startsWith('__') || sceneId.startsWith('__project__')
}

export async function playItem(item: AgendaItem, opts: PlayItemOptions = {}): Promise<boolean> {
  useWeekStore.getState().launchSingleScene(item)
  const launched = useWeekStore.getState().sceneQueue[0]?.id === item.id
  if (!launched) return false
  const sceneId = item.sceneId
  if (isNarrativeScene(sceneId)) {
    if (opts.choose) {
      const result = playScene(opts.choose)
      opts.onChoices?.(result)
    }
    useNarrativeStore.getState().markSceneVisited(sceneId)
  } else {
    resolutionLog.push(resolveVirtual(item, opts))
  }
  useWeekStore.getState().advanceQueue()
  await wait(700) // 500ms scene transition + margin for the pool rebuild
  return true
}

/** Resolve a virtual phase item through the same code its phase screen uses. */
function resolveVirtual(item: AgendaItem, opts: PlayItemOptions): ItemResolution {
  const base = { week: useGameStore.getState().currentWeek, itemId: item.id, sceneId: item.sceneId }
  switch (item.sceneId) {
    case '__budget__':
      return { ...base, resolution: budgetCommit() }
    case '__radio__':
      useWeekStore.getState().setRadioOpen(false)
      return { ...base, resolution: 'radio closed without a broadcast choice' }
    case '__vote__':
      return voteCommit(item, base, opts)
    case '__constitution__':
      return { ...base, resolution: constitutionCommit() }
    case '__cabinet_reshuffle__':
      return {
        ...base,
        resolution: 'no candidate chosen (reshuffle commit needs a candidate); not reshuffled, queue advanced',
      }
    default:
      return { ...base, resolution: 'no resolver for this virtual screen; queue advanced without resolution' }
  }
}

/** BudgetInterface.handleCommit with the current budget. */
function budgetCommit(): string {
  useGameStore.getState().applyBudget(useGameStore.getState().budget)
  useNarrativeStore.getState().addFlags(['budget_finalized'])
  return 'budget committed as set; flag budget_finalized'
}

/**
 * LobbyingInterface.handleCommit: calculateProjection + applySpending from the
 * live faction support, then spending cost, corruption flags, the outcome
 * flags from voteConfig, the assembly margin, and the voteResult the
 * VoteResult screen reads. With lobbyingEnabled false the real screen never
 * tallies (see the report note); the harness still applies the straight tally.
 */
function voteCommit(
  item: AgendaItem,
  base: Pick<ItemResolution, 'week' | 'itemId' | 'sceneId'>,
  opts: PlayItemOptions,
): ItemResolution {
  const cfg = item.voteConfig
  if (!cfg) return { ...base, resolution: 'no voteConfig; no tally, no flags' }

  const lobbyingEnabled = cfg.lobbyingEnabled !== false
  const requested: SpendLevel = lobbyingEnabled ? (opts.decideVote?.(item) ?? 0) : 0
  const threshold = cfg.threshold ?? DEFAULT_THRESHOLD
  const game = useGameStore.getState()
  const projection = calculateProjection(game.factions, threshold)
  const { finalProjection, corruptionFlags, wealthSpent } = applySpending(projection, requested)

  const passed = finalProjection.willPass
  const flagsApplied = [...corruptionFlags, ...(passed ? cfg.successFlags : cfg.failureFlags)]

  if (wealthSpent > 0) {
    game.applyModifiers([
      { stat: 'personal.personalWealth', operation: 'add', value: -wealthSpent },
      { stat: 'voteSpendingTotal', operation: 'add', value: wealthSpent },
    ])
  }
  useNarrativeStore.getState().addFlags(flagsApplied)
  useGameStore.getState().applyModifiers([
    { stat: 'nation.assemblyVoteMargin', operation: 'set', value: Math.abs(finalProjection.margin) },
  ])

  const voteResult: VoteResult = {
    projection,
    spendLevel: requested,
    finalYesSeats: finalProjection.yesSeats,
    finalNoSeats: finalProjection.noSeats,
    finalUndecidedSeats: finalProjection.undecidedSeats,
    passed,
    margin: finalProjection.margin,
    corruptionFlagSet: corruptionFlags.length > 0,
    personalWealthSpent: wealthSpent,
  }
  useWeekStore.setState({ voteResult })

  const vote: VoteOutcome = {
    voteType: cfg.voteType,
    threshold,
    totalSeats: cfg.totalSeats,
    spendLevel: requested,
    yes: finalProjection.yesSeats,
    no: finalProjection.noSeats,
    undecided: finalProjection.undecidedSeats,
    margin: finalProjection.margin,
    passed,
    flagsApplied,
    lobbyingEnabled,
  }
  const note = `${passed ? 'passed' : 'failed'} ${finalProjection.yesSeats}-${finalProjection.noSeats} `
    + `(need ${threshold}); spend ${requested}; flags ${flagsApplied.join(', ') || 'none'}`
    + (lobbyingEnabled ? '' : '; lobbyingEnabled false: straight tally applied, real screen does not tally')
  return { ...base, resolution: note, vote }
}

/**
 * ConstitutionalReform.handleFinalize with default provisions: the first
 * variant of every provision is selected (the screen needs at least one
 * selection and offers no default), then the package is committed.
 */
function constitutionCommit(): string {
  const modifiers: { stat: string; operation: 'add'; value: number }[] = []
  const flags: string[] = []
  for (const provision of PROVISIONS) {
    const variant = provision.variants[0]
    if (!variant) {
      flags.push(`constitution_excluded_${provision.id}`)
      continue
    }
    flags.push(`constitution_${provision.id}_${variant.id}`)
    for (const r of variant.reactions) {
      modifiers.push({ stat: `factions.${r.faction}`, operation: 'add', value: r.value })
    }
  }
  flags.push('constitutional_package_submitted')
  if (modifiers.length > 0) useGameStore.getState().applyModifiers(modifiers)
  useNarrativeStore.getState().addFlags(flags)
  return `constitution committed with first variant of ${PROVISIONS.length} provisions (default provisions); ${flags.length} flags`
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
