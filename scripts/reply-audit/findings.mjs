// Reply audit — turns check output into findings rows
// (scene | choice | what is wrong | proposed fix | confidence).
import { trunc } from './load.mjs'

// Per-pair verdicts after reading the shared reply text (S2). Key: scene|target.
const S2_REVIEWED = {
  'act2_week27_press_followup|node:act2_week27_press_outcome': {
    confidence: 'high',
    wrong: 'All three answers land on press_outcome, where Vyktor schedules "the implementation committee… twelve names by Friday", the clearance review and the Khaled meeting. Only press_followup_specific announced those; after deflect or combative the reply cites commitments the player never made.',
    fix: 'Give deflect/combative their own reply: split press_outcome into per-answer segments, or route each answer to its own nextNodeId scene. Do not use per-node conditions here: nextNodeId targets are not run through filterNarrative (E7).',
  },
  'act1_w2_formation_meeting|segment:finance_confrontation': {
    confidence: 'medium',
    wrong: 'kolvar_halvek_reject ("I can\'t put someone who looked away at my Finance Ministry") lands on the same debate as _accept ("bring Vostane back in for a direct debate"): Vostane re-enters and the Kolvar-vs-Vostane debate plays as if Kolvar were still in contention.',
    fix: 'Route _reject to a short segment where Kolvar is dismissed (or Vostane is confirmed), then rejoin the hub.',
  },
}
const NEXT_QUESTION_HUB = /^pick_|^act2_week27_press_(economy|followup)$|hub|transition|aftermath|tyvaren_retaliation|seg_investigation|seg_personal|luca_contact|pressure_close|_close|_end$/

function engineFindings(ctx, add) {
  const { s6, s7, s8, s9, d1, d2, scenesWith, checked } = ctx
  const d2Reaction = d2?.results.flatMap(r => (r.flashOnly ?? []).filter(f => f.kind === 'reaction')) ?? []
  const lifes = d2Reaction.map(f => f.lifeMs)
  const G = [0, 'E Engine-wide']
  add(...G, {
    id: 'E1', scene: `(all — ${s6.totalReactions} reactions in ${scenesWith.reactions} scenes)`, choice: '(every choice with reactions)',
    wrong: `Choice reactions are never readable. ConversationPanel.handleChoice sets them, but the "[choices]" reset effect (ConversationPanel.tsx:553-562) clears them in the same commit, because NarrativeScene builds a new choices array on every render (NarrativeScene.tsx:96-98). D2 measured ${d2Reaction.length} reaction elements living ${lifes.length ? `${Math.min(...lifes)}–${Math.max(...lifes)} ms` : 'n/a'}: they are inserted and removed before paint.`,
    fix: 'Key the reset effect on a stable signature (scene id + segment id + choice ids) instead of array identity, and stop it clearing activeReactions. Let the reaction timer own their lifetime. Alternatively memoize choices in NarrativeScene.',
    confidence: d2 ? 'high' : 'medium',
  })
  add(...G, {
    id: 'E2', scene: `(${s6.onTerminal.length} of ${s6.totalReactions} reactions)`, choice: '(terminal choices)',
    wrong: 'Even with E1 fixed, reactions on terminal choices cannot show: the strip renders only while !sceneDone (ConversationPanel.tsx:1228), and a terminal choice sets sceneDone=true in the same processChoice. These are the bulk of authored reactions.',
    fix: 'Render the reaction strip above the Continue line when sceneDone (and delay advanceReady until it has shown), or have terminal choices hold the scene open for the reaction beat.',
    confidence: 'high',
  })
  add(...G, {
    id: 'E3', scene: `(${s6.social.length} scenes: ${s6.social.map(s => s.scene).join(', ')})`, choice: `(${s6.social.reduce((a, s) => a + s.choices, 0)} interaction choices)`,
    wrong: 'socialInteractions never play. SocialEvent.tsx is imported nowhere: 9a27631 removed it from GameLayout and routed every scene through NarrativeScene, which reads only scene.choices. The 3 social_event scenes show 2–3 opening nodes and then the engine "Continue…". The 2 family scenes play only their top-level choices. AGENT_LOG Round 7 STEP 2 ("SocialEvent runs socialInteractions") is incorrect.',
    fix: 'Decide: re-mount SocialEvent for type social_event (its choice path applies flags and stats via addFlags/applyModifiers), or convert each interaction into a NarrativeScene segment hub. Correct the AGENT_LOG claim either way.',
    confidence: 'high',
  })
  const injected = (d1?.anomalies ?? []).filter(a => a.untraceable.some(u => u.why.startsWith('recurring injection')))
  if (injected.length) {
    add(...G, {
      id: 'E4', scene: [...new Set(injected.map(h => h.scene))].join(', '), choice: [...new Set(injected.map(h => h.choice))].join(', '),
      wrong: `After the first choice moves into a segment, NarrativeScene appends the dinner/briefing injected segments again (NarrativeScene.tsx:58-71 checks only the scene id). The player re-reads ${injected.reduce((a, h) => a + h.untraceable.length, 0)} injected node(s) they already saw (D1, ${injected.length} clicks).`,
      fix: 'Inject only while activeSegmentId is null (root narrative), or only into the hub segment that should carry it.',
      confidence: 'high',
    })
  }
  const ignored = s9.filter(x => x.notes.some(no => no.includes('IGNORED')))
  add(...G, {
    id: 'E5', scene: `(${s9.length} delayWeeks-0 chains)`, choice: '(see S9 rows)',
    wrong: `delayWeeks 0 triggers are injected unconditionally (narrativeStore.ts:475-498): trigger conditions and probability are ignored, and the target's prerequisites only matter through exclusive[]. ${ignored.length} chain(s) declare a probability or condition that never applies.`,
    fix: 'Evaluate trigger.conditions and probability before injectScene (and skip targets whose prerequisites fail), or drop the dead fields from the JSON.',
    confidence: 'high',
  })
  add(...G, {
    id: 'E6', scene: `(${s6.unrenderable.length} reactions, ${new Set(s6.unrenderable.map(u => u.scene)).size} scenes)`, choice: [...new Set(s6.unrenderable.map(u => u.choice))].join(', '),
    wrong: `Reaction types ${[...new Set(s6.unrenderable.map(u => u.type))].join('/')} have no render branch (only ${s6.renderable.join('/')} do), so they render as an empty row even after E1/E2.${d2 ? ` D2 confirms: ${d2.results.reduce((a, r) => a + (r.missing ?? []).filter(m => m.kind === 'reaction').length, 0)} reaction(s) on eligible clicks produced no text at all (not even a flash).` : ''}`,
    fix: 'Map them to existing types in JSON (approval→satisfied, disapproval/uncertain→concern, neutral/calculating→dialogue), or add a default branch.',
    confidence: 'high',
  })
  add(...G, {
    id: 'E7', scene: `(${s8.length} nextNodeId choices; ${s8.filter(x => x.gatedNodes).length} targets currently affected)`, choice: '(latent)',
    wrong: 'nextNodeId targets are used raw (narrativeStore.ts:636, 654): no filterNarrative, no `dialogue` normalisation, no prerequisites or exclusive[]. No current target has conditional nodes, so nothing is wrong today. But a per-node condition added to one would always render.',
    fix: 'Route nextNodeId through the same normalise + filterNarrative step loadScene uses. Until then, never add per-node conditions to nextNodeId targets.',
    confidence: 'medium',
  })
  add(...G, {
    id: 'E8', scene: `(${checked.gatedNodes} gated nodes checked)`, choice: '(latent)',
    wrong: `Segment narrative is filtered with the PRE-choice flags and stats (gameState/activeFlags captured at narrativeStore.ts:410 before applyModifiers). A node gated on the entering choice's own flag never shows. S7 found ${s7.filter(x => x.kind.includes('entering-choice')).length} such nodes today, and D1 found ${d1?.stats.suppressedClicks ?? 'n/a'} suppressed clicks.`,
    fix: 'Filter with newFlags and the post-modifier state, or document the rule for authors (gate on flags from EARLIER choices).',
    confidence: 'medium',
  })
}

function sharedTargetFindings(s2, add) {
  const seenTarget = new Set()
  for (const x of s2) {
    const k = `${x.scene}|${x.target}`
    if (seenTarget.has(k)) continue
    seenTarget.add(k)
    const pairs = s2.filter(y => `${y.scene}|${y.target}` === k)
    const choices = [...new Set(pairs.flatMap(p => [p.a, p.b]))]
    const stats = [...new Set(pairs.flatMap(p => p.opposite))]
    const reviewed = S2_REVIEWED[k]
    const hub = NEXT_QUESTION_HUB.test(x.target.split(':')[1])
    add(1, 'S2 Shared targets', {
      scene: `${x.scene} › ${x.list}`, choice: choices.join(', '),
      wrong: reviewed?.wrong ?? `${choices.length} choices reach ${x.target} with ${stats.length ? `opposite-signed ${stats.join(', ')}` : 'different flags'}${x.targetGatesOnDiff.length ? ` (target gates on ${x.targetGatesOnDiff.join(', ')})` : ''}; the shared reply cannot acknowledge which was picked.${hub ? ' Target reads as a neutral next-question/close beat.' : ''}`,
      fix: reviewed?.fix ?? (hub ? 'Probably fine as a neutral hub. Optionally add a one-line acknowledgement per choice (choice reactions, once E1/E2 are fixed).' : 'Read the target. If it presumes one answer, split per-choice reply segments that rejoin the hub.'),
      confidence: reviewed?.confidence ?? (hub ? 'low' : stats.length ? 'medium' : 'low'),
    })
  }
}

function routerFindings(s5, add) {
  for (const r of s5.routers) {
    const co = r.overlaps.filter(o => o.realistic)
    if (co.length) {
      add(4, 'S5 Routers', {
        scene: `${r.scene} › ${r.list}`, choice: [...new Set(co.flatMap(o => [o.a, o.b]))].join(', '),
        wrong: `Branches can be true together, e.g. ${co.slice(0, 3).map(o => `${o.a} [${o.gateA}] & ${o.b} [${o.gateB}]`).join('; ')}. The player then sees several identical-looking "(Continue)" options and picks a route blind.`,
        fix: 'Make the gates mutually exclusive (add !other_flag to all but one branch, in priority order) or collapse them into one branch whose segment uses per-node conditions.',
        confidence: 'medium',
      })
    }
    if (r.hole) {
      add(4, 'S5 Routers', {
        scene: `${r.scene} › ${r.list}`, choice: '(none visible)',
        wrong: `Under ${r.hole.flags.length ? `flags {${r.hole.flags.join(', ')}}` : 'no relevant flags set'} every branch is false, so ensureTerminalChoice shows the engine "Continue…" and the scene ends without its outcome.`,
        fix: 'Add an ungated fallback branch (last in the list) or confirm upstream that one branch flag is always set.',
        confidence: 'medium',
      })
    }
  }
  for (const r of s5.allGated.filter(x => x.hole)) {
    add(4, 'S5 Routers', {
      scene: `${r.scene} › ${r.list}`, choice: '(none visible)',
      wrong: `All ${r.n} choices are gated and some flag/stat state makes none visible (e.g. flags {${r.hole.flags.join(', ')}}), leaving only the engine "Continue…".`,
      fix: 'Add an ungated fallback choice.',
      confidence: 'low',
    })
  }
  for (const x of s5.shapes) {
    add(4, 'S5 Routers', { scene: x.where, choice: '—', wrong: `Unsupported condition shape: ${x.problem} (${x.cond})`, fix: 'Rewrite as {type:"flag",flag,value} or {stat,operator,value}.', confidence: 'high' })
  }
}

function extrasFindings(s6, add) {
  for (const x of s6.duplicated) {
    add(5, 'S6 Extras', {
      scene: `${x.scene} › ${x.list}`, choice: x.choices.join(', '),
      wrong: `Identical reaction reused on choices that set different flags: "${x.reaction}". It cannot fit both stances.`,
      fix: 'Write a stance-specific reaction per choice (after E1/E2 make reactions visible).',
      confidence: 'low',
    })
  }
  for (const x of s6.clashes) {
    add(5, 'S6 Extras', {
      scene: `${x.scene} › ${x.list}`, choice: x.choice,
      wrong: `Reaction wording leans opposite to the choice ("${x.clash[0]}" vs "${x.clash[1]}"): ${x.reaction}`,
      fix: 'Read; keyword heuristic only.',
      confidence: 'low',
    })
  }
  for (const x of s6.sceneLevel) {
    add(5, 'S6 Extras', {
      scene: x.scene, choice: '(scene-level)',
      wrong: `Scene has a top-level "reactions" array (${x.count}). NarrativeNode has no such field and nothing reads it.`,
      fix: 'Move the reactions onto the choices they belong to, or delete them.',
      confidence: 'high',
    })
  }
}

function d2Findings(d2, add) {
  for (const r of (d2?.results ?? [])) {
    const nonReaction = (r.missing ?? []).filter(m => m.kind !== 'reaction')
    const flashNonReaction = (r.flashOnly ?? []).filter(m => m.kind !== 'reaction')
    const broken = r.status !== 'MISMATCH' && r.status !== 'match'
    if (!nonReaction.length && !flashNonReaction.length && !(r.extra ?? []).length && !broken) continue
    add(10, 'D2 Display-only', {
      scene: r.scene, choice: r.choice,
      wrong: [
        broken ? r.status : '',
        nonReaction.length ? `predicted but not on screen: ${nonReaction.map(m => `${m.kind} "${trunc(m.text, 50)}"`).join('; ')}` : '',
        flashNonReaction.length ? `only flashed: ${flashNonReaction.map(m => `${m.kind} ${m.lifeMs}ms`).join(', ')}` : '',
        (r.extra ?? []).length ? `on screen but not predicted: ${r.extra.map(e => `"${trunc(e, 50)}"`).join('; ')}` : '',
      ].filter(Boolean).join(' | '),
      fix: 'Inspect with the D2 record (data/d2-results.json).',
      confidence: 'medium',
    })
  }
}

export function buildFindings(ctx) {
  const { s2, s3, s4, s7, s8, s9, d1 } = ctx
  const out = []
  const counters = {}
  const add = (group, groupName, f) => {
    const prefix = groupName.split(' ')[0]
    counters[prefix] = (counters[prefix] ?? 0) + 1
    out.push({ group, groupName, id: f.id ?? `${prefix}-${counters[prefix]}`, ...f })
  }

  engineFindings(ctx, add)
  sharedTargetFindings(s2, add)
  for (const x of s3) {
    add(2, 'S3 Name/intent', {
      scene: x.scene, choice: x.choice,
      wrong: `Keyword clash "${x.clash[0]}" (choice ${x.source}) vs "${x.clash[1]}" (target ${x.target}). Read: ${x.text}`,
      fix: 'Review only. The id/target agree on intent, so this is likely a false positive from negated wording ("Inform…", "I won\'t lie").',
      confidence: 'low',
    })
  }
  for (const x of s4.rows) {
    add(3, 'S4 Reaction attribution', {
      scene: x.scene, choice: x.choice,
      wrong: `Reaction by ${x.character} ("${x.text}") but ${x.character} is not in the scene's characters [${x.cast.join(', ')}]${x.character === 'colonel_dusek' ? '. Also not the roster id used elsewhere (irina_dusek)' : ''}.`,
      fix: `Add ${x.character === 'colonel_dusek' ? 'irina_dusek (and rename the reaction character)' : x.character} to the scene's characters, or reassign the reaction to someone present.`,
      confidence: 'high',
    })
  }
  routerFindings(ctx.s5, add)
  extrasFindings(ctx.s6, add)
  for (const x of s7) {
    add(6, 'S7 Node conditions vs routing', {
      scene: `${x.scene} › ${x.list}`, choice: x.choices.join(', ') || '—',
      wrong: `${x.nodeText}: ${x.kind} (${x.cond}) — ${x.why}.`,
      fix: x.kind === 'dead-choice-gate' ? 'Gate on a flag that is actually set (check the intended setter), or remove the gate.' : "Gate on a flag set by an earlier choice, or move the beat into the entering choice's own segment.",
      confidence: x.confidence,
    })
  }
  for (const x of s8.filter(y => y.verdict === 'FALSE at arrival' || y.verdict === 'MISSING target' || y.gatedNodes)) {
    add(7, 'S8 nextNodeId', { scene: x.scene, choice: x.choice, wrong: `${x.target}: ${x.verdict}; ${x.details.join('; ')}`, fix: 'See E7.', confidence: 'high' })
  }
  for (const x of s9.filter(y => y.notes.length)) {
    const dead = x.notes.some(no => no.includes('IGNORED'))
    add(8, 'S9 Immediate chains', {
      scene: x.scene, choice: x.choice,
      wrong: `→ ${x.target} plays ${x.when}. ${x.notes.join('; ')}.`,
      fix: dead ? 'Either honour the probability (E5) or remove it so the JSON says what the game does.' : 'Confirm the target should play even when its prerequisites are false, or gate the trigger (E5).',
      confidence: dead ? 'high' : 'medium',
    })
  }
  for (const u of (d1?.unclicked ?? []).filter(x => x.reason.startsWith('segment has no incoming'))) {
    add(9, 'D1 Unreachable', {
      scene: `${u.scene} › ${u.list}`, choice: u.choice,
      wrong: 'Segment has no incoming choice, so this option can never be shown (D1: unclicked under every flag set).',
      fix: 'Wire a choice to the segment or delete it (and its downstream-only segments).',
      confidence: 'high',
    })
  }
  d2Findings(ctx.d2, add)
  return out
}
