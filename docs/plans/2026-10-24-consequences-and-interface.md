# Consequences & interface upgrade — plan (2026-10-24)

Manager: Opus. Builders: Haiku 5.5 executors, one work order each, every result
reviewed (diff, checks, and a look in the running game) before acceptance.

## Ground rules (from the project and the player)
- Hidden stats are never shown as numbers. Everything new speaks in words.
- Engine stays content-agnostic: features read scene JSON, they do not hard-code scenes.
- No new full-page interruptions (the player removed the briefing/press pages).
- Visual language: the game's own state-paper panels (`StatePanel`) for documents,
  the dark gunmetal/gold HUD for controls, Playfair / Crimson / IBM Plex Mono.
- Every feature ships with tests; tsc, eslint (touched files) and the full suite pass.

## Data facts that shaped the design
- 539 scenes, 2,678 choices. 129 choices use explicit promise language; only ~9 of
  those flags are ever read again, so "kept/broken" exists only where the story follows up.
- 137 gated choices: 92 gated by flags (story state), 37 by stats, 8 mixed.
- Characters in `data/characters/roster.ts` carry `personalKey` / `factionKey` and
  qualitative relationship labels; stat changes on those keys = "someone will remember".
- No record of chosen choices exists today; saves store stores one by one.

## Features
1. **Choice record** — log of `{sceneId, segmentId, choiceId, week}`; saved. Foundation for 2 and 9.
2. **Commitments ledger** — promises recorded the moment they are given (explicit `commitment`
   field on a choice, or promise language), with who heard them and the week; status
   *Outstanding*, or *Kept* / *Broken* where the story follows up (curated resolution rules).
   A state-paper panel opened from a new HUD button. Saved.
3. **"They will remember"** — after a choice that moves a character's or faction's standing
   noticeably, one quiet line: "Gregor Marić will remember that." No numbers, no direction.
   Settings toggle.
4. **Locked choices with reasons** — stat-gated choices shown greyed with a reason in words
   ("Requires stronger military readiness"); story-gated (flag) choices stay hidden.
5. **Bill stances** — legislation shows the factions for and against, from the bill's effects.
6. **Character cards** — hovering a speaker's name or portrait shows portrait, title, faction
   and relationship in words.
7. **Province mood** — a soft aura under a province seal when it is tense or in crisis
   (calm shows nothing; no chips or labels).
8. **Calendar** — a panel with the 52 weeks in four acts, the current week, and the
   publicly scheduled events.
9. **Scene paths** — for any finished scene, its branch map: the path taken highlighted,
   unexplored branches as sealed boxes.
10. **Week headline** — a non-blocking front-page slip at the start of each week (top story),
    auto-hides, click opens the newspapers.
11. **Reading comforts** — auto-advance and skip for already-read scenes.

## Waves
- Wave 1 (logic, parallel): choice record + save; memory engine; commitments engine + store;
  choice-lock engine; faction names + bill stances.
- Wave 2 (UI, sequenced where files overlap): memory line + setting; commitments recording,
  save and panel; locked choices; bill stances; character cards.
- Wave 3: province mood; calendar; week headline; scene paths; reading comforts.
