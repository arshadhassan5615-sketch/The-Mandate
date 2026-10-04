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
