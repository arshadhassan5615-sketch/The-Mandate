# Landscape-phone + Suzerain 2.0 parity plan (2026-10-13)

Source: "Suzerain | 2.0 Major Update! | Part 1" (YouTube DdPFTZcRCF4, 58 min), read as
50 keyframes + captions. Measured against The Mandate at 844x390 (iPhone landscape).

## What the video shows (Suzerain reference)

| Area | Suzerain 2.0 | Timestamp |
|---|---|---|
| Title | Map backdrop, menu in a dark panel on the right (New Game, Load, Collections, Options, Credits, Exit), "News" tab on left edge | 00:00 |
| Story select | Country card: flag, government, population, economy, military, start date, blurb, leader portrait, "Torpor Mode" (story mode) toggle, Start Story | 02:58 |
| Prologue | Centred dark column: big year + date + chapter subtitle, prose, numbered colour-coded choices; vertical milestone timeline on the right; silhouette photo backdrops | 05:31-19:32 |
| Customisation | Portrait + bio card left, arrow pickers (hair, facial hair, attire, background, accessories), signature | 20:38 |
| Campaign promises | "Term Focus" carousel with description, Back/Finish | 24:48 |
| HUD | Top-left: crest, hint bulb, GROWTH bar, budget tokens, personal wealth. Right edge: vertical icon rail (News count, Government, People, Codex, Notes). Bottom-left: leader portrait | 27:06+ |
| Dialogue | Centred black column over the live map; coloured speaker names, italic narration, "Continue..." link, collapse chevron; speaker medallions on the column's left edge; teal keywords open Codex side panel | 29:34-55:28 |
| Codex | Right-side panel next to dialogue, category tabs, search, back/forward/home | 31:13 |
| Map | Continental map w/ country medallions + event pins; national map w/ cities; country info card (flag, status, relations, military, population, GDP rank, leader, capital, language, Open Codex Entry); city popup listing meetings + reports | 32:27-43:25 |
| Reports/letters | Paper documents with ministry seal from map pins | 34:03, 38:08 |
| News | Newspaper modal, tab per paper w/ unread counts, distinct mastheads | 39:15, 56:45 |

## Gap analysis (The Mandate today)

Already present: map home, centred dialogue column with portrait medallions, codex
side panel, keyword links, prologue with timeline, customisation, agenda (promises),
tabbed newspapers, reports/letters as documents, settings (text speed, font size,
volumes, high contrast, ironman).

Broken on a landscape phone (844x390) - verified by screenshot:
1. `useIsMobile` is width-only (<768) so landscape phones get the desktop shell.
2. Command bar: 10 labelled tools + 3 stats crammed into 56px; stats overlap.
3. Title menu overflows 390px; tagline collides with Settings.
4. Dialogue column header (week, location, title) eats half the height; ~2 lines of text visible.
5. Leader portrait + footer strip waste height on the map.
6. No orientation handling: no rotate prompt, no manifest, no safe-area (notch) padding.

Missing Suzerain features: foreign-country info card on the map, Story Mode toggle,
Collections screen, Credits, story-start country card.

## Architecture decision

Add a third viewport mode, `compact` = landscape, short screen
(`innerHeight <= 540 && innerWidth > innerHeight`). It uses Suzerain's own
layout, which suits a wide, short screen: thin top-left stat strip + vertical icon rail on
the right + dialogue column centred between. Portrait phones get a "rotate your
device" prompt; the old portrait layout stays as a fallback only.
`pageInsets()` becomes mode-aware so every full-page phase inherits the change.

## Waves

- **Wave 1 (foundation):** WO-1 viewport mode hook + insets; WO-2 orientation (rotate prompt, manifest, safe areas, fullscreen + orientation lock).
- **Wave 2 (shell):** WO-3 compact HUD (stat strip + right rail); WO-4 compact dialogue column; WO-5 title menu (Suzerain right panel); WO-6 map chrome (portrait, footer, chips).
- **Wave 3 (screen sweep):** screenshot every phase at 844x390 / 740x360 / 932x430, one work order per broken screen.
- **Wave 4 (Suzerain features):** foreign-country card, Story Mode, Collections, Credits, story-start card.

Executors: `haiku-executor` agent type run on Sonnet (user asked for high-quality executors).

## Status (2026-10-13): all four waves done

WO-1..WO-13 + WO-11b accepted. tsc clean, vitest 498 passed / 4 skipped, vite build OK,
screenshots verified at 844x390 and 740x360. Open follow-ups: Settings modal is cramped
(scrolls) at 390px tall; pre-existing eslint `set-state-in-effect` errors in
ConversationPanel, MapView, DecreeInbox; real flag art for the four neighbours.
