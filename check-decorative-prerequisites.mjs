#!/usr/bin/env node
/**
 * Scope check: which scenes have a non-empty top-level `prerequisites`
 * array that never actually gates anything?
 *
 * Ground truth from reading the engine (see report):
 *   - scene.prerequisites is read in exactly ONE place: narrativeStore.ts's
 *     loadScene(id). On failure it walks scene.exclusive looking for a
 *     passing alternative; with no exclusive (or no passing alternative),
 *     the failure is silently ignored and the original scene renders anyway.
 *   - loadScene() is called ONLY from weekStore.ts, ONLY with an
 *     agenda-sourced sceneId (static agenda JSON, or a weekStore.ts
 *     hardcoded pool literal — both go through the same queue -> loadScene
 *     path).
 *   - nextNodeId (processChoice) and chainTrigger.targetNodeId (chainStore)
 *     BOTH call getScene() directly, bypassing loadScene() and therefore
 *     bypassing scene.prerequisites entirely, unconditionally, regardless
 *     of exclusive.
 *
 * So a scene's prerequisites are:
 *   DEAD        — scene.id never appears as an agenda sceneId anywhere
 *                 (static JSON or weekStore.ts pool literal) -> loadScene()
 *                 is never called with this id -> prerequisites are never
 *                 even evaluated.
 *   DECORATIVE  — scene.id DOES appear as an agenda sceneId (so
 *                 prerequisites ARE evaluated), but scene.exclusive is
 *                 empty or has no valid alternative -> a failing check has
 *                 no effect; the scene renders regardless.
 *   FUNCTIONAL  — scene.id appears as an agenda sceneId AND scene.exclusive
 *                 has at least one alternative that resolves to a real,
 *                 different scene -> a failing check actually redirects.
 *
 * Read-only. Makes no edits.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const NARRATIVE_DIR = path.join(ROOT, 'src', 'data', 'narrative');
const AGENDA_DIR = path.join(ROOT, 'src', 'data', 'agenda');

function walkFiles(dir, exts) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full, exts));
    else if (exts.some((e) => entry.name.endsWith(e))) out.push(full);
  }
  return out;
}
function rel(p) {
  return path.relative(ROOT, p).split(path.sep).join('/');
}

// ---------------------------------------------------------------------------
// load scene registry
// ---------------------------------------------------------------------------
const sceneRegistry = new Map(); // id -> file
const sceneJson = new Map();     // id -> parsed

for (const file of walkFiles(NARRATIVE_DIR, ['.json'])) {
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (json?.id) {
    sceneRegistry.set(json.id, file);
    sceneJson.set(json.id, json);
  }
}

// ---------------------------------------------------------------------------
// agenda-reachable sceneIds (static JSON files)
// ---------------------------------------------------------------------------
const agendaReachable = new Map(); // sceneId -> [agenda item ids]

for (const file of walkFiles(AGENDA_DIR, ['.json'])) {
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  const items = Array.isArray(json) ? json : [json];
  for (const item of items) {
    if (item?.sceneId) {
      if (!agendaReachable.has(item.sceneId)) agendaReachable.set(item.sceneId, []);
      agendaReachable.get(item.sceneId).push(`${item.id} (${rel(file)})`);
    }
  }
}

// ---------------------------------------------------------------------------
// weekStore.ts hardcoded pool literals — these ALSO reach loadScene(), same
// as static agenda JSON (see FIX 2 finding from the earlier audit session)
// ---------------------------------------------------------------------------
const WEEKSTORE_FILE = path.join(ROOT, 'src', 'stores', 'weekStore.ts');
const weekStoreLiterals = new Set();
{
  const text = fs.readFileSync(WEEKSTORE_FILE, 'utf8');
  const re = /['"]([A-Za-z_][A-Za-z0-9_]*)['"]/g;
  let m;
  while ((m = re.exec(text))) {
    if (sceneRegistry.has(m[1])) weekStoreLiterals.add(m[1]);
  }
}

function reachesLoadScene(id) {
  return agendaReachable.has(id) || weekStoreLiterals.has(id);
}

// ---------------------------------------------------------------------------
// nextNodeId / chainTrigger.targetNodeId reachability (informational only —
// per the engine reading above, this path NEVER evaluates prerequisites,
// so it does not make a gate "more functional")
// ---------------------------------------------------------------------------
const chainOrNextReachable = new Map(); // sceneId -> [source descriptions]

function addChainRef(targetId, sourceLabel) {
  if (!chainOrNextReachable.has(targetId)) chainOrNextReachable.set(targetId, []);
  chainOrNextReachable.get(targetId).push(sourceLabel);
}

for (const [sceneId, scene] of sceneJson) {
  const file = rel(sceneRegistry.get(sceneId));
  const scan = (choices, label) => {
    if (!Array.isArray(choices)) return;
    for (const c of choices) {
      if (typeof c.nextNodeId === 'string' && c.nextNodeId) {
        addChainRef(c.nextNodeId, `nextNodeId from ${sceneId}${label} choice "${c.id}" (${file})`);
      }
      if (Array.isArray(c.chainTriggers)) {
        for (const ct of c.chainTriggers) {
          if (typeof ct.targetNodeId === 'string' && ct.targetNodeId) {
            addChainRef(ct.targetNodeId, `chainTrigger from ${sceneId}${label} choice "${c.id}" (${file})`);
          }
        }
      }
    }
  };
  scan(scene.choices, ' [root]');
  if (scene.segments) {
    for (const segKey of Object.keys(scene.segments)) {
      scan(scene.segments[segKey].choices, ` [segment:${segKey}]`);
    }
  }
}

// ---------------------------------------------------------------------------
// find every scene with a non-empty top-level "prerequisites" array
// ---------------------------------------------------------------------------
const candidates = [];
for (const [sceneId, scene] of sceneJson) {
  if (Array.isArray(scene.prerequisites) && scene.prerequisites.length > 0) {
    candidates.push(sceneId);
  }
}
candidates.sort();

const lines = [];
const push = (s = '') => lines.push(s);

push('=== SCOPE CHECK: scene-level "prerequisites" arrays and whether they ever run ===');
push('');
push('Ground truth (read from the engine, not assumed):');
push('  - scene.prerequisites is evaluated ONLY inside narrativeStore.ts loadScene().');
push('  - loadScene() is called ONLY from weekStore.ts, ONLY with an agenda-sourced');
push('    sceneId (static agenda/*.json OR a weekStore.ts hardcoded pool literal).');
push('  - nextNodeId (processChoice) and chainTrigger.targetNodeId (chainStore) both');
push('    call getScene() directly — bypassing loadScene() and scene.prerequisites');
push('    ENTIRELY, unconditionally, regardless of an exclusive array. This is the');
push('    opposite of "chain/nextNodeId respects the exclusive fallback" — it never');
push('    even looks at prerequisites or exclusive.');
push('  - Even when loadScene() DOES evaluate prerequisites and they fail, the check');
push('    only has an effect if scene.exclusive has an alternative that passes; with');
push('    no exclusive (or none valid), the failure is silently ignored and the scene');
push('    renders anyway.');
push('');
push(`Total scenes with non-empty top-level "prerequisites": ${candidates.length}`);
push('');

const counts = { DEAD: 0, DECORATIVE: 0, FUNCTIONAL: 0 };

for (const sceneId of candidates) {
  const scene = sceneJson.get(sceneId);
  const file = rel(sceneRegistry.get(sceneId));
  const viaAgenda = agendaReachable.get(sceneId) ?? [];
  const viaWeekStorePool = weekStoreLiterals.has(sceneId);
  const viaChainOrNext = chainOrNextReachable.get(sceneId) ?? [];
  const canReachLoadScene = reachesLoadScene(sceneId);

  const exclusiveList = Array.isArray(scene.exclusive) ? scene.exclusive : [];
  const validExclusive = exclusiveList.filter(
    (id) => id !== sceneId && sceneRegistry.has(id),
  );

  let verdict;
  if (!canReachLoadScene) {
    verdict = 'DEAD (never evaluated — scene.id is never an agenda sceneId or weekStore pool literal, so loadScene() is never called with it)';
    counts.DEAD++;
  } else if (validExclusive.length === 0) {
    verdict = 'DECORATIVE (evaluated via loadScene(), but no valid exclusive alternative — a failure is silently ignored and the scene renders anyway)';
    counts.DECORATIVE++;
  } else {
    verdict = `FUNCTIONAL (evaluated via loadScene(); on failure redirects to one of: ${validExclusive.join(', ')})`;
    counts.FUNCTIONAL++;
  }

  push(`--- ${sceneId} (${file}) ---`);
  push(`  prerequisites: ${JSON.stringify(scene.prerequisites)}`);
  push(`  reachable via static agenda JSON: ${viaAgenda.length ? 'YES — ' + viaAgenda.join('; ') : 'no'}`);
  push(`  reachable via weekStore.ts pool literal: ${viaWeekStorePool ? 'YES' : 'no'}`);
  push(`  reachable via nextNodeId/chainTrigger (informational — never gated on this path): ${viaChainOrNext.length ? 'YES — ' + viaChainOrNext.join('; ') : 'no'}`);
  push(`  scene.exclusive: ${exclusiveList.length ? JSON.stringify(exclusiveList) : '(none)'}`);
  push(`  VERDICT: ${verdict}`);
  push('');
}

push('=== TOTALS ===');
push(`Dead (never evaluated):              ${counts.DEAD}`);
push(`Decorative (evaluated, no effect):   ${counts.DECORATIVE}`);
push(`Functional (evaluated, redirects):   ${counts.FUNCTIONAL}`);
push(`Total scenes with prerequisites:     ${candidates.length}`);

const report = lines.join('\n');
console.log(report);
fs.writeFileSync(path.join(ROOT, 'decorative-prerequisites-report.txt'), report, 'utf8');
console.error('\n[check] full report also written to decorative-prerequisites-report.txt');
