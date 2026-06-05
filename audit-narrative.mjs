// Audit script: for every choice in every scene JSON, verify that
// nextNodeId and nextSegment references resolve to actual scene/segment IDs.
// Run with: node audit-narrative.mjs
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const ROOT = 'src/data/narrative'

function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    const s = statSync(p)
    if (s.isDirectory()) out.push(...walk(p))
    else if (entry.endsWith('.json')) out.push(p)
  }
  return out
}

function extractScenes(data) {
  if (!data) return []
  if (Array.isArray(data)) return data.filter(s => s?.id)
  if (data.id) return [data]
  for (const key of ['scenes', 'narrativeNodes', 'nodes', 'entries']) {
    if (Array.isArray(data[key])) return data[key].filter(s => s?.id)
  }
  return []
}

const files = walk(ROOT)
const SCENE_REGISTRY = new Set()
for (const f of files) {
  try {
    let raw = readFileSync(f, 'utf8')
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1)
    const data = JSON.parse(raw)
    for (const s of extractScenes(data)) if (s.id) SCENE_REGISTRY.add(s.id)
  } catch {}
}

let totalScenes = 0
let totalChoices = 0
const issues = []

function checkScene(scene, file) {
  const segKeys = scene.segments ? Object.keys(scene.segments) : []
  for (const choice of (scene.choices ?? [])) {
    totalChoices++
    if (choice.nextNodeId && !SCENE_REGISTRY.has(choice.nextNodeId)) {
      issues.push({
        file, sceneId: scene.id, choiceId: choice.id,
        kind: 'nextNodeId', target: choice.nextNodeId,
        msg: `nextNodeId "${choice.nextNodeId}" not found in SCENE_REGISTRY`,
      })
    }
    if (choice.nextSegment && !segKeys.includes(choice.nextSegment)) {
      issues.push({
        file, sceneId: scene.id, choiceId: choice.id,
        kind: 'nextSegment', target: choice.nextSegment,
        availableSegments: segKeys,
        msg: `nextSegment "${choice.nextSegment}" not found in scene.segments`,
      })
    }
  }
}

for (const file of files) {
  const rel = relative(ROOT, file).replaceAll(sep, '/')
  let data
  try {
    let raw = readFileSync(file, 'utf8')
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1)
    data = JSON.parse(raw)
  } catch (e) {
    issues.push({ file: rel, error: `parse error: ${e.message}` })
    continue
  }
  for (const scene of extractScenes(data)) {
    totalScenes++
    checkScene(scene, rel)
  }
}

console.log(`Scenes: ${totalScenes}`)
console.log(`Choices: ${totalChoices}`)
console.log(`Issues: ${issues.length}`)
if (issues.length) {
  console.log('---')
  for (const i of issues) {
    if (i.error) { console.log(`[${i.file}] ${i.error}`); continue }
    console.log(`[${i.file}] scene=${i.sceneId} choice=${i.choiceId} kind=${i.kind} target=${i.target}`)
    console.log(`  ${i.msg}`)
    if (i.availableSegments) console.log(`  availableSegments=${JSON.stringify(i.availableSegments)}`)
  }
  process.exit(1)
} else {
  console.log('All references resolve. PASS')
}
