// Reply audit D1 — click every visible choice of every scene through the real
// stores and record what the player sees before the next input.
//
// Path mirrored exactly: narrativeStore.loadScene -> NarrativeScene's visible
// list (getAvailableChoices + ensureTerminalChoice) -> processChoice -> the
// segments NarrativeScene feeds useDialogueFlow (currentScene.narrative plus the
// family-dinner / intelligence-briefing injections). Each click replays from a
// fresh store so clicks never leak state into each other.
//
// Two flag sets per scene: EMPTY and MAXIMAL (every flag any choice sets or any
// flag condition reads). Segments reached by a click are explored breadth-first.
import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect, vi } from 'vitest'

import { useGameStore } from '../src/stores/gameStore'
import { useWeekStore } from '../src/stores/weekStore'
import { useNarrativeStore, filterNarrative } from '../src/stores/narrativeStore'
import { ALL_SCENES, getScene, getAvailableChoices, ensureTerminalChoice } from '../src/engine/NarrativeEngine'
import { evaluateAll } from '../src/engine/conditionEvaluator'
import { computeDinnerContext } from '../src/engine/FamilyDinnerEngine'
import { computeBriefingContext } from '../src/engine/IntelligenceBriefingEngine'
import type { NarrativeNode, NarrativeSegment, Condition } from '../src/types/narrative'
import type { GameState } from '../src/types/gameState'

const OUT_DIR = path.resolve(__dirname, '..', 'docs', 'REPLY_AUDIT', 'data')
const CACHE_DIR = path.resolve(__dirname, '..', 'node_modules', '.cache', 'reply-audit')
const MAX_STATES_PER_SCENE = 250

const game = () => useGameStore.getState()
const nar = () => useNarrativeStore.getState()

type Shown = { src: string; text: string }
interface ClickRecord {
  scene: string; actual: string | null; flagset: string; path: string[]; from: string; choice: string; choiceText: string
  outcome: 'segment' | 'node' | 'terminal' | 'blocked' | 'threw'
  to: string | null
  shown: Shown[]
  monologue: string | null
  reactions: { count: number; eligible: boolean; texts: string[] }
  next: string[]
  untraceable: { text: string; why: string }[]
  suppressed: { text: string; why: string }[]
  errors: string[]
}

function allFlags(): string[] {
  const out = new Set<string>()
  const visitConds = (conds?: Condition[]) => {
    for (const c of conds ?? []) {
      if ((c as { type?: string }).type === 'flag') out.add((c as { flag: string }).flag)
      const stat = (c as { stat?: string }).stat
      if (typeof stat === 'string' && stat.startsWith('flags.')) out.add(stat.slice(6))
    }
  }
  for (const s of ALL_SCENES) {
    visitConds(s.prerequisites)
    const lists = [{ choices: s.choices, narrative: s.narrative }, ...Object.values(s.segments ?? {})]
    for (const l of lists) {
      for (const n of (Array.isArray(l.narrative) ? l.narrative : [])) visitConds(n.conditions)
      for (const c of l.choices ?? []) {
        visitConds(c.conditions)
        for (const f of c.flags ?? []) out.add(f)
      }
    }
  }
  return [...out].sort()
}

// `forced`: when loadScene's exclusive[] redirect swapped the scene, install the
// requested scene exactly as loadScene would have without the redirect, so its
// own choices are still audited (flag set labelled "+forced" in the output).
function replay(scene: NarrativeNode, flags: string[], steps: string[], forced = false): void {
  useWeekStore.getState().clearPendingTimeouts()
  game().resetToInitial()
  useGameStore.setState({ currentWeek: Math.max(1, scene.weekAvailable ?? 1), currentAct: Math.max(1, scene.act ?? 1) })
  useNarrativeStore.setState({
    activeFlags: [...flags], visitedSceneIds: [], currentScene: null, activeSegmentId: null,
    sceneDone: false, unlockedCodexIds: [], metCharacters: [],
  })
  useWeekStore.setState({ sceneQueue: [], currentQueueIndex: 0 })
  nar().loadScene(scene.id)
  if (forced && nar().currentScene?.id !== scene.id) {
    const root = scene.narrative ?? (Array.isArray(scene.dialogue) ? scene.dialogue
      : scene.dialogue ? [{ type: 'description' as const, text: scene.dialogue }] : [])
    useNarrativeStore.setState({ currentScene: { ...scene, narrative: filterNarrative(root, game(), flags) ?? root } })
  }
  for (const id of steps) nar().processChoice(id)
}

/** Exactly the `segments` memo in NarrativeScene.tsx. */
function displayed(): Shown[] {
  const s = nar().currentScene
  if (!s) return []
  const base = (s.narrative ?? []).map(n => ({ src: 'narrative', text: n.text }))
  const inject = (ids: string[]) => ids
    .filter(id => s.segments?.[id])
    .flatMap(id => (s.segments![id].narrative ?? []).map(n => ({ src: `injected:${id}`, text: n.text })))
  if (s.id === 'family_dinner_recurring' && s.segments) return [...base, ...inject(computeDinnerContext(game(), nar().activeFlags).injectedSegments)]
  if (s.id === 'intelligence_briefing_recurring' && s.segments) return [...base, ...inject(computeBriefingContext(game(), nar().activeFlags).injectedSegments)]
  return base
}

function visible(): { id: string; text: string }[] {
  const s = nar().currentScene
  if (!s) return []
  return ensureTerminalChoice(getAvailableChoices(s, game(), nar().activeFlags))
}

function rawTargetNodes(scene: NarrativeNode, outcome: string, to: string | null): NarrativeSegment[] {
  if (outcome === 'segment' && to) {
    const seg = scene.segments?.[to]
    if (!seg) return []
    if (seg.narrative) return seg.narrative
    if (Array.isArray(seg.dialogue)) return seg.dialogue
    return seg.dialogue ? [{ type: 'description', text: seg.dialogue }] : []
  }
  if (outcome === 'node' && to) return getScene(to)?.narrative ?? []
  return []
}

function passes(n: NarrativeSegment, st: GameState, flags: string[]): boolean {
  try { return !n.conditions?.length || evaluateAll(n.conditions, st, flags) } catch { return false }
}

function classify(before: ReturnType<typeof nar>, after: ReturnType<typeof nar>, beforeSceneId: string | null, threw: boolean, nextSegment?: string) {
  if (threw) return { outcome: 'threw' as const, to: null }
  if (after.currentScene?.id !== beforeSceneId) return { outcome: 'node' as const, to: after.currentScene?.id ?? null }
  if (after.activeSegmentId && (after.activeSegmentId !== before.activeSegmentId || nextSegment === after.activeSegmentId)) {
    return { outcome: 'segment' as const, to: after.activeSegmentId }
  }
  if (after.sceneDone) return { outcome: 'terminal' as const, to: null }
  return { outcome: 'blocked' as const, to: null }
}

function click(scene: NarrativeNode, flagset: string, flags: string[], steps: string[], choiceId: string, errors: string[], forced = false): ClickRecord {
  replay(scene, flags, steps, forced)
  const before = nar()
  const from = before.activeSegmentId ?? '(root)'
  const beforeSceneId = before.currentScene?.id ?? null
  const beforeMono = before.currentScene?.monologue ?? null
  const choice = (before.currentScene?.choices ?? []).find(c => c.id === choiceId)
  const preGame = game()
  const preFlags = [...before.activeFlags]
  errors.length = 0
  let threw = false
  try { nar().processChoice(choiceId) } catch (e) { threw = true; errors.push(String(e)) }
  const after = nar()
  const { outcome, to } = classify(before, after, beforeSceneId, threw, choice?.nextSegment)

  // Terminal: the scene stays on screen; nothing new is fed to the dialogue flow.
  const shown = outcome === 'segment' || outcome === 'node' ? displayed() : []
  const targetNodes = rawTargetNodes(scene, outcome, to)
  const postGame = game()
  const postFlags = after.activeFlags
  const allowed = new Set(targetNodes
    .filter(n => passes(n, preGame, preFlags) || passes(n, postGame, postFlags))
    .map(n => n.text))
  const untraceable: ClickRecord['untraceable'] = []
  for (const s of shown) {
    if (allowed.has(s.text)) continue
    const node = targetNodes.find(n => n.text === s.text)
    const why = s.src.startsWith('injected:') ? `recurring injection re-fed after a choice (${s.src})`
      : node ? `node condition false (${JSON.stringify(node.conditions)}) but rendered${outcome === 'node' ? ' — nextNodeId path skips filterNarrative' : ''}`
      : 'not in target'
    untraceable.push({ text: s.text.slice(0, 90), why })
  }
  const shownTexts = new Set(shown.map(s => s.text))
  const suppressed = targetNodes
    .filter(n => !shownTexts.has(n.text) && passes(n, postGame, postFlags) && !passes(n, preGame, preFlags))
    .map(n => ({ text: n.text.slice(0, 90), why: 'condition true after the choice but filtered with pre-choice flags' }))
  const mono = after.currentScene?.monologue ?? null
  return {
    scene: scene.id, actual: beforeSceneId, flagset, path: steps, from, choice: choiceId,
    choiceText: (choice?.text ?? (choiceId.startsWith('__') ? 'Continue…' : '?')).slice(0, 80),
    outcome, to,
    shown: shown.map(s => ({ src: s.src, text: s.text.slice(0, 90) })),
    monologue: mono && mono !== beforeMono ? mono.slice(0, 90) : null,
    reactions: {
      count: choice?.reactions?.length ?? 0,
      eligible: !after.sceneDone,
      texts: (choice?.reactions ?? []).map(r => r.text.slice(0, 60)),
    },
    next: after.sceneDone ? ['(Continue button)'] : visible().map(c => c.id),
    untraceable, suppressed, errors: [...errors],
  }
}

function auditScene(scene: NarrativeNode, flagset: string, flags: string[], errors: string[], out: ClickRecord[], forced = false) {
  replay(scene, flags, [], forced)
  const loadedAs = nar().currentScene?.id ?? null
  const queue: string[][] = [[]]
  const seen = new Set<string>(['(root)'])
  let states = 0
  while (queue.length && states < MAX_STATES_PER_SCENE) {
    const steps = queue.shift()!
    states++
    replay(scene, flags, steps, forced)
    for (const c of visible()) {
      const rec = click(scene, flagset, flags, steps, c.id, errors, forced)
      if (loadedAs !== scene.id && !forced) rec.errors.push(`loadScene redirected ${scene.id} -> ${loadedAs} (exclusive[])`)
      out.push(rec)
      if (rec.outcome === 'segment' && rec.to && !seen.has(rec.to)) {
        seen.add(rec.to)
        queue.push([...steps, c.id])
      }
    }
  }
  return { loadedAs, states }
}

describe('reply audit D1', () => {
  it('clicks every visible choice under empty and maximal flag sets', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const errors: string[] = []
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation((...a: unknown[]) => { errors.push(`warn: ${a.map(String).join(' ').slice(0, 200)}`) })
    vi.spyOn(console, 'error').mockImplementation((...a: unknown[]) => { errors.push(`error: ${a.map(String).join(' ').slice(0, 200)}`) })

    const flagsets: [string, string[]][] = [['empty', []], ['maximal', allFlags()]]
    const records: ClickRecord[] = []
    const coverage: Record<string, { empty?: string | null; maximal?: string | null; states: number }> = {}
    for (const scene of ALL_SCENES) {
      coverage[scene.id] = { states: 0 }
      for (const [name, flags] of flagsets) {
        const r = auditScene(scene, name, flags, errors, records)
        coverage[scene.id][name as 'empty' | 'maximal'] = r.loadedAs
        coverage[scene.id].states += r.states
        if (r.loadedAs !== scene.id) auditScene(scene, `${name}+forced`, flags, errors, records, true)
      }
    }
    vi.restoreAllMocks()

    // Coverage: every authored (mounted) choice vs the ones some click exercised.
    const clicked = new Set(records.map(r => `${r.actual}›${r.choice}`))
    const authored = ALL_SCENES.flatMap(s => [
      ...(s.choices ?? []).map(c => ({ scene: s.id, list: '(root)', choice: c.id, gate: c.conditions ?? [] })),
      ...Object.entries(s.segments ?? {}).flatMap(([k, seg]) => (seg.choices ?? []).map(c => ({ scene: s.id, list: k, choice: c.id, gate: c.conditions ?? [] }))),
    ])
    const incoming = new Map<string, Set<string>>()
    for (const s of ALL_SCENES) {
      const inc = new Set<string>()
      for (const l of [{ choices: s.choices }, ...Object.values(s.segments ?? {})]) for (const c of l.choices ?? []) if (c.nextSegment) inc.add(c.nextSegment)
      incoming.set(s.id, inc)
    }
    const unclicked = authored.filter(a => !clicked.has(`${a.scene}›${a.choice}`)).map(a => ({
      ...a,
      reason: a.list !== '(root)' && !incoming.get(a.scene)?.has(a.list) ? 'segment has no incoming choice (orphan in-scene)'
        : a.gate.length ? 'gate false under empty and maximal flag sets (needs a specific state)'
        : 'its segment is reachable only through an orphan or gated path',
    }))

    const anomalies = records.filter(r => r.untraceable.length || r.suppressed.length || r.outcome === 'blocked' || r.outcome === 'threw'
      || r.errors.some(e => !e.startsWith('loadScene redirected')))
    const stats = {
      scenes: ALL_SCENES.length,
      maximalFlagCount: flagsets[1][1].length,
      clicks: records.length,
      clicksByFlagset: records.reduce<Record<string, number>>((m, r) => ({ ...m, [r.flagset]: (m[r.flagset] ?? 0) + 1 }), {}),
      outcomes: records.reduce<Record<string, number>>((m, r) => ({ ...m, [r.outcome]: (m[r.outcome] ?? 0) + 1 }), {}),
      distinctChoicesClicked: clicked.size,
      authoredChoices: authored.length,
      authoredChoicesNeverClicked: unclicked.length,
      untraceableClicks: records.filter(r => r.untraceable.length).length,
      suppressedClicks: records.filter(r => r.suppressed.length).length,
      reactionsEligibleClicks: records.filter(r => r.reactions.count && r.reactions.eligible).length,
      reactionsIneligibleClicks: records.filter(r => r.reactions.count && !r.reactions.eligible).length,
      redirectedScenes: Object.entries(coverage).filter(([id, c]) => c.empty !== id || c.maximal !== id).map(([id, c]) => `${id} -> ${c.empty}/${c.maximal}`),
    }
    fs.mkdirSync(OUT_DIR, { recursive: true })
    fs.mkdirSync(CACHE_DIR, { recursive: true })
    fs.writeFileSync(path.join(OUT_DIR, 'd1-stats.json'), JSON.stringify(stats, null, 2))
    fs.writeFileSync(path.join(OUT_DIR, 'd1-anomalies.json'), JSON.stringify(anomalies, null, 1))
    fs.writeFileSync(path.join(OUT_DIR, 'd1-unclicked.json'), JSON.stringify(unclicked, null, 1))
    fs.writeFileSync(path.join(CACHE_DIR, 'd1-full.json'), JSON.stringify(records))
    expect(records.length).toBeGreaterThan(0)
  })
})
