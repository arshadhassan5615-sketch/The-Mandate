# CUTSCENE AUDIT — read-only

Generated 2026-10-19. Read-only sweep of `src/` (scene corpus under `src/data/narrative/**`, 539 scene JSONs at date of scan) plus stores, engine and agenda files. No scene or code was touched; scratch scripts were executed out-of-band via `node --input-type=module` and no scratch files remain in-tree. Cross-references: `docs/audit/00-inventory.md` (P1 repo map, §5 week pools), `docs/audit/02-scheduling.md` (P2 scheduling), `docs/plans/2026-10-13-landscape-suzerain.md`.

---

## STEP 0 — Infrastructure

### 0a) ComicCutscene.tsx

| Fact | Finding |
|---|---|
| Definition | `src/components/ComicCutscene.tsx:1-163` |
| Props | `{ panels: ComicPanel[] , onComplete: () => void }` where `ComicPanel = { image: string, caption: string, sfx?: string, duration?: number }` (ms, default 4000) |
| Behavior | Full-screen fixed overlay (`zIndex` 9999, black), Ken Burns zoom + radial vignette + sepia wash, caption bar in IM Fell English, click-to-skip per panel, auto-advance, fade-out exit before `onComplete()` |
| Store plumbing | `weekStore.ts:372` state `cutscenePanels`, initial `null` at `:437`; setters `triggerCutscene(panels)` `:1739` and `clearCutscene()` `:1740` |
| Render site | `GameLayout.tsx:508-513` — `{cutscenePanels && <ComicCutscene panels={cutscenePanels} onComplete={clearCutscene}/>} |
| **Live triggers** | **Zero. `triggerCutscene(` has no call site anywhere in `src/` — the render path is live but the trigger is dead. (Matches the DORMANT-2 finding in `docs/audit/03-systems.md:102`.)** |

Implication: component + store field + render site all ship today; wiring a cutscene into a scene requires (a) the panels array and (b) one `triggerCutscene()` call — no engine changes needed. Consequence-agnostic with respect to content (content-agnostic engine rule holds).

### 0b) Every other full-screen moment and its trigger

| Component | Trigger | Notes |
|---|---|---|
| `TransitionOverlay` | Rendered unconditionally (`GameLayout.tsx:486`); driven by `transitionLabel`/`transitionWeek` set on phase changes in `weekStore.ts` (`:1798` and phase-switch sites) | Label-text wipe, not image-based |
| `ChildhoodPrologue` | `phase === 'prologue'` (`GameLayout.tsx:219`), entered from new-game flow; uses `src/assets/images/prologue/splash_1931…1958` year-jump illustrations | Only existing image-carrying narrative sequence |
| `MainMenu` | Title screen (`phase === 'title'`), office splash `splash_1962.jpeg` | Full-screen idle art |
| `CliffhangerScreen` | `cliffhangerText` set by `weekStore` `:2079` (`CliffhangerEngine.generateCliffhanger(week)`) and static fallback `:2091`; cleared by `closeCliffhanger` `:1773` | End-of-week, text-only |
| `DiaryScreen` (diaryEntry) | `diaryEntry` set `weekStore.ts:1794` at evening review | Text pane |
| `SaveSlotScreen` | `slotScreenMode` from TopBar save/load | UI screen |
| `CabinetFormation.tsx` | `showCabinetFormation: true` — week-1 formation `weekStore.ts:1208`, reshuffles `:1196/:1661/:1712`, routed via `__cabinet_reshuffle__` at W13 (`:1247-1256`) | Ceremony-like takeover |
| `CabinetMeeting.tsx` | `showCabinetMeeting` phase during week queue | |
| `TermReportScreen` / `LegacyScreen` / `EpilogueScreen` | `showTermReport`/`showLegacy`/`phase === 'epilogue'` (`GameLayout.tsx:311-329`), opened from week-completion chain (`openTermReport` `:1736`, `openLegacy` `:1737`) | End-of-game run of full-screen takeovers |
| `ProjectMidpointModal` | `pendingMidpointProjectId` between phases | Modal, not takeover |
| Emergency crisis scenes | `EmergencyDecreeEngine.checkForEmergencies(state, flags)` consumed in `AgendaSelector.tsx:322-325` and forced into the agenda as a red "Crisis" section — i.e. emergencies arrive as **scenes**, not overlays. AssassinationEngine variant scenes (`act3_assassination_*`), BudgetCrisisEngine and WhisperNetwork "compromised dossier" behave the same way: forced agenda rows. | Relevant to trigger design below |
| `NewsOverlay` / `LegislationOverlay` / `ParliamentOverlay` / `VoteResult` | Week-completion and vote-resolution paths | Card/typographic overlays, no key art |

Conclusion for Step 0b: the game already has exactly one recurring "interrupt" family (forced crisis/military/emergency scenes) and one image-supporting sequence (ChildhoodPrologue). ComicCutscene is currently dormant inventory that matches the ChildhoodPrologue art direction (sepia/IM Fell/vignette).

### 0c) Existing cutscene-style assets

| Set | Count | Style/size |
|---|---|---|
| `src/assets/images/prologue/` | 6 splashes (1931, 1938, 1943, 1951, 1958, 1962) | 2752×1536 (near-16:9), period illustration key art |
| `src/assets/images/Prologue.jpg`, `Prologue 2.jpg` | 2 | 736×1308 |
| `src/assets/maps/veltria_map_full.jpeg` (+4 files) | 1 usable | 2752×1536 painted map |
| `src/assets/potraits/` | 49 character portraits + index.ts + 1 zip | **2048×2048 each; full-res painted portraits already exist for the entire main cast** |
| `src/assets/hero.png` | 1 | 343×361 small |
| `src/assets/images/` root | veltria_seal ×4, katerin_signature, map_pin | UI-scale |
| `src/assets/images/{buttons,Flags,pins,provinces,ui}` | 6/5/10/8/14 | UI chips, not narrative art |
| `src/assets/ss/` | 1 PNG (1728×819) | Screenshot, not game art |
| Broken/preview leftovers in `src/assets/images/` | 2 `.zip` blobs + `img.py` | Should not be counted as art |

**Count usable for cutscenes: ~9 key-art-sized images (6 splashes + map + 2 prologue stills) and 49 full-res character portraits. Ratio matches ComicCutscene's "still image + optional SFX" playing to 16:9.**

### 0d) Scenes by `type` field across acts 0-7 (539 scene JSONs)

| Act | ceremony | emergency | crisis | meeting | personal | event | diplomacy | chain | news | social(+social_event) | briefing | military | cabinet | (missing) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 | 0 | 0 | 0 | 3 | 8 | 9 | 1 | 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| 1 | 2 | 1 | 18 | 44 | 16 | 8 | 0 | 0 | 3 | 1 | 0 | 1 | 1 | 0 |
| 2 | 0 | 3 | 10 | 28 | 14 | 18 | 7 | 8 | 0 | 0 | 2 | 0 | 0 | 2 |
| 3 | 0 | 10 | 73 | 22 | 19 | 17 | 5 | 3 | 0 | 0 | 1 | 0 | 0 | 0 |
| 4 | 0 | 1 | 39 | 4 | 12 | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 5 | 1 | 0 | 4 | 4 | 5 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 6 | 0 | 0 | 10 | 10 | 4 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| 7 | 0 | 0 | 8 | 6 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ? (act unstated) | 0 | 0 | 18 | 32 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

Notes: `ceremony` total = 3 (act1_week1_inauguration, act5_week53_second_address, +1 more `news/social` misfiled); the projector's act-0 folder (`personal/` + `projects/`-adjacent week-0 prologue scenes) carries no ceremony. Two act2 files have no `type` (`act2_week14_convention_opens`, `pipeline_constitution_floor_vote`-adjacent). Non-act folders (`crisis/`, `diplomacy/`, `personal/`, `projects/`, `security/`) fold under act 0 by the TSV convention when `$.act` is absent; the "?" row = 52 agenda-referenced generic-scene files.

---

## STEP 1 — Candidate scoring

**Method (and its honest limits).** Each scene (excluding recurring templates: `act_citizen_petitions`, `act_monthly_press_conference`, `act_campaign_rally`, `act3_nightmare_sequence`, `mole_week*`, `security_posture`, weekly briefing carry-forwards) was auto-prefiltered on keyword families mapped to the five criteria, then the resulting ~130 high-signal scenes were hand-read from their narrative blobs and re-scored 0-3 per criterion:

- **Arrival** — a named official/ambassador/foreign figure visibly enters for the first time (3 = headline entrance of a previously unseen power-broker)
- **Irreversible** — death, coup, referendum/election result, resignation, divorce, detention/ejection from office
- **Reveal** — betrayal, discovered secret, exposure
- **Scale** — whole-of-country stakes
- **Visual** — the event carries as a still image (crowd/tanks/studio/newspaper/ceremony/chapel)
- **Repeat risk** — subtracted; 3 if it can fire more than once per playthrough

The final table below is hand-adjusted; the raw keyword pass is reproducible but not authoritative (11 scenes dead-band-scored 10 and 130 scored ≥5 — the table is the curated cut).

### Top 25

| # | Scene id | Week | Act | Event | A | I | R | S | V | −Repeat | **Score** |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | act3_week37_coup_attempt | 37 | 3 | 3rd Armored leaves Fort Harlan, crosses Ondra Bridge | 2 | 3 | 0 | 3 | 3 | 0 | **11** |
| 2 | act3_week30_betrayal_vostane | 30 | 3 | Vostane denounces the government on live TV outside the Finance Ministry | 0 | 2 | 3 | 3 | 3 | 0 | **11** |
| 3 | act6_week76_midnight_confession | 76 | 6 | Archbishop Renek arrives 2 AM, kneels, confesses guilt in the private chapel | 2 | 2 | 2 | 2 | 3 | 0 | **11** |
| 4 | act1_week1_inauguration | 1 | 1 | Oath behind the curtain at Republic Square; 2 AM self-authored speech | 1 | 3 | 0 | 3 | 3 | 0 | **10** |
| 5 | act1_week20_stellamere_summit | 20 | 1 | First superpower table: Vukov + Orythian ambassador in the Grand Hall | 3 | 1 | 0 | 3 | 3 | 0 | **10** |
| 6 | act3_assassination_* (poisoning / sniper / default — one fires) | 30 | 3 | Attempted assassination variants | 2 | 3 | 0 | 2 | 3 | 0 | **10** |
| 7 | act7_week100_final_debate | 100 | 7 | Assembly converted to a stage; Kolvar has the opening | 2 | 2 | 0 | 3 | 3 | 0 | **10** |
| 8 | act2_week26_referendum_decisive (+narrow/rejected variants) | 26 | 2 | Exhibition Hall referendum count | 0 | 3 | 0 | 3 | 3 | 0 | **9** |
| 9 | act4_week40_war_begins | 39-40 | 4 | 03:17 border crossings, operations bunker | 0 | 3 | 0 | 3 | 3 | −1 | **8** |
| 10 | act3_week29_vyktor_exposed | 29 | 3 | Vyktor got there before you did; the front page | 0 | 1 | 3 | 2 | 3 | 0 | **9** |
| 11 | act3_week36_nadia_publishes | 35-36 | 3 | Nadia's investigation lands before dawn | 0 | 1 | 3 | 2 | 3 | −1 | **8** |
| 12 | act4_impeachment_vote_vindicated | (chain) | 4 | 119-128-articles-fail tally; Kolvar stands frozen 11 seconds | 0 | 3 | 0 | 3 | 3 | 0 | **9** |
| 13 | act4_week46_final_battle | 46 | 4 | Gravenmark Gambit, sixth week of war | 0 | 3 | 0 | 3 | 3 | 0 | **9** |
| 14 | act5_week60_diplomatic_table | 60 | 5 | Stellamere "gilded cage" summit | 2 | 0 | 2 | 2 | 3 | 0 | **9** |
| 15 | act6_week86_ghost_payroll | 86 | 6 | Vostane + Oberlin carry two years of stolen payroll files in | 2 | 1 | 3 | 2 | 1 | 0 | **9** |
| 16 | act7_week91_rogue_shadow | 91 | 7 | Krel's raid ₭5M; Oberlin storms in to accuse him | 2 | 1 | 3 | 2 | 1 | 0 | **9** |
| 17 | act3_week40_border_ultimatum | 40 | 3 | 3 AM red telephone; 4-hour countdown at Gravenmark | 0 | 2 | 0 | 3 | 3 | 0 | **8** |
| 18 | act3_no_confidence_fallen | 13 | 3 | 131 votes — the government falls (vote-engine variant) | 0 | 3 | 0 | 3 | 2 | 0 | **8** |
| 19 | act2_chain_vostane_resignation | 20 | 2 | Her office dismantled, the 1948 frame off the wall | 0 | 3 | 0 | 2 | 3 | 0 | **8** |
| 20 | act4_exile_arc (govt-in-exile) | 40+ | 4 | Five rooms in a borrowed building = the Republic of Veltria | 0 | 3 | 0 | 2 | 3 | 0 | **8** |
| 21 | act5_week53_second_address | 53 | 5 | Square full again, honeymoon over, demob greatcoats | 1 | 1 | 0 | 3 | 3 | 0 | **8** |
| 22 | act6_week77_factory_explosion | 77 | 6 | Plant fire/smoke, industrial line | 0 | 3 | 0 | 2 | 3 | 0 | **8** |
| 23 | act1_week12_brenner_parade | 12 | 1 | Brenner schedules you, not the reverse | 2 | 1 | 0 | 2 | 3 | 0 | **8** |
| 24 | act4_week52_ending | 52 | 4 | The Mandate — one-year verdict | 0 | 3 | 0 | 3 | 2 | 0 | **8** |
| 25 | act4_week45_uprising | 45 | 4 | General strike at dawn; last strike since Halvek broken by tanks | 0 | 1 | 0 | 3 | 3 | 0 | **7** |

Notable runway below the cut (ranked next): `act3_econ_vostane_resignation` (W33, I3 V2 = 6), `act1_chain_capital_strike` (chain, 7-8 but abstract visuals = V2), `act3_national_address_war` (V2 + heavy duplication, see Step 2 flag), `act6_week73_poisoned_pen`, `act7_week95_saints_sin`, `act1_vael_party_funding` (Vael's unannounced arrival is 6 but tiny scale).

---

## STEP 2 — Trigger design for the top 25

Legend — **Trigger**: *before* = panels fire as the scene loads (before first segment text); *after-choice* = panels fire on the closing choice; *transition* = at a listed segment jump inside the scene. **×1** = verified exactly-once scheduling. **Dup** = the scene already narrates the same beat in prose/dialogue.

| Scene | Recommended trigger | Panels | Exactly-once evidence | Duplication risk |
|---|---|---|---|---|
| act3_week37_coup_attempt | before scene text | 3 (night avenue → boots in corridor → office door opens) | **Yes** — `agenda week36.json:41` carry-over + `week37.json:7` primary; week-locked | Mild — the scene's opening beat *is* the corridor sprint (see flag) |
| act3_week30_betrayal_vostane | transition (right after segment where the TV turns on) | 3 | **Yes** — `week30.json:23` single agenda row | **Flag (high):** the scene text already narrates the broadcast from the room; keep cutscene to exterior lectern in daylight, not the TV view |
| act6_week76_midnight_confession | before scene text | 3 (2 AM arrival → kneeling → chapel) | **Yes** — `week76.json:7`, week-locked, single agenda row | Low |
| act1_week1_inauguration | before scene text | 4 (Square crowd → oath → 2AM desk speech) + suggest merging act1_week1_address_nation's broadcast frame into panel 4 | **Yes** — `week01.json:7`; visited-guard pattern (`weekStore.ts` completedSceneIds at `:1279` blocks re-play on New Game resumes) | Mild — playbook with Address-the-Nation immediately after |
| act1_week20_stellamere_summit | before scene text | 3 | **Unverified** — this scene appears in no `week*.json` row found in the P1 §5 pools and no `grep` hit in `weekStore.ts`; scheduling presumed `weekAvailable`-window availability only. **Flag as dead/uncertain.** Do not build panels until scheduled. | Low |
| act3_assassination_* | before scene text | 3 (variant-specific: dinner/sniper/default) | **Yes** — `week30.json` agenda via `act3_week29_assassination_attempt` (deadline 30) + `AssassinationEngine.evaluateAssassinationTrigger` picks exactly one variant, once | Low |
| act7_week100_final_debate | before scene text | 3 | **Yes** — `week100` findings: single `week100.json`-style agenda entry, week-locked | Low |
| act2_week26_referendum_decisive | after last choice (or scene-final board) | 3 | **Yes** — exactly one of decisive/narrow/rejected resolves per playthrough from `__vote__` synthesis (`week26.json:21-63`) | Mild — `family_referendum_night` (W26) replays the same evening from home; if the result cutscene is built, consider dropping that beat; it is a separate personal scene, not scheduled identically |
| act4_week40_war_begins | before scene text | 3 | Mostly — `week39.json:30` + `week40.json:7` carry-over; repeat risk −1 (deadline window) | Low |
| act3_week29_vyktor_exposed | before scene text | 3 | **Yes** — `week29.json:7` single row | Low |
| act3_week36_nadia_publishes | before scene text | 3 (newspaper thump → front page → newsroom light) | Mostly — `week35.json:54` + `week36.json:7`; repeat risk −1 | **Flag (mild):** scene opens with the *thump of the paper* — a strong already-cinematic beat; cutscene should show the printing plant/city, not the doorstep |
| act4_impeachment_vote_vindicated | before scene text | 3 | **Yes** — chain-scheduled `delayWeeks: 0` from `act4_impeachment_proceedings` (`weekStore.ts:1969`), once | Low |
| act4_week46_final_battle | before scene text | 3 | **Yes** — `week46.json:7` week-locked | Low |
| act5_week60_diplomatic_table | before scene text | 3 | **Yes** — week-locked W60 agenda | Low |
| act6_week86_ghost_payroll | before scene text | 2 (two ministers shoulder-to-shoulder in the doorway → the box of files) | **Yes** — week-locked W86 | Low |
| act7_week91_rogue_shadow | before scene text | 3 (raid aftermath → Krel's triumph → Oberlin storming in) | **Yes** — `week91.json:7` week-locked | Low |
| act3_week40_border_ultimatum | before scene text | 3 | **Yes** — hardcoded `weekStore.ts:928` with explicit `!visitedSceneIds` guard | **Flag (high):** scene opens with the 3 AM red-telephone call — itself a strong audio-visual beat; cutscene should show Vukov's tanks at the Pass, NOT the call |
| act3_no_confidence_fallen | after last choice (vote tally board) | 2 | **Yes** — vote-engine synthesized variant, once per playthrough (counterpart `act3_no_confidence_survived` exists at `weekStore.ts:185`) | Low |
| act2_chain_vostane_resignation | before scene text | 3 | **Yes** — `chainTriggers` target fired at most once per playthrough from act2_week20_oil path; forced agenda presentation | Low |
| act4_exile_arc | before scene text | 3 | **Yes-ish** — `week40.json:63`, coup-success branch locked; mutually exclusive with default wartime act4 | Low |
| act5_week53_second_address | before scene text | 3 | **Yes** — `week53.json:7` week-locked | Mild — Start-of-act ceremony mirrors inauguration; visually distinct (demob greatcoats) |
| act6_week77_factory_explosion | before scene text | 3 | **Yes** — week-locked W77 | Low |
| act1_week12_brenner_parade | before scene text | 2 | **Yes** — week-locked W12 | Low |
| act4_week52_ending | after last choice — **but see below** | 3 | **Yes** — `week52.json:7` week-locked | **Flag (high):** `EpilogueScreen`/`TermReportScreen`/`LegacyScreen` already own end-of-game full-screen space. Recommend **not** building this cutscene; the existing epilogue flow is the cap. |
| act4_week45_uprising | before scene text | 3 | **Yes** — `week45.json:7` week-locked | Low |

**Primary duplication flags (build-guard):**

1. `act4_week52_ending` — existing epilogue stack covers it; **drop from recommended set.**
2. `act3_week40_border_ultimatum` — the phone call beat is the cutscene; art shows the border, text keeps the call.
3. `act3_week30_betrayal_vostane` — keep art exterior/daylight; do not re-render the TV feed the scene already narrates.
4. `act3_week36_nadia_publishes` — art shows the plant/print run; text keeps the doorstep beat.
5. `act1_week20_stellamere_summit` — **scheduling unverified** (see table); not buildable today.

---

## STEP 3 — Category caps

Target: **near one cutscene per act per category.** Four categories: *Arrival*, *Reveal*, *Irreversible*, *Set piece* (a Visual/Scale "moment of state"). Caps (and the recommended selection in rank order within each):

| Act | Arrival (cap → pick) | Reveal (cap → pick) | Irreversible (cap → pick) | Set piece (cap → pick) | Act total |
|---|---|---|---|---|---|
| 1 | 2 → stellamere_summit, brenner_parade | 0 (act1 reveals are chain-fed and too abstract for stills) | 1 → inauguration | 1 → inauguration (counts as its own Set piece; no second taken) | 3 |
| 2 | 0 (no act2 arrival outranks the caps) | 0-1 → optional flex: chain_vostane_resignation could count as an act2 "irreversible-with-reveal-adjacency", scored under Irreversible instead | 1 → chain_vostane_resignation (5) | 1 → referendum_decisive | 2 |
| 3 | 1 → assassination variant | 2 → betrayal_vostane, vyktor_exposed (nadia_publishes as 3rd = optional flex) | 2 → coup_attempt, border_ultimatum | 1 → coup_attempt already carries V3/S3 (Set piece-weighted); border_ultimatum then stays its Irreversible pick | 5 |
| 4 | 0 | 0 (impeachment is irreversible, not reveal) | 3 → war_begins, impeachment_vote, exile_arc (exile_arc branch-locked, so it does not fire on the default path) | 1 → final_battle (uprising = optional flex) | 4 |
| 5 | 1 → diplomatic_table | 0 | 0 | 1 → second_address (referendum-night mirror of Act 2 caps) | 2 |
| 6 | 1 → midnight_confession | 1 → ghost_payroll (poisoned_pen = optional flex #2) | 1 → factory_explosion | 0 (factory carries the Set piece weight inside its Irreversible pick) | 3 |
| 7 | 0 | 1 → rogue_shadow (saints_sin = optional flex #2) | 0 | 1 → final_debate | 2 |

**Optional flex slots (do under caps if budget allows):** nadia_publishes (act3 Reveal #3), border_ultimatum (act3 Set piece), week45_uprising (act5-adjacent… actually act4 Set piece #2 — audit caps only if act4 total stays ≤4), poisoned_pen (act6 Reveal #2), saints_sin (act7 Reveal #2).

**Within-cap recommended set = 21 cutscenes** (and 24 if all optional flex slots are funded), aligning to "one per act, per category" with the Acts 3/4 exceptions that the content plan demands and Step 1 scores support.

---

## STEP 4 — Cost estimate

Panel math: the 21 recommended + 3 optional flex = 24 total候选 for the cost estimate; at the 2-4 panels/scene target with the recommendations above (most scenes at 3; inauguration at 4; two at 2):

| Bucket | Scenes | Panels |
|---|---|---|
| In-caps 21 | 21 | 61 |
| Optional flex 3 | 3 | 8 |
| **Total recommended build** | **24** | **≈ 69 panels (range 54-74 depending on 2 vs 4 allocations)** |

**Characters needing dedicated panel art** (distinct individuals who appear in a recommended panel): Katerin (source silhouette/portrait exists), Jonas, Liora, Tomas, Vyktor, Serida, Kolvar, Vostane, Theron, Renek, Krel (Matthias Krel), Oberlin, Nadia, Brenner, Dusek, Morvec, Vukov, Ambassador Cole — **18 named characters**, plus 5 crowd/extra archetypes (citizens/soldiers/delegates/miners/priesthood). Existing 2048×2048 portraits cover ~15 of the 18 named casts; 3 need new full-body/painted variants in scene context (Nadia, Oberlin, Krel have portrait files but no scene-composed art; their portrait files exist under `src/assets/potraits/` so the cost is recomposition, not creation).

**Locations needing key art** (distinct painted establishing shots at 2752×1536): Republic Square platform; Stellamere Grand Hall; Ashenmere parade avenue; operations bunker; Gravenmark Pass + tanks at border (shared art w/ ultimatum); Ondra Bridge tanks at night (coup); Finance Ministry steps daylight (betrayal); Exhibition Hall count night; operations/broadcast studio (shared art w/ address); private chapel; dockside warehouse (assassination default variant) + ambassador dining room (poisoning variant) — shooting these two with one shared "Arcturian residence" composite; assembly chamber (impeachment + final debate share); Winter Street/general strike crowd; Gravenmark field-of-battle (test of the shared map); annex-exile study; factory fire; newsroom/printing plant. **≈ 16 location plates** (17 if press/newsroom split from radio studio's otherwise shared plate).

**Existing asset gap:** only ~9 cutscene-spec plates exist (prologue splashes + map). Portraits are the strongest existing base.

---

## COULD NOT VERIFY (honest limits)

1. `act1_week20_stellamere_summit` scheduling — no agenda row or weekStore hit found; scene likely orphaned (checks in the P2 audit's UNREACHABLE bucket filer at `_p2e_out.txt` should confirm, but we did not re-run that generator).
2. Visual style of the individual image files was verified only programmatically (dimensions/headers), not by visual inspection — "painted illustration" style is strongly indicated by file set (2048² portraits, 2752×1536 splashes) and by the ComicCutscene/ChildhoodPrologue sepia-and-IM-Fell art direction but a human art review remains worthwhile.
3. Per-file panel balancing for SFX availability (`ComicCutscene.sfx` expects URLs): `src/assets/audio/` holds 23 files but whether they map to specific panel beats was not catalogued.
4. `week` fields: TSV/JSON week-vs-`weekAvailable` discrepancies noted in the P1 audit (e.g. `act3_no_confidence_fallen` carries `weekAvailable=1` as a fallback; it is genuinely reachable only through the week-13 vote synthesis). Scores rely on schedule reality, not malformed JSON week fields.
5. `image assets under src/assets` has 199 files total; we excluded 21 packaged/UI/aux files (zips, `img.py`, buttons/pins/ui, fonts, audio) from the "cutscene-relevant" count.

## Report deliverables held inside this file only

- **Scoring table:** §Step 1
- **Recommended shortlist with triggers and cap check:** §Step 2 + §Step 3
- **Unverified items:** §Could not verify
- **Total panel count:** ≈ 69 (54-74), for a 21-24 scene recommended build

---

*Buffy/Freebuff audit — no files other than this document were created; no scene JSON or engine code was touched.*
