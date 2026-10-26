# Referendum vote projection: why every playthrough ties 125-125

## Verdict

The vote formula is state-dependent and works as written. It does not ignore faction state, and the referendum branch has no fixed split. The 125-125 result comes from the audit harness: `constitutionCommit()` in `src/test/simHarness.ts` always selects the first variant of every constitutional provision. Those reactions push the factions to the same vector in every profile, and that vector projects to exactly 125-125. The game's real UI lets the player choose variants, so the real vote would differ. The audit never exercises that path.

Classification: **harness artifact (not a game-engine bug)**, with a caveat that the first-variant reactions drive `reformists` from 68 to 0, which is worth a design check.

## 1. Formula (VoteEngine.ts, `calculateProjection`, lines 20-85)

There is no `voteType` branch in the engine. Referendum, no-confidence, and impeachment all use the same `calculateProjection(factions, threshold)`. The `voteType` only affects labels and the flags set afterwards.

- Reads: `factions[fs.faction]` for each of the 7 entries in `FACTION_SEATS` (`src/data/vote/factionSeats.ts`). `partyLoyalists` is in `FactionState` but has no seats, so it has no effect. Approval, public image, and flags are NOT read. The threshold is passed in; the referendum config uses 126 (`week25.json:27`, `week26.json:15`).
- Seats: reformists 80, halvekists 70, workersCoalition 35, ironCovenant 25, church 20, dravenni 10, businessClass 10 (total 250).
- Per faction, with `s = support`:
  - `s >= 60`: all seats YES (lines 35-38).
  - `s <= 30`: all seats NO (lines 39-42).
  - `31 <= s <= 59`: `t = (s-30)/30` (line 48); `rawYes = t * seats`; `yes = floor(rawYes)` (line 50); `undecided = min(round(frac(rawYes) * seats * 0.3), seats - yes)` (lines 51-54); `no = seats - yes - undecided` (line 55).
- Totals: sums across factions (lines 67-69). `willPass = yes >= threshold` (line 81). `margin = yes - threshold` (line 73).
- Ties: there is no tie-break. The threshold is strict: 125 YES vs threshold 126 fails by one seat (`margin -1`).
- `applySpending` (lines 92-144) with spend 0 returns the projection unchanged (lines 97-103). The harness uses spend 0 for the audit.

Step functions: support 68 and 80 give the same result (both `>= 60`). Outcomes change only at the 60 and 30 cliffs and across the 31-59 band.

## 2. Probes (run with vitest, then deleted)

Faction defaults from `src/stores/gameStore.ts:73-82`: halvekists 48, workersCoalition 58, reformists 68, ironCovenant 50, church 47, businessClass 44, dravenni 38.

| State | YES | NO | UND | Passed |
|---|---|---|---|---|
| A. Defaults (fresh) | 187 | 49 | 14 | true |
| B. Defaults with reformists 80 | 187 | 49 | 14 | true (identical to A: reformists already saturated at >=60) |
| C. halvekists 80, reformists 20 | 135 | 101 | 14 | true |
| D. reformists 20 only | 107 | 129 | 14 | false |
| E. reformists 50 only | 160 | 68 | 22 | true |
| F. all factions 90 | 250 | 0 | 0 | true |
| G. all factions 10 | 0 | 250 | 0 | false |
| H. all factions 50 | 163 | 51 | 36 | true |
| I. Defaults with partyLoyalists 0 | 187 | 49 | 14 | true (no effect, as expected) |
| J. Defaults + first-variant constitution reactions (per-step clamp, `gameStore.ts:218,298`) | **125** | **125** | **0** | **false** |

State J reproduces the audit exactly. Resulting factions: reformists 0, halvekists 100, workersCoalition 0, ironCovenant 100, church 76, businessClass 75, dravenni 0, partyLoyalists 50. The per-faction breakdown is: reformists N80; halvekists Y70; workersCoalition N35; ironCovenant Y25; church Y20; dravenni N10; businessClass Y10.

The default-state result (A) also matches the audit's week-13 no-confidence row (187-49-14), which confirms the probe mirrors the harness.

Conclusion from the probes: the output changes with state (A, C, D, E, F, G, H all differ). The 125-125 appears only when the faction vector is the one produced by the first-variant constitution reactions (J).

## 3. Where the constant comes from

- `src/test/simHarness.ts:324-335` (`constitutionCommit`): applies `variants[0]` reactions for every provision, "default provisions", regardless of what the player picked. Every audit profile therefore ends with the same faction vector, so every referendum projects to 125-125.
- `src/test/simHarness.ts:270` calls `calculateProjection` correctly with live `game.factions`.
- The real screen (`src/components/ConstitutionalReform.tsx:250-269`) applies the player's selected variants, so real play would produce a different vector.

## 4. Caveats

- The week 25 referendum row in the audit (`timing-report.json`, untouched profile) is also 125-125. In `src/data/agenda/week25.json`, the lobbying vote has `executionOrder` 0 and the constitution has `executionOrder` 1, so the constitution normally runs after the week-25 vote. I did not verify the walk's actual ordering, so I cannot confirm that the week-25 vote saw the post-constitution state. This needs a trace of `factions` at each `__vote__`.
- I did not run the full audit walk. The conclusion rests on reproducing the 125-125 from the harness's constitution reactions.

## 5. Concerns (out of scope)

- Parallel, unused-by-engine formulas exist: `src/data/constitution/provisions.ts:539` `calculateAssemblyVotes` and `:574` `calculateReferendumForecast`. `ConstitutionalReform.tsx:233-234` displays their output, and they use a different model than `VoteEngine.ts`. The on-screen forecast and the engine tally can disagree.
- First-variant constitution reactions set reformists to 0, which is extreme for a default. Confirm this is intended.

## 6. Recommended fix (not applied)

1. Audit harness only: in `src/test/simHarness.ts` `constitutionCommit`, select variants from the scenario's real choices (or a per-profile map) instead of `provision.variants[0]`. This makes the audit vary by profile as the work order expects.
2. Optional engine check: add a trace of `factions` at each `__vote__` in `timingAudit.ts` so the week 25 vs 26 ordering can be verified.
3. Optional design: decide whether a 60/30 step function should stay. A linear or smoothed mapping would make reformists 68 vs 80 distinguishable.

## Checks

- Probe files were created under `src/test/__scratch__/` and deleted. No other repo files were changed by this work.
