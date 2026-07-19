import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const filePath = join(__dirname, '../src/data/narrative/act1/act1_week2_cabinet_formation_meeting.json');
const data = JSON.parse(readFileSync(filePath, 'utf8'));
const segments = data.segments || {};

// ── Ministry classification ──────────────────────────────────────────────────
const MINISTRY_PREFIXES = [
  { index: 0,  name: 'Finance',     prefixes: ['vostane_', 'kolvar_', 'finance_', 'ghost_'] },
  { index: 1,  name: 'Interior',    prefixes: ['oberlin_', 'perov_', 'interior_'] },
  { index: 2,  name: 'Defense',     prefixes: ['dusek_', 'vass_', 'defense_'] },
  { index: 3,  name: 'Education',   prefixes: ['education_', 'edu_'] },
  { index: 4,  name: 'Health',      prefixes: ['health_'] },
  { index: 5,  name: 'Justice',     prefixes: ['justice_', 'theron_', 'kesic_'] },
  { index: 6,  name: 'Labor',       prefixes: ['labor_'] },
  { index: 7,  name: 'Development', prefixes: ['development_', 'dev_'] },
  { index: 8,  name: 'Foreign',     prefixes: ['foreign_', 'foreign_affairs_'] },
  { index: 9,  name: 'Resources',   prefixes: ['resources_', 'valdek_', 'voss_'] },
  { index: 10, name: 'Closing',     prefixes: ['cabinet_meeting_closing', 'final_decision', 'transition_to_appointments'] },
];

const EXACT_MAP = {
  'cabinet_meeting_closing': 10,
  'final_decision': 10,
  'defense_choice': 10,          // appointment step inside closing flow, not a candidate-interview segment
  'transition_to_appointments': 10,
  'oberlin_plan_to_perov_answer': 1,
};

// Within-ministry candidate handoffs: answer from candidate A routes to candidate B's
// *_presents within the same ministry. These are intentional and correct.
const ALLOWED_ANSWER_TO_PRESENTS = new Set([
  // Finance: Vostane answer → Kolvar presents (second Finance candidate)
  'vostane_politics_answer|kolvar_presents',
  'ghost_to_kolvar_answer|kolvar_presents',
  // Interior: Oberlin answer → Perov presents (second Interior candidate)
  'oberlin_experience_answer|perov_presents',
  'oberlin_police_answer|perov_presents',
  'oberlin_plan_to_perov_answer|perov_presents',
  // Interior: Perov answer → interior_confrontation (debate, same ministry, not *_presents so won't trigger anyway)
]);

const RETIRED_SEGMENTS = new Set([
  'player_interrogation_hub',
  'interrogate_vostane',
  'interrogate_kolvar',
  'interrogate_oberlin',
  'interrogate_perov',
  'interrogate_dusek',
  'interrogate_vass',
]);

function classify(segId) {
  if (RETIRED_SEGMENTS.has(segId)) return { index: -1, name: 'RETIRED' };
  if (segId in EXACT_MAP) return { index: EXACT_MAP[segId], name: MINISTRY_PREFIXES.find(m => m.index === EXACT_MAP[segId])?.name ?? '?' };
  for (const m of MINISTRY_PREFIXES) {
    for (const p of m.prefixes) {
      if (segId === p || segId.startsWith(p)) return { index: m.index, name: m.name };
    }
  }
  return null;
}

const violations = [];
const suspicious = [];
const unclassifiable = new Set();

function checkChoices(containerId, choices) {
  const container = containerId === '__root__'
    ? { index: -2, name: '__root__' }
    : classify(containerId);

  if (!container) { unclassifiable.add(containerId); return; }
  if (container.index === -1) return; // RETIRED

  for (const choice of (choices || [])) {
    const target = choice.nextSegment;
    if (!target) continue;

    const tClass = classify(target);
    if (!tClass) { unclassifiable.add(target); continue; }
    if (tClass.index === -1) continue; // routing to RETIRED — intentional

    const ci = container.index;
    const ti = tClass.index;

    if (ci === -2) continue; // root-level choices — no ministry to compare against

    if (ti < ci) {
      violations.push({ containerId, containerMinistry: container.name, containerIndex: ci,
        choiceId: choice.id, choiceText: choice.text, nextSegment: target,
        targetMinistry: tClass.name, targetIndex: ti,
        reason: `Backward jump: ${tClass.name}(${ti}) < ${container.name}(${ci})` });
      continue;
    }

    if (ti === ci) {
      if (target === containerId) {
        violations.push({ containerId, containerMinistry: container.name, containerIndex: ci,
          choiceId: choice.id, choiceText: choice.text, nextSegment: target,
          targetMinistry: tClass.name, targetIndex: ti,
          reason: `Self-loop: segment routes to itself` });
        continue;
      }
      // An answer/exit sub-segment routing back to its own ministry's *_presents is
      // a loop bug when the choice text says "move on" / "to labor" / "to next" —
      // these should advance to the NEXT ministry's *_presents.
      // Heuristic: if containerId ends in _answer or _to_next style, AND
      // target ends in _presents, flag as VIOLATION.
      const isAnswerSeg = containerId.endsWith('_answer');
      const targetsPresents = target.endsWith('_presents');
      const allowKey = `${containerId}|${target}`;
      if (isAnswerSeg && targetsPresents && !ALLOWED_ANSWER_TO_PRESENTS.has(allowKey)) {
        violations.push({ containerId, containerMinistry: container.name, containerIndex: ci,
          choiceId: choice.id, choiceText: choice.text, nextSegment: target,
          targetMinistry: tClass.name, targetIndex: ti,
          reason: `Answer-loop: answer sub-segment loops back to own ministry's *_presents instead of advancing` });
        continue;
      }
      // Same-ministry loop otherwise (deep-dive → presents for more questions): OK
      continue;
    }

    if (ti > ci + 1) {
      suspicious.push({ containerId, containerMinistry: container.name, containerIndex: ci,
        choiceId: choice.id, choiceText: choice.text, nextSegment: target,
        targetMinistry: tClass.name, targetIndex: ti,
        reason: `Forward skip: ${container.name}(${ci}) → ${tClass.name}(${ti}), skips ${ti - ci - 1} ministr${ti - ci - 1 === 1 ? 'y' : 'ies'}` });
    }
  }
}

checkChoices('__root__', data.choices || []);
for (const [segId, seg] of Object.entries(segments)) {
  checkChoices(segId, seg.choices || []);
}

// ── Report ───────────────────────────────────────────────────────────────────
console.log('═══════════════════════════════════════════════════════════');
console.log('CABINET FORMATION MEETING — STRUCTURAL AUDIT');
console.log('═══════════════════════════════════════════════════════════');
console.log(`Total segments: ${Object.keys(segments).length}`);
console.log(`Retired segments (expected unreachable): ${RETIRED_SEGMENTS.size}`);
console.log('');

if (unclassifiable.size > 0) {
  console.log('── UNCLASSIFIABLE SEGMENTS (manual review needed) ──────────');
  for (const id of [...unclassifiable].sort()) console.log(`  ${id}`);
  console.log('');
}

console.log(`── VIOLATIONS (${violations.length}) ─────────────────────────────────────`);
if (violations.length === 0) {
  console.log('  ✓ None');
} else {
  for (const v of violations) {
    console.log(`\n  [VIOLATION] ${v.reason}`);
    console.log(`    Segment:     ${v.containerId} (${v.containerMinistry} #${v.containerIndex})`);
    console.log(`    Choice id:   ${v.choiceId}`);
    console.log(`    Text:        "${v.choiceText}"`);
    console.log(`    nextSegment: ${v.nextSegment} (${v.targetMinistry} #${v.targetIndex})`);
  }
}

console.log('');
console.log(`── SUSPICIOUS forward skips (${suspicious.length}) ──────────────────────────`);
if (suspicious.length === 0) {
  console.log('  ✓ None');
} else {
  for (const s of suspicious) {
    console.log(`\n  [SUSPICIOUS] ${s.reason}`);
    console.log(`    Segment:     ${s.containerId} (${s.containerMinistry} #${s.containerIndex})`);
    console.log(`    Choice id:   ${s.choiceId}`);
    console.log(`    Text:        "${s.choiceText}"`);
    console.log(`    nextSegment: ${s.nextSegment} (${s.targetMinistry} #${s.targetIndex})`);
  }
}

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log(`SUMMARY: ${violations.length} VIOLATION(S), ${suspicious.length} SUSPICIOUS`);
console.log('═══════════════════════════════════════════════════════════');
