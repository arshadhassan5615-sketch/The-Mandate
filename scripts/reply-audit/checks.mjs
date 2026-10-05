// Reply audit — static checks S1–S9 over every scene, every segment.
import fs from 'node:fs'
import path from 'node:path'
import {
  ROOT, choiceLists, resolveTarget, targetKey, effectiveChanges, rootNarrative,
  segmentNarrative, conditionShapeProblem, asFlagTest, fmtConds, actOf, weekOf, trunc,
} from './load.mjs'
import { analyzeRouter, isContinueStyle } from './router.mjs'

// ── shared index ─────────────────────────────────────────────────────────
export function buildIndex(entries, codeLits) {
  const registry = new Map(entries.map(e => [e.scene.id, e]))
  const flagSetters = new Map()      // flag -> Set(sceneId)   (mounted lists only)
  const flagSetterLists = new Map()  // flag -> Set(sceneId›listKey)
  const bothSet = new Set()          // "f|g" pairs set by one choice
  for (const { scene } of entries) {
    for (const list of choiceLists(scene)) {
      if (list.unmounted) continue
      for (const c of list.choices) {
        const flags = c.flags ?? []
        for (const f of flags) {
          if (!flagSetters.has(f)) flagSetters.set(f, new Set())
          flagSetters.get(f).add(scene.id)
          if (!flagSetterLists.has(f)) flagSetterLists.set(f, new Set())
          flagSetterLists.get(f).add(`${scene.id}›${list.key}`)
        }
        for (const f of flags) for (const g of flags) if (f !== g) bothSet.add(`${f}|${g}`)
      }
    }
  }
  return { registry, flagSetters, flagSetterLists, bothSet, codeLits }
}

function fmtNode(n) {
  const plain = !n.type || n.type === 'description' || n.type === 'narrative'
  const who = n.character ? `${n.character}: ` : plain ? '' : `(${n.type}) `
  const gate = n.conditions?.length ? ` {if ${fmtConds(n.conditions)}}` : ''
  return `${who}${trunc(n.text, 110)}${gate}`
}

function fmtReaction(r) {
  return `${r.character}[${r.type}]: ${trunc(r.text, 70)}`
}

function targetLabel(t) {
  if (t.kind === 'terminal') return t.broken ? `terminal (BROKEN: ${t.broken})` : 'terminal'
  return `${t.kind === 'segment' ? 'seg' : 'nextNodeId'}:${t.id}`
}

// ── S1 transcript ─────────────────────────────────────────────────────────
export function checkS1(entries, idx) {
  const rows = []
  for (const entry of entries) {
    const { scene } = entry
    for (const list of choiceLists(scene)) {
      for (const c of list.choices) {
        let target
        let first2
        if (list.unmounted) {
          target = 'n/a — SocialEvent unmounted'
          first2 = ['(never shown)']
        } else {
          const t = resolveTarget(c, scene, idx.registry)
          target = targetLabel(t)
          if (t.kind === 'segment') {
            const nodes = segmentNarrative(scene.segments[t.id])
            first2 = nodes.length ? nodes.slice(0, 2).map(fmtNode) : ['(empty segment — straight to its choices)']
          } else if (t.kind === 'node') {
            first2 = rootNarrative(idx.registry.get(t.id).scene).slice(0, 2).map(fmtNode)
          } else {
            first2 = ['(scene ends — Continue button)']
          }
        }
        rows.push({
          act: actOf(entry), week: weekOf(scene), scene: scene.id, list: list.key, choice: c.id,
          text: trunc(c.text, 140), gate: fmtConds(c.conditions), target, first2,
          reactions: (c.reactions ?? []).map(fmtReaction), flags: c.flags ?? [],
        })
      }
    }
  }
  return rows
}

// ── S2 shared targets ─────────────────────────────────────────────────────
function signs(choice) {
  const m = new Map()
  for (const mod of effectiveChanges(choice)) {
    if (mod.operation && mod.operation !== 'add') continue
    if (typeof mod.value !== 'number' || mod.value === 0) continue
    m.set(mod.stat, Math.sign(mod.value) + (m.get(mod.stat) ?? 0))
  }
  return m
}

function nodeFlags(nodes) {
  const out = new Set()
  for (const n of nodes) for (const c of n.conditions ?? []) { const f = asFlagTest(c); if (f) out.add(f.flag) }
  return out
}

export function checkS2(entries, idx) {
  const out = []
  for (const { scene } of entries) {
    for (const list of choiceLists(scene)) {
      if (list.unmounted) continue
      const groups = new Map()
      for (const c of list.choices) {
        const t = resolveTarget(c, scene, idx.registry)
        if (t.kind === 'terminal') continue
        const k = targetKey(t)
        if (!groups.has(k)) groups.set(k, { t, choices: [] })
        groups.get(k).choices.push(c)
      }
      for (const [k, g] of groups) {
        if (g.choices.length < 2) continue
        const targetNodes = g.t.kind === 'segment'
          ? segmentNarrative(scene.segments[g.t.id])
          : rootNarrative(idx.registry.get(g.t.id).scene)
        const gatedOn = nodeFlags(targetNodes)
        for (let i = 0; i < g.choices.length; i++) {
          for (let j = i + 1; j < g.choices.length; j++) {
            const a = g.choices[i]
            const b = g.choices[j]
            const sa = signs(a)
            const sb = signs(b)
            const opposite = [...sa.keys()].filter(s => sb.has(s) && Math.sign(sa.get(s)) * Math.sign(sb.get(s)) < 0)
            const fa = new Set(a.flags ?? [])
            const fb = new Set(b.flags ?? [])
            const diff = [...fa].filter(f => !fb.has(f)).concat([...fb].filter(f => !fa.has(f)))
            if (!opposite.length && !diff.length) continue
            out.push({
              scene: scene.id, list: list.key, target: k, a: a.id, b: b.id,
              textA: trunc(a.text, 80), textB: trunc(b.text, 80),
              opposite, diffFlags: diff,
              targetGatesOnDiff: diff.filter(f => gatedOn.has(f)),
              severity: opposite.length ? 'opposite-sign' : 'flags-only',
            })
          }
        }
      }
    }
  }
  return out
}

// ── S3 name/intent mismatch ───────────────────────────────────────────────
const ANTONYMS = [
  [['reject', 'refuse', 'decline', 'deny', 'veto', 'oppose', 'block', 'against'], ['accept', 'agree', 'approve', 'support', 'sign', 'yes', 'endorse', 'embrace']],
  [['arrest', 'detain', 'prosecute', 'jail', 'imprison'], ['release', 'pardon', 'spare', 'amnesty']],
  [['fire', 'dismiss', 'sack', 'oust', 'remove'], ['keep', 'retain', 'protect']],
  [['public', 'publish', 'announce', 'reveal', 'expose', 'disclose'], ['private', 'secret', 'quiet', 'bury', 'hide', 'conceal', 'suppress']],
  [['war', 'attack', 'mobilize', 'retaliate', 'invade'], ['peace', 'negotiate', 'talks', 'diplomacy', 'ceasefire', 'withdraw']],
  [['stay', 'remain'], ['leave', 'resign', 'depart']],
  [['truth', 'honest', 'confess', 'admit'], ['lie', 'cover', 'deceive']],
]

export function tokens(s) {
  return new Set(String(s ?? '').toLowerCase().split(/[^a-z]+/).filter(Boolean))
}

/** Returns [word in a, opposing word in b] when `a` leans one way and `b` the other. */
export function antonymClash(a, b) {
  for (const [x, y] of ANTONYMS) {
    const ax = x.find(w => a.has(w)); const ay = y.find(w => a.has(w))
    const bx = x.find(w => b.has(w)); const by = y.find(w => b.has(w))
    if (ax && !ay && by && !bx) return [ax, by]
    if (ay && !ax && bx && !by) return [ay, bx]
  }
  return null
}

export function checkS3(entries, idx) {
  const out = []
  for (const { scene } of entries) {
    for (const list of choiceLists(scene)) {
      if (list.unmounted) continue
      for (const c of list.choices) {
        const t = resolveTarget(c, scene, idx.registry)
        if (t.kind === 'terminal') continue
        const tTok = tokens(t.id.replace(/_/g, ' '))
        const byId = antonymClash(tokens(c.id.replace(/_/g, ' ')), tTok)
        const byText = byId ? null : antonymClash(tokens(c.text), tTok)
        const clash = byId ?? byText
        if (!clash) continue
        out.push({ scene: scene.id, list: list.key, choice: c.id, text: trunc(c.text, 90), target: t.id, clash, source: byId ? 'id' : 'text' })
      }
    }
  }
  return out
}

// ── S4 reaction attribution ───────────────────────────────────────────────
export function checkS4(entries) {
  const out = []
  let total = 0
  for (const { scene } of entries) {
    const cast = new Set(scene.characters ?? [])
    for (const list of choiceLists(scene)) {
      for (const c of list.choices) {
        for (const r of c.reactions ?? []) {
          total++
          if (!cast.has(r.character)) {
            out.push({ scene: scene.id, list: list.key, choice: c.id, character: r.character, type: r.type, text: trunc(r.text, 80), cast: [...cast] })
          }
        }
      }
    }
  }
  return { total, rows: out }
}

// ── S5 routers ────────────────────────────────────────────────────────────
export function checkS5(entries, idx, statPaths) {
  const routers = []
  const allGated = []
  for (const { scene } of entries) {
    for (const list of choiceLists(scene)) {
      if (list.unmounted || !list.choices.length) continue
      if (!list.choices.every(c => c.conditions?.length)) continue
      const analysis = analyzeRouter(list.choices, statPaths, idx)
      const rec = {
        scene: scene.id, list: list.key, n: list.choices.length,
        texts: list.choices.map(c => trunc(c.text, 50)),
        gates: list.choices.map(c => `${c.id}: ${fmtConds(c.conditions)}`),
        ...analysis,
      }
      if (isContinueStyle(list.choices)) routers.push(rec)
      else allGated.push(rec)
    }
  }
  // Global shape scan: every condition the engine evaluates.
  const shapes = []
  const scan = (where, conds) => {
    for (const cond of conds ?? []) {
      const p = conditionShapeProblem(cond, statPaths)
      if (p) shapes.push({ where, cond: JSON.stringify(cond), problem: p })
    }
  }
  for (const { scene } of entries) {
    scan(`${scene.id} prerequisites`, scene.prerequisites)
    for (const list of choiceLists(scene)) {
      if (list.unmounted) continue
      list.narrative.forEach((n, i) => scan(`${scene.id}›${list.key} node#${i}`, n.conditions))
      for (const c of list.choices) {
        scan(`${scene.id}›${list.key}›${c.id} gate`, c.conditions)
        for (const t of c.chainTriggers ?? []) scan(`${scene.id}›${c.id} chain→${t.targetNodeId}`, t.conditions)
      }
    }
  }
  return { routers, allGated, shapes }
}

// ── S6 extras: reactions + socialInteractions ─────────────────────────────
export function renderableReactionTypes() {
  const src = fs.readFileSync(path.join(ROOT, 'src', 'components', 'narrative', 'ConversationPanel.tsx'), 'utf8')
  return new Set([...src.matchAll(/reaction\.type === '(\w+)'/g)].map(m => m[1]))
}

export function checkS6(entries, idx) {
  const renderable = renderableReactionTypes()
  const unrenderable = []
  const onTerminal = []
  const duplicated = []
  const clashes = []
  const social = []
  const sceneLevel = []
  let dialogueReactions = 0
  let totalReactions = 0
  for (const { scene } of entries) {
    if (scene.reactions) sceneLevel.push({ scene: scene.id, count: scene.reactions.length })
    if (scene.socialInteractions?.length) {
      social.push({
        scene: scene.id, type: scene.type, interactions: scene.socialInteractions.length,
        choices: scene.socialInteractions.reduce((n, si) => n + (si.choices?.length ?? 0), 0),
        playsInstead: (scene.choices ?? []).length ? (scene.choices ?? []).map(c => c.id).join(', ') : 'Continue… (ensureTerminalChoice)',
      })
    }
    for (const list of choiceLists(scene)) {
      if (list.unmounted) continue
      const byText = new Map()
      for (const c of list.choices) {
        const t = resolveTarget(c, scene, idx.registry)
        for (const r of c.reactions ?? []) {
          totalReactions++
          if (r.type === 'dialogue') dialogueReactions++
          if (!renderable.has(r.type)) unrenderable.push({ scene: scene.id, list: list.key, choice: c.id, character: r.character, type: r.type, text: trunc(r.text, 70) })
          if (t.kind === 'terminal') onTerminal.push({ scene: scene.id, list: list.key, choice: c.id, type: r.type })
          const k = `${r.character}|${r.text}`
          if (!byText.has(k)) byText.set(k, [])
          byText.get(k).push(c)
          const clash = antonymClash(tokens(c.text), tokens(r.text))
          if (clash) clashes.push({ scene: scene.id, list: list.key, choice: c.id, choiceText: trunc(c.text, 70), reaction: fmtReaction(r), clash })
        }
      }
      for (const [k, cs] of byText) {
        if (cs.length < 2) continue
        const flagSets = new Set(cs.map(c => (c.flags ?? []).slice().sort().join(',')))
        if (flagSets.size < 2) continue
        duplicated.push({ scene: scene.id, list: list.key, choices: cs.map(c => c.id), reaction: trunc(k.replace('|', ': '), 90) })
      }
    }
  }
  return { renderable: [...renderable], unrenderable, onTerminal, duplicated, clashes, social, sceneLevel, dialogueReactions, totalReactions }
}

// ── S7 per-node conditions vs the scene's own routing ─────────────────────
function sceneGraph(scene, idx) {
  const lists = choiceLists(scene).filter(l => !l.unmounted)
  const incoming = new Map(lists.map(l => [l.key, []]))
  for (const l of lists) {
    for (const c of l.choices) {
      const t = resolveTarget(c, scene, idx.registry)
      if (t.kind === 'segment') incoming.get(t.id).push({ from: l.key, choice: c })
    }
  }
  // may/must flag sets while choosing in each list (dataflow fixpoint)
  const may = new Map([['(root)', new Set()]])
  const must = new Map([['(root)', new Set()]])
  for (let changed = true, guard = 0; changed && guard < 200; guard++) {
    changed = false
    for (const [key, edges] of incoming) {
      if (key === '(root)') continue
      const live = edges.filter(e => may.has(e.from))
      if (!live.length) continue
      const nextMay = new Set(may.get(key) ?? [])
      let nextMust = null
      for (const e of live) {
        for (const f of [...may.get(e.from), ...(e.choice.flags ?? [])]) nextMay.add(f)
        const viaMust = new Set([...must.get(e.from), ...(e.choice.flags ?? [])])
        nextMust = nextMust ? new Set([...nextMust].filter(f => viaMust.has(f))) : viaMust
      }
      const prevMay = may.get(key)
      const prevMust = must.get(key)
      if (!prevMay || prevMay.size !== nextMay.size) { may.set(key, nextMay); changed = true }
      if (!prevMust || prevMust.size !== nextMust.size || [...prevMust].some(f => !nextMust.has(f))) { must.set(key, nextMust); changed = true }
    }
  }
  return { lists, incoming, may, must }
}

function external(flag, sceneId, idx) {
  const setters = idx.flagSetters.get(flag)
  return idx.codeLits.has(flag) || Boolean(setters && [...setters].some(s => s !== sceneId))
}

function nodeFindings(scene, list, g, idx) {
  const out = []
  const edges = list.key === '(root)' ? [] : g.incoming.get(list.key).filter(e => g.may.has(e.from))
  // filterNarrative runs with the flags held BEFORE the entering choice
  const filterMay = new Set(edges.flatMap(e => [...g.may.get(e.from)]))
  const filterMust = edges.length
    ? edges.map(e => g.must.get(e.from)).reduce((a, b) => new Set([...a].filter(f => b.has(f))))
    : new Set()
  list.narrative.forEach((n, i) => {
    for (const cond of n.conditions ?? []) {
      const f = asFlagTest(cond)
      if (!f) continue
      const setBy = edges.filter(e => (e.choice.flags ?? []).includes(f.flag)).map(e => e.choice.id)
      const ext = external(f.flag, scene.id, idx)
      const base = { scene: scene.id, list: list.key, node: i, nodeText: trunc(n.text, 70), cond: f.want ? f.flag : `!${f.flag}` }
      if (f.want && setBy.length && !filterMay.has(f.flag)) {
        out.push({ ...base, kind: 'needs-flag-set-by-entering-choice', choices: setBy, confidence: ext ? 'medium' : 'high',
          why: "filterNarrative runs on pre-choice activeFlags, so the entering choice's own flag is not yet set" + (ext ? ' (flag is also set elsewhere earlier, so it may still show)' : '') })
      } else if (f.want && !ext && !filterMay.has(f.flag)) {
        out.push({ ...base, kind: 'never-true', choices: [], confidence: 'high',
          why: idx.flagSetters.has(f.flag) ? 'flag is set only in this scene, never before this list' : 'flag is never set anywhere' })
      } else if (!f.want && setBy.length) {
        out.push({ ...base, kind: 'hidden-flag-set-by-entering-choice', choices: setBy, confidence: 'medium',
          why: 'node meant to hide when the flag is set still shows on the path that sets it (pre-choice evaluation)' })
      } else if (!f.want && filterMust.has(f.flag)) {
        out.push({ ...base, kind: 'never-true', choices: [], confidence: 'high', why: 'flag is set on every in-scene path before this list' })
      }
    }
  })
  return out
}

function gateFindings(scene, list, g, idx) {
  const out = []
  const may = g.may.get(list.key)
  const must = g.must.get(list.key)
  for (const c of list.choices) {
    for (const cond of c.conditions ?? []) {
      const f = asFlagTest(cond)
      if (!f) continue
      const base = { scene: scene.id, list: list.key, node: null, nodeText: `choice ${c.id}`, kind: 'dead-choice-gate', choices: [c.id], confidence: 'high' }
      if (f.want && !external(f.flag, scene.id, idx) && !may.has(f.flag)) {
        out.push({ ...base, cond: f.flag, why: idx.flagSetters.has(f.flag) ? 'gate flag is only set by this scene on paths that never reach this list' : 'gate flag is never set anywhere' })
      } else if (!f.want && must.has(f.flag)) {
        out.push({ ...base, cond: `!${f.flag}`, why: 'every in-scene path to this list sets the flag' })
      }
    }
  }
  return out
}

export function checkS7(entries, idx) {
  const out = []
  for (const { scene } of entries) {
    const g = sceneGraph(scene, idx)
    for (const list of g.lists) {
      if (!g.may.has(list.key)) continue // unreachable inside the scene
      out.push(...nodeFindings(scene, list, g, idx), ...gateFindings(scene, list, g, idx))
    }
  }
  return out
}

// ── S8 nextNodeId targets vs their prerequisites ──────────────────────────
export function checkS8(entries, idx) {
  const out = []
  for (const { scene } of entries) {
    for (const list of choiceLists(scene)) {
      if (list.unmounted) continue
      for (const c of list.choices) {
        if (!c.nextNodeId) continue
        const tgt = idx.registry.get(c.nextNodeId)?.scene
        if (!tgt) { out.push({ scene: scene.id, list: list.key, choice: c.id, target: c.nextNodeId, verdict: 'MISSING target', details: [] }); continue }
        const setHere = new Set(c.flags ?? [])
        const details = []
        let verdict = 'no prerequisites'
        for (const cond of tgt.prerequisites ?? []) {
          if (verdict === 'no prerequisites') verdict = 'depends on prior state'
          const f = asFlagTest(cond)
          if (f && !f.want && setHere.has(f.flag)) { verdict = 'FALSE at arrival'; details.push(`requires !${f.flag}, which this choice sets`) }
          else if (f && f.want && setHere.has(f.flag)) details.push(`${f.flag} ✓ (set by this choice)`)
          else details.push(`${fmtConds([cond])} — depends on prior state`)
        }
        if ((tgt.prerequisites ?? []).length && (tgt.prerequisites ?? []).every(cond => { const f = asFlagTest(cond); return f?.want && setHere.has(f.flag) })) verdict = 'TRUE at arrival'
        for (const pf of tgt.prerequisiteFlags ?? []) details.push(`prerequisiteFlags ${pf}${setHere.has(pf) ? ' ✓' : ' — depends'}`)
        for (const ps of tgt.prerequisiteSceneIds ?? []) details.push(`prerequisiteSceneIds ${ps}`)
        if (weekOf(tgt) > weekOf(scene)) details.push(`target weekAvailable ${weekOf(tgt)} > source week ${weekOf(scene)}`)
        const gatedNodes = rootNarrative(tgt).filter(n => n.conditions?.length).length
        if (gatedNodes) details.push(`${gatedNodes} conditional node(s) in target are NOT filtered on the nextNodeId path (all render)`)
        if (!tgt.narrative && tgt.dialogue) details.push('target stores text under `dialogue` — not normalised on the nextNodeId path, so it renders EMPTY')
        out.push({ scene: scene.id, list: list.key, choice: c.id, target: tgt.id, verdict, details, gatedNodes })
      }
    }
  }
  return out
}

// ── S9 delayWeeks 0 chains ────────────────────────────────────────────────
export function checkS9(entries, idx) {
  const out = []
  for (const { scene } of entries) {
    for (const list of choiceLists(scene)) {
      if (list.unmounted) continue
      for (const c of list.choices) {
        for (const t of c.chainTriggers ?? []) {
          if (t.delayWeeks !== 0) continue
          const tgt = idx.registry.get(t.targetNodeId)?.scene
          const tt = resolveTarget(c, scene, idx.registry)
          const notes = []
          if (!tgt) notes.push('target scene MISSING — injectScene skipped (getScene undefined)')
          if (t.conditions?.length) notes.push(`trigger conditions IGNORED for delay 0: ${fmtConds(t.conditions)}`)
          if (t.probability !== undefined && t.probability < 1) notes.push(`probability ${t.probability} IGNORED for delay 0`)
          const setHere = new Set(c.flags ?? [])
          const unmet = (tgt?.prerequisites ?? []).filter(cond => { const f = asFlagTest(cond); return !(f && f.want && setHere.has(f.flag)) })
          if (unmet.length) notes.push(`target prerequisites not guaranteed by this choice (${fmtConds(unmet)}) — loadScene only reroutes via exclusive[], otherwise it plays anyway`)
          if (t.targetNodeId === scene.id || (tgt?.choices ?? []).some(tc => (tc.chainTriggers ?? []).some(x => x.delayWeeks === 0 && x.targetNodeId === scene.id))) {
            notes.push('cycle with the source scene — the second injection is blocked by injectScene\'s visited guard')
          }
          if (tgt && weekOf(tgt) > weekOf(scene)) notes.push(`target weekAvailable ${weekOf(tgt)} > source week ${weekOf(scene)} (not checked)`)
          out.push({
            scene: scene.id, list: list.key, choice: c.id, target: t.targetNodeId,
            when: tt.kind === 'terminal' ? 'right after this choice (next queue item)' : 'queued now; plays when this scene finishes',
            notes,
          })
        }
      }
    }
  }
  return out
}
