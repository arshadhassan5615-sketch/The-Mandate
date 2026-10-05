/**
 * Directed-reachability analyzer (Round 3 STEP 3; in scripts/ per STEP 6).
 * Run from the repo root: node scripts/analyze-runs.mjs [--write-manifest]
 *
 * Static pass: for EVERY narrative scene, derive its source paths —
 *   agenda   entries (file, weeks, prerequisites)
 *   chains   incoming chainTriggers (source scene + choice + delay + conditions)
 *   nextNode incoming nextNodeId links (source scene + choice)
 *   exclusive scenes whose exclusive[] list redirects here
 * plus the flag footprint (set anywhere vs required-true anywhere).
 *
 * Telemetry pass: reads run-*.json files in the repo root
 *   ({ profile, visited: [sceneIds...], firedChains: [...] }) and marks
 *   which scenes never fired across all runs.
 *
 * --write-manifest emits run-manifest.json (UNCOMMITTED telemetry input for
 * playthroughs.report.test.ts directed proofs — see STEP 6: run-*.json files
 * are never committed).
 *
 * Path note: resolves the repo root from its own location so it keeps
 * working after the STEP 6 move into scripts/.
 */

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO = existsSync(join(HERE, 'src', 'data', 'narrative')) ? HERE : join(HERE, '..')
const NARR = join(REPO, 'src', 'data', 'narrative')
const AGENDA = join(REPO, 'src', 'data', 'agenda')

function walkJson(dir, out = []) {
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, f.name)
    if (f.isDirectory()) walkJson(p, out)
    else if (f.name.endsWith('.json')) {
      try {
        out.push({ file: p, data: JSON.parse(readFileSync(p, 'utf8')) })
      } catch { /* skip unreadable */ }
    }
  }
  return out
}

// Flags a condition *requires to be true*. Returns {needTrue[], needFalse[], stats[]}.
function splitConditions(conds) {
  const needTrue = [], needFalse = [], stats = []
  for (const c of conds || []) {
    if (!c || typeof c !== 'object') continue
    if (c.type === 'flag' && typeof c.flag === 'string') {
      ;(c.value === false ? needFalse : needTrue).push(c.flag)
    } else if (typeof c.stat === 'string') {
      if (c.stat.startsWith('flags.')) {
        ;(c.value === false ? needFalse : needTrue).push(c.stat.slice(6))
      } else {
        stats.push(`${c.stat} ${c.operator} ${JSON.stringify(c.value)}`)
      }
    }
  }
  return { needTrue, needFalse, stats }
}

const scenes = new Map() // id -> record
for (const { file, data: s } of walkJson(NARR)) {
  if (!s || !s.id) continue
  scenes.set(s.id, {
    id: s.id,
    file,
    weekAvailable: s.weekAvailable ?? null,
    weekDeadline: s.weekDeadline ?? null,
    prerequisites: s.prerequisites || [],
    prerequisiteFlags: s.prerequisiteFlags || [],
    prerequisiteSceneIds: s.prerequisiteSceneIds || [],
    exclusive: s.exclusive || [],
    choices: (s.choices || []).map(c => ({
      id: c.id,
      conditions: c.conditions || [],
      chainTriggers: c.chainTriggers || [],
      nextNodeId: c.nextNodeId || null,
      nextSegment: c.nextSegment || null,
      flags: c.flags || [],
    })),
    segments: Object.fromEntries(
      Object.entries(s.segments || {}).map(([k, v]) => [k, {
        choices: (v.choices || []).map(c => ({
          id: c.id,
          conditions: c.conditions || [],
          chainTriggers: c.chainTriggers || [],
          nextNodeId: c.nextNodeId || null,
          nextSegment: c.nextSegment || null,
          flags: c.flags || [],
        })),
      }]),
    ),
  })
}

// ---- reverse indexes: who can fire each scene ----
const byTarget = new Map() // sceneId -> { agenda[], chains[], nextNode[], exclusiveOf[] }
function entry(id) {
  if (!byTarget.has(id)) byTarget.set(id, { agenda: [], chains: [], nextNode: [], exclusiveOf: [] })
  return byTarget.get(id)
}

for (const f of readdirSync(AGENDA).filter(f => f.endsWith('.json'))) {
  let items
  try { items = JSON.parse(readFileSync(join(AGENDA, f), 'utf8')) } catch { continue }
  for (const e of Array.isArray(items) ? items : []) {
    if (!e || !e.sceneId) continue
    entry(e.sceneId).agenda.push({
      entryId: e.id, file: f,
      weekAvailable: e.weekAvailable ?? null,
      weekDeadline: e.weekDeadline ?? null,
      prerequisites: e.prerequisites || [],
    })
  }
}

for (const s of scenes.values()) {
  const fire = (choiceLoc, c) => {
    for (const t of c.chainTriggers || []) {
      if (t && t.targetNodeId) {
        entry(t.targetNodeId).chains.push({
          fromScene: s.id, choiceId: c.id, loc: choiceLoc,
          delayWeeks: t.delayWeeks ?? 0,
          probability: t.probability ?? null,
          conditions: t.conditions || [],
          choiceConditions: c.conditions || [],
        })
      }
    }
    if (c.nextNodeId) {
      entry(c.nextNodeId).nextNode.push({
        fromScene: s.id, choiceId: c.id, loc: choiceLoc,
        choiceConditions: c.conditions || [],
      })
    }
  }
  for (const c of s.choices) fire('top', c)
  for (const [k, seg] of Object.entries(s.segments)) for (const c of seg.choices) fire('seg:' + k, c)
  for (const alt of s.exclusive || []) entry(alt).exclusiveOf.push(s.id)
}

// ---- flag footprint: set anywhere vs required-true anywhere ----
const setFlags = new Set()
const readTrueByFlag = new Map() // flag -> [sceneIds that require it]
for (const s of scenes.values()) {
  const consider = (conds, where) => {
    const { needTrue } = splitConditions(conds)
    for (const f of needTrue) {
      if (!readTrueByFlag.has(f)) readTrueByFlag.set(f, [])
      readTrueByFlag.get(f).push(`${s.id}${where}`)
    }
  }
  consider(s.prerequisites, ':scene-prereq')
  for (const f of s.prerequisiteFlags) {
    if (!readTrueByFlag.has(f)) readTrueByFlag.set(f, [])
    readTrueByFlag.get(f).push(`${s.id}:prerequisiteFlags`)
  }
  const walkChoices = (list, loc) => {
    for (const c of list) {
      for (const f of c.flags || []) setFlags.add(f)
      consider(c.conditions, `:${loc}${c.id}`)
      for (const t of c.chainTriggers || []) consider(t.conditions, `:${loc}${c.id}>chain`)
    }
  }
  walkChoices(s.choices, '')
  for (const [k, seg] of Object.entries(s.segments)) walkChoices(seg.choices, k + '#')
}
for (const f of readdirSync(AGENDA).filter(f => f.endsWith('.json'))) {
  let items
  try { items = JSON.parse(readFileSync(join(AGENDA, f), 'utf8')) } catch { continue }
  for (const e of Array.isArray(items) ? items : []) {
    const { needTrue } = splitConditions(e.prerequisites)
    for (const fl of needTrue) {
      if (!readTrueByFlag.has(fl)) readTrueByFlag.set(fl, [])
      readTrueByFlag.get(fl).push(`${e.sceneId}:agenda:${e.id}`)
    }
  }
}
// Engine-set flags (never appear in choice.flags but exist at runtime).
for (const f of ['tyvaren_mobilization', 'deficit_critical', 'impeachment_triggered',
  'election_won_term_1', 'budget_finalized', 'assassination_attempted']) setFlags.add(f)

// ---- telemetry: union of visited across run-*.json ----
let teleFiles = []
try {
  teleFiles = readdirSync(REPO).filter(f => /^run-.*\.json$/.test(f) && !/manifest/.test(f))
} catch { /* none */ }
const visitedUnion = new Set()
const teleMeta = []
for (const f of teleFiles) {
  try {
    const t = JSON.parse(readFileSync(join(REPO, f), 'utf8'))
    const v = t.visited || t.visitedSceneIds || []
    for (const id of v) visitedUnion.add(id)
    teleMeta.push({ file: f, profile: t.profile || '?', visited: v.length, weeks: t.weeksCovered || t.weeks || null })
  } catch { /* skip corrupt */ }
}

// ---- per-scene source summary + blocker pre-classification ----
function uniq(arr) { return [...new Set(arr)] }
const manifest = {}
for (const s of scenes.values()) {
  const src = byTarget.get(s.id) || { agenda: [], chains: [], nextNode: [], exclusiveOf: [] }
  const reqTrue = new Set(), reqFalse = new Set(), reqStats = new Set()
  const absorb = (conds) => {
    const sp = splitConditions(conds)
    for (const f of sp.needTrue) reqTrue.add(f)
    for (const f of sp.needFalse) reqFalse.add(f)
    for (const st of sp.stats) reqStats.add(st)
  }
  absorb(s.prerequisites)
  for (const f of s.prerequisiteFlags) reqTrue.add(f)
  for (const a of src.agenda) absorb(a.prerequisites)
  const fired = visitedUnion.has(s.id)
  const kind =
    src.agenda.length > 0 ? (src.chains.length > 0 ? 'agenda+chain' : 'agenda') :
    src.chains.length > 0 ? 'chain-only' :
    src.nextNode.length > 0 ? 'nextNode-only' :
    src.exclusiveOf.length > 0 ? 'exclusive-only' : 'no-source'
  manifest[s.id] = {
    file: s.file.replace(REPO + '/', ''),
    weekAvailable: s.weekAvailable, weekDeadline: s.weekDeadline,
    kind, fired,
    agenda: src.agenda.map(a => ({ entry: a.entryId, weeks: [a.weekAvailable, a.weekDeadline] })),
    chains: src.chains.map(c => ({ from: c.fromScene, choice: c.choiceId, seg: c.loc && c.loc.startsWith('seg:') ? c.loc.slice(4) : null, delay: c.delayWeeks, probability: c.probability, conditions: c.conditions, choiceConditions: c.choiceConditions })),
    nextNode: src.nextNode.map(n => ({ from: n.fromScene, choice: n.choiceId, choiceConditions: n.choiceConditions })),
    exclusiveOf: src.exclusiveOf,
    requiredTrueFlags: [...reqTrue].sort(),
    requiredFalseFlags: [...reqFalse].sort(),
    requiredStats: [...reqStats].sort(),
    prerequisiteSceneIds: [...new Set(s.prerequisiteSceneIds || [])].sort(),
    neverSetFlags: [...reqTrue].filter(f => !setFlags.has(f)).sort(),
  }
}

const allIds = [...scenes.keys()]
const neverFired = allIds.filter(id => !visitedUnion.has(id))
const byKind = {}
for (const id of neverFired) {
  const k = manifest[id].kind
  byKind[k] = (byKind[k] || 0) + 1
}

console.log(`scenes in registry : ${allIds.length}`)
console.log(`telemetry runs     : ${teleFiles.length}${teleMeta.length ? ' (' + teleMeta.map(t => `${t.profile}:${t.visited}`).join(', ') + ')' : ''}`)
console.log(`visited (union)    : ${visitedUnion.size}`)
console.log(`never-fired        : ${neverFired.length}`, JSON.stringify(byKind))

const arg = process.argv[2]
if (arg === '--write-manifest') {
  const out = {
    generatedAt: new Date().toISOString(),
    counts: { scenes: allIds.length, visited: visitedUnion.size, neverFired: neverFired.length, byKind },
    setFlagsCount: setFlags.size,
    scenes: manifest,
  }
  writeFileSync(join(REPO, 'run-manifest.json'), JSON.stringify(out, null, 1))
  console.log('wrote run-manifest.json (UNCOMMITTED telemetry input)')
} else {
  console.log('tip: node scripts/analyze-runs.mjs --write-manifest  (emits run-manifest.json, never committed)')
}
