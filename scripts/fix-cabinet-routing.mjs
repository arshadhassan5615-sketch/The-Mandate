/**
 * Applies all 29 confirmed routing fixes to act1_week2_cabinet_formation_meeting.json.
 * Each fix: { segmentId, choiceId, wrongTarget, correctTarget }
 * Verifies each wrong target is actually present before patching.
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const filePath = join(__dirname, '../src/data/narrative/act1/act1_week2_cabinet_formation_meeting.json');
const raw = readFileSync(filePath, 'utf8');
const data = JSON.parse(raw);
const segments = data.segments;

const FIXES = [
  // ── Justice (5) answers → labor_presents ──────────────────────────────────
  { segmentId: 'theron_judges_answer',          choiceId: 'theron_judges_to_labor',           wrong: 'justice_presents', correct: 'labor_presents' },
  { segmentId: 'kesic_rebuttal_judges',         choiceId: 'kesic_rebuttal_to_labor',           wrong: 'justice_presents', correct: 'labor_presents' },
  { segmentId: 'justice_theron_priority_answer',choiceId: 'justice_theron_priority_to_next',   wrong: 'justice_presents', correct: 'labor_presents' },
  { segmentId: 'justice_kesic_priority_answer', choiceId: 'justice_kesic_priority_to_next',    wrong: 'justice_presents', correct: 'labor_presents' },
  { segmentId: 'justice_kesic_challenge_answer',choiceId: 'justice_kesic_challenge_to_next',   wrong: 'justice_presents', correct: 'labor_presents' },

  // ── Education (3) answers → health_presents ───────────────────────────────
  { segmentId: 'edu_solen_priority_answer',  choiceId: 'edu_solen_priority_to_next',  wrong: 'education_presents', correct: 'health_presents' },
  { segmentId: 'edu_solen_challenge_answer', choiceId: 'edu_solen_challenge_to_next', wrong: 'education_presents', correct: 'health_presents' },
  { segmentId: 'edu_horak_priority_answer',  choiceId: 'edu_horak_priority_to_next',  wrong: 'education_presents', correct: 'health_presents' },
  { segmentId: 'edu_horak_challenge_answer', choiceId: 'edu_horak_challenge_to_next', wrong: 'education_presents', correct: 'health_presents' },

  // ── Health (4) answers → justice_presents ─────────────────────────────────
  { segmentId: 'health_kaspar_priority_answer',  choiceId: 'health_kaspar_priority_to_next',  wrong: 'health_presents', correct: 'justice_presents' },
  { segmentId: 'health_kaspar_challenge_answer', choiceId: 'health_kaspar_challenge_to_next', wrong: 'health_presents', correct: 'justice_presents' },
  { segmentId: 'health_meln_priority_answer',    choiceId: 'health_meln_priority_to_next',    wrong: 'health_presents', correct: 'justice_presents' },
  { segmentId: 'health_meln_challenge_answer',   choiceId: 'health_meln_challenge_to_next',   wrong: 'health_presents', correct: 'justice_presents' },

  // ── Labor (6) answers → development_presents ──────────────────────────────
  { segmentId: 'labor_maric_priority_answer',  choiceId: 'labor_maric_priority_to_next',  wrong: 'labor_presents', correct: 'development_presents' },
  { segmentId: 'labor_maric_challenge_answer', choiceId: 'labor_maric_challenge_to_next', wrong: 'labor_presents', correct: 'development_presents' },
  { segmentId: 'labor_solec_priority_answer',  choiceId: 'labor_solec_priority_to_next',  wrong: 'labor_presents', correct: 'development_presents' },
  { segmentId: 'labor_solec_challenge_answer', choiceId: 'labor_solec_challenge_to_next', wrong: 'labor_presents', correct: 'development_presents' },

  // ── Development (7) answers → foreign_affairs_presents ────────────────────
  { segmentId: 'dev_varro_priority_answer',   choiceId: 'dev_varro_priority_to_next',   wrong: 'development_presents', correct: 'foreign_affairs_presents' },
  { segmentId: 'dev_varro_challenge_answer',  choiceId: 'dev_varro_challenge_to_next',  wrong: 'development_presents', correct: 'foreign_affairs_presents' },
  { segmentId: 'dev_drenek_priority_answer',  choiceId: 'dev_drenek_priority_to_next',  wrong: 'development_presents', correct: 'foreign_affairs_presents' },
  { segmentId: 'dev_drenek_challenge_answer', choiceId: 'dev_drenek_challenge_to_next', wrong: 'development_presents', correct: 'foreign_affairs_presents' },

  // ── Foreign (8) answers → resources_presents ──────────────────────────────
  { segmentId: 'foreign_sorin_priority_answer',  choiceId: 'foreign_sorin_priority_to_next',  wrong: 'foreign_affairs_presents', correct: 'resources_presents' },
  { segmentId: 'foreign_sorin_challenge_answer', choiceId: 'foreign_sorin_challenge_to_next', wrong: 'foreign_affairs_presents', correct: 'resources_presents' },
  { segmentId: 'foreign_borac_priority_answer',  choiceId: 'foreign_borac_priority_to_next',  wrong: 'foreign_affairs_presents', correct: 'resources_presents' },
  { segmentId: 'foreign_borac_challenge_answer', choiceId: 'foreign_borac_challenge_to_next', wrong: 'foreign_affairs_presents', correct: 'resources_presents' },

  // ── Resources (9) answers → cabinet_meeting_closing ───────────────────────
  { segmentId: 'valdek_priority_answer',  choiceId: 'valdek_to_closing',   wrong: 'resources_presents', correct: 'cabinet_meeting_closing' },
  { segmentId: 'valdek_challenge_answer', choiceId: 'valdek_to_closing_2', wrong: 'resources_presents', correct: 'cabinet_meeting_closing' },
  { segmentId: 'voss_priority_answer',    choiceId: 'voss_to_closing',     wrong: 'resources_presents', correct: 'cabinet_meeting_closing' },
  { segmentId: 'voss_challenge_answer',   choiceId: 'voss_to_closing_2',   wrong: 'resources_presents', correct: 'cabinet_meeting_closing' },
];

let applied = 0;
let errors = 0;

for (const fix of FIXES) {
  const seg = segments[fix.segmentId];
  if (!seg) { console.error(`ERROR: segment not found: ${fix.segmentId}`); errors++; continue; }

  const choice = (seg.choices || []).find(c => c.id === fix.choiceId);
  if (!choice) { console.error(`ERROR: choice not found: ${fix.choiceId} in ${fix.segmentId}`); errors++; continue; }

  if (choice.nextSegment !== fix.wrong) {
    console.error(`MISMATCH: ${fix.segmentId}/${fix.choiceId} — expected "${fix.wrong}", found "${choice.nextSegment}"`);
    errors++;
    continue;
  }

  choice.nextSegment = fix.correct;
  console.log(`FIXED: ${fix.segmentId} / ${fix.choiceId}`);
  console.log(`       ${fix.wrong} → ${fix.correct}`);
  applied++;
}

console.log('');
if (errors > 0) {
  console.error(`ABORTED: ${errors} error(s) — file NOT written.`);
  process.exit(1);
}

writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log(`Applied ${applied} fix(es). File written.`);
JSON.parse(readFileSync(filePath, 'utf8'));
console.log('JSON validation: valid');
