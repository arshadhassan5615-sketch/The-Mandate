# The Mandate — Improvement Plan (Depth Pass, Phase 2)

Source: `docs/GAME_ANALYSIS.md`. Items are ordered by player impact. Every item lists target
files and weeks, what the player experiences, and what it depends on. Execution status lives in
`docs/AGENT_LOG.md`.

Ground rules applied to every item:

- **Reachability.** New scenes are scheduled through **agenda JSON entries**, which `buildPool` honours on every
  rebuild. They do not use `initWeek` injection (bug A) or delayed chainTriggers (bug B), because
  neither reaches the player today.
- **Gating.** Use agenda-entry prerequisites (`{stat:"flags.x",operator,value}` shape) with the scene's own
  `prerequisites` mirrored, plus choice-level `conditions`. Echoes are per-node `conditions` on
  `narrative[]` nodes, only in scenes entered through the agenda (never through `nextNodeId`).
- **Endings.** No bare "(Continue)" endings in new content. Every branch closes on a consequence beat with
  names, numbers and a cost, and the closing choice text says what was paid.
- **Characters and canon.** Use only character IDs present in `src/assets/potraits/index.ts`. Use ₭ and the Orythian Dominion.
  Brenner is `oskar_brenner`.

---

## P0 — Make the game reach its content (data-only bug fixes)

| ID | Target | Change | Player experience | Depends on |
|---|---|---|---|---|
| B-1 | `agenda/week56.json`, `agenda/week57.json`, `act5_week56_constitutional_court.json`, `act5_week57_fainting_spell.json` | `{flag,value}` → `{type:"flag",flag,value}` | Term 2 no longer crashes at week 56/57. | — |
| B-2 | 10 scenes listed in analysis §0-D | Choice `prerequisites` → `conditions` (valid shapes). Add a fallback branch to wk31 and wk72. Gate wk53 `path_clean_win` on neither oligarch outcome. Change wk65 `<= 50` to `< 50`. | Hidden routing works: the player sees the result their history earned (wk53 margin, wk78 marriage, wk100 Kolvar's attack), not a menu of "(Continue)" buttons. | — |
| B-3 | `agenda/week27.json` | Gate the decisive and narrow aftermaths on `referendum_won_decisive` / `referendum_won_narrow`. Gate the rejected aftermath on both being false. | Winning the referendum produces a victory morning, not a defeat cabinet. | — |
| B-4 | `act3_week37_coup_attempt.json` | Add `coup_attempted` to every coup-outcome choice (additive flag; nothing removed). | The climax's "internal consolidation first" option appears for players who lived through the coup. | — |
| B-5 | `agenda/week*.json` (new mirror entries) | Mirror the fixed-week `initWeek` one-offs into agenda JSON (same window, same order, same prerequisites). | Voss, Hawk, oil arc, Morvec confrontation, border ultimatum, two letters and loyal force survive the bug-A pool rebuild. A mitigation, not the engine fix. | — |
| B-6 | 21 scenes using `general_brenner` | Rename the speaker / `characters` ID to `oskar_brenner`. | Brenner's lines show his portrait and colour. | — |

## P1 — Fill the empty and conditional-only weeks with real moments

Each new scene is a set piece in the register of wk32 Morvec / wk56 Court / wk64 Penicillin. Each
has 2–4 choices that differ in kind, consequence segments with arithmetic, and echo nodes reading
earlier decisions.

| ID | Week | Scene (new) | What the player experiences | Echoes (reads) | Sets (for later payoff) |
|---|---|---|---|---|---|
| W-56 | 56 | `act5_week56_halvek_bench` (only if the constitution is **not** in force) | The old Halvek-era High Bench voids an emergency decree under the constitution you failed to replace. Theron says the same men will rule on everything for twenty years. | referendum result, coup outcome | `halvek_bench_*` |
| W-57 | 57 | `act5_week57_arrest_sheet` (all players) | 02:10 a.m. Tomas is in a Ashenmere police cell after a student march against *your* government. The desk sergeant is waiting to see what the Chancellor wants written down. | commissioner (wk7), Tomas arcs (Term 1), orphanage (54) | `tomas_arrest_*` |
| W-58 | 58 | `act5_week58_cabinet_table` | The first full cabinet of Term 2. ₭14M short, three ministers, one cut. Vostane, Marić, Theron and Dusek argue in the same room. | steel trust (55), court (56), orphanage (54), second-address path (53) | `cabinet58_*` |
| W-62 | 62 | `act5_week62_the_interview` | Nadia Voss, forty minutes, live. She has the 3:47 detention file, the court ruling and the summit. | 3:47 (27), court (56), injury (57), summit (60), commissioner (7) | `interview62_*` |
| W-70 | 70 | `act6_week70_the_colonels` | After the toast: forty-one colonels sign a letter of "professional concern". Dusek brings it herself. | toast (69), coup outcome (37), Act III climax (39) | `colonels70_*` |
| W-74 | 74 | `act6_week74_last_audience` (2nd scene) | Stefan Morvec is dying at Aldenmoor and summons you. Aleksei stands at the window. The old man wants one thing: his son's safety after he's gone. | Morvec confrontation (32), smuggler's offer (66), oligarch outcome (50/53) | `morvec_succession_*` |
| W-83 | 83 | `act6_week83_coal_ledger` (only if neither oil route) | No domestic oil. The Lytheiran coal contract is up. If ties were severed at the summit, there is no contract at all, and winter is eleven weeks out. | summit (60) | `coal83_*` |
| W-98 | 98 | `act7_week98_last_cabinet` | The last cabinet before the vote. Who is at the table depends on wk94/97. One minister resigns in protest; you decide what it costs them. | Vyktor (94), Kolvar (97), ghost payroll (86), rogue shadow (91), colonels (70) | `lastcab98_*` |
| W-99 | 99 | `act7_week99_kitchen_table` | Sunday. The family at the residence kitchen table, or the empty chairs. One request from each child. | Ashavel legacy (78), orphanage (54), Tomas arrest (57), stray dog (63) | `kitchen99_*` |
| W-101 | 101 | `act7_week101_the_heir` | Aleksei Morvec, now head of the house, offers what his father never could: open money and the Aldenmoor vote. The price is set by what you owed Stefan. | succession (74), smugglers (66), oil (80), Morvec (32) | `heir101_*` |
| W-102 | 102 | `act7_week102_kravenstal` | You go back to your father's foundry street, three days before the vote, without the press. | steel trust (55), factory explosion (77), mine collapse (3), campaign trail (90), police commissioner (7) | `kravenstal102_*` |
| W-103 | 103 | `act7_week103_election_eve` | The last night. Krel brings a way to make 38,000 Thornfeld ballots "irregular". Vyktor (or his empty chair) and Jonas (or his absence) are in the room. | Vyktor (94), Kolvar (97), deep state (72), BNI blackmail (87), rogue shadow (91), debate (100) | `eve103_*` |

Week 104 is not playable (the second election fires on reaching it); see the analysis. No content is placed there.

## P2 — Strengthen flat scenes (rewrite in place; IDs, flags and stateChanges kept)

| ID | Target | Change |
|---|---|---|
| R-1 | `act7_week94_vyktor_slush_fund` | Vyktor enters the scene. Each of the three choices opens a consequence segment where he answers in his own voice (terse, one word carrying three meanings) and closes on a cost. |
| R-2 | `act7_week97_foreign_asset` | Consequence segments for arrest, leak and blackmail, with Nadia, Krel and the numbers. |
| R-3 | 17 Term 2 scenes with one-node "(Continue)" endings | Each closing segment gets a second beat (a named person, a number, a cost), and the bare "(Continue)" button is replaced with a line that states what was paid. Flags and stateChanges are untouched. |
| R-4 | `act5_week63_military_procurement` | Consequence segments, so the four choices land differently (Dusek's reaction, Vukov's radar, the treasury line). |

## P3 — Consequence echoes in existing scenes (conditional narrative nodes)

| ID | Target scene | Reads | Echo |
|---|---|---|---|
| E-1 | wk53 second address | Act III climax, referendum, coup | One line in the square that recalls *how* Term 1 ended. |
| E-2 | wk66 smuggler's offer | wk32 Morvec flags | Stefan opens differently if you threatened him, defied him or paid him. |
| E-3 | wk69 general's toast | coup outcome | The room knows what Brenner did in week 37. |
| E-4 | wk89 diluted medicine | wk64 penicillin | If the state lab exists, the diluted vials carry its stamp. |
| E-5 | wk95 saint's sin | wk89 Renek's cousin | Renek knows what happened to his cousin. |
| E-6 | wk91 rogue shadow | wk66 raid, wk86 Krel arrests, wk72 deep state | Krel's men did this before, on your order. |
| E-7 | wk93 wiretapped chancellor | wk67 reporter | The tape you buried or turned. |
| E-8 | wk100 final debate (extend only) | court purge, Kolvar arrested, Vyktor | Lines added to existing segments; the structure is not changed. |
| E-9 | wk80 black gold | succession (74) | "Morvec" is now Aleksei. |
| E-10 | wk65 border incident | procurement (63) | The jets, the tanks or the concrete you bought. |

## P4 — Underused character arcs (setup → pressure → payoff)

- **Morvec succession:** wk32 (existing setup) → wk66 (existing, plus echo E-2) → **wk74 Last Audience** → wk80 (echo E-9) → **wk101 The Heir** (payoff).
- **Brenner and the army:** wk37 coup (existing) → wk69 toast (existing, plus echo E-3) → **wk70 The Colonels** (pressure) → **wk98 Last Cabinet** (Dusek's report) → **wk103 Election Eve** (the army's posture on the night).
- **Vyktor:** Term 1 (existing) → **wk58 Cabinet Table** (Vyktor runs the room) → **wk94 rewrite** (the reckoning, in person) → **wk98 / wk103** (his chair, filled or empty).
- **Nadia and the press:** wk57 fainting (existing) → **wk62 The Interview** → wk67 (existing) → wk100 debate (existing; she moderates).
- **Family:** wk54 Liora (existing) → **wk57 Tomas** → wk78 legacy (existing) → **wk99 Kitchen Table**.

## P5 — Term 1 gaps (if time permits after P0–P4)

- Act IV branch-only weeks 45, 48, 51: verify after B-5 that every flag profile gets ≥1 scene. Add
  campaign-office scenes if a profile is empty.

---

## Measurable targets and how each is verified

| Target | Verification |
|---|---|
| Every week 2–103 has ≥1 scene beyond the budget for every player | Pacing script re-run plus per-week check of unconditional or complementary-gated entries. Week 104 is unplayable by engine design. |
| Every curated major decision (analysis §c) gets ≥1 echo | Flag-read scan: each listed flag appears in ≥1 condition. |
| Zero new bare "(Continue)" endings | Audit "missing resolution beats" must not grow; target is a decrease. |
| Wiring checklist for every new scene | Audit: 0 broken, no new orphans, no new flag gaps. Unguarded check: 0. Every read flag has a setter. Every characterId is in the portrait index. |
