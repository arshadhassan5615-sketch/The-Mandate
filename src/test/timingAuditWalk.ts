// Shared walk for the scene-timing audit. Used by both sim files:
//   src/test/timingAudit.nochoice.sim.test.ts (profiles that pick no choices)
//   src/test/timingAudit.choice.sim.test.ts   (profiles that pick choices)
// Test-only: it drives the real stores through simHarness and is imported
// only from *.sim.test.ts files.
import { vi } from 'vitest'

import { useGameStore } from '../stores/gameStore'
import { useWeekStore } from '../stores/weekStore'
import { useChainStore } from '../stores/chainStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import { evaluateAll } from '../engine/conditionEvaluator'
import { SCENE_REGISTRY } from '../engine/NarrativeEngine'
import { scheduleWeekStartChains } from '../engine/weekStartChains'
import type { ScheduledChain } from '../engine/ChainReactionEngine'
import type { GameState } from '../types/gameState'
import type { AgendaItem } from '../types/week'
import {
  bootWeek,
  pool,
  isDone,
  playItem,
  finishWeek,
  resetWorld,
  drainResolutions,
  type PlayItemOptions,
} from './simHarness'
import {
  mulberry32,
  preferTags,
  seededPick,
  MAX_CHOICES_PER_ITEM,
  type ChoicePlayResult,
  type PickChoice,
} from './choicePlayer'
import {
  LAST_WEEK,
  CHAIN_ITEM_PREFIX,
  createLedger,
  pushUnique,
  loadAgendaDeclarations,
  declaredWindow,
  sceneWindow,
  isInWindow,
  buildProfileFindings,
  type AgendaDeclaration,
  type TimingLedger,
  type TimingFinding,
  type ProfileSummary,
  type WeekWindow,
  type VoteRecord,
  type ChainDelivery,
  type ChainDeliveryOutcome,
  type ChainSchedule,
} from './timingAudit'

/** Seed for the seeded-random picker and for Math.random during choice profiles. */
export const CHOICE_SEED = 42

/** Pool ids of the referendum vote outcomes and their aftermath entries. */
const OUTCOME_ITEM_PATTERN = /referendum|aftermath/

export interface Profile {
  name: string
  flags: string[]
  /** Present on choice profiles: builds the picker used for every scene. */
  makeChooser?: () => PickChoice
}

// Copied from playthroughs.sim.test.ts (that file is not edited).
export const PROFILES: Profile[] = [
  { name: 'untouched (no flags)', flags: [] },
  {
    name: 'reformist',
    flags: [
      'constitution_in_force',
      'referendum_won_decisive',
      'bca_funded',
      'commissioner_vasic_appointed',
    ],
  },
  {
    name: 'hardliner',
    flags: [
      'hawk_network_active',
      'permanent_injury_sustained',
      'assassination_survived',
      'coup_attempted',
      'government_survived',
    ],
  },
  {
    name: 'exile branch',
    flags: [
      'government_in_exile',
      'coup_succeeded',
      'chancellor_fled',
      'brenner_controls_capital',
      'coup_attempted',
    ],
  },
  {
    name: 'reformist-chooser',
    flags: [],
    makeChooser: () => preferTags(['reformist', 'pragmatist']),
  },
  {
    name: 'authoritarian-chooser',
    flags: [],
    makeChooser: () => preferTags(['authoritarian', 'pragmatist']),
  },
  {
    name: 'populist-chooser',
    flags: [],
    makeChooser: () => preferTags(['populist', 'personal']),
  },
  {
    name: 'seeded-random',
    flags: [],
    makeChooser: () => seededPick(CHOICE_SEED),
  },
]

/** Profiles that pick no choices (the nochoice audit file). */
export const NOCHOICE_PROFILES = PROFILES.filter(p => p.makeChooser === undefined)
/** Profiles that pick choices through processChoice (the choice audit file). */
export const CHOICE_PROFILES = PROFILES.filter(p => p.makeChooser !== undefined)

const agendaModules = import.meta.glob('../data/agenda/*.json', { eager: true })
const agendaFiles: Record<string, unknown> = Object.fromEntries(
  Object.entries(agendaModules).map(([path, mod]) => [
    path,
    (mod as { default?: unknown } | null)?.default ?? mod,
  ]),
)
export const DECLARATIONS: AgendaDeclaration[] = loadAgendaDeclarations(agendaFiles)

type PoolPrereqs = NonNullable<AgendaItem['prerequisites']>

function sceneWindowOf(sceneId: string): WeekWindow | null {
  return sceneWindow(SCENE_REGISTRY.get(sceneId))
}

/** The same gates buildPool applies to a JSON entry (prerequisites + scene gates). */
function passesPoolGates(
  prereqs: unknown[],
  sceneId: string,
  visited: readonly string[],
  flags: readonly string[],
): boolean {
  const gameState = useGameStore.getState()
  if (prereqs.length > 0 && !evaluateAll(prereqs as PoolPrereqs, gameState, [...flags])) return false
  if (sceneId.startsWith('__')) return true
  const scene = SCENE_REGISTRY.get(sceneId)
  if (!scene) return true
  if (scene.prerequisiteSceneIds?.length && !scene.prerequisiteSceneIds.every(id => visited.includes(id))) return false
  if (scene.prerequisiteFlags?.length && !scene.prerequisiteFlags.every(f => flags.includes(f))) return false
  return true
}

function recordOffers(ledger: TimingLedger, week: number): void {
  for (const item of pool()) {
    if (!ledger.itemMeta.has(item.id)) {
      ledger.itemMeta.set(item.id, {
        sceneId: item.sceneId,
        weekAvailable: item.weekAvailable,
        weekDeadline: item.weekDeadline ?? null,
        recurring: item.recurring === true,
        isUrgent: item.isUrgent === true,
      })
    }
    if (isDone(item)) continue
    pushUnique(ledger.offeredWeeks, item.id, week)
    if (item.id.startsWith(CHAIN_ITEM_PREFIX) && !ledger.chainDelivered.has(item.sceneId)) {
      ledger.chainDelivered.set(item.sceneId, week)
    }
  }
}

function recordEligibility(ledger: TimingLedger, week: number): void {
  const { visitedSceneIds: visited, activeFlags: flags } = useNarrativeStore.getState()
  for (const decl of DECLARATIONS) {
    if (!isInWindow(declaredWindow(decl), week)) continue
    if (!decl.recurring && visited.includes(decl.sceneId)) continue
    if (!passesPoolGates(decl.prerequisites, decl.sceneId, visited, flags)) continue
    pushUnique(ledger.eligibleWeeks, decl.id, week)
  }
}

function recordChainSchedules(ledger: TimingLedger, week: number): void {
  for (const c of useChainStore.getState().scheduled) {
    const schedule: ChainSchedule = {
      chainId: c.id,
      fireWeek: c.fireWeek,
      scheduledWeek: week,
      sourceId: c.sourceId,
      sceneId: c.sceneId,
    }
    if (!ledger.chainIdsScheduled.has(c.id)) {
      ledger.chainIdsScheduled.add(c.id)
      const sources = ledger.chainSchedules.get(c.targetNodeId) ?? []
      ledger.chainSchedules.set(c.targetNodeId, [...sources, schedule])
    }
    if (!ledger.chainFirst.has(c.targetNodeId)) {
      ledger.chainFirst.set(c.targetNodeId, schedule)
    }
  }
}

function recordChoices(ledger: TimingLedger, week: number, sceneId: string, result: ChoicePlayResult): void {
  ledger.choicesMade += result.choicesMade
  if (result.loopHit) {
    ledger.notes.push(`LOOP: ${sceneId} still open after ${MAX_CHOICES_PER_ITEM} choices in week ${week}`)
  }
}

/**
 * Move the harness's resolutions for the last played item into the ledger:
 * vote tallies go to `votes`, other virtual resolutions are counted by scene.
 */
function recordResolutions(ledger: TimingLedger, profile: string): void {
  for (const r of drainResolutions()) {
    if (r.vote) {
      const v: VoteRecord = { profile, week: r.week, itemId: r.itemId, sceneId: r.sceneId, ...r.vote }
      ledger.votes.push(v)
    } else {
      ledger.resolved.set(r.sceneId, (ledger.resolved.get(r.sceneId) ?? 0) + 1)
    }
  }
}

/**
 * Why a chain that left the queue unfired was dropped. chainStore records
 * nothing on drop, so this is read from the chain's own fields. Conditions are
 * evaluated against the state after the tick, which is an approximation.
 */
function dropReason(
  chain: ScheduledChain,
  state: ReturnType<typeof useGameStore.getState>,
  flags: string[],
  evalWeek: number,
): string {
  // resolveChains checks the window first, at the week the tick advanced into.
  const deadline = SCENE_REGISTRY.get(chain.targetNodeId)?.weekDeadline
  if (typeof deadline === 'number' && evalWeek > deadline) {
    return `past window (evaluated at week ${evalWeek}; target window ends ${deadline})`
  }
  if (chain.conditions?.length && !evaluateAll(chain.conditions, state, flags)) {
    return 'conditions failed (evaluated after the tick)'
  }
  if (chain.probability !== undefined) return 'probability roll failed (inferred)'
  return 'unknown (vanished from the queue with no fire)'
}

/**
 * What the walk knew when a scheduled chain vanished unfired. `preState` and
 * `preFlags` are the snapshot taken just before the week-end tick; `postState`
 * and `postFlags` are the snapshot after it (the closest the walk gets to the
 * state chainStore.process saw at fire time).
 */
export interface DropEvaluation {
  reason: string
  /**
   * Week the tick advanced into. resolveChains evaluates the window at this week,
   * which is the chain's fireWeek for an on-time chain. Not the week being finished.
   */
  evalWeek: number
  /** Plays of the target scene so far in the walk (week and pool item id). */
  targetPlays: Array<{ week: number; id: string }>
  preState: GameState
  preFlags: string[]
  postState: GameState
  postFlags: string[]
}

/**
 * Mirror of initWeek's chain injection (buildChainPrimaryItems plus the pool
 * dedupe), applied to the pool as it stands after injection. Pure: reads only
 * its arguments. The gate order matches the production code.
 */
export function explainChainDelivery(
  sceneId: string,
  week: number,
  visited: readonly string[],
  pool: readonly AgendaItem[],
): { outcome: ChainDeliveryOutcome; detail: string } {
  const chainItemId = `${CHAIN_ITEM_PREFIX}${sceneId}`
  if (pool.some(item => item.id === chainItemId)) return { outcome: 'pushed', detail: chainItemId }
  if (visited.includes(sceneId)) return { outcome: 'skipped visited', detail: 'scene already visited' }
  const scene = SCENE_REGISTRY.get(sceneId)
  if (!scene) return { outcome: 'skipped missing scene', detail: 'not in SCENE_REGISTRY' }
  const { weekAvailable, weekDeadline } = scene
  if (typeof weekAvailable === 'number' && week < weekAvailable) {
    return { outcome: 'skipped window', detail: `opens week ${weekAvailable}` }
  }
  if (typeof weekDeadline === 'number' && week > weekDeadline) {
    return { outcome: 'skipped window', detail: `closed week ${weekDeadline}` }
  }
  const duplicate = pool.find(item => item.sceneId === sceneId)
  if (duplicate) return { outcome: 'skipped duplicate', detail: `pool item ${duplicate.id}` }
  return { outcome: 'dropped after push', detail: 'pushed, then removed by the pool filters' }
}

/** Record what injection did with every target fired by this week's tick. */
function recordChainDeliveries(ledger: TimingLedger, forcedIds: readonly string[]): void {
  const week = useGameStore.getState().currentWeek
  const visited = useNarrativeStore.getState().visitedSceneIds
  const currentPool = pool()
  for (const sceneId of new Set(forcedIds)) {
    const { outcome, detail } = explainChainDelivery(sceneId, week, visited, currentPool)
    ledger.chainDeliveries.push({ week, sceneId, outcome, detail })
  }
}

/** Optional observers for a walk. Hooks never change what the walk does. */
export interface WalkHooks {
  onChainDropped?: (chain: ScheduledChain, week: number, evaluation: DropEvaluation) => void
}

/** Walk weeks 1..103 the way the scripted player does. Records into `ledger`. */
async function walkProfile(profile: Profile, ledger: TimingLedger, hooks: WalkHooks): Promise<number> {
  bootWeek(1, { flags: profile.flags })
  useGameStore.setState({ playerPolling: 78, kolvarPolling: 22 })
  const choose = profile.makeChooser?.()
  let weeksWalked = 0

  for (let week = 1; week <= LAST_WEEK; week++) {
    // Mirrors skipWeekOpening, which the harness does not call.
    scheduleWeekStartChains(week)
    recordOffers(ledger, week)
    recordEligibility(ledger, week)
    recordChainSchedules(ledger, week)

    const playOpts: PlayItemOptions = choose
      ? { choose, onChoices: r => recordChoices(ledger, week, r.endedSceneId ?? 'unknown', r) }
      : {}
    const played = new Set<string>()
    for (let guard = 0; guard < 40; guard++) {
      const next = pool().find(i => !isDone(i) && !played.has(i.id))
      if (!next) break
      played.add(next.id)
      const ok = await playItem(next, playOpts)
      const record = { week, id: next.id, sceneId: next.sceneId }
      if (ok) ledger.played.push(record)
      else ledger.unlaunchable.push(record)
      recordResolutions(ledger, profile.name)
      recordOffers(ledger, week)
    }
    // Chains scheduled by this week's choices, before the tick can fire them.
    recordChainSchedules(ledger, week)

    const pendingBefore = new Map(useChainStore.getState().scheduled.map(c => [c.id, c] as const))
    const preState = useGameStore.getState()
    const preFlags = useNarrativeStore.getState().activeFlags
    await finishWeek()
    recordChainSchedules(ledger, week)
    const remaining = new Set(useChainStore.getState().scheduled.map(c => c.id))
    const forced = useWeekStore.getState().forcedChainIds
    const fired = new Set(forced)
    ledger.chainsFired += forced.length
    const { activeFlags } = useNarrativeStore.getState()
    const afterState = useGameStore.getState()
    const evalWeek = afterState.currentWeek
    for (const [id, chain] of pendingBefore) {
      const target = chain.targetNodeId
      if (remaining.has(id) || fired.has(target)) continue
      if (!ledger.droppedChains.some(d => d.chainId === id)) {
        const reason = dropReason(chain, afterState, activeFlags, evalWeek)
        const targetPlays = ledger.played
          .filter(p => p.sceneId === target)
          .map(p => ({ week: p.week, id: p.id }))
        ledger.droppedChains.push({
          chainId: id,
          target,
          fireWeek: chain.fireWeek,
          week,
          reason,
        })
        hooks.onChainDropped?.(chain, week, {
          reason,
          evalWeek,
          targetPlays,
          preState,
          preFlags,
          postState: afterState,
          postFlags: activeFlags,
        })
      }
      if (!ledger.chainDropped.has(target)) ledger.chainDropped.set(target, week)
    }

    weeksWalked = week
    const landed = useGameStore.getState().currentWeek
    if (week < LAST_WEEK && landed !== week + 1) {
      ledger.notes.push(`week ${week} did not advance (landed on ${landed}); walk stopped`)
      break
    }
    if (week < LAST_WEEK) {
      useWeekStore.getState().initWeek()
      recordChainDeliveries(ledger, forced)
    }
  }
  return weeksWalked
}

/**
 * Choice profiles also seed Math.random, so chain probability rolls repeat
 * from run to run. Returns the restore function.
 */
function seedChanceRolls(profile: Profile): () => void {
  if (!profile.makeChooser) return () => {}
  const spy = vi.spyOn(Math, 'random').mockImplementation(mulberry32(CHOICE_SEED))
  return () => spy.mockRestore()
}

/**
 * The store actions log every step in DEV. Over a 103-week walk vitest's
 * console capture grows past the worker heap, so routine logs are muted for
 * the walk. console.error stays live.
 */
function muteRoutineLogs(): () => void {
  const spies = [
    vi.spyOn(console, 'log').mockImplementation(() => {}),
    vi.spyOn(console, 'info').mockImplementation(() => {}),
    vi.spyOn(console, 'warn').mockImplementation(() => {}),
    vi.spyOn(console, 'debug').mockImplementation(() => {}),
  ]
  return () => spies.forEach(s => s.mockRestore())
}

export interface ProfileResult {
  summary: ProfileSummary
  findings: TimingFinding[]
  votes: VoteRecord[]
  /** What initWeek did with every fired chain target, in walk order. */
  chainDeliveries: ChainDelivery[]
  /** False when the walk did not reach the epilogue (the test marks it soft-failed). */
  reachedEpilogue: boolean
}

/** Walk one profile end to end and turn its ledger into findings and a summary. */
export async function auditProfile(profile: Profile, hooks: WalkHooks = {}): Promise<ProfileResult> {
  const ledger = createLedger()
  let weeksWalked = 0
  const restoreChanceRolls = seedChanceRolls(profile)
  const restoreLogs = muteRoutineLogs()
  try {
    // Reset inside the seeded window so the boot-time mole roll is seeded too.
    resetWorld()
    weeksWalked = await walkProfile(profile, ledger, hooks)
  } catch (err) {
    ledger.notes.push(`walk threw: ${err instanceof Error ? err.message : String(err)}`)
  } finally {
    restoreLogs()
    restoreChanceRolls()
  }
  const reachedEpilogue = useWeekStore.getState().phase === 'epilogue'
  const findings = buildProfileFindings({
    profile: profile.name,
    declarations: DECLARATIONS,
    ledger,
    visitedAtEnd: useNarrativeStore.getState().visitedSceneIds,
    sceneWindowOf,
  })
  const resolvedTotal = [...ledger.resolved.values()].reduce((sum, n) => sum + n, 0)
  const outcomeOffers = [...ledger.offeredWeeks.entries()]
    .filter(([id]) => OUTCOME_ITEM_PATTERN.test(id))
    .map(([id, weeks]) => `${id} (weeks ${weeks.join(',')})`)
  const summary: ProfileSummary = {
    name: profile.name,
    usesChoices: profile.makeChooser !== undefined,
    weeksWalked,
    reachedEpilogue,
    itemsPlayed: ledger.played.length,
    choicesMade: ledger.choicesMade,
    chainsScheduled: ledger.chainIdsScheduled.size,
    chainsFired: ledger.chainsFired,
    chainsDropped: ledger.droppedChains.length,
    notes: [
      ...ledger.notes,
      `chain targets scheduled: ${ledger.chainFirst.size}; delivered: ${ledger.chainDelivered.size}; dropped unfired: ${ledger.chainDropped.size}`,
      `agenda declarations eligible in their window at some week: ${ledger.eligibleWeeks.size}`,
      `votes resolved: ${ledger.votes.length} (passed ${ledger.votes.filter(v => v.passed).length}, failed ${ledger.votes.filter(v => !v.passed).length})`,
      `other virtual items resolved: ${resolvedTotal}`,
      `referendum and aftermath items offered: ${outcomeOffers.join('; ') || 'none'}`,
    ],
  }
  return { summary, findings, votes: ledger.votes, chainDeliveries: ledger.chainDeliveries, reachedEpilogue }
}
