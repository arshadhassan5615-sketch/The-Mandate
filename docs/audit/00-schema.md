# Schema digest — scene JSONs (n=522)

## Top-level keys

key | occurrences | value type(s) | example (<=80ch + source)
---|---|---|---
id | 522 | string | src/data/narrative/act1/act1_brenner_defense_briefing.json :: "act1_brenner_defense_briefing"
title | 522 | string | src/data/narrative/act1/act1_brenner_defense_briefing.json :: "The General's Assessment"
location | 522 | string | src/data/narrative/act1/act1_brenner_defense_briefing.json :: "Defense Briefing Room — Ashenmere Palace"
characters | 522 | array | src/data/narrative/act1/act1_brenner_defense_briefing.json :: ["oskar_brenner"]
choices | 522 | array | src/data/narrative/act1/act1_brenner_defense_briefing.json :: [{"id": "brenner_briefing_begin", "text": "\"General. What
weekAvailable | 521 | number(int) | src/data/narrative/act1/act1_brenner_defense_briefing.json :: 2
type | 520 | string | src/data/narrative/act1/act1_brenner_defense_briefing.json :: "meeting"
act | 470 | number(int) | src/data/narrative/act1/act1_chain_bni_press.json :: 1
agendaCost | 468 | number(int) | src/data/narrative/act1/act1_chain_bni_press.json :: 0
isMandatory | 467 | boolean | src/data/narrative/act1/act1_chain_bni_press.json :: true
narrative | 461 | array | src/data/narrative/act1/act1_chain_bni_press.json :: [{"type": "description", "text": "Vyktor is waiting when you arrive
prerequisites | 378 | array | src/data/narrative/act1/act1_chain_bni_press.json :: []
weekDeadline | 247 | number(int) | src/data/narrative/act1/act1_family_jonas_challenge.json :: 8
monologue | 207 | string | src/data/narrative/act1/act1_brenner_defense_briefing.json :: "No aide. No papers. That is either respect for my request
segments | 128 | object | src/data/narrative/act1/act1_brenner_defense_briefing.json :: {"brenner_assessment": {"narrative": [{"type": "dialogue",
dialogue | 61 | array,string | src/data/narrative/act1/act1_brenner_defense_briefing.json :: "General Brenner arrives without an aide. No briefing pape
week | 55 | number(int) | src/data/narrative/act1/act1_brenner_defense_briefing.json :: 2
exclusive | 23 | array | src/data/narrative/act2/act2_week23_family_crisis_jonas.json :: ["act2_week23_family_crisis_liora", "act2_week23_family_
reactions | 5 | array | src/data/narrative/act1/briefings/vyktor_press_briefing.json :: [{"character": "vyktor_reznik", "text": "He makes a mark
socialInteractions | 5 | array | src/data/narrative/act1/family/family_bni_night.json :: [{"id": "family_bni_explain_answer", "title": "Does she tell him
isWeekGate | 5 | boolean | src/data/narrative/act2/act2_week26_referendum.json :: true
gateMessage | 5 | string | src/data/narrative/act2/act2_week26_referendum.json :: "The nation votes today. You cannot look away from this."
prerequisiteFlags | 5 | array | src/data/narrative/act2/pipeline_constitution_committee.json :: ["constitution_pipeline_stage_1_done"]
isFamilyScene | 2 | boolean | src/data/narrative/act1/family/family_bni_night.json :: true
prerequisiteSceneIds | 1 | array | src/data/narrative/act2/act2_week15_theron_compromise.json :: ["act2_week14_convention_opens"]
deadline | 1 | number(int) | src/data/narrative/act4/act4_week40_exile.json :: 44

## Segment-set keys (inside segments.*)

key | occurrences | value type(s) | example
---|---|---|---
toplevel.narrative.type | 2162 | string | src/data/narrative/act1/act1_chain_bni_press.json :: "description"
toplevel.narrative.text | 2162 | string | src/data/narrative/act1/act1_chain_bni_press.json :: "Vyktor is waiting when you arrive at your desk. He has arranged th
segment.narrative.type | 1647 | string | src/data/narrative/act1/act1_brenner_defense_briefing.json#brenner_assessment :: "dialogue"
segment.narrative.text | 1647 | string | src/data/narrative/act1/act1_brenner_defense_briefing.json#brenner_assessment :: "Honest picture. Northern border is ade
segment.narrative.character | 999 | string | src/data/narrative/act1/act1_brenner_defense_briefing.json#brenner_assessment :: "oskar_brenner"
toplevel.narrative.character | 943 | string | src/data/narrative/act1/act1_chain_bni_press.json :: "vyktor_reznik"
choices | 699 | array | src/data/narrative/act1/act1_brenner_defense_briefing.json#brenner_assessment :: [{"id": "brenner_commit_oversight", "te
narrative | 566 | array | src/data/narrative/act1/act1_brenner_defense_briefing.json#brenner_assessment :: [{"type": "dialogue", "character": "osk
segment.dialogue.type | 370 | string | src/data/narrative/act1/act1_week10_church_education.json#theron_explains :: "dialogue"
segment.dialogue.text | 370 | string | src/data/narrative/act1/act1_week10_church_education.json#theron_explains :: "Article 14 of the constitutional reform dr
segment.dialogue.character | 307 | string | src/data/narrative/act1/act1_week10_church_education.json#theron_explains :: "aldric_theron"
monologue | 152 | string | src/data/narrative/act1/act1_brenner_defense_briefing.json#brenner_assessment :: "He said 'certain habits not compatible
dialogue | 133 | array,string | src/data/narrative/act1/act1_week10_church_education.json#theron_explains :: [{"type": "dialogue", "character": "aldric_
segment.narrative.primaryCharacter | 21 | string | src/data/narrative/act1/act1_week2_cabinet_formation_meeting.json#finance_ministry_hub :: "elara_vostane"
toplevel.dialogue.type | 18 | string | src/data/narrative/act2/act2_week14_convention_opens.json :: "narrative"
toplevel.dialogue.text | 18 | string | src/data/narrative/act2/act2_week14_convention_opens.json :: "The Assembly Hall has not been full like this since the in
toplevel.dialogue.character | 10 | string | src/data/narrative/act2/act2_week14_convention_opens.json :: "delegate_kolvar"
segment.narrative.conditions | 6 | array | src/data/narrative/act5/act5_week53_second_address.json#check_outcome :: [{"type": "flag", "flag": "permanent_injury_sus
speaker | 3 | string | src/data/narrative/crisis/crisis_deficit_emergency.json#vostane_numbers :: "elara_vostane"
toplevel.narrative.conditions | 2 | array | src/data/narrative/act6/act6_week69_generals_toast.json :: [{"type": "flag", "flag": "permanent_injury_sustained", "valu
toplevel.narrative.primaryCharacter | 1 | string | src/data/narrative/act1/act1_week2_cabinet_formation_meeting.json :: "vyktor_reznik"
flags | 1 | array | src/data/narrative/act2/act2_week20_oil_negotiation.json#igor_accepts_deal :: ["oil_deal_hybrid_signed", "igor_services_

## Choice keys (top-level + segment choices)

key | occurrences | value type(s) | example
---|---|---|---
id | 2526 | string | src/data/narrative/act1/act1_brenner_defense_briefing.json#brenner_assessment.brenner_commit_oversight :: "brenner_commi
text | 2526 | string | src/data/narrative/act1/act1_brenner_defense_briefing.json#brenner_assessment.brenner_commit_oversight :: "\"Civilian ov
chainTriggers | 2526 | array | src/data/narrative/act1/act1_brenner_defense_briefing.json#brenner_assessment.brenner_commit_oversight :: []
codexUnlocks | 2526 | array | src/data/narrative/act1/act1_brenner_defense_briefing.json#brenner_assessment.brenner_commit_oversight :: []
flags | 2480 | array | src/data/narrative/act1/act1_brenner_defense_briefing.json#brenner_assessment.brenner_commit_oversight :: ["brenner_brie
stateChanges | 1857 | array | src/data/narrative/act1/act1_chain_bni_press.json.top.bni_press_engage :: [{"stat": "personal.publicImage", "operation":
nextSegment | 1374 | null,string | src/data/narrative/act1/act1_brenner_defense_briefing.json#brenner_assessment.brenner_commit_oversight :: null
internalTag | 1365 | string | src/data/narrative/act1/act1_chain_bni_press.json.top.bni_press_engage :: "reformist"
reactions | 1197 | array | src/data/narrative/act1/act1_chain_bni_press.json.top.bni_press_engage :: [{"character": "vyktor_reznik", "type": "dialo
statEffects | 152 | array | src/data/narrative/act1/act1_brenner_defense_briefing.json#brenner_assessment.brenner_commit_oversight :: [{"stat": "fac
conditions | 91 | array | src/data/narrative/act1/act1_week10_tyvaren_intel.json.top.proceed_diplomatic :: [{"stat": "flags.tyvaren_diplomatic_res
tooltip | 90 | string | src/data/narrative/act3/act3_ashenmere_standoff.json.top.standoff_address_soldiers :: "Walk to the line and speak to the
journalEntry | 83 | object | src/data/narrative/act1/act1_shadow_hawk_first_operation.json#hawk_op1_close_expose.hawk_op1_end_expose :: {"title": "Th
prerequisites | 30 | array | src/data/narrative/act2/act2_week31_strike_resolution.json.top.check_morvec_deal :: [{"flag": "morvec_strike_broken", "v
nextNodeId | 16 | string | src/data/narrative/act2/act2_week21_superpower_choice.json.top.visit_arcturian_stellamere :: "act2_week21_visit_stellame

## Condition keys (prerequisites / conditions)

key | occurrences | value type(s) | example
---|---|---|---
choice.conditions.value | 111 | boolean,number(int) | src/data/narrative/act1/act1_week10_tyvaren_intel.json :: {"stat": "flags.tyvaren_diplomatic_response", "operator": "=="
choice.conditions.stat | 86 | string | src/data/narrative/act1/act1_week10_tyvaren_intel.json :: {"stat": "flags.tyvaren_diplomatic_response", "operator": "=="
choice.conditions.operator | 86 | string | src/data/narrative/act1/act1_week10_tyvaren_intel.json :: {"stat": "flags.tyvaren_diplomatic_response", "operator": "=="
choice.prerequisites.value | 37 | boolean,number(int) | src/data/narrative/act2/act2_week31_strike_resolution.json :: {"flag": "morvec_strike_broken", "value": true}
choice.prerequisites.flag | 32 | string | src/data/narrative/act2/act2_week31_strike_resolution.json :: {"flag": "morvec_strike_broken", "value": true}
choice.conditions.type | 25 | string | src/data/narrative/act2/act2_week22_oil_outcome.json :: {"type": "flag", "flag": "oil_deal_hybrid_signed", "value": true
choice.conditions.flag | 25 | string | src/data/narrative/act2/act2_week22_oil_outcome.json :: {"type": "flag", "flag": "oil_deal_hybrid_signed", "value": true
narrative.conditions.type | 8 | string | src/data/narrative/act5/act5_week53_second_address.json#check_outcome :: {"type": "flag", "flag": "permanent_injury_sust
narrative.conditions.flag | 8 | string | src/data/narrative/act5/act5_week53_second_address.json#check_outcome :: {"type": "flag", "flag": "permanent_injury_sust
narrative.conditions.value | 8 | boolean | src/data/narrative/act5/act5_week53_second_address.json#check_outcome :: {"type": "flag", "flag": "permanent_injury_sust
choice.prerequisites.stat | 5 | string | src/data/narrative/act6/act6_week65_border_incident.json :: {"stat": "nation.militaryTech", "operator": ">=", "value": 5
choice.prerequisites.operator | 5 | string | src/data/narrative/act6/act6_week65_border_incident.json :: {"stat": "nation.militaryTech", "operator": ">=", "value": 5
