# The Mandate: Suzerain-style UI & mechanics upgrade plan

Branch: `feat/suzerain-upgrade` · Date: 2026-10-12
Reference: Suzerain recon at `../../suze/replica/recon.md` (screens S01–S21, flows F01–F09).
Rule: patterns and mechanics only. Every character, line, decree, law and newspaper stays The Mandate's own.

## 0. Starting point (verified 2026-10-12)

- Engine bugs A/B/C from `GAME_ANALYSIS.md` are **already fixed** (`9ba5522`, `16c9cc0`, `b0a00e1`, plus `abd313b` and `fa3c120`). The week-flow contract tests pass.
- `tsc -b` is clean. Vitest: 208 pass / 6 fail / 4 skipped. The 6 failures are the known stale UI assertions in `DecreeInbox.test` and `TopBar.test`.
- Baseline screenshots were taken at 1440×900 and 390×844.

## 1. Suzerain feature → Mandate gap map

| Suzerain pattern (recon ID) | Mandate today | Gap |
| --- | --- | --- |
| Portrait dialogue scene (S04) | `ConversationPanel` is a dark centre column over the map. Narrator text shows no portrait, speaker plate or scene header. | **Big.** This is the screen players spend 80% of their time on. It needs a speaker portrait rail, name/role plate, scene title/location header, and choice cards that show cost and lock reasons. |
| Ministers argue before a decision (F02) | The content exists (cabinet scenes), but it is shown as a plain text stream. | Present multi-speaker exchanges as two portraits facing each other. |
| HUD with resources (S05) | Icon-only pills: `₭-65`, `12,000`, `55%`. Unlabelled, no deltas. | Labels and tooltips, a change flash (+/-), week/date chip and term progress. Fix the budget-vs-growth confusion players had in Suzerain. |
| Unlabelled nav rail | 9 icon buttons with no text. | Labels on hover/focus, unread badges on all of them, keyboard shortcuts shown. |
| Keyword → brief overlay (F03) | `EntityLinker` and `InlineCodexPanel` exist. | Check that links appear in dialogue and open the overlay, returning to the same line. Polish the overlay. |
| Map tokens + region modifiers (S06/S07) | Strong: illustrated map, pins, `ProvinceDetail`. | Show per-province indicator chips on the map. Mobile currently crops the country (fit-to-screen needed). |
| Policies & situations (S08) | Spread across Overview, PublicOrder and Economy panels. | Add one **"State of the Republic"** panel: active laws, signed decrees, ongoing situations with severity and trend. |
| Newspaper (S09) | `NewsOverlay` with mastheads. | **Bug:** the conversation panel (z 600+) renders above the newspaper. Add an outlet switcher and unread state. |
| Legislation / decrees (S11/S13) | `LegislationOverlay`, `DecreeInbox`, `ParliamentOverlay`. | Shared "document" component: paper, seal, signature (`Sign_Button.png`, `katerin_signature`). Show cost and prerequisites up front. |
| Turn card (S16) | `ChapterTransition` / `ActTransition`. | Add a week recap: 3 consequences of last week. |
| Epilogue + results (S19/S20) | `EpilogueScreen`, `LegacyScreen`, `TermReportScreen`. | Add a political-compass plot from existing ideology stats. |
| Save/load, settings (S17/S18) | Present. | Restyle only. |
| Phone layout | A bottom nav exists. The map is cropped, and scenes and overlays are not checked at 390px. | Do a full mobile pass on every screen. |

## 2. Design system (new: `src/styles/tokens.css`)

Direction: **1960s Veltrian state paper**. Dark walnut desk, ivory dossier paper, oxblood and brass. It reuses your fonts (TheHeritageLegacy, BulletinGothic, Deutschlander), seal, portraits and map. It is not Suzerain's palette.

- Colour tokens: `--desk` (near-black walnut), `--paper` (ivory), `--ink`, `--brass` (existing #b59a5e), `--oxblood`, `--state-good`, `--state-bad`, `--state-warn`.
- Type scale: display (TheHeritageLegacy), document/body serif, stamp/label (BulletinGothic, uppercase, tracked).
- **Z-index scale**, which replaces the current hard-coded values (600/601/602/90/3): `--z-map 0 · --z-hud 100 · --z-scene 200 · --z-panel 300 · --z-overlay 400 · --z-modal 500 · --z-toast 600`. Overlays always sit above the scene. This fixes the newspaper bug.
- Motion: one easing and two durations. Respect `prefers-reduced-motion`.

## 3. Phases (each phase is one PR-sized commit group, tested and screenshotted)

| # | Phase | Main files | Done when |
| --- | --- | --- | --- |
| P1 | Tokens + z-index scale + newspaper layering fix | `index.css`, new `styles/tokens.css`, ConversationPanel, NewsOverlay, DecreeInbox | The news/decree/codex overlays open above a scene; there are no raw z-index literals in the touched files. |
| P2 | **Dialogue scene redesign** (S04) | `narrative/ConversationPanel.tsx` (split it: it is 1,316 lines), `NarrativeScene.tsx` | Portrait rail, speaker plate, scene header, choice cards with cost and lock reason, keyword links. Spine tests still green. |
| P3 | HUD + nav rail | `TopBar`, `LeftSidebar`, `RightSidebar`, `KaterinHUD` | Labelled resources with deltas and tooltips, week/term chip, labelled nav with badges and shortcuts. |
| P4 | State of the Republic panel (S08) | new `panels/StatePanel.tsx` (composes the existing Overview/Economy/PublicOrder data) | One place shows laws, decrees and situations. |
| P5 | Documents: bills, decrees, letters | `LegislationOverlay`, `DecreeInbox`, `LetterView`, new `ui/StateDocument.tsx` | Shared paper/seal/sign component, costs and prerequisites visible before signing. |
| P6 | Map polish + mobile fit | `VeltriaMap`, `MapView`, `ProvinceDetail` | Fit-to-viewport on phones; indicator chips on provinces. |
| P7 | Turn recap + results compass | `ChapterTransition`, `LegacyScreen` | Week recap card; compass plot on the results screen. |
| P8 | Mobile + accessibility pass | all | Every screen is usable at 390px, focus states and keyboard work, contrast passes. |

Not in scope: new story content, renaming characters, engine semantics, save-format changes. If a phase needs a save-format change, it stops and asks first.

## 3a. Status

**P1 done (2026-10-12, uncommitted on `feat/suzerain-upgrade`).**
- `src/constants/zIndex.ts` is now the full layer scale: HUD 100–250 < scene 600–602 < panel 700 < overlay 800 (codex 810) < modal 900 < transition 9999 < system 10050 < debug 100000. HUD and scene values are unchanged.
- 24 player-opened layers migrated off raw literals. Three were hidden behind a running conversation and are now on top: the newspaper (was 200), Settings (was 100) and the inline codex (was 110).
- `src/styles/tokens.css` adds document-paper, brass/oxblood, state and motion tokens. Reduced motion is honoured in CSS and Framer (`<MotionConfig reducedMotion="user">` in `App.tsx`).
- Gate: `src/constants/__tests__/zIndex.test.ts` (28 tests) checks the order and fails on any raw global z-index in those 24 files.
- Verified: `tsc -b` clean; vitest 236 pass / same 6 pre-existing failures; Playwright at 1440×900 and 390×844 shows the newspaper, Settings and codex above a scene.
- Found, not fixed: `DiplomaticLetterPanel` is mounted twice (`App.tsx` and `GameLayout.tsx`).

**P2 done (2026-10-12, uncommitted).** Dialogue scene (S04).
- `narrative/SceneHeader.tsx`: week, crisis/emergency badge, location line and title. These come from props that `ConversationPanel` already received but never rendered.
- `narrative/ChoiceCard.tsx`: choices are real `<button>`s (Tab/Enter, focus ring, disabled while resolving). Shows the author `tooltip` as a hint line, which was authored in 25 scene files but never displayed. Enter/Space do not leak to the global advance key.
- `narrative/speakers.ts`: speaker names and colours extracted from `ConversationPanel`, plus `speakerRole()` from the character roster. Dialogue labels read "NAME · Role :".
- `scripts/reply-audit.d2*.mjs`: choice selector updated `> div` → `> button`.
- Tests: 18 new (ChoiceCard 8, SceneHeader 5, speakers 5). Suite 254 pass / same 6 pre-existing failures. Screenshots at 1440 and 390.
- Deliberately not done: locked-choice display (it would expose your hidden routing) and budget-cost chips (only 8 choices use a `budget` stat). Two-portrait "ministers argue" layout moved to a later pass; the existing medallion stack already shows current + other speakers.

**P2 committed** as `0addef6` (pushed).

**P3 done (2026-10-12, uncommitted).** HUD + nav rails.
- `ui/RailButton.tsx`: one shared rail button replaces the two private copies in LeftSidebar/RightSidebar (RightSidebar 511 → 314 lines). Label tooltip on hover **and** keyboard focus, shortcut key shown in it, `aria-keyshortcuts`, `aria-pressed`, badge spoken as "3 unread" / "12 entries" / "30 pending", gold focus ring.
- `constants/hudShortcuts.ts`: one key map read by App.tsx and the tooltips. Existing C/J/N/M kept; new P (newspaper), D (decrees), L (diplomatic letters), gameplay only. Escape now also closes the diplomatic letter panel.
- TopBar chips show TREASURY / PRIVY PURSE / APPROVAL labels on desktop (phones keep compact pills). Change deltas were already there.
- Rails use `Z.navRail` and `useIsMobile`; both rails and TopBar are now in the z-index gate.
- Week/date chip **not** re-added: commit `c006ac6` removed it on purpose.
- Tests: 14 new. Suite 268 pass / same 6 pre-existing failures. Playwright at 1440 and 390: 10 rail buttons labelled, focus tooltip, P and D open their panels.
- Known: on phones the bottom bar scrolls sideways, which clips tooltips drawn above it (touch players never saw them anyway). Left for P8.

**P3 committed** as `b172263` (pushed).

**P4 done (2026-10-12, uncommitted).** State of the Republic panel (S08).
- `panels/StatePanel.tsx`: ivory state-paper sheet opened from a new pillar button on the left rail. Laws tab lists every bill decision (Signed into law / Became law unsigned / Veto overridden / Vetoed, with week), newest first. Decrees tab lists signed decrees with category, proposer and summary.
- `panels/stateRecords.ts`: pure builders. They carry only what the player saw when deciding. Decree effect descriptions are **not** shown: no screen displays them today, and some name hidden stats (e.g. oligarch influence). Pending delayed consequences appear only as a count.
- Not included: "ongoing situations with severity and trend". The only candidate data is hidden stats or the state of emergency, which TopBar hides on purpose. Revisit if you want situations surfaced.
- Dialog semantics, tabs with `aria-selected`, Escape closes only this panel. Phone: full-width sheet above the bottom bar.
- Tests: 14 new. Suite 282 pass / same 6 pre-existing failures. Playwright at 1440 and 390.

**P4 committed** as `25b50a3` (pushed).

**P5 partly done (2026-10-12, uncommitted).** Bills.
- `ui/FiscalNote.tsx`: every bill now states its budget cost before signing ("Adds ₭15M to the national debt" / "Reduces the national debt by ₭80M" / "No cost to the treasury"). Budget is the one stat the player may see; `budgetCost` was applied on signing but never shown.
- `LegislationOverlay`: page width `min(680px, 100vw)` (was a fixed 680px that overflowed phones), phone padding, bill text 11.5px → 13.5px, left-aligned on phones.
- Not done: a shared `StateDocument` component. The bill page already had paper, seal and signature; extracting a shared shell is a refactor with no player-visible change, so it waits for a pass that changes the decree and letter pages too.
- Not done: decree prerequisites. They test hidden stats, so showing them would leak.
- Still open for P8: `DecreeInbox` uses a 280px list beside a 680px page, which will not fit a phone.
- Tests: 5 new. Suite 287 pass / same 6 pre-existing failures. Playwright at 1440 and 390: fiscal note shown, no sideways scroll.

**P5 bills committed** as `f9ad04d`.

**P5 done (2026-10-12, uncommitted).** Decrees and letters.
- `ui/StateDocument.tsx`: shared `DocumentSeal` and `SignatureLine` (empty line + caption, signature writes in when signed). Bills, decrees and letters all use it; the bill and decree pages each had their own copy before.
- **Data bug fixed:** all 20 `nation.nationalDebt` effects in `data/decrees.ts` had the wrong sign. Decrees treated it as a treasury balance, but it is a debt total (bills and the budget engine add to it when spending). Signing a ₭20M hospital decree *lowered* the debt by ₭20M. Signs flipped to match each effect's own description; a test now checks every debt effect against its description.
- Decree page: seal, "Economic decree · Proposed by …" line, fiscal note (`ui/decreeFiscal.ts`, net of immediate and delayed debt effects), and a stated reason when a conflicting decree is in force. Before, the Sign button just greyed out. The conflict check also now catches any listed rival, not only the first.
- Decree inbox on phones: list stacks above the document, whole column scrolls. No sideways scroll at 390.
- Letters: preview carries the seal and an empty signature line; "Sign & send" writes the signature in, then sends after 1s. Personal-tone letters go out as "Katerin Ashavel" without the state seal.
- Not done: decree prerequisites (hidden stats). Reject/Table buttons stay removed (taken out in `414e5e5`); the 2 stale `DecreeInbox.test` failures still expect them.
- Tests: 35 new (StateDocument 3, decreeFiscal 24 incl. one per authored debt effect, DecreeDocument 5, LetterView 3). Suite 322 pass / same 6 pre-existing failures. Lint on touched files: 3 errors left, all pre-existing (was 6). Playwright at 1440 and 390: decree with fiscal note, decree with conflict, bill page, letter signing.

**P5 committed** as `02064d5` (pushed).

**P6 done (2026-10-12, uncommitted).** Map polish + mobile fit. (`VeltriaMap.tsx` is dead code, imported nowhere; the live map is `MapView`.)
- **Phone bug fixed:** during the week map (`map` phase) the map is the fixed background, at cover zoom centred on Ashenmere. On a 390px phone Kravenstal, Thornfeld and Sevagrad were off-screen and unreachable. Phones now fit all six provinces in both map modes, centred, with the sea colour filling the gaps. Desktop framing is unchanged.
- `map/mapFit.ts`: pure zoom/pan geometry (country bounds from the six province pins, desktop cover zoom, phone fit zoom, clamp that centres an axis when the map is smaller than the screen).
- Full map (M) drags with pointer events, so touch works (it was mouse-only); `touch-action: none` stops the page scrolling instead.
- `map/ProvinceChip.tsx`: a condition chip (Stable / Tense / Crisis, coloured) under each province on the week map and the full map. It counter-scales so it reads the same at any zoom. Desktop shows the status only (the map already prints names); phones add the name, since the printed labels are unreadable there. Never numbers.
- `map/provinceStatus.ts`: the status rules moved out of `ProvinceDetail` so the panel and chips cannot disagree.
- Province buildings are keyboard buttons (Tab, Enter/Space opens the province panel) with labels like "Kravenstal: Crisis".
- **Found, not fixed:** `ProvinceDetail`'s status line prints raw hidden-stat numbers ("Corruption 62", "Dravenni support 31", "Military readiness 40"), against the hidden-stats rule. The chips show only the level. Needs your call: drop the numbers or keep them.
- Tests: 14 new (mapFit 7, provinceStatus 2, MapViewChips 5). Suite 336 pass / same 6 pre-existing failures. Playwright at 1440 and 390: week map and full map, all six chips on screen, drag pans, no sideways scroll.

**P6 committed** as `b0bb862` (pushed).

**P7 done (2026-10-13).** Turn recap + results compass.
- **Week recap** goes in the morning briefing, not the week card. The week card is cleared by a 1.5s timer in `weekStore.completeWeek` that also runs chain reactions, so it can't hold three lines of reading without changing week-flow timing. The briefing runs every week (week card → diary → briefing) and is read at the player's pace.
- `briefing/WeekRecap.tsx` + `briefing/recapItems.ts`: "Last Week — Week N" lists up to 3 of last week's journal entries, those with a recorded consequence first, then newest. Journal entries are already player-visible, so nothing hidden leaks. 1,449 tagged choices in 403 scene files write entries, plus bill decisions. Hidden in week 1 or when there are no entries. Rows wrap on phones.
- **Compass:** a new "Compass" tab on `LegacyScreen`. `results/compass.ts` places the Chancellor from every recorded choice's alignment: Reform ↔ Authority (vertical), Pragmatic ↔ Populist (horizontal). Personal/deflect choices are left out; fewer than 3 political choices shows a "too few decisions" line. Nine named positions (e.g. "Tribune of Reform", "Iron Administrator"). The SVG has a screen-reader label.
- `LegacyScreen` tabs now shrink and wrap, so all four fit at 390 (the old three already clipped).
- `ChapterTransition.tsx` is dead code (imported nowhere); the week card is `TransitionOverlay`.
- **For P8:** `MorningBriefing` isn't phone-ready (the left rail overlaps the page and the footer text breaks).
- Tests: 12 new (recap 6, compass 6). Suite 348 pass / same 6 pre-existing failures. Lint clean on touched files. Playwright at 1440 and 390: briefing recap, compass tab, no sideways scroll.

## 4. Verification per phase

`tsc -b` clean · `vitest run` with no new failures (baseline 6) · Playwright screenshots at 1440×900 and 390×844 compared to the baseline · spine/week-flow sims stay green.
