# THE MANDATE - Political Narrative RPG

## Project Overview
A text-based political narrative RPG. Player is Katerin Ashavel, first woman
Chancellor of the Republic of Veltria, 1963. All narrative content is JSON-driven;
the engine layer is content-agnostic.

> NOTE FOR AGENTS: This file is the source of truth. The codebase is this
> repository: `src/` next to this file is the live app, and all paths below are
> relative to the repository root. On the desktop workspace the repository is
> checked out as `the-mandate/`; a stub `src/` one level above that folder is
> dead and should be ignored.

## Tech Stack
- React 19.2.6 + TypeScript 6.0.2 + Vite 8.0.12
- Zustand 5.0.13 (state management, one store per domain)
- Tailwind CSS 4.3.0 + CSS custom properties
- Framer Motion (animations)
- Dexie.js (IndexedDB save system)

## Key Architecture Rules
- ALL narrative content lives in JSON files under `src/data/narrative/`.
- Engine code is content-agnostic - adding scenes never requires engine changes.
- Game state transitions produce new state objects (immutable).
- Hidden stats are NEVER shown to the player (except budget).
- Major climax choices must trigger chain reactions; minor flavor choices may not.

## Current Phase
Phase 3: Mid-to-Late Game Content & Architectural Polish (Acts 3/4).

Scope at this phase:
- Acts 1-2 are content-complete.
- Act 3 is the active content front (145 scenes, still growing).
- Act 4 endings and epilogue branches are being authored (59 scenes).
- Engine surface is stable; remaining engineering work is consolidation, not new
  systems (e.g., dedupe `engine/newsTemplates.ts` vs `data/news/newsTemplates.ts`,
  collapse the four manual state-object literals in `stores/gameStore.ts` into
  spread-based updates, declare missing setters on the `GameStore` interface).

## File Structure (src/)

```
src/
+-- App.tsx
+-- main.tsx
+-- index.css
+-- vite-env.d.ts
|
+-- components/                       (56 React components)
|   +-- AgendaSelector.tsx
|   +-- BudgetInterface.tsx
|   +-- CabinetFormation.tsx
|   +-- CabinetMeeting.tsx
|   +-- CharacterCustomization.tsx
|   +-- CharacterMap.tsx
|   +-- ChildhoodPrologue.tsx
|   +-- CliffhangerScreen.tsx
|   +-- CodexViewer.tsx
|   +-- ConstitutionalReform.tsx
|   +-- DebugPanel.tsx
|   +-- DiaryScreen.tsx
|   +-- EpilogueScreen.tsx
|   +-- ErrorBoundary.tsx
|   +-- EveningReview.tsx
|   +-- FactionIndicators.tsx
|   +-- FamilyStatus.tsx
|   +-- GameLayout.tsx
|   +-- JournalView.tsx
|   +-- KaterinHUD.tsx
|   +-- LegacyScreen.tsx
|   +-- LegislationOverlay.tsx
|   +-- LetterView.tsx
|   +-- LobbyingInterface.tsx
|   +-- MainMenu.tsx
|   +-- MapView.tsx
|   +-- MorningBriefing.tsx
|   +-- NarrativeScene.tsx
|   +-- NewsOverlay.tsx
|   +-- ProjectMidpointModal.tsx
|   +-- ProjectsPanel.tsx
|   +-- RadioAddressView.tsx
|   +-- RightSidebar.tsx
|   +-- SaveLoadMenu.tsx
|   +-- SettingsPanel.tsx
|   +-- SidePanel.tsx
|   +-- SocialEvent.tsx
|   +-- TermReportScreen.tsx
|   +-- TopBar.tsx
|   +-- TransitionOverlay.tsx
|   +-- VeltriaMap.tsx
|   +-- VoteResult.tsx
|   +-- VoteTracker.tsx
|   +-- narrative/
|   |   +-- ConversationPanel.tsx
|   +-- news/
|   |   +-- EntityLinker.tsx
|   |   +-- NewsMastheads.tsx
|   +-- panels/
|   |   +-- ConnectionsPanel.tsx
|   |   +-- DiplomaticLetterPanel.tsx
|   |   +-- InlineCodexPanel.tsx
|   |   +-- NotepadPanel.tsx
|   |   +-- OverviewPanel.tsx
|   |   +-- ProvinceDetail.tsx
|   +-- portraits/
|   |   +-- CharacterPortrait.tsx
|   |   +-- CharacterPortraits.tsx
|   |   +-- KaterinSilhouettes.tsx
|   +-- ui/
|       +-- BillSignAnimation.tsx
|
+-- engine/                           (21 modules - all content-agnostic)
|   +-- AssassinationEngine.ts        Wk 30-36 trigger + variant picker
|   +-- AudioManager.ts               MP3 track registry / playback
|   +-- BillEngine.ts                 Bill registry + scheduling
|   +-- ChainReactionEngine.ts        Deferred consequence scheduler
|   +-- CliffhangerEngine.ts          End-of-week cliffhanger picker
|   +-- CorruptionEngine.ts           Flag -> ledger entry mapping
|   +-- DiaryEngine.ts                Personalized diary generation
|   +-- EconomicEngine.ts             Economic direction effects
|   +-- JonasEngine.ts                Jonas role evolution
|   +-- LegacyEngine.ts               Endgame multi-dimension grading
|   +-- LetterEngine.ts               Letter catalog + recipients
|   +-- MoleEngine.ts                 Spy subplot + clues
|   +-- NarrativeEngine.ts            SCENE_REGISTRY + getScene()
|   +-- RadioEngine.ts                Radio broadcast theme effects
|   +-- SaveManager.ts                Dexie/IndexedDB persistence
|   +-- VoteEngine.ts                 Assembly seat math
|   +-- audioEngine.ts                Web Audio synth (no MP3)
|   +-- budgetEffects.ts              Budget line -> stat modifier map
|   +-- conditionEvaluator.ts         Dot-notation condition resolver
|   +-- endingCalculator.ts           Governance / personal scoring
|   +-- newsTemplates.ts              Separate module - sim-condition news bank;
|                                     not a duplicate of data/news/newsTemplates.ts
|                                     (engine: NewsItem sim conditions; data: per-paper
|                                      narrative coverage - different schemas, zero shared headlines)
|
+-- stores/                           (11 Zustand stores)
|   +-- billStore.ts
|   +-- cabinetStore.ts
|   +-- chainStore.ts
|   +-- codexStore.ts
|   +-- gameStore.ts                  Master GameState + applyModifiers
|   +-- journalStore.ts
|   +-- letterStore.ts
|   +-- narrativeStore.ts             Scene lifecycle + processChoice
|   +-- newsStore.ts
|   +-- settingsStore.ts
|   +-- weekStore.ts                  Week queue + advanceQueue/completeWeek
|
+-- types/                            (12 type modules)
|   +-- bills.ts
|   +-- codex.ts
|   +-- ending.ts
|   +-- gameState.ts                  GameState, NationState, FactionState, etc.
|   +-- journal.ts
|   +-- letters.ts
|   +-- minister.ts
|   +-- narrative.ts                  NarrativeNode, SceneChoice, ChainTrigger
|   +-- news.ts
|   +-- projects.ts
|   +-- vote.ts
|   +-- week.ts
|
+-- hooks/                            (4 React hooks)
|   +-- useAudio.ts
|   +-- useDialogueFlow.ts
|   +-- useHotkeys.ts
|   +-- useSegmentTypewriter.ts
|
+-- db/
|   +-- mandateDb.ts                  Dexie schema + SaveRecord
|
+-- data/
    +-- projects.json
    +-- newspapers.ts
    +-- provinces.ts
    +-- ministerRequests.ts
    +-- ministers.ts
    |
    +-- narrative/                    (370 scene JSON files total)
    |   +-- act1/        (72 files)   Weeks 1-13, includes:
    |   |   +-- briefings/   (1)      Press briefings
    |   |   +-- family/      (1)      Family scenes
    |   |   +-- investigation/ (6)    Mole subplot
    |   +-- act2/        (74 files)   Weeks 14-26 (referendum arc)
    |   |   +-- family/      (1)
    |   +-- act3/        (145 files)  Weeks 27-39 (crisis + coup)
    |   +-- act4/        (59 files)   Weeks 40-52 (endings + epilogues)
    |   +-- diplomacy/   (6 files)    Cross-act diplomatic scenes
    |   +-- projects/    (14 files)   Development project scenes
    |
    +-- bills/                        (14 legislative bills)
    |   +-- bill_amber_coast_free_trade.json
    |   +-- bill_anti_corruption_commission.json
    |   +-- bill_electoral_allocation_reform.json
    |   +-- bill_equal_citizenship_participation.json
    |   +-- bill_free_press_protection.json
    |   +-- bill_halvek_legacy_accountability.json
    |   +-- bill_kravenstal_worker_safety.json
    |   +-- bill_military_modernization_preparedness.json
    |   +-- bill_national_security_emergency_powers.json
    |   +-- bill_protect_families_public_morality.json
    |   +-- bill_refugee_resettlement_integration.json
    |   +-- bill_state_enterprise_restructuring.json
    |   +-- bill_thornfeld_agricultural_subsidy.json
    |   +-- bill_womens_economic_liberation.json
    |
    +-- news/
    |   +-- newsTemplates.ts          Canonical news template bank
    |   +-- opinionLabels.ts
    |
    +-- newspapers/
    |   +-- divergent_coverage.ts
    |
    +-- characters/
    |   +-- roster.ts
    |
    +-- cliffhangers/
    |   +-- cliffhangerTemplates.ts
    |
    +-- constitution/
    |   +-- provisions.ts
    |
    +-- diary/
    |   +-- diaryEntries.ts
    |   +-- diaryTemplates.ts
    |
    +-- journal/
    |   +-- journalTemplates.ts
    |   +-- templates.ts
    |
    +-- vote/
        +-- factionSeats.ts
```

## Commands
- `npm run dev`     - Vite dev server
- `npm run build`   - `tsc -b && vite build`
- `npm run lint`    - `eslint .`
- `npm run preview` - Vite preview build
- No test script is currently defined.

## Design Document
Full GDD is at `../GAME_DESIGN_DOCUMENT.md` (one level up, at the workspace root)
- reference it for all world-building, characters, mechanics, and content specs.
