// Wiring guard for the orphan-meeting fixes (work order K3). Checks that the
// scheduled scenes are each reachable through exactly one agenda entry with an
// overlapping week window, that the restored chain edges exist on their source
// choices, that the retargeted agenda entry points at its new scene, and that
// every agenda sceneId resolves to a real scene.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { CATEGORY_LABELS } from '../../../types/week'

const NARRATIVE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const AGENDA_DIR = resolve(NARRATIVE_DIR, '../agenda')

type Window = { weekAvailable: number; weekDeadline?: number }
type AgendaEntry = Window & {
  id: string
  sceneId: string
  category: string
  slotCost: number
  prerequisites?: Array<{ stat: string; operator: string; value: unknown }>
}
type ChainTrigger = { targetNodeId: string; delayWeeks: number }

const SCHEDULED_SCENES = [
  'act1_week4_elena_introduction',
  'act1_vael_party_funding',
  'act1_week3_armadine_investment',
  'act1_week10_law_enforcement_choice',
  'act2_week29_sovarka_approach',
  'social_autumn_festival_wk18',
  'social_state_dinner_wk24',
  'social_independence_parade_wk36',
]

const CHAIN_EDGES: Array<{ file: string; choiceId: string; target: string; delay: number }> = [
  { file: 'act1/social_inaugural_ball_wk1.json', choiceId: 'ball_speak_brenner', target: 'act1_brenner_defense_briefing', delay: 1 },
  { file: 'act1/act1_week1_inauguration.json', choiceId: 'speech_personal', target: 'act1_chain_kolvar_opposition', delay: 2 },
  { file: 'act1/act1_week1_inauguration.json', choiceId: 'speech_reform', target: 'act1_chain_kolvar_opposition', delay: 3 },
  { file: 'act1/act1_week1_inauguration.json', choiceId: 'speech_personal', target: 'act1_chain_vael_pressure', delay: 5 },
  { file: 'act1/social_inaugural_ball_wk1.json', choiceId: 'ball_speak_vael', target: 'act1_vael_private_meeting', delay: 2 },
  { file: 'act1/act1_week7_tyvaren_airspace.json', choiceId: 'diplomatic_only', target: 'act1_chain_tyvaren_propaganda_war', delay: 3 },
  { file: 'act2/act2_week21_superpower_choice.json', choiceId: 'visit_neither_nonalignment', target: 'act2_superpower_coldness', delay: 1 },
]

// Placements added by W1: each must exist exactly once, with its spec'd window,
// a valid category, and the spec'd prerequisites.
const FLAG_REFORMIST = [{ stat: 'flags.inaugural_reformist', operator: '==', value: true }]
const AGENDA_PLACEMENTS = [
  { id: 'agenda_w24_tyvaren_pressure', sceneId: 'act3_tyvaren_pressure', window: [24, 26], slotCost: 0, category: 'crisis', prerequisites: [] },
  { id: 'agenda_w15_arcturian_trade', sceneId: 'act2_diplomacy_arcturian_trade', window: [15, 17], slotCost: 1, category: 'diplomacy', prerequisites: [] },
  { id: 'agenda_w26_family_referendum_night', sceneId: 'family_referendum_night', window: [26, 26], slotCost: 0, category: 'personal', prerequisites: [] },
  { id: 'agenda_w16_deficit_crisis', sceneId: 'act2_deficit_crisis', window: [16, 20], slotCost: 0, category: 'crisis', prerequisites: [{ stat: 'nation.nationalDebt', operator: '>', value: 450 }] },
  { id: 'agenda_w5_kravenstal_unrest', sceneId: 'act1_chain_kravenstal_unrest', window: [5, 8], slotCost: 0, category: 'crisis', prerequisites: [{ stat: 'factions.workersCoalition', operator: '<=', value: 40 }] },
  { id: 'agenda_w5_renek_sermon', sceneId: 'act1_renek_sermon', window: [5, 7], slotCost: 1, category: 'cabinet', prerequisites: [{ stat: 'flags.ball_chose_renek', operator: '!=', value: true }] },
  { id: 'agenda_w3_kolvar_opposition_rally', sceneId: 'act1_kolvar_opposition_rally', window: [3, 5], slotCost: 1, category: 'parliament', prerequisites: FLAG_REFORMIST },
  { id: 'agenda_w4_kolvar_counterattack', sceneId: 'act1_kolvar_counterattack', window: [4, 6], slotCost: 1, category: 'parliament', prerequisites: FLAG_REFORMIST },
]

// Agenda entries removed in W1 (dead: scene content never written).
const REMOVED_AGENDA_IDS = [
  'agenda_w7_cabinet_session',
  'agenda_w13_cabinet_confidence',
  'agenda_w23_refugee_update',
  'agenda_w38_liora_recovery',
  'agenda_w51_new_order',
]

const RETARGETED = [
  { entryId: 'agenda_w27_arcturian_review', sceneId: 'act3_arcturian_cooldown' },
]

function listJsonFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) return listJsonFiles(full)
    return name.endsWith('.json') ? [full] : []
  })
}

function readJson(file: string): unknown {
  return JSON.parse(readFileSync(file, 'utf8'))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function sceneRegistry(): Map<string, Window> {
  const registry = new Map<string, Window>()
  for (const file of listJsonFiles(NARRATIVE_DIR)) {
    const data = readJson(file)
    if (!isRecord(data) || typeof data.id !== 'string') continue
    if (typeof data.weekAvailable !== 'number') continue
    registry.set(data.id, {
      weekAvailable: data.weekAvailable,
      weekDeadline: typeof data.weekDeadline === 'number' ? data.weekDeadline : undefined,
    })
  }
  return registry
}

function agendaEntries(): AgendaEntry[] {
  return listJsonFiles(AGENDA_DIR)
    .filter(file => file.endsWith('.json') && /week\d+\.json$/.test(file))
    .flatMap(file => readJson(file) as AgendaEntry[])
}

function windowOf(w: Window): [number, number] {
  return [w.weekAvailable, w.weekDeadline ?? w.weekAvailable]
}

function windowsOverlap(a: Window, b: Window): boolean {
  const [aStart, aEnd] = windowOf(a)
  const [bStart, bEnd] = windowOf(b)
  return aStart <= bEnd && bStart <= aEnd
}

function findChoices(node: unknown, choiceId: string, found: Record<string, unknown>[] = []): Record<string, unknown>[] {
  if (Array.isArray(node)) {
    node.forEach(child => findChoices(child, choiceId, found))
  } else if (isRecord(node)) {
    if (node.id === choiceId) found.push(node)
    Object.values(node).forEach(child => findChoices(child, choiceId, found))
  }
  return found
}

describe('orphan meeting wiring (K3)', () => {
  const registry = sceneRegistry()
  const entries = agendaEntries()

  it.each(SCHEDULED_SCENES)('%s is referenced by exactly one agenda entry with an overlapping window', sceneId => {
    const scene = registry.get(sceneId)
    expect(scene, `scene ${sceneId} must exist`).toBeDefined()
    const referencing = entries.filter(e => e.sceneId === sceneId)
    expect(referencing).toHaveLength(1)
    expect(windowsOverlap(referencing[0], scene!)).toBe(true)
  })

  it.each(CHAIN_EDGES)('chain $choiceId -> $target (d$delay) exists on its source choice', ({ file, choiceId, target, delay }) => {
    const choices = findChoices(readJson(join(NARRATIVE_DIR, file)), choiceId)
    expect(choices).toHaveLength(1)
    const triggers = (choices[0].chainTriggers ?? []) as ChainTrigger[]
    expect(triggers).toContainEqual({ targetNodeId: target, delayWeeks: delay })
  })

  it.each(RETARGETED)('$entryId points at $sceneId', ({ entryId, sceneId }) => {
    const entry = entries.find(e => (e as { id?: string }).id === entryId)
    expect(entry, `${entryId} must exist`).toBeDefined()
    expect(entry!.sceneId).toBe(sceneId)
    const scene = registry.get(sceneId)
    expect(scene).toBeDefined()
    expect(windowsOverlap(entry!, scene!)).toBe(true)
  })

  it('every agenda JSON file parses', () => {
    for (const file of listJsonFiles(AGENDA_DIR)) {
      expect(() => readJson(file), file).not.toThrow()
    }
  })

  it.each(AGENDA_PLACEMENTS)('$id schedules $sceneId in its window with valid category and prerequisites', p => {
    const matches = entries.filter(e => e.id === p.id) as AgendaEntry[]
    expect(matches).toHaveLength(1)
    const entry = matches[0]
    expect(entry.sceneId).toBe(p.sceneId)
    expect([entry.weekAvailable, entry.weekDeadline]).toEqual(p.window)
    expect(entry.slotCost).toBe(p.slotCost)
    expect(Object.keys(CATEGORY_LABELS)).toContain(entry.category)
    expect(entry.category).toBe(p.category)
    expect(entry.prerequisites ?? []).toEqual(p.prerequisites)
    // Engine scene gate: scene opens at weekAvailable and closes at weekDeadline when set.
    const scene = registry.get(p.sceneId)!
    expect(scene).toBeDefined()
    const sceneOpensBeforeEnd = scene.weekAvailable <= p.window[1]
    const sceneOpenAtOrAfterStart = scene.weekDeadline === undefined || scene.weekDeadline >= p.window[0]
    expect(sceneOpensBeforeEnd && sceneOpenAtOrAfterStart).toBe(true)
  })

  it.each(REMOVED_AGENDA_IDS)('removed dead agenda entry %s no longer exists', id => {
    expect(entries.some(e => e.id === id)).toBe(false)
  })

  it('every agenda sceneId (excluding __ sentinels) exists in the scene registry', () => {
    const missing = entries
      .map(e => e.sceneId)
      .filter(id => !id.startsWith('__') && !registry.has(id))
    expect(missing).toEqual([])
  })
})
