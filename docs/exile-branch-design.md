# Exile Branch — Design Doc (weeks 44–52)

**Status: design for sign-off. No content is authored until this is approved.**
Source of the request: `docs/AGENT_LOG.md` weak spot #2 — "Writing those weeks needs a
design decision on how the exile branch resolves. Question for Arshad."

---

## 1. What exists today (verified against the data)

The exile arc is Term 1's post-coup branch. It starts at `act3_week37_coup_attempt`
(outcome flags `government_in_exile`, `chancellor_fled`, `coup_succeeded`,
`brenner_controls_capital`) and runs:

| Week | Scene | Role |
|---|---|---|
| 37 | `act3_government_in_exile` | The government-in-exile establishes itself (3 strategies) |
| 37 | `act3_stellamere_broadcast` | The voice of Free Veltria |
| 40 | `act4_week40_exile` | The exile condition deepens (prereq `government_in_exile`) |
| 40 | `act4_exile_arc` | Strategy choice → sets `exile_strategy_set` + `exile_arc_international` / `exile_arc_resistance` / `exile_arc_negotiate_return` |
| 44 | `act4_week44_counter_coup` | **The Return** — Katerin lands on the Amber Coast (prereq `exile_strategy_set`) |

`act4_week44_counter_coup` offers four outcomes:

| Choice | Flags set | Chain scheduled |
|---|---|---|
| `counter_coup_military_operation` | `counter_coup_military`, `ashenmere_operation`, `coup_resolution_begun` | `act4_week48_war_outcome` @ +4w |
| `counter_coup_political_solution` | `counter_coup_political`, `provisional_government_south`, `coup_resolution_begun` | `act4_week48_war_outcome` @ +4w |
| `counter_coup_brenner_deal` | `brenner_deal_accepted`, `junta_dissolved_peacefully`, `coup_resolution_begun`, `immunity_granted` | `act4_week48_war_outcome` @ +4w |
| `counter_coup_international_intervention` | `international_intervention_requested`, `peacekeeping_mission`, `coup_resolution_begun` | `act4_week48_war_outcome` @ +4w |

## 2. The two defects

**Defect 1 — the four outcomes have no resolution, and the one payoff they do
chain to is the wrong scene.** All four choices chain to `act4_week48_war_outcome`,
which is the **Tyvaren war** resolution ("The Tyvaren offensive was broken…
8,000 dead"). A player who spent Term 1 in exile fighting Brenner's junta gets
the war's after-action report. Meanwhile none of the four outcome flags is read
by any scene: `counter_coup_*`, `brenner_deal_accepted`, `immunity_granted`,
`junta_dissolved_peacefully`, `coup_resolution_begun`, `ashenmere_operation`,
`provisional_government_south`, `international_intervention_requested` are
written at wk44 and consumed only by diary/cliffhanger flavor. The exile player
goes dark between wk44 and wk52: the batch-11 wk45/48/51 scenes are gated
`coup_succeeded == false` (they serve the non-coup branches) and the war-arc
wk45–48 scenes are gated on austerity / civilian-front / reform-backlash flags
the exile player never sets.

**Defect 2 — the wk52 ending contradicts the resolution.** `act4_week52_ending`
routes `ending_military_coup` ("General Brenner rules Veltria now…") on a single
condition: `flags.coup_succeeded == true`. Nothing — not `junta_dissolved_peacefully`
from the Brenner deal, not `coup_resolution_begun` from any of the four paths —
can rescue the player from the junta ending. A player who took Brenner's
negotiated dissolution in wk44 is told at wk52 that Brenner rules Veltria and
the junta has suspended the constitution.

## 3. Proposed design

### 3.1 Outcome model — every path restores the Republic, at different costs

The counter-coup succeeds on all four paths. The branch is about **what the
restoration costs**, not whether it happens — a failed restoration leaves the
game with no playable wk45–51 and re-creates Defect 2 in a worse form.

| wk44 choice | Restoration shape | What it costs (drives wk45/48/51 echoes and the wk52 ending) |
|---|---|---|
| Military operation | Ashenmere taken by force in wk48 | Dead on both sides; army politicized; `ashenmere_operation` |
| Political solution | Southern government becomes the state by wk51 | Slow; two provinces hold out; `provisional_government_south` |
| Brenner deal | Junta dissolves on schedule; Brenner retires with immunity | `immunity_granted` corrupts the transition; reformists revolt; `junta_dissolved_peacefully` |
| International intervention | Forum peacekeepers escort the government home | Sovereignty compromised; Halvekists call it treason; `peacekeeping_mission` |

`coup_resolution_begun` (already set by all four) becomes the flag the wk52
routing reads.

### 3.2 New scenes (three, matching the thin weeks)

- **wk45 — "The Mill" (working title).** The two weeks after the Return. Dusek's
  operational plan vs. the governors' timetable vs. Brenner's back-channel —
  echo nodes read the wk40 strategy (`exile_arc_*`) and the wk44 choice. Sets
  `counter_coup_phase_*`.
- **wk48 — "The Resolution" (working title).** One scene, four conditional
  entrance blocks keyed on the wk44 choice flags (the batch-2 fallback pattern):
  the battle for Ashenmere / the governors' declaration / the junta dissolving
  in a televised address / the peacekeepers crossing the Amber Coast. Each
  closes on a cost beat (names, numbers), not "(Continue)".
- **wk51 — "The Homecoming" (working title).** The last week before the country
  is whole again: what happens to Brenner (retired with immunity / exiled /
  awaiting trial), to the junta officers, to the three governors. Sets
  `counter_coup_resolved` and the flags wk52 will read.

All three scheduled through **agenda JSON entries** (ground rule: reachability
via `buildPool`, not `initWeek` injection), with the wk44 `chainTriggers`
re-pointed from `act4_week48_war_outcome` to the new wk48 scene as a backup
(now that chain scenes reach the map after Fix B).

### 3.3 wk52 ending routing

- Gate `ending_military_coup` on `coup_succeeded == true && coup_resolution_begun != true`
  (i.e. only when the junta actually still rules — the player who never got the
  counter-coup, e.g. a run that skipped wk44).
- Add one ending variant **`ending_restored_republic`** for exile players whose
  counter-coup resolved, with per-path echo paragraphs keyed on the four wk44
  flags (the same conditional-block pattern the scene already uses). Governance
  grading continues to come from `endingCalculator`; this text is the narrative
  layer only.
- Existing endings (`ending_war_*`, `ending_economic_collapse`, …) are untouched.

### 3.4 Flag model (readers only — nothing renamed)

| Flag (already written) | New readers |
|---|---|
| `coup_resolution_begun` | wk52 ending routing (excludes `ending_military_coup`) |
| `counter_coup_military` / `counter_coup_political` / `brenner_deal_accepted` / `international_intervention_requested` | wk45/48/51 entrance conditions + `ending_restored_republic` echoes |
| `junta_dissolved_peacefully`, `immunity_granted` | wk51 Brenner disposition; wk52 echo |
| `ashenmere_operation`, `provisional_government_south`, `peacekeeping_mission` | wk51 cost beats; wk52 echo |
| `exile_arc_international` / `exile_arc_resistance` / `exile_arc_negotiate_return` | wk45 echo nodes (already written at wk40, never read) |

## 4. Options considered

- **A (above): all four paths restore the Republic.** Cost differs, outcome
  doesn't. Keeps wk45–51 playable and makes wk52 coherent.
- **B: the counter-coup can fail** (e.g. military path requires
  `nation.militaryReadiness >= 20`, which the choice already conditions on).
  Rejected as the default: a failure branch has no playable weeks and needs a
  second set of endings.
- **C: single convergence scene** (wk48 handles all four with conditional
  intros, wk45/51 dropped). Cheapest, but wk45/51 stay thin and the teaser
  problem below persists.

## 5. Holds respected by this design

- **Arcturian naming (H-3):** `counter_coup_international_intervention` says
  "the Arcturian government" and the wk52 economic ending names "an Arcturian
  conglomerate". Left exactly as written pending the naming decision; the new
  scenes will use "the Arcturian" only where the existing intervention text
  requires continuity, otherwise "the International Forum" / "the Orythian
  Dominion" per the canon note.
- **General Vass (H-4):** untouched.
- **Week 104:** unplayable by engine design; nothing is placed there.

## 6. Open questions for Arshad

1. **Outcome model:** is "every path restores the Republic" right, or should the
   military/international paths carry a real risk of failure (option B)?
2. **Brenner's end state:** the Brenner deal grants immunity — does he retire
   quietly (recommended: echoes `immunity_granted` into the wk52 personal
   verdict), leave the country, or face trial on the other three paths?
3. **`ending_restored_republic` vs. reuse:** a dedicated ending text, or should
   restored exile players be re-routed into the existing democratic/benevolent
   endings with echo paragraphs (less new text, weaker closure)?
4. **wk50 two letters** is currently un-gated and plays for exile players in the
   middle of the counter-coup ("the election is in two weeks" — which election?
   the exile government hasn't held one). Keep, re-gate to `coup_succeeded == false`,
   or write an exile variant?

---

*Written as the design-first step of the depth pass round 2. Content for
wk45/48/51 and the wk52 routing change follows only after this is signed off.*
