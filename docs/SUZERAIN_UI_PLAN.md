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

## 4. Verification per phase

`tsc -b` clean · `vitest run` with no new failures (baseline 6) · Playwright screenshots at 1440×900 and 390×844 compared to the baseline · spine/week-flow sims stay green.
