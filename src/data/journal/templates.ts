import type { JournalEntryMeta, JournalCategory, ChoiceAlignment } from '../../types/journal'

interface TemplateEntry {
  choiceId: string
  sceneId?: string
  category: JournalCategory
  title: string
  description: string
  icon: string
}

function entry(choiceId: string, category: JournalCategory, title: string, description: string, icon: string): TemplateEntry {
  return { choiceId, category, title, description, icon }
}

const TEMPLATES: TemplateEntry[] = [
  // ══════════════════════════════════════════════════════════════════════════════
  // ACT 1 — FOUNDATION (Weeks 1-13)
  // ══════════════════════════════════════════════════════════════════════════════

  // Inauguration choices
  entry('inaugural_reformist', 'reform', 'Delivered the Reform Mandate Address',
    '"I told them what I believe. Not what they wanted to hear. Every reformist in that chamber knows I meant it — and every Halvekist knows I will not be managed. Father\'s name was in every sentence I didn\'t speak."',
    '✦'),
  entry('inaugural_pragmatic', 'policy', 'Delivered a Balanced Inaugural Address',
    '"The speech Vyktor wrote. Conciliatory toward the old guard, hopeful toward the reformers. I said everything I was supposed to say. The question is whether I meant any of it."',
    '⚖'),
  entry('inaugural_unity', 'personal', 'Called for National Unity',
    '"Jonas said I looked like a Chancellor for the first time. I think he meant it as a compliment. The crowd cheered for unity — but crowds always cheer for unity. Governing it is harder."',
    '♥'),
  entry('inaugural_radical', 'reform', 'Delivered the Radical Vision Speech',
    '"I burned bridges before I crossed them. The Halvekists were stone-faced. The reformists were terrified. The workers cheered. If I cannot deliver on that speech, I will have made promises I cannot keep to people who have heard too many promises."',
    '✦'),

  // BNI Decision
  entry('bni_watchtower_preserve_secret', 'policy', 'Preserved the Watchtower Program — Secretly',
    '"Dusek told me the protocols were necessary. I believed her. I still believe her. But a secret surveillance program run by a security service I do not fully control is the kind of thing Halvek would have done. The difference is that I know it is wrong and I did it anyway."',
    '⚖'),
  entry('bni_abolish_immediately', 'reform', 'Abolished the Bureau of National Intelligence',
    '"Dusek\'s face when I told her — she looked at me like I\'d just handed the keys to Tyvaren. She may be right. But the BNI was a cancer. You do not treat cancer gradually."',
    '✦'),
  entry('bni_reform_restructure', 'policy', 'Reformed the BNI into the Bureau of Civic Accountability',
    '"A compromise that satisfied no one completely. The old guard lost their institution. The reformers wanted a purge. I gave them a transformation. History will judge whether that was wisdom or cowardice."',
    '⚖'),
  entry('bni_keep_restructured', 'policy', 'Restructured BNI Under New Leadership',
    '"I kept the machinery and changed the operators. Maren Tovik now runs what used to be Halvek\'s secret police. The irony is not lost on me."',
    '⚖'),

  // SSD Decision
  entry('ssd_create_directorate', 'policy', 'Established the State Security Directorate',
    '"Created a new security service to replace the one I abolished. Viktor Dorne now has a desk and a budget and a mandate that is deliberately vague. He asked me what I needed done. I told him I needed to know who my enemies were. He did not ask for clarification."',
    '⚖'),
  entry('ssd_reject_expansion', 'reform', 'Refused to Create a New Security Service',
    '"I will not replace one secret police with another. The BNI is abolished. The BCA will investigate. If that means we are slower to respond to threats, then we will be slower. Democracy is slower. That is the point."',
    '✦'),

  // Kolvar Opposition
  entry('kolvar_engage_parliament', 'policy', 'Engaged Kolvar Through Parliamentary Process',
    '"Drazen Kolvar smiled when I agreed to regular consultations. I do not trust that smile. But I trust the Assembly more than I trust my own instincts about which enemies to destroy and which to tolerate."',
    '⚖'),
  entry('kolvar_negotiate_backchannel', 'diplomacy', 'Opened Backchannel Negotiations with Kolvar',
    '"Vyktor arranged a meeting in a tea house in the old quarter. Kolvar arrived alone. I arrived alone. We talked for two hours about what a stable Veltria would look like. Our visions are incompatible. But we both want stability. For now, that is enough."',
    '◇'),
  entry('kolvar_override_executive', 'policy', 'Overrode Kolvar with Executive Authority',
    '"I used the powers Halvek left in the constitution against the man who helped write them. Kolvar was furious. The Reformists were delighted. I felt like I had won a battle in a war I did not start and do not know how to finish."',
    '⚖'),
  entry('kolvar_public_confrontation', 'crisis', 'Confronted Kolvar Publicly in the Assembly',
    '"I called him out in front of the entire chamber. Called him a relic. Called his party the obstacle to progress. The gallery erupted. The Herald ran the headline: ASHAVEL DECLARES WAR ON HALVEKIST OPPOSITION. It was not inaccurate."',
    '!'),

  // No Confidence Vote
  entry('no_confidence_fight_reformist', 'crisis', 'Fought No-Confidence Motion Through Reformist Coalition',
    '"I called in every favor, every alliance, every handshake deal I had made since taking office. It held. Barely. The margin was eleven votes. Eleven votes between governing and disgrace. I will not forget who voted with me — or who did not."',
    '!'),
  entry('no_confidence_fight_pragmatic', 'crisis', 'Defeated No-Confidence Motion with Pragmatic Deals',
    `"I traded committee assignments for votes. Three Halvekist backbenchers switched sides in exchange for positions. Vyktor called it 'governing.' Jonas called it 'buying survival.' He was not wrong."`,
    '!'),
  entry('no_confidence_deal_with_workers', 'crisis', 'Sided with Workers Coalition to Survive No-Confidence',
    '"Soraya Khaled saved my government. Her price was a labor reform bill that will cost the business class millions. They called it extortion. I called it the cost of survival. Gregor Marić called it justice. He may be the only one of us who is right."',
    '!'),
  entry('no_confidence_executive_power', 'crisis', 'Used Executive Powers to Survive No-Confidence',
    '"I instructed the Speaker that the motion was procedurally defective. It was not. Everyone knew it was not. But the constitution is vague and I used that vagueness to keep my government alive. Theron looked at me differently after that meeting. I deserved it."',
    '!'),

  // Social interactions
  entry('toast_unity', 'personal', 'Toast to National Unity at the Inaugural Ball',
    '"I raised my glass to a room full of people who had spent the last decade trying to destroy each other — and now they were applauding. The champagne was excellent. The unity was champagne-deep."',
    '♥'),
  entry('toast_reform', 'reform', 'Toast to Reform at the Inaugural Ball',
    '"I toasted to the future. Half the room raised their glasses. The other half raised their eyebrows. The division was visible. I think that was the point."',
    '✦'),
  entry('kolvar_charm', 'personal', 'Charmed Kolvar at the Ball',
    '"I gave him my warmest smile and my coldest handshake. He returned both. We spoke for three minutes about nothing at all and understood each other perfectly."',
    '♥'),

  // Vael meeting
  entry('vael_accept_investment', 'policy', 'Accepted Lucan Vael\'s Investment Offer',
    '"I told myself it was pragmatic. Jonas would tell me it was corruption. I did not tell Jonas. Vael\'s handshake was warm and dry and felt like signing a contract I had not read."',
    '⚖'),
  entry('vael_reject_investment', 'reform', 'Rejected Lucan Vael\'s Offer',
    '"He smiled when I said no. That smile worries me more than his anger would have. A man who smiles at rejection is a man who has other options. I need to find out what they are."',
    '✦'),
  entry('vael_negotiate_terms', 'policy', 'Negotiated Terms with Vael',
    '"I took his money with conditions attached. He took my conditions with a smile that said he had anticipated them. I am not sure who won that negotiation. I suspect Vael knows."',
    '⚖'),

  // Dravenni decisions
  entry('dravenni_language_recognition', 'reform', 'Granted Official Recognition to Dravenni Language',
    '"The Dravenni caucus wept. Actual tears, in the Assembly chamber. For a language, for a culture, for a people who had been told for fifty years that their words did not count. They count now. That is what governance looks like."',
    '✦'),
  entry('dravenni_status_quo', 'policy', 'Maintained Status Quo on Dravenni Issue',
    '"I deferred the Dravenni question. Again. Idris Kaelen\'s disappointment was quiet and thorough. He has been disappointed before. He has learned to wait. I do not know how much longer he will."',
    '⚖'),
  entry('dravenni_security_crackdown', 'crisis', 'Authorized Security Operations in Dravenhollow',
    '"Dusek deployed additional units to the Dravenhollow district. I authorized it. The optics are terrible — a Chancellor sending troops into a minority district. The security rationale is sound. The political rationale may destroy me."',
    '!'),

  // Church decisions
  entry('church_support_archbishop', 'diplomacy', 'Cultivated Alliance with Archbishop Renek',
    '"The Archbishop blessed my government. The faithful will follow his lead. I am now in debt to a man who believes my soul is in peril. He may be right about that."',
    '◇'),
  entry('church_maintain_separation', 'reform', 'Enforced Separation of Church and State',
    '"I refused to let the Church dictate policy. Renek was gracious in public and cold in private. The reformers applauded. The faithful prayed for my soul. I am not sure which group has more influence."',
    '✦'),

  // Budget decisions (Weeks 3, 20, 40)
  entry('budget_prioritize_military', 'policy', 'Prioritized Military Spending',
    '"Dusek got her modernization budget. The generals are pleased. The teachers are not. The hospitals are not. But a country that cannot defend itself cannot reform itself either. That is the argument I gave Elara. She did not disagree."',
    '⚖'),
  entry('budget_prioritize_welfare', 'reform', 'Expanded Social Welfare Programs',
    '"Gregor cried. Actually cried. A foundry foreman who has seen men lose limbs in industrial accidents and never shed a tear — and a welfare expansion made him weep in my office. It cost us 18 million we did not have. Worth every krone."',
    '✦'),
  entry('budget_prioritize_infrastructure', 'policy', 'Invested in Infrastructure Development',
    '"Roads. Bridges. Railways. Unsexy and essential. Jonas once told me that a country\'s character is revealed by what it builds. We are building connections. I hope that is a metaphor."',
    '⚖'),
  entry('budget_prioritize_education', 'reform', 'Increased Education Spending',
    '"Serida stopped by my office to thank me. Her daughter Mina\'s school is getting new textbooks. She said it was the first time she felt the government had actually done something for her family. I have not stopped thinking about that."',
    '✦'),

  // ══════════════════════════════════════════════════════════════════════════════
  // ACT 2 — CONSOLIDATION (Weeks 14-26)
  // ══════════════════════════════════════════════════════════════════════════════

  // Referendum
  entry('referendum_decisive_reach_out', 'reform', 'Reached Across the Aisle After Referendum Victory',
    '"The people spoke. Decisively. The temptation was to claim a mandate and govern alone. Instead I invited Kolvar to the palace. His surprise was genuine. His suspicion was also genuine. Trust is built in millimeters."',
    '✦'),
  entry('referendum_decisive_mandate_claim', 'policy', 'Claimed a Governing Mandate',
    '"Fifty-eight percent. A clear mandate to govern. I will not apologize for using the power the people gave me. The Halvekists had their turn. Now it is ours."',
    '⚖'),
  entry('referendum_decisive_quiet_exit', 'personal', 'Withdrew Quietly After Referendum',
    '"I did not celebrate. I went home. Jonas made tea. Tomas asked if we had won. I said yes. He asked if that meant people would stop being angry at me. I did not have an answer."',
    '♥'),

  // Constitutional convention
  entry('constitution_abolish_emergency_powers', 'reform', 'Removed Emergency Powers from the New Constitution',
    '"Article 47 is gone. The power that Halvek used to suspend civil liberties for seventeen years will not exist in the new Veltria. Theron wept when the vote passed. I almost did too."',
    '✦'),
  entry('constitution_retain_emergency_powers', 'policy', 'Retained Emergency Powers in the Constitution',
    '"I kept Article 47 — renamed, reformed, but still there. Theron argued against it for three hours. I told him I needed the option. I hope I never use it. The fact that I need to hope that tells me something I am not ready to hear."',
    '⚖'),
  entry('constitution_sign_reform', 'reform', 'Signed the Constitutional Reform Package',
    '"The stroke of a pen. That is all it took to replace a document that had sustained a dictatorship for thirty years. One pen stroke. History will note the date. I will note how my hand shook."',
    '✦'),

  // Labor reforms
  entry('labor_sign_worker_safety_act', 'legislation', 'Signed the Worker Safety Act',
    '"Gregor Marić wept. Actually wept. He said his father died in a factory collapse when Gregor was twelve. No inspection. No compensation. Just a funeral and a debt. This bill will not bring his father back. It will save someone else\'s."',
    '§'),
  entry('labor_veto_worker_safety_act', 'legislation', 'Vetoed the Worker Safety Act',
    '"The business delegation said it would cost too much. Elara agreed. The numbers did not work. I vetoed a bill that would have saved lives because the budget could not absorb the cost. I am a Chancellor. I am supposed to make the numbers work."',
    '§'),

  // Press freedom
  entry('press_protect_nadia_voss', 'reform', 'Protected Investigative Journalist Nadia Voss',
    '"The SSD wanted to surveil her. I refused. She will publish stories that damage my government. She may publish stories that damage me personally. That is the price of a free press. I am willing to pay it."',
    '✦'),
  entry('press_restrict_media', 'policy', 'Imposed Media Restrictions During Crisis',
    `"Elena Braskov called it an 'understanding.' I called it national security. The Herald will not run certain stories. The Standard will. The inequality of access creates a narrative I control. The narrative I control is not necessarily the truth."`,
    '⚖'),

  // Family decisions
  entry('family_attend_liora_graduation', 'personal', 'Attended Liora\'s University Graduation',
    '"She looked for me in the crowd. I was there, in the back row, with two security agents trying to look like relatives. She saw me. She smiled. It was the first time in months she looked at me like her mother instead of the Chancellor."',
    '♥'),
  entry('family_miss_graduation', 'personal', 'Missed Liora\'s Graduation for State Business',
    '"Jonas called. Liora would not speak to me on the phone. I was in a meeting about trade tariffs. I told myself the tariffs mattered more. I was wrong. The tariffs got resolved. The distance between me and my daughter did not."',
    '♥'),
  entry('family_support_tomas', 'personal', 'Supported Tomas Through Difficult Transition',
    '"His teachers say he is withdrawing. I see it too. He eats dinner in his room. He answers questions with single words. I am losing my son to the Chancellorship and I do not know how to get him back."',
    '♥'),
  entry('family_jonas_confrontation', 'personal', 'Confronted the Distance with Jonas',
    '"He showed me the list. Seventeen events I had missed. Seventeen moments when my family needed a wife and mother and got a Chancellor instead. He was not angry. He was documenting. That was worse."',
    '♥'),

  // ══════════════════════════════════════════════════════════════════════════════
  // ACT 3 — CRISIS (Weeks 27-39)
  // ══════════════════════════════════════════════════════════════════════════════

  // Economic crisis
  entry('economy_accept_ima_bailout', 'policy', 'Accepted IMA Bailout Conditions',
    '"I took the money. The conditions were brutal — austerity measures that will hurt the poorest Veltrians first. The alternative was default. I chose survival over pride. History may not forgive me. The bond markets already have."',
    '⚖'),
  entry('economy_reject_ima_bailout', 'crisis', 'Rejected IMA Bailout — Faced the Consequences Alone',
    '"I told the IMA envoy that Veltria would solve its own problems. He looked at me like I had just set fire to the Krone. The markets dropped 14 percent in three days. But no foreign institution will dictate Veltrian policy while I am Chancellor."',
    '!'),

  // The Betrayal — Vyktor
  entry('betrayal_vyktor_dismiss', 'crisis', 'Dismissed Vyktor Reznik After His Past Was Exposed',
    `"Twenty-two years of service. Dismissed in a twenty-minute meeting. He did not argue. He did not apologize. He said 'I understand' and walked out of my office and out of my government. The silence after the door closed was the loudest thing I have ever heard."`,
    '!'),
  entry('betrayal_vyktor_use_leverage', 'policy', 'Used Vyktor\'s Past as Leverage',
    '"I kept him. Not because I forgave him — because I needed him. A Vyktor who owes you his career is more useful than a Vyktor you have exiled. He knows I have this leverage. I know he knows. We are both pretending the old relationship still exists."',
    '⚖'),
  entry('betrayal_vyktor_ask_why', 'personal', 'Asked Vyktor Why He Did What He Did',
    '"He told me about 1948. About the colleague who was arrested and never returned. About choosing compliance over resistance because resistance meant his children would grow up without a father. I understood. I did not forgive. But I understood."',
    '♥'),
  entry('betrayal_vyktor_sleep_on_it', 'personal', 'Took a Night to Decide Vyktor\'s Fate',
    '"I did not sleep. I stared at the ceiling and thought about all the advice he has given me — which of it was genuine and which was the calculation of a survivor. At 4 AM I realized the two categories overlapped more than I wanted to admit."',
    '♥'),

  // Tyvaren Ultimatum
  entry('tyvaren_negotiate_vukov', 'diplomacy', 'Negotiated with Marshal Vukov',
    '"I sat across a table from a man who has threatened to invade my country. He offered terms that were designed to be refused. I refused them. But the fact of the meeting — the fact that we talked — changes the diplomatic calculus. War is harder to start when you have looked your enemy in the eye."',
    '◇'),
  entry('tyvaren_refuse_negotiation', 'diplomacy', 'Refused to Negotiate with Tyvaren',
    '"I will not sit at a table with a man who positions artillery on my border and calls it diplomacy. If Marshal Vukov wants to talk, he can withdraw his divisions first. He will not. So we will not talk."',
    '◇'),
  entry('tyvaren_mobilize_response', 'crisis', 'Mobilized Forces Against Tyvaren',
    '"I gave the order at 3 AM after three hours of deliberation. Eastern Command is now at full readiness. Forty thousand soldiers are looking across the Gravenmark Pass at forty thousand Tyvaren soldiers. The next move is Vukov\'s. I hope he does not make it."',
    '!'),

  // Dravenhollow Crisis
  entry('dravenhollow_negotiate_dlf', 'diplomacy', 'Negotiated with Dravenni Liberation Front',
    '"I met with the people my predecessor called terrorists. They called themselves freedom fighters. The truth is somewhere in between. We talked for six hours. We did not agree on everything. We agreed on enough."',
    '◇'),
  entry('dravenhollow_military_response', 'crisis', 'Responded with Military Force in Dravenhollow',
    '"I sent troops into a district of my own capital. The DLF attacked a police station. We responded with overwhelming force. The neighborhood is secured. The resentment is not. Every soldier deployed is a diplomat that failed."',
    '!'),

  // Nadia Voss Investigation
  entry('nadia_voss_cooperate', 'reform', 'Cooperated with Nadia Voss\'s Investigation',
    '"I opened the files. All of them. Nadia spent three days in the archives and emerged with a story that will damage this government. I told her to print it. She asked if I was sure. I said democracy is not about only revealing the truths that make you look good."',
    '✦'),
  entry('nadia_voss_obstruct', 'policy', 'Obstructed the Press Investigation',
    '"I classified the documents. National security grounds. The grounds were thin. Nadia knew they were thin. The public will not know what they are not told. I traded transparency for stability. The ledger is uneven."',
    '⚖'),

  // Coup attempt
  entry('coup_flee_stellamere', 'crisis', 'Fled to Stellamere During the Coup Attempt',
    '"I ran. The Chancellor of Veltria ran. Dusek got me to the Stellamere garrison while Brenner\'s forces occupied the palace. I am alive. I am also a Chancellor in exile. Being alive and being in office are not the same thing."',
    '!'),
  entry('coup_negotiate_brenner', 'crisis', 'Negotiated with General Brenner',
    '"I talked to a man who had just tried to overthrow my government. We negotiated for seven hours. He wanted amnesty and a role in the new cabinet. I gave him neither. I gave him a face-saving retirement and a promise of no prosecutions. He took it. I hated every word I said."',
    '!'),
  entry('coup_call_loyal_forces', 'crisis', 'Called Loyal Forces to Counter the Coup',
    '"Dusek rallied the 4th Rifle Division. They marched on the palace. Brenner\'s forces stood down rather than fire on their own. The coup collapsed in four hours. The price: Veltrian soldiers aimed weapons at Veltrian soldiers. That image will not leave me."',
    '!'),
  entry('coup_confront_directly', 'crisis', 'Confronted the Coup Leaders Directly',
    '"I walked into the command center alone. No guards. No weapons. Just the authority of the Chancellorship and the certainty that if they shot me they would have to explain to history why they murdered an unarmed woman. Brenner\'s officers lowered their weapons. Some of them apologized."',
    '!'),

  // ══════════════════════════════════════════════════════════════════════════════
  // ACT 4 — ENDGAME (Weeks 40-52)
  // ══════════════════════════════════════════════════════════════════════════════

  // Emergency Powers
  entry('emergency_powers_narrow', 'policy', 'Invoked Narrow Emergency Powers',
    '"I took the minimum authority I needed to address the immediate threat. Theron drafted the legal framework himself — ninety days, limited scope, Assembly oversight. The reformers are uneasy. The Iron Covenant is contemptuous. I am doing what I must."',
    '⚖'),
  entry('emergency_powers_broad', 'crisis', 'Invoked Broad Emergency Powers',
    '"I took everything the constitution allows. Decree powers. Military deployment authority. Press restrictions. Detention without charge. The Halvek constitution\'s emergency provisions, used by the woman who was supposed to abolish them. I know what I have become. I will live with it if the Republic survives."',
    '!'),
  entry('emergency_powers_refuse', 'reform', 'Refused to Invoke Emergency Powers',
    '"Theron handed me the executive order. I put my pen down. I will not govern by decree — not even to save my government. If the Republic falls because I refused to become a dictator, then the Republic was already lost."',
    '✦'),

  // Impeachment
  entry('impeachment_fight', 'crisis', 'Fought the Impeachment Articles',
    '"I stood in the Assembly and defended my record. Three hours of testimony. Corrosive. Exhausting. Necessary. The articles are baseless — but defending against them forces me to justify decisions that should speak for themselves. That is the point."',
    '!'),
  entry('impeachment_resign', 'personal', 'Resigned in the Face of Impeachment',
    '"I wrote the letter at my desk at 2 AM. Jonas was asleep. I did not wake him. My government. My failure. My signature. The Republic will survive me. That is the only consolation I have."',
    '♥'),
  entry('impeachment_declare_emergency', 'crisis', 'Declared State of Emergency to Survive Impeachment',
    '"I dissolved the Assembly. I invoked Article 47. The very provision I promised to abolish. The impeachment vote never happened because there is no Assembly to hold it. I have saved my government. I have also destroyed any pretense that this is still a democracy."',
    '!'),

  // War decisions
  entry('war_declare_tyvaren', 'crisis', 'Declared War on Tyvaren',
    '"I signed the declaration at sunrise. Dusek was already mobilizing. Brenner is in command of the Eastern Front. Forty thousand Veltrian soldiers are moving toward a border that may become a graveyard. I sent them. Every letter to a grieving family will be signed by me."',
    '!'),
  entry('war_pursue_peace', 'diplomacy', 'Pursued Peace with Tyvaren at Any Cost',
    '"The peace terms are humiliating. Territorial concessions. Demilitarization. Reparations. I accepted them because the alternative was a war we could not win. I have saved Veltrian lives. I have also surrendered Veltrian pride. History will argue over which mattered more."',
    '◇'),
  entry('war_orythian_alliance', 'diplomacy', 'Secured Orythian Military Alliance',
    '"The Orythian ambassador signed the mutual defense treaty at midnight. We now have the most powerful military in the region obligated to defend us. The price: Orythian bases on Veltrian soil for twenty years. I have traded sovereignty for security. The trade may be worth it."',
    '◇'),

  // All Fronts Crisis
  entry('all_fronts_military_priority', 'crisis', 'Prioritized Military Response to All-Fronts Crisis',
    '"I chose the military solution. The other problems — economy, diplomacy, reform — will wait. They may not survive the waiting. But a country that cannot defend itself has no other problems to solve."',
    '!'),
  entry('all_fronts_rotate_attention', 'policy', 'Rotated Attention Across All Crises',
    '"I divided my days into crisis segments. Morning: military briefing. Midday: economic stabilization. Afternoon: diplomatic outreach. Evening: reform maintenance. I am doing everything and nothing well. The alternative is to let something collapse entirely."',
    '⚖'),
  entry('all_fronts_lean_on_trusted', 'personal', 'Leaned on Trusted Advisors in Crisis',
    '"I delegated. Vyktor runs domestic policy. Dusek runs defense. Elara runs the economy. I trust them. I have to trust them. The Chancellorship is too large for one person to manage during a crisis. That realization is either wisdom or surrender."',
    '♥'),

  // Ending choices
  entry('ending_democratic_triumph', 'reform', 'Achieved Democratic Triumph',
    '"The constitution is signed. The emergency is over. The Assembly is functioning. Veltria has survived its transition and emerged as a democracy. My father\'s name is in the constitution — his execution, recorded as a crime of the former regime. He would have wanted this."',
    '✦'),
  entry('ending_benevolent_autocrat', 'policy', 'Became a Benevolent Autocrat',
    '"I rule by decree. The Assembly meets but does not decide. I have the power to do what needs to be done. The Republic is stable. The people are safe. The question — which I ask myself every night — is whether stability purchased with liberty is still stability."',
    '⚖'),
  entry('ending_war_victory', 'crisis', 'Led Veltria to Victory in War',
    '"We won. The Tyvaren army is shattered. The Gravenmark Pass is ours. Victory feels like relief more than triumph — the relief of survival. The cost: twelve thousand Veltrian dead. Victory parades do not mention the dead."',
    '!'),
  entry('ending_war_defeat', 'crisis', 'Presided Over Military Defeat',
    '"The armistice was signed in a tent outside Kravenstal. The Tyvaren general was gracious in victory. I was not gracious in defeat. The terms are catastrophic. I will be remembered as the Chancellor who lost the war. The history books will not mention that the war was unwinnable."',
    '!'),
  entry('ending_family_sacrifice', 'personal', 'Chose Family Over Power',
    '"I resigned. Not because I was forced — because I chose. Jonas, Liora, Tomas. They need a wife and mother more than Veltria needs a Chancellor. The Republic will find another leader. My family will not find another me."',
    '♥'),
  entry('ending_economic_collapse', 'crisis', 'Presided Over Economic Collapse',
    '"The Krone is worthless. The factories are closed. The people are hungry. I inherited a broken economy and I could not fix it. The historians will debate my policies. The families standing in bread lines will not."',
    '!'),

  // ══════════════════════════════════════════════════════════════════════════════
  // ASSASSINATION / STATE OF EMERGENCY (NEW)
  // ══════════════════════════════════════════════════════════════════════════════

  entry('cabinet_declare_emergency', 'crisis', 'Declared a State of Emergency After the Attack',
    '"I invoked Article 47. The same emergency powers Halvek used to dismantle democracy — now invoked by the woman elected to restore it. Dusek deployed troops domestically. The ironies multiply. I told myself it was temporary. Every dictator tells themselves that."',
    '!'),
  entry('cabinet_legal_channels', 'reform', 'Responded to the Attack Through Legal Channels',
    '"I did not declare an emergency. I did not suspend liberties. I directed the Interior Ministry to investigate and the courts to prosecute. The public feels unsafe. The Assembly is chaotic. But Veltria remains a democracy — and that, I hope, is the answer they tried to destroy."',
    '✦'),
  entry('cabinet_rally_nation', 'personal', 'Rallied the Nation After the Attack',
    '"I stood on the palace steps where they shot at me and told the people of Veltria that their Chancellor was not afraid. The crowd cheered. The cameras captured it. The Herald called it my finest moment. I was terrified. The crowd could not see my hands shaking."',
    '♥'),
  entry('cabinet_blame_tyvaren', 'diplomacy', 'Blamed Tyvaren for the Attack',
    '"I accused Marshal Vukov of ordering the attack. The evidence is ambiguous. The accusation is not. I have blamed a foreign power for an attack that may have been domestic. If I am wrong, I have started a diplomatic crisis based on a lie. If I am right, I have started a war."',
    '◇'),
  entry('cabinet_blame_tyvaren_thin', 'diplomacy', 'Blamed Tyvaren on Thin Evidence',
    `"I made the accusation without proof. The international community is skeptical. The Tyvaren ambassador called it a 'fabrication designed to justify repression.' I know he is partly right. I made the accusation anyway — because it gave the public an enemy to focus on."`,
    '◇'),

  entry('soe_extend_powers', 'policy', 'Extended the State of Emergency',
    '"I asked the Assembly for another ninety days. They granted it. The emergency is becoming permanent — not because the threat persists, but because the power is easier to keep than to surrender. Theron warned me about this. I did not listen."',
    '⚖'),
  entry('soe_let_expire', 'reform', 'Let the State of Emergency Expire',
    '"I let it go. The emergency powers expired at midnight. The Assembly resumed full authority. The troops returned to barracks. I proved — to Veltria and to myself — that I am not what I feared I was becoming. The attack did not make me a dictator."',
    '✦'),
  entry('soe_allow_protests', 'reform', 'Allowed Protests Against the Emergency',
    '"Fifteen thousand people gathered in Unity Square to protest the emergency I declared. I let them. My own voters, protesting my own policies. The irony was not lost on me. The democracy I claimed to be protecting was being exercised against me. That is exactly what democracy looks like."',
    '✦'),
  entry('soe_suppress_protests', 'crisis', 'Suppressed Protests Against the Emergency',
    '"I ordered security forces to disperse the crowd. They used water cannons. No one died. But the image of Veltrian police breaking up a peaceful protest against emergency rule will define this government. I crossed a line. I know I crossed it. I do not know if I can cross back."',
    '!'),

  entry('second_attack_declare_emergency', 'crisis', 'Declared Emergency After Second Attack',
    '"They struck again. A car bomb at a party office. No casualties, but the message was clear: unity did not stop them. I declared the emergency I should have declared eight weeks ago. The delay may have cost me the moral authority to use these powers."',
    '!'),
  entry('second_attack_double_down', 'reform', 'Refused Emergency Powers Despite Second Attack',
    '"They want me to panic. They want me to become the authoritarian they can use to justify more violence. I will not give them that. The investigation intensifies. The law holds. Veltria endures. If they strike again, they strike against a democracy that will not be cowed."',
    '✦'),

  entry('tyvaren_accept_mediation', 'diplomacy', 'Accepted Orythian Mediation with Tyvaren',
    '"I agreed to let the Orythians mediate. A third party in the room changes the dynamic. Vukov cannot posture as easily when a neutral observer is taking notes. The negotiations will be slow. They may fail. But we are talking — and as long as we are talking, we are not shooting."',
    '◇'),
  entry('tyvaren_mobilize_against', 'crisis', 'Mobilized Military Forces Against Tyvaren',
    '"I matched Vukov\'s mobilization with our own. Forty thousand troops on each side of the border. The Gravenmark Pass has become a line drawn in blood waiting to happen. Dusek says deterrence will hold. Dusek has been wrong before. So has Vukov."',
    '!'),

  entry('investigation_public_trials', 'reform', 'Ordered Public Trials for the Attack Conspirators',
    '"The trials will be public. Every piece of evidence. Every witness. Every uncomfortable truth about who knew what and when. The military will be embarrassed. The security services will be exposed. The truth will be known. That is worth whatever it costs."',
    '✦'),
  entry('investigation_quiet_handling', 'policy', 'Handled the Attack Investigation Quietly',
    '"The trials proceed but without spectacle. No press conferences. No public testimony. The conspirators will be convicted — but the public will not see the full picture of how close they came to succeeding. Some truths are dangerous. I have decided this one is."',
    '⚖'),

  // ══════════════════════════════════════════════════════════════════════════════
  // CABINET MEETINGS & POLICY DECISIONS
  // ══════════════════════════════════════════════════════════════════════════════

  entry('cabinet_support_dusek', 'policy', 'Backed Colonel Dusek in Cabinet Dispute',
    '"The military wanted more funding. The cabinet wanted more restraint. I sided with Dusek. She is the only person in this room who has actually fought for Veltria. Her judgment carries weight that her colleagues\' political calculations do not."',
    '⚖'),
  entry('cabinet_support_theron', 'reform', 'Backed Professor Theron in Cabinet Dispute',
    '"Theron argued for legal process over expediency. Every instinct told me to move faster. Theron told me to move correctly. I listened. The reforms will take longer. They will also last longer."',
    '✦'),
  entry('cabinet_overrule_objections', 'policy', 'Overruled Cabinet Objections',
    '"I heard their concerns. I made my decision anyway. A Chancellor who cannot overrule her cabinet is a Chancellor who is governed by her cabinet. I was elected to lead, not to facilitate consensus."',
    '⚖'),

  // ══════════════════════════════════════════════════════════════════════════════
  // BILL SIGN/VETO GENERIC
  // ══════════════════════════════════════════════════════════════════════════════

  entry('bill_sign_reform', 'legislation', 'Signed a Reform Bill into Law',
    '"The pen touched the paper and the law changed. It is that simple and that profound. A vote in the Assembly, a signature in my office, and millions of lives are altered. I try to remember that every time I sign."',
    '§'),
  entry('bill_veto_reform', 'legislation', 'Vetoed a Reform Bill',
    '"I sent it back to the Assembly with my objections. They had the votes to override — if they chose. They chose not to. A veto is a statement. Sometimes the statement is: I am willing to be unpopular in service of what I believe."',
    '§'),
  entry('bill_sign_compromise', 'legislation', 'Signed a Compromise Bill',
    '"No one got everything they wanted. Everyone got something. That is what compromise looks like — and compromise is what governing looks like. The bill is imperfect. So is democracy."',
    '§'),
  entry('bill_sign_emergency', 'legislation', 'Signed Emergency Legislation',
    '"This bill passed the Assembly in three days. Normally it would have taken three months. The crisis has accelerated governance — for better and for worse. Speed is not a substitute for deliberation, but deliberation is a luxury we cannot currently afford."',
    '§'),

  // ══════════════════════════════════════════════════════════════════════════════
  // DIPLOMATIC INITIATIVES
  // ══════════════════════════════════════════════════════════════════════════════

  entry('diplomacy_arcturian_alliance', 'diplomacy', 'Forged an Alliance with Arcturia',
    '"The Arcturian trade minister signed the agreement without hesitation. They want access to our steel. We want their technology. A transaction dressed as an alliance. Both sides know the truth. Both sides signed anyway."',
    '◇'),
  entry('diplomacy_orythian_partnership', 'diplomacy', 'Secured Orythian Partnership',
    '"The Orythians are the regional power. Having them as a partner rather than a rival changes everything. They will not fight our wars for us, but they will ensure that anyone who fights us fights them too. That is deterrence."',
    '◇'),
  entry('diplomacy_lytheiran_trade', 'diplomacy', 'Negotiated Lytheiran Trade Agreement',
    '"Lytheira wants our agricultural exports. We want their manufactured goods. The agreement is straightforward and mutually beneficial — which means it will probably be controversial in the Assembly."',
    '◇'),
  entry('diplomacy_morivask_refugees', 'diplomacy', 'Addressed the Morivask Refugee Crisis',
    '"Twenty thousand refugees at our border. Women, children, families fleeing a war we did not start. Turning them away would be politically safe. Accepting them is morally right. I chose what was right. The political cost will come due eventually."',
    '◇'),

  // ══════════════════════════════════════════════════════════════════════════════
  // SECURITY & MILITARY
  // ══════════════════════════════════════════════════════════════════════════════

  entry('military_modernize_forces', 'policy', 'Modernized the Veltrian Armed Forces',
    '"Dusek presented a five-year modernization plan. I approved the first phase. New equipment. Better training. Professional development. The military is becoming a modern fighting force. The cost is enormous. The alternative — fighting with Halvek-era equipment — is worse."',
    '⚖'),
  entry('military_restrict_operations', 'reform', 'Restricted Military Operations to Constitutional Limits',
    '"I issued an executive order clarifying that the military operates only under civilian authority and only within constitutional boundaries. Dusek signed it without comment. Brenner\'s response was less accommodating. The distinction between civilian control and civilian interference is thin."',
    '✦'),
  entry('security_expand_surveillance', 'policy', 'Expanded Domestic Surveillance Capabilities',
    '"The SSD\'s monitoring capacity is now operational. I know more about potential threats than any Chancellor before me. I also know more about ordinary citizens than any democratic leader should. The database grows by the hour. So does my discomfort."',
    '⚖'),

  // ══════════════════════════════════════════════════════════════════════════════
  // PROJECT DECISIONS
  // ══════════════════════════════════════════════════════════════════════════════

  entry('project_kravenstal_approved', 'policy', 'Approved Kravenstal Steel Modernization',
    '"The Kravenstal foundries are the heart of Veltrian industry. Modernizing them will cost 85 million and take forty weeks. It will also employ thousands and produce steel that can compete internationally. Serida\'s husband works in one of those foundries. I thought about that when I approved the budget."',
    '⚖'),
  entry('project_university_approved', 'reform', 'Approved University Expansion Program',
    '"Liora will attend one of these universities. She does not know I approved the expansion. When she finds out, she will either be proud or accuse me of using my office for personal projects. She will be right either way."',
    '✦'),
  entry('project_sevagrad_fortified', 'policy', 'Approved Sevagrad Fortification',
    '"The Sevagrad border fortifications are now complete. Forty kilometers of reinforced positions facing Tyvaren. Dusek says it will deter aggression. I hope she is right. I hope we never need to find out."',
    '⚖'),
  entry('project_electrification_rural', 'reform', 'Approved Rural Electrification Program',
    '"Sixty percent of rural Veltria has no electricity. This project will change that. Lights in villages that have known only darkness. Refrigeration for food that would have spoiled. Schools that can operate after sunset. This is not grand strategy. This is what governance actually looks like."',
    '✦'),

  // SOREN PLOTLINE
  entry('soren_immunity_revoke', 'reform', 'Included Accountability Provision in Constitutional Draft',
    '"Theron\'s eyes lit up when I said yes. He has been waiting thirty years for someone to say yes. The Halvekists will fight it. The military will resent it. But the constitution will say what it needs to say: no one is above the law. Not even the man who killed my father."',
    '✦'),
  entry('soren_immunity_preserve', 'policy', 'Preserved Soren\'s Constitutional Immunity',
    '"I let him keep his shield. The peace agreement that made my government possible also protects the man who may have ordered my father\'s death. That is the contradiction at the heart of this Chancellorship. I am learning to live with contradictions."',
    '⚖'),
  entry('soren_debate_push_through', 'reform', 'Pushed Accountability Provision Through Assembly Despite Walkout Threats',
    '"The Halvekists walked out. Kolvar called it a betrayal. The military is watching. But the provision passed. Gavril Soren is no longer immune. That feels like something my father would have wanted. I hope it is."',
    '✦'),
  entry('soren_debate_compromise', 'policy', 'Passed a Compromised Accountability Provision',
    '"We limited the provision to acts of violence and repression. Soren can be investigated for the executions but not for his administrative role. It is half-justice. Half-justice is better than none. That is what I told myself. I am not sure I believe it."',
    '⚖'),
  entry('soren_debate_withdraw_provision', 'policy', 'Withdrew the Accountability Provision to Preserve the Convention',
    '"I traded Soren\'s accountability for the Halvekists\' participation in the constitutional process. The constitution will be more broadly supported. Soren will remain protected. I told myself it was the right trade. The Dravenni caucus disagreed."',
    '⚖'),
  entry('brenner_reassure_constitution', 'reform', 'Reassured the Military About the Accountability Provision\'s Scope',
    '"I gave Brenner my word that the military is not on trial. I meant it. The officer corps is uneasy but contained. Soren\'s investigation proceeds. The distinction between military service and criminal orders is clear. I hope it stays that way."',
    '✦'),
  entry('brenner_stand_firm', 'policy', 'Stood Firm Against Military Pressure Over Soren',
    '"Brenner did not threaten me directly. He did not need to. The message was clear: touch Soren and risk the military\'s loyalty. I touched Soren anyway. Sometimes the right decision is also the dangerous one."',
    '⚖'),
  entry('soren_files_acknowledge_personal', 'personal', 'Discovered Soren Signed Mikhael Ashavel\'s Execution Order',
    '"He signed the paper. One signature, and my father was dead. I held the document in my hands. His handwriting. His ink. Am I a Chancellor seeking justice, or a daughter seeking revenge? Does it matter?"',
    '♥'),
  entry('soren_files_seal_personal', 'personal', 'Temporarily Sealed the Execution Documents',
    '"I could not look at my father\'s death warrant and make a rational decision. I asked for time. Theron looked disappointed. Oberlin looked concerned. They do not understand what it feels like to hold the paper that ended your childhood. I hope they never do."',
    '♥'),
  entry('soren_trial_public', 'reform', 'Ordered Gavril Soren\'s Arrest and Public Trial',
    '"I gave the order at dawn. By noon, Soren was in custody. By evening, the nation knew. The trial will be the largest in Veltrian history. Brenner warned me about the military. I heard him. I made my choice anyway."',
    '✦'),
  entry('soren_trial_plea_deal', 'policy', 'Offered Soren a Private Plea Deal',
    '"He confessed. Quietly, in his study, over tea. No cameras. No spectacle. The truth is recorded for history. The nation is spared the trauma of a public trial. Justice done, but gently. I do not know if gently is the same as justly."',
    '⚖'),
  entry('soren_trial_leave_alone', 'policy', 'Chose Not to Prosecute Soren — Left Him in Peace',
    '"I let him go. The peace agreement stands. The nation does not confront its past. The Dravenni will not forgive this. The reformists will not forget. But the military will not revolt. Sometimes the right thing and the safe thing are not the same. I chose safe."',
    '⚖'),
  entry('soren_trial_release_files', 'reform', 'Released the Soren Files to the Public',
    '"Every document. Every order. Every signature. The press has them all. Soren is not arrested but he is destroyed. His name will be synonymous with atrocity for generations. I did not punish him. I did something worse — I let the truth do it for me."',
    '✦'),
  entry('soren_trial_leverage', 'policy', 'Used the Threat of Prosecution to Leverage Soren\'s Endorsement',
    '"He smiled when he agreed. The smile of a man who recognized the game I was playing — because he invented it. Soren endorsed my government. The Halvekists are confused and compliant. I traded justice for political stability. The trade worked. I hate myself for making it."',
    '⚖'),
  entry('soren_aftermath_reconciliation', 'reform', 'Established Truth and Reconciliation Commission',
    '"The trial is over. Soren is in prison. But justice is not just about punishment — it is about ensuring this never happens again. The Commission will document every crime, every victim, every order. Veltria will remember."',
    '✦'),
  entry('soren_aftermath_prosecute_further', 'reform', 'Authorized Full Prosecutions Against Halvek Inner Circle',
    '"Soren was the first. He will not be the last. Every surviving member of the Halvek inner circle will face justice. The era of impunity is over. Some will call it a purge. I call it accountability."',
    '✦'),
  entry('soren_plea_accept', 'policy', 'Accepted Soren\'s Private Confession and Closed the Case',
    '"The truth is archived. Soren will serve his sentence quietly. The public will not get the trial they wanted. But the nation is stable and the historical record is complete. Half-justice is still justice. That is what I will tell myself."',
    '⚖'),
  entry('soren_files_let_history_decide', 'reform', 'Let the Released Files Speak for Themselves',
    '"I did not arrest Soren. I did not need to. The files did the work. His reputation is in ashes. The military cannot defend a man whose crimes are documented on every front page in Veltria. The truth, it turns out, is a more effective prosecutor than any court."',
    '✦'),
  entry('soren_leverage_own_it', 'policy', 'Lived with the Consequences of the Devil\'s Bargain',
    '"I made a deal with the man who killed my father. He endorsed me. I protected him. The Halvekists fell in line. The government is stronger than ever. And every morning I look in the mirror and see a Chancellor who became what she fought."',
    '⚖')
];

function guessCategory(sceneTitle: string, choiceTag: ChoiceAlignment): JournalCategory {
  const t = sceneTitle.toLowerCase()
  if (t.includes('war') || t.includes('attack') || t.includes('coup') || t.includes('crisis') || t.includes('confront')) return 'crisis'
  if (t.includes('diplom') || t.includes('ambassador') || t.includes('treaty') || t.includes('alliance') || t.includes('foreign') || t.includes('border')) return 'diplomacy'
  if (t.includes('family') || t.includes('jonas') || t.includes('liora') || t.includes('tomas') || t.includes('ball') || t.includes('dinner')) return 'personal'
  if (t.includes('bill') || t.includes('act') || t.includes('law') || t.includes('sign') || t.includes('veto')) return 'legislation'
  if (t.includes('reform') || t.includes('constitution') || t.includes('rights') || t.includes('freedom')) return 'reform'
  if (choiceTag === 'reformist') return 'reform'
  if (choiceTag === 'personal') return 'personal'
  return 'policy'
}

function guessTitle(sceneTitle: string, choiceTag: ChoiceAlignment): string {
  const tagLabels: Record<string, string> = {
    reformist: 'Reformist Approach',
    pragmatist: 'Pragmatic Decision',
    authoritarian: 'Authoritarian Measure',
    populist: 'Popular Mandate',
    personal: 'Personal Decision',
    deflect: 'Strategic Deflection',
  }
  const tag = tagLabels[choiceTag] ?? 'Decision'
  const shortTitle = sceneTitle.length > 60 ? sceneTitle.slice(0, 57) + '...' : sceneTitle
  return `${tag}: ${shortTitle}`
}

function guessDescription(sceneTitle: string, choiceTag: ChoiceAlignment): string {
  const descriptions: Record<string, string> = {
    reformist: `"I chose principle over expediency. The path of reform is slower but more durable. The people will see the results — eventually. The question is whether they will see them before the next crisis."`,
    pragmatist: `"I made the practical choice. Not the most principled, not the most popular — the one that worked. Vyktor would approve. I am not sure I do."`,
    authoritarian: `"I used the powers of this office decisively. Some will call it overreach. I call it leadership. The distinction depends entirely on whether the outcome justifies the means."`,
    populist: `"I did what the people wanted — or what I believe they wanted. Public support is the currency of democratic governance. I have spent some of it today. I hope the investment pays off."`,
    personal: `"This decision was not political. It was human. It will not appear in the policy briefs or the news analysis. But it will appear in my memory — and in the lives of the people it affected."`,
    deflect: `"I redirected the pressure. The immediate crisis is deferred. The underlying problem remains. Deflection is not resolution — but sometimes it buys the time needed to find one."`,
  }
  const t = sceneTitle.toLowerCase()
  if (t.includes('war') || t.includes('battle') || t.includes('conflict')) {
    return `"War does not announce itself politely. It arrives as a series of decisions that each seem necessary until suddenly you are signing mobilization orders and praying for the soldiers whose names you do not yet know."`
  }
  return descriptions[choiceTag] ?? descriptions.pragmatist
}

const ICONS: Record<string, string> = {
  reformist: '✦',
  pragmatist: '⚖',
  authoritarian: '!',
  populist: '△',
  personal: '♥',
  deflect: '↗',
}

export function getJournalTemplate(
  choiceId: string,
  sceneTitle: string,
  choiceTag: ChoiceAlignment,
): JournalEntryMeta {
  const match = TEMPLATES.find(t => t.choiceId === choiceId)
  if (match) {
    return {
      title: match.title,
      description: match.description,
      icon: match.icon,
    }
  }
  return {
    title: guessTitle(sceneTitle, choiceTag),
    description: guessDescription(sceneTitle, choiceTag),
    icon: ICONS[choiceTag] ?? '●',
  }
}

export function getJournalCategory(
  choiceId: string,
  sceneTitle: string,
  choiceTag: ChoiceAlignment,
): JournalCategory {
  const match = TEMPLATES.find(t => t.choiceId === choiceId)
  if (match) return match.category
  return guessCategory(sceneTitle, choiceTag)
}
