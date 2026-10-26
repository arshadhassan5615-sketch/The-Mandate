# Retired, superseded and removed content

Owner reference for meeting content that is deliberately not reachable from the game. Source evidence: `orphan-classification.md` (repo root of the workspace, work order K2) and work order W1.

Every authored meeting now either has a launch path (agenda entry or choice `chainTriggers`) or is listed below.

## (a) Retired scenes (no launch path, scene files kept on disk)

| Scene id | Reason |
| --- | --- |
| `act2_week18_vael_fund` | Duplicate of the agenda-launched `act2_week18_vael_oligarch` (Vael week-18 beat). Its outbound chains (`act3_vael_fund_return`, `act3_vael_fund_return_hidden`) are therefore also unreachable. |
| `act2_week20_oligarch_meeting` | No setup and missing `type` field. Nothing in the current flow leads to it. |
| `act3_chain_voss_military_use` | Stub with no source. Added as a placeholder in `dfa0972` and never wired. |
| `act3_church_active_opposition_scene` | One-choice stub, renamed from `act3_church_active_opposition` in `74cbfe4` to fix an id clash. Never wired. |

## (b) Removed agenda entries (dead; scene content was never written)

These entries pointed at scenes that could not display the content their title and description promise. They were deleted from the agenda files. The title, description and window are kept here so the owner can write the content later.

| Entry id | File (removed from) | Title | Description | Window | Category | Original sceneId |
| --- | --- | --- | --- | --- | --- | --- |
| `agenda_w7_cabinet_session` | `src/data/agenda/week07.json` | Cabinet Session — Border Response | Full cabinet convenes to coordinate the government's unified response to the Tyvaren provocation. Brenner will present the military assessment. | 7–10 | cabinet | `act1_week1_first_briefing` |
| `agenda_w13_cabinet_confidence` | `src/data/agenda/week13.json` | Cabinet Session — Government Continuity | The cabinet needs to hear from you before the vote. Some of them are already getting calls from Kolvar's people about retaining their posts 'in the next government.' | 13–15 | cabinet | `act1_week4_first_month` |
| `agenda_w23_refugee_update` | `src/data/agenda/week23.json` | Refugee Crisis — Winter Preparations | Winter is three weeks away. The camps at Ondra need winterization. Interior says the budget covers tents, not heating. The first frost is forecast for next week. | 23–26 | crisis | `act2_week19_refugee_flood` |
| `agenda_w38_liora_recovery` | `src/data/agenda/week38.json` | Liora — After Everything | Liora came home after the coup attempt. She didn't say anything about the protest, the arrest, the photograph. She just sat at the kitchen table and waited for you to notice she was there. | 38–42 | personal | `act3_liora_reconciliation` (prerequisite `flags.liora_chancellor_attended == true`) |
| `agenda_w51_new_order` | `src/data/agenda/week51.json` | New Order — Final Assessment | The reform framework is largely in place. The remaining provisions will be implemented by whoever holds this office next. The question is whether that's you — and whether what you've built will survive the transition regardless. | 51–52 | parliament | `act4_week47_new_order` (prerequisite `flags.reform_backlash_resolved == true`) |

## (c) Superseded scenes and non-meeting news pages

| Scene id | Status | Reason |
| --- | --- | --- |
| `act1_nadia_exclusive_interview` | Superseded | Same title ("On The Record") and same character (`nadia_voss`) as `act2_week22_nadia_investigation`, which is scheduled. |
| `act1_week20_stellamere_summit` | Superseded | Same Stellamere setting and Ambassador Cole beat as `act2_week21_visit_stellamere`, which is scheduled. |
| `act3_chain_assassination_attempt` | Superseded | `AssassinationEngine.ts` picks one of the `act3_assassination_*` variants (`_default`, `_sniper`, `_bombing`, ...); this generic scene is never selected. |
| `act3_diplomacy_tyvaren_peace` | Superseded | Same week-32 Vukov ultimatum beat as `act3_week32_tyvaren_ultimatum`, which is scheduled. |
| `news_inauguration_gazette` | Not a meeting | "Sevagrad Gazette" special-edition page. Sets `read_gazette_inauguration`, which nothing reads. Kept as a news page, not a meeting. |
| `news_inauguration_herald` | Not a meeting | "Ashenmere Herald" special-edition page. Sets `read_herald_inauguration`, which nothing reads. |
| `news_inauguration_worker` | Not a meeting | "Kravenstal Worker" special-edition page. Sets `read_worker_inauguration`, which nothing reads. |

## Scheduled as part of W1 (for reference)

- `act3_tyvaren_pressure` → agenda `agenda_w24_tyvaren_pressure` (weeks 24–26)
- `act2_diplomacy_arcturian_trade` → agenda `agenda_w15_arcturian_trade` (weeks 15–17)
- `family_referendum_night` → agenda `agenda_w26_family_referendum_night` (week 26)
- `act2_deficit_crisis` → agenda `agenda_w16_deficit_crisis` (weeks 16–20, requires `nation.nationalDebt > 450`)
- `act1_chain_kravenstal_unrest` → agenda `agenda_w5_kravenstal_unrest` (weeks 5–8, requires `factions.workersCoalition <= 40`)
- `act1_renek_sermon` → agenda `agenda_w5_renek_sermon` (weeks 5–7, requires `flags.ball_chose_renek != true`)
- `act1_kolvar_opposition_rally` → agenda `agenda_w3_kolvar_opposition_rally` (weeks 3–5, requires `flags.inaugural_reformist == true`)
- `act1_kolvar_counterattack` → agenda `agenda_w4_kolvar_counterattack` (weeks 4–6, requires `flags.inaugural_reformist == true`)
- `act1_chain_tyvaren_propaganda_war` → chain from `act1_week7_tyvaren_airspace` choice `diplomatic_only` (delay 3 weeks)
- `act2_superpower_coldness` → chain from `act2_week21_superpower_choice` choice `visit_neither_nonalignment` (delay 1 week)
