import { readFileSync, readdirSync } from 'fs';
import { join, basename } from 'path';

const DATA_DIR = join(import.meta.dirname, '..', 'src', 'data');

const TEXT_FIELDS = new Set([
  'text', 'description', 'flavor', 'consequence', 'headline',
  'openingLine', 'body', 'title', 'subtitle', 'name', 'label',
  'content', 'speech', 'narration', 'nationSummary', 'declassifiedNote',
  'characterName', 'location', 'tagline', 'quote', 'summary'
]);

function getJsonFiles(dir) {
  const files = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getJsonFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(fullPath);
    }
  }
  return files;
}

function extractTexts(obj, texts) {
  if (obj === null || obj === undefined) return;
  if (typeof obj === 'string') return;
  if (Array.isArray(obj)) {
    for (const item of obj) extractTexts(item, texts);
    return;
  }
  if (typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && TEXT_FIELDS.has(key)) {
        texts.push(value);
      } else if (typeof value === 'object') {
        extractTexts(value, texts);
      }
    }
  }
}

function countWords(texts) {
  return texts.reduce((total, t) => {
    const words = t.trim().split(/\s+/).filter(w => w.length > 0);
    return total + words.length;
  }, 0);
}

// Also count choices and chain triggers across all narrative scenes
function countChoicesAndChains(data) {
  let choices = 0;
  let chainTriggers = 0;
  const counted = new Set();
  function walk(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) {
      for (const item of obj) walk(item);
      return;
    }
    if (obj.id && obj.text && !counted.has(obj.id)) {
      counted.add(obj.id);
      choices++;
    }
    if (obj.triggerId || obj.sceneId) {
      // This is a chain trigger reference
      if (obj.sceneId && obj.delayWeeks !== undefined) {
        chainTriggers++;
      }
    }
    for (const value of Object.values(obj)) {
      if (typeof value === 'object') walk(value);
    }
  }
  walk(data);
  return { choices, chainTriggers };
}

// 1. CODEX
console.log('=== CODEX ENTRIES ===');
const codexFiles = getJsonFiles(join(DATA_DIR, 'codex'));
let totalCodexEntries = 0;
let codexWC = 0;
for (const file of codexFiles.sort()) {
  const data = JSON.parse(readFileSync(file, 'utf-8'));
  const count = Array.isArray(data) ? data.length : 1;
  totalCodexEntries += count;
  const texts = []; extractTexts(data, texts);
  const wc = countWords(texts);
  codexWC += wc;
  console.log(`  ${basename(file)}: ${count} entries, ${wc.toLocaleString()} words`);
}
console.log(`  TOTAL: ${totalCodexEntries} entries, ${codexWC.toLocaleString()} words\n`);

// 2. NARRATIVE
console.log('=== NARRATIVE SCENES ===');
const narrativeFiles = getJsonFiles(join(DATA_DIR, 'narrative'));
let narrativeWC = 0;
let totalChoices = 0;
let totalChainTriggers = 0;
const actStats = { act1: { wc: 0, files: 0 }, act2: { wc: 0, files: 0 }, act3: { wc: 0, files: 0 }, act4: { wc: 0, files: 0 } };

for (const file of narrativeFiles.sort()) {
  const data = JSON.parse(readFileSync(file, 'utf-8'));
  const texts = []; extractTexts(data, texts);
  const wc = countWords(texts);
  narrativeWC += wc;
  const { choices, chainTriggers } = countChoicesAndChains(data);
  totalChoices += choices;
  totalChainTriggers += chainTriggers;

  const fn = basename(file);
  for (const act of Object.keys(actStats)) {
    if (fn.startsWith(act + '_')) {
      actStats[act].wc += wc;
      actStats[act].files++;
      break;
    }
  }
}
for (const [act, stats] of Object.entries(actStats)) {
  console.log(`  ${act}: ${stats.files} files, ${stats.wc.toLocaleString()} words`);
}
console.log(`  TOTAL narrative: ${narrativeFiles.length} files, ${narrativeWC.toLocaleString()} words`);
console.log(`  TOTAL choices (across all scenes): ${totalChoices}`);
console.log(`  TOTAL chain triggers (across all scenes): ${totalChainTriggers}\n`);

// 3. AGENDA
console.log('=== AGENDA WORD COUNT ===');
const agendaFiles = getJsonFiles(join(DATA_DIR, 'agenda'));
let agendaWC = 0;
let totalAgendaOptions = 0;
for (const file of agendaFiles.sort()) {
  const data = JSON.parse(readFileSync(file, 'utf-8'));
  const texts = []; extractTexts(data, texts);
  const wc = countWords(texts);
  agendaWC += wc;
  const count = Array.isArray(data) ? data.length : 1;
  totalAgendaOptions += count;
}
console.log(`  Files: ${agendaFiles.length}, Options: ${totalAgendaOptions}, Words: ${agendaWC.toLocaleString()}\n`);

// 4. EPILOGUE
console.log('=== EPILOGUE ===');
const epilogueFiles = getJsonFiles(join(DATA_DIR, 'narrative')).filter(f => basename(f).includes('epilogue'));
let epilogueWC = 0;
for (const file of epilogueFiles) {
  const data = JSON.parse(readFileSync(file, 'utf-8'));
  const texts = []; extractTexts(data, texts);
  const wc = countWords(texts);
  epilogueWC += wc;
  console.log(`  ${basename(file)}: ${wc.toLocaleString()} words`);
}
// Also check for standalone epilogue file
const epFile = join(DATA_DIR, 'epilogues.json');
try {
  const epData = JSON.parse(readFileSync(epFile, 'utf-8'));
  const epTexts = []; extractTexts(epData, epTexts);
  const wc = countWords(epTexts);
  if (wc > epilogueWC) {
    epilogueWC = wc;
    console.log(`  epilogues.json: ${wc.toLocaleString()} words`);
  }
} catch (e) { /* no standalone epilogue file */ }
console.log(`  TOTAL epilogue: ${epilogueWC.toLocaleString()} words\n`);

// 5. GRAND TOTAL
const grandTotal = codexWC + narrativeWC + agendaWC + epilogueWC;
console.log('='.repeat(60));
console.log('                  FINAL AUDIT TOTALS');
console.log('='.repeat(60));
console.log(`  Narrative scenes:       ${narrativeFiles.length}`);
console.log(`  Agenda files:           ${agendaFiles.length}`);
console.log(`  Codex entries:          ${totalCodexEntries}`);
console.log(`  Total choices:          ${totalChoices}`);
console.log(`  Total chain triggers:   ${totalChainTriggers}`);
console.log(`  Narrative words:        ${narrativeWC.toLocaleString()}`);
console.log(`  Agenda words:           ${agendaWC.toLocaleString()}`);
console.log(`  Codex words:            ${codexWC.toLocaleString()}`);
console.log(`  Epilogue words:         ${epilogueWC.toLocaleString()}`);
console.log(`  -----------------------------------------`);
console.log(`  TOTAL WORD COUNT:       ${grandTotal.toLocaleString()}`);
console.log('='.repeat(60));
