/**
 * Narrative scene STRUCTURAL auditor
 * Run: node scripts/audit-narrative.mjs
 *
 * Checks:
 *   A) BROKEN_NEXT_SEGMENT  — choice.nextSegment not in this scene's own segments
 *   B) BROKEN_NEXT_NODE_ID  — choice.nextNodeId not in the global scene registry
 *   C) ORPHANED_SEGMENT     — segment unreachable via BFS from root choices
 *   D) DEAD_END_SEGMENT     — reachable segment with 0 choices and no exit
 *   E) MISSING_FIELDS       — choice missing flags / chainTriggers / codexUnlocks
 *
 * Note on DEAD_END: top-level choices with nextSegment=null are intentional
 * terminal choices (confirmed schema convention). This check only flags
 * *segments* that are reachable but have zero choices (segment-level dead end).
 *
 * Note on MISSING_FIELDS: stateChanges absence is tolerated — the engine falls
 * back to the statEffects alias. Only flags/chainTriggers/codexUnlocks are
 * checked because narrativeStore.processChoice accesses them with ?. null
 * coalescing, so missing ones won't crash but are still a data quality issue.
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, resolve, dirname, relative } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const NARRATIVE_DIR = join(ROOT, 'src', 'data', 'narrative')

// ── Walk ──────────────────────────────────────────────────────────────────────
function walkDir(dir) {
  const results = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) results.push(...walkDir(full))
    else if (entry.endsWith('.json')) results.push(full)
  }
  return results
}

// ── Load all scenes ───────────────────────────────────────────────────────────
const allFiles = walkDir(NARRATIVE_DIR)
const scenes = []
const sceneById = new Map()
const parseErrors = []

for (const fp of allFiles) {
  try {
    const raw = readFileSync(fp, 'utf8')
    const data = JSON.parse(raw)
    if (!data || typeof data !== 'object' || Array.isArray(data)) continue
    if (!data.id) continue
    const scene = { ...data, _file: fp }
    scenes.push(scene)
    if (sceneById.has(data.id)) {
      parseErrors.push(`DUPLICATE ID: "${data.id}" in ${relative(ROOT, fp)}`)
    }
    sceneById.set(data.id, scene)
  } catch (e) {
    parseErrors.push(`PARSE ERROR: ${relative(ROOT, fp)}: ${e.message}`)
  }
}

const sceneIds = new Set(sceneById.keys())

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Collect every choice in a scene with its location label */
function allChoicesOf(scene) {
  const out = []
  for (const c of scene.choices ?? []) {
    out.push({ choice: c, loc: `top-level choice "${c.id ?? '(no id)'}"` })
  }
  for (const [segKey, seg] of Object.entries(scene.segments ?? {})) {
    for (const c of seg.choices ?? []) {
      out.push({ choice: c, loc: `segment "${segKey}" > choice "${c.id ?? '(no id)'}"` })
    }
  }
  return out
}

/** BFS from root choices: collect all segment keys reachable via nextSegment */
function reachableSegmentKeys(scene) {
  const segments = scene.segments ?? {}
  const reachable = new Set()
  const queue = []

  for (const c of scene.choices ?? []) {
    if (c.nextSegment) queue.push(c.nextSegment)
  }

  while (queue.length) {
    const key = queue.shift()
    if (reachable.has(key)) continue
    reachable.add(key)
    const seg = segments[key]
    if (!seg) continue
    for (const c of seg.choices ?? []) {
      if (c.nextSegment) queue.push(c.nextSegment)
    }
  }
  return reachable
}

// ── Audit ─────────────────────────────────────────────────────────────────────
const REQUIRED_FIELDS = ['flags', 'chainTriggers', 'codexUnlocks']

const counters = { A: 0, B: 0, C: 0, D: 0, E: 0 }
let totalChoices = 0
// issues: Map<relFilePath, [{cat, detail}]>
const issues = new Map()

function addIssue(scene, cat, detail) {
  const key = relative(ROOT, scene._file)
  if (!issues.has(key)) issues.set(key, [])
  issues.get(key).push({ cat, detail })
}

for (const scene of scenes) {
  const segments = scene.segments ?? {}
  const segmentKeys = Object.keys(segments)
  const choiceEntries = allChoicesOf(scene)
  totalChoices += choiceEntries.length

  // ── A: broken nextSegment ────────────────────────────────────────────────
  for (const { choice, loc } of choiceEntries) {
    const ns = choice.nextSegment
    if (ns !== null && ns !== undefined && ns !== '') {
      if (!segments[ns]) {
        addIssue(scene, 'A', `${loc} → nextSegment "${ns}" not in segments`)
        counters.A++
      }
    }
  }

  // ── B: broken nextNodeId ─────────────────────────────────────────────────
  for (const { choice, loc } of choiceEntries) {
    const nni = choice.nextNodeId
    if (nni !== null && nni !== undefined && nni !== '') {
      if (!sceneIds.has(nni)) {
        addIssue(scene, 'B', `${loc} → nextNodeId "${nni}" — scene not found`)
        counters.B++
      }
    }
  }

  // ── C: orphaned segments ─────────────────────────────────────────────────
  if (segmentKeys.length > 0) {
    const reachable = reachableSegmentKeys(scene)
    for (const key of segmentKeys) {
      if (!reachable.has(key)) {
        addIssue(scene, 'C', `segment "${key}" — never reached from root choices via nextSegment BFS`)
        counters.C++
      }
    }
  }

  // ── D: reachable dead-end segments ───────────────────────────────────────
  if (segmentKeys.length > 0) {
    const reachable = reachableSegmentKeys(scene)
    for (const key of segmentKeys) {
      if (!reachable.has(key)) continue // orphaned; handled by C
      const seg = segments[key]
      const segChoices = seg.choices ?? []
      if (segChoices.length === 0) {
        addIssue(scene, 'D', `segment "${key}" is reachable but has 0 choices (dead-end leaf)`)
        counters.D++
      }
    }
  }

  // ── E: missing required fields on choices ────────────────────────────────
  for (const { choice, loc } of choiceEntries) {
    const missing = REQUIRED_FIELDS.filter(f => !(f in choice))
    if (missing.length > 0) {
      addIssue(scene, 'E', `${loc} — missing: [${missing.join(', ')}]`)
      counters.E++
    }
  }
}

// ── Report ────────────────────────────────────────────────────────────────────
const totalIssues = Object.values(counters).reduce((a, b) => a + b, 0)

console.log('═'.repeat(80))
console.log('NARRATIVE SCENE STRUCTURAL AUDIT')
console.log('═'.repeat(80))
console.log(`Scenes scanned     : ${scenes.length}  (from ${allFiles.length} JSON files)`)
console.log(`Parse/load errors  : ${parseErrors.length}`)
console.log(`Total choices      : ${totalChoices}`)
console.log(`Files with issues  : ${issues.size}`)
console.log(`Total issues       : ${totalIssues}`)
console.log('')
console.log('By category:')
console.log(`  A) BROKEN_NEXT_SEGMENT  : ${counters.A}`)
console.log(`  B) BROKEN_NEXT_NODE_ID  : ${counters.B}`)
console.log(`  C) ORPHANED_SEGMENT     : ${counters.C}`)
console.log(`  D) DEAD_END_SEGMENT     : ${counters.D}  (reachable segment, 0 choices)`)
console.log(`  E) MISSING_FIELDS       : ${counters.E}  (flags/chainTriggers/codexUnlocks)`)
console.log('═'.repeat(80))

if (parseErrors.length > 0) {
  console.log('\n── PARSE / LOAD ERRORS ──────────────────────────────────────────────────────')
  for (const e of parseErrors) console.log(`  ${e}`)
}

// Print issues grouped by file, sorted alphabetically
const sortedFiles = [...issues.keys()].sort()

for (const fileKey of sortedFiles) {
  const fileIssues = issues.get(fileKey)
  console.log(`\n── ${fileKey}`)
  for (const { cat, detail } of fileIssues) {
    console.log(`   [${cat}] ${detail}`)
  }
}

console.log('\n' + '═'.repeat(80))
console.log('END OF REPORT')
console.log('═'.repeat(80))
