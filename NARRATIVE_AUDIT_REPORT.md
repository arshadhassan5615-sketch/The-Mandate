# The Mandate -- Narrative JSON Structural Audit

**Scope:** all 522 JSON scene files under `src/data/narrative/` (acts 1-7, crisis, diplomacy, personal, projects, security). Registry = the 522 unique `id` values these files declare, matching `SCENE_REGISTRY` in `src/engine/NarrativeEngine.ts` (built from the same glob).

Validation semantics taken from the engine:
- `nextNodeId` / chainTrigger `targetNodeId` -> `SCENE_REGISTRY` (`narrativeStore.processChoice`, `chainStore`/`ChainReactionEngine`)
- `nextSegment` -> keys of the same scene's `segments` map (`narrativeStore.processChoice:571`)
- `stateChanges` / `statEffects` stat paths -> `gameStore.applyModifier` (`PATH_ALIASES`, dotless top-level numeric fields, `group.key` into nation/factions/personal/advisorTrust/budget)
- flag gates -> `activeFlags` membership; SET universe = every `choice.flags` entry in all 522 scenes + every engine/data set-site (`addFlags(...)` literals, `FLAG_HANDLERS`/`MoleEngine` consequence flags, `weekStore` successFlags, `data/agenda/*.json` successFlags/failureFlags, `VoteEngine`, `budgetEffects`, `ConstitutionalReform`, `InvestmentPanel`, `CharacterCustomization`, bills `signFlags`/`vetoFlags`, etc.)
- `codexUnlocks` -> the 56 entry ids in `src/data/codex/*.json` (`codexStore.ALL_CODEX_ENTRIES`, consumed by `CodexViewer` and `InlineCodexPanel` via exact id match)

**Totals:** 0 broken nextNodeId * 0 broken chainTrigger targets * 0 broken nextSegment * 2 invalid stat paths * 16 orphaned flag gates (1 scene-level + 15 via `flags.*` stat-conditions) * 850 codexUnlock references to 627 nonexistent ids.

---

## 1. Broken `nextNodeId` references -- 0 found

All 16 explicit `nextNodeId` transitions in the corpus resolve to a declared scene id. *(Note: most scene-to-scene flow in this project is driven by chainTriggers, not nextNodeId -- 769 chain targets were also all verified valid, see section 2.)*

---

## 2. Broken `chainTrigger.targetNodeId` references -- 0 found

All 769 `targetNodeId` references (across scene-level, segment-level and socialInteraction choices) resolve to declared scene ids.

---

## 3. Broken internal `nextSegment` references -- 0 found

No non-empty `nextSegment` value exists in the corpus, so there are no broken internal branch references. 359 choices carry `"nextSegment": null` -- an explicit-null convention that the engine treats as a no-op (`choice.nextSegment` is falsy), not an error.

---

## 4. Invalid stat paths in `stateChanges` / `statEffects` -- 2 occurrences (1 distinct path)

Of 73 distinct stat paths used across all choices, exactly one does not resolve through `gameStore.applyModifier` (no alias, no top-level numeric field, no `group.key` match). At runtime both choices log `[gameStore] Unknown stat path` and the modifier is silently dropped.

| File | Line | Scene / Choice | Broken path | Intent |
|---|---|---|---|---|
| `data/narrative/act6/act6_week75_geological_survey.json` | 41, 65 | `act6_week75_geological_survey` -> `fund_full_survey` | `orin_valdek_trust` (stateChanges, op=add, value=10) | Adjust Orin Valdek's trust -- canonical path is `advisorTrust.valdek` |
| `data/narrative/act6/act6_week75_geological_survey.json` | 41, 65 | `act6_week75_geological_survey` -> `reject_survey` | `orin_valdek_trust` (stateChanges, op=add, value=-10) | Adjust Orin Valdek's trust -- canonical path is `advisorTrust.valdek` |

---

## 5. Orphaned flag gates (flag is checked but never SET anywhere)

Every candidate below was grepped across the entire `src/` tree: no scene choice, engine module, or data file ever sets it. Because `getAvailableAgendaItems` requires **all** `prerequisiteFlags` (and flag-stat conditions require `== true`), each gated item can never appear through normal agenda flow.

### 5a. Scene-level `prerequisiteFlags` -- 1 issue

| File | Line | Scene | Orphaned flag | Intent / impact |
|---|---|---|---|---|
| `data/narrative/act4/act4_mole_confrontation.json` | 10 | `act4_mole_confrontation` | `spy_clues_gathered_4` | Gates the Act 4 mole-confrontation scene on the agenda. No code ever sets `spy_clues_gathered_*` (the closest literal is a *read* of `spy_clues_gathered_1` in `OverviewPanel.tsx:327`), and no chainTrigger or `nextNodeId` ever loads this scene either -> the scene is unreachable. |

### 5b. Orphaned `flags.*` stat-conditions -- 15 occurrences (12 distinct flags)

These gate scenes/choices via `prerequisites` / `conditions` using `{ "stat": "flags.X", "operator": "==", "value": true }` -- same gating semantics as prerequisiteFlags.

| File | Line(s) | Scene -> Choice | Orphaned flag | Likely intent |
|---|---|---|---|---|
| `data/narrative/act1/act1_chain_deficit_crisis.json` | 12 | `act1_chain_deficit_crisis` (scene.prerequisites) | `deficit_critical` | Budget-crisis chain trigger; probably meant the engine-set `severe_deficit_crisis` (budgetEffects.ts:88). |
| `data/narrative/act1/act1_chain_executive_governance.json` | 12 | `act1_chain_executive_governance` (scene.prerequisites) | `executive_consolidation` | Executive-governance branch; no setter exists anywhere. |
| `data/narrative/act1/act1_chain_nadia_investigation.json` | 15 | `act1_chain_nadia_investigation` (scene.prerequisites) | `nadia_met` | Nadia Voss investigation chain; probably meant a "met Nadia" flag that was never authored. |
| `data/narrative/act1/act1_chain_tyvaren_border_standoff.json` | 16 | `act1_chain_tyvaren_border_standoff` (scene.prerequisites) | `tyvaren_mobilization` | Tyvaren border-standoff chain; no setter exists (war flags elsewhere use different names). |
| `data/narrative/act1/family/family_bni_night.json` | 14 | `family_bni_night` (scene.prerequisites) | `bni_crisis_resolved` | Gates `family_bni_night`; no setter exists -> family scene unreachable. |
| `data/narrative/act3/act3_assassination_cabinet.json` | 126, 151 | `act3_assassination_cabinet` -> `cabinet_blame_tyvaren` (choice.conditions) | `tyvaren_war_imminent` | Read in AssassinationEngine.ts:98 too, but never set -> the `cabinet_blame_tyvaren` choice can never appear. |
| `data/narrative/act3/act3_assassination_cabinet.json` | 126, 151 | `act3_assassination_cabinet` -> `cabinet_blame_tyvaren_thin` (choice.conditions) | `tyvaren_war_imminent` | Read in AssassinationEngine.ts:98 too, but never set -> the `cabinet_blame_tyvaren` choice can never appear. |
| `data/narrative/act3/act3_confidence_vote.json` | 12 | `act3_confidence_vote` (scene.prerequisites) | `referendum_rejected` | MISMATCH: the week 25/26 vote sets `referendum_failed` / `constitution_rejected` (data/agenda/week26.json failureFlags), never `referendum_rejected`. |
| `data/narrative/act3/act3_dravenni_insurgency.json` | 12 | `act3_dravenni_insurgency` (scene.prerequisites) | `dravenhollow_suppress_separatists` | MISMATCH: that string is a choice id in act3_week34_dravenhollow.json:102; the choice actually sets `dravenhollow_crackdown`, `separatists_targeted`, ... |
| `data/narrative/act3/act3_port_bonds_return.json` | 79, 125 | `act3_port_bonds_return` -> `port_bonds_collect_full` (choice.conditions) | `ftz_act_signed` | MISMATCH: the Amber Coast Free Trade bill sets `amber_coast_ftz_signed` (bill_amber_coast_free_trade.json signFlags), never `ftz_act_signed`. |
| `data/narrative/act3/act3_port_bonds_return.json` | 79, 125 | `act3_port_bonds_return` -> `port_bonds_collect_full_no_ftz` (choice.conditions) | `ftz_act_signed` | MISMATCH: the Amber Coast Free Trade bill sets `amber_coast_ftz_signed` (bill_amber_coast_free_trade.json signFlags), never `ftz_act_signed`. |
| `data/narrative/act3/act3_reform_by_decree.json` | 12 | `act3_reform_by_decree` (scene.prerequisites) | `referendum_rejected` | MISMATCH: the week 25/26 vote sets `referendum_failed` / `constitution_rejected` (data/agenda/week26.json failureFlags), never `referendum_rejected`. |
| `data/narrative/act3/act3_week29_vyktor_exposed.json` | 13 | `act3_week29_vyktor_exposed` (scene.prerequisites) | `nadia_cooperated` | Read by diaryEntries.ts:312 and data/agenda/week29.json, but never set -> `act3_week29_vyktor_exposed` cannot load. |
| `data/narrative/act3/act3_week39_act3_climax.json` | 155 | `act3_week39_act3_climax` -> `climax_coup_survival_focus` (choice.conditions) | `coup_attempted` | Read by diaryEntries.ts:326 and cliffhangerTemplates.ts:325, but never set -> `climax_coup_survival_focus` condition can never pass. |
| `data/narrative/projects/project_mid_crisis_steel.json` | 11 | `project_mid_crisis_steel` (scene.prerequisites) | `project_steel_started` | MISMATCH: narrativeStore PROJECT_START_FLAGS sets `project_kravenstal_started` for the steel project, never `project_steel_started` (mid-crisis scene still fires via chain injection, which skips prerequisites). |

---

## 6. `codexUnlock` IDs with no matching codex entry -- 850 occurrences, 627 distinct missing ids

Every `codexUnlocks` entry was checked against the 56 ids declared in `src/data/codex/*.json` (nations, characters, laws, history, economy, ideologies, journal). **627 distinct ids referenced by scene choices do not exist in any codex file.** At runtime the unlock is stored in `unlockedCodexIds` but matches no `CodexEntry`: `InlineCodexPanel` renders nothing (`entry` is null) and `CodexViewer` never marks an entry seen -- a silent no-op.

Distribution by directory:

| Directory | Broken unlock references |
|---|---|
| act3 | 387 |
| act4 | 274 |
| act1 | 103 |
| act2 | 61 |
| diplomacy | 22 |
| projects | 3 |

Context: only 16 of the 56 codex entries are ever correctly referenced (`codex_ima`, `codex_vael_confrontation`, `codex_kravenstal`, `codex_constitution`, `codex_new_constitution`, `codex_veltrian_democracy`, `codex_ashavel_family`, `codex_mole_investigation`, `codex_economic_direction`, `character_serida_valk`, `character_maren_tovik`, `character_viktor_dorne`, `character_elena_braskov`, `character_gavril_soren`, `nation_orythian_dominion`, `nation_tyvaren_confederation`). 40 entries are never referenced by any choice (several are reachable via codex `unlockCondition` flags instead).

### Full list of missing codex ids (distinct -> occurrence count)

| Missing codex id | Occurrences |
|---|---|
| `codex_vael_alliance` | 7 |
| `codex_arcturia` | 6 |
| `codex_arcturian_commonwealth` | 6 |
| `codex_gravenmark_pass` | 6 |
| `codex_impeachment` | 6 |
| `codex_government_exile_doctrine` | 5 |
| `codex_mikhael_ashavel_legacy` | 5 |
| `codex_nadia_investigation_full` | 5 |
| `codex_orythian_dominion` | 5 |
| `codex_ashenmere_incident` | 4 |
| `codex_benedikt_varro` | 4 |
| `codex_chancellors_address` | 4 |
| `codex_chancellors_war_address` | 4 |
| `codex_crossing_point_seven` | 4 |
| `codex_divorce_proceedings` | 4 |
| `codex_dravenni_culture` | 4 |
| `codex_ima_negotiation` | 4 |
| `codex_ironborn_movement` | 4 |
| `codex_morivask_crisis` | 4 |
| `codex_nadia_voss` | 4 |
| `codex_no_confidence_vote` | 4 |
| `codex_state_media` | 4 |
| `codex_strevna_negotiations` | 4 |
| `codex_third_armored_regiment` | 4 |
| `codex_andrei_luca` | 3 |
| `codex_assassination_attempt` | 3 |
| `codex_autonomy_commission` | 3 |
| `codex_battle_gravenmark` | 3 |
| `codex_battle_of_gravenmark` | 3 |
| `codex_bni_intelligence` | 3 |
| `codex_branek_case` | 3 |
| `codex_cabinet_reshuffle` | 3 |
| `codex_ceasefire_terms` | 3 |
| `codex_civilian_military_oversight` | 3 |
| `codex_counterintelligence` | 3 |
| `codex_dlf_insurgency` | 3 |
| `codex_electoral_commission` | 3 |
| `codex_emilian_voss` | 3 |
| `codex_general_staff_building` | 3 |
| `codex_halvek_collaboration` | 3 |
| `codex_halvek_corruption` | 3 |
| `codex_ima_negotiation_tactics` | 3 |
| `codex_international_forum` | 3 |
| `codex_kravenstal_strike` | 3 |
| `codex_lytheira` | 3 |
| `codex_morivask` | 3 |
| `codex_national_stability_act` | 3 |
| `codex_night_of_justice` | 3 |
| `codex_no_confidence` | 3 |
| `codex_press_conference` | 3 |
| `codex_provincial_infiltration` | 3 |
| `codex_revised_budget` | 3 |
| `codex_sovarka` | 3 |
| `codex_ssd_dissolution` | 3 |
| `codex_transition_corruption` | 3 |
| `codex_tyvaren_expansionism` | 3 |
| `codex_vael_negotiation` | 3 |
| `codex_vnn` | 3 |
| `codex_voss_cipher_engine` | 3 |
| `codex_vyktor_trial` | 3 |
| `codex_workers_coalition` | 3 |
| `codex_accountability_provision` | 2 |
| `codex_article_22_emergency` | 2 |
| `codex_article_four` | 2 |
| `codex_asturien_forum` | 2 |
| `codex_battle_of_gravenmark_outcome` | 2 |
| `codex_blind_trust` | 2 |
| `codex_bni_dravenhollow_operations` | 2 |
| `codex_bni_targeted_operations` | 2 |
| `codex_border_security` | 2 |
| `codex_brenner_demands` | 2 |
| `codex_ceasefire_principles` | 2 |
| `codex_church_healthcare` | 2 |
| `codex_church_history` | 2 |
| `codex_church_reform` | 2 |
| `codex_church_tradition` | 2 |
| `codex_coalition_governance` | 2 |
| `codex_collective_security_doctrine` | 2 |
| `codex_colonial_history` | 2 |
| `codex_constitutional_court` | 2 |
| `codex_defense_in_depth_doctrine` | 2 |
| `codex_dlf_military_structure` | 2 |
| `codex_dravenni_language_act` | 2 |
| `codex_dravenni_veterans` | 2 |
| `codex_emergency_powers_declaration` | 2 |
| `codex_first_infantry_division` | 2 |
| `codex_government_in_exile` | 2 |
| `codex_gravenmark` | 2 |
| `codex_halvek_constitution_article47` | 2 |
| `codex_ima_structural_adjustment` | 2 |
| `codex_independent_prosecutor` | 2 |
| `codex_ironborn_youth` | 2 |
| `codex_kolvar_accommodation` | 2 |
| `codex_kolvar_negotiation` | 2 |
| `codex_kravenstal_dam` | 2 |
| `codex_kravenstal_settlement` | 2 |
| `codex_legislative_process` | 2 |
| `codex_loyalist_network` | 2 |
| `codex_mikhael_full_record` | 2 |
| `codex_military_conspiracy_network` | 2 |
| `codex_military_cooperation` | 2 |
| `codex_national_unity` | 2 |
| `codex_occupation_resistance` | 2 |
| `codex_orythian_alliance` | 2 |
| `codex_orythian_economic_model` | 2 |
| `codex_parliamentary_oversight` | 2 |
| `codex_parliamentary_procedure` | 2 |
| `codex_press_office` | 2 |
| `codex_public_consultation` | 2 |
| `codex_radio_free_veltria` | 2 |
| `codex_refugee_crisis` | 2 |
| `codex_refugee_integration` | 2 |
| `codex_social_safety_net` | 2 |
| `codex_soraya_khaled` | 2 |
| `codex_soren_files` | 2 |
| `codex_strevna_preconditions` | 2 |
| `codex_treaty_negotiation` | 2 |
| `codex_tyvaren_crisis` | 2 |
| `codex_tyvaren_invasion_estimate` | 2 |
| `codex_veltrian_military_oath` | 2 |
| `codex_veltrian_resistance` | 2 |
| `codex_veltrian_succession` | 2 |
| `codex_war_memorial` | 2 |
| `codex_accountability_framework` | 1 |
| `codex_administrative_reform` | 1 |
| `codex_aldenmoor_defensive_line` | 1 |
| `codex_aldenmoor_line` | 1 |
| `codex_archbishop_serrano` | 1 |
| `codex_arcturian_command_framework` | 1 |
| `codex_arcturian_credit` | 1 |
| `codex_arcturian_intelligence` | 1 |
| `codex_arcturian_intervention_debate` | 1 |
| `codex_arcturian_military_doctrine` | 1 |
| `codex_arcturian_trade_relations` | 1 |
| `codex_armed_neutrality_doctrine` | 1 |
| `codex_armistice_terms` | 1 |
| `codex_article_22` | 1 |
| `codex_article_22_invoked` | 1 |
| `codex_article_74` | 1 |
| `codex_article_twelve_veto` | 1 |
| `codex_ashenmere` | 1 |
| `codex_ashenmere_utilities` | 1 |
| `codex_asymmetric_warfare` | 1 |
| `codex_austerity_defended` | 1 |
| `codex_austerity_morality` | 1 |
| `codex_austerity_politics` | 1 |
| `codex_austerity_resistance` | 1 |
| `codex_battle_of_gravenmark_planning` | 1 |
| `codex_battle_of_korven_forest` | 1 |
| `codex_bca` | 1 |
| `codex_benevolent_autocrat` | 1 |
| `codex_bni_abolition` | 1 |
| `codex_bni_archival_reform` | 1 |
| `codex_bni_dissolution` | 1 |
| `codex_bni_domestic_surveillance` | 1 |
| `codex_bni_dravenni_surveillance` | 1 |
| `codex_bni_expansion` | 1 |
| `codex_bni_history` | 1 |
| `codex_bni_leverage_operations` | 1 |
| `codex_bni_reform` | 1 |
| `codex_bni_signals` | 1 |
| `codex_border_commission` | 1 |
| `codex_border_security_commission` | 1 |
| `codex_both_agencies` | 1 |
| `codex_brenner_direct_dialogue` | 1 |
| `codex_brenner_exit_terms` | 1 |
| `codex_brenner_immunity_deal` | 1 |
| `codex_brenner_service_record` | 1 |
| `codex_brenner_ultimatum` | 1 |
| `codex_bridge_building_governance` | 1 |
| `codex_broadcast_accountability` | 1 |
| `codex_cabinet_procedure` | 1 |
| `codex_cabinet_purge` | 1 |
| `codex_cabinet_reform_agenda` | 1 |
| `codex_campaign_reform` | 1 |
| `codex_capital_strike` | 1 |
| `codex_ceasefire_diplomacy` | 1 |
| `codex_chancellery_transparency` | 1 |
| `codex_chancellor_war_powers` | 1 |
| `codex_church_social_services` | 1 |
| `codex_church_state_concordat` | 1 |
| `codex_church_state_relations_wartime` | 1 |
| `codex_civil_liberties_restoration` | 1 |
| `codex_civil_military_integration` | 1 |
| `codex_civil_resistance` | 1 |
| `codex_civil_rights` | 1 |
| `codex_civil_service_corps` | 1 |
| `codex_civil_service_reform` | 1 |
| `codex_civil_society_resilience` | 1 |
| `codex_civil_unrest_preparedness` | 1 |
| `codex_civilian_evacuation_protocol` | 1 |
| `codex_civilian_intelligence` | 1 |
| `codex_civilian_oversight` | 1 |
| `codex_civilian_protection` | 1 |
| `codex_civilian_protection_zone` | 1 |
| `codex_coalition_compartmentalization` | 1 |
| `codex_coalition_framework` | 1 |
| `codex_coalition_management` | 1 |
| `codex_coalition_warfare` | 1 |
| `codex_coalition_warfare_mountains` | 1 |
| `codex_collective_security_mechanism` | 1 |
| `codex_colonel_dusek_personal` | 1 |
| `codex_colonel_dusek_professional` | 1 |
| `codex_combat_readiness_doctrine` | 1 |
| `codex_conditionality` | 1 |
| `codex_constitutional_alliance` | 1 |
| `codex_constitutional_chain_of_command` | 1 |
| `codex_constitutional_compromise` | 1 |
| `codex_constitutional_convention` | 1 |
| `codex_constitutional_court_challenge` | 1 |
| `codex_constitutional_crisis` | 1 |
| `codex_constitutional_crisis_resolution` | 1 |
| `codex_constitutional_defense_doctrine` | 1 |
| `codex_constitutional_deference` | 1 |
| `codex_constitutional_education` | 1 |
| `codex_constitutional_entrenchment` | 1 |
| `codex_constitutional_implementation` | 1 |
| `codex_constitutional_implementation_phased` | 1 |
| `codex_constitutional_implementation_urgent` | 1 |
| `codex_constitutional_incompatibility` | 1 |
| `codex_constitutional_prioritization` | 1 |
| `codex_constitutional_reform_process` | 1 |
| `codex_constitutional_republic` | 1 |
| `codex_constitutional_security_provisions` | 1 |
| `codex_constitutional_vision` | 1 |
| `codex_conventional_defense_doctrine` | 1 |
| `codex_corporate_surcharge` | 1 |
| `codex_coup_attempt_public_record` | 1 |
| `codex_covert_communication` | 1 |
| `codex_crisis_management` | 1 |
| `codex_crisis_management_doctrine` | 1 |
| `codex_crisis_mandate` | 1 |
| `codex_crisis_negotiation` | 1 |
| `codex_crisis_offensive` | 1 |
| `codex_crisis_stabilization` | 1 |
| `codex_critical_infrastructure` | 1 |
| `codex_csad` | 1 |
| `codex_debt_negotiation` | 1 |
| `codex_decisive_governance` | 1 |
| `codex_declaration_war` | 1 |
| `codex_deep_strike_capability` | 1 |
| `codex_deescalation_protocol` | 1 |
| `codex_defense_in_depth_execution` | 1 |
| `codex_defense_pact` | 1 |
| `codex_defensive_doctrine` | 1 |
| `codex_defensive_perimeter` | 1 |
| `codex_defensive_readiness` | 1 |
| `codex_defiance_speech` | 1 |
| `codex_delegation_governance` | 1 |
| `codex_demilitarized_zone_proposal` | 1 |
| `codex_democratic_deliberation` | 1 |
| `codex_democratic_governance_model` | 1 |
| `codex_democratic_military_center` | 1 |
| `codex_democratic_military_doctrine` | 1 |
| `codex_democratic_normalization` | 1 |
| `codex_democratic_renewal` | 1 |
| `codex_democratic_resilience` | 1 |
| `codex_democratic_security_doctrine` | 1 |
| `codex_democratic_transition` | 1 |
| `codex_democratic_transition_complete` | 1 |
| `codex_democratic_war_governance` | 1 |
| `codex_deputy_chancellor_positions` | 1 |
| `codex_deterrence_doctrine` | 1 |
| `codex_devolution_framework` | 1 |
| `codex_diplomatic_bargaining` | 1 |
| `codex_diplomatic_face_saving` | 1 |
| `codex_diplomatic_framework` | 1 |
| `codex_diplomatic_hardball` | 1 |
| `codex_diplomatic_immunity` | 1 |
| `codex_diplomatic_language` | 1 |
| `codex_diplomatic_leverage` | 1 |
| `codex_diplomatic_mediation_protocol` | 1 |
| `codex_diplomatic_stalling_technique` | 1 |
| `codex_diplomatic_warfare` | 1 |
| `codex_direct_communication_channel` | 1 |
| `codex_direct_democracy` | 1 |
| `codex_disinformation` | 1 |
| `codex_displaced_persons` | 1 |
| `codex_dlf_amnesty` | 1 |
| `codex_dlf_auxiliary_structure` | 1 |
| `codex_dlf_gradual_integration` | 1 |
| `codex_dlf_joint_operations` | 1 |
| `codex_dlf_limited_partnership` | 1 |
| `codex_dlf_moderate_faction` | 1 |
| `codex_dlf_reconnaissance_corps` | 1 |
| `codex_dlf_wartime_integration` | 1 |
| `codex_domestic_intelligence` | 1 |
| `codex_domestic_war_production` | 1 |
| `codex_double_agent` | 1 |
| `codex_dravenhollow_autonomy` | 1 |
| `codex_dravenhollow_campaign` | 1 |
| `codex_dravenhollow_economy` | 1 |
| `codex_dravenhollow_garrison` | 1 |
| `codex_dravenni_autonomy` | 1 |
| `codex_dravenni_commissioned_units` | 1 |
| `codex_dravenni_cultural_rights` | 1 |
| `codex_dravenni_highland_defense` | 1 |
| `codex_dravenni_legislative_timeline` | 1 |
| `codex_dravenni_operational_integration` | 1 |
| `codex_dravenni_provincial_status` | 1 |
| `codex_dravenni_resistance_history` | 1 |
| `codex_dravenni_security_bargain` | 1 |
| `codex_dravenni_security_framework` | 1 |
| `codex_dravenni_sovereignty` | 1 |
| `codex_economic_recovery_plan` | 1 |
| `codex_economic_reform` | 1 |
| `codex_education` | 1 |
| `codex_education_reform` | 1 |
| `codex_electoral_mandate` | 1 |
| `codex_emergency_constitutional_powers` | 1 |
| `codex_emergency_curfew_provisions` | 1 |
| `codex_emergency_employment` | 1 |
| `codex_emergency_labor_provisions` | 1 |
| `codex_emergency_powers` | 1 |
| `codex_emergency_powers_jurisprudence` | 1 |
| `codex_emergency_powers_review` | 1 |
| `codex_emergency_press_powers` | 1 |
| `codex_emergency_relief` | 1 |
| `codex_emergency_security_powers` | 1 |
| `codex_emergency_war_powers` | 1 |
| `codex_espionage_law` | 1 |
| `codex_essential_services_doctrine` | 1 |
| `codex_executive_authority` | 1 |
| `codex_executive_authority_economic` | 1 |
| `codex_executive_governance` | 1 |
| `codex_executive_order_ima` | 1 |
| `codex_executive_order_powers` | 1 |
| `codex_executive_priorities` | 1 |
| `codex_executive_reform_powers` | 1 |
| `codex_exile_diplomacy` | 1 |
| `codex_exile_timeline` | 1 |
| `codex_face_saving_diplomacy` | 1 |
| `codex_fall_of_kravenstal` | 1 |
| `codex_fallback_defense_doctrine` | 1 |
| `codex_federalism_debate` | 1 |
| `codex_first_family_public` | 1 |
| `codex_forum_charter` | 1 |
| `codex_forum_charter_article_17` | 1 |
| `codex_forum_diplomacy` | 1 |
| `codex_forum_fact_finding` | 1 |
| `codex_forum_mandate` | 1 |
| `codex_forum_mediation` | 1 |
| `codex_forum_peacekeeping` | 1 |
| `codex_forum_resolution_procedure` | 1 |
| `codex_forward_defense_doctrine` | 1 |
| `codex_forward_deployment` | 1 |
| `codex_forward_patrol_doctrine` | 1 |
| `codex_forward_readiness` | 1 |
| `codex_general_strike` | 1 |
| `codex_governance_first` | 1 |
| `codex_government_district` | 1 |
| `codex_government_in_exile_formation` | 1 |
| `codex_gravenmark_concession` | 1 |
| `codex_gravenmark_defense_line` | 1 |
| `codex_gravenmark_defensive_line` | 1 |
| `codex_gravenmark_garrison` | 1 |
| `codex_healing_governance` | 1 |
| `codex_highland_autonomy_commission` | 1 |
| `codex_humanitarian_access` | 1 |
| `codex_humanitarian_corridor` | 1 |
| `codex_idris_kaelen` | 1 |
| `codex_ima_acceleration` | 1 |
| `codex_ima_austerity_governance` | 1 |
| `codex_ima_human_impact` | 1 |
| `codex_ima_oversight` | 1 |
| `codex_ima_program` | 1 |
| `codex_ima_public_narrative` | 1 |
| `codex_ima_renegotiation` | 1 |
| `codex_ima_sovereignty` | 1 |
| `codex_ima_timeline` | 1 |
| `codex_inclusive_leadership` | 1 |
| `codex_industrial_conversion_incentives` | 1 |
| `codex_institutional_resilience` | 1 |
| `codex_institutional_restructuring` | 1 |
| `codex_integrated_training_doctrine` | 1 |
| `codex_intelligence_oversight` | 1 |
| `codex_internal_security_doctrine` | 1 |
| `codex_international_border_law` | 1 |
| `codex_international_ceasefire_monitoring` | 1 |
| `codex_international_forum_emergency` | 1 |
| `codex_international_investigation` | 1 |
| `codex_international_legitimacy` | 1 |
| `codex_international_peacekeeping` | 1 |
| `codex_international_recognition_doctrine` | 1 |
| `codex_international_sanctions` | 1 |
| `codex_international_sanctions_regime` | 1 |
| `codex_investigative_journalism` | 1 |
| `codex_joint_forces_command` | 1 |
| `codex_joint_military_operations` | 1 |
| `codex_judicial_reform` | 1 |
| `codex_judicial_reform_bill` | 1 |
| `codex_judicial_review` | 1 |
| `codex_junta_documentation` | 1 |
| `codex_junta_government` | 1 |
| `codex_junta_order_of_battle` | 1 |
| `codex_junta_repression` | 1 |
| `codex_kaelen_cautious_trust` | 1 |
| `codex_kaelen_honesty` | 1 |
| `codex_kaelen_personal_trust` | 1 |
| `codex_kaelen_trust` | 1 |
| `codex_katerin_ashavel_family` | 1 |
| `codex_katerin_ashavel_legacy` | 1 |
| `codex_kolvar_confrontation` | 1 |
| `codex_kolvar_institutionalist` | 1 |
| `codex_korven_flanking_operation` | 1 |
| `codex_kravenstal_crisis` | 1 |
| `codex_kravenstal_visit` | 1 |
| `codex_labor_settlement` | 1 |
| `codex_last_diplomatic_offer` | 1 |
| `codex_laws_of_armed_conflict` | 1 |
| `codex_leadership_trust` | 1 |
| `codex_legal_challenge_multifront` | 1 |
| `codex_legislative_reform` | 1 |
| `codex_local_counterattack_doctrine` | 1 |
| `codex_local_elections` | 1 |
| `codex_loyalist_forces` | 1 |
| `codex_loyalty_reaffirmation` | 1 |
| `codex_managed_disclosure` | 1 |
| `codex_martial_law_provisions` | 1 |
| `codex_mass_graves` | 1 |
| `codex_mikhael_ashavel_public` | 1 |
| `codex_mikhael_complicated` | 1 |
| `codex_mikhael_investigation` | 1 |
| `codex_mikhael_official` | 1 |
| `codex_military` | 1 |
| `codex_military_deployment_act` | 1 |
| `codex_military_discipline_act` | 1 |
| `codex_military_history` | 1 |
| `codex_military_institutional_reform` | 1 |
| `codex_military_intelligence` | 1 |
| `codex_military_intelligence_operations` | 1 |
| `codex_military_logistics` | 1 |
| `codex_military_morale` | 1 |
| `codex_military_oath_enforcement` | 1 |
| `codex_military_personnel_management` | 1 |
| `codex_military_requisition` | 1 |
| `codex_military_resolve` | 1 |
| `codex_military_restoration_options` | 1 |
| `codex_mission_command_doctrine` | 1 |
| `codex_mobilization_cover_story` | 1 |
| `codex_moral_hazard_international_relations` | 1 |
| `codex_mountain_warfare` | 1 |
| `codex_multilateral_pressure` | 1 |
| `codex_mutual_defense_treaty` | 1 |
| `codex_national_asset_sales` | 1 |
| `codex_national_broadcast_system` | 1 |
| `codex_national_conversation` | 1 |
| `codex_national_morale_initiative` | 1 |
| `codex_national_reconciliation` | 1 |
| `codex_national_relief_program` | 1 |
| `codex_national_resilience` | 1 |
| `codex_national_truth` | 1 |
| `codex_national_unity_doctrine` | 1 |
| `codex_naval_doctrine` | 1 |
| `codex_negotiated_reunification` | 1 |
| `codex_negotiated_transition` | 1 |
| `codex_next_term_agenda` | 1 |
| `codex_non_aggression_pact_drafting` | 1 |
| `codex_nonbinding_resolutions_precedent` | 1 |
| `codex_northern_highway` | 1 |
| `codex_occupation_governance` | 1 |
| `codex_occupation_government` | 1 |
| `codex_officer_accountability` | 1 |
| `codex_officer_training_curriculum` | 1 |
| `codex_operation_restoration` | 1 |
| `codex_organic_institutional_change` | 1 |
| `codex_orythia_connection` | 1 |
| `codex_orythian_advisory_mandate` | 1 |
| `codex_orythian_alternative` | 1 |
| `codex_orythian_diplomatic_relations` | 1 |
| `codex_orythian_economic_integration` | 1 |
| `codex_orythian_integration` | 1 |
| `codex_orythian_trade_bloc` | 1 |
| `codex_parliamentary_failure` | 1 |
| `codex_parliamentary_victory` | 1 |
| `codex_parliamentary_war_mandate` | 1 |
| `codex_peacetime_administration` | 1 |
| `codex_plebiscite_process` | 1 |
| `codex_political_accountability` | 1 |
| `codex_popular_mandate` | 1 |
| `codex_post_ima_alternatives` | 1 |
| `codex_postwar_alliance_framework` | 1 |
| `codex_postwar_negotiation` | 1 |
| `codex_preemptive_strike_doctrine` | 1 |
| `codex_press_confrontation` | 1 |
| `codex_press_freedom` | 1 |
| `codex_press_freedom_consortium` | 1 |
| `codex_press_freedom_defense` | 1 |
| `codex_press_freedom_ima` | 1 |
| `codex_press_management` | 1 |
| `codex_press_relations` | 1 |
| `codex_press_restrictions` | 1 |
| `codex_press_suppression` | 1 |
| `codex_preventive_detention` | 1 |
| `codex_privatization_program` | 1 |
| `codex_protocol_seventeen` | 1 |
| `codex_protocol_seventeen_revealed` | 1 |
| `codex_provisional_government` | 1 |
| `codex_public_diplomacy` | 1 |
| `codex_public_welfare_system` | 1 |
| `codex_public_works_program` | 1 |
| `codex_realpolitik` | 1 |
| `codex_reconstruction_authority` | 1 |
| `codex_reconstruction_plan` | 1 |
| `codex_reform_pacing` | 1 |
| `codex_resignation_precedent` | 1 |
| `codex_resistance_organization` | 1 |
| `codex_return_promise` | 1 |
| `codex_reunification_campaign` | 1 |
| `codex_rotational_governance` | 1 |
| `codex_second_armored_reserve` | 1 |
| `codex_secular_reform` | 1 |
| `codex_security_council_associate` | 1 |
| `codex_security_oversight` | 1 |
| `codex_security_portfolio` | 1 |
| `codex_security_rollback` | 1 |
| `codex_self_reliance_doctrine` | 1 |
| `codex_separation_of_powers` | 1 |
| `codex_sevagrad_port` | 1 |
| `codex_shortwave_resistance` | 1 |
| `codex_social_protection_fund` | 1 |
| `codex_soldiers_oath` | 1 |
| `codex_southern_provinces` | 1 |
| `codex_sovereign_financing` | 1 |
| `codex_ssd` | 1 |
| `codex_state_church_accord` | 1 |
| `codex_state_directed_economy` | 1 |
| `codex_state_of_emergency` | 1 |
| `codex_stellamere_conventions` | 1 |
| `codex_stellamere_diplomacy` | 1 |
| `codex_stellamere_financial_relations` | 1 |
| `codex_stellamere_mutual_defense_pact` | 1 |
| `codex_stellamere_strategic_calculus` | 1 |
| `codex_strategic_acceleration` | 1 |
| `codex_strategic_bargaining` | 1 |
| `codex_strategic_communication` | 1 |
| `codex_strategic_consolidation` | 1 |
| `codex_structural_adjustment` | 1 |
| `codex_succession_crisis` | 1 |
| `codex_supreme_court_referendum` | 1 |
| `codex_territorial_integrity` | 1 |
| `codex_territorial_negotiation` | 1 |
| `codex_total_mobilization` | 1 |
| `codex_total_national_defense` | 1 |
| `codex_total_national_effort` | 1 |
| `codex_total_war_doctrine` | 1 |
| `codex_trade_agreement` | 1 |
| `codex_transitional_council_proposal` | 1 |
| `codex_transitional_governance` | 1 |
| `codex_transitional_government` | 1 |
| `codex_transitional_justice` | 1 |
| `codex_transitional_justice_commission` | 1 |
| `codex_treaty_rejection` | 1 |
| `codex_triangular_diplomacy` | 1 |
| `codex_tripartite_negotiation` | 1 |
| `codex_truth_reconciliation` | 1 |
| `codex_two_phase_mobilization` | 1 |
| `codex_tyvaren_border_geography` | 1 |
| `codex_tyvaren_diplomatic_history` | 1 |
| `codex_tyvaren_diplomatic_technique` | 1 |
| `codex_tyvaren_dravenni_contacts` | 1 |
| `codex_tyvaren_ethnic_policies` | 1 |
| `codex_tyvaren_invasion_timeline` | 1 |
| `codex_tyvaren_military_doctrine` | 1 |
| `codex_tyvaren_peace_feelers` | 1 |
| `codex_tyvaren_special_reconnaissance` | 1 |
| `codex_tyvaren_threat_assessment` | 1 |
| `codex_tyvaren_treaty_terms` | 1 |
| `codex_underground_broadcasting` | 1 |
| `codex_underground_leadership` | 1 |
| `codex_unit_commanders` | 1 |
| `codex_urban_combat_doctrine` | 1 |
| `codex_vael_observation` | 1 |
| `codex_vael_oligarch` | 1 |
| `codex_vael_puppet_ending` | 1 |
| `codex_vael_reconciliation` | 1 |
| `codex_veltrian_border_protocol` | 1 |
| `codex_veltrian_constitution` | 1 |
| `codex_veltrian_constitutional_crisis` | 1 |
| `codex_veltrian_defensive_capability` | 1 |
| `codex_veltrian_defensive_doctrine` | 1 |
| `codex_veltrian_diplomatic_corps_war` | 1 |
| `codex_veltrian_economic_transition` | 1 |
| `codex_veltrian_elections` | 1 |
| `codex_veltrian_exile_government` | 1 |
| `codex_veltrian_industrial_sovereignty` | 1 |
| `codex_veltrian_logistics_network` | 1 |
| `codex_veltrian_military_families` | 1 |
| `codex_veltrian_military_sovereignty` | 1 |
| `codex_veltrian_order_of_battle` | 1 |
| `codex_veltrian_privatization` | 1 |
| `codex_veltrian_provinces` | 1 |
| `codex_veltrian_reform_movement` | 1 |
| `codex_veltrian_reserve_doctrine` | 1 |
| `codex_veltrian_reserve_system` | 1 |
| `codex_veltrian_resilience` | 1 |
| `codex_veltrian_socialism` | 1 |
| `codex_veltrian_sovereignty` | 1 |
| `codex_veltrian_sovereignty_doctrine` | 1 |
| `codex_veltrian_trade_diplomacy` | 1 |
| `codex_veltrian_victory` | 1 |
| `codex_veterans_affairs` | 1 |
| `codex_victory_avenue_standoff` | 1 |
| `codex_vostane_economic_critique` | 1 |
| `codex_vostane_halvek_tenure` | 1 |
| `codex_vostane_reconciliation_attempt` | 1 |
| `codex_war_bonds` | 1 |
| `codex_war_bonds_program` | 1 |
| `codex_war_contracts_system` | 1 |
| `codex_war_economy` | 1 |
| `codex_war_economy_measures` | 1 |
| `codex_war_labor_board` | 1 |
| `codex_war_measures_act` | 1 |
| `codex_war_planning` | 1 |
| `codex_war_production_board` | 1 |
| `codex_wartime_broadcasting` | 1 |
| `codex_wartime_economic_adjustment` | 1 |
| `codex_wartime_evacuation` | 1 |
| `codex_wartime_leadership` | 1 |
| `codex_wartime_logistics` | 1 |
| `codex_wartime_press_restrictions` | 1 |
| `codex_welfare_review` | 1 |
| `codex_winter_war_defense` | 1 |
| `codex_worker_government_alliance` | 1 |
| `codex_worker_production_councils` | 1 |
| `codex_worker_protections_wartime` | 1 |
| `codex_worker_state` | 1 |

### Per-occurrence detail

| File | Line | Scene -> Choice | Missing id |
|---|---|---|---|
| `data/narrative/act1/act1_chain_budget_revision.json` | 50, 83 | `act1_chain_budget_revision` -> `budget_revision_approve` | `codex_revised_budget` |
| `data/narrative/act1/act1_chain_budget_revision.json` | 50, 83 | `act1_chain_budget_revision` -> `budget_revision_push_more` | `codex_revised_budget` |
| `data/narrative/act1/act1_chain_budget_revision.json` | 83 | `act1_chain_budget_revision` -> `budget_revision_push_more` | `codex_administrative_reform` |
| `data/narrative/act1/act1_chain_budget_revision.json` | 117 | `act1_chain_budget_revision` -> `budget_revision_foreign_credit` | `codex_arcturian_credit` |
| `data/narrative/act1/act1_chain_capital_strike.json` | 50 | `act1_chain_capital_strike` -> `capital_strike_ima_alternative` | `codex_ima_acceleration` |
| `data/narrative/act1/act1_chain_capital_strike.json` | 77 | `act1_chain_capital_strike` -> `capital_strike_public_pressure` | `codex_capital_strike` |
| `data/narrative/act1/act1_chain_capital_strike.json` | 105 | `act1_chain_capital_strike` -> `capital_strike_reopen_dialogue` | `codex_vael_reconciliation` |
| `data/narrative/act1/act1_chain_church_opposition.json` | 85 | `act1_chain_church_opposition` -> `church_opposition_state_schools` | `codex_education_reform` |
| `data/narrative/act1/act1_chain_constitutional_crisis.json` | 85 | `act1_chain_constitutional_crisis` -> `constitutional_crisis_referendum` | `codex_article_74` |
| `data/narrative/act1/act1_chain_deficit_crisis.json` | 58 | `act1_chain_deficit_crisis` -> `deficit_crisis_austerity` | `codex_revised_budget` |
| `data/narrative/act1/act1_chain_kolvar_escalation.json` | 75 | `act1_chain_kolvar_escalation` -> `kolvar_escalation_purge` | `codex_civil_service_reform` |
| `data/narrative/act1/act1_chain_kolvar_escalation.json` | 128, 181 | `act1_chain_kolvar_escalation` -> `kolvar_escalation_negotiate` | `codex_kolvar_negotiation` |
| `data/narrative/act1/act1_chain_kolvar_escalation.json` | 128, 181 | `act1_chain_kolvar_escalation` -> `kolvar_escalation_concession` | `codex_kolvar_negotiation` |
| `data/narrative/act1/act1_chain_kolvar_opposition.json` | 83 | `act1_chain_kolvar_opposition` -> `kolvar_override_executive` | `codex_executive_authority` |
| `data/narrative/act1/act1_chain_kolvar_opposition.json` | 136 | `act1_chain_kolvar_opposition` -> `kolvar_engage_parliament` | `codex_parliamentary_procedure` |
| `data/narrative/act1/act1_chain_kolvar_opposition.json` | 189 | `act1_chain_kolvar_opposition` -> `kolvar_negotiate_backchannel` | `codex_kolvar_accommodation` |
| `data/narrative/act1/act1_chain_kolvar_opposition.json` | 247 | `act1_chain_kolvar_opposition` -> `kolvar_public_confrontation` | `codex_kolvar_confrontation` |
| `data/narrative/act1/act1_chain_kravenstal_escalation.json` | 80, 188 | `act1_chain_kravenstal_escalation` -> `kravenstal_escalation_concede` | `codex_kravenstal_settlement` |
| `data/narrative/act1/act1_chain_kravenstal_escalation.json` | 81 | `act1_chain_kravenstal_escalation` -> `kravenstal_escalation_concede` | `codex_corporate_surcharge` |
| `data/narrative/act1/act1_chain_kravenstal_escalation.json` | 134 | `act1_chain_kravenstal_escalation` -> `kravenstal_escalation_emergency_powers` | `codex_emergency_powers` |
| `data/narrative/act1/act1_chain_kravenstal_escalation.json` | 135 | `act1_chain_kravenstal_escalation` -> `kravenstal_escalation_emergency_powers` | `codex_military_logistics` |
| `data/narrative/act1/act1_chain_kravenstal_escalation.json` | 80, 188 | `act1_chain_kravenstal_escalation` -> `kravenstal_escalation_visit` | `codex_kravenstal_settlement` |
| `data/narrative/act1/act1_chain_kravenstal_unrest.json` | 94, 158, 226 | `act1_chain_kravenstal_unrest` -> `kravenstal_negotiate_maric` | `codex_kravenstal_strike` |
| `data/narrative/act1/act1_chain_kravenstal_unrest.json` | 95 | `act1_chain_kravenstal_unrest` -> `kravenstal_negotiate_maric` | `codex_welfare_review` |
| `data/narrative/act1/act1_chain_kravenstal_unrest.json` | 94, 158, 226 | `act1_chain_kravenstal_unrest` -> `kravenstal_compromise_partial` | `codex_kravenstal_strike` |
| `data/narrative/act1/act1_chain_kravenstal_unrest.json` | 94, 158, 226 | `act1_chain_kravenstal_unrest` -> `kravenstal_hold_firm` | `codex_kravenstal_strike` |
| `data/narrative/act1/act1_chain_kravenstal_unrest.json` | 227 | `act1_chain_kravenstal_unrest` -> `kravenstal_hold_firm` | `codex_austerity_defended` |
| `data/narrative/act1/act1_chain_liora_archive.json` | 48, 62 | `act1_chain_liora_archive` -> `liora_archive_joint_investigation` | `codex_mikhael_full_record` |
| `data/narrative/act1/act1_chain_liora_archive.json` | 48, 62 | `act1_chain_liora_archive` -> `liora_archive_support_discreetly` | `codex_mikhael_full_record` |
| `data/narrative/act1/act1_chain_tomas_nationalist.json` | 48, 64 | `act1_chain_tomas_nationalist` -> `tomas_ironborn_intervene_directly` | `codex_ironborn_youth` |
| `data/narrative/act1/act1_chain_tomas_nationalist.json` | 48, 64 | `act1_chain_tomas_nationalist` -> `tomas_ironborn_ban_forcefully` | `codex_ironborn_youth` |
| `data/narrative/act1/act1_chain_tyvaren_blind_spot.json` | 90 | `act1_chain_tyvaren_blind_spot` -> `tyvaren_blind_spot_arcturian_partnership` | `codex_arcturian_intelligence` |
| `data/narrative/act1/act1_chain_tyvaren_border_standoff.json` | 180 | `act1_chain_tyvaren_border_standoff` -> `border_standoff_propose_commission` | `codex_asturien_forum` |
| `data/narrative/act1/act1_chain_vael_pressure.json` | 145 | `act1_chain_vael_pressure` -> `vael_negotiate_selective` | `codex_vael_negotiation` |
| `data/narrative/act1/act1_chain_vael_pressure.json` | 198 | `act1_chain_vael_pressure` -> `vael_charm_counter` | `codex_vael_alliance` |
| `data/narrative/act1/act1_chain_vael_pressure.json` | 258 | `act1_chain_vael_pressure` -> `vael_threaten_back` | `codex_bni_intelligence` |
| `data/narrative/act1/act1_chain_watchtower_leak.json` | 168 | `act1_chain_watchtower_leak` -> `watchtower_leak_civilian_agency` | `codex_civilian_intelligence` |
| `data/narrative/act1/act1_family_liora_mikhael.json` | 54 | `act1_family_liora_mikhael` -> `liora_mikhael_official` | `codex_mikhael_official` |
| `data/narrative/act1/act1_family_liora_mikhael.json` | 72 | `act1_family_liora_mikhael` -> `liora_mikhael_investigating` | `codex_mikhael_investigation` |
| `data/narrative/act1/act1_family_liora_mikhael.json` | 91 | `act1_family_liora_mikhael` -> `liora_mikhael_complicated` | `codex_mikhael_complicated` |
| `data/narrative/act1/act1_family_liora_mikhael.json` | 91 | `act1_family_liora_mikhael` -> `liora_mikhael_complicated` | `codex_orythia_connection` |
| `data/narrative/act1/act1_minority_festival_request.json` | 79, 171 | `act1_minority_festival_request` -> `festival_authorize` | `codex_dravenni_culture` |
| `data/narrative/act1/act1_minority_festival_request.json` | 79, 171 | `act1_minority_festival_request` -> `festival_compromise` | `codex_dravenni_culture` |
| `data/narrative/act1/act1_religious_parish_priest.json` | 72 | `act1_religious_parish_priest` -> `priest_protect` | `codex_church_reform` |
| `data/narrative/act1/act1_vael_estate_dinner.json` | 92 | `act1_vael_estate_dinner` -> `vael_dinner_charm` | `codex_vael_alliance` |
| `data/narrative/act1/act1_vael_estate_dinner.json` | 208 | `act1_vael_estate_dinner` -> `vael_dinner_observe` | `codex_vael_observation` |
| `data/narrative/act1/act1_vael_party_funding.json` | 93 | `act1_vael_party_funding` -> `vael_funding_accept` | `codex_vael_alliance` |
| `data/narrative/act1/act1_week10_law_enforcement_choice.json` | 78 | `act1_week10_law_enforcement_choice` -> `fund_bca` | `codex_bca` |
| `data/narrative/act1/act1_week10_law_enforcement_choice.json` | 124 | `act1_week10_law_enforcement_choice` -> `fund_ssd` | `codex_ssd` |
| `data/narrative/act1/act1_week10_law_enforcement_choice.json` | 165 | `act1_week10_law_enforcement_choice` -> `fund_both_weakened` | `codex_both_agencies` |
| `data/narrative/act1/act1_week10_reform_committee.json` | 61 | `act1_week10_reform_committee` -> `reform_executive_path` | `codex_constitutional_convention` |
| `data/narrative/act1/act1_week10_reform_committee.json` | 61 | `act1_week10_reform_committee` -> `reform_executive_path` | `codex_article_22` |
| `data/narrative/act1/act1_week10_reform_committee.json` | 94 | `act1_week10_reform_committee` -> `reform_legislative_path` | `codex_constitutional_reform_process` |
| `data/narrative/act1/act1_week10_reform_committee.json` | 122 | `act1_week10_reform_committee` -> `reform_delay_focus_crisis` | `codex_governance_first` |
| `data/narrative/act1/act1_week11_kravenstal_powderkeg.json` | 52 | `act1_week11_kravenstal_powderkeg` -> `kravenstal_emergency_relief` | `codex_emergency_relief` |
| `data/narrative/act1/act1_week11_kravenstal_powderkeg.json` | 52 | `act1_week11_kravenstal_powderkeg` -> `kravenstal_emergency_relief` | `codex_kravenstal_crisis` |
| `data/narrative/act1/act1_week11_kravenstal_powderkeg.json` | 85 | `act1_week11_kravenstal_powderkeg` -> `kravenstal_honest_constraints` | `codex_kravenstal_visit` |
| `data/narrative/act1/act1_week11_kravenstal_powderkeg.json` | 118 | `act1_week11_kravenstal_powderkeg` -> `kravenstal_security_response` | `codex_civil_unrest_preparedness` |
| `data/narrative/act1/act1_week12_nadia_voss.json` | 56 | `act1_week12_nadia_voss` -> `nadia_full_access` | `codex_press_freedom` |
| `data/narrative/act1/act1_week12_nadia_voss.json` | 56 | `act1_week12_nadia_voss` -> `nadia_full_access` | `codex_nadia_voss` |
| `data/narrative/act1/act1_week12_nadia_voss.json` | 88 | `act1_week12_nadia_voss` -> `nadia_managed_relationship` | `codex_press_relations` |
| `data/narrative/act1/act1_week12_nadia_voss.json` | 124 | `act1_week12_nadia_voss` -> `nadia_deflect_threat` | `codex_press_confrontation` |
| `data/narrative/act1/act1_week13_no_confidence.json` | 56, 89, 122, 161 | `act1_week13_no_confidence` -> `no_confidence_fight_reformist` | `codex_no_confidence_vote` |
| `data/narrative/act1/act1_week13_no_confidence.json` | 56 | `act1_week13_no_confidence` -> `no_confidence_fight_reformist` | `codex_parliamentary_victory` |
| `data/narrative/act1/act1_week13_no_confidence.json` | 56, 89, 122, 161 | `act1_week13_no_confidence` -> `no_confidence_fight_pragmatic` | `codex_no_confidence_vote` |
| `data/narrative/act1/act1_week13_no_confidence.json` | 56, 89, 122, 161 | `act1_week13_no_confidence` -> `no_confidence_deal_with_workers` | `codex_no_confidence_vote` |
| `data/narrative/act1/act1_week13_no_confidence.json` | 122 | `act1_week13_no_confidence` -> `no_confidence_deal_with_workers` | `codex_social_protection_fund` |
| `data/narrative/act1/act1_week13_no_confidence.json` | 56, 89, 122, 161 | `act1_week13_no_confidence` -> `no_confidence_executive_power` | `codex_no_confidence_vote` |
| `data/narrative/act1/act1_week13_no_confidence.json` | 161 | `act1_week13_no_confidence` -> `no_confidence_executive_power` | `codex_article_22_invoked` |
| `data/narrative/act1/act1_week1_bni_discovery.json` | 84 | `act1_week1_bni_discovery` -> `bni_full_shutdown` | `codex_bni_dissolution` |
| `data/narrative/act1/act1_week1_bni_discovery.json` | 123 | `act1_week1_bni_discovery` -> `bni_civilian_oversight` | `codex_bni_reform` |
| `data/narrative/act1/act1_week1_bni_discovery.json` | 164 | `act1_week1_bni_discovery` -> `bni_redirect` | `codex_bni_expansion` |
| `data/narrative/act1/act1_week4_elena_introduction.json` | 99, 158, 212 | `act1_week4_elena_introduction` -> `elena_accept_deal` | `codex_vnn` |
| `data/narrative/act1/act1_week4_elena_introduction.json` | 99, 158, 212 | `act1_week4_elena_introduction` -> `elena_decline` | `codex_vnn` |
| `data/narrative/act1/act1_week4_elena_introduction.json` | 99, 158, 212 | `act1_week4_elena_introduction` -> `elena_stall` | `codex_vnn` |
| `data/narrative/act1/act1_week4_first_month.json` | 51 | `act1_week4_first_month` -> `month_one_connect_people` | `codex_veltrian_provinces` |
| `data/narrative/act1/act1_week4_first_month.json` | 78 | `act1_week4_first_month` -> `month_one_focus_governance` | `codex_legislative_process` |
| `data/narrative/act1/act1_week4_first_month.json` | 105 | `act1_week4_first_month` -> `month_one_consolidate_power` | `codex_executive_priorities` |
| `data/narrative/act1/act1_week8_church_and_state.json` | 56 | `act1_week8_church_and_state` -> `church_continue_funding` | `codex_church_social_services` |
| `data/narrative/act1/act1_week8_church_and_state.json` | 56 | `act1_week8_church_and_state` -> `church_continue_funding` | `codex_state_church_accord` |
| `data/narrative/act1/act1_week8_church_and_state.json` | 89 | `act1_week8_church_and_state` -> `church_secular_reform` | `codex_secular_reform` |
| `data/narrative/act1/act1_week8_church_and_state.json` | 89 | `act1_week8_church_and_state` -> `church_secular_reform` | `codex_public_welfare_system` |
| `data/narrative/act1/act1_week8_church_and_state.json` | 117 | `act1_week8_church_and_state` -> `church_maintain_halvek_deal` | `codex_church_state_concordat` |
| `data/narrative/act1/act1_week9_first_quarter.json` | 61 | `act1_week9_first_quarter` -> `quarterly_double_down_reform` | `codex_economic_reform` |
| `data/narrative/act1/act1_week9_first_quarter.json` | 61 | `act1_week9_first_quarter` -> `quarterly_double_down_reform` | `codex_ima_timeline` |
| `data/narrative/act1/act1_week9_first_quarter.json` | 94 | `act1_week9_first_quarter` -> `quarterly_slow_reform` | `codex_social_safety_net` |
| `data/narrative/act1/act1_week9_first_quarter.json` | 94 | `act1_week9_first_quarter` -> `quarterly_slow_reform` | `codex_ima_negotiation` |
| `data/narrative/act1/act1_week9_first_quarter.json` | 127 | `act1_week9_first_quarter` -> `quarterly_emergency_jobs` | `codex_public_works_program` |
| `data/narrative/act1/act1_week9_first_quarter.json` | 127 | `act1_week9_first_quarter` -> `quarterly_emergency_jobs` | `codex_emergency_employment` |
| `data/narrative/act1/investigation/mole_week3_choice.json` | 90 | `mole_week3_choice` -> `mole_hunt_formal` | `codex_bni_signals` |
| `data/narrative/act1/investigation/mole_week3_choice.json` | 139 | `mole_week3_choice` -> `mole_hunt_passive` | `codex_intelligence_oversight` |
| `data/narrative/act1/investigation/mole_week3_choice.json` | 193 | `mole_week3_choice` -> `mole_hunt_oberlin` | `codex_bni_abolition` |
| `data/narrative/act1/investigation/mole_week5_complication.json` | 75 | `mole_week5_complication` -> `mole_complication_formal` | `codex_counterintelligence` |
| `data/narrative/act1/investigation/mole_week5_complication.json` | 131 | `mole_week5_complication` -> `mole_complication_passive` | `codex_military_intelligence` |
| `data/narrative/act1/investigation/mole_week5_complication.json` | 182 | `mole_week5_complication` -> `mole_complication_oberlin` | `codex_domestic_intelligence` |
| `data/narrative/act1/investigation/mole_week7_false_resolve.json` | 81, 124 | `mole_week7_false_resolve` -> `mole_accept_confession` | `codex_press_office` |
| `data/narrative/act1/investigation/mole_week7_false_resolve.json` | 123 | `mole_week7_false_resolve` -> `mole_reject_confession` | `codex_counterintelligence` |
| `data/narrative/act1/investigation/mole_week7_false_resolve.json` | 81, 124 | `mole_week7_false_resolve` -> `mole_reject_confession` | `codex_press_office` |
| `data/narrative/act1/investigation/mole_week9_reveal.json` | 94 | `mole_week9_reveal` -> `mole_reveal_prosecute` | `codex_espionage_law` |
| `data/narrative/act1/investigation/mole_week9_reveal.json` | 142 | `mole_week9_reveal` -> `mole_reveal_quiet_deal` | `codex_diplomatic_immunity` |
| `data/narrative/act1/investigation/mole_week9_reveal.json` | 143 | `mole_week9_reveal` -> `mole_reveal_quiet_deal` | `codex_counterintelligence` |
| `data/narrative/act1/investigation/mole_week9_reveal.json` | 196 | `mole_week9_reveal` -> `mole_reveal_third_option` | `codex_double_agent` |
| `data/narrative/act1/investigation/mole_week9_reveal.json` | 197 | `mole_week9_reveal` -> `mole_reveal_third_option` | `codex_disinformation` |
| `data/narrative/act2/act2_bca_report_wk22.json` | 93, 145, 198 | `act2_bca_report_wk22` -> `bca_expand_transition_audit` | `codex_halvek_corruption` |
| `data/narrative/act2/act2_bca_report_wk22.json` | 93, 145, 198 | `act2_bca_report_wk22` -> `bca_limited_expansion` | `codex_halvek_corruption` |
| `data/narrative/act2/act2_bca_report_wk22.json` | 93, 145, 198 | `act2_bca_report_wk22` -> `bca_block_transition_audit` | `codex_halvek_corruption` |
| `data/narrative/act2/act2_deficit_crisis.json` | 116 | `act2_deficit_crisis` -> `deficit_crisis_vael_nationalize` | `codex_vael_oligarch` |
| `data/narrative/act2/act2_minority_language_school.json` | 51, 83 | `act2_minority_language_school` -> `language_school_approve` | `codex_dravenni_culture` |
| `data/narrative/act2/act2_minority_language_school.json` | 51, 83 | `act2_minority_language_school` -> `language_school_dual` | `codex_dravenni_culture` |
| `data/narrative/act2/act2_minority_mixed_marriage.json` | 51 | `act2_minority_mixed_marriage` -> `marriage_defend` | `codex_civil_rights` |
| `data/narrative/act2/act2_minority_mixed_marriage.json` | 82 | `act2_minority_mixed_marriage` -> `marriage_private_meeting` | `codex_church_reform` |
| `data/narrative/act2/act2_minority_refugee_health.json` | 49, 81 | `act2_minority_refugee_health` -> `refugee_health_fund` | `codex_refugee_crisis` |
| `data/narrative/act2/act2_minority_refugee_health.json` | 49, 81 | `act2_minority_refugee_health` -> `refugee_health_international` | `codex_refugee_crisis` |
| `data/narrative/act2/act2_religious_holiday_speech.json` | 44, 71 | `act2_religious_holiday_speech` -> `holiday_faithful` | `codex_church_tradition` |
| `data/narrative/act2/act2_religious_holiday_speech.json` | 44, 71 | `act2_religious_holiday_speech` -> `holiday_unity` | `codex_church_tradition` |
| `data/narrative/act2/act2_religious_hospital_threat.json` | 49, 66 | `act2_religious_hospital_threat` -> `hospital_negotiate` | `codex_church_healthcare` |
| `data/narrative/act2/act2_religious_hospital_threat.json` | 49, 66 | `act2_religious_hospital_threat` -> `hospital_secularize` | `codex_church_healthcare` |
| `data/narrative/act2/act2_ssd_report_wk22.json` | 88, 142, 196 | `act2_ssd_report_wk22` -> `ssd_prosecute_branek` | `codex_branek_case` |
| `data/narrative/act2/act2_ssd_report_wk22.json` | 88, 142, 196 | `act2_ssd_report_wk22` -> `ssd_secret_negotiation` | `codex_branek_case` |
| `data/narrative/act2/act2_ssd_report_wk22.json` | 143 | `act2_ssd_report_wk22` -> `ssd_secret_negotiation` | `codex_mass_graves` |
| `data/narrative/act2/act2_ssd_report_wk22.json` | 88, 142, 196 | `act2_ssd_report_wk22` -> `ssd_silence_branek` | `codex_branek_case` |
| `data/narrative/act2/act2_tyvaren_blind_spot.json` | 53 | `act2_tyvaren_blind_spot` -> `act2_tyvaren_blind_spot_alliance` | `codex_arcturian_commonwealth` |
| `data/narrative/act2/act2_tyvaren_blind_spot.json` | 109 | `act2_tyvaren_blind_spot` -> `act2_tyvaren_blind_spot_orythian` | `codex_orythian_dominion` |
| `data/narrative/act2/act2_vael_referendum_funding.json` | 66 | `act2_vael_referendum_funding` -> `vael_referendum_accept` | `codex_vael_alliance` |
| `data/narrative/act2/act2_vael_steel_mills.json` | 57 | `act2_vael_steel_mills` -> `vael_steel_accept` | `codex_vael_alliance` |
| `data/narrative/act2/act2_week17_soren_debate.json` | 63, 82 | `act2_week17_soren_debate` -> `soren_debate_push_through` | `codex_accountability_provision` |
| `data/narrative/act2/act2_week17_soren_debate.json` | 63, 82 | `act2_week17_soren_debate` -> `soren_debate_compromise` | `codex_accountability_provision` |
| `data/narrative/act2/act2_week19_refugee_flood.json` | 95, 116, 143, 160 | `act2_week19_refugee_flood` -> `refugee_open_border` | `codex_morivask_crisis` |
| `data/narrative/act2/act2_week19_refugee_flood.json` | 95, 116, 143, 160 | `act2_week19_refugee_flood` -> `refugee_managed_intake` | `codex_morivask_crisis` |
| `data/narrative/act2/act2_week19_refugee_flood.json` | 95, 116, 143, 160 | `act2_week19_refugee_flood` -> `refugee_border_closure` | `codex_morivask_crisis` |
| `data/narrative/act2/act2_week19_refugee_flood.json` | 95, 116, 143, 160 | `act2_week19_refugee_flood` -> `refugee_international_appeal` | `codex_morivask_crisis` |
| `data/narrative/act2/act2_week19_refugee_flood.json` | 160 | `act2_week19_refugee_flood` -> `refugee_international_appeal` | `codex_asturien_forum` |
| `data/narrative/act2/act2_week20_megaproject_choice.json` | 499 | `act2_week20_megaproject_choice` -> `dev_highway_end` | `codex_northern_highway` |
| `data/narrative/act2/act2_week20_megaproject_choice.json` | 500, 548, 596, 644 | `act2_week20_megaproject_choice` -> `dev_highway_end` | `codex_benedikt_varro` |
| `data/narrative/act2/act2_week20_megaproject_choice.json` | 547, 595 | `act2_week20_megaproject_choice` -> `dev_dam_full_end` | `codex_kravenstal_dam` |
| `data/narrative/act2/act2_week20_megaproject_choice.json` | 500, 548, 596, 644 | `act2_week20_megaproject_choice` -> `dev_dam_full_end` | `codex_benedikt_varro` |
| `data/narrative/act2/act2_week20_megaproject_choice.json` | 547, 595 | `act2_week20_megaproject_choice` -> `dev_dam_partial_end` | `codex_kravenstal_dam` |
| `data/narrative/act2/act2_week20_megaproject_choice.json` | 500, 548, 596, 644 | `act2_week20_megaproject_choice` -> `dev_dam_partial_end` | `codex_benedikt_varro` |
| `data/narrative/act2/act2_week20_megaproject_choice.json` | 643 | `act2_week20_megaproject_choice` -> `dev_port_end` | `codex_sevagrad_port` |
| `data/narrative/act2/act2_week20_megaproject_choice.json` | 500, 548, 596, 644 | `act2_week20_megaproject_choice` -> `dev_port_end` | `codex_benedikt_varro` |
| `data/narrative/act2/act2_week21_visit_petravar.json` | 108, 138, 161, 188 | `act2_week21_visit_petravar` -> `petravar_full_alignment` | `codex_orythian_dominion` |
| `data/narrative/act2/act2_week21_visit_petravar.json` | 108, 138, 161, 188 | `act2_week21_visit_petravar` -> `petravar_loan_only` | `codex_orythian_dominion` |
| `data/narrative/act2/act2_week21_visit_petravar.json` | 108, 138, 161, 188 | `act2_week21_visit_petravar` -> `petravar_challenge_morivask` | `codex_orythian_dominion` |
| `data/narrative/act2/act2_week21_visit_petravar.json` | 108, 138, 161, 188 | `act2_week21_visit_petravar` -> `petravar_decline_return_home` | `codex_orythian_dominion` |
| `data/narrative/act2/act2_week21_visit_stellamere.json` | 112, 130, 147, 168 | `act2_week21_visit_stellamere` -> `stellamere_full_alliance` | `codex_arcturian_commonwealth` |
| `data/narrative/act2/act2_week21_visit_stellamere.json` | 112, 130, 147, 168 | `act2_week21_visit_stellamere` -> `stellamere_trade_only` | `codex_arcturian_commonwealth` |
| `data/narrative/act2/act2_week21_visit_stellamere.json` | 112, 130, 147, 168 | `act2_week21_visit_stellamere` -> `stellamere_challenge_terms` | `codex_arcturian_commonwealth` |
| `data/narrative/act2/act2_week21_visit_stellamere.json` | 112, 130, 147, 168 | `act2_week21_visit_stellamere` -> `stellamere_decline_politely` | `codex_arcturian_commonwealth` |
| `data/narrative/act2/act2_week22_nadia_investigation.json` | 90 | `act2_week22_nadia_investigation` -> `nadia_full_cooperation` | `codex_bni_history` |
| `data/narrative/act2/act2_week24_voss_introduction.json` | 373, 433, 493 | `act2_week24_voss_introduction` -> `voss_close_civilian_end` | `codex_voss_cipher_engine` |
| `data/narrative/act2/act2_week24_voss_introduction.json` | 374, 434, 494 | `act2_week24_voss_introduction` -> `voss_close_civilian_end` | `codex_emilian_voss` |
| `data/narrative/act2/act2_week24_voss_introduction.json` | 373, 433, 493 | `act2_week24_voss_introduction` -> `voss_close_deflect_end` | `codex_voss_cipher_engine` |
| `data/narrative/act2/act2_week24_voss_introduction.json` | 374, 434, 494 | `act2_week24_voss_introduction` -> `voss_close_deflect_end` | `codex_emilian_voss` |
| `data/narrative/act2/act2_week24_voss_introduction.json` | 373, 433, 493 | `act2_week24_voss_introduction` -> `voss_close_military_end` | `codex_voss_cipher_engine` |
| `data/narrative/act2/act2_week24_voss_introduction.json` | 374, 434, 494 | `act2_week24_voss_introduction` -> `voss_close_military_end` | `codex_emilian_voss` |
| `data/narrative/act2/act2_week27_press_followup.json` | 73, 115, 157 | `act2_week27_press_followup` -> `press_followup_specific` | `codex_press_conference` |
| `data/narrative/act2/act2_week27_press_followup.json` | 73, 115, 157 | `act2_week27_press_followup` -> `press_followup_deflect` | `codex_press_conference` |
| `data/narrative/act2/act2_week27_press_followup.json` | 73, 115, 157 | `act2_week27_press_followup` -> `press_followup_combative` | `codex_press_conference` |
| `data/narrative/act2/act2_week29_sovarka_approach.json` | 600, 643, 698 | `act2_week29_sovarka_approach` -> `sovarka_full_end` | `codex_sovarka` |
| `data/narrative/act2/act2_week29_sovarka_approach.json` | 601, 644, 699 | `act2_week29_sovarka_approach` -> `sovarka_full_end` | `codex_andrei_luca` |
| `data/narrative/act2/act2_week29_sovarka_approach.json` | 600, 643, 698 | `act2_week29_sovarka_approach` -> `sovarka_quiet_end` | `codex_sovarka` |
| `data/narrative/act2/act2_week29_sovarka_approach.json` | 601, 644, 699 | `act2_week29_sovarka_approach` -> `sovarka_quiet_end` | `codex_andrei_luca` |
| `data/narrative/act2/act2_week29_sovarka_approach.json` | 600, 643, 698 | `act2_week29_sovarka_approach` -> `sovarka_defer_end` | `codex_sovarka` |
| `data/narrative/act2/act2_week29_sovarka_approach.json` | 601, 644, 699 | `act2_week29_sovarka_approach` -> `sovarka_defer_end` | `codex_andrei_luca` |
| `data/narrative/act3/act3_alternative_financing.json` | 56 | `act3_alternative_financing` -> `alternative_financing_orythian` | `codex_orythian_economic_model` |
| `data/narrative/act3/act3_alternative_financing.json` | 75 | `act3_alternative_financing` -> `alternative_financing_stellamere` | `codex_stellamere_financial_relations` |
| `data/narrative/act3/act3_alternative_financing.json` | 94 | `act3_alternative_financing` -> `alternative_financing_asset_sales` | `codex_national_asset_sales` |
| `data/narrative/act3/act3_arcturian_privatization_pressure.json` | 51 | `act3_arcturian_privatization_pressure` -> `privatization_accept` | `codex_veltrian_privatization` |
| `data/narrative/act3/act3_arcturian_privatization_pressure.json` | 70 | `act3_arcturian_privatization_pressure` -> `privatization_negotiate_timeline` | `codex_veltrian_economic_transition` |
| `data/narrative/act3/act3_arcturian_privatization_pressure.json` | 89 | `act3_arcturian_privatization_pressure` -> `privatization_reject` | `codex_veltrian_industrial_sovereignty` |
| `data/narrative/act3/act3_arcturian_sanctions.json` | 54 | `act3_arcturian_sanctions` -> `arcturian_sanctions_alternative_markets` | `codex_veltrian_trade_diplomacy` |
| `data/narrative/act3/act3_arcturian_sanctions.json` | 72 | `act3_arcturian_sanctions` -> `arcturian_sanctions_negotiate_relief` | `codex_arcturian_trade_relations` |
| `data/narrative/act3/act3_arcturian_sanctions.json` | 91 | `act3_arcturian_sanctions` -> `arcturian_sanctions_deepen_orythian` | `codex_orythian_trade_bloc` |
| `data/narrative/act3/act3_ashenmere_standoff.json` | 61 | `act3_ashenmere_standoff` -> `standoff_address_soldiers` | `codex_victory_avenue_standoff` |
| `data/narrative/act3/act3_ashenmere_standoff.json` | 61 | `act3_ashenmere_standoff` -> `standoff_address_soldiers` | `codex_soldiers_oath` |
| `data/narrative/act3/act3_ashenmere_standoff.json` | 86 | `act3_ashenmere_standoff` -> `standoff_defensive_posture` | `codex_deescalation_protocol` |
| `data/narrative/act3/act3_ashenmere_standoff.json` | 86 | `act3_ashenmere_standoff` -> `standoff_defensive_posture` | `codex_direct_communication_channel` |
| `data/narrative/act3/act3_ashenmere_standoff.json` | 112 | `act3_ashenmere_standoff` -> `standoff_demand_surrender` | `codex_constitutional_chain_of_command` |
| `data/narrative/act3/act3_ashenmere_standoff.json` | 112 | `act3_ashenmere_standoff` -> `standoff_demand_surrender` | `codex_chancellor_war_powers` |
| `data/narrative/act3/act3_assassination_bombing.json` | 56 | `act3_assassination_bombing` -> `bombing_go_to_cabinet` | `codex_ashenmere_incident` |
| `data/narrative/act3/act3_assassination_cabinet.json` | 73 | `act3_assassination_cabinet` -> `cabinet_declare_emergency` | `codex_state_of_emergency` |
| `data/narrative/act3/act3_assassination_cabinet.json` | 144, 170 | `act3_assassination_cabinet` -> `cabinet_blame_tyvaren` | `codex_tyvaren_crisis` |
| `data/narrative/act3/act3_assassination_cabinet.json` | 144, 170 | `act3_assassination_cabinet` -> `cabinet_blame_tyvaren_thin` | `codex_tyvaren_crisis` |
| `data/narrative/act3/act3_assassination_default.json` | 45 | `act3_assassination_default` -> `default_go_to_cabinet` | `codex_ashenmere_incident` |
| `data/narrative/act3/act3_assassination_poisoning.json` | 62 | `act3_assassination_poisoning` -> `poisoning_go_to_cabinet` | `codex_ashenmere_incident` |
| `data/narrative/act3/act3_assassination_sniper.json` | 58 | `act3_assassination_sniper` -> `sniper_go_to_cabinet` | `codex_ashenmere_incident` |
| `data/narrative/act3/act3_autonomy_commission.json` | 55, 73, 91 | `act3_autonomy_commission` -> `autonomy_commission_power` | `codex_autonomy_commission` |
| `data/narrative/act3/act3_autonomy_commission.json` | 55, 73, 91 | `act3_autonomy_commission` -> `autonomy_commission_narrow` | `codex_autonomy_commission` |
| `data/narrative/act3/act3_autonomy_commission.json` | 55, 73, 91 | `act3_autonomy_commission` -> `autonomy_commission_observe` | `codex_autonomy_commission` |
| `data/narrative/act3/act3_battle_gravenmark.json` | 56, 75, 94 | `act3_battle_gravenmark` -> `gravenmark_all_reserves` | `codex_battle_gravenmark` |
| `data/narrative/act3/act3_battle_gravenmark.json` | 56 | `act3_battle_gravenmark` -> `gravenmark_all_reserves` | `codex_veltrian_reserve_doctrine` |
| `data/narrative/act3/act3_battle_gravenmark.json` | 56, 75, 94 | `act3_battle_gravenmark` -> `gravenmark_reinforce_fallback` | `codex_battle_gravenmark` |
| `data/narrative/act3/act3_battle_gravenmark.json` | 75 | `act3_battle_gravenmark` -> `gravenmark_reinforce_fallback` | `codex_fallback_defense_doctrine` |
| `data/narrative/act3/act3_battle_gravenmark.json` | 56, 75, 94 | `act3_battle_gravenmark` -> `gravenmark_trust_dusek` | `codex_battle_gravenmark` |
| `data/narrative/act3/act3_battle_gravenmark.json` | 94 | `act3_battle_gravenmark` -> `gravenmark_trust_dusek` | `codex_mission_command_doctrine` |
| `data/narrative/act3/act3_battle_kravenstal_approach.json` | 55 | `act3_battle_kravenstal_approach` -> `kravenstal_engage_defensive_line` | `codex_aldenmoor_defensive_line` |
| `data/narrative/act3/act3_battle_kravenstal_approach.json` | 55 | `act3_battle_kravenstal_approach` -> `kravenstal_engage_defensive_line` | `codex_conventional_defense_doctrine` |
| `data/narrative/act3/act3_battle_kravenstal_approach.json` | 74 | `act3_battle_kravenstal_approach` -> `kravenstal_trade_territory_time` | `codex_defense_in_depth_execution` |
| `data/narrative/act3/act3_battle_kravenstal_approach.json` | 74 | `act3_battle_kravenstal_approach` -> `kravenstal_trade_territory_time` | `codex_civilian_evacuation_protocol` |
| `data/narrative/act3/act3_battle_kravenstal_approach.json` | 93 | `act3_battle_kravenstal_approach` -> `kravenstal_local_counterattacks` | `codex_local_counterattack_doctrine` |
| `data/narrative/act3/act3_battle_kravenstal_approach.json` | 93 | `act3_battle_kravenstal_approach` -> `kravenstal_local_counterattacks` | `codex_asymmetric_warfare` |
| `data/narrative/act3/act3_bca_report_wk33.json` | 108, 158, 209 | `act3_bca_report_wk33` -> `bca_full_investigation_own_side` | `codex_transition_corruption` |
| `data/narrative/act3/act3_bca_report_wk33.json` | 108, 158, 209 | `act3_bca_report_wk33` -> `bca_private_resolution` | `codex_transition_corruption` |
| `data/narrative/act3/act3_bca_report_wk33.json` | 108, 158, 209 | `act3_bca_report_wk33` -> `bca_shut_down_investigation` | `codex_transition_corruption` |
| `data/narrative/act3/act3_bca_report_wk44.json` | 114, 169, 220 | `act3_bca_report_wk44` -> `bca_prosecute_vyktor` | `codex_vyktor_trial` |
| `data/narrative/act3/act3_bca_report_wk44.json` | 114, 169, 220 | `act3_bca_report_wk44` -> `bca_vyktor_resignation` | `codex_vyktor_trial` |
| `data/narrative/act3/act3_bca_report_wk44.json` | 114, 169, 220 | `act3_bca_report_wk44` -> `bca_pardon_vyktor_shut_down` | `codex_vyktor_trial` |
| `data/narrative/act3/act3_both_agencies_conflict.json` | 68, 90, 113 | `act3_both_agencies_conflict` -> `both_choose_bca_dismantle_ssd` | `codex_ssd_dissolution` |
| `data/narrative/act3/act3_both_agencies_conflict.json` | 68, 90, 113 | `act3_both_agencies_conflict` -> `both_choose_ssd_dismantle_bca` | `codex_ssd_dissolution` |
| `data/narrative/act3/act3_both_agencies_conflict.json` | 68, 90, 113 | `act3_both_agencies_conflict` -> `both_merge_agencies` | `codex_ssd_dissolution` |
| `data/narrative/act3/act3_both_agencies_conflict.json` | 113 | `act3_both_agencies_conflict` -> `both_merge_agencies` | `codex_csad` |
| `data/narrative/act3/act3_brenner_negotiation.json` | 56 | `act3_brenner_negotiation` -> `brenner_concede_security` | `codex_brenner_demands` |
| `data/narrative/act3/act3_brenner_negotiation.json` | 56 | `act3_brenner_negotiation` -> `brenner_concede_security` | `codex_deputy_chancellor_positions` |
| `data/narrative/act3/act3_brenner_negotiation.json` | 76 | `act3_brenner_negotiation` -> `brenner_coalition_government` | `codex_coalition_framework` |
| `data/narrative/act3/act3_brenner_negotiation.json` | 76 | `act3_brenner_negotiation` -> `brenner_coalition_government` | `codex_civil_military_integration` |
| `data/narrative/act3/act3_brenner_negotiation.json` | 97 | `act3_brenner_negotiation` -> `brenner_refuse_bluff` | `codex_veltrian_constitutional_crisis` |
| `data/narrative/act3/act3_brenner_negotiation.json` | 97 | `act3_brenner_negotiation` -> `brenner_refuse_bluff` | `codex_brenner_ultimatum` |
| `data/narrative/act3/act3_brenner_response.json` | 66, 85, 102 | `act3_brenner_response` -> `brenner_response_integrate` | `codex_civilian_military_oversight` |
| `data/narrative/act3/act3_brenner_response.json` | 66, 85, 102 | `act3_brenner_response` -> `brenner_response_assert_authority` | `codex_civilian_military_oversight` |
| `data/narrative/act3/act3_brenner_response.json` | 66, 85, 102 | `act3_brenner_response` -> `brenner_response_test_loyalty` | `codex_civilian_military_oversight` |
| `data/narrative/act3/act3_chain_assassination_attempt.json` | 67, 86, 108 | `act3_chain_assassination_attempt` -> `assassination_public_defiance` | `codex_assassination_attempt` |
| `data/narrative/act3/act3_chain_assassination_attempt.json` | 67, 86, 108 | `act3_chain_assassination_attempt` -> `assassination_crackdown` | `codex_assassination_attempt` |
| `data/narrative/act3/act3_chain_assassination_attempt.json` | 67, 86, 108 | `act3_chain_assassination_attempt` -> `assassination_diplomatic_response` | `codex_assassination_attempt` |
| `data/narrative/act3/act3_chain_assassination_attempt.json` | 108 | `act3_chain_assassination_attempt` -> `assassination_diplomatic_response` | `codex_international_investigation` |
| `data/narrative/act3/act3_coalition_government.json` | 62 | `act3_coalition_government` -> `coalition_push_reforms` | `codex_coalition_governance` |
| `data/narrative/act3/act3_coalition_government.json` | 62 | `act3_coalition_government` -> `coalition_push_reforms` | `codex_cabinet_reform_agenda` |
| `data/narrative/act3/act3_coalition_government.json` | 82 | `act3_coalition_government` -> `coalition_contain_military` | `codex_coalition_compartmentalization` |
| `data/narrative/act3/act3_coalition_government.json` | 82 | `act3_coalition_government` -> `coalition_contain_military` | `codex_security_portfolio` |
| `data/narrative/act3/act3_coalition_government.json` | 103 | `act3_coalition_government` -> `coalition_marginalize_military` | `codex_cabinet_procedure` |
| `data/narrative/act3/act3_coalition_government.json` | 103 | `act3_coalition_government` -> `coalition_marginalize_military` | `codex_article_twelve_veto` |
| `data/narrative/act3/act3_constitution_implementation.json` | 55 | `act3_constitution_implementation` -> `constitution_court_first` | `codex_constitutional_court` |
| `data/narrative/act3/act3_constitution_implementation.json` | 55 | `act3_constitution_implementation` -> `constitution_court_first` | `codex_judicial_reform` |
| `data/narrative/act3/act3_constitution_implementation.json` | 74 | `act3_constitution_implementation` -> `constitution_gradual_implementation` | `codex_constitutional_implementation_phased` |
| `data/narrative/act3/act3_constitution_implementation.json` | 93 | `act3_constitution_implementation` -> `constitution_maximum_mandate` | `codex_constitutional_implementation_urgent` |
| `data/narrative/act3/act3_dlf_coordination.json` | 50 | `act3_dlf_coordination` -> `dlf_coordination_deepen` | `codex_dlf_joint_operations` |
| `data/narrative/act3/act3_dlf_coordination.json` | 68 | `act3_dlf_coordination` -> `dlf_coordination_maintain` | `codex_dlf_gradual_integration` |
| `data/narrative/act3/act3_dlf_coordination.json` | 86 | `act3_dlf_coordination` -> `dlf_coordination_contain` | `codex_dlf_limited_partnership` |
| `data/narrative/act3/act3_dlf_military_integration.json` | 55 | `act3_dlf_military_integration` -> `dlf_integration_full` | `codex_dlf_military_structure` |
| `data/narrative/act3/act3_dlf_military_integration.json` | 55 | `act3_dlf_military_integration` -> `dlf_integration_full` | `codex_joint_forces_command` |
| `data/narrative/act3/act3_dlf_military_integration.json` | 74 | `act3_dlf_military_integration` -> `dlf_integration_separate_units` | `codex_dlf_auxiliary_structure` |
| `data/narrative/act3/act3_dlf_military_integration.json` | 92 | `act3_dlf_military_integration` -> `dlf_integration_reconnaissance` | `codex_dlf_reconnaissance_corps` |
| `data/narrative/act3/act3_dravenhollow_crackdown.json` | 55 | `act3_dravenhollow_crackdown` -> `dravenhollow_crackdown_continue` | `codex_bni_dravenhollow_operations` |
| `data/narrative/act3/act3_dravenhollow_crackdown.json` | 74 | `act3_dravenhollow_crackdown` -> `dravenhollow_crackdown_calibrate` | `codex_bni_targeted_operations` |
| `data/narrative/act3/act3_dravenhollow_crackdown.json` | 93 | `act3_dravenhollow_crackdown` -> `dravenhollow_crackdown_halt` | `codex_civil_liberties_restoration` |
| `data/narrative/act3/act3_dravenni_autonomy_talks.json` | 52 | `act3_dravenni_autonomy_talks` -> `dravenni_autonomy_federal` | `codex_federalism_debate` |
| `data/narrative/act3/act3_dravenni_autonomy_talks.json` | 52 | `act3_dravenni_autonomy_talks` -> `dravenni_autonomy_federal` | `codex_dravenni_sovereignty` |
| `data/narrative/act3/act3_dravenni_autonomy_talks.json` | 71 | `act3_dravenni_autonomy_talks` -> `dravenni_autonomy_devolution` | `codex_devolution_framework` |
| `data/narrative/act3/act3_dravenni_autonomy_talks.json` | 90 | `act3_dravenni_autonomy_talks` -> `dravenni_autonomy_cultural` | `codex_dravenni_cultural_rights` |
| `data/narrative/act3/act3_dravenni_autonomy_talks.json` | 108 | `act3_dravenni_autonomy_talks` -> `dravenni_autonomy_kaelen_trust` | `codex_kaelen_trust` |
| `data/narrative/act3/act3_dravenni_divided_response.json` | 51 | `act3_dravenni_divided_response` -> `dravenni_divided_fast_track` | `codex_dravenni_language_act` |
| `data/narrative/act3/act3_dravenni_divided_response.json` | 51 | `act3_dravenni_divided_response` -> `dravenni_divided_fast_track` | `codex_executive_order_powers` |
| `data/narrative/act3/act3_dravenni_divided_response.json` | 69 | `act3_dravenni_divided_response` -> `dravenni_divided_incremental` | `codex_dravenni_legislative_timeline` |
| `data/narrative/act3/act3_dravenni_divided_response.json` | 87 | `act3_dravenni_divided_response` -> `dravenni_divided_security` | `codex_dravenni_security_bargain` |
| `data/narrative/act3/act3_dravenni_insurgency.json` | 63, 82, 103 | `act3_dravenni_insurgency` -> `dravenni_insurgency_military` | `codex_dlf_insurgency` |
| `data/narrative/act3/act3_dravenni_insurgency.json` | 63, 82, 103 | `act3_dravenni_insurgency` -> `dravenni_insurgency_negotiate` | `codex_dlf_insurgency` |
| `data/narrative/act3/act3_dravenni_insurgency.json` | 103 | `act3_dravenni_insurgency` -> `dravenni_insurgency_autonomy` | `codex_dravenni_autonomy` |
| `data/narrative/act3/act3_dravenni_insurgency.json` | 63, 82, 103 | `act3_dravenni_insurgency` -> `dravenni_insurgency_autonomy` | `codex_dlf_insurgency` |
| `data/narrative/act3/act3_dravenni_radicalization.json` | 54 | `act3_dravenni_radicalization` -> `dravenni_radicalization_dialogue` | `codex_dlf_moderate_faction` |
| `data/narrative/act3/act3_dravenni_radicalization.json` | 73 | `act3_dravenni_radicalization` -> `dravenni_radicalization_security` | `codex_bni_dravenni_surveillance` |
| `data/narrative/act3/act3_dravenni_radicalization.json` | 92 | `act3_dravenni_radicalization` -> `dravenni_radicalization_aid` | `codex_dravenhollow_economy` |
| `data/narrative/act3/act3_dravenni_radicalization.json` | 109 | `act3_dravenni_radicalization` -> `dravenni_radicalization_kaelen_direct` | `codex_idris_kaelen` |
| `data/narrative/act3/act3_dusek_command_debrief.json` | 64 | `act3_dusek_command_debrief` -> `debrief_acknowledge_command` | `codex_article_four` |
| `data/narrative/act3/act3_dusek_intelligence.json` | 54, 90 | `act3_dusek_intelligence` -> `dusek_intel_expand_surveillance` | `codex_military_conspiracy_network` |
| `data/narrative/act3/act3_dusek_intelligence.json` | 72 | `act3_dusek_intelligence` -> `dusek_intel_targeted_intervention` | `codex_military_personnel_management` |
| `data/narrative/act3/act3_dusek_intelligence.json` | 54, 90 | `act3_dusek_intelligence` -> `dusek_intel_share_trusted` | `codex_military_conspiracy_network` |
| `data/narrative/act3/act3_dusek_loyalty_arc.json` | 54 | `act3_dusek_loyalty_arc` -> `dusek_loyalty_deepen_trust` | `codex_colonel_dusek_personal` |
| `data/narrative/act3/act3_dusek_loyalty_arc.json` | 72 | `act3_dusek_loyalty_arc` -> `dusek_loyalty_professional` | `codex_colonel_dusek_professional` |
| `data/narrative/act3/act3_dusek_loyalty_arc.json` | 90 | `act3_dusek_loyalty_arc` -> `dusek_loyalty_test` | `codex_military_intelligence_operations` |
| `data/narrative/act3/act3_face_to_face_brenner.json` | 51 | `act3_face_to_face_brenner` -> `face_appeal_patriotism` | `codex_brenner_service_record` |
| `data/narrative/act3/act3_face_to_face_brenner.json` | 51, 92 | `act3_face_to_face_brenner` -> `face_appeal_patriotism` | `codex_general_staff_building` |
| `data/narrative/act3/act3_face_to_face_brenner.json` | 72 | `act3_face_to_face_brenner` -> `face_threaten_legal` | `codex_military_deployment_act` |
| `data/narrative/act3/act3_face_to_face_brenner.json` | 72 | `act3_face_to_face_brenner` -> `face_threaten_legal` | `codex_constitutional_security_provisions` |
| `data/narrative/act3/act3_face_to_face_brenner.json` | 51, 92 | `act3_face_to_face_brenner` -> `face_honorable_compromise` | `codex_general_staff_building` |
| `data/narrative/act3/act3_face_to_face_brenner.json` | 92 | `act3_face_to_face_brenner` -> `face_honorable_compromise` | `codex_crisis_negotiation` |
| `data/narrative/act3/act3_government_in_exile.json` | 51 | `act3_government_in_exile` -> `exile_international_sanctions` | `codex_government_exile_doctrine` |
| `data/narrative/act3/act3_government_in_exile.json` | 51 | `act3_government_in_exile` -> `exile_international_sanctions` | `codex_international_sanctions` |
| `data/narrative/act3/act3_government_in_exile.json` | 71 | `act3_government_in_exile` -> `exile_loyalist_coordination` | `codex_loyalist_network` |
| `data/narrative/act3/act3_government_in_exile.json` | 71 | `act3_government_in_exile` -> `exile_loyalist_coordination` | `codex_covert_communication` |
| `data/narrative/act3/act3_government_in_exile.json` | 91 | `act3_government_in_exile` -> `exile_military_return_prep` | `codex_military_restoration_options` |
| `data/narrative/act3/act3_government_in_exile.json` | 91 | `act3_government_in_exile` -> `exile_military_return_prep` | `codex_junta_order_of_battle` |
| `data/narrative/act3/act3_halvekist_legal_war.json` | 59, 77 | `act3_halvekist_legal_war` -> `halvekist_legal_war_escalate` | `codex_independent_prosecutor` |
| `data/narrative/act3/act3_halvekist_legal_war.json` | 59, 77 | `act3_halvekist_legal_war` -> `halvekist_legal_war_mediate` | `codex_independent_prosecutor` |
| `data/narrative/act3/act3_ima_compliance_year.json` | 56 | `act3_ima_compliance_year` -> `ima_compliance_stay_course` | `codex_ima_austerity_governance` |
| `data/narrative/act3/act3_ima_compliance_year.json` | 75 | `act3_ima_compliance_year` -> `ima_compliance_safety_net` | `codex_social_safety_net` |
| `data/narrative/act3/act3_ima_compliance_year.json` | 94 | `act3_ima_compliance_year` -> `ima_compliance_emergency_modify` | `codex_executive_authority_economic` |
| `data/narrative/act3/act3_ima_conditionality.json` | 56 | `act3_ima_conditionality` -> `ima_conditions_implement_fully` | `codex_ima_structural_adjustment` |
| `data/narrative/act3/act3_ima_conditionality.json` | 75 | `act3_ima_conditionality` -> `ima_conditions_negotiate_timeline` | `codex_ima_negotiation` |
| `data/narrative/act3/act3_ima_conditionality.json` | 94 | `act3_ima_conditionality` -> `ima_conditions_blame_publicly` | `codex_ima_public_narrative` |
| `data/narrative/act3/act3_ima_negotiation.json` | 51, 70, 89 | `act3_ima_negotiation` -> `ima_negotiation_accept` | `codex_ima_negotiation_tactics` |
| `data/narrative/act3/act3_ima_negotiation.json` | 51, 70, 89 | `act3_ima_negotiation` -> `ima_negotiation_push_further` | `codex_ima_negotiation_tactics` |
| `data/narrative/act3/act3_ima_negotiation.json` | 70 | `act3_ima_negotiation` -> `ima_negotiation_push_further` | `codex_press_freedom_ima` |
| `data/narrative/act3/act3_ima_negotiation.json` | 51, 70, 89 | `act3_ima_negotiation` -> `ima_negotiation_leverage_threat` | `codex_ima_negotiation_tactics` |
| `data/narrative/act3/act3_ima_negotiation.json` | 89 | `act3_ima_negotiation` -> `ima_negotiation_leverage_threat` | `codex_orythian_alternative` |
| `data/narrative/act3/act3_international_forum_session.json` | 61 | `act3_international_forum_session` -> `forum_binding_guarantees` | `codex_forum_charter_article_17` |
| `data/narrative/act3/act3_international_forum_session.json` | 61 | `act3_international_forum_session` -> `forum_binding_guarantees` | `codex_collective_security_mechanism` |
| `data/narrative/act3/act3_international_forum_session.json` | 80 | `act3_international_forum_session` -> `forum_nonbinding_condemnation` | `codex_forum_resolution_procedure` |
| `data/narrative/act3/act3_international_forum_session.json` | 80 | `act3_international_forum_session` -> `forum_nonbinding_condemnation` | `codex_nonbinding_resolutions_precedent` |
| `data/narrative/act3/act3_international_forum_session.json` | 99 | `act3_international_forum_session` -> `forum_buy_time_military` | `codex_forum_fact_finding` |
| `data/narrative/act3/act3_international_forum_session.json` | 99 | `act3_international_forum_session` -> `forum_buy_time_military` | `codex_diplomatic_stalling_technique` |
| `data/narrative/act3/act3_judicial_independence.json` | 57 | `act3_judicial_independence` -> `judicial_independence_accept_ruling` | `codex_judicial_review` |
| `data/narrative/act3/act3_judicial_independence.json` | 92 | `act3_judicial_independence` -> `judicial_independence_preempt_repeal` | `codex_legislative_reform` |
| `data/narrative/act3/act3_kaelen_response.json` | 54 | `act3_kaelen_response` -> `kaelen_response_commit` | `codex_kaelen_personal_trust` |
| `data/narrative/act3/act3_kaelen_response.json` | 71 | `act3_kaelen_response` -> `kaelen_response_honest` | `codex_kaelen_honesty` |
| `data/narrative/act3/act3_kaelen_response.json` | 89 | `act3_kaelen_response` -> `kaelen_response_cautious` | `codex_kaelen_cautious_trust` |
| `data/narrative/act3/act3_khaled_coalition.json` | 57, 76, 96 | `act3_khaled_coalition` -> `khaled_embrace_platform` | `codex_workers_coalition` |
| `data/narrative/act3/act3_khaled_coalition.json` | 57, 114 | `act3_khaled_coalition` -> `khaled_embrace_platform` | `codex_soraya_khaled` |
| `data/narrative/act3/act3_khaled_coalition.json` | 57, 76, 96 | `act3_khaled_coalition` -> `khaled_negotiate_cooperation` | `codex_workers_coalition` |
| `data/narrative/act3/act3_khaled_coalition.json` | 57, 76, 96 | `act3_khaled_coalition` -> `khaled_arms_length` | `codex_workers_coalition` |
| `data/narrative/act3/act3_khaled_coalition.json` | 57, 114 | `act3_khaled_coalition` -> `khaled_personal_appeal` | `codex_soraya_khaled` |
| `data/narrative/act3/act3_kolvar_legal_challenge.json` | 59, 77, 95 | `act3_kolvar_legal_challenge` -> `kolvar_challenge_defend_firmly` | `codex_electoral_commission` |
| `data/narrative/act3/act3_kolvar_legal_challenge.json` | 59, 77, 95 | `act3_kolvar_legal_challenge` -> `kolvar_challenge_engage_commission` | `codex_electoral_commission` |
| `data/narrative/act3/act3_kolvar_legal_challenge.json` | 59, 77, 95 | `act3_kolvar_legal_challenge` -> `kolvar_challenge_seek_mediation` | `codex_electoral_commission` |
| `data/narrative/act3/act3_kolvar_negotiation.json` | 55 | `act3_kolvar_negotiation` -> `kolvar_negotiation_substantive_concessions` | `codex_kolvar_accommodation` |
| `data/narrative/act3/act3_kolvar_negotiation.json` | 74 | `act3_kolvar_negotiation` -> `kolvar_negotiation_bypass_threat` | `codex_emergency_constitutional_powers` |
| `data/narrative/act3/act3_kolvar_negotiation.json` | 93 | `act3_kolvar_negotiation` -> `kolvar_negotiation_genuine_common_ground` | `codex_kolvar_institutionalist` |
| `data/narrative/act3/act3_kolvar_negotiation.json` | 93 | `act3_kolvar_negotiation` -> `kolvar_negotiation_genuine_common_ground` | `codex_constitutional_alliance` |
| `data/narrative/act3/act3_legal_standoff.json` | 51 | `act3_legal_standoff` -> `legal_standoff_proceed_anyway` | `codex_legal_challenge_multifront` |
| `data/narrative/act3/act3_legal_standoff.json` | 70 | `act3_legal_standoff` -> `legal_standoff_supreme_court` | `codex_supreme_court_referendum` |
| `data/narrative/act3/act3_legal_standoff.json` | 89 | `act3_legal_standoff` -> `legal_standoff_negotiate_amendments` | `codex_constitutional_compromise` |
| `data/narrative/act3/act3_leverage_operation.json` | 50 | `act3_leverage_operation` -> `leverage_aggressive` | `codex_bni_leverage_operations` |
| `data/narrative/act3/act3_leverage_operation.json` | 68 | `act3_leverage_operation` -> `leverage_selective` | `codex_bni_targeted_operations` |
| `data/narrative/act3/act3_leverage_operation.json` | 87 | `act3_leverage_operation` -> `leverage_reconsider` | `codex_bni_archival_reform` |
| `data/narrative/act3/act3_loyalist_counter_deploy.json` | 52 | `act3_loyalist_counter_deploy` -> `counter_deploy_secure_capital` | `codex_government_district` |
| `data/narrative/act3/act3_loyalist_counter_deploy.json` | 52 | `act3_loyalist_counter_deploy` -> `counter_deploy_secure_capital` | `codex_first_infantry_division` |
| `data/narrative/act3/act3_loyalist_counter_deploy.json` | 72 | `act3_loyalist_counter_deploy` -> `counter_deploy_negotiate_units` | `codex_unit_commanders` |
| `data/narrative/act3/act3_loyalist_counter_deploy.json` | 72 | `act3_loyalist_counter_deploy` -> `counter_deploy_negotiate_units` | `codex_military_oath_enforcement` |
| `data/narrative/act3/act3_loyalist_counter_deploy.json` | 92 | `act3_loyalist_counter_deploy` -> `counter_deploy_protect_infrastructure` | `codex_critical_infrastructure` |
| `data/narrative/act3/act3_loyalist_counter_deploy.json` | 92 | `act3_loyalist_counter_deploy` -> `counter_deploy_protect_infrastructure` | `codex_ashenmere_utilities` |
| `data/narrative/act3/act3_military_democracy_bond.json` | 47 | `act3_military_democracy_bond` -> `bond_institutionalize` | `codex_democratic_military_center` |
| `data/narrative/act3/act3_military_democracy_bond.json` | 47 | `act3_military_democracy_bond` -> `bond_institutionalize` | `codex_officer_training_curriculum` |
| `data/narrative/act3/act3_military_democracy_bond.json` | 63 | `act3_military_democracy_bond` -> `bond_respect_organic` | `codex_organic_institutional_change` |
| `data/narrative/act3/act3_military_democracy_bond.json` | 81 | `act3_military_democracy_bond` -> `bond_leverage_morale` | `codex_military_morale` |
| `data/narrative/act3/act3_military_democracy_bond.json` | 81 | `act3_military_democracy_bond` -> `bond_leverage_morale` | `codex_defensive_readiness` |
| `data/narrative/act3/act3_military_deployment.json` | 46 | `act3_military_deployment` -> `deployment_defensive_holding` | `codex_defensive_doctrine` |
| `data/narrative/act3/act3_military_deployment.json` | 46 | `act3_military_deployment` -> `deployment_defensive_holding` | `codex_gravenmark_defensive_line` |
| `data/narrative/act3/act3_military_deployment.json` | 65 | `act3_military_deployment` -> `deployment_forward_deterrence` | `codex_deterrence_doctrine` |
| `data/narrative/act3/act3_military_deployment.json` | 65 | `act3_military_deployment` -> `deployment_forward_deterrence` | `codex_forward_deployment` |
| `data/narrative/act3/act3_military_deployment.json` | 85 | `act3_military_deployment` -> `deployment_preemptive_option` | `codex_preemptive_strike_doctrine` |
| `data/narrative/act3/act3_military_deployment.json` | 85 | `act3_military_deployment` -> `deployment_preemptive_option` | `codex_deep_strike_capability` |
| `data/narrative/act3/act3_military_resolve_hardened.json` | 51 | `act3_military_resolve_hardened` -> `resolve_democratic_discipline` | `codex_laws_of_armed_conflict` |
| `data/narrative/act3/act3_military_resolve_hardened.json` | 51 | `act3_military_resolve_hardened` -> `resolve_democratic_discipline` | `codex_democratic_military_doctrine` |
| `data/narrative/act3/act3_military_resolve_hardened.json` | 70 | `act3_military_resolve_hardened` -> `resolve_maximum_readiness` | `codex_combat_readiness_doctrine` |
| `data/narrative/act3/act3_military_resolve_hardened.json` | 70 | `act3_military_resolve_hardened` -> `resolve_maximum_readiness` | `codex_tyvaren_threat_assessment` |
| `data/narrative/act3/act3_military_resolve_hardened.json` | 89 | `act3_military_resolve_hardened` -> `resolve_balanced_approach` | `codex_integrated_training_doctrine` |
| `data/narrative/act3/act3_minority_refugee_integration.json` | 49, 64 | `act3_minority_refugee_integration` -> `integration_full` | `codex_refugee_integration` |
| `data/narrative/act3/act3_minority_refugee_integration.json` | 49, 64 | `act3_minority_refugee_integration` -> `integration_pilot` | `codex_refugee_integration` |
| `data/narrative/act3/act3_minority_veteran_recognition.json` | 48, 62 | `act3_minority_veteran_recognition` -> `veteran_honor_full` | `codex_dravenni_veterans` |
| `data/narrative/act3/act3_minority_veteran_recognition.json` | 48 | `act3_minority_veteran_recognition` -> `veteran_honor_full` | `codex_military_history` |
| `data/narrative/act3/act3_minority_veteran_recognition.json` | 48, 62 | `act3_minority_veteran_recognition` -> `veteran_honor_quiet` | `codex_dravenni_veterans` |
| `data/narrative/act3/act3_nadia_investigation_continues.json` | 51, 70, 89 | `act3_nadia_investigation_continues` -> `nadia_investigation_full_access` | `codex_nadia_voss` |
| `data/narrative/act3/act3_nadia_investigation_continues.json` | 51 | `act3_nadia_investigation_continues` -> `nadia_investigation_full_access` | `codex_investigative_journalism` |
| `data/narrative/act3/act3_nadia_investigation_continues.json` | 51, 70, 89 | `act3_nadia_investigation_continues` -> `nadia_investigation_maintain_limits` | `codex_nadia_voss` |
| `data/narrative/act3/act3_nadia_investigation_continues.json` | 70 | `act3_nadia_investigation_continues` -> `nadia_investigation_maintain_limits` | `codex_managed_disclosure` |
| `data/narrative/act3/act3_nadia_investigation_continues.json` | 51, 70, 89 | `act3_nadia_investigation_continues` -> `nadia_investigation_restrict` | `codex_nadia_voss` |
| `data/narrative/act3/act3_nadia_investigation_continues.json` | 89 | `act3_nadia_investigation_continues` -> `nadia_investigation_restrict` | `codex_press_restrictions` |
| `data/narrative/act3/act3_nationalist_backlash.json` | 55, 74, 93, 111 | `act3_nationalist_backlash` -> `nationalist_backlash_condemnation` | `codex_ironborn_movement` |
| `data/narrative/act3/act3_nationalist_backlash.json` | 55, 74, 93, 111 | `act3_nationalist_backlash` -> `nationalist_backlash_tolerate` | `codex_ironborn_movement` |
| `data/narrative/act3/act3_nationalist_backlash.json` | 55, 74, 93, 111 | `act3_nationalist_backlash` -> `nationalist_backlash_crackdown` | `codex_ironborn_movement` |
| `data/narrative/act3/act3_nationalist_backlash.json` | 93 | `act3_nationalist_backlash` -> `nationalist_backlash_crackdown` | `codex_bni_domestic_surveillance` |
| `data/narrative/act3/act3_nationalist_backlash.json` | 55, 74, 93, 111 | `act3_nationalist_backlash` -> `nationalist_backlash_engage_leaders` | `codex_ironborn_movement` |
| `data/narrative/act3/act3_national_address_war.json` | 48, 71, 93 | `act3_national_address_war` -> `national_address_honest_somber` | `codex_chancellors_war_address` |
| `data/narrative/act3/act3_national_address_war.json` | 48 | `act3_national_address_war` -> `national_address_honest_somber` | `codex_veltrian_resilience` |
| `data/narrative/act3/act3_national_address_war.json` | 48, 71, 93 | `act3_national_address_war` -> `national_address_defiant_inspiring` | `codex_chancellors_war_address` |
| `data/narrative/act3/act3_national_address_war.json` | 71 | `act3_national_address_war` -> `national_address_defiant_inspiring` | `codex_defiance_speech` |
| `data/narrative/act3/act3_national_address_war.json` | 48, 71, 93 | `act3_national_address_war` -> `national_address_pragmatic_unifying` | `codex_chancellors_war_address` |
| `data/narrative/act3/act3_national_address_war.json` | 93 | `act3_national_address_war` -> `national_address_pragmatic_unifying` | `codex_total_national_effort` |
| `data/narrative/act3/act3_new_cabinet_figures.json` | 50, 68, 87 | `act3_new_cabinet_figures` -> `new_cabinet_empower` | `codex_cabinet_reshuffle` |
| `data/narrative/act3/act3_new_cabinet_figures.json` | 50, 68, 87 | `act3_new_cabinet_figures` -> `new_cabinet_balance` | `codex_cabinet_reshuffle` |
| `data/narrative/act3/act3_new_cabinet_figures.json` | 50, 68, 87 | `act3_new_cabinet_figures` -> `new_cabinet_short_leash` | `codex_cabinet_reshuffle` |
| `data/narrative/act3/act3_no_confidence_fallen.json` | 51, 68, 88 | `act3_no_confidence_fallen` -> `no_confidence_fallen_resign` | `codex_no_confidence` |
| `data/narrative/act3/act3_no_confidence_fallen.json` | 51, 68, 88 | `act3_no_confidence_fallen` -> `no_confidence_fallen_snap_election` | `codex_no_confidence` |
| `data/narrative/act3/act3_no_confidence_fallen.json` | 51, 68, 88 | `act3_no_confidence_fallen` -> `no_confidence_fallen_emergency` | `codex_no_confidence` |
| `data/narrative/act3/act3_no_confidence_fallen.json` | 88 | `act3_no_confidence_fallen` -> `no_confidence_fallen_emergency` | `codex_article_22_emergency` |
| `data/narrative/act3/act3_opposition_management.json` | 57 | `act3_opposition_management` -> `opposition_offer_committee_chairs` | `codex_parliamentary_oversight` |
| `data/narrative/act3/act3_orythian_advisor_friction.json` | 50 | `act3_orythian_advisor_friction` -> `orythian_advisors_boundaries` | `codex_orythian_advisory_mandate` |
| `data/narrative/act3/act3_orythian_advisor_friction.json` | 69 | `act3_orythian_advisor_friction` -> `orythian_advisors_accept` | `codex_orythian_integration` |
| `data/narrative/act3/act3_orythian_advisor_friction.json` | 87 | `act3_orythian_advisor_friction` -> `orythian_advisors_reduce` | `codex_orythian_diplomatic_relations` |
| `data/narrative/act3/act3_port_bonds_return_blind.json` | 62, 103 | `act3_port_bonds_return_blind` -> `blind_trust_continue` | `codex_blind_trust` |
| `data/narrative/act3/act3_port_bonds_return_blind.json` | 62, 103 | `act3_port_bonds_return_blind` -> `blind_trust_disclose_voluntarily` | `codex_blind_trust` |
| `data/narrative/act3/act3_press_freedom_crackdown.json` | 51, 70, 89 | `act3_press_freedom_crackdown` -> `press_crackdown_repeal_section` | `codex_national_stability_act` |
| `data/narrative/act3/act3_press_freedom_crackdown.json` | 51 | `act3_press_freedom_crackdown` -> `press_crackdown_repeal_section` | `codex_press_freedom_defense` |
| `data/narrative/act3/act3_press_freedom_crackdown.json` | 51, 70, 89 | `act3_press_freedom_crackdown` -> `press_crackdown_narrow_application` | `codex_national_stability_act` |
| `data/narrative/act3/act3_press_freedom_crackdown.json` | 51, 70, 89 | `act3_press_freedom_crackdown` -> `press_crackdown_enforce` | `codex_national_stability_act` |
| `data/narrative/act3/act3_press_freedom_crackdown.json` | 89 | `act3_press_freedom_crackdown` -> `press_crackdown_enforce` | `codex_press_suppression` |
| `data/narrative/act3/act3_public_moment.json` | 45 | `act3_public_moment` -> `public_constitutional_frame` | `codex_constitutional_crisis_resolution` |
| `data/narrative/act3/act3_public_moment.json` | 63 | `act3_public_moment` -> `public_unity_frame` | `codex_national_unity_doctrine` |
| `data/narrative/act3/act3_public_moment.json` | 83 | `act3_public_moment` -> `public_democratic_warning` | `codex_democratic_resilience` |
| `data/narrative/act3/act3_public_moment.json` | 83 | `act3_public_moment` -> `public_democratic_warning` | `codex_coup_attempt_public_record` |
| `data/narrative/act3/act3_public_reckoning.json` | 51, 70, 89 | `act3_public_reckoning` -> `public_reckoning_case_by_case` | `codex_halvek_collaboration` |
| `data/narrative/act3/act3_public_reckoning.json` | 51 | `act3_public_reckoning` -> `public_reckoning_case_by_case` | `codex_transitional_justice` |
| `data/narrative/act3/act3_public_reckoning.json` | 51, 70, 89 | `act3_public_reckoning` -> `public_reckoning_clean_sweep` | `codex_halvek_collaboration` |
| `data/narrative/act3/act3_public_reckoning.json` | 70 | `act3_public_reckoning` -> `public_reckoning_clean_sweep` | `codex_cabinet_purge` |
| `data/narrative/act3/act3_public_reckoning.json` | 51, 70, 89 | `act3_public_reckoning` -> `public_reckoning_proportional_process` | `codex_halvek_collaboration` |
| `data/narrative/act3/act3_public_reckoning.json` | 89 | `act3_public_reckoning` -> `public_reckoning_proportional_process` | `codex_transitional_justice_commission` |
| `data/narrative/act3/act3_reform_by_decree.json` | 62, 81 | `act3_reform_by_decree` -> `reform_by_decree_narrow` | `codex_halvek_constitution_article47` |
| `data/narrative/act3/act3_reform_by_decree.json` | 62, 81 | `act3_reform_by_decree` -> `reform_by_decree_broad` | `codex_halvek_constitution_article47` |
| `data/narrative/act3/act3_religious_church_halvek_files.json` | 49, 79 | `act3_religious_church_halvek_files` -> `halvek_files_publish` | `codex_church_history` |
| `data/narrative/act3/act3_religious_church_halvek_files.json` | 49 | `act3_religious_church_halvek_files` -> `halvek_files_publish` | `codex_bni_intelligence` |
| `data/narrative/act3/act3_religious_church_halvek_files.json` | 49, 79 | `act3_religious_church_halvek_files` -> `halvek_files_resignation` | `codex_church_history` |
| `data/narrative/act3/act3_secret_mobilization_consequences.json` | 55 | `act3_secret_mobilization_consequences` -> `secretmob_confess_nation` | `codex_protocol_seventeen_revealed` |
| `data/narrative/act3/act3_secret_mobilization_consequences.json` | 55 | `act3_secret_mobilization_consequences` -> `secretmob_confess_nation` | `codex_chancellery_transparency` |
| `data/narrative/act3/act3_secret_mobilization_consequences.json` | 76 | `act3_secret_mobilization_consequences` -> `secretmob_deny_discredit` | `codex_mobilization_cover_story` |
| `data/narrative/act3/act3_secret_mobilization_consequences.json` | 76 | `act3_secret_mobilization_consequences` -> `secretmob_deny_discredit` | `codex_press_management` |
| `data/narrative/act3/act3_secret_mobilization_consequences.json` | 96 | `act3_secret_mobilization_consequences` -> `secretmob_pivot_open` | `codex_two_phase_mobilization` |
| `data/narrative/act3/act3_secret_mobilization_consequences.json` | 96 | `act3_secret_mobilization_consequences` -> `secretmob_pivot_open` | `codex_strategic_communication` |
| `data/narrative/act3/act3_ssd_report_wk33.json` | 87, 133, 184 | `act3_ssd_report_wk33` -> `ssd_administrative_transfer` | `codex_provincial_infiltration` |
| `data/narrative/act3/act3_ssd_report_wk33.json` | 87, 133, 184 | `act3_ssd_report_wk33` -> `ssd_legal_prosecution` | `codex_provincial_infiltration` |
| `data/narrative/act3/act3_ssd_report_wk33.json` | 87, 133, 184 | `act3_ssd_report_wk33` -> `ssd_operational_neutralization` | `codex_provincial_infiltration` |
| `data/narrative/act3/act3_ssd_report_wk44.json` | 69, 91, 113 | `act3_ssd_report_wk44` -> `ssd_authorize_night_of_justice` | `codex_night_of_justice` |
| `data/narrative/act3/act3_ssd_report_wk44.json` | 69, 91, 113 | `act3_ssd_report_wk44` -> `ssd_selective_action` | `codex_night_of_justice` |
| `data/narrative/act3/act3_ssd_report_wk44.json` | 69, 91, 113 | `act3_ssd_report_wk44` -> `ssd_refuse_dismantle` | `codex_night_of_justice` |
| `data/narrative/act3/act3_stellamere_broadcast.json` | 54, 72, 90 | `act3_stellamere_broadcast` -> `stellamere_broadcast_defiance` | `codex_government_exile_doctrine` |
| `data/narrative/act3/act3_stellamere_broadcast.json` | 54 | `act3_stellamere_broadcast` -> `stellamere_broadcast_defiance` | `codex_shortwave_resistance` |
| `data/narrative/act3/act3_stellamere_broadcast.json` | 54, 72, 90 | `act3_stellamere_broadcast` -> `stellamere_broadcast_diplomatic` | `codex_government_exile_doctrine` |
| `data/narrative/act3/act3_stellamere_broadcast.json` | 54, 72, 90 | `act3_stellamere_broadcast` -> `stellamere_broadcast_personal` | `codex_government_exile_doctrine` |
| `data/narrative/act3/act3_superpower_pressure.json` | 51 | `act3_superpower_pressure` -> `superpower_align_orythia` | `codex_orythian_alliance` |
| `data/narrative/act3/act3_superpower_pressure.json` | 51 | `act3_superpower_pressure` -> `superpower_align_orythia` | `codex_mutual_defense_treaty` |
| `data/narrative/act3/act3_superpower_pressure.json` | 71 | `act3_superpower_pressure` -> `superpower_align_arcturia` | `codex_arcturian_commonwealth` |
| `data/narrative/act3/act3_superpower_pressure.json` | 71 | `act3_superpower_pressure` -> `superpower_align_arcturia` | `codex_security_council_associate` |
| `data/narrative/act3/act3_superpower_pressure.json` | 93 | `act3_superpower_pressure` -> `superpower_neutral_reject_both` | `codex_armed_neutrality_doctrine` |
| `data/narrative/act3/act3_superpower_pressure.json` | 93 | `act3_superpower_pressure` -> `superpower_neutral_reject_both` | `codex_veltrian_sovereignty` |
| `data/narrative/act3/act3_total_war_society.json` | 58 | `act3_total_war_society` -> `totalwar_maintain_full_measures` | `codex_war_measures_act` |
| `data/narrative/act3/act3_total_war_society.json` | 58 | `act3_total_war_society` -> `totalwar_maintain_full_measures` | `codex_total_war_doctrine` |
| `data/narrative/act3/act3_total_war_society.json` | 79 | `act3_total_war_society` -> `totalwar_ease_civilian_restrictions` | `codex_emergency_powers_review` |
| `data/narrative/act3/act3_total_war_society.json` | 79 | `act3_total_war_society` -> `totalwar_ease_civilian_restrictions` | `codex_democratic_war_governance` |
| `data/narrative/act3/act3_total_war_society.json` | 99 | `act3_total_war_society` -> `totalwar_focus_morale_unity` | `codex_national_morale_initiative` |
| `data/narrative/act3/act3_total_war_society.json` | 99 | `act3_total_war_society` -> `totalwar_focus_morale_unity` | `codex_civil_service_corps` |
| `data/narrative/act3/act3_total_war_society.json` | 99 | `act3_total_war_society` -> `totalwar_focus_morale_unity` | `codex_war_bonds_program` |
| `data/narrative/act3/act3_total_war_society.json` | 117 | `act3_total_war_society` -> `totalwar_church_resistance_mgmt` | `codex_church_state_relations_wartime` |
| `data/narrative/act3/act3_total_war_society.json` | 117 | `act3_total_war_society` -> `totalwar_church_resistance_mgmt` | `codex_archbishop_serrano` |
| `data/narrative/act3/act3_treaty_drafting.json` | 52, 72 | `act3_treaty_drafting` -> `treaty_push_back_hard` | `codex_treaty_negotiation` |
| `data/narrative/act3/act3_treaty_drafting.json` | 52 | `act3_treaty_drafting` -> `treaty_push_back_hard` | `codex_constitutional_incompatibility` |
| `data/narrative/act3/act3_treaty_drafting.json` | 52, 72 | `act3_treaty_drafting` -> `treaty_accept_cosmetic` | `codex_treaty_negotiation` |
| `data/narrative/act3/act3_treaty_drafting.json` | 72 | `act3_treaty_drafting` -> `treaty_accept_cosmetic` | `codex_diplomatic_face_saving` |
| `data/narrative/act3/act3_treaty_drafting.json` | 94 | `act3_treaty_drafting` -> `treaty_walk_away` | `codex_treaty_rejection` |
| `data/narrative/act3/act3_treaty_drafting.json` | 94 | `act3_treaty_drafting` -> `treaty_walk_away` | `codex_parliamentary_war_mandate` |
| `data/narrative/act3/act3_tyvaren_border_skirmish.json` | 60, 79, 99, 116 | `act3_tyvaren_border_skirmish` -> `skirmish_escalate_militarily` | `codex_crossing_point_seven` |
| `data/narrative/act3/act3_tyvaren_border_skirmish.json` | 60 | `act3_tyvaren_border_skirmish` -> `skirmish_escalate_militarily` | `codex_tyvaren_special_reconnaissance` |
| `data/narrative/act3/act3_tyvaren_border_skirmish.json` | 60, 79, 99, 116 | `act3_tyvaren_border_skirmish` -> `skirmish_diplomatic_deescalation` | `codex_crossing_point_seven` |
| `data/narrative/act3/act3_tyvaren_border_skirmish.json` | 79 | `act3_tyvaren_border_skirmish` -> `skirmish_diplomatic_deescalation` | `codex_veltrian_border_protocol` |
| `data/narrative/act3/act3_tyvaren_border_skirmish.json` | 60, 79, 99, 116 | `act3_tyvaren_border_skirmish` -> `skirmish_international_intervention` | `codex_crossing_point_seven` |
| `data/narrative/act3/act3_tyvaren_border_skirmish.json` | 99 | `act3_tyvaren_border_skirmish` -> `skirmish_international_intervention` | `codex_stellamere_conventions` |
| `data/narrative/act3/act3_tyvaren_border_skirmish.json` | 99 | `act3_tyvaren_border_skirmish` -> `skirmish_international_intervention` | `codex_international_border_law` |
| `data/narrative/act3/act3_tyvaren_border_skirmish.json` | 60, 79, 99, 116 | `act3_tyvaren_border_skirmish` -> `skirmish_personal_mourning` | `codex_crossing_point_seven` |
| `data/narrative/act3/act3_tyvaren_border_skirmish.json` | 116 | `act3_tyvaren_border_skirmish` -> `skirmish_personal_mourning` | `codex_veltrian_military_families` |
| `data/narrative/act3/act3_tyvaren_deterred.json` | 51 | `act3_tyvaren_deterred` -> `tyvaren_deterred_defenses` | `codex_gravenmark_defense_line` |
| `data/narrative/act3/act3_tyvaren_deterred.json` | 70 | `act3_tyvaren_deterred` -> `tyvaren_deterred_diplomacy` | `codex_stellamere_diplomacy` |
| `data/narrative/act3/act3_tyvaren_deterred.json` | 89 | `act3_tyvaren_deterred` -> `tyvaren_deterred_forward` | `codex_forward_patrol_doctrine` |
| `data/narrative/act3/act3_tyvaren_diplomatic_followup.json` | 59, 78 | `act3_tyvaren_diplomatic_followup` -> `diplofollow_accept_preconditions` | `codex_strevna_preconditions` |
| `data/narrative/act3/act3_tyvaren_diplomatic_followup.json` | 59 | `act3_tyvaren_diplomatic_followup` -> `diplofollow_accept_preconditions` | `codex_tyvaren_diplomatic_technique` |
| `data/narrative/act3/act3_tyvaren_diplomatic_followup.json` | 59, 78 | `act3_tyvaren_diplomatic_followup` -> `diplofollow_reject_preconditions` | `codex_strevna_preconditions` |
| `data/narrative/act3/act3_tyvaren_diplomatic_followup.json` | 78 | `act3_tyvaren_diplomatic_followup` -> `diplofollow_reject_preconditions` | `codex_veltrian_sovereignty_doctrine` |
| `data/narrative/act3/act3_tyvaren_diplomatic_followup.json` | 99 | `act3_tyvaren_diplomatic_followup` -> `diplofollow_superpower_mediators` | `codex_forum_mediation` |
| `data/narrative/act3/act3_tyvaren_diplomatic_followup.json` | 99 | `act3_tyvaren_diplomatic_followup` -> `diplofollow_superpower_mediators` | `codex_diplomatic_mediation_protocol` |
| `data/narrative/act3/act3_vael_block_wealth_tax.json` | 60 | `act3_vael_block_wealth_tax` -> `vael_wealth_tax_block` | `codex_vael_alliance` |
| `data/narrative/act3/act3_vael_block_wealth_tax.json` | 78 | `act3_vael_block_wealth_tax` -> `vael_wealth_tax_compromise` | `codex_vael_negotiation` |
| `data/narrative/act3/act3_vael_minister_demand.json` | 68 | `act3_vael_minister_demand` -> `vael_minister_appoint` | `codex_vael_alliance` |
| `data/narrative/act3/act3_vael_minister_demand.json` | 105 | `act3_vael_minister_demand` -> `vael_minister_counter` | `codex_vael_negotiation` |
| `data/narrative/act3/act3_volkov_patience_expires.json` | 54 | `act3_volkov_patience_expires` -> `volkov_accept_terms` | `codex_gravenmark_concession` |
| `data/narrative/act3/act3_volkov_patience_expires.json` | 54 | `act3_volkov_patience_expires` -> `volkov_accept_terms` | `codex_tyvaren_treaty_terms` |
| `data/narrative/act3/act3_volkov_patience_expires.json` | 77 | `act3_volkov_patience_expires` -> `volkov_reject_prepare_war` | `codex_declaration_war` |
| `data/narrative/act3/act3_volkov_patience_expires.json` | 77 | `act3_volkov_patience_expires` -> `volkov_reject_prepare_war` | `codex_total_national_defense` |
| `data/narrative/act3/act3_volkov_patience_expires.json` | 97 | `act3_volkov_patience_expires` -> `volkov_final_counter_offer` | `codex_last_diplomatic_offer` |
| `data/narrative/act3/act3_volkov_patience_expires.json` | 97 | `act3_volkov_patience_expires` -> `volkov_final_counter_offer` | `codex_demilitarized_zone_proposal` |
| `data/narrative/act3/act3_vostane_media_war.json` | 49 | `act3_vostane_media_war` -> `vostane_media_engage_publicly` | `codex_vostane_economic_critique` |
| `data/narrative/act3/act3_vostane_media_war.json` | 68 | `act3_vostane_media_war` -> `vostane_media_undermine` | `codex_vostane_halvek_tenure` |
| `data/narrative/act3/act3_vostane_media_war.json` | 86 | `act3_vostane_media_war` -> `vostane_media_offer_path` | `codex_vostane_reconciliation_attempt` |
| `data/narrative/act3/act3_war_economy.json` | 61 | `act3_war_economy` -> `warecon_state_control` | `codex_state_directed_economy` |
| `data/narrative/act3/act3_war_economy.json` | 61 | `act3_war_economy` -> `warecon_state_control` | `codex_war_production_board` |
| `data/narrative/act3/act3_war_economy.json` | 82 | `act3_war_economy` -> `warecon_worker_protections` | `codex_war_labor_board` |
| `data/narrative/act3/act3_war_economy.json` | 82 | `act3_war_economy` -> `warecon_worker_protections` | `codex_worker_protections_wartime` |
| `data/narrative/act3/act3_war_economy.json` | 103 | `act3_war_economy` -> `warecon_incentivized_private` | `codex_war_contracts_system` |
| `data/narrative/act3/act3_war_economy.json` | 103 | `act3_war_economy` -> `warecon_incentivized_private` | `codex_industrial_conversion_incentives` |
| `data/narrative/act3/act3_week32_tyvaren_ultimatum.json` | 87, 108, 135, 161, 195, 225 | `act3_week32_tyvaren_ultimatum` -> `tyvaren_defiant_rejection` | `codex_gravenmark_pass` |
| `data/narrative/act3/act3_week32_tyvaren_ultimatum.json` | 87 | `act3_week32_tyvaren_ultimatum` -> `tyvaren_defiant_rejection` | `codex_tyvaren_military_doctrine` |
| `data/narrative/act3/act3_week32_tyvaren_ultimatum.json` | 87, 108, 135, 161, 195, 225 | `act3_week32_tyvaren_ultimatum` -> `tyvaren_diplomatic_negotiation` | `codex_gravenmark_pass` |
| `data/narrative/act3/act3_week32_tyvaren_ultimatum.json` | 108 | `act3_week32_tyvaren_ultimatum` -> `tyvaren_diplomatic_negotiation` | `codex_tyvaren_diplomatic_history` |
| `data/narrative/act3/act3_week32_tyvaren_ultimatum.json` | 87, 108, 135, 161, 195, 225 | `act3_week32_tyvaren_ultimatum` -> `tyvaren_international_appeal` | `codex_gravenmark_pass` |
| `data/narrative/act3/act3_week32_tyvaren_ultimatum.json` | 135, 161, 195 | `act3_week32_tyvaren_ultimatum` -> `tyvaren_international_appeal` | `codex_international_forum` |
| `data/narrative/act3/act3_week32_tyvaren_ultimatum.json` | 135, 161, 195 | `act3_week32_tyvaren_ultimatum` -> `tyvaren_international_appeal` | `codex_tyvaren_expansionism` |
| `data/narrative/act3/act3_week32_tyvaren_ultimatum.json` | 87, 108, 135, 161, 195, 225 | `act3_week32_tyvaren_ultimatum` -> `tyvaren_international_appeal_sovarka` | `codex_gravenmark_pass` |
| `data/narrative/act3/act3_week32_tyvaren_ultimatum.json` | 135, 161, 195 | `act3_week32_tyvaren_ultimatum` -> `tyvaren_international_appeal_sovarka` | `codex_international_forum` |
| `data/narrative/act3/act3_week32_tyvaren_ultimatum.json` | 135, 161, 195 | `act3_week32_tyvaren_ultimatum` -> `tyvaren_international_appeal_sovarka` | `codex_tyvaren_expansionism` |
| `data/narrative/act3/act3_week32_tyvaren_ultimatum.json` | 87, 108, 135, 161, 195, 225 | `act3_week32_tyvaren_ultimatum` -> `tyvaren_international_appeal_sovarka_limited` | `codex_gravenmark_pass` |
| `data/narrative/act3/act3_week32_tyvaren_ultimatum.json` | 135, 161, 195 | `act3_week32_tyvaren_ultimatum` -> `tyvaren_international_appeal_sovarka_limited` | `codex_international_forum` |
| `data/narrative/act3/act3_week32_tyvaren_ultimatum.json` | 135, 161, 195 | `act3_week32_tyvaren_ultimatum` -> `tyvaren_international_appeal_sovarka_limited` | `codex_tyvaren_expansionism` |
| `data/narrative/act3/act3_week32_tyvaren_ultimatum.json` | 87, 108, 135, 161, 195, 225 | `act3_week32_tyvaren_ultimatum` -> `tyvaren_secret_mobilization` | `codex_gravenmark_pass` |
| `data/narrative/act3/act3_week32_tyvaren_ultimatum.json` | 225 | `act3_week32_tyvaren_ultimatum` -> `tyvaren_secret_mobilization` | `codex_protocol_seventeen` |
| `data/narrative/act3/act3_week32_tyvaren_ultimatum.json` | 225 | `act3_week32_tyvaren_ultimatum` -> `tyvaren_secret_mobilization` | `codex_tyvaren_border_geography` |
| `data/narrative/act3/act3_week33_diplomatic_negotiation.json` | 72, 92, 114, 136 | `act3_week33_diplomatic_negotiation` -> `diplomacy_counter_proposal` | `codex_strevna_negotiations` |
| `data/narrative/act3/act3_week33_diplomatic_negotiation.json` | 72 | `act3_week33_diplomatic_negotiation` -> `diplomacy_counter_proposal` | `codex_border_security_commission` |
| `data/narrative/act3/act3_week33_diplomatic_negotiation.json` | 72, 92, 114, 136 | `act3_week33_diplomatic_negotiation` -> `diplomacy_buy_time` | `codex_strevna_negotiations` |
| `data/narrative/act3/act3_week33_diplomatic_negotiation.json` | 72, 92, 114, 136 | `act3_week33_diplomatic_negotiation` -> `diplomacy_hard_rejection` | `codex_strevna_negotiations` |
| `data/narrative/act3/act3_week33_diplomatic_negotiation.json` | 114 | `act3_week33_diplomatic_negotiation` -> `diplomacy_hard_rejection` | `codex_veltrian_defensive_doctrine` |
| `data/narrative/act3/act3_week33_diplomatic_negotiation.json` | 72, 92, 114, 136 | `act3_week33_diplomatic_negotiation` -> `diplomacy_conditional_acceptance` | `codex_strevna_negotiations` |
| `data/narrative/act3/act3_week33_diplomatic_negotiation.json` | 136 | `act3_week33_diplomatic_negotiation` -> `diplomacy_conditional_acceptance` | `codex_non_aggression_pact_drafting` |
| `data/narrative/act3/act3_week33_soren_files.json` | 65, 81 | `act3_week33_soren_files` -> `soren_files_acknowledge_personal` | `codex_soren_files` |
| `data/narrative/act3/act3_week33_soren_files.json` | 65, 81 | `act3_week33_soren_files` -> `soren_files_seal_personal` | `codex_soren_files` |
| `data/narrative/act3/act3_week33_war_preparations.json` | 70 | `act3_week33_war_preparations` -> `war_prep_forward_defense` | `codex_forward_defense_doctrine` |
| `data/narrative/act3/act3_week33_war_preparations.json` | 70 | `act3_week33_war_preparations` -> `war_prep_forward_defense` | `codex_gravenmark_garrison` |
| `data/narrative/act3/act3_week33_war_preparations.json` | 95, 144 | `act3_week33_war_preparations` -> `war_prep_defense_in_depth` | `codex_defense_in_depth_doctrine` |
| `data/narrative/act3/act3_week33_war_preparations.json` | 95 | `act3_week33_war_preparations` -> `war_prep_defense_in_depth` | `codex_aldenmoor_line` |
| `data/narrative/act3/act3_week33_war_preparations.json` | 125 | `act3_week33_war_preparations` -> `war_prep_total_mobilization` | `codex_total_mobilization` |
| `data/narrative/act3/act3_week33_war_preparations.json` | 125 | `act3_week33_war_preparations` -> `war_prep_total_mobilization` | `codex_veltrian_reserve_system` |
| `data/narrative/act3/act3_week33_war_preparations.json` | 125 | `act3_week33_war_preparations` -> `war_prep_total_mobilization` | `codex_war_economy_measures` |
| `data/narrative/act3/act3_week33_war_preparations.json` | 95, 144 | `act3_week33_war_preparations` -> `war_prep_delay_diplomatic_cover` | `codex_defense_in_depth_doctrine` |
| `data/narrative/act3/act3_week34_dravenhollow.json` | 73 | `act3_week34_dravenhollow` -> `dravenhollow_dlf_alliance` | `codex_dravenni_language_act` |
| `data/narrative/act3/act3_week34_dravenhollow.json` | 73 | `act3_week34_dravenhollow` -> `dravenhollow_dlf_alliance` | `codex_dlf_military_structure` |
| `data/narrative/act3/act3_week34_dravenhollow.json` | 73 | `act3_week34_dravenhollow` -> `dravenhollow_dlf_alliance` | `codex_dravenhollow_autonomy` |
| `data/narrative/act3/act3_week34_dravenhollow.json` | 99 | `act3_week34_dravenhollow` -> `dravenhollow_limited_partnership` | `codex_dlf_amnesty` |
| `data/narrative/act3/act3_week34_dravenhollow.json` | 99 | `act3_week34_dravenhollow` -> `dravenhollow_limited_partnership` | `codex_dravenni_provincial_status` |
| `data/narrative/act3/act3_week34_dravenhollow.json` | 127 | `act3_week34_dravenhollow` -> `dravenhollow_suppress_separatists` | `codex_bni_dravenhollow_operations` |
| `data/narrative/act3/act3_week34_dravenhollow.json` | 127 | `act3_week34_dravenhollow` -> `dravenhollow_suppress_separatists` | `codex_tyvaren_dravenni_contacts` |
| `data/narrative/act3/act3_week34_dravenhollow.json` | 147 | `act3_week34_dravenhollow` -> `dravenhollow_appeal_patriotism` | `codex_dravenni_resistance_history` |
| `data/narrative/act3/act3_week34_dravenhollow.json` | 147 | `act3_week34_dravenhollow` -> `dravenhollow_appeal_patriotism` | `codex_tyvaren_ethnic_policies` |
| `data/narrative/act3/act3_week34_dravenhollow.json` | 171 | `act3_week34_dravenhollow` -> `dravenhollow_separatist_emergency` | `codex_dravenhollow_garrison` |
| `data/narrative/act3/act3_week34_dravenhollow.json` | 171 | `act3_week34_dravenhollow` -> `dravenhollow_separatist_emergency` | `codex_emergency_curfew_provisions` |
| `data/narrative/act3/act3_week36_nadia_publishes.json` | 64, 83, 105, 120, 137 | `act3_week36_nadia_publishes` -> `nadia_publishes_full_transparency` | `codex_nadia_investigation_full` |
| `data/narrative/act3/act3_week36_nadia_publishes.json` | 64 | `act3_week36_nadia_publishes` -> `nadia_publishes_full_transparency` | `codex_press_freedom_consortium` |
| `data/narrative/act3/act3_week36_nadia_publishes.json` | 64, 83, 105, 120, 137 | `act3_week36_nadia_publishes` -> `nadia_publishes_discredit_timing` | `codex_nadia_investigation_full` |
| `data/narrative/act3/act3_week36_nadia_publishes.json` | 83 | `act3_week36_nadia_publishes` -> `nadia_publishes_discredit_timing` | `codex_wartime_press_restrictions` |
| `data/narrative/act3/act3_week36_nadia_publishes.json` | 105 | `act3_week36_nadia_publishes` -> `nadia_publishes_suppress_story` | `codex_emergency_press_powers` |
| `data/narrative/act3/act3_week36_nadia_publishes.json` | 64, 83, 105, 120, 137 | `act3_week36_nadia_publishes` -> `nadia_publishes_suppress_story` | `codex_nadia_investigation_full` |
| `data/narrative/act3/act3_week36_nadia_publishes.json` | 64, 83, 105, 120, 137 | `act3_week36_nadia_publishes` -> `nadia_publishes_personal_appeal` | `codex_nadia_investigation_full` |
| `data/narrative/act3/act3_week36_nadia_publishes.json` | 64, 83, 105, 120, 137 | `act3_week36_nadia_publishes` -> `nadia_publishes_focus_tyvaren` | `codex_nadia_investigation_full` |
| `data/narrative/act3/act3_week37_coup_attempt.json` | 102, 125, 149, 172 | `act3_week37_coup_attempt` -> `coup_flee_stellamere` | `codex_third_armored_regiment` |
| `data/narrative/act3/act3_week37_coup_attempt.json` | 102 | `act3_week37_coup_attempt` -> `coup_flee_stellamere` | `codex_government_exile_doctrine` |
| `data/narrative/act3/act3_week37_coup_attempt.json` | 102, 125, 149, 172 | `act3_week37_coup_attempt` -> `coup_negotiate_brenner` | `codex_third_armored_regiment` |
| `data/narrative/act3/act3_week37_coup_attempt.json` | 125 | `act3_week37_coup_attempt` -> `coup_negotiate_brenner` | `codex_brenner_demands` |
| `data/narrative/act3/act3_week37_coup_attempt.json` | 149 | `act3_week37_coup_attempt` -> `coup_call_loyal_forces` | `codex_article_four` |
| `data/narrative/act3/act3_week37_coup_attempt.json` | 149 | `act3_week37_coup_attempt` -> `coup_call_loyal_forces` | `codex_first_infantry_division` |
| `data/narrative/act3/act3_week37_coup_attempt.json` | 102, 125, 149, 172 | `act3_week37_coup_attempt` -> `coup_call_loyal_forces` | `codex_third_armored_regiment` |
| `data/narrative/act3/act3_week37_coup_attempt.json` | 102, 125, 149, 172 | `act3_week37_coup_attempt` -> `coup_confront_directly` | `codex_third_armored_regiment` |
| `data/narrative/act3/act3_week37_coup_attempt.json` | 172 | `act3_week37_coup_attempt` -> `coup_confront_directly` | `codex_general_staff_building` |
| `data/narrative/act3/act3_week37_military_rally.json` | 76, 117 | `act3_week37_military_rally` -> `rally_inspire_unity` | `codex_veltrian_military_oath` |
| `data/narrative/act3/act3_week37_military_rally.json` | 76 | `act3_week37_military_rally` -> `rally_inspire_unity` | `codex_constitutional_defense_doctrine` |
| `data/narrative/act3/act3_week37_military_rally.json` | 98, 138 | `act3_week37_military_rally` -> `rally_steeled_resolve` | `codex_tyvaren_invasion_estimate` |
| `data/narrative/act3/act3_week37_military_rally.json` | 98 | `act3_week37_military_rally` -> `rally_steeled_resolve` | `codex_veltrian_defensive_capability` |
| `data/narrative/act3/act3_week37_military_rally.json` | 117 | `act3_week37_military_rally` -> `rally_personal_gratitude` | `codex_mikhael_ashavel_public` |
| `data/narrative/act3/act3_week37_military_rally.json` | 76, 117 | `act3_week37_military_rally` -> `rally_personal_gratitude` | `codex_veltrian_military_oath` |
| `data/narrative/act3/act3_week37_military_rally.json` | 98, 138 | `act3_week37_military_rally` -> `rally_strategic_preview` | `codex_tyvaren_invasion_estimate` |
| `data/narrative/act3/act3_week37_military_rally.json` | 138 | `act3_week37_military_rally` -> `rally_strategic_preview` | `codex_veltrian_order_of_battle` |
| `data/narrative/act3/act3_week38_family_reckoning.json` | 166 | `act3_week38_family_reckoning` -> `family_tomas_specific` | `codex_mikhael_ashavel_legacy` |
| `data/narrative/act3/act3_week39_act3_climax.json` | 76 | `act3_week39_act3_climax` -> `climax_war_footing` | `codex_forward_readiness` |
| `data/narrative/act3/act3_week39_act3_climax.json` | 76 | `act3_week39_act3_climax` -> `climax_war_footing` | `codex_tyvaren_invasion_timeline` |
| `data/narrative/act3/act3_week39_act3_climax.json` | 101 | `act3_week39_act3_climax` -> `climax_diplomatic_surge` | `codex_international_forum_emergency` |
| `data/narrative/act3/act3_week39_act3_climax.json` | 101 | `act3_week39_act3_climax` -> `climax_diplomatic_surge` | `codex_collective_security_doctrine` |
| `data/narrative/act3/act3_week39_act3_climax.json` | 124 | `act3_week39_act3_climax` -> `climax_hold_everything` | `codex_crisis_management_doctrine` |
| `data/narrative/act3/act3_week39_act3_climax.json` | 172 | `act3_week39_act3_climax` -> `climax_coup_survival_focus` | `codex_internal_security_doctrine` |
| `data/narrative/act3/act3_week39_act3_climax.json` | 194 | `act3_week39_act3_climax` -> `climax_narrative_control` | `codex_chancellors_address` |
| `data/narrative/act3/act3_week39_act3_climax.json` | 194 | `act3_week39_act3_climax` -> `climax_narrative_control` | `codex_national_broadcast_system` |
| `data/narrative/act4/act4_alliance_crisis.json` | 55 | `act4_alliance_crisis` -> `alliance_publicly_shame` | `codex_diplomatic_hardball` |
| `data/narrative/act4/act4_alliance_crisis.json` | 55 | `act4_alliance_crisis` -> `alliance_publicly_shame` | `codex_public_diplomacy` |
| `data/narrative/act4/act4_alliance_crisis.json` | 71 | `act4_alliance_crisis` -> `alliance_accept_limited_support` | `codex_domestic_war_production` |
| `data/narrative/act4/act4_alliance_crisis.json` | 71 | `act4_alliance_crisis` -> `alliance_accept_limited_support` | `codex_self_reliance_doctrine` |
| `data/narrative/act4/act4_alliance_crisis.json` | 88 | `act4_alliance_crisis` -> `alliance_diplomatic_concessions` | `codex_diplomatic_leverage` |
| `data/narrative/act4/act4_alliance_crisis.json` | 88 | `act4_alliance_crisis` -> `alliance_diplomatic_concessions` | `codex_postwar_alliance_framework` |
| `data/narrative/act4/act4_all_fronts.json` | 51 | `act4_all_fronts` -> `all_fronts_military_priority` | `codex_wartime_logistics` |
| `data/narrative/act4/act4_all_fronts.json` | 51 | `act4_all_fronts` -> `all_fronts_military_priority` | `codex_military_requisition` |
| `data/narrative/act4/act4_all_fronts.json` | 68 | `act4_all_fronts` -> `all_fronts_rotate_attention` | `codex_crisis_management` |
| `data/narrative/act4/act4_all_fronts.json` | 68 | `act4_all_fronts` -> `all_fronts_rotate_attention` | `codex_rotational_governance` |
| `data/narrative/act4/act4_all_fronts.json` | 85 | `act4_all_fronts` -> `all_fronts_lean_on_trusted` | `codex_delegation_governance` |
| `data/narrative/act4/act4_all_fronts.json` | 85 | `act4_all_fronts` -> `all_fronts_lean_on_trusted` | `codex_leadership_trust` |
| `data/narrative/act4/act4_arcturian_intervention.json` | 56 | `act4_arcturian_intervention` -> `arcturian_full_operational` | `codex_arcturian_command_framework` |
| `data/narrative/act4/act4_arcturian_intervention.json` | 56 | `act4_arcturian_intervention` -> `arcturian_full_operational` | `codex_joint_military_operations` |
| `data/narrative/act4/act4_arcturian_intervention.json` | 73 | `act4_arcturian_intervention` -> `arcturian_veltrian_command` | `codex_veltrian_military_sovereignty` |
| `data/narrative/act4/act4_arcturian_intervention.json` | 73 | `act4_arcturian_intervention` -> `arcturian_veltrian_command` | `codex_coalition_warfare` |
| `data/narrative/act4/act4_arcturian_intervention.json` | 90 | `act4_arcturian_intervention` -> `arcturian_defensive_only` | `codex_defensive_perimeter` |
| `data/narrative/act4/act4_arcturian_intervention.json` | 90 | `act4_arcturian_intervention` -> `arcturian_defensive_only` | `codex_naval_doctrine` |
| `data/narrative/act4/act4_ceasefire_negotiation.json` | 53 | `act4_ceasefire_negotiation` -> `ceasefire_accept_terms` | `codex_ceasefire_terms` |
| `data/narrative/act4/act4_ceasefire_negotiation.json` | 53 | `act4_ceasefire_negotiation` -> `ceasefire_accept_terms` | `codex_humanitarian_corridor` |
| `data/narrative/act4/act4_ceasefire_negotiation.json` | 69 | `act4_ceasefire_negotiation` -> `ceasefire_demand_withdrawal` | `codex_territorial_integrity` |
| `data/narrative/act4/act4_ceasefire_negotiation.json` | 69 | `act4_ceasefire_negotiation` -> `ceasefire_demand_withdrawal` | `codex_ceasefire_principles` |
| `data/narrative/act4/act4_ceasefire_negotiation.json` | 86 | `act4_ceasefire_negotiation` -> `ceasefire_international_monitors` | `codex_international_ceasefire_monitoring` |
| `data/narrative/act4/act4_ceasefire_negotiation.json` | 86 | `act4_ceasefire_negotiation` -> `ceasefire_international_monitors` | `codex_forum_peacekeeping` |
| `data/narrative/act4/act4_ceasefire_talks.json` | 46 | `act4_ceasefire_talks` -> `talks_territorial_integrity` | `codex_territorial_negotiation` |
| `data/narrative/act4/act4_ceasefire_talks.json` | 46 | `act4_ceasefire_talks` -> `talks_territorial_integrity` | `codex_ceasefire_principles` |
| `data/narrative/act4/act4_ceasefire_talks.json` | 62 | `act4_ceasefire_talks` -> `talks_civilian_protection` | `codex_civilian_protection` |
| `data/narrative/act4/act4_ceasefire_talks.json` | 62 | `act4_ceasefire_talks` -> `talks_civilian_protection` | `codex_humanitarian_access` |
| `data/narrative/act4/act4_ceasefire_talks.json` | 78 | `act4_ceasefire_talks` -> `talks_face_saving_compromise` | `codex_diplomatic_language` |
| `data/narrative/act4/act4_ceasefire_talks.json` | 78 | `act4_ceasefire_talks` -> `talks_face_saving_compromise` | `codex_face_saving_diplomacy` |
| `data/narrative/act4/act4_civil_conflict_arc.json` | 52 | `act4_civil_conflict_arc` -> `civil_conflict_reunify_force` | `codex_reunification_campaign` |
| `data/narrative/act4/act4_civil_conflict_arc.json` | 52 | `act4_civil_conflict_arc` -> `civil_conflict_reunify_force` | `codex_urban_combat_doctrine` |
| `data/narrative/act4/act4_civil_conflict_arc.json` | 72 | `act4_civil_conflict_arc` -> `civil_conflict_negotiated_settlement` | `codex_negotiated_reunification` |
| `data/narrative/act4/act4_civil_conflict_arc.json` | 72 | `act4_civil_conflict_arc` -> `civil_conflict_negotiated_settlement` | `codex_brenner_direct_dialogue` |
| `data/narrative/act4/act4_civil_conflict_arc.json` | 93 | `act4_civil_conflict_arc` -> `civil_conflict_govern_territory` | `codex_democratic_governance_model` |
| `data/narrative/act4/act4_civil_conflict_arc.json` | 93 | `act4_civil_conflict_arc` -> `civil_conflict_govern_territory` | `codex_local_elections` |
| `data/narrative/act4/act4_constitutional_crisis.json` | 56 | `act4_constitutional_crisis` -> `crisis_defend_executive_order` | `codex_emergency_powers_jurisprudence` |
| `data/narrative/act4/act4_constitutional_crisis.json` | 56 | `act4_constitutional_crisis` -> `crisis_defend_executive_order` | `codex_constitutional_court` |
| `data/narrative/act4/act4_constitutional_crisis.json` | 72 | `act4_constitutional_crisis` -> `crisis_negotiate_compromise` | `codex_separation_of_powers` |
| `data/narrative/act4/act4_constitutional_crisis.json` | 72 | `act4_constitutional_crisis` -> `crisis_negotiate_compromise` | `codex_parliamentary_oversight` |
| `data/narrative/act4/act4_constitutional_crisis.json` | 88 | `act4_constitutional_crisis` -> `crisis_withdraw_seek_approval` | `codex_legislative_process` |
| `data/narrative/act4/act4_constitutional_crisis.json` | 88 | `act4_constitutional_crisis` -> `crisis_withdraw_seek_approval` | `codex_constitutional_deference` |
| `data/narrative/act4/act4_coordinated_response.json` | 46 | `act4_coordinated_response` -> `coordinated_accelerate` | `codex_strategic_acceleration` |
| `data/narrative/act4/act4_coordinated_response.json` | 46 | `act4_coordinated_response` -> `coordinated_accelerate` | `codex_crisis_offensive` |
| `data/narrative/act4/act4_coordinated_response.json` | 62 | `act4_coordinated_response` -> `coordinated_consolidate` | `codex_strategic_consolidation` |
| `data/narrative/act4/act4_coordinated_response.json` | 62 | `act4_coordinated_response` -> `coordinated_consolidate` | `codex_crisis_stabilization` |
| `data/narrative/act4/act4_coordinated_response.json` | 79 | `act4_coordinated_response` -> `coordinated_transition_normal` | `codex_transitional_governance` |
| `data/narrative/act4/act4_coordinated_response.json` | 79 | `act4_coordinated_response` -> `coordinated_transition_normal` | `codex_peacetime_administration` |
| `data/narrative/act4/act4_diplomatic_endgame.json` | 52 | `act4_diplomatic_endgame` -> `diplomatic_accept_modified_framework` | `codex_diplomatic_framework` |
| `data/narrative/act4/act4_diplomatic_endgame.json` | 52 | `act4_diplomatic_endgame` -> `diplomatic_accept_modified_framework` | `codex_ceasefire_diplomacy` |
| `data/narrative/act4/act4_diplomatic_endgame.json` | 69 | `act4_diplomatic_endgame` -> `diplomatic_reject_prepare_war` | `codex_war_planning` |
| `data/narrative/act4/act4_diplomatic_endgame.json` | 69 | `act4_diplomatic_endgame` -> `diplomatic_reject_prepare_war` | `codex_military_resolve` |
| `data/narrative/act4/act4_diplomatic_endgame.json` | 85 | `act4_diplomatic_endgame` -> `diplomatic_push_better_deal` | `codex_diplomatic_warfare` |
| `data/narrative/act4/act4_diplomatic_endgame.json` | 85 | `act4_diplomatic_endgame` -> `diplomatic_push_better_deal` | `codex_multilateral_pressure` |
| `data/narrative/act4/act4_dravenni_war_alliance.json` | 52 | `act4_dravenni_war_alliance` -> `dravenni_expand_role` | `codex_dravenni_commissioned_units` |
| `data/narrative/act4/act4_dravenni_war_alliance.json` | 52 | `act4_dravenni_war_alliance` -> `dravenni_expand_role` | `codex_highland_autonomy_commission` |
| `data/narrative/act4/act4_dravenni_war_alliance.json` | 68 | `act4_dravenni_war_alliance` -> `dravenni_maintain_integration` | `codex_dravenni_operational_integration` |
| `data/narrative/act4/act4_dravenni_war_alliance.json` | 68 | `act4_dravenni_war_alliance` -> `dravenni_maintain_integration` | `codex_coalition_warfare_mountains` |
| `data/narrative/act4/act4_dravenni_war_alliance.json` | 84 | `act4_dravenni_war_alliance` -> `dravenni_limit_role` | `codex_dravenni_security_framework` |
| `data/narrative/act4/act4_dravenni_war_alliance.json` | 84 | `act4_dravenni_war_alliance` -> `dravenni_limit_role` | `codex_postwar_negotiation` |
| `data/narrative/act4/act4_emergency_powers_invoked.json` | 57, 77 | `act4_emergency_powers_invoked` -> `emergency_powers_invoke_narrow` | `codex_emergency_powers_declaration` |
| `data/narrative/act4/act4_emergency_powers_invoked.json` | 57, 77 | `act4_emergency_powers_invoked` -> `emergency_powers_invoke_broad` | `codex_emergency_powers_declaration` |
| `data/narrative/act4/act4_exile_arc.json` | 52 | `act4_exile_arc` -> `exile_arc_international` | `codex_international_sanctions_regime` |
| `data/narrative/act4/act4_exile_arc.json` | 52 | `act4_exile_arc` -> `exile_arc_international` | `codex_exile_diplomacy` |
| `data/narrative/act4/act4_exile_arc.json` | 72 | `act4_exile_arc` -> `exile_arc_resistance` | `codex_resistance_organization` |
| `data/narrative/act4/act4_exile_arc.json` | 72 | `act4_exile_arc` -> `exile_arc_resistance` | `codex_junta_repression` |
| `data/narrative/act4/act4_exile_arc.json` | 93 | `act4_exile_arc` -> `exile_arc_negotiate_return` | `codex_negotiated_transition` |
| `data/narrative/act4/act4_exile_arc.json` | 93 | `act4_exile_arc` -> `exile_arc_negotiate_return` | `codex_brenner_exit_terms` |
| `data/narrative/act4/act4_family_anchored.json` | 63 | `act4_family_anchored` -> `family_anchored_draw_strength` | `codex_mikhael_ashavel_legacy` |
| `data/narrative/act4/act4_family_healing.json` | 78 | `act4_family_healing` -> `family_healing_integrate_public` | `codex_first_family_public` |
| `data/narrative/act4/act4_forum_showdown.json` | 50 | `act4_forum_showdown` -> `forum_collective_security` | `codex_forum_charter` |
| `data/narrative/act4/act4_forum_showdown.json` | 50 | `act4_forum_showdown` -> `forum_collective_security` | `codex_collective_security_doctrine` |
| `data/narrative/act4/act4_forum_showdown.json` | 66 | `act4_forum_showdown` -> `forum_bilateral_deals` | `codex_realpolitik` |
| `data/narrative/act4/act4_forum_showdown.json` | 66 | `act4_forum_showdown` -> `forum_bilateral_deals` | `codex_diplomatic_bargaining` |
| `data/narrative/act4/act4_forum_showdown.json` | 82 | `act4_forum_showdown` -> `forum_threaten_consequences` | `codex_forum_diplomacy` |
| `data/narrative/act4/act4_forum_showdown.json` | 82 | `act4_forum_showdown` -> `forum_threaten_consequences` | `codex_moral_hazard_international_relations` |
| `data/narrative/act4/act4_ima_confrontation.json` | 46 | `act4_ima_confrontation` -> `ima_assert_sovereignty` | `codex_ima_sovereignty` |
| `data/narrative/act4/act4_ima_confrontation.json` | 46 | `act4_ima_confrontation` -> `ima_assert_sovereignty` | `codex_debt_negotiation` |
| `data/narrative/act4/act4_ima_confrontation.json` | 61 | `act4_ima_confrontation` -> `ima_negotiate_revised_schedule` | `codex_ima_negotiation` |
| `data/narrative/act4/act4_ima_confrontation.json` | 61 | `act4_ima_confrontation` -> `ima_negotiate_revised_schedule` | `codex_wartime_economic_adjustment` |
| `data/narrative/act4/act4_ima_confrontation.json` | 77 | `act4_ima_confrontation` -> `ima_moral_case` | `codex_ima_human_impact` |
| `data/narrative/act4/act4_ima_confrontation.json` | 77 | `act4_ima_confrontation` -> `ima_moral_case` | `codex_austerity_morality` |
| `data/narrative/act4/act4_ima_renegotiation.json` | 45 | `act4_ima_renegotiation` -> `ima_play_superpowers` | `codex_triangular_diplomacy` |
| `data/narrative/act4/act4_ima_renegotiation.json` | 45 | `act4_ima_renegotiation` -> `ima_play_superpowers` | `codex_strategic_bargaining` |
| `data/narrative/act4/act4_ima_renegotiation.json` | 60 | `act4_ima_renegotiation` -> `ima_accept_counter_offer` | `codex_ima_oversight` |
| `data/narrative/act4/act4_ima_renegotiation.json` | 60 | `act4_ima_renegotiation` -> `ima_accept_counter_offer` | `codex_conditionality` |
| `data/narrative/act4/act4_ima_renegotiation.json` | 76 | `act4_ima_renegotiation` -> `ima_independent_path` | `codex_sovereign_financing` |
| `data/narrative/act4/act4_ima_renegotiation.json` | 76 | `act4_ima_renegotiation` -> `ima_independent_path` | `codex_war_bonds` |
| `data/narrative/act4/act4_impeachment_proceedings.json` | 79, 117, 182 | `act4_impeachment_proceedings` -> `impeachment_fight` | `codex_impeachment` |
| `data/narrative/act4/act4_impeachment_proceedings.json` | 79, 117, 182 | `act4_impeachment_proceedings` -> `impeachment_resign` | `codex_impeachment` |
| `data/narrative/act4/act4_impeachment_proceedings.json` | 79, 117, 182 | `act4_impeachment_proceedings` -> `impeachment_emergency` | `codex_impeachment` |
| `data/narrative/act4/act4_impeachment_proceedings.json` | 183 | `act4_impeachment_proceedings` -> `impeachment_emergency` | `codex_article_22_emergency` |
| `data/narrative/act4/act4_impeachment_vote_vindicated.json` | 51, 65, 83 | `act4_impeachment_vote_vindicated` -> `impeachment_vindicated_reform` | `codex_impeachment` |
| `data/narrative/act4/act4_impeachment_vote_vindicated.json` | 51, 65, 83 | `act4_impeachment_vote_vindicated` -> `impeachment_vindicated_govern` | `codex_impeachment` |
| `data/narrative/act4/act4_impeachment_vote_vindicated.json` | 51, 65, 83 | `act4_impeachment_vote_vindicated` -> `impeachment_vindicated_counterattack` | `codex_impeachment` |
| `data/narrative/act4/act4_internal_security_state.json` | 55 | `act4_internal_security_state` -> `security_regulate` | `codex_security_oversight` |
| `data/narrative/act4/act4_internal_security_state.json` | 55 | `act4_internal_security_state` -> `security_regulate` | `codex_democratic_security_doctrine` |
| `data/narrative/act4/act4_internal_security_state.json` | 75 | `act4_internal_security_state` -> `security_expand` | `codex_emergency_security_powers` |
| `data/narrative/act4/act4_internal_security_state.json` | 75 | `act4_internal_security_state` -> `security_expand` | `codex_preventive_detention` |
| `data/narrative/act4/act4_internal_security_state.json` | 95 | `act4_internal_security_state` -> `security_rollback` | `codex_security_rollback` |
| `data/narrative/act4/act4_internal_security_state.json` | 95 | `act4_internal_security_state` -> `security_rollback` | `codex_democratic_normalization` |
| `data/narrative/act4/act4_jonas_divorce.json` | 55, 74, 93, 112 | `act4_jonas_divorce` -> `jonas_divorce_private_dignity` | `codex_divorce_proceedings` |
| `data/narrative/act4/act4_jonas_divorce.json` | 55, 74, 93, 112 | `act4_jonas_divorce` -> `jonas_divorce_public_narrative` | `codex_divorce_proceedings` |
| `data/narrative/act4/act4_jonas_divorce.json` | 55, 74, 93, 112 | `act4_jonas_divorce` -> `jonas_divorce_legal_protection` | `codex_divorce_proceedings` |
| `data/narrative/act4/act4_jonas_divorce.json` | 55, 74, 93, 112 | `act4_jonas_divorce` -> `jonas_divorce_full_transparency` | `codex_divorce_proceedings` |
| `data/narrative/act4/act4_national_address.json` | 45, 62, 80 | `act4_national_address` -> `address_honest_somber` | `codex_chancellors_address` |
| `data/narrative/act4/act4_national_address.json` | 45 | `act4_national_address` -> `address_honest_somber` | `codex_national_truth` |
| `data/narrative/act4/act4_national_address.json` | 45, 62, 80 | `act4_national_address` -> `address_defiant_inspiring` | `codex_chancellors_address` |
| `data/narrative/act4/act4_national_address.json` | 62 | `act4_national_address` -> `address_defiant_inspiring` | `codex_national_resilience` |
| `data/narrative/act4/act4_national_address.json` | 45, 62, 80 | `act4_national_address` -> `address_pragmatic_unifying` | `codex_chancellors_address` |
| `data/narrative/act4/act4_national_address.json` | 80 | `act4_national_address` -> `address_pragmatic_unifying` | `codex_national_unity` |
| `data/narrative/act4/act4_occupation_begins.json` | 58 | `act4_occupation_begins` -> `occupation_underground_resistance` | `codex_occupation_resistance` |
| `data/narrative/act4/act4_occupation_begins.json` | 58 | `act4_occupation_begins` -> `occupation_underground_resistance` | `codex_underground_leadership` |
| `data/narrative/act4/act4_occupation_begins.json` | 76 | `act4_occupation_begins` -> `occupation_accept_terms` | `codex_occupation_governance` |
| `data/narrative/act4/act4_occupation_begins.json` | 76 | `act4_occupation_begins` -> `occupation_accept_terms` | `codex_civil_society_resilience` |
| `data/narrative/act4/act4_occupation_begins.json` | 95 | `act4_occupation_begins` -> `occupation_flee_exile` | `codex_government_in_exile_formation` |
| `data/narrative/act4/act4_occupation_begins.json` | 95 | `act4_occupation_begins` -> `occupation_flee_exile` | `codex_international_legitimacy` |
| `data/narrative/act4/act4_post_coup_consolidation.json` | 52 | `act4_post_coup_consolidation` -> `consolidate_purge` | `codex_military_discipline_act` |
| `data/narrative/act4/act4_post_coup_consolidation.json` | 52 | `act4_post_coup_consolidation` -> `consolidate_purge` | `codex_officer_accountability` |
| `data/narrative/act4/act4_post_coup_consolidation.json` | 71 | `act4_post_coup_consolidation` -> `consolidate_targeted_accountability` | `codex_accountability_framework` |
| `data/narrative/act4/act4_post_coup_consolidation.json` | 71 | `act4_post_coup_consolidation` -> `consolidate_targeted_accountability` | `codex_loyalty_reaffirmation` |
| `data/narrative/act4/act4_post_coup_consolidation.json` | 91 | `act4_post_coup_consolidation` -> `consolidate_institutional_reform` | `codex_military_institutional_reform` |
| `data/narrative/act4/act4_post_coup_consolidation.json` | 91 | `act4_post_coup_consolidation` -> `consolidate_institutional_reform` | `codex_civilian_oversight` |
| `data/narrative/act4/act4_public_mandate.json` | 46 | `act4_public_mandate` -> `mandate_bold_action` | `codex_popular_mandate` |
| `data/narrative/act4/act4_public_mandate.json` | 46 | `act4_public_mandate` -> `mandate_bold_action` | `codex_decisive_governance` |
| `data/narrative/act4/act4_public_mandate.json` | 61 | `act4_public_mandate` -> `mandate_careful_navigation` | `codex_public_consultation` |
| `data/narrative/act4/act4_public_mandate.json` | 61 | `act4_public_mandate` -> `mandate_careful_navigation` | `codex_inclusive_leadership` |
| `data/narrative/act4/act4_public_mandate.json` | 78 | `act4_public_mandate` -> `mandate_build_bridges` | `codex_national_reconciliation` |
| `data/narrative/act4/act4_public_mandate.json` | 78 | `act4_public_mandate` -> `mandate_build_bridges` | `codex_bridge_building_governance` |
| `data/narrative/act4/act4_reelection_campaign.json` | 48 | `act4_reelection_campaign` -> `reelection_reform_record` | `codex_campaign_reform` |
| `data/narrative/act4/act4_reelection_campaign.json` | 48 | `act4_reelection_campaign` -> `reelection_reform_record` | `codex_electoral_mandate` |
| `data/narrative/act4/act4_reelection_campaign.json` | 64 | `act4_reelection_campaign` -> `reelection_strength_stability` | `codex_wartime_leadership` |
| `data/narrative/act4/act4_reelection_campaign.json` | 64 | `act4_reelection_campaign` -> `reelection_strength_stability` | `codex_crisis_mandate` |
| `data/narrative/act4/act4_reelection_campaign.json` | 80 | `act4_reelection_campaign` -> `reelection_unity_healing` | `codex_national_unity` |
| `data/narrative/act4/act4_reelection_campaign.json` | 80 | `act4_reelection_campaign` -> `reelection_unity_healing` | `codex_healing_governance` |
| `data/narrative/act4/act4_second_referendum.json` | 50 | `act4_second_referendum` -> `referendum_positive_campaign` | `codex_constitutional_vision` |
| `data/narrative/act4/act4_second_referendum.json` | 50 | `act4_second_referendum` -> `referendum_positive_campaign` | `codex_democratic_renewal` |
| `data/narrative/act4/act4_second_referendum.json` | 66 | `act4_second_referendum` -> `referendum_costs_campaign` | `codex_parliamentary_failure` |
| `data/narrative/act4/act4_second_referendum.json` | 66 | `act4_second_referendum` -> `referendum_costs_campaign` | `codex_political_accountability` |
| `data/narrative/act4/act4_second_referendum.json` | 82 | `act4_second_referendum` -> `referendum_unity_campaign` | `codex_democratic_deliberation` |
| `data/narrative/act4/act4_second_referendum.json` | 82 | `act4_second_referendum` -> `referendum_unity_campaign` | `codex_national_conversation` |
| `data/narrative/act4/act4_tomas_redemption.json` | 63, 81, 100 | `act4_tomas_redemption` -> `tomas_redemption_constructive_institutions` | `codex_mikhael_ashavel_legacy` |
| `data/narrative/act4/act4_tomas_redemption.json` | 63, 81, 100 | `act4_tomas_redemption` -> `tomas_redemption_bring_close` | `codex_mikhael_ashavel_legacy` |
| `data/narrative/act4/act4_tomas_redemption.json` | 63, 81, 100 | `act4_tomas_redemption` -> `tomas_redemption_firm_boundaries` | `codex_mikhael_ashavel_legacy` |
| `data/narrative/act4/act4_underground_radio.json` | 46 | `act4_underground_radio` -> `radio_inspire_resistance` | `codex_radio_free_veltria` |
| `data/narrative/act4/act4_underground_radio.json` | 46 | `act4_underground_radio` -> `radio_inspire_resistance` | `codex_civil_resistance` |
| `data/narrative/act4/act4_underground_radio.json` | 65 | `act4_underground_radio` -> `radio_document_junta` | `codex_junta_documentation` |
| `data/narrative/act4/act4_underground_radio.json` | 65 | `act4_underground_radio` -> `radio_document_junta` | `codex_broadcast_accountability` |
| `data/narrative/act4/act4_underground_radio.json` | 85 | `act4_underground_radio` -> `radio_promise_return` | `codex_return_promise` |
| `data/narrative/act4/act4_underground_radio.json` | 85 | `act4_underground_radio` -> `radio_promise_return` | `codex_exile_timeline` |
| `data/narrative/act4/act4_vael_final_offer.json` | 63 | `act4_vael_final_offer` -> `vael_final_accept` | `codex_vael_puppet_ending` |
| `data/narrative/act4/act4_vael_final_offer.json` | 99 | `act4_vael_final_offer` -> `vael_final_expose` | `codex_bni_intelligence` |
| `data/narrative/act4/act4_week40_exile.json` | 57, 109 | `act4_week40_exile` -> `exile_international_campaign` | `codex_government_in_exile` |
| `data/narrative/act4/act4_week40_exile.json` | 57 | `act4_week40_exile` -> `exile_international_campaign` | `codex_international_recognition_doctrine` |
| `data/narrative/act4/act4_week40_exile.json` | 74 | `act4_week40_exile` -> `exile_resistance_network` | `codex_veltrian_resistance` |
| `data/narrative/act4/act4_week40_exile.json` | 74 | `act4_week40_exile` -> `exile_resistance_network` | `codex_loyalist_network` |
| `data/narrative/act4/act4_week40_exile.json` | 92 | `act4_week40_exile` -> `exile_personal_broadcast` | `codex_radio_free_veltria` |
| `data/narrative/act4/act4_week40_exile.json` | 92 | `act4_week40_exile` -> `exile_personal_broadcast` | `codex_underground_broadcasting` |
| `data/narrative/act4/act4_week40_exile.json` | 57, 109 | `act4_week40_exile` -> `exile_negotiate_return` | `codex_government_in_exile` |
| `data/narrative/act4/act4_week40_exile.json` | 109 | `act4_week40_exile` -> `exile_negotiate_return` | `codex_transitional_council_proposal` |
| `data/narrative/act4/act4_week40_war_begins.json` | 67 | `act4_week40_war_begins` -> `war_commit_reserve` | `codex_second_armored_reserve` |
| `data/narrative/act4/act4_week40_war_begins.json` | 67 | `act4_week40_war_begins` -> `war_commit_reserve` | `codex_battle_of_korven_forest` |
| `data/narrative/act4/act4_week40_war_begins.json` | 86 | `act4_week40_war_begins` -> `war_hold_reserve_call_allies` | `codex_veltrian_diplomatic_corps_war` |
| `data/narrative/act4/act4_week40_war_begins.json` | 86 | `act4_week40_war_begins` -> `war_hold_reserve_call_allies` | `codex_stellamere_mutual_defense_pact` |
| `data/narrative/act4/act4_week40_war_begins.json` | 109 | `act4_week40_war_begins` -> `war_dravenni_gamble` | `codex_dravenni_highland_defense` |
| `data/narrative/act4/act4_week40_war_begins.json` | 109 | `act4_week40_war_begins` -> `war_dravenni_gamble` | `codex_dlf_wartime_integration` |
| `data/narrative/act4/act4_week40_war_begins.json` | 128 | `act4_week40_war_begins` -> `war_address_nation` | `codex_chancellors_war_address` |
| `data/narrative/act4/act4_week41_reform_implementation.json` | 49 | `act4_week41_reform_implementation` -> `reform_push_aggressively` | `codex_judicial_reform_bill` |
| `data/narrative/act4/act4_week41_reform_implementation.json` | 49 | `act4_week41_reform_implementation` -> `reform_push_aggressively` | `codex_parliamentary_procedure` |
| `data/narrative/act4/act4_week41_reform_implementation.json` | 67 | `act4_week41_reform_implementation` -> `reform_build_coalition` | `codex_constitutional_implementation` |
| `data/narrative/act4/act4_week41_reform_implementation.json` | 67 | `act4_week41_reform_implementation` -> `reform_build_coalition` | `codex_coalition_governance` |
| `data/narrative/act4/act4_week41_reform_implementation.json` | 84 | `act4_week41_reform_implementation` -> `reform_public_mandate` | `codex_constitutional_education` |
| `data/narrative/act4/act4_week41_reform_implementation.json` | 84 | `act4_week41_reform_implementation` -> `reform_public_mandate` | `codex_public_consultation` |
| `data/narrative/act4/act4_week41_reform_implementation.json` | 101 | `act4_week41_reform_implementation` -> `reform_selective_priorities` | `codex_constitutional_prioritization` |
| `data/narrative/act4/act4_week42_austerity_bites.json` | 50 | `act4_week42_austerity_bites` -> `austerity_implement_fully` | `codex_ima_structural_adjustment` |
| `data/narrative/act4/act4_week42_austerity_bites.json` | 50 | `act4_week42_austerity_bites` -> `austerity_implement_fully` | `codex_privatization_program` |
| `data/narrative/act4/act4_week42_austerity_bites.json` | 69 | `act4_week42_austerity_bites` -> `austerity_slow_walk` | `codex_ima_negotiation` |
| `data/narrative/act4/act4_week42_austerity_bites.json` | 69 | `act4_week42_austerity_bites` -> `austerity_slow_walk` | `codex_austerity_resistance` |
| `data/narrative/act4/act4_week42_austerity_bites.json` | 91 | `act4_week42_austerity_bites` -> `austerity_renegotiate` | `codex_ima_renegotiation` |
| `data/narrative/act4/act4_week42_austerity_bites.json` | 91 | `act4_week42_austerity_bites` -> `austerity_renegotiate` | `codex_orythian_economic_model` |
| `data/narrative/act4/act4_week42_austerity_bites.json` | 111 | `act4_week42_austerity_bites` -> `austerity_executive_impose` | `codex_executive_order_ima` |
| `data/narrative/act4/act4_week42_austerity_bites.json` | 111 | `act4_week42_austerity_bites` -> `austerity_executive_impose` | `codex_constitutional_crisis` |
| `data/narrative/act4/act4_week42_war_strategy.json` | 65 | `act4_week42_war_strategy` -> `war_strategy_decisive_battle` | `codex_battle_of_gravenmark_planning` |
| `data/narrative/act4/act4_week42_war_strategy.json` | 86 | `act4_week42_war_strategy` -> `war_strategy_protracted_defense` | `codex_winter_war_defense` |
| `data/narrative/act4/act4_week42_war_strategy.json` | 86 | `act4_week42_war_strategy` -> `war_strategy_protracted_defense` | `codex_veltrian_logistics_network` |
| `data/narrative/act4/act4_week42_war_strategy.json` | 110 | `act4_week42_war_strategy` -> `war_strategy_stellamere_intervention` | `codex_arcturian_military_doctrine` |
| `data/narrative/act4/act4_week42_war_strategy.json` | 110 | `act4_week42_war_strategy` -> `war_strategy_stellamere_intervention` | `codex_stellamere_strategic_calculus` |
| `data/narrative/act4/act4_week42_war_strategy.json` | 133 | `act4_week42_war_strategy` -> `war_strategy_dravenni_counter_offensive` | `codex_dravenhollow_campaign` |
| `data/narrative/act4/act4_week42_war_strategy.json` | 133 | `act4_week42_war_strategy` -> `war_strategy_dravenni_counter_offensive` | `codex_mountain_warfare` |
| `data/narrative/act4/act4_week44_civilian_front.json` | 56 | `act4_week44_civilian_front` -> `civilian_war_economy_total` | `codex_war_economy` |
| `data/narrative/act4/act4_week44_civilian_front.json` | 56 | `act4_week44_civilian_front` -> `civilian_war_economy_total` | `codex_worker_production_councils` |
| `data/narrative/act4/act4_week44_civilian_front.json` | 75 | `act4_week44_civilian_front` -> `civilian_forced_evacuation` | `codex_wartime_evacuation` |
| `data/narrative/act4/act4_week44_civilian_front.json` | 75 | `act4_week44_civilian_front` -> `civilian_forced_evacuation` | `codex_civilian_protection_zone` |
| `data/narrative/act4/act4_week44_civilian_front.json` | 94 | `act4_week44_civilian_front` -> `civilian_aid_public_morale` | `codex_national_relief_program` |
| `data/narrative/act4/act4_week44_civilian_front.json` | 94 | `act4_week44_civilian_front` -> `civilian_aid_public_morale` | `codex_wartime_broadcasting` |
| `data/narrative/act4/act4_week44_civilian_front.json` | 115 | `act4_week44_civilian_front` -> `civilian_emergency_powers` | `codex_emergency_war_powers` |
| `data/narrative/act4/act4_week44_civilian_front.json` | 115 | `act4_week44_civilian_front` -> `civilian_emergency_powers` | `codex_martial_law_provisions` |
| `data/narrative/act4/act4_week44_counter_coup.json` | 52 | `act4_week44_counter_coup` -> `counter_coup_military_operation` | `codex_operation_restoration` |
| `data/narrative/act4/act4_week44_counter_coup.json` | 52 | `act4_week44_counter_coup` -> `counter_coup_military_operation` | `codex_loyalist_forces` |
| `data/narrative/act4/act4_week44_counter_coup.json` | 70 | `act4_week44_counter_coup` -> `counter_coup_political_solution` | `codex_provisional_government` |
| `data/narrative/act4/act4_week44_counter_coup.json` | 70 | `act4_week44_counter_coup` -> `counter_coup_political_solution` | `codex_southern_provinces` |
| `data/narrative/act4/act4_week44_counter_coup.json` | 88 | `act4_week44_counter_coup` -> `counter_coup_brenner_deal` | `codex_transitional_government` |
| `data/narrative/act4/act4_week44_counter_coup.json` | 88 | `act4_week44_counter_coup` -> `counter_coup_brenner_deal` | `codex_brenner_immunity_deal` |
| `data/narrative/act4/act4_week44_counter_coup.json` | 109 | `act4_week44_counter_coup` -> `counter_coup_international_intervention` | `codex_international_peacekeeping` |
| `data/narrative/act4/act4_week44_counter_coup.json` | 109 | `act4_week44_counter_coup` -> `counter_coup_international_intervention` | `codex_forum_mandate` |
| `data/narrative/act4/act4_week44_reform_backlash.json` | 50 | `act4_week44_reform_backlash` -> `backlash_fight_institutions` | `codex_constitutional_court_challenge` |
| `data/narrative/act4/act4_week44_reform_backlash.json` | 50 | `act4_week44_reform_backlash` -> `backlash_fight_institutions` | `codex_institutional_resilience` |
| `data/narrative/act4/act4_week44_reform_backlash.json` | 69 | `act4_week44_reform_backlash` -> `backlash_compromise_selectively` | `codex_coalition_management` |
| `data/narrative/act4/act4_week44_reform_backlash.json` | 69 | `act4_week44_reform_backlash` -> `backlash_compromise_selectively` | `codex_reform_pacing` |
| `data/narrative/act4/act4_week44_reform_backlash.json` | 89 | `act4_week44_reform_backlash` -> `backlash_authoritarian_response` | `codex_executive_reform_powers` |
| `data/narrative/act4/act4_week44_reform_backlash.json` | 89 | `act4_week44_reform_backlash` -> `backlash_authoritarian_response` | `codex_institutional_restructuring` |
| `data/narrative/act4/act4_week44_reform_backlash.json` | 108 | `act4_week44_reform_backlash` -> `backlash_public_referendum_again` | `codex_plebiscite_process` |
| `data/narrative/act4/act4_week44_reform_backlash.json` | 108 | `act4_week44_reform_backlash` -> `backlash_public_referendum_again` | `codex_direct_democracy` |
| `data/narrative/act4/act4_week45_elena_reckoning.json` | 90, 136, 177, 218 | `act4_week45_elena_reckoning` -> `elena_reckoning_ally_propaganda` | `codex_state_media` |
| `data/narrative/act4/act4_week45_elena_reckoning.json` | 90, 136, 177, 218 | `act4_week45_elena_reckoning` -> `elena_reckoning_ally_refuse` | `codex_state_media` |
| `data/narrative/act4/act4_week45_elena_reckoning.json` | 90, 136, 177, 218 | `act4_week45_elena_reckoning` -> `elena_reckoning_enemy_endorse_kolvar` | `codex_state_media` |
| `data/narrative/act4/act4_week45_elena_reckoning.json` | 90, 136, 177, 218 | `act4_week45_elena_reckoning` -> `elena_reckoning_enemy_negotiate_late` | `codex_state_media` |
| `data/narrative/act4/act4_week45_uprising.json` | 51 | `act4_week45_uprising` -> `uprising_ally_khaled` | `codex_general_strike` |
| `data/narrative/act4/act4_week45_uprising.json` | 51 | `act4_week45_uprising` -> `uprising_ally_khaled` | `codex_worker_government_alliance` |
| `data/narrative/act4/act4_week45_uprising.json` | 69 | `act4_week45_uprising` -> `uprising_negotiate_middle` | `codex_tripartite_negotiation` |
| `data/narrative/act4/act4_week45_uprising.json` | 69 | `act4_week45_uprising` -> `uprising_negotiate_middle` | `codex_labor_settlement` |
| `data/narrative/act4/act4_week45_uprising.json` | 88 | `act4_week45_uprising` -> `uprising_break_strike` | `codex_emergency_labor_provisions` |
| `data/narrative/act4/act4_week45_uprising.json` | 88 | `act4_week45_uprising` -> `uprising_break_strike` | `codex_essential_services_doctrine` |
| `data/narrative/act4/act4_week46_final_battle.json` | 62, 80, 102 | `act4_week46_final_battle` -> `final_battle_full_commitment` | `codex_battle_of_gravenmark` |
| `data/narrative/act4/act4_week46_final_battle.json` | 62 | `act4_week46_final_battle` -> `final_battle_full_commitment` | `codex_korven_flanking_operation` |
| `data/narrative/act4/act4_week46_final_battle.json` | 62, 80, 102 | `act4_week46_final_battle` -> `final_battle_calculated_risk` | `codex_battle_of_gravenmark` |
| `data/narrative/act4/act4_week46_final_battle.json` | 62, 80, 102 | `act4_week46_final_battle` -> `final_battle_diplomatic_parallel` | `codex_battle_of_gravenmark` |
| `data/narrative/act4/act4_week46_final_battle.json` | 102 | `act4_week46_final_battle` -> `final_battle_diplomatic_parallel` | `codex_arcturian_intervention_debate` |
| `data/narrative/act4/act4_week46_final_battle.json` | 125 | `act4_week46_final_battle` -> `final_battle_negotiate_ceasefire` | `codex_tyvaren_peace_feelers` |
| `data/narrative/act4/act4_week46_final_battle.json` | 125 | `act4_week46_final_battle` -> `final_battle_negotiate_ceasefire` | `codex_ceasefire_terms` |
| `data/narrative/act4/act4_week47_new_order.json` | 46 | `act4_week47_new_order` -> `new_order_legacy_speech` | `codex_constitutional_republic` |
| `data/narrative/act4/act4_week47_new_order.json` | 46 | `act4_week47_new_order` -> `new_order_legacy_speech` | `codex_veltrian_reform_movement` |
| `data/narrative/act4/act4_week47_new_order.json` | 62 | `act4_week47_new_order` -> `new_order_prepare_transition` | `codex_democratic_transition` |
| `data/narrative/act4/act4_week47_new_order.json` | 62 | `act4_week47_new_order` -> `new_order_prepare_transition` | `codex_constitutional_entrenchment` |
| `data/narrative/act4/act4_week47_new_order.json` | 79 | `act4_week47_new_order` -> `new_order_next_campaign` | `codex_veltrian_elections` |
| `data/narrative/act4/act4_week47_new_order.json` | 79 | `act4_week47_new_order` -> `new_order_next_campaign` | `codex_next_term_agenda` |
| `data/narrative/act4/act4_week48_collapse_endgame.json` | 41 | `act4_week48_collapse_endgame` -> `collapse_resign` | `codex_veltrian_succession` |
| `data/narrative/act4/act4_week48_collapse_endgame.json` | 41 | `act4_week48_collapse_endgame` -> `collapse_resign` | `codex_resignation_precedent` |
| `data/narrative/act4/act4_week48_collapse_endgame.json` | 57 | `act4_week48_collapse_endgame` -> `collapse_double_down` | `codex_economic_recovery_plan` |
| `data/narrative/act4/act4_week48_collapse_endgame.json` | 76 | `act4_week48_collapse_endgame` -> `collapse_orythian_pivot` | `codex_orythian_economic_integration` |
| `data/narrative/act4/act4_week48_collapse_endgame.json` | 76 | `act4_week48_collapse_endgame` -> `collapse_orythian_pivot` | `codex_post_ima_alternatives` |
| `data/narrative/act4/act4_week48_war_outcome.json` | 57, 76 | `act4_week48_war_outcome` -> `war_outcome_victory_speech` | `codex_battle_of_gravenmark_outcome` |
| `data/narrative/act4/act4_week48_war_outcome.json` | 57 | `act4_week48_war_outcome` -> `war_outcome_victory_speech` | `codex_war_memorial` |
| `data/narrative/act4/act4_week48_war_outcome.json` | 57, 76 | `act4_week48_war_outcome` -> `war_outcome_stalemate_negotiation` | `codex_battle_of_gravenmark_outcome` |
| `data/narrative/act4/act4_week48_war_outcome.json` | 76 | `act4_week48_war_outcome` -> `war_outcome_stalemate_negotiation` | `codex_ceasefire_terms` |
| `data/narrative/act4/act4_week48_war_outcome.json` | 98 | `act4_week48_war_outcome` -> `war_outcome_defeat_honest` | `codex_fall_of_kravenstal` |
| `data/narrative/act4/act4_week48_war_outcome.json` | 98 | `act4_week48_war_outcome` -> `war_outcome_defeat_honest` | `codex_occupation_resistance` |
| `data/narrative/act4/act4_week48_war_outcome.json` | 115 | `act4_week48_war_outcome` -> `war_outcome_reconstruction_plan` | `codex_reconstruction_plan` |
| `data/narrative/act4/act4_week48_war_outcome.json` | 115 | `act4_week48_war_outcome` -> `war_outcome_reconstruction_plan` | `codex_veterans_affairs` |
| `data/narrative/act4/act4_week48_war_outcome.json` | 115 | `act4_week48_war_outcome` -> `war_outcome_reconstruction_plan` | `codex_truth_reconciliation` |
| `data/narrative/act4/act4_week52_ending.json` | 38 | `act4_week52_ending` -> `ending_democratic_triumph` | `codex_veltrian_constitution` |
| `data/narrative/act4/act4_week52_ending.json` | 38 | `act4_week52_ending` -> `ending_democratic_triumph` | `codex_democratic_transition_complete` |
| `data/narrative/act4/act4_week52_ending.json` | 52 | `act4_week52_ending` -> `ending_benevolent_autocrat` | `codex_benevolent_autocrat` |
| `data/narrative/act4/act4_week52_ending.json` | 52 | `act4_week52_ending` -> `ending_benevolent_autocrat` | `codex_executive_governance` |
| `data/narrative/act4/act4_week52_ending.json` | 65 | `act4_week52_ending` -> `ending_war_victory` | `codex_veltrian_victory` |
| `data/narrative/act4/act4_week52_ending.json` | 65 | `act4_week52_ending` -> `ending_war_victory` | `codex_war_memorial` |
| `data/narrative/act4/act4_week52_ending.json` | 65 | `act4_week52_ending` -> `ending_war_victory` | `codex_reconstruction_authority` |
| `data/narrative/act4/act4_week52_ending.json` | 77 | `act4_week52_ending` -> `ending_war_defeat` | `codex_occupation_government` |
| `data/narrative/act4/act4_week52_ending.json` | 77 | `act4_week52_ending` -> `ending_war_defeat` | `codex_veltrian_resistance` |
| `data/narrative/act4/act4_week52_ending.json` | 89 | `act4_week52_ending` -> `ending_war_stalemate` | `codex_armistice_terms` |
| `data/narrative/act4/act4_week52_ending.json` | 89 | `act4_week52_ending` -> `ending_war_stalemate` | `codex_border_commission` |
| `data/narrative/act4/act4_week52_ending.json` | 89 | `act4_week52_ending` -> `ending_war_stalemate` | `codex_displaced_persons` |
| `data/narrative/act4/act4_week52_ending.json` | 101 | `act4_week52_ending` -> `ending_military_coup` | `codex_junta_government` |
| `data/narrative/act4/act4_week52_ending.json` | 101 | `act4_week52_ending` -> `ending_military_coup` | `codex_veltrian_exile_government` |
| `data/narrative/act4/act4_week52_ending.json` | 114 | `act4_week52_ending` -> `ending_economic_collapse` | `codex_ima_program` |
| `data/narrative/act4/act4_week52_ending.json` | 114 | `act4_week52_ending` -> `ending_economic_collapse` | `codex_austerity_politics` |
| `data/narrative/act4/act4_week52_ending.json` | 114 | `act4_week52_ending` -> `ending_economic_collapse` | `codex_structural_adjustment` |
| `data/narrative/act4/act4_week52_ending.json` | 127 | `act4_week52_ending` -> `ending_revolutionary` | `codex_veltrian_socialism` |
| `data/narrative/act4/act4_week52_ending.json` | 127 | `act4_week52_ending` -> `ending_revolutionary` | `codex_worker_state` |
| `data/narrative/act4/act4_week52_ending.json` | 127 | `act4_week52_ending` -> `ending_revolutionary` | `codex_orythian_alliance` |
| `data/narrative/act4/act4_week52_ending.json` | 140 | `act4_week52_ending` -> `ending_assassination` | `codex_katerin_ashavel_legacy` |
| `data/narrative/act4/act4_week52_ending.json` | 140 | `act4_week52_ending` -> `ending_assassination` | `codex_succession_crisis` |
| `data/narrative/act4/act4_week52_ending.json` | 153 | `act4_week52_ending` -> `ending_family_sacrifice` | `codex_katerin_ashavel_family` |
| `data/narrative/act4/act4_week52_ending.json` | 153 | `act4_week52_ending` -> `ending_family_sacrifice` | `codex_veltrian_succession` |
| `data/narrative/diplomacy/act2_diplomacy_arcturian_trade.json` | 56, 73, 91 | `act2_diplomacy_arcturian_trade` -> `arcturian_trade_accept` | `codex_arcturia` |
| `data/narrative/diplomacy/act2_diplomacy_arcturian_trade.json` | 56 | `act2_diplomacy_arcturian_trade` -> `arcturian_trade_accept` | `codex_trade_agreement` |
| `data/narrative/diplomacy/act2_diplomacy_arcturian_trade.json` | 56, 73, 91 | `act2_diplomacy_arcturian_trade` -> `arcturian_trade_counter` | `codex_arcturia` |
| `data/narrative/diplomacy/act2_diplomacy_arcturian_trade.json` | 56, 73, 91 | `act2_diplomacy_arcturian_trade` -> `arcturian_trade_refuse` | `codex_arcturia` |
| `data/narrative/diplomacy/act2_diplomacy_lytheira_debt.json` | 56, 74, 92 | `act2_diplomacy_lytheira_debt` -> `lytheira_debt_accept` | `codex_lytheira` |
| `data/narrative/diplomacy/act2_diplomacy_lytheira_debt.json` | 56, 74 | `act2_diplomacy_lytheira_debt` -> `lytheira_debt_accept` | `codex_colonial_history` |
| `data/narrative/diplomacy/act2_diplomacy_lytheira_debt.json` | 56, 74, 92 | `act2_diplomacy_lytheira_debt` -> `lytheira_debt_refuse` | `codex_lytheira` |
| `data/narrative/diplomacy/act2_diplomacy_lytheira_debt.json` | 56, 74 | `act2_diplomacy_lytheira_debt` -> `lytheira_debt_refuse` | `codex_colonial_history` |
| `data/narrative/diplomacy/act2_diplomacy_lytheira_debt.json` | 56, 74, 92 | `act2_diplomacy_lytheira_debt` -> `lytheira_debt_partial` | `codex_lytheira` |
| `data/narrative/diplomacy/act2_diplomacy_orythian_military.json` | 57 | `act2_diplomacy_orythian_military` -> `orythian_military_accept` | `codex_military_cooperation` |
| `data/narrative/diplomacy/act3_diplomacy_arcturian_alliance.json` | 61, 79, 97 | `act3_diplomacy_arcturian_alliance` -> `arcturian_alliance_accept` | `codex_arcturia` |
| `data/narrative/diplomacy/act3_diplomacy_arcturian_alliance.json` | 61 | `act3_diplomacy_arcturian_alliance` -> `arcturian_alliance_accept` | `codex_defense_pact` |
| `data/narrative/diplomacy/act3_diplomacy_arcturian_alliance.json` | 61, 79, 97 | `act3_diplomacy_arcturian_alliance` -> `arcturian_alliance_informal` | `codex_arcturia` |
| `data/narrative/diplomacy/act3_diplomacy_arcturian_alliance.json` | 79 | `act3_diplomacy_arcturian_alliance` -> `arcturian_alliance_informal` | `codex_military_cooperation` |
| `data/narrative/diplomacy/act3_diplomacy_arcturian_alliance.json` | 61, 79, 97 | `act3_diplomacy_arcturian_alliance` -> `arcturian_alliance_refuse` | `codex_arcturia` |
| `data/narrative/diplomacy/act3_diplomacy_morivask_border.json` | 55, 70, 85 | `act3_diplomacy_morivask_border` -> `morivask_deal_accept` | `codex_morivask` |
| `data/narrative/diplomacy/act3_diplomacy_morivask_border.json` | 55, 85 | `act3_diplomacy_morivask_border` -> `morivask_deal_accept` | `codex_border_security` |
| `data/narrative/diplomacy/act3_diplomacy_morivask_border.json` | 55, 70, 85 | `act3_diplomacy_morivask_border` -> `morivask_deal_limited` | `codex_morivask` |
| `data/narrative/diplomacy/act3_diplomacy_morivask_border.json` | 55, 70, 85 | `act3_diplomacy_morivask_border` -> `morivask_deal_refuse` | `codex_morivask` |
| `data/narrative/diplomacy/act3_diplomacy_morivask_border.json` | 55, 85 | `act3_diplomacy_morivask_border` -> `morivask_deal_refuse` | `codex_border_security` |
| `data/narrative/diplomacy/act3_diplomacy_tyvaren_peace.json` | 60, 78 | `act3_diplomacy_tyvaren_peace` -> `tyvaren_peace_counter` | `codex_gravenmark` |
| `data/narrative/diplomacy/act3_diplomacy_tyvaren_peace.json` | 60, 78 | `act3_diplomacy_tyvaren_peace` -> `tyvaren_peace_refuse` | `codex_gravenmark` |
| `data/narrative/projects/act2_project_university_expansion.json` | 27 | `__project__university_expansion` -> `project_university_accept` | `codex_education` |
| `data/narrative/projects/act3_project_ashenmere_metro.json` | 27 | `__project__ashenmere_metro` -> `project_metro_accept` | `codex_ashenmere` |
| `data/narrative/projects/act3_project_sevagrad_fortification.json` | 28 | `__project__sevagrad_fortification` -> `project_sevagrad_accept` | `codex_military` |

---

## Bonus structural findings (outside the six requested checks)

| Check | Result |
|---|---|
| JSON parse errors | 0 (after stripping UTF-8 BOM; see below) |
| Duplicate scene ids | 0 |
| Broken `prerequisiteSceneIds` | 0 |
| Broken `unlocksSceneIds` | 0 |
| Invalid stat paths in `prerequisites` / choice `conditions` / chainTrigger `conditions` | 0 (all 139 distinct condition stat paths resolve via conditionEvaluator aliases, `flags.*`, or GameState) |
| Codex entry with never-set `unlockCondition` flag | 1 -- `character_aleksei_morvec` requires flag `morvec_aleksei_introduced`, which is never set anywhere -> entry unobtainable in-game (src/data/codex/characters.json:147) |
| UTF-8 BOM in JSON data files | 3 -- `src/data/codex/economy.json`, `src/data/codex/nations.json`, `src/data/projects.json`. Vite tolerates this, but raw `JSON.parse` / external tooling fails on these files. |
