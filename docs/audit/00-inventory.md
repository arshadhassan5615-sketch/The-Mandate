# P1 — Inventory and Schema Calibration (READ-ONLY)

Repo root: `C:\Users\arsha\OneDrive\Documents\game\the-mandate`
Generated: 2026-09-12 (UTC)
Artifacts: `docs/audit/00-scenes.tsv` (522 rows + header), `docs/audit/00-schema.md` (26 top + 22 segment-set + 15 choice + 12 condition keys)

Method: direct filesystem + JSON parse (522 scene JSONs under `src/data/narrative/**/*.json`); `src/data/agenda/week*.json` (81 files) + `project*.json` (6 files); `src/stores/weekStore.ts` hardcoded pushes; `src/types/narrative.ts` for type aliases. No edits outside `docs/audit/`.

## 1. TREE (depth 3, excludes node_modules, dist, .git)

Root (via `Get-ChildItem -LiteralPath "."` excluding node_modules/dist/.git):
- DIRS: `.claude/`, `.opencode/`, `docs/`, `e2e/`, `mcps/`, `mth/`, `my-video/`, `playwright-report/`, `public/`, `remotion-video/`, `scripts/`, `src/`, `test-results/`, `the_mandate_soundtrack/`
- FILES: `_test.json`, `audit-narrative.mjs`, `audit-narrative-report.txt`, `CLAUDE.md`, `e2e-autosave-test.mjs`, `e2e-step2.png`, `e2e-step3.png`, `e2e-step3b.png`, `e2e-step6.png`, `eslint.config.js`, `generate_soundtrack.py`, `handoff.md`, `index.html`, `NARRATIVE_AUDIT_REPORT.md`, `opencode.json`, `package.json`, `package-lock.json`, `playtest-weeks.tmp.mjs`, `playwright.config.ts`, `README.md`, `soundtrack.py`, `tsconfig.app.json`, `tsconfig.json`, `tsconfig.node.json`, `vercel.json`, `vite.config.ts`, `vitest.config.ts`

`src/` depth2 (`src/` listing):
- FILES: `src/App.tsx`, `src/index.css`, `src/main.tsx`, `src/vite-env.d.ts`
- DIRS: `src/assets/`, `src/components/`, `src/constants/`, `src/data/`, `src/db/`, `src/engine/`, `src/hooks/`, `src/stores/`, `src/styles/`, `src/test/`, `src/types/`

`src/` depth3 (selected; full listing from `Get-ChildItem src/*/ `):
- `src/assets/audio/`, `src/assets/font/`, `src/assets/images/`, `src/assets/maps/`, `src/assets/potraits/`, `src/assets/provinces/`, `src/assets/hero.png`, `src/assets/react.svg`, `src/assets/vite.svg`
- `src/components/*.tsx` (56+ incl `AgendaSelector.tsx`, `NarrativeScene.tsx`, `EveningReview/`, `narrative/`, `news/`, `panels/`, `portraits/`, `ui/`, `common/`, `__tests__/`)
- `src/constants/zIndex.ts`
- `src/data/agenda/` (87 files), `src/data/bills/`, `src/data/characters/`, `src/data/cliffhangers/`, `src/data/codex/`, `src/data/constitution/`, `src/data/diary/`, `src/data/journal/`, `src/data/letters/`, `src/data/narrative/`, `src/data/news/`, `src/data/newspapers/`, `src/data/parliament/`, `src/data/vote/`, plus `src/data/benchmarks.json`, `src/data/decrees.ts`, `src/data/epilogues.json`, `src/data/ministerRequests.ts`, `src/data/ministers.ts`, `src/data/newspapers.ts`, `src/data/projects.json`, `src/data/provinces.ts`
- `src/db/mandateDb.ts`
- `src/engine/*.ts` (30 files; see §6)
- `src/hooks/useAudio.ts`, `useDialogueFlow.ts`, `useHotkeys.ts`, `useIsMobile.ts`, `useSegmentTypewriter.ts`
- `src/stores/*.ts` (13 files; see §6)
- `src/styles/motion.ts`
- `src/test/factories/`, `src/test/setup.ts`, `src/test/smoke.test.ts`
- `src/types/*.ts` (14 files)

File counts per directory (recursive `Get-ChildItem -File -Recurse | Measure-Object`):
- `src\assets` : 199 files (recursive) | `src\components` : 91 | `src\constants` : 1 | `src\data` : 654 | `src\db` : 1 | `src\engine` : 35 | `src\hooks` : 5 | `src\stores` : 19 | `src\styles` : 1 | `src\test` : 4 | `src\types` : 14
- Narrative JSON recursive (`src/data/narrative/**/*.json`): 522 | Data JSON recursive (`src/data/**/*.json`): 637
- Narrative breakdown (`Get-ChildItem src/data/narrative/<dir> -File -Recurse`): `act1`:101, `act2`:105, `act3`:181, `act4`:62, `act5`:11, `act6`:20, `act7`:12, `crisis`:3, `diplomacy`:6, `personal`:1, `projects`:14, `security`:3, root `*.json`:3 (`act_campaign_rally.json`, `act_citizen_petitions.json`, `act_monthly_press_conference.json`) = 522 total
- Agenda (`src/data/agenda/`): 87 files = 81 `week*.json` + 6 `project*.json` (`Get-ChildItem src/data/agenda`)
- Scripts (`scripts/`): 6 files — `scripts/audit-cabinet-formation.mjs`, `scripts/audit-narrative.mjs`, `scripts/check-counts.mjs`, `scripts/count-words.mjs`, `scripts/fix-cabinet-routing.mjs`, `scripts/normalize-narrative-arrays.mjs`; `scripts/audit-scenes.mjs` ABSENT (`Test-Path` False)

## 2. SCENE CORPUS

Artifact: `docs/audit/00-scenes.tsv` — 522 rows + header.
Columns: `path | id | week | act | isMandatory | weekDeadline | agendaCost | segmentCount | choiceCount`
Derivation (documented in TSV generator `docs/audit/_tmp_scan2.py`):
- `path`: posix relative e.g. `src/data/narrative/act1/act1_brenner_defense_briefing.json`
- `id`: `$.id` else ABSENT
- `week`: `$.week` (int) else `$.weekAvailable` (int) else filename `/week(\d+)/i` else ABSENT. Example legacy: `src/data/narrative/act1/act1_brenner_defense_briefing.json:4` `"week": 2` + `:85` `"weekAvailable": 2`; modern: `src/data/narrative/act5/act5_week53_second_address.json` `$.week` ABSENT, `$.weekAvailable` 53.
- `act`: week map (see §5 header): 1-13→1, 14-26→2, 27-39→3, 40-52→4, 53-64→5, 65-78→6, 79-104→7, else ABSENT. Note: JSON `$.act` present in 470/522 (see §3); TSV `act` is derived, not copied, to keep week→act single-sourced.
- `isMandatory`: `$.isMandatory` else ABSENT (467 present, 55 ABSENT — mostly legacy act1 `week`-style files e.g. `act1_brenner_defense_briefing.json` ABSENT)
- `weekDeadline`: `$.weekDeadline` else ABSENT (247 present)
- `agendaCost`: `$.agendaCost` else ABSENT (468 present)
- `segmentCount`: `len($.segments)` if object else ABSENT if missing (128 scenes have `segments`; 394 ABSENT)
- `choiceCount`: `len($.choices||[]) + sum(len(segments.*.choices||[]))` else ABSENT if neither present (all 522 have `choices`; total 2526 choice objects)

Week-range per folder (JSON `week`/`weekAvailable` else filename; `docs/audit/_tmp_scan1.py`):
- `act1`: n=101 min=1 max=19 (spill to 14,15,16,19) | `act2`: n=105 min=1 max=33 | `act3`: n=181 min=1 max=52 | `act4`: n=62 min=1 max=52 | `act5`: n=11 min=53 max=64 | `act6`: n=20 min=65 max=89 | `act7`: n=12 min=79 max=100 | `crisis`: n=2 (5,14) | `diplomacy`: n=6 (15,18,20,32,34,36) | `personal`: n=1 (0) | `projects`: n=14 (1,14,15,16,28,29,30) | `security`: n=3 (0,4) | root: `act_campaign_rally.json: week=45 act=1`, `act_citizen_petitions.json: week=4 act=1`, `act_monthly_press_conference.json: week=6 act=1`

## 3. SCHEMA DIGEST

Artifact: `docs/audit/00-schema.md` — key | occurrences | value type(s) | example (≤80ch + source).
Counts from full 522-file scan (`docs/audit/_tmp_scan2.py`):

Top-level (26 keys):
- `id` 522 string | `title` 522 string | `location` 522 string | `characters` 522 array | `choices` 522 array | `weekAvailable` 521 number(int) | `type` 520 string | `act` 470 number(int) | `agendaCost` 468 number(int) | `isMandatory` 467 boolean | `narrative` 461 array | `prerequisites` 378 array | `weekDeadline` 247 number(int) | `monologue` 207 string | `segments` 128 object | `dialogue` 61 array,string | `week` 55 number(int) | `exclusive` 23 array | `reactions` 5 array | `socialInteractions` 5 array | `isWeekGate` 5 boolean | `gateMessage` 5 string | `prerequisiteFlags` 5 array | `isFamilyScene` 2 boolean | `prerequisiteSceneIds` 1 array | `deadline` 1 number(int)
- Example legacy alias: `src/data/narrative/act1/act1_brenner_defense_briefing.json:10` `"dialogue": "General Brenner arrives..."` (string, not array) — normalized per `src/types/narrative.ts:108-110`, `src/engine/NarrativeEngine.ts` not needed; renderer maps per `src/types/narrative.ts:4-11`.
- `week` (55) is legacy duplicate of `weekAvailable` (521); e.g. `act1_brenner_defense_briefing.json:4` + `:85`.

Choice keys (2526 choice objects across top + segments):
- `id` 2526 | `text` 2526 | `chainTriggers` 2526 (mostly `[]`) | `codexUnlocks` 2526 (mostly `[]`) | `flags` 2480 | `stateChanges` 1857 | `nextSegment` 1374 (string|null; `null`=terminal) | `internalTag` 1365 | `reactions` 1197 | `statEffects` 152 (legacy alias for `stateChanges`, `src/types/narrative.ts:57-61`) | `conditions` 91 | `tooltip` 90 | `journalEntry` 83 | `prerequisites` 30 | `nextNodeId` 16

Condition keys:
- `choice.conditions.stat` 86 | `choice.conditions.operator` 86 | `choice.conditions.value` 111 | `choice.conditions.type` 25 | `choice.conditions.flag` 25 | `choice.prerequisites.flag` 32 | `choice.prerequisites.value` 37 | `narrative.conditions.type` 8 | `narrative.conditions.flag` 8 | `narrative.conditions.value` 8 | `choice.prerequisites.stat` 5 | `choice.prerequisites.operator` 5
- Two shapes per `src/types/narrative.ts:21-33`: `StatCondition {stat,operator,value}` and `FlagCondition {type:"flag",flag,value}`; plus shorthand `{flag,value}` (no `type`) used in `prerequisites` (32+37) and some `conditions`.

Segment-set keys (inside `segments.*`; 128 scenes, 699 segment-choice arrays, 566 `narrative` arrays):
- Full table in `00-schema.md`; top: `toplevel.narrative.type` 2162, `segment.narrative.type` 1647, `choices` 699, `narrative` 566, `monologue` 152, `dialogue` 133 (legacy alias per `src/types/narrative.ts:70-76`), `speaker` 3 (e.g. `src/data/narrative/crisis/crisis_deficit_emergency.json#vostane_numbers`), `flags` 1 (e.g. `src/data/narrative/act2/act2_week20_oil_negotiation.json#igor_accepts_deal`).

## 4. REFERENCE-KEY CENSUS (exact keys; one cited example each)

| Concern | Exact key(s) found | Cited example (file:line) |
|---|---|---|
| internal segment jumps | `nextSegment` (1374 non-null strings; `null`=terminal) | `src/data/narrative/act1/act1_brenner_defense_briefing.json:16` `"nextSegment": "brenner_assessment"` (choice `brenner_briefing_begin`) |
| external scene jumps | `nextNodeId` (16 occurrences) | `src/data/narrative/act2/act2_week21_superpower_choice.json:78` `"nextNodeId": "act2_week21_visit_stellamere"` (choice `visit_arcturian_stellamere`) |
| chain triggers | `chainTriggers` (array of `{targetNodeId,delayWeeks,conditions?,probability?}` per `src/types/narrative.ts:35-40`); 2526 keys present, mostly `[]`; non-empty e.g. delay 10 | `src/data/narrative/act1/act1_chain_bni_press.json:103-104` `"chainTriggers": [{ "targetNodeId": "act2_week22_nadia_investigation", "delayWeeks": 10 }]` (choice `bni_press_conference`) |
| condition arrays | `prerequisites` (top 378; choice 30) + `conditions` (choice 91; narrative `conditions` 8) | top: `src/data/narrative/act1/act1_chain_church_opposition.json:11-12` `"prerequisites": [{ "stat": "factions.church", "operator": "<", "value": 40 }]`; choice-prereq: `src/data/narrative/act2/act2_week31_strike_resolution.json:29-30` `"prerequisites": [{ "flag": "morvec_strike_broken", "value": true }]` (choice `check_morvec_deal`); choice-cond: `src/data/narrative/act1/act1_week10_tyvaren_intel.json:42-47` `"conditions": [{ "stat": "flags.tyvaren_diplomatic_response", "operator": "==", "value": true }]` (choice `proceed_diplomatic`); narrative-cond: `src/data/narrative/act5/act5_week53_second_address.json:51` `"conditions": [{ "type": "flag", "flag": "permanent_injury_sustained", "value": true }]` (`segments.check_outcome.narrative[1]`) |
| flag reads | `prerequisites[]:{flag,value}` (shorthand, 32+37) ; `conditions[]:{type:"flag",flag,value}` (25+8) ; `conditions[]:{stat:"flags.*",operator,value}` (86) ; top `prerequisiteFlags[]` (5 files) | `src/data/narrative/act2/act2_week22_oil_outcome.json:49` `"conditions": [{ "type": "flag", "flag": "oil_deal_hybrid_signed", "value": true }]` (choice `week22_deal_success_path`) |
| flag writes | `flags` (string[]; 2480 choice keys; non-empty e.g. single flag) | `src/data/narrative/act1/act1_brenner_defense_briefing.json:41-43` `"flags": ["brenner_briefing_oversight_stated"]` (choice `brenner_commit_oversight`, lines 39-43 block) |
| state modifiers | `stateChanges[]:{stat,operation,value}` (1857) ; legacy `statEffects[]:{stat,value}` (152, operation=`add` per `src/types/narrative.ts:57-61`) | modern: `src/data/narrative/act1/act1_chain_bni_press.json:50-54` `"stateChanges": [{ "stat": "personal.publicImage", "operation": "add", "value": 6 }, ...]` (choice `bni_press_engage`); legacy: `src/data/narrative/act1/act1_brenner_defense_briefing.json:44-56` `"statEffects": [{ "stat": "factions.ironCovenant", "value": -3 }, ...]` (choice `brenner_commit_oversight`) |
| speaker attribution | `character` (dialogue segments; 999 segment + 943 top-level) + `type:"dialogue"` + rare `primaryCharacter` (21) + rare `speaker` (3) | `src/data/narrative/act1/act1_chain_bni_press.json:19-21` `{ "type": "dialogue", "character": "vyktor_reznik", "text": "The Herald is calling..." }` |

Notes: `chainTriggers`/`codexUnlocks`/`flags` appear on every choice (2526/2526/2480) but are `[]` when unused — presence ≠ firing. `nextSegment:null` is terminal (e.g. `act1_brenner_defense_briefing.json:58` + `:78`). `prerequisiteSceneIds` (1 file: `src/data/narrative/act2/act2_week15_theron_compromise.json`) and `prerequisiteFlags` (5 files e.g. `src/data/narrative/act2/pipeline_constitution_committee.json`) are scene-level gates distinct from `prerequisites[]`.

## 5. WEEK MAP (weeks 1-104; agenda pools + weekStore hardcoded)

Sources: `src/data/agenda/week*.json` (81 files) + `src/stores/weekStore.ts:71-148` (`buildPool`) + `:443-946` (`initWeek` pushes) + `:1059-1102` (chain-vote synthesis). Scene-JSON week counts from §2 for coverage contrast.
Act map used for TSV: I 1-13, II 14-26, III 27-39, IV 40-52, V 53-64, VI 65-78, VII 79-104.

Compact rows (agenda `sceneId`s + hardcoded `sceneId`s; `?`=conditional: `act3_nightmare_sequence?` needs week≥30 + stress≥80 per `weekStore.ts:869`; `act3_rival_poaching` needs weeks 36-40 + dusek<25 per `:853`; recurring `act_citizen_petitions` weeks %4==0 per `:901`, `act_monthly_press_conference` (week-2)%4==0 per `:917`, `act_campaign_rally` weeks 45-51/97-103 per `:933`, `__radio__` week>3 + broadcasts left per `:793`):
- W01: act1_week1_inauguration,act1_week1_vyktor_briefing,act1_week1_family_dinner,act1_week1_address_nation,social_inaugural_ball_wk1
- W02: act1_w2_formation_meeting,act1_week1_cabinet_introductions,act1_week1_first_briefing,act1_family_tomas_bullying,__budget__,act1_week1_parliament_caucus,act1_week1_bni_discovery,mole_week1_plant,mole_week2_plant
- W03: act1_week3_first_budget,act1_week3_economic_direction,__budget__,act1_family_jonas_challenge,act1_family_liora_mikhael,act1_week3_mine_collapse,mole_week3_choice
- W04: act1_week4_first_month,act1_family_jonas_challenge,act1_family_liora_mikhael,act1_family_tomas_bullying,__budget__,act1_week1_archbishop_dinner,act1_week4_halvek_portraits,security_posture_choice,act_citizen_petitions,__radio__
- W05: act1_week5_bni_crisis,act1_family_jonas_challenge,act1_family_liora_mikhael,act1_family_tomas_bullying,__budget__,act1_week4_first_month,mole_week5_complication,__radio__
- W06: act1_week6_labor_tensions,__budget__,act1_family_jonas_challenge,act1_family_liora_mikhael,act1_week6_police_incident,act_monthly_press_conference,__radio__
- W07: act1_week7_tyvaren_airspace,act1_family_jonas_challenge,act1_family_liora_mikhael,__budget__,act1_week1_first_briefing,act1_week7_commissioner,__radio__
- W08: act1_week8_church_and_state,act1_family_liora_mikhael,__budget__,act1_week6_labor_tensions,act1_week7_tyvaren_airspace,act1_week8_bni_files,act_citizen_petitions,__radio__
- W09: act1_week9_first_quarter,__budget__,act1_family_liora_mikhael,act1_week8_church_and_state,act1_week9_morvec_dinner,act1_week9_thornfeld_cooperatives,__radio__
- W10: act1_week10_reform_committee,__budget__,act1_week10_tyvaren_intel,act1_week11_kravenstal_powderkeg,act1_week12_nadia_voss,act1_week10_archbishops_dinner,act_monthly_press_conference,__radio__
- W11: act1_week11_kravenstal_powderkeg,__budget__,act1_week10_reform_committee,act1_week12_nadia_voss,act1_week11_currency_run,__radio__
- W12: act1_week12_nadia_voss,__budget__,act1_week11_kravenstal_powderkeg,act1_week10_reform_committee,act1_week12_brenner_parade,act2_week12_port_bonds,act_citizen_petitions,__radio__
- W13: __vote__,act1_week13_no_confidence,__budget__,act1_week12_nadia_voss,act1_week11_kravenstal_powderkeg,act1_week4_first_month,__cabinet_reshuffle__,act1_shadow_hawk_induction,__radio__
- W14: act2_week14_convention_opens,__constitution__,__budget__,act2_week15_theron_compromise,act2_week24_brenner_warning,act2_con_neg_kolvar,soraya,theron,brenner,renek,kaelen,pipeline_constitution_drafting,act_monthly_press_conference,__radio__
- W15: act2_week15_theron_compromise,__constitution__,__budget__,act2_week16_kolvar_deal,act2_week19_refugee_flood,act1_week15_dravenni_petition,pipeline_constitution_committee,__radio__
- W16: act2_week16_kolvar_deal,__constitution__,__budget__,act2_week17_church_lobbying,act2_week15_theron_compromise,act2_week16_morvec_pressure,pipeline_constitution_floor_vote,act1_shadow_hawk_first_operation,act_citizen_petitions,__radio__
- W17: act2_week17_church_lobbying,__constitution__,__budget__,act2_week18_vael_oligarch,act2_week16_kolvar_deal,__radio__
- W18: act2_week18_vael_oligarch,__constitution__,__budget__,act2_week21_superpower_choice,act2_week19_refugee_flood,act2_week18_morivask_oil_discovery,act_monthly_press_conference,__radio__
- W19: act2_week19_refugee_flood,__constitution__,__budget__,act2_week18_vael_oligarch,act2_week24_brenner_warning,act1_week19_informant_network,__radio__
- W20: act2_week20_budget_crisis,__constitution__,__budget__,act2_week21_superpower_choice,act2_week22_nadia_investigation,act2_week20_oil_negotiation,act2_week20_megaproject_choice,act_citizen_petitions,__radio__
- W21: act2_week21_superpower_choice,act2_week21_visit_stellamere,act2_week21_visit_petravar,__constitution__,__budget__,act2_week22_nadia_investigation,__radio__
- W22: act2_week22_nadia_investigation,__constitution__,__budget__,act2_week24_brenner_warning,act2_week23_family_crisis_jonas,act2_bca_report_wk22,act2_ssd_report_wk22,act2_week22_oil_outcome,act2_shadow_hawk_voss_connection,act2_week22_protest_or_riot,act_monthly_press_conference,__radio__
- W23: act2_week23_family_crisis_jonas,liora,tomas,__constitution__,__budget__,act2_week22_nadia_investigation,act2_week19_refugee_flood,act2_week23_anonymous_ledger,__radio__
- W24: act2_week24_brenner_warning,__constitution__,__budget__,act2_week23_family_crisis_jonas,act2_week25_referendum_eve,act2_week24_voss_introduction,act_citizen_petitions,__radio__
- W25: act2_week25_referendum_eve,__vote__,__constitution__,__budget__,act2_week24_brenner_warning,act2_week23_family_crisis_tomas,act2_week25_church_schism,__radio__
- W26: __vote__,act2_week26_referendum_decisive,narrow,rejected,__budget__,__constitution__,act2_week23_family_crisis_jonas,act_monthly_press_conference,__radio__
- W27: act3_week27_aftermath_decisive,narrow,rejected,__budget__,act3_week31_inner_circle,act2_week21_superpower_choice,act2_week27_347,__radio__
- W28: act3_week28_economic_crisis,healthy,__budget__,act3_constitution_implementation,act3_week32_tyvaren_ultimatum,act3_week28_currency_speculation,act2_shadow_hawk_morvec_option,act2_week28_voss_crisis,act_citizen_petitions,__radio__
- W29: act3_week29_vyktor_exposed,act3_vyktor_full_disclosure,__budget__,act3_week28_economic_crisis,act3_week32_tyvaren_ultimatum,__radio__
- W30: act3_week30_betrayal_dusek,vostane,vyktor,__budget__,act3_week34_dravenhollow,act3_liora_disgusted,act2_week30_strike_wave_part1,act3_week29_assassination_attempt,act_monthly_press_conference,__radio__,act3_nightmare_sequence?
- W31: act3_week31_inner_circle,__budget__,act3_cabinet_loyalty_audit,act3_week32_tyvaren_ultimatum,act3_jonas_separation,act2_week31_strike_resolution,__radio__,act3_nightmare_sequence?
- W32: act3_week32_tyvaren_ultimatum,__budget__,act3_week33_diplomatic_negotiation,war_preparations,act3_week34_dravenhollow,act3_week28_economic_healthy,act2_week32_voss_outcome,act3_week32_morvec_confrontation,act_citizen_petitions,__radio__,act3_nightmare_sequence?
- W33: act3_week33_war_preparations,diplomatic_negotiation,__budget__,act3_vyktor_reconciliation,act3_week34_dravenhollow,act2_week21_superpower_choice,__radio__,act3_nightmare_sequence?
- W34: act3_week34_dravenhollow,__budget__,act3_military_democracy_bond,act3_tyvaren_border_skirmish,act3_war_economy,act_monthly_press_conference,__radio__,act3_nightmare_sequence?
- W35: __budget__,act3_dravenni_autonomy_talks,act3_tyvaren_border_skirmish,act3_cabinet_loyalty_audit,act3_week36_nadia_publishes,act3_shadow_hawk_exposure_crisis,__radio__,act3_nightmare_sequence?
- W36: act3_week36_nadia_publishes,__budget__,act3_national_address_war,act3_week37_coup_attempt,act3_week34_dravenhollow,act3_rival_poaching,act_citizen_petitions,__radio__,act3_nightmare_sequence?
- W37: act3_week37_coup_attempt,military_rally,__budget__,act3_brenner_negotiation,act3_stellamere_broadcast,act3_week38_family_reckoning,act3_rival_poaching,__radio__,act3_nightmare_sequence?
- W38: act3_week38_family_reckoning,__budget__,act3_coalition_government,act3_international_forum_session,act3_liora_reconciliation,act3_week38_two_letters,act3_rival_poaching,act_monthly_press_conference,__radio__,act3_nightmare_sequence?
- W39: act3_week39_act3_climax,__budget__,act4_week40_war_begins,exile,act4_week41_reform_implementation,act3_week38_family_reckoning,act3_rival_poaching,__radio__,act3_nightmare_sequence?
- W40: act4_week40_war_begins,exile,act4_week41_reform_implementation,__budget__,act4_exile_arc,act4_civil_conflict_arc,act3_week40_border_ultimatum,act3_rival_poaching,act_citizen_petitions,__radio__,act3_nightmare_sequence?
- W41: act4_week41_reform_implementation,__budget__,act4_constitutional_crisis,act4_family_anchored,act4_national_address,__radio__,act3_nightmare_sequence?
- W42: act4_week42_war_strategy,austerity_bites,__budget__,act4_internal_security_state,act4_ima_renegotiation,act4_emergency_powers_invoked,act_monthly_press_conference,__radio__,act3_nightmare_sequence?
- W43: act4_week43_family_resolution,__budget__,act4_family_anchored,estranged,breaking,act4_diplomatic_endgame,__radio__,act3_nightmare_sequence?
- W44: act4_week44_civilian_front,counter_coup,reform_backlash,__budget__,act4_dravenni_war_alliance,act4_ceasefire_talks,act3_week44_loyal_force,act_citizen_petitions,__radio__,act3_nightmare_sequence?
- W45: act4_week45_uprising,__budget__,act4_ima_confrontation,act4_ceasefire_negotiation,act4_occupation_begins,act_campaign_rally,__radio__,act3_nightmare_sequence?
- W46: act4_week46_final_battle,__budget__,act4_forum_showdown,act4_coordinated_response,act4_tomas_redemption,act_monthly_press_conference,act_campaign_rally,__radio__,act3_nightmare_sequence?
- W47: act4_week47_new_order,__budget__,act4_second_referendum,act4_public_mandate,act4_reelection_campaign,act_campaign_rally,__radio__,act3_nightmare_sequence?
- W48: act4_week48_war_outcome,collapse_endgame,__budget__,act4_diplomatic_endgame,act4_tomas_redemption,act_citizen_petitions,act_campaign_rally,__radio__,act3_nightmare_sequence?
- W49: __budget__,act4_family_healing,act4_jonas_divorce,act4_family_conditional,act4_all_fronts,act_campaign_rally,__radio__,act3_nightmare_sequence?
- W50: __constitution__,__budget__,act4_family_healing,act4_jonas_divorce,act4_diplomatic_endgame,act4_week50_two_letters,act_monthly_press_conference,act_campaign_rally,__radio__,act3_nightmare_sequence?
- W51: __budget__,act4_family_healing,act4_reelection_campaign,act4_all_fronts,act4_week47_new_order,act_campaign_rally,__radio__,act3_nightmare_sequence?
- W52: act4_week52_ending,__budget__,act4_family_healing,act3_week52_the_kitchen,act_citizen_petitions,__radio__,act3_nightmare_sequence?
- W53: act5_week53_second_address,__radio__,act3_nightmare_sequence?
- W54: act_monthly_press_conference,__radio__,act3_nightmare_sequence?
- W55: act5_week55_steel_trust,__radio__,act3_nightmare_sequence?
- W56: act5_week56_constitutional_court,act_citizen_petitions,__radio__,act3_nightmare_sequence?
- W57: __radio__,act3_nightmare_sequence?
- W58: act_monthly_press_conference,__radio__,act3_nightmare_sequence?
- W59: __radio__,act3_nightmare_sequence?
- W60: act5_week60_diplomatic_table,act_citizen_petitions,__radio__,act3_nightmare_sequence?
- W61: __radio__,act3_nightmare_sequence?
- W62: act_monthly_press_conference,__radio__,act3_nightmare_sequence?
- W63: act5_week63_military_procurement,__radio__,act3_nightmare_sequence?
- W64: act5_week64_penicillin_cartel,act_citizen_petitions,__radio__,act3_nightmare_sequence?
- W65: act6_week65_border_incident,__radio__,act3_nightmare_sequence?
- W66: act_monthly_press_conference,__radio__,act3_nightmare_sequence?
- W67: __radio__,act3_nightmare_sequence?
- W68: act6_week68_morivask_brain_drain,act_citizen_petitions,__radio__,act3_nightmare_sequence?
- W69: __radio__,act3_nightmare_sequence?
- W70: act_monthly_press_conference,__radio__,act3_nightmare_sequence?
- W71: __radio__,act3_nightmare_sequence?
- W72: act_citizen_petitions,__radio__,act3_nightmare_sequence?
- W73: act6_week73_poisoned_pen,__radio__,act3_nightmare_sequence?
- W74: act_monthly_press_conference,__radio__,act3_nightmare_sequence?
- W75: act6_week75_geological_survey,__radio__,act3_nightmare_sequence?
- W76: act6_week76_midnight_confession,act_citizen_petitions,__radio__,act3_nightmare_sequence?
- W77: act6_week77_factory_explosion,__radio__,act3_nightmare_sequence?
- W78: act6_week78_ashavel_legacy,act_monthly_press_conference,__radio__,act3_nightmare_sequence?
- W79: act7_week79_frontline_visit,__radio__,act3_nightmare_sequence?
- W80: act6_week80_black_gold,act_citizen_petitions,__radio__,act3_nightmare_sequence?
- W81: __radio__,act3_nightmare_sequence?
- W82: act6_week82_housing_bill,act_monthly_press_conference,__radio__,act3_nightmare_sequence?
- W83: act6_week83_energy_transition,__radio__,act3_nightmare_sequence?
- W84: act_citizen_petitions,__radio__,act3_nightmare_sequence?
- W85: __radio__,act3_nightmare_sequence?
- W86: act6_week86_ghost_payroll,act_monthly_press_conference,__radio__,act3_nightmare_sequence?
- W87: __radio__,act3_nightmare_sequence?
- W88: act7_week88_sovarka_europium,act_citizen_petitions,__radio__,act3_nightmare_sequence?
- W89: act6_week89_diluted_medicine,__radio__,act3_nightmare_sequence?
- W90: act_monthly_press_conference,__radio__,act3_nightmare_sequence?
- W91: act7_week91_rogue_shadow,__radio__,act3_nightmare_sequence?
- W92: act7_week92_aldenmoor_tech,act_citizen_petitions,__radio__,act3_nightmare_sequence?
- W93: act7_week93_wiretapped_chancellor,__radio__,act3_nightmare_sequence?
- W94: act7_week94_vyktor_slush_fund,act_monthly_press_conference,__radio__,act3_nightmare_sequence?
- W95: act7_week95_saints_sin,__radio__,act3_nightmare_sequence?
- W96: act7_week96_promethean_charter,act_citizen_petitions,__radio__,act3_nightmare_sequence?
- W97: act7_week97_foreign_asset,act_campaign_rally,__radio__,act3_nightmare_sequence?
- W98: act_monthly_press_conference,act_campaign_rally,__radio__,act3_nightmare_sequence?
- W99: act_campaign_rally,__radio__,act3_nightmare_sequence?
- W100: act7_week100_final_debate,act_citizen_petitions,act_campaign_rally,__radio__,act3_nightmare_sequence?
- W101: act_campaign_rally,__radio__,act3_nightmare_sequence?
- W102: act_monthly_press_conference,act_campaign_rally,__radio__,act3_nightmare_sequence?
- W103: act_campaign_rally,__radio__,act3_nightmare_sequence?
- W104: act_citizen_petitions,__radio__,act3_nightmare_sequence?

Empty-week analysis:
- Agenda-only empty (24): 54,57,58,59,61,62,66,67,69,70,71,72,74,81,84,85,87,90,98,99,101,102,103,104
- Scene-JSON-only empty (12): 49,51,58,62,70,83,98,99,101,102,103,104
- Agenda+scene merged empty (9): 58,62,70,98,99,101,102,103,104
- Agenda+hardcoded merged empty: NONE (all 1-104 have ≥1 agenda or hardcoded; thinnest are radio-only weeks 57,59,61,67,69,71,81,85,87 e.g. W57 `__radio__` only + conditional nightmare)
- Agenda+hardcoded+scene merged empty: NONE

Filename/week contradictions (filename `/week(\d+)/` vs JSON `week`/`weekAvailable`):
- `src/data/narrative/act3/act3_week29_assassination_attempt.json` id `act3_week29_assassination_attempt` filename_week 29 vs json_week 30
- `src/data/narrative/act3/act3_week47_two_letters.json` id `act3_week38_two_letters` filename_week 47 vs json_week 38 (id also says 38)

LOAD-BEARING constraints (audit-only, no fix):
- (a) visited-scene guard only on hardcoded: `src/stores/weekStore.ts:103` (`week===1 && !visited.includes('act1_week1_address_nation')`), `:118`, `:133`, `:448-933` (31× `!visitedSceneIds.includes(...)` e.g. `:448`, `:493`, `:553`, `:568`, `:628`, `:885`, `:901`, `:917`, `:933`), `:1514` (`injectScene` cycle guard). REPORT ONLY.
- (b) buildPool + AgendaSelector lack dedup: `src/stores/weekStore.ts:71-97` filter checks `sceneId==null`, `weekAvailable`, `weekDeadline`, `prerequisites`, `prerequisiteSceneIds`, `prerequisiteFlags` — no `visited` check, no `Set` dedup; `src/components/AgendaSelector.tsx:483-491` maps `agendaPool` directly, no dedup filter. REPORT ONLY.
- (c) week07 cross-wire: `src/data/agenda/week07.json:47-56` `agenda_w7_cabinet_session` title `Cabinet Session — Border Response` → `sceneId: act1_week1_first_briefing` (`weekAvailable:7, weekDeadline:10`). REPORT ONLY.
- (d) seg_kolvar_attacks_oil: `src/data/narrative/act7/act7_week100_final_debate.json:71-73` incoming `path_kolvar_oil → nextSegment: seg_kolvar_attacks_oil`; `:127-133` segment def with `oil_continue → nextSegment: seg_katerin_responds`; target `:151` `seg_katerin_responds` PRESENT. Audited present; no fix per RULES. REPORT ONLY.

## 6. ENGINES AND STORES (name | path | public API ≤5 lines)

Stores (`src/stores/`):
- gameStore | `src/stores/gameStore.ts:41,154-209` | `INITIAL_STATE`; `applyModifiers(mods)`; `applyBudget(next)`; `advanceWeek()`; `resetToInitial()/captureSnapshot()` + dev `devSetWeek/devSetStat`, Veal/Morvec, emergency, letters, radio, mole, Soren, projects.
- weekStore | `src/stores/weekStore.ts:71-97,242-326` | `buildPool(week,state,flags,visited)`; `initWeek/endBriefing/endPress/endLegislation/toggleAgendaItem/confirmAgenda/advanceQueue/completeWeek/injectScene/launchSingleScene`; phases briefing→press→map→scene→review.
- narrativeStore | `src/stores/narrativeStore.ts:188-206,225,345` | `visitedSceneIds/activeFlags`; `loadScene(id)/resetScene/resetAll/processChoice(choiceId)`; visited dedup `:568-570`; flag union `:564`.
- chainStore | `src/stores/chainStore.ts:9-28` | `scheduled`; `schedule(triggers,week,sourceId)`; `process(week,state,flags)→string[]`.
- billStore/cabinetStore/codexStore/journalStore/letterStore/newsStore/parliamentStore/settingsStore/decreeStore | `src/stores/*.ts` | bill: `loadAll/pending/history/overlay`; cabinet: `ministers/formation/requests`; codex: `entries/seen/inline`; journal: `addEntry/stats/byAct`; letter: `load/trigger/markRead`; news: `addArticles/markRead/getCounts`; parliament: `load/prepareSitting/finalizeSitting`; settings: `playtime/audio`; decree: `initDecrees/sign/reject/table`.

Engines (`src/engine/` — every `*Engine.ts` + required managers):
- AssassinationEngine | `src/engine/AssassinationEngine.ts:40,109` | `evaluateAssassinationTrigger(state,flags)`; `getAssassinationSceneId(variant)`.
- AudioManager | `src/engine/AudioManager.ts:606` | `audioManager` singleton (MP3 registry `musicUrls:18-34`, `flaggedSceneMap:36-40`); play/stop/theme per scene.
- audioEngine | `src/engine/audioEngine.ts:29,115-241` | `setAudioSettings/startAmbient/stopAmbient/playTypewriterKey/playPaperShuffle/playStamp/playChime/resume/destroy`.
- BillEngine | `src/engine/BillEngine.ts:9-129` | `loadAllBills/getBillsSync/getPendingBillsForWeek/getBillById/evaluatePrereqs/calculateVetoOverride/executeSign/executeVeto`.
- BudgetCrisisEngine | `src/engine/BudgetCrisisEngine.ts:9` | `checkForBudgetCrisis(state,flags)→trigger|null`.
- budgetEffects | `src/engine/budgetEffects.ts:56,99` | `computeBudgetModifiers(alloc)`; `aggregateModifiers(mods)`.
- ChainReactionEngine | `src/engine/ChainReactionEngine.ts:21,50` | `buildScheduled(triggers,week)`; `resolveChains(scheduled,week,state,flags)`.
- CliffhangerEngine | `src/engine/CliffhangerEngine.ts:6` | `generateCliffhanger(week)→string`.
- conditionEvaluator | `src/engine/conditionEvaluator.ts:105,117` | `evaluateCondition(cond,state,flags)`; `evaluateAll(conds,state,flags)`.
- CorruptionEngine | `src/engine/CorruptionEngine.ts:70-175` | `calculateDiscoveryChance/processCorruptionDiscovery/recordCorruptionFlag/getDiscoveredCount/shouldTriggerImpeachment`.
- DiaryEngine | `src/engine/DiaryEngine.ts:37` | `generateDiaryEntry(week)→DiaryEntry`.
- EconomicEngine | `src/engine/EconomicEngine.ts:14,74` | `getEconomicEffects(direction)`; `getEconomicDirectionLabel(direction)`.
- ElectionEngine | `src/engine/ElectionEngine.ts:10` | `calculateElectionResult(state,flags)→ElectionResult`.
- EmergencyDecreeEngine | `src/engine/EmergencyDecreeEngine.ts:9` | `checkForEmergencies(state,flags)→trigger|null`.
- endingCalculator | `src/engine/endingCalculator.ts:14-121` | `computeGovernanceScore/computePersonalScore/determineGovernanceOutcome/determinePersonalOutcome/calculateEnding`.
- FamilyDinnerEngine | `src/engine/FamilyDinnerEngine.ts:10,61` | `computeDinnerContext(state,flags)`; `buildDinnerChainTriggers(week)`.
- FlagHandlers | `src/engine/FlagHandlers.ts:38,128-173` | `FLAG_HANDLERS`; `handleMoleClue/handleKickback/buildCorruptionEntry/handleMoleAccusation`.
- IntelligenceBriefingEngine | `src/engine/IntelligenceBriefingEngine.ts:12,67` | `computeBriefingContext(state,flags)`; `buildBriefingChainTriggers(week)`.
- JonasEngine | `src/engine/JonasEngine.ts:3,35,45` | `computeJonasStage(state)`; `getJonasStageLabel/Description`.
- LegacyEngine | `src/engine/LegacyEngine.ts:46` | `calculateLegacy(state,flags)→LegacyVerdict`.
- LetterEngine | `src/engine/LetterEngine.ts:16,129-218` | `LETTER_OPTIONS`; `generateLetterContent/getAvailableLetters/createSentLetter`.
- LocationResolver | `src/engine/LocationResolver.ts` | location→map pin resolver (used by MapView).
- MoleEngine | `src/engine/MoleEngine.ts:3,29,87-150` | `MOLE_CHARACTERS/ALL_CLUES`; `getMoleConsequences/getClueCount/getTotalDiscoverableClues`.
- NarrativeEngine | `src/engine/NarrativeEngine.ts:12-143` | `ALL_SCENES/SCENE_REGISTRY`; `getScene(id)/getNextAvailableScene/getAvailableChoices/canAdvanceWeek/getAvailableAgendaItems/getUnavailableDueToPrerequisites/getSceneForGate`.
- newsTemplates (DUPLICATE per CLAUDE.md) | `src/engine/newsTemplates.ts:20,386,429` vs canonical `src/data/news/newsTemplates.ts` | `NEWSPAPER_LABELS`; `selectHeadlines(state,flags)`; `generateVyktorOpening`.
- ParliamentEngine | `src/engine/ParliamentEngine.ts` | `shouldTriggerParliament(week,lastWeek,emergencyFlag)` (used `weekStore.ts:991-995`).
- RadioEngine | `src/engine/RadioEngine.ts:82-182` | `MAX_BROADCASTS=4`; `calculateRadioMultiplier(used)`; `getRadioResult(state,theme)`.
- SaveManager | `src/engine/SaveManager.ts:16-543` | `AUTOSAVE_SLOT=0/MANUAL_SLOT_COUNT=10`; `saveGame(slot,name)/loadGame(slot)/deleteSave/listSaves/downloadSaveJson/triggerImportPicker/importSaveToSlot/checkLoadSafety`.
- VoteEngine | `src/engine/VoteEngine.ts:20-149` | `calculateProjection/applySpending/resolveVote`.
- WhisperNetworkEngine | `src/engine/WhisperNetworkEngine.ts:8` | `checkIntelligenceIntegrity(state,flags)→status`.

Types: `src/types/narrative.ts:1-115` (`NarrativeNode/SceneChoice/Condition/ChainTrigger` + legacy aliases `statEffects`, `dialogue`/`monologue`/`narrative`); `src/types/week.ts` (`AgendaItem/SLOT_MAX`); `src/types/gameState.ts` (`GameState/StateModifier`).

## 7. SCRIPT

Command (verbatim first): `node scripts/audit-scenes.mjs --dir src/data/narrative --scan src`
Result: MODULE_NOT_FOUND — `scripts/audit-scenes.mjs` ABSENT (`Test-Path` False; `scripts/` has 6 files listed in §1, none named `audit-scenes.mjs`). Stdout last 40 lines: SCRIPT ABSENT.
Patches to `scripts/audit-scenes.mjs` key-name SETs: NONE (no file, no rerun).
Adaptations: NONE (no adaptation; temp scanners `_tmp_*.py` in `docs/audit/` were P1 tooling, not script patches; all removed after use).
Related existing script (not run per task): `scripts/audit-narrative.mjs` PRESENT (`Test-Path` True) — out of scope for P1 verbatim command.

Lore/canonical spot-checks (per STANDING RULES §3, no violations asserted as findings — audit-only):
- Currency/ superpower/ antagonist/ acts-weeks claims require separate P2+ passes; P1 records only that scene JSONs use `oskar_brenner` (e.g. `act1_brenner_defense_briefing.json:8`) and `act` 1-7 + weeks 0-100 observed (see §2/§5).
