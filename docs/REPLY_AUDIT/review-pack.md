# REPLY review pack — Phase B3 STEP 3 (raw text, no summaries)

## (a) the three press_outcome variant nodes, verbatim

Source: `src/data/narrative/act2/act2_week27_press_outcome.json` `narrative[1..3]`.

```json
{
 "type": "dialogue",
 "character": "vyktor_reznik",
 "conditions": [
  {
   "type": "flag",
   "flag": "press_followup_specific",
   "value": true
  }
 ],
 "text": "That was either very good or very bad. I am not yet certain which. The implementation committee commitment will require twelve names by Friday — six reformists, three moderates, two Halvekists, and one Iron Covenant. I will have the list by tomorrow. The security clearance review will take three days. The Khaled meeting needs to happen before Thursday or the Workers' Coalition will read it as stalling. You have created work for this office. I do not mind work. I mind work that has a deadline."
}
```

```json
{
 "type": "dialogue",
 "character": "vyktor_reznik",
 "conditions": [
  {
   "type": "flag",
   "flag": "press_followup_deflect",
   "value": true
  }
 ],
 "text": "Well dodged. Nothing promised, nothing scheduled — the office will confirm the committee exists if anyone asks, and otherwise we let the news cycle move on. Sometimes the best follow-up is absence."
}
```

```json
{
 "type": "dialogue",
 "character": "vyktor_reznik",
 "conditions": [
  {
   "type": "flag",
   "flag": "press_followup_combative",
   "value": true
  }
 ],
 "text": "That will cost us. The morning editions will lead with the exchange, not the referendum. I will spend tomorrow smoothing editors instead of staffing any committee. Pick your fights earlier next time — or do not pick them at all."
}
```

## (b) the 7 non-debate routers (per branch: gate, target first-2 nodes, setter scene+week per gate flag, current player view)

### act1_week10_tyvaren_intel › (root) (week 10)
- static co-true pairs (6):
  - proceed_diplomatic [tyvaren_diplomatic_response] & proceed_intercept [tyvaren_intercept_policy] realistic=true blocker=null exampleFlags=[
 "tyvaren_diplomatic_response",
 "tyvaren_intercept_policy"
]
  - proceed_diplomatic [tyvaren_diplomatic_response] & proceed_forward [tyvaren_forward_deployment] realistic=true blocker=null exampleFlags=[
 "tyvaren_diplomatic_response",
 "tyvaren_forward_deployment"
]
  - proceed_intercept [tyvaren_intercept_policy] & proceed_forward [tyvaren_forward_deployment] realistic=false blocker=tyvaren_intercept_policy / tyvaren_forward_deployment are set only by sibling choices of one list exampleFlags=[
 "tyvaren_intercept_policy",
 "tyvaren_forward_deployment"
]
  - proceed_diplomatic [tyvaren_diplomatic_response] & proceed_bilateral [tyvaren_bilateral_talks] realistic=true blocker=null exampleFlags=[
 "tyvaren_diplomatic_response",
 "tyvaren_bilateral_talks"
]
  - proceed_intercept [tyvaren_intercept_policy] & proceed_bilateral [tyvaren_bilateral_talks] realistic=false blocker=tyvaren_intercept_policy / tyvaren_bilateral_talks are set only by sibling choices of one list exampleFlags=[
 "tyvaren_intercept_policy",
 "tyvaren_bilateral_talks"
]
  - proceed_forward [tyvaren_forward_deployment] & proceed_bilateral [tyvaren_bilateral_talks] realistic=false blocker=tyvaren_forward_deployment / tyvaren_bilateral_talks are set only by sibling choices of one list exampleFlags=[
 "tyvaren_forward_deployment",
 "tyvaren_bilateral_talks"
]
- all-false hole: (none)

#### branch `proceed_diplomatic`
- gate: tyvaren_diplomatic_response
  setter(s) of flag `tyvaren_diplomatic_response`:
    - scene `act1_week7_tyvaren_airspace` (week 7) via choice `diplomatic_only`
    - scene `act2_week22_oil_outcome` (week 22) via choice `week22_prepare_diplomatic`
- target: `segment:report_diplomatic`
- target first-2 narrative nodes:
```json
[
 {
  "type": "dialogue",
  "character": "colonel_dusek",
  "text": "You filed the protest. They answered with silence. No formal denial. No apology. No second overflight on the Dravenhollow relay — not yet."
 },
 {
  "type": "dialogue",
  "character": "danika_oberlin",
  "text": "Quiet is not the same as settled. Our embassies report Tyvaren press is calling your response 'proof of Veltrian hesitation.' Their General Staff is using the language of patience. Patience, in Tyvaren, is a preparation word."
 }
]
```
- what the player sees today (branch choice text, verbatim):
> Proceed with the briefing.

#### branch `proceed_intercept`
- gate: tyvaren_intercept_policy
  setter(s) of flag `tyvaren_intercept_policy`:
    - scene `act1_week7_tyvaren_airspace` (week 7) via choice `intercept_policy`
- target: `segment:report_intercept`
- target first-2 narrative nodes:
```json
[
 {
  "type": "dialogue",
  "character": "colonel_dusek",
  "text": "You ordered intercept-and-escort. We have not had a second deep penetration of the relay. We have had two shallow turns — aircraft approaching the line, holding just outside, then turning back. They are measuring our scramble time."
 },
 {
  "type": "dialogue",
  "character": "danika_oberlin",
  "text": "Their foreign ministry still denies the first incident. Their military attaches have been asking, carefully, which bases are on alert rotation. That is not diplomacy. That is inventory."
 }
]
```
- what the player sees today (branch choice text, verbatim):
> Proceed with the briefing.

#### branch `proceed_forward`
- gate: tyvaren_forward_deployment
  setter(s) of flag `tyvaren_forward_deployment`:
    - scene `act1_week7_tyvaren_airspace` (week 7) via choice `forward_deploy`
- target: `segment:report_forward`
- target first-2 narrative nodes:
```json
[
 {
  "type": "dialogue",
  "character": "colonel_dusek",
  "text": "Your forward deployment is complete. Two squadrons at Dravenhollow. Tyvaren's satellites saw it within seventy-two hours — as expected. Their border exercises have intensified, not paused. They are matching visibility with visibility."
 },
 {
  "type": "dialogue",
  "character": "danika_oberlin",
  "text": "Vukov's office issued a note about 'Veltrian militarization of the corridor.' They are rewriting the story. In their version, you moved first. The airspace probe becomes a footnote."
 }
]
```
- what the player sees today (branch choice text, verbatim):
> Proceed with the briefing.

#### branch `proceed_bilateral`
- gate: tyvaren_bilateral_talks
  setter(s) of flag `tyvaren_bilateral_talks`:
    - scene `act1_week7_tyvaren_airspace` (week 7) via choice `request_bilateral`
- target: `segment:report_bilateral`
- target first-2 narrative nodes:
```json
[
 {
  "type": "dialogue",
  "character": "colonel_dusek",
  "text": "You asked for bilateral talks. Tyvaren's foreign ministry has not refused. It has also not accepted. The delay is deliberate — long enough to look like consideration, short enough to keep pressure on."
 },
 {
  "type": "dialogue",
  "character": "danika_oberlin",
  "text": "While they delay, their military attaches are still counting our alert rotations. Diplomacy has not frozen the border. It has only frozen the calendar."
 }
]
```
- what the player sees today (branch choice text, verbatim):
> Proceed with the briefing.

#### branch `proceed_default`
- gate: !tyvaren_diplomatic_response & !tyvaren_intercept_policy & !tyvaren_forward_deployment & !tyvaren_bilateral_talks
  setter(s) of flag `tyvaren_diplomatic_response`:
    - scene `act1_week7_tyvaren_airspace` (week 7) via choice `diplomatic_only`
    - scene `act2_week22_oil_outcome` (week 22) via choice `week22_prepare_diplomatic`
  setter(s) of flag `tyvaren_intercept_policy`:
    - scene `act1_week7_tyvaren_airspace` (week 7) via choice `intercept_policy`
  setter(s) of flag `tyvaren_forward_deployment`:
    - scene `act1_week7_tyvaren_airspace` (week 7) via choice `forward_deploy`
  setter(s) of flag `tyvaren_bilateral_talks`:
    - scene `act1_week7_tyvaren_airspace` (week 7) via choice `request_bilateral`
- target: `segment:report_default`
- target first-2 narrative nodes:
```json
[
 {
  "type": "dialogue",
  "character": "colonel_dusek",
  "text": "We never formalized a response to the airspace probe. Tyvaren has filled the silence for us. Shallow approaches along the line. Increased radio traffic on military bands. No second deep hold over the relay — not yet."
 },
 {
  "type": "dialogue",
  "character": "danika_oberlin",
  "text": "Their press is treating the incident as if it never happened. That is not restraint. That is erasure. When they rewrite the first chapter, they get to write the second."
 }
]
```
- what the player sees today (branch choice text, verbatim):
> Proceed with the briefing.

### act2_week22_oil_outcome › vyktor_reads_telegram (week 22)
- static co-true pairs (1):
  - week22_deal_success_path [oil_deal_hybrid_signed] & week22_deal_failed_path [oil_deal_failed] realistic=true blocker=null exampleFlags=[
 "oil_deal_hybrid_signed",
 "oil_deal_failed"
]
- all-false hole: (none)

#### branch `week22_deal_success_path`
- gate: oil_deal_hybrid_signed
  setter(s) of flag `oil_deal_hybrid_signed`:
    - scene `act2_week20_oil_negotiation` (week 20) via choice `week20_accept_eleven`
    - scene `act2_week20_oil_negotiation` (week 20) via choice `week20_move_to_ten`
    - scene `act2_week20_oil_negotiation` (week 20) via choice `week20_standoff_accept`
- target: `segment:outcome_success`
- target first-2 narrative nodes:
```json
[
 {
  "type": "dialogue",
  "character": "vyktor_reznik",
  "text": "Morivask accepts. They are signing with Veltria. The Foreign Minister countersigned on our behalf at midnight local time. The concession is ours."
 },
 {
  "type": "description",
  "text": "The silence that follows is not empty. It is the silence of something large becoming real."
 }
]
```
- what the player sees today (branch choice text, verbatim):
> [Continue — deal was signed]

#### branch `week22_deal_failed_path`
- gate: oil_deal_failed
  setter(s) of flag `oil_deal_failed`:
    - scene `act2_week20_oil_negotiation` (week 20) via choice `week20_end_failed`
- target: `segment:outcome_failed`
- target first-2 narrative nodes:
```json
[
 {
  "type": "dialogue",
  "character": "vyktor_reznik",
  "text": "Morivask accepted Tyvaren's offer. The signing ceremony was yesterday. Tyvaren State Oil has a forty-year concession on the eastern deposit. Their infrastructure team arrives next month."
 },
 {
  "type": "description",
  "text": "He sets the telegram down. He does not look at you when he says the next part."
 }
]
```
- what the player sees today (branch choice text, verbatim):
> [Continue — deal collapsed]

#### branch `week22_no_deal_path`
- gate: !oil_deal_hybrid_signed & !oil_deal_failed
  setter(s) of flag `oil_deal_hybrid_signed`:
    - scene `act2_week20_oil_negotiation` (week 20) via choice `week20_accept_eleven`
    - scene `act2_week20_oil_negotiation` (week 20) via choice `week20_move_to_ten`
    - scene `act2_week20_oil_negotiation` (week 20) via choice `week20_standoff_accept`
  setter(s) of flag `oil_deal_failed`:
    - scene `act2_week20_oil_negotiation` (week 20) via choice `week20_end_failed`
- target: `(terminal — scene ends, Continue button)`
- target first-2 narrative nodes:
```json
[]
```
- what the player sees today (branch choice text, verbatim):
> [Continue — no oil deal was ever negotiated]

### act2_week31_strike_resolution › (root) (week 31)
- static co-true pairs (3):
  - check_morvec_deal [morvec_strike_broken] & check_maric_deal [maric_sent_kravenstal] realistic=true blocker=null exampleFlags=[
 "morvec_strike_broken",
 "maric_sent_kravenstal"
]
  - check_morvec_deal [morvec_strike_broken] & check_nationalize_threat [nationalization_threatened] realistic=false blocker=morvec_strike_broken / nationalization_threatened are set only by sibling choices of one list exampleFlags=[
 "morvec_strike_broken",
 "nationalization_threatened"
]
  - check_maric_deal [maric_sent_kravenstal] & check_nationalize_threat [nationalization_threatened] realistic=true blocker=null exampleFlags=[
 "maric_sent_kravenstal",
 "nationalization_threatened"
]
- all-false hole: (none)

#### branch `check_morvec_deal`
- gate: morvec_strike_broken
  setter(s) of flag `morvec_strike_broken`:
    - scene `act2_week30_strike_wave_part1` (week 30) via choice `accept_morvec_deal`
- target: `segment:seg_morvec_aftermath`
- target first-2 narrative nodes:
```json
[
 {
  "type": "dialogue",
  "character": "vyktor_reznik",
  "text": "The men went back to work, as Morvec promised. But without the safety regulations, Sarenka Pit suffered a collapse last night. Three men are dead. The Kravenstal Worker is running their photos on the front page."
 },
 {
  "type": "monologue",
  "text": "Three men. Dead because I traded their safety for economic stability. Morvec didn't break the strike; he broke the back of my credibility with the workers. The blood is on my hands, not his."
 }
]
```
- what the player sees today (branch choice text, verbatim):
> (Continue) What is the damage from Morvec's intervention?

#### branch `check_maric_deal`
- gate: maric_sent_kravenstal
  setter(s) of flag `maric_sent_kravenstal`:
    - scene `act1_week3_mine_collapse` (week 3) via choice `w3_send_maric`
    - scene `act2_week30_strike_wave_part1` (week 30) via choice `send_maric_negotiate`
- target: `segment:seg_maric_aftermath`
- target first-2 narrative nodes:
```json
[
 {
  "type": "dialogue",
  "character": "gregor_maric",
  "text": "The workers' council heard me, Chancellor. They agreed to return to work in exchange for a 5% wage increase and a seat at the table for the safety review board. Morvec's foremen tried to intervene, but the men ignored them."
 },
 {
  "type": "dialogue",
  "character": "vyktor_reznik",
  "text": "A victory. The state negotiated directly with the workers and bypassed the oligarch. Morvec is furious, but his grip on Kravenstal is loosened."
 }
]
```
- what the player sees today (branch choice text, verbatim):
> (Continue) Did Marić's negotiation succeed?

#### branch `check_nationalize_threat`
- gate: nationalization_threatened
  setter(s) of flag `nationalization_threatened`:
    - scene `act2_week30_strike_wave_part1` (week 30) via choice `threaten_nationalize`
- target: `segment:seg_nationalize_aftermath`
- target first-2 narrative nodes:
```json
[
 {
  "type": "dialogue",
  "character": "vyktor_reznik",
  "text": "Morvec wasn't bluffing. He has closed the Sevagrad steelworks and the Thornfeld textile mills. Forty thousand people are out of work this morning because we threatened his mines."
 },
 {
  "type": "monologue",
  "text": "I called his bluff, and he raised me. The nationalization threat energized the workers, but the capital strike is burning the economy to the ground. I have to choose: back down and look weak, or push forward and risk a full economic collapse."
 }
]
```
- what the player sees today (branch choice text, verbatim):
> (Continue) Has Morvec made good on his capital strike threat?

#### branch `check_strike_outlasted`
- gate: !morvec_strike_broken & !maric_sent_kravenstal & !nationalization_threatened
  setter(s) of flag `morvec_strike_broken`:
    - scene `act2_week30_strike_wave_part1` (week 30) via choice `accept_morvec_deal`
  setter(s) of flag `maric_sent_kravenstal`:
    - scene `act1_week3_mine_collapse` (week 3) via choice `w3_send_maric`
    - scene `act2_week30_strike_wave_part1` (week 30) via choice `send_maric_negotiate`
  setter(s) of flag `nationalization_threatened`:
    - scene `act2_week30_strike_wave_part1` (week 30) via choice `threaten_nationalize`
- target: `segment:seg_strike_outlasted`
- target first-2 narrative nodes:
```json
[
 {
  "type": "dialogue",
  "character": "vyktor_reznik",
  "text": "Nobody settled it. It starved. Nineteen days. The strike fund ran dry on the fourteenth. The men went back on the fifteenth, in ones and twos. The ones with children first."
 },
 {
  "type": "dialogue",
  "character": "gregor_maric",
  "text": "Same shafts. Same rules. Same foremen. Two of my organisers were not rehired — Halloran and Peto. Morvec's office calls it a staffing review. Everyone at the pithead knows what it is."
 }
]
```
- what the player sees today (branch choice text, verbatim):
> (Continue) How did it end, in the end?

### act3_week37_sovarka_outcome › sovarka_outcome_branch (week 37)
- static co-true pairs (4):
  - sovarka_outcome_full_deal [sovarka_deal_signed] & sovarka_outcome_limited_deal [sovarka_limited_deal] realistic=false blocker=sovarka_deal_signed / sovarka_limited_deal are set only by sibling choices of one list exampleFlags=[
 "sovarka_deal_signed",
 "sovarka_limited_deal"
]
  - sovarka_outcome_lost [sovarka_deferred] & sovarka_outcome_no_data [!sovarka_deal_signed & !sovarka_limited_deal] realistic=true blocker=null exampleFlags=[
 "sovarka_deferred"
]
  - sovarka_outcome_full_deal [sovarka_deal_signed] & sovarka_outcome_lost [sovarka_deferred] realistic=true blocker=null exampleFlags=[
 "sovarka_deal_signed",
 "sovarka_deferred"
]
  - sovarka_outcome_limited_deal [sovarka_limited_deal] & sovarka_outcome_lost [sovarka_deferred] realistic=true blocker=null exampleFlags=[
 "sovarka_limited_deal",
 "sovarka_deferred"
]
- all-false hole: (none)

#### branch `sovarka_outcome_full_deal`
- gate: sovarka_deal_signed
  setter(s) of flag `sovarka_deal_signed`:
    - scene `act2_week33_sovarka_survey` (week 33) via choice `sovarka_full_offer`
- target: `segment:outcome_full_deal`
- target first-2 narrative nodes:
```json
[
 {
  "type": "dialogue",
  "character": "vyktor_reznik",
  "text": "The Sovarka-Veltria Minerals Partnership Agreement was signed Thursday morning, eighteen hours before Tyvaren's ambassador arrived in Luca's office. The ambassador was informed that Sovarka had concluded a preferred partnership with Veltria and was not accepting competing offers for the primary deposits. He filed a formal diplomatic protest the same afternoon. The protest was noted and filed."
 },
 {
  "type": "dialogue",
  "character": "vyktor_reznik",
  "text": "Luca held a press conference in Mirev on Friday. He described the agreement as a partnership between equals — his phrase. The Sovarkan press covered it as a foreign policy victory. Three smaller Thalassic coastal states have made informal inquiries about similar arrangements with Veltria in the past two weeks."
 }
]
```
- what the player sees today (branch choice text, verbatim):
> [Full deal was signed]

#### branch `sovarka_outcome_limited_deal`
- gate: sovarka_limited_deal
  setter(s) of flag `sovarka_limited_deal`:
    - scene `act2_week33_sovarka_survey` (week 33) via choice `sovarka_limited_offer`
- target: `segment:outcome_limited_deal`
- target first-2 narrative nodes:
```json
[
 {
  "type": "dialogue",
  "character": "vyktor_reznik",
  "text": "The Sovarka-Veltria preferred partnership agreement was signed Thursday morning. Luca's cabinet approved it by a margin of seven to two — the two dissenting votes wanted a higher Veltrian capital commitment before signing. Tyvaren's ambassador arrived Friday and presented their offer. Luca informed him that Sovarka had a preferred partnership in place but remained open to non-exclusive secondary arrangements."
 },
 {
  "type": "dialogue",
  "character": "vyktor_reznik",
  "text": "Tyvaren accepted. They signed a secondary minerals agreement with Sovarka covering approximately thirty percent of projected annual output at market rate. Luca is selling to both parties. He told us he would do this — the non-exclusive terms we offered made it possible."
 }
]
```
- what the player sees today (branch choice text, verbatim):
> [Limited deal was signed]

#### branch `sovarka_outcome_lost`
- gate: sovarka_deferred
  setter(s) of flag `sovarka_deferred`:
    - scene `act2_week29_sovarka_approach` (week 29) via choice `sovarka_defer_still`
- target: `segment:outcome_lost`
- target first-2 narrative nodes:
```json
[
 {
  "type": "dialogue",
  "character": "vyktor_reznik",
  "text": "Tyvaren signed with Sovarka on Tuesday. Full exclusive minerals agreement — eighty-eight million kroner in infrastructure and capital commitment over twelve years. The signing ceremony was in Mirev. Luca attended. He looked like a man who had made the best deal available to him and was not entirely comfortable with what it cost."
 },
 {
  "type": "description",
  "text": "He sets the report on the desk."
 }
]
```
- what the player sees today (branch choice text, verbatim):
> [Deal was deferred — Tyvaren moved first]

#### branch `sovarka_outcome_no_data`
- gate: !sovarka_deal_signed & !sovarka_limited_deal
  setter(s) of flag `sovarka_deal_signed`:
    - scene `act2_week33_sovarka_survey` (week 33) via choice `sovarka_full_offer`
  setter(s) of flag `sovarka_limited_deal`:
    - scene `act2_week33_sovarka_survey` (week 33) via choice `sovarka_limited_offer`
- target: `(terminal — scene ends, Continue button)`
- target first-2 narrative nodes:
```json
[]
```
- what the player sees today (branch choice text, verbatim):
> [Continue — the survey never concluded]

### act5_week53_second_address › check_outcome (week 53)
- static co-true pairs (1):
  - path_oligarch_puppet [government_captured] & path_oligarchs_destroyed [oligarchs_destroyed] realistic=true blocker=null exampleFlags=[
 "government_captured",
 "oligarchs_destroyed"
]
- all-false hole: (none)

#### branch `path_oligarch_puppet`
- gate: government_captured
  setter(s) of flag `government_captured`:
    - scene `act3_vael_minister_demand` (week 35) via choice `vael_minister_appoint`
    - scene `act4_week50_two_letters` (week 50) via choice `pay_the_debts`
    - code src\stores\weekStore.ts:1846: if (activeFlags.includes('government_captured')) playerPoll = 85 // Bought election
- target: `segment:seg_puppet_address`
- target first-2 narrative nodes:
```json
[
 {
  "type": "description",
  "text": "In the front row, Stefan Morvec sits with his legs crossed, watching you the way a man watches an investment. Lucan Vael is beside him, whispering to a journalist. They own you. The election was a landslide — bought and paid for. The crowd cheers, but you know the cheers are manufactured."
 },
 {
  "type": "dialogue",
  "character": "vyktor_reznik",
  "text": "The margin was 78%. The highest in Veltrian history. Morvec’s money bought every vote in Kravenstal. Vael’s newspapers buried Kolvar before he could open his mouth. You won, Chancellor. But the cost is written in the front row."
 }
]
```
- what the player sees today (branch choice text, verbatim):
> (Continue)

#### branch `path_oligarchs_destroyed`
- gate: oligarchs_destroyed
  setter(s) of flag `oligarchs_destroyed`:
    - scene `act4_week50_two_letters` (week 50) via choice `use_hawk_files`
- target: `segment:seg_destroyed_address`
- target first-2 narrative nodes:
```json
[
 {
  "type": "description",
  "text": "The front row is conspicuously empty. No Morvec. No Vael. Their empires are in ruins — Morvec facing prosecution for the 1958 contracts, Vael’s media empire dismantled after the kickback scandal. You destroyed them both. The election was close — 52% — but it was yours. Clean. Unbought."
 },
 {
  "type": "dialogue",
  "character": "vyktor_reznik",
  "text": "52%. The narrowest margin in Veltrian history. Kolvar nearly beat you with a grassroots campaign and no money. But you won without owing a single favor to a single oligarch. That is something, Chancellor. The question is whether the Republic can survive without them."
 }
]
```
- what the player sees today (branch choice text, verbatim):
> (Continue)

#### branch `path_clean_win`
- gate: !government_captured & !oligarchs_destroyed
  setter(s) of flag `government_captured`:
    - scene `act3_vael_minister_demand` (week 35) via choice `vael_minister_appoint`
    - scene `act4_week50_two_letters` (week 50) via choice `pay_the_debts`
    - code src\stores\weekStore.ts:1846: if (activeFlags.includes('government_captured')) playerPoll = 85 // Bought election
  setter(s) of flag `oligarchs_destroyed`:
    - scene `act4_week50_two_letters` (week 50) via choice `use_hawk_files`
- target: `segment:seg_clean_address`
- target first-2 narrative nodes:
```json
[
 {
  "type": "description",
  "text": "The front row is a mix of faces — ministers, assembly members, diplomats. No oligarchs pulling strings. No shadow backers. You won the election on the strength of your governance — imperfect, messy, but yours. The margin was 56%. Comfortable enough to govern, narrow enough to stay humble."
 },
 {
  "type": "dialogue",
  "character": "vyktor_reznik",
  "text": "56%. A mandate, not a coronation. Kolvar ran a strong campaign and he will be back. But you won without selling the Republic and without destroying the economy. That is the narrow path, Chancellor. The hardest one to walk."
 }
]
```
- what the player sees today (branch choice text, verbatim):
> (Continue)

### act6_week72_deep_state › check_plan (week 72)
- static co-true pairs (3):
  - path_oligarchs_destroyed [oligarchs_destroyed] & path_puppet_government [government_captured] realistic=true blocker=null exampleFlags=[
 "oligarchs_destroyed",
 "government_captured"
]
  - path_oligarchs_destroyed [oligarchs_destroyed] & path_isolation_coup [oligarch_debts_refused] realistic=true blocker=null exampleFlags=[
 "oligarchs_destroyed",
 "oligarch_debts_refused"
]
  - path_puppet_government [government_captured] & path_isolation_coup [oligarch_debts_refused] realistic=true blocker=null exampleFlags=[
 "government_captured",
 "oligarch_debts_refused"
]
- all-false hole: (none)

#### branch `path_oligarchs_destroyed`
- gate: oligarchs_destroyed
  setter(s) of flag `oligarchs_destroyed`:
    - scene `act4_week50_two_letters` (week 50) via choice `use_hawk_files`
- target: `segment:seg_terror_plot`
- target first-2 narrative nodes:
```json
[
 {
  "type": "dialogue",
  "character": "matthias_krel",
  "text": "When you destroyed Morvec and Vael, you scattered their loyalists. The BNI agents who were on their payroll did not simply retire. They have formed a cell. They are planning to detonate a device at the State Broadcasting House during your next address. A decapitation strike. They want to frame Kolvar's supporters and plunge the Republic into martial law."
 },
 {
  "type": "monologue",
  "text": "I burned the oligarchs to the ground, and now their ashes are trying to choke me. A bomb. In the broadcasting house. They want to kill me, and they want the Republic to tear itself apart in the aftermath. Krel is waiting for the order to move. He doesn't ask for permission often. When he does, it means the knife has to fall now."
 }
]
```
- what the player sees today (branch choice text, verbatim):
> (Continue)

#### branch `path_puppet_government`
- gate: government_captured
  setter(s) of flag `government_captured`:
    - scene `act3_vael_minister_demand` (week 35) via choice `vael_minister_appoint`
    - scene `act4_week50_two_letters` (week 50) via choice `pay_the_debts`
    - code src\stores\weekStore.ts:1846: if (activeFlags.includes('government_captured')) playerPoll = 85 // Bought election
- target: `segment:seg_assassination_plot`
- target first-2 narrative nodes:
```json
[
 {
  "type": "dialogue",
  "character": "matthias_krel",
  "text": "Morvec and Vael are growing impatient with their puppet. They believe you are becoming too independent, too reluctant to sign the privatization decrees they demand. They have selected a replacement—Deputy Chancellor Voronov. They are planning a tragic accident for you. A plane crash, perhaps. Or a sudden illness."
 },
 {
  "type": "monologue",
  "text": "I sold them the Republic, and now they want to repossess the Chancellor. They think I am a liability. Krel has the names of the assassins. But stopping them means going to war with the very men who put me in this chair. If I act, the economy will collapse as their money flees. If I don't, I won't live to see the next election."
 }
]
```
- what the player sees today (branch choice text, verbatim):
> (Continue)

#### branch `path_isolation_coup`
- gate: oligarch_debts_refused
  setter(s) of flag `oligarch_debts_refused`:
    - scene `act4_week50_two_letters` (week 50) via choice `refuse_the_debts`
    - code src\stores\weekStore.ts:1847: if (activeFlags.includes('oligarch_debts_refused')) playerPoll -= 1 // Oligarchs funding Kolvar
- target: `segment:seg_foreign_coup`
- target first-2 narrative nodes:
```json
[
 {
  "type": "dialogue",
  "character": "matthias_krel",
  "conditions": [
   {
    "type": "flag",
    "flag": "brenner_fired_publicly",
    "value": false
   }
  ],
  "text": "Because you refused the oligarchs and walked out of the Stellamere summit, you have made enemies of everyone with money and influence. The Orythian intelligence service has been funding General Brenner's loyalists in the military. They are planning a coup d'état. They will move on the Palace during the Changing of the Guard next week. Brenner will announce a 'government of national salvation.'"
 },
 {
  "type": "monologue",
  "conditions": [
   {
    "type": "flag",
    "flag": "brenner_fired_publicly",
    "value": false
   }
  ],
  "text": "A coup. Brenner and the Orythians. I played the honest statesman, and the jackals have gathered at the door. Krel can disrupt the plot, but if we move against Brenner publicly, half the army might side with him. This has to be done in the dark."
 }
]
```
- what the player sees today (branch choice text, verbatim):
> (Continue)

#### branch `path_remnant_plot`
- gate: !oligarchs_destroyed & !government_captured & !oligarch_debts_refused
  setter(s) of flag `oligarchs_destroyed`:
    - scene `act4_week50_two_letters` (week 50) via choice `use_hawk_files`
  setter(s) of flag `government_captured`:
    - scene `act3_vael_minister_demand` (week 35) via choice `vael_minister_appoint`
    - scene `act4_week50_two_letters` (week 50) via choice `pay_the_debts`
    - code src\stores\weekStore.ts:1846: if (activeFlags.includes('government_captured')) playerPoll = 85 // Bought election
  setter(s) of flag `oligarch_debts_refused`:
    - scene `act4_week50_two_letters` (week 50) via choice `refuse_the_debts`
    - code src\stores\weekStore.ts:1847: if (activeFlags.includes('oligarch_debts_refused')) playerPoll -= 1 // Oligarchs funding Kolvar
- target: `segment:seg_remnant_plot`
- target first-2 narrative nodes:
```json
[
 {
  "type": "dialogue",
  "character": "matthias_krel",
  "text": "Nobody bought you and nobody broke you, so nobody owns the men in these photographs. That is worse. Eleven former BNI officers, one serving colonel of signals, and a ledger that pays them through a Lytheiran shipping account. No patron. They want the old service back, and they have decided you are the obstacle."
 },
 {
  "type": "dialogue",
  "character": "vyktor_reznik",
  "text": "The colonel controls the Palace telephone exchange. Forty-eight hours."
 }
]
```
- what the player sees today (branch choice text, verbatim):
> (Continue)

### act6_week80_black_gold › check_results (week 80)
- static co-true pairs (3):
  - path_full_survey_oil [geological_survey_funded] & path_limited_survey_oil [geological_survey_limited] realistic=true blocker=null exampleFlags=[
 "geological_survey_funded",
 "geological_survey_limited"
]
  - path_full_survey_oil [geological_survey_funded] & path_no_survey [geological_survey_rejected] realistic=true blocker=null exampleFlags=[
 "geological_survey_funded",
 "geological_survey_rejected"
]
  - path_limited_survey_oil [geological_survey_limited] & path_no_survey [geological_survey_rejected] realistic=false blocker=geological_survey_limited / geological_survey_rejected are set only by sibling choices of one list exampleFlags=[
 "geological_survey_limited",
 "geological_survey_rejected"
]
- all-false hole: (none)

#### branch `path_full_survey_oil`
- gate: geological_survey_funded
  setter(s) of flag `geological_survey_funded`:
    - scene `act6_week75_geological_survey` (week 75) via choice `fund_full_survey`
- target: `segment:seg_massive_discovery`
- target first-2 narrative nodes:
```json
[
 {
  "type": "dialogue",
  "character": "orin_valdek",
  "text": "Massive. The largest reserves on the Thalassic coast. The Sevagrad field alone could produce 50 million barrels a year. There are secondary deposits in Dravenhollow—coal, iron, and something the geologists are calling 'europium.' This is a game-changer, Chancellor."
 },
 {
  "type": "dialogue",
  "character": "elara_vostane",
  "text": "The economic implications are staggering. At current market prices, this is ₭ 200 million in potential revenue. But we don't have the infrastructure to extract it. We need foreign capital and technology."
 }
]
```
- what the player sees today (branch choice text, verbatim):
> (Continue)

#### branch `path_limited_survey_oil`
- gate: geological_survey_limited
  setter(s) of flag `geological_survey_limited`:
    - scene `act6_week75_geological_survey` (week 75) via choice `fund_limited_survey`
- target: `segment:seg_moderate_discovery`
- target first-2 narrative nodes:
```json
[
 {
  "type": "dialogue",
  "character": "orin_valdek",
  "text": "We found oil in Sevagrad. Not as massive as I hoped—maybe 15 million barrels a year. And we didn't survey Dravenhollow at all, so there might be more. But what we found is enough to attract attention."
 },
 {
  "type": "dialogue",
  "character": "vyktor_reznik",
  "text": "The Orythians are already calling. Morvec is sniffing around. The find is smaller, but the wolves don't know that. They'll fight over it like it's the biggest prize in the region."
 }
]
```
- what the player sees today (branch choice text, verbatim):
> (Continue)

#### branch `path_no_survey`
- gate: geological_survey_rejected
  setter(s) of flag `geological_survey_rejected`:
    - scene `act6_week75_geological_survey` (week 75) via choice `reject_survey`
- target: `segment:seg_no_discovery`
- target first-2 narrative nodes:
```json
[
 {
  "type": "dialogue",
  "character": "orin_valdek",
  "text": "The Lytheiran coal shipments arrived this morning. Price is up another 8%. I told you we were sitting on wealth, Chancellor. But since we didn't survey, we don't know where it is. We are flying blind."
 },
 {
  "type": "dialogue",
  "character": "vyktor_reznik",
  "text": "The foreign bills are mounting. We are buying coal and iron from Lytheira at a premium when it might be under our own feet. The opportunity cost of caution is written in red ink."
 }
]
```
- what the player sees today (branch choice text, verbatim):
> (Continue)

#### branch `path_no_survey_data`
- gate: !geological_survey_funded & !geological_survey_limited & !geological_survey_rejected
  setter(s) of flag `geological_survey_funded`:
    - scene `act6_week75_geological_survey` (week 75) via choice `fund_full_survey`
  setter(s) of flag `geological_survey_limited`:
    - scene `act6_week75_geological_survey` (week 75) via choice `fund_limited_survey`
  setter(s) of flag `geological_survey_rejected`:
    - scene `act6_week75_geological_survey` (week 75) via choice `reject_survey`
- target: `segment:seg_prospector_tip`
- target first-2 narrative nodes:
```json
[
 {
  "type": "description",
  "text": "There was never a state survey. The item never made the agenda, and the ground kept its secret. The news arrives anyway: a private prospector, drilling a speculative hole in the Sevagrad foothills, has struck crude — and run straight to the Ministry to sell what he found. Valdek brings the sample to your desk with a face like a storm."
 },
 {
  "type": "dialogue",
  "character": "orin_valdek",
  "text": "Chancellor. A prospector named Halvar Sorensen found oil in Sevagrad. A serious strike. And here is the problem: he has filed his claim. Under the old Halvek-era mining law, his company holds the extraction rights — and three foreign consortia have already made him offers. We own nothing. We surveyed nothing. We would be negotiating from nothing."
 }
]
```
- what the player sees today (branch choice text, verbatim):
> (Continue)

## (c) the 19 opposite-signed shared-target pairs (scene, both choice texts, shared-target first-2 nodes, each choice flags + stateChange signs)

### act1_week2_cabinet_appointments (week 2) list `pick_finance` → `segment:pick_interior`
- opposite-signed stats: nation.corruption
- choice A `pick_finance_vostane` text (verbatim):
> Appoint Elara Vostane. I want an economist who tells me the truth, not what I want to hear.
- choice A flags: [
 "minister_finance_vostane"
]
- choice A stateChanges (verbatim):
```json
[
 {
  "stat": "factions.businessClass",
  "operation": "add",
  "value": 5
 },
 {
  "stat": "factions.workersCoalition",
  "operation": "add",
  "value": -3
 },
 {
  "stat": "nation.economyHealth",
  "operation": "add",
  "value": 3
 },
 {
  "stat": "nation.corruption",
  "operation": "add",
  "value": -3
 }
]
```
- choice A signs: factions.businessClass: +; factions.workersCoalition: -; nation.economyHealth: +; nation.corruption: -
- choice B `pick_finance_kolvar` text (verbatim):
> Appoint Petr Kolvar. He knows the Assembly and he knows how to get things done.
- choice B flags: [
 "minister_finance_kolvar"
]
- choice B stateChanges (verbatim):
```json
[
 {
  "stat": "factions.halvekists",
  "operation": "add",
  "value": 5
 },
 {
  "stat": "factions.reformists",
  "operation": "add",
  "value": -5
 },
 {
  "stat": "nation.corruption",
  "operation": "add",
  "value": 3
 },
 {
  "stat": "personal.publicImage",
  "operation": "add",
  "value": -3
 }
]
```
- choice B signs: factions.halvekists: +; factions.reformists: -; nation.corruption: +; personal.publicImage: -
- shared-target first-2 narrative nodes:
```json
[
 {
  "type": "narrative",
  "text": "Vyktor makes a note and moves to the next folder. Interior. The ministry that controls the BNI — or dismantles it. This choice will echo through every province in the Republic."
 },
 {
  "type": "dialogue",
  "character": "vyktor_reznik",
  "text": "Danika Oberlin — civil rights advocate. Fifteen years documenting BNI abuses. She will push for dissolution on day one. She's relentless. She's principled. She'll make enemies you can't afford to have. General Perov — military intelligence. He'd keep the apparatus but restructure it. Civilian oversight, strict limits. He believes the BNI should exist. He just thinks Halvek used it wrong."
 }
]
```

### act1_week2_cabinet_appointments (week 2) list `pick_interior` → `segment:pick_labor`
- opposite-signed stats: factions.reformists, nation.civilLiberties
- choice A `pick_interior_oberlin` text (verbatim):
> Appoint Danika Oberlin. The BNI must be dismantled, and I want someone who won't flinch.
- choice A flags: [
 "minister_interior_oberlin"
]
- choice A stateChanges (verbatim):
```json
[
 {
  "stat": "factions.reformists",
  "operation": "add",
  "value": 7
 },
 {
  "stat": "factions.halvekists",
  "operation": "add",
  "value": -8
 },
 {
  "stat": "nation.civilLiberties",
  "operation": "add",
  "value": 5
 },
 {
  "stat": "nation.pressFreedom",
  "operation": "add",
  "value": 3
 }
]
```
- choice A signs: factions.reformists: +; factions.halvekists: -; nation.civilLiberties: +; nation.pressFreedom: +
- choice B `pick_interior_perov` text (verbatim):
> Appoint General Perov. Restructure the BNI — don't burn it down.
- choice B flags: [
 "minister_interior_perov"
]
- choice B stateChanges (verbatim):
```json
[
 {
  "stat": "factions.ironCovenant",
  "operation": "add",
  "value": 5
 },
 {
  "stat": "factions.reformists",
  "operation": "add",
  "value": -4
 },
 {
  "stat": "nation.militaryReadiness",
  "operation": "add",
  "value": 2
 },
 {
  "stat": "nation.civilLiberties",
  "operation": "add",
  "value": -3
 }
]
```
- choice B signs: factions.ironCovenant: +; factions.reformists: -; nation.militaryReadiness: +; nation.civilLiberties: -
- shared-target first-2 narrative nodes:
```json
[
 {
  "type": "narrative",
  "text": "Vyktor turns to the Labor folder. The unions are watching. The factories are watching. Half the Republic's workforce has an opinion on this appointment and they are not shy about expressing it."
 },
 {
  "type": "dialogue",
  "character": "vyktor_reznik",
  "text": "Gregor Marić is the union choice — has been for a decade. He will push for higher wages, stronger protections, shorter hours. He will fight you when you need him to fight the factory owners instead. Tomas Vane takes a different approach. He negotiated the last three industry-wide contracts from the management side. The unions will hate him. The factories won't strike. Choose your poison."
 }
]
```

### act1_week2_cabinet_appointments (week 2) list `pick_labor` → `segment:pick_justice`
- opposite-signed stats: factions.workersCoalition, factions.businessClass, nation.economyHealth
- choice A `pick_labor_maric` text (verbatim):
> Appoint Gregor Marić. The workers deserve a voice at the table — a loud one.
- choice A flags: [
 "minister_labor_maric"
]
- choice A stateChanges (verbatim):
```json
[
 {
  "stat": "factions.workersCoalition",
  "operation": "add",
  "value": 8
 },
 {
  "stat": "factions.businessClass",
  "operation": "add",
  "value": -6
 },
 {
  "stat": "nation.unemployment",
  "operation": "add",
  "value": -2
 },
 {
  "stat": "nation.economyHealth",
  "operation": "add",
  "value": -2
 }
]
```
- choice A signs: factions.workersCoalition: +; factions.businessClass: -; nation.unemployment: -; nation.economyHealth: -
- choice B `pick_labor_vane` text (verbatim):
> Appoint Tomas Vane. I need someone who can negotiate, not agitate.
- choice B flags: [
 "minister_labor_vane"
]
- choice B stateChanges (verbatim):
```json
[
 {
  "stat": "factions.businessClass",
  "operation": "add",
  "value": 6
 },
 {
  "stat": "factions.workersCoalition",
  "operation": "add",
  "value": -7
 },
 {
  "stat": "nation.corruption",
  "operation": "add",
  "value": 2
 },
 {
  "stat": "nation.economyHealth",
  "operation": "add",
  "value": 3
 }
]
```
- choice B signs: factions.businessClass: +; factions.workersCoalition: -; nation.corruption: +; nation.economyHealth: +
- shared-target first-2 narrative nodes:
```json
[
 {
  "type": "narrative",
  "text": "Justice is the quiet ministry. It does not command armies or collect taxes. But whoever holds this portfolio will oversee the courts that interpret your constitutional reforms — or block them."
 },
 {
  "type": "dialogue",
  "character": "vyktor_reznik",
  "text": "Professor Aldric Theron — legal scholar, constitutional expert. The man who drafted the reform framework. He believes the law should serve the people, not the other way around. Heron Garachi — twenty years on the High Court. He knows every judge in the country by name. He believes the law IS the system and the system works if you respect it. He will not appreciate reforms that move too fast."
 }
]
```

### act1_week2_cabinet_appointments (week 2) list `pick_justice` → `segment:pick_defense`
- opposite-signed stats: factions.reformists, factions.halvekists, nation.civilLiberties, nation.corruption
- choice A `pick_justice_theron` text (verbatim):
> Appoint Prof. Aldric Theron. The constitutional reforms need a true believer at Justice.
- choice A flags: [
 "minister_justice_theron"
]
- choice A stateChanges (verbatim):
```json
[
 {
  "stat": "factions.reformists",
  "operation": "add",
  "value": 7
 },
 {
  "stat": "factions.halvekists",
  "operation": "add",
  "value": -6
 },
 {
  "stat": "nation.civilLiberties",
  "operation": "add",
  "value": 4
 },
 {
  "stat": "nation.corruption",
  "operation": "add",
  "value": -3
 }
]
```
- choice A signs: factions.reformists: +; factions.halvekists: -; nation.civilLiberties: +; nation.corruption: -
- choice B `pick_justice_garachi` text (verbatim):
> Appoint Heron Garachi. The courts must be stable while we reform — not in chaos.
- choice B flags: [
 "minister_justice_garachi"
]
- choice B stateChanges (verbatim):
```json
[
 {
  "stat": "factions.halvekists",
  "operation": "add",
  "value": 6
 },
 {
  "stat": "factions.reformists",
  "operation": "add",
  "value": -5
 },
 {
  "stat": "nation.corruption",
  "operation": "add",
  "value": 3
 },
 {
  "stat": "nation.civilLiberties",
  "operation": "add",
  "value": -2
 }
]
```
- choice B signs: factions.halvekists: +; factions.reformists: -; nation.corruption: +; nation.civilLiberties: -
- shared-target first-2 narrative nodes:
```json
[
 {
  "type": "narrative",
  "text": "The last folder. Defense. The Iron Covenant has made their preferences known — loudly, publicly, and with barely veiled threats. This appointment will be read as a measure of your relationship with the military."
 },
 {
  "type": "dialogue",
  "character": "vyktor_reznik",
  "text": "Colonel Irina Dusek. Decorated. Respected by the rank and file. No political ambitions — she finds politics distasteful. The Tyvaren border is her obsession and she's been right about it for years. General Oskar Brenner — Iron Covenant leadership. He commands loyalty from the officer corps. He will demand a larger military budget, a harder line on Tyvaren, and a seat at every decision table. He will be difficult. He will also keep the Covenant from doing something worse than being difficult."
 }
]
```

### act1_week2_cabinet_appointments (week 2) list `pick_defense` → `segment:cabinet_handpick_aftermath`
- opposite-signed stats: factions.ironCovenant, nation.internationalStanding
- choice A `pick_defense_dusek` text (verbatim):
> Appoint Col. Irina Dusek. I want a professional soldier, not a political general.
- choice A flags: [
 "minister_defense_dusek"
]
- choice A stateChanges (verbatim):
```json
[
 {
  "stat": "factions.ironCovenant",
  "operation": "add",
  "value": -5
 },
 {
  "stat": "nation.militaryReadiness",
  "operation": "add",
  "value": 4
 },
 {
  "stat": "nation.internationalStanding",
  "operation": "add",
  "value": 3
 },
 {
  "stat": "nation.corruption",
  "operation": "add",
  "value": -2
 }
]
```
- choice A signs: factions.ironCovenant: -; nation.militaryReadiness: +; nation.internationalStanding: +; nation.corruption: -
- choice B `pick_defense_brenner` text (verbatim):
> Appoint Gen. Oskar Brenner. Keep the Iron Covenant inside the tent.
- choice B flags: [
 "minister_defense_brenner"
]
- choice B stateChanges (verbatim):
```json
[
 {
  "stat": "factions.ironCovenant",
  "operation": "add",
  "value": 8
 },
 {
  "stat": "factions.reformists",
  "operation": "add",
  "value": -5
 },
 {
  "stat": "nation.internationalStanding",
  "operation": "add",
  "value": -4
 },
 {
  "stat": "nation.militaryReadiness",
  "operation": "add",
  "value": 5
 }
]
```
- choice B signs: factions.ironCovenant: +; factions.reformists: -; nation.internationalStanding: -; nation.militaryReadiness: +
- shared-target first-2 narrative nodes:
```json
[
 {
  "type": "narrative",
  "text": "Vyktor closes the ledger. Five names written in ink — no more pencil. He reviews the list in silence, then looks up at you with an expression that is not quite approval and not quite concern."
 },
 {
  "type": "dialogue",
  "character": "vyktor_reznik",
  "text": "A bespoke cabinet, Chancellor. Chosen minister by minister. No one can say you didn't think about each choice. The question is whether they can work together — and whether they can work with you."
 }
]
```

### act1_w2_formation_meeting (week 2) list `kolvar_halvek_answer` → `segment:finance_confrontation`
- opposite-signed stats: personal.moralCompass
- choice A `kolvar_halvek_accept` text (verbatim):
> I appreciate the honesty. Let's bring Vostane back in for a direct debate.
- choice A flags: [
 "form_meeting_accepted_kolvar_confession"
]
- choice A stateChanges (verbatim):
```json
[
 {
  "stat": "personal.moralCompass",
  "operation": "add",
  "value": -1
 }
]
```
- choice A signs: personal.moralCompass: -
- choice B `kolvar_halvek_reject` text (verbatim):
> You looked away. I can't put someone who looked away at my Finance Ministry.
- choice B flags: [
 "form_meeting_rejected_kolvar"
]
- choice B stateChanges (verbatim):
```json
[
 {
  "stat": "personal.moralCompass",
  "operation": "add",
  "value": 3
 }
]
```
- choice B signs: personal.moralCompass: +
- shared-target first-2 narrative nodes:
```json
[
 {
  "type": "description",
  "text": "Vyktor gestures. Vostane re-enters. She takes the chair opposite Kolvar. The two of them regard each other like chess players who have played this game before and know exactly how it ends."
 },
 {
  "type": "dialogue",
  "character": "elara_vostane",
  "text": "You told her you can deliver forty-nine votes. You did not mention that twenty of those votes come from members who expect something in return. Road contracts. Regulatory exemptions. The same system of favors that created the deficit you claim to want to fix."
 }
]
```

### act1_w2_formation_meeting (week 2) list `interior_confrontation` → `segment:defense_ministry_hub`
- opposite-signed stats: factions.reformists, factions.ironCovenant
- choice A `interior_support_oberlin` text (verbatim):
> Oberlin is right. The BNI cannot be reformed — it must be dismantled.
- choice A flags: [
 "form_meeting_sided_oberlin_interior"
]
- choice A stateChanges (verbatim):
```json
[
 {
  "stat": "factions.reformists",
  "operation": "add",
  "value": 5
 },
 {
  "stat": "factions.ironCovenant",
  "operation": "add",
  "value": -4
 }
]
```
- choice A signs: factions.reformists: +; factions.ironCovenant: -
- choice B `interior_support_perov` text (verbatim):
> Perov is right. Dissolving the BNI creates a vacuum. Reform it instead.
- choice B flags: [
 "form_meeting_sided_perov_interior"
]
- choice B stateChanges (verbatim):
```json
[
 {
  "stat": "factions.ironCovenant",
  "operation": "add",
  "value": 4
 },
 {
  "stat": "factions.reformists",
  "operation": "add",
  "value": -3
 }
]
```
- choice B signs: factions.ironCovenant: +; factions.reformists: -
- shared-target first-2 narrative nodes:
```json
[
 {
  "type": "description",
  "text": "Colonel Irina Dusek enters. No introduction needed. She is in uniform — not dress uniform, working uniform, the kind that has seen field duty. She places a single folder on the table. It is thin. Dusek does not waste paper.",
  "primaryCharacter": "irina_dusek"
 },
 {
  "type": "dialogue",
  "character": "irina_dusek",
  "text": "Chancellor. I will be brief. The Tyvaren border is not stable. It is not stable in a way that suggests instability is deliberate. Someone on the other side is testing our response times, our readiness, our willingness to escalate."
 }
]
```

### act1_w2_formation_meeting (week 2) list `defense_choice` → `segment:transition_to_appointments`
- opposite-signed stats: factions.ironCovenant, nation.internationalStanding
- choice A `appoint_dusek` text (verbatim):
> Dusek. Intelligence over presence. We read the border before we show it our teeth.
- choice A flags: [
 "defense_minister_dusek",
 "cabinet_formation_meeting_complete"
]
- choice A stateChanges (verbatim):
```json
[
 {
  "stat": "factions.ironCovenant",
  "operation": "add",
  "value": -3
 },
 {
  "stat": "nation.internationalStanding",
  "operation": "add",
  "value": 3
 }
]
```
- choice A signs: factions.ironCovenant: -; nation.internationalStanding: +
- choice B `appoint_vass` text (verbatim):
> Vass. Presence over intelligence. Let Tyvaren see us before they hear us.
- choice B flags: [
 "defense_minister_vass",
 "cabinet_formation_meeting_complete"
]
- choice B stateChanges (verbatim):
```json
[
 {
  "stat": "factions.ironCovenant",
  "operation": "add",
  "value": 6
 },
 {
  "stat": "tyvarenHostility",
  "operation": "add",
  "value": 4
 },
 {
  "stat": "nation.internationalStanding",
  "operation": "add",
  "value": -2
 }
]
```
- choice B signs: factions.ironCovenant: +; tyvarenHostility: +; nation.internationalStanding: -
- shared-target first-2 narrative nodes:
```json
[
 {
  "type": "description",
  "text": "Vyktor stands. He straightens his ledger and walks to the cabinet room door. Beyond it, you can hear the candidates — still debating, still arguing, still trying to convince each other of things you have already decided."
 },
 {
  "type": "dialogue",
  "character": "vyktor_reznik",
  "text": "I will begin the formal appointment process. By the time you walk into the chamber, the paperwork will be ready. All that remains is your signature on each portfolio."
 }
]
```

### act2_week27_press_conference (week 27) list `(root)` → `node:act2_week27_press_economy`
- opposite-signed stats: personal.publicImage
- choice A `press_q1_confident` text (verbatim):
> "The margin is what democracy looks like when it works. A majority voted for reform. The rest wanted something different. Both numbers are real. Both are Veltrians. The constitution passed because more people wanted it than didn't — and I will govern for all of them, including the ones who voted no. That is not a warning, Ms. Voss. That is a republic functioning as designed."
- choice A flags: [
 "press_conference_confident"
]
- choice A stateChanges (verbatim):
```json
[
 {
  "stat": "factions.reformists",
  "operation": "add",
  "value": 8
 },
 {
  "stat": "nation.pressFreedom",
  "operation": "add",
  "value": 2
 },
 {
  "stat": "personal.publicImage",
  "operation": "add",
  "value": 5
 }
]
```
- choice A signs: factions.reformists: +; nation.pressFreedom: +; personal.publicImage: +
- choice B `press_q1_deflect` text (verbatim):
> "What the referendum means is that Veltria now has a constitutional framework for the first time in its history. The question is not what the margin means — the question is what we do with the document the people approved. I am focused on implementation, not on parsing the political significance of a vote that has already been counted."
- choice B flags: [
 "press_conference_evasive"
]
- choice B stateChanges (verbatim):
```json
[
 {
  "stat": "nation.mediaControl",
  "operation": "add",
  "value": 3
 },
 {
  "stat": "personal.publicImage",
  "operation": "add",
  "value": -2
 }
]
```
- choice B signs: nation.mediaControl: +; personal.publicImage: -
- shared-target first-2 narrative nodes:
```json
[
 {
  "type": "description",
  "text": "A reporter from the Kravenstal Worker stands — a heavyset man with ink-stained fingers and the particular directness of a regional journalist who has traveled four hours for this and intends to make the trip worthwhile."
 },
 {
  "type": "dialogue",
  "character": "nadia_voss",
  "text": "Chancellor, the economic picture heading into Act Three is mixed at best. Unemployment remains above fifteen percent. The IMA conditions are still in effect. The Krone has stabilized but has not recovered. Business confidence is fragile. What is your economic plan for the next twelve months, and can you guarantee that the constitutional reforms will not come at the cost of the economic stability your government has fought to achieve?"
 }
]
```

### act2_week27_press_conference (week 27) list `(root)` → `node:act2_week27_press_economy`
- opposite-signed stats: factions.reformists, nation.pressFreedom, personal.publicImage
- choice A `press_q1_confident` text (verbatim):
> "The margin is what democracy looks like when it works. A majority voted for reform. The rest wanted something different. Both numbers are real. Both are Veltrians. The constitution passed because more people wanted it than didn't — and I will govern for all of them, including the ones who voted no. That is not a warning, Ms. Voss. That is a republic functioning as designed."
- choice A flags: [
 "press_conference_confident"
]
- choice A stateChanges (verbatim):
```json
[
 {
  "stat": "factions.reformists",
  "operation": "add",
  "value": 8
 },
 {
  "stat": "nation.pressFreedom",
  "operation": "add",
  "value": 2
 },
 {
  "stat": "personal.publicImage",
  "operation": "add",
  "value": 5
 }
]
```
- choice A signs: factions.reformists: +; nation.pressFreedom: +; personal.publicImage: +
- choice B `press_q1_hostile` text (verbatim):
> "Ms. Voss, the margin is a majority. In a democracy, that is what counts. I notice you did not ask Kolvar what his margin was when the Halvekists won elections with sixty percent of eligible voters staying home. The referendum was free, it was fair, and it passed. If you are looking for a story about division, I suggest you look at those who voted against — and ask them why they are not the ones you are questioning."
- choice B flags: [
 "press_conference_hostile"
]
- choice B stateChanges (verbatim):
```json
[
 {
  "stat": "nation.pressFreedom",
  "operation": "add",
  "value": -4
 },
 {
  "stat": "factions.reformists",
  "operation": "add",
  "value": -3
 },
 {
  "stat": "personal.publicImage",
  "operation": "add",
  "value": -3
 }
]
```
- choice B signs: nation.pressFreedom: -; factions.reformists: -; personal.publicImage: -
- shared-target first-2 narrative nodes:
```json
[
 {
  "type": "description",
  "text": "A reporter from the Kravenstal Worker stands — a heavyset man with ink-stained fingers and the particular directness of a regional journalist who has traveled four hours for this and intends to make the trip worthwhile."
 },
 {
  "type": "dialogue",
  "character": "nadia_voss",
  "text": "Chancellor, the economic picture heading into Act Three is mixed at best. Unemployment remains above fifteen percent. The IMA conditions are still in effect. The Krone has stabilized but has not recovered. Business confidence is fragile. What is your economic plan for the next twelve months, and can you guarantee that the constitutional reforms will not come at the cost of the economic stability your government has fought to achieve?"
 }
]
```

### act2_week27_press_conference (week 27) list `(root)` → `node:act2_week27_press_economy`
- opposite-signed stats: personal.publicImage
- choice A `press_q1_cautious` text (verbatim):
> "I know the margin leaves many unconvinced. Many Veltrians looked at the constitution I spent twenty-six weeks negotiating and said no. I hear them. The constitution is the law now — the vote was clear on that — but governing does not end at a majority. I will spend the next year demonstrating that this document works for the people who doubted it, not just the people who supported it."
- choice A flags: [
 "press_conference_cautious"
]
- choice A stateChanges (verbatim):
```json
[
 {
  "stat": "personal.publicImage",
  "operation": "add",
  "value": 5
 },
 {
  "stat": "factions.reformists",
  "operation": "add",
  "value": 2
 },
 {
  "stat": "factions.halvekists",
  "operation": "add",
  "value": 3
 }
]
```
- choice A signs: personal.publicImage: +; factions.reformists: +; factions.halvekists: +
- choice B `press_q1_deflect` text (verbatim):
> "What the referendum means is that Veltria now has a constitutional framework for the first time in its history. The question is not what the margin means — the question is what we do with the document the people approved. I am focused on implementation, not on parsing the political significance of a vote that has already been counted."
- choice B flags: [
 "press_conference_evasive"
]
- choice B stateChanges (verbatim):
```json
[
 {
  "stat": "nation.mediaControl",
  "operation": "add",
  "value": 3
 },
 {
  "stat": "personal.publicImage",
  "operation": "add",
  "value": -2
 }
]
```
- choice B signs: nation.mediaControl: +; personal.publicImage: -
- shared-target first-2 narrative nodes:
```json
[
 {
  "type": "description",
  "text": "A reporter from the Kravenstal Worker stands — a heavyset man with ink-stained fingers and the particular directness of a regional journalist who has traveled four hours for this and intends to make the trip worthwhile."
 },
 {
  "type": "dialogue",
  "character": "nadia_voss",
  "text": "Chancellor, the economic picture heading into Act Three is mixed at best. Unemployment remains above fifteen percent. The IMA conditions are still in effect. The Krone has stabilized but has not recovered. Business confidence is fragile. What is your economic plan for the next twelve months, and can you guarantee that the constitutional reforms will not come at the cost of the economic stability your government has fought to achieve?"
 }
]
```

### act2_week27_press_conference (week 27) list `(root)` → `node:act2_week27_press_economy`
- opposite-signed stats: personal.publicImage, factions.reformists
- choice A `press_q1_cautious` text (verbatim):
> "I know the margin leaves many unconvinced. Many Veltrians looked at the constitution I spent twenty-six weeks negotiating and said no. I hear them. The constitution is the law now — the vote was clear on that — but governing does not end at a majority. I will spend the next year demonstrating that this document works for the people who doubted it, not just the people who supported it."
- choice A flags: [
 "press_conference_cautious"
]
- choice A stateChanges (verbatim):
```json
[
 {
  "stat": "personal.publicImage",
  "operation": "add",
  "value": 5
 },
 {
  "stat": "factions.reformists",
  "operation": "add",
  "value": 2
 },
 {
  "stat": "factions.halvekists",
  "operation": "add",
  "value": 3
 }
]
```
- choice A signs: personal.publicImage: +; factions.reformists: +; factions.halvekists: +
- choice B `press_q1_hostile` text (verbatim):
> "Ms. Voss, the margin is a majority. In a democracy, that is what counts. I notice you did not ask Kolvar what his margin was when the Halvekists won elections with sixty percent of eligible voters staying home. The referendum was free, it was fair, and it passed. If you are looking for a story about division, I suggest you look at those who voted against — and ask them why they are not the ones you are questioning."
- choice B flags: [
 "press_conference_hostile"
]
- choice B stateChanges (verbatim):
```json
[
 {
  "stat": "nation.pressFreedom",
  "operation": "add",
  "value": -4
 },
 {
  "stat": "factions.reformists",
  "operation": "add",
  "value": -3
 },
 {
  "stat": "personal.publicImage",
  "operation": "add",
  "value": -3
 }
]
```
- choice B signs: nation.pressFreedom: -; factions.reformists: -; personal.publicImage: -
- shared-target first-2 narrative nodes:
```json
[
 {
  "type": "description",
  "text": "A reporter from the Kravenstal Worker stands — a heavyset man with ink-stained fingers and the particular directness of a regional journalist who has traveled four hours for this and intends to make the trip worthwhile."
 },
 {
  "type": "dialogue",
  "character": "nadia_voss",
  "text": "Chancellor, the economic picture heading into Act Three is mixed at best. Unemployment remains above fifteen percent. The IMA conditions are still in effect. The Krone has stabilized but has not recovered. Business confidence is fragile. What is your economic plan for the next twelve months, and can you guarantee that the constitutional reforms will not come at the cost of the economic stability your government has fought to achieve?"
 }
]
```

### act2_week27_press_economy (week 27) list `(root)` → `node:act2_week27_press_followup`
- opposite-signed stats: personal.publicImage
- choice A `press_q2_engage` text (verbatim):
> "The economic plan is threefold. First: complete the IMA program on schedule — we are on track for quarter-three compliance. Second: the infrastructure investment fund begins disbursements next month, targeting Kravenstal and the northern provinces. Third: I am meeting with the business consortium next week to discuss the private investment framework. I cannot guarantee outcomes — no responsible leader can. What I can guarantee is that every economic decision this government makes will be transparent, documented, and subject to parliamentary review. That is new. That is what the constitution gives us."
- choice A flags: [
 "press_economy_engaged"
]
- choice A stateChanges (verbatim):
```json
[
 {
  "stat": "factions.reformists",
  "operation": "add",
  "value": 4
 },
 {
  "stat": "factions.businessClass",
  "operation": "add",
  "value": 3
 },
 {
  "stat": "personal.publicImage",
  "operation": "add",
  "value": 3
 }
]
```
- choice A signs: factions.reformists: +; factions.businessClass: +; personal.publicImage: +
- choice B `press_q2_vague` text (verbatim):
> "The economic fundamentals are sound. The IMA program is proceeding on schedule. The infrastructure fund will create jobs. I am confident that the combination of fiscal discipline and targeted investment will produce results within the fiscal year. I am not going to make promises I cannot keep — that is what the previous government did, and it is how we arrived at the deficit we inherited."
- choice B flags: [
 "press_economy_vague"
]
- choice B stateChanges (verbatim):
```json
[
 {
  "stat": "nation.mediaControl",
  "operation": "add",
  "value": 2
 },
 {
  "stat": "personal.publicImage",
  "operation": "add",
  "value": -1
 }
]
```
- choice B signs: nation.mediaControl: +; personal.publicImage: -
- shared-target first-2 narrative nodes:
```json
[
 {
  "type": "description",
  "text": "You are reaching for the podium notes to close the briefing when Nadia Voss stands. She does not raise her hand. She simply stands, which in a press room is the equivalent of being recognized — because everyone knows that when Nadia Voss stands, the question she asks will be the one that matters."
 },
 {
  "type": "dialogue",
  "character": "nadia_voss",
  "text": "Chancellor, one final question. You have spoken about unity, about governing for all Veltrians, about the constitution working for everyone. But the record shows something different. Since the referendum, three Halvekist parliamentary aides have been denied security clearances. The Interior Ministry has 'reassigned' two senior officials who were seen at a Kolvar-organized dinner. The Workers' Coalition is demanding a cabinet seat that you have not filled. Unity is a word. What specifically — what action, what policy, what concrete step — are you taking to govern for the forty-eight percent who said no?"
 }
]
```

### act2_week27_press_economy (week 27) list `(root)` → `node:act2_week27_press_followup`
- opposite-signed stats: personal.publicImage
- choice A `press_q2_honest` text (verbatim):
> "I will not pretend the economic situation is good, because it is not. We inherited a deficit that the previous government concealed. The IMA conditions are painful but they are stabilizing the currency. What I will say is this: the economic plan is the same plan it has been since week one — fiscal discipline, targeted investment, and the hardest part, which is asking working Veltrians to accept short-term pain for long-term gain. I cannot guarantee that the pain will be short. I can guarantee that the gain will be real."
- choice A flags: [
 "press_economy_honest"
]
- choice A stateChanges (verbatim):
```json
[
 {
  "stat": "personal.publicImage",
  "operation": "add",
  "value": 4
 },
 {
  "stat": "personal.moralCompass",
  "operation": "add",
  "value": 3
 },
 {
  "stat": "factions.workersCoalition",
  "operation": "add",
  "value": 2
 }
]
```
- choice A signs: personal.publicImage: +; personal.moralCompass: +; factions.workersCoalition: +
- choice B `press_q2_vague` text (verbatim):
> "The economic fundamentals are sound. The IMA program is proceeding on schedule. The infrastructure fund will create jobs. I am confident that the combination of fiscal discipline and targeted investment will produce results within the fiscal year. I am not going to make promises I cannot keep — that is what the previous government did, and it is how we arrived at the deficit we inherited."
- choice B flags: [
 "press_economy_vague"
]
- choice B stateChanges (verbatim):
```json
[
 {
  "stat": "nation.mediaControl",
  "operation": "add",
  "value": 2
 },
 {
  "stat": "personal.publicImage",
  "operation": "add",
  "value": -1
 }
]
```
- choice B signs: nation.mediaControl: +; personal.publicImage: -
- shared-target first-2 narrative nodes:
```json
[
 {
  "type": "description",
  "text": "You are reaching for the podium notes to close the briefing when Nadia Voss stands. She does not raise her hand. She simply stands, which in a press room is the equivalent of being recognized — because everyone knows that when Nadia Voss stands, the question she asks will be the one that matters."
 },
 {
  "type": "dialogue",
  "character": "nadia_voss",
  "text": "Chancellor, one final question. You have spoken about unity, about governing for all Veltrians, about the constitution working for everyone. But the record shows something different. Since the referendum, three Halvekist parliamentary aides have been denied security clearances. The Interior Ministry has 'reassigned' two senior officials who were seen at a Kolvar-organized dinner. The Workers' Coalition is demanding a cabinet seat that you have not filled. Unity is a word. What specifically — what action, what policy, what concrete step — are you taking to govern for the forty-eight percent who said no?"
 }
]
```

### act2_week27_press_followup (week 27) list `(root)` → `node:act2_week27_press_outcome`
- opposite-signed stats: factions.reformists
- choice A `press_followup_specific` text (verbatim):
> "Specific actions. You want specific actions. Here they are: I am appointing a bipartisan constitutional implementation committee with representation from every parliamentary faction, including the Halvekists. I am directing the Interior Ministry to review every security clearance denial from the past thirty days and reverse any that were politically motivated. And I am meeting with Soraya Khaled this week to discuss the Workers' Coalition cabinet seat. Those are not words. Those are calendar entries. I will announce the implementation committee composition before the end of this week. I will expect you to hold me to it."
- choice A flags: [
 "press_followup_specific"
]
- choice A stateChanges (verbatim):
```json
[
 {
  "stat": "factions.reformists",
  "operation": "add",
  "value": 6
 },
 {
  "stat": "factions.halvekists",
  "operation": "add",
  "value": 4
 },
 {
  "stat": "factions.workersCoalition",
  "operation": "add",
  "value": 3
 },
 {
  "stat": "personal.publicImage",
  "operation": "add",
  "value": 8
 },
 {
  "stat": "nation.pressFreedom",
  "operation": "add",
  "value": 3
 },
 {
  "stat": "personal.moralCompass",
  "operation": "add",
  "value": 5
 }
]
```
- choice A signs: factions.reformists: +; factions.halvekists: +; factions.workersCoalition: +; personal.publicImage: +; nation.pressFreedom: +; personal.moralCompass: +
- choice B `press_followup_deflect` text (verbatim):
> "The forty-eight percent are Veltrians. They are already governed by this government — they have been since the election. The constitution does not create two classes of citizens. It creates one. The specific steps are the same steps I have been taking for twenty-seven weeks: governing. I do not need to announce special measures for the people who voted no, because the measures I am taking apply to everyone. That is what unity means. It does not mean different policies for different voters. It means one policy for all."
- choice B flags: [
 "press_followup_deflect"
]
- choice B stateChanges (verbatim):
```json
[
 {
  "stat": "personal.publicImage",
  "operation": "add",
  "value": 3
 },
 {
  "stat": "factions.reformists",
  "operation": "add",
  "value": -2
 },
 {
  "stat": "nation.mediaControl",
  "operation": "add",
  "value": 2
 }
]
```
- choice B signs: personal.publicImage: +; factions.reformists: -; nation.mediaControl: +
- shared-target first-2 narrative nodes:
```json
[
 {
  "type": "description",
  "text": "The corridor outside the press room is quiet in the way that corridors become quiet after something has happened. Vyktor is walking beside you, his pace unhurried, his expression unreadable. He has his notepad open. He is not writing in it. He is holding it the way he holds things he wants you to notice — which means he has already decided something about what just happened and is waiting for you to ask."
 },
 {
  "type": "dialogue",
  "character": "vyktor_reznik",
  "conditions": [
   {
    "type": "flag",
    "flag": "press_followup_specific",
    "value": true
   }
  ],
  "text": "That was either very good or very bad. I am not yet certain which. The implementation committee commitment will require twelve names by Friday — six reformists, three moderates, two Halvekists, and one Iron Covenant. I will have the list by tomorrow. The security clearance review will take three days. The Khaled meeting needs to happen before Thursday or the Workers' Coalition will read it as stalling. You have created work for this office. I do not mind work. I mind work that has a deadline."
 }
]
```

### act2_week27_press_followup (week 27) list `(root)` → `node:act2_week27_press_outcome`
- opposite-signed stats: factions.reformists, personal.publicImage, nation.pressFreedom
- choice A `press_followup_specific` text (verbatim):
> "Specific actions. You want specific actions. Here they are: I am appointing a bipartisan constitutional implementation committee with representation from every parliamentary faction, including the Halvekists. I am directing the Interior Ministry to review every security clearance denial from the past thirty days and reverse any that were politically motivated. And I am meeting with Soraya Khaled this week to discuss the Workers' Coalition cabinet seat. Those are not words. Those are calendar entries. I will announce the implementation committee composition before the end of this week. I will expect you to hold me to it."
- choice A flags: [
 "press_followup_specific"
]
- choice A stateChanges (verbatim):
```json
[
 {
  "stat": "factions.reformists",
  "operation": "add",
  "value": 6
 },
 {
  "stat": "factions.halvekists",
  "operation": "add",
  "value": 4
 },
 {
  "stat": "factions.workersCoalition",
  "operation": "add",
  "value": 3
 },
 {
  "stat": "personal.publicImage",
  "operation": "add",
  "value": 8
 },
 {
  "stat": "nation.pressFreedom",
  "operation": "add",
  "value": 3
 },
 {
  "stat": "personal.moralCompass",
  "operation": "add",
  "value": 5
 }
]
```
- choice A signs: factions.reformists: +; factions.halvekists: +; factions.workersCoalition: +; personal.publicImage: +; nation.pressFreedom: +; personal.moralCompass: +
- choice B `press_followup_combative` text (verbatim):
> "Ms. Voss, I have been governing for twenty-seven weeks. I have made more consequential decisions in that time than most Chancellors make in a term. The security clearances were reviewed through proper channels. The cabinet positions will be filled when I am ready to fill them. I am not going to run my government by press conference — I am going to run it by making decisions, implementing them, and letting the results speak. If you want to write about what I am doing, I suggest you look at what has been done rather than what has been announced."
- choice B flags: [
 "press_followup_combative"
]
- choice B stateChanges (verbatim):
```json
[
 {
  "stat": "nation.pressFreedom",
  "operation": "add",
  "value": -5
 },
 {
  "stat": "factions.reformists",
  "operation": "add",
  "value": -4
 },
 {
  "stat": "factions.ironCovenant",
  "operation": "add",
  "value": 3
 },
 {
  "stat": "personal.publicImage",
  "operation": "add",
  "value": -5
 }
]
```
- choice B signs: nation.pressFreedom: -; factions.reformists: -; factions.ironCovenant: +; personal.publicImage: -
- shared-target first-2 narrative nodes:
```json
[
 {
  "type": "description",
  "text": "The corridor outside the press room is quiet in the way that corridors become quiet after something has happened. Vyktor is walking beside you, his pace unhurried, his expression unreadable. He has his notepad open. He is not writing in it. He is holding it the way he holds things he wants you to notice — which means he has already decided something about what just happened and is waiting for you to ask."
 },
 {
  "type": "dialogue",
  "character": "vyktor_reznik",
  "conditions": [
   {
    "type": "flag",
    "flag": "press_followup_specific",
    "value": true
   }
  ],
  "text": "That was either very good or very bad. I am not yet certain which. The implementation committee commitment will require twelve names by Friday — six reformists, three moderates, two Halvekists, and one Iron Covenant. I will have the list by tomorrow. The security clearance review will take three days. The Khaled meeting needs to happen before Thursday or the Workers' Coalition will read it as stalling. You have created work for this office. I do not mind work. I mind work that has a deadline."
 }
]
```

### act2_week27_press_followup (week 27) list `(root)` → `node:act2_week27_press_outcome`
- opposite-signed stats: personal.publicImage
- choice A `press_followup_deflect` text (verbatim):
> "The forty-eight percent are Veltrians. They are already governed by this government — they have been since the election. The constitution does not create two classes of citizens. It creates one. The specific steps are the same steps I have been taking for twenty-seven weeks: governing. I do not need to announce special measures for the people who voted no, because the measures I am taking apply to everyone. That is what unity means. It does not mean different policies for different voters. It means one policy for all."
- choice A flags: [
 "press_followup_deflect"
]
- choice A stateChanges (verbatim):
```json
[
 {
  "stat": "personal.publicImage",
  "operation": "add",
  "value": 3
 },
 {
  "stat": "factions.reformists",
  "operation": "add",
  "value": -2
 },
 {
  "stat": "nation.mediaControl",
  "operation": "add",
  "value": 2
 }
]
```
- choice A signs: personal.publicImage: +; factions.reformists: -; nation.mediaControl: +
- choice B `press_followup_combative` text (verbatim):
> "Ms. Voss, I have been governing for twenty-seven weeks. I have made more consequential decisions in that time than most Chancellors make in a term. The security clearances were reviewed through proper channels. The cabinet positions will be filled when I am ready to fill them. I am not going to run my government by press conference — I am going to run it by making decisions, implementing them, and letting the results speak. If you want to write about what I am doing, I suggest you look at what has been done rather than what has been announced."
- choice B flags: [
 "press_followup_combative"
]
- choice B stateChanges (verbatim):
```json
[
 {
  "stat": "nation.pressFreedom",
  "operation": "add",
  "value": -5
 },
 {
  "stat": "factions.reformists",
  "operation": "add",
  "value": -4
 },
 {
  "stat": "factions.ironCovenant",
  "operation": "add",
  "value": 3
 },
 {
  "stat": "personal.publicImage",
  "operation": "add",
  "value": -5
 }
]
```
- choice B signs: nation.pressFreedom: -; factions.reformists: -; factions.ironCovenant: +; personal.publicImage: -
- shared-target first-2 narrative nodes:
```json
[
 {
  "type": "description",
  "text": "The corridor outside the press room is quiet in the way that corridors become quiet after something has happened. Vyktor is walking beside you, his pace unhurried, his expression unreadable. He has his notepad open. He is not writing in it. He is holding it the way he holds things he wants you to notice — which means he has already decided something about what just happened and is waiting for you to ask."
 },
 {
  "type": "dialogue",
  "character": "vyktor_reznik",
  "conditions": [
   {
    "type": "flag",
    "flag": "press_followup_specific",
    "value": true
   }
  ],
  "text": "That was either very good or very bad. I am not yet certain which. The implementation committee commitment will require twelve names by Friday — six reformists, three moderates, two Halvekists, and one Iron Covenant. I will have the list by tomorrow. The security clearance review will take three days. The Khaled meeting needs to happen before Thursday or the Workers' Coalition will read it as stalling. You have created work for this office. I do not mind work. I mind work that has a deadline."
 }
]
```

### act3_tyvaren_pressure (week 24) list `response_options` → `segment:pressure_close`
- opposite-signed stats: nation.publicOrder, factions.reformists
- choice A `tyvaren_negotiate` text (verbatim):
> Request the meeting. We won Morivask honestly — we can defend it in a room.
- choice A flags: [
 "tyvaren_pressure_diplomatic"
]
- choice A stateChanges (verbatim):
```json
[
 {
  "stat": "nation.publicOrder",
  "value": 2
 },
 {
  "stat": "factions.reformists",
  "value": 4
 }
]
```
- choice A signs: nation.publicOrder: +; factions.reformists: +
- choice B `tyvaren_counter` text (verbatim):
> Make the deal public. All of it. Let Veltria see what we won and let Tyvaren explain why they are angry about it.
- choice B flags: [
 "tyvaren_pressure_public"
]
- choice B stateChanges (verbatim):
```json
[
 {
  "stat": "factions.reformists",
  "value": -5
 },
 {
  "stat": "nation.publicOrder",
  "value": -3
 }
]
```
- choice B signs: factions.reformists: -; nation.publicOrder: -
- shared-target first-2 narrative nodes:
```json
[
 {
  "type": "description",
  "text": "Vyktor nods once and leaves to begin making calls. Elara stays behind long enough to set a second folder on the desk — alternative supplier contacts, already compiled, already organized by cost and lead time. She did not wait to be asked."
 },
 {
  "type": "dialogue",
  "character": "elara_vostane",
  "text": "The Morivask revenue starts flowing in month four. Whatever Tyvaren costs us in the next sixty days, the deal pays for it by end of year. I want you to hold that number when it gets difficult."
 }
]
```

### act3_week29_assassination_attempt (week 30) list `(root)` → `segment:seg_investigation`
- opposite-signed stats: personal.publicImage
- choice A `w34_address_immediately` text (verbatim):
> Address the nation within the hour, from the hospital, on your feet if you can manage it. Let Veltria see that the attempt failed to do what it was meant to do.
- choice A flags: [
 "post_attempt_injury",
 "permanent_injury_sustained",
 "week34_addressed_immediately",
 "assassination_survived",
 "assassination_attempted",
 "ashenmere_incident"
]
- choice A stateChanges (verbatim):
```json
[
 {
  "stat": "personal.publicImage",
  "operation": "add",
  "value": 10
 },
 {
  "stat": "personal.moralCompass",
  "operation": "add",
  "value": 3
 }
]
```
- choice A signs: personal.publicImage: +; personal.moralCompass: +
- choice B `w34_withdraw_private` text (verbatim):
> Withdraw from public view. Let Vyktor issue a brief statement while you take the days the doctors are telling you, in careful language, that you actually need.
- choice B flags: [
 "post_attempt_injury",
 "permanent_injury_sustained",
 "week34_withdrew",
 "assassination_survived",
 "assassination_attempted",
 "ashenmere_incident"
]
- choice B stateChanges (verbatim):
```json
[
 {
  "stat": "personal.moralCompass",
  "operation": "add",
  "value": 6
 },
 {
  "stat": "personal.publicImage",
  "operation": "add",
  "value": -4
 }
]
```
- choice B signs: personal.moralCompass: +; personal.publicImage: -
- shared-target first-2 narrative nodes:
```json
[
 {
  "type": "description",
  "text": "Three days later, Danika brings what the investigation has actually found, which is less than the newspapers are already claiming to know."
 },
 {
  "type": "dialogue",
  "character": "danika_oberlin",
  "text": "The shooter carried no identification by design, Chancellor. What we have is circumstantial — an access badge traced through two intermediaries, a rifle with the serial filed but not filed well. It points in more than one direction. I won't pretend to you it points in only one."
 }
]
```

## (d) Round 7 answers from AGENT_LOG (verbatim) + raw scene JSON

### AGENT_LOG Round 7 STEP 0 (verbatim)

```
### STEP 0 — corrections and pastes (read-only; TEMP last_audience never in tree)
- a) `act7_week103_last_audience` exists ONLY in TEMP (authored Round 6, uncommitted
  by design). `git ls-files` shows no match — it is not in the tree, was not
  committed, and stays out. Nothing to remove.
- b) "The Last Audience" exists as `act6_week74_last_audience` (Morvec deathbed,
  weeks 74–76 — the earlier "70–83" range was wrong; correction recorded here).
- c) Raw JSON of the four existing scenes pasted in the session report verbatim
  (kitchen 426 lines / heir 223 / foundry 377 / audience-74 207).
```

### AGENT_LOG Round 7 STEP 2 recurring-scene freeze results (verbatim)

```
### STEP 2 — `ad7aebe` recurring scenes (injection verdict + proofs)
- Engines inject narrative SEGMENTS only (display-splice into NarrativeScene;
  FamilyDinner `injectedSegments.slice(0,3)`); SocialEvent runs `socialInteractions`
  with its own leave flow and never reads `currentScene.choices`. Verified: no
  nextSegment targets any dinner/briefing empty seg (only the _choices hubs), and
  the 3 social roots carry 2/3/6 interactions.
- Pre-fix freeze answers: dinner/briefing hubs have real choices (never froze on
  the real path); social roots never entered the choice path (no freeze there);
  all 18 WOULD freeze if rendered via NarrativeScene without the fallback.
- 18 of 27 static FAILs reclassified false positives; audit excludes both
  populations dynamically (they fall back into the gate if the data changes
  shape). 9 true FAILs (kitchen/two-letters) stay baselined. Spine: dinner +
  briefing hubs complete with real choices and no fallback; social roots complete
  via the interaction flow and offer Continue as defense in depth (freeze 9/9).
```

### AGENT_LOG Round 7 STEP 3 week-52 winner view + 10 ending-flag readers + none-set behavior (verbatim)

```
### STEP 3 — week-52 typical win (constitution + reformists 65, clean background)
- Player sees: the 2 unconditional narrative nodes + exactly 1 choice
  (`ending_democratic_triumph`, full text pasted in session report).
- Readers of the 10 ending flags: LegacyEngine + endingCalculator read ONLY
  `ending_assassination` (Survivor gate / coup-assassination branch; outcomes
  otherwise stat-derived); journal templates journal 6 of them (triumph, autocrat,
  war victory/defeat, family, economic); EpilogueScreen, TermReportScreen,
  weekStore, narrativeStore read NONE. war_stalemate / military_coup /
  revolutionary have no readers at all (write-only record flags).
- None set: Survivor stays eligible, calculator runs on stats, no journal ending
  entry, epilogue shows stat-derived outcomes — nothing requires them, nothing
  crashes.
```

### AGENT_LOG Round 7 STEP 4 merge dry-run + STEP 5 touched files (verbatim)

```
### STEP 4 — merge dry run (throwaway, aborted, deleted)
- `dryrun-tmp` from local main + `merge --no-ff --no-commit agent/depth-pass`:
  "Automatic merge went well", ZERO conflicts (no UU/AA/DD entries).
- Branch does NOT touch GameLayout.tsx, opencode.json, or package*.json (empty
  diff main...branch on those paths) — the worktree modifications there are
  local-only and merge-safe. Tree restored intact afterward.

### STEP 5 — Round-6 file list (7 files; flags/prose correction)
- src/engine/NarrativeEngine.ts (ensureTerminalChoice + id), src/stores/
  narrativeStore.ts (synthetic completion branch), src/components/
  NarrativeScene.tsx (apply at final-list site) — STEP 1 engine.
- audit-full-game.mjs (FAIL/WARN gate), src/test/freeze.test.ts (new, 6 tests),
  docs/REACHABILITY.md (triage), docs/AGENT_LOG.md (log).
- CORRECTION: Round 6 made ZERO flags/prose/data edits (the round-6 report
  boilerplate suggesting otherwise was wrong) — no scene JSON was touched.
```

### raw JSON of existing Kitchen Table (`act7_week99_kitchen_table`, verbatim file content)

```json
{
  "id": "act7_week99_kitchen_table",
  "title": "The Kitchen Table",
  "act": 7,
  "weekAvailable": 99,
  "weekDeadline": 101,
  "type": "personal",
  "agendaCost": 1,
  "isMandatory": false,
  "location": "Chancellor's Residence — Kitchen, Ashenmere Palace",
  "characters": [
    "jonas_ashavel",
    "liora_ashavel",
    "tomas_ashavel"
  ],
  "prerequisites": [],
  "narrative": [
    {
      "type": "description",
      "text": "Sunday. Five weeks to the vote. The residence kitchen is the only room in the Palace that was never redecorated, because nobody official ever goes into it. The window over the sink looks onto the bins and a strip of the east lawn."
    },
    {
      "type": "description",
      "conditions": [
        {
          "type": "flag",
          "flag": "family_united",
          "value": true
        }
      ],
      "text": "Jonas is at the stove with his sleeves rolled, making the lamb your mother used to make. Liora is reading the Voice at the table with her feet on the next chair. Tomas is late, as he has been every Sunday for two years, and will arrive saying the trams were the reason."
    },
    {
      "type": "description",
      "conditions": [
        {
          "type": "flag",
          "flag": "jonas_divorce",
          "value": true
        }
      ],
      "text": "Liora comes on the noon train from Kravenstal with a covered dish under a tea towel. 'Papa sent it. He said you'd forget to eat.' She doesn't say whether he asked how you were. She sets two plates, then looks at the third chair and leaves it bare."
    },
    {
      "type": "description",
      "conditions": [
        {
          "type": "flag",
          "flag": "family_united",
          "value": false
        },
        {
          "type": "flag",
          "flag": "jonas_divorce",
          "value": false
        }
      ],
      "text": "Jonas is at the stove, not quite cooking, moving a pan from one ring to another. Liora sets the table for four without being asked. Nobody has said anything for a while, which in this family counts as a truce."
    },
    {
      "type": "description",
      "conditions": [
        {
          "type": "flag",
          "flag": "stray_dog_adopted",
          "value": true
        }
      ],
      "text": "The dog from the Palace gardens sleeps under the table with his chin on your shoe. Liora named him Mirek after a boy she hated at school. He answers to it, which she considers proof of something."
    },
    {
      "type": "dialogue",
      "character": "tomas_ashavel",
      "conditions": [
        {
          "type": "flag",
          "flag": "tomas_arrest_booked",
          "value": true
        },
        {
          "type": "flag",
          "flag": "jonas_divorce",
          "value": false
        }
      ],
      "text": "I kept the receipt. Twenty kroner, Central District magistrate. It's in my wallet behind my student card. People ask me what it is. I tell them it's the only thing my mother ever gave me that she couldn't have got me out of."
    },
    {
      "type": "dialogue",
      "character": "tomas_ashavel",
      "conditions": [
        {
          "type": "flag",
          "flag": "tomas_arrest_quashed",
          "value": true
        },
        {
          "type": "flag",
          "flag": "jonas_divorce",
          "value": false
        }
      ],
      "text": "Nadia Voss put a photostat of my second arrest sheet in her book. Chapter nine. I've read it four times. I keep waiting for the version where I asked you to do it. I didn't."
    },
    {
      "type": "dialogue",
      "character": "tomas_ashavel",
      "conditions": [
        {
          "type": "flag",
          "flag": "tomas_arrest_mass_release",
          "value": true
        },
        {
          "type": "flag",
          "flag": "jonas_divorce",
          "value": false
        }
      ],
      "text": "Two of the forty-one from Corvin Bridge are standing for the city council. They both say you let them go for my sake. They're both voting for you anyway. I don't understand this country."
    },
    {
      "type": "dialogue",
      "character": "liora_ashavel",
      "conditions": [
        {
          "type": "flag",
          "flag": "orphanage_saved",
          "value": true
        }
      ],
      "text": "The boiler in Dravenhollow is still working. The matron sends a card every winter. She addresses it to me, not you. I think she's being polite to both of us."
    },
    {
      "type": "dialogue",
      "character": "liora_ashavel",
      "conditions": [
        {
          "type": "flag",
          "flag": "orphanage_promise_broken",
          "value": true
        }
      ],
      "text": "The state money for the Dravenhollow home came through in the end. Eight weeks late. I went back in the spring. The children who were cold that winter have moved on to other homes. Nobody wrote down where."
    },
    {
      "type": "dialogue",
      "character": "liora_ashavel",
      "conditions": [
        {
          "type": "flag",
          "flag": "orphanage_ignored",
          "value": true
        }
      ],
      "text": "I still go to Dravenhollow, Mum. I don't tell you because you'd ask how it is, and then I'd have to tell you."
    },
    {
      "type": "dialogue",
      "character": "jonas_ashavel",
      "conditions": [
        {
          "type": "flag",
          "flag": "jonas_divorce",
          "value": false
        }
      ],
      "text": "One question, Katya, and then we eat. Win or lose. What happens on Thursday?"
    },
    {
      "type": "dialogue",
      "character": "liora_ashavel",
      "conditions": [
        {
          "type": "flag",
          "flag": "jonas_divorce",
          "value": true
        }
      ],
      "text": "Papa asked me to ask you one thing, so I'm asking it word for word. Win or lose. What happens on Thursday?"
    },
    {
      "type": "monologue",
      "text": "Thursday. The count will be done by Wednesday night. Father never had a Thursday after his Wednesday. I have spent my whole life treating every Thursday as if it were borrowed."
    }
  ],
  "choices": [
    {
      "id": "kitchen99_promise_home",
      "text": "\"Thursday I come home. Win or lose. The Republic gets the other six days. You get Thursday.\"",
      "internalTag": "personal",
      "nextSegment": "seg_promise",
      "flags": [
        "kitchen99_promised_thursday"
      ],
      "stateChanges": [
        {
          "stat": "personal.marriageHealth",
          "operation": "add",
          "value": 8
        },
        {
          "stat": "personal.lioraRelationship",
          "operation": "add",
          "value": 6
        },
        {
          "stat": "personal.stressLevel",
          "operation": "add",
          "value": -8
        }
      ],
      "reactions": [],
      "chainTriggers": [],
      "codexUnlocks": []
    },
    {
      "id": "kitchen99_tell_truth",
      "text": "\"If I win, Thursday is the first day of the last two years. I won't lie to you in this kitchen.\"",
      "internalTag": "reformist",
      "nextSegment": "seg_truth",
      "flags": [
        "kitchen99_told_truth"
      ],
      "stateChanges": [
        {
          "stat": "personal.moralCompass",
          "operation": "add",
          "value": 4
        },
        {
          "stat": "personal.marriageHealth",
          "operation": "add",
          "value": -3
        },
        {
          "stat": "personal.tomasWellbeing",
          "operation": "add",
          "value": 3
        }
      ],
      "reactions": [],
      "chainTriggers": [],
      "codexUnlocks": []
    },
    {
      "id": "kitchen99_stand_with_me",
      "text": "\"Stand next to me on the Chancellery steps on Wednesday night. All of you. Let the country see the family it's voting for.\"",
      "internalTag": "populist",
      "nextSegment": "seg_steps",
      "flags": [
        "kitchen99_family_on_steps"
      ],
      "stateChanges": [
        {
          "stat": "personal.publicImage",
          "operation": "add",
          "value": 6
        },
        {
          "stat": "personal.lioraRelationship",
          "operation": "add",
          "value": -6
        },
        {
          "stat": "personal.tomasWellbeing",
          "operation": "add",
          "value": -4
        }
      ],
      "reactions": [],
      "chainTriggers": [],
      "codexUnlocks": []
    }
  ],
  "segments": {
    "seg_promise": {
      "narrative": [
        {
          "type": "dialogue",
          "character": "jonas_ashavel",
          "conditions": [
            {
              "type": "flag",
              "flag": "jonas_divorce",
              "value": false
            }
          ],
          "text": "Thursday. All right. I'll make the lamb again. If you're late I'll eat yours."
        },
        {
          "type": "dialogue",
          "character": "liora_ashavel",
          "conditions": [
            {
              "type": "flag",
              "flag": "jonas_divorce",
              "value": true
            }
          ],
          "text": "I'll tell him. He'll pretend not to care, and then he'll ask me twice whether you sounded like you meant it."
        },
        {
          "type": "description",
          "text": "Vyktor's office has already blocked Thursday in the diary for 'post-election consultations with the Speaker'. On Monday you cross it out by hand and write HOME in the margin. The diary secretary photographs the page before she retypes it, in case anybody asks her later whose writing it was."
        },
        {
          "type": "monologue",
          "text": "One day. It's a small promise, the kind Father made and kept. Every Thursday he was alive he walked us to the foundry gate and back. It wasn't much. We remembered every one."
        }
      ],
      "choices": [
        {
          "id": "kitchen99_promise_end",
          "text": "Thursday is crossed out in the diary. HOME, in my own hand.",
          "nextSegment": null,
          "flags": [],
          "stateChanges": [
            {
              "stat": "personal.publicImage",
              "operation": "add",
              "value": -1
            }
          ],
          "reactions": [],
          "chainTriggers": [],
          "codexUnlocks": []
        }
      ]
    },
    "seg_truth": {
      "narrative": [
        {
          "type": "description",
          "text": "Nobody says anything for long enough that the lamb needs turning. Jonas turns it, or Liora does, depending on which kitchen this is."
        },
        {
          "type": "dialogue",
          "character": "tomas_ashavel",
          "text": "That's the first time anyone in this family has answered that question honestly. Grandfather never got to. I'd rather have this than a promise.",
          "conditions": [
            {
              "type": "flag",
              "flag": "jonas_divorce",
              "value": false
            }
          ]
        },
        {
          "type": "dialogue",
          "character": "liora_ashavel",
          "text": "I wouldn't. But I'll take it."
        },
        {
          "type": "monologue",
          "text": "The truth cost me a Thursday I could have promised and missed. Tomas thinks that's courage. Liora thinks it's habit. Both of them are right about me."
        }
      ],
      "choices": [
        {
          "id": "kitchen99_truth_end",
          "text": "No promise. Five weeks to the vote and a lamb that needed turning.",
          "nextSegment": null,
          "flags": [],
          "stateChanges": [
            {
              "stat": "personal.stressLevel",
              "operation": "add",
              "value": 3
            }
          ],
          "reactions": [],
          "chainTriggers": [],
          "codexUnlocks": []
        }
      ]
    },
    "seg_steps": {
      "narrative": [
        {
          "type": "dialogue",
          "character": "liora_ashavel",
          "text": "You asked us to lunch so you could book us for a photograph."
        },
        {
          "type": "dialogue",
          "character": "tomas_ashavel",
          "text": "I'll come. I'll stand where they tell me. But I'm not smiling, and I'll tell anyone who asks why.",
          "conditions": [
            {
              "type": "flag",
              "flag": "jonas_divorce",
              "value": false
            }
          ]
        },
        {
          "type": "description",
          "text": "Vyktor's office sends the arrangements on Monday: Chancellery steps, 23:30, positions marked in chalk. Liora's chalk mark is to your left. Tomas's is a step down. The Herald has already asked for an exclusive."
        },
        {
          "type": "monologue",
          "text": "I needed them on the steps. That's the true sentence. I wanted them at the table, and I turned the table into a stage before the lamb was cut. Mother would have taken the plates away."
        }
      ],
      "choices": [
        {
          "id": "kitchen99_steps_end",
          "text": "Three chalk marks on the Chancellery steps. One of them won't smile.",
          "nextSegment": null,
          "flags": [],
          "stateChanges": [
            {
              "stat": "personal.marriageHealth",
              "operation": "add",
              "value": -4
            }
          ],
          "reactions": [],
          "chainTriggers": [],
          "codexUnlocks": []
        }
      ]
    }
  }
}
```

### raw JSON of existing Heir (`act7_week101_the_heir`, verbatim file content)

```json
{
  "id": "act7_week101_the_heir",
  "title": "The Heir",
  "act": 7,
  "weekAvailable": 101,
  "weekDeadline": 103,
  "type": "meeting",
  "agendaCost": 1,
  "isMandatory": false,
  "location": "Chancellor's Office — Ashenmere Palace",
  "characters": ["aleksei_morvec"],
  "prerequisites": [],
  "narrative": [
    {
      "type": "description",
      "text": "Aleksei Morvec comes through the front gate, signs the visitors' book, and waits in the anteroom for eleven minutes without complaint. His father never did any of those three things. He has had the cane cut down and wears it as a tie pin."
    },
    {
      "type": "dialogue",
      "character": "aleksei_morvec",
      "text": "Two weeks to the vote, Chancellor. I'll be brief, because my father never was. The house employs sixty-one thousand people between Aldenmoor and Sevagrad. Their families vote. Their foremen tell them how. And I have ₭4 million that I am prepared to give your campaign openly, published, every kroner declared. My father bought governments in the dark. I'd like to buy one in daylight."
    },
    {
      "type": "dialogue",
      "character": "aleksei_morvec",
      "conditions": [{ "type": "flag", "flag": "morvec_succession_promised", "value": true }],
      "text": "You gave him your word: no better, no worse. You kept the second half. I'm here to offer you the chance to break the first. The price is the Aldenmoor Free Port charter, twenty years, no customs, signed on the Thursday after the vote."
    },
    {
      "type": "dialogue",
      "character": "aleksei_morvec",
      "conditions": [{ "type": "flag", "flag": "morvec_succession_ledger_taken", "value": true }],
      "text": "My father gave you nine green boxes to buy me an ordinary life. I've had an ordinary life for six months. I don't recommend it. The price is the boxes. All nine, unopened, back in the house vault."
    },
    {
      "type": "dialogue",
      "character": "aleksei_morvec",
      "conditions": [{ "type": "flag", "flag": "morvec_succession_refused", "value": true }],
      "text": "You told my father the law makes no promises at bedsides. So here is a promise in an office instead. I've been paying for Kolvar's printing since the funeral. I'll stop on one condition: the Aldenmoor Free Port charter, twenty years, signed the Thursday after the vote."
    },
    {
      "type": "dialogue",
      "character": "aleksei_morvec",
      "conditions": [
        { "type": "flag", "flag": "morvec_succession_promised", "value": false },
        { "type": "flag", "flag": "morvec_succession_ledger_taken", "value": false },
        { "type": "flag", "flag": "morvec_succession_refused", "value": false }
      ],
      "text": "My father never got his audience with you before he died. I've inherited the request along with the ships. The price is the Aldenmoor Free Port charter, twenty years, no customs, signed the Thursday after the vote."
    },
    {
      "type": "dialogue",
      "character": "aleksei_morvec",
      "conditions": [{ "type": "flag", "flag": "smuggler_bribe_taken", "value": true }],
      "text": "And there's a holding account in the house ledger with your name on it, paid quarterly. I don't mention it as a threat. I mention it so we can both stop pretending you've never taken our money."
    },
    {
      "type": "dialogue",
      "character": "aleksei_morvec",
      "conditions": [{ "type": "flag", "flag": "coal83_oil_requisitioned", "value": true }],
      "text": "You also took my Sevagrad oil for a winter at a fifth of its price. I've added that to the bill. I'm told that's how the Treasury does arithmetic."
    },
    { "type": "dialogue", "character": "aleksei_morvec", "conditions": [{ "type": "flag", "flag": "smuggler_bribe_refused", "value": true }], "text": "My father told me you refused his cigarette money in the warehouse. He admired that more than he admitted. I'm hoping you'll find money in daylight easier to accept." },
    {
      "type": "monologue",
      "text": "Four million in daylight. Stefan would have offered it in an envelope and been insulted if I'd counted it. The son wants a receipt. That's either progress or a better trap."
    }
  ],
  "choices": [
    {
      "id": "heir101_accept_deal",
      "text": "Take the money and sign the letter, dated the Thursday after the vote.",
      "internalTag": "pragmatist",
      "nextSegment": "seg_deal",
      "flags": ["heir101_deal_signed"],
      "stateChanges": [
        { "stat": "morvecInfluence", "operation": "add", "value": 15 },
        { "stat": "factions.businessClass", "operation": "add", "value": 10 },
        { "stat": "personal.moralCompass", "operation": "add", "value": -8 },
        { "stat": "nation.corruption", "operation": "add", "value": 5 }
      ],
      "reactions": [],
      "chainTriggers": [],
      "codexUnlocks": []
    },
    {
      "id": "heir101_return_boxes",
      "text": "Return the nine boxes, unopened. In exchange the house stays out of the election entirely, both sides.",
      "internalTag": "pragmatist",
      "conditions": [{ "type": "flag", "flag": "morvec_succession_ledger_taken", "value": true }],
      "nextSegment": "seg_boxes",
      "flags": ["heir101_boxes_returned"],
      "stateChanges": [
        { "stat": "shadowInfluence", "operation": "add", "value": -12 },
        { "stat": "morvecInfluence", "operation": "add", "value": 6 },
        { "stat": "personal.stressLevel", "operation": "add", "value": -5 }
      ],
      "reactions": [],
      "chainTriggers": [],
      "codexUnlocks": []
    },
    {
      "id": "heir101_publish_offer",
      "text": "Refuse, and publish the offer in full before he's left the building: the figure, the charter, the date on the letter.",
      "internalTag": "populist",
      "nextSegment": "seg_publish",
      "flags": ["heir101_offer_published"],
      "stateChanges": [
        { "stat": "personal.publicImage", "operation": "add", "value": 6 },
        { "stat": "factions.reformists", "operation": "add", "value": 6 },
        { "stat": "morvecInfluence", "operation": "add", "value": -10 },
        { "stat": "factions.businessClass", "operation": "add", "value": -8 }
      ],
      "reactions": [],
      "chainTriggers": [],
      "codexUnlocks": []
    },
    {
      "id": "heir101_refuse_quietly",
      "text": "Refuse. Quietly. \"Give it to Kolvar if you like. I'll win without your sixty-one thousand or lose without them.\"",
      "internalTag": "reformist",
      "nextSegment": "seg_refuse",
      "flags": ["heir101_refused"],
      "stateChanges": [
        { "stat": "personal.moralCompass", "operation": "add", "value": 6 },
        { "stat": "morvecInfluence", "operation": "add", "value": -6 },
        { "stat": "factions.businessClass", "operation": "add", "value": -4 }
      ],
      "reactions": [],
      "chainTriggers": [],
      "codexUnlocks": []
    }
  ],
  "segments": {
    "seg_deal": {
      "narrative": [
        { "type": "description", "text": "The letter is one paragraph, typed on Chancellery paper and dated three weeks ahead. Aleksei reads it twice, folds it into his inside pocket and pats the pocket the way his father used to pat the cane." },
        { "type": "description", "text": "The ₭4 million is declared on Monday. The Herald calls it 'the largest single campaign donation in the Republic's history'. The Kravenstal Worker calls it 'the price of Aldenmoor'. Both are correct. House foremen begin handing out your leaflets at the Aldenmoor gates on Tuesday morning." },
        { "type": "dialogue", "character": "aleksei_morvec", "text": "Thursday, Chancellor. My father always said Thursdays were for collecting." },
        { "type": "monologue", "text": "Thursday. I have now promised Thursday to two different people. Only one of them asked politely." }
      ],
      "choices": [
        {
          "id": "heir101_deal_end",
          "text": "₭4 million declared. The Free Port charter is dated the Thursday after the vote.",
          "nextSegment": null,
          "flags": [],
          "stateChanges": [
            { "stat": "personal.stressLevel", "operation": "add", "value": 6 }
          ],
          "reactions": [],
          "chainTriggers": [],
          "codexUnlocks": []
        }
      ]
    },
    "seg_boxes": {
      "narrative": [
        { "type": "description", "text": "Nine green boxes go back to Aldenmoor in the boot of a Chancellery car, under seal. The seal is unbroken. You checked twice, and you'll be asked about it for the rest of your life." },
        { "type": "dialogue", "character": "aleksei_morvec", "text": "Unopened. My father said you'd open them. He said everyone does, the first year. I owe him a lost bet, then." },
        { "type": "description", "text": "On Tuesday the house issues a statement: Morvec employees are free to vote as they choose, and no foreman will advise them otherwise. Nobody in Aldenmoor believes it at first. By Friday a few of them do." },
        { "type": "monologue", "text": "I gave back the power to own half the Halvek generation for the promise that sixty-one thousand people can vote unbothered. It is the best trade I've made in office and nobody will ever know I made it." }
      ],
      "choices": [
        {
          "id": "heir101_boxes_end",
          "text": "Nine boxes back in the house vault, seals intact. Aldenmoor votes without a foreman.",
          "nextSegment": null,
          "flags": [],
          "stateChanges": [
            { "stat": "personal.moralCompass", "operation": "add", "value": 4 }
          ],
          "reactions": [],
          "chainTriggers": [],
          "codexUnlocks": []
        }
      ]
    },
    "seg_publish": {
      "narrative": [
        { "type": "description", "text": "The press office has the statement out before Aleksei reaches his car: four million kroner, a twenty-year customs exemption, a letter dated the Thursday after the vote. Declined." },
        { "type": "dialogue", "character": "aleksei_morvec", "text": "You're your father's daughter, Chancellor. I've read about him. He died for making speeches like this one." },
        { "type": "description", "text": "Kolvar's campaign declares a Morvec donation of ₭3 million on Thursday, then hastily returns it on Saturday after the Voice runs your statement next to the house's declaration. By the end of the week the Morvec money is in nobody's account, and the foremen at the Aldenmoor gates have stopped handing out anyone's leaflets." },
        { "type": "monologue", "text": "He meant it as a threat. I heard it as the kindest thing anyone has said to me this year." }
      ],
      "choices": [
        {
          "id": "heir101_publish_end",
          "text": "The offer is printed, declined and refused by both campaigns. Aleksei leaves with his money.",
          "nextSegment": null,
          "flags": [],
          "stateChanges": [
            { "stat": "nation.pressFreedom", "operation": "add", "value": 2 }
          ],
          "reactions": [],
          "chainTriggers": [],
          "codexUnlocks": []
        }
      ]
    },
    "seg_refuse": {
      "narrative": [
        { "type": "dialogue", "character": "aleksei_morvec", "text": "Then I'll give it to Kolvar, and he'll sign the charter on his first Thursday, and you'll watch from wherever they send former Chancellors." },
        { "type": "description", "text": "He does. Kolvar declares ₭4 million from the house on Thursday. The foremen at the Aldenmoor gates hand out Kolvar leaflets on Friday. Vostane's office estimates the swing in the two harbor districts at four points." },
        { "type": "monologue", "text": "Four points in two districts, for a clean refusal nobody will report. Father refused things quietly too. They still came for him at three forty-seven. Quiet isn't the same as safe. It's only the same as honest." }
      ],
      "choices": [
        {
          "id": "heir101_refuse_end",
          "text": "No deal. The house funds Kolvar, and the harbor swings four points his way.",
          "nextSegment": null,
          "flags": [],
          "stateChanges": [
            { "stat": "personal.stressLevel", "operation": "add", "value": 5 }
          ],
          "reactions": [],
          "chainTriggers": [],
          "codexUnlocks": []
        }
      ]
    }
  }
}
```

### raw JSON of existing Foundry Street (`act7_week102_kravenstal`, verbatim file content)

```json
{
  "id": "act7_week102_kravenstal",
  "title": "Foundry Street",
  "act": 7,
  "weekAvailable": 102,
  "weekDeadline": 103,
  "type": "personal",
  "agendaCost": 1,
  "isMandatory": false,
  "location": "Foundry Street — Kravenstal",
  "characters": [
    "gregor_maric"
  ],
  "prerequisites": [],
  "narrative": [
    {
      "type": "description",
      "text": "You leave the press car at the Kravenstal station and walk the last mile with Marić and one plain-clothes officer. Foundry Street hasn't changed its shape in thirty years, only its colors. The house where you grew up has a new door and the same step. You don't knock."
    },
    {
      "type": "description",
      "text": "At the top of the street, the works gate. The night shift comes out at six in a single grey current of coats and lunch tins. Most of them walk past you without looking. That's the point of coming at six."
    },
    {
      "type": "description",
      "conditions": [
        {
          "type": "flag",
          "flag": "poster45_father",
          "value": true
        }
      ],
      "text": "Beside the shift board, a first-term poster is still pasted to the brick, faded almost white: your father's union card, HE ORGANIZED. SHE GOVERNS. Nobody in two years has taken it down."
    },
    {
      "type": "description",
      "conditions": [
        {
          "type": "flag",
          "flag": "poster45_office",
          "value": true
        }
      ],
      "text": "The gate wall where the first-term posters went up is bare brick. The Worker called them THE EMPTY WALLS. They still are."
    },
    {
      "type": "description",
      "conditions": [
        {
          "type": "flag",
          "flag": "poster45_family",
          "value": true
        }
      ],
      "text": "Someone has kept one of the first-term family posters. It is pinned inside the gatehouse window, the corner torn where Liora's face used to be."
    },
    {
      "type": "description",
      "conditions": [
        {
          "type": "flag",
          "flag": "widow_havelka_seen",
          "value": true
        }
      ],
      "text": "Someone says your name. Mrs. Havelka, older, with a granddaughter on her hip. You met her at the Sarenka pithead in your third week, beside a blanket on the ground. She remembers. She doesn't say anything else. She just stays where you can see her."
    },
    {
      "type": "dialogue",
      "character": "gregor_maric",
      "conditions": [
        {
          "type": "flag",
          "flag": "steel_trust_nationalized",
          "value": true
        }
      ],
      "text": "Your works now, Chancellor. State steel. The men call it 'her foundry'. Some of them mean it kindly."
    },
    {
      "type": "dialogue",
      "character": "gregor_maric",
      "conditions": [
        {
          "type": "flag",
          "flag": "steel_trust_broken",
          "value": true
        }
      ],
      "text": "Three companies since the Trust was broken up. The gate has three new nameplates. The men say the wages are the same and the foremen are younger."
    },
    {
      "type": "dialogue",
      "character": "gregor_maric",
      "conditions": [
        {
          "type": "flag",
          "flag": "steel_trust_subsidized",
          "value": true
        }
      ],
      "text": "The Trust still owns it, and we still pay the Trust to keep it lit. The men know whose money it is. They've stopped thanking anybody."
    },
    {
      "type": "dialogue",
      "character": "gregor_maric",
      "conditions": [
        {
          "type": "flag",
          "flag": "factory_abandoned",
          "value": true
        }
      ],
      "text": "Eleven of the men from the chemical plant fire work here now. The ones who got out. They know the army didn't come. Don't expect them to say good morning."
    },
    {
      "type": "dialogue",
      "character": "gregor_maric",
      "conditions": [
        {
          "type": "flag",
          "flag": "factory_rescued",
          "value": true
        }
      ],
      "text": "The tall one by the gate was pulled out of the chemical plant by army engineers. He shook my hand at the funerals and said to tell you he's voting for the Republic. I didn't ask him which party that meant."
    },
    {
      "type": "dialogue",
      "character": "gregor_maric",
      "conditions": [
        {
          "type": "flag",
          "flag": "cabinet58_cut_pensions",
          "value": true
        }
      ],
      "text": "The pension tranche came through in the end, three quarters late. Four of the widows on my ledger didn't live to see it. I keep their names in the back of the book."
    },
    {
      "type": "dialogue",
      "character": "gregor_maric",
      "conditions": [
        {
          "type": "flag",
          "flag": "coal83_rationed",
          "value": true
        }
      ],
      "text": "The night shifts they ran to dodge the power cuts last winter cost two men at Number Two mill. Burns. The men remember the cuts were fair. They remember the burns better."
    },
    {
      "type": "dialogue",
      "character": "gregor_maric",
      "text": "There's something you should hear from me, not from a newspaper. Vostane's office has a paper in a drawer: Number Three furnace closes in January. Nine hundred jobs. It was decided in September. Its release is scheduled for the week after the vote."
    },
    {
      "type": "monologue",
      "text": "Nine hundred coats in that grey current. Father poured steel at Number Three for twenty years, until the morning they came for him at the house instead. Somebody decided this furnace's date in September and decided to tell the men in November. That somebody works for me."
    }
  ],
  "choices": [
    {
      "id": "kravenstal102_tell_them",
      "text": "Walk to the gate and tell them yourself. Number Three, January, nine hundred jobs, and the date it was decided.",
      "internalTag": "reformist",
      "nextSegment": "seg_tell",
      "flags": [
        "kravenstal102_told_truth"
      ],
      "stateChanges": [
        {
          "stat": "personal.moralCompass",
          "operation": "add",
          "value": 10
        },
        {
          "stat": "factions.workersCoalition",
          "operation": "add",
          "value": -4
        },
        {
          "stat": "personal.publicImage",
          "operation": "add",
          "value": 3
        },
        {
          "stat": "personal.stressLevel",
          "operation": "add",
          "value": 8
        }
      ],
      "reactions": [],
      "chainTriggers": [],
      "codexUnlocks": []
    },
    {
      "id": "kravenstal102_keep_furnace",
      "text": "Keep Number Three lit. Telephone Vostane from the station: a winter subsidy, signed tonight, whatever it costs.",
      "internalTag": "populist",
      "nextSegment": "seg_keep",
      "flags": [
        "kravenstal102_furnace_saved"
      ],
      "stateChanges": [
        {
          "stat": "factions.workersCoalition",
          "operation": "add",
          "value": 8
        },
        {
          "stat": "nation.nationalDebt",
          "operation": "add",
          "value": 2
        },
        {
          "stat": "nation.economyHealth",
          "operation": "add",
          "value": -3
        },
        {
          "stat": "personal.moralCompass",
          "operation": "add",
          "value": -3
        }
      ],
      "reactions": [],
      "chainTriggers": [],
      "codexUnlocks": []
    },
    {
      "id": "kravenstal102_stay_quiet",
      "text": "Say nothing. Shake hands at the gate. The paper stays in Vostane's drawer until after the vote.",
      "internalTag": "pragmatist",
      "nextSegment": "seg_quiet",
      "flags": [
        "kravenstal102_kept_quiet"
      ],
      "stateChanges": [
        {
          "stat": "personal.moralCompass",
          "operation": "add",
          "value": -8
        },
        {
          "stat": "factions.workersCoalition",
          "operation": "add",
          "value": 2
        },
        {
          "stat": "personal.stressLevel",
          "operation": "add",
          "value": 6
        }
      ],
      "reactions": [],
      "chainTriggers": [],
      "codexUnlocks": []
    }
  ],
  "segments": {
    "seg_tell": {
      "narrative": [
        {
          "type": "description",
          "text": "You stand on the low wall by the gate, the one you used to sit on while you waited for him. No microphone. Marić tells the men nearest to pass it back. It takes four minutes for the grey current to stop and turn round."
        },
        {
          "type": "dialogue",
          "character": "katerin_ashavel",
          "text": "Number Three closes in January. Nine hundred jobs. It was decided in September. You were going to be told after the vote. You're being told now, because my father worked that furnace and he'd have wanted to know before he voted."
        },
        {
          "type": "description",
          "text": "Nobody cheers. A man near the front asks what happens to the nine hundred. You tell him the truth: the rail works at Brask are hiring three hundred, and you don't know about the other six. Someone shouts something about Kolvar. Someone else tells him to shut up."
        },
        {
          "type": "dialogue",
          "character": "gregor_maric",
          "text": "You've lost this street. You've also never been more its daughter. Those are both true. They'll argue about which one matters in the pubs until Wednesday."
        }
      ],
      "choices": [
        {
          "id": "kravenstal102_tell_end",
          "text": "Nine hundred jobs, told at the gate, before the vote. The street knows what I knew and when.",
          "nextSegment": null,
          "flags": [],
          "stateChanges": [
            {
              "stat": "factions.reformists",
              "operation": "add",
              "value": 4
            }
          ],
          "reactions": [],
          "chainTriggers": [],
          "codexUnlocks": []
        }
      ]
    },
    "seg_keep": {
      "narrative": [
        {
          "type": "description",
          "text": "Vostane picks up on the second ring. She listens to the whole sentence before she speaks."
        },
        {
          "type": "dialogue",
          "character": "elara_vostane",
          "text": "Eleven million to keep one furnace lit through a winter it can't pay for. Ten days before an election. The Voice will call it the most expensive leaflet in Veltrian history, and the Voice will be right. I'll have it on your desk by midnight."
        },
        {
          "type": "description",
          "text": "The subsidy is announced from the station steps. The night shift hears it from a newspaper boy by seven. By noon there's a chalk line on the works gate in a hand you don't know: HER FOUNDRY. It is not clear that it's meant kindly."
        },
        {
          "type": "monologue",
          "text": "Nine hundred jobs for one more winter. Father would have taken it and not asked who paid. He never had to sign the cheque. I've just learned what that difference is worth: eleven million kroner."
        }
      ],
      "choices": [
        {
          "id": "kravenstal102_keep_end",
          "text": "Number Three burns through the winter at ₭11 million. The gate says HER FOUNDRY in chalk.",
          "nextSegment": null,
          "flags": [],
          "stateChanges": [
            {
              "stat": "personal.publicImage",
              "operation": "add",
              "value": 2
            }
          ],
          "reactions": [],
          "chainTriggers": [],
          "codexUnlocks": []
        }
      ]
    },
    "seg_quiet": {
      "narrative": [
        {
          "type": "description",
          "text": "You stand at the gate for forty minutes and shake two hundred hands. They're cold, and most of them are friendly. One man tells you his father knew yours. You tell him that's good to hear. You don't tell him about the furnace."
        },
        {
          "type": "dialogue",
          "character": "gregor_maric",
          "text": "I'll be at the pithead the week the paper comes out, Chancellor. I'll tell them I knew. I won't tell them you knew. I haven't decided whether that's loyalty or cowardice. Don't help me decide."
        },
        {
          "type": "monologue",
          "text": "Two hundred hands. Nine hundred jobs in a drawer. Father's street, and I walked it like a candidate. I didn't knock on the door of the house. I don't think the house would have known me."
        }
      ],
      "choices": [
        {
          "id": "kravenstal102_quiet_end",
          "text": "Two hundred handshakes. The furnace stays in the drawer until Thursday.",
          "nextSegment": null,
          "flags": [],
          "stateChanges": [
            {
              "stat": "personal.marriageHealth",
              "operation": "add",
              "value": -2
            }
          ],
          "reactions": [],
          "chainTriggers": [],
          "codexUnlocks": []
        }
      ]
    }
  }
}
```

### raw JSON of existing Last Audience (`act6_week74_last_audience`, verbatim file content)

```json
{
  "id": "act6_week74_last_audience",
  "title": "The Last Audience",
  "act": 6,
  "weekAvailable": 74,
  "weekDeadline": 76,
  "type": "personal",
  "agendaCost": 1,
  "isMandatory": false,
  "location": "Morvec Estate — Aldenmoor",
  "characters": ["stefan_morvec", "aleksei_morvec"],
  "prerequisites": [],
  "narrative": [
    {
      "type": "description",
      "text": "The invitation is not from Stefan Morvec. It is from his physician, on Aldenmoor hospital paper, and it says only that Mr. Morvec has asked to see the Chancellor 'while there is still a Mr. Morvec to see her.'"
    },
    {
      "type": "description",
      "text": "The bedroom faces the harbor. The bed has been moved to the window so that he can watch the ships. There are fewer of them than there were last year. He is propped on four pillows, and the silver-tipped cane hangs from the bedpost where he can see it."
    },
    {
      "type": "description",
      "text": "Aleksei stands at the far window with his back to the room. He does not turn around when you come in. He has his father's shoulders and none of his father's stillness."
    },
    {
      "type": "dialogue",
      "character": "stefan_morvec",
      "conditions": [{ "type": "flag", "flag": "morvec_appeased", "value": true }],
      "text": "Katerin. You kept our arrangement. The estate exemption. Aleksei on the ports committee. Most people forget what they promised a dying man. You promised a healthy one. That was harder."
    },
    {
      "type": "dialogue",
      "character": "stefan_morvec",
      "conditions": [{ "type": "flag", "flag": "morvec_antagonized", "value": true }],
      "text": "Katerin. The last time we spoke you told me you were tearing my house down. Look around you. It is still standing. So am I, almost. That is not a reproach. I admire people who say what they intend. Most of them are dead."
    },
    {
      "type": "dialogue",
      "character": "stefan_morvec",
      "conditions": [{ "type": "flag", "flag": "morvec_threatened", "value": true }],
      "text": "Katerin. You once threatened to have Colonel Dusek arrest me before my car reached the gate. The colonel's brother is still alive, by the way. I thought you would want to know that the medicine I paid for worked."
    },
    {
      "type": "dialogue",
      "character": "stefan_morvec",
      "conditions": [{ "type": "flag", "flag": "oligarchs_destroyed", "value": true }],
      "text": "My lawyers tell me the 1958 contracts case will reach trial in the spring. My doctors tell me I will not. It is the first time in my life the two professions have disagreed in my favor."
    },
    {
      "type": "dialogue",
      "character": "stefan_morvec",
      "conditions": [{ "type": "flag", "flag": "smuggler_bribe_taken", "value": true }],
      "text": "There is a holding account with your name on it in my ledger. Twenty percent of a cigarette operation, paid quarterly. When I die, the ledger passes to my son with everything else. I tell you so that you understand what I am asking for, and what you are in no position to refuse."
    },
    {
      "type": "dialogue",
      "character": "stefan_morvec",
      "conditions": [{ "type": "flag", "flag": "smugglers_arrested", "value": true }],
      "text": "You sent police to my warehouse the same night you sat in it. I was offended for a week. Then I was impressed. Aleksei is still offended. He has a young man's memory."
    },
    {
      "type": "dialogue",
      "character": "stefan_morvec",
      "conditions": [{ "type": "flag", "flag": "cabinet58_shipping_levy", "value": true }],
      "text": "You taxed my ships. Fourteen million. Fair. I would have done it to me as well."
    },
    {
      "type": "dialogue",
      "character": "stefan_morvec",
      "text": "I did not ask you here to bargain over the past. I asked you here about him."
    },
    {
      "type": "dialogue",
      "character": "aleksei_morvec",
      "text": "I'm in the room, Father."
    },
    {
      "type": "dialogue",
      "character": "stefan_morvec",
      "text": "You are at the window. When you are in the room I will say so. Katerin, when I die, every man I have kept waiting for thirty years will come to collect from my son. The Halvekists. The harbor unions. The Lytheirans. Some of them will come with lawyers. Some will not. I want your word that the state will treat him as it treats any other citizen. No better. No worse."
    },
    {
      "type": "monologue",
      "text": "He is asking me for the one thing he spent his life making sure nobody else got: equal treatment. The old man is buying his son an ordinary life. He knows exactly how much it costs, because he's the reason it was ever for sale."
    }
  ],
  "choices": [
    {
      "id": "succession_give_word",
      "text": "Give him your word. Any other citizen: no better, no worse.",
      "internalTag": "personal",
      "nextSegment": "seg_word",
      "flags": ["morvec_succession_promised"],
      "stateChanges": [
        { "stat": "personal.moralCompass", "operation": "add", "value": 3 },
        { "stat": "morvecInfluence", "operation": "add", "value": 4 },
        { "stat": "factions.businessClass", "operation": "add", "value": 5 }
      ],
      "reactions": [],
      "chainTriggers": [],
      "codexUnlocks": []
    },
    {
      "id": "succession_take_ledger",
      "text": "The word has a price. \"Give me the ledger. All thirty years of it. Then he's an ordinary citizen.\"",
      "internalTag": "authoritarian",
      "nextSegment": "seg_ledger",
      "flags": ["morvec_succession_ledger_taken"],
      "stateChanges": [
        { "stat": "shadowInfluence", "operation": "add", "value": 12 },
        { "stat": "morvecInfluence", "operation": "add", "value": -10 },
        { "stat": "personal.moralCompass", "operation": "add", "value": -6 }
      ],
      "reactions": [],
      "chainTriggers": [],
      "codexUnlocks": []
    },
    {
      "id": "succession_refuse",
      "text": "Refuse. \"The law doesn't make promises at bedsides, Stefan. Not even to you.\"",
      "internalTag": "reformist",
      "nextSegment": "seg_refuse",
      "flags": ["morvec_succession_refused"],
      "stateChanges": [
        { "stat": "factions.reformists", "operation": "add", "value": 4 },
        { "stat": "morvecInfluence", "operation": "add", "value": -6 },
        { "stat": "factions.businessClass", "operation": "add", "value": -4 }
      ],
      "reactions": [],
      "chainTriggers": [],
      "codexUnlocks": []
    }
  ],
  "segments": {
    "seg_word": {
      "narrative": [
        { "type": "dialogue", "character": "stefan_morvec", "text": "Good. Then I have bought the only thing I could never afford. Aleksei. Come and shake the Chancellor's hand." },
        { "type": "description", "text": "Aleksei crosses the room. His handshake is dry and brief. He looks at you the way his father looked at the map of Veltria in your office: as something that will be his to manage soon." },
        { "type": "dialogue", "character": "aleksei_morvec", "text": "No better, no worse. I'll hold you to the first half, Chancellor. My father's friends will hold you to the second." },
        { "type": "description", "text": "Stefan Morvec dies eleven days later, at 04:20, facing the harbor. Four thousand people line the road to Aldenmoor Cathedral. Half of them work for the house. The other half came to make sure." },
        { "type": "monologue", "text": "I gave my word to the worst man I ever liked. Now it belongs to his son, who will spend it the way young men spend inheritances: all at once, and to prove something." }
      ],
      "choices": [
        {
          "id": "succession_word_end",
          "text": "Stefan is buried. My word passes to Aleksei with the rest of the estate.",
          "nextSegment": null,
          "flags": [],
          "stateChanges": [
            { "stat": "personal.stressLevel", "operation": "add", "value": 4 }
          ],
          "reactions": [],
          "chainTriggers": [],
          "codexUnlocks": []
        }
      ]
    },
    "seg_ledger": {
      "narrative": [
        { "type": "description", "text": "Stefan laughs until he coughs, and coughs until the nurse comes in, and waves her out again." },
        { "type": "dialogue", "character": "stefan_morvec", "text": "There she is. I wondered when you'd arrive. Aleksei, the green boxes in the vault. All nine. Have them in the Chancellor's car before she leaves." },
        { "type": "dialogue", "character": "aleksei_morvec", "text": "Father. Those are the house." },
        { "type": "dialogue", "character": "stefan_morvec", "text": "Those are the reasons people are afraid of the house. You will need to learn to be feared on your own, or not at all. Better you learn it now, while I'm here to watch." },
        { "type": "description", "text": "Nine green document boxes ride back to Ashenmere in the boot of your car. Thirty-one years of payments: judges, ministers, two Archbishops' secretaries, a Lytheiran trade attaché, and a deputy in your own Interior Ministry who is still drawing a salary. Stefan Morvec dies nine days later. Aleksei does not attend the reading of the will. He has already read it." },
        { "type": "monologue", "text": "Nine boxes. I own half the Halvek generation now, the way he did. I tell myself the boxes will stay closed. He told himself that too, the first year." }
      ],
      "choices": [
        {
          "id": "succession_ledger_end",
          "text": "Nine green boxes in the Chancellery vault. Aleksei will never forgive the price.",
          "nextSegment": null,
          "flags": [],
          "stateChanges": [
            { "stat": "shadowFootprint", "operation": "add", "value": 6 }
          ],
          "reactions": [],
          "chainTriggers": [],
          "codexUnlocks": []
        }
      ]
    },
    "seg_refuse": {
      "narrative": [
        { "type": "dialogue", "character": "stefan_morvec", "text": "No. Of course not. If you had said yes, I would have known you were frightened of me, and I would have died disappointed." },
        { "type": "description", "text": "Aleksei turns from the window at last." },
        { "type": "dialogue", "character": "aleksei_morvec", "text": "Then we understand each other, Chancellor. My father spent thirty years buying this family's safety. You've just told me it was never for sale. I'll find out what it costs another way." },
        { "type": "description", "text": "Stefan Morvec dies thirteen days later. The funeral is private. The house issues one statement, signed by Aleksei, announcing that 'the family's commitments to the Republic will be reviewed in full.' Three Aldenmoor shipping contracts with the state are cancelled the same week." },
        { "type": "monologue", "text": "I told a dying man the truth because it was the law. His son heard a declaration of war. Both of them were listening to the same sentence." }
      ],
      "choices": [
        {
          "id": "succession_refuse_end",
          "text": "No promise at the bedside. Three state contracts cancelled by the son before the mourning ends.",
          "nextSegment": null,
          "flags": [],
          "stateChanges": [
            { "stat": "nation.economyHealth", "operation": "add", "value": -3 }
          ],
          "reactions": [],
          "chainTriggers": [],
          "codexUnlocks": []
        }
      ]
    }
  }
}
```

