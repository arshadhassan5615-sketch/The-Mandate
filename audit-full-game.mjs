#!/usr/bin/env node
/**
 * MANDATE — full game audit.
 * Scans every narrative scene JSON and every agenda JSON, cross-checks every
 * link type, and reports broken links, orphaned scenes, flag coverage gaps,
 * dead-end choices, and scenes missing a resolution beat.
 *
 * Read-only. Makes no edits to any project file.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const NARRATIVE_DIR = path.join(ROOT, 'src', 'data', 'narrative');
const AGENDA_DIR = path.join(ROOT, 'src', 'data', 'agenda');

const SPECIAL_SENTINEL_RE = /^__[a-z0-9_]+__$/i;

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function walkJsonFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkJsonFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.json')) out.push(full);
  }
  return out;
}

function rel(p) {
  return path.relative(ROOT, p).split(path.sep).join('/');
}

function isEmptyArr(a) {
  return !Array.isArray(a) || a.length === 0;
}

function readJson(file, errors) {
  try {
    let raw = fs.readFileSync(file, 'utf8');
    if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
    return JSON.parse(raw);
  } catch (e) {
    errors.push(`${rel(file)}: JSON parse error — ${e.message}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// 1. LOAD EVERYTHING
// ---------------------------------------------------------------------------

const parseErrors = [];

const narrativeFiles = walkJsonFiles(NARRATIVE_DIR).sort();
const agendaFiles = walkJsonFiles(AGENDA_DIR).sort();

const sceneRegistry = new Map(); // id -> file path
const sceneJson = new Map(); // id -> parsed json
const duplicateSceneIds = [];

for (const file of narrativeFiles) {
  const json = readJson(file, parseErrors);
  if (json == null) continue;
  if (typeof json.id !== 'string' || !json.id) {
    parseErrors.push(`${rel(file)}: missing top-level "id" field`);
    continue;
  }
  if (sceneRegistry.has(json.id)) {
    duplicateSceneIds.push(
      `"${json.id}" defined in both ${rel(sceneRegistry.get(json.id))} and ${rel(file)} (second definition ignored)`
    );
    continue;
  }
  sceneRegistry.set(json.id, file);
  sceneJson.set(json.id, json);
}

const agendaItemsAll = []; // { file, item }
let totalAgendaItems = 0;

for (const file of agendaFiles) {
  const json = readJson(file, parseErrors);
  if (json == null) continue;
  const items = Array.isArray(json) ? json : [json];
  for (const item of items) {
    totalAgendaItems++;
    agendaItemsAll.push({ file, item });
  }
}

// ---------------------------------------------------------------------------
// flag bookkeeping
// ---------------------------------------------------------------------------

const flagsSet = new Set(); // flags SET by any choice
const flagsRead = new Map(); // flag -> [location strings]

function addFlagRead(flag, location) {
  if (!flagsRead.has(flag)) flagsRead.set(flag, []);
  flagsRead.get(flag).push(location);
}

// Two condition shapes appear in the data:
//   { stat: "flags.some_flag", operator, value }
//   { flag: "some_flag", value, type: "flag" }
function extractFlagFromCond(cond) {
  if (!cond || typeof cond !== 'object') return null;
  if (typeof cond.flag === 'string' && cond.flag) return cond.flag;
  if (typeof cond.stat === 'string' && cond.stat.startsWith('flags.')) {
    return cond.stat.slice('flags.'.length);
  }
  return null;
}

// ---------------------------------------------------------------------------
// STAT-PATH GATE (Round 3 STEP 4 — permanent).
// Every `stat` path in conditions AND in stateChanges/statEffects must resolve
// via the real resolvers. Tables are parsed from source at runtime so the audit
// can never drift from the engine (single source of truth stays in the .ts):
//   conditions  -> PATH_ALIASES in src/engine/conditionEvaluator.ts
//   modifiers   -> PATH_ALIASES in src/stores/gameStore.ts (applyModifier)
//   both        -> STAT_RANGES keys in src/types/gameState.ts, plus the
//                  resolver built-ins currentWeek/currentAct and flags.*
//                  (conditions only — modifiers cannot write flags).
// A second permanent check asserts the two alias tables stay in sync: any
// alias the modifier table accepts but the condition table lacks is a latent
// runtime failure for conditions using that path.
// ---------------------------------------------------------------------------

function parseAliasTable(sourceFile, anchor) {
  const src = fs.readFileSync(path.join(ROOT, sourceFile), 'utf8');
  const body = src.split(anchor)[1].split('}')[0];
  const out = new Map();
  for (const m of body.matchAll(/'([^']+)'\s*:\s*'([^']+)'/g)) out.set(m[1], m[2]);
  if (out.size === 0) throw new Error(`[audit] failed to parse ${anchor} from ${sourceFile}`);
  return out;
}

function parseRangeKeys() {
  const src = fs.readFileSync(path.join(ROOT, 'src', 'types', 'gameState.ts'), 'utf8');
  const body = src.split('STAT_RANGES')[1].split('};')[0];
  const out = new Set();
  for (const m of body.matchAll(/'([^']+)'\s*:\s*\[/g)) out.add(m[1]);
  if (out.size === 0) throw new Error('[audit] failed to parse STAT_RANGES keys');
  return out;
}

const condAliases = parseAliasTable('src/engine/conditionEvaluator.ts', 'PATH_ALIASES');
const modAliases = parseAliasTable('src/stores/gameStore.ts', 'PATH_ALIASES');
const rangeKeys = parseRangeKeys();

function resolveCondStat(p) {
  const t = condAliases.get(p) ?? p;
  if (t === 'currentWeek' || t === 'currentAct') return true;
  if (t.startsWith('flags.')) return true;
  return rangeKeys.has(t);
}

function resolveModStat(p) {
  const t = modAliases.get(p) ?? p;
  if (t.startsWith('flags.')) return false; // modifiers cannot write flags
  return rangeKeys.has(t);
}

const statPathUses = []; // { path, location, kind: 'condition' | 'modifier' }

function collectCondStat(cond, location) {
  if (!cond || typeof cond !== 'object') return;
  if (typeof cond.stat === 'string' && cond.stat && !cond.stat.startsWith('flags.')) {
    statPathUses.push({ path: cond.stat, location, kind: 'condition' });
  }
}

function collectModStats(choice, location) {
  for (const key of ['stateChanges', 'statEffects']) {
    if (!Array.isArray(choice[key])) continue;
    for (const m of choice[key]) {
      if (m && typeof m.stat === 'string' && m.stat) {
        statPathUses.push({ path: m.stat, location: `${location} ${key}`, kind: 'modifier' });
      }
    }
  }
}

function scanConditionsArray(arr, location) {
  if (!Array.isArray(arr)) return;
  for (const cond of arr) {
    const flag = extractFlagFromCond(cond);
    if (flag) addFlagRead(flag, location);
    collectCondStat(cond, location);
  }
}

// ---------------------------------------------------------------------------
// 2/5/6/7. per-scene link, flag, dead-end, resolution-beat checks
// ---------------------------------------------------------------------------

const brokenLinks = [];
const orphanCandidateRefs = new Set(); // scene ids proven reachable
const deadEndChoices = [];
const missingResolution = [];

for (const [sceneId, scene] of sceneJson) {
  const file = rel(sceneRegistry.get(sceneId));
  const segmentKeys =
    scene.segments && typeof scene.segments === 'object'
      ? new Set(Object.keys(scene.segments))
      : null;

  // scene-level prerequisites / prerequisiteFlags -> flag reads
  scanConditionsArray(scene.prerequisites, `${sceneId} (${file}) scene.prerequisites`);
  if (Array.isArray(scene.prerequisiteFlags)) {
    for (const flag of scene.prerequisiteFlags) {
      if (typeof flag === 'string') addFlagRead(flag, `${sceneId} (${file}) scene.prerequisiteFlags`);
    }
  }

  // bonus scene-id reference checks (not in the original spec, but real fields
  // in this codebase that point at other scenes — worth validating too)
  if (Array.isArray(scene.prerequisiteSceneIds)) {
    for (const targetId of scene.prerequisiteSceneIds) {
      if (!sceneRegistry.has(targetId)) {
        brokenLinks.push(
          `[prerequisiteSceneIds] ${sceneId} (${file}) references missing scene "${targetId}"`
        );
      }
    }
  }
  if (Array.isArray(scene.exclusive)) {
    for (const targetId of scene.exclusive) {
      if (!sceneRegistry.has(targetId)) {
        brokenLinks.push(`[exclusive] ${sceneId} (${file}) references missing scene "${targetId}"`);
      }
    }
  }

  function processChoiceArray(choices, containerLabel) {
    if (!Array.isArray(choices)) return;
    for (const choice of choices) {
      const choiceLabel = `${sceneId}${containerLabel} choice "${choice.id ?? '?'}"`;

      // flags SET by this choice
      if (Array.isArray(choice.flags)) {
        for (const f of choice.flags) {
          if (typeof f === 'string') flagsSet.add(f);
        }
      }

      // STAT-PATH GATE: every stateChanges/statEffects stat must resolve
      collectModStats(choice, `${choiceLabel} (${file})`);

      // choice-level prerequisites/conditions -> flag reads
      scanConditionsArray(choice.prerequisites, `${choiceLabel} (${file}) choice.prerequisites`);
      scanConditionsArray(choice.conditions, `${choiceLabel} (${file}) choice.conditions`);

      // (a) nextSegment
      const hasNextSegment = 'nextSegment' in choice && choice.nextSegment != null;
      if (hasNextSegment) {
        if (!segmentKeys || !segmentKeys.has(choice.nextSegment)) {
          brokenLinks.push(
            `[nextSegment] ${choiceLabel} (${file}) -> "${choice.nextSegment}" not found in this scene's segments`
          );
        }
      }

      // (b) nextNodeId
      const hasNextNodeId = typeof choice.nextNodeId === 'string' && choice.nextNodeId.length > 0;
      if (hasNextNodeId) {
        if (!sceneRegistry.has(choice.nextNodeId)) {
          brokenLinks.push(
            `[nextNodeId] ${choiceLabel} (${file}) -> "${choice.nextNodeId}" not found in scene registry`
          );
        } else {
          orphanCandidateRefs.add(choice.nextNodeId);
        }
      }

      // (c) chainTriggers[].targetNodeId (+ nested conditions)
      if (Array.isArray(choice.chainTriggers)) {
        for (const ct of choice.chainTriggers) {
          if (typeof ct.targetNodeId === 'string' && ct.targetNodeId.length > 0) {
            if (!sceneRegistry.has(ct.targetNodeId)) {
              brokenLinks.push(
                `[chainTrigger] ${choiceLabel} (${file}) -> targetNodeId "${ct.targetNodeId}" not found in scene registry`
              );
            } else {
              orphanCandidateRefs.add(ct.targetNodeId);
            }
          }
          scanConditionsArray(ct.conditions, `${choiceLabel} (${file}) chainTrigger.conditions`);
        }
      }

      // (6) dead-end choice: no nextSegment, no nextNodeId, no flags, no stateChanges/statEffects
      const noFlags = isEmptyArr(choice.flags);
      const noState = isEmptyArr(choice.stateChanges) && isEmptyArr(choice.statEffects);
      if (!hasNextSegment && !hasNextNodeId && noFlags && noState) {
        deadEndChoices.push(
          `${choiceLabel} (${file}) — text: "${choice.text ?? ''}" — no nextSegment/nextNodeId, no flags, no stateChanges/statEffects`
        );
      }
    }
  }

  processChoiceArray(scene.choices, ' [root]');
  if (segmentKeys) {
    for (const segKey of segmentKeys) {
      processChoiceArray(scene.segments[segKey].choices, ` [segment:${segKey}]`);
    }
  }

  // (7) missing resolution beat
  if (segmentKeys) {
    const destinationSegments = new Set();
    const collectDest = (choices) => {
      if (!Array.isArray(choices)) return;
      for (const c of choices) {
        if (typeof c.nextSegment === 'string' && segmentKeys.has(c.nextSegment)) {
          destinationSegments.add(c.nextSegment);
        }
      }
    };
    collectDest(scene.choices);
    for (const segKey of segmentKeys) collectDest(scene.segments[segKey].choices);

    for (const segKey of destinationSegments) {
      const seg = scene.segments[segKey];
      const narrLen = Array.isArray(seg.narrative) ? seg.narrative.length : 0;
      const choices = Array.isArray(seg.choices) ? seg.choices : [];
      if (choices.length === 1 && narrLen < 2) {
        const only = choices[0];
        const endsImmediately =
          only.nextSegment == null && !(typeof only.nextNodeId === 'string' && only.nextNodeId);
        const textNorm = (only.text || '').replace(/[."'“”()]/g, '').trim().toLowerCase();
        const looksGeneric =
          textNorm === 'continue' ||
          /^continue\b/.test(textNorm) ||
          (isEmptyArr(only.flags) && isEmptyArr(only.stateChanges) && isEmptyArr(only.statEffects));
        if (endsImmediately && looksGeneric) {
          missingResolution.push(
            `${sceneId} (${file}) segment "${segKey}" — reached via nextSegment, has ${narrLen} narrative node(s) and a single close-out choice: "${only.text}"`
          );
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 3. agenda references
// ---------------------------------------------------------------------------

const agendaBroken = [];
const agendaSpecialRefs = [];

for (const { file, item } of agendaItemsAll) {
  if (!item || typeof item !== 'object') continue;

  scanConditionsArray(item.prerequisites, `${rel(file)} item "${item.id ?? '?'}" agenda.prerequisites`);

  const sceneId = item.sceneId;
  if (typeof sceneId !== 'string' || !sceneId) continue;

  if (sceneRegistry.has(sceneId)) {
    orphanCandidateRefs.add(sceneId);
    continue;
  }
  if (SPECIAL_SENTINEL_RE.test(sceneId)) {
    agendaSpecialRefs.push(
      `${rel(file)} item "${item.id}" -> "${sceneId}" (synthetic UI phase handled directly in weekStore.ts — not a narrative scene, not a broken link)`
    );
    continue;
  }
  agendaBroken.push(`${rel(file)} item "${item.id}" -> sceneId "${sceneId}" NOT FOUND in scene registry`);
}

// ---------------------------------------------------------------------------
// 3.55. voteConfig flag sets (new flag-SET source)
//
// Some flags are never set via a narrative choice's `flags: [...]` array —
// they're set dynamically when a synthetic `__vote__` node resolves, via
// `voteConfig.successFlags` / `voteConfig.failureFlags`. These configs show
// up in two places: literal objects inside `src/data/agenda/*.json` agenda
// items (already parsed as real JSON above), and literal objects inside the
// `make*VoteItem()` factories in `src/stores/weekStore.ts` (TS source, so
// scanned by regex like the store scene-reference scan below). Without this,
// every flag set only this way is a false-positive "flag coverage gap".
// ---------------------------------------------------------------------------

const voteConfigFlagHits = new Map(); // flag -> Set of location strings

function addVoteConfigFlag(flag, location) {
  flagsSet.add(flag);
  if (!voteConfigFlagHits.has(flag)) voteConfigFlagHits.set(flag, new Set());
  voteConfigFlagHits.get(flag).add(location);
}

// (a) agenda JSON voteConfig blocks
for (const { file, item } of agendaItemsAll) {
  if (!item || typeof item !== 'object') continue;
  const vc = item.voteConfig;
  if (!vc || typeof vc !== 'object') continue;
  for (const key of ['successFlags', 'failureFlags']) {
    if (Array.isArray(vc[key])) {
      for (const f of vc[key]) {
        if (typeof f === 'string') addVoteConfigFlag(f, `${rel(file)} item "${item.id ?? '?'}" voteConfig.${key}`);
      }
    }
  }
}

// (b) weekStore.ts voteConfig literals (e.g. makeNoConfidenceVoteItem,
// makeImpeachmentVoteItem) — matches `successFlags: [...]` / `failureFlags:
// [...]` and pulls the quoted string literals out of the bracket contents.
const WEEKSTORE_FILE = path.join(ROOT, 'src', 'stores', 'weekStore.ts');
if (fs.existsSync(WEEKSTORE_FILE)) {
  const weekStoreText = fs.readFileSync(WEEKSTORE_FILE, 'utf8');
  const VOTE_FLAG_ARRAY_RE = /(successFlags|failureFlags)\s*:\s*\[([^\]]*)\]/g;
  let vm;
  while ((vm = VOTE_FLAG_ARRAY_RE.exec(weekStoreText))) {
    const key = vm[1];
    const arrBody = vm[2];
    const STR_RE = /['"]([A-Za-z_][A-Za-z0-9_]*)['"]/g;
    let sm;
    while ((sm = STR_RE.exec(arrBody))) {
      addVoteConfigFlag(sm[1], `${rel(WEEKSTORE_FILE)} voteConfig.${key}`);
    }
  }
}

// ---------------------------------------------------------------------------
// 3.5. hardcoded scene references in store files
//
// Some scenes are never listed in a static agenda JSON file — they're pushed
// into the week queue programmatically (e.g. weekStore.ts builds dynamic
// "pools" of sceneId literals for family/mole/shadow-hawk/voss arcs). Without
// scanning for these, every one of those scenes shows up as a false-positive
// orphan. This is a new reference category alongside agenda/nextNodeId/
// chainTrigger.
// ---------------------------------------------------------------------------

function walkFilesByExt(dir, exts) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFilesByExt(full, exts));
    else if (exts.some((e) => entry.name.endsWith(e))) out.push(full);
  }
  return out;
}

const STORE_ENGINES_DIR = path.join(ROOT, 'src', 'stores', 'engines');
const STORE_FILES_TO_SCAN = [
  path.join(ROOT, 'src', 'stores', 'weekStore.ts'),
  path.join(ROOT, 'src', 'stores', 'gameStore.ts'),
  path.join(ROOT, 'src', 'stores', 'letterStore.ts'),
  path.join(ROOT, 'src', 'stores', 'newsStore.ts'),
  path.join(ROOT, 'src', 'stores', 'narrativeStore.ts'),
];

const storeScanFilesFound = [];
const storeScanFilesSkipped = [];
for (const f of STORE_FILES_TO_SCAN) {
  if (fs.existsSync(f)) storeScanFilesFound.push(f);
  else storeScanFilesSkipped.push(`${rel(f)} (file does not exist)`);
}
if (fs.existsSync(STORE_ENGINES_DIR) && fs.statSync(STORE_ENGINES_DIR).isDirectory()) {
  storeScanFilesFound.push(...walkFilesByExt(STORE_ENGINES_DIR, ['.ts', '.tsx']));
} else {
  storeScanFilesSkipped.push(`${rel(STORE_ENGINES_DIR)}/ (directory does not exist)`);
}

// One regex covers both the requested shapes: it matches `sceneId: 'x'` /
// `sceneId: "x"` (since that's just a quoted literal preceded by the key)
// AND any other bare quoted string literal. Every hit is then checked
// against the real scene registry, so an unrelated string that happens to
// share the snake_case shape (e.g. "security_rating", a stat name, not a
// scene) can never be mistaken for a scene reference — it simply won't be
// in the registry and gets silently dropped.
const STRING_LITERAL_RE = /['"]([A-Za-z_][A-Za-z0-9_]*)['"]/g;

const storeSceneRefHits = new Map(); // sceneId -> Set of file rel paths

for (const file of storeScanFilesFound) {
  const text = fs.readFileSync(file, 'utf8');
  STRING_LITERAL_RE.lastIndex = 0;
  let m;
  while ((m = STRING_LITERAL_RE.exec(text))) {
    const literal = m[1];
    if (sceneRegistry.has(literal)) {
      orphanCandidateRefs.add(literal);
      if (!storeSceneRefHits.has(literal)) storeSceneRefHits.set(literal, new Set());
      storeSceneRefHits.get(literal).add(rel(file));
    }
  }
}

// ---------------------------------------------------------------------------
// 4. orphaned scenes
// ---------------------------------------------------------------------------

const orphanScenes = [];
for (const [id, file] of sceneRegistry) {
  if (!orphanCandidateRefs.has(id)) {
    orphanScenes.push(`${id} (${rel(file)})`);
  }
}
orphanScenes.sort();

// ---------------------------------------------------------------------------
// 5. flag coverage gaps
// ---------------------------------------------------------------------------

const flagGaps = [...flagsRead.keys()].filter((f) => !flagsSet.has(f)).sort();

// ---------------------------------------------------------------------------
// output
// ---------------------------------------------------------------------------

const lines = [];
const push = (s = '') => lines.push(s);

push('METHODOLOGY NOTES (read this before the report):');
push('- Flag SETs are collected from every choice `flags: [...]` array.');
push('- Flag READs are collected from `prerequisites`/`conditions` wherever they appear (scene-level,');
push('  choice-level, chainTrigger-level) AND from scene-level `prerequisiteFlags`. Two condition shapes');
push('  exist in this codebase and both are handled: {stat:"flags.x",...} and {flag:"x",...}.');
push('- "stateChanges" in the spec covers both field names actually used in the data: `stateChanges` and');
push('  `statEffects` — both are treated as equivalent for dead-end detection.');
push('- Agenda sceneIds "__budget__", "__vote__", "__constitution__", "__cabinet_reshuffle__" are synthetic');
push('  sentinels handled directly in weekStore.ts (open a UI phase, not a narrative scene). They are NOT');
push('  counted as broken links; listed separately below for transparency.');
push('- `__project__*` sceneIds ARE real scenes (src/data/narrative/projects/) and resolve normally.');
push('- Bonus checks beyond the original spec: scene-level `prerequisiteSceneIds` and `exclusive` arrays');
push('  are also scene-id references in this codebase, and are validated under BROKEN LINKS.');
push('- New reference category: hardcoded scene-id string literals in store files (weekStore.ts builds');
push('  dynamic scene pools not listed in any static agenda JSON). These count toward orphan reachability');
push('  the same as agenda/nextNodeId/chainTrigger. See STORE FILE SCENE REFERENCES below.');
push('- New flag-SET source: `voteConfig.successFlags`/`failureFlags` in src/data/agenda/*.json items and');
push('  in the make*VoteItem() factories inside src/stores/weekStore.ts. These flags are set dynamically');
push('  when a synthetic __vote__ node resolves, not via a choice.flags array. See VOTE CONFIG FLAG SETS below.');
push('');

push('=== REGISTRY ===');
push(`Total scenes: ${sceneRegistry.size}`);
push(`Total agenda files: ${agendaFiles.length}`);
push(`Total agenda items: ${totalAgendaItems}`);
push(`Parse errors: ${parseErrors.length}`);
push(`Duplicate scene IDs: ${duplicateSceneIds.length}`);
if (parseErrors.length) {
  push('');
  push('-- parse errors --');
  for (const e of parseErrors) push('  ' + e);
}
if (duplicateSceneIds.length) {
  push('');
  push('-- duplicate scene ids --');
  for (const d of duplicateSceneIds) push('  ' + d);
}
push('');

push('=== BROKEN LINKS ===');
if (brokenLinks.length === 0) push('(none)');
else for (const b of brokenLinks) push('  ' + b);
push('');
push('-- agenda sceneId broken links --');
if (agendaBroken.length === 0) push('(none)');
else for (const a of agendaBroken) push('  ' + a);
push('');
push('-- agenda sceneId synthetic/special refs (not scenes, not broken) --');
if (agendaSpecialRefs.length === 0) push('(none)');
else for (const a of agendaSpecialRefs) push('  ' + a);
push('');

push('=== STORE FILE SCENE REFERENCES (new reference category) ===');
push('Files scanned:');
for (const f of storeScanFilesFound) push('  ' + rel(f));
if (storeScanFilesSkipped.length) {
  push('Not present (skipped):');
  for (const s of storeScanFilesSkipped) push('  ' + s);
}
push(`Distinct scene IDs found referenced via hardcoded string literals: ${storeSceneRefHits.size}`);
for (const [id, files] of [...storeSceneRefHits.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  push(`  "${id}" — referenced in: ${[...files].join(', ')}`);
}
push('');

push('=== VOTE CONFIG FLAG SETS (new flag-set source) ===');
push(`Distinct flags found set via voteConfig.successFlags/failureFlags: ${voteConfigFlagHits.size}`);
for (const [flag, locs] of [...voteConfigFlagHits.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  push(`  "${flag}" — set in: ${[...locs].join(', ')}`);
}
push('');

push('=== ORPHANED SCENES ===');
if (orphanScenes.length === 0) push('(none)');
else for (const o of orphanScenes) push('  ' + o);
push('');

push('=== FLAG COVERAGE GAPS ===');
if (flagGaps.length === 0) push('(none)');
else {
  for (const flag of flagGaps) {
    push(`  "${flag}" — read but never set. Read at:`);
    for (const loc of flagsRead.get(flag)) push('      ' + loc);
  }
}
push('');

push('=== DEAD-END CHOICES ===');
if (deadEndChoices.length === 0) push('(none)');
else for (const d of deadEndChoices) push('  ' + d);
push('');

push('=== SCENES MISSING RESOLUTION BEATS ===');
if (missingResolution.length === 0) push('(none)');
else for (const m of missingResolution) push('  ' + m);
push('');

push('=== UNRESOLVABLE STAT PATHS (permanent gate — Round 3 STEP 4) ===');
push(`Conditions checked against conditionEvaluator PATH_ALIASES (${condAliases.size} entries);`);
push(`modifiers checked against gameStore PATH_ALIASES (${modAliases.size} entries);`);
push(`both checked against STAT_RANGES (${rangeKeys.size} keys) + currentWeek/currentAct.`);
const driftedAliases = [...modAliases.keys()].filter((k) => !condAliases.has(k)).sort();
if (driftedAliases.length) {
  push(`Alias-table drift (accepted by modifiers, missing for conditions): ${driftedAliases.length}`);
  for (const k of driftedAliases) push(`  "${k}" -> "${modAliases.get(k)}" (conditions using this path fail at runtime)`);
} else {
  push('Alias tables in sync.');
}
const badStats = statPathUses.filter(
  (u) => !(u.kind === 'condition' ? resolveCondStat(u.path) : resolveModStat(u.path))
);
if (badStats.length === 0) push('(none)');
else for (const u of badStats) push(`  [${u.kind}] "${u.path}" — ${u.location}`);
push('');

push('=== TOTALS ===');
push(`Broken links: ${brokenLinks.length + agendaBroken.length}`);
push(`Orphaned scenes: ${orphanScenes.length}`);
push(`Flag gaps: ${flagGaps.length}`);
push(`Dead-end choices: ${deadEndChoices.length}`);
push(`Missing resolution beats: ${missingResolution.length}`);
push(`Unresolvable stat paths: ${badStats.length}`);
push(`Drifted aliases: ${driftedAliases.length}`);

const report = lines.join('\n');
console.log(report);

const outFile = path.join(ROOT, 'audit-full-game-report.txt');
fs.writeFileSync(outFile, report, 'utf8');
console.error(`\n[audit] full report also written to ${rel(outFile)}`);
