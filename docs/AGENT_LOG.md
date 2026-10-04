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
