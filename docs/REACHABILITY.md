# Directed reachability — Round 3 STEP 3

How every narrative scene can fire, or why it cannot be proven to fire.
Static source index + telemetry union + goal-directed proofs.

Reproduce (outputs are telemetry — NEVER commit `run-*.json`):

```sh
node scripts/analyze-runs.mjs --write-manifest
MANDATE_REPORT=1 npx vitest run --config scripts/vitest.report.config.ts
```

Measured 2026-10-05 on `agent/depth-pass` (after STEP 2 engine fixes):

- Registry: **539** scenes.
- Telemetry union visited: **207** (clean 188 / exile 188 / god 200, weeks 1–103 each).
- Never-fired: **332** — agenda 30 / agenda+chain 37 / chain-only 174 / nextNode-only 4 / no-source 87.
- Directed proofs (`proveScene`: agenda entry > chain trigger > nextNode link > exclusive
  redirect, preconditions seeded, real stores): **203 proved / 129 blocked**.

NOTE on the brief's "92": the brief predates the report-suite telemetry. The measured
never-fired set against the clean/exile/god union is 332, and every number below is
derived from that set (`run-manifest.json` + `run-directed.json`). The 92 likely came
from the Round-2 sweep's different profiles and is not comparable.

## Verdict taxonomy (129 blocked)

| Blocker | n | Meaning |
|---|---|---|
| `no-source-path` | 87 | No agenda entry, choice chainTrigger, nextNode link, or exclusive redirect references the scene. Subdivided below. |
| `source-not-loadable` | 10 | Proof loads the source scene but exclusive routing lands elsewhere (`landed-on`). Downstream of redirecting sources; policy does not chase redirects. |
| `source-choice-unavailable` | 10 | Source loads, but the firing choice is not offered (segment-gated or condition-gated under seeded state). |
| `chain-not-scheduled` | 8 | Source choice played, but no chain with this target entered `scheduled` (source-side trigger conditions unmet in proof state). |
| `dropped-in-queue` | 7 | Chain scheduled, then left `scheduled` without firing (trigger conditions/probability failed at tick). Genuine at-risk firings. |
| `played-but-unvisited` | 6 | The six `__project__*` scenes: agenda item played, but the id never lands in `visitedSceneIds` (project flow records completion under a different id). |
| `probability-miss after 3 attempts` | 1 | `act3_third_attack`: probabilistic trigger missed all 3 proof attempts. |

## `no-source-path` is two populations, neither is "blocked content"

**A. Engine-sourced (44)** — scheduled or injected by code, invisible to the static
choice-trigger index, and the proof policy has no engine-trigger seeding. Verdict here
means *unproven*, not unreachable:

- `weekStore.ts`: `act1_chain_deficit_crisis`, `act1_chain_tyvaren_border_standoff`,
  `act3_nightmare_sequence`, `act3_no_confidence_fallen`, `act3_no_confidence_survived`,
  `act3_rival_poaching`, `act4_impeachment_proceedings`, `act4_impeachment_vote_vindicated`,
  `news_inauguration_gazette/herald/worker`, `vyktor_press_briefing`.
- `narrativeStore.ts`: `act4_mole_correct_accusation`, `act4_mole_wrong_accusation`,
  `project_contractor_*` (4), `project_mid_crisis_*` (4), `security_posture_choice_perov`.
- Engines: `AssassinationEngine` (`act3_assassination_*` 4 + `act3_chain_assassination_attempt`
  is choice-adjacent but engine-gated), `LetterEngine` (`letter_response_*` 10),
  `FamilyDinnerEngine`, `IntelligenceBriefingEngine`, `BudgetCrisisEngine`
  (`crisis_deficit_emergency`), `EmergencyDecreeEngine`, `WhisperNetworkEngine`
  (`morning_briefing_compromised`).
- Journal/Audio-only references: `act1_week8_vael_offer`, `act1_week9_soren_immunity`.

**B. UI-sourced (43)** — launched directly by components, never through the week-flow
pool, so the week-flow proof policy cannot reach them. Needs component-path proofs:

- `SocialEvent.tsx`: `social_autumn_festival_wk18`, `social_independence_parade_wk36`,
  `social_state_dinner_wk24`.
- `TermReportScreen.tsx`: `act1_minority_festival_request`, `act1_religious_parish_priest`,
  `act2_minority_language_school/mixed_marriage/refugee_health`,
  `act2_religious_holiday_speech/hospital_threat`, `act3_minority_refugee_integration`,
  `act3_minority_veteran_recognition`, `act3_religious_church_halvek_files`.
- `CabinetFormation.tsx` / `ConnectionsPanel.tsx`: `act1_week2_cabinet_appointments`,
  `act1_week10_church_education`, `act1_week8_vael_offer`.
- Self-contained week scenes with no agenda entry and no trigger: `act1_brenner_defense_briefing`,
  `act1_chain_kolvar_opposition`, `act1_chain_kravenstal_unrest`,
  `act1_chain_tyvaren_propaganda_war`, `act1_chain_vael_pressure`, `act1_kolvar_counterattack`,
  `act1_kolvar_opposition_rally`, `act1_nadia_exclusive_interview`, `act1_renek_sermon`,
  `act1_vael_party_funding`, `act1_vael_private_meeting`, `act1_week10_law_enforcement_choice`,
  `act1_week20_stellamere_summit`, `act1_week3_armadine_investment`,
  `act1_week4_elena_introduction`, `act2_deficit_crisis`, `act2_diplomacy_arcturian_trade`,
  `act2_superpower_coldness`, `act2_week18_vael_fund`, `act2_week20_oligarch_meeting`,
  `act2_week29_sovarka_approach`, `act3_chain_voss_military_use`,
  `act3_church_active_opposition_scene`, `act3_diplomacy_tyvaren_peace`,
  `act3_tyvaren_pressure`, `act4_marriage_crisis` (+ `social_independence_parade_wk36`
  cross-links it), `family_referendum_night`.

## Seeded-proof caveat: resolved in Round 4 STEP 1

The policy seeds every required-true flag, including flags no choice sets. The 5
proofs that depended on seeding are all reachable in real play after STEP 1:

- `act2_week26_referendum_narrow` (seeded `referendum_passed`): the week-26 vote
  sets it on pass — the scene was stat-gated (reformists 48..61), never flag-blocked.
- `act2_week21_visit_petravar` / `visit_stellamere` (seeded `chose_*`): the week-21
  choices now set `chose_orythian` / `chose_arcturian` — agenda weeks 21–25 offer them.
- `act1_chain_executive_governance` / `act1_chain_nadia_investigation` (seeded):
  scene prereqs repointed to `executive_authority_invoked` / `nadia_rebuffed`, set by
  the scheduling choices — chains fire unseeded.

Cascading note stands with one correction: narrow's 3 downstream chains
(`halvekist_legal_war`, `kolvar_legal_challenge`, `kolvar_negotiation`) died at
`source-not-loadable` because bare `loadScene(narrow)` redirects — they need the
scene played through its agenda/chain path first, then the chain leg fires normally.

## Required-true flags with no choice.flags setter (10) — most are set by mechanisms

The static index only sees `choice.flags` (+6 engine flags), so "never set" means
"not set by any choice". Verified against runtime mechanisms in Round 4 STEP 1:

Set by vote resolution (`voteConfig.successFlags/failureFlags`, applied by
LobbyingInterface): `referendum_passed` (week-26 referendum vote),
`no_confidence_passed` / `no_confidence_failed` (no-confidence vote),
`impeachment_vote_failed` (impeachment vote). No fix needed.
Set in code: `mole_correct` / `mole_wrongly_accused` (narrativeStore merges
`handleMoleAccusation` consequence flags into activeFlags); `deficit_critical` /
`tyvaren_mobilization` (weekStore `addFlags` on trigger); `amber_coast_ftz_signed`
(BillEngine applies bill `signFlags`). No fix needed.
Genuinely unset — fixed in Round 4 STEP 1: `chose_orythian` / `chose_arcturian`
(now set on the week-21 superpower choices); `executive_consolidation` and
`nadia_met` (readers repointed to `executive_authority_invoked` /
`nadia_rebuffed`, the flags the scheduling choices actually set);
`tyvaren_war_imminent` (now set on the week-32 defiant ultimatum rejection,
which already chains to war preparations).
Still unset: `refused_tyvaren_negotiation` (no decider anywhere — AssassinationEngine
Condition D stays doubly-dead; see STEP 3 classification).

## Dead-gate findings (Round 4 STEP 1 verdicts)

1. STEP-1 agenda gates on `referendum_passed` are LIVE, not dead: the week-26
   referendum vote sets it via `successFlags` on pass (the Round-3 note claiming
   otherwise was wrong — the static index is blind to voteConfig sets). Narrow went
   unfired on stats (reformists 48..61 + halvekists<=55 never held in telemetry),
   not on flags.
2. The weekStore no-confidence wrapper items are correctly wired: the vote sets
   `no_confidence_passed/failed`; `confirmAgenda` queues vote + both wrappers and
   the queue drain plays exactly the matching one (proved by the Round-4 spine test).
   Same shape for the impeachment vindicated item.
3. `act4_mole_correct/wrong_accusation` are scheduled by `handleMoleAccusation`
   routing (e15334f) with the outcome flags merged into activeFlags — proved by the
   Round-4 spine test (correct xor wrong payoff, exactly once).
4. Remaining: AssassinationEngine Condition D needs `refused_tyvaren_negotiation`,
   which has no decider — the poisoning track cannot arm (STEP 3 class A, halted).

## Full blocked list (scene | attempted via | path | blocker)

- `__project__amber_coast_highway` | agenda `agenda_project_amber_coast_highway` wk14 | played-but-unvisited
- `__project__ashenmere_metro` | agenda `agenda_project_ashenmere_metro` wk30 | played-but-unvisited
- `__project__kravenstal_steel` | agenda `agenda_project_kravenstal_steel` wk15 | played-but-unvisited
- `__project__rural_electrification` | agenda `agenda_project_rural_electrification` wk29 | played-but-unvisited
- `__project__sevagrad_fortification` | agenda `agenda_project_sevagrad_fortification` wk28 | played-but-unvisited
- `__project__university_expansion` | agenda `agenda_project_university_expansion` wk16 | played-but-unvisited
- `act1_chain_jonas_press_rebellion` | chain `act1_family_jonas_challenge`#`jonas_shut_down` | dropped-in-queue
- `act1_chain_liora_radicalized` | chain `act1_family_liora_mikhael`#`liora_mikhael_silence` | dropped-in-queue
- `act1_chain_tomas_nationalist` | chain `act1_family_tomas_bullying`#`tomas_toughen_up` | dropped-in-queue
- `act2_chain_kravenstal_unrest` | chain `act2_week20_budget_crisis`#`budget_accept_austerity` | dropped-in-queue
- `act2_chain_reformist_fracture` | chain `act2_week16_kolvar_deal`#`kolvar_accept_modified_powers` | dropped-in-queue
- `act2_tyvaren_blind_spot` | chain `act1_week1_bni_discovery`#`bni_full_shutdown` | dropped-in-queue
- `act3_tomas_nationalist_arc` | chain `act2_week23_family_crisis_tomas`#`tomas_investigate_ironborn` | dropped-in-queue
- `act2_week26_megaproject_followup` | chain `act2_week20_megaproject_choice`#`dev_highway_end` | source-choice-unavailable
- `act2_week33_sovarka_survey` | chain `act2_week29_sovarka_approach`#`sovarka_full_end` | source-choice-unavailable
- `act3_chain_dam_relocation_crisis` | chain `act2_week26_megaproject_followup`#`dam_staren_standard_end` | source-choice-unavailable
- `act3_chain_highway_vael_corruption` | chain `act2_week26_megaproject_followup`#`highway_no_intervene_end` | source-choice-unavailable
- `act3_chain_port_tyvaren_escalation` | chain `act2_week26_megaproject_followup`#`port_accelerate_end` | source-choice-unavailable
- `act3_chain_sovarka_tyvaren_response` | chain `act2_week33_sovarka_survey`#`sovarka_full_survey_end` | source-choice-unavailable
- `act3_chain_voss_betrayal_discovered` | chain `act2_week28_voss_crisis`#`voss_foreign_end` | source-choice-unavailable
- `act3_superpower_pressure` | chain `act3_week32_tyvaren_ultimatum`#`tyvaren_international_appeal` | source-choice-unavailable
- `act3_week37_sovarka_outcome` | chain `act2_week33_sovarka_survey`#`sovarka_full_survey_end` | source-choice-unavailable
- `family_bni_night` | chain `act1_week5_bni_crisis`#`dissolve_bni` | source-choice-unavailable
- `act3_brenner_response` | chain `act2_week26_referendum_decisive`#`referendum_decisive_mandate_claim` | source-not-loadable
- `act3_dusek_intelligence` | chain `act3_week30_betrayal_dusek`#`betrayal_dusek_monitor` | source-not-loadable
- `act3_dusek_loyalty_arc` | chain `act3_week30_betrayal_dusek`#`betrayal_dusek_question_loyalty` | source-not-loadable
- `act3_government_in_exile` | chain `act3_week37_coup_attempt`#`coup_flee_stellamere` | source-not-loadable
- `act3_halvekist_legal_war` | chain `act2_week26_referendum_narrow`#`referendum_narrow_challenge_opponent` | source-not-loadable
- `act3_kolvar_legal_challenge` | chain `act2_week26_referendum_narrow`#`referendum_narrow_defend_result` | source-not-loadable
- `act3_kolvar_negotiation` | chain `act2_week26_referendum_narrow`#`referendum_narrow_reach_across` | source-not-loadable
- `act3_loyalist_counter_deploy` | chain `act3_week37_coup_attempt`#`coup_call_loyal_forces` | source-not-loadable
- `act3_opposition_management` | chain `act2_week26_referendum_decisive`#`referendum_decisive_reach_out` | source-not-loadable
- `act3_vostane_media_war` | chain `act3_week30_betrayal_vostane`#`betrayal_vostane_on_camera` | source-not-loadable
- `act3_ashenmere_standoff` | chain `act3_brenner_negotiation`#`brenner_refuse_bluff` | chain-not-scheduled
- `act3_face_to_face_brenner` | chain `act3_ashenmere_standoff`#`standoff_demand_surrender` | chain-not-scheduled
- `act3_public_moment` | chain `act3_face_to_face_brenner`#`face_appeal_patriotism` | chain-not-scheduled
- `act4_mole_confrontation` | chain `act4_internal_security_state`#`security_identify_mole` | chain-not-scheduled
- `project_vael_kickback_fort` | chain `project_contractor_fortification`#`contractor_fort_vael` | chain-not-scheduled
- `project_vael_kickback_highway` | chain `project_contractor_highway`#`contractor_highway_vael` | chain-not-scheduled
- `project_vael_kickback_steel` | chain `project_contractor_steel`#`contractor_steel_vael` | chain-not-scheduled
- `project_vael_kickback_uni` | chain `project_contractor_university`#`contractor_uni_vael` | chain-not-scheduled
- `act3_third_attack` | chain `act3_second_attack`#`second_attack_double_down` | probability-miss after 3 attempts
- 87 × `no-source-path`: the Engine-sourced (44) and UI-sourced (43) populations above.

## Proved (203)

- Via agenda 61 (including the seeded `referendum_narrow`, `visit_petravar`, `visit_stellamere`).
- Via chain 138 (including the seeded `executive_governance`, `nadia_investigation`).
- Via nextNode 4. Via exclusive 0 (no never-fired scene is exclusive-only).
- Per-scene paths: `run-manifest.json` (static) + `run-directed.json` (verdicts) —
  uncommitted telemetry, reproducible with the two commands at the top.

---

# Round 4 STEP 3 — blocked-scene classification (A/B/C)

For each of the 129 blocked + 5 seeded proofs: scene | blocking condition | class.
(A = required flag set by nothing · B = mutually-exclusive branch, legitimate ·
C = needs an unusual stat/flag state.) Verified live where marked [live]; stale
10:12 verdicts are superseded where re-proven. Remaining never-set data flags: 0.

## Seeded 5 — RESOLVED by STEP-1 fixes (no longer seeded)

`referendum_narrow` (vote sets `referendum_passed`; stat-gated 48..61) ·
`visit_petravar` / `visit_stellamere` (choices now set `chose_*`) ·
`executive_governance` / `nadia_investigation` (repointed to scheduler-set flags).

## Proof artifacts (3) — mechanism verified live, game not blocked

- `act3_ashenmere_standoff` (was: chain-not-scheduled) [live]: `brenner_refuse_bluff`
  (unconditional root choice) injects it into the queue; stale verdict.
- `act4_mole_confrontation` (was: chain-not-scheduled) [live]: `security_identify_mole`
  injects it; stale verdict.
- `act3_superpower_pressure` (was: source-choice-unavailable) [live]:
  `tyvaren_international_appeal` is offered in a fresh week-32 world; stale verdict.

## Played-but-unvisited 6 — proof artifact, not blocked

`__project__amber_coast_highway/ashenmere_metro/kravenstal_steel/rural_electrification/sevagrad_fortification/university_expansion`:
the proof's `playItem` marks only non-`__` scenes visited, so these agenda-offered,
registry-resident scenes can never count as visited in the proof. Real flow records
them via `processChoice`. Proof helper needs the `playChoice` path for `__` scenes.

## Class B — legitimate branch exclusives (12, no fix)

Deep-segment end choices; picking one closes the siblings by construction. The proof
navigates a single segment hop, so multi-hop ends also expose a proof gap, not a
game gap. The fired branch's downstream works (chains unconditional once chosen).
- Megaproject (4 ends → `megaproject_followup` + dam/highway/port crisis chains):
  `dev_highway_end/dev_dam_full_end/dev_dam_partial_end/dev_port_end`.
- Sovarka (3 ends → `sovarka_survey` + `sovarka_tyvaren_response`/`sovarka_outcome`):
  `sovarka_full_end/sovarka_quiet_end/sovarka_defer_end`.
- Voss (`voss_betrayal_discovered` ← `voss_foreign_end`, 1 of 4 crisis closes).
- BNI (`family_bni_night` ← `dissolve_bni`, deep in a 12-segment scene).

## Class C — unusual state required, mechanism sound (27, no fix)

- Stat-gated chain triggers, proof seeds flags but not stats (7 dropped-in-queue):
  `jonas_press_rebellion` (marriageHealth<40) · `liora_radicalized` (liora<35) ·
  `tomas_nationalist` / `tomas_nationalist_arc` (wellbeing<35/<25) ·
  `kravenstal_unrest` (workers<38) · `reformist_fracture` (reformists<45) ·
  `tyvaren_blind_spot` (readiness<40, delay 14).
- Probabilistic (1): `third_attack` (0.3, missed 3/3 = 34% likely).
- Cascades off unproven sources (8 chain-not-scheduled remainder): `face_to_face_brenner`
  (prob 0.3 off standoff, else via coup-confront) · `public_moment` (off face_to_face /
  coup-confront) · 4 `vael_kickback_*` (off contractor vael branches; contractors need
  an active project + vael pick).
- Redirect-chasing sources (10 source-not-loadable): decisive/narrow downstreams
  (`brenner_response`, `opposition_management`, `halvekist_legal_war`,
  `kolvar_legal_challenge`, `kolvar_negotiation`) need the result scene played under
  its stats first · `dusek_intelligence/loyalty_arc`, `vostane_media_war` need their
  betrayal flags · `government_in_exile`, `loyalist_counter_deploy` need the coup
  in progress.

## Class A — fixed (1) and halted (3)

- FIXED: `refused_tyvaren_negotiation` — set on `tyvaren_defiant_rejection` (defiance
  is refusal; the scene's alternative is negotiation). Arms Condition D; spine test
  proves defiant → poisoning only. BALANCE NOTE: defying at 30–36 now guarantees the
  poisoning track absent counterplay stats — revert if that is not the intent.
- HALTED (no decider exists; inventing a setter would fabricate an outcome):
  `ssd_assassination` (Condition C retaliation-bombing; no player-ordered-assassination
  content exists anywhere) · `act3_assassination_default` (no trigger yields a null
  variant; unreachable scene) · the B/C populations above (legitimate or sound).

## No-source 87 — standing taxonomy (policy gaps, not blocks)

Engine-sourced 44 and UI-sourced 43 per the sections above. Since STEP 1–2, these are
additionally spine-proven where covered: mole payoffs (correct xor wrong), nc
fallen/survived wrappers, assassination sniper/bombing/poisoning tracks. Engine
trigger-seeding proofs and component-path proofs remain future work; `run-*.json`
stays uncommitted.

---

# Round 6 STEP 2 — choice-list triage (FAIL 27 / WARN 22)

Audit gate is permanent; the engine fallback (synthetic Continue) covers every unit
below at runtime. Triage verdict: NO data fixes. Session-touched scenes' WARNs are
exhaustive-by-design routers (divorce true/false pairs from STEP-1d; outcome
quad-cover in wk53); legacy units are correct routers or terminal beats. Adding data
choices would author content under freeze to duplicate the fallback.

Round 7 STEP 2 refinement: 18 of the 27 FAILs are FALSE POSITIVES that never enter
the choice path — the 3 social roots complete via SocialEvent's own
interaction/leave flow (currentScene.choices never read), and the 8 dinner + 7
briefing segments are display-spliced narrative (only dinner_choices /
briefing_choices are ever navigated; verified no nextSegment targets the rest).
The audit excludes both populations dynamically (they fall back into the gate if
the data ever changes shape). Spine-proven: dinner/briefing hubs complete with
real choices and no fallback; social roots complete via the interaction flow and
offer Continue as defense in depth. True FAILs: the 9 kitchen/two-letters
terminals below.

## FAIL — empty choice arrays (27, all legacy, all fallback-covered)

- `act3_week52_the_kitchen`: seg_reflect_clean/vael/morvec/owned/general (5).
- `act3_week38_two_letters`: seg_vael_broken/morvec_broken/both_broken/owned_quietly (4).
- Social roots (UI-launched): autumn_festival_wk18, state_dinner_wk24,
  independence_parade_wk36 (3).
- `family_dinner_recurring` injected segs (8): military_presence, oligarch_rumors,
  union_praise, journalist_arrest, protest_sounds, curfew_discussion,
  marital_tension, tomas_trouble.
- `intelligence_briefing_recurring` injected segs (7): mole_progress, faction_unrest,
  tyvaren_movement, morivask_instability, minister_corruption, oligarch_activity,
  routine_quiet.

## WARN — no unconditional choice (22, fallback backstops all-gated-off runs)

- Exhaustive routers, no fix: wk53 check_outcome (captured/destroyed/clean cover all
  combos) · wk78 check_marriage_state (divorce true/false split) · wk59 reassign +
  wk61 dinner/festival (divorce pairs) · wk100 kolvar_specific (generic all-false
  fallback) · wk52 ending (10 endings; middle run now Completes via fallback).
- Legacy routers, listed: act1_week10_tyvaren_intel · mole_week5_complication ·
  oil vyktor_reads_telegram · megaproject dev_followup_branch · wk31 strike_resolution ·
  pipeline constitution vote · armadine_steel_return (+jonas) · currency speculation ×2 ·
  sovarka_outcome_branch · wk65 check_stance/check_tech_level · wk72 check_plan ·
  wk80 check_results.
