import type { JournalEntryMeta, JournalCategory } from '../../types/journal'

interface ChoiceTemplate {
  title: string
  category: JournalCategory
  reflection: string
  icon: string
}

interface SceneTemplate {
  sceneId: string
  choices: Record<string, ChoiceTemplate>
}

export const SCENE_JOURNAL_TEMPLATES: SceneTemplate[] = [

  // ══════════════════════════════════════════════════════════════════════════════
  // ACT 1 — FOUNDATION
  // ══════════════════════════════════════════════════════════════════════════════

  {
    sceneId: 'act1_week1_inauguration',
    choices: {
      'inaugural_reformist': {
        title: 'Delivered the Reform Mandate Address',
        category: 'reform',
        reflection: 'I told them what I believe. Not what they wanted to hear. Father\'s name was in every sentence I did not speak.',
        icon: '✦',
      },
      'inaugural_pragmatic': {
        title: 'Delivered a Balanced Inaugural Address',
        category: 'policy',
        reflection: 'The speech Vyktor wrote. Conciliatory, measured, safe. I said everything I was supposed to say. The question is whether I meant any of it.',
        icon: '⚖',
      },
      'inaugural_unity': {
        title: 'Called for National Unity',
        category: 'personal',
        reflection: 'Jonas said I looked like a Chancellor for the first time. I think he meant it as a compliment. The crowd cheered. Crowds always cheer.',
        icon: '♥',
      },
      'inaugural_radical': {
        title: 'Delivered the Radical Vision Speech',
        category: 'reform',
        reflection: 'I burned every bridge before I crossed it. The Halvekists were stone-faced. The reformists were terrified. The workers cheered. I hope I can deliver what I promised.',
        icon: '✦',
      },
    },
  },

  {
    sceneId: 'act1_week3_economic_direction',
    choices: {
      'econ_free_market': {
        title: 'Chose a Free Market Economy',
        category: 'policy',
        reflection: 'Vostane\'s numbers were convincing. So was Vael\'s smile when he heard. The markets will grow, the investment will flow, and the workers will have to adapt. I hope adapting is not the same as suffering.',
        icon: '⚖',
      },
      'econ_planned': {
        title: 'Chose a Planned Economy',
        category: 'policy',
        reflection: 'Marić asked me to protect the workers. I did. Vostane looked at me like I had just set fire to her spreadsheets. The Arcturians withdrew their trade offer within the week. Worth it.',
        icon: '⚖',
      },
      'econ_mixed': {
        title: 'Chose a Mixed Economy',
        category: 'policy',
        reflection: 'Neither Vostane nor Marić got what they wanted. Both got something. Compromise is supposed to feel like this — unsatisfying and necessary.',
        icon: '⚖',
      },
      'econ_pragmatic': {
        title: 'Chose a Case-by-Case Economic Approach',
        category: 'policy',
        reflection: 'No ideology. No five-year plan. Just forty-three sectors and one Chancellor who has to decide each one. Vyktor says this will kill me. He may be right.',
        icon: '⚖',
      },
    },
  },

  {
    sceneId: 'act1_week5_bni_crisis',
    choices: {
      'bni_watchtower_preserve_secret': {
        title: 'Preserved the Watchtower Program Secretly',
        category: 'policy',
        reflection: 'Dusek told me the protocols were necessary. I believed her. I still believe her. But a secret program run by a security service I do not fully control is exactly how Halvek started. The difference is that I know it.',
        icon: '⚖',
      },
      'bni_abolish_immediately': {
        title: 'Abolished the Bureau of National Intelligence',
        category: 'reform',
        reflection: 'Father would have wanted this. Dusek\'s face when I told her — she looked at me like I had just handed the keys to Tyvaren. She may be right. But the BNI was a cancer. You do not treat cancer gradually.',
        icon: '✦',
      },
      'bni_reform_restructure': {
        title: 'Reformed the BNI into the BCA',
        category: 'policy',
        reflection: 'A compromise. I kept the intelligence capability and changed the oversight. Maren Tovik now runs what used to be Halvek\'s secret police. The irony is not subtle.',
        icon: '⚖',
      },
    },
  },

  {
    sceneId: 'act1_week9_soren_immunity',
    choices: {
      'soren_immunity_revoke': {
        title: 'Included Accountability Provision in Draft',
        category: 'reform',
        reflection: 'Theron\'s eyes lit up when I said yes. Thirty years he has waited for someone to say yes. Soren killed my father. This provision is the first step toward making that matter.',
        icon: '✦',
      },
      'soren_immunity_preserve': {
        title: 'Preserved Soren\'s Constitutional Immunity',
        category: 'policy',
        reflection: 'The peace that made my government possible also protects the man who may have ordered my father\'s death. That contradiction is the architecture of this Chancellorship.',
        icon: '⚖',
      },
    },
  },

  {
    sceneId: 'act1_ssd_create_directorate',
    choices: {
      'ssd_create_directorate': {
        title: 'Established the State Security Directorate',
        category: 'policy',
        reflection: 'Created a new security service to replace the one I abolished. Viktor Dorne now has a desk and a mandate that is deliberately vague. He asked what I needed done. I should have been more specific.',
        icon: '⚖',
      },
      'ssd_reject_expansion': {
        title: 'Refused to Create a New Security Service',
        category: 'reform',
        reflection: 'I will not replace one secret police with another. If that means we are slower to respond to threats, then we will be slower. Democracy is slower. That is the entire point.',
        icon: '✦',
      },
    },
  },

  {
    sceneId: 'act1_kolvar_opposition',
    choices: {
      'kolvar_engage_parliament': {
        title: 'Engaged Kolvar Through Parliamentary Process',
        category: 'policy',
        reflection: 'Kolvar smiled when I agreed to regular consultations. I do not trust that smile. But I trust the Assembly more than I trust my own instincts about which enemies to destroy.',
        icon: '⚖',
      },
      'kolvar_negotiate_backchannel': {
        title: 'Opened Backchannel with Kolvar',
        category: 'diplomacy',
        reflection: 'Vyktor arranged a meeting in a tea house. Kolvar arrived alone. I arrived alone. Two hours. We agreed on nothing except that we both want Veltria to survive. For now, that is enough.',
        icon: '◇',
      },
      'kolvar_public_confrontation': {
        title: 'Confronted Kolvar Publicly',
        category: 'crisis',
        reflection: 'I called him a relic in front of the entire Assembly. The Herald ran the headline. The gallery erupted. I won the chamber and may have lost the war.',
        icon: '!',
      },
    },
  },

  {
    sceneId: 'act1_no_confidence_vote',
    choices: {
      'no_confidence_fight_reformist': {
        title: 'Defeated No-Confidence with Reformist Coalition',
        category: 'crisis',
        reflection: 'Eleven votes. That was the margin. Eleven votes between governing and disgrace. I will not forget who voted with me — or who did not. The ledger is in my memory.',
        icon: '!',
      },
      'no_confidence_deal_with_workers': {
        title: 'Sided with Workers to Survive No-Confidence',
        category: 'crisis',
        reflection: 'Soraya Khaled saved my government. Her price was a labor bill that will cost business millions. Gregor called it justice. He may be the only one who is right.',
        icon: '!',
      },
      'no_confidence_executive_power': {
        title: 'Used Executive Powers to Survive',
        category: 'crisis',
        reflection: 'I instructed the Speaker the motion was defective. It was not. Everyone knew. Theron looked at me differently after that meeting. I deserved it.',
        icon: '!',
      },
    },
  },

  {
    sceneId: 'act1_vael_investment',
    choices: {
      'vael_accept_investment': {
        title: 'Accepted Vael\'s Investment Offer',
        category: 'policy',
        reflection: 'I told myself it was pragmatic. Jonas would call it corruption. I did not tell Jonas. Vael\'s handshake felt like signing a contract I had not read.',
        icon: '⚖',
      },
      'vael_reject_investment': {
        title: 'Rejected Vael\'s Offer',
        category: 'reform',
        reflection: 'He smiled when I said no. A man who smiles at rejection has other options. I need to find out what they are before he uses them.',
        icon: '✦',
      },
    },
  },

  {
    sceneId: 'act1_dravenni_language',
    choices: {
      'dravenni_language_recognition': {
        title: 'Granted Official Status to Dravenni Language',
        category: 'reform',
        reflection: 'The Dravenni caucus wept in the chamber. Actual tears. For a language. For a people told for fifty years their words did not count. They count now.',
        icon: '✦',
      },
      'dravenni_status_quo': {
        title: 'Deferred the Dravenni Question',
        category: 'policy',
        reflection: 'Idris Kaelen\'s disappointment was quiet and thorough. He has been disappointed before. He has learned to wait. I do not know how much longer he will.',
        icon: '⚖',
      },
    },
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // ACT 2 — CONSOLIDATION
  // ══════════════════════════════════════════════════════════════════════════════

  {
    sceneId: 'act2_week15_theron_compromise',
    choices: {
      'theron_compromise_accept': {
        title: 'Accepted Theron\'s Constitutional Compromise',
        category: 'reform',
        reflection: 'Theron offered to narrow two provisions to bring in the missing votes. He called it pragmatism. He looked like a man swallowing something bitter.',
        icon: '✦',
      },
    },
  },

  {
    sceneId: 'act2_week17_soren_debate',
    choices: {
      'soren_debate_push_through': {
        title: 'Pushed Accountability Through Despite Walkout',
        category: 'crisis',
        reflection: 'The Halvekists walked out. Kolvar called it betrayal. The provision passed. Gavril Soren is no longer immune. My father\'s name was not spoken — but it was in the room.',
        icon: '!',
      },
      'soren_debate_compromise': {
        title: 'Passed a Compromised Provision',
        category: 'policy',
        reflection: 'Limited to acts of violence only. Soren can be investigated for the executions but not his administrative role. Half-justice. Half-justice is better than none. I think.',
        icon: '⚖',
      },
      'soren_debate_withdraw_provision': {
        title: 'Withdrew the Provision to Save the Convention',
        category: 'policy',
        reflection: 'I traded Soren\'s accountability for the Halvekists\' participation. The constitution will be broadly supported. Soren remains protected. The Dravenni caucus did not applaud.',
        icon: '⚖',
      },
    },
  },

  {
    sceneId: 'act2_week25_brenner_warning',
    choices: {
      'brenner_reassure_constitution': {
        title: 'Reassured Brenner About the Provision\'s Scope',
        category: 'policy',
        reflection: 'I gave Brenner my word the military is not on trial. He took it. I hope he meant it. The officer corps is uneasy but contained. For now.',
        icon: '⚖',
      },
      'brenner_stand_firm': {
        title: 'Stood Firm Against Military Pressure',
        category: 'crisis',
        reflection: 'Brenner did not threaten me directly. He did not need to. Touch Soren, risk the military\'s loyalty. I touched Soren anyway. Sometimes the right thing is also the dangerous one.',
        icon: '!',
      },
    },
  },

  {
    sceneId: 'act2_referendum_result',
    choices: {
      'referendum_decisive_reach_out': {
        title: 'Reached Across the Aisle After Victory',
        category: 'reform',
        reflection: 'Fifty-eight percent. A mandate. Instead of claiming it alone, I invited Kolvar to the palace. His surprise was genuine. His suspicion was also genuine.',
        icon: '✦',
      },
      'referendum_decisive_mandate_claim': {
        title: 'Claimed a Governing Mandate',
        category: 'policy',
        reflection: 'The people spoke. Decisively. I will govern with the authority they gave me. The Halvekists had their turn. Now it is ours. That is how democracy works.',
        icon: '⚖',
      },
    },
  },

  {
    sceneId: 'act2_constitution_sign',
    choices: {
      'constitution_abolish_emergency_powers': {
        title: 'Removed Emergency Powers from Constitution',
        category: 'reform',
        reflection: 'Article 47 is gone. The clause Halvek used to suspend liberty for twenty-six years — erased with one pen stroke. Theron wept. I nearly did.',
        icon: '✦',
      },
      'constitution_retain_emergency_powers': {
        title: 'Retained Emergency Powers',
        category: 'policy',
        reflection: 'I kept them — reformed, renamed, restricted. Theron argued for three hours. I told him I needed the option. I hope I never use it. I hope I never need to hope that.',
        icon: '⚖',
      },
    },
  },

  {
    sceneId: 'act2_labor_worker_safety_act',
    choices: {
      'labor_sign_worker_safety_act': {
        title: 'Signed the Worker Safety Act',
        category: 'legislation',
        reflection: 'Gregor wept. A foundry foreman who has seen men lose limbs — and a safety bill made him weep. His father died in a collapse when Gregor was twelve. This bill will not bring him back. It will save someone else\'s.',
        icon: '§',
      },
      'labor_veto_worker_safety_act': {
        title: 'Vetoed the Worker Safety Act',
        category: 'legislation',
        reflection: 'The business delegation said it would cost too much. Elara agreed. I vetoed a bill that would have saved lives because the numbers did not work. I am supposed to make the numbers work.',
        icon: '§',
      },
    },
  },

  {
    sceneId: 'act2_press_freedom_nadia',
    choices: {
      'press_protect_nadia_voss': {
        title: 'Protected Journalist Nadia Voss',
        category: 'reform',
        reflection: 'The SSD wanted to surveil her. I refused. She will publish stories that damage me. That is the price of a free press. I am willing to pay it. I think.',
        icon: '✦',
      },
      'press_restrict_media': {
        title: 'Imposed Media Restrictions',
        category: 'policy',
        reflection: 'Elena called it an \'understanding.\' I called it national security. The Herald will not run certain stories. The Standard will. The inequality is the point.',
        icon: '⚖',
      },
    },
  },

  {
    sceneId: 'act2_family_jonas_confrontation',
    choices: {
      'family_jonas_confront': {
        title: 'Confronted the Distance with Jonas',
        category: 'personal',
        reflection: 'He showed me the list. Seventeen events I had missed. He was not angry. He was documenting. That was worse. I cannot govern a country and my marriage simultaneously. I am failing at one of them.',
        icon: '♥',
      },
    },
  },

  {
    sceneId: 'act2_family_liora_graduation',
    choices: {
      'family_attend_liora_graduation': {
        title: 'Attended Liora\'s University Graduation',
        category: 'personal',
        reflection: 'She looked for me in the crowd. I was there, in the back row, pretending to be a relative. She smiled. It was the first time in months she looked at me like her mother instead of the Chancellor.',
        icon: '♥',
      },
      'family_miss_graduation': {
        title: 'Missed Liora\'s Graduation',
        category: 'personal',
        reflection: 'I was in a meeting about trade tariffs. Jonas called. Liora would not speak to me. The tariffs got resolved. The distance between me and my daughter did not.',
        icon: '♥',
      },
    },
  },

  {
    sceneId: 'act2_family_tomas_support',
    choices: {
      'family_support_tomas': {
        title: 'Reached Out to Tomas',
        category: 'personal',
        reflection: 'He eats dinner in his room. Answers questions with single words. I am losing my son to the Chancellorship and I do not know how to get him back. I tried today. He let me sit with him. That is progress.',
        icon: '♥',
      },
    },
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // ACT 3 — THE FURNACE
  // ══════════════════════════════════════════════════════════════════════════════

  {
    sceneId: 'act3_economic_crisis_ima',
    choices: {
      'economy_accept_ima_bailout': {
        title: 'Accepted IMA Bailout Conditions',
        category: 'crisis',
        reflection: 'I took the money. The conditions are brutal — austerity that will hurt the poorest first. The alternative was default. I chose survival. History may not forgive me. The bond markets already have.',
        icon: '!',
      },
      'economy_reject_ima_bailout': {
        title: 'Rejected IMA Bailout',
        category: 'crisis',
        reflection: 'The IMA envoy looked at me like I had set fire to the Krone. The markets dropped fourteen percent in three days. But no foreign institution dictates Veltrian policy while I am Chancellor.',
        icon: '!',
      },
    },
  },

  {
    sceneId: 'act3_vyktor_betrayal',
    choices: {
      'betrayal_vyktor_dismiss': {
        title: 'Dismissed Vyktor Reznik',
        category: 'crisis',
        reflection: 'Twenty-two years. Dismissed in twenty minutes. He did not argue. He said \'I understand\' and walked out. The silence after the door closed was the loudest sound I have ever heard.',
        icon: '!',
      },
      'betrayal_vyktor_ask_why': {
        title: 'Asked Vyktor Why He Did It',
        category: 'personal',
        reflection: 'He told me about 1948. About the colleague arrested and never returned. About choosing compliance over resistance because resistance meant orphaned children. I did not forgive. But I understood.',
        icon: '♥',
      },
      'betrayal_vyktor_use_leverage': {
        title: 'Used Vyktor\'s Past as Leverage',
        category: 'policy',
        reflection: 'I kept him. Not because I forgave — because I needed him. A Vyktor who owes me his career is more useful than a Vyktor I have exiled. We both know it. We pretend we do not.',
        icon: '⚖',
      },
    },
  },

  {
    sceneId: 'act3_tyvaren_ultimatum',
    choices: {
      'tyvaren_negotiate_vukov': {
        title: 'Negotiated with Marshal Vukov',
        category: 'diplomacy',
        reflection: 'Sat across a table from a man who has threatened to invade my country. He offered terms designed to be refused. I refused them. But we talked. War is harder to start when you have looked your enemy in the eye.',
        icon: '◇',
      },
      'tyvaren_refuse_negotiation': {
        title: 'Refused to Negotiate with Tyvaren',
        category: 'diplomacy',
        reflection: 'I will not sit at a table with a man who positions artillery on my border and calls it diplomacy. Withdraw first. Then we talk. He will not withdraw. So we will not talk.',
        icon: '◇',
      },
      'tyvaren_mobilize_response': {
        title: 'Mobilized Forces Against Tyvaren',
        category: 'crisis',
        reflection: 'I gave the order at 3 AM. Eastern Command at full readiness. Forty thousand soldiers looking across the Pass at forty thousand Tyvaren soldiers. The next move is Vukov\'s. I hope he does not make it.',
        icon: '!',
      },
    },
  },

  {
    sceneId: 'act3_dravenhollow_crisis',
    choices: {
      'dravenhollow_negotiate_dlf': {
        title: 'Negotiated with Dravenni Liberation Front',
        category: 'diplomacy',
        reflection: 'I met with the people my predecessor called terrorists. They called themselves freedom fighters. Six hours. We did not agree on everything. We agreed on enough.',
        icon: '◇',
      },
      'dravenhollow_military_response': {
        title: 'Sent Troops into Dravenhollow',
        category: 'crisis',
        reflection: 'Troops in my own capital. The DLF attacked a police station. We responded. The neighborhood is secured. The resentment is not. Every soldier deployed is a diplomat that failed.',
        icon: '!',
      },
    },
  },

  {
    sceneId: 'act3_nadia_voss_investigation',
    choices: {
      'nadia_voss_cooperate': {
        title: 'Cooperated with Nadia Voss\'s Investigation',
        category: 'reform',
        reflection: 'I opened the files. All of them. She will publish stories that damage this government. She asked if I was sure. I said democracy is not about only revealing the truths that make you look good.',
        icon: '✦',
      },
      'nadia_voss_obstruct': {
        title: 'Obstructed the Press Investigation',
        category: 'policy',
        reflection: 'I classified the documents. National security. The grounds were thin. Nadia knew. The public will not know what they are not told. I traded transparency for stability. The ledger is uneven.',
        icon: '⚖',
      },
    },
  },

  {
    sceneId: 'act3_week33_soren_files',
    choices: {
      'soren_files_acknowledge_personal': {
        title: 'Discovered Soren Signed Father\'s Execution Order',
        category: 'personal',
        reflection: 'He signed the paper. One signature, and my father was dead. I held the document in my hands. His handwriting. His ink. Am I a Chancellor seeking justice, or a daughter seeking revenge? Does it matter?',
        icon: '♥',
      },
      'soren_files_seal_personal': {
        title: 'Temporarily Sealed the Execution Documents',
        category: 'personal',
        reflection: 'I could not look at my father\'s death warrant and make a rational choice. I asked for time. Theron looked disappointed. He does not understand what it feels like to hold the paper that ended your childhood.',
        icon: '♥',
      },
    },
  },

  {
    sceneId: 'act3_week37_coup_attempt',
    choices: {
      'coup_flee_stellamere': {
        title: 'Fled to Stellamere During the Coup',
        category: 'crisis',
        reflection: 'I ran. The Chancellor of Veltria ran. Dusek got me to the garrison while Brenner\'s forces took the palace. Alive and in exile are not the same thing.',
        icon: '!',
      },
      'coup_negotiate_brenner': {
        title: 'Negotiated with General Brenner',
        category: 'crisis',
        reflection: 'Seven hours with a man who tried to overthrow my government. He wanted amnesty and a cabinet post. I gave him retirement and a promise. Every word I said tasted like ash.',
        icon: '!',
      },
      'coup_call_loyal_forces': {
        title: 'Called Loyal Forces to Counter the Coup',
        category: 'crisis',
        reflection: 'Dusek rallied the 4th Rifle Division. They marched on the palace. Brenner\'s men stood down. The coup collapsed in four hours. Veltrian soldiers aimed weapons at Veltrian soldiers. I will never unsee that.',
        icon: '!',
      },
      'coup_confront_directly': {
        title: 'Confronted the Coup Leaders Alone',
        category: 'crisis',
        reflection: 'I walked in unarmed. No guards. Just the certainty that shooting an unarmed woman would make them murderers, not patriots. They lowered their weapons. Some apologized. Some wept.',
        icon: '!',
      },
    },
  },

  {
    sceneId: 'act3_week38_soren_trial',
    choices: {
      'soren_trial_public': {
        title: 'Ordered Soren\'s Arrest and Public Trial',
        category: 'reform',
        reflection: 'The order went out at dawn. By noon he was in custody. Brenner warned me about the military. I heard him. I made my choice. My father\'s name will be spoken in that courtroom. That is enough.',
        icon: '✦',
      },
      'soren_trial_plea_deal': {
        title: 'Offered Soren a Private Plea Deal',
        category: 'policy',
        reflection: 'He confessed over tea in his study. No cameras. No spectacle. The truth is recorded. The nation is spared the trauma of a public trial. Justice, but quiet. I do not know if those two words belong together.',
        icon: '⚖',
      },
      'soren_trial_leave_alone': {
        title: 'Chose Not to Prosecute Soren',
        category: 'policy',
        reflection: 'I let him go. The peace agreement stands. The nation does not confront its past. The Dravenni will not forgive this. But the military will not revolt. I chose safe. Safe is not the same as right.',
        icon: '⚖',
      },
      'soren_trial_release_files': {
        title: 'Released Soren Files to the Public',
        category: 'reform',
        reflection: 'Every document. Every order. Every signature. The press has them. Soren is not arrested but his name is ash. I did not punish him. I let the truth do it. The truth is a more vicious prosecutor than any court.',
        icon: '✦',
      },
      'soren_trial_leverage': {
        title: 'Used Prosecution Threat as Political Leverage',
        category: 'policy',
        reflection: 'He smiled when he agreed. The smile of a man who recognized the game — because he invented it. Soren endorsed my government. I traded justice for power. The trade worked. I hate myself for making it.',
        icon: '⚖',
      },
    },
  },

  {
    sceneId: 'act3_assassination_bombing',
    choices: {
      'bombing_go_to_cabinet': {
        title: 'Survived the Ministry Bombing — Serida Died Saving Me',
        category: 'crisis',
        reflection: 'Serida pulled me from the rubble with broken ribs and then the second device went off. She asked if I was safe. Those were her last words. Mila is seven. She draws sunflowers. What do I tell her?',
        icon: '!',
      },
    },
  },

  {
    sceneId: 'act3_assassination_sniper',
    choices: {
      'sniper_go_to_cabinet': {
        title: 'Survived the Parade Shooting — Serida Wounded',
        category: 'crisis',
        reflection: 'She pushed me. Didn\'t think — saw the muzzle flash and pushed me. A schoolteacher who signed up to manage my calendar took a bullet meant for my head. She is alive. I do not know if she will walk again.',
        icon: '!',
      },
    },
  },

  {
    sceneId: 'act3_assassination_poisoning',
    choices: {
      'poisoning_go_to_cabinet': {
        title: 'Survived Poisoning at Diplomatic Dinner',
        category: 'crisis',
        reflection: 'Three spoonfuls of soup saved my life. Thirty-six hours unconscious. Someone tried to murder me with appetizers at a diplomatic function. The absurdity almost makes it funny. Almost.',
        icon: '!',
      },
    },
  },

  {
    sceneId: 'act3_assassination_cabinet',
    choices: {
      'cabinet_declare_emergency': {
        title: 'Declared State of Emergency',
        category: 'crisis',
        reflection: 'I invoked Article 47 — the same emergency powers Halvek used. Dusek deployed troops domestically. I told myself it was temporary. Every dictator tells themselves that. I hope I am not becoming what I fought.',
        icon: '!',
      },
      'cabinet_legal_channels': {
        title: 'Responded Through Legal Channels',
        category: 'reform',
        reflection: 'No emergency. No suspension of rights. I directed the courts to handle it. The public feels unsafe. The Assembly is chaotic. But Veltria remains a democracy. That is the answer they tried to destroy.',
        icon: '✦',
      },
      'cabinet_rally_nation': {
        title: 'Rallied the Nation After the Attack',
        category: 'personal',
        reflection: 'I stood on the steps where they shot at me and told Veltria I was not afraid. The Herald called it my finest moment. My hands were shaking. The crowd could not see them.',
        icon: '♥',
      },
      'cabinet_blame_tyvaren': {
        title: 'Blamed Tyvaren for the Attack',
        category: 'diplomacy',
        reflection: 'I accused Vukov without proof. The evidence is ambiguous. The accusation is not. If I am right, I have started a diplomatic crisis. If I am wrong, I have started one based on a lie.',
        icon: '◇',
      },
    },
  },

  {
    sceneId: 'act3_soe_extension_crisis',
    choices: {
      'soe_extend_powers': {
        title: 'Extended the State of Emergency',
        category: 'policy',
        reflection: 'Ninety more days. The Assembly granted it. Theron warned me about this — the gradual normalization. I did not listen. The emergency is becoming permanent, and I am the reason.',
        icon: '⚖',
      },
      'soe_let_expire': {
        title: 'Let the Emergency Expire',
        category: 'reform',
        reflection: 'Midnight came and the powers expired. The troops returned to barracks. I proved I am not what I feared I was becoming. The attack did not make me a dictator. I made sure of that.',
        icon: '✦',
      },
    },
  },

  {
    sceneId: 'act3_soe_opposition_protests',
    choices: {
      'soe_allow_protests': {
        title: 'Allowed Protests Against the Emergency',
        category: 'reform',
        reflection: 'Fifteen thousand people in Unity Square — my own voters, protesting my emergency. I let them. The democracy I claimed to be protecting was being exercised against me. That is exactly how democracy works.',
        icon: '✦',
      },
      'soe_suppress_protests': {
        title: 'Suppressed Protests Against the Emergency',
        category: 'crisis',
        reflection: 'Water cannons. No one died. But the image of police breaking up a peaceful protest will define this government. I crossed a line. I do not know if I can cross back.',
        icon: '!',
      },
    },
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // ACT 4 — ENDGAME
  // ══════════════════════════════════════════════════════════════════════════════

  {
    sceneId: 'act4_emergency_powers_invoked',
    choices: {
      'emergency_powers_narrow': {
        title: 'Invoked Narrow Emergency Powers',
        category: 'policy',
        reflection: 'Minimum authority, limited scope, Assembly oversight. Theron drafted the framework himself. The reformers are uneasy. The military is contemptuous. I am doing what I must — and hating that phrase.',
        icon: '⚖',
      },
      'emergency_powers_broad': {
        title: 'Invoked Broad Emergency Powers',
        category: 'crisis',
        reflection: 'Decree powers. Military deployment. Press restrictions. Detention without charge. Halvek\'s emergency provisions, used by the woman elected to abolish them. I know what I have become.',
        icon: '!',
      },
      'emergency_powers_refuse': {
        title: 'Refused Emergency Powers Entirely',
        category: 'reform',
        reflection: 'I put the pen down. I will not govern by decree — not even to save my government. If the Republic falls because I refused dictatorship, it was already lost.',
        icon: '✦',
      },
    },
  },

  {
    sceneId: 'act4_impeachment_proceedings',
    choices: {
      'impeachment_fight': {
        title: 'Fought the Impeachment Articles',
        category: 'crisis',
        reflection: 'Three hours. Defending every decision. Corrosive, exhausting, necessary. The articles are baseless — but defending against them forces me to justify decisions that should speak for themselves.',
        icon: '!',
      },
      'impeachment_resign': {
        title: 'Resigned in Face of Impeachment',
        category: 'personal',
        reflection: 'Wrote the letter at 2 AM. Jonas was asleep. I did not wake him. My government. My failure. My signature. The Republic will survive me. That is the only consolation.',
        icon: '♥',
      },
      'impeachment_declare_emergency': {
        title: 'Declared Emergency to Survive Impeachment',
        category: 'crisis',
        reflection: 'Dissolved the Assembly. Invoked Article 47. The vote never happened because there is no Assembly to hold it. I saved my government. I also ended any pretense of democracy.',
        icon: '!',
      },
    },
  },

  {
    sceneId: 'act4_war_declaration',
    choices: {
      'war_declare_tyvaren': {
        title: 'Declared War on Tyvaren',
        category: 'crisis',
        reflection: 'Signed at sunrise. Dusek was already mobilizing. Forty thousand soldiers moving toward a border that will become a graveyard. I sent them. Every condolence letter will have my signature.',
        icon: '!',
      },
      'war_pursue_peace': {
        title: 'Pursued Peace at Any Cost',
        category: 'diplomacy',
        reflection: 'The terms are humiliating. Territorial concessions. Demilitarization. Reparations. I accepted because the alternative was a war we could not win. I saved lives. I surrendered pride. History will argue which mattered.',
        icon: '◇',
      },
      'war_orythian_alliance': {
        title: 'Secured Orythian Military Alliance',
        category: 'diplomacy',
        reflection: 'Orythian bases on Veltrian soil for twenty years. The price of survival. I traded sovereignty for security. The trade may be worth it. The people whose land the bases are on may disagree.',
        icon: '◇',
      },
    },
  },

  {
    sceneId: 'act4_all_fronts_crisis',
    choices: {
      'all_fronts_military_priority': {
        title: 'Prioritized Military Response',
        category: 'crisis',
        reflection: 'Everything else waits. Economy, diplomacy, reform — all of it. A country that cannot defend itself has no other problems. I hope the economy survives the waiting.',
        icon: '!',
      },
      'all_fronts_rotate_attention': {
        title: 'Rotated Attention Across All Crises',
        category: 'policy',
        reflection: 'Morning: military. Midday: economy. Afternoon: diplomacy. Evening: reform. I am doing everything and nothing well. The alternative is to let something collapse entirely.',
        icon: '⚖',
      },
      'all_fronts_lean_on_trusted': {
        title: 'Delegated to Trusted Advisors',
        category: 'personal',
        reflection: 'Vyktor runs domestic. Dusek runs defense. Elara runs economy. I trust them. I have to. The Chancellorship is too large for one person. Admitting that is either wisdom or surrender.',
        icon: '♥',
      },
    },
  },

  {
    sceneId: 'act4_mole_confrontation',
    choices: {
      'mole_accuse_petrin': {
        title: 'Accused Counselor Petrin Half',
        category: 'crisis',
        reflection: 'The Foreign Ministry official. Five-year Tyvaren mole. If I am right, the leak stops. If I am wrong, I destroy a diplomat\'s career and the real spy continues. The evidence said Petrin. Evidence can lie.',
        icon: '!',
      },
      'mole_accuse_dusek': {
        title: 'Accused Colonel Irina Dusek',
        category: 'crisis',
        reflection: 'My Defense Minister. The woman I trusted with every military secret. If she is the mole, the betrayal is the worst possible kind. If she is not, I have accused my most loyal officer of treason.',
        icon: '!',
      },
      'mole_accuse_volek': {
        title: 'Accused Karsten Volek',
        category: 'crisis',
        reflection: 'The document clerk. Access to everything, noticed by no one. The logical choice. The evidence points to him. The evidence pointed to the wrong man in three other cases this year.',
        icon: '!',
      },
    },
  },

  {
    sceneId: 'act4_soren_trial_aftermath',
    choices: {
      'soren_aftermath_reconciliation': {
        title: 'Established Truth and Reconciliation Commission',
        category: 'reform',
        reflection: 'The trial is over. Soren is in prison. But punishment is not enough. The Commission will document every crime, every victim. Veltria will remember. That is how we ensure this never happens again.',
        icon: '✦',
      },
      'soren_aftermath_prosecute_further': {
        title: 'Authorized Full Prosecutions of Halvek Inner Circle',
        category: 'reform',
        reflection: 'Soren was the first. Not the last. Every surviving member will face justice. Some call it a purge. I call it accountability. The distinction depends on which side of the dock you sit on.',
        icon: '✦',
      },
    },
  },

  {
    sceneId: 'act4_week52_ending',
    choices: {
      'ending_democratic_triumph': {
        title: 'Achieved Democratic Triumph',
        category: 'reform',
        reflection: 'The constitution is signed. The emergency is over. Veltria survived its transition. My father\'s name is in the founding documents — his execution recorded as a crime. He would have wanted this.',
        icon: '✦',
      },
      'ending_benevolent_autocrat': {
        title: 'Became a Benevolent Autocrat',
        category: 'policy',
        reflection: 'I rule by decree. The Assembly meets but does not decide. The Republic is stable. The people are safe. The question I ask every night is whether stability bought with liberty is still stability.',
        icon: '⚖',
      },
      'ending_war_victory': {
        title: 'Led Veltria to Victory',
        category: 'crisis',
        reflection: 'We won. Twelve thousand dead. The Gravenmark Pass is ours. Victory feels like relief more than triumph. Victory parades do not mention the dead. I will.',
        icon: '!',
      },
      'ending_war_defeat': {
        title: 'Presided Over Military Defeat',
        category: 'crisis',
        reflection: 'The armistice was signed in a tent. The Tyvaren general was gracious. I was not. The terms are catastrophic. I will be remembered as the Chancellor who lost the war. The history books will not mention it was unwinnable.',
        icon: '!',
      },
      'ending_family_sacrifice': {
        title: 'Chose Family Over Power',
        category: 'personal',
        reflection: 'I resigned. Not because I was forced — because I chose. Jonas. Liora. Tomas. They need me more than Veltria does. The Republic will find another leader. My family will not find another mother.',
        icon: '♥',
      },
      'ending_economic_collapse': {
        title: 'Presided Over Economic Collapse',
        category: 'crisis',
        reflection: 'The Krone is worthless. Factories closed. People hungry. I inherited a broken economy and could not fix it. Historians will debate my policies. The families in bread lines will not.',
        icon: '!',
      },
    },
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // SERIDA SCENES
  // ══════════════════════════════════════════════════════════════════════════════

  {
    sceneId: 'act1_serida_introduction',
    choices: {
      'serida_intro_warm': {
        title: 'Welcomed Serida Warmly',
        category: 'personal',
        reflection: 'She was nervous. A schoolteacher from Kravenstal, standing in a palace, trying not to look overwhelmed. I asked about her daughter. Her face changed. That is what remembering your humanity looks like.',
        icon: '♥',
      },
      'serida_intro_professional': {
        title: 'Kept It Professional with Serida',
        category: 'personal',
        reflection: 'Efficient, brief, professional. She will do her job. I will do mine. But I saw her face fall slightly when I did not ask about her family. I noticed. I did not act on it.',
        icon: '♥',
      },
    },
  },

  {
    sceneId: 'act1_serida_school_funding',
    choices: {
      'serida_school_listen': {
        title: 'Listened to Serida About School Cuts',
        category: 'personal',
        reflection: 'Mila\'s library closes on Fridays. When I sign a budget that cuts education, I am signing Mila\'s library hours. Serida is the only person in this building who will tell me that. I need her to keep telling me.',
        icon: '♥',
      },
      'serida_school_dismissed': {
        title: 'Dismissed Serida\'s Concern About Schools',
        category: 'personal',
        reflection: 'I told her the budget was the budget. Her face fell. She said she understood. She did not understand. She was hurt. I saw it and I moved on. That is what this job does to you.',
        icon: '♥',
      },
    },
  },

  {
    sceneId: 'act2_serida_tomas_factory',
    choices: {
      'serida_factory_gratitude': {
        title: 'Celebrated with Serida About Factory Modernization',
        category: 'personal',
        reflection: 'Tomas said it was the first time the government built something FOR him instead of taking something FROM him. Sixteen years in that foundry. Sixteen years waiting. This is why I ran.',
        icon: '♥',
      },
    },
  },

  {
    sceneId: 'act3_serida_misses_play',
    choices: {
      'serida_play_empathize': {
        title: 'Sent Serida Home to Watch the Play Recording',
        category: 'personal',
        reflection: 'Mila was the sunflower. I told Serida to go home and watch the recording with her. Tomas, Liora — I know what it costs. I will not let this job take the same toll on Serida that it has taken on my family.',
        icon: '♥',
      },
      'serida_play_business': {
        title: 'Told Serida This Is the Job',
        category: 'personal',
        reflection: 'I told her we both miss things. We do. That does not make it better. Telling her it was the job — that was me talking. Not the Chancellor. Not the mother. Just someone who has gotten too good at excusing absence.',
        icon: '♥',
      },
    },
  },

  {
    sceneId: 'act3_serida_refugee_neighborhood',
    choices: {
      'serida_refugees_kind': {
        title: 'Praised Serida\'s Family for Helping Refugees',
        category: 'personal',
        reflection: 'Mila taught a refugee girl to draw sunflowers. Tomas helped carry furniture. Serida asked if she was allowed to feel both welcoming and frightened. I told her that being two things at once is what it means to be human.',
        icon: '♥',
      },
    },
  },

  {
    sceneId: 'act4_serida_epilogue',
    choices: {
      'serida_epilogue_positive': {
        title: 'Said Goodbye to Serida',
        category: 'personal',
        reflection: 'She gave me Mila\'s drawing — the palace with towers, drawn when she was seven. Twelve now. Serida said one family in Kravenstal remembers me as the person who saw them. Whatever the history books say, I have that.',
        icon: '♥',
      },
    },
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // JONAS SCENES
  // ══════════════════════════════════════════════════════════════════════════════

  {
    sceneId: 'act2_jonas_op_ed',
    choices: {
      'jonas_op_ed_supported': {
        title: 'Supported Jonas\'s Op-Ed',
        category: 'personal',
        reflection: 'He wrote about what we tear down. About buildings and people and the relationship between them. The Herald published it. Other papers want to reprint. My husband has a public voice. I am proud. I am also a little terrified.',
        icon: '♥',
      },
      'jonas_op_ed_disagreed': {
        title: 'Disagreed with Jonas\'s Op-Ed',
        category: 'personal',
        reflection: 'I told him the urban renewal plan was Assembly-approved. He said that did not make it right. We argued about politics at the kitchen table for the first time. It will not be the last.',
        icon: '♥',
      },
    },
  },

  {
    sceneId: 'act4_jonas_foreign_offer',
    choices: {
      'jonas_offer_let_go': {
        title: 'Let Jonas Take the Foreign Position',
        category: 'personal',
        reflection: 'Lytheira. Lead architect. Triple salary. He spent twenty years designing housing that was never built because the money went to weapons. This is his chance. I love him too much to ask him to stay. I told him that.',
        icon: '♥',
      },
      'jonas_offer_ask_stay': {
        title: 'Asked Jonas to Stay for Veltria',
        category: 'personal',
        reflection: 'I asked him to stay — not for me, for the country. Veltria needs architects who care about public housing. He stayed. I do not know if he stayed for Veltria or for me. I am afraid to ask.',
        icon: '♥',
      },
    },
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // ECONOMIC CASCADE SCENES
  // ══════════════════════════════════════════════════════════════════════════════

  {
    sceneId: 'act2_econ_vael_approach',
    choices: {
      'vael_accept_partnership': {
        title: 'Accepted Vael\'s Consortium Partnership',
        category: 'policy',
        reflection: 'Eighty million in foreign investment. Arcturian technology. Vael\'s handshake and his conditions. I told myself it was pragmatic. Every time I tell myself that, something gets a little cheaper.',
        icon: '⚖',
      },
      'vael_reject_partnership': {
        title: 'Rejected Vael\'s Consortium',
        category: 'reform',
        reflection: 'I told him the bidding process would be open to all. His smile did not waver. Vael does not lose — he waits. I have made an enemy who smiles. Those are the most dangerous kind.',
        icon: '✦',
      },
    },
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // PROJECT CONTRACTOR SCENES
  // ══════════════════════════════════════════════════════════════════════════════

  {
    sceneId: 'project_contractor_steel',
    choices: {
      'contractor_steel_state': {
        title: 'Gave Steel Contract to State Bureau',
        category: 'policy',
        reflection: 'State Construction Bureau. Slow, bureaucratic, Veltrian. The workers will build it. The workers will run it. Marić approved. Vostane sighed. Some things are worth the inefficiency.',
        icon: '⚖',
      },
      'contractor_steel_vael': {
        title: 'Gave Steel Contract to Vael Construction',
        category: 'policy',
        reflection: 'Vael\'s group. On schedule, high quality, twenty percent markup. He offered me a personal consideration afterward. I should have seen that coming. I did see it coming. I took the contract anyway.',
        icon: '⚖',
      },
      'contractor_steel_foreign': {
        title: 'Gave Steel Contract to Foreign Consortium',
        category: 'policy',
        reflection: 'Arcturian-Lytheirian consortium. Faster, better, but the profits leave the country. Our workers protested. I told them the technology transfer would benefit them eventually. Eventually is a long time when you are unemployed.',
        icon: '⚖',
      },
    },
  },

  {
    sceneId: 'project_mid_crisis_university',
    choices: {
      'uni_memorialize': {
        title: 'Created Memorial at Mass Grave Site',
        category: 'reform',
        reflection: 'The dead of 1947 will not be paved over. We are building a memorial where the library was going to be. Every student who walks past will know what was done here. That is how you build a nation that remembers.',
        icon: '✦',
      },
      'uni_continue_quietly': {
        title: 'Buried the Mass Grave Quietly',
        category: 'policy',
        reflection: 'Documented the remains. Gave them a proper burial. Continued construction. Nadia Voss will report what I chose. The headline will not be kind. I deserve the headline.',
        icon: '⚖',
      },
    },
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // JONAS FACTION REACTIONS
  // ══════════════════════════════════════════════════════════════════════════════

  {
    sceneId: 'act3_jonas_renek_concerns',
    choices: {
      'renek_jonas_private_citizen': {
        title: 'Told Renek Jonas Speaks for Himself',
        category: 'personal',
        reflection: 'The Archbishop is worried about my husband\'s progressive views. I told him Jonas is a private citizen. Renek\'s expression said he did not believe private citizens exist in the Chancellor\'s household. He is not wrong.',
        icon: '♥',
      },
      'renek_jonas_reassure': {
        title: 'Promised to Speak to Jonas About Church Concerns',
        category: 'personal',
        reflection: 'I told Renek I would ask Jonas to be more mindful. Then I went home and did not ask him. I told Renek what he wanted to hear. That is not governing. That is managing. Jonas would call it cowardice.',
        icon: '♥',
      },
    },
  },

  {
    sceneId: 'act3_jonas_kolvar_warning',
    choices: {
      'kolvar_jonas_defy': {
        title: 'Defied Kolvar\'s Demand to Control Jonas',
        category: 'personal',
        reflection: 'Kolvar told me to control my household. I told him my husband is not a political asset to be managed. I meant it. The Halvekists will attack me through my family. Let them. Jonas is worth more than their approval.',
        icon: '♥',
      },
    },
  },

  {
    sceneId: 'act3_jonas_soraya_approval',
    choices: {
      'soraya_jonas_humbled': {
        title: 'Accepted Soraya\'s Compliment About Jonas',
        category: 'personal',
        reflection: 'Soraya likes my husband more than she likes me. He asked workers about their ceilings. No politician has ever asked about their ceilings. I told Soraya I agree with her. Jonas is more honest than I am.',
        icon: '♥',
      },
    },
  },
]

export function getStructuredJournalTemplate(
  sceneId: string,
  choiceId: string,
): JournalEntryMeta | null {
  const scene = SCENE_JOURNAL_TEMPLATES.find(s => s.sceneId === sceneId)
  if (!scene) return null
  const choice = scene?.choices[choiceId]
  if (!choice) return null
  return {
    title: choice.title,
    description: `"${choice.reflection}"`,
    icon: choice.icon,
  }
}

export function getStructuredJournalCategory(
  sceneId: string,
  choiceId: string,
): JournalCategory | null {
  const scene = SCENE_JOURNAL_TEMPLATES.find(s => s.sceneId === sceneId)
  if (!scene) return null
  return scene.choices[choiceId]?.category ?? null
}
