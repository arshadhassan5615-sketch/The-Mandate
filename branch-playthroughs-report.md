# Branch playthroughs and dropped-chain proof (work order B1)

## Summary
- Branches (NEVER_OFFERED_MANDATORY): 32; PASS 32; FAIL 0
- Dropped chains: 59 (conditions 13, probability 10, past window 36, no cause 0); LEGIT 59; SUSPECT 0
- Fired chain targets delivered by initWeek: 450 (pushed 237, skipped missing scene 0, skipped visited 130, skipped window 0, skipped duplicate 83, dropped after push 0)

## Table A: branch playthroughs
| # | id | window | start week | PASS/FAIL | offered week | played week | note |
|---|---|---|---|---|---|---|---|
| 1 | agenda_w26_referendum_decisive | 26-26 | 23 | PASS | 26 | 26 | stats re-applied 3x |
| 2 | agenda_w26_referendum_narrow | 26-26 | 23 | PASS | 26 | 26 | stats re-applied 3x |
| 3 | agenda_w27_aftermath_decisive | 27-28 | 24 | PASS | 27 | 27 | stats re-applied 3x |
| 4 | agenda_w27_aftermath_narrow | 27-28 | 24 | PASS | 27 | 27 | stats re-applied 3x |
| 5 | agenda_w28_economic_crisis | 28-30 | 25 | PASS | 28 | 28 | stats re-applied 3x |
| 6 | agenda_w29_vyktor_exposed | 29-31 | 26 | PASS | 29 | 29 | stats re-applied 3x |
| 7 | agenda_w30_betrayal_vostane | 30-32 | 27 | PASS | 30 | 30 | stats re-applied 3x |
| 8 | agenda_w33_war_preparations | 33-35 | 30 | PASS | 33 | 33 | stats re-applied 3x |
| 9 | agenda_w33_diplomatic_negotiation | 33-35 | 30 | PASS | 33 | 33 | stats re-applied 3x |
| 10 | agenda_w37_coup_attempt | 37-37 | 34 | PASS | 37 | 37 | stats re-applied 3x |
| 11 | agenda_w40_war_begins | 40-42 | 37 | PASS | 40 | 40 | stats re-applied 3x |
| 12 | agenda_w40_exile_government | 40-42 | 37 | PASS | 40 | 40 | stats re-applied 3x |
| 13 | agenda_w40_reform_consolidation | 41-44 | 38 | PASS | 41 | 41 | stats re-applied 3x |
| 14 | agenda_w41_reform_implementation | 41-43 | 38 | PASS | 41 | 41 | stats re-applied 3x |
| 15 | agenda_w42_war_strategy | 42-44 | 39 | PASS | 42 | 42 | stats re-applied 3x |
| 16 | agenda_w42_austerity_bites | 42-44 | 39 | PASS | 42 | 42 | stats re-applied 3x |
| 17 | agenda_w43_family_resolution | 43-47 | 40 | PASS | 43 | 43 | stats re-applied 3x |
| 18 | agenda_w44_civilian_front | 44-46 | 41 | PASS | 44 | 44 | stats re-applied 3x |
| 19 | agenda_w44_counter_coup | 44-46 | 41 | PASS | 44 | 44 | stats re-applied 3x |
| 20 | agenda_w44_reform_backlash | 44-46 | 41 | PASS | 44 | 44 | stats re-applied 3x |
| 21 | agenda_w45_uprising | 45-47 | 42 | PASS | 45 | 45 | stats re-applied 3x |
| 22 | agenda_w46_final_battle | 46-48 | 43 | PASS | 46 | 46 | stats re-applied 3x |
| 23 | agenda_w47_new_order | 47-49 | 44 | PASS | 47 | 47 | stats re-applied 3x |
| 24 | agenda_w48_war_outcome | 48-50 | 45 | PASS | 48 | 48 | stats re-applied 3x |
| 25 | agenda_w48_collapse_endgame | 48-50 | 45 | PASS | 48 | 48 | stats re-applied 3x |
| 26 | agenda_w56_constitutional_court | 56-58 | 53 | PASS | 56 | 56 | stats re-applied 3x |
| 27 | agenda_w57_fainting_spell | 57-59 | 54 | PASS | 57 | 57 | stats re-applied 3x |
| 28 | agenda_w83_energy_transition_nationalized | 83-85 | 80 | PASS | 83 | 83 | stats re-applied 3x |
| 29 | agenda_w83_energy_transition_aramco | 83-85 | 80 | PASS | 83 | 83 | stats re-applied 3x |
| 30 | agenda_w27_aftermath_rejected | 27-28 | 24 | PASS | 27 | 27 | stats re-applied 3x |
| 31 | agenda_w56_halvek_bench | 56-58 | 53 | PASS | 56 | 56 | stats re-applied 3x |
| 32 | agenda_w83_coal_ledger | 83-85 | 80 | PASS | 83 | 83 | stats re-applied 3x |

## Table B: dropped chains
| profile | chain | target | source choice | fire week | drop week | reason | conditions (actual at fire time) | LEGIT/SUSPECT | why |
|---|---|---|---|---|---|---|---|---|---|
| reformist-chooser | chain_813_act2_tyvaren_blind_spot | act2_tyvaren_blind_spot | bni_full_shutdown | 16 | 17 | conditions | nation.militaryReadiness < 40 -> actual 40, FAIL | LEGIT | genuinely false at fire time: nation.militaryReadiness < 40 (actual 40) |
| reformist-chooser | chain_852_act2_chain_vael_capital_flight | act2_chain_vael_capital_flight | budget_revenue_reform | 24 | 23 | conditions | factions.businessClass < 35 -> actual 100, FAIL | LEGIT | genuinely false at fire time: factions.businessClass < 35 (actual 100) |
| reformist-chooser | chain_859_act2_week20_budget_crisis | act2_week20_budget_crisis | vostane_reverse_policy | 25 | 24 | past window | (none) | LEGIT | evaluated at fire week 25, after target window end 22 (target played: week 20 via agenda_w20_budget_crisis) |
| reformist-chooser | chain_843_act2_week26_referendum_decisive | act2_week26_referendum_decisive | kolvar_reject_deal | 26 | 25 | conditions | factions.halvekists < 35 -> actual 100, FAIL | LEGIT | genuinely false at fire time: factions.halvekists < 35 (actual 100) |
| reformist-chooser | chain_850_act3_week28_economic_crisis | act3_week28_economic_crisis | vael_ignore_campaign_harder | 30 | 29 | conditions | factions.businessClass < 30 -> actual 100, FAIL | LEGIT | genuinely false at fire time: factions.businessClass < 30 (actual 100) |
| reformist-chooser | chain_894_act3_week31_inner_circle | act3_week31_inner_circle | decline_official_channels | 34 | 33 | past window | (none) | LEGIT | evaluated at fire week 34, after target window end 33 (target played: week 31 via agenda_w31_inner_circle) |
| reformist-chooser | chain_893_act3_week32_tyvaren_ultimatum | act3_week32_tyvaren_ultimatum | decline_official_channels | 35 | 34 | past window | (none) | LEGIT | evaluated at fire week 35, after target window end 34 (target played: week 32 via agenda_w32_tyvaren_ultimatum) |
| reformist-chooser | chain_890_act3_week31_inner_circle | act3_week31_inner_circle | new_cabinet_empower | 36 | 35 | past window | (none) | LEGIT | evaluated at fire week 36, after target window end 33 (target played: week 31 via agenda_w31_inner_circle) |
| reformist-chooser | chain_838_act3_week37_coup_attempt | act3_week37_coup_attempt | neg_brenner_refuse | 36 | 36 | probability | (none) | LEGIT | all conditions passed; probability roll failed (p=0.3, inferred) |
| reformist-chooser | chain_913_act3_week31_inner_circle | act3_week31_inner_circle | public_reckoning_case_by_case | 40 | 39 | past window | (none) | LEGIT | evaluated at fire week 40, after target window end 33 (target played: week 31 via agenda_w31_inner_circle) |
| reformist-chooser | chain_915_act3_week34_dravenhollow | act3_week34_dravenhollow | dravenni_insurgency_autonomy | 41 | 40 | past window | (none) | LEGIT | evaluated at fire week 41, after target window end 36 (target played: week 34 via agenda_w34_dravenhollow) |
| reformist-chooser | chain_924_act3_week28_economic_crisis | act3_week28_economic_crisis | halvekist_legal_war_withdraw | 43 | 42 | past window | (none) | LEGIT | evaluated at fire week 43, after target window end 30 (target played: week 28 via __chain__act3_week28_economic_crisis) |
| reformist-chooser | chain_932_act4_week41_reform_implementation | act4_week41_reform_implementation | emergency_powers_refuse | 44 | 43 | past window | (none) | LEGIT | evaluated at fire week 44, after target window end 43 (target played: week 41 via agenda_w40_reform_consolidation) |
| reformist-chooser | chain_938_act4_week43_family_resolution | act4_week43_family_resolution | tomas_redemption_constructive_institutions | 50 | 49 | past window | (none) | LEGIT | evaluated at fire week 50, after target window end 47 (target played: week 43 via agenda_w43_family_resolution) |
| reformist-chooser | chain_939_act4_week43_family_resolution | act4_week43_family_resolution | family_healing_individual_attention | 52 | 51 | past window | (none) | LEGIT | evaluated at fire week 52, after target window end 47 (target played: week 43 via agenda_w43_family_resolution) |
| authoritarian-chooser | chain_961_act1_chain_bni_press | act1_chain_bni_press | bni_redirect | 4 | 3 | probability | (none) | LEGIT | all conditions passed; probability roll failed (p=0.65, inferred) |
| authoritarian-chooser | chain_964_act1_chain_jonas_press_rebellion | act1_chain_jonas_press_rebellion | jonas_shut_down | 8 | 7 | conditions | personal.marriageHealth < 40 -> actual 51, FAIL | LEGIT | genuinely false at fire time: personal.marriageHealth < 40 (actual 51) |
| authoritarian-chooser | chain_965_act1_chain_liora_radicalized | act1_chain_liora_radicalized | liora_mikhael_silence | 9 | 8 | conditions | personal.lioraRelationship < 35 -> actual 47, FAIL | LEGIT | genuinely false at fire time: personal.lioraRelationship < 35 (actual 47) |
| authoritarian-chooser | chain_960_act1_chain_tomas_nationalist | act1_chain_tomas_nationalist | tomas_toughen_up | 10 | 9 | conditions | personal.tomasWellbeing < 35 -> actual 37, FAIL | LEGIT | genuinely false at fire time: personal.tomasWellbeing < 35 (actual 37) |
| authoritarian-chooser | chain_1008_act2_week25_referendum_eve | act2_week25_referendum_eve | church_limited_exemptions | 29 | 28 | past window | (none) | LEGIT | evaluated at fire week 29, after target window end 26 (target played: week 25 via agenda_w25_referendum_eve) |
| authoritarian-chooser | chain_984_act3_econ_general_strike | act3_econ_general_strike | maric_hold_line | 30 | 34 | probability | (none) | LEGIT | all conditions passed; probability roll failed (p=0.5, inferred) |
| authoritarian-chooser | chain_1038_act3_week31_inner_circle | act3_week31_inner_circle | new_cabinet_short_leash | 37 | 36 | past window | (none) | LEGIT | evaluated at fire week 37, after target window end 33 (target played: week 31 via agenda_w31_inner_circle) |
| authoritarian-chooser | chain_1051_act3_week28_economic_crisis | act3_week28_economic_crisis | warecon_state_control | 37 | 36 | past window | (none) | LEGIT | evaluated at fire week 37, after target window end 30 (target never played in this walk) |
| authoritarian-chooser | chain_1010_act3_chain_port_tyvaren_escalation | act3_chain_port_tyvaren_escalation | port_accelerate_end | 32 | 37 | probability | (none) | LEGIT | all conditions passed; probability roll failed (p=0.65, inferred) |
| authoritarian-chooser | chain_1041_act3_battle_gravenmark | act3_battle_gravenmark | war_prep_forward_defense | 38 | 37 | probability | (none) | LEGIT | all conditions passed; probability roll failed (p=0.7, inferred) |
| authoritarian-chooser | chain_1031_act3_tyvaren_standoff | act3_tyvaren_standoff | fort_continue_as_planned | 37 | 38 | probability | (none) | LEGIT | all conditions passed; probability roll failed (p=0.5, inferred) |
| authoritarian-chooser | chain_1068_act3_week33_war_preparations | act3_week33_war_preparations | forum_buy_time_military | 39 | 38 | past window | (none) | LEGIT | evaluated at fire week 39, after target window end 35 (target played: week 33 via agenda_w33_war_preparations) |
| authoritarian-chooser | chain_1061_act4_civil_conflict_arc | act4_civil_conflict_arc | brenner_refuse_bluff | 40 | 39 | probability | (none) | LEGIT | all conditions passed; probability roll failed (p=0.6, inferred) |
| authoritarian-chooser | chain_987_act4_emergency_powers_invoked | act4_emergency_powers_invoked | kolvar_full_capitulation | 41 | 40 | probability | (none) | LEGIT | all conditions passed; probability roll failed (p=0.7, inferred) |
| authoritarian-chooser | chain_1072_act3_week31_inner_circle | act3_week31_inner_circle | brenner_response_assert_authority | 42 | 41 | past window | (none) | LEGIT | evaluated at fire week 42, after target window end 33 (target played: week 31 via agenda_w31_inner_circle) |
| authoritarian-chooser | chain_1090_act4_week43_family_resolution | act4_week43_family_resolution | tomas_redemption_firm_boundaries | 50 | 49 | past window | (none) | LEGIT | evaluated at fire week 50, after target window end 47 (target played: week 43 via agenda_w43_family_resolution) |
| authoritarian-chooser | chain_1092_act4_week43_family_resolution | act4_week43_family_resolution | family_conditional_firmer_boundaries | 53 | 52 | past window | (none) | LEGIT | evaluated at fire week 53, after target window end 47 (target played: week 43 via agenda_w43_family_resolution) |
| populist-chooser | chain_1116_act2_tyvaren_blind_spot | act2_tyvaren_blind_spot | bni_full_shutdown | 16 | 17 | conditions | nation.militaryReadiness < 40 -> actual 54, FAIL | LEGIT | genuinely false at fire time: nation.militaryReadiness < 40 (actual 54) |
| populist-chooser | chain_1151_act3_week28_economic_crisis | act3_week28_economic_crisis | vostane_accept_with_grace | 29 | 28 | conditions | nation.economyHealth < 30 -> actual 100, FAIL | LEGIT | genuinely false at fire time: nation.economyHealth < 30 (actual 100) |
| populist-chooser | chain_1177_act3_week31_inner_circle | act3_week31_inner_circle | confidence_vote_public_appeal | 34 | 33 | past window | (none) | LEGIT | evaluated at fire week 34, after target window end 33 (target played: week 31 via agenda_w31_inner_circle) |
| populist-chooser | chain_1176_act3_week28_economic_crisis | act3_week28_economic_crisis | privatization_accept | 35 | 34 | past window | (none) | LEGIT | evaluated at fire week 35, after target window end 30 (target played: week 28 via __chain__act3_week28_economic_crisis) |
| populist-chooser | chain_1187_act3_week28_economic_crisis | act3_week28_economic_crisis | warecon_state_control | 37 | 36 | past window | (none) | LEGIT | evaluated at fire week 37, after target window end 30 (target played: week 28 via __chain__act3_week28_economic_crisis) |
| populist-chooser | chain_1194_act3_week39_act3_climax | act3_week39_act3_climax | gravenmark_trust_dusek | 41 | 40 | past window | (none) | LEGIT | evaluated at fire week 41, after target window end 40 (target played: week 39 via agenda_w39_act3_climax) |
| populist-chooser | chain_1200_act3_week39_act3_climax | act3_week39_act3_climax | forum_binding_guarantees | 42 | 41 | past window | (none) | LEGIT | evaluated at fire week 42, after target window end 40 (target played: week 39 via agenda_w39_act3_climax) |
| populist-chooser | chain_1204_act3_week31_inner_circle | act3_week31_inner_circle | halvekist_legal_war_escalate | 44 | 43 | past window | (none) | LEGIT | evaluated at fire week 44, after target window end 33 (target played: week 31 via agenda_w31_inner_circle) |
| populist-chooser | chain_1209_act4_week41_reform_implementation | act4_week41_reform_implementation | security_regulate | 44 | 43 | past window | (none) | LEGIT | evaluated at fire week 44, after target window end 43 (target played: week 41 via agenda_w40_reform_consolidation) |
| populist-chooser | chain_1218_act4_week43_family_resolution | act4_week43_family_resolution | tomas_redemption_bring_close | 50 | 49 | past window | (none) | LEGIT | evaluated at fire week 50, after target window end 47 (target played: week 43 via agenda_w43_family_resolution) |
| populist-chooser | chain_1220_act4_week43_family_resolution | act4_week43_family_resolution | family_conditional_renew_commitment | 53 | 52 | past window | (none) | LEGIT | evaluated at fire week 53, after target window end 47 (target played: week 43 via agenda_w43_family_resolution) |
| seeded-random | chain_1249_act1_chain_jonas_press_rebellion | act1_chain_jonas_press_rebellion | jonas_shut_down | 8 | 7 | conditions | personal.marriageHealth < 40 -> actual 48, FAIL | LEGIT | genuinely false at fire time: personal.marriageHealth < 40 (actual 48) |
| seeded-random | chain_1245_act2_tyvaren_blind_spot | act2_tyvaren_blind_spot | bni_full_shutdown | 16 | 17 | conditions | nation.militaryReadiness < 40 -> actual 46, FAIL | LEGIT | genuinely false at fire time: nation.militaryReadiness < 40 (actual 46) |
| seeded-random | chain_1285_act3_jonas_separation | act3_jonas_separation | jonas_cannot_stop_now | 31 | 30 | conditions | personal.marriageHealth < 28 -> actual 48, FAIL | LEGIT | genuinely false at fire time: personal.marriageHealth < 28 (actual 48) |
| seeded-random | chain_1311_act3_week31_inner_circle | act3_week31_inner_circle | accept_no_forgiveness | 34 | 33 | past window | (none) | LEGIT | evaluated at fire week 34, after target window end 33 (target played: week 31 via agenda_w31_inner_circle) |
| seeded-random | chain_1301_act3_week28_economic_crisis | act3_week28_economic_crisis | privatization_accept | 35 | 34 | past window | (none) | LEGIT | evaluated at fire week 35, after target window end 30 (target never played in this walk) |
| seeded-random | chain_1284_act3_chain_highway_vael_corruption | act3_chain_highway_vael_corruption | highway_no_intervene_end | 36 | 35 | probability | (none) | LEGIT | all conditions passed; probability roll failed (p=0.6, inferred) |
| seeded-random | chain_1329_act3_week31_inner_circle | act3_week31_inner_circle | public_reckoning_clean_sweep | 40 | 39 | past window | (none) | LEGIT | evaluated at fire week 40, after target window end 33 (target played: week 31 via agenda_w31_inner_circle) |
| seeded-random | chain_1327_act3_week39_act3_climax | act3_week39_act3_climax | secretmob_confess_nation | 41 | 40 | past window | (none) | LEGIT | evaluated at fire week 41, after target window end 40 (target played: week 39 via agenda_w39_act3_climax) |
| seeded-random | chain_1335_act3_week39_act3_climax | act3_week39_act3_climax | forum_binding_guarantees | 42 | 41 | past window | (none) | LEGIT | evaluated at fire week 42, after target window end 40 (target played: week 39 via agenda_w39_act3_climax) |
| seeded-random | chain_1307_act3_chain_sovarka_tyvaren_response | act3_chain_sovarka_tyvaren_response | sovarka_full_survey_end | 39 | 42 | probability | (none) | LEGIT | all conditions passed; probability roll failed (p=0.7, inferred) |
| seeded-random | chain_1341_act3_week31_inner_circle | act3_week31_inner_circle | halvekist_legal_war_escalate | 44 | 43 | past window | (none) | LEGIT | evaluated at fire week 44, after target window end 33 (target played: week 31 via agenda_w31_inner_circle) |
| seeded-random | chain_1346_act4_week41_reform_implementation | act4_week41_reform_implementation | emergency_powers_refuse | 44 | 43 | past window | (none) | LEGIT | evaluated at fire week 44, after target window end 43 (target played: week 41 via agenda_w40_reform_consolidation) |
| seeded-random | chain_1266_act4_emergency_powers_invoked | act4_emergency_powers_invoked | kolvar_accept_modified_powers | 46 | 45 | conditions | personal.moralCompass < -20 -> actual 97, FAIL | LEGIT | genuinely false at fire time: personal.moralCompass < -20 (actual 97) |
| seeded-random | chain_1351_act4_week43_family_resolution | act4_week43_family_resolution | jonas_divorce_private_dignity | 49 | 48 | past window | (none) | LEGIT | evaluated at fire week 49, after target window end 47 (target played: week 43 via __chain__act4_week43_family_resolution) |
| seeded-random | chain_1355_act4_week43_family_resolution | act4_week43_family_resolution | tomas_redemption_bring_close | 50 | 49 | past window | (none) | LEGIT | evaluated at fire week 50, after target window end 47 (target played: week 43 via __chain__act4_week43_family_resolution) |
| seeded-random | chain_1356_act4_week43_family_resolution | act4_week43_family_resolution | family_conditional_firmer_boundaries | 53 | 52 | past window | (none) | LEGIT | evaluated at fire week 53, after target window end 47 (target played: week 43 via __chain__act4_week43_family_resolution) |

## Table C: fired chain targets that did not reach the pool
| profile | week | target | outcome | detail |
|---|---|---|---|---|
| reformist-chooser | 5 | mole_week5_complication | skipped duplicate | pool item agenda_w05_mole_week5_complication |
| reformist-chooser | 7 | intelligence_briefing_recurring | skipped visited | scene already visited |
| reformist-chooser | 11 | intelligence_briefing_recurring | skipped visited | scene already visited |
| reformist-chooser | 12 | family_dinner_recurring | skipped visited | scene already visited |
| reformist-chooser | 13 | act1_chain_watchtower_leak | skipped visited | scene already visited |
| reformist-chooser | 15 | intelligence_briefing_recurring | skipped visited | scene already visited |
| reformist-chooser | 17 | act2_week14_convention_opens | skipped visited | scene already visited |
| reformist-chooser | 18 | family_dinner_recurring | skipped visited | scene already visited |
| reformist-chooser | 19 | intelligence_briefing_recurring | skipped visited | scene already visited |
| reformist-chooser | 20 | act2_week20_budget_crisis | skipped duplicate | pool item agenda_w20_budget_crisis |
| reformist-chooser | 21 | act2_week21_superpower_choice | skipped duplicate | pool item agenda_w21_superpower_choice |
| reformist-chooser | 22 | act2_week22_oil_outcome | skipped duplicate | pool item agenda_w22_act2_week22_oil_outcome |
| reformist-chooser | 23 | intelligence_briefing_recurring | skipped visited | scene already visited |
| reformist-chooser | 24 | family_dinner_recurring | skipped visited | scene already visited |
| reformist-chooser | 24 | act2_week24_brenner_warning | skipped duplicate | pool item agenda_w24_brenner_warning |
| reformist-chooser | 25 | act2_week25_referendum_eve | skipped duplicate | pool item agenda_w25_referendum_eve |
| reformist-chooser | 27 | intelligence_briefing_recurring | skipped visited | scene already visited |
| reformist-chooser | 27 | act2_week27_press_conference_failed | skipped duplicate | pool item agenda_w27_press_conference_failed |
| reformist-chooser | 28 | act2_week28_voss_crisis | skipped duplicate | pool item agenda_w28_act2_week28_voss_crisis |
| reformist-chooser | 30 | family_dinner_recurring | skipped visited | scene already visited |
| reformist-chooser | 31 | intelligence_briefing_recurring | skipped visited | scene already visited |
| reformist-chooser | 31 | act3_week29_vyktor_exposed | skipped visited | scene already visited |
| reformist-chooser | 31 | act3_week31_inner_circle | skipped duplicate | pool item agenda_w31_inner_circle |
| reformist-chooser | 31 | act3_confidence_vote | skipped visited | scene already visited |
| reformist-chooser | 32 | act3_week32_tyvaren_ultimatum | skipped duplicate | pool item agenda_w32_tyvaren_ultimatum |
| reformist-chooser | 32 | act3_constitution_implementation | skipped visited | scene already visited |
| reformist-chooser | 32 | act2_week32_voss_outcome | skipped duplicate | pool item agenda_w32_act2_week32_voss_outcome |
| reformist-chooser | 32 | act3_week31_inner_circle | skipped visited | scene already visited |
| reformist-chooser | 33 | act3_week31_inner_circle | skipped visited | scene already visited |
| reformist-chooser | 33 | act3_week32_tyvaren_ultimatum | skipped visited | scene already visited |
| reformist-chooser | 35 | intelligence_briefing_recurring | skipped visited | scene already visited |
| reformist-chooser | 35 | act3_superpower_pressure | skipped visited | scene already visited |
| reformist-chooser | 36 | family_dinner_recurring | skipped visited | scene already visited |
| reformist-chooser | 36 | act3_arcturian_cooldown | skipped visited | scene already visited |
| reformist-chooser | 37 | act3_week37_military_rally | skipped duplicate | pool item agenda_w37_military_rally |
| reformist-chooser | 38 | act3_week38_family_reckoning | skipped duplicate | pool item agenda_w38_family_reckoning |
| reformist-chooser | 38 | act3_coalition_government | skipped duplicate | pool item agenda_w38_coalition_government |
| reformist-chooser | 39 | intelligence_briefing_recurring | skipped visited | scene already visited |
| reformist-chooser | 39 | act3_week39_act3_climax | skipped duplicate | pool item agenda_w39_act3_climax |
| reformist-chooser | 40 | act3_dravenni_autonomy_talks | skipped visited | scene already visited |
| reformist-chooser | 40 | act3_military_democracy_bond | skipped visited | scene already visited |
| reformist-chooser | 41 | act4_week41_reform_implementation | skipped duplicate | pool item agenda_w40_reform_consolidation |
| reformist-chooser | 42 | family_dinner_recurring | skipped visited | scene already visited |
| reformist-chooser | 43 | intelligence_briefing_recurring | skipped visited | scene already visited |
| reformist-chooser | 43 | act4_week43_family_resolution | skipped duplicate | pool item agenda_w43_family_resolution |
| reformist-chooser | 44 | act4_week44_reform_backlash | skipped duplicate | pool item agenda_w44_reform_backlash |
| reformist-chooser | 44 | act4_week43_family_resolution | skipped visited | scene already visited |
| reformist-chooser | 45 | act4_week43_family_resolution | skipped visited | scene already visited |
| reformist-chooser | 45 | act4_week45_uprising | skipped duplicate | pool item agenda_w45_uprising |
| reformist-chooser | 47 | intelligence_briefing_recurring | skipped visited | scene already visited |
| reformist-chooser | 47 | act4_week43_family_resolution | skipped visited | scene already visited |
| reformist-chooser | 47 | act4_week47_new_order | skipped duplicate | pool item agenda_w47_new_order |
| reformist-chooser | 48 | family_dinner_recurring | skipped visited | scene already visited |
| reformist-chooser | 48 | act4_week48_collapse_endgame | skipped duplicate | pool item agenda_w48_collapse_endgame |
| authoritarian-chooser | 5 | mole_week5_complication | skipped duplicate | pool item agenda_w05_mole_week5_complication |
| authoritarian-chooser | 7 | intelligence_briefing_recurring | skipped visited | scene already visited |
| authoritarian-chooser | 11 | intelligence_briefing_recurring | skipped visited | scene already visited |
| authoritarian-chooser | 12 | family_dinner_recurring | skipped visited | scene already visited |
| authoritarian-chooser | 14 | act1_week13_no_confidence | skipped visited | scene already visited |
| authoritarian-chooser | 15 | intelligence_briefing_recurring | skipped visited | scene already visited |
| authoritarian-chooser | 18 | family_dinner_recurring | skipped visited | scene already visited |
| authoritarian-chooser | 18 | act2_week15_theron_compromise | skipped visited | scene already visited |
| authoritarian-chooser | 18 | act2_week18_vael_oligarch | skipped duplicate | pool item agenda_w18_vael_oligarch |
| authoritarian-chooser | 19 | intelligence_briefing_recurring | skipped visited | scene already visited |
| authoritarian-chooser | 21 | act2_week21_superpower_choice | skipped duplicate | pool item agenda_w21_superpower_choice |
| authoritarian-chooser | 22 | act2_week22_oil_outcome | skipped duplicate | pool item agenda_w22_act2_week22_oil_outcome |
| authoritarian-chooser | 23 | intelligence_briefing_recurring | skipped visited | scene already visited |
| authoritarian-chooser | 24 | family_dinner_recurring | skipped visited | scene already visited |
| authoritarian-chooser | 25 | act2_week25_referendum_eve | skipped duplicate | pool item agenda_w25_referendum_eve |
| authoritarian-chooser | 27 | intelligence_briefing_recurring | skipped visited | scene already visited |
| authoritarian-chooser | 27 | act2_week27_press_conference_failed | skipped duplicate | pool item agenda_w27_press_conference_failed |
| authoritarian-chooser | 28 | act2_week28_voss_crisis | skipped duplicate | pool item agenda_w28_act2_week28_voss_crisis |
| authoritarian-chooser | 30 | family_dinner_recurring | skipped visited | scene already visited |
| authoritarian-chooser | 31 | intelligence_briefing_recurring | skipped visited | scene already visited |
| authoritarian-chooser | 31 | act3_week31_inner_circle | skipped duplicate | pool item agenda_w31_inner_circle |
| authoritarian-chooser | 32 | act3_week31_inner_circle | skipped visited | scene already visited |
| authoritarian-chooser | 32 | act2_week32_voss_outcome | skipped duplicate | pool item agenda_w32_act2_week32_voss_outcome |
| authoritarian-chooser | 32 | act3_week32_tyvaren_ultimatum | skipped duplicate | pool item agenda_w32_tyvaren_ultimatum |
| authoritarian-chooser | 33 | act3_constitution_implementation | skipped visited | scene already visited |
| authoritarian-chooser | 33 | act3_week33_war_preparations | skipped duplicate | pool item agenda_w33_war_preparations |
| authoritarian-chooser | 34 | act3_week32_tyvaren_ultimatum | skipped visited | scene already visited |
| authoritarian-chooser | 35 | intelligence_briefing_recurring | skipped visited | scene already visited |
| authoritarian-chooser | 35 | act3_arcturian_cooldown | skipped visited | scene already visited |
| authoritarian-chooser | 35 | act3_tyvaren_border_skirmish | skipped visited | scene already visited |
| authoritarian-chooser | 35 | act3_dravenni_insurgency | skipped visited | scene already visited |
| authoritarian-chooser | 35 | act3_week33_war_preparations | skipped visited | scene already visited |
| authoritarian-chooser | 36 | family_dinner_recurring | skipped visited | scene already visited |
| authoritarian-chooser | 37 | act3_week37_military_rally | skipped duplicate | pool item agenda_w37_military_rally |
| authoritarian-chooser | 38 | act3_week36_nadia_publishes | skipped visited | scene already visited |
| authoritarian-chooser | 38 | act3_dravenni_insurgency | skipped visited | scene already visited |
| authoritarian-chooser | 38 | act3_week38_family_reckoning | skipped duplicate | pool item agenda_w38_family_reckoning |
| authoritarian-chooser | 39 | intelligence_briefing_recurring | skipped visited | scene already visited |
| authoritarian-chooser | 39 | act3_week39_act3_climax | skipped duplicate | pool item agenda_w39_act3_climax |
| authoritarian-chooser | 40 | act3_week39_act3_climax | skipped visited | scene already visited |
| authoritarian-chooser | 40 | act4_week40_war_begins | skipped duplicate | pool item agenda_w40_war_begins |
| authoritarian-chooser | 40 | act3_military_deployment | skipped visited | scene already visited |
| authoritarian-chooser | 42 | family_dinner_recurring | skipped visited | scene already visited |
| authoritarian-chooser | 42 | act3_halvekist_legal_war | skipped visited | scene already visited |
| authoritarian-chooser | 42 | act4_jonas_divorce | skipped visited | scene already visited |
| authoritarian-chooser | 42 | act4_week42_war_strategy | skipped duplicate | pool item agenda_w42_war_strategy |
| authoritarian-chooser | 43 | intelligence_briefing_recurring | skipped visited | scene already visited |
| authoritarian-chooser | 43 | act4_week43_family_resolution | skipped duplicate | pool item agenda_w43_family_resolution |
| authoritarian-chooser | 43 | act4_emergency_powers_invoked | skipped visited | scene already visited |
| authoritarian-chooser | 44 | act4_week44_reform_backlash | skipped duplicate | pool item agenda_w44_reform_backlash |
| authoritarian-chooser | 44 | act4_week44_civilian_front | skipped duplicate | pool item agenda_w44_civilian_front |
| authoritarian-chooser | 44 | act4_week43_family_resolution | skipped visited | scene already visited |
| authoritarian-chooser | 45 | act4_week43_family_resolution | skipped visited | scene already visited |
| authoritarian-chooser | 46 | act4_week46_final_battle | skipped duplicate | pool item agenda_w46_final_battle |
| authoritarian-chooser | 46 | act4_internal_security_state | skipped visited | scene already visited |
| authoritarian-chooser | 47 | intelligence_briefing_recurring | skipped visited | scene already visited |
| authoritarian-chooser | 47 | act4_jonas_divorce | skipped visited | scene already visited |
| authoritarian-chooser | 47 | act4_week47_new_order | skipped duplicate | pool item agenda_w47_new_order |
| authoritarian-chooser | 48 | family_dinner_recurring | skipped visited | scene already visited |
| authoritarian-chooser | 48 | act4_week48_war_outcome | skipped duplicate | pool item agenda_w48_war_outcome |
| populist-chooser | 5 | mole_week5_complication | skipped duplicate | pool item agenda_w05_mole_week5_complication |
| populist-chooser | 7 | intelligence_briefing_recurring | skipped visited | scene already visited |
| populist-chooser | 11 | intelligence_briefing_recurring | skipped visited | scene already visited |
| populist-chooser | 12 | family_dinner_recurring | skipped visited | scene already visited |
| populist-chooser | 13 | act1_chain_watchtower_leak | skipped visited | scene already visited |
| populist-chooser | 15 | intelligence_briefing_recurring | skipped visited | scene already visited |
| populist-chooser | 18 | family_dinner_recurring | skipped visited | scene already visited |
| populist-chooser | 19 | intelligence_briefing_recurring | skipped visited | scene already visited |
| populist-chooser | 22 | act2_week22_nadia_investigation | skipped duplicate | pool item agenda_w22_nadia_investigation |
| populist-chooser | 22 | act2_week22_oil_outcome | skipped duplicate | pool item agenda_w22_act2_week22_oil_outcome |
| populist-chooser | 23 | intelligence_briefing_recurring | skipped visited | scene already visited |
| populist-chooser | 24 | family_dinner_recurring | skipped visited | scene already visited |
| populist-chooser | 25 | act2_week25_referendum_eve | skipped duplicate | pool item agenda_w25_referendum_eve |
| populist-chooser | 27 | intelligence_briefing_recurring | skipped visited | scene already visited |
| populist-chooser | 27 | act2_week27_press_conference_failed | skipped duplicate | pool item agenda_w27_press_conference_failed |
| populist-chooser | 28 | act2_week28_voss_crisis | skipped duplicate | pool item agenda_w28_act2_week28_voss_crisis |
| populist-chooser | 30 | family_dinner_recurring | skipped visited | scene already visited |
| populist-chooser | 31 | intelligence_briefing_recurring | skipped visited | scene already visited |
| populist-chooser | 31 | act3_week31_inner_circle | skipped duplicate | pool item agenda_w31_inner_circle |
| populist-chooser | 32 | act3_constitution_implementation | skipped visited | scene already visited |
| populist-chooser | 32 | act2_week32_voss_outcome | skipped duplicate | pool item agenda_w32_act2_week32_voss_outcome |
| populist-chooser | 32 | act3_week31_inner_circle | skipped visited | scene already visited |
| populist-chooser | 32 | act3_week32_tyvaren_ultimatum | skipped duplicate | pool item agenda_w32_tyvaren_ultimatum |
| populist-chooser | 34 | act3_week32_tyvaren_ultimatum | skipped visited | scene already visited |
| populist-chooser | 35 | intelligence_briefing_recurring | skipped visited | scene already visited |
| populist-chooser | 35 | act3_arcturian_cooldown | skipped visited | scene already visited |
| populist-chooser | 36 | family_dinner_recurring | skipped visited | scene already visited |
| populist-chooser | 37 | act3_kaelen_response | skipped visited | scene already visited |
| populist-chooser | 38 | act3_dravenni_autonomy_talks | skipped visited | scene already visited |
| populist-chooser | 38 | act3_week38_family_reckoning | skipped duplicate | pool item agenda_w38_family_reckoning |
| populist-chooser | 39 | intelligence_briefing_recurring | skipped visited | scene already visited |
| populist-chooser | 39 | act3_coalition_government | skipped visited | scene already visited |
| populist-chooser | 39 | act3_week39_act3_climax | skipped duplicate | pool item agenda_w39_act3_climax |
| populist-chooser | 40 | act3_arcturian_cooldown | skipped visited | scene already visited |
| populist-chooser | 41 | act4_week41_reform_implementation | skipped duplicate | pool item agenda_w40_reform_consolidation |
| populist-chooser | 42 | family_dinner_recurring | skipped visited | scene already visited |
| populist-chooser | 42 | act4_public_mandate | skipped visited | scene already visited |
| populist-chooser | 43 | intelligence_briefing_recurring | skipped visited | scene already visited |
| populist-chooser | 43 | act4_week43_family_resolution | skipped duplicate | pool item agenda_w43_family_resolution |
| populist-chooser | 44 | act4_week44_reform_backlash | skipped duplicate | pool item agenda_w44_reform_backlash |
| populist-chooser | 44 | act4_week43_family_resolution | skipped visited | scene already visited |
| populist-chooser | 45 | act4_week45_uprising | skipped duplicate | pool item agenda_w45_uprising |
| populist-chooser | 47 | intelligence_briefing_recurring | skipped visited | scene already visited |
| populist-chooser | 47 | act4_week43_family_resolution | skipped visited | scene already visited |
| populist-chooser | 47 | act4_week47_new_order | skipped duplicate | pool item agenda_w47_new_order |
| populist-chooser | 48 | family_dinner_recurring | skipped visited | scene already visited |
| populist-chooser | 48 | act4_week48_collapse_endgame | skipped duplicate | pool item agenda_w48_collapse_endgame |
| populist-chooser | 48 | act4_week48_war_outcome | skipped duplicate | pool item agenda_w48_war_outcome |
| populist-chooser | 50 | act4_second_referendum | skipped visited | scene already visited |
| populist-chooser | 50 | act4_reelection_campaign | skipped visited | scene already visited |
| seeded-random | 5 | mole_week5_complication | skipped duplicate | pool item agenda_w05_mole_week5_complication |
| seeded-random | 7 | intelligence_briefing_recurring | skipped visited | scene already visited |
| seeded-random | 11 | intelligence_briefing_recurring | skipped visited | scene already visited |
| seeded-random | 12 | family_dinner_recurring | skipped visited | scene already visited |
| seeded-random | 15 | intelligence_briefing_recurring | skipped visited | scene already visited |
| seeded-random | 18 | family_dinner_recurring | skipped visited | scene already visited |
| seeded-random | 18 | act2_week18_vael_oligarch | skipped duplicate | pool item agenda_w18_vael_oligarch |
| seeded-random | 19 | intelligence_briefing_recurring | skipped visited | scene already visited |
| seeded-random | 20 | act2_week20_budget_crisis | skipped duplicate | pool item agenda_w20_budget_crisis |
| seeded-random | 22 | act2_week22_oil_outcome | skipped duplicate | pool item agenda_w22_act2_week22_oil_outcome |
| seeded-random | 22 | act2_week22_nadia_investigation | skipped duplicate | pool item agenda_w22_nadia_investigation |
| seeded-random | 23 | intelligence_briefing_recurring | skipped visited | scene already visited |
| seeded-random | 24 | family_dinner_recurring | skipped visited | scene already visited |
| seeded-random | 25 | act2_week25_referendum_eve | skipped duplicate | pool item agenda_w25_referendum_eve |
| seeded-random | 27 | intelligence_briefing_recurring | skipped visited | scene already visited |
| seeded-random | 27 | act2_week27_press_conference_failed | skipped duplicate | pool item agenda_w27_press_conference_failed |
| seeded-random | 28 | act2_week28_voss_crisis | skipped duplicate | pool item agenda_w28_act2_week28_voss_crisis |
| seeded-random | 30 | family_dinner_recurring | skipped visited | scene already visited |
| seeded-random | 31 | intelligence_briefing_recurring | skipped visited | scene already visited |
| seeded-random | 31 | act3_week31_inner_circle | skipped duplicate | pool item agenda_w31_inner_circle |
| seeded-random | 32 | act2_week32_voss_outcome | skipped duplicate | pool item agenda_w32_act2_week32_voss_outcome |
| seeded-random | 32 | act3_week31_inner_circle | skipped visited | scene already visited |
| seeded-random | 32 | act3_week32_tyvaren_ultimatum | skipped duplicate | pool item agenda_w32_tyvaren_ultimatum |
| seeded-random | 33 | act3_week33_war_preparations | skipped duplicate | pool item agenda_w33_war_preparations |
| seeded-random | 34 | act3_week32_tyvaren_ultimatum | skipped visited | scene already visited |
| seeded-random | 35 | intelligence_briefing_recurring | skipped visited | scene already visited |
| seeded-random | 36 | family_dinner_recurring | skipped visited | scene already visited |
| seeded-random | 36 | act3_arcturian_sanctions | skipped visited | scene already visited |
| seeded-random | 37 | act3_week37_military_rally | skipped duplicate | pool item agenda_w37_military_rally |
| seeded-random | 38 | act3_dravenni_autonomy_talks | skipped visited | scene already visited |
| seeded-random | 38 | act3_week38_family_reckoning | skipped duplicate | pool item agenda_w38_family_reckoning |
| seeded-random | 38 | act3_military_deployment | skipped visited | scene already visited |
| seeded-random | 39 | intelligence_briefing_recurring | skipped visited | scene already visited |
| seeded-random | 39 | act3_week39_act3_climax | skipped duplicate | pool item agenda_w39_act3_climax |
| seeded-random | 40 | act4_civil_conflict_arc | skipped duplicate | pool item agenda_w40_civil_conflict |
| seeded-random | 40 | act3_arcturian_cooldown | skipped visited | scene already visited |
| seeded-random | 42 | family_dinner_recurring | skipped visited | scene already visited |
| seeded-random | 42 | act4_week42_austerity_bites | skipped duplicate | pool item agenda_w42_austerity_bites |
| seeded-random | 43 | intelligence_briefing_recurring | skipped visited | scene already visited |
| seeded-random | 43 | act3_halvekist_legal_war | skipped visited | scene already visited |
| seeded-random | 44 | act4_week44_reform_backlash | skipped duplicate | pool item agenda_w44_reform_backlash |
| seeded-random | 44 | act4_week43_family_resolution | skipped visited | scene already visited |
| seeded-random | 45 | act4_week45_uprising | skipped duplicate | pool item agenda_w45_uprising |
| seeded-random | 47 | intelligence_briefing_recurring | skipped visited | scene already visited |
| seeded-random | 47 | act4_week43_family_resolution | skipped visited | scene already visited |
| seeded-random | 47 | act4_week47_new_order | skipped duplicate | pool item agenda_w47_new_order |
| seeded-random | 48 | family_dinner_recurring | skipped visited | scene already visited |
| seeded-random | 48 | act4_week48_collapse_endgame | skipped duplicate | pool item agenda_w48_collapse_endgame |
| seeded-random | 48 | act4_week48_war_outcome | skipped duplicate | pool item agenda_w48_war_outcome |

## Failures and suspects
- none (branches)
- none (drops)
