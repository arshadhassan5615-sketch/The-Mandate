// Branch reachability — permanent proof (default suite).
//
// For every urgent (mandatory) agenda entry, build a world that satisfies the
// entry's own prerequisites and its scene's prerequisites, boot the entry's
// first week through the real initWeek, and assert the entry is in the map
// pool and not done. The list is read from src/data/agenda/*.json at run time,
// so entries added or removed later are picked up without editing this file.
//
// A failure here means the entry cannot be offered even when its conditions
// hold: a real data or engine bug. Setup contradictions (two conditions that
// cannot both hold) also fail, with the reason, rather than being skipped.
import { describe, it, expect } from 'vitest'

import { useGameStore } from '../stores/gameStore'
import { useNarrativeStore } from '../stores/narrativeStore'
import { getScene } from '../engine/NarrativeEngine'
import { evaluateAll, evaluateCondition } from '../engine/conditionEvaluator'
import type { Condition, NarrativeNode, StatCondition } from '../types/narrative'
import type { StateModifier } from '../types/gameState'
import { loadAgendaDeclarations, type AgendaDeclaration } from './timingAudit'
import { resetWorld, bootWeek, pool, isDone } from './simHarness'

const agendaModules = import.meta.glob('../data/agenda/*.json', { eager: true })
const AGENDA_FILES: Record<string, unknown> = Object.fromEntries(
  Object.entries(agendaModules).map(([path, mod]) => [
    path,
    (mod as { default?: unknown } | null)?.default ?? mod,
  ]),
)

/** One urgent agenda entry with its scene and the first week it can be offered. */
interface MandatoryCase {
  id: string
  sceneId: string
  week: number
  entry: AgendaDeclaration
  scene: NarrativeNode | undefined
  conditions: Condition[]
}

/** What the test must put into the world before booting the week. */
interface WorldPlan {
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
 * are each bound and its neighbours, so `>= 62` gives 62, `> 40` gives 41 and
 * `< 35` gives 34. Returns null when no candidate works (a contradiction).
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

/** Apply a plan to the freshly reset world. Stats and flags go in before initWeek runs. */
function applyPlan(plan: WorldPlan): void {
  resetWorld()
  const modifiers: StateModifier[] = [...plan.stats].map(([stat, value]) => ({
    stat,
    operation: 'set',
    value,
  }))
  if (modifiers.length) useGameStore.getState().applyModifiers(modifiers)

  const narrative = useNarrativeStore.getState()
  const trueFlags: string[] = []
  for (const [flag, value] of plan.flags) {
    if (value) trueFlags.push(flag)
    else if (narrative.activeFlags.includes(flag)) narrative.removeFlag(flag)
  }
  if (trueFlags.length) narrative.addFlags(trueFlags)
  for (const sceneId of plan.visited) narrative.markSceneVisited(sceneId)
}

/** Conditions the built world still fails. Empty when the setup really holds. */
function unmetAfterSetup(item: MandatoryCase): string[] {
  const game = useGameStore.getState()
  const flags = useNarrativeStore.getState().activeFlags
  return item.conditions
    .filter(c => !evaluateCondition(c, game, flags))
    .map(c => ('flag' in c ? `flag ${c.flag}=${String(c.value)}` : describeStat(c)))
}

/** Why a not-offered entry is missing from the pool, from the same data the pool filter reads. */
function explainMissing(item: MandatoryCase): string {
  const reasons: string[] = []
  const { entry, scene, week } = item
  if (entry.weekDeadline !== null && week > entry.weekDeadline) {
    reasons.push(`entry weekDeadline ${entry.weekDeadline} is before week ${week}`)
  }
  if (typeof scene?.weekDeadline === 'number' && week > scene.weekDeadline) {
    reasons.push(`scene weekDeadline ${scene.weekDeadline} is before week ${week}`)
  }
  if (typeof scene?.weekAvailable === 'number' && week < scene.weekAvailable) {
    reasons.push(`scene weekAvailable ${scene.weekAvailable} is after week ${week}`)
  }
  const game = useGameStore.getState()
  const { activeFlags, visitedSceneIds } = useNarrativeStore.getState()
  const failedEntry = entry.prerequisites as Condition[]
  if (!evaluateAll(failedEntry, game, activeFlags)) reasons.push('entry prerequisites fail at boot')
  for (const id of scene?.prerequisiteSceneIds ?? []) {
    if (!visitedSceneIds.includes(id)) reasons.push(`prerequisite scene ${id} not visited`)
  }
  for (const f of scene?.prerequisiteFlags ?? []) {
    if (!activeFlags.includes(f)) reasons.push(`prerequisite flag ${f} not set`)
  }
  return reasons.length ? reasons.join('; ') : 'no static reason found; the pool filter or initWeek dropped it'
}

function findOffered(item: MandatoryCase) {
  const current = pool()
  return current.find(i => i.id === item.id) ?? current.find(i => i.sceneId === item.sceneId)
}

describe('branch reachability: every urgent agenda entry is offered when its conditions hold', () => {
  const cases = mandatoryCases()

  it('finds at least one urgent agenda entry to test', () => {
    expect(cases.length, 'no urgent agenda entries were loaded from src/data/agenda').toBeGreaterThan(0)
  })

  it.each(cases)('$id is offered in week $week when its conditions hold', item => {
    const plan = planWorld(item)
    expect(
      plan.problems,
      `setup contradiction for ${item.id} (scene ${item.sceneId}): ${plan.problems.join(' | ')}`,
    ).toEqual([])

    applyPlan(plan)
    const unmet = unmetAfterSetup(item)
    expect(
      unmet,
      `setup did not satisfy ${item.id} at week ${item.week}; unmet after setting state: ${unmet.join(', ')}`,
    ).toEqual([])

    bootWeek(item.week)
    const offered = findOffered(item)
    expect(
      offered,
      `${item.id} (scene ${item.sceneId}) is not in the pool at week ${item.week}: ${explainMissing(item)}`,
    ).toBeDefined()
    expect(
      offered ? isDone(offered) : 'missing',
      `${item.id} is in the pool at week ${item.week} but already done`,
    ).toBe(false)
  })
})
