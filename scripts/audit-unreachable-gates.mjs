#!/usr/bin/env node
// Static audit: agenda entries, scene gates, choice/segment conditions and chain
// triggers whose conditions can never be satisfied (flags nothing sets, stat paths
// that do not resolve, contradictory numeric ranges) and targets that do not exist.
//
// Report-only. Writes unreachable-gates-report.md and unreachable-gates-report.json
// at the repo root. Deterministic: all collections are sorted before output.
//
// Usage: node scripts/audit-unreachable-gates.mjs

import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'src')
const DATA = join(SRC, 'data')
const AGENDA_DIR = join(DATA, 'agenda')
const NARRATIVE_DIR = join(DATA, 'narrative')
const GAME_STATE_FILE = join(SRC, 'types', 'gameState.ts')
const NARRATIVE_TYPES_FILE = join(SRC, 'types', 'narrative.ts')
const EVALUATOR_FILE = join(SRC, 'engine', 'conditionEvaluator.ts')
const OUT_MD = join(ROOT, 'unreachable-gates-report.md')
const OUT_JSON = join(ROOT, 'unreachable-gates-report.json')

const SUGGEST_MAX_DISTANCE = 3
const SUGGEST_MIN_COMMON_PREFIX = 8
const SUGGEST_LIMIT = 5
// Engine-virtual agenda targets (weekStore handles them; they are not registry scenes).
const isVirtualSceneId = (id) => typeof id === 'string' && id.startsWith('__')
const ROOT_STAT_NAMES = ['currentWeek', 'currentAct']
const GROUP_INTERFACES = {
  nation: 'NationState',
  factions: 'FactionState',
  personal: 'PersonalState',
  budget: 'BudgetAllocations',
  advisorTrust: 'AdvisorTrust',
}
// Object keys whose string arrays (or string value, for 'flag') are flag SETTERS in JSON.
const JSON_FLAG_ARRAY_KEY = /^(flags|.+Flags)$/
const JSON_FLAG_ARRAY_EXCLUDE = new Set(['prerequisiteFlags'])
// TypeScript keys / call sites that set flags (string literals in these positions are setters).
const TS_FLAG_KEYS = [
  'flags', 'successFlags', 'failureFlags', 'signFlags', 'vetoFlags', 'consequenceFlags',
  'corruptionFlags', 'seedFlags', 'newFlags', 'allFlags', 'flagsToAdd', 'setFlags', 'flagsSet', 'flag',
]
const TS_FLAG_PUSH_NAMES = ['flags', 'flagsToAdd', 'allFlags', 'seedFlags', 'newFlags', 'consequenceFlags', 'corruptionFlags']
const TS_FLAG_CALLS = ['addFlags', 'addFlag']
// Read-only TS flag arrays (e.g. EconomicEngine unlock/lock lists) are deliberately NOT setters:
// nothing outside the module consumes them.

// ───────────────────────── filesystem helpers ─────────────────────────

const rel = (p) => relative(ROOT, p).split(sep).join('/')

function walk(dir, accept, out = []) {
  for (const name of readdirSync(dir).sort()) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) {
      if (name === '__tests__' || name === 'test') continue
      walk(full, accept, out)
    } else if (accept(full)) {
      out.push(full)
    }
  }
  return out
}

const isTsSource = (p) => /\.(ts|tsx)$/.test(p) && !/\.(test|spec)\./.test(p)
const isJson = (p) => p.endsWith('.json')

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'))
}

// ───────────────────────── levenshtein / suggestions ─────────────────────────

function levenshtein(a, b) {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    prev = cur
  }
  return prev[b.length]
}

function commonPrefixLength(a, b) {
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) i++
  return i
}

function nearestNames(name, candidates) {
  return [...candidates]
    .filter(c => c !== name)
    .map(c => ({ name: c, distance: levenshtein(name, c), prefix: commonPrefixLength(name, c) }))
    .filter(x => x.distance <= SUGGEST_MAX_DISTANCE || x.prefix >= SUGGEST_MIN_COMMON_PREFIX)
    .sort((x, y) => x.distance - y.distance || x.name.localeCompare(y.name))
    .slice(0, SUGGEST_LIMIT)
    .map(({ name: n, distance }) => ({ name: n, distance }))
}

function nearestOne(name, candidates) {
  let best = null
  for (const c of candidates) {
    const d = levenshtein(name, c)
    if (!best || d < best.distance || (d === best.distance && c < best.name)) best = { name: c, distance: d }
  }
  return best
}

// ───────────────────────── TypeScript source parsing ─────────────────────────

function blockAfter(text, header) {
  const start = text.indexOf(header)
  if (start < 0) throw new Error(`audit: header not found in source: ${header}`)
  const open = text.indexOf('{', start)
  let depth = 0
  for (let i = open; i < text.length; i++) {
    if (text[i] === '{') depth++
    else if (text[i] === '}') {
      depth--
      if (depth === 0) return text.slice(open + 1, i)
    }
  }
  throw new Error(`audit: unterminated block after: ${header}`)
}

function stripLineComment(line) {
  return line.replace(/\r$/, '').replace(/\/\/.*$/, '')
}

function parseInterfaceFields(body) {
  const fields = new Map()
  for (const raw of body.split(/\r?\n/)) {
    const m = stripLineComment(raw).match(/^\s+(\w+)\??\s*:\s*(.+?)\s*;?\s*$/)
    if (m) fields.set(m[1], m[2])
  }
  return fields
}

function parseStringAliases(text) {
  const aliases = new Map()
  for (const raw of text.split(/\r?\n/)) {
    const m = stripLineComment(raw).match(/^export type (\w+)\s*=\s*(.+?)\s*$/)
    if (m) aliases.set(m[1], m[2])
  }
  return aliases
}

function isStringUnion(value) {
  return value.split('|').every(part => /^\s*('[^']*'|null)\s*$/.test(part))
}

function loadGameStateModel() {
  const text = readFileSync(GAME_STATE_FILE, 'utf8')
  const aliasMap = parseStringAliases(text)
  const stringUnions = new Set([...aliasMap].filter(([, v]) => isStringUnion(v)).map(([k]) => k))

  const interfaces = new Map()
  for (const name of new Set(Object.values(GROUP_INTERFACES).concat(['GameState']))) {
    interfaces.set(name, parseInterfaceFields(blockAfter(text, `export interface ${name} `)))
  }

  const isScalarType = (t) => {
    const base = t.replace(/\s*\|\s*null\s*$/, '').trim()
    return base === 'number' || base === 'string' || base === 'boolean' || stringUnions.has(base)
  }

  const groups = new Map()
  for (const [group, iface] of Object.entries(GROUP_INTERFACES)) {
    groups.set(group, new Set(interfaces.get(iface).keys()))
  }

  const topScalars = new Set()
  for (const [field, type] of interfaces.get('GameState')) {
    if (isScalarType(type)) topScalars.add(field)
  }

  const rangeBlock = blockAfter(text, 'export const STAT_RANGES')
  const statRanges = new Map()
  for (const m of rangeBlock.matchAll(/^\s*'?([\w.]+)'?\s*:\s*\[\s*([-\w.]+)\s*,\s*([-\w.]+)\s*\]/gm)) {
    statRanges.set(m[1], [Number(m[2]), Number(m[3])])
  }

  const evaluatorText = readFileSync(EVALUATOR_FILE, 'utf8')
  const aliasBlock = blockAfter(evaluatorText, 'const PATH_ALIASES')
  const pathAliases = new Map()
  for (const m of aliasBlock.matchAll(/'([^']+)'\s*:\s*'([^']+)'/g)) {
    pathAliases.set(m[1], m[2])
  }

  return { groups, topScalars, statRanges, pathAliases }
}

// ───────────────────────── stat path resolution (mirrors conditionEvaluator) ─────────────────────────

function createResolver(model) {
  const canonical = []
  for (const [group, keys] of model.groups) for (const k of keys) canonical.push(`${group}.${k}`)
  for (const s of model.topScalars) canonical.push(s)
  canonical.push(...ROOT_STAT_NAMES)

  const validCandidates = [...new Set([...canonical, ...model.pathAliases.keys()])].sort()

  function resolve(path) {
    const aliased = model.pathAliases.get(path) ?? path
    if (ROOT_STAT_NAMES.includes(aliased)) return { ok: true, canonical: aliased, flag: null }
    if (aliased.startsWith('flags.')) return { ok: true, canonical: null, flag: aliased.slice(6) }
    const dot = aliased.indexOf('.')
    if (dot !== -1) {
      const group = aliased.slice(0, dot)
      const key = aliased.slice(dot + 1)
      const ok = model.groups.has(group) && model.groups.get(group).has(key)
      return ok ? { ok: true, canonical: aliased, flag: null } : { ok: false, aliased }
    }
    return model.topScalars.has(aliased)
      ? { ok: true, canonical: aliased, flag: null }
      : { ok: false, aliased }
  }

  return { resolve, validCandidates, canonical }
}

// ───────────────────────── setter flag collection ─────────────────────────

function extractBalanced(text, openIdx) {
  const open = text[openIdx]
  const close = open === '(' ? ')' : open === '[' ? ']' : '}'
  let depth = 0
  for (let i = openIdx; i < text.length; i++) {
    if (text[i] === open) depth++
    else if (text[i] === close) {
      depth--
      if (depth === 0) return text.slice(openIdx + 1, i)
    }
  }
  return text.slice(openIdx + 1)
}

function templateToRegex(template) {
  const parts = template.split(/\$\{[^}]*\}/)
  const body = parts.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.+')
  return new RegExp(`^${body}$`)
}

// Collects flag names and dynamic patterns from a TS argument snippet.
function harvestLiterals(snippet, setters, patterns, source) {
  for (const m of snippet.matchAll(/'([^'\\]*)'|"([^"\\]*)"|`([^`]*)`/g)) {
    if (m[3] !== undefined) {
      if (m[3].includes('${')) {
        patterns.push({ regex: templateToRegex(m[3]), template: m[3], source })
      } else if (/^[a-z0-9_]+$/i.test(m[3])) {
        addSetter(setters, m[3], source)
      }
    } else {
      const lit = m[1] ?? m[2]
      if (/^[a-z0-9_]+$/i.test(lit)) addSetter(setters, lit, source)
    }
  }
  for (const m of snippet.matchAll(/'([a-z0-9_]+)'\s*\+/gi)) {
    patterns.push({ regex: new RegExp(`^${m[1]}.*$`), template: `'${m[1]}' + <dynamic>`, source })
  }
}

function addSetter(setters, flag, source) {
  if (!setters.has(flag)) setters.set(flag, new Set())
  setters.get(flag).add(source)
}

function scanTsFile(file, setters, patterns) {
  const text = readFileSync(file, 'utf8')
  const source = rel(file)

  for (const m of text.matchAll(new RegExp(`\\b(${TS_FLAG_CALLS.join('|')})\\s*\\(`, 'g'))) {
    const args = extractBalanced(text, m.index + m[0].length - 1)
    harvestLiterals(args, setters, patterns, source)
  }

  for (const m of text.matchAll(new RegExp(`\\b(${TS_FLAG_PUSH_NAMES.join('|')})\\.push\\(`, 'g'))) {
    const args = extractBalanced(text, m.index + m[0].length - 1)
    harvestLiterals(args, setters, patterns, source)
  }

  for (const m of text.matchAll(new RegExp(`\\b(${TS_FLAG_KEYS.join('|')})\\s*:\\s*`, 'g'))) {
    const valueStart = m.index + m[0].length
    const first = text[valueStart]
    if (m[1] === 'flag') {
      const before = text.slice(Math.max(0, m.index - 120), m.index)
      if (/type\s*:\s*['"]flag['"]/.test(before)) continue
    }
    if (first === '[') {
      harvestLiterals(extractBalanced(text, valueStart), setters, patterns, source)
    } else if (first === "'" || first === '"' || first === '`') {
      const end = text.indexOf(first, valueStart + 1)
      if (end > 0) harvestLiterals(text.slice(valueStart, end + 1), setters, patterns, source)
    }
  }
}

function walkJson(node, visit, parent = null) {
  if (Array.isArray(node)) {
    for (const item of node) walkJson(item, visit, parent)
    return
  }
  if (node && typeof node === 'object') {
    visit(node, parent)
    for (const value of Object.values(node)) walkJson(value, visit, node)
  }
}

function collectJsonSetters(files, setters) {
  for (const file of files) {
    const source = rel(file)
    walkJson(readJson(file), (obj) => {
      for (const [key, value] of Object.entries(obj)) {
        if (JSON_FLAG_ARRAY_EXCLUDE.has(key)) continue
        if (JSON_FLAG_ARRAY_KEY.test(key) && Array.isArray(value) && value.every(v => typeof v === 'string')) {
          for (const f of value) addSetter(setters, f, source)
        } else if (key === 'flag' && typeof value === 'string' && obj.type !== 'flag') {
          addSetter(setters, value, source)
        }
      }
    })
  }
}

// ───────────────────────── condition checking ─────────────────────────

const NUMERIC_OPS = new Set(['>', '<', '>=', '<=', '=='])

function flagRequirement(cond) {
  if (cond.type === 'flag') return cond.value === true ? true : cond.value === false ? false : null
  if (cond.operator === '==') return cond.value === true ? true : cond.value === false ? false : null
  if (cond.operator === '!=') return cond.value === false ? true : cond.value === true ? false : null
  return null
}

function intervalConflict(constraints, clamp) {
  let lo = clamp[0]
  let loIncl = true
  let hi = clamp[1]
  let hiIncl = true
  const equalities = []
  for (const { op, v } of constraints) {
    if (op === '>' || op === '>=') {
      if (v > lo) { lo = v; loIncl = op === '>=' }
      else if (v === lo && op === '>') loIncl = false
    } else if (op === '<' || op === '<=') {
      if (v < hi) { hi = v; hiIncl = op === '<=' }
      else if (v === hi && op === '<') hiIncl = false
    } else if (op === '==') {
      equalities.push(v)
    }
  }
  if (lo > hi || (lo === hi && !(loIncl && hiIncl))) return `interval [${lo}..${hi}] is empty`
  for (const e of equalities) {
    const aboveLo = e > lo || (e === lo && loIncl)
    const belowHi = e < hi || (e === hi && hiIncl)
    if (!aboveLo || !belowHi) return `== ${e} is outside the feasible interval [${lo}..${hi}]`
  }
  if (new Set(equalities).size > 1) return `conflicting == values ${[...new Set(equalities)].join(' and ')}`
  return null
}

// Checks one AND-ed condition list. Pushes problem records and returns whether it is satisfiable.
function checkConditionList(items, ctx, resolver, env) {
  let satisfiable = true
  const numeric = new Map()
  env.counters.flagRefs += items.filter(({ cond }) => cond.type === 'flag' || (typeof cond.stat === 'string' && cond.stat.startsWith('flags.'))).length
  const flagReqs = new Map()

  for (const { cond, loc } of items) {
    const isFlagCond = cond.type === 'flag' || (typeof cond.stat === 'string' && cond.stat.startsWith('flags.'))
    if (isFlagCond) {
      const name = cond.type === 'flag' ? cond.flag : cond.stat.slice(6)
      const req = flagRequirement(cond)
      if (req === null || typeof name !== 'string') continue
      if (!flagReqs.has(name)) flagReqs.set(name, new Set())
      flagReqs.get(name).add(req)
      if (!env.isSettable(name)) {
        const unsat = req === true
        if (unsat) satisfiable = false
        env.problems.push({
          category: 'NEVER_SET_FLAG', ...ctx, location: loc, flag: name,
          requirement: req ? 'present' : 'absent', unsatisfiable: unsat,
          nearestSetFlags: env.nearestFlags(name),
        })
      }
      continue
    }
    if (typeof cond.stat !== 'string') continue
    const res = resolver.resolve(cond.stat)
    if (!res.ok) {
      satisfiable = false
      env.problems.push({
        category: 'UNKNOWN_STAT_PATH', ...ctx, location: loc, stat: cond.stat,
        aliasedTo: res.aliased, unsatisfiable: true,
        nearestValidPaths: nearestNames(res.aliased, resolver.validCandidates).slice(0, 3),
      })
      continue
    }
    if (typeof cond.value === 'number' && NUMERIC_OPS.has(cond.operator)) {
      if (!numeric.has(res.canonical)) numeric.set(res.canonical, [])
      numeric.get(res.canonical).push({ op: cond.operator, v: cond.value, loc, raw: cond })
    }
  }

  for (const [name, reqs] of flagReqs) {
    if (reqs.size > 1) {
      satisfiable = false
      env.problems.push({ category: 'IMPOSSIBLE_RANGE', ...ctx, kind: 'flag_contradiction', flag: name, detail: `flag "${name}" required both present and absent`, unsatisfiable: true })
    }
  }

  for (const [path, constraints] of numeric) {
    const clamp = env.clampFor(path)
    const conflict = intervalConflict(constraints, clamp)
    if (conflict) {
      satisfiable = false
      env.problems.push({
        category: 'IMPOSSIBLE_RANGE', ...ctx, kind: 'stat_range', stat: path,
        clamp: clamp.map(String), detail: conflict, unsatisfiable: true,
        conditions: constraints.map(c => `${path} ${c.op} ${c.v}`),
      })
    }
  }
  return satisfiable
}

// ───────────────────────── gather scenes and agenda ─────────────────────────

const CHOICE_TEXT_KEY = 'text'

function isChoiceObject(obj) {
  return typeof obj.id === 'string' && typeof obj[CHOICE_TEXT_KEY] === 'string'
}

// Walks one scene JSON. Returns choice records, chain records, and generic condition lists.
function scanScene(scene, file) {
  const choices = []
  const chains = []
  const looseConditions = []
  const source = rel(file)

  function visit(node, path, enclosingChoice) {
    if (Array.isArray(node)) {
      node.forEach((item, i) => visit(item, `${path}[${i}]`, enclosingChoice))
      return
    }
    if (!node || typeof node !== 'object') return
    let choiceHere = enclosingChoice
    if (isChoiceObject(node)) {
      choiceHere = { id: node.id, path, conditions: node.conditions, nextNodeId: node.nextNodeId, nextSegment: node.nextSegment, file: source }
      choices.push(choiceHere)
    }
    for (const [key, value] of Object.entries(node)) {
      const childPath = `${path}.${key}`
      if (key === 'chainTriggers' && Array.isArray(value)) {
        value.forEach((trigger, i) => chains.push({
          path: `${childPath}[${i}]`, sourceChoice: choiceHere ? choiceHere.id : '(none)',
          sourcePath: choiceHere ? choiceHere.path : path, target: trigger.targetNodeId,
          delayWeeks: trigger.delayWeeks, probability: trigger.probability, conditions: trigger.conditions ?? [],
        }))
        continue
      }
      if (key === 'conditions' && Array.isArray(value) && !isChoiceObject(node)) {
        looseConditions.push({ path: childPath, conditions: value })
        continue
      }
      visit(value, childPath, choiceHere)
    }
  }

  visit(scene, '$', null)
  return { choices, chains, looseConditions }
}

function loadScenes() {
  const files = walk(NARRATIVE_DIR, isJson)
  const scenes = []
  for (const file of files) {
    const data = readJson(file)
    const list = Array.isArray(data) ? data : [data]
    for (const scene of list) {
      if (scene && typeof scene.id === 'string') scenes.push({ scene, file })
    }
  }
  return scenes
}

function loadAgenda() {
  const entries = []
  for (const file of walk(AGENDA_DIR, isJson)) {
    const list = readJson(file)
    for (const entry of Array.isArray(list) ? list : [list]) entries.push({ entry, file })
  }
  return entries
}

// ───────────────────────── main analysis ─────────────────────────

function main() {
  const model = loadGameStateModel()
  const resolver = createResolver(model)

  // Setter flags.
  const setters = new Map()
  const dynamicPatterns = []
  collectJsonSetters(walk(DATA, isJson), setters)
  for (const file of walk(SRC, isTsSource)) scanTsFile(file, setters, dynamicPatterns)
  const uniquePatterns = [...new Map(dynamicPatterns.map(p => [p.template, p])).values()]
    .sort((a, b) => a.template.localeCompare(b.template))

  const env = {
    problems: [],
    counters: { flagRefs: 0 },
    isSettable(name) {
      return setters.has(name) || uniquePatterns.some(p => p.regex.test(name))
    },
    nearestFlags(name) {
      return nearestNames(name, setters.keys())
    },
    clampFor(path) {
      return model.statRanges.get(path) ?? [-Infinity, Infinity]
    },
    settableVia(name) {
      if (setters.has(name)) return { via: 'literal', sources: [...setters.get(name)].sort() }
      const pattern = uniquePatterns.find(p => p.regex.test(name))
      return pattern ? { via: 'dynamic', pattern: pattern.template, sources: [pattern.source] } : null
    },
  }

  // Scenes.
  const sceneEntries = loadScenes()
  const sceneById = new Map()
  const duplicateSceneIds = []
  for (const { scene, file } of sceneEntries) {
    if (sceneById.has(scene.id)) duplicateSceneIds.push({ id: scene.id, file: rel(file) })
    sceneById.set(scene.id, { scene, file })
  }
  const sceneIds = new Set(sceneById.keys())

  // Per-scene self gate (scene-level prerequisites) and dependencies.
  const selfOk = new Map()
  const deps = new Map()
  const missingCorrectable = []
  const edges = []
  const choiceRecords = []

  for (const [id, { scene, file }] of sceneById) {
    const ctx = { kind: 'scene', id, sceneId: id, file: rel(file) }
    const items = []
    ;(scene.prerequisites ?? []).forEach((cond, i) => items.push({ cond, loc: `prerequisites[${i}]` }))
    ;(scene.prerequisiteFlags ?? []).forEach((flag, i) => items.push({ cond: { type: 'flag', flag, value: true }, loc: `prerequisiteFlags[${i}]` }))
    let ok = checkConditionList(items, { ...ctx, location: 'scene' }, resolver, env)
    const dependencies = []
    ;(scene.prerequisiteSceneIds ?? []).forEach((depId, i) => {
      if (!sceneIds.has(depId)) {
        ok = false
        missingCorrectable.push({ category: 'CHAIN_TARGET_MISSING', kind: 'prerequisiteSceneIds', ...ctx, location: `prerequisiteSceneIds[${i}]`, target: depId, unsatisfiable: true, nearestSceneIds: nearestNames(depId, sceneIds).slice(0, 3) })
      } else dependencies.push(depId)
    })
    selfOk.set(id, ok)
    deps.set(id, dependencies)

    const scanned = scanScene(scene, file)
    for (const { path, conditions } of scanned.looseConditions) {
      checkConditionList(conditions.map((cond, i) => ({ cond, loc: `${path}[${i}]` })), { kind: 'scene-content', id, sceneId: id, file: rel(file), location: path }, resolver, env)
    }
    for (const choice of scanned.choices) {
      const choiceCtx = { kind: 'choice', id: choice.id, sceneId: id, file: choice.file, location: `${choice.path}.conditions` }
      const cond = Array.isArray(choice.conditions) ? choice.conditions : []
      const satisfiable = checkConditionList(cond.map((c, i) => ({ cond: c, loc: `${choice.path}.conditions[${i}]` })), choiceCtx, resolver, env)
      choiceRecords.push({ ...choice, sceneId: id, satisfiable })
      if (choice.nextNodeId) {
        edges.push({ type: 'nextNodeId', to: choice.nextNodeId, from: { kind: 'choice', id: `${id}#${choice.id}` }, sourceScene: id, staticOk: satisfiable, file: rel(file), location: `${choice.path}.nextNodeId`, ownerChoice: `${id}#${choice.id}` })
      }
      if (choice.nextSegment && !(scene.segments && scene.segments[choice.nextSegment])) {
        missingCorrectable.push({ category: 'CHAIN_TARGET_MISSING', kind: 'nextSegment', id: `${id}#${choice.id}`, sceneId: id, file: rel(file), location: `${choice.path}.nextSegment`, target: choice.nextSegment, unsatisfiable: true, nearestSceneIds: [] })
      }
    }
    for (const chain of scanned.chains) {
      const chainId = `${id}#${chain.sourceChoice}->${chain.target}`
      const satisfiable = checkConditionList(chain.conditions.map((c, i) => ({ cond: c, loc: `${chain.path}.conditions[${i}]` })), { kind: 'chain', id: chainId, sceneId: id, file: rel(file), location: chain.path }, resolver, env)
      edges.push({ type: 'chain', to: chain.target, from: { kind: 'chain', id: chainId }, sourceScene: id, staticOk: satisfiable, file: rel(file), location: chain.path, ownerChoice: `${id}#${chain.sourceChoice}`, chainId, delayWeeks: chain.delayWeeks, probability: chain.probability })
    }
    for (const alt of scene.exclusive ?? []) {
      edges.push({ type: 'exclusive', to: alt, from: { kind: 'exclusive', id: `${id}->${alt}` }, sourceScene: id, staticOk: true, file: rel(file), location: 'exclusive' })
    }
  }

  // Agenda.
  const agendaEntries = loadAgenda()
  for (const { entry, file } of agendaEntries) {
    const ctx = { kind: 'agenda', id: entry.id, sceneId: entry.sceneId, file: rel(file), location: 'prerequisites' }
    const ok = checkConditionList((entry.prerequisites ?? []).map((cond, i) => ({ cond, loc: `prerequisites[${i}]` })), ctx, resolver, env)
    edges.push({ type: 'agenda', to: entry.sceneId, from: { kind: 'agenda', id: entry.id }, sourceScene: null, staticOk: ok, file: rel(file), location: 'sceneId', ownerChoice: null, agendaId: entry.id })
    if (!sceneIds.has(entry.sceneId) && !isVirtualSceneId(entry.sceneId)) {
      missingCorrectable.push({ category: 'CHAIN_TARGET_MISSING', kind: 'agenda.sceneId', id: entry.id, sceneId: entry.sceneId, file: rel(file), location: 'sceneId', target: entry.sceneId, unsatisfiable: true, nearestSceneIds: nearestNames(entry.sceneId, sceneIds).slice(0, 3) })
    }
  }

  // Chain/nextNodeId targets must be scene ids (resolved through getScene at fire time).
  for (const edge of edges) {
    if (edge.type === 'exclusive' || edge.type === 'agenda') continue
    if (!sceneIds.has(edge.to) && !isVirtualSceneId(edge.to)) {
      missingCorrectable.push({ category: 'CHAIN_TARGET_MISSING', kind: edge.type, id: edge.from.id, sceneId: edge.sourceScene, file: edge.file, location: edge.location, target: edge.to, unsatisfiable: true, nearestSceneIds: nearestNames(edge.to, sceneIds).slice(0, 3) })
    }
  }
  for (const edge of edges.filter(e => e.type === 'exclusive')) {
    if (!sceneIds.has(edge.to)) {
      missingCorrectable.push({ category: 'CHAIN_TARGET_MISSING', kind: 'exclusive', id: edge.from.id, sceneId: edge.sourceScene, file: edge.file, location: edge.location, target: edge.to, unsatisfiable: true, nearestSceneIds: nearestNames(edge.to, sceneIds).slice(0, 3) })
    }
  }

  // Scenes with no static edge may still be launched by code (weekStore, LetterEngine, projects,
  // AssassinationEngine, ...). Treat a quoted id in non-narrative, non-test source as an
  // external entry point. This is a text match: it assumes the reference is a live launch.
  const externalRefs = []
  const hasEdgeIn = new Set(edges.map(e => e.to))
  const orphanCandidates = [...sceneIds].filter(id => !hasEdgeIn.has(id))
  if (orphanCandidates.length) {
    const sources = [...walk(SRC, isTsSource), ...walk(DATA, isJson)]
      .filter(f => !f.startsWith(NARRATIVE_DIR) && !f.startsWith(AGENDA_DIR))
      .map(f => ({ file: f, text: readFileSync(f, 'utf8') }))
    for (const id of orphanCandidates.sort()) {
      const hit = sources.find(({ text }) => text.includes(`"${id}"`) || text.includes(`'${id}'`) || text.includes(`\`${id}\``))
      if (hit) {
        externalRefs.push({ id, file: rel(hit.file) })
        edges.push({ type: 'external', to: id, from: { kind: 'external', id: `${rel(hit.file)}` }, sourceScene: null, staticOk: true, file: rel(hit.file), location: 'source reference (text match)' })
      }
    }
  }

  // Fixed point: requested = some live entry edge targets it; reachable = requested, not self-blocked, deps reachable.
  const requested = new Map([...sceneIds].map(id => [id, false]))
  const reachable = new Map([...sceneIds].map(id => [id, false]))
  const reachableOf = (id) => reachable.get(id) === true || (isVirtualSceneId(id) && requested.get(id) === true)
  let changed = true
  while (changed) {
    changed = false
    for (const id of sceneIds) {
      if (!requested.get(id) && edges.some(e => e.to === id && e.staticOk && (e.sourceScene === null || reachableOf(e.sourceScene)))) {
        requested.set(id, true); changed = true
      }
    }
    for (const id of new Set(edges.map(x => x.to).filter(isVirtualSceneId))) {
      if (!requested.has(id) && edges.some(e => e.to === id && e.staticOk && (e.sourceScene === null || reachableOf(e.sourceScene)))) {
        requested.set(id, true); changed = true
      }
    }
    for (const e of edges.filter(x => x.type === 'exclusive')) {
      if (requested.get(e.sourceScene) && !selfOk.get(e.sourceScene) && sceneIds.has(e.to) && !requested.get(e.to)) {
        requested.set(e.to, true); changed = true
      }
    }
    for (const id of sceneIds) {
      const isReach = requested.get(id) && selfOk.get(id) && deps.get(id).every(reachableOf)
      if (isReach !== reachable.get(id)) { reachable.set(id, isReach); changed = true }
    }
  }

  // Incoming edge descriptions and liveness.
  const edgeLive = (e) => e.staticOk && (e.sourceScene === null || reachableOf(e.sourceScene))
  const incomingOf = (id) => edges.filter(e => e.to === id)

  // Likely bugs and alternative-path analysis.
  const likelyBugs = []
  for (const { entry, file } of agendaEntries) {
    const edge = edges.find(e => e.type === 'agenda' && e.from.id === entry.id)
    const target = entry.sceneId
    if (!edgeLive(edge) && !reachableOf(target)) {
      likelyBugs.push({ kind: 'agenda', id: entry.id, file: rel(file), reason: edge.staticOk ? `scene "${target}" can never be reached (see scene gate)` : 'agenda prerequisites can never all pass', suggestion: suggestionFor(env, resolver, sceneIds, edge, target) })
    }
  }
  for (const [id, { file }] of sceneById) {
    if (reachableOf(id)) continue
    const inc = incomingOf(id)
    if (inc.length === 0) continue
    likelyBugs.push({ kind: 'scene', id, file: rel(file), reason: `scene can never be reached: ${inc.map(e => `${e.type} ${e.from.id} ${e.staticOk ? 'live but source unreachable' : 'gated'}`).join('; ')}`, suggestion: suggestionFor(env, resolver, sceneIds, null, id, selfOk.get(id)) })
  }
  for (const e of edges.filter(x => x.type === 'chain' || x.type === 'nextNodeId')) {
    if (!edgeLive(e) && !reachableOf(e.to)) {
      likelyBugs.push({ kind: e.type, id: e.from.id, file: e.file, reason: `${e.type} to "${e.to}" never fires (${e.staticOk ? 'source scene unreachable' : 'own conditions can never pass'}) and target has no other path`, suggestion: suggestionFor(env, resolver, sceneIds, e, e.to) })
    }
  }

  const orphans = [...sceneIds].filter(id => incomingOf(id).length === 0).sort()
  const externallyReferenced = externalRefs.sort((a, b) => a.id.localeCompare(b.id))

  const report = assembleReport({
    problems: env.problems, missingCorrectable, edges, edgeLive, reachableOf, sceneIds, sceneById,
    likelyBugs, orphans, externallyReferenced, duplicateSceneIds, setters, uniquePatterns, env, agendaEntries, choiceRecords,
  })
  writeFileSync(OUT_JSON, JSON.stringify(report.json, null, 2) + '\n')
  writeFileSync(OUT_MD, report.markdown)
  console.log(`audit-unreachable-gates: ${report.json.summary.totals.neverSetFlag} never-set flag refs, ${report.json.summary.totals.unknownStatPath} unknown stat paths, ${report.json.summary.totals.chainTargetMissing} missing targets, ${report.json.summary.totals.impossibleRange} impossible ranges, ${report.json.summary.totals.likelyBugs} likely bugs`)
  console.log(`wrote ${rel(OUT_MD)} and ${rel(OUT_JSON)}`)
}

function suggestionFor(env, resolver, sceneIds, edge, target, selfBlocked) {
  if (edge && !edge.staticOk) return 'fix the flag/stat named in this entry\'s conditions (see NEVER_SET_FLAG / UNKNOWN_STAT_PATH)'
  if (target && !sceneIds.has(target)) return `target scene id does not exist; nearest scene id: ${nearestOne(target, sceneIds)?.name ?? 'n/a'}`
  if (selfBlocked) return 'scene-level prerequisites can never pass; fix the flag/stat in scene prerequisites'
  return 'source of this edge is unreachable; fix the upstream gate'
}

function assembleReport(ctx) {
  const { problems, missingCorrectable, edges, edgeLive, reachableOf, sceneIds, likelyBugs, orphans, externallyReferenced, duplicateSceneIds, setters, uniquePatterns, env, agendaEntries, choiceRecords } = ctx

  const neverSet = problems.filter(p => p.category === 'NEVER_SET_FLAG').map(p => {
    const targets = targetsOf(p, edges, sceneIds)
    const alt = otherPaths(p, edges, edgeLive, targets)
    return {
      file: p.file, id: p.id, kind: p.kind, sceneId: p.sceneId, location: p.location, flag: p.flag,
      requirement: p.requirement, unsatisfiable: p.unsatisfiable,
      scopeNote: targets.scope,
      onlyPath: targets.scope === 'scene-level' ? 'blocks every entry into the scene' : alt.length === 0,
      otherLivePaths: alt,
      nearestSetFlags: p.nearestSetFlags,
      settableVia: env.settableVia(p.flag),
    }
  })
  const unknownStat = problems.filter(p => p.category === 'UNKNOWN_STAT_PATH').map(p => ({
    file: p.file, id: p.id, kind: p.kind, sceneId: p.sceneId, location: p.location, stat: p.stat,
    aliasedTo: p.aliasedTo, nearestValidPaths: p.nearestValidPaths,
  }))
  const missingTargets = [...missingCorrectable].sort(byFileId)
  const ranges = problems.filter(p => p.category === 'IMPOSSIBLE_RANGE').map(p => ({
    file: p.file, id: p.id, kind: p.kind, sceneId: p.sceneId, location: p.location,
    stat: p.stat ?? p.flag, clamp: p.clamp, conditions: p.conditions ?? [p.detail], detail: p.detail,
  }))

  const sortedNeverSet = neverSet.sort(byFileId)
  const sortedUnknown = unknownStat.sort(byFileId)
  const sortedRanges = ranges.sort(byFileId)
  const sortedBugs = [...likelyBugs].sort((a, b) => `${a.kind}|${a.id}`.localeCompare(`${b.kind}|${b.id}`))

  const totals = {
    neverSetFlag: sortedNeverSet.length,
    neverSetFlagUnsatisfiable: sortedNeverSet.filter(x => x.unsatisfiable).length,
    unknownStatPath: sortedUnknown.length,
    chainTargetMissing: missingTargets.length,
    impossibleRange: sortedRanges.length,
    likelyBugs: sortedBugs.length,
    orphanScenes: orphans.length,
    externallyReferencedScenes: externallyReferenced.length,
    agendaEntries: agendaEntries.length,
    scenes: sceneIds.size,
    chainTriggers: edges.filter(e => e.type === 'chain').length,
    nextNodeIdEdges: edges.filter(e => e.type === 'nextNodeId').length,
    flagReferencesChecked: env.counters.flagRefs,
    setterFlags: setters.size,
    dynamicSetterPatterns: uniquePatterns.length,
  }
  const json = {
    summary: { totals, duplicateSceneIds: duplicateSceneIds.sort(byFileId) },
    NEVER_SET_FLAG: sortedNeverSet,
    UNKNOWN_STAT_PATH: sortedUnknown,
    CHAIN_TARGET_MISSING: missingTargets,
    IMPOSSIBLE_RANGE: sortedRanges,
    likelyBugs: sortedBugs,
    orphanScenes: orphans,
    externallyReferencedScenes: externallyReferenced,
    dynamicSetterPatterns: uniquePatterns.map(p => ({ template: p.template, source: p.source })),
    setterFlagCount: setters.size,
    choicesScanned: choiceRecords.length,
  }
  return { json, markdown: renderMarkdown(json, choiceRecords) }
}

function byFileId(a, b) {
  return `${a.file ?? ''}|${a.id ?? ''}|${a.location ?? ''}|${a.flag ?? a.stat ?? a.target ?? ''}`
    .localeCompare(`${b.file ?? ''}|${b.id ?? ''}|${b.location ?? ''}|${b.flag ?? b.stat ?? b.target ?? ''}`)
}

// Which scene(s) does this gate affect, and how?
function targetsOf(p, edges, sceneIds) {
  if (p.kind === 'scene') return { scope: 'scene-level', scenes: [p.sceneId] }
  if (p.kind === 'agenda') {
    const edge = edges.find(e => e.type === 'agenda' && e.from.id === p.id)
    return { scope: 'agenda-entry', scenes: edge ? [edge.to] : [], edgeId: p.id }
  }
  if (p.kind === 'chain') {
    const edge = edges.find(e => e.type === 'chain' && e.from.id === p.id)
    return { scope: 'chain', scenes: edge && sceneIds.has(edge.to) ? [edge.to] : [], edgeId: p.id }
  }
  if (p.kind === 'choice') {
    const edge = edges.find(e => e.type === 'nextNodeId' && e.from.id === `${p.sceneId}#${p.id}`)
    return { scope: 'choice', scenes: edge ? [edge.to] : [], edgeId: `${p.sceneId}#${p.id}` }
  }
  return { scope: 'content-only (segment/node gate, does not affect scene reachability)', scenes: [] }
}

function otherPaths(p, edges, edgeLive, targets) {
  if (targets.scenes.length === 0) return []
  const scene = targets.scenes[0]
  return edges
    .filter(e => e.to === scene && e.from.id !== targets.edgeId && edgeLive(e))
    .map(e => `${e.type} ${e.from.id} (${e.file} ${e.location})`)
    .sort()
}

function renderMarkdown(json, choiceRecords) {
  const t = json.summary.totals
  const lines = []
  const row = (cells) => `| ${cells.map(c => String(c ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ')).join(' | ')} |`
  lines.push('# Unreachable gates audit (T3)', '')
  lines.push('Static audit, report only. Generated by `node scripts/audit-unreachable-gates.mjs`.', '')
  lines.push('## Summary', '')
  lines.push(row(['Metric', 'Count']), row(['---', '---']))
  for (const [k, v] of Object.entries(t)) lines.push(row([k, v]))
  lines.push('')
  lines.push(`Choices scanned: ${choiceRecords.length}. Setter flags collected: ${json.setterFlagCount}.`, '')

  lines.push('## 1. NEVER_SET_FLAG', '')
  lines.push('`unsatisfiable` = the gate needs the flag present and nothing sets it. `absent` requirements on never-set flags always pass.', '')
  lines.push(row(['File', 'Id', 'Location', 'Flag', 'Requires', 'Unsatisfiable', 'Only path?', 'Nearest set flags (distance)']), row(['---', '---', '---', '---', '---', '---', '---', '---']))
  for (const x of json.NEVER_SET_FLAG) {
    const near = x.nearestSetFlags.map(n => `${n.name} (${n.distance})`).join(', ') || 'none'
    lines.push(row([x.file, x.id, x.location, x.flag, x.requirement, x.unsatisfiable, typeof x.onlyPath === 'string' ? x.onlyPath : x.onlyPath ? 'yes' : `no (${x.otherLivePaths.length} other live)`, near]))
  }
  lines.push('')

  lines.push('## 2. UNKNOWN_STAT_PATH', '')
  lines.push(row(['File', 'Id', 'Location', 'Stat', 'Nearest valid paths']), row(['---', '---', '---', '---', '---']))
  for (const x of json.UNKNOWN_STAT_PATH) {
    lines.push(row([x.file, x.id, x.location, x.stat, x.nearestValidPaths.map(n => `${n.name} (${n.distance})`).join(', ') || 'none']))
  }
  lines.push('')

  lines.push('## 3. CHAIN_TARGET_MISSING', '')
  lines.push(row(['Kind', 'File', 'Id', 'Location', 'Missing target', 'Nearest scene ids']), row(['---', '---', '---', '---', '---', '---']))
  for (const x of json.CHAIN_TARGET_MISSING) {
    lines.push(row([x.kind, x.file, x.id, x.location, x.target, x.nearestSceneIds.map(n => n.name).join(', ') || 'none']))
  }
  lines.push('')

  lines.push('## 4. IMPOSSIBLE_RANGE', '')
  lines.push(row(['File', 'Id', 'Kind', 'Stat/flag', 'Clamp', 'Detail']), row(['---', '---', '---', '---', '---', '---']))
  for (const x of json.IMPOSSIBLE_RANGE) {
    lines.push(row([x.file, x.id, x.kind, x.stat, x.clamp ? x.clamp.join('..') : '', x.detail]))
  }
  lines.push('')

  lines.push('## 5. Likely bugs (can never fire, no alternative path)', '')
  lines.push(row(['Kind', 'Id', 'File', 'Reason', 'Suggested fix']), row(['---', '---', '---', '---', '---']))
  for (const b of json.likelyBugs) lines.push(row([b.kind, b.id, b.file, b.reason, b.suggestion]))
  lines.push('')

  lines.push('## Scenes with no static edge', '')
  lines.push('Externally referenced = quoted id found in non-narrative source (text match, assumed live launch).', '')
  lines.push(row(['Scene', 'Referenced from']), row(['---', '---']))
  for (const x of json.externallyReferencedScenes) lines.push(row([x.id, x.file]))
  lines.push('')
  lines.push('Orphans = no reference anywhere outside their own JSON (never launched by any agenda, chain, nextNodeId, exclusive or code path):', '')
  lines.push(json.orphanScenes.length ? json.orphanScenes.map(s => `- ${s}`).join('\n') : 'none', '')

  lines.push('## Dynamic setter patterns (broad; flags matching them are treated as settable)', '')
  for (const p of json.dynamicSetterPatterns) lines.push(`- \`${p.template}\` (${p.source})`)
  lines.push('')
  return lines.join('\n')
}

main()
