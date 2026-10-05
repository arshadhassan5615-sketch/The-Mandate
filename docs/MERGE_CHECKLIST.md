# Merge checklist — agent/depth-pass → main (Rounds 2–5)

## 0. Preconditions (do not merge until all hold)

- On `agent/depth-pass`, working tree holds ONLY the known pre-existing
  modifications (`opencode.json`, `package*.json`, `GameLayout.tsx`,
  `unguarded-agenda-entries-report.txt`). Nothing else modified or staged.
- `run-*.json`, `audit-*-report.txt`, `session-*.md` are untracked telemetry —
  never committed, never part of the merge.
- Holds still open (decisions needed post-merge or before — Arshad's call):
  Arcturian naming, General Vass, week-52 timing, exile content, week 104,
  legacy tic rewrites, `ssd_assassination` + `assassination_default` (halted),
  poisoning-on-defiance balance (Round 4 STEP 3 note).

## 1. Tag main, run all gates on the branch

```sh
git checkout main
git tag pre-depth-pass main
git checkout agent/depth-pass
npx tsc -b
npx vitest run
node audit-full-game.mjs
node check-unguarded-agenda-entries.mjs
```

Expected (Rounds 2–5 complete):

- `tsc -b`: clean.
- vitest: **190 passed / 6 failed**, all 6 pre-existing
  (`TopBar.test.tsx` 4, `DecreeInbox.test.tsx` 2 — broken tooling-side, fail
  identically without these changes). Includes 14 spine tests (~11s) and the
  week-flow contract (Fixes A/B/C + 2a–2d + guards).
- audit-full-game: broken **0** · orphans **67** (= baseline) · flag gaps **0**
  (was 10) · dead-ends **169** (=) · missing beats **0** · unresolvable stat
  paths **0** · drifted aliases **5** (reported, engine untouched).
- check-unguarded-agenda-entries: **0**.
- JSON.parse clean on every touched data file (covered by the audit run).

## 2. Merge (no fast-forward, branch kept for the record)

```sh
git checkout main
git merge --no-ff agent/depth-pass -m "merge: depth pass rounds 2-5 (spine integrity)"
npx tsc -b && npx vitest run
```

## 3. Revert (if the merge misbehaves)

- Merged but not pushed: `git reset --hard pre-depth-pass`
- Merged and pushed: `git revert -m 1 <merge-commit-sha>` (keeps history;
  the branch `agent/depth-pass` still holds the work for a re-attempt).

## 4. Hand-playtest route (12 weeks most affected by A/B/C + caps)

Play each week fully (every offered pin), watching the EXPECTED column.
Anything else is a merge regression — halt and compare against the branch.

| # | Week | Scene(s) | Exercises | Correct playthrough shows |
|---|------|----------|-----------|---------------------------|
| 1 | 1 | Inaugural ball | Fix A (initWeek one-off survives rebuild) | Ball pin present after playing another scene first |
| 2 | 8 | Citizen petitions, radio address | Fix A + Fix C (radio optional) | Petitions persist mid-week; week ends with radio unplayed |
| 3 | 13 | No-confidence debate | Week-13 debate (all-survive choices) | Motion defeated paths all resolve; no fall |
| 4 | 21 | Superpower choice → visit | STEP-1 chose_* flags | Visit agenda entry offered weeks 21–25 after choosing |
| 5 | 22 | Oil outcome (no oil flags), Voss connection, protest | Fix A retention + 0a freeze fix | All three still offered after first scene; oil outcome plays with both sub-choices gated out |
| 6 | 26 | Referendum vote → decisive/narrow/rejected | Vote flags + exclusive redirect + Fix C | Passing vote offers the stat-matching aftermath only; failing offers rejected |
| 7 | 27 | Press conference / failed variant | Chain leg (delay 1) + agenda gate | Pass path plays the full press conference once; fail path plays the short failed variant |
| 8 | 30 | The Shot | Once-only guard vs variants | Playing The Shot blocks all 30–36 variant tracks |
| 9 | 32 | Tyvaren ultimatum (defiant) | STEP-1/3 flags + poisoning track | Defiance sets war-imminent; week-33 pool carries war preparations; poisoning fires, nothing else |
| 10 | 39 | Act-3 climax | Coup gating | Coup-survival option present iff the coup was attempted |
| 11 | 42–43 | Mole confrontation → payoff | e15334f routing + Fix B window | Correct xor wrong payoff offered in-window, exactly once |
| 12 | 52–53 | Election → second address | Boundary + Term-1 variant | Win continues to 52 with term flag; loss goes to defeat epilogue; address variant matches Term-1 outcome |

Also spot-check: a chain-heavy week (e.g. force several chains, or play weeks
20–22 normally) never floods — overdue backlog drains at most 2/week, nothing
dropped, nothing doubled (cap + Fix B guards, covered by weekFlow (e)/(f)).
