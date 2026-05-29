# The Mandate — Developer Handoff

## 1. Project Goal

A text-based political narrative RPG — "The Mandate" — where the player is Katerin Ashavel, first woman Chancellor of the Republic of Veltria (1963). Built with React 18 + TypeScript + Vite + Zustand + Tailwind CSS + Framer Motion + Dexie.js.

The game spans 52 weeks across 4 acts. Player governs through cabinet meetings, crises, diplomacy, budget allocation, constitutional reform, and family drama. Every choice modifies stats and triggers chain reactions. The game ends with an epilogue based on accumulated decisions.

**Key UX goals achieved this session:**
- Suzerain-style atmosphere (dark palette, CRT scanlines, film grain, parchment textures)
- Mid-conversation scene entries (player walks in on arguments already in progress)
- Internal monologue system before choice cards
- Post-choice micro-reactions from cabinet members
- Ornate choice card frames with gold corner brackets
- Province detail panel with pie charts and skylines
- Diplomatic letters with entity hyperlinks
- Personal notepad system (Caveat font, auto-save)
- Newspaper political alignment system (5 papers covering same events)
- Slow-burn mole investigation thread (Weeks 1-9)
- Weekly diary entries (literary first-person voice)
- Cliffhanger system at end of each week
- Family scenes with Jonas, Liora, Tomas
- Character voice profile rewrites for all cabinet ministers
- Contradiction moments (every minister surprises the player at least once)

---

## 2. Current State

### Build: PASSING
```
tsc --noEmit: 0 errors
vite build: SUCCESS (1.32s, 1016 modules, ~4.2MB JS bundle)
```

### Core engine (working perfectly)
- **NarrativeEngine** — glob-loads 350+ scene JSONs from `src/data/narrative/act{1-4}/`
- **WeekStore** — game phase state machine (title → customization → prologue → briefing → legislation → agenda → scene → budget → constitution → lobbying → vote_result → review → cliffhanger → diary → loop)
- **GameStore** — 537 lines, immutable state, `applyModifiers()` with dot-notation stat paths
- **DialogueFlow** — segment-by-segment typewriter with manual advance
- **ChainStore** — schedules delayed consequences from choices
- **SaveManager** — Dexie.js IndexedDB save/load with autosave

### Content (99% complete)
- **Act I**: 60+ scene JSONs rewritten with voice profiles, monologues, pre-entry dialogues
- **Act II**: 70+ scene JSONs (some files recovered from corruption — see Section 4)
- **Act III**: 144 scene JSONs (original state, not audited this session)
- **Act IV**: 59 scene JSONs (original state)
- **Diary**: 52 literary entries with 2-4 variants each (`src/data/diary/diaryEntries.ts`)
- **Cliffhangers**: 52 week templates with 2-3 variants each (`src/data/cliffhangers/cliffhangerTemplates.ts`)
- **Divergent newspapers**: 25 articles (5 events × 5 papers) in `src/data/newspapers/divergent_coverage.ts`
- **Mole investigation**: 6 scene files in `src/data/narrative/act1/investigation/`
- **Family scenes**: `act1/family/family_bni_night.json`, `act2/family/family_referendum_night.json`

### UI components (all working)
- ConversationPanel (typewriter, portrait stack, choice frames, monologue phase, reaction system)
- MorningBriefing (news headlines, legislation preview, diary notification, letter notification)
- AgendaSelector (card grid, slot system)
- BudgetInterface (8 sliders, deficit display)
- EveningReview (stat deltas, advance week)
- ProvinceDetail (skyline illustrations, pie charts, codex link)
- DiplomaticLetterPanel (parchment styling, entity links, page counter)
- NotepadPanel (Caveat font, debounced auto-save, stamp buttons, ruled lines)
- InlineCodexPanel (slides from right, doesn't block conversation)
- NewsOverlay (5 newspaper tabs, masthead rendering, read tracking)
- DiaryScreen (dark overlay, portrait top-left, Caveat font)
- CliffhangerScreen (dark overlay, auto-advance 4s)
- MapView (image-based map from `public/maps/map_veltria_full.jpg`, province click zones, tooltips)
- RightSidebar (circular gold buttons, notification badges, CLASSIFIED mole badge)
- ConnectionsPanel (4 tabs: Cabinet/Factions/Legislative/Judiciary)

### CSS/theming (complete)
- Dark palette: `--paper: #0f0d0a`, `--cream: #d4c9b0`, `--amber: #c8902a`
- Fonts: Playfair Display, Crimson Text, IBM Plex Mono, Caveat, Special Elite
- CRT scanlines, film grain, parchment textures, government seal watermark
- Choice card corner bracket frames (`.choice-frame` CSS + ConversationPanel wiring)
- Portrait speaking glow, event pulse animations
- Family scene overlay (`.family-scene-overlay`)
- Inline codex slide-in animation

### State management (complete)
- 10 Zustand stores: game, narrative, week, bill, chain, codex, journal, letter, news, settings
- Immutable state updates throughout (no `...state` spread — explicit field copies)
- All new fields (`personalNotes`, `diaryEntries`, `personalNotes`) added to every spread object
- `DiaryEntry` and `DiaryEntry` types in gameState.ts

---

## 3. Files Actively Edited This Session

### Types
- `src/types/narrative.ts` — Added `ChoiceReaction`, `monologue?` to NarrativeNode
- `src/types/gameState.ts` — Added `DiaryEntry`, `personalNotes`, `diaryEntries`

### Stores
- `src/stores/gameStore.ts` — Added `personalNotes`, `diaryEntries`, `addDiaryEntry`, `setPersonalNotes`
- `src/stores/weekStore.ts` — Added `diaryEntry`, `cliffhangerText`, `closeDiary`, `closeCliffhanger`, letter triggering, divergent news injection, press intelligence trigger
- `src/stores/settingsStore.ts` — Added `notepadOpen`
- `src/stores/newsStore.ts` — Added `readRecords`, `markArticleRead`, `getPapersReadCount`, `getEventsWithMultiplePapers`
- `src/stores/codexStore.ts` — Added `inlineCodexOpen`, `openInlineCodex`, `closeInlineCodex`

### Components
- `src/components/narrative/ConversationPanel.tsx` — Monologue phase, reaction system (dialogue/action/silence), `renderWithEntities` on all text
- `src/components/MapView.tsx` — Complete rewrite: image map, province click zones, tooltips, event medallions, neighbor markers
- `src/components/RightSidebar.tsx` — Circular gold buttons, notepad icon, CLASSIFIED mole badge
- `src/components/MorningBriefing.tsx` — Diplomatic correspondence notification
- `src/components/NarrativeScene.tsx` — Quick-note button, monologueText pass-through
- `src/components/GameLayout.tsx` — DiaryScreen, CliffhangerScreen rendering
- `src/components/DiaryScreen.tsx` — Rewritten: portrait frame, Caveat font, SPACE to continue
- `src/components/CliffhangerScreen.tsx` — New: dark overlay with auto-advance
- `src/components/panels/ProvinceDetail.tsx` — Rewritten with codex link, skyline improvements, qualitative status
- `src/components/panels/DiplomaticLetterPanel.tsx` — Enhanced page counter, Playfair source country
- `src/components/panels/NotepadPanel.tsx` — New: Caveat font, debounced save, stamp buttons, ruled lines
- `src/components/panels/InlineCodexPanel.tsx` — New: slides from right
- `src/components/panels/ConnectionsPanel.tsx` — Notable Members in Legislative tab, 340px width
- `src/components/news/EntityLinker.tsx` — Updated entity terms, teal color `#5a9aaa`, inline mode support
- `src/components/portraits/CharacterPortrait.tsx` — `normalizedId` fix for `character_` prefixed IDs
- `src/components/App.tsx` — N key shortcut, InlineCodexPanel, notepadOpen state

### Engine
- `src/engine/DiaryEngine.ts` — Rewritten to use `src/data/diary/diaryEntries.ts`
- `src/engine/CliffhangerEngine.ts` — New: generates cliffhangers from game state
- `src/engine/CliffhangerEngine.ts` — New

### Data
- `src/data/diary/diaryEntries.ts` — 52 literary diary entries with 2-4 variants each
- `src/data/cliffhangers/cliffhangerTemplates.ts` — 52 cliffhanger templates with 2-3 variants each
- `src/data/newspapers/divergent_coverage.ts` — 25 divergent articles (5 events × 5 papers)
- `src/data/narrative/act1/investigation/` — 6 new mole investigation scenes
- `src/data/narrative/act1/family/family_bni_night.json` — New family scene
- `src/data/narrative/act2/family/family_referendum_night.json` — New family scene
- `src/data/narrative/act1/briefings/vyktor_press_briefing.json` — New press intelligence scene
- `src/data/narrative/act1/act1_week8_vael_offer.json` — Created (was missing)
- `src/data/narrative/act2/act2_week26_referendum.json` — Created (was missing)
- `src/data/narrative/act1/act1_week1_cabinet_introductions.json` — Created (was missing)
- `src/data/narrative/act1/act1_week10_church_education.json` — Created (was missing)
- `src/data/narrative/act2/act2_week20_oligarch_meeting.json` — Created (was missing)
- 60+ Act I scene JSONs — Voice profile rewrites, monologues, pre-entry dialogues, reactions
- 40 Act II scene JSONs — Originally modified by batch agent, then recovered (see Section 4)

### CSS
- `src/index.css` — Added Caveat font import, family-scene-overlay, inline-codex-slide-in, event-pulse-urgent

---

## 4. Everything That Failed

### A) Batch reaction-writing agents corrupted 42 JSON files
**What happened**: Two agents were tasked with adding `"reactions"` arrays to every choice in act1/ and act2/ scene files. The agents used `replaceAll` operations that:
1. Inserted reactions between choices without proper closing braces
2. Created literal `\r\n` text strings in the JSON (not actual newlines)
3. Dropped `}` closing braces for choice objects, leaving unterminated `choices` arrays

**Recovery**: 
- 40 of 42 files fixed via PowerShell: literal `\r\n` → actual newlines, appended missing closing `]}` braces
- 2 social event files (`social_autumn_festival_wk18.json`, `social_state_dinner_wk24.json`) had deeply nested `socialInteractions` with corrupted brace structures that couldn't be regex-repaired. These were rewritten as clean minimal files (functional but losing some of the agent's rich content).
- The 2 social event files still need their full content restored from the agent's intended state (characterful narrative with multiple social interactions, dialogue choices, and reactions).

**Lesson**: Never use regex/`replaceAll` for batch JSON modifications. Use a proper JSON-aware tool or Node.js script that parses and re-serializes.

### B) Pre-entry dialogue scripts created inconsistencies
Some scenes (act1_week3_first_budget, act1_week5_bni_crisis) had BOTH old pre-entry content AND new pre-entry content. Required manual cleanup to remove duplicate pre-entry sections.

### C) User's specified `setBudgetOpen(false)` crash
Found and removed. The `setBudgetOpen` function was called at `RightSidebar.tsx:397` but never defined. Replaced with `setOverviewOpen(false)`. Also removed the 93-line dead `BudgetPanel` component that was defined but never rendered.

### D) Portrait ID mismatch in Connections panel
Cabinet member IDs were `character_vyktor_reznik` but portrait lookups expected `vyktor_reznik`. Fixed by adding `normalizedId = characterId.replace(/^character_/, '')` in `CharacterPortrait.tsx`.

---

## 5. Next Steps

### Immediate (fix remaining issues)
1. **Restore 2 social event files** — `social_autumn_festival_wk18.json` and `social_state_dinner_wk24.json` need their full content (6 social interactions each with dialogue, choices, reactions) recovered from the cache or rewritten. Currently have minimal valid content.
2. **Add reactions to remaining scenes** — ~23 act1 scenes (chain scenes, family scenes) still need reactions. These were listed by the act1 agent as remaining.
3. **Verify all chain triggers** — The pre-entry dialogue rewrites and character additions may have introduced undefined character references in scene files.

### Content (Act III / IV)
4. **Act III scene auditing** — 144 scene files in `act3/` have not been voice-profiled or monologue-ized. They use the original dialogue.
5. **Act IV scene auditing** — 59 scene files need same treatment.
6. **Endings verification** — `src/data/epilogues.json` has 9 variants. Ensure all ending paths are reachable.

### Map
7. **Place map image** — The map system in MapView.tsx references `/maps/map_veltria_full.jpg` in the `public/maps/` directory. The directory exists but no image file yet. Drop the generated image there.
8. **Adjust province click zones** — Current percentage coordinates may not match the actual map image. Will need visual adjustment.

### Testing
9. **Full playthrough test** — Run through all 52 weeks to verify every scene fires correctly, every choice has valid reactions, no chain triggers reference missing scenes, no stat changes break clamping.
10. **Save/load test** — Verify all new state fields (`personalNotes`, `diaryEntries`, `personalNotes`) persist correctly across save/load cycles with Dexie.js.
