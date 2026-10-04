# The Mandate — Game Analysis (Depth Pass, Phase 1)

Branch: `agent/depth-pass` · Baseline commit: `7c8057d` (main) · Analysis date: 2026-10-04

Method: every scene JSON (523), every agenda file (102 files / 379 items), `weekStore.ts`,
`narrativeStore.ts`, `NarrativeEngine.ts`, `conditionEvaluator.ts`, `chainStore.ts` and the map
components were read. Pacing, flag use and live reachability were computed with read-only scripts.
The engine findings in §0 were then **reproduced at runtime** by driving the real Zustand stores
in Chromium (Vite dev server + Playwright, the same method as the screenshot workflow).

Baseline gates on `7c8057d`: `tsc -b` clean · audit: 0 broken links, 67 orphans, 13 flag gaps,
165 dead-end choices, 52 missing resolution beats · unguarded agenda entries: 0.

---

## 0. Read this first — the live game does not play the way the content assumes

The largest problem in the game is not the writing. Six defects stop authored content from
reaching the player, or route the player into the wrong content. The first three are engine
or flow defects and are **halted for Arshad's decision** (see `docs/AGENT_LOG.md`, "HALTED").
The last three are data defects that the audit gates cover. They are fixed in this pass.

| # | Defect | Evidence | Player impact | Status |
|---|---|---|---|---|
| A | After any scene finishes on the map, `advanceQueue` rebuilds the pool with `buildPool()` only (`weekStore.ts:1490`). Everything `initWeek` pushed is dropped: the hardcoded one-offs, radio, petitions, press and campaign. | Runtime: week 22 pool before = `{voss_connection, protest_or_riot, oil_outcome, __radio__}`; after one other scene they are all gone. | At most one `initWeek`-injected scene per week is playable, and only if the player picks it first. Voss, Hawk, Morvec confrontation (wk32), oil arc, border ultimatum (wk40), two letters (wk50) and loyal force (wk44) are all at risk. | **HALTED** (engine). Data mitigation applied: plan item B-5. |
| B | `completeWeek` writes fired chain scenes into `forcedChainIds`. Only `confirmAgenda`/`AgendaSelector` consume that field, and the map flow never enters the `agenda` phase. | Runtime: scheduled `act1_vael_private_meeting` (+1 wk). Next week it is in `forcedChainIds` but **not** in the pool. | **163 scenes are reachable only through delayed chainTriggers, so none of them ever play.** Code-scheduled payoffs fail the same way: mole accusation outcome, project contractors and mid-crises, impeachment, the Tyvaren mobilisation and deficit crises, assassination variants, letter replies, and the recurring family and intel scenes. Same-week (`delayWeeks: 0`) triggers *do* work, because they use `injectScene`. | **HALTED** (engine + save semantics) |
| C | The week ends only when every pool item's `sceneId` is in `visitedSceneIds` (`MapInteractionLayer.tsx`). `__budget__`, `__constitution__`, `__vote__`, `__radio__` and `__cabinet_reshuffle__` are never added to that list. The recurring items (`act_citizen_petitions`, press, rally) share one sceneId, so after their first play they count as already visited forever. | Runtime: after committing the budget, `__budget__` is still in the pool and unvisited. Static: only `processChoice` and CabinetFormation call `markSceneVisited`. | A week with a budget item cannot auto-end through the map. Petitions, press conferences and campaign rallies play once per game, not monthly or weekly. An empty pool also never ends, because `allVisited` returns false when length is 0. | **HALTED** (flow). Fixing A alone would make this worse, since radio would persist. |
| D | `getAvailableChoices` reads only choice-level `conditions`. 10 scenes gate their routing choices with `prerequisites`, which the engine ignores. | Static: `NarrativeEngine.ts:59-67`. Scenes: wk31 strike resolution, wk50 two letters, wk53 second address, wk65 border incident (×2), wk72 deep state, wk78 Ashavel legacy, wk80 black gold, wk92 Aldenmoor tech, wk100 final debate (×3). | The player sees every hidden routing button. In wk78 they pick whether Jonas leaves them. In wk100 they pick which attack Kolvar makes. In wk53 they pick which election result happened. | Fixed (data) |
| E | The wk56 and wk57 agenda prerequisites use `{flag, value}` with no `type: "flag"`. `evaluateCondition` treats them as stat conditions and calls `undefined.startsWith`. | Runtime: `devJumpToWeek(56)` throws `Cannot read properties of undefined (reading 'startsWith')`, and so does week 57. | **Term 2 hard-crashes `initWeek` at week 56** (and for every week those items stay in window). | Fixed (data) |
| F | The wk27 aftermath agenda gates on `referendum_decisive` / `referendum_narrow`, but week 26 sets `referendum_won_decisive` / `referendum_won_narrow`. The "Referendum Lost" aftermath has no gate. | Static: `week27.json` vs `act2_week26_referendum_*.json`. | Every player, winners included, gets "Cabinet at Nine — Referendum Lost". The decisive and narrow aftermaths never play. | Fixed (data) |

Also found (data, fixed where safe):

- `coup_attempted` is read by the Act 3 climax choice `climax_coup_survival_focus`, but nothing sets it. The coup scene sets `coup_resisted` / `coup_negotiated` / … instead. The coup-consolidation option at the climax is therefore never offered.
- `general_brenner` is used as a speaker in 19 scenes and in 21 `characters` arrays. It has no portrait (`oskar_brenner` is the canonical ID, with portrait and colour), so those lines render without a face.
- wk65 `check_tech_level` uses `>= 50` and `<= 50`. At exactly 50, both routes show.
- wk31 strike resolution and wk72 deep state route through gated choices with **no fallback**. Once D is fixed, a player who has none of the gating flags would face zero choices. Both get fallback branches in this pass.

Canon issues found, reported only (not changed; scale or ambiguity):

- "Arcturian" appears **330×** in 88 files. "Arcturian Commonwealth" is written as a *second* power beside the Orythian Dominion, and ambassador Harrison Cole and the Stellamere arc are built on it. A mass rename would merge two distinct powers. **Question for Arshad** (see log). New content in this pass names only the Orythian Dominion.
- "General Vass" appears in `act1_week2_cabinet_formation_meeting.json` (3×) and as `general_vass` in `ministers.ts` and the portrait index. It is a cabinet-formation candidate wired to UI, so it is left as is and reported.

Unreachable by design: **week 104 is never played.** `completeWeek` runs the second election when the counter *reaches* 104 and goes straight to the epilogue. The last playable week is 103. The second-term vote happens between weeks 103 and 104, and the first-term vote between 51 and 52, so week 52 is played *after* the first election.

---

## a) Pacing map — what the player actually gets, weeks 1–104

Counting rule: in map mode every pool item must be played before the week ends (bug C aside), so a
scene plays in the **first week its agenda entry opens**. "Store-injected" items come from
`initWeek` and are fragile (bug A). "Conditional" means gated by flags or stats. `__budget__`,
`__project__` and recurring items are excluded.

Summary:

- **Weeks 1–52 (Term 1)** are dense: 2–9 scenes per week, a budget every week and
  heavy branching in Act 4.
- **Weeks 53–103 (Term 2)** run **one standalone scene per week**. There is no budget, no recurring cast
  and no cross-week threads.
- **Empty weeks (no scene for any player):** 58, 62, 70, 98, 99, 101, 102, 103 (and 104, which is unplayable).
- **Conditional-only weeks (empty for players who don't match):** 56 (constitution in force),
  57 (permanent injury), 83 (nationalised or Aramco oil). Term 1: 44, 45, 48 and 51 are
  branch-conditional.
- **Injected-only weeks (empty if bug A strikes):** 19, 21. Weeks 22, 28, 32 and 40 rely heavily on injection.

| Wk | Unconditional agenda scenes (first appearance) | Conditional | Store-injected | Status |
|---|---|---|---|---|
| 1 | act1_week1_inauguration, act1_week1_vyktor_briefing, act1_week1_family_dinner | — | act1_week1_address_nation, social_inaugural_ball_wk1 | ok |
| 2 | act1_w2_formation_meeting, act1_week1_cabinet_introductions, act1_week1_first_briefing, act1_family_tomas_bullying, act1_week1_parliament_caucus, act1_week1_bni_discovery, act1_serida_introduction, mole_week1_plant | — | mole_week2_plant | ok |
| 3 | act1_week3_first_budget, act1_week3_economic_direction, act1_family_jonas_challenge, act1_family_liora_mikhael, act1_week3_mine_collapse | — | mole_week3_choice | ok |
| 4 | act1_week4_first_month, act1_week1_archbishop_dinner, act1_week4_halvek_portraits, security_posture_choice | — | — | ok |
| 5 | act1_week5_bni_crisis | — | mole_week5_complication | thin |
| 6 | act1_week6_labor_tensions | — | act1_week6_police_incident | thin |
| 7 | act1_week7_tyvaren_airspace | — | act1_week7_commissioner | thin |
| 8 | act1_week8_church_and_state, act1_week8_bni_files | act1_serida_school_funding | — | ok |
| 9 | act1_week9_first_quarter, act1_week9_morvec_dinner, act1_week9_thornfeld_cooperatives | — | — | ok |
| 10 | act1_week10_reform_committee, act1_week10_tyvaren_intel, act1_week10_archbishops_dinner | — | — | ok |
| 11 | act1_week11_kravenstal_powderkeg, act1_week12_nadia_voss, act1_week11_currency_run | — | — | ok |
| 12 | act1_week12_brenner_parade, act2_week12_port_bonds | — | — | ok |
| 13 | act1_week13_no_confidence | — | act1_shadow_hawk_induction | thin |
| 14 | act2_week14_convention_opens, act2_week15_theron_compromise, act2_jonas_op_ed, act2_con_neg_kolvar, act2_con_neg_soraya, act2_con_neg_theron, act2_con_neg_brenner, act2_con_neg_renek, act2_con_neg_kaelen | __project__amber_coast_highway, act2_week14_elena_favor | pipeline_constitution_drafting | ok |
| 15 | act2_week16_kolvar_deal, act2_week19_refugee_flood, act1_week15_dravenni_petition | __project__kravenstal_steel, act2_serida_tomas_factory | pipeline_constitution_committee | ok |
| 16 | act2_week17_church_lobbying, act2_week16_morvec_pressure | __project__university_expansion | pipeline_constitution_floor_vote, act1_shadow_hawk_first_operation | ok |
| 17 | act2_week18_vael_oligarch | — | — | thin |
| 18 | act2_week21_superpower_choice | — | act2_week18_morivask_oil_discovery | thin |
| 19 | — | — | act1_week19_informant_network | injected-only |
| 20 | act2_week20_budget_crisis, act2_week22_nadia_investigation | act2_jonas_workers_housing | act2_week20_oil_negotiation | ok |
| 21 | — | act2_week21_visit_stellamere, act2_week21_visit_petravar | act2_week20_megaproject_choice | injected-only |
| 22 | act2_week24_brenner_warning | act2_week23_family_crisis_jonas, act2_bca_report_wk22, act2_ssd_report_wk22, act2_serida_overhears | act2_week22_oil_outcome, act2_shadow_hawk_voss_connection, act2_week22_protest_or_riot | thin |
| 23 | act2_week23_anonymous_ledger | act2_week23_family_crisis_jonas, act2_week23_family_crisis_liora, act2_week23_family_crisis_tomas | — | thin |
| 24 | act2_week25_referendum_eve | — | act2_week24_voss_introduction | thin |
| 25 | act2_week25_church_schism | — | — | thin |
| 26 | — | act2_week26_referendum_decisive, act2_week26_referendum_narrow, act2_week26_referendum_rejected, act2_week23_family_crisis_jonas, act3_jonas_refugee_stance | — | CONDITIONAL-ONLY |
| 27 | act3_week27_aftermath_rejected, act2_week27_347 | act3_week27_aftermath_decisive, act3_week27_aftermath_narrow | — | ok |
| 28 | act3_constitution_implementation, act3_week32_tyvaren_ultimatum, act3_week28_currency_speculation | __project__sevagrad_fortification, act3_week28_economic_crisis, act3_week28_economic_healthy, act3_jonas_renek_concerns, act3_serida_misses_play, act3_week28_elena_crisis_spin | act2_shadow_hawk_morvec_option, act2_week28_voss_crisis | ok |
| 29 | act3_vyktor_full_disclosure | __project__rural_electrification, act3_week29_vyktor_exposed, act3_week28_economic_crisis | — | thin |
| 30 | act3_week34_dravenhollow, act3_liora_disgusted, act2_week30_strike_wave_part1, act3_week29_assassination_attempt | __project__ashenmere_metro, act3_week30_betrayal_dusek, act3_week30_betrayal_vostane, act3_week30_betrayal_vyktor, act3_jonas_civic_commission, act3_jonas_kolvar_warning | — | ok |
| 31 | act3_week31_inner_circle, act2_week31_strike_resolution | act3_cabinet_loyalty_audit, act3_jonas_separation | — | ok |
| 32 | — | act3_week33_diplomatic_negotiation, act3_week33_war_preparations, act3_week28_economic_healthy, act3_jonas_conservative_attack, act3_jonas_soraya_approval | act2_week32_voss_outcome, act3_week32_morvec_confrontation | injected-only |
| 33 | act3_vyktor_reconciliation | act3_week33_war_preparations, act3_week33_diplomatic_negotiation, act3_bca_report_wk33, act3_ssd_report_wk33 | — | thin |
| 34 | act3_military_democracy_bond, act3_tyvaren_border_skirmish, act3_war_economy | act3_serida_refugee_neighborhood, act3_week34_elena_rival | — | ok |
| 35 | act3_dravenni_autonomy_talks, act3_week36_nadia_publishes | act3_cabinet_loyalty_audit | act3_shadow_hawk_exposure_crisis | ok |
| 36 | act3_national_address_war | act3_week37_coup_attempt, act3_both_agencies_conflict | — | thin |
| 37 | act3_brenner_negotiation, act3_week38_family_reckoning | act3_week37_coup_attempt, act3_week37_military_rally, act3_stellamere_broadcast | — | ok |
| 38 | act3_coalition_government, act3_international_forum_session, act3_week38_two_letters | act3_liora_reconciliation | — | ok |
| 39 | act3_week39_act3_climax | act4_week40_war_begins, act4_week40_exile, act4_week41_reform_implementation | — | thin |
| 40 | act4_civil_conflict_arc | act4_week40_war_begins, act4_week40_exile, act4_week41_reform_implementation, act4_exile_arc | act3_week40_border_ultimatum | thin |
| 41 | act4_family_anchored, act4_national_address | act4_week41_reform_implementation, act4_constitutional_crisis | — | ok |
| 42 | act4_internal_security_state | act4_week42_war_strategy, act4_week42_austerity_bites, act4_ima_renegotiation, act4_emergency_powers_invoked, act4_jonas_foreign_offer | — | thin |
| 43 | act4_family_estranged, act4_family_breaking | act4_week43_family_resolution, act4_diplomatic_endgame | — | ok |
| 44 | — | act4_week44_civilian_front, act4_week44_counter_coup, act4_week44_reform_backlash, act4_dravenni_war_alliance, act4_ceasefire_talks, act3_bca_report_wk44, act3_ssd_report_wk44 | act3_week44_loyal_force | injected-only |
| 45 | — | act4_week45_uprising, act4_ima_confrontation, act4_ceasefire_negotiation, act4_occupation_begins, act4_week45_elena_reckoning | — | CONDITIONAL-ONLY |
| 46 | act4_tomas_redemption | act4_week46_final_battle, act4_forum_showdown, act4_coordinated_response | — | thin |
| 47 | act4_reelection_campaign | act4_week47_new_order, act4_second_referendum, act4_public_mandate | — | thin |
| 48 | — | act4_week48_war_outcome, act4_week48_collapse_endgame, act4_diplomatic_endgame | — | CONDITIONAL-ONLY |
| 49 | act4_family_healing, act4_jonas_divorce, act4_family_conditional, act4_all_fronts | — | — | ok |
| 50 | act4_week50_two_letters | act4_diplomatic_endgame, act4_serida_epilogue | act4_week50_two_letters | thin |
| 51 | — | act4_week47_new_order | — | CONDITIONAL-ONLY |
| 52 | act4_week52_ending, act3_week52_the_kitchen | — | — | ok |
| 53 | act5_week53_second_address | — | — | thin |
| 54 | act5_week54_orphanage_visit | — | — | thin |
| 55 | act5_week55_steel_trust | — | — | thin |
| 56 | — | act5_week56_constitutional_court | — | CONDITIONAL-ONLY |
| 57 | — | act5_week57_fainting_spell | — | CONDITIONAL-ONLY |
| 58 | — | — | — | **EMPTY** |
| 59 | act5_week59_old_flame | — | — | thin |
| 60 | act5_week60_diplomatic_table | — | — | thin |
| 61 | act5_week61_the_birthday | — | — | thin |
| 62 | — | — | — | **EMPTY** |
| 63 | act5_week63_military_procurement, act5_week63_stray_dog | — | — | ok |
| 64 | act5_week64_penicillin_cartel | — | — | thin |
| 65 | act6_week65_border_incident | — | — | thin |
| 66 | act6_week66_smugglers_offer | — | — | thin |
| 67 | act6_week67_bribed_reporter | — | — | thin |
| 68 | act6_week68_morivask_brain_drain | — | — | thin |
| 69 | act6_week69_generals_toast | — | — | thin |
| 70 | — | — | — | **EMPTY** |
| 71 | act6_week71_senators_secret | — | — | thin |
| 72 | act6_week72_deep_state, act6_week72_morivask_summit | — | — | ok |
| 73 | act6_week73_poisoned_pen | — | — | thin |
| 74 | act6_week74_voss_cipher | — | — | thin |
| 75 | act6_week75_geological_survey | — | — | thin |
| 76 | act6_week76_midnight_confession | — | — | thin |
| 77 | act6_week77_factory_explosion | — | — | thin |
| 78 | act6_week78_ashavel_legacy | — | — | thin |
| 79 | act7_week79_frontline_visit | — | — | thin |
| 80 | act6_week80_black_gold | — | — | thin |
| 81 | act6_week81_cadre_bill | — | — | thin |
| 82 | act6_week82_housing_bill | — | — | thin |
| 83 | — | act6_week83_energy_transition | — | CONDITIONAL-ONLY |
| 84 | act6_week84_corporate_deal | — | — | thin |
| 85 | act7_week85_capital_strike | — | — | thin |
| 86 | act6_week86_ghost_payroll | — | — | thin |
| 87 | act6_week87_bni_blackmail | — | — | thin |
| 88 | act7_week88_sovarka_europium | — | — | thin |
| 89 | act6_week89_diluted_medicine | — | — | thin |
| 90 | act7_week90_campaign_trail | — | — | thin |
| 91 | act7_week91_rogue_shadow | — | — | thin |
| 92 | act7_week92_aldenmoor_tech | — | — | thin |
| 93 | act7_week93_wiretapped_chancellor | — | — | thin |
| 94 | act7_week94_vyktor_slush_fund | — | — | thin |
| 95 | act7_week95_saints_sin | — | — | thin |
| 96 | act7_week96_promethean_charter | — | — | thin |
| 97 | act7_week97_foreign_asset | — | — | thin |
| 98 | — | — | — | **EMPTY** |
| 99 | — | — | — | **EMPTY** |
| 100 | act7_week100_final_debate | — | — | thin |
| 101 | — | — | — | **EMPTY** |
| 102 | — | — | — | **EMPTY** |
| 103 | — | — | — | **EMPTY** |
| 104 | — | — | — | **EMPTY** |

---

## b) Tension curve per act

| Act | Weeks | Shape | Sags | Spikes |
|---|---|---|---|---|
| I | 1–13 | Steep, well built. Every week adds a new institutional pressure (BNI, Kravenstal, Tyvaren airspace, currency run) toward the no-confidence vote. | Weeks 5–7 hold one agenda scene each; the injected crises carry them, which bug A puts at risk. | wk5 BNI crisis, wk6 police incident, wk11 currency run, wk13 no-confidence + Hawk induction. |
| II | 14–26 | Strong open (convention, 9 scenes in wk14), then a mid-act lull before the oil arc and the referendum. | **wk17–19**: one scene each (Vael oligarch, superpower choice, informant network). wk19 and wk21 have no agenda scene at all. | wk14 convention, wk20–22 oil arc, wk23 family crisis, wk26 referendum. |
| III | 27–39 | Densest act. The referendum aftermath feeds betrayals, assassination, strike, Voss, Morvec, coup and climax. | Very little sag. wk27 is undermined by bug F (every player gets the "lost" aftermath). | wk30 assassination, wk32 Morvec, wk37 coup, wk39 climax. |
| IV | 40–52 | Branches (war / exile / reform). Each branch chains through its own flags. | Weeks 44, 45, 48 and 51 are branch-conditional only. A player outside the three main branches thins out. The campaign rally meant for 45–51 plays only once (bug C). | wk40 invasion / exile / reform, wk46 final battle, wk50 two letters, wk52 ending. |
| V | 53–64 | **Flat.** One standalone dilemma per week (orphanage, steel trust, court, fainting, old flame, summit, birthday, procurement, penicillin). None refers to another. | **wk58 and wk62 empty.** wk56 and 57 are conditional (and crash, bug E). | wk56 court, wk60 summit, wk64 penicillin. |
| VI | 65–78 | Flat line with good individual scenes. The Tyvaren border (65) is the only escalation, and nothing follows it up. | **wk70 empty.** Morvec (66) and Brenner (69) reappear once and vanish. | wk65 border, wk69 Brenner toast, wk72 deep state, wk78 Ashavel legacy. |
| VII | 79–103 | Election run-up with a few real stakes (Vyktor 94, Kolvar 97, debate 100). The middle is still standalone. | **wk98, 99, 101, 102 and 103 empty.** The campaign ends three weeks before the vote. | wk94 Vyktor (but Vyktor is not in the scene), wk97 Kolvar, wk100 debate. |

The curve rises well through Term 1, then drops to a near-flat line for the whole of Term 2. The
single-scene weeks are individually well written (wk56, wk64 and wk66 meet the quality bar), but
they never compound. No Term 2 scene raises the stakes of an earlier Term 2 scene, and the term
ends on four empty weeks before the vote.

---

## c) Consequence depth — decisions with no echo

- **2,941** distinct flags are set by choices. **2,630 (89%)** are never read by any scene condition,
  agenda prerequisite, chain condition, node condition or TypeScript string literal.
- **1,206** of those come from choices that also move ≥3 stats, i.e. weighty decisions:
  1,098 in Term 1 and 108 in Term 2.
- **Term 2 reads almost nothing from Term 1.** Its full read-set is: `permanent_injury_sustained`,
  `government_captured`, `oligarchs_destroyed`, `oligarch_debts_refused`, `constitution_in_force`,
  plus its own wk60/wk75/wk80/wk97 flags. Term 1's coup, war, exile, referendum, Brenner, Hawk,
  Voss, Nadia and family outcomes never surface again after week 52.
- Bug B multiplies this. Most Term 1 echoes were authored as **delayed chainTriggers**, so even the
  echoes that exist never play.

Curated list of **major decisions with no echo** (the set this pass commits to echo; *E-n* refers to
`IMPROVEMENT_PLAN.md`):

| Decision (wk) | Flags | Why it matters |
|---|---|---|
| Commissioner appointment (7) | `commissioner_vasic_appointed`, `_solc_`, `_stanko_` | The police chief shapes every later street and crowd scene. Today only news reads it. |
| Morvec confrontation (32) | `morvec_antagonized`, `morvec_threatened`, `morvec_appeased` | Stefan Morvec warns that he "will not always hold Aleksei's leash". It never pays off. |
| Coup outcome (37) | `coup_resisted`, `coup_negotiated`, `coup_confronted_directly`, `coup_succeeded` | Brenner returns at wk69 as if the coup never happened. |
| Act III climax (39) | `act3_climax_war_footing`, `_diplomatic`, `_hold_all`, `_personal`, `_internal_focus`, `_narrative` | The defining choice of Term 1. Nothing in Term 2 recalls it. |
| 3:47 detention (27) | flags in `act2_week27_347` | A quiet moral line crossed (or not). Never mentioned again. |
| Referendum (26) | `referendum_won_decisive`, `referendum_won_narrow`, `referendum_failed` | Bug F already erases it at wk27. |
| Orphanage (54) | `orphanage_saved`, `orphanage_promise_broken`, `orphanage_ignored` | Liora's test of Katerin. Liora never appears again. |
| Steel trust (55) | `steel_trust_subsidized`, `_broken`, `_nationalized` | Kravenstal, the father's town. |
| Constitutional Court (56) | `court_overridden`, `court_ruling_accepted`, `court_purged` | A purge of judges is the most authoritarian act in Term 2. Nobody mentions it. |
| Fainting spell (57) | `injury_publicly_admitted`, `press_intimidated` | Press relations. |
| Summit (60) | `tyvaren_treaty_signed`, `orythian_pact_signed`, `diplomatic_isolation`, `lytheiran_ties_severed` | Read once at wk65. `lytheiran_ties_severed` (the coal supply) never matters. |
| Penicillin cartel (64) | `generic_lab_built`, `penicillin_cartel_paid`, `penicillin_crisis_ignored` | wk89 is literally about diluted medicine and does not know about the state lab. |
| Smuggler's offer (66) | `smuggler_bribe_taken`, `smuggler_bribe_refused`, `smugglers_arrested` | A personal bribe from Morvec, never collected on. |
| Bribed reporter (67) | `reporter_arrested`, `reporter_turned`, `tape_buried` | Press arc. |
| Brenner's toast (69) | `brenner_fired_publicly`, `generals_toast_countered`, `generals_toast_ignored` | Firing the chief of the general staff in public has no follow-up. |
| Deep state (72) | `terror_plot_stopped`, `war_with_oligarchs`, `coup_plot_stopped` | Krel's shadow operations. |
| Midnight confession / Ashavel legacy (76, 78) | `family_united`, `jonas_divorce` | Read only by the debate. |
| Ghost payroll (86) | `ghost_payroll_purged`, `_phased`, `_krel` | |
| Renek's cousin (89) | `renek_cousin_arrested`, `renek_cousin_assassinated` | wk95 "Saint's Sin" is about Renek and does not know. |
| Rogue shadow (91) | `krel_rogue_covered`, `krel_rogue_punished`, `krel_men_arrested` | |
| Vyktor's slush fund (94) | `vyktor_exposed`, `vyktor_covered`, `vyktor_slush_taken` | The central relationship of the game resolves off-screen, and Vyktor is not in the scene. |
| Kolvar foreign asset (97) | `kolvar_arrested_treason`, `kolvar_blackmailed_dropout` (`kolvar_exposed_press` is read by wk100) | Arresting the opposition leader before an election, then nothing. |
| Final debate (100) | `debate_chose_attack`, `_record`, `_concede`, `debate_wednesday_*` | Followed by four empty weeks. |
| Stray dog (63) | `stray_dog_adopted` | A small personal choice; an ideal cheap echo. |

---

## d) Underused characters, factions, stats

Dialogue lines by band (A1 = wk1–13 … A5 = 53–64, A6 = 65–78, A7 = 79–103):

| Character | A1 | A2 | A3 | A4 | A5 | A6 | A7 | Note |
|---|---|---|---|---|---|---|---|---|
| Vyktor Reznik | 248 | 134 | 99 | 31 | 12 | 9 | 33 | Carries Term 1. Nearly silent in Term 2, and absent from his own reckoning (wk94). |
| Irina / Colonel Dusek | 66 | 12 | 42 | 17 | 1 | 8 | 1 | The army's loyal officer disappears after the coup. |
| Matthias Krel | 20 | 37 | 41 | 0 | 0 | 4 | 1 | Term 2 leans on "Krel's people" in descriptions but rarely gives him lines. |
| Oskar / General Brenner | 16 | 11 | 14 | 5 | 0 | 1 | 0 | The coup antagonist gets one Term 2 scene (a toast). |
| Stefan / Aleksei Morvec | 0 | 0 | 18 | 0 | 0 | 1 | 0 | Aleksei has a portrait and **no dialogue**. |
| Drazen Kolvar | 21 | 9 | 4 | 0 | 0 | 0 | 11 | The opposition leader is absent for 45 weeks, then is suddenly a foreign asset. |
| Nadia Voss | 5 | 5 | 4 | 1 | 1 | 1 | 2 | The press is a named theme of the game, but its journalist barely speaks. |
| Jonas / Liora / Tomas | 47 | 8 | 17 | 3 | 6 | 4 | 0 | The family recedes in Term 2. Tomas has **0** Term 2 lines. |
| Renek / Church | 14 | 11 | 2 | 0 | 0 | 1 | 1 | The Church is a whole faction with no Term 2 voice until wk95. |
| Gregor Marić, Aldric Theron, Elara Vostane | strong A1–A3 | | | | ≤5 | ≤5 | ≤14 | The cabinet rarely meets *as a cabinet* in Term 2. |

Factions and stats:

- Stats written heavily but never read: `nation.civilLiberties` (250 writes / 0 reads),
  `nation.corruption` (147 / 0), `shadowInfluence` (55 / 0 in conditions), `morvecInfluence` (38 / 0),
  `tyvarenHostility` (32 / 0 in scenes; the engine reads it at 70), `personal.stressLevel` (only the
  nightmare scene reads it).
- **Iron Covenant** (the army faction) is written 465 times and read 5 times.
- Legacy alias stats (`public_trust`, `labor_approval`, `security_rating`, …) are still written in Act 1.
  The evaluator aliases them, so this is cosmetic.

---

## e) Flat scenes (functional but generic)

Scored by word count, segment depth, speaker count and bare "(Continue)" closers, then read.

1. **wk94 `act7_week94_vyktor_slush_fund`** (167 words, 0 segments). The game's central relationship
   resolves in one paragraph. Vyktor is not present, and all three choices end with no consequence beat.
2. **wk97 `act7_week97_foreign_asset`** (178 words, 0 segments). Arresting the opposition leader for treason
   on the eve of an election has no aftermath beat.
3. **wk63 `act5_week63_military_procurement`** (193 words). A price list; the choices differ only in stat deltas.
4. **The 17 Term 2 scenes with one-node "(Continue)" endings** (wk54, 57, 59, 61, 66, 67, 69, 73, 76, 77, 83,
   86, 87, 89, 79, 91, 93). The consequence is a single monologue, then a bare "(Continue)".
   Most of these scenes are otherwise good (wk66 and wk86 are among the best in the game). The ending
   button is the weak point.
5. Act 2/3 Jonas vignettes (`act3_jonas_*`, `act2_jonas_*`, 130–180 words, one speaker, two choices).
   These are serviceable connective tissue, deliberately short; lower priority.
6. `act4_week52_ending` (232 words, 10 gated choices, no speaker). The Term 1 ending reads as a menu.
   Not touched in this pass, to stay clear of ending calculations.

---

## f) Missed set-piece opportunities in existing lore

- **The Morvec succession.** Stefan (wk32) says he "will not always be here to hold [Aleksei's] leash".
  Aleksei has a portrait and was set up at wk9, wk16 and wk32. Term 2 never shows the old man's death
  or the son's first move.
- **Brenner after the coup.** Whatever happened at wk37 (arrested, negotiated, exiled), he is back at
  the gala in wk69 with a glass in his hand. The army's reckoning with its own coup is never staged.
- **Halvek's legacy.** Halvek is dead. His portraits (wk4) and files are Term 1 material only. In Term 2
  his appointees strike down Article 12 (wk56), the system he built is the antagonist, and he is
  never named as such.
- **The press.** Nadia Voss is the only journalist with a face, and she never gets a set piece of her
  own: no interview, no exposé of *this* government. The wk67 reporter scene uses an unnamed anchor.
- **The cabinet as a body.** Term 2 has no cabinet meeting. Ministers appear one at a time with a
  folder. The confrontations (who resigns, who leaks, who wants your job) never happen in a room.
- **Kravenstal and the father.** Katerin's voice leans on her father, and her father's foundry town
  appears in Term 2 only as a policy problem (steel trust, factory explosion). No scene takes her back.
- **Election night.** The second term ends at the debate (wk100). The count, the last temptation and
  the last night are missing; weeks 101–103 are empty.
- **Tyvaren after the border incident.** wk65 escalates; nothing follows. No prisoner exchange,
  no ceasefire line, no Vukov.
- **The refugee crisis.** It is huge in Acts 2–3 (wk19 flood, Dravenni autonomy) and gone in Term 2
  except the Morivask brain drain.
- **The Church.** Renek appears again only at wk95.

---

## g) Other scheduling and logic issues noted

- **Teaser carry-forward entries pull scenes earlier than their titles.** For example, `agenda_w28_tyvaren_intelligence` plays
  `act3_week32_tyvaren_ultimatum` in week 28. Because the map forces every pool item, the "week 32"
  ultimatum plays at 28. There are about 70 such entries. Not changed; flagged for a design decision.
- Week 21 agenda entries for `act2_week21_visit_stellamere` / `_petravar` gate on `chose_arcturian` /
  `chose_orythian`, which are never set. The scenes are reached through `nextNodeId`, so the entries are dead weight.
- `act1_week1_family_dinner` and the `__project__*` items have no `weekDeadline` and stay in every
  week's pool until visited.
- `processChoice` does not run `filterNarrative` on scenes reached by `nextNodeId`, so conditional
  narrative nodes would all show on those scenes. New content in this pass puts conditional nodes only in
  scenes entered through the agenda.
- Choice conditions are evaluated against flags **before** the current choice's flags are added,
  so a segment cannot echo the choice that opened it. That is expected; segments are per-choice anyway.
- Audit false positives: `deficit_critical`, `tyvaren_mobilization`, `mole_correct` and `mole_wrongly_accused`
  are set by TypeScript, and `amber_coast_ftz_signed` by the bill system. All are dead for a
  different reason (bug B).
