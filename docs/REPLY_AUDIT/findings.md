# Reply audit — findings (Phase A)

86 findings. Engine-wide items come first; they explain whole families of per-scene rows.
Confidence: **high** = verified at runtime (D1/D2) or deterministic in code; **medium** = static evidence, needs a read;
**low** = heuristic (keyword or reuse match), expect false positives. Nothing here has been fixed (Phase B waits on review).

## E Engine-wide (8)

| id | scene | choice | what is wrong | proposed fix | confidence |
| --- | --- | --- | --- | --- | --- |
| E1 | (all — 813 reactions in 154 scenes) | (every choice with reactions) | Choice reactions are never readable. ConversationPanel.handleChoice sets them, but the "[choices]" reset effect (ConversationPanel.tsx:553-562) clears them in the same commit, because NarrativeScene builds a new choices array on every render (NarrativeScene.tsx:96-98). D2 measured 9 reaction elements living 0–3 ms: they are inserted and removed before paint. | Key the reset effect on a stable signature (scene id + segment id + choice ids) instead of array identity, and stop it clearing activeReactions. Let the reaction timer own their lifetime. Alternatively memoize choices in NarrativeScene. | high |
| E2 | (748 of 813 reactions) | (terminal choices) | Even with E1 fixed, reactions on terminal choices cannot show: the strip renders only while !sceneDone (ConversationPanel.tsx:1228), and a terminal choice sets sceneDone=true in the same processChoice. These are the bulk of authored reactions. | Render the reaction strip above the Continue line when sceneDone (and delay advanceReady until it has shown), or have terminal choices hold the scene open for the reaction beat. | high |
| E3 | (5 scenes: family_bni_night, family_referendum_night, social_autumn_festival_wk18, social_state_dinner_wk24, social_independence_parade_wk36) | (31 interaction choices) | socialInteractions never play. SocialEvent.tsx is imported nowhere: 9a27631 removed it from GameLayout and routed every scene through NarrativeScene, which reads only scene.choices. The 3 social_event scenes show 2–3 opening nodes and then the engine "Continue…". The 2 family scenes play only their top-level choices. AGENT_LOG Round 7 STEP 2 ("SocialEvent runs socialInteractions") is incorrect. | Decide: re-mount SocialEvent for type social_event (its choice path applies flags and stats via addFlags/applyModifiers), or convert each interaction into a NarrativeScene segment hub. Correct the AGENT_LOG claim either way. | high |
| E4 | family_dinner_recurring, intelligence_briefing_recurring | dinner_continue, briefing_continue | After the first choice moves into a segment, NarrativeScene appends the dinner/briefing injected segments again (NarrativeScene.tsx:58-71 checks only the scene id). The player re-reads 6 injected node(s) they already saw (D1, 3 clicks). | Inject only while activeSegmentId is null (root narrative), or only into the hub segment that should carry it. | high |
| E5 | (26 delayWeeks-0 chains) | (see S9 rows) | delayWeeks 0 triggers are injected unconditionally (narrativeStore.ts:475-498): trigger conditions and probability are ignored, and the target's prerequisites only matter through exclusive[]. 3 chain(s) declare a probability or condition that never applies. | Evaluate trigger.conditions and probability before injectScene (and skip targets whose prerequisites fail), or drop the dead fields from the JSON. | high |
| E6 | (11 reactions, 3 scenes) | cabinet_side_maric, cabinet_side_vyktor, cabinet_own_path, open_files_yourself, give_to_vyktor, leave_sealed, contact_stefan_directly, wait_see_next | Reaction types approval/neutral/disapproval/calculating/uncertain have no render branch (only dialogue/concern/satisfied/action/silence/narrative do), so they render as an empty row even after E1/E2. D2 confirms: 9 reaction(s) on eligible clicks produced no text at all (not even a flash). | Map them to existing types in JSON (approval→satisfied, disapproval/uncertain→concern, neutral/calculating→dialogue), or add a default branch. | high |
| E7 | (16 nextNodeId choices; 0 targets currently affected) | (latent) | nextNodeId targets are used raw (narrativeStore.ts:636, 654): no filterNarrative, no `dialogue` normalisation, no prerequisites or exclusive[]. No current target has conditional nodes, so nothing is wrong today. But a per-node condition added to one would always render. | Route nextNodeId through the same normalise + filterNarrative step loadScene uses. Until then, never add per-node conditions to nextNodeId targets. | medium |
| E8 | (285 gated nodes checked) | (latent) | Segment narrative is filtered with the PRE-choice flags and stats (gameState/activeFlags captured at narrativeStore.ts:410 before applyModifiers). A node gated on the entering choice's own flag never shows. S7 found 0 such nodes today, and D1 found 0 suppressed clicks. | Filter with newFlags and the post-modifier state, or document the rule for authors (gate on flags from EARLIER choices). | medium |

## S2 Shared targets (21)

| id | scene | choice | what is wrong | proposed fix | confidence |
| --- | --- | --- | --- | --- | --- |
| S2-14 | act2_week27_press_followup › (root) | press_followup_specific, press_followup_deflect, press_followup_combative | All three answers land on press_outcome, where Vyktor schedules "the implementation committee… twelve names by Friday", the clearance review and the Khaled meeting. Only press_followup_specific announced those; after deflect or combative the reply cites commitments the player never made. | Give deflect/combative their own reply: split press_outcome into per-answer segments, or route each answer to its own nextNodeId scene. Do not use per-node conditions here: nextNodeId targets are not run through filterNarrative (E7). | high |
| S2-6 | act1_w2_formation_meeting › kolvar_halvek_answer | kolvar_halvek_accept, kolvar_halvek_reject | kolvar_halvek_reject ("I can't put someone who looked away at my Finance Ministry") lands on the same debate as _accept ("bring Vostane back in for a direct debate"): Vostane re-enters and the Kolvar-vs-Vostane debate plays as if Kolvar were still in contention. | Route _reject to a short segment where Kolvar is dismissed (or Vostane is confirmed), then rejoin the hub. | medium |
| S2-1 | act1_week2_cabinet_appointments › pick_finance | pick_finance_vostane, pick_finance_kolvar | 2 choices reach segment:pick_interior with opposite-signed nation.corruption; the shared reply cannot acknowledge which was picked. Target reads as a neutral next-question/close beat. | Probably fine as a neutral hub. Optionally add a one-line acknowledgement per choice (choice reactions, once E1/E2 are fixed). | low |
| S2-2 | act1_week2_cabinet_appointments › pick_interior | pick_interior_oberlin, pick_interior_perov | 2 choices reach segment:pick_labor with opposite-signed factions.reformists, nation.civilLiberties; the shared reply cannot acknowledge which was picked. Target reads as a neutral next-question/close beat. | Probably fine as a neutral hub. Optionally add a one-line acknowledgement per choice (choice reactions, once E1/E2 are fixed). | low |
| S2-3 | act1_week2_cabinet_appointments › pick_labor | pick_labor_maric, pick_labor_vane | 2 choices reach segment:pick_justice with opposite-signed factions.workersCoalition, factions.businessClass, nation.economyHealth; the shared reply cannot acknowledge which was picked. Target reads as a neutral next-question/close beat. | Probably fine as a neutral hub. Optionally add a one-line acknowledgement per choice (choice reactions, once E1/E2 are fixed). | low |
| S2-4 | act1_week2_cabinet_appointments › pick_justice | pick_justice_theron, pick_justice_garachi | 2 choices reach segment:pick_defense with opposite-signed factions.reformists, factions.halvekists, nation.civilLiberties, nation.corruption; the shared reply cannot acknowledge which was picked. Target reads as a neutral next-question/close beat. | Probably fine as a neutral hub. Optionally add a one-line acknowledgement per choice (choice reactions, once E1/E2 are fixed). | low |
| S2-5 | act1_week2_cabinet_appointments › pick_defense | pick_defense_dusek, pick_defense_brenner | 2 choices reach segment:cabinet_handpick_aftermath with opposite-signed factions.ironCovenant, nation.internationalStanding; the shared reply cannot acknowledge which was picked. Target reads as a neutral next-question/close beat. | Probably fine as a neutral hub. Optionally add a one-line acknowledgement per choice (choice reactions, once E1/E2 are fixed). | low |
| S2-7 | act1_w2_formation_meeting › interior_confrontation | interior_support_oberlin, interior_support_perov, interior_defer_judgment | 3 choices reach segment:defense_ministry_hub with opposite-signed factions.reformists, factions.ironCovenant; the shared reply cannot acknowledge which was picked. Target reads as a neutral next-question/close beat. | Probably fine as a neutral hub. Optionally add a one-line acknowledgement per choice (choice reactions, once E1/E2 are fixed). | low |
| S2-8 | act1_w2_formation_meeting › defense_choice | appoint_dusek, appoint_vass | 2 choices reach segment:transition_to_appointments with opposite-signed factions.ironCovenant, nation.internationalStanding; the shared reply cannot acknowledge which was picked. Target reads as a neutral next-question/close beat. | Probably fine as a neutral hub. Optionally add a one-line acknowledgement per choice (choice reactions, once E1/E2 are fixed). | low |
| S2-9 | act2_week22_oil_outcome › igor_acknowledges_audit | week22_grant_direct_line, week22_deny_direct_line | 2 choices reach segment:tyvaren_retaliation with different flags; the shared reply cannot acknowledge which was picked. Target reads as a neutral next-question/close beat. | Probably fine as a neutral hub. Optionally add a one-line acknowledgement per choice (choice reactions, once E1/E2 are fixed). | low |
| S2-10 | act2_week22_oil_outcome › tyvaren_retaliation | week22_prepare_diplomatic, week22_prepare_economic, week22_prepare_public | 3 choices reach segment:outcome_success_close with different flags; the shared reply cannot acknowledge which was picked. Target reads as a neutral next-question/close beat. | Probably fine as a neutral hub. Optionally add a one-line acknowledgement per choice (choice reactions, once E1/E2 are fixed). | low |
| S2-11 | act2_week22_protest_or_riot › chancellor_in_square | square_speech_accountability, square_speech_patience | 2 choices reach segment:square_speech_end with different flags; the shared reply cannot acknowledge which was picked. Target reads as a neutral next-question/close beat. | Probably fine as a neutral hub. Optionally add a one-line acknowledgement per choice (choice reactions, once E1/E2 are fixed). | low |
| S2-12 | act2_week27_press_conference › (root) | press_q1_confident, press_q1_cautious, press_q1_deflect, press_q1_hostile | 4 choices reach node:act2_week27_press_economy with opposite-signed personal.publicImage, factions.reformists, nation.pressFreedom; the shared reply cannot acknowledge which was picked. Target reads as a neutral next-question/close beat. | Probably fine as a neutral hub. Optionally add a one-line acknowledgement per choice (choice reactions, once E1/E2 are fixed). | low |
| S2-13 | act2_week27_press_economy › (root) | press_q2_engage, press_q2_honest, press_q2_vague | 3 choices reach node:act2_week27_press_followup with opposite-signed personal.publicImage; the shared reply cannot acknowledge which was picked. Target reads as a neutral next-question/close beat. | Probably fine as a neutral hub. Optionally add a one-line acknowledgement per choice (choice reactions, once E1/E2 are fixed). | low |
| S2-15 | act2_week33_sovarka_survey › krel_delay_option | krel_no_delay, krel_yes_delay | 2 choices reach segment:luca_contact with different flags; the shared reply cannot acknowledge which was picked. Target reads as a neutral next-question/close beat. | Probably fine as a neutral hub. Optionally add a one-line acknowledgement per choice (choice reactions, once E1/E2 are fixed). | low |
| S2-16 | act3_tyvaren_pressure › response_options | tyvaren_absorb, tyvaren_negotiate, tyvaren_counter | 3 choices reach segment:pressure_close with opposite-signed nation.publicOrder, factions.reformists; the shared reply cannot acknowledge which was picked. Target reads as a neutral next-question/close beat. | Probably fine as a neutral hub. Optionally add a one-line acknowledgement per choice (choice reactions, once E1/E2 are fixed). | low |
| S2-17 | act3_week29_assassination_attempt › (root) | w34_address_immediately, w34_withdraw_private, w34_demand_response | 3 choices reach segment:seg_investigation with opposite-signed personal.publicImage; the shared reply cannot acknowledge which was picked. Target reads as a neutral next-question/close beat. | Probably fine as a neutral hub. Optionally add a one-line acknowledgement per choice (choice reactions, once E1/E2 are fixed). | low |
| S2-18 | act3_week37_sovarka_outcome › outcome_limited_deal | sovarka_limited_push_exclusive, sovarka_limited_accept | 2 choices reach segment:sovarka_outcome_close_limited with different flags; the shared reply cannot acknowledge which was picked. Target reads as a neutral next-question/close beat. | Probably fine as a neutral hub. Optionally add a one-line acknowledgement per choice (choice reactions, once E1/E2 are fixed). | low |
| S2-19 | act3_week37_sovarka_outcome › sovarka_lost_europium | sovarka_lost_reengage, sovarka_lost_accept | 2 choices reach segment:sovarka_lost_close with different flags; the shared reply cannot acknowledge which was picked. Target reads as a neutral next-question/close beat. | Probably fine as a neutral hub. Optionally add a one-line acknowledgement per choice (choice reactions, once E1/E2 are fixed). | low |
| S2-20 | act3_week44_loyal_force › commissioner_needs | needs_grant_all, needs_grant_line_only | 2 choices reach segment:loyal_force_end with different flags; the shared reply cannot acknowledge which was picked. Target reads as a neutral next-question/close beat. | Probably fine as a neutral hub. Optionally add a one-line acknowledgement per choice (choice reactions, once E1/E2 are fixed). | low |
| S2-21 | act5_week62_the_interview › (root) | interview62_answer_straight, interview62_answer_record | 2 choices reach segment:seg_personal with different flags; the shared reply cannot acknowledge which was picked. Target reads as a neutral next-question/close beat. | Probably fine as a neutral hub. Optionally add a one-line acknowledgement per choice (choice reactions, once E1/E2 are fixed). | low |

## S3 Name/intent (2)

| id | scene | choice | what is wrong | proposed fix | confidence |
| --- | --- | --- | --- | --- | --- |
| S3-1 | act2_chain_arcturian_expulsions | arcturian_expel_quietly | Keyword clash "public" (choice text) vs "quiet" (target arcturian_quiet_expulsion). Read: Expel the primary handler only — the one who recruited Yelena Dorova. Inform the Arcturia… | Review only. The id/target agree on intent, so this is likely a false positive from negated wording ("Inform…", "I won't lie"). | low |
| S3-2 | act7_week99_kitchen_table | kitchen99_tell_truth | Keyword clash "lie" (choice text) vs "truth" (target seg_truth). Read: "If I win, Thursday is the first day of the last two years. I won't lie to you in this ki… | Review only. The id/target agree on intent, so this is likely a false positive from negated wording ("Inform…", "I won't lie"). | low |

## S4 Reaction attribution (5)

| id | scene | choice | what is wrong | proposed fix | confidence |
| --- | --- | --- | --- | --- | --- |
| S4-1 | act2_week26_referendum_decisive | referendum_decisive_reach_out | Reaction by gregor_maric ("He is crying. He is not embarrassed about it. He does not try to hide it.") but gregor_maric is not in the scene's characters [vyktor_reznik, aldric_theron]. | Add gregor_maric to the scene's characters, or reassign the reaction to someone present. | high |
| S4-2 | act2_week26_referendum_decisive | referendum_decisive_reach_out | Reaction by elara_vostane ("52.3 percent.") but elara_vostane is not in the scene's characters [vyktor_reznik, aldric_theron]. | Add elara_vostane to the scene's characters, or reassign the reaction to someone present. | high |
| S4-3 | act2_week26_referendum_decisive | referendum_decisive_reach_out | Reaction by colonel_dusek ("She raises her glass slightly. She does not smile. That's all she does.") but colonel_dusek is not in the scene's characters [vyktor_reznik, aldric_theron]. Also not the roster id used elsewhere (irina_dusek). | Add irina_dusek (and rename the reaction character) to the scene's characters, or reassign the reaction to someone present. | high |
| S4-4 | act2_week26_referendum_rejected | referendum_rejected_fight_on | Reaction by gregor_maric ("He puts his head in his hands. He stays that way for a moment.") but gregor_maric is not in the scene's characters [vyktor_reznik, aldric_theron]. | Add gregor_maric to the scene's characters, or reassign the reaction to someone present. | high |
| S4-5 | act2_week26_referendum_rejected | referendum_rejected_fight_on | Reaction by colonel_dusek ("What do we do tomorrow?") but colonel_dusek is not in the scene's characters [vyktor_reznik, aldric_theron]. Also not the roster id used elsewhere (irina_dusek). | Add irina_dusek (and rename the reaction character) to the scene's characters, or reassign the reaction to someone present. | high |

## S5 Routers (13)

| id | scene | choice | what is wrong | proposed fix | confidence |
| --- | --- | --- | --- | --- | --- |
| S5-1 | act1_week10_tyvaren_intel › (root) | proceed_diplomatic, proceed_intercept, proceed_forward, proceed_bilateral | Branches can be true together, e.g. proceed_diplomatic [tyvaren_diplomatic_response] & proceed_intercept [tyvaren_intercept_policy]; proceed_diplomatic [tyvaren_diplomatic_response] & proceed_forward [tyvaren_forward_deployment]; proceed_diplomatic [tyvaren_diplomatic_response] & proceed_bilateral [tyvaren_bilateral_talks]. The player then sees several identical-looking "(Continue)" options and picks a route blind. | Make the gates mutually exclusive (add !other_flag to all but one branch, in priority order) or collapse them into one branch whose segment uses per-node conditions. | medium |
| S5-2 | act2_week22_oil_outcome › vyktor_reads_telegram | week22_deal_success_path, week22_deal_failed_path | Branches can be true together, e.g. week22_deal_success_path [oil_deal_hybrid_signed] & week22_deal_failed_path [oil_deal_failed]. The player then sees several identical-looking "(Continue)" options and picks a route blind. | Make the gates mutually exclusive (add !other_flag to all but one branch, in priority order) or collapse them into one branch whose segment uses per-node conditions. | medium |
| S5-3 | act2_week22_oil_outcome › vyktor_reads_telegram | (none visible) | Under no relevant flags set every branch is false, so ensureTerminalChoice shows the engine "Continue…" and the scene ends without its outcome. | Add an ungated fallback branch (last in the list) or confirm upstream that one branch flag is always set. | medium |
| S5-4 | act2_week26_megaproject_followup › dev_followup_branch | (none visible) | Under no relevant flags set every branch is false, so ensureTerminalChoice shows the engine "Continue…" and the scene ends without its outcome. | Add an ungated fallback branch (last in the list) or confirm upstream that one branch flag is always set. | medium |
| S5-5 | act2_week31_strike_resolution › (root) | check_morvec_deal, check_maric_deal, check_nationalize_threat | Branches can be true together, e.g. check_morvec_deal [morvec_strike_broken] & check_maric_deal [maric_sent_kravenstal]; check_maric_deal [maric_sent_kravenstal] & check_nationalize_threat [nationalization_threatened]. The player then sees several identical-looking "(Continue)" options and picks a route blind. | Make the gates mutually exclusive (add !other_flag to all but one branch, in priority order) or collapse them into one branch whose segment uses per-node conditions. | medium |
| S5-6 | act3_week37_sovarka_outcome › sovarka_outcome_branch | sovarka_outcome_full_deal, sovarka_outcome_lost, sovarka_outcome_limited_deal | Branches can be true together, e.g. sovarka_outcome_full_deal [sovarka_deal_signed] & sovarka_outcome_lost [sovarka_deferred]; sovarka_outcome_limited_deal [sovarka_limited_deal] & sovarka_outcome_lost [sovarka_deferred]. The player then sees several identical-looking "(Continue)" options and picks a route blind. | Make the gates mutually exclusive (add !other_flag to all but one branch, in priority order) or collapse them into one branch whose segment uses per-node conditions. | medium |
| S5-7 | act3_week37_sovarka_outcome › sovarka_outcome_branch | (none visible) | Under no relevant flags set every branch is false, so ensureTerminalChoice shows the engine "Continue…" and the scene ends without its outcome. | Add an ungated fallback branch (last in the list) or confirm upstream that one branch flag is always set. | medium |
| S5-8 | act5_week53_second_address › check_outcome | path_oligarch_puppet, path_oligarchs_destroyed | Branches can be true together, e.g. path_oligarch_puppet [government_captured] & path_oligarchs_destroyed [oligarchs_destroyed]. The player then sees several identical-looking "(Continue)" options and picks a route blind. | Make the gates mutually exclusive (add !other_flag to all but one branch, in priority order) or collapse them into one branch whose segment uses per-node conditions. | medium |
| S5-9 | act6_week72_deep_state › check_plan | path_oligarchs_destroyed, path_puppet_government, path_isolation_coup | Branches can be true together, e.g. path_oligarchs_destroyed [oligarchs_destroyed] & path_puppet_government [government_captured]; path_oligarchs_destroyed [oligarchs_destroyed] & path_isolation_coup [oligarch_debts_refused]; path_puppet_government [government_captured] & path_isolation_coup [oligarch_debts_refused]. The player then sees several identical-looking "(Continue)" options and picks a route blind. | Make the gates mutually exclusive (add !other_flag to all but one branch, in priority order) or collapse them into one branch whose segment uses per-node conditions. | medium |
| S5-10 | act6_week80_black_gold › check_results | path_full_survey_oil, path_limited_survey_oil, path_no_survey | Branches can be true together, e.g. path_full_survey_oil [geological_survey_funded] & path_limited_survey_oil [geological_survey_limited]; path_full_survey_oil [geological_survey_funded] & path_no_survey [geological_survey_rejected]. The player then sees several identical-looking "(Continue)" options and picks a route blind. | Make the gates mutually exclusive (add !other_flag to all but one branch, in priority order) or collapse them into one branch whose segment uses per-node conditions. | medium |
| S5-11 | act7_week100_final_debate › seg_kolvar_specific | path_kolvar_deflect, path_kolvar_orythia, path_kolvar_oil, path_kolvar_personal | Branches can be true together, e.g. path_kolvar_deflect [kolvar_exposed_press] & path_kolvar_orythia [orythian_pact_signed]; path_kolvar_deflect [kolvar_exposed_press] & path_kolvar_oil [oil_nationalized]; path_kolvar_orythia [orythian_pact_signed] & path_kolvar_oil [oil_nationalized]. The player then sees several identical-looking "(Continue)" options and picks a route blind. | Make the gates mutually exclusive (add !other_flag to all but one branch, in priority order) or collapse them into one branch whose segment uses per-node conditions. | medium |
| S5-12 | mole_week5_complication › (root) | (none visible) | All 3 choices are gated and some flag/stat state makes none visible (e.g. flags {}), leaving only the engine "Continue…". | Add an ungated fallback choice. | low |
| S5-13 | act4_week52_ending › (root) | (none visible) | All 10 choices are gated and some flag/stat state makes none visible (e.g. flags {khaled_alliance}), leaving only the engine "Continue…". | Add an ungated fallback choice. | low |

## S6 Extras (25)

| id | scene | choice | what is wrong | proposed fix | confidence |
| --- | --- | --- | --- | --- | --- |
| S6-21 | vyktor_press_briefing | (scene-level) | Scene has a top-level "reactions" array (2). NarrativeNode has no such field and nothing reads it. | Move the reactions onto the choices they belong to, or delete them. | high |
| S6-22 | mole_week3_choice | (scene-level) | Scene has a top-level "reactions" array (2). NarrativeNode has no such field and nothing reads it. | Move the reactions onto the choices they belong to, or delete them. | high |
| S6-23 | mole_week5_complication | (scene-level) | Scene has a top-level "reactions" array (2). NarrativeNode has no such field and nothing reads it. | Move the reactions onto the choices they belong to, or delete them. | high |
| S6-24 | mole_week7_false_resolve | (scene-level) | Scene has a top-level "reactions" array (2). NarrativeNode has no such field and nothing reads it. | Move the reactions onto the choices they belong to, or delete them. | high |
| S6-25 | mole_week9_reveal | (scene-level) | Scene has a top-level "reactions" array (2). NarrativeNode has no such field and nothing reads it. | Move the reactions onto the choices they belong to, or delete them. | high |
| S6-1 | act1_chain_kolvar_escalation › (root) | kolvar_escalation_purge, kolvar_escalation_concession | Identical reaction reused on choices that set different flags: "vyktor_reznik: He watches. Not with judgment. With attention.". It cannot fit both stances. | Write a stance-specific reaction per choice (after E1/E2 make reactions visible). | low |
| S6-2 | act1_chain_kravenstal_unrest › (root) | kravenstal_compromise_partial, kravenstal_hold_firm | Identical reaction reused on choices that set different flags: "elara_vostane: She is silent. She is already updating her projections.". It cannot fit both stances. | Write a stance-specific reaction per choice (after E1/E2 make reactions visible). | low |
| S6-3 | act1_chain_kravenstal_unrest › (root) | kravenstal_compromise_partial, kravenstal_hold_firm | Identical reaction reused on choices that set different flags: "gregor_maric: Finally.". It cannot fit both stances. | Write a stance-specific reaction per choice (after E1/E2 make reactions visible). | low |
| S6-4 | act1_chain_tyvaren_border_standoff › (root) | border_standoff_apologize, border_standoff_hold | Identical reaction reused on choices that set different flags: "vyktor_reznik: He watches. Not with judgment. With attention.". It cannot fit both stances. | Write a stance-specific reaction per choice (after E1/E2 make reactions visible). | low |
| S6-5 | act1_chain_vael_pressure › (root) | vael_negotiate_selective, vael_charm_counter | Identical reaction reused on choices that set different flags: "lucan_vael: We should discuss the details privately.". It cannot fit both stances. | Write a stance-specific reaction per choice (after E1/E2 make reactions visible). | low |
| S6-6 | act1_chain_watchtower_leak › (root) | watchtower_leak_military_review, watchtower_leak_diplomatic | Identical reaction reused on choices that set different flags: "irina_dusek: She makes a note on her tactical map.". It cannot fit both stances. | Write a stance-specific reaction per choice (after E1/E2 make reactions visible). | low |
| S6-7 | act1_minority_festival_request › (root) | festival_deny, festival_compromise | Identical reaction reused on choices that set different flags: "stanislov_renek: He folds his hands. The gesture is practiced.". It cannot fit both stances. | Write a stance-specific reaction per choice (after E1/E2 make reactions visible). | low |
| S6-8 | act1_vael_hospital_kravenstal › (root) | vael_hospital_accept, vael_hospital_counter | Identical reaction reused on choices that set different flags: "lucan_vael: He smiles. It does not reach his eyes.". It cannot fit both stances. | Write a stance-specific reaction per choice (after E1/E2 make reactions visible). | low |
| S6-9 | act1_vael_party_funding › (root) | vael_funding_refuse, vael_funding_counter | Identical reaction reused on choices that set different flags: "vyktor_reznik: He adjusts his glasses.". It cannot fit both stances. | Write a stance-specific reaction per choice (after E1/E2 make reactions visible). | low |
| S6-10 | vyktor_press_briefing › (root) | vyktor_press_herald_conservative, vyktor_press_standard_wages, vyktor_press_worker_sellout | Identical reaction reused on choices that set different flags: "vyktor_reznik: He adjusts his glasses.". It cannot fit both stances. | Write a stance-specific reaction per choice (after E1/E2 make reactions visible). | low |
| S6-11 | mole_week5_complication › (root) | mole_complication_formal, mole_complication_passive | Identical reaction reused on choices that set different flags: "danika_oberlin: She picks up her pen. She does not write.". It cannot fit both stances. | Write a stance-specific reaction per choice (after E1/E2 make reactions visible). | low |
| S6-12 | act1_chain_constitutional_crisis › (root) | constitutional_crisis_withdraw | Reaction wording leans opposite to the choice ("keep" vs "remove"): aldric_theron[dialogue]: Withdrawn. Ninety days to harden the core provisions. I will... use t… | Read; keyword heuristic only. | low |
| S6-13 | act1_week10_reform_committee › (root) | reform_delay_focus_crisis | Reaction wording leans opposite to the choice ("support" vs "against"): aldric_theron[dialogue]: Next year. I will... continue refining the draft. There are sections … | Read; keyword heuristic only. | low |
| S6-14 | act1_week1_bni_discovery › (root) | bni_redirect | Reaction wording leans opposite to the choice ("against" vs "endorse"): vyktor_reznik[silence]: He does not object. He does not endorse. The silence is its own categ… | Read; keyword heuristic only. | low |
| S6-15 | act2_chain_vostane_resignation › (root) | vostane_ask_to_stay | Reaction wording leans opposite to the choice ("stay" vs "leave"): elara_vostane[silence]: Vostane does not respond immediately. She looks at the pale square on… | Read; keyword heuristic only. | low |
| S6-16 | act2_con_neg_soraya › (root) | neg_soraya_partial | Reaction wording leans opposite to the choice ("support" vs "block"): gregor_maric[silence]: He looks at you for a long moment. The threshold stays at ten percent… | Read; keyword heuristic only. | low |
| S6-17 | act2_vael_referendum_funding › (root) | vael_referendum_refuse | Reaction wording leans opposite to the choice ("announce" vs "quiet"): lucan_vael[silence]: Vael does not respond. He simply stands, adjusts his jacket, and walk… | Read; keyword heuristic only. | low |
| S6-18 | act2_week18_vael_oligarch › (root) | vael_call_bluff_public | Reaction wording leans opposite to the choice ("support" vs "against"): lucan_vael[dialogue]: Vael leans back. For the first time all evening, he smiles — not a wa… | Read; keyword heuristic only. | low |
| S6-19 | act3_week32_tyvaren_ultimatum › (root) | tyvaren_international_appeal_sovarka | Reaction wording leans opposite to the choice ("public" vs "quiet"): vyktor_reznik[dialogue]: One quiet addition, Chancellor — Mirev. Sovarka will not field an arm… | Read; keyword heuristic only. | low |
| S6-20 | act3_week32_tyvaren_ultimatum › (root) | tyvaren_international_appeal_sovarka_limited | Reaction wording leans opposite to the choice ("public" vs "quiet"): vyktor_reznik[dialogue]: One quiet addition, Chancellor — Mirev. Sovarka will not field an arm… | Read; keyword heuristic only. | low |

## S7 Node conditions vs routing (1)

| id | scene | choice | what is wrong | proposed fix | confidence |
| --- | --- | --- | --- | --- | --- |
| S7-1 | act3_port_bonds_return › (root) | port_bonds_collect_full | choice port_bonds_collect_full: dead-choice-gate (amber_coast_ftz_signed) — gate flag is never set anywhere. | Gate on a flag that is actually set (check the intended setter), or remove the gate. | high |

## S9 Immediate chains (8)

| id | scene | choice | what is wrong | proposed fix | confidence |
| --- | --- | --- | --- | --- | --- |
| S9-2 | act3_ashenmere_standoff | standoff_demand_surrender | → act3_face_to_face_brenner plays right after this choice (next queue item). probability 0.3 IGNORED for delay 0. | Either honour the probability (E5) or remove it so the JSON says what the game does. | high |
| S9-4 | act3_loyalist_counter_deploy | counter_deploy_negotiate_units | → act3_ashenmere_standoff plays right after this choice (next queue item). probability 0.4 IGNORED for delay 0. | Either honour the probability (E5) or remove it so the JSON says what the game does. | high |
| S9-5 | act3_loyalist_counter_deploy | counter_deploy_protect_infrastructure | → act3_ashenmere_standoff plays right after this choice (next queue item). probability 0.3 IGNORED for delay 0. | Either honour the probability (E5) or remove it so the JSON says what the game does. | high |
| S9-1 | act3_ashenmere_standoff | standoff_defensive_posture | → act3_brenner_negotiation plays right after this choice (next queue item). cycle with the source scene — the second injection is blocked by injectScene's visited guard. | Confirm the target should play even when its prerequisites are false, or gate the trigger (E5). | medium |
| S9-3 | act3_brenner_negotiation | brenner_refuse_bluff | → act3_ashenmere_standoff plays right after this choice (next queue item). cycle with the source scene — the second injection is blocked by injectScene's visited guard. | Confirm the target should play even when its prerequisites are false, or gate the trigger (E5). | medium |
| S9-6 | act3_vyktor_full_disclosure | push_complete_picture | → act3_vyktor_departure plays right after this choice (next queue item). target prerequisites not guaranteed by this choice (vyktor_exposed) — loadScene only reroutes via exclusive[], otherwise it plays anyway. | Confirm the target should play even when its prerequisites are false, or gate the trigger (E5). | medium |
| S9-7 | act3_vyktor_full_disclosure | accept_partial_disclosure | → act3_vyktor_departure plays right after this choice (next queue item). target prerequisites not guaranteed by this choice (vyktor_exposed) — loadScene only reroutes via exclusive[], otherwise it plays anyway. | Confirm the target should play even when its prerequisites are false, or gate the trigger (E5). | medium |
| S9-8 | act3_vyktor_full_disclosure | narrow_scope | → act3_vyktor_departure plays right after this choice (next queue item). target prerequisites not guaranteed by this choice (vyktor_exposed) — loadScene only reroutes via exclusive[], otherwise it plays anyway. | Confirm the target should play even when its prerequisites are false, or gate the trigger (E5). | medium |

## D1 Unreachable (3)

| id | scene | choice | what is wrong | proposed fix | confidence |
| --- | --- | --- | --- | --- | --- |
| D1-1 | act1_w2_formation_meeting › final_decision | proceed_to_appointments | Segment has no incoming choice, so this option can never be shown (D1: unclicked under every flag set). | Wire a choice to the segment or delete it (and its downstream-only segments). | high |
| D1-2 | act1_w2_formation_meeting › oberlin_plan_to_perov_answer | oberlin_plan_to_perov_to_next | Segment has no incoming choice, so this option can never be shown (D1: unclicked under every flag set). | Wire a choice to the segment or delete it (and its downstream-only segments). | high |
| D1-3 | act1_w2_formation_meeting › oberlin_plan_to_perov_answer | oberlin_plan_to_perov_direct | Segment has no incoming choice, so this option can never be shown (D1: unclicked under every flag set). | Wire a choice to the segment or delete it (and its downstream-only segments). | high |

## D2 per-click results

| group | scene | choice | outcome | status | missing | flash-only (ms) | extra |
| --- | --- | --- | --- | --- | --- | --- | --- |
| term1 | act1_chain_bni_press | bni_press_engage | terminal | match | — | — | — |
| term1 | act1_chain_bni_press | bni_press_selective | terminal | match | — | — | — |
| term1 | act1_chain_bni_press | bni_press_conference | terminal | match | — | — | — |
| term1 | act3_arcturian_sanctions | arcturian_sanctions_alternative_markets | terminal | match | — | — | — |
| term1 | act3_arcturian_sanctions | arcturian_sanctions_negotiate_relief | terminal | match | — | — | — |
| term1 | act3_arcturian_sanctions | arcturian_sanctions_deepen_orythian | terminal | match | — | — | — |
| term1 | act3_second_attack | second_attack_declare_emergency | terminal | match | — | — | — |
| term1 | act3_second_attack | second_attack_double_down | terminal | match | — | — | — |
| term1 | mole_week1_plant | mole_w1_acknowledge | terminal | match | — | — | — |
| term1 | mole_week1_plant | mole_w1_dismiss | terminal | match | — | — | — |
| term1 | act1_week7_commissioner | review_vasic | segment→vasic_presents | match | — | — | — |
| term1 | act1_week7_commissioner | review_solc | segment→solc_presents | match | — | — | — |
| term1 | act1_week7_commissioner | review_stanko | segment→stanko_presents | match | — | — | — |
| term1 | pipeline_constitution_committee | whip_bribe | terminal | match | — | — | — |
| term1 | pipeline_constitution_committee | whip_fail | terminal | match | — | — | — |
| term1 | act2_week23_family_crisis_liora | liora_let_process_run | terminal | match | — | — | — |
| term1 | act2_week23_family_crisis_liora | liora_go_personally | terminal | match | — | — | — |
| term1 | act2_week23_family_crisis_liora | liora_executive_release | terminal | match | — | — | — |
| term1 | act2_week23_family_crisis_liora | liora_send_vyktor | terminal | match | — | — | — |
| term1 | act3_jonas_civic_commission | jonas_commission_encourage | terminal | match | — | — | — |
| term1 | act3_jonas_civic_commission | jonas_commission_discourage | terminal | match | — | — | — |
| term1 | act3_stellamere_broadcast | stellamere_broadcast_defiance | terminal | match | — | — | — |
| term1 | act3_stellamere_broadcast | stellamere_broadcast_diplomatic | terminal | match | — | — | — |
| term1 | act3_stellamere_broadcast | stellamere_broadcast_personal | terminal | match | — | — | — |
| term1 | act4_week51_two_speeches | concession51_handover | segment→seg_handover | match | — | — | — |
| term1 | act4_week51_two_speeches | concession51_opposition | segment→seg_opposition | match | — | — | — |
| term1 | act4_week51_two_speeches | concession51_unwritten | segment→seg_unwritten | match | — | — | — |
| term2 | act5_week54_orphanage_visit | donate_personal_wealth | segment→seg_donate | match | — | — | — |
| term2 | act5_week54_orphanage_visit | promise_state_funding | segment→seg_promise | match | — | — | — |
| term2 | act5_week54_orphanage_visit | walk_out | segment→seg_walkout | match | — | — | — |
| term2 | act5_week58_cabinet_table | cabinet58_cut_defense | segment→seg_cut_defense | match | — | — | — |
| term2 | act5_week58_cabinet_table | cabinet58_cut_pensions | segment→seg_cut_pensions | match | — | — | — |
| term2 | act5_week58_cabinet_table | cabinet58_shipping_levy | segment→seg_shipping_levy | match | — | — | — |
| term2 | act5_week58_cabinet_table | cabinet58_miss_coupon | segment→seg_miss_coupon | match | — | — | — |
| term2 | act5_week63_military_procurement | buy_orythian_jets | segment→seg_jets | match | — | — | — |
| term2 | act5_week63_military_procurement | build_domestic_tanks | segment→seg_tanks | match | — | — | — |
| term2 | act5_week63_military_procurement | fortify_border | segment→seg_fortify | match | — | — | — |
| term2 | act5_week63_military_procurement | skip_procurement | segment→seg_skip | match | — | — | — |
| term2 | act6_week69_generals_toast | toast_obedience | segment→seg_toast_obedience | match | — | — | — |
| term2 | act6_week69_generals_toast | laugh_it_off | segment→seg_laugh_off | match | — | — | — |
| term2 | act6_week69_generals_toast | fire_brenner_publicly | segment→seg_fire_public | match | — | — | — |
| term2 | act6_week74_last_audience | succession_give_word | segment→seg_word | match | — | — | — |
| term2 | act6_week74_last_audience | succession_take_ledger | segment→seg_ledger | match | — | — | — |
| term2 | act6_week74_last_audience | succession_refuse | segment→seg_refuse | match | — | — | — |
| term2 | act7_week79_frontline_visit | full_tour_speech | segment→seg_speech | match | — | — | — |
| term2 | act7_week79_frontline_visit | quiet_visit | segment→seg_quiet | match | — | — | — |
| term2 | act7_week79_frontline_visit | cancel_visit | segment→seg_cancel | match | — | — | — |
| term2 | act7_week85_capital_strike | austerity_measures | segment→seg_austerity | match | — | — | — |
| term2 | act7_week85_capital_strike | print_money | segment→seg_print | match | — | — | — |
| term2 | act7_week85_capital_strike | personal_bailout | segment→seg_bailout | match | — | — | — |
| term2 | act7_week90_campaign_trail | campaign_kravenstal | segment→seg_kravenstal | match | — | — | — |
| term2 | act7_week90_campaign_trail | campaign_thornfeld | segment→seg_thornfeld | match | — | — | — |
| term2 | act7_week90_campaign_trail | campaign_ashenmere | segment→seg_ashenmere | match | — | — | — |
| term2 | act7_week96_promethean_charter | implement_charter_full | segment→seg_charter_full | match | — | — | — |
| term2 | act7_week96_promethean_charter | implement_charter_vetted | segment→seg_charter_vetted | match | — | — | — |
| term2 | act7_week96_promethean_charter | reject_charter | segment→seg_reject_charter | match | — | — | — |
| term2 | act7_week103_election_eve | eve103_refuse | segment→seg_refuse | match | — | — | — |
| term2 | act7_week103_election_eve | eve103_let_krel | segment→seg_wax | match | — | — | — |
| term2 | act7_week103_election_eve | eve103_observers | segment→seg_observers | match | — | — | — |
| term2 | act7_week103_election_eve | eve103_close_quiet_office | segment→seg_close | match | — | — | — |
| branching | act1_week9_morvec_dinner | ask_about_morvec | segment→vyktor_on_morvec | match | — | — | — |
| branching | act1_week9_morvec_dinner | should_go_question | segment→go_question | match | — | — | — |
| branching | act1_week9_morvec_dinner | who_else_present | segment→dinner_guests | match | — | — | — |
| branching | act2_week14_convention_opens | ask_kolvar_objection | segment→kolvar_concern | match | — | — | — |
| branching | act2_week14_convention_opens | ask_theron_status | segment→theron_status | match | — | — | — |
| branching | act2_week14_convention_opens | ask_vyktor_read | segment→vyktor_delegate_count | match | — | — | — |
| branching | act1_week2_cabinet_appointments | start_finance | segment→finance_discussion | match | — | — | — |
| branching | act1_week2_cabinet_appointments | start_interior | segment→interior_discussion | match | — | — | — |
| branching | act1_week2_cabinet_appointments | start_defense | segment→defense_discussion | match | — | — | — |
| branching | act1_week2_cabinet_appointments | start_overview | segment→full_overview | match | — | — | — |
| branching | act2_week20_oligarch_meeting | ask_who_anyway | segment→vyktor_refuses | match | — | — | — |
| branching | act2_week20_oligarch_meeting | accept_dont_ask | segment→entering_the_room | match | — | — | — |
| branching | act2_week20_oligarch_meeting | ask_what_offer | segment→the_other_offer | match | — | — | — |
| branching | act1_week10_church_education | ask_theron_position | segment→theron_explains | match | — | — | — |
| branching | act1_week10_church_education | ask_renek_objection | segment→renek_objection | match | — | — | — |
| branching | act1_week10_church_education | ask_scope | segment→education_scope | match | — | — | — |
| branching | act1_week5_bni_crisis | read_the_file | segment→reading_the_file | match | — | — | — |
| branching | act1_week5_bni_crisis | dont_read | segment→oberlin_waits | match | — | — | — |
| branching | act1_week5_bni_crisis | ask_oberlin_first | segment→oberlin_explains | match | — | — | — |
| branching | act1_week8_vael_offer | ask_about_vael | segment→vael_background | match | — | — | — |
| branching | act1_week8_vael_offer | ask_about_proposal | segment→proposal_speculation | match | — | — | — |
| branching | act1_week8_vael_offer | ask_vyktor_instinct | segment→vyktor_instinct | match | — | — | — |
| branching | act1_week8_vael_offer | ask_why_no_channels | segment→why_informal | match | — | — | — |
| branching | act1_week1_inauguration | speech_unity | segment→unity_speech | match | — | — | — |
| branching | act1_week1_inauguration | speech_reform | segment→reform_speech | match | — | — | — |
| branching | act1_week1_inauguration | speech_personal | segment→personal_speech | match | — | — | — |
| branching | act1_week7_tyvaren_airspace | ask_capability | segment→tyvaren_capability | match | — | — | — |
| branching | act1_week7_tyvaren_airspace | ask_why_now | segment→tyvaren_why_now | match | — | — | — |
| branching | act1_week7_tyvaren_airspace | ask_dusek_recommend | segment→dusek_recommendation | match | — | — | — |
| branching | act1_week7_tyvaren_airspace | ask_theron_history | segment→theron_history | match | — | — | — |
| branching | act1_week19_informant_network | hear_commissioner_alone | segment→commissioner_alone | match | — | — | — |
| branching | act1_week19_informant_network | hear_commissioner_with_vyktor | segment→commissioner_with_vyktor | match | — | — | — |
| branching | act1_week19_informant_network | bring_oberlin_too | segment→commissioner_with_oberlin | match | — | — | — |
| reaction-probe | act1_week1_cabinet_introductions | cabinet_side_maric | segment→cabinet_maric_wins | MISMATCH | reaction: Finally. Someone who understands what t… ⏎ reaction: Noted. I will prepare the implementatio… | — | — |
| reaction-probe | act1_week1_cabinet_introductions | cabinet_side_vyktor | segment→cabinet_vyktor_wins | MISMATCH | reaction: A sound instinct. I will have a full br… ⏎ reaction: The people waiting on those pensions wi… | — | — |
| reaction-probe | act1_week1_cabinet_introductions | cabinet_own_path | segment→cabinet_both | MISMATCH | reaction: That will require significant coordinat… ⏎ reaction: I can work with that. | — | — |
| reaction-probe | act1_week1_first_briefing | priority_economy | segment→priority_economy | MISMATCH | — | reaction 0, reaction 0, reaction 0 | — |
| reaction-probe | act1_week1_first_briefing | priority_security | segment→priority_security | MISMATCH | — | reaction 3, reaction 3, reaction 3 | — |
| reaction-probe | act1_week1_first_briefing | priority_reform | segment→priority_reform | MISMATCH | — | reaction 1, reaction 1, reaction 1 | — |
| reaction-probe | act1_week1_vyktor_briefing | open_files_yourself | segment→files_opened | MISMATCH | reaction: He nods once. No expression. 'I will le… | — | — |
| reaction-probe | act1_week1_vyktor_briefing | give_to_vyktor | segment→files_delegated | MISMATCH | reaction: 'Understood.' He takes the folder. 'I w… | — | — |
| reaction-probe | act1_week1_vyktor_briefing | leave_sealed | segment→files_sealed | MISMATCH | reaction: 'All right.' He closes the outer folder… | — | — |
