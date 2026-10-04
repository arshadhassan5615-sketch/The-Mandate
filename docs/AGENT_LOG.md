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
