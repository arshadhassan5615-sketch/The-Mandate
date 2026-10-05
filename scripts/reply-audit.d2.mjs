// Reply audit D2 — UI check with the local Playwright install.
//
//   node scripts/reply-audit.d2.mjs            (needs D1 first: node_modules/.cache/reply-audit/d1-full.json)
//
// Starts Vite on a private port, opens the real app, and for ~30 scenes
// (10 Term 1, 10 Term 2, 10 most branching) clicks every root option under the
// EMPTY flag set. After each click it samples the page text until the next
// input is offered (choices or the Continue line), then diffs what appeared
// against D1's prediction for the same click. Read-only: no app code changes.
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import { ROOT, loadScenes, weekOf } from './reply-audit/load.mjs'

const PORT = Number(process.env.REPLY_AUDIT_PORT ?? 5199)
const BASE = `http://localhost:${PORT}`
const D1_FULL = path.join(ROOT, 'node_modules', '.cache', 'reply-audit', 'd1-full.json')
const OUT = path.join(ROOT, 'docs', 'REPLY_AUDIT', 'data', 'd2-results.json')
const SAMPLE_MS = 3400
const MAX_PRESSES = 160

const sleep = ms => new Promise(r => setTimeout(r, ms))
const norm = s => String(s ?? '').replace(/[“”"]/g, '').replace(/\s+/g, ' ').trim()
const key = s => norm(s).slice(0, 40)

// ── scene selection (deterministic, from D1) ─────────────────────────────
function pickScenes(d1, registry) {
  const roots = new Map()
  for (const r of d1) {
    if (r.flagset !== 'empty' || r.path.length || r.actual !== r.scene) continue
    if (!roots.has(r.scene)) roots.set(r.scene, [])
    roots.get(r.scene).push(r)
  }
  const ok = [...roots.entries()]
    .filter(([id, rs]) => rs.length >= 2 && !rs.some(r => r.choice.startsWith('__')) && registry.get(id).type !== 'social_event')
    .map(([id]) => registry.get(id))
  const spread = (list, n) => {
    const sorted = [...list].sort((a, b) => weekOf(a) - weekOf(b) || a.id.localeCompare(b.id))
    if (sorted.length <= n) return sorted
    return Array.from({ length: n }, (_, i) => sorted[Math.floor((i * (sorted.length - 1)) / (n - 1))])
  }
  const term1 = spread(ok.filter(s => weekOf(s) <= 52), 10)
  const term2 = spread(ok.filter(s => weekOf(s) > 52), 10)
  const taken = new Set([...term1, ...term2].map(s => s.id))
  const branching = ok
    .filter(s => !taken.has(s.id))
    .sort((a, b) => Object.keys(b.segments ?? {}).length - Object.keys(a.segments ?? {}).length || a.id.localeCompare(b.id))
    .slice(0, 10)
  // Reaction probe: 3 extra scenes whose root clicks D1 predicts will show
  // reactions (the 30 above may contain none — most reactions sit on terminal choices).
  branching.forEach(s => taken.add(s.id))
  const probe = ok
    .filter(s => !taken.has(s.id) && roots.get(s.id).some(r => r.reactions.count && r.reactions.eligible))
    .slice(0, 3)
  return [
    ...term1.map(s => ({ scene: s, group: 'term1' })),
    ...term2.map(s => ({ scene: s, group: 'term2' })),
    ...branching.map(s => ({ scene: s, group: 'branching' })),
    ...probe.map(s => ({ scene: s, group: 'reaction-probe' })),
  ].map(x => ({ ...x, clicks: roots.get(x.scene.id) }))
}

// ── dev server ────────────────────────────────────────────────────────────
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

// ── page helpers ──────────────────────────────────────────────────────────
async function boot(page) {
  await page.goto(BASE, { waitUntil: 'load' })
  await page.evaluate(async () => {
    const { useWeekStore } = await import('/src/stores/weekStore.ts')
    const { useSettingsStore } = await import('/src/stores/settingsStore.ts')
    useSettingsStore.getState().setTextSpeed('instant')
    useWeekStore.getState().devJumpToWeek(1)
  })
}

async function stage(page, sceneId, week) {
  await page.evaluate(async ({ sceneId, week }) => {
    const { useWeekStore } = await import('/src/stores/weekStore.ts')
    const { useNarrativeStore } = await import('/src/stores/narrativeStore.ts')
    const { useGameStore } = await import('/src/stores/gameStore.ts')
    useWeekStore.getState().clearPendingTimeouts()
    useNarrativeStore.getState().resetScene()
    useGameStore.getState().resetToInitial()
    useGameStore.setState({ currentWeek: Math.max(1, week) })
    useNarrativeStore.setState({ activeFlags: [], visitedSceneIds: [], unlockedCodexIds: [], metCharacters: [] })
    useWeekStore.setState({
      phase: 'scene', showCabinetMeeting: false, showCabinetFormation: false, transitionLabel: '',
      returnToMap: false, currentQueueIndex: 0, cliffhangerText: null, diaryEntry: null, cutscenePanels: null,
      sceneQueue: [{ id: 'reply-audit', title: 'audit', description: '', category: 'crisis', sceneId, slotCost: 0, executionOrder: 0, weekAvailable: week }],
    })
    await new Promise(r => setTimeout(r, 150))
    useNarrativeStore.getState().loadScene(sceneId)
  }, { sceneId, week })
  await sleep(250)
}

const bodyLines = page => page.evaluate(() => document.body.innerText.split('\n').map(s => s.trim()).filter(Boolean))
const hasChoices = page => page.evaluate(() => !!document.querySelector('.conversation-choices'))
const hasContinue = page => page.evaluate(() => [...document.querySelectorAll('button')].some(b => /…$/.test(b.innerText.trim()) && /Evening Review|Next Meeting/.test(b.innerText)))

async function revealUntilInput(page, seen, order) {
  for (let i = 0; i < MAX_PRESSES; i++) {
    if (await hasChoices(page) || await hasContinue(page)) return true
    await page.keyboard.press('Space')
    await sleep(35)
    for (const l of await bodyLines(page)) if (!seen.has(l)) { seen.add(l); order.push(l) }
  }
  return false
}

async function clickChoice(page, text) {
  return page.evaluate(t => {
    const items = [...document.querySelectorAll('.conversation-choices > div')]
    const norm = s => s.replace(/\s+/g, ' ').trim()
    const hit = items.find(el => norm(el.innerText).includes(norm(t).slice(0, 50)))
    if (!hit) return false
    hit.click()
    return true
  }, text)
}

// ── diff against D1 ───────────────────────────────────────────────────────
// `sampled`: lines seen by the 50 ms body sampler (steady-state display).
// `flashes`: elements the MutationObserver saw inserted, with their on-screen
// lifetime in ms (null = still attached when sampling ended).
function diff(pred, sampled, flashes, scene, registry) {
  const sampledText = norm(sampled.join(' '))
  const visibility = s => {
    const k = key(s)
    if (sampledText.includes(k)) return { seen: 'visible' }
    const hits = flashes.filter(f => norm(f.text).includes(k))
    if (!hits.length) return null
    const lives = hits.map(h => h.life)
    const life = lives.includes(null) ? null : Math.max(...lives)
    return { seen: life === null ? 'visible' : 'flash', lifeMs: life }
  }
  const lists = [scene.choices ?? [], ...Object.values(scene.segments ?? {}).map(s => s.choices ?? [])].flat()
  const nextTexts = pred.next[0] === '(Continue button)' ? [] : pred.next.map(id => lists.find(c => c.id === id)?.text ?? 'Continue…')
  const target = pred.outcome === 'node' ? registry.get(pred.to) : null
  const expected = [
    ...pred.shown.map(s => ({ kind: 'narrative', text: s.text })),
    ...(pred.monologue ? [{ kind: 'monologue', text: pred.monologue }] : []),
    ...(pred.reactions.eligible ? pred.reactions.texts.map(t => ({ kind: 'reaction', text: t })) : []),
    ...nextTexts.map(t => ({ kind: 'next-choice', text: t })),
  ].map(e => ({ ...e, ...(visibility(e.text) ?? { seen: 'missing' }) }))
  const missing = expected.filter(e => e.seen === 'missing')
  const flashOnly = expected.filter(e => e.seen === 'flash')
  const ineligibleReactionsShown = pred.reactions.eligible ? [] : pred.reactions.texts.filter(t => visibility(t))
  const explained = [...expected.map(e => key(e.text)), ...pred.reactions.texts.map(key), key(pred.choiceText)]
  if (target) explained.push(...(target.narrative ?? []).map(n => key(n.text)))
  const uiChrome = /^(Proceed to Evening Review|Continue to Next Meeting.*)…$|^Continue…$/
  const extra = sampled.filter(l => l.length >= 25 && !uiChrome.test(l) && !explained.some(k => norm(l).includes(k) || k.includes(norm(l).slice(0, 40))))
  return { expected: expected.length, missing, flashOnly, ineligibleReactionsShown, extra }
}

async function auditClick(page, pick, pred, rec, registry) {
  await stage(page, pick.scene.id, weekOf(pick.scene))
  const pre = new Set()
  if (!(await revealUntilInput(page, pre, []))) { rec.status = 'never reached choices'; return }
  for (const l of await bodyLines(page)) pre.add(l)
  // MutationObserver records every inserted element and how long it stayed
  // attached, so text that appears and vanishes between samples is caught.
  await page.evaluate(() => {
    window.__replyAdded = []
    window.__replyObs?.disconnect()
    window.__replyObs = new MutationObserver(muts => {
      const now = performance.now()
      for (const m of muts) {
        for (const n of m.addedNodes) if (n.nodeType === 1) window.__replyAdded.push({ el: n, t: now, gone: null })
        for (const n of m.removedNodes) {
          for (const a of window.__replyAdded) if (a.gone === null && (a.el === n || n.contains?.(a.el))) a.gone = now
        }
      }
    })
    window.__replyObs.observe(document.body, { childList: true, subtree: true })
  })
  if (!(await clickChoice(page, pred.choiceText))) { rec.status = 'choice not on screen'; return }
  const seen = new Set(pre)
  const order = []
  const t0 = Date.now()
  while (Date.now() - t0 < SAMPLE_MS) {
    for (const l of await bodyLines(page)) if (!seen.has(l)) { seen.add(l); order.push(l) }
    await sleep(50)
  }
  rec.reachedInput = await revealUntilInput(page, seen, order)
  // The app fell back to the title screen (a dev-server reload, not game logic): retry.
  if (order.includes('A POLITICAL NARRATIVE RPG')) throw new Error('page reset to title screen during sampling')
  const flashes = await page.evaluate(() => {
    window.__replyObs?.disconnect()
    return (window.__replyAdded ?? [])
      .map(a => ({ text: (a.el.textContent ?? '').trim(), life: a.gone === null ? null : Math.round(a.gone - a.t) }))
      .filter(a => a.text)
  })
  rec.observed = order
  Object.assign(rec, diff(pred, order, flashes, pick.scene, registry))
  rec.status = rec.missing.length || rec.flashOnly.length || rec.extra.length || rec.ineligibleReactionsShown.length ? 'MISMATCH' : 'match'
}

// ── main ──────────────────────────────────────────────────────────────────
async function main() {
  if (!fs.existsSync(D1_FULL)) throw new Error('run D1 first (npx vitest run --config scripts/vitest.reply.config.ts)')
  const d1 = JSON.parse(fs.readFileSync(D1_FULL, 'utf8'))
  const registry = new Map(loadScenes().map(e => [e.scene.id, e.scene]))
  const picks = pickScenes(d1, registry)
  const only = process.env.REPLY_AUDIT_ONLY
  const run = only ? picks.filter(p => p.scene.id === only) : picks
  const vite = await startVite()
  const browser = await chromium.launch()
  const results = []
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    page.on('pageerror', e => results.at(-1)?.pageErrors.push(String(e).slice(0, 200)))
    await boot(page)
    for (const pick of run) {
      for (const pred of pick.clicks) {
        const rec = { group: pick.group, scene: pick.scene.id, week: weekOf(pick.scene), choice: pred.choice, outcome: pred.outcome, to: pred.to, pageErrors: [] }
        results.push(rec)
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            await auditClick(page, pick, pred, rec, registry)
            break
          } catch (e) {
            // A page navigation (e.g. a Vite full reload) destroys the context: re-boot and retry once.
            rec.retries = attempt
            rec.lastError = String(e).slice(0, 160)
            rec.status = 'error'
            await boot(page)
          }
        }
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
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, JSON.stringify({ scenes: picks.map(p => ({ id: p.scene.id, group: p.group, week: weekOf(p.scene) })), results }, null, 1))
  const mism = results.filter(r => r.status !== 'match').length
  console.log(`D2: ${picks.length} scenes, ${results.length} clicks, ${mism} not matching -> ${path.relative(ROOT, OUT)}`)
}

main().catch(e => { console.error(e); process.exit(1) })
