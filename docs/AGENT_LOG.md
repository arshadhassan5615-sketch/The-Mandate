# Agent Log — Depth Pass (`agent/depth-pass`)

Running log of every batch: what changed, why, which files, which commit, and gate results.
Gates per batch: `npx tsc -b` · `node audit-full-game.mjs` (0 broken, no new orphans, no new flag
gaps vs. previous run) · `node check-unguarded-agenda-entries.mjs` (0) · `JSON.parse` on every touched file.

Baseline (`7c8057d`): broken 0 · orphans 67 · flag gaps 13 · dead-end choices 165 · missing resolution beats 52 · unguarded 0.

---

## HALTED — questions for Arshad

These items are deliberately **not** done. Each changes engine semantics that affect existing
saves or ending flow, so per the rails they need your decision.

### H-1 · Bug A + Bug C — map-week pool rebuild and week completion (`weekStore.ts`, `MapInteractionLayer.tsx`)
> **RESOLVED** — Fix A `9ba5522`, Fix C `16c9cc0` (see the fixes entry below). Kept for history.
- **A:** `advanceQueue` rebuilds the pool from `buildPool()` alone (`weekStore.ts:1490`), so every
  `initWeek`-injected item disappears after the first scene of the week (runtime-verified at wk22).
- **C:** `allVisited` checks `visitedSceneIds.includes(item.sceneId)`, but `__budget__`, `__constitution__`, `__radio__`, `__vote__` and
  `__cabinet_reshuffle__` are never marked visited. Petitions, press and rally share one sceneId each, so
  they become "visited" forever after their first play.
- **Why both together:** fixing A alone makes `__radio__` persist, and a week could then never end.
- **Proposed fix (not applied):**
  1. Add `completedItemIds: string[]` (per week, reset in `initWeek`) to the week store. On queue
     exhaustion in the `returnToMap` branch, push every completed `item.id`.
  2. `allVisited` / `MapPins` treat an item as done if `completedItemIds.includes(item.id) || visitedSceneIds.includes(item.sceneId)`,
     and exclude `__radio__` from the "must complete" set.
  3. In the `returnToMap` branch, rebuild the pool as `buildPool(...)` plus the previous pool's items whose ids are
     not ALL_AGENDA ids (the injected ones).
  4. Persist `completedItemIds` in `SaveRecord` (save format change → your call; or derive it on load as `[]`).
- **Mitigation applied in this pass (data only):** B-5 mirrors the fixed-week one-offs into agenda
  JSON, so they survive A. C is untouched.

### H-2 · Bug B — delayed chain scenes never reach the map (`weekStore.ts`)
> **RESOLVED** — Fix B `b0a00e1`, timing follow-ups `abd313b` and `fa3c120`. Runtime-verified 2026-10-24: a project's contractor and mid-crisis scenes reach the map on schedule. Kept for history.
- `completeWeek` → `chainStore.process()` → `forcedChainIds`, which only the unused `agenda` phase consumes.
  Runtime-verified. **163 scenes** depend solely on delayed chainTriggers. Code-scheduled payoffs
  (mole accusation, contractors, project mid-crises, impeachment, no-confidence wrapper, Tyvaren
  mobilisation, deficit, assassination variants, letter replies) are dead too.
- **Proposed fix (not applied):** in `initWeek`, synthesise agenda items from `forcedChainIds` (the same
  code as `confirmAgenda`'s `rawChainItems`, including the confidence-vote and impeachment augmentation).
  Dedupe by sceneId and skip visited ones.
- **Why halted:**
  - It switches on ~190 scenes that no player has seen, many scheduled without their own week windows.
  - Saves already hold `scheduledChains` that would start firing.
  - `MorningBriefing` schedules `family_dinner_recurring` and `intelligence_briefing_recurring` **every
    morning** (duplicates accumulate), so it needs a dedupe first.
  - It will move stats and ending inputs for every playthrough.
- **Recommendation:** turn it on behind a dev flag, play Acts 1–2, then decide.

### H-3 · Canon — "Arcturian Commonwealth"
- 330 occurrences in 88 files write the Arcturian Commonwealth as a *second* superpower beside the
  Orythian Dominion (ambassador Harrison Cole, the Stellamere visit, the trade arc). The canon note says
  "never Arcturian". Renaming to "Orythian" would merge two powers and break the superpower choice at wk21.
- **Question:** is "Arcturian" meant to become a different name (e.g. "Lytheiran"), or should the two powers be merged?
  New content in this pass names only the Orythian Dominion.

### H-4 · Canon — "General Vass"
- `general_vass` is a defence-minister candidate in `ministers.ts`, in the portrait index and in
  `act1_week2_cabinet_formation_meeting.json` (3 lines). It is wired to the cabinet-formation UI, so it is left as is.
- **Question:** rename the candidate, or remove him from the pool?

### H-5 · Teaser carry-forward entries (~70)
- Agenda entries like `agenda_w28_tyvaren_intelligence → act3_week32_tyvaren_ultimatum` make "week 32"
  scenes play at week 28, because the map forces every pool item. Restructuring would re-pace Act III.
- **Question:** keep the early pull, or retime these entries to their scene weeks?

---

## Batches

_(entries appended below as work lands)_

### Batch 0 — `009e29a` docs: analysis + plan + log
- `docs/GAME_ANALYSIS.md`, `docs/IMPROVEMENT_PLAN.md`, `docs/AGENT_LOG.md`.

### Batch 1 — `5405800` fix(data): week56/57 crash + week27 referendum aftermath (B-1, B-3)
- Files: `agenda/week27.json`, `agenda/week56.json`, `agenda/week57.json`, `act5_week56_constitutional_court.json`, `act5_week57_fainting_spell.json`.
- Why: `{flag,value}` conditions without `type` crashed `initWeek` at week 56 (runtime-verified). The week-27 aftermath gated on flags nobody sets, so every player got "Referendum Lost".
- Gates: tsc ✓ · broken 0 · orphans 67 (=) · flag gaps 13→11 (resolved `referendum_decisive`, `referendum_narrow`) · unguarded 0.
- Runtime: `devJumpToWeek(56/57)` now builds a pool (previously threw).
- Player: Term 2 survives week 56. Winning the referendum now opens the victory or narrow-certification morning, not a defeat cabinet.

### Batch 2 — `31af0e0` + `07dee53` fix(narrative): honour choice gating (B-2)
- Files: wk31, wk50, wk53, wk65, wk72 (commit 1/2); wk78, wk80, wk92, wk100 (commit 2/2).
- Why: the engine ignores choice-level `prerequisites`, so every hidden route showed. Renamed to `conditions`. Added all-false fallbacks to wk31 (new `seg_strike_outlasted`) and wk72 (new `seg_remnant_plot`, two choices differing in kind). wk53 clean-win is now exclusive; wk65 `<=50` → `<50`.
- Gates: tsc ✓ · broken 0 · orphans 67 (=) · flag gaps 11 (=) · unguarded 0 · missing beats 52 (=).
- Runtime (store-driven): wk78 marriage 60 → only `path_united`; 20 → only `path_divorce`. wk53 none → `path_clean_win`; captured → `path_oligarch_puppet`. wk72 none → `path_remnant_plot`. wk100 none → `path_kolvar_generic`; oil → `path_kolvar_oil`.
- Player: history decides the route. Jonas leaves or stays because of the marriage, not a menu click.
- New flags to be read later: `remnant_plot_buried`, `deep_state_public_arrests` (planned reader: wk103).

### Batch 3 — `3244c62` fix(scheduling): mirror initWeek one-offs into agenda JSON (B-5)
- Files: 19 `agenda/weekNN.json` files (24 entries: mole w2/3/5, Hawk w13/16/22/28/35, pipeline w14–16, oil arc w18–22, informant w19, protest w22, Voss w24/28/32, Morvec w32, border ultimatum w40, loyal force w44, inaugural ball w1).
- Why: bug A drops `initWeek` items after the first scene of a week. Agenda JSON entries survive the rebuild.
- Gates: tsc ✓ · broken 0 · orphans 67 · flag gaps 11 · unguarded 0.
- Runtime: week 22, after an unrelated scene, Voss connection, protest/riot and oil outcome are still in the pool (they vanished before). Radio still drops, which is intended under bug C.
- Player: the Hawk, Voss, oil and Morvec arcs are playable regardless of which pin is clicked first.

### Batch 4 — `c2ffbd3` + `a0df853` fix(narrative): coup_attempted flag (B-4); canonical oskar_brenner ID (B-6)
- `act3_week37_coup_attempt.json`: `coup_attempted` added to all four outcomes (additive). Flag gaps 11→10.
- 21 scenes: speaker / `characters` `general_brenner` → `oskar_brenner` (portrait + colour). **Not changed:** `src/data/epilogues.json:119` still uses `general_brenner` (ending display; left for you).
- Player: the climax "internal consolidation" option appears after a coup, and Brenner has a face in Acts II–IV.

### Batch 5 — `ee28288` feat(narrative): weeks 56, 57, 58, 62
- New: `act5_week56_halvek_bench` (fallback when the constitution is not in force), `act5_week57_arrest_sheet`, `act5_week58_cabinet_table`, `act5_week62_the_interview`. Agenda: `week56/57.json` appended; `week58.json`, `week62.json` created.
- Echo reads: commissioner (wk7), 3:47 (wk27), coup (wk37), Tomas Term-1 arcs, steel trust (55), court (56), injury (57), orphanage (54), puppet path (53), referendum.
- Gates: tsc ✓ · broken 0 · orphans 67 (=) · flag gaps 10 (=) · unguarded 0 · dead-ends 165 (=) · missing beats 52 (=).
- Runtime walker: every path of the 4 scenes completes under 3 flag profiles; 0 errors.
- Player: weeks 58 and 62 are no longer empty. Tomas gets his first Term 2 scene. Nadia gets a set piece that quotes the player's own record back at them.

### Batch 6 — `37be744` feat(narrative): weeks 70, 74, 83
- New: `act6_week70_the_colonels`, `act6_week74_last_audience` (second scene that week), `act6_week83_coal_ledger` (fallback for non-oil players). Agenda: `week70.json` created; `week74/83.json` appended.
- Gates: same as batch 5, all green. Runtime walker: all paths complete; wk83 choice gating verified by branch.
- Player: Brenner's toast has a consequence. Stefan Morvec dies and Aleksei inherits (payoff at wk101). `lytheiran_ties_severed` finally costs something.

### Batch 7 — `34b9d25` feat(narrative): rewrite wk94 + wk97 (R-1, R-2)
- IDs, choice ids, flags and stateChanges preserved. Vyktor is now present for his own reckoning. Kolvar's outcomes keep him on the ballot, consistent with wk100 and the polling-only `ElectionEngine`.
- Gates green. Runtime walker: all paths complete.

### Batch 8 — `f8c95dc` feat(narrative): Term 2 endgame, weeks 98, 99, 101, 102, 103
- New: `act7_week98_last_cabinet`, `act7_week99_kitchen_table`, `act7_week101_the_heir`, `act7_week102_kravenstal`, `act7_week103_election_eve`. Agenda: `week98/99/101/102/103.json` created.
- `act7_week100_final_debate` extended only (11 lines): Kolvar quotes the wk62 interview and the wk83 coal outcome. Vyktor's opening line is gated on `vyktor_exposed == false`, with an alternative node. The debate structure is unchanged.
- wk103 sets no flags (week 104 never plays). wk103 touches no polling or election fields.
- Gates green. Runtime walker: all paths complete under two rich profiles.

### Batch 9 — `bf63e81` feat(narrative): consequence echoes in 8 Term 2 scenes
- Nodes only (+31 lines): wk53, wk65, wk69, wk80, wk89, wk91, wk93, wk95.

### Batch 10 — `ea09377`, `00a9071`, `7c57d35` feat(narrative): thin endings (R-3)
- 52 one-node "(Continue)" closing segments in 17 Term 2 scenes now carry a second beat (a named person, a number, a cost) and a closing line stating what was paid. Choice flags, stateChanges and nextSegment are verified unchanged by script.
- Audit "missing resolution beats" 52 → 30 → 12 → **0**.

### Batch 11 — `3620c82` feat(narrative): Act IV weeks 45, 48, 51
- New: `act4_week45_the_poster`, `act4_week48_the_roll`, `act4_week51_two_speeches`, gated on `coup_succeeded == false` (wk51 also `war_defeat == false`). Echoes read by wk53, wk98 and wk102.
- **Defect found and fixed during this batch:** my node-insertion helper put the three wk102 poster nodes *inside* a node's `conditions` array. The JSON was valid, but it would have crashed `evaluateCondition` at runtime. Caught by the whole-game condition-shape scan, repaired, and the helper fixed. The scan (`Malformed conditions: 0`) is now a permanent gate in `gates.sh`.

### Batch 12 — `a831d4d` feat(narrative): wk63 procurement segments (R-4); wk65 echo timing aligned

### Batch 13 — `51800dd` feat(narrative): complete echo coverage for the curated decision list
- Every option of the 24 curated major decisions (analysis §c) is now read by at least one later scene.

---

## Final status of the pass

**Gates on `51800dd`:** `tsc -b` ✓ · `vite build` ✓ (into a scratch dir; `dist/` untouched) · broken links 0 · orphans 67 (no new; same set as baseline) · flag gaps 13 → **10** · missing resolution beats 52 → **0** · dead-end choices 165 (=) · unguarded agenda entries 0 · malformed conditions 4 → **0**.

**Runtime sweep:** `devJumpToWeek(2..103)` builds every pool without throwing, and every week opens at least one scene even for a player with no flags set. Before the pass, weeks 56–58 threw and 58/62/70/98/99/101–103 were empty.

**Totals:** 15 new scenes (wk45, 48, 51, 56, 57, 58, 62, 70, 74, 83, 98, 99, 101, 102, 103). 3 scenes rewritten in place (wk63, wk94, wk97). 17 scenes with strengthened endings (52 segments). 9 scenes with routing repaired, 2 of them with new fallback branches. ~20 existing scenes with conditional echo nodes. 24 agenda mirror entries. 103 data files, +5,488 / −293 lines.

**Measurable targets:**
- Every week 2–103 has ≥1 scene beyond budget: ✓ for all branches except the exile branch's weeks 45/48/51 (see weak spots). Week 104 is unplayable by engine design (the election fires on reaching it).
- Every curated major decision gets ≥1 echo: ✓ 24/24, all options.
- Zero new bare "(Continue)" endings: ✓. The only "(Continue)" buttons added are hidden routing choices, which show exactly one option per player. Existing thin endings went 52 → 0.
- Wiring checklist on every new scene: ✓ (`wiring.mjs` plus runtime walker on every path).

**Remaining weak spots (not done):**
1. **Engine bugs A/B/C (H-1, H-2)** still dominate the live experience: the week can't auto-end with a budget item, petitions/press/rallies play once, and 163 chain-only scenes never play. The content added here deliberately avoids depending on them.
2. **Exile branch, weeks 45/48/51.** The wk44 counter-coup has four divergent outcomes and no resolution scenes, while the wk52 ending can still read "Brenner rules Veltria". Writing those weeks needs a design decision on how the exile branch resolves. **Question for Arshad.**
3. **Term 1 echoes.** 1,098 weighty Term 1 flags are still unread. This pass focused Term 2 echoes on the Term 1 *outcomes* (coup, climax, referendum, 3:47, commissioner, Morvec, Tomas arcs). Most of the rest were meant to echo through delayed chain scenes (bug B).
4. **Branch inconsistencies that predate this pass, now more visible:** Theron appears after being fired (wk73 → wk89); Brenner is "General" at wk72/96 after a public dismissal at wk69; `src/data/epilogues.json` still uses `general_brenner`.
5. Teaser carry-forward entries (H-5) and the Arcturian naming (H-3) are untouched pending your decision.

---

## Round 2 - engine fixes behind the sim harness

### STEP 0 - `70da0e3` refactor(map): extract week-completion rules (green-tree restore)
- `src/engine/weekCompletion.ts`: shared `isAgendaItemDone` / `isWeekComplete`, now used by
  `MapView.tsx` and `MapInteractionLayer.tsx`. Behavior-preserving.
- Gates: `tsc -b` clean; vitest 159 pass / 6 pre-existing fail (DecreeInbox, TopBar).

### STEP 1 - sim harness + Fix A/B/C contract (this commit)
- `src/test/simHarness.ts` drives the real Zustand week flow without React: `resetWorld`, `bootWeek`,
  `playItem` (launchSingleScene -> complete -> advanceQueue -> 500ms pool rebuild), `playAllExcept`,
  `finishWeek` (completeWeek + 1500ms chain tick), `saveAndReload`, tolerant `completedItemIds` read.
- `src/test/weekFlow.sim.test.ts`: contract assertions (a)-(f).
- `weekCompletion.ts` gained `MAX_FORCED_CHAINS_PER_WEEK = 3` (the flood-cap contract) and an
  optional third `completedItemIds` parameter on both predicates (default `[]`, no behavior change
  for existing callers).

**STEP 1 baseline (before Fixes A/C/B) - 3 pass / 6 fail:**

| # | Assertion | Baseline | Detail |
|---|-----------|----------|--------|
| (a) | initWeek-injected items survive the mid-week pool rebuild | FAIL | `citizen_petitions_8` and `__radio_address__` dropped after the first scene (Bug A) |
| (b) | fired chain scene is offered in the next week's pool | FAIL | `act1_chain_deficit_crisis` fires but never reaches the pool (Bug B) |
| (b2) | already-visited chain scene is not re-offered | pass | guard |
| (c) | week with `__budget__` / `__constitution__` can end (`__radio__` optional) | FAIL | `weekComplete()` false - virtual items never marked done (Bug C) |
| (c2) | empty pool may end the week | FAIL | `isWeekComplete([])` is false (Bug C) |
| (d) | mid-week save + reload still offers injected items | pass | Fix A risk guard |
| (e) | overdue chains capped per week (<=3), overflow carried, none dropped | FAIL (cap) / pass (conservation) | 8 overdue chains fired in one tick - the Fix B flood risk is real; conservation held |
| (f) | chain-forced scene appears exactly once although confirmAgenda also handles forced chains | FAIL | queue held 2 items for one scene (chain item + player selection) |
| (f2) | forced scene queued exactly once when nothing else selected | pass | guard |

Full suite unchanged: 162 pass / 12 fail = 159 pre-existing pass + 3 new pass, 6 pre-existing fail
(DecreeInbox, TopBar) + 6 new contract fail. Gates: `tsc -b` clean.

### STEP 2 - Fixes A, C, B (one commit each)
- `9ba5522` **Fix A** - initWeek-injected items survive the mid-week pool rebuild. `completedItemIds`
  week-scoped ledger (recorded at queue exhaustion, cleared at the real week boundary), the
  return-to-map rebuild carries non-catalog pool items, optional `completedItemIds` on SaveRecord
  (defaults [] when absent). Harness 3/6 -> **4/5**: (a) FAIL -> PASS.
- `16c9cc0` **Fix C** - week completion honours completed items. `__radio__` never blocks the week;
  empty required set means the week may end; recurring entries (petitions / press / rally) are
  week-scoped so each occurrence replays; MapInteractionLayer + MapView pass the ledger. Harness
  4/5 -> **6/3**: (c)(c2) FAIL -> PASS.
- `b0a00e1` **Fix B** - chain scenes reach the map, once, under a weekly cap. initWeek synthesises
  primary chain items into the pool (deduped, visited skipped); confirmAgenda routes both paths
  through shared `buildChainItems` and dedupes the merged queue by sceneId; `resolveChains` gains
  `maxFires` (chainStore passes MAX_FORCED_CHAINS_PER_WEEK=3 - overflow carries, never dropped);
  schedule() dedupes (targetNodeId, fireWeek). Harness 6/3 -> **9/0**.
- Full suite after STEP 2: 168 pass / 6 fail (only the pre-existing DecreeInbox/TopBar).

### STEP 3 - `e8997ee` 4 scripted playthroughs behind MANDATE_PLAYTHROUGHS=1
- `src/test/playthroughs.sim.test.ts`: weeks 1-103 walked under 4 flag profiles (untouched /
  reformist / hardliner / exile). Per week: the week opens with something to do, every offered item
  launches, the week ends and advances, chain fires stay under the cap. Run end: finishing wk103
  raises the term limit -> epilogue (week 104 observed, never authored).
- Sweep: **4/4 profiles green**, 0 unlaunchable items, 0 empty weeks, 0 chain floods across 412
  week-walks; ~19s (fake timers + pluggable harness waiter). Skipped in the default suite.

### STEP 4 - `e808332` safe data fixes (weak spot #4 + the batch-4 leftover)
- `epilogues.json`: `general_brenner` -> `oskar_brenner`, "General Mattis Brenner" -> "General
  Oskar Brenner" (Mattis appears nowhere else in data).
- Theron-after-firing (wk73 `theron_fired` / `theron_medical_leave`): all 4 Theron spots in wk89
  gated with Kaspar / Justice-Ministry fallbacks; the same bug found in wk98 (5 nodes gated with
  Danika fallbacks; "Theron's Records Act" choice text -> "The Records Act").
- Brenner "General" after the wk69 public dismissal (`brenner_fired_publicly`): wk72 Krel briefing +
  monologue and wk96 Vyktor line now carry fired-variants.
- Residual: static scene-level `characters` arrays still list Theron/Brenner (cosmetic portrait
  stack; scene-level fields cannot be conditional).

### STEP 5 - `1e7e333` exile-branch design doc (design first, no content)
- `docs/exile-branch-design.md`. Verified: all four wk44 counter-coup outcomes chain to
  `act4_week48_war_outcome` (the Tyvaren WAR resolution) and their flags are read by no scene;
  wk52 `ending_military_coup` routes on `coup_succeeded` alone, so even the Brenner deal that
  dissolves the junta ends in a junta ending.
- Proposes: every path restores the Republic at different costs; wk45/48/51 scenes (agenda-JSON
  scheduled); wk52 routing on `coup_resolution_begun` + new `ending_restored_republic`;
  readers-only flag model. **Awaiting Arshad's sign-off** (4 open questions in the doc).

### STEP 6 - `38b1bd8` teaser retiming, only where early play spoils (H-5)
- Protocol: retime only when the scene is FALSE at the earlier week (authored-week stamps in
  location/prose) or a 3+ week pull collapses the arc. 7 retimes of 29 carry-forwards
  (w15 refugee 15->19, w18 superpower 18->21, w28/w29 ultimatum ->32, w30/w32 dravenhollow ->34,
  w39 reform 39->41). 20 delta-1 previews and 2 benign delta-2 pulls kept.
- Fresh scan: teasers 29 -> 22, delta>=3 = 0.

### Round 2 holds (report-only, untouched)
- **H-3 Arcturian naming:** unchanged (330 occurrences). The wk44 intervention choice and the wk52
  economic ending say "Arcturian"; left verbatim in STEP 4/5. Still needs the naming decision.
- **H-4 General Vass:** unchanged (minister candidate + cabinet-formation UI). Needs the call:
  rename or remove.
- **Week 104:** unplayable by engine design (the second election fires on reaching it). The STEP 3
  sweep observes it: finishing wk103 lands at 104 -> term limit -> epilogue. No content placed.

### Notes
- `npm run lint` is broken tooling-side (ESLint 10 `scopeManager.addGlobals is not a function`,
  pre-existing, fails identically without these changes). Gates run: `tsc -b`, vitest, audit-full-game
  (broken 0 / orphans 67 / flag gaps 10 / dead-ends 165 / missing beats 0 / malformed conditions 0),
  check-unguarded (0).

---

## Round 3 — STEP 1 data fixes

### 1a. Trigger bounds 3-20 (`src/stores/weekStore.ts`)
- `shouldTriggerTyvarenMobilization(hostility, week)` and `shouldTriggerDeficitCrisis(economy, week)`
  now require `week in 3..20` (checked against `newWeek`, the week the scene would play).
- Justification: both targets are Act-1 scenes. Below 3 the government is still forming (inauguration +
  cabinet; the first budget is week 3). Above 20 the scenes are false: the deficit scene's 340M debt
  figure IS the opening debt position (INITIAL_STATE 340), and the wk20 Stellamere summit + oil arc +
  wk20 budget crisis supersede both early crises; the standoff's "second week" freshness cannot survive
  the wk32 ultimatum arc. Unbounded, a late hostility spike (up to +20 at wk88) would summon Act-1
  content into Term 2 — the 0e mechanism.

### 1b. Narrow-referendum upper bound
- Scene `act2_week26_referendum_narrow` prerequisites += `factions.reformists <= 61`. Without it,
  reformists>=62 AND halvekists<=40 qualified for BOTH decisive and narrow, and the player picked the
  outcome presentation (both agenda entries offered).
- Agenda `agenda_w26_referendum_narrow` mirrored in AGENDA shape: passed + reformists 48..61 +
  halvekists<=55 (full scene-prereq mirror).
- Residual (not changed): the decisive agenda entry lacks the scene's halvekists<=40, and a passed
  vote with weak stats matches neither result entry — pre-existing gap, needs a fallback decision.

### 1c. Press conference rewrite + failed variant
- `act2_week27_press_conference.json` rewritten: same id/choices/flags/stateChanges/nextNodeId;
  opening Nadia question + internal thought now vary decisive/narrow via per-node conditions;
  monologue made path-neutral; the 4 choice texts de-numbered so each path keeps ONE consistent set:
  narrow 51.8/46.8/1.4 (matches the narrow scene, its agenda entry and the aftermath text),
  decisive 60.7/39.3 (canonical from the decisive scene). A neutral third opening covers the
  passed-but-result-unplayed case.
- New `act2_week27_press_conference_failed.json` (short, terminal choices, 46.3/48.9/4.8 figures
  from the rejected scene).
- Agenda week27.json: `agenda_w27_press_conference` (gate `referendum_passed`) +
  `agenda_w27_press_conference_failed` (gate `referendum_failed`).
- The 4 rejected-path chains re-pointed to the failed variant (decisive/narrow chains untouched).
- Residual: `press_followup` ("forty-eight percent") and `press_outcome` ("narrow referendum
  victory") stay narrow-locked for decisive players — same treatment needed, out of mandate scope.

### 1d. Divorce/healing mutual exclusion + Term 2 Jonas consistency
- All 4 `act4_jonas_divorce` choices += `jonas_divorce` flag. This single addition wires the
  ALREADY-AUTHORED Term-2 divorce branches: wk99's 11 `jonas_divorce` nodes and wk100's true/false
  variants were dead content (only wk78's suitcase set the flag before).
- Agenda gates (absence shape only exists at agenda level): w49/w50 divorce entries require
  `family_healing_path == false`; w49/w50/w51/w52 healing entries require `marriage_ended == false`.
- Term 2 Jonas audit — contradicts a divorce, fixed with per-node conditions + fallbacks: wk53
  (5 nodes: front-row + personal echo + 3 address dialogues, Vyktor fallbacks), wk59 (tea +
  monologue variants, reassign monologue variant, lamb line + end choice gated with solo fallback),
  wk61 (card-device variants for setup + dinner + festival, solo end choices), wk78 (united/divorce
  paths gated on `jonas_divorce == false`; new `path_already_ended` + `seg_already_ended` so divorced
  players get exactly one path — no 0a freeze).
- Compatible, untouched: wk93 (neutral phone call), wk99 (already fully divorce-branched), wk100
  (already reads the flag), wk103 Jonas call (gated on the wk99 Thursday promise, kept in both
  branches — a kept promise reads coherently divorced or not).

### 1e. Theron at wk103
- `act7_week103_election_eve` "Theron's order…" node (gated on `debate_wednesday_gates`) now also
  requires NOT `theron_fired` / `theron_medical_leave`, with an unattributed fallback order.

### Gates
- `tsc -b` clean. Vitest 168 pass / 6 pre-existing fail / 4 skipped (unchanged).
- audit-full-game: broken 0 / orphans 67 (=) / flag gaps 10 (=) / missing beats 0 / malformed
  conditions 0 (checked on all touched files). Dead-ends 165 -> **169 (+4)**: the 4 new
  flag-free terminal closes (`reassign_end_solo`, `dinner_end_solo`, `festival_end_solo`,
  `already_end`), each mirroring a pre-existing flag-free sibling 1:1 — accepted, not masked
  with no-op flags.
- check-unguarded-agenda-entries: 0. JSON.parse clean on all 16 touched/new data files.

---

## Round 3 — STEP 0 verification (verify-only, no product edits)

- (0a) Soft-locks: choice-less entered segments FREEZE — proven by mounting the real
  `NarrativeScene` in jsdom and walking `act3_week52_the_kitchen` (5 zero-choice terminal
  segments), `act3_week38_two_letters` (4 zero-choice terminals) and `act2_week22_oil_outcome`
  with no oil flags (both sub-choices gated out): all end `{sceneDone:false, stillOnScene:true,
  continueShown:false}`. Mechanism: `seg.choices ?? []` + Continue requires `sceneDone` +
  Space gated on `!allDone` + auto-advance/emergency only on `sceneDone`/`!currentScene`.
  Side findings: `ConversationPanel:612` needs a ResizeObserver stub in jsdom; `act4_week52_ending`
  has the same flaw (all 10 ending choices conditional — a middle run matching none freezes).
- (0b) Divorce (`jonas_left`+`marriage_ended`, −30 health) vs healing (`family_chosen`+
  `family_healing_path`, +8..+18) both offered weeks 49–50 ungated; `marriage_ended` read only by
  wk43-resolution, `family_healing_path`/`jonas_left` read by nothing, and no Term-2 scene reads
  either flag. Base health 65 ⇒ divorce+healing (53) routes wk78 "united" while divorced.
  Term-2 Jonas map: wk53/59/61 married-assuming; wk78 branches on the number only; wk93 neutral
  call; wk99 fully `jonas_divorce`-branched (dead until the flag is set); wk100 reads the flag;
  wk103 call promise-gated (compatible). wk103 line 41 has Theron issuing orders with no
  theron_fired gating.
- (0c) Chain probability is unseeded `Math.random()` at fire time; nothing in the harness seeds
  or stubs it (only the engine unit tests do). 52/779 triggers carry probability, 41 carry
  conditions — any walk touching those is non-reproducible. "Dropped" = removed from `scheduled`
  without firing (conditions/probability fail), so fired + remaining + dropped = scheduled.
- (0d) Both week-52 scenes play post-vote by mechanics (election fires entering week 52; a loss
  skips week 52 for the epilogue) and assume post-vote/post-term in text — no timing change
  needed (week-52 hold stays report-only). Residuals: the ending's loss-hedge is unreachable, its
  all-conditional choices are a freeze risk (see 0a), and the_kitchen says "five years ago" for
  the ~14-week-old week-38 letters.
- (0e) `act1_chain_tyvaren_border_standoff` has exactly one scheduler (completeWeek at hostility
  ≥ 70 from a base of 0, unbounded weeks) and no agenda entry. Never reaching 70 ⇒ never
  scheduled ⇒ never fired ("pending at 103"); a late trigger hits an Act-1 scene in Term 2; and
  the 103→104 completeWeek returns early (term limit) before scheduling AND the chain tick, so
  anything left in `scheduled` at game end strands forever. Directly motivates the STEP-1 3–20
  bound and STEP-2b/2c.

## Round 3 — STEP 2 engine fixes (one commit each, assertions in 1f1d304)

- `1f1d304` harness: (2a)(2b)(2b2)(2c)(2c2)(2d)(2d3) red baselines recorded (7 failed / 10 passed;
  eve opening shows 36 echoes under a full history); (2d2) ungrouped guard green. Plus a
  behavior-neutral one-word `filterNarrative` export.
- `45bac7d` **(2a)** exclusive redirects record BOTH ids: loadScene marks the requested id visited
  at redirect time; the played variant records on completion as before. Sim 7/10 -> 6/11.
- `abd313b` **(2b)** chains due before the target scene's weekAvailable defer (stay scheduled,
  never dropped; unknown targets fire on schedule); overdue chains still play with a DEV late-fire
  log. Sim 6/11 -> 4/13.
- `fa3c120` **(2c)** on-time chains uncapped, overdue backlog max 2/week (replaces the Round-2
  total-3 cap; `MAX_FORCED_CHAINS_PER_WEEK` superseded by `MAX_OVERDUE_CHAINS_PER_WEEK = 2`).
  (e) updated to the new contract (8 overdue drain 2+2+2+2, conservation holds); the playthrough
  sweep counts overdue fires precisely via pre-tick backlog snapshot. Sim 4/13 -> 2/15.
- `e8791bc` **(2d)** `filterNarrative` echoGroup (+ maxPerGroup, default 1); ungrouped nodes
  byte-identical behavior. election_eve's 38 conditional opening nodes tagged into 5 groups
  (debate/kolvar/people/plot/records) → max 5 echoes. Sim 2/15 -> **0/17**. Full suite 176 pass /
  6 fail (only the pre-existing DecreeInbox/TopBar).
- Gates each commit: `tsc -b` clean; JSON.parse clean; no save-schema change (no SaveRecord,
  mandateDb, or persisted-shape edits in Round 3).

## Round 3 — STEPS 3-6 (this session)

### STEP 3 — `74b2e47` docs/REACHABILITY.md (no data fixes)
- Tooling found uncommitted at root (analyzer + report suite + report config + fresh
  `run-*.json` telemetry); verified coherent before use: regenerated manifest identical
  (539 scenes / 207 visited / 332 never-fired), directed keys match the manifest set exactly.
- Brief's "92" is stale: measured never-fired set vs the clean/exile/god union is **332**
  (agenda 30 / agenda+chain 37 / chain-only 174 / nextNode-only 4 / no-source 87).
  Directed proofs: **203 proved / 129 blocked** (agenda 61 / chain 138 / nextNode 4 proved).
- `no-source-path` (87) is two unproven-by-policy populations, not blocked content:
  engine-sourced 44 (weekStore/narrativeStore/Letter/Assassination/FamilyDinner/Briefing/
  Budget/EmergencyDecree/Whisper engines — policy has no engine-trigger seeding) and
  UI-sourced 43 (SocialEvent/TermReportScreen/CabinetFormation/ConnectionsPanel paths).
- Seeded-proof caveat: 5 PROVED scenes depend on never-set flags and are unreachable in
  real play (narrow via `referendum_passed`, petravar/stellamere via `chose_*`,
  executive_governance/nadia_investigation via unset flags); narrow's 3 downstream chains
  cascade to `source-not-loadable`. Other blockers: chain-not-scheduled 8,
  dropped-in-queue 7, played-but-unvisited 6 (`__project__*`), source-choice-unavailable 10,
  source-not-loadable 10, probability-miss 1 (`act3_third_attack`).
- Trivial flag-name check: edit-distance scan of the 10 never-set flags vs all 2998 set
  flags finds no distance-1/2 typo (min 3) — all semantic mismatches. **Zero data fixes.**
- Dead-gate findings listed, not fixed: STEP-1 agenda gates on `referendum_passed`
  (narrow result + pass-path press conference) unsatisfiable; weekStore no-confidence
  wrapper items gated on `no_confidence_passed/failed` while the vote sets
  `defeated/weathered`; mole correctness never recorded.

### STEP 4 — `d1936f8` permanent stat-path gate in audit-full-game.mjs
- Every `stat` in conditions (scene/choice/chainTrigger/agenda prerequisites) checked against
  conditionEvaluator PATH_ALIASES + STAT_RANGES; every stateChanges/statEffects `stat`
  against gameStore PATH_ALIASES + STAT_RANGES. Tables parsed from source at runtime —
  the audit cannot drift from the engine.
- Result: **0 unresolvable** of 225 distinct paths (174 condition + 75 modifier, some shared).
  Session-written scenes clean — nothing to fix, nothing to list.
- Drift found and listed (not fixed — engine semantics): gameStore's modifier table has 5
  aliases missing from the condition table (`reformist_support`, `education_index`,
  `military_readiness`, `public_order`, `oligarch_relations`). Conditions using them fail
  at runtime today; no scene does. Gate reports drift count permanently.
- Audit totals after: broken 0 / orphans 67 (=) / flag gaps 10 (=) / dead-ends 169 (=) /
  missing beats 0 / unresolvable 0 / drifted 5.

### STEP 5 — `65b8780` tic audit (top-25 4-6-grams over 539 scenes / 2647 text nodes)
- Corpus top: "the question is whether" 69x/66 scenes; "i want to be clear" 15x;
  "i want you to know/understand" 10x each; "the republic of veltria" 11x.
- Session files nearly clean (press-conference rewrite + all Term-2 edits: 0 hits).
  Rewrote 3 hits in 2 session-touched scenes only: narrow's doubled "I want to say" in one
  node (second use rephrased), rejected's "Republic of Veltria" appositive (dropped) and
  "I want you to know" (rephrased). Canon traits kept; no habit named.
- Gates: `tsc -b` clean; JSON.parse clean; full suite 176 pass / 6 pre-existing fail (=).

### STEP 6 — `f26e326` report tooling into scripts/
- `playthroughs.report.test.ts`, `analyze-runs.mjs`, `vitest.report.config.ts` moved to
  `scripts/`; imports fixed (`../src/`), root-relative config paths kept (`./src/...`,
  `./scripts/playthroughs.report.test.ts`); REACHABILITY.md repro commands updated.
- Verified: analyzer from new home prints identical counts; report config loads (4 skipped
  without MANDATE_REPORT=1); `tsc -b` clean. `run-*.json` stay untracked, uncommitted.

### Round 3 holds (still untouched)
- Arcturian naming, General Vass, week-52 timing, exile content, week 104. No save-schema
  change in any Round 3 commit. Pre-existing tree modifications (opencode.json,
  package*.json, GameLayout.tsx, unguarded report) and untracked telemetry left alone.

---

## Round 4 — SPINE INTEGRITY (content freeze: no new scenes)

### STEP 1 — `4722cc2` dead gates: set-or-repoint, mechanisms verified first
- Pre-fix verification overturned the Round-3 note: `referendum_passed` IS set (week-26
  vote successFlags), as are `no_confidence_passed/failed` + `impeachment_vote_failed`
  (their voteConfigs), `mole_correct/wrongly_accused` (narrativeStore merges
  `handleMoleAccusation` consequence flags into activeFlags, line 596),
  `deficit_critical`/`tyvaren_mobilization` (weekStore addFlags),
  `amber_coast_ftz_signed` (BillEngine signFlags). No fix needed for these.
- Genuine fixes (4 scenes, set-or-repoint only): week-21 choices now set
  `chose_arcturian`/`chose_orythian`; `executive_governance` prereq repointed to
  `executive_authority_invoked` (set by the scheduling choice);
  `nadia_investigation` repointed to `nadia_rebuffed` (ditto);
  `tyvaren_defiant_rejection` now sets `tyvaren_war_imminent` (public defiance that
  already chains to war preparations; secret-mobilization path excluded — deception,
  not imminence).
- Audit taught the mechanisms (same file, no behavior change): addFlags literals,
  mole consequence merge, bill signFlags as set-sources. Flag gaps **10 → 0**.
  analyze-runs.mjs engine-set list extended the same way. REACHABILITY.md dead-gate
  and seeded-proof sections corrected.
- Verify-first answers: week-26/27 aftermath + press conference fire on pass
  (decisive AND narrow, proved by spine tests below); e15334f mole routing works
  (correct xor wrong payoff, exactly once, proved below).

### STEP 2 — `b3edbf7` spine test (`src/test/spine.test.ts`, 12/12 green, ~11s)
- Default suite, fake timers, no env gate. Helpers mirror the UI exactly
  (LobbyingInterface zero-spend vote resolution; confirmAgenda queue drain with the
  real advanceQueue prereq-skip). Covers: referendum decisive/narrow/fail (aftermath
  + press variant xor), no-confidence fallen/survived xor through confirmAgenda,
  assassination single-track (sniper/bombing/calm), mole correct/wrong xor,
  coup climax present/absent, Jonas divorce-xor-healing + wk53 filter consistency,
  second-address 3 variants, election boundaries 52-win/loss and 103 term limit.
- Full suite after: 188 pass (176 + 12) / 6 pre-existing fail (DecreeInbox, TopBar).
  No change reverted (nothing turned red).

### STEP 3 — classification + `20a1aa8` + `7d1c77a` (1 class-A fix, halt list)
- 5 seeded: RESOLVED by STEP 1. 6 `__project__*`: proof artifact (harness playItem
  never marks `__` scenes; registry + load verified, real flow records via choice).
- Live re-verification (scratch, since deleted) overturned 3 stale 10:12 verdicts:
  brenner→ashenmere injection, mole-identify→confrontation injection, and
  ultimatum international_appeal availability all work.
- Class B (12, legitimate xor, no fix): megaproject/sovarka/voss/bni deep-segment ends.
- Class C (27, sound mechanisms, no fix): 7 stat-gated chain drops, third_attack
  probability, cascade chains (face_to_face, public_moment, 4 kickbacks),
  10 redirect-chasing sources (need source qualifying state).
- Class A FIXED: `refused_tyvaren_negotiation` set on defiant rejection; spine test
  extended (defiant → poisoning only, 12/12 still green). BALANCE NOTE: defying at
  30–36 now guarantees the poisoning track — revert if unintended.
- HALTED: `ssd_assassination` (Condition C; no player-ordered-assassination content
  exists — inventing a setter would fabricate an outcome) · `act3_assassination_default`
  (no trigger yields a null variant) · B/C populations and engine/UI policy gaps
  (need trigger-seeding / component-path proofs, future work).

### STEP 4 — drifted aliases + live readers (report only, no engine change)
- `education_index` → nation.educationStandard: no live readers.
- `military_readiness` → nation.militaryReadiness: no live readers.
- `oligarch_relations` → factions.businessClass: no live readers.
- `public_order` → nation.publicOrder: no live readers.
- `reformist_support` → factions.reformists: 2 live MODIFIER readers
  (security_posture_choice + security_posture_choice_perov, minimal_choice) — resolve
  today via the gameStore table; a future CONDITION reader would fail silently.
- The 4 readerless entries are dead table weight; the permanent audit gate reports
  the drift (5) every run.

### Round 4 holds (untouched, as mandated + tic-rewrite hold)
- Arcturian naming, General Vass, week-52 timing, exile content, week 104, rewrites of
  legacy scenes for tics. No save-schema change in any Round 4 commit. run-*.json
  uncommitted. Final gates: tsc clean; audit 0/67/0/169/0/0/5; suite 188/6-preexisting.

---

## Round 5 — MERGE PREP (content freeze: no new scenes)

### STEP 1 — Round-3 STEPS 0–2 evidence, delivered with Round-4 corrections
- Soft-locks (0a): FREEZE — kitchen (5 zero-choice terminals), two-letters (4),
  oil_outcome with no oil flags all end `{sceneDone:false, stillOnScene:true,
  continueShown:false}` via real NarrativeScene in jsdom. Same flaw in
  act4_week52_ending (all 10 ending choices conditional). Untouched since — stands.
- Jonas trace (0b) + Term-2 changes (STEP 1d): divorce vs healing both ungated at
  49–50; wk53/59/61 married-assuming, wk78 number-only, wk93 neutral, wk99 dead
  divorce branches, wk100 reads flag, wk103 promise-gated. Changed: wk53 (5 nodes +
  Vyktor fallbacks), wk59 (tea/monologue variants + solo end), wk61 (card-device
  variants + solo ends), wk78 (united/divorce gates + already-ended path), divorce
  choices set `jonas_divorce`, agenda mutual-exclusion gates. Spine-proven xor in
  Round 4.
- Probability (0c): unseeded `Math.random()` at fire time, 52/779 triggers with
  probability — walks touching those are non-reproducible; "dropped" = left
  `scheduled` without firing. Spine avoids it (zero-spend votes are deterministic;
  third_attack asserted only via absence-proof, not firing).
- Week-52 scenes (0d): both post-vote by mechanics and in text — no timing change.
- Border standoff at 103 (0e): one scheduler (hostility≥70, now weeks 3–20 bounded),
  no agenda entry; 103→104 returns before scheduling/tick so leftovers strand.
  Still accurate post-Round-4.
- Harness before/after (2a/2b/2c): red baselines 7 failed/10 passed →
  45bac7d (2a) 6/11 → abd313b (2b) 4/13 → fa3c120 (2c) 2/15 → e8791bc (2d) 0/17.

### STEP 2 — engine-change spine tests (`b629813`, default suite)
- (a) exclusive both-ids: weekFlow (2a); "original cannot reload / releases when
  qualified" added to spine.test.ts (narrow↔decisive both directions).
- (b) deferral: (2b) early-defers + (2b2) late-plays-and-logs. In suite, green.
- (c) overdue cap: (2c2) ≤2/tick none dropped + (2c) on-time uncapped. Green.
- (d) old autosave without flood: weekFlow (e) loads a fireWeek-2 autosave at
  week 20 and drains 8 overdue 2+2+2+2 with conservation. Green.
- Spine 13/13 at commit time (14/14 after STEP-3 matrix addition).

### STEP 3 — assassination matrix (`6614e25`, 14/14; no scene or flag changes)
Variant scenes are single unconditional choices into the cabinet scene:
sniper→wounded, no injury · bombing→died + injury · poisoning→attempt, no injury ·
default→injury (unreachable: no trigger yields a null variant).
The Shot (week 30, ungated agenda): all 3 roots set injury+survived+attempted,
which arms the once-only guard and blocks every variant track afterward.

| Path (30–36) | Track fires | Shot also fires | injury final | assassination_* finals | fainting@57 | tremor nodes | wednesday_honest@100 |
|---|---|---|---|---|---|---|---|
| A: play Shot@30 | none (guard) | YES (played) | TRUE | survived+attempted+ashenmere; no serida_* | YES | all 9 visible | offered |
| B: skip, sniper stats | sniper only | NO (skipped) | FALSE | +wounded, met_serida | NO | all hidden | absent |
| C: skip, bombing stats | bombing only | NO | TRUE | +died, met_serida | YES | all visible | offered |
| D: skip, defiant@32 | poisoning only | NO | FALSE | +poisoning_attempt, met_serida | NO | all hidden | absent |
| E: skip, calm | none | NO | FALSE | none | NO | all hidden | absent |
| Retaliation (ssd flag) | cannot occur — no decider (halted) | — | — | — | — | — | — |

Tremor nodes (9 found; brief said 8): wk48 roll, wk53 notes, wk56 pen, wk69
right-hand, wk74 signature, wk78 ringing, wk85 wire, wk90 pocket, wk100 podium —
all gated on `permanent_injury_sustained`, all spine-asserted present-iff-injured.

### STEP 4 — `5a3a9e6` docs/MERGE_CHECKLIST.md
Tag-merge-revert commands, gate expectations (tsc clean; 190 pass / 6
pre-existing fail; audit 0/67/0/169/0/0/5; unguarded 0), and a 12-week
hand-playtest route (1, 8, 13, 21, 22, 26, 27, 30, 32, 39, 42–43, 52–53)
with per-week correct-play observations.

### Round 5 holds
Same six plus tic rewrites, `ssd_assassination` + `assassination_default`,
poisoning-on-defiance balance. Final gates: tsc clean; suite 190/6-preexisting;
audit 0/67/0/169/0/0/5. Nothing reverted (no assertion turned red).

---

## Round 6 — FREEZE FIXES (content freeze: no new scenes committed)

### STEP 0 — report-only answers (nothing edited)
- a) Visible choice list: `processChoice` swaps segment choices RAW into
  `currentScene.choices` (narrativeStore); the FINAL list is computed by the pure
  `getAvailableChoices` at the NarrativeScene render call site — that call is the
  lowest layer that sees it. The store never filters; ConversationPanel receives
  the list as props (generic render + onChoice flow, no assumptions).
- b) Week-52-ending flaw: `act4_week52_ending` ("The Mandate") has no segments and
  10 root choices, EVERY one conditional (constitution+stats, iron+moral, war_*,
  coup, IMA+economy, khaled+workers, order+halvekists, tomas+family). A middle run
  matching none gets an empty list with no Continue possible — freeze.
- c) Engine today: empty array and all-filtered both yield [] from
  getAvailableChoices; panel renders no choices, sceneDone stays false (it sets
  only via a processed terminal choice), no Continue, Space/Enter gated on
  dialogue flow, auto-advance only on sceneDone — both freeze identically.

### STEP 1 — `e36a2b9` synthetic terminal Continue (panel untouched)
- `ensureTerminalChoice` (NarrativeEngine, new; getAvailableChoices unchanged so
  all existing callers/tests see identical behavior) applied exactly at the
  NarrativeScene call site; `processChoice` early branch completes it like a
  terminal (visited + sceneDone + segment cleared, no flags/changes/news/codex/
  scheduling). Covers empty arrays, missing fields, and all-gated-off lists.
- ConversationPanel NOT touched (verified generic: find-by-id + onChoice phases).

### STEP 2 — `3f3a13c` audit gate + `c9e3e88` triage (WARN count 22)
- FAIL empty choice lists: 27 (kitchen 5 + two-letters 4 + 3 social roots +
  dinner 8 + briefing 7). WARN no-unconditional: 22 (incl. week52 ending root).
- Triage: NO data fixes. Session scenes' WARNs are exhaustive-by-design routers
  (wk53 quad-cover, wk78 + wk59 + wk61 divorce pairs verified); legacy units are
  correct routers or terminal beats. Data choices would author content under
  freeze to duplicate the fallback. All 49 listed in REACHABILITY.md.

### STEP 3 — `1983d23` freeze tests (6/6, seeded RNG)
- kitchen (5 terminals), two-letters (4), oil_outcome with no oil flags, week52
  ending middle run: Continue appears alone, completes (visited + sceneDone),
  queue advances to map; ending sets no fabricated flags. `Math.random` stubbed
  to 0.5 with restore (probability ticks reproduce).
- STEP 4 in same commit: election_eve with maximal flags (every flag the scene
  reads + maxed stats) opens with ≤5 grouped echo nodes (groups represented).

### STEP 5 — PARTIAL HALT (freeze + no-duplication)
- Kitchen Table (wk99), The Heir (wk101), Foundry Street (wk102) already exist as
  complete authored scenes (14n/3c + kitchen99_* flags; 10n/4c + heir101_* flags;
  Kravenstal foundry scene + kravenstal102_* flags). Authoring competing versions
  would duplicate canon — NOT pasted, NOT committed.
- Validated + pasted in the session report only: `act7_week103_last_audience`
  (no endgame counterpart; week-74 audience is a different scene): JSON.parse
  clean, ids unique, weeks ≠104, all stat paths resolve via the audit tables,
  choices non-empty with unconditional options, zero top-25 tics, no Arcturian
  naming, no assassination/injury flags, all 7 new flags writer+reader wired
  within the four-scene set. Needs agenda entries + tests before any merge.

### Round 6 holds
Same as Round 5 plus assassination/injury flags (untouched — matrix scenes and
flag sets unchanged). Final gates: tsc clean; suite 196/6-preexisting; audit
0/67/0/169/0/0/5 + FAIL 27 + WARN 22 (known legacy, fallback-covered).

---

## Round 7 — VERIFY + MERGE DRY-RUN (content freeze: no new scenes)

### STEP 0 — corrections and pastes (read-only; TEMP last_audience never in tree)
- a) `act7_week103_last_audience` exists ONLY in TEMP (authored Round 6, uncommitted
  by design). `git ls-files` shows no match — it is not in the tree, was not
  committed, and stays out. Nothing to remove.
- b) "The Last Audience" exists as `act6_week74_last_audience` (Morvec deathbed,
  weeks 74–76 — the earlier "70–83" range was wrong; correction recorded here).
- c) Raw JSON of the four existing scenes pasted in the session report verbatim
  (kitchen 426 lines / heir 223 / foundry 377 / audience-74 207).

### STEP 1 — `db204fd` baseline the freeze gate (green)
- `audit-baseline.json` (new, committed): the 27 known FAILs. Gate FAILs only on
  navigable segments not in the baseline; missing/unreadable baseline fails loud.
  Audit after: FAIL 0 / WARN 22, all other totals unchanged.

### STEP 2 — `ad7aebe` recurring scenes (injection verdict + proofs)
- Engines inject narrative SEGMENTS only (display-splice into NarrativeScene;
  FamilyDinner `injectedSegments.slice(0,3)`); SocialEvent runs `socialInteractions`
  with its own leave flow and never reads `currentScene.choices`. Verified: no
  nextSegment targets any dinner/briefing empty seg (only the _choices hubs), and
  the 3 social roots carry 2/3/6 interactions.
- Pre-fix freeze answers: dinner/briefing hubs have real choices (never froze on
  the real path); social roots never entered the choice path (no freeze there);
  all 18 WOULD freeze if rendered via NarrativeScene without the fallback.
- 18 of 27 static FAILs reclassified false positives; audit excludes both
  populations dynamically (they fall back into the gate if the data changes
  shape). 9 true FAILs (kitchen/two-letters) stay baselined. Spine: dinner +
  briefing hubs complete with real choices and no fallback; social roots complete
  via the interaction flow and offer Continue as defense in depth (freeze 9/9).

### STEP 3 — week-52 typical win (constitution + reformists 65, clean background)
- Player sees: the 2 unconditional narrative nodes + exactly 1 choice
  (`ending_democratic_triumph`, full text pasted in session report).
- Readers of the 10 ending flags: LegacyEngine + endingCalculator read ONLY
  `ending_assassination` (Survivor gate / coup-assassination branch; outcomes
  otherwise stat-derived); journal templates journal 6 of them (triumph, autocrat,
  war victory/defeat, family, economic); EpilogueScreen, TermReportScreen,
  weekStore, narrativeStore read NONE. war_stalemate / military_coup /
  revolutionary have no readers at all (write-only record flags).
- None set: Survivor stays eligible, calculator runs on stats, no journal ending
  entry, epilogue shows stat-derived outcomes — nothing requires them, nothing
  crashes.

### STEP 4 — merge dry run (throwaway, aborted, deleted)
- `dryrun-tmp` from local main + `merge --no-ff --no-commit agent/depth-pass`:
  "Automatic merge went well", ZERO conflicts (no UU/AA/DD entries).
- Branch does NOT touch GameLayout.tsx, opencode.json, or package*.json (empty
  diff main...branch on those paths) — the worktree modifications there are
  local-only and merge-safe. Tree restored intact afterward.

### STEP 5 — Round-6 file list (7 files; flags/prose correction)
- src/engine/NarrativeEngine.ts (ensureTerminalChoice + id), src/stores/
  narrativeStore.ts (synthetic completion branch), src/components/
  NarrativeScene.tsx (apply at final-list site) — STEP 1 engine.
- audit-full-game.mjs (FAIL/WARN gate), src/test/freeze.test.ts (new, 6 tests),
  docs/REACHABILITY.md (triage), docs/AGENT_LOG.md (log).
- CORRECTION: Round 6 made ZERO flags/prose/data edits (the round-6 report
  boilerplate suggesting otherwise was wrong) — no scene JSON was touched.

### Round 7 holds + gates
All standing holds kept. Final gates: tsc clean; suite 199/6-preexisting
(196 + 3 recurring/social proofs); audit 0/67/0/169/0/0/5 + FAIL 0 + WARN 22.

---

## Reply audit Phase B1 — verify first, then only the clear fixes

Branch `agent/reply-fixes` from `agent/reply-audit`. No main commits. No new
scenes. ConversationPanel.tsx untouched (verified generic choice flow).

### STEP 0 answers (report-only; independent derivations, not copied)
- a) nextNodeId swap = raw `getScene()` assigned as currentScene (no filter,
  no normalisation, no prereq/exclusive check). 6 nextNode targets + 15 delay-0
  targets enumerated independently: ZERO contain per-node conditions or
  echoGroup nodes — including this session (Phase A added tooling + docs only).
  E7's "0 affected" confirmed, echoGroup included.
- b) Untraceable shown texts: dinner military_presence / union_praise /
  journalist_arrest + briefing morivask_instability / routine_quiet (2 nodes) —
  full texts recovered from source segments. Mechanism: NarrativeScene re-appends
  injected segments after every choice (id check only), and the history reset on
  activeSegmentId change re-displays them (E4).
- c) Router table verified with setter analysis: REAL overlaps — tyvaren
  diplomatic×{intercept,forward,bilateral} (wk22 + wk7 cross-scene), strike
  maric(wk3)×{morvec,threat}(wk30), sovarka deferred×signed/limited (defer feeds
  survey), captured(wk35)×{destroyed,refused}(wk50), debate exposed/pact/oil/
  divorce (independent lines). THEORETICAL-only (same-scene exclusive setters):
  oil signed×failed, black_gold funded×limited×rejected. Holes: oil telegram
  (skipped negotiation), sovarka outcome (survey skipped), megaproject followup
  (UNREACHABLE — all 4 ends set chosen flags; no change).
- d) Choices rebuild each render because getAvailableChoices returns a fresh
  .filter array; the ConversationPanel reset effect deps on that identity and
  clears reactions in the same commit (E1). Keeping reactions for non-terminal
  choices wants the reset keyed on a stable signature (scene+segment+choice ids)
  or a memoized list — report only (reactions display is held).
- e) 9a27631 "route social events through NarrativeScene + rewrite inaugural
  ball": GameLayout −2 lines (SocialEvent import + social_event routing branch);
  inaugural ball rewritten (613-line diff) as branching scene; first briefing
  moved week1→week2 agenda. SocialEvent.tsx NOT deleted — unmounted (imported
  nowhere), which is why its scenes' choices never play (E3).
- f) Exactly 3 delay-0 chains declare probability (face_to_face 0.3, ashenmere
  via negotiate_units 0.4 / protect_infrastructure 0.3) — all ignored per R10;
  NO delay-0 chain declares conditions.

### STEP 1 — `d55a53a` engine + `3b8efa8` data+test (separate commits)
- nextNode swap now filters through filterNarrative (copy-on-write). DIVERGENCE
  FOUND mid-step and documented: segments filter on PRE-choice flags (R8), but
  nextNode targets must filter on newFlags — the target is ABOUT the choice just
  made and can only gate on its flags. Behavior-neutral for all 6 existing
  targets (no conditional nodes); full suite stayed 199/6 proving the no-op.
- press_outcome: committee node gated on press_followup_specific + deflect /
  combative variant nodes (spine: specific→committee only, deflect→dodge only,
  combative→damage-control only, 15/15 green).

### STEP 2 — `7ab058f` router holes + ambiguous list (exclusivity untouched)
- Added all-false-guarded terminal fallbacks ONLY where holes are real: oil
  telegram (skipped negotiation) + sovarka outcome (survey skipped). Megaproject
  hole unreachable (verified all 4 ends set chosen flags) — documented, no change.
  S5-12/13 (mole/ending) left to the engine fallback (inventing endings is out).
- The 8 overlapping routers show NO exclusive intent in text (identical/bare
  Continues; strike/second_address/debate branches report independent true
  histories). Forcing exclusivity would suppress valid content. ALL 8 listed as
  ambiguous, ZERO touched. Real-vs-theoretical overlap recorded per router.
- Spine: fallbacks appear exactly in hole states and hide when a branch matches;
  oil hole test updated (data fallback correctly supersedes engine Continue).

### STEP 3 — HALT (0b is not data-only)
- The re-feed is engine behavior (NarrativeScene id-only check + history reset);
  the segments must display on arrival, so no data edit can fix timing without
  breaking arrival. Correct fix is E4's engine gating (inject only while
  activeSegmentId is null) — outside the data-only scope. Impact bounded:
  re-reading correct text, never wrong content. Nothing changed.

### Holds + gates
All holds kept (reactions display, social interactions, 38 shared-target pairs,
delay-0 semantics, Arcturian, Vass, week-52 timing, exile, 104, assassin/injury).
Final: tsc clean; suite 201/6-preexisting; audit 0/67/0/169/0/0/5 + FAIL 0 +
WARN 22 (+2 terminal fallbacks now counted in dead-ends: 171).

---

## Reply audit — Phase A (`agent/reply-audit`, child of `agent/depth-pass`)

Read-only: no scene, engine or save-schema change. Tooling in `scripts/reply-audit*`; reports in
`docs/REPLY_AUDIT/` (summary.md, findings.md, transcript-act1..7.md + parts, data/*.json).
Phase B is NOT started and waits on review of findings.md.

### Engine rules verified by reading code (full list R1–R11 in summary.md)
- nextNodeId beats nextSegment; a nextNodeId target is used raw (no filterNarrative, no `dialogue`
  normalisation, no prerequisites/exclusive). Segment nodes are filtered with PRE-choice flags/stats.
- Reactions: only the clicked choice's; rendered only while !sceneDone; cleared by the `[choices]`
  reset effect because NarrativeScene rebuilds the array every render.
- `SocialEvent.tsx` is imported nowhere (removed in 9a27631): `socialInteractions` never play.
  **Correction:** Round 7 STEP 2's "SocialEvent runs socialInteractions" is wrong. The 3 social_event
  roots reach the player only as opening nodes + engine "Continue…".
- delayWeeks 0 chains inject immediately, ignoring trigger conditions and probability.

### Counts
- S1 2707 rows (2676 mounted + 31 social): act1 832 · act2 638 · act3 619 · act4 211 · act5 100 · act6 184 · act7 123.
- S2 38 pairs (19 opposite-sign) · S3 2 · S4 5/813 · S5 13 routers (8 co-true, 3 holes) + 9 gated lists, 0 bad shapes ·
  S6 748/813 reactions on terminal choices, 11 unrenderable types, 5 social scenes · S7 1 · S8 16 (0 false) · S9 26 (8 noted).
- D1: 5173 clicks (empty/maximal + forced reruns for 8 exclusive-redirected scenes); 2650/2676 choices exercised;
  3 untraceable (dinner/briefing injection re-fed after a choice), 0 suppressed, 0 threw/blocked.
- D2 (Playwright, local install): 33 scenes / 102 clicks; 93 match; all 9 mismatches are reactions
  (3 flash 0–3 ms via MutationObserver, 6 empty rows of unrenderable types); 0 other display-only mismatches.
- findings.md: 86 rows (high 24 · medium 19 · low 43), engine-wide E1–E8 first.

### Notes
- One D2 attempt crashed when the dev page reloaded while vitest ran alongside it. D2 now re-boots and
  retries a click once, and the published run was clean (no retries).
- Gates: `tsc -b` clean · audit-full-game broken 0 / orphans 67 / flag gaps 0 / FAIL 0 / WARN 22 ·
  unguarded 0 · vitest 199 pass / 6 pre-existing fail (DecreeInbox, TopBar) · eslint on new tooling clean.

---

## Reply audit Phase B2 — re-feed fix (no ConversationPanel edit, no new scenes)

Branch `agent/reply-fixes-2` from `agent/reply-fixes`.

### STEP 0 answers (independent derivations)
- a) R8 rationale as documented: arriving segments filter with the snapshot that
  authorized the choice (no half-applied transition state); authors gate arriving
  nodes on EARLIER choices. Tested by S7 (285 nodes, 0 on entering choice's flag)
  + D1 (0 suppressed); no unit test pins the timing. B1 added the documented
  nextNode divergence (newFlags) in code + log.
- b) 1138 entry edges scanned: exactly 3 nodes gate on entering-choice flags —
  the 3 press_outcome variants (B1) via nextNode, which SHOW under newFlags
  timing. Zero segment-path, zero delay-0, zero echoGroup cases. Timing:
  segments PRE-choice; nextNode newFlags POST-choice (pre-modifier state);
  delay-0 loads at advance time with then-current flags.
- c) Router table verified (gates + target first-2 nodes + setter scene/week +
  current view each): tyvaren (wk7×4 + wk22 diplomatic; identical labels,
  distinct report segments) · oil (wk20 exclusive; labeled) · strike (wk3/wk30;
  distinct aftermaths) · sovarka (wk29→wk33 feeds survey; labeled) ·
  second_address (captured wk35/wk50 + destroyed/refused wk50; bare) ·
  deep_state (+remnant fallback; bare) · black_gold (+no-data fallback; bare) ·
  debate (+generic fallback; bare) — debate marked ACCEPTED DESIGN (5
  independent lines co-occur by construction).
- d) press_outcome variant nodes pasted in session report verbatim.
- e) Re-feed: NarrativeScene useMemo re-appended injected narrative on scene-id
  match + history reset re-displayed all. Segments must display on arrival
  (they ARE the variable week-start content). Minimal gating: inject only while
  activeSegmentId is null.

### STEP 1 — `0ee1b72` (spine 4/4, full suite 205/6-preexisting)
- Rule extracted pure as `recurringOpeningNodes` (NarrativeEngine); component
  delegates (engine imports cleaned, tsc clean). No flag-timing change per hold.
- Tests: (i) dinner 2 topics once-then-gone, hub intact; (ii) briefing mole +
  Tyvaren topics likewise; (iii) hub narrative byte-identical to raw segment;
  (iv) helper output equals independent engine computation in order.

### Holds
Router edits, reactions display, social interactions, shared-target pairs,
delay-0 semantics, pre/post-choice flag rule, and every standing hold kept.

---

## Reply audit Phase B3 — VERIFY IN THE BROWSER + EXTRACT

Branch `agent/reply-fixes-2` (no new branch). No main commits. No scene or
engine edits (ConversationPanel.tsx untouched, verified). Only new files are
the STEP 1 script + reports, the STEP 2 test + authoring doc, and the STEP 3
review pack. Edit hook (ecc-universal plugin) left ON.

### STEP 1 — `2233d20` browser verification (sequential, never alongside vitest)
- D2 rerun on the existing 33-scene set: 33 scenes / 102 clicks / 9 not
  matching — the SAME 9 reaction-probe mismatches as Phase A (6 unrenderable
  reaction types with no text at all, 3 flash-only 3–6 ms). 93 match, 0 other
  display-only mismatches. The rerun diff vs the committed file is flash-timing
  noise only (3 ms → 6 ms lifetimes).
- New `scripts/reply-audit.d2-recurring.mjs`: each of the 8 dinner + 7 briefing
  topics taken in turn (isolating seed per topic), opening captured, hub
  continue clicked, post-click panel text diffed against D1. Asserts: the topic
  is shown at the opening; NO topic line and NO root opening line reappears
  after the click; the hub anchor is present ("The meal is ending" /
  "Vyktor waits"); D1-predicted re-fed injections are all absent post-click.
- Result: 15 topics, 0 mismatching (`docs/REPLY_AUDIT/data/d2-recurring-results.json`
  + `docs/REPLY_AUDIT/d2-recurring-report.md`). D1 diff confirms the B2 fix:
  D1 (pre-fix prediction) re-feeds injections; the browser omits every one.

### STEP 2 — `f2e7727` flag-timing pins (no behavior change: test + doc only)
- `src/test/spine.test.ts` +3 ("flag timing"): (i) segment transitions filter
  on PRE-choice flags — synthetic probe through the real processChoice (no
  authored scene gates a segment node on its entering choice's flag, S7: 0
  cases, so synthesis is test-only); the entering flag IS recorded yet its node
  stays hidden. (ii) nextNodeId on POST-choice flags — press_followup ×3 from
  identical pre-choice flags; pre-filter yields 0 variant nodes, each run shows
  exactly its own variant. (iii) delay-0 injects unconditionally (queued despite
  unmet prereq) and loads with THEN-current flags — flag added between inject
  and advance flips the load from the exclusive fallback to the target; full
  `diplomacy_hard_rejection` choice path included.
- New `docs/authoring-when-flags-apply.md`: the three moments + rule of thumb
  (segments look BACKWARD, nextNodeId may look AT the choice, chains look at
  LOAD time). Spine 18/18 at commit time.

### STEP 3 — `7740d90` docs/REPLY_AUDIT/review-pack.md (raw text, no summaries)
- (a) the 3 press_outcome variant nodes, verbatim JSON.
- (b) the 7 non-debate routers (B2 STEP 0c table keys): per branch the gate,
  the target's first-2 narrative nodes (verbatim), the setter scene + week of
  each gate flag (scene choices + agenda voteConfigs + code hits), and the
  branch choice text the player sees today. Static co-true pairs recorded raw
  per router (incl. realistic/blocker). Notes: strike is now 4 branches
  (`check_strike_outlasted` all-false fallback, Batch 2); tyvaren has
  `proceed_default`; oil/sovarka carry their B1 fallbacks.
- (c) the 19 opposite-signed shared-target pairs (checkS2 severity filter):
  scene + week, both choice texts verbatim, shared-target first-2 nodes
  verbatim, each choice's flags + stateChanges verbatim with +/- signs.
- (d) AGENT_LOG Round 7 STEPs 0/2/3/4/5 verbatim (winner view, 10 ending-flag
  readers + none-set behavior, dry-run + 7 touched files, recurring freeze
  results) + raw file-content JSON of Kitchen Table, Heir, Foundry Street
  (`act7_week102_kravenstal`, "Foundry Street") and Last Audience
  (`act6_week74_last_audience`).
- Generator was throwaway (`gen-review-pack.mjs` in temp, not committed). One
  generator bug found and fixed before commit (P() pushed arrays → comma-joined
  lines); regenerated and verified section-by-section.

### Holds + gates
Every standing hold kept (router edits, reactions display, social
interactions, shared-target pairs, delay-0 semantics, the flag rule itself,
Arcturian, Vass, week-52 timing, exile, 104, assassin/injury). Final gates:
`tsc -b` clean; audit-full-game exit 0 — broken 0 / orphans 67 (=) / flag gaps
0 / dead-ends 171 (=, incl. B1's 2 fallbacks) / FAIL 0 / WARN 22 / drift 5;
unguarded 0; full vitest 208 pass / 6 pre-existing fail (DecreeInbox ×2,
TopBar ×4, documented since Round 2 — untouched); 3 new flag-timing tests 3/3.
Root `audit-full-game-report.txt` / `unguarded-agenda-entries-report.txt`
rewrites left uncommitted (pre-existing local artifacts).
