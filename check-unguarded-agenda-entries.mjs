#!/usr/bin/env node
/**
 * MANDATE — unguarded-agenda-entry scan.
 *
 * Finds every agenda entry whose target scene has a top-level "prerequisites"
 * array, where the agenda entry itself has no "prerequisites" field (or an
 * empty one). This is the bug class fixed twice this session: the agenda
 * pool can offer/schedule the scene before its narrative precondition is
 * actually true, and loadScene()'s "exclusive" fallback only substitutes an
 * alternative scene when the ORIGINAL scene declares an "exclusive" array —
 * if it doesn't, the scene loads anyway with failing prerequisites.
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
// 1. Load every scene's own top-level prerequisites
// ---------------------------------------------------------------------------

const parseErrors = [];
const narrativeFiles = walkJsonFiles(NARRATIVE_DIR).sort();
const sceneRegistry = new Map(); // id -> file path
const scenePrereqs = new Map(); // id -> prerequisites array
const sceneExclusive = new Map(); // id -> exclusive array

for (const file of narrativeFiles) {
  const json = readJson(file, parseErrors);
  if (json == null) continue;
  if (typeof json.id !== 'string' || !json.id) continue;
  if (sceneRegistry.has(json.id)) continue; // duplicates handled by audit-full-game.mjs
  sceneRegistry.set(json.id, file);
  scenePrereqs.set(json.id, Array.isArray(json.prerequisites) ? json.prerequisites : []);
  sceneExclusive.set(json.id, Array.isArray(json.exclusive) ? json.exclusive : []);
}

// ---------------------------------------------------------------------------
// 2. Walk every agenda item, compare its own prerequisites against its
//    target scene's prerequisites
// ---------------------------------------------------------------------------

const agendaFiles = walkJsonFiles(AGENDA_DIR).sort();
const matches = [];
let totalAgendaItems = 0;
let itemsWithSceneTarget = 0;
let itemsSkippedSentinel = 0;
let itemsSkippedMissingScene = 0;

for (const file of agendaFiles) {
  const json = readJson(file, parseErrors);
  if (json == null) continue;
  const items = Array.isArray(json) ? json : [json];
  for (const item of items) {
    totalAgendaItems++;
    if (!item || typeof item !== 'object') continue;
    const sceneId = item.sceneId;
    if (typeof sceneId !== 'string' || !sceneId) continue;
    if (SPECIAL_SENTINEL_RE.test(sceneId)) {
      itemsSkippedSentinel++;
      continue;
    }
    if (!sceneRegistry.has(sceneId)) {
      itemsSkippedMissingScene++;
      continue; // broken link, not our concern here — audit-full-game.mjs catches this
    }
    itemsWithSceneTarget++;

    const scenePrereq = scenePrereqs.get(sceneId);
    if (isEmptyArr(scenePrereq)) continue; // target scene has no gate at all — nothing to miss

    const itemPrereq = Array.isArray(item.prerequisites) ? item.prerequisites : [];
    if (!isEmptyArr(itemPrereq)) continue; // agenda item already gates — fine

    // Target scene has a real prerequisite; agenda entry has none.
    const exclusiveList = sceneExclusive.get(sceneId);
    matches.push({
      agendaFile: rel(file),
      itemId: item.id ?? '?',
      sceneId,
      sceneFile: rel(sceneRegistry.get(sceneId)),
      scenePrereq,
      hasExclusiveFallback: exclusiveList.length > 0,
      exclusiveList,
      weekAvailable: item.weekAvailable,
      weekDeadline: item.weekDeadline,
    });
  }
}

// ---------------------------------------------------------------------------
// output
// ---------------------------------------------------------------------------

const lines = [];
const push = (s = '') => lines.push(s);

push('=== UNGUARDED-AGENDA-ENTRY SCAN ===');
push('Finds agenda entries whose target scene has real "prerequisites" but the');
push('agenda entry itself has none — the scene could be offered/scheduled before');
push('its narrative precondition is true. loadScene() only substitutes an');
push('"exclusive" alternative when the scene declares one; without it, the scene');
push('loads anyway with failing prerequisites (confirmed bug pattern, fixed twice');
push('this session: week39.json/act4_week40_exile, week45.json/act4_ima_confrontation).');
push('');
push(`Total agenda items scanned: ${totalAgendaItems}`);
push(`Items targeting a real scene (not synthetic sentinel, not broken link): ${itemsWithSceneTarget}`);
push(`Items skipped (synthetic sentinel like __budget__): ${itemsSkippedSentinel}`);
push(`Items skipped (broken link — target scene not found): ${itemsSkippedMissingScene}`);
push(`Parse errors: ${parseErrors.length}`);
if (parseErrors.length) {
  for (const e of parseErrors) push('  ' + e);
}
push('');
push(`=== MATCHES: ${matches.length} ===`);
push('');

if (matches.length === 0) {
  push('(none found)');
} else {
  for (const m of matches) {
    push(`--- ${m.agendaFile} :: "${m.itemId}" -> ${m.sceneId} ---`);
    push(`  scene file: ${m.sceneFile}`);
    push(`  agenda window: weekAvailable=${m.weekAvailable} weekDeadline=${m.weekDeadline}`);
    push(`  scene prerequisites (NOT mirrored on the agenda entry): ${JSON.stringify(m.scenePrereq)}`);
    push(`  scene has "exclusive" fallback: ${m.hasExclusiveFallback ? 'YES -> ' + JSON.stringify(m.exclusiveList) : 'NO (loadScene will load it anyway if prereqs fail)'}`);
    push('');
  }
}

push('=== TOTALS ===');
push(`Unguarded agenda entries found: ${matches.length}`);
push(`  ...of which scene has NO exclusive fallback (higher-severity): ${matches.filter(m => !m.hasExclusiveFallback).length}`);
push(`  ...of which scene HAS an exclusive fallback (lower-severity, still worth a prerequisites mirror): ${matches.filter(m => m.hasExclusiveFallback).length}`);

const report = lines.join('\n');
console.log(report);

const outFile = path.join(ROOT, 'unguarded-agenda-entries-report.txt');
fs.writeFileSync(outFile, report, 'utf8');
console.error(`\n[scan] full report also written to ${rel(outFile)}`);
