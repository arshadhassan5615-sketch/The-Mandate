# P3 — Systems and State Audit (READ-ONLY)

Repo root: `C:\Users\arsha\OneDrive\Documents\game\the-mandate`
Scope: `src/types/gameState.ts`, `src/stores/gameStore.ts`, `src/engine/SaveManager.ts`, `src/db/mandateDb.ts`, 5 engines, assassination scenes, budget chain, cabinet data, dormant UI.
Rule: REPORT only; no fixes (incl. load-bearing (a)-(d) from P1/P2 where touched).

## 1. STATE SHAPE — GameState (63 top-level fields) vs saves vs reset vs writers

Canonical field list: `src/types/gameState.ts:142-230` (63 keys). Defaults: `src/stores/gameStore.ts:41-152` (`INITIAL_STATE`; budget `INITIAL_BUDGET:25-38`).

Persist paths (two parallel systems):
- Slot saves (Dexie): `src/engine/SaveManager.ts:89-199` serialize (`version:2`), `:242-427` deserialize.
- Reload persist (zustand/middleware): `src/stores/gameStore.ts:679-755` (`name:'the-mandate-save'`, `version:2`, `partialize:683-744`, `migrate:745-753`).
- Reset: `resetToInitial:629-633` (spread `INITIAL_STATE` — all 63 game fields); `bootNewGame:638-677` (resetToInitial + mole randomize + snapshot + decree/cabinet/bill/narrative/chain/news/journal/letter resets).

Field table (Persisted-Slot = SaveManager serialize; Persisted-Reload = persist partialize; Reset = bootNewGame coverage; Writers = scene `stateChanges`/`statEffects` or engine setter):

| field | type | default | slot | reload | reset | writers |
|---|---|---|---|---|---|---|
| currentWeek | number | 1 (`gameStore.ts:42`) | YES (`SaveManager.ts:98`) | YES (`gameStore.ts:684`) | YES via resetToInitial | weekStore advanceWeek/devSetWeek; load merge |
| currentAct | number | 1 (`:43`) | YES (`:99`) | YES (`:685`) | YES | advanceWeek thresholds `:368-374` |
| furthestWeek | number | 1 (`:44`) | YES (`:100`) | NO (ABSENT in `:683-744`) | YES | advanceWeek `:375` |
| nation[*] (22 keys, `gameState.ts:35-57`) | NationState | mixed (`:46-68`) | YES as object (`:101`) | YES (`:686`) | YES | scenes (economyHealth 261, militaryReadiness 259, publicOrder 379, etc. per `_p3stats.txt`); budgetEffects; SOE tick |
| factions[*] (8 keys, `:59-68`) | FactionState | mixed (`:70-79`) | YES as object (`:102`) | YES (`:687`) | YES | scenes (reformists 787, ironCovenant 459, etc.); reshuffle faction -10 |
| personal[*] (8 keys, `:70-79`) | PersonalState | mixed (`:81-90`) | YES as object (`:103`) | YES (`:688`) | YES | scenes (moralCompass 1039, publicImage 715, marriageHealth 125, etc.) |
| budget[*] (12 keys, `:18-33`) | BudgetAllocations | INITIAL_BUDGET (`:92`) | YES as object (`:104`) | YES (`:689`) | YES | BudgetInterface via applyBudget |
| playerBackground/Personality/Appearance | enums | Academic/Measured/Professional (`:94-96`) | YES (`:105-107`) | YES (`:690-692`) | YES | setPlayerOptions |
| termFocus | string[] | [] (`:97`) | YES (`:108`) | YES (`:693`) | YES | setTermFocus |
| advisorTrust[*] (6 keys) | AdvisorTrust | 50x6 (`:98`) | YES as object (`:109`) | YES (`:694`) | YES | scenes (advisorTrust.dusek 19, vyktor 13, theron 9, etc.) |
| vaelInfluence/morvecInfluence/shadowInfluence/shadowFootprint | number | 15/0/5/0 (`:99-102`) | YES (`:110-113`) | YES (`:695-698`) | YES | scenes (vaelInfluence 70, morvecInfluence 35, shadowInfluence 52, shadowFootprint 33) |
| activeAgents/maxAgents/activeOperations | number | 2/3/0 (`:104-106`) | NO (ABSENT in `:97-155`) | YES (`:707-709`) | YES | spy systems (no scene `stateChanges` writers observed) |
| tyvarenHostility/vossRelation/sovarka_relation/danika_loyalty/refugeeCount/religiousAdherence | number | 0/0/0/50/2800/72 (`:107-112`) | YES (`:114-119`) | YES (`:699-704`) | YES | scenes (tyvarenHostility 18, refugeeCount 5, religiousAdherence 10, etc.) |
| playerPolling/kolvarPolling | number | 68/24 (`:114-115`) | NO (ABSENT in `:97-155`) | YES (`:705-706`) | YES | scenes (playerPolling 3, kolvarPolling 3 via `act_campaign_rally.json:31,46`); weekly polling tick (`weekStore.ts:1745-1762`) |
| stateOfEmergency(+Week/+Extensions/+DecreesIssued) | bool/num | false/0/0/0 (`:116-119`) | YES (`:120-123`) | YES (`:710-713`) | YES | declare/extend/lift/issueEmergencyDecree |
| seridaAlive | boolean | true (`:120`) | YES (`:124`) | YES (`:714`) | YES | setSeridaDead |
| moleIdentity/clues/moleDiscovered/moleWronglyAccused | mixed | null/[]/false/null (`:121-124`) | YES (`:125-128`) | YES (`:715-718`) | YES (randomize AFTER reset) | randomizeMoleIdentity/discoverClue/markMoleDiscovered/setMoleWronglyAccused |
| sorenImmunityRevoked/sorenTrialOutcome/sorenFilesRevealed/sorenLinkedToMikhael | mixed | false/null/false/false (`:125-128`) | YES (`:129-132`) | YES (`:719-722`) | YES | revoke/setTrial/revealSorenFiles |
| economicDirection | enum\|null | null (`:129`) | YES (`:133`) | YES (`:723`) | YES | setEconomicDirection (Week 3 choice) |
| jonasPublicStage | enum | supportive_spouse (`:130`) | YES (`:134`) | YES (`:724`) | YES | setJonasPublicStage; weekly `computeJonasStage` (`weekStore.ts:1799`) |
| securityPosture | minimal\|standard\|high | standard (`:131`) | NO (ABSENT both) | NO (ABSENT in `:683-744`) | YES | SecurityPostureChoice component (no scene-stat writer in `_p3stats.txt` top 97); read by AssassinationEngine |
| seridaTrust/seridaMorale | number | 50/70 (`:132-133`) | YES (`:135-136`) | YES (`:725-726`) | YES | scenes (seridaTrust 12, seridaMorale 10); setSeridaTrust/Morale |
| sentLetters | SentLetter[] | [] (`:134`) | YES (`:137`) | YES (`:727`) | YES | sendLetter/markLetterResponseArrived |
| radioBroadcastsUsed | number | 0 (`:135`) | YES (`:138`) | YES (`:728`) | YES | useRadioBroadcast |
| corruptionLedger/corruptionDiscoveredCount/voteSpendingTotal | mixed | []/0/0 (`:136-138`) | YES (`:139-141`) | YES (`:729-731`) | YES | recordCorruptionEntry/applyDiscoveredCorruption; scenes (personalWealth 35, vote labels `vote.ts:80-97`) |
| activeProjects/completedProjects | mixed | []/[] (`:139-140`) | YES (`:142-143`) | YES (`:732-733`) | YES | start/advance/complete/cancel/resolveMidpoint |
| personalNotes/journalReflections/diaryEntries | mixed | ''/[]/[] (`:141-143`) | YES (`:144-146`) | personalNotes YES (`:734`), journalReflections NO (ABSENT), diaryEntries YES (`:735`) | YES | setPersonalNotes/addJournalReflection/addDiaryEntry |
| economyHistory/debtHistory/inflationHistory/publicOrderHistory/effectLog | arrays | [] (`:144-148`) | YES (`:147-151`) | YES (`:736-740`) | YES | completeWeek push; withEffectLog cap 500 (`gameStore.ts:219-225`) |
| lastParliamentWeek/emergencyParliamentFlag | number/bool | 0/false (`:149-150`) | YES (`:152-153`) | YES (`:741-742`) | YES | parliament sitting flow |
| initialSnapshot | GameState\|null | null (`:151`) | FORCED null (`SaveManager.ts:154`, actions uncloneable) | YES (`:743`) | YES (captureSnapshot AFTER reset in bootNewGame) | captureSnapshot |

MISMATCHES (one line each):
- MISS-SAVE-1 | `securityPosture` | written? read by `AssassinationEngine.ts:26-28` + set by SecurityPostureChoice | missing from BOTH SaveManager serialize AND persist partialize → reloads reset to 'standard' | `src/types/gameState.ts:195` vs `src/engine/SaveManager.ts:97-155` ABSENT vs `src/stores/gameStore.ts:683-744` ABSENT
- MISS-SAVE-2 | `playerPolling`/`kolvarPolling` | written by scenes (`act_campaign_rally.json:31,46`) + weekly tick (`weekStore.ts:1745-1762`) | missing from SaveManager slot serialize (present in persist) → slot load falls back to INITIAL_STATE 68/24 via merge (`SaveManager.ts:273`) | `SaveManager.ts:97-155` ABSENT
- MISS-SAVE-3 | `activeAgents`/`maxAgents`/`activeOperations` | spy systems | missing from SaveManager slot serialize (present in persist) → slot load resets to 2/3/0 | `SaveManager.ts:97-155` ABSENT
- MISS-SAVE-4 | `furthestWeek` | anti-scum (`checkLoadSafety:543-551`) | missing from persist partialize (present in SaveManager) → browser-reload loses furthest, slot-load keeps | `gameStore.ts:683-744` ABSENT
- MISS-SAVE-5 | `journalReflections` | addJournalReflection | missing from persist partialize (present in SaveManager) → reload loses, slot keeps | `gameStore.ts:683-744` ABSENT
- MISS-RESET-1 | `parliamentStore` | ABSENT in `bootNewGame:638-677` (no setState) → prior sittingHistory leaks on direct-to-prologue boot | `gameStore.ts:638-677` vs weekStore `startCustomization` (which also omits parliament? verify before claiming — boot path confirmed missing)
- MISS-RESET-2 | `codexStore` (+ `mandate-codex-seen` only localStorage removal `:643`, no store reset) | ABSENT in boot | same lines
- MISS-RESET-3 | `weekStore` own fields (phase/agendaPool/selectedIds/vote/diary/cliffhanger/cutscene/gate) | ABSENT in boot (only other stores reset) | same lines
- MISS-RESET-4 | `cabinet.dismissedMinisters` | boot sets ministers/formation/pending/completed (`:654-664`) but NOT dismissedMinisters (persisted per `SaveManager.ts:171,319`) → prior dismissals leak | `gameStore.ts:654-664` ABSENT key
- MISS-RESET-5 | `settingsStore` (except `resetPlaytime:645`) + `billStore.vetoOverrideResult` covered (`:665-671` sets it — OK) — settings volume/theme persist across boot (by design? flag as observed, not bug)
- ALIAS-OK | 97 distinct scene stat paths all resolve via canonical paths or `PATH_ALIASES:gameStore.ts:232-264` (also `conditionEvaluator.ts:19`); unknown paths only warn (`gameStore.ts:274-277,309-312`); no unmapped scene-stat writer observed
- PERSISTED-NEVER-READ | `initialSnapshot` persisted by reload (`:743`) but slot-forced null (`SaveManager.ts:154`); read only by LegacyEngine (`LegacyEngine.ts:47-48` `initialSnapshot ?? state`) — slot-loaded games always take `?? state` branch (no baseline) → legacy deltas degrade gracefully, not crash

## 2. SAVE INTEGRITY

- Serialize/deserialize: `SaveManager.ts:64-238` write (Dexie put + localStorage fallback `:225-237`; 4MB trim `:204-216`); `:242-427` read (Dexie get + localStorage fallback `:245-253`; legacy `<2` defaults `:268`; merge over INITIAL_STATE `:273` H3 fix; per-store restores `:276-424`; `initWeek:424` re-entry).
- Migrations: `mandateDb.ts:64-69` single `version(1)` — no migration funcs; `SaveManager.ts:266-268` legacy `<2` branch fills decree/cabinet/bill/journal/news/letter defaults; `gameStore.ts:745-753` persist `migrate(0/1)` merges INITIAL_STATE. No field renames handled — merge-only.
- Slots (11 = 1 autosave + 10 manual): `AUTOSAVE_SLOT=0` + `MANUAL_SLOT_COUNT=10` (`SaveManager.ts:16-17`); `listSaves:445-469` returns length 11 (`:458`); localStorage loop `0..10` (`:43`); delete clears both (`:431-439`); AUTOSAVE name guard (`:77-87`); export filename week-stamped (`:479`).
- Restores (all via merge/restores above): flags YES (`:157`→`:280`); week YES (`weekNumber:94` + gameState.currentWeek merge `:276`); act YES (`actNumber:95` + currentAct merge); cabinet YES incl dismissedMinisters (`:169-176`→`:317-324`); economy YES (nation merge); influence YES (vael/morvec/shadow merge); marriage health YES (personal merge); injury flags YES (flags are in activeFlags, e.g. `permanent_injury_sustained` set week30, restored via `:280`) — with MISS-SAVE-1/2/3 caveats from §1.

## 3. ENGINES (trigger / inputs / outputs / double-fire / missing-flag)

- ElectionEngine | `src/engine/ElectionEngine.ts:10-31` + caller `src/stores/weekStore.ts:1764-1796` | trigger: `newWeek%52==0` (weeks 52, 104); term-limit ends at ≥104 (`:1780`) | inputs: `playerPolling/kolvarPolling` + `government_captured` flag | outputs: epilogue phase (kolvar win) or victory label + `election_won_term_N` flag (`:1794`) | double-fire: week-arithmetic guard — single `completeWeek` pass per week; reload at post-election week advances forward, no re-fire | missing flags: `government_captured` ABSENT → non-landslide summary branch (`:18-20`); polling ABSENT → INITIAL_STATE via load-merge (see §1)
- LegacyEngine | `src/engine/LegacyEngine.ts:46-254` (pure; 6 dimensions + achievements + comparison + paragraphs) | trigger: endgame screens (no week gate; reads `initialSnapshot ?? state :47-48`) | inputs: nation/factions/personal + ~30 flags (constitution, Soren, mole, assassination_survived, kickback, etc.) | outputs: LegacyVerdict (no writes) | double-fire: N/A (idempotent pure) | missing flags: all `includes` default false → lower scores; `initialSnapshot` null (slot-loaded, §1) → deltas vs self (economyDelta 0) — graceful degrade, no crash
- AssassinationEngine | `src/engine/AssassinationEngine.ts:40-107` + caller `weekStore.ts:1727-1737` (schedule delay 0) + scenes `act3_assassination_{bombing,sniper,poisoning,default}.json` | trigger: weeks 30-36 (`:46`), variants sniper (old-guard thresholds `:60-66`), bombing (publicOrder+desperate `:69-84` / ssd retaliation `:88-94`), poisoning (tyvaren flags `:98-104`) | inputs: week/factions/nation + flags + `securityPosture` + interior minister (`computeSecurityReliability:22-38`) | outputs: variant → sceneId (`getAssassinationSceneId:109-119`) → chain schedule | double-fire: flag guard `:50` (`assassination_survived/attempted`) persists via flags → safe same-week + across save/load | missing flags: absent trigger flags skip branches (no crash); `securityPosture` undefined (save bug §1) → reliability 1.0 baseline — graceful but wrong thresholds
- FamilyDinnerEngine | `src/engine/FamilyDinnerEngine.ts:10-69` + scheduler `MorningBriefing.tsx:101-108` | trigger: chain weeks [6,12,18,24,30,36,42,48] (`:62`) future-only (`:64`) | inputs: flags (minister_defense_brenner, morvec_debt_owed, workers_deal_struck, press_suppressed) + publicOrder/SOE/marriage/tomas | outputs: ≤3 injectedSegments + theme + jonasStance + choices; chains scheduled once | double-fire: `family_dinner_chains_scheduled` flag guard (`MorningBriefing.tsx:102`) persists → safe incl save/load | missing flags: no-flag → fewer injections; Jonas defaults supportive (`:44-46`); theme falls back personal (`:49-51`) — graceful
- IntelligenceBriefingEngine | `src/engine/IntelligenceBriefingEngine.ts:12-75` + scheduler `MorningBriefing.tsx:110-117` | trigger: weeks [3,7,11,15,19,23,27,31,35,39,43,47] (`:68`) future-only | inputs: clues/factions/hostility/flags (morivask_oil_deal_complete, *_corruption_exposed `:10,36`, vael/morvec) | outputs: ≤3 segments + threatLevel + choices | double-fire: `intelligence_briefing_chains_scheduled` guard (`:111`) persists → safe | missing flags: routine_quiet fallback (`:47-49`); threat routine (`:52-58`) — graceful

## 4. INJURY CHAIN

- Writers of `permanent_injury_sustained` (flag): bombing YES (`act3_assassination_bombing.json:54` 6-flag array incl injury); default YES (`act3_assassination_default.json:43` 4-flag array); week29-attempt YES all 3 choices (`act3_week29_assassination_attempt.json:26,39,52` + post_attempt_injury); sniper ABSENT (`act3_assassination_sniper.json:56` 5 flags, NO injury — Serida takes bullet, Katerin unharmed per `:20`); poisoning ABSENT (`act3_assassination_poisoning.json:60` 5 flags, NO injury — yet fiction describes tremors/nerve damage `:28,42`).
- VERDICT: FAIL (2/4 variants). Bombing/default set; sniper consistent-ish (no Katerin injury in fiction); poisoning INCONSISTENT (fiction injury, no flag) → tremor content silently absent on poisoning path.
- Tremor-injection conditional monologues (all `{"type":"flag","flag":"permanent_injury_sustained","value":true}`): week53 (`act5_week53_second_address.json:51` segments.check_outcome); week56 (`act5_week56_constitutional_court.json:127`); week69 (`act6_week69_generals_toast.json:20`); week74 (`act6_week74_voss_cipher.json:89`); week78 (`act6_week78_ashavel_legacy.json:24`); week85 (`act7_week85_capital_strike.json:124`); week90 (`act7_week90_campaign_trail.json:80`); week100 (`act7_week100_final_debate.json:155` + choice prereq `:267-269` wednesday_honest). Earliest week 53 > assassination window 30-36 → none can fire pre-injury (flag unset before week30; gate requires true). On sniper/poisoning paths they never fire (silent skip, not crash).

## 5. ECONOMY

- Order (`gameStore.ts:350-357` → `budgetEffects.ts:56-96`): category effects per ±10M (`:62-71`: military→readiness/covenant; debtService→debt/inflation/standing; govtAdmin→corruption/order; infra→economy/business; education→economy/reformists/image; healthcare→order/workers; welfare→workers/order/inflation; bniSecurity→liberties/press) THEN balance: revenue−expenditure (`:77-80`); deficit → economyHealth −1/10M + debt +1/10M (`:84-87`); surplus → economy +0.5/10M, debt −0.5/10M (`:89-93`); flag `severe_deficit_crisis` iff balance<−100 (`:88`).
- Crisis wiring: `severe_deficit_crisis` + !`deficit_crisis_resolved` → `{sceneId:'crisis_deficit_emergency'}` (`BudgetCrisisEngine.ts:9-24`); surfaced as forced AgendaSelector section (`AgendaSelector.tsx:323-326` memo + `:456-461` render; check `EmergencyDecreeEngine`/`WhisperNetworkEngine` siblings). Scene exists (`crisis/crisis_deficit_emergency.json:2` id `crisis_deficit_emergency`; segments `vostane_numbers:22`, `vostane_options:36`). Reachable YES when flag set (forced card, not agenda-file-gated).
- Currency symbols (grep `src/**/*.{ts,tsx,json}`): `₭` ONLY — BudgetInterface (`121,293,312,319,371`), vote tiers (`vote.ts:80,88,97`), panels, InvestmentPanel, TopBar (`189`), scenes (oil ₭500k/2.5M/200M, corporate ₭10M, ghost payroll, etc.). `₨` grep = 0 matches. Prose words `kroner/krone/Krone` (decrees.ts, weekStore news `1214,1288`, BCA `840M kroner`, journal `18M we did not have. Worth every krone.`) are names, not symbols; `Orythian Mark` (cabinet `:35`) is foreign name. Canonical lore (₭ never ₨) HOLDS for symbols.

## 6. CABINET

- Completeness (10 ministries × 2): PASS — `src/data/ministers.ts`: finance `:10,27`, interior `:46,63`, defense `:82,99` (colonel_dusek + general_vass), justice `:118,135`, labor `:154,171`, foreign_affairs `:190,207`, education `:226,243`, health `:262,279`, development `:298,315`, resources `:334,351` = 20 candidates. (Data note: `general_vass`/`General Mikov Vass` present `:96-111` + `ConversationPanel.tsx:29`; standing lore says no Vass — REPORTED, no fix.)
- Costs: proactive reshuffle = `public_trust −8` (alias → `factions.reformists` per `gameStore.ts:233`, `conditionEvaluator.ts:19`) + outgoing faction −10 (`CabinetFormation.tsx:120-128`); reactive (loyalty<25 or corruption-exposed+satisfaction<20) = free, bypasses cooldown, no public_trust penalty, routes to forced reshuffle (`CabinetMeeting.tsx:78-96`).
- Cooldown: rule exists `canReshuffle: currentWeek−appointed_week≥6` (`cabinetStore.ts:99-103`) but 0 callers (grep `canReshuffle\(` = definition only) → UNENFORCED in UI (`CabinetFormation.tsx:111-132` calls `reshuffleMinister` directly). Persistence mechanism exists (`ministers[].appointed_week` saved `SaveManager.ts:170`→restored `:318`; dismissedMinisters `:171`→`:319`) so cooldown WOULD persist if enforced — currently moot. REPORTED, no fix.

## 7. DORMANT UI + KaterinHUD

- `display:none` grep (`src/**/*.{tsx,ts,css}`): only scrollbar styling — `index.css:463` (budget-sliders), `:660` (conversation-choices), `:684` (global `*::-webkit-scrollbar`) — no dormant content blocks hidden this way.
- DORMANT-1 stamp animation | `src/components/ui/BillSignAnimation.tsx:1-31` (`stampSlam/stampSlamRejected` + SVG seal) | 0 usages (grep `<BillSignAnimation` = 0) | missing: any import/render caller (expected: legislation/vote result wiring) — component + keyframes orphaned
- DORMANT-2 ComicCutscene | `src/components/ComicCutscene.tsx:1-163` + render `GameLayout.tsx:567-573` (`cutscenePanels && <ComicCutscene>`) | 0 `triggerCutscene(` callers (def `weekStore.ts:284,1651` only) | missing: any trigger call site / asset panels — render path live, trigger dead
- DORMANT-3 discretionary-fund SVG | `RightSidebar.tsx:322-334` $-glyph SVG + label wired to `setInvestmentOpen(true)` → `InvestmentPanel.tsx:176` Chancellor's Discretionary Fund | NOT dormant functionally; art is temporary placeholder glyph (`M12 2v20M17 5H9.5...` generic currency path) — missing: final art asset
- DORMANT-4 reshuffle cooldown guard | `canReshuffle` (`cabinetStore.ts:20,99-103`) | 0 callers | missing: UI gate call (see §6)
- KaterinHUD verdict: UNMOUNTED (returns null), not CSS-hidden, during scenes. Mount gate `GameLayout.tsx:489-492` (all phases except title/customization/prologue/epilogue) + inner gate `KaterinHUD.tsx:80-83` (`phase==='agenda'||'scene'||newsOpen||isMobile → return null` with zIndex-250 comment `:81`); tests lock behavior (`__tests__/KaterinHUD.test.tsx:25-42` null on news/agenda/scene; `:44-51` re-render on close); TopBar notes same pattern (`TopBar.tsx:86`).
