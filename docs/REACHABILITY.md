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
