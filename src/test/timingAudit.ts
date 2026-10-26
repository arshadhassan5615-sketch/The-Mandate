// Pure helpers for the scene-timing audit.
//
// The simulations (src/test/timingAudit.nochoice.sim.test.ts and
// src/test/timingAudit.choice.sim.test.ts) walk the real week flow and record
// what the map offered and when. Everything in this file turns those records
// into findings and reports. No store imports here, so the classification
// rules stay unit-testable with small synthetic inputs. The only Node import
// is fs, for writing and merging the partial report files.
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export const LAST_WEEK = 103
/** Scene ids starting with this prefix are virtual screens, not narrative scenes. */
export const VIRTUAL_PREFIX = '__'
/** Pool ids of chain-delivered items (initWeek → buildChainPrimaryItems). */
export const CHAIN_ITEM_PREFIX = '__chain__'

export const FINDING_TYPES = [
  'EARLY',
  'LATE',
  'MISSING',
  'NEVER_OFFERED_MANDATORY',
  'CHAIN_LATE',
  'CHAIN_EARLY',
  'CHAIN_NEVER',
  'CHAIN_DEFERRED',
  'DROPPED_CHAIN',
  'REPEAT',
  'UNLAUNCHABLE',
] as const

export type FindingType = (typeof FINDING_TYPES)[number]

/** Weeks an item may be offered. `deadline: null` means no authored deadline. */
export interface WeekWindow {
  start: number
  deadline: number | null
}

/** One agenda entry as declared in src/data/agenda/*.json. */
export interface AgendaDeclaration {
  file: string
  id: string
  sceneId: string
  fileWeek: number | null
  weekAvailable: number | null
  weekDeadline: number | null
  prerequisites: unknown[]
  isUrgent: boolean
  recurring: boolean
  slotCost: number | null
  executionOrder: number | null
}

/** What the sim saw for one pool item across a whole walk. */
export interface ItemMeta {
  sceneId: string
  weekAvailable: number
  weekDeadline: number | null
  recurring: boolean
  isUrgent: boolean
}

export interface ChainSchedule {
  chainId: string
  fireWeek: number
  scheduledWeek: number
  /** Choice id (or other source) that scheduled the chain, when known. */
  sourceId?: string
  /** Scene id that contained the scheduling choice, when known. */
  sceneId?: string
}

/** A scheduled chain that left the queue without firing (conditions or probability). */
export interface DroppedChain {
  chainId: string
  target: string
  fireWeek: number
  week: number
  reason: string
}

/**
 * What initWeek did with one fired chain target. `pushed` means a __chain__ item
 * reached the pool; every other outcome is a skip, with the gate that skipped it.
 */
export type ChainDeliveryOutcome =
  | 'pushed'
  | 'skipped missing scene'
  | 'skipped visited'
  | 'skipped window'
  | 'skipped duplicate'
  | 'dropped after push'

export interface ChainDelivery {
  week: number
  sceneId: string
  outcome: ChainDeliveryOutcome
  /** Pool item id that made a duplicate skip (agenda entry), or the visit/window detail. */
  detail: string
}

/** Raw observations from one profile's walk. Arrays hold unique weeks. */
export interface TimingLedger {
  itemMeta: Map<string, ItemMeta>
  /** Pool item id → weeks it was in the pool and not done (the map's "offered"). */
  offeredWeeks: Map<string, number[]>
  /** Agenda declaration id → weeks its gates passed at week start, not yet done. */
  eligibleWeeks: Map<string, number[]>
  played: Array<{ week: number; id: string; sceneId: string }>
  unlaunchable: Array<{ week: number; id: string; sceneId: string }>
  /** Chain target scene id → first schedule seen. */
  chainFirst: Map<string, ChainSchedule>
  /**
   * Chain target scene id → every distinct chain entry scheduled to it. A target
   * can have several sources; CHAIN_EARLY/LATE judge the earliest of them.
   */
  chainSchedules: Map<string, ChainSchedule[]>
  /** Chain target scene id → first week a __chain__ item for it was offered. */
  chainDelivered: Map<string, number>
  /** Chain target scene id → week a scheduled entry vanished unfired (dropped). */
  chainDropped: Map<string, number>
  /** Every scheduled chain entry seen, by chain id. */
  chainIdsScheduled: Set<string>
  /** Every chain entry that vanished unfired, with the reason it was dropped. */
  droppedChains: DroppedChain[]
  /** Total chain targets fired by completeWeek ticks (forcedChainIds, summed). */
  chainsFired: number
  /** Every fired chain target and what injection did with it (initWeek). */
  chainDeliveries: ChainDelivery[]
  /** Choices made through processChoice across the walk. */
  choicesMade: number
  /** Every `__vote__` item resolved across the walk, in order. */
  votes: VoteRecord[]
  /** Count of resolved virtual phase items by scene id (votes excluded). */
  resolved: Map<string, number>
  notes: string[]
}

/** One `__vote__` item as resolved by the harness (LobbyingInterface's tally). */
export interface VoteRecord {
  profile: string
  week: number
  itemId: string
  sceneId: string
  voteType: string
  threshold: number
  totalSeats: number
  yes: number
  no: number
  undecided: number
  margin: number
  spendLevel: number
  passed: boolean
  flagsApplied: string[]
  lobbyingEnabled: boolean
}

export interface TimingFinding {
  profile: string
  type: FindingType
  id: string
  sceneId: string
  week: number | null
  weeks: number[]
  window: string
  details: string
}

export interface ProfileSummary {
  name: string
  /** True when the profile picks choices inside scenes (choice profiles). */
  usesChoices: boolean
  weeksWalked: number
  reachedEpilogue: boolean
  itemsPlayed: number
  choicesMade: number
  chainsScheduled: number
  chainsFired: number
  chainsDropped: number
  notes: string[]
}

export interface TimingReport {
  rules: string
  profiles: ProfileSummary[]
  findings: TimingFinding[]
  votes: VoteRecord[]
}

export function createLedger(): TimingLedger {
  return {
    itemMeta: new Map(),
    offeredWeeks: new Map(),
    eligibleWeeks: new Map(),
    played: [],
    unlaunchable: [],
    chainFirst: new Map(),
    chainSchedules: new Map(),
    chainDelivered: new Map(),
    chainDropped: new Map(),
    chainIdsScheduled: new Set(),
    droppedChains: [],
    chainsFired: 0,
    chainDeliveries: [],
    choicesMade: 0,
    votes: [],
    resolved: new Map(),
    notes: [],
  }
}

/** Append `week` to `map[key]` unless already present. */
export function pushUnique(map: Map<string, number[]>, key: string, week: number): void {
  const list = map.get(key)
  if (!list) {
    map.set(key, [week])
    return
  }
  if (!list.includes(week)) list.push(week)
}

// ─── Declarations ────────────────────────────────────────────────────────────

interface RawAgendaEntry {
  id?: unknown
  sceneId?: unknown
  weekAvailable?: unknown
  weekDeadline?: unknown
  prerequisites?: unknown
  isUrgent?: unknown
  recurring?: unknown
  slotCost?: unknown
  executionOrder?: unknown
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function baseName(path: string): string {
  return path.split(/[\\/]/).pop() ?? path
}

/** Week number from an agenda file name (`week14_neg.json` → 14). Project files → null. */
export function parseFileWeek(file: string): number | null {
  const match = /^week(\d+)/.exec(baseName(file))
  return match ? Number(match[1]) : null
}

/** Accepts either a bare array or `{ agenda: [...] }`, the two shapes weekStore accepts. */
function entriesOf(json: unknown): RawAgendaEntry[] {
  if (Array.isArray(json)) return json as RawAgendaEntry[]
  const agenda = (json as { agenda?: unknown } | null | undefined)?.agenda
  return Array.isArray(agenda) ? (agenda as RawAgendaEntry[]) : []
}

/**
 * Declarations from parsed agenda files, keyed by file path or name.
 * Entries without a string id and sceneId are skipped (weekStore drops them too).
 */
export function loadAgendaDeclarations(files: Record<string, unknown>): AgendaDeclaration[] {
  return Object.entries(files).flatMap(([path, json]) => {
    const file = baseName(path)
    const fileWeek = parseFileWeek(file)
    return entriesOf(json)
      .filter(e => e && typeof e.id === 'string' && typeof e.sceneId === 'string')
      .map(e => ({
        file,
        id: e.id as string,
        sceneId: e.sceneId as string,
        fileWeek,
        weekAvailable: numberOrNull(e.weekAvailable),
        weekDeadline: numberOrNull(e.weekDeadline),
        prerequisites: Array.isArray(e.prerequisites) ? e.prerequisites : [],
        isUrgent: e.isUrgent === true,
        recurring: e.recurring === true,
        slotCost: numberOrNull(e.slotCost),
        executionOrder: numberOrNull(e.executionOrder),
      }))
  })
}

// ─── Windows ─────────────────────────────────────────────────────────────────

/**
 * Declared window for an agenda entry.
 * start    = weekAvailable ?? fileWeek ?? 1. weekAvailable is the only field the
 *            engine reads; fileWeek is an audit-only fallback (absent in current data).
 * deadline = weekDeadline. null means the engine applies no deadline.
 */
export function declaredWindow(
  decl: Pick<AgendaDeclaration, 'fileWeek' | 'weekAvailable' | 'weekDeadline'>,
): WeekWindow {
  return { start: decl.weekAvailable ?? decl.fileWeek ?? 1, deadline: decl.weekDeadline }
}

/** Scene window from scene JSON. Absent scene → null (no scene constraint). */
export function sceneWindow(
  scene: { weekAvailable?: number; weekDeadline?: number } | undefined,
): WeekWindow | null {
  if (!scene) return null
  return { start: scene.weekAvailable ?? 1, deadline: scene.weekDeadline ?? null }
}

/** Last week the window is open. With no deadline, the audit horizon applies. */
export function windowEnd(win: WeekWindow): number {
  return win.deadline ?? LAST_WEEK
}

export function isInWindow(win: WeekWindow, week: number): boolean {
  return week >= win.start && week <= windowEnd(win)
}

/** Intersection of two windows: latest start, earliest deadline. */
export function mergeWindows(a: WeekWindow, b: WeekWindow | null): WeekWindow {
  if (!b) return a
  const deadlines = [a.deadline, b.deadline].filter((d): d is number => d !== null)
  return {
    start: Math.max(a.start, b.start),
    deadline: deadlines.length > 0 ? Math.min(...deadlines) : null,
  }
}

export function describeWindow(win: WeekWindow): string {
  return `${win.start}-${win.deadline ?? 'open'}`
}

// ─── Classification ──────────────────────────────────────────────────────────

export function firstWeek(weeks: readonly number[]): number | null {
  return weeks.length > 0 ? Math.min(...weeks) : null
}

/** EARLY: first offer before the window opens. LATE: first offer after the deadline. */
export function classifyOfferTiming(win: WeekWindow, offeredWeeks: readonly number[]): 'EARLY' | 'LATE' | null {
  const first = firstWeek(offeredWeeks)
  if (first === null) return null
  if (first < win.start) return 'EARLY'
  if (win.deadline !== null && first > win.deadline) return 'LATE'
  return null
}

/** MISSING: eligible at some week inside the window, yet never offered inside it. */
export function classifyMissing(
  win: WeekWindow,
  eligibleWeeks: readonly number[],
  offeredWeeks: readonly number[],
): boolean {
  const eligibleInWindow = eligibleWeeks.some(w => isInWindow(win, w))
  const offeredInWindow = offeredWeeks.some(w => isInWindow(win, w))
  return eligibleInWindow && !offeredInWindow
}

/** NEVER_OFFERED_MANDATORY: an entry marked urgent that was never offered in any week. */
export function classifyNeverOfferedMandatory(isMandatory: boolean, offeredWeeks: readonly number[]): boolean {
  return isMandatory && offeredWeeks.length === 0
}

/** REPEAT: a non-repeatable item played in more than one distinct week. */
export function classifyRepeat(playedWeeks: readonly number[], recurring: boolean): boolean {
  return !recurring && new Set(playedWeeks).size > 1
}

/**
 * CHAIN_LATE / CHAIN_EARLY compare the week the chain was delivered (offered
 * through its __chain__ item) with its scheduled fireWeek. CHAIN_NEVER means it
 * was never delivered and its target was never visited. A target visited by
 * another route is satisfied, so it is not a finding.
 */
export function classifyChain(
  fireWeek: number,
  deliveredWeek: number | null,
  targetVisited: boolean,
): 'CHAIN_NEVER' | 'CHAIN_LATE' | 'CHAIN_EARLY' | null {
  if (deliveredWeek === null) return targetVisited ? null : 'CHAIN_NEVER'
  if (deliveredWeek > fireWeek) return 'CHAIN_LATE'
  if (deliveredWeek < fireWeek) return 'CHAIN_EARLY'
  return null
}

// ─── Findings ────────────────────────────────────────────────────────────────

export function dedupeFindings(findings: readonly TimingFinding[]): TimingFinding[] {
  const seen = new Set<string>()
  return findings.filter(f => {
    const key = `${f.profile}|${f.type}|${f.id}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

interface ItemView {
  id: string
  sceneId: string
  own: WeekWindow
  recurring: boolean
  isUrgent: boolean
  declared: boolean
}

interface Base {
  profile: string
  id: string
  sceneId: string
  window: string
}

function makeFinding(base: Base, type: FindingType, weeks: readonly number[], details: string): TimingFinding {
  return {
    ...base,
    type,
    week: firstWeek(weeks),
    weeks: [...weeks].sort((a, b) => a - b),
    details,
  }
}

function itemViews(declarations: readonly AgendaDeclaration[], ledger: TimingLedger): ItemView[] {
  const declaredIds = new Set(declarations.map(d => d.id))
  const views: ItemView[] = declarations.map(d => ({
    id: d.id,
    sceneId: d.sceneId,
    own: declaredWindow(d),
    recurring: d.recurring,
    isUrgent: d.isUrgent,
    declared: true,
  }))
  for (const [id, meta] of ledger.itemMeta) {
    if (declaredIds.has(id) || id.startsWith(CHAIN_ITEM_PREFIX)) continue
    views.push({
      id,
      sceneId: meta.sceneId,
      own: { start: meta.weekAvailable, deadline: meta.weekDeadline },
      recurring: meta.recurring,
      isUrgent: meta.isUrgent,
      declared: false,
    })
  }
  return views
}

function countBy(values: readonly string[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1)
  return counts
}

export interface ProfileInput {
  profile: string
  declarations: readonly AgendaDeclaration[]
  ledger: TimingLedger
  visitedAtEnd: readonly string[]
  sceneWindowOf: (sceneId: string) => WeekWindow | null
}

/** Turn one profile's ledger into deduplicated findings. */
export function buildProfileFindings(input: ProfileInput): TimingFinding[] {
  const { profile, declarations, ledger, visitedAtEnd, sceneWindowOf } = input
  const out: TimingFinding[] = []
  const sceneUsers = countBy(declarations.map(d => d.sceneId))

  for (const view of itemViews(declarations, ledger)) {
    const virtual = view.sceneId.startsWith(VIRTUAL_PREFIX)
    // Recurring entries are week-scoped occurrences of a shared scene: the
    // scene's own window describes its first occurrence only, so it is not merged.
    const sceneScoped = !virtual && !view.recurring
    const win = mergeWindows(view.own, sceneScoped ? sceneWindowOf(view.sceneId) : null)
    const offered = ledger.offeredWeeks.get(view.id) ?? []
    const eligible = ledger.eligibleWeeks.get(view.id) ?? []
    const played = ledger.played.filter(p => p.id === view.id).map(p => p.week)
    const unlaunched = ledger.unlaunchable.filter(u => u.id === view.id).map(u => u.week)
    const users = sceneUsers.get(view.sceneId) ?? 1
    const shared = users > 1 ? ` sceneId shared by ${users} entries.` : ''
    const base: Base = { profile, id: view.id, sceneId: view.sceneId, window: describeWindow(win) }

    const timing = classifyOfferTiming(win, offered)
    if (timing === 'EARLY') {
      out.push(makeFinding(base, 'EARLY', offered, `first offered week ${firstWeek(offered)}, window opens ${win.start}.${shared}`))
    } else if (timing === 'LATE') {
      out.push(makeFinding(base, 'LATE', offered, `first offered week ${firstWeek(offered)}, window closed after ${win.deadline}.${shared}`))
    }

    if (view.declared && classifyMissing(win, eligible, offered)) {
      out.push(makeFinding(base, 'MISSING', eligible.filter(w => isInWindow(win, w)), `eligible in window, never offered in it.${shared}`))
    }

    if (classifyNeverOfferedMandatory(view.isUrgent, offered)) {
      const detail = eligible.length > 0
        ? `marked urgent, never offered; eligible in weeks ${eligible.join(',')}.`
        : 'marked urgent, never offered; never eligible (prerequisites or scene gates never passed).'
      out.push(makeFinding(base, 'NEVER_OFFERED_MANDATORY', eligible, detail + (visitedAtEnd.includes(view.sceneId) ? ' Scene visited via another entry.' : '')))
    }

    if (!virtual && classifyRepeat(played, view.recurring)) {
      out.push(makeFinding(base, 'REPEAT', played, `played in weeks ${played.join(',')}.${shared}`))
    }

    if (unlaunched.length > 0) {
      out.push(makeFinding(base, 'UNLAUNCHABLE', unlaunched, `playItem returned false in weeks ${unlaunched.join(',')}.`))
    }
  }

  out.push(...chainFindings(profile, ledger, visitedAtEnd, sceneWindowOf, declarations))
  out.push(...droppedChainFindings(profile, ledger))
  return dedupeFindings(out)
}

/**
 * A chain delivered late only because its target scene opens after the fire
 * week is the engine's deferral (chainStore keeps it queued), not a timing bug
 * in the chain itself, so it is reported as CHAIN_DEFERRED.
 */
function deferredByScene(fireWeek: number, win: WeekWindow | null): boolean {
  return win !== null && win.start > fireWeek
}

/** True when an agenda entry for the scene had already opened by `week`. */
function agendaOpenedBy(
  sceneId: string,
  week: number,
  declarations: readonly AgendaDeclaration[],
): boolean {
  return declarations.some(d => d.sceneId === sceneId && declaredWindow(d).start <= week)
}

/** Every chain entry scheduled to `target`, or the first one seen if the ledger has no full list. */
function schedulesFor(ledger: TimingLedger, target: string, first: ChainSchedule): ChainSchedule[] {
  return ledger.chainSchedules.get(target) ?? [first]
}

function chainFindings(
  profile: string,
  ledger: TimingLedger,
  visitedAtEnd: readonly string[],
  sceneWindowOf: (sceneId: string) => WeekWindow | null,
  declarations: readonly AgendaDeclaration[],
): TimingFinding[] {
  const out: TimingFinding[] = []
  for (const [target, first] of ledger.chainFirst) {
    const scheds = schedulesFor(ledger, target, first)
    // The earliest pending fire week among every chain to this target is the
    // week a delivery is judged against. A later-scheduled chain that fires
    // first is a legitimate source, not an early delivery.
    const fireWeek = Math.min(...scheds.map(s => s.fireWeek))
    const delivered = ledger.chainDelivered.get(target) ?? null
    const kind = classifyChain(fireWeek, delivered, visitedAtEnd.includes(target))
    if (!kind) continue
    // An agenda entry that had already opened justifies an earlier delivery.
    if (kind === 'CHAIN_EARLY' && delivered !== null && agendaOpenedBy(target, delivered, declarations)) continue
    const win = sceneWindowOf(target)
    const deferred = deferredByScene(fireWeek, win)
    const dropped = ledger.chainDropped.get(target)
    const sources = scheds
      .map(s => `scheduled in week ${s.scheduledWeek} for fire week ${s.fireWeek}${s.sourceId ? ` by ${s.sourceId}` : ''}`)
      .join('; ')
    const parts = [
      sources,
      delivered === null ? 'never delivered' : `delivered week ${delivered}`,
      dropped === undefined ? '' : `vanished unfired in week ${dropped} (conditions/probability)`,
      deferred ? `deferred: scene opens week ${win?.start}` : '',
    ].filter(Boolean)
    const base: Base = {
      profile,
      id: `${CHAIN_ITEM_PREFIX}${target}`,
      sceneId: target,
      window: `fire ${fireWeek}`,
    }
    const type = kind === 'CHAIN_LATE' && deferred ? 'CHAIN_DEFERRED' : kind
    out.push(makeFinding(base, type, delivered === null ? [] : [delivered], parts.join('; ') + '.'))
  }
  return out
}

/**
 * Informational: one finding per scheduled chain entry that left the queue
 * unfired. The id is the chain entry id, so two drops of one target stay apart.
 */
function droppedChainFindings(profile: string, ledger: TimingLedger): TimingFinding[] {
  return ledger.droppedChains.map(d => makeFinding(
    { profile, id: d.chainId, sceneId: d.target, window: `fire ${d.fireWeek}` },
    'DROPPED_CHAIN',
    [d.week],
    `${d.chainId} dropped in week ${d.week}: ${d.reason}.`,
  ))
}

// ─── Reporting ───────────────────────────────────────────────────────────────

export const RULES_TEXT = [
  'Declared windows (static, from src/data/agenda/*.json and scene JSON):',
  '- Agenda entry start = weekAvailable. The engine (weekStore buildPool) reads only weekAvailable.',
  '  The audit falls back to the file week (weekNN in the file name) only when weekAvailable is absent; all current entries have it.',
  '- Agenda entry end = weekDeadline. When there is no deadline, the engine applies none: the item is offered every week from its start until its scene is visited (or the game ends). The audit uses week 103 as the horizon and never reports LATE for open-ended entries.',
  '- Scene window = scene JSON weekAvailable (default 1) and weekDeadline. Effective window = latest start, earliest deadline of agenda and scene windows.',
  '- Code-injected items (ids outside the JSON bank, e.g. week-specific story scenes, petitions, press conferences, campaign rallies, radio, __budget__) use their own code-set weekAvailable/weekDeadline.',
  '',
  'initWeek / buildPool rules (src/stores/weekStore.ts) used to decide what is offered:',
  '1. Candidate pool = every entry in every agenda JSON file, plus the code-injected items listed in initWeek.',
  '2. Week gate: dropped when weekAvailable > currentWeek, or when weekDeadline is set and currentWeek > weekDeadline.',
  '3. Prerequisites: each entry prerequisites[] must all pass evaluateAll(conditions, gameState, activeFlags).',
  '4. Scene gate (non-__ scenes only): scene.prerequisiteSceneIds must all be visited, and scene.prerequisiteFlags must all be active. Scene weekAvailable/weekDeadline are NOT checked here.',
  '5. Chain injection: forcedChainIds (set by completeWeek on the tick) become __chain__<sceneId> items with weekAvailable = current week. Deduped by sceneId, skipped if already visited or the scene is missing. Skipped when the pool already holds an item with the same sceneId. Confidence-vote and impeachment companions are queued by confirmAgenda, not the pool.',
  '6. Mid-week rebuild (advanceQueue) re-runs step 2-4 on the JSON bank and carries forward code-injected items that are not yet done. Chain items are not re-injected mid-week.',
  '7. Pool is sorted by executionOrder. No cap or exclusivity applies in the pool: the slot budget (SLOT_MAX) only limits what the player selects in confirmAgenda, and the harness plays every offered item.',
  '8. Done = completedItemIds includes the item id, or (non-recurring) visitedSceneIds includes the sceneId. Recurring entries are done per week only. Entries that share a sceneId are done together.',
  '',
  'Chain scheduling and delivery:',
  '- Scheduled by chainStore.schedule: choice commits (narrativeStore.processChoice), the assassination trigger in completeWeek (delay 0), and week-start dinner/briefing chains (scheduleWeekStartChains, which skipWeekOpening calls; the audit calls it at each week start, the harness does not).',
  '- Fired by chainStore.process(newWeek) inside completeWeek: fires when fireWeek <= week; deferred while the target scene weekAvailable is later; dropped when conditions fail or the probability roll fails; overdue fires capped at MAX_OVERDUE_CHAINS_PER_WEEK (2) per tick.',
  '- Expected delivery week = the fire week (the next initWeek shows the fired chain).',
  '',
  '- CHAIN_DEFERRED: delivered after the fire week only because the target scene opens later (chainStore keeps it queued). DROPPED_CHAIN (informational): a scheduled chain left the queue unfired; reason is conditions (re-evaluated after the tick) or a failed probability roll.',
  '',
  'Harness limits: no-choice profiles play every offered item in pool order and pick no choices, so choice-driven chains and choice flags never occur for them. Choice profiles (*-chooser, seeded-random) play each narrative scene through processChoice with a deterministic picker (src/test/choicePlayer.ts), so choice flags and choice-driven chains do occur. Their picks are a policy, not a real player. Choice profiles also seed Math.random (chain probability rolls). CHAIN_* results describe only the chains each walk produces.',
  '',
  'Virtual phase items (src/test/simHarness.ts resolveVirtual) call the same code the phase screen calls:',
  '- __vote__: LobbyingInterface.handleCommit logic (calculateProjection + applySpending from live faction support, spend 0 by default, outcome flags from voteConfig, assemblyVoteMargin). Items with lobbyingEnabled false are tallied the same way, although the real screen does not tally them (see the Votes section).',
  '- __constitution__: ConstitutionalReform.handleFinalize with the first variant of each provision (default provisions).',
  '- __budget__ and __radio__: their commit actions. __cabinet_reshuffle__ is not reshuffled (its commit needs a candidate).',
  '- __project__*: real scene JSON, played and marked visited like narrative scenes.',
  '- Parliament sittings are not agenda items. They are raised from the press phase (weekStore.endPress), which the harness does not enter, so they are not audited.',
].join('\n')

/** Partial report files, one per audit group. Merged by writeTimingGroup. */
export const PARTIAL_REPORT_FILES = {
  nochoice: 'timing-report.nochoice.json',
  choice: 'timing-report.choice.json',
} as const

export type TimingGroup = keyof typeof PARTIAL_REPORT_FILES

/**
 * Concatenate partial reports in the order given. Profile names must be unique
 * across parts: a profile audited twice would double its findings.
 */
export function mergeTimingReports(parts: readonly TimingReport[]): TimingReport {
  if (parts.length === 0) throw new Error('mergeTimingReports: no parts to merge')
  const names = parts.flatMap(p => p.profiles.map(q => q.name))
  const duplicates = names.filter((name, i) => names.indexOf(name) !== i)
  if (duplicates.length > 0) {
    throw new Error(`mergeTimingReports: duplicate profile(s): ${[...new Set(duplicates)].join(', ')}`)
  }
  return {
    rules: parts[0].rules,
    profiles: parts.flatMap(p => p.profiles),
    findings: parts.flatMap(p => p.findings),
    votes: parts.flatMap(p => p.votes),
  }
}

/** Write atomically: a reader never sees a half-written file. */
function writeFileAtomic(path: string, text: string): void {
  const tmp = `${path}.tmp`
  writeFileSync(tmp, text)
  renameSync(tmp, path)
}

/**
 * Write one group's partial report into `dir`. When both partial files exist,
 * merge them into timing-report.json and timing-report.md. Whichever group
 * finishes last does the merge, so running the two audit files in either
 * order (or in parallel) produces the same merged report. If one group is
 * rerun alone, the other group's partial file is reused as it stands.
 */
export function writeTimingGroup(dir: string, group: TimingGroup, report: TimingReport): { merged: boolean } {
  writeFileAtomic(join(dir, PARTIAL_REPORT_FILES[group]), JSON.stringify(report, null, 2) + '\n')
  const paths = Object.values(PARTIAL_REPORT_FILES).map(name => join(dir, name))
  if (!paths.every(p => existsSync(p))) return { merged: false }
  const parts = paths.map(p => JSON.parse(readFileSync(p, 'utf8')) as TimingReport)
  const merged = mergeTimingReports(parts)
  writeFileAtomic(join(dir, 'timing-report.json'), JSON.stringify(merged, null, 2) + '\n')
  writeFileAtomic(join(dir, 'timing-report.md'), renderMarkdown(merged))
  return { merged: true }
}

function escapeCell(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\n/g, ' ')
}

function table(headers: readonly string[], rows: readonly (readonly string[])[]): string {
  const head = `| ${headers.join(' | ')} |`
  const sep = `| ${headers.map(() => '---').join(' | ')} |`
  const body = rows.map(r => `| ${r.map(escapeCell).join(' | ')} |`)
  return [head, sep, ...body].join('\n')
}

function byWeek(a: TimingFinding, b: TimingFinding): number {
  return (a.week ?? Number.MAX_SAFE_INTEGER) - (b.week ?? Number.MAX_SAFE_INTEGER)
    || a.profile.localeCompare(b.profile)
    || a.id.localeCompare(b.id)
}

interface GroupedFinding {
  type: FindingType
  id: string
  sceneId: string
  window: string
  profiles: string[]
  week: number | null
  details: string
}

/** One row per (type, id), counting the profiles that hit it. */
export function groupAcrossProfiles(findings: readonly TimingFinding[]): GroupedFinding[] {
  const groups = new Map<string, GroupedFinding>()
  for (const f of findings) {
    const key = `${f.type}|${f.id}`
    const existing = groups.get(key)
    if (!existing) {
      groups.set(key, {
        type: f.type,
        id: f.id,
        sceneId: f.sceneId,
        window: f.window,
        profiles: [f.profile],
        week: f.week,
        details: f.details,
      })
      continue
    }
    if (!existing.profiles.includes(f.profile)) existing.profiles.push(f.profile)
    if (f.week !== null && (existing.week === null || f.week < existing.week)) existing.week = f.week
  }
  return [...groups.values()].sort((a, b) =>
    b.profiles.length - a.profiles.length
    || (a.week ?? Number.MAX_SAFE_INTEGER) - (b.week ?? Number.MAX_SAFE_INTEGER)
    || a.id.localeCompare(b.id),
  )
}

export function countByType(findings: readonly TimingFinding[]): Record<FindingType, number> {
  const counts = Object.fromEntries(FINDING_TYPES.map(t => [t, 0])) as Record<FindingType, number>
  for (const f of findings) counts[f.type] += 1
  return counts
}

/** Votes section: one row per vote item played, grouped per profile in walk order. */
export function renderVotes(votes: readonly VoteRecord[]): string {
  const rows = votes.map(v => [
    v.profile,
    String(v.week),
    v.itemId,
    v.voteType,
    `${v.yes}-${v.no}-${v.undecided} of ${v.totalSeats}`,
    String(v.threshold),
    String(v.spendLevel),
    v.passed ? 'PASSED' : 'FAILED',
    v.flagsApplied.join(', ') || '-',
    v.lobbyingEnabled ? '' : 'lobbying off (real screen does not tally)',
  ])
  const body = rows.length === 0
    ? '_none_'
    : table(['profile', 'week', 'item', 'type', 'yes-no-undecided', 'threshold', 'spend', 'result', 'flags applied', 'note'], rows)
  return `## Votes (${votes.length})\n\n${body}`
}

export function renderMarkdown(report: TimingReport): string {
  const total = report.profiles.length
  const sections: string[] = []
  sections.push('# Scene timing audit\n\nGenerated by `MANDATE_TIMING=1 npx vitest run src/test/timingAudit.nochoice.sim.test.ts` and `MANDATE_TIMING=1 npx vitest run src/test/timingAudit.choice.sim.test.ts` (the second run merges the two partial reports). Report only: no game code or data was changed.')
  sections.push(`## Rules\n\n\`\`\`text\n${report.rules}\n\`\`\``)
  sections.push('## Profiles\n\n' + table(
    ['profile', 'choices', 'weeks walked', 'reached epilogue', 'items played', 'choices made', 'chains scheduled', 'chains fired', 'chains dropped', 'notes'],
    report.profiles.map(p => [
      p.name,
      p.usesChoices ? 'picks' : 'none',
      String(p.weeksWalked),
      p.reachedEpilogue ? 'yes' : 'no',
      String(p.itemsPlayed),
      String(p.choicesMade),
      String(p.chainsScheduled),
      String(p.chainsFired),
      String(p.chainsDropped),
      p.notes.join('; ') || '-',
    ]),
  ))

  const counts = countByType(report.findings)
  sections.push('## Totals by type\n\n' + table(
    ['type', 'findings'],
    FINDING_TYPES.map(t => [t, String(counts[t])]),
  ))

  sections.push(renderVotes(report.votes))

  const grouped = groupAcrossProfiles(report.findings)
  sections.push('## Top 40 findings (by profiles affected)\n\n' + table(
    ['profiles', 'type', 'id', 'sceneId', 'window', 'first week', 'details'],
    grouped.slice(0, 40).map(g => [`${g.profiles.length}/${total}`, g.type, g.id, g.sceneId, g.window, g.week === null ? '-' : String(g.week), g.details]),
  ))

  for (const type of FINDING_TYPES) {
    const rows = report.findings.filter(f => f.type === type).sort(byWeek)
    sections.push(`## ${type} (${rows.length})\n\n` + (rows.length === 0 ? '_none_' : table(
      ['week', 'profile', 'id', 'sceneId', 'window', 'details'],
      rows.map(f => [f.week === null ? '-' : String(f.week), f.profile, f.id, f.sceneId, f.window, f.details]),
    )))
  }

  const scenes = new Map<string, { profiles: Set<string>; types: Set<FindingType> }>()
  for (const f of report.findings) {
    const entry = scenes.get(f.sceneId) ?? { profiles: new Set<string>(), types: new Set<FindingType>() }
    entry.profiles.add(f.profile)
    entry.types.add(f.type)
    scenes.set(f.sceneId, entry)
  }
  const sceneRows = [...scenes.entries()]
    .sort((a, b) => b[1].profiles.size - a[1].profiles.size || a[0].localeCompare(b[0]))
    .map(([sceneId, e]) => [sceneId, `${e.profiles.size}/${total}`, [...e.types].join(', ')])
  sections.push('## Per-scene cross-profile counts\n\n' + table(['sceneId', 'profiles hit', 'types'], sceneRows))

  return sections.join('\n\n') + '\n'
}
