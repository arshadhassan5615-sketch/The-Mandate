// Reply audit — data loading + engine-mirroring helpers (read-only).
//
// Every helper here mirrors a rule VERIFIED in engine code; the source is
// cited next to it so the audit can be re-checked when the engine changes.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const NARRATIVE_DIR = path.join(ROOT, 'src', 'data', 'narrative')

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir).sort()) {
    const p = path.join(dir, name)
    if (fs.statSync(p).isDirectory()) walk(p, out)
    else if (name.endsWith('.json')) out.push(p)
  }
  return out
}

/** Loads every scene JSON exactly as NarrativeEngine's import.meta.glob does. */
export function loadScenes() {
  const scenes = []
  for (const file of walk(NARRATIVE_DIR)) {
    const scene = JSON.parse(fs.readFileSync(file, 'utf8'))
    const rel = path.relative(ROOT, file).replace(/\\/g, '/')
    scenes.push({ scene, file: rel, dir: rel.split('/')[3] })
  }
  return scenes
}

// narrativeStore.loadScene: normalises top-level `dialogue` only when
// `narrative` is absent (C3 fix).
export function rootNarrative(scene) {
  if (scene.narrative) return scene.narrative
  if (scene.dialogue) {
    return Array.isArray(scene.dialogue)
      ? scene.dialogue
      : [{ type: 'description', text: scene.dialogue }]
  }
  return []
}

// processChoice segment branch: `seg.narrative ?? (seg.dialogue …) ?? []`.
export function segmentNarrative(seg) {
  if (seg.narrative) return seg.narrative
  if (seg.dialogue) {
    return Array.isArray(seg.dialogue)
      ? seg.dialogue
      : [{ type: 'description', text: seg.dialogue }]
  }
  return []
}

/**
 * Choice lists of a scene. `(root)` is the scene's top-level list; segment
 * lists are keyed by segment id. Social-interaction lists are included but
 * marked `unmounted` (SocialEvent.tsx is imported nowhere since 9a27631).
 */
export function choiceLists(scene) {
  const lists = [{ key: '(root)', choices: scene.choices ?? [], narrative: rootNarrative(scene), monologue: scene.monologue }]
  for (const [key, seg] of Object.entries(scene.segments ?? {})) {
    lists.push({ key, choices: seg.choices ?? [], narrative: segmentNarrative(seg), monologue: seg.monologue })
  }
  for (const si of scene.socialInteractions ?? []) {
    lists.push({ key: `social:${si.id}`, choices: si.choices ?? [], narrative: si.narrative ?? [], unmounted: true })
  }
  return lists
}

// processChoice: nextNodeId wins if the scene exists; else nextSegment if the
// key exists; a missing nextSegment key or a missing nextNodeId with no valid
// segment leaves the scene in place with sceneDone=true (terminal).
export function resolveTarget(choice, scene, registry) {
  if (choice.nextNodeId && registry.has(choice.nextNodeId)) {
    return { kind: 'node', id: choice.nextNodeId }
  }
  if (choice.nextSegment && scene.segments?.[choice.nextSegment]) {
    return { kind: 'segment', id: choice.nextSegment }
  }
  if (choice.nextSegment) return { kind: 'terminal', broken: `missing segment "${choice.nextSegment}"` }
  if (choice.nextNodeId) return { kind: 'terminal', broken: `missing scene "${choice.nextNodeId}"` }
  return { kind: 'terminal' }
}

export function targetKey(t) {
  return t.kind === 'terminal' ? 'terminal' : `${t.kind}:${t.id}`
}

// processChoice C6 fix: stateChanges if non-empty, else statEffects as 'add'.
export function effectiveChanges(choice) {
  if ((choice.stateChanges?.length ?? 0) > 0) return choice.stateChanges
  return (choice.statEffects ?? []).map(e => ({ stat: e.stat, operation: 'add', value: e.value }))
}

// ── Condition shape (conditionEvaluator.ts) ──────────────────────────────
const OPERATORS = new Set(['>', '<', '==', '>=', '<=', '!='])

/** Parses GameState interfaces + PATH_ALIASES so stat paths resolve exactly as the evaluator does. */
export function loadStatPaths() {
  const typesSrc = fs.readFileSync(path.join(ROOT, 'src', 'types', 'gameState.ts'), 'utf8')
  const evalSrc = fs.readFileSync(path.join(ROOT, 'src', 'engine', 'conditionEvaluator.ts'), 'utf8')
  const ifaces = {}
  for (const m of typesSrc.matchAll(/export interface (\w+) \{([\s\S]*?)\n\}/g)) {
    const fields = {}
    for (const f of m[2].matchAll(/^\s{2}(\w+)\??:\s*([^\n/]+)/gm)) fields[f[1]] = f[2].trim()
    ifaces[m[1]] = fields
  }
  const paths = new Set(['currentWeek', 'currentAct'])
  for (const [key, type] of Object.entries(ifaces.GameState ?? {})) {
    const sub = ifaces[type.replace(/[;\s]/g, '')]
    if (sub) for (const k of Object.keys(sub)) paths.add(`${key}.${k}`)
    else paths.add(key)
  }
  const aliases = {}
  const block = evalSrc.match(/PATH_ALIASES[^{]*\{([\s\S]*?)\n\s*\}/)
  if (block) for (const a of block[1].matchAll(/'([^']+)':\s*'([^']+)'/g)) aliases[a[1]] = a[2]
  return { paths, aliases }
}

/**
 * Classifies a condition's shape against evaluateCondition. Returns null when
 * the evaluator supports it, else a reason string.
 */
export function conditionShapeProblem(c, statPaths) {
  if (!c || typeof c !== 'object') return 'not an object'
  if (c.type === 'flag') {
    if (typeof c.flag !== 'string') return 'flag condition without string `flag`'
    if (typeof c.value !== 'boolean') return `flag condition value ${JSON.stringify(c.value)} is not boolean (compared with ===, always false)`
    return null
  }
  if (c.type !== undefined) return `unknown type "${c.type}" (evaluated as a stat condition)`
  if (typeof c.stat !== 'string') {
    return 'flag' in c
      ? 'bare {flag,value} without type:"flag" — crashes resolveStatValue (stat undefined)'
      : 'no `stat` — crashes resolveStatValue'
  }
  if (!OPERATORS.has(c.operator)) return `operator ${JSON.stringify(c.operator)} unsupported (compare() returns false)`
  const stat = statPaths.aliases[c.stat] ?? c.stat
  if (stat.startsWith('flags.')) return null
  if (!statPaths.paths.has(stat)) return `stat path "${c.stat}" does not resolve (condition always false)`
  return null
}

/** Normalises a flag-ish condition into {flag, want} or null for stat conditions. */
export function asFlagTest(c) {
  if (c?.type === 'flag' && typeof c.flag === 'string') return { flag: c.flag, want: c.value === true }
  if (typeof c?.stat === 'string' && c.stat.startsWith('flags.')) {
    const flag = c.stat.slice(6)
    // loose == / != against boolean-ish values, as compare() does
    const truthy = c.value === true || c.value === 'true' || c.value === 1
    if (c.operator === '==') return { flag, want: truthy }
    if (c.operator === '!=') return { flag, want: !truthy }
  }
  return null
}

export function fmtCond(c) {
  const f = asFlagTest(c)
  if (f) return f.want ? f.flag : `!${f.flag}`
  if (c?.stat) return `${c.stat} ${c.operator} ${JSON.stringify(c.value)}`
  return JSON.stringify(c)
}

export function fmtConds(conds) {
  return (conds ?? []).map(fmtCond).join(' & ')
}

// Act bucket for transcript files: actN directory, else scene.act, else by week.
export function actOf(entry) {
  const m = /^act(\d)$/.exec(entry.dir)
  if (m) return Math.max(1, Math.min(7, Number(m[1])))
  const s = entry.scene
  if (typeof s.act === 'number' && s.act >= 1) return Math.min(7, s.act)
  const w = weekOf(s)
  const bounds = [13, 26, 39, 52, 65, 84] // act 1..6 upper weeks (act 7 beyond)
  const idx = bounds.findIndex(b => w <= b)
  return idx === -1 ? 7 : idx + 1
}

export function weekOf(scene) {
  return scene.weekAvailable ?? scene.week ?? 0
}

/** Every identifier-like string literal in non-narrative src code — "could be set by code". */
export function codeLiterals() {
  const out = new Set()
  const dirs = ['engine', 'stores', 'components', 'data', 'hooks'].map(d => path.join(ROOT, 'src', d))
  const files = dirs.flatMap(d => (fs.existsSync(d) ? walkCode(d) : []))
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8')
    for (const m of src.matchAll(/['"`]([a-z][a-z0-9_]{2,})['"`]/g)) out.add(m[1])
  }
  return out
}

function walkCode(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name)
    if (fs.statSync(p).isDirectory()) {
      if (name === 'narrative') continue
      walkCode(p, out)
    } else if (/\.(ts|tsx)$/.test(name) && !/\.test\./.test(name)) out.push(p)
  }
  return out
}

export function trunc(s, n) {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim()
  return t.length > n ? `${t.slice(0, n - 1)}…` : t
}

export function cell(s) {
  return String(s ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ')
}
