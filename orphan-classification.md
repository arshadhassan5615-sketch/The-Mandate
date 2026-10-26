# WORK ORDER K2: Orphan and mis-targeted meeting classification

Report only. No game code, data, or existing files were changed. Generated 2026-10-27 from the static analysis in `unreachable-gates-report.json` plus scene/agenda JSON, `git log -S` history, and the engine code paths cited below.

## Summary

| Proposal | Count |
| --- | --- |
| SCHEDULE_CHAIN | 4 |
| UNSURE | 14 |
| SUPERSEDED | 4 |
| SCHEDULE_AGENDA | 8 |
| NOT_A_MEETING | 3 |
| Mis-targeted agenda entries | 7 (RETARGET 2, NO_MATCH 5) |

Method notes:
- Chain edges were collected by walking every scene JSON for `chainTriggers` (choice-level and nested) and `nextNodeId`. The engine only schedules `choice.chainTriggers` (`src/stores/narrativeStore.ts` around line 448). No scene-level chain field is read.
- "Legacy" scenes use `dialogue` / `segments` / `choices` with `nextSegment`. `narrativeStore.ts` around lines 241 and 646 still plays them, so they are playable.
- Window rule from the work order: a meeting is offered when its agenda window and its scene window both contain the week. Deadline defaults to start+2 when a scene has none.

## 1. Orphans (33): one row each

| # | Scene id | Proposal | One-line evidence |
| --- | --- | --- | --- |
| 1 | `act1_brenner_defense_briefing` | SCHEDULE_CHAIN | Pre-9a27631 ball choice brenner_talk (flag ball_brenner_talked) chainTriggered this scene at d1 (week 2). |
| 2 | `act1_chain_kolvar_opposition` | SCHEDULE_CHAIN | Pre-3f298e6 the inauguration choices inaugural_radical (chains kolvar_opposition d2 and vael_pressure d5) and inaugural_reformist (kolvar_opposition d3) carried these chains. |
| 3 | `act1_chain_kravenstal_unrest` | UNSURE | Old source: act1_week3_first_budget / fiscal_austerity (flags fiscal_austerity, chain d4). |
| 4 | `act1_chain_tyvaren_propaganda_war` | UNSURE | Old source: act1_week7_tyvaren_airspace / tyvaren_airspace_public_condemnation (flags tyvaren_publicly_condemned, airspace_incident_public; chain d3). |
| 5 | `act1_chain_vael_pressure` | SCHEDULE_CHAIN | Pre-3f298e6 inaugural_radical chained this scene at d5. |
| 6 | `act1_kolvar_counterattack` | UNSURE | Pre-9a27631 ball choice toast_reform (flag inaugural_toast_bold) chained this scene at d3 (week 4, matches weekAvailable 4). |
| 7 | `act1_kolvar_opposition_rally` | UNSURE | Pre-9a27631 ball choice kolvar_cold (flag ball_kolvar_cold) chained this scene at d2 (week 3, matches weekAvailable 3). |
| 8 | `act1_nadia_exclusive_interview` | SUPERSEDED (by act2_week22_nadia_investigation) | Same title ("On The Record") and same character (nadia_voss). |
| 9 | `act1_renek_sermon` | UNSURE | Pre-9a27631 ball choice renek_decline (flag ball_renek_declined) chained this scene at d4 (week 5, matches weekAvailable 5). |
| 10 | `act1_vael_party_funding` | SCHEDULE_AGENDA | Created in da7bb9a and never referenced since. |
| 11 | `act1_vael_private_meeting` | SCHEDULE_CHAIN | Pre-9a27631 ball choice vael_accept (flag ball_vael_meeting_scheduled) chained this scene at d2. |
| 12 | `act1_week10_law_enforcement_choice` | SCHEDULE_AGENDA | Scene is a complete 4-choice meeting (8 narrative segments). |
| 13 | `act1_week20_stellamere_summit` | SUPERSEDED (by act2_week21_visit_stellamere) | Same Stellamere setting and same Ambassador Cole beat. |
| 14 | `act1_week3_armadine_investment` | SCHEDULE_AGENDA | No agenda entry references any armadine id. |
| 15 | `act1_week4_elena_introduction` | SCHEDULE_AGENDA | This scene is the only setter of flag elena_introduced. |
| 16 | `act2_deficit_crisis` | UNSURE | Old source: act1_week3_first_budget / fiscal_growth_investment (flags fiscal_growth_deficit, chain d14). |
| 17 | `act2_diplomacy_arcturian_trade` | UNSURE | Created in da7bb9a, never referenced. |
| 18 | `act2_superpower_coldness` | UNSURE | Pre-9a27631 ball choice foreign_neither (flag ball_visited_neither) chained this scene at d20, which lands exactly at week 21. |
| 19 | `act2_week18_vael_fund` | UNSURE | Created in da7bb9a, never referenced. |
| 20 | `act2_week20_oligarch_meeting` | UNSURE | Created in da7bb9a, never referenced. |
| 21 | `act2_week29_sovarka_approach` | SCHEDULE_AGENDA | Commit 3a9e578 says "Wire Sovarka arc into week schedule (weeks 29/33/37)", but no agenda entry exists for weeks 29/33/37 (only agenda_w88_sovarka_europium references the arc). |
| 22 | `act3_chain_assassination_attempt` | SUPERSEDED (by act3_assassination_default / act3_assassination_sniper / act3_assassination_bombing / a...) | AssassinationEngine.ts (lines ~112-118) picks the four act3_assassination_* variants. |
| 23 | `act3_chain_voss_military_use` | UNSURE | Added as a stub in dfa0972 with act3_chain_voss_betrayal_discovered and act3_chain_voss_international_pressure. |
| 24 | `act3_church_active_opposition_scene` | UNSURE | Started as stub act3_church_active_opposition (3a9e578), renamed to _scene in 74cbfe4 to fix an id clash. |
| 25 | `act3_diplomacy_tyvaren_peace` | SUPERSEDED (by act3_week32_tyvaren_ultimatum) | Same week-32 Vukov ultimatum beat. |
| 26 | `act3_tyvaren_pressure` | UNSURE | No agenda, no inbound edges. |
| 27 | `family_referendum_night` | UNSURE | Parent act2_week26_referendum (4 choices, each chainTrigger d0 to this scene) was deleted in e15334f as a dead duplicate. |
| 28 | `news_inauguration_gazette` | NOT_A_MEETING | Full "Sevagrad Gazette" special-edition page (type news, one close choice, sets read_gazette_inauguration, which nothing reads). |
| 29 | `news_inauguration_herald` | NOT_A_MEETING | Same pattern: "Ashenmere Herald" special edition (read_herald_inauguration, unread). |
| 30 | `news_inauguration_worker` | NOT_A_MEETING | Same pattern: "Kravenstal Worker" special edition (read_worker_inauguration, unread). |
| 31 | `social_autumn_festival_wk18` | SCHEDULE_AGENDA | Type social_event, window 18-null, no agenda or inbound edge. |
| 32 | `social_independence_parade_wk36` | SCHEDULE_AGENDA | Same as above: type social_event, window 36-null, no launch path, in freeze.test.ts. |
| 33 | `social_state_dinner_wk24` | SCHEDULE_AGENDA | Same as social_autumn_festival_wk18: type social_event, window 24-null, no launch path, in freeze.test.ts. |

## 2. Mis-targeted agenda entries (7)

| Entry | Current target | Verdict | One-line evidence |
| --- | --- | --- | --- |
| `agenda_w7_cabinet_session` (7-10) | `act1_week1_first_briefing` (1-3) | NO_MATCH | Entry describes a full-cabinet session with Brenner presenting the military assessment (window 7-10). |
| `agenda_w13_cabinet_confidence` (13-15) | `act1_week4_first_month` (4-6) | NO_MATCH | Entry describes ministers being courted before the vote. |
| `agenda_w23_refugee_update` (23-26) | `act2_week19_refugee_flood` (19-20) | NO_MATCH | Entry is about winterizing the Ondra camps before the first frost. |
| `agenda_w27_arcturian_review` (27-32) | `act2_week21_superpower_choice` (21-24) | RETARGET -> act3_arcturian_cooldown | Title "The Ambassador's Silence" (window 27-null) matches the entry text: three meeting requests unanswered, quarterly trade talks postponed. |
| `agenda_w33_superpower_pressure` (33-38) | `act2_week21_superpower_choice` (21-24) | RETARGET -> act3_superpower_pressure | act3_superpower_pressure ("The Superpowers Weigh In", window 1-null) is the matching content: both superpowers' cables demanding a decision, with "basing" and "trade concession" options. |
| `agenda_w38_liora_recovery` (38-42) | `act3_liora_reconciliation` (27-32) | NO_MATCH | Entry is the homecoming after the coup attempt (coup is act3_week37_coup_attempt, 37-38). |
| `agenda_w51_new_order` (51-52) | `act4_week47_new_order` (47-49) | NO_MATCH (duplicate) | Content of act4_week47_new_order ("The New Veltria": final reform bill passes; choice "make sure they survive the next government") is already scheduled by agenda_w47_new_order (47-49). |

## 3. Proposed agenda entries (SCHEDULE_AGENDA, 8)

Nothing has been written. Each block is the exact JSON to append to the named week file.

### act1_vael_party_funding
File: `src/data/agenda/week04.json`
```json
{
  "id": "agenda_w04_vael_party_funding",
  "title": "The Margrave's Generosity",
  "description": "Lucan Vael does not schedule appointments.",
  "category": "meeting",
  "sceneId": "act1_vael_party_funding",
  "slotCost": 1,
  "executionOrder": 5,
  "weekAvailable": 4,
  "weekDeadline": 6
}
```
Note: Type is "event" with no category map; "meeting" chosen by analogy. Alternative: chain it from act1_vael_private_meeting, which is a stub with no consequences.

### act1_week10_law_enforcement_choice
File: `src/data/agenda/week10.json`
```json
{
  "id": "agenda_w10_law_enforcement_choice",
  "title": "The Law Enforcement Question",
  "description": "The morning briefing has barely ended when Danika Oberlin sets a thick folder on your desk.",
  "category": "meeting",
  "sceneId": "act1_week10_law_enforcement_choice",
  "slotCost": 1,
  "executionOrder": 5,
  "weekAvailable": 10,
  "weekDeadline": 12
}
```

### act1_week3_armadine_investment
File: `src/data/agenda/week03.json`
```json
{
  "id": "agenda_w03_armadine_investment",
  "title": "An Investment Opportunity",
  "description": "A letter arrives at your personal residence, not your office.",
  "category": "meeting",
  "sceneId": "act1_week3_armadine_investment",
  "slotCost": 1,
  "executionOrder": 5,
  "weekAvailable": 3,
  "weekDeadline": 6
}
```

### act1_week4_elena_introduction
File: `src/data/agenda/week04.json`
```json
{
  "id": "agenda_w04_elena_introduction",
  "title": "The Media Magnate",
  "description": "Elena Braskov's office occupies the top floor of VNN Broadcasting House — a building her father built in 1948, at the height of Halvek's power.",
  "category": "meeting",
  "sceneId": "act1_week4_elena_introduction",
  "slotCost": 1,
  "executionOrder": 5,
  "weekAvailable": 4,
  "weekDeadline": 6
}
```
Note: Verify the flag name the notebook refers to ("the Broadcast Licensing Act") matches the current agenda timing before scheduling.

### act2_week29_sovarka_approach
File: `src/data/agenda/week29.json`
```json
{
  "id": "agenda_w29_sovarka_approach",
  "title": "The Schoolteacher's Republic",
  "description": "He is already there. He is always already there. He is standing at the window looking at the palace gardens in the early light.",
  "category": "meeting",
  "sceneId": "act2_week29_sovarka_approach",
  "slotCost": 1,
  "executionOrder": 5,
  "weekAvailable": 29,
  "weekDeadline": 31
}
```
Note: Legacy-format scene (segments). Description taken from segment krel_discovery_brief.

### social_autumn_festival_wk18
File: `src/data/agenda/week18.json`
```json
{
  "id": "agenda_w18_social_autumn_festival",
  "title": "The Ashenmere Autumn Festival",
  "description": "The Ashenmere Autumn Festival transforms the Old Town Square.",
  "category": "social",
  "sceneId": "social_autumn_festival_wk18",
  "slotCost": 1,
  "executionOrder": 5,
  "weekAvailable": 18,
  "weekDeadline": 20
}
```
Note: Confirm socialInteractions renders through ConversationPanel before scheduling.

### social_independence_parade_wk36
File: `src/data/agenda/week36.json`
```json
{
  "id": "agenda_w36_social_independence_parade",
  "title": "Independence Day Military Parade",
  "description": "The Avenue of the Republic stretches before you, lined with Veltrian flags snapping in a cold autumn wind.",
  "category": "social",
  "sceneId": "social_independence_parade_wk36",
  "slotCost": 1,
  "executionOrder": 5,
  "weekAvailable": 36,
  "weekDeadline": 38
}
```
Note: Same renderer check as above.

### social_state_dinner_wk24
File: `src/data/agenda/week24.json`
```json
{
  "id": "agenda_w24_social_state_dinner",
  "title": "The State Dinner",
  "description": "The State Dining Room has been transformed.",
  "category": "social",
  "sceneId": "social_state_dinner_wk24",
  "slotCost": 1,
  "executionOrder": 5,
  "weekAvailable": 24,
  "weekDeadline": 26
}
```
Note: Same renderer check as above.

## 4. Proposed chain triggers (SCHEDULE_CHAIN, 4)

### act1_brenner_defense_briefing
- Add to `social_inaugural_ball_wk1` choice `ball_speak_brenner`: `{ "targetNodeId": "act1_brenner_defense_briefing", "delayWeeks": 1 }` in its chainTriggers (week 2 = scene weekAvailable 2).
- Evidence: Pre-9a27631 ball choice brenner_talk (flag ball_brenner_talked) chainTriggered this scene at d1 (week 2).

### act1_chain_kolvar_opposition
- Add to `act1_week1_inauguration` choice `speech_personal`: `{ "targetNodeId": "act1_chain_kolvar_opposition", "delayWeeks": 2 }` in its chainTriggers (week 3).
- Add to `act1_week1_inauguration` choice `speech_reform`: `{ "targetNodeId": "act1_chain_kolvar_opposition", "delayWeeks": 3 }` in its chainTriggers (week 4).
- Evidence: Pre-3f298e6 the inauguration choices inaugural_radical (chains kolvar_opposition d2 and vael_pressure d5) and inaugural_reformist (kolvar_opposition d3) carried these chains.

### act1_chain_vael_pressure
- Add to `act1_week1_inauguration` choice `speech_personal`: `{ "targetNodeId": "act1_chain_vael_pressure", "delayWeeks": 5 }` in its chainTriggers (week 6).
- Evidence: Pre-3f298e6 inaugural_radical chained this scene at d5.

### act1_vael_private_meeting
- Add to `social_inaugural_ball_wk1` choice `ball_speak_vael`: `{ "targetNodeId": "act1_vael_private_meeting", "delayWeeks": 2 }` in its chainTriggers (week 3 = scene weekAvailable 3).
- Evidence: Pre-9a27631 ball choice vael_accept (flag ball_vael_meeting_scheduled) chained this scene at d2.

## 5. Per-orphan facts and history

### act1_brenner_defense_briefing
- File: `src/data/narrative/act1/act1_brenner_defense_briefing.json`
- Title: "The General's Assessment" | type meeting | window 2-null | location: Defense Briefing Room — Ashenmere Palace | characters: ["oskar_brenner"]
- Prerequisites: []
- Choices: 1 top-level, 3 nested choice-like objects. Flags set: brenner_briefing_oversight_stated, brenner_briefing_names_requested
- Chains out: none
- Chains in: none | agenda refs: none
- History (git log -S "<id>" -- src): 3 commits; oldest da7bb9a; newest 9a27631.
  - Reference removed in 9a27631: `b/src/data/narrative/act1/social_inaugural_ball_wk1.json: - { "targetNodeId": "act1_brenner_defense_briefing", "delayWeeks": 1 }`
- Duplicate/overlap candidates: act2_week25_brenner_warning (25-27, "The General's Warning", title~0.50); act3_brenner_negotiation (37-null, "The General's Terms", title~0.50); act3_brenner_response (1-null, "The General's Visit", title~0.50,wk±1+chars(1)); act6_week69_generals_toast (69-71, "The General's Toast", title~0.50)
- Downstream: closure size 0; likelyBugs scenes hanging from it: none
- Proposal: **SCHEDULE_CHAIN**. 

### act1_chain_kolvar_opposition
- File: `src/data/narrative/act1/act1_chain_kolvar_opposition.json`
- Title: "The First Obstruction" | type crisis | window 1-null | location: Chancellor's Office — Ashenmere Palace | characters: ["vyktor_reznik","drazen_kolvar"]
- Prerequisites: []
- Choices: 4 top-level, 4 nested choice-like objects. Flags set: kolvar_overridden, executive_authority_asserted, kolvar_coopted, parliamentary_transparency, kolvar_resolved, kolvar_deal_made, backchannel_negotiated, kolvar_publicly_confronted, populist_appeal
- Chains out: choice:kolvar_override_executive->act1_chain_kolvar_escalation d5
- Chains in: none | agenda refs: none
- History (git log -S "<id>" -- src): 2 commits; oldest da7bb9a; newest 3f298e6.
  - Reference removed in 3f298e6: `b/src/data/narrative/act1/act1_week1_inauguration.json: - { "targetNodeId": "act1_chain_kolvar_opposition", "delayWeeks": 3 },` ; `b/src/data/narrative/act1/act1_week1_inauguration.json: - { "targetNodeId": "act1_chain_kolvar_opposition", "delayWeeks": 2 },`
- Duplicate/overlap candidates: act1_chain_kolvar_escalation (1-null, "The Halvekist Offensive", wk±1+chars(2)); act1_w2_formation_meeting (2-2, "The Cabinet Formation", wk±1+chars(2)); act3_confidence_vote (1-null, "The Arithmetic of Survival", wk±1+chars(2)); act3_kolvar_negotiation (1-null, "Dealing with Kolvar", wk±1+chars(2))
- Downstream: closure size 117; likelyBugs scenes hanging from it: act1_chain_kolvar_escalation
- Proposal: **SCHEDULE_CHAIN**. 

### act1_chain_kravenstal_unrest
- File: `src/data/narrative/act1/act1_chain_kravenstal_unrest.json`
- Title: "The Kravenstal Response" | type crisis | window 1-null | location: Kravenstal — Industrial District | characters: ["gregor_maric","elara_vostane"]
- Prerequisites: []
- Choices: 3 top-level, 3 nested choice-like objects. Flags set: kravenstal_concessions, welfare_frozen, kravenstal_resolved, kravenstal_dialogue, shop_stewards_met, kravenstal_refused, budget_held_firm
- Chains out: choice:kravenstal_negotiate_maric->act1_chain_budget_revision d3; choice:kravenstal_hold_firm->act1_chain_kravenstal_escalation d4
- Chains in: none | agenda refs: none
- History (git log -S "<id>" -- src): 3 commits; oldest da7bb9a; newest b2ec4ba.
  - Reference removed in 3f298e6: `b/src/data/narrative/act1/act1_week3_first_budget.json: - "targetNodeId": "act1_chain_kravenstal_unrest",`
- Duplicate/overlap candidates: act1_chain_budget_revision (1-null, "The Revised Ledger", wk±1+chars(2)); act1_chain_ima_confrontation (1-null, "The Structural Adjustment", wk±1+chars(2)); act1_w2_formation_meeting (2-2, "The Cabinet Formation", wk±1+chars(2)); act2_econ_mixed_challenges (1-null, "The Middle Path", wk±1+chars(2))
- Downstream: closure size 120; likelyBugs scenes hanging from it: act1_chain_budget_revision
- Proposal: **UNSURE**. Decision needed: Which current choice should own the austerity consequence. act1_week3_economic_direction is the modern fiscal fork (econ_planned / econ_mixed / econ_pragmatic / econ_free_market) but its chains go elsewhere.

### act1_chain_tyvaren_propaganda_war
- File: `src/data/narrative/act1/act1_chain_tyvaren_propaganda_war.json`
- Title: "The Marshal's Language" | type crisis | window 1-null | location: Chancellor's Private Study — Ashenmere Palace | characters: ["vyktor_reznik"]
- Prerequisites: []
- Choices: 3 top-level, 3 nested choice-like objects. Flags set: vukov_directly_confronted, tyvaren_propaganda_answered, orythian_solidarity_accepted, tyvaren_multilateral_response, tyvaren_propaganda_deescalated, arcturian_guidance_followed
- Chains out: choice:propaganda_war_orythian_support->act2_week21_superpower_choice d7
- Chains in: none | agenda refs: none
- History (git log -S "<id>" -- src): 2 commits; oldest da7bb9a; newest 3f298e6.
  - Reference removed in 3f298e6: `b/src/data/narrative/act1/act1_week7_tyvaren_airspace.json: - "targetNodeId": "act1_chain_tyvaren_propaganda_war",`
- Duplicate/overlap candidates: act3_diplomacy_tyvaren_peace (32-null, "The Marshal's Ultimatum", title~0.50)
- Downstream: closure size 113; likelyBugs scenes hanging from it: none
- Proposal: **UNSURE**. Decision needed: Which Tyvaren choice in the current week-7 flow (or act3_tyvaren_retaliation) should trigger it.

### act1_chain_vael_pressure
- File: `src/data/narrative/act1/act1_chain_vael_pressure.json`
- Title: "The Margrave's Invitation" | type event | window 1-null | location: Vael Estate — Thornfeld Valley | characters: ["lucan_vael"]
- Prerequisites: []
- Choices: 4 top-level, 4 nested choice-like objects. Flags set: vael_rebuffed, consortium_hostile, vael_resolved, vael_negotiated, consortium_moderate, vael_coopted, vael_advisor, vael_threatened, bni_files_weaponized
- Chains out: choice:vael_refuse_politely->act1_chain_capital_strike d4
- Chains in: none | agenda refs: none
- History (git log -S "<id>" -- src): 2 commits; oldest da7bb9a; newest 3f298e6.
  - Reference removed in 3f298e6: `b/src/data/narrative/act1/act1_week1_inauguration.json: - { "targetNodeId": "act1_chain_vael_pressure", "delayWeeks": 5 },` ; `b/src/data/narrative/act1/act1_week2_cabinet_appointments.json: - "targetNodeId": "act1_chain_vael_pressure",` ; `b/src/data/narrative/act1/act1_week3_first_budget.json: - "targetNodeId": "act1_chain_vael_pressure",`
- Duplicate/overlap candidates: act1_vael_party_funding (4-null, "The Margrave's Generosity", title~0.50); act1_vael_private_meeting (3-null, "The Margrave's Proposal", title~0.50)
- Downstream: closure size 48; likelyBugs scenes hanging from it: act1_chain_capital_strike, act2_ima_conditionality_review
- Proposal: **SCHEDULE_CHAIN**. 

### act1_kolvar_counterattack
- File: `src/data/narrative/act1/act1_kolvar_counterattack.json`
- Title: "The Counterattack" | type meeting | window 4-null | location: Chancellor's Office — Ashenmere Palace | characters: ["vyktor_reznik"]
- Prerequisites: []
- Choices: 1 top-level, 3 nested choice-like objects. Flags set: kolvar_counterattack_legal, kolvar_counterattack_ignored
- Chains out: none
- Chains in: none | agenda refs: none
- History (git log -S "<id>" -- src): 3 commits; oldest da7bb9a; newest 9a27631.
  - Reference removed in 9a27631: `b/src/data/narrative/act1/social_inaugural_ball_wk1.json: - { "targetNodeId": "act1_kolvar_counterattack", "delayWeeks": 3 }`
- Downstream: closure size 0; likelyBugs scenes hanging from it: none
- Proposal: **UNSURE**. Decision needed: Restore a Kolvar branch to the inaugural ball, or retire the scene. Stub: one choice, no narrative segments.

### act1_kolvar_opposition_rally
- File: `src/data/narrative/act1/act1_kolvar_opposition_rally.json`
- Title: "The Halvekist Response" | type meeting | window 3-null | location: Chancellor's Office — Ashenmere Palace | characters: ["vyktor_reznik"]
- Prerequisites: []
- Choices: 1 top-level, 3 nested choice-like objects. Flags set: kolvar_rally_ignored, kolvar_rally_challenged
- Chains out: none
- Chains in: none | agenda refs: none
- History (git log -S "<id>" -- src): 3 commits; oldest da7bb9a; newest 9a27631.
  - Reference removed in 9a27631: `b/src/data/narrative/act1/social_inaugural_ball_wk1.json: - { "targetNodeId": "act1_kolvar_opposition_rally", "delayWeeks": 2 }`
- Downstream: closure size 0; likelyBugs scenes hanging from it: none
- Proposal: **UNSURE**. Decision needed: Restore a Kolvar branch to the ball, or retire. Stub: one choice, no narrative segments.

### act1_nadia_exclusive_interview
- File: `src/data/narrative/act1/act1_nadia_exclusive_interview.json`
- Title: "On The Record" | type meeting | window 2-null | location: Chancellor's Private Study — Ashenmere Palace | characters: ["nadia_voss"]
- Prerequisites: []
- Choices: 1 top-level, 3 nested choice-like objects. Flags set: nadia_interview_transparent, nadia_interview_partial
- Chains out: none
- Chains in: none | agenda refs: none
- History (git log -S "<id>" -- src): 3 commits; oldest da7bb9a; newest 9a27631.
  - Reference removed in 9a27631: `b/src/data/narrative/act1/social_inaugural_ball_wk1.json: - { "targetNodeId": "act1_nadia_exclusive_interview", "delayWeeks": 1 }`
- Duplicate/overlap candidates: act2_week22_nadia_investigation (22-26, "On the Record", title~1.00)
- Downstream: closure size 0; likelyBugs scenes hanging from it: none
- Proposal: **SUPERSEDED** (confidence medium). 

### act1_renek_sermon
- File: `src/data/narrative/act1/act1_renek_sermon.json`
- Title: "The Shepherd Speaks" | type meeting | window 5-null | location: Chancellor's Office — Ashenmere Palace | characters: ["vyktor_reznik"]
- Prerequisites: []
- Choices: 1 top-level, 3 nested choice-like objects. Flags set: renek_sermon_ignored, renek_sermon_engaged
- Chains out: none
- Chains in: none | agenda refs: none
- History (git log -S "<id>" -- src): 3 commits; oldest da7bb9a; newest 9a27631.
  - Reference removed in 9a27631: `b/src/data/narrative/act1/social_inaugural_ball_wk1.json: - { "targetNodeId": "act1_renek_sermon", "delayWeeks": 4 }`
- Downstream: closure size 0; likelyBugs scenes hanging from it: none
- Proposal: **UNSURE**. Decision needed: Confirm whether ball_speak_renek should carry the d4 chain, or whether the sermon should be retired. Stub: one choice.

### act1_vael_party_funding
- File: `src/data/narrative/act1/act1_vael_party_funding.json`
- Title: "The Margrave's Generosity" | type event | window 4-null | location: Chancellor's Office — Ashenmere Palace | characters: ["lucan_vael","vyktor_reznik"]
- Prerequisites: []
- Choices: 3 top-level, 3 nested choice-like objects. Flags set: vael_party_funded, vael_relationship_warm, vael_funding_refused, vael_relationship_cool, vael_funding_compromised, vael_relationship_neutral, blind_trust_established
- Chains out: choice:vael_funding_accept->act1_vael_hospital_kravenstal d4; choice:vael_funding_refuse->act1_vael_hospital_kravenstal d4; choice:vael_funding_counter->act1_vael_hospital_kravenstal d4
- Chains in: none | agenda refs: none
- History (git log -S "<id>" -- src): 1 commits; oldest da7bb9a; newest da7bb9a.
- Duplicate/overlap candidates: act1_chain_vael_pressure (1-null, "The Margrave's Invitation", title~0.50); act1_vael_private_meeting (3-null, "The Margrave's Proposal", title~0.50,wk±1+chars(2))
- Downstream: closure size 7; likelyBugs scenes hanging from it: act1_vael_hospital_kravenstal, act1_vael_estate_dinner, act2_vael_steel_mills, act2_vael_referendum_funding, act3_vael_block_wealth_tax, act3_vael_minister_demand, act4_vael_final_offer
- Proposal: **SCHEDULE_AGENDA**. 

### act1_vael_private_meeting
- File: `src/data/narrative/act1/act1_vael_private_meeting.json`
- Title: "The Margrave's Proposal" | type meeting | window 3-null | location: Chancellor's Office — Ashenmere Palace | characters: ["lucan_vael","vyktor_reznik"]
- Prerequisites: []
- Choices: 1 top-level, 3 nested choice-like objects. Flags set: vael_regulatory_review_opened, vael_regulatory_declined
- Chains out: none
- Chains in: none | agenda refs: none
- History (git log -S "<id>" -- src): 3 commits; oldest da7bb9a; newest 9a27631.
  - Reference removed in 9a27631: `b/src/data/narrative/act1/social_inaugural_ball_wk1.json: - { "targetNodeId": "act1_vael_private_meeting", "delayWeeks": 2 }`
- Duplicate/overlap candidates: act1_chain_vael_pressure (1-null, "The Margrave's Invitation", title~0.50); act1_vael_party_funding (4-null, "The Margrave's Generosity", title~0.50,wk±1+chars(2)); act2_econ_vael_approach (1-null, "Vael's Proposal", title~0.50)
- Downstream: closure size 0; likelyBugs scenes hanging from it: none
- Proposal: **SCHEDULE_CHAIN**. 

### act1_week10_law_enforcement_choice
- File: `src/data/narrative/act1/act1_week10_law_enforcement_choice.json`
- Title: "The Law Enforcement Question" | type meeting | window 10-12 | location: Chancellor's Office — The Ashenmere Palace | characters: ["danika_oberlin","aldric_theron","vyktor_reznik"]
- Prerequisites: []
- Choices: 4 top-level, 4 nested choice-like objects. Flags set: bca_funded, law_enforcement_choice_made, ssd_funded, both_agencies_weakened, neither_agency_funded
- Chains out: choice:fund_bca->act1_chain_bca_investigation d1; choice:fund_ssd->act1_chain_ssd_operations d1; choice:fund_both_weakened->act1_chain_both_agencies_conflict d1; choice:fund_neither->act1_chain_no_agency_vacuum d4
- Chains in: none | agenda refs: none
- History (git log -S "<id>" -- src): 1 commits; oldest da7bb9a; newest da7bb9a.
- Duplicate/overlap candidates: act1_chain_bca_investigation (11-null, "The BCA Opens Its First Case", wk±1+chars(2)); act1_chain_both_agencies_conflict (11-null, "The First Collision", wk±1+chars(2)); act1_week10_church_education (10-null, "The Schools Question", wk±1+chars(2)); act1_week10_reform_committee (10-12, "The Reform Committee", wk±1+chars(2))
- Downstream: closure size 4; likelyBugs scenes hanging from it: act1_chain_bca_investigation, act1_chain_ssd_operations, act1_chain_both_agencies_conflict, act1_chain_no_agency_vacuum
- Proposal: **SCHEDULE_AGENDA**. 

### act1_week20_stellamere_summit
- File: `src/data/narrative/act1/act1_week20_stellamere_summit.json`
- Title: "The Stellamere Summit" | type diplomacy | window 20-22 | location: Grand Hall — Stellamere, Neutral Territory | characters: ["vyktor_reznik","dragan_vukov","harrison_cole"]
- Prerequisites: []
- Choices: 3 top-level, 10 nested choice-like objects. Flags set: stellamere_orythian_lean, stellamere_tyvaren_acknowledged, stellamere_non_aligned
- Chains out: none
- Chains in: none | agenda refs: none
- History (git log -S "<id>" -- src): 1 commits; oldest b5f0f95; newest b5f0f95.
- Duplicate/overlap candidates: act2_week21_superpower_choice (21-24, "Two Invitations", wk±1+chars(2)); act2_week21_visit_stellamere (21-26, "The Federal Hall", wk±1+chars(2))
- Downstream: closure size 0; likelyBugs scenes hanging from it: none
- Proposal: **SUPERSEDED** (confidence medium). 

### act1_week3_armadine_investment
- File: `src/data/narrative/act1/act1_week3_armadine_investment.json`
- Title: "An Investment Opportunity" | type meeting | window 3-6 | location: A Private Club — Ashenmere Financial District | characters: []
- Prerequisites: []
- Choices: 3 top-level, 3 nested choice-like objects. Flags set: armadine_invested, conflict_of_interest_steel, armadine_declined, ethical_governance, armadine_jonas_invested, plausible_deniability
- Chains out: choice:armadine_invest->act3_armadine_steel_return d27; choice:armadine_invest_pass_along->act3_armadine_steel_return_jonas d27
- Chains in: none | agenda refs: none
- History (git log -S "<id>" -- src): 1 commits; oldest da7bb9a; newest da7bb9a.
- Downstream: closure size 2; likelyBugs scenes hanging from it: act3_armadine_steel_return, act3_armadine_steel_return_jonas
- Proposal: **SCHEDULE_AGENDA**. 

### act1_week4_elena_introduction
- File: `src/data/narrative/act1/act1_week4_elena_introduction.json`
- Title: "The Media Magnate" | type meeting | window 4-6 | location: VNN Broadcasting House — Ashenmere | characters: ["elena_braskov"]
- Prerequisites: []
- Choices: 3 top-level, 3 nested choice-like objects. Flags set: media_deal, elena_ally, broadcast_licensing_killed, elena_introduced, elena_declined, press_freedom_priority, elena_neutral, elena_delayed_decision
- Chains out: none
- Chains in: none | agenda refs: none
- History (git log -S "<id>" -- src): 1 commits; oldest da7bb9a; newest da7bb9a.
- Downstream: closure size 0; likelyBugs scenes hanging from it: none
- Proposal: **SCHEDULE_AGENDA**. 

### act2_deficit_crisis
- File: `src/data/narrative/act2/act2_deficit_crisis.json`
- Title: "The Krone Falls" | type emergency | window 16-null | location: Finance Ministry — Budget Office | characters: ["elara_vostane","gregor_maric","vyktor_reznik"]
- Prerequisites: [{"stat":"nation.nationalDebt","operator":">","value":450}]
- Choices: 3 top-level, 3 nested choice-like objects. Flags set: debt_default_declared, ima_engagement_suspended, fiscal_sovereignty_retained, ima_deal_accepted, ima_full_conditions_accepted, deficit_crisis_stabilized, vael_nationalized, emergency_asset_seizure
- Chains out: choice:deficit_crisis_default->act3_week28_economic_crisis d8; choice:deficit_crisis_vael_nationalize->act2_week18_vael_oligarch d1
- Chains in: none | agenda refs: none
- History (git log -S "<id>" -- src): 2 commits; oldest da7bb9a; newest 3f298e6.
  - Reference removed in 3f298e6: `b/src/data/narrative/act1/act1_week3_first_budget.json: - "targetNodeId": "act2_deficit_crisis",`
- Duplicate/overlap candidates: act2_minority_refugee_health (17-null, "Fever in the Camps", wk±1+chars(2)); __project__kravenstal_steel (15-null, "The Kravenstal Steel Modernization", wk±1+chars(2))
- Downstream: closure size 116; likelyBugs scenes hanging from it: none
- Proposal: **UNSURE**. Decision needed: Whether the debt-gated emergency should be agenda-scheduled (emergency slotCost 0) or chained from a current economic choice.

### act2_diplomacy_arcturian_trade
- File: `src/data/narrative/diplomacy/act2_diplomacy_arcturian_trade.json`
- Title: "The Arcturian Equation" | type diplomacy | window 15-null | location: Arcturian Embassy — Ashenmere, Diplomatic Quarter | characters: ["harrison_cole","elara_vostane"]
- Prerequisites: []
- Choices: 3 top-level, 3 nested choice-like objects. Flags set: arcturian_trade_deal, arcturian_alignment, orythia_excluded, arcturian_trade_partial, strategic_exclusivity, trade_independence, arcturian_trade_refused, non_aligned_policy, sovereignty_first
- Chains out: choice:arcturian_trade_accept->act2_diplomacy_orythian_military d5; choice:arcturian_trade_counter->act2_diplomacy_orythian_military d5; choice:arcturian_trade_refuse->act2_diplomacy_orythian_military d5
- Chains in: none | agenda refs: none
- History (git log -S "<id>" -- src): 1 commits; oldest da7bb9a; newest da7bb9a.
- Downstream: closure size 4; likelyBugs scenes hanging from it: act2_diplomacy_orythian_military, act2_diplomacy_lytheira_debt, act3_diplomacy_arcturian_alliance, act3_diplomacy_morivask_border
- Proposal: **UNSURE**. Decision needed: Schedule the diplomacy line (and at which week) or retire it.

### act2_superpower_coldness
- File: `src/data/narrative/act2/act2_superpower_coldness.json`
- Title: "Neither Friend" | type meeting | window 21-null | location: Chancellor's Office — Ashenmere Palace | characters: ["vyktor_reznik"]
- Prerequisites: []
- Choices: 1 top-level, 4 nested choice-like objects. Flags set: superpower_cold_chose_west, superpower_cold_chose_east, superpower_cold_chose_neither
- Chains out: none
- Chains in: none | agenda refs: none
- History (git log -S "<id>" -- src): 3 commits; oldest da7bb9a; newest 9a27631.
  - Reference removed in 9a27631: `b/src/data/narrative/act1/social_inaugural_ball_wk1.json: - { "targetNodeId": "act2_superpower_coldness", "delayWeeks": 20 }`
- Downstream: closure size 0; likelyBugs scenes hanging from it: none
- Proposal: **UNSURE**. Decision needed: Choose the new trigger (suggest visit_neither_nonalignment) and the delay. Stub: one choice.

### act2_week18_vael_fund
- File: `src/data/narrative/act2/act2_week18_vael_fund.json`
- Title: "Vael's Private Fund" | type meeting | window 18-21 | location: Vael Estate — Thornfeld Valley | characters: ["lucan_vael"]
- Prerequisites: []
- Choices: 3 top-level, 3 nested choice-like objects. Flags set: vael_fund_invested, vael_investment, financially_entangled_vael, inside_the_circle, vael_fund_declined, stood_up_to_vael, vael_fund_invested_hidden, hidden_investment, offshore_holdings
- Chains out: choice:vael_fund_invest->act3_vael_fund_return d17; choice:vael_fund_invest_deniable->act3_vael_fund_return_hidden d17
- Chains in: none | agenda refs: none
- History (git log -S "<id>" -- src): 1 commits; oldest da7bb9a; newest da7bb9a.
- Duplicate/overlap candidates: act2_econ_vael_approach (1-null, "Vael's Proposal", title~0.40)
- Downstream: closure size 2; likelyBugs scenes hanging from it: act3_vael_fund_return, act3_vael_fund_return_hidden
- Proposal: **UNSURE**. Decision needed: Schedule as a second Vael beat in week 18, or retire.

### act2_week20_oligarch_meeting
- File: `src/data/narrative/act2/act2_week20_oligarch_meeting.json`
- Title: "The Room" | type null | window 20-null | location: Vael-Kross Tower — Boardroom, Ashenmere | characters: ["katerin_ashavel","vyktor_reznik","lucan_vael","other_oligarchs"]
- Prerequisites: []
- Choices: 3 top-level, 34 nested choice-like objects. Flags set: oligarch_deal_made, infrastructure_partnership, oligarch_limited_deal, oligarch_no_deal, vael_confronted_directly, mole_exposed
- Chains out: none
- Chains in: none | agenda refs: none
- History (git log -S "<id>" -- src): 1 commits; oldest da7bb9a; newest da7bb9a.
- Duplicate/overlap candidates: act1_week1_family_dinner (1-null, "The Quiet Room", title~0.50)
- Downstream: closure size 0; likelyBugs scenes hanging from it: none
- Proposal: **UNSURE**. Decision needed: Which trigger should bring this meeting, and whether the missing type should be set.

### act2_week29_sovarka_approach
- File: `src/data/narrative/act2/act2_week29_sovarka_approach.json`
- Title: "The Schoolteacher's Republic" | type meeting | window 29-null | location: Chancellor's Private Study — Ashenmere Palace | characters: ["matthias_krel","vyktor_reznik","andrei_luca"]
- Prerequisites: []
- Choices: 1 top-level, 25 nested choice-like objects. Flags set: sovarka_engaged, sovarka_relation_high, andrei_luca_met, sovarka_quiet, sovarka_deferred
- Chains out: choice:sovarka_full_end->act2_week33_sovarka_survey d4; choice:sovarka_quiet_end->act2_week33_sovarka_survey d4; choice:sovarka_defer_end->act2_week33_sovarka_survey d4
- Chains in: none | agenda refs: none
- History (git log -S "<id>" -- src): 1 commits; oldest 3a9e578; newest 3a9e578.
- Downstream: closure size 3; likelyBugs scenes hanging from it: act2_week33_sovarka_survey, act3_week37_sovarka_outcome, act3_chain_sovarka_tyvaren_response
- Proposal: **SCHEDULE_AGENDA**. 

### act3_chain_assassination_attempt
- File: `src/data/narrative/act3/act3_chain_assassination_attempt.json`
- Title: "Blood on the Palace Steps" | type emergency | window 1-null | location: Emergency Command Center — Ashenmere Palace, Sub-Level Three | characters: ["irina_dusek","danika_oberlin","vyktor_reznik","oskar_brenner"]
- Prerequisites: []
- Choices: 3 top-level, 3 nested choice-like objects. Flags set: assassination_survived, assassination_public_defiance, assassination_resolved, assassination_crackdown, assassination_international
- Chains out: choice:assassination_diplomatic_response->act3_diplomacy_arcturian_alliance d2
- Chains in: none | agenda refs: none
- History (git log -S "<id>" -- src): 1 commits; oldest da7bb9a; newest da7bb9a.
- Duplicate/overlap candidates: act1_chain_church_opposition (1-null, "The Pastoral Letter", wk±1+chars(2)); act1_chain_tyvaren_border_standoff (1-null, "The Second Week", wk±1+chars(2)); act1_week1_bni_discovery (1-null, "The Bureau's Shadow", wk±1+chars(2)); act1_week1_first_briefing (1-3, "The Full Picture", wk±1+chars(3))
- Downstream: closure size 2; likelyBugs scenes hanging from it: act3_diplomacy_arcturian_alliance, act3_diplomacy_morivask_border
- Proposal: **SUPERSEDED**. 

### act3_chain_voss_military_use
- File: `src/data/narrative/act3/act3_chain_voss_military_use.json`
- Title: "What the Engine Did" | type meeting | window 40-null | location: Chancellor's Office — Ashenmere Palace | characters: ["irina_dusek","vyktor_reznik"]
- Prerequisites: []
- Choices: 1 top-level, 3 nested choice-like objects. Flags set: voss_military_use_disclosed, voss_military_use_hidden
- Chains out: none
- Chains in: none | agenda refs: none
- History (git log -S "<id>" -- src): 1 commits; oldest dfa0972; newest dfa0972.
- Duplicate/overlap candidates: act1_family_liora_mikhael (3-10, "What They Did to Grandfather", title~0.40); act3_week40_border_ultimatum (40-40, "The Border Ultimatum", wk±1+chars(2))
- Downstream: closure size 0; likelyBugs scenes hanging from it: none
- Proposal: **UNSURE**. Decision needed: Which Voss choice (weeks 24/28/32 in the engine) should route to the military-use consequence.

### act3_church_active_opposition_scene
- File: `src/data/narrative/act3/act3_church_active_opposition_scene.json`
- Title: "The Shepherd Acts" | type crisis | window 38-null | location: Chancellor's Office — Ashenmere Palace | characters: ["vyktor_reznik","stanislov_renek"]
- Prerequisites: []
- Choices: 1 top-level, 3 nested choice-like objects. Flags set: church_opposition_engaged, church_opposition_held
- Chains out: none
- Chains in: none | agenda refs: none
- History (git log -S "<id>" -- src): 1 commits; oldest 74cbfe4; newest 74cbfe4.
- Downstream: closure size 0; likelyBugs scenes hanging from it: none
- Proposal: **UNSURE**. Decision needed: Which trigger should bring the active-opposition beat, or retire the stub.

### act3_diplomacy_tyvaren_peace
- File: `src/data/narrative/diplomacy/act3_diplomacy_tyvaren_peace.json`
- Title: "The Marshal's Ultimatum" | type diplomacy | window 32-null | location: Tyvaren Embassy — Ashenmere, Fortified Compound | characters: ["dragan_vukov","oskar_brenner","vyktor_reznik"]
- Prerequisites: []
- Choices: 3 top-level, 3 nested choice-like objects. Flags set: tyvaren_negotiation_attempted, counter_proposal, diplomatic_initiative, tyvaren_ultimatum_rejected, defiance_stance, war_path, tyvaren_stalled, diplomatic_delay, buying_time
- Chains out: choice:tyvaren_peace_counter->act4_week40_war_begins d8; choice:tyvaren_peace_refuse->act4_week40_war_begins d8; choice:tyvaren_peace_stall->act4_week40_war_begins d8
- Chains in: none | agenda refs: none
- History (git log -S "<id>" -- src): 1 commits; oldest da7bb9a; newest da7bb9a.
- Duplicate/overlap candidates: act1_chain_tyvaren_propaganda_war (1-null, "The Marshal's Language", title~0.50); act3_week32_tyvaren_ultimatum (32-34, "The Gravenmark Ultimatum", wk±1+chars(2))
- Downstream: closure size 21; likelyBugs scenes hanging from it: none
- Proposal: **SUPERSEDED** (confidence medium). 

### act3_tyvaren_pressure
- File: `src/data/narrative/act3/act3_tyvaren_pressure.json`
- Title: "The Eastern Wind" | type crisis | window 24-null | location: Chancellor's Office — Ashenmere Palace | characters: ["vyktor_reznik","elara_vostane"]
- Prerequisites: []
- Choices: 1 top-level, 9 nested choice-like objects. Flags set: tyvaren_pressure_absorbed, tyvaren_pressure_diplomatic, tyvaren_pressure_public, act3_tyvaren_pressure_complete
- Chains out: none
- Chains in: none | agenda refs: none
- History (git log -S "<id>" -- src): 2 commits; oldest 6a7f313; newest 5776a22.
- Downstream: closure size 0; likelyBugs scenes hanging from it: none
- Proposal: **UNSURE**. Decision needed: Suggested window 24-26 (crisis, slotCost 0) if the Morivask deal lands about week 18. Confirm that before scheduling.

### family_referendum_night
- File: `src/data/narrative/act2/family/family_referendum_night.json`
- Title: "The Night the Numbers Came In" | type personal | window 26-26 | location: The Private Quarters — Chancellor's Residence, Late | characters: ["jonas_ashavel","liora_ashavel","tomas_ashavel"]
- Prerequisites: []
- Choices: 2 top-level, 5 nested choice-like objects. Flags set: none
- Chains out: none
- Chains in: none | agenda refs: none
- History (git log -S "<id>" -- src): 2 commits; oldest da7bb9a; newest e15334f.
  - Reference removed in e15334f: `/dev/null: - "targetNodeId": "family_referendum_night",` ; `/dev/null: - "targetNodeId": "family_referendum_night",` ; `/dev/null: - "targetNodeId": "family_referendum_night",`
- Duplicate/overlap candidates: act3_week37_coup_attempt (37-38, "The Night the Tanks Came", title~0.50)
- Downstream: closure size 0; likelyBugs scenes hanging from it: none
- Proposal: **UNSURE**. Decision needed: Which trio choices should fire it (delay 0 injects mid-week), or retire it.

### news_inauguration_gazette
- File: `src/data/narrative/act1/news_inauguration_gazette.json`
- Title: "The Sevagrad Gazette" | type news | window 1-null | location: Sevagrad Gazette — Editorial Office | characters: []
- Prerequisites: []
- Choices: 1 top-level, 1 nested choice-like objects. Flags set: read_gazette_inauguration
- Chains out: none
- Chains in: none | agenda refs: none
- History (git log -S "<id>" -- src): 1 commits; oldest 38bae2b; newest 38bae2b.
- Downstream: closure size 0; likelyBugs scenes hanging from it: none
- Proposal: **NOT_A_MEETING**. 

### news_inauguration_herald
- File: `src/data/narrative/act1/news_inauguration_herald.json`
- Title: "The Ashenmere Herald" | type news | window 1-null | location: Ashenmere Herald — Press Room | characters: []
- Prerequisites: []
- Choices: 1 top-level, 1 nested choice-like objects. Flags set: read_herald_inauguration
- Chains out: none
- Chains in: none | agenda refs: none
- History (git log -S "<id>" -- src): 1 commits; oldest 38bae2b; newest 38bae2b.
- Downstream: closure size 0; likelyBugs scenes hanging from it: none
- Proposal: **NOT_A_MEETING**. 

### news_inauguration_worker
- File: `src/data/narrative/act1/news_inauguration_worker.json`
- Title: "The Kravenstal Worker" | type news | window 1-null | location: Kravenstal Worker — Editorial Office | characters: []
- Prerequisites: []
- Choices: 1 top-level, 1 nested choice-like objects. Flags set: read_worker_inauguration
- Chains out: none
- Chains in: none | agenda refs: none
- History (git log -S "<id>" -- src): 1 commits; oldest 38bae2b; newest 38bae2b.
- Downstream: closure size 0; likelyBugs scenes hanging from it: none
- Proposal: **NOT_A_MEETING**. 

### social_autumn_festival_wk18
- File: `src/data/narrative/act2/social_autumn_festival_wk18.json`
- Title: "The Ashenmere Autumn Festival" | type social_event | window 18-null | location: Ashenmere Old Town Square | characters: ["jonas_ashavel","stanislov_renek","soraya_khaled","lucan_vael","nadia_voss"]
- Prerequisites: []
- Choices: 0 top-level, 6 nested choice-like objects. Flags set: festival_chancellor_spoke, festival_jonas_spoke, festival_served_with_renek, festival_skipped_church, festival_joined_march, festival_saluted_march
- Chains out: none
- Chains in: none | agenda refs: none
- History (git log -S "<id>" -- src): 2 commits; oldest da7bb9a; newest ad7aebe.
- Downstream: closure size 0; likelyBugs scenes hanging from it: none
- Proposal: **SCHEDULE_AGENDA**. 

### social_independence_parade_wk36
- File: `src/data/narrative/act3/social_independence_parade_wk36.json`
- Title: "Independence Day Military Parade" | type social_event | window 36-null | location: Avenue of the Republic, Ashenmere | characters: ["oskar_brenner","irina_dusek","jonas_ashavel","liora_ashavel","tomas_ashavel"]
- Prerequisites: []
- Choices: 0 top-level, 13 nested choice-like objects. Flags set: parade_military_theme, parade_democracy_theme, parade_unity_theme, parade_waved_to_crowd, parade_walked_among_citizens, parade_praised_officers, parade_asserted_authority, parade_stayed_on_stand, parade_evacuated, parade_family_talk, parade_family_deferred, parade_showed_strength
- Chains out: choice:family_later->act4_marriage_crisis d6
- Chains in: none | agenda refs: none
- History (git log -S "<id>" -- src): 2 commits; oldest da7bb9a; newest ad7aebe.
- Downstream: closure size 1; likelyBugs scenes hanging from it: act4_marriage_crisis
- Proposal: **SCHEDULE_AGENDA**. 

### social_state_dinner_wk24
- File: `src/data/narrative/act2/social_state_dinner_wk24.json`
- Title: "The State Dinner" | type social_event | window 24-null | location: Chancellery State Dining Room, Ashenmere | characters: ["jonas_ashavel","elara_vostane","irina_dusek","harrison_cole","yevgeni_stahl"]
- Prerequisites: []
- Choices: 0 top-level, 5 nested choice-like objects. Flags set: dinner_seated_cole_right, dinner_seated_stahl_right, dinner_seated_equal, dinner_toast_partnership, dinner_toast_sovereignty
- Chains out: none
- Chains in: none | agenda refs: none
- History (git log -S "<id>" -- src): 2 commits; oldest da7bb9a; newest ad7aebe.
- Downstream: closure size 0; likelyBugs scenes hanging from it: none
- Proposal: **SCHEDULE_AGENDA**. 

## 6. Concerns and out-of-scope observations

- Commit 3f298e6 ("cabinet system + Stefan Morvec") rewrote the act1 week 1, 2, 3, 7 and 8 scenes. Their choice ids, flags and chain triggers were replaced. Five orphans lost their only entry point in that commit (kolvar_opposition, vael_pressure, kravenstal_unrest, tyvaren_propaganda_war, deficit_crisis).
- Commit 9a27631 ("rewrite inaugural ball") removed the ball branch chains. Those branches were the only entry points for seven orphans. The ball flags (ball_chose_*, ball_vael_meeting_scheduled and others) are read by nothing.
- Commit e15334f deleted act2_week26_referendum (parent of family_referendum_night). Its replacement trio has no link to the child.
- Agenda naming: week04.json uses `agenda_w4_*` (no zero pad), while week01.json uses `agenda_w01_*`. The proposals above use the two-digit form from the work order (`agenda_w04_*`). Pick one before writing.
- act2_week21_superpower_choice is the sceneId of five agenda entries (w18, w20, w21, w27, w33), and act2_week21_superpower_choice / visit_neither_nonalignment chains to itself at d3. This is probably intended, but it is worth a check, since two mis-targeted entries also point at that scene.
- Social events: commit 9a27631 removed SocialEvent routing from GameLayout, while SocialEvent.tsx still lists these ids and src/test/freeze.test.ts (ad7aebe) expects them to complete through socialInteractions. The renderer path must be confirmed before scheduling the three social entries.
- Sovarka arc: commit 3a9e578 says it wired weeks 29/33/37, but no agenda file has an entry for those weeks. act3_week37_sovarka_outcome depends on the same gap.
- Elena arc: the whole Elena line (agenda weeks 14, 28, 34, 45) is blocked by the orphan act1_week4_elena_introduction, the only setter of elena_introduced. This is the highest-impact orphan.
- Mole plant triggers removed in 3f298e6 were redundant: mole_week1_plant, mole_week2_plant and mole_week3_choice are launched via agenda/weekStore and have no inbound chains, so nothing regressed there.
- Chain-edge count from the recursive walker is 797; the report says 781. The orphan set itself matched exactly (33, zero inbound edges).

## 7. Files touched

- Created: orphan-classification.md and orphan-classification.json at the repo root (untracked). No other file was changed, and nothing was committed.

