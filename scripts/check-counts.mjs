import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const NARRATIVE_DIR = join(ROOT, 'src', 'data', 'narrative')

function walkDir(dir) {
  const r = []
  for (const e of readdirSync(dir)) {
    const f = join(dir, e)
    if (statSync(f).isDirectory()) r.push(...walkDir(f))
    else if (e.endsWith('.json')) r.push(f)
  }
  return r
}

function countChoices(data) {
  let n = (data.choices ?? []).length
  for (const seg of Object.values(data.segments ?? {})) n += (seg.choices ?? []).length
  return n
}

function countSegments(data) {
  return Object.keys(data.segments ?? {}).length
}

const files = walkDir(NARRATIVE_DIR)
let mismatches = 0

for (const fp of files) {
  const relPath = relative(ROOT, fp).replace(/\\/g, '/')
  let gitContent
  try {
    gitContent = execSync(`git show HEAD:"${relPath}"`, { cwd: ROOT }).toString()
  } catch { continue }

  let before
  try { before = JSON.parse(gitContent) } catch { continue }
  if (!before?.id) continue
  const after = JSON.parse(readFileSync(fp, 'utf8'))

  const cb = countChoices(before), ca = countChoices(after)
  const sb = countSegments(before), sa = countSegments(after)

  if (cb !== ca || sb !== sa) {
    console.error(`MISMATCH: ${relPath}  choices ${cb}->${ca}  segments ${sb}->${sa}`)
    mismatches++
  }
}

if (mismatches === 0) {
  console.log('✓ Choice and segment counts unchanged across all modified files')
} else {
  console.error(`${mismatches} count mismatch(es) detected`)
  process.exit(1)
}
