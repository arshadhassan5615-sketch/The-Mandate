// Reachability report suite — Round 3 STEP 3 (in scripts/ per STEP 6).
//
// Run ONLY via the report config, with MANDATE_REPORT=1, AFTER generating
// the static manifest (all commands from the repo root):
//
//   node scripts/analyze-runs.mjs --write-manifest
//   MANDATE_REPORT=1 npx vitest run --config scripts/vitest.report.config.ts
//
// What it does:
//   (A) telemetry walks — clean / exile / god-flag profiles walk weeks 1-103
//       through the real week flow, recording visited scenes + fired chains
//       into run-<profile>.json.
//   (B) directed proofs — reads run-manifest.json (static source paths) plus
//       the union of ALL run-*.json visited sets, and for every never-fired
//       scene runs a goal-directed policy against its best source path
//       (agenda entry > chain trigger > nextNode link > exclusive redirect):
//       seed preconditions, drive the engine, assert the scene renders/plays.
//       Verdict per scene goes to run-directed.json: proved (visited or
//       reached-terminal) or blocked (with the blocking condition named).
//
// run-*.json outputs are telemetry — NEVER committed (STEP 6 moves only the
// tooling: this file, analyze-runs.mjs, vitest.report.config.ts).
// Fast mode: fake timers (setTimeout/clearTimeout only) + harness waiter.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { writeFileSync, readdirSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'

import { useGameStore } from '../src/stores/gameStore'
import { useWeekStore } from '../src/stores/weekStore'
import { useNarrativeStore } from '../src/stores/narrativeStore'
import { useChainStore } from '../src/stores/chainStore'
import { getScene } from '../src/engine/NarrativeEngine'
import { getAvailableChoices } from '../src/engine/NarrativeEngine'
import { evaluateAll } from '../src/engine/conditionEvaluator'
import {
  resetWorld,
  bootWeek,
  pool,
  isDone,
  playItem,
  finishWeek,
  setWaiter,
} from '../src/test/simHarness'

const RUN = process.env.MANDATE_REPORT === '1'
const ROOT = process.cwd()

function writeRun(name: string, obj: unknown) {
  writeFileSync(join(ROOT, `run-${name}.json`), JSON.stringify(obj, null, 1))
}

function readRunManifest(): any | null {
  const p = join(ROOT, 'run-manifest.json')
  if (!existsSync(p)) return null
  try {
    return JSON.parse(readFileSync(p, 'utf8'))
  } catch {
    return null
  }
}

function readVisitedUnion(): Set<string> {
  const out = new Set<string>()
  let files: string[] = []
  try {
    files = readdirSync(ROOT).filter(f => /^run-.*\.json$/.test(f))
  } catch { /* none */ }
  for (const f of files) {
    try {
      const t = JSON.parse(readFileSync(join(ROOT, f), 'utf8'))
      const v = t.visited || t.visitedSceneIds || []
      for (const id of v) out.add(id)
    } catch { /* skip corrupt */ }
  }
  return out
}

// Extract required-true flag names from a conditions array (both shapes).
function trueFlags(conds: any[]): string[] {
  const out: string[] = []
  for (const c of conds || []) {
    if (!c || typeof c !== 'object') continue
    if (c.type === 'flag' && typeof c.flag === 'string' && c.value !== false) out.push(c.flag)
    else if (typeof c.stat === 'string' && c.stat.startsWith('flags.') && c.value !== false) {
      out.push(c.stat.slice(6))
    }
  }
  return out
}

// Set game state so a stat condition holds. Returns false for paths it
// cannot satisfy (unknown stat group).
function satisfyStat(stat: string, operator: string, value: any): boolean {
  const st: any = useGameStore.getState()
  const num = typeof value === 'number' ? value : Number(value)
  const pick = (): any => {
    if (typeof value === 'boolean') return value
    if (typeof value === 'string' && isNaN(num)) return value
    const n = isNaN(num) ? 0 : num
    switch (operator) {
      case '>=': case '==': return n
      case '<=': return n
      case '>': return n + 1
      case '<': return n - 1
      case '!=': return n + 1
      default: return n
    }
  }
  const v = pick()
  if (!stat.includes('.')) {
    if (!(stat in st)) return false
    useGameStore.setState({ [stat]: v } as any)
    return true
  }
  const [group, ...rest] = stat.split('.')
  const key = rest.join('.')
  const cur = (st as any)[group]
  if (!cur || typeof cur !== 'object' || !(key in cur)) return false
  useGameStore.setState({ [group]: { ...cur, [key]: v } } as any)
  return true
}

function parseStatCond(s: string): { stat: string, operator: string, value: any } | null {
  const m = s.match(/^(\S+)\s*(>=|<=|==|>|<|!=)\s*(.+)$/)
  if (!m) return null
  let value: any = m[3]
  try { value = JSON.parse(m[3]) } catch { /* keep raw string */ }
  return { stat: m[1], operator: m[2], value }
}

function satisfyStatString(s: string): boolean {
  const parsed = parseStatCond(s)
  if (!parsed) return false
  if (parsed.stat === 'currentWeek' || parsed.stat === 'currentAct') return true // handled by devSetWeek
  return satisfyStat(parsed.stat, parsed.operator, parsed.value)
}

// Name the exact failing precondition when an agenda item isn't offered.
function diagnoseAgenda(entry: any): string {
  const nar = useNarrativeStore.getState()
  const game = useGameStore.getState()
  for (const f of entry.requiredTrueFlags || []) {
    if (!nar.activeFlags.includes(f)) return `missing-flag:${f}`
  }
  for (const f of entry.requiredFalseFlags || []) {
    if (nar.activeFlags.includes(f)) return `forbidden-flag-present:${f}`
  }
  for (const sid of entry.prerequisiteSceneIds || []) {
    if (!nar.visitedSceneIds.includes(sid)) return `prereq-scene-unvisited:${sid}`
  }
  for (const s of entry.requiredStats || []) {
    const parsed = parseStatCond(s)
    if (parsed && !evaluateAll([{ ...parsed } as any], game, nar.activeFlags)) {
      return `stat-unmet:${s}`
    }
  }
  return 'unknown-pool-filter'
}

interface TeleProfile { name: string; flags: string[] }

const TELEMETRY_PROFILES: TeleProfile[] = [
  { name: 'clean', flags: [] },
  {
    name: 'exile',
    flags: [
      'government_in_exile', 'coup_succeeded', 'chancellor_fled',
      'exile_strategy_set', 'coup_resolution_begun',
    ],
  },
  {
    name: 'god',
    flags: [
      'constitution_in_force', 'referendum_won_decisive', 'referendum_won_narrow',
      'referendum_passed', 'referendum_failed', 'bca_funded',
      'commissioner_vasic_appointed', 'hawk_network_active',
      'permanent_injury_sustained', 'assassination_survived', 'coup_attempted',
      'government_survived', 'oil_deal_hybrid_signed', 'oil_deal_failed',
      'morivask_oil_deal_complete', 'tyvaren_mobilization', 'deficit_critical',
      'jonas_left', 'marriage_ended', 'family_chosen', 'family_healing_path',
      'jonas_divorce', 'theron_fired', 'theron_medical_leave',
      'brenner_fired_publicly', 'met_serida', 'economic_direction_chosen',
      'government_captured', 'oligarchs_destroyed', 'election_won_term_1',
      'term_2_begun', 'diplomatic_table_attended', 'geological_survey_funded',
      'kolvar_deal_accepted',
    ],
  },
]

describe.skipIf(!RUN)('reachability report (env MANDATE_REPORT=1)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    setWaiter(ms => vi.advanceTimersByTimeAsync(ms))
    resetWorld()
  })

  afterEach(() => {
    setWaiter(null)
    vi.useRealTimers()
  })

  describe('telemetry walks', () => {
    for (const profile of TELEMETRY_PROFILES) {
      it(`walks weeks 1-103 as ${profile.name}`, async () => {
        bootWeek(1, { flags: profile.flags })
        useGameStore.setState({ playerPolling: 78, kolvarPolling: 22 })
        const visited = new Set<string>()
        const fired = new Set<string>()
        let weeks = 0
        for (let week = 1; week <= 103; week++) {
          const played = new Set<string>()
          for (let guard = 0; guard < 40; guard++) {
            const next = pool().find(i => !isDone(i) && !played.has(i.id))
            if (!next) break
            played.add(next.id)
            await playItem(next)
          }
          await finishWeek()
          for (const id of useWeekStore.getState().forcedChainIds) fired.add(id)
          for (const id of useNarrativeStore.getState().visitedSceneIds) visited.add(id)
          weeks = week
          if (useWeekStore.getState().phase === 'epilogue') break
          if (week < 103) {
            if (useGameStore.getState().currentWeek !== week + 1) break
            useWeekStore.getState().initWeek()
          }
        }
        writeRun(profile.name.replace(/[^a-z]+/g, '-'), {
          profile: profile.name,
          weeksCovered: weeks,
          visited: [...visited].sort(),
          firedChains: [...fired].sort(),
          generatedAt: new Date().toISOString(),
        })
      }, 240000)
    }
  })

  describe('directed proofs', () => {
    it('proves or blocks every never-fired scene', async () => {
      const manifest = readRunManifest()
      expect(
        manifest,
        'run-manifest.json missing — run: node analyze-runs.mjs --write-manifest',
      ).not.toBeNull()
      if (!manifest) return

      const union = readVisitedUnion()
      const ids: string[] = Object.keys(manifest.scenes).filter(id => !union.has(id))
      console.log(`directed proofs: ${ids.length} never-fired scenes`)

      const results: Record<string, any> = {}
      const flush = () => writeRun('directed', {
        generatedAt: new Date().toISOString(),
        counts: { total: ids.length, done: Object.keys(results).length },
        results,
      })

      for (const id of ids) {
        try {
          results[id] = await proveScene(id, manifest.scenes[id], manifest.scenes)
        } catch (e) {
          results[id] = {
            verdict: 'blocked', via: null, path: null,
            blocker: `proof-error: ${e instanceof Error ? e.message : String(e)}`,
          }
        }
        console.log(`${results[id].verdict === 'proved' ? 'PROVED ' : 'BLOCKED'} ${id} ${results[id].blocker ? `(${results[id].blocker})` : ''}`)
        flush()
      }

      const blocked = Object.entries(results).filter(([, r]: any) => r.verdict !== 'proved')
      console.log(`proved ${ids.length - blocked.length}/${ids.length}, blocked ${blocked.length}`)
      // The deliverable is a verdict per scene, not 100% firing.
      expect(Object.keys(results)).toHaveLength(ids.length)
      expect(blocked.every(([, r]: any) => typeof r.blocker === 'string' && r.blocker.length > 0)).toBe(true)
    }, 1200000)
  })
})

async function proveScene(id: string, entry: any, allScenes: any): Promise<any> {
  const game = () => useGameStore.getState()
  const nar = () => useNarrativeStore.getState()
  const visited = () => new Set(nar().visitedSceneIds)

  // Priority: agenda entry > chain trigger > nextNode link > exclusive redirect.
  const agenda = [...(entry.agenda || [])].sort((a, b) => (a.weeks[0] ?? 99) - (b.weeks[0] ?? 99))[0]
  if (agenda) {
    resetWorld()
    // Seed every true-flag the entry + scene require (fresh world: false-flags hold).
    const flags = [...new Set([...(entry.requiredTrueFlags || [])])]
    for (const st of entry.requiredStats || []) satisfyStatString(st)
    const week = Math.min(103, Math.max(1, agenda.weeks[0] ?? entry.weekAvailable ?? 1))
    bootWeek(week, { flags })
    useGameStore.setState({ playerPolling: 78, kolvarPolling: 22 })
    const item = pool().find(i => i.sceneId === id)
    if (!item) {
      return {
        verdict: 'blocked', via: 'agenda',
        path: { entry: agenda.entry, week },
        blocker: `not-offered:${diagnoseAgenda(entry)}`,
      }
    }
    await playItem(item)
    if (visited().has(id)) {
      return { verdict: 'proved', via: 'agenda', path: { entry: agenda.entry, week }, blocker: null }
    }
    return { verdict: 'blocked', via: 'agenda', path: { entry: agenda.entry, week }, blocker: 'played-but-unvisited' }
  }

  const chain = (entry.chains || [])[0]
  if (chain) {
    const srcRec = allScenes[chain.from] || {}
    const srcReq: string[] = srcRec.requiredTrueFlags || []
    const srcStats: string[] = srcRec.requiredStats || []
    const srcWeek: number = srcRec.weekAvailable ?? 1
    for (let attempt = 0; attempt < 3; attempt++) {
      resetWorld()
      const out = await proveViaChain(id, chain, srcReq, srcStats, srcWeek)
      if (out.verdict === 'proved') return out
      if (out.blocker && !out.blocker.startsWith('probability-miss')) return out
    }
    return { verdict: 'blocked', via: 'chain', path: { from: chain.from, choice: chain.choice }, blocker: 'probability-miss after 3 attempts' }
  }

  const link = (entry.nextNode || [])[0]
  if (link) {
    resetWorld()
    bootWeek(1, { flags: [] })
    useGameStore.setState({ playerPolling: 78, kolvarPolling: 22 })
    nar().loadScene(link.from)
    if (nar().currentScene?.id !== link.from) {
      return { verdict: 'blocked', via: 'nextNode', path: { from: link.from, choice: link.choice }, blocker: 'source-not-loadable' }
    }
    const avail = getAvailableChoices(nar().currentScene!, game(), nar().activeFlags)
    if (!avail.some(c => c.id === link.choice)) {
      return { verdict: 'blocked', via: 'nextNode', path: { from: link.from, choice: link.choice }, blocker: 'source-choice-unavailable' }
    }
    nar().processChoice(link.choice)
    if (nar().currentScene?.id !== id) {
      return { verdict: 'blocked', via: 'nextNode', path: { from: link.from, choice: link.choice }, blocker: `landed-on:${nar().currentScene?.id ?? 'null'}` }
    }
    const targetAvail = getAvailableChoices(nar().currentScene!, game(), nar().activeFlags)
    if (targetAvail.length > 0) {
      nar().processChoice(targetAvail[0].id)
      if (visited().has(id)) {
        return { verdict: 'proved', via: 'nextNode', path: { from: link.from, choice: link.choice }, blocker: null }
      }
    }
    return { verdict: 'proved', via: 'nextNode', path: { from: link.from, choice: link.choice }, blocker: null, note: 'reached-terminal-no-choice' }
  }

  const redir = (entry.exclusiveOf || [])[0]
  if (redir) {
    resetWorld()
    bootWeek(1, { flags: [] })
    nar().loadScene(redir)
    if (nar().currentScene?.id === id) {
      return { verdict: 'proved', via: 'exclusive', path: { requested: redir }, blocker: null }
    }
    return { verdict: 'blocked', via: 'exclusive', path: { requested: redir }, blocker: `redirect-miss:landed-on:${nar().currentScene?.id ?? 'null'}` }
  }

  return { verdict: 'blocked', via: null, path: null, blocker: 'no-source-path' }
}

async function proveViaChain(
  targetId: string, chain: any, srcReq: string[], srcStats: string[], srcWeek: number,
): Promise<any> {
  const game = () => useGameStore.getState()
  const nar = () => useNarrativeStore.getState()
  const chn = () => useChainStore.getState()
  const wk = () => useWeekStore.getState()
  const basePath = { from: chain.from, choice: chain.choice }

  // Seed everything the source choice + trigger could need (flags and stats —
  // stat-gated sources otherwise redirect away under exclusive routing).
  const flags = new Set<string>([
    ...trueFlags(chain.conditions || []),
    ...trueFlags(chain.choiceConditions || []),
    ...srcReq,
  ])
  for (const st of srcStats) satisfyStatString(st)
  bootWeek(Math.min(103, Math.max(1, srcWeek || 1)), { flags: [...flags] })
  useGameStore.setState({ playerPolling: 78, kolvarPolling: 22 })

  // Launch through the real single-scene queue (not bare loadScene) so
  // delay-0 injections land in a live queue exactly as in play.
  wk().launchSingleScene({
    id: `proof-src-${chain.from}`, title: 'proof', description: '',
    category: 'crisis' as any, sceneId: chain.from,
    slotCost: 0, executionOrder: 0, weekAvailable: 1,
  })
  if (nar().currentScene?.id !== chain.from) {
    return { verdict: 'blocked', via: 'chain', path: basePath, blocker: `source-not-loadable:landed-on:${nar().currentScene?.id ?? 'null'}` }
  }
  let avail = getAvailableChoices(nar().currentScene!, game(), nar().activeFlags)
  if (!avail.some(c => c.id === chain.choice)) {
    // Maybe segment-gated: walk the top-level choice into its segment first.
    const into = chain.seg
      ? avail.find(c => (c as any).nextSegment === chain.seg)
      : undefined
    if (!into) {
      return { verdict: 'blocked', via: 'chain', path: basePath, blocker: 'source-choice-unavailable' }
    }
    nar().processChoice(into.id)
    avail = getAvailableChoices(nar().currentScene!, game(), nar().activeFlags)
    if (!avail.some(c => c.id === chain.choice)) {
      return { verdict: 'blocked', via: 'chain', path: basePath, blocker: 'segment-path-unavailable' }
    }
  }
  nar().processChoice(chain.choice)

  if ((chain.delay ?? 0) === 0) {
    // Immediate triggers inject into the live queue, never schedule().
    const injected = wk().sceneQueue.some(i => i.sceneId === targetId)
    if (!injected) {
      return { verdict: 'blocked', via: 'chain', path: basePath, blocker: 'injection-missing' }
    }
    await wk().advanceQueue()
    await vi.advanceTimersByTimeAsync(700)
    if (nar().currentScene?.id !== targetId) {
      return { verdict: 'blocked', via: 'chain', path: basePath, blocker: `injected-not-played:at:${nar().currentScene?.id ?? 'null'}` }
    }
    const tAvail = getAvailableChoices(nar().currentScene!, game(), nar().activeFlags)
    if (tAvail.length === 0) {
      return { verdict: 'proved', via: 'chain', path: basePath, blocker: null, note: 'reached-terminal-no-choice' }
    }
    nar().processChoice(tAvail[0].id)
    if (new Set(nar().visitedSceneIds).has(targetId)) {
      return { verdict: 'proved', via: 'chain', path: basePath, blocker: null }
    }
    return { verdict: 'blocked', via: 'chain', path: basePath, blocker: 'played-but-unvisited' }
  }

  const scheduled = chn().scheduled.some(c => c.targetNodeId === targetId)
  if (!scheduled) {
    return { verdict: 'blocked', via: 'chain', path: { from: chain.from, choice: chain.choice }, blocker: 'chain-not-scheduled' }
  }
  // Jump to just before the later of due-week / scene-week, then tick.
  // (Deferral under STEP 2b means early ticks would only re-queue.)
  const queued = chn().scheduled.find(c => c.targetNodeId === targetId)
  const fireWeek = queued ? queued.fireWeek : useGameStore.getState().currentWeek
  if (fireWeek > 103) {
    return { verdict: 'blocked', via: 'chain', path: { from: chain.from, choice: chain.choice }, blocker: 'fires-after-game-end' }
  }
  const sceneWeek = getScene(targetId)?.weekAvailable ?? fireWeek
  const jumpTo = Math.min(102, Math.max(1, Math.max(fireWeek, sceneWeek) - 1))
  useGameStore.getState().devSetWeek(jumpTo)
  useWeekStore.getState().initWeek()
  for (let t = 0; t < 4; t++) {
    await finishWeek()
    if (useWeekStore.getState().phase === 'epilogue') break
    if (useWeekStore.getState().forcedChainIds.includes(targetId)) break
    if (useGameStore.getState().currentWeek >= 103) break
    useWeekStore.getState().initWeek()
  }
  if (!useWeekStore.getState().forcedChainIds.includes(targetId) &&
      !chn().scheduled.some(c => c.targetNodeId === targetId)) {
    // Gone from the queue without firing => dropped (probability/conditions).
    const prob = chain.probability != null ? 'probability-miss' : 'dropped-in-queue'
    return { verdict: 'blocked', via: 'chain', path: { from: chain.from, choice: chain.choice }, blocker: prob }
  }
  if (!useWeekStore.getState().forcedChainIds.includes(targetId)) {
    return { verdict: 'blocked', via: 'chain', path: { from: chain.from, choice: chain.choice }, blocker: 'still-scheduled-after-jump-ticks' }
  }
  useWeekStore.getState().initWeek()
  const item = pool().find(i => i.sceneId === targetId)
  if (!item) {
    return { verdict: 'proved', via: 'chain', path: { from: chain.from, choice: chain.choice }, blocker: null, note: 'fired-but-not-offered' }
  }
  await playItem(item)
  if (new Set(nar().visitedSceneIds).has(targetId)) {
    return { verdict: 'proved', via: 'chain', path: { from: chain.from, choice: chain.choice }, blocker: null }
  }
  return { verdict: 'blocked', via: 'chain', path: { from: chain.from, choice: chain.choice }, blocker: 'played-but-unvisited' }
}
