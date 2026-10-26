# P2 — Scheduling Audit Weeks 21-104 + Act Boundaries (READ-ONLY)

Inputs: `00-inventory.md` week map (agenda 81 `week*.json` + hardcoded `weekStore.ts:71-148,443-946`); scene weeks via `week`/`weekAvailable`/filename.
Reference fallback pattern: week65 `check_stance` (`src/data/narrative/act6/act6_week65_border_incident.json:99-149`: 3 single-flag gates + triple-false `path_no_diplomacy:137-149`) and week80 `check_results` (`src/data/narrative/act6/act6_week80_black_gold.json:80-130`: `funded/limited/rejected` + triple-false `path_no_survey_data:118-130`). A group with gated choices and NO ungated choice and NO all-false negation is flagged NO-FALLBACK.

## 6. SCHEDULING WEEKS 21-104

Counts (21-104): UNREACHABLE=75 (1 NOT_IN_REGISTRY + 74 window-pattern) | SKIPPABLE-MANDATORY per-occurrence=69 (rollup: 38 ALL-OPTIONAL scenes) | NO-FALLBACK=5 | VARIANT-NODISTINGUISH=0.

### (a) Reachable

TRUE BROKEN (agenda references missing scene): 1:

- BROKEN | src/data/agenda/week83.json:7 | agenda_w83_energy_transition | scene=act6_week83_energy_transition | NOT_IN_REGISTRY (no `*energy_transition*`/`*week83*` under `src/data/narrative/`)

Window-pattern (74): agenda carry-forwards/teasers (item scheduled before/after scene JSON window, e.g. `W21 agenda_w21_press_strategy → act2_week22_nadia_investigation src_week=22` per `_p2e_out.txt`) + recurring-template reuse (`act_citizen_petitions.json` deadline 5 / `act_monthly_press_conference.json` deadline 7 reused weekly via dynamic `weekAvailable=currentWeek, weekDeadline=currentWeek+1` per `weekStore.ts:901-930`, so JSON-deadline comparison over-flags). These are intentional patterns, not registry breaks. Full 74 in `_p2e_out.txt`.

### (b) Mandatory survives skip-all-optional

Per-scene rollup (`_p2f_out.txt`): MAND-NO-OCC=183 (chain-fed, no agenda/hard occurrence — survive only if chain fires) + MAND-ALL-OPTIONAL=38 (agenda occurrence(s) all `slotCost>0` non-urgent non-hard — a player skipping ALL optional misses them). Examples (per-occurrence sample; full 69 per-occurrence rows in `_p2e_out.txt`):

- SCHED-SKIPPABLE-MANDATORY | W22 | agenda=agenda_w22_brenner_visit | scene=act2_week24_brenner_warning | slotCost=1 urgent=False | src/data/narrative/act2/act2_week24_brenner_warning.json | weekDeadline=26
- SCHED-SKIPPABLE-MANDATORY | W23 | agenda=agenda_w23_refugee_update | scene=act2_week19_refugee_flood | slotCost=1 urgent=False | src/data/narrative/act2/act2_week19_refugee_flood.json | weekDeadline=20
- SCHED-SKIPPABLE-MANDATORY | W24 | agenda=agenda_w24_referendum_prep | scene=act2_week25_referendum_eve | slotCost=1 urgent=False | src/data/narrative/act2/act2_week25_referendum_eve.json | weekDeadline=26
- SCHED-SKIPPABLE-MANDATORY | W25 | agenda=agenda_w25_brenner_final | scene=act2_week24_brenner_warning | slotCost=1 urgent=False | src/data/narrative/act2/act2_week24_brenner_warning.json | weekDeadline=26
- SCHED-SKIPPABLE-MANDATORY | W28 | agenda=agenda_w28_constitution_implementation | scene=act3_constitution_implementation | slotCost=1 urgent=False | src/data/narrative/act3/act3_constitution_implementation.json | weekDeadline=ABSENT
- SCHED-SKIPPABLE-MANDATORY | W28 | agenda=agenda_w28_tyvaren_intelligence | scene=act3_week32_tyvaren_ultimatum | slotCost=1 urgent=False | src/data/narrative/act3/act3_week32_tyvaren_ultimatum.json | weekDeadline=34
- SCHED-SKIPPABLE-MANDATORY | W29 | agenda=agenda_w29_tyvaren_update | scene=act3_week32_tyvaren_ultimatum | slotCost=1 urgent=False | src/data/narrative/act3/act3_week32_tyvaren_ultimatum.json | weekDeadline=34
- SCHED-SKIPPABLE-MANDATORY | W30 | agenda=agenda_w30_dravenhollow_preview | scene=act3_week34_dravenhollow | slotCost=1 urgent=False | src/data/narrative/act3/act3_week34_dravenhollow.json | weekDeadline=36
- SCHED-SKIPPABLE-MANDATORY | W30 | agenda=agenda_w30_assassination_attempt | scene=act3_week29_assassination_attempt | slotCost=2 urgent=False | src/data/narrative/act3/act3_week29_assassination_attempt.json | weekDeadline=30
- SCHED-SKIPPABLE-MANDATORY | W31 | agenda=agenda_w31_tyvaren_deadline | scene=act3_week32_tyvaren_ultimatum | slotCost=1 urgent=False | src/data/narrative/act3/act3_week32_tyvaren_ultimatum.json | weekDeadline=34
- SCHED-SKIPPABLE-MANDATORY | W32 | agenda=agenda_w32_diplomatic_channels | scene=act3_week33_diplomatic_negotiation | slotCost=1 urgent=False | src/data/narrative/act3/act3_week33_diplomatic_negotiation.json | weekDeadline=35
- SCHED-SKIPPABLE-MANDATORY | W32 | agenda=agenda_w32_military_assessment | scene=act3_week33_war_preparations | slotCost=1 urgent=False | src/data/narrative/act3/act3_week33_war_preparations.json | weekDeadline=35
- SCHED-SKIPPABLE-MANDATORY | W32 | agenda=agenda_w32_dravenni_question | scene=act3_week34_dravenhollow | slotCost=1 urgent=False | src/data/narrative/act3/act3_week34_dravenhollow.json | weekDeadline=36
- SCHED-SKIPPABLE-MANDATORY | W33 | agenda=agenda_w33_dravenni_mobilization | scene=act3_week34_dravenhollow | slotCost=1 urgent=False | src/data/narrative/act3/act3_week34_dravenhollow.json | weekDeadline=36
- SCHED-SKIPPABLE-MANDATORY | W34 | agenda=agenda_w34_military_democracy | scene=act3_military_democracy_bond | slotCost=1 urgent=False | src/data/narrative/act3/act3_military_democracy_bond.json | weekDeadline=ABSENT
- SCHED-SKIPPABLE-MANDATORY | W34 | agenda=agenda_w34_border_skirmish | scene=act3_tyvaren_border_skirmish | slotCost=1 urgent=False | src/data/narrative/act3/act3_tyvaren_border_skirmish.json | weekDeadline=ABSENT
- SCHED-SKIPPABLE-MANDATORY | W34 | agenda=agenda_w34_war_economy | scene=act3_war_economy | slotCost=1 urgent=False | src/data/narrative/act3/act3_war_economy.json | weekDeadline=ABSENT
- SCHED-SKIPPABLE-MANDATORY | W35 | agenda=agenda_w35_dravenni_autonomy | scene=act3_dravenni_autonomy_talks | slotCost=1 urgent=False | src/data/narrative/act3/act3_dravenni_autonomy_talks.json | weekDeadline=ABSENT
- SCHED-SKIPPABLE-MANDATORY | W35 | agenda=agenda_w35_border_skirmish | scene=act3_tyvaren_border_skirmish | slotCost=1 urgent=False | src/data/narrative/act3/act3_tyvaren_border_skirmish.json | weekDeadline=ABSENT
- SCHED-SKIPPABLE-MANDATORY | W35 | agenda=agenda_w35_nadia_preview | scene=act3_week36_nadia_publishes | slotCost=1 urgent=False | src/data/narrative/act3/act3_week36_nadia_publishes.json | weekDeadline=38

... + 49 more per-occurrence rows in `_p2e_out.txt`. Per-scene ALL-OPTIONAL (38) in `_p2f_out.txt` (e.g. `act3_constitution_implementation` W28 slot1) — strict (b) failures if window has no forced occurrence.

### (c) Conditional gates have fallback

NO-FALLBACK groups (5): every choice gated, no ungated sibling, no all-false negation (reference pattern requires negation):

- SCHED-NO-FALLBACK | W22 | scene=act2_week22_oil_outcome | group=segments.vyktor_reads_telegram | gated=[week22_deal_success_path,week22_deal_failed_path] | src/data/narrative/act2/act2_week22_oil_outcome.json
- SCHED-NO-FALLBACK | W31 | scene=act2_week31_strike_resolution | group=top | gated=[check_morvec_deal,check_maric_deal,check_nationalize_threat] | src/data/narrative/act2/act2_week31_strike_resolution.json
- SCHED-NO-FALLBACK | W52 | scene=act4_week52_ending | group=top | gated=[ending_democratic_triumph,ending_benevolent_autocrat,ending_war_victory,ending_war_defeat] | src/data/narrative/act4/act4_week52_ending.json
- SCHED-NO-FALLBACK | W65 | scene=act6_week65_border_incident | group=segments.check_tech_level | gated=[path_tech_advantage,path_tech_disadvantage] | src/data/narrative/act6/act6_week65_border_incident.json
- SCHED-NO-FALLBACK | W78 | scene=act6_week78_ashavel_legacy | group=segments.check_marriage_state | gated=[path_united,path_divorce] | src/data/narrative/act6/act6_week78_ashavel_legacy.json

Details:
- `act2_week22_oil_outcome.json:segments.vyktor_reads_telegram` (`:45-56` success vs failed, no neither-branch) — if neither `oil_deal_hybrid_signed` nor `oil_deal_failed`, group shows nothing.
- `act2_week31_strike_resolution.json:top` (`:24-30+` 3 gated `check_morvec_deal/maric/nationalize`, no fallback).
- `act4_week52_ending.json:top` (4 gated endings, no fallback — terminal, likely intentional).
- `act6_week65_border_incident.json:segments.check_tech_level:174-199` (`militaryTech>=50` vs `<=50`: overlap at exactly 50 shows BOTH; if stat ABSENT shows NEITHER; no third fallback — even the reference file fails here, while its sibling `check_stance:92-150` PASSES with triple-false fallback).
- `act6_week78_ashavel_legacy.json:segments.check_marriage_state` (`united` vs `divorce`, no single/unknown fallback).

Reference PASS: week65 `check_stance` and week80 `check_results` HAVE triple-false fallbacks (cited above) — the 5 above do not.

### (d) Mutually exclusive variants

VARIANT-NODISTINGUISH=0 (0). Heuristic (same-week agenda pair sharing 3-part stem, both `top.prerequisites=[]`) found none. Note: variant sets like `act3_week27_aftermath_decisive/narrow/rejected` (W27) and `act2_week26_referendum_*` (W26) ARE distinguished upstream (referendum outcome flags) or are player-choice aftermaths, not same-week agenda collisions — no double-scheduling without condition found.

### Weeks 21-104 issues grouped by week (from `_p2e_out.txt`)

#### W10

- SCHED-UNREACHABLE | W100 | agenda=HARD:act_citizen_petitions | scene=act_citizen_petitions | reason=WEEK_LATE deadline=5 sched=100 | src/data/narrative/act_citizen_petitions.json
- SCHED-UNREACHABLE | W100 | agenda=HARD:act_campaign_rally | scene=act_campaign_rally | reason=WEEK_LATE deadline=52 sched=100 | src/data/narrative/act_campaign_rally.json
- SCHED-UNREACHABLE | W101 | agenda=HARD:act_campaign_rally | scene=act_campaign_rally | reason=WEEK_LATE deadline=52 sched=101 | src/data/narrative/act_campaign_rally.json
- SCHED-UNREACHABLE | W102 | agenda=HARD:act_monthly_press_conference | scene=act_monthly_press_conference | reason=WEEK_LATE deadline=7 sched=102 | src/data/narrative/act_monthly_press_conference.json
- SCHED-UNREACHABLE | W102 | agenda=HARD:act_campaign_rally | scene=act_campaign_rally | reason=WEEK_LATE deadline=52 sched=102 | src/data/narrative/act_campaign_rally.json
- SCHED-UNREACHABLE | W103 | agenda=HARD:act_campaign_rally | scene=act_campaign_rally | reason=WEEK_LATE deadline=52 sched=103 | src/data/narrative/act_campaign_rally.json
- SCHED-UNREACHABLE | W104 | agenda=HARD:act_citizen_petitions | scene=act_citizen_petitions | reason=WEEK_LATE deadline=5 sched=104 | src/data/narrative/act_citizen_petitions.json

#### W21

- SCHED-UNREACHABLE | W21 | agenda=agenda_w21_press_strategy | scene=act2_week22_nadia_investigation | reason=WEEK_EARLY src_week=22 sched=21 | src/data/narrative/act2/act2_week22_nadia_investigation.json

#### W22

- SCHED-UNREACHABLE | W22 | agenda=agenda_w22_brenner_visit | scene=act2_week24_brenner_warning | reason=WEEK_EARLY src_week=24 sched=22 | src/data/narrative/act2/act2_week24_brenner_warning.json
- SCHED-UNREACHABLE | W22 | agenda=agenda_w22_family_check | scene=act2_week23_family_crisis_jonas | reason=WEEK_EARLY src_week=23 sched=22 | src/data/narrative/act2/act2_week23_family_crisis_jonas.json
- SCHED-UNREACHABLE | W22 | agenda=HARD:act_monthly_press_conference | scene=act_monthly_press_conference | reason=WEEK_LATE deadline=7 sched=22 | src/data/narrative/act_monthly_press_conference.json
- SCHED-SKIPPABLE-MANDATORY | W22 | agenda=agenda_w22_brenner_visit | scene=act2_week24_brenner_warning | slotCost=1 urgent=False | src/data/narrative/act2/act2_week24_brenner_warning.json | weekDeadline=26
- SCHED-NO-FALLBACK | W22 | scene=act2_week22_oil_outcome | group=segments.vyktor_reads_telegram | gated=[week22_deal_success_path,week22_deal_failed_path] | src/data/narrative/act2/act2_week22_oil_outcome.json

#### W23

- SCHED-UNREACHABLE | W23 | agenda=agenda_w23_refugee_update | scene=act2_week19_refugee_flood | reason=WEEK_LATE deadline=20 sched=23 | src/data/narrative/act2/act2_week19_refugee_flood.json
- SCHED-SKIPPABLE-MANDATORY | W23 | agenda=agenda_w23_refugee_update | scene=act2_week19_refugee_flood | slotCost=1 urgent=False | src/data/narrative/act2/act2_week19_refugee_flood.json | weekDeadline=20

#### W24

- SCHED-UNREACHABLE | W24 | agenda=agenda_w24_referendum_prep | scene=act2_week25_referendum_eve | reason=WEEK_EARLY src_week=25 sched=24 | src/data/narrative/act2/act2_week25_referendum_eve.json
- SCHED-UNREACHABLE | W24 | agenda=HARD:act_citizen_petitions | scene=act_citizen_petitions | reason=WEEK_LATE deadline=5 sched=24 | src/data/narrative/act_citizen_petitions.json
- SCHED-SKIPPABLE-MANDATORY | W24 | agenda=agenda_w24_referendum_prep | scene=act2_week25_referendum_eve | slotCost=1 urgent=False | src/data/narrative/act2/act2_week25_referendum_eve.json | weekDeadline=26

#### W25

- SCHED-SKIPPABLE-MANDATORY | W25 | agenda=agenda_w25_brenner_final | scene=act2_week24_brenner_warning | slotCost=1 urgent=False | src/data/narrative/act2/act2_week24_brenner_warning.json | weekDeadline=26

#### W26

- SCHED-UNREACHABLE | W26 | agenda=HARD:act_monthly_press_conference | scene=act_monthly_press_conference | reason=WEEK_LATE deadline=7 sched=26 | src/data/narrative/act_monthly_press_conference.json

#### W27

- SCHED-UNREACHABLE | W27 | agenda=agenda_w27_cabinet_session | scene=act3_week31_inner_circle | reason=WEEK_EARLY src_week=31 sched=27 | src/data/narrative/act3/act3_week31_inner_circle.json
- SCHED-UNREACHABLE | W27 | agenda=agenda_w27_arcturian_review | scene=act2_week21_superpower_choice | reason=WEEK_LATE deadline=24 sched=27 | src/data/narrative/act2/act2_week21_superpower_choice.json

#### W28

- SCHED-UNREACHABLE | W28 | agenda=agenda_w28_tyvaren_intelligence | scene=act3_week32_tyvaren_ultimatum | reason=WEEK_EARLY src_week=32 sched=28 | src/data/narrative/act3/act3_week32_tyvaren_ultimatum.json
- SCHED-UNREACHABLE | W28 | agenda=HARD:act_citizen_petitions | scene=act_citizen_petitions | reason=WEEK_LATE deadline=5 sched=28 | src/data/narrative/act_citizen_petitions.json
- SCHED-SKIPPABLE-MANDATORY | W28 | agenda=agenda_w28_constitution_implementation | scene=act3_constitution_implementation | slotCost=1 urgent=False | src/data/narrative/act3/act3_constitution_implementation.json | weekDeadline=ABSENT
- SCHED-SKIPPABLE-MANDATORY | W28 | agenda=agenda_w28_tyvaren_intelligence | scene=act3_week32_tyvaren_ultimatum | slotCost=1 urgent=False | src/data/narrative/act3/act3_week32_tyvaren_ultimatum.json | weekDeadline=34

#### W29

- SCHED-UNREACHABLE | W29 | agenda=agenda_w29_tyvaren_update | scene=act3_week32_tyvaren_ultimatum | reason=WEEK_EARLY src_week=32 sched=29 | src/data/narrative/act3/act3_week32_tyvaren_ultimatum.json
- SCHED-SKIPPABLE-MANDATORY | W29 | agenda=agenda_w29_tyvaren_update | scene=act3_week32_tyvaren_ultimatum | slotCost=1 urgent=False | src/data/narrative/act3/act3_week32_tyvaren_ultimatum.json | weekDeadline=34

#### W30

- SCHED-UNREACHABLE | W30 | agenda=agenda_w30_dravenhollow_preview | scene=act3_week34_dravenhollow | reason=WEEK_EARLY src_week=34 sched=30 | src/data/narrative/act3/act3_week34_dravenhollow.json
- SCHED-UNREACHABLE | W30 | agenda=HARD:act_monthly_press_conference | scene=act_monthly_press_conference | reason=WEEK_LATE deadline=7 sched=30 | src/data/narrative/act_monthly_press_conference.json
- SCHED-SKIPPABLE-MANDATORY | W30 | agenda=agenda_w30_dravenhollow_preview | scene=act3_week34_dravenhollow | slotCost=1 urgent=False | src/data/narrative/act3/act3_week34_dravenhollow.json | weekDeadline=36
- SCHED-SKIPPABLE-MANDATORY | W30 | agenda=agenda_w30_assassination_attempt | scene=act3_week29_assassination_attempt | slotCost=2 urgent=False | src/data/narrative/act3/act3_week29_assassination_attempt.json | weekDeadline=30

#### W31

- SCHED-UNREACHABLE | W31 | agenda=agenda_w31_tyvaren_deadline | scene=act3_week32_tyvaren_ultimatum | reason=WEEK_EARLY src_week=32 sched=31 | src/data/narrative/act3/act3_week32_tyvaren_ultimatum.json
- SCHED-SKIPPABLE-MANDATORY | W31 | agenda=agenda_w31_tyvaren_deadline | scene=act3_week32_tyvaren_ultimatum | slotCost=1 urgent=False | src/data/narrative/act3/act3_week32_tyvaren_ultimatum.json | weekDeadline=34
- SCHED-NO-FALLBACK | W31 | scene=act2_week31_strike_resolution | group=top | gated=[check_morvec_deal,check_maric_deal,check_nationalize_threat] | src/data/narrative/act2/act2_week31_strike_resolution.json

#### W32

- SCHED-UNREACHABLE | W32 | agenda=agenda_w32_diplomatic_channels | scene=act3_week33_diplomatic_negotiation | reason=WEEK_EARLY src_week=33 sched=32 | src/data/narrative/act3/act3_week33_diplomatic_negotiation.json
- SCHED-UNREACHABLE | W32 | agenda=agenda_w32_military_assessment | scene=act3_week33_war_preparations | reason=WEEK_EARLY src_week=33 sched=32 | src/data/narrative/act3/act3_week33_war_preparations.json
- SCHED-UNREACHABLE | W32 | agenda=agenda_w32_dravenni_question | scene=act3_week34_dravenhollow | reason=WEEK_EARLY src_week=34 sched=32 | src/data/narrative/act3/act3_week34_dravenhollow.json
- SCHED-UNREACHABLE | W32 | agenda=HARD:act_citizen_petitions | scene=act_citizen_petitions | reason=WEEK_LATE deadline=5 sched=32 | src/data/narrative/act_citizen_petitions.json
- SCHED-SKIPPABLE-MANDATORY | W32 | agenda=agenda_w32_diplomatic_channels | scene=act3_week33_diplomatic_negotiation | slotCost=1 urgent=False | src/data/narrative/act3/act3_week33_diplomatic_negotiation.json | weekDeadline=35
- SCHED-SKIPPABLE-MANDATORY | W32 | agenda=agenda_w32_military_assessment | scene=act3_week33_war_preparations | slotCost=1 urgent=False | src/data/narrative/act3/act3_week33_war_preparations.json | weekDeadline=35
- SCHED-SKIPPABLE-MANDATORY | W32 | agenda=agenda_w32_dravenni_question | scene=act3_week34_dravenhollow | slotCost=1 urgent=False | src/data/narrative/act3/act3_week34_dravenhollow.json | weekDeadline=36

#### W33

- SCHED-UNREACHABLE | W33 | agenda=agenda_w33_dravenni_mobilization | scene=act3_week34_dravenhollow | reason=WEEK_EARLY src_week=34 sched=33 | src/data/narrative/act3/act3_week34_dravenhollow.json
- SCHED-UNREACHABLE | W33 | agenda=agenda_w33_superpower_pressure | scene=act2_week21_superpower_choice | reason=WEEK_LATE deadline=24 sched=33 | src/data/narrative/act2/act2_week21_superpower_choice.json
- SCHED-SKIPPABLE-MANDATORY | W33 | agenda=agenda_w33_dravenni_mobilization | scene=act3_week34_dravenhollow | slotCost=1 urgent=False | src/data/narrative/act3/act3_week34_dravenhollow.json | weekDeadline=36

#### W34

- SCHED-UNREACHABLE | W34 | agenda=HARD:act_monthly_press_conference | scene=act_monthly_press_conference | reason=WEEK_LATE deadline=7 sched=34 | src/data/narrative/act_monthly_press_conference.json
- SCHED-SKIPPABLE-MANDATORY | W34 | agenda=agenda_w34_military_democracy | scene=act3_military_democracy_bond | slotCost=1 urgent=False | src/data/narrative/act3/act3_military_democracy_bond.json | weekDeadline=ABSENT
- SCHED-SKIPPABLE-MANDATORY | W34 | agenda=agenda_w34_border_skirmish | scene=act3_tyvaren_border_skirmish | slotCost=1 urgent=False | src/data/narrative/act3/act3_tyvaren_border_skirmish.json | weekDeadline=ABSENT
- SCHED-SKIPPABLE-MANDATORY | W34 | agenda=agenda_w34_war_economy | scene=act3_war_economy | slotCost=1 urgent=False | src/data/narrative/act3/act3_war_economy.json | weekDeadline=ABSENT

#### W35

- SCHED-UNREACHABLE | W35 | agenda=agenda_w35_nadia_preview | scene=act3_week36_nadia_publishes | reason=WEEK_EARLY src_week=36 sched=35 | src/data/narrative/act3/act3_week36_nadia_publishes.json
- SCHED-SKIPPABLE-MANDATORY | W35 | agenda=agenda_w35_dravenni_autonomy | scene=act3_dravenni_autonomy_talks | slotCost=1 urgent=False | src/data/narrative/act3/act3_dravenni_autonomy_talks.json | weekDeadline=ABSENT
- SCHED-SKIPPABLE-MANDATORY | W35 | agenda=agenda_w35_border_skirmish | scene=act3_tyvaren_border_skirmish | slotCost=1 urgent=False | src/data/narrative/act3/act3_tyvaren_border_skirmish.json | weekDeadline=ABSENT
- SCHED-SKIPPABLE-MANDATORY | W35 | agenda=agenda_w35_nadia_preview | scene=act3_week36_nadia_publishes | slotCost=1 urgent=False | src/data/narrative/act3/act3_week36_nadia_publishes.json | weekDeadline=38

#### W36

- SCHED-UNREACHABLE | W36 | agenda=agenda_w36_coup_preview | scene=act3_week37_coup_attempt | reason=WEEK_EARLY src_week=37 sched=36 | src/data/narrative/act3/act3_week37_coup_attempt.json
- SCHED-UNREACHABLE | W36 | agenda=HARD:act_citizen_petitions | scene=act_citizen_petitions | reason=WEEK_LATE deadline=5 sched=36 | src/data/narrative/act_citizen_petitions.json
- SCHED-SKIPPABLE-MANDATORY | W36 | agenda=agenda_w36_national_address | scene=act3_national_address_war | slotCost=1 urgent=False | src/data/narrative/act3/act3_national_address_war.json | weekDeadline=ABSENT
- SCHED-SKIPPABLE-MANDATORY | W36 | agenda=agenda_w36_coup_preview | scene=act3_week37_coup_attempt | slotCost=1 urgent=False | src/data/narrative/act3/act3_week37_coup_attempt.json | weekDeadline=38
- SCHED-SKIPPABLE-MANDATORY | W36 | agenda=agenda_w36_dravenni_update | scene=act3_week34_dravenhollow | slotCost=1 urgent=False | src/data/narrative/act3/act3_week34_dravenhollow.json | weekDeadline=36

#### W37

- SCHED-UNREACHABLE | W37 | agenda=agenda_w37_family_crisis | scene=act3_week38_family_reckoning | reason=WEEK_EARLY src_week=38 sched=37 | src/data/narrative/act3/act3_week38_family_reckoning.json
- SCHED-SKIPPABLE-MANDATORY | W37 | agenda=agenda_w37_brenner_negotiation | scene=act3_brenner_negotiation | slotCost=1 urgent=False | src/data/narrative/act3/act3_brenner_negotiation.json | weekDeadline=ABSENT
- SCHED-SKIPPABLE-MANDATORY | W37 | agenda=agenda_w37_stellamere_broadcast | scene=act3_stellamere_broadcast | slotCost=1 urgent=False | src/data/narrative/act3/act3_stellamere_broadcast.json | weekDeadline=40
- SCHED-SKIPPABLE-MANDATORY | W37 | agenda=agenda_w37_family_crisis | scene=act3_week38_family_reckoning | slotCost=1 urgent=False | src/data/narrative/act3/act3_week38_family_reckoning.json | weekDeadline=39

#### W38

- SCHED-UNREACHABLE | W38 | agenda=agenda_w38_liora_recovery | scene=act3_liora_reconciliation | reason=WEEK_LATE deadline=32 sched=38 | src/data/narrative/act3/act3_liora_reconciliation.json
- SCHED-UNREACHABLE | W38 | agenda=HARD:act_monthly_press_conference | scene=act_monthly_press_conference | reason=WEEK_LATE deadline=7 sched=38 | src/data/narrative/act_monthly_press_conference.json
- SCHED-SKIPPABLE-MANDATORY | W38 | agenda=agenda_w38_coalition_government | scene=act3_coalition_government | slotCost=1 urgent=False | src/data/narrative/act3/act3_coalition_government.json | weekDeadline=ABSENT
- SCHED-SKIPPABLE-MANDATORY | W38 | agenda=agenda_w38_international_session | scene=act3_international_forum_session | slotCost=1 urgent=False | src/data/narrative/act3/act3_international_forum_session.json | weekDeadline=ABSENT
- SCHED-SKIPPABLE-MANDATORY | W38 | agenda=agenda_w38_two_letters | scene=act3_week38_two_letters | slotCost=1 urgent=False | src/data/narrative/act3/act3_week47_two_letters.json | weekDeadline=39

#### W39

- SCHED-UNREACHABLE | W39 | agenda=agenda_w39_war_path | scene=act4_week40_war_begins | reason=WEEK_EARLY src_week=40 sched=39 | src/data/narrative/act4/act4_week40_war_begins.json
- SCHED-UNREACHABLE | W39 | agenda=agenda_w39_exile_path | scene=act4_week40_exile | reason=WEEK_EARLY src_week=40 sched=39 | src/data/narrative/act4/act4_week40_exile.json
- SCHED-UNREACHABLE | W39 | agenda=agenda_w39_reform_path | scene=act4_week41_reform_implementation | reason=WEEK_EARLY src_week=41 sched=39 | src/data/narrative/act4/act4_week41_reform_implementation.json
- SCHED-SKIPPABLE-MANDATORY | W39 | agenda=agenda_w39_war_path | scene=act4_week40_war_begins | slotCost=1 urgent=False | src/data/narrative/act4/act4_week40_war_begins.json | weekDeadline=42
- SCHED-SKIPPABLE-MANDATORY | W39 | agenda=agenda_w39_exile_path | scene=act4_week40_exile | slotCost=1 urgent=False | src/data/narrative/act4/act4_week40_exile.json | weekDeadline=ABSENT
- SCHED-SKIPPABLE-MANDATORY | W39 | agenda=agenda_w39_family_decision | scene=act3_week38_family_reckoning | slotCost=1 urgent=False | src/data/narrative/act3/act3_week38_family_reckoning.json | weekDeadline=39

#### W40

- SCHED-UNREACHABLE | W40 | agenda=agenda_w40_reform_consolidation | scene=act4_week41_reform_implementation | reason=WEEK_EARLY src_week=41 sched=40 | src/data/narrative/act4/act4_week41_reform_implementation.json
- SCHED-UNREACHABLE | W40 | agenda=HARD:act_citizen_petitions | scene=act_citizen_petitions | reason=WEEK_LATE deadline=5 sched=40 | src/data/narrative/act_citizen_petitions.json
- SCHED-SKIPPABLE-MANDATORY | W40 | agenda=agenda_w40_exile_begin | scene=act4_exile_arc | slotCost=1 urgent=False | src/data/narrative/act4/act4_exile_arc.json | weekDeadline=ABSENT
- SCHED-SKIPPABLE-MANDATORY | W40 | agenda=agenda_w40_civil_conflict | scene=act4_civil_conflict_arc | slotCost=1 urgent=False | src/data/narrative/act4/act4_civil_conflict_arc.json | weekDeadline=ABSENT

#### W41

- SCHED-SKIPPABLE-MANDATORY | W41 | agenda=agenda_w41_judicial_appointments | scene=act4_constitutional_crisis | slotCost=1 urgent=False | src/data/narrative/act4/act4_constitutional_crisis.json | weekDeadline=ABSENT
- SCHED-SKIPPABLE-MANDATORY | W41 | agenda=agenda_w41_family_anchored | scene=act4_family_anchored | slotCost=1 urgent=False | src/data/narrative/act4/act4_family_anchored.json | weekDeadline=ABSENT
- SCHED-SKIPPABLE-MANDATORY | W41 | agenda=agenda_w41_national_address | scene=act4_national_address | slotCost=1 urgent=False | src/data/narrative/act4/act4_national_address.json | weekDeadline=ABSENT

#### W42

- SCHED-UNREACHABLE | W42 | agenda=HARD:act_monthly_press_conference | scene=act_monthly_press_conference | reason=WEEK_LATE deadline=7 sched=42 | src/data/narrative/act_monthly_press_conference.json
- SCHED-SKIPPABLE-MANDATORY | W42 | agenda=agenda_w42_internal_security | scene=act4_internal_security_state | slotCost=1 urgent=False | src/data/narrative/act4/act4_internal_security_state.json | weekDeadline=ABSENT
- SCHED-SKIPPABLE-MANDATORY | W42 | agenda=agenda_w42_ima_renegotiation | scene=act4_ima_renegotiation | slotCost=1 urgent=False | src/data/narrative/act4/act4_ima_renegotiation.json | weekDeadline=ABSENT
- SCHED-SKIPPABLE-MANDATORY | W42 | agenda=agenda_w42_emergency_powers | scene=act4_emergency_powers_invoked | slotCost=1 urgent=False | src/data/narrative/act4/act4_emergency_powers_invoked.json | weekDeadline=ABSENT

#### W43

- SCHED-SKIPPABLE-MANDATORY | W43 | agenda=agenda_w43_family_anchored | scene=act4_family_anchored | slotCost=1 urgent=False | src/data/narrative/act4/act4_family_anchored.json | weekDeadline=ABSENT
- SCHED-SKIPPABLE-MANDATORY | W43 | agenda=agenda_w43_family_estranged | scene=act4_family_estranged | slotCost=1 urgent=False | src/data/narrative/act4/act4_family_estranged.json | weekDeadline=ABSENT
- SCHED-SKIPPABLE-MANDATORY | W43 | agenda=agenda_w43_family_breaking | scene=act4_family_breaking | slotCost=1 urgent=False | src/data/narrative/act4/act4_family_breaking.json | weekDeadline=ABSENT
- SCHED-SKIPPABLE-MANDATORY | W43 | agenda=agenda_w43_diplomatic_endgame | scene=act4_diplomatic_endgame | slotCost=1 urgent=False | src/data/narrative/act4/act4_diplomatic_endgame.json | weekDeadline=ABSENT

#### W44

- SCHED-UNREACHABLE | W44 | agenda=HARD:act_citizen_petitions | scene=act_citizen_petitions | reason=WEEK_LATE deadline=5 sched=44 | src/data/narrative/act_citizen_petitions.json
- SCHED-SKIPPABLE-MANDATORY | W44 | agenda=agenda_w44_dravenni_war | scene=act4_dravenni_war_alliance | slotCost=1 urgent=False | src/data/narrative/act4/act4_dravenni_war_alliance.json | weekDeadline=ABSENT
- SCHED-SKIPPABLE-MANDATORY | W44 | agenda=agenda_w44_ceasefire | scene=act4_ceasefire_talks | slotCost=1 urgent=False | src/data/narrative/act4/act4_ceasefire_talks.json | weekDeadline=ABSENT

#### W45

- SCHED-SKIPPABLE-MANDATORY | W45 | agenda=agenda_w45_ima_confrontation | scene=act4_ima_confrontation | slotCost=1 urgent=False | src/data/narrative/act4/act4_ima_confrontation.json | weekDeadline=ABSENT
- SCHED-SKIPPABLE-MANDATORY | W45 | agenda=agenda_w45_ceasefire_negotiation | scene=act4_ceasefire_negotiation | slotCost=1 urgent=False | src/data/narrative/act4/act4_ceasefire_negotiation.json | weekDeadline=ABSENT
- SCHED-SKIPPABLE-MANDATORY | W45 | agenda=agenda_w45_occupation | scene=act4_occupation_begins | slotCost=1 urgent=False | src/data/narrative/act4/act4_occupation_begins.json | weekDeadline=ABSENT

#### W46

- SCHED-UNREACHABLE | W46 | agenda=HARD:act_monthly_press_conference | scene=act_monthly_press_conference | reason=WEEK_LATE deadline=7 sched=46 | src/data/narrative/act_monthly_press_conference.json
- SCHED-SKIPPABLE-MANDATORY | W46 | agenda=agenda_w46_forum_showdown | scene=act4_forum_showdown | slotCost=1 urgent=False | src/data/narrative/act4/act4_forum_showdown.json | weekDeadline=ABSENT
- SCHED-SKIPPABLE-MANDATORY | W46 | agenda=agenda_w46_coordinated_response | scene=act4_coordinated_response | slotCost=1 urgent=False | src/data/narrative/act4/act4_coordinated_response.json | weekDeadline=ABSENT
- SCHED-SKIPPABLE-MANDATORY | W46 | agenda=agenda_w46_tomas_redemption | scene=act4_tomas_redemption | slotCost=1 urgent=False | src/data/narrative/act4/act4_tomas_redemption.json | weekDeadline=ABSENT

#### W47

- SCHED-SKIPPABLE-MANDATORY | W47 | agenda=agenda_w47_second_referendum | scene=act4_second_referendum | slotCost=1 urgent=False | src/data/narrative/act4/act4_second_referendum.json | weekDeadline=ABSENT
- SCHED-SKIPPABLE-MANDATORY | W47 | agenda=agenda_w47_public_mandate | scene=act4_public_mandate | slotCost=1 urgent=False | src/data/narrative/act4/act4_public_mandate.json | weekDeadline=ABSENT
- SCHED-SKIPPABLE-MANDATORY | W47 | agenda=agenda_w47_reelection | scene=act4_reelection_campaign | slotCost=1 urgent=False | src/data/narrative/act4/act4_reelection_campaign.json | weekDeadline=ABSENT

#### W48

- SCHED-UNREACHABLE | W48 | agenda=HARD:act_citizen_petitions | scene=act_citizen_petitions | reason=WEEK_LATE deadline=5 sched=48 | src/data/narrative/act_citizen_petitions.json
- SCHED-SKIPPABLE-MANDATORY | W48 | agenda=agenda_w48_diplomatic_endgame | scene=act4_diplomatic_endgame | slotCost=1 urgent=False | src/data/narrative/act4/act4_diplomatic_endgame.json | weekDeadline=ABSENT
- SCHED-SKIPPABLE-MANDATORY | W48 | agenda=agenda_w48_tomas_redemption | scene=act4_tomas_redemption | slotCost=1 urgent=False | src/data/narrative/act4/act4_tomas_redemption.json | weekDeadline=ABSENT

#### W49

- SCHED-SKIPPABLE-MANDATORY | W49 | agenda=agenda_w49_family_healing | scene=act4_family_healing | slotCost=1 urgent=False | src/data/narrative/act4/act4_family_healing.json | weekDeadline=ABSENT
- SCHED-SKIPPABLE-MANDATORY | W49 | agenda=agenda_w49_jonas_divorce | scene=act4_jonas_divorce | slotCost=1 urgent=False | src/data/narrative/act4/act4_jonas_divorce.json | weekDeadline=ABSENT
- SCHED-SKIPPABLE-MANDATORY | W49 | agenda=agenda_w49_family_conditional | scene=act4_family_conditional | slotCost=1 urgent=False | src/data/narrative/act4/act4_family_conditional.json | weekDeadline=ABSENT
- SCHED-SKIPPABLE-MANDATORY | W49 | agenda=agenda_w49_all_fronts | scene=act4_all_fronts | slotCost=1 urgent=False | src/data/narrative/act4/act4_all_fronts.json | weekDeadline=ABSENT

#### W50

- SCHED-UNREACHABLE | W50 | agenda=HARD:act_monthly_press_conference | scene=act_monthly_press_conference | reason=WEEK_LATE deadline=7 sched=50 | src/data/narrative/act_monthly_press_conference.json
- SCHED-SKIPPABLE-MANDATORY | W50 | agenda=agenda_w50_family_healing | scene=act4_family_healing | slotCost=1 urgent=False | src/data/narrative/act4/act4_family_healing.json | weekDeadline=ABSENT
- SCHED-SKIPPABLE-MANDATORY | W50 | agenda=agenda_w50_jonas_divorce | scene=act4_jonas_divorce | slotCost=1 urgent=False | src/data/narrative/act4/act4_jonas_divorce.json | weekDeadline=ABSENT
- SCHED-SKIPPABLE-MANDATORY | W50 | agenda=agenda_w50_diplomatic_endgame | scene=act4_diplomatic_endgame | slotCost=1 urgent=False | src/data/narrative/act4/act4_diplomatic_endgame.json | weekDeadline=ABSENT

#### W51

- SCHED-UNREACHABLE | W51 | agenda=agenda_w51_new_order | scene=act4_week47_new_order | reason=WEEK_LATE deadline=49 sched=51 | src/data/narrative/act4/act4_week47_new_order.json
- SCHED-SKIPPABLE-MANDATORY | W51 | agenda=agenda_w51_family_healing | scene=act4_family_healing | slotCost=1 urgent=False | src/data/narrative/act4/act4_family_healing.json | weekDeadline=ABSENT
- SCHED-SKIPPABLE-MANDATORY | W51 | agenda=agenda_w51_reelection | scene=act4_reelection_campaign | slotCost=1 urgent=False | src/data/narrative/act4/act4_reelection_campaign.json | weekDeadline=ABSENT
- SCHED-SKIPPABLE-MANDATORY | W51 | agenda=agenda_w51_all_fronts | scene=act4_all_fronts | slotCost=1 urgent=False | src/data/narrative/act4/act4_all_fronts.json | weekDeadline=ABSENT
- SCHED-SKIPPABLE-MANDATORY | W51 | agenda=agenda_w51_new_order | scene=act4_week47_new_order | slotCost=1 urgent=False | src/data/narrative/act4/act4_week47_new_order.json | weekDeadline=49

#### W52

- SCHED-UNREACHABLE | W52 | agenda=HARD:act_citizen_petitions | scene=act_citizen_petitions | reason=WEEK_LATE deadline=5 sched=52 | src/data/narrative/act_citizen_petitions.json
- SCHED-SKIPPABLE-MANDATORY | W52 | agenda=agenda_w52_family_final | scene=act4_family_healing | slotCost=1 urgent=False | src/data/narrative/act4/act4_family_healing.json | weekDeadline=ABSENT
- SCHED-NO-FALLBACK | W52 | scene=act4_week52_ending | group=top | gated=[ending_democratic_triumph,ending_benevolent_autocrat,ending_war_victory,ending_war_defeat] | src/data/narrative/act4/act4_week52_ending.json

#### W54

- SCHED-UNREACHABLE | W54 | agenda=HARD:act_monthly_press_conference | scene=act_monthly_press_conference | reason=WEEK_LATE deadline=7 sched=54 | src/data/narrative/act_monthly_press_conference.json

#### W56

- SCHED-UNREACHABLE | W56 | agenda=HARD:act_citizen_petitions | scene=act_citizen_petitions | reason=WEEK_LATE deadline=5 sched=56 | src/data/narrative/act_citizen_petitions.json

#### W58

- SCHED-UNREACHABLE | W58 | agenda=HARD:act_monthly_press_conference | scene=act_monthly_press_conference | reason=WEEK_LATE deadline=7 sched=58 | src/data/narrative/act_monthly_press_conference.json

#### W60

- SCHED-UNREACHABLE | W60 | agenda=HARD:act_citizen_petitions | scene=act_citizen_petitions | reason=WEEK_LATE deadline=5 sched=60 | src/data/narrative/act_citizen_petitions.json

#### W62

- SCHED-UNREACHABLE | W62 | agenda=HARD:act_monthly_press_conference | scene=act_monthly_press_conference | reason=WEEK_LATE deadline=7 sched=62 | src/data/narrative/act_monthly_press_conference.json

#### W64

- SCHED-UNREACHABLE | W64 | agenda=HARD:act_citizen_petitions | scene=act_citizen_petitions | reason=WEEK_LATE deadline=5 sched=64 | src/data/narrative/act_citizen_petitions.json

#### W65

- SCHED-NO-FALLBACK | W65 | scene=act6_week65_border_incident | group=segments.check_tech_level | gated=[path_tech_advantage,path_tech_disadvantage] | src/data/narrative/act6/act6_week65_border_incident.json

#### W66

- SCHED-UNREACHABLE | W66 | agenda=HARD:act_monthly_press_conference | scene=act_monthly_press_conference | reason=WEEK_LATE deadline=7 sched=66 | src/data/narrative/act_monthly_press_conference.json

#### W68

- SCHED-UNREACHABLE | W68 | agenda=HARD:act_citizen_petitions | scene=act_citizen_petitions | reason=WEEK_LATE deadline=5 sched=68 | src/data/narrative/act_citizen_petitions.json

#### W70

- SCHED-UNREACHABLE | W70 | agenda=HARD:act_monthly_press_conference | scene=act_monthly_press_conference | reason=WEEK_LATE deadline=7 sched=70 | src/data/narrative/act_monthly_press_conference.json

#### W72

- SCHED-UNREACHABLE | W72 | agenda=HARD:act_citizen_petitions | scene=act_citizen_petitions | reason=WEEK_LATE deadline=5 sched=72 | src/data/narrative/act_citizen_petitions.json

#### W74

- SCHED-UNREACHABLE | W74 | agenda=HARD:act_monthly_press_conference | scene=act_monthly_press_conference | reason=WEEK_LATE deadline=7 sched=74 | src/data/narrative/act_monthly_press_conference.json

#### W76

- SCHED-UNREACHABLE | W76 | agenda=HARD:act_citizen_petitions | scene=act_citizen_petitions | reason=WEEK_LATE deadline=5 sched=76 | src/data/narrative/act_citizen_petitions.json

#### W78

- SCHED-UNREACHABLE | W78 | agenda=HARD:act_monthly_press_conference | scene=act_monthly_press_conference | reason=WEEK_LATE deadline=7 sched=78 | src/data/narrative/act_monthly_press_conference.json
- SCHED-NO-FALLBACK | W78 | scene=act6_week78_ashavel_legacy | group=segments.check_marriage_state | gated=[path_united,path_divorce] | src/data/narrative/act6/act6_week78_ashavel_legacy.json

#### W80

- SCHED-UNREACHABLE | W80 | agenda=HARD:act_citizen_petitions | scene=act_citizen_petitions | reason=WEEK_LATE deadline=5 sched=80 | src/data/narrative/act_citizen_petitions.json

#### W82

- SCHED-UNREACHABLE | W82 | agenda=HARD:act_monthly_press_conference | scene=act_monthly_press_conference | reason=WEEK_LATE deadline=7 sched=82 | src/data/narrative/act_monthly_press_conference.json

#### W83

- SCHED-UNREACHABLE | W83 | agenda=agenda_w83_energy_transition | scene=act6_week83_energy_transition | reason=NOT_IN_REGISTRY

#### W84

- SCHED-UNREACHABLE | W84 | agenda=HARD:act_citizen_petitions | scene=act_citizen_petitions | reason=WEEK_LATE deadline=5 sched=84 | src/data/narrative/act_citizen_petitions.json

#### W86

- SCHED-UNREACHABLE | W86 | agenda=HARD:act_monthly_press_conference | scene=act_monthly_press_conference | reason=WEEK_LATE deadline=7 sched=86 | src/data/narrative/act_monthly_press_conference.json

#### W88

- SCHED-UNREACHABLE | W88 | agenda=HARD:act_citizen_petitions | scene=act_citizen_petitions | reason=WEEK_LATE deadline=5 sched=88 | src/data/narrative/act_citizen_petitions.json

#### W90

- SCHED-UNREACHABLE | W90 | agenda=HARD:act_monthly_press_conference | scene=act_monthly_press_conference | reason=WEEK_LATE deadline=7 sched=90 | src/data/narrative/act_monthly_press_conference.json

#### W92

- SCHED-UNREACHABLE | W92 | agenda=HARD:act_citizen_petitions | scene=act_citizen_petitions | reason=WEEK_LATE deadline=5 sched=92 | src/data/narrative/act_citizen_petitions.json

#### W94

- SCHED-UNREACHABLE | W94 | agenda=HARD:act_monthly_press_conference | scene=act_monthly_press_conference | reason=WEEK_LATE deadline=7 sched=94 | src/data/narrative/act_monthly_press_conference.json

#### W96

- SCHED-UNREACHABLE | W96 | agenda=HARD:act_citizen_petitions | scene=act_citizen_petitions | reason=WEEK_LATE deadline=5 sched=96 | src/data/narrative/act_citizen_petitions.json

#### W97

- SCHED-UNREACHABLE | W97 | agenda=HARD:act_campaign_rally | scene=act_campaign_rally | reason=WEEK_LATE deadline=52 sched=97 | src/data/narrative/act_campaign_rally.json

#### W98

- SCHED-UNREACHABLE | W98 | agenda=HARD:act_monthly_press_conference | scene=act_monthly_press_conference | reason=WEEK_LATE deadline=7 sched=98 | src/data/narrative/act_monthly_press_conference.json
- SCHED-UNREACHABLE | W98 | agenda=HARD:act_campaign_rally | scene=act_campaign_rally | reason=WEEK_LATE deadline=52 sched=98 | src/data/narrative/act_campaign_rally.json

#### W99

- SCHED-UNREACHABLE | W99 | agenda=HARD:act_campaign_rally | scene=act_campaign_rally | reason=WEEK_LATE deadline=52 sched=99 | src/data/narrative/act_campaign_rally.json

## 7. ACT BOUNDARIES

Expected (task): 1-12 I, 13-34 II, 35-44 III, 45-52 IV, 53-65 V, 66-83 VI, 85-104 VII (week 84 unmapped).

Code reality (`src/stores/gameStore.ts:365-374` `advanceWeek`, `:392-398` `devSetWeek` with `week-1` off-by-one per `:385-386`): I 1-12, II 13-25, III 26-38, IV 39-52, V 53-64, VI 65-89, VII 90+. Comment `:365-367` admits `act7` scenes at weeks 79/85/88 predate label (thematic, not chronological).

Mismatches vs expected (`_p2f_out.txt`): ACT_MISMATCH_TOTAL=211 (sampled 60 in file, all `week=1` chain templates carrying arc act, e.g. `act3_dlf_coordination week=1 json_act=3 expected=1`). Week-1 templates explain the bulk; chronological (non-week-1) mismatches include act7 79/85/88 (thematic VII scheduled in VI window) and V/VI boundary at 65-66 (expected V 53-65 vs code V 53-64; `act5_week53-64` fit both, `act6_week65` is V under expected but VI under code).

Label rendering: `src/components/KaterinHUD.tsx:17-24` `ACT_LABELS` covers 1-7 + fallback `:124`; `src/components/JournalView.tsx:16-23` `getActLabel` covers 1-4 with `default: Act {n}` (bare, no subtitle for V/VI/VII) and `:26-33` `getActDateRange` returns `''` for 5-7. So V/VI/VII render (bare) in HUD, degraded (no title/date) in Journal. Debt/Economy/Inflation/PublicOrder panels use generic `Act N` loops (cover all).

### Week-84 finding (explicit)

- Scene JSON: ONE scene at week 84: `src/data/narrative/act6/act6_week84_corporate_deal.json:1-12` id `act6_week84_corporate_deal`, `act:6`, `weekAvailable:84`, `weekDeadline:86`, `agendaCost:1`, `isMandatory:false`, `prerequisites:[]`. Status: TRUE ORPHAN (`_p2c_out.txt`: no inbound, no agenda, no weekStore, no engine ref).
- Agenda: `src/data/agenda/week84.json` ABSENT (`Test-Path` False). No `week*.json` references `act6_week84_corporate_deal` (grep empty). No hardcoded `weekStore.ts` entry for it (hard set has no 84 one-shot).
- Wiring: W84 hardcoded recurring only: `act_citizen_petitions` (84%4==0 per `weekStore.ts:901`) + `__radio__` (week>3 per `:793`) + conditional `act3_nightmare_sequence?` (week≥30+stress per `:869`). No dedicated W84 agenda item exists.
- Adjacent: W83 agenda exists (`week83.json:1-14`, urgent energy item BROKEN, see §6a) but scene missing; W85 has no agenda file and no scene JSON (P1 empty lists). So 83-85 is a broken/orphan/gap cluster with 84 as orphan-scene-no-wire week.
