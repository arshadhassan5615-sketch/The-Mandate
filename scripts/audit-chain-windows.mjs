// Static check: can every chainTrigger's consequence ever land inside its target scene's window?
//
// For each chain (source choice -> target scene):
//   - source play window = source scene window ∩ union of windows of agenda entries that launch it
//     (no launching agenda entry => scene window only; unbounded bounds stay unbounded)
//   - possible fire weeks = each play interval shifted by delayWeeks
//   - target window = [weekAvailable ?? 1, weekDeadline ?? ∞]
//   - late = every possible fire week is after the target deadline
//     (the engine defers early fires until weekAvailable, so early fires still land)
//   - late chain is REDUNDANT_LATE (informational) when the target has another launch path:
//     an agenda entry, a choice nextNodeId, or another chain whose fire range overlaps the window
//   - late chain with no other launch path is IMPOSSIBLE (failure): it can never be delivered
//
// Usage: node scripts/audit-chain-windows.mjs   (exit code 1 only when any chain is IMPOSSIBLE)
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const NARRATIVE_DIR = 'src/data/narrative'
const AGENDA_DIR = 'src/data/agenda'

function listJsonFiles(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    if (name === '__tests__') continue
    const full = join(dir, name)
    if (statSync(full).isDirectory()) out.push(...listJsonFiles(full))
    else if (name.endsWith('.json')) out.push(full)
  }
  return out
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'))
}

function windowOf(entry) {
  return {
    start: entry.weekAvailable ?? 1,
    end: entry.weekDeadline ?? Infinity,
  }
}

function intersect(a, b) {
  return { start: Math.max(a.start, b.start), end: Math.min(a.end, b.end) }
}

function isNonEmpty(w) {
  return w.start <= w.end
}

function collectChoices(scene) {
  const choices = [...(scene.choices ?? [])]
  for (const segment of Object.values(scene.segments ?? {})) {
    choices.push(...(segment.choices ?? []))
  }
  return choices
}

function loadScenes(root) {
  const scenes = []
  for (const file of listJsonFiles(join(root, NARRATIVE_DIR))) {
    const data = readJson(file)
    if (data && typeof data === 'object' && !Array.isArray(data) && data.id) {
      scenes.push({ ...data, __file: file })
    }
  }
  return scenes
}

function loadAgenda(root) {
  const entries = []
  for (const name of readdirSync(join(root, AGENDA_DIR))) {
    if (!name.endsWith('.json')) continue
    const data = readJson(join(root, AGENDA_DIR, name))
    if (Array.isArray(data)) entries.push(...data)
  }
  return entries
}

// Returns the play intervals of a source scene: its window intersected with each
// launching agenda entry's window (scene window alone when nothing launches it).
function playIntervals(scene, agendaByScene) {
  const sceneWindow = windowOf(scene)
  const launchers = agendaByScene.get(scene.id) ?? []
  if (launchers.length === 0) return [sceneWindow].filter(isNonEmpty)
  return launchers
    .map(entry => intersect(windowOf(entry), sceneWindow))
    .filter(isNonEmpty)
}

// A chain fire range [earliest, latest] overlaps the target window: the chain still launches it.
function overlapsTargetWindow(chain) {
  const [start, end] = chain.targetWindow
  return chain.fireWindow[1] >= start && chain.fireWindow[0] <= end
}

// A late chain is redundant when its target is also reached another way.
function hasOtherLaunchPath(chain, chains, agendaByScene, nextNodeTargets) {
  if (agendaByScene.has(chain.target)) return true
  if (nextNodeTargets.has(chain.target)) return true
  return chains.some(
    other => other.status === 'OK' && other.target === chain.target && overlapsTargetWindow(other),
  )
}

function classifyLate(chain, chains, agendaByScene, nextNodeTargets) {
  return hasOtherLaunchPath(chain, chains, agendaByScene, nextNodeTargets)
    ? 'REDUNDANT_LATE'
    : 'IMPOSSIBLE'
}

export function auditChainWindows(root = SCRIPT_ROOT) {
  const scenes = loadScenes(root)
  const agenda = loadAgenda(root)
  const sceneById = new Map(scenes.map(s => [s.id, s]))
  const agendaByScene = new Map()
  for (const entry of agenda) {
    if (!agendaByScene.has(entry.sceneId)) agendaByScene.set(entry.sceneId, [])
    agendaByScene.get(entry.sceneId).push(entry)
  }
  const nextNodeTargets = new Set()
  for (const scene of scenes) {
    for (const choice of collectChoices(scene)) {
      if (choice.nextNodeId) nextNodeTargets.add(choice.nextNodeId)
    }
  }

  const pending = []
  for (const scene of scenes) {
    const intervals = playIntervals(scene, agendaByScene)
    for (const choice of collectChoices(scene)) {
      for (const trigger of choice.chainTriggers ?? []) {
        const target = sceneById.get(trigger.targetNodeId)
        const base = {
          source: scene.id,
          choice: choice.id,
          target: trigger.targetNodeId,
          delay: trigger.delayWeeks,
        }
        if (!target) {
          pending.push({ ...base, status: 'UNKNOWN_TARGET' })
          continue
        }
        if (intervals.length === 0) {
          pending.push({ ...base, status: 'UNREACHABLE_SOURCE' })
          continue
        }
        const targetWindow = windowOf(target)
        const earliestFire = Math.min(...intervals.map(i => i.start + trigger.delayWeeks))
        const latestFire = Math.max(...intervals.map(i => i.end + trigger.delayWeeks))
        const isLate = earliestFire > targetWindow.end
        pending.push({
          ...base,
          sourceWindow: intervals.map(i => [i.start, i.end]),
          fireWindow: [earliestFire, latestFire],
          targetWindow: [targetWindow.start, targetWindow.end],
          targetHasAgenda: agendaByScene.has(target.id),
          status: isLate ? 'LATE' : 'OK',
        })
      }
    }
  }

  const chains = pending.map(chain =>
    chain.status === 'LATE'
      ? { ...chain, status: classifyLate(chain, pending, agendaByScene, nextNodeTargets) }
      : chain,
  )
  return {
    chains,
    impossible: chains.filter(c => c.status === 'IMPOSSIBLE'),
    redundantLate: chains.filter(c => c.status === 'REDUNDANT_LATE'),
  }
}

function fmt(range) {
  return `[${range[0]}, ${range[1] === Infinity ? 'inf' : range[1]}]`
}

function describeChain(c) {
  const detail = c.fireWindow
    ? `source=${fmt(c.sourceWindow[0])} fire=${fmt(c.fireWindow)} target=${fmt(c.targetWindow)}`
    : ''
  return `${c.status}  ${c.source} / ${c.choice} -> ${c.target} (delay ${c.delay}) ${detail}`
}

function main() {
  const { chains, impossible, redundantLate } = auditChainWindows()
  console.log(`IMPOSSIBLE (${impossible.length}):`)
  for (const c of impossible) console.log(describeChain(c))
  console.log(`REDUNDANT_LATE (${redundantLate.length}, informational):`)
  for (const c of redundantLate) console.log(describeChain(c))
  const others = chains.filter(c => c.status !== 'OK' && c.status !== 'IMPOSSIBLE' && c.status !== 'REDUNDANT_LATE')
  for (const c of others) console.log(describeChain(c))
  console.log(
    `chains checked: ${chains.length}, REDUNDANT_LATE: ${redundantLate.length}, IMPOSSIBLE: ${impossible.length}`,
  )
  if (impossible.length > 0) process.exitCode = 1
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main()
}
