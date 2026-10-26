# P2 — Narrative Graph Audit (READ-ONLY)

Inputs: `docs/audit/00-scenes.tsv`, `00-schema.md`, `00-inventory.md`; `.audit/audit-report.json` ABSENT (no `.audit/` dir).
Corpus: 522 scenes (`src/data/narrative/**/*.json`); 1010 internal `nextSegment` refs, 16 external `nextNodeId` refs, 768 chain `targetNodeId` refs.
Method: `_p2b.py` (link/dead), `_p2c2.py` (mandatory/orphan), `_p2d.py` (flags). Intermediates `_p2a_out.txt`, `_p2c_out.txt`, `_p2d_out.txt` retained in `docs/audit/`.

## 1. LINK GRAPH

Counts: BROKEN=0 CROSS_FILE=0 BACKWARD=165 DANGLING=865 DEAD=0 (see §2). INTERNAL_TOTAL=1010 EXTERNAL_TOTAL=16 CHAIN_TOTAL=768.

BROKEN (target missing): NONE. All 1010 `nextSegment` resolve in-file; all 16 `nextNodeId` resolve in registry; all 768 chain `targetNodeId` resolve in registry.

CROSS_FILE (segment ref into another file): NONE (0). No `nextSegment` value equals a scene id in another file.

BACKWARD (target week < source week): 165 — ALL are chain triggers to early-week chain templates (week 1), not external jumps. No `nextNodeId` backward found in sample; firing week = source week + `delayWeeks`, so JSON-week comparison over-flags chains. Full list in `_p2a_out.txt`. Sample:

- BACKWARD | src/data/narrative/act1/act1_family_jonas_challenge.json | act1_family_jonas_challenge | 3 | top[0] | jonas_explain_tradeoffs | chain:act1_chain_jonas_advisor | 1
- BACKWARD | src/data/narrative/act1/act1_family_jonas_challenge.json | act1_family_jonas_challenge | 3 | top[3] | jonas_shut_down | chain:act1_chain_jonas_press_rebellion | 1
- BACKWARD | src/data/narrative/act1/act1_family_liora_mikhael.json | act1_family_liora_mikhael | 3 | top[1] | liora_mikhael_investigating | chain:act1_chain_liora_archive | 1
- BACKWARD | src/data/narrative/act1/act1_family_liora_mikhael.json | act1_family_liora_mikhael | 3 | top[2] | liora_mikhael_complicated | chain:act1_chain_liora_archive | 1
- BACKWARD | src/data/narrative/act1/act1_family_liora_mikhael.json | act1_family_liora_mikhael | 3 | top[3] | liora_mikhael_silence | chain:act1_chain_liora_radicalized | 1
- BACKWARD | src/data/narrative/act1/act1_family_tomas_bullying.json | act1_family_tomas_bullying | 2 | top[3] | tomas_toughen_up | chain:act1_chain_tomas_nationalist | 1
- BACKWARD | src/data/narrative/act1/act1_week10_reform_committee.json | act1_week10_reform_committee | 10 | top[0] | reform_executive_path | chain:act1_chain_constitutional_crisis | 1
- BACKWARD | src/data/narrative/act1/act1_week12_nadia_voss.json | act1_week12_nadia_voss | 12 | top[2] | nadia_deflect_threat | chain:act1_chain_nadia_investigation | 1
- BACKWARD | src/data/narrative/act1/act1_week13_no_confidence.json | act1_week13_no_confidence | 13 | top[3] | no_confidence_executive_power | chain:act1_chain_executive_governance | 1
- BACKWARD | src/data/narrative/act1/act1_week3_economic_direction.json | act1_week3_economic_direction | 3 | top[0] | econ_free_market | chain:act2_econ_vael_approach | 1
- BACKWARD | src/data/narrative/act1/act1_week3_economic_direction.json | act1_week3_economic_direction | 3 | top[0] | econ_free_market | chain:act2_econ_marić_confrontation | 1
- BACKWARD | src/data/narrative/act1/act1_week3_economic_direction.json | act1_week3_economic_direction | 3 | top[1] | econ_planned | chain:act2_econ_vostane_confrontation | 1
- BACKWARD | src/data/narrative/act1/act1_week3_economic_direction.json | act1_week3_economic_direction | 3 | top[1] | econ_planned | chain:act2_econ_orythian_loan_offer | 1
- BACKWARD | src/data/narrative/act1/act1_week3_economic_direction.json | act1_week3_economic_direction | 3 | top[2] | econ_mixed | chain:act2_econ_mixed_challenges | 1
- BACKWARD | src/data/narrative/act1/act1_week3_economic_direction.json | act1_week3_economic_direction | 3 | top[3] | econ_pragmatic | chain:act2_econ_pragmatic_strain | 1

DANGLING (choice with no `nextSegment`/`nextNodeId`/non-empty `chainTriggers`): 865. These are terminal choices (`nextSegment:null`, e.g. `src/data/narrative/act1/act1_brenner_defense_briefing.json:58` + `:78`) — valid scene ends, not errors. Sample in `_p2a_out.txt` (20 rows).

Load-bearing (d): `src/data/narrative/act7/act7_week100_final_debate.json:71-73` `path_kolvar_oil → seg_kolvar_attacks_oil`; `:127` segment def; `:132` `oil_continue → seg_katerin_responds`; `:151` target PRESENT. Audited, no fix.

## 2. DEAD ENDS

Count: 0 (0). No choice targets a segment with empty text AND no outgoing ref. Every `nextSegment` target has ≥1 narrative/dialogue/monologue text or ≥1 outgoing choice.

## 3. MANDATORY STRUCTURE

Total mandatory (`isMandatory:true`): 285. Violations (missing `weekDeadline` OR missing `agendaCost` OR `deadline<week`): 184 rows, all `deadline=ABSENT` + `cost` present (0 `cost=ABSENT`, 0 `deadline<week`).

Every row below is `MAND-VIOL | file | id | detail` (deadline ABSENT; cost 0/1 present):

- MAND-VIOL | src/data/narrative/act1/act1_chain_bni_press.json | act1_chain_bni_press | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act1/act1_chain_bni_reform_friction.json | act1_chain_bni_reform_friction | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act1/act1_chain_budget_revision.json | act1_chain_budget_revision | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act1/act1_chain_capital_strike.json | act1_chain_capital_strike | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act1/act1_chain_church_opposition.json | act1_chain_church_opposition | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act1/act1_chain_constitutional_crisis.json | act1_chain_constitutional_crisis | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act1/act1_chain_deficit_crisis.json | act1_chain_deficit_crisis | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act1/act1_chain_executive_governance.json | act1_chain_executive_governance | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act1/act1_chain_ima_confrontation.json | act1_chain_ima_confrontation | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act1/act1_chain_jonas_advisor.json | act1_chain_jonas_advisor | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act1/act1_chain_jonas_press_rebellion.json | act1_chain_jonas_press_rebellion | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act1/act1_chain_kolvar_escalation.json | act1_chain_kolvar_escalation | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act1/act1_chain_kolvar_opposition.json | act1_chain_kolvar_opposition | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act1/act1_chain_kravenstal_escalation.json | act1_chain_kravenstal_escalation | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act1/act1_chain_kravenstal_unrest.json | act1_chain_kravenstal_unrest | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act1/act1_chain_liora_archive.json | act1_chain_liora_archive | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act1/act1_chain_liora_radicalized.json | act1_chain_liora_radicalized | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act1/act1_chain_nadia_investigation.json | act1_chain_nadia_investigation | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act1/act1_chain_no_confidence_prep.json | act1_chain_no_confidence_prep | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act1/act1_chain_tomas_nationalist.json | act1_chain_tomas_nationalist | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act1/act1_chain_tyvaren_blind_spot.json | act1_chain_tyvaren_blind_spot | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act1/act1_chain_tyvaren_border_standoff.json | act1_chain_tyvaren_border_standoff | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act1/act1_chain_tyvaren_propaganda_war.json | act1_chain_tyvaren_propaganda_war | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act1/act1_chain_vael_pressure.json | act1_chain_vael_pressure | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act1/act1_chain_watchtower_leak.json | act1_chain_watchtower_leak | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act1/act1_minority_festival_request.json | act1_minority_festival_request | week=4 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act1/act1_religious_parish_priest.json | act1_religious_parish_priest | week=7 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act1/act1_vael_estate_dinner.json | act1_vael_estate_dinner | week=12 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act1/act1_vael_hospital_kravenstal.json | act1_vael_hospital_kravenstal | week=8 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act1/act1_vael_party_funding.json | act1_vael_party_funding | week=4 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act1/act1_week3_first_budget.json | act1_week3_first_budget | week=3 deadline=ABSENT cost=1
- MAND-VIOL | src/data/narrative/act2/act2_deficit_crisis.json | act2_deficit_crisis | week=16 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act2/act2_econ_marić_confrontation.json | act2_econ_marić_confrontation | week=1 deadline=ABSENT cost=1
- MAND-VIOL | src/data/narrative/act2/act2_econ_mixed_challenges.json | act2_econ_mixed_challenges | week=1 deadline=ABSENT cost=1
- MAND-VIOL | src/data/narrative/act2/act2_econ_orythian_loan_offer.json | act2_econ_orythian_loan_offer | week=1 deadline=ABSENT cost=1
- MAND-VIOL | src/data/narrative/act2/act2_econ_pragmatic_strain.json | act2_econ_pragmatic_strain | week=1 deadline=ABSENT cost=1
- MAND-VIOL | src/data/narrative/act2/act2_econ_vael_approach.json | act2_econ_vael_approach | week=1 deadline=ABSENT cost=1
- MAND-VIOL | src/data/narrative/act2/act2_econ_vostane_confrontation.json | act2_econ_vostane_confrontation | week=1 deadline=ABSENT cost=1
- MAND-VIOL | src/data/narrative/act2/act2_ima_conditionality_review.json | act2_ima_conditionality_review | week=14 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act2/act2_minority_language_school.json | act2_minority_language_school | week=20 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act2/act2_minority_mixed_marriage.json | act2_minority_mixed_marriage | week=22 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act2/act2_minority_refugee_health.json | act2_minority_refugee_health | week=17 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act2/act2_religious_holiday_speech.json | act2_religious_holiday_speech | week=21 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act2/act2_religious_hospital_threat.json | act2_religious_hospital_threat | week=17 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act2/act2_tyvaren_blind_spot.json | act2_tyvaren_blind_spot | week=18 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act2/act2_vael_referendum_funding.json | act2_vael_referendum_funding | week=24 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act2/act2_vael_steel_mills.json | act2_vael_steel_mills | week=18 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act2/letter_response_jonas.json | letter_response_jonas | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act2/letter_response_kolvar.json | letter_response_kolvar | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act2/letter_response_liora.json | letter_response_liora | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act2/letter_response_nation.json | letter_response_nation | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act2/pipeline_constitution_committee.json | pipeline_constitution_committee | week=15 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act2/pipeline_constitution_drafting.json | pipeline_constitution_drafting | week=14 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act2/pipeline_constitution_floor_vote.json | pipeline_constitution_floor_vote | week=16 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act2/project_vael_kickback_fort.json | project_vael_kickback_fort | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act2/project_vael_kickback_highway.json | project_vael_kickback_highway | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act2/project_vael_kickback_steel.json | project_vael_kickback_steel | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act2/project_vael_kickback_uni.json | project_vael_kickback_uni | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act2/social_state_dinner_wk24.json | social_state_dinner_wk24 | week=24 deadline=ABSENT cost=1
- MAND-VIOL | src/data/narrative/act3/act3_alternative_financing.json | act3_alternative_financing | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_arcturian_privatization_pressure.json | act3_arcturian_privatization_pressure | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_arcturian_sanctions.json | act3_arcturian_sanctions | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_ashenmere_standoff.json | act3_ashenmere_standoff | week=37 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_assassination_cabinet.json | act3_assassination_cabinet | week=30 deadline=ABSENT cost=2
- MAND-VIOL | src/data/narrative/act3/act3_autonomy_commission.json | act3_autonomy_commission | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_battle_gravenmark.json | act3_battle_gravenmark | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_battle_kravenstal_approach.json | act3_battle_kravenstal_approach | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_brenner_negotiation.json | act3_brenner_negotiation | week=37 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_brenner_response.json | act3_brenner_response | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_chain_assassination_attempt.json | act3_chain_assassination_attempt | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_coalition_government.json | act3_coalition_government | week=38 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_confidence_vote.json | act3_confidence_vote | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_constitution_implementation.json | act3_constitution_implementation | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_dlf_coordination.json | act3_dlf_coordination | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_dlf_military_integration.json | act3_dlf_military_integration | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_dravenhollow_crackdown.json | act3_dravenhollow_crackdown | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_dravenni_autonomy_talks.json | act3_dravenni_autonomy_talks | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_dravenni_divided_response.json | act3_dravenni_divided_response | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_dravenni_insurgency.json | act3_dravenni_insurgency | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_dravenni_radicalization.json | act3_dravenni_radicalization | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_dusek_intelligence.json | act3_dusek_intelligence | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_dusek_loyalty_arc.json | act3_dusek_loyalty_arc | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_face_to_face_brenner.json | act3_face_to_face_brenner | week=37 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_government_in_exile.json | act3_government_in_exile | week=37 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_halvekist_legal_war.json | act3_halvekist_legal_war | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_ima_compliance_year.json | act3_ima_compliance_year | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_ima_conditionality.json | act3_ima_conditionality | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_ima_negotiation.json | act3_ima_negotiation | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_international_forum_session.json | act3_international_forum_session | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_investigation_results.json | act3_investigation_results | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_kaelen_response.json | act3_kaelen_response | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_khaled_coalition.json | act3_khaled_coalition | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_kolvar_legal_challenge.json | act3_kolvar_legal_challenge | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_kolvar_negotiation.json | act3_kolvar_negotiation | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_legal_standoff.json | act3_legal_standoff | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_leverage_operation.json | act3_leverage_operation | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_loyalist_counter_deploy.json | act3_loyalist_counter_deploy | week=37 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_military_democracy_bond.json | act3_military_democracy_bond | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_military_deployment.json | act3_military_deployment | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_military_resolve_hardened.json | act3_military_resolve_hardened | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_minority_refugee_integration.json | act3_minority_refugee_integration | week=28 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_minority_veteran_recognition.json | act3_minority_veteran_recognition | week=30 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_nadia_investigation_continues.json | act3_nadia_investigation_continues | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_national_address_war.json | act3_national_address_war | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_nationalist_backlash.json | act3_nationalist_backlash | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_new_cabinet_figures.json | act3_new_cabinet_figures | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_orythian_advisor_friction.json | act3_orythian_advisor_friction | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_press_freedom_crackdown.json | act3_press_freedom_crackdown | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_public_moment.json | act3_public_moment | week=37 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_public_reckoning.json | act3_public_reckoning | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_reform_by_decree.json | act3_reform_by_decree | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_religious_church_halvek_files.json | act3_religious_church_halvek_files | week=30 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_second_attack.json | act3_second_attack | week=1 deadline=ABSENT cost=2
- MAND-VIOL | src/data/narrative/act3/act3_secret_mobilization_consequences.json | act3_secret_mobilization_consequences | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_soe_extension_crisis.json | act3_soe_extension_crisis | week=1 deadline=ABSENT cost=2
- MAND-VIOL | src/data/narrative/act3/act3_soe_opposition_protests.json | act3_soe_opposition_protests | week=1 deadline=ABSENT cost=1
- MAND-VIOL | src/data/narrative/act3/act3_superpower_pressure.json | act3_superpower_pressure | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_total_war_society.json | act3_total_war_society | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_treaty_drafting.json | act3_treaty_drafting | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_tyvaren_border_skirmish.json | act3_tyvaren_border_skirmish | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_tyvaren_deterred.json | act3_tyvaren_deterred | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_tyvaren_diplomatic_followup.json | act3_tyvaren_diplomatic_followup | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_tyvaren_retaliation.json | act3_tyvaren_retaliation | week=1 deadline=ABSENT cost=2
- MAND-VIOL | src/data/narrative/act3/act3_vael_block_wealth_tax.json | act3_vael_block_wealth_tax | week=30 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_vael_minister_demand.json | act3_vael_minister_demand | week=35 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_volkov_patience_expires.json | act3_volkov_patience_expires | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_vostane_media_war.json | act3_vostane_media_war | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_vyktor_departure.json | act3_vyktor_departure | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/act3_war_economy.json | act3_war_economy | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/letter_response_arcturian.json | letter_response_arcturian | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/letter_response_father.json | letter_response_father | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/letter_response_nadia.json | letter_response_nadia | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/letter_response_soraya.json | letter_response_soraya | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/letter_response_vukov.json | letter_response_vukov | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act3/social_independence_parade_wk36.json | social_independence_parade_wk36 | week=36 deadline=ABSENT cost=1
- MAND-VIOL | src/data/narrative/act4/act4_all_fronts.json | act4_all_fronts | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act4/act4_alliance_crisis.json | act4_alliance_crisis | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act4/act4_arcturian_intervention.json | act4_arcturian_intervention | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act4/act4_ceasefire_negotiation.json | act4_ceasefire_negotiation | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act4/act4_ceasefire_talks.json | act4_ceasefire_talks | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act4/act4_civil_conflict_arc.json | act4_civil_conflict_arc | week=40 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act4/act4_constitutional_crisis.json | act4_constitutional_crisis | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act4/act4_coordinated_response.json | act4_coordinated_response | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act4/act4_diplomatic_endgame.json | act4_diplomatic_endgame | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act4/act4_dravenni_war_alliance.json | act4_dravenni_war_alliance | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act4/act4_emergency_powers_invoked.json | act4_emergency_powers_invoked | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act4/act4_exile_arc.json | act4_exile_arc | week=40 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act4/act4_family_anchored.json | act4_family_anchored | week=1 deadline=ABSENT cost=1
- MAND-VIOL | src/data/narrative/act4/act4_family_breaking.json | act4_family_breaking | week=1 deadline=ABSENT cost=1
- MAND-VIOL | src/data/narrative/act4/act4_family_conditional.json | act4_family_conditional | week=1 deadline=ABSENT cost=1
- MAND-VIOL | src/data/narrative/act4/act4_family_estranged.json | act4_family_estranged | week=1 deadline=ABSENT cost=1
- MAND-VIOL | src/data/narrative/act4/act4_family_healing.json | act4_family_healing | week=1 deadline=ABSENT cost=1
- MAND-VIOL | src/data/narrative/act4/act4_forum_showdown.json | act4_forum_showdown | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act4/act4_ima_confrontation.json | act4_ima_confrontation | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act4/act4_ima_renegotiation.json | act4_ima_renegotiation | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act4/act4_internal_security_state.json | act4_internal_security_state | week=42 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act4/act4_jonas_divorce.json | act4_jonas_divorce | week=1 deadline=ABSENT cost=1
- MAND-VIOL | src/data/narrative/act4/act4_national_address.json | act4_national_address | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act4/act4_occupation_begins.json | act4_occupation_begins | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act4/act4_post_coup_consolidation.json | act4_post_coup_consolidation | week=40 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act4/act4_public_mandate.json | act4_public_mandate | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act4/act4_reelection_campaign.json | act4_reelection_campaign | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act4/act4_second_referendum.json | act4_second_referendum | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act4/act4_tomas_redemption.json | act4_tomas_redemption | week=1 deadline=ABSENT cost=1
- MAND-VIOL | src/data/narrative/act4/act4_underground_radio.json | act4_underground_radio | week=41 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act4/act4_vael_final_offer.json | act4_vael_final_offer | week=42 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/act4/act4_week40_exile.json | act4_week40_exile | week=40 deadline=ABSENT cost=2
- MAND-VIOL | src/data/narrative/act4/letter_response_soren.json | letter_response_soren | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/crisis/emergency_decree_tyvaren_border.json | emergency_decree_tyvaren_border | week=14 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/crisis/morning_briefing_compromised.json | morning_briefing_compromised | week=5 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/diplomacy/act2_diplomacy_arcturian_trade.json | act2_diplomacy_arcturian_trade | week=15 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/diplomacy/act2_diplomacy_lytheira_debt.json | act2_diplomacy_lytheira_debt | week=18 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/diplomacy/act2_diplomacy_orythian_military.json | act2_diplomacy_orythian_military | week=20 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/diplomacy/act3_diplomacy_arcturian_alliance.json | act3_diplomacy_arcturian_alliance | week=34 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/diplomacy/act3_diplomacy_morivask_border.json | act3_diplomacy_morivask_border | week=36 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/diplomacy/act3_diplomacy_tyvaren_peace.json | act3_diplomacy_tyvaren_peace | week=32 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/projects/project_contractor_fortification.json | project_contractor_fortification | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/projects/project_contractor_highway.json | project_contractor_highway | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/projects/project_contractor_steel.json | project_contractor_steel | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/projects/project_contractor_university.json | project_contractor_university | week=1 deadline=ABSENT cost=0
- MAND-VIOL | src/data/narrative/projects/project_mid_crisis_fortification.json | project_mid_crisis_fortification | week=1 deadline=ABSENT cost=1
- MAND-VIOL | src/data/narrative/projects/project_mid_crisis_highway.json | project_mid_crisis_highway | week=1 deadline=ABSENT cost=1
- MAND-VIOL | src/data/narrative/projects/project_mid_crisis_steel.json | project_mid_crisis_steel | week=1 deadline=ABSENT cost=1
- MAND-VIOL | src/data/narrative/projects/project_mid_crisis_university.json | project_mid_crisis_university | week=1 deadline=ABSENT cost=1

Wiring (deadline week has agenda/weekStore slot): 180 mandatory have NO `sceneId` occurrence in `src/data/agenda/*.json` nor hardcoded `src/stores/weekStore.ts` (`sceneId:'...'` set). These are chain-fed (`act1_chain_*`, `act2_econ_*`, `letter_response_*`, `project_vael_kickback_*`, etc.) — they fire via `chainTriggers`, not agenda. Full list:

- MAND-NOWIRE | src/data/narrative/act1/act1_chain_bni_press.json | act1_chain_bni_press | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act1/act1_chain_bni_reform_friction.json | act1_chain_bni_reform_friction | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act1/act1_chain_budget_revision.json | act1_chain_budget_revision | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act1/act1_chain_capital_strike.json | act1_chain_capital_strike | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act1/act1_chain_church_opposition.json | act1_chain_church_opposition | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act1/act1_chain_constitutional_crisis.json | act1_chain_constitutional_crisis | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act1/act1_chain_deficit_crisis.json | act1_chain_deficit_crisis | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act1/act1_chain_executive_governance.json | act1_chain_executive_governance | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act1/act1_chain_ima_confrontation.json | act1_chain_ima_confrontation | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act1/act1_chain_jonas_advisor.json | act1_chain_jonas_advisor | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act1/act1_chain_jonas_press_rebellion.json | act1_chain_jonas_press_rebellion | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act1/act1_chain_kolvar_escalation.json | act1_chain_kolvar_escalation | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act1/act1_chain_kolvar_opposition.json | act1_chain_kolvar_opposition | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act1/act1_chain_kravenstal_escalation.json | act1_chain_kravenstal_escalation | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act1/act1_chain_kravenstal_unrest.json | act1_chain_kravenstal_unrest | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act1/act1_chain_liora_archive.json | act1_chain_liora_archive | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act1/act1_chain_liora_radicalized.json | act1_chain_liora_radicalized | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act1/act1_chain_nadia_investigation.json | act1_chain_nadia_investigation | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act1/act1_chain_no_confidence_prep.json | act1_chain_no_confidence_prep | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act1/act1_chain_tomas_nationalist.json | act1_chain_tomas_nationalist | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act1/act1_chain_tyvaren_blind_spot.json | act1_chain_tyvaren_blind_spot | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act1/act1_chain_tyvaren_border_standoff.json | act1_chain_tyvaren_border_standoff | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act1/act1_chain_tyvaren_propaganda_war.json | act1_chain_tyvaren_propaganda_war | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act1/act1_chain_vael_pressure.json | act1_chain_vael_pressure | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act1/act1_chain_watchtower_leak.json | act1_chain_watchtower_leak | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act1/act1_minority_festival_request.json | act1_minority_festival_request | week=4 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act1/act1_religious_parish_priest.json | act1_religious_parish_priest | week=7 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act1/act1_vael_estate_dinner.json | act1_vael_estate_dinner | week=12 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act1/act1_vael_hospital_kravenstal.json | act1_vael_hospital_kravenstal | week=8 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act1/act1_vael_party_funding.json | act1_vael_party_funding | week=4 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act1/act1_week10_law_enforcement_choice.json | act1_week10_law_enforcement_choice | week=10 deadline=12 cost=1
- MAND-NOWIRE | src/data/narrative/act1/act1_week2_cabinet_appointments.json | act1_week2_cabinet_appointments | week=2 deadline=2 cost=1
- MAND-NOWIRE | src/data/narrative/act1/act1_week9_soren_immunity.json | act1_week9_soren_immunity | week=9 deadline=11 cost=1
- MAND-NOWIRE | src/data/narrative/act1/briefings/vyktor_press_briefing.json | vyktor_press_briefing | week=4 deadline=6 cost=0
- MAND-NOWIRE | src/data/narrative/act1/family/family_bni_night.json | family_bni_night | week=5 deadline=5 cost=0
- MAND-NOWIRE | src/data/narrative/act1/investigation/mole_week7_false_resolve.json | mole_week7_false_resolve | week=7 deadline=8 cost=0
- MAND-NOWIRE | src/data/narrative/act1/investigation/mole_week9_reveal.json | mole_week9_reveal | week=9 deadline=10 cost=0
- MAND-NOWIRE | src/data/narrative/act2/act2_deficit_crisis.json | act2_deficit_crisis | week=16 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act2/act2_econ_marić_confrontation.json | act2_econ_marić_confrontation | week=1 deadline=ABSENT cost=1
- MAND-NOWIRE | src/data/narrative/act2/act2_econ_mixed_challenges.json | act2_econ_mixed_challenges | week=1 deadline=ABSENT cost=1
- MAND-NOWIRE | src/data/narrative/act2/act2_econ_orythian_loan_offer.json | act2_econ_orythian_loan_offer | week=1 deadline=ABSENT cost=1
- MAND-NOWIRE | src/data/narrative/act2/act2_econ_pragmatic_strain.json | act2_econ_pragmatic_strain | week=1 deadline=ABSENT cost=1
- MAND-NOWIRE | src/data/narrative/act2/act2_econ_vael_approach.json | act2_econ_vael_approach | week=1 deadline=ABSENT cost=1
- MAND-NOWIRE | src/data/narrative/act2/act2_econ_vostane_confrontation.json | act2_econ_vostane_confrontation | week=1 deadline=ABSENT cost=1
- MAND-NOWIRE | src/data/narrative/act2/act2_ima_conditionality_review.json | act2_ima_conditionality_review | week=14 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act2/act2_minority_language_school.json | act2_minority_language_school | week=20 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act2/act2_minority_mixed_marriage.json | act2_minority_mixed_marriage | week=22 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act2/act2_minority_refugee_health.json | act2_minority_refugee_health | week=17 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act2/act2_religious_holiday_speech.json | act2_religious_holiday_speech | week=21 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act2/act2_religious_hospital_threat.json | act2_religious_hospital_threat | week=17 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act2/act2_tyvaren_blind_spot.json | act2_tyvaren_blind_spot | week=18 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act2/act2_vael_referendum_funding.json | act2_vael_referendum_funding | week=24 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act2/act2_vael_steel_mills.json | act2_vael_steel_mills | week=18 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act2/act2_week17_soren_debate.json | act2_week17_soren_debate | week=17 deadline=19 cost=2
- MAND-NOWIRE | src/data/narrative/act2/act2_week25_brenner_warning.json | act2_week25_brenner_warning | week=25 deadline=27 cost=1
- MAND-NOWIRE | src/data/narrative/act2/act2_week26_referendum.json | act2_week26_referendum | week=26 deadline=26 cost=2
- MAND-NOWIRE | src/data/narrative/act2/act2_week27_press_conference.json | act2_week27_press_conference | week=27 deadline=28 cost=1
- MAND-NOWIRE | src/data/narrative/act2/act2_week27_press_economy.json | act2_week27_press_economy | week=27 deadline=28 cost=0
- MAND-NOWIRE | src/data/narrative/act2/act2_week27_press_followup.json | act2_week27_press_followup | week=27 deadline=28 cost=0
- MAND-NOWIRE | src/data/narrative/act2/act2_week27_press_outcome.json | act2_week27_press_outcome | week=27 deadline=28 cost=0
- MAND-NOWIRE | src/data/narrative/act2/family/family_referendum_night.json | family_referendum_night | week=26 deadline=26 cost=0
- MAND-NOWIRE | src/data/narrative/act2/letter_response_jonas.json | letter_response_jonas | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act2/letter_response_kolvar.json | letter_response_kolvar | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act2/letter_response_liora.json | letter_response_liora | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act2/letter_response_nation.json | letter_response_nation | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act2/project_vael_kickback_fort.json | project_vael_kickback_fort | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act2/project_vael_kickback_highway.json | project_vael_kickback_highway | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act2/project_vael_kickback_steel.json | project_vael_kickback_steel | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act2/project_vael_kickback_uni.json | project_vael_kickback_uni | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act2/social_state_dinner_wk24.json | social_state_dinner_wk24 | week=24 deadline=ABSENT cost=1
- MAND-NOWIRE | src/data/narrative/act3/act3_alternative_financing.json | act3_alternative_financing | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_arcturian_privatization_pressure.json | act3_arcturian_privatization_pressure | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_arcturian_sanctions.json | act3_arcturian_sanctions | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_ashenmere_standoff.json | act3_ashenmere_standoff | week=37 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_assassination_bombing.json | act3_assassination_bombing | week=30 deadline=36 cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_assassination_cabinet.json | act3_assassination_cabinet | week=30 deadline=ABSENT cost=2
- MAND-NOWIRE | src/data/narrative/act3/act3_assassination_default.json | act3_assassination_default | week=30 deadline=36 cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_assassination_poisoning.json | act3_assassination_poisoning | week=30 deadline=36 cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_assassination_sniper.json | act3_assassination_sniper | week=30 deadline=36 cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_autonomy_commission.json | act3_autonomy_commission | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_battle_gravenmark.json | act3_battle_gravenmark | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_battle_kravenstal_approach.json | act3_battle_kravenstal_approach | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_bca_report_wk33.json | act3_bca_report_wk33 | week=33 deadline=36 cost=1
- MAND-NOWIRE | src/data/narrative/act3/act3_bca_report_wk44.json | act3_bca_report_wk44 | week=44 deadline=47 cost=1
- MAND-NOWIRE | src/data/narrative/act3/act3_both_agencies_conflict.json | act3_both_agencies_conflict | week=36 deadline=40 cost=1
- MAND-NOWIRE | src/data/narrative/act3/act3_brenner_response.json | act3_brenner_response | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_chain_assassination_attempt.json | act3_chain_assassination_attempt | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_confidence_vote.json | act3_confidence_vote | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_dlf_coordination.json | act3_dlf_coordination | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_dlf_military_integration.json | act3_dlf_military_integration | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_dravenhollow_crackdown.json | act3_dravenhollow_crackdown | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_dravenni_divided_response.json | act3_dravenni_divided_response | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_dravenni_insurgency.json | act3_dravenni_insurgency | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_dravenni_radicalization.json | act3_dravenni_radicalization | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_dusek_intelligence.json | act3_dusek_intelligence | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_dusek_loyalty_arc.json | act3_dusek_loyalty_arc | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_face_to_face_brenner.json | act3_face_to_face_brenner | week=37 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_government_in_exile.json | act3_government_in_exile | week=37 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_halvekist_legal_war.json | act3_halvekist_legal_war | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_ima_compliance_year.json | act3_ima_compliance_year | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_ima_conditionality.json | act3_ima_conditionality | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_ima_negotiation.json | act3_ima_negotiation | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_investigation_results.json | act3_investigation_results | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_kaelen_response.json | act3_kaelen_response | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_khaled_coalition.json | act3_khaled_coalition | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_kolvar_legal_challenge.json | act3_kolvar_legal_challenge | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_kolvar_negotiation.json | act3_kolvar_negotiation | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_legal_standoff.json | act3_legal_standoff | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_leverage_operation.json | act3_leverage_operation | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_loyalist_counter_deploy.json | act3_loyalist_counter_deploy | week=37 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_military_deployment.json | act3_military_deployment | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_military_resolve_hardened.json | act3_military_resolve_hardened | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_minority_refugee_integration.json | act3_minority_refugee_integration | week=28 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_minority_veteran_recognition.json | act3_minority_veteran_recognition | week=30 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_nadia_investigation_continues.json | act3_nadia_investigation_continues | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_nationalist_backlash.json | act3_nationalist_backlash | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_new_cabinet_figures.json | act3_new_cabinet_figures | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_orythian_advisor_friction.json | act3_orythian_advisor_friction | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_press_freedom_crackdown.json | act3_press_freedom_crackdown | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_public_moment.json | act3_public_moment | week=37 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_public_reckoning.json | act3_public_reckoning | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_reform_by_decree.json | act3_reform_by_decree | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_religious_church_halvek_files.json | act3_religious_church_halvek_files | week=30 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_second_attack.json | act3_second_attack | week=1 deadline=ABSENT cost=2
- MAND-NOWIRE | src/data/narrative/act3/act3_secret_mobilization_consequences.json | act3_secret_mobilization_consequences | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_soe_extension_crisis.json | act3_soe_extension_crisis | week=1 deadline=ABSENT cost=2
- MAND-NOWIRE | src/data/narrative/act3/act3_soe_opposition_protests.json | act3_soe_opposition_protests | week=1 deadline=ABSENT cost=1
- MAND-NOWIRE | src/data/narrative/act3/act3_ssd_report_wk33.json | act3_ssd_report_wk33 | week=33 deadline=36 cost=1
- MAND-NOWIRE | src/data/narrative/act3/act3_ssd_report_wk44.json | act3_ssd_report_wk44 | week=44 deadline=47 cost=1
- MAND-NOWIRE | src/data/narrative/act3/act3_superpower_pressure.json | act3_superpower_pressure | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_total_war_society.json | act3_total_war_society | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_treaty_drafting.json | act3_treaty_drafting | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_tyvaren_deterred.json | act3_tyvaren_deterred | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_tyvaren_diplomatic_followup.json | act3_tyvaren_diplomatic_followup | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_tyvaren_retaliation.json | act3_tyvaren_retaliation | week=1 deadline=ABSENT cost=2
- MAND-NOWIRE | src/data/narrative/act3/act3_vael_block_wealth_tax.json | act3_vael_block_wealth_tax | week=30 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_vael_minister_demand.json | act3_vael_minister_demand | week=35 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_volkov_patience_expires.json | act3_volkov_patience_expires | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_vostane_media_war.json | act3_vostane_media_war | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_vyktor_departure.json | act3_vyktor_departure | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/act3_week33_soren_files.json | act3_week33_soren_files | week=33 deadline=36 cost=2
- MAND-NOWIRE | src/data/narrative/act3/act3_week38_soren_trial.json | act3_week38_soren_trial | week=38 deadline=40 cost=3
- MAND-NOWIRE | src/data/narrative/act3/letter_response_arcturian.json | letter_response_arcturian | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/letter_response_father.json | letter_response_father | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/letter_response_nadia.json | letter_response_nadia | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/letter_response_soraya.json | letter_response_soraya | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/letter_response_vukov.json | letter_response_vukov | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act3/social_independence_parade_wk36.json | social_independence_parade_wk36 | week=36 deadline=ABSENT cost=1
- MAND-NOWIRE | src/data/narrative/act4/act4_alliance_crisis.json | act4_alliance_crisis | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act4/act4_arcturian_intervention.json | act4_arcturian_intervention | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act4/act4_impeachment_proceedings.json | act4_impeachment_proceedings | week=1 deadline=52 cost=1
- MAND-NOWIRE | src/data/narrative/act4/act4_mole_confrontation.json | act4_mole_confrontation | week=42 deadline=44 cost=2
- MAND-NOWIRE | src/data/narrative/act4/act4_mole_correct_accusation.json | act4_mole_correct_accusation | week=42 deadline=44 cost=2
- MAND-NOWIRE | src/data/narrative/act4/act4_mole_wrong_accusation.json | act4_mole_wrong_accusation | week=42 deadline=44 cost=2
- MAND-NOWIRE | src/data/narrative/act4/act4_post_coup_consolidation.json | act4_post_coup_consolidation | week=40 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act4/act4_soren_files_aftermath.json | act4_soren_files_aftermath | week=42 deadline=44 cost=1
- MAND-NOWIRE | src/data/narrative/act4/act4_soren_leverage_aftermath.json | act4_soren_leverage_aftermath | week=40 deadline=44 cost=2
- MAND-NOWIRE | src/data/narrative/act4/act4_soren_plea_aftermath.json | act4_soren_plea_aftermath | week=41 deadline=44 cost=1
- MAND-NOWIRE | src/data/narrative/act4/act4_soren_trial_aftermath.json | act4_soren_trial_aftermath | week=40 deadline=44 cost=2
- MAND-NOWIRE | src/data/narrative/act4/act4_underground_radio.json | act4_underground_radio | week=41 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act4/act4_vael_final_offer.json | act4_vael_final_offer | week=42 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act4/letter_response_soren.json | letter_response_soren | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/act6/act6_week72_deep_state.json | act6_week72_deep_state | week=72 deadline=74 cost=1
- MAND-NOWIRE | src/data/narrative/act7/act7_week85_capital_strike.json | act7_week85_capital_strike | week=85 deadline=87 cost=1
- MAND-NOWIRE | src/data/narrative/crisis/emergency_decree_tyvaren_border.json | emergency_decree_tyvaren_border | week=14 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/crisis/morning_briefing_compromised.json | morning_briefing_compromised | week=5 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/diplomacy/act2_diplomacy_arcturian_trade.json | act2_diplomacy_arcturian_trade | week=15 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/diplomacy/act2_diplomacy_lytheira_debt.json | act2_diplomacy_lytheira_debt | week=18 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/diplomacy/act2_diplomacy_orythian_military.json | act2_diplomacy_orythian_military | week=20 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/diplomacy/act3_diplomacy_arcturian_alliance.json | act3_diplomacy_arcturian_alliance | week=34 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/diplomacy/act3_diplomacy_morivask_border.json | act3_diplomacy_morivask_border | week=36 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/diplomacy/act3_diplomacy_tyvaren_peace.json | act3_diplomacy_tyvaren_peace | week=32 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/projects/project_contractor_fortification.json | project_contractor_fortification | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/projects/project_contractor_highway.json | project_contractor_highway | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/projects/project_contractor_steel.json | project_contractor_steel | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/projects/project_contractor_university.json | project_contractor_university | week=1 deadline=ABSENT cost=0
- MAND-NOWIRE | src/data/narrative/projects/project_mid_crisis_fortification.json | project_mid_crisis_fortification | week=1 deadline=ABSENT cost=1
- MAND-NOWIRE | src/data/narrative/projects/project_mid_crisis_highway.json | project_mid_crisis_highway | week=1 deadline=ABSENT cost=1
- MAND-NOWIRE | src/data/narrative/projects/project_mid_crisis_steel.json | project_mid_crisis_steel | week=1 deadline=ABSENT cost=1
- MAND-NOWIRE | src/data/narrative/projects/project_mid_crisis_university.json | project_mid_crisis_university | week=1 deadline=ABSENT cost=1

Per-scene forced-path rollup (`_p2f_out.txt`): MAND-NO-OCC=183 (zero agenda/hard occurrence) + MAND-ALL-OPTIONAL=38 (≥1 agenda occurrence but all `slotCost>0` non-urgent non-hard) = 221 mandatory with no forced (hardcoded/slot0/urgent) path. Chain-fed scenes are expected here; agenda-fed ALL-OPTIONAL (e.g. `act3_constitution_implementation` W28 slot1) would not survive skip-all-optional — see `02-scheduling.md` §6b.

Load-bearing (a)(b)(c): (a) visited guard only on hardcoded `src/stores/weekStore.ts:103,118,133,448-933,1514`; (b) `buildPool:71-97` + `AgendaSelector.tsx:483-491` lack dedup; (c) `src/data/agenda/week07.json:47-56` `agenda_w7_cabinet_session → act1_week1_first_briefing`. Audited, no fix.

## 4. ORPHANS

TRUE_ORPHAN=75 (no inbound `nextNodeId`/chain/prereq-ref, no agenda, no weekStore, no `src/**/*.ts` quoted ref) | POOL-FED=96 (agenda but no inbound, no hard) | HARDCODED_ORPHAN=32 (weekStore but no inbound).

TRUE ORPHANS (full):

- ORPHAN-TRUE | src/data/narrative/act1/act1_brenner_defense_briefing.json | act1_brenner_defense_briefing
- ORPHAN-TRUE | src/data/narrative/act1/act1_chain_deficit_crisis.json | act1_chain_deficit_crisis
- ORPHAN-TRUE | src/data/narrative/act1/act1_chain_kolvar_opposition.json | act1_chain_kolvar_opposition
- ORPHAN-TRUE | src/data/narrative/act1/act1_chain_kravenstal_unrest.json | act1_chain_kravenstal_unrest
- ORPHAN-TRUE | src/data/narrative/act1/act1_chain_tyvaren_propaganda_war.json | act1_chain_tyvaren_propaganda_war
- ORPHAN-TRUE | src/data/narrative/act1/act1_chain_vael_pressure.json | act1_chain_vael_pressure
- ORPHAN-TRUE | src/data/narrative/act1/act1_chain_watchtower_leak.json | act1_chain_watchtower_leak
- ORPHAN-TRUE | src/data/narrative/act1/act1_kolvar_counterattack.json | act1_kolvar_counterattack
- ORPHAN-TRUE | src/data/narrative/act1/act1_kolvar_opposition_rally.json | act1_kolvar_opposition_rally
- ORPHAN-TRUE | src/data/narrative/act1/act1_nadia_exclusive_interview.json | act1_nadia_exclusive_interview
- ORPHAN-TRUE | src/data/narrative/act1/act1_renek_sermon.json | act1_renek_sermon
- ORPHAN-TRUE | src/data/narrative/act1/act1_vael_party_funding.json | act1_vael_party_funding
- ORPHAN-TRUE | src/data/narrative/act1/act1_vael_private_meeting.json | act1_vael_private_meeting
- ORPHAN-TRUE | src/data/narrative/act1/act1_week10_law_enforcement_choice.json | act1_week10_law_enforcement_choice
- ORPHAN-TRUE | src/data/narrative/act1/act1_week3_armadine_investment.json | act1_week3_armadine_investment
- ORPHAN-TRUE | src/data/narrative/act1/act1_week4_elena_introduction.json | act1_week4_elena_introduction
- ORPHAN-TRUE | src/data/narrative/act1/family/family_bni_night.json | family_bni_night
- ORPHAN-TRUE | src/data/narrative/act1/news_inauguration_gazette.json | news_inauguration_gazette
- ORPHAN-TRUE | src/data/narrative/act1/news_inauguration_herald.json | news_inauguration_herald
- ORPHAN-TRUE | src/data/narrative/act1/news_inauguration_worker.json | news_inauguration_worker
- ORPHAN-TRUE | src/data/narrative/act2/act2_deficit_crisis.json | act2_deficit_crisis
- ORPHAN-TRUE | src/data/narrative/act2/act2_jonas_workers_housing.json | act2_jonas_workers_housing
- ORPHAN-TRUE | src/data/narrative/act2/act2_serida_overhears.json | act2_serida_overhears
- ORPHAN-TRUE | src/data/narrative/act2/act2_superpower_coldness.json | act2_superpower_coldness
- ORPHAN-TRUE | src/data/narrative/act2/act2_week14_elena_favor.json | act2_week14_elena_favor
- ORPHAN-TRUE | src/data/narrative/act2/act2_week18_vael_fund.json | act2_week18_vael_fund
- ORPHAN-TRUE | src/data/narrative/act2/act2_week20_oligarch_meeting.json | act2_week20_oligarch_meeting
- ORPHAN-TRUE | src/data/narrative/act2/act2_week29_sovarka_approach.json | act2_week29_sovarka_approach
- ORPHAN-TRUE | src/data/narrative/act2/social_autumn_festival_wk18.json | social_autumn_festival_wk18
- ORPHAN-TRUE | src/data/narrative/act2/social_state_dinner_wk24.json | social_state_dinner_wk24
- ORPHAN-TRUE | src/data/narrative/act3/act3_armadine_steel_return.json | act3_armadine_steel_return
- ORPHAN-TRUE | src/data/narrative/act3/act3_armadine_steel_return_jonas.json | act3_armadine_steel_return_jonas
- ORPHAN-TRUE | src/data/narrative/act3/act3_bca_report_wk33.json | act3_bca_report_wk33
- ORPHAN-TRUE | src/data/narrative/act3/act3_bca_report_wk44.json | act3_bca_report_wk44
- ORPHAN-TRUE | src/data/narrative/act3/act3_both_agencies_conflict.json | act3_both_agencies_conflict
- ORPHAN-TRUE | src/data/narrative/act3/act3_chain_assassination_attempt.json | act3_chain_assassination_attempt
- ORPHAN-TRUE | src/data/narrative/act3/act3_chain_voss_military_use.json | act3_chain_voss_military_use
- ORPHAN-TRUE | src/data/narrative/act3/act3_church_active_opposition_scene.json | act3_church_active_opposition_scene
- ORPHAN-TRUE | src/data/narrative/act3/act3_currency_speculation_resolution.json | act3_currency_speculation_resolution
- ORPHAN-TRUE | src/data/narrative/act3/act3_currency_speculation_small.json | act3_currency_speculation_small
- ORPHAN-TRUE | src/data/narrative/act3/act3_jonas_civic_commission.json | act3_jonas_civic_commission
- ORPHAN-TRUE | src/data/narrative/act3/act3_jonas_conservative_attack.json | act3_jonas_conservative_attack
- ORPHAN-TRUE | src/data/narrative/act3/act3_jonas_refugee_stance.json | act3_jonas_refugee_stance
- ORPHAN-TRUE | src/data/narrative/act3/act3_port_bonds_return.json | act3_port_bonds_return
- ORPHAN-TRUE | src/data/narrative/act3/act3_port_bonds_return_blind.json | act3_port_bonds_return_blind
- ORPHAN-TRUE | src/data/narrative/act3/act3_ssd_report_wk33.json | act3_ssd_report_wk33
- ORPHAN-TRUE | src/data/narrative/act3/act3_ssd_report_wk44.json | act3_ssd_report_wk44
- ORPHAN-TRUE | src/data/narrative/act3/act3_tyvaren_pressure.json | act3_tyvaren_pressure
- ORPHAN-TRUE | src/data/narrative/act3/act3_vael_fund_return.json | act3_vael_fund_return
- ORPHAN-TRUE | src/data/narrative/act3/act3_vael_fund_return_hidden.json | act3_vael_fund_return_hidden
- ORPHAN-TRUE | src/data/narrative/act3/act3_week28_elena_crisis_spin.json | act3_week28_elena_crisis_spin
- ORPHAN-TRUE | src/data/narrative/act3/act3_week34_elena_rival.json | act3_week34_elena_rival
- ORPHAN-TRUE | src/data/narrative/act3/social_independence_parade_wk36.json | social_independence_parade_wk36
- ORPHAN-TRUE | src/data/narrative/act4/act4_marriage_crisis.json | act4_marriage_crisis
- ORPHAN-TRUE | src/data/narrative/act4/act4_mole_correct_accusation.json | act4_mole_correct_accusation
- ORPHAN-TRUE | src/data/narrative/act4/act4_mole_wrong_accusation.json | act4_mole_wrong_accusation
- ORPHAN-TRUE | src/data/narrative/act4/act4_week45_elena_reckoning.json | act4_week45_elena_reckoning
- ORPHAN-TRUE | src/data/narrative/act5/act5_week54_orphanage_visit.json | act5_week54_orphanage_visit
- ORPHAN-TRUE | src/data/narrative/act5/act5_week57_fainting_spell.json | act5_week57_fainting_spell
- ORPHAN-TRUE | src/data/narrative/act5/act5_week59_old_flame.json | act5_week59_old_flame
- ORPHAN-TRUE | src/data/narrative/act5/act5_week61_the_birthday.json | act5_week61_the_birthday
- ORPHAN-TRUE | src/data/narrative/act5/act5_week63_stray_dog.json | act5_week63_stray_dog
- ORPHAN-TRUE | src/data/narrative/act6/act6_week66_smugglers_offer.json | act6_week66_smugglers_offer
- ORPHAN-TRUE | src/data/narrative/act6/act6_week67_bribed_reporter.json | act6_week67_bribed_reporter
- ORPHAN-TRUE | src/data/narrative/act6/act6_week69_generals_toast.json | act6_week69_generals_toast
- ORPHAN-TRUE | src/data/narrative/act6/act6_week71_senators_secret.json | act6_week71_senators_secret
- ORPHAN-TRUE | src/data/narrative/act6/act6_week72_deep_state.json | act6_week72_deep_state
- ORPHAN-TRUE | src/data/narrative/act6/act6_week74_voss_cipher.json | act6_week74_voss_cipher
- ORPHAN-TRUE | src/data/narrative/act6/act6_week81_cadre_bill.json | act6_week81_cadre_bill
- ORPHAN-TRUE | src/data/narrative/act6/act6_week84_corporate_deal.json | act6_week84_corporate_deal
- ORPHAN-TRUE | src/data/narrative/act6/act6_week87_bni_blackmail.json | act6_week87_bni_blackmail
- ORPHAN-TRUE | src/data/narrative/act7/act7_week85_capital_strike.json | act7_week85_capital_strike
- ORPHAN-TRUE | src/data/narrative/act7/act7_week90_campaign_trail.json | act7_week90_campaign_trail
- ORPHAN-TRUE | src/data/narrative/diplomacy/act2_diplomacy_arcturian_trade.json | act2_diplomacy_arcturian_trade
- ORPHAN-TRUE | src/data/narrative/diplomacy/act3_diplomacy_tyvaren_peace.json | act3_diplomacy_tyvaren_peace

HARDCODED orphans (weekStore-fed, no inbound — expected for one-shot pushes; full):

- ORPHAN-HARDCODED | src/data/narrative/act1/act1_shadow_hawk_first_operation.json | act1_shadow_hawk_first_operation
- ORPHAN-HARDCODED | src/data/narrative/act1/act1_shadow_hawk_induction.json | act1_shadow_hawk_induction
- ORPHAN-HARDCODED | src/data/narrative/act1/act1_week19_informant_network.json | act1_week19_informant_network
- ORPHAN-HARDCODED | src/data/narrative/act1/act1_week1_address_nation.json | act1_week1_address_nation
- ORPHAN-HARDCODED | src/data/narrative/act1/act1_week6_police_incident.json | act1_week6_police_incident
- ORPHAN-HARDCODED | src/data/narrative/act1/act1_week7_commissioner.json | act1_week7_commissioner
- ORPHAN-HARDCODED | src/data/narrative/act1/investigation/mole_week2_plant.json | mole_week2_plant
- ORPHAN-HARDCODED | src/data/narrative/act1/investigation/mole_week3_choice.json | mole_week3_choice
- ORPHAN-HARDCODED | src/data/narrative/act1/social_inaugural_ball_wk1.json | social_inaugural_ball_wk1
- ORPHAN-HARDCODED | src/data/narrative/act2/act2_shadow_hawk_morvec_option.json | act2_shadow_hawk_morvec_option
- ORPHAN-HARDCODED | src/data/narrative/act2/act2_shadow_hawk_voss_connection.json | act2_shadow_hawk_voss_connection
- ORPHAN-HARDCODED | src/data/narrative/act2/act2_week18_morivask_oil_discovery.json | act2_week18_morivask_oil_discovery
- ORPHAN-HARDCODED | src/data/narrative/act2/act2_week20_megaproject_choice.json | act2_week20_megaproject_choice
- ORPHAN-HARDCODED | src/data/narrative/act2/act2_week20_oil_negotiation.json | act2_week20_oil_negotiation
- ORPHAN-HARDCODED | src/data/narrative/act2/act2_week22_protest_or_riot.json | act2_week22_protest_or_riot
- ORPHAN-HARDCODED | src/data/narrative/act2/act2_week24_voss_introduction.json | act2_week24_voss_introduction
- ORPHAN-HARDCODED | src/data/narrative/act2/pipeline_constitution_committee.json | pipeline_constitution_committee
- ORPHAN-HARDCODED | src/data/narrative/act2/pipeline_constitution_drafting.json | pipeline_constitution_drafting
- ORPHAN-HARDCODED | src/data/narrative/act2/pipeline_constitution_floor_vote.json | pipeline_constitution_floor_vote
- ORPHAN-HARDCODED | src/data/narrative/act3/act3_nightmare_sequence.json | act3_nightmare_sequence
- ORPHAN-HARDCODED | src/data/narrative/act3/act3_no_confidence_fallen.json | act3_no_confidence_fallen
- ORPHAN-HARDCODED | src/data/narrative/act3/act3_no_confidence_survived.json | act3_no_confidence_survived
- ORPHAN-HARDCODED | src/data/narrative/act3/act3_rival_poaching.json | act3_rival_poaching
- ORPHAN-HARDCODED | src/data/narrative/act3/act3_shadow_hawk_exposure_crisis.json | act3_shadow_hawk_exposure_crisis
- ORPHAN-HARDCODED | src/data/narrative/act3/act3_week32_morvec_confrontation.json | act3_week32_morvec_confrontation
- ORPHAN-HARDCODED | src/data/narrative/act3/act3_week40_border_ultimatum.json | act3_week40_border_ultimatum
- ORPHAN-HARDCODED | src/data/narrative/act3/act3_week44_loyal_force.json | act3_week44_loyal_force
- ORPHAN-HARDCODED | src/data/narrative/act4/act4_impeachment_vote_vindicated.json | act4_impeachment_vote_vindicated
- ORPHAN-HARDCODED | src/data/narrative/act4/act4_week50_two_letters.json | act4_week50_two_letters
- ORPHAN-HARDCODED | src/data/narrative/act_campaign_rally.json | act_campaign_rally
- ORPHAN-HARDCODED | src/data/narrative/act_citizen_petitions.json | act_citizen_petitions
- ORPHAN-HARDCODED | src/data/narrative/act_monthly_press_conference.json | act_monthly_press_conference

POOL-FED sample (30 of 96; full inbound analysis in `_p2c_out.txt` logic):

- ORPHAN-POOLSAMPLE | src/data/narrative/act1/act1_family_jonas_challenge.json | act1_family_jonas_challenge
- ORPHAN-POOLSAMPLE | src/data/narrative/act1/act1_family_liora_mikhael.json | act1_family_liora_mikhael
- ORPHAN-POOLSAMPLE | src/data/narrative/act1/act1_family_tomas_bullying.json | act1_family_tomas_bullying
- ORPHAN-POOLSAMPLE | src/data/narrative/act1/act1_week10_archbishops_dinner.json | act1_week10_archbishops_dinner
- ORPHAN-POOLSAMPLE | src/data/narrative/act1/act1_week10_reform_committee.json | act1_week10_reform_committee
- ORPHAN-POOLSAMPLE | src/data/narrative/act1/act1_week10_tyvaren_intel.json | act1_week10_tyvaren_intel
- ORPHAN-POOLSAMPLE | src/data/narrative/act1/act1_week11_currency_run.json | act1_week11_currency_run
- ORPHAN-POOLSAMPLE | src/data/narrative/act1/act1_week11_kravenstal_powderkeg.json | act1_week11_kravenstal_powderkeg
- ORPHAN-POOLSAMPLE | src/data/narrative/act1/act1_week12_brenner_parade.json | act1_week12_brenner_parade
- ORPHAN-POOLSAMPLE | src/data/narrative/act1/act1_week12_nadia_voss.json | act1_week12_nadia_voss
- ORPHAN-POOLSAMPLE | src/data/narrative/act1/act1_week15_dravenni_petition.json | act1_week15_dravenni_petition
- ORPHAN-POOLSAMPLE | src/data/narrative/act1/act1_week1_archbishop_dinner.json | act1_week1_archbishop_dinner
- ORPHAN-POOLSAMPLE | src/data/narrative/act1/act1_week1_bni_discovery.json | act1_week1_bni_discovery
- ORPHAN-POOLSAMPLE | src/data/narrative/act1/act1_week1_cabinet_introductions.json | act1_week1_cabinet_introductions
- ORPHAN-POOLSAMPLE | src/data/narrative/act1/act1_week1_family_dinner.json | act1_week1_family_dinner
- ORPHAN-POOLSAMPLE | src/data/narrative/act1/act1_week1_first_briefing.json | act1_week1_first_briefing
- ORPHAN-POOLSAMPLE | src/data/narrative/act1/act1_week1_inauguration.json | act1_week1_inauguration
- ORPHAN-POOLSAMPLE | src/data/narrative/act1/act1_week1_parliament_caucus.json | act1_week1_parliament_caucus
- ORPHAN-POOLSAMPLE | src/data/narrative/act1/act1_week1_vyktor_briefing.json | act1_week1_vyktor_briefing
- ORPHAN-POOLSAMPLE | src/data/narrative/act1/act1_week2_cabinet_formation_meeting.json | act1_w2_formation_meeting
- ORPHAN-POOLSAMPLE | src/data/narrative/act1/act1_week3_economic_direction.json | act1_week3_economic_direction
- ORPHAN-POOLSAMPLE | src/data/narrative/act1/act1_week3_first_budget.json | act1_week3_first_budget
- ORPHAN-POOLSAMPLE | src/data/narrative/act1/act1_week3_mine_collapse.json | act1_week3_mine_collapse
- ORPHAN-POOLSAMPLE | src/data/narrative/act1/act1_week4_first_month.json | act1_week4_first_month
- ORPHAN-POOLSAMPLE | src/data/narrative/act1/act1_week4_halvek_portraits.json | act1_week4_halvek_portraits
- ORPHAN-POOLSAMPLE | src/data/narrative/act1/act1_week5_bni_crisis.json | act1_week5_bni_crisis
- ORPHAN-POOLSAMPLE | src/data/narrative/act1/act1_week6_labor_tensions.json | act1_week6_labor_tensions
- ORPHAN-POOLSAMPLE | src/data/narrative/act1/act1_week7_tyvaren_airspace.json | act1_week7_tyvaren_airspace
- ORPHAN-POOLSAMPLE | src/data/narrative/act1/act1_week8_bni_files.json | act1_week8_bni_files
- ORPHAN-POOLSAMPLE | src/data/narrative/act1/act1_week8_church_and_state.json | act1_week8_church_and_state

Note: `act6_week84_corporate_deal` is TRUE ORPHAN (`src/data/narrative/act6/act6_week84_corporate_deal.json` weekAvailable 84, no agenda `week84.json` ABSENT, no hard entry, no inbound) — see `02-scheduling.md` week-84.
Agenda→missing-scene BROKEN (scheduling, not scene-graph): `src/data/agenda/week83.json:7` `act6_week83_energy_transition` NOT_IN_REGISTRY (no `*energy_transition*`/`*week83*` under `src/data/narrative/`).

## 5. FLAG LEDGER

Scope: writers = choice `flags[]` + `weekStore.ts` vote `successFlags/failureFlags` + `devJumpToWeek` seeds + dynamic `election_won_term_<N>`; readers = scene/choice/narrative `prerequisites`/`conditions` flag + `stat:flags.*` + `prerequisiteFlags[]`. Engine-internal reads (news/diary/ending calculators reading flags generically) NOT enumerated — so WRITTEN_NEVER_READ means never-read-in-scene-JSON, not never-read-at-runtime.

Totals: FLAGS=2958 WRITER_FLAGS=2947 READER_FLAGS=161. Full machine ledger (2958 rows `LEDGER | flag | W | R | ...`) in `_p2d_out.txt`.

READ_NEVER_WRITTEN (11 — read in scene JSON, never written in scene/vote/seed):

- READ_NEVER_WRITTEN | amber_coast_ftz_signed | readers=src/data/narrative/act3/act3_port_bonds_return.json:top[1].port_bonds_collect_full.conditions(stat); src/data/narrative/act3/act3_port_bonds_return.json:top[2].port_bonds_collect_full_no_ftz.conditions(stat)
- READ_NEVER_WRITTEN | bni_crisis_resolved | readers=src/data/narrative/act1/family/family_bni_night.json:top.prerequisites(stat)
- READ_NEVER_WRITTEN | coup_attempted | readers=src/data/narrative/act3/act3_week39_act3_climax.json:top[4].climax_coup_survival_focus.conditions(stat)
- READ_NEVER_WRITTEN | deficit_critical | readers=src/data/narrative/act1/act1_chain_deficit_crisis.json:top.prerequisites(stat)
- READ_NEVER_WRITTEN | executive_consolidation | readers=src/data/narrative/act1/act1_chain_executive_governance.json:top.prerequisites(stat)
- READ_NEVER_WRITTEN | mole_correct | readers=src/data/narrative/act4/act4_mole_correct_accusation.json:top.prerequisites(stat)
- READ_NEVER_WRITTEN | mole_wrongly_accused | readers=src/data/narrative/act4/act4_mole_wrong_accusation.json:top.prerequisites(stat)
- READ_NEVER_WRITTEN | nadia_cooperated | readers=src/data/narrative/act3/act3_week29_vyktor_exposed.json:top.prerequisites(stat)
- READ_NEVER_WRITTEN | nadia_met | readers=src/data/narrative/act1/act1_chain_nadia_investigation.json:top.prerequisites(stat)
- READ_NEVER_WRITTEN | tyvaren_mobilization | readers=src/data/narrative/act1/act1_chain_tyvaren_border_standoff.json:top.prerequisites(stat)
- READ_NEVER_WRITTEN | tyvaren_war_imminent | readers=src/data/narrative/act3/act3_assassination_cabinet.json:top[3].cabinet_blame_tyvaren.conditions(stat); src/data/narrative/act3/act3_assassination_cabinet.json:top[4].cabinet_blame_tyvaren_thin.conditions(stat)

WRITTEN_NEVER_READ (2797 — written but never read in scene JSON conditions/prereqs; may be read by engines or dead): count + first 30 (full in `_p2d_out.txt`):

- WRITTEN_NEVER_READ | accelerated_reform | writers=src/data/narrative/act1/act1_week9_first_quarter.json:top[0].quarterly_double_down_reform
- WRITTEN_NEVER_READ | accelerated_strategy | writers=src/data/narrative/act4/act4_coordinated_response.json:top[0].coordinated_accelerate
- WRITTEN_NEVER_READ | accountability_abandoned | writers=src/data/narrative/act3/act3_week38_soren_trial.json:top[2].soren_trial_leave_alone
- WRITTEN_NEVER_READ | accountability_absolute | writers=src/data/narrative/act3/act3_bca_report_wk44.json:top[0].bca_prosecute_vyktor
- WRITTEN_NEVER_READ | accountability_compromised | writers=src/data/narrative/act3/act3_bca_report_wk44.json:top[2].bca_pardon_vyktor_shut_down
- WRITTEN_NEVER_READ | accountability_maximal | writers=src/data/narrative/act4/act4_post_coup_consolidation.json:top[0].consolidate_purge
- WRITTEN_NEVER_READ | accountability_provision_amended | writers=src/data/narrative/act2/act2_week17_soren_debate.json:top[1].soren_debate_compromise
- WRITTEN_NEVER_READ | accountability_provision_passed | writers=src/data/narrative/act2/act2_week17_soren_debate.json:top[0].soren_debate_push_through
- WRITTEN_NEVER_READ | accountability_provision_withdrawn | writers=src/data/narrative/act2/act2_week17_soren_debate.json:top[2].soren_debate_withdraw_provision
- WRITTEN_NEVER_READ | accused_irina_dusek | writers=src/data/narrative/act4/act4_mole_confrontation.json:top[1].mole_accuse_dusek
- WRITTEN_NEVER_READ | accused_karsten_volek | writers=src/data/narrative/act4/act4_mole_confrontation.json:top[2].mole_accuse_volek
- WRITTEN_NEVER_READ | accused_petrin_half | writers=src/data/narrative/act4/act4_mole_confrontation.json:top[0].mole_accuse_petrin
- WRITTEN_NEVER_READ | achievable_reform_path | writers=src/data/narrative/act3/act3_autonomy_commission.json:top[1].autonomy_commission_narrow
- WRITTEN_NEVER_READ | act1_climax_resolved | writers=src/data/narrative/act1/act1_week13_no_confidence.json:top[0].no_confidence_fight_reformist; src/data/narrative/act1/act1_week13_no_confidence.json:top[1].no_confidence_fight_pragmatic; src/data/narrative/act1/act1_week13_no_confidence.json:top[2].no_confidence_deal_with_workers
- WRITTEN_NEVER_READ | act2_complete | writers=src/data/narrative/act2/act2_week26_referendum_decisive.json:top[0].referendum_decisive_reach_out; src/data/narrative/act2/act2_week26_referendum_decisive.json:top[1].referendum_decisive_mandate_claim; src/data/narrative/act2/act2_week26_referendum_decisive.json:top[2].referendum_decisive_quiet_exit
- WRITTEN_NEVER_READ | act2_week26_megaproject_followup_complete | writers=src/data/narrative/act2/act2_week26_megaproject_followup.json:segments.highway_close_intervene[0].highway_intervene_end; src/data/narrative/act2/act2_week26_megaproject_followup.json:segments.dam_close_staren_resolved[0].dam_staren_resolved_end; src/data/narrative/act2/act2_week26_megaproject_followup.json:segments.port_close_diplomatic[0].port_diplomatic_end
- WRITTEN_NEVER_READ | act3_cabinet_renewed | writers=src/data/narrative/act3/act3_week31_inner_circle.json:top[0].inner_circle_reshuffle
- WRITTEN_NEVER_READ | act3_chain_bca_aftermath_complete | writers=src/data/narrative/act3/act3_chain_bca_aftermath.json:top[0].bca_aftermath_continue
- WRITTEN_NEVER_READ | act3_chain_coalition_cleanup_complete | writers=src/data/narrative/act3/act3_chain_coalition_cleanup.json:top[0].coalition_cleanup_continue
- WRITTEN_NEVER_READ | act3_chain_csad_formation_complete | writers=src/data/narrative/act3/act3_chain_csad_formation.json:top[0].csad_formation_continue
- WRITTEN_NEVER_READ | act3_chain_elena_dirt_released_complete | writers=src/data/narrative/act3/act3_chain_elena_dirt_released.json:top[0].elena_dirt_continue
- WRITTEN_NEVER_READ | act3_chain_elena_full_war_complete | writers=src/data/narrative/act3/act3_chain_elena_full_war.json:top[0].elena_war_continue
- WRITTEN_NEVER_READ | act3_chain_halvekist_backlash_complete | writers=src/data/narrative/act3/act3_chain_halvekist_backlash.json:top[0].halvekist_backlash_continue
- WRITTEN_NEVER_READ | act3_chain_night_of_justice_aftermath_complete | writers=src/data/narrative/act3/act3_chain_night_of_justice_aftermath.json:top[0].night_justice_continue
- WRITTEN_NEVER_READ | act3_chain_selective_justice_aftermath_complete | writers=src/data/narrative/act3/act3_chain_selective_justice_aftermath.json:top[0].selective_justice_continue
- WRITTEN_NEVER_READ | act3_chain_ssd_aftermath_complete | writers=src/data/narrative/act3/act3_chain_ssd_aftermath.json:top[0].ssd_aftermath_continue
- WRITTEN_NEVER_READ | act3_chain_ssd_reform_complete | writers=src/data/narrative/act3/act3_chain_ssd_reform.json:top[0].ssd_reform_continue
- WRITTEN_NEVER_READ | act3_chain_vyktor_exit_complete | writers=src/data/narrative/act3/act3_chain_vyktor_exit.json:top[0].vyktor_exit_continue
- WRITTEN_NEVER_READ | act3_chain_vyktor_trial_complete | writers=src/data/narrative/act3/act3_chain_vyktor_trial.json:top[0].vyktor_trial_continue
- WRITTEN_NEVER_READ | act3_climax_diplomatic | writers=src/data/narrative/act3/act3_week39_act3_climax.json:top[1].climax_diplomatic_surge

... + 2767 more in `_p2d_out.txt`.

SEEDED_ONLY (4 — written only by `src/stores/weekStore.ts:1669-1676` `devJumpToWeek`, no scene `flags[]` writer):

- SEEDED_ONLY | hawk_network_active | writers=src/stores/weekStore.ts:devJumpToWeek(seedFlags)
- SEEDED_ONLY | term_1_complete | writers=src/stores/weekStore.ts:devJumpToWeek(seedFlags)
- SEEDED_ONLY | election_won_first | writers=src/stores/weekStore.ts:devJumpToWeek(seedFlags)
- SEEDED_ONLY | diplomatic_table_attended | writers=src/stores/weekStore.ts:devJumpToWeek(seedFlags)

Seeds with scene writers (NOT seeded-only): `permanent_injury_sustained`, `assassination_survived`, `term_2_begun`, `geological_survey_funded` (have choice-`flags[]` writers). Vote flags (`no_confidence_passed/failed`, `government_fallen/survived`, `impeachment_vote_passed/failed` per `weekStore.ts:162-170,218-223`) are writers via `voteConfig`.
