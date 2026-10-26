#!/usr/bin/env node
/**
 * Triage the DEAD and DECORATIVE scene-prerequisite findings from
 * check-decorative-prerequisites.mjs.
 *
 * PART 1 — split the DEAD scenes (never reachable via loadScene(), so their
 * prerequisites are never evaluated) by whether the SCENE ITSELF is reached
 * by anything at all (nextNodeId / chainTrigger) vs truly orphaned.
 *
 * PART 2 — risk-rank the DECORATIVE scenes (prerequisites evaluated via
 * loadScene(), but no working `exclusive` fallback, so a failure is
 * silently ignored) by whether the flag(s) they check are actually
 * guaranteed to be set by the time that scene's week window opens.
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
const sceneRegistry = new Map();
const sceneJson = new Map();
for (const file of walkFiles(NARRATIVE_DIR, ['.json'])) {
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (json?.id) {
    sceneRegistry.set(json.id, file);
    sceneJson.set(json.id, json);
  }
}

// ---------------------------------------------------------------------------
// agenda reachability + weekStore pool literals (same as before)
// ---------------------------------------------------------------------------
const agendaReachable = new Map();
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

const WEEKSTORE_FILE = path.join(ROOT, 'src', 'stores', 'weekStore.ts');
const weekStoreLiterals = new Set();
{
  const text = fs.readFileSync(WEEKSTORE_FILE, 'utf8');
  const re = /['"]([A-Za-z_][A-Za-z0-9_]*)['"]/g;
  let m;
  while ((m = re.exec(text))) if (sceneRegistry.has(m[1])) weekStoreLiterals.add(m[1]);
}
function reachesLoadScene(id) {
  return agendaReachable.has(id) || weekStoreLiterals.has(id);
}

// ---------------------------------------------------------------------------
// nextNodeId / chainTrigger.targetNodeId reachability, WITH per-choice detail
// (needed for both PART 1 reachability and PART 2 flag-setter analysis)
// ---------------------------------------------------------------------------
const chainOrNextReachable = new Map(); // targetId -> [source descriptions]
// flag -> [{ sceneId, choiceId, containerChoices (the array this choice lives in) }]
const flagSetters = new Map();

function addFlagSetter(flag, sceneId, choiceId, containerChoices) {
  if (!flagSetters.has(flag)) flagSetters.set(flag, []);
  flagSetters.get(flag).push({ sceneId, choiceId, containerChoices });
}
function addChainRef(targetId, label) {
  if (!chainOrNextReachable.has(targetId)) chainOrNextReachable.set(targetId, []);
  chainOrNextReachable.get(targetId).push(label);
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
      if (Array.isArray(c.flags)) {
        for (const f of c.flags) addFlagSetter(f, sceneId, c.id, choices);
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

function extractFlagFromCond(cond) {
  if (!cond || typeof cond !== 'object') return null;
  if (typeof cond.flag === 'string' && cond.flag) return cond.flag;
  if (typeof cond.stat === 'string' && cond.stat.startsWith('flags.')) return cond.stat.slice('flags.'.length);
  return null;
}

// ---------------------------------------------------------------------------
// recompute DEAD / DECORATIVE / FUNCTIONAL classification (same rule as
// check-decorative-prerequisites.mjs)
// ---------------------------------------------------------------------------
const dead = [];
const decorative = [];
for (const [sceneId, scene] of sceneJson) {
  if (!Array.isArray(scene.prerequisites) || scene.prerequisites.length === 0) continue;
  const canReachLoadScene = reachesLoadScene(sceneId);
  const exclusiveList = Array.isArray(scene.exclusive) ? scene.exclusive : [];
  const validExclusive = exclusiveList.filter((id) => id !== sceneId && sceneRegistry.has(id));
  if (!canReachLoadScene) dead.push(sceneId);
  else if (validExclusive.length === 0) decorative.push(sceneId);
}
dead.sort();
decorative.sort();

// ---------------------------------------------------------------------------
// load the EXISTING orphan list from audit-full-game-report.txt, as asked
// ---------------------------------------------------------------------------
const auditReportPath = path.join(ROOT, 'audit-full-game-report.txt');
const auditReportText = fs.readFileSync(auditReportPath, 'utf8');
const orphanSection = auditReportText.split('=== ORPHANED SCENES ===')[1]?.split('=== FLAG COVERAGE GAPS ===')[0] ?? '';
const orphanIdsFromReport = new Set(
  [...orphanSection.matchAll(/^\s{2}(\S+) \(/gm)].map((m) => m[1]),
);

// ---------------------------------------------------------------------------
// PART 1
// ---------------------------------------------------------------------------
const lines = [];
const push = (s = '') => lines.push(s);

push('=== PART 1 — DEAD scene triage (92 candidates) ===');
push('');
push('Method: for each DEAD scene (never reachable via loadScene(), so its');
push('prerequisites never evaluate), check whether the SCENE ITSELF is referenced');
push('anywhere via nextNodeId or chainTrigger.targetNodeId, and cross-check against');
push('the existing orphan list in audit-full-game-report.txt.');
push('');

const chainReachableList = [];
const trulyOrphanedList = [];

for (const sceneId of dead) {
  const file = rel(sceneRegistry.get(sceneId));
  const refs = chainOrNextReachable.get(sceneId) ?? [];
  const inOrphanReport = orphanIdsFromReport.has(sceneId);
  if (refs.length > 0) {
    chainReachableList.push({ sceneId, file, refs });
  } else {
    trulyOrphanedList.push({ sceneId, file, inOrphanReport });
  }
}

push(`CHAIN-REACHABLE (${chainReachableList.length}) — prerequisite is vestigial, scene itself is fine, no action needed:`);
for (const { sceneId, file, refs } of chainReachableList) {
  push(`  ${sceneId} (${file})`);
  for (const r of refs) push(`      <- ${r}`);
}
push('');

push(`TRULY-ORPHANED (${trulyOrphanedList.length}) — not referenced anywhere at all, same bug class as the 17 already fixed:`);
for (const { sceneId, file, inOrphanReport } of trulyOrphanedList) {
  push(`  ${sceneId} (${file}) — in existing orphan report: ${inOrphanReport ? 'YES' : 'NO (discrepancy — investigate)'}`);
}
push('');

// ---------------------------------------------------------------------------
// PART 2
// ---------------------------------------------------------------------------
push('=== PART 2 — DECORATIVE scene risk ranking (48 candidates) ===');
push('');
push('Method: for each flag a scene requires, find every choice anywhere in the game');
push('that sets it. A setter is "guaranteed" only if ALL of these hold:');
push('  (a) its containing scene is itself reachable (not dead/orphaned),');
push('  (b) its containing scene is isMandatory: true,');
push('  (c) the flag is set on EVERY choice in that same choice array (root or');
push('      segment) — i.e. not just one of several exclusive player decisions, and');
push('  (d) that scene\'s weekAvailable is strictly earlier than this scene\'s window.');
push('If at least one such guaranteed setter exists, risk is LOW. Otherwise HIGH —');
push('the flag could plausibly still be unset (scene skipped, or a different');
push('mutually-exclusive branch fired instead) when this scene\'s window opens.');
push('Caveat: this checks direct flag-setting choices only, not multi-hop chains');
push('across segments; treat LOW-RISK verdicts as "no risk found by this pass",');
push('not an absolute guarantee.');
push('');

const highRisk = [];
const lowRisk = [];

for (const sceneId of decorative) {
  const scene = sceneJson.get(sceneId);
  const file = rel(sceneRegistry.get(sceneId));
  const week = scene.weekAvailable ?? scene.week ?? null;
  const deadline = scene.weekDeadline ?? null;
  const flags = [...new Set(scene.prerequisites.map(extractFlagFromCond).filter(Boolean))];

  const flagAnalyses = [];
  let sceneIsLowRisk = flags.length > 0; // AND across all flags required

  for (const flag of flags) {
    const setters = flagSetters.get(flag) ?? [];
    let guaranteed = null; // the setter that proves low risk, if any
    for (const s of setters) {
      const setterScene = sceneJson.get(s.sceneId);
      if (!setterScene) continue;
      const setterReachable = reachesLoadScene(s.sceneId) || chainOrNextReachable.has(s.sceneId);
      const setterWeek = setterScene.weekAvailable ?? setterScene.week ?? null;
      const isMandatory = setterScene.isMandatory === true;
      const allChoicesSetFlag = s.containerChoices.every(
        (c) => Array.isArray(c.flags) && c.flags.includes(flag),
      );
      const earlyEnough = week != null && setterWeek != null && setterWeek < week;
      if (setterReachable && isMandatory && allChoicesSetFlag && earlyEnough) {
        guaranteed = { ...s, setterWeek };
        break;
      }
    }
    if (!guaranteed) sceneIsLowRisk = false;
    flagAnalyses.push({
      flag,
      setterCount: setters.length,
      setterSceneIds: [...new Set(setters.map((s) => s.sceneId))],
      guaranteed,
    });
  }

  const entry = { sceneId, file, week, deadline, flagAnalyses, prerequisites: scene.prerequisites };
  if (sceneIsLowRisk) lowRisk.push(entry);
  else highRisk.push(entry);
}

function printEntry(e) {
  push(`--- ${e.sceneId} (${e.file}) ---`);
  push(`  window: weekAvailable=${e.week} weekDeadline=${e.deadline}`);
  push(`  prerequisites: ${JSON.stringify(e.prerequisites)}`);
  for (const fa of e.flagAnalyses) {
    if (fa.setterCount === 0) {
      push(`  flag "${fa.flag}": NEVER SET BY ANY CHOICE IN THE GAME — this gate can never pass`);
    } else if (fa.guaranteed) {
      push(`  flag "${fa.flag}": guaranteed by ${fa.guaranteed.sceneId} (mandatory, week ${fa.guaranteed.setterWeek}, all choices set it)`);
    } else {
      push(`  flag "${fa.flag}": set only by ${fa.setterSceneIds.join(', ')} — optional and/or one of several exclusive outcomes, not guaranteed by this scene's window`);
    }
  }
  push('');
}

push(`HIGH RISK (${highRisk.length}) — contradiction genuinely possible:`);
for (const e of highRisk) printEntry(e);

push(`LOW RISK (${lowRisk.length}) — flag(s) always set in time in practice:`);
for (const e of lowRisk) printEntry(e);

push('=== TOTALS ===');
push(`Part 1 — CHAIN-REACHABLE: ${chainReachableList.length}, TRULY-ORPHANED: ${trulyOrphanedList.length} (of ${dead.length} DEAD)`);
push(`Part 2 — HIGH RISK: ${highRisk.length}, LOW RISK: ${lowRisk.length} (of ${decorative.length} DECORATIVE)`);

const report = lines.join('\n');
console.log(report);
fs.writeFileSync(path.join(ROOT, 'triage-prerequisites-report.txt'), report, 'utf8');
console.error('\n[triage] full report also written to triage-prerequisites-report.txt');
