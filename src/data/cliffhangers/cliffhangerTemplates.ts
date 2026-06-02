// Cliffhanger templates — 52 weeks × 2+ variants each.
// Third-person limited. Present tense. Katerin's perspective as narration.
// Never resolves. Short. Ends on something unresolved — a sound, an image, a fact.

export interface CliffhangerContext {
  week: number
  flags: string[]
  economyHealth: number
  corruption: number
  publicOrder: number
  militaryReadiness: number
  pressFreedom: number
  marriageHealth: number
  halvekists: number
  workersCoalition: number
  reformists: number
  ironCovenant: number
  businessClass: number
  church: number
  dravenni: number
  vaelInfluence: number
  morvecInfluence: number
  stateOfEmergency: boolean
  seridaAlive: boolean
}

type CliffhangerTemplate = (ctx: CliffhangerContext) => string

export const CLIFFHANGER_TEMPLATES: Record<number, CliffhangerTemplate> = {

1: (ctx) => {
  if (ctx.workersCoalition > 60)
    return "That evening, Vyktor leaves a note on her desk. Three words: Watch the military. She locks it in her drawer. She doesn't sleep."
  if (ctx.flags.includes('bni_dissolved'))
    return "At 11pm, the private line rings once. When she answers, no one is there. Someone wanted to know she was home."
  return "She finds a personnel file on her desk before bed. Her own. The BNI compiled it in 1958. She doesn't read it. She doesn't throw it away."
},

2: (ctx) => {
  if (ctx.flags.includes('bni_dissolved'))
    return "At 11pm, the private line rings once. When she answers, no one is there. Someone wanted to know she was home."
  if (ctx.flags.includes('bni_reformed'))
    return "The first file she reads is forty-seven pages. The last entry is dated three weeks ago. The subject of the surveillance is Gregor Marić."
  return "The palace switchboard logs 47 hang-up calls between midnight and dawn. The operator says the router showed an Interior Ministry extension. The old one. The one that no longer exists."
},

3: (ctx) => {
  if (ctx.economyHealth < -20)
    return "The Krone falls another 0.3 points before markets close. No one mentions it at the afternoon briefing. She mentions it at the afternoon briefing. The room gets quiet."
  if (ctx.flags.includes('fiscal_tax_wealth'))
    return "Six corporate registration filings land at the Commerce Ministry overnight. All from Veltrian companies reincorporating abroad. Vostane's morning report calls it anticipatory capital mobility. She calls it something else."
  if (ctx.flags.includes('fiscal_austerity'))
    return "A junior analyst leaves a memo on Vostane's desk. Subject: Revenue projections — revised downward. The original memo was dated before her inauguration. Someone knew the numbers were wrong. Someone said nothing."
  return "Vyktor brings her the week's approved decisions. He circles one. Then another. He circles nothing else. He leaves the document on her desk. No note."
},

4: (ctx) => {
  if (ctx.flags.includes('vael_approached'))
    return "A car she doesn't recognize has been parked outside the residence since 8am. Serida says the plates are registered to a Vael Group transport subsidiary. It's still there at midnight."
  if (ctx.vaelInfluence < 15)
    return "He sends flowers for the inauguration. Three weeks late. The card says: When you're ready."
  return "Someone replaces the wilted inauguration flowers overnight. Same arrangement. Same vase. Same message on the card. She notices. She doesn't mention it in the morning."
},

5: (ctx) => {
  if (ctx.flags.includes('watchtower_shut_down'))
    return "The BNI building goes dark by 8pm for the first time in twenty-nine years. One window on the third floor stays lit. Dusek's office. She is still reading."
  if (ctx.flags.includes('watchtower_preserved'))
    return "Dusek receives a coded cable at 23:40. She reads it twice. She doesn't share it with Oberlin. She doesn't share it with anyone until morning. She learns about it from the night porter."
  return "The factory in Kravenstal has been occupied for eleven days. The workers have begun a garden in the central courtyard. Someone planted it. Someone brought seeds. She keeps thinking about that."
},

6: (ctx) => {
  if (ctx.flags.includes('watchtower_oversight'))
    return "The first judicial oversight panel convenes in private. The judges read the WATCHTOWER file for three hours. When they emerge, the chief justice's hands are trembling. She says nothing to the press."
  if (ctx.ironCovenant > 60)
    return "Two additional battalions drill near Fort Harlan. Dusek calls it scheduled exercises. Brenner calls it readiness review. The soldiers say they haven't seen their families in eight days."
  return "At 0400 hours, northern radar picks up four aircraft. They turn back at the border. The duty officer's log reads: They held position for seven minutes before withdrawal. Dusek's note in the margin: They wanted us to count."
},

7: (ctx) => {
  if (ctx.flags.includes('tyvaren_airspace_public_condemnation'))
    return "At 0200 hours, northern radar picks up three more aircraft. They turn back before crossing. Dusek's briefing note says: They wanted you to see them."
  if (ctx.flags.includes('tyvaren_backchannel_used'))
    return "The Arcturian ambassador cancels the scheduled meeting. No explanation. A rescheduled date is offered for six weeks from now. Vyktor says that is not accidental. He doesn't explain what it means. She doesn't ask."
  return "A coded cable arrives from the northern garrison. Movement on the Tyvaren side. Patterns that don't match any scheduled exercise. The watch commander calls it unusual nocturnal activity. He has been at this post for twelve years. He does not use words like unusual."
},

8: (ctx) => {
  if (ctx.flags.includes('vael_dinner_charmed'))
    return "The Winter Palace confirms her visit. Three hours later, two Vael Group lobbyists register with the Commerce Ministry. Three hours after that, a third. They are not waiting for the dinner."
  if (ctx.flags.includes('vael_rebuffed'))
    return "By noon, three business-friendly MPs cancel their committee appearances. By evening, the Chamber of Commerce releases a statement. It doesn't mention her name. It doesn't need to."
  return "She reads the intelligence file on Lucan Vael twice. There is a gap in it. Three years, 1951 to 1953. Nothing recorded. The gap is too clean to be an accident."
},

9: (ctx) => {
  if (ctx.economyHealth < -25)
    return "Vostane's quarterly projections arrive at midnight. She delivers them personally. She doesn't sit down. She says: I thought we had more time. She means years. She means decades."
  if (ctx.flags.includes('soren_immunity_revoked'))
    return "The order revoking Soren's immunity is signed. Filed. Sealed. She holds the pen for a long time before setting it down. Serida watches from the door. She has never seen her sign something she wanted to sign this badly. She has also never seen her hands shake after."
  return "The second leak happens today. Transport nationalization figures — not public yet — appear in a foreign ministry's internal circulation by noon. She signs the order for the inquiry at 11:30pm. She doesn't tell anyone she's signing it."
},

10: (ctx) => {
  if (ctx.publicOrder < 45)
    return "The Security Council requests an emergency session. Dusek's tone is different tonight. She asks if contingency relocation protocols should be reviewed. She doesn't call it evacuation. She doesn't need to."
  if (ctx.flags.includes('church_education_defended'))
    return "Archbishop Renek sends a bottle of wine from the Thornfeld vineyards. The card reads: For when it's over. It will be over. She puts it in the cabinet. She doesn't open it."
  return "Jonas leaves a note on her pillow. Handwritten. Three pages. She reads the first line: I have been trying to find the right time. She doesn't read the rest tonight. She puts it in the drawer with the things she is not ready to face."
},

11: (ctx) => {
  if (ctx.marriageHealth < 50)
    return "She comes home to find Tomas asleep on the couch in her study. He was waiting for her. He has been waiting for three hours. He drew a picture of the family while he waited. She is the smallest figure. Farthest from the center."
  if (ctx.church < 40)
    return "The Archbishop grants an interview to the Thornfeld Gazette. He says the government has lost its way. He says the Church will find it again. He doesn't say how. He doesn't need to."
  return "Theron tells her the drafting committee has hit its first real disagreement. He says it's about Article 7. He says it isn't really about Article 7. She asks what it's really about. He says: Who we're building this for."
},

12: (ctx) => {
  if (ctx.halvekists > 60)
    return "Kolvar's people are canvassing Thornfeld door-to-door. They aren't asking about policy. They're asking about her father. What did he believe. What did he tell her before he died. The questions are careful. Legal. Almost friendly. That is what scares her."
  if (ctx.vaelInfluence > 30)
    return "A Vael subsidiary buys a controlling stake in the Kravenstal Morning Post. The editorial page shifts overnight. Yesterday: cautious support for reform. Today: concerns about overreach. The article doesn't mention Vael."
  return "There are 16 days until the convention opens. Vyktor has a list of 22 possible disruptions. She reads through it twice. Number 14 she reads a third time. She doesn't ask him about it. Not yet."
},

13: (ctx) => {
  if (ctx.flags.includes('no_confidence_prep') || ctx.flags.includes('no_confidence'))
    return "She counts the votes again at 11pm. The numbers haven't changed. She counts them one more time. Then she turns off the light."
  if (ctx.businessClass < 35)
    return "The Business Council cancels its quarterly meeting. No explanation. No reschedule. Vostane calls it a negotiating tactic. Vyktor says tactics are what people use when they think they will win."
  return "Thirteen weeks. A quarter of the year. She writes a list of things she has done. One page. She writes a list of things she meant to do. Three pages. She burns the second list. Then she writes it again from memory."
},

14: (ctx) => {
  if (ctx.flags.includes('constitutional_convention_called'))
    return "Day one of the convention ends at 9pm. Theron calls her from the corridor. Something happened in the afternoon session. I need twenty minutes tomorrow morning before anyone else arrives."
  if (ctx.flags.includes('elena_ally'))
    return "Elena's first editorial runs in the morning edition. Supportive. Cautiously optimistic. By noon, four cabinet ministers have asked her about it separately. Each one asks differently. Each one means the same thing."
  return "The convention opens. Every faction is in the Great Hall. She watches from the gallery. Below her, thirty years of history is being unwritten in real time. Someone in the back row laughs at something Kolvar says. She doesn't hear what."
},


15: (ctx) => {
  if (ctx.stateOfEmergency)
    return "The emergency decree is signed. She holds the pen for a long time before setting it down. Serida watches from the door. She has never seen her sign something she didn't want to sign. Until tonight."
  if (ctx.flags.includes('theron_full_vision'))
    return "Theron works through the night. Sixteen hours without leaving his office. His assistant brings coffee. He doesn't look up. She brings dinner. He doesn't eat it. She asks if he is all right. He says: The preamble. I cannot get the preamble right."
  return "Dusek requests an unscheduled audit of the armories. Fort Harlan. Gravenmark. The reserve depots. She calls it routine inventory. Katerin asks if she expects to find something missing. Dusek says: I expect to find something extra."
},

16: (ctx) => {
  if (ctx.vaelInfluence > 30)
    return "Another dinner. Another set of Vael's suggestions delivered between courses. This time he mentions Tomas by name. Not a threat. A compliment. Tomas is doing well in school, he says. She didn't tell Vael where Tomas goes to school."
  if (ctx.flags.includes('kolvar_deal_struck'))
    return "Kolvar signs the agreement. The ink is still wet when he gives an interview to the Thornfeld Gazette calling the deal a necessary compromise to save the nation from radicalism. Vyktor reads the transcript. He says: He's already running against you in the next election. He's running on your deal."
  return "The Dravenni autonomy framework sits on her desk. Theron delivered it personally at 9pm. He said: Take your time. He meant: Do not take too long. She will read it tomorrow. She said that yesterday."
},

17: (ctx) => {
  if (ctx.church < 35)
    return "The Archbishop delivers his Sunday sermon. He doesn't name her. He doesn't need to. Some shepherds forget whose flock they serve. The congregation murmurs. The cameras capture it. Sunday evening. Her phone doesn't ring."
  if (ctx.flags.includes('accountability_provision_passed'))
    return "The accountability provision passes. Soren's immunity is revoked. In the gallery, the families of the disappeared sit very still. One of them — an old woman in the third row — is holding a photograph. She has been holding it for twenty years. She is still holding it."
  return "Soraya requests a private meeting. No aides. No minutes. She arrives with a single sheet of paper. On it: ten names. Workers arrested during the Halvek years. Still in prison. Still no trial. She says: You promised. She uses the past tense. The past tense is the point."
},

18: (ctx) => {
  if (ctx.economyHealth > -5)
    return "The economic indicators are improving. Slowly. Vostane allows herself a single optimistic sentence in her report: The worst is behind us, if we do not make it worse. She wonders what would make it worse. Vostane has already listed six things."
  if (ctx.flags.includes('stood_up_to_vael'))
    return "Vael's response arrives within forty-five minutes of her refusal. Handwritten. Expressing disappointment. The markets dip slightly in the afternoon. Someone leaked the news before her statement went out. The leak is the message. The message is: refusal has consequences."
  return "Midpoint of the parliamentary session. She reviews the legislation calendar. Twelve bills introduced. Three passed. Four stalled. Five more sitting in committee like patients waiting for a doctor who never comes."
},

19: (ctx) => {
  if (ctx.marriageHealth < 50)
    return "Jonas sleeps in the guest room. He says it's because she was working late and he didn't want to wake her. She wasn't working late. She was sitting in the dark. He knows. That's why he's in the guest room."
  if (ctx.publicOrder < 40)
    return "The refugee camps on the eastern border are at 180% capacity. The aid agencies have begun using the word unsustainable. It's the same word in every language. It means the same thing. It means: something is about to break."
  return "Liora calls at midnight. She never calls at midnight. I just needed to hear your voice, she says. She is lying. Something happened. She won't say what. Katerin lies awake until 3am. She doesn't call back. She should."
},

20: (ctx) => {
  if (ctx.flags.includes('budget_crisis_resolved'))
    return "The budget framework holds. For now. Vostane presents the revised numbers. Nobody got everything they wanted. Everyone got enough to survive. Vyktor leaves a note on her desk: The numbers work. The politics will follow. She is not sure she believes the second sentence."
  if (ctx.flags.includes('oligarch_meeting'))
    return "The oligarch meeting ends at midnight. Vael's final offer is seven pages. She reads it twice. She circles three clauses. She writes one word in the margin. No. She underlines it. She doesn't sleep."
  return "Liora sends a message through Jonas. She wants to meet. Not at the palace. Not with staff. Just the two of them. She doesn't say what it's about. Katerin knows before she asks."
},

21: (ctx) => {
  if (ctx.flags.includes('superpower_aligned_arcturian'))
    return "The Arcturian trade agreement is initialed. Ambassador Cole shakes her hand. His grip is firm. His smile is genuine. Behind him, his deputy is already on the phone. She catches the name of a Veltrian steel company. The deputy doesn't notice her noticing."
  if (ctx.flags.includes('superpower_aligned_orythian'))
    return "The Orythian military coordination pact is signed. Commissar Stahl doesn't smile. That's not his way. He says: Now we are partners. He says it the way other people say now you owe us."
  return "The halfway point of the term is approaching. She stands in front of the mirror in the private washroom. She practices the speech she will never give. The one where she admits what has gone wrong. She doesn't write it down. Some things cannot be written down."
},

22: (ctx) => {
  if (ctx.corruption < 45)
    return "Three more officials resign this week. Under investigation. The anti-corruption unit is working through a list of forty names. Forty names. Some of them are still in her government. She is reading about her own employees in the evening paper."
  if (ctx.flags.includes('nadia_investigation_endorsed'))
    return "Nadia Voss submits another records request. This one names a specific department head. A specific date. A specific transfer amount. She isn't fishing anymore. She knows where the bodies are buried. She's just waiting for permission to dig."
  return "Nadia's editorial runs in the evening edition. The headline: The Chancellor Who Could Not Choose. She reads it twice. She doesn't disagree with all of it. That is the worst part."
},

23: (ctx) => {
  if (ctx.dravenni > 50)
    return "The autonomy negotiations reach a preliminary framework. Kaelen sends a message: We are closer than we have ever been. He doesn't say close to what. Theron files the draft. He tells no one about the annex. The problematic one."
  if (ctx.flags.includes('tomas_nationalist_challenged'))
    return "Tomas comes home late. He doesn't say where he's been. She doesn't ask. She knows. The switching yards. The older boys. The Iron Covenant recruiters who call it mentorship and mean something else. He goes to his room. He doesn't say goodnight."
  return "The Morivask refugee count crosses a threshold no one wanted to name. The Sevagrad camp is at 180% capacity. Winter is three weeks away. The winterization supplies are at forty percent. Someone in Logistics writes a memo. Someone in Budget doesn't read it."
},

24: (ctx) => {
  if (ctx.reformists > 65)
    return "The Reformist caucus votes unanimously to table the constitutional draft. The galleries erupt. She watches from the side chamber. Her staff is celebrating. She is counting the votes she lost — not the ones she won. The difference is the margin of her survival."
  if (ctx.flags.includes('brenner_warning_received'))
    return "Brenner's private meeting ends at midnight. He used the word concerns six times. He used the word loyalties once. She notices the ratio. She notices everything about the way he said loyalties. The plural was deliberate."
  return "Twenty-four weeks. Half the mandate. Vyktor leaves a single sheet of paper on her desk: Tasks completed: 34. Tasks deferred: 22. Tasks impossible: 6. He doesn't explain the difference. She knows he doesn't need to."
},

25: (ctx) => {
  if (ctx.flags.includes('mole_clue_found'))
    return "Another document surfaces from the archives. This one mentions meetings between a senior staff member and an unnamed foreign contact. The dates match her cabinet meetings. Someone in this building was reporting on her. In real time. From this room."
  if (ctx.flags.includes('referendum_last_move_public'))
    return "The final address is recorded. Three minutes. Timed to the second. The studio lights dim. The technicians pack up. She sits in the empty studio for twenty minutes after everyone leaves. The chair is uncomfortable. She doesn't notice."
  return "A journalist from the Arcturian Times requests an interview. She has been investigating Veltrian politics for eight years. She asks three questions in her letter. One of them Katerin has never asked herself. She should have."
},

26: (ctx) => {
  if (ctx.flags.includes('referendum_won_decisive'))
    return "Sixty-point-seven percent. The numbers appear on the screen in the counting hall. Theron closes his eyes. He does not open them for a long time. When he does, he is crying. He is not embarrassed. He is not hiding it. He has been waiting for this since 1934."
  if (ctx.flags.includes('referendum_won_narrow'))
    return "Fifty-one-point-eight percent. Passed by fewer than thirty thousand votes. Kolvar has already filed challenges in three provinces. The certification will take weeks. The legal battles will take months. The war is over. The next one has already begun."
  return "Forty-six-point-three percent. The constitution does not pass. The counting hall empties by 3am. Theron is the last to leave. He stops at the door. He doesn't turn around. He says: I will be in my office tomorrow. He doesn't say why. She doesn't ask."
},

27: (ctx) => {
  if (ctx.flags.includes('referendum_won_decisive') || ctx.flags.includes('referendum_won_narrow'))
    return "The first morning under the new constitution. The palace feels different. Lighter. She notices things she hasn't noticed in months — the way the light hits the east corridor at 7am, the sound of the fountain in the courtyard, the silence where the Halvek portrait used to hang. Someone took it down overnight. She doesn't know who. She is grateful."
  if (ctx.seridaAlive)
    return "Serida knocks on the door at 11pm. She is holding a photograph. A young man in uniform. I have never shown this to anyone, she says. He was not a traitor. He was nineteen years old. She says his name. Volen. She says it the way you say a name when you are not sure anyone else remembers it."
  return "Tyvaren military radio traffic increases forty percent this week. Dusek classifies the intercepts above her clearance until analysis is complete. She receives a summary: Pattern consistent with pre-mobilization protocol. Pre-mobilization. The most terrifying prefix in any language."
},

28: (ctx) => {
  if (ctx.stateOfEmergency)
    return "The emergency provisions permit curfew in three provinces. Dusek recommends Thornfeld and Dravenhollow. She asks about Ashenmere. Dusek pauses. Not yet, she says. Not yet. She has already prepared the order."
  if (ctx.economyHealth < -25)
    return "The IMA representatives arrive at the Finance Ministry at 4am. They don't announce these visits. They simply appear. By 6am, Vostane is in her office with the door closed. By 7am, the phone in the Chancellery rings with a number she doesn't recognize. She lets it ring."
  return "The international press descends on Ashenmere. Correspondents from seven countries. They all want to know the same thing: is democracy in Veltria failing. She grants no interviews. She writes no statements. Her silence is the statement they will run anyway."
},

29: (ctx) => {
  if (ctx.flags.includes('vyktor_exposed'))
    return "The Dispatch runs the front-page story. Vyktor's BNI past. Nadia Voss's byline. Vyktor comes to her office at 7am. He doesn't knock. He has never knocked. His face is different. He says: You deserve a debrief. She already knows most of it. The parts she doesn't know are the parts that will change everything."
  if (ctx.marriageHealth < 35)
    return "Liora writes her a letter. A real letter. On paper. You seem very far away lately, it begins. Not geographically. That is all. That is enough. She reads it four times. She puts it in the drawer with the other things she cannot fix."
  return "Jonas stops leaving the light on. She comes home at midnight and the lamps are all off. He used to leave one on in the sitting room. The lamp is dark tonight. She doesn't know when he stopped. She doesn't ask."
},

30: (ctx) => {
  if (ctx.publicOrder < 35)
    return "Three nights of protests. Three nights of arrests. She watches the footage on a monitor in the secure briefing room. The faces in the crowd are young. Angry. Some of them are holding signs with her own campaign slogans. They still believe the words. They no longer believe her."
  if (ctx.flags.includes('vostane_defected'))
    return "Vostane appears on television standing next to Kolvar. Reading a prepared statement. She calls Katerin's economic policy unsustainable. She uses the word regrettably four times. Regrettably. The word you use when you want the record to show you felt bad about the betrayal."
  return "Tomas comes home with a black eye. Another student said his mother was a traitor. Tomas disagreed. He didn't tell her about it. The school called. She learns about her son's courage from the headmaster. She doesn't know whether to be proud or devastated. She is both."
},


31: (ctx) => {
  if (ctx.stateOfEmergency)
    return "The emergency decree is in its third week. She signs the extension at midnight. Vyktor is in the room. Dusek is in the room. Neither of them tells her to do it. Neither of them tells her not to. She signs it. She doesn't look at either of them."
  if (ctx.flags.includes('assassination_threat'))
    return "Security finds a note in the public gallery. Handwritten. Unsigned. Dusek takes it personally. She won't say what it says. She doubles the detail. She doesn't explain why. Katerin doesn't ask. Some answers are worse than the questions."
  return "The dreams are back. The ones where she is standing at the podium and her voice doesn't work. The crowd starts to leave — not angry, disappointed. The disappointment is worse. She wakes at 3am. She has been awake at 3am a lot lately."
},

32: (ctx) => {
  if (ctx.flags.includes('tyvaren_ultimatum'))
    return "Seventy-two hours. Vukov gave her seventy-two hours. She has used nineteen. Fifty-three remain. The clock on her desk has never been louder. She watches the second hand. It doesn't watch her back."
  if (ctx.militaryReadiness > 50)
    return "The mobilization order is drafted. Not signed — drafted. Dusek presents it alongside the diplomatic option. She doesn't recommend one over the other. She says: Both paths have costs. The costs of one path are measured in Krone. The other is measured in casualties. She lets the silence do the rest."
  return "The approval polls show forty-four percent. Vyktor leaves the newspaper on her desk without comment. The number is worse than last month. Not catastrophic. But worse. Downward trends are sticky, he says eventually. Upward trends require explanation. He doesn't offer one."
},

33: (ctx) => {
  if (ctx.flags.includes('soren_files_revealed'))
    return "The crate was mislabeled. Personnel Records — 1957 to 1959. It was not personnel records. It was execution orders. Signed. Stamped. Filed away like paperwork. Soren's signature is on forty-two of them. One of them is for her father's closest friend. She reads that one twice. She doesn't read anything else all night."
  if (ctx.flags.includes('no_confidence'))
    return "The whip count sits on her desk. Heavier than it looks. Seven votes short. Seven members who might be persuaded. She has been calling them personally. Five said maybe. Two didn't return her calls. She knows which two will decide the vote. She knew before she called."
  return "Kolvar gives an interview to the Thornfeld Gazette. He calls her government a failed experiment. He uses the past tense. Was. The interview runs on page three. She reads page three first. She always does."
},

34: (ctx) => {
  if (ctx.economyHealth < -30)
    return "The Krone falls below the psychological barrier. Vostane's briefing note is one sentence: Markets are pricing in a confidence deficit. Confidence deficit. Two words that mean: they do not believe in us anymore. They never did. They were just waiting for evidence."
  if (ctx.dravenni > 50)
    return "Kaelen sends a message through informal channels. Not a demand. Not a threat. A question: Should we still be waiting. The messenger doesn't stay for an answer. She doesn't have one to give."
  return "Jonas makes dinner. A simple meal. Soup. Bread. They eat in silence. It is the first meal they have shared in two weeks. He doesn't ask about work. She doesn't ask about his day. The silence is comfortable. That is what worries her."
},

35: (ctx) => {
  if (ctx.flags.includes('soren_trial_public'))
    return "Soren's trial dominates every front page. Every day, new testimony. New names. Some of the names are people she knows. Some of the stories are about her family. She attends as a private citizen. The gallery is full. No one looks at her. That is worse."
  if (ctx.marriageHealth < 40)
    return "Jonas has stopped waiting up. She comes home at midnight and the lights are off — all of them. He used to leave one lamp on. The lamp is dark tonight. She stands in the doorway of the bedroom for a long time. He is asleep. Or pretending. The difference doesn't matter."
  return "The public mood is shifting. She can feel it in the briefings, the calls, the way people look at her in the corridors. Less hope. More exhaustion. Reform fatigue, Vyktor calls it. She calls it something else. She doesn't say what."
},

36: (ctx) => {
  if (ctx.seridaAlive)
    return "The assassination attempt is three days behind her. She still flinches at loud noises. She still scans every crowd. Dusek briefs her on the investigation: one suspect, one weapon, one highly organized plan. She doesn't say next time. She doesn't need to."
  if (!ctx.seridaAlive)
    return "Serida's desk has been cleared. Someone did it overnight — she doesn't know who. The photograph of Volen is gone. The security logs are gone. The coffee cup she always used is still in the pantry. No one has touched it. No one knows if they should."
  return "Security briefings now include a section labeled Personal Protection. It wasn't there before. Someone decided it should be. She reads it every morning. She tries not to think about why it exists."
},

37: (ctx) => {
  if (ctx.flags.includes('coup_attempted'))
    return "The tanks came at 3:17am. She heard them before she saw them — tracked vehicles on cobblestone. You know the sound before anyone tells you what it means. Dusek called at 3:19. Her voice was steady. Brenner has moved. Three armored companies. The authorization is on her desk. She is still holding the pen."
  if (ctx.flags.includes('military_rallied_reformist'))
    return "Three thousand soldiers on the parade ground. Not an order, Dusek said — a request. She wanted to know who would stand with the constitutional government. Three thousand answered. The rest of the military is watching. Waiting to see which way the wind blows. The wind is still undecided."
  return "The coup was averted. Not defeated — averted. Defeated means they fought and lost. Averted means they decided not to fight. The people who decided not to fight are still in the military. Still in her government. Still believing what they believed. They just decided tonight was not the night."
},

38: (ctx) => {
  if (ctx.flags.includes('family_reckoning_resolved'))
    return "Jonas, Liora, and Tomas in the same room. The first time in months. Liora speaks first. I understand why you haven't been here. I don't like it. But I understand. Tomas is quieter. Near the end he says: I know you're trying. Four words. He's eight. Jonas doesn't say anything. He just stays. Sometimes staying is the only answer."
  if (ctx.flags.includes('soren_trial_public'))
    return "The verdict comes in at 4pm. Guilty. On seventeen of twenty-two counts. The gallery erupts. The families of the disappeared are weeping. Not with joy — with something older than joy. Something that has been waiting since 1958. She watches from the side chamber. She doesn't cry. She doesn't know why."
  return "The Dravenni question remains. Not unresolved — unaddressed. There is a difference. Kaelen sends another message. Shorter than the last. We are still here. She reads it five times. She doesn't respond. She doesn't know what to say."
},

39: (ctx) => {
  if (ctx.flags.includes('act3_climax_resolved'))
    return "Everything converged this week. Every crisis. Every decision. Every person who could have helped or hurt. She made the calls. She signed the orders. She doesn't know if any of it was right. She won't know for weeks. The not-knowing is the part that keeps her at her desk at 2am. The not-knowing is the part she can't delegate."
  if (ctx.seridaAlive)
    return "Serida stands at the window in the office. She is looking at the city. At the lights. At the darkness between them. Do you ever think about what you would be doing, she asks, if you had said no. Katerin doesn't answer. But she thinks about it. She thinks about it for a long time."
  return "First snow in Ashenmere. The city slows. The country doesn't. Three meetings tomorrow. Four the day after. She watches the snow fall through the Chancellery window. She doesn't feel the cold anymore. She isn't sure when that happened. She isn't sure what it means."
},

40: (ctx) => {
  if (ctx.flags.includes('government_in_exile'))
    return "She writes this from Stellamere. A borrowed office. A borrowed desk. Outside, the Arcturian capital goes about its business. A city that doesn't know or care that Veltria's legitimate government operates out of a converted conference room. Brenner's junta controls Ashenmere. The radio broadcasts martial music. She turns it off. She turns it on again."
  if (ctx.flags.includes('war_path_chosen'))
    return "The war begins at dawn. Tyvaren forces cross at three points. Gravenmark Pass. The Korven Forest. Dravenhollow. Dusek's forward positions are holding. She says they will not hold indefinitely. Indefinitely means days. Not weeks. Days. She signs the full mobilization order. Her hand doesn't shake. She doesn't know why."
  return "Forty weeks. She stands in the east gallery and looks at the portraits. Chancellor Marek. Chancellor Voronin. Chancellor Halvek. Three faces. Three legacies. One of them destroyed the country. One rebuilt it. One is still being judged. She will join them on this wall someday. She doesn't know what the judgment will be."
},

41: (ctx) => {
  if (ctx.flags.includes('reform_implementation_begun'))
    return "The constitutional court is established. Fourteen executive orders signed this morning. Each one a small piece of the transformation. Kolvar calls it a power grab disguised as reform. He isn't entirely wrong. Part of reform is taking power from people who had it. The difference is whose power. And why."
  if (ctx.tomasWellbeing > 60)
    return "Tomas gives a presentation at school. About democracy. About what his mother does. He speaks for fifteen minutes without looking at his cards. His teacher sends a note. He wrote about you, it says. She reads the note four times. She doesn't cry. Almost."
  return "Nine weeks remain. She starts making a list of what must be finished. Forty-seven items. She has time for perhaps twelve. She crosses out the ones that were never realistic — the promises made because she wanted to believe them, not because she had a plan. Half the list disappears in five minutes. The other half is the only half that ever mattered."
},

42: (ctx) => {
  if (ctx.flags.includes('austerity_begun'))
    return "The IMA conditions arrive. Forty-three pages. The word efficiency appears seventeen times. The word suffering appears zero. That ratio tells her everything. She has three options. Accept. Reject. Negotiate. She is negotiating. She doesn't know if it will work. She knows the alternative is accepting terms that undo everything she spent forty-two weeks building."
  if (ctx.flags.includes('war_phase_one_complete'))
    return "Phase one is over. Gravenmark holds. The Korven Forest is contested. Two thousand dead. Four thousand wounded. The numbers are preliminary — the final count will be worse. She spends the evening drafting letters to the families. Each letter is a small failure of language. No words make a death acceptable. She keeps writing anyway."
  return "The war continues. The map pins haven't moved in three days — a stalemate Dusek calls tactically advantageous. She visits a field hospital outside Ashenmere. The soldiers are young. Eighteen. Nineteen. One of them asks if they're going to win. She says yes. She says it with more certainty than she feels. The certainty is manufactured. The hope is not."
},

43: (ctx) => {
  if (ctx.marriageHealth > 55)
    return "Jonas makes coffee for two in the morning. He doesn't say anything. He just puts the second cup next to her briefing books. She drinks it. It's too hot and too bitter and exactly what she needs. She doesn't say thank you. She doesn't need to. Twenty years of marriage. He knows."
  if (ctx.marriageHealth < 45)
    return "The divorce papers are in the drawer. She hasn't opened the envelope yet. Jonas's handwriting on the front. Twenty-three years, reduced to an envelope. She doesn't open it tonight. She might not open it tomorrow. She might not open it at all. Some things you survive by not looking at them directly."
  return "She walks through the palace garden at dusk. The flowers are dying. Winter. But the roots are underground. Waiting. That's what a marriage is, she thinks. Not the flowers. The roots. Jonas is inside. He didn't come with her. He doesn't come with her anymore. But he is inside. That has to count for something."
},

44: (ctx) => {
  if (ctx.flags.includes('civilian_front_managed'))
    return "Sixty thousand civilians displaced. Bread shortages predicted in three weeks. She meets with the National Supply Committee. The numbers are worse than last week. Last week they were unacceptable. She gives them targets and quotas and the decisive language of a leader who doesn't have enough information. They believe her. She isn't sure she deserves to be believed."
  if (ctx.flags.includes('counter_coup_military'))
    return "She returns to Veltrian soil at midnight. A fishing vessel. The coast near Kravenstal. The textile mill outside town is her headquarters now — not a Chancellery, but a command post. Dusek's loyalists hold the district. The counter-offensive begins at dawn. She sleeps two hours on a cot. She doesn't dream."
  return "The reform backlash crests. Kolvar. Brenner. Renek. The business class. All pushing back simultaneously. Theron says the constitution was not designed to survive a hostile Assembly. It was designed to constrain one. She asks if it will hold. He says: It will hold as long as we do. We. Not the document. The people defending it."
},

45: (ctx) => {
  if (ctx.flags.includes('reform_backlash_resolved'))
    return "The backlash has crested. Six provisions survive intact. Four are modified. Two are shelved — not killed, postponed. The two shelved provisions are the ones Kaelen cared about most. She calls him. He is quiet. Then he says: The Dravenni are very good at waiting. We have had centuries of practice. He doesn't sound bitter. That is worse than bitterness."
  if (ctx.publicOrder < 35)
    return "The general strike begins at noon. Railways stop. Ports idle. Steel mills silent. Soraya Khaled calls it a necessary demonstration of the people's power. She wants Katerin to side with the strikers. The military wants her to break the strike. The country is at war. She has to choose. The choosing is the worst part."
  return "The constitutional ratification vote is scheduled for next week. Final counts show a three-vote margin. Three votes. Out of 250. Three people who haven't decided yet. Three people who will determine whether the past year meant anything. She has their names. She has their phone numbers. She hasn't called yet. She will. She is waiting for the right words. She doesn't know what the right words are."
},

46: (ctx) => {
  if (ctx.flags.includes('decisive_battle_fought'))
    return "The engagement at Gravenmark is underway. Dusek is in the field command post — not the Chancellery, not the Ministry. The field. Where the maps are marked in grease pencil. She takes calls every twenty minutes. Forward elements engaged. Left flank holding. Reserves committed. Each phrase is a translation. Behind each phrase: soldiers whose names she will learn when the casualty lists arrive."
  if (ctx.economyHealth > 0)
    return "The latest economic data shows growth. Actual growth. Not slower decline. Vostane brings the report herself. She doesn't smile — that's not her way. But she hands over the document with both hands, like it is something precious. It is. 0.7 percent. A very small number. The first positive number in four years."
  return "Six weeks. The clock in her office has become very loud. She doesn't remember when she started noticing it. Only that she hears it now, all the time. Ticking. Counting. Tomas asks at dinner if she's going to win the election. She says yes. He says: You don't sound sure. He's nine. He hears everything."
},

47: (ctx) => {
  if (ctx.flags.includes('new_order_established'))
    return "The final reform bill passes. Fifty-six percent. Twenty-three of thirty-five provisions implemented. Theron comes to her office after the vote. He looks older than he did this morning. We did something that will outlast us, he says. She asks if he is satisfied. He says: I am never satisfied. But I am less unsatisfied than I was."
  if (ctx.flags.includes('dark_path_chosen'))
    return "She signs the order at midnight. The authorization is on a separate document. This is not that document. Some decisions are made in rooms so dark that ordinary language cannot reach them. She makes the decision. She writes nothing else tonight. Some things cannot be written. She has learned that. She has learned it too well."
  return "The constitution enters its final stage. Theron works through the night. Again. His eyes are bloodshot. His hands shake slightly when he holds the draft. She tells him to rest. He says: After the vote. There is always another vote. That is Theron. That is the thing she has learned about him — he will work himself to death for this document because he believes it matters. He is probably right."
},

48: (ctx) => {
  if (ctx.flags.includes('war_victory'))
    return "The armistice is signed at noon. Vukov's signature next to hers. She looks at his face across the table. He looks at hers. Neither of them says anything. Dusek comes to her office afterward. Still in her field uniform. We held, she says. Katerin says: You held. Dusek says: You gave the orders that made holding possible. She doesn't know if that's true. She knows Dusek believes it."
  if (ctx.flags.includes('war_defeat'))
    return "The armistice is signed. The terms are not victory. The terms are survival. Gravenmark Pass is no longer Veltrian territory. The indemnity will take a generation to pay. She signs it. Her hand is steady. The steadiness is not courage. It is the absence of alternatives. She addresses the nation at 7pm. She says: we have lost the war but preserved the Republic. She doesn't know if she believes the second sentence."
  return "Tomas submits his school project. The topic: A Person I Admire. He didn't tell her what he wrote. His teacher sends a note: He wrote about you. She reads the note four times. She doesn't cry. Almost. She puts the note in the drawer with the things that matter. The drawer is getting full."
},

49: (ctx) => {
  if (ctx.marriageHealth > 55)
    return "Jonas walks with her through the palace gardens. No phone. No briefings. No aides. He holds her hand. The flowers are gone. Winter. But the roots are underground, waiting. That's what a marriage is. Not the flowers. The roots. He doesn't ask how she is. He doesn't need to. Twenty years. You stop needing to ask."
  if (ctx.marriageHealth < 45)
    return "The divorce papers are signed. She doesn't remember signing them. She remembers holding the pen. She remembers the way the light looked in her study at 2am. She doesn't remember the act of signing. The brain protects itself. She is grateful. She is also devastated. Both things are true. Both things live in the same body."
  return "Three weeks remain. She has started saying goodbye to this office in small ways. Touching the desk. Looking out the window longer than she needs to. Noticing things she has walked past every day for a year without really seeing. The portrait of her father. The coffee cup Serida brought her the first week. The crack in the ceiling that looks like the Dravenhollow coastline."
},

50: (ctx) => {
  if (ctx.publicOrder > 55)
    return "The streets are quiet. Not the quiet of repression — she remembers that from Halvek. The quiet of a people at peace. She is not naive enough to think it will last. But she is wise enough to appreciate it while it does. Two weeks remain. She submits the final budget review with her signature, not her stamp. Some things deserve a personal touch."
  if (ctx.economyHealth > 5)
    return "The final quarterly report arrives. Vostane delivers it herself. On the last page, at the very bottom, she has written something she has never written before: Recommendation: continue current trajectory. Four words. The closest thing to praise Vostane has ever given anyone. She puts the report in the drawer she will take with her."
  return "Two weeks. Her staff has started organizing files. Archiving records. Preparing for transition — whichever direction. Some of them look at her differently now. Like they are already saying goodbye. She is not ready. She is never ready. That is what she has learned this year — no one is ever ready. You do things because they need to be done."
},

51: (ctx) => {
  if (ctx.economyHealth > 10)
    return "Last full week. The economy is stronger than when she started. She walks through the palace at night — the long route, past the portraits of Chancellors who came before. Some governed well. Some governed poorly. All had a last full week. All wondered if they had done enough. She wonders that now. She will probably wonder it for the rest of her life."
  if (ctx.reformists > 60)
    return "Last full week. The reformist caucus holds a private dinner. They invite her. She goes. The room is full of people who were strangers a year ago and are now something like friends. Theron gives a toast. He says: She did what she said she would do. Mostly. The room laughs. She laughs. She almost means it."
  return "Last full week. She walks through the palace at night — something she has never done before. The portraits watch her. The furniture remembers. She stops at the window overlooking Republic Square. Tomorrow, the election. Tonight, the quiet. The terrible, final quiet. Tomas did his homework at the kitchen table tonight. Liora said goodnight and meant it. Something survived."
},

52: (ctx) => {
  if (ctx.economyHealth > 0 && ctx.publicOrder > 50)
    return "Fifty-two weeks. The last night as Chancellor — or the night before the campaign begins again. Either way, something ends tomorrow. She closes the report on her desk. The ledgers are balanced. The constitution is in force. The country is not what it was. It is not yet what it could be. But it is closer. She turns off the light. She doesn't look back."
  if (ctx.flags.includes('war_path_chosen'))
    return "The last night. The war is over. The reconstruction is beginning. She stands at the window of the Chancellery and looks at the city below. The lights are coming back on — one building at a time, one district at a time. Someone is singing in the street. She can't hear the words. She doesn't need to. She closes the diary. She doesn't know if she will ever open it again."
  return "Fifty-two weeks. The last page of the diary. The last night as Chancellor. Whatever happens tomorrow — the election, the counting, the concession or the victory — this year is over. This impossible, exhausting, extraordinary year. She closes the diary. She doesn't know if she will ever open it again. But she knows she will remember. Every word. Every choice. Every person she could not save. Every person she did."
},

}

