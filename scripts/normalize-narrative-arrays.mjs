/**
 * Normalize narrative JSON: add missing flags/chainTriggers/codexUnlocks arrays.
 *
 * Usage:
 *   node scripts/normalize-narrative-arrays.mjs           # dry-run (default)
 *   node scripts/normalize-narrative-arrays.mjs --apply   # write files
 *
 * Safety contract:
 *   - NEVER modifies any field that already exists in a choice
 *   - NEVER changes choice count or segment count
 *   - NEVER touches stateChanges, statEffects, text, nextSegment, conditions,
 *     nextNodeId, reactions, id, internalTag, journalEntry, tooltip, or any
 *     other existing field
 *   - Only adds flags:[], chainTriggers:[], codexUnlocks:[] when those exact
 *     keys are absent from a choice object
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, resolve, dirname, relative } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const NARRATIVE_DIR = join(ROOT, 'src', 'data', 'narrative')
const APPLY = process.argv.includes('--apply')
const REQUIRED = ['flags', 'chainTriggers', 'codexUnlocks']

function walkDir(dir) {
  const results = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) results.push(...walkDir(full))
    else if (entry.endsWith('.json')) results.push(full)
  }
  return results
}

function processScene(data) {
  let changed = false
  const report = []

  // Deep-clone so dry-run never mutates
  const newData = JSON.parse(JSON.stringify(data))

  const countBefore = { choices: 0, segments: Object.keys(newData.segments ?? {}).length }

  // Top-level choices
  for (let i = 0; i < (newData.choices ?? []).length; i++) {
    countBefore.choices++
    const c = newData.choices[i]
    const missing = REQUIRED.filter(f => !(f in c))
    if (missing.length > 0) {
      changed = true
      report.push({ loc: `top-level choice "${c.id ?? '(no id)'}"`, missing })
      for (const f of missing) newData.choices[i][f] = []
    }
  }

  // Segment choices
  for (const [segKey, seg] of Object.entries(newData.segments ?? {})) {
    for (let i = 0; i < (seg.choices ?? []).length; i++) {
      countBefore.choices++
      const c = seg.choices[i]
      const missing = REQUIRED.filter(f => !(f in c))
      if (missing.length > 0) {
        changed = true
        report.push({ loc: `segment "${segKey}" > choice "${c.id ?? '(no id)'}"`, missing })
        for (const f of missing) seg.choices[i][f] = []
      }
    }
  }

  return { changed, report, counts: countBefore, newData }
}

// ── Main ──────────────────────────────────────────────────────────────────────
const files = walkDir(NARRATIVE_DIR)
let totalFiles = 0
let totalModified = 0
let totalChoicesChanged = 0
const modifiedFiles = []

console.log(APPLY ? '── APPLY MODE ──' : '── DRY-RUN MODE (no files written) ──')
console.log()

for (const fp of files) {
  let data
  try {
    data = JSON.parse(readFileSync(fp, 'utf8'))
  } catch {
    continue
  }
  if (!data || typeof data !== 'object' || Array.isArray(data) || !data.id) continue
  totalFiles++

  const { changed, report, counts, newData } = processScene(data)
  if (!changed) continue

  totalModified++
  totalChoicesChanged += report.length
  const relPath = relative(ROOT, fp)
  modifiedFiles.push({ fp, relPath, report, counts, newData })

  console.log(`── ${relPath}  (${report.length} choice(s))`)
  for (const { loc, missing } of report) {
    console.log(`   ${loc} → add [${missing.join(', ')}]`)
  }
}

console.log()
console.log('═'.repeat(70))
console.log(`Scenes scanned     : ${totalFiles}`)
console.log(`Files to modify    : ${totalModified}`)
console.log(`Choices to update  : ${totalChoicesChanged}`)
console.log('═'.repeat(70))

if (!APPLY) {
  console.log()
  console.log('Re-run with --apply to write changes.')
  process.exit(0)
}

// ── Apply ─────────────────────────────────────────────────────────────────────
console.log()
console.log('Writing files...')
let writeErrors = 0

for (const { fp, relPath, newData } of modifiedFiles) {
  try {
    writeFileSync(fp, JSON.stringify(newData, null, 2) + '\n', 'utf8')
    console.log(`  ✓ ${relPath}`)
  } catch (e) {
    console.error(`  ✗ ${relPath}: ${e.message}`)
    writeErrors++
  }
}

console.log()
if (writeErrors > 0) {
  console.error(`${writeErrors} write error(s)`)
  process.exit(1)
} else {
  console.log(`All ${modifiedFiles.length} files written successfully.`)
}
