// Reply audit — does every option produce the right reply? (Phase A, read-only)
//
//   node scripts/reply-audit.mjs            static S1–S9 + fold in existing D1/D2 data
//   node scripts/reply-audit.mjs --dynamic  run D1 (vitest, real stores) first
//   node scripts/reply-audit.mjs --ui       run D2 (Playwright, needs D1) first
//   node scripts/reply-audit.mjs --all      D1, then D2, then the static pass
//
// Writes docs/REPLY_AUDIT/{summary,findings,transcript-act*}.md. Never edits
// scene or engine files.
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { ROOT, loadScenes, loadStatPaths, codeLiterals, choiceLists, resolveTarget } from './reply-audit/load.mjs'
import { buildIndex, checkS1, checkS2, checkS3, checkS4, checkS5, checkS6, checkS7, checkS8, checkS9 } from './reply-audit/checks.mjs'
import { writeTranscripts, writeSummary, writeFindings } from './reply-audit/report.mjs'
import { buildFindings } from './reply-audit/findings.mjs'

const OUT = path.join(ROOT, 'docs', 'REPLY_AUDIT')
const DATA = path.join(OUT, 'data')
const args = new Set(process.argv.slice(2))

function run(cmd, cmdArgs) {
  const r = spawnSync(cmd, cmdArgs, { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' })
  if (r.status !== 0) throw new Error(`${cmd} ${cmdArgs.join(' ')} exited ${r.status}`)
}

if (args.has('--dynamic') || args.has('--all')) run('npx', ['vitest', 'run', '--config', 'scripts/vitest.reply.config.ts'])
if (args.has('--ui') || args.has('--all')) run('node', ['scripts/reply-audit.d2.mjs'])

const readJson = f => (fs.existsSync(path.join(DATA, f)) ? JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8')) : null)

// Engine rules, each verified by reading the cited code (see summary.md).
const RULES = [
  { id: 'R1', where: 'narrativeStore.ts:636,654', text: 'A choice with a resolvable nextNodeId loads that scene and ignores nextSegment; otherwise nextSegment loads that segment; a missing segment/scene key leaves the scene in place with sceneDone=true (terminal).' },
  { id: 'R2', where: 'narrativeStore.ts:410,666', text: 'Segment narrative is filtered by per-node conditions using gameState/activeFlags captured BEFORE the choice applies its stateChanges and flags.' },
  { id: 'R3', where: 'narrativeStore.ts:636,654-655', text: 'A nextNodeId target is used raw from SCENE_REGISTRY: no filterNarrative, no `dialogue` normalisation, no prerequisites, no exclusive[] redirect.' },
  { id: 'R4', where: 'NarrativeEngine.ts:65,76; NarrativeScene.tsx:96-98', text: 'Visible choices = choices whose `conditions` all pass (choice-level `prerequisites` are ignored); an empty list becomes the synthetic "Continue…" (ENGINE_CONTINUE_ID), which completes the scene with no effects (narrativeStore.ts:385).' },
  { id: 'R5', where: 'conditionEvaluator.ts:52,110', text: 'Conditions: {type:"flag",flag,value} = membership; {stat,operator,value} with dot paths, `flags.x`, top-level stats and PATH_ALIASES; an unknown path is false; bare {flag,value} has no stat and throws.' },
  { id: 'R6', where: 'narrativeStore.ts:449-457', text: '`statEffects` (as add) apply only when `stateChanges` is empty.' },
  { id: 'R7', where: 'ConversationPanel.tsx:486-489,553-562,1228', text: "Reactions: only the clicked choice's reactions are queued; the strip renders only while !sceneDone; the reset effect keyed on the `choices` array clears them." },
  { id: 'R8', where: 'GameLayout.tsx:62-65 (SocialEvent imported nowhere)', text: 'Every scene, including type social_event, renders through NarrativeScene; `socialInteractions` are never read.' },
  { id: 'R9', where: 'NarrativeScene.tsx:58-71', text: 'family_dinner_recurring / intelligence_briefing_recurring append injected segment narrative to whatever currentScene.narrative is, keyed on the scene id only.' },
  { id: 'R10', where: 'narrativeStore.ts:475-498; weekStore.ts:1597-1621', text: 'delayWeeks 0 chain triggers call injectScene right away (no condition/probability check), inserting the target after the current queue item; injectScene skips visited targets.' },
  { id: 'R11', where: 'narrativeStore.ts:668', text: 'A segment without its own monologue inherits the current monologue; ConversationPanel shows a monologue only when its text changes.' },
]

const S6_RULE = [
  'Reactions play only for the choice they belong to (handleChoice looks up the clicked id). They never play for every choice.',
  'They are shown only while !sceneDone, so reactions on terminal choices are never eligible.',
  'Even eligible ones are cleared in the same commit by the `[choices]` reset effect, because NarrativeScene rebuilds the choices array every render. D2 measured their lifetime with a MutationObserver (see E1).',
  'socialInteractions never play: SocialEvent.tsx is unmounted, so those scenes show only their top-level `choices` (or the engine "Continue…" when empty).',
]

const entries = loadScenes()
const statPaths = loadStatPaths()
const idx = buildIndex(entries, codeLiterals())

const s1 = checkS1(entries, idx)
const s2 = checkS2(entries, idx)
const s3 = checkS3(entries, idx)
const s4 = checkS4(entries)
const s5 = checkS5(entries, idx, statPaths)
const s6 = checkS6(entries, idx)
const s7 = checkS7(entries, idx)
const s8 = checkS8(entries, idx)
const s9 = checkS9(entries, idx)

const mountedLists = entries.flatMap(e => choiceLists(e.scene).filter(l => !l.unmounted).map(l => ({ scene: e.scene, l })))
const nonTerminal = mountedLists.flatMap(({ scene, l }) => l.choices.filter(c => resolveTarget(c, scene, idx.registry).kind !== 'terminal'))
const sharedGroups = mountedLists.reduce((n, { scene, l }) => {
  const counts = {}
  for (const c of l.choices) {
    const t = resolveTarget(c, scene, idx.registry)
    if (t.kind !== 'terminal') counts[t.id] = (counts[t.id] ?? 0) + 1
  }
  return n + Object.values(counts).filter(v => v > 1).length
}, 0)
const checked = {
  choices: s1.length,
  mounted: s1.filter(r => !r.list.startsWith('social:')).length,
  social: s1.filter(r => r.list.startsWith('social:')).length,
  nonTerminal: nonTerminal.length,
  sharedGroups,
  gatedNodes: mountedLists.reduce((n, { l }) => n + l.narrative.filter(nd => nd.conditions?.length).length, 0),
  gatedChoices: mountedLists.reduce((n, { l }) => n + l.choices.filter(c => c.conditions?.length).length, 0),
}

const d1Stats = readJson('d1-stats.json')
const d1 = d1Stats ? { stats: d1Stats, anomalies: readJson('d1-anomalies.json') ?? [], unclicked: readJson('d1-unclicked.json') ?? [] } : null
const d2Raw = readJson('d2-results.json')
function d2Note(raw) {
  const groups = raw.scenes.reduce((m, sc) => ({ ...m, [sc.group]: (m[sc.group] ?? 0) + 1 }), {})
  const bad = raw.results.filter(r => r.status !== 'match')
  const kinds = r => [...(r.missing ?? []), ...(r.flashOnly ?? [])].map(m => m.kind)
  const reactionOnly = bad.filter(r => !(r.extra ?? []).length && kinds(r).length && kinds(r).every(k => k === 'reaction'))
  return `scenes ${Object.entries(groups).map(([g, n]) => `${g} ${n}`).join(', ')}; empty flag set, every root option; `
    + `${raw.results.length - bad.length} match; ${reactionOnly.length} of ${bad.length} mismatches are reaction-only `
    + `(${bad.filter(r => (r.flashOnly ?? []).length).length} flash-only, ${bad.filter(r => (r.missing ?? []).length).length} never rendered text); `
    + `${bad.length - reactionOnly.length} other display-only mismatches`
}
const d2 = d2Raw ? { ...d2Raw, note: d2Note(d2Raw) } : null

fs.mkdirSync(OUT, { recursive: true })
const transcripts = writeTranscripts(OUT, s1)
const scenesWith = { reactions: entries.filter(e => choiceLists(e.scene).some(l => l.choices.some(c => c.reactions?.length))).length }
const ctx = { s1, s2, s3, s4, s5, s6, s7, s8, s9, checked, d1, d2, transcripts, rules: RULES, s6Rule: S6_RULE, scenesWith }
const findings = buildFindings(ctx)
writeSummary(OUT, ctx)
writeFindings(OUT, findings, d2)

const byConf = findings.reduce((m, f) => ({ ...m, [f.confidence]: (m[f.confidence] ?? 0) + 1 }), {})
console.log(`reply-audit: ${entries.length} scenes, ${s1.length} transcript rows (${transcripts.map(t => `act${t.act} ${t.rows}`).join(', ')})`)
console.log(`  S2 ${s2.length} | S3 ${s3.length} | S4 ${s4.rows.length}/${s4.total} | S5 routers ${s5.routers.length} (+${s5.allGated.length} gated lists, ${s5.shapes.length} bad shapes) | S6 terminal-reactions ${s6.onTerminal.length}, social scenes ${s6.social.length} | S7 ${s7.length} | S8 ${s8.length} | S9 ${s9.length}`)
console.log(`  D1 ${d1 ? `${d1.stats.clicks} clicks, ${d1.stats.untraceableClicks} untraceable` : 'not run'} | D2 ${d2 ? `${d2.results.length} clicks, ${d2.results.filter(r => r.status !== 'match').length} mismatching` : 'not run'}`)
console.log(`  findings ${findings.length} (${Object.entries(byConf).map(([k, v]) => `${k} ${v}`).join(', ')}) -> ${path.relative(ROOT, OUT)}`)
