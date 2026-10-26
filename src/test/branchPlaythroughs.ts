// Branch playthroughs and dropped-chain proof (test-only helpers).
// Used only by branchPlaythroughs.sim.test.ts. Drives the real stores through
// simHarness; changes no game code or data.
import { vi } from 'vitest'

import { useGameStore } from '../stores/gameStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import { useWeekStore } from '../stores/weekStore'
import { evaluateCondition } from '../engine/conditionEvaluator'
import { SCENE_REGISTRY, getScene } from '../engine/NarrativeEngine'
import { scheduleWeekStartChains } from '../engine/weekStartChains'
import type { ScheduledChain } from '../engine/ChainReactionEngine'
import type { Condition, NarrativeNode, StatCondition } from '../types/narrative'
import type { GameState, StateModifier } from '../types/gameState'
import { loadAgendaDeclarations, type AgendaDeclaration } from './timingAudit'
import type { DropEvaluation } from './timingAuditWalk'
import type { ChainDelivery, ChainDeliveryOutcome } from './timingAudit'
import {
  resetWorld,
  bootWeek,
  pool,
  isDone,
  playItem,
  finishWeek,
} from './simHarness'
import { mulberry32, seededPick, type PickChoice } from './choicePlayer'

// ---------------------------------------------------------------------------
// Urgent-entry world planning. Copied from branchReachability.test.ts rather
// than imported: importing a *.test.ts file would register its describe blocks
// in this run. Keep the two copies in step if either changes.
// ---------------------------------------------------------------------------

const agendaModules = import.meta.glob('../data/agenda/*.json', { eager: true })
const AGENDA_FILES: Record<string, unknown> = Object.fromEntries(
  Object.entries(agendaModules).map(([path, mod]) => [
    path,
    (mod as { default?: unknown } | null)?.default ?? mod,
  ]),
)

/** One urgent agenda entry with its scene and the first week it can be offered. */
export interface MandatoryCase {
  id: string
  sceneId: string
  week: number
  entry: AgendaDeclaration
  scene: NarrativeNode | undefined
  conditions: Condition[]
}

/** What the world must hold before the week is booted. */
export interface WorldPlan {
  flags: Map<string, boolean>
  stats: Map<string, number>
  visited: string[]
  problems: string[]
}

function sceneWeekFloor(scene: NarrativeNode | undefined): number {
  return typeof scene?.weekAvailable === 'number' ? scene.weekAvailable : 1
}

function toCase(entry: AgendaDeclaration): MandatoryCase {
  const scene = getScene(entry.sceneId)
  const sceneConditions = scene?.prerequisites ?? []
  return {
    id: entry.id,
    sceneId: entry.sceneId,
    week: Math.max(entry.weekAvailable ?? 1, sceneWeekFloor(scene)),
    entry,
    scene,
    conditions: [...(entry.prerequisites as Condition[]), ...sceneConditions],
  }
}

/** Every urgent entry, the same mandatory rule the timing audit uses (isUrgent). */
export function mandatoryCases(): MandatoryCase[] {
  return loadAgendaDeclarations(AGENDA_FILES)
    .filter(d => d.isUrgent)
    .map(toCase)
}

function requireFlag(plan: WorldPlan, flag: string, value: boolean, source: string): void {
  const prior = plan.flags.get(flag)
  if (prior !== undefined && prior !== value) {
    plan.problems.push(`flag "${flag}" must be ${value} (${source}) and ${prior} elsewhere`)
    return
  }
  plan.flags.set(flag, value)
}

function describeStat(c: StatCondition): string {
  return `${c.stat} ${c.operator} ${String(c.value)}`
}

function satisfies(v: number, op: StatCondition['operator'], expected: number): boolean {
  switch (op) {
    case '>':  return v > expected
    case '<':  return v < expected
    case '>=': return v >= expected
    case '<=': return v <= expected
    case '==': return v === expected
    case '!=': return v !== expected
  }
}

/**
 * A value for one stat that satisfies every numeric condition on it. Candidates
 * are each bound and its neighbours. Returns null when no candidate works.
 */
function solveStat(conds: StatCondition[]): number | null {
  const candidates = [...new Set(conds.flatMap(c => {
    const n = Number(c.value)
    return [n, n - 1, n + 1]
  }))]
  return candidates.find(v => conds.every(c => satisfies(v, c.operator, Number(c.value)))) ?? null
}

function planFlagCondition(plan: WorldPlan, flag: string, op: string, value: unknown, source: string): void {
  if (typeof value !== 'boolean' || (op !== '==' && op !== '!=')) {
    plan.problems.push(`unsupported flag condition ${flag} ${op} ${String(value)} (${source})`)
    return
  }
  requireFlag(plan, flag, op === '==' ? value : !value, source)
}

function planCondition(plan: WorldPlan, c: Condition, source: string, numeric: Map<string, StatCondition[]>): void {
  if ('flag' in c) {
    requireFlag(plan, c.flag, c.value, source)
    return
  }
  if (c.stat.startsWith('flags.')) {
    planFlagCondition(plan, c.stat.slice('flags.'.length), c.operator, c.value, source)
    return
  }
  if (typeof c.value !== 'number') {
    plan.problems.push(`unsupported non-numeric stat condition ${describeStat(c)} (${source})`)
    return
  }
  numeric.set(c.stat, [...(numeric.get(c.stat) ?? []), c])
}

/** Turn one case's conditions, scene prerequisites and prerequisite flags into a plan. */
export function planWorld(item: MandatoryCase): WorldPlan {
  const plan: WorldPlan = { flags: new Map(), stats: new Map(), visited: [], problems: [] }
  const numeric = new Map<string, StatCondition[]>()
  item.conditions.forEach(c => planCondition(plan, c, 'prerequisite', numeric))

  for (const [stat, conds] of numeric) {
    const value = solveStat(conds)
    if (value === null) {
      plan.problems.push(`no value of ${stat} satisfies ${conds.map(describeStat).join(' and ')}`)
    } else {
      plan.stats.set(stat, value)
    }
  }

  const scene = item.scene
  for (const flag of scene?.prerequisiteFlags ?? []) requireFlag(plan, flag, true, 'scene prerequisiteFlags')
  for (const sceneId of scene?.prerequisiteSceneIds ?? []) {
    if (sceneId === item.sceneId) plan.problems.push(`scene requires its own scene "${sceneId}" as a prerequisite`)
    plan.visited.push(sceneId)
  }
  return plan
}

/** Seed for the choice picker and the chain probability rolls in branch playthroughs. */
export const BRANCH_SEED = 7
/** Walk this many weeks past firstWeek when the entry has no weekDeadline. */
export const OPEN_ENDED_LOOKAHEAD = 2
/** Same guard as the timing audit walk: items offered per week. */
const MAX_ITEMS_PER_WEEK = 40
/** Days before firstWeek the walk starts (never before week 3). */
const START_LEAD_WEEKS = 3
const START_FLOOR_WEEK = 3
/** Bisection range and steps for recovering a numeric stat's actual value. */
const BISECT_LIMIT = 1e9
const BISECT_STEPS = 120
/** Sentinel value: a '!=' against it is true for any defined stat value. */
const PROBE_SENTINEL = '__probe_undefined__'

export interface BranchWindow {
  startWeek: number
  firstWeek: number
  endWeek: number
}

export interface OfferedItem {
  id: string
  sceneId: string
}

export interface WeekLog {
  week: number
  offered: OfferedItem[]
  played: OfferedItem[]
  note: string | null
}

export interface BranchRow {
  id: string
  sceneId: string
  window: string
  startWeek: number
  firstWeek: number
  endWeek: number
  setupProblems: string[]
  reappliedWeeks: number[]
  offeredWeek: number | null
  playedWeek: number | null
  pass: boolean
  failure: string | null
  weeks: WeekLog[]
}

export function branchWindow(item: MandatoryCase): BranchWindow {
  const firstWeek = item.week
  const endWeek = item.entry.weekDeadline ?? firstWeek + OPEN_ENDED_LOOKAHEAD
  return { startWeek: Math.max(START_FLOOR_WEEK, firstWeek - START_LEAD_WEEKS), firstWeek, endWeek }
}

function baseRow(item: MandatoryCase, win: BranchWindow, problems: string[]): BranchRow {
  return {
    id: item.id,
    sceneId: item.sceneId,
    window: `${win.firstWeek}-${item.entry.weekDeadline ?? `${win.firstWeek}+${OPEN_ENDED_LOOKAHEAD} (open)`}`,
    startWeek: win.startWeek,
    firstWeek: win.firstWeek,
    endWeek: win.endWeek,
    setupProblems: problems,
    reappliedWeeks: [],
    offeredWeek: null,
    playedWeek: null,
    pass: false,
    failure: null,
    weeks: [],
  }
}

/** Row for an id the timing report names but the agenda data no longer has. */
export function unknownBranchRow(id: string): BranchRow {
  return {
    id,
    sceneId: '?',
    window: '?',
    startWeek: 0,
    firstWeek: 0,
    endWeek: 0,
    setupProblems: [],
    reappliedWeeks: [],
    offeredWeek: null,
    playedWeek: null,
    pass: false,
    failure: 'id is not an urgent entry in src/data/agenda any more',
    weeks: [],
  }
}

export function trueFlagNames(plan: WorldPlan): string[] {
  return [...plan.flags].filter(([, v]) => v).map(([flag]) => flag)
}

/** Stat values the plan needs, as 'set' modifiers. */
export function statModifiers(plan: WorldPlan): StateModifier[] {
  return [...plan.stats].map(([stat, value]) => ({ stat, operation: 'set', value }))
}

/** Set the plan's stat values. Called before boot and again before each week up to firstWeek. */
export function applyStats(plan: WorldPlan): void {
  const mods = statModifiers(plan)
  if (mods.length) useGameStore.getState().applyModifiers(mods)
}

/** Clear flags the plan needs false, and mark the plan's prerequisite scenes visited. */
export function applyVisitsAndFalseFlags(plan: WorldPlan): void {
  const narrative = useNarrativeStore.getState()
  for (const [flag, value] of plan.flags) {
    if (!value && narrative.activeFlags.includes(flag)) narrative.removeFlag(flag)
  }
  for (const sceneId of plan.visited) narrative.markSceneVisited(sceneId)
}

function appendNote(note: string | null, next: string): string {
  return note ? `${note}; ${next}` : next
}

function snapshotOffered(into: Map<string, OfferedItem>): void {
  for (const item of pool()) {
    if (!isDone(item)) into.set(item.id, { id: item.id, sceneId: item.sceneId })
  }
}

/** Play the week the way the audit walk does, recording what was offered and played. */
async function playWeek(log: WeekLog, choose: PickChoice): Promise<void> {
  const offered = new Map<string, OfferedItem>()
  const played = new Set<string>()
  for (let guard = 0; guard < MAX_ITEMS_PER_WEEK; guard++) {
    snapshotOffered(offered)
    const next = pool().find(i => !isDone(i) && !played.has(i.id))
    if (!next) break
    played.add(next.id)
    const ok = await playItem(next, { choose })
    if (ok) log.played.push({ id: next.id, sceneId: next.sceneId })
    else log.note = appendNote(log.note, `launch was a no-op for ${next.id}`)
  }
  snapshotOffered(offered)
  log.offered = [...offered.values()]
}

/** Mute routine store logs for the walk; console.error stays live. */
function muteRoutineLogs(): () => void {
  const spies = [
    vi.spyOn(console, 'log').mockImplementation(() => {}),
    vi.spyOn(console, 'info').mockImplementation(() => {}),
    vi.spyOn(console, 'warn').mockImplementation(() => {}),
    vi.spyOn(console, 'debug').mockImplementation(() => {}),
  ]
  return () => spies.forEach(s => s.mockRestore())
}

function matchesItem(item: MandatoryCase, o: OfferedItem): boolean {
  return o.id === item.id || o.sceneId === item.sceneId
}

function judge(item: MandatoryCase, win: BranchWindow, row: BranchRow): BranchRow {
  const inWindow = (week: number): boolean => week >= win.firstWeek && week <= win.endWeek
  const offeredWeek = row.weeks.find(
    l => inWindow(l.week) && l.offered.some(o => matchesItem(item, o)),
  )?.week ?? null
  const playedWeek = row.weeks.find(
    l => inWindow(l.week) && l.played.some(o => matchesItem(item, o)),
  )?.week ?? null
  let failure: string | null = null
  if (win.endWeek < win.firstWeek) failure = `empty window: deadline ${win.endWeek} is before firstWeek ${win.firstWeek}`
  else if (offeredWeek === null) failure = `never offered in window ${win.firstWeek}-${win.endWeek}; see weekly log`
  else if (playedWeek === null) failure = `offered in week ${offeredWeek} but never played in window ${win.firstWeek}-${win.endWeek}`
  return { ...row, offeredWeek, playedWeek, pass: failure === null, failure }
}

/**
 * Play one urgent branch: boot its start week from planWorld's state, re-apply
 * its stat values before each week up to firstWeek, walk to the window end with
 * the seeded picker, and judge whether it was offered and played in its window.
 */
export async function playBranch(item: MandatoryCase, plan: WorldPlan): Promise<BranchRow> {
  const win = branchWindow(item)
  const row = baseRow(item, win, plan.problems)
  if (plan.problems.length > 0) {
    return { ...row, failure: `setup contradiction: ${plan.problems.join(' | ')}` }
  }
  const restoreLogs = muteRoutineLogs()
  const spy = vi.spyOn(Math, 'random').mockImplementation(mulberry32(BRANCH_SEED))
  try {
    resetWorld()
    applyStats(plan)
    applyVisitsAndFalseFlags(plan)
    bootWeek(win.startWeek, { flags: trueFlagNames(plan) })
    const choose = seededPick(BRANCH_SEED)
    for (let week = win.startWeek; week <= win.endWeek; week++) {
      scheduleWeekStartChains(week)
      const log: WeekLog = { week, offered: [], played: [], note: null }
      row.weeks.push(log)
      await playWeek(log, choose)
      if (week === win.endWeek) break
      await finishWeek()
      const landed = useGameStore.getState().currentWeek
      if (landed !== week + 1) {
        log.note = appendNote(log.note, `week did not advance (landed on ${landed}); walk stopped`)
        break
      }
      if (week + 1 <= win.firstWeek) {
        applyStats(plan)
        row.reappliedWeeks.push(week + 1)
      }
      useWeekStore.getState().initWeek()
    }
  } catch (err) {
    row.weeks.push({ week: -1, offered: [], played: [], note: `walk threw: ${err instanceof Error ? err.message : String(err)}` })
  } finally {
    spy.mockRestore()
    restoreLogs()
  }
  return judge(item, win, row)
}

// ---------------------------------------------------------------------------
// Dropped-chain proof
// ---------------------------------------------------------------------------

export interface ConditionCheck {
  condition: string
  actual: string
  passed: boolean
  preActual: string
  prePassed: boolean
  unresolved: boolean
  flagLike: boolean
  flipped: boolean
}

export type DropReason = 'past window' | 'conditions' | 'probability' | 'none'

export interface DropRecord {
  profile: string
  chainId: string
  target: string
  sourceId: string
  sourceScene: string
  fireWeek: number
  dropWeek: number
  /** Week the tick advanced into; the week window checks were evaluated at. */
  evalWeek: number
  reason: DropReason
  conditions: ConditionCheck[]
  verdict: 'LEGIT' | 'SUSPECT'
  why: string
}

function withOp(c: StatCondition, operator: StatCondition['operator'], value: StatCondition['value']): StatCondition {
  return { stat: c.stat, operator, value }
}

function isFlagLike(c: Condition): boolean {
  return 'flag' in c || c.stat.startsWith('flags.')
}

function conditionLabel(c: Condition): string {
  return 'flag' in c ? `flag ${c.flag} = ${String(c.value)}` : `${c.stat} ${c.operator} ${String(c.value)}`
}

function formatNumber(x: number): string {
  return Number.isInteger(x) ? String(x) : String(Math.round(x * 1e4) / 1e4)
}

/** Recover a numeric stat's value through the real evaluator (binary search on '<'). */
function bisectValue(c: StatCondition, state: GameState, flags: string[]): number {
  let lo = -BISECT_LIMIT
  let hi = BISECT_LIMIT
  for (let i = 0; i < BISECT_STEPS; i++) {
    const mid = (lo + hi) / 2
    if (evaluateCondition(withOp(c, '<', mid), state, flags)) hi = mid
    else lo = mid
  }
  return (lo + hi) / 2
}

/** The actual value of one condition's left-hand side at a state, through the real evaluator. */
function actualOf(c: Condition, state: GameState, flags: string[]): { text: string; unresolved: boolean } {
  if ('flag' in c) return { text: String(flags.includes(c.flag)), unresolved: false }
  if (c.stat.startsWith('flags.')) {
    return { text: String(evaluateCondition(withOp(c, '==', true), state, flags)), unresolved: false }
  }
  if (!evaluateCondition(withOp(c, '!=', PROBE_SENTINEL), state, flags)) {
    return { text: 'undefined (stat path did not resolve)', unresolved: true }
  }
  if (typeof c.value !== 'number') return { text: '(defined; non-numeric, not probed)', unresolved: false }
  return { text: formatNumber(bisectValue(c, state, flags)), unresolved: false }
}

function checkCondition(c: Condition, ev: DropEvaluation): ConditionCheck {
  const post = actualOf(c, ev.postState, ev.postFlags)
  const pre = actualOf(c, ev.preState, ev.preFlags)
  const passed = evaluateCondition(c, ev.postState, ev.postFlags)
  const prePassed = evaluateCondition(c, ev.preState, ev.preFlags)
  const flagLike = isFlagLike(c)
  return {
    condition: conditionLabel(c),
    actual: post.text,
    passed,
    preActual: pre.text,
    prePassed,
    unresolved: post.unresolved,
    flagLike,
    flipped: flagLike && prePassed !== passed,
  }
}

/**
 * Classify one dropped chain. Mirrors resolveChains' order: window expiry, then
 * conditions, then the probability roll. Anything with no recorded cause, a
 * failed condition on an undefined stat path, or a flag that flipped across the
 * tick is SUSPECT.
 */
export function classifyDrop(profile: string, chain: ScheduledChain, week: number, ev: DropEvaluation): DropRecord {
  const deadline = SCENE_REGISTRY.get(chain.targetNodeId)?.weekDeadline
  const conditions = (chain.conditions ?? []).map(c => checkCondition(c, ev))
  const base = {
    profile,
    chainId: chain.id,
    target: chain.targetNodeId,
    sourceId: chain.sourceId,
    sourceScene: chain.sceneId ?? '',
    fireWeek: chain.fireWeek,
    dropWeek: week,
    evalWeek: ev.evalWeek,
    conditions,
  }
  // resolveChains checks the window at the week the tick advanced into (evalWeek),
  // not the week that was being finished (dropWeek). A chain with fireWeek F is
  // evaluated at F, so a target whose window ends at F-1 is expired on arrival.
  if (typeof deadline === 'number' && ev.evalWeek > deadline) {
    const plays = ev.targetPlays.length
      ? `target played: ${ev.targetPlays.map(p => `week ${p.week} via ${p.id}`).join('; ')}`
      : 'target never played in this walk'
    return {
      ...base,
      reason: 'past window',
      verdict: 'LEGIT',
      why: `evaluated at fire week ${ev.evalWeek}, after target window end ${deadline} (${plays})`,
    }
  }
  const failing = conditions.filter(c => !c.passed)
  if (failing.length > 0) {
    const unresolved = failing.filter(c => c.unresolved).map(c => c.condition)
    if (unresolved.length > 0) {
      return { ...base, reason: 'conditions', verdict: 'SUSPECT', why: `failed condition(s) reference an undefined stat path: ${unresolved.join(', ')}` }
    }
    const flipped = conditions.filter(c => c.flipped).map(c => c.condition)
    if (flipped.length > 0) {
      return { ...base, reason: 'conditions', verdict: 'SUSPECT', why: `flag condition(s) flipped across the tick (set before, cleared by fire time): ${flipped.join(', ')}` }
    }
    const names = failing.map(c => `${c.condition} (actual ${c.actual})`).join('; ')
    return { ...base, reason: 'conditions', verdict: 'LEGIT', why: `genuinely false at fire time: ${names}` }
  }
  if (chain.probability !== undefined) {
    if (chain.probability < 1) {
      return { ...base, reason: 'probability', verdict: 'LEGIT', why: `all conditions passed; probability roll failed (p=${chain.probability}, inferred)` }
    }
    return { ...base, reason: 'probability', verdict: 'SUSPECT', why: 'probability is 1 yet the chain was dropped' }
  }
  return { ...base, reason: 'none', verdict: 'SUSPECT', why: 'no recorded cause: conditions all passed, no probability, inside window' }
}

// ---------------------------------------------------------------------------
// Report rendering
// ---------------------------------------------------------------------------

/** Escape a markdown table cell. */
function cell(text: string | number | null): string {
  return String(text ?? '-').replace(/\|/g, '/').replace(/\n/g, ' ')
}

function conditionsText(d: DropRecord): string {
  if (d.conditions.length === 0) return '(none)'
  return d.conditions
    .map(c => `${c.condition} -> actual ${c.actual}, ${c.passed ? 'pass' : 'FAIL'}${c.flipped ? ` (was ${c.preActual}, ${c.prePassed ? 'pass' : 'fail'} before tick)` : ''}`)
    .join('; ')
}

export function renderBranchTable(rows: readonly BranchRow[]): string {
  const head = '| # | id | window | start week | PASS/FAIL | offered week | played week | note |\n|---|---|---|---|---|---|---|---|'
  const body = rows.map((r, i) => `| ${i + 1} | ${cell(r.id)} | ${cell(r.window)} | ${r.startWeek} | ${r.pass ? 'PASS' : 'FAIL'} | ${cell(r.offeredWeek)} | ${cell(r.playedWeek)} | ${cell(r.failure ?? (r.reappliedWeeks.length ? `stats re-applied ${r.reappliedWeeks.length}x` : ''))} |`)
  return [head, ...body].join('\n')
}

export function renderDropTable(drops: readonly DropRecord[]): string {
  const head = '| profile | chain | target | source choice | fire week | drop week | reason | conditions (actual at fire time) | LEGIT/SUSPECT | why |\n|---|---|---|---|---|---|---|---|---|---|'
  const body = drops.map(d => `| ${cell(d.profile)} | ${cell(d.chainId)} | ${cell(d.target)} | ${cell(d.sourceId)} | ${d.fireWeek} | ${d.dropWeek} | ${d.reason} | ${cell(conditionsText(d))} | ${d.verdict} | ${cell(d.why)} |`)
  return [head, ...body].join('\n')
}

/** One fired chain target and what injection did with it, tagged by profile. */
export type DeliveryRecord = ChainDelivery & { profile: string }

export interface BranchReport {
  summary: {
    branches: number
    branchesPassed: number
    branchesFailed: number
    drops: number
    dropsByReason: Record<DropReason, number>
    dropsLegit: number
    dropsSuspect: number
    deliveries: number
    deliveriesByOutcome: Record<ChainDeliveryOutcome, number>
  }
  branches: BranchRow[]
  drops: DropRecord[]
  deliveries: DeliveryRecord[]
}

const DELIVERY_OUTCOMES: readonly ChainDeliveryOutcome[] = [
  'pushed',
  'skipped missing scene',
  'skipped visited',
  'skipped window',
  'skipped duplicate',
  'dropped after push',
]

export function buildReport(
  rows: readonly BranchRow[],
  drops: readonly DropRecord[],
  deliveries: readonly DeliveryRecord[] = [],
): BranchReport {
  const dropsByReason: Record<DropReason, number> = { 'past window': 0, conditions: 0, probability: 0, none: 0 }
  for (const d of drops) dropsByReason[d.reason] += 1
  const deliveriesByOutcome = Object.fromEntries(DELIVERY_OUTCOMES.map(o => [o, 0])) as Record<ChainDeliveryOutcome, number>
  for (const d of deliveries) deliveriesByOutcome[d.outcome] += 1
  const passed = rows.filter(r => r.pass).length
  return {
    summary: {
      branches: rows.length,
      branchesPassed: passed,
      branchesFailed: rows.length - passed,
      drops: drops.length,
      dropsByReason,
      dropsLegit: drops.filter(d => d.verdict === 'LEGIT').length,
      dropsSuspect: drops.filter(d => d.verdict === 'SUSPECT').length,
      deliveries: deliveries.length,
      deliveriesByOutcome,
    },
    branches: [...rows],
    drops: [...drops],
    deliveries: [...deliveries],
  }
}

/** Every delivery that did not reach the pool, so each skip carries its gate. */
export function renderDeliveryTable(deliveries: readonly DeliveryRecord[]): string {
  const skipped = deliveries.filter(d => d.outcome !== 'pushed')
  const head = '| profile | week | target | outcome | detail |\n|---|---|---|---|---|'
  const body = skipped.map(d => `| ${cell(d.profile)} | ${d.week} | ${cell(d.sceneId)} | ${d.outcome} | ${cell(d.detail)} |`)
  return [head, ...body].join('\n')
}

export function renderMarkdown(report: BranchReport): string {
  const s = report.summary
  const suspects = report.drops.filter(d => d.verdict === 'SUSPECT')
  const failed = report.branches.filter(r => !r.pass)
  return [
    '# Branch playthroughs and dropped-chain proof (work order B1)',
    '',
    '## Summary',
    `- Branches (NEVER_OFFERED_MANDATORY): ${s.branches}; PASS ${s.branchesPassed}; FAIL ${s.branchesFailed}`,
    `- Dropped chains: ${s.drops} (conditions ${s.dropsByReason.conditions}, probability ${s.dropsByReason.probability}, past window ${s.dropsByReason['past window']}, no cause ${s.dropsByReason.none}); LEGIT ${s.dropsLegit}; SUSPECT ${s.dropsSuspect}`,
    `- Fired chain targets delivered by initWeek: ${s.deliveries} (${DELIVERY_OUTCOMES.map(o => `${o} ${s.deliveriesByOutcome[o]}`).join(', ')})`,
    '',
    '## Table A: branch playthroughs',
    renderBranchTable(report.branches),
    '',
    '## Table B: dropped chains',
    renderDropTable(report.drops),
    '',
    '## Table C: fired chain targets that did not reach the pool',
    renderDeliveryTable(report.deliveries),
    '',
    '## Failures and suspects',
    failed.length ? failed.map(r => `- FAIL ${r.id}: ${r.failure}`).join('\n') : '- none (branches)',
    suspects.length ? suspects.map(d => `- SUSPECT ${d.chainId} -> ${d.target} (${d.profile}, drop week ${d.dropWeek}): ${d.why}`).join('\n') : '- none (drops)',
    '',
  ].join('\n')
}
