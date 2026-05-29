// Audit script for all narrative JSON files
// Run: node scripts/audit-narrative.mjs
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const NARRATIVE_DIR = join(ROOT, 'src', 'data', 'narrative')

// ─── Collect all narrative JSON files ────────────────────────────────────────

function walkDir(dir) {
  const results = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      results.push(...walkDir(full))
    } else if (entry.endsWith('.json')) {
      results.push(full)
    }
  }
  return results
}

const files = walkDir(NARRATIVE_DIR)
const scenes = []
const sceneIds = new Set()
const parseErrors = []

for (const file of files) {
  try {
    const raw = readFileSync(file, 'utf8')
    const data = JSON.parse(raw)
    if (Array.isArray(data)) {
      // Some files export arrays — skip those (agenda/codex)
      continue
    }
    if (data && data.id) {
      scenes.push({ ...data, _file: file.replace(ROOT, '') })
      if (sceneIds.has(data.id)) {
        parseErrors.push(`DUPLICATE ID: "${data.id}" in ${file.replace(ROOT, '')}`)
      }
      sceneIds.add(data.id)
    }
  } catch (e) {
    parseErrors.push(`${file.replace(ROOT, '')}: ${e.message}`)
  }
}

console.log(`Loaded ${scenes.length} scenes from ${files.length} files\n`)

// ─── 1. Scenes with fewer than 3 choices ─────────────────────────────────────

console.log('='.repeat(70))
console.log('1. SCENES WITH FEWER THAN 3 CHOICES')
console.log('='.repeat(70))

const lowChoiceScenes = scenes
  .filter(s => s.choices && s.choices.length < 3)
  .sort((a, b) => a.choices?.length - b.choices?.length)

if (lowChoiceScenes.length === 0) {
  console.log('  ✓ All scenes have 3+ choices\n')
} else {
  for (const s of lowChoiceScenes) {
    console.log(`  ⚠ ${s.id} — ${s.choices?.length ?? 0} choice(s) — ${s._file}`)
    if (s.choices?.length === 0) console.log('    → NO CHOICES AT ALL — dead end!')
    if (s.choices?.length === 1) console.log('    → Only 1 choice — effectively linear')
  }
  console.log(`  Total: ${lowChoiceScenes.length} scenes with <3 choices\n`)
}

// ─── 2. Broken chain reaction targets ────────────────────────────────────────

console.log('='.repeat(70))
console.log('2. CHAIN REACTIONS TARGETING NON-EXISTENT SCENE IDs')
console.log('='.repeat(70))

let brokenChains = 0
for (const s of scenes) {
  if (!s.choices) continue
  for (const choice of s.choices) {
    if (!choice.chainTriggers) continue
    for (const trigger of choice.chainTriggers) {
      if (!trigger.targetNodeId) continue
      if (!sceneIds.has(trigger.targetNodeId)) {
        console.log(`  ✗ ${s.id} / choice "${choice.id}" → "${trigger.targetNodeId}" (NOT FOUND)`)
        console.log(`    File: ${s._file}`)
        brokenChains++
      }
    }
  }
}
if (brokenChains === 0) console.log('  ✓ All chain triggers reference valid scene IDs\n')
else console.log(`  Total: ${brokenChains} broken chain references\n`)

// ─── 3. Dead-end weeks (no scenes available) ─────────────────────────────────

console.log('='.repeat(70))
console.log('3. WEEK COVERAGE — DEAD-END DETECTION')
console.log('='.repeat(70))

// Build availability map per week
const weekAvailability = {}
for (let w = 1; w <= 52; w++) {
  weekAvailability[w] = []
}

for (const s of scenes) {
  const start = s.weekAvailable ?? 1
  const end = s.weekDeadline ?? 52
  for (let w = start; w <= end && w <= 52; w++) {
    if (w >= 1) weekAvailability[w].push(s.id)
  }
}

const emptyWeeks = []
const sparseWeeks = []
for (let w = 1; w <= 52; w++) {
  const count = weekAvailability[w].length
  if (count === 0) {
    emptyWeeks.push(w)
    console.log(`  ✗ Week ${w}: NO SCENES AVAILABLE`)
  } else if (count <= 2) {
    sparseWeeks.push(w)
  }
}

if (emptyWeeks.length === 0) {
  console.log('  ✓ All 52 weeks have at least 1 scene available\n')
} else {
  console.log(`  Total: ${emptyWeeks.length} empty weeks\n`)
}

console.log(`  Weeks with ≤2 scenes: ${sparseWeeks.length}`)
if (sparseWeeks.length > 0 && sparseWeeks.length <= 20) {
  console.log(`  Sparse weeks: ${sparseWeeks.join(', ')}\n`)
}

// Check contiguous empty stretches
let maxEmptyStretch = 0
let currentStretch = 0
let stretchStart = 0
for (let w = 1; w <= 52; w++) {
  if (weekAvailability[w].length === 0) {
    if (currentStretch === 0) stretchStart = w
    currentStretch++
    if (currentStretch > maxEmptyStretch) maxEmptyStretch = currentStretch
  } else {
    if (currentStretch >= 2) {
      console.log(`  ⚠ Empty stretch: weeks ${stretchStart}–${stretchStart + currentStretch - 1} (${currentStretch} weeks)`)
    }
    currentStretch = 0
  }
}
if (currentStretch >= 2) {
  console.log(`  ⚠ Empty stretch: weeks ${stretchStart}–${stretchStart + currentStretch - 1} (${currentStretch} weeks)`)
}

// Act-by-act breakdown
for (const [actName, weekRange] of [['Act 1', [1,13]], ['Act 2', [14,26]], ['Act 3', [27,39]], ['Act 4', [40,52]]]) {
  const [start, end] = weekRange
  let actTotal = 0
  let actEmpty = 0
  for (let w = start; w <= end; w++) {
    actTotal += weekAvailability[w].length
    if (weekAvailability[w].length === 0) actEmpty++
  }
  console.log(`  ${actName} (w${start}-${end}): ${actTotal} scene-weeks, ${actEmpty} empty weeks`)
}
console.log()

// ─── 4. Faction threshold analysis ───────────────────────────────────────────

console.log('='.repeat(70))
console.log('4. FACTION / STAT THRESHOLD ANALYSIS')
console.log('='.repeat(70))

// Extract all conditions from all choices in all scenes
const allConditions = []
for (const s of scenes) {
  // Scene prerequisites
  if (s.prerequisites) {
    for (const cond of s.prerequisites) {
      allConditions.push({ ...cond, source: `scene:${s.id}`, type: 'prerequisite' })
    }
  }
  // Choice conditions
  if (s.choices) {
    for (const choice of s.choices) {
      if (choice.conditions) {
        for (const cond of choice.conditions) {
          allConditions.push({ ...cond, source: `choice:${choice.id}`, type: 'choice_condition' })
        }
      }
      // Chain trigger conditions
      if (choice.chainTriggers) {
        for (const trigger of choice.chainTriggers) {
          if (trigger.conditions) {
            for (const cond of trigger.conditions) {
              allConditions.push({ ...cond, source: `chain:${trigger.targetNodeId}`, type: 'chain_condition' })
            }
          }
        }
      }
    }
  }
}

// Group by stat path
const byStat = {}
for (const cond of allConditions) {
  const stat = cond.stat
  if (!byStat[stat]) byStat[stat] = []
  byStat[stat].push(cond)
}

// Stat ranges (from gameState.ts)
const STAT_RANGES = {
  'nation.economyHealth': [-100, 100],
  'nation.unemployment': [0, 40],
  'nation.inflation': [0, 30],
  'nation.nationalDebt': [0, Infinity],
  'nation.corruption': [0, 100],
  'nation.militaryReadiness': [0, 100],
  'nation.publicOrder': [0, 100],
  'nation.pressFreedom': [0, 100],
  'nation.civilLiberties': [0, 100],
  'nation.internationalStanding': [0, 100],
  'factions.halvekists': [0, 100],
  'factions.workersCoalition': [0, 100],
  'factions.reformists': [0, 100],
  'factions.ironCovenant': [0, 100],
  'factions.church': [0, 100],
  'factions.businessClass': [0, 100],
  'factions.dravenni': [0, 100],
  'personal.marriageHealth': [0, 100],
  'personal.lioraRelationship': [0, 100],
  'personal.tomasWellbeing': [0, 100],
  'personal.personalWealth': [0, Infinity],
  'personal.publicImage': [0, 100],
  'personal.moralCompass': [-100, 100],
}

let thresholdIssues = 0

for (const [stat, conditions] of Object.entries(byStat)) {
  // Skip flag conditions
  if (stat.startsWith('flags.')) continue

  const range = STAT_RANGES[stat]
  if (!range) {
    console.log(`  ? Unknown stat: "${stat}" (${conditions.length} conditions)`)
    continue
  }

  const [min, max] = range
  const effectiveMax = max === Infinity ? 10000 : max // for display purposes

  for (const cond of conditions) {
    const val = Number(cond.value)
    if (isNaN(val)) continue

    // Check if threshold is at extreme edge (too easy or impossible)
    const margin = 5 // 5% margin

    if (cond.operator === '>=' || cond.operator === '>') {
      if (val >= effectiveMax - margin) {
        console.log(`  ⚠ NEAR-IMPOSSIBLE: ${cond.source} requires ${stat} ${cond.operator} ${val} (range: ${min}–${effectiveMax})`)
        thresholdIssues++
      } else if (val <= min + margin) {
        console.log(`  ⚠ TRIVIAL: ${cond.source} requires ${stat} ${cond.operator} ${val} (range: ${min}–${effectiveMax})`)
        thresholdIssues++
      }
    }

    if (cond.operator === '<=' || cond.operator === '<') {
      if (val <= min + margin) {
        console.log(`  ⚠ NEAR-IMPOSSIBLE: ${cond.source} requires ${stat} ${cond.operator} ${val} (range: ${min}–${effectiveMax})`)
        thresholdIssues++
      } else if (val >= effectiveMax - margin) {
        console.log(`  ⚠ TRIVIAL: ${cond.source} requires ${stat} ${cond.operator} ${val} (range: ${min}–${effectiveMax})`)
        thresholdIssues++
      }
    }

    // Check for values outside the possible range
    if (val < min || val > effectiveMax) {
      console.log(`  ✗ OUT OF RANGE: ${cond.source} requires ${stat} ${cond.operator} ${val} (valid range: ${min}–${effectiveMax})`)
      thresholdIssues++
    }
  }
}

if (thresholdIssues === 0) console.log('  ✓ All faction/stat thresholds within reasonable bounds\n')
else console.log(`  Total threshold issues: ${thresholdIssues}\n`)

// ─── 5. Ending condition reachability ────────────────────────────────────────

console.log('='.repeat(70))
console.log('5. ENDING CONDITION REACHABILITY ANALYSIS')
console.log('='.repeat(70))

const endingScene = scenes.find(s => s.id === 'act4_week52_ending')
if (!endingScene) {
  console.log('  ✗ act4_week52_ending.json not found!\n')
} else {
  const endingChoices = endingScene.choices || []
  console.log(`  Found ${endingChoices.length} ending choices\n`)

  // For each ending choice, analyze its conditions
  for (const choice of endingChoices) {
    const conds = choice.conditions || []
    console.log(`  ── ${choice.id} ──`)
    console.log(`  Tag: ${choice.internalTag}`)

    if (conds.length === 0) {
      console.log(`  ⚠ NO CONDITIONS — always reachable (fallback ending?)\n`)
      continue
    }

    let allReachable = true
    for (const cond of conds) {
      if (cond.stat.startsWith('flags.')) {
        console.log(`  Flag: ${cond.stat} ${cond.operator} ${cond.value}`)
      } else {
        const range = STAT_RANGES[cond.stat]
        const [min, max] = range || [0, 100]
        const effMax = max === Infinity ? 200 : max
        const val = Number(cond.value)
        const op = cond.operator

        // Determine if the condition is reachable
        let reachable = true
        let note = ''

        if (op === '>=' || op === '>') {
          if (val > effMax) { reachable = false; note = 'EXCEEDS MAX' }
          else if (val >= effMax - 3) note = 'very tight'
          else if (val <= min + 3) note = 'trivially easy'
        }
        if (op === '<=' || op === '<') {
          if (val < min) { reachable = false; note = 'BELOW MIN' }
          else if (val <= min + 3) note = 'very tight'
          else if (val >= effMax - 3) note = 'trivially easy'
        }
        if (op === '==') {
          if (val < min || val > effMax) { reachable = false; note = 'OUT OF RANGE' }
        }

        if (!reachable) allReachable = false
        const marker = reachable ? '  ' : '✗ '
        const noteStr = note ? ` [${note}]` : ''
        console.log(`  ${marker}Stat: ${cond.stat} ${op} ${val} (range ${min}–${effMax})${noteStr}`)
      }
    }

    // Check for conflicting conditions
    if (conds.length >= 2) {
      const flagConds = conds.filter(c => c.stat.startsWith('flags.'))
      const statConds = conds.filter(c => !c.stat.startsWith('flags.'))

      // Check for mutually exclusive stat ranges
      for (let i = 0; i < statConds.length; i++) {
        for (let j = i + 1; j < statConds.length; j++) {
          const a = statConds[i], b = statConds[j]
          if (a.stat !== b.stat) continue
          const av = Number(a.value), bv = Number(b.value)
          if ((a.operator === '>=' && b.operator === '<=' && av > bv) ||
              (a.operator === '>' && b.operator === '<' && av >= bv) ||
              (a.operator === '>=' && b.operator === '<' && av >= bv)) {
            console.log(`  ✗ CONFLICT: ${a.stat} must be >=${av} AND <=${bv} — impossible!`)
            allReachable = false
          }
        }
      }
    }

    if (allReachable) {
      console.log(`  ✓ Reachable\n`)
    } else {
      console.log(`  ✗ UNREACHABLE or extremely difficult\n`)
    }
  }
}

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log('='.repeat(70))
console.log('SUMMARY')
console.log('='.repeat(70))
console.log(`  Scenes loaded:          ${scenes.length}`)
console.log(`  Parse errors:           ${parseErrors.length}`)
console.log(`  Scenes with <3 choices: ${lowChoiceScenes.length}`)
console.log(`  Broken chain refs:      ${brokenChains}`)
console.log(`  Empty weeks:            ${emptyWeeks.length}`)
console.log(`  Faction threshold issues: ${thresholdIssues}`)
console.log()

if (parseErrors.length > 0) {
  console.log('Parse errors:')
  parseErrors.forEach(e => console.log(`  ${e}`))
}
