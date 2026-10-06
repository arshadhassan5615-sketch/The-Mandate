# D2-recurring report — Phase B3 STEP 1

Run: node scripts/reply-audit.d2-recurring.mjs (Playwright, sequential, no vitest alongside).
Topics: 15 (8 dinner + 7 briefing). Result: 15 match, 0 mismatch.

- family_dinner_recurring › dinner_military_presence: match
- family_dinner_recurring › dinner_oligarch_rumors: match
- family_dinner_recurring › dinner_union_praise: match
- family_dinner_recurring › dinner_journalist_arrest: match
- family_dinner_recurring › dinner_protest_sounds: match
- family_dinner_recurring › dinner_curfew_discussion: match
- family_dinner_recurring › dinner_marital_tension: match
- family_dinner_recurring › dinner_tomas_trouble: match
- intelligence_briefing_recurring › briefing_mole_progress: match
- intelligence_briefing_recurring › briefing_faction_unrest: match
- intelligence_briefing_recurring › briefing_tyvaren_movement: match
- intelligence_briefing_recurring › briefing_morivask_instability: match
- intelligence_briefing_recurring › briefing_minister_corruption: match
- intelligence_briefing_recurring › briefing_oligarch_activity: match
- intelligence_briefing_recurring › briefing_routine_quiet: match

D1 diff: D1 (pre-fix prediction) re-feeds injected topics after the hub click; the fixed
browser omits them. `d1InjectedShownNow` must be empty for every topic (it is when green).
