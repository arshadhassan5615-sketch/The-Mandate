// Reply audit D2-recurring — browser verification for the two recurring scenes.
//
//   node scripts/reply-audit.d2-recurring.mjs
//     (needs D1 first: node_modules/.cache/reply-audit/d1-full.json)
//
// Phase B3 STEP 1. Takes each dinner / briefing topic IN TURN: seeds exactly
// the state that selects that topic, stages the scene in the real app,
// captures the opening panel text, clicks the hub continue choice, captures
// the post-click panel text, and diffs it against D1's prediction for the
// same click. Asserts that no topic line or opening line already shown
// reappears after the click (the B2 re-feed fix). Read-only: no app changes.
//
// Writes:
//   docs/REPLY_AUDIT/data/d2-recurring-results.json
//   docs/REPLY_AUDIT/d2-recurring-report.md
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PORT = Number(process.env.REPLY_AUDIT_PORT ?? 5200)
const BASE = `http://localhost:${PORT}`
const D1_FULL = path.join(ROOT, 'node_modules', '.cache', 'reply-audit', 'd1-full.json')
const OUT_JSON = path.join(ROOT, 'docs', 'REPLY_AUDIT', 'data', 'd2-recurring-results.json')
const OUT_MD = path.join(ROOT, 'docs', 'REPLY_AUDIT', 'd2-recurring-report.md')
const SAMPLE_MS = 2200
const MAX_PRESSES = 160

const sleep = ms => new Promise(r => setTimeout(r, ms))
const norm = s => String(s ?? '').replace(/[“”"]/g, '').replace(/\s+/g, ' ').trim()
const key = s => norm(s).slice(0, 40)

const loadJson = id => JSON.parse(fs.readFileSync(
  path.join(ROOT, 'src', 'data', 'narrative',
    id === 'family_dinner_recurring' ? 'personal' : 'security', `${id}.json`), 'utf8'))

const segTexts = seg => (seg.narrative ?? []).map(n => n.text)

// One topic per run: the seed selects exactly that topic and nothing else.
const DINNER_BASE = { publicOrder: 80, marriageHealth: 80, tomasWellbeing: 80 }
const TOPICS = [
  { scene: 'family_dinner_recurring', topic: 'dinner_military_presence', flags: ['minister_defense_brenner'], state: { ...DINNER_BASE } },
  { scene: 'family_dinner_recurring', topic: 'dinner_oligarch_rumors', flags: ['morvec_debt_owed'], state: { ...DINNER_BASE } },
  { scene: 'family_dinner_recurring', topic: 'dinner_union_praise', flags: ['workers_deal_struck'], state: { ...DINNER_BASE } },
  { scene: 'family_dinner_recurring', topic: 'dinner_journalist_arrest', flags: ['press_suppressed'], state: { ...DINNER_BASE } },
  { scene: 'family_dinner_recurring', topic: 'dinner_protest_sounds', flags: [], state: { ...DINNER_BASE, publicOrder: 20 } },
  { scene: 'family_dinner_recurring', topic: 'dinner_curfew_discussion', flags: [], state: { ...DINNER_BASE }, emergency: true },
  { scene: 'family_dinner_recurring', topic: 'dinner_marital_tension', flags: [], state: { ...DINNER_BASE, marriageHealth: 20 } },
  { scene: 'family_dinner_recurring', topic: 'dinner_tomas_trouble', flags: [], state: { ...DINNER_BASE, tomasWellbeing: 10 } },
  { scene: 'intelligence_briefing_recurring', topic: 'briefing_mole_progress', flags: ['morivask_oil_deal_complete'], state: {}, clues: ['mole_clue_1_found'] },
  { scene: 'intelligence_briefing_recurring', topic: 'briefing_faction_unrest', flags: ['morivask_oil_deal_complete'], state: {}, ironCovenant: 20 },
  { scene: 'intelligence_briefing_recurring', topic: 'briefing_tyvaren_movement', flags: ['morivask_oil_deal_complete'], state: {}, hostility: 80 },
  { scene: 'intelligence_briefing_recurring', topic: 'briefing_morivask_instability', flags: [], state: {} },
  { scene: 'intelligence_briefing_recurring', topic: 'briefing_minister_corruption', flags: ['morivask_oil_deal_complete', 'vostane_corruption_exposed'], state: {} },
  { scene: 'intelligence_briefing_recurring', topic: 'briefing_oligarch_activity', flags: ['morivask_oil_deal_complete'], state: {}, vael: 50 },
  { scene: 'intelligence_briefing_recurring', topic: 'briefing_routine_quiet', flags: ['morivask_oil_deal_complete'], state: {} },
]
const HUB_CHOICE = { family_dinner_recurring: 'dinner_continue', intelligence_briefing_recurring: 'briefing_continue' }
const HUB_ANCHOR = {
  family_dinner_recurring: 'The meal is ending',
  intelligence_briefing_recurring: 'Vyktor waits',
}

async function startVite() {
  const proc = spawn(process.execPath, [path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(PORT), '--strictPort'], {
    cwd: ROOT, stdio: 'ignore',
  })
  for (let i = 0; i < 120; i++) {
    try { if ((await fetch(BASE)).ok) return proc } catch { /* not up yet */ }
    await sleep(500)
  }
  proc.kill()
  throw new Error(`vite did not start on ${BASE}`)
}

async function boot(page) {
  await page.goto(BASE, { waitUntil: 'load' })
  await page.evaluate(async () => {
    const { useWeekStore } = await import('/src/stores/weekStore.ts')
    const { useSettingsStore } = await import('/src/stores/settingsStore.ts')
    useSettingsStore.getState().setTextSpeed('instant')
    useWeekStore.getState().devJumpToWeek(1)
  })
}

async function stage(page, t) {
  await page.evaluate(async ({ sceneId, flags, state, emergency, clues, ironCovenant, hostility, vael }) => {
    const { useWeekStore } = await import('/src/stores/weekStore.ts')
    const { useNarrativeStore } = await import('/src/stores/narrativeStore.ts')
    const { useGameStore } = await import('/src/stores/gameStore.ts')
    useWeekStore.getState().clearPendingTimeouts()
    useNarrativeStore.getState().resetScene()
    useGameStore.getState().resetToInitial()
    useGameStore.setState(s => ({
      currentWeek: 20,
      stateOfEmergency: !!emergency,
      clues: clues ?? [],
      tyvarenHostility: hostility ?? 10,
      vaelInfluence: vael ?? 10,
      morvecInfluence: 10,
      nation: {
        ...s.nation,
        publicOrder: state.publicOrder ?? 80,
        assemblyHardliner: 10,
      },
      factions: { ...s.factions, ironCovenant: ironCovenant ?? 80 },
      personal: {
        ...s.personal,
        marriageHealth: state.marriageHealth ?? 80,
        tomasWellbeing: state.tomasWellbeing ?? 80,
      },
    }))
    useNarrativeStore.setState({ activeFlags: [...flags], visitedSceneIds: [], unlockedCodexIds: [], metCharacters: [] })
    useWeekStore.setState({
      phase: 'scene', showCabinetMeeting: false, showCabinetFormation: false, transitionLabel: '',
      returnToMap: false, currentQueueIndex: 0, cliffhangerText: null, diaryEntry: null, cutscenePanels: null,
      sceneQueue: [{ id: 'reply-audit', title: 'audit', description: '', category: 'crisis', sceneId, slotCost: 0, executionOrder: 0, weekAvailable: 20 }],
    })
    await new Promise(r => setTimeout(r, 150))
    useNarrativeStore.getState().loadScene(sceneId)
  }, { sceneId: t.scene, flags: t.flags, state: t.state, emergency: !!t.emergency, clues: t.clues, ironCovenant: t.ironCovenant, hostility: t.hostility, vael: t.vael })
  await sleep(250)
}

const bodyLines = page => page.evaluate(() => document.body.innerText.split('\n').map(s => s.trim()).filter(Boolean))
const hasChoices = page => page.evaluate(() => !!document.querySelector('.conversation-choices'))

async function revealUntilInput(page, seen, order) {
  for (let i = 0; i < MAX_PRESSES; i++) {
    if (await hasChoices(page)) return true
    await page.keyboard.press('Space')
    await sleep(35)
    for (const l of await bodyLines(page)) if (!seen.has(l)) { seen.add(l); order.push(l) }
  }
  return false
}

async function clickChoice(page, text) {
  return page.evaluate(t => {
    const items = [...document.querySelectorAll('.conversation-choices > div')]
    const n = s => s.replace(/\s+/g, ' ').trim()
    const hit = items.find(el => n(el.innerText).includes(n(t).slice(0, 50)))
    if (!hit) return false
    hit.click()
    return true
  }, text)
}

async function auditTopic(page, t, d1, sceneJson) {
  const rec = { scene: t.scene, topic: t.topic, seedFlags: t.flags, status: 'match', pageErrors: [] }
  await stage(page, t)
  const pre = new Set()
  const preOrder = []
  if (!(await revealUntilInput(page, pre, preOrder))) { rec.status = 'never reached choices'; return rec }
  for (const l of await bodyLines(page)) pre.add(l)
  rec.opening = preOrder

  const topicSeg = sceneJson.segments[t.topic]
  const topicLines = segTexts(topicSeg)
  const rootLines = (sceneJson.narrative ?? []).map(n => n.text)
  rec.topicFirstLine = topicLines[0]?.slice(0, 80) ?? null
  // The topic under test must actually be on screen at the opening.
  rec.topicShownAtOpening = topicLines.length > 0 && preOrder.join(' ').includes(key(topicLines[0]))

  const choiceText = sceneJson.choices.find(c => c.id === HUB_CHOICE[t.scene])?.text ?? ''
  if (!(await clickChoice(page, choiceText))) { rec.status = 'choice not on screen'; return rec }
  const seen = new Set(pre)
  const order = []
  const t0 = Date.now()
  while (Date.now() - t0 < SAMPLE_MS) {
    for (const l of await bodyLines(page)) if (!seen.has(l)) { seen.add(l); order.push(l) }
    await sleep(50)
  }
  rec.reachedInput = await revealUntilInput(page, seen, order)
  rec.observed = order

  // Assertion: no topic line and no root opening line reappears verbatim.
  const postText = norm(order.join(' '))
  const reappeared = [...topicLines, ...rootLines]
    .filter(l => postText.includes(key(l)))
    .map(l => l.slice(0, 80))
  rec.reappeared = reappeared
  rec.hubAnchorShown = postText.includes(HUB_ANCHOR[t.scene])

  // Diff against D1: same scene + hub-continue click records (old prediction
  // re-feeds the injections; the fixed browser must omit them).
  const preds = d1.filter(r => r.scene === t.scene && r.choice === HUB_CHOICE[t.scene])
  const d1Injected = [...new Set(preds.flatMap(r => r.shown.filter(s => s.src.startsWith('injected:')).map(s => s.text)))]
  rec.d1Records = preds.length
  rec.d1PredictedInjected = d1Injected
  rec.d1InjectedShownNow = d1Injected.filter(x => postText.includes(key(x)))

  if (!rec.topicShownAtOpening) rec.status = 'MISMATCH: topic not shown at opening'
  else if (reappeared.length) rec.status = `MISMATCH: ${reappeared.length} opening line(s) reappeared`
  else if (!rec.hubAnchorShown) rec.status = 'MISMATCH: hub narrative missing after click'
  return rec
}

async function main() {
  if (!fs.existsSync(D1_FULL)) throw new Error('run D1 first (npx vitest run --config scripts/vitest.reply.config.ts)')
  const d1 = JSON.parse(fs.readFileSync(D1_FULL, 'utf8'))
  const only = process.env.REPLY_AUDIT_ONLY
  const run = only ? TOPICS.filter(t => t.topic === only) : TOPICS
  const vite = await startVite()
  const browser = await chromium.launch()
  const results = []
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    page.on('pageerror', e => results.at(-1)?.pageErrors.push(String(e).slice(0, 200)))
    await boot(page)
    const cache = new Map()
    for (const t of run) {
      if (!cache.has(t.scene)) cache.set(t.scene, loadJson(t.scene))
      const rec = { group: 'recurring', week: 20, choice: HUB_CHOICE[t.scene], outcome: 'segment' }
      results.push(rec)
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          Object.assign(rec, await auditTopic(page, t, d1, cache.get(t.scene)))
          break
        } catch (e) {
          rec.retries = attempt
          rec.lastError = String(e).slice(0, 160)
          rec.status = 'error'
          await boot(page)
        }
      }
      if (rec.observed?.includes('A POLITICAL NARRATIVE RPG')) {
        rec.status = 'error: page reset during sampling'
        await boot(page)
      }
    }
  } finally {
    await browser.close()
    vite.kill()
  }
  if (only) {
    console.log(JSON.stringify(results, null, 1))
    return
  }
  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true })
  fs.writeFileSync(OUT_JSON, JSON.stringify({ topics: run.map(t => ({ scene: t.scene, topic: t.topic })), results }, null, 1))
  const mism = results.filter(r => r.status !== 'match').length
  console.log(`D2-recurring: ${run.length} topics, ${mism} mismatching -> ${path.relative(ROOT, OUT_JSON)}`)
  const lines = [
    '# D2-recurring report — Phase B3 STEP 1',
    '',
    `Run: node scripts/reply-audit.d2-recurring.mjs (Playwright, sequential, no vitest alongside).`,
    `Topics: ${run.length} (8 dinner + 7 briefing). Result: ${run.length - mism} match, ${mism} mismatch.`,
    '',
    ...results.map(r => `- ${r.scene} › ${r.topic}: ${r.status}`),
    '',
    'D1 diff: D1 (pre-fix prediction) re-feeds injected topics after the hub click; the fixed',
    'browser omits them. `d1InjectedShownNow` must be empty for every topic (it is when green).',
  ]
  fs.writeFileSync(OUT_MD, lines.join('\n') + '\n')
  console.log(`report -> ${path.relative(ROOT, OUT_MD)}`)
}

main().catch(e => { console.error(e); process.exit(1) })
